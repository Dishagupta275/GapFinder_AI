import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeGaps } from "@/lib/gaps";
import { generateJSON } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

const WEIGHT = { weak: 3, untested: 2, medium: 2, strong: 0.5 } as const;

type Session = {
  topic: string;
  minutes: number;
  focus: string;
  status: string;
  sources: string[];
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const hours = Math.min(12, Math.max(0.5, Number(body.hours_per_day) || 2));
  const examDate: string | null = body.exam_date ? String(body.exam_date) : null;
  let nDays = 7;
  if (examDate) {
    const diff = Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000);
    if (Number.isFinite(diff)) nDays = Math.min(14, Math.max(1, diff));
  }

  const { gaps, attempts } = await computeGaps(supabase);
  if (!attempts.length)
    return NextResponse.json({ error: "Take the diagnostic quiz first." }, { status: 400 });

  // Time allocation: weak topics get the most time
  const totalMin = Math.round(nDays * hours * 60);
  const weightSum = gaps.reduce((s, g) => s + WEIGHT[g.status], 0);
  const alloc = gaps
    .map((g) => ({
      g,
      minutes: Math.max(10, Math.round((totalMin * WEIGHT[g.status]) / weightSum / 5) * 5),
    }))
    .sort((a, b) => WEIGHT[b.g.status] - WEIGHT[a.g.status]);

  // Retrieval: the student's own material linked to each topic
  const mats = await Promise.all(
    alloc.map((a) =>
      supabase.from("chunks").select("content,section_label").eq("topic_id", a.g.id).limit(3)
    )
  );

  // Generation: study focus written only from that material
  const blocks = alloc.map((a, i) => {
    const m = mats[i].data ?? [];
    return `### topic_id: ${a.g.id}
Name: ${a.g.name} | Status: ${a.g.status} (${a.g.correct}/${a.g.total})
Missed questions: ${a.g.missed.length ? a.g.missed.join(" | ") : "none"}
Material:
${m.map((c) => `(${c.section_label}) ${c.content.slice(0, 600)}`).join("\n") || "(no material linked)"}`;
  });

  const prompt = `You are building a revision plan. For EACH topic below write "focus": 2-3 short, concrete study actions in one string.
Rules: use ONLY the material given; target the concepts in the missed questions; for strong topics suggest a quick recap only. Return one item per topic using its exact topic_id.

${blocks.join("\n\n")}`;

  const focusById = new Map<string, string>();
  try {
    const out = await generateJSON<{ items: { topic_id: string; focus: string }[] }>(prompt, {
      type: "OBJECT",
      properties: {
        items: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: { topic_id: { type: "STRING" }, focus: { type: "STRING" } },
            required: ["topic_id", "focus"],
          },
        },
      },
      required: ["items"],
    });
    (out.items ?? []).forEach((it) => focusById.set(it.topic_id, it.focus));
  } catch {
    // fall back to generic focus text below
  }

  // Schedule: fill each day's time budget, highest priority first
  const cap = Math.round(hours * 60);
  const days: { day: number; sessions: Session[] }[] = Array.from({ length: nDays }, (_, i) => ({
    day: i + 1,
    sessions: [],
  }));
  let d = 0;
  let free = cap;
  alloc.forEach((a, i) => {
    let left = a.minutes;
    const sources = Array.from(new Set((mats[i].data ?? []).map((c) => c.section_label)));
    while (left > 0 && d < nDays) {
      const m = Math.min(left, free);
      if (m > 0) {
        days[d].sessions.push({
          topic: a.g.name,
          minutes: m,
          focus: focusById.get(a.g.id) ?? "Review this topic in your notes and redo the questions you missed.",
          status: a.g.status,
          sources,
        });
        left -= m;
        free -= m;
      }
      if (free <= 0) {
        d++;
        free = cap;
      }
    }
  });

  const plan = { days: days.filter((x) => x.sessions.length), nDays, hours };
  const { error } = await supabase.from("plans").insert({
    user_id: user.id,
    exam_date: examDate,
    hours_per_day: hours,
    plan,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
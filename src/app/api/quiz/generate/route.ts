import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embedTexts, generateJSON } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

type Hit = { id: string; content: string; section_label: string; kind: string };
type Ctx = { ref: string; chunkId: string; topicId: string };
type Gen = {
  questions: {
    chunk_ref: string;
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
  }[];
};

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: topics } = await supabase
    .from("topics")
    .select("id,name,description")
    .order("position")
    .limit(20);
  if (!topics?.length)
    return NextResponse.json({ error: "Generate the topic map first." }, { status: 400 });

  // ---- RETRIEVAL: best chunks per topic from the student's own material ----
  let embs: number[][];
  try {
    embs = await embedTexts(
      topics.map((t) => `${t.name}. ${t.description ?? ""}`),
      "RETRIEVAL_QUERY"
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const results = await Promise.all(
    topics.map((t, i) =>
      supabase.rpc("match_chunks", {
        query_embedding: `[${embs[i].join(",")}]`,
        match_count: 8,
        filter_topic: t.id,
      })
    )
  );

  const ctx: Ctx[] = [];
  const blocks: string[] = [];
  let k = 0;
  topics.forEach((t, i) => {
    const hits = (results[i].data ?? []) as Hit[];
    if (!hits.length) return;
    const notes = hits.filter((h) => h.kind !== "syllabus");
    const use = (notes.length ? notes : hits).slice(0, 3);
    const lines = use.map((h) => {
      const ref = `c${++k}`;
      ctx.push({ ref, chunkId: h.id, topicId: t.id });
      return `[${ref}] (${h.section_label}) ${h.content}`;
    });
    blocks.push(`### TOPIC: ${t.name}\n${lines.join("\n\n")}`);
  });
  if (!ctx.length)
    return NextResponse.json(
      { error: "No material is linked to your topics yet. Upload notes first." },
      { status: 400 }
    );

  // ---- GENERATION: model only sees retrieved text ----
  const perTopic = Math.min(3, Math.max(1, Math.floor(20 / blocks.length)));
  const prompt = `You write diagnostic quiz questions for a student using ONLY the study material below.
Rules:
- For each TOPIC write up to ${perTopic} multiple-choice questions.
- Every question must be answerable from ONE excerpt. Set chunk_ref to that excerpt's tag (for example "c3"). Never use outside knowledge.
- If the excerpts for a topic cannot support a good question, write fewer for it.
- Exactly 4 options, exactly one correct. Wrong options must be plausible. correct_index is 0 to 3.
- explanation: 1-2 sentences on why the correct answer is right and what the tempting wrong choice gets wrong, based on the excerpt.
- Vary difficulty. Do not mention "excerpt" or tags inside the question text.

MATERIAL:
${blocks.join("\n\n")}`;

  let out: Gen;
  try {
    out = await generateJSON<Gen>(prompt, {
      type: "OBJECT",
      properties: {
        questions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              chunk_ref: { type: "STRING" },
              question: { type: "STRING" },
              options: { type: "ARRAY", items: { type: "STRING" } },
              correct_index: { type: "INTEGER" },
              explanation: { type: "STRING" },
            },
            required: ["chunk_ref", "question", "options", "correct_index", "explanation"],
          },
        },
      },
      required: ["questions"],
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  // ---- VALIDATION: drop anything not tied to a chunk we actually retrieved ----
  const byRef = new Map(ctx.map((c) => [c.ref, c]));
  const valid = (out.questions ?? []).flatMap((q) => {
    const c = byRef.get(String(q.chunk_ref).trim().toLowerCase().replace(/[\[\]]/g, ""));
    if (!c || !q.question || !Array.isArray(q.options) || q.options.length !== 4) return [];
    if (!Number.isInteger(q.correct_index) || q.correct_index < 0 || q.correct_index > 3)
      return [];
    const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    return [
      {
        topic_id: c.topicId,
        chunk_id: c.chunkId,
        question: q.question.trim(),
        options: order.map((i) => q.options[i]),
        correct_index: order.indexOf(q.correct_index),
        explanation: q.explanation ?? "",
      },
    ];
  });
  if (!valid.length)
    return NextResponse.json(
      { error: "Could not generate valid questions. Try again." },
      { status: 500 }
    );

  const { data: quiz, error: qErr } = await supabase
    .from("quizzes")
    .insert({ user_id: user.id })
    .select("id")
    .single();
  if (qErr || !quiz)
    return NextResponse.json({ error: qErr?.message ?? "DB error" }, { status: 500 });

  const { error: insErr } = await supabase
    .from("questions")
    .insert(valid.map((v) => ({ ...v, quiz_id: quiz.id })));
  if (insErr) {
    await supabase.from("quizzes").delete().eq("id", quiz.id);
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, quizId: quiz.id, questions: valid.length });
}
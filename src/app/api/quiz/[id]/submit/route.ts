import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Row = {
  id: string;
  correct_index: number;
  explanation: string | null;
  chunks: { section_label: string } | null;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    answers?: { question_id: string; selected_index: number }[];
  } | null;
  if (!body?.answers?.length)
    return NextResponse.json({ error: "No answers" }, { status: 400 });

  const { data } = await supabase
    .from("questions")
    .select("id,correct_index,explanation,chunks(section_label)")
    .eq("quiz_id", id);
  const qs = (data ?? []) as unknown as Row[];
  if (!qs.length) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const { count } = await supabase
    .from("answers")
    .select("id", { count: "exact", head: true })
    .in("question_id", qs.map((q) => q.id));
  if (count) return NextResponse.json({ error: "Quiz already submitted." }, { status: 409 });

  const byId = new Map(qs.map((q) => [q.id, q]));
  const rows: {
    question_id: string;
    user_id: string;
    selected_index: number;
    is_correct: boolean;
  }[] = [];
  const results = [];
  for (const a of body.answers) {
    const q = byId.get(a.question_id);
    if (!q || !Number.isInteger(a.selected_index)) continue;
    const correct = a.selected_index === q.correct_index;
    rows.push({
      question_id: q.id,
      user_id: user.id,
      selected_index: a.selected_index,
      is_correct: correct,
    });
    results.push({
      question_id: q.id,
      correct,
      correct_index: q.correct_index,
      explanation: q.explanation ?? "",
      citation: q.chunks?.section_label ?? "",
    });
  }

  const { error } = await supabase.from("answers").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, results });
}
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Q = {
  id: string;
  correct_index: number;
  explanation: string | null;
  chunks: { section_label: string } | null;
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const questionId = String(body?.questionId ?? "");
  const selected = body?.selectedIndex;
  if (!questionId || !Number.isInteger(selected))
    return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { data } = await supabase
    .from("questions")
    .select("id,correct_index,explanation,chunks(section_label)")
    .eq("id", questionId)
    .maybeSingle();
  const q = data as unknown as Q | null;
  if (!q) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const { count } = await supabase
    .from("answers")
    .select("id", { count: "exact", head: true })
    .eq("question_id", questionId);
  if (count) return NextResponse.json({ error: "Already answered." }, { status: 409 });

  const correct = selected === q.correct_index;
  const { error } = await supabase.from("answers").insert({
    question_id: q.id,
    user_id: user.id,
    selected_index: selected,
    is_correct: correct,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    correct,
    correct_index: q.correct_index,
    explanation: q.explanation ?? "",
    citation: q.chunks?.section_label ?? "",
  });
}
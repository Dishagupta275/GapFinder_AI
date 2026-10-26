import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeGaps } from "@/lib/gaps";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gaps } = await computeGaps(supabase);
  const weak = gaps
    .filter((g) => g.status === "weak" || g.status === "medium")
    .sort((a, b) => (a.status === b.status ? 0 : a.status === "weak" ? -1 : 1));
  if (!weak.length)
    return NextResponse.json(
      { error: "No weak or medium topics yet. Take the diagnostic quiz first." },
      { status: 400 }
    );

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .insert({ user_id: user.id })
    .select("id")
    .single();
  if (error || !quiz)
    return NextResponse.json({ error: error?.message ?? "DB error" }, { status: 500 });

  return NextResponse.json({ ok: true, quizId: quiz.id, topicIds: weak.map((g) => g.id) });
}
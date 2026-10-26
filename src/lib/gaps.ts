import type { SupabaseClient } from "@supabase/supabase-js";

export type Status = "weak" | "medium" | "strong" | "untested";
export type TopicGap = {
  id: string;
  name: string;
  status: Status;
  correct: number;
  total: number;
  reason: string;
  missed: string[];
};
export type Attempt = { quizId: string; at: string; correct: number; total: number };

type Row = {
  is_correct: boolean;
  created_at: string;
  questions: { quiz_id: string; topic_id: string; question: string } | null;
};

export async function computeGaps(supabase: SupabaseClient) {
  const { data: topics } = await supabase.from("topics").select("id,name").order("position");
  const { data } = await supabase
    .from("answers")
    .select("is_correct,created_at,questions(quiz_id,topic_id,question)");
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.questions);

  const byQuiz = new Map<string, Row[]>();
  rows.forEach((r) => {
    const q = r.questions!.quiz_id;
    if (!byQuiz.has(q)) byQuiz.set(q, []);
    byQuiz.get(q)!.push(r);
  });

  const attempts: Attempt[] = Array.from(byQuiz.entries())
    .map(([quizId, rs]) => ({
      quizId,
      at: rs.map((r) => r.created_at).sort().pop()!,
      correct: rs.filter((r) => r.is_correct).length,
      total: rs.length,
    }))
    .sort((a, b) => b.at.localeCompare(a.at));

  const gaps: TopicGap[] = (topics ?? []).map((t): TopicGap => {
    for (const a of attempts) {
      const rs = (byQuiz.get(a.quizId) ?? []).filter((r) => r.questions!.topic_id === t.id);
      if (!rs.length) continue;
      const correct = rs.filter((r) => r.is_correct).length;
      const total = rs.length;
      const pct = correct / total;
      const status: Status = pct >= 0.8 ? "strong" : pct >= 0.5 ? "medium" : "weak";
      const missed = rs.filter((r) => !r.is_correct).map((r) => r.questions!.question);
      let reason = `Answered ${correct} of ${total} correctly.`;
      if (missed.length)
        reason += ` Missed: "${missed[0].slice(0, 100)}"${
          missed.length > 1 ? ` and ${missed.length - 1} more` : ""
        }.`;
      if (total < 2) reason += " Only 1 question, so low confidence. Retake to confirm.";
      return { id: t.id, name: t.name, status, correct, total, reason, missed };
    }
    return {
      id: t.id,
      name: t.name,
      status: "untested",
      correct: 0,
      total: 0,
      reason: "No quiz questions covered this topic yet.",
      missed: [],
    };
  });

  return { attempts, gaps };
}
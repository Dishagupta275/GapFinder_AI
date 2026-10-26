"use client";
import { useState } from "react";
import Link from "next/link";

type Q = { id: string; question: string; options: string[]; topic: string; citation: string };
type R = {
  question_id: string;
  correct: boolean;
  correct_index: number;
  explanation: string;
  citation: string;
};

export default function QuizRunner({ quizId, questions }: { quizId: string; questions: Q[] }) {
  const [sel, setSel] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, R> | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const done = Object.keys(sel).length === questions.length;

  async function submit() {
    setLoading(true);
    setErr("");
    const res = await fetch(`/api/quiz/${quizId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: questions.map((q) => ({ question_id: q.id, selected_index: sel[q.id] })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setErr(data.error ?? res.statusText);
    const map: Record<string, R> = {};
    (data.results as R[]).forEach((r) => (map[r.question_id] = r));
    setResults(map);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const score = results ? Object.values(results).filter((r) => r.correct).length : 0;

  return (
    <div className="space-y-5">
      {results && (
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-lg font-semibold">
            Score: {score} / {questions.length}
          </p>
          <Link href="/" className="text-sm underline">
            Back to home
          </Link>
        </div>
      )}

      {questions.map((q, qi) => {
        const r = results?.[q.id];
        return (
          <div key={q.id} className="bg-white rounded-xl shadow p-5 space-y-3">
            <p className="text-xs text-gray-500">{q.topic}</p>
            <p className="font-medium">
              {qi + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                let style = "border";
                if (r) {
                  if (oi === r.correct_index) style = "border-green-600 bg-green-50";
                  else if (oi === sel[q.id]) style = "border-red-600 bg-red-50";
                }
                return (
                  <label
                    key={oi}
                    className={`flex items-center gap-2 rounded px-3 py-2 text-sm cursor-pointer ${style}`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      disabled={!!results}
                      checked={sel[q.id] === oi}
                      onChange={() => setSel((s) => ({ ...s, [q.id]: oi }))}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
            {r && (
              <div className="text-sm space-y-1">
                <p className={r.correct ? "text-green-700" : "text-red-700"}>
                  {r.correct ? "Correct." : "Incorrect."} {r.explanation}
                </p>
                <p className="text-gray-500">Source: {r.citation}</p>
              </div>
            )}
          </div>
        );
      })}

      {!results && (
        <div className="space-y-2">
          <button
            onClick={submit}
            disabled={!done || loading}
            className="bg-black text-white rounded px-5 py-2 disabled:opacity-50"
          >
            {loading ? "Checking..." : "Submit answers"}
          </button>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
      )}
    </div>
  );
}
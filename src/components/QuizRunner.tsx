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
    <div className="quiz-stack">
      {results && (
        <section className="quiz-card">
          <p className="section-kicker">Diagnostic results</p>
          <p className="page-title">You scored {score} / {questions.length}</p>
          <p className="page-description">Review the answers, explanations, and source citations below.</p>
          <div className="quiz-footer" style={{ marginTop: 16 }}>
            <span className="quiz-progress-copy">{questions.length ? Math.round((score / questions.length) * 100) : 0}% correct</span>
            <Link href="/" className="btn btn-primary">Back to dashboard</Link>
          </div>
        </section>
      )}

      {questions.map((q, qi) => {
        const r = results?.[q.id];
        return (
          <article key={q.id} className="quiz-card">
            <div className="quiz-card-head">
              <div>
                <p className="quiz-number">Question {qi + 1} of {questions.length}</p>
                {q.topic && <span className="quiz-topic">{q.topic}</span>}
              </div>
              {r && <span className={`status-pill ${r.correct ? "strong" : "weak"}`}>{r.correct ? "Correct" : "Review"}</span>}
            </div>
            <p className="quiz-question">{q.question}</p>
            <div className="option-list">
              {q.options.map((opt, oi) => {
                let style = "option-card";
                if (r) {
                  if (oi === r.correct_index) style += " is-correct";
                  else if (oi === sel[q.id]) style += " is-incorrect";
                  else style += " is-locked";
                } else if (sel[q.id] === oi) {
                  style += " is-selected";
                }
                return (
                  <label key={oi} className={style}>
                    <input
                      className="sr-only"
                      type="radio"
                      name={q.id}
                      disabled={!!results}
                      checked={sel[q.id] === oi}
                      onChange={() => setSel((s) => ({ ...s, [q.id]: oi }))}
                    />
                    <span className="option-letter" aria-hidden="true">{String.fromCharCode(65 + oi)}</span>
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
            {r && (
              <div className={`feedback-panel ${r.correct ? "correct" : "incorrect"}`}>
                <p className="font-bold m-0">{r.correct ? "Correct answer" : "Not quite"}</p>
                <p className="m-0 mt-1">{r.explanation}</p>
                <p className="source-label mt-2">Source: {r.citation || q.citation}</p>
              </div>
            )}
          </article>
        );
      })}

      {!results && (
        <div className="quiz-card">
          <div className="quiz-footer">
            <span className="quiz-progress-copy">{Object.keys(sel).length} of {questions.length} answered</span>
            <button
              onClick={submit}
              disabled={!done || loading}
              className="btn btn-primary"
              type="button"
            >
              {loading ? "Checking your answers…" : "Submit answers"}
            </button>
          </div>
          {err && <p role="alert" className="status-message status-error mt-3">{err}</p>}
          {!done && <p className="small-copy mt-2">Select an answer for each question to submit your attempt.</p>}
        </div>
      )}
    </div>
  );
}
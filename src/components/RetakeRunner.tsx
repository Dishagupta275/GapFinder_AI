"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Q = { id: string; question: string; options: string[]; topic: string; citation: string };
type Next = { done: boolean; answered: number; total: number; question?: Q };
type Fb = { correct: boolean; correct_index: number; explanation: string; citation: string };

export default function RetakeRunner({
  quizId,
  topicIds,
}: {
  quizId: string;
  topicIds: string[];
}) {
  const [cur, setCur] = useState<Q | null>(null);
  const [upcoming, setUpcoming] = useState<Next | null>(null);
  const [fetching, setFetching] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const [fb, setFb] = useState<Fb | null>(null);
  const [answered, setAnswered] = useState(0);
  const [score, setScore] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState(0);
  const [total, setTotal] = useState(topicIds.length * 3);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const started = useRef(false);

  async function fetchNext(): Promise<Next | null> {
    setFetching(true);
    setErr("");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 55000);
    try {
      const r = await fetch("/api/retake/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, topicIds }),
        signal: ctrl.signal,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(j.error ?? "Could not load the next question.");
        return null;
      }
      return j as Next;
    } catch (e) {
      setErr(
        (e as Error).name === "AbortError"
          ? "This took too long. The AI model is slow right now."
          : "Network error."
      );
      return null;
    } finally {
      clearTimeout(timer);
      setFetching(false);
    }
  }

  function apply(n: Next) {
    setTotal(n.total);
    setAnswered(n.answered);
    if (n.done || !n.question) {
      setDone(true);
      return;
    }
    setCur(n.question);
    setSel(null);
    setFb(null);
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fetchNext().then((n) => n && apply(n));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pick(i: number) {
    if (!cur || fb || busy) return;
    setSel(i);
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/retake/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: cur.id, selectedIndex: i }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(j.error ?? "Could not save your answer.");
        setSel(null);
        setBusy(false);
        return;
      }
      setFb(j as Fb);
      if (j.correct) setScore((s) => s + 1);
      setSessionAnswers((s) => s + 1);
      const a = answered + 1;
      setAnswered(a);
      if (a < total) fetchNext().then((n) => n && setUpcoming(n));
    } catch {
      setErr("Network error. Try again.");
      setSel(null);
    }
    setBusy(false);
  }

  function goNext() {
    if (answered >= total) return setDone(true);
    if (!upcoming) return;
    apply(upcoming);
    setUpcoming(null);
  }

  function retry() {
    fetchNext().then((n) => {
      if (!n) return;
      if (cur && fb) setUpcoming(n);
      else apply(n);
    });
  }

  if (done)
    return (
      <section className="quiz-card">
        <div className="stat-icon green" aria-hidden="true">✓</div>
        <p className="section-kicker mt-4">Focused practice complete</p>
        <h2 className="page-title">Good work showing up.</h2>
        {sessionAnswers > 0 && (
          <p className="page-description">You got {score} of {sessionAnswers} right this session ({Math.round((score / sessionAnswers) * 100)}%).</p>
        )}
        <div className="hero-actions">
          <Link href="/" className="btn btn-primary">See updated gap report</Link>
        </div>
      </section>
    );

  return (
    <div className="quiz-stack">
      <section className="retake-status-card">
        <div className="quiz-footer">
          <span className="quiz-progress-copy">Question {Math.min(answered + (fb ? 0 : 1), total)} of {total}</span>
          <span className="small-copy">{answered} completed</span>
        </div>
        <div className="progress-track" role="progressbar" aria-label="Retake progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answered}>
          <div className="progress-fill strong" style={{ width: `${total ? (answered / total) * 100 : 0}%` }} />
        </div>
      </section>

      {!cur && !err && (
        <div className="quiz-card" aria-live="polite">
          <p className="section-kicker">Preparing your practice</p>
          <p className="page-description">Finding a relevant note excerpt and writing your first question…</p>
        </div>
      )}

      {cur && (
        <article className="quiz-card">
          <div className="quiz-card-head">
            <div>
              <p className="quiz-number">Focused retake</p>
              {cur.topic && <span className="quiz-topic">{cur.topic}</span>}
            </div>
            {fb && <span className={`status-pill ${fb.correct ? "strong" : "weak"}`}>{fb.correct ? "Correct" : "Review"}</span>}
          </div>
          <p className="quiz-question">{cur.question}</p>
          <div className="option-list">
            {cur.options.map((opt, oi) => {
              let style = "option-card";
              if (fb) {
                if (oi === fb.correct_index) style += " is-correct";
                else if (oi === sel) style += " is-incorrect";
                else style += " is-locked";
              } else if (sel === oi) {
                style += " is-selected";
              }
              return (
                <button
                  key={oi}
                  onClick={() => pick(oi)}
                  disabled={!!fb || busy}
                  className={style}
                  type="button"
                >
                  <span className="option-letter" aria-hidden="true">{String.fromCharCode(65 + oi)}</span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
          {fb && (
            <div className={`feedback-panel ${fb.correct ? "correct" : "incorrect"}`}>
              <p className="font-bold m-0">{fb.correct ? "Correct answer" : "Let's review this one"}</p>
              <p className="m-0 mt-1">{fb.explanation}</p>
              <p className="source-label mt-2">Source: {fb.citation || cur.citation}</p>
            </div>
          )}
          {busy && <p className="status-message" aria-live="polite">Saving your answer…</p>}
        </article>
      )}

      {fb && (
        <div className="quiz-footer">
          <span className="quiz-progress-copy">Score this session: {score}/{sessionAnswers}</span>
          <button
            onClick={goNext}
            disabled={answered < total && !upcoming}
            className="btn btn-primary"
            type="button"
          >
            {answered >= total
              ? "Finish retake"
              : upcoming
              ? "Next question"
              : fetching
              ? "Loading next question…"
              : "Next question"}
          </button>
        </div>
      )}

      {err && (
        <div className="feedback-panel incorrect" role="alert">
          <p className="m-0">{err}</p>
          {!fetching && (!cur || (fb && !upcoming && answered < total)) && (
            <button onClick={retry} className="btn btn-secondary mt-3" type="button">
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
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
      // load the next question in the background while the student reads the feedback
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
      <div className="bg-white rounded-xl shadow p-5 space-y-2">
        <p className="text-lg font-semibold">Retake complete</p>
        {sessionAnswers > 0 && (
          <p className="text-sm">
            You got {score} of {sessionAnswers} right this session.
          </p>
        )}
        <Link href="/" className="text-sm underline">
          See your updated gap report
        </Link>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm text-gray-600">
          Question {Math.min(answered + (fb ? 0 : 1), total)} of {total}
        </p>
        <div className="h-2 rounded bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-black transition-all"
            style={{ width: `${total ? (answered / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {!cur && !err && (
        <div className="bg-white rounded-xl shadow p-5 text-sm text-gray-600 animate-pulse">
          Writing your first question from your notes...
        </div>
      )}

      {cur && (
        <div className="bg-white rounded-xl shadow p-5 space-y-3">
          <p className="text-xs text-gray-500">{cur.topic}</p>
          <p className="font-medium">{cur.question}</p>
          <div className="space-y-2">
            {cur.options.map((opt, oi) => {
              let style = "border hover:bg-gray-50";
              if (fb) {
                if (oi === fb.correct_index) style = "border-green-600 bg-green-50";
                else if (oi === sel) style = "border-red-600 bg-red-50";
                else style = "border opacity-60";
              }
              return (
                <button
                  key={oi}
                  onClick={() => pick(oi)}
                  disabled={!!fb || busy}
                  className={`w-full text-left rounded px-3 py-2 text-sm ${style}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {fb && (
            <div className="text-sm space-y-1">
              <p className={fb.correct ? "text-green-700" : "text-red-700"}>
                {fb.correct ? "Correct." : "Incorrect."} {fb.explanation}
              </p>
              <p className="text-gray-500">Source: {fb.citation}</p>
            </div>
          )}
        </div>
      )}

      {fb && (
        <button
          onClick={goNext}
          disabled={answered < total && !upcoming}
          className="bg-black text-white rounded px-5 py-2 text-sm disabled:opacity-50"
        >
          {answered >= total
            ? "Finish"
            : upcoming
            ? "Next question"
            : fetching
            ? "Loading next question..."
            : "Next question"}
        </button>
      )}

      {err && (
        <div className="text-sm text-red-600 space-y-1">
          <p>{err}</p>
          {!fetching && (!cur || (fb && !upcoming && answered < total)) && (
            <button onClick={retry} className="underline">
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
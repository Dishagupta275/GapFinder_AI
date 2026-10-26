"use client";
import { useState } from "react";

type Source = { n: number; label: string; snippet: string };
type Result = { answered: boolean; answer: string; sources: Source[] };

export default function ExplainBox({ disabled }: { disabled?: boolean }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState<Result | null>(null);

  async function ask() {
    if (!q.trim() || loading) return;
    setLoading(true);
    setErr("");
    setRes(null);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 50000);
    try {
      const r = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
        signal: ctrl.signal,
      });
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? "Something went wrong.");
      else setRes(j);
    } catch (e) {
      setErr(
        (e as Error).name === "AbortError"
          ? "This took too long. The AI model is slow right now, try again."
          : "Network error. Try again."
      );
    }
    clearTimeout(timer);
    setLoading(false);
  }

  return (
    <div className="assistant-box">
      <div className="assistant-input-row">
        <input
          className="form-control"
          placeholder="e.g. Explain Strict 2PL, or What is BCNF?"
          aria-label="Topic or question to explain"
          value={q}
          maxLength={500}
          disabled={disabled}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
        />
        <button
          onClick={ask}
          disabled={disabled || loading || !q.trim()}
          className="btn btn-primary"
          type="button"
        >
          {loading ? "Thinking…" : "Explain"}
        </button>
      </div>

      {loading && <p className="status-message" aria-live="polite">Searching your notes and preparing an explanation…</p>}
      {err && <p role="alert" className="status-message status-error">{err}</p>}

      {res && (
        <div className={`answer-panel ${res.answered ? "" : "unsupported"}`}>
          <p className="whitespace-pre-wrap m-0">{res.answer}</p>
          {res.sources.length > 0 && (
            <div className="source-list">
              <p className="field-label">Sources from your material</p>
              {res.sources.map((s) => (
                <details key={s.n} className="source-detail">
                  <summary>[{s.n}] {s.label}</summary>
                  <p className="source-snippet">{s.snippet}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
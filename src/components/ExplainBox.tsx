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
    try {
      const r = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? "Something went wrong.");
      else setRes(j);
    } catch {
      setErr("Network error. Try again.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2 text-sm"
          placeholder="e.g. Explain Strict 2PL, or What is BCNF?"
          value={q}
          maxLength={500}
          disabled={disabled}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
        />
        <button
          onClick={ask}
          disabled={disabled || loading || !q.trim()}
          className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Explain"}
        </button>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      {res && (
        <div
          className={`rounded border p-3 space-y-2 text-sm ${
            res.answered ? "bg-gray-50" : "bg-amber-50 border-amber-200"
          }`}
        >
          <p className="whitespace-pre-wrap">{res.answer}</p>
          {res.sources.length > 0 && (
            <div className="pt-2 border-t space-y-1">
              <p className="text-xs font-semibold text-gray-600">Sources</p>
              {res.sources.map((s) => (
                <details key={s.n} className="text-xs text-gray-600">
                  <summary className="cursor-pointer">
                    [{s.n}] {s.label}
                  </summary>
                  <p className="mt-1 pl-3 text-gray-500">{s.snippet}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
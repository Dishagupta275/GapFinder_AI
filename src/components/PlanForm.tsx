"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlanForm({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [hours, setHours] = useState("2");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setStatus("Building your plan...");
    const res = await fetch("/api/plan/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours_per_day: hours, exam_date: date }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setStatus(`Error: ${data.error ?? res.statusText}`);
    setStatus("Plan ready.");
    router.refresh();
  }

  return (
    <div className="form-stack">
      <div className="form-grid">
        <label className="field">
          <span className="field-label">Study hours per day</span>
          <input
            type="number"
            min="0.5"
            max="12"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="form-control"
          />
        </label>
        <label className="field">
          <span className="field-label">Exam date <span className="muted">(optional)</span></span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-control"
          />
        </label>
      </div>
      <div className="form-actions">
        <button onClick={run} disabled={disabled || loading} className="btn btn-primary" type="button">
          {loading ? "Creating your plan…" : "Generate revision plan"}
        </button>
        {status && <span aria-live="polite" className={`status-message ${status.startsWith("Error:") ? "status-error" : status === "Plan ready." ? "status-success" : ""}`}>{status}</span>}
      </div>
    </div>
  );
}
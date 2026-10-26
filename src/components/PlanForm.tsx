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
    <div className="flex flex-wrap items-end gap-3 text-sm">
      <label className="space-y-1">
        <span className="block text-gray-600">Hours per day</span>
        <input
          type="number"
          min="0.5"
          max="12"
          step="0.5"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="border rounded px-3 py-2 w-28"
        />
      </label>
      <label className="space-y-1">
        <span className="block text-gray-600">Exam date (optional)</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </label>
      <button
        onClick={run}
        disabled={disabled || loading}
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {loading ? "Working..." : "Generate revision plan"}
      </button>
      {status && <span className="text-gray-700">{status}</span>}
    </div>
  );
}
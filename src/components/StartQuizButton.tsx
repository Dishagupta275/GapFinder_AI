"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StartQuizButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setStatus("Retrieving your material and writing questions...");
    const res = await fetch("/api/quiz/generate", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      return setStatus(`Error: ${data.error ?? res.statusText}`);
    }
    router.push(`/quiz/${data.quizId}`);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={run}
        disabled={disabled || loading}
        className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
      >
        {loading ? "Working..." : "Start diagnostic quiz"}
      </button>
      {status && <span className="text-sm text-gray-700">{status}</span>}
    </div>
  );
}
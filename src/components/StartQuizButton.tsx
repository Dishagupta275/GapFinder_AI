"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StartQuizButton({
  disabled,
  weakCount = 0,
}: {
  disabled: boolean;
  weakCount?: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(weakOnly: boolean) {
    setLoading(true);
    setStatus(
      weakOnly
        ? "Setting up your retake..."
        : "Retrieving your material and writing questions..."
    );
    try {
      const res = await fetch(weakOnly ? "/api/retake/start" : "/api/quiz/generate", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoading(false);
        return setStatus(`Error: ${data.error ?? res.statusText}`);
      }
      if (weakOnly) router.push(`/retake/${data.quizId}?t=${data.topicIds.join(",")}`);
      else router.push(`/quiz/${data.quizId}`);
    } catch {
      setLoading(false);
      setStatus("Network error. Try again.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => run(false)}
        disabled={disabled || loading}
        className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
      >
        {loading ? "Working..." : "Start diagnostic quiz"}
      </button>
      {weakCount > 0 && (
        <button
          onClick={() => run(true)}
          disabled={disabled || loading}
          className="border border-black rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          Retake on weak topics ({weakCount})
        </button>
      )}
      {status && <span className="text-sm text-gray-700">{status}</span>}
    </div>
  );
}
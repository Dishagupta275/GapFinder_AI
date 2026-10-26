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
    <div className="form-stack">
      <div className="form-actions">
        <button
          onClick={() => run(false)}
          disabled={disabled || loading}
          className="btn btn-primary"
          type="button"
        >
          {loading ? "Preparing quiz…" : "Start diagnostic quiz"}
        </button>
        {weakCount > 0 && (
          <button
            onClick={() => run(true)}
            disabled={disabled || loading}
            className="btn btn-secondary"
            type="button"
          >
            Focused retake <span className="status-pill weak">{weakCount} topics</span>
          </button>
        )}
      </div>
      {status && <p aria-live="polite" className={`status-message ${status.startsWith("Error:") || status.startsWith("Network") ? "status-error" : ""}`}>{status}</p>}
    </div>
  );
}
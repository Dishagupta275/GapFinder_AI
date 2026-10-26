"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TopicMapButton({ hasTopics }: { hasTopics: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setStatus("Reading your syllabus...");
    const res = await fetch("/api/topics/generate", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setStatus(`Error: ${data.error ?? res.statusText}`);
    setStatus(`Found ${data.topics} topics.`);
    router.refresh();
  }

  return (
    <div className="section-content">
      <button onClick={run} disabled={loading} className="btn btn-primary" type="button">
        {loading ? "Building topic map…" : hasTopics ? "Regenerate topic map" : "Generate topic map"}
      </button>
      {status && <span aria-live="polite" className={`status-message ${status.startsWith("Error:") ? "status-error" : "status-success"}`}>{status}</span>}
    </div>
  );
}
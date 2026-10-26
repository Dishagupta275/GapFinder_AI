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
    <div className="flex items-center gap-3">
      <button
        onClick={run}
        disabled={loading}
        className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
      >
        {loading ? "Working..." : hasTopics ? "Regenerate topic map" : "Generate topic map"}
      </button>
      {status && <span className="text-sm text-gray-700">{status}</span>}
    </div>
  );
}
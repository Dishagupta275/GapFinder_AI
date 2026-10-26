"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadForm() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setStatus("Reading, chunking and embedding... this can take a minute.");
    const res = await fetch("/api/upload", { method: "POST", body: new FormData(form) });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setStatus(`Error: ${data.error ?? res.statusText}`);
    setStatus(`Done: ${data.chunks} chunks indexed.`);
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 bg-white rounded-xl shadow p-5">
      <h2 className="font-semibold">Upload material</h2>
      <select name="kind" className="w-full border rounded px-3 py-2" defaultValue="syllabus">
        <option value="syllabus">Syllabus</option>
        <option value="notes">Notes / textbook chapter</option>
        <option value="past_paper">Past question paper</option>
      </select>
      <input name="title" placeholder="Title (e.g. DBMS Syllabus)" className="w-full border rounded px-3 py-2" required />
      <input name="file" type="file" accept=".pdf,.txt,.md" className="w-full" required />
      <button disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
        {loading ? "Processing..." : "Upload"}
      </button>
      {status && <p className="text-sm text-gray-700">{status}</p>}
    </form>
  );
}
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadForm() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

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
    setFileName("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="form-stack">
      <label className="field">
        <span className="field-label">Material type</span>
        <select name="kind" className="form-control" defaultValue="syllabus">
          <option value="syllabus">Syllabus</option>
          <option value="notes">Notes / textbook chapter</option>
          <option value="past_paper">Past question paper</option>
        </select>
      </label>

      <label className="field">
        <span className="field-label">Document title</span>
        <input
          name="title"
          placeholder="e.g. DBMS Syllabus"
          className="form-control"
          required
        />
      </label>

      <div className="upload-dropzone">
        <div className="upload-icon" aria-hidden="true">↑</div>
        <div className="upload-copy">
          <div className="upload-file-name">{fileName || "Choose a study file"}</div>
          <div className="upload-file-hint">PDF, TXT or Markdown · maximum 10 MB</div>
        </div>
        <label htmlFor="file-input" className="btn btn-secondary">
          Browse files
        </label>
        <input
          id="file-input"
          name="file"
          type="file"
          accept=".pdf,.txt,.md"
          className="sr-only"
          required
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
        />
      </div>

      <div className="form-actions">
        <button disabled={loading} className="btn btn-primary" type="submit">
          {loading ? "Processing material…" : "Upload material"}
        </button>
        <span className="small-copy">Text is extracted and indexed for source-grounded study.</span>
      </div>
      {status && (
        <p aria-live="polite" className={`status-message ${status.startsWith("Error:") ? "status-error" : status.startsWith("Done:") ? "status-success" : ""}`}>
          {status}
        </p>
      )}
    </form>
  );
}
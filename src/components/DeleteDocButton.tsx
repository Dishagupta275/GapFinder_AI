"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteDocButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function remove() {
    if (!confirm(`Delete "${title}" and all its chunks? Questions built from it will be removed too.`))
      return;
    setLoading(true);
    setErr("");
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setErr(data.error ?? res.statusText);
    router.refresh();
  }

  return (
    <span className="document-actions">
      <button
        type="button"
        onClick={remove}
        disabled={loading}
        className="btn btn-danger"
      >
        {loading ? "Deleting…" : "Delete"}
      </button>
      {err && <span role="alert" className="status-message status-error">{err}</span>}
    </span>
  );
}
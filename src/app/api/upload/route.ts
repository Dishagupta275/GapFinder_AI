import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { createClient } from "@/lib/supabase/server";
import { chunkText, embedTexts } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const kind = String(form.get("kind") || "notes");
  const title = String(form.get("title") || file?.name || "Untitled");

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!["syllabus", "notes", "past_paper"].includes(kind))
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024)
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });

  const pages: { page: number | null; text: string }[] = [];
  try {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
      const { text } = await extractText(pdf, { mergePages: false });
      text.forEach((t, i) => pages.push({ page: i + 1, text: t }));
    } else {
      pages.push({ page: null, text: await file.text() });
    }
  } catch {
    return NextResponse.json({ error: "Could not read this file" }, { status: 422 });
  }

  let n = 0;
  const items = pages.flatMap((p) =>
    chunkText(p.text).map((content) => {
      n++;
      return {
        content,
        page: p.page,
        section_label: p.page ? `${title}, p.${p.page}` : `${title}, part ${n}`,
      };
    })
  );
  if (!items.length)
    return NextResponse.json(
      { error: "No text found. Scanned PDFs are not supported." },
      { status: 422 }
    );

  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .insert({ user_id: user.id, kind, title })
    .select("id")
    .single();
  if (docErr || !doc)
    return NextResponse.json({ error: docErr?.message ?? "DB error" }, { status: 500 });

  try {
    const embeddings = await embedTexts(items.map((i) => i.content));
    const rows = items.map((it, i) => ({
      user_id: user.id,
      document_id: doc.id,
      content: it.content,
      page: it.page,
      section_label: it.section_label,
      embedding: `[${embeddings[i].join(",")}]`,
    }));
    for (let i = 0; i < rows.length; i += 50) {
      const { error } = await supabase.from("chunks").insert(rows.slice(i, i + 50));
      if (error) throw new Error(error.message);
    }
  } catch (e) {
    await supabase.from("documents").delete().eq("id", doc.id);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  await supabase.rpc("assign_chunks_to_topics");

  return NextResponse.json({ ok: true, documentId: doc.id, chunks: items.length });
}
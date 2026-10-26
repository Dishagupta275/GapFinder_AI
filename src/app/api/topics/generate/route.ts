import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embedTexts, generateJSON } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

type Out = { topics: { name: string; description: string }[] };

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rows, error } = await supabase
    .from("chunks")
    .select("content, documents!inner(kind)")
    .eq("documents.kind", "syllabus");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows?.length)
    return NextResponse.json({ error: "Upload a syllabus first." }, { status: 400 });

  const syllabus = rows.map((r) => r.content).join("\n\n").slice(0, 30000);

  const prompt = `You are reading a student's syllabus. Extract the distinct study topics it contains.
Rules:
- Use ONLY what is written in the syllabus. Do not invent topics.
- Return between 4 and 20 topics, as many as the syllabus truly contains.
- "name": short (max 6 words).
- "description": one sentence listing the key subtopics and keywords for that topic.

SYLLABUS:
${syllabus}`;

  let out: Out;
  try {
    out = await generateJSON<Out>(prompt, {
      type: "OBJECT",
      properties: {
        topics: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              description: { type: "STRING" },
            },
            required: ["name", "description"],
          },
        },
      },
      required: ["topics"],
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const seen = new Set<string>();
  const topics = (out.topics ?? [])
    .map((t) => ({ name: t.name?.trim(), description: t.description?.trim() ?? "" }))
    .filter((t) => t.name && !seen.has(t.name.toLowerCase()) && seen.add(t.name.toLowerCase()))
    .slice(0, 25);
  if (!topics.length)
    return NextResponse.json({ error: "No topics found in the syllabus." }, { status: 422 });

  try {
    const embeddings = await embedTexts(
      topics.map((t) => `${t.name}. ${t.description}`),
      "RETRIEVAL_QUERY"
    );

    await supabase.from("topics").delete().eq("user_id", user.id);

    const { error: insErr } = await supabase.from("topics").insert(
      topics.map((t, i) => ({
        user_id: user.id,
        name: t.name,
        description: t.description,
        position: i,
        embedding: `[${embeddings[i].join(",")}]`,
      }))
    );
    if (insErr) throw new Error(insErr.message);

    const { error: rpcErr } = await supabase.rpc("assign_chunks_to_topics");
    if (rpcErr) throw new Error(rpcErr.message);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, topics: topics.length });
}
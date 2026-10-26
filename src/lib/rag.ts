const MODEL = "gemini-embedding-001";

export function chunkText(text: string, size = 900, overlap = 150): string[] {
  const clean = text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!clean) return [];

  const chunks: string[] = [];
  let cur = "";
  for (const p of clean.split(/\n\n+/)) {
    if (cur && (cur + "\n\n" + p).length > size) {
      chunks.push(cur.trim());
      let tail = cur.slice(-overlap);
      tail = tail.slice(tail.indexOf(" ") + 1);
      cur = tail + "\n\n" + p;
    } else {
      cur = cur ? cur + "\n\n" + p : p;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());

  return chunks.flatMap((c) => hardSplit(c, size));
}

function hardSplit(text: string, size: number): string[] {
  const max = Math.floor(size * 1.6);
  const out: string[] = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf(". ", size);
    if (cut < size * 0.5) cut = rest.lastIndexOf(" ", size);
    if (cut < size * 0.5) cut = size;
    out.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) out.push(rest);
  return out;
}

export async function embedTexts(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT"
): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const body = {
      requests: batch.map((t) => ({
        model: `models/${MODEL}`,
        content: { parts: [{ text: t }] },
        taskType,
        outputDimensionality: 768,
      })),
    };
    let attempt = 0;
    while (true) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:batchEmbedContents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
          },
          body: JSON.stringify(body),
        }
      );
      if (res.ok) {
        const j = await res.json();
        out.push(...j.embeddings.map((e: { values: number[] }) => e.values));
        break;
      }
      if ((res.status === 429 || res.status >= 500) && attempt < 4) {
        await new Promise((r) => setTimeout(r, 1500 * 2 ** attempt));
        attempt++;
        continue;
      }
      throw new Error(`Embedding failed: ${res.status} ${await res.text()}`);
    }
  }
  return out;
}

export const GEN_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

const FALLBACKS = ["gemini-flash-latest", "gemini-flash-lite-latest"];

export async function generateJSON<T>(
  prompt: string,
  schema: Record<string, unknown>
): Promise<T> {
  const models = Array.from(new Set([GEN_MODEL, ...FALLBACKS]));
  let lastErr = "Generation failed";

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            signal: AbortSignal.timeout(20000),
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: schema,
              },
            }),
          }
        );
        if (res.ok) {
          const j = await res.json();
          const text = j.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return JSON.parse(text) as T;
          lastErr = "Empty response from model";
          continue;
        }
        const body = await res.text();
        lastErr = `Generation failed (${model}): ${res.status} ${body.slice(0, 200)}`;
        if (res.status === 404 || res.status === 400) break; // try the next model
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      } catch (e) {
        lastErr = (e as Error).message;
      }
    }
  }
  throw new Error(lastErr);
}
const model = process.argv[2] || "gemini-flash-lite-latest";
const t = Date.now();
const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  {
    method: "POST",
    signal: AbortSignal.timeout(40000),
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    },
           body: JSON.stringify({
      contents: [{ parts: [{ text: "Say hi in one word." }] }],
      ...(process.argv[3]
        ? { generationConfig: { thinkingConfig: { thinkingLevel: process.argv[3] } } }
        : {}),
    }),
  }
);
console.log(model, res.status, `${Date.now() - t}ms`);
console.log((await res.text()).slice(0, 300));
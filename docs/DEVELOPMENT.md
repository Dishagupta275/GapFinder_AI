# GapFinder AI — Development Guide

This guide is for setting up a local development copy, validating changes, and troubleshooting common issues.

## 1. Prerequisites

- A supported Node.js release for the Next.js version pinned in `package.json`
- npm
- A Google AI API key with access to the embedding and generation models configured by the project
- A Supabase project with the required schema, pgvector extension, RPC functions, and RLS policies
- Git

The checked-in `package-lock.json` should be used to install the project's pinned dependency tree.

## 2. Local setup

### Clone and install

```bash
git clone https://github.com/Dishagupta275/GapFinder_AI.git
cd GapFinder_AI
npm ci
```

Use `npm install` instead of `npm ci` only when intentionally changing dependency versions or regenerating the lockfile.

### Configure environment variables

Create `.env.local` in the project root:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
GOOGLE_GENERATIVE_AI_API_KEY=YOUR_GOOGLE_AI_API_KEY
GEMINI_MODEL=gemini-flash-lite-latest
```

Replace the placeholders with your own project values. Never commit real credentials. Keep the Google AI key server-side and do not prefix it with `NEXT_PUBLIC_`.

The source currently defaults generation to `gemini-flash-latest` when `GEMINI_MODEL` is not set. The example above sets `gemini-flash-lite-latest` explicitly. Verify model availability and quota in your Google AI project if generation fails.

### Configure Supabase

The application expects these tables:

- `documents`
- `topics`
- `chunks`
- `quizzes`
- `questions`
- `answers`
- `plans`

It also expects pgvector and the SQL functions `match_chunks` and `assign_chunks_to_topics`. Embeddings are stored as 768-dimensional vectors. Configure RLS policies for every user-owned table and verify that foreign keys, indexes, vector column dimensions, and RPC signatures match the calls in `src/app/api`.

**Schema note:** the repository does not currently include a SQL migration or schema export. Use the known-good schema from your existing Supabase project or create and review a migration before setting up another environment. Do not assume the table names alone are enough to make the app work.

## 3. Run and validate

Start development mode:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run static checks and a production build:

```bash
npm run lint
npm run build
```

The current `package.json` does not define a dedicated `test` script. Do not interpret a successful lint/build as proof that every database-backed workflow has passed; use the manual smoke test below after changes.

## 4. Recommended smoke-test checklist

Use a non-sensitive test account and sample documents. Confirm the full user journey after touching API, retrieval, database, or UI code.

- [ ] Sign in and sign out.
- [ ] Upload a text-based PDF or TXT file as a syllabus.
- [ ] Generate a topic map and check that topics match the syllabus.
- [ ] Upload notes containing material for at least two topics.
- [ ] Generate a diagnostic quiz and verify that every question shows a meaningful source label.
- [ ] Submit all answers; check correct/incorrect states, explanations, and citations.
- [ ] Confirm the gap report's topic statuses against the submitted answers.
- [ ] Generate a plan using a small daily study time and, separately, an exam date.
- [ ] Ask Explain a question clearly covered in the notes; confirm it returns cited support.
- [ ] Ask a question not covered by the notes; confirm the assistant refuses rather than inventing an answer.
- [ ] Start a focused retake and complete the questions.
- [ ] Check the progress chart after more than one quiz attempt.
- [ ] Delete a test document and verify that only the intended account's data was affected.
- [ ] Check that another signed-in user cannot access the first user's documents, topics, quizzes, answers, or plans.

## 5. API smoke-test order

For a normal first-time setup, exercise the main endpoints in this order through the UI:

1. `POST /api/upload` with `kind=syllabus`.
2. `POST /api/topics/generate`.
3. `POST /api/upload` with `kind=notes`.
4. `POST /api/quiz/generate`.
5. `POST /api/quiz/:id/submit`.
6. `POST /api/plan/generate`.
7. `POST /api/explain`.
8. `POST /api/retake/start`, followed by `/api/retake/next` and `/api/retake/answer`.

The route handlers use the browser's authenticated session. For accurate results, test through the application rather than sending unauthenticated requests directly.

## 6. Troubleshooting

### The app starts, but login fails
- Verify that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` belong to the same Supabase project.
- Verify the Auth account exists and the application's session/cookie handling is functioning.
- Inspect the browser console and local server logs for the actual response.

### Upload returns “No text found”
- Selectable-text PDFs and text files are supported.
- Image-only/scanned PDFs require OCR, which is not currently implemented.
- Check that the chosen file is not empty and is below 10 MB.

### Embedding fails
- Confirm `GOOGLE_GENERATIVE_AI_API_KEY` is valid and has quota/access for `gemini-embedding-001`.
- Check network availability, response status, and the provider's current model availability.
- A generation model setting does not change the hard-coded embedding model.

### Gemini generation fails
- Verify that `GEMINI_MODEL` is an available model for the current API and account.
- A `404` can indicate a model name/API availability issue; `429` generally indicates a quota/rate limit; `5xx` can indicate provider capacity or transient failure.
- The generation helper attempts retries and model fallbacks, but provider failures can still cause an endpoint to fail.
- Avoid printing or sharing the full API key when debugging.

### Topic map exists, but quiz generation reports no notes
- Make sure notes were uploaded after creating the topic map or regenerate the map after uploading the syllabus.
- Ensure notes actually contain the topic material.
- Inspect the database assignment function and the chunk-to-topic relations.

### Explain refuses to answer
- Check that the uploaded notes explicitly cover the question.
- A refusal can be correct behavior when relevant chunks are not retrieved or are below the endpoint's evidence threshold.
- Try a more specific question that uses terminology in the source notes.

### Missing relation, table, or RPC error
- Compare the actual database schema with the application queries.
- Confirm the `match_chunks` parameters and return columns match the route code.
- Confirm pgvector is enabled and embedding columns use 768 dimensions.
- Confirm RLS policies permit the signed-in owner to perform the required operation.

## 7. Making a change safely

1. Trace the relevant UI component and API route before editing.
2. If changing a table or RPC, update the database migration and the application code together.
3. If changing RAG behavior, verify chunk retrieval and citation validation, not only the generated text.
4. If changing scoring, test edge cases: no answers, one question, multiple topics, and multiple attempts.
5. Run `npm run lint` and `npm run build`.
6. Complete the relevant smoke-test checklist.
7. Write down any new environment variable, database migration, limitation, or breaking behavior in the docs.

## 8. Pull request checklist

- [ ] Explain the behavior being changed and why.
- [ ] Include test steps and their observed result.
- [ ] Run lint and build.
- [ ] Add/update a migration if the database changes.
- [ ] Keep secrets, user notes, uploaded files, and generated private data out of commits.
- [ ] Update the README or architecture guide if setup or behavior changed.

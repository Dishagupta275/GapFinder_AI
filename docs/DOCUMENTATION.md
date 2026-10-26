---
title: "GapFinder AI"
subtitle: "Technical Project Documentation"
author: "GapFinder AI Project Team"
date: "26 October 2026"
---

**Document type:** Standalone technical documentation  
**Version:** 1.0  
**Repository:** <https://github.com/Dishagupta275/GapFinder_AI>  
**Live demo:** <https://gap-finder-ai-seven.vercel.app>

# Contents

1. Document purpose and scope
2. Executive summary
3. Problem statement and motivation
4. Objectives and scope
5. Users and primary workflow
6. Functional requirements and features
7. Technology stack
8. System architecture
9. End-to-end processing workflow
10. Retrieval-augmented generation (RAG) design
11. Gap-detection and revision-planning logic
12. Database design
13. Application modules and code organization
14. API reference
15. Local installation and configuration
16. Deployment and demo guidance
17. Security, privacy, and reliability
18. Testing and acceptance criteria
19. Limitations and risks
20. Future enhancements
21. Conclusion and appendix

# Document purpose and scope

This document explains the purpose, design, data flow, implementation, algorithms, setup, and operational considerations of GapFinder AI. It is intended to be usable independently of the repository README, for project reviews, demonstrations, handoffs, and technical discussions.

The document is based on the current repository documentation and implementation structure available on the `main` branch when prepared. The exact Supabase DDL is not checked into the repository; database fields below describe the logical structure used by the application and must be checked against the configured Supabase project before creating a new environment. Deployment availability and provider model access can change independently of this document.

# 1. Executive summary

GapFinder AI is an AI-assisted study companion that identifies learning gaps using a student's own syllabus and study material. Instead of generating a generic quiz, it creates a topic map from the uploaded syllabus, retrieves related study excerpts, generates source-grounded diagnostic questions, evaluates the student's answers, classifies topic-level performance, and prepares a targeted revision plan.

The system combines a Next.js web application, Supabase authentication and PostgreSQL storage, the `pgvector` extension for vector similarity search, and Google Gemini for embeddings and structured text generation. The application preserves source labels for chunks so the learner can trace generated questions and explanations back to uploaded material.

## Core value proposition

- **Personalized diagnosis:** highlights topics that need attention instead of presenting only an overall score.
- **Source-grounded learning:** generates questions and explanations from retrieved material and shows the associated source label.
- **Actionable revision:** converts quiz results into a day-by-day study plan.
- **Iterative practice:** supports focused retakes and progress review.

The app is designed as a study-support tool. A topic status is a heuristic based on quiz answers, not a formal or statistically validated measure of mastery.

# 2. Problem statement and motivation

Students often spend revision time on familiar material because they do not have a reliable view of what they understand and what they have not tested. Generic question banks may also introduce questions that are outside the student's syllabus or use terminology that differs from their notes.

GapFinder AI addresses these problems by using the learner's own material as the source of a structured diagnostic cycle. The intended result is a more focused decision about **what to revise next**, why it needs attention, and which supporting material to revisit.

# 3. Objectives and scope

## 3.1 Objectives

1. Allow an authenticated learner to upload a syllabus, notes, and past papers.
2. Extract text and index it as searchable chunks with vector embeddings.
3. Derive a topic map from the syllabus and associate relevant chunks with topics.
4. Generate diagnostic multiple-choice questions from retrieved study excerpts.
5. Evaluate submitted answers and calculate a topic-level gap report.
6. Generate a revision plan that prioritizes weaker or untested topics.
7. Explain concepts using retrieved material and show citations for supported answers.
8. Offer focused retakes and an attempt-history view to support iterative practice.

## 3.2 In scope

- Web-based study workflow using Next.js App Router.
- Supabase authentication and per-user data persistence.
- PDF, TXT, and Markdown/text ingestion, subject to text being extractable.
- Embedding-based retrieval and source references.
- Diagnostic quizzes, gap classification, revision planning, explanation, retakes, and progress visualization.

## 3.3 Out of scope in the current implementation

- Optical character recognition (OCR) for image-only/scanned PDFs.
- A guarantee that every generated statement is factually or semantically entailed by its cited text.
- Teacher/class administration and institution-wide analytics.
- A formally validated psychometric assessment model.
- Automatic guarantees that a revision plan is optimal for a particular exam.

# 4. Users and primary workflow

## 4.1 Intended user

The primary user is a student who wants to diagnose weak areas and revise from their own course material. A shared demonstration account is provided for trying the application; because it is shared, it should not be used for confidential or personal documents.

## 4.2 Typical workflow

1. **Sign in:** authenticate through Supabase.
2. **Upload a syllabus:** select the `syllabus` document type and upload a supported text-based file.
3. **Generate the topic map:** extract topic names and descriptions from the syllabus.
4. **Upload notes or past papers:** add source content that can be used to generate questions.
5. **Generate a diagnostic quiz:** retrieve relevant chunks and generate multiple-choice questions from those excerpts.
6. **Submit answers:** compare selected answers with the stored correct options and review explanations and source labels.
7. **Review the gap report:** inspect weak, medium, strong, and untested topics.
8. **Generate a revision plan:** provide daily study hours and optionally an exam date.
9. **Ask for an explanation:** ask a question about the uploaded material and inspect the supporting sources.
10. **Retake weak areas:** complete focused practice and review the recorded attempt scores.

# 5. Functional requirements and features

| Feature | Description | Main implementation location |
|---|---|---|
| Authentication | Login, session-aware server requests, and sign-out | `src/app/login/page.tsx`, `src/lib/supabase/`, `src/middleware.ts` |
| Document upload | Accepts a syllabus, notes, or past paper; extracts and indexes text | `src/app/api/upload/route.ts`, `src/components/UploadForm.tsx` |
| Topic map | Generates syllabus-derived topics and links chunks to topics | `src/app/api/topics/generate/route.ts`, `src/components/TopicMapButton.tsx` |
| Diagnostic quiz | Generates questions from relevant retrieved notes | `src/app/api/quiz/generate/route.ts`, `src/app/quiz/[id]/page.tsx` |
| Answer submission | Grades selected options and records answer outcomes | `src/app/api/quiz/[id]/submit/route.ts`, `src/components/QuizRunner.tsx` |
| Gap report | Calculates topic statuses from the latest relevant attempt | `src/lib/gaps.ts`, dashboard in `src/app/page.tsx` |
| Revision plan | Creates a day-by-day study schedule | `src/app/api/plan/generate/route.ts`, `src/components/PlanForm.tsx` |
| Explain this topic | Retrieves evidence and returns a cited explanation or refusal | `src/app/api/explain/route.ts`, `src/components/ExplainBox.tsx` |
| Focused retake | Creates and delivers practice targeting weak/medium topics | `src/app/api/retake/`, `src/app/retake/[id]/page.tsx` |
| Progress chart | Displays historical quiz-attempt scores | `src/components/ProgressChart.tsx` |
| Document deletion | Removes a selected uploaded document through a server route | `src/app/api/documents/[id]/route.ts`, `src/components/DeleteDocButton.tsx` |

# 6. Technology stack

| Layer | Technology | Purpose |
|---|---|---|
| Application framework | Next.js 16 App Router | Pages, server-side route handlers, and application routing |
| Language | TypeScript | Types and safer application code |
| UI | React 19, Tailwind CSS 4 | Interactive interface and styling |
| Authentication | Supabase Auth, `@supabase/ssr` | User identity and session-aware server/client access |
| Database | Supabase PostgreSQL | Persistent application records |
| Vector search | PostgreSQL `pgvector` | Similarity search over document and topic embeddings |
| Embeddings | Google Gemini `gemini-embedding-001` | Converts chunks and search queries into vectors; configured output size is 768 dimensions |
| Text generation | Google Gemini API | Topic extraction, quiz generation, explanation, and plan generation |
| PDF text extraction | `unpdf` | Extracts text from supported PDFs |
| Validation | Zod and response-schema validation | Checks generated structured data and request inputs where implemented |
| Package manager | npm | Dependency installation and scripts |
| Deployment target | Vercel (demo URL is listed above) | Hosting for the web application |

The repository's `.env.example` currently specifies `gemini-flash-lite-latest` for generation. The application also has a model fallback path. Gemini model availability and quota are provider-controlled and should be checked if generation fails.

# 7. System architecture

## 7.1 Logical architecture

```text
[Browser / React UI]
        |
        v
[Next.js App Router and API handlers]
        |                         |
        v                         v
[Supabase Auth + PostgreSQL]   [Google Gemini API]
        |
        v
[pgvector retrieval functions]
  - match_chunks
  - assign_chunks_to_topics
```

## 7.2 Architectural responsibilities

- **Browser/UI:** collects user input and displays uploaded documents, topic map, quizzes, results, plans, explanations, retakes, and progress.
- **Next.js route handlers:** validate requests, resolve the authenticated user, coordinate database operations and model calls, validate generated output, and return responses.
- **Supabase Auth:** provides the session used by server-side requests.
- **PostgreSQL:** stores user-scoped documents, chunks, topics, quizzes, questions, answers, and revision plans.
- **pgvector SQL retrieval:** locates relevant indexed chunks using vector similarity.
- **Gemini:** creates embeddings and generates structured content from supplied source excerpts.

## 7.3 Key design decision

Retrieval and generation are separated. The database retrieval function returns actual stored chunks. The generation prompt is built from those retrieved chunks and uses temporary source tags. The server checks generated references against the retrieved set before saving or presenting cited content. This is an important provenance safeguard, although it does not prove that every generated sentence is semantically entailed by the referenced chunk.

# 8. End-to-end processing workflow

## 8.1 Ingestion pipeline

1. The user selects a file, document kind, and optional title.
2. The server checks authentication and rejects files over 10 MB.
3. PDF text is extracted page by page using `unpdf`; TXT and Markdown/text files are read as text.
4. Text is normalized and split into overlapping chunks (approximately 900 characters per chunk with 150 characters of overlap by default).
5. Each chunk is labelled with its source location where available, such as a PDF page or text part.
6. The embedding helper calls Gemini in batches of up to 100 texts, requesting 768-dimensional embeddings.
7. The server stores document metadata and inserts chunk records in batches of 50.
8. The `assign_chunks_to_topics` database function associates chunks with the closest available topic.

If ingestion fails after document metadata has been created, the upload handler attempts to remove the incomplete document record. Scanned PDFs without an embedded text layer are not supported because OCR is not implemented.

## 8.2 Topic-map generation

1. The server loads syllabus chunks for the authenticated user.
2. The combined prompt input is capped at approximately 30,000 characters.
3. Gemini extracts a list of distinct topics and short descriptions from the syllabus.
4. The result is normalized and duplicate names are removed.
5. Topic names/descriptions are embedded and saved.
6. Existing chunks are assigned to the newly generated topics using vector similarity.

**Operational caution:** regenerating the map replaces existing user topics. Depending on database foreign-key delete policies, related quiz or answer history may also be affected. Treat regeneration as a re-indexing operation and verify database deletion behavior before using it on data that must be preserved.

## 8.3 Diagnostic quiz generation

1. The server loads the user's topic map.
2. Topic information is embedded and used to retrieve relevant chunks through `match_chunks`.
3. Syllabus chunks are excluded from question-source material; topics without relevant notes can be skipped.
4. Gemini receives retrieved excerpts tagged with temporary references and is asked for multiple-choice questions with four options, one correct answer, an explanation, and a source reference.
5. The server validates field shape, option count, answer index, and source-reference provenance.
6. Invalid questions and references are rejected; answer options are shuffled and the correct index is updated accordingly.
7. The quiz and valid questions are persisted in Supabase.

## 8.4 Submission and feedback

The submission route compares the selected answer index with the stored correct index, records correctness, and returns feedback used by the results UI. A quiz with existing answers cannot be submitted again, and empty answer lists are rejected.

## 8.5 Explain-this-topic

The application embeds the learner's question, retrieves relevant chunks, and applies an evidence/coverage check. Up to five selected chunks are supplied to Gemini with instructions to answer only from those excerpts. The route validates returned source references and refuses when the response is unsupported, empty, or lacks a valid citation. A refusal means the indexed material did not provide adequate support; it does not prove that the question has no answer elsewhere.

## 8.6 Focused retake and progress

The retake flow identifies topics currently labelled weak or medium, creates a retake quiz, and generates questions iteratively. The current documented behaviour targets three questions per selected topic and attempts to avoid previously used chunks when fresh alternatives exist. The progress chart shows recorded quiz-attempt scores; it is distinct from the topic report, which chooses the most recent attempt containing answered questions for each topic.

# 9. Retrieval-augmented generation (RAG) design

## 9.1 Pipeline

```text
Question or topic
      |
      v
Gemini embedding
      |
      v
match_chunks (vector search)
      |
      v
Retrieved chunks + stored source metadata
      |
      v
Prompt with temporary tags: [c1], [c2]
      |
      v
Gemini structured generation
      |
      v
Validate fields and source-tag provenance
      |
      v
Return result with real source labels
```

## 9.2 Chunking and embeddings

- Default chunk target: approximately 900 characters.
- Overlap: approximately 150 characters to preserve context across boundaries.
- Long text pieces may be split further.
- Embedding model: `gemini-embedding-001`.
- Configured vector size: 768 dimensions.
- Database index: HNSW cosine similarity index is described by the current project architecture.

## 9.3 Retrieval and citation safeguards

`match_chunks` performs database-side vector similarity retrieval. The model does not get to invent arbitrary database IDs: it receives temporary tags for the actual chunks returned by retrieval. The handler resolves those tags to real stored chunks and discards references that were not present in the retrieved set. The user-facing source is derived from stored metadata rather than free-form model text.

**Important distinction:** citation validation protects reference provenance. It is not the same as a semantic entailment check, and it cannot guarantee that every generated explanation or question is fully supported by the cited excerpt. Evaluation and human review remain necessary.

# 10. Gap-detection and revision-planning logic

## 10.1 Topic accuracy

For each topic, the gap calculation looks through attempts from newest to oldest and uses the most recent attempt containing answered questions for that topic. It calculates:

`Topic accuracy = Correct answers for the topic / Answered questions for the topic`

## 10.2 Status thresholds

| Status | Accuracy rule | Interpretation |
|---|---|---|
| Strong | 80% or higher | The latest relevant attempt indicates comparatively good performance |
| Medium | 50% or higher but below 80% | The topic may need additional practice |
| Weak | Below 50% | Prioritize review and targeted practice |
| Untested | No answered question for the topic | Evidence is not yet available |

A status based on one or two questions is low-confidence. The label is a heuristic for prioritization, not a formal claim about mastery.

## 10.3 Revision-plan weighting

The revision planner allocates study attention using these configured weights:

| Topic status | Weight |
|---|---:|
| Weak | 3.0 |
| Medium | 2.0 |
| Untested | 2.0 |
| Strong | 0.5 |

The relative weights favour weak and untested areas while preserving some review time for stronger areas. They are heuristics, not empirically calibrated predictions of how long a student will need.

The plan accepts daily study time between 0.5 and 12 hours. The schedule defaults to seven days; an exam date can adjust the horizon, bounded between one and fourteen days. The model receives topic status, missed questions, and topic-linked material to create a concise study focus for each topic/day.

# 11. Database design

The following is the logical data model described by the application. It is not a substitute for the exact SQL schema; the repository currently does not include a complete checked-in Supabase migration.

| Table | Purpose | Principal fields referenced by the app |
|---|---|---|
| `documents` | Uploaded file metadata | `id`, `user_id`, `kind`, `title` |
| `chunks` | Extracted text and embeddings | `id`, `user_id`, `document_id`, `topic_id`, `content`, `section_label`, `page`, `embedding` |
| `topics` | Syllabus-derived concepts | `id`, `user_id`, `name`, `description`, `position`, `embedding` |
| `quizzes` | Quiz or retake container | `id`, `user_id`, creation/attempt metadata as used by the app |
| `questions` | Generated questions | `id`, `quiz_id`, `topic_id`, `chunk_id`, `question`, `options`, `correct_index`, `explanation` |
| `answers` | Submitted responses | `id`, `question_id`, `user_id`, `selected_index`, `is_correct`, timestamps as used by the app |
| `plans` | Revision plans | `id`, `user_id`, `exam_date`, `hours_per_day`, `plan` |

## 11.1 Database functions

- **`match_chunks`** accepts a query embedding, a requested result count, and an optional topic filter; it returns retrieved chunks with the metadata needed by the server.
- **`assign_chunks_to_topics`** links stored chunks to their nearest topic using vector distance/similarity.

## 11.2 Deployment and data-isolation requirements

A working Supabase environment must contain the expected tables, vector columns with 768 dimensions, pgvector extension, indexes, foreign-key relationships, RPC signatures, and row-level security (RLS) policies. User-owned tables must prevent one user from reading or modifying another user's content. Verify the actual policy and foreign-key configuration in Supabase; table names alone are insufficient to recreate the database.

# 12. Application modules and code organization

| Path | Responsibility |
|---|---|
| `src/app/page.tsx` | Main dashboard and study workflow entry point |
| `src/app/login/page.tsx` | Login page |
| `src/app/quiz/[id]/page.tsx` | Diagnostic quiz page |
| `src/app/retake/[id]/page.tsx` | Focused retake page |
| `src/app/api/upload/route.ts` | Upload, parse, chunk, embed, and store document content |
| `src/app/api/topics/generate/route.ts` | Extract topics and assign chunks |
| `src/app/api/quiz/generate/route.ts` | Retrieve sources and generate quiz questions |
| `src/app/api/quiz/[id]/submit/route.ts` | Validate and store submitted answers |
| `src/app/api/plan/generate/route.ts` | Build the revision plan |
| `src/app/api/explain/route.ts` | Evidence-grounded topic explanation |
| `src/app/api/retake/` | Focused retake orchestration and answer handling |
| `src/app/api/documents/[id]/route.ts` | Document deletion handler |
| `src/lib/rag.ts` | Chunking, embedding calls, and structured generation helpers |
| `src/lib/gaps.ts` | Deterministic gap calculations |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | Server Supabase client with session-aware access |
| `src/components/` | Upload, topic map, quiz, plan, explanation, retake, deletion, and progress UI components |

# 13. API reference

The following route list is based on the current application route structure and the repository's architecture guide. The exact JSON request/response contracts should be checked in each route handler when integrating another client.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/upload` | Upload and index a document; accepts multipart fields such as `file`, `kind`, and optional `title` |
| POST | `/api/topics/generate` | Generate a topic map from syllabus material |
| POST | `/api/quiz/generate` | Generate a diagnostic quiz from retrieved topic-related notes |
| POST | `/api/quiz/:id/submit` | Submit quiz answers, record correctness, and return results |
| POST | `/api/plan/generate` | Generate a day-by-day revision plan |
| POST | `/api/explain` | Retrieve evidence and generate a cited explanation or refusal |
| POST | `/api/retake/start` | Start a focused retake for weak/medium topics |
| POST | `/api/retake/next` | Resume or generate the next retake question |
| POST | `/api/retake/answer` | Record a response to the active retake question |
| DELETE | `/api/documents/:id` | Delete a selected document through the server handler |

Authenticated requests should be exercised through the application session for realistic testing. Each handler should derive the current user from the server-side Supabase session rather than trusting a client-supplied user ID.

# 14. Local installation and configuration

## 14.1 Prerequisites

- A Node.js version supported by the Next.js version pinned in `package.json`.
- npm.
- A Supabase project with the required schema, pgvector, SQL functions, and RLS policies.
- A Google AI API key with access to the configured embedding and generation models.
- Git.

## 14.2 Clone and install

```bash
git clone https://github.com/Dishagupta275/GapFinder_AI.git
cd GapFinder_AI
npm ci
```

Use `npm ci` to install from the checked-in lockfile. Use `npm install` only when intentionally changing dependencies or updating the lockfile.

## 14.3 Environment variables

Create a `.env.local` file in the project root using `.env.example` as a template:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
GOOGLE_GENERATIVE_AI_API_KEY=YOUR_GOOGLE_AI_API_KEY
GEMINI_MODEL=gemini-flash-lite-latest
```

Replace every placeholder with the value for your own environment. Do not commit `.env.local`, API keys, database secrets, uploaded study material, or user data. Keep the Google AI key server-side and do not prefix it with `NEXT_PUBLIC_`.

## 14.4 Start development server

```bash
npm run dev
```

Open <http://localhost:3000> in a browser.

## 14.5 Quality checks

```bash
npm run lint
npm run build
```

The current `package.json` exposes `dev`, `build`, `start`, and `lint` scripts but does not define a dedicated `test` script. A successful lint or build does not confirm that database-backed flows work end to end; use the smoke-test checklist in Section 17.

## 14.6 Database setup note

The repository does not include a complete SQL migration/schema export. For a fresh environment, create or export a version-controlled migration containing table definitions, vector dimensions, indexes, foreign keys, RPC functions, and RLS policies. Compare its signatures with the code under `src/app/api/` before using the new environment.

# 15. Deployment and demo guidance

The repository README lists the live demo at <https://gap-finder-ai-seven.vercel.app>. The demo account email is `demo@gapfinder.app`; use the sign-in-as-demo option when available rather than sharing or embedding a password in documentation.

For deployment:

1. Configure all required environment variables in the hosting provider.
2. Ensure the production Supabase project has the expected schema, RPC functions, and RLS policies.
3. Confirm Gemini model access and quota for the configured account.
4. Run `npm run lint` and `npm run build` before deployment.
5. Use a non-sensitive sample syllabus and notes to test the complete flow on the deployed URL.
6. Verify upload, topic mapping, question generation, submission, gap report, revision plan, explanation, focused retake, chart updates, and document deletion.
7. Do not preload private documents into a shared demo account.

This document does not certify that the live demo is currently available or that a new deployment has passed these checks; hosting and API availability can change.

# 16. Security, privacy, and reliability

## Authentication and authorization

- Server routes should obtain the authenticated identity from the Supabase session.
- RLS must be enabled and correctly configured for every user-owned table.
- Never rely only on hidden UI controls or client-side checks to isolate user data.

## Secrets and configuration

- Keep the Google AI API key in server-side environment configuration.
- Do not commit `.env.local` or credentials to Git.
- Avoid printing complete API keys in logs or error reports.

## AI and source trust

- Uploaded text is untrusted input. The prompts instruct the model not to follow instructions embedded in retrieved excerpts.
- Generated schemas and citation references are validated before use where implemented.
- Valid citation provenance does not eliminate hallucination or guarantee entailment; educational outputs should be reviewed.

## Destructive operations

- Check foreign-key cascades and dependent-record cleanup before deleting documents or regenerating topics.
- Test destructive flows with disposable sample data first.

## Shared demo account

The README identifies the demo as shared. Do not upload private, sensitive, proprietary, or personally identifying study documents to it.

# 17. Testing and acceptance criteria

## 17.1 Functional smoke test

- [ ] Sign in and sign out successfully.
- [ ] Upload a text-based PDF, TXT, or Markdown file smaller than 10 MB.
- [ ] Confirm the document appears in the dashboard and chunk indexing completes.
- [ ] Generate a topic map from syllabus content and check that topic names are relevant.
- [ ] Upload notes containing material for at least two topics.
- [ ] Generate a quiz and confirm each valid question has four options, one correct answer, an explanation, and a source label.
- [ ] Submit the quiz and verify grading and feedback.
- [ ] Compare each topic status with the actual answers and thresholds.
- [ ] Generate a plan with a small daily time value; test an exam-date case as well.
- [ ] Ask the explanation assistant about a concept covered in the notes and verify the cited sources.
- [ ] Ask a question not supported by the notes and verify a refusal rather than an invented answer.
- [ ] Start and complete a retake targeting weak or medium topics.
- [ ] Complete multiple attempts and verify progress chart updates.
- [ ] Delete a disposable test document and verify only the intended data is removed.
- [ ] Check that a second user cannot access the first user's records.

## 17.2 RAG-specific checks

- Retrieved source IDs passed to the model must come from the actual retrieval result.
- Invalid or unrecognized source tags must not be displayed as valid citations.
- Questions should be answerable from their referenced chunk and must stay within the supplied material.
- Explanation behavior should refuse when evidence is insufficient.
- Retrieval should be checked for topic relevance, not merely for a non-empty result.

## 17.3 Build and regression checks

Run `npm run lint` and `npm run build` after changes. When changing chunking, vector dimensions, RLS, foreign keys, scoring logic, or API payloads, repeat the related smoke tests. The current project does not provide a dedicated automated test script in `package.json`.

# 18. Limitations and risks

| Limitation or risk | Consequence | Mitigation or next step |
|---|---|---|
| No OCR for scanned PDFs | Image-only PDFs may yield no usable text | Add OCR or ask users to upload text-based files |
| Nearest-topic assignment without a documented minimum similarity cut-off | A chunk can be assigned to a topic even when the match is weak | Add a similarity threshold and an unassigned state |
| Citation validation verifies reference provenance, not semantic entailment | A cited output can still misinterpret its source | Add evidence checks and human-reviewed evaluations |
| Few questions per topic | Status estimates can be unstable | Increase questions per topic and expose sample size/confidence |
| Topic map regeneration can affect dependent data | Re-indexing may remove linked quiz history, depending on foreign keys | Preserve history or confirm cascades before regeneration |
| Provider model changes, quotas, and transient errors | Generation can fail or become slower | Maintain model fallback, retries, monitoring, and clear user-facing errors |
| Database DDL not checked in | Recreating the service is harder and can lead to schema drift | Add reviewed SQL migrations and a seed procedure |
| No dedicated automated test script | Regression detection depends on manual checks and build/lint | Add unit, integration, and retrieval-evaluation tests |
| Shared demo account | Demo data can be changed by other users | Keep demo data non-sensitive and refresh it as needed |

# 19. Future enhancements

## Retrieval and grounding

- Add hybrid retrieval (vector plus keyword search), reranking, and relevance thresholds.
- Split content by headings and semantic boundaries rather than character length alone.
- Add an evaluation set for retrieval quality and question answerability.
- Consider a semantic entailment verifier for high-value generated content.

## Learning diagnosis

- Add difficulty levels and more questions per topic.
- Consider sample-size-aware confidence labels and recency-weighted scores across attempts.
- Track time-to-answer and repeated misconceptions.
- Recalculate the revision plan automatically after each new attempt.

## Product and accessibility

- Add OCR for scanned PDFs and broader document formats.
- Add multilingual explanations and more accessible quiz controls.
- Add reminders or spaced-repetition scheduling.
- Add teacher/class analytics only with an appropriate role and privacy model.

## Engineering and operations

- Check in SQL migrations and seed/demo setup scripts.
- Add automated unit tests for chunking, citation validation, and gap calculations.
- Add integration tests for authenticated end-to-end flows.
- Add rate limits, per-user upload quotas, and operational logging.
- Migrate session middleware to the recommended Next.js mechanism when appropriate for the pinned version.

# 20. Conclusion

GapFinder AI turns a student's own study materials into a repeatable learning cycle: ingest content, map topics, test understanding, diagnose weak areas, and prioritize revision. Its central design principle is to retrieve source material before generating content and to validate the source references used by the model. This makes the workflow more traceable than a generic quiz generator, while still requiring careful evaluation of retrieval relevance, generated content, scoring confidence, and database security.

# 21. Appendix

## 21.1 Key terms

| Term | Meaning in this project |
|---|---|
| Chunk | A portion of extracted text stored for retrieval |
| Embedding | A vector representation used to compare semantic similarity |
| pgvector | PostgreSQL extension for vector storage and similarity operations |
| RAG | Retrieval-augmented generation: retrieve evidence before generating an answer |
| Source reference | An ID/tag linking generated content to an actual retrieved chunk |
| Topic gap | A heuristic label inferred from the learner's latest relevant quiz attempt |
| RLS | Row-level security policies that restrict which rows a user can access |

## 21.2 Project references

- Repository: <https://github.com/Dishagupta275/GapFinder_AI>
- Live demo listed in repository README: <https://gap-finder-ai-seven.vercel.app>
- Existing README: <https://github.com/Dishagupta275/GapFinder_AI/blob/main/README.md>
- Architecture guide: <https://github.com/Dishagupta275/GapFinder_AI/blob/main/docs/ARCHITECTURE.md>
- Development guide: <https://github.com/Dishagupta275/GapFinder_AI/blob/main/docs/DEVELOPMENT.md>

## 21.3 Items to confirm before formal submission

These are environment/operations checks, not missing prose in this document:

- Confirm that the live demo is currently reachable and that its demo sign-in flow works.
- Confirm successful `npm run lint` and `npm run build` on the version being submitted.
- Confirm the actual Supabase schema, foreign-key deletion rules, `match_chunks` and `assign_chunks_to_topics` definitions, and RLS policies.
- Confirm current Google Gemini model availability and quota for the deployed API key.
- Run the Section 17 end-to-end smoke test using non-sensitive sample data.
- Record the actual deployment URL and the date of final verification if the document is submitted for assessment.

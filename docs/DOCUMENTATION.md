# GapFinder AI
## An AI-Powered Learning Gap Detection and Personalized Revision System

### 1. Project Overview

**GapFinder AI** is an AI-powered learning assistant designed to help students identify knowledge gaps, evaluate their understanding of academic topics, and prepare personalized revision plans using their own study materials.

Traditional study methods often involve repeatedly reviewing entire chapters or solving generic practice questions without knowing which concepts require the most attention. GapFinder AI addresses this problem by analyzing a student's syllabus and notes, generating topic-specific diagnostic questions, evaluating quiz performance, and identifying areas that require further revision.

The system combines artificial intelligence, semantic search, vector embeddings, and a structured database to deliver a personalized learning experience. It uses a Retrieval-Augmented Generation (RAG) approach to ground generated questions and explanations in the student's uploaded learning materials.

The application is built using Next.js and TypeScript, with Supabase providing authentication and database services. Google's Gemini models support text embeddings and AI-powered content generation.

**Project goal:** To help students study more efficiently by identifying what they need to learn rather than simply encouraging them to study more.

### 2. Problem Statement

Students frequently face difficulties determining whether they have understood all the important concepts in a subject. Conventional revision methods have several limitations:

- Students may spend excessive time revising concepts they already understand.
- Weak concepts may remain unnoticed until an examination.
- Generic quizzes may contain questions unrelated to the student's syllabus.
- Students may struggle to prioritize topics when examination dates approach.
- Manually analyzing quiz results and preparing a revision timetable can be time-consuming.
- AI-generated explanations may contain unsupported information if they are not grounded in relevant study material.

There is a need for an intelligent learning system that can analyze a student's study material, assess topic-level understanding, identify weak areas, and recommend a focused revision strategy.

GapFinder AI addresses these challenges through a personalized, source-grounded learning workflow.

### 3. Objectives

The primary objectives of the project are:

1. To provide a platform for uploading and organizing academic study materials.
2. To extract meaningful topics from an uploaded syllabus.
3. To generate diagnostic questions based on relevant study notes.
4. To evaluate student responses and calculate topic-level performance.
5. To classify topics according to their observed performance.
6. To generate personalized revision plans based on identified learning gaps.
7. To provide explanations grounded in uploaded learning materials.
8. To support focused retakes for topics requiring additional practice.
9. To track quiz performance across attempts.
10. To use retrieval-based AI generation to improve the relevance and traceability of generated educational content.

### 4. Proposed Solution

GapFinder AI implements an integrated learning workflow.

First, the student uploads a syllabus and supporting study notes. The application extracts text from these documents, divides it into smaller chunks, and generates vector embeddings. These embeddings allow the application to retrieve relevant passages through semantic similarity search.

The syllabus is analyzed to identify the subject's topics. The student can then generate diagnostic quizzes using relevant passages from the uploaded notes.

After the student submits the quiz, the application evaluates the answers and calculates topic-level performance. Topics are categorized as strong, medium, weak, or untested according to the available results.

Using this information, the system generates a personalized revision plan that prioritizes topics requiring more attention. Students can also request explanations of concepts covered by their uploaded material, take focused retake quizzes, and review their progress.

The application therefore connects study-material ingestion, topic identification, diagnostic assessment, learning-gap analysis, and revision planning in one system.

### 5. Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Application framework, page routing, and server-side API routes |
| React | Interactive user interface |
| TypeScript | Type-safe application development |
| Tailwind CSS | User-interface styling |
| Supabase Auth | User authentication and session management |
| Supabase PostgreSQL | Persistent storage of application data |
| pgvector | Vector storage and similarity-based retrieval |
| Google Gemini API | AI-powered topic extraction, question generation, explanations, and revision-plan generation |
| Gemini Embedding Model | Conversion of text and queries into numerical vector representations |
| unpdf | Text extraction from PDF documents |
| Vercel | Hosting and deployment of the web application |

### 6. System Architecture

The application follows a client-server architecture in which the frontend communicates with Next.js API routes. The backend coordinates authentication, database operations, document processing, retrieval, and AI generation.

#### 6.1 Architecture Components

**1. Presentation Layer**

The presentation layer provides the interface through which students interact with the application. It includes the dashboard, login interface, document-upload controls, topic map, quiz interface, revision-plan form, explanation interface, retake interface, and progress visualization.

**2. Application Layer**

Next.js route handlers implement the application's backend operations. They process uploaded documents, communicate with AI services, retrieve database records, validate generated content, evaluate quiz submissions, and create revision plans.

**3. Authentication Layer**

Supabase Auth manages user authentication and sessions. Server-side API routes check the authenticated user before performing protected operations.

**4. Database Layer**

Supabase PostgreSQL stores document metadata, extracted text chunks, topic information, quiz questions, submitted answers, and revision plans.

**5. Vector Retrieval Layer**

The pgvector extension stores embeddings and supports semantic similarity search. The database function `match_chunks` retrieves relevant text chunks for a topic or user question.

**6. AI Processing Layer**

Google Gemini models are used to generate structured content from relevant source material. These operations include topic extraction, diagnostic question generation, explanations, and revision-plan generation.

#### 6.2 High-Level Architecture Diagram

```text
                 STUDENT
                    |
                    v
          Next.js / React UI
                    |
                    v
           Next.js API Routes
                    |
          +---------+----------+
          |         |          |
          v         v          v
     Supabase    Gemini AI   Document
       Auth        API       Processing
          |         |          |
          |         v          |
          |    Text Generation |
          |    and Embeddings  |
          |         |          |
          +---------+----------+
                    |
                    v
           Supabase PostgreSQL
                    |
                    v
             pgvector Search
                    |
                    v
          Relevant Study Material
                    |
                    v
       Questions, Explanations,
       Gap Reports and Study Plans
```

### 7. Core Modules

#### 7.1 User Authentication

The application uses Supabase Auth to manage user sessions.

Authentication is important because uploaded documents, topics, quizzes, and study plans belong to individual users.

Protected API operations check the authenticated session before accessing user-specific information. Database Row Level Security (RLS) policies must also be configured correctly to enforce data isolation.

#### 7.2 Document Upload and Processing

The document-processing module allows students to upload academic materials under different categories:

- **Syllabus:** Defines the topics and concepts to be studied.
- **Notes:** Provides the learning material used for question generation and explanations.
- **Past papers:** Provides additional examination-related reference material.

The current application supports PDF, TXT, and Markdown/text files. The upload endpoint enforces a 10 MB file-size limit.

The processing workflow consists of the following steps:

1. Receive the uploaded document.
2. Identify the document type.
3. Extract readable text.
4. Divide the text into smaller chunks.
5. Generate embeddings for the chunks.
6. Store document metadata and chunk content.
7. Associate chunks with available topics where applicable.

For PDF documents, the application uses the `unpdf` library to extract text and preserve page-related source information where available.

The current implementation does not include OCR for scanned, image-only PDFs. Such documents must contain extractable text to be processed successfully.

#### 7.3 Text Chunking

Large documents are divided into smaller text sections called chunks.

Processing an entire textbook or a lengthy set of notes in one request can be inefficient. Smaller chunks allow the retrieval system to identify the portions most relevant to a particular question.

The chunking helper currently targets approximately 900 characters per chunk, with an overlap of approximately 150 characters.

**Example:**

```text
Original study material
          |
          v
      Text Chunk 1
          |
          v
      Text Chunk 2
          |
          v
      Text Chunk 3
```

Overlapping adjacent chunks helps preserve context when an important definition or explanation crosses a chunk boundary.

Each chunk also retains source metadata, allowing the application to identify where retrieved material originated.

#### 7.4 Embedding Generation

An embedding is a numerical representation of text that helps a system compare semantic similarity.

GapFinder AI uses Google's `gemini-embedding-001` model to generate embeddings with an output dimensionality of 768.

For example, the following questions have different wording but may refer to similar concepts:

- What is the purpose of normalization in DBMS?
- Why do relational databases use normalization?

Semantic embeddings help the retrieval system recognize this conceptual similarity.

The generated vectors are stored in the Supabase database alongside the associated text chunks.

When a student asks a question or the application searches for material related to a topic, the query is embedded and compared with the stored vectors.

#### 7.5 Syllabus Topic Extraction

The topic-generation module analyzes the uploaded syllabus and extracts a structured list of study topics.

The application sends syllabus text to Gemini and requests a structured response containing the identified topics.

The resulting topic records are stored in Supabase. Topic embeddings are then generated so that study-material chunks can be associated with relevant topics.

The application uses the `assign_chunks_to_topics` database function for chunk-to-topic assignment.

The topic map becomes the foundation for diagnostic quizzes, gap analysis, and personalized revision planning.

### 8. Retrieval-Augmented Generation (RAG)

Retrieval-Augmented Generation is one of the central technical components of GapFinder AI.

RAG combines information retrieval with language-model generation. Instead of relying entirely on a model's general knowledge, the application retrieves relevant passages from the student's indexed learning materials and supplies those passages as context for generation.

#### 8.1 Why RAG Is Used

A general-purpose AI model may generate a technically plausible answer that is unrelated to a student's syllabus or unsupported by their notes.

RAG helps address this issue by retrieving material relevant to the student's actual study content.

The main advantages include:

- Greater relevance to uploaded learning material.
- Support for syllabus-oriented questions.
- Traceability through source references.
- Reduced reliance on unsupported, general-purpose generation.
- A foundation for personalized question generation and explanations.

RAG does not guarantee factual correctness, but it provides a mechanism for grounding generated content in identifiable source material.

#### 8.2 RAG Workflow

```text
Student Uploads Notes
          |
          v
     Text Extraction
          |
          v
    Text Chunking
          |
          v
  Embedding Generation
          |
          v
 Store in Supabase + pgvector
          |
          v
Student Query or Topic
          |
          v
  Query Embedding
          |
          v
  match_chunks Function
          |
          v
 Retrieve Relevant Chunks
          |
          v
 Pass Context to Gemini
          |
          v
 Generate Structured Output
          |
          v
 Validate Source References
          |
          v
 Display Grounded Result
```

#### 8.3 Retrieval Process

The retrieval process works as follows:

1. The application receives a topic or question.
2. It generates an embedding for the query.
3. The query embedding is passed to the database retrieval function.
4. The database performs vector similarity search against stored chunk embeddings.
5. Relevant chunks are returned to the application.
6. The application supplies the retrieved text to Gemini.
7. The model generates the requested structured response.
8. The application validates the returned source references before using them.

The `match_chunks` function performs the vector retrieval operation. It accepts the query embedding, a match count, and an optional topic filter as required by the application.

#### 8.4 Source Validation

Retrieved passages are assigned temporary identifiers, such as `c1` and `c2`, before being included in the generation prompt.

When the model generates a question or explanation, it is expected to reference the relevant retrieved material.

The backend validates these references against the chunks supplied to the model. For quiz generation, questions with invalid source references are discarded.

The application can then display source labels associated with the stored chunks.

This provides traceability between generated educational content and the original study material.

However, validating a source identifier does not prove that every statement is fully supported by the referenced passage. Semantic correctness still requires evaluation.

### 9. Diagnostic Quiz Generation

The diagnostic quiz module evaluates a student's understanding of the topics extracted from their syllabus.

The quiz-generation endpoint is:

`POST /api/quiz/generate`

The workflow is:

1. Retrieve the user's topic map.
2. Identify topics for which supporting study material is available.
3. Retrieve relevant note chunks for those topics.
4. Send the retrieved material to Gemini.
5. Request structured multiple-choice questions.
6. Validate question fields, answer options, and source references.
7. Shuffle the answer-option order and adjust the correct-answer index.
8. Store the generated quiz and questions in Supabase.

Generated questions are designed to contain four answer options, one correct answer, and an explanation.

The application uses the retrieved study material as the basis for its questions rather than relying exclusively on a generic question bank.

Topics without suitable note material may be skipped during question generation.

#### 9.1 Quiz Submission and Evaluation

After completing the quiz, the student submits their answers.

The submission endpoint is:

`POST /api/quiz/:id/submit`

The backend compares each submitted answer with the stored correct-answer index.

It records the submitted responses and their correctness in the database.

The application can then display the student's results, explanations, and source information.

Because answer correctness is evaluated by application logic against stored answers, the grading calculation does not depend on the language model making a new judgment about every submitted response.

### 10. Learning Gap Detection

Learning gap detection is the central analytical feature of GapFinder AI.

After a student completes a quiz, the application calculates topic-level performance to identify areas requiring further revision.

The gap-classification logic is implemented in `src/lib/gaps.ts`.

#### 10.1 Classification Categories

| Category | Accuracy threshold | Interpretation |
|---|---|---|
| Strong | 80% or above | The student performed well on the available questions. |
| Medium | 50% or above but below 80% | The student demonstrates partial understanding and may benefit from revision. |
| Weak | Below 50% | The student needs additional practice and revision. |
| Untested | No answered questions for the topic | There is insufficient answer data to evaluate the topic. |

#### 10.2 Accuracy Calculation

Topic accuracy is calculated using the following formula:

\[
\text{Topic Accuracy} =
\frac{\text{Number of Correct Answers}}
{\text{Number of Answered Questions}}
\times 100
\]

**Example:**

Suppose a student answers 8 questions about operating systems and gets 3 correct.

\[
\text{Accuracy} = \frac{3}{8}\times100=37.5\%
\]

Since the accuracy is below 50%, the topic is classified as weak.

This classification indicates that the student should prioritize the topic for further revision.

#### 10.3 Use of Quiz Attempts

The current gap-analysis implementation searches quiz attempts from newest to oldest and uses the most recent attempt containing answered questions for each topic.

It also identifies incorrectly answered questions from the selected attempt.

This allows the application to highlight areas where the student experienced difficulty.

The resulting categories should be interpreted as indicators of observed quiz performance rather than definitive proof of mastery. In particular, classifications based on only one or two questions may be unreliable.

### 11. Personalized Revision Planning

The revision-planning module converts the gap report into a structured study schedule.

The endpoint is:

`POST /api/plan/generate`

The student can provide the amount of time available for daily study and, optionally, an examination date.

The application uses the available topic statuses and performance information to determine how study effort should be distributed.

#### 11.1 Revision Prioritization

The current implementation assigns the following relative weights:

| Topic status | Relative weight |
|---|---:|
| Weak | 3 |
| Medium | 2 |
| Untested | 2 |
| Strong | 0.5 |

Weak topics receive the greatest relative weight, while strong topics receive less.

Untested topics also receive attention because the application does not have enough answer data to establish the student's understanding of them.

These weights are scheduling heuristics, not measurements of the exact time required to master a topic.

#### 11.2 Plan Generation Workflow

1. Retrieve the student's available quiz results.
2. Calculate the topic-level gap report.
3. Determine the requested study duration and scheduling period.
4. Allocate relative study effort across the topics.
5. Supply relevant topic information and missed questions to Gemini.
6. Generate structured topic-specific revision actions.
7. Store the resulting revision plan in Supabase.

The implementation bounds daily study time between 0.5 and 12 hours. The default planning period is seven days, and an optional examination date can adjust the schedule within the supported range of one to fourteen days.

The final plan helps students prioritize weak concepts while maintaining some revision of stronger topics.

### 12. Explain-This-Topic Assistant

GapFinder AI includes an explanation feature that answers questions using the student's indexed study material.

The endpoint is:

`POST /api/explain`

Unlike an unrestricted chatbot, this feature is designed to ground its explanations in retrieved source material.

#### Workflow

1. Receive the student's question.
2. Generate an embedding for the question.
3. Retrieve relevant chunks from the database.
4. Evaluate whether the retrieved evidence is sufficient.
5. Send the selected passages to Gemini.
6. Generate a structured response with source references.
7. Validate the references.
8. Return the supported explanation or decline to answer.

The implementation limits the selected context to at most five retrieved chunks and includes a similarity/coverage check before generation.

If the retrieved material does not adequately support an answer, the assistant can refuse to answer rather than inventing an explanation.

A refusal does not necessarily mean the question has no answer. It means the application did not find sufficient supporting evidence in the indexed material.

### 13. Focused Retake System

The retake feature helps students practice topics that need additional attention.

The application identifies topics currently classified as weak or medium and uses them to create a focused retake.

The main endpoints are:

- `POST /api/retake/start`
- `POST /api/retake/next`
- `POST /api/retake/answer`

The retake workflow allows the student to begin a new attempt, obtain the next question, and submit an answer.

The implementation targets three questions per selected topic and attempts to avoid reusing previously used source chunks when alternatives are available.

This feature supports a feedback loop in which students can revise difficult concepts, practice again, and track subsequent quiz performance.

### 14. Progress Tracking

GapFinder AI records quiz attempts and provides a progress visualization through its progress-chart component.

Progress tracking helps students review performance over multiple attempts rather than relying solely on a single diagnostic assessment.

The progress chart complements the topic-level gap report:

- **Progress history** shows how quiz-attempt scores change over time.
- **Gap analysis** identifies the most recent available performance for each topic.

These are related but distinct measurements. An overall quiz score may improve even when some individual topics remain weak.

### 15. Database Design

Supabase PostgreSQL is used to persist the application's information.

The application expects the following tables.

| Table | Purpose |
|---|---|
| `documents` | Stores uploaded-document metadata and document type. |
| `chunks` | Stores extracted text sections, embeddings, source labels, and topic associations. |
| `topics` | Stores topics extracted from the syllabus and their embeddings. |
| `quizzes` | Stores quiz and retake records. |
| `questions` | Stores generated questions, answer options, correct-answer information, explanations, and source relationships. |
| `answers` | Stores student responses and correctness information. |
| `plans` | Stores generated revision-plan records. |

#### 15.1 Vector Database Support

The application uses pgvector for semantic search.

The embedding configuration requests 768-dimensional vectors. The database's vector columns and similarity-search implementation must use compatible dimensions.

The system relies on two important database functions:

**`match_chunks`**

Performs similarity-based retrieval over stored text chunks.

**`assign_chunks_to_topics`**

Associates chunks with the available topics using their stored vector representations.

#### 15.2 Database Security

Row Level Security (RLS) is important for protecting student information.

The database policies must ensure that authenticated users can access only the records they are authorized to use. Foreign-key relationships and deletion behavior must also be configured consistently with the application's data model.

The application checks authenticated sessions in protected routes, but authentication alone is not a substitute for correctly configured database authorization.

**Implementation note:** The project repository does not currently include a complete checked-in SQL migration or schema export. The table descriptions above document the application's expected data model; they are not a substitute for the actual database definitions, indexes, constraints, RLS policies, or function signatures.

### 16. API Reference

The following table summarizes the application's principal backend endpoints.

| Method | Endpoint | Function |
|---|---|---|
| POST | `/api/upload` | Uploads and processes a study document. |
| POST | `/api/topics/generate` | Extracts topics from uploaded syllabus material. |
| POST | `/api/quiz/generate` | Generates a diagnostic quiz. |
| POST | `/api/quiz/:id/submit` | Evaluates and records submitted quiz answers. |
| POST | `/api/retake/start` | Starts a focused retake. |
| POST | `/api/retake/next` | Retrieves or generates the next retake question. |
| POST | `/api/retake/answer` | Records a retake answer. |
| POST | `/api/plan/generate` | Generates a personalized revision plan. |
| POST | `/api/explain` | Answers a question using retrieved study material. |
| DELETE | `/api/documents/:id` | Deletes an owned document. |

These are internal application routes. They are intended to be used with the application's authentication and request-handling flow rather than treated as a separately versioned public API.

### 17. Security and Reliability Considerations

The project incorporates several mechanisms intended to improve the reliability and safety of its AI-powered workflow.

**Authentication:** Protected operations check the signed-in user's session.

**Database authorization:** Supabase RLS policies should enforce user-level access restrictions.

**Source grounding:** Quiz generation and explanations use retrieved study material.

**Structured output:** Gemini is asked to return data in the expected JSON format.

**Reference validation:** Generated source references are checked against the retrieved chunks.

**Deterministic grading:** Quiz correctness is calculated against stored correct answers.

**Evidence-based explanations:** The explanation feature can decline questions that are not sufficiently supported by retrieved material.

These mechanisms reduce certain classes of errors, but they do not eliminate all risks associated with AI generation.

Generated questions, explanations, and study recommendations may still contain inaccuracies. The system should therefore be treated as a learning aid rather than an infallible educational authority.

API credentials must be stored in environment variables and must not be exposed in client-side code or committed to the repository.

### 18. Installation and Setup

The following steps describe the general process for running the project locally.

#### Prerequisites

- Node.js compatible with the version of Next.js used by the project.
- npm.
- A configured Supabase project.
- A Google AI API key with access to the required Gemini models.

#### Step 1: Clone the Repository

```bash
git clone https://github.com/Dishagupta275/GapFinder_AI.git
cd GapFinder_AI
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Configure Environment Variables

Create a `.env.local` file in the project root.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
GOOGLE_GENERATIVE_AI_API_KEY=YOUR_GOOGLE_AI_API_KEY
GEMINI_MODEL=gemini-flash-lite-latest
```

Replace the placeholders with the values from your own services.

The selected generation model must be available to the configured Google AI API project. Model availability and quotas may change.

Never commit real credentials to GitHub. The Gemini API key must remain server-side.

#### Step 4: Configure Supabase

Configure the required tables, pgvector extension, database functions, indexes, foreign keys, and RLS policies.

The embedding dimensions must match the application's 768-dimensional embedding configuration.

Because the repository does not currently contain a complete database migration, obtain the matching schema from the existing Supabase project or create and validate a migration before setting up a new environment.

#### Step 5: Start the Application

```bash
npm run dev
```

Open the application at:

`http://localhost:3000`

#### Step 6: Run Validation Commands

```bash
npm run lint
npm run build
```

These commands help identify linting and production-build problems. They do not replace end-to-end testing against a configured database and AI provider.

### 19. Testing and Validation

A complete validation process should examine each major stage of the learning workflow.

| Test area | Expected result |
|---|---|
| Authentication | A user can sign in and access protected functionality. |
| Document upload | Supported files are processed and their text chunks are stored. |
| Topic extraction | Topics are generated from readable syllabus content. |
| Embeddings | Vectors are stored with compatible dimensions. |
| Retrieval | Relevant source chunks can be retrieved for a query or topic. |
| Quiz generation | Valid questions are created from relevant study material. |
| Quiz submission | Submitted answers are evaluated against stored correct answers. |
| Gap detection | Topic categories match the calculated performance thresholds. |
| Revision planning | A plan is generated using the available topic statuses and study-time settings. |
| Explanation assistant | Supported questions receive cited explanations; unsupported questions can be declined. |
| Retake workflow | The student can start a retake and answer its questions. |
| Progress tracking | Recorded attempts appear in the progress visualization. |
| Data isolation | One user cannot access another user's private records. |
| Document deletion | Only the intended user's document and associated records are affected. |

Testing should include normal cases and edge cases, such as empty uploads, missing notes, unsupported file content, insufficient retrieval results, model errors, and topics with very few quiz responses.

### 20. Known Limitations

The current implementation has several limitations.

**1. No OCR for scanned documents**

Scanned PDFs containing only images cannot be processed as ordinary selectable text.

**2. Dependence on AI provider availability**

Generation may fail because of unavailable models, quota restrictions, rate limits, or temporary provider outages.

**3. Retrieval limitations**

Semantic similarity does not guarantee that the retrieved passages contain all the information needed to answer a question.

**4. Topic assignment limitations**

Chunks are associated with their nearest topic, but the current assignment process does not apply a minimum similarity threshold. Some chunks may therefore be associated with only loosely related topics.

**5. Uncertain mastery estimates**

A topic's classification may be unreliable when only a small number of questions have been answered.

**6. No guarantee of semantic correctness**

Valid source references establish traceability but do not independently prove that generated claims are entailed by the cited material.

**7. Database setup requirements**

A complete database migration and schema export are not currently included in the repository, making reproducible database setup more difficult.

**8. Shared demonstration data**

If the demo account is shared with other users, its contents may be modified or deleted. Confidential documents should not be uploaded to a shared account.

### 21. Future Enhancements

The following improvements could extend the project's functionality and reliability.

**1. Automated database migrations**

Add version-controlled SQL migrations for tables, indexes, foreign keys, database functions, and RLS policies.

**2. Improved retrieval quality**

Introduce minimum similarity thresholds, heading-aware chunking, hybrid keyword-and-vector retrieval, or reranking to improve the relevance of retrieved material.

**3. OCR support**

Add optical character recognition to support scanned textbooks and handwritten or image-based notes where appropriate.

**4. Adaptive difficulty**

Generate questions at different difficulty levels and adapt future quizzes based on the student's performance.

**5. Spaced repetition**

Schedule revision sessions according to previous performance and the time elapsed since the student last practiced a topic.

**6. Stronger evaluation**

Develop automated tests for chunking, retrieval, quiz scoring, gap classification, source-reference validation, and database authorization.

**7. Better diagnostic confidence**

Track the number of questions answered per topic and use sample size when communicating confidence in a topic's classification.

**8. Improved progress analytics**

Add topic-level progress comparisons, performance trends, and summaries of repeatedly missed concepts.

**9. Multilingual learning support**

Explore explanations and study-material processing in additional languages, subject to model and retrieval evaluation.

**10. Educator-oriented features**

Explore teacher dashboards and class-level analytics while maintaining strict access controls for student information.

These enhancements are potential future directions, not claims about functionality already implemented.

### 22. Conclusion

GapFinder AI demonstrates how AI-powered generation, semantic retrieval, and performance analysis can be combined to create a personalized study assistant.

By processing a student's own study materials, extracting syllabus topics, generating diagnostic quizzes, and analyzing topic-level results, the application helps students identify areas requiring further attention.

Its RAG-based architecture connects generated educational content to retrieved source material, while Supabase provides authentication and persistent storage. The gap-analysis module translates quiz performance into actionable categories, and the revision-planning module uses those categories to prioritize study effort.

The project brings together modern web development, database-backed application design, vector search, and generative AI in a practical educational use case.

Its broader objective is to make revision more focused, evidence-based, and responsive to each student's learning needs.

**GapFinder AI — Study smarter by finding your learning gaps.**
import { createClient } from "@/lib/supabase/server";
import { computeGaps } from "@/lib/gaps";
import UploadForm from "@/components/UploadForm";
import TopicMapButton from "@/components/TopicMapButton";
import StartQuizButton from "@/components/StartQuizButton";
import PlanForm from "@/components/PlanForm";
import DeleteDocButton from "@/components/DeleteDocButton";
import ExplainBox from "@/components/ExplainBox";
import ProgressChart from "@/components/ProgressChart";

const order: Record<string, number> = { weak: 0, medium: 1, untested: 2, strong: 3 };

type PlanDay = {
  day: number;
  sessions: { topic: string; minutes: number; focus: string; status: string; sources: string[] }[];
};

function DocumentGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3.75h7l4 4V20.25H7z" />
      <path d="M14 3.75v4h4M10 12h5M10 15.5h5" />
    </svg>
  );
}

function TopicGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="2.2" />
      <circle cx="5.5" cy="18" r="2.2" />
      <circle cx="18.5" cy="18" r="2.2" />
      <path d="M10.8 7 6.7 15.9M13.2 7l4.1 8.9M7.8 18h8.4" />
    </svg>
  );
}

function FocusGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ProgressGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5h16" />
      <path d="m5.5 15 4.2-4.2 3.1 2.6 5.7-6" />
      <path d="M14.8 7.4h3.7v3.7" />
    </svg>
  );
}

function UploadGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15.5V4.75M7.75 9 12 4.75 16.25 9" />
      <path d="M5 15.75v3.5h14v-3.5" />
    </svg>
  );
}

function SparkGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z" />
      <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
    </svg>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: docs }, { data: topics }, { gaps, attempts }, { data: plans }] =
    await Promise.all([
      supabase
        .from("documents")
        .select("id,title,kind,created_at,chunks(count)")
        .order("created_at", { ascending: false }),
      supabase
        .from("topics")
        .select("id,name,description,chunks(count)")
        .order("position"),
      computeGaps(supabase),
      supabase
        .from("plans")
        .select("plan,exam_date,hours_per_day,created_at")
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

  const plan = plans?.[0]?.plan as { days: PlanDay[] } | undefined;
  const count = (rel: unknown) => (rel as { count: number }[])?.[0]?.count ?? 0;
  const sortedGaps = [...gaps].sort((a, b) => order[a.status] - order[b.status]);
  const weakCount = gaps.filter((g) => g.status === "weak" || g.status === "medium").length;
  const documentCount = docs?.length ?? 0;
  const topicCount = topics?.length ?? 0;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">G</div>
          <div>
            <p className="brand-name">GapFinder AI</p>
            <p className="brand-subtitle">Your personal study workspace</p>
          </div>
        </div>

        <div className="header-actions">
          <nav className="header-nav" aria-label="Dashboard sections">
            <a href="#materials">Materials</a>
            <a href="#topics">Topics</a>
            <a href="#insights">Insights</a>
            <a href="#revision-plan">Study plan</a>
          </nav>
          <form action="/auth/signout" method="post" className="header-actions">
            <span className="account-label" title={user?.email ?? undefined}>{user?.email}</span>
            <button className="btn btn-secondary" type="submit">Sign out</button>
          </form>
        </div>
      </header>

      <section className="hero-banner">
        <div className="hero-content">
          <p className="hero-eyebrow">Your learning, made clearer</p>
          <h1 className="hero-title">Find the gaps.<br />Close them with a plan.</h1>
          <p className="hero-description">
            Learn from your own syllabus and notes. Map your topics, find what needs more
            attention, and turn your next study session into a focused plan.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#materials">Add study material <span aria-hidden="true">↗</span></a>
            <a className="btn btn-secondary" href="#diagnostic">Start a diagnostic quiz</a>
          </div>
        </div>
      </section>

      <section className="stat-grid" aria-label="Study overview">
        <article className="stat-card">
          <div className="stat-icon"><DocumentGlyph /></div>
          <div>
            <div className="stat-value">{documentCount}</div>
            <div className="stat-label">Study documents</div>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon slate"><TopicGlyph /></div>
          <div>
            <div className="stat-value">{topicCount}</div>
            <div className="stat-label">Mapped topics</div>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon amber"><FocusGlyph /></div>
          <div>
            <div className="stat-value">{weakCount}</div>
            <div className="stat-label">Topics to revisit</div>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon green"><ProgressGlyph /></div>
          <div>
            <div className="stat-value">{attempts.length}</div>
            <div className="stat-label">Quiz attempts</div>
          </div>
        </article>
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-column">
          <section id="materials" className="section-card">
            <div className="section-head">
              <div className="section-head-main">
                <p className="section-kicker">Step 01 · Build your library</p>
                <h2 className="section-title">Add study material</h2>
                <p className="section-description">
                  Upload a syllabus, your notes, or a past paper to give your study workspace context.
                </p>
              </div>
            </div>
            <UploadForm />
          </section>

          <section className="section-card">
            <div className="section-head">
              <div className="section-head-main">
                <p className="section-kicker">Your library</p>
                <h2 className="section-title">Your documents</h2>
                <p className="section-description">Materials currently available to your study assistant.</p>
              </div>
              <span className="status-pill untested">{documentCount} {documentCount === 1 ? "file" : "files"}</span>
            </div>
            {!docs?.length ? (
              <div className="empty-state">
                <p className="empty-state-title">Your library is ready for its first file</p>
                <p className="empty-state-copy">Upload a text-based PDF, TXT, or Markdown file above to get started.</p>
              </div>
            ) : (
              <ul className="document-list">
                {docs.map((d) => {
                  const chunkCount = count(d.chunks);
                  return (
                    <li key={d.id} className="document-row">
                      <div className="document-main">
                        <div className="document-icon"><DocumentGlyph /></div>
                        <div className="min-w-0">
                          <div className="document-title">{d.title}</div>
                          <div className="document-meta">
                            {d.kind.replace("_", " ")} · {chunkCount} {chunkCount === 1 ? "chunk" : "chunks"}
                          </div>
                        </div>
                      </div>
                      <div className="document-actions">
                        <DeleteDocButton id={d.id} title={d.title} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="dashboard-column">
          <section id="diagnostic" className="section-card">
            <div className="section-head">
              <div className="section-head-main">
                <p className="section-kicker">Step 03 · Check your understanding</p>
                <h2 className="section-title">Diagnostic quiz</h2>
                <p className="section-description">
                  Answer questions generated from your notes. Review explanations and source citations after submission.
                </p>
              </div>
            </div>
            <div className="section-content">
              <div className="upload-dropzone">
                <div className="upload-icon"><SparkGlyph /></div>
                <div className="upload-copy">
                  <div className="upload-file-name">Questions based on your material</div>
                  <div className="upload-file-hint">The quiz helps identify topics that deserve another look.</div>
                </div>
              </div>
              <StartQuizButton disabled={!topics?.length} weakCount={weakCount} />
            </div>
          </section>

          <section id="assistant" className="section-card">
            <div className="section-head">
              <div className="section-head-main">
                <p className="section-kicker">Study with context</p>
                <h2 className="section-title">Explain this topic</h2>
                <p className="section-description">
                  Ask about a concept. Answers are grounded in your uploaded notes and include supporting source excerpts.
                </p>
              </div>
            </div>
            <ExplainBox disabled={!docs?.length} />
          </section>
        </div>
      </div>

      <section id="topics" className="section-card section-after-grid">
        <div className="section-head">
          <div className="section-head-main">
            <p className="section-kicker">Step 02 · Organise your learning</p>
            <h2 className="section-title">Topic map</h2>
            <p className="section-description">
              Your syllabus becomes a connected view of the concepts you need to learn, with links to relevant study material.
            </p>
          </div>
          <div className="section-action">
            <TopicMapButton hasTopics={!!topics?.length} />
          </div>
        </div>
        {!topics?.length ? (
          <div className="empty-state">
            <p className="empty-state-title">No topic map yet</p>
            <p className="empty-state-copy">Upload a syllabus, then generate a topic map to organise what you need to learn.</p>
          </div>
        ) : (
          <ul className="topic-grid">
            {topics.map((t) => {
              const chunkCount = count(t.chunks);
              return (
                <li key={t.id} className="topic-row">
                  <div className="topic-row-top">
                    <span className="topic-name">{t.name}</span>
                    <span className="topic-count">{chunkCount} {chunkCount === 1 ? "chunk" : "chunks"}</span>
                  </div>
                  <p className="topic-description">{t.description}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section id="insights" className="section-card section-after-grid">
        <div className="section-head">
          <div className="section-head-main">
            <p className="section-kicker">Step 03 · Understand your results</p>
            <h2 className="section-title">Learning insights</h2>
            <p className="section-description">
              See which topics need attention and track how your quiz scores change over time.
              Topic status uses the latest available attempt for each topic.
            </p>
          </div>
          {attempts.length > 0 && (
            <span className="status-pill untested">{attempts.length} {attempts.length === 1 ? "attempt" : "attempts"} recorded</span>
          )}
        </div>

        {!attempts.length ? (
          <div className="empty-state">
            <p className="empty-state-title">Your insights will appear here</p>
            <p className="empty-state-copy">Complete a diagnostic quiz to see topic-level results and track your scores across attempts.</p>
          </div>
        ) : (
          <div className="insights-grid">
            <div className="gap-list">
              {sortedGaps.map((g) => {
                const percent = g.total ? Math.round((g.correct / g.total) * 100) : 0;
                return (
                  <article key={g.id} className="gap-row">
                    <div className="gap-row-top">
                      <span className="gap-topic">{g.name}</span>
                      <span className={`status-pill ${g.status}`}>{g.status}</span>
                    </div>
                    <div className="gap-bar-row">
                      <div
                        className="progress-track"
                        role="progressbar"
                        aria-label={`${g.name} accuracy`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                      >
                        <div className={`progress-fill ${g.status}`} style={{ width: `${percent}%` }} />
                      </div>
                      <span className="gap-percent">{g.total ? `${percent}%` : "n/a"}</span>
                    </div>
                    <p className="gap-reason">{g.reason}</p>
                  </article>
                );
              })}
            </div>

            <aside className="insights-side">
              <div className="insights-panel-heading">
                <div>
                  <h3 className="section-title">Progress across attempts</h3>
                  <p className="section-description">Your overall quiz score by attempt.</p>
                </div>
              </div>
              <div className="chart-wrap">
                <ProgressChart attempts={attempts} />
              </div>
              <ul className="attempt-list">
                {attempts.map((a, i) => (
                  <li key={a.quizId} className="attempt-item">
                    <span className="attempt-label">
                      <strong>Attempt {attempts.length - i}</strong>
                      <span className="muted">{new Date(a.at).toLocaleString("en-IN")}</span>
                    </span>
                    <span className="attempt-score">
                      {a.correct}/{a.total} · {Math.round((a.correct / a.total) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        )}
      </section>

      <section id="revision-plan" className="section-card section-after-grid">
        <div className="section-head">
          <div className="section-head-main">
            <p className="section-kicker">Step 04 · Turn insights into action</p>
            <h2 className="section-title">Personalised revision plan</h2>
            <p className="section-description">
              Generate a study schedule weighted toward the topics that need more practice.
            </p>
          </div>
        </div>

        <div className="section-content">
          <PlanForm disabled={!attempts.length} />
          {plan?.days?.length ? (
            <div className="plan-grid">
              {plan.days.map((day) => (
                <article key={day.day} className="plan-day">
                  <h3 className="plan-day-title">Day {day.day}</h3>
                  {day.sessions.map((s, i) => (
                    <div key={i} className="plan-session">
                      <div className="plan-session-top">
                        <span className="plan-session-title">{s.topic}</span>
                        <span className="plan-session-meta">
                          <span>{s.minutes} min</span>
                          <span className={`status-pill ${s.status}`}>{s.status}</span>
                        </span>
                      </div>
                      <p className="plan-session-focus">{s.focus}</p>
                      {!!s.sources?.length && (
                        <p className="source-label">Source: {s.sources.join("; ")}</p>
                      )}
                    </div>
                  ))}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-title">A focused plan starts with a quiz</p>
              <p className="empty-state-copy">Complete a diagnostic quiz first, then set your available study hours and optional exam date.</p>
            </div>
          )}
          <p className="small-copy">
            The plan is rebuilt from your latest quiz results. Retake the quiz, then regenerate it to refresh your study priorities.
          </p>
        </div>
      </section>

      <footer className="app-footer">GapFinder AI · Personalised learning, grounded in your own study material.</footer>
    </main>
  );
}

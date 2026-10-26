import { createClient } from "@/lib/supabase/server";
import { computeGaps } from "@/lib/gaps";
import UploadForm from "@/components/UploadForm";
import TopicMapButton from "@/components/TopicMapButton";
import StartQuizButton from "@/components/StartQuizButton";
import PlanForm from "@/components/PlanForm";
import DeleteDocButton from "@/components/DeleteDocButton";
import ExplainBox from "@/components/ExplainBox";
import ProgressChart from "@/components/ProgressChart";

const badge: Record<string, string> = {
  weak: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-800",
  strong: "bg-green-100 text-green-800",
  untested: "bg-gray-100 text-gray-700",
};

const bar: Record<string, string> = {
  weak: "bg-red-500",
  medium: "bg-amber-500",
  strong: "bg-green-500",
  untested: "bg-gray-300",
};

const order: Record<string, number> = { weak: 0, medium: 1, untested: 2, strong: 3 };

type PlanDay = {
  day: number;
  sessions: { topic: string; minutes: number; focus: string; status: string; sources: string[] }[];
};

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
          <div className="stat-icon" aria-hidden="true">▤</div>
          <div>
            <div className="stat-value">{documentCount}</div>
            <div className="stat-label">Study documents</div>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon slate" aria-hidden="true">◈</div>
          <div>
            <div className="stat-value">{topicCount}</div>
            <div className="stat-label">Mapped topics</div>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon amber" aria-hidden="true">◎</div>
          <div>
            <div className="stat-value">{weakCount}</div>
            <div className="stat-label">Topics to revisit</div>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon green" aria-hidden="true">↗</div>
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
              <span className="status-pill untested">{documentCount} files</span>
            </div>
            {!docs?.length ? (
              <div className="empty-state">
                <p className="empty-state-title">Your library is ready for its first file</p>
                <p className="empty-state-copy">Upload a text-based PDF, TXT, or Markdown file above to get started.</p>
              </div>
            ) : (
              <ul className="document-list">
                {docs.map((d) => (
                  <li key={d.id} className="document-row">
                    <div className="document-main">
                      <div className="document-icon" aria-hidden="true">DOC</div>
                      <div className="min-w-0">
                        <div className="document-title">{d.title}</div>
                        <div className="document-meta">{d.kind.replace("_", " ")} · {count(d.chunks)} text chunks</div>
                      </div>
                    </div>
                    <div className="document-actions">
                      <span className="document-count">{count(d.chunks)} chunks</span>
                      <DeleteDocButton id={d.id} title={d.title} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="topics" className="section-card">
            <div className="section-head">
              <div className="section-head-main">
                <p className="section-kicker">Step 02 · Organise your learning</p>
                <h2 className="section-title">Topic map</h2>
                <p className="section-description">
                  Your syllabus becomes a topic list that connects each concept to the relevant study material.
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
              <ul className="topic-list">
                {topics.map((t) => (
                  <li key={t.id} className="topic-row">
                    <div className="topic-row-top">
                      <span className="topic-name">{t.name}</span>
                      <span className="topic-count">{count(t.chunks)} chunks</span>
                    </div>
                    <p className="topic-description">{t.description}</p>
                  </li>
                ))}
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
                <div className="upload-icon" aria-hidden="true">✦</div>
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

          <section id="insights" className="section-card">
            <div className="section-head">
              <div className="section-head-main">
                <p className="section-kicker">Understand your results</p>
                <h2 className="section-title">Gap report</h2>
                <p className="section-description">
                  Topic statuses use your latest available quiz attempt for each topic.
                </p>
              </div>
            </div>

            {!attempts.length ? (
              <div className="empty-state">
                <p className="empty-state-title">Your insights will appear here</p>
                <p className="empty-state-copy">Complete a diagnostic quiz to see topic-level results and track scores across attempts.</p>
              </div>
            ) : (
              <>
                <div className="gap-list">
                  {sortedGaps.map((g) => (
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
                          aria-valuenow={g.total ? Math.round((g.correct / g.total) * 100) : 0}
                        >
                          <div
                            className={`progress-fill ${g.status}`}
                            style={{ width: `${g.total ? Math.round((g.correct / g.total) * 100) : 0}%` }}
                          />
                        </div>
                        <span className="gap-percent">
                          {g.total ? `${Math.round((g.correct / g.total) * 100)}%` : "n/a"}
                        </span>
                      </div>
                      <p className="gap-reason">{g.reason}</p>
                    </article>
                  ))}
                </div>

                <hr className="subtle-divider" />
                <div>
                  <h3 className="section-title">Progress across attempts</h3>
                  <p className="section-description">See how your overall quiz scores change over time.</p>
                  <div className="chart-wrap">
                    <ProgressChart attempts={attempts} />
                  </div>
                  <ul className="attempt-list">
                    {attempts.map((a, i) => (
                      <li key={a.quizId} className="attempt-item">
                        <span>
                          Attempt {attempts.length - i}
                          <span className="muted"> · {new Date(a.at).toLocaleString("en-IN")}</span>
                        </span>
                        <span className="attempt-score">
                          {a.correct}/{a.total} · {Math.round((a.correct / a.total) * 100)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </section>
        </div>

        <section id="revision-plan" className="section-card full-span">
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
              <div className="form-grid">
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
      </div>

      <footer className="app-footer">GapFinder AI · Personalised learning, grounded in your own study material.</footer>
    </main>
  );
}

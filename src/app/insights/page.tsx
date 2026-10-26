import { createClient } from "@/lib/supabase/server";
import { computeGaps } from "@/lib/gaps";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import ProgressChart from "@/components/ProgressChart";

const order: Record<string, number> = { weak: 0, medium: 1, untested: 2, strong: 3 };

export default async function InsightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { gaps, attempts } = await computeGaps(supabase);
  const sortedGaps = [...gaps].sort((a, b) => order[a.status] - order[b.status]);
  const needsWork = gaps.filter((g) => g.status === "weak" || g.status === "medium").length;
  const strong = gaps.filter((g) => g.status === "strong").length;
  const untested = gaps.filter((g) => g.status === "untested").length;
  const latest = attempts[0];
  const latestPercent = latest?.total ? Math.round((latest.correct / latest.total) * 100) : null;

  return (
    <main className="app-shell">
      <AppHeader email={user?.email} activePath="/insights" />
      <header className="workspace-heading">
        <p className="section-kicker">Understand your results</p>
        <h1 className="page-title">Learning insights</h1>
        <p className="page-description">A clearer view of topic confidence and quiz performance. Use this page to decide what to practise next—not as a final judgement of what you know.</p>
      </header>

      <section className="insight-summary-grid">
        <article className="insight-summary-card"><span className="status-pill weak">Needs practice</span><strong>{needsWork}</strong><p>Weak or developing topics</p></article>
        <article className="insight-summary-card"><span className="status-pill strong">Strong</span><strong>{strong}</strong><p>Topics with strong recent scores</p></article>
        <article className="insight-summary-card"><span className="status-pill untested">Untested</span><strong>{untested}</strong><p>Topics without an answered question</p></article>
        <article className="insight-summary-card insight-summary-featured"><span className="insight-score-label">Latest attempt</span><strong>{latestPercent === null ? "—" : `${latestPercent}%`}</strong><p>{latest ? `${latest.correct} correct out of ${latest.total}` : "Take a diagnostic quiz to establish a baseline."}</p></article>
      </section>

      <section className="section-card section-after-grid">
        <div className="section-head">
          <div className="section-head-main">
            <h2 className="section-title">Topic-by-topic confidence</h2>
            <p className="section-description">Status is calculated from the most recent quiz attempt containing questions for each topic. Small samples should be treated cautiously.</p>
          </div>
        </div>
        {!attempts.length ? (
          <div className="empty-state">
            <p className="empty-state-title">Your first diagnostic will establish a baseline</p>
            <p className="empty-state-copy">Complete a quiz to see topic-level accuracy and identify areas to revisit.</p>
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
                      <div className="progress-track" role="progressbar" aria-label={`${g.name} accuracy`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
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
              <div className="chart-wrap"><ProgressChart attempts={attempts} /></div>
              <ul className="attempt-list">
                {attempts.map((a, i) => (
                  <li key={a.quizId} className="attempt-item">
                    <span className="attempt-label"><strong>Attempt {attempts.length - i}</strong><span className="muted">{new Date(a.at).toLocaleString("en-IN")}</span></span>
                    <span className="attempt-score">{a.correct}/{a.total} · {Math.round((a.correct / a.total) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        )}
      </section>

      <section className="insight-footnote">
        <strong>How to read this report</strong>
        <p><span className="status-pill weak">Weak</span> Revisit the material and practise again. <span className="status-pill medium">Medium</span> Reinforce the topic. <span className="status-pill strong">Strong</span> Review occasionally. <span className="status-pill untested">Untested</span> Take questions before drawing conclusions.</p>
      </section>
      <AppFooter />
    </main>
  );
}

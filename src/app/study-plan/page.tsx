import { createClient } from "@/lib/supabase/server";
import { computeGaps } from "@/lib/gaps";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import PlanForm from "@/components/PlanForm";
import Link from "next/link";

type PlanDay = {
  day: number;
  sessions: { topic: string; minutes: number; focus: string; status: string; sources: string[] }[];
};

export default async function StudyPlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: plans }, { attempts }] = await Promise.all([
    supabase.from("plans").select("plan,exam_date,hours_per_day,created_at").order("created_at", { ascending: false }).limit(1),
    computeGaps(supabase),
  ]);
  const plan = plans?.[0]?.plan as { days: PlanDay[]; nDays?: number; hours?: number } | undefined;
  const latest = plans?.[0];

  return (
    <main className="app-shell">
      <AppHeader email={user?.email} activePath="/study-plan" />
      <header className="workspace-heading">
        <p className="section-kicker">Turn insights into action</p>
        <h1 className="page-title">Your revision plan</h1>
        <p className="page-description">Build a practical schedule around the time you have and the topics that need attention. Your plan can be regenerated after a new quiz attempt.</p>
      </header>

      <section className="study-plan-setup section-card">
        <div className="section-head">
          <div className="section-head-main">
            <h2 className="section-title">Plan your study time</h2>
            <p className="section-description">Set your available study hours and optional exam date to generate a personalised schedule.</p>
          </div>
        </div>
        {!attempts.length && (
          <div className="plan-prerequisite">
            <strong>Take a diagnostic quiz first.</strong>
            <span>The revision plan uses your topic-level results to decide what deserves more time.</span>
            <Link href="/materials" className="text-link">Review study materials ↗</Link>
          </div>
        )}
        <PlanForm disabled={!attempts.length} />
      </section>

      <section className="section-card section-after-grid">
        <div className="section-head">
          <div className="section-head-main">
            <p className="section-kicker">Your current schedule</p>
            <h2 className="section-title">Revision sessions</h2>
            <p className="section-description">{latest ? `Generated ${new Date(latest.created_at).toLocaleString("en-IN")}. Regenerate after a new attempt if your priorities change.` : "Your plan will appear here after you generate it."}</p>
          </div>
          {latest && <span className="status-pill untested">{latest.hours_per_day} h/day</span>}
        </div>
        {plan?.days?.length ? (
          <div className="plan-grid">
            {plan.days.map((day) => (
              <article key={day.day} className="plan-day">
                <h3 className="plan-day-title">Day {day.day}</h3>
                {day.sessions.map((s, i) => (
                  <div key={i} className="plan-session">
                    <div className="plan-session-top">
                      <span className="plan-session-title">{s.topic}</span>
                      <span className="plan-session-meta"><span>{s.minutes} min</span><span className={`status-pill ${s.status}`}>{s.status}</span></span>
                    </div>
                    <p className="plan-session-focus">{s.focus}</p>
                    {!!s.sources?.length && <p className="source-label">Source: {s.sources.join("; ")}</p>}
                  </div>
                ))}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-state-title">No revision schedule generated yet</p>
            <p className="empty-state-copy">Take a diagnostic quiz, choose your available hours, and generate your first plan.</p>
          </div>
        )}
      </section>

      <section className="materials-note">
        <span className="materials-note-mark" aria-hidden="true">i</span>
        <p>Time allocations are recommendations based on heuristic topic weights. Adjust sessions to fit your syllabus, deadlines, and personal pace.</p>
      </section>
      <AppFooter />
    </main>
  );
}

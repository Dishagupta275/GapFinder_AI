import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computeGaps } from "@/lib/gaps";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

function StatGlyph({ kind }: { kind: "documents" | "topics" | "focus" | "progress" }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (kind === "documents") return <svg viewBox="0 0 24 24" {...common} aria-hidden="true"><path d="M7 3.75h7l4 4v12.5H7z" /><path d="M14 3.75v4h4M10 12h5M10 15.5h5" /></svg>;
  if (kind === "topics") return <svg viewBox="0 0 24 24" {...common} aria-hidden="true"><circle cx="12" cy="5" r="2.2" /><circle cx="5.5" cy="18" r="2.2" /><circle cx="18.5" cy="18" r="2.2" /><path d="M10.8 7 6.7 15.9M13.2 7l4.1 8.9M7.8 18h8.4" /></svg>;
  if (kind === "focus") return <svg viewBox="0 0 24 24" {...common} aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></svg>;
  return <svg viewBox="0 0 24 24" {...common} aria-hidden="true"><path d="M4 19.5h16" /><path d="m5.5 15 4.2-4.2 3.1 2.6 5.7-6" /><path d="M14.8 7.4h3.7v3.7" /></svg>;
}

const shortcuts = [
  { href: "/materials", number: "01", title: "Your study library", copy: "Add syllabi, notes, and past papers. Keep your learning sources together.", action: "Manage materials" },
  { href: "/topics", number: "02", title: "Topic map", copy: "Turn your syllabus into a structured view of the concepts you need to cover.", action: "Explore topics" },
  { href: "/insights", number: "03", title: "Learning insights", copy: "See what you know, what needs practice, and how your attempts are changing.", action: "View insights" },
  { href: "/study-plan", number: "04", title: "Revision plan", copy: "Build a study schedule around your available time and current topic gaps.", action: "Plan a study week" },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: docs }, { data: topics }, { gaps, attempts }] = await Promise.all([
    supabase.from("documents").select("id").order("created_at", { ascending: false }),
    supabase.from("topics").select("id").order("position"),
    computeGaps(supabase),
  ]);

  const documentCount = docs?.length ?? 0;
  const topicCount = topics?.length ?? 0;
  const needsPractice = gaps.filter((g) => g.status === "weak" || g.status === "medium").length;
  const latestAttempt = attempts[0];
  const latestPercent = latestAttempt?.total ? Math.round((latestAttempt.correct / latestAttempt.total) * 100) : null;

  return (
    <main className="app-shell">
      <AppHeader email={user?.email} activePath="/" />

      <section className="hero-banner overview-hero">
        <div className="hero-layout">
          <div className="hero-content">
            <p className="hero-eyebrow"><span className="eyebrow-mark" aria-hidden="true"></span> A more thoughtful way to study</p>
            <h1 className="hero-title">Study what matters.<br /><span>Make progress you can see.</span></h1>
            <p className="hero-description">
              A study workspace built around your own material. Understand your topics,
              discover where to focus, and make your next study session count.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/materials">Open study library <span aria-hidden="true">↗</span></Link>
              <Link className="btn btn-secondary" href="/insights">Review my progress</Link>
            </div>
          </div>
          <aside className="study-cycle" aria-label="Study workflow">
            <div className="study-cycle-heading">
              <span className="study-cycle-label">YOUR STUDY CYCLE</span>
              <span className="study-cycle-caption">One step at a time</span>
            </div>
            <div className="cycle-steps">
              <Link href="/materials" className="cycle-step">
                <span className="cycle-step-number">01</span>
                <span className="cycle-step-copy"><strong>Gather</strong><span>Your syllabus &amp; notes</span></span>
                <span className="cycle-step-mark" aria-hidden="true">↗</span>
              </Link>
              <div className="cycle-connector" aria-hidden="true"></div>
              <Link href="/topics" className="cycle-step">
                <span className="cycle-step-number">02</span>
                <span className="cycle-step-copy"><strong>Understand</strong><span>Organise key concepts</span></span>
                <span className="cycle-step-mark" aria-hidden="true">↗</span>
              </Link>
              <div className="cycle-connector" aria-hidden="true"></div>
              <Link href="/insights" className="cycle-step">
                <span className="cycle-step-number">03</span>
                <span className="cycle-step-copy"><strong>Practise</strong><span>Find what needs work</span></span>
                <span className="cycle-step-mark" aria-hidden="true">↗</span>
              </Link>
              <div className="cycle-connector" aria-hidden="true"></div>
              <Link href="/study-plan" className="cycle-step cycle-step-final">
                <span className="cycle-step-number">04</span>
                <span className="cycle-step-copy"><strong>Revise</strong><span>Follow a focused plan</span></span>
                <span className="cycle-step-mark" aria-hidden="true">↗</span>
              </Link>
            </div>
            <p className="study-cycle-footnote">Less guesswork. More intentional learning.</p>
          </aside>
        </div>
      </section>

      <section className="stat-grid overview-stats" aria-label="Study overview">
        <article className="stat-card"><div className="stat-icon"><StatGlyph kind="documents" /></div><div><div className="stat-value">{documentCount}</div><div className="stat-label">Study {documentCount === 1 ? "document" : "documents"}</div></div></article>
        <article className="stat-card"><div className="stat-icon slate"><StatGlyph kind="topics" /></div><div><div className="stat-value">{topicCount}</div><div className="stat-label">Mapped {topicCount === 1 ? "topic" : "topics"}</div></div></article>
        <article className="stat-card"><div className="stat-icon amber"><StatGlyph kind="focus" /></div><div><div className="stat-value">{needsPractice}</div><div className="stat-label">Topics to revisit</div></div></article>
        <article className="stat-card"><div className="stat-icon green"><StatGlyph kind="progress" /></div><div><div className="stat-value">{attempts.length}</div><div className="stat-label">Quiz {attempts.length === 1 ? "attempt" : "attempts"}</div></div></article>
      </section>

      <section className="overview-next section-after-grid">
        <div className="overview-section-intro">
          <p className="section-kicker">Your workspace</p>
          <h2 className="overview-section-title">What would you like to work on?</h2>
          <p className="section-description">Each part has its own space, so you can focus on one task at a time.</p>
        </div>
        <div className="shortcut-grid">
          {shortcuts.map((item) => (
            <Link href={item.href} key={item.href} className="shortcut-card">
              <span className="shortcut-number">{item.number}</span>
              <span className="shortcut-title">{item.title}</span>
              <span className="shortcut-copy">{item.copy}</span>
              <span className="shortcut-action">{item.action}<span aria-hidden="true"> ↗</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="overview-latest">
        <div>
          <p className="section-kicker">A quick check-in</p>
          <h2 className="overview-section-title">Your latest attempt</h2>
          <p className="section-description">{latestAttempt ? "A snapshot from your most recent diagnostic or retake activity." : "Complete a diagnostic quiz when you're ready to establish your starting point."}</p>
        </div>
        {latestAttempt ? (
          <div className="latest-score">
            <span className="latest-score-label">Latest score</span>
            <strong>{latestPercent}%</strong>
            <span className="latest-score-detail">{latestAttempt.correct} correct out of {latestAttempt.total}</span>
            <Link href="/insights" className="text-link">View learning insights <span aria-hidden="true">↗</span></Link>
          </div>
        ) : (
          <Link href="/materials" className="btn btn-primary">Prepare my first quiz</Link>
        )}
      </section>

      <AppFooter />
    </main>
  );
}

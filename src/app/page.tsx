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

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: docs }, { data: topics }, { gaps, attempts }, { data: plans }] = await Promise.all([
    supabase.from("documents").select("id").order("created_at", { ascending: false }),
    supabase.from("topics").select("id").order("position"),
    computeGaps(supabase),
    supabase.from("plans").select("created_at").order("created_at", { ascending: false }).limit(1),
  ]);

  const documentCount = docs?.length ?? 0;
  const topicCount = topics?.length ?? 0;
  const needsPractice = gaps.filter((g) => g.status === "weak" || g.status === "medium").length;
  const latestAttempt = attempts[0];
  const latestPercent = latestAttempt?.total ? Math.round((latestAttempt.correct / latestAttempt.total) * 100) : null;
  const hasPlan = !!plans?.length;

  let nextTitle = "Start with the material you already have.";
  let nextCopy = "Add a syllabus, class notes, or a past paper. GapFinder will use your material to help you see what to learn next.";
  let nextHref = "/materials";
  let nextAction = "Add study material";
  let nextLabel = "FIRST STEP";
  if (documentCount > 0 && topicCount === 0) {
    nextTitle = "Turn your notes into a map of what matters.";
    nextCopy = "Your library is ready. Build a topic map to organise the concepts that your quizzes and revision can focus on.";
    nextHref = "/topics";
    nextAction = "Build my topic map";
    nextLabel = "BUILD YOUR MAP";
  } else if (topicCount > 0 && attempts.length === 0) {
    nextTitle = "Find your gaps before you spend hours revising.";
    nextCopy = "Take a short diagnostic based on your study material. Use the results to decide where your effort will make the biggest difference.";
    nextHref = "/topics#diagnostic";
    nextAction = "Take my first diagnostic";
    nextLabel = "CHECK YOUR UNDERSTANDING";
  } else if (attempts.length > 0 && needsPractice > 0) {
    nextTitle = "Your next session already has a focus.";
    nextCopy = needsPractice + " " + (needsPractice === 1 ? "topic needs" : "topics need") + " more practice. Review the evidence behind your topic scores, then take a focused next step.";
    nextHref = "/insights";
    nextAction = "See my focus areas";
    nextLabel = "PICK UP WHERE YOU LEFT OFF";
  } else if (attempts.length > 0 && !hasPlan) {
    nextTitle = "Turn your progress into a practical study plan.";
    nextCopy = "Use your topic results and available study time to build a revision schedule that gives each session a purpose.";
    nextHref = "/study-plan";
    nextAction = "Build my revision plan";
    nextLabel = "MAKE A PLAN";
  } else if (attempts.length > 0 && hasPlan) {
    nextTitle = "Keep your momentum, one focused session at a time.";
    nextCopy = "Your revision plan is ready. Check your progress, revisit topics as needed, and update your plan after your next quiz.";
    nextHref = "/study-plan";
    nextAction = "Continue my study plan";
    nextLabel = "YOUR NEXT SESSION";
  }

  const journey = [
    { href: "/materials", number: "01", title: "Bring in your material", caption: "Syllabus, notes or past papers", done: documentCount > 0 },
    { href: "/topics", number: "02", title: "Make the topic map", caption: "See the concepts in your course", done: topicCount > 0 },
    { href: "/topics#diagnostic", number: "03", title: "Find your learning gaps", caption: "Check understanding with a quiz", done: attempts.length > 0 },
    { href: "/study-plan", number: "04", title: "Plan what comes next", caption: "Turn results into revision sessions", done: hasPlan },
  ];

  return (
    <main className="app-shell home-dashboard">
      <AppHeader email={user?.email} activePath="/" />

      <section className="hero-banner overview-hero home-hero">
        <div className="home-hero-copy">
          <p className="hero-eyebrow"><span className="eyebrow-mark" aria-hidden="true"></span> A study space built around your own material</p>
          <h1 className="hero-title">Know what to study next.<br /><span>Make every session count.</span></h1>
          <div className="home-next-focus">
            <p className="home-next-label">{nextLabel}</p>
            <h2 className="home-next-title">{nextTitle}</h2>
            <p className="home-next-copy">{nextCopy}</p>
          </div>
          <div className="hero-actions">
            <Link className="btn btn-primary home-primary-action" href={nextHref}>{nextAction}<span aria-hidden="true"> ↗</span></Link>
            <Link className="btn btn-secondary" href="/explain">Ask about a topic</Link>
          </div>
          <p className="home-reassurance"><span aria-hidden="true">✓</span> Grounded in your study materials, not generic study advice</p>
        </div>

        <aside className="home-path-card" aria-label="Your learning path">
          <div className="home-path-head">
            <div>
              <p className="home-path-kicker">YOUR LEARNING PATH</p>
              <h2>A little progress, in order.</h2>
            </div>
            <span className="home-path-mark" aria-hidden="true">↗</span>
          </div>
          <div className="home-path-list">
            {journey.map((step, index) => (
              <Link
                href={step.href}
                key={step.number}
                className={"home-path-step" + (step.done ? " is-done" : index === journey.findIndex((item) => !item.done) ? " is-current" : "")}
              >
                <span className="home-path-number">{step.done ? "✓" : step.number}</span>
                <span className="home-path-step-copy"><strong>{step.title}</strong><span>{step.caption}</span></span>
                <span className="home-path-status">{step.done ? "Done" : index === journey.findIndex((item) => !item.done) ? "Up next" : ""}</span>
              </Link>
            ))}
          </div>
          <p className="home-path-foot">Everything connects: material → topics → practice → revision.</p>
        </aside>
      </section>

      <section className="stat-grid overview-stats home-stats" aria-label="Your study at a glance">
        <article className="stat-card"><div className="stat-icon"><StatGlyph kind="documents" /></div><div><div className="stat-value">{documentCount}</div><div className="stat-label">{documentCount === 1 ? "Study document" : "Study documents"}</div></div></article>
        <article className="stat-card"><div className="stat-icon slate"><StatGlyph kind="topics" /></div><div><div className="stat-value">{topicCount}</div><div className="stat-label">{topicCount === 1 ? "Topic mapped" : "Topics mapped"}</div></div></article>
        <article className="stat-card"><div className="stat-icon amber"><StatGlyph kind="focus" /></div><div><div className="stat-value">{needsPractice}</div><div className="stat-label">{needsPractice === 1 ? "Topic to revisit" : "Topics to revisit"}</div></div></article>
        <article className="stat-card"><div className="stat-icon green"><StatGlyph kind="progress" /></div><div><div className="stat-value">{attempts.length}</div><div className="stat-label">{attempts.length === 1 ? "Quiz attempt" : "Quiz attempts"}</div></div></article>
      </section>

      <section className="home-tools">
        <div className="home-section-heading">
          <div>
            <p className="section-kicker">Explore the workspace</p>
            <h2 className="overview-section-title">Tools for the moments you get stuck.</h2>
            <p className="section-description">Pick one outcome. You can move through the rest when you're ready.</p>
          </div>
          {latestAttempt && (
            <Link href="/insights" className="home-last-result">
              <span className="home-last-result-label">LATEST QUIZ</span>
              <strong>{latestPercent === null ? "—" : latestPercent + "%"}</strong>
              <span>{latestAttempt.correct} of {latestAttempt.total} correct <span aria-hidden="true">↗</span></span>
            </Link>
          )}
        </div>

        <div className="home-feature-grid">
          <Link href="/topics#diagnostic" className="home-feature-card">
            <span className="home-feature-icon feature-icon-green" aria-hidden="true">◎</span>
            <span className="home-feature-tag">PRACTISE</span>
            <strong>Find the gaps</strong>
            <p>Test what you remember and see which topics need another look.</p>
            <span className="home-feature-link">Start a diagnostic <span aria-hidden="true">↗</span></span>
          </Link>
          <Link href="/explain" className="home-feature-card">
            <span className="home-feature-icon feature-icon-brass" aria-hidden="true">✳</span>
            <span className="home-feature-tag">UNDERSTAND</span>
            <strong>Ask your own notes</strong>
            <p>Get an explanation linked to the material you uploaded, with sources to check.</p>
            <span className="home-feature-link">Explain a topic <span aria-hidden="true">↗</span></span>
          </Link>
          <Link href="/study-plan" className="home-feature-card">
            <span className="home-feature-icon feature-icon-slate" aria-hidden="true">↗</span>
            <span className="home-feature-tag">PLAN</span>
            <strong>Make revision manageable</strong>
            <p>Turn quiz results, study hours, and your exam date into a focused schedule.</p>
            <span className="home-feature-link">Build a revision plan <span aria-hidden="true">↗</span></span>
          </Link>
        </div>
      </section>

      <section className="home-library-prompt">
        <div className="home-library-symbol" aria-hidden="true">+</div>
        <div>
          <strong>{documentCount ? "Your library is the foundation." : "Start with what your course already gives you."}</strong>
          <p>{documentCount ? "Add another note or past paper when you need a more complete picture." : "One syllabus is enough to begin. Add more material as your understanding grows."}</p>
        </div>
        <Link href="/materials" className="text-link">{documentCount ? "Manage materials" : "Open study library"} <span aria-hidden="true">↗</span></Link>
      </section>

      <AppFooter />
    </main>
  );
}

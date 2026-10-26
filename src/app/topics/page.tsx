import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import TopicMapButton from "@/components/TopicMapButton";
import Link from "next/link";

export default async function TopicsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: topics } = await supabase
    .from("topics")
    .select("id,name,description,chunks(count)")
    .order("position");
  const count = (rel: unknown) => (rel as { count: number }[])?.[0]?.count ?? 0;

  return (
    <main className="app-shell">
      <AppHeader email={user?.email} activePath="/topics" />
      <header className="workspace-heading workspace-heading-actions">
        <div>
          <p className="section-kicker">Organise your learning</p>
          <h1 className="page-title">Topic map</h1>
          <p className="page-description">Turn your syllabus into a structured set of concepts, then connect relevant notes to each topic.</p>
        </div>
        <TopicMapButton hasTopics={!!topics?.length} />
      </header>

      <section className="section-card">
        <div className="section-head">
          <div className="section-head-main">
            <h2 className="section-title">Topics from your syllabus</h2>
            <p className="section-description">{topics?.length ?? 0} {(topics?.length ?? 0) === 1 ? "topic" : "topics"} in the current map. Each topic is used to retrieve relevant study material for quizzes.</p>
          </div>
        </div>
        {!topics?.length ? (
          <div className="empty-state">
            <p className="empty-state-title">Start with a syllabus</p>
            <p className="empty-state-copy">Add a syllabus to your library, then generate a topic map.</p>
            <Link className="btn btn-primary mt-4" href="/materials">Go to materials</Link>
          </div>
        ) : (
          <ul className="topic-grid">
            {topics.map((topic, index) => {
              const chunks = count(topic.chunks);
              return (
                <li key={topic.id} className="topic-row topic-workspace-card">
                  <div className="topic-card-index">{String(index + 1).padStart(2, "0")}</div>
                  <div className="topic-row-top">
                    <span className="topic-name">{topic.name}</span>
                    <span className="topic-count">{chunks} {chunks === 1 ? "chunk" : "chunks"}</span>
                  </div>
                  <p className="topic-description">{topic.description}</p>
                  <div className="topic-source-line">
                    <span className={`source-dot ${chunks ? "source-dot-active" : ""}`} aria-hidden="true"></span>
                    {chunks ? "Study material linked" : "No chunks linked yet"}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="materials-note">
        <span className="materials-note-mark" aria-hidden="true">i</span>
        <p>Regenerating the topic map replaces the current topic list. If you already have quiz history you need to preserve, avoid regenerating without first reviewing the implications.</p>
      </section>
      <AppFooter />
    </main>
  );
}

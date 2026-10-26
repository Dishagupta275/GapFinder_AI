import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import ExplainBox from "@/components/ExplainBox";
import Link from "next/link";

export default async function ExplainPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true });

  return (
    <main className="app-shell">
      <AppHeader email={user?.email} activePath="/explain" />
      <header className="workspace-heading">
        <p className="section-kicker">Study with context</p>
        <h1 className="page-title">Explain a topic</h1>
        <p className="page-description">Ask a question about your course material. The assistant retrieves relevant excerpts, answers from those excerpts, and shows the sources used.</p>
      </header>

      <div className="explain-workspace-grid">
        <section className="section-card explain-main-card">
          <div className="section-head">
            <div className="section-head-main">
              <h2 className="section-title">What would you like to understand?</h2>
              <p className="section-description">Try a concept, definition, comparison, or process from your notes.</p>
            </div>
          </div>
          <ExplainBox disabled={!count} />
        </section>

        <aside className="explain-guidance">
          <p className="section-kicker">How to get a useful answer</p>
          <h2>Ask with a little context.</h2>
          <ol>
            <li><span>01</span><div><strong>Be specific</strong><p>Ask about one concept at a time, such as “Explain BCNF” or “Compare conflict and view serializability”.</p></div></li>
            <li><span>02</span><div><strong>Check the sources</strong><p>Open the source excerpts beneath an answer to verify it against your own notes.</p></div></li>
            <li><span>03</span><div><strong>Missing material?</strong><p>If the answer says the notes do not cover a question, add a relevant document to your <Link href="/materials">study library</Link>.</p></div></li>
          </ol>
          {!count && <Link href="/materials" className="btn btn-primary mt-4">Add study material</Link>}
        </aside>
      </div>
      <AppFooter />
    </main>
  );
}

import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import UploadForm from "@/components/UploadForm";
import DeleteDocButton from "@/components/DeleteDocButton";

export default async function MaterialsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: docs } = await supabase
    .from("documents")
    .select("id,title,kind,created_at,chunks(count)")
    .order("created_at", { ascending: false });
  const count = (rel: unknown) => (rel as { count: number }[])?.[0]?.count ?? 0;

  return (
    <main className="app-shell">
      <AppHeader email={user?.email} activePath="/materials" />
      <header className="workspace-heading">
        <p className="section-kicker">Your study library</p>
        <h1 className="page-title">Materials</h1>
        <p className="page-description">Keep your syllabus, notes, textbook extracts, and past papers in one place. GapFinder uses this material to ground your quizzes and explanations.</p>
      </header>

      <div className="workspace-grid materials-layout">
        <section className="section-card">
          <div className="section-head">
            <div className="section-head-main">
              <h2 className="section-title">Add study material</h2>
              <p className="section-description">Choose a file and give it a useful title so you can recognise its sources later.</p>
            </div>
          </div>
          <UploadForm />
        </section>

        <section className="section-card">
          <div className="section-head">
            <div className="section-head-main">
              <h2 className="section-title">Your documents</h2>
              <p className="section-description">Documents currently available to your study assistant.</p>
            </div>
            <span className="status-pill untested">{docs?.length ?? 0} {(docs?.length ?? 0) === 1 ? "file" : "files"}</span>
          </div>
          {!docs?.length ? (
            <div className="empty-state">
              <p className="empty-state-title">Your library is waiting for its first file</p>
              <p className="empty-state-copy">Upload a text-based PDF, TXT, or Markdown file above. Scanned PDFs that contain only images are not supported.</p>
            </div>
          ) : (
            <ul className="document-list">
              {docs.map((d) => {
                const chunks = count(d.chunks);
                return (
                  <li key={d.id} className="document-row">
                    <div className="document-main">
                      <div className="document-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 3.75h7l4 4v12.5H7z" /><path d="M14 3.75v4h4M10 12h5M10 15.5h5" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="document-title">{d.title}</div>
                        <div className="document-meta">{d.kind.replace("_", " ")} · {chunks} {chunks === 1 ? "chunk" : "chunks"}</div>
                      </div>
                    </div>
                    <div className="document-actions"><DeleteDocButton id={d.id} title={d.title} /></div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="materials-note">
        <span className="materials-note-mark" aria-hidden="true">i</span>
        <p><strong>For better results:</strong> upload a syllabus first, generate the topic map, and then add notes or past papers that contain explanations and worked examples.</p>
      </section>
      <AppFooter />
    </main>
  );
}

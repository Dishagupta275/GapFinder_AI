import { createClient } from "@/lib/supabase/server";
import UploadForm from "@/components/UploadForm";
import TopicMapButton from "@/components/TopicMapButton";
import StartQuizButton from "@/components/StartQuizButton";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: docs } = await supabase
    .from("documents")
    .select("id,title,kind,created_at,chunks(count)")
    .order("created_at", { ascending: false });
  const { data: topics } = await supabase
    .from("topics")
    .select("id,name,description,chunks(count)")
    .order("position");

  const count = (rel: unknown) => (rel as { count: number }[])?.[0]?.count ?? 0;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">GapFinder AI</h1>
        <form action="/auth/signout" method="post" className="flex items-center gap-3 text-sm">
          <span className="text-gray-600">{user?.email}</span>
          <button className="border rounded px-3 py-1">Sign out</button>
        </form>
      </header>

      <UploadForm />

      <section className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold mb-3">Your documents</h2>
        {!docs?.length && <p className="text-sm text-gray-500">Nothing uploaded yet.</p>}
        <ul className="divide-y">
          {docs?.map((d) => (
            <li key={d.id} className="py-2 flex justify-between text-sm">
              <span>
                {d.title} <span className="text-gray-500">({d.kind})</span>
              </span>
              <span className="text-gray-500">{count(d.chunks)} chunks</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-xl shadow p-5 space-y-3">
        <h2 className="font-semibold">Topic map</h2>
        <TopicMapButton hasTopics={!!topics?.length} />
        <ul className="divide-y">
          {topics?.map((t) => (
            <li key={t.id} className="py-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{t.name}</span>
                <span className="text-gray-500">{count(t.chunks)} chunks</span>
              </div>
              <p className="text-gray-600">{t.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-xl shadow p-5 space-y-3">
        <h2 className="font-semibold">Diagnostic quiz</h2>
        <p className="text-sm text-gray-600">
          Questions are built from your own notes, each with a source citation.
        </p>
        <StartQuizButton disabled={!topics?.length} />
      </section>
    </main>
  );
}
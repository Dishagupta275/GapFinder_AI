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
            <li key={d.id} className="py-2 flex items-center justify-between gap-3 text-sm">
              <span>
                {d.title} <span className="text-gray-500">({d.kind})</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-gray-500">{count(d.chunks)} chunks</span>
                <DeleteDocButton id={d.id} title={d.title} />
              </span>
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
        <h2 className="font-semibold">Explain this topic</h2>
        <p className="text-sm text-gray-600">
          Ask about any concept. Answers come only from your uploaded notes, with sources.
          If your notes don&apos;t cover it, it says so.
        </p>
        <ExplainBox disabled={!docs?.length} />
      </section>

      <section className="bg-white rounded-xl shadow p-5 space-y-3">
        <h2 className="font-semibold">Diagnostic quiz</h2>
        <p className="text-sm text-gray-600">
          Questions are built from your own notes, each with a source citation.
        </p>
        <StartQuizButton disabled={!topics?.length} />
      </section>

      <section className="bg-white rounded-xl shadow p-5 space-y-3">
        <h2 className="font-semibold">Gap report</h2>
        {!attempts.length ? (
          <p className="text-sm text-gray-500">Take the diagnostic quiz to see where you stand.</p>
        ) : (
          <>
            <ul className="divide-y">
              {sortedGaps.map((g) => (
                <li key={g.id} className="py-2 text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{g.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs uppercase ${badge[g.status]}`}>
                      {g.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full ${bar[g.status]}`}
                        style={{ width: `${g.total ? Math.round((g.correct / g.total) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">
                      {g.total ? `${Math.round((g.correct / g.total) * 100)}%` : "n/a"}
                    </span>
                  </div>
                  <p className="text-gray-600">{g.reason}</p>
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <h3 className="text-sm font-semibold mb-1">Progress across attempts</h3>
              <ProgressChart attempts={attempts} />
              <ul className="text-sm text-gray-600">
                {attempts.map((a, i) => (
                  <li key={a.quizId}>
                    Attempt {attempts.length - i}: {a.correct}/{a.total} (
                    {Math.round((a.correct / a.total) * 100)}%) on{" "}
                    {new Date(a.at).toLocaleString("en-IN")}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>

      <section className="bg-white rounded-xl shadow p-5 space-y-3">
        <h2 className="font-semibold">Revision plan</h2>
        <PlanForm disabled={!attempts.length} />
        {plan?.days?.map((day) => (
          <div key={day.day} className="border rounded p-3 space-y-2">
            <p className="font-medium text-sm">Day {day.day}</p>
            {day.sessions.map((s, i) => (
              <div key={i} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.topic}</span>
                  <span className="text-gray-500">
                    {s.minutes} min{" "}
                    <span className={`px-2 py-0.5 rounded text-xs uppercase ${badge[s.status]}`}>
                      {s.status}
                    </span>
                  </span>
                </div>
                <p className="text-gray-600">{s.focus}</p>
                {!!s.sources?.length && (
                  <p className="text-xs text-gray-500">Source: {s.sources.join("; ")}</p>
                )}
              </div>
            ))}
          </div>
        ))}
        <p className="text-xs text-gray-500">
          The plan is rebuilt from your latest quiz results. Retake the quiz, then regenerate it.
        </p>
      </section>
    </main>
  );
}
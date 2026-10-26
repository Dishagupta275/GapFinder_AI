import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuizRunner from "@/components/QuizRunner";

type Row = {
  id: string;
  question: string;
  options: string[];
  topics: { name: string } | null;
  chunks: { section_label: string } | null;
};

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("questions")
    .select("id,question,options,topics(name),chunks(section_label)")
    .eq("quiz_id", id)
    .order("id");
  const rows = (data ?? []) as unknown as Row[];
  if (!rows.length) notFound();

  const { count } = await supabase
    .from("answers")
    .select("id", { count: "exact", head: true })
    .in("question_id", rows.map((r) => r.id));

  const questions = rows.map((r) => ({
    id: r.id,
    question: r.question,
    options: r.options,
    topic: r.topics?.name ?? "",
    citation: r.chunks?.section_label ?? "",
  }));

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Diagnostic quiz</h1>
        <Link href="/" className="text-sm underline">
          Back to home
        </Link>
      </header>
      {count ? (
        <div className="bg-white rounded-xl shadow p-5 space-y-2">
          <p className="text-sm">This quiz was already submitted.</p>
          <Link href="/" className="text-sm underline">
            See your gap report on the home page
          </Link>
        </div>
      ) : (
        <QuizRunner quizId={id} questions={questions} />
      )}
    </main>
  );
}
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
    <main className="page-shell">
      <Link href="/" className="page-back-link"><span aria-hidden="true">←</span> Back to dashboard</Link>
      <header className="page-intro">
        <p className="section-kicker">Knowledge check</p>
        <h1 className="page-title">Diagnostic quiz</h1>
        <p className="page-description">
          Choose the best answer for each question. Once submitted, you can review explanations and the source material behind them.
        </p>
      </header>
      {count ? (
        <div className="quiz-card">
          <span className="status-pill untested">Already submitted</span>
          <h2 className="section-title mt-4">This quiz has been completed.</h2>
          <p className="page-description">Your attempt is saved. Return to the dashboard to review your gap report and study plan.</p>
          <div className="hero-actions">
            <Link href="/" className="btn btn-primary">View gap report</Link>
          </div>
        </div>
      ) : (
        <QuizRunner quizId={id} questions={questions} />
      )}
    </main>
  );
}
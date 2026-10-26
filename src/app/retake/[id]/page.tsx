import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RetakeRunner from "@/components/RetakeRunner";

export default async function RetakePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const topicIds = (t ?? "").split(",").filter(Boolean);
  if (!topicIds.length) redirect("/");

  return (
    <main className="page-shell">
      <Link href="/" className="page-back-link"><span aria-hidden="true">←</span> Back to dashboard</Link>
      <header className="page-intro">
        <p className="section-kicker">Practice with purpose</p>
        <h1 className="page-title">Retake on weak topics</h1>
        <p className="page-description">
          Work through a focused set of questions based on the topics that need more attention. Review the feedback and sources after every answer.
        </p>
      </header>
      <RetakeRunner quizId={id} topicIds={topicIds} />
    </main>
  );
}
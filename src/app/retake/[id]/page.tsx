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
    <main className="max-w-2xl mx-auto p-6 space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Retake on weak topics</h1>
        <Link href="/" className="text-sm underline">
          Back to home
        </Link>
      </header>
      <RetakeRunner quizId={id} topicIds={topicIds} />
    </main>
  );
}
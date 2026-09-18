import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/shared/back-link";
import { CoachEditForm } from "@/components/coaches/coach-edit-form";

export default async function CoachDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: coach } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, is_active")
    .eq("id", id)
    .eq("role", "coach")
    .maybeSingle();

  if (!coach) notFound();

  return (
    <div className="flex max-w-md flex-col gap-6">
      <BackLink href="/admin/coaches" label="Pelatih" />
      <div>
        <h1 className="text-2xl font-semibold">{coach.full_name}</h1>
        <p className="text-sm text-muted-foreground">{coach.email}</p>
      </div>
      <CoachEditForm coach={coach} />
    </div>
  );
}

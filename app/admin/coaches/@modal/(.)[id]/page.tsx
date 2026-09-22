import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Dialog } from "@/components/ui/dialog";
import { CoachEditForm } from "@/components/coaches/coach-edit-form";

export default async function CoachDetailModal({
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
    <Dialog>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{coach.full_name}</h2>
        <p className="text-sm text-muted-foreground">{coach.email}</p>
      </div>
      <CoachEditForm coach={coach} />
    </Dialog>
  );
}

import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getLocations } from "@/lib/data/lookups";
import { BackLink } from "@/components/shared/back-link";
import { MemberEditForm } from "@/components/members/member-edit-form";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const [{ data: child }, locations] = await Promise.all([
    supabase
      .from("children")
      .select(
        "id, full_name, date_of_birth, notes, address, preferred_location_id, is_active, profiles(full_name, email, phone)"
      )
      .eq("id", id)
      .maybeSingle(),
    getLocations(),
  ]);

  if (!child) notFound();

  const parent = (child as unknown as { profiles: { full_name: string; email: string; phone: string | null } | null }).profiles;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <BackLink href="/admin/members" label="Anggota" />
      <div>
        <h1 className="text-2xl font-semibold">{child.full_name}</h1>
        {parent ? (
          <p className="text-sm text-muted-foreground">
            Orang tua: {parent.full_name} — {parent.email} {parent.phone ? `— ${parent.phone}` : ""}
          </p>
        ) : null}
      </div>
      <MemberEditForm child={child} locations={locations} />
    </div>
  );
}

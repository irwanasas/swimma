import { getLocations } from "@/lib/data/lookups";
import { BackLink } from "@/components/shared/back-link";
import { MemberForm } from "@/components/members/member-form";

export default async function NewMemberPage() {
  const locations = await getLocations();
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <BackLink href="/admin/members" label="Anggota" />
      <h1 className="text-2xl font-semibold">Daftarkan Anggota Baru</h1>
      <MemberForm locations={locations} />
    </div>
  );
}

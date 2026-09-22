import { getLocations } from "@/lib/data/lookups";
import { Dialog } from "@/components/ui/dialog";
import { MemberForm } from "@/components/members/member-form";

export default async function NewMemberModal() {
  const locations = await getLocations();
  return (
    <Dialog>
      <h2 className="mb-4 text-xl font-semibold">Daftarkan Anggota Baru</h2>
      <MemberForm locations={locations} />
    </Dialog>
  );
}

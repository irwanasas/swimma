import { BackLink } from "@/components/shared/back-link";
import { CoachForm } from "@/components/coaches/coach-form";

export default function NewCoachPage() {
  return (
    <div className="flex max-w-md flex-col gap-4">
      <BackLink href="/admin/coaches" label="Pelatih" />
      <h1 className="text-2xl font-semibold">Tambah Pelatih</h1>
      <CoachForm />
    </div>
  );
}

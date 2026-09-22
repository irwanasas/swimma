import { Dialog } from "@/components/ui/dialog";
import { CoachForm } from "@/components/coaches/coach-form";

export default function NewCoachModal() {
  return (
    <Dialog>
      <h2 className="mb-4 text-xl font-semibold">Tambah Pelatih</h2>
      <CoachForm />
    </Dialog>
  );
}

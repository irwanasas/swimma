"use client";

import { useActionState } from "react";
import { updateChild, toggleChildActiveForm } from "@/lib/actions/members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useActionToast } from "@/components/shared/use-action-toast";
import { ActionSubmitButton } from "@/components/shared/action-submit-button";
import type { Lookup } from "@/lib/data/lookups";

interface ChildDetail {
  id: string;
  full_name: string;
  date_of_birth: string;
  notes: string | null;
  address: string | null;
  preferred_location_id: string | null;
  is_active: boolean;
}

export function MemberEditForm({
  child,
  locations,
}: {
  child: ChildDetail;
  locations: Lookup[];
}) {
  const updateChildWithId = updateChild.bind(null, child.id);
  const [state, formAction, pending] = useActionState(updateChildWithId, {});
  useActionToast(state, "Perubahan disimpan");

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-4">
        {state.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="childFullName">Nama Anak</Label>
            <Input id="childFullName" name="childFullName" defaultValue={child.full_name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              defaultValue={child.date_of_birth}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="preferredLocationId">Lokasi Kolam Pilihan</Label>
            <Select
              id="preferredLocationId"
              name="preferredLocationId"
              defaultValue={child.preferred_location_id ?? ""}
            >
              <option value="">— Tidak ditentukan —</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address">Alamat Rumah</Label>
          <Textarea id="address" name="address" defaultValue={child.address ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Catatan</Label>
          <Textarea id="notes" name="notes" defaultValue={child.notes ?? ""} />
        </div>
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </form>

      <form action={toggleChildActiveForm}>
        <input type="hidden" name="childId" value={child.id} />
        <input type="hidden" name="isActive" value={(!child.is_active).toString()} />
        <ActionSubmitButton
          variant={child.is_active ? "destructive" : "secondary"}
          confirmMessage={
            child.is_active
              ? "Nonaktifkan anggota ini? Anak ini akan ditandai nonaktif."
              : undefined
          }
          successMessage={child.is_active ? "Anggota dinonaktifkan" : "Anggota diaktifkan kembali"}
        >
          {child.is_active ? "Nonaktifkan Anggota" : "Aktifkan Kembali"}
        </ActionSubmitButton>
      </form>
    </div>
  );
}

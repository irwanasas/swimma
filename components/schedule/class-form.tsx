"use client";

import { useActionState } from "react";
import { createClass } from "@/lib/actions/schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useActionToast } from "@/components/shared/use-action-toast";
import type { Lookup } from "@/lib/data/lookups";

export function ClassForm({
  coaches,
  locations,
  classTypes,
}: {
  coaches: Lookup[];
  locations: Lookup[];
  classTypes: Lookup[];
}) {
  const [state, formAction, pending] = useActionState(createClass, {});
  useActionToast(state, "Kelas berhasil ditambahkan");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="instructorId">Pelatih</Label>
        <Select id="instructorId" name="instructorId" required defaultValue="">
          <option value="" disabled>
            Pilih pelatih
          </option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="locationId">Lokasi</Label>
          <Select id="locationId" name="locationId" required defaultValue="">
            <option value="" disabled>
              Pilih lokasi
            </option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="classTypeId">Jenis Kelas</Label>
          <Select id="classTypeId" name="classTypeId" required defaultValue="">
            <option value="" disabled>
              Pilih jenis kelas
            </option>
            {classTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startTime">Waktu Mulai</Label>
          <Input id="startTime" name="startTime" type="datetime-local" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endTime">Waktu Selesai</Label>
          <Input id="endTime" name="endTime" type="datetime-local" required />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="capacity">Kapasitas</Label>
        <Input id="capacity" name="capacity" type="number" min={1} defaultValue={8} required />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan..." : "Simpan Kelas"}
      </Button>
    </form>
  );
}

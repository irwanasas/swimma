"use client";

import { useActionState } from "react";
import { addBooking } from "@/lib/actions/schedule";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Lookup } from "@/lib/data/lookups";

export function AddBookingForm({
  classId,
  availableChildren,
}: {
  classId: string;
  availableChildren: Lookup[];
}) {
  const addBookingWithClassId = addBooking.bind(null, classId);
  const [state, formAction, pending] = useActionState(addBookingWithClassId, {});

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      {state.error ? (
        <Alert variant="destructive" className="sm:w-full">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-1 flex-col gap-1.5">
        <Select id="childId" name="childId" required defaultValue="">
          <option value="" disabled>
            Pilih anak untuk didaftarkan
          </option>
          {availableChildren.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Menambahkan..." : "Daftarkan"}
      </Button>
    </form>
  );
}

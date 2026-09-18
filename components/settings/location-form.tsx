"use client";

import { useActionState } from "react";
import { createLocation } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useActionToast } from "@/components/shared/use-action-toast";

export function LocationForm() {
  const [state, formAction, pending] = useActionState(createLocation, {});
  useActionToast(state, "Lokasi berhasil ditambahkan");

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="location-name">Nama Lokasi</Label>
        <Input id="location-name" name="name" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="location-address">Alamat</Label>
        <Input id="location-address" name="address" />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan..." : "Tambah Lokasi"}
      </Button>
    </form>
  );
}

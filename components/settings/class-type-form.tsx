"use client";

import { useActionState } from "react";
import { createClassType } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useActionToast } from "@/components/shared/use-action-toast";

export function ClassTypeForm() {
  const [state, formAction, pending] = useActionState(createClassType, {});
  useActionToast(state, "Jenis kelas berhasil ditambahkan");

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="class-type-name">Nama Jenis Kelas</Label>
        <Input id="class-type-name" name="name" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="class-type-description">Deskripsi</Label>
        <Input id="class-type-description" name="description" />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan..." : "Tambah Jenis Kelas"}
      </Button>
    </form>
  );
}

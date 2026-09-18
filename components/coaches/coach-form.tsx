"use client";

import { useActionState } from "react";
import { createCoach } from "@/lib/actions/coaches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useActionToast } from "@/components/shared/use-action-toast";

export function CoachForm() {
  const [state, formAction, pending] = useActionState(createCoach, {});
  useActionToast(state, "Pelatih berhasil ditambahkan");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Nama Pelatih</Label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Telepon</Label>
        <Input id="phone" name="phone" />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan..." : "Tambah Pelatih"}
      </Button>
    </form>
  );
}

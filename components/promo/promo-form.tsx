"use client";

import { useActionState } from "react";
import { createPromo } from "@/lib/actions/promo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useActionToast } from "@/components/shared/use-action-toast";

export function PromoForm() {
  const [state, formAction, pending] = useActionState(createPromo, {});
  useActionToast(state, "Promo berhasil ditambahkan");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Judul</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="body">Isi</Label>
        <Textarea id="body" name="body" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image">Gambar (opsional)</Label>
        <Input id="image" name="image" type="file" accept="image/*" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="activeFrom">Aktif Mulai</Label>
          <Input
            id="activeFrom"
            name="activeFrom"
            type="datetime-local"
            required
            defaultValue={new Date().toISOString().slice(0, 16)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="activeUntil">Aktif Sampai (opsional)</Label>
          <Input id="activeUntil" name="activeUntil" type="datetime-local" />
        </div>
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan..." : "Tambah Promo"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { updateTenantBranding } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useActionToast } from "@/components/shared/use-action-toast";

export function TenantBrandingForm({
  name,
  logoUrl,
  primaryColor,
}: {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateTenantBranding, {});
  useActionToast(state, "Identitas klub berhasil diperbarui");

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tenant-name">Nama Klub</Label>
        <Input id="tenant-name" name="name" defaultValue={name} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tenant-logo">URL Logo</Label>
        <Input id="tenant-logo" name="logoUrl" defaultValue={logoUrl ?? ""} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tenant-color">Warna Utama</Label>
        <Input
          id="tenant-color"
          name="primaryColor"
          placeholder="#2563eb"
          defaultValue={primaryColor ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan..." : "Simpan Identitas Klub"}
      </Button>
    </form>
  );
}

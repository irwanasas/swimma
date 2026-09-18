"use client";

import { useActionState } from "react";
import { generateInvoices } from "@/lib/actions/billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function GenerateInvoicesForm() {
  const [state, formAction, pending] = useActionState(generateInvoices, {});
  const today = new Date();
  const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.ok && state.message ? (
        <Alert variant="success">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="periodStart">Awal Periode</Label>
          <Input id="periodStart" name="periodStart" type="date" defaultValue={periodStart} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="periodEnd">Akhir Periode</Label>
          <Input id="periodEnd" name="periodEnd" type="date" defaultValue={periodEnd} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dueDate">Jatuh Tempo</Label>
          <Input id="dueDate" name="dueDate" type="date" defaultValue={periodEnd} required />
        </div>
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Memproses..." : "Buat Tagihan Bulan Ini"}
      </Button>
    </form>
  );
}

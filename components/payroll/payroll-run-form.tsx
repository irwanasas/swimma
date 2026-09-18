"use client";

import { useActionState } from "react";
import { createPayrollRun } from "@/lib/actions/payroll";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useActionToast } from "@/components/shared/use-action-toast";
import type { Lookup } from "@/lib/data/lookups";

export function PayrollRunForm({ coaches }: { coaches: Lookup[] }) {
  const [state, formAction, pending] = useActionState(createPayrollRun, {});
  useActionToast(state, "Gaji berhasil dibuat");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="coachId">Pelatih</Label>
        <Select id="coachId" name="coachId" required defaultValue="">
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
          <Label htmlFor="periodStart">Awal Periode</Label>
          <Input id="periodStart" name="periodStart" type="date" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="periodEnd">Akhir Periode</Label>
          <Input id="periodEnd" name="periodEnd" type="date" required />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="baseSalary">Gaji Pokok (Rp)</Label>
          <Input id="baseSalary" name="baseSalary" type="number" min={0} step={1000} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bonus">Bonus (Rp)</Label>
          <Input id="bonus" name="bonus" type="number" min={0} step={1000} defaultValue={0} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="thr">THR (Rp)</Label>
          <Input id="thr" name="thr" type="number" min={0} step={1000} defaultValue={0} />
        </div>
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Memproses..." : "Buat Gaji"}
      </Button>
    </form>
  );
}

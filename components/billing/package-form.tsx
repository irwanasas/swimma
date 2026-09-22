"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createPackage } from "@/lib/actions/billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useActionToast } from "@/components/shared/use-action-toast";

const CYCLE_LABEL: Record<string, string> = {
  monthly: "Bulanan",
  quarterly: "Triwulan",
  yearly: "Tahunan",
};

export function PackageForm() {
  const [state, formAction, pending] = useActionState(createPackage, {});
  const [pricingMode, setPricingMode] = useState<"cycle" | "session_pack">("cycle");
  useActionToast(state, "Paket berhasil ditambahkan");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nama Paket</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pricingMode">Tipe Paket</Label>
        <Select
          id="pricingMode"
          name="pricingMode"
          value={pricingMode}
          onChange={(e) => setPricingMode(e.target.value as "cycle" | "session_pack")}
        >
          <option value="cycle">Siklus Berulang (bulanan/triwulan/tahunan)</option>
          <option value="session_pack">Paket Sesi (N sesi, berlaku X minggu)</option>
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">Harga (Rp)</Label>
          <Input id="price" name="price" type="number" min={0} step={1000} required />
        </div>
        {pricingMode === "cycle" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="billingCycle">Siklus Tagihan</Label>
            <Select id="billingCycle" name="billingCycle" defaultValue="monthly">
              {Object.entries(CYCLE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>
      {pricingMode === "session_pack" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sessionsIncluded">Jumlah Sesi</Label>
            <Input id="sessionsIncluded" name="sessionsIncluded" type="number" min={1} step={1} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="validityWeeks">Masa Berlaku (minggu)</Label>
            <Input id="validityWeeks" name="validityWeeks" type="number" min={1} step={1} required />
          </div>
        </div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Deskripsi</Label>
        <Input id="description" name="description" />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan..." : "Tambah Paket"}
      </Button>
    </form>
  );
}

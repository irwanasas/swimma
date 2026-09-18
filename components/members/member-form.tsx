"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createChild,
  searchDuplicateChildren,
  searchParentByContact,
  type DuplicateChildMatch,
  type ParentMatch,
} from "@/lib/actions/members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useActionToast } from "@/components/shared/use-action-toast";
import type { Lookup } from "@/lib/data/lookups";

export function MemberForm({ locations }: { locations: Lookup[] }) {
  const [state, formAction, pending] = useActionState(createChild, {});
  useActionToast(state, "Anggota berhasil ditambahkan");
  const [parentMode, setParentMode] = useState<"existing" | "new">("existing");
  const [existingParentId, setExistingParentId] = useState<string | null>(null);

  const [contact, setContact] = useState("");
  const [parentMatches, setParentMatches] = useState<ParentMatch[]>([]);

  const [childName, setChildName] = useState("");
  const [dob, setDob] = useState("");
  const [duplicates, setDuplicates] = useState<DuplicateChildMatch[]>([]);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (parentMode === "existing" && contact.trim().length >= 2) {
        setParentMatches(await searchParentByContact(contact));
      } else {
        setParentMatches([]);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [contact, parentMode]);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (childName.trim().length >= 2) {
        setDuplicates(await searchDuplicateChildren(childName, dob));
      } else {
        setDuplicates([]);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [childName, dob]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <input type="hidden" name="parentMode" value={parentMode} />
      {existingParentId ? (
        <input type="hidden" name="existingParentId" value={existingParentId} />
      ) : null}

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <h2 className="text-sm font-semibold">1. Orang Tua</h2>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={parentMode === "existing" ? "default" : "outline"}
            size="sm"
            onClick={() => setParentMode("existing")}
          >
            Pilih yang sudah ada
          </Button>
          <Button
            type="button"
            variant={parentMode === "new" ? "default" : "outline"}
            size="sm"
            onClick={() => setParentMode("new")}
          >
            Buat akun baru
          </Button>
        </div>

        {parentMode === "existing" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="parent-contact">Cari nama, email, atau telepon orang tua</Label>
            <Input
              id="parent-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Ketik untuk mencari..."
            />
            {parentMatches.length > 0 ? (
              <ul className="flex flex-col gap-1 rounded-md border border-border p-2">
                {parentMatches.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setExistingParentId(p.id);
                        setContact(`${p.full_name} (${p.email})`);
                        setParentMatches([]);
                      }}
                      className="w-full rounded px-2 py-1 text-left text-sm hover:bg-accent"
                    >
                      {p.full_name} — {p.email} {p.phone ? `— ${p.phone}` : ""}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {existingParentId ? (
              <p className="text-sm text-success">Orang tua terpilih.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada orang tua terpilih.</p>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="parentFullName">Nama Orang Tua</Label>
              <Input id="parentFullName" name="parentFullName" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="parentEmail">Email Orang Tua</Label>
              <Input id="parentEmail" name="parentEmail" type="email" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="parentPhone">Telepon Orang Tua</Label>
              <Input id="parentPhone" name="parentPhone" />
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <h2 className="text-sm font-semibold">2. Data Anak</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="childFullName">Nama Anak</Label>
            <Input
              id="childFullName"
              name="childFullName"
              required
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="preferredLocationId">Lokasi Kolam Pilihan</Label>
            <Select id="preferredLocationId" name="preferredLocationId" defaultValue="">
              <option value="">— Tidak ditentukan —</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address">Alamat Rumah</Label>
          <Textarea id="address" name="address" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Catatan</Label>
          <Textarea id="notes" name="notes" />
        </div>

        {duplicates.length > 0 ? (
          <Alert variant="warning">
            <AlertTitle>Kemungkinan data anak sudah ada</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 flex flex-col gap-1">
                {duplicates.map((d) => (
                  <li key={d.id}>
                    {d.full_name} — lahir {d.date_of_birth} — orang tua {d.parent_name}
                  </li>
                ))}
              </ul>
              <p className="mt-2">
                Periksa daftar di atas. Anda tetap bisa melanjutkan jika ini memang anak yang
                berbeda (misalnya kembar).
              </p>
            </AlertDescription>
          </Alert>
        ) : null}
      </section>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan..." : "Simpan Anggota"}
      </Button>
    </form>
  );
}

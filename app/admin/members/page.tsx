import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getLocations } from "@/lib/data/lookups";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListFilters } from "@/components/shared/list-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ChildRow {
  id: string;
  full_name: string;
  date_of_birth: string;
  is_active: boolean;
  profiles: { full_name: string } | null;
  locations: { name: string } | null;
}

function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; location?: string }>;
}) {
  const { q, status, location } = await searchParams;
  const [supabase, locations] = await Promise.all([createServerSupabaseClient(), getLocations()]);
  let query = supabase
    .from("children")
    .select("id, full_name, date_of_birth, is_active, profiles(full_name), locations(name)")
    .order("full_name");
  if (q) query = query.ilike("full_name", `%${q}%`);
  if (status) query = query.eq("is_active", status === "active");
  if (location) query = query.eq("preferred_location_id", location);
  const { data } = await query;

  const children = (data ?? []) as unknown as ChildRow[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Anggota</h1>
        <Link href="/admin/members/new" className={buttonVariants({})}>
          Tambah Anggota
        </Link>
      </div>
      <ListFilters
        fields={[
          { type: "search", name: "q", placeholder: "Cari nama anak..." },
          {
            type: "select",
            name: "status",
            placeholder: "Semua Status",
            options: [
              { value: "active", label: "Aktif" },
              { value: "inactive", label: "Nonaktif" },
            ],
          },
          {
            type: "select",
            name: "location",
            placeholder: "Semua Lokasi",
            options: locations.map((l) => ({ value: l.id, label: l.name })),
          },
        ]}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Anak</TableHead>
            <TableHead>Usia</TableHead>
            <TableHead>Orang Tua</TableHead>
            <TableHead>Lokasi</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {children.map((child) => (
            <TableRow key={child.id}>
              <TableCell>{child.full_name}</TableCell>
              <TableCell>{calculateAge(child.date_of_birth)} th</TableCell>
              <TableCell>{child.profiles?.full_name ?? "-"}</TableCell>
              <TableCell>{child.locations?.name ?? "-"}</TableCell>
              <TableCell>
                <Badge variant={child.is_active ? "success" : "secondary"}>
                  {child.is_active ? "Aktif" : "Nonaktif"}
                </Badge>
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/members/${child.id}`}
                  className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                >
                  Kelola
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {children.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Belum ada anggota.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

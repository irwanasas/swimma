import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

export default async function CoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("profiles")
    .select("id, full_name, email, phone, is_active")
    .eq("role", "coach")
    .order("full_name");
  if (q) query = query.ilike("full_name", `%${q}%`);
  if (status) query = query.eq("is_active", status === "active");
  const { data: coaches } = await query;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pelatih</h1>
        <Link href="/admin/coaches/new" className={buttonVariants({})}>
          Tambah Pelatih
        </Link>
      </div>
      <ListFilters
        fields={[
          { type: "search", name: "q", placeholder: "Cari nama pelatih..." },
          {
            type: "select",
            name: "status",
            placeholder: "Semua Status",
            options: [
              { value: "active", label: "Aktif" },
              { value: "inactive", label: "Nonaktif" },
            ],
          },
        ]}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telepon</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(coaches ?? []).map((coach) => (
            <TableRow key={coach.id}>
              <TableCell>{coach.full_name}</TableCell>
              <TableCell>{coach.email}</TableCell>
              <TableCell>{coach.phone ?? "-"}</TableCell>
              <TableCell>
                <Badge variant={coach.is_active ? "success" : "secondary"}>
                  {coach.is_active ? "Aktif" : "Nonaktif"}
                </Badge>
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/coaches/${coach.id}`}
                  className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                >
                  Kelola
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {(coaches ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Belum ada pelatih.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

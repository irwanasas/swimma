import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveCoaches, getLocations, getClassTypes } from "@/lib/data/lookups";
import { buttonVariants } from "@/components/ui/button";
import { ListFilters } from "@/components/shared/list-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ClassRow {
  id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  profiles: { full_name: string } | null;
  locations: { name: string } | null;
  class_types: { name: string } | null;
  bookings: { count: number }[];
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ coach?: string; location?: string; classType?: string }>;
}) {
  const { coach, location, classType } = await searchParams;
  const [supabase, coaches, locations, classTypes] = await Promise.all([
    createServerSupabaseClient(),
    getActiveCoaches(),
    getLocations(),
    getClassTypes(),
  ]);
  let query = supabase
    .from("classes")
    .select(
      "id, start_time, end_time, capacity, profiles(full_name), locations(name), class_types(name), bookings(count)"
    )
    .order("start_time");
  if (coach) query = query.eq("instructor_id", coach);
  if (location) query = query.eq("location_id", location);
  if (classType) query = query.eq("class_type_id", classType);
  const { data } = await query;

  const classes = (data ?? []) as unknown as ClassRow[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Jadwal Kelas</h1>
        <Link href="/admin/schedule/new" className={buttonVariants({})}>
          Tambah Kelas
        </Link>
      </div>
      <ListFilters
        fields={[
          {
            type: "select",
            name: "coach",
            placeholder: "Semua Pelatih",
            options: coaches.map((c) => ({ value: c.id, label: c.name })),
          },
          {
            type: "select",
            name: "location",
            placeholder: "Semua Lokasi",
            options: locations.map((l) => ({ value: l.id, label: l.name })),
          },
          {
            type: "select",
            name: "classType",
            placeholder: "Semua Jenis",
            options: classTypes.map((c) => ({ value: c.id, label: c.name })),
          },
        ]}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Waktu</TableHead>
            <TableHead>Pelatih</TableHead>
            <TableHead>Lokasi</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Peserta</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((cls) => (
            <TableRow key={cls.id}>
              <TableCell>
                {new Date(cls.start_time).toLocaleString("id-ID")} —{" "}
                {new Date(cls.end_time).toLocaleTimeString("id-ID")}
              </TableCell>
              <TableCell>{cls.profiles?.full_name ?? "-"}</TableCell>
              <TableCell>{cls.locations?.name ?? "-"}</TableCell>
              <TableCell>{cls.class_types?.name ?? "-"}</TableCell>
              <TableCell>
                {cls.bookings?.[0]?.count ?? 0} / {cls.capacity}
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/schedule/${cls.id}`}
                  className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                >
                  Kelola
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {classes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Belum ada jadwal kelas.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

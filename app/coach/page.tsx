import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
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
  locations: { name: string } | null;
  class_types: { name: string } | null;
  bookings: { count: number }[];
}

export default async function CoachSchedulePage() {
  const session = await getSession();
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("classes")
    .select("id, start_time, end_time, capacity, locations(name), class_types(name), bookings(count)")
    .eq("instructor_id", session?.sub)
    .order("start_time");

  const classes = (data ?? []) as unknown as ClassRow[];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Jadwal Saya</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Waktu</TableHead>
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
              <TableCell>{cls.locations?.name ?? "-"}</TableCell>
              <TableCell>{cls.class_types?.name ?? "-"}</TableCell>
              <TableCell>
                {cls.bookings?.[0]?.count ?? 0} / {cls.capacity}
              </TableCell>
              <TableCell>
                <Link href={`/coach/attendance/${cls.id}`} className={buttonVariants({ size: "sm" })}>
                  Absensi
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {classes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Belum ada kelas terjadwal.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deleteClassForm, removeBookingForm } from "@/lib/actions/schedule";
import { BackLink } from "@/components/shared/back-link";
import { ActionSubmitButton } from "@/components/shared/action-submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddBookingForm } from "@/components/schedule/add-booking-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const [{ data: cls }, { data: bookings }, { data: allChildren }] = await Promise.all([
    supabase
      .from("classes")
      .select(
        "id, start_time, end_time, capacity, profiles(full_name), locations(name), class_types(name)"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select("id, is_attended, children(id, full_name)")
      .eq("class_id", id),
    supabase.from("children").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);

  if (!cls) notFound();

  const bookedChildIds = new Set(
    (bookings ?? []).map((b) => (b as unknown as { children: { id: string } }).children.id)
  );
  const availableChildren = (allChildren ?? [])
    .filter((c) => !bookedChildIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.full_name }));

  const info = cls as unknown as {
    start_time: string;
    end_time: string;
    capacity: number;
    profiles: { full_name: string } | null;
    locations: { name: string } | null;
    class_types: { name: string } | null;
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <BackLink href="/admin/schedule" label="Jadwal Kelas" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{info.class_types?.name ?? "Kelas"}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(info.start_time).toLocaleString("id-ID")} —{" "}
            {new Date(info.end_time).toLocaleTimeString("id-ID")} · {info.locations?.name} ·{" "}
            {info.profiles?.full_name}
          </p>
        </div>
        <form action={deleteClassForm}>
          <input type="hidden" name="classId" value={id} />
          <ActionSubmitButton
            variant="destructive"
            size="sm"
            confirmMessage={`Hapus kelas ini beserta ${(bookings ?? []).length} pendaftaran yang ada? Tindakan ini tidak bisa dibatalkan.`}
            successMessage="Kelas dihapus"
          >
            Hapus Kelas
          </ActionSubmitButton>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Peserta ({(bookings ?? []).length} / {info.capacity})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Anak</TableHead>
                <TableHead>Kehadiran</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(bookings ?? []).map((b) => {
                const booking = b as unknown as {
                  id: string;
                  is_attended: boolean;
                  children: { full_name: string };
                };
                return (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.children.full_name}</TableCell>
                    <TableCell>{booking.is_attended ? "Hadir" : "Belum"}</TableCell>
                    <TableCell>
                      <form action={removeBookingForm}>
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <input type="hidden" name="classId" value={id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Batalkan Pendaftaran
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(bookings ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Belum ada peserta.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <AddBookingForm classId={id} availableChildren={availableChildren} />
        </CardContent>
      </Card>
    </div>
  );
}

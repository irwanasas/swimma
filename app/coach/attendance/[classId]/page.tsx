import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/shared/back-link";
import { Card, CardContent } from "@/components/ui/card";
import { AttendanceRoster } from "@/components/attendance/attendance-roster";

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const supabase = await createServerSupabaseClient();

  const [{ data: cls }, { data: bookings }] = await Promise.all([
    supabase
      .from("classes")
      .select("id, start_time, end_time, locations(name), class_types(name)")
      .eq("id", classId)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select("id, is_attended, notes, children(full_name)")
      .eq("class_id", classId),
  ]);

  if (!cls) notFound();

  const info = cls as unknown as {
    start_time: string;
    end_time: string;
    locations: { name: string } | null;
    class_types: { name: string } | null;
  };

  const roster = (bookings ?? []).map((b) => {
    const booking = b as unknown as {
      id: string;
      is_attended: boolean;
      notes: string | null;
      children: { full_name: string };
    };
    return {
      id: booking.id,
      isAttended: booking.is_attended,
      notes: booking.notes,
      childName: booking.children.full_name,
    };
  });

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <BackLink href="/coach" label="Jadwal Saya" />
      <h1 className="text-2xl font-semibold">{info.class_types?.name ?? "Kelas"}</h1>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
          <InfoItem label="Tanggal" value={new Date(info.start_time).toLocaleDateString("id-ID")} />
          <InfoItem
            label="Waktu"
            value={`${new Date(info.start_time).toLocaleTimeString("id-ID")} — ${new Date(info.end_time).toLocaleTimeString("id-ID")}`}
          />
          <InfoItem label="Lokasi" value={info.locations?.name ?? "-"} />
          <InfoItem label="Jenis Kelas" value={info.class_types?.name ?? "-"} />
        </CardContent>
      </Card>

      <AttendanceRoster classId={classId} bookings={roster} />
    </div>
  );
}

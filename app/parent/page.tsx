import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChildWithBookings {
  id: string;
  full_name: string;
  bookings: {
    id: string;
    is_attended: boolean;
    classes: {
      start_time: string;
      end_time: string;
      locations: { name: string } | null;
      class_types: { name: string } | null;
    };
  }[];
}

export default async function ParentSchedulePage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("children")
    .select(
      "id, full_name, bookings(id, is_attended, classes(start_time, end_time, locations(name), class_types(name)))"
    )
    .eq("is_active", true)
    .order("full_name");

  const children = (data ?? []) as unknown as ChildWithBookings[];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Jadwal Anak</h1>
      {children.map((child) => (
        <Card key={child.id}>
          <CardHeader>
            <CardTitle>{child.full_name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {child.bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada jadwal kelas.</p>
            ) : (
              child.bookings
                .sort((a, b) => a.classes.start_time.localeCompare(b.classes.start_time))
                .map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                    <div>
                      <p className="font-medium">{b.classes.class_types?.name ?? "Kelas"}</p>
                      <p className="text-muted-foreground">
                        {new Date(b.classes.start_time).toLocaleString("id-ID")} —{" "}
                        {new Date(b.classes.end_time).toLocaleTimeString("id-ID")} ·{" "}
                        {b.classes.locations?.name}
                      </p>
                    </div>
                    <Badge variant={b.is_attended ? "success" : "outline"}>
                      {b.is_attended ? "Hadir" : "Belum Hadir"}
                    </Badge>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      ))}
      {children.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada data anak terdaftar.</p>
      ) : null}
    </div>
  );
}

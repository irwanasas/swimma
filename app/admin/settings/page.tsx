import { getLocations, getClassTypes } from "@/lib/data/lookups";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LocationForm } from "@/components/settings/location-form";
import { ClassTypeForm } from "@/components/settings/class-type-form";

export default async function SettingsPage() {
  const [locations, classTypes] = await Promise.all([getLocations(), getClassTypes()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Pengaturan</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lokasi Kolam</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {locations.map((l) => (
                <Badge key={l.id} variant="secondary">
                  {l.name}
                </Badge>
              ))}
              {locations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada lokasi.</p>
              ) : null}
            </div>
            <LocationForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Jenis Kelas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {classTypes.map((c) => (
                <Badge key={c.id} variant="secondary">
                  {c.name}
                </Badge>
              ))}
              {classTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada jenis kelas.</p>
              ) : null}
            </div>
            <ClassTypeForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

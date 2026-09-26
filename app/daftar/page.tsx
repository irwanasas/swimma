import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RegisterClubForm } from "@/components/shared/register-club-form";

export default function RegisterClubPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Daftarkan Klub Anda</CardTitle>
          <CardDescription>Mulai gratis dengan trial 14 hari, hingga 20 anggota.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterClubForm />
        </CardContent>
      </Card>
    </div>
  );
}

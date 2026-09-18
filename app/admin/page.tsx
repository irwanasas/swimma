import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Dasbor Admin</h1>
      <Card>
        <CardHeader>
          <CardTitle>Selamat datang</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Gunakan menu di samping untuk mengelola anggota, jadwal, tagihan, buku
          kas, gaji pelatih, promo, dan laporan.
        </CardContent>
      </Card>
    </div>
  );
}

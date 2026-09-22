import Link from "next/link";
import { getDashboardData } from "@/lib/data/dashboard";
import { StatCard } from "@/components/reports/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatRupiah(value: number) {
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID");
}

const CASH_CATEGORY_LABEL: Record<string, string> = {
  payment_received: "Pembayaran Diterima",
  payroll: "Gaji Pelatih",
  manual_adjustment: "Penyesuaian Manual",
};

const QUICK_LINKS = [
  { href: "/admin/members/new", label: "Tambah Anggota" },
  { href: "/admin/schedule/new", label: "Tambah Kelas" },
  { href: "/admin/billing/invoices", label: "Kelola Tagihan" },
  { href: "/admin/promo", label: "Kelola Promo" },
];

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dasbor Admin</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Pendapatan" value={formatRupiah(data.totalRevenue)} />
        <StatCard
          title="Tagihan Belum Bayar"
          value={`${data.outstandingCount} (${formatRupiah(data.outstandingAmount)})`}
        />
        <StatCard title="Saldo Kas" value={formatRupiah(data.cashBalance)} />
        <StatCard
          title="Anggota Aktif / Nonaktif"
          value={`${data.activeChildren} / ${data.inactiveChildren}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tagihan Terlambat</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anak</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.overdueInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.childName}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{formatDate(inv.dueDate)}</Badge>
                    </TableCell>
                    <TableCell>{formatRupiah(inv.amount)}</TableCell>
                  </TableRow>
                ))}
                {data.overdueInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Tidak ada tagihan terlambat.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Langganan Akan Berakhir (7 Hari)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anak</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Berakhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.expiringSubscriptions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.childName}</TableCell>
                    <TableCell>{s.packageName}</TableCell>
                    <TableCell>
                      <Badge variant="warning">{formatDate(s.endDate)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {data.expiringSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Tidak ada langganan yang akan berakhir.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kelas Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Pelatih</TableHead>
                  <TableHead>Peserta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.todaysClasses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {formatTime(c.startTime)} – {formatTime(c.endTime)}
                    </TableCell>
                    <TableCell>
                      {c.classTypeName} · {c.locationName}
                    </TableCell>
                    <TableCell>{c.coachName}</TableCell>
                    <TableCell>
                      {c.bookedCount} / {c.capacity}
                    </TableCell>
                  </TableRow>
                ))}
                {data.todaysClasses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Tidak ada kelas hari ini.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaksi Kas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentCashEntries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.entryDate)}</TableCell>
                    <TableCell>{CASH_CATEGORY_LABEL[e.category] ?? e.category}</TableCell>
                    <TableCell>
                      <Badge variant={e.direction === "in" ? "success" : "secondary"}>
                        {e.direction === "in" ? "+" : "-"}
                        {formatRupiah(e.amount)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {data.recentCashEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Belum ada transaksi.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={buttonVariants({ variant: "outline" })}>
              {link.label}
            </Link>
          ))}
          <Link href="/admin/reports" className={buttonVariants({ variant: "ghost" })}>
            Lihat Laporan Lengkap ({data.activePromoCount} promo aktif)
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

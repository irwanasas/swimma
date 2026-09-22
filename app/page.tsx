import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  CalendarClock,
  ClipboardCheck,
  Wallet,
  BarChart3,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { roleHome } from "@/lib/auth/roles";
import { APP_NAME } from "@/lib/config";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const NAV_LINKS = [
  { href: "#fitur", label: "Fitur" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#multi-klub", label: "Multi Klub" },
  { href: "#dasbor", label: "Dasbor" },
];

const FEATURES = [
  {
    icon: Users,
    title: "Anggota & keluarga",
    description:
      "Data anak dan orang tua dalam satu profil, dengan deteksi duplikat otomatis saat mendaftarkan anggota baru.",
  },
  {
    icon: CalendarClock,
    title: "Jadwal & booking kelas",
    description:
      "Atur kelas reguler maupun privat per lokasi kolam. Pelatih tidak pernah terjadwal ganda—dicegah di level data, bukan cuma di layar.",
  },
  {
    icon: ClipboardCheck,
    title: "Presensi pelatih",
    description:
      "Pelatih mencatat kehadiran langsung dari kelasnya sendiri, lengkap dengan catatan per anak.",
  },
  {
    icon: Wallet,
    title: "Paket & tagihan",
    description:
      "Langganan bulanan atau paket sesi dengan masa berlaku—tagihan terbit otomatis, orang tua tinggal melihat statusnya.",
  },
  {
    icon: BarChart3,
    title: "Buku kas & gaji pelatih",
    description:
      "Setiap pemasukan dan pengeluaran tercatat rapi dan tidak bisa diubah setelah dibukukan. Gaji pelatih terhubung langsung ke buku kas.",
  },
  {
    icon: ShieldCheck,
    title: "Laporan yang bisa dipercaya",
    description:
      "Pendapatan, tunggakan, dan biaya operasional dihitung dari data yang sama dengan yang dilihat orang tua—bukan rekap terpisah.",
  },
];

const STEPS = [
  {
    title: "Daftarkan klub Anda",
    description: "Kode klub, admin pertama, dan lokasi kolam disiapkan dalam satu proses onboarding.",
  },
  {
    title: "Atur jadwal & pelatih",
    description: "Buat jenis kelas, jadwal mingguan, dan akun pelatih dalam hitungan menit.",
  },
  {
    title: "Anggota booking, pelatih presensi",
    description: "Orang tua melihat jadwal anaknya, pelatih mencatat kehadiran langsung dari kelas.",
  },
  {
    title: "Tagihan & laporan berjalan sendiri",
    description: "Paket bulanan maupun paket sesi tertagih otomatis; buku kas dan laporan selalu terkini.",
  },
];

const DEMO_CLUBS = [
  { name: "Kolam Renang Melati", locations: "2 lokasi", members: "184 anggota" },
  { name: "Aquatic Center Nusantara", locations: "1 lokasi", members: "96 anggota" },
  { name: "Sekolah Renang Ombak", locations: "3 lokasi", members: "312 anggota" },
];

const DEMO_OVERDUE = [
  { child: "Adiba Ramadhani", due: "12 Sep 2026", amount: "Rp 450.000" },
  { child: "Bagas Wicaksono", due: "15 Sep 2026", amount: "Rp 600.000" },
];

export default async function Home() {
  const session = await getSession();
  if (session) redirect(roleHome(session.app_role));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="font-heading text-lg font-semibold tracking-tight text-primary">{APP_NAME}</span>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </a>
            ))}
          </nav>
          <Link href="/login" className={buttonVariants({ variant: "outline" })}>
            Masuk
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-32">
          <div className="motion-safe:animate-fade-up">
            <h1 className="max-w-xl font-heading text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Kelola klub renang Anda satu putaran lebih cepat.
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Anggota, jadwal, presensi, tagihan, buku kas, dan gaji pelatih—dalam satu platform. Untuk satu klub,
              atau puluhan klub sekaligus.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4 motion-safe:animate-fade-up motion-safe:[animation-delay:150ms]">
              <Link href="/login" className={buttonVariants({ size: "lg" })}>
                Masuk ke Akun Klub
              </Link>
              <a href="#cara-kerja" className={buttonVariants({ variant: "ghost", size: "lg" })}>
                Lihat cara kerjanya
              </a>
            </div>
          </div>

          <div className="motion-safe:animate-fade-up motion-safe:[animation-delay:250ms]">
            <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              {[
                { label: "Anggota aktif", value: "1.240+" },
                { label: "Kelas terjadwal / minggu", value: "310" },
                { label: "Klub berjalan di satu platform", value: "27" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-6 py-5">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className="font-heading text-2xl font-semibold text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="fitur" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="max-w-lg font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Semua operasional klub, satu sumber data.
          </h2>
          <div className="mt-10 flex flex-col divide-y divide-border border-t border-border">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="grid gap-3 py-6 sm:grid-cols-[280px_1fr] sm:gap-8 sm:py-8">
                <div className="flex items-center gap-3">
                  <feature.icon className="size-5 shrink-0 text-primary" aria-hidden />
                  <h3 className="font-heading text-lg font-semibold text-foreground">{feature.title}</h3>
                </div>
                <p className="max-w-xl text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="cara-kerja" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="max-w-lg font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Dari daftar klub sampai laporan bulanan.
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-2">
                <span className="font-heading text-sm font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-heading text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="multi-klub" className="bg-sidebar py-16 text-sidebar-foreground sm:py-24">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Satu platform, klub renang berapa pun.
              </h2>
              <p className="mt-6 max-w-md text-sidebar-muted-foreground">
                Setiap klub punya data, anggota, jadwal, dan brand sendiri—terisolasi penuh di level basis data,
                bukan sekadar tampilan. Menambahkan klub baru tidak butuh deployment terpisah.
              </p>
              <div className="mt-8 flex items-center gap-3 text-sm text-sidebar-muted-foreground">
                <Building2 className="size-5 shrink-0" aria-hidden />
                <span>Kelola sebanyak apapun klub dari satu dasbor yang sama.</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {DEMO_CLUBS.map((club) => (
                <div
                  key={club.name}
                  className="flex items-center justify-between rounded-lg border border-sidebar-border bg-sidebar-accent px-5 py-4"
                >
                  <div>
                    <p className="font-heading font-semibold">{club.name}</p>
                    <p className="text-sm text-sidebar-muted-foreground">{club.locations}</p>
                  </div>
                  <Badge variant="secondary">{club.members}</Badge>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="dasbor" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="max-w-lg font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Dasbor yang langsung menjawab: apa yang butuh perhatian hari ini?
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Contoh tampilan dasbor admin—pendapatan, tagihan terlambat, dan kelas hari ini dalam satu layar.
          </p>
          <div className="mt-10 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="grid gap-px bg-border sm:grid-cols-3">
              {[
                { label: "Total Pendapatan", value: "Rp 48.500.000" },
                { label: "Tagihan Belum Bayar", value: "6 (Rp 2.100.000)" },
                { label: "Anggota Aktif", value: "184" },
              ].map((stat) => (
                <div key={stat.label} className="bg-card px-6 py-5">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 font-heading text-xl font-semibold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="p-6">
              <p className="mb-3 text-sm font-semibold text-muted-foreground">Tagihan Terlambat</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Anak</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEMO_OVERDUE.map((row) => (
                    <TableRow key={row.child}>
                      <TableCell>{row.child}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{row.due}</Badge>
                      </TableCell>
                      <TableCell>{row.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>

        <section className="bg-primary py-16 text-primary-foreground sm:py-24">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 sm:px-6">
            <h2 className="max-w-lg font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Siap kelola klub renang Anda dengan lebih rapi?
            </h2>
            <Link
              href="/login"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Masuk ke Akun Klub
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            © {new Date().getFullYear()} {APP_NAME}. Manajemen klub renang anak.
          </span>
          <div className="flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </a>
            ))}
            <Link href="/login" className="transition-colors hover:text-foreground">
              Masuk
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

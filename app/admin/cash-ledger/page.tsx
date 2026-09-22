import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { TriggerDialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdjustmentForm } from "@/components/cash-ledger/adjustment-form";

const CATEGORY_LABEL: Record<string, string> = {
  payment_received: "Pembayaran Diterima",
  payroll: "Gaji Pelatih",
  manual_adjustment: "Penyesuaian Manual",
};

export default async function CashLedgerPage() {
  const supabase = await createServerSupabaseClient();
  const { data: entries } = await supabase
    .from("cash_ledger_with_balance")
    .select("id, entry_date, category, direction, amount, reason, running_balance")
    .order("entry_date", { ascending: false })
    .limit(200);

  const latestBalance = entries?.[0]?.running_balance ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Buku Kas</h1>
        <div className="flex items-center gap-3">
          <Badge variant={Number(latestBalance) >= 0 ? "success" : "destructive"} className="text-sm">
            Saldo: Rp {Number(latestBalance).toLocaleString("id-ID")}
          </Badge>
          <TriggerDialog trigger={<span className={buttonVariants({})}>Tambah Penyesuaian</span>}>
            <h2 className="mb-4 text-xl font-semibold">Tambah Penyesuaian Manual</h2>
            <AdjustmentForm />
          </TriggerDialog>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground">Riwayat Transaksi</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Arah</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Saldo</TableHead>
            <TableHead>Keterangan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(entries ?? []).map((e) => (
            <TableRow key={e.id}>
              <TableCell>{new Date(e.entry_date).toLocaleString("id-ID")}</TableCell>
              <TableCell>{CATEGORY_LABEL[e.category] ?? e.category}</TableCell>
              <TableCell>
                <Badge variant={e.direction === "in" ? "success" : "secondary"}>
                  {e.direction === "in" ? "Masuk" : "Keluar"}
                </Badge>
              </TableCell>
              <TableCell>Rp {Number(e.amount).toLocaleString("id-ID")}</TableCell>
              <TableCell>Rp {Number(e.running_balance).toLocaleString("id-ID")}</TableCell>
              <TableCell>{e.reason ?? "-"}</TableCell>
            </TableRow>
          ))}
          {(entries ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Belum ada transaksi.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

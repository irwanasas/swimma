import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "success" | "secondary" | "destructive"> = {
  paid: "success",
  outstanding: "secondary",
  void: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  paid: "Lunas",
  outstanding: "Belum Bayar",
  void: "Dibatalkan",
};

export default async function ParentBillingPage() {
  const supabase = await createServerSupabaseClient();
  const [{ data: invoices }, { data: usageRows }] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, amount, status, due_date, period_start, period_end, children(full_name)")
      .order("due_date", { ascending: false }),
    supabase
      .from("subscription_usage")
      .select("child_id, child_name, sessions_used, sessions_included, end_date, is_expired"),
  ]);

  const usage = (usageRows ?? []) as unknown as {
    child_id: string;
    child_name: string;
    sessions_used: number;
    sessions_included: number;
    end_date: string | null;
    is_expired: boolean;
  }[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Tagihan</h1>
      {usage.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {usage.map((u) => (
            <Card key={u.child_id}>
              <CardHeader>
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  {u.child_name} — Paket Sesi
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-lg font-semibold">
                  {u.sessions_used} / {u.sessions_included} sesi
                </span>
                {u.end_date ? (
                  <Badge variant={u.is_expired ? "destructive" : "secondary"}>
                    {u.is_expired ? "Kedaluwarsa" : "Berlaku sampai"} {u.end_date}
                  </Badge>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Anak</TableHead>
            <TableHead>Periode</TableHead>
            <TableHead>Jatuh Tempo</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(invoices ?? []).map((inv) => {
            const row = inv as unknown as {
              id: string;
              amount: number;
              status: string;
              due_date: string;
              period_start: string;
              period_end: string;
              children: { full_name: string } | null;
            };
            return (
              <TableRow key={row.id}>
                <TableCell>{row.children?.full_name ?? "-"}</TableCell>
                <TableCell>
                  {row.period_start} – {row.period_end}
                </TableCell>
                <TableCell>{row.due_date}</TableCell>
                <TableCell>Rp {Number(row.amount).toLocaleString("id-ID")}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[row.status] ?? "secondary"}>
                    {STATUS_LABEL[row.status] ?? row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
          {(invoices ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Belum ada tagihan.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

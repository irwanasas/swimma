import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveChildren, getActivePackages } from "@/lib/data/lookups";
import { cancelSubscriptionForm } from "@/lib/actions/billing";
import { ActionSubmitButton } from "@/components/shared/action-submit-button";
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
import { SubscriptionForm } from "@/components/billing/subscription-form";

const STATUS_LABEL: Record<string, string> = {
  active: "Aktif",
  paused: "Ditunda",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
};

export default async function SubscriptionsPage() {
  const supabase = await createServerSupabaseClient();
  const [{ data: subscriptions }, childOptions, packages] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, status, start_date, end_date, children(full_name), membership_packages(name)")
      .order("start_date", { ascending: false }),
    getActiveChildren(),
    getActivePackages(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Langganan</h1>
      <h2 className="text-sm font-semibold text-muted-foreground">Daftar Langganan</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Anak</TableHead>
            <TableHead>Paket</TableHead>
            <TableHead>Mulai</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(subscriptions ?? []).map((s) => {
            const row = s as unknown as {
              id: string;
              status: string;
              start_date: string;
              children: { full_name: string } | null;
              membership_packages: { name: string } | null;
            };
            return (
              <TableRow key={row.id}>
                <TableCell>{row.children?.full_name ?? "-"}</TableCell>
                <TableCell>{row.membership_packages?.name ?? "-"}</TableCell>
                <TableCell>{row.start_date}</TableCell>
                <TableCell>
                  <Badge variant={row.status === "active" ? "success" : "secondary"}>
                    {STATUS_LABEL[row.status] ?? row.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {row.status === "active" ? (
                    <form action={cancelSubscriptionForm}>
                      <input type="hidden" name="subscriptionId" value={row.id} />
                      <ActionSubmitButton
                        variant="ghost"
                        size="sm"
                        confirmMessage="Batalkan langganan ini? Tindakan ini tidak bisa dibatalkan."
                        successMessage="Langganan dibatalkan"
                      >
                        Batalkan Langganan
                      </ActionSubmitButton>
                    </form>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
          {(subscriptions ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Belum ada langganan.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Tambah Langganan</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionForm childOptions={childOptions} packages={packages} />
        </CardContent>
      </Card>
    </div>
  );
}

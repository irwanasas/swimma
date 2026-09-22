import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveChildren, getActivePackages } from "@/lib/data/lookups";
import { cancelSubscriptionForm } from "@/lib/actions/billing";
import { ActionSubmitButton } from "@/components/shared/action-submit-button";
import { ListFilters } from "@/components/shared/list-filters";
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
import { SubscriptionForm } from "@/components/billing/subscription-form";

const STATUS_LABEL: Record<string, string> = {
  active: "Aktif",
  paused: "Ditunda",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
};

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; package?: string }>;
}) {
  const { status, package: packageId } = await searchParams;
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("subscriptions")
    .select("id, status, start_date, end_date, children(full_name), membership_packages(name)")
    .order("start_date", { ascending: false });
  if (status) query = query.eq("status", status);
  if (packageId) query = query.eq("package_id", packageId);
  const [{ data: subscriptions }, { data: usageRows }, childOptions, packages] = await Promise.all([
    query,
    supabase.from("subscription_usage").select("subscription_id, sessions_used, sessions_included"),
    getActiveChildren(),
    getActivePackages(),
  ]);
  const usageBySubscription = new Map(
    (usageRows ?? []).map((u) => [u.subscription_id, u])
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Langganan</h1>
        <TriggerDialog trigger={<span className={buttonVariants({})}>Tambah Langganan</span>}>
          <h2 className="mb-4 text-xl font-semibold">Tambah Langganan</h2>
          <SubscriptionForm childOptions={childOptions} packages={packages} />
        </TriggerDialog>
      </div>
      <h2 className="text-sm font-semibold text-muted-foreground">Daftar Langganan</h2>
      <ListFilters
        fields={[
          {
            type: "select",
            name: "status",
            placeholder: "Semua Status",
            options: [
              { value: "active", label: "Aktif" },
              { value: "paused", label: "Ditunda" },
              { value: "cancelled", label: "Dibatalkan" },
              { value: "expired", label: "Kedaluwarsa" },
            ],
          },
          {
            type: "select",
            name: "package",
            placeholder: "Semua Paket",
            options: packages.map((p) => ({ value: p.id, label: p.name })),
          },
        ]}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Anak</TableHead>
            <TableHead>Paket</TableHead>
            <TableHead>Mulai</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sesi</TableHead>
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
            const usage = usageBySubscription.get(row.id);
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
                  {usage ? `${usage.sessions_used} / ${usage.sessions_included}` : "-"}
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
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Belum ada langganan.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

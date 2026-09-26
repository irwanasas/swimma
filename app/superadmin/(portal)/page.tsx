import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { updateTenantSubscription } from "@/lib/actions/superadmin";
import { StatCard } from "@/components/reports/stat-card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ActionSubmitButton } from "@/components/shared/action-submit-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABEL: Record<string, string> = {
  trial: "Trial",
  active: "Aktif",
  suspended: "Ditangguhkan",
  cancelled: "Dibatalkan",
};

const STATUS_VARIANT: Record<string, "success" | "secondary" | "destructive" | "warning"> = {
  trial: "warning",
  active: "success",
  suspended: "destructive",
  cancelled: "secondary",
};

function formatRupiah(value: number) {
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

export default async function SuperadminDashboardPage() {
  const supabase = createAdminSupabaseClient();

  const [{ data: tenants }, { data: subscriptions }, { data: plans }, { data: children }] =
    await Promise.all([
      supabase.from("tenants").select("id, name, slug, is_active, created_at").order("created_at", {
        ascending: false,
      }),
      supabase
        .from("platform_subscriptions")
        .select("tenant_id, plan_id, status, trial_ends_at, notes"),
      supabase
        .from("platform_plans")
        .select("id, name, price, billing_cycle, member_limit")
        .eq("is_active", true)
        .order("price"),
      supabase.from("children").select("tenant_id").eq("is_active", true),
    ]);

  const subscriptionByTenant = new Map((subscriptions ?? []).map((s) => [s.tenant_id, s]));
  const planById = new Map((plans ?? []).map((p) => [p.id, p]));
  const memberCountByTenant = new Map<string, number>();
  for (const c of children ?? []) {
    memberCountByTenant.set(c.tenant_id, (memberCountByTenant.get(c.tenant_id) ?? 0) + 1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const trialCount = (subscriptions ?? []).filter((s) => s.status === "trial").length;
  const activeCount = (subscriptions ?? []).filter((s) => s.status === "active").length;
  const expiredTrialCount = (subscriptions ?? []).filter(
    (s) => s.status === "trial" && s.trial_ends_at && s.trial_ends_at < today
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dasbor Platform</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Klub" value={String((tenants ?? []).length)} />
        <StatCard title="Klub Trial" value={String(trialCount)} />
        <StatCard title="Klub Aktif (Berbayar)" value={String(activeCount)} />
        <StatCard title="Trial Telah Berakhir" value={String(expiredTrialCount)} />
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground">Semua Klub</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Klub</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Paket</TableHead>
            <TableHead>Anggota</TableHead>
            <TableHead>Trial Berakhir</TableHead>
            <TableHead>Ubah Langganan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(tenants ?? []).map((tenant) => {
            const subscription = subscriptionByTenant.get(tenant.id);
            const plan = subscription ? planById.get(subscription.plan_id) : undefined;
            const memberCount = memberCountByTenant.get(tenant.id) ?? 0;
            const status = subscription?.status ?? "trial";
            const isTrialExpired =
              status === "trial" && subscription?.trial_ends_at && subscription.trial_ends_at < today;

            return (
              <TableRow key={tenant.id}>
                <TableCell>
                  <div className="font-medium">{tenant.name}</div>
                  <div className="text-xs text-muted-foreground">{tenant.slug}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[status] ?? "secondary"}>
                    {STATUS_LABEL[status] ?? status}
                  </Badge>
                  {isTrialExpired ? (
                    <Badge variant="destructive" className="ml-1">
                      Kedaluwarsa
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell>
                  {plan ? `${plan.name} (${formatRupiah(plan.price)}/${plan.billing_cycle === "monthly" ? "bln" : "thn"})` : "-"}
                </TableCell>
                <TableCell>
                  {memberCount}
                  {plan?.member_limit ? ` / ${plan.member_limit}` : ""}
                </TableCell>
                <TableCell>{subscription?.trial_ends_at ?? "-"}</TableCell>
                <TableCell>
                  <form action={updateTenantSubscription} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="tenantId" value={tenant.id} />
                    <Select name="planId" defaultValue={subscription?.plan_id ?? ""} className="w-40">
                      {(plans ?? []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                    <Select name="status" defaultValue={status} className="w-36">
                      {Object.entries(STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                    <Input
                      name="notes"
                      placeholder="Catatan"
                      defaultValue={subscription?.notes ?? ""}
                      className="w-36"
                    />
                    <ActionSubmitButton size="sm" successMessage="Langganan diperbarui">
                      Simpan
                    </ActionSubmitButton>
                  </form>
                </TableCell>
              </TableRow>
            );
          })}
          {(tenants ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Belum ada klub.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

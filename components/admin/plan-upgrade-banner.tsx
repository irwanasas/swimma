import { getActivePlans, type OwnSubscription } from "@/lib/data/platform-plan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatRupiah(value: number) {
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

function daysUntil(dateString: string): number {
  const diffMs = new Date(dateString).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export async function PlanUpgradeBanner({
  subscription,
  activeMemberCount,
}: {
  subscription: OwnSubscription | null;
  activeMemberCount: number;
}) {
  if (!subscription) return null;

  if (subscription.status === "suspended") {
    return (
      <Card className="border-destructive">
        <CardContent className="flex flex-col gap-1 pt-6">
          <p className="font-semibold text-destructive">Langganan platform ditangguhkan</p>
          <p className="text-sm text-muted-foreground">
            Hubungi admin platform Swimma untuk mengaktifkan kembali akses klub Anda.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (subscription.status !== "trial") return null;

  const plans = await getActivePlans();
  const memberLimit = subscription.plan?.memberLimit ?? null;
  const daysLeft = subscription.trialEndsAt ? daysUntil(subscription.trialEndsAt) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Trial{daysLeft !== null ? ` — ${daysLeft} hari lagi` : ""}
          {memberLimit ? ` · ${activeMemberCount}/${memberLimit} anggota` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Upgrade kapan saja agar tidak terputus. Hubungi admin platform Swimma untuk mengaktifkan
          salah satu paket berikut.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {plans
            .filter((p) => p.price > 0)
            .map((plan) => (
              <div key={plan.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold">{plan.name}</span>
                  {plan.name === "Growth" ? <Badge>Populer</Badge> : null}
                </div>
                <p className="mt-1 text-lg font-semibold text-primary">
                  {formatRupiah(plan.price)}
                  <span className="text-xs font-normal text-muted-foreground">/bln</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {plan.memberLimit ? `Hingga ${plan.memberLimit} anggota` : "Anggota tanpa batas"}
                </p>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

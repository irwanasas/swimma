import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deletePromoForm } from "@/lib/actions/promo";
import { ActionSubmitButton } from "@/components/shared/action-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PromoForm } from "@/components/promo/promo-form";

export default async function PromoAdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: promos } = await supabase
    .from("promo")
    .select("id, title, body, image_url, active_from, active_until")
    .order("active_from", { ascending: false });

  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Promo</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Tambah Promo Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <PromoForm />
        </CardContent>
      </Card>

      <h2 className="text-sm font-semibold text-muted-foreground">Semua Promo</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {(promos ?? []).map((p) => {
          const isActive =
            new Date(p.active_from) <= now && (!p.active_until || new Date(p.active_until) >= now);
          return (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{p.title}</CardTitle>
                <Badge variant={isActive ? "success" : "secondary"}>
                  {isActive ? "Aktif" : "Tidak Aktif"}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">{p.body}</p>
                <form action={deletePromoForm}>
                  <input type="hidden" name="promoId" value={p.id} />
                  <ActionSubmitButton
                    variant="destructive"
                    size="sm"
                    confirmMessage="Hapus promo ini? Tindakan ini tidak bisa dibatalkan."
                    successMessage="Promo dihapus"
                  >
                    Hapus
                  </ActionSubmitButton>
                </form>
              </CardContent>
            </Card>
          );
        })}
        {(promos ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada promo.</p>
        ) : null}
      </div>
    </div>
  );
}

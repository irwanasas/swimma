import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PromoCard } from "@/components/promo/promo-card";

export default async function ParentPromoPage() {
  const supabase = await createServerSupabaseClient();
  const { data: promos } = await supabase
    .from("promo")
    .select("id, title, body, image_url, active_from, active_until")
    .order("active_from", { ascending: false });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Promo</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {(promos ?? []).map((p) => (
          <PromoCard key={p.id} promo={p} />
        ))}
        {(promos ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada promo aktif.</p>
        ) : null}
      </div>
    </div>
  );
}

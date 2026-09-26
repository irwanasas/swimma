import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface PlatformPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: "monthly" | "yearly";
  memberLimit: number | null;
}

export interface OwnSubscription {
  status: "trial" | "active" | "suspended" | "cancelled";
  trialEndsAt: string | null;
  plan: PlatformPlan | null;
}

export async function getActivePlans(): Promise<PlatformPlan[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("platform_plans")
    .select("id, name, price, billing_cycle, member_limit")
    .eq("is_active", true)
    .order("price");
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    billingCycle: p.billing_cycle,
    memberLimit: p.member_limit,
  }));
}

export async function getOwnSubscription(): Promise<OwnSubscription | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("platform_subscriptions")
    .select("status, trial_ends_at, platform_plans(id, name, price, billing_cycle, member_limit)")
    .maybeSingle();
  if (!data) return null;
  const plan = data.platform_plans as unknown as {
    id: string;
    name: string;
    price: number;
    billing_cycle: "monthly" | "yearly";
    member_limit: number | null;
  } | null;
  return {
    status: data.status as OwnSubscription["status"],
    trialEndsAt: data.trial_ends_at,
    plan: plan
      ? {
          id: plan.id,
          name: plan.name,
          price: Number(plan.price),
          billingCycle: plan.billing_cycle,
          memberLimit: plan.member_limit,
        }
      : null,
  };
}

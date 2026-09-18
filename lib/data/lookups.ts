import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface Lookup {
  id: string;
  name: string;
}

export async function getLocations(): Promise<Lookup[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("locations").select("id, name").order("name");
  return data ?? [];
}

export async function getClassTypes(): Promise<Lookup[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("class_types").select("id, name").order("name");
  return data ?? [];
}

export async function getActiveCoaches(): Promise<Lookup[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "coach")
    .eq("is_active", true)
    .order("full_name");
  return (data ?? []).map((c) => ({ id: c.id, name: c.full_name }));
}

export async function getActiveChildren(): Promise<Lookup[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("children")
    .select("id, full_name")
    .eq("is_active", true)
    .order("full_name");
  return (data ?? []).map((c) => ({ id: c.id, name: c.full_name }));
}

export async function getActivePackages(): Promise<Lookup[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("membership_packages")
    .select("id, name")
    .eq("is_active", true)
    .order("name");
  return (data ?? []).map((p) => ({ id: p.id, name: p.name }));
}

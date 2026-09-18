import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSessionToken } from "@/lib/auth/session";

export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const token = await getSessionToken();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    }
  );
}

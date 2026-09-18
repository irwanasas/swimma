import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const fullName = process.env.SEED_ADMIN_NAME ?? "Admin";
  const tenantSlug = process.env.SEED_TENANT_SLUG;
  const tenantName = process.env.SEED_TENANT_NAME ?? tenantSlug;

  if (!email || !password) {
    console.error(
      "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD environment variables before running this script."
    );
    process.exit(1);
  }

  if (!tenantSlug) {
    console.error(
      "Set SEED_TENANT_SLUG (a short unique code for this club, e.g. 'my-club') before running this script."
    );
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables before running this script."
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  let { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .maybeSingle();

  if (!tenant) {
    const { data: created, error: tenantError } = await supabase
      .from("tenants")
      .insert({ slug: tenantSlug, name: tenantName })
      .select("id")
      .single();
    if (tenantError || !created) {
      console.error("Failed to create tenant:", tenantError?.message);
      process.exit(1);
    }
    tenant = created;
    console.log(`Created tenant "${tenantName}" (slug: ${tenantSlug}).`);
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    console.error(`A profile with email ${email} already exists in this tenant (id: ${existing.id}).`);
    process.exit(1);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({ tenant_id: tenant.id, role: "admin", full_name: fullName, email })
    .select("id")
    .single();

  if (profileError || !profile) {
    console.error("Failed to create admin profile:", profileError?.message);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { error: credentialsError } = await supabase
    .from("auth_credentials")
    .insert({ profile_id: profile.id, password_hash: passwordHash });

  if (credentialsError) {
    console.error("Failed to create admin credentials:", credentialsError.message);
    await supabase.from("profiles").delete().eq("id", profile.id);
    process.exit(1);
  }

  console.log(`Admin account created for ${email} in tenant "${tenantSlug}".`);
}

main();

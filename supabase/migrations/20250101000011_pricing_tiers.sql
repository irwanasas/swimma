-- Cost-justified pricing tiers, replacing the placeholder flat "Berbayar"
-- plan. See README "Pricing model" for the cost-floor math. Kept (not
-- deleted) so any tenant still referencing it keeps a valid FK.
update platform_plans set is_active = false where name = 'Berbayar';

insert into platform_plans (name, price, billing_cycle, member_limit) values
  ('Starter', 300000, 'monthly', 75),
  ('Growth', 750000, 'monthly', 250),
  ('Pro', 1500000, 'monthly', null);

-- Plan menu is public-ish reference data (needed by a tenant admin's own
-- dashboard, and safe to expose — it carries no other tenant's data).
create policy platform_plans_select_all on platform_plans for select to authenticated
  using (is_active);

-- A tenant admin may see their OWN club's subscription/plan status, never
-- another tenant's — this is a narrow read exception, not a reversal of
-- "superadmin manages billing": there is still no update policy here, so
-- upgrades remain a superadmin-only action via the service-role client.
create policy platform_subscriptions_select_own on platform_subscriptions for select to authenticated
  using (is_admin() and tenant_id = current_tenant_id());

alter table tenants enable row level security;
alter table profiles enable row level security;
alter table auth_credentials enable row level security;
alter table locations enable row level security;
alter table class_types enable row level security;
alter table children enable row level security;
alter table classes enable row level security;
alter table bookings enable row level security;
alter table membership_packages enable row level security;
alter table subscriptions enable row level security;
alter table invoices enable row level security;
alter table cash_ledger enable row level security;
alter table payroll_runs enable row level security;
alter table promo enable row level security;

-- auth_credentials: no policies at all (default deny for anon/authenticated,
-- reachable only through the service-role client).

-- tenants: every authenticated user can read (and an admin can update) only
-- their own tenant; tenant creation/deactivation is service-role only.
create policy tenants_select_own on tenants for select to authenticated
  using (id = current_tenant_id());
create policy tenants_update_admin on tenants for update to authenticated
  using (is_admin() and id = current_tenant_id())
  with check (id = current_tenant_id());

-- profiles
create policy profiles_select_admin on profiles for select to authenticated
  using (is_admin() and tenant_id = current_tenant_id());
create policy profiles_select_self on profiles for select to authenticated
  using (id = auth.uid());
create policy profiles_update_admin on profiles for update to authenticated
  using (is_admin() and tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());
create policy profiles_update_self on profiles for update to authenticated
  using (id = auth.uid() and is_active_user())
  with check (id = auth.uid() and role = current_app_role() and tenant_id = current_tenant_id());

-- locations
create policy locations_select_all on locations for select to authenticated
  using (tenant_id = current_tenant_id());
create policy locations_write_admin on locations for all to authenticated
  using (is_admin() and tenant_id = current_tenant_id())
  with check (is_admin() and tenant_id = current_tenant_id());

-- class_types
create policy class_types_select_all on class_types for select to authenticated
  using (tenant_id = current_tenant_id());
create policy class_types_write_admin on class_types for all to authenticated
  using (is_admin() and tenant_id = current_tenant_id())
  with check (is_admin() and tenant_id = current_tenant_id());

-- children
create policy children_select on children for select to authenticated
  using (
    tenant_id = current_tenant_id()
    and (
      is_admin()
      or (is_parent() and parent_id = auth.uid())
      or (is_coach() and exists (
        select 1 from bookings b
        join classes cl on cl.id = b.class_id
        where b.child_id = children.id and cl.instructor_id = auth.uid()
      ))
    )
  );
create policy children_insert on children for insert to authenticated
  with check (
    tenant_id = current_tenant_id()
    and (is_admin() or (is_parent() and parent_id = auth.uid()))
  );
create policy children_update on children for update to authenticated
  using (tenant_id = current_tenant_id() and (is_admin() or (is_parent() and parent_id = auth.uid())))
  with check (tenant_id = current_tenant_id() and (is_admin() or (is_parent() and parent_id = auth.uid())));
create policy children_delete on children for delete to authenticated
  using (tenant_id = current_tenant_id() and (is_admin() or (is_parent() and parent_id = auth.uid())));

-- classes
create policy classes_select_all on classes for select to authenticated
  using (tenant_id = current_tenant_id());
create policy classes_write_admin on classes for all to authenticated
  using (is_admin() and tenant_id = current_tenant_id())
  with check (is_admin() and tenant_id = current_tenant_id());

-- bookings
create policy bookings_select on bookings for select to authenticated
  using (tenant_id = current_tenant_id() and (is_admin() or coach_owns_class(class_id) or owns_child(child_id)));
create policy bookings_insert_admin on bookings for insert to authenticated
  with check (tenant_id = current_tenant_id() and is_admin());
create policy bookings_insert_parent on bookings for insert to authenticated
  with check (tenant_id = current_tenant_id() and is_parent() and owns_child(child_id) and is_attended = false);
create policy bookings_update on bookings for update to authenticated
  using (tenant_id = current_tenant_id() and (is_admin() or coach_owns_class(class_id)))
  with check (tenant_id = current_tenant_id() and (is_admin() or coach_owns_class(class_id)));
create policy bookings_delete on bookings for delete to authenticated
  using (
    tenant_id = current_tenant_id()
    and (
      is_admin()
      or (owns_child(child_id) and exists (
        select 1 from classes cl where cl.id = bookings.class_id and cl.start_time > now()
      ))
    )
  );

-- membership_packages
create policy membership_packages_select_all on membership_packages for select to authenticated
  using (tenant_id = current_tenant_id());
create policy membership_packages_write_admin on membership_packages for all to authenticated
  using (is_admin() and tenant_id = current_tenant_id())
  with check (is_admin() and tenant_id = current_tenant_id());

-- subscriptions
create policy subscriptions_select on subscriptions for select to authenticated
  using (tenant_id = current_tenant_id() and (is_admin() or owns_child(child_id)));
create policy subscriptions_write_admin on subscriptions for all to authenticated
  using (is_admin() and tenant_id = current_tenant_id())
  with check (is_admin() and tenant_id = current_tenant_id());

-- invoices
create policy invoices_select on invoices for select to authenticated
  using (tenant_id = current_tenant_id() and (is_admin() or owns_child(child_id)));
create policy invoices_write_admin on invoices for all to authenticated
  using (is_admin() and tenant_id = current_tenant_id())
  with check (is_admin() and tenant_id = current_tenant_id());

-- cash_ledger: admin-only, append-only (no update/delete policies)
create policy cash_ledger_select_admin on cash_ledger for select to authenticated
  using (is_admin() and tenant_id = current_tenant_id());
create policy cash_ledger_insert_admin on cash_ledger for insert to authenticated
  with check (is_admin() and tenant_id = current_tenant_id());

-- payroll_runs: admin-only
create policy payroll_runs_select_admin on payroll_runs for select to authenticated
  using (is_admin() and tenant_id = current_tenant_id());
create policy payroll_runs_write_admin on payroll_runs for all to authenticated
  using (is_admin() and tenant_id = current_tenant_id())
  with check (is_admin() and tenant_id = current_tenant_id());

-- promo
create policy promo_select_admin on promo for select to authenticated
  using (is_admin() and tenant_id = current_tenant_id());
create policy promo_select_active on promo for select to authenticated
  using (
    tenant_id = current_tenant_id()
    and active_from <= now()
    and (active_until is null or active_until >= now())
  );
create policy promo_write_admin on promo for all to authenticated
  using (is_admin() and tenant_id = current_tenant_id())
  with check (is_admin() and tenant_id = current_tenant_id());

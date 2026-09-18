create function current_app_role() returns text as $$
  select coalesce(auth.jwt() ->> 'app_role', '');
$$ language sql stable;

create function is_active_user() returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and is_active and tenant_id = current_tenant_id()
  );
$$ language sql stable security definer set search_path = public;

create function is_admin() returns boolean as $$
  select current_app_role() = 'admin' and is_active_user();
$$ language sql stable;

create function is_coach() returns boolean as $$
  select current_app_role() = 'coach' and is_active_user();
$$ language sql stable;

create function is_parent() returns boolean as $$
  select current_app_role() = 'parent' and is_active_user();
$$ language sql stable;

create function owns_child(p_child_id uuid) returns boolean as $$
  select exists (
    select 1 from children c
    join profiles p on p.id = c.parent_id
    where c.id = p_child_id
      and c.parent_id = auth.uid()
      and c.tenant_id = current_tenant_id()
      and p.is_active
  );
$$ language sql stable security definer set search_path = public;

create function coach_owns_class(p_class_id uuid) returns boolean as $$
  select exists (
    select 1 from classes cl
    join profiles p on p.id = cl.instructor_id
    where cl.id = p_class_id
      and cl.instructor_id = auth.uid()
      and cl.tenant_id = current_tenant_id()
      and p.is_active
  );
$$ language sql stable security definer set search_path = public;

create function mark_invoice_paid(p_invoice_id uuid) returns void as $$
declare
  v_amount numeric(12, 2);
  v_tenant_id uuid;
begin
  if not is_admin() then
    raise exception 'forbidden';
  end if;

  v_tenant_id := current_tenant_id();

  update invoices
  set status = 'paid', paid_at = now()
  where id = p_invoice_id and status = 'outstanding' and tenant_id = v_tenant_id
  returning amount into v_amount;

  if v_amount is null then
    raise exception 'invoice not found or already settled';
  end if;

  insert into cash_ledger (tenant_id, category, direction, amount, invoice_id, created_by)
  values (v_tenant_id, 'payment_received', 'in', v_amount, p_invoice_id, auth.uid());
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function mark_invoice_paid(uuid) to authenticated;

create function create_payroll_run(
  p_coach_id uuid,
  p_period_start date,
  p_period_end date,
  p_base_salary numeric,
  p_bonus numeric,
  p_thr numeric
) returns uuid as $$
declare
  v_run_id uuid;
  v_ledger_id uuid;
  v_total numeric;
  v_tenant_id uuid;
begin
  if not is_admin() then
    raise exception 'forbidden';
  end if;

  v_tenant_id := current_tenant_id();

  if not exists (
    select 1 from profiles where id = p_coach_id and role = 'coach' and tenant_id = v_tenant_id
  ) then
    raise exception 'coach not found in this tenant';
  end if;

  insert into payroll_runs (tenant_id, coach_id, period_start, period_end, base_salary, bonus, thr, status)
  values (v_tenant_id, p_coach_id, p_period_start, p_period_end, p_base_salary, p_bonus, p_thr, 'draft')
  returning id, total_amount into v_run_id, v_total;

  insert into cash_ledger (tenant_id, category, direction, amount, payroll_run_id, created_by)
  values (v_tenant_id, 'payroll', 'out', v_total, v_run_id, auth.uid())
  returning id into v_ledger_id;

  update payroll_runs
  set cash_ledger_entry_id = v_ledger_id, status = 'posted', posted_at = now()
  where id = v_run_id;

  return v_run_id;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function create_payroll_run(uuid, date, date, numeric, numeric, numeric) to authenticated;

create function generate_invoices_for_period(
  p_period_start date,
  p_period_end date,
  p_due_date date,
  p_tenant_id uuid default null
) returns setof invoices as $$
  insert into invoices (tenant_id, child_id, subscription_id, amount, due_date, period_start, period_end)
  select s.tenant_id, s.child_id, s.id, mp.price, p_due_date, p_period_start, p_period_end
  from subscriptions s
  join membership_packages mp on mp.id = s.package_id
  where s.status = 'active'
    and (p_tenant_id is null or s.tenant_id = p_tenant_id)
  on conflict (subscription_id, period_start) do nothing
  returning *;
$$ language sql security definer set search_path = public;

grant execute on function generate_invoices_for_period(date, date, date, uuid) to service_role;

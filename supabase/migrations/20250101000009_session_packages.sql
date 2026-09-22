alter table membership_packages alter column billing_cycle drop not null;

alter table membership_packages
  add column pricing_mode text not null default 'cycle' check (pricing_mode in ('cycle', 'session_pack')),
  add column sessions_included int check (sessions_included is null or sessions_included > 0),
  add column validity_weeks int check (validity_weeks is null or validity_weeks > 0);

alter table membership_packages
  add constraint membership_packages_pricing_mode_fields_check check (
    (pricing_mode = 'cycle' and billing_cycle is not null and sessions_included is null and validity_weeks is null)
    or (pricing_mode = 'session_pack' and billing_cycle is null and sessions_included is not null and validity_weeks is not null)
  );

-- Recurring cron/manual invoice generation must only ever bill cycle-mode
-- packages; session-pack packages are billed once, on subscribe, by the
-- trigger below. Without this filter the monthly cron would double-bill
-- session-pack subscribers.
create or replace function generate_invoices_for_period(
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
    and mp.pricing_mode = 'cycle'
    and (p_tenant_id is null or s.tenant_id = p_tenant_id)
  on conflict (subscription_id, period_start) do nothing
  returning *;
$$ language sql security definer set search_path = public;

create function set_session_pack_subscription_end_date() returns trigger as $$
declare
  v_validity_weeks int;
begin
  if new.end_date is not null then
    return new;
  end if;

  select validity_weeks into v_validity_weeks
  from membership_packages
  where id = new.package_id and pricing_mode = 'session_pack';

  if v_validity_weeks is not null then
    new.end_date := new.start_date + (v_validity_weeks * 7);
  end if;

  return new;
end;
$$ language plpgsql;

create trigger subscriptions_set_session_pack_end_date before insert on subscriptions
  for each row execute function set_session_pack_subscription_end_date();

create function create_invoice_for_session_pack_subscription() returns trigger as $$
declare
  v_price numeric(12, 2);
  v_pricing_mode text;
begin
  select price, pricing_mode into v_price, v_pricing_mode
  from membership_packages
  where id = new.package_id;

  if v_pricing_mode <> 'session_pack' then
    return new;
  end if;

  insert into invoices (tenant_id, child_id, subscription_id, amount, due_date, period_start, period_end)
  values (new.tenant_id, new.child_id, new.id, v_price, new.start_date, new.start_date, new.end_date)
  on conflict (subscription_id, period_start) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger subscriptions_create_session_pack_invoice after insert on subscriptions
  for each row when (new.status = 'active') execute function create_invoice_for_session_pack_subscription();

create view subscription_usage with (security_invoker = true) as
select
  s.id as subscription_id,
  s.tenant_id,
  s.child_id,
  c.full_name as child_name,
  mp.sessions_included,
  coalesce(bc.sessions_used, 0) as sessions_used,
  greatest(mp.sessions_included - coalesce(bc.sessions_used, 0), 0) as sessions_remaining,
  s.end_date,
  (s.end_date is not null and s.end_date < current_date) as is_expired
from subscriptions s
join membership_packages mp on mp.id = s.package_id and mp.pricing_mode = 'session_pack'
join children c on c.id = s.child_id
left join lateral (
  select count(*) as sessions_used
  from bookings b
  join classes cl on cl.id = b.class_id
  where b.child_id = s.child_id
    and b.is_attended
    and cl.start_time::date >= s.start_date
    and (s.end_date is null or cl.start_time::date <= s.end_date)
) bc on true;

grant select on subscription_usage to authenticated;

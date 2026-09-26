create table superadmins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  password_hash text not null,
  is_active boolean not null default true,
  failed_login_count int not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger superadmins_set_updated_at before update on superadmins
  for each row execute function set_updated_at();

alter table superadmins enable row level security;
-- No policies: reachable only via the service-role client, same as auth_credentials.

create table platform_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric(12, 2) not null default 0 check (price >= 0),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'yearly')),
  member_limit int check (member_limit is null or member_limit > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table platform_plans enable row level security;
-- No policies: managed only by superadmins via the service-role client.

create table platform_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references tenants(id),
  plan_id uuid not null references platform_plans(id),
  status text not null default 'trial' check (status in ('trial', 'active', 'suspended', 'cancelled')),
  trial_ends_at date,
  activated_at timestamptz,
  activated_by text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger platform_subscriptions_set_updated_at before update on platform_subscriptions
  for each row execute function set_updated_at();

alter table platform_subscriptions enable row level security;
-- No policies: managed only by superadmins via the service-role client.

insert into platform_plans (name, price, billing_cycle, member_limit) values
  ('Trial', 0, 'monthly', 20),
  ('Berbayar', 500000, 'monthly', null);

create function enforce_trial_member_limit() returns trigger as $$
declare
  v_limit int;
  v_count int;
begin
  select mp.member_limit into v_limit
  from platform_subscriptions ps
  join platform_plans mp on mp.id = ps.plan_id
  where ps.tenant_id = new.tenant_id;

  if v_limit is null then
    return new;
  end if;

  select count(*) into v_count from children where tenant_id = new.tenant_id and is_active;

  if v_count >= v_limit then
    raise exception 'Batas jumlah anggota paket saat ini telah tercapai (%). Hubungi admin platform untuk upgrade paket.', v_limit;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger children_enforce_trial_limit before insert on children
  for each row execute function enforce_trial_member_limit();

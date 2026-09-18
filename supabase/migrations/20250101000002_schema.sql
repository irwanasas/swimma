create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table profiles (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('admin', 'coach', 'parent')),
  full_name text not null,
  phone text,
  email text not null unique,
  is_active boolean not null default true,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();

create table auth_credentials (
  profile_id uuid primary key references profiles(id) on delete cascade,
  password_hash text not null,
  failed_login_count int not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger auth_credentials_set_updated_at before update on auth_credentials
  for each row execute function set_updated_at();

create table locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text,
  created_at timestamptz not null default now()
);

create table class_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references profiles(id) on delete cascade,
  full_name text not null,
  date_of_birth date not null,
  notes text,
  address text,
  preferred_location_id uuid references locations(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index children_parent_id_idx on children(parent_id);
create index children_full_name_trgm_idx on children using gin (full_name gin_trgm_ops);

create trigger children_set_updated_at before update on children
  for each row execute function set_updated_at();

create function enforce_children_parent_role() returns trigger as $$
begin
  if not exists (select 1 from profiles where id = new.parent_id and role = 'parent') then
    raise exception 'parent_id must reference a profile with role parent';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger children_enforce_parent_role before insert or update of parent_id on children
  for each row execute function enforce_children_parent_role();

create table classes (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references profiles(id),
  location_id uuid not null references locations(id),
  class_type_id uuid not null references class_types(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  capacity int not null default 8 check (capacity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint classes_time_order check (end_time > start_time),
  exclude using gist (
    instructor_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  )
);

create trigger classes_set_updated_at before update on classes
  for each row execute function set_updated_at();

create function enforce_classes_instructor_role() returns trigger as $$
begin
  if not exists (select 1 from profiles where id = new.instructor_id and role = 'coach') then
    raise exception 'instructor_id must reference a profile with role coach';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger classes_enforce_instructor_role before insert or update of instructor_id on classes
  for each row execute function enforce_classes_instructor_role();

create table bookings (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  is_attended boolean not null default false,
  attended_at timestamptz,
  created_at timestamptz not null default now(),
  unique (child_id, class_id)
);

create index bookings_class_id_idx on bookings(class_id);
create index bookings_child_id_idx on bookings(child_id);

create function enforce_booking_capacity() returns trigger as $$
declare
  v_capacity int;
  v_count int;
begin
  select capacity into v_capacity from classes where id = new.class_id for update;
  if v_capacity is null then
    raise exception 'class not found';
  end if;
  select count(*) into v_count from bookings where class_id = new.class_id;
  if v_count >= v_capacity then
    raise exception 'class is full';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger bookings_enforce_capacity before insert on bookings
  for each row execute function enforce_booking_capacity();

create table membership_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  billing_cycle text not null check (billing_cycle in ('monthly', 'quarterly', 'yearly')),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete restrict,
  package_id uuid not null references membership_packages(id),
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled', 'expired')),
  start_date date not null default current_date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subscriptions_one_active_per_child_idx on subscriptions(child_id) where status = 'active';
create index subscriptions_child_id_idx on subscriptions(child_id);

create trigger subscriptions_set_updated_at before update on subscriptions
  for each row execute function set_updated_at();

create table invoices (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete restrict,
  subscription_id uuid not null references subscriptions(id) on delete restrict,
  amount numeric(12, 2) not null check (amount >= 0),
  status text not null default 'outstanding' check (status in ('outstanding', 'paid', 'void')),
  due_date date not null,
  period_start date not null,
  period_end date not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscription_id, period_start)
);

create index invoices_child_id_idx on invoices(child_id);
create index invoices_status_idx on invoices(status);

create trigger invoices_set_updated_at before update on invoices
  for each row execute function set_updated_at();

create table payroll_runs (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles(id),
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  base_salary numeric(12, 2) not null default 0 check (base_salary >= 0),
  bonus numeric(12, 2) not null default 0 check (bonus >= 0),
  thr numeric(12, 2) not null default 0 check (thr >= 0),
  total_amount numeric(12, 2) generated always as (base_salary + bonus + thr) stored,
  status text not null default 'draft' check (status in ('draft', 'posted')),
  posted_at timestamptz,
  cash_ledger_entry_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, period_start, period_end)
);

create trigger payroll_runs_set_updated_at before update on payroll_runs
  for each row execute function set_updated_at();

create function enforce_payroll_coach_role() returns trigger as $$
begin
  if not exists (select 1 from profiles where id = new.coach_id and role = 'coach') then
    raise exception 'coach_id must reference a profile with role coach';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger payroll_runs_enforce_coach_role before insert or update of coach_id on payroll_runs
  for each row execute function enforce_payroll_coach_role();

create table cash_ledger (
  id uuid primary key default gen_random_uuid(),
  entry_date timestamptz not null default now(),
  category text not null check (category in ('payment_received', 'payroll', 'manual_adjustment')),
  direction text not null check (direction in ('in', 'out')),
  amount numeric(14, 2) not null check (amount > 0),
  invoice_id uuid references invoices(id),
  payroll_run_id uuid references payroll_runs(id),
  reason text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  constraint cash_ledger_traceable check (
    (category = 'payment_received' and invoice_id is not null and payroll_run_id is null and direction = 'in')
    or (category = 'payroll' and payroll_run_id is not null and invoice_id is null and direction = 'out')
    or (category = 'manual_adjustment' and invoice_id is null and payroll_run_id is null
        and reason is not null and length(trim(reason)) > 0)
  )
);

create index cash_ledger_entry_date_idx on cash_ledger(entry_date);
create index cash_ledger_category_idx on cash_ledger(category);

alter table payroll_runs
  add constraint payroll_runs_cash_ledger_entry_id_fkey
  foreign key (cash_ledger_entry_id) references cash_ledger(id);

create table promo (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  image_url text,
  active_from timestamptz not null default now(),
  active_until timestamptz,
  author_id uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger promo_set_updated_at before update on promo
  for each row execute function set_updated_at();

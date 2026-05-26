create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('admin', 'dentist', 'patient');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.appointment_status as enum ('requested', 'approved', 'completed', 'cancelled', 'no_show');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.treatment_status as enum ('planned', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.file_kind as enum ('xray', 'intraoral_photo', 'treatment_photo', 'record');
exception when duplicate_object then null;
end $$;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name public.user_role not null unique,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  address text not null,
  phone text,
  email text,
  business_hours jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'patient',
  full_name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.user_branch_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, branch_id)
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(id) on delete set null,
  branch_id uuid not null references public.branches(id),
  assigned_dentist_id uuid references public.users(id),
  patient_number text not null unique,
  first_name text not null,
  middle_name text,
  last_name text not null,
  birth_date date,
  sex text,
  phone text,
  email text,
  address text,
  emergency_name text,
  emergency_relationship text,
  emergency_phone text,
  allergies text,
  medical_history text,
  dental_history text,
  notes text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.patient_profiles (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null unique references public.patients(id) on delete cascade,
  occupation text,
  civil_status text,
  guardian_name text,
  insurance_provider text,
  consent_signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.procedures (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  default_price numeric(12,2) not null default 0,
  color text not null default '#0ea5e9',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  dentist_id uuid references public.users(id),
  branch_id uuid not null references public.branches(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null,
  status public.appointment_status not null default 'requested',
  cancellation_reason text,
  created_by uuid references public.users(id),
  approved_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint appointments_time_check check (ends_at > starts_at)
);

create unique index if not exists appointments_no_double_booking
on public.appointments (dentist_id, starts_at, ends_at)
where deleted_at is null and status in ('requested', 'approved') and dentist_id is not null;

create table if not exists public.treatments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  dentist_id uuid not null references public.users(id),
  appointment_id uuid references public.appointments(id),
  branch_id uuid not null references public.branches(id),
  procedure_id uuid references public.procedures(id),
  tooth text,
  surfaces text[] not null default '{}',
  diagnosis text,
  notes text,
  status public.treatment_status not null default 'planned',
  fee numeric(12,2) not null default 0,
  treated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.intraoral_charts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  title text not null default 'Primary chart',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id, title)
);

create table if not exists public.chart_entries (
  id uuid primary key default gen_random_uuid(),
  chart_id uuid not null references public.intraoral_charts(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  treatment_id uuid references public.treatments(id),
  procedure_id uuid references public.procedures(id),
  tooth_number text not null,
  surfaces text[] not null default '{}',
  dentition text not null default 'permanent',
  color text not null default '#0ea5e9',
  notes text,
  updated_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.xray_images (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  treatment_id uuid references public.treatments(id),
  branch_id uuid not null references public.branches(id),
  uploaded_by uuid not null references public.users(id),
  kind public.file_kind not null,
  bucket text not null default 'clinical-files',
  path text not null unique,
  file_name text not null,
  content_type text not null,
  size_bytes bigint not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id),
  supplier_id uuid references public.suppliers(id),
  name text not null,
  sku text,
  category text not null default 'general',
  unit text not null default 'pcs',
  quantity numeric(12,2) not null default 0,
  reorder_level numeric(12,2) not null default 0,
  reorder_quantity numeric(12,2) not null default 0,
  expiry_date date,
  unit_cost numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.inventory_logs (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id),
  branch_id uuid not null references public.branches(id),
  patient_id uuid references public.patients(id),
  treatment_id uuid references public.treatments(id),
  used_by uuid references public.users(id),
  action text not null,
  quantity_delta numeric(12,2) not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.restock_reports (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id),
  supplier_id uuid references public.suppliers(id),
  title text not null,
  generated_by uuid references public.users(id),
  report_data jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id),
  report_type text not null,
  filters jsonb not null default '{}'::jsonb,
  data jsonb not null default '{}'::jsonb,
  generated_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  branch_id uuid references public.branches(id),
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id),
  table_name text not null,
  record_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid() and is_active = true and deleted_at is null;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.is_dentist_assigned_to_branch(branch uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_branch_assignments uba
    join public.users u on u.id = uba.user_id
    where uba.user_id = auth.uid()
      and uba.branch_id = branch
      and u.role = 'dentist'
      and u.is_active = true
      and u.deleted_at is null
  );
$$;

create or replace function public.is_patient_owner(patient uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.patients p
    where p.id = patient and p.user_id = auth.uid() and p.deleted_at is null
  );
$$;

create or replace function public.can_access_patient(patient uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or public.is_patient_owner(patient)
    or exists (
      select 1
      from public.patients p
      where p.id = patient
        and public.is_dentist_assigned_to_branch(p.branch_id)
    );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
  requested_name text;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' in ('admin', 'dentist', 'patient')
      then (new.raw_user_meta_data ->> 'role')::public.user_role
    else 'patient'
  end;
  requested_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));

  insert into public.users (id, role, full_name, email)
  values (new.id, requested_role, requested_name, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.audit_row_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs(actor_id, table_name, record_id, action, old_data, new_data)
  values (
    auth.uid(),
    tg_table_name,
    coalesce(new.id, old.id),
    tg_op,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

create or replace function public.prevent_appointment_overlap()
returns trigger
language plpgsql
as $$
begin
  if new.dentist_id is null or new.status not in ('requested', 'approved') or new.deleted_at is not null then
    return new;
  end if;

  if exists (
    select 1
    from public.appointments a
    where a.id <> new.id
      and a.dentist_id = new.dentist_id
      and a.status in ('requested', 'approved')
      and a.deleted_at is null
      and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(new.starts_at, new.ends_at, '[)')
  ) then
    raise exception 'Dentist already has an appointment in this time slot';
  end if;

  return new;
end;
$$;

create or replace function public.apply_inventory_log()
returns trigger
language plpgsql
as $$
begin
  update public.inventory_items
  set quantity = quantity + new.quantity_delta,
      updated_at = now()
  where id = new.item_id;
  return new;
end;
$$;

create or replace function public.generate_restock_data(target_branch uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'item_id', id,
      'name', name,
      'quantity', quantity,
      'reorder_level', reorder_level,
      'reorder_quantity', greatest(reorder_quantity, reorder_level - quantity),
      'supplier_id', supplier_id,
      'expiry_date', expiry_date
    )
    order by name
  ), '[]'::jsonb)
  from public.inventory_items
  where deleted_at is null
    and (target_branch is null or branch_id = target_branch)
    and quantity <= reorder_level;
$$;

do $$ declare table_name text;
begin
  foreach table_name in array array[
    'branches','users','patients','patient_profiles','procedures','appointments',
    'treatments','intraoral_charts','suppliers','inventory_items'
  ] loop
    execute format('drop trigger if exists set_updated_at_%1$s on public.%1$s', table_name);
    execute format('create trigger set_updated_at_%1$s before update on public.%1$s for each row execute function public.set_updated_at()', table_name);
  end loop;
end $$;

drop trigger if exists prevent_appointment_overlap_trigger on public.appointments;
create trigger prevent_appointment_overlap_trigger
before insert or update on public.appointments
for each row execute function public.prevent_appointment_overlap();

drop trigger if exists apply_inventory_log_trigger on public.inventory_logs;
create trigger apply_inventory_log_trigger
after insert on public.inventory_logs
for each row execute function public.apply_inventory_log();

do $$ declare table_name text;
begin
  foreach table_name in array array[
    'branches','users','user_branch_assignments','patients','appointments',
    'treatments','chart_entries','xray_images','inventory_items','inventory_logs',
    'suppliers','restock_reports','reports'
  ] loop
    execute format('drop trigger if exists audit_%1$s on public.%1$s', table_name);
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$s for each row execute function public.audit_row_changes()', table_name);
  end loop;
end $$;

create index if not exists users_role_idx on public.users(role);
create index if not exists users_active_idx on public.users(is_active) where deleted_at is null;
create index if not exists patients_branch_idx on public.patients(branch_id) where deleted_at is null;
create index if not exists patients_user_idx on public.patients(user_id) where deleted_at is null;
create index if not exists appointments_branch_time_idx on public.appointments(branch_id, starts_at) where deleted_at is null;
create index if not exists appointments_patient_idx on public.appointments(patient_id) where deleted_at is null;
create index if not exists treatments_patient_idx on public.treatments(patient_id) where deleted_at is null;
create index if not exists xray_patient_idx on public.xray_images(patient_id) where deleted_at is null;
create index if not exists inventory_branch_idx on public.inventory_items(branch_id) where deleted_at is null;
create index if not exists inventory_low_stock_idx on public.inventory_items(branch_id, quantity, reorder_level) where deleted_at is null;
create index if not exists audit_table_record_idx on public.audit_logs(table_name, record_id);

alter table public.roles enable row level security;
alter table public.branches enable row level security;
alter table public.users enable row level security;
alter table public.user_branch_assignments enable row level security;
alter table public.patients enable row level security;
alter table public.patient_profiles enable row level security;
alter table public.procedures enable row level security;
alter table public.appointments enable row level security;
alter table public.treatments enable row level security;
alter table public.intraoral_charts enable row level security;
alter table public.chart_entries enable row level security;
alter table public.xray_images enable row level security;
alter table public.suppliers enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_logs enable row level security;
alter table public.restock_reports enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "roles read authenticated" on public.roles for select to authenticated using (true);

create policy "branches admin all" on public.branches for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "branches dentist assigned read" on public.branches for select to authenticated using (public.is_dentist_assigned_to_branch(id));
create policy "branches patient own read" on public.branches for select to authenticated using (
  exists (select 1 from public.patients p where p.branch_id = branches.id and p.user_id = auth.uid())
);

create policy "users read self and admin" on public.users for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "users dentist branch read" on public.users for select to authenticated using (
  role = 'patient' and exists (
    select 1 from public.patients p
    where p.user_id = users.id and public.is_dentist_assigned_to_branch(p.branch_id)
  )
);
create policy "users update self limited" on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "users admin all" on public.users for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "assignments admin all" on public.user_branch_assignments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "assignments self read" on public.user_branch_assignments for select to authenticated using (user_id = auth.uid());

create policy "patients admin all" on public.patients for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "patients dentist branch all" on public.patients for all to authenticated using (public.is_dentist_assigned_to_branch(branch_id)) with check (public.is_dentist_assigned_to_branch(branch_id));
create policy "patients owner read update" on public.patients for select to authenticated using (user_id = auth.uid());
create policy "patients owner update" on public.patients for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "patient_profiles access by patient" on public.patient_profiles for all to authenticated
using (public.can_access_patient(patient_id)) with check (public.can_access_patient(patient_id));

create policy "procedures read authenticated" on public.procedures for select to authenticated using (true);
create policy "procedures admin all" on public.procedures for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "appointments admin all" on public.appointments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "appointments dentist branch all" on public.appointments for all to authenticated using (public.is_dentist_assigned_to_branch(branch_id)) with check (public.is_dentist_assigned_to_branch(branch_id));
create policy "appointments patient own" on public.appointments for all to authenticated using (public.can_access_patient(patient_id)) with check (public.can_access_patient(patient_id));

create policy "treatments access by patient" on public.treatments for select to authenticated using (public.can_access_patient(patient_id));
create policy "treatments staff all" on public.treatments for all to authenticated using (public.is_admin() or public.is_dentist_assigned_to_branch(branch_id)) with check (public.is_admin() or public.is_dentist_assigned_to_branch(branch_id));

create policy "charts access by patient" on public.intraoral_charts for select to authenticated using (public.can_access_patient(patient_id));
create policy "charts staff all" on public.intraoral_charts for all to authenticated using (public.is_admin() or public.is_dentist_assigned_to_branch(branch_id)) with check (public.is_admin() or public.is_dentist_assigned_to_branch(branch_id));
create policy "chart entries access by patient" on public.chart_entries for select to authenticated using (public.can_access_patient(patient_id));
create policy "chart entries staff all" on public.chart_entries for all to authenticated using (public.can_access_patient(patient_id) and public.current_user_role() in ('admin','dentist')) with check (public.can_access_patient(patient_id) and public.current_user_role() in ('admin','dentist'));

create policy "xray access by patient" on public.xray_images for select to authenticated using (public.can_access_patient(patient_id));
create policy "xray staff all" on public.xray_images for all to authenticated using (public.is_admin() or public.is_dentist_assigned_to_branch(branch_id)) with check (public.is_admin() or public.is_dentist_assigned_to_branch(branch_id));

create policy "suppliers staff read" on public.suppliers for select to authenticated using (public.current_user_role() in ('admin','dentist'));
create policy "suppliers admin all" on public.suppliers for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "inventory staff read" on public.inventory_items for select to authenticated using (public.is_admin() or public.is_dentist_assigned_to_branch(branch_id));
create policy "inventory admin all" on public.inventory_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "inventory logs staff read" on public.inventory_logs for select to authenticated using (public.is_admin() or public.is_dentist_assigned_to_branch(branch_id));
create policy "inventory logs staff insert" on public.inventory_logs for insert to authenticated with check (public.is_admin() or public.is_dentist_assigned_to_branch(branch_id));

create policy "restock reports staff read" on public.restock_reports for select to authenticated using (public.is_admin() or branch_id is null or public.is_dentist_assigned_to_branch(branch_id));
create policy "restock reports admin all" on public.restock_reports for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "reports staff read" on public.reports for select to authenticated using (public.is_admin() or branch_id is null or public.is_dentist_assigned_to_branch(branch_id));
create policy "reports admin all" on public.reports for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "notifications own read" on public.notifications for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "notifications own update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications staff insert" on public.notifications for insert to authenticated with check (public.current_user_role() in ('admin','dentist'));

create policy "audit admin read" on public.audit_logs for select to authenticated using (public.is_admin());

insert into public.roles (name, description) values
  ('admin', 'Clinic administrator'),
  ('dentist', 'Branch dentist'),
  ('patient', 'Clinic patient')
on conflict (name) do nothing;

insert into public.branches (name, code, address, phone, email, business_hours)
values (
  'Samonte Dental Clinic Main Branch',
  'MAIN',
  'Zarraga, Iloilo, Philippines',
  '+63 000 000 0000',
  'samontedentalclinic@gmail.com',
  '{"monday":"09:00-17:00","tuesday":"09:00-17:00","wednesday":"09:00-17:00","thursday":"09:00-17:00","friday":"09:00-17:00","saturday":"09:00-17:00"}'::jsonb
)
on conflict (code) do nothing;

insert into public.procedures (code, name, description, default_price, color) values
  ('CONSULT', 'Dental Consultation', 'General dental consultation', 500, '#0ea5e9'),
  ('CLEAN', 'Oral Prophylaxis', 'Dental cleaning', 1200, '#22c55e'),
  ('FILL', 'Tooth Restoration', 'Composite filling', 1500, '#f59e0b'),
  ('XRAY', 'Dental X-Ray', 'Clinical radiograph', 800, '#6366f1'),
  ('EXTRACT', 'Tooth Extraction', 'Simple extraction', 2000, '#ef4444')
on conflict (code) do nothing;

insert into public.suppliers (name, contact_name, phone, email)
values ('Default Dental Supplier', 'Clinic Supply Desk', '+63 000 000 0000', 'supplier@example.com')
on conflict do nothing;

insert into public.inventory_items (branch_id, supplier_id, name, sku, category, unit, quantity, reorder_level, reorder_quantity, unit_cost)
select b.id, s.id, 'Composite Resin', 'RESIN-001', 'Restorative', 'pack', 25, 8, 20, 950
from public.branches b cross join public.suppliers s
where b.code = 'MAIN' and s.name = 'Default Dental Supplier'
on conflict do nothing;

insert into public.inventory_items (branch_id, supplier_id, name, sku, category, unit, quantity, reorder_level, reorder_quantity, unit_cost)
select b.id, s.id, 'Dental Anesthetic', 'ANES-001', 'Medication', 'cartridge', 50, 15, 40, 120
from public.branches b cross join public.suppliers s
where b.code = 'MAIN' and s.name = 'Default Dental Supplier'
on conflict do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinical-files',
  'clinical-files',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update set public = false;

drop policy if exists "clinical files authenticated upload" on storage.objects;
create policy "clinical files authenticated upload"
on storage.objects for insert to authenticated
with check (bucket_id = 'clinical-files');

drop policy if exists "clinical files authenticated read" on storage.objects;
create policy "clinical files authenticated read"
on storage.objects for select to authenticated
using (bucket_id = 'clinical-files');

drop policy if exists "clinical files authenticated update" on storage.objects;
create policy "clinical files authenticated update"
on storage.objects for update to authenticated
using (bucket_id = 'clinical-files')
with check (bucket_id = 'clinical-files');

drop policy if exists "clinical files authenticated delete" on storage.objects;
create policy "clinical files authenticated delete"
on storage.objects for delete to authenticated
using (bucket_id = 'clinical-files');

do $$
begin
  begin
    alter publication supabase_realtime add table public.appointments;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.inventory_items;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.treatments;
  exception when duplicate_object then null;
  end;
end $$;

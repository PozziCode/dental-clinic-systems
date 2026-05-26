create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id),
  name text not null,
  slug text not null unique,
  description text,
  category text not null,
  duration_mins integer not null default 30 check (duration_mins > 0),
  base_price numeric(12,2) not null default 0 check (base_price >= 0),
  price_min numeric(12,2) check (price_min is null or price_min >= 0),
  price_max numeric(12,2) check (price_max is null or price_max >= 0),
  image_url text,
  icon text,
  color_tag text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_popular boolean not null default false,
  requires_followup boolean not null default false,
  preparation_notes text,
  recovery_notes text,
  notes text,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint services_price_range_check check (
    price_min is null or price_max is null or price_max >= price_min
  )
);

create table if not exists public.service_branch_settings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  is_available boolean not null default true,
  price_override numeric(12,2) check (price_override is null or price_override >= 0),
  duration_override_mins integer check (duration_override_mins is null or duration_override_mins > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, branch_id)
);

create table if not exists public.service_inventory_items (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  quantity_used numeric(12,2) not null check (quantity_used > 0),
  created_at timestamptz not null default now(),
  unique (service_id, inventory_item_id)
);

alter table public.appointments
  add column if not exists service_id uuid references public.services(id);

alter table public.treatments
  add column if not exists service_id uuid references public.services(id);

create index if not exists services_category_idx on public.services(category);
create index if not exists services_active_idx on public.services(is_active) where archived_at is null;
create index if not exists services_branch_idx on public.services(branch_id) where archived_at is null;
create index if not exists services_popular_name_idx on public.services(is_popular desc, name asc) where is_active = true and archived_at is null;
create index if not exists service_branch_settings_branch_idx on public.service_branch_settings(branch_id, is_available);
create index if not exists service_branch_settings_service_idx on public.service_branch_settings(service_id);
create index if not exists service_inventory_items_service_idx on public.service_inventory_items(service_id);
create index if not exists appointments_service_idx on public.appointments(service_id) where deleted_at is null;
create index if not exists treatments_service_idx on public.treatments(service_id) where deleted_at is null;

drop trigger if exists set_updated_at_services on public.services;
create trigger set_updated_at_services
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_service_branch_settings on public.service_branch_settings;
create trigger set_updated_at_service_branch_settings
before update on public.service_branch_settings
for each row execute function public.set_updated_at();

drop trigger if exists audit_services on public.services;
create trigger audit_services
after insert or update or delete on public.services
for each row execute function public.audit_row_changes();

drop trigger if exists audit_service_branch_settings on public.service_branch_settings;
create trigger audit_service_branch_settings
after insert or update or delete on public.service_branch_settings
for each row execute function public.audit_row_changes();

drop trigger if exists audit_service_inventory_items on public.service_inventory_items;
create trigger audit_service_inventory_items
after insert or update or delete on public.service_inventory_items
for each row execute function public.audit_row_changes();

create or replace function public.deduct_service_inventory_on_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.service_id is null or new.status <> 'completed' or new.deleted_at is not null then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'completed' then
    return new;
  end if;

  insert into public.inventory_logs (
    item_id,
    branch_id,
    patient_id,
    treatment_id,
    used_by,
    action,
    quantity_delta,
    notes
  )
  select
    sii.inventory_item_id,
    new.branch_id,
    new.patient_id,
    new.id,
    new.dentist_id,
    'service_completion',
    -sii.quantity_used,
    'Auto-deducted for completed service'
  from public.service_inventory_items sii
  join public.inventory_items ii on ii.id = sii.inventory_item_id
  where sii.service_id = new.service_id
    and ii.branch_id = new.branch_id
    and ii.deleted_at is null;

  return new;
end;
$$;

drop trigger if exists deduct_service_inventory_on_completion_trigger on public.treatments;
create trigger deduct_service_inventory_on_completion_trigger
after insert or update of status on public.treatments
for each row execute function public.deduct_service_inventory_on_completion();

alter table public.services enable row level security;
alter table public.service_branch_settings enable row level security;
alter table public.service_inventory_items enable row level security;

drop policy if exists "services public active read" on public.services;
create policy "services public active read" on public.services
for select to anon, authenticated
using (is_active = true and archived_at is null);

drop policy if exists "services admin all" on public.services;
create policy "services admin all" on public.services
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "service branches public active read" on public.service_branch_settings;
create policy "service branches public active read" on public.service_branch_settings
for select to anon, authenticated
using (
  is_available = true
  and exists (
    select 1 from public.services s
    where s.id = service_branch_settings.service_id
      and s.is_active = true
      and s.archived_at is null
  )
);

drop policy if exists "service branches admin all" on public.service_branch_settings;
create policy "service branches admin all" on public.service_branch_settings
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "service inventory staff read" on public.service_inventory_items;
create policy "service inventory staff read" on public.service_inventory_items
for select to authenticated
using (public.current_user_role() in ('admin','dentist'));

drop policy if exists "service inventory admin all" on public.service_inventory_items;
create policy "service inventory admin all" on public.service_inventory_items
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'service-assets',
  'service-assets',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/svg+xml']
)
on conflict (id) do update set public = true;

drop policy if exists "service assets public read" on storage.objects;
create policy "service assets public read"
on storage.objects for select to anon, authenticated
using (bucket_id = 'service-assets');

drop policy if exists "service assets admin upload" on storage.objects;
create policy "service assets admin upload"
on storage.objects for insert to authenticated
with check (bucket_id = 'service-assets' and public.is_admin());

drop policy if exists "service assets admin update" on storage.objects;
create policy "service assets admin update"
on storage.objects for update to authenticated
using (bucket_id = 'service-assets' and public.is_admin())
with check (bucket_id = 'service-assets' and public.is_admin());

drop policy if exists "service assets admin delete" on storage.objects;
create policy "service assets admin delete"
on storage.objects for delete to authenticated
using (bucket_id = 'service-assets' and public.is_admin());

insert into public.services (
  name,
  slug,
  description,
  category,
  duration_mins,
  base_price,
  icon,
  is_active,
  is_featured,
  is_popular
) values
  ('Dental Consultation', 'dental-consultation', 'General dental consultation and care planning.', 'General Dentistry', 30, 500, 'stethoscope', true, true, true),
  ('Oral Prophylaxis', 'oral-prophylaxis', 'Professional dental cleaning and plaque removal.', 'Preventive Care', 60, 1200, 'sparkles', true, true, true),
  ('Tooth Restoration', 'tooth-restoration', 'Composite filling and restorative dental care.', 'Restorative', 60, 1500, 'shield-plus', true, false, false),
  ('Dental X-Ray', 'dental-x-ray', 'Clinical radiograph for diagnostic support.', 'Diagnostics', 20, 800, 'scan-line', true, false, false),
  ('Tooth Extraction', 'tooth-extraction', 'Simple tooth extraction procedure.', 'Oral Surgery', 60, 2000, 'badge-plus', true, false, false)
on conflict (slug) do nothing;

insert into public.service_branch_settings (service_id, branch_id, is_available)
select s.id, b.id, true
from public.services s
cross join public.branches b
where s.archived_at is null
on conflict (service_id, branch_id) do nothing;

do $$
begin
  begin
    alter publication supabase_realtime add table public.services;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.service_branch_settings;
  exception when duplicate_object then null;
  end;
end $$;

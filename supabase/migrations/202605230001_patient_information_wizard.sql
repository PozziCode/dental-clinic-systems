alter table public.patients
  add column if not exists profile_photo_url text;

alter table public.patient_profiles
  add column if not exists address_line text,
  add column if not exists city text,
  add column if not exists province text,
  add column if not exists postal_code text,
  add column if not exists medications text[] not null default '{}',
  add column if not exists medical_conditions text[] not null default '{}',
  add column if not exists previous_dentist text,
  add column if not exists last_dental_visit date,
  add column if not exists dental_anxiety_score integer check (
    dental_anxiety_score is null
    or dental_anxiety_score between 1 and 5
  ),
  add column if not exists insurance_policy_number text,
  add column if not exists insurance_group_number text,
  add column if not exists insurance_holder_name text,
  add column if not exists consent_treatment boolean not null default false,
  add column if not exists consent_privacy boolean not null default false,
  add column if not exists consent_billing boolean not null default false,
  add column if not exists consent_marketing boolean not null default false,
  -- Retained for admin intake and future compliance workflows; patient self-registration does not collect signatures.
  add column if not exists signature_url text,
  add column if not exists signature_name text;

create index if not exists patient_profiles_conditions_idx
on public.patient_profiles using gin (medical_conditions);

create index if not exists patient_profiles_medications_idx
on public.patient_profiles using gin (medications);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-assets',
  'patient-assets',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set public = false;

drop policy if exists "patient assets authenticated upload" on storage.objects;
create policy "patient assets authenticated upload"
on storage.objects for insert to authenticated
with check (bucket_id = 'patient-assets');

drop policy if exists "patient assets authenticated read" on storage.objects;
create policy "patient assets authenticated read"
on storage.objects for select to authenticated
using (bucket_id = 'patient-assets');

drop policy if exists "patient assets authenticated update" on storage.objects;
create policy "patient assets authenticated update"
on storage.objects for update to authenticated
using (bucket_id = 'patient-assets')
with check (bucket_id = 'patient-assets');

drop policy if exists "patient assets authenticated delete" on storage.objects;
create policy "patient assets authenticated delete"
on storage.objects for delete to authenticated
using (bucket_id = 'patient-assets');

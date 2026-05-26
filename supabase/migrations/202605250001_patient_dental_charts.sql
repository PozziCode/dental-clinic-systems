-- Create patient_tooth_charts table for storing overall chart metadata
create table if not exists public.patient_tooth_charts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  dentist_id uuid not null references public.users(id) on delete set null,
  branch_id uuid not null references public.branches(id) on delete cascade,
  chart_date date not null,
  clinical_notes text,
  treatment_plan text,
  chart_status text not null default 'draft' check (chart_status in ('draft', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create tooth_conditions table for tracking individual tooth conditions
create table if not exists public.tooth_conditions (
  id uuid primary key default gen_random_uuid(),
  chart_id uuid not null references public.patient_tooth_charts(id) on delete cascade,
  tooth_number text not null,
  condition_type text not null check (condition_type in (
    'cavity',
    'filling',
    'crown',
    'root_canal',
    'extraction',
    'implant',
    'bridge',
    'fracture',
    'impacted',
    'missing',
    'healthy',
    'other'
  )),
  treatment_status text not null default 'planned' check (treatment_status in ('planned', 'in_progress', 'completed')),
  priority text check (priority in ('low', 'medium', 'high')),
  estimated_cost numeric(10, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chart_id, tooth_number, condition_type)
);

-- Create tooth_surfaces table for surface-level charting
create table if not exists public.tooth_surfaces (
  id uuid primary key default gen_random_uuid(),
  condition_id uuid not null references public.tooth_conditions(id) on delete cascade,
  surface text not null check (surface in ('mesial', 'distal', 'occlusal', 'lingual', 'buccal')),
  condition_code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (condition_id, surface)
);

-- Create indexes for performance
create index if not exists patient_tooth_charts_patient_id_idx
on public.patient_tooth_charts(patient_id);

create index if not exists patient_tooth_charts_dentist_id_idx
on public.patient_tooth_charts(dentist_id);

create index if not exists patient_tooth_charts_branch_id_idx
on public.patient_tooth_charts(branch_id);

create index if not exists patient_tooth_charts_date_idx
on public.patient_tooth_charts(chart_date desc);

create index if not exists tooth_conditions_chart_id_idx
on public.tooth_conditions(chart_id);

create index if not exists tooth_conditions_tooth_number_idx
on public.tooth_conditions(tooth_number);

create index if not exists tooth_conditions_treatment_status_idx
on public.tooth_conditions(treatment_status);

create index if not exists tooth_surfaces_condition_id_idx
on public.tooth_surfaces(condition_id);

-- Add triggers for updated_at
drop trigger if exists set_updated_at_patient_tooth_charts on public.patient_tooth_charts;
create trigger set_updated_at_patient_tooth_charts
before update on public.patient_tooth_charts
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_tooth_conditions on public.tooth_conditions;
create trigger set_updated_at_tooth_conditions
before update on public.tooth_conditions
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_tooth_surfaces on public.tooth_surfaces;
create trigger set_updated_at_tooth_surfaces
before update on public.tooth_surfaces
for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.patient_tooth_charts enable row level security;
alter table public.tooth_conditions enable row level security;
alter table public.tooth_surfaces enable row level security;

-- RLS Policies for patient_tooth_charts
drop policy if exists "patient_tooth_charts dentist edit own" on public.patient_tooth_charts;
create policy "patient_tooth_charts dentist edit own" on public.patient_tooth_charts
for all to authenticated
using (
  public.is_dentist() and dentist_id = auth.uid()
)
with check (
  public.is_dentist() and dentist_id = auth.uid()
);

drop policy if exists "patient_tooth_charts patient read own" on public.patient_tooth_charts;
create policy "patient_tooth_charts patient read own" on public.patient_tooth_charts
for select to authenticated
using (
  public.is_patient_owner(patient_id)
);

drop policy if exists "patient_tooth_charts admin all" on public.patient_tooth_charts;
create policy "patient_tooth_charts admin all" on public.patient_tooth_charts
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS Policies for tooth_conditions
drop policy if exists "tooth_conditions dentist edit" on public.tooth_conditions;
create policy "tooth_conditions dentist edit" on public.tooth_conditions
for all to authenticated
using (
  exists (
    select 1 from public.patient_tooth_charts ptc
    where ptc.id = tooth_conditions.chart_id
      and ptc.dentist_id = auth.uid()
      and public.is_dentist()
  )
)
with check (
  exists (
    select 1 from public.patient_tooth_charts ptc
    where ptc.id = tooth_conditions.chart_id
      and ptc.dentist_id = auth.uid()
      and public.is_dentist()
  )
);

drop policy if exists "tooth_conditions patient read" on public.tooth_conditions;
create policy "tooth_conditions patient read" on public.tooth_conditions
for select to authenticated
using (
  exists (
    select 1 from public.patient_tooth_charts ptc
    where ptc.id = tooth_conditions.chart_id
      and public.is_patient_owner(ptc.patient_id)
  )
);

drop policy if exists "tooth_conditions admin all" on public.tooth_conditions;
create policy "tooth_conditions admin all" on public.tooth_conditions
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS Policies for tooth_surfaces
drop policy if exists "tooth_surfaces dentist edit" on public.tooth_surfaces;
create policy "tooth_surfaces dentist edit" on public.tooth_surfaces
for all to authenticated
using (
  exists (
    select 1 from public.tooth_conditions tc
    join public.patient_tooth_charts ptc on tc.chart_id = ptc.id
    where tc.id = tooth_surfaces.condition_id
      and ptc.dentist_id = auth.uid()
      and public.is_dentist()
  )
)
with check (
  exists (
    select 1 from public.tooth_conditions tc
    join public.patient_tooth_charts ptc on tc.chart_id = ptc.id
    where tc.id = tooth_surfaces.condition_id
      and ptc.dentist_id = auth.uid()
      and public.is_dentist()
  )
);

drop policy if exists "tooth_surfaces patient read" on public.tooth_surfaces;
create policy "tooth_surfaces patient read" on public.tooth_surfaces
for select to authenticated
using (
  exists (
    select 1 from public.tooth_conditions tc
    join public.patient_tooth_charts ptc on tc.chart_id = ptc.id
    where tc.id = tooth_surfaces.condition_id
      and public.is_patient_owner(ptc.patient_id)
  )
);

drop policy if exists "tooth_surfaces admin all" on public.tooth_surfaces;
create policy "tooth_surfaces admin all" on public.tooth_surfaces
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

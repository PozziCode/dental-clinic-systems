alter table public.appointments
  add column if not exists booking_reference text,
  add column if not exists payment_method text,
  add column if not exists appointment_notes text,
  add column if not exists reminder_consent boolean not null default false,
  add column if not exists privacy_consent boolean not null default false;

do $$
begin
  alter table public.appointments
    add constraint appointments_booking_reference_unique unique (booking_reference);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.appointments
    add constraint appointments_payment_method_check
    check (payment_method is null or payment_method in ('cash', 'gcash'));
exception when duplicate_object then null;
end $$;

create table if not exists public.dentist_availability (
  id uuid primary key default gen_random_uuid(),
  dentist_id uuid not null references public.users(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_interval_mins integer not null default 30 check (slot_interval_mins > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dentist_availability_time_check check (end_time > start_time),
  unique (dentist_id, branch_id, weekday, start_time, end_time)
);

create table if not exists public.dentist_schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  dentist_id uuid not null references public.users(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dentist_schedule_blocks_time_check check (ends_at > starts_at)
);

create index if not exists appointments_booking_reference_idx
on public.appointments(booking_reference)
where booking_reference is not null;

create index if not exists dentist_availability_lookup_idx
on public.dentist_availability(dentist_id, branch_id, weekday)
where is_active = true;

create index if not exists dentist_schedule_blocks_lookup_idx
on public.dentist_schedule_blocks(dentist_id, branch_id, starts_at, ends_at);

drop trigger if exists set_updated_at_dentist_availability on public.dentist_availability;
create trigger set_updated_at_dentist_availability
before update on public.dentist_availability
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_dentist_schedule_blocks on public.dentist_schedule_blocks;
create trigger set_updated_at_dentist_schedule_blocks
before update on public.dentist_schedule_blocks
for each row execute function public.set_updated_at();

alter table public.dentist_availability enable row level security;
alter table public.dentist_schedule_blocks enable row level security;

drop policy if exists "appointments patient own" on public.appointments;
create policy "appointments patient own" on public.appointments
for all to authenticated
using (public.is_patient_owner(patient_id))
with check (public.is_patient_owner(patient_id));

drop policy if exists "dentist availability admin all" on public.dentist_availability;
create policy "dentist availability admin all" on public.dentist_availability
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "dentist availability branch read" on public.dentist_availability;
create policy "dentist availability branch read" on public.dentist_availability
for select to authenticated
using (
  public.is_dentist_assigned_to_branch(branch_id)
  or exists (
    select 1
    from public.patients p
    where p.branch_id = dentist_availability.branch_id
      and p.user_id = auth.uid()
      and p.deleted_at is null
  )
);

drop policy if exists "dentist schedule blocks admin all" on public.dentist_schedule_blocks;
create policy "dentist schedule blocks admin all" on public.dentist_schedule_blocks
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "dentist schedule blocks branch read" on public.dentist_schedule_blocks;
create policy "dentist schedule blocks branch read" on public.dentist_schedule_blocks
for select to authenticated
using (
  public.is_dentist_assigned_to_branch(branch_id)
  or exists (
    select 1
    from public.patients p
    where p.branch_id = dentist_schedule_blocks.branch_id
      and p.user_id = auth.uid()
      and p.deleted_at is null
  )
);

insert into public.dentist_availability (
  dentist_id,
  branch_id,
  weekday,
  start_time,
  end_time,
  slot_interval_mins
)
select
  uba.user_id,
  uba.branch_id,
  weekdays.weekday,
  time '09:00',
  time '17:00',
  30
from public.user_branch_assignments uba
join public.users u on u.id = uba.user_id
cross join (values (1), (2), (3), (4), (5), (6)) as weekdays(weekday)
where u.role = 'dentist'
  and u.is_active = true
  and u.deleted_at is null
on conflict (dentist_id, branch_id, weekday, start_time, end_time) do nothing;

do $$
begin
  begin
    alter publication supabase_realtime add table public.dentist_availability;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.dentist_schedule_blocks;
  exception when duplicate_object then null;
  end;
end $$;

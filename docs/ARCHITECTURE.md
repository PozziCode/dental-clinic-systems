# Dental Clinic Management System Architecture

## App structure

- `src/app`: routes, protected layouts, public pages.
- `src/features`: server actions and feature workflows.
- `src/components/shared`: reusable dashboard, form, chart, realtime, and export widgets.
- `src/lib/auth`: session and role guards.
- `src/lib/database`: Supabase query helpers.
- `src/lib/validators`: Zod schemas.
- `supabase/migrations`: schema, RLS, triggers, storage, and seed data.

## Core flows

Authentication uses Supabase Auth.

Patient registration creates:

- Supabase Auth user.
- `public.users` profile through trigger.
- linked `public.patients` record.

Admin dentist invite uses:

- Supabase Admin API.
- `public.users` role.
- `public.user_branch_assignments`.

Protected route layouts enforce role access:

- `/admin/*`
- `/dentist/*`
- `/patient/*`

## Data rules

All core modules persist in Supabase:

- users
- branches
- patients
- appointments
- treatments
- procedures
- charts
- x-rays
- inventory
- reports
- audit logs

Realtime is enabled for:

- appointments
- inventory items
- notifications
- treatments

## Exports

CSV export uses Papaparse.

PDF export uses jsPDF.

Print reports use browser print layout.

# Dental Clinic Management System Setup

## Environment variables

Create `.env.local`.

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` is required for patient and dentist account creation.

## Supabase setup

1. Create or open your Supabase project.
2. Run the SQL migrations in `supabase/migrations` in filename order.
   - `202605220001_dental_clinic_platform.sql`
   - `202605220002_dynamic_service_catalog.sql`
   - `202605230001_patient_information_wizard.sql`
3. Confirm the private Storage buckets exist:
   - `clinical-files`
   - `patient-assets`
4. Email confirmation can stay disabled for local testing because the app creates confirmed accounts with Supabase Admin.
5. Set Auth redirect URLs:
   - `http://localhost:3000/login`
   - `http://localhost:3000/reset-password`
   - your production domain URLs

## Patient registration migration check

The patient registration wizard needs the `202605230001_patient_information_wizard.sql` migration applied before submissions can store the full profile.

After applying it in Supabase SQL Editor, confirm:

- `patient_profiles` includes `address_line`, `city`, `province`, `postal_code`, `medications`, `medical_conditions`, `previous_dentist`, `last_dental_visit`, `dental_anxiety_score`, `consent_treatment`, `consent_privacy`, `consent_billing`, and `consent_marketing`.
- Storage includes a private `patient-assets` bucket.
- `.env.local` includes `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

Restart the local dev server after the migration, then submit `/register` and verify rows are created in `auth.users`, `public.users`, `public.patients`, and `public.patient_profiles`.

Patient self-registration does not collect signatures or insurance details. Admin intake still supports profile photos and signatures through the private `patient-assets` bucket, so keep that bucket and the signature columns in place.

## Bootstrap admin

Create the first admin in Supabase Auth.

Then run this SQL with the auth user ID:

```sql
update public.users
set role = 'admin', full_name = 'Clinic Administrator', is_active = true
where id = 'AUTH_USER_ID';
```

## Dentist login

Admins create dentist accounts from `/admin/users` with an email, branch, and temporary password.
Dentists log in at `/login` using that email and password, then land on `/dentist/dashboard`.

## Local development

```bash
npm install
npm run dev
```

The dev script uses Webpack because Turbopack panicked in this Windows repo.

## Production checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Deployment

1. Push the project to your Git provider.
2. Import the project into Vercel.
3. Add all environment variables.
4. Deploy.
5. Run the Supabase migration before staff use the app.
6. Create the bootstrap admin.

## Security model

RLS protects all sensitive tables.

Access rules:

- Admins access all branches and reports.
- Dentists access assigned branch records.
- Patients access only their own records.
- Clinical files stay private.
- X-rays and images use signed URLs.
- Server actions check roles before writes.

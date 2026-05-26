import { getBranches } from "@/lib/database/queries";

export default async function SettingsPage() {
  const branches = await getBranches();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Clinic profile, hours, branches, and security defaults.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Clinic profile</h2>
          <p className="mt-2 text-sm text-slate-500">Dental Clinic Management System</p>
          <p className="text-sm text-slate-500">Private clinical files. Signed URLs. RLS enabled.</p>
        </section>
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Branches</h2>
          <p className="mt-2 text-3xl font-bold text-slate-900">{branches.length}</p>
        </section>
      </div>
    </div>
  );
}

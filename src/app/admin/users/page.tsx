import { ActionForm } from "@/components/shared/ActionForm";
import {
  archiveUserAction,
  createDentistAction,
  updateUserAction,
} from "@/features/auth/actions";
import { getBranches, getUsers } from "@/lib/database/queries";

export default async function UsersPage() {
  const [users, branches] = await Promise.all([getUsers(), getBranches()]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">Manage Supabase Auth users and roles.</p>
        </div>
        <div className="divide-y">
          {users.map((user) => (
            <div key={user.id} className="p-4">
              <ActionForm
                action={updateUserAction}
                submitLabel="Save"
                pendingLabel="Saving..."
                className="grid gap-3 lg:grid-cols-[1.2fr_1.4fr_160px_120px_auto]"
              >
                <input type="hidden" name="id" value={user.id} />
                <input
                  name="full_name"
                  defaultValue={user.full_name}
                  aria-label="Full name"
                  className="rounded-xl border px-4 py-3 text-sm"
                />
                <input
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  aria-label="Email"
                  className="rounded-xl border px-4 py-3 text-sm"
                />
                <select
                  name="role"
                  defaultValue={user.role}
                  aria-label="Role"
                  className="rounded-xl border px-4 py-3 text-sm capitalize"
                >
                  <option value="admin">Admin</option>
                  <option value="dentist">Dentist</option>
                  <option value="patient">Patient</option>
                </select>
                <label className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm text-slate-700">
                  <input
                    name="is_active"
                    type="checkbox"
                    defaultChecked={user.is_active}
                    className="h-4 w-4"
                  />
                  Active
                </label>
              </ActionForm>
              <form action={archiveUserAction} className="mt-3">
                <input type="hidden" name="id" value={user.id} />
                <button className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50">
                  Delete user
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>
      <aside className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Add dentist</h2>
        <ActionForm action={createDentistAction} submitLabel="Create dentist" className="mt-4 space-y-3">
          <input name="full_name" placeholder="Dentist name" className="w-full rounded-xl border px-4 py-3" />
          <input name="email" type="email" placeholder="Email" className="w-full rounded-xl border px-4 py-3" />
          <input name="password" type="password" placeholder="Temporary password" className="w-full rounded-xl border px-4 py-3" />
          <select name="branch_id" className="w-full rounded-xl border px-4 py-3">
            <option value="">Branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        </ActionForm>
      </aside>
    </div>
  );
}

import { ActionForm } from "@/components/shared/ActionForm";
import { archiveBranchAction, saveBranchAction } from "@/features/admin/actions";
import { getBranches } from "@/lib/database/queries";

export default async function BranchesPage() {
  const branches = await getBranches();

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h1 className="text-2xl font-bold text-slate-900">Branches</h1>
          <p className="text-sm text-slate-500">Manage clinic locations and branch access.</p>
        </div>
        <div className="divide-y">
          {branches.map((branch) => (
            <div key={branch.id} className="flex items-center justify-between p-5">
              <div>
                <p className="font-semibold text-slate-900">{branch.name}</p>
                <p className="text-sm text-slate-500">{branch.address}</p>
              </div>
              <form action={archiveBranchAction}>
                <input type="hidden" name="id" value={branch.id} />
                <button className="rounded-lg border px-3 py-2 text-sm text-red-600">Archive</button>
              </form>
            </div>
          ))}
        </div>
      </section>
      <aside className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Create branch</h2>
        <ActionForm action={saveBranchAction} submitLabel="Save branch" className="mt-4 space-y-3">
          <input name="name" placeholder="Branch name" className="w-full rounded-xl border px-4 py-3" />
          <input name="code" placeholder="Code" className="w-full rounded-xl border px-4 py-3" />
          <input name="address" placeholder="Address" className="w-full rounded-xl border px-4 py-3" />
          <input name="phone" placeholder="Phone" className="w-full rounded-xl border px-4 py-3" />
          <input name="email" type="email" placeholder="Email" className="w-full rounded-xl border px-4 py-3" />
        </ActionForm>
      </aside>
    </div>
  );
}

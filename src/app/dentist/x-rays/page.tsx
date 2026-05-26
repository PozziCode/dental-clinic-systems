import { ActionForm } from "@/components/shared/ActionForm";
import { deleteClinicalFileAction, uploadClinicalFileAction } from "@/features/uploads/actions";
import { getPatients, getXrayImages } from "@/lib/database/queries";

export default async function DentistXraysPage() {
  const [patients, files] = await Promise.all([getPatients(), getXrayImages()]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h1 className="text-2xl font-bold text-slate-900">X-rays and Images</h1>
          <p className="text-sm text-slate-500">Private Supabase Storage files with signed access.</p>
        </div>
        <div className="divide-y">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-5">
              <div>
                <p className="font-semibold">{file.file_name}</p>
                <p className="text-sm text-slate-500">{file.kind} · {file.content_type}</p>
              </div>
              <form action={deleteClinicalFileAction}>
                <input type="hidden" name="id" value={file.id} />
                <input type="hidden" name="path" value={file.path} />
                <button className="rounded-lg border px-3 py-2 text-sm text-red-600">Delete</button>
              </form>
            </div>
          ))}
        </div>
      </section>
      <aside className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Upload file</h2>
        <ActionForm action={uploadClinicalFileAction} submitLabel="Upload" pendingLabel="Uploading..." className="mt-4 space-y-3">
          <select name="patient_id" className="w-full rounded-xl border px-4 py-3">
            <option value="">Patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.first_name} {patient.last_name}</option>
            ))}
          </select>
          <select name="branch_id" className="w-full rounded-xl border px-4 py-3">
            <option value="">Branch</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.branch_id}>{patient.first_name} {patient.last_name} branch</option>
            ))}
          </select>
          <select name="kind" className="w-full rounded-xl border px-4 py-3">
            <option value="xray">X-ray</option>
            <option value="intraoral_photo">Intraoral photo</option>
            <option value="treatment_photo">Treatment photo</option>
            <option value="record">Record</option>
          </select>
          <input name="file" type="file" accept="image/*,application/pdf" className="w-full rounded-xl border px-4 py-3" />
          <textarea name="notes" placeholder="Notes" className="w-full rounded-xl border px-4 py-3" />
        </ActionForm>
      </aside>
    </div>
  );
}

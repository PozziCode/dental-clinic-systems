import { ActionForm } from "@/components/shared/ActionForm";
import { saveTreatmentAction } from "@/features/admin/actions";
import { getPatients, getProcedures, getServicesForBranch, getTreatments, getUsers } from "@/lib/database/queries";

export default async function DentistTreatmentsPage() {
  const [treatments, patients, dentists, procedures, services] = await Promise.all([
    getTreatments(),
    getPatients(),
    getUsers("dentist"),
    getProcedures(),
    getServicesForBranch(),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h1 className="text-2xl font-bold text-slate-900">Treatments</h1>
          <p className="text-sm text-slate-500">Record clinical work and patient treatment notes.</p>
        </div>
        <div className="divide-y">
          {treatments.map((treatment) => (
            <div key={treatment.id} className="p-5">
              <p className="font-semibold">Tooth {treatment.tooth ?? "N/A"}</p>
              <p className="text-sm text-slate-500">{treatment.notes ?? treatment.diagnosis ?? "No notes"}</p>
              <p className="text-sm font-medium text-slate-700">PHP {treatment.fee}</p>
            </div>
          ))}
        </div>
      </section>

      <aside className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">New treatment</h2>
        <ActionForm action={saveTreatmentAction} submitLabel="Save treatment" className="mt-4 space-y-3">
          <select name="patient_id" className="w-full rounded-xl border px-4 py-3">
            <option value="">Patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.first_name} {patient.last_name}</option>
            ))}
          </select>
          <select name="dentist_id" className="w-full rounded-xl border px-4 py-3">
            <option value="">Dentist</option>
            {dentists.map((dentist) => (
              <option key={dentist.id} value={dentist.id}>{dentist.full_name}</option>
            ))}
          </select>
          <select name="branch_id" className="w-full rounded-xl border px-4 py-3">
            <option value="">Use patient branch</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.branch_id}>{patient.first_name} {patient.last_name} branch</option>
            ))}
          </select>
          <select name="procedure_id" className="w-full rounded-xl border px-4 py-3">
            <option value="">Procedure</option>
            {procedures.map((procedure) => (
              <option key={procedure.id} value={procedure.id}>{procedure.name}</option>
            ))}
          </select>
          <select name="service_id" className="w-full rounded-xl border px-4 py-3">
            <option value="">Treatment service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>{service.name} · PHP {Number(service.base_price).toLocaleString()}</option>
            ))}
          </select>
          <input name="tooth" placeholder="Tooth number" className="w-full rounded-xl border px-4 py-3" />
          <input name="surfaces" placeholder="Surfaces, comma separated" className="w-full rounded-xl border px-4 py-3" />
          <textarea name="diagnosis" placeholder="Diagnosis" className="w-full rounded-xl border px-4 py-3" />
          <textarea name="notes" placeholder="Treatment notes" className="w-full rounded-xl border px-4 py-3" />
          <input name="fee" type="number" step="0.01" placeholder="Fee" className="w-full rounded-xl border px-4 py-3" />
        </ActionForm>
      </aside>
    </div>
  );
}

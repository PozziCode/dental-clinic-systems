import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import { archivePatientAction } from "@/features/admin/actions";
import { PatientIntakeWizard } from "@/features/patients/PatientIntakeWizard";
import { getBranches, getPatients, getUsers } from "@/lib/database/queries";

export default async function AdminPatientsPage() {
  const [patients, branches, dentists] = await Promise.all([
    getPatients(),
    getBranches(),
    getUsers("dentist"),
  ]);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-500">Search, review, archive, and register electronic patient records.</p>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-4">Patient</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="border-t">
                  <td className="p-4 font-medium text-slate-900">
                    {patient.first_name} {patient.last_name}
                    <p className="text-xs text-slate-500">{patient.patient_number}</p>
                  </td>
                  <td className="p-4 text-slate-600">{patient.email ?? patient.phone ?? "No contact"}</td>
                  <td className="p-4">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      Active
                    </span>
                  </td>
                  <td className="flex gap-2 p-4">
                    <Link className="rounded-lg border px-3 py-2" href={`/admin/patients/${patient.id}`}>
                      View
                    </Link>
                    <form action={archivePatientAction}>
                      <input type="hidden" name="id" value={patient.id} />
                      <button className="rounded-lg border px-3 py-2 text-red-600">Archive</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {patients.length === 0 ? (
            <div className="p-4">
              <EmptyState title="No patients yet" description="Create the first patient record." />
            </div>
          ) : null}
        </div>
      </section>

      <PatientIntakeWizard branches={branches} dentists={dentists} />
    </div>
  );
}

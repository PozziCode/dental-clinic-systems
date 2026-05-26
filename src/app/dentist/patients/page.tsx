import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import { getPatients } from "@/lib/database/queries";

export default async function DentistPatientsPage() {
  const patients = await getPatients();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
        <p className="text-sm text-slate-500">Patients allowed by your branch access.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-4">Patient</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id} className="border-t">
                <td className="p-4 font-medium">{patient.first_name} {patient.last_name}</td>
                <td className="p-4">{patient.email ?? patient.phone ?? "No contact"}</td>
                <td className="p-4">
                  <Link className="rounded-lg border px-3 py-2" href={`/admin/patients/${patient.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {patients.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No patients assigned" description="Branch RLS returned no records." />
          </div>
        ) : null}
      </div>
    </div>
  );
}

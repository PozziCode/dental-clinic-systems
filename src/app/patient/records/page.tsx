import { ReportExportButtons } from "@/components/shared/ReportExportButtons";
import { requireRole } from "@/lib/auth/guards";
import { getCurrentPatientProfile, getTreatments } from "@/lib/database/queries";

export default async function PatientRecordsPage() {
  const user = await requireRole("patient");
  const patient = await getCurrentPatientProfile(user.profile.id);
  const treatments = patient ? await getTreatments(patient.id) : [];
  const rows = treatments.map((treatment) => ({
    date: treatment.treated_at,
    tooth: treatment.tooth,
    diagnosis: treatment.diagnosis,
    notes: treatment.notes,
    fee: treatment.fee,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My records</h1>
          <p className="text-sm text-slate-500">Download your clinical summary.</p>
        </div>
        <ReportExportButtons fileName="patient-records" rows={rows} />
      </div>
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Patient</h2>
        <p className="mt-2 text-sm text-slate-600">
          {patient ? `${patient.first_name} ${patient.last_name}` : "No patient profile"}
        </p>
      </section>
    </div>
  );
}

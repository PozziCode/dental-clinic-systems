import { requireRole } from "@/lib/auth/guards";
import { getCurrentPatientProfile, getTreatments } from "@/lib/database/queries";

export default async function PatientTreatmentsPage() {
  const user = await requireRole("patient");
  const patient = await getCurrentPatientProfile(user.profile.id);
  const treatments = patient ? await getTreatments(patient.id) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My treatments</h1>
        <p className="text-sm text-slate-500">Treatment history from your dental team.</p>
      </div>
      <div className="divide-y rounded-2xl border bg-white shadow-sm">
        {treatments.map((treatment) => (
          <div key={treatment.id} className="p-5">
            <p className="font-semibold">Tooth {treatment.tooth ?? "N/A"}</p>
            <p className="text-sm text-slate-500">{new Date(treatment.treated_at).toLocaleString()}</p>
            <p className="mt-2 text-sm text-slate-700">{treatment.notes ?? treatment.diagnosis ?? "No notes"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

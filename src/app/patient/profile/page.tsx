import Link from "next/link";
import { PatientProfileForm } from "@/features/patients/PatientProfileForm";
import { requireRole } from "@/lib/auth/guards";
import { getCurrentPatientWithProfile } from "@/lib/database/queries";

export default async function PatientProfilePage() {
  const user = await requireRole("patient");
  const patient = await getCurrentPatientWithProfile(user.profile.id);

  if (!patient) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <h1 className="text-xl font-semibold">Patient record not connected</h1>
        <p className="mt-2 text-sm">
          Your account exists, but it is not connected to a clinic patient record yet. Ask the clinic staff to connect
          your account before editing your profile or booking appointments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Complete and update your patient details for appointments and clinic records.
          </p>
        </div>
        <Link
          href="/patient/appointments"
          className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
        >
          Back to appointments
        </Link>
      </div>

      <PatientProfileForm patient={patient} />
    </div>
  );
}

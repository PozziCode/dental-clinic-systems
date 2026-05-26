import { CalendarDays, FileImage, Stethoscope, User } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { requireRole } from "@/lib/auth/guards";
import {
  getAppointments,
  getCurrentPatientProfile,
  getTreatments,
  getXrayImages,
} from "@/lib/database/queries";

export default async function PatientDashboardPage() {
  const user = await requireRole("patient");
  const patient = await getCurrentPatientProfile(user.profile.id);
  const [appointments, treatments, files] = await Promise.all([
    getAppointments(),
    patient ? getTreatments(patient.id) : Promise.resolve([]),
    patient ? getXrayImages(patient.id) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome, {user.profile.full_name}
        </h1>
        <p className="mt-2 text-slate-600">
          View appointments, treatments, x-rays, and your chart.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Profile" value={patient ? patient.patient_number : "Pending"} icon={User} />
        <StatCard label="Appointments" value={appointments.length} icon={CalendarDays} tone="emerald" />
        <StatCard label="Treatments" value={treatments.length} icon={Stethoscope} tone="amber" />
        <StatCard label="Files" value={files.length} icon={FileImage} tone="rose" />
      </div>
    </div>
  );
}

import { CalendarDays, FileImage, Users } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { RealtimeStatus } from "@/components/shared/RealtimeStatus";
import { getAppointments, getPatients, getXrayImages } from "@/lib/database/queries";

export default async function DentistDashboardPage() {
  const [appointments, patients, files] = await Promise.all([
    getAppointments(),
    getPatients(),
    getXrayImages(),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dentist Dashboard</h1>
          <p className="text-sm text-slate-500">Branch-limited clinical workspace.</p>
        </div>
        <RealtimeStatus table="appointments" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Today" value={appointments.filter((item) => item.starts_at.startsWith(today)).length} icon={CalendarDays} />
        <StatCard label="Patients" value={patients.length} icon={Users} tone="emerald" />
        <StatCard label="Clinical files" value={files.length} icon={FileImage} tone="rose" />
      </div>
    </div>
  );
}

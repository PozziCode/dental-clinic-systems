import { CalendarDays, ClipboardList, DollarSign, Stethoscope, Users } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { RealtimeStatus } from "@/components/shared/RealtimeStatus";
import { DashboardCharts } from "@/components/shared/DashboardCharts";
import { getAdminReportData } from "@/features/reports/actions";

export default async function AdminDashboardPage() {
  const data = await getAdminReportData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Clinic-wide metrics from Supabase.</p>
        </div>
        <RealtimeStatus table="appointments" />
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Patients" value={data.patientCount} icon={Users} />
        <StatCard label="Appointments" value={data.appointmentCount} icon={CalendarDays} tone="emerald" />
        <StatCard label="Services" value={data.serviceCount} icon={Stethoscope} tone="sky" />
        <StatCard label="Treatments" value={data.treatmentCount} icon={ClipboardList} tone="amber" />
        <StatCard label="Revenue" value={`PHP ${data.revenue.toLocaleString()}`} icon={DollarSign} tone="rose" />
      </div>

      <DashboardCharts
        data={[
          { name: "Patients", value: data.patientCount },
          { name: "Appointments", value: data.appointmentCount },
          { name: "Services", value: data.serviceCount },
          { name: "Treatments", value: data.treatmentCount },
          { name: "Revenue", value: data.revenue },
        ]}
      />
    </div>
  );
}

import { ReportExportButtons } from "@/components/shared/ReportExportButtons";
import { DashboardCharts } from "@/components/shared/DashboardCharts";
import { getAdminReportData } from "@/features/reports/actions";

export default async function ReportsPage() {
  const data = await getAdminReportData();
  const rows = [
    { metric: "Patients", value: data.patientCount },
    { metric: "Appointments", value: data.appointmentCount },
    { metric: "Treatments", value: data.treatmentCount },
    { metric: "Revenue", value: data.revenue },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500">Export live database reports.</p>
        </div>
        <ReportExportButtons fileName="clinic-report" rows={rows} />
      </div>

      <DashboardCharts
        data={rows.map((row) => ({ name: row.metric, value: Number(row.value) }))}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportPanel title="Most booked treatments" rows={data.mostBookedServices.map((item) => ({
          label: item.name,
          value: `${item.booked} bookings`,
        }))} />
        <ReportPanel title="Highest revenue treatments" rows={data.highestRevenueServices.map((item) => ({
          label: item.name,
          value: `PHP ${item.revenue.toLocaleString()}`,
        }))} />
        <ReportPanel title="Branch treatment performance" rows={data.branchTreatmentPerformance.map((item) => ({
          label: item.name,
          value: `${item.completed} completed · PHP ${item.revenue.toLocaleString()}`,
        }))} />
        <ReportPanel title="Dentist treatment statistics" rows={data.dentistTreatmentStatistics.map((item) => ({
          label: item.name,
          value: `${item.completed} completed · PHP ${item.revenue.toLocaleString()}`,
        }))} />
      </div>
      <div className="hidden print:block">
        <p>Prepared by: __________________________</p>
        <p className="mt-6">Approved by: __________________________</p>
      </div>
    </div>
  );
}

function ReportPanel({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 divide-y">
        {rows.length ? rows.map((row) => (
          <div key={`${title}-${row.label}`} className="flex items-center justify-between gap-4 py-3 text-sm">
            <span className="text-slate-600">{row.label}</span>
            <span className="font-medium text-slate-900">{row.value}</span>
          </div>
        )) : (
          <p className="py-3 text-sm text-slate-500">No data yet.</p>
        )}
      </div>
    </section>
  );
}

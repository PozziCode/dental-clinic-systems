import { DentalChart } from "@/components/shared/DentalChart";
import { getPatients } from "@/lib/database/queries";

export default async function DentistChartsPage() {
  const patients = await getPatients();

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Charts</h1>
        <p className="mt-2 text-sm text-slate-500">Select teeth and record surfaces through treatment entries.</p>
        <div className="mt-4 space-y-2">
          {patients.map((patient) => (
            <div key={patient.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              {patient.first_name} {patient.last_name}
            </div>
          ))}
        </div>
      </section>
      <DentalChart />
    </div>
  );
}

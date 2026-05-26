import { ActionForm } from "@/components/shared/ActionForm";
import { RealtimeStatus } from "@/components/shared/RealtimeStatus";
import {
  saveAppointmentAction,
  updateAppointmentStatusAction,
} from "@/features/admin/actions";
import { getAppointmentsWithRelations, getBranches, getPatients, getServicesForBranch, getUsers } from "@/lib/database/queries";

export default async function AdminAppointmentsPage() {
  const [appointments, patients, dentists, branches, services] = await Promise.all([
    getAppointmentsWithRelations(),
    getPatients(),
    getUsers("dentist"),
    getBranches(),
    getServicesForBranch(),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
            <p className="text-sm text-slate-500">Approve, reschedule, cancel, and prevent conflicts.</p>
          </div>
          <RealtimeStatus table="appointments" />
        </div>
        <div className="divide-y">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">
                    {appointment.services?.name ?? appointment.reason}
                  </p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {appointment.booking_reference ?? "Clinic-created"}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  {new Date(appointment.starts_at).toLocaleString()} to {new Date(appointment.ends_at).toLocaleTimeString()}
                </p>
                <div className="mt-2 grid gap-1 text-sm text-slate-600 md:grid-cols-2">
                  <span>
                    Patient:{" "}
                    {appointment.patients
                      ? `${appointment.patients.first_name} ${appointment.patients.last_name}`
                      : "Unknown"}
                  </span>
                  <span>Dentist: {appointment.dentist?.full_name ?? "Unassigned"}</span>
                  <span>Branch: {appointment.branches?.name ?? "Unknown"}</span>
                  <span>Payment: {appointment.payment_method ?? "Not set"}</span>
                </div>
                {appointment.appointment_notes ? (
                  <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
                    {appointment.appointment_notes}
                  </p>
                ) : null}
                <span className="mt-2 inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-medium capitalize text-sky-700">
                  {appointment.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {["approved", "completed", "cancelled"].map((status) => (
                  <form key={status} action={updateAppointmentStatusAction}>
                    <input type="hidden" name="id" value={appointment.id} />
                    <input type="hidden" name="status" value={status} />
                    <button className="rounded-lg border px-3 py-2 text-sm capitalize">{status}</button>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Create appointment</h2>
        <ActionForm action={saveAppointmentAction} submitLabel="Save appointment" className="mt-4 space-y-3">
          <select name="patient_id" className="w-full rounded-xl border px-4 py-3">
            <option value="">Patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.first_name} {patient.last_name}</option>
            ))}
          </select>
          <select name="dentist_id" className="w-full rounded-xl border px-4 py-3">
            <option value="">Dentist</option>
            {dentists.map((dentist) => (
              <option key={dentist.id} value={dentist.id}>{dentist.full_name}</option>
            ))}
          </select>
          <select name="branch_id" className="w-full rounded-xl border px-4 py-3">
            <option value="">Branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
          <select name="service_id" className="w-full rounded-xl border px-4 py-3">
            <option value="">Treatment service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>{service.name} · PHP {Number(service.base_price).toLocaleString()}</option>
            ))}
          </select>
          <input name="starts_at" type="datetime-local" className="w-full rounded-xl border px-4 py-3" />
          <input name="ends_at" type="datetime-local" className="w-full rounded-xl border px-4 py-3" />
          <input name="reason" placeholder="Reason" className="w-full rounded-xl border px-4 py-3" />
          <textarea name="appointment_notes" placeholder="Patient or admin notes" className="min-h-24 w-full rounded-xl border px-4 py-3" />
          <select name="payment_method" className="w-full rounded-xl border px-4 py-3">
            <option value="">Payment method</option>
            <option value="cash">Cash</option>
            <option value="gcash">GCash</option>
          </select>
          <select name="status" className="w-full rounded-xl border px-4 py-3" defaultValue="approved">
            <option value="requested">Requested</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </ActionForm>
      </aside>
    </div>
  );
}

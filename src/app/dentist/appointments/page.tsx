import { RealtimeStatus } from "@/components/shared/RealtimeStatus";
import { updateAppointmentStatusAction } from "@/features/admin/actions";
import { getAppointmentsWithRelations } from "@/lib/database/queries";

export default async function DentistAppointmentsPage() {
  const appointments = await getAppointmentsWithRelations();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-sm text-slate-500">Manage schedules for assigned branches.</p>
        </div>
        <RealtimeStatus table="appointments" />
      </div>
      <div className="divide-y rounded-2xl border bg-white shadow-sm">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{appointment.services?.name ?? appointment.reason}</p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  {appointment.booking_reference ?? "Clinic-created"}
                </span>
                <span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-medium capitalize text-sky-700">
                  {appointment.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {new Date(appointment.starts_at).toLocaleString()} to {new Date(appointment.ends_at).toLocaleTimeString()}
              </p>
              <div className="mt-2 grid gap-1 text-sm text-slate-600 md:grid-cols-2">
                <span>
                  Patient:{" "}
                  {appointment.patients
                    ? `${appointment.patients.first_name} ${appointment.patients.last_name}`
                    : "Unknown"}
                </span>
                <span>Branch: {appointment.branches?.name ?? "Unknown"}</span>
              </div>
              {appointment.appointment_notes ? (
                <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
                  {appointment.appointment_notes}
                </p>
              ) : null}
            </div>
            <form action={updateAppointmentStatusAction} className="flex gap-2">
              <input type="hidden" name="id" value={appointment.id} />
              <button name="status" value="completed" className="rounded-lg border px-3 py-2 text-sm">Complete</button>
              <button name="status" value="no_show" className="rounded-lg border px-3 py-2 text-sm">No show</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}

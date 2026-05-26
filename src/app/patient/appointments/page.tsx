import { PatientAppointmentBookingWizard } from "@/features/services/PatientAppointmentBookingWizard";
import { requireRole } from "@/lib/auth/guards";
import {
  getAppointmentsWithRelations,
  getBranches,
  getCurrentPatientWithProfile,
  getDentistAvailabilityForBranch,
  getDentistScheduleBlocksForBranch,
  getDentistsForBranch,
  getServicesForBranch,
} from "@/lib/database/queries";

type PatientAppointmentsPageProps = {
  searchParams?: Promise<{ serviceId?: string }>;
};

export default async function PatientAppointmentsPage({
  searchParams,
}: PatientAppointmentsPageProps) {
  const params: { serviceId?: string } = searchParams ? await searchParams : {};
  const user = await requireRole("patient");
  const patient = await getCurrentPatientWithProfile(user.profile.id);

  if (!patient) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <h1 className="text-xl font-semibold">Complete your patient profile</h1>
        <p className="mt-2 text-sm">
          Appointment booking is available after your registered patient profile is connected to this account.
        </p>
      </div>
    );
  }

  const [branches, services, dentists, availability, blocks, appointments] = await Promise.all([
    getBranches(),
    getServicesForBranch(patient.branch_id),
    getDentistsForBranch(patient.branch_id),
    getDentistAvailabilityForBranch(patient.branch_id),
    getDentistScheduleBlocksForBranch(patient.branch_id),
    getAppointmentsWithRelations(patient.id),
  ]);
  const branch = branches.find((item) => item.id === patient.branch_id) ?? null;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">My appointments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review your requests and book new visits through the patient portal.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {appointments.length ? (
            appointments.map((appointment) => (
              <article key={appointment.id} className="rounded-lg border bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {appointment.services?.name ?? appointment.reason}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(appointment.starts_at).toLocaleString("en-PH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Manila",
                      })}
                    </p>
                  </div>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium capitalize text-sky-700">
                    {appointment.status}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-500">
                  <span>Reference: {appointment.booking_reference ?? "Clinic-created"}</span>
                  <span>Dentist: {appointment.dentist?.full_name ?? "To be assigned"}</span>
                  <span>Payment: {appointment.payment_method ?? "Not set"}</span>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              No appointments yet. Start with the booking wizard below.
            </p>
          )}
        </div>
      </section>

      <PatientAppointmentBookingWizard
        patient={patient}
        branch={branch}
        services={services}
        dentists={dentists}
        availability={availability}
        blocks={blocks}
        appointments={appointments}
        initialServiceId={params.serviceId}
      />
    </div>
  );
}

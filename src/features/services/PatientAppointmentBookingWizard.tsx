"use client";

import Link from "next/link";
import type React from "react";
import { useState, useTransition } from "react";
import {
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  HeartHandshake,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { bookPatientAppointmentAction } from "@/features/admin/actions";
import type {
  AppointmentWithRelations,
  Branch,
  ClinicUser,
  DentistAvailability,
  DentistScheduleBlock,
  PatientWithProfile,
  ServiceWithRelations,
} from "@/lib/database.types";
import { cn } from "@/lib/utils";

type BookingConfirmation = {
  id: string;
  booking_reference: string | null;
  starts_at: string;
  ends_at: string;
  reason: string;
  status: string;
  payment_method: "cash" | "gcash" | null;
};

type Props = {
  patient: PatientWithProfile | null;
  branch: Branch | null;
  services: ServiceWithRelations[];
  dentists: ClinicUser[];
  availability: DentistAvailability[];
  blocks: DentistScheduleBlock[];
  appointments: AppointmentWithRelations[];
  initialServiceId?: string;
};

const steps = ["Service", "Schedule", "Patient", "Review"];
const paymentLabels = {
  cash: "Cash",
  gcash: "GCash",
};

function profileExists(patient: PatientWithProfile | null) {
  if (!patient?.patient_profiles) return false;
  return Array.isArray(patient.patient_profiles)
    ? patient.patient_profiles.length > 0
    : true;
}

function fullName(patient: PatientWithProfile | null) {
  if (!patient) return "";
  return [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(" ");
}

function effectiveSetting(service: ServiceWithRelations, branchId?: string | null) {
  return service.service_branch_settings?.find((setting) => setting.branch_id === branchId);
}

function effectiveDuration(service: ServiceWithRelations | undefined, branchId?: string | null) {
  if (!service) return 30;
  return effectiveSetting(service, branchId)?.duration_override_mins ?? service.duration_mins;
}

function effectivePrice(service: ServiceWithRelations | undefined, branchId?: string | null) {
  if (!service) return 0;
  return effectiveSetting(service, branchId)?.price_override ?? service.base_price;
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function manilaDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00+08:00`);
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeToMinutes(value: string) {
  const [hour = "0", minute = "0"] = value.slice(0, 5).split(":");
  return Number(hour) * 60 + Number(minute);
}

function minutesToTime(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function overlaps(start: Date, end: Date, otherStart: string, otherEnd: string) {
  return start < new Date(otherEnd) && end > new Date(otherStart);
}

function formatDateTime(value?: string) {
  if (!value) return "Not selected";
  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });
}

function monthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function availabilityForDate({
  date,
  dentistId,
  availability,
}: {
  date: string;
  dentistId: string;
  availability: DentistAvailability[];
}) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return availability.filter((item) => item.dentist_id === dentistId && item.weekday === weekday && item.is_active);
}

function slotsForDate({
  date,
  dentistId,
  duration,
  availability,
  appointments,
  blocks,
}: {
  date: string;
  dentistId: string;
  duration: number;
  availability: DentistAvailability[];
  appointments: AppointmentWithRelations[];
  blocks: DentistScheduleBlock[];
}) {
  if (!date || !dentistId) return [];

  const dayAvailability = availabilityForDate({ date, dentistId, availability });
  const slots = new Set<string>();
  const now = new Date();

  dayAvailability.forEach((item) => {
    const start = timeToMinutes(item.start_time);
    const end = timeToMinutes(item.end_time);
    const interval = item.slot_interval_mins || 30;

    for (let cursor = start; cursor + duration <= end; cursor += interval) {
      const time = minutesToTime(cursor);
      const slotStart = manilaDateTime(date, time);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);
      const blocked =
        slotStart <= now ||
        appointments.some(
          (appointment) =>
            appointment.dentist_id === dentistId &&
            ["requested", "approved"].includes(appointment.status) &&
            overlaps(slotStart, slotEnd, appointment.starts_at, appointment.ends_at)
        ) ||
        blocks.some(
          (block) =>
            block.dentist_id === dentistId &&
            overlaps(slotStart, slotEnd, block.starts_at, block.ends_at)
        );

      if (!blocked) slots.add(time);
    }
  });

  return Array.from(slots).sort();
}

function BookingSummary({
  service,
  dentist,
  branch,
  date,
  time,
  duration,
  paymentMethod,
}: {
  service?: ServiceWithRelations;
  dentist?: ClinicUser;
  branch: Branch | null;
  date: string;
  time: string;
  duration: number;
  paymentMethod: "cash" | "gcash";
}) {
  const startsAt = date && time ? manilaDateTime(date, time).toISOString() : "";

  return (
    <aside className="sticky top-6 hidden h-fit rounded-lg border border-sky-100 bg-white p-5 shadow-sm xl:block">
      <p className="text-xs font-semibold uppercase text-sky-700">Booking summary</p>
      <div className="mt-4 space-y-4 text-sm">
        <div>
          <p className="text-slate-500">Service</p>
          <p className="break-words font-semibold text-slate-900">{service?.name ?? "Choose a service"}</p>
        </div>
        <div>
          <p className="text-slate-500">Dentist</p>
          <p className="break-words font-semibold text-slate-900">{dentist?.full_name ?? "Choose a dentist"}</p>
        </div>
        <div>
          <p className="text-slate-500">Schedule</p>
          <p className="break-words font-semibold text-slate-900">{formatDateTime(startsAt)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-slate-500">Branch</p>
            <p className="font-semibold text-slate-900">{branch?.name ?? "Branch"}</p>
          </div>
          <div>
            <p className="text-slate-500">Duration</p>
            <p className="font-semibold text-slate-900">{duration} mins</p>
          </div>
        </div>
        <div>
          <p className="text-slate-500">Payment</p>
          <p className="font-semibold text-slate-900">{paymentLabels[paymentMethod]}</p>
        </div>
      </div>
    </aside>
  );
}

export function PatientAppointmentBookingWizard({
  patient,
  branch,
  services,
  dentists,
  availability,
  blocks,
  appointments,
  initialServiceId,
}: Props) {
  const firstServiceId = services.some((service) => service.id === initialServiceId)
    ? initialServiceId ?? ""
    : services[0]?.id ?? "";
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(firstServiceId);
  const [dentistId, setDentistId] = useState(patient?.assigned_dentist_id ?? dentists[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash">("cash");
  const [reminderConsent, setReminderConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [month, setMonth] = useState(() => new Date());
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasProfile = profileExists(patient);
  const selectedService = services.find((service) => service.id === serviceId);
  const selectedDentist = dentists.find((dentist) => dentist.id === dentistId);
  const duration = effectiveDuration(selectedService, branch?.id);
  const slots = slotsForDate({
    date: selectedDate,
    dentistId,
    duration,
    availability,
    appointments,
    blocks,
  });
  const morningSlots = slots.filter((slot) => timeToMinutes(slot) < 12 * 60);
  const afternoonSlots = slots.filter((slot) => timeToMinutes(slot) >= 12 * 60);
  const todayInput = toDateInput(new Date());

  function canContinue(targetStep = step) {
    if (targetStep === 0) return Boolean(serviceId);
    if (targetStep === 1) return Boolean(dentistId && selectedDate && selectedTime);
    if (targetStep === 2) return reminderConsent && privacyConsent;
    return true;
  }

  function goNext() {
    if (!canContinue()) {
      setMessage(
        step === 2
          ? "Complete the required consents before review."
          : "Complete this step before continuing."
      );
      return;
    }
    setMessage("");
    setStep((current) => Math.min(3, current + 1));
  }

  function submit() {
    if (!branch || !patient || !selectedService || !selectedDentist || !selectedDate || !selectedTime) {
      setMessage("Complete all booking details before submitting.");
      return;
    }

    const formData = new FormData();
    formData.set("service_id", selectedService.id);
    formData.set("dentist_id", selectedDentist.id);
    formData.set("branch_id", branch.id);
    formData.set("appointment_date", selectedDate);
    formData.set("appointment_time", selectedTime);
    formData.set("payment_method", paymentMethod);
    formData.set("appointment_notes", notes);
    if (reminderConsent) formData.set("reminder_consent", "true");
    if (privacyConsent) formData.set("privacy_consent", "true");

    setMessage("");
    startTransition(async () => {
      const result = await bookPatientAppointmentAction({}, formData);
      if (result?.error) {
        setMessage(result.error);
        return;
      }
      if (result?.appointment) {
        setConfirmation(result.appointment as BookingConfirmation);
      }
    });
  }

  function downloadCalendar() {
    if (!confirmation) return;
    const start = new Date(confirmation.starts_at).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const end = new Date(confirmation.ends_at).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `UID:${confirmation.id}@samonte-dental-clinic`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${confirmation.reason}`,
      `DESCRIPTION:Booking reference ${confirmation.booking_reference ?? ""}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${confirmation.booking_reference ?? "appointment"}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!patient || !branch) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <h2 className="text-lg font-semibold">Patient profile required</h2>
        <p className="mt-2 text-sm">
          Complete registration and patient profile setup before requesting appointments.
        </p>
      </div>
    );
  }

  if (confirmation) {
    return (
      <section className="rounded-lg border bg-white shadow-sm">
        <div className="border-b bg-sky-50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-700">
              <CalendarCheck className="size-7" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase text-sky-700">Appointment requested</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Reference {confirmation.booking_reference}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Your booking is pending clinic approval. We will confirm or contact you if a schedule adjustment is needed.
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <SummaryTile label="Service" value={confirmation.reason} />
              <SummaryTile label="Schedule" value={formatDateTime(confirmation.starts_at)} />
              <SummaryTile label="Branch" value={branch.name} />
              <SummaryTile label="Payment" value={confirmation.payment_method ? paymentLabels[confirmation.payment_method] : "Not set"} />
            </div>
            <div className="rounded-lg border border-sky-100 bg-sky-50 p-5 text-sm text-sky-900">
              <h2 className="font-semibold">Clinic reminders</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Arrive 10 to 15 minutes before your appointment.</li>
                <li>Bring valid identification and any recent dental records.</li>
                <li>Wait for approval before treating this as a confirmed clinic schedule.</li>
              </ul>
            </div>
            <div className="rounded-lg border p-5 text-sm text-slate-700">
              <h2 className="font-semibold text-slate-900">Arrival instructions</h2>
              <p className="mt-2">{branch.address}</p>
              <p className="mt-2">Check in at the reception desk and provide your booking reference.</p>
            </div>
          </div>
          <div className="space-y-3 rounded-lg border bg-slate-50 p-4">
            <button
              type="button"
              onClick={downloadCalendar}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white"
            >
              <CalendarCheck className="size-4" />
              Add to calendar
            </button>
            <Link
              href="/patient/dashboard"
              className="flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              <UserRound className="size-4" />
              Open patient portal
            </Link>
            <button
              type="button"
              onClick={() => {
                setConfirmation(null);
                setStep(0);
                setSelectedDate("");
                setSelectedTime("");
                setNotes("");
                setReminderConsent(false);
                setPrivacyConsent(false);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              <HeartHandshake className="size-4" />
              Book another appointment
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-sky-700">Progress</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {steps.map((label, index) => {
            const active = index === step;
            const done = index < step;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (index <= step || steps.slice(0, index).every((_, stepIndex) => canContinue(stepIndex))) {
                    setStep(index);
                    setMessage("");
                  }
                }}
                className={cn(
                  "flex min-h-16 w-full min-w-0 items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm transition",
                  active && "bg-sky-600 text-white",
                  done && !active && "border-emerald-100 bg-emerald-50 text-emerald-700",
                  !active && !done && "border-slate-100 text-slate-500 hover:bg-slate-50"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border text-xs",
                    active && "border-white",
                    done && "border-emerald-200 bg-emerald-100"
                  )}
                >
                  {done ? <Check className="size-3" /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs opacity-75">Step {index + 1}</span>
                  <span className="block truncate font-medium sm:whitespace-normal">{label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-h-[640px] min-w-0 rounded-lg border bg-white shadow-sm">
        <div className="border-b p-5">
          <h1 className="text-2xl font-bold text-slate-900">Book an appointment</h1>
          <p className="mt-1 text-sm text-slate-500">Request a visit through your secure patient portal.</p>
        </div>

        <div className="p-5">
          <div key={step} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
            {step === 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {services.map((service) => {
                  const selected = service.id === serviceId;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        setServiceId(service.id);
                        setSelectedTime("");
                      }}
                      className={cn(
                        "rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-sm",
                        selected ? "border-sky-500 bg-sky-50 ring-2 ring-sky-100" : "bg-white"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white text-sm font-bold text-sky-700">
                          {service.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={service.image_url} alt="" className="h-full w-full object-cover" />
                          ) : service.icon ? (
                            service.icon
                          ) : (
                            initials(service.name)
                          )}
                        </div>
                        <div>
                          <h2 className="font-semibold text-slate-900">{service.name}</h2>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                            {service.description ?? "Professional dental care from Samonte Dental Clinic."}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-slate-700">
                          <CreditCard className="size-4 text-sky-600" />
                          PHP {Number(effectivePrice(service, branch.id)).toLocaleString()}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-slate-700">
                          <Clock className="size-4 text-sky-600" />
                          {effectiveDuration(service, branch.id)} mins
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Preferred dentist</span>
                    <select
                      value={dentistId}
                      onChange={(event) => {
                        setDentistId(event.target.value);
                        setSelectedTime("");
                      }}
                      className="mt-2 h-11 w-full rounded-lg border px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    >
                      {dentists.map((dentist) => (
                        <option key={dentist.id} value={dentist.id}>
                          {dentist.full_name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="rounded-lg border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900">
                    <p className="font-semibold">Availability guide</p>
                    <div className="mt-3 grid gap-2">
                      <Legend tone="today" label="Today" />
                      <Legend tone="available" label="Available date" />
                      <Legend tone="selected" label="Selected date" />
                      <Legend tone="disabled" label="Unavailable date" />
                    </div>
                  </div>
                </div>
                <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                        className="rounded-lg border p-2"
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <h2 className="font-semibold text-slate-900">
                        {month.toLocaleString("en-PH", { month: "long", year: "numeric" })}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                        className="rounded-lg border p-2"
                        aria-label="Next month"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>
                    <div className="mt-2 grid grid-cols-7 gap-1">
                      {monthGrid(month).map((date) => {
                        const dateValue = toDateInput(date);
                        const inMonth = date.getMonth() === month.getMonth();
                        const dateSlots = slotsForDate({
                          date: dateValue,
                          dentistId,
                          duration,
                          availability,
                          appointments,
                          blocks,
                        });
                        const disabled = dateValue < todayInput || dateSlots.length === 0;
                        const selected = selectedDate === dateValue;
                        const today = dateValue === todayInput;
                        return (
                          <button
                            key={dateValue}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              setSelectedDate(dateValue);
                              setSelectedTime("");
                            }}
                            className={cn(
                              "aspect-square rounded-lg border text-sm transition",
                              !inMonth && "opacity-35",
                              today && "border-sky-500 bg-sky-50 text-sky-700",
                              !disabled && !selected && "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400",
                              selected && "border-sky-600 bg-sky-600 font-semibold text-white",
                              disabled && "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                            )}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h2 className="font-semibold text-slate-900">Time slots</h2>
                    <p className="mt-1 text-xs text-slate-500">Slots are shown in Asia/Manila time.</p>
                    <SlotGroup title="Morning" slots={morningSlots} selectedTime={selectedTime} onSelect={setSelectedTime} />
                    <SlotGroup title="Afternoon" slots={afternoonSlots} selectedTime={selectedTime} onSelect={setSelectedTime} />
                  </div>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  {!hasProfile ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      Your account is connected to a patient record, so you can continue booking. Some detailed profile
                      fields are still incomplete; update them from{" "}
                      <Link href="/patient/profile" className="font-semibold underline underline-offset-2">
                        your profile page
                      </Link>
                      .
                    </div>
                  ) : null}
                  <div className="grid gap-4 md:grid-cols-2">
                    <ReadOnlyField label="Full name" value={fullName(patient)} />
                    <ReadOnlyField label="Birthday" value={patient.birth_date ?? "Not set"} />
                    <ReadOnlyField label="Sex" value={patient.sex ?? "Not set"} />
                    <ReadOnlyField label="Phone" value={patient.phone ?? "Not set"} />
                    <ReadOnlyField label="Email" value={patient.email ?? "Not set"} />
                    <ReadOnlyField label="Patient number" value={patient.patient_number} />
                  </div>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Appointment notes</span>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      className="mt-2 min-h-28 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      placeholder="Share symptoms, concerns, or anything the clinic should know."
                    />
                  </label>
                </div>
                <div className="space-y-4 rounded-lg border bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Payment method</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {(["cash", "gcash"] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-sm font-medium transition",
                            paymentMethod === method
                              ? "border-sky-500 bg-sky-600 text-white"
                              : "bg-white text-slate-700 hover:border-sky-300"
                          )}
                        >
                          {paymentLabels[method]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex gap-3 rounded-lg bg-white p-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={reminderConsent}
                      onChange={(event) => setReminderConsent(event.target.checked)}
                      className="mt-1"
                    />
                    I agree to receive appointment reminders.
                  </label>
                  <label className="flex gap-3 rounded-lg bg-white p-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={privacyConsent}
                      onChange={(event) => setPrivacyConsent(event.target.checked)}
                      className="mt-1"
                    />
                    I agree to the privacy policy and booking policy.
                  </label>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <ReviewSection
                  icon={<Stethoscope className="size-5" />}
                  title="Selected dental service"
                  rows={[
                    ["Service", selectedService?.name ?? "Not selected"],
                    ["Estimated price", `PHP ${Number(effectivePrice(selectedService, branch.id)).toLocaleString()}`],
                    ["Estimated treatment duration", `${duration} mins`],
                  ]}
                />
                <ReviewSection
                  icon={<UserRound className="size-5" />}
                  title="Assigned dentist"
                  rows={[
                    ["Dentist", selectedDentist?.full_name ?? "Not selected"],
                    ["Branch", branch.name],
                  ]}
                />
                <ReviewSection
                  icon={<CalendarCheck className="size-5" />}
                  title="Appointment schedule"
                  rows={[
                    ["Date and time", selectedDate && selectedTime ? formatDateTime(manilaDateTime(selectedDate, selectedTime).toISOString()) : "Not selected"],
                    ["Status after request", "Requested"],
                    ["Payment method", paymentLabels[paymentMethod]],
                  ]}
                />
                <ReviewSection
                  icon={<FileText className="size-5" />}
                  title="Patient notes"
                  rows={[["Notes", notes || "No notes added"]]}
                />
              </div>
            ) : null}
          </div>

          {message ? <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p> : null}

          <div className="mt-6 flex items-center justify-between border-t pt-5">
            <button
              type="button"
              onClick={() => {
                setStep((current) => Math.max(0, current - 1));
                setMessage("");
              }}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
              disabled={step === 0 || isPending}
            >
              Back
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={isPending}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={isPending}
              >
                {isPending ? "Requesting..." : "Submit booking request"}
              </button>
            )}
          </div>
        </div>
      </section>

      <BookingSummary
        service={selectedService}
        dentist={selectedDentist}
        branch={branch}
        date={selectedDate}
        time={selectedTime}
        duration={duration}
        paymentMethod={paymentMethod}
      />
      </div>
    </div>
  );
}

function Legend({ tone, label }: { tone: "today" | "available" | "selected" | "disabled"; label: string }) {
  const colors = {
    today: "border-sky-500 bg-sky-50",
    available: "border-emerald-200 bg-emerald-50",
    selected: "border-sky-600 bg-sky-600",
    disabled: "border-slate-100 bg-slate-100",
  };
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("size-4 rounded border", colors[tone])} />
      {label}
    </span>
  );
}

function SlotGroup({
  title,
  slots,
  selectedTime,
  onSelect,
}: {
  title: string;
  slots: string[];
  selectedTime: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {slots.length ? (
          slots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => onSelect(slot)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium transition",
                selectedTime === slot
                  ? "border-sky-600 bg-sky-600 text-white"
                  : "bg-white text-slate-700 hover:border-sky-300"
              )}
            >
              {slot}
            </button>
          ))
        ) : (
          <p className="col-span-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">No slots</p>
        )}
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 px-3 py-2">
      <p className="text-xs font-medium uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ReviewSection({
  icon,
  title,
  rows,
}: {
  icon: React.ReactNode;
  title: string;
  rows: [string, string][];
}) {
  return (
    <section className="rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sky-700">
        {icon}
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs font-medium uppercase text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Circle,
  Plus,
  UserPlus,
  X,
} from "lucide-react";
import { registerPatientAction } from "@/features/auth/actions";

type RegisterValues = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: string;
  sex: string;
  occupation: string;
  civil_status: string;
  guardian_name: string;
  phone: string;
  address: string;
  address_line: string;
  city: string;
  province: string;
  postal_code: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyContact: string;
  allergies: string[];
  medications: string[];
  medical_conditions: string[];
  medicalHistory: string;
  dentalHistory: string;
  previous_dentist: string;
  last_dental_visit: string;
  dental_anxiety_score: string;
  consent_treatment: boolean;
  consent_privacy: boolean;
  consent_billing: boolean;
  consent_marketing: boolean;
};

type CreatedPatient = {
  patientId: string;
  patientNumber: string;
  allergyAlert: boolean;
};

const initialValues: RegisterValues = {
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  middleName: "",
  lastName: "",
  birthDate: "",
  sex: "",
  occupation: "",
  civil_status: "",
  guardian_name: "",
  phone: "",
  address: "",
  address_line: "",
  city: "",
  province: "",
  postal_code: "",
  emergencyName: "",
  emergencyRelationship: "",
  emergencyContact: "",
  allergies: [],
  medications: [],
  medical_conditions: [],
  medicalHistory: "",
  dentalHistory: "",
  previous_dentist: "",
  last_dental_visit: "",
  dental_anxiety_score: "3",
  consent_treatment: false,
  consent_privacy: false,
  consent_billing: false,
  consent_marketing: false,
};

const steps = [
  "Account & personal info",
  "Contact details",
  "Medical history",
  "Dental history",
  "Consent",
  "Review",
];

const conditionOptions = [
  "Heart disease",
  "High blood pressure",
  "Diabetes",
  "Asthma",
  "Pregnancy",
  "Bleeding disorder",
  "Kidney disease",
  "Epilepsy",
  "Hepatitis",
  "Tuberculosis",
  "Recent surgery",
  "Latex sensitivity",
];

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100";
const areaClass =
  "min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100";

function TagInput({
  label,
  tone,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  tone: "red" | "blue";
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const color =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-sky-200 bg-sky-50 text-sky-700";

  function addTag() {
    const value = draft.trim();
    if (!value || values.includes(value)) return;
    onChange([...values, value]);
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          className={fieldClass}
        />
        <button
          type="button"
          onClick={addTag}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white"
        >
          <Plus className="size-4" />
          Add
        </button>
      </div>
      <div className="flex min-h-9 flex-wrap gap-2">
        {values.length ? (
          values.map((value) => (
            <span
              key={value}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${color}`}
            >
              {value}
              <button type="button" onClick={() => onChange(values.filter((item) => item !== value))}>
                <X className="size-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-400">No entries added.</span>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | string[] | boolean }) {
  const display = Array.isArray(value)
    ? value.length
      ? value.join(", ")
      : "None"
    : typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : value || "Not set";

  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-700">{display}</p>
    </div>
  );
}

export function PatientRegisterForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<RegisterValues>(initialValues);
  const [message, setMessage] = useState("");
  const [created, setCreated] = useState<CreatedPatient | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof RegisterValues>(key: K, value: RegisterValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function validateBeforeSubmit() {
    if (!values.email.trim()) return "Email is required.";
    if (values.password.length < 8) return "Use at least 8 characters for your password.";
    if (values.password !== values.confirmPassword) return "Passwords do not match.";
    if (!values.firstName.trim() || !values.lastName.trim()) {
      return "First name and last name are required.";
    }
    if (!values.consent_treatment || !values.consent_privacy || !values.consent_billing) {
      return "Treatment, privacy, and billing consents are required.";
    }
    return "";
  }

  function submit() {
    const validation = validateBeforeSubmit();
    if (validation) {
      setMessage(validation);
      return;
    }

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, item));
      } else if (typeof value === "boolean") {
        if (value) formData.set(key, "true");
      } else {
        formData.set(key, value);
      }
    });

    setMessage("");
    startTransition(async () => {
      const result = await registerPatientAction({}, formData);
      if (result?.error) {
        setMessage(result.error);
        return;
      }
      if (result?.patientId && result?.patientNumber) {
        setCreated({
          patientId: result.patientId,
          patientNumber: result.patientNumber,
          allergyAlert: Boolean(result.allergyAlert),
        });
      } else {
        setMessage(result?.success ?? "Account created. You can log in now.");
      }
    });
  }

  if (created) {
    return (
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Registration complete</h2>
                <p className="text-sm text-slate-500">
                  Patient ID {created.patientNumber} is ready in your clinic record.
                </p>
              </div>
            </div>
            {created.allergyAlert ? (
              <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 size-4" />
                Allergy alert is active on your record.
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-3">
              <ReviewRow label="Patient" value={`${values.firstName} ${values.lastName}`} />
              <ReviewRow label="Email" value={values.email} />
              <ReviewRow label="Allergies" value={values.allergies} />
              <ReviewRow label="Medications" value={values.medications} />
              <ReviewRow label="Conditions" value={values.medical_conditions} />
              <ReviewRow label="Anxiety score" value={values.dental_anxiety_score} />
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4">
            <Link href="/login" className="rounded-lg bg-sky-600 px-4 py-2 text-center text-sm font-medium text-white">
              Continue to login
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b bg-slate-50 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-sky-100 p-2 text-sky-700">
            <UserPlus className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Patient registration</h2>
            <p className="text-sm text-slate-500">
              Create your account and complete your dental patient profile.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr]">
        <aside className="border-b bg-slate-50 p-4 lg:border-b-0 lg:border-r">
          <div className="grid gap-2">
            {steps.map((label, index) => {
              const active = index === step;
              const done = index < step;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStep(index)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                    active
                      ? "bg-sky-600 text-white"
                      : done
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-white"
                  }`}
                >
                  {done ? <Check className="size-4" /> : active ? <Circle className="size-4 fill-current" /> : <Circle className="size-4" />}
                  <span>
                    <span className="block text-xs opacity-75">Step {index + 1}</span>
                    <span className="font-medium">{label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="min-h-[620px] p-6">
          <div
            key={step}
            className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 motion-reduce:animate-none"
          >
          {step === 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              <input className={fieldClass} type="email" placeholder="Email" value={values.email} onChange={(event) => update("email", event.target.value)} />
              <input className={fieldClass} type="password" placeholder="Password" value={values.password} onChange={(event) => update("password", event.target.value)} />
              <input className={fieldClass} type="password" placeholder="Confirm password" value={values.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} />
              <input className={fieldClass} placeholder="First name" value={values.firstName} onChange={(event) => update("firstName", event.target.value)} />
              <input className={fieldClass} placeholder="Middle name" value={values.middleName} onChange={(event) => update("middleName", event.target.value)} />
              <input className={fieldClass} placeholder="Last name" value={values.lastName} onChange={(event) => update("lastName", event.target.value)} />
              <input className={fieldClass} type="date" value={values.birthDate} onChange={(event) => update("birthDate", event.target.value)} />
              <select className={fieldClass} value={values.sex} onChange={(event) => update("sex", event.target.value)}>
                <option value="">Sex</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
              <input className={fieldClass} placeholder="Occupation" value={values.occupation} onChange={(event) => update("occupation", event.target.value)} />
              <input className={fieldClass} placeholder="Civil status" value={values.civil_status} onChange={(event) => update("civil_status", event.target.value)} />
              <input className={`${fieldClass} md:col-span-2`} placeholder="Guardian name" value={values.guardian_name} onChange={(event) => update("guardian_name", event.target.value)} />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4 xl:grid-cols-3">
              <div className="rounded-xl border p-4">
                <h3 className="font-semibold text-slate-900">Primary contact</h3>
                <div className="mt-4 space-y-3">
                  <input className={fieldClass} type="email" placeholder="Email" value={values.email} onChange={(event) => update("email", event.target.value)} />
                  <input className={fieldClass} placeholder="Phone" value={values.phone} onChange={(event) => update("phone", event.target.value)} />
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <h3 className="font-semibold text-slate-900">Home address</h3>
                <div className="mt-4 space-y-3">
                  <input className={fieldClass} placeholder="Street address" value={values.address_line} onChange={(event) => update("address_line", event.target.value)} />
                  <input className={fieldClass} placeholder="City" value={values.city} onChange={(event) => update("city", event.target.value)} />
                  <input className={fieldClass} placeholder="Province" value={values.province} onChange={(event) => update("province", event.target.value)} />
                  <input className={fieldClass} placeholder="Postal code" value={values.postal_code} onChange={(event) => update("postal_code", event.target.value)} />
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <h3 className="font-semibold text-slate-900">Emergency contact</h3>
                <div className="mt-4 space-y-3">
                  <input className={fieldClass} placeholder="Contact name" value={values.emergencyName} onChange={(event) => update("emergencyName", event.target.value)} />
                  <input className={fieldClass} placeholder="Relationship" value={values.emergencyRelationship} onChange={(event) => update("emergencyRelationship", event.target.value)} />
                  <input className={fieldClass} placeholder="Emergency phone" value={values.emergencyContact} onChange={(event) => update("emergencyContact", event.target.value)} />
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              {values.allergies.length ? (
                <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 size-4" />
                  Allergy alert will be shown on your patient record.
                </div>
              ) : null}
              <div className="grid gap-5 lg:grid-cols-2">
                <TagInput label="Allergies" tone="red" values={values.allergies} onChange={(items) => update("allergies", items)} placeholder="Add allergy" />
                <TagInput label="Medications" tone="blue" values={values.medications} onChange={(items) => update("medications", items)} placeholder="Add medication" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Medical conditions</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {conditionOptions.map((condition) => (
                    <label key={condition} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={values.medical_conditions.includes(condition)}
                        onChange={(event) =>
                          update(
                            "medical_conditions",
                            event.target.checked
                              ? [...values.medical_conditions, condition]
                              : values.medical_conditions.filter((item) => item !== condition)
                          )
                        }
                      />
                      {condition}
                    </label>
                  ))}
                </div>
              </div>
              <textarea className={areaClass} placeholder="Additional medical history notes" value={values.medicalHistory} onChange={(event) => update("medicalHistory", event.target.value)} />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <textarea className={`${areaClass} lg:col-span-2`} placeholder="Dental history" value={values.dentalHistory} onChange={(event) => update("dentalHistory", event.target.value)} />
              <input className={fieldClass} placeholder="Previous dentist" value={values.previous_dentist} onChange={(event) => update("previous_dentist", event.target.value)} />
              <input className={fieldClass} type="date" value={values.last_dental_visit} onChange={(event) => update("last_dental_visit", event.target.value)} />
              <div className="rounded-xl border p-4 lg:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">Dental anxiety scale</h3>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">{values.dental_anxiety_score}/5</span>
                </div>
                <input className="mt-5 w-full" type="range" min="1" max="5" value={values.dental_anxiety_score} onChange={(event) => update("dental_anxiety_score", event.target.value)} />
                <div className="mt-2 flex justify-between text-xs text-slate-400">
                  <span>Calm</span>
                  <span>Very anxious</span>
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="rounded-xl border p-4">
              <h3 className="font-semibold text-slate-900">Consent agreements</h3>
              <p className="mt-1 text-sm text-slate-500">Treatment, privacy, and billing consent are required.</p>
              <div className="mt-4 grid gap-3">
                {[
                  ["consent_treatment", "I consent to dental examination and treatment."],
                  ["consent_privacy", "I consent to privacy and data processing for clinic records."],
                  ["consent_billing", "I authorize billing processing."],
                  ["consent_marketing", "I agree to receive optional clinic communications."],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={Boolean(values[key as keyof RegisterValues])}
                      onChange={(event) => update(key as keyof RegisterValues, event.target.checked as never)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-5">
              {[
                ["Account & personal", [["Email", values.email], ["Patient", `${values.firstName} ${values.lastName}`], ["Birth date", values.birthDate], ["Sex", values.sex], ["Occupation", values.occupation]]],
                ["Contact", [["Phone", values.phone], ["Address", [values.address_line, values.city, values.province, values.postal_code].filter(Boolean).join(", ")], ["Emergency", `${values.emergencyName} ${values.emergencyContact}`]]],
                ["Medical", [["Allergies", values.allergies], ["Medications", values.medications], ["Conditions", values.medical_conditions], ["History", values.medicalHistory]]],
                ["Dental", [["Dental history", values.dentalHistory], ["Previous dentist", values.previous_dentist], ["Last visit", values.last_dental_visit], ["Anxiety", values.dental_anxiety_score]]],
                ["Consent", [["Treatment consent", values.consent_treatment], ["Privacy consent", values.consent_privacy], ["Billing consent", values.consent_billing], ["Marketing consent", values.consent_marketing]]],
              ].map(([title, rows], index) => (
                <div key={String(title)} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{String(title)}</h3>
                    <button type="button" onClick={() => setStep(index)} className="rounded-lg border px-3 py-1 text-xs font-medium">
                      Edit
                    </button>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {(rows as [string, string | string[] | boolean][]).map(([label, value]) => (
                      <ReviewRow key={label} label={label} value={value} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          </div>

          {message ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p> : null}

          <div className="mt-6 flex items-center justify-between border-t pt-5">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
              disabled={step === 0}
            >
              Back
            </button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white">
                Continue
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={isPending} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-70">
                {isPending ? "Creating account..." : "Create account"}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

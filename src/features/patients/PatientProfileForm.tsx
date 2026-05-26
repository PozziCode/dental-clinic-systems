"use client";

import type React from "react";
import { ActionForm } from "@/components/shared/ActionForm";
import { saveCurrentPatientProfileAction } from "@/features/admin/actions";
import type { PatientProfile, PatientWithProfile } from "@/lib/database.types";

function getProfile(patient: PatientWithProfile) {
  const profile = patient.patient_profiles;
  if (Array.isArray(profile)) return profile[0] ?? null;
  return profile ?? null;
}

function listValue(values?: string[] | null) {
  return (values ?? []).join(", ");
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100";
const textareaClass =
  "min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

export function PatientProfileForm({ patient }: { patient: PatientWithProfile }) {
  const profile = getProfile(patient) as PatientProfile | null;

  return (
    <ActionForm
      action={saveCurrentPatientProfileAction}
      submitLabel="Save profile"
      pendingLabel="Saving profile..."
      className="space-y-6"
    >
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Basic information</h2>
          <p className="mt-1 text-sm text-slate-500">These details identify your clinic patient record.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="First name">
            <input name="first_name" defaultValue={patient.first_name} className={inputClass} required />
          </Field>
          <Field label="Middle name">
            <input name="middle_name" defaultValue={patient.middle_name ?? ""} className={inputClass} />
          </Field>
          <Field label="Last name">
            <input name="last_name" defaultValue={patient.last_name} className={inputClass} required />
          </Field>
          <Field label="Birth date">
            <input name="birth_date" type="date" defaultValue={patient.birth_date ?? ""} className={inputClass} />
          </Field>
          <Field label="Sex">
            <select name="sex" defaultValue={patient.sex ?? ""} className={inputClass}>
              <option value="">Not set</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </Field>
          <Field label="Patient number">
            <input value={patient.patient_number} className={inputClass} readOnly />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Contact and emergency</h2>
          <p className="mt-1 text-sm text-slate-500">Keep the clinic contact information current.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Email">
            <input name="email" type="email" defaultValue={patient.email ?? ""} className={inputClass} />
          </Field>
          <Field label="Phone">
            <input name="phone" defaultValue={patient.phone ?? ""} className={inputClass} />
          </Field>
          <Field label="Street address">
            <input name="address_line" defaultValue={profile?.address_line ?? patient.address ?? ""} className={inputClass} />
          </Field>
          <Field label="City">
            <input name="city" defaultValue={profile?.city ?? ""} className={inputClass} />
          </Field>
          <Field label="Province">
            <input name="province" defaultValue={profile?.province ?? ""} className={inputClass} />
          </Field>
          <Field label="Postal code">
            <input name="postal_code" defaultValue={profile?.postal_code ?? ""} className={inputClass} />
          </Field>
          <Field label="Emergency contact">
            <input name="emergency_name" defaultValue={patient.emergency_name ?? ""} className={inputClass} />
          </Field>
          <Field label="Relationship">
            <input name="emergency_relationship" defaultValue={patient.emergency_relationship ?? ""} className={inputClass} />
          </Field>
          <Field label="Emergency phone">
            <input name="emergency_phone" defaultValue={patient.emergency_phone ?? ""} className={inputClass} />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Health profile</h2>
          <p className="mt-1 text-sm text-slate-500">Use commas to separate multiple entries.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Allergies">
            <input name="allergies" defaultValue={patient.allergies ?? ""} className={inputClass} placeholder="Latex, penicillin" />
          </Field>
          <Field label="Medications">
            <input name="medications" defaultValue={listValue(profile?.medications)} className={inputClass} placeholder="Medication names" />
          </Field>
          <Field label="Medical conditions">
            <input
              name="medical_conditions"
              defaultValue={listValue(profile?.medical_conditions)}
              className={inputClass}
              placeholder="Diabetes, asthma"
            />
          </Field>
          <Field label="Dental anxiety score">
            <input
              name="dental_anxiety_score"
              type="number"
              min="1"
              max="5"
              defaultValue={profile?.dental_anxiety_score ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Medical history">
            <textarea name="medical_history" defaultValue={patient.medical_history ?? ""} className={textareaClass} />
          </Field>
          <Field label="Dental history">
            <textarea name="dental_history" defaultValue={patient.dental_history ?? ""} className={textareaClass} />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Detailed profile</h2>
          <p className="mt-1 text-sm text-slate-500">Optional details help the clinic prepare for visits.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Occupation">
            <input name="occupation" defaultValue={profile?.occupation ?? ""} className={inputClass} />
          </Field>
          <Field label="Civil status">
            <input name="civil_status" defaultValue={profile?.civil_status ?? ""} className={inputClass} />
          </Field>
          <Field label="Guardian name">
            <input name="guardian_name" defaultValue={profile?.guardian_name ?? ""} className={inputClass} />
          </Field>
          <Field label="Previous dentist">
            <input name="previous_dentist" defaultValue={profile?.previous_dentist ?? ""} className={inputClass} />
          </Field>
          <Field label="Last dental visit">
            <input name="last_dental_visit" type="date" defaultValue={profile?.last_dental_visit ?? ""} className={inputClass} />
          </Field>
          <Field label="Insurance provider">
            <input name="insurance_provider" defaultValue={profile?.insurance_provider ?? ""} className={inputClass} />
          </Field>
          <Field label="Policy number">
            <input name="insurance_policy_number" defaultValue={profile?.insurance_policy_number ?? ""} className={inputClass} />
          </Field>
          <Field label="Group number">
            <input name="insurance_group_number" defaultValue={profile?.insurance_group_number ?? ""} className={inputClass} />
          </Field>
          <Field label="Policy holder name">
            <input name="insurance_holder_name" defaultValue={profile?.insurance_holder_name ?? ""} className={inputClass} />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Consent preferences</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <input name="consent_treatment" type="checkbox" defaultChecked={profile?.consent_treatment ?? false} className="mt-1" />
            I consent to dental examination and treatment.
          </label>
          <label className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <input name="consent_privacy" type="checkbox" defaultChecked={profile?.consent_privacy ?? false} className="mt-1" />
            I consent to privacy and data processing for clinic records.
          </label>
          <label className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <input name="consent_billing" type="checkbox" defaultChecked={profile?.consent_billing ?? false} className="mt-1" />
            I authorize billing and insurance processing.
          </label>
          <label className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <input name="consent_marketing" type="checkbox" defaultChecked={profile?.consent_marketing ?? false} className="mt-1" />
            I agree to receive optional clinic communications.
          </label>
        </div>
      </section>
    </ActionForm>
  );
}

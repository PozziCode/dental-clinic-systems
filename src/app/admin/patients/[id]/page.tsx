import { notFound } from "next/navigation";
import { DentalChart } from "@/components/shared/DentalChart";
import { ReportExportButtons } from "@/components/shared/ReportExportButtons";
import { getPatient, getPatientAssetSignedUrl, getServices, getTreatments, getXrayImages } from "@/lib/database/queries";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) {
    notFound();
  }

  const profile = Array.isArray(patient.patient_profiles)
    ? patient.patient_profiles[0]
    : patient.patient_profiles;

  const [treatments, files, services, photoUrl, signatureUrl] = await Promise.all([
    getTreatments(patient.id),
    getXrayImages(patient.id),
    getServices({ includeArchived: true }),
    getPatientAssetSignedUrl(patient.profile_photo_url),
    getPatientAssetSignedUrl(profile?.signature_url),
  ]);
  const serviceNames = new Map(services.map((service) => [service.id, service.name]));
  const rows = treatments.map((treatment) => ({
    date: treatment.treated_at,
    treatment: treatment.service_id ? serviceNames.get(treatment.service_id) ?? "Archived service" : "Clinical treatment",
    tooth: treatment.tooth,
    diagnosis: treatment.diagnosis,
    notes: treatment.notes,
    fee: treatment.fee,
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`${patient.first_name} ${patient.last_name}`}
                className="size-20 rounded-xl object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-xl bg-sky-100 text-xl font-bold text-sky-700">
                {patient.first_name.charAt(0)}
                {patient.last_name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-sm text-slate-500">{patient.patient_number}</p>
            </div>
          </div>
          <ReportExportButtons fileName={`patient-${patient.patient_number}`} rows={rows} />
        </div>
        {patient.allergies ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Allergy alert: {patient.allergies}
          </div>
        ) : null}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase text-slate-400">Contact</p>
            <p className="mt-1 text-sm text-slate-700">{patient.email ?? patient.phone ?? "No contact"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-slate-400">Allergies</p>
            <p className="mt-1 text-sm text-slate-700">{patient.allergies ?? "None recorded"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-slate-400">Medical history</p>
            <p className="mt-1 text-sm text-slate-700">{patient.medical_history ?? "None recorded"}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Medical profile</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Medications</p>
              <p className="mt-1 text-slate-700">{profile?.medications?.length ? profile.medications.join(", ") : "None recorded"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Conditions</p>
              <p className="mt-1 text-slate-700">{profile?.medical_conditions?.length ? profile.medical_conditions.join(", ") : "None recorded"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Dental readiness</h2>
          <div className="mt-4 grid gap-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Anxiety score</p>
              <p className="mt-1 text-slate-700">{profile?.dental_anxiety_score ? `${profile.dental_anxiety_score}/5` : "Not recorded"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Previous dentist</p>
              <p className="mt-1 text-slate-700">{profile?.previous_dentist ?? "Not recorded"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Last dental visit</p>
              <p className="mt-1 text-slate-700">{profile?.last_dental_visit ?? "Not recorded"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Insurance & consent</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Insurance</p>
              <p className="mt-1 text-slate-700">{profile?.insurance_provider ?? "Not recorded"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ["Treatment", profile?.consent_treatment],
                ["Privacy", profile?.consent_privacy],
                ["Billing", profile?.consent_billing],
                ["Marketing", profile?.consent_marketing],
              ].map(([label, value]) => (
                <span
                  key={String(label)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    value ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {label}: {value ? "Yes" : "No"}
                </span>
              ))}
            </div>
            {signatureUrl ? (
              <a href={signatureUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-sky-700">
                View signature
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Treatment history</h2>
          <div className="mt-4 divide-y">
            {treatments.map((treatment) => (
              <div key={treatment.id} className="py-4">
                <p className="font-medium">
                  {treatment.service_id ? serviceNames.get(treatment.service_id) ?? "Archived service" : "Clinical treatment"}
                </p>
                <p className="text-sm text-slate-500">Tooth {treatment.tooth ?? "N/A"}</p>
                <p className="text-sm text-slate-500">{treatment.notes ?? treatment.diagnosis ?? "No notes"}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Clinical files</h2>
          <div className="mt-4 divide-y">
            {files.map((file) => (
              <div key={file.id} className="py-4">
                <p className="font-medium">{file.file_name}</p>
                <p className="text-sm text-slate-500">{file.kind}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Dental chart</h2>
        <DentalChart readonly />
      </section>
    </div>
  );
}

import { getSignedClinicalUrl } from "@/features/uploads/actions";
import { requireRole } from "@/lib/auth/guards";
import { getCurrentPatientProfile, getXrayImages } from "@/lib/database/queries";

export default async function PatientXraysPage() {
  const user = await requireRole("patient");
  const patient = await getCurrentPatientProfile(user.profile.id);
  const files = patient ? await getXrayImages(patient.id) : [];
  const signed = await Promise.all(
    files.map(async (file) => ({
      ...file,
      url: await getSignedClinicalUrl(file.path),
    }))
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My x-rays</h1>
        <p className="text-sm text-slate-500">Secure previews expire after 5 minutes.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {signed.map((file) => (
          <a key={file.id} href={file.url} target="_blank" className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="font-semibold text-slate-900">{file.file_name}</p>
            <p className="mt-1 text-sm text-slate-500">{file.kind}</p>
            <p className="mt-4 text-sm font-medium text-sky-700">Open signed file</p>
          </a>
        ))}
      </div>
    </div>
  );
}

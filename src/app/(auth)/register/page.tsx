import { PatientRegisterForm } from "@/features/auth/PatientRegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-6 py-10 font-sans">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Patient Registration
          </h1>
          <p className="mt-3 text-slate-600">
            Create your account and complete your dental patient profile.
          </p>
        </div>
        <div className="rounded-3xl border border-sky-100 bg-white/95 p-6 shadow-xl shadow-sky-100/60 backdrop-blur md:p-8">
          <PatientRegisterForm />
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { LoginForm } from "@/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen bg-linear-to-b from-white to-slate-100 font-sans">
      <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-b from-sky-500 to-cyan-500 px-6 py-10 font-sans">
        <div className="absolute inset-0 bg-[url('/bg-landing.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
            <img
              src="/logo.png"
              alt="Samonte Dental Clinic Logo"
              className="h-5 w-5 rounded-full bg-white p-0.5"
            />
            <span className="text-sm font-medium text-white whitespace-nowrap">
              Dental Clinic Management System
            </span>
          </div>
          <h1 className="text-5xl font-bold leading-tight">
            Secure clinic care starts here
          </h1>
          <p className="mt-6 max-w-md text-sky-50">
            Sign in to manage appointments, records, treatments, and reports.
          </p>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Login to continue to your dental portal.
            </p>
          </div>

          <LoginForm />

          <p className="mt-8 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-sky-600 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

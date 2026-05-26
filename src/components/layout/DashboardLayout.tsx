import Link from "next/link";
import { ReactNode } from "react";
import { Bell, LogOut, Menu } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
import { getCurrentUser } from "@/lib/auth/guards";

type DashboardLayoutProps = {
  children: ReactNode;
  role: "admin" | "dentist" | "patient";
};

const links = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Patients", href: "/admin/patients" },
    { label: "Appointments", href: "/admin/appointments" },
    { label: "Treatments", href: "/admin/treatments" },
    { label: "Users", href: "/admin/users" },
    { label: "Branches", href: "/admin/branches" },
    { label: "Reports", href: "/admin/reports" },
    { label: "Settings", href: "/admin/settings" },
  ],
  dentist: [
    { label: "Dashboard", href: "/dentist/dashboard" },
    { label: "Appointments", href: "/dentist/appointments" },
    { label: "Patients", href: "/dentist/patients" },
    { label: "Treatments", href: "/dentist/treatments" },
    { label: "Charts", href: "/dentist/charts" },
    { label: "X-rays", href: "/dentist/x-rays" },
  ],
  patient: [
    { label: "Dashboard", href: "/patient/dashboard" },
    { label: "Appointments", href: "/patient/appointments" },
    { label: "Profile", href: "/patient/profile" },
    { label: "Treatments", href: "/patient/treatments" },
    { label: "Records", href: "/patient/records" },
    { label: "X-rays", href: "/patient/x-rays" },
    { label: "My Chart", href: "/patient/chart" },
  ],
};

export default async function DashboardLayout({
  children,
  role,
}: DashboardLayoutProps) {
  const user = await getCurrentUser();
  const name = user?.profile.full_name ?? "Clinic User";

  return (
    <main className="flex min-h-screen bg-slate-100 font-sans">
      <aside className="hidden w-72 flex-col border-r bg-white lg:flex">
        <div className="border-b px-8 py-6">
          <h1 className="text-xl font-bold text-sky-600">
            Dental Clinic Management System
          </h1>
          <p className="mt-1 text-sm capitalize text-slate-500">
            {role} Portal
          </p>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {links[role].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t p-4">
          <form action={logoutAction}>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {role.charAt(0).toUpperCase() + role.slice(1)} Portal
            </h2>
            <p className="text-sm text-slate-500">
              Live clinic operations and secure patient records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="rounded-full bg-slate-100 p-3 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
            <button className="rounded-full bg-slate-100 p-3" aria-label="Notifications">
              <Bell className="h-5 w-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 font-semibold text-white">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{name}</p>
                <p className="text-xs capitalize text-slate-500">{role}</p>
              </div>
            </div>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b bg-white px-4 py-3 lg:hidden">
          {links[role].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <section className="flex-1 p-4 md:p-6">{children}</section>
      </div>
    </main>
  );
}

import Link from "next/link";
import { Clock, LogIn, Star, UserPlus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/guards";
import { getFeaturedServices } from "@/lib/database/queries";

export default async function ServicesPage() {
  const [services, user] = await Promise.all([getFeaturedServices(24), getCurrentUser()]);
  const isPatient = user?.profile.role === "patient";

  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-medium text-sky-700">Back home</Link>
        <h1 className="mt-6 text-4xl font-bold text-slate-900">Services</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Samonte Dental Clinic provides core dental services with secure digital records.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {services.map((service) => (
            <div key={service.id} className="rounded-lg border bg-sky-50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-white text-sm font-bold text-sky-700">
                  {service.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={service.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    service.icon ?? service.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                {service.is_popular ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                    <Star className="h-3 w-3" />
                    Popular
                  </span>
                ) : null}
              </div>
              <h2 className="mt-4 font-semibold text-slate-900">{service.name}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                {service.description ?? "Book online through your patient account."}
              </p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <Clock className="h-4 w-4" />
                  {service.duration_mins} mins
                </span>
                <span className="font-semibold text-slate-900">
                  PHP {Number(service.base_price).toLocaleString()}
                </span>
              </div>
              {service.is_featured ? (
                <span className="mt-3 inline-block rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700">
                  Featured
                </span>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-2">
                {isPatient ? (
                  <Link
                    href={`/patient/appointments?serviceId=${service.id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
                  >
                    <Clock className="h-4 w-4" />
                    Book through patient portal
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
                    >
                      <LogIn className="h-4 w-4" />
                      Login to book
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-50"
                    >
                      <UserPlus className="h-4 w-4" />
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

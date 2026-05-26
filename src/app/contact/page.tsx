import Link from "next/link";
import { Mail, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-medium text-sky-700">Back home</Link>
        <h1 className="mt-6 text-4xl font-bold text-slate-900">Contact</h1>
        <p className="mt-3 text-slate-600">Reach Samonte Dental Clinic for appointments and support.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <a className="rounded-2xl border bg-sky-50 p-6" href="mailto:samontedentalclinic@gmail.com">
            <Mail className="h-6 w-6 text-sky-700" />
            <p className="mt-4 font-semibold">samontedentalclinic@gmail.com</p>
          </a>
          <div className="rounded-2xl border bg-sky-50 p-6">
            <MapPin className="h-6 w-6 text-sky-700" />
            <p className="mt-4 font-semibold">Zarraga, Iloilo, Philippines</p>
          </div>
        </div>
      </div>
    </main>
  );
}

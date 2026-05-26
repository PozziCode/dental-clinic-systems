import Link from "next/link";
import { MapPin, Mail } from "lucide-react";
import { Clock3 } from "lucide-react";
export default function Home() {
  return (
    <main className="absolute inset-0 bg-cover bg-center font-sans"
    style={{
    backgroundImage: "url('/bg-landing.jpg')",
  }}>

      {/* NAVBAR */}
      <header className="flex items-center justify-between px-8 py-5 border-b bg-white/70 backdrop-blur">
        <h1 className="text-medium font-bold ml-8 tracking-tight text-blue-600 
        " >
          <img src="/logo.png" alt="logo" className="w-10 h-10 inline mr-2" />
          Samonte Dental Clinic
        </h1>

        <nav className="flex gap-6  mr-9 text-sm text-slate-600">
          <a href="#home" className="hover:text-blue-600 transition">Home</a>
          <a href="#services" className="hover:text-blue-600 transition">Services</a>
          <a href="#about" className="hover:text-blue-600 transition">About</a>
          <a href="#contact" className="hover:text-blue-600 transition">Contact</a>
        </nav>
          <nav>
            <Link href="/login" className="text-white font-medium mr-8 border rounded-full px-7 py-2 bg-blue-600">
            Login
          </Link>
            </nav>
      </header>

     {/* HERO */}
      <section
        id="home"
        className="flex flex-col items-center justify-center text-center mt-16 px-6 py-28"
      >
        
        <div className="max-w-3xl space-y-6">
          
          <h2 className="text-5xl font-bold tracking-tight leading-tight">
            Manage Your Dental Clinic,
            <span className="text-blue-600"> Effortlessly</span>
          </h2>

          <p className="text-slate-600 text-lg leading-relaxed">
            Samonte Dental Clinic provides patient records, appointment booking,
            billing, and dental chart management — all in one modern system
            designed for clinics. With BrightSmile, dental care becomes simpler,
            faster, and more convenient, so you can focus on what matters most:
            your patients’ smiles.
          </p>

          <div className="flex justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="px-10 py-3 rounded-full bg-blue-600 text-white shadow-lg hover:shadow-xl transition"
            >
              Book an Appointment
            </Link>
          </div>

        </div>
      </section>

            {/* FEATURES */}
      <section id="services" className="px-6 py-20 max-w-6xl mx-auto">

        <div className="text-center mb-14">
          <span className="text-xs bg-blue-200 text-blue-700 px-3 py-1 rounded-full">
            Clinic System Features
          </span>

          <h3 className="text-3xl md:text-4xl font-bold mt-4">
            Everything Your Clinic Needs
          </h3>

          <p className="text-slate-600 mt-4 max-w-2xl mx-auto">
            A complete system designed to simplify patient care, scheduling, and secure record management for modern dental clinics.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {/* SYSTEM FEATURES */}
          {[
            {
              title: "Digital Patient Information",
              desc: "Collect, store, retrieve, and update patient personal details and medical history electronically.",
            },
            {
              title: "Smart Scheduling",
              desc: "Avoid double booking with real-time appointment availability.",
            },
            {
              title: "Secure Records",
              desc: "Encrypted medical data with controlled access for dentists and patients.",
            },

            {
              title: "Trusted Dental Care",
              desc: "We provide safe, reliable, and high-quality dental treatments for patients of all ages.",
            },
            {
              title: "Modern Technology",
              desc: "Our clinic uses updated dental tools and a modern system for faster and more accurate service.",
            },
            {
              title: "Patient-Focused Service",
              desc: "We prioritize comfort, convenience, and a stress-free experience for every patient.",
            },
          ].map((item, i) => (
           <div
              key={i}
              className="p-6 rounded-2xl bg-blue-100 border border-blue-200 shadow-sm transition duration-300">
              <h4 className="font-semibold text-lg text-slate-800">
                {item.title}
              </h4>

              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}

        </div>
      </section>

          {/* CTA SECTION */}
      <section className="py-24 text-center bg-blue-100">
        <div className="max-w-3xl mx-auto space-y-6 px-6">

          <h3 className="text-4xl font-bold text-slate-800">
            Ready to take care of your smile?
          </h3>

          <p className="text-slate-600">
           Book an appointment at Samonte Dental Clinic and experience comfortable, modern, and stress-free dental care you can trust.
          </p>

          <Link
            href="/register"
            className="inline-block px-10 py-3 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition"
          >
            Get Started
          </Link>

        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-white px-6 py-20 border-t"
      >
  <div className="max-w-4xl mx-auto text-center space-y-6" 
  >
    

    <h3 className="text-4xl font-bold text-slate-800">
      About Samonte Dental Clinic
    </h3>

    <p className="text-lg text-slate-600 leading-relaxed">
      Samonte Dental Clinic is committed to providing high-quality,
      patient-centered dental care through modern technology and
      efficient clinic management. Our system is designed to simplify
      appointments, organize patient records securely, and improve the
      overall experience for both patients and dental professionals.
    </p>

    <p className="text-lg text-slate-600 leading-relaxed">
      With a focus on convenience, security, and reliability, the clinic
      management system helps streamline daily operations while ensuring
      accurate and accessible dental information. From appointment  
      scheduling to patient record management, everything is built to
      support a smoother and smarter dental care experience.
    </p>

  </div>
</section>

      {/* CONTACT */}
<section id="contact" className="bg-slate-50 px-6 py-20 border-t">
  <div className="max-w-4xl mx-auto text-center space-y-6">
    
    <h3 className="text-3xl font-bold">
      Contact Us
    </h3>

    <p className="text-slate-600">
      We&apos;d love to hear from you. Reach out for appointments,
      inquiries, or clinic support.
    </p>

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

 {/* Location */}
  <a
    href="https://www.google.com/maps/place/Zarraga+Town+Plaza/@10.8228668,122.6032489,16z/data=!4m10!1m2!2m1!1sZarraga+Plaza!3m6!1s0x33aee3007dbaac21:0x67a0b46e74d563f!8m2!3d10.822361!4d122.6096724!15sCg1aYXJyYWdhIFBsYXphkgEEcGFya-ABAA!16s%2Fg%2F11y3jjrypp?entry=ttu&g_ep=EgoyMDI2MDUxMC4wIKXMDSoASAFQAw%3D%3D"
    target="_blank"
    rel="noopener noreferrer"
    className="aspect-square w-40 mx-auto md:w-full border bg-blue-50 p-4 shadow-sm text-center rounded-md flex flex-col items-center justify-center gap-2 transition hover:bg-blue-100"
  >
    <MapPin className="w-6 h-6 text-blue-600" />

    <p className="font-semibold text-slate-800">
      Location
    </p>

    <p className="text-sm text-slate-700 text-center">
      Zarraga, Iloilo Philippines
    </p>
  </a>

      {/* WORK HOURS */}
    <div className="aspect-square w-40 mx-auto md:w-full border bg-blue-50 p-4 shadow-sm text-center rounded-md flex flex-col items-center justify-center gap-2">

      <Clock3 className="w-6 h-6 text-blue-600" />

      <p className="font-semibold text-slate-800">
        Work Hours
      </p>

      <p className="text-sm text-slate-700 text-center">
        Mon - Sat<br />
        9:00 AM - 5:00 PM
      </p>

    </div>

  {/* Email */}
  <a
    href="https://mail.google.com/mail/?view=cm&fs=1&to=samontedentalclinic@gmail.com"
    target="_blank"
    rel="noopener noreferrer"
    className="aspect-square w-40 mx-auto md:w-full border bg-blue-50 p-4 shadow-sm text-center rounded-md flex flex-col items-center justify-center gap-2 transition hover:bg-blue-100"
  >
    <Mail className="w-6 h-6 text-blue-600" />

    <p className="font-semibold text-slate-800">
      Email
    </p>

    <p className="text-sm text-slate-700 text-center wrap-break-words">
      samontedentalclinic@gmail.com
    </p>
  </a>

</div>

  </div>
</section>

     {/* FOOTER */}
<footer className="border-t bg-blue-100">
  <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">

    {/* Left text */}
    <p className="text-sm text-slate-500">
      © {new Date().getFullYear()} Samonte Dental Clinic
    </p>

    {/* Navigation links */}
    <div className="flex gap-6 text-sm text-slate-600">
      <a href="#home" className="hover:text-blue-600 transition">Home</a>
      <a href="#services" className="hover:text-blue-600 transition">Services</a>
      <a href="#about" className="hover:text-blue-600 transition">About</a>
    </div>

  </div>
</footer>

    </main>
  );
}

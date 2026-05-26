import type { Metadata } from "next";
import { PageTransition } from "@/components/shared/PageTransition";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dental Clinic Management System",
  description: "Secure dental clinic operations platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}

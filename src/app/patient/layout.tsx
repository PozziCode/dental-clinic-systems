import { ReactNode } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { requireRole } from "@/lib/auth/guards";

export default async function PatientLayout({ children }: { children: ReactNode }) {
  await requireRole("patient");
  return <DashboardLayout role="patient">{children}</DashboardLayout>;
}

import { ReactNode } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { requireRole } from "@/lib/auth/guards";

export default async function DentistLayout({ children }: { children: ReactNode }) {
  await requireRole("dentist");
  return <DashboardLayout role="dentist">{children}</DashboardLayout>;
}

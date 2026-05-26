import { ReactNode } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { requireRole } from "@/lib/auth/guards";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole("admin");
  return <DashboardLayout role="admin">{children}</DashboardLayout>;
}

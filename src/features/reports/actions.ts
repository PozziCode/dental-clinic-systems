"use server";

import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export async function getAdminReportData() {
  await requireRole("admin");
  const supabase = await createClient();

  const [patients, appointments, treatments, branches, services, dentists] = await Promise.all([
    supabase.from("patients").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("appointments").select("id,status,starts_at,branch_id,service_id").is("deleted_at", null),
    supabase.from("treatments").select("id,fee,status,treated_at,branch_id,dentist_id,service_id").is("deleted_at", null),
    supabase.from("branches").select("id,name").is("deleted_at", null),
    supabase.from("services").select("id,name,category").is("archived_at", null),
    supabase.from("users").select("id,full_name").eq("role", "dentist").is("deleted_at", null),
  ]);

  const revenue = (treatments.data ?? []).reduce(
    (sum, row) => sum + Number(row.fee ?? 0),
    0
  );

  const serviceNames = new Map((services.data ?? []).map((service) => [service.id, service.name]));
  const branchNames = new Map((branches.data ?? []).map((branch) => [branch.id, branch.name]));
  const dentistNames = new Map((dentists.data ?? []).map((dentist) => [dentist.id, dentist.full_name]));
  const serviceStats = new Map<string, { name: string; booked: number; completed: number; revenue: number }>();
  const branchStats = new Map<string, { name: string; booked: number; completed: number; revenue: number }>();
  const dentistStats = new Map<string, { name: string; completed: number; revenue: number }>();

  for (const appointment of appointments.data ?? []) {
    if (!appointment.service_id) continue;
    const current = serviceStats.get(appointment.service_id) ?? {
      name: serviceNames.get(appointment.service_id) ?? "Unknown service",
      booked: 0,
      completed: 0,
      revenue: 0,
    };
    current.booked += 1;
    serviceStats.set(appointment.service_id, current);
  }

  for (const treatment of treatments.data ?? []) {
    const fee = Number(treatment.fee ?? 0);
    if (treatment.service_id) {
      const current = serviceStats.get(treatment.service_id) ?? {
        name: serviceNames.get(treatment.service_id) ?? "Unknown service",
        booked: 0,
        completed: 0,
        revenue: 0,
      };
      if (treatment.status === "completed") current.completed += 1;
      current.revenue += fee;
      serviceStats.set(treatment.service_id, current);
    }

    const branchCurrent = branchStats.get(treatment.branch_id) ?? {
      name: branchNames.get(treatment.branch_id) ?? "Unknown branch",
      booked: 0,
      completed: 0,
      revenue: 0,
    };
    if (treatment.status === "completed") branchCurrent.completed += 1;
    branchCurrent.revenue += fee;
    branchStats.set(treatment.branch_id, branchCurrent);

    if (treatment.dentist_id) {
      const dentistCurrent = dentistStats.get(treatment.dentist_id) ?? {
        name: dentistNames.get(treatment.dentist_id) ?? "Unknown dentist",
        completed: 0,
        revenue: 0,
      };
      if (treatment.status === "completed") dentistCurrent.completed += 1;
      dentistCurrent.revenue += fee;
      dentistStats.set(treatment.dentist_id, dentistCurrent);
    }
  }

  for (const appointment of appointments.data ?? []) {
    const current = branchStats.get(appointment.branch_id) ?? {
      name: branchNames.get(appointment.branch_id) ?? "Unknown branch",
      booked: 0,
      completed: 0,
      revenue: 0,
    };
    current.booked += 1;
    branchStats.set(appointment.branch_id, current);
  }

  return {
    patientCount: patients.count ?? 0,
    appointmentCount: appointments.data?.length ?? 0,
    treatmentCount: treatments.data?.length ?? 0,
    serviceCount: services.data?.length ?? 0,
    revenue,
    branches: branches.data ?? [],
    appointments: appointments.data ?? [],
    treatments: treatments.data ?? [],
    services: services.data ?? [],
    mostBookedServices: Array.from(serviceStats.values()).sort((a, b) => b.booked - a.booked).slice(0, 5),
    highestRevenueServices: Array.from(serviceStats.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    branchTreatmentPerformance: Array.from(branchStats.values()).sort((a, b) => b.revenue - a.revenue),
    dentistTreatmentStatistics: Array.from(dentistStats.values()).sort((a, b) => b.completed - a.completed),
  };
}

export async function createRestockReportAction(formData: FormData) {
  const user = await requireRole("admin");
  const branchId = String(formData.get("branch_id") ?? "") || null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("generate_restock_data", {
    target_branch: branchId,
  });

  const { error } = await supabase.from("restock_reports").insert({
    branch_id: branchId,
    title: "Restock Recommendation",
    generated_by: user.profile.id,
    report_data: data ?? [],
  });

  if (error) throw new Error(error.message);
}

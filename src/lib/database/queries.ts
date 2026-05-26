import { createClient } from "@/lib/supabase/server";
import { throwSupabaseError } from "@/lib/supabase/errors";
import type {
  Appointment,
  AppointmentWithRelations,
  Branch,
  ClinicUser,
  DentistAvailability,
  DentistScheduleBlock,
  InventoryItem,
  Patient,
  PatientWithProfile,
  Procedure,
  Service,
  ServiceWithRelations,
  Treatment,
  XrayImage,
} from "@/lib/database.types";

export async function getBranches() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .is("deleted_at", null)
    .order("name");

  if (error) throwSupabaseError(error);
  return (data ?? []) as Branch[];
}

export async function getUsers(role?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("users")
    .select("*")
    .is("deleted_at", null)
    .order("full_name");

  if (role) {
    query = query.eq("role", role);
  }

  const { data, error } = await query;
  if (error) throwSupabaseError(error);
  return (data ?? []) as ClinicUser[];
}

export async function getPatients() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throwSupabaseError(error);
  return (data ?? []) as Patient[];
}

export async function getPatient(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*, patient_profiles(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throwSupabaseError(error);
  return data as PatientWithProfile | null;
}

export async function getPatientAssetSignedUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("patient-assets")
    .createSignedUrl(path, 60 * 60);

  if (error) return null;
  return data.signedUrl;
}

export async function getCurrentPatientProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throwSupabaseError(error);
  return data as Patient | null;
}

export async function getCurrentPatientWithProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*, patient_profiles(*)")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throwSupabaseError(error);
  return data as PatientWithProfile | null;
}

export async function getAppointments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .is("deleted_at", null)
    .order("starts_at");

  if (error) throwSupabaseError(error);
  return (data ?? []) as Appointment[];
}

export async function getAppointmentsWithRelations(patientId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select(
      "*, patients(id, first_name, last_name, patient_number, phone, email), branches(id, name, code, address), services(id, name, duration_mins, base_price), dentist:users!appointments_dentist_id_fkey(id, full_name, email, phone)"
    )
    .is("deleted_at", null)
    .order("starts_at");

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  const { data, error } = await query;
  if (error) throwSupabaseError(error);
  return (data ?? []) as AppointmentWithRelations[];
}

export async function getServices({ includeArchived = false } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("services")
    .select("*, service_branch_settings(*), service_inventory_items(*)")
    .order("name");

  if (!includeArchived) {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;
  if (error) throwSupabaseError(error);
  return (data ?? []) as ServiceWithRelations[];
}

export async function getServiceCategories() {
  const services = await getServices();
  return Array.from(new Set(services.map((service) => service.category))).sort();
}

export async function getServicesForBranch(branchId?: string | null) {
  const supabase = await createClient();
  let query = supabase
    .from("services")
    .select("*, service_branch_settings(*)")
    .eq("is_active", true)
    .is("archived_at", null)
    .order("is_popular", { ascending: false })
    .order("name", { ascending: true });

  if (branchId) {
    query = query.eq("service_branch_settings.branch_id", branchId).eq("service_branch_settings.is_available", true);
  }

  const { data, error } = await query;
  if (error) throwSupabaseError(error);

  return ((data ?? []) as ServiceWithRelations[]).filter((service) => {
    if (!branchId) return true;
    return (service.service_branch_settings ?? []).some(
      (setting) => setting.branch_id === branchId && setting.is_available
    );
  }) as ServiceWithRelations[];
}

export async function getDentistsForBranch(branchId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_branch_assignments")
    .select("users(id, role, full_name, email, phone, avatar_url, is_active, created_at, updated_at, deleted_at)")
    .eq("branch_id", branchId);

  if (error) throwSupabaseError(error);

  return (data ?? [])
    .map((row) => (Array.isArray(row.users) ? row.users[0] : row.users))
    .filter((user): user is ClinicUser => Boolean(user) && user.role === "dentist" && user.is_active && !user.deleted_at)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export async function getDentistAvailabilityForBranch(branchId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dentist_availability")
    .select("*")
    .eq("branch_id", branchId)
    .eq("is_active", true)
    .order("weekday")
    .order("start_time");

  if (error) throwSupabaseError(error);
  return (data ?? []) as DentistAvailability[];
}

export async function getDentistScheduleBlocksForBranch(branchId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dentist_schedule_blocks")
    .select("*")
    .eq("branch_id", branchId)
    .gte("ends_at", new Date().toISOString())
    .order("starts_at");

  if (error) throwSupabaseError(error);
  return (data ?? []) as DentistScheduleBlock[];
}

export async function getFeaturedServices(limit = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .is("archived_at", null)
    .order("is_featured", { ascending: false })
    .order("is_popular", { ascending: false })
    .order("name")
    .limit(limit);

  if (error) throwSupabaseError(error);
  return (data ?? []) as Service[];
}

export async function getTreatments(patientId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("treatments")
    .select("*")
    .is("deleted_at", null)
    .order("treated_at", { ascending: false });

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  const { data, error } = await query;
  if (error) throwSupabaseError(error);
  return (data ?? []) as Treatment[];
}

export async function getProcedures() {

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procedures")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throwSupabaseError(error);
  return (data ?? []) as Procedure[];
}

export async function getInventoryItems() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .is("deleted_at", null)
    .order("name");

  if (error) throwSupabaseError(error);
  return (data ?? []) as InventoryItem[];
}

export async function getXrayImages(patientId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("xray_images")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  const { data, error } = await query;
  if (error) throwSupabaseError(error);
  return (data ?? []) as XrayImage[];
}

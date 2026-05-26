"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dashboardForRole, requireRole, requireUser } from "@/lib/auth/guards";
import { loginSchema, patientRegistrationSchema } from "@/lib/validators/clinic";
import type { UserRole } from "@/lib/database.types";

function rolePath(role: unknown) {
  const value = typeof role === "string" ? role.toLowerCase() : "patient";
  if (value === "admin" || value === "dentist" || value === "patient") {
    return dashboardForRole(value as UserRole);
  }
  return "/patient/dashboard";
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

function listValues(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .map((value) => String(value).trim())
    .filter(Boolean);
}

async function cleanupFailedRegistration({
  admin,
  userId,
  patientId,
}: {
  admin: ReturnType<typeof createAdminClient>;
  userId?: string;
  patientId?: string;
}) {
  if (patientId) {
    await admin.from("patients").delete().eq("id", patientId);
  }
  if (userId) {
    await admin.auth.admin.deleteUser(userId);
  }
}

export async function loginAction(_: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid login." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  revalidatePath("/", "layout");
  redirect(rolePath(profile?.role));
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function registerPatientAction(_: unknown, formData: FormData) {
  const parsed = patientRegistrationSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName"),
    lastName: formData.get("lastName"),
    birthDate: formData.get("birthDate"),
    sex: formData.get("sex"),
    occupation: formData.get("occupation"),
    civil_status: formData.get("civil_status"),
    guardian_name: formData.get("guardian_name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    address_line: formData.get("address_line"),
    city: formData.get("city"),
    province: formData.get("province"),
    postal_code: formData.get("postal_code"),
    emergencyName: formData.get("emergencyName"),
    emergencyRelationship: formData.get("emergencyRelationship"),
    emergencyContact: formData.get("emergencyContact"),
    allergies: listValues(formData, "allergies"),
    medications: listValues(formData, "medications"),
    medical_conditions: listValues(formData, "medical_conditions"),
    medicalHistory: formData.get("medicalHistory"),
    dentalHistory: formData.get("dentalHistory"),
    previous_dentist: formData.get("previous_dentist"),
    last_dental_visit: formData.get("last_dental_visit"),
    dental_anxiety_score: formData.get("dental_anxiety_score"),
    consent_treatment: checked(formData, "consent_treatment"),
    consent_privacy: checked(formData, "consent_privacy"),
    consent_billing: checked(formData, "consent_billing"),
    consent_marketing: checked(formData, "consent_marketing"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid registration." };
  }

  let admin;

  try {
    admin = createAdminClient();
  } catch {
    return {
      error:
        "SUPABASE_SERVICE_ROLE_KEY is required before patient accounts can be created.",
    };
  }

  const { data: branch, error: branchError } = await admin
    .from("branches")
    .select("id")
    .is("deleted_at", null)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (branchError) {
    return { error: branchError.message };
  }

  if (!branch) {
    return { error: "Clinic branch is not configured." };
  }

  const fullName = [
    parsed.data.firstName,
    parsed.data.middleName,
    parsed.data.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      role: "patient",
      full_name: fullName,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user?.id) {
    const { error: userError } = await admin.from("users").upsert({
      id: data.user.id,
      role: "patient",
      full_name: fullName,
      email: parsed.data.email,
    });

    if (userError) {
      await cleanupFailedRegistration({ admin, userId: data.user.id });
      return { error: userError.message };
    }

    const patientNumber = `P-${Date.now()}`;
    const allergiesText = parsed.data.allergies.join(", ");
    const { data: patient, error: patientError } = await admin.from("patients").insert({
      user_id: data.user.id,
      branch_id: branch.id,
      patient_number: patientNumber,
      first_name: parsed.data.firstName,
      middle_name: parsed.data.middleName || null,
      last_name: parsed.data.lastName,
      birth_date: parsed.data.birthDate || null,
      sex: parsed.data.sex || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email,
      address: parsed.data.address || parsed.data.address_line || null,
      emergency_name: parsed.data.emergencyName || null,
      emergency_relationship: parsed.data.emergencyRelationship || null,
      emergency_phone: parsed.data.emergencyContact || null,
      allergies: allergiesText || null,
      medical_history: parsed.data.medicalHistory || null,
      dental_history: parsed.data.dentalHistory || null,
    }).select("id, patient_number").single();

    if (patientError) {
      await cleanupFailedRegistration({ admin, userId: data.user.id });
      return { error: patientError.message };
    }

    const patientId = patient.id;

    const anxietyScore =
      typeof parsed.data.dental_anxiety_score === "number"
        ? parsed.data.dental_anxiety_score
        : null;
    const { error: profileError } = await admin.from("patient_profiles").upsert(
      {
        patient_id: patientId,
        occupation: parsed.data.occupation || null,
        civil_status: parsed.data.civil_status || null,
        guardian_name: parsed.data.guardian_name || null,
        address_line: parsed.data.address_line || parsed.data.address || null,
        city: parsed.data.city || null,
        province: parsed.data.province || null,
        postal_code: parsed.data.postal_code || null,
        medications: parsed.data.medications,
        medical_conditions: parsed.data.medical_conditions,
        previous_dentist: parsed.data.previous_dentist || null,
        last_dental_visit: parsed.data.last_dental_visit || null,
        dental_anxiety_score: anxietyScore,
        consent_treatment: parsed.data.consent_treatment,
        consent_privacy: parsed.data.consent_privacy,
        consent_billing: parsed.data.consent_billing,
        consent_marketing: parsed.data.consent_marketing,
        consent_signed_at: new Date().toISOString(),
      },
      { onConflict: "patient_id" }
    );

    if (profileError) {
      await cleanupFailedRegistration({ admin, userId: data.user.id, patientId });
      return { error: profileError.message };
    }

    return {
      success: "Account created. You can log in now.",
      patientId,
      patientNumber: patient.patient_number,
      allergyAlert: parsed.data.allergies.length > 0,
    };
  }

  return { success: "Account created. You can log in now." };
}

export async function forgotPasswordAction(_: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Enter your email." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password reset link sent." };
}

export async function updatePasswordAction(_: unknown, formData: FormData) {
  await requireUser();
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    return { error: "Use at least 8 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password updated." };
}

export async function createDentistAction(_: unknown, formData: FormData) {
  await requireRole("admin");

  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const branchId = String(formData.get("branch_id") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !fullName || !branchId || password.length < 8) {
    return { error: "Email, name, branch, and an 8+ character password are required." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "dentist",
      full_name: fullName,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await admin.from("users").upsert({
      id: data.user.id,
      role: "dentist",
      full_name: fullName,
      email,
    });
    await admin.from("user_branch_assignments").upsert({
      user_id: data.user.id,
      branch_id: branchId,
    });
  }

  revalidatePath("/admin/users");
  return { success: "Dentist account created. They can log in with this email and password." };
}

export async function updateUserAction(_: unknown, formData: FormData) {
  await requireRole("admin");

  const id = String(formData.get("id") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const isActive = formData.get("is_active") === "on";

  if (!id || !email || !fullName) {
    return { error: "Name and email are required." };
  }

  if (role !== "admin" && role !== "dentist" && role !== "patient") {
    return { error: "Choose a valid role." };
  }

  const admin = createAdminClient();
  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    email,
    email_confirm: true,
    user_metadata: {
      role,
      full_name: fullName,
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  const { error } = await admin
    .from("users")
    .update({
      email,
      full_name: fullName,
      role,
      is_active: isActive,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: "User updated." };
}

export async function archiveUserAction(formData: FormData) {
  const user = await requireRole("admin");
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("User is required.");
  }

  if (id === user.profile.id) {
    throw new Error("You cannot delete your own admin account.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await admin.auth.admin.updateUserById(id, {
    ban_duration: "876000h",
  });

  revalidatePath("/admin/users");
}

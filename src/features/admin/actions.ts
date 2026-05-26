"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  appointmentSchema,
  branchSchema,
  inventoryItemSchema,
  patientBookingSchema,
  patientProfileUpdateSchema,
  patientSchema,
  serviceSchema,
  treatmentSchema,
} from "@/lib/validators/clinic";

function nullable(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
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

function commaValues(formData: FormData, name: string) {
  return String(formData.get(name) ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function numberOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? Number(text) : null;
}

function manilaIso(date: string, time: string) {
  return `${date}T${time}:00+08:00`;
}

function timeToMinutes(value: string) {
  const [hour = "0", minute = "0"] = value.split(":");
  return Number(hour) * 60 + Number(minute);
}

function dateWeekday(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function addMinutesIso(value: string, minutes: number) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

function bookingReference(date: string) {
  const compactDate = date.replaceAll("-", "");
  const suffix = crypto.randomUUID().slice(0, 4).toUpperCase();
  return `SDC-${compactDate}-${suffix}`;
}

async function uploadPatientAsset(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: FormDataEntryValue | null,
  folder: string
) {
  if (!(file instanceof File) || file.size === 0) return null;

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("patient-assets").upload(path, file, {
    contentType: file.type || "image/png",
    upsert: false,
  });

  if (error) throw new Error(error.message);
  return path;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function saveBranchAction(_: unknown, formData: FormData) {
  await requireRole("admin");
  const parsed = branchSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid branch." };
  }

  const supabase = await createClient();
  const payload = {
    name: parsed.data.name,
    code: parsed.data.code.toUpperCase(),
    address: parsed.data.address,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
  };

  const { error } = parsed.data.id
    ? await supabase.from("branches").update(payload).eq("id", parsed.data.id)
    : await supabase.from("branches").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/admin/branches");
  return { success: "Branch saved." };
}

export async function archiveBranchAction(formData: FormData) {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("branches")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/branches");
}

export async function savePatientAction(_: unknown, formData: FormData) {
  await requireUser();
  const parsed = patientSchema.safeParse({
    ...Object.fromEntries(formData),
    id: String(formData.get("id") ?? "") || undefined,
    allergies: listValues(formData, "allergies"),
    medications: listValues(formData, "medications"),
    medical_conditions: listValues(formData, "medical_conditions"),
    consent_treatment: checked(formData, "consent_treatment"),
    consent_privacy: checked(formData, "consent_privacy"),
    consent_billing: checked(formData, "consent_billing"),
    consent_marketing: checked(formData, "consent_marketing"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid patient." };
  }

  const supabase = await createClient();
  const patientNumber = `P-${Date.now()}`;
  let profilePhotoPath: string | null = null;
  let signaturePath: string | null = null;

  try {
    profilePhotoPath = await uploadPatientAsset(supabase, formData.get("profile_photo"), "profile-photos");
    signaturePath = await uploadPatientAsset(supabase, formData.get("signature_file"), "signatures");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to upload patient asset." };
  }

  const allergiesText = parsed.data.allergies.join(", ");
  const payload = {
    branch_id: parsed.data.branch_id,
    assigned_dentist_id: parsed.data.assigned_dentist_id || null,
    first_name: parsed.data.first_name,
    middle_name: parsed.data.middle_name || null,
    last_name: parsed.data.last_name,
    birth_date: parsed.data.birth_date || null,
    sex: parsed.data.sex || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    emergency_name: parsed.data.emergency_name || null,
    emergency_relationship: parsed.data.emergency_relationship || null,
    emergency_phone: parsed.data.emergency_phone || null,
    allergies: allergiesText || null,
    medical_history: parsed.data.medical_history || null,
    dental_history: parsed.data.dental_history || null,
    notes: parsed.data.notes || null,
    ...(profilePhotoPath ? { profile_photo_url: profilePhotoPath } : {}),
  };

  const patientResult = parsed.data.id
    ? await supabase
        .from("patients")
        .update(payload)
        .eq("id", parsed.data.id)
        .select("id, patient_number")
        .single()
    : await supabase
        .from("patients")
        .insert({ ...payload, patient_number: patientNumber })
        .select("id, patient_number")
        .single();

  if (patientResult.error) return { error: patientResult.error.message };

  const patientId = patientResult.data.id;
  const anxietyScore =
    typeof parsed.data.dental_anxiety_score === "number"
      ? parsed.data.dental_anxiety_score
      : null;
  const profilePayload = {
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
    insurance_provider: parsed.data.insurance_provider || null,
    insurance_policy_number: parsed.data.insurance_policy_number || null,
    insurance_group_number: parsed.data.insurance_group_number || null,
    insurance_holder_name: parsed.data.insurance_holder_name || null,
    consent_treatment: parsed.data.consent_treatment,
    consent_privacy: parsed.data.consent_privacy,
    consent_billing: parsed.data.consent_billing,
    consent_marketing: parsed.data.consent_marketing,
    signature_name: parsed.data.signature_name || null,
    ...(signaturePath ? { signature_url: signaturePath } : {}),
    consent_signed_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from("patient_profiles")
    .upsert(profilePayload, { onConflict: "patient_id" });

  if (profileError) return { error: profileError.message };
  revalidatePath("/admin/patients");
  revalidatePath("/dentist/patients");
  revalidatePath(`/admin/patients/${patientId}`);
  return {
    success: "Patient saved.",
    patientId,
    patientNumber: patientResult.data.patient_number,
    allergyAlert: parsed.data.allergies.length > 0,
  };
}

export async function archivePatientAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("patients")
    .update({ deleted_at: new Date().toISOString(), is_archived: true })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/patients");
  revalidatePath("/dentist/patients");
}

export async function saveCurrentPatientProfileAction(_: unknown, formData: FormData) {
  const user = await requireRole("patient");
  const parsed = patientProfileUpdateSchema.safeParse({
    ...Object.fromEntries(formData),
    allergies: commaValues(formData, "allergies"),
    medications: commaValues(formData, "medications"),
    medical_conditions: commaValues(formData, "medical_conditions"),
    consent_treatment: checked(formData, "consent_treatment"),
    consent_privacy: checked(formData, "consent_privacy"),
    consent_billing: checked(formData, "consent_billing"),
    consent_marketing: checked(formData, "consent_marketing"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile." };
  }

  const supabase = await createClient();
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.profile.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (patientError) return { error: patientError.message };
  if (!patient) {
    return { error: "Your account is not connected to a clinic patient record yet." };
  }

  const allergiesText = parsed.data.allergies.join(", ");
  const patientPayload = {
    first_name: parsed.data.first_name,
    middle_name: parsed.data.middle_name || null,
    last_name: parsed.data.last_name,
    birth_date: parsed.data.birth_date || null,
    sex: parsed.data.sex || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || parsed.data.address_line || null,
    emergency_name: parsed.data.emergency_name || null,
    emergency_relationship: parsed.data.emergency_relationship || null,
    emergency_phone: parsed.data.emergency_phone || null,
    allergies: allergiesText || null,
    medical_history: parsed.data.medical_history || null,
    dental_history: parsed.data.dental_history || null,
  };

  const { error: updateError } = await supabase
    .from("patients")
    .update(patientPayload)
    .eq("id", patient.id)
    .eq("user_id", user.profile.id);

  if (updateError) return { error: updateError.message };

  const anxietyScore =
    typeof parsed.data.dental_anxiety_score === "number"
      ? parsed.data.dental_anxiety_score
      : null;
  const profilePayload = {
    patient_id: patient.id,
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
    insurance_provider: parsed.data.insurance_provider || null,
    insurance_policy_number: parsed.data.insurance_policy_number || null,
    insurance_group_number: parsed.data.insurance_group_number || null,
    insurance_holder_name: parsed.data.insurance_holder_name || null,
    consent_treatment: parsed.data.consent_treatment,
    consent_privacy: parsed.data.consent_privacy,
    consent_billing: parsed.data.consent_billing,
    consent_marketing: parsed.data.consent_marketing,
    consent_signed_at:
      parsed.data.consent_treatment || parsed.data.consent_privacy || parsed.data.consent_billing
        ? new Date().toISOString()
        : null,
  };

  const { error: profileError } = await supabase
    .from("patient_profiles")
    .upsert(profilePayload, { onConflict: "patient_id" });

  if (profileError) return { error: profileError.message };

  revalidatePath("/patient/profile");
  revalidatePath("/patient/appointments");
  revalidatePath("/patient/dashboard");
  return { success: "Profile updated." };
}

export async function saveAppointmentAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const parsed = appointmentSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid appointment." };
  }

  const supabase = await createClient();
  const payload = {
    patient_id: parsed.data.patient_id,
    dentist_id: parsed.data.dentist_id || null,
    branch_id: parsed.data.branch_id,
    service_id: parsed.data.service_id || null,
    starts_at: parsed.data.starts_at,
    ends_at: parsed.data.ends_at,
    reason: parsed.data.reason,
    booking_reference: parsed.data.booking_reference || null,
    payment_method: parsed.data.payment_method || null,
    appointment_notes: parsed.data.appointment_notes || null,
    reminder_consent: parsed.data.reminder_consent,
    privacy_consent: parsed.data.privacy_consent,
    status: parsed.data.status,
    created_by: user.profile.id,
  };

  const { error } = parsed.data.id
    ? await supabase
        .from("appointments")
        .update(payload)
        .eq("id", parsed.data.id)
    : await supabase.from("appointments").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/admin/appointments");
  revalidatePath("/dentist/appointments");
  revalidatePath("/patient/appointments");
  return { success: "Appointment saved." };
}

export async function bookPatientAppointmentAction(_: unknown, formData: FormData) {
  const user = await requireRole("patient");
  const parsed = patientBookingSchema.safeParse({
    ...Object.fromEntries(formData),
    reminder_consent: checked(formData, "reminder_consent"),
    privacy_consent: checked(formData, "privacy_consent"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid booking." };
  }

  const supabase = await createClient();
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("*, patient_profiles(*)")
    .eq("user_id", user.profile.id)
    .eq("branch_id", parsed.data.branch_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (patientError) return { error: patientError.message };
  if (!patient) return { error: "Complete patient registration before booking an appointment." };

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("*, service_branch_settings(*)")
    .eq("id", parsed.data.service_id)
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();

  if (serviceError) return { error: serviceError.message };
  if (!service) return { error: "Choose an active dental service." };

  const branchSetting = (service.service_branch_settings ?? []).find(
    (setting: { branch_id: string; is_available: boolean }) =>
      setting.branch_id === parsed.data.branch_id && setting.is_available
  );
  if (!branchSetting) return { error: "This service is not available at your branch." };

  const { data: assignment, error: assignmentError } = await supabase
    .from("user_branch_assignments")
    .select("user_id, users!inner(role, is_active, deleted_at)")
    .eq("user_id", parsed.data.dentist_id)
    .eq("branch_id", parsed.data.branch_id)
    .eq("users.role", "dentist")
    .eq("users.is_active", true)
    .is("users.deleted_at", null)
    .maybeSingle();

  if (assignmentError) return { error: assignmentError.message };
  if (!assignment) return { error: "Choose a dentist assigned to your branch." };

  const duration =
    (branchSetting as { duration_override_mins?: number | null }).duration_override_mins ??
    service.duration_mins;
  const startsAt = manilaIso(parsed.data.appointment_date, parsed.data.appointment_time);
  const startsDate = new Date(startsAt);
  const endsAt = addMinutesIso(startsAt, duration);
  const slotMinutes = timeToMinutes(parsed.data.appointment_time);
  const weekday = dateWeekday(parsed.data.appointment_date);

  if (Number.isNaN(startsDate.getTime()) || startsDate <= new Date()) {
    return { error: "Choose a future appointment schedule." };
  }

  const { data: availability, error: availabilityError } = await supabase
    .from("dentist_availability")
    .select("*")
    .eq("dentist_id", parsed.data.dentist_id)
    .eq("branch_id", parsed.data.branch_id)
    .eq("weekday", weekday)
    .eq("is_active", true);

  if (availabilityError) return { error: availabilityError.message };

  const fitsAvailability = (availability ?? []).some((row) => {
    const start = timeToMinutes(String(row.start_time).slice(0, 5));
    const end = timeToMinutes(String(row.end_time).slice(0, 5));
    const interval = Number(row.slot_interval_mins || 30);
    return slotMinutes >= start && slotMinutes + duration <= end && (slotMinutes - start) % interval === 0;
  });

  if (!fitsAvailability) {
    return { error: "This dentist is not available for the selected schedule." };
  }

  const { data: blocks, error: blockError } = await supabase
    .from("dentist_schedule_blocks")
    .select("id")
    .eq("dentist_id", parsed.data.dentist_id)
    .eq("branch_id", parsed.data.branch_id)
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt);

  if (blockError) return { error: blockError.message };
  if ((blocks ?? []).length > 0) return { error: "This schedule is unavailable." };

  const { data: conflicts, error: conflictError } = await supabase
    .from("appointments")
    .select("id")
    .eq("dentist_id", parsed.data.dentist_id)
    .eq("branch_id", parsed.data.branch_id)
    .in("status", ["requested", "approved"])
    .is("deleted_at", null)
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt);

  if (conflictError) return { error: conflictError.message };
  if ((conflicts ?? []).length > 0) return { error: "That time slot was just booked. Please choose another." };

  const reference = bookingReference(parsed.data.appointment_date);
  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: patient.id,
      dentist_id: parsed.data.dentist_id,
      branch_id: parsed.data.branch_id,
      service_id: parsed.data.service_id,
      starts_at: startsAt,
      ends_at: endsAt,
      reason: service.name,
      status: "requested",
      booking_reference: reference,
      payment_method: parsed.data.payment_method,
      appointment_notes: parsed.data.appointment_notes || null,
      reminder_consent: parsed.data.reminder_consent,
      privacy_consent: parsed.data.privacy_consent,
      created_by: user.profile.id,
    })
    .select("id, booking_reference, starts_at, ends_at, reason, status, payment_method")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/patient/appointments");
  revalidatePath("/admin/appointments");
  revalidatePath("/dentist/appointments");
  return {
    success: "Appointment requested.",
    appointment,
  };
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      status,
      approved_by: status === "approved" ? user.profile.id : null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/appointments");
  revalidatePath("/dentist/appointments");
  revalidatePath("/patient/appointments");
}

export async function saveInventoryItemAction(_: unknown, formData: FormData) {
  await requireRole("admin");
  const parsed = inventoryItemSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid item." };
  }

  const supabase = await createClient();
  const payload = {
    branch_id: parsed.data.branch_id,
    supplier_id: parsed.data.supplier_id || null,
    name: parsed.data.name,
    sku: parsed.data.sku || null,
    category: parsed.data.category,
    unit: parsed.data.unit,
    quantity: parsed.data.quantity,
    reorder_level: parsed.data.reorder_level,
    reorder_quantity: parsed.data.reorder_quantity,
    expiry_date: parsed.data.expiry_date || null,
    unit_cost: parsed.data.unit_cost,
  };

  const { error } = parsed.data.id
    ? await supabase.from("inventory_items").update(payload).eq("id", parsed.data.id)
    : await supabase.from("inventory_items").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/admin/inventory");
  return { success: "Inventory item saved." };
}

export async function saveServiceAction(_: unknown, formData: FormData) {
  const user = await requireRole("admin");
  const supabase = await createClient();
  let imageUrl = String(formData.get("image_url") ?? "").trim();
  const file = formData.get("image_file");

  if (file instanceof File && file.size > 0) {
    const extension = file.name.split(".").pop() || "png";
    const path = `services/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("service-assets")
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) return { error: uploadError.message };
    const { data } = supabase.storage.from("service-assets").getPublicUrl(path);
    imageUrl = data.publicUrl;
  }

  const parsed = serviceSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    name: formData.get("name"),
    slug: String(formData.get("slug") || slugify(String(formData.get("name") ?? ""))),
    description: formData.get("description"),
    category: formData.get("category"),
    duration_mins: formData.get("duration_mins"),
    base_price: formData.get("base_price"),
    price_min: formData.get("price_min") || "",
    price_max: formData.get("price_max") || "",
    image_url: imageUrl,
    icon: formData.get("icon"),
    color_tag: formData.get("color_tag"),
    is_active: checked(formData, "is_active"),
    is_featured: checked(formData, "is_featured"),
    is_popular: checked(formData, "is_popular"),
    requires_followup: checked(formData, "requires_followup"),
    preparation_notes: formData.get("preparation_notes"),
    recovery_notes: formData.get("recovery_notes"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid treatment service." };
  }

  const payload = {
    name: parsed.data.name,
    slug: slugify(parsed.data.slug),
    description: parsed.data.description || null,
    category: parsed.data.category,
    duration_mins: parsed.data.duration_mins,
    base_price: parsed.data.base_price,
    price_min: parsed.data.price_min === "" ? null : parsed.data.price_min ?? null,
    price_max: parsed.data.price_max === "" ? null : parsed.data.price_max ?? null,
    image_url: parsed.data.image_url || null,
    icon: parsed.data.icon || null,
    color_tag: parsed.data.color_tag || null,
    is_active: parsed.data.is_active,
    is_featured: parsed.data.is_featured,
    is_popular: parsed.data.is_popular,
    requires_followup: parsed.data.requires_followup,
    preparation_notes: parsed.data.preparation_notes || null,
    recovery_notes: parsed.data.recovery_notes || null,
    notes: parsed.data.notes || null,
    updated_by: user.profile.id,
  };

  const serviceResult = parsed.data.id
    ? await supabase
        .from("services")
        .update(payload)
        .eq("id", parsed.data.id)
        .select("id")
        .single()
    : await supabase
        .from("services")
        .insert({ ...payload, created_by: user.profile.id })
        .select("id")
        .single();

  if (serviceResult.error) return { error: serviceResult.error.message };

  const serviceId = serviceResult.data.id;
  const branchIds = formData.getAll("branch_ids").map(String).filter(Boolean);

  await supabase.from("service_branch_settings").delete().eq("service_id", serviceId);
  if (branchIds.length) {
    const settings = branchIds.map((branchId) => ({
      service_id: serviceId,
      branch_id: branchId,
      is_available: true,
      price_override: numberOrNull(formData.get(`branch_price_${branchId}`)),
      duration_override_mins: numberOrNull(formData.get(`branch_duration_${branchId}`)),
    }));
    const { error } = await supabase.from("service_branch_settings").insert(settings);
    if (error) return { error: error.message };
  }

  await supabase.from("service_inventory_items").delete().eq("service_id", serviceId);
  const inventoryItemIds = formData.getAll("inventory_item_ids").map(String).filter(Boolean);
  if (inventoryItemIds.length) {
    const inventoryRows = inventoryItemIds
      .map((itemId) => ({
        service_id: serviceId,
        inventory_item_id: itemId,
        quantity_used: numberOrNull(formData.get(`inventory_quantity_${itemId}`)) ?? 0,
      }))
      .filter((row) => row.quantity_used > 0);

    if (inventoryRows.length) {
      const { error } = await supabase.from("service_inventory_items").insert(inventoryRows);
      if (error) return { error: error.message };
    }
  }

  revalidatePath("/admin/treatments");
  revalidatePath("/services");
  revalidatePath("/patient/appointments");
  revalidatePath("/dentist/treatments");
  return { success: "Treatment service saved." };
}

export async function archiveServiceAction(formData: FormData) {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ archived_at: new Date().toISOString(), is_active: false })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/treatments");
  revalidatePath("/services");
  revalidatePath("/patient/appointments");
}

export async function restoreServiceAction(formData: FormData) {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ archived_at: null, is_active: true })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/treatments");
  revalidatePath("/services");
  revalidatePath("/patient/appointments");
}

export async function duplicateServiceAction(formData: FormData) {
  const user = await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { data: service, error } = await supabase
    .from("services")
    .select("*, service_branch_settings(*), service_inventory_items(*)")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  const copyName = `${service.name} Copy`;
  const { data: copy, error: copyError } = await supabase
    .from("services")
    .insert({
      name: copyName,
      slug: `${service.slug}-copy-${Date.now()}`,
      description: service.description,
      category: service.category,
      duration_mins: service.duration_mins,
      base_price: service.base_price,
      price_min: service.price_min,
      price_max: service.price_max,
      image_url: service.image_url,
      icon: service.icon,
      color_tag: service.color_tag,
      is_active: false,
      is_featured: false,
      is_popular: false,
      requires_followup: service.requires_followup,
      preparation_notes: service.preparation_notes,
      recovery_notes: service.recovery_notes,
      notes: service.notes,
      created_by: user.profile.id,
      updated_by: user.profile.id,
    })
    .select("id")
    .single();

  if (copyError) throw new Error(copyError.message);

  const branchRows = (service.service_branch_settings ?? []).map((setting: { branch_id: string; is_available: boolean; price_override: number | null; duration_override_mins: number | null }) => ({
    service_id: copy.id,
    branch_id: setting.branch_id,
    is_available: setting.is_available,
    price_override: setting.price_override,
    duration_override_mins: setting.duration_override_mins,
  }));
  if (branchRows.length) await supabase.from("service_branch_settings").insert(branchRows);

  const inventoryRows = (service.service_inventory_items ?? []).map((item: { inventory_item_id: string; quantity_used: number }) => ({
    service_id: copy.id,
    inventory_item_id: item.inventory_item_id,
    quantity_used: item.quantity_used,
  }));
  if (inventoryRows.length) await supabase.from("service_inventory_items").insert(inventoryRows);

  revalidatePath("/admin/treatments");
}

export async function bulkUpdateServicesAction(formData: FormData) {
  await requireRole("admin");
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  const isActive = String(formData.get("is_active") ?? "") === "true";
  if (!ids.length) return;

  const supabase = await createClient();
  const { error } = await supabase.from("services").update({ is_active: isActive }).in("id", ids);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/treatments");
  revalidatePath("/services");
  revalidatePath("/patient/appointments");
}

export async function saveTreatmentAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const parsed = treatmentSchema.safeParse({
    ...Object.fromEntries(formData),
    surfaces: String(formData.get("surfaces") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid treatment." };
  }

  const supabase = await createClient();
  const { data: treatment, error } = await supabase
    .from("treatments")
    .insert({
      patient_id: parsed.data.patient_id,
      branch_id: parsed.data.branch_id,
      dentist_id: parsed.data.dentist_id,
      appointment_id: parsed.data.appointment_id || null,
      service_id: parsed.data.service_id || null,
      procedure_id: parsed.data.procedure_id || null,
      tooth: parsed.data.tooth || null,
      surfaces: parsed.data.surfaces,
      diagnosis: parsed.data.diagnosis || null,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
      fee: parsed.data.fee,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (parsed.data.inventory_item_id && parsed.data.inventory_quantity > 0) {
    const { error: inventoryError } = await supabase.from("inventory_logs").insert({
      item_id: parsed.data.inventory_item_id,
      branch_id: parsed.data.branch_id,
      patient_id: parsed.data.patient_id,
      treatment_id: treatment.id,
      used_by: user.profile.id,
      action: "procedure_use",
      quantity_delta: -parsed.data.inventory_quantity,
      notes: nullable(formData.get("notes")),
    });

    if (inventoryError) return { error: inventoryError.message };
  }

  revalidatePath("/dentist/treatments");
  revalidatePath("/patient/treatments");
  revalidatePath(`/admin/patients/${parsed.data.patient_id}`);
  return { success: "Treatment saved." };
}

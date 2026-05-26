import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export const patientRegistrationSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
    firstName: z.string().trim().min(1, "First name is required."),
    middleName: z.string().trim().optional(),
    lastName: z.string().trim().min(1, "Last name is required."),
    birthDate: z.string().optional(),
    sex: z.string().optional(),
    occupation: z.string().trim().optional(),
    civil_status: z.string().trim().optional(),
    guardian_name: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    address: z.string().trim().optional(),
    address_line: z.string().trim().optional(),
    city: z.string().trim().optional(),
    province: z.string().trim().optional(),
    postal_code: z.string().trim().optional(),
    emergencyName: z.string().trim().optional(),
    emergencyRelationship: z.string().trim().optional(),
    emergencyContact: z.string().trim().optional(),
    allergies: z.array(z.string().trim()).default([]),
    medications: z.array(z.string().trim()).default([]),
    medical_conditions: z.array(z.string().trim()).default([]),
    medicalHistory: z.string().trim().optional(),
    dentalHistory: z.string().trim().optional(),
    previous_dentist: z.string().trim().optional(),
    last_dental_visit: z.string().optional(),
    dental_anxiety_score: z.coerce.number().int().min(1).max(5).optional().or(z.literal("")),
    consent_treatment: z.boolean().refine(Boolean, "Treatment consent is required."),
    consent_privacy: z.boolean().refine(Boolean, "Privacy consent is required."),
    consent_billing: z.boolean().refine(Boolean, "Billing consent is required."),
    consent_marketing: z.boolean().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const patientSchema = z.object({
  id: z.string().uuid().optional(),
  branch_id: z.string().uuid("Branch is required."),
  assigned_dentist_id: z.string().uuid().optional().or(z.literal("")),
  first_name: z.string().trim().min(1, "First name is required."),
  middle_name: z.string().trim().optional(),
  last_name: z.string().trim().min(1, "Last name is required."),
  birth_date: z.string().optional(),
  sex: z.string().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().optional(),
  address_line: z.string().trim().optional(),
  city: z.string().trim().optional(),
  province: z.string().trim().optional(),
  postal_code: z.string().trim().optional(),
  occupation: z.string().trim().optional(),
  civil_status: z.string().trim().optional(),
  guardian_name: z.string().trim().optional(),
  emergency_name: z.string().trim().optional(),
  emergency_relationship: z.string().trim().optional(),
  emergency_phone: z.string().trim().optional(),
  allergies: z.array(z.string().trim()).default([]),
  medications: z.array(z.string().trim()).default([]),
  medical_conditions: z.array(z.string().trim()).default([]),
  medical_history: z.string().trim().optional(),
  dental_history: z.string().trim().optional(),
  previous_dentist: z.string().trim().optional(),
  last_dental_visit: z.string().optional(),
  dental_anxiety_score: z.coerce.number().int().min(1).max(5).optional().or(z.literal("")),
  insurance_provider: z.string().trim().optional(),
  insurance_policy_number: z.string().trim().optional(),
  insurance_group_number: z.string().trim().optional(),
  insurance_holder_name: z.string().trim().optional(),
  consent_treatment: z.coerce.boolean().refine(Boolean, "Treatment consent is required."),
  consent_privacy: z.coerce.boolean().refine(Boolean, "Privacy consent is required."),
  consent_billing: z.coerce.boolean().refine(Boolean, "Billing consent is required."),
  consent_marketing: z.coerce.boolean().default(false),
  signature_name: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const patientProfileUpdateSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required."),
  middle_name: z.string().trim().optional(),
  last_name: z.string().trim().min(1, "Last name is required."),
  birth_date: z.string().optional(),
  sex: z.string().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  address: z.string().trim().optional(),
  address_line: z.string().trim().optional(),
  city: z.string().trim().optional(),
  province: z.string().trim().optional(),
  postal_code: z.string().trim().optional(),
  occupation: z.string().trim().optional(),
  civil_status: z.string().trim().optional(),
  guardian_name: z.string().trim().optional(),
  emergency_name: z.string().trim().optional(),
  emergency_relationship: z.string().trim().optional(),
  emergency_phone: z.string().trim().optional(),
  allergies: z.array(z.string().trim()).default([]),
  medications: z.array(z.string().trim()).default([]),
  medical_conditions: z.array(z.string().trim()).default([]),
  medical_history: z.string().trim().optional(),
  dental_history: z.string().trim().optional(),
  previous_dentist: z.string().trim().optional(),
  last_dental_visit: z.string().optional(),
  dental_anxiety_score: z.coerce.number().int().min(1).max(5).optional().or(z.literal("")),
  insurance_provider: z.string().trim().optional(),
  insurance_policy_number: z.string().trim().optional(),
  insurance_group_number: z.string().trim().optional(),
  insurance_holder_name: z.string().trim().optional(),
  consent_treatment: z.coerce.boolean().default(false),
  consent_privacy: z.coerce.boolean().default(false),
  consent_billing: z.coerce.boolean().default(false),
  consent_marketing: z.coerce.boolean().default(false),
});

export const branchSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required."),
  code: z.string().trim().min(1, "Code is required."),
  address: z.string().trim().min(1, "Address is required."),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export const appointmentSchema = z.object({
  id: z.string().uuid().optional(),
  patient_id: z.string().uuid("Patient is required."),
  dentist_id: z.string().uuid().optional().or(z.literal("")),
  branch_id: z.string().uuid("Branch is required."),
  service_id: z.string().uuid().optional().or(z.literal("")),
  starts_at: z.string().min(1, "Start time is required."),
  ends_at: z.string().min(1, "End time is required."),
  reason: z.string().trim().min(1, "Reason is required."),
  booking_reference: z.string().trim().optional().or(z.literal("")),
  payment_method: z.enum(["cash", "gcash"]).optional().or(z.literal("")),
  appointment_notes: z.string().trim().optional(),
  reminder_consent: z.coerce.boolean().default(false),
  privacy_consent: z.coerce.boolean().default(false),
  status: z
    .enum(["requested", "approved", "completed", "cancelled", "no_show"])
    .default("requested"),
});

export const patientBookingSchema = z.object({
  service_id: z.string().uuid("Choose a dental service."),
  dentist_id: z.string().uuid("Choose a dentist."),
  branch_id: z.string().uuid("Branch is required."),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose an appointment date."),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/, "Choose an appointment time."),
  payment_method: z.enum(["cash", "gcash"], {
    message: "Choose cash or GCash.",
  }),
  appointment_notes: z.string().trim().max(1000, "Notes must be 1000 characters or fewer.").optional(),
  reminder_consent: z.coerce.boolean().refine(Boolean, "Appointment reminder consent is required."),
  privacy_consent: z.coerce.boolean().refine(Boolean, "Privacy and booking policy consent is required."),
});

export const treatmentSchema = z.object({
  patient_id: z.string().uuid("Patient is required."),
  branch_id: z.string().uuid("Branch is required."),
  dentist_id: z.string().uuid("Dentist is required."),
  appointment_id: z.string().uuid().optional().or(z.literal("")),
  service_id: z.string().uuid().optional().or(z.literal("")),
  procedure_id: z.string().uuid().optional().or(z.literal("")),
  tooth: z.string().trim().optional(),
  surfaces: z.array(z.string()).default([]),
  diagnosis: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: z
    .enum(["planned", "in_progress", "completed", "cancelled"])
    .default("completed"),
  fee: z.coerce.number().min(0).default(0),
  inventory_item_id: z.string().uuid().optional().or(z.literal("")),
  inventory_quantity: z.coerce.number().min(0).default(0),
});

export const serviceSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, "Treatment name is required."),
    slug: z.string().trim().min(1, "Slug is required."),
    description: z.string().trim().optional(),
    category: z.string().trim().min(1, "Category is required."),
    duration_mins: z.coerce.number().int().positive("Duration must be greater than 0."),
    base_price: z.coerce.number().min(0, "Base price cannot be negative."),
    price_min: z.coerce.number().min(0).optional().or(z.literal("")),
    price_max: z.coerce.number().min(0).optional().or(z.literal("")),
    image_url: z.string().trim().url().optional().or(z.literal("")),
    icon: z.string().trim().optional(),
    color_tag: z.string().trim().optional(),
    is_active: z.coerce.boolean().default(false),
    is_featured: z.coerce.boolean().default(false),
    is_popular: z.coerce.boolean().default(false),
    requires_followup: z.coerce.boolean().default(false),
    preparation_notes: z.string().trim().optional(),
    recovery_notes: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .refine(
    (data) =>
      data.price_min === "" ||
      data.price_max === "" ||
      data.price_min === undefined ||
      data.price_max === undefined ||
      Number(data.price_max) >= Number(data.price_min),
    {
      message: "Maximum price must be greater than or equal to minimum price.",
      path: ["price_max"],
    }
  );

export const inventoryItemSchema = z.object({
  id: z.string().uuid().optional(),
  branch_id: z.string().uuid("Branch is required."),
  supplier_id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Name is required."),
  sku: z.string().trim().optional(),
  category: z.string().trim().min(1, "Category is required."),
  unit: z.string().trim().min(1, "Unit is required."),
  quantity: z.coerce.number().min(0),
  reorder_level: z.coerce.number().min(0),
  reorder_quantity: z.coerce.number().min(0),
  expiry_date: z.string().optional(),
  unit_cost: z.coerce.number().min(0),
});

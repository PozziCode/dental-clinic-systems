export type UserRole = "admin" | "dentist" | "patient";
export type AppointmentStatus =
  | "requested"
  | "approved"
  | "completed"
  | "cancelled"
  | "no_show";
export type TreatmentStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled";
export type FileKind =
  | "xray"
  | "intraoral_photo"
  | "treatment_photo"
  | "record";

export type ClinicUser = {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Branch = {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Patient = {
  id: string;
  user_id: string | null;
  branch_id: string;
  assigned_dentist_id: string | null;
  patient_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  birth_date: string | null;
  sex: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergency_name: string | null;
  emergency_relationship: string | null;
  emergency_phone: string | null;
  allergies: string | null;
  medical_history: string | null;
  dental_history: string | null;
  notes: string | null;
  profile_photo_url: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type PatientProfile = {
  id: string;
  patient_id: string;
  occupation: string | null;
  civil_status: string | null;
  guardian_name: string | null;
  insurance_provider: string | null;
  consent_signed_at: string | null;
  address_line: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  medications: string[];
  medical_conditions: string[];
  previous_dentist: string | null;
  last_dental_visit: string | null;
  dental_anxiety_score: number | null;
  insurance_policy_number: string | null;
  insurance_group_number: string | null;
  insurance_holder_name: string | null;
  consent_treatment: boolean;
  consent_privacy: boolean;
  consent_billing: boolean;
  consent_marketing: boolean;
  signature_url: string | null;
  signature_name: string | null;
  created_at: string;
  updated_at: string;
};

export type PatientWithProfile = Patient & {
  patient_profiles?: PatientProfile | PatientProfile[] | null;
};

export type Appointment = {
  id: string;
  patient_id: string;
  dentist_id: string | null;
  branch_id: string;
  service_id: string | null;
  starts_at: string;
  ends_at: string;
  reason: string;
  status: AppointmentStatus;
  booking_reference: string | null;
  payment_method: "cash" | "gcash" | null;
  appointment_notes: string | null;
  reminder_consent: boolean;
  privacy_consent: boolean;
  cancellation_reason: string | null;
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AppointmentWithRelations = Appointment & {
  patients?: Pick<Patient, "id" | "first_name" | "last_name" | "patient_number" | "phone" | "email"> | null;
  branches?: Pick<Branch, "id" | "name" | "code" | "address"> | null;
  services?: Pick<Service, "id" | "name" | "duration_mins" | "base_price"> | null;
  dentist?: Pick<ClinicUser, "id" | "full_name" | "email" | "phone"> | null;
};

export type DentistAvailability = {
  id: string;
  dentist_id: string;
  branch_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_interval_mins: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DentistScheduleBlock = {
  id: string;
  dentist_id: string;
  branch_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Procedure = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  default_price: number;
  color: string;
  is_active: boolean;
};

export type Treatment = {
  id: string;
  patient_id: string;
  dentist_id: string;
  appointment_id: string | null;
  branch_id: string;
  service_id: string | null;
  procedure_id: string | null;
  tooth: string | null;
  surfaces: string[];
  diagnosis: string | null;
  notes: string | null;
  status: TreatmentStatus;
  fee: number;
  treated_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Service = {
  id: string;
  branch_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  duration_mins: number;
  base_price: number;
  price_min: number | null;
  price_max: number | null;
  image_url: string | null;
  icon: string | null;
  color_tag: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_popular: boolean;
  requires_followup: boolean;
  preparation_notes: string | null;
  recovery_notes: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type ServiceBranchSetting = {
  id: string;
  service_id: string;
  branch_id: string;
  is_available: boolean;
  price_override: number | null;
  duration_override_mins: number | null;
  created_at: string;
  updated_at: string;
};

export type ServiceInventoryItem = {
  id: string;
  service_id: string;
  inventory_item_id: string;
  quantity_used: number;
  created_at: string;
};

export type ServiceWithRelations = Service & {
  service_branch_settings?: ServiceBranchSetting[];
  service_inventory_items?: ServiceInventoryItem[];
};

export type InventoryItem = {
  id: string;
  branch_id: string;
  supplier_id: string | null;
  name: string;
  sku: string | null;
  category: string;
  unit: string;
  quantity: number;
  reorder_level: number;
  reorder_quantity: number;
  expiry_date: string | null;
  unit_cost: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type XrayImage = {
  id: string;
  patient_id: string;
  treatment_id: string | null;
  branch_id: string;
  uploaded_by: string;
  kind: FileKind;
  bucket: string;
  path: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  notes: string | null;
  created_at: string;
  deleted_at: string | null;
};

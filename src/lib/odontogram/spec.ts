export type OdontogramSurface = "mesial" | "distal" | "occlusal" | "buccal" | "lingual";

export const CANONICAL_SURFACES: OdontogramSurface[] = [
  "mesial",
  "distal",
  "occlusal",
  "buccal",
  "lingual",
];

export type OdontogramStatus = "planned" | "in_progress" | "completed";

export const STATUS_TO_TREATMENT_STATUS: Record<
  OdontogramStatus,
  "planned" | "in_progress" | "completed" | "cancelled"
> = {
  planned: "planned",
  in_progress: "in_progress",
  completed: "completed",
};

export type OdontogramMarkInput = {
  patientId: string;
  dentistId: string;
  tooth: string; // permanent tooth numbering
  surfaces: OdontogramSurface[];
  procedureId: string | null;
  diagnosis: string | null;
  notes: string | null;
  status: OdontogramStatus;
  branchId: string;
  appointmentId?: string | null;
};

// This spec describes how UI selections should be mapped to the existing
// `treatments` table model.
export function toTreatmentPayload(input: OdontogramMarkInput) {
  return {
    patient_id: input.patientId,
    dentist_id: input.dentistId,
    appointment_id: input.appointmentId ?? null,
    branch_id: input.branchId,
    service_id: null as string | null,
    procedure_id: input.procedureId,
    tooth: input.tooth,
    surfaces: input.surfaces,
    diagnosis: input.diagnosis,
    notes: input.notes,
    status: STATUS_TO_TREATMENT_STATUS[input.status],
    fee: 0,
  };
}


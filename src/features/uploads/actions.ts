"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export async function uploadClinicalFileAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");
  const patientId = String(formData.get("patient_id") ?? "");
  const branchId = String(formData.get("branch_id") ?? "");
  const treatmentId = String(formData.get("treatment_id") ?? "") || null;
  const kind = String(formData.get("kind") ?? "xray");
  const notes = String(formData.get("notes") ?? "") || null;

  if (!(file instanceof File) || !patientId || !branchId) {
    return { error: "File, patient, and branch are required." };
  }

  const supabase = await createClient();
  const path = `${branchId}/${patientId}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("clinical-files")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("xray_images").insert({
    patient_id: patientId,
    treatment_id: treatmentId,
    branch_id: branchId,
    uploaded_by: user.profile.id,
    kind,
    bucket: "clinical-files",
    path,
    file_name: file.name,
    content_type: file.type,
    size_bytes: file.size,
    notes,
  });

  if (error) return { error: error.message };
  revalidatePath("/dentist/x-rays");
  revalidatePath("/patient/x-rays");
  return { success: "File uploaded." };
}

export async function getSignedClinicalUrl(path: string) {
  await requireUser();
  const supabase = await createClient();

  const { data: record, error: recordError } = await supabase
    .from("xray_images")
    .select("id,path")
    .eq("path", path)
    .is("deleted_at", null)
    .maybeSingle();

  if (recordError) {
    throw recordError;
  }

  if (!record) {
    throw new Error("File is not available for this user.");
  }

  const { data, error } = await supabase.storage
    .from("clinical-files")
    .createSignedUrl(path, 300);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function deleteClinicalFileAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const path = String(formData.get("path") ?? "");
  const supabase = await createClient();

  if (path) {
    await supabase.storage.from("clinical-files").remove([path]);
  }

  const { error } = await supabase
    .from("xray_images")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dentist/x-rays");
  revalidatePath("/patient/x-rays");
}

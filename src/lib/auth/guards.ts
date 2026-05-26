import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ClinicUser, UserRole } from "@/lib/database.types";

export type SessionUser = {
  authId: string;
  profile: ClinicUser;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<ClinicUser>();

  if (!profile || !profile.is_active || profile.deleted_at) {
    return null;
  }

  return {
    authId: user.id,
    profile,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(role: UserRole) {
  const user = await requireUser();

  if (user.profile.role !== role) {
    redirect(`/${user.profile.role}/dashboard`);
  }

  return user;
}

export function dashboardForRole(role: UserRole) {
  return `/${role}/dashboard`;
}

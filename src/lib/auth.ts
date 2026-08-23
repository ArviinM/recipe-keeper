import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export type CurrentUser = {
  id: string;
  email: string;
  role: AppRole;
  fullName: string;
  username: string;
  sectionId: string | null;
  mustChangePassword: boolean;
};

/** The signed-in user's profile, or null when signed out. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, username, section_id, must_change_password")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    role: profile.role,
    fullName: profile.full_name,
    username: profile.username,
    sectionId: profile.section_id,
    mustChangePassword: profile.must_change_password,
  };
}

/** Use in any page that requires a signed-in user. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Use in admin/teacher pages. Students are sent back to their own dashboard. */
export async function requireStaff(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "teacher") redirect("/home");
  return user;
}

/** Use in pages only a full administrator may open. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/home");
  return user;
}

export function isStaff(role: AppRole) {
  return role === "admin" || role === "teacher";
}

/** Friendly first name for greetings: "Ana Maria Reyes" -> "Ana". */
export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import type { Locale } from "@/lib/i18n";

export type AppRole = Database["public"]["Enums"]["app_role"];

export type CurrentUser = {
  id: string;
  email: string;
  role: AppRole;
  fullName: string;
  username: string;
  sectionId: string | null;
  mustChangePassword: boolean;
  locale: Locale;
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
    .select(
      "role, full_name, username, section_id, must_change_password, locale, sections(default_locale)",
    )
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  // The section's language is the default so a whole class reads the same
  // thing; a student may override it for their own reading.
  const locale: Locale =
    profile.locale ?? profile.sections?.default_locale ?? "en";

  return {
    id: user.id,
    email: user.email ?? "",
    role: profile.role,
    fullName: profile.full_name,
    username: profile.username,
    sectionId: profile.section_id,
    mustChangePassword: profile.must_change_password,
    locale,
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

/**
 * Where a role belongs after signing in. Teachers and administrators go
 * straight to their dashboard — the student app is not their tool, and landing
 * there showed them copy like "ask your teacher to reset your password".
 */
export function landingPathFor(role: AppRole) {
  return isStaff(role) ? "/admin" : "/home";
}

/** Friendly first name for greetings: "Ana Maria Reyes" -> "Ana". */
export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

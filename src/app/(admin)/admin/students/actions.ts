"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import type { AppRole } from "@/lib/auth";

export type AccountResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  credentials?: { username: string; email: string; temporaryPassword: string };
};

/**
 * Readable temporary password: no ambiguous characters, because a teacher will
 * write this on paper and a student will type it on a phone keyboard.
 */
function temporaryPassword(): string {
  const words = ["Adobo", "Sinigang", "Lumpia", "Pancit", "Menudo", "Kaldereta", "Tinola", "Bibingka"];
  const word = words[Math.floor(Math.random() * words.length)];
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return `${word}${digits}`;
}

/**
 * Creates an account on a student's behalf.
 *
 * Uses the service role, so the caller's own role is checked explicitly first:
 * this client bypasses row level security entirely.
 */
export async function createAccount(values: {
  fullName: string;
  email: string;
  username: string;
  sectionId: string | null;
  role: AppRole;
}): Promise<AccountResult> {
  const staff = await requireStaff();

  // Only a full administrator may mint another teacher or administrator.
  if (values.role !== "student" && staff.role !== "admin") {
    return { ok: false, error: "Only an administrator can create staff accounts." };
  }

  const fullName = values.fullName.trim();
  const email = values.email.trim().toLowerCase();
  const username = values.username.trim();

  const fieldErrors: Record<string, string> = {};
  if (fullName.length < 2) fieldErrors.fullName = "Enter the student's full name.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
    fieldErrors.username = "Username must be 3–32 letters, numbers, dots, dashes, or underscores.";
  }
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  const supabase = await createClient();
  const { data: available } = await supabase.rpc("username_available", {
    p_username: username,
  });
  if (available === false) {
    return { ok: false, fieldErrors: { username: "That username is already taken." } };
  }

  const password = temporaryPassword();
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      username,
      section_id: values.sectionId ?? "",
    },
    // app_metadata is the only trusted source for role; user_metadata is not.
    app_metadata: { role: values.role, must_change_password: true },
  });

  if (error) {
    if (/already been registered|already registered/i.test(error.message)) {
      return { ok: false, fieldErrors: { email: "That email already has an account." } };
    }
    return { ok: false, error: "We could not create the account. Please try again." };
  }

  revalidatePath("/admin/students");
  return {
    ok: true,
    credentials: { username, email, temporaryPassword: password },
  };
}

/** Resets a password and returns the new temporary one for the teacher to pass on. */
export async function resetPassword(
  userId: string,
): Promise<{ ok: boolean; error?: string; temporaryPassword?: string }> {
  const staff = await requireStaff();
  const supabase = await createClient();

  // Row level security decides visibility: a teacher only sees students in the
  // sections they advise, so a profile they cannot read is one they cannot reset.
  const { data: target } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!target) return { ok: false, error: "You cannot manage that account." };
  if (target.role !== "student" && staff.role !== "admin") {
    return { ok: false, error: "Only an administrator can reset a staff password." };
  }

  const password = temporaryPassword();
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password,
    app_metadata: { must_change_password: true },
  });

  if (error) return { ok: false, error: "We could not reset that password." };

  revalidatePath("/admin/students");
  return { ok: true, temporaryPassword: password };
}

export async function setStudentSection(
  userId: string,
  sectionId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  await requireStaff();
  const supabase = await createClient();

  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (!target) return { ok: false, error: "You cannot manage that account." };

  // Service role: the privilege guard blocks section changes from anyone who is
  // not an administrator, and this path is already role-checked above.
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ section_id: sectionId })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/students");
  return { ok: true };
}

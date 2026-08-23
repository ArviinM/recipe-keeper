"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireStaff, requireAdmin } from "@/lib/auth";

export async function createSection(values: {
  gradeLevel: number;
  name: string;
  schoolYear: string;
  assignToMe: boolean;
  defaultLocale: "en" | "tl";
}): Promise<{ ok: boolean; error?: string }> {
  const staff = await requireStaff();
  const supabase = await createClient();

  const name = values.name.trim();
  if (!name) return { ok: false, error: "Enter a section name." };

  const { error } = await supabase.from("sections").insert({
    grade_level: values.gradeLevel,
    name,
    school_year: values.schoolYear.trim() || "2026-2027",
    teacher_id: values.assignToMe ? staff.id : null,
    default_locale: values.defaultLocale,
  });

  if (error) {
    if (/duplicate|unique/i.test(error.message)) {
      return { ok: false, error: "That section already exists for this school year." };
    }
    return { ok: false, error: "Could not create the section." };
  }

  revalidatePath("/admin/sections");
  revalidatePath("/admin/students");
  return { ok: true };
}

export async function deleteSection(id: string): Promise<{ ok: boolean; error?: string }> {
  // Deleting a section detaches every student in it, so it stays admin-only.
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("sections").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete the section." };

  revalidatePath("/admin/sections");
  revalidatePath("/admin/students");
  return { ok: true };
}

/**
 * The whole section reads one language by default. Keeping a class consistent
 * is what stops the language of instruction becoming an uncontrolled variable
 * in the study.
 */
export async function setSectionLocale(
  id: string,
  locale: "en" | "tl",
): Promise<{ ok: boolean; error?: string }> {
  await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase
    .from("sections")
    .update({ default_locale: locale })
    .eq("id", id);

  if (error) return { ok: false, error: "Could not change the language." };

  revalidatePath("/admin/sections");
  revalidatePath("/", "layout");
  return { ok: true };
}

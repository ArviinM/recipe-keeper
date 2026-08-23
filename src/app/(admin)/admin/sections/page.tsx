import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";

import { SectionsManager } from "./sections-manager";

export const metadata: Metadata = { title: "Sections" };

export default async function SectionsPage() {
  const staff = await requireStaff();
  const supabase = await createClient();

  const [{ data: sections }, { data: profiles }] = await Promise.all([
    supabase
      .from("sections")
      .select("id, grade_level, name, school_year, teacher_id, default_locale")
      .order("grade_level")
      .order("name"),
    supabase.from("profiles").select("id, section_id, role"),
  ]);

  const counts = new Map<string, number>();
  for (const profile of profiles ?? []) {
    if (profile.role === "student" && profile.section_id) {
      counts.set(profile.section_id, (counts.get(profile.section_id) ?? 0) + 1);
    }
  }

  return (
    <SectionsManager
      isAdmin={staff.role === "admin"}
      sections={(sections ?? []).map((section) => ({
        ...section,
        studentCount: counts.get(section.id) ?? 0,
        isMine: section.teacher_id === staff.id,
      }))}
    />
  );
}

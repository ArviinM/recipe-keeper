import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";

import { StudentsManager } from "./students-manager";

export const metadata: Metadata = { title: "Students" };

export default async function StudentsPage() {
  const staff = await requireStaff();
  const supabase = await createClient();

  const [{ data: profiles }, { data: sections }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, username, email, role, section_id, must_change_password")
      .order("full_name"),
    supabase
      .from("sections")
      .select("id, grade_level, name")
      .order("grade_level")
      .order("name"),
  ]);

  return (
    <StudentsManager
      canCreateStaff={staff.role === "admin"}
      people={profiles ?? []}
      sections={sections ?? []}
    />
  );
}

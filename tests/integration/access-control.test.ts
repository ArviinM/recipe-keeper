import { beforeAll, afterAll, describe, expect, it } from "vitest";

import {
  adminClient,
  createTestUser,
  deleteTestUsers,
  uid,
  type TestUser,
} from "../helpers/supabase";

/**
 * Role boundaries. These protect minors' records, so they are checked against a
 * live JWT rather than trusted to the UI.
 */
describe("access control", () => {
  const admin = adminClient();
  const created: string[] = [];
  const run = uid();

  let student: TestUser;
  let teacher: TestUser;
  let sectionId: string;
  let draftRecipeId: string;

  beforeAll(async () => {
    teacher = await createTestUser({
      role: "teacher",
      fullName: "Test Teacher",
      username: `teach${run}`,
    });
    created.push(teacher.id);

    const { data: section, error: sectionError } = await admin
      .from("sections")
      .insert({
        grade_level: 9,
        name: `Sampaguita ${run}`,
        school_year: "2026-2027",
        teacher_id: teacher.id,
      })
      .select("id")
      .single();
    if (sectionError) throw sectionError;
    sectionId = section.id;

    student = await createTestUser({
      role: "student",
      fullName: "Test Student",
      username: `pupil${run}`,
      sectionId,
    });
    created.push(student.id);

    const { data: draft, error: draftError } = await admin
      .from("recipes")
      .insert({
        title: `Draft Recipe ${run}`,
        slug: `draft-recipe-${run}`,
        description: "Not published yet.",
        is_published: false,
      })
      .select("id")
      .single();
    if (draftError) throw draftError;
    draftRecipeId = draft.id;
  });

  afterAll(async () => {
    await admin.from("recipes").delete().eq("id", draftRecipeId);
    await deleteTestUsers(created);
    await admin.from("sections").delete().eq("id", sectionId);
  });

  it("provisions a profile with the role from app metadata", async () => {
    const { data } = await admin
      .from("profiles")
      .select("role, full_name, username, section_id")
      .eq("id", student.id)
      .single();

    expect(data?.role).toBe("student");
    expect(data?.username).toBe(`pupil${run}`);
    expect(data?.section_id).toBe(sectionId);
  });

  it("stops a student from promoting themselves to admin", async () => {
    const { error } = await student.client
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", student.id);
    expect(error).not.toBeNull();

    const { data } = await admin
      .from("profiles")
      .select("role")
      .eq("id", student.id)
      .single();
    expect(data?.role).toBe("student");
  });

  it("stops a student from moving themselves into another section", async () => {
    const { error } = await student.client
      .from("profiles")
      .update({ section_id: null })
      .eq("id", student.id);
    expect(error).not.toBeNull();
  });

  it("lets a student edit their own display name", async () => {
    const { error } = await student.client
      .from("profiles")
      .update({ full_name: "Renamed Student" })
      .eq("id", student.id);
    expect(error).toBeNull();
  });

  it("hides unpublished recipes from students", async () => {
    const { data } = await student.client
      .from("recipes")
      .select("id")
      .eq("id", draftRecipeId);
    expect(data ?? []).toHaveLength(0);
  });

  it("shows unpublished recipes to staff", async () => {
    const { data } = await teacher.client
      .from("recipes")
      .select("id")
      .eq("id", draftRecipeId);
    expect(data ?? []).toHaveLength(1);
  });

  it("stops a student from writing content", async () => {
    const { error } = await student.client.from("recipes").insert({
      title: "Student Recipe",
      slug: `student-recipe-${run}`,
      description: "Should be rejected.",
    });
    expect(error).not.toBeNull();
  });

  it("lets a teacher see students in their own section", async () => {
    const { data } = await teacher.client
      .from("profiles")
      .select("id")
      .eq("id", student.id);
    expect(data ?? []).toHaveLength(1);
  });

  it("lets any signed-in user read sections for the registration dropdown", async () => {
    const { data } = await student.client
      .from("sections")
      .select("id, grade_level, name")
      .eq("id", sectionId);
    expect(data ?? []).toHaveLength(1);
  });
});

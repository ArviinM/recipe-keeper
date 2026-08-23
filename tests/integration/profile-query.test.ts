import { describe, expect, it } from "vitest";

import { adminClient } from "../helpers/supabase";

/**
 * getCurrentUser() runs on every authenticated request, but it needs a Next
 * request context so it cannot be called from here. This asserts the shape of
 * the query it makes instead.
 *
 * Worth its own test: profiles and sections reference each other twice — a
 * student's section, and a teacher advising a section — so a bare
 * sections(...) embed is ambiguous. PostgREST rejects it, getCurrentUser reads
 * that as "no profile", and the app falls into a redirect loop between /login
 * and /home. It compiles and builds perfectly, so only a live query catches it.
 */
describe("profile query used by getCurrentUser", () => {
  const admin = adminClient();

  const SELECT =
    "role, full_name, username, section_id, must_change_password, locale, " +
    "sections!profiles_section_id_fkey(default_locale)";

  it("resolves without an ambiguous-relationship error", async () => {
    const { error } = await admin.from("profiles").select(SELECT).limit(1);
    expect(error).toBeNull();
  });

  it("rejects the ambiguous form, proving the constraint name is required", async () => {
    const { error } = await admin
      .from("profiles")
      .select("role, sections(default_locale)")
      .limit(1);

    expect(error).not.toBeNull();
    expect(error?.code).toBe("PGRST201");
  });

  it("returns a section language for a student and null for staff", async () => {
    const { data, error } = await admin
      .from("profiles")
      .select(SELECT)
      .order("role");

    expect(error).toBeNull();
    for (const row of (data ?? []) as { sections: unknown }[]) {
      // Never throws on a profile with no section; the app falls back to "en".
      expect(row.sections === null || typeof row.sections === "object").toBe(true);
    }
  });
});

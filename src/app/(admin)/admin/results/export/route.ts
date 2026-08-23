import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isStaff } from "@/lib/auth";

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Every attempt, not just the best one, so the improvement between retakes is
 * available for the study's analysis.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return new Response("Not authorised", { status: 403 });
  }

  const supabase = await createClient();

  const [{ data: attempts }, { data: profiles }, { data: sections }] =
    await Promise.all([
      supabase
        .from("attempts")
        .select("student_id, score, total_items, percentage, passed, attempt_number, submitted_at, quizzes(title, recipes(title))")
        .order("submitted_at"),
      supabase.from("profiles").select("id, full_name, username, section_id"),
      supabase.from("sections").select("id, grade_level, name"),
    ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const sectionById = new Map((sections ?? []).map((s) => [s.id, s]));

  const header = [
    "Student Name",
    "Username",
    "Grade Level",
    "Section",
    "Lesson",
    "Attempt Number",
    "Score",
    "Total Items",
    "Percentage",
    "Passed",
    "Date Taken",
  ];

  const lines = [header.join(",")];

  for (const attempt of attempts ?? []) {
    const profile = profileById.get(attempt.student_id);
    const section = profile?.section_id ? sectionById.get(profile.section_id) : null;

    lines.push(
      [
        profile?.full_name ?? "Unknown",
        profile?.username ?? "",
        section?.grade_level ?? "",
        section?.name ?? "",
        attempt.quizzes?.recipes?.title ?? "",
        attempt.attempt_number,
        attempt.score,
        attempt.total_items,
        attempt.percentage,
        attempt.passed ? "Yes" : "No",
        new Date(attempt.submitted_at).toISOString().slice(0, 19).replace("T", " "),
      ]
        .map(csvCell)
        .join(","),
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="recipe-keeper-results-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

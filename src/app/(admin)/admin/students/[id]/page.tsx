import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Student" };

export default async function StudentDetailPage({
  params,
}: PageProps<"/admin/students/[id]">) {
  const { id } = await params;
  await requireStaff();
  const supabase = await createClient();

  // Row level security decides visibility: a teacher only sees students in the
  // sections they advise, so an unauthorised id simply returns nothing.
  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name, username, email, role, section_id, must_change_password")
    .eq("id", id)
    .maybeSingle();

  if (!student || student.role !== "student") notFound();

  const [{ data: section }, { data: progress }, { data: attempts }] =
    await Promise.all([
      student.section_id
        ? supabase
            .from("sections")
            .select("grade_level, name")
            .eq("id", student.section_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("student_progress")
        .select(
          "recipes_completed, total_recipes, quizzes_completed, total_quizzes, average_percentage, quizzes_passed",
        )
        .eq("student_id", id)
        .maybeSingle(),
      supabase
        .from("attempts")
        .select("id, attempt_number, score, total_items, percentage, passed, submitted_at, quizzes(title, recipes(title))")
        .eq("student_id", id)
        .order("submitted_at", { ascending: false }),
    ]);

  // Best attempt per lesson, which is what progress reports.
  const best = new Map<string, { pct: number; score: number; total: number; tries: number }>();
  for (const attempt of attempts ?? []) {
    const lesson = attempt.quizzes?.recipes?.title ?? "Lesson";
    const pct = Number(attempt.percentage);
    const current = best.get(lesson);
    if (!current) best.set(lesson, { pct, score: attempt.score, total: attempt.total_items, tries: 1 });
    else {
      current.tries += 1;
      if (pct > current.pct) {
        current.pct = pct;
        current.score = attempt.score;
        current.total = attempt.total_items;
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="-ml-2 size-9">
          <Link href="/admin/students" aria-label="Back to all students">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight">
            {student.full_name}
          </h1>
          <p className="text-muted-foreground truncate text-sm">
            @{student.username} ·{" "}
            {section ? `Grade ${section.grade_level} – ${section.name}` : "No section"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Lessons completed"
          value={`${progress?.recipes_completed ?? 0}/${progress?.total_recipes ?? 0}`}
        />
        <Stat
          label="Quizzes taken"
          value={`${progress?.quizzes_completed ?? 0}/${progress?.total_quizzes ?? 0}`}
        />
        <Stat
          label="Average score"
          value={progress?.quizzes_completed ? `${progress.average_percentage}%` : "—"}
        />
        <Stat label="Quizzes passed" value={String(progress?.quizzes_passed ?? 0)} />
      </div>

      <Card>
        <CardContent className="space-y-3">
          <h2 className="font-bold">Contact</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="break-all font-medium">{student.email}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-muted-foreground">Password status</dt>
              <dd className="font-medium">
                {student.must_change_password ? (
                  <Badge variant="outline">Must choose a new one</Badge>
                ) : (
                  "Set by the student"
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Best score per lesson</h2>
        {best.size === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground text-sm">
                This student has not taken a quiz yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {[...best.entries()].map(([lesson, value]) => (
              <li key={lesson}>
                <Card>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="truncate font-semibold">{lesson}</h3>
                      <span className="shrink-0 text-sm font-bold tabular-nums">
                        {value.score}/{value.total} · {Math.round(value.pct)}%
                        {value.tries > 1 && (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            · {value.tries} attempts
                          </span>
                        )}
                      </span>
                    </div>
                    <Progress value={value.pct} className="h-2" />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Every attempt</h2>
        <p className="text-muted-foreground text-sm">
          Kept in full, so improvement between retakes is visible.
        </p>

        {(attempts ?? []).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground text-sm">No attempts yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="border-border overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="bg-muted/60">
                <tr className="text-left">
                  <th className="px-3 py-2.5 font-semibold">Lesson</th>
                  <th className="px-3 py-2.5 font-semibold">Attempt</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Score</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Result</th>
                  <th className="px-3 py-2.5 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {(attempts ?? []).map((attempt) => (
                  <tr key={attempt.id} className="border-border border-t">
                    <td className="px-3 py-2.5">
                      {attempt.quizzes?.recipes?.title ?? "Lesson"}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">
                      #{attempt.attempt_number}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {attempt.score}/{attempt.total_items} (
                      {Math.round(Number(attempt.percentage))}%)
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 font-semibold",
                          attempt.passed ? "text-brand-green" : "text-destructive",
                        )}
                      >
                        {attempt.passed ? (
                          <>
                            <Check className="size-4" aria-hidden />
                            Passed
                          </>
                        ) : (
                          <>
                            <X className="size-4" aria-hidden />
                            Not yet
                          </>
                        )}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-3 py-2.5">
                      {new Date(attempt.submitted_at).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4 text-center">
        <p className="text-2xl font-extrabold tabular-nums">{value}</p>
        <p className="text-muted-foreground text-xs font-semibold">{label}</p>
      </CardContent>
    </Card>
  );
}

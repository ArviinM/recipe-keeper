import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Results" };

export default async function ResultsPage() {
  await requireStaff();
  const supabase = await createClient();

  const [{ data: attempts }, { data: profiles }, { data: sections }] =
    await Promise.all([
      supabase
        .from("attempts")
        .select("student_id, quiz_id, score, total_items, percentage, passed, attempt_number, submitted_at, quizzes(title, recipes(title))")
        .order("submitted_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, section_id, role"),
      supabase.from("sections").select("id, grade_level, name"),
    ]);

  const students = new Map((profiles ?? []).filter((p) => p.role === "student").map((p) => [p.id, p]));
  const sectionById = new Map((sections ?? []).map((s) => [s.id, s]));

  // Best attempt per student per quiz — the number that represents what they
  // actually learned, with retakes counted separately.
  const best = new Map<string, { pct: number; score: number; total: number; attempts: number }>();
  for (const attempt of attempts ?? []) {
    const key = `${attempt.student_id}:${attempt.quiz_id}`;
    const pct = Number(attempt.percentage);
    const current = best.get(key);
    if (!current) {
      best.set(key, { pct, score: attempt.score, total: attempt.total_items, attempts: 1 });
    } else {
      current.attempts += 1;
      if (pct > current.pct) {
        current.pct = pct;
        current.score = attempt.score;
        current.total = attempt.total_items;
      }
    }
  }

  const rows = [...best.entries()]
    .map(([key, value]) => {
      const [studentId, quizId] = key.split(":");
      const student = students.get(studentId);
      const attempt = (attempts ?? []).find(
        (a) => a.student_id === studentId && a.quiz_id === quizId,
      );
      const section = student?.section_id ? sectionById.get(student.section_id) : null;
      return {
        studentName: student?.full_name ?? "Unknown",
        section: section ? `Grade ${section.grade_level} – ${section.name}` : "No section",
        lesson: attempt?.quizzes?.recipes?.title ?? "Lesson",
        ...value,
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName) || a.lesson.localeCompare(b.lesson));

  const overallAverage = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.pct, 0) / rows.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Results</h1>
          <p className="text-muted-foreground text-sm">
            Best score per student, per lesson. Every attempt is kept.
          </p>
        </div>

        {rows.length > 0 && (
          <Button asChild variant="outline" className="h-11 font-semibold">
            <Link href="/admin/results/export" prefetch={false}>
              <Download aria-hidden />
              Download CSV
            </Link>
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <p className="font-semibold">No results yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Scores appear here as soon as students start taking quizzes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Results recorded" value={String(rows.length)} />
            <Stat label="Students with scores" value={String(new Set(rows.map((r) => r.studentName)).size)} />
            <Stat label="Overall average" value={`${overallAverage}%`} />
          </div>

          {/* Wide table scrolls inside its own container so the page never
              scrolls sideways on a phone. */}
          <div className="border-border overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="bg-muted/60">
                <tr className="text-left">
                  <Th>Student</Th>
                  <Th>Section</Th>
                  <Th>Lesson</Th>
                  <Th className="text-right">Best score</Th>
                  <Th className="text-right">Attempts</Th>
                  <Th className="w-32">Percentage</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="border-border border-t">
                    <Td className="font-semibold">{row.studentName}</Td>
                    <Td className="text-muted-foreground">{row.section}</Td>
                    <Td>{row.lesson}</Td>
                    <Td className="text-right tabular-nums">
                      {row.score}/{row.total}
                    </Td>
                    <Td className="text-right tabular-nums">{row.attempts}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Progress value={row.pct} className="h-2 flex-1" />
                        <span className="w-10 shrink-0 text-right font-semibold tabular-nums">
                          {Math.round(row.pct)}%
                        </span>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
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

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2.5 font-semibold ${className ?? ""}`}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 ${className ?? ""}`}>{children}</td>;
}

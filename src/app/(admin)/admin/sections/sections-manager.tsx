"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createSection, deleteSection } from "./actions";

type Section = {
  id: string;
  grade_level: number;
  name: string;
  school_year: string;
  studentCount: number;
  isMine: boolean;
};

export function SectionsManager({
  isAdmin,
  sections,
}: {
  isAdmin: boolean;
  sections: Section[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Sections</h1>
          <p className="text-muted-foreground text-sm">
            Class sections students choose when they register.
          </p>
        </div>
        {!adding && (
          <Button className="h-11 font-bold" onClick={() => setAdding(true)}>
            <Plus aria-hidden />
            Add section
          </Button>
        )}
      </div>

      {error && <p className="text-destructive text-sm font-semibold">{error}</p>}

      {adding && (
        <Card>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-[7rem_1fr_9rem_auto] sm:items-end"
              action={(formData) => {
                setError(null);
                startTransition(async () => {
                  const result = await createSection({
                    gradeLevel: Number(formData.get("gradeLevel") ?? 9),
                    name: String(formData.get("name") ?? ""),
                    schoolYear: String(formData.get("schoolYear") ?? ""),
                    assignToMe: true,
                  });
                  if (result.ok) setAdding(false);
                  else setError(result.error ?? "Could not create the section.");
                });
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="gradeLevel">Grade</Label>
                <Input
                  id="gradeLevel"
                  name="gradeLevel"
                  type="number"
                  min={7}
                  max={12}
                  defaultValue={9}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Section name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Sampaguita"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="schoolYear">School year</Label>
                <Input
                  id="schoolYear"
                  name="schoolYear"
                  defaultValue="2026-2027"
                  className="h-11"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="h-11 font-bold" disabled={pending}>
                  {pending ? "Saving…" : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11"
                  onClick={() => setAdding(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-semibold">No sections yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Add your class sections so students can pick theirs when they
              register.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {sections.map((section) => (
            <li key={section.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">
                        Grade {section.grade_level} – {section.name}
                      </p>
                      {section.isMine && <Badge variant="secondary">Mine</Badge>}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {section.school_year} · {section.studentCount} student
                      {section.studentCount === 1 ? "" : "s"}
                    </p>
                  </div>

                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={pending || section.studentCount > 0}
                      title={
                        section.studentCount > 0
                          ? "Move the students out of this section first"
                          : undefined
                      }
                      onClick={() => {
                        setError(null);
                        startTransition(async () => {
                          const result = await deleteSection(section.id);
                          if (!result.ok) setError(result.error ?? "Could not delete.");
                        });
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Delete
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

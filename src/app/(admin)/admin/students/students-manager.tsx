"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { KeyRound, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/forms/field-error";

import { createAccount, resetPassword, setStudentSection } from "./actions";

type Person = {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: "admin" | "teacher" | "student";
  section_id: string | null;
  must_change_password: boolean;
};

type Section = { id: string; grade_level: number; name: string };

export function StudentsManager({
  canCreateStaff,
  people,
  sections,
}: {
  canCreateStaff: boolean;
  people: Person[];
  sections: Section[];
}) {
  const [credentials, setCredentials] = useState<{
    username: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);

  const sectionLabel = (id: string | null) => {
    const section = sections.find((s) => s.id === id);
    return section ? `Grade ${section.grade_level} – ${section.name}` : "No section";
  };

  const students = people.filter((p) => p.role === "student");
  const staff = people.filter((p) => p.role !== "student");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Students</h1>
          <p className="text-muted-foreground text-sm">
            Create accounts for your class and reset passwords when students
            forget them.
          </p>
        </div>

        <NewAccountDialog
          sections={sections}
          canCreateStaff={canCreateStaff}
          onCreated={setCredentials}
        />
      </div>

      {credentials && (
        <CredentialsCard
          credentials={credentials}
          onDismiss={() => setCredentials(null)}
        />
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">
          Students <span className="text-muted-foreground font-normal">({students.length})</span>
        </h2>

        {students.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="font-semibold">No students yet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Add accounts here, or let students register themselves.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {students.map((person) => (
              <PersonRow
                key={person.id}
                person={person}
                sections={sections}
                sectionLabel={sectionLabel(person.section_id)}
                onReset={(temporaryPassword) =>
                  setCredentials({
                    username: person.username,
                    email: person.email,
                    temporaryPassword,
                  })
                }
              />
            ))}
          </ul>
        )}
      </section>

      {staff.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Teachers and administrators</h2>
          <ul className="space-y-2">
            {staff.map((person) => (
              <li key={person.id}>
                <Card>
                  <CardContent className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{person.full_name}</p>
                      <p className="text-muted-foreground truncate text-sm">
                        @{person.username}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {person.role}
                    </Badge>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function PersonRow({
  person,
  sections,
  sectionLabel,
  onReset,
}: {
  person: Person;
  sections: Section[];
  sectionLabel: string;
  onReset: (temporaryPassword: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <li>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/admin/students/${person.id}`}
                className="truncate font-semibold underline-offset-4 hover:underline"
              >
                {person.full_name}
              </Link>
              {person.must_change_password && (
                <Badge variant="outline" className="text-xs">
                  New password pending
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground truncate text-sm">
              @{person.username} · {sectionLabel}
            </p>
            <p className="text-muted-foreground text-xs">
              Tap the name to see their progress.
            </p>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>

          <select
            defaultValue={person.section_id ?? ""}
            onChange={(event) => {
              const value = event.target.value || null;
              startTransition(async () => {
                const result = await setStudentSection(person.id, value);
                if (!result.ok) setError(result.error ?? "Could not update section.");
              });
            }}
            disabled={pending}
            aria-label={`Section for ${person.full_name}`}
            className="border-input bg-background h-10 rounded-md border px-2 text-sm"
          >
            <option value="">No section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                Grade {section.grade_level} – {section.name}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await resetPassword(person.id);
                if (result.ok && result.temporaryPassword) {
                  onReset(result.temporaryPassword);
                } else {
                  setError(result.error ?? "Could not reset the password.");
                }
              });
            }}
          >
            <KeyRound className="size-4" aria-hidden />
            Reset password
          </Button>
        </CardContent>
      </Card>
    </li>
  );
}

function CredentialsCard({
  credentials,
  onDismiss,
}: {
  credentials: { username: string; email: string; temporaryPassword: string };
  onDismiss: () => void;
}) {
  return (
    // Shown once and never stored in readable form again, so the teacher has to
    // write it down or hand it over now.
    <Card className="border-brand-green/40 bg-accent">
      <CardContent className="space-y-3">
        <h2 className="font-bold">Give these details to the student</h2>
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Username</dt>
            <dd className="font-mono font-bold">{credentials.username}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Email</dt>
            <dd className="font-mono break-all">{credentials.email}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Temporary password</dt>
            <dd className="font-mono text-base font-bold">
              {credentials.temporaryPassword}
            </dd>
          </div>
        </dl>
        <p className="text-muted-foreground text-sm">
          Write this down now — it is not shown again. The student will be asked
          to choose their own password when they sign in.
        </p>
        <Button variant="secondary" size="sm" onClick={onDismiss}>
          Done
        </Button>
      </CardContent>
    </Card>
  );
}

function NewAccountDialog({
  sections,
  canCreateStaff,
  onCreated,
}: {
  sections: Section[];
  canCreateStaff: boolean;
  onCreated: (credentials: {
    username: string;
    email: string;
    temporaryPassword: string;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 font-bold">
          <UserPlus aria-hidden />
          Add account
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add an account</DialogTitle>
          <DialogDescription>
            We will generate a temporary password for you to hand over.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          action={(formData) => {
            setError(null);
            setFieldErrors({});
            startTransition(async () => {
              const result = await createAccount({
                fullName: String(formData.get("fullName") ?? ""),
                email: String(formData.get("email") ?? ""),
                username: String(formData.get("username") ?? ""),
                sectionId: String(formData.get("sectionId") ?? "") || null,
                role: (String(formData.get("role") ?? "student") ||
                  "student") as Person["role"],
              });

              if (result.ok && result.credentials) {
                onCreated(result.credentials);
                setOpen(false);
              } else {
                setFieldErrors(result.fieldErrors ?? {});
                setError(result.error ?? null);
              }
            });
          }}
        >
          {error && <p className="text-destructive text-sm font-semibold">{error}</p>}

          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" required className="h-11" />
            <FieldError message={fieldErrors.fullName} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="h-11" />
            <FieldError message={fieldErrors.email} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" required className="h-11" />
            <FieldError message={fieldErrors.username} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sectionId">Grade level and section</Label>
            <select
              id="sectionId"
              name="sectionId"
              className="border-input bg-background h-11 w-full rounded-md border px-3"
            >
              <option value="">No section</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  Grade {section.grade_level} – {section.name}
                </option>
              ))}
            </select>
          </div>

          {canCreateStaff && (
            <div className="space-y-1.5">
              <Label htmlFor="role">Account type</Label>
              <select
                id="role"
                name="role"
                defaultValue="student"
                className="border-input bg-background h-11 w-full rounded-md border px-3"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          )}

          <Button type="submit" className="h-11 w-full font-bold" disabled={pending}>
            {pending ? "Creating…" : "Create account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

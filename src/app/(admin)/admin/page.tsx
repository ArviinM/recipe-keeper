import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ChartColumn, GraduationCap, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { firstName, requireStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  const staff = await requireStaff();
  const supabase = await createClient();

  const [recipes, profiles, sections, attempts] = await Promise.all([
    supabase.from("recipes").select("id, is_published"),
    supabase.from("profiles").select("id, role"),
    supabase.from("sections").select("id"),
    supabase.from("attempts").select("id, percentage"),
  ]);

  const published = (recipes.data ?? []).filter((r) => r.is_published).length;
  const drafts = (recipes.data ?? []).length - published;
  const students = (profiles.data ?? []).filter((p) => p.role === "student").length;
  const average = attempts.data?.length
    ? Math.round(
        attempts.data.reduce((sum, a) => sum + Number(a.percentage), 0) /
          attempts.data.length,
      )
    : null;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Welcome, {firstName(staff.fullName)}
        </h1>
        <p className="text-muted-foreground text-sm">
          Everything you need to run the Cookery module.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Published lessons" value={String(published)} hint={drafts ? `${drafts} draft${drafts > 1 ? "s" : ""}` : undefined} />
        <Stat label="Students" value={String(students)} />
        <Stat label="Sections" value={String((sections.data ?? []).length)} />
        <Stat label="Average score" value={average === null ? "—" : `${average}%`} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ActionCard
          href="/admin/recipes"
          icon={BookOpen}
          title="Recipes"
          body="Add a lesson, write the procedure, build its quiz, then publish it."
        />
        <ActionCard
          href="/admin/students"
          icon={Users}
          title="Students"
          body="Create accounts, assign sections, and reset forgotten passwords."
        />
        <ActionCard
          href="/admin/sections"
          icon={GraduationCap}
          title="Sections"
          body="Set up the class sections students pick when they register."
        />
        <ActionCard
          href="/admin/results"
          icon={ChartColumn}
          title="Results"
          body="See every score, and download the data as a spreadsheet."
        />
      </div>

      {published === 0 && (
        <Card className="border-brand-wood/40 bg-brand-cream">
          <CardContent className="space-y-3">
            <h2 className="font-bold">Start here</h2>
            <p className="text-sm leading-relaxed">
              Nothing is published yet, so students see an empty library. Create
              your first lesson — you can save as you go and publish only when
              you are happy with it.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="font-bold">
                <Link href="/admin/recipes">Go to Recipes</Link>
              </Button>
              <Button asChild variant="outline" className="font-bold">
                <Link href="/admin/guide">Read the guide</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="py-5 text-center">
        <p className="text-3xl font-extrabold tabular-nums">{value}</p>
        <p className="text-muted-foreground text-xs font-semibold">{label}</p>
        {hint && <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardContent className="flex gap-3">
          <span className="bg-secondary text-secondary-foreground flex size-11 shrink-0 items-center justify-center rounded-xl">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold">{title}</h2>
            <p className="text-muted-foreground text-sm">{body}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

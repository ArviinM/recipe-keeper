import type { Metadata } from "next";
import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { isStaff, requireUser } from "@/lib/auth";
import { LanguageSwitcher } from "@/components/student/language-switcher";
import { dictionary } from "@/lib/i18n/dictionary";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const t = dictionary(user.locale);
  const supabase = await createClient();

  const { data: section } = user.sectionId
    ? await supabase
        .from("sections")
        .select("grade_level, name")
        .eq("id", user.sectionId)
        .maybeSingle()
    : { data: null };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">{t.navProfile}</h1>
      </header>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="bg-secondary text-secondary-foreground flex size-16 items-center justify-center rounded-full text-xl font-extrabold">
              {user.fullName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{user.fullName}</p>
              <p className="text-muted-foreground truncate text-sm">
                @{user.username}
              </p>
            </div>
          </div>

          <Separator />

          <dl className="space-y-3 text-sm">
            <Row label={t.email} value={user.email} />
            {/* Grade and section only mean something for a student. */}
            {!isStaff(user.role) && (
              <Row
                label={t.gradeAndSection}
                value={
                  section
                    ? `Grade ${section.grade_level} – ${section.name}`
                    : t.notSetYet
                }
              />
            )}
            <Row label={t.role} value={user.role} capitalize />
          </dl>
        </CardContent>
      </Card>

      {isStaff(user.role) && (
        <Button asChild variant="secondary" className="h-12 w-full font-bold">
          <Link href="/admin">
            <ShieldCheck aria-hidden />
            Open Teacher Dashboard
          </Link>
        </Button>
      )}

      <Card>
        <CardContent className="space-y-3">
          <h2 className="font-bold">{t.language}</h2>
          <p className="text-muted-foreground text-sm">{t.languageHint}</p>
          <LanguageSwitcher current={user.locale} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {isStaff(user.role)
              ? "You can change your own password here at any time."
              : "Forgot your password or need to change your section? Ask your teacher — they can update it for you."}
          </p>
          <Button asChild variant="outline" className="h-11 w-full font-semibold">
            <Link href="/change-password">{t.changeMyPassword}</Link>
          </Button>
        </CardContent>
      </Card>

      <form action={signOut}>
        <SubmitButton
          variant="outline"
          className="text-destructive h-12 w-full font-bold"
          pendingLabel="Signing out…"
        >
          <LogOut aria-hidden />
          {t.signOut}
        </SubmitButton>
      </form>
    </div>
  );
}

function Row({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className={`truncate font-semibold ${capitalize ? "capitalize" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

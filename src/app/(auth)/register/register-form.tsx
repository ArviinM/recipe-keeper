"use client";

import Link from "next/link";
import { useActionState } from "react";

import { register, type FormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";

type Section = { id: string; grade_level: number; name: string };

const initialState: FormState = {};

export function RegisterForm({ sections }: { sections: Section[] }) {
  const [state, formAction] = useActionState(register, initialState);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-5" noValidate>
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-base">
              Full name
            </Label>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              required
              className="h-12"
              aria-describedby="fullName-error"
            />
            <FieldError id="fullName-error" message={state.fieldErrors?.fullName} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              required
              className="h-12"
              aria-describedby="email-error"
            />
            <FieldError id="email-error" message={state.fieldErrors?.email} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-base">
              Username
            </Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              required
              className="h-12"
              aria-describedby="username-error username-hint"
            />
            <p id="username-hint" className="text-muted-foreground text-sm">
              This is what you will use to sign in.
            </p>
            <FieldError id="username-error" message={state.fieldErrors?.username} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sectionId" className="text-base">
              Grade level and section
            </Label>
            {/* A plain select, not a custom dropdown: it uses the phone's own
                native picker, which every student already knows how to use. */}
            <select
              id="sectionId"
              name="sectionId"
              defaultValue=""
              className="border-input bg-background ring-offset-background focus-visible:ring-ring h-12 w-full rounded-md border px-3 text-base focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <option value="">I&apos;m not sure yet</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  Grade {section.grade_level} – {section.name}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground text-sm">
              Your teacher can set this for you later.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-base">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="h-12"
              aria-describedby="password-error password-hint"
            />
            <p id="password-hint" className="text-muted-foreground text-sm">
              At least 8 characters.
            </p>
            <FieldError id="password-error" message={state.fieldErrors?.password} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-base">
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="h-12"
              aria-describedby="confirmPassword-error"
            />
            <FieldError
              id="confirmPassword-error"
              message={state.fieldErrors?.confirmPassword}
            />
          </div>

          <SubmitButton className="h-13 w-full text-base font-bold">
            Create Account
          </SubmitButton>

          <p className="text-muted-foreground text-center text-xs leading-relaxed">
            We only collect your name, email, username, and section. This
            information is used for your Cookery lessons and results only.
          </p>
        </form>
      </CardContent>

      <div className="border-border/70 border-t px-6 py-4 text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Button asChild variant="link" className="h-auto p-0 font-semibold">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </Card>
  );
}

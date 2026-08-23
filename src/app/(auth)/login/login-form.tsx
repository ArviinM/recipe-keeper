"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";

import { signIn, type FormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: FormState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signIn, initialState);

  // Reaching the sign-in screen means the previous session is over. Wipe the
  // offline cache so a lesson opened by one student is not left sitting on a
  // shared classroom phone for the next one.
  useEffect(() => {
    navigator.serviceWorker?.ready
      .then((registration) => registration.active?.postMessage("clear-caches"))
      .catch(() => {});
  }, []);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-5" noValidate>
          <input type="hidden" name="next" value={next} />

          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="identifier" className="text-base">
              Username or email
            </Label>
            <Input
              id="identifier"
              name="identifier"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              required
              className="h-12"
              aria-describedby="identifier-error"
            />
            <FieldError id="identifier-error" message={state.fieldErrors?.identifier} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-base">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-12"
              aria-describedby="password-error"
            />
            <FieldError id="password-error" message={state.fieldErrors?.password} />
          </div>

          <SubmitButton className="h-13 w-full text-base font-bold">
            Sign In
          </SubmitButton>

          <p className="text-muted-foreground text-center text-sm">
            Forgot your password? Ask your teacher to reset it for you.
          </p>
        </form>
      </CardContent>

      <div className="border-border/70 border-t px-6 py-4 text-center text-sm">
        <span className="text-muted-foreground">Don&apos;t have an account? </span>
        <Button asChild variant="link" className="h-auto p-0 font-semibold">
          <Link href="/register">Register</Link>
        </Button>
      </div>
    </Card>
  );
}

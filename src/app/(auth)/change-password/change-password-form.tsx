"use client";

import Link from "next/link";
import { useActionState } from "react";

import { changePassword, type FormState } from "../actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/forms/field-error";
import { SubmitButton } from "@/components/forms/submit-button";

const initialState: FormState = {};

export function ChangePasswordForm({ required }: { required: boolean }) {
  const [state, formAction] = useActionState(changePassword, initialState);

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold tracking-tight">
            Choose your password
          </h1>
          <p className="text-muted-foreground text-sm">
            {required
              ? "Your teacher gave you a temporary password. Pick your own now so only you know it."
              : "Pick a new password for your account."}
          </p>
        </div>

        <form action={formAction} className="space-y-4" noValidate>
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="text-base">
              New password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="h-12"
            />
            <p className="text-muted-foreground text-sm">At least 8 characters.</p>
            <FieldError message={state.fieldErrors?.password} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-base">
              Confirm new password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="h-12"
            />
            <FieldError message={state.fieldErrors?.confirmPassword} />
          </div>

          <SubmitButton className="h-13 w-full text-base font-bold">
            Save Password
          </SubmitButton>

          {!required && (
            <Button asChild variant="ghost" className="w-full">
              <Link href="/profile">Cancel</Link>
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

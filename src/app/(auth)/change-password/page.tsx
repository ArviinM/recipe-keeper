import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";

import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Choose a Password" };

export default async function ChangePasswordPage() {
  const user = await requireUser();
  return <ChangePasswordForm required={user.mustChangePassword} />;
}

import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage() {
  const supabase = await createClient();

  // Narrow RPC rather than a table read: an anonymous visitor may see section
  // names for the dropdown, nothing else.
  const { data } = await supabase.rpc("list_sections_for_registration");

  return <RegisterForm sections={data ?? []} />;
}

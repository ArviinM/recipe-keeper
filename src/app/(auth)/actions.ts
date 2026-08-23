"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, landingPathFor } from "@/lib/auth";
import { loginSchema, registerSchema, passwordSchema } from "@/lib/validation/auth";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Resolves a username to its email.
 *
 * Deliberately server-only: a public username -> email lookup would let anyone
 * harvest the email addresses of minors by guessing usernames.
 */
async function resolveIdentifier(identifier: string): Promise<string | null> {
  if (identifier.includes("@")) return identifier;

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("email")
    .eq("username", identifier)
    .maybeSingle();

  return data?.email ?? null;
}

export async function signIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const email = await resolveIdentifier(parsed.data.identifier);

  // Same message whether the account is missing or the password is wrong, so
  // the form cannot be used to discover which usernames exist.
  const genericError =
    "We could not sign you in. Please check your username and password.";

  if (!email) return { error: genericError };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) return { error: genericError };

  const requested = String(formData.get("next") ?? "");
  revalidatePath("/", "layout");

  if (requested.startsWith("/") && requested !== "/home") redirect(requested);

  const profile = await getCurrentUser();
  redirect(profile ? landingPathFor(profile.role) : "/home");
}

export async function register(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    username: formData.get("username"),
    sectionId: formData.get("sectionId") ?? "",
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const { fullName, email, username, sectionId, password } = parsed.data;

  const supabase = await createClient();

  const { data: available } = await supabase.rpc("username_available", {
    p_username: username,
  });
  if (available === false) {
    return {
      fieldErrors: {
        username: "That username is already taken. Please choose another.",
      },
    };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Read by the handle_new_user trigger. Role is NOT taken from here —
      // app_metadata is the only trusted source for privilege.
      data: {
        full_name: fullName,
        username,
        section_id: sectionId || "",
      },
    },
  });

  if (error) {
    if (/already registered|already been registered/i.test(error.message)) {
      return {
        fieldErrors: {
          email: "That email already has an account. Try signing in instead.",
        },
      };
    }
    if (/duplicate key|unique/i.test(error.message)) {
      return {
        fieldErrors: {
          username: "That username is already taken. Please choose another.",
        },
      };
    }
    return { error: "We could not create your account. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/home");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Also clears must_change_password, which is what releases a pre-created
 * account from the forced change screen.
 */
export async function changePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { fieldErrors: { password: parsed.error.issues[0].message } };
  }
  if (password !== confirmPassword) {
    return { fieldErrors: { confirmPassword: "The two passwords do not match." } };
  }

  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "We could not save that password. Please try again." };
  }

  await supabase
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", userData.user.id);

  revalidatePath("/", "layout");
  redirect("/home");
}

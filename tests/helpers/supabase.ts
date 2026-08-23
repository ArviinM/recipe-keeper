import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function requireEnv() {
  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    !serviceKey && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(
      `Integration tests need ${missing.join(", ")} in .env.local. ` +
        `Find them in Supabase → Settings → API Keys.`,
    );
  }
}

/** Bypasses RLS. Used only to build and tear down fixtures. */
export function adminClient(): SupabaseClient {
  requireEnv();
  return createClient(url!, serviceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** An unauthenticated client, exactly what a stranger with the public key has. */
export function anonClient(): SupabaseClient {
  requireEnv();
  return createClient(url!, anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type TestUser = {
  id: string;
  email: string;
  password: string;
  username: string;
  client: SupabaseClient;
};

/**
 * Creates a real auth user and returns a client signed in as them, so tests
 * exercise the same code path a phone in a classroom would.
 */
export async function createTestUser(opts: {
  role: "admin" | "teacher" | "student";
  fullName: string;
  username: string;
  sectionId?: string | null;
}): Promise<TestUser> {
  const admin = adminClient();
  const email = `${opts.username}@recipekeeper.test`;
  const password = `Test-${crypto.randomUUID().slice(0, 12)}!`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: opts.fullName,
      username: opts.username,
      section_id: opts.sectionId ?? "",
    },
    // The profile trigger reads role from app_metadata, which only the service
    // role can set. user_metadata is attacker-controlled and must never be
    // trusted for privilege.
    app_metadata: { role: opts.role },
  });
  if (error) throw error;

  const client = anonClient();
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;

  return { id: data.user.id, email, password, username: opts.username, client };
}

export async function deleteTestUsers(ids: string[]) {
  const admin = adminClient();
  for (const id of ids) {
    await admin.auth.admin.deleteUser(id).catch(() => {});
  }
}

/** Short unique suffix so concurrent runs never collide on unique columns. */
export function uid(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

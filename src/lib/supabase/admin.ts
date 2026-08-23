import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { env, serviceRoleKey } from "@/lib/env";
import type { Database } from "@/lib/database.types";

/**
 * Service-role client. Bypasses row level security entirely.
 *
 * Only for privileged server-side work that the anon key genuinely cannot do:
 * creating accounts on behalf of an admin/teacher, and resetting passwords.
 * Every caller MUST verify the caller's own role first — this client will
 * happily do anything it is asked.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(env.supabaseUrl, serviceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

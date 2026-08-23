import { createClient } from "@supabase/supabase-js";

/**
 * Keeps the free-tier Supabase project awake.
 *
 * Free projects pause after roughly a week without activity. This module is
 * built months before it is defended, so without a weekly ping the database
 * would be asleep on the one day it has to work. Vercel calls this on a
 * schedule; see vercel.json.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Vercel signs its cron calls; CRON_SECRET stops anyone else hitting this.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new Response("Not authorised", { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return Response.json({ ok: false, error: "Supabase is not configured" }, { status: 500 });
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // A trivial read is enough to count as activity.
  const { error } = await supabase.from("categories").select("id").limit(1);

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, checkedAt: new Date().toISOString() });
}

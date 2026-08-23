import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import type { Database } from "@/lib/database.types";

/**
 * Routes a signed-out visitor may reach.
 *
 * /api/keep-alive is here because Vercel's cron calls it with no session: left
 * out, it was redirected to /login and the weekly ping never ran, which would
 * have let the free-tier database pause before the defense. The route
 * authenticates itself with CRON_SECRET.
 */
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/offline",
  "/api/keep-alive",
  // Browsers refuse to register a worker that was redirected, so a signed-out
  // visitor could never install the app to their home screen.
  "/sw.js",
];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.includes(pathname);
}

/**
 * Refreshes the auth cookie on every request and keeps signed-out visitors out
 * of the app. Roles are enforced again in the layouts and by row level
 * security — this is only the first gate, never the only one.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser revalidates the token with Supabase. getSession would trust
  // whatever the cookie claims, which is not safe to gate routes on.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Send them back where they were headed once they sign in.
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

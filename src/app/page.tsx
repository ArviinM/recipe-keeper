import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getCurrentUser, landingPathFor } from "@/lib/auth";
import { site } from "@/lib/site";

export default async function SplashPage() {
  const user = await getCurrentUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-between px-6 py-12">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <Logo size={168} priority />

        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="text-brand-pink">Recipe</span>{" "}
            <span className="text-brand-green">Keeper</span>
          </h1>
          <p className="text-muted-foreground text-balance text-base">
            {site.subtitle}
          </p>
        </div>

        <p className="text-foreground/80 max-w-xs text-balance text-lg font-semibold">
          {site.tagline}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <Button asChild size="lg" className="h-14 w-full text-base font-bold">
          <Link href={user ? landingPathFor(user.role) : "/login"}>
            {user ? "Continue" : "Get Started"}
          </Link>
        </Button>

        {!user && (
          <p className="text-muted-foreground text-center text-sm">
            New here?{" "}
            <Link
              href="/register"
              className="text-primary font-semibold underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
        )}

        <p className="text-muted-foreground pt-4 text-center text-xs">
          {site.schoolName}
        </p>
      </div>
    </main>
  );
}

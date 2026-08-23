"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Without this, any hiccup drops the user on Next.js's raw crash screen — no
 * explanation and no way back. The people using this are a teacher and Grade 9
 * students with nobody to ask.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Recipe Keeper error:", error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-4 py-10 text-center">
          <h1 className="text-xl font-extrabold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-muted-foreground text-balance text-sm">
            Nothing has been lost. Try again, and if it keeps happening, check
            your internet connection.
          </p>
          <Button onClick={reset} className="h-12 w-full font-bold">
            <RefreshCw aria-hidden />
            Try again
          </Button>
          <Button asChild variant="ghost" className="w-full font-semibold">
            <a href="/">Go to the start</a>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

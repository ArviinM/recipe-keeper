import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "No Connection" };

export default function OfflinePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-4 py-10 text-center">
          <span className="bg-secondary text-secondary-foreground mx-auto flex size-16 items-center justify-center rounded-full">
            <WifiOff className="size-7" aria-hidden />
          </span>

          <div className="space-y-1">
            <h1 className="text-xl font-extrabold tracking-tight">
              You are offline
            </h1>
            <p className="text-muted-foreground text-balance text-sm">
              Lessons you have already opened are still available. Anything else
              needs a connection.
            </p>
          </div>

          <Button asChild className="h-12 w-full font-bold">
            <Link href="/recipes">Try again</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

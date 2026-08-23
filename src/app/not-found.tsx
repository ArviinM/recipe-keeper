import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-4 py-10 text-center">
          <span className="bg-secondary text-secondary-foreground mx-auto flex size-14 items-center justify-center rounded-full">
            <Compass className="size-6" aria-hidden />
          </span>
          <h1 className="text-xl font-extrabold tracking-tight">
            We can&apos;t find that page
          </h1>
          <p className="text-muted-foreground text-balance text-sm">
            The link may be out of date, or the lesson may not be published yet.
          </p>
          <Button asChild className="h-12 w-full font-bold">
            <Link href="/recipes">Go to the lessons</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

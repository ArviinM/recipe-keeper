import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import { AdminSidebar, AdminTabs } from "@/components/admin/admin-nav";
import { Wordmark } from "@/components/brand/logo";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireStaff();

  if (user.mustChangePassword) redirect("/change-password");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="bg-card border-border sticky top-0 z-40 border-b">
        <div className="flex h-14 items-center gap-3 px-4">
          <Button asChild variant="ghost" size="icon" className="size-9 md:hidden">
            <Link href="/home" aria-label="Back to the student view">
              <ArrowLeft />
            </Link>
          </Button>

          <Wordmark className="text-lg" />

          <span className="text-muted-foreground hidden text-sm md:inline">
            Teacher Dashboard
          </span>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-muted-foreground hidden text-sm sm:inline">
              {user.fullName}
            </span>
            <form action={signOut}>
              <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                Sign out
              </SubmitButton>
            </form>
          </div>
        </div>
      </header>

      {/* Stacked above the content on mobile. Rendering it inside the flex row
          below turned it into a second column and crushed the page. */}
      <AdminTabs />

      <div className="flex flex-1">
        <AdminSidebar />
        <main className="min-w-0 flex-1 px-4 py-5 md:px-6">
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

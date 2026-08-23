import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { BottomNav } from "@/components/student/bottom-nav";
import { isStaff, requireUser } from "@/lib/auth";

export default async function StudentLayout({ children }: LayoutProps<"/">) {
  // Row level security is the real boundary; this just avoids rendering a
  // signed-out shell before the redirect lands.
  const user = await requireUser();

  // A pre-created account still holds the temporary password the teacher read
  // aloud, so nothing else opens until the student picks their own.
  if (user.mustChangePassword) redirect("/change-password");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {/* Staff only reach these screens by previewing a lesson, so give them an
          obvious way back rather than leaving them stranded in the student app. */}
      {isStaff(user.role) && (
        <div className="bg-secondary text-secondary-foreground sticky top-0 z-40 px-4 py-2 text-sm font-semibold">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <span>Previewing as a student</span>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 underline underline-offset-4"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to dashboard
            </Link>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-6 pt-5">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

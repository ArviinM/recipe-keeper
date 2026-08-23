import { BottomNav } from "@/components/student/bottom-nav";
import { requireUser } from "@/lib/auth";

export default async function StudentLayout({ children }: LayoutProps<"/">) {
  // Row level security is the real boundary; this just avoids rendering a
  // signed-out shell before the redirect lands.
  await requireUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-6 pt-5">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

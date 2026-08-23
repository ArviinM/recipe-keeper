import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { site } from "@/lib/site";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Link href="/" aria-label="Recipe Keeper home">
            <Logo size={92} priority />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              <span className="text-brand-pink">Recipe</span>{" "}
              <span className="text-brand-green">Keeper</span>
            </h1>
            <p className="text-muted-foreground text-sm">{site.subtitle}</p>
          </div>
        </div>

        {children}
      </div>
    </main>
  );
}

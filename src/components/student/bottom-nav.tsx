"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChartColumn,
  House,
  ListChecks,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/home", label: "Home", icon: House },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/quiz", label: "Quiz", icon: ListChecks },
  { href: "/progress", label: "Progress", icon: ChartColumn },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  // Hidden inside a lesson or quiz. Those screens own the bottom of the viewport
  // with their own Back/Next bar, and a guided flow should not offer five ways
  // to wander off halfway through.
  const inFocusedFlow = /^\/recipes\/[^/]+/.test(pathname);
  if (inFocusedFlow) return null;

  return (
    <nav
      aria-label="Main"
      // pb-safe keeps the bar clear of the iPhone home indicator.
      className="bg-card/95 border-border/70 sticky bottom-0 z-40 border-t backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                // Min height 60px keeps every tap target well above the 44px
                // accessibility floor, which matters on a shared phone.
                className={cn(
                  "flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 py-2 text-xs font-semibold transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("size-6", active && "fill-primary/10")}
                  aria-hidden
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

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
import { dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n";

const TABS = [
  { href: "/home", key: "navHome", icon: House },
  { href: "/recipes", key: "navRecipes", icon: BookOpen },
  { href: "/quiz", key: "navQuiz", icon: ListChecks },
  { href: "/progress", key: "navProgress", icon: ChartColumn },
  { href: "/profile", key: "navProfile", icon: UserRound },
] as const;

export function BottomNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const t = dictionary(locale);

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
        {TABS.map(({ href, key, icon: Icon }) => {
          const label = t[key];
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

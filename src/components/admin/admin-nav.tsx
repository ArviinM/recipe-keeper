"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChartColumn,
  GraduationCap,
  LayoutGrid,
  Tags,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/admin/recipes", label: "Recipes", icon: BookOpen, exact: false },
  { href: "/admin/categories", label: "Categories", icon: Tags, exact: false },
  { href: "/admin/students", label: "Students", icon: Users, exact: false },
  { href: "/admin/sections", label: "Sections", icon: GraduationCap, exact: false },
  { href: "/admin/results", label: "Results", icon: ChartColumn, exact: false },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Desktop sidebar. Sits beside the content, so it must only ever render inside
 * the horizontal flex row — never on mobile, where it would steal a column's
 * worth of width from the page.
 */
export function AdminSidebar() {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Teacher sections"
      className="bg-sidebar border-sidebar-border hidden w-56 shrink-0 border-r p-3 md:block"
    >
      <ul className="space-y-1">
        {LINKS.map(({ href, label, icon: Icon, exact }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive(href, exact) ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors",
                isActive(href, exact)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <Icon className="size-4.5" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Mobile tab strip. Stacks full width under the header, above the content —
 * never as a sibling column of the main area.
 */
export function AdminTabs() {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Teacher sections"
      className="bg-card border-border sticky top-14 z-30 w-full overflow-x-auto border-b md:hidden"
    >
      <ul className="flex w-max gap-1.5 px-4 py-2">
        {LINKS.map(({ href, label, icon: Icon, exact }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive(href, exact) ? "page" : undefined}
              className={cn(
                "flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold transition-colors",
                isActive(href, exact)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

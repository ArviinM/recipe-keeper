"use client";

import { useTransition } from "react";

import { setLocale } from "@/app/(auth)/actions";
import { LOCALES, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * A student may read in whichever language suits them. The section's default is
 * what they start with, so a class is consistent unless someone opts out.
 */
export function LanguageSwitcher({ current }: { current: Locale }) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label="Language"
      className="bg-secondary flex gap-1 rounded-xl p-1"
    >
      {LOCALES.map((locale) => {
        const active = locale.value === current;
        return (
          <button
            key={locale.value}
            type="button"
            aria-pressed={active}
            disabled={pending}
            onClick={() => startTransition(() => setLocale(locale.value))}
            className={cn(
              "min-h-11 flex-1 rounded-lg px-3 text-sm font-bold transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {locale.label}
          </button>
        );
      })}
    </div>
  );
}

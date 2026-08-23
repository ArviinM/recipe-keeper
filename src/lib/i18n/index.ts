import type { Database } from "@/lib/database.types";

export type Locale = Database["public"]["Enums"]["app_locale"];

export const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "tl", label: "Tagalog" },
];

/**
 * Picks the reader's language, falling back to English when a translation is
 * missing.
 *
 * English is the language a lesson is written in and Tagalog is a translation
 * of it, so the fallback runs one way. That is what makes translating gradual:
 * a recipe with only half its Tagalog filled in reads as complete English for
 * the rest, never as blanks.
 */
export function pick(
  locale: Locale,
  english: string | null | undefined,
  tagalog: string | null | undefined,
): string {
  if (locale === "tl") {
    const translated = tagalog?.trim();
    if (translated) return translated;
  }
  return english?.trim() ?? "";
}

/** Same fallback for the bullet lists, which are translated as a whole. */
export function pickList(
  locale: Locale,
  english: string[] | null | undefined,
  tagalog: string[] | null | undefined,
): string[] {
  if (locale === "tl" && tagalog?.length) return tagalog;
  return english ?? [];
}

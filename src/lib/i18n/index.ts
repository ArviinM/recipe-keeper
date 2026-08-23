import type { Database } from "@/lib/database.types";

export type Locale = Database["public"]["Enums"]["app_locale"];

export const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "tl", label: "Tagalog" },
];

/**
 * Picks the reader's language, falling back to English whenever a translation
 * is missing.
 *
 * This is what makes translating gradual: a recipe with only half its Tagalog
 * filled in shows complete English for the rest, never blanks.
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
  return english ?? "";
}

/** Same fallback for the bullet lists, which are all-or-nothing per list. */
export function pickList(
  locale: Locale,
  english: string[] | null | undefined,
  tagalog: string[] | null | undefined,
): string[] {
  if (locale === "tl" && tagalog?.length) return tagalog;
  return english ?? [];
}

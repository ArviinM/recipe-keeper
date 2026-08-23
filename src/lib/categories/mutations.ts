import type { Client, MutationResult } from "@/lib/recipes/mutations";
import { slugify } from "@/lib/slug";

/**
 * The specification says the category list should be adjusted to match the
 * recipes in the research module, so it cannot stay frozen in a migration.
 */

export async function createCategory(
  supabase: Client,
  name: string,
): Promise<MutationResult> {
  const clean = name.trim();
  if (!clean) return { ok: false, error: "Enter a category name." };

  const { data: existing } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("categories").insert({
    name: clean,
    slug: slugify(clean),
    sort_order: (existing?.sort_order ?? 0) + 1,
  });

  if (error) {
    if (/duplicate|unique/i.test(error.message)) {
      return { ok: false, error: "That category already exists." };
    }
    return { ok: false, error: "Could not add the category." };
  }
  return { ok: true };
}

export async function renameCategory(
  supabase: Client,
  id: string,
  name: string,
): Promise<MutationResult> {
  const clean = name.trim();
  if (!clean) return { ok: false, error: "Enter a category name." };

  // The slug is left alone on purpose: it may already be in a link a student
  // saved, and renaming "Poultry" to "Chicken dishes" should not break it.
  const { error } = await supabase
    .from("categories")
    .update({ name: clean })
    .eq("id", id);

  return error ? { ok: false, error: "Could not rename the category." } : { ok: true };
}

export async function reorderCategories(
  supabase: Client,
  orderedIds: string[],
): Promise<MutationResult> {
  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase
      .from("categories")
      .update({ sort_order: index + 1 })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Refuses while recipes still use the category. Deleting would silently set
 * those recipes' category to null, which looks like data loss to a teacher.
 */
export async function deleteCategory(
  supabase: Client,
  id: string,
): Promise<MutationResult> {
  const { count } = await supabase
    .from("recipes")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: `Move the ${count} recipe${count === 1 ? "" : "s"} in this category first.`,
    };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  return error ? { ok: false, error: "Could not delete the category." } : { ok: true };
}

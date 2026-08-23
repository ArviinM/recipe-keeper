import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { slugify } from "@/lib/slug";
import type { Locale } from "@/lib/i18n";

/**
 * Every recipe and quiz write lives here rather than inside the server actions.
 *
 * Server actions can only run inside a Next request (they need cookies()), so
 * logic buried in them cannot be tested. These take the client as an argument,
 * which lets the test suite drive them with a real signed-in teacher and prove
 * the row level security policies at the same time.
 *
 * The actions stay as thin wrappers that check the caller's role and delegate.
 */

export type Client = SupabaseClient<Database>;
export type MutationResult = { ok: boolean; error?: string };

const ok: MutationResult = { ok: true };
const fail = (error: string): MutationResult => ({ ok: false, error });

/** Appends a counter until the slug is free. */
export async function uniqueSlug(
  supabase: Client,
  base: string,
  recipeId?: string,
): Promise<string> {
  const root = base || "untitled-recipe";

  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const { data } = await supabase
      .from("recipes")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data || data.id === recipeId) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function createRecipeDraft(
  supabase: Client,
  createdBy: string,
): Promise<{ id?: string; error?: string }> {
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      title: "Untitled recipe",
      slug: await uniqueSlug(supabase, "untitled-recipe"),
      description: "",
      is_published: false,
      created_by: createdBy,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not create the recipe" };
  return { id: data.id };
}

export async function saveRecipeBasics(
  supabase: Client,
  id: string,
  values: {
    title: string;
    categoryId: string | null;
    description: string;
    difficulty: string | null;
    servings: number | null;
    prepMinutes: number | null;
    cookMinutes: number | null;
    videoUrl: string | null;
  },
  locale: Locale = "en",
): Promise<MutationResult> {
  // Tagalog only carries the words. Category, timings, and the slug are
  // language-neutral and stay on the English pass, so switching language never
  // changes a recipe's URL.
  if (locale === "tl") {
    const { error } = await supabase
      .from("recipes")
      .update({
        title_tl: values.title.trim() || null,
        description_tl: values.description.trim() || null,
      })
      .eq("id", id);
    return error ? fail(error.message) : ok;
  }

  const title = values.title.trim() || "Untitled recipe";

  const { error } = await supabase
    .from("recipes")
    .update({
      title,
      slug: await uniqueSlug(supabase, slugify(title), id),
      category_id: values.categoryId || null,
      description: values.description,
      difficulty: values.difficulty || null,
      servings: values.servings,
      prep_minutes: values.prepMinutes,
      cook_minutes: values.cookMinutes,
      video_url: values.videoUrl?.trim() || null,
    })
    .eq("id", id);

  return error ? fail(error.message) : ok;
}

export async function saveRecipeLists(
  supabase: Client,
  id: string,
  values: { objectives?: string[]; safetyNotes?: string[]; chefTips?: string[] },
  locale: Locale = "en",
): Promise<MutationResult> {
  const suffix = locale === "tl" ? "_tl" : "";
  const patch: Record<string, string[]> = {};
  if (values.objectives) patch[`objectives${suffix}`] = values.objectives.filter((v) => v.trim());
  if (values.safetyNotes) patch[`safety_notes${suffix}`] = values.safetyNotes.filter((v) => v.trim());
  if (values.chefTips) patch[`chef_tips${suffix}`] = values.chefTips.filter((v) => v.trim());

  const { error } = await supabase
    .from("recipes")
    // The column set is chosen above; the generated types cannot follow a
    // computed key, so this cast is the narrow price of one shared function.
    .update(patch as never)
    .eq("id", id);
  return error ? fail(error.message) : ok;
}

export async function saveIngredients(
  supabase: Client,
  id: string,
  rows: { quantity: string; item: string; note: string }[],
  locale: Locale = "en",
): Promise<MutationResult> {
  // Tagalog is written onto the rows English already created, matched by
  // position, so translating never destroys the English list.
  if (locale === "tl") {
    const { data: existing } = await supabase
      .from("ingredients")
      .select("id, sort_order")
      .eq("recipe_id", id)
      .order("sort_order");

    for (const [index, row] of (existing ?? []).entries()) {
      const source = rows[index];
      const { error } = await supabase
        .from("ingredients")
        .update({
          quantity_tl: source?.quantity.trim() || null,
          item_tl: source?.item.trim() || null,
          note_tl: source?.note.trim() || null,
        })
        .eq("id", row.id);
      if (error) return fail(error.message);
    }
    return ok;
  }

  // Filter before numbering, so a blank row the teacher left behind does not
  // punch a gap in sort_order. Matches how saveSteps numbers its rows.
  const clean = rows
    .filter((row) => row.item.trim().length > 0)
    .map((row, index) => ({
      recipe_id: id,
      quantity: row.quantity.trim() || null,
      item: row.item.trim(),
      note: row.note.trim() || null,
      sort_order: index + 1,
    }));

  const { error: deleteError } = await supabase
    .from("ingredients")
    .delete()
    .eq("recipe_id", id);
  if (deleteError) return fail(deleteError.message);

  if (clean.length) {
    const { error } = await supabase.from("ingredients").insert(clean);
    if (error) return fail(error.message);
  }
  return ok;
}

export async function saveSteps(
  supabase: Client,
  id: string,
  rows: { instruction: string; imagePath: string | null }[],
  locale: Locale = "en",
): Promise<MutationResult> {
  if (locale === "tl") {
    const { data: existing } = await supabase
      .from("steps")
      .select("id, step_number")
      .eq("recipe_id", id)
      .order("step_number");

    for (const [index, row] of (existing ?? []).entries()) {
      const { error } = await supabase
        .from("steps")
        .update({ instruction_tl: rows[index]?.instruction.trim() || null })
        .eq("id", row.id);
      if (error) return fail(error.message);
    }
    return ok;
  }

  const clean = rows
    .filter((row) => row.instruction.trim().length > 0)
    .map((row, index) => ({
      recipe_id: id,
      step_number: index + 1,
      instruction: row.instruction.trim(),
      image_path: row.imagePath,
    }));

  const { error: deleteError } = await supabase
    .from("steps")
    .delete()
    .eq("recipe_id", id);
  if (deleteError) return fail(deleteError.message);

  if (clean.length) {
    const { error } = await supabase.from("steps").insert(clean);
    if (error) return fail(error.message);
  }
  return ok;
}

export async function saveTechniques(
  supabase: Client,
  id: string,
  techniqueIds: string[],
): Promise<MutationResult> {
  const { error: deleteError } = await supabase
    .from("recipe_techniques")
    .delete()
    .eq("recipe_id", id);
  if (deleteError) return fail(deleteError.message);

  if (techniqueIds.length) {
    const { error } = await supabase.from("recipe_techniques").insert(
      techniqueIds.map((techniqueId, index) => ({
        recipe_id: id,
        technique_id: techniqueId,
        sort_order: index + 1,
      })),
    );
    if (error) return fail(error.message);
  }
  return ok;
}

export async function setRecipeImage(
  supabase: Client,
  id: string,
  path: string | null,
): Promise<MutationResult> {
  const { error } = await supabase
    .from("recipes")
    .update({ image_path: path })
    .eq("id", id);
  return error ? fail(error.message) : ok;
}

export async function setRecipePublished(
  supabase: Client,
  id: string,
  published: boolean,
): Promise<MutationResult> {
  const { error } = await supabase
    .from("recipes")
    .update({ is_published: published })
    .eq("id", id);
  return error ? fail(error.message) : ok;
}

/**
 * Sets the teaching order of the lesson list.
 *
 * Recipes default to sort_order 0, so without this every lesson ties and the
 * library falls back to alphabetical — which is not the order a Cookery module
 * is taught in.
 */
export async function reorderRecipes(
  supabase: Client,
  orderedIds: string[],
): Promise<MutationResult> {
  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase
      .from("recipes")
      .update({ sort_order: index + 1 })
      .eq("id", id);
    if (error) return fail(error.message);
  }
  return ok;
}

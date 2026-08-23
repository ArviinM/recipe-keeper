import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { slugify } from "@/lib/slug";

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
    titleTl: string;
    description: string;
    descriptionTl: string;
    categoryId: string | null;
    difficulty: string | null;
    servings: number | null;
    prepMinutes: number | null;
    cookMinutes: number | null;
    videoUrl: string | null;
  },
): Promise<MutationResult> {
  // The recipe is named in English; the slug follows it, so switching the
  // language being written never changes a recipe's address.
  const title = values.title.trim() || "Untitled recipe";
  const titleTl = values.titleTl.trim();
  const slugSource = title;

  const patch: Record<string, unknown> = {
    title,
    title_tl: titleTl || null,
    description: values.description.trim(),
    description_tl: values.descriptionTl.trim() || null,
    category_id: values.categoryId || null,
    difficulty: values.difficulty || null,
    servings: values.servings,
    prep_minutes: values.prepMinutes,
    cook_minutes: values.cookMinutes,
    video_url: values.videoUrl?.trim() || null,
  };
  if (slugSource) {
    patch.slug = await uniqueSlug(supabase, slugify(slugSource), id);
  }

  const { error } = await supabase
    .from("recipes")
    .update(patch as never)
    .eq("id", id);

  return error ? fail(error.message) : ok;
}

export async function saveRecipeLists(
  supabase: Client,
  id: string,
  values: {
    objectives?: string[];
    objectivesTl?: string[];
    safetyNotes?: string[];
    safetyNotesTl?: string[];
    chefTips?: string[];
    chefTipsTl?: string[];
  },
): Promise<MutationResult> {
  const clean = (list?: string[]) => (list ?? []).filter((v) => v.trim());
  const patch: Record<string, string[]> = {};

  if (values.objectives) patch.objectives = clean(values.objectives);
  if (values.objectivesTl) patch.objectives_tl = clean(values.objectivesTl);
  if (values.safetyNotes) patch.safety_notes = clean(values.safetyNotes);
  if (values.safetyNotesTl) patch.safety_notes_tl = clean(values.safetyNotesTl);
  if (values.chefTips) patch.chef_tips = clean(values.chefTips);
  if (values.chefTipsTl) patch.chef_tips_tl = clean(values.chefTipsTl);

  const { error } = await supabase
    .from("recipes")
    .update(patch as never)
    .eq("id", id);
  return error ? fail(error.message) : ok;
}

export type BilingualIngredient = {
  id: string | null;
  quantity: string;
  item: string;
  note: string;
  quantityTl: string;
  itemTl: string;
  noteTl: string;
};

export type BilingualStep = {
  id: string | null;
  instruction: string;
  instructionTl: string;
  imagePath: string | null;
};

/**
 * Both languages are written in one call.
 *
 * English defines the list — a row exists because it has English words — and
 * Tagalog rides along on the same row. Writing the languages in separate calls
 * meant a row added in one pane was deleted by the other pane's next save,
 * because each only knew about its own copy of the list.
 */
export async function saveIngredients(
  supabase: Client,
  id: string,
  rows: BilingualIngredient[],
): Promise<MutationResult> {
  const { data: existing } = await supabase
    .from("ingredients")
    .select("id")
    .eq("recipe_id", id);

  // English defines the list, so a row without English words is not a row.
  const kept = rows.filter((row) => row.item.trim().length > 0);
  const keptIds = kept.map((r) => r.id).filter((v): v is string => Boolean(v));

  const removed = (existing ?? [])
    .map((r) => r.id)
    .filter((existingId) => !keptIds.includes(existingId));
  if (removed.length) {
    const { error } = await supabase.from("ingredients").delete().in("id", removed);
    if (error) return fail(error.message);
  }

  for (const [index, row] of kept.entries()) {
    const values = {
      quantity: row.quantity.trim() || null,
      item: row.item.trim(),
      note: row.note.trim() || null,
      quantity_tl: row.quantityTl.trim() || null,
      item_tl: row.itemTl.trim() || null,
      note_tl: row.noteTl.trim() || null,
      sort_order: index + 1,
    };

    if (row.id) {
      const { error } = await supabase
        .from("ingredients")
        .update(values)
        .eq("id", row.id);
      if (error) return fail(error.message);
    } else {
      const { error } = await supabase
        .from("ingredients")
        .insert({ recipe_id: id, ...values });
      if (error) return fail(error.message);
    }
  }

  return ok;
}

export async function saveSteps(
  supabase: Client,
  id: string,
  rows: BilingualStep[],
): Promise<MutationResult> {
  const { data: existing } = await supabase
    .from("steps")
    .select("id")
    .eq("recipe_id", id);

  const kept = rows.filter((row) => row.instruction.trim().length > 0);
  const keptIds = kept.map((r) => r.id).filter((v): v is string => Boolean(v));

  const removed = (existing ?? [])
    .map((r) => r.id)
    .filter((existingId) => !keptIds.includes(existingId));
  if (removed.length) {
    const { error } = await supabase.from("steps").delete().in("id", removed);
    if (error) return fail(error.message);
  }

  // step_number is unique per recipe, so the numbers are parked out of range
  // first — the writes are separate statements and would otherwise collide
  // part-way through a reorder.
  for (const [index, row] of kept.entries()) {
    if (!row.id) continue;
    await supabase.from("steps").update({ step_number: 1000 + index }).eq("id", row.id);
  }

  for (const [index, row] of kept.entries()) {
    const values = {
      step_number: index + 1,
      instruction: row.instruction.trim(),
      instruction_tl: row.instructionTl.trim() || null,
      image_path: row.imagePath,
    };

    if (row.id) {
      const { error } = await supabase.from("steps").update(values).eq("id", row.id);
      if (error) return fail(error.message);
    } else {
      const { error } = await supabase
        .from("steps")
        .insert({ recipe_id: id, ...values });
      if (error) return fail(error.message);
    }
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

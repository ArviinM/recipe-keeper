"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { slugify } from "@/lib/slug";

export type SaveResult = { ok: boolean; error?: string };

const ok: SaveResult = { ok: true };
const fail = (error: string): SaveResult => ({ ok: false, error });

/** Ensures the slug is unique by appending a counter when it collides. */
async function uniqueSlug(base: string, recipeId?: string) {
  const supabase = await createClient();
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

/**
 * Creates the draft immediately and sends the teacher straight into the wizard.
 *
 * Working against a real row from the first keystroke is what makes autosave
 * simple: there is never unsaved work living only in the browser.
 */
export async function createRecipeDraft() {
  const user = await requireStaff();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      title: "Untitled recipe",
      slug: await uniqueSlug("untitled-recipe"),
      description: "",
      is_published: false,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) redirect("/admin/recipes?error=create");

  revalidatePath("/admin/recipes");
  redirect(`/admin/recipes/${data.id}`);
}

export async function saveRecipeBasics(
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
): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();

  const title = values.title.trim() || "Untitled recipe";

  const { error } = await supabase
    .from("recipes")
    .update({
      title,
      slug: await uniqueSlug(slugify(title), id),
      category_id: values.categoryId || null,
      description: values.description,
      difficulty: values.difficulty || null,
      servings: values.servings,
      prep_minutes: values.prepMinutes,
      cook_minutes: values.cookMinutes,
      video_url: values.videoUrl?.trim() || null,
    })
    .eq("id", id);

  if (error) return fail(error.message);
  revalidatePath("/admin/recipes");
  return ok;
}

/** Objectives, safety reminders, and chef's tips are all plain string lists. */
export async function saveRecipeLists(
  id: string,
  values: {
    objectives?: string[];
    safetyNotes?: string[];
    chefTips?: string[];
  },
): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();

  const patch: {
    objectives?: string[];
    safety_notes?: string[];
    chef_tips?: string[];
  } = {};
  if (values.objectives) patch.objectives = values.objectives.filter((v) => v.trim());
  if (values.safetyNotes) patch.safety_notes = values.safetyNotes.filter((v) => v.trim());
  if (values.chefTips) patch.chef_tips = values.chefTips.filter((v) => v.trim());

  const { error } = await supabase.from("recipes").update(patch).eq("id", id);
  if (error) return fail(error.message);
  return ok;
}

export async function saveIngredients(
  id: string,
  rows: { quantity: string; item: string; note: string }[],
): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();

  const clean = rows
    .map((row, index) => ({
      recipe_id: id,
      quantity: row.quantity.trim() || null,
      item: row.item.trim(),
      note: row.note.trim() || null,
      sort_order: index + 1,
    }))
    .filter((row) => row.item.length > 0);

  // Replace wholesale: the list is short, and this keeps ordering honest
  // without tracking which individual rows moved.
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
  id: string,
  rows: { instruction: string; imagePath: string | null }[],
): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();

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
  id: string,
  techniqueIds: string[],
): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();

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

export async function uploadRecipeImage(
  formData: FormData,
): Promise<{ path?: string; error?: string }> {
  await requireStaff();
  const supabase = await createClient();

  const file = formData.get("file");
  const recipeId = String(formData.get("recipeId") ?? "");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo first." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "That photo is larger than 5 MB. Please choose a smaller one." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${recipeId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from("recipe-media")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { error: "We could not upload that photo. Please try again." };
  return { path };
}

export async function setRecipeImage(
  id: string,
  path: string | null,
): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("recipes")
    .update({ image_path: path })
    .eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/admin/recipes");
  return ok;
}

export async function setRecipePublished(
  id: string,
  published: boolean,
): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase
    .from("recipes")
    .update({ is_published: published })
    .eq("id", id);

  if (error) return fail(error.message);
  revalidatePath("/admin/recipes");
  revalidatePath("/recipes");
  revalidatePath("/home");
  return ok;
}

export async function deleteRecipe(id: string) {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("recipes").delete().eq("id", id);
  revalidatePath("/admin/recipes");
  redirect("/admin/recipes");
}

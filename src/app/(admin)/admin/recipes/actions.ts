"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import * as recipes from "@/lib/recipes/mutations";
import type { Locale } from "@/lib/i18n";

export type SaveResult = { ok: boolean; error?: string };

/**
 * Thin wrappers: check the caller's role, then delegate to the mutation layer
 * in src/lib/recipes/mutations.ts, which is where the logic is tested.
 */

export async function createRecipeDraft() {
  const user = await requireStaff();
  const supabase = await createClient();

  const { id, error } = await recipes.createRecipeDraft(supabase, user.id);
  if (error || !id) redirect("/admin/recipes?error=create");

  revalidatePath("/admin/recipes");
  redirect(`/admin/recipes/${id}`);
}

export async function saveRecipeBasics(
  id: string,
  values: Parameters<typeof recipes.saveRecipeBasics>[2],
  locale: Locale = "en",
): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();
  const result = await recipes.saveRecipeBasics(supabase, id, values, locale);
  if (result.ok) revalidatePath("/admin/recipes");
  return result;
}

export async function saveRecipeLists(
  id: string,
  values: Parameters<typeof recipes.saveRecipeLists>[2],
  locale: Locale = "en",
): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();
  return recipes.saveRecipeLists(supabase, id, values, locale);
}

export async function saveIngredients(
  id: string,
  rows: Parameters<typeof recipes.saveIngredients>[2],
  locale: Locale = "en",
): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();
  return recipes.saveIngredients(supabase, id, rows, locale);
}

export async function saveSteps(
  id: string,
  rows: Parameters<typeof recipes.saveSteps>[2],
  locale: Locale = "en",
): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();
  return recipes.saveSteps(supabase, id, rows, locale);
}

export async function saveTechniques(
  id: string,
  techniqueIds: string[],
): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();
  return recipes.saveTechniques(supabase, id, techniqueIds);
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
  const result = await recipes.setRecipeImage(supabase, id, path);
  if (result.ok) revalidatePath("/admin/recipes");
  return result;
}

export async function setRecipePublished(
  id: string,
  published: boolean,
): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();
  const result = await recipes.setRecipePublished(supabase, id, published);

  if (result.ok) {
    revalidatePath("/admin/recipes");
    revalidatePath("/recipes");
    revalidatePath("/home");
  }
  return result;
}

export async function reorderRecipes(orderedIds: string[]): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();
  const result = await recipes.reorderRecipes(supabase, orderedIds);

  if (result.ok) {
    revalidatePath("/admin/recipes");
    revalidatePath("/recipes");
    revalidatePath("/home");
  }
  return result;
}

export async function deleteRecipe(id: string) {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("recipes").delete().eq("id", id);
  revalidatePath("/admin/recipes");
  redirect("/admin/recipes");
}

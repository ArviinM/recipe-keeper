"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import * as categories from "@/lib/categories/mutations";

export type SaveResult = { ok: boolean; error?: string };

async function withStaff<T>(fn: (supabase: Awaited<ReturnType<typeof createClient>>) => Promise<T>) {
  await requireStaff();
  const supabase = await createClient();
  return fn(supabase);
}

function revalidate() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/recipes");
  revalidatePath("/recipes");
}

export async function createCategory(name: string): Promise<SaveResult> {
  const result = await withStaff((s) => categories.createCategory(s, name));
  if (result.ok) revalidate();
  return result;
}

export async function renameCategory(id: string, name: string): Promise<SaveResult> {
  const result = await withStaff((s) => categories.renameCategory(s, id, name));
  if (result.ok) revalidate();
  return result;
}

export async function reorderCategories(orderedIds: string[]): Promise<SaveResult> {
  const result = await withStaff((s) => categories.reorderCategories(s, orderedIds));
  if (result.ok) revalidate();
  return result;
}

export async function deleteCategory(id: string): Promise<SaveResult> {
  const result = await withStaff((s) => categories.deleteCategory(s, id));
  if (result.ok) revalidate();
  return result;
}

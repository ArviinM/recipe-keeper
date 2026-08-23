import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";

import { CategoriesManager } from "./categories-manager";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireStaff();
  const supabase = await createClient();

  const [{ data: categories }, { data: recipes }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, sort_order").order("sort_order"),
    supabase.from("recipes").select("id, category_id"),
  ]);

  const counts = new Map<string, number>();
  for (const recipe of recipes ?? []) {
    if (recipe.category_id) {
      counts.set(recipe.category_id, (counts.get(recipe.category_id) ?? 0) + 1);
    }
  }

  return (
    <CategoriesManager
      categories={(categories ?? []).map((category) => ({
        ...category,
        recipeCount: counts.get(category.id) ?? 0,
      }))}
    />
  );
}

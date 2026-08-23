import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { createRecipeDraft } from "./actions";
import { RecipeList } from "./recipe-list";

export const metadata: Metadata = { title: "Recipes" };

export default async function AdminRecipesPage() {
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from("recipes")
    .select(
      "id, title, is_published, sort_order, categories(name), quizzes(id, is_published), steps(id), ingredients(id)",
    )
    .order("sort_order")
    .order("title");

  const rows = (recipes ?? []).map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    isPublished: recipe.is_published,
    categoryName: recipe.categories?.name ?? null,
    ingredientCount: recipe.ingredients?.length ?? 0,
    stepCount: recipe.steps?.length ?? 0,
    quizReady: Boolean(recipe.quizzes?.is_published),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Recipes</h1>
          <p className="text-muted-foreground text-sm">
            Add a lesson, then publish it when it is ready for students.
          </p>
        </div>

        <form action={createRecipeDraft}>
          <SubmitButton className="h-11 font-bold" pendingLabel="Creating…">
            <Plus aria-hidden />
            New Recipe
          </SubmitButton>
        </form>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <p className="font-semibold">No recipes yet</p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
              Start with one lesson. You can save as you go and publish it only
              when you are happy with it.
            </p>
          </CardContent>
        </Card>
      ) : (
        <RecipeList recipes={rows} />
      )}
    </div>
  );
}

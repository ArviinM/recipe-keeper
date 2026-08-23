import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { createRecipeDraft } from "./actions";

export const metadata: Metadata = { title: "Recipes" };

export default async function AdminRecipesPage() {
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from("recipes")
    .select(
      "id, title, is_published, sort_order, updated_at, categories(name), quizzes(id, is_published), steps(id), ingredients(id)",
    )
    .order("sort_order")
    .order("title");

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

      {!recipes?.length ? (
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
        <ul className="space-y-3">
          {recipes.map((recipe) => {
            const incomplete =
              !recipe.ingredients?.length || !recipe.steps?.length;

            return (
              <li key={recipe.id}>
                <Card>
                  <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-bold">{recipe.title}</h2>
                        {recipe.is_published ? (
                          <Badge className="bg-brand-green text-white">
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-sm">
                        {recipe.categories?.name ?? "No category"} ·{" "}
                        {recipe.ingredients?.length ?? 0} ingredients ·{" "}
                        {recipe.steps?.length ?? 0} steps
                        {recipe.quizzes?.is_published ? " · quiz ready" : ""}
                      </p>
                      {incomplete && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          Still needs ingredients and procedure.
                        </p>
                      )}
                    </div>

                    <Button asChild variant="outline" className="font-semibold">
                      <Link href={`/admin/recipes/${recipe.id}`}>Edit</Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

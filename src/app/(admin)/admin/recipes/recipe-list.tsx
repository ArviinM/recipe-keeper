"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { reorderRecipes } from "./actions";

export type RecipeRow = {
  id: string;
  title: string;
  isPublished: boolean;
  categoryName: string | null;
  ingredientCount: number;
  stepCount: number;
  quizReady: boolean;
};

export function RecipeList({ recipes }: { recipes: RecipeRow[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Optimistic so the row visibly moves on the first tap, rather than waiting
  // for a round trip on classroom wifi.
  const [order, moveOptimistic] = useOptimistic(
    recipes,
    (current: RecipeRow[], { index, delta }: { index: number; delta: number }) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    },
  );

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;

    setError(null);
    startTransition(async () => {
      moveOptimistic({ index, delta });

      const next = [...order];
      [next[index], next[target]] = [next[target], next[index]];

      const result = await reorderRecipes(next.map((r) => r.id));
      if (!result.ok) setError(result.error ?? "Could not save the new order.");
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Students see lessons in this order. Use the arrows to match your teaching
        sequence.
      </p>

      {error && <p className="text-destructive text-sm font-semibold">{error}</p>}

      <ul className="space-y-3">
        {order.map((recipe, index) => {
          const incomplete = !recipe.ingredientCount || !recipe.stepCount;

          return (
            <li key={recipe.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-muted-foreground w-6 text-center text-sm font-bold tabular-nums">
                      {index + 1}
                    </span>
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => move(index, -1)}
                        disabled={index === 0 || pending}
                        aria-label={`Move ${recipe.title} earlier`}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => move(index, 1)}
                        disabled={index === order.length - 1 || pending}
                        aria-label={`Move ${recipe.title} later`}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-bold">{recipe.title}</h2>
                      {recipe.isPublished ? (
                        <Badge className="bg-brand-green text-white">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      {recipe.categoryName ?? "No category"} ·{" "}
                      {recipe.ingredientCount} ingredients · {recipe.stepCount} steps
                      {recipe.quizReady ? " · quiz ready" : ""}
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
    </div>
  );
}

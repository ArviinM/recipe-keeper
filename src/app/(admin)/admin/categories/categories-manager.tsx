"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  createCategory,
  deleteCategory,
  renameCategory,
  reorderCategories,
} from "./actions";

type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  recipeCount: number;
};

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [order, moveOptimistic] = useOptimistic(
    categories,
    (current: Category[], { index, delta }: { index: number; delta: number }) => {
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
      const result = await reorderCategories(next.map((c) => c.id));
      if (!result.ok) setError(result.error ?? "Could not save the order.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm">
            How lessons are grouped in the recipe library.
          </p>
        </div>
        {!adding && (
          <Button className="h-11 font-bold" onClick={() => setAdding(true)}>
            <Plus aria-hidden />
            Add category
          </Button>
        )}
      </div>

      {error && <p className="text-destructive text-sm font-semibold">{error}</p>}

      {adding && (
        <Card>
          <CardContent>
            <form
              className="flex flex-wrap items-end gap-2"
              action={(formData) => {
                setError(null);
                startTransition(async () => {
                  const result = await createCategory(String(formData.get("name") ?? ""));
                  if (result.ok) setAdding(false);
                  else setError(result.error ?? "Could not add the category.");
                });
              }}
            >
              <Input
                name="name"
                placeholder="e.g. Native Delicacies"
                required
                autoFocus
                className="h-11 min-w-48 flex-1"
                aria-label="New category name"
              />
              <Button type="submit" className="h-11 font-bold" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11"
                onClick={() => setAdding(false)}
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <ul className="space-y-2">
        {order.map((category, index) => (
          <li key={category.id}>
            <Card>
              <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex shrink-0 flex-col">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || pending}
                    aria-label={`Move ${category.name} up`}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => move(index, 1)}
                    disabled={index === order.length - 1 || pending}
                    aria-label={`Move ${category.name} down`}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                </div>

                {editingId === category.id ? (
                  <form
                    className="flex min-w-0 flex-1 items-center gap-2"
                    action={(formData) => {
                      setError(null);
                      startTransition(async () => {
                        const result = await renameCategory(
                          category.id,
                          String(formData.get("name") ?? ""),
                        );
                        if (result.ok) setEditingId(null);
                        else setError(result.error ?? "Could not rename.");
                      });
                    }}
                  >
                    <Input
                      name="name"
                      defaultValue={category.name}
                      autoFocus
                      className="h-10 flex-1"
                      aria-label={`Rename ${category.name}`}
                    />
                    <Button type="submit" size="icon" className="size-10" disabled={pending}>
                      <Check className="size-4" />
                      <span className="sr-only">Save name</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-10"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="size-4" />
                      <span className="sr-only">Cancel</span>
                    </Button>
                  </form>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{category.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {category.recipeCount} recipe
                        {category.recipeCount === 1 ? "" : "s"}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(category.id)}
                      disabled={pending}
                    >
                      <Pencil className="size-4" aria-hidden />
                      Rename
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={pending || category.recipeCount > 0}
                      title={
                        category.recipeCount > 0
                          ? "Move the recipes in this category first"
                          : undefined
                      }
                      onClick={() => {
                        setError(null);
                        startTransition(async () => {
                          const result = await deleteCategory(category.id);
                          if (!result.ok) setError(result.error ?? "Could not delete.");
                        });
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Delete
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

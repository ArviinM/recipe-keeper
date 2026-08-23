"use client";

import { useCallback, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { saveIngredients } from "@/app/(admin)/admin/recipes/actions";
import { SaveStatusLabel } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { WizardRecipe } from "../recipe-wizard";
import { StepHeader } from "./basics-step";

type Row = { quantity: string; item: string; note: string };

const EMPTY: Row = { quantity: "", item: "", note: "" };

export function IngredientsStep({ recipe }: { recipe: WizardRecipe }) {
  const [rows, setRows] = useState<Row[]>(
    recipe.ingredients.length ? recipe.ingredients : [EMPTY],
  );

  const save = useCallback(
    (current: Row[]) => saveIngredients(recipe.id, current),
    [recipe.id],
  );
  const { status, error } = useAutosave(rows, save);

  const update = (index: number, key: keyof Row, value: string) =>
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );

  return (
    <div className="space-y-5">
      <StepHeader
        title="Ingredients"
        hint="Put the measurement and the ingredient in separate boxes, so students see them clearly."
        status={<SaveStatusLabel status={status} error={error} />}
      />

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="grid flex-1 gap-2 sm:grid-cols-[8rem_1fr_10rem]">
              <Input
                value={row.quantity}
                onChange={(e) => update(index, "quantity", e.target.value)}
                placeholder="1 kg"
                className="h-12"
                aria-label={`Measurement for ingredient ${index + 1}`}
              />
              <Input
                value={row.item}
                onChange={(e) => update(index, "item", e.target.value)}
                placeholder="chicken"
                className="h-12"
                aria-label={`Ingredient ${index + 1}`}
              />
              <Input
                value={row.note}
                onChange={(e) => update(index, "note", e.target.value)}
                placeholder="cut into pieces"
                className="h-12"
                aria-label={`Note for ingredient ${index + 1}`}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive mt-1 size-10 shrink-0"
              onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
              aria-label={`Remove ingredient ${index + 1}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full font-semibold"
        onClick={() => setRows((prev) => [...prev, EMPTY])}
      >
        <Plus aria-hidden />
        Add another ingredient
      </Button>
    </div>
  );
}

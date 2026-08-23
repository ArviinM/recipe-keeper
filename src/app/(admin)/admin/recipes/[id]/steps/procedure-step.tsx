"use client";

import { useCallback, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { saveSteps } from "@/app/(admin)/admin/recipes/actions";
import { ImagePicker } from "@/components/admin/image-picker";
import { SaveStatusLabel } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import type { WizardRecipe } from "../recipe-wizard";
import type { Locale } from "@/lib/i18n";
import { StepHeader } from "./basics-step";

type Row = { instruction: string; imagePath: string | null };

export function ProcedureStep({
  recipe,
  editLocale,
}: {
  recipe: WizardRecipe;
  editLocale: Locale;
}) {
  const tagalog = editLocale === "tl";
  // Translating never adds, removes, or reorders a step — it only replaces the
  // words on the steps English already numbered.
  const source = tagalog
    ? recipe.steps.map((step, i) => ({
        instruction: recipe.tl.steps[i]?.instruction ?? "",
        imagePath: step.imagePath,
      }))
    : recipe.steps;
  const [rows, setRows] = useState<Row[]>(
    source.length ? source : [{ instruction: "", imagePath: null }],
  );

  const save = useCallback(
    (current: Row[]) => saveSteps(recipe.id, current, editLocale),
    [recipe.id, editLocale],
  );
  const { status, error } = useAutosave(rows, save);

  const update = (index: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const move = (index: number, delta: number) =>
    setRows((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  return (
    <div className="space-y-5">
      <StepHeader
        title="Procedure"
        hint={
          tagalog
            ? "Translate each step. Add, remove, and reorder steps on the English page."
            : "Write one step at a time. Steps are numbered automatically, so you can reorder them freely."
        }
        status={<SaveStatusLabel status={status} error={error} />}
      />

      <div className="space-y-4">
        {rows.map((row, index) => (
          <div key={index} className="border-border space-y-3 rounded-xl border p-4">
            <div className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                {index + 1}
              </span>
              <span className="text-sm font-semibold">Step {index + 1}</span>

              {!tagalog && (
              <div className="ml-auto flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move step ${index + 1} up`}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1}
                  aria-label={`Move step ${index + 1} down`}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive size-9"
                  onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                  aria-label={`Remove step ${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              )}
            </div>

            <Textarea
              value={row.instruction}
              onChange={(e) => update(index, { instruction: e.target.value })}
              rows={2}
              placeholder="e.g. Marinate the chicken with soy sauce and garlic."
              className="text-base"
              aria-label={`Instruction for step ${index + 1}`}
            />

            {!tagalog && (
            <details className="group">
              <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm font-semibold">
                {row.imagePath ? "Photo added" : "Add a photo for this step (optional)"}
              </summary>
              <div className="pt-3">
                <ImagePicker
                  recipeId={recipe.id}
                  path={row.imagePath}
                  onChange={(path) => update(index, { imagePath: path })}
                  label="Add step photo"
                  aspect="aspect-[16/9]"
                />
              </div>
            </details>
            )}
          </div>
        ))}
      </div>

      {!tagalog && (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full font-semibold"
          onClick={() =>
            setRows((prev) => [...prev, { instruction: "", imagePath: null }])
          }
        >
          <Plus aria-hidden />
          Add another step
        </Button>
      )}
    </div>
  );
}

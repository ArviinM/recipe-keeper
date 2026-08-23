"use client";

import { useCallback, useState } from "react";

import { saveRecipeLists, saveTechniques } from "@/app/(admin)/admin/recipes/actions";
import { ListEditor } from "@/components/admin/list-editor";
import { SaveStatusLabel } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { WizardRecipe } from "../recipe-wizard";
import { StepHeader } from "./basics-step";

export function NotesStep({
  recipe,
  techniques,
}: {
  recipe: WizardRecipe;
  techniques: { id: string; name: string; description: string }[];
}) {
  const [selected, setSelected] = useState<string[]>(recipe.techniqueIds);
  const [lists, setLists] = useState({
    safetyNotes: recipe.safetyNotes.length ? recipe.safetyNotes : [""],
    chefTips: recipe.chefTips.length ? recipe.chefTips : [""],
  });

  const saveTech = useCallback(
    (current: string[]) => saveTechniques(recipe.id, current),
    [recipe.id],
  );
  const saveLists = useCallback(
    (current: typeof lists) =>
      saveRecipeLists(recipe.id, {
        safetyNotes: current.safetyNotes,
        chefTips: current.chefTips,
      }),
    [recipe.id],
  );

  const tech = useAutosave(selected, saveTech);
  const list = useAutosave(lists, saveLists);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <StepHeader
          title="Cooking techniques"
          hint="Tick the techniques this recipe uses. The explanation is written once and shared by every recipe."
          status={<SaveStatusLabel status={tech.status} error={tech.error} />}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          {techniques.map((technique) => {
            const active = selected.includes(technique.id);
            return (
              <button
                key={technique.id}
                type="button"
                onClick={() => toggle(technique.id)}
                aria-pressed={active}
                className={cn(
                  "rounded-xl border-2 p-3 text-left transition-colors",
                  active
                    ? "border-brand-green bg-accent"
                    : "border-border bg-card hover:bg-secondary/50",
                )}
              >
                <span className="font-bold">{technique.name}</span>
                <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-sm">
                  {technique.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Kitchen safety &amp; sanitation</h2>
          <SaveStatusLabel status={list.status} error={list.error} />
        </div>

        <Card className="border-destructive/25 bg-destructive/5">
          <CardContent>
            <p className="text-sm">
              Students see this section highlighted in red, so it stands out
              before they start cooking.
            </p>
          </CardContent>
        </Card>

        <ListEditor
          items={lists.safetyNotes}
          onChange={(next) => setLists((prev) => ({ ...prev, safetyNotes: next }))}
          addLabel="Add another safety reminder"
          placeholder="e.g. Wash your hands with soap and water before handling food."
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Chef&apos;s tips</h2>
        <ListEditor
          items={lists.chefTips}
          onChange={(next) => setLists((prev) => ({ ...prev, chefTips: next }))}
          addLabel="Add another tip"
          placeholder="e.g. Make sure the pan is properly heated before adding the ingredients."
        />
      </section>
    </div>
  );
}

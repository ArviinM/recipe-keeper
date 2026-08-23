"use client";

import { useCallback, useState } from "react";

import { saveRecipeLists } from "@/app/(admin)/admin/recipes/actions";
import { ListEditor } from "@/components/admin/list-editor";
import { SaveStatusLabel } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";

import type { WizardRecipe } from "../recipe-wizard";
import type { Locale } from "@/lib/i18n";
import { StepHeader } from "./basics-step";

export function ObjectivesStep({
  recipe,
  editLocale,
}: {
  recipe: WizardRecipe;
  editLocale: Locale;
}) {
  const source =
    editLocale === "tl" ? recipe.tl.objectives : recipe.objectives;
  const [items, setItems] = useState(source.length ? source : [""]);

  const save = useCallback(
    (current: string[]) =>
      saveRecipeLists(recipe.id, { objectives: current }, editLocale),
    [recipe.id, editLocale],
  );
  const { status, error } = useAutosave(items, save);

  return (
    <div className="space-y-5">
      <StepHeader
        title="Learning objectives"
        hint="What should students be able to do after this lesson? Write one per line."
        status={<SaveStatusLabel status={status} error={error} />}
      />

      <p className="bg-secondary text-secondary-foreground rounded-lg px-4 py-3 text-sm">
        Students see these as: <em>&ldquo;After this lesson, you should be able
        to…&rdquo;</em>
      </p>

      <ListEditor
        items={items}
        onChange={setItems}
        addLabel="Add another objective"
        placeholder="e.g. Identify the ingredients needed for the recipe."
        numbered
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LOCALES, type Locale } from "@/lib/i18n";

import { BasicsStep } from "./steps/basics-step";
import { ObjectivesStep } from "./steps/objectives-step";
import { IngredientsStep } from "./steps/ingredients-step";
import { ProcedureStep } from "./steps/procedure-step";
import { NotesStep } from "./steps/notes-step";
import { QuizStep } from "./steps/quiz-step";
import { PublishStep } from "./steps/publish-step";

export type WizardIngredient = {
  id: string | null;
  quantity: string;
  item: string;
  note: string;
  quantityTl: string;
  itemTl: string;
  noteTl: string;
};

export type WizardStep = {
  id: string | null;
  instruction: string;
  instructionTl: string;
  imagePath: string | null;
};

export type WizardQuestion = {
  id: string | null;
  prompt: string;
  promptTl: string;
  explanation: string;
  explanationTl: string;
  correctLabel: string;
  choices: { id: string | null; label: string; body: string; bodyTl: string }[];
};

/**
 * One structure, two languages. A recipe has a single list of ingredients and
 * steps; each row may carry English words, Tagalog words, or both. Keeping the
 * languages in separate drafts meant a row added in one pane was deleted by the
 * other pane's next save.
 */
export type WizardRecipe = {
  id: string;
  title: string;
  titleTl: string;
  slug: string;
  description: string;
  descriptionTl: string;
  imagePath: string | null;
  videoUrl: string | null;
  categoryId: string | null;
  difficulty: string | null;
  servings: number | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  isPublished: boolean;
  objectives: string[];
  objectivesTl: string[];
  safetyNotes: string[];
  safetyNotesTl: string[];
  chefTips: string[];
  chefTipsTl: string[];
  ingredients: WizardIngredient[];
  steps: WizardStep[];
  techniqueIds: string[];
  quiz: {
    title: string;
    titleTl: string;
    instructions: string;
    instructionsTl: string;
    passingPercentage: number;
    revealAnswers: boolean;
    isPublished: boolean;
    questions: WizardQuestion[];
  };
};

const STEPS = [
  { key: "basics", label: "Basics" },
  { key: "objectives", label: "Objectives" },
  { key: "ingredients", label: "Ingredients" },
  { key: "procedure", label: "Procedure" },
  { key: "notes", label: "Techniques & Safety" },
  { key: "quiz", label: "Quiz" },
  { key: "publish", label: "Publish" },
] as const;

export function RecipeWizard({
  recipe,
  categories,
  techniques,
}: {
  recipe: WizardRecipe;
  categories: { id: string; name: string }[];
  techniques: { id: string; name: string; description: string }[];
}) {
  const [index, setIndex] = useState(0);
  const [title, setTitle] = useState(recipe.title);
  const [published, setPublished] = useState(recipe.isPublished);
  const [editLocale, setEditLocale] = useState<Locale>("en");

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="-ml-2 size-9">
            <Link href="/admin/recipes" aria-label="Back to all recipes">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="min-w-0 flex-1 truncate text-xl font-extrabold tracking-tight">
            {title || "Untitled recipe"}
          </h1>
          <span className="text-muted-foreground shrink-0 text-sm font-semibold">
            Step {index + 1} of {STEPS.length}
          </span>
        </div>

        {/* English is what a lesson is written in; Tagalog translates it. */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm font-semibold">
            Writing in
          </span>
          <div className="bg-secondary flex gap-1 rounded-lg p-1">
            {LOCALES.map((locale) => (
              <button
                key={locale.value}
                type="button"
                aria-pressed={editLocale === locale.value}
                onClick={() => setEditLocale(locale.value)}
                className={cn(
                  "min-h-9 rounded-md px-3 text-sm font-bold transition-colors",
                  editLocale === locale.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {locale.label}
              </button>
            ))}
          </div>
          {editLocale === "tl" && (
            <span className="text-muted-foreground text-sm">
              Anything left blank shows the English version to students.
            </span>
          )}
        </div>

        {/* Named, clickable steps rather than a bare bar: a teacher coming back
            to finish one section should be able to jump straight to it. */}
        <nav aria-label="Recipe sections" className="-mx-1 overflow-x-auto px-1">
          <ol className="flex w-max gap-1.5 pb-1">
            {STEPS.map((item, i) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-current={i === index ? "step" : undefined}
                  className={cn(
                    "min-h-9 rounded-full px-3 text-sm font-semibold transition-colors",
                    i === index
                      ? "bg-primary text-primary-foreground"
                      : i < index
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {i + 1}. {item.label}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Every step stays mounted and inactive ones are hidden. Unmounting
          them threw away edits made since the page loaded, and autosave then
          wrote the stale copy back over the database. */}
      {/* Every step stays mounted and inactive ones are hidden. Unmounting them
          discarded anything typed since the page loaded, and the next keystroke
          then autosaved that stale copy over the newer rows in the database. */}
      <div className="min-h-[24rem]">
        <div hidden={step.key !== "basics"}>
          <BasicsStep
            recipe={recipe}
            categories={categories}
            onTitleChange={setTitle}
            editLocale={editLocale}
          />
        </div>
        <div hidden={step.key !== "objectives"}>
          <ObjectivesStep recipe={recipe} editLocale={editLocale} />
        </div>
        <div hidden={step.key !== "ingredients"}>
          <IngredientsStep recipe={recipe} editLocale={editLocale} />
        </div>
        <div hidden={step.key !== "procedure"}>
          <ProcedureStep recipe={recipe} editLocale={editLocale} />
        </div>
        <div hidden={step.key !== "notes"}>
          <NotesStep recipe={recipe} techniques={techniques} editLocale={editLocale} />
        </div>
        <div hidden={step.key !== "quiz"}>
          <QuizStep recipe={recipe} editLocale={editLocale} />
        </div>
        <div hidden={step.key !== "publish"}>
          <PublishStep
            recipe={recipe}
            published={published}
            onPublishedChange={setPublished}
          />
        </div>
      </div>

      <div className="flex gap-3 border-t pt-4">
        <Button
          variant="outline"
          className="h-12 flex-1 font-bold"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <ArrowLeft aria-hidden />
          Back
        </Button>
        <Button
          className="h-12 flex-[1.4] font-bold"
          onClick={() => setIndex((i) => Math.min(STEPS.length - 1, i + 1))}
          disabled={isLast}
        >
          Next
          <ArrowRight aria-hidden />
        </Button>
      </div>
    </div>
  );
}

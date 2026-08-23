"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AlertCircle, Check, ExternalLink, Trash2 } from "lucide-react";

import { deleteRecipe, setRecipePublished } from "@/app/(admin)/admin/recipes/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import type { WizardRecipe } from "../recipe-wizard";
import { StepHeader } from "./basics-step";

export function PublishStep({
  recipe,
  published,
  onPublishedChange,
}: {
  recipe: WizardRecipe;
  published: boolean;
  onPublishedChange: (value: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // The checklist follows the English content, which is what a lesson is
  // written in. Tagalog is an optional translation on top of it.
  const answeredQuestions = recipe.quiz.questions.filter(
    (q) => q.prompt.trim() && q.correctLabel,
  ).length;

  const checks = [
    {
      label: "Recipe has a name",
      done: recipe.title !== "Untitled recipe" && Boolean(recipe.title.trim()),
    },
    { label: "Short description written", done: Boolean(recipe.description.trim()) },
    { label: "Photo of the dish added", done: Boolean(recipe.imagePath) },
    { label: "Learning objectives written", done: recipe.objectives.length > 0 },
    { label: "Ingredients listed", done: recipe.ingredients.length > 0 },
    { label: "Procedure written", done: recipe.steps.length > 0 },
    { label: "Safety reminders written", done: recipe.safetyNotes.length > 0 },
    { label: "Quiz questions with a correct answer", done: answeredQuestions > 0 },
  ];

  const ready = checks.every((check) => check.done);
  const missing = checks.filter((check) => !check.done);

  function togglePublished(next: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setRecipePublished(recipe.id, next);
      if (result.ok) onPublishedChange(next);
      else setError(result.error ?? "Could not change this.");
    });
  }

  return (
    <div className="space-y-6">
      <StepHeader
        title="Publish"
        hint="Students only see this lesson once you publish it. Nothing here is permanent — you can unpublish at any time."
      />

      <Card>
        <CardContent className="space-y-3">
          <h3 className="font-bold">Before you publish</h3>
          <ul className="space-y-2">
            {checks.map((check) => (
              <li key={check.label} className="flex items-center gap-2.5 text-sm">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full",
                    check.done
                      ? "bg-brand-green text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {check.done ? (
                    <Check className="size-3.5" />
                  ) : (
                    <AlertCircle className="size-3.5" />
                  )}
                </span>
                <span className={cn(check.done ? "" : "text-muted-foreground")}>
                  {check.label}
                </span>
              </li>
            ))}
          </ul>

          {!ready && (
            <p className="text-muted-foreground pt-1 text-sm">
              You can still publish with {missing.length} item
              {missing.length > 1 ? "s" : ""} missing, but students will see an
              incomplete lesson.
            </p>
          )}
        </CardContent>
      </Card>

      {error && (
        <p className="text-destructive text-sm font-semibold">{error}</p>
      )}

      {published ? (
        <Card className="border-brand-green/40 bg-accent">
          <CardContent className="space-y-3">
            <p className="font-bold">This lesson is live for students.</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="font-semibold">
                <Link href={`/recipes/${recipe.slug}`} target="_blank">
                  <ExternalLink aria-hidden />
                  View as a student
                </Link>
              </Button>
              <Button
                variant="secondary"
                className="font-semibold"
                onClick={() => togglePublished(false)}
                disabled={pending}
              >
                {pending ? "Working…" : "Unpublish"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          className="h-13 w-full font-bold"
          onClick={() => togglePublished(true)}
          disabled={pending}
        >
          {pending ? "Publishing…" : "Publish for students"}
        </Button>
      )}

      <div className="border-t pt-5">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="text-destructive font-semibold">
              <Trash2 aria-hidden />
              Delete this recipe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this recipe?</DialogTitle>
              <DialogDescription>
                This removes the lesson, its quiz, and every score students have
                already earned on it. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Keep it</Button>
              </DialogClose>
              <form action={deleteRecipe.bind(null, recipe.id)}>
                <Button type="submit" variant="destructive">
                  Yes, delete it
                </Button>
              </form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

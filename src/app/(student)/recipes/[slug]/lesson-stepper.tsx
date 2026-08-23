"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChefHat,
  ClipboardList,
  Flame,
  Lightbulb,
  ListChecks,
  ShieldCheck,
  Target,
  Utensils,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RecipeDetail } from "@/lib/data/recipes";

type Step = {
  key: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
};

export function LessonStepper({ recipe }: { recipe: RecipeDetail }) {
  const [index, setIndex] = useState(0);
  const [gathered, setGathered] = useState<Set<string>>(new Set());

  const toggleIngredient = useCallback((id: string) => {
    setGathered((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Only sections that actually have content become steps, so a recipe with no
  // techniques recorded does not show an empty screen.
  const steps = useMemo<Step[]>(() => {
    const list: Step[] = [];

    list.push({
      key: "overview",
      title: "Overview",
      icon: ChefHat,
      content: (
        <div className="space-y-4">
          {recipe.imageUrl ? (
            <div className="bg-muted relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
              <Image
                src={recipe.imageUrl}
                alt={recipe.title}
                fill
                sizes="(max-width: 672px) 100vw, 640px"
                className="object-cover"
                priority
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {recipe.categories?.name && (
              <Badge variant="secondary" className="font-semibold">
                {recipe.categories.name}
              </Badge>
            )}
            {recipe.difficulty && (
              <Badge variant="outline" className="capitalize">
                {recipe.difficulty}
              </Badge>
            )}
            {recipe.servings ? (
              <Badge variant="outline">{recipe.servings} servings</Badge>
            ) : null}
            {recipe.cook_minutes ? (
              <Badge variant="outline">{recipe.cook_minutes} min cooking</Badge>
            ) : null}
          </div>

          {recipe.description && (
            <p className="text-base leading-relaxed">{recipe.description}</p>
          )}

          {recipe.video_url && (
            <Button asChild variant="outline" className="h-12 w-full font-bold">
              <a href={recipe.video_url} target="_blank" rel="noreferrer">
                Watch Demonstration
              </a>
            </Button>
          )}
        </div>
      ),
    });

    if (recipe.objectives?.length) {
      list.push({
        key: "objectives",
        title: "Learning Objectives",
        icon: Target,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              After this lesson, you should be able to:
            </p>
            <ol className="space-y-3">
              {recipe.objectives.map((objective, i) => (
                <li key={i} className="flex gap-3">
                  <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-base leading-relaxed">
                    {objective}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ),
      });
    }

    if (recipe.ingredients.length) {
      list.push({
        key: "ingredients",
        title: "Ingredients",
        icon: Utensils,
        content: (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Tap each one as you gather it.
            </p>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient) => {
                const checked = gathered.has(ingredient.id);
                return (
                  <li key={ingredient.id}>
                    <button
                      type="button"
                      onClick={() => toggleIngredient(ingredient.id)}
                      aria-pressed={checked}
                      className={cn(
                        "flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                        checked
                          ? "border-brand-green/40 bg-accent"
                          : "border-border bg-card hover:bg-secondary/60",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                          checked
                            ? "border-brand-green bg-brand-green text-white"
                            : "border-muted-foreground/40",
                        )}
                        aria-hidden
                      >
                        {checked && (
                          <svg viewBox="0 0 20 20" className="size-4" fill="currentColor">
                            <path d="M7.6 13.4 4.2 10l-1.2 1.2 4.6 4.6 9-9L15.4 5.6z" />
                          </svg>
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-base",
                          checked && "text-muted-foreground line-through",
                        )}
                      >
                        {ingredient.quantity && (
                          <span className="font-bold">{ingredient.quantity} </span>
                        )}
                        {ingredient.item}
                        {ingredient.note && (
                          <span className="text-muted-foreground">
                            {" "}
                            ({ingredient.note})
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ),
      });
    }

    if (recipe.steps.length) {
      list.push({
        key: "procedure",
        title: "Procedure",
        icon: ClipboardList,
        content: (
          <ol className="space-y-5">
            {recipe.steps.map((step) => (
              <li key={step.id} className="space-y-3">
                <div className="flex gap-3">
                  <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                    {step.step_number}
                  </span>
                  <p className="pt-1 text-base leading-relaxed">
                    {step.instruction}
                  </p>
                </div>
                {step.imageUrl && (
                  <div className="bg-muted relative ml-11 aspect-[16/10] overflow-hidden rounded-xl">
                    <Image
                      src={step.imageUrl}
                      alt={`Step ${step.step_number}`}
                      fill
                      sizes="(max-width: 672px) 100vw, 600px"
                      className="object-cover"
                    />
                  </div>
                )}
              </li>
            ))}
          </ol>
        ),
      });
    }

    if (recipe.techniques.length) {
      list.push({
        key: "techniques",
        title: "Cooking Techniques",
        icon: Flame,
        content: (
          <div className="space-y-3">
            {recipe.techniques.map((technique) => (
              <Card key={technique.id} className="border-brand-wood/30">
                <CardContent className="space-y-1">
                  <h3 className="font-bold">{technique.name}</h3>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    {technique.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ),
      });
    }

    if (recipe.safety_notes?.length) {
      list.push({
        key: "safety",
        title: "Kitchen Safety & Sanitation",
        icon: ShieldCheck,
        content: (
          // The spec asks for this section to be visually noticeable, so it gets
          // its own colour treatment rather than blending in with the rest.
          <Card className="border-destructive/25 bg-destructive/5">
            <CardContent>
              <ul className="space-y-3">
                {recipe.safety_notes.map((note, i) => (
                  <li key={i} className="flex gap-3">
                    <ShieldCheck
                      className="text-destructive mt-0.5 size-5 shrink-0"
                      aria-hidden
                    />
                    <span className="text-base leading-relaxed">{note}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ),
      });
    }

    if (recipe.chef_tips?.length) {
      list.push({
        key: "tips",
        title: "Chef's Tips",
        icon: Lightbulb,
        content: (
          <ul className="space-y-3">
            {recipe.chef_tips.map((tip, i) => (
              <li key={i}>
                <Card className="border-brand-wood/40 bg-brand-cream">
                  <CardContent className="flex gap-3">
                    <Lightbulb className="text-brand-wood mt-0.5 size-5 shrink-0" aria-hidden />
                    <span className="text-base leading-relaxed">{tip}</span>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        ),
      });
    }

    return list;
  }, [recipe, gathered, toggleIngredient]);

  const current = steps[index];
  const isLast = index === steps.length - 1;
  const quizReady = Boolean(recipe.quizzes?.is_published);
  const Icon = current.icon;

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col">
      <header className="space-y-3 pb-5">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="-ml-2 size-10">
            <Link href="/recipes" aria-label="Back to recipes">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="truncate text-lg font-extrabold tracking-tight">
            {recipe.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <ol className="flex flex-1 gap-1.5" aria-label="Lesson progress">
            {steps.map((step, i) => (
              <li
                key={step.key}
                aria-current={i === index ? "step" : undefined}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= index ? "bg-primary" : "bg-muted",
                )}
              >
                <span className="sr-only">{step.title}</span>
              </li>
            ))}
          </ol>
          <span className="text-muted-foreground shrink-0 text-sm font-semibold tabular-nums">
            {index + 1} / {steps.length}
          </span>
        </div>
      </header>

      <div className="flex-1 space-y-5">
        <div className="flex items-center gap-2.5">
          <span className="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-xl">
            <Icon className="size-5" />
          </span>
          <h2 className="text-xl font-extrabold tracking-tight">
            {current.title}
          </h2>
        </div>

        {current.content}
      </div>

      <div
        className="bg-background/95 sticky bottom-0 -mx-4 mt-8 flex gap-3 border-t px-4 pt-3 backdrop-blur"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <Button
          variant="outline"
          className="h-13 flex-1 font-bold"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <ArrowLeft aria-hidden />
          Back
        </Button>

        {isLast ? (
          quizReady ? (
            <Button asChild className="h-13 flex-[1.4] font-bold">
              <Link href={`/recipes/${recipe.slug}/quiz`}>
                <ListChecks aria-hidden />
                Take the Quiz
              </Link>
            </Button>
          ) : (
            <Button asChild variant="secondary" className="h-13 flex-[1.4] font-bold">
              <Link href="/recipes">Back to Recipes</Link>
            </Button>
          )
        ) : (
          <Button
            className="h-13 flex-[1.4] font-bold"
            onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
          >
            Next
            <ArrowRight aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}

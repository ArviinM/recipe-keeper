"use client";

import { useCallback, useState } from "react";

import { saveRecipeBasics, setRecipeImage } from "@/app/(admin)/admin/recipes/actions";
import { ImagePicker } from "@/components/admin/image-picker";
import { SaveStatusLabel } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { WizardRecipe } from "../recipe-wizard";

export function BasicsStep({
  recipe,
  categories,
  onTitleChange,
}: {
  recipe: WizardRecipe;
  categories: { id: string; name: string }[];
  onTitleChange: (title: string) => void;
}) {
  const [values, setValues] = useState({
    title: recipe.title === "Untitled recipe" ? "" : recipe.title,
    categoryId: recipe.categoryId ?? "",
    description: recipe.description,
    difficulty: recipe.difficulty ?? "",
    servings: recipe.servings?.toString() ?? "",
    prepMinutes: recipe.prepMinutes?.toString() ?? "",
    cookMinutes: recipe.cookMinutes?.toString() ?? "",
    videoUrl: recipe.videoUrl ?? "",
  });
  const [imagePath, setImagePath] = useState(recipe.imagePath);

  const save = useCallback(
    (current: typeof values) =>
      saveRecipeBasics(recipe.id, {
        title: current.title,
        categoryId: current.categoryId || null,
        description: current.description,
        difficulty: current.difficulty || null,
        servings: current.servings ? Number(current.servings) : null,
        prepMinutes: current.prepMinutes ? Number(current.prepMinutes) : null,
        cookMinutes: current.cookMinutes ? Number(current.cookMinutes) : null,
        videoUrl: current.videoUrl,
      }),
    [recipe.id],
  );

  const { status, error } = useAutosave(values, save);

  const set = (key: keyof typeof values) => (value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === "title") onTitleChange(value);
  };

  return (
    <div className="space-y-5">
      <StepHeader
        title="Recipe basics"
        hint="Give the lesson a name and a short description. You can change any of this later."
        status={<SaveStatusLabel status={status} error={error} />}
      />

      <div className="space-y-2">
        <Label htmlFor="title" className="text-base">
          Recipe name
        </Label>
        <Input
          id="title"
          value={values.title}
          onChange={(e) => set("title")(e.target.value)}
          placeholder="e.g. Chicken Adobo"
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId" className="text-base">
          Category
        </Label>
        <select
          id="categoryId"
          value={values.categoryId}
          onChange={(e) => set("categoryId")(e.target.value)}
          className="border-input bg-background h-12 w-full rounded-md border px-3 text-base"
        >
          <option value="">Choose a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-base">
          Short description
        </Label>
        <Textarea
          id="description"
          value={values.description}
          onChange={(e) => set("description")(e.target.value)}
          rows={3}
          placeholder="One or two sentences about the dish and what students will learn."
          className="text-base"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-base">Photo of the finished dish</Label>
        <ImagePicker
          recipeId={recipe.id}
          path={imagePath}
          onChange={(path) => {
            setImagePath(path);
            void setRecipeImage(recipe.id, path);
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Difficulty">
          <select
            value={values.difficulty}
            onChange={(e) => set("difficulty")(e.target.value)}
            className="border-input bg-background h-12 w-full rounded-md border px-3 text-base"
            aria-label="Difficulty"
          >
            <option value="">—</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </Field>
        <Field label="Servings">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={values.servings}
            onChange={(e) => set("servings")(e.target.value)}
            className="h-12"
            aria-label="Servings"
          />
        </Field>
        <Field label="Prep (min)">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={values.prepMinutes}
            onChange={(e) => set("prepMinutes")(e.target.value)}
            className="h-12"
            aria-label="Preparation minutes"
          />
        </Field>
        <Field label="Cook (min)">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={values.cookMinutes}
            onChange={(e) => set("cookMinutes")(e.target.value)}
            className="h-12"
            aria-label="Cooking minutes"
          />
        </Field>
      </div>

      <div className="space-y-2">
        <Label htmlFor="videoUrl" className="text-base">
          Video demonstration (optional)
        </Label>
        <Input
          id="videoUrl"
          value={values.videoUrl}
          onChange={(e) => set("videoUrl")(e.target.value)}
          placeholder="https://youtube.com/watch?v=…"
          className="h-12"
        />
        <p className="text-muted-foreground text-sm">
          Paste a YouTube link. Upload the video to YouTube as{" "}
          <strong>Unlisted</strong> so only people with the link can watch it.
        </p>
      </div>
    </div>
  );
}

export function StepHeader({
  title,
  hint,
  status,
}: {
  title: string;
  hint: string;
  status?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {status}
      </div>
      <p className="text-muted-foreground text-sm">{hint}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="text-muted-foreground text-sm font-semibold">{label}</span>
      {children}
    </div>
  );
}

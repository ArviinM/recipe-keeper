import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";

import { RecipeWizard } from "./recipe-wizard";

export const metadata: Metadata = { title: "Edit Recipe" };

export default async function EditRecipePage({
  params,
}: PageProps<"/admin/recipes/[id]">) {
  const { id } = await params;
  await requireStaff();
  const supabase = await createClient();

  const [{ data: recipe }, { data: categories }, { data: techniques }] =
    await Promise.all([
      supabase
        .from("recipes")
        .select(
          `id, title, slug, description, image_path, video_url, objectives,
           safety_notes, chef_tips, prep_minutes, cook_minutes, servings,
           difficulty, is_published, category_id,
           ingredients(id, quantity, item, note, sort_order),
           steps(id, step_number, instruction, image_path),
           recipe_techniques(technique_id, sort_order),
           quizzes(id, title, instructions, passing_percentage, reveal_answers,
                   is_published,
                   questions(id, prompt, explanation, sort_order, correct_choice_id,
                             choices!choices_question_id_fkey(id, label, body, sort_order)))`,
        )
        .eq("id", id)
        .maybeSingle(),
      supabase.from("categories").select("id, name").order("sort_order"),
      supabase.from("techniques").select("id, name, description").order("sort_order"),
    ]);

  if (!recipe) notFound();

  const quiz = recipe.quizzes;

  return (
    <RecipeWizard
      recipe={{
        id: recipe.id,
        title: recipe.title,
        slug: recipe.slug,
        description: recipe.description,
        imagePath: recipe.image_path,
        videoUrl: recipe.video_url,
        categoryId: recipe.category_id,
        difficulty: recipe.difficulty,
        servings: recipe.servings,
        prepMinutes: recipe.prep_minutes,
        cookMinutes: recipe.cook_minutes,
        isPublished: recipe.is_published,
        objectives: recipe.objectives ?? [],
        safetyNotes: recipe.safety_notes ?? [],
        chefTips: recipe.chef_tips ?? [],
        ingredients: [...(recipe.ingredients ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((row) => ({
            quantity: row.quantity ?? "",
            item: row.item,
            note: row.note ?? "",
          })),
        steps: [...(recipe.steps ?? [])]
          .sort((a, b) => a.step_number - b.step_number)
          .map((row) => ({
            instruction: row.instruction,
            imagePath: row.image_path,
          })),
        techniqueIds: [...(recipe.recipe_techniques ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((row) => row.technique_id),
        quiz: {
          title: quiz?.title ?? "Lesson Quiz",
          instructions: quiz?.instructions ?? "",
          passingPercentage: quiz?.passing_percentage ?? 75,
          revealAnswers: quiz?.reveal_answers ?? false,
          isPublished: quiz?.is_published ?? false,
          questions: [...(quiz?.questions ?? [])]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((question) => {
              const choices = [...(question.choices ?? [])].sort(
                (a, b) => a.sort_order - b.sort_order,
              );
              return {
                id: question.id,
                prompt: question.prompt,
                explanation: question.explanation ?? "",
                correctLabel:
                  choices.find((c) => c.id === question.correct_choice_id)?.label ??
                  "",
                choices: ["A", "B", "C", "D"].map((label) => {
                  const match = choices.find((c) => c.label === label);
                  return { id: match?.id ?? null, label, body: match?.body ?? "" };
                }),
              };
            }),
        },
      }}
      categories={categories ?? []}
      techniques={techniques ?? []}
    />
  );
}

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
          `id, title, title_tl, slug, description, description_tl, image_path,
           video_url, objectives, objectives_tl, safety_notes, safety_notes_tl,
           chef_tips, chef_tips_tl, prep_minutes, cook_minutes, servings,
           difficulty, is_published, category_id,
           ingredients(id, quantity, quantity_tl, item, item_tl, note, note_tl, sort_order),
           steps(id, step_number, instruction, instruction_tl, image_path),
           recipe_techniques(technique_id, sort_order),
           quizzes(id, title, title_tl, instructions, instructions_tl,
                   passing_percentage, reveal_answers, is_published,
                   questions(id, prompt, prompt_tl, explanation, explanation_tl,
                             sort_order, correct_choice_id,
                             choices!choices_question_id_fkey(id, label, body, body_tl, sort_order)))`,
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
        tl: {
          title: recipe.title_tl ?? "",
          description: recipe.description_tl ?? "",
          objectives: recipe.objectives_tl ?? [],
          safetyNotes: recipe.safety_notes_tl ?? [],
          chefTips: recipe.chef_tips_tl ?? [],
          ingredients: [...(recipe.ingredients ?? [])]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((row) => ({
              quantity: row.quantity_tl ?? "",
              item: row.item_tl ?? "",
              note: row.note_tl ?? "",
            })),
          steps: [...(recipe.steps ?? [])]
            .sort((a, b) => a.step_number - b.step_number)
            .map((row) => ({
              instruction: row.instruction_tl ?? "",
              imagePath: row.image_path,
            })),
          quizTitle: quiz?.title_tl ?? "",
          quizInstructions: quiz?.instructions_tl ?? "",
          questions: [...(quiz?.questions ?? [])]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((question) => ({
              id: question.id,
              prompt: question.prompt_tl ?? "",
              explanation: question.explanation_tl ?? "",
              correctLabel: "",
              choices: ["A", "B", "C", "D"].map((label) => {
                const match = [...(question.choices ?? [])].find(
                  (c) => c.label === label,
                );
                return { id: match?.id ?? null, label, body: match?.body_tl ?? "" };
              }),
            })),
        },
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

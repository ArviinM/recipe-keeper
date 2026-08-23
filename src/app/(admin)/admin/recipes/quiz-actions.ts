"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";

export type SaveResult = { ok: boolean; error?: string };

export type QuestionDraft = {
  id: string | null;
  prompt: string;
  explanation: string;
  correctLabel: string;
  choices: { id: string | null; label: string; body: string }[];
};

/** Creates the quiz row on demand so the wizard always has one to write to. */
async function ensureQuiz(recipeId: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("quizzes")
    .select("id")
    .eq("recipe_id", recipeId)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("quizzes")
    .insert({ recipe_id: recipeId, title: "Lesson Quiz" })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not create the quiz");
  return data.id;
}

export async function saveQuizSettings(
  recipeId: string,
  values: {
    title: string;
    instructions: string;
    passingPercentage: number;
    revealAnswers: boolean;
    isPublished: boolean;
  },
): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();

  try {
    const quizId = await ensureQuiz(recipeId);
    const { error } = await supabase
      .from("quizzes")
      .update({
        title: values.title.trim() || "Lesson Quiz",
        instructions: values.instructions.trim() || null,
        passing_percentage: Math.min(100, Math.max(0, values.passingPercentage)),
        reveal_answers: values.revealAnswers,
        is_published: values.isPublished,
      })
      .eq("id", quizId);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/quiz");
    revalidatePath("/admin/recipes");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

/**
 * Saves the question list.
 *
 * Deliberately an upsert rather than a delete-and-reinsert: attempt_answers
 * cascades from questions, so replacing every row on each autosave would wipe
 * the per-answer history the research relies on. Only questions the teacher
 * actually removed are deleted.
 */
export async function saveQuestions(
  recipeId: string,
  questions: QuestionDraft[],
): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();

  try {
    const quizId = await ensureQuiz(recipeId);

    const usable = questions.filter((q) => q.prompt.trim().length > 0);
    const keptIds = usable.map((q) => q.id).filter((id): id is string => Boolean(id));

    // Remove only the questions that are genuinely gone.
    const existingQuery = supabase.from("questions").select("id").eq("quiz_id", quizId);
    const { data: existing } = await existingQuery;
    const toDelete = (existing ?? [])
      .map((row) => row.id)
      .filter((id) => !keptIds.includes(id));

    if (toDelete.length) {
      await supabase.from("questions").delete().in("id", toDelete);
    }

    for (const [index, question] of usable.entries()) {
      let questionId = question.id;

      if (questionId) {
        const { error } = await supabase
          .from("questions")
          .update({
            prompt: question.prompt.trim(),
            explanation: question.explanation.trim() || null,
            sort_order: index + 1,
          })
          .eq("id", questionId);
        if (error) return { ok: false, error: error.message };
      } else {
        const { data, error } = await supabase
          .from("questions")
          .insert({
            quiz_id: quizId,
            prompt: question.prompt.trim(),
            explanation: question.explanation.trim() || null,
            sort_order: index + 1,
          })
          .select("id")
          .single();
        if (error || !data) return { ok: false, error: error?.message ?? "insert failed" };
        questionId = data.id;
      }

      // The answer key is cleared first so the choice rows can be rewritten
      // without tripping the foreign key from questions.correct_choice_id.
      await supabase
        .from("questions")
        .update({ correct_choice_id: null })
        .eq("id", questionId);

      const choices = question.choices.filter((c) => c.body.trim().length > 0);
      await supabase.from("choices").delete().eq("question_id", questionId);

      if (choices.length) {
        const { data: inserted, error } = await supabase
          .from("choices")
          .insert(
            choices.map((choice, choiceIndex) => ({
              question_id: questionId,
              label: choice.label,
              body: choice.body.trim(),
              sort_order: choiceIndex + 1,
            })),
          )
          .select("id, label");
        if (error) return { ok: false, error: error.message };

        const correct = inserted?.find((c) => c.label === question.correctLabel);
        if (correct) {
          await supabase
            .from("questions")
            .update({ correct_choice_id: correct.id })
            .eq("id", questionId);
        }
      }
    }

    revalidatePath("/quiz");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

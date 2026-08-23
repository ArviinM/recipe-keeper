import type { Client, MutationResult } from "@/lib/recipes/mutations";

export type QuestionDraft = {
  id: string | null;
  prompt: string;
  explanation: string;
  correctLabel: string;
  choices: { id: string | null; label: string; body: string }[];
};

/** Creates the quiz row on demand so the wizard always has one to write to. */
export async function ensureQuiz(supabase: Client, recipeId: string): Promise<string> {
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
  supabase: Client,
  recipeId: string,
  values: {
    title: string;
    instructions: string;
    passingPercentage: number;
    revealAnswers: boolean;
    isPublished: boolean;
  },
): Promise<MutationResult> {
  try {
    const quizId = await ensureQuiz(supabase, recipeId);
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

    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

/**
 * Saves the question list as an upsert, never a delete-and-reinsert.
 *
 * attempt_answers cascades from questions, so replacing every row on each
 * autosave would silently wipe the per-answer history the research depends on.
 * Only questions the teacher actually removed are deleted.
 */
export async function saveQuestions(
  supabase: Client,
  recipeId: string,
  questions: QuestionDraft[],
): Promise<MutationResult> {
  try {
    const quizId = await ensureQuiz(supabase, recipeId);

    const usable = questions.filter((q) => q.prompt.trim().length > 0);
    const keptIds = usable.map((q) => q.id).filter((id): id is string => Boolean(id));

    const { data: existing } = await supabase
      .from("questions")
      .select("id")
      .eq("quiz_id", quizId);

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

      // Cleared first so the choice rows can be rewritten without tripping the
      // foreign key from questions.correct_choice_id.
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

    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

import type { Client, MutationResult } from "@/lib/recipes/mutations";

export type QuestionDraft = {
  id: string | null;
  prompt: string;
  promptTl: string;
  explanation: string;
  explanationTl: string;
  correctLabel: string;
  choices: { id: string | null; label: string; body: string; bodyTl: string }[];
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
    titleTl: string;
    instructions: string;
    instructionsTl: string;
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
        title_tl: values.titleTl.trim() || null,
        instructions: values.instructions.trim() || null,
        instructions_tl: values.instructionsTl.trim() || null,
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
            prompt_tl: question.promptTl.trim() || null,
            explanation: question.explanation.trim() || null,
            explanation_tl: question.explanationTl.trim() || null,
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
            prompt_tl: question.promptTl.trim() || null,
            explanation: question.explanation.trim() || null,
            explanation_tl: question.explanationTl.trim() || null,
            sort_order: index + 1,
          })
          .select("id")
          .single();
        if (error || !data) return { ok: false, error: error?.message ?? "insert failed" };
        questionId = data.id;
      }

      // Choices are updated in place rather than replaced. attempt_answers
      // references choices with ON DELETE SET NULL, so deleting and reinserting
      // them would erase which distractor each student actually picked — the
      // data an item analysis depends on — and would drop body_tl, wiping the
      // Tagalog translation whenever the English text is edited.
      const { data: existingChoices } = await supabase
        .from("choices")
        .select("id, label")
        .eq("question_id", questionId);

      const wanted = question.choices.filter((c) => c.body.trim().length > 0);
      const byLabel = new Map((existingChoices ?? []).map((c) => [c.label, c.id]));
      const idByLabel = new Map<string, string>();

      for (const [choiceIndex, choice] of wanted.entries()) {
        const existingId = byLabel.get(choice.label);
        const values = {
          label: choice.label,
          body: choice.body.trim(),
          body_tl: choice.bodyTl.trim() || null,
          sort_order: choiceIndex + 1,
        };

        if (existingId) {
          const { error } = await supabase
            .from("choices")
            .update(values)
            .eq("id", existingId);
          if (error) return { ok: false, error: error.message };
          idByLabel.set(choice.label, existingId);
        } else {
          const { data, error } = await supabase
            .from("choices")
            .insert({ question_id: questionId, ...values })
            .select("id")
            .single();
          if (error || !data) {
            return { ok: false, error: error?.message ?? "choice insert failed" };
          }
          idByLabel.set(choice.label, data.id);
        }
      }

      // Only labels the teacher actually removed are deleted.
      const wantedLabels = new Set(wanted.map((c) => c.label));
      const staleIds = (existingChoices ?? [])
        .filter((c) => !wantedLabels.has(c.label))
        .map((c) => c.id);

      if (staleIds.length) {
        // The answer key is released first so the foreign key from
        // questions.correct_choice_id does not block the delete.
        await supabase
          .from("questions")
          .update({ correct_choice_id: null })
          .eq("id", questionId);
        const { error } = await supabase.from("choices").delete().in("id", staleIds);
        if (error) return { ok: false, error: error.message };
      }

      const correctId = idByLabel.get(question.correctLabel) ?? null;
      const { error: keyError } = await supabase
        .from("questions")
        .update({ correct_choice_id: correctId })
        .eq("id", questionId);
      if (keyError) return { ok: false, error: keyError.message };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

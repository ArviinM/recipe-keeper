"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type QuizAnswer = { question_id: string; choice_id: string | null };

export type QuizResult = {
  attempt_id: string;
  attempt_number: number;
  score: number;
  total_items: number;
  percentage: number;
  passed: boolean;
  reveal_answers: boolean;
  results: {
    question_id: string;
    choice_id: string | null;
    is_correct: boolean;
    correct_choice_id: string | null;
    explanation: string | null;
  }[];
};

/**
 * Hands the answers to the database and returns whatever it decides.
 *
 * Scoring is never done here — submit_quiz_attempt() owns it, so the answer key
 * stays server-side and a tampered client cannot inflate a score.
 */
export async function submitQuiz(
  recipeId: string,
  answers: QuizAnswer[],
): Promise<{ result?: QuizResult; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("submit_quiz_attempt", {
    p_recipe_id: recipeId,
    p_answers: answers.filter((a) => a.choice_id),
  });

  if (error) {
    return { error: "We could not save your answers. Please try again." };
  }

  revalidatePath("/progress");
  revalidatePath("/quiz");
  revalidatePath("/home");

  return { result: data as unknown as QuizResult };
}

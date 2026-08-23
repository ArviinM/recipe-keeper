"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import * as quizzes from "@/lib/quizzes/mutations";
import type { QuestionDraft } from "@/lib/quizzes/mutations";

export type SaveResult = { ok: boolean; error?: string };
export type { QuestionDraft };

export async function saveQuizSettings(
  recipeId: string,
  values: Parameters<typeof quizzes.saveQuizSettings>[2],
): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();
  const result = await quizzes.saveQuizSettings(supabase, recipeId, values);

  if (result.ok) {
    revalidatePath("/quiz");
    revalidatePath("/admin/recipes");
  }
  return result;
}

export async function saveQuestions(
  recipeId: string,
  questions: QuestionDraft[],
): Promise<SaveResult> {
  await requireStaff();
  const supabase = await createClient();
  const result = await quizzes.saveQuestions(supabase, recipeId, questions);
  if (result.ok) revalidatePath("/quiz");
  return result;
}

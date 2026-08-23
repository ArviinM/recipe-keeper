import { createClient } from "@/lib/supabase/server";

export type StudentProgress = {
  recipesCompleted: number;
  totalRecipes: number;
  quizzesCompleted: number;
  totalQuizzes: number;
  averagePercentage: number;
  quizzesPassed: number;
};

/**
 * Reads the student_progress view. The view is security_invoker, so a student
 * only ever sees their own row even though the view spans every profile.
 */
export async function getProgress(studentId: string): Promise<StudentProgress> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("student_progress")
    .select(
      "recipes_completed, total_recipes, quizzes_completed, total_quizzes, average_percentage, quizzes_passed",
    )
    .eq("student_id", studentId)
    .maybeSingle();

  return {
    recipesCompleted: Number(data?.recipes_completed ?? 0),
    totalRecipes: Number(data?.total_recipes ?? 0),
    quizzesCompleted: Number(data?.quizzes_completed ?? 0),
    totalQuizzes: Number(data?.total_quizzes ?? 0),
    averagePercentage: Number(data?.average_percentage ?? 0),
    quizzesPassed: Number(data?.quizzes_passed ?? 0),
  };
}

export type QuizStatus = {
  recipeSlug: string;
  recipeTitle: string;
  quizTitle: string;
  bestPercentage: number | null;
  bestScore: number | null;
  totalItems: number | null;
  attempts: number;
  passed: boolean;
};

/** Every published quiz with this student's best result, for the Quiz tab. */
export async function getQuizStatuses(studentId: string): Promise<QuizStatus[]> {
  const supabase = await createClient();

  // Independent of each other, so they go out together rather than one after
  // the other — each round trip to the database costs real time.
  const [{ data: quizzes }, { data: attempts }] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, title, recipes!inner(title, slug, is_published, sort_order)")
      .eq("is_published", true)
      .eq("recipes.is_published", true),
    supabase
      .from("attempts")
      .select("quiz_id, score, total_items, percentage, passed")
      .eq("student_id", studentId),
  ]);

  if (!quizzes?.length) return [];

  const best = new Map<string, { pct: number; score: number; total: number; passed: boolean; count: number }>();
  for (const attempt of attempts ?? []) {
    const current = best.get(attempt.quiz_id);
    const pct = Number(attempt.percentage);
    if (!current) {
      best.set(attempt.quiz_id, {
        pct,
        score: attempt.score,
        total: attempt.total_items,
        passed: attempt.passed,
        count: 1,
      });
    } else {
      current.count += 1;
      if (pct > current.pct) {
        current.pct = pct;
        current.score = attempt.score;
        current.total = attempt.total_items;
        current.passed = attempt.passed;
      }
    }
  }

  return quizzes
    .map((quiz) => {
      const result = best.get(quiz.id);
      return {
        recipeSlug: quiz.recipes.slug,
        recipeTitle: quiz.recipes.title,
        quizTitle: quiz.title,
        sortOrder: quiz.recipes.sort_order,
        bestPercentage: result?.pct ?? null,
        bestScore: result?.score ?? null,
        totalItems: result?.total ?? null,
        attempts: result?.count ?? 0,
        passed: result?.passed ?? false,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.recipeTitle.localeCompare(b.recipeTitle))
    .map((row) => {
      const { sortOrder, ...rest } = row;
      void sortOrder;
      return rest;
    });
}

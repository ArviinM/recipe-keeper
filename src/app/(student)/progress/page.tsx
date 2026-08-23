import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { getProgress, getQuizStatuses } from "@/lib/data/progress";

export const metadata: Metadata = { title: "My Progress" };

export default async function ProgressPage() {
  const user = await requireUser();
  const [progress, quizzes] = await Promise.all([
    getProgress(user.id),
    getQuizStatuses(user.id),
  ]);

  const taken = quizzes.filter((q) => q.attempts > 0);

  const pct = (value: number, total: number) =>
    total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">My Progress</h1>
        <p className="text-muted-foreground">{user.fullName}</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Recipes completed"
          value={`${progress.recipesCompleted}/${progress.totalRecipes}`}
        />
        <StatCard
          label="Quizzes completed"
          value={`${progress.quizzesCompleted}/${progress.totalQuizzes}`}
        />
        <StatCard
          label="Average score"
          value={progress.quizzesCompleted ? `${progress.averagePercentage}%` : "—"}
        />
        <StatCard
          label="Quizzes passed"
          value={`${progress.quizzesPassed}`}
        />
      </div>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-bold">Lessons completed</h2>
            <span className="text-muted-foreground text-sm font-semibold">
              {pct(progress.recipesCompleted, progress.totalRecipes)}%
            </span>
          </div>
          <Progress
            value={pct(progress.recipesCompleted, progress.totalRecipes)}
            className="h-3"
          />
          <p className="text-muted-foreground text-sm">
            A lesson counts as completed once you have taken its quiz.
          </p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Quiz scores</h2>
        {taken.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground text-sm">
                Take your first quiz and your scores will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {taken.map((quiz) => (
              <li key={quiz.recipeSlug}>
                <Card>
                  <CardContent className="space-y-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="truncate font-semibold">
                        {quiz.recipeTitle}
                      </h3>
                      <span className="shrink-0 font-bold tabular-nums">
                        {quiz.bestScore}/{quiz.totalItems}
                      </span>
                    </div>
                    <Progress value={quiz.bestPercentage ?? 0} className="h-2" />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="space-y-1 py-5 text-center">
        <p className="text-2xl font-extrabold tabular-nums">{value}</p>
        <p className="text-muted-foreground text-xs font-semibold">{label}</p>
      </CardContent>
    </Card>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Check, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getQuizStatuses } from "@/lib/data/progress";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Quizzes" };

export default async function QuizListPage() {
  const user = await requireUser();
  const quizzes = await getQuizStatuses(user.id);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Quizzes</h1>
        <p className="text-muted-foreground">
          Check what you know after each lesson.
        </p>
      </header>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-semibold">No quizzes yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Quizzes appear here once your teacher publishes them.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {quizzes.map((quiz) => (
            <li key={quiz.recipeSlug}>
              <Card>
                <CardContent className="flex items-center gap-4">
                  <span
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-xl",
                      quiz.passed
                        ? "bg-accent text-brand-green"
                        : "bg-secondary text-primary",
                    )}
                    aria-hidden
                  >
                    {quiz.passed ? (
                      <Check className="size-6" />
                    ) : (
                      <ListChecks className="size-6" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-bold">{quiz.recipeTitle}</h2>
                    <p className="text-muted-foreground text-sm">
                      {quiz.attempts === 0 ? (
                        "Not taken yet"
                      ) : (
                        <>
                          Best: {quiz.bestScore}/{quiz.totalItems} (
                          {quiz.bestPercentage}%)
                          {quiz.attempts > 1 && ` · ${quiz.attempts} attempts`}
                        </>
                      )}
                    </p>
                  </div>

                  <Button asChild size="sm" variant={quiz.attempts ? "outline" : "default"}>
                    <Link href={`/recipes/${quiz.recipeSlug}/quiz`}>
                      {quiz.attempts ? "Retake" : "Start"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

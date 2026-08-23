import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { RecipeCard } from "@/components/student/recipe-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { redirect } from "next/navigation";

import { firstName, isStaff, requireUser } from "@/lib/auth";
import { getRecipes } from "@/lib/data/recipes";
import { getProgress } from "@/lib/data/progress";
import { dictionary } from "@/lib/i18n/dictionary";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const user = await requireUser();

  // Staff belong in the dashboard. Previewing a lesson still works — that goes
  // to /recipes/[slug], not here.
  if (isStaff(user.role)) redirect("/admin");

  const t = dictionary(user.locale);
  const [recipes, progress] = await Promise.all([
    getRecipes({ locale: user.locale }),
    getProgress(user.id),
  ]);

  const percent =
    progress.totalRecipes > 0
      ? Math.round((progress.recipesCompleted / progress.totalRecipes) * 100)
      : 0;

  return (
    <div className="space-y-7">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {t.greeting}, {firstName(user.fullName)}!
        </h1>
        <p className="text-muted-foreground">{t.tagline}</p>
      </header>

      <Card className="bg-accent/60 border-brand-green/20">
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-bold">{t.yourProgress}</h2>
            <span className="text-muted-foreground text-sm font-semibold">
              {progress.recipesCompleted} {t.ofLessons} {progress.totalRecipes}{" "}
              {t.lessonsWord}
            </span>
          </div>
          <Progress value={percent} className="h-3" />
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span>
              <span className="font-bold">{progress.quizzesCompleted}</span>{" "}
              <span className="text-muted-foreground">{t.quizzesTaken}</span>
            </span>
            {progress.quizzesCompleted > 0 && (
              <span>
                <span className="font-bold">{progress.averagePercentage}%</span>{" "}
                <span className="text-muted-foreground">{t.averageScore}</span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{t.lessons}</h2>
          <Button asChild variant="ghost" size="sm" className="font-semibold">
            <Link href="/recipes">
              {t.seeAll}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>

        {recipes.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="font-semibold">{t.noLessonsYet}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {t.noLessonsBody}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recipes.slice(0, 4).map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} locale={user.locale} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

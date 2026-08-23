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
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const user = await requireUser();

  // Staff belong in the dashboard. Previewing a lesson still works — that goes
  // to /recipes/[slug], not here.
  if (isStaff(user.role)) redirect("/admin");

  const [recipes, progress] = await Promise.all([
    getRecipes(),
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
          Kumusta, {firstName(user.fullName)}!
        </h1>
        <p className="text-muted-foreground">{site.tagline}</p>
      </header>

      <Card className="bg-accent/60 border-brand-green/20">
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-bold">Your progress</h2>
            <span className="text-muted-foreground text-sm font-semibold">
              {progress.recipesCompleted} of {progress.totalRecipes} lessons
            </span>
          </div>
          <Progress value={percent} className="h-3" />
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span>
              <span className="font-bold">{progress.quizzesCompleted}</span>{" "}
              <span className="text-muted-foreground">quizzes taken</span>
            </span>
            {progress.quizzesCompleted > 0 && (
              <span>
                <span className="font-bold">{progress.averagePercentage}%</span>{" "}
                <span className="text-muted-foreground">average score</span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Lessons</h2>
          <Button asChild variant="ghost" size="sm" className="font-semibold">
            <Link href="/recipes">
              See all
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>

        {recipes.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="font-semibold">No lessons yet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Your teacher has not published any recipes yet. Check back soon.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recipes.slice(0, 4).map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

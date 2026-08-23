import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

import { QuizRunner } from "./quiz-runner";

export const metadata: Metadata = { title: "Quiz" };

type QuizPayload = {
  quiz: {
    id: string;
    recipe_id: string;
    title: string;
    instructions: string | null;
    passing_percentage: number;
    shuffle_questions: boolean;
  };
  questions: {
    id: string;
    prompt: string;
    points: number;
    sort_order: number;
    choices: { id: string; label: string; body: string }[];
  }[];
};

export default async function QuizPage({
  params,
}: PageProps<"/recipes/[slug]/quiz">) {
  const { slug } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id, title, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!recipe) notFound();

  // The answer key never travels: this RPC returns prompts and choices only.
  const { data, error } = await supabase.rpc("get_quiz_for_student", {
    p_recipe_id: recipe.id,
  });

  if (error || !data) {
    return (
      <Card>
        <CardContent className="space-y-4 py-12 text-center">
          <p className="font-semibold">This quiz is not available yet</p>
          <p className="text-muted-foreground text-sm">
            Your teacher has not published a quiz for this lesson.
          </p>
          <Button asChild variant="secondary">
            <Link href={`/recipes/${slug}`}>Back to the lesson</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const payload = data as unknown as QuizPayload;

  return (
    <QuizRunner
      recipeId={recipe.id}
      recipeSlug={recipe.slug}
      recipeTitle={recipe.title}
      studentName={user.fullName}
      quiz={payload.quiz}
      questions={payload.questions}
    />
  );
}

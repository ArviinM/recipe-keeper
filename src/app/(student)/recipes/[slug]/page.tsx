import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getRecipeBySlug } from "@/lib/data/recipes";
import { requireUser } from "@/lib/auth";

import { LessonStepper } from "./lesson-stepper";

export async function generateMetadata({
  params,
}: PageProps<"/recipes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  return { title: recipe?.title ?? "Recipe" };
}

export default async function RecipePage({
  params,
}: PageProps<"/recipes/[slug]">) {
  const { slug } = await params;
  const user = await requireUser();
  const recipe = await getRecipeBySlug(slug, user.locale);

  if (!recipe) notFound();

  return <LessonStepper recipe={recipe} locale={user.locale} />;
}

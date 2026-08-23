import Image from "next/image";
import Link from "next/link";
import { ChefHat, ListChecks } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RecipeCard as RecipeCardData } from "@/lib/data/recipes";

export function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  return (
    <Card className="overflow-hidden py-0 shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/recipes/${recipe.slug}`} className="block">
        <div className="bg-muted relative aspect-[16/10] w-full">
          {recipe.imageUrl ? (
            <Image
              src={recipe.imageUrl}
              alt=""
              fill
              sizes="(max-width: 672px) 100vw, 336px"
              className="object-cover"
            />
          ) : (
            // Recipes are authored before their photos exist, so the empty
            // state has to look deliberate rather than broken.
            <div className="text-muted-foreground/50 flex h-full items-center justify-center">
              <ChefHat className="size-12" aria-hidden />
            </div>
          )}
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {recipe.categoryName && (
            <Badge variant="secondary" className="font-semibold">
              {recipe.categoryName}
            </Badge>
          )}
          {recipe.difficulty && (
            <Badge variant="outline" className="capitalize">
              {recipe.difficulty}
            </Badge>
          )}
          {recipe.hasQuiz && (
            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-semibold">
              <ListChecks className="size-3.5" aria-hidden />
              Quiz
            </span>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold leading-tight">
            <Link href={`/recipes/${recipe.slug}`} className="hover:underline">
              {recipe.title}
            </Link>
          </h3>
          {recipe.description && (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {recipe.description}
            </p>
          )}
        </div>

        <Button asChild className="h-11 w-full font-bold">
          <Link href={`/recipes/${recipe.slug}`}>View Recipe</Link>
        </Button>
      </div>
    </Card>
  );
}

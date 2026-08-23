import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { RecipeCard } from "@/components/student/recipe-card";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getCategories, getRecipes } from "@/lib/data/recipes";

export const metadata: Metadata = { title: "Recipes" };

export default async function RecipesPage({
  searchParams,
}: PageProps<"/recipes">) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";

  const [categories, recipes] = await Promise.all([
    getCategories(),
    getRecipes({ search, categorySlug: category }),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Recipes</h1>
        <p className="text-muted-foreground">
          Choose a lesson to start learning.
        </p>
      </header>

      {/* A plain GET form: it works before JavaScript loads, which matters on a
          slow classroom connection. */}
      <form action="/recipes" className="relative">
        {category && <input type="hidden" name="category" value={category} />}
        <Search
          className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search recipe…"
          aria-label="Search recipes"
          className="h-12 pl-11"
        />
      </form>

      <nav aria-label="Categories" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex w-max gap-2 pb-1">
          <CategoryChip
            href={search ? `/recipes?q=${encodeURIComponent(search)}` : "/recipes"}
            label="All"
            active={!category}
          />
          {categories.map((item) => {
            const query = new URLSearchParams();
            if (search) query.set("q", search);
            query.set("category", item.slug);
            return (
              <CategoryChip
                key={item.id}
                href={`/recipes?${query.toString()}`}
                label={item.name}
                active={category === item.slug}
              />
            );
          })}
        </ul>
      </nav>

      {recipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-semibold">
              {search ? `No recipes found for “${search}”` : "No recipes here yet"}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {search
                ? "Try a different word, or clear the search box."
                : "Your teacher has not published a recipe in this category yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "true" : undefined}
        className={cn(
          "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
          active
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card border-border hover:bg-secondary",
        )}
      >
        {label}
      </Link>
    </li>
  );
}

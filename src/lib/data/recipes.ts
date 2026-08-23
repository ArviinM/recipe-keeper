import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

const BUCKET = "recipe-media";

/** Public URL for a stored image, or null when the recipe has no photo yet. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${env.supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}

export type RecipeCard = {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  difficulty: string | null;
  categoryName: string | null;
  hasQuiz: boolean;
};

export async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("sort_order");
  return data ?? [];
}

/**
 * Published recipes for the library, optionally narrowed by the search box or a
 * category chip. Row level security already hides unpublished rows from
 * students; the explicit filter keeps staff previews out of the student list.
 */
export async function getRecipes(opts: {
  search?: string;
  categorySlug?: string;
} = {}): Promise<RecipeCard[]> {
  const supabase = await createClient();

  let query = supabase
    .from("recipes")
    .select(
      "id, title, slug, description, image_path, difficulty, is_published, sort_order, categories(name, slug), quizzes(id, is_published)",
    )
    .eq("is_published", true)
    .order("sort_order")
    .order("title");

  if (opts.search?.trim()) {
    const term = opts.search.trim();
    // Matches the recipe name or its description, so "chicken" finds
    // Chicken Adobo and anything described as a chicken dish.
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data } = await query;
  if (!data) return [];

  return data
    .filter((row) =>
      opts.categorySlug ? row.categories?.slug === opts.categorySlug : true,
    )
    .map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      imageUrl: mediaUrl(row.image_path),
      difficulty: row.difficulty,
      categoryName: row.categories?.name ?? null,
      hasQuiz: Boolean(row.quizzes?.is_published),
    }));
}

export async function getRecipeBySlug(slug: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("recipes")
    .select(
      `id, title, slug, description, image_path, video_url, objectives,
       safety_notes, chef_tips, prep_minutes, cook_minutes, servings,
       difficulty, is_published,
       categories(name, slug),
       ingredients(id, quantity, item, note, sort_order),
       steps(id, step_number, instruction, image_path),
       recipe_techniques(sort_order, techniques(id, name, description)),
       quizzes(id, title, instructions, passing_percentage, is_published)`,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;

  return {
    ...data,
    imageUrl: mediaUrl(data.image_path),
    ingredients: [...(data.ingredients ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
    steps: [...(data.steps ?? [])]
      .sort((a, b) => a.step_number - b.step_number)
      .map((step) => ({ ...step, imageUrl: mediaUrl(step.image_path) })),
    techniques: [...(data.recipe_techniques ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => row.techniques)
      .filter((t): t is NonNullable<typeof t> => Boolean(t)),
  };
}

export type RecipeDetail = NonNullable<Awaited<ReturnType<typeof getRecipeBySlug>>>;

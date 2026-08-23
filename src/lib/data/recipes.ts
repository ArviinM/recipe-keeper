import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { pick, pickList, type Locale } from "@/lib/i18n";

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
    .select("id, name, name_tl, slug")
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
  locale?: Locale;
} = {}): Promise<RecipeCard[]> {
  const locale = opts.locale ?? "en";
  const supabase = await createClient();

  let query = supabase
    .from("recipes")
    .select(
      "id, title, title_tl, slug, description, description_tl, image_path, difficulty, is_published, sort_order, categories(name, name_tl, slug), quizzes(id, is_published)",
    )
    .eq("is_published", true)
    .order("sort_order")
    .order("title");

  if (opts.search?.trim()) {
    const term = opts.search.trim();
    // Searches both languages, so a student typing "manok" finds the same
    // lesson as one typing "chicken".
    query = query.or(
      `title.ilike.%${term}%,description.ilike.%${term}%,` +
        `title_tl.ilike.%${term}%,description_tl.ilike.%${term}%`,
    );
  }

  const { data } = await query;
  if (!data) return [];

  return data
    .filter((row) =>
      opts.categorySlug ? row.categories?.slug === opts.categorySlug : true,
    )
    .map((row) => ({
      id: row.id,
      title: pick(locale, row.title, row.title_tl),
      slug: row.slug,
      description: pick(locale, row.description, row.description_tl),
      imageUrl: mediaUrl(row.image_path),
      difficulty: row.difficulty,
      categoryName: row.categories
        ? pick(locale, row.categories.name, row.categories.name_tl)
        : null,
      hasQuiz: Boolean(row.quizzes?.is_published),
    }));
}

export async function getRecipeBySlug(slug: string, locale: Locale = "en") {
  const supabase = await createClient();

  const { data } = await supabase
    .from("recipes")
    .select(
      `id, title, title_tl, slug, description, description_tl, image_path,
       video_url, objectives, objectives_tl, safety_notes, safety_notes_tl,
       chef_tips, chef_tips_tl, prep_minutes, cook_minutes, servings,
       difficulty, is_published,
       categories(name, name_tl, slug),
       ingredients(id, quantity, quantity_tl, item, item_tl, note, note_tl, sort_order),
       steps(id, step_number, instruction, instruction_tl, image_path),
       recipe_techniques(sort_order, techniques(id, name, name_tl, description, description_tl)),
       quizzes(id, title, instructions, passing_percentage, is_published)`,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;

  // Resolved to one language here so the components never think about it.
  return {
    ...data,
    title: pick(locale, data.title, data.title_tl),
    description: pick(locale, data.description, data.description_tl),
    objectives: pickList(locale, data.objectives, data.objectives_tl),
    safety_notes: pickList(locale, data.safety_notes, data.safety_notes_tl),
    chef_tips: pickList(locale, data.chef_tips, data.chef_tips_tl),
    categoryName: data.categories
      ? pick(locale, data.categories.name, data.categories.name_tl)
      : null,
    imageUrl: mediaUrl(data.image_path),
    ingredients: [...(data.ingredients ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => ({
        id: row.id,
        quantity: pick(locale, row.quantity, row.quantity_tl),
        item: pick(locale, row.item, row.item_tl),
        note: pick(locale, row.note, row.note_tl),
      })),
    steps: [...(data.steps ?? [])]
      .sort((a, b) => a.step_number - b.step_number)
      .map((step) => ({
        id: step.id,
        step_number: step.step_number,
        instruction: pick(locale, step.instruction, step.instruction_tl),
        imageUrl: mediaUrl(step.image_path),
      })),
    techniques: [...(data.recipe_techniques ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => row.techniques)
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
      .map((technique) => ({
        id: technique.id,
        name: pick(locale, technique.name, technique.name_tl),
        description: pick(locale, technique.description, technique.description_tl),
      })),
  };
}

export type RecipeDetail = NonNullable<Awaited<ReturnType<typeof getRecipeBySlug>>>;

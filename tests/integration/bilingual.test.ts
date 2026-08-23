import { beforeAll, afterAll, describe, expect, it } from "vitest";

import * as recipes from "@/lib/recipes/mutations";
import * as quizzes from "@/lib/quizzes/mutations";
import type { Client } from "@/lib/recipes/mutations";
import { pick, pickList } from "@/lib/i18n";

import {
  adminClient,
  createTestUser,
  deleteTestUsers,
  uid,
  type TestUser,
} from "../helpers/supabase";

describe("bilingual content", () => {
  const admin = adminClient();
  const created: string[] = [];
  const recipeIds: string[] = [];
  const run = uid();

  let teacher: TestUser;
  let student: TestUser;
  let teacherDb: Client;
  let recipeId: string;

  beforeAll(async () => {
    teacher = await createTestUser({
      role: "teacher",
      fullName: "Bilingual Teacher",
      username: `bt${run}`,
    });
    student = await createTestUser({
      role: "student",
      fullName: "Bilingual Student",
      username: `bs${run}`,
    });
    created.push(teacher.id, student.id);
    teacherDb = teacher.client as unknown as Client;

    const { id } = await recipes.createRecipeDraft(teacherDb, teacher.id);
    recipeId = id!;
    recipeIds.push(recipeId);

    // English first, because it is the fallback.
    await recipes.saveRecipeBasics(teacherDb, recipeId, {
      title: `Chicken Dish ${run}`,
      categoryId: null,
      description: "A chicken dish.",
      difficulty: "easy",
      servings: 4,
      prepMinutes: 10,
      cookMinutes: 20,
      videoUrl: null,
    });
    await recipes.saveIngredients(teacherDb, recipeId, [
      { quantity: "1 kg", item: "chicken", note: "" },
      { quantity: "1 cup", item: "water", note: "" },
    ]);
    await recipes.saveSteps(teacherDb, recipeId, [
      { instruction: "Clean the chicken.", imagePath: null },
      { instruction: "Cook the chicken.", imagePath: null },
    ]);
  });

  afterAll(async () => {
    for (const id of recipeIds) await admin.from("recipes").delete().eq("id", id);
    await deleteTestUsers(created);
  });

  it("falls back to English when a translation is missing", () => {
    expect(pick("tl", "Chicken", null)).toBe("Chicken");
    expect(pick("tl", "Chicken", "   ")).toBe("Chicken");
    expect(pick("tl", "Chicken", "Manok")).toBe("Manok");
    expect(pick("en", "Chicken", "Manok")).toBe("Chicken");
    expect(pickList("tl", ["a", "b"], [])).toEqual(["a", "b"]);
    expect(pickList("tl", ["a"], ["x"])).toEqual(["x"]);
  });

  it("keeps the English text when Tagalog is saved", async () => {
    await recipes.saveRecipeBasics(
      teacherDb,
      recipeId,
      {
        title: `Ulam na Manok ${run}`,
        categoryId: null,
        description: "Isang putahe ng manok.",
        difficulty: null,
        servings: null,
        prepMinutes: null,
        cookMinutes: null,
        videoUrl: null,
      },
      "tl",
    );

    const { data } = await admin
      .from("recipes")
      .select("title, title_tl, description, description_tl, servings, difficulty")
      .eq("id", recipeId)
      .single();

    expect(data!.title).toBe(`Chicken Dish ${run}`);
    expect(data!.title_tl).toBe(`Ulam na Manok ${run}`);
    expect(data!.description).toBe("A chicken dish.");
    // Language-neutral fields are untouched by the Tagalog pass.
    expect(data!.servings).toBe(4);
    expect(data!.difficulty).toBe("easy");
  });

  it("translates ingredients in place without dropping any", async () => {
    await recipes.saveIngredients(
      teacherDb,
      recipeId,
      [
        { quantity: "1 kilo", item: "manok", note: "" },
        { quantity: "1 tasa", item: "tubig", note: "" },
      ],
      "tl",
    );

    const { data } = await admin
      .from("ingredients")
      .select("item, item_tl, sort_order")
      .eq("recipe_id", recipeId)
      .order("sort_order");

    expect(data).toHaveLength(2);
    expect(data![0].item).toBe("chicken");
    expect(data![0].item_tl).toBe("manok");
    expect(data![1].item_tl).toBe("tubig");
  });

  it("translates steps without renumbering them", async () => {
    await recipes.saveSteps(
      teacherDb,
      recipeId,
      [
        { instruction: "Linisin ang manok.", imagePath: null },
        { instruction: "Lutuin ang manok.", imagePath: null },
      ],
      "tl",
    );

    const { data } = await admin
      .from("steps")
      .select("step_number, instruction, instruction_tl")
      .eq("recipe_id", recipeId)
      .order("step_number");

    expect(data!.map((s) => s.step_number)).toEqual([1, 2]);
    expect(data![0].instruction).toBe("Clean the chicken.");
    expect(data![0].instruction_tl).toBe("Linisin ang manok.");
  });

  /**
   * The quiz RPC was rewritten to take a locale. Re-proving the answer key
   * cannot leak in either language, because that is the property the whole
   * study depends on.
   */
  it("serves the quiz in Tagalog and still never sends the answer key", async () => {
    const draft = {
      id: null as string | null,
      prompt: "What is the correct answer?",
      explanation: "Because B.",
      correctLabel: "B",
      choices: ["A", "B", "C", "D"].map((label) => ({
        id: null,
        label,
        body: `Choice ${label}`,
      })),
    };

    await quizzes.saveQuestions(teacherDb, recipeId, [draft]);
    await quizzes.saveQuizSettings(teacherDb, recipeId, {
      title: "Quiz",
      instructions: "Answer carefully.",
      passingPercentage: 50,
      revealAnswers: false,
      isPublished: true,
    });

    const { data: saved } = await admin
      .from("quizzes")
      .select("questions(id)")
      .eq("recipe_id", recipeId)
      .single();
    const questionId = saved!.questions[0].id;

    await quizzes.saveQuestions(
      teacherDb,
      recipeId,
      [{ ...draft, id: questionId, prompt: "Ano ang tamang sagot?" }],
      "tl",
    );
    await recipes.setRecipePublished(teacherDb, recipeId, true);

    for (const locale of ["en", "tl"] as const) {
      const { data, error } = await student.client.rpc("get_quiz_for_student", {
        p_recipe_id: recipeId,
        p_locale: locale,
      });
      expect(error).toBeNull();

      const payload = data as unknown as {
        questions: { prompt: string; choices: { body: string }[] }[];
      };
      const serialised = JSON.stringify(payload);

      expect(serialised).not.toContain("correct_choice_id");
      expect(serialised).not.toContain("is_correct");
      // The explanation gives the answer away, so it must not travel either.
      expect(serialised).not.toContain("Because B");

      expect(payload.questions[0].prompt).toBe(
        locale === "tl" ? "Ano ang tamang sagot?" : "What is the correct answer?",
      );
    }
  });

  it("falls back to the English prompt when a question is untranslated", async () => {
    const { data } = await student.client.rpc("get_quiz_for_student", {
      p_recipe_id: recipeId,
      p_locale: "tl",
    });

    const payload = data as unknown as {
      questions: { choices: { body: string }[] }[];
    };
    // Choices were never translated, so Tagalog readers still see them.
    expect(payload.questions[0].choices[0].body).toBe("Choice A");
  });
});

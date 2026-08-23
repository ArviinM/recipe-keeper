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
      titleTl: "",
      description: "A chicken dish.",
      descriptionTl: "",
      categoryId: null,
      difficulty: "easy",
      servings: 4,
      prepMinutes: 10,
      cookMinutes: 20,
      videoUrl: null,
    });
    await recipes.saveIngredients(teacherDb, recipeId, [
      { id: null, quantity: "1 kg", item: "chicken", note: "", quantityTl: "", itemTl: "", noteTl: "" },
      { id: null, quantity: "1 cup", item: "water", note: "", quantityTl: "", itemTl: "", noteTl: "" },
    ]);
    await recipes.saveSteps(teacherDb, recipeId, [
      { id: null, instruction: "Clean the chicken.", instructionTl: "", imagePath: null },
      { id: null, instruction: "Cook the chicken.", instructionTl: "", imagePath: null },
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

  it("keeps the English text when Tagalog is added", async () => {
    await recipes.saveRecipeBasics(teacherDb, recipeId, {
      title: `Chicken Dish ${run}`,
      titleTl: `Ulam na Manok ${run}`,
      description: "A chicken dish.",
      descriptionTl: "Isang putahe ng manok.",
      categoryId: null,
      difficulty: "easy",
      servings: 4,
      prepMinutes: 10,
      cookMinutes: 20,
      videoUrl: null,
    });

    const { data } = await admin
      .from("recipes")
      .select("title, title_tl, description, description_tl, servings, difficulty")
      .eq("id", recipeId)
      .single();

    expect(data!.title).toBe(`Chicken Dish ${run}`);
    expect(data!.title_tl).toBe(`Ulam na Manok ${run}`);
    expect(data!.description).toBe("A chicken dish.");
    expect(data!.servings).toBe(4);
    expect(data!.difficulty).toBe("easy");
  });

  it("stores both languages on the same ingredient rows", async () => {
    const { data: before } = await admin
      .from("ingredients")
      .select("id, sort_order")
      .eq("recipe_id", recipeId)
      .order("sort_order");

    await recipes.saveIngredients(teacherDb, recipeId, [
      { id: before![0].id, quantity: "1 kg", item: "chicken", note: "", quantityTl: "1 kilo", itemTl: "manok", noteTl: "" },
      { id: before![1].id, quantity: "1 cup", item: "water", note: "", quantityTl: "1 tasa", itemTl: "tubig", noteTl: "" },
    ]);

    const { data } = await admin
      .from("ingredients")
      .select("id, item, item_tl, sort_order")
      .eq("recipe_id", recipeId)
      .order("sort_order");

    expect(data).toHaveLength(2);
    expect(data![0].item).toBe("chicken");
    expect(data![0].item_tl).toBe("manok");
    expect(data![1].item_tl).toBe("tubig");
    expect(data![0].id).toBe(before![0].id);
  });

  it("stores both languages on the same steps without renumbering", async () => {
    const { data: before } = await admin
      .from("steps")
      .select("id, step_number")
      .eq("recipe_id", recipeId)
      .order("step_number");

    await recipes.saveSteps(teacherDb, recipeId, [
      { id: before![0].id, instruction: "Clean the chicken.", instructionTl: "Linisin ang manok.", imagePath: null },
      { id: before![1].id, instruction: "Cook the chicken.", instructionTl: "Lutuin ang manok.", imagePath: null },
    ]);

    const { data } = await admin
      .from("steps")
      .select("id, instruction, instruction_tl, step_number")
      .eq("recipe_id", recipeId)
      .order("step_number");

    expect(data!.map((r) => r.step_number)).toEqual([1, 2]);
    expect(data![0].instruction).toBe("Clean the chicken.");
    expect(data![0].instruction_tl).toBe("Linisin ang manok.");
    expect(data![0].id).toBe(before![0].id);
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
      promptTl: "",
      explanation: "Because B.",
      explanationTl: "",
      correctLabel: "B",
      choices: ["A", "B", "C", "D"].map((label) => ({
        id: null,
        label,
        body: `Choice ${label}`,
        bodyTl: "",
      })),
    };

    await quizzes.saveQuestions(teacherDb, recipeId, [draft]);
    await quizzes.saveQuizSettings(teacherDb, recipeId, {
      title: "Quiz",
      titleTl: "",
      instructions: "Answer carefully.",
      instructionsTl: "",
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

    await quizzes.saveQuestions(teacherDb, recipeId, [
      { ...draft, id: questionId, promptTl: "Ano ang tamang sagot?" },
    ]);
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

  /**
   * The audit's blocker. Editing English used to delete and reinsert the rows,
   * so every Tagalog translation on that list vanished the moment a typo was
   * fixed in the English text — silently, hours of work at a time.
   */
  it("keeps the Tagalog translation when the English text is edited", async () => {
    const { data: before } = await admin
      .from("ingredients")
      .select("id, item, item_tl, sort_order")
      .eq("recipe_id", recipeId)
      .order("sort_order");

    expect(before![0].item_tl).toBe("manok");

    // The teacher fixes a typo in the English word only.
    await recipes.saveIngredients(teacherDb, recipeId, [
      { id: before![0].id, quantity: "1 kg", item: "chicken thighs", note: "", quantityTl: "1 kilo", itemTl: "manok", noteTl: "" },
      { id: before![1].id, quantity: "1 cup", item: "water", note: "", quantityTl: "1 tasa", itemTl: "tubig", noteTl: "" },
    ]);

    const { data: after } = await admin
      .from("ingredients")
      .select("id, item, item_tl, sort_order")
      .eq("recipe_id", recipeId)
      .order("sort_order");

    expect(after![0].item).toBe("chicken thighs");
    expect(after![0].item_tl).toBe("manok");
    expect(after![1].item_tl).toBe("tubig");
    // Same rows, not replacements.
    expect(after![0].id).toBe(before![0].id);
  });

  it("keeps step translations when the English procedure is edited", async () => {
    const { data: before } = await admin
      .from("steps")
      .select("id, instruction, instruction_tl, step_number")
      .eq("recipe_id", recipeId)
      .order("step_number");

    await recipes.saveSteps(teacherDb, recipeId, [
      { id: before![0].id, instruction: "Clean the chicken well.", instructionTl: "Linisin ang manok.", imagePath: null },
      { id: before![1].id, instruction: "Cook the chicken.", instructionTl: "Lutuin ang manok.", imagePath: null },
    ]);

    const { data: after } = await admin
      .from("steps")
      .select("id, instruction, instruction_tl, step_number")
      .eq("recipe_id", recipeId)
      .order("step_number");

    expect(after![0].instruction).toBe("Clean the chicken well.");
    expect(after![0].instruction_tl).toBe("Linisin ang manok.");
    expect(after![0].id).toBe(before![0].id);
    expect(after!.map((r) => r.step_number)).toEqual([1, 2]);
  });

  /**
   * attempt_answers references choices with ON DELETE SET NULL, so replacing
   * the choice rows on every save erased which distractor each student picked.
   * The scores survived, which is what made the loss invisible until analysis.
   */
  it("keeps which choice each student picked when the quiz is edited", async () => {
    const { data: quiz } = await admin
      .from("quizzes")
      .select("questions(id, prompt, correct_choice_id, choices!choices_question_id_fkey(id, label, body, body_tl))")
      .eq("recipe_id", recipeId)
      .single();

    const question = quiz!.questions[0];
    const keyBefore = question.correct_choice_id;

    // A student answers it, so there is history to protect.
    const { data: payload } = await student.client.rpc("get_quiz_for_student", {
      p_recipe_id: recipeId,
      p_locale: "en",
    });
    const served = payload as unknown as {
      questions: { id: string; choices: { id: string; label: string }[] }[];
    };
    await student.client.rpc("submit_quiz_attempt", {
      p_recipe_id: recipeId,
      p_answers: served.questions.map((q) => ({
        question_id: q.id,
        choice_id: q.choices.find((c) => c.label === "D")!.id,
      })),
    });

    const { data: answersBefore } = await admin
      .from("attempt_answers")
      .select("id, choice_id")
      .eq("question_id", question.id);

    const recorded = (answersBefore ?? []).filter((a) => a.choice_id !== null);
    expect(recorded.length).toBeGreaterThan(0);

    // The teacher rewords one distractor.
    await quizzes.saveQuestions(teacherDb, recipeId, [
      {
        id: question.id,
        prompt: "What is the correct answer?",
        promptTl: "Ano ang tamang sagot?",
        explanation: "Because B.",
        explanationTl: "",
        correctLabel: "B",
        choices: ["A", "B", "C", "D"].map((label) => ({
          id: null,
          label,
          body: label === "D" ? "Choice D reworded" : `Choice ${label}`,
          bodyTl: label === "A" ? "Pagpipilian A" : "",
        })),
      },
    ]);

    const { data: answersAfter } = await admin
      .from("attempt_answers")
      .select("id, choice_id")
      .eq("question_id", question.id);

    const stillRecorded = (answersAfter ?? []).filter((a) => a.choice_id !== null);
    expect(stillRecorded.length).toBe(recorded.length);

    // And the answer key still points somewhere valid.
    const { data: after } = await admin
      .from("questions")
      .select("correct_choice_id, choices!choices_question_id_fkey(id, label, body_tl)")
      .eq("id", question.id)
      .single();

    expect(after!.correct_choice_id).toBe(keyBefore);
    const tagalogSurvived = after!.choices.some(
      (c: { body_tl: string | null }) => c.body_tl !== null,
    );
    expect(tagalogSurvived).toBe(true);
  });
});

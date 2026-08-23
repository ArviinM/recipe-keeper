import { beforeAll, afterAll, describe, expect, it } from "vitest";

import * as recipes from "@/lib/recipes/mutations";
import * as quizzes from "@/lib/quizzes/mutations";
import * as categoriesLib from "@/lib/categories/mutations";
import type { Client } from "@/lib/recipes/mutations";

import {
  adminClient,
  createTestUser,
  deleteTestUsers,
  uid,
  type TestUser,
} from "../helpers/supabase";

/**
 * Drives the wizard's mutation layer with a real signed-in teacher, so these
 * exercise the row level security policies at the same time as the logic.
 */
describe("teacher workflow", () => {
  const admin = adminClient();
  const created: string[] = [];
  const recipeIds: string[] = [];
  const run = uid();

  let teacher: TestUser;
  let student: TestUser;
  let teacherDb: Client;

  beforeAll(async () => {
    teacher = await createTestUser({
      role: "teacher",
      fullName: "Wizard Teacher",
      username: `wiz${run}`,
    });
    student = await createTestUser({
      role: "student",
      fullName: "Wizard Student",
      username: `wstud${run}`,
    });
    created.push(teacher.id, student.id);
    teacherDb = teacher.client as unknown as Client;
  });

  afterAll(async () => {
    for (const id of recipeIds) {
      await admin.from("recipes").delete().eq("id", id);
    }
    await deleteTestUsers(created);
  });

  async function newDraft(title: string) {
    const { id, error } = await recipes.createRecipeDraft(teacherDb, teacher.id);
    expect(error).toBeUndefined();
    expect(id).toBeTruthy();
    recipeIds.push(id!);

    await recipes.saveRecipeBasics(teacherDb, id!, {
      title,
      titleTl: "",
      description: "Fixture.",
      descriptionTl: "",
      categoryId: null,
      difficulty: "easy",
      servings: 4,
      prepMinutes: 10,
      cookMinutes: 20,
      videoUrl: null,
    });
    return id!;
  }

  it("creates a draft that students cannot see", async () => {
    const id = await newDraft(`Draft Dish ${run}`);

    const { data } = await student.client.from("recipes").select("id").eq("id", id);
    expect(data ?? []).toHaveLength(0);
  });

  it("gives two recipes with the same name different slugs", async () => {
    const first = await newDraft(`Same Name ${run}`);
    const second = await newDraft(`Same Name ${run}`);

    const { data } = await admin
      .from("recipes")
      .select("id, slug")
      .in("id", [first, second]);

    const slugs = (data ?? []).map((row) => row.slug);
    expect(new Set(slugs).size).toBe(2);
  });

  it("saves ingredients in order and drops blank rows", async () => {
    const id = await newDraft(`Ingredients ${run}`);

    await recipes.saveIngredients(teacherDb, id, [
      { id: null, quantity: "1 kg", item: "chicken", note: "cut up", quantityTl: "", itemTl: "", noteTl: "" },
      { id: null, quantity: "", item: "", note: "", quantityTl: "", itemTl: "", noteTl: "" },
      { id: null, quantity: "½ cup", item: "soy sauce", note: "", quantityTl: "", itemTl: "", noteTl: "" },
    ]);

    const { data } = await admin
      .from("ingredients")
      .select("quantity, item, sort_order")
      .eq("recipe_id", id)
      .order("sort_order");

    expect(data).toHaveLength(2);
    expect(data![0].item).toBe("chicken");
    expect(data![1].item).toBe("soy sauce");
    expect(data![1].sort_order).toBe(2);
  });

  it("renumbers steps from one after a reorder", async () => {
    const id = await newDraft(`Steps ${run}`);

    await recipes.saveSteps(teacherDb, id, [
      { id: null, instruction: "First", instructionTl: "", imagePath: null },
      { id: null, instruction: "Second", instructionTl: "", imagePath: null },
      { id: null, instruction: "Third", instructionTl: "", imagePath: null },
    ]);

    // Teacher moves the last step to the front.
    await recipes.saveSteps(teacherDb, id, [
      { id: null, instruction: "Third", instructionTl: "", imagePath: null },
      { id: null, instruction: "First", instructionTl: "", imagePath: null },
      { id: null, instruction: "Second", instructionTl: "", imagePath: null },
    ]);

    const { data } = await admin
      .from("steps")
      .select("step_number, instruction")
      .eq("recipe_id", id)
      .order("step_number");

    expect(data!.map((s) => s.step_number)).toEqual([1, 2, 3]);
    expect(data![0].instruction).toBe("Third");
  });

  it("publishes a recipe so students can see it", async () => {
    const id = await newDraft(`Publish Me ${run}`);

    let seen = await student.client.from("recipes").select("id").eq("id", id);
    expect(seen.data ?? []).toHaveLength(0);

    await recipes.setRecipePublished(teacherDb, id, true);

    seen = await student.client.from("recipes").select("id").eq("id", id);
    expect(seen.data ?? []).toHaveLength(1);
  });

  it("stops a student from writing through the same mutations", async () => {
    const id = await newDraft(`Student Cannot Edit ${run}`);
    const studentDb = student.client as unknown as Client;

    const result = await recipes.saveRecipeBasics(studentDb, id, {
      title: "Hijacked",
      titleTl: "",
      description: "",
      descriptionTl: "",
      categoryId: null,
      difficulty: null,
      servings: null,
      prepMinutes: null,
      cookMinutes: null,
      videoUrl: null,
    });
    // RLS silently matches no rows rather than erroring, so assert the data.
    expect(result.ok).toBe(true);

    const { data } = await admin.from("recipes").select("title").eq("id", id).single();
    expect(data!.title).toBe(`Student Cannot Edit ${run}`);
  });

  it("moves the answer key when the teacher changes the correct choice", async () => {
    const id = await newDraft(`Answer Key ${run}`);

    const draft = {
      id: null as string | null,
      prompt: "Which is correct?",
      promptTl: "",
      explanation: "",
      explanationTl: "",
      correctLabel: "A",
      choices: ["A", "B", "C", "D"].map((label) => ({
        id: null,
        label,
        body: `Choice ${label}`,
        bodyTl: "",
      })),
    };

    await quizzes.saveQuestions(teacherDb, id, [draft]);

    const readKey = async () => {
      const { data } = await admin
        .from("quizzes")
        .select("questions(id, correct_choice_id, choices!choices_question_id_fkey(id, label))")
        .eq("recipe_id", id)
        .single();
      const question = data!.questions[0];
      const correct = question.choices.find(
        (c: { id: string; label: string }) => c.id === question.correct_choice_id,
      );
      return { questionId: question.id, label: correct?.label };
    };

    const first = await readKey();
    expect(first.label).toBe("A");

    await quizzes.saveQuestions(teacherDb, id, [
      { ...draft, id: first.questionId, correctLabel: "C" },
    ]);

    const second = await readKey();
    expect(second.label).toBe("C");
    // Same question row, so any history attached to it survives.
    expect(second.questionId).toBe(first.questionId);
  });

  /**
   * The one that matters most. attempt_answers cascades from questions, so a
   * delete-and-reinsert autosave would erase the study's per-answer data every
   * time a teacher fixed a typo.
   */
  it("keeps student answer history when a teacher edits a question", async () => {
    const id = await newDraft(`History ${run}`);

    const drafts = [1, 2].map((n) => ({
      id: null as string | null,
      prompt: `Question ${n}?`,
      promptTl: "",
      explanation: "",
      explanationTl: "",
      correctLabel: "B",
      choices: ["A", "B", "C", "D"].map((label) => ({
        id: null,
        label,
        body: `Choice ${label}`,
        bodyTl: "",
      })),
    }));

    await quizzes.saveQuestions(teacherDb, id, drafts);
    await quizzes.saveQuizSettings(teacherDb, id, {
      title: "History Quiz",
      titleTl: "",
      instructions: "",
      instructionsTl: "",
      passingPercentage: 50,
      revealAnswers: false,
      isPublished: true,
    });
    await recipes.setRecipePublished(teacherDb, id, true);

    // A student takes it.
    const { data: quizPayload } = await student.client.rpc("get_quiz_for_student", {
      p_recipe_id: id,
    });
    const payload = quizPayload as unknown as {
      questions: { id: string; choices: { id: string; label: string }[] }[];
    };
    const answers = payload.questions.map((q) => ({
      question_id: q.id,
      choice_id: q.choices.find((c) => c.label === "B")!.id,
    }));

    const { error: submitError } = await student.client.rpc("submit_quiz_attempt", {
      p_recipe_id: id,
      p_answers: answers,
    });
    expect(submitError).toBeNull();

    const countAnswers = async () => {
      const { count } = await admin
        .from("attempt_answers")
        .select("id", { count: "exact", head: true })
        .in("question_id", payload.questions.map((q) => q.id));
      return count ?? 0;
    };

    expect(await countAnswers()).toBe(2);

    // The teacher fixes a typo in question 1, keeping both questions.
    await quizzes.saveQuestions(teacherDb, id, [
      { ...drafts[0], id: payload.questions[0].id, prompt: "Question 1 (fixed)?" },
      { ...drafts[1], id: payload.questions[1].id },
    ]);

    expect(await countAnswers()).toBe(2);

    const { data: after } = await admin
      .from("questions")
      .select("prompt")
      .eq("id", payload.questions[0].id)
      .single();
    expect(after!.prompt).toBe("Question 1 (fixed)?");
  });

  it("removes only the question the teacher deleted", async () => {
    const id = await newDraft(`Delete One ${run}`);

    const drafts = [1, 2, 3].map((n) => ({
      id: null as string | null,
      prompt: `Q${n}?`,
      promptTl: "",
      explanation: "",
      explanationTl: "",
      correctLabel: "A",
      choices: ["A", "B"].map((label) => ({
        id: null,
        label,
        body: `Choice ${label}`,
        bodyTl: "",
      })),
    }));

    await quizzes.saveQuestions(teacherDb, id, drafts);

    const { data: quiz } = await admin
      .from("quizzes")
      .select("id, questions(id, prompt, sort_order)")
      .eq("recipe_id", id)
      .single();

    const ordered = [...quiz!.questions].sort((a, b) => a.sort_order - b.sort_order);
    expect(ordered).toHaveLength(3);

    // Keep the first and third.
    await quizzes.saveQuestions(teacherDb, id, [
      { ...drafts[0], id: ordered[0].id },
      { ...drafts[2], id: ordered[2].id },
    ]);

    const { data: remaining } = await admin
      .from("questions")
      .select("id")
      .eq("quiz_id", quiz!.id);

    const ids = (remaining ?? []).map((r) => r.id);
    expect(ids).toHaveLength(2);
    expect(ids).toContain(ordered[0].id);
    expect(ids).toContain(ordered[2].id);
    expect(ids).not.toContain(ordered[1].id);
  });

  it("orders lessons for the teaching sequence", async () => {
    const first = await newDraft(`Order A ${run}`);
    const second = await newDraft(`Order B ${run}`);
    const third = await newDraft(`Order C ${run}`);

    await recipes.reorderRecipes(teacherDb, [third, first, second]);

    const { data } = await admin
      .from("recipes")
      .select("id, sort_order")
      .in("id", [first, second, third]);

    const byId = new Map((data ?? []).map((r) => [r.id, r.sort_order]));
    expect(byId.get(third)).toBeLessThan(byId.get(first)!);
    expect(byId.get(first)).toBeLessThan(byId.get(second)!);
  });

  it("adds, renames, and removes a category", async () => {
    const name = `Native Delicacies ${run}`;

    expect((await categoriesLib.createCategory(teacherDb, name)).ok).toBe(true);

    const findIt = async () => {
      const { data } = await admin
        .from("categories")
        .select("id, name")
        .eq("name", name)
        .maybeSingle();
      return data;
    };

    const created = await findIt();
    expect(created).toBeTruthy();

    const renamed = `${name} Renamed`;
    expect((await categoriesLib.renameCategory(teacherDb, created!.id, renamed)).ok).toBe(true);

    const { data: afterRename } = await admin
      .from("categories")
      .select("name")
      .eq("id", created!.id)
      .single();
    expect(afterRename!.name).toBe(renamed);

    expect((await categoriesLib.deleteCategory(teacherDb, created!.id)).ok).toBe(true);

    const { data: gone } = await admin
      .from("categories")
      .select("id")
      .eq("id", created!.id)
      .maybeSingle();
    expect(gone).toBeNull();
  });

  it("refuses to delete a category that still has recipes", async () => {
    const name = `In Use ${run}`;
    await categoriesLib.createCategory(teacherDb, name);

    const { data: category } = await admin
      .from("categories")
      .select("id")
      .eq("name", name)
      .single();

    const recipeId = await newDraft(`Uses Category ${run}`);
    await admin.from("recipes").update({ category_id: category!.id }).eq("id", recipeId);

    const result = await categoriesLib.deleteCategory(teacherDb, category!.id);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Move the 1 recipe/);

    // Still there, so no silent data loss.
    const { data: stillThere } = await admin
      .from("categories")
      .select("id")
      .eq("id", category!.id)
      .maybeSingle();
    expect(stillThere).toBeTruthy();

    await admin.from("recipes").delete().eq("id", recipeId);
    await admin.from("categories").delete().eq("id", category!.id);
  });
});

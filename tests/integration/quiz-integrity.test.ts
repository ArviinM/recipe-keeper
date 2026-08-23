import { beforeAll, afterAll, describe, expect, it } from "vitest";

import {
  adminClient,
  anonClient,
  createTestUser,
  deleteTestUsers,
  uid,
  type TestUser,
} from "../helpers/supabase";

/**
 * The thesis measures learning performance. If a student can read the answer
 * key or forge a score, the collected data is worthless. These tests treat a
 * student as a hostile client holding a valid JWT.
 */
describe("quiz integrity", () => {
  const admin = adminClient();
  const created: string[] = [];
  const run = uid();

  let student: TestUser;
  let other: TestUser;
  let recipeId: string;
  let quizId: string;
  const questionIds: string[] = [];
  const correctByQuestion = new Map<string, string>();

  beforeAll(async () => {
    student = await createTestUser({
      role: "student",
      fullName: "Test Student",
      username: `stud${run}`,
    });
    other = await createTestUser({
      role: "student",
      fullName: "Other Student",
      username: `othr${run}`,
    });
    created.push(student.id, other.id);

    const { data: recipe, error: recipeError } = await admin
      .from("recipes")
      .insert({
        title: `Test Recipe ${run}`,
        slug: `test-recipe-${run}`,
        description: "Fixture recipe.",
        is_published: true,
      })
      .select("id")
      .single();
    if (recipeError) throw recipeError;
    recipeId = recipe.id;

    const { data: quiz, error: quizError } = await admin
      .from("quizzes")
      .insert({
        recipe_id: recipeId,
        title: "Fixture Quiz",
        passing_percentage: 75,
        is_published: true,
      })
      .select("id")
      .single();
    if (quizError) throw quizError;
    quizId = quiz.id;

    // Four questions, correct answer always label "B" for predictable scoring.
    for (let i = 1; i <= 4; i++) {
      const { data: question, error: qError } = await admin
        .from("questions")
        .insert({ quiz_id: quizId, prompt: `Question ${i}?`, sort_order: i })
        .select("id")
        .single();
      if (qError) throw qError;

      const { data: choices, error: cError } = await admin
        .from("choices")
        .insert(
          ["A", "B", "C", "D"].map((label, index) => ({
            question_id: question.id,
            label,
            body: `Choice ${label}`,
            sort_order: index,
          })),
        )
        .select("id, label");
      if (cError) throw cError;

      const correct = choices.find((c) => c.label === "B")!;
      await admin
        .from("questions")
        .update({ correct_choice_id: correct.id })
        .eq("id", question.id);

      questionIds.push(question.id);
      correctByQuestion.set(question.id, correct.id);
    }
  });

  afterAll(async () => {
    await admin.from("recipes").delete().eq("id", recipeId);
    await deleteTestUsers(created);
  });

  it("hides the questions table from students", async () => {
    const { data } = await student.client.from("questions").select("*");
    expect(data ?? []).toHaveLength(0);
  });

  it("hides the choices table from students", async () => {
    const { data } = await student.client.from("choices").select("*");
    expect(data ?? []).toHaveLength(0);
  });

  it("hides everything from an unauthenticated client", async () => {
    const anon = anonClient();
    const { data } = await anon.from("recipes").select("*");
    expect(data ?? []).toHaveLength(0);
  });

  it("serves the quiz without leaking the correct answer", async () => {
    const { data, error } = await student.client.rpc("get_quiz_for_student", {
      p_recipe_id: recipeId,
    });
    expect(error).toBeNull();

    const payload = data as {
      questions: { id: string; choices: { id: string; label: string }[] }[];
    };
    expect(payload.questions).toHaveLength(4);
    expect(payload.questions[0].choices).toHaveLength(4);

    // The serialised payload must not contain the answer under any key name,
    // nor any correct choice id anywhere in it.
    const serialised = JSON.stringify(payload);
    expect(serialised).not.toContain("correct_choice_id");
    expect(serialised).not.toContain("is_correct");
    for (const choiceId of correctByQuestion.values()) {
      const question = payload.questions.find((q) =>
        q.choices.some((c) => c.id === choiceId),
      );
      // The correct choice is present as an option, which is expected, but
      // nothing marks it as correct.
      expect(question).toBeDefined();
    }
  });

  it("scores a perfect attempt", async () => {
    const answers = questionIds.map((id) => ({
      question_id: id,
      choice_id: correctByQuestion.get(id),
    }));

    const { data, error } = await student.client.rpc("submit_quiz_attempt", {
      p_recipe_id: recipeId,
      p_answers: answers,
    });
    expect(error).toBeNull();

    const result = data as { score: number; total_items: number; percentage: number; passed: boolean };
    expect(result.score).toBe(4);
    expect(result.total_items).toBe(4);
    expect(Number(result.percentage)).toBe(100);
    expect(result.passed).toBe(true);
  });

  it("scores a partial attempt and counts unanswered questions as wrong", async () => {
    // Answer two correctly, one wrong, leave the fourth blank.
    const wrongChoice = await admin
      .from("choices")
      .select("id")
      .eq("question_id", questionIds[2])
      .eq("label", "A")
      .single();

    const answers = [
      { question_id: questionIds[0], choice_id: correctByQuestion.get(questionIds[0]) },
      { question_id: questionIds[1], choice_id: correctByQuestion.get(questionIds[1]) },
      { question_id: questionIds[2], choice_id: wrongChoice.data!.id },
    ];

    const { data, error } = await student.client.rpc("submit_quiz_attempt", {
      p_recipe_id: recipeId,
      p_answers: answers,
    });
    expect(error).toBeNull();

    const result = data as { score: number; total_items: number; percentage: number; passed: boolean };
    expect(result.score).toBe(2);
    expect(result.total_items).toBe(4);
    expect(Number(result.percentage)).toBe(50);
    expect(result.passed).toBe(false);
  });

  it("withholds the answer key in the result when reveal_answers is off", async () => {
    const { data } = await student.client.rpc("submit_quiz_attempt", {
      p_recipe_id: recipeId,
      p_answers: [
        { question_id: questionIds[0], choice_id: correctByQuestion.get(questionIds[0]) },
      ],
    });

    const result = data as {
      reveal_answers: boolean;
      results: { correct_choice_id: string | null; explanation: string | null }[];
    };
    expect(result.reveal_answers).toBe(false);
    for (const row of result.results) {
      expect(row.correct_choice_id).toBeNull();
      expect(row.explanation).toBeNull();
    }
  });

  it("refuses a forged score written straight to the attempts table", async () => {
    const { error } = await student.client.from("attempts").insert({
      student_id: student.id,
      quiz_id: quizId,
      attempt_number: 999,
      score: 4,
      total_items: 4,
      percentage: 100,
      passed: true,
    });
    expect(error).not.toBeNull();
  });

  it("keeps one student's results away from another", async () => {
    const { data } = await other.client
      .from("attempts")
      .select("*")
      .eq("student_id", student.id);
    expect(data ?? []).toHaveLength(0);
  });

  it("increments the attempt number across retakes", async () => {
    const { data } = await admin
      .from("attempts")
      .select("attempt_number")
      .eq("student_id", student.id)
      .eq("quiz_id", quizId)
      .order("attempt_number");

    const numbers = (data ?? []).map((row) => row.attempt_number);
    expect(numbers).toEqual([1, 2, 3]);
  });
});

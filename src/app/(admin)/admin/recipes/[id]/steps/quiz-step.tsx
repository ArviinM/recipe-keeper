"use client";

import { useCallback, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { saveQuestions, saveQuizSettings } from "@/app/(admin)/admin/recipes/quiz-actions";
import { SaveStatusLabel } from "@/components/admin/save-status";
import { useAutosave } from "@/components/admin/use-autosave";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { WizardRecipe } from "../recipe-wizard";
import { StepHeader } from "./basics-step";

const LABELS = ["A", "B", "C", "D"];

type Question = WizardRecipe["quiz"]["questions"][number];

const blankQuestion = (): Question => ({
  id: null,
  prompt: "",
  explanation: "",
  correctLabel: "",
  choices: LABELS.map((label) => ({ id: null, label, body: "" })),
});

export function QuizStep({ recipe }: { recipe: WizardRecipe }) {
  const [settings, setSettings] = useState({
    title: recipe.quiz.title,
    instructions: recipe.quiz.instructions,
    passingPercentage: recipe.quiz.passingPercentage,
    revealAnswers: recipe.quiz.revealAnswers,
    isPublished: recipe.quiz.isPublished,
  });
  const [questions, setQuestions] = useState<Question[]>(
    recipe.quiz.questions.length ? recipe.quiz.questions : [blankQuestion()],
  );

  const saveSettings = useCallback(
    (current: typeof settings) => saveQuizSettings(recipe.id, current),
    [recipe.id],
  );
  const saveQs = useCallback(
    (current: Question[]) => saveQuestions(recipe.id, current),
    [recipe.id],
  );

  const settingsSave = useAutosave(settings, saveSettings);
  const questionsSave = useAutosave(questions, saveQs, { delay: 1400 });

  const updateQuestion = (index: number, patch: Partial<Question>) =>
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    );

  const updateChoice = (qIndex: number, label: string, body: string) =>
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              choices: q.choices.map((c) => (c.label === label ? { ...c, body } : c)),
            }
          : q,
      ),
    );

  const incomplete = questions.filter(
    (q) => q.prompt.trim() && (!q.correctLabel || !q.choices.some((c) => c.body.trim())),
  ).length;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <StepHeader
          title="Quiz settings"
          hint="Students take this after finishing the lesson. It is scored automatically."
          status={<SaveStatusLabel status={settingsSave.status} error={settingsSave.error} />}
        />

        <div className="space-y-2">
          <Label htmlFor="quizTitle" className="text-base">
            Quiz title
          </Label>
          <Input
            id="quizTitle"
            value={settings.title}
            onChange={(e) => setSettings((p) => ({ ...p, title: e.target.value }))}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quizInstructions" className="text-base">
            Instructions for students
          </Label>
          <Textarea
            id="quizInstructions"
            value={settings.instructions}
            onChange={(e) => setSettings((p) => ({ ...p, instructions: e.target.value }))}
            rows={2}
            placeholder="Read each question carefully and choose the best answer."
            className="text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passing" className="text-base">
            Passing score (%)
          </Label>
          <Input
            id="passing"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={settings.passingPercentage}
            onChange={(e) =>
              setSettings((p) => ({ ...p, passingPercentage: Number(e.target.value) }))
            }
            className="h-12 w-32"
          />
        </div>

        <Card>
          <CardContent className="space-y-4">
            <ToggleRow
              label="Show correct answers after submitting"
              hint="Off by default. If students can see the answer key, they can share it, and the scores stop measuring what they actually learned."
              checked={settings.revealAnswers}
              onChange={(v) => setSettings((p) => ({ ...p, revealAnswers: v }))}
            />
            <ToggleRow
              label="Quiz is available to students"
              hint="Turn this on once all the questions are ready."
              checked={settings.isPublished}
              onChange={(v) => setSettings((p) => ({ ...p, isPublished: v }))}
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Questions</h2>
          <SaveStatusLabel status={questionsSave.status} error={questionsSave.error} />
        </div>

        {incomplete > 0 && (
          <p className="bg-secondary text-secondary-foreground rounded-lg px-4 py-3 text-sm">
            {incomplete} question{incomplete > 1 ? "s" : ""} still need choices
            and a correct answer marked.
          </p>
        )}

        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={index}>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-secondary text-secondary-foreground flex size-8 items-center justify-center rounded-full text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold">Question {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive ml-auto size-9"
                    onClick={() =>
                      setQuestions((prev) => prev.filter((_, i) => i !== index))
                    }
                    aria-label={`Remove question ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <Textarea
                  value={question.prompt}
                  onChange={(e) => updateQuestion(index, { prompt: e.target.value })}
                  rows={2}
                  placeholder="e.g. What should be done before preparing the ingredients?"
                  className="text-base"
                  aria-label={`Question ${index + 1}`}
                />

                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm font-semibold">
                    Choices — tap the letter to mark the correct answer
                  </p>
                  {question.choices.map((choice) => {
                    const correct = question.correctLabel === choice.label;
                    return (
                      <div key={choice.label} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuestion(index, { correctLabel: choice.label })
                          }
                          aria-pressed={correct}
                          aria-label={`Mark ${choice.label} as the correct answer`}
                          className={cn(
                            "flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                            correct
                              ? "border-brand-green bg-brand-green text-white"
                              : "border-muted-foreground/30 text-muted-foreground hover:border-brand-green/50",
                          )}
                        >
                          {choice.label}
                        </button>
                        <Input
                          value={choice.body}
                          onChange={(e) =>
                            updateChoice(index, choice.label, e.target.value)
                          }
                          placeholder={`Choice ${choice.label}`}
                          className="h-11"
                          aria-label={`Choice ${choice.label} for question ${index + 1}`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-sm">
                    Explanation (optional, shown only if answers are revealed)
                  </Label>
                  <Input
                    value={question.explanation}
                    onChange={(e) =>
                      updateQuestion(index, { explanation: e.target.value })
                    }
                    className="h-11"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full font-semibold"
          onClick={() => setQuestions((prev) => [...prev, blankQuestion()])}
        >
          <Plus aria-hidden />
          Add another question
        </Button>
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        <p className="text-muted-foreground text-sm">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

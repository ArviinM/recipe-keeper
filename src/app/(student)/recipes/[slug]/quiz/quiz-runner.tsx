"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, X } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n";

import { submitQuiz, type QuizResult } from "./actions";

type Question = {
  id: string;
  prompt: string;
  points: number;
  sort_order: number;
  choices: { id: string; label: string; body: string }[];
};

type Quiz = {
  id: string;
  title: string;
  instructions: string | null;
  passing_percentage: number;
  shuffle_questions: boolean;
};

export function QuizRunner({
  locale,
  recipeId,
  recipeSlug,
  recipeTitle,
  studentName,
  quiz,
  questions,
}: {
  locale: Locale;
  recipeId: string;
  recipeSlug: string;
  recipeTitle: string;
  studentName: string;
  quiz: Quiz;
  questions: Question[];
}) {
  const t = dictionary(locale);
  const ordered = useMemo(
    () => [...questions].sort((a, b) => a.sort_order - b.sort_order),
    [questions],
  );

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (result) {
    return (
      <QuizResultView
        locale={locale}
        result={result}
        recipeSlug={recipeSlug}
        recipeTitle={recipeTitle}
        studentName={studentName}
        onRetry={() => {
          setResult(null);
          setAnswers({});
          setIndex(0);
        }}
      />
    );
  }

  if (ordered.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-4 py-12 text-center">
          <p className="font-semibold">This quiz has no questions yet</p>
          <Button asChild variant="secondary">
            <Link href={`/recipes/${recipeSlug}`}>Back to the lesson</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const question = ordered[index];
  const selected = answers[question.id];
  const isLast = index === ordered.length - 1;
  const answeredCount = Object.keys(answers).length;

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const payload = ordered.map((q) => ({
        question_id: q.id,
        choice_id: answers[q.id] ?? null,
      }));
      const response = await submitQuiz(recipeId, payload);
      if (response.error) setError(response.error);
      else if (response.result) setResult(response.result);
    });
  }

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col">
      <header className="space-y-3 pb-6">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="-ml-2 size-10">
            <Link href={`/recipes/${recipeSlug}`} aria-label="Back to the lesson">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="truncate text-lg font-extrabold tracking-tight">
            {quiz.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <ol className="flex flex-1 gap-1.5" aria-label="Quiz progress">
            {ordered.map((q, i) => (
              <li
                key={q.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  answers[q.id]
                    ? "bg-brand-green"
                    : i === index
                      ? "bg-primary"
                      : "bg-muted",
                )}
              />
            ))}
          </ol>
          <span className="text-muted-foreground shrink-0 text-sm font-semibold tabular-nums">
            {index + 1} / {ordered.length}
          </span>
        </div>

        {index === 0 && quiz.instructions && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {quiz.instructions}
          </p>
        )}
      </header>

      <div className="flex-1 space-y-5">
        <h2 className="text-xl font-bold leading-snug">{question.prompt}</h2>

        <fieldset className="space-y-3">
          <legend className="sr-only">{question.prompt}</legend>
          {question.choices.map((choice) => {
            const active = selected === choice.id;
            return (
              <label
                key={choice.id}
                className={cn(
                  "flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-colors",
                  active
                    ? "border-primary bg-secondary"
                    : "border-border bg-card hover:bg-secondary/50",
                )}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={choice.id}
                  checked={active}
                  onChange={() =>
                    setAnswers((prev) => ({ ...prev, [question.id]: choice.id }))
                  }
                  className="sr-only"
                />
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {choice.label}
                </span>
                <span className="text-base leading-relaxed">{choice.body}</span>
              </label>
            );
          })}
        </fieldset>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLast && answeredCount < ordered.length && (
          <p className="text-muted-foreground text-sm">
            {answeredCount} / {ordered.length} — {t.unansweredWarning}
          </p>
        )}
      </div>

      <div
        className="bg-background/95 sticky bottom-0 -mx-4 mt-8 flex gap-3 border-t px-4 pt-3 backdrop-blur"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <Button
          variant="outline"
          className="h-13 flex-1 font-bold"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0 || pending}
        >
          <ArrowLeft aria-hidden />
          {t.back}
        </Button>

        {isLast ? (
          <Button
            className="h-13 flex-[1.4] font-bold"
            onClick={handleSubmit}
            disabled={pending}
          >
            {pending ? t.checking : t.submitAnswers}
          </Button>
        ) : (
          <Button
            className="h-13 flex-[1.4] font-bold"
            onClick={() => setIndex((i) => Math.min(ordered.length - 1, i + 1))}
            disabled={pending}
          >
            {t.next}
            <ArrowRight aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}

function QuizResultView({
  locale,
  result,
  recipeSlug,
  recipeTitle,
  studentName,
  onRetry,
}: {
  locale: Locale;
  result: QuizResult;
  recipeSlug: string;
  recipeTitle: string;
  studentName: string;
  onRetry: () => void;
}) {
  const t = dictionary(locale);
  const percentage = Number(result.percentage);
  const message = result.passed ? t.wellDone : t.goodTry;

  return (
    <div className="space-y-6 py-2">
      <div className="space-y-5 text-center">
        <div
          className={cn(
            "mx-auto flex size-28 items-center justify-center rounded-full text-3xl font-extrabold",
            result.passed
              ? "bg-accent text-brand-green"
              : "bg-secondary text-primary",
          )}
        >
          {percentage}%
        </div>

        <div className="space-y-1">
          <p className="text-3xl font-extrabold tracking-tight">
            {result.score} / {result.total_items}
          </p>
          <p className="text-muted-foreground text-sm">
            {studentName} · {recipeTitle}
          </p>
        </div>

        <p className="text-balance text-base font-semibold">{message}</p>

        {result.attempt_number > 1 && (
          <p className="text-muted-foreground text-sm">
            {t.attempt} {result.attempt_number}. {t.bestScoreCounts}
          </p>
        )}
      </div>

      <Card>
        <CardContent className="space-y-2">
          <h2 className="pb-1 font-bold">{t.yourAnswers}</h2>
          <ul className="space-y-2">
            {result.results.map((row, i) => (
              <li
                key={row.question_id}
                className="flex items-center justify-between gap-3 py-1"
              >
                <span className="text-sm font-semibold">
                  {t.question} {i + 1}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-sm font-bold",
                    row.is_correct ? "text-brand-green" : "text-destructive",
                  )}
                >
                  {row.is_correct ? (
                    <>
                      <Check className="size-4" aria-hidden />
                      {t.correct}
                    </>
                  ) : (
                    <>
                      <X className="size-4" aria-hidden />
                      {row.choice_id ? t.incorrect : t.notAnswered}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {!result.reveal_answers && (
            <p className="text-muted-foreground pt-2 text-xs leading-relaxed">
              {t.answersHidden}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button onClick={onRetry} className="h-13 w-full font-bold">
          <RotateCcw aria-hidden />
          {t.tryAgain}
        </Button>
        <Button asChild variant="outline" className="h-13 w-full font-bold">
          <Link href={`/recipes/${recipeSlug}`}>{t.reviewLesson}</Link>
        </Button>
        <Button asChild variant="ghost" className="h-12 w-full font-semibold">
          <Link href="/progress">{t.seeMyProgress}</Link>
        </Button>
      </div>
    </div>
  );
}

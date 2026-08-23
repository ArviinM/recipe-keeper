# Recipe Keeper

A mobile-first learning module for Grade 9 Cookery students, built to support an
academic research study on whether a digital recipe module improves learning
performance.

It is a responsive web application, installable to a phone's home screen as a
PWA, with a desktop layout for teachers.

## What it does

**Students** browse published Cookery lessons, read the learning objectives,
ingredients and measurements, numbered procedure, cooking techniques, kitchen
safety reminders and chef's tips, then take a short quiz that is scored
automatically and tracked as progress over time.

**Teachers and administrators** author recipes and lessons, upload photos, build
quizzes, manage class sections and student accounts, and review results.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase — Postgres, Auth, Storage, Row Level Security
- Vitest for the access-control and scoring tests
- Deployed on Vercel

## Quiz integrity

Because the study measures learning performance, quiz answers never reach the
browser. The correct answer is stored on `questions.correct_choice_id`, students
have no read access to the `questions` or `choices` tables, and scoring happens
inside a `SECURITY DEFINER` database function. The `attempts` table has no insert
policy, so a result row cannot be forged from a client.

These boundaries are covered by integration tests that authenticate as a real
student and try to break them.

## Live

https://recipe-keeper-delta.vercel.app

On a phone, open that link and choose **Add to Home Screen** to install it.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in from your Supabase project
pnpm dev
```

Apply the database schema:

```bash
./scripts/db-query.sh -f supabase/seed.sql     # optional demo lesson
./scripts/db-query.sh "notify pgrst, 'reload schema';"
```

Run the tests:

```bash
pnpm test
```

## Privacy

The application is used by minors. It collects only a student's name, email,
username, grade level and section — nothing else.

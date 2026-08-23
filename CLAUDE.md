# Recipe Keeper

Mobile-first web application for a Grade 9 Cookery thesis: **"Mobile-Based Recipe Module
for Grade 9 Cookery Students."** Built to help a friend (Joemarie) — unpaid, academic use.

The full client specification lives in `docs/system-development-guide.txt` (extracted from
the original `.docx`, kept alongside it). **Treat that document as the requirements source of
truth.** It enumerates 20 required deliverables in section 21; do not drop any silently.

That document is **gitignored on purpose**. It is Joemarie's unpublished academic work, and
a public copy could be flagged against his own manuscript by a similarity checker. Keep it
local unless he explicitly agrees otherwise.

---

## ⛔ Hard rules

1. **No AI attribution anywhere.** Commits, PR bodies, code comments, and docs must never
   mention Claude, Anthropic, AI assistance, or carry `Co-Authored-By` / "Generated with"
   trailers. This is Joemarie's thesis output. Author every commit as the configured git
   user and nothing else.
2. **Never commit secrets.** `.env.local`, Supabase service-role keys, and personal access
   tokens stay out of git. `.env.example` documents the shape only.
3. **Never expose quiz answers to students.** `choices.is_correct` must not reach a student's
   browser under any circumstance. See "Quiz integrity" below — this is a research-validity
   requirement, not just a security nicety.
4. **Students are minors.** Collect only what the spec asks for: full name, email, username,
   grade level, section. No birthdays, addresses, phone numbers, or student photos.

---

## Stack

| Layer      | Choice |
|------------|--------|
| Framework  | Next.js 16 (App Router) + TypeScript, Turbopack |
| Styling    | Tailwind v4 + shadcn/ui (Radix primitives, Nova preset) |
| Backend    | Supabase — Postgres, Auth, Storage, Row Level Security |
| Hosting    | Vercel |
| Delivery   | Installable PWA (see "Mobile-based" below) |

Package manager is **pnpm**. The Supabase CLI is a project-local devDependency — always
invoke it as `pnpm exec supabase`, never a global install.

---

## "Mobile-based" means PWA

The research title says *mobile-based*, but this is a responsive web app installed to the
phone home screen as a PWA — app icon, fullscreen launch, no browser chrome. This is a
deliberate, adviser-facing decision. If the panel ever demands a real `.apk`, the same
codebase can be wrapped with Capacitor; do not restructure for that unless asked.

Design for a cheap Android phone on mobile data first. Desktop is the secondary layout.

---

## Roles

Three roles, stored on `profiles.role`:

- **`admin`** — full access. Manages every account (including teachers), all content, all
  results. Can create accounts for anyone and reset any password.
- **`teacher`** — manages recipes, lessons, and quizzes. Can pre-create student accounts and
  reset student passwords. Sees results only for students in sections they advise.
- **`student`** — reads published recipes, takes quizzes, sees only their own results.

Accounts can be **self-registered** (the spec requires a Register screen) *or*
**pre-created** by an admin/teacher, which is the expected classroom path.

Philippine schooling convention applies: a student belongs to a **section** which carries a
**grade level** (e.g. Grade 9 – Sampaguita). Grade level is a property of the section, not
duplicated on the student.

---

## Quiz integrity

The thesis measures learning performance, so contaminated scores would invalidate the data.

- Students **never** read the `choices` table directly. RLS restricts it to staff.
- Students fetch a quiz via the `get_quiz_for_student()` RPC, which omits `is_correct`.
- Scoring happens server-side in the `submit_quiz_attempt()` SECURITY DEFINER function.
- Per-question correctness is returned; the correct answer is revealed only when the
  teacher enables `quizzes.reveal_answers`.
- Every attempt is stored. Progress displays the **best** score; the full attempt history
  is retained because improvement over time is useful research data.

A recipe counts as **completed** once its quiz has been submitted at least once.

---

## Conventions

- `src/app/(student)` and `src/app/(admin)` route groups; `src/app/(auth)` for login/register.
- Server Components by default. Reach for `"use client"` only for genuine interactivity.
- Supabase clients: `src/lib/supabase/server.ts` (RSC/route handlers, cookie-based) and
  `src/lib/supabase/client.ts` (browser). Never import the server client into a Client
  Component.
- Validate every form with `zod` schemas colocated in `src/lib/validation/`.
- Brand tokens live in `globals.css` as `--brand-*`, sampled from the logo. Prefer semantic
  tokens (`primary`, `success`) over raw brand values in components.
- Database changes are **always** a new file in `supabase/migrations/` — never edit an
  applied migration, never mutate schema by hand in the dashboard.

---

## ⚠️ The tests write to the live database

`pnpm test` runs against the real Supabase project. The suite cleans up after
itself, but an interrupted run leaves fixture recipes, categories and accounts
behind — and Joemarie would see them appear in his lesson list.

**Do not run the tests once the module is in use with students.** If they need
to keep running, point `.env.local` at a second, throwaway Supabase project
first. Fixtures are recognisable by an 8-character hex suffix
(`Draft Dish a1b2c3d4`).

---

## Commands

```bash
pnpm dev                  # local dev server
pnpm build                # production build
pnpm lint                 # eslint
pnpm test                 # all tests
pnpm test:integration     # RLS + scoring tests against the live project
pnpm db:types             # regenerate src/lib/database.types.ts

# Run SQL against the project (reads .env.local, uses the Management API,
# so it needs no database password):
./scripts/db-query.sh "select count(*) from public.recipes;"
./scripts/db-query.sh -f supabase/seed.sql
```

**After any migration, reload the PostgREST schema cache:**

```bash
./scripts/db-query.sh "notify pgrst, 'reload schema';"
```

Skipping this makes the REST API return a bare `Internal server error.` for the
changed tables while the underlying SQL is perfectly fine — a confusing hour if
you do not know to look for it.

---

## Deployment

| | |
|---|---|
| Production | https://recipe-keeper-delta.vercel.app |
| Vercel project | `arvin-medinas-projects/recipe-keeper` |

The `*-arvin-medinas-projects.vercel.app` alias sits behind Vercel's login wall.
Only the `recipe-keeper-delta.vercel.app` URL is reachable by students — never
hand out the other one.

`/api/keep-alive` is listed in the proxy's PUBLIC_PATHS. Vercel's cron calls it
with no session, and without that entry it was redirected to `/login`, which
would have let the database pause anyway. It authenticates with `CRON_SECRET`.

### First administrator

Only staff can create staff, so the first admin is made from the command line:

```bash
./scripts/create-admin.sh "Full Name" email@example.com username
```

---

## Supabase project

| | |
|---|---|
| Project | `recipe-keeper` (org: Strange Org, Free plan) |
| Ref | `sikgeiupkutocvcrqieb` |
| Region | `ap-southeast-1` — Southeast Asia (Singapore) |
| API keys | New-style `sb_publishable_…` / secret, not legacy anon/service_role |

Automatic RLS is enabled on the project, so every new table in `public` gets RLS
turned on by an event trigger. That is a safety net, not a substitute for
writing the policies — a table with RLS and no policy denies everyone.

---

## Languages

English and Tagalog. Every translatable column has a `_tl` twin, and
`src/lib/i18n/pick()` falls back to English whenever a translation is missing,
so a half-translated recipe reads as complete English rather than blanks.

**Language is set per section**, not per student (`sections.default_locale`,
overridable by `profiles.locale`). Mixing languages inside one class would make
the language of instruction an uncontrolled variable in the study; per-section
keeps a group consistent and lets an English and a Tagalog group be compared
deliberately.

Translating never restructures content. The Tagalog pass writes onto the rows
the English pass created, matched by position, so it cannot add, remove,
reorder, or renumber anything, and cannot touch the answer key. The wizard hides
the structural controls while the language toggle is on Tagalog.

The teacher dashboard stays in English — one adult uses it, and translating it
would double the maintenance for no gain to students.

### ⚠️ Ambiguous PostgREST embeds

`profiles` and `sections` reference each other twice (a student's section, and a
teacher advising a section), as do `questions` and `choices`. A bare
`sections(...)` or `choices(...)` embed is therefore **ambiguous** and PostgREST
rejects it with `PGRST201`.

This has now caused two outages. It compiles, it builds, and it only fails at
runtime — the second time it put every signed-in request into a redirect loop
between `/login` and `/home`. **Always name the constraint:**

```ts
sections!profiles_section_id_fkey(default_locale)
choices!choices_question_id_fkey(id, label, body)
```

`tests/integration/profile-query.test.ts` guards the profiles case and asserts
the ambiguous form still fails.

---

## ⚡ Performance

**The functions must run in `sin1`.** `vercel.json` pins the region.

Vercel defaults to `iad1` (Washington DC) while Supabase is in
`ap-southeast-1` (Singapore). Every query then crosses the Pacific — about
250ms each, several times per page, mostly in sequence. Pages took 1.7 to 2.9
seconds. Moving the functions to Singapore put them beside both the database and
the students, and the same pages now respond in 177–249ms.

If pages ever feel slow again, check the region before anything else.

Two smaller rules that follow from the same principle — a round trip is
expensive, so make as few as possible:

- `getCurrentUser()` is wrapped in React's `cache()`. A layout and the page it
  renders both call it; without the cache each page paid for two auth checks and
  two profile reads.
- Independent queries go out together with `Promise.all`, never one after the
  other.

Images are already lazy: `next/image` defaults to it, and only the splash logo
and the lesson hero set `priority`, both being above the fold.

---

## Offline

`public/sw.js` keeps already-opened lessons readable when the connection drops.

What it caches is deliberately narrow, because these are shared classroom
phones:

| Cached | Never cached |
|---|---|
| `/recipes/[slug]` lesson pages | `/home`, `/progress`, `/profile`, `/quiz` |
| `/_next/static/*` build output | the whole `/admin` dashboard |
| recipe photos from Storage | `/api/*`, `/login`, `/register` |

Reaching the sign-in screen posts `clear-caches` to the worker, so one student's
lesson does not sit on the phone for the next one. Bump `VERSION` in `sw.js`
when the cached shape changes — old caches are dropped on activate.

Anything added to `NEVER_CACHE` must also be reflected here.

---

## Documentation

- `docs/user-manual.md` — written for the teacher, doubles as a manuscript
  appendix. Screenshots live in `docs/images/`.
- `docs/database-design.md` — ERD generated from the live schema. Regenerate it
  rather than hand-editing, so it cannot drift.

`docs/system-development-guide.*` stays gitignored; see the top of this file.

---

## Operational notes

- **Supabase free-tier projects pause after ~7 days idle.** A keep-alive cron must stay
  wired before the defense, or the database will be asleep on the day it matters.
- Recipe **videos** are unlisted YouTube URLs, never uploaded files — Storage is capped at
  1 GB and bandwidth burns fast.
- Recipe **images** must be Joemarie's own or properly licensed. Do not seed the production
  database with images scraped from the web.

-- =============================================================================
-- Recipe Keeper — core schema
-- Mobile-Based Recipe Module for Grade 9 Cookery Students
-- =============================================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

-- -----------------------------------------------------------------------------
-- Enums & shared helpers
-- -----------------------------------------------------------------------------

create type public.app_role as enum ('admin', 'teacher', 'student');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- People
--
-- profiles.section_id and sections.teacher_id reference each other, so both
-- tables are created first and the foreign keys are attached afterwards.
-- -----------------------------------------------------------------------------

create table public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  role                  public.app_role not null default 'student',
  full_name             text not null,
  username              citext not null unique,
  email                 citext not null,
  section_id            uuid,
  is_active             boolean not null default true,
  -- Set when an admin/teacher pre-creates or resets an account, so the app can
  -- force a password change on first sign-in.
  must_change_password  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint profiles_username_format
    check (username ~ '^[a-zA-Z0-9._-]{3,32}$'),
  constraint profiles_full_name_not_blank
    check (length(btrim(full_name)) > 0)
);

-- A section carries the grade level; students inherit it rather than storing a
-- duplicate copy that could drift out of sync.
create table public.sections (
  id           uuid primary key default gen_random_uuid(),
  grade_level  smallint not null default 9
                 check (grade_level between 7 and 12),
  name         text not null,
  school_year  text not null,
  teacher_id   uuid,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint sections_unique_per_year unique (grade_level, name, school_year),
  constraint sections_name_not_blank check (length(btrim(name)) > 0)
);

alter table public.profiles
  add constraint profiles_section_id_fkey
  foreign key (section_id) references public.sections (id) on delete set null;

alter table public.sections
  add constraint sections_teacher_id_fkey
  foreign key (teacher_id) references public.profiles (id) on delete set null;

create index profiles_role_idx       on public.profiles (role);
create index profiles_section_id_idx on public.profiles (section_id);
create index sections_teacher_id_idx on public.sections (teacher_id);

-- -----------------------------------------------------------------------------
-- Content
-- -----------------------------------------------------------------------------

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  icon        text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Cooking techniques are a shared glossary: "Sautéing" is explained once and
-- reused by every recipe that needs it, instead of being retyped per recipe.
create table public.techniques (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.recipes (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text not null unique,
  category_id   uuid references public.categories (id) on delete set null,
  description   text not null default '',
  image_path    text,
  video_url     text,
  -- Plain bullet lists that are only ever rendered as a group, never queried
  -- individually, so they stay as arrays instead of three near-empty tables.
  objectives    text[] not null default '{}',
  safety_notes  text[] not null default '{}',
  chef_tips     text[] not null default '{}',
  prep_minutes  integer check (prep_minutes >= 0),
  cook_minutes  integer check (cook_minutes >= 0),
  servings      integer check (servings > 0),
  difficulty    text check (difficulty in ('easy', 'medium', 'hard')),
  is_published  boolean not null default false,
  sort_order    integer not null default 0,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint recipes_title_not_blank check (length(btrim(title)) > 0)
);

create index recipes_category_id_idx  on public.recipes (category_id);
create index recipes_is_published_idx on public.recipes (is_published);

-- Free-text search across the fields a student would actually type into the
-- search bar.
create index recipes_search_idx on public.recipes
  using gin (to_tsvector('simple', title || ' ' || coalesce(description, '')));

-- Quantity and item are stored separately so the admin form can offer two
-- fields, matching the "Ingredients / Measurements" split in the spec.
create table public.ingredients (
  id         uuid primary key default gen_random_uuid(),
  recipe_id  uuid not null references public.recipes (id) on delete cascade,
  quantity   text,
  item       text not null,
  note       text,
  sort_order integer not null default 0,
  constraint ingredients_item_not_blank check (length(btrim(item)) > 0)
);

create index ingredients_recipe_id_idx on public.ingredients (recipe_id, sort_order);

create table public.steps (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid not null references public.recipes (id) on delete cascade,
  step_number integer not null check (step_number > 0),
  instruction text not null,
  image_path  text,
  -- Deferred so a reorder can renumber several steps inside one transaction
  -- without tripping over itself halfway through.
  constraint steps_unique_number unique (recipe_id, step_number)
    deferrable initially deferred,
  constraint steps_instruction_not_blank check (length(btrim(instruction)) > 0)
);

create index steps_recipe_id_idx on public.steps (recipe_id, step_number);

create table public.recipe_techniques (
  recipe_id    uuid not null references public.recipes (id) on delete cascade,
  technique_id uuid not null references public.techniques (id) on delete cascade,
  sort_order   integer not null default 0,
  primary key (recipe_id, technique_id)
);

-- -----------------------------------------------------------------------------
-- Assessment
--
-- The correct answer lives on questions.correct_choice_id rather than a boolean
-- on each choice. That makes "exactly one correct answer" true by construction,
-- lets the teacher change the key with a single atomic update, and keeps the
-- answer out of the choices table entirely.
-- -----------------------------------------------------------------------------

create table public.quizzes (
  id                 uuid primary key default gen_random_uuid(),
  recipe_id          uuid not null unique
                       references public.recipes (id) on delete cascade,
  title              text not null default 'Lesson Quiz',
  instructions       text,
  passing_percentage integer not null default 75
                       check (passing_percentage between 0 and 100),
  -- Off by default: revealing the key would let students share answers and
  -- contaminate the study's scores. The teacher opts in per quiz.
  reveal_answers     boolean not null default false,
  shuffle_questions  boolean not null default false,
  is_published       boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.questions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references public.quizzes (id) on delete cascade,
  prompt      text not null,
  explanation text,
  points      integer not null default 1 check (points > 0),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint questions_prompt_not_blank check (length(btrim(prompt)) > 0)
);

create index questions_quiz_id_idx on public.questions (quiz_id, sort_order);

create table public.choices (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  label       text not null check (label in ('A', 'B', 'C', 'D', 'E')),
  body        text not null,
  sort_order  integer not null default 0,
  constraint choices_unique_label unique (question_id, label),
  constraint choices_body_not_blank check (length(btrim(body)) > 0)
);

create index choices_question_id_idx on public.choices (question_id, sort_order);

alter table public.questions
  add column correct_choice_id uuid
    references public.choices (id) on delete set null;

-- -----------------------------------------------------------------------------
-- Results
--
-- Every attempt is kept. Progress surfaces the best score, but the full history
-- is what shows improvement over time, which is the point of the research.
-- -----------------------------------------------------------------------------

create table public.attempts (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.profiles (id) on delete cascade,
  quiz_id        uuid not null references public.quizzes (id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  score          integer not null check (score >= 0),
  total_items    integer not null check (total_items > 0),
  percentage     numeric(5, 2) not null check (percentage between 0 and 100),
  passed         boolean not null,
  submitted_at   timestamptz not null default now(),
  constraint attempts_unique_number unique (student_id, quiz_id, attempt_number),
  constraint attempts_score_within_total check (score <= total_items)
);

create index attempts_student_id_idx on public.attempts (student_id, submitted_at desc);
create index attempts_quiz_id_idx    on public.attempts (quiz_id);

create table public.attempt_answers (
  id          uuid primary key default gen_random_uuid(),
  attempt_id  uuid not null references public.attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  choice_id   uuid references public.choices (id) on delete set null,
  is_correct  boolean not null,
  constraint attempt_answers_unique_question unique (attempt_id, question_id)
);

create index attempt_answers_attempt_id_idx on public.attempt_answers (attempt_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'sections', 'categories', 'techniques',
    'recipes', 'quizzes', 'questions'
  ]
  loop
    execute format(
      'create trigger %I_set_updated_at
         before update on public.%I
         for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end;
$$;

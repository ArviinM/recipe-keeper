-- =============================================================================
-- Tagalog alongside English.
--
-- Every translatable field gets a _tl twin. They are nullable on purpose: the
-- app falls back to the English text whenever a translation is missing, so a
-- half-translated recipe shows complete English rather than blanks. That lets
-- the content be translated gradually instead of all at once.
--
-- Language is chosen per section, not per student, so an entire class reads the
-- same language. Mixing languages inside one group would make the language of
-- instruction an uncontrolled variable in the study.
-- =============================================================================

create type public.app_locale as enum ('en', 'tl');

alter table public.sections
  add column default_locale public.app_locale not null default 'en';

-- A student may override for their own reading, but the section default is what
-- they get unless they change it.
alter table public.profiles
  add column locale public.app_locale;

alter table public.categories  add column name_tl text;

alter table public.techniques
  add column name_tl text,
  add column description_tl text;

alter table public.recipes
  add column title_tl text,
  add column description_tl text,
  add column objectives_tl text[] not null default '{}',
  add column safety_notes_tl text[] not null default '{}',
  add column chef_tips_tl text[] not null default '{}';

alter table public.ingredients
  add column quantity_tl text,
  add column item_tl text,
  add column note_tl text;

alter table public.steps add column instruction_tl text;

alter table public.quizzes
  add column title_tl text,
  add column instructions_tl text;

alter table public.questions
  add column prompt_tl text,
  add column explanation_tl text;

alter table public.choices add column body_tl text;

-- -----------------------------------------------------------------------------
-- Serving a quiz in the reader's language.
--
-- Still never selects the answer key. The locale only changes which text is
-- returned, never what is scored.
-- -----------------------------------------------------------------------------

create or replace function public.get_quiz_for_student(
  p_recipe_id uuid,
  p_locale text default 'en'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_quiz   public.quizzes%rowtype;
  v_recipe public.recipes%rowtype;
  v_tl     boolean := (p_locale = 'tl');
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select * into v_recipe from public.recipes where id = p_recipe_id;
  if not found then
    raise exception 'Recipe not found' using errcode = 'P0002';
  end if;

  select * into v_quiz from public.quizzes where recipe_id = p_recipe_id;
  if not found then
    raise exception 'This lesson has no quiz yet' using errcode = 'P0002';
  end if;

  if not public.is_staff()
     and not (v_quiz.is_published and v_recipe.is_published) then
    raise exception 'Quiz is not available' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'quiz', jsonb_build_object(
      'id',                 v_quiz.id,
      'recipe_id',          v_quiz.recipe_id,
      'title',              case when v_tl then coalesce(nullif(v_quiz.title_tl, ''), v_quiz.title)
                                 else v_quiz.title end,
      'instructions',       case when v_tl then coalesce(nullif(v_quiz.instructions_tl, ''), v_quiz.instructions)
                                 else v_quiz.instructions end,
      'passing_percentage', v_quiz.passing_percentage,
      'shuffle_questions',  v_quiz.shuffle_questions
    ),
    'questions', coalesce(
      (
        select jsonb_agg(q_json order by q_json ->> 'sort_order')
        from (
          select jsonb_build_object(
            'id',         q.id,
            'prompt',     case when v_tl then coalesce(nullif(q.prompt_tl, ''), q.prompt)
                               else q.prompt end,
            'points',     q.points,
            'sort_order', q.sort_order,
            'choices', coalesce(
              (
                select jsonb_agg(
                  jsonb_build_object(
                    'id',    c.id,
                    'label', c.label,
                    'body',  case when v_tl then coalesce(nullif(c.body_tl, ''), c.body)
                                  else c.body end
                  )
                  order by c.sort_order, c.label
                )
                from public.choices c
                where c.question_id = q.id
              ),
              '[]'::jsonb
            )
          ) as q_json
          from public.questions q
          where q.quiz_id = v_quiz.id
        ) s
      ),
      '[]'::jsonb
    )
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_quiz_for_student(uuid, text) from public, anon;
grant execute on function public.get_quiz_for_student(uuid, text) to authenticated;

-- Replaced by the two-argument version above.
drop function if exists public.get_quiz_for_student(uuid);

-- The registration dropdown needs the section's language so a student knows
-- which one they are joining. Dropped first: the return type is changing, and
-- create-or-replace cannot do that.
drop function if exists public.list_sections_for_registration();

create function public.list_sections_for_registration()
returns table (id uuid, grade_level smallint, name text, default_locale public.app_locale)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select s.id, s.grade_level, s.name, s.default_locale
  from public.sections s
  where s.is_active
  order by s.grade_level, s.name;
$$;

revoke all on function public.list_sections_for_registration() from public;
grant execute on function public.list_sections_for_registration() to anon, authenticated;

-- =============================================================================
-- English is the language a lesson is written in; Tagalog supplies the words.
--
-- An earlier revision let either language stand alone. That is not the model:
-- English is required, Tagalog is an optional translation of it, and a reader
-- set to Tagalog falls back to English wherever a translation is missing.
--
-- The constraints below say exactly that, so the rule is enforced by the
-- database rather than only by the forms.
-- =============================================================================

alter table public.recipes drop constraint if exists recipes_title_in_some_language;
alter table public.recipes drop constraint if exists recipes_title_not_blank;
update public.recipes set title = 'Untitled recipe' where title is null or btrim(title) = '';
alter table public.recipes alter column title set not null;
alter table public.recipes add constraint recipes_title_not_blank
  check (length(btrim(title)) > 0);

alter table public.ingredients drop constraint if exists ingredients_item_in_some_language;
alter table public.ingredients drop constraint if exists ingredients_item_not_blank;
delete from public.ingredients where item is null or btrim(item) = '';
alter table public.ingredients alter column item set not null;
alter table public.ingredients add constraint ingredients_item_not_blank
  check (length(btrim(item)) > 0);

alter table public.steps drop constraint if exists steps_instruction_in_some_language;
alter table public.steps drop constraint if exists steps_instruction_not_blank;
delete from public.steps where instruction is null or btrim(instruction) = '';
alter table public.steps alter column instruction set not null;
alter table public.steps add constraint steps_instruction_not_blank
  check (length(btrim(instruction)) > 0);

alter table public.questions drop constraint if exists questions_prompt_in_some_language;
alter table public.questions drop constraint if exists questions_prompt_not_blank;
delete from public.questions where prompt is null or btrim(prompt) = '';
alter table public.questions alter column prompt set not null;
alter table public.questions add constraint questions_prompt_not_blank
  check (length(btrim(prompt)) > 0);

alter table public.choices drop constraint if exists choices_body_in_some_language;
alter table public.choices drop constraint if exists choices_body_not_blank;
delete from public.choices where body is null or btrim(body) = '';
alter table public.choices alter column body set not null;
alter table public.choices add constraint choices_body_not_blank
  check (length(btrim(body)) > 0);

-- Back to falling back to English only.
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

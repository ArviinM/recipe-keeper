-- =============================================================================
-- Recipe Keeper — application functions
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Provision a profile whenever an auth user is created.
--
-- role is read from raw_app_meta_data, NOT raw_user_meta_data: the latter is
-- attacker-controlled during signUp, so a student could otherwise register
-- themselves as an admin. app_meta_data is writable only through the admin API
-- with the service-role key.
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_full_name text;
  v_username  text;
  v_section   uuid;
  v_role      public.app_role;
begin
  v_full_name := nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '');
  v_username  := nullif(btrim(new.raw_user_meta_data ->> 'username'), '');
  v_section   := nullif(new.raw_user_meta_data ->> 'section_id', '')::uuid;

  v_role := coalesce(
    nullif(new.raw_app_meta_data ->> 'role', '')::public.app_role,
    'student'
  );

  insert into public.profiles (id, role, full_name, username, email, section_id,
                               must_change_password)
  values (
    new.id,
    v_role,
    coalesce(v_full_name, split_part(new.email, '@', 1)),
    coalesce(v_username,  split_part(new.email, '@', 1)),
    new.email,
    v_section,
    coalesce((new.raw_app_meta_data ->> 'must_change_password')::boolean, false)
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets the registration form check a username before submitting. Returns only a
-- boolean, so it leaks nothing beyond "taken or not".
create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select not exists (
    select 1 from public.profiles where username = p_username::citext
  );
$$;

-- -----------------------------------------------------------------------------
-- Serve a quiz to a student without ever selecting the answer key.
--
-- questions.correct_choice_id is never referenced in the returned payload, so
-- the answers cannot leak through the network tab.
-- -----------------------------------------------------------------------------

create or replace function public.get_quiz_for_student(p_recipe_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_quiz   public.quizzes%rowtype;
  v_recipe public.recipes%rowtype;
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

  -- Staff may preview an unpublished quiz; students may not.
  if not public.is_staff()
     and not (v_quiz.is_published and v_recipe.is_published) then
    raise exception 'Quiz is not available' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'quiz', jsonb_build_object(
      'id',                 v_quiz.id,
      'recipe_id',          v_quiz.recipe_id,
      'title',              v_quiz.title,
      'instructions',       v_quiz.instructions,
      'passing_percentage', v_quiz.passing_percentage,
      'shuffle_questions',  v_quiz.shuffle_questions
    ),
    'questions', coalesce(
      (
        select jsonb_agg(q_json order by q_json ->> 'sort_order')
        from (
          select jsonb_build_object(
            'id',         q.id,
            'prompt',     q.prompt,
            'points',     q.points,
            'sort_order', q.sort_order,
            'choices', coalesce(
              (
                select jsonb_agg(
                  jsonb_build_object('id', c.id, 'label', c.label, 'body', c.body)
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

-- -----------------------------------------------------------------------------
-- Score an attempt server-side and persist it.
--
-- attempts has no INSERT policy, so this SECURITY DEFINER function is the only
-- way a result row can be created. A student cannot POST themselves a 10/10.
--
-- p_answers shape: [{"question_id": "<uuid>", "choice_id": "<uuid>"}, ...]
-- Unanswered questions are scored as incorrect.
-- Scoring is weighted by questions.points, which defaults to 1, so with default
-- data "score / total_items" reads as a plain item count.
-- -----------------------------------------------------------------------------

create or replace function public.submit_quiz_attempt(
  p_recipe_id uuid,
  p_answers   jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_student    uuid := auth.uid();
  v_quiz       public.quizzes%rowtype;
  v_recipe     public.recipes%rowtype;
  v_attempt_no integer;
  v_attempt_id uuid;
  v_score      integer := 0;
  v_total      integer := 0;
  v_percentage numeric(5, 2);
  v_passed     boolean;
  v_breakdown  jsonb;
begin
  if v_student is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_answers, 'null'::jsonb)) <> 'array' then
    raise exception 'Answers must be a JSON array' using errcode = '22023';
  end if;

  select * into v_recipe from public.recipes where id = p_recipe_id;
  if not found then
    raise exception 'Recipe not found' using errcode = 'P0002';
  end if;

  select * into v_quiz from public.quizzes where recipe_id = p_recipe_id;
  if not found then
    raise exception 'This lesson has no quiz yet' using errcode = 'P0002';
  end if;

  if not (v_quiz.is_published and v_recipe.is_published) then
    raise exception 'Quiz is not available' using errcode = '42501';
  end if;

  -- Normalise the submission: keep only answers for questions that actually
  -- belong to this quiz, and only choices that belong to that question. A
  -- forged choice_id from another question is discarded, not counted.
  create temp table _submission on commit drop as
  select
    q.id                                             as question_id,
    q.points                                         as points,
    c.id                                             as choice_id,
    (q.correct_choice_id is not null
       and c.id is not distinct from q.correct_choice_id) as is_correct
  from public.questions q
  left join lateral (
    select (a ->> 'choice_id')::uuid as choice_id
    from jsonb_array_elements(p_answers) a
    where (a ->> 'question_id')::uuid = q.id
    limit 1
  ) submitted on true
  left join public.choices c
    on c.id = submitted.choice_id
   and c.question_id = q.id
  where q.quiz_id = v_quiz.id;

  select
    coalesce(sum(points) filter (where is_correct), 0),
    coalesce(sum(points), 0)
  into v_score, v_total
  from _submission;

  if v_total = 0 then
    raise exception 'This quiz has no questions yet' using errcode = 'P0002';
  end if;

  v_percentage := round((v_score::numeric / v_total) * 100, 2);
  v_passed     := v_percentage >= v_quiz.passing_percentage;

  select coalesce(max(attempt_number), 0) + 1
  into v_attempt_no
  from public.attempts
  where student_id = v_student and quiz_id = v_quiz.id;

  insert into public.attempts (student_id, quiz_id, attempt_number, score,
                               total_items, percentage, passed)
  values (v_student, v_quiz.id, v_attempt_no, v_score, v_total,
          v_percentage, v_passed)
  returning id into v_attempt_id;

  insert into public.attempt_answers (attempt_id, question_id, choice_id, is_correct)
  select v_attempt_id, question_id, choice_id, is_correct
  from _submission;

  -- Per-question feedback. The correct answer is included only when the teacher
  -- has explicitly enabled reveal_answers for this quiz.
  select jsonb_agg(
    jsonb_build_object(
      'question_id',  s.question_id,
      'choice_id',    s.choice_id,
      'is_correct',   s.is_correct,
      'correct_choice_id',
        case when v_quiz.reveal_answers then q.correct_choice_id else null end,
      'explanation',
        case when v_quiz.reveal_answers then q.explanation else null end
    )
    order by q.sort_order
  )
  into v_breakdown
  from _submission s
  join public.questions q on q.id = s.question_id;

  return jsonb_build_object(
    'attempt_id',     v_attempt_id,
    'attempt_number', v_attempt_no,
    'score',          v_score,
    'total_items',    v_total,
    'percentage',     v_percentage,
    'passed',         v_passed,
    'reveal_answers', v_quiz.reveal_answers,
    'results',        coalesce(v_breakdown, '[]'::jsonb)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Progress
--
-- security_invoker keeps the caller's RLS in force, so a student reading these
-- views still sees only their own rows.
-- -----------------------------------------------------------------------------

create view public.student_best_attempts
with (security_invoker = true) as
select distinct on (student_id, quiz_id)
  student_id,
  quiz_id,
  attempt_number,
  score,
  total_items,
  percentage,
  passed,
  submitted_at
from public.attempts
order by student_id, quiz_id, percentage desc, submitted_at asc;

-- A recipe counts as completed once its quiz has been submitted at least once.
-- One quiz per recipe, so completed recipes and completed quizzes are the same
-- number by construction.
create view public.student_progress
with (security_invoker = true) as
select
  p.id                                      as student_id,
  p.full_name,
  p.username,
  p.section_id,
  totals.total_recipes,
  totals.total_quizzes,
  coalesce(agg.quizzes_completed, 0)        as quizzes_completed,
  coalesce(agg.quizzes_completed, 0)        as recipes_completed,
  coalesce(agg.average_percentage, 0)       as average_percentage,
  coalesce(agg.quizzes_passed, 0)           as quizzes_passed,
  agg.last_activity_at
from public.profiles p
cross join lateral (
  select
    (select count(*) from public.recipes where is_published) as total_recipes,
    (
      select count(*)
      from public.quizzes q
      join public.recipes r on r.id = q.recipe_id
      where q.is_published and r.is_published
    ) as total_quizzes
) totals
left join lateral (
  select
    count(*)                            as quizzes_completed,
    count(*) filter (where b.passed)    as quizzes_passed,
    round(avg(b.percentage), 2)         as average_percentage,
    max(b.submitted_at)                 as last_activity_at
  from public.student_best_attempts b
  where b.student_id = p.id
) agg on true
where p.role = 'student';

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------

revoke all on function public.get_quiz_for_student(uuid)      from public, anon;
revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public, anon;
revoke all on function public.username_available(text)         from public;

grant execute on function public.get_quiz_for_student(uuid)       to authenticated;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;
grant execute on function public.username_available(text)         to anon, authenticated;

grant select on public.student_best_attempts to authenticated;
grant select on public.student_progress      to authenticated;

-- =============================================================================
-- Recipe Keeper — row level security
--
-- Threat model: a student holds a real JWT and can call PostgREST directly with
-- curl. Nothing may rely on the UI to hide it.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Role helpers.
--
-- SECURITY DEFINER so they read profiles without re-entering the policies that
-- call them, which would recurse.
-- -----------------------------------------------------------------------------

create or replace function public.auth_role()
returns public.app_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.auth_role() = 'admin', false);
$$;

-- Admin or teacher: the two roles allowed to author content.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.auth_role() in ('admin', 'teacher'), false);
$$;

-- True when the caller is an admin, or a teacher who advises that student's
-- section. Keeps one teacher out of another teacher's class records.
create or replace function public.can_view_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.profiles p
      join public.sections s on s.id = p.section_id
      where p.id = p_student_id
        and s.teacher_id = auth.uid()
    );
$$;

-- -----------------------------------------------------------------------------
-- A student must not be able to promote themselves. RLS is row level, not
-- column level, so the privileged columns are guarded by a trigger.
-- -----------------------------------------------------------------------------

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.section_id is distinct from old.section_id
     or new.is_active is distinct from old.is_active then
    raise exception 'Only an administrator may change role, section, or active status'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- -----------------------------------------------------------------------------
-- Enable RLS everywhere. Any table left out would be world readable.
-- -----------------------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.sections          enable row level security;
alter table public.categories        enable row level security;
alter table public.techniques        enable row level security;
alter table public.recipes           enable row level security;
alter table public.ingredients       enable row level security;
alter table public.steps             enable row level security;
alter table public.recipe_techniques enable row level security;
alter table public.quizzes           enable row level security;
alter table public.questions         enable row level security;
alter table public.choices           enable row level security;
alter table public.attempts          enable row level security;
alter table public.attempt_answers   enable row level security;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------

create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy profiles_select_staff on public.profiles
  for select to authenticated
  using (public.is_admin() or public.can_view_student(id));

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- sections — readable by everyone signed in, because the registration form
-- needs to offer the grade level / section dropdown.
-- -----------------------------------------------------------------------------

create policy sections_select_all on public.sections
  for select to authenticated
  using (true);

create policy sections_admin_all on public.sections
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy sections_teacher_update_own on public.sections
  for update to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Reference content — readable by any signed-in user, written by staff.
-- -----------------------------------------------------------------------------

create policy categories_select_all on public.categories
  for select to authenticated using (true);

create policy categories_staff_all on public.categories
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy techniques_select_all on public.techniques
  for select to authenticated using (true);

create policy techniques_staff_all on public.techniques
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- -----------------------------------------------------------------------------
-- Recipes and their children — students see published only.
-- -----------------------------------------------------------------------------

create policy recipes_select_published on public.recipes
  for select to authenticated
  using (is_published or public.is_staff());

create policy recipes_staff_all on public.recipes
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy ingredients_select_published on public.ingredients
  for select to authenticated
  using (
    exists (
      select 1 from public.recipes r
      where r.id = ingredients.recipe_id
        and (r.is_published or public.is_staff())
    )
  );

create policy ingredients_staff_all on public.ingredients
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy steps_select_published on public.steps
  for select to authenticated
  using (
    exists (
      select 1 from public.recipes r
      where r.id = steps.recipe_id
        and (r.is_published or public.is_staff())
    )
  );

create policy steps_staff_all on public.steps
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy recipe_techniques_select_published on public.recipe_techniques
  for select to authenticated
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_techniques.recipe_id
        and (r.is_published or public.is_staff())
    )
  );

create policy recipe_techniques_staff_all on public.recipe_techniques
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- -----------------------------------------------------------------------------
-- Assessment
--
-- Students get NO direct read on questions or choices. Everything they need
-- arrives through get_quiz_for_student(), which never selects the answer key.
-- -----------------------------------------------------------------------------

create policy quizzes_select_published on public.quizzes
  for select to authenticated
  using (
    public.is_staff()
    or (
      is_published
      and exists (
        select 1 from public.recipes r
        where r.id = quizzes.recipe_id and r.is_published
      )
    )
  );

create policy quizzes_staff_all on public.quizzes
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy questions_staff_only on public.questions
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy choices_staff_only on public.choices
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- -----------------------------------------------------------------------------
-- Results
--
-- Deliberately no INSERT policy: a student must not be able to POST themselves
-- a perfect score. Rows are created only by submit_quiz_attempt(), which is
-- SECURITY DEFINER and therefore bypasses these policies.
-- -----------------------------------------------------------------------------

create policy attempts_select_own on public.attempts
  for select to authenticated
  using (student_id = auth.uid());

create policy attempts_select_staff on public.attempts
  for select to authenticated
  using (public.can_view_student(student_id));

create policy attempts_admin_delete on public.attempts
  for delete to authenticated
  using (public.is_admin());

create policy attempt_answers_select_own on public.attempt_answers
  for select to authenticated
  using (
    exists (
      select 1 from public.attempts a
      where a.id = attempt_answers.attempt_id
        and (a.student_id = auth.uid() or public.can_view_student(a.student_id))
    )
  );

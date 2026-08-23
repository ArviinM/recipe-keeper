-- =============================================================================
-- Close the cross-teacher hole on sections.
--
-- sections_staff_update let ANY teacher edit ANY section. That defeats the
-- isolation the rest of the schema is built on: reassigning teacher_id hands a
-- teacher another class's students — their names, emails, scores, and the
-- ability to reset their passwords. Flipping default_locale silently changes
-- the language of instruction for a class, which is the study's controlled
-- variable.
--
-- Not yet exploitable with a single staff account, but it becomes live the
-- moment a second teacher exists, which is the expected classroom setup.
-- =============================================================================

drop policy if exists sections_staff_update on public.sections;

-- A teacher may still create a section, but only one they advise themselves.
drop policy if exists sections_staff_insert on public.sections;
create policy sections_staff_insert on public.sections
  for insert to authenticated
  with check (
    public.is_admin()
    or (public.is_staff() and teacher_id = auth.uid())
  );

-- Renaming your own section is fine. Reassigning its adviser, moving it to
-- another grade, or changing its language is not.
create or replace function public.guard_section_privileges()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Trusted server-side context (service role, migrations).
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.teacher_id is distinct from old.teacher_id
     or new.grade_level is distinct from old.grade_level
     or new.default_locale is distinct from old.default_locale then
    raise exception
      'Only an administrator may change a section''s adviser, grade level, or language'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists sections_guard_privileges on public.sections;
create trigger sections_guard_privileges
  before update on public.sections
  for each row execute function public.guard_section_privileges();

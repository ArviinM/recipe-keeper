-- =============================================================================
-- The registration form needs the grade level / section dropdown before the
-- student has an account, but sections is readable only by authenticated users.
--
-- Rather than opening the whole table to anonymous callers, expose exactly the
-- three columns the dropdown needs. teacher_id and timestamps stay private.
-- =============================================================================

create or replace function public.list_sections_for_registration()
returns table (id uuid, grade_level smallint, name text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select s.id, s.grade_level, s.name
  from public.sections s
  where s.is_active
  order by s.grade_level, s.name;
$$;

revoke all on function public.list_sections_for_registration() from public;
grant execute on function public.list_sections_for_registration() to anon, authenticated;

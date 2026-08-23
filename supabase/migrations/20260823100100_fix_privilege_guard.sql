-- =============================================================================
-- Let trusted server-side contexts change a profile's role.
--
-- The guard previously required is_admin(), which is false whenever there is no
-- JWT — including inside the service-role connection GoTrue uses. That blocked
-- the app_metadata sync and made admin user creation fail outright.
--
-- Allowing "no authenticated user" is safe because RLS gets there first: the
-- only UPDATE policies on profiles are scoped to authenticated, and both match
-- on auth.uid(). With no JWT, no policy row matches, so an anonymous client can
-- never reach this trigger. Only the service role and postgres can — both of
-- which are already fully trusted.
-- =============================================================================

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Trusted server-side context (service role, migrations, auth triggers).
  if auth.uid() is null then
    return new;
  end if;

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

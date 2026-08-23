-- =============================================================================
-- Keep profiles.role in step with auth.users.raw_app_meta_data.
--
-- GoTrue's admin createUser inserts the user first and applies app_metadata in a
-- follow-up UPDATE. The AFTER INSERT trigger therefore never sees a supplied
-- role, and every account — including teachers and admins — was silently
-- provisioned as a student.
--
-- app_metadata is writable only with the service-role key (a signed-in user can
-- change user_metadata but never app_metadata), so it stays a trusted channel
-- for privilege.
-- =============================================================================

create or replace function public.sync_profile_from_app_metadata()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role  public.app_role;
  v_force boolean;
begin
  v_role  := nullif(new.raw_app_meta_data ->> 'role', '')::public.app_role;
  v_force := (new.raw_app_meta_data ->> 'must_change_password')::boolean;

  if v_role is null and v_force is null then
    return new;
  end if;

  update public.profiles
     set role                 = coalesce(v_role, role),
         must_change_password = coalesce(v_force, must_change_password)
   where id = new.id
     and (
       (v_role  is not null and role                 is distinct from v_role)
       or
       (v_force is not null and must_change_password is distinct from v_force)
     );

  return new;
end;
$$;

create trigger on_auth_user_app_metadata_changed
  after update of raw_app_meta_data on auth.users
  for each row
  when (new.raw_app_meta_data is distinct from old.raw_app_meta_data)
  execute function public.sync_profile_from_app_metadata();

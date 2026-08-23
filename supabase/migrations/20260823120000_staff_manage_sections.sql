-- =============================================================================
-- Teachers need to create the sections they advise.
--
-- Previously only an administrator could insert a section, which meant a
-- teacher could not set up their own class without help. Deleting a section
-- stays administrator-only, because it detaches every student in it.
-- =============================================================================

create policy sections_staff_insert on public.sections
  for insert to authenticated
  with check (public.is_staff());

create policy sections_staff_update on public.sections
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

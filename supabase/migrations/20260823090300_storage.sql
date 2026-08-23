-- =============================================================================
-- Recipe Keeper — storage
--
-- One public bucket for recipe and step photos. Videos are NOT stored here:
-- the free tier caps storage at 1 GB and bandwidth burns fast, so recipes hold
-- an unlisted YouTube URL instead.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recipe-media',
  'recipe-media',
  true,
  5242880, -- 5 MB, generous for a phone photo that has been resized
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "recipe media is publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'recipe-media');

create policy "staff may upload recipe media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'recipe-media' and public.is_staff());

create policy "staff may replace recipe media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'recipe-media' and public.is_staff())
  with check (bucket_id = 'recipe-media' and public.is_staff());

create policy "staff may delete recipe media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'recipe-media' and public.is_staff());

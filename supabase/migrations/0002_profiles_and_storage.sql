create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public, file_size_limit)
values ('note-files', 'note-files', false, 52428800)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "Users can read own note files" on storage.objects;
create policy "Users can read own note files"
on storage.objects for select
using (
  bucket_id = 'note-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can upload own note files" on storage.objects;
create policy "Users can upload own note files"
on storage.objects for insert
with check (
  bucket_id = 'note-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update own note files" on storage.objects;
create policy "Users can update own note files"
on storage.objects for update
using (
  bucket_id = 'note-files'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'note-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete own note files" on storage.objects;
create policy "Users can delete own note files"
on storage.objects for delete
using (
  bucket_id = 'note-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

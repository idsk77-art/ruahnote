alter table public.notes
add column if not exists session_number integer,
add column if not exists is_favorite boolean not null default false;

create index if not exists notes_user_date_idx on public.notes(user_id, note_date desc);
create index if not exists notes_user_favorite_idx on public.notes(user_id, is_favorite)
where is_favorite = true;

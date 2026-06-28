create table if not exists public.google_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  google_sub text,
  email text,
  scope text,
  token_type text,
  access_token_enc text not null,
  refresh_token_enc text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, google_sub)
);

create index if not exists google_accounts_user_id_idx
on public.google_accounts(user_id);

drop trigger if exists google_accounts_set_updated_at on public.google_accounts;
create trigger google_accounts_set_updated_at
before update on public.google_accounts
for each row execute function public.set_updated_at();

alter table public.google_accounts enable row level security;

drop policy if exists "Users manage own google accounts" on public.google_accounts;
create policy "Users manage own google accounts"
on public.google_accounts for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

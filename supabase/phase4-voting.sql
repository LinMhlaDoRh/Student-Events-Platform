-- Phase 4 - Voting
--
-- Students register interest in clustered ideas. One row per
-- (suggestion, user, vote_type); the unique constraint is what blocks double
-- voting at the database level rather than trusting the UI. The app only uses
-- 'interested' today, but 'will_attend' is kept in the check so commitment
-- voting can be switched on later without a migration.
--
-- Run after phase2-suggestions.sql.

create table if not exists public.votes (
  id            uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.suggestions(id) on delete cascade,
  user_id       uuid not null default auth.uid() references public.users(id) on delete cascade,
  vote_type     text not null check (vote_type in ('interested', 'will_attend')),
  created_at    timestamptz not null default now(),
  unique (suggestion_id, user_id, vote_type)
);

create index if not exists votes_suggestion_idx on public.votes (suggestion_id);
create index if not exists votes_user_idx on public.votes (user_id);

alter table public.votes enable row level security;

-- Anyone signed in can read vote rows - live counts and the public interest
-- total are the whole point, so this is intentionally open to authenticated users.
drop policy if exists read_votes on public.votes;
create policy read_votes
  on public.votes for select
  to authenticated
  using (true);

drop policy if exists insert_own_votes on public.votes;
create policy insert_own_votes
  on public.votes for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists delete_own_votes on public.votes;
create policy delete_own_votes
  on public.votes for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists admins_manage_votes on public.votes;
create policy admins_manage_votes
  on public.votes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, delete on public.votes to authenticated;

-- Live counts: add the table to the realtime publication. Guarded so re-running
-- the file doesn't error if it's already published.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table public.votes;
  end if;
end $$;

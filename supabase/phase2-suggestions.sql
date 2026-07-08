-- Phase 2 - Suggestions
--
-- The core "demand signal" table: one row per student idea. Run this after
-- phase1-auth.sql and BEFORE phase2-anonymous.sql / phase3-ai.sql, which add the
-- optional `anonymous` and `category` columns on top of it.
--
-- Read model (two SELECT policies, OR'd together):
--   - a student always sees their own rows, and
--   - everyone signed in sees rows that have been clustered (cluster_label set).
-- Raw, un-clustered ideas from other students stay private until the SRC has
-- grouped them. Admins get full access through the is_admin() policy.
--
-- submitted_by defaults to auth.uid() so the client never has to send it (and
-- can't forge it - the insert policy checks it matches the caller).

create table if not exists public.suggestions (
  id            uuid primary key default gen_random_uuid(),
  text          text not null check (char_length(text) between 1 and 280),
  campus        text not null check (campus in ('musgrave', 'umhlanga')),
  cluster_label text,
  status        text not null default 'submitted'
                  check (status in ('submitted', 'review', 'considering', 'approved', 'rejected')),
  submitted_by  uuid not null default auth.uid()
                  references public.users(id) on delete cascade,
  created_at    timestamptz not null default now()
);

create index if not exists suggestions_submitted_by_idx on public.suggestions (submitted_by);
create index if not exists suggestions_created_at_idx   on public.suggestions (created_at desc);
create index if not exists suggestions_cluster_idx      on public.suggestions (cluster_label);

alter table public.suggestions enable row level security;

drop policy if exists read_own_suggestions on public.suggestions;
create policy read_own_suggestions
  on public.suggestions for select
  to authenticated
  using (submitted_by = auth.uid());

drop policy if exists read_clustered_suggestions on public.suggestions;
create policy read_clustered_suggestions
  on public.suggestions for select
  to authenticated
  using (cluster_label is not null);

drop policy if exists insert_own_suggestions on public.suggestions;
create policy insert_own_suggestions
  on public.suggestions for insert
  to authenticated
  with check (submitted_by = auth.uid());

drop policy if exists delete_own_suggestions on public.suggestions;
create policy delete_own_suggestions
  on public.suggestions for delete
  to authenticated
  using (submitted_by = auth.uid());

drop policy if exists admins_manage_suggestions on public.suggestions;
create policy admins_manage_suggestions
  on public.suggestions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.suggestions to authenticated;

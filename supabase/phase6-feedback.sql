-- Phase 6 - Post-event feedback
--
-- One rating per student per event (the unique constraint enforces it, and the
-- app upserts on that pair). Students only ever see and edit their own feedback;
-- admins read everything to build the per-event averages on the Feedback page.
--
-- Run after phase5-events.sql.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  did_attend boolean not null default true,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists feedback_event_idx on public.feedback (event_id);
create index if not exists feedback_user_idx on public.feedback (user_id);

alter table public.feedback enable row level security;

drop policy if exists read_own_feedback on public.feedback;
create policy read_own_feedback
  on public.feedback for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists insert_own_feedback on public.feedback;
create policy insert_own_feedback
  on public.feedback for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists update_own_feedback on public.feedback;
create policy update_own_feedback
  on public.feedback for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists admins_manage_feedback on public.feedback;
create policy admins_manage_feedback
  on public.feedback for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.feedback to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'feedback'
  ) then
    alter publication supabase_realtime add table public.feedback;
  end if;
end $$;

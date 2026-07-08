-- Phase 5 - Events and RSVPs
--
-- Admins create and confirm events; students RSVP. Campus visibility is enforced
-- in SQL, not just hidden in the UI: a student sees events scoped to 'both' or to
-- their own campus, and never sees cancelled ones. Admins see everything through
-- the is_admin() policy.
--
-- my_campus() is the campus counterpart to is_admin(): SECURITY DEFINER so the
-- read policy can look up the caller's campus without relying on a direct SELECT
-- path into public.users.
--
-- Run after phase1-auth.sql (needs is_admin) and phase2-suggestions.sql.

create or replace function public.my_campus()
returns text
language sql
security definer
set search_path = ''
stable
as $$
  select campus from public.users where id = auth.uid();
$$;

grant execute on function public.my_campus() to authenticated;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 140),
  description text,
  campus_scope text not null default 'both'
    check (campus_scope in ('musgrave', 'umhlanga', 'both')),
  category text not null default 'other'
    check (category in ('sports', 'social', 'academic', 'cultural', 'other')),
  status text not null default 'upcoming'
    check (status in ('upcoming', 'past', 'cancelled')),
  event_date timestamptz,
  created_by uuid not null default auth.uid() references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists events_status_idx on public.events (status);
create index if not exists events_date_idx on public.events (event_date);
create index if not exists events_scope_idx on public.events (campus_scope);

create table if not exists public.event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists event_attendees_event_idx on public.event_attendees (event_id);
create index if not exists event_attendees_user_idx on public.event_attendees (user_id);

alter table public.events enable row level security;
alter table public.event_attendees enable row level security;

drop policy if exists read_events on public.events;
create policy read_events
  on public.events for select
  to authenticated
  using (
    status <> 'cancelled'
    and (campus_scope = 'both' or campus_scope = public.my_campus())
  );

drop policy if exists admins_manage_events on public.events;
create policy admins_manage_events
  on public.events for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists read_attendees on public.event_attendees;
create policy read_attendees
  on public.event_attendees for select
  to authenticated
  using (true);

drop policy if exists insert_own_attendance on public.event_attendees;
create policy insert_own_attendance
  on public.event_attendees for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists delete_own_attendance on public.event_attendees;
create policy delete_own_attendance
  on public.event_attendees for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists admins_manage_attendees on public.event_attendees;
create policy admins_manage_attendees
  on public.event_attendees for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.events to authenticated;
grant select, insert, delete on public.event_attendees to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events'
  ) then
    alter publication supabase_realtime add table public.events;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'event_attendees'
  ) then
    alter publication supabase_realtime add table public.event_attendees;
  end if;
end $$;

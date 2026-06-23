-- Phase 2: let admins read the full student roster.
--
-- WHY THIS IS NEEDED
-- The public.users table has Row Level Security enabled, and Phase 1 only added
-- an "own profile" SELECT policy (auth.uid() = id). That is why the Admin ->
-- Students page can only ever see the signed-in admin's own row. This migration
-- adds a SELECT policy that lets admins read every profile.
--
-- We use a SECURITY DEFINER helper function so the role check does NOT re-trigger
-- RLS on public.users (which would cause infinite recursion).
--
-- Run this in the Supabase SQL editor (Dashboard -> SQL).

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- Admins can read all profiles (the Students roster).
drop policy if exists "Admins can read all profiles" on public.users;
create policy "Admins can read all profiles"
on public.users
for select
to authenticated
using (public.is_admin());

-- NOTE: the existing "Users can read their own profile" policy stays in place.
-- Postgres combines SELECT policies with OR, so students keep seeing only
-- themselves while admins see everyone.

-- Phase 1 - Authentication, profile table, and role protection.
-- Run this first, in the Supabase SQL editor, after enabling Email/Password auth.
--
-- It creates the public.users profile table that mirrors auth.users, locks it
-- down with Row Level Security, and wires up the signup trigger.
--
-- Two things in here are load-bearing for the whole app's security. Please don't
-- "simplify" them away:
--
--   1. New profiles are ALWAYS created with role = 'student'. The role is never
--      taken from signup metadata. Anyone with the public anon key can call
--      auth.signUp() with arbitrary options.data, so trusting a role sent from
--      the client would let a stranger sign themselves up as an admin. Admins
--      are promoted by hand (see the note at the bottom of this file).
--
--   2. A BEFORE UPDATE trigger stops a normal user from editing their own role.
--      Without it the "update own profile" policy below would happily let any
--      student run:  update public.users set role = 'admin' where id = auth.uid();

-- ---------------------------------------------------------------------------
-- Profile table
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  campus text check (campus in ('musgrave', 'umhlanga')),
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- ---------------------------------------------------------------------------
-- Admin check
-- SECURITY DEFINER so the lookup runs with the owner's rights and does NOT
-- re-trigger RLS on public.users (a self-referencing SELECT policy would recurse
-- forever). search_path is pinned to '' and every name is fully qualified, which
-- keeps the function safe and clears the Supabase "mutable search_path" advisor.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- SELECT policies are combined with OR, so a student sees their own row and an
-- admin sees everyone once the admin-read policy in phase2-admin-read.sql is in
-- place. This file only sets up the owner-level policies.
-- ---------------------------------------------------------------------------
drop policy if exists "Users can read their own profile" on public.users;
create policy "Users can read their own profile"
  on public.users for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.users;
create policy "Users can insert their own profile"
  on public.users for insert
  to authenticated
  with check (auth.uid() = id);

-- A user may edit their own profile. The role column is guarded separately by
-- the prevent_role_change() trigger below, so it's deliberately not singled out
-- here - the trigger is the real fence, not this policy.
drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile"
  on public.users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Signup trigger
-- Creates the profile row when a new auth user is created. role is hardcoded to
-- 'student'; full_name and campus come from metadata because they carry no
-- privilege. on conflict do nothing keeps a re-fired trigger from clobbering an
-- existing profile (which is also how a manual admin promotion survives).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, full_name, campus, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    nullif(lower(new.raw_user_meta_data ->> 'campus'), ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Role-change guard
-- This is what makes the "update own profile" policy safe to keep. It runs on
-- every update to public.users but only objects when the role value actually
-- changes and the caller isn't an admin.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change a user role';
  end if;
  return new;
end;
$$;

drop trigger if exists users_no_self_role_change on public.users;
create trigger users_no_self_role_change
  before update on public.users
  for each row execute function public.prevent_role_change();

-- ---------------------------------------------------------------------------
-- Creating the first admin
-- There's no admin yet to satisfy the guard, and the SQL editor has no auth
-- session (auth.uid() is null), so disable the trigger for the single update:
--
--   alter table public.users disable trigger users_no_self_role_change;
--   update public.users set role = 'admin' where email = 'you@richfield.ac.za';
--   alter table public.users enable trigger users_no_self_role_change;
--
-- Then sign out and back in so the app reloads your role.
-- ---------------------------------------------------------------------------

-- Phase 1: Authentication profile table and role policies.
-- Run this in the Supabase SQL editor after enabling Email/Password auth.

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  campus text check (campus in ('musgrave', 'umhlanga')),
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamp with time zone not null default now()
);

alter table public.users enable row level security;

drop policy if exists "Users can read their own profile" on public.users;
create policy "Users can read their own profile"
on public.users
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.users;
create policy "Users can insert their own profile"
on public.users
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop function if exists public.handle_new_user();
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, campus, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'campus', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    campus = excluded.campus,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Security hardening - safe to run on an EXISTING database
-- =====================================================================
-- Use this if your Supabase project was set up before the role-escalation
-- fixes (i.e. from the original phase1-auth.sql). It is idempotent and does not
-- touch your data - it only:
--
--   1. replaces the signup trigger so new users are always students,
--   2. adds the trigger that stops a user from changing their own role,
--   3. pins search_path on the helper functions, and
--   4. tightens the suggestions read policy (drops the old open read, if present).
--
-- Why it matters: the original signup trigger copied `role` straight out of the
-- signup metadata, and nothing stopped an authenticated user from updating their
-- own role. Either path turned an ordinary account into an admin. This closes
-- both. If you are setting up a fresh database instead, just run the phase files
-- in order - they already include everything here.

-- 1 + 3. Signup always creates students; never trust role from metadata.
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

-- 3. Harden the admin check.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- 2. Block non-admins from changing any role.
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

-- 4. Tighten the suggestions read policy (only if the table exists yet).
-- Removes the old open "read_suggestions using (true)" policy and reinstates the
-- own-rows + clustered-rows model.
do $$
begin
  if to_regclass('public.suggestions') is not null then
    execute 'drop policy if exists read_suggestions on public.suggestions';

    execute 'drop policy if exists read_own_suggestions on public.suggestions';
    execute 'create policy read_own_suggestions on public.suggestions '
         || 'for select to authenticated using (submitted_by = auth.uid())';

    execute 'drop policy if exists read_clustered_suggestions on public.suggestions';
    execute 'create policy read_clustered_suggestions on public.suggestions '
         || 'for select to authenticated using (cluster_label is not null)';
  end if;
end $$;

-- Reminder: after running this, an admin can still be promoted from the SQL
-- editor by briefly disabling the guard:
--   alter table public.users disable trigger users_no_self_role_change;
--   update public.users set role = 'admin' where email = 'you@richfield.ac.za';
--   alter table public.users enable trigger users_no_self_role_change;

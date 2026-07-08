-- Phase 2 - Let admins read the full student roster.
--
-- Phase 1 only gave users an "own row" SELECT policy, which is why the admin
-- Students page could previously only ever show the signed-in admin. This adds a
-- second SELECT policy for admins. Postgres OR's SELECT policies together, so
-- students still see only themselves while admins see everyone.
--
-- is_admin() is repeated here (identical to phase1-auth.sql) so this file can be
-- re-run on its own without depending on load order.

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

drop policy if exists "Admins can read all profiles" on public.users;
create policy "Admins can read all profiles"
  on public.users for select
  to authenticated
  using (public.is_admin());

grant select on public.users to authenticated;

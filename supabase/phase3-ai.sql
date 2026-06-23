-- Phase 3: AI clustering + category tagging support.
--
-- `cluster_label` already exists on suggestions. This adds the `category`
-- column the AI pass fills in, constrained to the same set events use.
--
-- Run this in the Supabase SQL editor (Dashboard -> SQL).

alter table public.suggestions
  add column if not exists category text;

do $$
begin
  alter table public.suggestions
    add constraint suggestions_category_check
    check (category is null or category in ('sports','social','academic','cultural','other'));
exception
  when duplicate_object then null;
end $$;

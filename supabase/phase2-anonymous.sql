-- Phase 2: persist the "Submit anonymously" choice on suggestions.
--
-- The student suggestion form already has a "Submit anonymously" toggle, but
-- there was nowhere to store it, so it did nothing. This adds the column.
-- When true, the SRC review view marks the idea "Anonymous" instead of
-- attributing it.
--
-- The frontend works with or without this column (it falls back gracefully),
-- but run this so the choice is actually saved.
--
-- Run this in the Supabase SQL editor (Dashboard -> SQL).

alter table public.suggestions
  add column if not exists anonymous boolean not null default false;

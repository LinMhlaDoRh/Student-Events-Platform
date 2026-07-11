-- Authoritative fresh installation. Run this file once in a new Supabase project.
-- Existing projects must run migrations/20260711133000_comprehensive_security_remediation.sql.
begin;

create table public.users(
 id uuid primary key references auth.users(id) on delete cascade,
 email text not null, full_name text not null check(char_length(full_name) between 1 and 120),
 campus text check(campus in('musgrave','umhlanga')),
 role text not null default 'student' check(role in('student','admin')),
 created_at timestamptz not null default now()
);
alter table public.users enable row level security;

create or replace function public.is_admin() returns boolean language sql security definer set search_path='' stable
as $$ select exists(select 1 from public.users where id=auth.uid() and role='admin') $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.users(id,email,full_name,campus,role) values(new.id,new.email,coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),split_part(new.email,'@',1)),case lower(new.raw_user_meta_data->>'campus') when 'musgrave' then 'musgrave' when 'umhlanga' then 'umhlanga' else null end,'student');
 return new;
end $$;

create table public.suggestions(
 id uuid primary key default gen_random_uuid(), text text not null check(char_length(text) between 1 and 280),
 campus text not null check(campus in('musgrave','umhlanga')), cluster_label text,
 status text not null default 'submitted' check(status in('submitted','review','considering','approved','rejected')),
 submitted_by uuid not null default auth.uid() references public.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.suggestions enable row level security;

create table public.votes(
 id uuid primary key default gen_random_uuid(), suggestion_id uuid not null references public.suggestions(id) on delete cascade,
 user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
 vote_type text not null check(vote_type in('interested','will_attend')), created_at timestamptz not null default now(),
 unique(suggestion_id,user_id,vote_type)
);
alter table public.votes enable row level security;

create table public.events(
 id uuid primary key default gen_random_uuid(), title text not null check(char_length(title) between 1 and 140),
 description text, campus_scope text not null default 'both' check(campus_scope in('musgrave','umhlanga','both')),
 category text not null default 'other' check(category in('sports','social','academic','cultural','other')),
 status text not null default 'upcoming' check(status in('upcoming','past','cancelled')),
 event_date timestamptz, created_by uuid not null default auth.uid() references public.users(id), created_at timestamptz not null default now()
);
alter table public.events enable row level security;

create table public.event_attendees(
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade,
 user_id uuid not null default auth.uid() references public.users(id) on delete cascade, created_at timestamptz not null default now(),
 unique(event_id,user_id)
);
alter table public.event_attendees enable row level security;

create table public.feedback(
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade,
 user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
 rating integer not null check(rating between 1 and 5), comment text, did_attend boolean not null,
 created_at timestamptz not null default now(), unique(event_id,user_id)
);
alter table public.feedback enable row level security;

create index suggestions_submitted_by_idx on public.suggestions(submitted_by);
create index suggestions_created_at_idx on public.suggestions(created_at desc);
create index votes_suggestion_idx on public.votes(suggestion_id);
create index votes_user_idx on public.votes(user_id);
create index events_status_date_idx on public.events(status,event_date);
create index event_attendees_event_idx on public.event_attendees(event_id);
create index feedback_event_idx on public.feedback(event_id);

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

commit;

-- Apply the comprehensive remediation immediately after this file in the same
-- setup session. It creates all policies, narrow RPCs, rate limits and audit controls:
-- supabase/migrations/20260711133000_comprehensive_security_remediation.sql

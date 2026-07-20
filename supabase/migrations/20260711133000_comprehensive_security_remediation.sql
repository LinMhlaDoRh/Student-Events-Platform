-- Comprehensive security remediation for Student Events.
-- Apply once to the existing Supabase project. Safe to re-run.

begin;

-- Remove shared/public demo identities, including synthetic ghost accounts with
-- known password hashes. Cascading foreign keys remove only their owned demo rows.
delete from auth.users
where email in ('admin.demo@example.com','student.demo@example.com')
   or email like 'demo.student%@demo.local';

-- ---------------------------------------------------------------------------
-- Shared helpers and immutable audit trail
-- ---------------------------------------------------------------------------
create table if not exists public.security_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null check (char_length(action) between 1 and 80),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  reason text check (reason is null or char_length(reason) <= 500),
  created_at timestamptz not null default now()
);
alter table public.security_audit_log enable row level security;
revoke all on public.security_audit_log from anon, authenticated;
grant select on public.security_audit_log to authenticated;
drop policy if exists admins_read_audit_log on public.security_audit_log;
create policy admins_read_audit_log on public.security_audit_log
  for select to authenticated using (public.is_admin());

create table if not exists public.api_rate_limits (
  actor_id uuid not null,
  action text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (actor_id, action, window_started_at)
);
alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from anon, authenticated;

create or replace function public.check_rate_limit(
  p_action text,
  p_limit integer,
  p_window_seconds integer
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_window timestamptz;
  v_count integer;
begin
  if v_actor is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_limit < 1 or p_window_seconds < 1 then raise exception 'Invalid rate limit configuration'; end if;
  v_window := to_timestamp(floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds);
  insert into public.api_rate_limits(actor_id, action, window_started_at, request_count)
  values (v_actor, left(p_action, 80), v_window, 1)
  on conflict (actor_id, action, window_started_at)
  do update set request_count = public.api_rate_limits.request_count + 1
  returning request_count into v_count;
  delete from public.api_rate_limits where actor_id=v_actor and window_started_at<now()-interval '24 hours';
  if v_count > p_limit then raise exception 'Too many requests. Please try again later.' using errcode = 'P0001'; end if;
end;
$$;
revoke all on function public.check_rate_limit(text,integer,integer) from public, anon, authenticated;

-- Trusted role/campus helpers.
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = '' stable
as $$ select exists(select 1 from public.users where id = auth.uid() and role = 'admin') $$;
create or replace function public.my_campus()
returns text language sql security definer set search_path = '' stable
as $$ select campus from public.users where id = auth.uid() $$;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.my_campus() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.my_campus() to authenticated;

-- New accounts are always students; metadata never controls privileges.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.users(id,email,full_name,campus,role)
  values(new.id,new.email,
    left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),split_part(new.email,'@',1)),120),
    case lower(new.raw_user_meta_data->>'campus') when 'musgrave' then 'musgrave' when 'umhlanga' then 'umhlanga' else null end,
    'student')
  on conflict(id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Direct API callers may only change their own display name. Role, campus,
-- identity and timestamps are controlled by the database/owner.
create or replace function public.protect_user_security_fields()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_admins integer; v_campus_admins integer;
begin
  if auth.uid() is not null then
    if new.id is distinct from old.id or new.email is distinct from old.email or
       new.campus is distinct from old.campus or new.role is distinct from old.role or
       new.created_at is distinct from old.created_at then
      raise exception 'Identity, campus and role fields cannot be changed through the API';
    end if;
  end if;
  new.full_name := left(trim(new.full_name),120);
  if new.full_name is null or new.full_name = '' then raise exception 'Full name is required'; end if;
  if new.role = 'admin' and (new.role is distinct from old.role or new.campus is distinct from old.campus) then
    select count(*) into v_admins from public.users where role='admin' and id<>new.id;
    select count(*) into v_campus_admins from public.users where role='admin' and campus=new.campus and id<>new.id;
    if v_admins >= 2 then raise exception 'At most two administrators are allowed'; end if;
    if v_campus_admins >= 1 then raise exception 'Only one administrator per campus is allowed'; end if;
  end if;
  return new;
end;
$$;
revoke all on function public.protect_user_security_fields() from public, anon, authenticated;
drop trigger if exists users_no_self_role_change on public.users;
drop trigger if exists users_protect_security_fields on public.users;
create trigger users_protect_security_fields before update on public.users
for each row execute function public.protect_user_security_fields();

drop policy if exists "Users can insert their own profile" on public.users;
drop policy if exists "Users can update their own profile" on public.users;
drop policy if exists "Users can view their own profile." on public.users;
drop policy if exists "Users can read their own profile" on public.users;
create policy users_read_own_profile on public.users for select to authenticated using (id=auth.uid());
drop policy if exists "Admins can read all profiles" on public.users;
create policy admins_read_profiles on public.users for select to authenticated using (public.is_admin());
revoke insert, delete on public.users from authenticated;
grant select on public.users to authenticated;
grant update(full_name) on public.users to authenticated;

-- ---------------------------------------------------------------------------
-- Suggestion rounds, strict submission and anonymous community/admin reads
-- ---------------------------------------------------------------------------
create table if not exists public.suggestion_rounds (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  opens_at timestamptz not null default now(),
  closes_at timestamptz,
  active boolean not null default false,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  check (closes_at is null or closes_at > opens_at)
);
create unique index if not exists one_active_suggestion_round on public.suggestion_rounds((active)) where active;
alter table public.suggestion_rounds enable row level security;
drop policy if exists authenticated_read_rounds on public.suggestion_rounds;
create policy authenticated_read_rounds on public.suggestion_rounds for select to authenticated using (true);
drop policy if exists admins_manage_rounds on public.suggestion_rounds;
create policy admins_manage_rounds on public.suggestion_rounds for all to authenticated
using (public.is_admin()) with check (public.is_admin());
grant select,insert,update on public.suggestion_rounds to authenticated;

insert into public.suggestion_rounds(name,active)
select 'Current suggestion round',true
where not exists(select 1 from public.suggestion_rounds where active);

alter table public.suggestions add column if not exists round_id uuid references public.suggestion_rounds(id);
alter table public.suggestions add column if not exists anonymous boolean not null default false;
alter table public.suggestions add column if not exists category text;
alter table public.suggestions add column if not exists archived_at timestamptz;
update public.suggestions set round_id=(select id from public.suggestion_rounds where active limit 1) where round_id is null;
alter table public.suggestions alter column round_id set not null;

do $$ begin
  alter table public.suggestions add constraint suggestions_category_secure_check
  check(category is null or category in('sports','social','academic','cultural','other'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.suggestions add constraint suggestions_cluster_label_length
  check(cluster_label is null or char_length(cluster_label) between 1 and 60);
exception when duplicate_object then null; end $$;
create index if not exists suggestions_round_owner_idx on public.suggestions(round_id,submitted_by);
create index if not exists suggestions_active_poll_idx on public.suggestions(status,cluster_label) where archived_at is null;

-- Remove historical/open/admin direct reads. Owners can read only their own rows.
drop policy if exists read_suggestions on public.suggestions;
drop policy if exists read_clustered_suggestions on public.suggestions;
drop policy if exists admins_manage_suggestions on public.suggestions;
drop policy if exists read_own_suggestions on public.suggestions;
create policy read_own_suggestions on public.suggestions for select to authenticated
using(submitted_by=auth.uid());
drop policy if exists insert_own_suggestions on public.suggestions;
drop policy if exists delete_own_suggestions on public.suggestions;
revoke insert,update,delete on public.suggestions from authenticated;
grant select on public.suggestions to authenticated;

create or replace function public.submit_suggestion(p_text text,p_anonymous boolean default false)
returns public.suggestions language plpgsql security definer set search_path=''
as $$
declare v_round uuid; v_row public.suggestions; v_campus text;
begin
  perform public.check_rate_limit('submit_suggestion',3,3600);
  v_campus:=public.my_campus();
  if v_campus is null then raise exception 'A verified campus is required'; end if;
  if char_length(trim(p_text)) not between 1 and 280 then raise exception 'Suggestion must contain 1 to 280 characters'; end if;
  select id into v_round from public.suggestion_rounds where active and opens_at<=now() and (closes_at is null or closes_at>now()) limit 1;
  if v_round is null then raise exception 'Suggestions are currently closed'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||v_round::text,0));
  if exists(select 1 from public.suggestions where submitted_by=auth.uid() and round_id=v_round) then
    raise exception 'You have already submitted an idea in this round';
  end if;
  insert into public.suggestions(text,campus,cluster_label,status,submitted_by,round_id,anonymous,category,created_at)
  values(trim(p_text),v_campus,null,'submitted',auth.uid(),v_round,coalesce(p_anonymous,false),null,now()) returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.withdraw_suggestion(p_suggestion_id uuid)
returns void language plpgsql security definer set search_path=''
as $$
declare v_old public.suggestions;
begin
  perform public.check_rate_limit('withdraw_suggestion',5,3600);
  select * into v_old from public.suggestions where id=p_suggestion_id and submitted_by=auth.uid() for update;
  if not found then raise exception 'Suggestion not found'; end if;
  if v_old.status not in('submitted','review') or v_old.cluster_label is not null or exists(select 1 from public.votes where suggestion_id=p_suggestion_id) then
    raise exception 'This suggestion can no longer be withdrawn';
  end if;
  update public.suggestions set archived_at=now(),status='rejected' where id=p_suggestion_id;
end;
$$;

create or replace function public.get_community_suggestions()
returns table(id uuid,text text,campus text,cluster_label text,status text,category text,round_id uuid,created_at timestamptz)
language sql security definer set search_path='' stable
as $$
  select s.id,s.text,s.campus,s.cluster_label,s.status,s.category,s.round_id,s.created_at
  from public.suggestions s join public.suggestion_rounds r on r.id=s.round_id and r.active
  where s.archived_at is null and s.cluster_label is not null
  order by s.created_at desc limit 500
$$;

create or replace function public.admin_list_suggestions()
returns table(id uuid,text text,campus text,cluster_label text,status text,category text,anonymous boolean,round_id uuid,created_at timestamptz)
language plpgsql security definer set search_path='' stable
as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return query select s.id,s.text,s.campus,s.cluster_label,s.status,s.category,s.anonymous,s.round_id,s.created_at
  from public.suggestions s where s.archived_at is null order by s.created_at desc limit 500;
end;
$$;

create or replace function public.admin_update_suggestion(p_id uuid,p_cluster_label text default null,p_status text default null,p_category text default null,p_reason text default null)
returns void language plpgsql security definer set search_path=''
as $$
declare v_old public.suggestions; v_new public.suggestions;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  perform public.check_rate_limit('admin_update_suggestion',60,60);
  select * into v_old from public.suggestions where id=p_id for update;
  if not found then raise exception 'Suggestion not found'; end if;
  if p_status is not null and p_status not in('submitted','review','considering','approved','rejected') then raise exception 'Invalid status'; end if;
  if p_category is not null and p_category not in('sports','social','academic','cultural','other') then raise exception 'Invalid category'; end if;
  if p_cluster_label is not null and char_length(trim(p_cluster_label)) not between 1 and 60 then raise exception 'Invalid cluster label'; end if;
  update public.suggestions set
    cluster_label=case when p_cluster_label is null then cluster_label else nullif(trim(p_cluster_label),'') end,
    status=coalesce(p_status,status),category=coalesce(p_category,category)
  where id=p_id returning * into v_new;
  insert into public.security_audit_log(actor_id,action,entity_type,entity_id,old_data,new_data,reason)
  values(auth.uid(),'suggestion.update','suggestion',p_id,to_jsonb(v_old)-'submitted_by',to_jsonb(v_new)-'submitted_by',left(p_reason,500));
end;
$$;

-- ---------------------------------------------------------------------------
-- Privacy-preserving and state-aware voting
-- ---------------------------------------------------------------------------
drop policy if exists read_votes on public.votes;
drop policy if exists insert_own_votes on public.votes;
drop policy if exists delete_own_votes on public.votes;
drop policy if exists admins_manage_votes on public.votes;
create policy read_own_votes on public.votes for select to authenticated using(user_id=auth.uid());
create policy admins_read_votes on public.votes for select to authenticated using(public.is_admin());
revoke insert,delete,update on public.votes from authenticated;
grant select on public.votes to authenticated;

create or replace function public.get_active_polls()
returns table(id uuid,text text,campus text,cluster_label text,status text,created_at timestamptz,interested_count bigint,i_voted boolean)
language sql security definer set search_path='' stable
as $$
 select s.id,s.text,s.campus,s.cluster_label,s.status,s.created_at,
        count(v.id) filter(where v.vote_type='interested')::bigint,
        bool_or(v.user_id=auth.uid() and v.vote_type='interested')
 from public.suggestions s join public.suggestion_rounds r on r.id=s.round_id and r.active
 left join public.votes v on v.suggestion_id=s.id
 where s.archived_at is null and s.cluster_label is not null and s.status in('submitted','review','considering')
 group by s.id
 order by s.created_at desc
$$;

create or replace function public.toggle_interest(p_suggestion_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_exists boolean;
begin
  perform public.check_rate_limit('toggle_interest',30,60);
  if not exists(select 1 from public.suggestions where id=p_suggestion_id and archived_at is null and cluster_label is not null and status in('submitted','review','considering')) then
    raise exception 'This poll is not active';
  end if;
  select exists(select 1 from public.votes where suggestion_id=p_suggestion_id and user_id=auth.uid() and vote_type='interested') into v_exists;
  if v_exists then delete from public.votes where suggestion_id=p_suggestion_id and user_id=auth.uid() and vote_type='interested'; return false;
  else insert into public.votes(suggestion_id,user_id,vote_type) values(p_suggestion_id,auth.uid(),'interested') on conflict do nothing; return true; end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Events, RSVP privacy and feedback eligibility
-- ---------------------------------------------------------------------------
drop policy if exists read_events on public.events;
create policy read_events on public.events for select to authenticated
using(status<>'cancelled' and (campus_scope='both' or campus_scope=public.my_campus()));
drop policy if exists admins_manage_events on public.events;
create policy admins_manage_events on public.events for all to authenticated
using(public.is_admin()) with check(public.is_admin());
grant select,insert,update on public.events to authenticated;

-- Feedback rows are private to their author and administrators. Writes happen
-- only through submit_event_feedback so event/date/campus rules cannot be bypassed.
drop policy if exists read_own_feedback on public.feedback;
drop policy if exists insert_own_feedback on public.feedback;
drop policy if exists update_own_feedback on public.feedback;
drop policy if exists admins_manage_feedback on public.feedback;
create policy read_own_feedback on public.feedback for select to authenticated using(user_id=auth.uid());
create policy admins_read_feedback on public.feedback for select to authenticated using(public.is_admin());

do $$ begin alter table public.events add constraint events_description_length check(description is null or char_length(description)<=2000);
exception when duplicate_object then null; end $$;
do $$ begin alter table public.feedback add constraint feedback_comment_length check(comment is null or char_length(comment)<=1000);
exception when duplicate_object then null; end $$;

drop policy if exists read_attendees on public.event_attendees;
drop policy if exists insert_own_attendance on public.event_attendees;
drop policy if exists delete_own_attendance on public.event_attendees;
drop policy if exists admins_manage_attendees on public.event_attendees;
create policy read_own_attendance on public.event_attendees for select to authenticated using(user_id=auth.uid());
create policy admins_read_attendance on public.event_attendees for select to authenticated using(public.is_admin());
revoke insert,delete,update on public.event_attendees from authenticated;
grant select on public.event_attendees to authenticated;

create or replace function public.get_visible_events()
returns table(id uuid,title text,description text,campus_scope text,category text,status text,event_date timestamptz,created_at timestamptz,going_count bigint,i_am_going boolean)
language sql security definer set search_path='' stable
as $$
 select e.id,e.title,e.description,e.campus_scope,e.category,e.status,e.event_date,e.created_at,
        count(a.id)::bigint,bool_or(a.user_id=auth.uid())
 from public.events e left join public.event_attendees a on a.event_id=e.id
 where (public.is_admin() or (e.status<>'cancelled' and (e.campus_scope='both' or e.campus_scope=public.my_campus())))
 group by e.id order by e.event_date limit 500
$$;

create or replace function public.toggle_event_attendance(p_event_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_exists boolean;
begin
  perform public.check_rate_limit('toggle_event_attendance',20,60);
  if not exists(select 1 from public.events e where e.id=p_event_id and e.status='upcoming' and e.event_date>now()
    and (e.campus_scope='both' or e.campus_scope=public.my_campus())) then raise exception 'This event is not open for RSVP'; end if;
  select exists(select 1 from public.event_attendees where event_id=p_event_id and user_id=auth.uid()) into v_exists;
  if v_exists then delete from public.event_attendees where event_id=p_event_id and user_id=auth.uid(); return false;
  else insert into public.event_attendees(event_id,user_id) values(p_event_id,auth.uid()) on conflict do nothing; return true; end if;
end;
$$;

create or replace function public.submit_event_feedback(p_event_id uuid,p_rating integer,p_comment text,p_did_attend boolean)
returns public.feedback language plpgsql security definer set search_path=''
as $$
declare v_row public.feedback;
begin
  perform public.check_rate_limit('submit_event_feedback',10,3600);
  if p_rating not between 1 and 5 then raise exception 'Rating must be between 1 and 5'; end if;
  if p_did_attend is null then raise exception 'Please state whether you attended'; end if;
  if p_comment is not null and char_length(trim(p_comment))>1000 then raise exception 'Comment is too long'; end if;
  -- Students may respond after a campus-visible event even if they did not RSVP;
  -- this includes genuine walk-in attendees. The 30-day window limits abuse.
  if not exists(select 1 from public.events e where e.id=p_event_id and e.status<>'cancelled'
    and e.event_date<=now() and e.event_date>=now()-interval '30 days'
    and (e.campus_scope='both' or e.campus_scope=public.my_campus())) then raise exception 'Feedback is not open for this event'; end if;
  insert into public.feedback(event_id,user_id,rating,comment,did_attend)
  values(p_event_id,auth.uid(),p_rating,nullif(trim(p_comment),''),p_did_attend)
  on conflict(event_id,user_id) do update set rating=excluded.rating,comment=excluded.comment,did_attend=excluded.did_attend
  returning * into v_row;
  return v_row;
end;
$$;
revoke insert,update,delete on public.feedback from authenticated;
grant select on public.feedback to authenticated;

-- Audit admin event mutations and prevent hard deletion through the API.
create or replace function public.audit_event_change()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if tg_op='DELETE' then
    insert into public.security_audit_log(actor_id,action,entity_type,entity_id,old_data) values(auth.uid(),'event.delete','event',old.id,to_jsonb(old)); return old;
  else
    insert into public.security_audit_log(actor_id,action,entity_type,entity_id,old_data,new_data) values(auth.uid(),'event.'||lower(tg_op),'event',new.id,case when tg_op='UPDATE' then to_jsonb(old) end,to_jsonb(new)); return new;
  end if;
end;
$$;
revoke all on function public.audit_event_change() from public,anon,authenticated;
drop trigger if exists events_security_audit on public.events;
create trigger events_security_audit after insert or update or delete on public.events for each row execute function public.audit_event_change();
revoke delete on public.events from authenticated;

-- ---------------------------------------------------------------------------
-- AI run lock / budget guard
-- ---------------------------------------------------------------------------
create table if not exists public.ai_analysis_runs(
 id uuid primary key default gen_random_uuid(), requested_by uuid not null references public.users(id),
 status text not null check(status in('running','completed','failed')), started_at timestamptz not null default now(),
 finished_at timestamptz, updated_count integer, error_code text
);
create unique index if not exists one_running_ai_analysis on public.ai_analysis_runs((status)) where status='running';
alter table public.ai_analysis_runs enable row level security;
drop policy if exists admins_read_ai_runs on public.ai_analysis_runs;
create policy admins_read_ai_runs on public.ai_analysis_runs for select to authenticated using(public.is_admin());
revoke all on public.ai_analysis_runs from anon,authenticated;
grant select on public.ai_analysis_runs to authenticated;

create or replace function public.begin_ai_analysis()
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid;
begin
 if not public.is_admin() then raise exception 'Admins only'; end if;
 perform public.check_rate_limit('ai_analysis',2,3600);
 update public.ai_analysis_runs set status='failed',finished_at=now(),error_code='stale_lock' where status='running' and started_at<now()-interval '5 minutes';
 insert into public.ai_analysis_runs(requested_by,status) values(auth.uid(),'running') returning id into v_id;
 return v_id;
exception when unique_violation then raise exception 'An analysis is already running'; end;
$$;
create or replace function public.finish_ai_analysis(p_run_id uuid,p_status text,p_updated_count integer default null,p_error_code text default null)
returns void language plpgsql security definer set search_path=''
as $$
begin
 if not public.is_admin() then raise exception 'Admins only'; end if;
 if p_status not in('completed','failed') then raise exception 'Invalid status'; end if;
 update public.ai_analysis_runs set status=p_status,finished_at=now(),updated_count=p_updated_count,error_code=left(p_error_code,80)
 where id=p_run_id and requested_by=auth.uid() and status='running';
end;
$$;

-- Function grants: only the narrow public API is executable.
revoke all on function public.submit_suggestion(text,boolean) from public,anon;
revoke all on function public.withdraw_suggestion(uuid) from public,anon;
revoke all on function public.get_community_suggestions() from public,anon;
revoke all on function public.admin_list_suggestions() from public,anon;
revoke all on function public.admin_update_suggestion(uuid,text,text,text,text) from public,anon;
revoke all on function public.get_active_polls() from public,anon;
revoke all on function public.toggle_interest(uuid) from public,anon;
revoke all on function public.get_visible_events() from public,anon;
revoke all on function public.toggle_event_attendance(uuid) from public,anon;
revoke all on function public.submit_event_feedback(uuid,integer,text,boolean) from public,anon;
revoke all on function public.begin_ai_analysis() from public,anon;
revoke all on function public.finish_ai_analysis(uuid,text,integer,text) from public,anon;
grant execute on function public.submit_suggestion(text,boolean),public.withdraw_suggestion(uuid),public.get_community_suggestions(),
 public.admin_list_suggestions(),public.admin_update_suggestion(uuid,text,text,text,text),public.get_active_polls(),public.toggle_interest(uuid),
 public.get_visible_events(),public.toggle_event_attendance(uuid),public.submit_event_feedback(uuid,integer,text,boolean),
 public.begin_ai_analysis(),public.finish_ai_analysis(uuid,text,integer,text) to authenticated;

-- Realtime no longer exposes complete vote/attendance identity rows to students.
-- The UI refreshes privacy-preserving RPC aggregates after mutations.

commit;

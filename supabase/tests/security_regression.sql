-- Catalog-level security regression checks. Run after the comprehensive migration.
-- Any failed assertion aborts the transaction.
begin;

do $$
declare n integer;
begin
  select count(*) into n from auth.users where email in('admin.demo@richfield.ac.za','student.demo@richfield.ac.za') or email like 'demo.student%@richfield-demo.local';
  if n<>0 then raise exception 'Shared demo identities still exist'; end if;

  select count(*) into n from pg_policies where schemaname='public' and tablename='votes' and qual='true';
  if n<>0 then raise exception 'Votes still have an open read policy'; end if;
  select count(*) into n from pg_policies where schemaname='public' and tablename='event_attendees' and qual='true';
  if n<>0 then raise exception 'Attendance still has an open read policy'; end if;
  select count(*) into n from pg_policies where schemaname='public' and tablename='suggestions' and policyname='read_clustered_suggestions';
  if n<>0 then raise exception 'Base suggestions still expose clustered rows'; end if;

  select count(*) into n from information_schema.routine_privileges
   where routine_schema='public' and routine_name in('submit_suggestion','toggle_interest','toggle_event_attendance','submit_event_feedback') and grantee='anon';
  if n<>0 then raise exception 'Anonymous role can execute an authenticated mutation'; end if;

  if not exists(select 1 from pg_indexes where schemaname='public' and indexname='one_running_ai_analysis') then
    raise exception 'AI concurrency lock is missing';
  end if;
  if not exists(select 1 from information_schema.tables where table_schema='public' and table_name='security_audit_log') then
    raise exception 'Security audit log is missing';
  end if;
end $$;

rollback;

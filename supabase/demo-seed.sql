-- Optional synthetic content seed.
-- This file never creates accounts, changes roles, exposes credentials, or
-- deletes existing data. Users must sign up normally and verify their email.
-- Run only after the comprehensive security migration.

begin;

do $$
declare
  v_admin uuid;
  v_student uuid;
  v_round uuid;
begin
  select id into v_admin from public.users where role='admin' order by created_at limit 1;
  select id into v_student from public.users where role='student' order by created_at limit 1;
  select id into v_round from public.suggestion_rounds where active limit 1;

  if v_admin is null or v_student is null or v_round is null then
    raise exception 'Create one verified admin, one verified student, and an active suggestion round before seeding synthetic content';
  end if;

  if not exists(select 1 from public.events) then
    insert into public.events(title,description,campus_scope,category,event_date,status,created_by) values
      ('Inter-Campus Sports Day','Synthetic portfolio data: soccer, netball and athletics across both campuses.','both','sports',now()+interval '24 days','upcoming',v_admin),
      ('Student Coding Showcase','Synthetic portfolio data: students demonstrate projects and meet local employers.','both','academic',now()+interval '16 days','upcoming',v_admin),
      ('Open Mic Night','Synthetic portfolio data: poetry, music and stand-up.','musgrave','cultural',now()+interval '9 days','upcoming',v_admin),
      ('Welcome Mixer','Synthetic portfolio data used to demonstrate post-event feedback.','umhlanga','social',now()-interval '12 days','past',v_admin);
  end if;

  if not exists(select 1 from public.suggestions) then
    insert into public.suggestions(text,campus,cluster_label,status,submitted_by,round_id,anonymous,category) values
      ('An inter-campus gaming tournament would be great.','umhlanga','Gaming Tournament','considering',v_student,v_round,false,'social'),
      ('Host a coding hackathon with local companies.','umhlanga','Coding Hackathon','review',v_student,v_round,true,'academic');
  end if;
end $$;

commit;

-- =====================================================================
-- demo-seed.sql  --  Populate the app with realistic demo data
-- =====================================================================
-- PURPOSE
--   Makes the deployed app "clickable for anyone": events, student
--   suggestions, votes, attendance and feedback across BOTH campuses, so
--   the dashboards, AI clustering and the trend chart all show real data.
--
-- HOW TO USE  (Supabase Dashboard -> SQL Editor)
--   1. First create the two demo login accounts via the app Sign-up page:
--          student.demo@richfield.ac.za   /  demo1234
--          admin.demo@richfield.ac.za     /  demo1234
--      (The "Explore as Student / SRC Admin" buttons on the login page sign
--       in with exactly these credentials.)
--   2. Run this whole file top-to-bottom. It is safe to re-run -- it wipes
--      previous demo content first.
--
-- WARNING: this DELETES all events/suggestions/votes/feedback. Only run it
--          on a demo database, not one with real data you care about.
-- =====================================================================

-- ---------- STEP 0: configure the two real demo logins ----------
-- The users table has a 'prevent_role_change' trigger that blocks role edits
-- unless the current session is an admin. In the SQL Editor auth.uid() is null,
-- so we briefly disable user triggers on this one table, update, then re-enable.
alter table public.users disable trigger users_no_self_role_change;
update public.users set role = 'admin',   campus = 'musgrave' where email = 'admin.demo@richfield.ac.za';
update public.users set role = 'student', campus = 'umhlanga' where email = 'student.demo@richfield.ac.za';
alter table public.users enable trigger users_no_self_role_change;

-- ---------- RESET: clear old demo content (safe to re-run) ----------
delete from public.feedback;
delete from public.event_attendees;
delete from public.votes;
delete from public.events;
delete from public.suggestions;
-- remove ghost demo students from a previous run (cascades to public.users)
delete from auth.users where email like 'demo.student%@richfield-demo.local';

-- ---------- STEP 1: ghost students (for realistic vote counts) ----------
-- These accounts never log in; they exist only so votes/feedback have
-- believable volume. Wrapped so that if your Supabase/GoTrue version rejects
-- the insert, the rest of the seed STILL runs (just with fewer voters).
do $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  select
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'demo.student' || g || '@richfield-demo.local',
    '$2a$10$CwTycUXWue0Thq9StjUM0uJ8e0/UoP3wQ3sH9bLOe5pZ.5K8mZpVe',
    now(), now() - (g || ' days')::interval, now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'full_name',
      (array['Thabo M','Aisha K','Lwazi N','Kyle P','Naledi R','Sma D','Riaan V',
             'Zanele B','Mpho S','Junaid A','Keagan L','Nomvula T','Sipho Z',
             'Ayesha H','Dineo M','Tyler J','Khanya O','Reshmi G','Bandile S',
             'Megan W','Sbu N','Yusuf E','Palesa K','Owethu D'])[g],
      'campus', case when g % 2 = 0 then 'musgrave' else 'umhlanga' end,
      'role', 'student'
    ),
    '', '', '', ''
  from generate_series(1, 24) as g
  on conflict do nothing;
exception when others then
  raise notice 'Skipped ghost students (%). Demo still works, just fewer voters.', sqlerrm;
end $$;

-- ---------- STEP 2: events (both campuses, all categories) ----------
insert into public.events (title, description, campus_scope, category, event_date, status, created_by)
select v.title, v.descr, v.scope, v.category, v.when_ts, v.status,
  coalesce(
    (select id from public.users where email = 'admin.demo@richfield.ac.za'),
    (select id from public.users order by random() limit 1)
  )
from (values
  ('Sports Day 2026',                'The one day both campuses come together. Soccer, netball, athletics and a food market.', 'both',     'sports',   now() + interval '24 days', 'upcoming'),
  ('Musgrave Open Mic Night',        'Poetry, acoustic sets and stand-up in the student lounge.',                              'musgrave', 'cultural', now() + interval '9 days',  'upcoming'),
  ('Umhlanga Coding Hackathon',      '12-hour build sprint, teams of 3. Pizza and prizes.',                                    'umhlanga', 'academic', now() + interval '16 days', 'upcoming'),
  ('Career & Internship Fair',       'Meet local employers hiring students and graduates.',                                    'both',     'academic', now() + interval '34 days', 'upcoming'),
  ('Inter-Campus Gaming Tournament', 'FIFA and Mortal Kombat brackets, Musgrave vs Umhlanga.',                                 'both',     'social',   now() + interval '5 days',  'upcoming'),
  ('First-Year Welcome Mixer',       'Icebreakers, music and free pizza for new students.',                                    'umhlanga', 'social',   now() - interval '12 days', 'past'),
  ('Heritage Day Showcase',          'Food, fashion and music celebrating our cultures.',                                      'both',     'cultural', now() - interval '26 days', 'past'),
  ('Study Skills Workshop',          'Exam prep, time management and note-taking session.',                                    'musgrave', 'academic', now() - interval '40 days', 'past'),
  ('5-a-side Soccer Cup',            'Postponed due to a venue clash, rescheduling TBC.',                                      'musgrave', 'sports',   now() + interval '11 days', 'cancelled')
) as v(title, descr, scope, category, when_ts, status);

-- ---------- STEP 3: suggestions (the demand signal) ----------
insert into public.suggestions (text, campus, category, cluster_label, status, anonymous, submitted_by, created_at)
-- submitted_by is NOT NULL, so anonymous ideas still need a real author.
-- The 'anonymous' flag (not a null author) is what hides the name in the UI.
select v.text, v.campus, v.category, v.cluster_label, v.status, v.anon,
  (select id from public.users where role = 'student' order by random() limit 1),
  now() - (floor(random() * 30) || ' days')::interval
from (values
  ('Can we get an inter-campus gaming tournament? FIFA and MK.',    'umhlanga', 'social',   'Gaming Tournament',  'considering', false),
  ('A proper open mic night for musicians and poets.',             'musgrave', 'cultural', 'Open Mic Night',     'approved',    false),
  ('Weekend hackathon for IT students with real prizes.',          'umhlanga', 'academic', 'Hackathon',          'approved',    false),
  ('More sports - a 5-a-side soccer league between campuses.',     'musgrave', 'sports',   'Soccer League',      'review',      false),
  ('Career fair with companies that actually hire students.',      'umhlanga', 'academic', 'Career Fair',        'approved',    false),
  ('A heritage day with food from different cultures.',            'musgrave', 'cultural', 'Heritage Showcase',  'approved',    false),
  ('Free mental-health and stress workshops during exams.',        'musgrave', 'academic', 'Wellness Workshops', 'considering', true),
  ('Netball tournament - the guys always get the sports events.',  'umhlanga', 'sports',   'Netball Tournament', 'submitted',   false),
  ('Movie night on the quad with a projector.',                    'musgrave', 'social',   'Movie Night',        'submitted',   false),
  ('Entrepreneurship talk from young local founders.',             'umhlanga', 'academic', null,                 'submitted',   false),
  ('Dance battle / amapiano social to close the term.',            'umhlanga', 'cultural', 'Amapiano Social',    'review',      false),
  ('Study group spaces that stay open late before exams.',         'musgrave', 'academic', null,                 'submitted',   true),
  ('A gaming lounge with consoles between lectures.',              'umhlanga', 'social',   'Gaming Tournament',  'considering', false),
  ('Charity 5km fun run with money going to a local shelter.',     'umhlanga', 'sports',   null,                 'submitted',   false)
) as v(text, campus, category, cluster_label, status, anon);

-- ---------- STEP 4: votes (interest signal) ----------
-- Each student is interested in a believable subset of suggestions,
-- weighted toward their own campus.
insert into public.votes (suggestion_id, user_id, vote_type)
select s.id, u.id, 'interested'
from public.suggestions s
join public.users u on u.role = 'student'
where (s.campus = u.campus or random() < 0.2)
  and random() < 0.55
on conflict do nothing;

-- ---------- STEP 5: attendance + feedback on real events ----------
insert into public.event_attendees (event_id, user_id)
select e.id, u.id
from public.events e
join public.users u on u.role = 'student'
where e.status <> 'cancelled'
  and (e.campus_scope = 'both' or e.campus_scope = u.campus)
  and random() < 0.45;

insert into public.feedback (event_id, user_id, rating, comment, did_attend)
select a.event_id, a.user_id,
  3 + floor(random() * 3)::int,
  (array['Loved it, would come again.','Really well organised.',
         'Great vibes, just wish it ran longer.','Good turnout from both campuses.',
         null, null])[1 + floor(random() * 6)::int],
  true
from public.event_attendees a
join public.events e on e.id = a.event_id
where e.status = 'past'
  and random() < 0.75
on conflict do nothing;

-- Done. Refresh the app -- dashboards, clustering and the trend chart now
-- have data, and the two demo login buttons work.

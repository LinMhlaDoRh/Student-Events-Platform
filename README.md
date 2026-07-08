# Richfield Student Events Platform

A web app that lets Richfield students propose the events they actually want, vote
on each other's ideas, and RSVP once the SRC turns the popular ones into real
events. It covers the Musgrave and uMhlanga campuses.

The idea started from a simple observation: attendance was low not because
students didn't want events, but because nobody was asking them what to run. So
the flow here is deliberately bottom-up - students suggest, the crowd signals
demand, and admins act on the signal instead of guessing.

- Live demo: https://student-events-platform.vercel.app
- Source: https://github.com/LinMhlaDoRh/Student-Events-Platform

## How it works

There are two roles.

**Students** can:
- submit a suggestion for their campus (optionally anonymously),
- browse the community board once suggestions have been grouped into themes,
- vote "I'm interested" on themes they'd show up for,
- RSVP to confirmed events and leave a rating afterwards.

**Admins** (the SRC) can:
- see every raw suggestion and the interest behind each theme,
- group related suggestions into a labelled cluster (there's an AI-assisted
  "Analyse Suggestions" button that does a first pass, which the admin then edits),
- promote a theme into a real event, set its campus scope and date,
- and read post-event feedback.

Raw suggestions from other students stay private until an admin has clustered
them. That keeps the public board tidy and stops it turning into an unmoderated
feed.

## Tech

- React + Vite on the front end, deployed on Vercel.
- Supabase for auth, Postgres, Row Level Security, and realtime.
- A single Supabase Edge Function that calls Google Gemini to do the suggestion
  clustering. The AI key never touches the browser - see below.

## Running it locally

You'll need Node 18+ and a Supabase project.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template and fill in your Supabase project values:
   ```bash
   cp .env.example .env
   ```
   Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` go in `.env`. Both are
   public by design; access is controlled by Row Level Security, not by hiding
   the anon key.
3. Set up the database (next section).
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Database setup

Run these in the Supabase SQL editor, in order. They're split by phase so each
step is easy to read and re-run; every file is safe to run more than once.

1. `supabase/phase1-auth.sql` - profile table, auth trigger, and role protection
2. `supabase/phase2-suggestions.sql` - suggestions table and its policies
3. `supabase/phase2-admin-read.sql` - lets admins read the full roster
4. `supabase/phase2-anonymous.sql` - adds the optional anonymous flag
5. `supabase/phase3-ai.sql` - adds the AI category column
6. `supabase/phase4-voting.sql` - votes
7. `supabase/phase5-events.sql` - events and RSVPs
8. `supabase/phase6-feedback.sql` - post-event feedback

The suggestions table has to exist before the anonymous and AI columns get added
to it, which is why phase2-suggestions comes before those two.

Optional:
- `supabase/demo-seed.sql` populates two demo accounts and sample data for a
  walkthrough. Don't run it against real data - it wipes the content tables first.
- `supabase/security-hardening.sql` is only for a database that was built from an
  earlier version of these scripts. A fresh setup already includes everything in
  it. See SECURITY.md for what it does and why.

### Creating your first admin

New accounts are always created as students - that's a security decision, not an
oversight (see SECURITY.md). To make yourself an admin, run this once in the SQL
editor, which briefly lifts the role-change guard for a single update:

```sql
alter table public.users disable trigger users_no_self_role_change;
update public.users set role = 'admin' where email = 'you@richfield.ac.za';
alter table public.users enable trigger users_no_self_role_change;
```

Then sign out and back in so the app reloads your role.

## AI clustering

The "Analyse Suggestions" button calls a Supabase Edge Function
(`supabase/functions/cluster-suggestions`) which batches the un-clustered
suggestions into one Gemini call and returns suggested groupings. The function
verifies the caller is a signed-in admin before doing anything, and the Gemini
key is stored as a server-side Edge Function secret. Full setup is in
`supabase/AI_SETUP.md`.

## Project layout

```
src/
  pages/            student and admin pages (routed in App.jsx)
  components/        shared UI, cards, icons
  lib/               useProfile hook and helpers
  supabaseClient.js  the configured Supabase client
supabase/
  phase*.sql         database schema, one file per phase
  security-hardening.sql   apply security fixes to an older database
  demo-seed.sql      optional demo data
  functions/         the cluster-suggestions Edge Function
  AI_SETUP.md        how to deploy the Edge Function and set the Gemini secret
```

Other docs worth reading: `SECURITY.md` for the security model, `BUILD_GUIDE.md`
for how the project was built phase by phase, and `TESTING_GUIDE.md` /
`MANUAL_TESTS.md` for the test checklist.

## Author

Built by Linda (https://github.com/LinMhlaDoRh) as a Richfield project.

# Build Guide - Student Events Platform

> Stack: React + Vite - Supabase - Gemini API - Vercel
> Read the concept doc first: `STUDENT_EVENTS_PLATFORM.md`

---

## Before You Write a Single Line of Code

Lock these decisions or you will rebuild later:

- [ ] What is the suggestion threshold? (recommended: 5 unique suggestions)
- [ ] One SRC admin for both campuses, or one per campus?
- [ ] How is attendance tracked in v1? (recommendation: self-report checkbox, upgrade later)
- [ ] Who owns the Supabase and Vercel accounts long-term?

---

## Accounts to Create First

| Service | URL | What It Does |
|---|---|---|
| GitHub | github.com | Version control - every step gets committed |
| Supabase | supabase.com | Database + Auth + API |
| Vercel | vercel.com | Hosting (connect to GitHub repo) |
| Google AI Studio | aistudio.google.com | Get your free Gemini API key |

---

## Phase 0 - Project Setup

**Goal:** Repo exists, tools installed, app runs locally.

### Steps
1. Create a GitHub repository - name it `student-events-platform`
2. Clone it locally
3. Inside the repo, run: `npm create vite@latest . -- --template react`
4. Run `npm install` then `npm run dev` - confirm it opens in browser
5. Install Supabase client: `npm install @supabase/supabase-js`
6. Create a `.env` file in the root - add your Supabase URL and anon key (get these from your Supabase project settings)
7. Add `.env` to `.gitignore` - never commit your keys

### What to look for
- App loads at `localhost:5173` without errors
- `.env` is in `.gitignore` before your first commit

---

## Phase 1 - Authentication (Testing Version)

**Goal:** Students can sign up and log in. Role (student/admin) and campus are assigned.
**Testing auth:** Any email works. No Richfield restriction yet.

### Supabase Setup
1. In Supabase dashboard -> Authentication -> enable Email provider
2. Turn off "Confirm email" for testing (Settings -> Auth -> disable email confirmation)
3. Create a `profiles` table in Supabase:

```sql
create table profiles (
  id uuid references auth.users on delete cascade,
  email text,
  role text check (role in ('student', 'admin')) default 'student',
  campus text check (campus in ('Musgrave', 'uMhlanga')),
  created_at timestamp default now(),
  primary key (id)
);
```

4. Set up a trigger so a profile row is created automatically when a user signs up

### React Steps
1. Build a `/signup` page - fields: email, password, campus (dropdown: Musgrave / uMhlanga)
2. Build a `/login` page
3. On signup, write the profile row to Supabase with role = `student`
4. Store the session in React context or Zustand
5. Create a protected route - if not logged in, redirect to `/login`
6. Hard-code one account as admin for now (update the role in Supabase directly)

### What to look for
- User signs up -> row appears in `profiles` table in Supabase
- Login persists on page refresh
- Non-logged-in users cannot access the app
- Admin and student see different navigation options

### Auth upgrade (do this last, before launch)
- Add a check on signup: email must end with `@richfield.ac.za`
- One line of validation before calling Supabase signup

---

## Phase 2 - Database Schema

**Goal:** All tables exist before building features.
Build the full schema now. Do not add tables mid-feature - it breaks things.

```sql
-- Suggestions submitted by students
create table suggestions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  campus text,
  text text not null,
  cluster_group text,       -- filled by AI later
  category text,            -- filled by AI later
  created_at timestamp default now()
);

-- Events promoted by admin from clusters
create table events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  campus_scope text check (campus_scope in ('Musgrave', 'uMhlanga', 'Both')),
  status text check (status in ('poll', 'confirmed', 'past')) default 'poll',
  event_date date,
  created_by uuid references profiles(id),
  created_at timestamp default now()
);

-- Votes on events
create table votes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  event_id uuid references events(id),
  vote_type text check (vote_type in ('interested', 'will_attend')),
  created_at timestamp default now(),
  unique (user_id, event_id)   -- one vote per student per event
);

-- Post-event feedback
create table feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  event_id uuid references events(id),
  rating int check (rating between 1 and 5),
  comment text,
  attended boolean,
  created_at timestamp default now(),
  unique (user_id, event_id)
);
```

### What to look for
- All tables created without errors in Supabase SQL editor
- Foreign keys are correct - test by inserting a row manually
- The `unique` constraint on votes is critical - without it, one student votes multiple times

---

## Phase 3 - Suggestion System

**Goal:** Students submit event ideas. Ideas are stored. Admin can view them.

### Steps
1. Build a suggestion form - one text area, submit button
2. On submit, write to `suggestions` table with `user_id` and `campus` from session
3. Build an admin view - table of all suggestions, sortable by campus and date
4. Add a character limit on suggestions (recommended: 200 characters max)

### What to look for
- Suggestion appears in Supabase immediately after submit
- Student cannot see other students' user IDs (check Supabase Row Level Security)
- Empty submissions are blocked - validate before sending to DB

---

## Phase 4 - AI Clustering

**Goal:** Similar suggestions are grouped. Admin sees a clean chart, not 80 raw text entries.

### How to call the AI (batch, not per suggestion)

```javascript
// Call this once - pass ALL suggestions at once
async function clusterSuggestions(suggestions) {
  const prompt = `
    You are given a list of student event suggestions.
    Group them into clusters where similar ideas are combined.
    For each cluster, give it a short title and a category 
    (Sports, Social, Academic, Cultural, Other).
    Return only valid JSON in this format:
    [
      {
        "cluster_title": "...",
        "category": "...",
        "suggestions": ["...", "..."]
      }
    ]
    Suggestions: ${JSON.stringify(suggestions)}
  `;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + import.meta.env.VITE_GEMINI_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await response.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}
```

### Steps
1. Add a "Run Clustering" button in the admin dashboard
2. Fetch all suggestions from Supabase
3. Send to Gemini, get clusters back
4. Update each suggestion row with its `cluster_group` and `category`
5. Display result as a bar chart (use Recharts - already available in React)

### What to look for
- Gemini returns valid JSON - if it doesn't, add error handling that retries once
- Strip any markdown code fences from the response before parsing JSON
- The chart renders correctly with real data before moving on
- API key is in `.env`, never hardcoded

---

## Phase 5 - Polling and Voting

**Goal:** Admin promotes a cluster to a poll. Students vote. Counts are public.

### Steps
1. Admin clicks "Create Poll" on a cluster -> creates a row in `events` table with `status = 'poll'`
2. Build a `/events` page - shows all active polls, filterable by campus
3. Each event card shows:
   - Event title and description
   - `Interested` count
   - `Will Attend` count
   - Two buttons: `Interested` / `I Will Attend`
4. On vote, write to `votes` table
5. Show live counts - fetch from Supabase on load
6. If student already voted, show their current vote and allow them to change it (update the row, do not insert)

### What to look for
- The `unique` constraint prevents double votes - test this manually
- Counts update correctly after voting
- Student from Musgrave cannot vote on a Musgrave-only event if they are from uMhlanga

---

## Phase 6 - Event Confirmation

**Goal:** Admin confirms a polled event. It becomes a real event with a date.

### Steps
1. Admin dashboard shows all polls with vote counts
2. Admin clicks "Confirm Event" -> adds `event_date` and sets `status = 'confirmed'`
3. Confirmed events appear on a separate `/confirmed` page
4. Events page shows countdown or date for confirmed events

### What to look for
- Status transition is one-way: `poll` -> `confirmed` -> `past`
- Students can still see vote counts on confirmed events

---

## Phase 7 - Post-Event Feedback

**Goal:** After an event, collect did you attend + rating.

### Steps
1. Cron job or manual admin action sets `status = 'past'` after event date passes
2. Students who voted `will_attend` get a prompt when they log in: "Did you attend [Event]?"
3. Feedback form: attended (yes/no), rating (1-5), optional comment
4. Admin dashboard shows: committed count vs actual attended count

### What to look for
- Feedback form only shows for past events
- A student cannot submit feedback twice (unique constraint on feedback table)
- The gap between `will_attend` votes and actual `attended` is the key metric - display it clearly

---

## Phase 8 - Admin Dashboard

**Goal:** One page where SRC admin sees everything.

### What to include
- Total suggestions this cycle, by campus
- Cluster chart (category breakdown)
- Active polls with vote counts
- Confirmed upcoming events
- Past events: committed vs attended gap
- Button to run AI clustering
- Button to export summary (CSV or copy-paste for sharing with school management)

### What to look for
- Dashboard loads fast - if queries are slow, add indexes to Supabase tables
- Admin cannot accidentally delete an event with existing votes without a confirmation dialog

---

## Phase 9 - Deploy

**Goal:** Live on the internet, not just localhost.

### Steps
1. Push all code to GitHub
2. Go to Vercel -> import your GitHub repo
3. Add your environment variables in Vercel (same as your `.env` file)
4. Deploy - Vercel gives you a live URL
5. Test signup, login, suggestion, vote on the live URL with a real phone

### What to look for
- Environment variables are set in Vercel, not in the code
- Test on mobile - most students will use phones
- Check that Supabase Row Level Security (RLS) is enabled on all tables before going live

---

## Phase 10 - Auth Upgrade (Before Real Launch)

**Goal:** Only Richfield students can sign up.

### One change in your signup function
```javascript
if (!email.endsWith('@richfield.ac.za')) {
  setError('You must use your Richfield email to sign up.');
  return;
}
```

That is the only change needed. Everything else stays the same.

---

## Build Order Summary

| Phase | What You Build | Dependency |
|---|---|---|
| 0 | Project setup | Nothing |
| 1 | Auth (testing) | Phase 0 |
| 2 | Database schema | Phase 1 |
| 3 | Suggestion system | Phase 2 |
| 4 | AI clustering | Phase 3 |
| 5 | Polling + voting | Phase 4 |
| 6 | Event confirmation | Phase 5 |
| 7 | Post-event feedback | Phase 6 |
| 8 | Admin dashboard | Phases 3-7 |
| 9 | Deploy | Phase 8 |
| 10 | Real auth | Phase 9 |

**Do not skip phases. Do not build Phase 5 before Phase 3 works.**

---

## Things That Will Go Wrong (Read This Now)

| Problem | What It Is | Fix |
|---|---|---|
| Supabase RLS blocks all reads | Row Level Security is on by default - your queries return nothing | Add RLS policies for each table |
| Gemini returns JSON with markdown fences | Response is ` ```json {...} ``` ` not `{...}` | Strip ` ```json ` and ` ``` ` before parsing |
| Votes count wrong | Student voted twice because unique constraint was missing | Add unique constraint on (user_id, event_id) in votes table - do this in Phase 2 |
| Env variables not loading on Vercel | Forgot to add them in Vercel dashboard | Add them under Project Settings -> Environment Variables |
| App works on desktop, broken on mobile | CSS not responsive | Test on mobile at the end of every phase |

---

*Build guide - update this as decisions change.*

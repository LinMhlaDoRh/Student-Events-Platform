# Student Events Platform — Build Guide

> Stack: React + Vite · Supabase · Vercel · Gemini 1.5 Flash (free tier)  
> Scope: <500 users · 2 campuses · 1 SRC admin

---

## Accounts to Create First (Free)

Before writing a single line of code, set these up:

| Service | What It Does | Link |
|---|---|---|
| Supabase | Database + Auth + API | supabase.com |
| Vercel | Hosting (deploys from GitHub) | vercel.com |
| Google AI Studio | Gemini API key (free tier) | aistudio.google.com |
| GitHub | Version control | github.com |

---

## Database Schema — Design This Before Coding

Draw this on paper first. Understand what connects to what.

```
users
  - id
  - email
  - full_name
  - campus          (musgrave | umhlanga)
  - role            (student | admin)
  - created_at

events
  - id
  - title
  - description
  - campus_scope    (musgrave | umhlanga | both)
  - category        (sports | social | academic | cultural | other)
  - status          (upcoming | past | cancelled)
  - event_date
  - created_by      → users.id
  - created_at

suggestions
  - id
  - text            (raw free text from student)
  - campus          (which campus the student is from)
  - cluster_label   (filled in by AI after clustering)
  - submitted_by    → users.id
  - created_at

votes
  - id
  - suggestion_id   → suggestions.id
  - user_id         → users.id
  - vote_type       (interested | will_attend)
  - created_at

feedback
  - id
  - event_id        → events.id
  - user_id         → users.id
  - rating          (1–5)
  - comment
  - did_attend      (true | false)
  - created_at
```

**What to look for:** Each table connects through IDs. If you skip this design step and code first, you will rebuild the database at least twice.

---

## Phase 0 — Project Setup

```bash
npm create vite@latest events-platform -- --template react
cd events-platform
npm install
npm install @supabase/supabase-js
```

Create a `.env` file at root:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create `src/supabaseClient.js`:
```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

Push to GitHub. Connect GitHub repo to Vercel. Every push to main deploys automatically.

**What to look for:** Never commit your `.env` file. Add it to `.gitignore` immediately.

---

## Phase 1 — Authentication (Testing Phase)

Use Supabase email/password auth. During testing, any email works.  
When going live, restrict to Richfield student emails only (one config change).

### What to build:
- Sign up page (email, password, full name, campus selection)
- Login page
- Protected routes — pages only logged-in users can see
- Role check — admin sees different UI than student

### In Supabase:
- Enable Email/Password auth in the Auth settings
- Create a `users` table linked to `auth.users`
- Use a Supabase trigger to auto-create a user profile on sign-up

### Switching to Richfield Auth later:
In Supabase Auth settings → Email → add domain restriction `@richfield.ac.za`  
That is the only change needed.

**What to look for:**
- Row Level Security (RLS) must be enabled on every table in Supabase. Without it, any logged-in user can read or edit anyone's data. Turn it on. Write policies that say who can read and write what.
- Test that a student cannot access admin routes. Do this early, not at the end.

---

## Phase 2 — Suggestion Submission

### What to build:
- A form where students type a free-text event idea
- Submissions stored in the `suggestions` table with campus + user info
- Student can see their own past suggestions

### What to look for:
- Limit one suggestion per user per suggestion round (otherwise one person floods the list)
- Do not show raw suggestions to other students yet — only admin sees the raw list before clustering

---

## Phase 3 — AI Clustering (Gemini 1.5 Flash)

This is the step that turns "100 different things students typed" into "8 actual ideas."

### How it works:
1. Admin clicks "Analyse Suggestions"
2. Your app sends all raw suggestion texts to Gemini API
3. Gemini returns grouped clusters with a label for each group
4. You save the `cluster_label` back to each suggestion row
5. Display results as a table or bar chart

### Gemini API call (run from your backend or a Supabase Edge Function):
```js
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are grouping student event suggestions. 
                 Group the following suggestions into clusters where similar ideas are together.
                 Return only JSON: [{ "label": "cluster name", "suggestions": ["...", "..."] }]
                 
                 Suggestions:
                 ${suggestions.map((s, i) => `${i + 1}. ${s.text}`).join('\n')}`
        }]
      }]
    })
  }
)
```

**What to look for:**
- Gemini free tier: 15 requests per minute, 1500 per day. At your scale this is more than enough.
- Always call Gemini from a server-side function (Supabase Edge Function), never directly from the browser. If you call it from the browser, your API key is exposed to anyone who opens DevTools.
- Parse the JSON Gemini returns carefully — it sometimes wraps it in markdown code blocks. Strip those before parsing.

---

## Phase 4 — Voting

### What to build:
- A poll page showing clustered event ideas (post-clustering)
- Each idea shows two buttons: `Interested` and `I Will Attend`
- A student can only vote once per idea per type
- Counts are public and update in real time (Supabase has real-time built in)

### What to look for:
- Prevent double voting — add a unique constraint in Supabase on `(suggestion_id, user_id, vote_type)`
- Show both counts separately. Do not combine them. The gap between "interested" and "will attend" is the information admin needs.
- Real-time updates: use Supabase's `supabase.channel()` to subscribe to vote count changes

---

## Phase 5 — Admin Dashboard

### What to build:
- View all raw suggestions
- Trigger AI clustering
- View clustered results + vote counts
- Confirm an event (moves it to the `events` table with a status of `upcoming`)
- Set campus scope: Musgrave only / uMhlanga only / Both
- Add or delete events manually
- View post-event feedback

### What to look for:
- Admin role check must happen server-side (in Supabase RLS policy), not just in the UI. Hiding a button is not security.
- There is one admin (SRC). Build the dashboard for one person, not a team.

---

## Phase 6 — Events Page (Student View)

### What to build:
- List of confirmed upcoming events
- Campus filter (show my campus / show both)
- Each event shows committed attendance count
- Students can mark themselves as attending (links to their vote)
- Past events visible with feedback option

---

## Phase 7 — Post-Event Feedback

### What to build:
- After event date passes, a feedback prompt appears for students who marked attendance
- Rating (1–5) + optional comment + "did you actually attend?" checkbox
- Admin sees aggregate results per event

---

## Phase 8 — Deploy and Test

1. Make sure `.env` variables are added to Vercel (Settings → Environment Variables)
2. Test with 5–10 real students before opening to both campuses
3. Check Supabase free tier limits: 500MB database, 50MB file storage, 2GB bandwidth — fine for <500 users
4. Check that Supabase project does not go inactive — **free tier pauses after 1 week of no activity**. Keep it alive during testing or upgrade to a paid plan before go-live.

---

## Build Order Summary

| Phase | What You Build | Depends On |
|---|---|---|
| 0 | Project setup + Supabase connection | Nothing |
| 1 | Auth (sign up, login, roles, route protection) | Phase 0 |
| 2 | Suggestion submission form | Phase 1 |
| 3 | AI clustering + results chart | Phase 2 |
| 4 | Voting (Interested / Will Attend) | Phase 3 |
| 5 | Admin dashboard | Phases 1–4 |
| 6 | Events page (student view) | Phase 5 |
| 7 | Post-event feedback | Phase 6 |
| 8 | Deploy + test with real users | All |

Do not skip phases. Phase 1 (auth + roles) is the foundation. Everything downstream depends on knowing who the user is and what they are allowed to do.

---

## Things That Will Catch You

| Trap | What Happens | How to Avoid |
|---|---|---|
| Skipping RLS | Any user can query any data | Enable RLS on every table, day one |
| API key in frontend code | Gemini key exposed publicly | Always call AI from server/edge function |
| No double-vote prevention | Students vote 10 times | Unique DB constraint on votes table |
| Not testing mobile | Students use phones, not laptops | Check every UI on a phone browser from the start |
| Supabase free tier pause | App goes offline after inactivity | Ping the project regularly or upgrade before launch |
| Building features before auth | You rebuild everything to add user context | Auth first, always |

---

*This is a living document. Update it as decisions change.*

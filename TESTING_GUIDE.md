# Student Events Platform — Testing Guide

> Rule: Do not move to the next phase until every check in the current phase passes.  
> Tools you need open while testing: Browser · Browser DevTools (F12) · Supabase Dashboard

---

## Phase 0 — Project Setup

### What you're verifying
The skeleton runs, Supabase is connected, and nothing sensitive is exposed.

### Checks

**Local:**
- [ ] `npm run dev` starts without errors
- [ ] Browser opens `localhost:5173` and shows something (even a blank page is fine)
- [ ] No red errors in the terminal

**Supabase connection:**
- [ ] Open browser DevTools → Console tab
- [ ] Add this temporarily to your app and check the console output:
  ```js
  import { supabase } from './supabaseClient'
  console.log(supabase)
  ```
- [ ] Should print a Supabase client object, not an error
- [ ] Remove the console log after confirming

**Security:**
- [ ] Open your GitHub repo — confirm `.env` file is NOT visible
- [ ] Open `.gitignore` — confirm `.env` is listed there

**Vercel deploy:**
- [ ] Push to GitHub main branch
- [ ] Vercel builds without errors
- [ ] Live URL opens without crashing

**You can move on when:** App loads locally and on Vercel, Supabase connects, `.env` is not on GitHub.

---

## Phase 1 — Authentication

### What you're verifying
Users can sign up and log in, roles work correctly, and protected pages are actually protected.

### Checks

**Sign up:**
- [ ] Fill in the sign-up form and submit
- [ ] Check Supabase Dashboard → Authentication → Users — your new user appears there
- [ ] Check Supabase Dashboard → Table Editor → `users` table — a profile row was created with the correct campus and role
- [ ] Try signing up with the same email twice — should show an error, not create a duplicate

**Login:**
- [ ] Log out, then log back in with correct credentials — succeeds
- [ ] Try logging in with a wrong password — shows an error message, does not log in

**Route protection:**
- [ ] Log out completely
- [ ] Manually type the URL of a protected page (e.g. `/dashboard`) in the browser
- [ ] Should redirect you to the login page, not show the page

**Role separation:**
- [ ] Log in as a student account
- [ ] Manually type the admin URL (e.g. `/admin`) in the browser
- [ ] Should be blocked — either redirect or show "not authorised"
- [ ] Log in as the admin account
- [ ] Admin dashboard is accessible

**What to look for:**
- If the admin page loads for a student, your role check is only in the UI (hiding a button is not enough). The Supabase RLS policy for admin-only tables must also block the student. Test this by opening DevTools → Network tab → look for Supabase API calls — they should return empty data or an error for a student hitting admin data.

**You can move on when:** Sign up, login, logout all work. Students cannot reach admin routes or admin data.

---

## Phase 2 — Suggestion Submission

### What you're verifying
Students can submit suggestions, data is stored correctly, and boundaries hold.

### Checks

**Submission:**
- [ ] Log in as a student
- [ ] Submit a suggestion via the form
- [ ] Check Supabase → `suggestions` table — row appears with:
  - Correct `text`
  - Correct `campus` (matches the student's campus)
  - Correct `submitted_by` (matches the student's user ID)
  - `cluster_label` is empty (not yet clustered)

**Blocked cases:**
- [ ] Log out, go to the suggestion form URL directly — should redirect to login
- [ ] Submit a blank/empty suggestion — should show a validation error, not save a blank row

**Duplicate prevention:**
- [ ] Submit two suggestions from the same account in the same round
- [ ] Decide your rule here: is the second blocked, or allowed? Whatever you decide, test that it behaves consistently

**Admin visibility:**
- [ ] Log in as admin
- [ ] Go to admin dashboard → suggestions view
- [ ] All submissions from both campuses are visible
- [ ] A student going to that same admin view is blocked

**You can move on when:** Suggestions save correctly with all fields, logged-out users are blocked, admin sees all submissions.

---

## Phase 3 — AI Clustering

### What you're verifying
Gemini receives the suggestions, returns valid clusters, and the results are saved and displayed correctly.

### Setup before testing
Add at least 8–10 varied suggestions first (you can do this manually in the Supabase table editor for testing). Include:
- Some that mean the same thing written differently (e.g. "braai," "outdoor cookout," "fire and food")
- Some clearly different ideas (e.g. "gaming tournament," "movie night," "campus cleanup")

### Checks

**API call:**
- [ ] Admin clicks "Analyse Suggestions"
- [ ] Open DevTools → Network tab — look for the call to your Supabase Edge Function
- [ ] The call returns a 200 status (not 401, 403, or 500)

**Clustering result:**
- [ ] Check Supabase → `suggestions` table — `cluster_label` column is now filled in for all rows
- [ ] Similar suggestions have the same `cluster_label`
- [ ] Different ideas have different labels

**Display:**
- [ ] Chart or table renders in the admin dashboard showing cluster groups and their counts
- [ ] No blank screen or crash after clustering

**Edge cases to test:**
- [ ] What happens if there are only 2 suggestions? Does it crash or handle it gracefully?
- [ ] What happens if Gemini's response cannot be parsed? Should show an error message, not a crash

**What to look for:**
- Open DevTools → Console — if Gemini returns JSON wrapped in markdown like ` ```json ... ``` `, your parser will break. Check that you strip those before `JSON.parse()`.
- If you get a 403 from the Edge Function, your Supabase function permissions are wrong — only admin should be able to call it.

**You can move on when:** Clustering runs, labels are saved to the database, results display correctly, it does not crash on small input.

---

## Phase 4 — Voting

### What you're verifying
Students vote correctly, double voting is blocked, counts are accurate, and real-time updates work.

### Checks

**Voting:**
- [ ] Log in as a student
- [ ] Vote "Interested" on a clustered suggestion
- [ ] Check Supabase → `votes` table — row appears with correct `user_id`, `suggestion_id`, and `vote_type = interested`
- [ ] Vote "I Will Attend" on the same suggestion
- [ ] Two rows exist — one for each vote type

**Double vote prevention:**
- [ ] Vote "Interested" on the same suggestion a second time
- [ ] Should be blocked — check Supabase, only one `interested` row for that user + suggestion combination
- [ ] If it is not blocked, go to Supabase → Table Editor → `votes` table → Indexes → add a unique constraint on `(suggestion_id, user_id, vote_type)`

**Counts:**
- [ ] Create two test accounts (student A and student B)
- [ ] Both vote "Will Attend" on the same suggestion
- [ ] The displayed count shows 2, not 1

**Real-time:**
- [ ] Open the poll page in two browser tabs (different accounts)
- [ ] Vote in one tab
- [ ] The count updates in the other tab without refreshing

**Blocked cases:**
- [ ] Log out
- [ ] Try to vote (manually hit the button or the URL) — should redirect to login

**You can move on when:** Votes save correctly, double voting is blocked at the database level, counts are accurate, real-time updates work.

---

## Phase 5 — Admin Dashboard

### What you're verifying
Admin has full visibility and control. Students have none of it.

### Checks

**Visibility:**
- [ ] All raw suggestions visible with campus label
- [ ] Clustered results visible with vote counts (both Interested and Will Attend shown separately)
- [ ] The gap between the two counts is visible

**Confirm an event:**
- [ ] Admin confirms a clustered idea as an event
- [ ] Check Supabase → `events` table — new row appears with:
  - Correct `title`
  - Status = `upcoming`
  - Correct `campus_scope` (musgrave / umhlanga / both)
- [ ] Event appears on the student-facing events page

**Campus scope:**
- [ ] Set an event to Musgrave only
- [ ] Log in as a uMhlanga student — the event should not appear for them
- [ ] Set an event to Both
- [ ] Both campus students can see it

**Delete an event:**
- [ ] Admin deletes an event
- [ ] It disappears from the events page
- [ ] Check Supabase — row is removed (or status changed to cancelled, whichever you chose)

**Access control:**
- [ ] Log in as a student
- [ ] Try to access `/admin` — blocked
- [ ] Open DevTools → Network — Supabase queries for admin data return no rows or a policy error for the student account

**You can move on when:** Admin can see, confirm, scope, and delete events. Students are fully blocked from all admin data and routes.

---

## Phase 6 — Events Page (Student View)

### What you're verifying
Students see the right events for their campus, commitment counts are visible, and the page works on mobile.

### Checks

**Filtering:**
- [ ] Log in as a Musgrave student
- [ ] Only Musgrave and cross-campus events appear — no uMhlanga-only events
- [ ] Log in as a uMhlanga student
- [ ] Same logic applies in reverse

**Attendance count:**
- [ ] An event with 3 "Will Attend" votes shows count as 3
- [ ] Count updates when a new student commits

**Mobile:**
- [ ] Open the events page on your phone (or DevTools → Toggle device toolbar)
- [ ] Everything is readable without horizontal scrolling
- [ ] Buttons are large enough to tap

**You can move on when:** Campus filtering is correct, counts display, page is usable on mobile.

---

## Phase 7 — Post-Event Feedback

### What you're verifying
Feedback only appears after an event has passed and is stored correctly.

### Checks

**Trigger:**
- [ ] Set a test event's `event_date` to yesterday in Supabase directly
- [ ] Log in as a student who marked attendance
- [ ] Feedback prompt appears for that event
- [ ] An upcoming event does NOT show a feedback prompt

**Submission:**
- [ ] Submit feedback (rating + comment + did you attend)
- [ ] Check Supabase → `feedback` table — row saved with correct `event_id`, `user_id`, rating, and `did_attend` value

**Admin view:**
- [ ] Log in as admin
- [ ] Navigate to the past event
- [ ] See aggregate feedback (average rating, attendance count, comments)

**You can move on when:** Feedback only appears for past events, data saves correctly, admin sees results.

---

## Phase 8 — Deploy and Pre-Launch

### What you're verifying
Everything that worked locally also works in production, on real devices.

### Checks

**Environment:**
- [ ] Go to Vercel → Settings → Environment Variables
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- [ ] `GEMINI_API_KEY` is set (if calling from Vercel functions) or in Supabase Edge Function secrets
- [ ] Redeploy after adding env variables

**Full flow test on the live URL (not localhost):**
- [ ] Sign up as a new student on the live site
- [ ] Submit a suggestion
- [ ] Log in as admin, run clustering, confirm an event
- [ ] Log back in as student, vote, commit to attend
- [ ] Check all data appears correctly in Supabase dashboard

**Multi-device:**
- [ ] Test on an Android phone (Chrome)
- [ ] Test on an iPhone if possible (Safari)
- [ ] Test on a laptop browser
- [ ] No layout breaks on any of them

**Supabase inactivity:**
- [ ] Note the date of your last activity
- [ ] Supabase free tier pauses after 7 days of no requests
- [ ] Before any demo or launch, open the Supabase dashboard and confirm the project is active

**Final security pass:**
- [ ] Open the live site, log out
- [ ] Try every protected URL manually — all redirect to login
- [ ] Open DevTools → Network on the live site — no API keys visible in any request headers or response

**You are ready to test with real users when:** The full flow works on the live URL, mobile works, no keys are exposed, Supabase is active.

---

## Testing With Real Users (Small Group First)

Before opening to both campuses:

1. Pick 5–10 students you know personally — mix of both campuses
2. Give them the live URL and no instructions — watch where they get confused
3. Ask them to complete one full flow: sign up → suggest → vote
4. Watch the Supabase dashboard in real time as they use it
5. Fix what breaks before opening wider

---

## Quick Reference — What Each Phase Proves

| Phase | Passing Means |
|---|---|
| 0 | App runs, Supabase connects, secrets are safe |
| 1 | Only the right people can access the right things |
| 2 | Suggestions reach the database accurately |
| 3 | AI clusters correctly and saves results |
| 4 | Votes are unique, counted correctly, and live |
| 5 | Admin has full control, students have none |
| 6 | Students see only what they should, on any device |
| 7 | Feedback is time-gated and stored correctly |
| 8 | Production matches local, real users can use it |

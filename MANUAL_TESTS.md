# Manual Test Script - Richfield Student Events Platform

Run these against the **deployed** site after completing the setup
(`supabase/AI_SETUP.md`). Tick each box. If a result doesn't match, note the
exact on-screen message and send it over.

---

## 0. Before you start (prerequisites)

- [ ] SQL run in Supabase: `phase1-auth.sql`, `phase2-admin-read.sql`, `phase2-anonymous.sql`, `phase3-ai.sql`
- [ ] Edge Function `cluster-suggestions` deployed, with `GEMINI_API_KEY` secret set
- [ ] App deployed to Vercel with Supabase URL + anon key env vars set
- [ ] You have **3 test logins**:
  - Student A - campus **Musgrave**
  - Student B - campus **uMhlanga**
  - Admin (a user whose `role` = `admin` in the `users` table)

> Tip: to make an admin, run in Supabase SQL editor:
> `update public.users set role='admin' where email='you@richfield.ac.za';`

---

## 1. Smoke test

| Step | Do this | Expected |
|---|---|---|
| 1.1 | Open the live URL | Sign-in page loads, no blank screen |
| 1.2 | Open browser dev console (F12) | No red errors on load |

- [ ] 1.1 passed
- [ ] 1.2 passed

---

## 2. Authentication & branding

| Step | Do this | Expected |
|---|---|---|
| 2.1 | Look at the Sign in page | Brand reads **"Richfield Events"** (not "Campus Events") |
| 2.2 | Sign in with a **wrong** password | Error appears in a **red** box |
| 2.3 | Click **Forgot password**, enter your email, submit | Confirmation appears in a **green / success** box (not red) |
| 2.4 | Go to Sign up page | Brand also reads **"Richfield Events"** |
| 2.5 | Sign up a new student, pick a campus | Account is created and you land in the app |
| 2.6 | Sign in as Student A | Lands on the student Dashboard |

- [ ] 2.1  - [ ] 2.2  - [ ] 2.3  - [ ] 2.4  - [ ] 2.5  - [ ] 2.6

---

## 3. Student top bar & navigation (the fix)

| Step | Do this | Expected |
|---|---|---|
| 3.1 | Look at the **top-right** of the student pages | Campus badge, **"Suggest an Event"** button, and your **avatar initials** (e.g. "SM") are all pinned to the right |
| 3.2 | Look at the top bar | There is **no** horizontal text menu across the top |
| 3.3 | Look at the left side | Navigation lives in the **sidebar** (Home, Suggest, Active Polls, Events, My Profile) |
| 3.4 | Click each sidebar link | Each page opens; the active link is highlighted |
| 3.5 | Confirm "Suggest an Event" appears **once** | Only the top-right button (no duplicate) |

- [ ] 3.1  - [ ] 3.2  - [ ] 3.3  - [ ] 3.4  - [ ] 3.5

---

## 4. Suggestions + Anonymous mode

| Step | Do this | Expected |
|---|---|---|
| 4.1 | As Student A, go to **Suggest an Event** | Form loads with a text box + **"Submit anonymously"** toggle |
| 4.2 | Type an idea, leave toggle **off**, submit | Success toast; idea appears under **"Your submissions"** |
| 4.3 | Try to submit a second idea this round | Blocked with "already shared an idea this round" notice |
| 4.4 | Withdraw your submission | It disappears from "Your submissions" |
| 4.5 | Submit a new idea with toggle **ON** (anonymous) | Submits successfully |
| 4.6 | As Student B (uMhlanga), submit 2-3 ideas, some similar to A's (e.g. "braai", "cookout") | All submit |

- [ ] 4.1  - [ ] 4.2  - [ ] 4.3  - [ ] 4.4  - [ ] 4.5  - [ ] 4.6

---

## 5. AI analysis (admin) - the big one

| Step | Do this | Expected |
|---|---|---|
| 5.1 | Sign in as **Admin**, go to **Suggestions** | Table lists all student ideas; **"Analyse Suggestions"** button is enabled (not greyed out) |
| 5.2 | Click **Analyse Suggestions** | Button shows **"Analysing..."**, then finishes (a few seconds) |
| 5.3 | Look at the table | Each row now has a **Cluster label** and a **Category** badge (Sports/Social/Academic/Cultural/Other) |
| 5.4 | Check similar ideas (e.g. "braai" + "cookout") | They share the **same cluster label** |
| 5.5 | Find the anonymous idea from 4.5 | Row shows an **"Anonymous"** tag |
| 5.6 | Sign back in as a student, open **Suggest an Event** -> Community Suggestions | Grouped ideas now appear with "**N similar suggestions** in this group" |

- [ ] 5.1  - [ ] 5.2  - [ ] 5.3  - [ ] 5.4  - [ ] 5.5  - [ ] 5.6

### 5b. AI error handling (negative tests)

| Step | Do this | Expected |
|---|---|---|
| 5.7 | (Before deploying the function) click Analyse | Friendly error: "...Is the Edge Function deployed?" - app does **not** crash |
| 5.8 | Try clicking Analyse while signed in as a **student** (if reachable) | Blocked - "Admins only." |

- [ ] 5.7  - [ ] 5.8

---

## 6. Polls / Voting

| Step | Do this | Expected |
|---|---|---|
| 6.1 | As a student, open **Active Polls** | Only active items show |
| 6.2 | As admin, mark a suggestion **approved** or **rejected** | It **disappears** from students' Active Polls and the dashboard count |
| 6.3 | Use the campus tabs (All / Musgrave / uMhlanga) | List filters correctly |

- [ ] 6.1  - [ ] 6.2  - [ ] 6.3

---

## 7. Admin areas

| Step | Do this | Expected |
|---|---|---|
| 7.1 | Look at the admin sidebar | It is **white** (not dark) |
| 7.2 | Open **Students** | The full roster loads (needs `phase2-admin-read.sql`) - not empty/blocked |
| 7.3 | Open Dashboard, Polls & Events, Feedback, Settings | Each loads without error |

- [ ] 7.1  - [ ] 7.2  - [ ] 7.3

---

## 8. Cross-campus & empty states

| Step | Do this | Expected |
|---|---|---|
| 8.1 | Create an event scoped to **Both Campuses** (admin) | Both Student A and Student B can see it |
| 8.2 | View any page with no data yet (fresh account) | A friendly **empty state** shows, not a blank area or error |

- [ ] 8.1  - [ ] 8.2

---

## Sign-off

- Date tested: ____________  Tester: ____________
- Passed: ____ / total   - Issues found: ________________________________

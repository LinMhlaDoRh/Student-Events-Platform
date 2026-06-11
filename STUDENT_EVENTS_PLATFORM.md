# Student Events Platform — Concept Doc

> Scope: Richfield Durban — Musgrave campus + uMhlanga campus  
> Goal: Cheap, functional, student-driven event platform  
> Target: < 500 students (v1 pilot)

---

## Problem

School events have low attendance. Events are designed top-down by administration, not by students. The one event with consistent turnout (Sports Day) works because students have ownership and investment in it. Every other event fails the same way — students had no say in it existing.

A secondary problem specific to Richfield Durban: the two campuses (Musgrave and uMhlanga) have almost no interaction outside of Sports Day. They know each other exist. That's it.

---

## Core Idea

A web platform where students propose, vote on, and commit to events — across both campuses. The demand signal comes from students. One SRC admin manages the platform and communicates outcomes to school management.

**Why SRC as admin:** SRC members are students. They understand what other students want. They are also the correct bridge between student demand and school management — that's their role.

The cross-campus angle is not a side feature. It is the differentiator. A shared platform means students from both campuses can see what the other campus wants, vote on joint events, and build a connection that currently does not exist.

---

## How It Works

### 1. Suggestion Phase
- Any registered student submits an event idea as free text
- AI clusters similar suggestions (e.g. "braai," "cookout," "outdoor fire" → one idea)
- Chart shows admin what students across both campuses are asking for, by category

### 2. Poll Phase
- Top clustered ideas go to a campus-wide or cross-campus poll
- Students vote with two options:
  - `Interested` — I like this idea
  - `I will attend` — I am actually coming
- Both counts are public — social proof drives real commitment

### 3. Decision Phase
- SRC admin reviews results and confirms or schedules the event
- Admin can add or delete events
- Admin cannot silently kill a high-vote event — override must be visible to students

### 4. Post-Event
- Attendees submit quick feedback
- Actual attendance tracked vs committed count
- Data informs the next event cycle

---

## Key Features

| Feature | Purpose |
|---|---|
| Free-text event suggestions | Students define options, not admins |
| AI text clustering | Groups duplicate/similar ideas into one |
| Category auto-tagging | Sports, Social, Academic, Cultural, etc. |
| Dual vote (Interested vs Will Attend) | Separates preference from real commitment |
| Public attendance count | Social proof drives actual turnout |
| Suggestion threshold | Event only reaches poll at X unique suggestions |
| Anonymous suggestion mode | Students suggest honestly without social pressure |
| Campus filter | View events per campus or across both |
| Cross-campus events | Joint events both campuses vote on |
| Post-event feedback | Tracks what actually worked |
| Admin trend dashboard | Shows which categories are consistently underserved |

---

## Cross-Campus Logic

| Event Type | Who Suggests | Who Votes | Who Attends |
|---|---|---|---|
| Campus-only | Students of that campus | That campus only | That campus |
| Cross-campus | Any student | Both campuses | Both campuses |

SRC admin decides whether an event is campus-only or cross-campus at confirmation stage.

---

## AI Role (Free Tier Only)

- **Text clustering** — group similar suggestions into one idea
- **Category detection** — auto-tag suggestions by type
- **How it's called** — batch all suggestions in one API call per cycle, not per submission

### API

| Option | Why |
|---|---|
| **Gemini 1.5 Flash** | Free tier, fast, handles text clustering well |
| **DeepSeek** | Near-free per token, strong at text tasks |

At < 500 students, Gemini free tier is sufficient. No paid tier needed in v1.

---

## Stack

| Layer | Tool | Cost |
|---|---|---|
| Frontend | React + Vite | Free |
| Hosting | Vercel | Free tier |
| Backend + Database + Auth | Supabase | Free tier |
| AI | Gemini 1.5 Flash | Free tier |
| Auth — testing | Supabase email/password (any email) | Free |
| Auth — production | Restrict to @richfield.ac.za domain | Free |

---

## User Roles

| Role | Who | Permissions |
|---|---|---|
| Student | Any registered student | Suggest, vote, commit, give feedback |
| Admin | SRC member | View analytics, confirm events, add/delete events, set campus scope |

---

## Known Risks

| Risk | Mitigation |
|---|---|
| Votes ≠ attendance | "I will attend" + public count creates social accountability |
| Admin veto kills trust | Override rules visible to students upfront |
| Cold start | Both campuses must onboard together; school promotes it |
| API cost | Free tier only in v1; set alert if approaching limits |
| Cross-campus resistance | Make cross-campus events opt-in, not default |

---

## Open Questions

- What is the suggestion threshold before an event reaches the poll?
- How is actual attendance tracked — QR, manual, or self-report?
- Does one SRC admin cover both campuses, or one per campus with shared access?
- Who maintains the platform after it is built?

---

## Scope Boundaries (What This Is Not)

- Not a ticketing or payment platform
- Not a social media feed
- Not scaling beyond two Richfield Durban campuses in v1

---

*Concept-stage document. Nothing here is final.*

# Student Events Platform — Concept Doc

## Problem

School events have low attendance. Events are created top-down by administration, not by students. The one event with consistent turnout (Sports Day) works because students have ownership and investment in it. Every other event fails the same way: students had no say in it existing.

## Core Idea

A web platform where students propose, vote on, and commit to events. Admin manages logistics and final approval, but the demand signal comes from students — not from the top.

---

## How It Works

### 1. Suggestion Phase
- Any student can submit an event idea in free text
- AI (Gemini / OpenAI / DeepSeek API) clusters similar suggestions together
  - e.g. "braai," "end-of-term cookout," "outdoor fire" → grouped as one idea
- A chart/table shows admin what students are actually asking for, by category

### 2. Poll Phase
- Top clustered ideas go to a school-wide poll
- Students vote with two options:
  - `Interested` — I like this idea
  - `I will attend` — I am actually coming
- Both counts are visible to everyone
  - Social proof: students are more likely to commit when they see others committing

### 3. Decision Phase
- Admin reviews poll results and either confirms or schedules the event
- Admin can add or remove events, but cannot silently kill a high-vote event without reason
- Rules for what admin can override must be defined and visible to students

### 4. Post-Event
- After the event, attendees submit quick feedback
- Actual attendance tracked vs committed count
- Data feeds into future planning

---

## Key Features

| Feature | Purpose |
|---|---|
| Free-text event suggestions | Students define options, not admins |
| AI text clustering | Groups duplicate/similar ideas into one |
| Category auto-tagging | Sorts ideas into Sports, Social, Academic, Cultural, etc. |
| Dual vote (Interested vs Will Attend) | Separates preference from commitment |
| Public attendance count | Social proof drives real turnout |
| Suggestion threshold | Event only reaches poll if it gets X unique suggestions — filters noise |
| Anonymous suggestion mode | Students suggest honestly without social pressure |
| Post-event feedback | Builds data on what actually worked |
| Admin trend dashboard | Shows which categories are consistently underserved |

---

## AI Role

- **Text clustering** — detect when different phrasings mean the same event
- **Category detection** — auto-tag suggestions without manual input
- **Sentiment/popularity scoring** — surface what has genuine demand vs spam submissions
- **API used** — Gemini, OpenAI, or DeepSeek (TBD based on cost and availability)

---

## User Roles

| Role | Permissions |
|---|---|
| Student | Suggest events, vote, commit to attend, give feedback |
| Admin | View analytics, confirm/schedule events, add/delete events, see attendance gaps |

---

## Known Risks

- **Votes ≠ attendance** — mitigated by the "I will attend" commitment toggle and public count visibility
- **Admin veto killing trust** — override rules must be transparent and pre-agreed with students
- **Cold start** — platform needs school buy-in to force initial adoption; needs minimum viable user base before it has value
- **AI cost** — API usage has a cost, needs to be scoped against school budget or free-tier limits

---

## Tech Stack (Preliminary)

- **Frontend** — TBD (React or plain HTML/CSS/JS)
- **Backend** — TBD (Node.js / Python / Java)
- **AI** — Gemini API / OpenAI API / DeepSeek API
- **Database** — TBD
- **Auth** — School email-based login (to restrict to actual students)

---

## Open Questions

- What is the minimum vote threshold for an event to reach the poll?
- Which admin actions are visible to students and which are internal?
- How is "actual attendance" tracked — manual check-in, QR code, or self-report?
- Who pays for the AI API calls?

---

*This document is a concept-stage record. Nothing here is final.*

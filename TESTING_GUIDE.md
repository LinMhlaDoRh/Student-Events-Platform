# Testing guide

## Automated checks

```bash
npm ci
npm run verify
npm audit --audit-level=high
```

After applying the migration, run `supabase/tests/security_regression.sql` in staging.

## Required identities

Use disposable staging accounts: one student per campus and two named administrators, one per campus. Never use production data or shared passwords.

## Authentication

- Confirm unverified accounts cannot sign in.
- Confirm login and password-reset responses do not disclose whether an email exists.
- Confirm a normal session cannot use `/reset-password`; only a fresh recovery link can.
- Confirm repeated signup/login/reset requests are throttled and CAPTCHA appears.
- Confirm students cannot alter role, campus, email, ID or creation time through PostgREST.

## Suggestions

- Send parallel submissions from one user; exactly one must succeed per active round.
- Try to supply status, cluster label, category, campus, owner and timestamp; server values must win or the request must fail.
- Confirm community and admin RPC responses never contain `submitted_by`.
- Confirm withdrawal fails after clustering/voting/decision.
- Confirm old rounds do not appear in active polls.

## Voting

- Vote concurrently; unique rows and correct aggregate count must remain.
- Attempt to vote on raw, approved, rejected, archived and unknown IDs; all must fail.
- Confirm one student cannot read other users' vote rows.

## Events and feedback

- Attempt RSVP for past, cancelled, future-ineligible and other-campus events; all invalid cases must fail.
- Confirm aggregate counts work without exposing attendee IDs.
- Confirm feedback opens only after a visible non-cancelled event and closes after 30 days.
- Confirm a genuine walk-in can submit and `did_attend` is required.
- Confirm comments over 1,000 characters fail.

## Admin and AI

- Confirm a student cannot call admin list/update or AI functions.
- Confirm only one AI analysis runs at a time and more than two attempts/hour are blocked.
- Submit prompt-injection text; output must still contain every exact input ID once with valid labels/categories.
- Confirm event changes and suggestion moderation appear in `security_audit_log`.
- Confirm API role changes cannot promote any user and database constraints allow no more than one admin per campus.

## Browser and deployment

Verify CSP, HSTS, frame denial, nosniff, referrer policy and permissions policy. Confirm no `.map` files, service-role/Gemini keys or demo passwords appear in assets.

## Release checklist

Complete before every production deployment. Record the date, tester, commit SHA, migration version and any failures.

- [ ] Comprehensive migration applied; production backup exists
- [ ] `supabase/tests/security_regression.sql` passes
- [ ] No demo or ghost accounts present
- [ ] Exactly two or fewer named admins exist, at most one per campus
- [ ] Email confirmation, CAPTCHA, leaked-password protection and security notifications enabled
- [ ] Site URL and recovery redirects match `docs/supabase-setup.md`
- [ ] Student signup, verification, login, logout and recovery work end-to-end
- [ ] An ordinary session cannot access the recovery page
- [ ] One concurrent suggestion succeeds per student per round
- [ ] Anonymous community/admin responses contain no author ID
- [ ] Active poll voting works; invalid-state voting fails
- [ ] Campus and event-state RSVP checks pass
- [ ] Past-event feedback and walk-in feedback work; future/cancelled feedback fails
- [ ] Admin suggestion review, manual clustering and event cancellation work
- [ ] AI analysis is admin-only, bounded and concurrency-limited
- [ ] Audit records appear for administrator changes
- [ ] Mobile student and admin navigation works
- [ ] `npm run verify` and GitHub Security CI pass
- [ ] Production response headers confirmed; no source maps present

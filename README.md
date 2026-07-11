# Richfield Student Events Platform

A React + Supabase platform where students propose events, vote on active ideas, RSVP to campus-eligible events, and provide post-event feedback. Two SRC administrators—one per campus—review demand and manage events.

## Security model

The browser is untrusted. Sensitive writes use narrow Postgres functions, and Row Level Security is the authorization boundary. New users are always students; roles and campuses cannot be changed through the public API. Users must create and verify their own account.

Anonymous suggestions are displayed to students and SRC reviewers without author identity. The owner mapping remains in the protected base table only to enforce one submission per round and permit a safe withdrawal.

## Requirements

- Node.js 22.19.x
- npm 11.6.x
- A Supabase project
- Vercel or another static host
- Optional Gemini key for administrator-assisted clustering

## Local setup

1. `npm ci`
2. Copy `.env.example` to `.env` and set the public Supabase URL and anon key.
3. For a new database, run `supabase/fresh-install.sql`, followed immediately by `supabase/migrations/20260711133000_comprehensive_security_remediation.sql`.
4. For an existing database, back up first and run only the comprehensive migration.
5. Apply every item in `docs/supabase-setup.md`.
6. Deploy the Edge Function using `supabase/AI_SETUP.md`.
7. Run `npm run verify`.
8. Start locally with `npm run dev`.

## Administrator setup

The application cannot promote users. Promote administrators only through the Supabase SQL editor while signed in as the project owner. The database allows at most two administrators and rejects a second administrator for the same campus. Review the current administrator list before promotion.

## Synthetic portfolio data

`supabase/demo-seed.sql` adds non-destructive synthetic content only after real verified accounts exist. It never creates accounts, exposes passwords, changes roles, or wipes existing data. Do not publish shared credentials.

## Main security controls

- One suggestion per user per active round, enforced transactionally
- Server-derived suggestion owner, campus, status, round and timestamps
- Lifecycle-aware voting, RSVP, feedback and withdrawal operations
- Private voter and attendee identities with aggregate public counts
- Thirty-day feedback window for campus-visible past events, including walk-in attendees
- AI administrator authorization, rate limits, concurrency lock, timeout and strict output validation
- Immutable security audit log for administrator changes
- CSP and browser security headers
- Exact dependency versions and GitHub security CI

## Release gate

Do not deploy unless:

- GitHub Security CI passes
- Database regression assertions pass (`supabase/tests/security_regression.sql`)
- Student and admin negative authorization tests pass in staging
- Both administrators use named accounts with TOTP enabled
- Email confirmation, CAPTCHA, leaked-password protection and safe redirects are enabled
- The production build contains no source maps or shared credentials

See `SECURITY.md` and `TESTING_GUIDE.md` for details.

# Security model

## Trust boundaries

The React app and public Supabase anon key are untrusted. Authorization lives in RLS, constraints, triggers, and narrowly scoped `SECURITY DEFINER` functions. The Gemini key and service-role key exist only in the Edge Function environment.

## Identity and administrators

- Signup always creates a `student` profile.
- Direct API callers cannot change role, campus, email, identifier, or creation time.
- At most two administrators are allowed, one per campus.
- There is no application promotion endpoint.
- Shared demo identities are removed by the security migration.
- Administrators should enroll TOTP MFA and use separate named accounts.

## Suggestions and anonymity

A database function derives the caller, campus, active round, initial state, and timestamp. An advisory transaction lock enforces one suggestion per user per round. Community and SRC list functions omit `submitted_by`; the base table is owner-readable only.

## Voting, attendance, and feedback

Raw vote and attendance rows are visible only to their owner and administrators. Public screens receive aggregate counts. Voting requires an active clustered idea. RSVP requires a visible, upcoming, future event. Feedback is accepted for a visible, non-cancelled past event for 30 days. RSVP is not mandatory so walk-in attendees can still respond.

## AI clustering

The Edge Function verifies the user and claims a rate-limited run through the database. Student text is treated as untrusted input. Output must contain every known ID exactly once with valid bounded fields. Requests time out and errors are sanitized. Set `APP_ORIGINS` to production and local origins.

## Abuse controls

Database limits cover suggestions, voting, RSVP, feedback, and AI analysis. Also enable Supabase Auth rate limits, email verification, CAPTCHA, and leaked-password protection using `docs/supabase-setup.md`.

## Reporting

Do not test production destructively. Report suspected vulnerabilities privately to the repository owner with reproduction steps and affected versions.

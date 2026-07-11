# Security model

## Trust boundaries

The React application and public Supabase anon key are untrusted. Authorization lives in RLS, constraints, triggers and narrowly scoped `SECURITY DEFINER` functions. The Gemini key and service-role key exist only in the Edge Function environment.

## Identity and administrators

- Signup always creates a `student` profile.
- Direct API callers cannot change role, campus, email, identifier or creation time.
- At most two administrators are allowed, one per campus.
- There is no application promotion endpoint.
- Shared demo and synthetic ghost accounts are deleted by the security migration.
- Administrators should enroll TOTP MFA and use separate named accounts.

## Suggestions and anonymity

A database function derives the caller, campus, active round, initial state and timestamp. An advisory transaction lock enforces one suggestion per user per round during concurrent requests. Community and SRC list functions omit `submitted_by`; the base table is owner-readable only. Anonymous authors are therefore not returned to community or review clients.

## Voting, attendance and feedback

Raw vote and attendance rows are visible only to their owner and administrators. Public screens receive aggregate counts. Voting requires an active clustered idea. RSVP requires a visible, upcoming, future event. Feedback is accepted for a visible, non-cancelled past event for 30 days. RSVP is not mandatory because genuine walk-in attendees must be able to respond; `did_attend` records whether the respondent attended.

## AI

The Edge Function verifies the user and calls a database rate-limit/concurrency claim. It uses a service client only after that check. Student text is treated as untrusted data; output must contain every known ID exactly once and valid bounded fields. Requests time out, errors are sanitized, and runs are recorded. Set `APP_ORIGINS` to the production and local origins.

## Abuse controls

Database limits cover suggestions, voting, RSVP, feedback and AI analysis. Supabase Auth rate limits, email verification, CAPTCHA and leaked-password protection must also be enabled using `SUPABASE_DASHBOARD_SECURITY_CHECKLIST.md`.

## Reporting

Do not test the production project destructively. Report suspected vulnerabilities privately to the repository owner with reproduction steps and affected versions.

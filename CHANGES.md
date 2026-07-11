# Security remediation changes

## Critical and high-risk fixes

- Removed public student/admin demo credentials and one-click demo login.
- Migration deletes the known shared demo accounts and synthetic ghost accounts with known password hashes.
- Replaced direct suggestion writes with a server-controlled, rate-limited function.
- Added active suggestion rounds and transaction locking for one submission per user per round.
- Removed clustered-suggestion base-table exposure; community and admin reads omit author IDs.
- Replaced raw public vote/attendance reads with owner-only rows and aggregate RPC results.
- Added state/campus checks for voting and RSVP.
- Added bounded post-event feedback with a 30-day window and walk-in support.

## Authentication and administration

- New users are always students.
- Security-sensitive profile columns are immutable through the API.
- Administrator count is limited to two and one per campus; there is no promotion endpoint.
- Password minimum increased to 12 characters.
- Recovery page now requires a real `PASSWORD_RECOVERY` event.
- Added required Supabase dashboard hardening checklist.

## AI, privacy and abuse resistance

- Added administrator AI run claims, two-per-hour limit, single-run lock and stale-lock recovery.
- Added request timeout, bounded input, strict origin handling, prompt-data separation and exact output validation.
- Sanitized provider errors and logs.
- Added general database rate limiting and immutable security audit logging.

## Deployment and supply chain

- Added CSP and browser security headers.
- Disabled production source maps.
- Pinned exact dependency versions and synchronized lock root metadata.
- Added Node/npm engine requirements, static security tests and GitHub Security CI.
- Retired insecure phase scripts in favor of one fresh schema and one authoritative migration.

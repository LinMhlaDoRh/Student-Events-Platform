# Security remediation and verification report

**Date:** 11 July 2026  
**Original findings:** 21  
**Fixed in code:** 18  
**Partially fixed pending external deployment configuration:** 2  
**Requires runtime verification in the specified Node 22.19/npm 11.6 environment:** 1

## Executive summary

The codebase was changed from a client-trusting demo into an RLS/RPC-centered application. Public privileged credentials were removed and the migration deletes the known shared/ghost identities. Student-controlled writes now pass through narrow database functions that enforce ownership, campus, lifecycle, limits and concurrency. Anonymous suggestion responses omit author identity. Public vote and attendance identity graphs were replaced with aggregate results. AI analysis now has an administrator claim, rate limit, single-run lock, timeout and strict output validation.

**Updated static security score:** 88/100.  
**Production readiness:** staging-ready after migration; not yet production-approved until the Supabase dashboard checklist, staging SQL tests, dependency audit and production build complete successfully.

## Original finding disposition

| ID | Finding | Status | Verification |
|---|---|---|---|
| F-01 | Public administrator credentials | **Fixed** | UI/constants removed; migration deletes known demo and ghost identities; static test passes. |
| F-02 | Suggestion mass assignment | **Fixed** | Direct insert revoked; `submit_suggestion` derives security fields server-side. |
| F-03 | Client-only suggestion limit | **Fixed** | Active rounds, advisory transaction lock and database check added. |
| F-04 | RSVP state/scope BOLA | **Fixed** | `toggle_event_attendance` requires visible upcoming future event. |
| F-05 | Feedback state/scope BOLA | **Fixed** | RPC checks campus visibility, past state, non-cancelled status and 30-day window. Walk-ins are allowed intentionally. |
| F-06 | Anonymous author exposure | **Fixed** | Base table is owner-readable only; community/admin list functions omit `submitted_by`. |
| F-07 | Vote/attendance identity graph | **Fixed** | Raw rows are owner/admin-only; screens use aggregate RPCs. |
| F-08 | Mutable campus/email/profile security fields | **Fixed** | Trigger and column grants prevent API changes; only display name may be granted separately. |
| F-09 | Voting on hidden/inactive ideas | **Fixed** | Vote RPC validates active round, cluster and allowed status. |
| F-10 | AI prompt/cost/concurrency abuse | **Fixed** | Data delimiting, exact-ID validation, bounded input, timeout, rate limit and lock added. |
| F-11 | Unbounded text/whole-table exhaustion | **Fixed** | DB text limits and bounded queries added; AI input is capped. |
| F-12 | Missing browser security headers | **Fixed** | CSP, frame denial, HSTS, nosniff, referrer and permissions policies added; source maps disabled. |
| F-13 | Dependency/lock inconsistency | **Partially Fixed** | Versions are exact and lock root matches. CVE audit awaits registry-enabled CI. |
| F-14 | Unverified Auth abuse controls | **Partially Fixed** | Generic errors, stronger passwords and recovery checks added. Dashboard settings must be applied from the supplied checklist. |
| F-15 | Migration/schema drift | **Fixed** | Authoritative forward migration, fresh schema, retired phase scripts and catalog regression test added. |
| F-16 | Detailed AI/provider errors | **Fixed** | Stable public messages and short internal error codes replace provider bodies. |
| F-17 | Post-moderation suggestion deletion | **Fixed** | Direct delete revoked; withdrawal RPC rejects clustered/voted/decided rows and soft-rejects valid withdrawal. |
| F-18 | Normal session accepted as recovery | **Fixed** | Page waits specifically for `PASSWORD_RECOVERY`. |
| F-19 | No privileged audit trail | **Fixed** | Immutable RLS-protected audit log and event/suggestion logging added. |
| F-20 | No tests/CI | **Fixed** | Node security tests, SQL catalog assertions and GitHub Security CI added. |
| F-21 | Build/audit reproducibility not demonstrated | **Requires Additional Information** | Sandbox runs Node 24.14/npm 11.11 with no registry DNS. Verify in Node 22.19/npm 11.6 CI. |

## Files changed

| File | Reason and security issues | Main changes | Possible side effects | Verification |
|---|---|---|---|---|
| `src/pages/SignIn.jsx` | F-01/F-14 | Removed demo login/credentials; generic login/reset responses | Recruiters must register | Secret scan and static tests pass |
| `src/pages/SignUp.jsx` | F-14 | 12-character minimum; correct verification success state | Existing 8–11 character passwords still work, but new ones require 12 | Source scan |
| `src/pages/ResetPassword.jsx` | F-18 | Requires recovery event; generic errors; 12-character minimum | Ordinary signed-in users cannot use recovery page as change-password page | Source inspection |
| `src/pages/Suggestions.jsx` | F-02/F-03/F-06/F-17 | Secure RPC submit/withdraw and safe community data | One submission for the whole active round | Static sensitive-write test passes |
| `src/pages/Voting.jsx` | F-07/F-09 | Aggregate poll RPC and secure toggle | Removed raw realtime identity subscription; refresh occurs after actions | Static sensitive-write test passes |
| `src/pages/Dashboard.jsx` | F-07/F-11 | Aggregate polls/events and bounded own suggestions | Counts refresh on page/action rather than raw identity events | Source inspection |
| `src/pages/Events.jsx` | F-04/F-05/F-07 | Secure RSVP/feedback RPCs and aggregate counts | Feedback limited to 30 days; `did_attend` required | Static sensitive-write test passes |
| `src/pages/AdminSuggestions.jsx` | F-06/F-17/F-19 | Masked admin list, audited updates, reject instead of delete | Hard deletion removed | Source inspection |
| `src/pages/AdminDashboard.jsx` | F-06/F-11 | Masked suggestion RPC and bounded vote read | Maximum 2,000 vote rows per dashboard load | Source inspection |
| `src/pages/AdminEvents.jsx` | F-11/F-19 | Masked idea source, bounded reads, cancel instead of delete | Cancelled rows remain for audit/history | Source inspection |
| `src/pages/AdminFeedback.jsx` | F-11 | Bounded feedback read | Displays at most 500 newest responses | Source inspection |
| `src/pages/AdminStudents.jsx` | F-11 | Bounded roster read | Displays at most 500 newest profiles | Source inspection |
| `src/App.jsx` | Code quality | Safe fallback route | Unknown URLs redirect to role home/sign-in | Structural scan |
| `src/supabaseClient.js` | Session/token handling | Explicit PKCE, refresh and URL-session settings | Session persistence remains browser-managed by Supabase | Source inspection |
| `src/lib/api.js` | F-02–F-09 | Central narrow data-access layer and safe error mapping | Requires migration before frontend deploy | Static test passes |
| `supabase/migrations/20260711133000_comprehensive_security_remediation.sql` | F-01–F-19 | Complete forward migration, RLS, RPCs, limits, locks and audit | Removes known demo identities and their cascading demo-owned rows | Catalog test supplied; runtime pending |
| `supabase/security-hardening.sql` | F-15 | Exact copy of authoritative migration | Same as migration | Hash compared during packaging |
| `supabase/fresh-install.sql` | F-15 | Secure base schema for new projects | Must be followed immediately by migration | Static review |
| `supabase/phase*.sql` | F-15 | Retired dangerous partial scripts | Old phase-by-phase setup no longer supported | Scan confirms permissive SQL removed |
| `supabase/demo-seed.sql` | F-01 | No credentials, account creation, role changes or destructive reset | Requires existing verified users; adds content only when tables are empty | Secret scan passes |
| `supabase/functions/cluster-suggestions/index.ts` | F-10/F-16 | Auth claim, service isolation, lock, limits, timeout, CORS and schema validation | Requires migration and `APP_ORIGINS` secret | Static review |
| `vercel.json` | F-12 | Security headers/CSP | CSP may require adjustment if new external services are added | Header static test passes |
| `vite.config.js` | F-12 | Source maps disabled and local host bound | LAN dev access requires explicit change | Static test passes |
| `package.json` / `package-lock.json` | F-13/F-21 | Exact versions, engines, tests and verify script | Requires declared Node/npm versions | Lock consistency test passes |
| `.github/workflows/security-ci.yml` | F-13/F-20/F-21 | Reproducible build, audit, secret gate | Branch protection must be enabled in GitHub settings | YAML reviewed |
| `tests/security-static.test.js` | F-20 | Automated secret/sink/RPC/header/lock checks | Static tests do not replace runtime RLS tests | 6/6 passed |
| `supabase/tests/security_regression.sql` | F-20 | Catalog assertions for deployed controls | Must run in staging/SQL editor | Not run without database access |
| `README.md`, `SECURITY.md`, `BUILD_GUIDE.md`, `TESTING_GUIDE.md`, `MANUAL_TESTS.md`, `CHANGES.md`, `supabase/AI_SETUP.md` | Documentation drift | Updated architecture, setup, testing, AI and release guidance | Operators must follow new two-script migration flow | Cross-reviewed against code |
| `SUPABASE_DASHBOARD_SECURITY_CHECKLIST.md` | F-14 | Exact required changes derived from supplied screenshots | Settings remain external to repository | Screenshot-to-checklist review |

## Repeat audit results

- **Authentication:** Shared credentials removed; recovery and error behavior hardened. Email confirmation/CAPTCHA/leaked-password settings still require dashboard action.
- **Authorization:** Student mutations are RPC-controlled. Base suggestion community/admin exposure removed. No confirmed horizontal or vertical escalation remains in reviewed code.
- **Injection/XSS/CSRF/SSRF/XXE:** No raw SQL, unsafe React HTML sink, ambient-cookie state API, user-controlled outbound URL, XML parser or file path surface was introduced. AI prompt injection is constrained and output-validated.
- **File uploads:** Feature remains absent.
- **API/database:** Ownership, campus, lifecycle, bounds, rate limits and concurrency controls are database-enforced. Catalog regression tests were added.
- **Privacy:** Community/admin suggestion functions omit author IDs; vote/attendance rows are no longer globally readable.
- **Race conditions:** Advisory lock covers submissions; unique constraints cover vote/RSVP/feedback; AI has a single-running index.
- **DoS/performance:** Text, AI input and list sizes are bounded. Cleanup removes old per-user rate windows.
- **Configuration:** Security headers and source-map policy are fixed. Supabase Auth settings require manual application.
- **Dependencies:** Exact versions and CI gate added; live CVE result unavailable in the sandbox.
- **Code quality:** Central API wrapper, fallback route, retired conflicting SQL and synchronized docs reduce fragile duplicate logic.

## Tests performed

- Repository and supplied Supabase screenshots/SQL journey reviewed.
- Node built-in security regression suite: **6 passed, 0 failed**.
- Repeated secret, dangerous-sink, direct-sensitive-write, dependency-range and permissive-policy scans.
- Basic delimiter/structural scan across JavaScript/JSX.
- Attempted `npm ci`, Vite build and dependency audit. They could not complete because the sandbox is Node 24.14/npm 11.11 and registry DNS is unavailable; this is not represented as a pass.
- No destructive production testing was performed.

## Remaining deployment risks

1. Apply the migration and run SQL regression assertions in staging.
2. Apply every Supabase dashboard setting in the checklist, especially email confirmation, CAPTCHA, leaked-password protection, safe Site URL and redirects.
3. Enroll both named administrators in TOTP and remove any unexpected administrator.
4. Run `npm ci`, `npm run verify`, and `npm audit --audit-level=high` under Node 22.19/npm 11.6.
5. Perform the negative staging tests in `TESTING_GUIDE.md` and verify deployed headers.
6. Enable GitHub branch protection requiring Security CI.

## Final verdict

**Not yet approved for production deployment.** The remediated source is suitable for staging and is materially safer, but production approval requires successful application of the database migration, external Auth settings, runtime RLS tests, dependency audit and production build in the declared environment. If those gates pass without regression, the application can be approved for its stated sub-500-user pilot scope.

# Manual release checklist

- [ ] Comprehensive migration applied to staging and production backup exists
- [ ] `supabase/tests/security_regression.sql` passes
- [ ] Known demo and ghost accounts are absent
- [ ] Exactly two or fewer named admins exist, at most one per campus
- [ ] Email confirmation, CAPTCHA, leaked-password protection and security notifications are enabled
- [ ] Site URL and recovery redirects match `SUPABASE_DASHBOARD_SECURITY_CHECKLIST.md`
- [ ] Student signup, verification, login, logout and recovery work
- [ ] Ordinary session cannot use the recovery page
- [ ] One concurrent suggestion succeeds per student per round
- [ ] Anonymous community/admin responses contain no author ID
- [ ] Active poll voting works and invalid-state voting fails
- [ ] Campus/event-state RSVP checks pass
- [ ] Past-event feedback and walk-in feedback work; future/cancelled feedback fails
- [ ] Admin suggestion review, manual clustering and event cancellation work
- [ ] AI analysis is admin-only, bounded and concurrency-limited
- [ ] Audit records appear for administrator changes
- [ ] Mobile student/admin navigation still works
- [ ] `npm run verify` and GitHub Security CI pass
- [ ] Production response headers and absence of source maps are confirmed

Record date, tester, commit SHA, migration version, failures and evidence before approval.

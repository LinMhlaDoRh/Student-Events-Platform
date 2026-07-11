# Secure build and deployment guide

## 1. Runtime

Use Node.js 22.19.x and npm 11.6.x. Run `npm ci`; do not use floating dependency versions.

## 2. Database

- New project: run `supabase/fresh-install.sql`, then `supabase/migrations/20260711133000_comprehensive_security_remediation.sql`.
- Existing project: back up the database and run only the comprehensive migration.
- Run `supabase/tests/security_regression.sql` afterward.
- Confirm there are no shared demo identities and no unexpected administrators.

The former phase scripts are intentionally retired because running an old phase could recreate permissive policies.

## 3. Authentication

Apply `SUPABASE_DASHBOARD_SECURITY_CHECKLIST.md`. Email confirmation and CAPTCHA are required for public signup. Do not publish administrator credentials. Administrators are promoted only by the project owner and are limited to one per campus/two total.

## 4. Edge Function

Follow `supabase/AI_SETUP.md`. AI is optional; manual clustering remains functional. Restrict `APP_ORIGINS`, the Gemini key, and provider quota.

## 5. Frontend

Set only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Run `npm run verify`, then deploy. Vercel reads security headers from `vercel.json`; confirm them on the deployed URL.

## 6. Release gate

Do not release unless:

- GitHub Security CI passes.
- Database regression assertions pass.
- Student and admin negative authorization tests pass in staging.
- Both administrators use named accounts and TOTP.
- Email confirmation, CAPTCHA, leaked-password protection and safe redirects are enabled.
- The production build contains no source maps or shared credentials.

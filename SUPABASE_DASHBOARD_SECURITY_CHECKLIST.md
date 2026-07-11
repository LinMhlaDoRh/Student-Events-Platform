# Required Supabase dashboard security settings

The supplied screenshots showed several unsafe settings. Apply these before redeployment.

## Authentication

- Enable **Confirm email**.
- Keep anonymous sign-ins and manual identity linking disabled.
- Keep only Email enabled unless another provider is deliberately reviewed.
- Enable CAPTCHA with a production site key and secret.
- Enable leaked-password protection.
- Keep refresh-token reuse detection enabled with a 10-second interval.
- Keep TOTP MFA enabled; enroll both administrator accounts.
- Enable security notifications for password, email, sign-in-method and MFA changes.
- Enable Auth audit logs to the database if the project plan supports it.

## URLs

- Change Site URL from `http://localhost:3000` to `https://student-events-platform.vercel.app`.
- Keep only these redirects:
  - `https://student-events-platform.vercel.app/reset-password`
  - `http://localhost:5173/reset-password` for local development
- Remove `/signin` redirects because password recovery uses `/reset-password`.
- Do not add wildcard production redirects.

## Rate limits

Recommended free-tier starting points:

- Emails: 2/hour minimum available; configure custom SMTP before broader use.
- Signup/sign-in: 10 requests per 5 minutes per IP.
- Token verification: 10 per 5 minutes per IP.
- Token refresh: 60 per 5 minutes per IP.
- Anonymous users: disabled.

Monitor legitimate failures and lower or raise carefully. Database functions separately limit application actions.

## Sessions

Free-plan screenshots showed no configurable time-box/inactivity controls. Administrators should sign out on shared devices. If the project upgrades, use an 8-hour maximum administrator session and 30-minute inactivity timeout.

## Deployment

- Redeploy the frontend after removing demo credentials.
- Apply the comprehensive SQL migration.
- Deploy the updated Edge Function with `GEMINI_API_KEY`, optional `GEMINI_MODEL`, and `APP_ORIGINS`.
- Delete/rotate old shared demo credentials; the migration deletes known demo identities.
- Run `supabase/tests/security_regression.sql` after migration.

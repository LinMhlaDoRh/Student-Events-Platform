# Supabase dashboard security settings

Apply these settings before deploying to production.

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

- Set Site URL to `https://student-events-platform.vercel.app`.
- Keep only these redirect URLs:
 - `https://student-events-platform.vercel.app/reset-password`
 - `http://localhost:5173/reset-password` (local development only)
- Do not add wildcard production redirects.

## Rate limits

Recommended free-tier starting points:

- Emails: 2/hour minimum; configure custom SMTP before broader use.
- Signup/sign-in: 10 requests per 5 minutes per IP.
- Token verification: 10 per 5 minutes per IP.
- Token refresh: 60 per 5 minutes per IP.
- Anonymous users: disabled.

Monitor for legitimate failures and adjust carefully. Database functions separately enforce application-level rate limits.

## Sessions

Administrators should sign out on shared devices. If the project upgrades to a paid plan, set an 8-hour maximum session length and a 30-minute inactivity timeout for administrator accounts.

## Post-deployment steps

- Redeploy the frontend after confirming no demo credentials remain in environment variables.
- Apply the comprehensive SQL migration.
- Deploy the Edge Function with `GEMINI_API_KEY`, optional `GEMINI_MODEL`, and `APP_ORIGINS`.
- Run `supabase/tests/security_regression.sql` after migration.

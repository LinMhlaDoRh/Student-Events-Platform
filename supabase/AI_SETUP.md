# AI clustering setup

The clustering function is optional and administrator-only. Manual labels remain available if Gemini is disabled.

## Secrets

Set Edge Function secrets:

```bash
supabase secrets set GEMINI_API_KEY=<your-restricted-key>
supabase secrets set GEMINI_MODEL=gemini-2.0-flash
supabase secrets set APP_ORIGINS=https://student-events-platform.vercel.app,http://localhost:5173
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected by Supabase. Never put Gemini or service-role credentials in a `VITE_` variable.

## Deploy

```bash
supabase functions deploy cluster-suggestions
```

The function requires the comprehensive SQL migration because it claims and finishes analysis runs through protected database functions.

## Security behavior

- Only an authenticated database-backed administrator can claim a run.
- Two runs per administrator per hour are allowed.
- Only one run can execute at a time; stale locks expire after five minutes.
- At most 200 suggestions and 30,000 input characters are sent per run.
- Gemini receives delimited untrusted data and a zero-temperature JSON request.
- Every output ID and field is validated before a write.
- Provider details are not returned to the browser or written to ordinary logs.
- Requests time out after 20 seconds.

Student suggestion text is sent to Google. Publish an accurate privacy notice and do not use the AI feature for sensitive personal information.

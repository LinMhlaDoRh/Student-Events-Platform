# AI clustering setup

This wires the admin "Analyse Suggestions" button to Google Gemini through a
Supabase Edge Function. The function reads the un-clustered suggestions, sends
them to Gemini in one batched call, and returns suggested groupings that the
admin can accept or edit.

The key design point: the Gemini API key stays on the server. It's an Edge
Function secret, never a frontend variable, so it can't leak into the browser
bundle. The function also checks that the caller is a signed-in admin before it
does anything, so a student can't trigger paid AI calls.

## What you need

- The Supabase CLI, logged in and linked to your project.
- A Google AI Studio API key for Gemini.

## Steps

1. Set the secrets on your project:
   ```bash
   supabase secrets set GEMINI_API_KEY=your_key_here
   supabase secrets set GEMINI_MODEL=gemini-2.0-flash   # optional; this is the default
   ```
   Gemini's Flash models are a good fit here - they're fast, cheap, and more than
   capable of grouping short text. If Google renames or retires the default,
   point `GEMINI_MODEL` at a current Flash model without changing any code.

2. Deploy the function:
   ```bash
   supabase functions deploy cluster-suggestions
   ```

3. In the app, sign in as an admin, open the Suggestions page, and use
   "Analyse Suggestions". Review the groupings before saving - the AI does a
   first pass, the admin makes the call.

## Notes

- If the button returns an error, check the function logs
  (`supabase functions logs cluster-suggestions`). The usual causes are a missing
  `GEMINI_API_KEY` secret or an out-of-date model name.
- The function verifies the caller's admin role server-side, so it's safe to have
  the button visible only to admins in the UI and still trust the backend check.

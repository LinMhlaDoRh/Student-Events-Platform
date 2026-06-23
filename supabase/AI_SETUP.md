# AI Setup - Suggestion clustering & category tagging

This wires the admin **"Analyse Suggestions"** button to Google **Gemini 1.5 Flash**
via a Supabase **Edge Function**. The API key stays server-side (never in the app).

## 1. Database column
Run `supabase/phase3-ai.sql` in **Supabase -> SQL editor**. (Adds the `category` column.)

## 2. Get a Gemini API key
1. Go to **Google AI Studio**: aistudio.google.com/app/apikey
2. Create an API key (free tier is fine for < 500 students).

## 3. Deploy the Edge Function
The function lives in `supabase/functions/cluster-suggestions/`.

**Option A - Supabase CLI (recommended):**
```bash
# one-time
npm i -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# set the secret (do NOT commit your key)
supabase secrets set GEMINI_API_KEY=your_key_here

# deploy
supabase functions deploy cluster-suggestions
```

**Option B - Dashboard:** Edge Functions -> Create a function named
`cluster-suggestions`, paste in `index.ts`, then add the `GEMINI_API_KEY`
secret under Edge Functions -> Secrets.

> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
> injected automatically - you only set `GEMINI_API_KEY`.

## 4. Use it
Sign in as an admin -> **Suggestions** -> click **Analyse Suggestions**.
It batches all suggestions into one Gemini call, then fills in each row's
cluster label + category. Students then see grouped ideas ("N similar") in
their Community Suggestions feed.

## Notes
- Only authenticated **admins** can run it (checked inside the function).
- Re-running re-analyses everything - safe to run after each new batch of ideas.
- If the button errors, confirm the function is deployed and `GEMINI_API_KEY` is set.

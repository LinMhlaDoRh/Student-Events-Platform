# Student Events

Live: [student-events-platform.vercel.app](https://student-events-platform.vercel.app)

Campus event platform for Musgrave and uMhlanga. Students propose ideas, vote on active polls, RSVP to events, and leave feedback. SRC admins review demand and manage the event lifecycle.

## Stack

- React 19 + Vite
- Supabase (Auth, Postgres, RLS, Edge Functions)
- Vercel

## Features

- Student signup with campus selection (Musgrave / uMhlanga)
- Anonymous idea submission (one per active round)
- Polling on clustered ideas
- Event RSVP and post-event feedback
- SRC admin console for suggestions, events, feedback, and students
- Optional Gemini-assisted suggestion clustering (admin-only Edge Function)
- RLS-backed authorization; role changes are not client-writable

## Local setup

```bash
npm ci
cp .env.example .env
# set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

### Database

1. New project: run `supabase/fresh-install.sql`, then `supabase/migrations/20260711133000_comprehensive_security_remediation.sql`
2. Existing project: back up first, then apply the migration only
3. Apply dashboard settings in `docs/supabase-setup.md`
4. Optional AI: see `supabase/AI_SETUP.md`

### Admin accounts

Promote SRC admins only via the Supabase SQL editor. The schema allows at most two admins (one per campus). There is no in-app promotion path.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Static security checks |
| `npm run verify` | lint + test + build |

## Security notes

- Browser uses the public anon key only; RLS is the trust boundary
- Sensitive writes go through narrow Postgres RPCs
- Gemini and service-role keys stay in Edge Function secrets (never `VITE_*`)
- See `SECURITY.md` for the full model

## License

Private portfolio project. All rights reserved.

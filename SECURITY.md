# Security notes

This app is a student project, but it handles accounts and an admin role, so the
authorisation model is worth writing down. This is the reasoning behind how the
database is locked down, and the things I know are still soft spots.

## The model in one paragraph

Everything sensitive is enforced in Postgres with Row Level Security, not in the
React code. The front end is treated as untrusted - it runs on the user's
machine with a public anon key, so any check that only exists in JavaScript can
be bypassed by calling the Supabase API directly. The rule of thumb here: if a
rule matters, it lives in a policy or a trigger.

## Roles and how you become an admin

There are two roles, `student` and `admin`, stored on `public.users`. Two things
protect that column, because it's the only thing standing between a normal
student and full admin access:

1. **New users are always students.** The signup trigger (`handle_new_user`)
   hardcodes `role = 'student'`. It does not read the role from signup metadata.
   This matters because `auth.signUp()` is called from the browser with the
   public anon key, and the caller controls `options.data`. If the trigger
   trusted that metadata, anyone could sign up as an admin by adding
   `{ data: { role: 'admin' } }` to the request. So the role is simply never
   taken from the client.

2. **Nobody can change their own role.** A `BEFORE UPDATE` trigger
   (`prevent_role_change`) raises an exception if the `role` value changes and
   the caller isn't already an admin. Without it, the "users can update their own
   profile" policy would let a student run
   `update public.users set role = 'admin' where id = auth.uid()` straight from
   the client and promote themselves. The policy is intentionally kept simple;
   the trigger is the actual guard.

Admins are promoted by hand from the SQL editor (see README). That's a
deliberate trade-off: promotion is rare and high-stakes, so it's fine for it to
be a manual, audited step rather than something the app can do on its own.

### If you're upgrading an older database

The first version of `phase1-auth.sql` did trust the role from signup metadata
and did not have the role-change trigger, so both escalation paths above were
open. If your database was built from that version, run
`supabase/security-hardening.sql` once. It replaces the trigger, adds the guard,
and tightens the suggestions read policy without touching your data. It's also
worth checking whether any existing account was already given an unexpected
admin role:

```sql
select id, email, role, created_at from public.users where role = 'admin';
```

## Helper functions

`is_admin()` and `my_campus()` are `SECURITY DEFINER` so policies can look up the
caller's role and campus without recursing back through RLS on `public.users`.
Both pin `search_path = ''` and fully qualify every table name, which is the
standard way to keep a definer function from being tricked via search_path and
also clears the Supabase linter's "mutable search_path" warning.

## Secrets

- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are exposed to the
  browser. That's expected - the anon key is public and gated by RLS.
- The Gemini API key is a Supabase Edge Function secret (`GEMINI_API_KEY`). It
  is never a `VITE_` variable, because those get bundled into the client. The
  Edge Function also checks that the caller is an admin before it runs, so a
  student can't drive up the AI bill.
- `.env` is gitignored; `.env.example` ships with empty values only.

## Known limitations

I'd rather be honest about these than pretend the app is bulletproof.

- **Anonymous suggestions aren't cryptographically anonymous.** The `anonymous`
  flag only tells the UI to hide the author's name. The row itself still carries
  `submitted_by`, and RLS returns whole rows, so a technically-minded student who
  queries the API directly could still see who wrote a clustered suggestion.
  Postgres RLS can't mask a single column. Doing this properly would mean serving
  the community board through a view or an RPC that never selects `submitted_by`.
  That's the right next step if anonymity needs to be a real guarantee rather
  than a UI convenience.
- **The Edge Function uses a permissive CORS origin (`*`).** That's acceptable
  here because the function authenticates the caller and checks the admin role
  before doing any work, so an open origin doesn't grant anything. If this were
  handling anything more sensitive I'd lock the origin down to the deployed site.

## Reporting something

If you find a hole I've missed, please open an issue on the GitHub repo rather
than exploiting it against the live demo.

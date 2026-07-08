# Changes

This pass was a security and clean-up review. The headline items are the two
privilege-escalation fixes and filling in the database scripts that the repo was
missing.

## Security fixes

- **Signup no longer trusts the role from the client.** `handle_new_user()` in
  `phase1-auth.sql` used to copy `role` out of the signup metadata
  (`raw_user_meta_data ->> 'role'`). Since `auth.signUp()` runs in the browser
  with the public anon key, anyone could have signed up as an admin. The trigger
  now hardcodes `role = 'student'` and uses `on conflict (id) do nothing` so a
  re-fired trigger can't reset an existing profile.
- **Users can no longer change their own role.** Added the
  `prevent_role_change()` function and the `users_no_self_role_change` trigger.
  Previously the "update own profile" policy let a student promote themselves
  with a single update. This trigger was referenced by the README and
  `demo-seed.sql` but was never actually defined anywhere in the repo - so on a
  fresh database the demo seed would have errored. It exists now.
- **Hardened the helper functions.** `is_admin()` (and the new `my_campus()`) use
  `security definer set search_path = ''` with fully-qualified table names.
- **Tightened the suggestions read policy.** Students see their own suggestions
  plus any that have been clustered - not the whole table.
- **Removed a secret footgun from `.env.example`.** It listed `VITE_GEMINI_KEY`,
  which would have leaked the AI key into the public browser bundle. The Gemini
  key belongs server-side as an Edge Function secret; the file now says so.

## Missing database scripts added

The app and `demo-seed.sql` referenced tables that no SQL file in the repo
created. Anyone cloning the project couldn't stand it up. Added:

- `phase2-suggestions.sql` - the base suggestions table and its policies
- `phase4-voting.sql` - votes
- `phase5-events.sql` - events and RSVPs, plus the `my_campus()` helper
- `phase6-feedback.sql` - post-event feedback

All include their RLS policies, grants, and realtime publication setup, and are
ordered so the suggestions table exists before `phase2-anonymous.sql` and
`phase3-ai.sql` add columns to it.

## For an existing (already-deployed) database

- Added `security-hardening.sql`: an idempotent script that applies just the
  security fixes above to a live database without recreating tables or touching
  data. This is what to run on the current demo project.

## Housekeeping

- Pinned every dependency in `package.json` to a real version. They were all set
  to `"latest"`, which means two installs on different days could pull different
  (possibly breaking) versions. Pinned to the versions already in
  `package-lock.json`.
- Fixed stale "Gemini 1.5 Flash" references in the docs and the Edge Function
  comment; the code defaults to a current Gemini Flash model.
- Rewrote `README.md` and added `SECURITY.md`.
- Set a proper page `<title>` and description in `index.html`.

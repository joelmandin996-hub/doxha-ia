# Doxha Church — Mobile

Expo (React Native) mobile app for Doxha Church, backed by its own
Supabase project. `apps/web` and `apps/api` still run on PocketBase —
they haven't been migrated yet, so the mobile app currently has its own
separate data (members, groups, etc. entered on mobile won't show up on
web, and vice versa) until that migration happens too.

## Scope

Covers the core day-to-day flows: authentication, dashboard overview,
members (list/detail/create/edit), groups (list/detail/create/edit and
membership), events (list/detail/create/edit), follow-ups / suivis
(list/detail/create/edit, status changes, Kanban view), donations
(list/create), and an internal team chat (1:1, real-time). Advanced
web-only features — calendar month/week grids, communication templates,
social media, budget, and inventory — are not yet ported.

SMS sending is temporarily on hold: it goes through `apps/api`, which
still authenticates with PocketBase tokens the mobile app no longer has
now that it runs on Supabase Auth. The screen stays in place with a
clear "unavailable for now" message rather than being ripped out.

## Setup

**1. Supabase project**

You need a Supabase project with the schema from
`apps/mobile/supabase/schema.sql` already run in its SQL Editor — see
that file's header comment. It sets up: `members`, `groups`,
`group_members`, `evenements`, `suivis`,
`donations`, `conversations`, `chat_messages`, and a `profiles` table
mirroring `auth.users` (needed for the team chat's "pick a teammate"
list) — each with row-level security policies mirroring what the
PocketBase backend used to enforce.

**2. Create at least one staff account**

There's no sign-up screen — accounts are created directly in the
Supabase dashboard: **Authentication → Users → Add user**. Give it an
email and password; that's what you log into the app with. The `name`
shown in the app comes from that user's `user_metadata.name` if you set
one (optional — the app falls back to showing the email otherwise).

**3. Configure and run the app**

```bash
cd apps/mobile
npm install
cp .env.example .env
# then set:
#   EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
#   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon/publishable key>
npm start
```

Run on a device/simulator with `npm run ios` / `npm run android`, or scan
the QR code from `npm start` in the Expo Go app, then log in with the
account created in step 2.

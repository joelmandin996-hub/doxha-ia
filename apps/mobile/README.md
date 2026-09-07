# Doxha Church — Mobile

Expo (React Native) mobile companion to `apps/web`, talking to the same
PocketBase backend (`apps/pocketbase`).

## Scope

Covers the core day-to-day flows: authentication, dashboard overview,
members (list/detail/create/edit), groups (list/detail/create/edit and
membership), events (list/detail/create/edit), follow-ups / suivis
(list/detail/create/edit with status changes), and donations
(list/create). Advanced web-only features — the drag-and-drop Kanban
board, calendar month/week grids, communication templates, social media,
budget, and inventory — are not yet ported; the "Plus" tab and Suivis
list are where those would extend from next.

## Setup

```bash
cd apps/mobile
npm install
cp .env.example .env   # then set EXPO_PUBLIC_POCKETBASE_URL
npm start
```

`EXPO_PUBLIC_POCKETBASE_URL` must point at a reachable PocketBase
instance (e.g. `apps/pocketbase` run locally, or your deployed instance —
not the web app's `/hcgi/platform` proxy path, which only works for
same-origin browser requests).

Run on a device/simulator with `npm run ios` / `npm run android`, or scan
the QR code from `npm start` in the Expo Go app.

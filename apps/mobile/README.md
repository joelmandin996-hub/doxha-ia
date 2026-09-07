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

## Try it now (local, ~5 minutes)

You'll need Node 22 (see the repo's `.nvmrc`), a phone with the
**Expo Go** app installed, and the phone on the same Wi-Fi as your
computer.

**1. Start a local PocketBase backend with sample data**

```bash
cd apps/pocketbase
PB_ENCRYPTION_KEY=$(openssl rand -hex 16) \
PB_SUPERUSER_EMAIL=admin@doxha.church \
PB_SUPERUSER_PASSWORD='ChangeMe1234!' \
./pocketbase serve --dir=./pb_data_dev

# in a second terminal, once it's running:
cd apps/pocketbase && node scripts/seed-demo-data.js
```

This creates a demo login (`demo@doxha.church` / `Demo1234!`) and a
handful of sample members, groups, events, follow-ups and a donation
so the app isn't empty on first look. **Dev only** — never run the
seed script against a production database.

If `./pocketbase` isn't present yet, download the matching version
from the [PocketBase releases page](https://github.com/pocketbase/pocketbase/releases)
(check `apps/pocketbase/.pocketbase-version`) and place the binary
there.

**2. Point the app at it and start Expo**

```bash
cd apps/mobile
npm install
echo "EXPO_PUBLIC_POCKETBASE_URL=http://<your-computer-LAN-IP>:8090" > .env
npm start
```

Use your computer's LAN IP (not `localhost`) so your phone can reach
it — e.g. `192.168.1.23`. Find it with `ipconfig getifaddr en0` (macOS)
or `hostname -I` (Linux).

**3. Open it on your phone**

Scan the QR code Expo prints with the Expo Go app, then log in with
`demo@doxha.church` / `Demo1234!`.

## Setup (pointing at an already-running backend)

```bash
cd apps/mobile
npm install
cp .env.example .env   # then set EXPO_PUBLIC_POCKETBASE_URL
npm start
```

`EXPO_PUBLIC_POCKETBASE_URL` must point at a reachable PocketBase
instance — not the web app's `/hcgi/platform` proxy path, which only
works for same-origin browser requests.

Run on a device/simulator with `npm run ios` / `npm run android`, or scan
the QR code from `npm start` in the Expo Go app.

# 🏓 Pung Pong

**Retro-modern chat PWA with ping-pong messaging. All messages vanish after 48h.**

No cloud storage. Photos stored as base64 directly in Firestore.

## Architecture

```
GitHub Pages (Static PWA)
  └── React + Vite + TypeScript + Tailwind
       └── HashRouter (no 404 on GH Pages)
       └── Service Worker + Workbox (PWA installable)

Firebase Backend
  ├── Auth (Google Sign-In)
  ├── Firestore (all data + base64 photos + TTL on expireAt)
  ├── Cloud Functions v2 (message logic + hourly cleanup)
  └── FCM (Push Notifications)
```

## Features

| Feature | Details |
|---------|---------|
| 🏓 Ping-Pong | Send 1 msg → wait for reply → send again |
| ∞ Spam | Both toggle on → unlimited messaging |
| 📸 Once-Photo | Compressed base64, view once, tap to delete |
| ⏰ 48h TTL | Rules block reads + TTL + hourly cleanup |
| 🔗 Connect Code | Stable 8-char code per user |
| 👋 Nudge | Rate-limited (30s), with shake animation |
| 🎭 Presence | Online / Away / Busy / Invisible |
| 😊 Emoticons | Classic MSN shortcuts |
| 🔔 FCM Push | Messages, friend requests, nudges |
| 🌙 Themes | Dark / Light mode |
| 🔊 Sounds | Web Audio API beeps, toggleable |

## Setup

### 1. Firebase Project

```bash
npm install -g firebase-tools
firebase login
```

Enable in Firebase Console:
- **Authentication** → Google provider → Add authorized domain: `YOUR_USERNAME.github.io`
- **Cloud Firestore** → Create database
- **Cloud Functions** → Requires Blaze plan

### 2. Firestore TTL Policy

```bash
gcloud firestore fields ttls update expireAt \
  --collection-group=messages \
  --project=pung-pong
```

### 3. Deploy Backend

```bash
# Install function dependencies
cd functions && npm install && cd ..

# Deploy everything
firebase deploy --only firestore:rules,firestore:indexes,functions
```

### 4. Deploy Frontend

**Via GitHub Actions (recommended):**
1. Push to `main` → auto-deploys
2. Go to repo Settings → Pages → Source: "GitHub Actions"

**Update `web/vite.config.ts`** base path if needed:
```ts
base: "/pung-pong/"  // or "/" for root domain
```

### 5. Local Development

```bash
cd web && npm install && npm run dev
```

## 48h Deletion (4 Layers)

1. **Security Rules** — `request.time < resource.data.expireAt` → instant read-block
2. **Firestore TTL** — automatic physical deletion on `expireAt` field
3. **Scheduled Function** — hourly hard-delete + chat preview scrub
4. **Client Cache** — purge expired messages from IndexedDB on startup

**Note:** Firebase system backups may retain data temporarily. No additional logs/exports are generated.

## Photos (No Storage)

Photos are compressed client-side to ~400KB, converted to base64, and stored directly in the Firestore message document. This avoids needing Firebase Storage entirely. The Firestore document limit is ~1MiB, and compressed photos at 400KB base64 stay well under this.

Flow: Compress → base64 → Cloud Function validates size → stores in message doc → recipient views via transaction → second tap deletes base64 data from doc.

## Test Cases

1. Ping-Pong turn switching works
2. Spam handshake (both enable → unlimited)
3. Block prevents requests + messages
4. 48h expiry: rules deny reads
5. Scheduled cleanup deletes expired messages
6. Photo open: unopened → opened (transaction)
7. Photo delete: removes base64 from doc
8. Connect code uniqueness
9. Auto-accept mutual friend requests
10. FCM respects mute settings
11. Nudge rate limit (30s)
12. Presence updates on visibility change

## License

MIT

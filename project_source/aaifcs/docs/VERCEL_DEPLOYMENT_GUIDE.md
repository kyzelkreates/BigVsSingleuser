# Big V's Best Routes™ — Vercel Deployment Guide

**Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™**

> **Note:** This guide covers deployment configuration only. No live deployment has been performed and verified by this document. Follow each step and verify in your own Vercel project.

---

## Build Configuration

| Setting | Value |
|---|---|
| **Framework** | Vite (auto-detected) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm ci` |
| **Node.js Version** | 20.x (required — see `package.json` engines) |

These are already set in `vercel.json` at the project root.

---

## Required Environment Variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**.

| Variable | Required | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | For Live Mode | Your Supabase project URL. Safe to expose in frontend. |
| `VITE_SUPABASE_ANON_KEY` | For Live Mode | Your anon/public key. Safe to expose in frontend. |

> Demo Mode works without any environment variables.

## Optional Environment Variables

| Variable | Notes |
|---|---|
| `VITE_DEMO_MODE_DEFAULT` | Set to `true` (default) or `false` |
| `VITE_MAP_PROVIDER` | `osm` (default), `mapbox`, `google` |
| `VITE_GRAPHHOPPER_API_KEY` | GraphHopper route calculation (optional) |
| `VITE_MAPBOX_TOKEN` | Mapbox tile/routing provider (optional) |
| `VITE_OPENROUTER_API_KEY` | Client-side AI provider (optional) |
| `VITE_OLLAMA_BASE_URL` | Local Ollama endpoint (optional) |

See `.env.example` for the full reference list.

## ⛔ Variables That Must NEVER Appear in Vercel Frontend Variables

These must only be set in server-side environments (Supabase Edge Functions, Vercel Serverless Functions, etc.):

- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `JWT_SECRET`
- `PRIVATE_KEY`
- `WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `GROQ_API_KEY`
- `STRIPE_SECRET_KEY`
- Any admin token or backend-only secret

---

## Deployment Steps

### Option A — GitHub Integration (Recommended)

1. Push your project to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **Add New Project**.
3. Import your GitHub repository.
4. Vercel auto-detects Vite — verify **Build Command** = `npm run build` and **Output Directory** = `dist`.
5. Add environment variables (see above).
6. Click **Deploy**.
7. Every push to `main` triggers automatic redeployment.

### Option B — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## Demo Mode Deployment Behaviour

- No environment variables needed.
- All data is simulated using browser localStorage.
- Works immediately after deployment.
- Safe for public demo — no backend exposure.
- The PWA installs and works offline for static assets.

---

## Live Mode Deployment Behaviour

Requires:
1. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set in Vercel environment variables.
2. Supabase SQL schema deployed (see `docs/SUPABASE_LIVE_SETUP_GUIDE.md`).
3. A Supabase Auth account created for sign-in.
4. Demo Mode turned off in Settings → Demo / Live Mode.

After deployment:
- The app reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` automatically at startup.
- The Driver PWA on any device auto-connects to Supabase without needing Settings configuration.
- Live Mode requires sign-in via the Live Mode panel before writes are permitted.

---

## Supabase Configuration Steps (Post-Deploy)

1. Run SQL files in order (see `docs/SUPABASE_LIVE_SETUP_GUIDE.md`).
2. Create a Supabase Auth user.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel.
4. Redeploy (or use Vercel's instant redeploy — Vite bakes env vars at build time).
5. Open the deployed app and sign in via the Live Mode panel.

---

## PWA Install Validation Steps

1. Open the deployed URL in **Chrome** (desktop or Android).
2. Look for the install prompt in the browser address bar or browser menu.
3. Click **Install** — the app should open as a standalone window.
4. On **iOS Safari**: tap the Share button → **Add to Home Screen**.
5. On **Android Chrome**: tap the three-dot menu → **Install app** or **Add to Home Screen**.

### PWA Install Notes

- The Driver PWA opens at `/#/driver-app` (set in `manifest.webmanifest` as `start_url`).
- The dashboard is accessible at `/#/dashboard` after install.
- Installing the PWA twice (once for Driver, once for Dashboard) is not possible from a single URL — advise users to bookmark or use separate browser tabs for each role.
- PWA icons are solid dark-brand placeholder icons. Replace `public/icons/icon-192x192.png` and `public/icons/icon-512x512.png` with branded icons before final production launch.

---

## Offline Behaviour

- Static assets (HTML, CSS, JS, fonts) are cached by the Workbox service worker.
- OSM/OSRM map tiles are cached with a 7-day expiry.
- Supabase API requests use NetworkFirst with a 5-second timeout — falls back to cache.
- Supabase Realtime (WebSocket) uses NetworkOnly — cannot be cached.
- **Offline live actions** (GPS recording, report drafts) are saved locally only and require reconnection to sync to Supabase.
- Demo Mode works fully offline.

---

## Common Deployment Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| `404 on all routes` | SPA routing not configured | Confirm `vercel.json` has the catch-all route pointing to `/index.html` |
| `white screen / blank page` | Hash router issue with Vercel routing | Confirm `routes` block in `vercel.json` catches `(.*)` → `/index.html` |
| `Icons not loading (PWA install fails)` | `/icons/` not served | Confirm `public/icons/` contains `.png` files and `vercel.json` has the `/icons/` route |
| `Supabase connection fails` | Wrong URL or anon key | Re-check Supabase Dashboard → Project Settings → API |
| `RLS permission denied` | User not authenticated | Sign in via the Live Mode panel before reading/writing |
| `service_role required` | Bad SQL policy | Check policies in Supabase — no policy should require service_role in frontend |
| `Build fails: node version` | Wrong Node version | Set Node 20.x in Vercel project settings |
| `Build fails: npm ci` | Missing package-lock.json | Ensure `package-lock.json` is committed to Git |

---

## Secret Safety Warning

> **Never put `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `JWT_SECRET`, or any backend-only secret in Vercel's frontend environment variables.** These are exposed in the browser bundle. Use Supabase Row-Level Security (RLS) and the anon key instead — it is designed for browser-side use.

---

## Post-Deployment Checklist

- [ ] App loads at the Vercel URL
- [ ] Demo Mode works (no Supabase needed)
- [ ] PWA install prompt appears
- [ ] Icons load correctly in the installed PWA
- [ ] Service worker registered (DevTools → Application → Service Workers)
- [ ] Map renders correctly (OSM tiles load)
- [ ] If Live Mode: Supabase URL and anon key set as environment variables
- [ ] If Live Mode: SQL schema deployed
- [ ] If Live Mode: test connection passes in Settings → Backend
- [ ] If Live Mode: sign-in works via Live Mode panel
- [ ] If Live Mode: assignment created on Dashboard is visible in Driver PWA
- [ ] Advisory disclaimer visible in relevant screens

---

*Big V's Best Routes™ — Vercel Deployment Guide*
*This guide documents configuration only. Deployment must be performed and verified independently.*

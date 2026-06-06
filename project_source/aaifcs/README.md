# Big V's Best Routes™

> **Single-User · Multi-Vehicle · Safe & Legal Route Planner**
> Powered by **4P3X Intelligent AI™** | Created by **Kyzel Kreates™** | Part of the **4P3X Verse**

---

## What Is This?

**Big V's Best Routes™** is a single-user, multi-vehicle route planning PWA built for one owner/operator managing multiple different vehicles. It combines vehicle-aware route planning, advisory safety and legal checks, a Control Dashboard, an installable Navigation PWA, demo/live modes, and a Supabase-backed sync layer — all in a dark, mobile-first UI that installs as a native-style app on any device.

The platform is advisory by design. It does not replace the driver's professional judgement, road signage, or legal obligations. It makes planning safer, smarter, and more legally aware.

---

## Product Suite

| Product | Purpose |
|---|---|
| **Route Planner Dashboard** | Fleet operator HQ — plan routes, manage vehicles, assign jobs, monitor live sessions |
| **Navigation PWA** | Mobile-first navigation interface — open routes, GPS navigation, safety checklists, submit reports |
| **4P3X Intelligent AI™ Advisory** | AI-powered safety and legal compliance advisory layer — not a compliance guarantee |
| **Live Mode (Supabase)** | Real Supabase backend — live CRUD, RLS, realtime subscriptions, auth |
| **Demo Mode** | Zero-backend simulation — full product experience without any backend setup |

---

## Key Features

### Route Planning & Fleet Management
- Multi-vehicle fleet manager with vehicle profiles (type, weight, height, hazmat, PCN zones)
- Route planner with OSM 2D map + MapLibre GL JS 3D terrain rendering
- GraphHopper-powered route calculation with vehicle-aware constraint filtering
- Route scoring engine — safety, efficiency, compliance, driver history
- Route memory — learns preferred routes over time

### Navigation PWA
- Full mobile PWA — installs on Android and iOS as a standalone app
- GPS-assisted navigation with live position tracking
- Pre-trip safety checklist (mandatory acknowledgement gate before departure)
- Legal acknowledgement gate — operator/driver responsibility confirmed per trip
- Real-time job assignment inbox — receive, accept, start, complete
- Driver reports — incident logging, hazard flags, post-trip submission
- Offline-first — static assets cached by Workbox SW, queue-ready for live sync on reconnect

### 4P3X Intelligent AI™ Advisory Layer
- Multi-provider AI routing: OpenRouter, DeepSeek, Mistral, Anthropic, Gemini, Groq, Ollama (local)
- AI command panel — natural language route queries and safety analysis
- Safety engine — route hazard scoring, restriction detection, PCN zone flagging
- Compliance engine — vehicle-route legal suitability checks
- Efficiency engine — fuel, distance, and time optimisation
- Prediction engine — historical route performance modelling
- Driver learning — adapts to individual driver behaviour patterns
- Fleet learning — fleet-wide optimisation over time
- All advisory — no guarantee of legal compliance or route safety

### Live Mode (Supabase Backend)
- Full Supabase Auth integration — email/password, session management, token refresh
- 7 RLS-protected Supabase tables — all scoped to `auth.uid() = user_id`
- Live CRUD for vehicles, routes, assignments, trip sessions, driver reports, compliance checks, sync logs
- Realtime subscriptions — Dashboard updates live when Navigation PWA submits status changes
- Source mode isolation — `source_mode = 'live'` filter keeps live and demo data strictly separate
- VITE_ env var support — Navigation PWA auto-connects to Supabase on any device from build-time config
- Connection test — honest pass/fail/invalid-config feedback before Live Mode activation
- Masked anon key display — first 8 chars + `••••` in all UI panels

### Dashboard Operations
- Route Assignments panel — create, cancel, delete, live sync overlay
- Trip Sessions panel — live session monitoring, status history, driver report linking
- Driver Reports panel — review, flag, filter, export
- Live Status panel — connection state, auth state, realtime channel count, sync queue
- BV Mode Bar — global Demo/Live mode indicator visible across all pages
- Sync Summary — pending queue count, last sync timestamp

### Security & Architecture
- 4P3X API Config Guard™ — no backend-only secrets in frontend, ever
- Row-Level Security on all 7 Supabase tables — enforced at database level
- 0 anonymous write policies — all mutations require authenticated session
- No `service_role` key in frontend — anon key only
- Local auth service for Demo Mode — no Supabase dependency
- All API keys entered at runtime via Settings → stored in localStorage — never hardcoded

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS v3 |
| **PWA** | vite-plugin-pwa, Workbox (autoUpdate), Web App Manifest |
| **Routing** | React Router v6 (Hash Router — Vercel compatible) |
| **Maps** | MapLibre GL JS (3D), OSM tiles, OSRM routing |
| **Route Calculation** | GraphHopper API (optional key) |
| **State Management** | Zustand — SSOT via `core_storage.js` |
| **Backend / Auth** | Supabase (PostgreSQL, Auth, Realtime) |
| **AI Providers** | OpenRouter, DeepSeek, Mistral, Anthropic, Gemini, Groq, Ollama |
| **Deployment** | Vercel (static + PWA) |
| **Database** | Supabase PostgreSQL with full RLS |

---

## Architecture

```
BigVsSingleuser/
├── main.jsx                          ← App entry point
├── app_App.jsx                       ← Root app shell
├── app_Router.jsx                    ← Hash router + route definitions
├── core_storage.js                   ← SSOT — all Zustand stores
├── config_app.js                     ← App identity, branding, feature flags
├── config_routes.js                  ← Route definitions SSOT
│
├── pages_Dashboard.jsx               ← Fleet operator dashboard
├── pages_DriverApp.jsx               ← Navigation PWA shell
├── pages_Fleet.jsx                   ← Fleet management
├── pages_Vehicles.jsx                ← Vehicle profiles
├── pages_Drivers.jsx                 ← Driver management
├── pages_Navigation.jsx              ← Route map and navigation
├── pages_Dispatch.jsx                ← Job dispatch centre
├── pages_Safety.jsx                  ← Safety module
├── pages_Compliance.jsx              ← Compliance checks
├── pages_Analytics.jsx               ← Fleet analytics
├── pages_Settings.jsx                ← Backend config, API keys, mode toggle
├── pages_AI.jsx                      ← 4P3X AI command panel
├── pages_Incidents.jsx               ← Incident log
├── pages_Messaging.jsx               ← Driver messaging
│
├── modules_dashboard_BvOperations.jsx    ← Live assignments/sessions/reports panels
├── modules_live_LiveStatusPanel.jsx      ← Supabase connection + auth status
├── modules_status_BvModeBar.jsx          ← Global Demo/Live mode indicator
├── modules_driver_BvRouteNav.jsx         ← Driver navigation module
├── modules_driver_BvAssignmentInbox.jsx  ← Driver job inbox
│
├── services_supabase_supabaseClient.js   ← Supabase client + config
├── services_supabase_bvLiveService.js    ← 17 live CRUD functions
├── services_supabase_bvRealtimeService.js← Realtime subscriptions
├── services_supabase_bvSupabaseAdapter.js← Table/column mapping
├── services_supabase_authService.js      ← Local demo auth
│
├── hooks_useLiveData.js              ← React hooks for live Supabase data
├── hooks_useAuth.js                  ← Auth state hook
│
├── intel_safetyEngine.js             ← Safety scoring
├── intel_routeScoring.js             ← Route scoring
├── intel_efficiencyEngine.js         ← Efficiency analysis
├── intel_complianceEngine.js         ← Compliance checks
├── intel_predictionEngine.js         ← Performance prediction
│
├── services_ai_aiRouter.js           ← Multi-provider AI routing
├── services_ai_aiConfig.js           ← AI provider config
├── services_ai_aiModelRegistry.js    ← Model registry
│
├── services_maps_mapProviders.js     ← Map provider adapters
├── services_maps_runtimeKeys.js      ← Runtime API key store
├── services_routing_localRoutingEngine.js ← Local OSRM routing
│
├── public/
│   ├── icons/
│   │   ├── icon-192x192.png         ← PWA icon (replace with branded artwork)
│   │   └── icon-512x512.png         ← PWA icon (replace with branded artwork)
│   └── sw-job-sync.js               ← Background sync service worker
│
├── supabase/
│   ├── big-vs-best-routes-run10.sql            ← Core schema
│   ├── big-vs-best-routes-run11-live-mode.sql  ← Live Mode columns + realtime
│   ├── big-vs-best-routes-run12-live-hardening.sql ← Run 12 hardening patch (latest)
│   ├── big-vs-best-routes-run10.txt            ← Plain text copy (Run 10)
│   ├── big-vs-best-routes-run11.txt            ← Plain text copy (Run 11)
│   └── big-vs-best-routes-run12.txt            ← Plain text copy (Run 12, latest)
│
├── docs/
│   ├── SUPABASE_LIVE_SETUP_GUIDE.md
│   ├── VERCEL_DEPLOYMENT_GUIDE.md
│   ├── GITHUB_HANDOFF_CHECKLIST.md
│   ├── RUN_12_LIVE_MODE_VALIDATION_REPORT.md
│   ├── RUN_13_FINAL_PRODUCTION_READINESS_REPORT.md
│   ├── technical-handover-big-vs-best-routes.md
│   └── investor-demo-pack-big-vs-best-routes.md
│
├── index.html
├── vite.config.js                    ← Vite + VitePWA config
├── vercel.json                       ← Vercel SPA routing + security headers
├── tailwind.config.js
├── package.json
└── .env.example                      ← Safe public env vars template
```

---

## Build Runs

This project was built in structured, non-destructive runs. Each run had a specific scope, validation gates, and a final zip output.

| Run | Scope | Status |
|---|---|---|
| Run 1 | Rebrand + Single-User App Shell | ✅ Complete |
| Run 2 | Multi-Vehicle Manager + Vehicle Profile SSOT | ✅ Complete |
| Run 3 | Route Planner Dashboard + Route Records | ✅ Complete |
| Run 4 | OSM 2D + MapLibre 3D Map Layer | ✅ Complete |
| Run 5 | Navigation PWA GPS + Safe Navigation Workflow | ✅ Complete |
| Run 6 | Dashboard Sync · Assignments · Trip Sessions · Driver Reports | ✅ Complete |
| Run 7 | 4P3X Intelligent AI™ Safety + Legal Compliance Advisory | ✅ Complete |
| Run 8 | Backend-Ready Live Mode + Deployment Centre | ✅ Complete |
| Run 9 | Production Hardening + Investor Demo Pack + SQL Export | ✅ Complete |
| Run 10 | Real Supabase Connector + RLS-Ready Schema | ✅ Complete |
| Run 11 | Live Mode — Auth, Live CRUD, Realtime, Dashboard/PWA Sync | ✅ Complete |
| Run 12 | Live Mode Hardening + End-to-End Validation (50 gates) | ✅ Complete |
| Run 13 | Final Production Readiness + Deployment Validation (60 gates) | ✅ **FINAL** |

---

## Quick Start

```bash
# Install dependencies
npm install

# Run local dev server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

Requires **Node 20+** and **npm 9+**.

---

## Demo Mode (No Backend Required)

Demo Mode is the default. The full product experience runs entirely in the browser using localStorage — no Supabase account, no API keys, no configuration needed.

1. Run `npm run dev` or open the deployed URL.
2. Complete the first-run setup (create admin + driver accounts — stored locally).
3. Explore the Dashboard, create routes and vehicles, assign jobs, open the Navigation PWA.
4. All data persists in localStorage between sessions.

---

## Live Mode (Supabase Backend)

Full setup: see [`docs/SUPABASE_LIVE_SETUP_GUIDE.md`](docs/SUPABASE_LIVE_SETUP_GUIDE.md)

### Quick steps:
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, run the SQL files in order:
   - `supabase/big-vs-best-routes-run10.sql`
   - `supabase/big-vs-best-routes-run11-live-mode.sql`
   - `supabase/big-vs-best-routes-run12-live-hardening.sql`
3. Copy `.env.example` → `.env` and fill in:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Open the app → **Settings → Backend Configuration** → enter URL + anon key → **Test Connection**.
5. Go to **Settings → Demo / Live Mode** → switch to **Live Mode**.
6. Sign in via the **Live Mode panel** on the Dashboard.

> **Never use the `service_role` key in the frontend.** The anon key is designed for browser-side use and is protected by Row-Level Security.

---

## Deployment (Vercel)

Full guide: see [`docs/VERCEL_DEPLOYMENT_GUIDE.md`](docs/VERCEL_DEPLOYMENT_GUIDE.md)

```bash
# Deploy via Vercel CLI
npm install -g vercel
vercel --prod
```

Or connect your GitHub repo to [vercel.com](https://vercel.com) for automatic deployments on push.

**Required Vercel environment variables (for Live Mode):**

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your anon/public key |

Demo Mode works without any environment variables.

---

## Supabase Schema

All SQL is in `supabase/`. Plain text copies are in `supabase/*.txt` for easy copy-paste into Supabase SQL Editor.

### Tables (all RLS-enabled)

| Table | Purpose | RLS | Realtime |
|---|---|---|---|
| `bv_vehicles` | Vehicle fleet profiles | ✅ | ✅ |
| `bv_routes` | Planned routes | ✅ | ✅ |
| `bv_route_assignments` | Job assignments to drivers | ✅ | ✅ |
| `bv_trip_sessions` | Active/completed trip records | ✅ | ✅ |
| `bv_driver_reports` | Driver incident/post-trip reports | ✅ | ✅ |
| `bv_compliance_checks` | Vehicle-route legal checks | ✅ | ✅ |
| `bv_sync_logs` | Sync event audit log | ✅ | — |

**30 RLS policies. 0 anonymous write policies. All records scoped to `auth.uid() = user_id`.**

---

## Environment Variables

Copy `.env.example` to `.env`. All variables are frontend-safe `VITE_*` public keys.

```env
# Required for Live Mode
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# App mode
VITE_DEMO_MODE_DEFAULT=true

# Map providers (optional)
VITE_MAP_PROVIDER=osm
VITE_GRAPHHOPPER_API_KEY=
VITE_MAPBOX_TOKEN=

# AI providers (optional — client-safe keys only)
VITE_OPENROUTER_API_KEY=
VITE_DEEPSEEK_API_KEY=
VITE_MISTRAL_API_KEY=
VITE_ANTHROPIC_API_KEY=
VITE_GEMINI_API_KEY=
VITE_OLLAMA_BASE_URL=
```

**Never put `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `JWT_SECRET`, or any backend-only secret here.**

---

## PWA Install

### Android (Chrome)
1. Open the deployed URL in Chrome.
2. Tap the **three-dot menu** → **Install app** or **Add to Home Screen**.
3. The app installs as a standalone app opening at the Navigation PWA (`/#/driver-app`).

### iOS (Safari)
1. Open the deployed URL in Safari.
2. Tap the **Share** button (box with arrow).
3. Tap **Add to Home Screen**.
4. Name it **Big V Routes** and tap **Add**.

> **Note:** PWA icons are currently solid dark-brand placeholder PNGs. Replace `public/icons/icon-192x192.png` and `public/icons/icon-512x512.png` with properly branded artwork before public launch.

---

## Security

- **4P3X API Config Guard™** — no backend-only secrets in frontend, ever.
- Row-Level Security enforced at database level on all 7 tables.
- All mutations require an active Supabase Auth session (`auth.uid()`).
- No `service_role` key used in frontend code — confirmed by security scan.
- API keys entered at runtime via Settings UI, stored in localStorage, never hardcoded.
- Forbidden tokens (`SERVICE_ROLE_KEY`, `DATABASE_URL`, `JWT_SECRET`, etc.) present only in prohibition comments/documentation — never as actual values.

Security scan result (Run 13): **PASSED — No forbidden secrets in frontend code.**

---

## Advisory & Legal

> **Big V's Best Routes™ is advisory route-planning support only.**
>
> The platform does not guarantee legal compliance, route safety, or road restriction clearance.
>
> The driver/operator remains fully responsible for:
> - Checking live road signs and active restrictions
> - Confirming vehicle suitability for the planned route
> - Applying professional judgement at all times
> - Complying with all applicable road and transport law
>
> Route recommendations are based on available map data and AI analysis. Data freshness, third-party map accuracy, and local conditions may affect suitability. Human review and override are always required.
>
> Backend connectivity does not guarantee legal route safety.

---

## Documentation

| Document | Purpose |
|---|---|
| [`docs/SUPABASE_LIVE_SETUP_GUIDE.md`](docs/SUPABASE_LIVE_SETUP_GUIDE.md) | Full Supabase setup — RLS, SQL, auth, realtime, verify queries |
| [`docs/VERCEL_DEPLOYMENT_GUIDE.md`](docs/VERCEL_DEPLOYMENT_GUIDE.md) | Vercel deployment, env vars, PWA install, common errors |
| [`docs/GITHUB_HANDOFF_CHECKLIST.md`](docs/GITHUB_HANDOFF_CHECKLIST.md) | Pre-push security scan, files checklist, rollback guidance |
| [`docs/RUN_12_LIVE_MODE_VALIDATION_REPORT.md`](docs/RUN_12_LIVE_MODE_VALIDATION_REPORT.md) | Live Mode validation — all 50 gates |
| [`docs/RUN_13_FINAL_PRODUCTION_READINESS_REPORT.md`](docs/RUN_13_FINAL_PRODUCTION_READINESS_REPORT.md) | Final production readiness — all 60 gates |
| [`docs/technical-handover-big-vs-best-routes.md`](docs/technical-handover-big-vs-best-routes.md) | Full technical handover document |
| [`docs/investor-demo-pack-big-vs-best-routes.md`](docs/investor-demo-pack-big-vs-best-routes.md) | Investor/stakeholder demo pack |

---

## Branding

- **Product:** Big V's Best Routes™
- **AI Layer:** 4P3X Intelligent AI™
- **Creator:** Kyzel Kreates™
- **Product Line:** 4P3X Verse
- **Build Stage:** Run 13 — Final Production Readiness + Deployment Validation
- **Version:** 1.0.0

---

*Big V's Best Routes™ · Powered by 4P3X Intelligent AI™ · Created by Kyzel Kreates™*
*© Kyzel Kreates™ — All rights reserved.*

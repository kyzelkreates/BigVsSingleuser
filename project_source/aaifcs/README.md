# Big V's Best Routes™

**Single User · Multi-Vehicle · Safe & Legal Route Planner**

> Powered by **4P3X Intelligent AI™** — Created by **Kyzel Kreates™** — Part of the **4P3X Verse™**

---

## What Is It?

Big V's Best Routes™ is a vehicle-aware route planning platform built for single users who operate multiple vehicles — van drivers, motorhome owners, recovery drivers, trailer operators, and small delivery operators.

Standard sat nav plans routes for cars. It doesn't know your vehicle is 3.1m tall, weighs 3.5 tonnes, or is 7.2m long. It sends you under bridges, down narrow lanes, and across weight-restricted roads.

Big V's Best Routes™ builds the route around the vehicle — checking height clearances, weight limits, width suitability, and road type before you set off. The **4P3X Intelligent AI™** advisory layer adds compliance scoring, risk warnings, and route confidence scoring on top.

---

## Live URLs

| Surface | URL |
|---|---|
| **Live App** | [bigvssingleuser.vercel.app](https://bigvssingleuser.vercel.app) |
| **Homepage** | `/#/landing` |
| **Route Planner Dashboard** | `/#/dashboard` |
| **Navigation PWA Demo** | `/#/driver-app-demo` |
| **Navigation PWA (Live)** | `/#/driver-app` |
| **Safety & Investor Page** | `/#/investor-safety` |
| **Backend & Live Mode** | `/#/deployment` |

---

## GitHub Repos

| Repo | Purpose |
|---|---|
| [kyzelkreates/4p3xaibvs](https://github.com/kyzelkreates/4p3xaibvs) | Primary — full source + SQL + spec |
| [kyzelkreates/BigVsSingleuser](https://github.com/kyzelkreates/BigVsSingleuser) | Vercel-connected deploy repo |
| [kyzelkreates/bv1user](https://github.com/kyzelkreates/bv1user) | Mirror |

---

## Build Run History

| Run | Description | Output |
|---|---|---|
| Run 1 | Rebrand + Single-User App Shell Refactor | `BigVsBestRoutes_Run1.zip` |
| Run 2 | Multi-Vehicle Manager + Vehicle Profile SSOT Layer | `BigVsBestRoutes_Run2.zip` |
| Run 3 | Route Planner Dashboard + Route Records + Vehicle-Aware Planning Logic Shell | `BigVsBestRoutes_Run3.zip` |
| Run 4 | OSM 2D + MapLibre 3D Map Layer | `BigVsBestRoutes_Run4.zip` |
| Run 5 | Driver PWA GPS + Safe Navigation Workflow | `BigVsBestRoutes_Run5.zip` |
| Run 6 | Dashboard Sync · Route Assignments · Trip Sessions · Driver Reports | `BigVsBestRoutes_Run6.zip` |
| Run 7 | 4P3X Intelligent AI™ Safety + Legal Compliance Advisory Layer | `BigVsBestRoutes_Run7.zip` |
| Run 8 | Backend-Ready Live Mode + Deployment Centre | `BigVsBestRoutes_Run8.zip` |
| Run 9 | Production Hardening, Investor Demo Pack, Supabase SQL Export | `BigVsBestRoutes_Run9_Final.zip` |
| Run 10 | Real Supabase connector, backend config, connection testing, RLS-ready schema | — |
| Run 11 | Live Mode: Supabase Auth/session, live CRUD, dashboard/PWA live data flow, realtime subscriptions | `BigVsBestRoutes_Run11.zip` |
| Run 12 | Live Mode hardening + end-to-end validation (50 gates) | `BigVsBestRoutes_Run12.zip` |
| Run 13 | Production Readiness — build validation, PWA icons, deployment docs, 60 gates | `BigVsBestRoutes_Run13.zip` |
| Run 14 | Investor/Safety page, homepage rebuild, Navigation PWA demo, bridge strike data | — |

---

## Architecture Overview

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3 |
| **State** | Zustand (SSOT via `core_storage.js`) |
| **Routing** | React Router DOM v6 (hash router) |
| **Maps** | Leaflet / react-leaflet (2D), MapLibre GL (3D) |
| **Routing Engine** | GraphHopper, OSRM, Google Maps (configurable) |
| **AI Layer** | OpenAI, Groq, DeepSeek, OpenRouter (multi-provider) |
| **Backend** | Supabase (primary), Firebase, AWS, REST (configurable) |
| **PWA** | vite-plugin-pwa, Workbox (offline-capable, installable) |
| **Deployment** | Vercel (auto-deploy from GitHub) |

### Application Layers

```
Big V's Best Routes™
│
├── Homepage / Landing         /#/landing
├── Route Planner Dashboard    /#/dashboard
├── Vehicle Profiles           /#/fleet
├── Route Planning             /#/dispatch
│
├── Navigation PWA (live)      /#/driver-app
│   ├── SetupScreen (pairing code gate)
│   ├── LoginScreen (PIN gate)
│   └── DriverAppMain
│       ├── Map tab (Leaflet / Google Maps)
│       ├── Safety tab
│       ├── Jobs tab
│       └── AI Chat tab
│
├── Navigation PWA Demo        /#/driver-app-demo
│   ├── No pairing code required
│   ├── Torquay → Edinburgh demo route
│   ├── Route & Warnings tab
│   ├── Map View tab (OSM polyline)
│   ├── Pre-Trip Checklist tab
│   └── AI Advisory tab
│
├── Navigation PWA Setup       /#/driver-setup
│   ├── Pairing code generator (APXS- tokens)
│   ├── QR / NFC / WhatsApp / email share
│   └── Driver telemetry feed
│
├── Safety & AI                /#/safety
├── Legal Awareness            /#/compliance
├── 4P3X AI Command            /#/ai
├── Journey Analytics          /#/analytics
├── Incidents                  /#/incidents
├── Backend & Live Mode        /#/deployment
├── Safety & Investor Page     /#/investor-safety
└── Settings                   /#/settings
```

---

## Core Files

### State (SSOT)
| File | Purpose |
|---|---|
| `core_storage.js` | Single Source of Truth — all Zustand stores (vehicles, drivers, routes, nav sessions, backend config) |

### Pages
| File | Route | Description |
|---|---|---|
| `pages_Landing.jsx` | `/#/landing` | Full homepage — 11 sections, all shortcuts |
| `pages_Dashboard.jsx` | `/#/dashboard` | Main route planner control centre |
| `pages_DriverApp.jsx` | `/#/driver-app` | Full Navigation PWA (live, pairing required) |
| `pages_DriverAppDemo.jsx` | `/#/driver-app-demo` | Demo Navigation PWA (no pairing code) |
| `pages_DriverSetup.jsx` | `/#/driver-setup` | PWA pairing code generator + driver management |
| `pages_Fleet.jsx` | `/#/fleet` | Saved vehicles list |
| `pages_Vehicles.jsx` | `/#/vehicles` | Vehicle profile management |
| `pages_Dispatch.jsx` | `/#/dispatch` | Route planning |
| `pages_Safety.jsx` | `/#/safety` | Safety AI dashboard |
| `pages_Compliance.jsx` | `/#/compliance` | Legal awareness / compliance |
| `pages_AI.jsx` | `/#/ai` | 4P3X AI Command panel |
| `pages_Analytics.jsx` | `/#/analytics` | Journey analytics |
| `pages_InvestorSafety.jsx` | `/#/investor-safety` | Investor & bridge strike impact page |
| `pages_Deployment.jsx` | `/#/deployment` | Backend config + live mode |

### Services
| Layer | Files | Purpose |
|---|---|---|
| **AI** | `services_ai_aiRouter.js`, `services_ai_aiProviderManager.js`, `services_ai_aiModelRegistry.js`, `services_ai_aiConfig.js`, `services_ai_aiFallbackSystem.js`, `services_ai_aiUsageTracker.js`, `services_ai_bvAdvisoryEngine.js`, `services_ai_localAIOrchestrator.js` | Multi-provider AI routing — OpenAI / Groq / DeepSeek / OpenRouter |
| **Maps** | `services_maps_mapService.js`, `services_maps_mapProviders.js`, `services_maps_routeGeometry.js`, `services_maps_runtimeKeys.js` | Map provider abstraction — OSM / GraphHopper / Google Maps |
| **Routing** | `services_routing_localRoutingEngine.js`, `services_routing_routeCache.js` | Vehicle-aware local routing engine |
| **Supabase** | `services_supabase_supabaseClient.js`, `services_supabase_authService.js`, `services_supabase_bvLiveService.js`, `services_supabase_bvRealtimeService.js`, `services_supabase_bvSupabaseAdapter.js` | Supabase live backend integration |
| **Sync** | `services_sync_liveSync.js`, `services_sync_driverSyncService.js`, `services_sync_bvSyncService.js`, `services_sync_syncVerificationService.js` | Demo/live sync + driver pairing |
| **Safety** | `services_safety_safetyService.js`, `services_safety_offlineVault.js`, `services_safety_routeMemory.js`, `services_safety_visionAI.js`, `services_safety_syncService.js` | Safety incident tracking + offline vault |
| **Fleet** | `services_fleet_fleetService.js`, `services_vehicles_vehicleService.js` | Vehicle management |
| **Execution** | `services_execution_jobExecutionService.js`, `services_pwa_jobSyncService.js` | Job execution control layer |
| **Federation** | `services_federation_pairingEngine.js`, `services_federation_tenantRegistry.js`, `services_federation_telemetryQueue.js`, `services_federation_syncPayload.js` | APXS pairing code engine |
| **Demo** | `services_demo_demoRoute.js` | SSOT demo route data (Torquay → Edinburgh) |

### Intelligence (Intel) Engines
| File | Purpose |
|---|---|
| `intel_safetyEngine.js` | Vehicle height / weight / width hazard scoring |
| `intel_complianceEngine.js` | Legal suitability scoring engine |
| `intel_routeScoring.js` | Route confidence + composite safety score |
| `intel_aiOrchestrator.js` | AI provider orchestration |
| `intel_predictionEngine.js` | Predictive routing & hazard prediction |
| `intel_efficiencyEngine.js` | Route efficiency scoring |
| `intel_graphhopperAdapter.js` | GraphHopper API adapter |
| `intel_routeMemory.js` | Route history & memory |
| `intel_driverLearning.js` | Driver behaviour learning |
| `intel_fleetLearning.js` | Fleet-level pattern learning |

---

## Demo Mode vs Live Mode

### Demo Mode (default)
- No backend configuration required
- Navigation PWA opens without a pairing code
- All safety advisory panels fully functional
- Torquay → Edinburgh demo route preloaded
- Safe for investor demos and presentations

### Live Mode
- Requires backend provider configuration (Supabase / Firebase / AWS / REST)
- Navigation PWA requires APXS- pairing code from dashboard
- Full sync: routes, jobs, telemetry, driver reports
- Row-level security (RLS) enforced on all Supabase tables
- Switch between demo and live at any time via `/#/deployment`

### Demo/Live SSOT
The `isLiveSyncActive` gate in `core_storage.js` enforces 5 conditions before activating live sync:
1. Demo Mode is OFF
2. A non-local backend provider is selected
3. The provider has passed a connection test (`testPassed`)
4. The provider has a valid URL/key configured
5. Local fallback is not the only active option

---

## Supabase SQL Schema

All SQL is in the `/sql/` directory and as a combined file.

| File | Layer | Tables / Objects Created |
|---|---|---|
| `sql_1_original_schema.txt` | **Layer 1 — Base Schema** | `profiles`, `drivers`, `vehicles`, `tasks`, `job_assignments`, `driver_locations`, indexes, triggers, RLS |
| `sql_2_pwa_sync_additions.txt` | **Layer 2 — Views & Helpers** | `active_drivers` view, `push_subscriptions`, `task_status_counts` view |
| `sql_3_contract_tables.txt` | **Layer 3 — Contract Tables** | `fleet_nodes`, `dashboard_events`, `settings`, Realtime publications |
| `sql_4_job_execution_layer.sql` | **Layer 4 — Job Execution** | `job_execution_state`, `job_stop_progress`, `job_interruptions`, `offline_event_queue` |
| `sql_5_driver_safety_layer.sql` | **Layer 5 — Driver Safety** | `safety_incidents`, `route_replay_events`, `driver_safety_scores` |
| `sql_6_federation_layer.sql` | **Layer 6 — Federation** | `pairing_codes`, extends `fleet_nodes` for federation identity |
| `sql_COMPLETE_ALL_LAYERS.txt` | **All 6 Layers Combined** | Full schema in one file — run this if starting fresh |

### Running the Schema

**Option A — Full combined (recommended for new projects):**
1. Open Supabase SQL Editor
2. Paste the contents of `sql_COMPLETE_ALL_LAYERS.txt`
3. Run

**Option B — Layer by layer:**
1. Run `sql_1_original_schema.txt`
2. Run `sql_2_pwa_sync_additions.txt`
3. Run `sql_3_contract_tables.txt`
4. Run `sql_4_job_execution_layer.sql`
5. Run `sql_5_driver_safety_layer.sql`
6. Run `sql_6_federation_layer.sql`

All statements use `IF NOT EXISTS` — safe to re-run.

---

## Database Tables Reference

### Core Tables (Layer 1)

| Table | Purpose |
|---|---|
| `profiles` | Supabase auth user profiles — links `auth.users` to app roles |
| `drivers` | Driver records — status, online flag, current task |
| `vehicles` | Vehicle configuration — height, weight, width, length, type |
| `tasks` | Route jobs — full lifecycle state machine |
| `job_assignments` | Audit record for every task assignment event |
| `driver_locations` | Real-time GPS per driver — upserted every 5 seconds |

### Task Lifecycle State Machine
```
pending → assigned → accepted → in_progress → completed
                                              ↘ cancelled
```

### Views (Layer 2)

| View | Purpose |
|---|---|
| `active_drivers` | Joined query: driver + GPS + current task + vehicle |
| `task_status_counts` | Fast count by status/priority for dashboard tabs |

### Contract Tables (Layer 3)

| Table | Purpose |
|---|---|
| `fleet_nodes` | Live vehicle telemetry layer (separate from `vehicles` config) |
| `dashboard_events` | Dispatcher audit log — task lifecycle events |
| `settings` | Fleet-wide key-value operator settings |

### Execution & Safety Tables (Layers 4–5)

| Table | Purpose |
|---|---|
| `job_execution_state` | Per-job per-driver execution tracking |
| `job_stop_progress` | Progress through each stop in a multi-stop job |
| `job_interruptions` | Interruption events during job execution |
| `offline_event_queue` | Queued events when driver is offline |
| `safety_incidents` | Safety events — hazards, harsh braking, fatigue alerts |
| `route_replay_events` | Full route replay telemetry store |
| `driver_safety_scores` | Aggregated driver safety scoring |

### Federation Tables (Layer 6)

| Table | Purpose |
|---|---|
| `pairing_codes` | APXS- pairing code store — dashboard generates, PWA validates |

---

## Environment Variables

Copy `.env.example` and fill in your values:

```env
# Map provider API keys (optional — free tier fallback available)
VITE_GRAPHHOPPER_API_KEY=your_graphhopper_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Supabase (public/client-safe values only — NEVER service role key)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# AI providers (optional — falls back to local logic if not set)
VITE_OPENAI_API_KEY=your_openai_key
VITE_OPENROUTER_API_KEY=your_openrouter_key
VITE_GROQ_API_KEY=your_groq_key
```

> ⚠️ **Security rule:** Only public/client-safe keys belong here. Never put a Supabase service role key, JWT secret, or any backend-only secret in a `.env` file accessible to the frontend.

---

## Getting Started (Local Dev)

```bash
# 1. Clone
git clone https://github.com/kyzelkreates/4p3xaibvs.git
cd 4p3xaibvs/project_source/aaifcs

# 2. Install
npm ci

# 3. Environment (optional — app runs in demo mode without any keys)
cp .env.example .env
# Edit .env with your keys if needed

# 4. Run
npm run dev

# 5. Build
npm run build

# 6. Preview built output
npm run preview
```

App runs at `http://localhost:5173` in demo mode by default. No backend required.

---

## Deployment

### Vercel (recommended)

1. Connect [github.com/kyzelkreates/4p3xaibvs](https://github.com/kyzelkreates/4p3xaibvs) to Vercel
2. Set root directory to `project_source/aaifcs`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables in Vercel dashboard (optional)
6. Deploy — Vercel auto-deploys on every push to `main`

The `vercel.json` in `project_source/aaifcs/` is pre-configured with SPA fallback routing, asset caching, and PWA service worker headers.

### Manual / Other Hosts

```bash
npm run build
# Upload contents of dist/ to any static host
# All routes must fall back to index.html (SPA routing)
```

---

## PWA Installation

### Android / Chrome
Open the app → tap ⋮ menu → **"Add to Home Screen"** or tap the install banner.

### iOS / Safari
Open the app in Safari → tap **Share (□↑)** → scroll down → **"Add to Home Screen"** → **"Add"**.

Once installed: full-screen, offline-capable, no app store required.

---

## Navigation PWA Pairing

The Navigation PWA requires a pairing code (APXS- token) to connect to the dashboard in **Live Mode**.

1. Open **Route Planner Dashboard** → **Navigation PWA Setup** (`/#/driver-setup`)
2. Generate a pairing code — copy or share via QR / NFC / WhatsApp / email
3. On the mobile device, open `/#/driver-app`
4. Paste the APXS- code → pair → set name and PIN
5. The PWA is now linked to the dashboard and syncs routes, jobs and telemetry

In **Demo Mode**, no pairing code is required — open `/#/driver-app-demo` directly.

---

## Safety & Legal Advisory

> **Important — read before use:**

Big V's Best Routes™ is **advisory route-planning support software**. It does not:
- Guarantee legal compliance with any road restriction
- Guarantee vehicle suitability for any specific route
- Remove driver or operator legal responsibility
- Replace professional advice or official guidance

The AI advisory layer (4P3X Intelligent AI™) provides informational scoring and risk flagging based on available data. Data freshness and accuracy vary.

**Always:**
- Follow road signs and official restrictions
- Follow police and traffic management instructions
- Use your own judgement — human override is always correct
- Check live conditions before and during every journey

---

## Bridge Strike Facts

Referenced on the Safety & Investor page (`/#/investor-safety`):

| Stat | Value | Source |
|---|---|---|
| Bridge strikes | 1,666 incidents | Network Rail 2024/25 |
| Average cost per strike | ~£13,000 | Network Rail estimates |
| Delay minutes caused | 150,000+ | Network Rail 2023/24 |
| Estimated annual UK impact | ~£20 million | Industry estimates |

Vehicle-aware route planning is designed to reduce bridge strike risk by surfacing clearance warnings before the driver commits to a route.

---

## 4P3X Verse™ Modular Architecture

Big V's Best Routes™ is part of the **4P3X Verse™** — a modular product architecture where one structured base is refactored into multiple sector-ready products without rebuilding from scratch.

The same dashboard + PWA + AI advisory + demo/live mode + backend config architecture can be adapted into:
- Safety inspection and evidence reporting tools
- Delivery management and owner-driver route systems
- Field-service navigation and job dispatch apps
- Compliance reporting and advisory platforms

Each variant inherits the core and adapts only what the sector needs.

---

## File Structure

```
project_source/aaifcs/
│
├── index.html                          SPA entry point
├── main.jsx                            React root mount
├── app_App.jsx                         Root app component + AuthProvider
├── app_Router.jsx                      React Router config (hash router)
├── core_storage.js                     SSOT — all Zustand state stores
├── config_routes.js                    Route registry
├── config_app.js                       App config
│
├── pages_Landing.jsx                   Homepage (11 sections)
├── pages_Dashboard.jsx                 Route Planner Dashboard
├── pages_DriverApp.jsx                 Navigation PWA (live)
├── pages_DriverAppDemo.jsx             Navigation PWA (demo)
├── pages_DriverSetup.jsx               PWA pairing + driver management
├── pages_Fleet.jsx                     Saved vehicles
├── pages_Vehicles.jsx                  Vehicle profiles
├── pages_Dispatch.jsx                  Route planning
├── pages_Safety.jsx                    Safety AI
├── pages_Compliance.jsx                Legal awareness
├── pages_AI.jsx                        AI Command panel
├── pages_Analytics.jsx                 Journey analytics
├── pages_Deployment.jsx                Backend & live mode config
├── pages_InvestorSafety.jsx            Safety & investor page
├── pages_Settings.jsx                  Settings
├── pages_Incidents.jsx                 Incident management
├── pages_Navigation.jsx                Live map
├── pages_AP3X.jsx                      AP3X control panel
│
├── services_*/                         All service layer files (50 files)
├── modules_*/                          All UI module components (28 files)
├── intel_*/                            Intelligence engine files (10 files)
├── layouts_*/                          Layout components (AppShell, Sidebar, TopNav)
├── components_*/                       Shared UI components
├── hooks_*/                            React hooks
├── providers_*/                        Context providers
├── utils_*/                            Utilities
│
├── sql_1_original_schema.txt           Layer 1 — Base schema
├── sql_2_pwa_sync_additions.txt        Layer 2 — Views & helpers
├── sql_3_contract_tables.txt           Layer 3 — Contract tables
├── sql_4_job_execution_layer.sql       Layer 4 — Job execution
├── sql_5_driver_safety_layer.sql       Layer 5 — Driver safety
├── sql_6_federation_layer.sql          Layer 6 — Federation
├── sql_COMPLETE_ALL_LAYERS.txt         All 6 layers combined
├── supabase_schema.sql                 Supabase-specific schema notes
│
├── vercel.json                         Vercel deployment config
├── vite.config.js                      Vite + PWA build config
├── tailwind.config.js                  Tailwind config
├── package.json                        Dependencies
├── .env.example                        Environment variable template
└── public/
    └── sw-job-sync.js                  PWA background sync service worker
```

---

## Credits

- **Product:** Big V's Best Routes™
- **AI Layer:** 4P3X Intelligent AI™
- **Creator:** Kyzel Kreates™
- **Architecture:** 4P3X Verse™
- **Maps:** OpenStreetMap contributors, Leaflet, MapLibre GL
- **Routing:** GraphHopper, OSRM, Google Maps
- **Backend:** Supabase
- **Deployment:** Vercel

---

*Advisory software only. Not legal advice. Not a guarantee of route safety or compliance. Always follow road signs, official restrictions, and real-world conditions. Driver and operator responsibility is always primary.*

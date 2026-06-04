# Big V's Best Routes™ — Technical Handover Document
**Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™**
**Version: 1.0.0 — Run 9 Final**

---

## App Architecture Summary

Big V's Best Routes™ is a **single-page React application** (Vite + React 18 + Zustand) built with a **flat file structure** — all source files live in the project root with `_` as namespace separators (`pages_Dashboard.jsx`, `services_sync_bvSyncService.js`, etc.).

```
Architecture:
  Browser → React SPA (Vite) → Local-first SSOT (Zustand/localStorage)
                              → OSM/MapLibre maps (Leaflet/MapLibre GL)
                              → Driver PWA (same app, /driver-app route)
                              → [Future] Supabase/Firebase/custom backend
```

- **No backend currently required** — fully local-first for demo.
- **Hash router** (`createHashRouter`) — works on any static host.
- **PWA-ready** — Vite PWA plugin, service worker (`sw-job-sync.js`).
- **Tailwind CSS** — utility-first. Dark theme. Custom gold/silver accents.
- **Zustand** — all state via `core_storage.js` stores.

---

## Local-First SSOT Summary

**File:** `core_storage.js`

All state is managed by Zustand stores. Every store persists its slice to localStorage via a `persist` helper.

| Store | localStorage key | Purpose |
|-------|-----------------|---------|
| `useAppStore` | `apex:app:*` | Theme, sidebar, locale |
| `useAuthStore` | `apex:auth:*` | Auth session (placeholder) |
| `useFleetStore` | `apex:fleet:*` | Legacy fleet filters |
| `useMapStore` | `apex:map:*` | Map provider, center, zoom |
| `useNavStore` | `apex:nav:*` | Navigation session, GPS state |
| `useAssignmentStore` | `bigv:assignments` | Route assignments |
| `useTripSessionStore` | `bigv:tripSessions` | Trip sessions |
| `useDriverReportStore` | `bigv:driverReports` | Driver reports |
| `useSyncQueueStore` | `bigv:syncQueue` | Pending sync queue |
| `useAuditStore` | `bigv:auditEvents` | Full audit event trail |
| `useSyncStatusStore` | `bigv:syncStatus` | Last sync metadata |
| `useAiAdvisoryStore` | `bigv:ai*` | AI findings, advisory snapshot, agent runs |
| `useVehicleStore` | `bigv:vehicles` + `bigv:activeVehicleId` | Vehicle profiles |
| `useRouteStore` | `bigv:routes` + `bigv:activeRoute` | Route plans |
| `useAIStore` | `apex:ai:*` | AI provider config (LLM, not advisory) |
| `useDriverStore` | `apex:driver:*` | Driver session (legacy) |
| `useBackendConfigStore` | `bigv:backendConfig` | Backend provider config (safe public fields only) |
| `useDeploymentChecklistStore` | `bigv:deployChecklist` | Production checklist |

**SSOT rules:**
- All mutations go through store actions — never direct `localStorage.setItem`.
- No component-local state for persistent data.
- `persist.get(key, fallback)` / `persist.set(key, value)` wrapper handles JSON parse/stringify.

---

## Demo / Live Mode Behaviour

Controlled by `useBackendConfigStore.config.demoMode` (stored at `bigv:backendConfig`).

| Mode | Behaviour |
|------|-----------|
| Demo (`demoMode: true`) | Local/demo data. AI output labelled "Demo AI advisory output — not for real driving." Sync is simulated locally. |
| Live, no backend | Saves locally. Queue grows. Warning shown: "Live Mode is on, but no backend is configured yet." |
| Live, backend configured | Provider test passes. Health check available. Real sync connector still needs server-side implementation. |

---

## Dashboard Modules

| File | Purpose |
|------|---------|
| `pages_Dashboard.jsx` | Main dashboard page (~1980 lines). Vehicles, routes, assignments, analytics, ops panels. |
| `modules_dashboard_BvOperations.jsx` | Run 6 ops panel: assignments, trip sessions, driver reports, sync now. |
| `modules_dashboard_BvAiOverview.jsx` | Run 7 AI Oversight Centre: Agent 1 + 2, findings, human review checklist. |
| `modules_dashboard_BvAboutPanel.jsx` | Run 9 About/Demo Guide: 12-step demo flow, features, advisory wording. |
| `pages_Deployment.jsx` | Run 8 Backend & Deployment Centre: demo/live, provider setup, API guard, sync, PWA readiness, checklist. |
| `pages_Vehicles.jsx` | Vehicle manager: type-template form, add/edit/delete/set active. |
| `pages_Dispatch.jsx` | Route planner: origin/destination, vehicle-aware advisory, draft routes. |
| `pages_Navigation.jsx` | OSM 2D + MapLibre 3D map page. |
| `pages_Safety.jsx` | Safety intelligence overview. |
| `pages_Compliance.jsx` | Legal awareness overview. |
| `pages_Settings.jsx` | Settings: profile, map, AI, backend options, safety notes. |

---

## Driver PWA Modules

| File | Purpose |
|------|---------|
| `pages_DriverApp.jsx` | Driver PWA shell: tabs (Route, Map, Status, Info), pairing, GPS map. |
| `modules_driver_BvRouteNav.jsx` | Core Driver PWA navigation module (~1050 lines): HomeScreen, ChecklistScreen, RouteReviewScreen, NavigationScreen, BvAssignmentInbox, BvAiAdvisory. |
| `modules_driver_BvAssignmentInbox.jsx` | Run 6 Assignment Inbox: assignment list, report form (12 types), PWA sync button. |
| `modules_driver_BvAiAdvisory.jsx` | Run 7 compact AI advisory panel: priority-ranked findings, detail sheet, refresh button. |

---

## Data Entities

| Entity | Store | Backend table suggestion | Sync direction |
|--------|-------|--------------------------|----------------|
| Vehicle Profiles | `useVehicleStore` | `bv_vehicles` | Dashboard → Backend |
| Route Plans | `useRouteStore` | `bv_route_plans` | Dashboard → Backend |
| Route Assignments | `useAssignmentStore` | `bv_route_assignments` | Dashboard + PWA → Backend |
| Trip Sessions | `useTripSessionStore` | `bv_trip_sessions` | PWA → Backend → Dashboard |
| Driver Reports | `useDriverReportStore` | `bv_driver_reports` | PWA → Backend → Dashboard |
| Sync Queue | `useSyncQueueStore` | `bv_sync_queue` | Internal |
| Audit Events | `useAuditStore` | `bv_audit_events` | Dashboard → Backend |
| AI Findings | `useAiAdvisoryStore.findings` | `bv_ai_findings` | Dashboard → Backend |
| AI Advisory Snapshot | `useAiAdvisoryStore.advisory` | `bv_ai_advisory_runs` | Dashboard → Backend |
| Backend Config | `useBackendConfigStore` | `bv_user_settings` | Local only (no secrets) |

---

## Sync Flow

```
Local Change
  → useXxxStore action (e.g. createAssignment)
  → useSyncQueueStore.enqueue(entityType, entityId, action, payload)
  → Queue item: { status: 'pending', entityType, entityId, demoMode }
  
Sync Now (manual)
  → services_sync_bvSyncService.js: runSyncNow()
  → Reads sync queue
  → If demo mode: marks as local-synced, no backend call
  → If live mode + no backend: stays pending, honest message
  → If live mode + backend configured: backend-ready (real API connector needed)
  → Records audit event: syncPrepared / syncCompleted
```

**Real backend sync requires:** server-side function reading `bigv:syncQueue`, iterating items, calling `supabase.from(table).upsert(payload)`, updating queue item status.

---

## Map Provider Setup

| Provider | File | Notes |
|----------|------|-------|
| OSM tiles | `services_maps_mapService.js` | Free, no key required. Default. |
| MapLibre GL | `modules_navigation_ApexMap.jsx` | 3D rendering. `VITE_MAPBOX_TOKEN` optional for premium tiles. |
| GraphHopper | `services_maps_runtimeKeys.js` + `services_settings_appSettingsService.js` | Routing geometry. Requires API key (entered in Settings). |
| OSRM | `services_routing_localRoutingEngine.js` | Fallback routing. Can run self-hosted. |
| Leaflet | `modules_navigation_RouteMap.jsx` | 2D map rendering in Driver PWA. |

---

## GPS Behaviour

**Service:** `modules_driver_BvRouteNav.jsx` → `useBvGPS` hook

GPS states: `idle` → `requesting` → `active` → `lowAccuracy` → `paused` → `denied` / `unavailable`

- Active: `navigator.geolocation.watchPosition` with `enableHighAccuracy: true`.
- Low accuracy: position acquired but accuracy > 100m. Warning shown.
- Denied: user denied permission. Map-review mode only. Advisory finding raised.
- Unavailable: `geolocation` not in `navigator`. Same fallback.

GPS is **advisory only.** Does not guarantee real-time routing accuracy.

---

## AI Advisory Logic

**File:** `services_ai_bvAdvisoryEngine.js`

- **Agent 1** (`analyzeVehicleSuitability`): deterministic local rules. Inputs: vehicle profile, route plan, GPS state, driver reports, nav session, online/offline, demo mode. Output: suitability score (0–100), risk level, findings array.
- **Agent 2** (`analyzeComplianceEvidence`): deterministic local rules. Inputs: vehicle, route, assignment, navSession, tripSession, reports, audit events, syncQueue, demo/live, backendConfigured. Output: evidence score (0–100), evidence status, human checklist.
- **runFullAdvisoryReview**: runs both agents, merges findings, saves to `useAiAdvisoryStore`, creates audit events.
- **No external AI API is called.** All logic is client-side and explainable.
- Future real AI integration: route advisory queries to OpenAI/Groq must go through a **server-side** function only.

---

## Backend-Ready Provider Options

| Provider | Status | Notes |
|----------|--------|-------|
| Supabase | Backend-ready | SQL schema in `docs/`. `testSupabaseConnection()` wired. Public anon key only in frontend. |
| Firebase | Backend-ready placeholder | Config accepted. Real Firestore connector not yet implemented. |
| AWS / Custom | Backend-ready placeholder | API base URL + health endpoint. Real sync connector needed. |
| Generic REST | Backend-ready placeholder | Same as AWS pattern. |
| Local-only | Always active | Full fallback. No data loss. Sync queue preserves records. |

---

## PWA Install / Deployment Notes

- **Vite PWA plugin** configured in `vite.config.js`. Auto-update strategy.
- **`sw-job-sync.js`** — custom service worker for background sync (job sync events).
- **Icons:** `public/icons/icon-192x192.png` and `icon-512x512.png` — must exist for PWA install.
- **HTTPS required** for production PWA install.
- **Start URL:** `/#/driver-app` (targets Driver PWA on install).
- **Recommended hosts:** Vercel, Netlify, GitHub Pages, Cloudflare Pages, Supabase hosting.

---

## Known Limitations

1. **No real backend connected** — all data is local-first. Supabase/Firebase/custom connector must be server-implemented.
2. **Auth/RLS** — auth is a placeholder. Supabase RLS policies need `auth.uid()` once real auth is wired.
3. **Route geometry** — polyline requires a GraphHopper/OSRM API key. Without it, route is origin/destination only.
4. **GPS accuracy** — depends on device and browser. Not suitable as sole navigation system.
5. **AI advisory** — local rules only. No real AI model. Advisory only — not for legal decisions.
6. **PWA icons** — placeholder icon paths. Real brand icons should replace `public/icons/`.
7. **Service worker coverage** — `sw-job-sync.js` handles job sync events. Full offline caching via Workbox in Vite PWA config.

---

## Safe Next Steps

| Priority | Task |
|----------|------|
| 1 | Create Supabase project. Run SQL schema. Test connection from Deployment Centre. |
| 2 | Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`. |
| 3 | Implement server-side sync connector (Supabase Edge Function or Next.js API route) to process `bigv:syncQueue`. |
| 4 | Enable Supabase RLS. Connect `auth.uid()` to `owner_id` on all data tables. |
| 5 | Add real brand icons to `public/icons/`. |
| 6 | Add GraphHopper API key for route geometry. |
| 7 | Deploy to HTTPS host (Vercel recommended). |
| 8 | Test PWA install on iOS Safari + Android Chrome. |
| 9 | Optional: add real AI provider (OpenAI/Groq) via server-side API route. |

---

*Big V's Best Routes™ · Powered by 4P3X Intelligent AI™ · Created by Kyzel Kreates™ · Part of the 4P3X Verse*

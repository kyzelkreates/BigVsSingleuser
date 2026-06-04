# Big V's Best Routes™ — Project Structure
**Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™**
**Version: 1.0.0 — Run 9 Final**

---

## Flat File Architecture

All source files live in the **project root** with namespace-separator underscore naming convention:

```
pages_Dashboard.jsx          → pages/Dashboard
modules_driver_BvRouteNav.jsx → modules/driver/BvRouteNav
services_sync_bvSyncService.js → services/sync/bvSyncService
```

This flat structure is intentional — it avoids build-tool import resolution issues in Vite when using no-subdirectory mode.

---

## Root File Map

### Core Application

| File | Purpose |
|------|---------|
| `main.jsx` | App entry point. Mounts React. |
| `app_Router.jsx` | Route definitions (`createHashRouter`). All page registrations. |
| `layouts_AppShell.jsx` | Main layout wrapper. Sidebar + top nav. |
| `layouts_Sidebar.jsx` | Navigation sidebar. NAV_ITEMS from `config_routes.js`. |
| `layouts_TopNav.jsx` | Top navigation bar. |
| `index.html` | HTML shell. Vite PWA entry. |
| `vite.config.js` | Vite + Vite PWA config. Manifest. Workbox. |
| `tailwind.config.js` | Tailwind CSS config. |
| `postcss.config.js` | PostCSS config. |
| `package.json` | Dependencies. |
| `.env.example` | Safe public env placeholders only. No secrets. |

### Config

| File | Purpose |
|------|---------|
| `config_app.js` | Product identity, branding, feature flags (SSOT for app config). |
| `config_routes.js` | Route path constants + NAV_ITEMS + NAV_GROUPS. |

### Core State (SSOT)

| File | Purpose |
|------|---------|
| `core_storage.js` | **SSOT.** All Zustand stores + localStorage persist helpers. Single source of truth for all app state. |

---

## Pages

| File | Route | Run | Purpose |
|------|-------|-----|---------|
| `pages_Dashboard.jsx` | `/dashboard` | 1–9 | Main operator dashboard. Vehicles, routes, ops, AI, about. |
| `pages_Vehicles.jsx` | `/vehicles` | 2 | Vehicle manager. Add/edit/delete/activate. Type templates. |
| `pages_Dispatch.jsx` | `/dispatch` | 3 | Route planner. Origin/destination, vehicle-aware advisory. |
| `pages_Navigation.jsx` | `/navigation` | 4 | OSM 2D + MapLibre 3D map page. |
| `pages_DriverApp.jsx` | `/driver-app` | 5 | Driver PWA shell. GPS map, tabs, pairing. |
| `pages_Safety.jsx` | `/safety` | 6 | Safety intelligence overview. |
| `pages_Compliance.jsx` | `/compliance` | 6 | Legal awareness overview. |
| `pages_Settings.jsx` | `/settings` | 1–8 | App settings. Profile, map, AI, backend, safety notes. |
| `pages_Deployment.jsx` | `/deployment` | 8 | Backend & Deployment Centre. Demo/live, providers, sync, PWA. |
| `pages_Fleet.jsx` | `/fleet` | 1 | Legacy fleet view (preserved). |
| `pages_Drivers.jsx` | `/drivers` | 1 | Driver management (legacy placeholder). |
| `pages_Analytics.jsx` | `/analytics` | 1 | Journey analytics (placeholder). |
| `pages_Incidents.jsx` | `/incidents` | 1 | Incidents log (placeholder). |
| `pages_Messaging.jsx` | `/messaging` | 1 | Messaging (placeholder). |
| `pages_AP3X.jsx` | `/ap3x` | 1 | 4P3X AI command panel (legacy). |
| `pages_DriverSetup.jsx` | `/driver-setup` | 5 | Driver PWA pairing/setup guide. |
| `pages_DriverImport.jsx` | `/driver-import` | 5 | Driver import (legacy). |
| `pages_NotFound.jsx` | `*` | 1 | 404 page. |
| `pages_auth_Login.jsx` | `/auth/login` | 1 | Login (placeholder). |
| `pages_auth_DriverLogin.jsx` | `/auth/driver` | 5 | Driver login (placeholder). |
| `pages_auth_Setup.jsx` | `/auth/setup` | 1 | Initial setup (placeholder). |
| `pages_auth_ResetConfirm.jsx` | `/auth/reset-confirm` | 1 | Password reset confirm. |

---

## Dashboard Modules (Run-specific)

| File | Run | Purpose |
|------|-----|---------|
| `modules_dashboard_BvOperations.jsx` | 6 | Operations panel: assignments, trip sessions, driver reports, sync. |
| `modules_dashboard_BvAiOverview.jsx` | 7 | AI Oversight Centre: Agent 1 + 2, findings, human review checklist. |
| `modules_dashboard_BvAboutPanel.jsx` | 9 | About/Demo Guide: 12-step demo flow, features, advisory wording. |

---

## Driver PWA Modules

| File | Run | Purpose |
|------|-----|---------|
| `modules_driver_BvRouteNav.jsx` | 5–9 | Core Driver PWA: HomeScreen, review, checklist, nav, inbox, AI advisory. |
| `modules_driver_BvAssignmentInbox.jsx` | 6 | Assignment inbox + report form (12 types, 4 severities). |
| `modules_driver_BvAiAdvisory.jsx` | 7 | Compact AI advisory panel for driver screen. |

---

## Navigation Modules

| File | Run | Purpose |
|------|-----|---------|
| `modules_navigation_ApexMap.jsx` | 4 | MapLibre 3D map component. |
| `modules_navigation_RouteMap.jsx` | 4 | OSM 2D route map (Leaflet). |
| `modules_navigation_MapControls.jsx` | 4 | Map layer/provider controls. |

---

## Services

### Sync & Backend

| File | Run | Purpose |
|------|-----|---------|
| `services_sync_bvSyncService.js` | 6 | Local-first sync: createAssignment, startTripSession, submitReport, runSyncNow. |
| `services_deployment_bvDeploymentService.js` | 8 | Deployment: looksLikeSecret, maskValue, checkProviderHealth, checkSyncReadiness, prepareSyncRun, checkPwaReadiness. |
| `services_sync_liveSync.js` | 1 | Legacy live sync (BroadcastChannel, telemetry). |
| `services_sync_syncVerificationService.js` | 1 | Sync health checks. |
| `services_backend_backendService.js` | 1 | Supabase backend bridge. probeConnection, isLiveMode. |

### Vehicles & Routes

| File | Run | Purpose |
|------|-----|---------|
| `services_vehicles_vehicleService.js` | 2 | Vehicle templates, readiness scoring, missing field checks. |
| `services_routes_routeService.js` | 3 | Route readiness, risk level, advisory warnings. |

### AI

| File | Run | Purpose |
|------|-----|---------|
| `services_ai_bvAdvisoryEngine.js` | 7 | Local-first AI advisory engine. Agent 1 + Agent 2. runFullAdvisoryReview. |
| `services_ai_aiProviderManager.js` | 1 | LLM provider manager (OpenAI/Groq/etc. — not advisory layer). |
| `intel_safetyEngine.js` | 1 | Safety risk scoring (legacy intel module). |
| `intel_complianceEngine.js` | 1 | Compliance checks (legacy intel module). |
| `intel_routeScoring.js` | 1 | Route scoring (legacy intel module). |

### Maps

| File | Run | Purpose |
|------|-----|---------|
| `services_maps_mapService.js` | 4 | Map provider management. |
| `services_maps_mapProviders.js` | 4 | Provider configs (OSM, Mapbox, etc.). |
| `services_maps_runtimeKeys.js` | 4 | Safe runtime API key access. |
| `services_maps_routeGeometry.js` | 4 | Route geometry helpers. |
| `services_routing_localRoutingEngine.js` | 3 | Local routing fallback. |
| `services_routing_routeCache.js` | 3 | Route result cache. |

### Supabase

| File | Run | Purpose |
|------|-----|---------|
| `services_supabase_supabaseClient.js` | 1 | Supabase client singleton. getSupabaseClient, testSupabaseConnection, isSupabaseReady. |
| `services_supabase_authService.js` | 1 | Auth service wrapper. |

### Other

| File | Purpose |
|------|---------|
| `services_safety_safetyService.js` | Safety alert management. |
| `services_dispatch_dispatchService.js` | Dispatch/job service (legacy). |
| `services_drivers_driverService.js` | Driver management (legacy). |
| `services_fleet_fleetService.js` | Fleet management (legacy). |
| `services_realtime_telemetryService.js` | Telemetry service. |
| `services_settings_appSettingsService.js` | GraphHopper key, routing constraints. |

---

## Components

| File | Purpose |
|------|---------|
| `components_ui_Icon.jsx` | Lucide icon wrapper. |
| `components_ui_Badge.jsx` | Status badge. |
| `components_ui_ConnectionStatus.jsx` | Online/offline indicator. |
| `components_ui_StatusDot.jsx` | Coloured status dot. |
| `components_ui_TelemetryValue.jsx` | Telemetry display value. |
| `components_auth_AuthGuard.jsx` | Auth guard wrapper. |
| `components_map_MapAttribution.jsx` | Map attribution overlay. |

---

## Public

| File/Folder | Purpose |
|-------------|---------|
| `public/sw-job-sync.js` | Custom service worker for background job sync events. |
| `public/icons/` | PWA icons (192x192 + 512x512 — brand icons needed). |

---

## Docs (Run 9)

| File | Purpose |
|------|---------|
| `docs/investor-demo-pack-big-vs-best-routes.md` | Investor/client demo pack. Product pitch, features, how to demo. |
| `docs/technical-handover-big-vs-best-routes.md` | Technical architecture, data model, sync flow, known limits, next steps. |
| `docs/supabase-setup-big-vs-best-routes.sql.txt` | Complete Supabase SQL schema. Tables, indexes, RLS, policies, rollback. |
| `docs/project-structure.md` | This file. |

---

## Security Notes

- **4P3X API Config Guard™** — active in `services_deployment_bvDeploymentService.js` and `pages_Deployment.jsx`.
- **No backend-only secrets** in any frontend file.
- **`.env.example`** — frontend-safe `VITE_` prefixed placeholders only.
- **Masked values** — configured provider keys shown as `••••••1234` only.
- **`looksLikeSecret()`** — 10-pattern guard function. Blocks input before propagation. Does not log values.

---

*Big V's Best Routes™ · Powered by 4P3X Intelligent AI™ · Created by Kyzel Kreates™ · Part of the 4P3X Verse*

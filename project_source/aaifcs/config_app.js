/**
 * ============================================================
 * Big V's Best Routes™ — App Configuration
 * /src/config/app.js
 *
 * SSOT: All app identity and feature flags live here.
 * Part of the 4P3X Verse.
 * Created by Kyzel Kreates™
 * ============================================================
 */

export const APP_CONFIG = {
  // ── Product Identity ────────────────────────────────────────
  name:        "Big V's Best Routes™",
  shortName:   'Big V Routes',
  version:     '1.0.0',
  buildStage:  'Run 4 — OSM 2D + MapLibre 3D Map Layer',
  tagline:     'Vehicle-aware route planning for safer, smarter, more legally aware journeys.',

  branding: {
    poweredBy: '4P3X Intelligent AI™',
    createdBy: 'Kyzel Kreates™',
    productLine: '4P3X Verse',
    description: 'Single-User Multi-Vehicle Safe & Legal Route Planner',
  },

  // ── Internal product areas (Run 1 shell — future runs fill these) ──
  products: {
    dashboard: {
      name:   "Big V's Best Routes™ Route Planner Dashboard",
      short:  'Route Planner Dashboard',
      route:  '/dashboard'
    },
    driverPWA: {
      name:   "Big V's Best Routes™ Driver PWA",
      short:  'Driver PWA',
      route:  '/driver-app'
    }
  },

  // ── Safety & Legal Disclaimer (display where appropriate) ───
  safetyDisclaimer: "Advisory only: Big V's Best Routes™ supports route planning and risk awareness, but it does not guarantee legal compliance. The driver/operator remains responsible for checking live road signs, restrictions, vehicle suitability, and route safety.",

  theme: {
    default: 'dark',
    options: ['dark']
  },

  // ── 4P3X API Config Guard™ ───────────────────────────────────
  // No backend-only secrets in frontend code.
  // Do not hardcode SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY,
  // STRIPE_SECRET_KEY, DATABASE_URL, or any private keys here.
  // Public/client-safe keys are configured via safe settings/env patterns only.
  apiGuard: {
    enabled: true,
    note: 'All secret keys must be supplied via user settings or .env — never hardcoded.'
  },

  features: {
    // ── Enabled in Run 1 ──────────────────────────────────────
    sidebar:      true,
    topnav:       true,
    pwa:          true,
    routing:      true,
    driverPWA:    true,

    // ── Future runs (placeholders — do NOT enable here) ───────
    vehicles:     true,   // Run 2 — ENABLED
    routePlanner: true,   // Run 3 — ENABLED
    maps:         false,  // Run 4
    driverGPS:    false,  // Run 5
    safetyAI:     false,  // Run 6
    legalAI:      false,  // Run 6
    demoLive:     false,  // Run 7
    backend:      false,  // Run 7
    auth:         false,
    realtime:     false,
    offline:      false,
    notifications: false
  }
}

export default APP_CONFIG

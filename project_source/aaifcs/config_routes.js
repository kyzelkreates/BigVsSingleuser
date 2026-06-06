/**
 * ============================================================
 * Big V's Best Routes™ — Route Registry
 * /src/config/routes.js
 *
 * NOTE: Internal route path strings (e.g. /fleet, /dispatch) are
 * preserved as-is to avoid breaking existing navigation logic.
 * Only user-visible labels have been rebranded.
 * ============================================================
 */

export const ROUTES = {
  // ── Core ──────────────────────────────────────────────────
  ROOT:       '/',
  LANDING:    '/landing',   // Run 13 — Project explainer homepage
  DASHBOARD:  '/dashboard',

  // ── Vehicles (was Fleet) — internal path kept ─────────────
  FLEET:          '/fleet',
  FLEET_VEHICLE:  '/fleet/:vehicleId',

  // ── Saved Vehicles ────────────────────────────────────────
  VEHICLES:        '/vehicles',
  VEHICLE_DETAIL:  '/vehicles/:vehicleId',

  // ── Route Planning (was Dispatch) — internal path kept ────
  DISPATCH: '/dispatch',

  // ── Driver PWA Setup ──────────────────────────────────────
  DRIVER_SETUP: '/driver-setup',

  // ── Navigation / Driver PWA ───────────────────────────────
  NAVIGATION: '/navigation',
  AP3X:       '/ap3x',

  // ── AI Intelligence ───────────────────────────────────────
  AI: '/ai',

  // ── Route Safety & Legal Awareness (was Compliance) ───────
  COMPLIANCE: '/compliance',

  // ── Safety AI ─────────────────────────────────────────────
  SAFETY: '/safety',

  // ── Journey Analytics ─────────────────────────────────────
  ANALYTICS: '/analytics',

  // ── Incidents ─────────────────────────────────────────────
  INCIDENTS:        '/incidents',
  INCIDENT_DETAIL:  '/incidents/:incidentId',

  // ── Messaging ─────────────────────────────────────────────
  MESSAGING: '/messaging',

  // ── Settings ──────────────────────────────────────────────
  SETTINGS:               '/settings',
  DEPLOYMENT:             '/deployment',        // Run 8 — Backend & Deployment Centre
  SETTINGS_PROFILE:       '/settings/profile',
  SETTINGS_FLEET:         '/settings/fleet',
  SETTINGS_AI:            '/settings/ai',
  SETTINGS_SECURITY:      '/settings/security',
  SETTINGS_INTEGRATIONS:  '/settings/integrations',

  // ── Auth ──────────────────────────────────────────────────
  AUTH_LOGIN:   '/auth/login',
  AUTH_LOGOUT:  '/auth/logout',
  AUTH_DRIVER:  '/auth/driver',

  // ── Error ─────────────────────────────────────────────────
  NOT_FOUND: '*'
}

// ─── Nav structure for sidebar ────────────────────────────────
export const NAV_ITEMS = [
  {
    id:    'landing',
    label: 'Project Home',
    route: '/landing',
    icon:  'Home',
    group: 'meta',
  },
  {
    id:    'dashboard',
    label: 'Dashboard',
    route: ROUTES.DASHBOARD,
    icon:  'LayoutDashboard',
    group: 'core'
  },
  // ── Run 2 placeholder — Saved Vehicles ────────────────────
  {
    id:    'fleet',
    label: 'Saved Vehicles',
    route: ROUTES.FLEET,
    icon:  'Truck',
    group: 'vehicles',
  },
  {
    id:    'vehicles',
    label: 'Vehicle Profiles',
    route: ROUTES.VEHICLES,
    icon:  'Car',
    group: 'vehicles'
  },
  // ── Run 3 placeholder — Route Planner ─────────────────────
  {
    id:    'dispatch',
    label: 'Route Planner',
    route: ROUTES.DISPATCH,
    icon:  'Route',
    group: 'planning'
  },
  // ── Driver PWA ────────────────────────────────────────────
  {
    id:        'driver-setup',
    label:     'Driver PWA Setup',
    route:     ROUTES.DRIVER_SETUP,
    icon:      'Smartphone',
    group:     'driverpwa',
    highlight: true,
  },
  // ── Run 4 placeholder — Map ───────────────────────────────
  {
    id:    'navigation',
    label: 'Live Map',
    route: ROUTES.NAVIGATION,
    icon:  'Map',
    group: 'maps'
  },
  // ── AI / Safety Intelligence ──────────────────────────────
  {
    id:        'ai',
    label:     '4P3X AI Command',
    route:     ROUTES.AI,
    icon:      'Brain',
    group:     'intelligence',
    highlight: true
  },
  // ── Run 6 placeholder — Safety AI ─────────────────────────
  {
    id:    'safety',
    label: 'Route Safety AI',
    route: ROUTES.SAFETY,
    icon:  'ShieldCheck',
    group: 'intelligence'
  },
  // ── Run 6 placeholder — Legal Awareness ───────────────────
  {
    id:    'compliance',
    label: 'Legal Awareness',
    route: ROUTES.COMPLIANCE,
    icon:  'ClipboardCheck',
    group: 'intelligence'
  },
  {
    id:    'analytics',
    label: 'Journey Analytics',
    route: ROUTES.ANALYTICS,
    icon:  'BarChart3',
    group: 'reporting'
  },
  {
    id:    'incidents',
    label: 'Incidents',
    route: ROUTES.INCIDENTS,
    icon:  'AlertTriangle',
    group: 'reporting'
  },
  {
    id:    'settings',
    label: 'Settings',
    route: ROUTES.SETTINGS,
    icon:  'Settings',
    group: 'system'
  },
  {
    id:        'deployment',
    label:     'Backend & Deploy',
    route:     ROUTES.DEPLOYMENT,
    icon:      'Server',
    group:     'system',
    highlight: false,
  }
]

export const NAV_GROUPS = {
  meta:         { label: null,                    order: -1 },
  core:         { label: null,                    order: 0 },
  vehicles:     { label: 'Vehicles',              order: 1 },
  planning:     { label: 'Route Planning',        order: 2 },
  driverpwa:    { label: 'Driver PWA',            order: 3 },
  maps:         { label: 'Maps',                  order: 4 },
  intelligence: { label: 'Safety & Intelligence', order: 5 },
  reporting:    { label: 'Reporting',             order: 6 },
  system:       { label: 'System',                order: 7 }
}

export default ROUTES

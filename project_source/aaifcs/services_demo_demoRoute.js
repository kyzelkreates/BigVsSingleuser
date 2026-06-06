/**
 * ============================================================
 * Big V's Best Routes™ — Demo Route Data
 * Torquay → Edinburgh — Safe Legal Long-Distance Demo
 *
 * This is DEMO DATA ONLY.
 * It is clearly labelled as demo throughout.
 * It does NOT represent live routing, live legal data, or
 * real-time road conditions.
 *
 * Used by:
 *   - DriverApp (demo mode bypass — SetupScreen skipped)
 *   - Landing page "View Demo Route" button
 *   - Route Planner Demo preview
 *
 * SSOT Rule: This is the single source of demo route truth.
 * Do not create duplicate demo route objects elsewhere.
 *
 * Run 14 — Fix Pass | Created by Kyzel Kreates™
 * ============================================================
 */

// ── Torquay → Edinburgh bounding polyline waypoints ──────────
// Approximate A38/M5/M6/M74/A702 corridor
// These are waypoints, not a live provider route.
export const DEMO_POLYLINE = [
  [50.4619, -3.5253],  // Torquay
  [50.5182, -3.8067],  // Newton Abbot
  [50.5940, -4.0024],  // Ashburton area (A38)
  [50.7267, -3.9994],  // Exeter bypass
  [51.0001, -3.5996],  // Taunton
  [51.3500, -2.9800],  // Bristol south
  [51.4545, -2.5879],  // Bristol
  [51.8787, -2.0672],  // Gloucester
  [52.1917, -2.2200],  // Worcester
  [52.4862, -1.8904],  // Birmingham south
  [52.5200, -2.0800],  // Birmingham (M6 join)
  [52.7010, -2.0301],  // Stafford
  [53.0027, -2.1785],  // Stoke-on-Trent
  [53.4300, -2.1500],  // Manchester south
  [53.5050, -2.3000],  // Manchester
  [53.7050, -1.9300],  // Leeds south
  [53.8008, -1.5491],  // Leeds
  [54.0200, -1.6200],  // Harrogate area
  [54.3133, -1.4200],  // Northallerton
  [54.5750, -1.2350],  // Durham
  [54.9783, -1.6178],  // Newcastle upon Tyne
  [55.1500, -1.8000],  // Hexham area (A69/M74 join)
  [55.4000, -3.5000],  // Lockerbie
  [55.8000, -3.4500],  // Lanark area
  [55.8625, -3.2576],  // Edinburgh south
  [55.9533, -3.1883],  // Edinburgh
]

// ── Main demo route object ────────────────────────────────────
export const DEMO_ROUTE_TORQUAY_EDINBURGH = {
  id:   'demo-route-torquay-edinburgh',
  mode: 'demo',

  // ── Origin & Destination ──
  origin: {
    label: 'Torquay, Devon',
    lat:    50.4619,
    lng:    -3.5253,
  },
  destination: {
    label: 'Edinburgh, Scotland',
    lat:    55.9533,
    lng:    -3.1883,
  },

  // ── Vehicle Profile ──
  vehicleProfile: {
    label:                      'Demo Large Van / Motorhome Profile',
    type:                       'large_van_motorhome',
    reg:                        'DEMO-VAN-01',
    heightMeters:               3.1,
    widthMeters:                2.2,
    lengthMeters:               7.2,
    weightTonnes:               3.5,
    towingSetup:                false,
    legalCriticalFieldsComplete: true,
  },

  // ── Route Summary ──
  routeType:             'safe_legal_vehicle_aware',
  distanceKm:            ~620,        // approximate — not live provider data
  durationHours:         ~7.5,        // approximate — not live provider data
  distanceLabel:         '~620 km',
  durationLabel:         '~7.5 hrs (approx, excluding stops)',

  // ── Advisory Scores ──
  safetyScore:           86,
  legalSuitabilityScore: 82,
  routeConfidenceScore:  78,
  dataFreshness:         'Demo data — not live legal data',

  // ── Risk Warnings ──
  warnings: [
    {
      id:          'warn-bridge-1',
      type:        'low_bridge',
      severity:    'high',
      icon:        'alert',
      title:       'Low Bridge Risk — Demo Hazard',
      description: 'This demo warning shows how the system highlights possible bridge-height conflicts. With a vehicle height of 3.1m, any bridge rated below 3.5m requires careful pre-checking.',
      action:      'Confirm bridge clearance before committing to route',
    },
    {
      id:          'warn-narrow-1',
      type:        'narrow_road',
      severity:    'medium',
      icon:        'alert',
      title:       'Narrow Road — Demo Caution',
      description: 'Demo caution: some rural sections along the A-road corridor may include narrow sections unsuitable for wide vehicles (2.2m width). Safer alternatives should be considered.',
      action:      'Check road width suitability for vehicle width',
    },
    {
      id:          'warn-weight-1',
      type:        'weight_restriction',
      severity:    'medium',
      icon:        'shield',
      title:       'Weight Restriction — Demo Review',
      description: 'Demo warning: some bridge/road sections carry weight restrictions. At 3.5 tonnes, the demo vehicle profile requires checking applicable restrictions along the route.',
      action:      'Verify weight restrictions on all route segments',
    },
  ],

  // ── Advisory Notes ──
  advisoryNotes: [
    'This route is a demonstration of safety and legal route planning logic. No live data is used.',
    'Always check live road signs, official restrictions and current conditions before and during a journey.',
    'The AI Compliance layer is advisory only. It does not guarantee legal compliance.',
    'Driver and operator responsibility remains essential throughout. Human judgement always overrides.',
    'Big V\'s Best Routes™ is advisory route-planning support. It does not replace legal advice or professional judgement.',
  ],

  // ── Driver Pre-Trip Checklist ──
  driverChecklist: [
    { id: 'chk-height',  label: 'Vehicle height confirmed (3.1m)' },
    { id: 'chk-weight',  label: 'Vehicle weight confirmed (3.5t)' },
    { id: 'chk-width',   label: 'Vehicle width confirmed (2.2m)' },
    { id: 'chk-bridge',  label: 'Low bridge checks reviewed' },
    { id: 'chk-narrow',  label: 'Narrow road warnings reviewed' },
    { id: 'chk-legal',   label: 'Legal responsibility acknowledged — driver responsibility remains' },
    { id: 'chk-signs',   label: 'Will follow all road signs and live restrictions regardless of route plan' },
  ],

  // ── AI Compliance Panel ──
  aiAdvisory: {
    summary: 'This demo route covers approximately 620 km from Torquay to Edinburgh, using the A38/M5/M6/M74 corridor. The selected vehicle profile (large van/motorhome, 3.1m height, 3.5t) introduces specific risk considerations that require pre-journey checking.',
    positives: [
      'Motorway-dominant route reduces narrow road risk for most of the journey',
      'No known mandatory height-restricted segments on the motorway corridor',
      'Safety score 86/100 based on demo vehicle profile and route type',
    ],
    risks: [
      'Urban approach and departure sections may include lower-rated bridge structures',
      'Vehicle height of 3.1m is within UK general warning threshold — check specific structures',
      'Some A-road sections en route may have weight or width restrictions',
    ],
    recommendation: 'Demo Advisory: Route is broadly suitable for the vehicle profile on the motorway sections. Pre-trip verification of bridge heights and weight restrictions on approach/departure legs is recommended.',
    confidence:     78,
    disclaimer:     'This is demo advisory commentary. It does not represent live data, legal advice, or a guarantee of route compliance.',
  },

  // ── Route Polyline ──
  // Used for map display — approximate waypoints, not live provider geometry
  polyline: [
    [50.4619, -3.5253],
    [50.5182, -3.8067],
    [50.5940, -4.0024],
    [50.7267, -3.9994],
    [51.0001, -3.5996],
    [51.3500, -2.9800],
    [51.4545, -2.5879],
    [51.8787, -2.0672],
    [52.1917, -2.2200],
    [52.4862, -1.8904],
    [52.5200, -2.0800],
    [52.7010, -2.0301],
    [53.0027, -2.1785],
    [53.4300, -2.1500],
    [53.5050, -2.3000],
    [53.7050, -1.9300],
    [53.8008, -1.5491],
    [54.0200, -1.6200],
    [54.3133, -1.4200],
    [54.5750, -1.2350],
    [54.9783, -1.6178],
    [55.1500, -1.8000],
    [55.4000, -3.5000],
    [55.8000, -3.4500],
    [55.8625, -3.2576],
    [55.9533, -3.1883],
  ],
}

// ── Demo profile for local storage injection ──────────────────
// Written to STORAGE_CREDS when demo mode is activated —
// allows DriverApp to skip SetupScreen entirely.
export const DEMO_DRIVER_PROFILE = {
  id:           'demo-driver-001',
  full_name:    'Demo Driver',
  pin:          '0000',
  vehicle_reg:  'DEMO-VAN-01',
  vehicle_id:   'demo-veh-001',
  fleet_paired: false,
  demo_mode:    true,
  created_at:   new Date().toISOString(),
}

export const DEMO_STORAGE_KEY = 'apex:local:driver_creds'
export const DEMO_SESSION_KEY = 'apex:demo:active_route'

/**
 * activateDemoMode()
 * Writes demo profile to localStorage so DriverApp can skip
 * the SetupScreen (pairing code wall) in demo mode.
 * Call this from the homepage "Open Navigation PWA Demo" button.
 */
export function activateDemoMode() {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(DEMO_DRIVER_PROFILE))
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(DEMO_ROUTE_TORQUAY_EDINBURGH))
    localStorage.setItem('apex:demo:mode_active', 'true')
    return true
  } catch (e) {
    console.warn('[BVR Demo] Could not activate demo mode:', e)
    return false
  }
}

/**
 * deactivateDemoMode()
 * Clears demo profile and route from localStorage.
 * Call this when user explicitly exits demo mode.
 */
export function deactivateDemoMode() {
  try {
    localStorage.removeItem(DEMO_STORAGE_KEY)
    localStorage.removeItem(DEMO_SESSION_KEY)
    localStorage.removeItem('apex:demo:mode_active')
    return true
  } catch (e) {
    console.warn('[BVR Demo] Could not deactivate demo mode:', e)
    return false
  }
}

/**
 * isDemoModeActive()
 * Checks if demo mode is currently active.
 */
export function isDemoModeActive() {
  try {
    return localStorage.getItem('apex:demo:mode_active') === 'true'
  } catch { return false }
}

/**
 * getDemoActiveRoute()
 * Returns the active demo route object if one is stored.
 */
export function getDemoActiveRoute() {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

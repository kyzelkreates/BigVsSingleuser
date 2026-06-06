/**
 * ============================================================
 * Big V's Best Routes™ — Supabase Live Adapter (Run 10)
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 *
 * This module is the ONLY place where local-first SSOT data is
 * mapped to Supabase live tables. It is the adapter layer between
 * core_storage.js (local/demo SSOT) and the Supabase backend.
 *
 * ── Security ──────────────────────────────────────────────────
 * 4P3X API Config Guard™ is ACTIVE throughout this file.
 * This module NEVER stores, logs, exports, or transmits:
 *   SUPABASE_SERVICE_ROLE_KEY · DATABASE_URL · JWT_SECRET
 *   OPENAI_API_KEY · GROQ_API_KEY · STRIPE_SECRET_KEY
 *   PRIVATE_KEY · WEBHOOK_SECRET · admin tokens
 *
 * Frontend-safe values only:
 *   Supabase project URL · Supabase anon/public key
 *   User session tokens managed by Supabase Auth SDK only
 *
 * ── Advisory ──────────────────────────────────────────────────
 * Backend/live sync improves data persistence and cross-device
 * visibility. It does NOT guarantee route safety, legal compliance,
 * road restriction accuracy, or live road conditions.
 * Drivers must always follow road signs, restrictions, traffic
 * laws, and their own professional judgement.
 *
 * ── Live Mode Rule ────────────────────────────────────────────
 * This adapter ONLY runs when:
 *   1. Demo mode is OFF  (useBackendConfigStore.isDemoMode() === false)
 *   2. Supabase config is valid (url + anonKey present + URL valid)
 *   3. Connection test has passed (status === 'testPassed')
 * If any condition fails, all write operations return a safe
 * local-only result without throwing or breaking the app.
 *
 * ── Table names ───────────────────────────────────────────────
 * bv_vehicles · bv_routes · bv_route_assignments
 * bv_trip_sessions · bv_driver_reports · bv_compliance_checks
 * bv_sync_logs
 * ============================================================
 */

import {
  getSupabaseClient,
  getSupabaseSettings,
  saveSupabaseSettings,
  isConfigValid,
  testSupabaseConnection as _rawTestConnection,
  destroySupabaseClient,
} from './services_supabase_supabaseClient'

import {
  useBackendConfigStore,
  useSyncQueueStore,
  useAuditStore,
} from './core_storage'

// ─── Table name constants ─────────────────────────────────────
export const BV_TABLES = {
  VEHICLES:     'bv_vehicles',
  ROUTES:       'bv_routes',
  ASSIGNMENTS:  'bv_route_assignments',
  SESSIONS:     'bv_trip_sessions',
  REPORTS:      'bv_driver_reports',
  COMPLIANCE:   'bv_compliance_checks',
  SYNC_LOGS:    'bv_sync_logs',
}

// ─── Error types ──────────────────────────────────────────────
export const BV_ADAPTER_ERRORS = {
  DEMO_MODE:          'DEMO_MODE',
  NOT_CONFIGURED:     'NOT_CONFIGURED',
  LIVE_NOT_ACTIVE:    'LIVE_NOT_ACTIVE',
  NO_CLIENT:          'NO_CLIENT',
  MISSING_URL:        'MISSING_URL',
  MISSING_KEY:        'MISSING_KEY',
  INVALID_URL:        'INVALID_URL',
  CONNECT_FAILED:     'CONNECT_FAILED',
  QUERY_FAILED:       'QUERY_FAILED',
  RLS_DENIED:         'RLS_DENIED',
  AUTH_MISSING:       'AUTH_MISSING',
  TABLE_MISSING:      'TABLE_MISSING',
  OFFLINE:            'OFFLINE',
  UNKNOWN:            'UNKNOWN',
}

// ─── Safe result wrapper ──────────────────────────────────────
function ok(data = null, meta = {}) {
  return { success: true,  data,   error: null,  ...meta }
}
function fail(code, message, detail = null) {
  console.warn(`[BvAdapter] ${code}: ${message}`, detail || '')
  return { success: false, data: null, error: { code, message, detail } }
}

// ─── Live mode guard ─────────────────────────────────────────
// Returns null if live sync is active, or a fail() result to return early.
function liveModeGuard(operationName = '') {
  const bcStore = useBackendConfigStore.getState()

  if (bcStore.isDemoMode()) {
    return fail(BV_ADAPTER_ERRORS.DEMO_MODE,
      `${operationName}: Demo mode is active. Live backend operations are disabled. Switch to Live Mode in Settings to enable Supabase sync.`)
  }

  const settings = getSupabaseSettings()
  if (!settings.url) {
    return fail(BV_ADAPTER_ERRORS.MISSING_URL,
      `${operationName}: Supabase URL is not configured. Add your Supabase project URL in Settings → Backend.`)
  }
  if (!settings.anonKey) {
    return fail(BV_ADAPTER_ERRORS.MISSING_KEY,
      `${operationName}: Supabase anon key is not configured. Add your public anon key in Settings → Backend.`)
  }

  if (!isConfigValid(settings)) {
    return fail(BV_ADAPTER_ERRORS.INVALID_URL,
      `${operationName}: Supabase URL format is invalid. Check the URL in Settings → Backend.`)
  }

  if (!bcStore.isLiveSyncActive()) {
    return fail(BV_ADAPTER_ERRORS.LIVE_NOT_ACTIVE,
      `${operationName}: Live sync is not active. Configure and test your Supabase connection in the Backend & Deployment Centre.`)
  }

  return null  // all clear
}

// ─── Get authenticated user id safely ────────────────────────
async function getSafeUserId() {
  // TODO (Run 11 — Auth): Wire to Supabase Auth session for full RLS user scoping.
  // For now, fall back to a stable anonymous device identifier stored locally.
  // This is safe — the user_id in RLS policies uses auth.uid() on the server.
  try {
    const client = getSupabaseClient()
    if (!client) return null
    const { data: { user } } = await client.auth.getUser()
    if (user?.id) return user.id
  } catch {}
  // Fallback: stable local device id (not a secret — just an identifier)
  try {
    let id = localStorage.getItem('bigv:deviceId')
    if (!id) {
      id = `anon-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
      localStorage.setItem('bigv:deviceId', id)
    }
    return id
  } catch {
    return null
  }
}

// ─── Classify Supabase error codes ───────────────────────────
function classifySupabaseError(error) {
  if (!error) return null
  const code = error.code || ''
  const msg  = (error.message || '').toLowerCase()

  if (code === '42P01' || msg.includes('does not exist'))
    return BV_ADAPTER_ERRORS.TABLE_MISSING
  if (code === '42501' || code === 'PGRST301' || msg.includes('permission denied') || msg.includes('rls'))
    return BV_ADAPTER_ERRORS.RLS_DENIED
  if (code === 'PGRST301' || msg.includes('jwt') || msg.includes('not authenticated'))
    return BV_ADAPTER_ERRORS.AUTH_MISSING
  if (msg.includes('network') || msg.includes('offline') || msg.includes('fetch'))
    return BV_ADAPTER_ERRORS.OFFLINE

  return BV_ADAPTER_ERRORS.QUERY_FAILED
}

// ═══════════════════════════════════════════════════════════════
//  1. BACKEND CONFIG — getBackendConfig / saveBackendConfig /
//     clearBackendConfig / isSupabaseConfigured / canEnableLiveMode
// ═══════════════════════════════════════════════════════════════

/**
 * getBackendConfig — reads from both localStorage keys:
 *   - apex:supabase:settings  (supabaseClient SSOT key)
 *   - bigv:backendConfig      (useBackendConfigStore SSOT key)
 * Returns a unified read-only config object.
 */
export function getBackendConfig() {
  const sbSettings = getSupabaseSettings()
  const bcConfig   = useBackendConfigStore.getState().config
  return {
    // Supabase-specific
    supabaseUrl:      sbSettings.url    || '',
    supabaseAnonKey:  sbSettings.anonKey || '',   // never exposed in logs
    supabaseEnabled:  sbSettings.enabled || false,
    supabaseStatus:   sbSettings.connectionStatus || 'offline',
    fromEnv:          sbSettings._fromEnv || false,
    // Backend config store
    activeProvider:   bcConfig.activeProvider,
    demoMode:         bcConfig.demoMode,
    providers:        bcConfig.providers,
  }
}

/**
 * saveBackendConfig — persists Supabase public config ONLY.
 * Never accepts or stores backend-only secrets.
 * @param {object} patch — { url?, anonKey?, enabled?, notes? }
 */
export function saveBackendConfig(patch = {}) {
  // Security gate — never store dangerous secret patterns
  const SECRET_PATTERNS = [
    /service_role/i,
    /sk-[A-Za-z0-9]{20,}/,
    /gsk_[A-Za-z0-9]{20,}/,
    /OPENAI_API_KEY/i,
    /DATABASE_URL/i,
    /JWT_SECRET/i,
    /PRIVATE_KEY/i,
    /WEBHOOK_SECRET/i,
    /service_key/i,
    /secret_key/i,
    /postgres:\/\//i,
  ]
  const forbiddenValues = [patch.anonKey, patch.url, patch.notes].filter(Boolean)
  for (const v of forbiddenValues) {
    if (typeof v === 'string' && SECRET_PATTERNS.some(p => p.test(v))) {
      console.error('[BvAdapter] saveBackendConfig blocked — value matches secret pattern. Use public/anon keys only.')
      return { success: false, error: { code: 'SECRET_BLOCKED', message: 'This value looks like a backend-only secret and was not saved. Use the Supabase public anon key only.' } }
    }
  }
  // Save to supabaseClient SSOT
  saveSupabaseSettings({ ...patch })
  return { success: true }
}

/**
 * clearBackendConfig — removes Supabase settings and destroys the client.
 */
export function clearBackendConfig() {
  try {
    localStorage.removeItem('apex:supabase:settings')
    destroySupabaseClient()
    useBackendConfigStore.getState().setActiveProvider('local')
    useAuditStore.getState().addEvent(
      'backend_config_cleared', 'Backend config cleared', 'backend', 'supabase',
      { at: new Date().toISOString() }, 'dashboard', false
    )
    return { success: true }
  } catch (e) {
    return { success: false, error: { code: BV_ADAPTER_ERRORS.UNKNOWN, message: e.message } }
  }
}

/**
 * isSupabaseConfigured — true only when URL + anonKey are present and URL is valid.
 */
export function isSupabaseConfigured() {
  const s = getSupabaseSettings()
  return isConfigValid(s)
}

/**
 * canEnableLiveMode — checks all preconditions for live sync activation.
 * Returns { allowed: boolean, reasons: string[] }
 */
export function canEnableLiveMode() {
  const reasons = []
  const bcState  = useBackendConfigStore.getState()
  const sbConfig = getSupabaseSettings()

  if (bcState.isDemoMode())
    reasons.push('Demo mode must be switched OFF before live sync can activate.')

  if (!sbConfig.url)
    reasons.push('Supabase URL is not configured.')

  if (!sbConfig.anonKey)
    reasons.push('Supabase anon key is not configured.')

  if (sbConfig.url) {
    try { new URL(sbConfig.url.trim()) }
    catch { reasons.push('Supabase URL format is invalid.') }
  }

  const sbProvider = bcState.config.providers?.supabase
  if (!sbProvider || sbProvider.status !== 'testPassed')
    reasons.push('Connection test has not passed. Run the test in Backend Settings first.')

  return { allowed: reasons.length === 0, reasons }
}

/**
 * testSupabaseConnection — enhanced BV version that probes BV tables.
 * Falls back to the base supabaseClient probe for connection-only check.
 */
export async function testSupabaseConnection(url, anonKey) {
  const result = await _rawTestConnection(url, anonKey)
  if (!result.ok) return result

  // Extra probe: check for BV tables (informational only — not a blocker)
  let bvTablesReady = false
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const probeClient = createClient(url.trim(), anonKey.trim(), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    const { error } = await probeClient
      .from(BV_TABLES.VEHICLES)
      .select('id')
      .limit(1)
    // 42P01 = table doesn't exist, 42501 = RLS (server reachable), others = ok
    bvTablesReady = !error || error.code === '42501' || error.code === 'PGRST301'
  } catch {}

  return {
    ok: true,
    bvTablesReady,
    note: bvTablesReady
      ? 'Supabase connection confirmed. BV tables detected.'
      : 'Supabase connection confirmed. BV tables not yet created — run the SQL setup file.',
  }
}

// ═══════════════════════════════════════════════════════════════
//  2. DATA MAPPERS  (local → Supabase row shape)
// ═══════════════════════════════════════════════════════════════

/**
 * All mappers return a flat row object safe for Supabase insert/upsert.
 * The `metadata` jsonb column stores flexible/nested data.
 * The `source_mode` column is 'live' (demo records are never sent).
 */

export function mapLocalVehicleToSupabase(v, userId = null) {
  return {
    id:               v.id,
    user_id:          userId,
    name:             v.name             || '',
    registration:     v.registration     || v.reg || '',
    vehicle_type:     v.vehicleType      || v.type || '',
    make:             v.make             || '',
    model:            v.model            || '',
    year:             v.year             || null,
    fuel_type:        v.fuelType         || '',
    gross_weight_kg:  v.grossWeightKg    || v.weight || null,
    unladen_weight_kg:v.unladenWeightKg  || null,
    height_m:         v.heightM          || v.height || null,
    width_m:          v.widthM           || v.width  || null,
    length_m:         v.lengthM          || v.length || null,
    axle_count:       v.axleCount        || null,
    status:           v.status           || 'active',
    source_mode:      'live',
    metadata:         {
      template:        v.template        || null,
      notes:           v.notes           || '',
      readiness:       v.readiness       || null,
      customFields:    v.customFields    || {},
    },
    created_at:       v.createdAt        || new Date().toISOString(),
    updated_at:       v.updatedAt        || new Date().toISOString(),
  }
}

export function mapLocalRouteToSupabase(r, userId = null) {
  return {
    id:               r.id,
    user_id:          userId,
    name:             r.name             || '',
    origin_label:     r.origin?.label    || r.originLabel    || '',
    origin_lat:       r.origin?.lat      || null,
    origin_lng:       r.origin?.lng      || null,
    destination_label:r.destination?.label || r.destinationLabel || '',
    destination_lat:  r.destination?.lat || null,
    destination_lng:  r.destination?.lng || null,
    distance_km:      r.distanceKm       || r.distance || null,
    duration_min:     r.durationMin      || r.duration || null,
    vehicle_id:       r.vehicleId        || null,
    risk_level:       r.riskLevel        || null,
    status:           r.status           || 'draft',
    source_mode:      'live',
    metadata:         {
      waypoints:       r.waypoints       || [],
      riskFlags:       r.riskFlags       || [],
      complianceNotes: r.complianceNotes || [],
      advisoryNotes:   r.advisoryNotes   || [],
      rawRouteData:    r.rawRouteData    || null,
    },
    created_at:       r.createdAt        || new Date().toISOString(),
    updated_at:       r.updatedAt        || new Date().toISOString(),
  }
}

export function mapLocalAssignmentToSupabase(a, userId = null) {
  return {
    id:                      a.id,
    user_id:                 userId,
    route_id:                a.routeId              || null,
    route_name:              a.routeName            || '',
    vehicle_id:              a.vehicleId            || null,
    vehicle_name:            a.vehicleName          || '',
    priority:                a.priority             || 'normal',
    notes:                   a.notes                || '',
    safety_review_required:  a.safetyReviewRequired || false,
    status:                  a.status               || 'assigned',
    sync_status:             'syncedLocal',
    source_mode:             'live',
    metadata:                {
      origin:        a.origin      || null,
      destination:   a.destination || null,
      timeline:      a.timeline    || [],
    },
    created_at:              a.createdAt            || new Date().toISOString(),
    updated_at:              a.updatedAt            || new Date().toISOString(),
  }
}

export function mapLocalTripSessionToSupabase(s, userId = null) {
  return {
    id:                       s.id,
    user_id:                  userId,
    assignment_id:            s.assignmentId           || null,
    route_id:                 s.routeId                || null,
    vehicle_id:               s.vehicleId              || null,
    status:                   s.status                 || 'active',
    started_at:               s.startedAt              || null,
    paused_at:                s.pausedAt               || null,
    resumed_at:               s.resumedAt              || null,
    completed_at:             s.completedAt            || null,
    gps_status:               s.gpsStatus              || 'idle',
    map_mode:                 s.mapMode                || '2d',
    acknowledgement_accepted: s.acknowledgementAccepted || false,
    checklist_completed:      s.checklistCompleted      || false,
    driver_notes:             s.driverNotes             || '',
    sync_status:              'syncedLocal',
    source_mode:              'live',
    metadata:                 {
      lastKnownPosition:  s.lastKnownPosition   || null,
      warningsAtStart:    s.warningsAtStart      || [],
      warningsDuringTrip: s.warningsDuringTrip   || [],
      checklistSnapshot:  s.checklistSnapshot    || {},
      reportsLinked:      s.reportsLinked        || [],
      acknowledgedAt:     s.acknowledgementAcceptedAt || null,
    },
    created_at:               s.createdAt              || new Date().toISOString(),
    updated_at:               s.updatedAt              || new Date().toISOString(),
  }
}

export function mapLocalDriverReportToSupabase(r, userId = null) {
  return {
    id:                r.id,
    user_id:           userId,
    report_type:       r.reportType      || 'other',
    severity:          r.severity        || 'info',
    notes:             r.notes           || '',
    route_id:          r.routeId         || null,
    vehicle_id:        r.vehicleId       || null,
    trip_session_id:   r.tripSessionId   || null,
    assignment_id:     r.assignmentId    || null,
    gps_lat:           r.gpsPosition?.lat  || null,
    gps_lng:           r.gpsPosition?.lng  || null,
    gps_accuracy_m:    r.gpsPosition?.accuracy || null,
    manual_location:   r.manualLocation  || '',
    status:            r.status          || 'new',
    sync_status:       'syncedLocal',
    source_mode:       'live',
    metadata:          {
      gpsPosition:    r.gpsPosition   || null,
      reviewNote:     r.reviewNote    || '',
      reviewedAt:     r.reviewedAt    || null,
    },
    submitted_at:      r.submittedAt    || new Date().toISOString(),
    updated_at:        r.updatedAt      || new Date().toISOString(),
  }
}

export function mapLocalComplianceCheckToSupabase(c, userId = null) {
  return {
    id:              c.id               || `bv-comp-${Date.now()}`,
    user_id:         userId,
    route_id:        c.routeId          || null,
    vehicle_id:      c.vehicleId        || null,
    check_type:      c.checkType        || 'general',
    result:          c.result           || 'unknown',
    risk_level:      c.riskLevel        || null,
    notes:           c.notes            || '',
    checked_by:      c.checkedBy        || 'system',
    source_mode:     'live',
    metadata:        {
      riskFlags:     c.riskFlags        || [],
      advisoryItems: c.advisoryItems    || [],
      rawData:       c.rawData          || null,
    },
    checked_at:      c.checkedAt        || new Date().toISOString(),
    updated_at:      c.updatedAt        || new Date().toISOString(),
  }
}

// ═══════════════════════════════════════════════════════════════
//  3. LIVE RECORD OPS — saveLiveRecord / loadLiveRecords
// ═══════════════════════════════════════════════════════════════

/**
 * saveLiveRecord — upsert a single mapped row to a Supabase table.
 * All demo-mode and config guards run first.
 *
 * @param {string} table  — one of BV_TABLES.*
 * @param {object} row    — a mapped row object (from mapLocal*ToSupabase)
 * @returns {Promise<{success, data, error}>}
 */
export async function saveLiveRecord(table, row) {
  const guard = liveModeGuard(`saveLiveRecord(${table})`)
  if (guard) return guard

  const client = getSupabaseClient()
  if (!client) return fail(BV_ADAPTER_ERRORS.NO_CLIENT, `saveLiveRecord(${table}): Supabase client not available.`)

  try {
    const { data, error } = await client
      .from(table)
      .upsert(row, { onConflict: 'id', returning: 'minimal' })

    if (error) {
      const code = classifySupabaseError(error)
      return fail(code, `saveLiveRecord(${table}): ${error.message}`, error)
    }

    return ok(data, { table, recordId: row.id })
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, `saveLiveRecord(${table}): Unexpected error: ${e.message}`, e)
  }
}

/**
 * loadLiveRecords — fetch all records for a given table scoped to the current user.
 * Returns raw Supabase rows — callers map to local shape themselves.
 *
 * @param {string} table  — one of BV_TABLES.*
 * @param {object} filter — optional extra filter { column: value }
 * @param {number} limit  — max records (default 500)
 * @returns {Promise<{success, data, error}>}
 */
export async function loadLiveRecords(table, filter = {}, limit = 500) {
  const guard = liveModeGuard(`loadLiveRecords(${table})`)
  if (guard) return guard

  const client = getSupabaseClient()
  if (!client) return fail(BV_ADAPTER_ERRORS.NO_CLIENT, `loadLiveRecords(${table}): Supabase client not available.`)

  try {
    let query = client
      .from(table)
      .select('*')
      .eq('source_mode', 'live')
      .order('updated_at', { ascending: false })
      .limit(limit)

    // Apply extra filters
    for (const [col, val] of Object.entries(filter)) {
      query = query.eq(col, val)
    }

    const { data, error } = await query

    if (error) {
      const code = classifySupabaseError(error)
      return fail(code, `loadLiveRecords(${table}): ${error.message}`, error)
    }

    return ok(data || [], { table, count: (data || []).length })
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, `loadLiveRecords(${table}): Unexpected error: ${e.message}`, e)
  }
}

// ═══════════════════════════════════════════════════════════════
//  4. SYNC LOG — logSyncEvent
// ═══════════════════════════════════════════════════════════════

/**
 * logSyncEvent — writes a sync event row to bv_sync_logs.
 * Safe to call in live mode only. Falls back silently in demo/unconfigured.
 *
 * @param {object} event — { entityType, entityId, action, status, notes, demoMode }
 */
export async function logSyncEvent(event = {}) {
  const guard = liveModeGuard('logSyncEvent')
  if (guard) {
    // In demo mode, just log locally — do not fail the caller
    console.debug('[BvAdapter] logSyncEvent skipped (demo/unconfigured):', event.action || '?')
    return ok(null, { skipped: true, reason: guard.error?.code })
  }

  const client = getSupabaseClient()
  if (!client) return ok(null, { skipped: true, reason: 'NO_CLIENT' })

  try {
    const row = {
      id:           `bvsl-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      entity_type:  event.entityType  || 'unknown',
      entity_id:    event.entityId    || null,
      action:       event.action      || 'unknown',
      status:       event.status      || 'ok',
      notes:        event.notes       || '',
      source:       event.source      || 'system',
      source_mode:  'live',
      metadata:     event.metadata    || {},
      logged_at:    new Date().toISOString(),
    }
    const { error } = await client.from(BV_TABLES.SYNC_LOGS).insert(row)
    if (error) {
      // Non-fatal — sync log failure must not break the main flow
      console.warn('[BvAdapter] logSyncEvent failed (non-fatal):', error.message)
      return ok(null, { skipped: true, reason: error.message })
    }
    return ok(row)
  } catch (e) {
    console.warn('[BvAdapter] logSyncEvent exception (non-fatal):', e.message)
    return ok(null, { skipped: true, reason: e.message })
  }
}

// ═══════════════════════════════════════════════════════════════
//  5. BATCH SYNC — syncEntityToSupabase (queued items)
// ═══════════════════════════════════════════════════════════════

/**
 * syncEntityToSupabase — processes all pending queue items for a given entityType.
 * Called by the Sync Now button in demo/live modes.
 *
 * In demo mode: marks items as skippedDemo. No Supabase calls made.
 * In live mode without backend: marks as pending. Shows warning.
 * In live mode with backend:    actually upserts records. Marks as syncedLocal.
 *
 * @param {string} entityType — 'routeAssignment' | 'tripSession' | 'driverReport' | 'vehicle' | 'route'
 * @param {object[]} localRecords — array of local records for this entity type
 * @param {Function} mapFn — mapLocal*ToSupabase function
 * @returns {Promise<{ synced, skipped, failed, errors }>}
 */
export async function syncEntityToSupabase(entityType, localRecords, mapFn) {
  const bcState = useBackendConfigStore.getState()
  const demo    = bcState.isDemoMode()
  const result  = { synced: 0, skipped: 0, failed: 0, errors: [] }

  if (demo) {
    result.skipped = localRecords.length
    console.debug(`[BvAdapter] syncEntityToSupabase(${entityType}): Demo mode — ${result.skipped} items skipped.`)
    return result
  }

  const guard = liveModeGuard(`syncEntityToSupabase(${entityType})`)
  if (guard) {
    result.skipped = localRecords.length
    result.errors.push(guard.error?.message || 'Live mode not active')
    return result
  }

  const userId = await getSafeUserId()

  // Map and determine table
  const TABLE_MAP = {
    vehicle:         BV_TABLES.VEHICLES,
    route:           BV_TABLES.ROUTES,
    routeAssignment: BV_TABLES.ASSIGNMENTS,
    tripSession:     BV_TABLES.SESSIONS,
    driverReport:    BV_TABLES.REPORTS,
    complianceCheck: BV_TABLES.COMPLIANCE,
  }
  const table = TABLE_MAP[entityType]
  if (!table) {
    result.errors.push(`Unknown entityType: ${entityType}`)
    result.skipped = localRecords.length
    return result
  }

  // Exclude demo records from live sync
  const liveRecords = localRecords.filter(r => !r.demoMode && r.sourceMode !== 'demo')
  result.skipped += localRecords.length - liveRecords.length

  for (const record of liveRecords) {
    try {
      const row = mapFn(record, userId)
      const res = await saveLiveRecord(table, row)
      if (res.success) {
        result.synced++
        await logSyncEvent({
          entityType, entityId: record.id, action: 'upsert',
          status: 'ok', source: 'sync_now',
        })
      } else {
        result.failed++
        result.errors.push(`${record.id}: ${res.error?.message}`)
        await logSyncEvent({
          entityType, entityId: record.id, action: 'upsert',
          status: 'failed', notes: res.error?.message, source: 'sync_now',
        })
      }
    } catch (e) {
      result.failed++
      result.errors.push(`${record.id}: ${e.message}`)
    }
  }

  return result
}

// ═══════════════════════════════════════════════════════════════
//  6. FULL SYNC RUN — runFullLiveSync
// ═══════════════════════════════════════════════════════════════

/**
 * runFullLiveSync — syncs all entity types in sequence.
 * Called by the "Sync Now" button in the Deployment Centre / Dashboard.
 * Returns a full summary safe to show in the UI.
 *
 * NEVER claims cloud sync is complete unless it actually ran.
 */
export async function runFullLiveSync() {
  const bcState = useBackendConfigStore.getState()
  const demo    = bcState.isDemoMode()
  const queue   = useSyncQueueStore.getState()

  // Demo mode — process queue locally, return honest message
  if (demo) {
    const qResult = queue.processQueue(true)
    return {
      success:      true,
      mode:         'demo',
      resultMessage: 'Local demo sync completed. No backend calls were made.',
      assignments:  { synced: 0, skipped: 0, failed: 0 },
      sessions:     { synced: 0, skipped: 0, failed: 0 },
      reports:      { synced: 0, skipped: 0, failed: 0 },
      vehicles:     { synced: 0, skipped: 0, failed: 0 },
      routes:       { synced: 0, skipped: 0, failed: 0 },
      queueResult:  qResult,
      at:           new Date().toISOString(),
    }
  }

  // Live but no backend
  if (!bcState.isLiveSyncActive()) {
    const qResult = queue.processQueue(false)
    return {
      success:      false,
      mode:         'liveNoBacked',
      resultMessage: 'Saved locally. Backend is not configured or has not passed connection test. Updates are queued.',
      assignments:  { synced: 0, skipped: 0, failed: 0 },
      sessions:     { synced: 0, skipped: 0, failed: 0 },
      reports:      { synced: 0, skipped: 0, failed: 0 },
      vehicles:     { synced: 0, skipped: 0, failed: 0 },
      routes:       { synced: 0, skipped: 0, failed: 0 },
      queueResult:  qResult,
      at:           new Date().toISOString(),
    }
  }

  // Live + backend active — run real sync
  const { useVehicleStore, useRouteStore, useAssignmentStore, useTripSessionStore, useDriverReportStore } =
    await import('./core_storage')

  const [aResult, sResult, rResult, vResult, rtResult] = await Promise.allSettled([
    syncEntityToSupabase('routeAssignment', useAssignmentStore.getState().assignments,  mapLocalAssignmentToSupabase),
    syncEntityToSupabase('tripSession',     useTripSessionStore.getState().sessions,    mapLocalTripSessionToSupabase),
    syncEntityToSupabase('driverReport',    useDriverReportStore.getState().reports,    mapLocalDriverReportToSupabase),
    syncEntityToSupabase('vehicle',         useVehicleStore.getState().vehicles,        mapLocalVehicleToSupabase),
    syncEntityToSupabase('route',           useRouteStore.getState().routePlans,        mapLocalRouteToSupabase),
  ])

  const pick = r => r.status === 'fulfilled' ? r.value : { synced: 0, skipped: 0, failed: 1, errors: [r.reason?.message || 'unknown'] }

  const results = {
    assignments: pick(aResult),
    sessions:    pick(sResult),
    reports:     pick(rResult),
    vehicles:    pick(vResult),
    routes:      pick(rtResult),
  }

  const totalSynced = Object.values(results).reduce((s, r) => s + r.synced,  0)
  const totalFailed = Object.values(results).reduce((s, r) => s + r.failed,  0)

  // Process queue items
  queue.processQueue(false)

  // Audit event
  useAuditStore.getState().addEvent(
    'live_sync_completed', 'Live sync completed', 'sync', 'supabase',
    { totalSynced, totalFailed, at: new Date().toISOString() }, 'system', false
  )

  const resultMessage = totalFailed === 0
    ? `Live sync completed. ${totalSynced} record(s) synced to Supabase.`
    : `Live sync completed with ${totalFailed} failure(s). ${totalSynced} record(s) synced. Check sync logs for details.`

  return {
    success:       totalFailed === 0,
    mode:          'live',
    resultMessage,
    ...results,
    at:            new Date().toISOString(),
  }
}

// ─── Named export convenience map ────────────────────────────
export default {
  getBackendConfig,
  saveBackendConfig,
  clearBackendConfig,
  isSupabaseConfigured,
  canEnableLiveMode,
  testSupabaseConnection,
  mapLocalVehicleToSupabase,
  mapLocalRouteToSupabase,
  mapLocalAssignmentToSupabase,
  mapLocalTripSessionToSupabase,
  mapLocalDriverReportToSupabase,
  mapLocalComplianceCheckToSupabase,
  saveLiveRecord,
  loadLiveRecords,
  logSyncEvent,
  syncEntityToSupabase,
  runFullLiveSync,
  BV_TABLES,
  BV_ADAPTER_ERRORS,
}

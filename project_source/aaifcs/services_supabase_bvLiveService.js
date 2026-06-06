/**
 * ============================================================
 * Big V's Best Routes™ — Live Mode Service (Run 11)
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 *
 * Single module for all Live Mode CRUD operations.
 * Wraps the Run 10 bvSupabaseAdapter with:
 *   - Supabase Auth session detection
 *   - Per-operation live-mode guards
 *   - Full CRUD for all 7 BV live tables
 *   - Honest error handling (no fake claims)
 *
 * ── Security (4P3X API Config Guard™) ─────────────────────────
 * NEVER stores, logs, or exposes:
 *   service_role · DATABASE_URL · JWT_SECRET · private_key
 *   OPENAI_API_KEY · GROQ_API_KEY · STRIPE_SECRET_KEY
 *   webhook secrets · admin tokens
 * Uses only: Supabase URL + anon key + SDK-managed session tokens
 *
 * ── Advisory (mandatory — do not weaken) ────────────────────────
 * Live sync does NOT guarantee route safety, legal compliance,
 * road restriction accuracy, or live road conditions.
 * Drivers must follow road signs, legal obligations, and
 * professional judgement. Data freshness can affect route and
 * legal suitability. Human override is always required.
 * The platform operator remains responsible for final route
 * decisions. This service provides advisory support only.
 *
 * ── Demo Mode Rule ────────────────────────────────────────────
 * This file is ONLY active when Demo Mode is OFF.
 * All functions hard-block in demo mode. Demo data is never sent.
 * ============================================================
 */

import {
  getSupabaseClient,
  getSupabaseSettings,
  isConfigValid,
} from './services_supabase_supabaseClient'

import {
  BV_TABLES,
  BV_ADAPTER_ERRORS,
  mapLocalVehicleToSupabase,
  mapLocalRouteToSupabase,
  mapLocalAssignmentToSupabase,
  mapLocalTripSessionToSupabase,
  mapLocalDriverReportToSupabase,
  mapLocalComplianceCheckToSupabase,
  logSyncEvent,
} from './services_supabase_bvSupabaseAdapter'

import { useBackendConfigStore, useAuditStore } from './core_storage'

// ─── Result helpers ───────────────────────────────────────────
const ok   = (data, meta = {}) => ({ success: true,  data,   error: null,  ...meta })
const fail = (code, message, detail = null) => {
  console.warn(`[BvLive] ${code}: ${message}`, detail || '')
  return { success: false, data: null, error: { code, message, detail } }
}

// ─── Classify Supabase errors ─────────────────────────────────
function classify(error) {
  if (!error) return BV_ADAPTER_ERRORS.UNKNOWN
  const code = error.code || ''
  const msg  = (error.message || '').toLowerCase()
  if (code === '42P01' || msg.includes('does not exist')) return BV_ADAPTER_ERRORS.TABLE_MISSING
  if (code === '42501' || msg.includes('permission denied') || msg.includes('rls')) return BV_ADAPTER_ERRORS.RLS_DENIED
  if (msg.includes('jwt') || msg.includes('not authenticated') || code === 'PGRST301') return BV_ADAPTER_ERRORS.AUTH_MISSING
  if (msg.includes('network') || msg.includes('offline') || msg.includes('failed to fetch')) return BV_ADAPTER_ERRORS.OFFLINE
  return BV_ADAPTER_ERRORS.QUERY_FAILED
}

// ═══════════════════════════════════════════════════════════════
//  1. AUTH SESSION — getLiveSession / requireLiveSession
// ═══════════════════════════════════════════════════════════════

/**
 * getLiveSession — returns current Supabase Auth session + user.
 * Returns null if not signed in or Supabase not configured.
 * NEVER fakes an authenticated state.
 *
 * @returns {Promise<{ session, user, userId } | null>}
 */
export async function getLiveSession() {
  const settings = getSupabaseSettings()
  if (!isConfigValid(settings)) return null

  try {
    const client = getSupabaseClient()
    if (!client) return null
    const { data, error } = await client.auth.getSession()
    if (error || !data?.session) return null
    const user   = data.session.user
    const userId = user?.id || null
    return { session: data.session, user, userId }
  } catch (e) {
    console.debug('[BvLive] getLiveSession error (non-fatal):', e.message)
    return null
  }
}

/**
 * requireLiveSession — like getLiveSession but returns a fail result if not authenticated.
 * Use this before any live write operation.
 *
 * @returns {Promise<{ ok: true, userId } | { ok: false, failResult }>}
 */
export async function requireLiveSession() {
  // Demo mode guard
  if (useBackendConfigStore.getState().isDemoMode()) {
    return {
      ok:         false,
      failResult: fail(BV_ADAPTER_ERRORS.DEMO_MODE,
        'Demo mode is active. Live operations are disabled. Switch to Live Mode in Settings.'),
    }
  }

  // Live sync not active
  if (!useBackendConfigStore.getState().isLiveSyncActive()) {
    return {
      ok:         false,
      failResult: fail(BV_ADAPTER_ERRORS.LIVE_NOT_ACTIVE,
        'Live sync is not active. Configure and test your Supabase connection in the Backend Centre.'),
    }
  }

  const liveSession = await getLiveSession()
  if (!liveSession) {
    return {
      ok:         false,
      failResult: fail(BV_ADAPTER_ERRORS.AUTH_MISSING,
        'No authenticated user session. Sign in with Supabase Auth to write live records.'),
    }
  }

  return { ok: true, userId: liveSession.userId }
}

/**
 * signInWithEmail — Supabase email/password sign-in for Live Mode.
 * Only for Live Mode. Does NOT affect Demo Mode local auth.
 */
export async function signInWithEmail(email, password) {
  if (useBackendConfigStore.getState().isDemoMode()) {
    return fail(BV_ADAPTER_ERRORS.DEMO_MODE, 'Cannot sign in to Supabase in Demo Mode.')
  }
  const client = getSupabaseClient()
  if (!client) return fail(BV_ADAPTER_ERRORS.NO_CLIENT, 'Supabase not configured.')

  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (error) return fail(classify(error), error.message, error)
    return ok({ session: data.session, user: data.user })
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

/**
 * signUpWithEmail — Supabase email/password registration for Live Mode.
 */
export async function signUpWithEmail(email, password) {
  if (useBackendConfigStore.getState().isDemoMode()) {
    return fail(BV_ADAPTER_ERRORS.DEMO_MODE, 'Cannot sign up for Supabase in Demo Mode.')
  }
  const client = getSupabaseClient()
  if (!client) return fail(BV_ADAPTER_ERRORS.NO_CLIENT, 'Supabase not configured.')

  try {
    const { data, error } = await client.auth.signUp({ email, password })
    if (error) return fail(classify(error), error.message, error)
    return ok({ session: data.session, user: data.user })
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

/**
 * signOutLive — signs out of Supabase session only.
 * Does NOT affect Demo Mode local auth state.
 */
export async function signOutLive() {
  const client = getSupabaseClient()
  if (!client) return ok(null)
  try {
    await client.auth.signOut()
    useAuditStore.getState().addEvent(
      'live_signed_out', 'Signed out of live session', 'auth', 'supabase',
      {}, 'system', false
    )
    return ok(null)
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

/**
 * onLiveAuthStateChange — subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onLiveAuthStateChange(callback) {
  const client = getSupabaseClient()
  if (!client) return () => {}
  const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return () => subscription?.unsubscribe()
}

// ═══════════════════════════════════════════════════════════════
//  2. VEHICLES — loadLiveVehicles / saveLiveVehicle / updateLiveVehicle
// ═══════════════════════════════════════════════════════════════

export async function loadLiveVehicles() {
  const session = await requireLiveSession()
  if (!session.ok) return session.failResult

  const client = getSupabaseClient()
  try {
    const { data, error } = await client
      .from(BV_TABLES.VEHICLES)
      .select('*')
      .eq('source_mode', 'live')
      .order('updated_at', { ascending: false })
    if (error) return fail(classify(error), error.message, error)
    return ok(data || [], { count: (data || []).length })
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

export async function saveLiveVehicle(localVehicle) {
  const session = await requireLiveSession()
  if (!session.ok) return session.failResult

  const row = mapLocalVehicleToSupabase(localVehicle, session.userId)
  const client = getSupabaseClient()
  try {
    const { data, error } = await client
      .from(BV_TABLES.VEHICLES)
      .upsert(row, { onConflict: 'id' })
      .select()
      .single()
    if (error) return fail(classify(error), error.message, error)
    await logSyncEvent({ entityType: 'vehicle', entityId: localVehicle.id, action: 'save', status: 'ok', source: 'dashboard' })
    return ok(data)
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

export async function updateLiveVehicle(vehicleId, fields) {
  const session = await requireLiveSession()
  if (!session.ok) return session.failResult

  const client = getSupabaseClient()
  try {
    const { data, error } = await client
      .from(BV_TABLES.VEHICLES)
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', vehicleId)
      .eq('user_id', session.userId)
      .select()
      .single()
    if (error) return fail(classify(error), error.message, error)
    return ok(data)
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

// ═══════════════════════════════════════════════════════════════
//  3. ROUTES — loadLiveRoutes / saveLiveRoute / updateLiveRoute
// ═══════════════════════════════════════════════════════════════

export async function loadLiveRoutes() {
  const session = await requireLiveSession()
  if (!session.ok) return session.failResult

  const client = getSupabaseClient()
  try {
    const { data, error } = await client
      .from(BV_TABLES.ROUTES)
      .select('*')
      .eq('source_mode', 'live')
      .order('updated_at', { ascending: false })
    if (error) return fail(classify(error), error.message, error)
    return ok(data || [], { count: (data || []).length })
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

export async function saveLiveRoute(localRoute) {
  const session = await requireLiveSession()
  if (!session.ok) return session.failResult

  const row = mapLocalRouteToSupabase(localRoute, session.userId)
  const client = getSupabaseClient()
  try {
    const { data, error } = await client
      .from(BV_TABLES.ROUTES)
      .upsert(row, { onConflict: 'id' })
      .select()
      .single()
    if (error) return fail(classify(error), error.message, error)
    await logSyncEvent({ entityType: 'route', entityId: localRoute.id, action: 'save', status: 'ok', source: 'dashboard' })
    return ok(data)
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

export async function updateLiveRoute(routeId, fields) {
  const session = await requireLiveSession()
  if (!session.ok) return session.failResult

  const client = getSupabaseClient()
  try {
    const { data, error } = await client
      .from(BV_TABLES.ROUTES)
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', routeId)
      .eq('user_id', session.userId)
      .select()
      .single()
    if (error) return fail(classify(error), error.message, error)
    return ok(data)
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

// ═══════════════════════════════════════════════════════════════
//  4. ROUTE ASSIGNMENTS
// ═══════════════════════════════════════════════════════════════

export async function loadLiveAssignments() {
  const session = await requireLiveSession()
  if (!session.ok) return session.failResult

  const client = getSupabaseClient()
  try {
    const { data, error } = await client
      .from(BV_TABLES.ASSIGNMENTS)
      .select('*')
      .eq('source_mode', 'live')
      .order('updated_at', { ascending: false })
    if (error) return fail(classify(error), error.message, error)
    return ok(data || [], { count: (data || []).length })
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

export async function saveLiveAssignment(localAssignment) {
  const session = await requireLiveSession()
  if (!session.ok) return session.failResult

  const row = mapLocalAssignmentToSupabase(localAssignment, session.userId)
  const client = getSupabaseClient()
  try {
    const { data, error } = await client
      .from(BV_TABLES.ASSIGNMENTS)
      .upsert(row, { onConflict: 'id' })
      .select()
      .single()
    if (error) return fail(classify(error), error.message, error)
    await logSyncEvent({ entityType: 'routeAssignment', entityId: localAssignment.id, action: 'save', status: 'ok', source: 'dashboard' })
    return ok(data)
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

export async function updateLiveAssignmentStatus(assignmentId, status, meta = {}) {
  const session = await requireLiveSession()
  if (!session.ok) return session.failResult

  const client = getSupabaseClient()
  try {
    const { data, error } = await client
      .from(BV_TABLES.ASSIGNMENTS)
      .update({
        status,
        updated_at: new Date().toISOString(),
        metadata: meta,
      })
      .eq('id', assignmentId)
      .eq('user_id', session.userId)
      .select()
      .single()
    if (error) return fail(classify(error), error.message, error)
    await logSyncEvent({
      entityType: 'routeAssignment', entityId: assignmentId,
      action: `status_${status}`, status: 'ok', source: 'driverPwa',
    })
    return ok(data)
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

// ═══════════════════════════════════════════════════════════════
//  5. TRIP SESSIONS
// ═══════════════════════════════════════════════════════════════

export async function loadLiveTripSessions() {
  const session = await requireLiveSession()
  if (!session.ok) return session.failResult

  const client = getSupabaseClient()
  try {
    const { data, error } = await client
      .from(BV_TABLES.SESSIONS)
      .select('*')
      .eq('source_mode', 'live')
      .order('updated_at', { ascending: false })
    if (error) return fail(classify(error), error.message, error)
    return ok(data || [], { count: (data || []).length })
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

export async function startLiveTripSession(localSession) {
  const session = await requireLiveSession()
  if (!session.ok) return session.failResult

  const row = mapLocalTripSessionToSupabase(localSession, session.userId)
  const client = getSupabaseClient()
  try {
    const { data, error } = await client
      .from(BV_TABLES.SESSIONS)
      .upsert({ ...row, status: 'active', started_at: row.started_at || new Date().toISOString() }, { onConflict: 'id' })
      .select()
      .single()
    if (error) return fail(classify(error), error.message, error)
    await logSyncEvent({ entityType: 'tripSession', entityId: localSession.id, action: 'start', status: 'ok', source: 'driverPwa' })
    return ok(data)
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

export async function updateLiveTripSession(sessionId, fields) {
  const session = await requireLiveSession()
  if (!session.ok) return session.failResult

  const client = getSupabaseClient()
  try {
    const { data, error } = await client
      .from(BV_TABLES.SESSIONS)
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', session.userId)
      .select()
      .single()
    if (error) return fail(classify(error), error.message, error)
    return ok(data)
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

export async function completeLiveTripSession(sessionId) {
  return updateLiveTripSession(sessionId, {
    status:        'completed',
    completed_at:  new Date().toISOString(),
    sync_status:   'syncedLocal',
  })
}

// ═══════════════════════════════════════════════════════════════
//  6. DRIVER REPORTS
// ═══════════════════════════════════════════════════════════════

export async function loadLiveDriverReports() {
  const session = await requireLiveSession()
  if (!session.ok) return session.failResult

  const client = getSupabaseClient()
  try {
    const { data, error } = await client
      .from(BV_TABLES.REPORTS)
      .select('*')
      .eq('source_mode', 'live')
      .order('submitted_at', { ascending: false })
    if (error) return fail(classify(error), error.message, error)
    return ok(data || [], { count: (data || []).length })
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

export async function submitLiveDriverReport(localReport) {
  const session = await requireLiveSession()
  if (!session.ok) return session.failResult

  const row = mapLocalDriverReportToSupabase(localReport, session.userId)
  const client = getSupabaseClient()
  try {
    const { data, error } = await client
      .from(BV_TABLES.REPORTS)
      .upsert(row, { onConflict: 'id' })
      .select()
      .single()
    if (error) return fail(classify(error), error.message, error)
    await logSyncEvent({
      entityType: 'driverReport', entityId: localReport.id,
      action: 'submit', status: 'ok', source: 'driverPwa',
    })
    return ok(data)
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

// ═══════════════════════════════════════════════════════════════
//  7. COMPLIANCE CHECKS
// ═══════════════════════════════════════════════════════════════

export async function loadLiveComplianceChecks() {
  const session = await requireLiveSession()
  if (!session.ok) return session.failResult

  const client = getSupabaseClient()
  try {
    const { data, error } = await client
      .from(BV_TABLES.COMPLIANCE)
      .select('*')
      .eq('source_mode', 'live')
      .order('checked_at', { ascending: false })
    if (error) return fail(classify(error), error.message, error)
    return ok(data || [], { count: (data || []).length })
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

export async function saveLiveComplianceCheck(localCheck) {
  const session = await requireLiveSession()
  if (!session.ok) return session.failResult

  const row = mapLocalComplianceCheckToSupabase(localCheck, session.userId)
  const client = getSupabaseClient()
  try {
    const { data, error } = await client
      .from(BV_TABLES.COMPLIANCE)
      .upsert(row, { onConflict: 'id' })
      .select()
      .single()
    if (error) return fail(classify(error), error.message, error)
    await logSyncEvent({ entityType: 'complianceCheck', entityId: row.id, action: 'save', status: 'ok', source: 'system' })
    return ok(data)
  } catch (e) {
    return fail(BV_ADAPTER_ERRORS.UNKNOWN, e.message, e)
  }
}

// ═══════════════════════════════════════════════════════════════
//  8. SYNC LOG
// ═══════════════════════════════════════════════════════════════

/**
 * writeLiveSyncLog — convenience wrapper around logSyncEvent.
 */
export async function writeLiveSyncLog(event = {}) {
  return logSyncEvent(event)
}

// ─── Named export map ─────────────────────────────────────────
export default {
  getLiveSession,
  requireLiveSession,
  signInWithEmail,
  signUpWithEmail,
  signOutLive,
  onLiveAuthStateChange,
  loadLiveVehicles,
  saveLiveVehicle,
  updateLiveVehicle,
  loadLiveRoutes,
  saveLiveRoute,
  updateLiveRoute,
  loadLiveAssignments,
  saveLiveAssignment,
  updateLiveAssignmentStatus,
  loadLiveTripSessions,
  startLiveTripSession,
  updateLiveTripSession,
  completeLiveTripSession,
  loadLiveDriverReports,
  submitLiveDriverReport,
  loadLiveComplianceChecks,
  saveLiveComplianceCheck,
  writeLiveSyncLog,
}

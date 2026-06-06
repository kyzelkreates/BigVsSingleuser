/**
 * ============================================================
 * Big V's Best Routes™ — Live Data Hooks (Run 11)
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 *
 * React hooks for Live Mode data loading and realtime sync.
 * These hooks are SAFE to call in both demo and live mode:
 *   - In Demo Mode: they return { isLive: false } and do nothing.
 *   - In Live Mode: they load from Supabase and subscribe to changes.
 *
 * ── Demo Mode Protection ──────────────────────────────────────
 * All hooks check isDemoMode() FIRST.
 * Demo data is never touched, loaded, or replaced by these hooks.
 * Components using these hooks must check isLive before rendering
 * live data — demo UI shows normally when isLive === false.
 *
 * ── Honest Status ─────────────────────────────────────────────
 * isLive          — true only when live sync is active + auth ok
 * isLoading       — true while fetching from Supabase
 * error           — populated only on actual errors
 * realtimeStatus  — REALTIME_STATUS.* enum value
 *
 * ── Advisory ──────────────────────────────────────────────────
 * Live data does not guarantee legal compliance, route safety,
 * or restriction clearance. Human review is always required.
 * ============================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useBackendConfigStore } from './core_storage'
import {
  getLiveSession,
  onLiveAuthStateChange,
  loadLiveAssignments,
  loadLiveTripSessions,
  loadLiveDriverReports,
  loadLiveVehicles,
  loadLiveRoutes,
  loadLiveComplianceChecks,
  updateLiveAssignmentStatus,
  startLiveTripSession,
  updateLiveTripSession,
  completeLiveTripSession,
  submitLiveDriverReport,
} from './services_supabase_bvLiveService'
import {
  subscribeToLiveAssignments,
  subscribeToLiveTripSessions,
  subscribeToLiveDriverReports,
  subscribeToLiveComplianceChecks,
  unsubscribeLiveChannels,
  REALTIME_STATUS,
} from './services_supabase_bvRealtimeService'

// ═══════════════════════════════════════════════════════════════
//  useLiveSession — detects auth state in Live Mode
//
//  Returns:
//    { isLive, isLoading, session, user, userId, authError }
//  isLive === true only when live sync is active + session exists
// ═══════════════════════════════════════════════════════════════
export function useLiveSession() {
  const isDemoMode     = useBackendConfigStore(s => s.isDemoMode())
  const isLiveSyncOn   = useBackendConfigStore(s => s.isLiveSyncActive())
  const [session, setSession]   = useState(null)
  const [isLoading, setLoading] = useState(false)
  const [authError, setError]   = useState(null)

  const detect = useCallback(async () => {
    if (isDemoMode || !isLiveSyncOn) {
      setSession(null)
      setError(null)
      return
    }
    setLoading(true)
    try {
      const s = await getLiveSession()
      setSession(s)
      setError(null)
    } catch (e) {
      setError(e.message)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [isDemoMode, isLiveSyncOn])

  // Initial detection
  useEffect(() => { detect() }, [detect])

  // Subscribe to auth state changes (sign-in/sign-out events)
  useEffect(() => {
    if (isDemoMode || !isLiveSyncOn) return
    const unsub = onLiveAuthStateChange((event, sbSession) => {
      if (event === 'SIGNED_IN' && sbSession) {
        setSession({ session: sbSession, user: sbSession.user, userId: sbSession.user?.id || null })
        setError(null)
      } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !sbSession) {
        setSession(null)
        // Unsubscribe realtime on sign out
        unsubscribeLiveChannels()
      }
    })
    return unsub
  }, [isDemoMode, isLiveSyncOn])

  const isLive = !isDemoMode && isLiveSyncOn && !!session

  return {
    isLive,
    isLoading,
    session:   session?.session   || null,
    user:      session?.user      || null,
    userId:    session?.userId    || null,
    authError,
  }
}

// ═══════════════════════════════════════════════════════════════
//  useLiveAssignments — load + realtime subscribe
//
//  Returns:
//    { isLive, assignments, isLoading, error, realtimeStatus, reload }
// ═══════════════════════════════════════════════════════════════
export function useLiveAssignments() {
  const { isLive, userId } = useLiveSession()
  const [assignments,     setAssignments]   = useState([])
  const [isLoading,       setLoading]       = useState(false)
  const [error,           setError]         = useState(null)
  const [realtimeStatus,  setRtStatus]      = useState(REALTIME_STATUS.INACTIVE)
  const unsubRef = useRef(null)

  const load = useCallback(async () => {
    if (!isLive) { setAssignments([]); return }
    setLoading(true)
    try {
      const result = await loadLiveAssignments()
      if (result.success) {
        setAssignments(result.data || [])
        setError(null)
      } else {
        setError(result.error?.message || 'Failed to load live assignments')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [isLive])

  // Initial load
  useEffect(() => { load() }, [load])

  // Realtime subscription
  useEffect(() => {
    if (!isLive) {
      setRtStatus(REALTIME_STATUS.DEMO)
      return
    }
    const { unsubscribe } = subscribeToLiveAssignments({
      onInsert: (row) => setAssignments(prev => [row, ...prev.filter(a => a.id !== row.id)]),
      onUpdate: (row) => setAssignments(prev => prev.map(a => a.id === row.id ? row : a)),
      onDelete: (row) => setAssignments(prev => prev.filter(a => a.id !== row.id)),
      onStatusChange: setRtStatus,
    })
    unsubRef.current = unsubscribe
    return () => { unsubscribe(); setRtStatus(REALTIME_STATUS.INACTIVE) }
  }, [isLive, userId])

  return { isLive, assignments, isLoading, error, realtimeStatus, reload: load }
}

// ═══════════════════════════════════════════════════════════════
//  useLiveTripSessions
// ═══════════════════════════════════════════════════════════════
export function useLiveTripSessions() {
  const { isLive, userId } = useLiveSession()
  const [sessions,        setSessions]    = useState([])
  const [isLoading,       setLoading]     = useState(false)
  const [error,           setError]       = useState(null)
  const [realtimeStatus,  setRtStatus]    = useState(REALTIME_STATUS.INACTIVE)

  const load = useCallback(async () => {
    if (!isLive) { setSessions([]); return }
    setLoading(true)
    try {
      const result = await loadLiveTripSessions()
      if (result.success) { setSessions(result.data || []); setError(null) }
      else setError(result.error?.message || 'Failed to load live sessions')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [isLive])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!isLive) { setRtStatus(REALTIME_STATUS.DEMO); return }
    const { unsubscribe } = subscribeToLiveTripSessions({
      onInsert: (row) => setSessions(prev => [row, ...prev.filter(s => s.id !== row.id)]),
      onUpdate: (row) => setSessions(prev => prev.map(s => s.id === row.id ? row : s)),
      onDelete: (row) => setSessions(prev => prev.filter(s => s.id !== row.id)),
      onStatusChange: setRtStatus,
    })
    return () => { unsubscribe(); setRtStatus(REALTIME_STATUS.INACTIVE) }
  }, [isLive, userId])

  return { isLive, sessions, isLoading, error, realtimeStatus, reload: load }
}

// ═══════════════════════════════════════════════════════════════
//  useLiveDriverReports
// ═══════════════════════════════════════════════════════════════
export function useLiveDriverReports() {
  const { isLive, userId } = useLiveSession()
  const [reports,         setReports]     = useState([])
  const [isLoading,       setLoading]     = useState(false)
  const [error,           setError]       = useState(null)
  const [realtimeStatus,  setRtStatus]    = useState(REALTIME_STATUS.INACTIVE)

  const load = useCallback(async () => {
    if (!isLive) { setReports([]); return }
    setLoading(true)
    try {
      const result = await loadLiveDriverReports()
      if (result.success) { setReports(result.data || []); setError(null) }
      else setError(result.error?.message || 'Failed to load live reports')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [isLive])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!isLive) { setRtStatus(REALTIME_STATUS.DEMO); return }
    const { unsubscribe } = subscribeToLiveDriverReports({
      onInsert: (row) => setReports(prev => [row, ...prev.filter(r => r.id !== row.id)]),
      onUpdate: (row) => setReports(prev => prev.map(r => r.id === row.id ? row : r)),
      onDelete: (row) => setReports(prev => prev.filter(r => r.id !== row.id)),
      onStatusChange: setRtStatus,
    })
    return () => { unsubscribe(); setRtStatus(REALTIME_STATUS.INACTIVE) }
  }, [isLive, userId])

  return { isLive, reports, isLoading, error, realtimeStatus, reload: load }
}

// ═══════════════════════════════════════════════════════════════
//  useLiveVehiclesAndRoutes — dashboard overview data
// ═══════════════════════════════════════════════════════════════
export function useLiveVehiclesAndRoutes() {
  const { isLive } = useLiveSession()
  const [vehicles,  setVehicles]  = useState([])
  const [routes,    setRoutes]    = useState([])
  const [isLoading, setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  const load = useCallback(async () => {
    if (!isLive) { setVehicles([]); setRoutes([]); return }
    setLoading(true)
    try {
      const [vRes, rRes] = await Promise.allSettled([loadLiveVehicles(), loadLiveRoutes()])
      if (vRes.status === 'fulfilled' && vRes.value.success) setVehicles(vRes.value.data || [])
      else setError(vRes.reason?.message || vRes.value?.error?.message || null)
      if (rRes.status === 'fulfilled' && rRes.value.success) setRoutes(rRes.value.data || [])
      else setError(prev => prev || (rRes.reason?.message || rRes.value?.error?.message || null))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [isLive])

  useEffect(() => { load() }, [load])

  return { isLive, vehicles, routes, isLoading, error, reload: load }
}

// ═══════════════════════════════════════════════════════════════
//  useLiveComplianceChecks
// ═══════════════════════════════════════════════════════════════
export function useLiveComplianceChecks() {
  const { isLive, userId } = useLiveSession()
  const [checks,    setChecks]    = useState([])
  const [isLoading, setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [realtimeStatus, setRtStatus] = useState(REALTIME_STATUS.INACTIVE)

  const load = useCallback(async () => {
    if (!isLive) { setChecks([]); return }
    setLoading(true)
    try {
      const result = await loadLiveComplianceChecks()
      if (result.success) { setChecks(result.data || []); setError(null) }
      else setError(result.error?.message || 'Failed to load compliance checks')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [isLive])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!isLive) { setRtStatus(REALTIME_STATUS.DEMO); return }
    const { unsubscribe } = subscribeToLiveComplianceChecks({
      onInsert: (row) => setChecks(prev => [row, ...prev.filter(c => c.id !== row.id)]),
      onUpdate: (row) => setChecks(prev => prev.map(c => c.id === row.id ? row : c)),
      onDelete: (row) => setChecks(prev => prev.filter(c => c.id !== row.id)),
      onStatusChange: setRtStatus,
    })
    return () => { unsubscribe(); setRtStatus(REALTIME_STATUS.INACTIVE) }
  }, [isLive, userId])

  return { isLive, checks, isLoading, error, realtimeStatus, reload: load }
}

// ═══════════════════════════════════════════════════════════════
//  useLiveAssignmentActions — write operations for Driver PWA
//
//  Returns action functions that work only in live mode.
//  In demo mode they return a safe no-op result.
// ═══════════════════════════════════════════════════════════════
export function useLiveAssignmentActions() {
  const { isLive } = useLiveSession()
  const isDemoMode = useBackendConfigStore(s => s.isDemoMode())

  const updateStatus = useCallback(async (assignmentId, status, meta = {}) => {
    if (!isLive || isDemoMode) return { success: false, error: { code: 'LIVE_NOT_ACTIVE', message: 'Live mode not active.' } }
    return updateLiveAssignmentStatus(assignmentId, status, meta)
  }, [isLive, isDemoMode])

  const startTrip = useCallback(async (localSession) => {
    if (!isLive || isDemoMode) return { success: false, error: { code: 'LIVE_NOT_ACTIVE', message: 'Live mode not active.' } }
    return startLiveTripSession(localSession)
  }, [isLive, isDemoMode])

  const updateTrip = useCallback(async (sessionId, fields) => {
    if (!isLive || isDemoMode) return { success: false, error: { code: 'LIVE_NOT_ACTIVE', message: 'Live mode not active.' } }
    return updateLiveTripSession(sessionId, fields)
  }, [isLive, isDemoMode])

  const completeTrip = useCallback(async (sessionId) => {
    if (!isLive || isDemoMode) return { success: false, error: { code: 'LIVE_NOT_ACTIVE', message: 'Live mode not active.' } }
    return completeLiveTripSession(sessionId)
  }, [isLive, isDemoMode])

  const submitReport = useCallback(async (localReport) => {
    if (!isLive || isDemoMode) return { success: false, error: { code: 'LIVE_NOT_ACTIVE', message: 'Live mode not active.' } }
    return submitLiveDriverReport(localReport)
  }, [isLive, isDemoMode])

  return { isLive, updateStatus, startTrip, updateTrip, completeTrip, submitReport }
}

/**
 * ============================================================
 * Big V's Best Routes™ — Local-First Sync Service
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 * Run 6 — Operational Sync Layer
 *
 * LOCAL-FIRST: All sync is localStorage-based simulation.
 * No backend calls are made unless a real connector is
 * configured (not in scope for Run 6).
 *
 * Use this service from dashboard and Driver PWA to:
 *   - Enqueue state changes
 *   - Run Sync Now (local simulation)
 *   - Record audit events
 *   - Bridge assignment → trip session → driver report
 *
 * ADVISORY: This service records evidence-support data only.
 * It does not replace legal duties, emergency reporting,
 * employer procedures, insurance duties, or professional
 * judgement.
 * ============================================================
 */

import {
  useAssignmentStore,
  useTripSessionStore,
  useDriverReportStore,
  useSyncQueueStore,
  useAuditStore,
  useSyncStatusStore,
} from './core_storage'

// ─── Helpers ─────────────────────────────────────────────────
const isDemoMode = () => {
  try {
    const cfg = JSON.parse(localStorage.getItem('apex:ai:config') || '{}')
    return cfg.demoMode !== false
  } catch { return true }
}

// ─── Enqueue helper ───────────────────────────────────────────
export function enqueueSync(entityType, entityId, action, payload = {}) {
  const demo = isDemoMode()
  useSyncQueueStore.getState().enqueue(entityType, entityId, action, payload, demo)
}

// ─── Audit helper ─────────────────────────────────────────────
export function recordAuditEvent(type, label, entityType, entityId, details = {}, source = 'system') {
  const demo = isDemoMode()
  useAuditStore.getState().addEvent(type, label, entityType, entityId, details, source, demo)
}

// ─── Assignment operations ────────────────────────────────────
export function createAssignment(routePlan, vehicle, opts = {}) {
  const demo   = isDemoMode()
  const store  = useAssignmentStore.getState()
  const asgn   = store.createAssignment(routePlan, vehicle, { ...opts, demoMode: demo })
  enqueueSync('routeAssignment', asgn.id, 'create', { assignmentId: asgn.id })
  recordAuditEvent('assignment_created', 'Assignment created', 'routeAssignment', asgn.id, { routeId: asgn.routeId, vehicleId: asgn.vehicleId }, 'dashboard')
  return asgn
}

export function updateAssignmentStatus(assignmentId, status, source = 'driverPwa') {
  const store = useAssignmentStore.getState()
  store.setAssignmentStatus(assignmentId, status, source)
  enqueueSync('routeAssignment', assignmentId, 'statusChange', { status })
  const labels = {
    received: 'Assignment received by driver', reviewed: 'Route reviewed',
    inProgress: 'Navigation started', paused: 'Navigation paused',
    completed: 'Route completed', needsReview: 'Flagged for review',
    cancelled: 'Assignment cancelled',
  }
  recordAuditEvent(`assignment_${status}`, labels[status] || `Status: ${status}`, 'routeAssignment', assignmentId, { status }, source)
}

// ─── Trip session operations ──────────────────────────────────
export function startTripSession(assignment, navSession = {}) {
  const store  = useTripSessionStore.getState()
  const trip   = store.createSession(assignment, navSession)
  enqueueSync('tripSession', trip.id, 'create', { tripId: trip.id, assignmentId: assignment?.id })
  recordAuditEvent('navigation_started', 'Navigation started', 'tripSession', trip.id, { assignmentId: assignment?.id }, 'driverPwa')
  // Also update assignment status
  if (assignment?.id) updateAssignmentStatus(assignment.id, 'inProgress', 'driverPwa')
  return trip
}

export function updateTripStatus(tripId, status, assignmentId = null) {
  useTripSessionStore.getState().setSessionStatus(tripId, status)
  enqueueSync('tripSession', tripId, 'statusChange', { status })
  const labels = { paused: 'Navigation paused', active: 'Navigation resumed', completed: 'Trip completed', needsReview: 'Trip needs review' }
  recordAuditEvent(`trip_${status}`, labels[status] || `Trip: ${status}`, 'tripSession', tripId, { status }, 'driverPwa')
  if (assignmentId) {
    const map = { paused: 'paused', active: 'inProgress', completed: 'completed', needsReview: 'needsReview' }
    if (map[status]) updateAssignmentStatus(assignmentId, map[status], 'driverPwa')
  }
}

// ─── Driver report operations ─────────────────────────────────
export function submitDriverReport(data) {
  const demo  = isDemoMode()
  const store = useDriverReportStore.getState()
  const rpt   = store.submitReport({ ...data, demoMode: demo })
  enqueueSync('driverReport', rpt.id, 'reportSubmit', { reportId: rpt.id })
  recordAuditEvent('report_submitted', 'Driver report submitted', 'driverReport', rpt.id, { type: rpt.reportType, severity: rpt.severity }, 'driverPwa')
  // Link to trip session
  if (data.tripSessionId) {
    useTripSessionStore.getState().linkReport(data.tripSessionId, rpt.id)
  }
  // Update assignment status if critical
  if (data.assignmentId && (data.severity === 'critical' || data.severity === 'high')) {
    updateAssignmentStatus(data.assignmentId, 'needsReview', 'driverPwa')
  }
  return rpt
}

export function reviewReport(reportId, status, note = '') {
  useDriverReportStore.getState().setReportStatus(reportId, status, note)
  enqueueSync('driverReport', reportId, 'update', { status, note })
  recordAuditEvent('report_reviewed', `Report marked: ${status}`, 'driverReport', reportId, { status, note }, 'dashboard')
}

// ─── Sync Now (local-first simulation) ───────────────────────
export function runSyncNow() {
  const syncStatus = useSyncStatusStore.getState()
  syncStatus.setSyncing(true)

  const demo   = isDemoMode()
  const queue  = useSyncQueueStore.getState()
  const result = queue.processQueue(demo)

  // Mark all pending trip sessions as syncedLocal
  const trips = useTripSessionStore.getState()
  trips.sessions
    .filter(s => s.syncStatus === 'syncPending')
    .forEach(s => trips.patchSession(s.id, { syncStatus: demo ? 'syncedLocal' : 'syncedLocal' }))

  // Mark all pending assignments as syncedLocal
  const asgns = useAssignmentStore.getState()
  asgns.assignments
    .filter(a => a.syncStatus === 'pending')
    .forEach(a => asgns.updateAssignment(a.id, { syncStatus: 'syncedLocal' }))

  // Mark all pending reports as syncedLocal
  const rpts = useDriverReportStore.getState()
  rpts.reports
    .filter(r => r.syncStatus === 'syncPending')
    .forEach(r => rpts.setReportStatus(r.id, r.status)) // preserves status, updates syncStatus via patch
  // Manual patch sync status
  const updatedReports = rpts.reports.map(r =>
    r.syncStatus === 'syncPending' ? { ...r, syncStatus: 'syncedLocal' } : r
  )
  // Direct persist patch for reports
  try {
    localStorage.setItem('bigv:driverReports', JSON.stringify(updatedReports))
  } catch {}

  const summary = {
    assignmentsSynced: result.synced + asgns.assignments.filter(a => a.syncStatus === 'syncedLocal').length,
    tripSessionsSynced: trips.sessions.filter(s => s.syncStatus === 'syncedLocal').length,
    reportsSynced: result.synced,
    failed: result.failed,
    demoMode: demo,
    backendConfigured: false, // Run 6: no backend
    message: demo
      ? 'Local demo sync completed. No backend calls made.'
      : 'Saved locally. Backend not configured yet.',
    at: new Date().toISOString(),
  }

  syncStatus.setLastSync(summary)
  recordAuditEvent('sync_processed', demo ? 'Demo sync completed' : 'Local sync completed', 'sync', 'local', summary, 'system', demo)
  return summary
}

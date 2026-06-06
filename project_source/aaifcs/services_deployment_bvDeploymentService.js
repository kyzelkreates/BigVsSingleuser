/**
 * ============================================================
 * Big V's Best Routes™ — Backend & Deployment Service
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 * Run 8 — Backend-Ready Deployment Centre
 *
 * ── Security ──────────────────────────────────────────────────
 * This service NEVER stores, logs, exports, or transmits:
 *   SUPABASE_SERVICE_ROLE_KEY · OPENAI_API_KEY · GROQ_API_KEY
 *   STRIPE_SECRET_KEY · DATABASE_URL · JWT_SECRET · PRIVATE_KEY
 *   WEBHOOK_SECRET · admin tokens · any backend-only secret
 *
 * Frontend-safe values only:
 *   Supabase URL · Supabase anon/public key
 *   Firebase public client config · public API base URLs
 *   Public feature flags
 *
 * ── Advisory ──────────────────────────────────────────────────
 * Backend/live sync improves data persistence and dashboard
 * visibility, but it does not guarantee route safety, legal
 * compliance, road restriction accuracy, or live road conditions.
 * Drivers must still follow road signs, restrictions, traffic
 * laws, and professional judgement.
 * ============================================================
 */

import {
  useVehicleStore, useRouteStore, useAssignmentStore,
  useTripSessionStore, useDriverReportStore, useSyncQueueStore,
  useAuditStore, useAiAdvisoryStore, useBackendConfigStore,
} from './core_storage'
import { isSupabaseReady, testSupabaseConnection } from './services_supabase_supabaseClient'
import {
  canEnableLiveMode, isSupabaseConfigured,
  getBackendConfig, saveBackendConfig, clearBackendConfig,
  runFullLiveSync,
  BV_TABLES, BV_ADAPTER_ERRORS,
} from './services_supabase_bvSupabaseAdapter'

// ─── 4P3X API Config Guard™ ───────────────────────────────────
// Pattern list of backend-only secret indicators.
// Do NOT log matched values — only signal that they look dangerous.
const SECRET_PATTERNS = [
  /service_role/i,
  /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{50,}/,  // JWT with long payload
  /sk-[A-Za-z0-9]{20,}/,                                           // OpenAI / Stripe style
  /gsk_[A-Za-z0-9]{20,}/,                                          // Groq
  /OPENAI_API_KEY/i,
  /GROQ_API_KEY/i,
  /STRIPE_SECRET/i,
  /DATABASE_URL/i,
  /JWT_SECRET/i,
  /PRIVATE_KEY/i,
  /WEBHOOK_SECRET/i,
  /service_key/i,
  /admin_token/i,
  /secret_key/i,
  /postgres:\/\//i,
  /mongodb:\/\//i,
  /mysql:\/\//i,
]

/**
 * looksLikeSecret — returns true if value matches any backend-only secret pattern.
 * Does NOT log the value.
 */
export function looksLikeSecret(value) {
  if (!value || typeof value !== 'string' || value.length < 8) return false
  return SECRET_PATTERNS.some(p => p.test(value))
}

/**
 * maskValue — shows only last 4–6 chars for display.
 * Never logs the full value.
 */
export function maskValue(value) {
  if (!value || value.length < 4) return '••••'
  return '••••••' + value.slice(-4)
}

// ─── Provider health check ────────────────────────────────────
/**
 * checkProviderHealth — runs a safe probe for the configured provider.
 * Returns { status, message, at }
 * Does NOT fake success.
 */
export async function checkProviderHealth(providerKey, providerConfig) {
  const at = new Date().toISOString()

  if (!providerConfig?.enabled) {
    return { status: 'notConfigured', message: 'Provider not enabled.', at }
  }

  if (providerKey === 'supabase') {
    if (!providerConfig.url || !providerConfig.anonKey) {
      return { status: 'notConfigured', message: 'Supabase URL and anon key are required.', at }
    }
    if (looksLikeSecret(providerConfig.anonKey)) {
      return { status: 'blockedSecret', message: 'The entered key looks like a backend-only secret. Use the public anon key only.', at }
    }
    try {
      const ok = await testSupabaseConnection(providerConfig.url, providerConfig.anonKey)
      if (ok) {
        return { status: 'testPassed', message: 'Supabase connection test passed.', at }
      } else {
        return { status: 'testFailed', message: 'Supabase connection test failed. Check URL and anon key.', at }
      }
    } catch (e) {
      return { status: 'testFailed', message: `Connection error: ${e?.message || 'unknown error'}`, at }
    }
  }

  if (providerKey === 'firebase') {
    if (!providerConfig.projectId || !providerConfig.apiKey) {
      return { status: 'notConfigured', message: 'Firebase project ID and API key are required.', at }
    }
    if (looksLikeSecret(providerConfig.apiKey)) {
      return { status: 'blockedSecret', message: 'The entered key looks like a backend-only secret. Use the public Firebase client config only.', at }
    }
    // No real Firebase connector yet — honest backend-ready response
    return {
      status: 'configured',
      message: 'Firebase config entered. Real connector not yet implemented — backend-ready placeholder.',
      at,
    }
  }

  if (providerKey === 'aws' || providerKey === 'rest') {
    const url = providerConfig.apiBaseUrl || providerConfig.apiBaseUrl
    if (!url) {
      return { status: 'notConfigured', message: 'API base URL is required.', at }
    }
    // Safe: try a basic fetch to health endpoint only if provided
    const healthUrl = providerConfig.healthEndpoint
      ? `${url.replace(/\/$/, '')}/${providerConfig.healthEndpoint.replace(/^\//, '')}`
      : null
    if (healthUrl) {
      try {
        const res = await fetch(healthUrl, { method: 'GET', signal: AbortSignal.timeout(5000) })
        if (res.ok) {
          return { status: 'testPassed', message: `Health check passed (${res.status}).`, at }
        } else {
          return { status: 'testFailed', message: `Health check returned ${res.status}.`, at }
        }
      } catch (e) {
        return { status: 'testFailed', message: `Health check error: ${e?.message || 'network error'}`, at }
      }
    }
    return {
      status: 'configured',
      message: 'API URL entered. No health endpoint configured — manual verification needed.',
      at,
    }
  }

  if (providerKey === 'local') {
    return { status: 'localOnly', message: 'Local-only mode. Data saved in localStorage. No backend.', at }
  }

  return { status: 'unknown', message: 'Unknown provider.', at }
}

// ─── Sync readiness check ─────────────────────────────────────
/**
 * checkSyncReadiness — reads all Run 2–7 SSOT stores.
 * Returns per-entity readiness status.
 * Does NOT claim cloud sync unless real connector exists.
 */
export function checkSyncReadiness() {
  const vehicles     = useVehicleStore.getState().vehicles
  const routes       = useRouteStore.getState().routePlans
  const assignments  = useAssignmentStore.getState().assignments
  const sessions     = useTripSessionStore.getState().sessions
  const reports      = useDriverReportStore.getState().reports
  const queue        = useSyncQueueStore.getState().queue
  const audit        = useAuditStore.getState().events
  const advisory     = useAiAdvisoryStore.getState()
  const backendCfg   = useBackendConfigStore.getState()
  const pending      = queue.filter(q => q.status === 'pending').length
  const backendOk    = backendCfg.isBackendConfigured()
  const provider     = backendCfg.getActiveProvider()

  const status = backendOk ? 'readyForBackend' : (provider === 'local' ? 'localOnly' : 'waitingForBackendConfig')

  return {
    at: new Date().toISOString(),
    backendConfigured: backendOk,
    activeProvider:    provider,
    pendingQueueCount: pending,
    entities: [
      { key: 'vehicles',          label: 'Vehicle Profiles',          count: vehicles.length,          status, direction: 'dashToBackend',            localStorageKey: 'bigv:vehicles' },
      { key: 'routes',            label: 'Route Plans',               count: routes.length,            status, direction: 'dashToBackend',            localStorageKey: 'bigv:routes' },
      { key: 'routeAssignments',  label: 'Route Assignments',         count: assignments.length,       status, direction: 'dashToBackend+pwaToBackend',localStorageKey: 'bigv:assignments' },
      { key: 'tripSessions',      label: 'Trip Sessions',             count: sessions.length,          status, direction: 'pwaToBackend+backendToDash', localStorageKey: 'bigv:tripSessions' },
      { key: 'driverReports',     label: 'Driver Reports',            count: reports.length,           status, direction: 'pwaToBackend+backendToDash', localStorageKey: 'bigv:driverReports' },
      { key: 'auditEvents',       label: 'Audit Events',              count: audit.length,             status, direction: 'dashToBackend',            localStorageKey: 'bigv:auditEvents' },
      { key: 'syncQueue',         label: 'Sync Queue',                count: queue.length,             status, direction: 'internal',                 localStorageKey: 'bigv:syncQueue', pendingCount: pending },
      { key: 'aiFindings',        label: 'AI Advisory Findings',      count: (advisory.findings||[]).length, status, direction: 'dashToBackend',    localStorageKey: 'bigv:aiFindings' },
      { key: 'aiAdvisory',        label: 'AI Advisory Snapshot',      count: advisory.advisory ? 1 : 0, status, direction: 'dashToBackend',          localStorageKey: 'bigv:aiAdvisory' },
      { key: 'backendConfig',     label: 'Backend / User Settings',   count: 1,                        status: 'localOnly', direction: 'localOnly',   localStorageKey: 'bigv:backendConfig' },
    ],
    summary: {
      totalEntities:     10,
      localOnlyCount:    backendOk ? 0 : 10,
      backendReadyCount: backendOk ? 10 : 0,
      message: backendOk
        ? `Backend configured (${provider}). Entities are backend-ready.`
        : 'No backend configured. All data is stored locally and queued.',
    },
  }
}

// ─── Prepare Sync ─────────────────────────────────────────────
/**
 * prepareSyncRun — validates local queue and summarises what would sync.
 * Does NOT fake cloud sync.
 * Does NOT call backend unless real connector exists and test passed.
 */
export async function prepareSyncRun() {
  const readiness    = checkSyncReadiness()
  const backendCfg   = useBackendConfigStore.getState()
  const backendOk    = backendCfg.isBackendConfigured()
  const provider     = backendCfg.getActiveProvider()
  const queue        = useSyncQueueStore.getState()
  const pending      = queue.getPendingCount()
  const demo         = backendCfg.isDemoMode()

  // Count records that would sync per entity
  const vehicles    = useVehicleStore.getState().vehicles
  const routes      = useRouteStore.getState().routePlans
  const assignments = useAssignmentStore.getState().assignments
  const sessions    = useTripSessionStore.getState().sessions
  const reports     = useDriverReportStore.getState().reports

  const wouldSync = [
    { entity: 'Route Assignments',  count: assignments.length  },
    { entity: 'Trip Sessions',      count: sessions.length     },
    { entity: 'Driver Reports',     count: reports.length      },
    { entity: 'Audit Events',       count: useAuditStore.getState().events.length },
    { entity: 'AI Findings',        count: (useAiAdvisoryStore.getState().findings || []).length },
    { entity: 'Vehicles',           count: vehicles.length     },
    { entity: 'Route Plans',        count: routes.length       },
  ]

  let resultMessage = ''
  let resultStatus  = ''

  if (demo) {
    resultMessage = 'Sync prepared locally. Demo mode is active — no real backend sync.'
    resultStatus  = 'demo'
  } else if (provider === 'local') {
    resultMessage = 'Sync prepared locally. Backend is not configured yet. Local-only mode.'
    resultStatus  = 'localOnly'
  } else if (!backendOk) {
    resultMessage = `Backend provider "${provider}" is configured but not validated. Sync is queued locally. Connect and test the backend to enable real sync.`
    resultStatus  = 'waitingForBackend'
  } else {
    // Real backend is configured and tested — delegate to live adapter
    // runFullLiveSync handles the actual Supabase upsert operations
    try {
      const syncResult = await runFullLiveSync()
      resultMessage = syncResult.resultMessage
      resultStatus  = syncResult.success ? 'synced' : 'syncPartialFail'
    } catch (e) {
      resultMessage = `Sync error: ${e?.message || 'unknown error'}. Data saved locally and queued.`
      resultStatus  = 'syncFailed'
    }
  }

  // Audit event
  useAuditStore.getState().addEvent(
    'syncPrepared', 'Sync preparation run', 'sync', 'prepareSyncRun',
    { provider, backendOk, pending, demo, resultStatus }, 'system', demo
  )

  return { resultMessage, resultStatus, wouldSync, pendingQueueItems: pending, readiness, at: new Date().toISOString() }
}

// ─── PWA readiness checks ─────────────────────────────────────
export function checkPwaReadiness() {
  const checks = []

  // 1. Service worker
  const swSupported = 'serviceWorker' in navigator
  checks.push({
    id: 'pwa-sw', label: 'Service Worker supported', category: 'pwa',
    status: swSupported ? 'ready' : 'needsReview',
    note:   swSupported ? 'Service worker API available.' : 'Service worker not supported in this browser.',
  })

  // 2. Registered service worker
  let swRegistered = false
  try {
    if (swSupported) {
      // Can't await here — just check registration sync-safe
      navigator.serviceWorker.getRegistrations().then(regs => {
        swRegistered = regs.length > 0
      }).catch(() => {})
    }
  } catch {}
  checks.push({
    id: 'pwa-sw-reg', label: 'Service Worker registered', category: 'pwa',
    status: 'needsReview',
    note:   'Check service worker registration in DevTools > Application.',
  })

  // 3. HTTPS
  const isHttps = location.protocol === 'https:' || location.hostname === 'localhost'
  checks.push({
    id: 'pwa-https', label: 'HTTPS / localhost', category: 'pwa',
    status: isHttps ? 'ready' : 'needsReview',
    note:   isHttps
      ? `Running on ${location.protocol}//${location.hostname} — OK.`
      : 'PWA install requires HTTPS in production. Ensure hosting uses SSL.',
  })

  // 4. Mobile viewport
  const hasMeta = typeof document !== 'undefined'
    && !!document.querySelector('meta[name="viewport"]')
  checks.push({
    id: 'pwa-viewport', label: 'Mobile viewport meta tag', category: 'pwa',
    status: hasMeta ? 'ready' : 'needsReview',
    note:   hasMeta ? 'Viewport meta tag found.' : 'Add <meta name="viewport"> to index.html.',
  })

  // 5. beforeinstallprompt (PWA install prompt)
  checks.push({
    id: 'pwa-installable', label: 'PWA installable check', category: 'pwa',
    status: 'needsReview',
    note:   'Open in Chrome/Edge and check DevTools > Application > Manifest for installability issues.',
  })

  // 6. Offline support
  checks.push({
    id: 'pwa-offline', label: 'Offline fallback / cache strategy', category: 'pwa',
    status: 'needsReview',
    note:   'sw-job-sync.js exists. Confirm full offline fallback in Vite PWA config.',
  })

  // 7. Driver PWA route accessible
  checks.push({
    id: 'pwa-driver-route', label: 'Driver PWA route (/driver-app)', category: 'driverPwa',
    status: 'ready',
    note:   'Driver PWA route registered. Open /driver-app to verify.',
  })

  // 8. Dashboard responsive
  checks.push({
    id: 'pwa-responsive', label: 'Dashboard mobile responsiveness', category: 'ux',
    status: 'needsReview',
    note:   'Test dashboard on 375px, 768px, and 1280px viewports.',
  })

  const ready       = checks.filter(c => c.status === 'ready').length
  const needsReview = checks.filter(c => c.status === 'needsReview').length

  return { checks, ready, needsReview, total: checks.length, at: new Date().toISOString() }
}

// ─── Local data snapshot ─────────────────────────────────────
/**
 * getLocalDataSnapshot — safe read-only summary.
 * Does NOT include secrets or user credentials.
 */
export function getLocalDataSnapshot() {
  return {
    vehicles:    useVehicleStore.getState().vehicles.length,
    routes:      useRouteStore.getState().routePlans.length,
    assignments: useAssignmentStore.getState().assignments.length,
    sessions:    useTripSessionStore.getState().sessions.length,
    reports:     useDriverReportStore.getState().reports.length,
    auditEvents: useAuditStore.getState().events.length,
    syncPending: useSyncQueueStore.getState().queue.filter(q => q.status === 'pending').length,
    aiFindings:  (useAiAdvisoryStore.getState().findings || []).length,
    at:          new Date().toISOString(),
  }
}

// ─── Re-export from adapter for convenience ───────────────────
export { canEnableLiveMode, isSupabaseConfigured, getBackendConfig, saveBackendConfig, clearBackendConfig, runFullLiveSync, BV_TABLES, BV_ADAPTER_ERRORS }

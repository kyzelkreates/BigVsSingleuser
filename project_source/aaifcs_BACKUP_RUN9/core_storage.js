/**
 * ============================================================
 * Big V's Best Routes™ — SINGLE SOURCE OF TRUTH
 * /src/core/storage.js
 *
 * ALL system state reads and writes through this module.
 * NO secondary state engines.
 * NO duplicate localStorage keys.
 * NO hard-coded UI state outside this file.
 * ============================================================
 */

import { create } from 'zustand'

// ─── Storage Keys ─────────────────────────────────────────────
export const STORAGE_KEYS = {
  // App
  APP_THEME:          'apex:app:theme',
  APP_SIDEBAR:        'apex:app:sidebar',
  APP_LOCALE:         'apex:app:locale',

  // Auth
  AUTH_SESSION:       'apex:auth:session',
  AUTH_USER:          'apex:auth:user',
  AUTH_ROLE:          'apex:auth:role',

  // Fleet (original)
  FLEET_ACTIVE_VIEW:  'apex:fleet:activeView',
  FLEET_FILTERS:      'apex:fleet:filters',
  FLEET_SELECTED:     'apex:fleet:selected',

  // Big V — Vehicle Manager (Run 2)
  BV_VEHICLES:        'bigv:vehicles',
  BV_ACTIVE_VEHICLE:  'bigv:activeVehicleId',

  // Big V — Route Planner (Run 3)
  BV_ROUTES:          'bigv:routePlans',
  BV_ACTIVE_ROUTE:    'bigv:activeRouteId',

  // Map
  MAP_PROVIDER:       'apex:map:provider',
  MAP_CENTER:         'apex:map:center',
  MAP_ZOOM:           'apex:map:zoom',
  MAP_LAYER:          'apex:map:layer',

  // Big V map mode (Run 4)
  BV_MAP_MODE:        'bigv:mapMode',           // '2d' | '3d'
  BV_GPS_STATUS:      'bigv:gpsStatus',         // 'unknown'|'ready'|'denied'|'unavailable'
  BV_LAST_POSITION:   'bigv:lastKnownPosition', // {lat, lng, accuracy, timestamp}

  // Big V Navigation Session (Run 5)
  BV_NAV_SESSION:     'bigv:navSession',        // driverNavigationSession object

  // Big V Run 6 — Operational Sync Layer
  BV_ASSIGNMENTS:     'bigv:assignments',       // routeAssignment[]
  BV_TRIP_SESSIONS:   'bigv:tripSessions',      // tripSession[]
  BV_DRIVER_REPORTS:  'bigv:driverReports',     // driverReport[]
  BV_SYNC_QUEUE:      'bigv:syncQueue',         // syncQueueItem[]
  BV_AUDIT_EVENTS:    'bigv:auditEvents',       // auditEvent[]
  BV_SYNC_STATUS:     'bigv:syncStatus',        // { lastSyncAt, pendingCount, mode }

  // Big V Run 7 — 4P3X Intelligent AI™ Advisory Layer
  BV_AI_ADVISORY:     'bigv:aiAdvisory',        // aiAdvisory state object
  BV_AI_FINDINGS:     'bigv:aiFindings',        // aiFindings[]
  BV_AI_AGENT_RUNS:   'bigv:aiAgentRuns',       // agentRun[]

  // Big V Run 8 — Backend-Ready Deployment Layer
  BV_BACKEND_CONFIG:      'bigv:backendConfig',      // provider config (safe public fields only)
  BV_DEPLOY_CHECKLIST:    'bigv:deployChecklist',    // productionChecklist item states
  BV_PWA_READINESS:       'bigv:pwaReadiness',       // PWA readiness checks
  BV_SYNC_READINESS:      'bigv:syncReadiness',      // sync readiness snapshot
  BV_PROVIDER_HEALTH:     'bigv:providerHealth',     // last health check per provider

  // AI
  AI_PROVIDER:        'apex:ai:provider',
  AI_MODEL:           'apex:ai:model',
  AI_CONFIG:          'apex:ai:config',

  // Driver
  DRIVER_SELECTED:    'apex:driver:selected',
  DRIVER_SESSION:     'apex:driver:session',

  // Navigation
  NAV_ROUTE:          'apex:nav:route',
  NAV_DESTINATION:    'apex:nav:destination',
  NAV_MODE:           'apex:nav:mode',

  // Notifications
  NOTIF_QUEUE:        'apex:notif:queue',
  NOTIF_PREFS:        'apex:notif:prefs',
}

// ─── Persist Helpers ──────────────────────────────────────────
const persist = {
  get: (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.warn('[Apex:Storage] persist.set failed:', key, e)
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      // silent
    }
  },
  clear: (prefix = 'apex:') => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(prefix))
        .forEach(k => localStorage.removeItem(k))
    } catch {
      // silent
    }
  }
}

// ─── App Store ────────────────────────────────────────────────
export const useAppStore = create((set, get) => ({
  // ── State ──
  theme:           persist.get(STORAGE_KEYS.APP_THEME, 'dark'),
  sidebarExpanded: false, // burger mode — always starts closed
  locale:          persist.get(STORAGE_KEYS.APP_LOCALE, 'en'),
  systemStatus:    'online',   // 'online' | 'offline' | 'degraded'
  notifications:   [],
  alerts:          [],

  // ── Actions ──
  setTheme: (theme) => {
    persist.set(STORAGE_KEYS.APP_THEME, theme)
    set({ theme })
  },
  toggleSidebar: () => {
    const next = !get().sidebarExpanded
    persist.set(STORAGE_KEYS.APP_SIDEBAR, next)
    set({ sidebarExpanded: next })
  },
  setSidebarExpanded: (val) => {
    persist.set(STORAGE_KEYS.APP_SIDEBAR, val)
    set({ sidebarExpanded: val })
  },
  closeSidebar: () => set({ sidebarExpanded: false }),
  openSidebar:  () => set({ sidebarExpanded: true }),
  setSystemStatus: (status) => set({ systemStatus: status }),
  addNotification: (notif) => set(s => ({
    notifications: [{ id: Date.now(), ...notif }, ...s.notifications].slice(0, 50)
  })),
  clearNotifications: () => set({ notifications: [] }),
  addAlert: (alert) => set(s => ({
    alerts: [{ id: Date.now(), ...alert }, ...s.alerts].slice(0, 20)
  })),
  dismissAlert: (id) => set(s => ({
    alerts: s.alerts.filter(a => a.id !== id)
  })),
}))

// ─── Auth Store ───────────────────────────────────────────────
export const useAuthStore = create((set) => ({
  // ── State ──
  session:       persist.get(STORAGE_KEYS.AUTH_SESSION, null),
  user:          persist.get(STORAGE_KEYS.AUTH_USER, null),
  role:          persist.get(STORAGE_KEYS.AUTH_ROLE, null),
  isLoading:     false,
  isAuthenticated: false,

  // ── Actions ──
  setSession: (session) => {
    persist.set(STORAGE_KEYS.AUTH_SESSION, session)
    set({ session, isAuthenticated: !!session })
  },
  setUser: (user) => {
    persist.set(STORAGE_KEYS.AUTH_USER, user)
    set({ user })
  },
  setRole: (role) => {
    persist.set(STORAGE_KEYS.AUTH_ROLE, role)
    set({ role })
  },
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => {
    persist.remove(STORAGE_KEYS.AUTH_SESSION)
    persist.remove(STORAGE_KEYS.AUTH_USER)
    persist.remove(STORAGE_KEYS.AUTH_ROLE)
    set({ session: null, user: null, role: null, isAuthenticated: false })
  }
}))

// ─── Fleet Store ──────────────────────────────────────────────
export const useFleetStore = create((set) => ({
  // ── State ──
  vehicles:      [],
  activeVehicle: null,
  activeView:    persist.get(STORAGE_KEYS.FLEET_ACTIVE_VIEW, 'grid'),
  filters:       persist.get(STORAGE_KEYS.FLEET_FILTERS, {}),
  selectedIds:   persist.get(STORAGE_KEYS.FLEET_SELECTED, []),
  isLoading:     false,
  telemetry:     {},

  // ── Actions ──
  setVehicles: (vehicles) => set({ vehicles }),
  setActiveVehicle: (v) => set({ activeVehicle: v }),
  setActiveView: (view) => {
    persist.set(STORAGE_KEYS.FLEET_ACTIVE_VIEW, view)
    set({ activeView: view })
  },
  setFilters: (filters) => {
    persist.set(STORAGE_KEYS.FLEET_FILTERS, filters)
    set({ filters })
  },
  setSelectedIds: (ids) => {
    persist.set(STORAGE_KEYS.FLEET_SELECTED, ids)
    set({ selectedIds: ids })
  },
  setLoading: (isLoading) => set({ isLoading }),
  updateTelemetry: (vehicleId, data) => set(s => ({
    telemetry: { ...s.telemetry, [vehicleId]: { ...s.telemetry[vehicleId], ...data, ts: Date.now() } }
  }))
}))

// ─── Map Store ────────────────────────────────────────────────
export const useMapStore = create((set) => ({
  // ── State ──
  provider:   persist.get(STORAGE_KEYS.MAP_PROVIDER, 'osm'),  // OSM is always-on; upgrades auto when GH/Google key set
  center:     persist.get(STORAGE_KEYS.MAP_CENTER, { lat: 51.5074, lng: -0.1278 }),
  zoom:       persist.get(STORAGE_KEYS.MAP_ZOOM, 11),
  layer:      persist.get(STORAGE_KEYS.MAP_LAYER, 'tactical'),
  isLoaded:   false,
  markers:    [],
  routes:     [],
  geofences:  [],

  // ── Actions ──
  setProvider: (provider) => {
    persist.set(STORAGE_KEYS.MAP_PROVIDER, provider)
    set({ provider })
  },
  setCenter: (center) => {
    persist.set(STORAGE_KEYS.MAP_CENTER, center)
    set({ center })
  },
  setZoom: (zoom) => {
    persist.set(STORAGE_KEYS.MAP_ZOOM, zoom)
    set({ zoom })
  },
  setLayer: (layer) => {
    persist.set(STORAGE_KEYS.MAP_LAYER, layer)
    set({ layer })
  },
  setLoaded: (isLoaded) => set({ isLoaded }),
  setMarkers: (markers) => set({ markers }),
  addMarker: (m) => set(s => ({ markers: [...s.markers, m] })),
  setRoutes: (routes) => set({ routes }),
  setGeofences: (geofences) => set({ geofences }),

  // ── Run 4: Big V Map Mode + GPS ──────────────────────────
  mapMode:       persist.get(STORAGE_KEYS.BV_MAP_MODE, '2d'),    // '2d' | '3d'
  gpsStatus:     persist.get(STORAGE_KEYS.BV_GPS_STATUS, 'unknown'),
  lastPosition:  persist.get(STORAGE_KEYS.BV_LAST_POSITION, null),
  mapFallback:   null,   // reason string if 3D fell back to 2D

  setMapMode: (mode) => {
    persist.set(STORAGE_KEYS.BV_MAP_MODE, mode)
    set({ mapMode: mode, mapFallback: null })
  },
  setMapFallback: (reason) => set({ mapMode: '2d', mapFallback: reason }),
  setGpsStatus: (status) => {
    persist.set(STORAGE_KEYS.BV_GPS_STATUS, status)
    set({ gpsStatus: status })
  },
  setLastPosition: (pos) => {
    if (pos) persist.set(STORAGE_KEYS.BV_LAST_POSITION, pos)
    set({ lastPosition: pos })
  },
}))


// ─── Big V Navigation Session Store (Run 5 SSOT) ────────────
// Persisted to localStorage via bigv:navSession.
// Single source of truth for driver navigation session state.
//
// Navigation statuses:
//   notStarted → awaitingAcknowledgement → ready → gpsStarting
//   → inProgress → paused → inProgress → completed
//   any unsafe condition → needsReview
//   GPS failure → gpsUnavailable → inProgress (map-review mode)
//   error
//
// ADVISORY: navigation is route-support only. Driver remains
// fully responsible for safe and legal driving.
export const useNavStore = create((set, get) => ({
  session: persist.get(STORAGE_KEYS.BV_NAV_SESSION, null),

  // ── Getters ─────────────────────────────────────────────
  getSession: () => get().session,

  // ── Set full session ───────────────────────────────────
  setSession: (s) => {
    const updated = { ...s, lastSavedAt: new Date().toISOString() }
    persist.set(STORAGE_KEYS.BV_NAV_SESSION, updated)
    set({ session: updated })
  },

  // ── Patch session fields ───────────────────────────────
  patchSession: (fields) => {
    const prev = get().session
    if (!prev) return
    const updated = { ...prev, ...fields, lastSavedAt: new Date().toISOString() }
    persist.set(STORAGE_KEYS.BV_NAV_SESSION, updated)
    set({ session: updated })
  },

  // ── Status transition ──────────────────────────────────
  setStatus: (status) => {
    const prev = get().session
    if (!prev) return
    const now   = new Date().toISOString()
    const times = {}
    if (status === 'inProgress'  && !prev.startedAt)   times.startedAt   = now
    if (status === 'paused')                            times.pausedAt    = now
    if (status === 'inProgress'  && prev.pausedAt)     times.resumedAt   = now
    if (status === 'completed')                         times.completedAt = now
    const updated = { ...prev, ...times, status, lastSavedAt: now }
    persist.set(STORAGE_KEYS.BV_NAV_SESSION, updated)
    set({ session: updated })
  },

  // ── Initialise a new session for a route+vehicle ───────
  initSession: (routeId, vehicleId, demoMode = false) => {
    const s = {
      sessionId:                `bv-nav-${Date.now()}`,
      routeId,
      vehicleId,
      status:                   'notStarted',
      startedAt:                null,
      pausedAt:                 null,
      resumedAt:                null,
      completedAt:              null,
      lastKnownPosition:        null,
      gpsStatus:                'idle',
      mapMode:                  '2d',
      acknowledgementAccepted:  false,
      acknowledgementAcceptedAt: null,
      checklist:                {
        correctVehicle:      false,
        dimensionsReviewed:  false,
        weightReviewed:      false,
        routeReviewed:       false,
        advisoryUnderstood:  false,
        willFollowLiveSigns: false,
        deviceSafelyMounted: false,
        gpsBatteryChecked:   false,
        willStopIfUnsure:    false,
      },
      warningsAtStart:          [],
      warningsDuringRoute:      [],
      demoMode,
      syncStatus:               'local',
      lastSavedAt:              new Date().toISOString(),
    }
    persist.set(STORAGE_KEYS.BV_NAV_SESSION, s)
    set({ session: s })
    return s
  },

  // ── Clear session ──────────────────────────────────────
  clearSession: () => {
    persist.set(STORAGE_KEYS.BV_NAV_SESSION, null)
    set({ session: null })
  },

  // ── Checklist update ───────────────────────────────────
  setChecklistItem: (key, value) => {
    const prev = get().session
    if (!prev) return
    const checklist = { ...prev.checklist, [key]: value }
    const updated   = { ...prev, checklist, lastSavedAt: new Date().toISOString() }
    persist.set(STORAGE_KEYS.BV_NAV_SESSION, updated)
    set({ session: updated })
  },

  // ── Update last known position ────────────────────────
  updatePosition: (pos) => {
    const prev = get().session
    if (!prev) return
    const updated = { ...prev, lastKnownPosition: pos, lastSavedAt: new Date().toISOString() }
    persist.set(STORAGE_KEYS.BV_NAV_SESSION, updated)
    set({ session: updated })
  },

  // ── Add a warning ─────────────────────────────────────
  addWarning: (warning, phase = 'during') => {
    const prev = get().session
    if (!prev) return
    const key     = phase === 'start' ? 'warningsAtStart' : 'warningsDuringRoute'
    const updated = { ...prev, [key]: [...(prev[key] || []), { ...warning, at: new Date().toISOString() }] }
    persist.set(STORAGE_KEYS.BV_NAV_SESSION, updated)
    set({ session: updated })
  },
}))

// ─── Big V Run 6 SSOT Stores ─────────────────────────────────
// All mutations must use the store actions — no direct state writes.
// Local-first: all data persists through the persist helper.
// ─────────────────────────────────────────────────────────────

// ── Route Assignment Store ────────────────────────────────────
export const useAssignmentStore = create((set, get) => ({
  assignments: persist.get(STORAGE_KEYS.BV_ASSIGNMENTS, []),

  getAssignment: (id) => get().assignments.find(a => a.id === id) || null,

  createAssignment: (routePlan, vehicle, opts = {}) => {
    const now = new Date().toISOString()
    const a = {
      id:                `bv-asgn-${Date.now()}`,
      routeId:           routePlan?.id   || null,
      routeName:         routePlan?.name || `${routePlan?.origin?.label || '?'} → ${routePlan?.destination?.label || '?'}`,
      vehicleId:         vehicle?.id     || null,
      vehicleName:       vehicle?.name   || '—',
      origin:            routePlan?.origin        || null,
      destination:       routePlan?.destination   || null,
      priority:          opts.priority            || 'normal',
      notes:             opts.notes               || '',
      safetyReviewRequired: opts.safetyReviewRequired || false,
      status:            'assigned',
      syncStatus:        'pending',
      demoMode:          opts.demoMode            || false,
      createdAt:         now,
      updatedAt:         now,
      timeline:          [{ type: 'assignment_created', label: 'Assignment created', at: now, source: 'dashboard' }],
    }
    const assignments = [...get().assignments, a]
    persist.set(STORAGE_KEYS.BV_ASSIGNMENTS, assignments)
    set({ assignments })
    return a
  },

  updateAssignment: (id, fields) => {
    const now = new Date().toISOString()
    const assignments = get().assignments.map(a =>
      a.id === id ? { ...a, ...fields, updatedAt: now } : a
    )
    persist.set(STORAGE_KEYS.BV_ASSIGNMENTS, assignments)
    set({ assignments })
  },

  addAssignmentEvent: (id, event) => {
    const now = new Date().toISOString()
    const assignments = get().assignments.map(a => {
      if (a.id !== id) return a
      return { ...a, timeline: [...(a.timeline||[]), { ...event, at: now }], updatedAt: now }
    })
    persist.set(STORAGE_KEYS.BV_ASSIGNMENTS, assignments)
    set({ assignments })
  },

  setAssignmentStatus: (id, status, source = 'system') => {
    const now = new Date().toISOString()
    const STATUS_LABELS = {
      draft:'Draft', assigned:'Assigned', received:'Received by driver',
      reviewed:'Route reviewed', inProgress:'Navigation started', paused:'Navigation paused',
      completed:'Route completed', needsReview:'Needs review', cancelled:'Cancelled',
    }
    const assignments = get().assignments.map(a => {
      if (a.id !== id) return a
      const event = { type: `status_${status}`, label: STATUS_LABELS[status] || status, source, at: now }
      return { ...a, status, updatedAt: now, timeline: [...(a.timeline||[]), event] }
    })
    persist.set(STORAGE_KEYS.BV_ASSIGNMENTS, assignments)
    set({ assignments })
  },

  cancelAssignment: (id) => {
    get().setAssignmentStatus(id, 'cancelled', 'dashboard')
  },

  deleteAssignment: (id) => {
    const assignments = get().assignments.filter(a => a.id !== id)
    persist.set(STORAGE_KEYS.BV_ASSIGNMENTS, assignments)
    set({ assignments })
  },
}))

// ── Trip Session Store ────────────────────────────────────────
export const useTripSessionStore = create((set, get) => ({
  sessions: persist.get(STORAGE_KEYS.BV_TRIP_SESSIONS, []),

  getSession: (id) => get().sessions.find(s => s.id === id) || null,
  getByAssignment: (assignmentId) => get().sessions.find(s => s.assignmentId === assignmentId) || null,

  createSession: (assignment, navSession = {}) => {
    const now = new Date().toISOString()
    const s = {
      id:                    `bv-trip-${Date.now()}`,
      assignmentId:          assignment?.id   || null,
      routeId:               assignment?.routeId   || navSession.routeId   || null,
      vehicleId:             assignment?.vehicleId || navSession.vehicleId || null,
      status:                'active',
      startedAt:             now,
      pausedAt:              null,
      resumedAt:             null,
      completedAt:           null,
      lastKnownPosition:     navSession.lastKnownPosition || null,
      gpsStatus:             navSession.gpsStatus         || 'idle',
      mapMode:               navSession.mapMode           || '2d',
      acknowledgementAccepted:   navSession.acknowledgementAccepted    || false,
      acknowledgementAcceptedAt: navSession.acknowledgementAcceptedAt  || null,
      checklistCompleted:        false,
      checklistSnapshot:         navSession.checklist || {},
      warningsAtStart:           navSession.warningsAtStart   || [],
      warningsDuringTrip:        [],
      driverNotes:               '',
      reportsLinked:             [],
      demoMode:                  navSession.demoMode || false,
      liveMode:                  false,
      syncStatus:                'syncPending',
      createdAt:                 now,
      updatedAt:                 now,
    }
    const sessions = [...get().sessions, s]
    persist.set(STORAGE_KEYS.BV_TRIP_SESSIONS, sessions)
    set({ sessions })
    return s
  },

  patchSession: (id, fields) => {
    const now = new Date().toISOString()
    const sessions = get().sessions.map(s =>
      s.id === id ? { ...s, ...fields, updatedAt: now } : s
    )
    persist.set(STORAGE_KEYS.BV_TRIP_SESSIONS, sessions)
    set({ sessions })
  },

  setSessionStatus: (id, status) => {
    const now = new Date().toISOString()
    const times = {}
    if (status === 'paused')    times.pausedAt    = now
    if (status === 'active' )   times.resumedAt   = now
    if (status === 'completed') times.completedAt = now
    const sessions = get().sessions.map(s =>
      s.id === id ? { ...s, ...times, status, syncStatus: 'syncPending', updatedAt: now } : s
    )
    persist.set(STORAGE_KEYS.BV_TRIP_SESSIONS, sessions)
    set({ sessions })
  },

  linkReport: (sessionId, reportId) => {
    const sessions = get().sessions.map(s =>
      s.id === sessionId
        ? { ...s, reportsLinked: [...new Set([...(s.reportsLinked||[]), reportId])], updatedAt: new Date().toISOString() }
        : s
    )
    persist.set(STORAGE_KEYS.BV_TRIP_SESSIONS, sessions)
    set({ sessions })
  },

  addWarning: (sessionId, warning) => {
    const now = new Date().toISOString()
    const sessions = get().sessions.map(s =>
      s.id === sessionId
        ? { ...s, warningsDuringTrip: [...(s.warningsDuringTrip||[]), { ...warning, at: now }], updatedAt: now }
        : s
    )
    persist.set(STORAGE_KEYS.BV_TRIP_SESSIONS, sessions)
    set({ sessions })
  },
}))

// ── Driver Report Store ───────────────────────────────────────
export const useDriverReportStore = create((set, get) => ({
  reports: persist.get(STORAGE_KEYS.BV_DRIVER_REPORTS, []),

  getReport: (id) => get().reports.find(r => r.id === id) || null,

  submitReport: (data) => {
    const now = new Date().toISOString()
    const r = {
      id:              `bv-rpt-${Date.now()}`,
      reportType:      data.reportType      || 'other',
      severity:        data.severity        || 'info',
      notes:           data.notes           || '',
      routeId:         data.routeId         || null,
      vehicleId:       data.vehicleId       || null,
      tripSessionId:   data.tripSessionId   || null,
      assignmentId:    data.assignmentId    || null,
      gpsPosition:     data.gpsPosition     || null,
      manualLocation:  data.manualLocation  || '',
      status:          'new',
      demoMode:        data.demoMode        || false,
      syncStatus:      'syncPending',
      submittedAt:     now,
      updatedAt:       now,
      reviewedAt:      null,
      reviewNote:      '',
    }
    const reports = [r, ...get().reports]
    persist.set(STORAGE_KEYS.BV_DRIVER_REPORTS, reports)
    set({ reports })
    return r
  },

  setReportStatus: (id, status, note = '') => {
    const now = new Date().toISOString()
    const reports = get().reports.map(r =>
      r.id === id ? { ...r, status, reviewNote: note, reviewedAt: now, updatedAt: now } : r
    )
    persist.set(STORAGE_KEYS.BV_DRIVER_REPORTS, reports)
    set({ reports })
  },

  deleteReport: (id) => {
    const reports = get().reports.filter(r => r.id !== id)
    persist.set(STORAGE_KEYS.BV_DRIVER_REPORTS, reports)
    set({ reports })
  },
}))

// ── Sync Queue Store ──────────────────────────────────────────
export const useSyncQueueStore = create((set, get) => ({
  queue: persist.get(STORAGE_KEYS.BV_SYNC_QUEUE, []),

  enqueue: (entityType, entityId, action, payload = {}, demoMode = false) => {
    const item = {
      queueId:     `bv-q-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      entityType,
      entityId,
      action,
      payload,
      status:      demoMode ? 'pending' : 'pending',
      demoMode,
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
      lastAttemptAt: null,
      error:       null,
    }
    const queue = [...get().queue, item]
    persist.set(STORAGE_KEYS.BV_SYNC_QUEUE, queue)
    set({ queue })
    return item
  },

  processQueue: (demoMode = false) => {
    const now = new Date().toISOString()
    const result = { synced: 0, skipped: 0, failed: 0 }
    const queue = get().queue.map(item => {
      if (item.status === 'syncedLocal' || item.status === 'skippedDemo') return item
      if (demoMode) {
        result.skipped++
        return { ...item, status: 'skippedDemo', updatedAt: now, lastAttemptAt: now }
      }
      result.synced++
      return { ...item, status: 'syncedLocal', updatedAt: now, lastAttemptAt: now }
    })
    persist.set(STORAGE_KEYS.BV_SYNC_QUEUE, queue)
    set({ queue })
    return result
  },

  getPendingCount: () => get().queue.filter(i => i.status === 'pending').length,

  clearCompleted: () => {
    const queue = get().queue.filter(i => i.status === 'pending' || i.status === 'failed')
    persist.set(STORAGE_KEYS.BV_SYNC_QUEUE, queue)
    set({ queue })
  },
}))

// ── Audit Event Store ─────────────────────────────────────────
export const useAuditStore = create((set, get) => ({
  events: persist.get(STORAGE_KEYS.BV_AUDIT_EVENTS, []),

  addEvent: (type, label, entityType, entityId, details = {}, source = 'system', demoMode = false) => {
    const ev = {
      eventId:    `bv-ev-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
      type,
      label,
      entityType,
      entityId,
      timestamp:  new Date().toISOString(),
      source,
      details,
      demoMode,
      syncStatus: 'local',
    }
    const events = [ev, ...get().events].slice(0, 500) // cap at 500
    persist.set(STORAGE_KEYS.BV_AUDIT_EVENTS, events)
    set({ events })
    return ev
  },

  getByEntity: (entityType, entityId) =>
    get().events.filter(e => e.entityType === entityType && e.entityId === entityId),

  clearOlderThan: (days = 30) => {
    const cutoff = Date.now() - days * 86400000
    const events = get().events.filter(e => new Date(e.timestamp).getTime() > cutoff)
    persist.set(STORAGE_KEYS.BV_AUDIT_EVENTS, events)
    set({ events })
  },
}))

// ── Sync Status Store ─────────────────────────────────────────
export const useSyncStatusStore = create((set, get) => ({
  lastSyncAt:      persist.get(STORAGE_KEYS.BV_SYNC_STATUS, {})?.lastSyncAt || null,
  lastSyncResult:  persist.get(STORAGE_KEYS.BV_SYNC_STATUS, {})?.lastSyncResult || null,
  isSyncing:       false,

  setLastSync: (result) => {
    const data = { lastSyncAt: new Date().toISOString(), lastSyncResult: result }
    persist.set(STORAGE_KEYS.BV_SYNC_STATUS, data)
    set({ lastSyncAt: data.lastSyncAt, lastSyncResult: result, isSyncing: false })
  },
  setSyncing: (v) => set({ isSyncing: v }),
}))

// ─── Big V Run 8 SSOT — Backend Config Store ────────────────
// Stores ONLY frontend-safe public configuration values.
// NEVER stores service role keys, OPENAI_API_KEY, JWT_SECRET,
// DATABASE_URL, WEBHOOK_SECRET, STRIPE_SECRET_KEY, GROQ_API_KEY,
// PRIVATE_KEY, admin tokens, or any backend-only secret.
// ─────────────────────────────────────────────────────────────

const BACKEND_DEFAULTS = {
  activeProvider:    'local',             // 'local'|'supabase'|'firebase'|'aws'|'rest'
  demoMode:          true,               // demo mode on by default
  providers: {
    supabase: {
      enabled:         false,
      url:             '',
      anonKey:         '',               // public anon key only — NOT service role key
      projectRef:      '',
      status:          'notConfigured',  // 'notConfigured'|'configured'|'testPassed'|'testFailed'
      lastTestedAt:    null,
      notes:           '',
    },
    firebase: {
      enabled:         false,
      projectId:       '',
      apiKey:          '',               // public Firebase client key only
      authDomain:      '',
      databaseUrl:     '',
      status:          'notConfigured',
      lastTestedAt:    null,
      notes:           '',
    },
    aws: {
      enabled:         false,
      apiBaseUrl:      '',
      region:          '',
      authModeLabel:   '',
      status:          'notConfigured',
      lastTestedAt:    null,
      notes:           '',
    },
    rest: {
      enabled:         false,
      apiBaseUrl:      '',
      healthEndpoint:  '',
      publicClientToken: '',             // public/client-safe token only
      status:          'notConfigured',
      lastTestedAt:    null,
      notes:           '',
    },
  },
  localFallback: {
    enabled:         true,
    notes:           '',
  },
}

export const useBackendConfigStore = create((set, get) => ({
  config: persist.get(STORAGE_KEYS.BV_BACKEND_CONFIG, BACKEND_DEFAULTS),

  // ── Selectors ─────────────────────────────────────────────
  getActiveProvider: () => get().config.activeProvider,
  isDemoMode:        () => get().config.demoMode,
  isLiveMode:        () => !get().config.demoMode,
  isBackendConfigured: () => {
    const p = get().config.activeProvider
    const providers = get().config.providers
    if (p === 'local') return false
    return providers[p]?.status === 'testPassed' || providers[p]?.status === 'configured'
  },

  // ── Mutations ─────────────────────────────────────────────
  setDemoMode: (on) => {
    const config = { ...get().config, demoMode: on }
    persist.set(STORAGE_KEYS.BV_BACKEND_CONFIG, config)
    set({ config })
  },
  setActiveProvider: (provider) => {
    const config = { ...get().config, activeProvider: provider }
    persist.set(STORAGE_KEYS.BV_BACKEND_CONFIG, config)
    set({ config })
  },
  updateProvider: (providerKey, fields) => {
    const config = {
      ...get().config,
      providers: {
        ...get().config.providers,
        [providerKey]: { ...get().config.providers[providerKey], ...fields },
      },
    }
    persist.set(STORAGE_KEYS.BV_BACKEND_CONFIG, config)
    set({ config })
  },
  setProviderStatus: (providerKey, status) => {
    get().updateProvider(providerKey, { status, lastTestedAt: new Date().toISOString() })
  },
  resetProvider: (providerKey) => {
    const defaults = BACKEND_DEFAULTS.providers[providerKey] || {}
    get().updateProvider(providerKey, defaults)
  },
}))

// ── Deployment Checklist Store ─────────────────────────────
const CHECKLIST_DEFAULTS = [
  { id: 'bv-cl-brand',       label: 'Branding correct — Big V's Best Routes™',                         checked: false, category: 'product' },
  { id: 'bv-cl-demo-off',    label: 'Demo mode can be switched off',                                     checked: false, category: 'mode'    },
  { id: 'bv-cl-demo-iso',    label: 'Demo data does not mix with live data',                             checked: false, category: 'mode'    },
  { id: 'bv-cl-backend',     label: 'Backend provider selected',                                         checked: false, category: 'backend' },
  { id: 'bv-cl-pub-keys',    label: 'Frontend-safe public keys configured',                              checked: false, category: 'backend' },
  { id: 'bv-cl-no-secrets',  label: 'Backend-only secrets excluded from frontend',                       checked: false, category: 'security'},
  { id: 'bv-cl-sync-queue',  label: 'Sync queue visible and working',                                    checked: false, category: 'sync'    },
  { id: 'bv-cl-driver-pwa',  label: 'Driver PWA opens correctly',                                        checked: false, category: 'pwa'     },
  { id: 'bv-cl-map',         label: 'OSM/MapLibre map layer works',                                      checked: false, category: 'features'},
  { id: 'bv-cl-gps',         label: 'GPS safe navigation works',                                         checked: false, category: 'features'},
  { id: 'bv-cl-assignments',  label: 'Route assignments work',                                            checked: false, category: 'features'},
  { id: 'bv-cl-trips',       label: 'Trip sessions work',                                                checked: false, category: 'features'},
  { id: 'bv-cl-reports',     label: 'Driver reports work',                                               checked: false, category: 'features'},
  { id: 'bv-cl-ai',          label: 'AI advisory layer works',                                           checked: false, category: 'ai'      },
  { id: 'bv-cl-disclaimers', label: 'Safety/legal disclaimers visible',                                  checked: false, category: 'safety'  },
  { id: 'bv-cl-pwa-checks',  label: 'PWA install readiness checks passed',                               checked: false, category: 'pwa'     },
  { id: 'bv-cl-mobile',      label: 'Mobile responsiveness checked',                                     checked: false, category: 'ux'      },
  { id: 'bv-cl-console',     label: 'No console errors in production mode',                              checked: false, category: 'qa'      },
  { id: 'bv-cl-rollback',    label: 'Rollback plan documented',                                          checked: false, category: 'qa'      },
]

export const useDeploymentChecklistStore = create((set, get) => ({
  items: persist.get(STORAGE_KEYS.BV_DEPLOY_CHECKLIST, CHECKLIST_DEFAULTS),

  toggleItem: (id) => {
    const items = get().items.map(i => i.id === id ? { ...i, checked: !i.checked } : i)
    persist.set(STORAGE_KEYS.BV_DEPLOY_CHECKLIST, items)
    set({ items })
  },
  resetAll: () => {
    const items = CHECKLIST_DEFAULTS.map(i => ({ ...i, checked: false }))
    persist.set(STORAGE_KEYS.BV_DEPLOY_CHECKLIST, items)
    set({ items })
  },
  getProgress: () => {
    const { items } = get()
    return { done: items.filter(i => i.checked).length, total: items.length }
  },
}))

// ─── Big V Run 7 SSOT — AI Advisory Store ────────────────────
// Stores results from the local-first 4P3X Intelligent AI™ advisory agents.
// No external AI API is called here — all logic is deterministic local rules.
// ─────────────────────────────────────────────────────────────

export const useAiAdvisoryStore = create((set, get) => ({
  // ── Advisory snapshot ────────────────────────────────────────
  advisory: persist.get(STORAGE_KEYS.BV_AI_ADVISORY, null),

  // ── Findings list ─────────────────────────────────────────────
  findings: persist.get(STORAGE_KEYS.BV_AI_FINDINGS, []),

  // ── Agent run log ─────────────────────────────────────────────
  agentRuns: persist.get(STORAGE_KEYS.BV_AI_AGENT_RUNS, []),

  // ── Mutations ─────────────────────────────────────────────────
  setAdvisory: (advisory) => {
    const updated = { ...advisory, lastUpdatedAt: new Date().toISOString() }
    persist.set(STORAGE_KEYS.BV_AI_ADVISORY, updated)
    set({ advisory: updated })
  },

  setFindings: (findings) => {
    persist.set(STORAGE_KEYS.BV_AI_FINDINGS, findings)
    set({ findings })
  },

  resolveFinding: (findingId, status = 'acknowledged') => {
    const findings = get().findings.map(f =>
      f.findingId === findingId ? { ...f, resolvedStatus: status, resolvedAt: new Date().toISOString() } : f
    )
    persist.set(STORAGE_KEYS.BV_AI_FINDINGS, findings)
    set({ findings })
  },

  addAgentRun: (run) => {
    const agentRuns = [run, ...get().agentRuns].slice(0, 100) // cap at 100
    persist.set(STORAGE_KEYS.BV_AI_AGENT_RUNS, agentRuns)
    set({ agentRuns })
  },

  clearFindings: () => {
    persist.set(STORAGE_KEYS.BV_AI_FINDINGS, [])
    set({ findings: [] })
  },
}))

// ─── Big V Vehicle Store (Run 2 SSOT) ────────────────────────
// Single source of truth for all saved vehicle profiles.
// Persisted to localStorage via bigv:vehicles / bigv:activeVehicleId.
// DO NOT duplicate state — all vehicle reads/writes go through here.
//
// Helpers (calculateVehicleReadiness, getMissingVehicleFields,
// getVehicleTemplate) live in services_vehicles_vehicleService.js
// and are imported there — this store is pure state/persistence only.
export const useVehicleStore = create((set, get) => ({
  // ── State ──
  vehicles:        persist.get(STORAGE_KEYS.BV_VEHICLES, []),
  activeVehicleId: persist.get(STORAGE_KEYS.BV_ACTIVE_VEHICLE, null),
  isLoading:       false,

  // ── Computed helpers (non-persisted) ──
  getActiveVehicle: () => {
    const s = get()
    return s.vehicles.find(v => v.id === s.activeVehicleId) || null
  },
  getVehicleById: (id) => get().vehicles.find(v => v.id === id) || null,

  // ── Mutations ──
  addVehicle: (vehicle) => {
    const vehicles = [...get().vehicles, vehicle]
    persist.set(STORAGE_KEYS.BV_VEHICLES, vehicles)
    set({ vehicles })
    return vehicle
  },
  updateVehicle: (id, updates) => {
    const vehicles = get().vehicles.map(v =>
      v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
    )
    persist.set(STORAGE_KEYS.BV_VEHICLES, vehicles)
    set({ vehicles })
    return vehicles.find(v => v.id === id)
  },
  deleteVehicle: (id) => {
    const vehicles = get().vehicles.filter(v => v.id !== id)
    persist.set(STORAGE_KEYS.BV_VEHICLES, vehicles)
    // If deleting the active vehicle, clear active
    let { activeVehicleId } = get()
    if (activeVehicleId === id) {
      activeVehicleId = null
      persist.set(STORAGE_KEYS.BV_ACTIVE_VEHICLE, null)
    }
    set({ vehicles, activeVehicleId })
  },
  setActiveVehicle: (id) => {
    persist.set(STORAGE_KEYS.BV_ACTIVE_VEHICLE, id)
    set({ activeVehicleId: id })
  },
  clearActiveVehicle: () => {
    persist.remove(STORAGE_KEYS.BV_ACTIVE_VEHICLE)
    set({ activeVehicleId: null })
  },
  setLoading: (isLoading) => set({ isLoading }),
  // ── Replace all vehicles (for import/restore) ──
  setVehicles: (vehicles) => {
    persist.set(STORAGE_KEYS.BV_VEHICLES, vehicles)
    set({ vehicles })
  },
}))


// ─── Big V Route Store (Run 3 SSOT) ──────────────────────────
// Single source of truth for all saved route plans.
// Persisted to localStorage via bigv:routePlans / bigv:activeRouteId.
// DO NOT duplicate — all route reads/writes go through here.
export const useRouteStore = create((set, get) => ({
  // ── State ──
  routePlans:    persist.get(STORAGE_KEYS.BV_ROUTES, []),
  activeRouteId: persist.get(STORAGE_KEYS.BV_ACTIVE_ROUTE, null),
  isLoading:     false,

  // ── Computed ──
  getActiveRoute:   () => {
    const s = get()
    return s.routePlans.find(r => r.id === s.activeRouteId) || null
  },
  getRoutePlanById: (id) => get().routePlans.find(r => r.id === id) || null,

  // ── Mutations ──
  addRoutePlan: (plan) => {
    const routePlans = [plan, ...get().routePlans]
    persist.set(STORAGE_KEYS.BV_ROUTES, routePlans)
    set({ routePlans })
    return plan
  },
  updateRoutePlan: (id, updates) => {
    const routePlans = get().routePlans.map(r =>
      r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    )
    persist.set(STORAGE_KEYS.BV_ROUTES, routePlans)
    set({ routePlans })
    return routePlans.find(r => r.id === id)
  },
  deleteRoutePlan: (id) => {
    const routePlans = get().routePlans.filter(r => r.id !== id)
    persist.set(STORAGE_KEYS.BV_ROUTES, routePlans)
    let { activeRouteId } = get()
    if (activeRouteId === id) {
      activeRouteId = null
      persist.set(STORAGE_KEYS.BV_ACTIVE_ROUTE, null)
    }
    set({ routePlans, activeRouteId })
  },
  setActiveRoute: (id) => {
    persist.set(STORAGE_KEYS.BV_ACTIVE_ROUTE, id)
    set({ activeRouteId: id })
  },
  clearActiveRoute: () => {
    persist.remove(STORAGE_KEYS.BV_ACTIVE_ROUTE)
    set({ activeRouteId: null })
  },
  setLoading: (isLoading) => set({ isLoading }),
  setRoutePlans: (routePlans) => {
    persist.set(STORAGE_KEYS.BV_ROUTES, routePlans)
    set({ routePlans })
  },
}))

// ─── AI Store ─────────────────────────────────────────────────
export const useAIStore = create((set) => ({
  // ── State ──
  provider:       persist.get(STORAGE_KEYS.AI_PROVIDER, 'openai'),
  model:          persist.get(STORAGE_KEYS.AI_MODEL, null),
  config:         persist.get(STORAGE_KEYS.AI_CONFIG, {}),
  status:         'idle',   // 'idle' | 'loading' | 'streaming' | 'error'
  activeModule:   null,
  tokenUsage:     { prompt: 0, completion: 0, total: 0 },
  costEstimate:   0,
  fallbackActive: false,

  // ── Actions ──
  setProvider: (provider) => {
    persist.set(STORAGE_KEYS.AI_PROVIDER, provider)
    set({ provider })
  },
  setModel: (model) => {
    persist.set(STORAGE_KEYS.AI_MODEL, model)
    set({ model })
  },
  setConfig: (config) => {
    persist.set(STORAGE_KEYS.AI_CONFIG, config)
    set({ config })
  },
  setStatus: (status) => set({ status }),
  setActiveModule: (module) => set({ activeModule: module }),
  updateTokenUsage: (usage) => set(s => ({
    tokenUsage: {
      prompt:     s.tokenUsage.prompt + (usage.prompt || 0),
      completion: s.tokenUsage.completion + (usage.completion || 0),
      total:      s.tokenUsage.total + (usage.total || 0)
    }
  })),
  setCostEstimate: (cost) => set({ costEstimate: cost }),
  setFallbackActive: (val) => set({ fallbackActive: val })
}))

// ─── Driver Store ─────────────────────────────────────────────
export const useDriverStore = create((set) => ({
  // ── State ──
  drivers:        [],
  activeDriver:   persist.get(STORAGE_KEYS.DRIVER_SELECTED, null),
  driverSession:  persist.get(STORAGE_KEYS.DRIVER_SESSION, null),
  scores:         {},
  isLoading:      false,

  // ── Actions ──
  setDrivers: (drivers) => set({ drivers }),
  setActiveDriver: (driver) => {
    persist.set(STORAGE_KEYS.DRIVER_SELECTED, driver)
    set({ activeDriver: driver })
  },
  setDriverSession: (session) => {
    persist.set(STORAGE_KEYS.DRIVER_SESSION, session)
    set({ driverSession: session })
  },
  updateScore: (driverId, score) => set(s => ({
    scores: { ...s.scores, [driverId]: score }
  })),
  setLoading: (isLoading) => set({ isLoading })
}))

// ─── Navigation Store (merged into useNavStore in Run 5) ────────────────────

// ─── Realtime Store ───────────────────────────────────────────
export const useRealtimeStore = create((set) => ({
  connected:       false,
  channelStatuses: {},
  livePositions:   {},
  liveEvents:      [],

  setConnected: (connected) => set({ connected }),
  setChannelStatus: (channel, status) => set(s => ({
    channelStatuses: { ...s.channelStatuses, [channel]: status }
  })),
  updateLivePosition: (vehicleId, position) => set(s => ({
    livePositions: { ...s.livePositions, [vehicleId]: { ...position, ts: Date.now() } }
  })),
  addLiveEvent: (event) => set(s => ({
    liveEvents: [{ id: Date.now(), ...event }, ...s.liveEvents].slice(0, 100)
  })),
  clearLiveEvents: () => set({ liveEvents: [] })
}))

// ─── Root Storage API ─────────────────────────────────────────
// Unified access to persist helpers
export const Storage = persist

// ─── Store Selectors (convenience) ───────────────────────────
export const selectors = {
  app: {
    theme:           s => s.theme,
    sidebarExpanded: s => s.sidebarExpanded,
    systemStatus:    s => s.systemStatus,
    notifications:   s => s.notifications,
    alerts:          s => s.alerts,
  },
  auth: {
    user:            s => s.user,
    role:            s => s.role,
    isAuthenticated: s => s.isAuthenticated,
    isLoading:       s => s.isLoading,
  },
  fleet: {
    vehicles:        s => s.vehicles,
    activeVehicle:   s => s.activeVehicle,
    telemetry:       s => s.telemetry,
    isLoading:       s => s.isLoading,
  },
  vehicle: {
    vehicles:        s => s.vehicles,
    activeVehicleId: s => s.activeVehicleId,
    isLoading:       s => s.isLoading,
  },
  route: {
    routePlans:    s => s.routePlans,
    activeRouteId: s => s.activeRouteId,
    isLoading:     s => s.isLoading,
  },
  ai: {
    provider:        s => s.provider,
    model:           s => s.model,
    status:          s => s.status,
    fallbackActive:  s => s.fallbackActive,
    tokenUsage:      s => s.tokenUsage,
  }
}

export default {
  STORAGE_KEYS,
  Storage,
  useAppStore,
  useAuthStore,
  useFleetStore,
  useVehicleStore,
  useRouteStore,
  useMapStore,
  useAssignmentStore,
  useTripSessionStore,
  useDriverReportStore,
  useSyncQueueStore,
  useAuditStore,
  useSyncStatusStore,
  useAiAdvisoryStore,
  useBackendConfigStore,
  useDeploymentChecklistStore,
  useAIStore,
  useDriverStore,
  useNavStore,
  useRealtimeStore,
  selectors
}

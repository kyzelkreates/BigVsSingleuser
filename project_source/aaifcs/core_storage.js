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

// ─── Navigation Store ─────────────────────────────────────────
export const useNavStore = create((set) => ({
  // ── State ──
  route:          persist.get(STORAGE_KEYS.NAV_ROUTE, null),
  destination:    persist.get(STORAGE_KEYS.NAV_DESTINATION, null),
  mode:           persist.get(STORAGE_KEYS.NAV_MODE, 'drive'),
  isNavigating:   false,
  currentPosition: null,
  eta:            null,
  distanceLeft:   null,
  turnInstructions: [],

  // ── Actions ──
  setRoute: (route) => {
    persist.set(STORAGE_KEYS.NAV_ROUTE, route)
    set({ route })
  },
  setDestination: (dest) => {
    persist.set(STORAGE_KEYS.NAV_DESTINATION, dest)
    set({ destination: dest })
  },
  setMode: (mode) => {
    persist.set(STORAGE_KEYS.NAV_MODE, mode)
    set({ mode })
  },
  setNavigating: (val) => set({ isNavigating: val }),
  setCurrentPosition: (pos) => set({ currentPosition: pos }),
  setEta: (eta) => set({ eta }),
  setDistanceLeft: (dist) => set({ distanceLeft: dist }),
  setTurnInstructions: (instr) => set({ turnInstructions: instr }),
  clearNavigation: () => {
    persist.remove(STORAGE_KEYS.NAV_ROUTE)
    persist.remove(STORAGE_KEYS.NAV_DESTINATION)
    set({ route: null, destination: null, isNavigating: false, eta: null, distanceLeft: null, turnInstructions: [] })
  }
}))

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
  useAIStore,
  useDriverStore,
  useNavStore,
  useRealtimeStore,
  selectors
}

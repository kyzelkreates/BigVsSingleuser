/**
 * ============================================================
 * Big V's Best Routes™ — Driver PWA Safe Navigation Module
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 * Run 5 — Driver PWA GPS + Safe Navigation Workflow
 *
 * This module is the BV-native navigation tab inside the
 * Driver PWA. It reads from the Run 2/3 vehicle/route SSOT,
 * uses the Run 4 map layer, and manages a full navigation
 * session through the Run 5 useNavStore.
 *
 * ── Flow ──────────────────────────────────────────────────
 * 1. Home: shows active route + vehicle, navigation status
 * 2. Route Review Gate: map preview, warnings, disclaimer
 * 3. Safety Checklist: pre-nav checks
 * 4. Acknowledgement: driver confirms advisory-only
 * 5. Navigation: Start → GPS → In Progress → Pause/Resume/Complete
 *
 * ── Safety / Legal ────────────────────────────────────────
 * ADVISORY ONLY. This module provides GPS and route support.
 * The driver remains fully responsible for safe and legal
 * driving. Always follow live road signs, restrictions,
 * traffic laws, and safe driving judgement.
 * ============================================================
 */

import { useState, useEffect, useRef, useCallback, Suspense, lazy, memo } from 'react'
import Icon from './components_ui_Icon'
import { useVehicleStore, useRouteStore, useNavStore, useMapStore, useAssignmentStore, useTripSessionStore } from './core_storage'
import BvAssignmentInbox from './modules_driver_BvAssignmentInbox'
import BvAiAdvisory from './modules_driver_BvAiAdvisory'
import {
  startTripSession,
  updateTripStatus,
  updateAssignmentStatus,
  recordAuditEvent,
  runSyncNow,
} from './services_sync_bvSyncService'
import { getRoutePlanPoints, getRoutePlanPolyline, routeHasMapData } from './services_maps_routeGeometry'
import { calculateRouteReadiness, calculateRouteRiskLevel, getRouteWarnings, getRiskLevelStyle, getRouteReadinessLabel, RISK_LEVELS } from './services_routes_routeService'
import { calculateVehicleReadiness, getMissingCriticalFields } from './services_vehicles_vehicleService'

const RouteMap = lazy(() => import('./modules_navigation_RouteMap'))

// ─── Constants ────────────────────────────────────────────────
const NAV_STATUS_LABELS = {
  notStarted:              { label: 'Not Started',         color: 'text-slate-400',   icon: 'CircleDot'   },
  awaitingAcknowledgement: { label: 'Awaiting Review',     color: 'text-amber-400',   icon: 'FileText'    },
  ready:                   { label: 'Ready to Start',      color: 'text-emerald-400', icon: 'CheckCircle' },
  gpsStarting:             { label: 'GPS Starting…',       color: 'text-cyan-400',    icon: 'Loader'      },
  inProgress:              { label: 'In Progress',         color: 'text-emerald-400', icon: 'Navigation'  },
  paused:                  { label: 'Paused',              color: 'text-amber-400',   icon: 'PauseCircle' },
  completed:               { label: 'Route Completed',     color: 'text-violet-400',  icon: 'CheckCircle2'},
  needsReview:             { label: 'Needs Review',        color: 'text-red-400',     icon: 'AlertTriangle'},
  gpsUnavailable:          { label: 'GPS Unavailable',     color: 'text-amber-400',   icon: 'MapPinOff'   },
  error:                   { label: 'Error',               color: 'text-red-400',     icon: 'XCircle'     },
}

const GPS_STATE_LABELS = {
  idle:         { label: 'GPS Idle',        color: 'text-slate-500',   dot: 'bg-slate-600'   },
  requesting:   { label: 'GPS Finding…',    color: 'text-amber-400',   dot: 'bg-amber-400 animate-pulse' },
  active:       { label: 'GPS Active',      color: 'text-emerald-400', dot: 'bg-emerald-400 animate-pulse' },
  denied:       { label: 'GPS Denied',      color: 'text-red-400',     dot: 'bg-red-400'     },
  unavailable:  { label: 'GPS Unavailable', color: 'text-slate-500',   dot: 'bg-slate-600'   },
  lowAccuracy:  { label: 'GPS Low Accuracy',color: 'text-amber-400',   dot: 'bg-amber-400'   },
  error:        { label: 'GPS Error',       color: 'text-red-400',     dot: 'bg-red-500'     },
}

const CHECKLIST_ITEMS = [
  { key: 'correctVehicle',      label: 'Correct vehicle selected and confirmed' },
  { key: 'dimensionsReviewed',  label: 'Vehicle height, width, and length reviewed' },
  { key: 'weightReviewed',      label: 'Vehicle weight and load reviewed' },
  { key: 'routeReviewed',       label: 'Route reviewed on map' },
  { key: 'advisoryUnderstood',  label: 'Route is advisory only — I understand this' },
  { key: 'willFollowLiveSigns', label: 'I will follow live road signs and restrictions' },
  { key: 'deviceSafelyMounted', label: 'Device safely mounted or used only when parked' },
  { key: 'gpsBatteryChecked',   label: 'GPS, data connection, and battery checked' },
  { key: 'willStopIfUnsure',    label: 'I will stop and reassess if route seems unsafe' },
]

// ─── Warning builder ──────────────────────────────────────────
function buildWarnings(routePlan, vehicle, gpsState, isOnline) {
  const warnings = []

  if (!vehicle) {
    warnings.push({ id: 'no-vehicle',   severity: 'critical', text: 'No vehicle selected. Select a vehicle before using safe navigation.' })
  } else {
    const missing = getMissingCriticalFields(vehicle)
    if (missing.includes('height'))       warnings.push({ id: 'miss-height',  severity: 'high',    text: 'Missing vehicle height. Low bridge risk unknown.' })
    if (missing.includes('width'))        warnings.push({ id: 'miss-width',   severity: 'high',    text: 'Missing vehicle width. Narrow road suitability unknown.' })
    if (missing.includes('gvw'))          warnings.push({ id: 'miss-weight',  severity: 'high',    text: 'Missing vehicle weight/GVW. Weight restriction checks cannot be performed.' })
    if (missing.includes('length'))       warnings.push({ id: 'miss-length',  severity: 'caution', text: 'Missing vehicle length. Turning clearance may be uncertain.' })
  }

  if (!routePlan) {
    warnings.push({ id: 'no-route',  severity: 'critical', text: 'No active route selected. Return to dashboard and select a route.' })
  } else {
    const { hasCoords } = getRoutePlanPoints(routePlan)
    const poly = getRoutePlanPolyline(routePlan)
    if (!hasCoords)            warnings.push({ id: 'no-geo',      severity: 'high',    text: 'Route geometry unavailable. Navigation can run in route review mode only.' })
    if ((routePlan.readinessScore || 0) < 40)
                               warnings.push({ id: 'low-conf',   severity: 'caution', text: `Route readiness is ${routePlan.readinessScore ?? 0}%. Review route details before driving.` })
  }

  if (gpsState === 'denied')       warnings.push({ id: 'gps-denied', severity: 'high',    text: 'GPS permission denied. Navigation will run in route review mode only.' })
  if (gpsState === 'unavailable')  warnings.push({ id: 'gps-na',     severity: 'caution', text: 'GPS unavailable on this device/browser.' })
  if (gpsState === 'lowAccuracy')  warnings.push({ id: 'gps-acc',    severity: 'caution', text: 'GPS accuracy appears low. Check route manually and follow live road signs.' })

  if (!isOnline) warnings.push({ id: 'offline', severity: 'high', text: 'You are offline. Live map tiles, GPS data, and sync may be limited.' })

  return warnings
}

// ─── Warning severity badge ───────────────────────────────────
function WarnBadge({ w }) {
  const cfg = {
    critical: { bg: 'bg-red-950/60',    border: 'border-red-700/50',   icon: 'XCircle',       iconC: 'text-red-400'    },
    high:     { bg: 'bg-amber-950/40',  border: 'border-amber-700/40', icon: 'AlertTriangle',  iconC: 'text-amber-400'  },
    caution:  { bg: 'bg-slate-900/60',  border: 'border-slate-700/40', icon: 'Info',           iconC: 'text-slate-400'  },
    info:     { bg: 'bg-slate-900/40',  border: 'border-slate-800/60', icon: 'Info',           iconC: 'text-slate-500'  },
  }[w.severity] || { bg: 'bg-slate-900', border: 'border-slate-800', icon: 'Info', iconC: 'text-slate-500' }
  return (
    <div className={`flex items-start gap-2 p-2.5 rounded-lg border ${cfg.bg} ${cfg.border}`}>
      <Icon name={cfg.icon} size={12} className={`${cfg.iconC} flex-shrink-0 mt-0.5`} />
      <span className="text-2xs text-slate-400 leading-relaxed">{w.text}</span>
    </div>
  )
}

// ─── Safety disclaimer ────────────────────────────────────────
function SafetyDisclaimer({ compact = false }) {
  if (compact) return (
    <div className="px-3 py-2 bg-[#0a0700] border-t border-[#b8860b]/20 text-2xs text-slate-600 leading-relaxed">
      ⚠ Advisory only — not GPS turn-by-turn navigation. Follow live road signs at all times.
    </div>
  )
  return (
    <div className="space-y-2 p-3.5 bg-[#0a0700]/80 border border-[#b8860b]/20 rounded-xl">
      <p className="text-2xs text-slate-500 leading-relaxed">
        <span className="text-[#d4a017] font-semibold">Big V's Best Routes™</span> provides advisory GPS
        and route support only. Always follow road signs, road restrictions, traffic laws, live conditions,
        and safe driving judgement. The driver remains responsible for safe and legal driving.
      </p>
      <p className="text-2xs text-slate-600 leading-relaxed">
        If the route appears unsafe, legally uncertain, blocked, restricted, or unsuitable for your vehicle,
        stop safely and reassess before continuing.
      </p>
      <p className="text-2xs text-slate-600 leading-relaxed">
        Do not interact with this app while driving unless safely parked or using lawful hands-free interaction.
      </p>
    </div>
  )
}

// ─── Map loading fallback ─────────────────────────────────────
function MapFallback({ height = '200px' }) {
  return (
    <div className={`flex items-center justify-center bg-[#050810] border border-slate-800/60 rounded-xl`} style={{ height }}>
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-[#b8860b]/30 border-t-[#b8860b] rounded-full animate-spin" />
        <span className="text-2xs text-slate-600 font-mono">LOADING MAP</span>
      </div>
    </div>
  )
}

// ─── Vehicle summary strip ────────────────────────────────────
function VehicleSummary({ vehicle }) {
  if (!vehicle) return (
    <div className="p-3 bg-red-950/30 border border-red-700/30 rounded-xl">
      <p className="text-xs text-red-400 font-semibold">No vehicle selected</p>
      <p className="text-2xs text-red-400/60 mt-0.5">Return to dashboard → Fleet → select a vehicle</p>
    </div>
  )
  const readiness = calculateVehicleReadiness(vehicle)
  return (
    <div className="p-3 bg-[#0a0700] border border-[#b8860b]/20 rounded-xl space-y-2">
      <div className="flex items-center gap-2">
        <Icon name="Truck" size={13} className="text-[#b8860b]" />
        <span className="text-xs font-semibold text-[#d4a017] flex-1 truncate">{vehicle.name}</span>
        <span className="text-2xs font-mono text-slate-500">{readiness}% ready</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { label: 'Type',   val: vehicle.type           || '—' },
          { label: 'Reg',    val: vehicle.registration   || '—' },
          { label: 'Height', val: vehicle.height ? `${vehicle.height}m` : '⚠ Missing' },
          { label: 'Width',  val: vehicle.width  ? `${vehicle.width}m`  : '⚠ Missing' },
          { label: 'Length', val: vehicle.length ? `${vehicle.length}m` : '—' },
          { label: 'GVW',    val: vehicle.gvw    ? `${vehicle.gvw}t`    : '⚠ Missing' },
        ].map(({ label, val }) => (
          <div key={label} className="flex gap-1.5 items-baseline">
            <span className="text-2xs text-slate-600 w-12 flex-shrink-0">{label}:</span>
            <span className={`text-2xs font-mono ${val.startsWith('⚠') ? 'text-amber-400' : 'text-slate-300'}`}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Route summary strip ──────────────────────────────────────
function RouteSummary({ plan, vehicle }) {
  if (!plan) return (
    <div className="p-3 bg-red-950/30 border border-red-700/30 rounded-xl">
      <p className="text-xs text-red-400 font-semibold">No active route</p>
      <p className="text-2xs text-red-400/60 mt-0.5">Go to Route Planner → set a route active</p>
    </div>
  )
  const readiness  = plan.readinessScore ?? calculateRouteReadiness(plan, vehicle)
  const rl         = getRouteReadinessLabel(readiness)
  const risk       = plan.riskLevel || RISK_LEVELS.UNKNOWN
  const riskStyle  = getRiskLevelStyle(risk)
  const hasGeo     = routeHasMapData(plan)
  return (
    <div className="p-3 bg-slate-900/50 border border-slate-800/60 rounded-xl space-y-2">
      <div className="flex items-center gap-2">
        <Icon name="Route" size={13} className="text-cyan-400" />
        <span className="text-xs font-semibold text-cyan-300 flex-1 truncate">
          {plan.name || `${plan.origin?.label || '?'} → ${plan.destination?.label || '?'}`}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className={`text-2xs px-2 py-0.5 rounded border font-semibold ${rl.color} ${rl.border}`}>{readiness}% ready</span>
        <span className={`text-2xs font-semibold ${riskStyle.color}`}>{riskStyle.label} Risk</span>
        <span className={`text-2xs ${hasGeo ? 'text-emerald-400' : 'text-amber-400'}`}>
          {hasGeo ? '✓ Geometry available' : '⚠ No geometry'}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-0.5">
        <div className="flex gap-2 text-2xs">
          <span className="text-slate-600 w-16 flex-shrink-0">From:</span>
          <span className="text-slate-400 truncate">{plan.origin?.label || '—'}</span>
        </div>
        <div className="flex gap-2 text-2xs">
          <span className="text-slate-600 w-16 flex-shrink-0">To:</span>
          <span className="text-slate-400 truncate">{plan.destination?.label || '—'}</span>
        </div>
        <div className="flex gap-2 text-2xs">
          <span className="text-slate-600 w-16 flex-shrink-0">Intent:</span>
          <span className="text-slate-400">{plan.routeIntent?.replace(/_/g, ' ') || '—'}</span>
        </div>
      </div>
    </div>
  )
}

// ─── GPS hook (BV route nav — user-triggered only) ────────────
function useBvGPS({ active }) {
  const [gpsState,   setGpsState]   = useState('idle')
  const [position,   setPosition]   = useState(null)
  const [accuracy,   setAccuracy]   = useState(null)
  const watchIdRef = useRef(null)
  const { updatePosition } = useNavStore(s => ({ updatePosition: s.updatePosition }))

  const startGPS = useCallback(() => {
    if (!navigator.geolocation) { setGpsState('unavailable'); return }
    setGpsState('requesting')
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng, accuracy: acc } = coords
        const pos = { lat, lng, accuracy: Math.round(acc || 0), timestamp: Date.now() }
        setPosition(pos)
        setAccuracy(Math.round(acc || 0))
        setGpsState(acc > 100 ? 'lowAccuracy' : 'active')
        updatePosition(pos)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setGpsState('denied')
        else if (err.code === err.TIMEOUT)      setGpsState('error')
        else                                    setGpsState('unavailable')
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )
  }, [updatePosition])

  const stopGPS = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setGpsState('idle')
  }, [])

  const recenter = useCallback(() => position, [position])

  // Stop on unmount
  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
  }, [])

  return { gpsState, position, accuracy, startGPS, stopGPS, recenter }
}

// ─── Checklist screen ─────────────────────────────────────────
function ChecklistScreen({ session, onClose }) {
  const { setChecklistItem } = useNavStore(s => ({ setChecklistItem: s.setChecklistItem }))
  const cl = session?.checklist || {}
  const all = CHECKLIST_ITEMS.every(i => cl[i.key])

  return (
    <div className="flex flex-col h-full bg-[#07080d]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/60 flex-shrink-0">
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
          <Icon name="ChevronLeft" size={18} />
        </button>
        <div>
          <div className="text-sm font-bold text-white">Safety Checklist</div>
          <div className="text-2xs text-slate-500">Review before starting navigation</div>
        </div>
        <span className={`ml-auto text-2xs font-semibold px-2 py-0.5 rounded border ${all ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/8' : 'text-amber-400 border-amber-500/30 bg-amber-500/8'}`}>
          {CHECKLIST_ITEMS.filter(i => cl[i.key]).length}/{CHECKLIST_ITEMS.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {CHECKLIST_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => setChecklistItem(item.key, !cl[item.key])}
            className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
              cl[item.key]
                ? 'bg-emerald-500/8 border-emerald-500/25'
                : 'bg-slate-900/50 border-slate-800/60 hover:border-slate-700/60'
            }`}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
              cl[item.key] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
            }`}>
              {cl[item.key] && <Icon name="Check" size={11} className="text-white" />}
            </div>
            <span className={`text-sm leading-snug ${cl[item.key] ? 'text-emerald-300' : 'text-slate-400'}`}>
              {item.label}
            </span>
          </button>
        ))}

        <SafetyDisclaimer />
      </div>

      <div className="p-4 border-t border-slate-800/60 flex-shrink-0">
        <button
          onClick={onClose}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
            all
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-amber-600/80 hover:bg-amber-600 text-white'
          }`}
        >
          {all ? '✓ Checklist Complete — Return' : 'Return (Checklist Incomplete)'}
        </button>
      </div>
    </div>
  )
}

// ─── Route review screen ──────────────────────────────────────
function RouteReviewScreen({ routePlan, vehicle, session, gpsState, warnings, isOnline, isDemoMode, onBack, onAcknowledge }) {
  const [ticked, setTicked] = useState(session?.acknowledgementAccepted || false)
  const { patchSession }    = useNavStore(s => ({ patchSession: s.patchSession }))
  const cl = session?.checklist || {}
  const checklistComplete = CHECKLIST_ITEMS.every(i => cl[i.key])
  const criticals = warnings.filter(w => w.severity === 'critical')
  const canStart  = ticked && criticals.length === 0

  const handleAck = () => {
    patchSession({
      acknowledgementAccepted: true,
      acknowledgementAcceptedAt: new Date().toISOString(),
      status: 'ready',
    })
    onAcknowledge()
  }

  return (
    <div className="flex flex-col h-full bg-[#07080d]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/60 flex-shrink-0">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-300 transition-colors">
          <Icon name="ChevronLeft" size={18} />
        </button>
        <div>
          <div className="text-sm font-bold text-white">Route Review</div>
          <div className="text-2xs text-slate-500">Review before starting navigation</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Mode banners */}
        {isDemoMode && (
          <div className="p-3 bg-violet-500/10 border border-violet-500/25 rounded-xl text-xs text-violet-300">
            ⚠ Demo mode is active. This route and vehicle data may be sample data and must not be used for real driving.
          </div>
        )}
        {!isOnline && (
          <div className="p-3 bg-amber-950/40 border border-amber-700/30 rounded-xl text-xs text-amber-300">
            ⚠ You are offline. Previously loaded route data may remain visible, but live map, GPS accuracy, provider data, traffic, restrictions, and sync may be limited or unavailable.
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wider px-0.5">Warnings ({warnings.length})</div>
            {warnings.map(w => <WarnBadge key={w.id} w={w} />)}
          </div>
        )}

        {/* Vehicle */}
        <div>
          <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 px-0.5">Vehicle</div>
          <VehicleSummary vehicle={vehicle} />
        </div>

        {/* Route */}
        <div>
          <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 px-0.5">Route</div>
          <RouteSummary plan={routePlan} vehicle={vehicle} />
        </div>

        {/* Map preview */}
        <div>
          <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 px-0.5">Map Preview</div>
          <Suspense fallback={<MapFallback height="220px" />}>
            <RouteMap routePlan={routePlan} height="220px" showControls={true} showDisclaimer={false} demoMode={isDemoMode} />
          </Suspense>
        </div>

        {/* GPS status */}
        {(() => {
          const gs = GPS_STATE_LABELS[gpsState] || GPS_STATE_LABELS.idle
          return (
            <div className="flex items-center gap-2 p-2.5 bg-slate-900/50 border border-slate-800/60 rounded-xl">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${gs.dot}`} />
              <span className={`text-2xs font-semibold ${gs.color}`}>{gs.label}</span>
              {gpsState === 'denied' && (
                <span className="text-2xs text-slate-600 ml-1">— Allow location in browser settings to use GPS navigation.</span>
              )}
            </div>
          )
        })()}

        {/* Checklist status */}
        <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${checklistComplete ? 'bg-emerald-500/6 border-emerald-500/20' : 'bg-amber-500/6 border-amber-500/20'}`}>
          <Icon name={checklistComplete ? 'CheckCircle' : 'ClipboardList'} size={13} className={checklistComplete ? 'text-emerald-400' : 'text-amber-400'} />
          <span className={`text-2xs font-semibold ${checklistComplete ? 'text-emerald-400' : 'text-amber-400'}`}>
            {checklistComplete ? 'Safety checklist complete' : `Safety checklist incomplete (${CHECKLIST_ITEMS.filter(i => cl[i.key]).length}/${CHECKLIST_ITEMS.length})`}
          </span>
        </div>

        {/* Safety disclaimer */}
        <SafetyDisclaimer />

        {/* Acknowledgement */}
        <div className="space-y-3">
          <button
            onClick={() => setTicked(v => !v)}
            className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
              ticked ? 'bg-cyan-500/8 border-cyan-500/30' : 'bg-slate-900/60 border-slate-700/60 hover:border-slate-600/60'
            }`}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
              ticked ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'
            }`}>
              {ticked && <Icon name="Check" size={11} className="text-white" />}
            </div>
            <span className="text-sm text-slate-300 leading-snug">
              I understand this route is advisory only. I remain responsible for checking live road signs,
              restrictions, road conditions, and legal suitability before and during the journey.
            </span>
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-800/60 flex-shrink-0 space-y-2">
        {criticals.length > 0 && (
          <div className="p-2.5 bg-red-950/50 border border-red-700/40 rounded-lg text-2xs text-red-400 text-center">
            Resolve critical issues before proceeding.
          </div>
        )}
        <button
          disabled={!canStart}
          onClick={handleAck}
          className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
            canStart
              ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          {ticked ? '✓ Confirm & Ready to Navigate' : 'Tick acknowledgement to continue'}
        </button>
      </div>
    </div>
  )
}

// ─── Navigation controls bar ──────────────────────────────────
function NavControls({ status, onStart, onPause, onResume, onComplete, onRecenter, onReview, onExit, gpsState }) {
  const btnBase = 'flex items-center justify-center gap-2 rounded-xl font-bold text-sm py-3 transition-all'
  return (
    <div className="flex-shrink-0 bg-[#090a0e]/95 border-t border-slate-800/60 p-3 space-y-2 backdrop-blur-sm">
      {/* Primary action */}
      <div className="grid grid-cols-2 gap-2">
        {status === 'ready' || status === 'gpsUnavailable' ? (
          <button onClick={onStart}
            className={`${btnBase} col-span-2 ${status === 'gpsUnavailable' ? 'bg-amber-700 hover:bg-amber-600' : 'bg-emerald-700 hover:bg-emerald-600'} text-white`}>
            <Icon name="Play" size={16} />
            {status === 'gpsUnavailable' ? 'Start (Map Review Mode)' : 'Start Safe Navigation'}
          </button>
        ) : status === 'gpsStarting' ? (
          <div className={`${btnBase} col-span-2 bg-cyan-900/60 border border-cyan-500/30 text-cyan-400 cursor-wait`}>
            <Icon name="Loader" size={14} className="animate-spin" />
            Starting GPS…
          </div>
        ) : status === 'inProgress' ? (
          <>
            <button onClick={onPause}
              className={`${btnBase} bg-amber-700/80 hover:bg-amber-700 text-white`}>
              <Icon name="Pause" size={15} /> Pause
            </button>
            <button onClick={onComplete}
              className={`${btnBase} bg-violet-700 hover:bg-violet-600 text-white`}>
              <Icon name="CheckCircle" size={15} /> Complete
            </button>
          </>
        ) : status === 'paused' ? (
          <>
            <button onClick={onResume}
              className={`${btnBase} bg-emerald-700 hover:bg-emerald-600 text-white`}>
              <Icon name="Play" size={15} /> Resume
            </button>
            <button onClick={onComplete}
              className={`${btnBase} bg-violet-700/80 hover:bg-violet-700 text-white`}>
              <Icon name="CheckCircle" size={15} /> Complete
            </button>
          </>
        ) : status === 'completed' ? (
          <div className={`${btnBase} col-span-2 bg-violet-900/50 border border-violet-500/30 text-violet-300`}>
            <Icon name="CheckCircle2" size={16} /> Route Completed
          </div>
        ) : null}
      </div>

      {/* Secondary controls */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={onRecenter} title="Re-centre GPS"
          className={`${btnBase} bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 py-2.5`}>
          <Icon name="Crosshair" size={13} />
          <span className="text-2xs">GPS</span>
        </button>
        <button onClick={onReview}
          className={`${btnBase} bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-amber-400 hover:border-amber-500/30 py-2.5`}>
          <Icon name="FileText" size={13} />
          <span className="text-2xs">Review</span>
        </button>
        <button onClick={onExit}
          className={`${btnBase} bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-red-400 hover:border-red-500/30 py-2.5`}>
          <Icon name="X" size={13} />
          <span className="text-2xs">Exit</span>
        </button>
      </div>
    </div>
  )
}

// ─── Status bar ───────────────────────────────────────────────
function NavStatusBar({ session, gpsState, accuracy, isOnline, isDemoMode }) {
  const status  = session?.status || 'notStarted'
  const navInfo = NAV_STATUS_LABELS[status] || NAV_STATUS_LABELS.notStarted
  const gpsInfo = GPS_STATE_LABELS[gpsState] || GPS_STATE_LABELS.idle

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-[#060708] border-b border-slate-800/60 flex-shrink-0 flex-wrap">
      {/* Nav status */}
      <div className="flex items-center gap-1.5">
        <Icon name={navInfo.icon} size={11} className={`${navInfo.color} ${status === 'gpsStarting' ? 'animate-spin' : ''}`} />
        <span className={`text-2xs font-semibold ${navInfo.color}`}>{navInfo.label}</span>
      </div>

      <span className="text-slate-700">·</span>

      {/* GPS */}
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${gpsInfo.dot}`} />
        <span className={`text-2xs ${gpsInfo.color}`}>{gpsInfo.label}</span>
        {accuracy && gpsState === 'active' && (
          <span className="text-2xs text-slate-600 font-mono">±{accuracy}m</span>
        )}
      </div>

      {/* Demo / offline */}
      {isDemoMode && (
        <>
          <span className="text-slate-700">·</span>
          <span className="text-2xs text-violet-400 bg-violet-500/8 border border-violet-500/20 px-1.5 py-0.5 rounded">Demo</span>
        </>
      )}
      {!isOnline && (
        <>
          <span className="text-slate-700">·</span>
          <span className="text-2xs text-amber-400">Offline</span>
        </>
      )}

      {/* Session timer */}
      {session?.startedAt && status === 'inProgress' && (
        <SessionTimer startedAt={session.startedAt} />
      )}
    </div>
  )
}

function SessionTimer({ startedAt }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const base = new Date(startedAt).getTime()
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - base) / 1000)), 1000)
    return () => clearInterval(id)
  }, [startedAt])
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  const fmt = `${h ? h + 'h ' : ''}${m}m ${s}s`
  return (
    <>
      <span className="text-slate-700 ml-auto">·</span>
      <span className="text-2xs font-mono text-slate-500">{fmt}</span>
    </>
  )
}

// ─── Main nav screen (map + controls) ─────────────────────────
function NavigationScreen({ routePlan, vehicle, session, gpsState, gpsPos, accuracy, warnings, isOnline, isDemoMode, onPause, onResume, onComplete, onRecenter, onReview, onExit }) {
  const status = session?.status || 'notStarted'
  const highWarnings = warnings.filter(w => w.severity === 'high' || w.severity === 'critical')

  return (
    <div className="flex flex-col h-full">
      <NavStatusBar session={session} gpsState={gpsState} accuracy={accuracy} isOnline={isOnline} isDemoMode={isDemoMode} />

      {/* High-severity alert strip */}
      {highWarnings.length > 0 && (
        <div className="px-3 py-2 bg-amber-950/40 border-b border-amber-700/30 flex-shrink-0">
          <div className="text-2xs text-amber-400 flex items-center gap-1.5">
            <Icon name="AlertTriangle" size={11} className="flex-shrink-0" />
            <span className="truncate">{highWarnings[0].text}</span>
            {highWarnings.length > 1 && <span className="text-amber-500/60 flex-shrink-0">+{highWarnings.length - 1}</span>}
          </div>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 min-h-0">
        <Suspense fallback={<MapFallback height="100%" />}>
          <RouteMap
            routePlan={routePlan}
            height="100%"
            showControls={true}
            showDisclaimer={false}
            demoMode={isDemoMode}
            className="h-full"
          />
        </Suspense>
      </div>

      {/* Controls */}
      <NavControls
        status={status}
        onPause={onPause}
        onResume={onResume}
        onComplete={onComplete}
        onRecenter={onRecenter}
        onReview={onReview}
        onExit={onExit}
        gpsState={gpsState}
      />

      {/* Compact safety disclaimer */}
      <SafetyDisclaimer compact />
    </div>
  )
}

// ─── Home screen ──────────────────────────────────────────────
function HomeScreen({ routePlan, vehicle, session, gpsState, warnings, isOnline, isDemoMode, onStartReview, onOpenNav, onOpenChecklist, onOpenInbox, inboxCount = 0 }) {
  const status   = session?.status || 'notStarted'
  const navInfo  = NAV_STATUS_LABELS[status] || NAV_STATUS_LABELS.notStarted
  const criticals = warnings.filter(w => w.severity === 'critical')
  const highs     = warnings.filter(w => w.severity === 'high')
  const cl        = session?.checklist || {}
  const checklistCount = CHECKLIST_ITEMS.filter(i => cl[i.key]).length

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="space-y-0.5">
        <div className="text-base font-bold text-white">Big V's Driver PWA™</div>
        <div className="text-2xs text-slate-600">Powered by 4P3X Intelligent AI™ · Created by Kyzel Kreates™</div>
      </div>

      {/* Demo / offline banners */}
      {isDemoMode && (
        <div className="p-3 bg-violet-500/8 border border-violet-500/20 rounded-xl text-2xs text-violet-300">
          ⚠ Demo mode active. Sample data only — not for real driving.
        </div>
      )}
      {!isOnline && (
        <div className="p-2.5 bg-amber-950/40 border border-amber-700/30 rounded-xl text-2xs text-amber-400">
          ⚠ Offline — live map tiles, GPS data, and sync may be limited.
        </div>
      )}

      {/* Nav status card */}
      <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${
        status === 'inProgress' ? 'bg-emerald-500/8 border-emerald-500/25' :
        status === 'paused'     ? 'bg-amber-500/8 border-amber-500/25' :
        status === 'completed'  ? 'bg-violet-500/8 border-violet-500/25' :
        'bg-slate-900/60 border-slate-800/60'
      }`}>
        <Icon name={navInfo.icon} size={20} className={navInfo.color} />
        <div>
          <div className={`text-sm font-bold ${navInfo.color}`}>{navInfo.label}</div>
          <div className="text-2xs text-slate-500">Navigation status</div>
        </div>
        {session?.startedAt && (
          <div className="ml-auto text-2xs text-slate-600 font-mono">
            Started {new Date(session.startedAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* 4P3X AI Advisory */}
      <BvAiAdvisory gpsState={gpsState} isOnline={isOnline} />

      {/* Vehicle */}
      <div>
        <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Active Vehicle</div>
        <VehicleSummary vehicle={vehicle} />
      </div>

      {/* Route */}
      <div>
        <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Active Route</div>
        <RouteSummary plan={routePlan} vehicle={vehicle} />
      </div>

      {/* Warnings summary */}
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">
            Warnings {criticals.length > 0 && <span className="text-red-400">({criticals.length} critical)</span>}
            {criticals.length === 0 && highs.length > 0 && <span className="text-amber-400">({highs.length} high)</span>}
          </div>
          {warnings.slice(0, 3).map(w => <WarnBadge key={w.id} w={w} />)}
          {warnings.length > 3 && (
            <div className="text-2xs text-slate-600 text-center">+{warnings.length - 3} more — review route for full list</div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-2">
        {/* Open map / continue navigation */}
        {(status === 'inProgress' || status === 'paused' || status === 'ready' || status === 'gpsUnavailable') && (
          <button onClick={onOpenNav}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold transition-all">
            <Icon name="Navigation" size={16} />
            {status === 'inProgress' ? 'Continue Navigation' : status === 'paused' ? 'Return to Navigation' : 'Open Map & Navigate'}
          </button>
        )}

        {/* Start review / review */}
        {(status === 'notStarted' || status === 'awaitingAcknowledgement' || status === 'needsReview' || status === 'completed' || status === 'error') && (
          <button onClick={onStartReview}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#b8860b]/80 hover:bg-[#b8860b] text-white text-sm font-bold transition-all">
            <Icon name="FileText" size={16} />
            {status === 'notStarted' ? 'Review Route & Start' : status === 'completed' ? 'Review Completed Route' : 'Review Route'}
          </button>
        )}

        {/* Checklist */}
        <button onClick={onOpenChecklist}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all ${
            checklistCount === CHECKLIST_ITEMS.length
              ? 'border-emerald-500/30 bg-emerald-500/6 text-emerald-400'
              : 'border-slate-700/60 bg-slate-900/50 text-slate-400 hover:text-slate-200'
          }`}>
          <Icon name="ClipboardList" size={14} />
          Safety Checklist ({checklistCount}/{CHECKLIST_ITEMS.length})
        </button>
      </div>

      {/* Inbox button */}
      <button onClick={onOpenInbox}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#b8860b]/25 bg-[#b8860b]/8 text-[#d4a017] hover:bg-[#b8860b]/15 text-sm font-semibold transition-all">
        <Icon name="ClipboardList" size={14} />
        Assigned Routes Inbox
        {inboxCount > 0 && (
          <span className="ml-1 text-2xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded-full font-mono">
            {inboxCount}
          </span>
        )}
      </button>

      {/* Safety disclaimer */}
      <SafetyDisclaimer />
    </div>
  )
}

// ─── BvRouteNav — root component ─────────────────────────────
export default memo(function BvRouteNav() {
  // ── SSOT reads ───────────────────────────────────────────────
  const vehicles     = useVehicleStore(s => s.vehicles)
  const activeVehId  = useVehicleStore(s => s.activeVehicleId)
  const vehicle      = vehicles.find(v => v.id === activeVehId) || null

  const routePlans   = useRouteStore(s => s.routePlans)
  const activeRtId   = useRouteStore(s => s.activeRouteId)
  const routePlan    = routePlans.find(r => r.id === activeRtId) || null

  const { session, initSession, setStatus, patchSession } = useNavStore(s => ({
    session:      s.session,
    initSession:  s.initSession,
    setStatus:    s.setStatus,
    patchSession: s.patchSession,
  }))

  // ── Local UI state ───────────────────────────────────────────
  const [screen, setScreen]  = useState('home') // 'home'|'review'|'nav'|'checklist'|'inbox'
  const [isOnline, setOnline] = useState(navigator.onLine)

  // ── Run 6: assignment + trip session ─────────────────────────
  const assignments         = useAssignmentStore(s => s.assignments)
  const { createSession: createTrip, setSessionStatus, sessions: tripSessions } = useTripSessionStore(s => ({
    createSession:    s.createSession,
    setSessionStatus: s.setSessionStatus,
    sessions:         s.sessions,
  }))
  // Active assignment: first inProgress, else first assigned/received
  const activeAssignment = assignments.find(a => a.status === 'inProgress')
    || assignments.find(a => a.status === 'assigned' || a.status === 'received')
    || null
  // Active trip session
  const [activeTripId, setActiveTripId] = useState(
    tripSessions.find(s => s.status === 'active')?.id || null
  )
  const activeTripSession = tripSessions.find(s => s.id === activeTripId) || null

  // ── GPS ──────────────────────────────────────────────────────
  const { gpsState, position, accuracy, startGPS, stopGPS } = useBvGPS({ active: screen === 'nav' })

  // ── Demo mode detection ──────────────────────────────────────
  // Demo mode: no active route or no vehicle configured
  const isDemoMode = !routePlan || !vehicle

  // ── Warnings ─────────────────────────────────────────────────
  const warnings = buildWarnings(routePlan, vehicle, gpsState, isOnline)

  // ── Online detection ─────────────────────────────────────────
  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // ── Session initialisation ────────────────────────────────────
  // Init session when route/vehicle changes or session doesn't match
  useEffect(() => {
    const needsInit = !session
      || session.routeId   !== activeRtId
      || session.vehicleId !== activeVehId
    if (needsInit && (activeRtId || activeVehId)) {
      initSession(activeRtId, activeVehId, isDemoMode)
    }
  }, [activeRtId, activeVehId]) // eslint-disable-line

  // ── Stop GPS on unmount ───────────────────────────────────────
  useEffect(() => () => stopGPS(), [stopGPS])

  // ── Navigation state machine ──────────────────────────────────
  const handleStartNavigation = useCallback(() => {
    setStatus('gpsStarting')
    setScreen('nav')
    startGPS()
    // ── Run 6: start trip session ─────────────────────────────
    if (!activeTripSession) {
      const trip = startTripSession(activeAssignment, session || {})
      setActiveTripId(trip.id)
    } else if (activeTripSession.status !== 'active') {
      setSessionStatus(activeTripId, 'active')
      updateTripStatus(activeTripId, 'active', activeAssignment?.id)
    }
    recordAuditEvent('navigation_started', 'Navigation started', 'tripSession', activeTripId || 'new', {}, 'driverPwa')
    // Transition to inProgress once GPS is active (or unavailable)
  }, [setStatus, startGPS, activeAssignment, session, activeTripSession, activeTripId, setSessionStatus])

  useEffect(() => {
    if (!session) return
    if (session.status === 'gpsStarting') {
      if (gpsState === 'active' || gpsState === 'lowAccuracy') {
        setStatus('inProgress')
      } else if (gpsState === 'denied' || gpsState === 'unavailable' || gpsState === 'error') {
        setStatus('gpsUnavailable')
      }
    }
  }, [gpsState, session?.status]) // eslint-disable-line

  const handlePause    = useCallback(() => {
    setStatus('paused')
    if (activeTripId) updateTripStatus(activeTripId, 'paused', activeAssignment?.id)
  }, [setStatus, activeTripId, activeAssignment])
  const handleResume   = useCallback(() => {
    setStatus('inProgress')
    if (activeTripId) updateTripStatus(activeTripId, 'active', activeAssignment?.id)
  }, [setStatus, activeTripId, activeAssignment])
  const handleComplete = useCallback(() => {
    setStatus('completed')
    if (activeTripId) updateTripStatus(activeTripId, 'completed', activeAssignment?.id)
    stopGPS()
    setScreen('home')
  }, [setStatus, stopGPS, activeTripId, activeAssignment])
  const handleExit     = useCallback(() => { stopGPS(); setScreen('home') }, [stopGPS])
  const handleRecenter = useCallback(() => {}, []) // map hook handles this internally

  const handleStartReview = useCallback(() => {
    if (!session) initSession(activeRtId, activeVehId, isDemoMode)
    setStatus('awaitingAcknowledgement')
    setScreen('review')
  }, [session, initSession, activeRtId, activeVehId, isDemoMode, setStatus])

  const handleAcknowledge = useCallback(() => {
    setScreen('nav')
    handleStartNavigation()
  }, [handleStartNavigation])

  // ── Render ────────────────────────────────────────────────────
  if (screen === 'checklist') {
    return <ChecklistScreen session={session} onClose={() => setScreen('home')} />
  }

  if (screen === 'review') {
    return (
      <RouteReviewScreen
        routePlan={routePlan}
        vehicle={vehicle}
        session={session}
        gpsState={gpsState}
        warnings={warnings}
        isOnline={isOnline}
        isDemoMode={isDemoMode}
        onBack={() => setScreen('home')}
        onAcknowledge={handleAcknowledge}
      />
    )
  }

  if (screen === 'nav') {
    return (
      <NavigationScreen
        routePlan={routePlan}
        vehicle={vehicle}
        session={session}
        gpsState={gpsState}
        gpsPos={position}
        accuracy={accuracy}
        warnings={warnings}
        isOnline={isOnline}
        isDemoMode={isDemoMode}
        onPause={handlePause}
        onResume={handleResume}
        onComplete={handleComplete}
        onRecenter={handleRecenter}
        onReview={() => setScreen('review')}
        onExit={handleExit}
      />
    )
  }

  // ── Inbox screen ─────────────────────────────────────────────
  if (screen === 'inbox') {
    return (
      <BvAssignmentInbox
        navSession={session}
        gpsPosition={position}
        currentTripSessionId={activeTripId}
        onOpenRoute={(asgn) => {
          // Set the active route from assignment if it exists in routePlans
          if (asgn.routeId) {
            const { setActiveRouteId } = useRouteStore.getState()
            if (typeof setActiveRouteId === 'function') setActiveRouteId(asgn.routeId)
          }
          setScreen('review')
        }}
      />
    )
  }

  const inboxCount = assignments.filter(a => a.status === 'assigned').length

  // Home screen
  return (
    <div className="flex flex-col h-full bg-[#07080d]">
      <HomeScreen
        routePlan={routePlan}
        vehicle={vehicle}
        session={session}
        gpsState={gpsState}
        warnings={warnings}
        isOnline={isOnline}
        isDemoMode={isDemoMode}
        onStartReview={handleStartReview}
        onOpenNav={() => setScreen('nav')}
        onOpenChecklist={() => setScreen('checklist')}
        onOpenInbox={() => setScreen('inbox')}
        inboxCount={inboxCount}
      />
    </div>
  )
})

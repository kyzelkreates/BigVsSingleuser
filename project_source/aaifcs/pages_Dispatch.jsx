/**
 * ============================================================
 * Big V's Best Routes™ — Route Planner  (Run 3)
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 *
 * Route: /dispatch  (internal path kept for router compat)
 * Label: Route Planner
 *
 * ADVISORY: Route plans are planning records only in Run 3.
 * Map rendering, road restriction checks, and live polyline
 * validation are added in later runs. The driver/operator
 * remains responsible for checking live road signs, legal
 * restrictions, vehicle suitability, and route safety.
 * ============================================================
 */

import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './components_ui_Icon'
import { useVehicleStore, useRouteStore } from './core_storage'
import { getVehicleTemplate, calculateVehicleReadiness, getMissingCriticalFields, getReadinessLabel } from './services_vehicles_vehicleService'
import {
  ROUTE_INTENT_OPTIONS,
  RISK_LEVELS,
  ROUTE_STATUSES,
  createRouteId,
  createVehicleSnapshot,
  buildRouteDefaults,
  getDefaultPrefsForVehicle,
  calculateRouteReadiness,
  calculateRouteRiskLevel,
  getRouteWarnings,
  getRouteReadinessLabel,
  getRiskLevelStyle,
  validateRoutePlanInput,
} from './services_routes_routeService'
import { ROUTES } from './config_routes'
import { lazy, Suspense } from 'react'

const RouteMap = lazy(() => import('./modules_navigation_RouteMap'))

// ─── Small shared components ──────────────────────────────────

function RouteReadinessBadge({ score }) {
  const { label, color, bg, border } = getRouteReadinessLabel(score)
  return (
    <span className={`inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded-full border ${color} ${bg} ${border}`}>
      <span className="font-mono">{score}%</span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  )
}

function RiskBadge({ level }) {
  const { label, color, bg, border } = getRiskLevelStyle(level)
  return (
    <span className={`inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded-full border ${color} ${bg} ${border}`}>
      <Icon name="AlertTriangle" size={9} />
      {label} Risk
    </span>
  )
}

function SectionHead({ icon, title, sub, isLegal = false }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800/60">
      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${isLegal ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-800/60 border border-slate-700/40'}`}>
        <Icon name={icon} size={12} className={isLegal ? 'text-amber-400' : 'text-slate-400'} />
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-300">{title}</div>
        {sub && <div className="text-2xs text-slate-600">{sub}</div>}
      </div>
    </div>
  )
}

// ─── Warning list ─────────────────────────────────────────────
function WarningList({ warnings, compact = false }) {
  if (!warnings || warnings.length === 0) return null
  const shown = compact ? warnings.filter(w => w.level !== 'info') : warnings
  if (shown.length === 0) return null

  const levelColor = (l) => l === 'critical' ? 'text-red-400' : l === 'high' ? 'text-red-300' : l === 'medium' ? 'text-amber-400' : 'text-slate-500'
  const levelIcon  = (l) => l === 'critical' ? 'XCircle' : l === 'high' ? 'AlertTriangle' : l === 'medium' ? 'AlertCircle' : 'Info'

  return (
    <div className={`space-y-1 ${compact ? '' : 'p-3 bg-slate-950 border border-slate-800/60 rounded-xl'}`}>
      {shown.map(w => (
        <div key={w.key} className="flex items-start gap-1.5">
          <Icon name={levelIcon(w.level)} size={11} className={`flex-shrink-0 mt-0.5 ${levelColor(w.level)}`} />
          <p className={`text-2xs leading-relaxed ${levelColor(w.level)}`}>{w.text}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Preference toggle ────────────────────────────────────────
function PrefToggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-slate-400">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-all flex-shrink-0 ${value ? 'bg-[#b8860b]/80' : 'bg-slate-700'}`}
      >
        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: value ? '19px' : '2px' }} />
      </button>
    </div>
  )
}

// ─── Active vehicle panel ─────────────────────────────────────
function ActiveVehiclePanel({ vehicle, onGoToVehicles }) {
  if (!vehicle) {
    return (
      <div className="p-4 bg-red-950/20 border border-red-500/25 rounded-xl">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <Icon name="AlertTriangle" size={15} className="text-red-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-red-300">No Active Vehicle</div>
            <div className="text-2xs text-red-400/70">Select an active vehicle before planning a vehicle-aware route.</div>
          </div>
        </div>
        <button onClick={onGoToVehicles}
          className="mt-1 flex items-center gap-1.5 text-xs text-[#d4a017] hover:text-[#b8860b] font-semibold transition-colors">
          <Icon name="ArrowRight" size={12} />
          Go to Saved Vehicles →
        </button>
      </div>
    )
  }

  const score   = calculateVehicleReadiness(vehicle)
  const ready   = getReadinessLabel(score)
  const tmpl    = getVehicleTemplate(vehicle.type)
  const missing = getMissingCriticalFields(vehicle)

  return (
    <div className="p-4 bg-[#b8860b]/5 border border-[#b8860b]/25 rounded-xl">
      <SectionHead icon="Car" title="Active Vehicle" sub="Route plan will use this vehicle's profile" />
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#b8860b]/10 border border-[#b8860b]/25 flex items-center justify-center flex-shrink-0">
          <Icon name={tmpl.icon} size={16} className="text-[#d4a017]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{vehicle.name}</span>
            <span className={`text-2xs font-semibold px-1.5 py-0.5 rounded border ${ready.color} ${ready.bg} ${ready.border}`}>{score}%</span>
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">{tmpl.label}{vehicle.registration ? ` · ${vehicle.registration}` : ''}</div>
          {(vehicle.heightM || vehicle.widthM || vehicle.weightKg) && (
            <div className="flex flex-wrap gap-2 mt-1">
              {vehicle.heightM && <span className="text-2xs text-slate-600 font-mono">H: {vehicle.heightM}m</span>}
              {vehicle.widthM  && <span className="text-2xs text-slate-600 font-mono">W: {vehicle.widthM}m</span>}
              {vehicle.weightKg && <span className="text-2xs text-slate-600 font-mono">{Number(vehicle.weightKg).toLocaleString()}kg</span>}
            </div>
          )}
          {missing.length > 0 && (
            <div className="mt-1 flex items-center gap-1">
              <Icon name="AlertTriangle" size={10} className="text-red-400" />
              <span className="text-2xs text-red-400">{missing.length} legal-critical field{missing.length !== 1 ? 's' : ''} missing on vehicle</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Planning summary panel ───────────────────────────────────
function PlanningPanel({ plan, vehicle }) {
  const readiness = calculateRouteReadiness(plan, vehicle)
  const risk      = calculateRouteRiskLevel(plan, vehicle)
  const warnings  = getRouteWarnings(plan, vehicle)
  const rLabel    = getRouteReadinessLabel(readiness)
  const rStyle    = getRiskLevelStyle(risk)
  const snap      = vehicle ? createVehicleSnapshot(vehicle) : null

  return (
    <div className="space-y-3">
      {/* Scores row */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`p-3 rounded-xl border ${rLabel.bg} ${rLabel.border}`}>
          <div className="text-2xs text-slate-500 mb-0.5">Route Readiness</div>
          <div className={`text-lg font-bold font-mono ${rLabel.color}`}>{readiness}%</div>
          <div className={`text-2xs font-semibold ${rLabel.color}`}>{rLabel.label}</div>
        </div>
        <div className={`p-3 rounded-xl border ${rStyle.bg} ${rStyle.border}`}>
          <div className="text-2xs text-slate-500 mb-0.5">Planning Risk</div>
          <div className={`text-lg font-bold font-mono ${rStyle.color}`}>{rStyle.label}</div>
          <div className="text-2xs text-slate-600">Preliminary only</div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.filter(w => w.level !== 'info').length > 0 && (
        <div>
          <div className="text-2xs text-slate-600 mb-1.5 font-semibold uppercase tracking-wider">Warnings</div>
          <WarningList warnings={warnings} compact />
        </div>
      )}

      {/* Vehicle snapshot summary */}
      {snap && (
        <div className="p-3 bg-slate-900/50 border border-slate-800/60 rounded-xl">
          <div className="text-2xs text-slate-600 mb-1.5 font-semibold uppercase tracking-wider">Vehicle Snapshot</div>
          <div className="text-2xs text-slate-500 mb-1">Route plans store a snapshot of the active vehicle profile used at the time of planning.</div>
          <div className="flex flex-wrap gap-2">
            <span className="text-2xs text-slate-400 font-semibold">{snap.name}</span>
            {snap.heightM && <span className="text-2xs text-slate-600 font-mono">H: {snap.heightM}m</span>}
            {snap.widthM  && <span className="text-2xs text-slate-600 font-mono">W: {snap.widthM}m</span>}
            {snap.weightKg && <span className="text-2xs text-slate-600 font-mono">{Number(snap.weightKg).toLocaleString()}kg</span>}
            {snap.hasTrailer && <span className="text-2xs text-amber-500/70 font-mono">+ Trailer</span>}
          </div>
        </div>
      )}

      {/* Always-on advisory */}
      <div className="p-2.5 bg-[#0a0700] border border-[#b8860b]/15 rounded-xl">
        <p className="text-2xs text-slate-600 leading-relaxed">
          ⚠ Preliminary planning risk only. Live road data and map checks are added in later runs.
          Always verify live road signs, restrictions, and vehicle suitability before travel.
        </p>
      </div>
    </div>
  )
}

// ─── Route Add / Edit Form ────────────────────────────────────
function RoutePlanForm({ initial, activeVehicle, onSave, onCancel }) {
  const isEdit    = !!initial?.id
  const [form, setForm]     = useState(() => initial || buildRouteDefaults(activeVehicle))
  const [errors, setErrors] = useState({})
  const [tab, setTab]       = useState('details')   // 'details' | 'prefs' | 'summary'

  const liveReadiness = calculateRouteReadiness(form, activeVehicle)
  const liveWarnings  = getRouteWarnings(form, activeVehicle)

  const setField = (field, value) => {
    setForm(p => ({ ...p, [field]: value }))
    setErrors(p => ({ ...p, [field]: undefined }))
  }
  const setOrigin = (field, value) => {
    setForm(p => ({ ...p, origin: { ...p.origin, [field]: value } }))
    setErrors(p => ({ ...p, origin: undefined }))
  }
  const setDest = (field, value) => {
    setForm(p => ({ ...p, destination: { ...p.destination, [field]: value } }))
    setErrors(p => ({ ...p, destination: undefined }))
  }
  const setPref = (key, value) => {
    setForm(p => ({ ...p, preferences: { ...p.preferences, [key]: value } }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { valid, errors: errs } = validateRoutePlanInput(form, activeVehicle)
    if (!valid) { setErrors(errs); setTab('details'); return }
    const now = new Date().toISOString()
    const saved = {
      ...form,
      vehicleId:       activeVehicle?.id || null,
      vehicleSnapshot: createVehicleSnapshot(activeVehicle),
      readinessScore:  calculateRouteReadiness(form, activeVehicle),
      riskLevel:       calculateRouteRiskLevel(form, activeVehicle),
      warnings:        getRouteWarnings(form, activeVehicle),
      status:          ROUTE_STATUSES.DRAFT,
      updatedAt:       now,
      createdAt:       form.createdAt || now,
    }
    onSave(saved)
  }

  const TABS = [
    { id: 'details',  label: 'Route Details', icon: 'Route' },
    { id: 'prefs',    label: 'Preferences',   icon: 'Sliders' },
    { id: 'summary',  label: 'Summary',        icon: 'BarChart2' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#09090a] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <div>
            <h2 className="text-sm font-bold text-white">{isEdit ? 'Edit Route Plan' : 'Create Route Plan'}</h2>
            <p className="text-2xs text-slate-600 mt-0.5">Big V's Best Routes™ · Planning Record</p>
          </div>
          <div className="flex items-center gap-2">
            <RouteReadinessBadge score={liveReadiness} />
            <button onClick={onCancel}
              className="w-7 h-7 rounded-lg border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
              <Icon name="X" size={13} />
            </button>
          </div>
        </div>

        {/* Vehicle check */}
        {!activeVehicle && (
          <div className="mx-5 mt-4 p-3 bg-red-950/20 border border-red-500/25 rounded-xl">
            <p className="text-xs text-red-400 font-semibold">⚠ No active vehicle selected. Route plan readiness will be 0%.</p>
            <p className="text-2xs text-red-400/70 mt-0.5">Go to Saved Vehicles and set an active vehicle for vehicle-aware planning.</p>
          </div>
        )}

        {/* Vehicle warning from form errors */}
        {errors._vehicle && (
          <div className="mx-5 mt-4 p-3 bg-red-950/20 border border-red-500/25 rounded-xl">
            <p className="text-2xs text-red-400">{errors._vehicle}</p>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex border-b border-slate-800/60 px-5 mt-1">
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-xs py-2.5 px-3 border-b-2 transition-all ${
                tab === t.id ? 'border-[#b8860b] text-[#d4a017]' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}>
              <Icon name={t.icon} size={11} />
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5">

          {/* ── DETAILS TAB ── */}
          {tab === 'details' && (
            <div className="space-y-4">
              {/* Route name */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Route Name <span className="text-slate-600">(optional)</span></label>
                <input type="text" value={form.name || ''} onChange={e => setField('name', e.target.value)}
                  placeholder="e.g. Morning delivery run, Weekend trip…"
                  className="apex-input w-full text-sm py-2" />
              </div>

              {/* Origin */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Origin <span className="text-red-400">*</span>
                </label>
                <input type="text" value={form.origin?.label || ''} onChange={e => setOrigin('label', e.target.value)}
                  placeholder="Starting point — town, postcode, or address…"
                  className={`apex-input w-full text-sm py-2 ${errors.origin ? 'border-red-500/50' : ''}`} />
                {errors.origin && <p className="text-2xs text-red-400 mt-0.5">{errors.origin}</p>}
              </div>

              {/* Destination */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Destination <span className="text-red-400">*</span>
                </label>
                <input type="text" value={form.destination?.label || ''} onChange={e => setDest('label', e.target.value)}
                  placeholder="End point — town, postcode, or address…"
                  className={`apex-input w-full text-sm py-2 ${errors.destination ? 'border-red-500/50' : ''}`} />
                {errors.destination && <p className="text-2xs text-red-400 mt-0.5">{errors.destination}</p>}
              </div>

              {/* Route intent */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Route Intent <span className="text-red-400">*</span></label>
                <select value={form.routeIntent || ''} onChange={e => setField('routeIntent', e.target.value)}
                  className={`apex-input w-full text-sm py-2 ${errors.routeIntent ? 'border-red-500/50' : ''}`}>
                  <option value="">Select route intent…</option>
                  {ROUTE_INTENT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {form.routeIntent && (
                  <p className="text-2xs text-slate-600 mt-0.5">
                    {ROUTE_INTENT_OPTIONS.find(o => o.value === form.routeIntent)?.desc}
                  </p>
                )}
                {errors.routeIntent && <p className="text-2xs text-red-400 mt-0.5">{errors.routeIntent}</p>}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Notes <span className="text-slate-600">(optional)</span></label>
                <textarea rows={2} value={form.notes || ''} onChange={e => setField('notes', e.target.value)}
                  placeholder="Any additional planning notes…"
                  className="apex-input w-full text-sm py-2 resize-none" />
              </div>

              {/* Live warnings */}
              {liveWarnings.filter(w => ['critical', 'high'].includes(w.level)).length > 0 && (
                <WarningList warnings={liveWarnings.filter(w => ['critical', 'high'].includes(w.level))} />
              )}
            </div>
          )}

          {/* ── PREFS TAB ── */}
          {tab === 'prefs' && (
            <div className="space-y-2">
              <p className="text-2xs text-slate-600 mb-3">
                Route preferences are used by the Route Planner (Run 4+) to select a suitable route.
                Defaults are based on your active vehicle type.
              </p>
              <PrefToggle label="Avoid Low Bridges"             value={form.preferences.avoidLowBridges}             onChange={v => setPref('avoidLowBridges', v)} />
              <PrefToggle label="Avoid Narrow Roads"            value={form.preferences.avoidNarrowRoads}            onChange={v => setPref('avoidNarrowRoads', v)} />
              <PrefToggle label="Avoid Weight-Restricted Roads" value={form.preferences.avoidWeightRestrictedRoads}  onChange={v => setPref('avoidWeightRestrictedRoads', v)} />
              <PrefToggle label="Avoid Steep Roads"             value={form.preferences.avoidSteepRoads}             onChange={v => setPref('avoidSteepRoads', v)} />
              <PrefToggle label="Avoid Tight Turns"             value={form.preferences.avoidTightTurns}             onChange={v => setPref('avoidTightTurns', v)} />
              <PrefToggle label="Prefer Main Roads"             value={form.preferences.preferMainRoads}             onChange={v => setPref('preferMainRoads', v)} />
              <PrefToggle label="Avoid Unpaved Roads"           value={form.preferences.avoidUnpavedRoads}           onChange={v => setPref('avoidUnpavedRoads', v)} />
              <PrefToggle label="Avoid City Centres"            value={form.preferences.avoidCityCentres}            onChange={v => setPref('avoidCityCentres', v)} />
              <PrefToggle label="Use Vehicle Dimensions"        value={form.preferences.useVehicleDimensions}        onChange={v => setPref('useVehicleDimensions', v)} />
              <PrefToggle label="Require Driver Acknowledgement" value={form.preferences.requireDriverAcknowledgement} onChange={v => setPref('requireDriverAcknowledgement', v)} />
              <div className="mt-3 p-2.5 bg-slate-950 border border-slate-800/60 rounded-xl">
                <p className="text-2xs text-slate-600">These preferences will be used when map routing is connected in Run 4.</p>
              </div>
            </div>
          )}

          {/* ── SUMMARY TAB ── */}
          {tab === 'summary' && (
            <PlanningPanel plan={form} vehicle={activeVehicle} />
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-5 pt-4 border-t border-slate-800/40">
            <button type="button" onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900/60 transition-all">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-[#b8860b] hover:bg-[#d4a017] text-black font-bold transition-all flex items-center justify-center gap-1.5">
              <Icon name={isEdit ? 'Save' : 'Plus'} size={14} />
              {isEdit ? 'Save Changes' : 'Create Route Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete confirm ───────────────────────────────────────────
function DeleteConfirm({ plan, isActive, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0a0b] border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <Icon name="Trash2" size={16} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Remove Route Plan?</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="text-white font-medium">{plan.name || 'This route plan'}</span> will be permanently removed.
            </p>
          </div>
        </div>
        {isActive && (
          <div className="mb-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-400">⚠ This is your active route. Removing it will clear the active route selection.</p>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900 transition-all">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 text-sm rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-semibold transition-all">Remove</button>
        </div>
      </div>
    </div>
  )
}

// ─── Route history card ───────────────────────────────────────
function RouteCard({ plan, isActive, onSetActive, onEdit, onDelete }) {
  const readiness = plan.readinessScore ?? 0
  const rLabel    = getRouteReadinessLabel(readiness)
  const rStyle    = getRiskLevelStyle(plan.riskLevel || RISK_LEVELS.UNKNOWN)
  const dateStr   = plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className={`relative bg-slate-950 border rounded-xl p-4 transition-all ${
      isActive ? 'border-[#b8860b]/50 shadow-[0_0_18px_rgba(184,134,11,0.07)]' : 'border-slate-800/60 hover:border-slate-700/50'
    }`}>
      {isActive && (
        <div className="absolute -top-2.5 left-4 flex items-center gap-1 bg-[#b8860b] text-black text-2xs font-bold px-2 py-0.5 rounded-full">
          <Icon name="Navigation" size={9} />
          ACTIVE ROUTE
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isActive ? 'bg-[#b8860b]/15 border border-[#b8860b]/30' : 'bg-slate-900 border border-slate-800'}`}>
          <Icon name="Route" size={15} className={isActive ? 'text-[#d4a017]' : 'text-slate-500'} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white truncate">
              {plan.name || `${plan.origin?.label || '?'} → ${plan.destination?.label || '?'}`}
            </span>
            <RouteReadinessBadge score={readiness} />
            <RiskBadge level={plan.riskLevel || RISK_LEVELS.UNKNOWN} />
          </div>

          {/* Origin → Destination */}
          <div className="flex items-center gap-1 mt-0.5 text-2xs text-slate-500">
            <Icon name="MapPin" size={10} className="text-slate-600 flex-shrink-0" />
            <span className="truncate">{plan.origin?.label || '—'}</span>
            <Icon name="ArrowRight" size={10} className="text-slate-700 flex-shrink-0" />
            <span className="truncate">{plan.destination?.label || '—'}</span>
          </div>

          {/* Vehicle + date */}
          <div className="flex flex-wrap gap-2 mt-1 items-center">
            {plan.vehicleSnapshot?.name && (
              <span className="text-2xs text-slate-600">
                <Icon name="Truck" size={9} className="inline mr-0.5" />
                {plan.vehicleSnapshot.name}
              </span>
            )}
            <span className="text-2xs text-slate-700">{dateStr}</span>
            {plan.demoOnly && (
              <span className="text-2xs text-violet-400 bg-violet-500/8 border border-violet-500/15 px-1.5 py-0 rounded">Demo</span>
            )}
          </div>

          {/* Warnings (critical only, collapsed) */}
          {plan.warnings?.filter(w => ['critical', 'high'].includes(w.level)).length > 0 && (
            <div className="mt-1.5 flex items-center gap-1">
              <Icon name="AlertTriangle" size={10} className="text-amber-400" />
              <span className="text-2xs text-amber-400">
                {plan.warnings.filter(w => ['critical', 'high'].includes(w.level)).length} warning{plan.warnings.filter(w => ['critical', 'high'].includes(w.level)).length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
          {!isActive ? (
            <button onClick={() => onSetActive(plan.id)}
              className="text-2xs px-2 py-1 rounded-lg border border-[#b8860b]/30 text-[#b8860b]/80 bg-[#b8860b]/5 hover:bg-[#b8860b]/15 hover:text-[#d4a017] transition-all font-medium">
              Set Active
            </button>
          ) : (
            <button onClick={() => onSetActive(null)}
              className="text-2xs px-2 py-1 rounded-lg border border-slate-700/50 text-slate-500 bg-slate-900/60 hover:bg-slate-800 transition-all">
              Deactivate
            </button>
          )}
          <button onClick={() => onEdit(plan)}
            className="w-7 h-7 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 flex items-center justify-center transition-all">
            <Icon name="Pencil" size={12} className="text-slate-400" />
          </button>
          <button onClick={() => onDelete(plan)}
            className="w-7 h-7 rounded-lg border border-red-900/30 bg-red-950/20 hover:bg-red-900/30 hover:border-red-700/40 flex items-center justify-center transition-all">
            <Icon name="Trash2" size={12} className="text-red-500/70" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────
function EmptyRoutes({ hasVehicle, onAdd, onGoToVehicles }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-cyan-500/8 border border-cyan-500/15 flex items-center justify-center mb-4">
        <Icon name="Route" size={28} className="text-cyan-400/50" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">No route plans yet</h3>
      <p className="text-xs text-slate-500 max-w-xs mb-6 leading-relaxed">
        {hasVehicle
          ? 'Create your first vehicle-aware route plan using your active vehicle profile.'
          : 'Select an active vehicle first, then create vehicle-aware route plans.'}
      </p>
      {hasVehicle
        ? <button onClick={onAdd} className="btn-primary text-sm px-5 py-2">Create First Route Plan</button>
        : <button onClick={onGoToVehicles} className="btn-primary text-sm px-5 py-2 flex items-center gap-1.5"><Icon name="Truck" size={14} /> Go to Saved Vehicles</button>
      }
    </div>
  )
}

// ─── Active route banner ──────────────────────────────────────
function ActiveRouteBanner({ activeRoute }) {
  if (!activeRoute) {
    return (
      <div className="flex items-center gap-3 p-3 bg-slate-900/40 border border-slate-800/50 rounded-xl">
        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
          <Icon name="Navigation" size={14} className="text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400">No active route selected.</p>
          <p className="text-2xs text-slate-600">Create or select a route plan before Driver PWA navigation.</p>
        </div>
      </div>
    )
  }
  const rLabel = getRouteReadinessLabel(activeRoute.readinessScore ?? 0)
  return (
    <div className="flex items-center gap-3 p-3 bg-[#b8860b]/5 border border-[#b8860b]/30 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-[#b8860b]/10 border border-[#b8860b]/25 flex items-center justify-center flex-shrink-0">
        <Icon name="Navigation" size={14} className="text-[#d4a017]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#d4a017]">Active Route:</span>
          <span className="text-xs text-white truncate">{activeRoute.name || `${activeRoute.origin?.label} → ${activeRoute.destination?.label}`}</span>
          <RouteReadinessBadge score={activeRoute.readinessScore ?? 0} />
        </div>
        <p className="text-2xs text-slate-500 mt-0.5 truncate">
          {activeRoute.origin?.label} → {activeRoute.destination?.label}
        </p>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────
export default function RoutePlanner() {
  const navigate = useNavigate()

  // Vehicle SSOT
  const bvVehicles       = useVehicleStore(s => s.vehicles)
  const bvActiveId       = useVehicleStore(s => s.activeVehicleId)
  const activeVehicle    = useMemo(() => bvVehicles.find(v => v.id === bvActiveId) || null, [bvVehicles, bvActiveId])

  // Route SSOT
  const { routePlans, activeRouteId, addRoutePlan, updateRoutePlan, deleteRoutePlan, setActiveRoute } = useRouteStore(s => ({
    routePlans:     s.routePlans,
    activeRouteId:  s.activeRouteId,
    addRoutePlan:   s.addRoutePlan,
    updateRoutePlan: s.updateRoutePlan,
    deleteRoutePlan: s.deleteRoutePlan,
    setActiveRoute:  s.setActiveRoute,
  }))

  const activeRoute = useMemo(() => routePlans.find(r => r.id === activeRouteId) || null, [routePlans, activeRouteId])

  const [showForm,      setShowForm]      = useState(false)
  const [editTarget,    setEditTarget]    = useState(null)
  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [search,        setSearch]        = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return routePlans
    return routePlans.filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.origin?.label?.toLowerCase().includes(q) ||
      r.destination?.label?.toLowerCase().includes(q) ||
      r.vehicleSnapshot?.name?.toLowerCase().includes(q)
    )
  }, [routePlans, search])

  const handleSave = useCallback((plan) => {
    if (editTarget) {
      updateRoutePlan(plan.id, plan)
    } else {
      addRoutePlan({ ...plan, id: createRouteId() })
    }
    setShowForm(false)
    setEditTarget(null)
  }, [editTarget, addRoutePlan, updateRoutePlan])

  const handleEdit   = (plan) => { setEditTarget(plan); setShowForm(true) }
  const handleAdd    = () => { setEditTarget(null); setShowForm(true) }
  const handleDelete = (plan) => setDeleteTarget(plan)
  const handleDeleteConfirm = () => { if (deleteTarget) { deleteRoutePlan(deleteTarget.id); setDeleteTarget(null) } }
  const handleSetActive = (id) => setActiveRoute(id)

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-800/60 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display text-xl font-bold text-white">Route Planner</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {routePlans.length} route plan{routePlans.length !== 1 ? 's' : ''} saved
              {activeRoute ? ` · Active: ${activeRoute.name || (activeRoute.origin?.label + ' → ' + activeRoute.destination?.label)}` : ''}
            </p>
          </div>
          <button onClick={handleAdd}
            className={`btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2 flex items-center gap-1.5 ${!activeVehicle ? 'opacity-60' : ''}`}>
            <Icon name="Plus" size={14} />
            Create Route
          </button>
        </div>

        {/* Active vehicle panel */}
        <ActiveVehiclePanel vehicle={activeVehicle} onGoToVehicles={() => navigate(ROUTES.FLEET)} />

        {/* Active route banner */}
        <div className="mt-2">
          <ActiveRouteBanner activeRoute={activeRoute} />
        </div>
      </div>

      {/* Search — only when plans exist */}
      {routePlans.length > 0 && (
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800/40 flex-shrink-0">
          <div className="relative">
            <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, origin, destination…"
              className="apex-input w-full text-xs pl-8 py-1.5 sm:max-w-xs" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">

        {routePlans.length === 0 ? (
          <EmptyRoutes
            hasVehicle={!!activeVehicle}
            onAdd={handleAdd}
            onGoToVehicles={() => navigate(ROUTES.FLEET)}
          />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No routes match your search.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(plan => (
              <RouteCard
                key={plan.id}
                plan={plan}
                isActive={plan.id === activeRouteId}
                onSetActive={handleSetActive}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* ── Run 4: Route Map ─────────────────────────────── */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Map" size={13} className="text-cyan-400" />
            <span className="text-xs font-semibold text-slate-400">Route Map</span>
            {activeRoute && (
              <span className="text-2xs text-slate-500 ml-auto truncate">
                {activeRoute.name || `${activeRoute.origin?.label} → ${activeRoute.destination?.label}`}
              </span>
            )}
          </div>
          <Suspense fallback={
            <div className="flex items-center justify-center h-64 bg-[#050810] border border-slate-800/60 rounded-xl">
              <div className="flex flex-col items-center gap-2">
                <div className="w-7 h-7 border-2 border-[#b8860b]/30 border-t-[#b8860b] rounded-full animate-spin" />
                <span className="text-xs text-slate-600 font-mono">LOADING MAP</span>
              </div>
            </div>
          }>
            <RouteMap
              routePlan={activeRoute || (filtered.length > 0 ? filtered[0] : null)}
              height="380px"
              showDisclaimer={false}
              demoMode={false}
            />
          </Suspense>
        </div>

        {/* Run 5 placeholder */}
        <div className="mt-4 p-3 bg-violet-500/5 border border-violet-500/15 rounded-xl">
          <div className="flex items-start gap-2">
            <Icon name="Smartphone" size={13} className="text-violet-400 flex-shrink-0 mt-0.5" />
            <p className="text-2xs text-slate-500 leading-relaxed">
              <span className="text-violet-400 font-medium">Run 5</span> will connect the map to the Driver PWA
              with start/pause/resume/complete controls, driver acknowledgement, and real-time route following.
            </p>
          </div>
        </div>

        {/* Safety advisory */}
        <div className="mt-3 p-3 bg-[#0a0700] border border-[#b8860b]/15 rounded-xl">
          <p className="text-2xs text-slate-600 leading-relaxed">
            ⚠ Advisory only: map data may be incomplete or out of date. Always verify live road signs,
            restrictions, and vehicle suitability before travel. Big V's Best Routes™ is advisory only
            and does not guarantee legal route suitability.
          </p>
        </div>
      </div>

      {/* Forms / modals */}
      {showForm && (
        <RoutePlanForm
          initial={editTarget || undefined}
          activeVehicle={activeVehicle}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditTarget(null) }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          plan={deleteTarget}
          isActive={deleteTarget.id === activeRouteId}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

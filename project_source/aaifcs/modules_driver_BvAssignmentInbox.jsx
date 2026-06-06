/**
 * ============================================================
 * Big V's Best Routes™ — Driver PWA Assignment Inbox
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 * Run 6 — Assignment Inbox + Driver Report Form
 *
 * Added as the 'inbox' sub-screen in BvRouteNav.
 * Reads from Run 6 SSOT stores.
 * Uses bvSyncService for all state transitions.
 *
 * "Only submit reports when safely parked or when it is
 * lawful and safe to do so."
 * ============================================================
 */

import { useState, useCallback, memo } from 'react'
import Icon from './components_ui_Icon'
import {
  useAssignmentStore, useDriverReportStore,
  useTripSessionStore, useSyncQueueStore,
  useSyncStatusStore, useVehicleStore, useRouteStore,
} from './core_storage'
import {
  updateAssignmentStatus,
  submitDriverReport,
  runSyncNow,
} from './services_sync_bvSyncService'
import { useLiveAssignmentActions, useLiveAssignments, useLiveDriverReports } from './hooks_useLiveData'

// ─── Helpers ─────────────────────────────────────────────────
const fmtTime = (iso) => {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) }
  catch { return iso }
}

const PRIORITY_STYLE = {
  normal:         { color: 'text-slate-500',   label: 'Normal'              },
  important:      { color: 'text-amber-400',   label: 'Important'           },
  reviewRequired: { color: 'text-red-400',     label: '⚠ Review Before Drive'},
}

const ASGN_STATUS_STYLE = {
  draft:       { color: 'text-slate-500',   label: 'Draft'       },
  assigned:    { color: 'text-cyan-400',    label: 'Assigned'    },
  received:    { color: 'text-violet-400',  label: 'Received'    },
  reviewed:    { color: 'text-blue-400',    label: 'Reviewed'    },
  inProgress:  { color: 'text-emerald-400', label: 'In Progress' },
  paused:      { color: 'text-amber-400',   label: 'Paused'      },
  completed:   { color: 'text-violet-400',  label: 'Completed'   },
  needsReview: { color: 'text-red-400',     label: 'Needs Review'},
  cancelled:   { color: 'text-slate-600',   label: 'Cancelled'   },
}

const REPORT_TYPES = [
  { val: 'route_concern',          label: 'Route Concern'           },
  { val: 'legal_restriction',      label: 'Legal Restriction Concern'},
  { val: 'low_bridge',             label: 'Low Bridge Concern'      },
  { val: 'width_restriction',      label: 'Width Restriction Concern'},
  { val: 'weight_restriction',     label: 'Weight Restriction Concern'},
  { val: 'road_closure',           label: 'Road Closure'            },
  { val: 'unsafe_road_condition',  label: 'Unsafe Road Condition'   },
  { val: 'gps_map_issue',          label: 'GPS / Map Issue'         },
  { val: 'vehicle_issue',          label: 'Vehicle Issue'           },
  { val: 'delay',                  label: 'Delay'                   },
  { val: 'completed_with_notes',   label: 'Completed with Notes'    },
  { val: 'other',                  label: 'Other'                   },
]

const SEVERITY_OPTS = [
  { val: 'info',     label: 'Info',     color: 'text-slate-400' },
  { val: 'caution',  label: 'Caution',  color: 'text-amber-400' },
  { val: 'high',     label: 'High',     color: 'text-amber-300' },
  { val: 'critical', label: 'Critical', color: 'text-red-400'   },
]

// ─── Report form ──────────────────────────────────────────────
function ReportForm({ assignment, tripSessionId, gpsPosition, vehicles, routePlans, onDone }) {
  const [type,     setType]     = useState('route_concern')
  const [severity, setSeverity] = useState('caution')
  const [notes,    setNotes]    = useState('')
  const [location, setLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)

  const { submitReport: submitLiveReport, isLive } = useLiveAssignmentActions()

  const handleSubmit = useCallback(async () => {
    if (!notes.trim()) return
    setSubmitting(true)
    // Always save locally via SSOT first
    const localReport = submitDriverReport({
      reportType:      type,
      severity,
      notes:           notes.trim(),
      routeId:         assignment?.routeId   || null,
      vehicleId:       assignment?.vehicleId || null,
      tripSessionId,
      assignmentId:    assignment?.id        || null,
      gpsPosition,
      manualLocation:  location.trim(),
    })
    // If Live Mode is active, also write to Supabase
    if (isLive && localReport?.id) {
      try {
        await submitLiveReport(localReport)
      } catch (e) {
        // Non-fatal — local record is already saved
        console.warn('[BvInbox] Live report sync failed (non-fatal):', e.message)
      }
    }
    setSubmitting(false)
    setSubmitted(true)
  }, [type, severity, notes, location, assignment, tripSessionId, gpsPosition, isLive, submitLiveReport])

  if (submitted) return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
        <Icon name="CheckCircle" size={22} className="text-emerald-400" />
      </div>
      <p className="text-sm font-semibold text-emerald-400">Report submitted</p>
      <p className="text-2xs text-slate-500 text-center max-w-[220px]">Saved locally. It will appear in the dashboard Driver Reports panel.</p>
      <button onClick={onDone}
        className="mt-2 px-4 py-2.5 rounded-xl bg-[#b8860b]/80 hover:bg-[#b8860b] text-black text-sm font-bold transition-all">
        Return
      </button>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Driving safety warning */}
      <div className="p-3 bg-red-950/40 border border-red-700/40 rounded-xl flex items-start gap-2">
        <Icon name="AlertTriangle" size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-2xs text-red-300 leading-relaxed">
          Only submit reports when <span className="font-semibold">safely parked</span> or when it is lawful and safe to do so.
        </p>
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <label className="text-2xs text-slate-500">Report Type</label>
        <select value={type} onChange={e => setType(e.target.value)}
          className="w-full bg-[#0d1426] border border-slate-700/60 rounded-lg px-2.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#b8860b]/50">
          {REPORT_TYPES.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
        </select>
      </div>

      {/* Severity */}
      <div className="space-y-1.5">
        <label className="text-2xs text-slate-500">Severity</label>
        <div className="grid grid-cols-4 gap-1.5">
          {SEVERITY_OPTS.map(s => (
            <button key={s.val} onClick={() => setSeverity(s.val)}
              className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                severity === s.val
                  ? `${s.color} bg-slate-800/80 border-slate-600/80`
                  : 'text-slate-600 border-slate-800/50 hover:border-slate-700/50'
              }`}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-2xs text-slate-500">Notes <span className="text-red-400">*</span></label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
          placeholder="Describe the issue clearly. What did you observe? Where? What action did you take?"
          className="w-full bg-[#0d1426] border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-[#b8860b]/50 resize-none leading-relaxed" />
      </div>

      {/* GPS position */}
      {gpsPosition ? (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-lg text-2xs text-emerald-400">
          <Icon name="MapPin" size={11} className="flex-shrink-0" />
          <span>GPS: {gpsPosition.lat?.toFixed(5)}, {gpsPosition.lng?.toFixed(5)} ±{gpsPosition.accuracy}m</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className="text-2xs text-slate-500">Manual location note (optional — GPS unavailable)</label>
          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="e.g. A12 southbound near junction 5"
            className="w-full bg-[#0d1426] border border-slate-700/60 rounded-lg px-2.5 py-2.5 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-[#b8860b]/50" />
        </div>
      )}

      {/* Attachment placeholder */}
      <div className="p-2.5 bg-slate-900/40 border border-slate-800/60 rounded-lg text-2xs text-slate-700">
        Attachment support can be added in a later backend-ready run.
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={submitting || !notes.trim()}
        className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
          submitting || !notes.trim()
            ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
            : 'bg-amber-700 hover:bg-amber-600 text-white'
        }`}>
        {submitting ? 'Submitting…' : 'Submit Report'}
      </button>
    </div>
  )
}

// ─── Assignment card ──────────────────────────────────────────
function AssignmentCard({ asgn, vehicles, routePlans, gpsPosition, tripSessionId, onOpenRoute }) {
  const [screen, setScreen] = useState('card') // 'card'|'report'
  const vehicle   = vehicles.find(v => v.id === asgn.vehicleId)
  const routePlan = routePlans.find(r => r.id === asgn.routeId)
  const st  = ASGN_STATUS_STYLE[asgn.status] || ASGN_STATUS_STYLE.assigned
  const pri = PRIORITY_STYLE[asgn.priority]  || PRIORITY_STYLE.normal

  const handleOpen = () => {
    if (asgn.status === 'assigned') updateAssignmentStatus(asgn.id, 'received', 'driverPwa')
    onOpenRoute?.(asgn)
  }

  if (screen === 'report') return (
    <div className="bg-[#07080d] border border-[#b8860b]/20 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#b8860b]/20">
        <button onClick={() => setScreen('card')} className="text-slate-500 hover:text-white">
          <Icon name="ChevronLeft" size={16} />
        </button>
        <span className="text-xs font-bold text-[#d4a017]">Submit Report</span>
      </div>
      <div className="p-4">
        <ReportForm
          assignment={asgn}
          tripSessionId={tripSessionId}
          gpsPosition={gpsPosition}
          vehicles={vehicles}
          routePlans={routePlans}
          onDone={() => setScreen('card')}
        />
      </div>
    </div>
  )

  return (
    <div className={`bg-[#07080d] border rounded-xl overflow-hidden transition-all ${
      asgn.status === 'needsReview' ? 'border-red-700/40' :
      asgn.status === 'inProgress'  ? 'border-emerald-500/25' :
      asgn.status === 'cancelled'   ? 'border-slate-800/40'  :
      'border-[#b8860b]/20'
    }`}>
      {/* Card header */}
      <div className="px-3 py-2.5 border-b border-slate-800/40 flex items-center gap-2">
        <Icon name="ClipboardList" size={12} className="text-[#b8860b] flex-shrink-0" />
        <span className="text-xs font-bold text-[#d4a017] flex-1 truncate">{asgn.routeName}</span>
        <span className={`text-2xs font-semibold ${pri.color} flex-shrink-0`}>{pri.label}</span>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Demo mode */}
        {asgn.demoMode && (
          <div className="px-2.5 py-1.5 bg-violet-500/8 border border-violet-500/15 rounded-lg text-2xs text-violet-400">
            ⚠ Demo assignment — not for real driving
          </div>
        )}
        {/* Safety review required */}
        {asgn.safetyReviewRequired && (
          <div className="px-2.5 py-1.5 bg-red-950/30 border border-red-700/30 rounded-lg text-2xs text-red-400">
            ⚠ Safety review required before starting navigation
          </div>
        )}

        {/* Route + vehicle */}
        <div className="grid grid-cols-2 gap-2 text-2xs">
          <div><div className="text-slate-600 mb-0.5">From</div><div className="text-slate-300">{asgn.origin?.label || '—'}</div></div>
          <div><div className="text-slate-600 mb-0.5">To</div><div className="text-slate-300">{asgn.destination?.label || '—'}</div></div>
          <div><div className="text-slate-600 mb-0.5">Vehicle</div><div className="text-slate-300">{vehicle?.name || asgn.vehicleName || '—'}</div></div>
          <div><div className="text-slate-600 mb-0.5">Status</div><div className={`font-semibold ${st.color}`}>{st.label}</div></div>
          <div><div className="text-slate-600 mb-0.5">Updated</div><div className="text-slate-500 font-mono">{fmtTime(asgn.updatedAt)}</div></div>
          <div><div className="text-slate-600 mb-0.5">Sync</div><div className="text-slate-600 font-mono text-2xs">{asgn.syncStatus}</div></div>
        </div>

        {/* Notes */}
        {asgn.notes && (
          <div className="p-2 bg-slate-900/50 border border-slate-800/50 rounded-lg text-2xs text-slate-400 leading-relaxed">
            {asgn.notes}
          </div>
        )}

        {/* Actions */}
        {asgn.status !== 'cancelled' && asgn.status !== 'completed' ? (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleOpen}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold transition-all">
              <Icon name="Navigation" size={14} /> Open Route
            </button>
            <button onClick={() => setScreen('report')}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-amber-700/80 hover:bg-amber-700 text-white text-sm font-bold transition-all">
              <Icon name="FileText" size={14} /> Report
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-800/40 bg-slate-900/30 text-slate-600 text-xs">
            <Icon name={asgn.status === 'completed' ? 'CheckCircle' : 'X'} size={12} />
            {asgn.status === 'completed' ? 'Route completed' : 'Assignment cancelled'}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PWA Sync Now ─────────────────────────────────────────────
function PwaSyncButton() {
  const [syncing, setSyncing]   = useState(false)
  const [result,  setResult]    = useState(null)
  const { lastSyncAt }          = useSyncStatusStore()
  const { queue }               = useSyncQueueStore()
  const pending = queue.filter(i => i.status === 'pending').length

  const handleSync = useCallback(async () => {
    setSyncing(true)
    await new Promise(r => setTimeout(r, 500))
    const r = runSyncNow()
    setResult(r)
    setSyncing(false)
  }, [])

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-800/60 rounded-xl">
      <div className="flex-1 min-w-0">
        <div className="text-2xs text-slate-500">Sync · {pending} pending · Last: {lastSyncAt ? fmtTime(lastSyncAt) : '—'}</div>
        {result && (
          <div className="text-2xs text-slate-600 mt-0.5">{result.message}</div>
        )}
      </div>
      <button onClick={handleSync} disabled={syncing}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
          syncing ? 'bg-slate-800 text-slate-600' : 'bg-[#b8860b]/70 hover:bg-[#b8860b] text-black'
        }`}>
        <Icon name={syncing ? 'Loader' : 'RefreshCw'} size={11} className={syncing ? 'animate-spin' : ''} />
        {syncing ? '…' : 'Sync'}
      </button>
    </div>
  )
}

// ─── Root — Assignment Inbox ──────────────────────────────────
export default memo(function BvAssignmentInbox({ navSession, gpsPosition, currentTripSessionId, onOpenRoute }) {
  const { assignments }  = useAssignmentStore()
  const vehicles         = useVehicleStore(s => s.vehicles)
  const routePlans       = useRouteStore(s => s.routePlans)
  const { reports }      = useDriverReportStore()

  const active   = assignments.filter(a => a.status !== 'cancelled').sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  const newCount = assignments.filter(a => a.status === 'assigned').length
  const rptCount = reports.filter(r => r.status === 'new').length

  return (
    <div className="flex flex-col h-full bg-[#07080d]">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800/60">
        <div className="text-sm font-bold text-white">Assigned Routes</div>
        <div className="text-2xs text-slate-600">Big V's Driver PWA™ · Powered by 4P3X Intelligent AI™</div>
      </div>

      {/* Status strip */}
      <div className="flex-shrink-0 px-4 pt-3 space-y-2">
        {/* Banners */}
        {newCount > 0 && (
          <div className="flex items-center gap-2 p-2.5 bg-cyan-500/8 border border-cyan-500/20 rounded-lg text-2xs text-cyan-400">
            <Icon name="Bell" size={11} />
            <span>{newCount} new assignment{newCount !== 1 ? 's' : ''} — open to mark received</span>
          </div>
        )}
        <PwaSyncButton />
      </div>

      {/* Assignments */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <Icon name="ClipboardList" size={28} className="text-slate-700" />
            <p className="text-xs text-slate-500">No assigned routes yet.</p>
            <p className="text-2xs text-slate-700 max-w-[240px] leading-relaxed">
              Create a route assignment from the dashboard. It will appear here immediately.
            </p>
          </div>
        ) : active.map(a => (
          <AssignmentCard
            key={a.id}
            asgn={a}
            vehicles={vehicles}
            routePlans={routePlans}
            gpsPosition={gpsPosition}
            tripSessionId={currentTripSessionId}
            onOpenRoute={onOpenRoute}
          />
        ))}

        {/* Advisory */}
        <div className="p-3 bg-[#0a0700] border border-[#b8860b]/15 rounded-xl text-2xs text-slate-600 leading-relaxed">
          <span className="text-[#d4a017] font-semibold">Big V's Best Routes™</span> provides advisory route, GPS, and compliance support only. The driver remains responsible for safe and legal driving, checking live road signs, restrictions, road conditions, and professional judgement.
        </div>
      </div>
    </div>
  )
})

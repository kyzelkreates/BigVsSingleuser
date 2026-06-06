/**
 * ============================================================
 * Big V's Best Routes™ — Dashboard Operations Panel
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 * Run 6 — Route Assignments · Trip Sessions · Driver Reports
 *
 * Self-contained. Dropped into pages_Dashboard.jsx.
 * Reads from Run 2/3 vehicle/route SSOT.
 * Writes through Run 6 SSOT stores only.
 *
 * ADVISORY: Reports are evidence-support records only.
 * They do not replace legal checks, emergency reporting,
 * insurance duties, employer procedures, or professional
 * judgement.
 * ============================================================
 */

import { useState, useCallback, memo } from 'react'
import Icon from './components_ui_Icon'
import {
  useVehicleStore, useRouteStore,
  useAssignmentStore, useTripSessionStore,
  useDriverReportStore, useSyncQueueStore,
  useAuditStore, useSyncStatusStore,
} from './core_storage'
import {
  createAssignment, reviewReport, runSyncNow,
  recordAuditEvent,
} from './services_sync_bvSyncService'
import {
  useLiveAssignments, useLiveTripSessions, useLiveDriverReports,
} from './hooks_useLiveData'
import { REALTIME_STATUS } from './services_supabase_bvRealtimeService'

// ─── Shared helpers ───────────────────────────────────────────
const fmtTime = (iso) => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch { return iso }
}

const SEVERITY_STYLE = {
  info:     { bg: 'bg-slate-900/50',    border: 'border-slate-700/40', text: 'text-slate-400', badge: 'bg-slate-800 text-slate-400' },
  caution:  { bg: 'bg-amber-950/20',   border: 'border-amber-700/30', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  high:     { bg: 'bg-amber-950/40',   border: 'border-amber-600/40', text: 'text-amber-300', badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
  critical: { bg: 'bg-red-950/40',     border: 'border-red-700/50',   text: 'text-red-400',   badge: 'bg-red-500/15 text-red-400 border border-red-700/40' },
}

const ASGN_STATUS_STYLE = {
  draft:        { color: 'text-slate-500',   bg: 'bg-slate-800/60',       label: 'Draft'          },
  assigned:     { color: 'text-cyan-400',    bg: 'bg-cyan-500/10',        label: 'Assigned'       },
  received:     { color: 'text-violet-400',  bg: 'bg-violet-500/10',      label: 'Received'       },
  reviewed:     { color: 'text-blue-400',    bg: 'bg-blue-500/10',        label: 'Reviewed'       },
  inProgress:   { color: 'text-emerald-400', bg: 'bg-emerald-500/10',     label: 'In Progress'    },
  paused:       { color: 'text-amber-400',   bg: 'bg-amber-500/10',       label: 'Paused'         },
  completed:    { color: 'text-violet-400',  bg: 'bg-violet-500/10',      label: 'Completed'      },
  needsReview:  { color: 'text-red-400',     bg: 'bg-red-500/10',         label: 'Needs Review'   },
  cancelled:    { color: 'text-slate-600',   bg: 'bg-slate-900/40',       label: 'Cancelled'      },
}

const RPT_STATUS_STYLE = {
  new:            { color: 'text-amber-400',   label: 'New'           },
  reviewed:       { color: 'text-blue-400',    label: 'Reviewed'      },
  actionRequired: { color: 'text-red-400',     label: 'Action Required'},
  resolved:       { color: 'text-emerald-400', label: 'Resolved'      },
  archived:       { color: 'text-slate-600',   label: 'Archived'      },
}

const TRIP_STATUS_STYLE = {
  notStarted:   { color: 'text-slate-500',   label: 'Not Started'  },
  active:       { color: 'text-emerald-400', label: 'Active'       },
  paused:       { color: 'text-amber-400',   label: 'Paused'       },
  completed:    { color: 'text-violet-400',  label: 'Completed'    },
  needsReview:  { color: 'text-red-400',     label: 'Needs Review' },
  cancelled:    { color: 'text-slate-600',   label: 'Cancelled'    },
  syncPending:  { color: 'text-slate-500',   label: 'Sync Pending' },
  syncedLocal:  { color: 'text-cyan-400',    label: 'Synced Local' },
  syncFailed:   { color: 'text-red-400',     label: 'Sync Failed'  },
}

// ─── Section header ───────────────────────────────────────────
function PanelHeader({ icon, title, badge, action }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-[#b8860b]/20 flex-shrink-0">
      <Icon name={icon} size={14} className="text-[#b8860b]" />
      <span className="text-sm font-bold text-[#d4a017]">{title}</span>
      {badge != null && badge > 0 && (
        <span className="text-2xs font-mono bg-[#b8860b]/20 text-[#d4a017] border border-[#b8860b]/30 px-1.5 py-0.5 rounded-full">{badge}</span>
      )}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────
function EmptyState({ icon, text, subtext }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
      <Icon name={icon} size={24} className="text-slate-700" />
      <p className="text-xs text-slate-500">{text}</p>
      {subtext && <p className="text-2xs text-slate-700 max-w-[260px] leading-relaxed">{subtext}</p>}
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────
function StatusBadge({ status, styleMap }) {
  const s = styleMap[status] || { color: 'text-slate-500', label: status }
  return <span className={`text-2xs font-semibold ${s.color}`}>{s.label}</span>
}

// ─── Sync Now button + result ─────────────────────────────────
function SyncNowButton() {
  const [syncing,  setSyncing]  = useState(false)
  const [result,   setResult]   = useState(null)
  const { lastSyncAt, lastSyncResult, isSyncing } = useSyncStatusStore()

  const handleSync = useCallback(async () => {
    setSyncing(true)
    await new Promise(r => setTimeout(r, 600)) // brief sim delay
    const r = runSyncNow()
    setResult(r)
    setSyncing(false)
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleSync}
          disabled={syncing}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
            syncing
              ? 'bg-slate-800 text-slate-600 cursor-wait'
              : 'bg-[#b8860b]/80 hover:bg-[#b8860b] text-black'
          }`}
        >
          <Icon name={syncing ? 'Loader' : 'RefreshCw'} size={12} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing…' : 'Sync Now'}
        </button>
        {lastSyncAt && !syncing && !result && (
          <span className="text-2xs text-slate-600">Last sync: {fmtTime(lastSyncAt)}</span>
        )}
      </div>
      {result && (
        <div className={`p-2.5 rounded-lg border text-2xs ${
          result.demoMode ? 'bg-violet-500/8 border-violet-500/20 text-violet-300' : 'bg-slate-900/60 border-slate-700/40 text-slate-400'
        }`}>
          <div className="font-semibold mb-1">{result.message}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono text-slate-500">
            <span>Assignments synced: {result.assignmentsSynced}</span>
            <span>Trip sessions: {result.tripSessionsSynced}</span>
            <span>Reports synced: {result.reportsSynced}</span>
            <span>Failed: {result.failed}</span>
          </div>
          <div className="mt-1.5 text-slate-600">
            {result.backendConfigured
              ? '✓ Backend configured'
              : '⚠ Backend not configured — data saved locally only'}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ROUTE ASSIGNMENTS PANEL ──────────────────────────────────
function AssignmentForm({ vehicles, routePlans, onCreated }) {
  const [routeId,  setRouteId]  = useState(routePlans[0]?.id || '')
  const [vehicleId,setVehicleId]= useState(vehicles[0]?.id   || '')
  const [priority, setPriority] = useState('normal')
  const [notes,    setNotes]    = useState('')
  const [safetyReq,setSafetyReq]= useState(false)
  const [creating, setCreating] = useState(false)
  const [error,    setError]    = useState('')

  const handleCreate = () => {
    if (!routeId)   { setError('Select a route.'); return }
    if (!vehicleId) { setError('Select a vehicle.'); return }
    setError('')
    setCreating(true)
    const plan    = routePlans.find(r => r.id === routeId)
    const vehicle = vehicles.find(v => v.id === vehicleId)
    createAssignment(plan, vehicle, { priority, notes, safetyReviewRequired: safetyReq })
    setTimeout(() => { setCreating(false); onCreated?.() }, 300)
  }

  if (!routePlans.length || !vehicles.length) return (
    <div className="p-3 bg-amber-950/30 border border-amber-700/30 rounded-xl text-2xs text-amber-400 space-y-1">
      {!routePlans.length && <p>⚠ No route plans yet — create a route in the Route Planner.</p>}
      {!vehicles.length  && <p>⚠ No vehicles yet — add a vehicle in the Fleet section.</p>}
    </div>
  )

  return (
    <div className="space-y-3 p-3.5 bg-[#0a0700]/80 border border-[#b8860b]/20 rounded-xl">
      <div className="text-2xs font-semibold text-[#d4a017] uppercase tracking-wider">Create Assignment</div>

      {/* Route */}
      <div className="space-y-1">
        <label className="text-2xs text-slate-500">Route</label>
        <select value={routeId} onChange={e => setRouteId(e.target.value)}
          className="w-full bg-[#0d1426] border border-slate-700/60 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#b8860b]/50">
          <option value="">— Select route —</option>
          {routePlans.map(r => (
            <option key={r.id} value={r.id}>
              {r.name || `${r.origin?.label || '?'} → ${r.destination?.label || '?'}`}
            </option>
          ))}
        </select>
      </div>

      {/* Vehicle */}
      <div className="space-y-1">
        <label className="text-2xs text-slate-500">Vehicle</label>
        <select value={vehicleId} onChange={e => setVehicleId(e.target.value)}
          className="w-full bg-[#0d1426] border border-slate-700/60 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#b8860b]/50">
          <option value="">— Select vehicle —</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.name} ({v.registration || v.type || '—'})</option>
          ))}
        </select>
      </div>

      {/* Priority */}
      <div className="space-y-1">
        <label className="text-2xs text-slate-500">Priority</label>
        <div className="flex gap-2">
          {[
            { val: 'normal',          label: 'Normal'             },
            { val: 'important',       label: 'Important'          },
            { val: 'reviewRequired',  label: 'Review Before Drive'},
          ].map(p => (
            <button key={p.val} onClick={() => setPriority(p.val)}
              className={`flex-1 py-1.5 rounded-lg text-2xs font-semibold border transition-all ${
                priority === p.val
                  ? 'bg-[#b8860b]/20 border-[#b8860b]/50 text-[#d4a017]'
                  : 'bg-slate-900/50 border-slate-700/50 text-slate-500 hover:text-slate-300'
              }`}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-2xs text-slate-500">Notes (optional)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          placeholder="Any specific instructions for this assignment…"
          className="w-full bg-[#0d1426] border border-slate-700/60 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-[#b8860b]/50 resize-none" />
      </div>

      {/* Safety review required */}
      <button onClick={() => setSafetyReq(v => !v)}
        className={`flex items-start gap-2.5 p-2.5 rounded-lg border w-full text-left transition-all ${
          safetyReq ? 'bg-amber-500/8 border-amber-500/25' : 'bg-slate-900/40 border-slate-700/40 hover:border-slate-600/40'
        }`}>
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
          safetyReq ? 'bg-amber-500 border-amber-500' : 'border-slate-600'
        }`}>
          {safetyReq && <Icon name="Check" size={9} className="text-white" />}
        </div>
        <span className="text-2xs text-slate-400">Safety review required before starting navigation</span>
      </button>

      {error && <p className="text-2xs text-red-400">{error}</p>}

      <button onClick={handleCreate} disabled={creating}
        className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all ${
          creating ? 'bg-slate-800 text-slate-600' : 'bg-emerald-700 hover:bg-emerald-600 text-white'
        }`}>
        {creating ? 'Creating…' : '+ Create Assignment'}
      </button>
    </div>
  )
}

function AssignmentCard({ asgn, vehicles, routePlans, onCancel, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const st = ASGN_STATUS_STYLE[asgn.status] || ASGN_STATUS_STYLE.draft
  const vehicle   = vehicles.find(v => v.id === asgn.vehicleId)
  const routePlan = routePlans.find(r => r.id === asgn.routeId)

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      asgn.status === 'needsReview' ? 'border-red-700/40' :
      asgn.status === 'completed'   ? 'border-violet-500/20' :
      asgn.status === 'inProgress'  ? 'border-emerald-500/20' :
      'border-slate-800/60'
    } bg-slate-900/40`}>
      <button onClick={() => setExpanded(v => !v)} className="w-full flex items-center gap-3 p-3 text-left">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          asgn.status === 'inProgress' ? 'bg-emerald-400 animate-pulse' :
          asgn.status === 'needsReview'? 'bg-red-400'    :
          asgn.status === 'completed'  ? 'bg-violet-400' :
          asgn.status === 'paused'     ? 'bg-amber-400'  :
          'bg-slate-600'
        }`} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-white truncate">{asgn.routeName}</div>
          <div className="text-2xs text-slate-500 truncate">{asgn.vehicleName} · {fmtTime(asgn.createdAt)}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {asgn.priority !== 'normal' && (
            <span className={`text-2xs font-semibold px-1.5 py-0.5 rounded border ${
              asgn.priority === 'reviewRequired' ? 'text-red-400 border-red-700/40 bg-red-500/8' : 'text-amber-400 border-amber-700/30 bg-amber-500/8'
            }`}>{asgn.priority === 'reviewRequired' ? '⚠ Review Req.' : 'Important'}</span>
          )}
          <span className={`text-2xs font-semibold px-1.5 py-0.5 rounded ${st.bg} ${st.color}`}>{st.label}</span>
          <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={12} className="text-slate-600" />
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-800/40 pt-3">
          {/* Route + vehicle detail */}
          <div className="grid grid-cols-2 gap-2 text-2xs">
            <div>
              <div className="text-slate-600 mb-0.5">From</div>
              <div className="text-slate-400">{asgn.origin?.label || '—'}</div>
            </div>
            <div>
              <div className="text-slate-600 mb-0.5">To</div>
              <div className="text-slate-400">{asgn.destination?.label || '—'}</div>
            </div>
            <div>
              <div className="text-slate-600 mb-0.5">Vehicle</div>
              <div className="text-slate-400">{vehicle?.name || asgn.vehicleName || '—'}</div>
            </div>
            <div>
              <div className="text-slate-600 mb-0.5">Sync</div>
              <div className={`font-mono ${asgn.syncStatus === 'syncedLocal' ? 'text-cyan-400' : 'text-slate-600'}`}>{asgn.syncStatus}</div>
            </div>
          </div>
          {asgn.notes && (
            <div className="p-2 bg-slate-900/60 border border-slate-800/60 rounded-lg text-2xs text-slate-400">
              {asgn.notes}
            </div>
          )}
          {/* Timeline */}
          {asgn.timeline?.length > 0 && (
            <div className="space-y-1">
              <div className="text-2xs text-slate-600 uppercase tracking-wider">Timeline</div>
              {asgn.timeline.slice(-5).map((ev, i) => (
                <div key={i} className="flex items-start gap-2 text-2xs">
                  <span className="text-slate-700 font-mono flex-shrink-0">{fmtTime(ev.at)}</span>
                  <span className="text-slate-500">{ev.label}</span>
                  <span className="text-slate-700 ml-auto">{ev.source}</span>
                </div>
              ))}
            </div>
          )}
          {/* Actions */}
          <div className="flex gap-2">
            {asgn.status !== 'cancelled' && asgn.status !== 'completed' && (
              <button onClick={() => onCancel(asgn.id)}
                className="text-2xs text-slate-600 hover:text-amber-400 transition-colors flex items-center gap-1">
                <Icon name="X" size={10} /> Cancel
              </button>
            )}
            <button onClick={() => onDelete(asgn.id)}
              className="text-2xs text-slate-700 hover:text-red-400 transition-colors flex items-center gap-1 ml-auto">
              <Icon name="Trash2" size={10} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AssignmentsPanel({ vehicles, routePlans }) {
  const [showForm,   setShowForm]   = useState(false)
  const { assignments: localAssignments, cancelAssignment, deleteAssignment } = useAssignmentStore()
  const { isLive, assignments: liveAssignments, isLoading: liveLoading, error: liveError, realtimeStatus } = useLiveAssignments()

  // Live Mode: use Supabase records. Demo Mode: use local SSOT only.
  // Demo records are never shown in Live Mode.
  const assignments = isLive ? liveAssignments : localAssignments
  const sorted = [...assignments].sort((a,b) => new Date(b.createdAt||b.created_at||0) - new Date(a.createdAt||a.created_at||0))
  const pendingCount = localAssignments.filter(a => a.syncStatus === 'pending').length

  return (
    <div className="bg-[#07080d] border border-[#b8860b]/20 rounded-xl overflow-hidden">
      <PanelHeader
        icon="ClipboardList"
        title="Route Assignments"
        badge={pendingCount}
        action={
          <button onClick={() => setShowForm(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
              showForm ? 'bg-slate-800 text-slate-400' : 'bg-[#b8860b]/20 text-[#d4a017] hover:bg-[#b8860b]/30'
            }`}>
            <Icon name={showForm ? 'X' : 'Plus'} size={11} />
            {showForm ? 'Cancel' : 'New Assignment'}
          </button>
        }
      />
      <div className="p-4 space-y-3">
        {showForm && (
          <AssignmentForm vehicles={vehicles} routePlans={routePlans} onCreated={() => setShowForm(false)} />
        )}
        {/* ── Live loading state ── */}
        {isLive && liveLoading && (
          <div className="flex items-center gap-2 py-6 justify-center text-2xs text-cyan-400">
            <span className="w-3.5 h-3.5 border border-t-cyan-400 border-slate-700 rounded-full animate-spin" />
            Loading live assignments…
          </div>
        )}

        {/* ── Live error state ── */}
        {isLive && !liveLoading && liveError && (
          <div className="flex items-start gap-2 p-3 bg-red-950/25 border border-red-700/25 rounded-lg text-2xs text-red-400">
            <Icon name="AlertTriangle" size={12} className="flex-shrink-0 mt-0.5" />
            <span className="break-words">{liveError}</span>
          </div>
        )}

        {/* ── Live realtime pill ── */}
        {isLive && !liveLoading && (
          <div className={`flex items-center gap-1.5 text-2xs px-2 py-1 rounded-full w-fit ${
            realtimeStatus === REALTIME_STATUS.ACTIVE
              ? 'bg-violet-500/8 border border-violet-500/20 text-violet-300'
              : 'bg-slate-900/40 border border-slate-800/40 text-slate-600'
          }`}>
            <Icon name={realtimeStatus === REALTIME_STATUS.ACTIVE ? 'Radio' : 'RadioTower'} size={9}
              className={realtimeStatus === REALTIME_STATUS.ACTIVE ? 'animate-pulse' : ''} />
            {realtimeStatus === REALTIME_STATUS.ACTIVE ? 'Live realtime active' : 'Live schema ready, realtime not active'}
          </div>
        )}

        {sorted.length === 0 && !showForm && !liveLoading ? (
          isLive ? (
            <EmptyState
              icon="ClipboardList"
              text="Live Mode is active. No live records found yet."
              subtext="Demo records are hidden in Live Mode. Create or sync live assignments to begin."
            />
          ) : (
            <EmptyState
              icon="ClipboardList"
              text="No route assignments yet."
              subtext="Create an assignment to send a route to the Driver PWA."
            />
          )
        ) : (
          sorted.map(a => (
            <AssignmentCard
              key={a.id}
              asgn={a}
              vehicles={vehicles}
              routePlans={routePlans}
              onCancel={(id) => { cancelAssignment(id) }}
              onDelete={(id) => { deleteAssignment(id) }}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── TRIP SESSIONS PANEL ──────────────────────────────────────
function TripSessionDetail({ session, vehicles, routePlans, onClose }) {
  const { assignments } = useAssignmentStore()
  const { reports }     = useDriverReportStore()
  const vehicle   = vehicles.find(v => v.id === session.vehicleId)
  const route     = routePlans.find(r => r.id === session.routeId)
  const asgn      = assignments.find(a => a.id === session.assignmentId)
  const linked    = reports.filter(r => (session.reportsLinked || []).includes(r.id))
  const st        = TRIP_STATUS_STYLE[session.status] || TRIP_STATUS_STYLE.notStarted
  const cl        = session.checklistSnapshot || {}
  const clCount   = Object.values(cl).filter(Boolean).length
  const clTotal   = Object.keys(cl).length

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#07080d] border border-[#b8860b]/20 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#b8860b]/20">
          <Icon name="Route" size={14} className="text-[#b8860b]" />
          <span className="text-sm font-bold text-[#d4a017] flex-1">Trip Session Detail</span>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <Icon name="X" size={16} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* Status */}
          <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${st.color} bg-slate-900/40 border-slate-800/60`}>
            <span className={`text-xs font-bold ${st.color}`}>{st.label}</span>
            <span className="text-2xs text-slate-600 ml-auto font-mono">{session.id}</span>
          </div>
          {/* Route + Vehicle */}
          <div className="grid grid-cols-2 gap-3 text-2xs">
            <div className="space-y-0.5">
              <div className="text-slate-600">Route</div>
              <div className="text-slate-300">{route?.name || asgn?.routeName || session.routeId || '—'}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-slate-600">Vehicle</div>
              <div className="text-slate-300">{vehicle?.name || '—'}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-slate-600">Started</div>
              <div className="text-slate-400 font-mono">{fmtTime(session.startedAt)}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-slate-600">Completed</div>
              <div className="text-slate-400 font-mono">{fmtTime(session.completedAt)}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-slate-600">GPS Status</div>
              <div className="text-slate-400">{session.gpsStatus || '—'}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-slate-600">Checklist</div>
              <div className={`font-semibold ${clCount === clTotal && clTotal > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {clTotal > 0 ? `${clCount}/${clTotal}` : '—'}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-slate-600">Sync</div>
              <div className="font-mono text-cyan-400/70">{session.syncStatus}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-slate-600">Mode</div>
              <div className={session.demoMode ? 'text-violet-400' : 'text-slate-400'}>{session.demoMode ? 'Demo' : 'Live'}</div>
            </div>
          </div>
          {/* Acknowledgement */}
          <div className={`flex items-center gap-2 p-2.5 rounded-lg border text-2xs ${
            session.acknowledgementAccepted ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-slate-800/40 bg-slate-900/40 text-slate-600'
          }`}>
            <Icon name={session.acknowledgementAccepted ? 'CheckCircle' : 'Circle'} size={12} />
            <span>{session.acknowledgementAccepted ? 'Advisory acknowledgement accepted' : 'Acknowledgement not recorded'}</span>
            {session.acknowledgementAcceptedAt && (
              <span className="ml-auto text-slate-600 font-mono">{fmtTime(session.acknowledgementAcceptedAt)}</span>
            )}
          </div>
          {/* Warnings at start */}
          {session.warningsAtStart?.length > 0 && (
            <div className="space-y-1">
              <div className="text-2xs text-slate-600 uppercase tracking-wider">Warnings at Start ({session.warningsAtStart.length})</div>
              {session.warningsAtStart.map((w,i) => (
                <div key={i} className="text-2xs text-amber-400/70 pl-2 border-l border-amber-700/30">{w.text || JSON.stringify(w)}</div>
              ))}
            </div>
          )}
          {/* Driver notes */}
          {session.driverNotes && (
            <div className="p-2.5 bg-slate-900/60 border border-slate-700/40 rounded-lg text-2xs text-slate-400">{session.driverNotes}</div>
          )}
          {/* Linked reports */}
          {linked.length > 0 && (
            <div className="space-y-1">
              <div className="text-2xs text-slate-600 uppercase tracking-wider">Linked Reports ({linked.length})</div>
              {linked.map(r => (
                <div key={r.id} className="flex items-center gap-2 text-2xs p-2 rounded-lg bg-slate-900/40 border border-slate-800/40">
                  <span className={SEVERITY_STYLE[r.severity]?.text || 'text-slate-500'}>{r.reportType}</span>
                  <span className="text-slate-600">{r.severity}</span>
                  <span className="text-slate-700 ml-auto">{fmtTime(r.submittedAt)}</span>
                </div>
              ))}
            </div>
          )}
          {/* Legal notice */}
          <div className="p-2.5 bg-[#0a0700] border border-[#b8860b]/15 rounded-lg text-2xs text-slate-600 leading-relaxed">
            Driver reports are evidence-support records. They do not replace legal checks, emergency reporting, insurance duties, employer procedures, or professional judgement.
          </div>
        </div>
      </div>
    </div>
  )
}

function TripSessionsPanel({ vehicles, routePlans }) {
  const { sessions }  = useTripSessionStore()
  const [detail, setDetail] = useState(null)
  const sorted = [...sessions].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div className="bg-[#07080d] border border-[#b8860b]/20 rounded-xl overflow-hidden">
      <PanelHeader icon="Route" title="Trip Sessions" badge={sessions.filter(s=>s.syncStatus==='syncPending').length} />
      {detail && (
        <TripSessionDetail session={detail} vehicles={vehicles} routePlans={routePlans} onClose={() => setDetail(null)} />
      )}
      <div className="p-4 space-y-2">
        {isLive && liveTripLoading && (
          <div className="flex items-center gap-2 py-6 justify-center text-2xs text-cyan-400">
            <span className="w-3.5 h-3.5 border border-t-cyan-400 border-slate-700 rounded-full animate-spin" />
            Loading live trip sessions…
          </div>
        )}
        {isLive && !liveTripLoading && liveTripError && (
          <div className="flex items-start gap-2 p-3 bg-red-950/25 border border-red-700/25 rounded-lg text-2xs text-red-400">
            <Icon name="AlertTriangle" size={12} className="flex-shrink-0 mt-0.5" />
            <span className="break-words">{liveTripError}</span>
          </div>
        )}
        {!liveTripLoading && sorted.length === 0 ? (
          isLive
            ? <EmptyState icon="Route"
                text="Live Mode is active. No live trip sessions found yet."
                subtext="Demo records are hidden in Live Mode. Sessions appear here when a driver starts navigation in Live Mode." />
            : <EmptyState icon="Route"
                text="No trip sessions yet."
                subtext="Trip sessions are recorded when the driver starts navigation on an assigned route." />
        ) : sorted.map(s => {
          const st = TRIP_STATUS_STYLE[s.status] || TRIP_STATUS_STYLE.notStarted
          const { assignments } = useAssignmentStore.getState()
          const asgn = assignments.find(a => a.id === s.assignmentId)
          const vehicle = vehicles.find(v => v.id === s.vehicleId)
          return (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-800/60 bg-slate-900/40 hover:border-slate-700/60 transition-all">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                s.status === 'active'      ? 'bg-emerald-400 animate-pulse' :
                s.status === 'needsReview' ? 'bg-red-400'     :
                s.status === 'completed'   ? 'bg-violet-400'  : 'bg-slate-600'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white truncate">
                  {asgn?.routeName || `Route ${s.routeId?.slice(-6) || '—'}`}
                </div>
                <div className="text-2xs text-slate-500 truncate">
                  {vehicle?.name || '—'} · {fmtTime(s.startedAt)}
                  {s.reportsLinked?.length > 0 && <span className="text-amber-400 ml-1">· {s.reportsLinked.length} report{s.reportsLinked.length !== 1 ? 's' : ''}</span>}
                </div>
              </div>
              <StatusBadge status={s.status} styleMap={TRIP_STATUS_STYLE} />
              <button onClick={() => setDetail(s)}
                className="ml-2 text-2xs text-slate-600 hover:text-cyan-400 transition-colors flex-shrink-0">
                <Icon name="Eye" size={12} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── DRIVER REPORTS PANEL ─────────────────────────────────────
function ReportDetail({ report, vehicles, routePlans, onClose }) {
  const { assignments } = useAssignmentStore()
  const { sessions }    = useTripSessionStore()
  const vehicle  = vehicles.find(v => v.id === report.vehicleId)
  const route    = routePlans.find(r => r.id === report.routeId)
  const asgn     = assignments.find(a => a.id === report.assignmentId)
  const session  = sessions.find(s => s.id === report.tripSessionId)
  const sv       = SEVERITY_STYLE[report.severity] || SEVERITY_STYLE.info

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#07080d] border border-[#b8860b]/20 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#b8860b]/20">
          <Icon name="FileText" size={14} className="text-[#b8860b]" />
          <span className="text-sm font-bold text-[#d4a017] flex-1">Driver Report</span>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><Icon name="X" size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${sv.border} ${sv.bg}`}>
            <span className={`text-xs font-bold uppercase tracking-wide ${sv.text}`}>{report.severity}</span>
            <span className="text-xs text-slate-400">{report.reportType?.replace(/_/g,' ')}</span>
            <span className="text-2xs text-slate-600 ml-auto">{fmtTime(report.submittedAt)}</span>
          </div>
          {report.notes && (
            <div className="p-2.5 bg-slate-900/60 border border-slate-700/40 rounded-lg text-sm text-slate-300 leading-relaxed">{report.notes}</div>
          )}
          <div className="grid grid-cols-2 gap-2 text-2xs">
            <div><div className="text-slate-600">Route</div><div className="text-slate-400">{route?.name || asgn?.routeName || '—'}</div></div>
            <div><div className="text-slate-600">Vehicle</div><div className="text-slate-400">{vehicle?.name || '—'}</div></div>
            <div><div className="text-slate-600">Trip Session</div><div className="text-slate-400 font-mono">{session?.id?.slice(-8) || '—'}</div></div>
            <div><div className="text-slate-600">GPS</div><div className="text-slate-400">{report.gpsPosition ? `${report.gpsPosition.lat?.toFixed(4)}, ${report.gpsPosition.lng?.toFixed(4)}` : '—'}</div></div>
            <div><div className="text-slate-600">Manual Location</div><div className="text-slate-400">{report.manualLocation || '—'}</div></div>
            <div><div className="text-slate-600">Mode</div><div className={report.demoMode ? 'text-violet-400' : 'text-slate-400'}>{report.demoMode ? 'Demo' : 'Live'}</div></div>
          </div>
          {report.reviewNote && (
            <div className="p-2.5 bg-slate-900/50 border border-slate-700/40 rounded-lg text-2xs text-slate-400">
              <span className="text-slate-600">Review note: </span>{report.reviewNote}
            </div>
          )}
          <div className="p-2.5 bg-[#0a0700] border border-[#b8860b]/15 rounded-lg text-2xs text-slate-600 leading-relaxed">
            Driver reports are evidence-support records. They do not replace legal checks, emergency reporting, insurance duties, employer procedures, or professional judgement.
          </div>
        </div>
      </div>
    </div>
  )
}

function DriverReportsPanel({ vehicles, routePlans }) {
  const { reports: localReports }   = useDriverReportStore()
  const { isLive, reports: liveReports, isLoading: liveRptLoading, error: liveRptError } = useLiveDriverReports()
  // Live Mode: show Supabase records only. Demo Mode: show local SSOT.
  const reports = isLive ? liveReports : localReports
  const [detail, setDetail] = useState(null)
  const sorted = [...reports].sort((a,b) => new Date(b.submittedAt||b.submitted_at||b.createdAt||0) - new Date(a.submittedAt||a.submitted_at||a.createdAt||0))
  const newCount = reports.filter(r => r.status === 'new').length

  return (
    <div className="bg-[#07080d] border border-[#b8860b]/20 rounded-xl overflow-hidden">
      <PanelHeader icon="FileText" title="Driver Reports" badge={newCount} />
      {detail && (
        <ReportDetail report={detail} vehicles={vehicles} routePlans={routePlans} onClose={() => setDetail(null)} />
      )}
      <div className="p-4 space-y-2">
        {isLive && liveRptLoading && (
          <div className="flex items-center gap-2 py-6 justify-center text-2xs text-cyan-400">
            <span className="w-3.5 h-3.5 border border-t-cyan-400 border-slate-700 rounded-full animate-spin" />
            Loading live driver reports…
          </div>
        )}
        {isLive && !liveRptLoading && liveRptError && (
          <div className="flex items-start gap-2 p-3 bg-red-950/25 border border-red-700/25 rounded-lg text-2xs text-red-400">
            <Icon name="AlertTriangle" size={12} className="flex-shrink-0 mt-0.5" />
            <span className="break-words">{liveRptError}</span>
          </div>
        )}
        {!liveRptLoading && sorted.length === 0 ? (
          isLive
            ? <EmptyState icon="FileText"
                text="Live Mode is active. No live driver reports found yet."
                subtext="Demo records are hidden in Live Mode. Reports appear here when submitted from the Driver PWA in Live Mode." />
            : <EmptyState icon="FileText"
                text="No driver reports yet."
                subtext="Driver reports are submitted from the Driver PWA during or after navigation." />
        ) : sorted.map(r => {
          const sv = SEVERITY_STYLE[r.severity] || SEVERITY_STYLE.info
          const st = RPT_STATUS_STYLE[r.status] || RPT_STATUS_STYLE.new
          return (
            <div key={r.id} className={`rounded-xl border p-3 space-y-2 transition-all ${sv.border} ${sv.bg}`}>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold ${sv.text}`}>{r.severity.toUpperCase()}</span>
                    <span className="text-xs text-slate-400">{r.reportType?.replace(/_/g,' ')}</span>
                    {r.demoMode && <span className="text-2xs text-violet-400 border border-violet-500/20 px-1 rounded">Demo</span>}
                    <span className={`text-2xs font-semibold ${st.color} ml-auto`}>{st.label}</span>
                  </div>
                  {r.notes && <p className="text-2xs text-slate-500 mt-1 line-clamp-2">{r.notes}</p>}
                  <p className="text-2xs text-slate-700 mt-0.5 font-mono">{fmtTime(r.submittedAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.status === 'new' && (
                  <>
                    <button onClick={() => reviewReport(r.id, 'reviewed')}
                      className="text-2xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                      <Icon name="Check" size={10} /> Reviewed
                    </button>
                    <button onClick={() => reviewReport(r.id, 'actionRequired')}
                      className="text-2xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                      <Icon name="AlertTriangle" size={10} /> Action Req.
                    </button>
                  </>
                )}
                {(r.status === 'reviewed' || r.status === 'actionRequired') && (
                  <button onClick={() => reviewReport(r.id, 'resolved')}
                    className="text-2xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                    <Icon name="CheckCircle" size={10} /> Resolve
                  </button>
                )}
                <button onClick={() => setDetail(r)}
                  className="text-2xs text-slate-600 hover:text-cyan-400 transition-colors flex items-center gap-1 ml-auto">
                  <Icon name="Eye" size={10} /> Details
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Sync status row ──────────────────────────────────────────
function SyncSummaryRow() {
  const { queue }    = useSyncQueueStore()
  const { lastSyncAt, lastSyncResult } = useSyncStatusStore()
  const pending = queue.filter(i => i.status === 'pending').length
  const demo    = lastSyncResult?.demoMode ?? true

  return (
    <div className="bg-[#07080d] border border-[#b8860b]/15 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon name="RefreshCw" size={13} className="text-[#b8860b]" />
        <span className="text-sm font-bold text-[#d4a017]">Sync</span>
        <span className={`ml-auto text-2xs px-2 py-0.5 rounded border font-semibold ${
          demo ? 'text-violet-400 border-violet-500/20 bg-violet-500/8' : 'text-cyan-400 border-cyan-500/20 bg-cyan-500/8'
        }`}>{demo ? 'Demo Mode' : 'Live Mode'}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-2xs">
        <div>
          <div className="text-slate-600">Pending</div>
          <div className={`font-mono font-semibold ${pending > 0 ? 'text-amber-400' : 'text-slate-500'}`}>{pending} item{pending !== 1 ? 's' : ''}</div>
        </div>
        <div>
          <div className="text-slate-600">Last Sync</div>
          <div className="font-mono text-slate-400">{lastSyncAt ? fmtTime(lastSyncAt) : '—'}</div>
        </div>
        <div>
          <div className="text-slate-600">Backend</div>
          <div className="text-slate-600">Not configured</div>
        </div>
        <div>
          <div className="text-slate-600">Mode</div>
          <div className="text-slate-500 text-2xs leading-relaxed">
            {demo ? 'Local simulation only' : 'Local — queued for backend'}
          </div>
        </div>
      </div>
      <div className="p-2 bg-slate-900/40 border border-slate-800/40 rounded-lg text-2xs text-slate-600 leading-relaxed">
        Demo Mode shows the product. Live Mode runs the product when a backend such as Supabase, Firebase, AWS/custom, or another suitable system is connected.
      </div>
      <SyncNowButton />
    </div>
  )
}

// ─── Root BvOperations panel ──────────────────────────────────
export default memo(function BvOperations() {
  const vehicles    = useVehicleStore(s => s.vehicles)
  const routePlans  = useRouteStore(s => s.routePlans)

  return (
    <div className="space-y-4">
      {/* Advisory */}
      <div className="p-3 bg-[#0a0700] border border-[#b8860b]/15 rounded-xl text-2xs text-slate-600 leading-relaxed">
        <span className="text-[#d4a017] font-semibold">Big V's Best Routes™</span> provides advisory route, GPS, and compliance support only. The driver remains responsible for safe and legal driving, checking live road signs, restrictions, road conditions, and professional judgement.
      </div>

      <SyncSummaryRow />
      <AssignmentsPanel vehicles={vehicles} routePlans={routePlans} />
      <TripSessionsPanel vehicles={vehicles} routePlans={routePlans} />
      <DriverReportsPanel vehicles={vehicles} routePlans={routePlans} />
    </div>
  )
})

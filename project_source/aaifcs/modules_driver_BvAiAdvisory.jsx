/**
 * ============================================================
 * Big V's Best Routes™ — Driver PWA AI Advisory Panel
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 * Run 7 — Compact Driver-Facing Advisory Panel
 *
 * Mobile-first. Shows only essential active warnings.
 * Uses expandable details. Large touch-safe controls.
 * Advisory only — no driving decisions made by AI.
 * ============================================================
 */

import { useState, useCallback, memo } from 'react'
import Icon from './components_ui_Icon'
import {
  useVehicleStore, useRouteStore,
  useAssignmentStore, useTripSessionStore,
  useDriverReportStore, useAiAdvisoryStore, useNavStore,
  useSyncQueueStore, useAuditStore,
} from './core_storage'
import {
  runFullAdvisoryReview,
  AI_SEVERITY, AI_REVIEW_STATUS,
} from './services_ai_bvAdvisoryEngine'

// ─── Helpers ─────────────────────────────────────────────────
const isDemoMode = () => {
  try { return JSON.parse(localStorage.getItem('apex:ai:config') || '{}').demoMode !== false }
  catch { return true }
}
const fmtTime = (iso) => {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) }
  catch { return iso }
}

const RISK_COLOR = {
  [AI_REVIEW_STATUS.CLEAR]:             'text-emerald-400',
  [AI_REVIEW_STATUS.ADVISORY]:          'text-cyan-400',
  [AI_REVIEW_STATUS.CAUTION]:           'text-amber-400',
  [AI_REVIEW_STATUS.HIGH_REVIEW]:       'text-amber-300',
  [AI_REVIEW_STATUS.CRITICAL_REVIEW]:   'text-red-400',
  [AI_REVIEW_STATUS.INSUFFICIENT_DATA]: 'text-slate-500',
}

const RISK_LABEL = {
  [AI_REVIEW_STATUS.CLEAR]:             'Clear',
  [AI_REVIEW_STATUS.ADVISORY]:          'Advisory',
  [AI_REVIEW_STATUS.CAUTION]:           'Caution',
  [AI_REVIEW_STATUS.HIGH_REVIEW]:       'High Review Needed',
  [AI_REVIEW_STATUS.CRITICAL_REVIEW]:   'Critical Review Required',
  [AI_REVIEW_STATUS.INSUFFICIENT_DATA]: 'Insufficient Data',
}

const SEV_ICON = {
  critical: { icon: 'XCircle',       color: 'text-red-400'   },
  high:     { icon: 'AlertTriangle', color: 'text-amber-300' },
  caution:  { icon: 'AlertTriangle', color: 'text-amber-400' },
  info:     { icon: 'Info',          color: 'text-slate-500' },
}

// ─── Compact finding pill ─────────────────────────────────────
function FindingPill({ finding, onExpand }) {
  const si = SEV_ICON[finding.severity] || SEV_ICON.info
  return (
    <button onClick={onExpand}
      className={`w-full flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
        finding.severity === 'critical' ? 'bg-red-950/40 border-red-700/50' :
        finding.severity === 'high'     ? 'bg-amber-950/30 border-amber-600/40' :
        finding.severity === 'caution'  ? 'bg-amber-950/15 border-amber-700/25' :
                                          'bg-slate-900/40 border-slate-800/40'
      }`}>
      <Icon name={si.icon} size={14} className={`${si.color} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold leading-snug ${si.color}`}>{finding.title}</p>
        {finding.requiresHumanReview && (
          <p className="text-2xs text-slate-600 mt-0.5">Human review required</p>
        )}
      </div>
      <Icon name="ChevronRight" size={12} className="text-slate-700 flex-shrink-0" />
    </button>
  )
}

// ─── Finding detail sheet ─────────────────────────────────────
function FindingDetail({ finding, onClose }) {
  const si = SEV_ICON[finding.severity] || SEV_ICON.info
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-4">
      <div className="bg-[#07080d] border border-violet-500/20 rounded-xl w-full max-w-md max-h-[75vh] overflow-y-auto">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-violet-500/15">
          <Icon name={si.icon} size={14} className={`${si.color} flex-shrink-0`} />
          <span className={`text-sm font-bold flex-1 ${si.color}`}>{finding.title}</span>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1">
            <Icon name="X" size={16} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-slate-400 leading-relaxed">{finding.explanation}</p>
          <div className="p-3 bg-slate-900/60 border border-slate-800/50 rounded-xl">
            <p className="text-2xs text-slate-600 font-semibold mb-1">Recommended action</p>
            <p className="text-sm text-slate-300 leading-relaxed">{finding.recommendedAction}</p>
          </div>
          {finding.requiresHumanReview && (
            <div className="flex items-start gap-2 p-2.5 bg-amber-950/20 border border-amber-700/20 rounded-lg">
              <Icon name="User" size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-2xs text-amber-400/80 leading-relaxed">
                AI recommendations require human review before driving or acting on them.
              </p>
            </div>
          )}
          <div className="flex items-start gap-2 p-2.5 bg-[#0a0700] border border-[#b8860b]/15 rounded-lg">
            <Icon name="AlertTriangle" size={11} className="text-[#b8860b] flex-shrink-0 mt-0.5" />
            <p className="text-2xs text-slate-700 leading-relaxed">
              If there is any doubt about route legality, vehicle suitability, or live conditions, stop safely and verify through official sources.
            </p>
          </div>
          <button onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-sm font-bold transition-all">
            Understood
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Refresh AI advisory ──────────────────────────────────────
function RefreshButton({ onComplete }) {
  const [running, setRunning] = useState(false)

  const handleRun = useCallback(async () => {
    setRunning(true)
    await new Promise(r => setTimeout(r, 500))

    const vehicles    = useVehicleStore.getState().vehicles
    const activeVehId = useVehicleStore.getState().activeVehicleId
    const vehicle     = vehicles.find(v => v.id === activeVehId) || vehicles[0] || null
    const routePlans  = useRouteStore.getState().routePlans
    const activeRtId  = useRouteStore.getState().activeRouteId
    const routePlan   = routePlans.find(r => r.id === activeRtId) || routePlans[0] || null
    const assignments = useAssignmentStore.getState().assignments
    const assignment  = assignments.find(a => a.status === 'inProgress' || a.status === 'assigned' || a.status === 'received') || null
    const sessions    = useTripSessionStore.getState().sessions
    const tripSession = sessions.find(s => s.status === 'active') || sessions[sessions.length - 1] || null
    const navSession  = useNavStore.getState().session
    const reports     = useDriverReportStore.getState().reports
    const auditEvents = useAuditStore.getState().events
    const syncQueue   = useSyncQueueStore.getState().queue
    const demo        = isDemoMode()

    runFullAdvisoryReview({
      vehicle, routePlan, assignment, navSession, tripSession,
      reports, auditEvents, syncQueue,
      gpsState: navSession?.gpsStatus || 'idle',
      isOnline: navigator.onLine,
      isDemoMode: demo,
      backendConfigured: false,
    })

    setRunning(false)
    onComplete?.()
  }, [onComplete])

  return (
    <button onClick={handleRun} disabled={running}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
        running ? 'bg-slate-800 text-slate-600 cursor-wait' : 'bg-violet-700/70 hover:bg-violet-700 text-white'
      }`}>
      <Icon name={running ? 'Loader' : 'Cpu'} size={11} className={running ? 'animate-spin' : ''} />
      {running ? '…' : 'Refresh'}
    </button>
  )
}

// ─── Root compact advisory panel ─────────────────────────────
export default memo(function BvAiAdvisory({ gpsState = 'idle', isOnline = true }) {
  const { advisory, findings } = useAiAdvisoryStore()
  const [selectedFinding, setSelectedFinding] = useState(null)
  const [expanded,        setExpanded]        = useState(false)
  const [refreshKey,      setRefreshKey]      = useState(0)
  const demo = isDemoMode()

  // Prioritise: critical > high > caution (skip info on collapsed view)
  const openFindings   = findings.filter(f => f.resolvedStatus === 'open')
  const criticals      = openFindings.filter(f => f.severity === 'critical')
  const highs          = openFindings.filter(f => f.severity === 'high')
  const cautions       = openFindings.filter(f => f.severity === 'caution')
  const urgentFindings = [...criticals, ...highs]
  const visibleDefault = urgentFindings.slice(0, 3) // show top 3 urgent by default
  const totalOpen      = openFindings.length

  const riskColor = advisory ? (RISK_COLOR[advisory.overallRisk] || 'text-slate-500') : 'text-slate-500'
  const riskLabel = advisory ? (RISK_LABEL[advisory.overallRisk] || 'No review run') : 'No review run'

  return (
    <div className="bg-[#07080d] border border-violet-500/20 rounded-xl overflow-hidden">
      {selectedFinding && (
        <FindingDetail finding={selectedFinding} onClose={() => setSelectedFinding(null)} />
      )}

      {/* Header strip */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-violet-500/15">
        <Icon name="Cpu" size={12} className="text-violet-400 flex-shrink-0" />
        <span className="text-xs font-bold text-violet-300 flex-1">4P3X Intelligent AI™ Driver Safety Advisory</span>
        <RefreshButton onComplete={() => setRefreshKey(k => k + 1)} />
      </div>

      {/* Summary strip */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-800/40">
        <div className={`text-xs font-bold ${riskColor}`}>{riskLabel}</div>
        {advisory?.lastRunAt && (
          <span className="text-2xs text-slate-700 ml-auto">{fmtTime(advisory.lastRunAt)}</span>
        )}
        {demo && (
          <span className="text-2xs text-violet-400/60 border border-violet-500/15 px-1.5 py-0.5 rounded">Demo</span>
        )}
      </div>

      {/* Score pills */}
      {advisory && (
        <div className="flex gap-2 px-3 py-2 border-b border-slate-800/30">
          {[
            { label: 'Vehicle', score: advisory.vehicleSuitabilityScore   },
            { label: 'Route',   score: advisory.routeSafetyScore          },
            { label: 'Evidence',score: advisory.evidenceCompletenessScore },
          ].map(({ label, score }) => (
            <div key={label} className="flex-1 flex items-center justify-between bg-slate-900/50 border border-slate-800/50 rounded-lg px-2 py-1.5">
              <span className="text-2xs text-slate-600">{label}</span>
              <span className={`text-2xs font-bold font-mono ${
                score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
              }`}>{score ?? '—'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Key warnings */}
      <div className="p-3 space-y-2">
        {!advisory ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Icon name="Cpu" size={20} className="text-slate-700" />
            <p className="text-xs text-slate-600">No advisory review run yet.</p>
            <p className="text-2xs text-slate-700 max-w-[200px] leading-relaxed">
              Press Refresh to run the 4P3X AI advisory check.
            </p>
          </div>
        ) : visibleDefault.length === 0 && totalOpen === 0 ? (
          <div className="flex items-center gap-2 py-2">
            <Icon name="CheckCircle" size={14} className="text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-emerald-400/80">No urgent findings. Advisory review looks clear.</p>
          </div>
        ) : (
          <>
            {visibleDefault.map(f => (
              <FindingPill key={f.findingId} finding={f} onExpand={() => setSelectedFinding(f)} />
            ))}
            {!expanded && cautions.length > 0 && urgentFindings.length === 0 && (
              <FindingPill finding={cautions[0]} onExpand={() => setSelectedFinding(cautions[0])} />
            )}
          </>
        )}

        {/* Expand / collapse all */}
        {totalOpen > visibleDefault.length && (
          <button onClick={() => setExpanded(v => !v)}
            className="w-full text-2xs text-violet-400/70 hover:text-violet-400 flex items-center justify-center gap-1.5 py-2 transition-colors">
            <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={11} />
            {expanded ? 'Show fewer' : `Show all ${totalOpen} advisory findings`}
          </button>
        )}
        {expanded && (
          <div className="space-y-2">
            {openFindings.slice(visibleDefault.length).map(f => (
              <FindingPill key={f.findingId} finding={f} onExpand={() => setSelectedFinding(f)} />
            ))}
          </div>
        )}

        {/* Mandatory advisory footer */}
        <div className="pt-1 pb-0">
          <p className="text-2xs text-slate-700 leading-relaxed">
            Advisory only. The driver remains responsible for safe and legal driving, live road signs, and professional judgement.
          </p>
        </div>
      </div>
    </div>
  )
})

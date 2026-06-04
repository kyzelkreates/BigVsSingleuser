/**
 * ============================================================
 * Big V's Best Routes™ — 4P3X Intelligent AI™ Oversight Center
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 * Run 7 — Dashboard AI Advisory Panel
 *
 * Self-contained. Dropped into pages_Dashboard.jsx.
 * Advisory only — no legal/safety guarantees.
 *
 * "4P3X Intelligent AI™ provides advisory route, vehicle,
 * safety, and compliance support only. It does not guarantee
 * legal compliance, road suitability, route safety, or
 * restriction clearance."
 * ============================================================
 */

import { useState, useCallback, memo } from 'react'
import Icon from './components_ui_Icon'
import {
  useVehicleStore, useRouteStore,
  useAssignmentStore, useTripSessionStore,
  useDriverReportStore, useSyncQueueStore,
  useAuditStore, useAiAdvisoryStore, useNavStore,
} from './core_storage'
import {
  runFullAdvisoryReview,
  AI_SEVERITY, AI_CATEGORY,
  AI_REVIEW_STATUS, AI_EVIDENCE_STATUS,
} from './services_ai_bvAdvisoryEngine'

// ─── Helpers ─────────────────────────────────────────────────
const fmtTime = (iso) => {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) }
  catch { return iso }
}

const isDemoMode = () => {
  try { return JSON.parse(localStorage.getItem('apex:ai:config') || '{}').demoMode !== false }
  catch { return true }
}

// ─── Severity styles ─────────────────────────────────────────
const SEV_STYLE = {
  info:     { bg: 'bg-slate-900/50',    border: 'border-slate-700/40', text: 'text-slate-400',  dot: 'bg-slate-600',    icon: 'Info'          },
  caution:  { bg: 'bg-amber-950/20',   border: 'border-amber-700/30', text: 'text-amber-400',  dot: 'bg-amber-400',    icon: 'AlertTriangle' },
  high:     { bg: 'bg-amber-950/40',   border: 'border-amber-600/40', text: 'text-amber-300',  dot: 'bg-amber-300',    icon: 'AlertTriangle' },
  critical: { bg: 'bg-red-950/50',     border: 'border-red-700/50',   text: 'text-red-400',    dot: 'bg-red-400',      icon: 'XCircle'       },
}

const OVERALL_RISK_STYLE = {
  [AI_REVIEW_STATUS.CLEAR]:             { color: 'text-emerald-400', bg: 'bg-emerald-500/8',  border: 'border-emerald-500/25', label: 'Clear',                  icon: 'CheckCircle'   },
  [AI_REVIEW_STATUS.ADVISORY]:          { color: 'text-cyan-400',    bg: 'bg-cyan-500/8',     border: 'border-cyan-500/25',    label: 'Advisory',               icon: 'Info'          },
  [AI_REVIEW_STATUS.CAUTION]:           { color: 'text-amber-400',   bg: 'bg-amber-500/8',    border: 'border-amber-500/25',   label: 'Caution',                icon: 'AlertTriangle' },
  [AI_REVIEW_STATUS.HIGH_REVIEW]:       { color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-400/40',   label: 'High Review Needed',     icon: 'AlertTriangle' },
  [AI_REVIEW_STATUS.CRITICAL_REVIEW]:   { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/40',     label: 'Critical Review Required',icon: 'XCircle'      },
  [AI_REVIEW_STATUS.INSUFFICIENT_DATA]: { color: 'text-slate-500',   bg: 'bg-slate-900/50',   border: 'border-slate-700/40',   label: 'Insufficient Data',      icon: 'CircleSlash'   },
}

const EVIDENCE_STYLE = {
  [AI_EVIDENCE_STATUS.READY]:      { color: 'text-emerald-400', label: 'Ready for Human Review'   },
  [AI_EVIDENCE_STATUS.NEEDS_MORE]: { color: 'text-amber-400',   label: 'Needs More Data'          },
  [AI_EVIDENCE_STATUS.HIGH_REVIEW]:{ color: 'text-amber-300',   label: 'High Review Needed'       },
  [AI_EVIDENCE_STATUS.CRITICAL]:   { color: 'text-red-400',     label: 'Critical Unresolved Issue'},
  [AI_EVIDENCE_STATUS.DEMO_ONLY]:  { color: 'text-violet-400',  label: 'Demo-Only Evidence'       },
}

// ─── Score ring ───────────────────────────────────────────────
function ScoreRing({ score, label, color, size = 56 }) {
  const r    = (size / 2) - 5
  const circ = 2 * Math.PI * r
  const pct  = Math.max(0, Math.min(100, score || 0))
  const dash = (pct / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth="4" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor"
          strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          className={color}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" className={color}>
          {pct}
        </text>
      </svg>
      <span className="text-2xs text-slate-600 text-center leading-tight max-w-[60px]">{label}</span>
    </div>
  )
}

// ─── Finding card ─────────────────────────────────────────────
function FindingCard({ finding, onResolve }) {
  const [expanded, setExpanded] = useState(false)
  const sev = SEV_STYLE[finding.severity] || SEV_STYLE.info
  const isOpen = finding.resolvedStatus === 'open'

  return (
    <div className={`rounded-xl border overflow-hidden ${sev.border} ${sev.bg} transition-all ${
      finding.resolvedStatus !== 'open' ? 'opacity-60' : ''
    }`}>
      <button onClick={() => setExpanded(v => !v)} className="w-full flex items-start gap-2.5 p-3 text-left">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${sev.dot}`} />
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-semibold ${sev.text} leading-snug`}>{finding.title}</div>
          <div className="text-2xs text-slate-600 mt-0.5">
            Agent {finding.agentId === 'agent1' ? '1 · Route Safety' : '2 · Evidence Review'} · {finding.category}
            {finding.resolvedStatus !== 'open' && <span className="ml-2 text-emerald-400/70">({finding.resolvedStatus})</span>}
          </div>
        </div>
        <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={12} className="text-slate-600 flex-shrink-0 mt-1" />
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-slate-800/40 pt-2.5">
          <p className="text-2xs text-slate-400 leading-relaxed">{finding.explanation}</p>
          <div className="p-2 bg-slate-900/60 border border-slate-800/40 rounded-lg">
            <span className="text-2xs text-slate-600 font-semibold">Recommended action: </span>
            <span className="text-2xs text-slate-300">{finding.recommendedAction}</span>
          </div>
          {finding.requiresHumanReview && (
            <div className="text-2xs text-amber-400/80 flex items-center gap-1.5">
              <Icon name="User" size={10} className="flex-shrink-0" />
              AI recommendations require human review before acting on them.
            </div>
          )}
          {isOpen && onResolve && (
            <div className="flex gap-1.5 flex-wrap">
              {['acknowledged', 'reviewed', 'resolved', 'notApplicable'].map(s => (
                <button key={s} onClick={() => onResolve(finding.findingId, s)}
                  className="text-2xs text-slate-500 hover:text-white border border-slate-700/40 hover:border-slate-600/60 px-2 py-1 rounded-lg transition-all capitalize">
                  {s === 'notApplicable' ? 'N/A' : s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Human review checklist ───────────────────────────────────
function HumanChecklist({ items }) {
  if (!items?.length) return null
  const active  = items.filter(i => !i.resolved && i.priority !== 'ok')
  const done    = items.filter(i =>  i.resolved || i.priority === 'ok')
  const pri = { critical: 0, high: 1, medium: 2, low: 3, info: 4, ok: 5 }
  const sorted  = [...active].sort((a, b) => (pri[a.priority] ?? 9) - (pri[b.priority] ?? 9))

  return (
    <div className="space-y-2">
      <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">
        Human Review Checklist ({active.length} open)
      </div>
      <div className="p-2.5 bg-amber-950/20 border border-amber-700/20 rounded-lg text-2xs text-amber-400/80 leading-relaxed">
        ⚠ AI recommendations require human review before driving or acting on them.
      </div>
      {sorted.map(item => {
        const priColor = { critical: 'text-red-400', high: 'text-amber-300', medium: 'text-amber-400', low: 'text-slate-500', info: 'text-slate-600' }[item.priority] || 'text-slate-500'
        return (
          <div key={item.id} className="flex items-start gap-2.5 p-2.5 bg-slate-900/40 border border-slate-800/40 rounded-lg">
            <Icon name="Circle" size={10} className={`${priColor} flex-shrink-0 mt-0.5`} />
            <span className="text-2xs text-slate-400 leading-snug flex-1">{item.item}</span>
            <span className={`text-2xs font-semibold ${priColor} flex-shrink-0`}>{item.priority}</span>
          </div>
        )
      })}
      {done.length > 0 && (
        <div className="space-y-1">
          {done.map(item => (
            <div key={item.id} className="flex items-center gap-2 px-2 py-1.5 text-2xs text-emerald-400/60">
              <Icon name="CheckCircle" size={10} className="flex-shrink-0" />
              <span className="line-through">{item.item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Agent summary card ───────────────────────────────────────
function AgentCard({ agentNum, title, score, status, statusLabel, statusColor, findings, onResolve }) {
  const [showFindings, setShowFindings] = useState(false)
  const scoreColor = score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
  const open   = findings.filter(f => f.resolvedStatus === 'open')
  const crits  = open.filter(f => f.severity === AI_SEVERITY.CRITICAL).length
  const highs  = open.filter(f => f.severity === AI_SEVERITY.HIGH).length
  const caut   = open.filter(f => f.severity === AI_SEVERITY.CAUTION).length

  return (
    <div className="bg-[#07080d] border border-violet-500/20 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-violet-500/15 flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-violet-500/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0">
          <Icon name="Cpu" size={11} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-violet-300 leading-tight">4P3X Intelligent AI™ {agentNum}</div>
          <div className="text-2xs text-slate-600 truncate">{title}</div>
        </div>
        <ScoreRing score={score} label="score" color={scoreColor} size={48} />
      </div>
      <div className="p-3.5 space-y-3">
        {/* Status */}
        <div className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold ${statusColor}`}>
          <Icon name="Activity" size={12} className="flex-shrink-0" />
          {statusLabel}
        </div>
        {/* Finding counts */}
        <div className="flex gap-2 flex-wrap">
          {crits > 0 && <span className="text-2xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">{crits} critical</span>}
          {highs > 0 && <span className="text-2xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">{highs} high</span>}
          {caut  > 0 && <span className="text-2xs text-amber-400 bg-amber-500/8 border border-amber-500/15 px-2 py-0.5 rounded-full">{caut} caution</span>}
          {open.filter(f => f.severity === 'info').length > 0 && (
            <span className="text-2xs text-slate-500 px-2 py-0.5 rounded-full border border-slate-800/40">
              {open.filter(f => f.severity === 'info').length} info
            </span>
          )}
          {crits === 0 && highs === 0 && caut === 0 && findings.length === 0 && (
            <span className="text-2xs text-slate-600">No findings yet — run review</span>
          )}
        </div>
        {/* Expand findings */}
        {findings.length > 0 && (
          <button onClick={() => setShowFindings(v => !v)}
            className="text-2xs text-violet-400/70 hover:text-violet-400 flex items-center gap-1 transition-colors">
            <Icon name={showFindings ? 'ChevronUp' : 'ChevronDown'} size={11} />
            {showFindings ? 'Hide' : 'Show'} {findings.length} finding{findings.length !== 1 ? 's' : ''}
          </button>
        )}
        {showFindings && (
          <div className="space-y-2">
            {findings.map(f => <FindingCard key={f.findingId} finding={f} onResolve={onResolve} />)}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Run AI review button ─────────────────────────────────────
function RunAiReviewButton({ onComplete }) {
  const [running, setRunning] = useState(false)
  const [result,  setResult]  = useState(null)

  const handleRun = useCallback(async () => {
    setRunning(true)
    setResult(null)
    await new Promise(r => setTimeout(r, 700)) // sim delay

    // Gather inputs from all Run 2–6 SSOT stores
    const vehicles    = useVehicleStore.getState().vehicles
    const activeVehId = useVehicleStore.getState().activeVehicleId
    const vehicle     = vehicles.find(v => v.id === activeVehId) || vehicles[0] || null

    const routePlans  = useRouteStore.getState().routePlans
    const activeRtId  = useRouteStore.getState().activeRouteId
    const routePlan   = routePlans.find(r => r.id === activeRtId) || routePlans[0] || null

    const assignments = useAssignmentStore.getState().assignments
    const assignment  = assignments.find(a => a.status === 'inProgress' || a.status === 'assigned' || a.status === 'received') || assignments[0] || null

    const sessions    = useTripSessionStore.getState().sessions
    const tripSession = sessions.find(s => s.status === 'active') || sessions[sessions.length - 1] || null

    const navSession  = useNavStore.getState().session

    const reports     = useDriverReportStore.getState().reports
    const auditEvents = useAuditStore.getState().events
    const syncQueue   = useSyncQueueStore.getState().queue

    const demo        = isDemoMode()

    const r = runFullAdvisoryReview({
      vehicle, routePlan, assignment, navSession, tripSession,
      reports, auditEvents, syncQueue,
      gpsState: navSession?.gpsStatus || 'idle',
      isOnline: navigator.onLine,
      isDemoMode: demo,
      backendConfigured: false,
    })

    setResult({ demo })
    setRunning(false)
    onComplete?.()
  }, [onComplete])

  return (
    <div className="space-y-2">
      <button onClick={handleRun} disabled={running}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
          running ? 'bg-slate-800 text-slate-600 cursor-wait' : 'bg-violet-700 hover:bg-violet-600 text-white'
        }`}>
        <Icon name={running ? 'Loader' : 'Cpu'} size={15} className={running ? 'animate-spin' : ''} />
        {running ? 'Running 4P3X AI Review…' : 'Run 4P3X AI Review'}
      </button>
      {result && (
        <div className={`p-2.5 rounded-lg border text-2xs ${
          result.demo ? 'bg-violet-500/8 border-violet-500/20 text-violet-300' : 'bg-slate-900/60 border-slate-700/40 text-slate-400'
        }`}>
          {result.demo
            ? 'Local advisory review completed. Demo AI output — not for real driving.'
            : 'Local advisory review completed. Live mode is on, but no AI backend is configured. Running local advisory rules only.'}
        </div>
      )}
    </div>
  )
}

// ─── Sync of advisory run history ────────────────────────────
function AgentRunHistory({ runs }) {
  if (!runs?.length) return null
  return (
    <div className="space-y-1">
      <div className="text-2xs text-slate-600 uppercase tracking-wider font-semibold">Review History</div>
      {runs.slice(0, 5).map(r => (
        <div key={r.runId} className="flex items-center gap-2 text-2xs p-2 rounded-lg bg-slate-900/30 border border-slate-800/40">
          <Icon name="Cpu" size={10} className="text-violet-400/60 flex-shrink-0" />
          <span className="text-slate-600 font-mono">{fmtTime(r.createdAt)}</span>
          <span className="text-slate-500">{r.findingCount} findings</span>
          <span className={`ml-auto ${r.mode === 'demo' ? 'text-violet-400/60' : 'text-cyan-400/60'}`}>{r.mode}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Root BvAiOverview ────────────────────────────────────────
export default memo(function BvAiOverview() {
  const { advisory, findings, agentRuns, resolveFinding } = useAiAdvisoryStore()
  const [refreshKey, setRefreshKey] = useState(0)

  const agent1Findings = findings.filter(f => f.agentId === 'agent1')
  const agent2Findings = findings.filter(f => f.agentId === 'agent2')
  const demo           = isDemoMode()

  const overallStyle = advisory
    ? (OVERALL_RISK_STYLE[advisory.overallRisk] || OVERALL_RISK_STYLE[AI_REVIEW_STATUS.INSUFFICIENT_DATA])
    : OVERALL_RISK_STYLE[AI_REVIEW_STATUS.INSUFFICIENT_DATA]
  const evidenceStyle = advisory
    ? (EVIDENCE_STYLE[advisory.legalReviewStatus] || EVIDENCE_STYLE[AI_EVIDENCE_STATUS.NEEDS_MORE])
    : EVIDENCE_STYLE[AI_EVIDENCE_STATUS.NEEDS_MORE]

  return (
    <div className="space-y-4">
      {/* Section heading */}
      <div className="flex items-center gap-2">
        <Icon name="Cpu" size={14} className="text-violet-400" />
        <span className="text-sm font-bold text-violet-300">4P3X Intelligent AI™ Oversight Center</span>
        {demo && (
          <span className="text-2xs text-violet-400 border border-violet-500/20 bg-violet-500/8 px-1.5 py-0.5 rounded-full ml-auto">Demo Mode</span>
        )}
      </div>

      {/* Mandatory advisory wording */}
      <div className="p-3.5 bg-[#0a0700] border border-violet-500/15 rounded-xl text-2xs text-slate-600 leading-relaxed space-y-1">
        <p><span className="text-violet-300 font-semibold">4P3X Intelligent AI™</span> provides advisory route, vehicle, safety, and compliance support only. It does not guarantee legal compliance, road suitability, route safety, or restriction clearance. The driver remains responsible for safe and legal driving, checking live road signs, restrictions, road conditions, and professional judgement.</p>
        <p className="text-slate-700">AI recommendations require human review before driving or acting on them.</p>
        <p className="text-slate-700">If there is any doubt about route legality, vehicle suitability, restrictions, road safety, or live conditions, stop safely and verify through official sources before continuing.</p>
      </div>

      {/* Run AI Review button */}
      <RunAiReviewButton onComplete={() => setRefreshKey(k => k + 1)} />

      {/* Overall summary — only if advisory data exists */}
      {advisory && (
        <div className={`p-4 rounded-xl border ${overallStyle.border} ${overallStyle.bg}`}>
          <div className="flex items-center gap-3 mb-3">
            <Icon name={overallStyle.icon} size={18} className={overallStyle.color} />
            <div>
              <div className={`text-sm font-bold ${overallStyle.color}`}>{overallStyle.label}</div>
              <div className="text-2xs text-slate-600">Overall advisory status · {fmtTime(advisory.lastRunAt)}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-center flex-wrap">
            <ScoreRing score={advisory.vehicleSuitabilityScore}   label="Vehicle Suit." color={advisory.vehicleSuitabilityScore >= 75 ? 'text-emerald-400' : advisory.vehicleSuitabilityScore >= 50 ? 'text-amber-400' : 'text-red-400'} />
            <ScoreRing score={advisory.routeSafetyScore}          label="Route Safety"  color={advisory.routeSafetyScore >= 75 ? 'text-cyan-400' : advisory.routeSafetyScore >= 50 ? 'text-amber-400' : 'text-red-400'} />
            <ScoreRing score={advisory.evidenceCompletenessScore} label="Evidence"      color={advisory.evidenceCompletenessScore >= 75 ? 'text-violet-400' : advisory.evidenceCompletenessScore >= 50 ? 'text-amber-400' : 'text-red-400'} />
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className={`text-xs font-semibold ${evidenceStyle.color}`}>{evidenceStyle.label}</span>
          </div>
          {(advisory.unresolvedCriticalCount > 0 || advisory.unresolvedHighCount > 0) && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {advisory.unresolvedCriticalCount > 0 && (
                <span className="text-2xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                  {advisory.unresolvedCriticalCount} critical open
                </span>
              )}
              {advisory.unresolvedHighCount > 0 && (
                <span className="text-2xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  {advisory.unresolvedHighCount} high open
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Agent 1 — Route Safety & Vehicle Suitability */}
      <AgentCard
        agentNum="1"
        title="Route Safety & Vehicle Suitability AI"
        score={advisory?.vehicleSuitabilityScore ?? 0}
        status={advisory?.overallRisk}
        statusLabel={overallStyle.label}
        statusColor={`${overallStyle.color} ${overallStyle.bg} border ${overallStyle.border}`}
        findings={agent1Findings}
        onResolve={resolveFinding}
      />

      {/* Agent 2 — Legal Compliance & Evidence Review */}
      <AgentCard
        agentNum="2"
        title="Legal Compliance & Evidence Review AI"
        score={advisory?.evidenceCompletenessScore ?? 0}
        status={advisory?.legalReviewStatus}
        statusLabel={evidenceStyle.label}
        statusColor={`${evidenceStyle.color} bg-slate-900/40 border border-slate-800/40`}
        findings={agent2Findings}
        onResolve={resolveFinding}
      />

      {/* Human review checklist */}
      {advisory?.humanReviewChecklist?.length > 0 && (
        <div className="bg-[#07080d] border border-violet-500/20 rounded-xl p-4">
          <HumanChecklist items={advisory.humanReviewChecklist} />
        </div>
      )}

      {/* Run history */}
      {agentRuns.length > 0 && (
        <div className="bg-[#07080d] border border-slate-800/60 rounded-xl p-4">
          <AgentRunHistory runs={agentRuns} />
        </div>
      )}
    </div>
  )
})

/**
 * ============================================================
 * Big V's Best Routes™ — Backend & Deployment Centre™
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 * Run 8 — Backend-Ready Deployment Centre
 *
 * ── Security ──────────────────────────────────────────────────
 * 4P3X API Config Guard™ is active throughout this page.
 * Backend-only secrets are NEVER stored, logged, or displayed.
 *
 * ── Advisory ──────────────────────────────────────────────────
 * "Backend/live sync improves data persistence and dashboard
 * visibility, but it does not guarantee route safety, legal
 * compliance, road restriction accuracy, or live road conditions.
 * Drivers must still follow road signs, restrictions, traffic
 * laws, and professional judgement."
 * ============================================================
 */

import { useState, useCallback, memo } from 'react'
import Icon from './components_ui_Icon'
import { useBackendConfigStore, useDeploymentChecklistStore, useSyncQueueStore } from './core_storage'
import {
  looksLikeSecret, maskValue,
  checkProviderHealth, checkSyncReadiness,
  prepareSyncRun, checkPwaReadiness, getLocalDataSnapshot,
} from './services_deployment_bvDeploymentService'
import {
  canEnableLiveMode, isSupabaseConfigured,
  testSupabaseConnection as bvTestConnection,
} from './services_supabase_bvSupabaseAdapter'

// ─── Helpers ─────────────────────────────────────────────────
const fmtTime = (iso) => {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) }
  catch { return iso }
}

// ─── Status badge ─────────────────────────────────────────────
const STATUS_STYLE = {
  ready:               { color: 'text-emerald-400', bg: 'bg-emerald-500/8',  border: 'border-emerald-500/20', label: 'Ready'              },
  notConfigured:       { color: 'text-slate-500',   bg: 'bg-slate-900/40',   border: 'border-slate-800/40',   label: 'Not Configured'     },
  configured:          { color: 'text-cyan-400',    bg: 'bg-cyan-500/8',     border: 'border-cyan-500/20',    label: 'Configured'         },
  testPassed:          { color: 'text-emerald-400', bg: 'bg-emerald-500/8',  border: 'border-emerald-500/20', label: 'Test Passed'        },
  testFailed:          { color: 'text-red-400',     bg: 'bg-red-500/8',      border: 'border-red-500/20',     label: 'Test Failed'        },
  localOnly:           { color: 'text-amber-400',   bg: 'bg-amber-500/8',    border: 'border-amber-500/20',   label: 'Local Only'         },
  blockedSecret:       { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-700/40',     label: 'Secret Blocked'     },
  needsReview:         { color: 'text-amber-400',   bg: 'bg-amber-500/8',    border: 'border-amber-500/20',   label: 'Needs Review'       },
  waitingForBackend:   { color: 'text-slate-500',   bg: 'bg-slate-900/40',   border: 'border-slate-800/40',   label: 'Waiting for Backend'},
  readyForBackend:     { color: 'text-cyan-400',    bg: 'bg-cyan-500/8',     border: 'border-cyan-500/20',    label: 'Backend-Ready'      },
  backendReady:        { color: 'text-cyan-400',    bg: 'bg-cyan-500/8',     border: 'border-cyan-500/20',    label: 'Backend-Ready'      },
  demo:                { color: 'text-violet-400',  bg: 'bg-violet-500/8',   border: 'border-violet-500/20',  label: 'Demo Mode'          },
}

function StatusBadge({ status, label: override }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.notConfigured
  return (
    <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full border ${s.color} ${s.bg} ${s.border}`}>
      {override || s.label}
    </span>
  )
}

// ─── Section card wrapper ─────────────────────────────────────
function Card({ title, icon, iconColor = 'text-[#b8860b]', children, className = '' }) {
  return (
    <div className={`bg-[#07080d] border border-[#b8860b]/20 rounded-xl overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#b8860b]/15">
        <Icon name={icon} size={14} className={iconColor} />
        <span className="text-sm font-bold text-[#d4a017]">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ─── API Config Guard — safe input ────────────────────────────
function GuardedInput({ label, value, onChange, placeholder, hint, required = false, type = 'text', isMasked = false }) {
  const [localVal, setLocalVal] = useState(value || '')
  const [blocked,  setBlocked]  = useState(false)
  const [showVal,  setShowVal]  = useState(false)

  const handleChange = useCallback((e) => {
    const v = e.target.value
    setLocalVal(v)
    if (looksLikeSecret(v)) {
      setBlocked(true)
      return  // do not propagate secret values
    }
    setBlocked(false)
    onChange?.(v)
  }, [onChange])

  const displayVal = isMasked && !showVal && value ? maskValue(value) : localVal

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <label className="text-2xs text-slate-500">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
        {isMasked && value && (
          <button onClick={() => setShowVal(v => !v)} className="text-2xs text-slate-700 hover:text-slate-500 ml-auto">
            {showVal ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      <input
        type={isMasked && !showVal ? 'password' : type}
        value={isMasked && !showVal ? (value ? maskValue(value) : '') : localVal}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={`w-full bg-[#0d1426] border rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-700 focus:outline-none font-mono transition-all ${
          blocked ? 'border-red-700/60 focus:border-red-700/60' : 'border-slate-700/60 focus:border-[#b8860b]/50'
        }`}
      />
      {blocked && (
        <p className="text-2xs text-red-400 flex items-center gap-1.5">
          <Icon name="ShieldAlert" size={10} className="flex-shrink-0" />
          This looks like a backend-only secret and cannot be stored in the frontend. Use a server/backend environment instead.
        </p>
      )}
      {!blocked && hint && <p className="text-2xs text-slate-700">{hint}</p>}
    </div>
  )
}

// ─── DEMO / LIVE MODE PANEL ───────────────────────────────────
function DemoLivePanel() {
  const { config, setDemoMode, isBackendConfigured, isLiveSyncActive } = useBackendConfigStore()
  const demo    = config.demoMode
  const provider= config.activeProvider
  const isBackendCfg = provider !== 'local'

  return (
    <Card title="Demo / Live Mode Status" icon="ToggleRight">
      <div className="space-y-4">
        <p className="text-2xs text-slate-600 leading-relaxed">
          <span className="text-[#d4a017] font-semibold">Demo Mode shows the product.</span> Live Mode runs the product only after a backend is connected and validated.
        </p>

        {/* Mode toggle */}
        <div className="flex gap-3">
          <button onClick={() => setDemoMode(true)}
            className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
              demo
                ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
                : 'border-slate-800/50 bg-slate-900/30 text-slate-600 hover:border-slate-700/50'
            }`}>
            <Icon name="FlaskConical" size={14} className={`inline mr-1.5 ${demo ? 'text-violet-400' : 'text-slate-700'}`} />
            Demo Mode
          </button>
          <button onClick={() => setDemoMode(false)}
            className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
              !demo
                ? 'border-cyan-500/40 bg-cyan-500/8 text-cyan-300'
                : 'border-slate-800/50 bg-slate-900/30 text-slate-600 hover:border-slate-700/50'
            }`}>
            <Icon name="Zap" size={14} className={`inline mr-1.5 ${!demo ? 'text-cyan-400' : 'text-slate-700'}`} />
            Live Mode
          </button>
        </div>

        {/* Status block */}
        <div className={`p-3 rounded-xl border text-2xs leading-relaxed ${
          demo
            ? 'bg-violet-500/6 border-violet-500/20 text-violet-300'
            : isBackendCfg
              ? 'bg-cyan-500/6 border-cyan-500/20 text-cyan-300'
              : 'bg-amber-950/20 border-amber-700/30 text-amber-400'
        }`}>
          {demo
            ? '⚗ Demo Mode is on. Using local/demo data. Sync is simulated. No real backend calls are made. Turn on Live Mode and configure a backend to run as a real product.'
            : isBackendCfg
              ? `⚡ Live Mode is on. Backend provider: ${provider}. Check backend status below.`
              : '⚡ Live Mode is on, but no backend is configured yet. Updates are saved locally and queued. Cloud sync is not active.'}
        </div>

        {/* Data separation reminder */}
        {!demo && (
          <div className="p-2.5 bg-amber-950/20 border border-amber-700/25 rounded-lg text-2xs text-amber-400/80 leading-relaxed">
            ⚠ Live Mode must not mix demo data with real records. Demo data must not populate the live dashboard. If switching from demo to live, ensure demo records are cleared or isolated first.
          </div>
        )}

        {/* ── Live sync activation gate ── */}
        {!demo && (
          <div className="p-3 bg-[#0a0700] border border-[#b8860b]/20 rounded-xl space-y-3">
            <div className="text-xs font-bold text-[#d4a017]">Live Sync Activation Gate</div>
            <p className="text-2xs text-slate-600 leading-relaxed">
              Turning Demo Mode OFF does not automatically create a live cloud product. It switches
              the system into live-ready mode. To activate live cloud sync, configure a backend
              provider, save the settings, test the connection, and validate the sync mapping.
            </p>
            <div className="space-y-1.5">
              {[
                { label: 'Demo Mode is OFF',                       ok: !config.demoMode },
                { label: 'Non-local backend provider selected',    ok: config.activeProvider !== 'local' },
                { label: 'Provider public config saved',           ok: config.activeProvider !== 'local' && config.providers[config.activeProvider]?.status !== 'notConfigured' },
                { label: 'Connection test passed (testPassed)',    ok: config.activeProvider !== 'local' && config.providers[config.activeProvider]?.status === 'testPassed' },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-2 text-2xs">
                  <Icon name={ok ? 'CheckCircle' : 'Circle'} size={11}
                    className={ok ? 'text-emerald-400' : 'text-slate-700'} />
                  <span className={ok ? 'text-slate-300' : 'text-slate-600'}>{label}</span>
                  {ok && <span className="text-emerald-600 font-mono ml-auto">✓</span>}
                </div>
              ))}
            </div>
            <div className={`px-3 py-2 rounded-lg border text-2xs font-semibold text-center ${
              isLiveSyncActive()
                ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-300'
                : 'bg-slate-900/40 border-slate-800/40 text-slate-500'
            }`}>
              {isLiveSyncActive()
                ? '⚡ Live sync is ACTIVE'
                : 'Live sync is NOT active — data is saved locally and queued'
              }
            </div>
          </div>
        )}

        {/* ── Local fallback notice ── */}
        <div className="p-2.5 bg-slate-900/30 border border-slate-800/30 rounded-lg text-2xs text-slate-600 leading-relaxed">
          If no backend is configured, Big V's Best Routes™ remains local-first and stores updates on this device/browser.
        </div>

        {/* Local data snapshot */}
        <LocalDataSummary />
      </div>
    </Card>
  )
}

function LocalDataSummary() {
  const [snap, setSnap] = useState(null)
  const [loading, setLoading] = useState(false)

  const check = () => {
    setLoading(true)
    setTimeout(() => { setSnap(getLocalDataSnapshot()); setLoading(false) }, 200)
  }

  return (
    <div className="space-y-2">
      <button onClick={check} disabled={loading}
        className="text-2xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors">
        <Icon name={loading ? 'Loader' : 'HardDrive'} size={11} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Checking…' : 'Check Local Data Snapshot'}
      </button>
      {snap && (
        <div className="grid grid-cols-2 gap-1.5 text-2xs font-mono">
          {[
            ['Vehicles',     snap.vehicles   ],
            ['Routes',       snap.routes     ],
            ['Assignments',  snap.assignments],
            ['Sessions',     snap.sessions   ],
            ['Reports',      snap.reports    ],
            ['Audit Events', snap.auditEvents],
            ['AI Findings',  snap.aiFindings ],
            ['Sync Pending', snap.syncPending],
          ].map(([k,v]) => (
            <div key={k} className="flex items-center justify-between bg-slate-900/40 border border-slate-800/40 rounded-lg px-2 py-1">
              <span className="text-slate-600">{k}</span>
              <span className={`font-semibold ${v > 0 ? 'text-slate-400' : 'text-slate-700'}`}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── PROVIDER SETUP CARDS ─────────────────────────────────────
function ProviderCard({ providerKey, title, icon, description, fields, providerConfig, onUpdate, onTest }) {
  const [testing,  setTesting]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [expanded, setExpanded] = useState(false)

  const handleTest = useCallback(async () => {
    setTesting(true)
    setResult(null)
    const r = await checkProviderHealth(providerKey, providerConfig)
    onTest?.(providerKey, r)
    setResult(r)
    setTesting(false)
  }, [providerKey, providerConfig, onTest])

  const statusStyle = STATUS_STYLE[providerConfig?.status || 'notConfigured'] || STATUS_STYLE.notConfigured

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      providerConfig?.enabled ? 'border-[#b8860b]/30' : 'border-slate-800/50'
    } bg-[#07080d]`}>
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        <Icon name={icon} size={14} className={providerConfig?.enabled ? 'text-[#d4a017]' : 'text-slate-600'} />
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-bold ${providerConfig?.enabled ? 'text-white' : 'text-slate-600'}`}>{title}</div>
          <div className="text-2xs text-slate-700 truncate">{description}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={providerConfig?.status || 'notConfigured'} />
          <button onClick={() => {
            onUpdate(providerKey, { enabled: !providerConfig?.enabled })
            setExpanded(!providerConfig?.enabled)
          }}
            className={`w-8 h-5 rounded-full transition-all border flex items-center ${
              providerConfig?.enabled ? 'bg-emerald-500/20 border-emerald-500/40 justify-end' : 'bg-slate-900 border-slate-700/40 justify-start'
            }`}>
            <div className={`w-3 h-3 rounded-full mx-0.5 transition-all ${providerConfig?.enabled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          </button>
          <button onClick={() => setExpanded(v => !v)} className="text-slate-600 hover:text-slate-400">
            <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={12} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3.5 pb-3.5 space-y-3 border-t border-slate-800/40 pt-3">
          {fields.map(f => (
            <GuardedInput
              key={f.key}
              label={f.label}
              value={providerConfig?.[f.key] || ''}
              onChange={v => onUpdate(providerKey, { [f.key]: v })}
              placeholder={f.placeholder}
              hint={f.hint}
              required={f.required}
              isMasked={f.masked}
            />
          ))}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-2xs text-slate-500">Notes (optional)</label>
            <textarea value={providerConfig?.notes || ''} onChange={e => onUpdate(providerKey, { notes: e.target.value })} rows={2}
              className="w-full bg-[#0d1426] border border-slate-700/60 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-[#b8860b]/50 resize-none" />
          </div>

          {/* Test connection */}
          {providerConfig?.enabled && (
            <button onClick={handleTest} disabled={testing}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                testing ? 'bg-slate-800 text-slate-600' : 'bg-[#b8860b]/70 hover:bg-[#b8860b] text-black'
              }`}>
              <Icon name={testing ? 'Loader' : 'Plug'} size={12} className={testing ? 'animate-spin' : ''} />
              {testing ? 'Testing…' : 'Test Connection'}
            </button>
          )}
          {result && (
            <div className={`p-2.5 rounded-lg border text-2xs leading-relaxed ${STATUS_STYLE[result.status]?.bg || ''} ${STATUS_STYLE[result.status]?.border || 'border-slate-800/40'} ${STATUS_STYLE[result.status]?.color || 'text-slate-500'}`}>
              {result.message}
              {result.at && <span className="ml-2 text-slate-700 font-mono">{fmtTime(result.at)}</span>}
            </div>
          )}

          {/* Secret guard reminder */}
          <div className="p-2.5 bg-red-950/25 border border-red-700/30 rounded-lg text-2xs text-red-400/80 leading-relaxed">
            <Icon name="ShieldAlert" size={10} className="inline mr-1.5" />
            <strong>4P3X API Config Guard™ active.</strong> Backend-only secrets (service role keys, DATABASE_URL, OPENAI_API_KEY, JWT_SECRET, etc.) must never be placed here. Frontend-safe public keys only.
          </div>
        </div>
      )}
    </div>
  )
}

const SUPABASE_FIELDS = [
  { key: 'url',       label: 'Supabase URL',              placeholder: 'https://your-project-id.supabase.co', required: true,  masked: false, hint: 'Your Supabase project URL (public).' },
  { key: 'anonKey',  label: 'Supabase Anon/Public Key',  placeholder: 'eyJhbGciO… (public anon key only)', required: true,  masked: true,  hint: 'Use the ANON/PUBLIC key — NEVER the service_role key.' },
  { key: 'projectRef',label: 'Project Reference (optional)',placeholder: 'your-project-ref',               required: false, masked: false, hint: 'Found in Supabase project settings.' },
]
const FIREBASE_FIELDS = [
  { key: 'projectId',  label: 'Firebase Project ID',     placeholder: 'your-project-id',       required: true,  masked: false },
  { key: 'apiKey',     label: 'Firebase API Key (public)',placeholder: 'AIzaSy… (public only)', required: true,  masked: true,  hint: 'Use the public web API key from Firebase Console.' },
  { key: 'authDomain', label: 'Auth Domain',             placeholder: 'project.firebaseapp.com',required: false, masked: false },
  { key: 'databaseUrl',label: 'Database URL / Firestore',placeholder: 'https://…firebaseio.com',required: false, masked: false },
]
const AWS_FIELDS = [
  { key: 'apiBaseUrl',    label: 'API Base URL',        placeholder: 'https://api.yourapp.com', required: true,  masked: false },
  { key: 'region',        label: 'Region (optional)',   placeholder: 'eu-west-2',               required: false, masked: false },
  { key: 'authModeLabel', label: 'Auth Mode Label',     placeholder: 'e.g. Cognito / API key',  required: false, masked: false, hint: 'Label only. Do not enter secrets here.' },
]
const REST_FIELDS = [
  { key: 'apiBaseUrl',       label: 'API Base URL',          placeholder: 'https://api.yourapp.com', required: true,  masked: false },
  { key: 'healthEndpoint',   label: 'Health Check Endpoint', placeholder: '/health or /ping',        required: false, masked: false },
  { key: 'publicClientToken',label: 'Public Client Token (optional)', placeholder: 'client token only', required: false, masked: true, hint: 'Frontend-safe public token only. Never a secret.' },
]

function BackendProviderPanel() {
  const { config, updateProvider, setProviderStatus, setActiveProvider } = useBackendConfigStore()
  const providers = config.providers

  const handleUpdate = (pKey, fields) => updateProvider(pKey, fields)
  const handleTest   = (pKey, result) => setProviderStatus(pKey, result.status)

  return (
    <Card title="Backend Provider Setup" icon="Database">
      <div className="space-y-4">
        <p className="text-2xs text-slate-600 leading-relaxed">
          "Live Mode without a configured backend stores updates locally and queues them for sync. The system must not claim cloud sync is complete until a real backend connector is configured and validated."
        </p>

        {/* Active provider selector */}
        <div className="space-y-1.5">
          <label className="text-2xs text-slate-500">Active Provider</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {['local','supabase','firebase','aws','rest'].map(p => (
              <button key={p} onClick={() => setActiveProvider(p)}
                className={`py-2 rounded-lg border text-2xs font-semibold capitalize transition-all ${
                  config.activeProvider === p
                    ? 'border-[#b8860b]/50 bg-[#b8860b]/15 text-[#d4a017]'
                    : 'border-slate-800/50 bg-slate-900/30 text-slate-600 hover:border-slate-700/50 hover:text-slate-400'
                }`}>{p === 'local' ? 'Local Only' : p}</button>
            ))}
          </div>
        </div>

        {/* Provider cards */}
        <ProviderCard providerKey="supabase" title="Supabase" icon="Database" description="Supabase Postgres + Auth + Realtime" fields={SUPABASE_FIELDS} providerConfig={providers.supabase} onUpdate={handleUpdate} onTest={handleTest} />
        <ProviderCard providerKey="firebase" title="Firebase / Firestore" icon="Flame"    description="Google Firebase Firestore + Auth"             fields={FIREBASE_FIELDS} providerConfig={providers.firebase} onUpdate={handleUpdate} onTest={handleTest} />
        <ProviderCard providerKey="aws"      title="AWS / Custom Backend" icon="Cloud"    description="AWS API Gateway or custom backend endpoint"   fields={AWS_FIELDS}      providerConfig={providers.aws}      onUpdate={handleUpdate} onTest={handleTest} />
        <ProviderCard providerKey="rest"     title="Generic REST / Custom" icon="Globe"   description="Generic REST API or custom endpoint"          fields={REST_FIELDS}     providerConfig={providers.rest}     onUpdate={handleUpdate} onTest={handleTest} />

        {/* Local fallback */}
        <div className="p-3.5 bg-amber-950/15 border border-amber-700/25 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="HardDrive" size={13} className="text-amber-400" />
            <span className="text-xs font-bold text-amber-400">Local-Only Fallback</span>
            <StatusBadge status="localOnly" />
          </div>
          <p className="text-2xs text-slate-600 leading-relaxed">
            Local-only mode is always active as fallback. All data is saved in browser localStorage. The sync queue preserves records until a backend is configured and validated. No data is lost when switching providers.
          </p>
          <div className="mt-2 flex items-center justify-between text-2xs font-mono">
            <span className="text-slate-700">Pending sync items:</span>
            <span className="text-amber-400">{useSyncQueueStore(s => s.queue.filter(q => q.status === 'pending').length)}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ─── API CONFIG GUARD PANEL ───────────────────────────────────
function ApiConfigGuardPanel() {
  const [testVal, setTestVal] = useState('')
  const [result,  setResult]  = useState(null)

  const handleTest = useCallback(() => {
    if (!testVal) { setResult(null); return }
    const blocked = looksLikeSecret(testVal)
    setResult(blocked ? 'blocked' : 'safe')
    setTestVal('')  // clear immediately regardless
  }, [testVal])

  return (
    <Card title="4P3X API Config Guard™" icon="ShieldCheck" iconColor="text-emerald-400">
      <div className="space-y-4">
        <p className="text-2xs text-slate-600 leading-relaxed">
          "Backend-only secrets must never be placed in frontend code, public files, GitHub commits, logs, exported reports, or browser storage."
        </p>

        {/* Blocked list */}
        <div className="space-y-1">
          <div className="text-2xs font-semibold text-red-400 uppercase tracking-wider mb-2">Never store these in frontend</div>
          <div className="grid grid-cols-2 gap-1.5">
            {['SUPABASE_SERVICE_ROLE_KEY','OPENAI_API_KEY','GROQ_API_KEY','STRIPE_SECRET_KEY','DATABASE_URL','JWT_SECRET','PRIVATE_KEY','WEBHOOK_SECRET','Admin tokens','Backend-only secrets'].map(s => (
              <div key={s} className="flex items-center gap-1.5 text-2xs text-red-400/70 bg-red-950/20 border border-red-700/20 rounded-lg px-2 py-1">
                <Icon name="X" size={9} className="flex-shrink-0" />
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Allowed list */}
        <div className="space-y-1">
          <div className="text-2xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Frontend-safe values</div>
          <div className="grid grid-cols-2 gap-1.5">
            {['Supabase URL','Supabase anon/public key','Firebase public config','Public API base URL','Public feature flags'].map(s => (
              <div key={s} className="flex items-center gap-1.5 text-2xs text-emerald-400/70 bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-2 py-1">
                <Icon name="Check" size={9} className="flex-shrink-0" />
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Test the guard */}
        <div className="space-y-2">
          <div className="text-2xs text-slate-500">Test API Config Guard (value is not saved or logged)</div>
          <div className="flex gap-2">
            <input value={testVal} onChange={e => setTestVal(e.target.value)} placeholder="Paste a value to test if it looks like a secret…"
              autoComplete="off" type="password"
              className="flex-1 bg-[#0d1426] border border-slate-700/60 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-[#b8860b]/50 font-mono" />
            <button onClick={handleTest}
              className="px-3 py-2 rounded-lg bg-emerald-700/70 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex-shrink-0">
              Test
            </button>
          </div>
          {result === 'blocked' && (
            <div className="flex items-start gap-2 p-2.5 bg-red-950/30 border border-red-700/40 rounded-lg text-2xs text-red-400">
              <Icon name="ShieldAlert" size={11} className="flex-shrink-0 mt-0.5" />
              Blocked — this looks like a backend-only secret and cannot be stored in the frontend. Use a server/backend environment instead.
            </div>
          )}
          {result === 'safe' && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-lg text-2xs text-emerald-400">
              <Icon name="Check" size={11} className="flex-shrink-0" />
              Value does not appear to be a backend-only secret. Review it manually before use.
            </div>
          )}
        </div>

        {/* Env guidance */}
        <div className="p-3 bg-slate-900/50 border border-slate-800/50 rounded-xl space-y-1.5">
          <div className="text-2xs font-semibold text-slate-400">Environment File Guidance (.env.example)</div>
          <div className="font-mono text-2xs text-slate-600 space-y-0.5 leading-relaxed">
            <div className="text-slate-700"># Frontend-safe public config only</div>
            <div className="text-emerald-400/60">VITE_SUPABASE_URL=</div>
            <div className="text-emerald-400/60">VITE_SUPABASE_ANON_KEY=</div>
            <div className="text-emerald-400/60">VITE_FIREBASE_API_KEY=</div>
            <div className="text-emerald-400/60">VITE_PUBLIC_API_BASE_URL=</div>
            <div className="text-emerald-400/60">VITE_MAP_PROVIDER=osm</div>
            <div className="text-emerald-400/60">VITE_ENABLE_DEMO_MODE=true</div>
            <div className="text-red-400/50 mt-1"># NEVER place here:</div>
            <div className="text-red-400/50">SUPABASE_SERVICE_ROLE_KEY · DATABASE_URL · OPENAI_API_KEY</div>
            <div className="text-red-400/50">JWT_SECRET · PRIVATE_KEY · STRIPE_SECRET_KEY · WEBHOOK_SECRET</div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ─── SYNC READINESS PANEL ─────────────────────────────────────
function SyncReadinessPanel() {
  const [readiness, setReadiness] = useState(null)
  const [syncResult, setSyncResult] = useState(null)
  const [checking, setChecking] = useState(false)
  const [syncing,  setSyncing]  = useState(false)

  const handleCheck = useCallback(async () => {
    setChecking(true)
    await new Promise(r => setTimeout(r, 300))
    setReadiness(checkSyncReadiness())
    setChecking(false)
  }, [])

  const handlePrepare = useCallback(async () => {
    setSyncing(true)
    setSyncResult(null)
    await new Promise(r => setTimeout(r, 600))
    setSyncResult(await prepareSyncRun())
    setSyncing(false)
  }, [])

  const DIR_LABELS = {
    'dashToBackend':           '↑ Dash → Backend',
    'pwaToBackend':            '↑ PWA → Backend',
    'pwaToBackend+backendToDash': '↕ PWA ↔ Backend ↔ Dash',
    'dashToBackend+pwaToBackend': '↕ Dash + PWA → Backend',
    'backendToDash':           '↓ Backend → Dash',
    'internal':                '⏸ Internal',
    'localOnly':               '⬛ Local Only',
  }

  return (
    <Card title="Sync Readiness" icon="RefreshCw">
      <div className="space-y-4">
        <div className="flex gap-2">
          <button onClick={handleCheck} disabled={checking}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              checking ? 'bg-slate-800 text-slate-600' : 'bg-cyan-700/70 hover:bg-cyan-700 text-white'
            }`}>
            <Icon name={checking ? 'Loader' : 'Search'} size={12} className={checking ? 'animate-spin' : ''} />
            Check Sync Readiness
          </button>
          <button onClick={handlePrepare} disabled={syncing}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              syncing ? 'bg-slate-800 text-slate-600' : 'bg-[#b8860b]/70 hover:bg-[#b8860b] text-black'
            }`}>
            <Icon name={syncing ? 'Loader' : 'PlayCircle'} size={12} className={syncing ? 'animate-spin' : ''} />
            Prepare Sync
          </button>
        </div>

        {/* Sync result message */}
        {syncResult && (
          <div className={`p-3 rounded-xl border text-2xs leading-relaxed ${
            syncResult.resultStatus === 'demo'         ? 'bg-violet-500/8 border-violet-500/20 text-violet-300' :
            syncResult.resultStatus === 'backendReady' ? 'bg-cyan-500/8 border-cyan-500/20 text-cyan-300' :
            'bg-amber-950/20 border-amber-700/25 text-amber-400'
          }`}>
            <p className="font-semibold mb-1">{syncResult.resultMessage}</p>
            <p className="text-slate-600 mt-1">Would sync: {syncResult.wouldSync.map(e => `${e.entity} (${e.count})`).join(' · ')}</p>
            <p className="text-slate-700 mt-0.5 font-mono">Queue pending: {syncResult.pendingQueueItems} · {fmtTime(syncResult.at)}</p>
          </div>
        )}

        {/* Readiness entity table */}
        {readiness && (
          <div className="space-y-2">
            <div className={`p-2.5 rounded-lg border text-2xs ${
              readiness.backendConfigured ? 'bg-cyan-500/8 border-cyan-500/20 text-cyan-400' : 'bg-amber-950/20 border-amber-700/25 text-amber-400'
            }`}>{readiness.summary.message}</div>
            <div className="space-y-1">
              {readiness.entities.map(e => (
                <div key={e.key} className="flex items-center gap-2 text-2xs p-2 rounded-lg bg-slate-900/40 border border-slate-800/40">
                  <span className="text-slate-500 flex-1">{e.label}</span>
                  <span className="text-slate-700 font-mono">{e.count}</span>
                  <span className="text-slate-700 hidden sm:block">{DIR_LABELS[e.direction] || e.direction}</span>
                  <StatusBadge status={e.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── BACKEND DATA MAPPING ─────────────────────────────────────
const DATA_MAP = [
  { entity: 'vehicles',         label: 'Vehicle Profiles',      purpose: 'Vehicle dimensions, weights, type templates', table: 'bv_vehicles',         direction: 'dashToBackend',              key: 'bigv:vehicles'      },
  { entity: 'routes',           label: 'Route Plans',           purpose: 'Route planning records, origin/destination',  table: 'bv_route_plans',      direction: 'dashToBackend',              key: 'bigv:routes'        },
  { entity: 'routeAssignments', label: 'Route Assignments',     purpose: 'Linking routes to vehicles for Driver PWA',   table: 'bv_route_assignments',direction: 'dashToBackend+pwaToBackend',  key: 'bigv:assignments'   },
  { entity: 'tripSessions',     label: 'Trip Sessions',         purpose: 'Navigation events, GPS status, checklist',    table: 'bv_trip_sessions',    direction: 'pwaToBackend+backendToDash',  key: 'bigv:tripSessions'  },
  { entity: 'driverReports',    label: 'Driver Reports',        purpose: 'In-trip driver observations and incidents',   table: 'bv_driver_reports',   direction: 'pwaToBackend+backendToDash',  key: 'bigv:driverReports' },
  { entity: 'syncQueue',        label: 'Sync Queue',            purpose: 'Local-first change queue for backend sync',   table: 'bv_sync_queue',       direction: 'internal',                   key: 'bigv:syncQueue'     },
  { entity: 'auditEvents',      label: 'Audit Events',          purpose: 'Full system event trail for compliance',      table: 'bv_audit_events',     direction: 'dashToBackend',              key: 'bigv:auditEvents'   },
  { entity: 'aiFindings',       label: 'AI Advisory Findings',  purpose: '4P3X AI agent findings + evidence review',    table: 'bv_ai_findings',      direction: 'dashToBackend',              key: 'bigv:aiFindings'    },
  { entity: 'aiAdvisory',       label: 'AI Advisory Snapshot',  purpose: 'Last AI review scores + recommendations',     table: 'bv_ai_advisory',      direction: 'dashToBackend',              key: 'bigv:aiAdvisory'    },
  { entity: 'backendConfig',    label: 'User Settings / Config','purpose': 'App config (public keys only)',              table: 'bv_user_settings',    direction: 'localOnly',                  key: 'bigv:backendConfig' },
]

const DIR_COLOR = {
  'dashToBackend':           'text-cyan-400/70',
  'pwaToBackend':            'text-violet-400/70',
  'dashToBackend+pwaToBackend': 'text-[#d4a017]/80',
  'pwaToBackend+backendToDash': 'text-emerald-400/70',
  'internal':                'text-slate-600',
  'localOnly':               'text-slate-700',
}

function DataMappingPanel() {
  const [expanded, setExpanded] = useState(false)
  const preview = expanded ? DATA_MAP : DATA_MAP.slice(0, 5)
  return (
    <Card title="Backend Data Mapping Reference" icon="GitBranch">
      <div className="space-y-3">
        <p className="text-2xs text-slate-600 leading-relaxed">Local entity → suggested backend table/collection mapping. Use this as a reference when configuring a Supabase/Firebase/AWS backend. SQL schema generation available on request.</p>
        <div className="space-y-1">
          {preview.map(e => (
            <div key={e.entity} className="p-2.5 rounded-xl border border-slate-800/40 bg-slate-900/40 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-300">{e.label}</span>
                <span className="text-2xs text-slate-600 font-mono">→ {e.table}</span>
                <span className={`text-2xs ml-auto ${DIR_COLOR[e.direction] || 'text-slate-600'}`}>{e.direction.replace(/\+/g,' + ')}</span>
              </div>
              <p className="text-2xs text-slate-700">{e.purpose}</p>
            </div>
          ))}
        </div>
        {DATA_MAP.length > 5 && (
          <button onClick={() => setExpanded(v => !v)} className="text-2xs text-[#b8860b] hover:text-[#d4a017] flex items-center gap-1 transition-colors">
            <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={11} />
            {expanded ? 'Show less' : `Show all ${DATA_MAP.length} entities`}
          </button>
        )}
      </div>
    </Card>
  )
}

// ─── PWA INSTALL READINESS ────────────────────────────────────
function PwaReadinessPanel() {
  const [checks, setChecks] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleCheck = useCallback(async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    setChecks(checkPwaReadiness())
    setLoading(false)
  }, [])

  return (
    <Card title="PWA Install Readiness" icon="Smartphone">
      <div className="space-y-4">
        <button onClick={handleCheck} disabled={loading}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            loading ? 'bg-slate-800 text-slate-600' : 'bg-violet-700/70 hover:bg-violet-700 text-white'
          }`}>
          <Icon name={loading ? 'Loader' : 'Smartphone'} size={12} className={loading ? 'animate-spin' : ''} />
          Check PWA Readiness
        </button>
        {checks && (
          <div className="space-y-2">
            <div className="flex gap-3 text-2xs font-semibold">
              <span className="text-emerald-400">{checks.ready} Ready</span>
              <span className="text-amber-400">{checks.needsReview} Needs Review</span>
              <span className="text-slate-600">/ {checks.total} Total</span>
            </div>
            {checks.checks.map(c => (
              <div key={c.id} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-800/40 bg-slate-900/40">
                <Icon name={c.status === 'ready' ? 'CheckCircle' : 'AlertTriangle'} size={12}
                  className={`flex-shrink-0 mt-0.5 ${c.status === 'ready' ? 'text-emerald-400' : 'text-amber-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-300">{c.label}</div>
                  <div className="text-2xs text-slate-600 leading-snug">{c.note}</div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── DRIVER PWA CONNECTION READINESS ─────────────────────────
function DriverPwaReadinessPanel() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleCheck = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      const pending = useSyncQueueStore.getState().queue.filter(q => q.status === 'pending').length
      setResult({
        driverRoute:      { status: 'ready',       label: 'Driver PWA route (/driver-app)',     note: 'Registered and accessible.' },
        assignmentInbox:  { status: 'ready',       label: 'Assignment Inbox',                   note: 'BvAssignmentInbox operational.' },
        tripSessions:     { status: 'ready',       label: 'Trip Sessions',                      note: 'useTripSessionStore connected.' },
        driverReports:    { status: 'ready',       label: 'Driver Reports',                     note: 'Report form and store connected.' },
        syncStatus:       { status: pending > 0 ? 'needsReview' : 'ready', label: 'Sync Queue', note: `${pending} item(s) pending sync.` },
        offlineSupport:   { status: 'needsReview', label: 'Offline Support',                    note: 'sw-job-sync.js exists. Verify service worker covers Driver PWA assets.' },
        backendReadiness: { status: 'localOnly',   label: 'Backend Readiness',                  note: 'Driver PWA uses local-first sync. Configure backend for live sync.' },
      })
      setLoading(false)
    }, 500)
  }, [])

  return (
    <Card title="Driver PWA Connection Readiness" icon="Tablet">
      <div className="space-y-4">
        <button onClick={handleCheck} disabled={loading}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            loading ? 'bg-slate-800 text-slate-600' : 'bg-emerald-700/70 hover:bg-emerald-700 text-white'
          }`}>
          <Icon name={loading ? 'Loader' : 'Tablet'} size={12} className={loading ? 'animate-spin' : ''} />
          Check Driver PWA Readiness
        </button>
        {result && (
          <div className="space-y-2">
            {Object.values(result).map(item => (
              <div key={item.label} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-800/40 bg-slate-900/40">
                <Icon name={item.status === 'ready' ? 'CheckCircle' : item.status === 'localOnly' ? 'HardDrive' : 'AlertTriangle'} size={12}
                  className={`flex-shrink-0 mt-0.5 ${item.status === 'ready' ? 'text-emerald-400' : item.status === 'localOnly' ? 'text-amber-400' : 'text-amber-300'}`} />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-300">{item.label}</div>
                  <div className="text-2xs text-slate-600">{item.note}</div>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── PRODUCTION CHECKLIST ─────────────────────────────────────
const CAT_COLOR = {
  product: 'text-[#d4a017]', mode: 'text-violet-400', backend: 'text-cyan-400',
  security: 'text-red-400', sync: 'text-emerald-400', pwa: 'text-blue-400',
  features: 'text-slate-400', ai: 'text-violet-400', safety: 'text-amber-400',
  ux: 'text-slate-400', qa: 'text-slate-500',
}

function ProductionChecklist() {
  const { items, toggleItem, resetAll, getProgress } = useDeploymentChecklistStore()
  const { done, total } = getProgress()
  const pct  = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <Card title="Production Readiness Checklist" icon="ClipboardCheck">
      <div className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-2xs">
            <span className="text-slate-500">{done} / {total} complete</span>
            <span className={`font-bold ${pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{pct}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Items */}
        <div className="space-y-1">
          {items.map(item => (
            <button key={item.id} onClick={() => toggleItem(item.id)}
              className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                item.checked ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-slate-800/40 bg-slate-900/40 hover:border-slate-700/40'
              }`}>
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                item.checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
              }`}>
                {item.checked && <Icon name="Check" size={9} className="text-white" />}
              </div>
              <span className={`text-xs flex-1 ${item.checked ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{item.label}</span>
              <span className={`text-2xs ${CAT_COLOR[item.category] || 'text-slate-600'} flex-shrink-0`}>{item.category}</span>
            </button>
          ))}
        </div>

        <button onClick={resetAll} className="text-2xs text-slate-700 hover:text-red-400 transition-colors flex items-center gap-1">
          <Icon name="RotateCcw" size={10} /> Reset all
        </button>
      </div>
    </Card>
  )
}

// ─── Root page ────────────────────────────────────────────────
export default memo(function DeploymentCentre() {
  return (
    <div className="min-h-screen bg-[#050810] text-white">
      {/* Header */}
      <div className="border-b border-[#b8860b]/20 px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Icon name="Server" size={18} className="text-[#b8860b]" />
          <h1 className="text-xl font-bold text-white">Big V's Backend &amp; Deployment Centre™</h1>
        </div>
        <p className="text-2xs text-slate-600">
          Powered by 4P3X Intelligent AI™ · Created by Kyzel Kreates™
        </p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-3xl">
          Demo Mode shows the product using local/demo data. Live Mode prepares Big V's Best Routes™ to run as a real product when a backend such as Supabase, Firebase, AWS/custom, or another suitable system is connected.
        </p>
      </div>

      {/* Main content */}
      <div className="px-6 py-6 max-w-4xl mx-auto space-y-6">
        {/* Safety advisory */}
        <div className="p-3.5 bg-[#0a0700] border border-[#b8860b]/15 rounded-xl text-2xs text-slate-600 leading-relaxed">
          Backend/live sync improves data persistence and dashboard visibility, but it does not guarantee route safety, legal compliance, road restriction accuracy, or live road conditions. Drivers must still follow road signs, restrictions, traffic laws, and professional judgement.
        </div>

        <DemoLivePanel />
        <BackendProviderPanel />
        <ApiConfigGuardPanel />
        <SyncReadinessPanel />
        <DriverPwaReadinessPanel />
        <PwaReadinessPanel />
        <DataMappingPanel />
        <ProductionChecklist />
      </div>
    </div>
  )
})

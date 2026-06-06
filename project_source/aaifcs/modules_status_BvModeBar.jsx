/**
 * ============================================================
 * Big V's Best Routes™ — BvModeBar™
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 *
 * Shared status strip shown on Dashboard + Driver PWA.
 * Displays: Demo/Live mode · Backend status · Live sync state
 *           · Pending queue · Last local save · Offline warning
 *
 * ── Security ──────────────────────────────────────────────────
 * This component NEVER stores, displays, or transmits backend-only secrets.
 * It reads only from useBackendConfigStore (SSOT) and window.navigator.onLine.
 *
 * ── Advisory ──────────────────────────────────────────────────
 * Live sync status is display-only. It does not guarantee data integrity,
 * route safety, or legal compliance. Drivers must always follow road signs,
 * restrictions, traffic laws, and professional judgement.
 * ============================================================
 */

import { useState, useEffect, memo } from 'react'
import { useBackendConfigStore, useSyncQueueStore } from './core_storage'
import Icon from './components_ui_Icon'

// ─── Helpers ─────────────────────────────────────────────────
const fmtRelTime = (iso) => {
  if (!iso) return null
  try {
    const diff = Date.now() - new Date(iso).getTime()
    if (diff < 60_000)  return 'just now'
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`
    return new Date(iso).toLocaleDateString()
  } catch { return null }
}

// ─── BvModeBar ───────────────────────────────────────────────
/**
 * Props:
 *   variant  — 'dashboard' | 'driver'
 *              dashboard: full multi-pill bar with link to Deployment Centre
 *              driver: compact single-line strip with offline warning only
 *   onOpenDeployment — callback to navigate to /deployment (dashboard variant)
 */
export const BvModeBar = memo(function BvModeBar({ variant = 'dashboard', onOpenDeployment }) {
  const {
    config,
    isDemoMode,
    isLiveMode,
    isBackendConfigured,
    isLiveSyncActive,
    getSyncPendingCount,
    getLastLocalSave,
  } = useBackendConfigStore()

  const syncPending = useSyncQueueStore(s => s.queue.filter(i => i.status === 'pending').length)
  const [isOnline,    setIsOnline]    = useState(navigator.onLine)
  const [lastSave,    setLastSave]    = useState(null)

  const demo        = config.demoMode
  const provider    = config.activeProvider
  const liveSyncOn  = isLiveSyncActive()
  const backendCfg  = isBackendConfigured()
  const providerCfg = provider !== 'local' ? config.providers[provider] : null

  // Online/offline listener
  useEffect(() => {
    const on  = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Poll last local save every 30s
  useEffect(() => {
    const refresh = () => setLastSave(getLastLocalSave())
    refresh()
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [getLastLocalSave])

  // ── Driver variant — compact strip ──────────────────────────
  if (variant === 'driver') {
    return (
      <div className="w-full space-y-1.5 px-4 py-2">
        {/* Offline banner */}
        {!isOnline && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-950/40 border border-amber-700/40 rounded-xl text-2xs text-amber-300 leading-snug">
            <Icon name="WifiOff" size={12} className="flex-shrink-0 text-amber-400" />
            <span>
              You are offline. Previously loaded route data may remain visible, but live map, GPS accuracy,
              provider data, traffic, restrictions, and sync may be limited or unavailable.
            </span>
          </div>
        )}

        {/* Status pills row */}
        <div className="flex flex-wrap items-center gap-1.5 text-2xs">
          {/* Demo / Live */}
          {demo ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/12 border border-violet-500/25 text-violet-300 font-semibold">
              <Icon name="FlaskConical" size={9} />
              Demo Mode Active
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-semibold">
              <Icon name="Zap" size={9} />
              Live Mode
            </span>
          )}

          {/* Backend */}
          {liveSyncOn ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold">
              <Icon name="CloudUpload" size={9} />
              Cloud Sync Active
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/30 text-slate-500">
              <Icon name="HardDrive" size={9} />
              Local Only
            </span>
          )}

          {/* Pending */}
          {syncPending > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-600/25 text-amber-400">
              <Icon name="Clock" size={9} />
              {syncPending} pending
            </span>
          )}

          {/* Last save */}
          {lastSave && (
            <span className="text-slate-700 font-mono">
              saved {fmtRelTime(lastSave)}
            </span>
          )}
        </div>

        {/* Demo warning */}
        {demo && (
          <div className="px-2.5 py-1.5 bg-violet-500/6 border border-violet-500/15 rounded-lg text-2xs text-violet-400/80 leading-snug">
            Demo mode is active. This route and vehicle data may be sample data and must not be used for real driving.
          </div>
        )}

        {/* Live but no backend */}
        {!demo && !liveSyncOn && (
          <div className="px-2.5 py-1.5 bg-amber-950/20 border border-amber-700/20 rounded-lg text-2xs text-amber-400/80 leading-snug">
            {!backendCfg
              ? 'Live mode is on, but no backend provider is fully configured yet. Navigation is using available local route data.'
              : 'Live backend is not active. Data is saved locally and queued.'
            }
          </div>
        )}
      </div>
    )
  }

  // ── Dashboard variant — full status bar ─────────────────────
  const providerLabel = {
    local:    'Local Only',
    supabase: 'Supabase',
    firebase: 'Firebase',
    aws:      'AWS/Custom',
    rest:     'REST/Custom',
  }[provider] || provider

  const providerStatus = providerCfg?.status || 'notConfigured'
  const lastTested     = providerCfg?.lastTestedAt || null

  return (
    <div className="w-full space-y-2">
      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-950/40 border border-amber-700/40 rounded-xl text-xs text-amber-300 leading-snug">
          <Icon name="WifiOff" size={13} className="flex-shrink-0 text-amber-400" />
          <span>
            You are offline. Previously loaded route data may remain visible, but live map, GPS accuracy,
            provider data, traffic, restrictions, and sync may be limited or unavailable.
          </span>
        </div>
      )}

      {/* Main status strip */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-[#07080d] border border-[#b8860b]/15 rounded-xl">

        {/* ── Demo / Live pill ── */}
        {demo ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/12 border border-violet-500/25">
            <Icon name="FlaskConical" size={10} className="text-violet-400" />
            <span className="text-2xs font-bold text-violet-300">Demo Mode</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            <Icon name="Zap" size={10} className="text-cyan-400" />
            <span className="text-2xs font-bold text-cyan-300">Live Mode</span>
          </div>
        )}

        <span className="text-slate-800 hidden sm:block">·</span>

        {/* ── Backend provider pill ── */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
          liveSyncOn
            ? 'bg-emerald-500/8 border-emerald-500/20'
            : backendCfg
              ? 'bg-cyan-500/6 border-cyan-500/15'
              : 'bg-slate-900/40 border-slate-800/40'
        }`}>
          <Icon
            name={liveSyncOn ? 'CloudUpload' : backendCfg ? 'Database' : 'HardDrive'}
            size={10}
            className={liveSyncOn ? 'text-emerald-400' : backendCfg ? 'text-cyan-400' : 'text-slate-600'}
          />
          <span className={`text-2xs font-semibold ${
            liveSyncOn ? 'text-emerald-300' : backendCfg ? 'text-cyan-300' : 'text-slate-600'
          }`}>
            {liveSyncOn ? `Live Sync: ${providerLabel}` : backendCfg ? `${providerLabel} (not validated)` : 'Local Only'}
          </span>
        </div>

        <span className="text-slate-800 hidden sm:block">·</span>

        {/* ── Test status pill ── */}
        {!demo && provider !== 'local' && (
          <>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              providerStatus === 'testPassed'
                ? 'bg-emerald-500/8 border-emerald-500/20'
                : providerStatus === 'testFailed'
                  ? 'bg-red-500/8 border-red-500/20'
                  : 'bg-slate-900/40 border-slate-800/40'
            }`}>
              <Icon
                name={providerStatus === 'testPassed' ? 'CheckCircle' : providerStatus === 'testFailed' ? 'XCircle' : 'CircleDashed'}
                size={10}
                className={
                  providerStatus === 'testPassed' ? 'text-emerald-400' :
                  providerStatus === 'testFailed' ? 'text-red-400' : 'text-slate-600'
                }
              />
              <span className={`text-2xs font-semibold ${
                providerStatus === 'testPassed' ? 'text-emerald-300' :
                providerStatus === 'testFailed' ? 'text-red-300' : 'text-slate-600'
              }`}>
                {providerStatus === 'testPassed' ? 'Test Passed' :
                 providerStatus === 'testFailed' ? 'Test Failed' :
                 providerStatus === 'testing'    ? 'Testing…'   :
                 providerStatus === 'configured' ? 'Not Tested' : 'Not Configured'}
              </span>
              {lastTested && <span className="text-slate-700 font-mono text-2xs hidden md:block">{fmtRelTime(lastTested)}</span>}
            </div>
            <span className="text-slate-800 hidden sm:block">·</span>
          </>
        )}

        {/* ── Sync pending ── */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
          syncPending > 0
            ? 'bg-amber-500/8 border-amber-600/20'
            : 'bg-slate-900/30 border-slate-800/30'
        }`}>
          <Icon name="Clock" size={10} className={syncPending > 0 ? 'text-amber-400' : 'text-slate-700'} />
          <span className={`text-2xs font-semibold ${syncPending > 0 ? 'text-amber-300' : 'text-slate-700'}`}>
            {syncPending > 0 ? `${syncPending} pending` : 'Queue clear'}
          </span>
        </div>

        {/* ── Last save ── */}
        {lastSave && (
          <>
            <span className="text-slate-800 hidden sm:block">·</span>
            <div className="flex items-center gap-1 px-2 py-1">
              <Icon name="Save" size={9} className="text-slate-700" />
              <span className="text-2xs text-slate-700 font-mono">saved {fmtRelTime(lastSave)}</span>
            </div>
          </>
        )}

        {/* ── Open Deployment Centre ── */}
        {onOpenDeployment && (
          <button
            onClick={onOpenDeployment}
            className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#b8860b]/10 border border-[#b8860b]/20 text-2xs text-[#d4a017] hover:bg-[#b8860b]/20 transition-colors"
          >
            <Icon name="Settings2" size={9} />
            <span className="hidden sm:inline">Backend Settings</span>
          </button>
        )}
      </div>

      {/* ── Context message below bar ── */}
      {demo ? (
        <div className="px-3 py-2 bg-violet-500/6 border border-violet-500/15 rounded-xl text-2xs text-violet-400/80 leading-snug">
          <strong>Demo Mode is ON.</strong> Demo sync is local simulation only. This view may show sample data labelled as demo. No real backend calls are made.
        </div>
      ) : !liveSyncOn ? (
        <div className="px-3 py-2 bg-amber-950/20 border border-amber-700/20 rounded-xl text-2xs text-amber-400/80 leading-snug">
          {!backendCfg
            ? <><strong>Demo Mode is OFF.</strong> Configure and test a backend provider to activate live cloud sync. Until then, data is saved locally and queued.</>
            : <><strong>Live backend is not active.</strong> Data is saved locally and queued. Go to Backend Settings to test the connection.</>
          }
        </div>
      ) : (
        <div className="px-3 py-2 bg-emerald-500/6 border border-emerald-500/15 rounded-xl text-2xs text-emerald-400/80 leading-snug">
          <strong>Live sync active</strong> via {providerLabel}. Data changes are queued for backend sync.
        </div>
      )}
    </div>
  )
})

export default BvModeBar

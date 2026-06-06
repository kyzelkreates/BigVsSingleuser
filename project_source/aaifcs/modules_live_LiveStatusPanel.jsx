/**
 * ============================================================
 * Big V's Best Routes™ — Live Status Panel (Run 11)
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 *
 * Self-contained card showing Live Mode status:
 *   - Auth/session state
 *   - Backend connection
 *   - Realtime channel status
 *   - Last sync timestamps
 *   - Sign in / sign out controls (live mode only)
 *   - Demo/live mode label
 *   - Advisory disclaimer
 *   - Offline warning
 *
 * Props:
 *   variant — 'dashboard' (default) | 'driver'
 *   className — optional extra classes
 *
 * ── Demo Mode Protection ──────────────────────────────────────
 * When Demo Mode is ON, this panel shows the demo status only.
 * It does not display Supabase controls in demo mode.
 * It does not touch demo data.
 *
 * ── Advisory ──────────────────────────────────────────────────
 * Live status display does not guarantee route safety,
 * legal compliance, or restriction clearance.
 * ============================================================
 */

import { useState, useEffect, useCallback, memo } from 'react'
import Icon from './components_ui_Icon'
import { useBackendConfigStore, useLiveSessionStore } from './core_storage'
import { useLiveSession } from './hooks_useLiveData'
import {
  signInWithEmail, signOutLive,
  getLiveSession,
} from './services_supabase_bvLiveService'
import {
  getActiveChannelCount, getAllChannelStatuses,
  REALTIME_STATUS, REALTIME_STATUS_LABELS,
} from './services_supabase_bvRealtimeService'
import { getSupabaseSettings } from './services_supabase_supabaseClient'

// ─── Helpers ─────────────────────────────────────────────────
const fmtTime = (iso) => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

// ═══════════════════════════════════════════════════════════════
//  LiveSignInForm — compact sign-in (live mode only)
// ═══════════════════════════════════════════════════════════════
function LiveSignInForm({ onSuccess, onCancel }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [mode,     setMode]     = useState('signin')  // 'signin' | 'info'

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Email and password are required.'); return }
    setLoading(true)
    setError(null)
    try {
      const result = await signInWithEmail(email, password)
      if (result.success) {
        onSuccess?.(result.data)
      } else {
        setError(result.error?.message || 'Sign in failed. Check email and password.')
      }
    } catch (err) {
      setError(err.message || 'Unexpected error.')
    } finally {
      setLoading(false)
    }
  }, [email, password, onSuccess])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon name="LogIn" size={13} className="text-cyan-400" />
        <span className="text-xs font-semibold text-white">Sign in to Live Mode</span>
      </div>
      <p className="text-2xs text-slate-500 leading-relaxed">
        Sign in with your Supabase Auth account to load and save live records.
        Demo Mode remains unaffected.
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email address"
          autoComplete="email"
          className="w-full px-3 py-2 bg-[#0a1020] border border-slate-800/60 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="w-full px-3 py-2 bg-[#0a1020] border border-slate-800/60 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
        />
        {error && (
          <div className="px-2.5 py-1.5 bg-red-950/30 border border-red-700/30 rounded-lg text-2xs text-red-400">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/25 rounded-lg text-xs text-cyan-300 font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? <Icon name="Loader" size={11} className="animate-spin" /> : <Icon name="LogIn" size={11} />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 border border-slate-800/50 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <p className="text-2xs text-slate-700">
        No account yet? Create one in the Supabase dashboard for your project, then sign in here.
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  LiveStatusPanel — main export
// ═══════════════════════════════════════════════════════════════
function LiveStatusPanel({ variant = 'dashboard', className = '' }) {
  const isDemoMode    = useBackendConfigStore(s => s.isDemoMode())
  const isLiveSyncOn  = useBackendConfigStore(s => s.isLiveSyncActive())
  const liveSession   = useLiveSessionStore(s => s.liveSession)
  const setSignedIn   = useLiveSessionStore(s => s.setSignedIn)
  const setSignedOut  = useLiveSessionStore(s => s.setSignedOut)
  const { isLive, user, authError, isLoading: sessionLoading } = useLiveSession()

  const [showSignIn,      setShowSignIn]   = useState(false)
  const [signOutLoading,  setSignOutLoading] = useState(false)
  const [liveError,       setLiveError]    = useState(null)
  const [rtChannelCount,  setRtCount]      = useState(0)
  const [online,          setOnline]       = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true)
  const sbConfig = getSupabaseSettings()

  // Sync auth state to SSOT store
  useEffect(() => {
    if (isLive && user) {
      setSignedIn(user.id, user.email)
    } else if (!isLive && liveSession?.isSignedIn && !isDemoMode && !isLiveSyncOn) {
      setSignedOut()
    }
  }, [isLive, user, isDemoMode, isLiveSyncOn])

  // Poll realtime channel count every 5s
  useEffect(() => {
    if (!isLive) { setRtCount(0); return }
    const tick = () => setRtCount(getActiveChannelCount())
    tick()
    const id = setInterval(tick, 5000)
    return () => clearInterval(id)
  }, [isLive])

  // Online/offline
  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const handleSignOut = useCallback(async () => {
    setSignOutLoading(true)
    try {
      await signOutLive()
      setSignedOut()
      setShowSignIn(false)
    } catch (e) {
      setLiveError(e.message)
    } finally {
      setSignOutLoading(false)
    }
  }, [setSignedOut])

  const isDriver = variant === 'driver'

  // ── Demo mode state ───────────────────────────────────────
  if (isDemoMode) {
    return (
      <div className={`p-3 bg-violet-950/20 border border-violet-700/20 rounded-xl ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Icon name="Flask" size={12} className="text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-violet-300">Demo Mode Active</div>
            <div className="text-2xs text-violet-500 truncate">Supabase Live Mode is disabled in Demo Mode.</div>
          </div>
        </div>
        <p className="mt-2 text-2xs text-slate-600 leading-relaxed">
          Demo records are not shown in Live Mode and are not sent to Supabase.
          Switch Demo Mode OFF in Settings to activate Live Mode.
        </p>
      </div>
    )
  }

  // ── Not configured ─────────────────────────────────────────
  if (!isLiveSyncOn) {
    return (
      <div className={`p-3 bg-slate-900/40 border border-slate-800/40 rounded-xl ${className}`}>
        <div className="flex items-center gap-2">
          <Icon name="Database" size={13} className="text-slate-600" />
          <span className="text-xs font-semibold text-slate-500">Live Mode Not Active</span>
        </div>
        <p className="mt-1.5 text-2xs text-slate-600 leading-relaxed">
          Configure and test your Supabase connection in the Backend &amp; Deployment Centre to activate Live Mode.
          Demo Mode data will not be affected.
        </p>
      </div>
    )
  }

  // ── Live mode active ──────────────────────────────────────
  return (
    <div className={`space-y-3 ${className}`}>
      {/* ── Offline warning ── */}
      {!online && (
        <div className="flex items-center gap-2 p-2.5 bg-amber-950/30 border border-amber-700/30 rounded-xl text-2xs text-amber-300">
          <Icon name="WifiOff" size={12} className="flex-shrink-0" />
          <span>Device is offline. Live sync is paused. Data is saved locally and will sync when reconnected.</span>
        </div>
      )}

      {/* ── Auth error ── */}
      {(authError || liveError) && (
        <div className="flex items-start gap-2 p-2.5 bg-red-950/30 border border-red-700/30 rounded-xl text-2xs text-red-400">
          <Icon name="AlertTriangle" size={12} className="flex-shrink-0 mt-0.5" />
          <span>{authError || liveError}</span>
          <button onClick={() => setLiveError(null)} className="ml-auto text-red-600 hover:text-red-300 flex-shrink-0">
            <Icon name="X" size={10} />
          </button>
        </div>
      )}

      {/* ── Main status card ── */}
      <div className="p-3 bg-[#060c1a] border border-cyan-500/15 rounded-xl space-y-3">

        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Icon name="Zap" size={11} className="text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-cyan-300">Live Mode Active</div>
            <div className="text-2xs text-slate-500 truncate">
              {sbConfig.url ? sbConfig.url.replace('https://', '').substring(0, 35) + '…' : 'Supabase connected'}
            </div>
          </div>
          <div className="flex-shrink-0">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-2xs text-emerald-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Auth / Session status */}
        <div className="space-y-2">
          <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">Auth Session</div>
          {sessionLoading ? (
            <div className="flex items-center gap-2 text-2xs text-slate-500">
              <Icon name="Loader" size={10} className="animate-spin" />
              Checking session…
            </div>
          ) : isLive ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-2xs text-emerald-300">
                <Icon name="UserCheck" size={11} />
                <span className="font-medium">{user?.email || 'Signed in'}</span>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signOutLoading}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-700/40 text-2xs text-slate-500 hover:text-red-400 hover:border-red-700/30 transition-colors"
              >
                {signOutLoading ? <Icon name="Loader" size={9} className="animate-spin" /> : <Icon name="LogOut" size={9} />}
                Sign out
              </button>
            </div>
          ) : showSignIn ? (
            <LiveSignInForm
              onSuccess={(d) => {
                setSignedIn(d.user?.id, d.user?.email)
                setShowSignIn(false)
                setLiveError(null)
              }}
              onCancel={() => setShowSignIn(false)}
            />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-2xs text-amber-400">
                <Icon name="UserX" size={11} />
                <span>Not signed in — live writes are blocked until you sign in.</span>
              </div>
              <button
                onClick={() => setShowSignIn(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-2xs text-cyan-300 font-semibold transition-colors"
              >
                <Icon name="LogIn" size={10} />
                Sign in to Live Mode
              </button>
            </div>
          )}
        </div>

        {/* Realtime status */}
        <div className="space-y-1.5">
          <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">Realtime</div>
          <div className={`flex items-center gap-1.5 text-2xs ${rtChannelCount > 0 ? 'text-violet-300' : 'text-slate-500'}`}>
            <Icon name={rtChannelCount > 0 ? 'Radio' : 'RadioTower'} size={11}
              className={rtChannelCount > 0 ? 'text-violet-400 animate-pulse' : 'text-slate-600'} />
            <span>
              {rtChannelCount > 0
                ? `Live realtime active — ${rtChannelCount} channel${rtChannelCount !== 1 ? 's' : ''}`
                : 'Live schema ready, realtime not active'}
            </span>
          </div>
          {rtChannelCount === 0 && isLive && (
            <p className="text-2xs text-slate-700 leading-relaxed">
              Realtime channels connect when you open the Operations or Driver PWA screens.
            </p>
          )}
        </div>

        {/* Data isolation notice */}
        <div className="p-2 bg-slate-900/50 border border-slate-800/30 rounded-lg text-2xs text-slate-600 leading-relaxed">
          Live Mode uses Supabase records only. Demo records are not shown in Live Mode.
        </div>

        {/* Advisory disclaimer */}
        {!isDriver && (
          <div className="p-2 bg-amber-950/15 border border-amber-700/15 rounded-lg text-2xs text-amber-600/80 leading-relaxed">
            Live backend sync does not guarantee route safety, legal compliance, road restriction accuracy,
            or live conditions. Advisory only. Human review required.
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(LiveStatusPanel)

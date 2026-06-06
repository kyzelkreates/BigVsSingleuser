/**
 * ============================================================
 * Big V's Best Routes™ — Driver Navigation PWA — Demo Mode
 * Route: /#/driver-app-demo
 *
 * A standalone demo preview of the Navigation PWA experience.
 * Shows the Torquay → Edinburgh demo route with:
 *   - Route summary panel
 *   - Vehicle profile card
 *   - Safety & legal advisory scores
 *   - Risk warnings (low bridge, narrow road, weight restriction)
 *   - Pre-trip driver checklist
 *   - AI Compliance panel
 *   - Demo map visualisation with polyline
 *   - Install / Open real PWA shortcut
 *
 * DEMO RULES:
 *   - No pairing code required
 *   - No auth gate
 *   - No live GPS
 *   - All data clearly labelled as DEMO
 *   - No backend secrets
 *   - No live Supabase calls
 *   - No real routing provider required
 *
 * Clicking "Open Real Navigation PWA" activates demo mode in
 * localStorage (via activateDemoMode()) so DriverApp skips
 * the SetupScreen and loads with the demo profile.
 *
 * Run 14 Fix Pass — Kyzel Kreates™ | 4P3X Verse™
 * ============================================================
 */

import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from './config_routes'
import {
  DEMO_ROUTE_TORQUAY_EDINBURGH,
  activateDemoMode,
} from './services_demo_demoRoute'

// ── Lazy-load Leaflet (map only) ──────────────────────────────
// We use dynamic import so the demo page doesn't add to initial bundle
// for users who never open it. Leaflet is already in the vendor bundle.
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet default icon path (Vite build issue)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ── Icon helper ───────────────────────────────────────────────
const ICONS = {
  shield:  'M12 2l9 4v6c0 5.25-3.75 10.15-9 11.25C6.75 22.15 3 17.25 3 12V6l9-4z',
  alert:   'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  check:   'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  truck:   'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  map:     'M1 6l7-4 8 4 7-4v16l-7 4-8-4-7 4V6z',
  layers:  'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  phone:   'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.7A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.72 6.72l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  arrow:   'M5 12h14M12 5l7 7-7 7',
  info:    'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 9v4m0-8h.01',
  star:    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  zap:     'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  x:       'M18 6L6 18M6 6l12 12',
  download:'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m7 0l3 3 3-3m-3-9v12',
}
function Icon({ name, className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7}
      viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name] || ICONS.info} />
    </svg>
  )
}

// ── Score ring ────────────────────────────────────────────────
function ScoreRing({ score, label, color = '#d4a017' }) {
  const r = 28, c = 2 * Math.PI * r
  const dash = (score / 100) * c
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#ffffff10" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
          transform="rotate(-90 36 36)" />
        <text x="36" y="40" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">{score}</text>
      </svg>
      <span className="text-slate-400 text-[10px] text-center leading-tight max-w-[70px]">{label}</span>
    </div>
  )
}

// ── Warning card ──────────────────────────────────────────────
function WarnCard({ warn }) {
  const colors = {
    high:   { bg: 'bg-red-500/8 border-red-500/25',    icon: 'text-red-400',    badge: 'bg-red-500/15 text-red-400' },
    medium: { bg: 'bg-amber-500/8 border-amber-500/25', icon: 'text-amber-400',  badge: 'bg-amber-500/15 text-amber-400' },
    low:    { bg: 'bg-sky-500/8 border-sky-500/25',     icon: 'text-sky-400',    badge: 'bg-sky-500/15 text-sky-400' },
  }
  const c = colors[warn.severity] || colors.medium
  return (
    <div className={`rounded-xl border p-4 ${c.bg}`}>
      <div className="flex items-start gap-3">
        <Icon name="alert" className={`w-4 h-4 ${c.icon} mt-0.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-white text-sm font-semibold">{warn.title}</p>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.badge}`}>
              {warn.severity}
            </span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">{warn.description}</p>
          {warn.action && (
            <p className={`text-xs mt-1.5 font-medium ${c.icon}`}>→ {warn.action}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function DriverAppDemo() {
  const navigate = useNavigate()
  const go = (route) => navigate(route)
  const route = DEMO_ROUTE_TORQUAY_EDINBURGH

  const [checklist, setChecklist] = useState(
    route.driverChecklist.reduce((a, i) => ({ ...a, [i.id]: false }), {})
  )
  const [allChecked, setAllChecked] = useState(false)
  const [tab, setTab] = useState('route') // 'route'|'map'|'ai'|'checklist'
  const [installPrompt, setInstallPrompt] = useState(null)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Update allChecked
  useEffect(() => {
    setAllChecked(Object.values(checklist).every(Boolean))
  }, [checklist])

  const toggleCheck = (id) => setChecklist(prev => ({ ...prev, [id]: !prev[id] }))

  const openRealPWA = () => {
    activateDemoMode()
    go('/driver-app')
  }

  const installPWA = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') setInstallPrompt(null)
    }
  }

  const bounds = route.polyline.reduce(
    ([minLat, minLng, maxLat, maxLng], [lat, lng]) => [
      Math.min(minLat, lat), Math.min(minLng, lng),
      Math.max(maxLat, lat), Math.max(maxLng, lng)
    ],
    [90, 180, -90, -180]
  )
  const mapCenter = [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2]

  return (
    <div className="min-h-screen bg-[#060b18] text-white font-sans overflow-x-hidden">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/8 bg-[#060b18]/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <button onClick={() => go(ROUTES.LANDING)}
            className="font-bold text-[#d4a017] text-sm hover:opacity-80 transition-opacity truncate">
            Big V&apos;s Best Routes™
          </button>
          <div className="flex items-center gap-2 shrink-0">
            {/* Demo badge */}
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 border border-amber-500/30 bg-amber-500/8 rounded-full px-2.5 py-1">
              <Icon name="star" className="w-3 h-3" /> DEMO MODE
            </span>
            <button onClick={() => go(ROUTES.DASHBOARD)}
              className="text-xs text-slate-400 border border-white/10 rounded-lg px-3 py-1.5 hover:bg-white/6 transition-colors flex items-center gap-1.5">
              <Icon name="layers" className="w-3.5 h-3.5" /> Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* ── Demo banner ─────────────────────────────────────────── */}
      <div className="bg-amber-500/8 border-b border-amber-500/20 px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-amber-400">
          <Icon name="star" className="w-3.5 h-3.5 shrink-0" />
          <span className="font-semibold">DEMO ROUTE — </span>
          <span className="text-amber-300/80">All data shown is demonstration data only. No live routing, no real GPS, no backend connection required.</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Hero header ────────────────────────────────────────── */}
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="map" className="w-5 h-5 text-violet-400" />
                <span className="text-violet-400 font-semibold text-sm">Navigation PWA — Demo Route</span>
              </div>
              <h1 className="font-bold text-xl sm:text-2xl text-white mb-1 leading-tight">
                {route.origin.label}
                <span className="text-slate-500 mx-2">→</span>
                {route.destination.label}
              </h1>
              <p className="text-slate-400 text-sm">{route.vehicleProfile.label}</p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <div className="text-right">
                <p className="text-[#d4a017] font-bold text-xl">{route.distanceLabel}</p>
                <p className="text-slate-500 text-xs">{route.durationLabel}</p>
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="flex justify-around mt-5 pt-5 border-t border-white/8">
            <ScoreRing score={route.safetyScore}           label="Safety Score"     color="#34d399" />
            <ScoreRing score={route.legalSuitabilityScore} label="Legal Suitability" color="#d4a017" />
            <ScoreRing score={route.routeConfidenceScore}  label="Route Confidence"  color="#a78bfa" />
          </div>

          {/* Data freshness notice */}
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-500/8 border border-amber-500/20 px-3 py-2">
            <Icon name="info" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <p className="text-amber-400/80 text-xs">{route.dataFreshness}</p>
          </div>
        </div>

        {/* ── Tab nav ─────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/8">
          {[
            { id: 'route',     label: 'Route & Warnings', icon: 'alert' },
            { id: 'map',       label: 'Map View',          icon: 'map' },
            { id: 'checklist', label: 'Pre-Trip Check',    icon: 'check' },
            { id: 'ai',        label: 'AI Advisory',       icon: 'zap' },
          ].map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all duration-150
                ${tab === id ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <Icon name={icon} className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── TAB: ROUTE & WARNINGS ───────────────────────────────── */}
        {tab === 'route' && (
          <div className="space-y-4">
            {/* Vehicle profile */}
            <div className="rounded-xl border border-[#d4a017]/20 bg-[#d4a017]/4 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="truck" className="w-4 h-4 text-[#d4a017]" />
                <h3 className="text-[#d4a017] font-semibold text-sm">Selected Vehicle Profile</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Height',  value: `${route.vehicleProfile.heightMeters}m` },
                  { label: 'Width',   value: `${route.vehicleProfile.widthMeters}m` },
                  { label: 'Length',  value: `${route.vehicleProfile.lengthMeters}m` },
                  { label: 'Weight',  value: `${route.vehicleProfile.weightTonnes}t` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-black/20 p-3 text-center">
                    <p className="text-[#d4a017] font-bold text-base">{value}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-slate-500 text-xs mt-3 flex items-center gap-1.5">
                <Icon name="check" className="w-3 h-3 text-emerald-400" />
                All legal-critical vehicle fields complete for this demo profile
              </p>
            </div>

            {/* Warnings */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <Icon name="alert" className="w-4 h-4 text-amber-400" />
                Route Risk Warnings ({route.warnings.length})
              </h3>
              <div className="space-y-3">
                {route.warnings.map(w => <WarnCard key={w.id} warn={w} />)}
              </div>
            </div>

            {/* Advisory notes */}
            <div className="rounded-xl border border-white/8 bg-white/3 p-4">
              <h3 className="text-slate-300 font-semibold text-sm mb-3 flex items-center gap-2">
                <Icon name="info" className="w-4 h-4 text-sky-400" />
                Advisory Notes
              </h3>
              <ul className="space-y-2">
                {route.advisoryNotes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-400 text-xs leading-relaxed">
                    <span className="text-slate-600 mt-0.5 shrink-0">—</span>{note}
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/6 p-4">
              <div className="flex items-start gap-2">
                <Icon name="shield" className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-amber-400/90 text-xs leading-relaxed">
                  <strong>Safety-Critical Advisory: </strong>
                  Always follow road signs, legal restrictions, police instructions, and real-world conditions.
                  Big V&apos;s Best Routes™ is advisory route-planning support software.
                  It does not guarantee legal compliance and does not remove driver or operator responsibility.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: MAP VIEW ───────────────────────────────────────── */}
        {tab === 'map' && (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border border-white/10" style={{ height: 420 }}>
              <MapContainer
                center={mapCenter}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {/* Route polyline */}
                <Polyline
                  positions={route.polyline}
                  pathOptions={{ color: '#a78bfa', weight: 4, opacity: 0.85, dashArray: '8 4' }}
                />
                {/* Origin marker */}
                <Marker position={[route.origin.lat, route.origin.lng]}>
                  <Popup>
                    <strong>START: {route.origin.label}</strong><br />
                    <span style={{ fontSize: 11, color: '#888' }}>Demo origin — Torquay, Devon</span>
                  </Popup>
                </Marker>
                {/* Destination marker */}
                <Marker position={[route.destination.lat, route.destination.lng]}>
                  <Popup>
                    <strong>DESTINATION: {route.destination.label}</strong><br />
                    <span style={{ fontSize: 11, color: '#888' }}>Demo destination — Edinburgh, Scotland</span>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
              <p className="text-slate-500 text-xs flex items-start gap-1.5">
                <Icon name="info" className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-400">Demo route visualisation</strong> — approximate waypoints using the A38/M5/M6/M74 corridor.
                  This is not live routing data. Actual route will vary based on live provider, vehicle constraints and conditions.
                </span>
              </p>
            </div>
          </div>
        )}

        {/* ── TAB: PRE-TRIP CHECKLIST ─────────────────────────────── */}
        {tab === 'checklist' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/8 bg-white/3 p-5">
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <Icon name="check" className="w-4 h-4 text-emerald-400" />
                Driver Pre-Trip Safety Checklist
              </h3>
              <div className="space-y-3">
                {route.driverChecklist.map(item => (
                  <button key={item.id} onClick={() => toggleCheck(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150
                      ${checklist[item.id]
                        ? 'border-emerald-500/30 bg-emerald-500/8'
                        : 'border-white/8 bg-white/2 hover:bg-white/5'}`}>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors
                      ${checklist[item.id] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                      {checklist[item.id] && <Icon name="check" className="w-3 h-3 text-black" />}
                    </div>
                    <span className={`text-sm ${checklist[item.id] ? 'text-emerald-300' : 'text-slate-300'}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              {allChecked ? (
                <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-4 text-center">
                  <p className="text-emerald-400 font-semibold text-sm mb-1">✓ All checks acknowledged</p>
                  <p className="text-emerald-600 text-xs">Driver responsibility confirmed. Route can proceed.</p>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-slate-700 bg-slate-900/30 p-4 text-center">
                  <p className="text-slate-500 text-sm">Complete all checks before proceeding</p>
                  <p className="text-slate-700 text-xs mt-0.5">
                    {Object.values(checklist).filter(Boolean).length} / {route.driverChecklist.length} completed
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-amber-400/80 text-xs leading-relaxed">
                In a live session, this checklist creates an evidence record. The driver&apos;s acknowledgements are logged with timestamp, vehicle profile, and route ID. Human override and driver judgement are always preserved — this checklist is a support tool, not a legal guarantee.
              </p>
            </div>
          </div>
        )}

        {/* ── TAB: AI ADVISORY ───────────────────────────────────── */}
        {tab === 'ai' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="zap" className="w-4 h-4 text-violet-400" />
                <h3 className="text-violet-400 font-semibold text-sm">4P3X Intelligent AI™ — Advisory Panel</h3>
                <span className="ml-auto text-[10px] font-bold text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5">DEMO</span>
              </div>

              <div className="rounded-lg bg-black/20 p-4 mb-4">
                <p className="text-slate-300 text-sm leading-relaxed">{route.aiAdvisory.summary}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-emerald-400 font-semibold text-xs mb-2 flex items-center gap-1.5">
                    <Icon name="check" className="w-3.5 h-3.5" /> Route Positives
                  </p>
                  <ul className="space-y-2">
                    {route.aiAdvisory.positives.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-400 text-xs leading-relaxed">
                        <Icon name="check" className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />{p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-amber-400 font-semibold text-xs mb-2 flex items-center gap-1.5">
                    <Icon name="alert" className="w-3.5 h-3.5" /> Risk Factors
                  </p>
                  <ul className="space-y-2">
                    {route.aiAdvisory.risks.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-400 text-xs leading-relaxed">
                        <Icon name="alert" className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />{r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-violet-500/8 border border-violet-500/15">
                <p className="text-violet-300 text-xs font-semibold mb-1">AI Recommendation (Demo)</p>
                <p className="text-slate-300 text-xs leading-relaxed">{route.aiAdvisory.recommendation}</p>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-slate-600 text-xs">Route Confidence</p>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-violet-500"
                      style={{ width: `${route.aiAdvisory.confidence}%` }} />
                  </div>
                  <span className="text-violet-400 text-xs font-bold">{route.aiAdvisory.confidence}%</span>
                </div>
              </div>

              <p className="text-slate-600 text-[10px] mt-3 leading-relaxed">
                {route.aiAdvisory.disclaimer}
              </p>
            </div>
          </div>
        )}

        {/* ── CTA panel ───────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/8 bg-white/2 p-5 sm:p-7">
          <h3 className="text-white font-semibold text-sm mb-4">Ready to Continue?</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={openRealPWA}
              className="flex items-center gap-3 p-4 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors text-left group">
              <Icon name="map" className="w-5 h-5 text-white shrink-0" />
              <div>
                <p className="text-white font-semibold text-sm">Open Navigation PWA</p>
                <p className="text-violet-200 text-xs mt-0.5">Demo mode — no pairing code needed</p>
              </div>
            </button>

            <button onClick={() => go(ROUTES.DASHBOARD)}
              className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/3 hover:bg-white/7 transition-colors text-left group">
              <Icon name="layers" className="w-5 h-5 text-[#d4a017] shrink-0" />
              <div>
                <p className="text-white font-semibold text-sm">Route Planner Dashboard</p>
                <p className="text-slate-400 text-xs mt-0.5">Plan routes, manage vehicles</p>
              </div>
            </button>

            {installPrompt ? (
              <button onClick={installPWA}
                className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/8 hover:bg-emerald-500/12 transition-colors text-left">
                <Icon name="download" className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm">Install Navigation PWA</p>
                  <p className="text-emerald-400 text-xs mt-0.5">Add to Home Screen — no app store</p>
                </div>
              </button>
            ) : (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-white/6 bg-white/2 text-left">
                <Icon name="phone" className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-300 font-semibold text-sm">Install on Mobile</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                    <strong className="text-slate-400">iOS:</strong> Share → Add to Home Screen
                    <br /><strong className="text-slate-400">Android:</strong> ⋮ → Add to Home Screen
                  </p>
                </div>
              </div>
            )}

            <button onClick={() => go('/investor-safety')}
              className="flex items-center gap-3 p-4 rounded-xl border border-[#d4a017]/20 bg-[#d4a017]/5 hover:bg-[#d4a017]/10 transition-colors text-left group">
              <Icon name="shield" className="w-5 h-5 text-[#d4a017] shrink-0" />
              <div>
                <p className="text-white font-semibold text-sm">Investor & Safety Page</p>
                <p className="text-slate-400 text-xs mt-0.5">Bridge strike facts & grant readiness</p>
              </div>
            </button>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="text-center space-y-1 pb-8">
          <p className="text-slate-600 text-xs">
            Big V&apos;s Best Routes™ — Navigation PWA Demo
          </p>
          <p className="text-slate-700 text-[10px]">
            Powered by 4P3X Intelligent AI™ — Created by Kyzel Kreates™
          </p>
          <p className="text-slate-700 text-[10px]">
            Demo Mode shows the product. Live Mode runs the product.
          </p>
        </div>
      </div>
    </div>
  )
}

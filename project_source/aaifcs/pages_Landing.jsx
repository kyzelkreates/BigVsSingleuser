/**
 * ============================================================
 * Big V's Best Routes™ — Homepage / Landing Page
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 *
 * Run 14 — Full Homepage Rebuild
 *
 * READ-ONLY PAGE — No backend logic. No GPS. No auth.
 * No Supabase config. No demo/live mode changes.
 * All existing systems untouched.
 * ============================================================
 */

import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { ROUTES }              from './config_routes'

// ── Icon helper ───────────────────────────────────────────────
const ICON_PATHS = {
  shield:     'M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z',
  truck:      'M1 3h15v13H1V3zm15 4h4l3 3v6h-7V7zM5.5 17a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm13 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
  smartphone: 'M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM12 19h.01',
  map:        'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zm7-4v16m8-12v16',
  layers:     'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  route:      'M3 11l19-9-9 19-2-8-8-2z',
  zap:        'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  check:      'M20 6L9 17l-5-5',
  star:       'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  server:     'M2 2h20v8H2V2zm0 12h20v8H2v-8zm5 4h.01M5 6h.01',
  alert:      'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  info:       'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4v4m0 4h.01',
  brain:      'M12 5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m7 4c0 4.42-3.13 8.09-7 8.93C8.13 17.09 5 13.42 5 9V5.65C7.03 4.61 9.46 4 12 4s4.97.61 7 1.65V9z',
  download:   'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  arrow:      'M5 12h14M12 5l7 7-7 7',
  home:       'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  settings:   'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
}
function Icon({ name, className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={ICON_PATHS[name] || ICON_PATHS.star} />
    </svg>
  )
}

// ── Button ────────────────────────────────────────────────────
function Btn({ label, onClick, variant = 'primary', icon, small = false, full = false }) {
  const base = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl
    transition-all duration-200 focus:outline-none cursor-pointer select-none
    ${full ? 'w-full' : ''}
    ${small ? 'px-4 py-2.5 text-sm' : 'px-6 py-3.5 text-sm sm:text-base'}`
  const v = {
    primary:   'bg-[#d4a017] hover:bg-[#c49215] active:bg-[#b07f10] text-black shadow-lg shadow-[#d4a017]/20',
    green:     'bg-[#34d399]/15 hover:bg-[#34d399]/25 text-[#34d399] border border-[#34d399]/30',
    purple:    'bg-[#a78bfa]/15 hover:bg-[#a78bfa]/25 text-[#a78bfa] border border-[#a78bfa]/30',
    secondary: 'bg-white/6 hover:bg-white/12 text-white border border-white/12',
    ghost:     'border border-[#d4a017]/40 hover:border-[#d4a017]/80 text-[#d4a017] hover:bg-[#d4a017]/8',
    dark:      'bg-[#0d1426] hover:bg-[#131d35] text-white border border-white/10',
  }
  return (
    <button onClick={onClick} className={`${base} ${v[variant] || v.primary}`}>
      {icon && <Icon name={icon} className="w-4 h-4 shrink-0" />}
      <span>{label}</span>
    </button>
  )
}

// ── Divider ───────────────────────────────────────────────────
function Divider() {
  return <div className="max-w-7xl mx-auto px-6"><div className="border-t border-white/6" /></div>
}

// ── Stat pill ─────────────────────────────────────────────────
function Stat({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-display font-bold text-2xl sm:text-3xl text-[#d4a017]">{value}</span>
      <span className="text-slate-400 text-xs sm:text-sm text-center leading-tight">{label}</span>
    </div>
  )
}

// ── Feature pill ──────────────────────────────────────────────
function FeaturePill({ text }) {
  return (
    <div className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-lg px-3 py-2">
      <Icon name="check" className="w-3.5 h-3.5 text-[#34d399] shrink-0" />
      <span className="text-slate-300 text-xs sm:text-sm">{text}</span>
    </div>
  )
}

// ── Warning chip ──────────────────────────────────────────────
function WarnChip({ text, severity = 'high' }) {
  const c = severity === 'high'
    ? 'bg-red-500/8 border-red-500/25 text-red-300'
    : 'bg-amber-500/8 border-amber-500/25 text-amber-300'
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${c}`}>
      <Icon name="alert" className="w-3.5 h-3.5 shrink-0" />
      <span className="text-xs">{text}</span>
    </div>
  )
}

// ── Shortcut card (the big dashboard / PWA quick-access tiles) ─
function ShortcutCard({ icon, title, subtitle, desc, onClick, variant = 'default', badge }) {
  const bg = {
    gold:   'border-[#d4a017]/30 bg-[#d4a017]/6 hover:bg-[#d4a017]/10',
    green:  'border-[#34d399]/25 bg-[#34d399]/5 hover:bg-[#34d399]/10',
    purple: 'border-[#a78bfa]/25 bg-[#a78bfa]/5 hover:bg-[#a78bfa]/10',
    blue:   'border-sky-500/25 bg-sky-500/5 hover:bg-sky-500/10',
    default:'border-white/10 bg-white/3 hover:bg-white/7',
  }
  const ic = {
    gold:   'text-[#d4a017]',
    green:  'text-[#34d399]',
    purple: 'text-[#a78bfa]',
    blue:   'text-sky-400',
    default:'text-slate-300',
  }
  return (
    <button onClick={onClick}
      className={`relative w-full text-left rounded-2xl border p-5 sm:p-6 transition-all duration-200 group ${bg[variant] || bg.default}`}>
      {badge && (
        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full
          bg-[#d4a017]/20 text-[#d4a017] border border-[#d4a017]/30">
          {badge}
        </span>
      )}
      <Icon name={icon} className={`w-7 h-7 mb-3 ${ic[variant] || ic.default}`} />
      <p className="text-white font-bold text-base sm:text-lg leading-tight mb-1">{title}</p>
      {subtitle && <p className={`text-xs font-semibold mb-2 ${ic[variant] || 'text-slate-500'}`}>{subtitle}</p>}
      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{desc}</p>
      <div className={`mt-4 flex items-center gap-1.5 text-xs font-semibold ${ic[variant] || ic.default} opacity-70 group-hover:opacity-100 transition-opacity`}>
        Open <Icon name="arrow" className="w-3.5 h-3.5" />
      </div>
    </button>
  )
}

// ── PWA install accordion ─────────────────────────────────────
function PWAAccordion() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-white/8 overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-400 hover:text-white hover:bg-white/4 transition-colors">
        <span className="flex items-center gap-2"><Icon name="smartphone" className="w-4 h-4" /> How to install the Navigation PWA</span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 space-y-3 border-t border-white/6 bg-black/20">
          <div className="flex items-start gap-3">
            <span className="text-[#34d399] text-lg leading-none mt-0.5">📱</span>
            <div>
              <p className="text-[#34d399] font-semibold text-xs mb-1">Android / Chrome</p>
              <p className="text-slate-400 text-xs leading-relaxed">Open the Navigation PWA link → tap <strong className="text-white">⋮ menu</strong> → <em>"Add to Home screen"</em> or tap the install banner.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-[#d4a017] text-lg leading-none mt-0.5">🍎</span>
            <div>
              <p className="text-[#d4a017] font-semibold text-xs mb-1">iOS / Safari</p>
              <p className="text-slate-400 text-xs leading-relaxed">Open in Safari → tap <strong className="text-white">Share (□↑)</strong> → <em>"Add to Home Screen"</em> → <em>"Add"</em>.</p>
            </div>
          </div>
          <p className="text-slate-600 text-xs">Installed PWA runs full-screen, offline-capable — no app store required.</p>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  MAIN LANDING PAGE
// ══════════════════════════════════════════════════════════════
export default function Landing() {
  const navigate = useNavigate()
  const go = (r) => navigate(r)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])

  return (
    <div className="min-h-screen bg-[#070708] text-white font-sans overflow-x-hidden">

      {/* ── TOP NAV ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/6 bg-[#070708]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button onClick={() => go(ROUTES.LANDING)}
            className="font-display font-bold text-[#d4a017] text-sm sm:text-base hover:opacity-80 transition-opacity shrink-0">
            Big V&apos;s Best Routes™
          </button>
          <div className="flex items-center gap-2">
            <Btn label="Dashboard"   icon="layers"     variant="secondary" small onClick={() => go(ROUTES.DASHBOARD)} />
            <Btn label="PWA Demo"    icon="map"        variant="green"     small onClick={() => go(ROUTES.DRIVER_APP_DEMO)} />
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 py-20 overflow-hidden">

        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-[#d4a017]/5 blur-[140px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[250px] rounded-full bg-[#a78bfa]/5 blur-[100px]" />
          <div className="absolute top-1/2 right-1/4 w-[300px] h-[200px] rounded-full bg-[#34d399]/4 blur-[100px]" />
        </div>

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#d4a017]/30 bg-[#d4a017]/8 px-4 py-1.5 text-xs font-semibold text-[#d4a017] tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse inline-block" />
          Powered by 4P3X Intelligent AI™ — Created by Kyzel Kreates™
        </div>

        {/* Title */}
        <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-7xl text-white mb-3 leading-[1.05] tracking-tight max-w-4xl">
          Big V&apos;s Best Routes™
        </h1>
        <p className="text-[#d4a017] font-semibold text-base sm:text-xl mb-8 tracking-wide">
          Single User · Multi-Vehicle · Safe &amp; Legal Route Planner
        </p>

        {/* Hero description */}
        <p className="max-w-2xl text-slate-300 text-base sm:text-lg leading-relaxed mb-4">
          Route planning built around <span className="text-white font-semibold">your vehicle</span>, <span className="text-white font-semibold">your route</span>, and the <span className="text-[#d4a017] font-semibold">safety &amp; legal checks</span> that standard sat nav completely ignores.
        </p>
        <p className="max-w-xl text-slate-500 text-sm sm:text-base leading-relaxed mb-12">
          Built for single users with multiple vehicles — van drivers, motorhome owners, recovery drivers, trailer operators — who need smarter, safer, vehicle-aware routing.
        </p>

        {/* PRIMARY SHORTCUTS — hero */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <Btn label="Open Route Planner Dashboard" icon="layers"     variant="primary"   onClick={() => go(ROUTES.DASHBOARD)} />
          <Btn label="Navigation PWA Demo"          icon="map"        variant="green"     onClick={() => go(ROUTES.DRIVER_APP_DEMO)} />
          <Btn label="Torquay → Edinburgh Demo"     icon="route"      variant="secondary" onClick={() => go(ROUTES.DRIVER_APP_DEMO)} />
          <Btn label="Safety &amp; Investor Page"   icon="shield"     variant="ghost"     onClick={() => go(ROUTES.INVESTOR_SAFETY)} />
        </div>

        {/* PWA install hint */}
        <div className="max-w-sm w-full">
          <PWAAccordion />
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-600 text-xs animate-bounce">
          <span>Scroll to explore</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" />
          </svg>
        </div>
      </section>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — BRIDGE STRIKE FACTS (impact statement)
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-[#d4a017]/20 bg-[#d4a017]/4 p-7 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#d4a017] border border-[#d4a017]/30 rounded-full px-3 py-1 mb-4 uppercase tracking-wider">
              <Icon name="alert" className="w-3.5 h-3.5" /> Why vehicle-aware routing matters
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-3">
              Bridge Strikes Cost Everyone
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Standard sat nav doesn&apos;t know your vehicle height. It doesn&apos;t check bridge clearances, weight limits, or narrow road suitability. Big V&apos;s Best Routes™ does.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Stat value="1,666"  label="Bridge strikes — Network Rail 2024/25" />
            <Stat value="£13k"   label="Average cost per bridge strike incident" />
            <Stat value="150k+"  label="Delay minutes caused — 2023/24 season" />
            <Stat value="~£20m"  label="Estimated total annual UK impact" />
          </div>

          <p className="text-center text-slate-500 text-xs">
            Network Rail published data. Big V&apos;s Best Routes™ is designed to reduce bridge strike risk through vehicle-aware route planning. Advisory only — does not guarantee legal compliance.
          </p>
        </div>
      </section>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — QUICK ACCESS SHORTCUTS
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-3">Quick Access</h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Open any part of the platform directly from here.
          </p>
        </div>

        {/* TOP ROW — 2 big primary cards */}
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <ShortcutCard
            icon="layers"
            title="Route Planner Dashboard"
            subtitle="Main control centre"
            desc="Plan routes, manage your vehicle profiles, view safety scores, run compliance checks, and monitor all your saved routes in one place."
            variant="gold"
            badge="Main App"
            onClick={() => go(ROUTES.DASHBOARD)}
          />
          <ShortcutCard
            icon="map"
            title="Navigation PWA Demo"
            subtitle="Torquay → Edinburgh"
            desc="Open the demo Navigation PWA — no pairing code required. Shows the full driver experience: route summary, safety warnings, AI advisory, pre-trip checklist and live OSM map."
            variant="green"
            badge="Demo"
            onClick={() => go(ROUTES.DRIVER_APP_DEMO)}
          />
        </div>

        {/* BOTTOM ROW — 4 secondary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ShortcutCard
            icon="truck"
            title="My Vehicles"
            subtitle="Vehicle profiles"
            desc="Add, edit and manage vehicle profiles. Height, weight, width, length and legal fields used for route filtering."
            variant="purple"
            onClick={() => go(ROUTES.FLEET)}
          />
          <ShortcutCard
            icon="smartphone"
            title="Navigation PWA"
            subtitle="Live mode — pairing required"
            desc="Open the real Navigation PWA. Requires a pairing code from the dashboard for live trip sessions and job sync."
            variant="blue"
            onClick={() => go('/driver-app')}
          />
          <ShortcutCard
            icon="shield"
            title="Safety &amp; Investor Page"
            subtitle="Bridge strike · grant · architecture"
            desc="Investor readiness, bridge strike impact data, modular architecture overview and safety positioning."
            variant="gold"
            onClick={() => go(ROUTES.INVESTOR_SAFETY)}
          />
          <ShortcutCard
            icon="server"
            title="Backend &amp; Live Mode"
            subtitle="Provider config"
            desc="Configure Supabase, Firebase, AWS or REST backend. Switch between Demo Mode and Live Mode safely."
            variant="default"
            onClick={() => go(ROUTES.DEPLOYMENT)}
          />
        </div>
      </section>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 4 — WHAT IT IS / WHY IT WAS BUILT
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid gap-10 lg:grid-cols-2 items-start">

          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#a78bfa] border border-[#a78bfa]/30 rounded-full px-3 py-1 mb-5 uppercase tracking-wider">
              <Icon name="info" className="w-3.5 h-3.5" /> What it is
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-4 leading-tight">
              Route Planning That Knows Your Vehicle
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-4">
              Standard sat nav plans routes for cars. It doesn&apos;t know your van is 3.1m tall, 2.2m wide, 7.2m long, or weighs 3.5 tonnes. It sends you under bridges, down narrow lanes, and across weight-restricted roads.
            </p>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-4">
              Big V&apos;s Best Routes™ builds the route around your vehicle — checking height clearances, weight limits, width suitability, and road type before you set off. The 4P3X Intelligent AI™ layer adds advisory compliance scoring, risk warnings, and route confidence scoring on top.
            </p>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              It&apos;s designed for the single user who operates more than one vehicle and needs a planning tool that reflects that reality — not a consumer app built for someone in a hatchback.
            </p>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#34d399] border border-[#34d399]/30 rounded-full px-3 py-1 mb-2 uppercase tracking-wider">
              <Icon name="check" className="w-3.5 h-3.5" /> What it checks
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                'Vehicle height vs bridge clearance',
                'Vehicle weight vs weight restrictions',
                'Vehicle width vs road suitability',
                'Low bridge risk flagging',
                'Narrow road & rural lane risk',
                'Weak bridge avoidance',
                'Height restriction zones',
                'Route confidence scoring',
                'Safety score per route',
                'Legal suitability score',
                'Driver pre-trip checklist',
                'Advisory compliance panel',
                'Hazard markers on map',
                'Data freshness warnings',
                'Human override preserved',
                'Demo & live mode support',
              ].map(f => <FeaturePill key={f} text={f} />)}
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 5 — WHO IT IS FOR
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#d4a017] border border-[#d4a017]/30 rounded-full px-3 py-1 mb-4 uppercase tracking-wider">
            <Icon name="user" className="w-3.5 h-3.5" aria-hidden="true" /> Who it&apos;s for
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-3">
            Built for Single Users with Multiple Vehicles
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            You don&apos;t need a fleet manager. You need the right tool for the right vehicle, every trip.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: 'truck',      title: 'Van Drivers',          desc: 'Local, regional and long-distance van operators who need to know their route is safe for their specific van.' },
            { icon: 'home',       title: 'Motorhome Users',      desc: 'Motorhome and campervan owners navigating height-restricted roads, narrow lanes and rural routes.' },
            { icon: 'route',      title: 'Trailer Operators',    desc: 'Anyone towing a trailer, horsebox, boat, or car transport rig where width and weight matter.' },
            { icon: 'zap',        title: 'Recovery Drivers',     desc: 'Recovery and breakdown operators who need fast, safe routes for large recovery vehicles under time pressure.' },
            { icon: 'truck',      title: 'Delivery Drivers',     desc: 'Owner-drivers and small delivery operators running fixed or variable routes with specific vehicle constraints.' },
            { icon: 'star',       title: 'Small Operators',      desc: 'Any single user managing two or more different vehicles who needs per-vehicle route awareness, not one-size-fits-all nav.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-white/8 bg-white/3 p-5 hover:bg-white/6 transition-colors">
              <Icon name={icon} className="w-5 h-5 text-[#d4a017] mb-3" />
              <p className="text-white font-semibold text-sm mb-2">{title}</p>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 6 — ROUTE PLANNER DASHBOARD (feature detail)
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#d4a017] border border-[#d4a017]/30 rounded-full px-3 py-1 mb-5 uppercase tracking-wider">
              <Icon name="layers" className="w-3.5 h-3.5" /> Route Planner Dashboard
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-4 leading-tight">
              Your Planning &amp; Control Centre
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
              The Route Planner Dashboard is where you plan trips, manage your saved vehicles, run safety checks, view AI compliance scores, and prepare route sessions before sending them to the Navigation PWA.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                'Route planning & saving',
                'Vehicle profile management',
                'Safety score overview',
                'AI compliance advisory',
                'Demo & live mode toggle',
                'Navigation PWA pairing',
                'Trip session management',
                'Backend configuration',
              ].map(f => <FeaturePill key={f} text={f} />)}
            </div>
            <Btn label="Open Route Planner Dashboard" icon="layers" variant="primary" onClick={() => go(ROUTES.DASHBOARD)} />
          </div>

          <div className="rounded-2xl border border-[#d4a017]/20 bg-[#d4a017]/4 p-6 sm:p-8 space-y-4">
            <p className="text-[#d4a017] font-bold text-sm uppercase tracking-wider mb-2">Dashboard sections</p>
            {[
              { icon: 'truck',  title: 'My Vehicles',           desc: 'Saved vehicle profiles — height, weight, width, length, legal status.' },
              { icon: 'route',  title: 'Route Planner',         desc: 'Plan a route with vehicle-aware filtering and save it for navigation.' },
              { icon: 'shield', title: 'Safety & Compliance',   desc: 'AI compliance scoring, legal suitability checks, hazard review.' },
              { icon: 'map',    title: 'Navigation PWA Setup',  desc: 'Generate pairing codes, pair the mobile PWA, sync routes to driver.' },
              { icon: 'server', title: 'Backend & Live Mode',   desc: 'Configure Supabase/Firebase/REST, switch demo ↔ live, test connection.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#d4a017]/15 flex items-center justify-center shrink-0">
                  <Icon name={icon} className="w-4 h-4 text-[#d4a017]" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 7 — NAVIGATION PWA (feature detail)
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid gap-10 lg:grid-cols-2 items-center">

          <div className="order-2 lg:order-1 rounded-2xl border border-[#34d399]/20 bg-[#34d399]/4 p-6 sm:p-8 space-y-4">
            <p className="text-[#34d399] font-bold text-sm uppercase tracking-wider mb-2">PWA features</p>
            {[
              { icon: 'map',        title: 'Live OSM / Leaflet Map',   desc: 'Real-time map with route overlay, vehicle position, hazard markers.' },
              { icon: 'route',      title: 'Turn-by-Turn Navigation',  desc: 'Step-by-step directions with safety warnings inline.' },
              { icon: 'shield',     title: 'Safety Advisory Panel',    desc: 'Bridge, weight, width risk warnings shown before and during journey.' },
              { icon: 'zap',        title: 'AI Compliance Layer',      desc: '4P3X Intelligent AI™ advisory scoring — legal suitability, route confidence, risk summary.' },
              { icon: 'check',      title: 'Pre-Trip Checklist',       desc: 'Driver acknowledgement checklist before route is activated.' },
              { icon: 'download',   title: 'Installable PWA',          desc: 'Install on iOS or Android home screen — no app store. Offline capable.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#34d399]/15 flex items-center justify-center shrink-0">
                  <Icon name={icon} className="w-4 h-4 text-[#34d399]" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#34d399] border border-[#34d399]/30 rounded-full px-3 py-1 mb-5 uppercase tracking-wider">
              <Icon name="smartphone" className="w-3.5 h-3.5" /> Navigation PWA
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-4 leading-tight">
              The Mobile Driver Experience
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-4">
              The Navigation PWA is the on-the-move experience. Install it on your phone, pair it with the dashboard, and get a clean, focused mobile navigation interface purpose-built for your vehicle.
            </p>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
              In Demo Mode, no pairing code is needed — open it directly from here and see the full Torquay → Edinburgh demo route with live map, safety warnings, AI advisory, and driver checklist.
            </p>
            <div className="flex flex-wrap gap-3">
              <Btn label="Navigation PWA Demo"   icon="map"        variant="green"     onClick={() => go(ROUTES.DRIVER_APP_DEMO)} />
              <Btn label="Open Real PWA"         icon="smartphone" variant="secondary" onClick={() => go('/driver-app')} />
            </div>
            <div className="mt-4">
              <PWAAccordion />
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 8 — SAFETY & LEGAL ADVISORY
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-red-400 border border-red-400/30 rounded-full px-3 py-1 mb-4 uppercase tracking-wider">
            <Icon name="shield" className="w-3.5 h-3.5" /> Safety &amp; legal
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-3">
            What the System Warns You About
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Before and during every route, the system surfaces risk factors that standard sat nav ignores.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {[
            { text: 'Low bridge clearance risk',         severity: 'high' },
            { text: 'Weak bridge weight risk',           severity: 'high' },
            { text: 'Height restriction zones',          severity: 'high' },
            { text: 'Weight restriction roads',          severity: 'high' },
            { text: 'Narrow road & rural lane risk',     severity: 'medium' },
            { text: 'Unsuitable road type for vehicle',  severity: 'medium' },
            { text: 'Dangerous turn or junction risk',   severity: 'medium' },
            { text: 'Width restriction areas',           severity: 'medium' },
            { text: 'Data freshness & accuracy warnings', severity: 'medium' },
          ].map(w => <WarnChip key={w.text} {...w} />)}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Safety Score',        desc: 'Composite advisory score for the route based on vehicle profile and known hazard data.' },
            { label: 'Legal Suitability',   desc: 'Advisory score indicating how well the route suits the vehicle within known legal restrictions.' },
            { label: 'Route Confidence',    desc: 'System confidence level in the route data — lower when data is older or less verified.' },
          ].map(({ label, desc }) => (
            <div key={label} className="rounded-xl border border-white/8 bg-white/3 p-5 text-center">
              <p className="text-[#d4a017] font-bold text-sm mb-2">{label}</p>
              <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-amber-500/25 bg-amber-500/6 p-5">
          <div className="flex items-start gap-3">
            <Icon name="shield" className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-semibold text-sm mb-1">Important: Advisory Only</p>
              <p className="text-amber-300/70 text-xs leading-relaxed">
                Big V&apos;s Best Routes™ is advisory route-planning support software. It does not guarantee legal compliance, route safety, or suitability for your specific vehicle. The driver and operator retain full responsibility for all route decisions. Always follow road signs, official restrictions, police instructions, and real-world conditions regardless of what any route planner shows.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 9 — DEMO vs LIVE MODE
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-3">
            Demo Mode &amp; Live Mode
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Demo Mode shows the product. Live Mode runs the product.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 mb-8">
          <div className="rounded-2xl border border-[#34d399]/20 bg-[#34d399]/4 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
              <p className="text-[#34d399] font-bold text-sm uppercase tracking-wider">Demo Mode</p>
            </div>
            <ul className="space-y-2">
              {[
                'Uses local & demo route data — no backend required',
                'Navigation PWA opens without a pairing code',
                'Torquay → Edinburgh demo route preloaded',
                'All safety & AI advisory panels functional',
                'Safe for investor demos and presentations',
                'No API keys or live data providers needed',
                'Full product visible and explorable',
              ].map(i => (
                <li key={i} className="flex items-start gap-2 text-slate-300 text-xs leading-relaxed">
                  <Icon name="check" className="w-3.5 h-3.5 text-[#34d399] mt-0.5 shrink-0" />{i}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#a78bfa]/20 bg-[#a78bfa]/4 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#a78bfa]" />
              <p className="text-[#a78bfa] font-bold text-sm uppercase tracking-wider">Live Mode</p>
            </div>
            <ul className="space-y-2">
              {[
                'Connects to configured backend (Supabase / Firebase / AWS / REST)',
                'Real route data from configured providers',
                'Navigation PWA requires pairing code from dashboard',
                'Live trip sessions and driver sync active',
                'Row-level security (RLS) enforced on all data',
                'Full sync: routes, jobs, telemetry, reports',
                'Switch between demo and live at any time',
              ].map(i => (
                <li key={i} className="flex items-start gap-2 text-slate-300 text-xs leading-relaxed">
                  <Icon name="check" className="w-3.5 h-3.5 text-[#a78bfa] mt-0.5 shrink-0" />{i}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <Btn label="Configure Backend & Live Mode" icon="server" variant="ghost" onClick={() => go(ROUTES.DEPLOYMENT)} />
        </div>
      </section>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 10 — MODULAR ARCHITECTURE
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid gap-10 lg:grid-cols-2 items-start">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#a78bfa] border border-[#a78bfa]/30 rounded-full px-3 py-1 mb-5 uppercase tracking-wider">
              <Icon name="layers" className="w-3.5 h-3.5" /> 4P3X Verse™ Modular Architecture
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-4 leading-tight">
              Built Once. Refactored Many Times.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-4">
              Big V&apos;s Best Routes™ is part of the 4P3X Verse™ — a modular product architecture where one structured base can be refactored into multiple sector-ready products.
            </p>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-4">
              The same dashboard + PWA + AI advisory + demo/live mode + backend config pattern used here can be adapted into safety inspection tools, delivery management systems, field-service apps, compliance reporting platforms, and more — without rebuilding from scratch.
            </p>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Each variant inherits the core architecture and adapts only what needs to change for that sector.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              { icon: 'truck',      label: 'Vehicle-Aware Route Planning',    desc: 'This product — Big V\'s Best Routes™' },
              { icon: 'shield',     label: 'Safety Inspection Platform',       desc: 'Field-based safety audit & evidence reporting' },
              { icon: 'route',      label: 'Delivery Management System',       desc: 'Owner-driver delivery optimisation & tracking' },
              { icon: 'zap',        label: 'AI Compliance Reporting',          desc: 'Sector compliance, documentation & advisory tools' },
              { icon: 'brain',      label: 'Field Operations Navigator',       desc: 'Navigation + job dispatch for field-service workers' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4 rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="w-8 h-8 rounded-lg bg-[#a78bfa]/15 flex items-center justify-center shrink-0">
                  <Icon name={icon} className="w-4 h-4 text-[#a78bfa]" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
            <Btn label="Investor, Safety & Architecture Overview" icon="star" variant="ghost" onClick={() => go(ROUTES.INVESTOR_SAFETY)} />
          </div>
        </div>
      </section>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 11 — BOTTOM SHORTCUT LAUNCHPAD
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-3">
            Jump Straight In
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Every section of the platform is one tap away.
          </p>
        </div>

        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { label: 'Route Planner Dashboard', icon: 'layers',     variant: 'primary',   route: ROUTES.DASHBOARD,        desc: 'Main control centre' },
            { label: 'Navigation PWA Demo',      icon: 'map',        variant: 'green',     route: ROUTES.DRIVER_APP_DEMO,  desc: 'Torquay → Edinburgh' },
            { label: 'My Vehicles',              icon: 'truck',      variant: 'secondary', route: ROUTES.FLEET,            desc: 'Vehicle profiles' },
            { label: 'Route Safety AI',          icon: 'shield',     variant: 'secondary', route: ROUTES.SAFETY,           desc: 'AI safety scoring' },
            { label: 'Legal Awareness',          icon: 'check',      variant: 'secondary', route: ROUTES.COMPLIANCE,       desc: 'Compliance checks' },
            { label: 'Journey Analytics',        icon: 'star',       variant: 'secondary', route: ROUTES.ANALYTICS,        desc: 'Trip reports' },
            { label: 'Safety & Investor Page',   icon: 'star',       variant: 'ghost',     route: ROUTES.INVESTOR_SAFETY,  desc: 'Bridge strike data' },
            { label: 'Backend & Live Mode',      icon: 'server',     variant: 'ghost',     route: ROUTES.DEPLOYMENT,       desc: 'Config & live mode' },
          ].map(({ label, icon, variant, route, desc }) => (
            <button key={label} onClick={() => go(route)}
              className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all duration-150 group
                ${variant === 'primary'
                  ? 'border-[#d4a017]/30 bg-[#d4a017]/8 hover:bg-[#d4a017]/14'
                  : variant === 'green'
                  ? 'border-[#34d399]/25 bg-[#34d399]/6 hover:bg-[#34d399]/12'
                  : variant === 'ghost'
                  ? 'border-[#d4a017]/20 bg-transparent hover:bg-[#d4a017]/6'
                  : 'border-white/8 bg-white/3 hover:bg-white/7'}`}>
              <Icon name={icon}
                className={`w-5 h-5 ${variant === 'primary' ? 'text-[#d4a017]' : variant === 'green' ? 'text-[#34d399]' : variant === 'ghost' ? 'text-[#d4a017]' : 'text-slate-400'}`} />
              <div>
                <p className="text-white font-semibold text-xs sm:text-sm leading-tight">{label}</p>
                <p className="text-slate-600 text-[10px] mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/6 bg-black/30 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-8">
            <div>
              <p className="font-display font-bold text-[#d4a017] text-base mb-1">Big V&apos;s Best Routes™</p>
              <p className="text-slate-500 text-xs">Single User Multi-Vehicle Safe &amp; Legal Route Planner</p>
              <p className="text-slate-600 text-xs mt-1">Powered by 4P3X Intelligent AI™ — Created by Kyzel Kreates™</p>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-end gap-2">
              <button onClick={() => go(ROUTES.DASHBOARD)}       className="text-xs text-slate-500 hover:text-[#d4a017] transition-colors px-2">Dashboard</button>
              <button onClick={() => go(ROUTES.DRIVER_APP_DEMO)} className="text-xs text-slate-500 hover:text-[#34d399] transition-colors px-2">Navigation Demo</button>
              <button onClick={() => go(ROUTES.INVESTOR_SAFETY)} className="text-xs text-slate-500 hover:text-[#d4a017] transition-colors px-2">Investor Page</button>
              <button onClick={() => go(ROUTES.DEPLOYMENT)}      className="text-xs text-slate-500 hover:text-white   transition-colors px-2">Live Mode</button>
              <button onClick={() => go('/driver-app')}          className="text-xs text-slate-500 hover:text-[#34d399] transition-colors px-2">Navigation PWA</button>
            </div>
          </div>

          <div className="border-t border-white/6 pt-6">
            <p className="text-slate-700 text-[10px] leading-relaxed text-center max-w-3xl mx-auto">
              Advisory software only. Big V&apos;s Best Routes™ does not guarantee legal compliance, route safety, or vehicle suitability. The driver and operator retain full responsibility for all route decisions. Always follow road signs, official restrictions, and real-world conditions. Network Rail bridge strike data referenced for informational purposes. Demo data is not live routing data.
            </p>
            <p className="text-slate-800 text-[10px] text-center mt-3">
              © 2026 Kyzel Kreates™ · Big V&apos;s Best Routes™ · 4P3X Verse™ · 4P3X Intelligent AI™
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}

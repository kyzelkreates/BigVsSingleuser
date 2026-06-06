/**
 * ============================================================
 * Big V's Best Routes™ — Premium Landing Page
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 *
 * Run 13 — Homepage / Project Explainer Upgrade
 *
 * CONTENT + UI + NAVIGATION SHORTCUT UPGRADE ONLY.
 * No backend logic. No demo/live logic. No map/GPS logic.
 * No Supabase config. No auth/session logic.
 * Read-only page — all existing systems untouched.
 * ============================================================
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from './config_routes'

// ─── Icon helper (inline SVG paths to avoid Lucide import bloat) ──────────────
function Icon({ name, className = 'w-5 h-5' }) {
  const icons = {
    shield:     'M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z',
    truck:      'M1 3h15v13H1V3zm15 4h4l3 3v6h-7V7zM5.5 17a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm13 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
    smartphone: 'M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM12 19h.01',
    brain:      'M12 2a4 4 0 0 1 4 4c2.21 0 4 1.79 4 4s-1.79 4-4 4H8a4 4 0 0 1-4-4c0-2.21 1.79-4 4-4a4 4 0 0 1 4-4z',
    route:      'M3 11l19-9-9 19-2-8-8-2z',
    layers:     'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    zap:        'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    check:      'M20 6L9 17l-5-5',
    arrow:      'M5 12h14M12 5l7 7-7 7',
    star:       'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    user:       'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    server:     'M2 2h20v8H2V2zm0 12h20v8H2v-8zm5 4h.01M5 6h.01',
    download:   'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    info:       'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4v4m0 4h.01',
    map:        'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zm7-4v16m8-12v16',
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={icons[name] || icons.star} />
    </svg>
  )
}

// ─── Reusable card ────────────────────────────────────────────────────────────
function Card({ children, className = '', gold = false, purple = false }) {
  const border = gold ? 'border-[#d4a017]/30' : purple ? 'border-[#a78bfa]/25' : 'border-white/8'
  return (
    <div className={`rounded-xl border bg-white/3 backdrop-blur-sm p-5 ${border} ${className}`}>
      {children}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ id, children, className = '' }) {
  return (
    <section id={id} className={`py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto ${className}`}>
      {children}
    </section>
  )
}

// ─── Section heading ──────────────────────────────────────────────────────────
function Heading({ title, subtitle, gold = false }) {
  return (
    <div className="mb-10 text-center">
      <h2 className={`text-2xl sm:text-3xl font-display font-bold mb-3 ${gold ? 'text-[#d4a017]' : 'text-white'}`}>
        {title}
      </h2>
      {subtitle && <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">{subtitle}</p>}
    </div>
  )
}

// ─── CTA Button ───────────────────────────────────────────────────────────────
function CTAButton({ label, onClick, variant = 'primary', icon, small = false }) {
  const base = 'inline-flex items-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent cursor-pointer select-none'
  const size = small ? 'px-4 py-2 text-sm' : 'px-5 py-3 text-sm sm:text-base'
  const styles = {
    primary:  'bg-[#d4a017] hover:bg-[#b8860b] text-black focus:ring-[#d4a017]',
    secondary:'bg-white/8 hover:bg-white/14 text-white border border-white/15 focus:ring-white/30',
    purple:   'bg-[#a78bfa]/15 hover:bg-[#a78bfa]/25 text-[#a78bfa] border border-[#a78bfa]/30 focus:ring-[#a78bfa]',
    green:    'bg-[#34d399]/15 hover:bg-[#34d399]/25 text-[#34d399] border border-[#34d399]/30 focus:ring-[#34d399]',
    ghost:    'text-[#d4a017] hover:text-white border border-[#d4a017]/40 hover:border-[#d4a017] focus:ring-[#d4a017]',
  }
  return (
    <button onClick={onClick} className={`${base} ${size} ${styles[variant] || styles.primary}`}>
      {icon && <Icon name={icon} className="w-4 h-4 shrink-0" />}
      <span>{label}</span>
    </button>
  )
}

// ─── PWA Install Guide ─────────────────────────────────────────────────────────
function PWAInstallGuide() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="text-xs text-slate-400 hover:text-[#d4a017] underline underline-offset-2 transition-colors"
      >
        {open ? 'Hide install guide ▲' : 'How to install ▼'}
      </button>
      {open && (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-4 text-xs text-slate-300 space-y-3">
          <div>
            <p className="text-[#34d399] font-semibold mb-1">📱 Android / Chrome</p>
            <p>Open the Navigation PWA link in Chrome → tap the ⋮ menu → <em>"Add to Home screen"</em> or look for the install banner at the bottom of the screen.</p>
          </div>
          <div>
            <p className="text-[#d4a017] font-semibold mb-1">🍎 iOS / Safari</p>
            <p>Open the Navigation PWA link in Safari → tap the <em>Share button (□↑)</em> → scroll down → tap <em>"Add to Home Screen"</em> → tap <em>"Add"</em>.</p>
          </div>
          <p className="text-slate-500 mt-2 leading-relaxed">
            Once installed, the Navigation PWA appears on your home screen and runs in standalone mode — no browser chrome, full screen, ready for use on the move.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main Landing Page ─────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()

  // Scroll to top on mount
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])

  const go = (route) => navigate(route)

  // ── SECTION 1 — HERO ──────────────────────────────────────────────────────
  const Hero = () => (
    <section className="relative min-h-[92vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-[#d4a017]/6 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[200px] rounded-full bg-[#a78bfa]/6 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[250px] h-[180px] rounded-full bg-[#34d399]/5 blur-[100px]" />
      </div>

      {/* Badge */}
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4a017]/30 bg-[#d4a017]/8 px-4 py-1.5 text-xs font-semibold text-[#d4a017] tracking-wider uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse inline-block" />
        Powered by 4P3X Intelligent AI™ — Created by Kyzel Kreates™
      </div>

      {/* Title */}
      <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-2 leading-tight tracking-tight">
        Big V&apos;s Best Routes™
      </h1>
      <p className="text-[#d4a017] font-semibold text-base sm:text-lg mb-6 tracking-wide">
        Safety &amp; Legal Compliance First Route Planning Platform
      </p>

      {/* Hero body */}
      <p className="max-w-2xl text-slate-300 text-base sm:text-lg leading-relaxed mb-4">
        Route planning built around the <span className="text-white font-semibold">vehicle</span>, the <span className="text-white font-semibold">driver</span>, the <span className="text-white font-semibold">route</span>, and the <span className="text-[#d4a017] font-semibold">safety &amp; legal checks</span> that ordinary navigation tools often miss.
      </p>
      <p className="max-w-xl text-slate-400 text-sm sm:text-base leading-relaxed mb-10">
        Big V&apos;s Best Routes™ combines vehicle profiles, route planning, driver workflow, advisory compliance checks, live and demo modes, and an installable Navigation PWA — all in one structured platform.
      </p>
      <p className="max-w-xl text-[#d4a017]/75 text-xs sm:text-sm leading-relaxed mb-10 font-medium">
        Built for single users with multiple vehicles who need safer, more suitable route planning than standard sat nav can provide.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <CTAButton label="Open Control Dashboard" icon="layers" variant="primary"    onClick={() => go(ROUTES.DASHBOARD)} />
        <CTAButton label="Open Navigation PWA"         icon="smartphone" variant="green" onClick={() => go('/driver-app')} />
        <CTAButton label="Route Planner"           icon="route" variant="secondary"  onClick={() => go(ROUTES.DISPATCH)} />
        <CTAButton label="Backend / Live Mode"     icon="server" variant="ghost"     onClick={() => go(ROUTES.DEPLOYMENT)} />
      </div>

      {/* PWA install hint */}
      <div className="mb-6">
        <PWAInstallGuide />
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-500 text-xs animate-bounce">
        <span>Scroll to explore</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
      </div>
    </section>
  )

  // ── SECTION 2 — WHY IT WAS BUILT ──────────────────────────────────────────
  const WhyBuilt = () => (
    <Section id="why">
      <Heading
        title="Why Big V's Best Routes™ Was Built"
        subtitle="Standard navigation apps are usually designed for ordinary cars and basic A-to-B travel."
        gold
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Card gold>
          <h3 className="text-white font-semibold text-base mb-3 flex items-center gap-2">
            <Icon name="info" className="w-4 h-4 text-[#d4a017]" />
            The Gap in Mainstream Navigation
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-3">
            Most mainstream navigation platforms are not built around detailed vehicle-specific compliance workflows. They do not always consider the real-world needs of vans, larger vehicles, work vehicles, delivery vehicles, mixed vehicle use, restricted routes, or legal-sensitive routing.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Driver evidence, route assignment, trip reporting, and operational safety typically live across multiple disconnected tools — or are not captured at all.
          </p>
        </Card>
        <Card gold>
          <h3 className="text-white font-semibold text-base mb-3 flex items-center gap-2">
            <Icon name="shield" className="w-4 h-4 text-[#34d399]" />
            A Structured Planning Layer
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-3">
            Big V&apos;s Best Routes™ is designed to add a safety-first planning layer around route decisions — bringing vehicle profile, route suitability, driver workflow, trip session, reporting, and safety/legal advisory checks together in one structured place.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            It is advisory support software, not a replacement for professional judgement. The driver and operator always retain responsibility for final decisions.
          </p>
        </Card>
      </div>
    </Section>
  )

  // ── SECTION 3 — WHO IT HELPS ───────────────────────────────────────────────
  const personas = [
    { icon: 'truck',      label: 'Van & Delivery Drivers',     desc: 'Plan safer routes for specific vehicle sizes, load types, and time-sensitive deliveries.' },
    { icon: 'user',       label: 'Single Operators',           desc: 'Manage multiple vehicles from one dashboard without needing enterprise fleet software.' },
    { icon: 'star',       label: 'Multi-Vehicle Operators',         desc: 'Plan routes, track trips, and maintain evidence-style records across multiple vehicles.' },
    { icon: 'check',      label: 'Trade & Mobile Businesses',  desc: 'Plan work routes that factor in vehicle type, access, and daily job assignments.' },
    { icon: 'map',        label: 'Route Planners',             desc: 'Build and review route plans with vehicle-aware safety and compliance advisory checks.' },
    { icon: 'shield',     label: 'Compliance-Conscious Ops',   desc: 'Maintain route evidence, check missing legal-critical data, and track driver acknowledgements.' },
    { icon: 'smartphone', label: 'Field & Mobile Workers',     desc: 'Receive assigned routes on a mobile-installable PWA and submit reports from anywhere.' },
    { icon: 'layers',     label: 'Anyone Needing Clarity',     desc: 'Build a clearer record of vehicle-aware planning and trip evidence beyond standard apps.' },
  ]
  const WhoItHelps = () => (
    <Section id="who">
      <Heading title="Who It Helps" subtitle="Built for operators who need more than a standard navigation app." />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {personas.map(({ icon, label, desc }) => (
          <Card key={label} className="flex flex-col gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#d4a017]/12 flex items-center justify-center shrink-0">
              <Icon name={icon} className="w-4 h-4 text-[#d4a017]" />
            </div>
            <p className="text-white font-semibold text-sm">{label}</p>
            <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
          </Card>
        ))}
      </div>
    </Section>
  )

  // ── SECTION 4 — CONTROL DASHBOARD ─────────────────────────────────────────
  const dashFeatures = [
    'Manage and store multiple vehicle profiles',
    'Plan routes with vehicle-aware advisory checks',
    'Review safety and legal compliance status',
    'Send selected routes to the Navigation PWA',
    'Monitor route assignments and trip sessions',
    'Review driver reports and trip evidence',
    'View sync and live backend status',
    'Manage Demo Mode and Live Mode settings',
    'Prepare evidence-style operational records',
    'Use 4P3X Intelligent AI™ advisory checks',
  ]
  const Dashboard_ = () => (
    <Section id="dashboard">
      <div className="grid gap-8 lg:grid-cols-2 items-center">
        <div>
          <div className="inline-block text-xs font-semibold text-[#d4a017] border border-[#d4a017]/30 rounded-full px-3 py-1 mb-4">Control Dashboard</div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-4">What the Control Dashboard Does</h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            The Control Dashboard is the operator&apos;s central command centre. Manage your vehicles, plan routes, monitor your drivers, review trip sessions, and control your backend configuration — all from one responsive interface.
          </p>
          <CTAButton label="Open Control Dashboard" icon="layers" variant="primary" onClick={() => go(ROUTES.DASHBOARD)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dashFeatures.map(f => (
            <div key={f} className="flex items-start gap-2 p-3 rounded-lg border border-white/6 bg-white/2">
              <Icon name="check" className="w-3.5 h-3.5 text-[#34d399] shrink-0 mt-0.5" />
              <span className="text-slate-300 text-xs leading-relaxed">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )

  // ── SECTION 5 — DRIVER PWA ─────────────────────────────────────────────────
  const pwaFeatures = [
    'Receive assigned routes on mobile',
    'Open a mobile-first, touch-optimised driver view',
    'Start and manage trip sessions',
    'Follow the safe navigation workflow',
    'Update trip status in real time',
    'Submit driver reports and notes',
    'Record issues and incidents on the road',
    'Install as a standalone PWA on any device',
    'Work with Demo Mode locally — no backend needed',
    'Connect to Live Mode when backend is configured',
  ]
  const DriverPWA_ = () => (
    <Section id="driver-pwa">
      <div className="grid gap-8 lg:grid-cols-2 items-center">
        <div className="order-2 lg:order-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pwaFeatures.map(f => (
            <div key={f} className="flex items-start gap-2 p-3 rounded-lg border border-[#34d399]/12 bg-[#34d399]/3">
              <Icon name="smartphone" className="w-3.5 h-3.5 text-[#34d399] shrink-0 mt-0.5" />
              <span className="text-slate-300 text-xs leading-relaxed">{f}</span>
            </div>
          ))}
        </div>
        <div className="order-1 lg:order-2">
          <div className="inline-block text-xs font-semibold text-[#34d399] border border-[#34d399]/30 rounded-full px-3 py-1 mb-4">Navigation PWA</div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-4">What the Navigation PWA Does</h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
            The Navigation PWA is the mobile route experience. It runs as an installable Progressive Web App — no app store required — and gives you a clean, focused mobile interface for opening routes, running trip sessions, and submitting reports.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Offline live actions may be saved locally only where supported, and require reconnection to sync. Demo Mode works fully without a backend.
          </p>
          <div className="flex flex-wrap gap-3">
            <CTAButton label="Open Navigation PWA" icon="smartphone" variant="green"  onClick={() => go('/driver-app')} />
            <CTAButton label="Navigation PWA Setup" icon="zap"       variant="secondary" onClick={() => go(ROUTES.DRIVER_SETUP)} />
          </div>
          <div className="mt-4">
            <PWAInstallGuide />
          </div>
        </div>
      </div>
    </Section>
  )

  // ── SECTION 6 — SAFETY & LEGAL ADVISORY ───────────────────────────────────
  const safetyBullets = [
    { label: 'Vehicle-aware planning',               desc: 'Route decisions informed by vehicle dimensions, type, and legal profile.' },
    { label: 'Missing vehicle information warnings', desc: 'Alerts when legal-critical fields are absent from the vehicle record.' },
    { label: 'Route restriction awareness',          desc: 'Where data is available, restriction indicators are surfaced for review.' },
    { label: 'Driver/operator acknowledgement',      desc: 'Drivers must acknowledge route safety checks before starting a trip.' },
    { label: 'Data freshness warnings',              desc: 'Indicators flag when data may be stale or from an outdated source.' },
    { label: 'Route confidence warnings',            desc: 'Advisory scores reflect planning completeness — not guaranteed safety.' },
    { label: 'Evidence and report capture',          desc: 'Trip sessions, driver reports, and incident records provide evidence trails.' },
    { label: 'Human review and override',            desc: 'All checks are advisory. Human review and override are always required.' },
    { label: 'Advisory AI checks',                   desc: '4P3X Intelligent AI™ analyses route and vehicle data to surface risks.' },
    { label: 'Clear responsibility boundaries',      desc: 'The platform does not remove the driver/operator\'s legal responsibility.' },
  ]
  const SafetySection = () => (
    <Section id="safety">
      <div className="rounded-2xl border border-[#34d399]/20 bg-[#34d399]/3 p-6 sm:p-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-4 py-1.5 text-xs font-semibold text-[#34d399] tracking-wider uppercase mb-4">
            <Icon name="shield" className="w-3.5 h-3.5" />
            Safety &amp; Legal Advisory Layer
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-3">Built Around Safety-First Route Planning</h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Big V&apos;s Best Routes™ is designed to check route decisions against available vehicle information, route suitability indicators, missing legal-critical data, driver acknowledgements, route confidence, backend sync status, and report evidence.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {safetyBullets.map(({ label, desc }) => (
            <div key={label} className="rounded-lg border border-[#34d399]/15 bg-black/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="check" className="w-3.5 h-3.5 text-[#34d399] shrink-0" />
                <span className="text-white font-semibold text-xs">{label}</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        {/* Hard disclaimer */}
        <div className="rounded-xl border border-[#fbbf24]/25 bg-[#fbbf24]/5 p-5">
          <p className="text-[#fbbf24] text-xs sm:text-sm font-semibold mb-2">⚠️ Advisory Disclaimer — Please Read</p>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-2">
            Big V&apos;s Best Routes™ is advisory route-planning support software. It does not guarantee legal compliance, does not replace professional judgement, and does not remove the driver&apos;s or operator&apos;s responsibility to check route suitability, restrictions, signage, and applicable laws.
          </p>
          <p className="text-slate-400 text-xs leading-relaxed">
            Backend connectivity, AI checks, map data, and route provider responses can support decision-making, but they do not guarantee that a route is legal, safe, or suitable in every real-world situation. Human review and override are always required.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <CTAButton label="View Route Safety AI" icon="shield" variant="green"    onClick={() => go(ROUTES.SAFETY)} />
          <CTAButton label="Legal Awareness"       icon="check" variant="secondary" onClick={() => go(ROUTES.COMPLIANCE)} />
        </div>
      </div>
    </Section>
  )

  // ── SECTION 7 — DEMO VS LIVE MODE ─────────────────────────────────────────
  const DemoLive = () => (
    <Section id="demo-live">
      <Heading
        title={`"Demo Mode shows the product. Live Mode runs the product."`}
        subtitle="Two clear operational states — one for exploring, one for running."
        gold
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="border-[#fbbf24]/20 bg-[#fbbf24]/3">
          <div className="inline-block text-xs font-semibold text-[#fbbf24] border border-[#fbbf24]/30 rounded-full px-3 py-1 mb-4">Demo Mode</div>
          <ul className="space-y-2 mb-4">
            {[
              'Uses safe sample and local data only',
              'Does not require any backend setup',
              'Lets investors, users, and testers understand the product',
              'Shows the full dashboard and Navigation PWA workflow',
              'Never sends demo records to Supabase or any backend',
              'Does not start realtime subscriptions',
              'Ideal for exploring, testing, and investor demos',
            ].map(t => (
              <li key={t} className="flex items-start gap-2 text-xs text-slate-300">
                <Icon name="check" className="w-3.5 h-3.5 text-[#fbbf24] shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="border-[#34d399]/20 bg-[#34d399]/3">
          <div className="inline-block text-xs font-semibold text-[#34d399] border border-[#34d399]/30 rounded-full px-3 py-1 mb-4">Live Mode</div>
          <ul className="space-y-2 mb-4">
            {[
              'Activated when Demo Mode is switched off',
              'Requires Supabase or another backend configuration',
              'Uses real backend records — separate from demo data',
              'Supports real users, authentication, and persistence',
              'Enables live sync and realtime subscriptions where configured',
              'Never mixes demo records with real operational records',
              'Backend must be configured before Live Mode activates',
            ].map(t => (
              <li key={t} className="flex items-start gap-2 text-xs text-slate-300">
                <Icon name="check" className="w-3.5 h-3.5 text-[#34d399] shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="mt-5 flex justify-center">
        <CTAButton label="Open Backend / Live Mode Settings" icon="server" variant="ghost" onClick={() => go(ROUTES.DEPLOYMENT)} />
      </div>
    </Section>
  )

  // ── SECTION 8 — MODULAR BASE ARCHITECTURE ────────────────────────────────
  const ModularBase = () => (
    <Section id="architecture">
      <div className="rounded-2xl border border-[#a78bfa]/20 bg-[#a78bfa]/3 p-6 sm:p-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#a78bfa]/30 bg-[#a78bfa]/10 px-4 py-1.5 text-xs font-semibold text-[#a78bfa] tracking-wider uppercase mb-4">
            <Icon name="layers" className="w-3.5 h-3.5" />
            Modular Base Architecture
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-3">
            One Architecture. Many Products.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Big V&apos;s Best Routes™ is not just one app. It is part of the Kyzel Kreates™ modular product architecture — a reusable base structure that can be refactored into specialist platforms across many industries.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {[
            { label: 'Dashboard + PWA + AI',        desc: 'The Control Dashboard, Navigation PWA, and AI advisory layer can all be reused across product variants.' },
            { label: 'Demo / Live Mode Strategy',    desc: 'Every variant can include a safe Demo Mode for testing and a backend-ready Live Mode for real operation.' },
            { label: 'Backend-Ready by Default',     desc: 'Supabase configuration, RLS, and realtime are built into the base — ready to connect or configure per product.' },
            { label: 'Controlled Refactoring',       desc: 'New products are created by changing the data model, branding, workflows, and roles — not rebuilding from scratch.' },
            { label: 'Reusable Reporting Layer',     desc: 'Trip sessions, driver reports, incident capture, and evidence trails are built into the base and reusable.' },
            { label: '4P3X Verse™ Ecosystem',        desc: 'Each product variant becomes part of the wider 4P3X Verse™ — a growing suite of AI-powered operational tools.' },
          ].map(({ label, desc }) => (
            <div key={label} className="rounded-lg border border-[#a78bfa]/15 bg-black/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="zap" className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
                <span className="text-white font-semibold text-xs">{label}</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[#a78bfa]/20 bg-black/20 p-5">
          <p className="text-[#a78bfa] font-semibold text-xs sm:text-sm mb-3">Architecture Statement</p>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Big V&apos;s Best Routes™ demonstrates how a modular base can become a specialist route-planning platform through controlled refactoring. The same architecture pattern can be adapted into many other products while preserving the core dashboard, PWA, AI guidance, demo/live mode, reporting, and backend-ready structure.
          </p>
        </div>
      </div>
    </Section>
  )

  // ── SECTION 9 — POSSIBLE REFACTORS ────────────────────────────────────────
  const refactors = [
    { label: 'Field Service Route OS™',              desc: 'Route planning and job assignment for field service engineers and mobile technicians.' },
    { label: 'Delivery Compliance Planner™',         desc: 'Compliance-aware route planning for last-mile and parcel delivery operations.' },
    { label: 'Mobile Worker Safety OS™',             desc: 'Safety-first workflow management for lone workers and mobile site operatives.' },
    { label: 'Inspection Route Manager™',            desc: 'Structured route and inspection workflow tool for regulatory compliance visits.' },
    { label: 'Community Response Route Planner™',    desc: 'Volunteer and community responder route coordination and trip evidence system.' },
    { label: 'Contractor Job Route Planner™',        desc: 'Multi-site contractor job management with route planning and evidence capture.' },
    { label: 'Event Logistics Route OS™',            desc: 'Event logistics planning, driver coordination, and vehicle-aware route management.' },
    { label: 'Local Authority Route Support™',       desc: 'Advisory route support for local authority vehicles, maintenance, and welfare services.' },
    { label: 'Vehicle Evidence & Trip Reporting OS™',desc: 'Trip evidence capture and reporting system for insurance, compliance, and operations.' },
    { label: 'Multi-Site Operations Planner™',       desc: 'Cross-site vehicle coordination and operational route planning for multi-location businesses.' },
  ]
  const Refactors = () => (
    <Section id="refactors">
      <Heading
        title="Possible Product Refactors"
        subtitle="The same modular base — adapted for different industries and use cases. These are indicative product directions, not all currently live products."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {refactors.map(({ label, desc }) => (
          <Card key={label} purple className="flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#a78bfa]/12 flex items-center justify-center shrink-0">
              <Icon name="layers" className="w-3.5 h-3.5 text-[#a78bfa]" />
            </div>
            <p className="text-white font-semibold text-xs leading-snug">{label}</p>
            <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
            <span className="mt-auto inline-block text-[10px] font-semibold text-[#a78bfa]/60 border border-[#a78bfa]/15 rounded-full px-2 py-0.5 w-fit">Possible Refactor</span>
          </Card>
        ))}
      </div>
    </Section>
  )

  // ── SECTION 10 — INVESTOR / EMPLOYER VALUE ────────────────────────────────
  const values = [
    'Product thinking from brief to working platform',
    'Safety-first system design and advisory UX',
    'Modular architecture — one base, many products',
    'AI-assisted advisory workflows (4P3X Intelligent AI™)',
    'PWA development — installable, mobile-first, offline-capable',
    'Demo / Live product strategy — testable without a live backend',
    'Backend-ready planning — Supabase, RLS, realtime, auth',
    'Route workflow modelling and operational problem solving',
    'Compliance-aware UX that protects operators and users',
    'Evidence-based reporting — trip sessions, incidents, driver records',
    'Investor-demo-ready from day one — full working product',
    'Adaptable base — refactorable into multiple product directions',
  ]
  const InvestorValue = () => (
    <Section id="investor">
      <div className="rounded-2xl border border-[#d4a017]/20 bg-[#d4a017]/3 p-6 sm:p-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a017]/30 bg-[#d4a017]/10 px-4 py-1.5 text-xs font-semibold text-[#d4a017] tracking-wider uppercase mb-4">
            <Icon name="star" className="w-3.5 h-3.5" />
            Investor · Funder · Employer Value
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-3">What This Project Demonstrates</h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Built by Kyzel Kreates™, this project demonstrates strong system thinking, modular software planning, AI-assisted product design, and the ability to transform one working base into multiple real-world product opportunities.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {values.map(v => (
            <div key={v} className="flex items-start gap-2 p-3 rounded-lg border border-[#d4a017]/12 bg-black/20">
              <Icon name="check" className="w-3.5 h-3.5 text-[#d4a017] shrink-0 mt-0.5" />
              <span className="text-slate-300 text-xs leading-relaxed">{v}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[#d4a017]/20 bg-black/20 p-5">
          <p className="text-[#d4a017] font-semibold text-xs sm:text-sm mb-2">Kyzel Kreates™ — Architecture Capability Statement</p>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Built by Kyzel Kreates™, this project demonstrates strong reverse-engineering ability, system thinking, modular software planning, AI-assisted product design, and the ability to transform one working base into multiple real-world product opportunities — all while maintaining safety-first design principles and honest product boundaries.
          </p>
        </div>
      </div>
    </Section>
  )

  // ── SECTION 11 — QUICK LAUNCHPAD ──────────────────────────────────────────
  const launchItems = [
    { label: 'Control Dashboard',        route: ROUTES.DASHBOARD,    icon: 'layers',     variant: 'primary',   desc: 'Open the main operator dashboard' },
    { label: 'Navigation PWA',          route: '/driver-app',       icon: 'smartphone', variant: 'green',     desc: 'Open the mobile Navigation PWA' },
    { label: 'Route Planner',            route: ROUTES.DISPATCH,     icon: 'route',      variant: 'secondary', desc: 'Plan and manage routes' },
    { label: 'Vehicle Profiles',         route: ROUTES.FLEET,        icon: 'truck',      variant: 'secondary', desc: 'Manage your vehicles' },
    { label: 'Navigation PWA Setup',     route: ROUTES.DRIVER_SETUP, icon: 'zap',        variant: 'secondary', desc: 'Set up and pair the Navigation PWA' },
    { label: 'Route Safety AI',          route: ROUTES.SAFETY,       icon: 'shield',     variant: 'secondary', desc: 'Safety monitoring and alerts' },
    { label: 'Investor & Safety Page',    route: ROUTES.INVESTOR_SAFETY, icon: 'star',    variant: 'secondary', desc: 'Bridge strike facts, investor & grant readiness' },
    { label: 'Legal Awareness',          route: ROUTES.COMPLIANCE,   icon: 'check',      variant: 'secondary', desc: 'Route compliance advisory' },
    { label: '4P3X AI Command',          route: ROUTES.AI,           icon: 'brain',      variant: 'purple',    desc: 'AI intelligence and advisory panel' },
    { label: 'Backend / Live Mode',      route: ROUTES.DEPLOYMENT,   icon: 'server',     variant: 'ghost',     desc: 'Supabase and deployment settings' },
  ]

  // ── BRIDGE STRIKE / INVESTOR SHORTCUT CARD (Run 14) ──────────────────────
  const BridgeStrikeCard = () => (
    <Section id="investor-safety-link" className="bg-[#0a0a0c]">
      <div className="max-w-3xl mx-auto rounded-2xl border border-[#d4a017]/25 bg-[#d4a017]/5 p-7 sm:p-10 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#d4a017] border border-[#d4a017]/30 rounded-full px-4 py-1.5 mb-5">
          <Icon name="shield" className="w-3.5 h-3.5" />
          Investor · Safety · Bridge Strike Impact · Grant Readiness
        </div>
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-3 leading-tight">
          Investor, Safety &amp; Bridge Strike Impact
        </h2>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6 max-w-xl mx-auto">
          Why Big V&apos;s Best Routes™ was built for safer, smarter, vehicle-aware route planning.
          Includes Network Rail bridge strike data, safety &amp; legal positioning, modular architecture overview, and investor/grant readiness context.
        </p>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mb-7 max-w-2xl mx-auto">
          {[
            { value: '1,666', label: 'Bridge strikes', sub: 'Network Rail 2024/25' },
            { value: '£13k',  label: 'Avg cost each',  sub: 'Network Rail data'    },
            { value: '150k+', label: 'Delay minutes',  sub: '2023/24 report'       },
            { value: '~£20m', label: 'Annual impact',  sub: '2023/24 total'        },
          ].map(({ value, label, sub }) => (
            <div key={label} className="rounded-xl border border-[#d4a017]/15 bg-[#d4a017]/5 p-3 text-center">
              <p className="font-display font-bold text-xl text-[#d4a017]">{value}</p>
              <p className="text-white text-xs font-semibold mt-0.5">{label}</p>
              <p className="text-slate-600 text-[10px] mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
        <CTAButton
          label="View Safety & Investor Page"
          icon="shield"
          variant="primary"
          onClick={() => go(ROUTES.INVESTOR_SAFETY)}
        />
      </div>
    </Section>
  )

  const Launchpad = () => (
    <Section id="launchpad">
      <Heading title="Quick Access — Demo Launchpad" subtitle="Jump directly to any section of the platform." gold />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {launchItems.map(({ label, route, icon, variant, desc }) => (
          <button
            key={label}
            onClick={() => go(route)}
            className="flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-white/2 hover:bg-white/5 hover:border-white/15 transition-all duration-200 text-left group"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              variant === 'primary'   ? 'bg-[#d4a017]/15 text-[#d4a017]' :
              variant === 'green'    ? 'bg-[#34d399]/12 text-[#34d399]' :
              variant === 'purple'   ? 'bg-[#a78bfa]/12 text-[#a78bfa]' :
              variant === 'ghost'    ? 'bg-[#d4a017]/8  text-[#d4a017]' :
              'bg-white/6 text-slate-300'
            }`}>
              <Icon name={icon} className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm group-hover:text-[#d4a017] transition-colors truncate">{label}</p>
              <p className="text-slate-400 text-xs leading-relaxed mt-0.5">{desc}</p>
            </div>
            <Icon name="arrow" className="w-4 h-4 text-slate-600 group-hover:text-[#d4a017] ml-auto shrink-0 transition-colors" />
          </button>
        ))}
      </div>
    </Section>
  )

  // ── SECTION 12 — FOOTER ───────────────────────────────────────────────────
  const Footer = () => (
    <footer className="border-t border-white/8 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <div>
            <p className="font-display font-bold text-[#d4a017] text-base mb-1">Big V&apos;s Best Routes™</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Safety &amp; Legal Compliance First Route Planning Platform.<br />
              Powered by 4P3X Intelligent AI™ — Created by Kyzel Kreates™
            </p>
          </div>
          <div>
            <p className="font-semibold text-white text-xs mb-2">Mode</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Demo Mode shows the product. Live Mode runs the product.<br />
              Demo Mode works without any backend configuration.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white text-xs mb-2">Advisory Disclaimer</p>
            <p className="text-slate-500 text-xs leading-relaxed">
              Big V&apos;s Best Routes™ is advisory route-planning support software. It does not guarantee legal compliance, does not replace professional judgement, and does not remove the driver&apos;s or operator&apos;s responsibility.
            </p>
          </div>
        </div>
        <div className="border-t border-white/6 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-slate-600 text-xs">© Kyzel Kreates™ · Big V&apos;s Best Routes™ · 4P3X Intelligent AI™ · 4P3X Verse™</p>
          <div className="flex gap-4 flex-wrap justify-center">
            <button onClick={() => go(ROUTES.DASHBOARD)}    className="text-xs text-slate-500 hover:text-[#d4a017] transition-colors">Dashboard</button>
            <button onClick={() => go('/driver-app')}        className="text-xs text-slate-500 hover:text-[#34d399] transition-colors">Navigation PWA</button>
            <button onClick={() => go(ROUTES.SAFETY)}        className="text-xs text-slate-500 hover:text-white transition-colors">Safety AI</button>
            <button onClick={() => go(ROUTES.DEPLOYMENT)}    className="text-xs text-slate-500 hover:text-white transition-colors">Backend Settings</button>
          </div>
        </div>
      </div>
    </footer>
  )

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070708] text-white font-sans overflow-x-hidden">
      {/* Top nav bar */}
      <nav className="sticky top-0 z-50 border-b border-white/8 bg-[#070708]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="font-display font-bold text-[#d4a017] text-sm sm:text-base tracking-tight hover:opacity-80 transition-opacity">
            Big V&apos;s Best Routes™
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <CTAButton label="Dashboard"  icon="layers"     variant="secondary" small onClick={() => go(ROUTES.DASHBOARD)} />
            <CTAButton label="Navigation PWA" icon="smartphone" variant="green"     small onClick={() => go('/driver-app')} />
          </div>
        </div>
      </nav>

      {/* Page sections */}
      <Hero />
      <WhyBuilt />
      <WhoItHelps />
      <Dashboard_ />
      <DriverPWA_ />
      <SafetySection />
      <DemoLive />
      <ModularBase />
      <Refactors />
      <InvestorValue />
      <BridgeStrikeCard />
      <Launchpad />
      <Footer />
    </div>
  )
}

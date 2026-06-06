/**
 * ============================================================
 * Big V's Best Routes™ — Investor, Safety & Bridge Strike Impact
 * Route: /#/investor-safety
 *
 * Purpose:
 *   Professional single-page explainer for investors, grant funders,
 *   public safety stakeholders, and transport innovation reviewers.
 *
 * Covers:
 *   - What the product is
 *   - The bridge strike problem (Network Rail official data)
 *   - Why standard sat nav is not enough for specialist vehicles
 *   - Safety and legal advisory positioning
 *   - Modular refactorable architecture
 *   - Demo / Live Mode explanation
 *   - Investor / grant readiness
 *   - Project architect credit
 *
 * ADVISORY NOTICE:
 *   This page does NOT claim legal compliance, guaranteed route
 *   safety, or prevention of all bridge strikes. All data cited
 *   is sourced from Network Rail public reporting.
 *
 * Run 14 — Terminology + Product Identity + Investor/Safety Page
 * Created by Kyzel Kreates™ | Part of 4P3X Verse™
 * ============================================================
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from './config_routes'

// ─── Icon helper ──────────────────────────────────────────────────────────────
const ICONS = {
  shield:      'M12 2l9 4v6c0 5.25-3.75 10.15-9 11.25C6.75 22.15 3 17.25 3 12V6l9-4z',
  truck:       'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  layers:      'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  smartphone:  'M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2zM12 18h.01',
  alert:       'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  check:       'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  zap:         'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  route:       'M3 12h18M3 6h18M3 18h18',
  info:        'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 9v4m0-8h.01',
  star:        'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  map:         'M1 6l7-4 8 4 7-4v16l-7 4-8-4-7 4V6z',
  server:      'M2 3h20v6H2zM2 9h20v6H2zM2 15h20v6H2zM6 6h.01M6 12h.01M6 18h.01',
  cpu:         'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
  building:    'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  arrow:       'M5 12h14M12 5l7 7-7 7',
  external:    'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6m4-3h6v6m-11 5L21 3',
  x:           'M18 6L6 18M6 6l12 12',
  pound:       'M12 2a10 10 0 100 20A10 10 0 0012 2zM7 14s0-4 5-4m0 0V7m0 3h5m-5 4h6',
  clock:       'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 5v5l3 3',
  users:       'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  grid:        'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
}

function Icon({ name, className = 'w-5 h-5' }) {
  const d = ICONS[name] || ICONS.info
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7}
      viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

// ─── Shared primitives ────────────────────────────────────────────────────────
function Section({ id, children, className = '' }) {
  return (
    <section id={id} className={`py-16 px-4 sm:px-6 ${className}`}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  )
}

function Heading({ title, subtitle, gold = false, center = true }) {
  return (
    <div className={`mb-10 ${center ? 'text-center' : ''}`}>
      <h2 className={`font-display font-bold text-2xl sm:text-3xl lg:text-4xl mb-3 leading-tight
        ${gold ? 'text-[#d4a017]' : 'text-white'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}

function Card({ children, gold = false, accent = false, className = '' }) {
  const border = gold
    ? 'border border-[#d4a017]/20 bg-[#d4a017]/4'
    : accent
      ? 'border border-violet-500/20 bg-violet-500/4'
      : 'border border-white/8 bg-white/3'
  return (
    <div className={`rounded-xl p-5 sm:p-6 ${border} ${className}`}>
      {children}
    </div>
  )
}

function StatCard({ value, label, source, color = 'text-[#d4a017]' }) {
  return (
    <Card gold className="flex flex-col gap-2 text-center">
      <p className={`font-display font-bold text-3xl sm:text-4xl leading-tight ${color}`}>{value}</p>
      <p className="text-white font-semibold text-sm sm:text-base">{label}</p>
      <p className="text-slate-500 text-xs leading-relaxed">{source}</p>
    </Card>
  )
}

function CTAButton({ label, icon, variant = 'primary', small = false, onClick, disabled = false }) {
  const base = `inline-flex items-center gap-2 font-semibold rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#070708]
    ${small ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'}
    ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`

  const styles = {
    primary:   `bg-[#d4a017] text-black hover:bg-[#e6b020] focus:ring-[#d4a017] ${disabled ? '' : 'hover:scale-[1.02]'}`,
    green:     `bg-[#34d399] text-black hover:bg-[#2ec58a] focus:ring-[#34d399] ${disabled ? '' : 'hover:scale-[1.02]'}`,
    secondary: `bg-white/8 text-slate-200 border border-white/12 hover:bg-white/14 focus:ring-white/30`,
    ghost:     `bg-transparent text-slate-400 border border-white/10 hover:bg-white/6 hover:text-white focus:ring-white/20`,
    violet:    `bg-violet-600 text-white hover:bg-violet-500 focus:ring-violet-500 ${disabled ? '' : 'hover:scale-[1.02]'}`,
    danger:    `bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 focus:ring-red-600`,
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${base} ${styles[variant] || styles.primary}`}
    >
      <Icon name={icon} className="w-4 h-4 shrink-0" />
      {label}
    </button>
  )
}

function CompareRow({ label, standard, bvbr }) {
  return (
    <tr className="border-b border-white/6">
      <td className="py-3 pr-4 text-slate-400 text-xs sm:text-sm align-top font-medium">{label}</td>
      <td className="py-3 pr-4 text-slate-500 text-xs sm:text-sm align-top">{standard}</td>
      <td className="py-3 text-emerald-400 text-xs sm:text-sm align-top">{bvbr}</td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InvestorSafety() {
  const navigate = useNavigate()
  const go = (route) => navigate(route)

  // Always start at top
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])

  return (
    <div className="min-h-screen bg-[#070708] text-white font-sans overflow-x-hidden">

      {/* ── Top nav ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/8 bg-[#070708]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <button
            onClick={() => go(ROUTES.LANDING)}
            className="font-display font-bold text-[#d4a017] text-sm sm:text-base tracking-tight hover:opacity-80 transition-opacity"
          >
            Big V&apos;s Best Routes™
          </button>
          <div className="flex items-center gap-2">
            <CTAButton label="Dashboard"     icon="layers"     variant="secondary" small onClick={() => go(ROUTES.DASHBOARD)} />
            <CTAButton label="Nav PWA"       icon="smartphone" variant="green"     small onClick={() => go('/driver-app')} />
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[88vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 py-20 overflow-hidden">

        {/* Background accents */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#d4a017]/6 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[200px] bg-violet-600/6 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#d4a017] border border-[#d4a017]/30 rounded-full px-4 py-1.5 mb-6">
            <Icon name="shield" className="w-3.5 h-3.5" />
            Investor · Safety · Bridge Strike Impact · Grant Readiness
          </div>

          {/* Title */}
          <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4 leading-tight tracking-tight">
            Vehicle-Aware Route Planning for Safer Roads,<br className="hidden sm:block" />
            <span className="text-[#d4a017]"> Fewer Avoidable Risks,</span> and Smarter Journeys
          </h1>

          {/* Sub */}
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-3 max-w-3xl mx-auto">
            Big V&apos;s Best Routes™ is a single-user, multi-vehicle route planning platform designed for people who operate more than one type of vehicle and need better route suitability than a normal sat nav can provide.
          </p>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-10 max-w-2xl mx-auto">
            It helps plan routes around vehicle height, width, weight, length, towing status, access limitations, low bridges, narrow roads, road restrictions, and safety-critical route warnings.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <CTAButton label="Open Route Planning Dashboard" icon="layers"     variant="primary" onClick={() => go(ROUTES.DASHBOARD)} />
            <CTAButton label="Navigation PWA Demo"   icon="map"        variant="green"     onClick={() => go(ROUTES.DRIVER_APP_DEMO)} />
            <CTAButton label="Open Navigation PWA"    icon="smartphone" variant="secondary" onClick={() => go('/driver-app')} />
            <CTAButton label="Demo / Live Mode Settings"     icon="server"     variant="secondary" onClick={() => go(ROUTES.DEPLOYMENT)} />
          </div>

          {/* Branding line */}
          <p className="text-slate-600 text-xs tracking-wide">
            Powered by 4P3X Intelligent AI™ — Created by Kyzel Kreates™
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — WHY THIS WAS BUILT
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="why" className="bg-[#0a0a0c]">
        <Heading
          title="Why Big V's Best Routes™ Was Built"
          subtitle="Many drivers use standard sat nav tools built mainly for ordinary cars. For larger, specialist, or multi-type vehicles, that is not always enough."
          gold
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: 'truck', color: 'text-[#d4a017]', bg: 'bg-[#d4a017]/10',
              title: 'The Vehicle Profile Gap',
              body: 'Standard navigation apps are usually built for ordinary cars. They often do not understand the real-world physical and legal limits of vans, motorhomes, box trucks, towing setups, high-roof vehicles, horseboxes, HGVs, or specialist vehicles. A route that looks fine for a car may be entirely unsuitable for a taller, wider, or heavier vehicle.',
            },
            {
              icon: 'map', color: 'text-violet-400', bg: 'bg-violet-500/10',
              title: 'Route Suitability Needs More',
              body: 'For vehicles with specific height, width, weight, length, or towing constraints, route planning needs to go beyond fastest ETA. It needs low-bridge awareness, narrow-road recognition, weight restriction context, hazard notes, and driver acknowledgement — built around the specific vehicle being driven today.',
            },
            {
              icon: 'shield', color: 'text-emerald-400', bg: 'bg-emerald-500/10',
              title: 'A Structured Planning Layer',
              body: 'Big V\'s Best Routes™ adds a safety-first planning layer around route decisions — bringing vehicle profile data, route suitability checking, advisory AI safety context, trip sessions, and reporting together in one structured place. It is advisory support, not a replacement for professional judgement.',
            },
            {
              icon: 'check', color: 'text-sky-400', bg: 'bg-sky-500/10',
              title: 'Vehicle Dimensions That Matter',
              body: 'The platform stores height, width, weight, length, towing status, vehicle type, load notes, and access restriction notes per vehicle. Route planning can be approached with the right vehicle in mind, not the average car.',
            },
            {
              icon: 'zap', color: 'text-amber-400', bg: 'bg-amber-500/10',
              title: 'Advisory Checks Before the Journey',
              body: 'AI-assisted safety and compliance advisory checks flag risks before the journey starts — not mid-route when it is too late to easily change course. Driver acknowledgement and route review are built into the flow.',
            },
            {
              icon: 'star', color: 'text-[#d4a017]', bg: 'bg-[#d4a017]/10',
              title: 'One User, Multiple Vehicles',
              body: 'This version is built for one owner/operator who may use a car, a van, a motorhome, a towing vehicle, a horsebox, or a specialist vehicle at different times. Each vehicle profile holds its own physical and legal context — no enterprise fleet required.',
            },
          ].map(({ icon, color, bg, title, body }) => (
            <Card key={title} className="flex flex-col gap-3">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon name={icon} className={`w-4 h-4 ${color}`} />
              </div>
              <h3 className="text-white font-semibold text-sm sm:text-base">{title}</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — THE BRIDGE STRIKE PROBLEM
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="bridge-strikes">
        <Heading
          title="The Bridge Strike Problem"
          subtitle="Bridge strikes are not small accidents. They create infrastructure damage, train delays, road closures, vehicle damage, insurance costs, legal exposure, and disruption that extends far beyond the original incident."
        />

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          <StatCard
            value="1,666"
            label="Reported bridge strikes"
            source="Network Rail — 1 April 2024 to 31 March 2025"
            color="text-[#d4a017]"
          />
          <StatCard
            value="£13,000"
            label="Average cost per strike"
            source="Network Rail average UK bridge strike cost"
            color="text-red-400"
          />
          <StatCard
            value="150,000+"
            label="Minutes of passenger delays"
            source="Network Rail 2023/24 bridge strike reporting"
            color="text-amber-400"
          />
          <StatCard
            value="~£20m"
            label="Impact in 2023/24"
            source="Delays, cancellations, repairs and disruption — Network Rail 2023/24"
            color="text-violet-400"
          />
        </div>

        {/* Context paragraphs */}
        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <h3 className="text-white font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
              <Icon name="alert" className="w-4 h-4 text-amber-400" />
              What a Bridge Strike Actually Causes
            </h3>
            <ul className="space-y-2 text-slate-400 text-xs sm:text-sm leading-relaxed">
              {[
                'Bridge inspection and structural examination costs',
                'Bridge repair or replacement costs if damaged',
                'Railway service delays and cancellations',
                'Passenger compensation costs',
                'Road closures and emergency diversions',
                'Vehicle recovery and repair costs',
                'Insurance claims for vehicle, structure, and third parties',
                'Business downtime for the vehicle operator',
                'Missed deliveries and appointments',
                'Emergency response resource pressure',
                'Potential legal liability for the driver or operator',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <Icon name="x" className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3 className="text-white font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
              <Icon name="info" className="w-4 h-4 text-sky-400" />
              Why They Keep Happening
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
              Most bridge strikes are avoidable. They typically occur because a driver follows a standard sat nav that has not been configured for their vehicle&apos;s height — or because the driver was not sufficiently aware of the route restriction in advance.
            </p>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
              UK Traffic Commissioners and government guidance note that bridge strikes are avoidable and that their cost is significant in both monetary and safety terms.
            </p>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
              Network Rail&apos;s 2023/24 data reported 1,532 bridge strikes, causing more than 150,000 minutes of passenger delays and around £20m in delays, cancellations, and repairs.
            </p>
            <div className="rounded-lg bg-[#d4a017]/8 border border-[#d4a017]/20 p-4 mt-2">
              <p className="text-[#d4a017] text-xs sm:text-sm font-semibold mb-1">Advisory note</p>
              <p className="text-slate-300 text-xs leading-relaxed">
                Big V&apos;s Best Routes™ does not claim to eliminate bridge strikes. It is designed to help users think about route suitability — including height, width, and restriction awareness — before the journey starts.
              </p>
            </div>
          </Card>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — COST TO BUSINESS, INFRASTRUCTURE & THE PUBLIC
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="cost" className="bg-[#0a0a0c]">
        <Heading
          title="Cost to Business, Infrastructure & the Public"
          subtitle="A single unsuitable route decision can create costs that extend well beyond the driver."
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {[
            { icon: 'building', color: 'text-red-400', bg: 'bg-red-500/10', title: 'Infrastructure', items: ['Bridge inspection', 'Bridge repair or replacement', 'Road closures and diversions', 'Emergency response costs'] },
            { icon: 'users',    color: 'text-amber-400', bg: 'bg-amber-500/10', title: 'Rail & Road Users', items: ['Train delays and cancellations', 'Passenger compensation', 'Road congestion from closures', 'Public transport disruption'] },
            { icon: 'truck',    color: 'text-sky-400', bg: 'bg-sky-500/10', title: 'Vehicle Operators', items: ['Vehicle recovery and repair', 'Insurance claim costs', 'Legal liability exposure', 'Business downtime and missed jobs'] },
            { icon: 'pound',    color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'Financial Impact', items: ['Repair bills averaging £13,000 per strike', 'Insurance premium increases', 'Compensation payments', 'Reputational damage costs'] },
            { icon: 'clock',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Time & Delay', items: ['150,000+ delay-minutes in 2023/24', 'Missed delivery windows', 'Appointment failures', 'Extra mileage from avoidable rerouting'] },
            { icon: 'cpu',      color: 'text-[#d4a017]', bg: 'bg-[#d4a017]/10', title: 'Environmental', items: ['Additional CO₂ from avoidable detours', 'Fuel wasted on unsuitable routes', 'Congestion emissions from closures', 'Unnecessary extra mileage'] },
          ].map(({ icon, color, bg, title, items }) => (
            <Card key={title} className="flex flex-col gap-3">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon name={icon} className={`w-4 h-4 ${color}`} />
              </div>
              <h3 className={`font-semibold text-sm sm:text-base ${color}`}>{title}</h3>
              <ul className="space-y-1.5">
                {items.map(i => (
                  <li key={i} className="flex items-start gap-1.5 text-slate-400 text-xs">
                    <span className="text-slate-600 mt-0.5">—</span>{i}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <Card className="text-center max-w-3xl mx-auto">
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            &ldquo;Big V&apos;s Best Routes™ does not claim to eliminate these risks, but it is designed to help users think about route suitability before the journey starts.&rdquo;
          </p>
        </Card>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5 — WHY STANDARD SAT NAV IS NOT ENOUGH
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="vs-satnav">
        <Heading
          title="Why Standard Sat Nav Is Not Always Enough"
          subtitle="Most mainstream navigation platforms are excellent for general car navigation. For larger, taller, wider, heavier, towing, or specialist vehicles, route suitability needs more."
        />
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed text-center max-w-3xl mx-auto mb-10">
          Most mainstream navigation platforms are not always designed around the legal and physical constraints of every vehicle type. For specialist vehicles, route suitability needs vehicle-aware checks, risk warnings, restriction awareness, and driver confirmation — not just the fastest ETA.
        </p>
        <div className="overflow-x-auto rounded-xl border border-white/8">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/3">
                <th className="py-3 px-4 text-left text-slate-500 text-xs font-semibold uppercase tracking-wider">Feature area</th>
                <th className="py-3 px-4 text-left text-slate-500 text-xs font-semibold uppercase tracking-wider">Standard sat nav</th>
                <th className="py-3 px-4 text-left text-emerald-500 text-xs font-semibold uppercase tracking-wider">Big V&apos;s Best Routes™</th>
              </tr>
            </thead>
            <tbody className="px-4">
              <CompareRow label="Route priority"               standard="Fastest / shortest route first"                  bvbr="Vehicle profile first — suitability before speed" />
              <CompareRow label="Vehicle context"              standard="Usually car-first by default"                    bvbr="Height / width / weight / length / towing aware" />
              <CompareRow label="Low bridge awareness"         standard="Limited or absent for all vehicle types"         bvbr="Low bridge and road restriction focus built in" />
              <CompareRow label="Vehicle-specific legal input" standard="May not ask for full vehicle dimensions"         bvbr="Dedicated vehicle profile with physical constraints" />
              <CompareRow label="Risk explanation"             standard="May not explain restriction reasoning"           bvbr="AI advisory layer explains route risk factors" />
              <CompareRow label="Driver acknowledgement"       standard="Not usually built in"                           bvbr="Pre-trip safety checklist and acknowledgement flow" />
              <CompareRow label="Route safety scoring"         standard="Not standard"                                   bvbr="Route risk scoring per vehicle profile" />
              <CompareRow label="Evidence trail"               standard="Not usually captured"                           bvbr="Trip sessions, reports, and advisory records" />
              <CompareRow label="Mobile PWA install"           standard="App-store dependent"                            bvbr="Installable Navigation PWA — no app store required" />
              <CompareRow label="Modular architecture"         standard="Fixed product"                                  bvbr="Refactorable 4P3X Verse™ modular base" />
              <CompareRow label="Human override"               standard="Typically available"                            bvbr="Always preserved — advisory, never overriding" />
            </tbody>
          </table>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6 — SAFETY & LEGAL POSITIONING
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="safety-legal" className="bg-[#0a0a0c]">
        <Heading
          title="Safety & Legal Positioning"
          subtitle="Big V's Best Routes™ is advisory. It helps users make better decisions. It does not replace driver judgement or legal responsibility."
        />
        <div className="grid gap-5 md:grid-cols-2 mb-8">
          <Card gold>
            <h3 className="text-[#d4a017] font-semibold text-sm sm:text-base mb-4">What the Platform Does</h3>
            <ul className="space-y-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
              {[
                'Stores vehicle height, width, weight, length, and towing status per profile',
                'Applies vehicle context to route planning and advisory checks',
                'Highlights potential low bridges, narrow roads, and known restrictions',
                'Provides AI-assisted safety and legal advisory commentary',
                'Presents risk scoring and route suitability guidance',
                'Supports pre-trip acknowledgement and safety checklist flow',
                'Records trip sessions and supports reporting',
                'Works in Demo Mode for safe exploration and investor demos',
                'Supports Live Mode when connected to a real backend',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <Icon name="check" className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3 className="text-red-400 font-semibold text-sm sm:text-base mb-4">What the Platform Does NOT Do</h3>
            <ul className="space-y-2 text-slate-400 text-xs sm:text-sm leading-relaxed">
              {[
                'Does not guarantee that any route is legal, safe, or unrestricted',
                'Does not replace the driver\'s own judgement and responsibility',
                'Does not replace live road signs, markings, or police instruction',
                'Does not guarantee real-time data accuracy for all restrictions',
                'Does not prevent all bridge strikes or route accidents',
                'Does not remove the need to check permit requirements',
                'Does not act as professional transport legal advice',
                'Does not replace local authority or traffic commissioner guidance',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <Icon name="x" className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Safety notice box */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/6 p-5 sm:p-6 max-w-3xl mx-auto">
          <div className="flex items-start gap-3">
            <Icon name="alert" className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-semibold text-sm mb-2">Safety-Critical Notice</p>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Always follow road signs, legal restrictions, police instructions, local authority notices, and real-world conditions. This platform supports route planning and risk awareness but does not replace driver judgement or legal responsibility. The driver and operator remain fully responsible for all route decisions.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 7 — HOW THE PLATFORM WORKS
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="how-it-works">
        <Heading
          title="How the Platform Works"
          subtitle="A structured flow from vehicle profile to safer journey — with advisory checks at every step."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { step: '01', icon: 'layers',     color: 'text-[#d4a017]', bg: 'bg-[#d4a017]/10', title: 'Open Dashboard',     body: 'User opens the Route Planning Dashboard from the home page or installed PWA.' },
            { step: '02', icon: 'truck',      color: 'text-sky-400',   bg: 'bg-sky-500/10',   title: 'Select Vehicle',     body: 'User selects or creates a vehicle profile with physical and legal constraints.' },
            { step: '03', icon: 'route',      color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Enter Destination', body: 'User enters origin and destination. Vehicle context shapes route options.' },
            { step: '04', icon: 'shield',     color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'Advisory Check',    body: 'AI safety and compliance layer reviews vehicle-relevant route risk factors.' },
            { step: '05', icon: 'smartphone', color: 'text-[#34d399]', bg: 'bg-emerald-500/10', title: 'Navigate Safely',   body: 'User opens the Navigation PWA for in-vehicle use. Trip session records the journey.' },
          ].map(({ step, icon, color, bg, title, body }) => (
            <Card key={step} className="flex flex-col gap-2 text-center items-center">
              <span className="text-xs font-bold text-slate-600 font-mono">{step}</span>
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon name={icon} className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-white font-semibold text-xs sm:text-sm">{title}</p>
              <p className="text-slate-400 text-xs leading-relaxed">{body}</p>
            </Card>
          ))}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Card className="text-center">
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              <span className="text-white font-semibold">Demo Mode</span> — All functionality accessible using sample data. No backend required. Ideal for investors, testers, and product reviewers.
            </p>
          </Card>
          <Card className="text-center">
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              <span className="text-white font-semibold">Live Mode</span> — Activated when demo data is switched off and a real backend (Supabase, Firebase, or other) is connected. User-owned data, real persistence.
            </p>
          </Card>
          <Card className="text-center">
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              <span className="text-white font-semibold">Navigation PWA</span> — Installs directly to mobile home screen. No app store. Full navigation flow, offline-capable, works on iOS and Android.
            </p>
          </Card>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 8 — MODULAR BASE / REFACTORABLE ARCHITECTURE
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="modular" className="bg-[#0a0a0c]">
        <Heading
          title="Modular Base — Refactorable Architecture"
          subtitle="Big V's Best Routes™ is part of the 4P3X Verse™ modular product architecture. The value is not only in this product."
          gold
        />
        <div className="grid gap-5 lg:grid-cols-2 mb-8">
          <Card gold>
            <h3 className="text-[#d4a017] font-semibold text-sm sm:text-base mb-4">The Reusable Core</h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
              Big V&apos;s Best Routes™ is not just a one-off demo. It uses a reusable dashboard + Navigation PWA + AI guidance + demo/live mode switching pattern that can be refactored into other industries without rebuilding from scratch.
            </p>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              The value is not only in this one product. The value is in the reusable architecture: a controlled modular base that can become multiple sector-specific products without starting again from zero.
            </p>
          </Card>
          <Card accent>
            <h3 className="text-violet-400 font-semibold text-sm sm:text-base mb-4">What the Same Base Can Become</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Route safety products',
                'Transport compliance tools',
                'Field worker apps',
                'Inspection systems',
                'Infrastructure reporting',
                'Local authority tools',
                'Insurance risk products',
                'Training & evidence systems',
                'Vehicle checklist tools',
                'Emergency route planning',
                'Business ops dashboards',
                'Logistics operator tools',
              ].map(item => (
                <div key={item} className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <Icon name="arrow" className="w-3 h-3 text-violet-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
        <Card className="text-center max-w-3xl mx-auto">
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            &ldquo;This build is intentionally focused on a single user with multiple vehicles. Because it is built from a modular 4P3X architecture, the same base could later be refactored into transport operator tools, delivery route planners, field-service systems, inspection route managers, community-response planners, or other route-based products — without starting again from scratch.&rdquo;
          </p>
        </Card>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 9 — DEMO MODE / LIVE MODE
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="demo-live">
        <Heading
          title="Demo Mode / Live Mode"
          subtitle={`"Demo Mode shows the product. Live Mode runs the product."`}
        />
        <div className="grid gap-5 md:grid-cols-2 mb-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <h3 className="text-amber-400 font-semibold text-sm sm:text-base">Demo Mode</h3>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-3">
              Demo Mode allows investors, users, grant funders, and testers to understand the full platform safely using sample data. No real backend is required. All dashboard features, vehicle profiles, route planning, AI advisory checks, and Navigation PWA are accessible.
            </p>
            <ul className="space-y-1.5">
              {['No backend connection required', 'Full product visible and functional', 'Safe for investor demos and presentations', 'Sample vehicles, routes, and reports included'].map(i => (
                <li key={i} className="flex items-start gap-2 text-slate-400 text-xs">
                  <Icon name="check" className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />{i}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-emerald-400 font-semibold text-sm sm:text-base">Live Mode</h3>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-3">
              Live Mode is activated when demo data is switched off and a real backend is connected — such as Supabase, Firebase, or another suitable provider. It enables real user-owned data, backend persistence, and live sync.
            </p>
            <ul className="space-y-1.5">
              {[
                'Real saved vehicle profiles',
                'Real route history and trip sessions',
                'User-owned backend persistence',
                'Optional sync and realtime subscriptions',
                'No backend-only secrets in frontend code',
                'Configurable API providers',
              ].map(i => (
                <li key={i} className="flex items-start gap-2 text-slate-400 text-xs">
                  <Icon name="check" className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />{i}
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="text-center">
          <CTAButton label="Demo / Live Mode Settings" icon="server" variant="secondary" onClick={() => go(ROUTES.DEPLOYMENT)} />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 10 — INVESTOR / GRANT READINESS
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="investor" className="bg-[#0a0a0c]">
        <Heading
          title="Investor & Grant Readiness"
          subtitle="Big V's Best Routes™ sits at the intersection of transport safety, infrastructure protection, AI-assisted decision support, and modular SaaS architecture."
          gold
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {[
            { icon: 'shield',   color: 'text-emerald-400', label: 'Transport Safety',          desc: 'Addresses a real, costed, measurable public safety problem — bridge strikes, road restriction failures, unsuitable routing.' },
            { icon: 'building', color: 'text-sky-400',     label: 'Infrastructure Protection',  desc: 'Helps reduce avoidable damage to bridges, roads, and rail infrastructure with pre-journey route suitability checks.' },
            { icon: 'cpu',      color: 'text-violet-400',  label: 'AI-Assisted Decision Support', desc: 'Uses AI guidance for safety and legal advisory checks — practical, production-ready, not theoretical.' },
            { icon: 'grid',     color: 'text-[#d4a017]',   label: 'Modular SaaS Architecture',  desc: 'Built on a refactorable product base — scalable across sectors without starting from scratch each time.' },
            { icon: 'map',      color: 'text-amber-400',   label: 'PWA-First Field Technology', desc: 'Installable Navigation PWA works offline on iOS and Android — no app store, ready for real field use.' },
            { icon: 'users',    color: 'text-red-400',     label: 'Public Sector Relevance',    desc: 'Applicable to local authorities, transport commissioners, logistics operators, insurance, and compliance sectors.' },
          ].map(({ icon, color, label, desc }) => (
            <Card key={label} className="flex flex-col gap-2">
              <Icon name={icon} className={`w-5 h-5 ${color}`} />
              <p className={`font-semibold text-sm ${color}`}>{label}</p>
              <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
        <Card gold className="text-center max-w-3xl mx-auto">
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            &ldquo;Big V&apos;s Best Routes™ is designed as a fundable prototype because it addresses a real-world safety and cost problem while demonstrating a scalable modular architecture that can be applied across multiple sectors.&rdquo;
          </p>
        </Card>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 11 — PROJECT ARCHITECT
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="creator">
        <Heading title="Project Architect" />
        <Card className="max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#d4a017]/12 border border-[#d4a017]/20 flex items-center justify-center mx-auto mb-4">
            <Icon name="star" className="w-7 h-7 text-[#d4a017]" />
          </div>
          <p className="text-[#d4a017] font-display font-bold text-lg mb-1">Kyzel Kreates™</p>
          <p className="text-slate-400 text-xs mb-4 tracking-wide">Ciaran — Product Architect · 4P3X Verse™</p>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
            Big V&apos;s Best Routes™ was created by Ciaran / Kyzel Kreates™ as part of the 4P3X Verse™ — a modular AI-assisted product ecosystem built around reusable dashboard systems, installable PWAs, demo/live switching, AI guidance layers, and controlled refactoring.
          </p>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
            The project demonstrates rapid product thinking, systems architecture, safety-first design, and the ability to convert one modular base into multiple sector-ready products. It represents a first-of-its-kind modular AI-assisted product direction for vehicle-aware route planning and safety advisory tools.
          </p>
          <p className="text-slate-500 text-xs tracking-wide">
            Powered by 4P3X Intelligent AI™ — Created by Kyzel Kreates™ — Part of the 4P3X Verse™
          </p>
        </Card>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 12 — FINAL CTA
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="cta" className="bg-[#0a0a0c]">
        <Heading
          title="Start Exploring"
          subtitle="Open the dashboard, review your vehicle profiles, or launch the Navigation PWA."
          gold
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {[
            { label: 'Route Planning Dashboard', icon: 'layers',     variant: 'primary',   route: ROUTES.DASHBOARD,  desc: 'Open the main control dashboard' },
            { label: 'Navigation PWA Demo',     icon: 'map',        variant: 'green',     route: ROUTES.DRIVER_APP_DEMO, desc: 'Demo route: Torquay → Edinburgh' },
            { label: 'Open Navigation PWA',      icon: 'smartphone', variant: 'secondary', route: '/driver-app',     desc: 'Open the real Navigation PWA' },
            { label: 'Vehicle Profiles',         icon: 'truck',      variant: 'secondary', route: ROUTES.FLEET,      desc: 'Manage and review vehicle profiles' },
            { label: 'Demo / Live Settings',     icon: 'server',     variant: 'ghost',     route: ROUTES.DEPLOYMENT, desc: 'Configure demo or live mode' },
          ].map(({ label, icon, variant, route, desc }) => (
            <button
              key={label}
              onClick={() => go(route)}
              className="group rounded-xl p-5 border border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/14 transition-all duration-200 text-left flex flex-col gap-2"
            >
              <Icon name={icon} className={`w-5 h-5 ${variant === 'primary' ? 'text-[#d4a017]' : variant === 'green' ? 'text-[#34d399]' : 'text-slate-400'}`} />
              <p className="text-white font-semibold text-sm">{label}</p>
              <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              <Icon name="arrow" className="w-4 h-4 text-slate-600 group-hover:text-[#d4a017] transition-colors self-end" />
            </button>
          ))}
        </div>
        <div className="text-center">
          <button
            onClick={() => go(ROUTES.LANDING)}
            className="text-xs text-slate-500 hover:text-[#d4a017] transition-colors underline underline-offset-4"
          >
            ← Back to Home Page
          </button>
        </div>
      </Section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/8 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-6 sm:grid-cols-3 mb-8">
            <div>
              <p className="font-display font-bold text-[#d4a017] text-sm mb-1">Big V&apos;s Best Routes™</p>
              <p className="text-slate-500 text-xs leading-relaxed">
                Single-User Multi-Vehicle Safety &amp; Legal Route Planning Platform.<br />
                Powered by 4P3X Intelligent AI™ — Created by Kyzel Kreates™
              </p>
            </div>
            <div>
              <p className="text-white font-semibold text-xs mb-2">Data Sources</p>
              <p className="text-slate-500 text-xs leading-relaxed">
                Bridge strike statistics sourced from Network Rail public reporting (2023/24 and 2024/25). UK Traffic Commissioner guidance publicly available. All figures used for educational and safety context only.
              </p>
            </div>
            <div>
              <p className="text-white font-semibold text-xs mb-2">Advisory Disclaimer</p>
              <p className="text-slate-500 text-xs leading-relaxed">
                Big V&apos;s Best Routes™ is advisory route-planning support software. It does not guarantee legal compliance or route safety. The driver and operator retain full responsibility for all route decisions.
              </p>
            </div>
          </div>
          <div className="border-t border-white/6 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-slate-700 text-xs">© Kyzel Kreates™ · Big V&apos;s Best Routes™ · 4P3X Intelligent AI™ · 4P3X Verse™</p>
            <div className="flex gap-4 flex-wrap justify-center">
              <button onClick={() => go(ROUTES.LANDING)}     className="text-xs text-slate-500 hover:text-[#d4a017] transition-colors">Home</button>
              <button onClick={() => go(ROUTES.DASHBOARD)}   className="text-xs text-slate-500 hover:text-[#d4a017] transition-colors">Dashboard</button>
              <button onClick={() => go('/driver-app')}      className="text-xs text-slate-500 hover:text-[#34d399] transition-colors">Navigation PWA</button>
              <button onClick={() => go(ROUTES.SAFETY)}      className="text-xs text-slate-500 hover:text-white transition-colors">Safety AI</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

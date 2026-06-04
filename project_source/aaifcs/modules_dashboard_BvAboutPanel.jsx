/**
 * ============================================================
 * Big V's Best Routes™ — About & Demo Guide Panel
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 * Run 9 — Final Production Hardening
 *
 * Collapsible panel. Explains the product, how to demo it,
 * and confirms advisory-only safety/legal positioning.
 * ============================================================
 */

import { useState, memo } from 'react'
import Icon from './components_ui_Icon'

const STEPS = [
  { n: '1', title: 'Create a Vehicle',         text: 'Go to Saved Vehicles → Add Vehicle. Select vehicle type (Van, Box Truck, Motorhome, etc.). Complete height, width, weight. Check vehicle readiness score.' },
  { n: '2', title: 'Create a Route',           text: 'Go to Route Planner → Add Route Plan. Enter origin and destination. Select your active vehicle. View advisory warnings and readiness.' },
  { n: '3', title: 'Assign Route',             text: 'In the dashboard Operations panel, open Route Assignments. Create an assignment linking your route to your vehicle.' },
  { n: '4', title: 'Open Driver PWA',          text: 'Navigate to /driver-app (or open the Driver PWA tab in pages). Pair/open the PWA. The assigned route will appear in the Assignment Inbox.' },
  { n: '5', title: 'Review & Acknowledge',     text: 'In the Driver PWA, open the assignment. Review the route. Accept the advisory acknowledgement.' },
  { n: '6', title: 'Safety Checklist',         text: 'Complete the pre-navigation safety checklist. All items must be checked before navigation starts.' },
  { n: '7', title: 'Start Navigation',         text: 'Press Start Navigation. GPS permission will be requested. Allow for live GPS marker, or deny to use map-review mode.' },
  { n: '8', title: 'Pause / Resume / Complete',text: 'Use the navigation controls. Pause for safe stops. Resume when ready. Complete to end the trip session.' },
  { n: '9', title: 'Submit Driver Report',     text: 'From the Driver PWA Assignment Inbox, submit a report. Select report type (route concern, road closure, vehicle issue, etc.) and severity.' },
  { n: '10',title: 'Run 4P3X AI Review',       text: 'Back in the dashboard, open the AI Oversight Centre. Press "Run 4P3X AI Review". Review Agent 1 (route/vehicle) and Agent 2 (evidence/compliance) findings.' },
  { n: '11',title: 'Check Backend Readiness',  text: 'Open Backend & Deployment Centre from the sidebar. Check sync readiness, run Prepare Sync, and review PWA readiness. Toggle demo/live mode.' },
  { n: '12',title: 'Toggle Demo / Live Mode',  text: 'In the Deployment Centre → Demo/Live Mode. Toggle between Demo (local data, safe for presentation) and Live (queues locally until backend is configured).' },
]

const FEATURES = [
  { icon: 'Car',          label: 'Multi-Vehicle Manager',       note: 'Type-aware templates. Readiness scoring. Legal-critical field labels.' },
  { icon: 'Route',        label: 'Route Planner',               note: 'Vehicle-aware planning. Advisory warnings. Missing field alerts.' },
  { icon: 'Map',          label: 'OSM 2D / MapLibre 3D Map',    note: 'Free OpenStreetMap tiles. MapLibre 3D tilt toggle. Route preview.' },
  { icon: 'Smartphone',   label: 'Driver PWA',                  note: 'GPS navigation. Route review. Acknowledgement. Offline-capable.' },
  { icon: 'ClipboardList',label: 'Route Assignments',           note: 'Dashboard creates, Driver PWA receives. Status lifecycle.' },
  { icon: 'Activity',     label: 'Trip Sessions',               note: 'Linked to assignments. GPS events. Warnings recorded.' },
  { icon: 'FileText',     label: 'Driver Reports',              note: '12 report types. Severity levels. Dashboard review/resolve.' },
  { icon: 'Cpu',          label: '4P3X Intelligent AI™ Layer', note: 'Agent 1 (suitability) + Agent 2 (evidence). Local-first rules. Human review checklist.' },
  { icon: 'Server',       label: 'Deployment Centre',           note: 'Supabase/Firebase/AWS/REST/local. API Config Guard™. Sync readiness.' },
]

export default memo(function BvAboutPanel() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('demo')

  return (
    <div className="bg-[#07080d] border border-[#b8860b]/20 rounded-xl overflow-hidden">
      {/* Header toggle */}
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left">
        <Icon name="BookOpen" size={14} className="text-[#b8860b]" />
        <div className="flex-1">
          <span className="text-sm font-bold text-[#d4a017]">About & Demo Guide</span>
          <span className="text-2xs text-slate-600 ml-3">Big V's Best Routes™ · Run 9</span>
        </div>
        <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-slate-600" />
      </button>

      {open && (
        <div className="border-t border-[#b8860b]/15">
          {/* Tab nav */}
          <div className="flex gap-1 px-4 pt-3 pb-0">
            {[
              { key: 'demo',    label: 'How to Demo'    },
              { key: 'features',label: 'Key Features'   },
              { key: 'advisory',label: 'Safety Advisory'},
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-t-lg text-2xs font-semibold transition-all ${
                  tab === t.key ? 'bg-[#b8860b]/15 text-[#d4a017] border border-b-0 border-[#b8860b]/25' : 'text-slate-600 hover:text-slate-400'
                }`}>{t.label}</button>
            ))}
          </div>

          <div className="p-4 space-y-4">
            {/* Product identity */}
            <div className="p-3 bg-[#0a0700] border border-[#b8860b]/15 rounded-xl">
              <p className="text-xs font-bold text-[#d4a017] mb-1">Big V's Best Routes™</p>
              <p className="text-2xs text-slate-500 leading-relaxed">
                Big V's Best Routes™ is a safety-first route planning and Driver PWA system for single users managing multiple vehicles. It supports vehicle-aware route planning, OSM 2D mapping, MapLibre 3D map viewing, GPS-assisted Driver PWA navigation, route assignments, trip sessions, driver reports, advisory AI oversight, demo/live mode switching, and backend-ready deployment preparation.
              </p>
              <p className="text-2xs text-slate-700 mt-1.5">
                Powered by 4P3X Intelligent AI™ · Created by Kyzel Kreates™ · Part of the 4P3X Verse
              </p>
            </div>

            {/* How to Demo tab */}
            {tab === 'demo' && (
              <div className="space-y-2">
                <p className="text-2xs text-slate-600 font-semibold uppercase tracking-wider">Demo Flow — 12 Steps</p>
                {STEPS.map(s => (
                  <div key={s.n} className="flex gap-2.5 p-2.5 bg-slate-900/40 border border-slate-800/40 rounded-xl">
                    <div className="w-5 h-5 rounded-full bg-[#b8860b]/20 border border-[#b8860b]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-2xs font-bold text-[#d4a017]">{s.n}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-300">{s.title}</p>
                      <p className="text-2xs text-slate-600 leading-relaxed mt-0.5">{s.text}</p>
                    </div>
                  </div>
                ))}
                <div className="p-2.5 bg-violet-500/6 border border-violet-500/15 rounded-xl text-2xs text-violet-400/70 leading-relaxed">
                  Demo Mode shows the product. Live Mode runs the product when a backend such as Supabase, Firebase, AWS/custom, or another suitable system is connected and validated.
                </div>
              </div>
            )}

            {/* Key Features tab */}
            {tab === 'features' && (
              <div className="space-y-2">
                <p className="text-2xs text-slate-600 font-semibold uppercase tracking-wider">Product Features</p>
                {FEATURES.map(f => (
                  <div key={f.label} className="flex gap-2.5 p-2.5 bg-slate-900/40 border border-slate-800/40 rounded-xl">
                    <Icon name={f.icon} size={13} className="text-[#b8860b] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-300">{f.label}</p>
                      <p className="text-2xs text-slate-600 leading-relaxed">{f.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Safety Advisory tab */}
            {tab === 'advisory' && (
              <div className="space-y-3">
                <p className="text-2xs text-slate-600 font-semibold uppercase tracking-wider">Safety & Legal Advisory</p>
                <div className="p-3.5 bg-[#0a0700] border border-[#b8860b]/15 rounded-xl text-2xs text-slate-600 leading-relaxed space-y-2">
                  <p>
                    <span className="text-[#d4a017] font-semibold">Big V's Best Routes™</span> provides advisory route, GPS, vehicle, safety, and compliance support only. It does not guarantee route safety, legal compliance, road restriction accuracy, live road conditions, or vehicle suitability.
                  </p>
                  <p>The driver remains responsible for safe and legal driving, checking live road signs, restrictions, traffic laws, road conditions, and professional judgement.</p>
                  <p>
                    <span className="text-violet-400 font-semibold">4P3X Intelligent AI™</span> provides advisory support only. AI recommendations require human review and must not be treated as legal, safety, insurance, or professional certification.
                  </p>
                </div>
                <div className="p-3 bg-red-950/20 border border-red-700/20 rounded-xl text-2xs text-red-400/70 leading-relaxed">
                  If there is any doubt about route legality, vehicle suitability, restrictions, road safety, or live conditions — stop safely and verify through official sources before continuing.
                </div>
                <div className="space-y-1">
                  <p className="text-2xs text-slate-600 font-semibold">Advisory wording used in this product:</p>
                  {['Advisory only','Review required','Check required','Human judgement required','Possible risk','Data may be incomplete','Confidence estimate','Backend-ready','Local demo sync','Requires live validation'].map(w => (
                    <div key={w} className="flex items-center gap-1.5 text-2xs text-emerald-400/60">
                      <Icon name="Check" size={9} /> {w}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

/**
 * ============================================================
 * Big V's Best Routes™ — Sidebar (Burger Drawer)
 * /src/layouts/Sidebar.jsx
 *
 * Slides in from the left as a fixed overlay drawer.
 * Closes on nav, on overlay click, or on X button.
 * ============================================================
 */

import { useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Icon from './components_ui_Icon'
import StatusDot from './components_ui_StatusDot'
import { useAppStore } from './core_storage'
import { NAV_ITEMS, NAV_GROUPS } from './config_routes'

// ─── Logo ─────────────────────────────────────────────────────
function BrandLogo({ onClose }) {
  return (
    <div className="flex items-center justify-between px-4 py-4 border-b border-[#2a1f00]/80">
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 bg-[#b8860b]/15 border border-[#b8860b]/40 rounded-lg flex items-center justify-center">
            <span className="font-display font-bold text-[#d4a017] text-xs tracking-wider">BV</span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
        </div>
        <div className="min-w-0">
          <div className="font-display font-bold text-white text-sm leading-tight">Big V's Best Routes™</div>
          <div className="text-[#b8860b]/70 text-2xs tracking-widest uppercase">Powered by 4P3X Intelligent AI™</div>
        </div>
      </div>
      {/* Close X */}
      <button
        onClick={onClose}
        className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-slate-800/60 transition-colors"
        aria-label="Close menu"
      >
        <Icon name="X" size={16} />
      </button>
    </div>
  )
}

// ─── Nav Group Label ──────────────────────────────────────────
function NavGroupLabel({ label }) {
  if (!label) return null
  return (
    <div className="px-3 pt-4 pb-1">
      <span className="text-2xs font-semibold tracking-widest uppercase text-slate-600">
        {label}
      </span>
    </div>
  )
}

// ─── Nav Item ─────────────────────────────────────────────────
function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer group relative',
        active
          ? 'text-white bg-slate-800/80'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
      )}
    >
      {/* Active indicator */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#d4a017] rounded-r shadow-[0_0_8px_rgba(212,160,23,0.8)]" />
      )}
      <Icon
        name={item.icon}
        size={16}
        className={clsx(
          'flex-shrink-0 transition-colors',
          active ? 'text-[#d4a017]' : 'text-slate-500 group-hover:text-slate-300'
        )}
      />
      <span className="truncate">{item.label}</span>
      {item.highlight && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.9)] flex-shrink-0" />
      )}
      {item.badge && (
        <span className="ml-auto bg-red-500 text-white text-2xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
          {item.badge}
        </span>
      )}
    </button>
  )
}

// ─── Footer ───────────────────────────────────────────────────
function SidebarFooter() {
  return (
    <div className="px-3 py-3 border-t border-slate-800/60">
      <div className="flex items-center gap-2">
        <StatusDot status="online" />
        <span className="text-xs text-slate-500">Systems Nominal</span>
        <span className="ml-auto text-2xs text-slate-700 font-mono">v1.0.0</span>
      </div>
      <div className="mt-1.5 text-2xs text-slate-700 text-center">
        Created by Kyzel Kreates™
      </div>
    </div>
  )
}

// ─── Sidebar Root ─────────────────────────────────────────────
export default function Sidebar() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const isOpen    = useAppStore(s => s.sidebarExpanded)
  const close     = useAppStore(s => s.closeSidebar)

  const groupOrder = Object.entries(NAV_GROUPS)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key]) => key)

  const grouped = groupOrder.reduce((acc, group) => {
    const items = NAV_ITEMS.filter(i => i.group === group)
    if (items.length) acc[group] = items
    return acc
  }, {})

  const handleNav = (route) => {
    navigate(route)
    close()
  }

  return (
    <aside
      className={clsx(
        // Fixed overlay drawer
        'fixed top-0 left-0 h-full z-50',
        'flex flex-col bg-[#070708] border-r border-[#2a1f00]/60',
        'w-72 transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <BrandLogo onClose={close} />

      <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none px-2 py-2">
        {groupOrder.map(group => {
          const items = grouped[group]
          if (!items) return null
          return (
            <div key={group}>
              <NavGroupLabel label={NAV_GROUPS[group].label} />
              <div className="space-y-0.5">
                {items.map(item => (
                  <NavItem
                    key={item.id}
                    item={item}
                    active={
                      location.pathname === item.route ||
                      location.pathname.startsWith(item.route + '/')
                    }
                    onClick={() => handleNav(item.route)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Navigation PWA shortcut */}
      <div className="px-3 pb-2">
        <a href="#/driver-setup" className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#b8860b]/30 bg-[#b8860b]/8 hover:bg-[#b8860b]/15 transition-colors group">
          <Icon name="Smartphone" size={14} className="text-[#d4a017] flex-shrink-0" />
          <span className="text-xs font-semibold text-[#d4a017] flex-1">Navigation PWA Setup</span>
          <Icon name="ChevronRight" size={11} className="text-[#b8860b]/60 group-hover:text-[#d4a017] transition-colors" />
        </a>
      </div>

      <SidebarFooter />
    </aside>
  )
}

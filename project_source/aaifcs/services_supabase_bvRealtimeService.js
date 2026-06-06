/**
 * ============================================================
 * Big V's Best Routes™ — Live Realtime Service (Run 11)
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 *
 * Manages Supabase Realtime channel subscriptions for Live Mode.
 *
 * ── Rules ─────────────────────────────────────────────────────
 * Subscriptions ONLY start when:
 *   1. Demo mode is OFF
 *   2. isLiveSyncActive() === true
 *   3. A valid Supabase client exists
 *
 * Subscriptions STOP when:
 *   - Demo mode is turned ON
 *   - User signs out of live session
 *   - Component using the subscription unmounts
 *   - unsubscribeLiveChannels() is called
 *
 * ── Status wording (honest only) ─────────────────────────────
 * "Live realtime active"           — channel SUBSCRIBED
 * "Realtime unavailable"           — channel failed/error
 * "Live schema ready, realtime not active" — configured but no subscription
 * "Demo Mode active — realtime disabled"   — demo mode on
 *
 * ── Security ──────────────────────────────────────────────────
 * 4P3X API Config Guard™ active.
 * No backend-only secrets. Anon key only via Supabase SDK.
 * ============================================================
 */

import { getSupabaseClient }       from './services_supabase_supabaseClient'
import { useBackendConfigStore }   from './core_storage'
import { BV_TABLES }               from './services_supabase_bvSupabaseAdapter'

// ─── Channel status types ─────────────────────────────────────
export const REALTIME_STATUS = {
  ACTIVE:      'active',       // channel SUBSCRIBED confirmed
  CONNECTING:  'connecting',   // attempting subscription
  ERROR:       'error',        // channel failed
  INACTIVE:    'inactive',     // not started
  DEMO:        'demo',         // demo mode — disabled
}

export const REALTIME_STATUS_LABELS = {
  [REALTIME_STATUS.ACTIVE]:     'Live realtime active',
  [REALTIME_STATUS.CONNECTING]: 'Connecting to realtime…',
  [REALTIME_STATUS.ERROR]:      'Realtime unavailable',
  [REALTIME_STATUS.INACTIVE]:   'Live schema ready, realtime not active',
  [REALTIME_STATUS.DEMO]:       'Demo Mode active — realtime disabled',
}

// ─── Singleton channel registry ───────────────────────────────
// Map of channelKey → { channel, status, table, callbacks }
const _channels = new Map()

// ─── Internal: safe guard ────────────────────────────────────
function realtimeGuard() {
  const bc = useBackendConfigStore.getState()
  if (bc.isDemoMode())        return 'demo'
  if (!bc.isLiveSyncActive()) return 'inactive'
  if (!getSupabaseClient())   return 'inactive'
  return null  // clear to proceed
}

// ─── Internal: build channel key ─────────────────────────────
function channelKey(table, filter = '') {
  return `bv_live_${table}${filter ? '_' + filter : ''}`
}

// ═══════════════════════════════════════════════════════════════
//  subscribeToLiveTable — generic table subscription
//
//  @param table       — one of BV_TABLES.*
//  @param callbacks   — { onInsert?, onUpdate?, onDelete?, onStatusChange? }
//  @param filter      — optional postgres filter string e.g. 'status=eq.assigned'
//  @returns { channelKey, unsubscribe }
// ═══════════════════════════════════════════════════════════════
export function subscribeToLiveTable(table, callbacks = {}, filter = '') {
  const guard = realtimeGuard()
  if (guard) {
    callbacks.onStatusChange?.(guard === 'demo' ? REALTIME_STATUS.DEMO : REALTIME_STATUS.INACTIVE)
    return {
      channelKey: channelKey(table, filter),
      unsubscribe: () => {},
    }
  }

  const key    = channelKey(table, filter)
  const client = getSupabaseClient()

  // Clean up any stale channel with the same key
  if (_channels.has(key)) {
    try { client.removeChannel(_channels.get(key).channel) } catch {}
    _channels.delete(key)
  }

  callbacks.onStatusChange?.(REALTIME_STATUS.CONNECTING)

  // Build channel
  let channelBuilder = client
    .channel(key)
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table,
        ...(filter ? { filter } : {}),
      },
      (payload) => {
        callbacks.onInsert?.(payload.new, payload)
      },
    )
    .on(
      'postgres_changes',
      {
        event:  'UPDATE',
        schema: 'public',
        table,
        ...(filter ? { filter } : {}),
      },
      (payload) => {
        callbacks.onUpdate?.(payload.new, payload.old, payload)
      },
    )
    .on(
      'postgres_changes',
      {
        event:  'DELETE',
        schema: 'public',
        table,
        ...(filter ? { filter } : {}),
      },
      (payload) => {
        callbacks.onDelete?.(payload.old, payload)
      },
    )

  const channel = channelBuilder.subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      console.info('[BvRealtime] Channel subscribed:', key)
      callbacks.onStatusChange?.(REALTIME_STATUS.ACTIVE)
      _channels.set(key, { channel, status: REALTIME_STATUS.ACTIVE, table })
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || err) {
      console.warn('[BvRealtime] Channel error:', key, status, err?.message || '')
      callbacks.onStatusChange?.(REALTIME_STATUS.ERROR)
      _channels.set(key, { channel, status: REALTIME_STATUS.ERROR, table })
    } else if (status === 'CLOSED') {
      console.debug('[BvRealtime] Channel closed:', key)
      callbacks.onStatusChange?.(REALTIME_STATUS.INACTIVE)
      _channels.delete(key)
    }
  })

  _channels.set(key, { channel, status: REALTIME_STATUS.CONNECTING, table })

  const unsubscribe = () => {
    try {
      if (_channels.has(key)) {
        client.removeChannel(_channels.get(key).channel)
        _channels.delete(key)
      }
    } catch (e) {
      console.debug('[BvRealtime] Unsubscribe error (non-fatal):', e.message)
    }
  }

  return { channelKey: key, unsubscribe }
}

// ═══════════════════════════════════════════════════════════════
//  Convenience subscriptions per entity
// ═══════════════════════════════════════════════════════════════

/**
 * subscribeToLiveAssignments
 * @param {Function} onInsert   — called with new row when an assignment is created
 * @param {Function} onUpdate   — called with (newRow, oldRow) when status changes
 * @param {Function} onStatusChange — called with REALTIME_STATUS.*
 * @returns {{ channelKey, unsubscribe }}
 */
export function subscribeToLiveAssignments({ onInsert, onUpdate, onDelete, onStatusChange } = {}) {
  return subscribeToLiveTable(BV_TABLES.ASSIGNMENTS, { onInsert, onUpdate, onDelete, onStatusChange })
}

/**
 * subscribeToLiveTripSessions
 */
export function subscribeToLiveTripSessions({ onInsert, onUpdate, onDelete, onStatusChange } = {}) {
  return subscribeToLiveTable(BV_TABLES.SESSIONS, { onInsert, onUpdate, onDelete, onStatusChange })
}

/**
 * subscribeToLiveDriverReports
 */
export function subscribeToLiveDriverReports({ onInsert, onUpdate, onDelete, onStatusChange } = {}) {
  return subscribeToLiveTable(BV_TABLES.REPORTS, { onInsert, onUpdate, onDelete, onStatusChange })
}

/**
 * subscribeToLiveComplianceChecks
 */
export function subscribeToLiveComplianceChecks({ onInsert, onUpdate, onDelete, onStatusChange } = {}) {
  return subscribeToLiveTable(BV_TABLES.COMPLIANCE, { onInsert, onUpdate, onDelete, onStatusChange })
}

// ═══════════════════════════════════════════════════════════════
//  unsubscribeLiveChannels — remove ALL active channels
// ═══════════════════════════════════════════════════════════════

/**
 * unsubscribeLiveChannels — call on sign-out, demo mode switch,
 * or app unmount. Safely clears all active Supabase channels.
 */
export function unsubscribeLiveChannels() {
  const client = getSupabaseClient()
  let removed = 0

  for (const [key, { channel }] of _channels.entries()) {
    try {
      if (client) client.removeChannel(channel)
      _channels.delete(key)
      removed++
    } catch (e) {
      console.debug('[BvRealtime] Remove channel error (non-fatal):', key, e.message)
    }
  }

  if (removed > 0) {
    console.info('[BvRealtime] Unsubscribed', removed, 'channel(s)')
  }
}

// ═══════════════════════════════════════════════════════════════
//  getRealtimeStatus — read status of a specific channel
// ═══════════════════════════════════════════════════════════════

export function getChannelStatus(key) {
  const entry = _channels.get(key)
  if (!entry) return REALTIME_STATUS.INACTIVE
  return entry.status
}

export function getAllChannelStatuses() {
  const result = {}
  for (const [key, { status, table }] of _channels.entries()) {
    result[key] = { status, table, label: REALTIME_STATUS_LABELS[status] || status }
  }
  return result
}

export function getActiveChannelCount() {
  let count = 0
  for (const { status } of _channels.values()) {
    if (status === REALTIME_STATUS.ACTIVE) count++
  }
  return count
}

// ─── Named exports ────────────────────────────────────────────
export default {
  subscribeToLiveTable,
  subscribeToLiveAssignments,
  subscribeToLiveTripSessions,
  subscribeToLiveDriverReports,
  subscribeToLiveComplianceChecks,
  unsubscribeLiveChannels,
  getChannelStatus,
  getAllChannelStatuses,
  getActiveChannelCount,
  REALTIME_STATUS,
  REALTIME_STATUS_LABELS,
}

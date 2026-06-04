/**
 * ============================================================
 * Big V's Best Routes™ — RouteMap Component  (Run 4)
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 *
 * Shared reusable map for the Route Planner and Dashboard.
 * Supports:
 *   - 2D OSM mode via Leaflet (react-leaflet — already installed)
 *   - 3D tilted mode via MapLibre GL JS (new dep: maplibre-gl)
 *   - Mode toggle (2D ↔ 3D)
 *   - Origin / Destination markers
 *   - Current position marker
 *   - Route polyline rendering
 *   - GPS permission handling
 *   - Provider fallback states
 *   - Loading / error / no-route states
 *
 * ADVISORY: Map data may be incomplete or out of date.
 * Always follow live road signs, restrictions, traffic laws,
 * and safe driving judgement. Big V's Best Routes™ is advisory
 * only and does not guarantee legal route suitability.
 * ============================================================
 */

import {
  useState, useEffect, useRef, useCallback, memo, Suspense, lazy
} from 'react'
import {
  MapContainer, TileLayer, Marker, Polyline, Popup,
  useMap, useMapEvents
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Icon from './components_ui_Icon'
import { useMapStore } from './core_storage'
import {
  normaliseCoords, toLeafletLine, toMapLibreLine,
  getLeafletBounds, getMapLibreBounds,
  getRoutePlanPoints, getRoutePlanPolyline,
} from './services_maps_routeGeometry'

// ─── Leaflet icon fix (Vite asset hashing) ───────────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ─── Custom markers ───────────────────────────────────────────
function makeDivIcon(html, size = [32, 32], anchor = [16, 32]) {
  return L.divIcon({ className: '', iconSize: size, iconAnchor: anchor, html })
}

const ORIGIN_ICON = makeDivIcon(`
  <div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    background:#10b981;border:2px solid #fff;box-shadow:0 2px 8px rgba(16,185,129,0.5)">
  </div>`, [28, 34], [14, 34])

const DEST_ICON = makeDivIcon(`
  <div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    background:#b8860b;border:2px solid #fff;box-shadow:0 2px 8px rgba(184,134,11,0.5)">
  </div>`, [28, 34], [14, 34])

const GPS_ICON = makeDivIcon(`
  <div style="width:20px;height:20px;border-radius:50%;background:rgba(59,130,246,0.25);
    border:2px solid #3b82f6;box-shadow:0 0 12px rgba(59,130,246,0.6);
    display:flex;align-items:center;justify-content:center;">
    <div style="width:8px;height:8px;border-radius:50%;background:#3b82f6;"></div>
  </div>`, [20, 20], [10, 10])

// ─── Bounds fitter (Leaflet inner component) ──────────────────
function BoundsFitter({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds && map) {
      try { map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 }) } catch {}
    }
  }, [bounds, map])
  return null
}

// ─── 2D OSM Map (Leaflet) ─────────────────────────────────────
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIB   = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors (ODbL)'

function LeafletMap2D({ origin, destination, polyline, gpsPos, center, zoom }) {
  const [tileError, setTileError] = useState(false)
  const leafletCoords = toLeafletLine(polyline)
  const bounds = leafletCoords.length >= 2
    ? getLeafletBounds(polyline)
    : (origin && destination ? [[origin.lat, origin.lng], [destination.lat, destination.lng]] : null)

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center ? [center.lat, center.lng] : [51.5074, -0.1278]}
        zoom={zoom || 11}
        style={{ width: '100%', height: '100%', background: '#050810' }}
        zoomControl={false}
        attributionControl={false}
      >
        {/* OSM tiles */}
        <TileLayer
          url={OSM_TILE_URL}
          attribution={OSM_ATTRIB}
          subdomains={['a','b','c']}
          maxZoom={19}
          tileSize={256}
          className="bv-osm-tile"
          eventHandlers={{ tileerror: () => setTileError(true) }}
        />

        {/* Bounds fitter */}
        {bounds && <BoundsFitter bounds={bounds} />}

        {/* Route polyline */}
        {leafletCoords.length >= 2 && (
          <Polyline
            positions={leafletCoords}
            color="#b8860b"
            weight={4}
            opacity={0.9}
            dashArray=""
          />
        )}

        {/* Origin marker */}
        {origin && (
          <Marker position={[origin.lat, origin.lng]} icon={ORIGIN_ICON}>
            <Popup className="bv-popup">Origin</Popup>
          </Marker>
        )}

        {/* Destination marker */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={DEST_ICON}>
            <Popup className="bv-popup">Destination</Popup>
          </Marker>
        )}

        {/* GPS / current position */}
        {gpsPos && (
          <Marker position={[gpsPos.lat, gpsPos.lng]} icon={GPS_ICON}>
            <Popup className="bv-popup">Your location</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Attribution — always shown (OSM license requirement) */}
      <div className="absolute bottom-0 right-0 z-[999] text-[9px] text-slate-400 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-tl-md">
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" className="hover:text-cyan-400">
          © OpenStreetMap contributors
        </a>
        <span className="mx-1 text-slate-600">|</span>
        <span>ODbL</span>
      </div>

      {/* Tile error warning */}
      {tileError && (
        <div className="absolute top-2 left-2 right-2 z-[999] text-xs text-amber-400 bg-amber-950/80 border border-amber-700/40 rounded-lg px-3 py-2 text-center">
          Map tiles unavailable. Check your connection.
        </div>
      )}
    </div>
  )
}

// ─── 3D MapLibre Map ──────────────────────────────────────────
// Loaded lazily so a missing/failed import doesn't crash the app.
function MapLibre3D({ origin, destination, polyline, gpsPos, center, zoom, onFallback }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const [ready,  setReady]  = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let map = null
    let cancelled = false

    async function initMap() {
      try {
        // Dynamic import — won't crash at module level if missing
        const maplibre = await import('maplibre-gl')
        if (cancelled || !containerRef.current) return
        await import('maplibre-gl/dist/maplibre-gl.css')

        const ML = maplibre.default || maplibre

        const startCenter = center || { lat: 51.5074, lng: -0.1278 }

        map = new ML.Map({
          container:   containerRef.current,
          style: {
            version: 8,
            sources: {
              osm: {
                type:        'raster',
                tiles:       ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize:    256,
                attribution: '© OpenStreetMap contributors (ODbL)',
                maxzoom:     19,
              }
            },
            layers: [{
              id:     'osm-tiles',
              type:   'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 22,
            }]
          },
          center:      [startCenter.lng, startCenter.lat],
          zoom:        (zoom || 11) - 1,
          pitch:       45,
          bearing:     0,
          antialias:   true,
        })

        map.on('load', () => {
          if (cancelled) { map.remove(); return }
          mapRef.current = map
          setReady(true)

          // Route polyline source
          const mlCoords = toMapLibreLine(polyline)
          if (mlCoords.length >= 2) {
            map.addSource('bv-route', {
              type: 'geojson',
              data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: mlCoords } }
            })
            map.addLayer({
              id: 'bv-route-line', type: 'line', source: 'bv-route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint:  { 'line-color': '#b8860b', 'line-width': 4, 'line-opacity': 0.9 }
            })

            // Fit bounds to polyline
            const bounds = getMapLibreBounds(polyline)
            if (bounds) {
              try { map.fitBounds(bounds, { padding: 50, maxZoom: 14 }) } catch {}
            }
          } else if (origin && destination) {
            // Fit to markers
            try {
              map.fitBounds(
                [[Math.min(origin.lng, destination.lng), Math.min(origin.lat, destination.lat)],
                 [Math.max(origin.lng, destination.lng), Math.max(origin.lat, destination.lat)]],
                { padding: 60, maxZoom: 14 }
              )
            } catch {}
          }

          // Origin marker
          if (origin) {
            const el = document.createElement('div')
            el.style.cssText = `width:24px;height:24px;border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);background:#10b981;border:2px solid #fff;
              box-shadow:0 2px 8px rgba(16,185,129,0.6);cursor:pointer`
            new ML.Marker({ element: el, anchor: 'bottom' })
              .setLngLat([origin.lng, origin.lat])
              .setPopup(new ML.Popup({ offset: 25 }).setText('Origin'))
              .addTo(map)
          }

          // Destination marker
          if (destination) {
            const el = document.createElement('div')
            el.style.cssText = `width:24px;height:24px;border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);background:#b8860b;border:2px solid #fff;
              box-shadow:0 2px 8px rgba(184,134,11,0.6);cursor:pointer`
            new ML.Marker({ element: el, anchor: 'bottom' })
              .setLngLat([destination.lng, destination.lat])
              .setPopup(new ML.Popup({ offset: 25 }).setText('Destination'))
              .addTo(map)
          }

          // GPS marker
          if (gpsPos) {
            const el = document.createElement('div')
            el.style.cssText = `width:18px;height:18px;border-radius:50%;
              background:rgba(59,130,246,0.25);border:2px solid #3b82f6;
              box-shadow:0 0 12px rgba(59,130,246,0.7)`
            new ML.Marker({ element: el })
              .setLngLat([gpsPos.lng, gpsPos.lat])
              .addTo(map)
          }
        })

        map.on('error', (e) => {
          console.warn('[RouteMap] MapLibre error:', e)
          if (!ready) { setFailed(true); onFallback?.('MapLibre encountered an error.') }
        })

      } catch (err) {
        console.warn('[RouteMap] MapLibre init failed:', err)
        if (!cancelled) { setFailed(true); onFallback?.(err.message || 'MapLibre unavailable.') }
      }
    }

    initMap()

    return () => {
      cancelled = true
      try { mapRef.current?.remove(); mapRef.current = null } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally runs once — re-mounting on mode toggle handles updates

  if (failed) return null // parent renders fallback

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Attribution */}
      <div className="absolute bottom-0 right-0 z-[999] text-[9px] text-slate-400 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-tl-md">
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" className="hover:text-cyan-400">
          © OpenStreetMap contributors
        </a>
        <span className="mx-1 text-slate-600">|</span>
        MapLibre GL JS
      </div>

      {/* Loading overlay */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#050810]/90 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-[#b8860b]/30 border-t-[#b8860b] rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-mono">LOADING 3D MAP</span>
          </div>
        </div>
      )}

      {/* 3D badge */}
      {ready && (
        <div className="absolute top-2 left-2 z-[999] text-2xs text-slate-300 bg-black/60 backdrop-blur-sm border border-slate-700/50 px-2 py-0.5 rounded font-mono">
          3D · MapLibre GL
        </div>
      )}
    </div>
  )
}

// ─── GPS hook ─────────────────────────────────────────────────
function useGPS() {
  const { gpsStatus, lastPosition, setGpsStatus, setLastPosition } = useMapStore(s => ({
    gpsStatus:    s.gpsStatus,
    lastPosition: s.lastPosition,
    setGpsStatus: s.setGpsStatus,
    setLastPosition: s.setLastPosition,
  }))

  const requestGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable')
      return
    }
    setGpsStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsStatus('ready')
        setLastPosition({
          lat:       pos.coords.latitude,
          lng:       pos.coords.longitude,
          accuracy:  pos.coords.accuracy,
          timestamp: pos.timestamp,
        })
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setGpsStatus('denied')
        else setGpsStatus('unavailable')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  }, [setGpsStatus, setLastPosition])

  return { gpsStatus, lastPosition, requestGPS }
}

// ─── GPS status badge ─────────────────────────────────────────
function GpsStatusBadge({ status, onRequest }) {
  const cfg = {
    unknown:     { label: 'GPS: Unknown',  color: 'text-slate-500',   icon: 'MapPin' },
    requesting:  { label: 'GPS: Finding…', color: 'text-amber-400',   icon: 'Loader' },
    ready:       { label: 'GPS: Ready',    color: 'text-emerald-400', icon: 'MapPin' },
    denied:      { label: 'GPS: Denied',   color: 'text-red-400',     icon: 'MapPinOff' },
    unavailable: { label: 'GPS: N/A',      color: 'text-slate-500',   icon: 'MapPinOff' },
  }[status] || { label: 'GPS', color: 'text-slate-500', icon: 'MapPin' }

  return (
    <button
      onClick={status === 'unknown' || status === 'denied' ? onRequest : undefined}
      className={`flex items-center gap-1 text-2xs font-mono px-2 py-1 rounded-lg border border-slate-800/60 bg-slate-900/60 transition-all ${cfg.color} ${status === 'unknown' ? 'hover:border-blue-500/30 cursor-pointer' : 'cursor-default'}`}
      title={status === 'denied' ? 'GPS permission denied. Allow location in browser settings.' : 'Click to get GPS location'}
    >
      <Icon name={cfg.icon} size={10} className={status === 'requesting' ? 'animate-spin' : ''} />
      {cfg.label}
    </button>
  )
}

// ─── Map mode toggle ──────────────────────────────────────────
function MapModeToggle({ mode, onChange, fallbackMsg }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex rounded-lg overflow-hidden border border-slate-800/60 bg-slate-900/60">
        <button
          onClick={() => onChange('2d')}
          className={`flex-1 flex items-center justify-center gap-1.5 text-2xs font-semibold py-1.5 px-2 transition-all ${
            mode === '2d' ? 'bg-[#b8860b]/20 text-[#d4a017] border-r border-slate-800/60' : 'text-slate-500 hover:text-slate-300 border-r border-slate-800/60'
          }`}
        >
          <Icon name="Map" size={11} />
          2D OSM
        </button>
        <button
          onClick={() => onChange('3d')}
          className={`flex-1 flex items-center justify-center gap-1.5 text-2xs font-semibold py-1.5 px-2 transition-all ${
            mode === '3d' ? 'bg-violet-500/15 text-violet-300' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Icon name="Layers3" size={11} />
          3D MapLibre
        </button>
      </div>
      {fallbackMsg && (
        <div className="text-2xs text-amber-400 bg-amber-950/40 border border-amber-700/30 rounded px-2 py-1">
          {fallbackMsg}
        </div>
      )}
    </div>
  )
}

// ─── Map status panel ─────────────────────────────────────────
function MapStatusPanel({ mode, hasGeometry, gpsStatus, onGpsRequest, demoMode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-950/80 border-t border-slate-800/60 text-2xs">
      {/* Mode */}
      <span className={`font-mono ${mode === '3d' ? 'text-violet-400' : 'text-cyan-400'}`}>
        {mode === '3d' ? '3D MapLibre GL' : '2D OSM Map'}
      </span>

      <span className="text-slate-700">·</span>

      {/* Provider */}
      <span className="text-slate-500">Provider: {mode === '3d' ? 'MapLibre + OSM' : 'OpenStreetMap'}</span>

      <span className="text-slate-700">·</span>

      {/* Geometry */}
      <span className={hasGeometry ? 'text-emerald-400' : 'text-slate-600'}>
        Route geometry: {hasGeometry ? 'available' : 'not yet available'}
      </span>

      <span className="text-slate-700">·</span>

      {/* GPS */}
      <GpsStatusBadge status={gpsStatus} onRequest={onGpsRequest} />

      {/* Demo badge */}
      {demoMode && (
        <>
          <span className="text-slate-700">·</span>
          <span className="text-violet-400 bg-violet-500/8 border border-violet-500/20 px-1.5 py-0.5 rounded">Demo</span>
        </>
      )}
    </div>
  )
}

// ─── No-route / no-geometry states ───────────────────────────
function NoRouteOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#050810]/85 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 text-center px-6">
        <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center">
          <Icon name="Route" size={20} className="text-slate-600" />
        </div>
        <p className="text-sm text-slate-400 font-semibold">No route selected</p>
        <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
          Select or create a route plan in the Route Planner to display it on the map.
        </p>
      </div>
    </div>
  )
}

function NoGeometryOverlay() {
  return (
    <div className="absolute top-3 left-3 right-3 z-10 text-xs text-amber-400 bg-amber-950/70 border border-amber-700/30 rounded-xl px-4 py-2.5 text-center backdrop-blur-sm">
      No route geometry available yet. Route summary can still be reviewed.
      <span className="block text-2xs text-amber-500/60 mt-0.5">Map geometry will be added in Run 4+ routing.</span>
    </div>
  )
}

// ─── Safety disclaimer ────────────────────────────────────────
function MapDisclaimer() {
  return (
    <div className="px-3 py-2 bg-[#0a0700] border-t border-[#b8860b]/15 text-2xs text-slate-600 leading-relaxed">
      ⚠ Map data may be incomplete or out of date. Always follow live road signs, restrictions,
      traffic laws, and safe driving judgement. Big V's Best Routes™ is advisory only and does not
      guarantee legal route suitability.
    </div>
  )
}

// ─── Main RouteMap component ──────────────────────────────────
/**
 * RouteMap — reusable map for Route Planner + Dashboard
 *
 * Props:
 *   routePlan     — BV route plan object (from useRouteStore)
 *   showControls  — show mode toggle + status panel (default true)
 *   height        — CSS height string (default '400px')
 *   showDisclaimer— show safety advisory (default true)
 *   demoMode      — is demo mode active?
 *   className     — extra class on outer wrapper
 */
export default memo(function RouteMap({
  routePlan    = null,
  showControls = true,
  height       = '400px',
  showDisclaimer = true,
  demoMode     = false,
  className    = '',
}) {
  const { mapMode, mapFallback, setMapMode, setMapFallback } = useMapStore(s => ({
    mapMode:       s.mapMode,
    mapFallback:   s.mapFallback,
    setMapMode:    s.setMapMode,
    setMapFallback: s.setMapFallback,
  }))

  const { gpsStatus, lastPosition, requestGPS } = useGPS()
  const [mapKey, setMapKey] = useState(0)   // bump to remount on mode switch

  // Derive display data from active route plan
  const { origin, destination }  = routePlan ? getRoutePlanPoints(routePlan) : { origin: null, destination: null }
  const polylineCoords           = routePlan ? getRoutePlanPolyline(routePlan) : []
  const hasGeometry              = polylineCoords.length >= 2
  const hasRoute                 = !!routePlan
  const hasMarkers               = !!(origin && destination)

  // Default center: route midpoint, or origin, or last known, or London
  const defaultCenter = (() => {
    if (origin && destination) return {
      lat: (origin.lat + destination.lat) / 2,
      lng: (origin.lng  + destination.lng) / 2,
    }
    if (origin) return origin
    if (lastPosition) return lastPosition
    return { lat: 51.5074, lng: -0.1278 }
  })()

  const handleModeChange = useCallback((mode) => {
    setMapMode(mode)
    setMapKey(k => k + 1)  // force remount so MapLibre properly initialises
  }, [setMapMode])

  const handleMapLibreFallback = useCallback((reason) => {
    setMapFallback('3D MapLibre view is unavailable on this device/provider mode. Showing 2D OSM map instead.')
    setMapKey(k => k + 1)
  }, [setMapFallback])

  const effectiveMode = (mapMode === '3d' && mapFallback) ? '2d' : mapMode

  return (
    <div className={`flex flex-col bg-[#050810] border border-slate-800/60 rounded-xl overflow-hidden ${className}`}>

      {/* Controls bar */}
      {showControls && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-[#0a0a0b] border-b border-slate-800/60 flex-wrap">
          <MapModeToggle
            mode={effectiveMode}
            onChange={handleModeChange}
            fallbackMsg={mapFallback}
          />
          <GpsStatusBadge status={gpsStatus} onRequest={requestGPS} />
        </div>
      )}

      {/* Map area */}
      <div className="relative flex-1" style={{ height }}>
        {/* No route overlay */}
        {!hasRoute && <NoRouteOverlay />}

        {/* No geometry warning (shown over the map, not blocking) */}
        {hasRoute && !hasGeometry && hasMarkers && <NoGeometryOverlay />}

        {/* 2D Leaflet */}
        {effectiveMode === '2d' && (
          <LeafletMap2D
            key={`2d-${mapKey}`}
            origin={origin}
            destination={destination}
            polyline={polylineCoords}
            gpsPos={gpsStatus === 'ready' ? lastPosition : null}
            center={defaultCenter}
            zoom={11}
          />
        )}

        {/* 3D MapLibre */}
        {effectiveMode === '3d' && (
          <MapLibre3D
            key={`3d-${mapKey}`}
            origin={origin}
            destination={destination}
            polyline={polylineCoords}
            gpsPos={gpsStatus === 'ready' ? lastPosition : null}
            center={defaultCenter}
            zoom={11}
            onFallback={handleMapLibreFallback}
          />
        )}
      </div>

      {/* Status panel */}
      {showControls && (
        <MapStatusPanel
          mode={effectiveMode}
          hasGeometry={hasGeometry}
          gpsStatus={gpsStatus}
          onGpsRequest={requestGPS}
          demoMode={demoMode}
        />
      )}

      {/* Safety disclaimer */}
      {showDisclaimer && <MapDisclaimer />}
    </div>
  )
})

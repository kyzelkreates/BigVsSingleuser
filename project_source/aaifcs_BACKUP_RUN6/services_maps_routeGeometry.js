/**
 * ============================================================
 * Big V's Best Routes™ — Route Geometry Helper  (Run 4)
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 *
 * Normalises route coordinate data from any supported format
 * into a single canonical [[lat, lng]] array.
 *
 * Supported input formats:
 *   [{lat, lng}]           → standard LatLng objects
 *   [{latitude, longitude}]→ Geolocation API style
 *   [[lat, lng]]           → legacy array pairs (lat-first)
 *   [[lng, lat]]           → GeoJSON / MapLibre style (lng-first)
 *
 * For [[lng,lat]] vs [[lat,lng]] ambiguity we apply a simple
 * heuristic: if the first element [0] is in the range [-180,180]
 * and the second [1] is in [-90,90], we treat it as [lng,lat].
 * UK-centric: lat ~49–60, lng ~-8 to +2 so this is unambiguous.
 *
 * ADVISORY: Geometry helpers support route display only.
 * They do not validate legal route suitability.
 * ============================================================
 */

/**
 * Normalise a coordinate pair from any supported format.
 * Returns {lat, lng} or null if invalid.
 */
export function normaliseCoord(coord) {
  if (!coord) return null

  // {lat, lng}
  if (typeof coord.lat === 'number' && typeof coord.lng === 'number') {
    return isValidLatLng(coord.lat, coord.lng) ? { lat: coord.lat, lng: coord.lng } : null
  }
  // {latitude, longitude}
  if (typeof coord.latitude === 'number' && typeof coord.longitude === 'number') {
    return isValidLatLng(coord.latitude, coord.longitude)
      ? { lat: coord.latitude, lng: coord.longitude } : null
  }
  // [a, b] — detect [lng,lat] vs [lat,lng]
  if (Array.isArray(coord) && coord.length >= 2) {
    const [a, b] = coord
    if (typeof a !== 'number' || typeof b !== 'number') return null
    // Heuristic: if a is outside [-90,90] it cannot be lat → treat as [lng,lat]
    if (Math.abs(a) > 90) {
      return isValidLatLng(b, a) ? { lat: b, lng: a } : null
    }
    // Both in valid ranges — assume [lat, lng]
    return isValidLatLng(a, b) ? { lat: a, lng: b } : null
  }
  return null
}

/** Normalise an array of coordinates into [{lat,lng}] */
export function normaliseCoords(coords) {
  if (!Array.isArray(coords) || coords.length === 0) return []
  return coords.map(normaliseCoord).filter(Boolean)
}

/** Convert [{lat,lng}] → [[lat,lng]] for Leaflet Polyline */
export function toLeafletLine(coords) {
  return normaliseCoords(coords).map(c => [c.lat, c.lng])
}

/** Convert [{lat,lng}] → [[lng,lat]] for MapLibre GeoJSON LineString */
export function toMapLibreLine(coords) {
  return normaliseCoords(coords).map(c => [c.lng, c.lat])
}

/** Return a Leaflet-compatible bounds array [[minLat,minLng],[maxLat,maxLng]] or null */
export function getLeafletBounds(coords) {
  const pts = normaliseCoords(coords)
  if (pts.length < 2) return null
  const lats = pts.map(c => c.lat)
  const lngs = pts.map(c => c.lng)
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]
}

/** Return a MapLibre-compatible LngLatBounds array [[minLng,minLat],[maxLng,maxLat]] or null */
export function getMapLibreBounds(coords) {
  const pts = normaliseCoords(coords)
  if (pts.length < 2) return null
  const lats = pts.map(c => c.lat)
  const lngs = pts.map(c => c.lng)
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]
}

/** Extract origin/destination from a BV route plan */
export function getRoutePlanPoints(plan) {
  if (!plan) return { origin: null, destination: null, hasCoords: false }
  const origin = isValidLatLng(plan.origin?.lat, plan.origin?.lng)
    ? { lat: plan.origin.lat, lng: plan.origin.lng } : null
  const destination = isValidLatLng(plan.destination?.lat, plan.destination?.lng)
    ? { lat: plan.destination.lat, lng: plan.destination.lng } : null
  return { origin, destination, hasCoords: !!(origin && destination) }
}

/** Extract polyline coordinates from a BV route plan */
export function getRoutePlanPolyline(plan) {
  if (!plan) return []
  // Future: plan.geometry, plan.polyline, plan.coordinates
  const raw = plan.geometry || plan.polyline || plan.coordinates || plan.points || []
  return normaliseCoords(raw)
}

/** True if a BV route plan has renderable map data */
export function routeHasMapData(plan) {
  const { hasCoords } = getRoutePlanPoints(plan)
  const polyline = getRoutePlanPolyline(plan)
  return hasCoords || polyline.length >= 2
}

// ─── Internal ─────────────────────────────────────────────────
function isValidLatLng(lat, lng) {
  return typeof lat === 'number' && typeof lng === 'number' &&
         !isNaN(lat) && !isNaN(lng) &&
         lat >= -90 && lat <= 90 &&
         lng >= -180 && lng <= 180
}

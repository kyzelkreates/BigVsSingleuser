/**
 * ============================================================
 * Big V's Best Routes™ — Route Service  (Run 3)
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 *
 * Pure logic — no UI, no side effects.
 * Exports:
 *   ROUTE_INTENT            — intent option definitions
 *   RISK_LEVELS             — risk level constants
 *   ROUTE_STATUSES          — status constants
 *   createRouteId()
 *   createVehicleSnapshot(vehicle)
 *   buildRouteDefaults(activeVehicle)
 *   getDefaultPrefsForVehicle(vehicle)
 *   calculateRouteReadiness(plan, vehicle)
 *   calculateRouteRiskLevel(plan, vehicle)
 *   getRouteWarnings(plan, vehicle)
 *   validateRoutePlanInput(input, activeVehicle)
 *   getRouteReadinessLabel(score)
 *   getRiskLevelStyle(level)
 *
 * ADVISORY: Route plans are planning records only (Run 3).
 * Map rendering, road restriction checks, and live route
 * polyline validation are added in later runs. Always verify
 * live road signs, restrictions, and suitability before travel.
 * ============================================================
 */

import { VEHICLE_TYPES, getVehicleTemplate, getMissingCriticalFields, calculateVehicleReadiness } from './services_vehicles_vehicleService'

// ─── Route intent options ─────────────────────────────────────
export const ROUTE_INTENT = {
  SAFEST_SUITABLE:   'safest_suitable',
  AVOID_LOW_BRIDGES: 'avoid_low_bridges',
  AVOID_NARROW:      'avoid_narrow_roads',
  AVOID_WEIGHT:      'avoid_weight_restricted',
  AVOID_STEEP:       'avoid_steep_roads',
  AVOID_TIGHT_TURNS: 'avoid_tight_turns',
  MOTORHOME_FRIENDLY:'motorhome_rv_friendly',
  TRAILER_AWARE:     'trailer_aware',
  SHORTEST_PRACTICAL:'shortest_practical',
  CUSTOM_CAUTION:    'custom_caution',
}

export const ROUTE_INTENT_OPTIONS = [
  { value: ROUTE_INTENT.SAFEST_SUITABLE,    label: 'Safest Suitable Route',         icon: 'ShieldCheck',    desc: 'Prioritise safety and vehicle suitability.' },
  { value: ROUTE_INTENT.AVOID_LOW_BRIDGES,  label: 'Avoid Low Bridges',             icon: 'AlertTriangle',  desc: 'Route avoids known low bridge risk areas.' },
  { value: ROUTE_INTENT.AVOID_NARROW,       label: 'Avoid Narrow Roads',            icon: 'MoveHorizontal', desc: 'Prefer wider roads suitable for your vehicle.' },
  { value: ROUTE_INTENT.AVOID_WEIGHT,       label: 'Avoid Weight-Restricted Roads', icon: 'Scale',          desc: 'Avoid roads with weight restrictions.' },
  { value: ROUTE_INTENT.AVOID_STEEP,        label: 'Avoid Steep Roads',             icon: 'TrendingUp',     desc: 'Prefer flatter routes for heavy/tall vehicles.' },
  { value: ROUTE_INTENT.AVOID_TIGHT_TURNS,  label: 'Avoid Tight Turns',             icon: 'RotateCcw',      desc: 'Prefer routes with wider junctions and turns.' },
  { value: ROUTE_INTENT.MOTORHOME_FRIENDLY, label: 'Motorhome / RV Friendly',       icon: 'Bus',            desc: 'Optimised for motorhomes and large campervans.' },
  { value: ROUTE_INTENT.TRAILER_AWARE,      label: 'Trailer-Aware Route',           icon: 'Link',           desc: 'Accounts for trailer dimensions and turning.' },
  { value: ROUTE_INTENT.SHORTEST_PRACTICAL, label: 'Shortest Practical Route',      icon: 'Route',          desc: 'Shortest route suitable for this vehicle type.' },
  { value: ROUTE_INTENT.CUSTOM_CAUTION,     label: 'Custom Caution Route',          icon: 'Settings',       desc: 'Set your own safety preferences below.' },
]

// ─── Risk levels ──────────────────────────────────────────────
export const RISK_LEVELS = {
  LOW:      'low',
  MODERATE: 'moderate',
  HIGH:     'high',
  UNKNOWN:  'unknown',
}

// ─── Route statuses ───────────────────────────────────────────
export const ROUTE_STATUSES = {
  DRAFT:  'draft',
  READY:  'ready',
  ACTIVE: 'active',
  DONE:   'done',
}

// ─── Helpers ──────────────────────────────────────────────────

export function createRouteId() {
  return 'bvr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)
}

/**
 * createVehicleSnapshot — stores a point-in-time copy of vehicle data
 * with the route plan so future edits to the vehicle don't affect
 * historic route readiness display.
 */
export function createVehicleSnapshot(vehicle) {
  if (!vehicle) return null
  return {
    id:                    vehicle.id,
    name:                  vehicle.name,
    type:                  vehicle.type,
    registration:          vehicle.registration || '',
    heightM:               vehicle.heightM || '',
    widthM:                vehicle.widthM || '',
    lengthM:               vehicle.lengthM || '',
    weightKg:              vehicle.weightKg || '',
    maxGrossWeightKg:      vehicle.maxGrossWeightKg || '',
    axleCount:             vehicle.axleCount || '',
    hasTrailer:            vehicle.hasTrailer || false,
    trailerLengthM:        vehicle.trailerLengthM || '',
    trailerWidthM:         vehicle.trailerWidthM || '',
    trailerWeightKg:       vehicle.trailerWeightKg || '',
    totalCombinedLengthM:  vehicle.totalCombinedLengthM || '',
    totalCombinedWeightKg: vehicle.totalCombinedWeightKg || '',
    readinessScore:        vehicle.readinessScore || 0,
    snapshotAt:            new Date().toISOString(),
  }
}

/**
 * getDefaultPrefsForVehicle — derive intelligent preference defaults
 * from the active vehicle type.
 */
export function getDefaultPrefsForVehicle(vehicle) {
  const base = {
    avoidLowBridges:             false,
    avoidNarrowRoads:            false,
    avoidWeightRestrictedRoads:  false,
    avoidSteepRoads:             false,
    avoidTightTurns:             false,
    preferMainRoads:             true,
    avoidUnpavedRoads:           true,
    avoidCityCentres:            false,
    useVehicleDimensions:        false,
    requireDriverAcknowledgement:true,
  }

  if (!vehicle) return base

  const type = vehicle.type

  if (type === VEHICLE_TYPES.VAN || type === VEHICLE_TYPES.LARGE_VAN) {
    return { ...base, avoidLowBridges: true, avoidNarrowRoads: true, avoidWeightRestrictedRoads: true, useVehicleDimensions: true }
  }
  if (type === VEHICLE_TYPES.BOX_TRUCK) {
    return { ...base, avoidLowBridges: true, avoidNarrowRoads: true, avoidWeightRestrictedRoads: true, avoidTightTurns: true, useVehicleDimensions: true }
  }
  if (type === VEHICLE_TYPES.MOTORHOME) {
    return { ...base, avoidLowBridges: true, avoidNarrowRoads: true, avoidSteepRoads: true, avoidTightTurns: true, useVehicleDimensions: true }
  }
  if (type === VEHICLE_TYPES.CAR_TRAILER || type === VEHICLE_TYPES.VAN_TRAILER) {
    return { ...base, avoidNarrowRoads: true, avoidTightTurns: true, avoidWeightRestrictedRoads: true, useVehicleDimensions: true }
  }
  if (type === VEHICLE_TYPES.CAR) {
    return { ...base, avoidUnpavedRoads: true }
  }
  // CUSTOM or unknown
  return base
}

/**
 * buildRouteDefaults — blank route plan object with smart defaults.
 */
export function buildRouteDefaults(activeVehicle = null) {
  const now = new Date().toISOString()
  return {
    id:                          createRouteId(),
    name:                        '',
    origin:                      { label: '', address: '', lat: null, lng: null },
    destination:                 { label: '', address: '', lat: null, lng: null },
    vehicleId:                   activeVehicle?.id || null,
    vehicleSnapshot:             createVehicleSnapshot(activeVehicle),
    routeIntent:                 ROUTE_INTENT.SAFEST_SUITABLE,
    preferences:                 getDefaultPrefsForVehicle(activeVehicle),
    status:                      ROUTE_STATUSES.DRAFT,
    readinessScore:              0,
    riskLevel:                   RISK_LEVELS.UNKNOWN,
    warnings:                    [],
    missingCriticalData:         [],
    safetyDisclaimerAccepted:    false,
    driverAcknowledgementRequired: true,
    notes:                       '',
    createdAt:                   now,
    updatedAt:                   now,
    isActive:                    false,
    demoOnly:                    false,
  }
}

// ─── Readiness ────────────────────────────────────────────────

/**
 * calculateRouteReadiness — 0–100.
 * Factors: origin, destination, vehicle selected, vehicle readiness,
 *          critical vehicle fields complete.
 */
export function calculateRouteReadiness(plan, vehicle) {
  let score = 0

  const hasOrigin      = !!plan.origin?.label?.trim() || !!plan.origin?.address?.trim()
  const hasDest        = !!plan.destination?.label?.trim() || !!plan.destination?.address?.trim()
  const hasVehicle     = !!vehicle
  const vScore         = vehicle ? calculateVehicleReadiness(vehicle) : 0
  const missingCrit    = vehicle ? getMissingCriticalFields(vehicle) : []

  // Origin (15pts)
  if (hasOrigin) score += 15
  // Destination (15pts)
  if (hasDest)   score += 15
  // Vehicle selected (20pts)
  if (hasVehicle) score += 20
  // Vehicle readiness contributes up to 50pts
  if (hasVehicle) score += Math.round(vScore * 0.50)
  // Penalty: each missing legal-critical vehicle field -5pts (max -20)
  score -= Math.min(missingCrit.length * 5, 20)
  // Route name bonus (up to 5pts for completeness)
  if (plan.name?.trim()) score += 5

  return Math.round(Math.max(0, Math.min(100, score)))
}

export function getRouteReadinessLabel(score) {
  if (score >= 90) return { label: 'Ready for Map Check',          color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' }
  if (score >= 70) return { label: 'Needs Vehicle Details',        color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25' }
  if (score >= 40) return { label: 'Missing Route Information',    color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/25' }
  if (score >   0) return { label: 'Legal-critical Data Missing',  color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/25' }
  return                   { label: 'Draft Only',                  color: 'text-slate-500',   bg: 'bg-slate-800/40',   border: 'border-slate-700/40' }
}

// ─── Risk level ───────────────────────────────────────────────

/**
 * calculateRouteRiskLevel — preliminary non-map risk from vehicle data only.
 * NOT real road risk. "Preliminary planning risk only."
 */
export function calculateRouteRiskLevel(plan, vehicle) {
  if (!vehicle) return RISK_LEVELS.UNKNOWN

  const missingCrit = getMissingCriticalFields(vehicle)
  const type        = vehicle.type
  const vScore      = calculateVehicleReadiness(vehicle)

  // High risk scenarios
  if (missingCrit.length >= 3) return RISK_LEVELS.HIGH
  if (!plan.origin?.label?.trim() && !plan.origin?.address?.trim()) return RISK_LEVELS.HIGH
  if (!plan.destination?.label?.trim() && !plan.destination?.address?.trim()) return RISK_LEVELS.HIGH

  // High risk by type + missing data
  if ((type === VEHICLE_TYPES.BOX_TRUCK || type === VEHICLE_TYPES.VAN_TRAILER) && missingCrit.length >= 1) {
    return RISK_LEVELS.HIGH
  }

  // Moderate risk
  if (missingCrit.length >= 1) return RISK_LEVELS.MODERATE
  if (vScore < 70) return RISK_LEVELS.MODERATE
  if (type === VEHICLE_TYPES.CAR_TRAILER || type === VEHICLE_TYPES.VAN_TRAILER) return RISK_LEVELS.MODERATE
  if (type === VEHICLE_TYPES.MOTORHOME && vScore < 90) return RISK_LEVELS.MODERATE

  // Low risk
  if (vScore >= 90 && missingCrit.length === 0) return RISK_LEVELS.LOW

  return RISK_LEVELS.MODERATE
}

export function getRiskLevelStyle(level) {
  switch (level) {
    case RISK_LEVELS.LOW:      return { label: 'Low',      color: 'text-emerald-400', bg: 'bg-emerald-500/8',  border: 'border-emerald-500/25' }
    case RISK_LEVELS.MODERATE: return { label: 'Moderate', color: 'text-amber-400',   bg: 'bg-amber-500/8',    border: 'border-amber-500/25' }
    case RISK_LEVELS.HIGH:     return { label: 'High',     color: 'text-red-400',     bg: 'bg-red-500/8',      border: 'border-red-500/25' }
    default:                   return { label: 'Unknown',  color: 'text-slate-500',   bg: 'bg-slate-800/40',   border: 'border-slate-700/40' }
  }
}

// ─── Warnings ─────────────────────────────────────────────────

/**
 * getRouteWarnings — array of warning strings based on plan + vehicle state.
 */
export function getRouteWarnings(plan, vehicle) {
  const warnings = []

  if (!vehicle) {
    warnings.push({ key: 'no_vehicle',   level: 'critical', text: 'No active vehicle selected. Select a vehicle before planning a route.' })
    return warnings
  }

  const hasOrigin = !!plan.origin?.label?.trim() || !!plan.origin?.address?.trim()
  const hasDest   = !!plan.destination?.label?.trim() || !!plan.destination?.address?.trim()

  if (!hasOrigin)  warnings.push({ key: 'no_origin',  level: 'critical', text: 'Origin is required before a route plan can be saved.' })
  if (!hasDest)    warnings.push({ key: 'no_dest',    level: 'critical', text: 'Destination is required before a route plan can be saved.' })

  // Vehicle dimension warnings
  const type = vehicle.type
  const needsHeight  = [VEHICLE_TYPES.VAN, VEHICLE_TYPES.LARGE_VAN, VEHICLE_TYPES.BOX_TRUCK, VEHICLE_TYPES.MOTORHOME, VEHICLE_TYPES.VAN_TRAILER].includes(type)
  const needsWeight  = [VEHICLE_TYPES.VAN, VEHICLE_TYPES.LARGE_VAN, VEHICLE_TYPES.BOX_TRUCK, VEHICLE_TYPES.MOTORHOME, VEHICLE_TYPES.CAR_TRAILER, VEHICLE_TYPES.VAN_TRAILER].includes(type)
  const isTrailerSetup = [VEHICLE_TYPES.CAR_TRAILER, VEHICLE_TYPES.VAN_TRAILER].includes(type)

  if (needsHeight && !vehicle.heightM)
    warnings.push({ key: 'no_height', level: 'high', text: 'Height missing: low bridge risk checks cannot be prepared.' })
  if (!vehicle.widthM && type !== VEHICLE_TYPES.CAR)
    warnings.push({ key: 'no_width',  level: 'medium', text: 'Width missing: narrow road checks cannot be prepared.' })
  if (needsWeight && !vehicle.weightKg)
    warnings.push({ key: 'no_weight', level: 'high', text: 'Weight missing: weight restriction checks cannot be prepared.' })
  if (needsWeight && !vehicle.maxGrossWeightKg && type !== VEHICLE_TYPES.VAN)
    warnings.push({ key: 'no_gvw',   level: 'high', text: 'Max gross weight (GVW) missing: weight restriction checks cannot be prepared.' })
  if (isTrailerSetup && (!vehicle.trailerLengthM || !vehicle.trailerWeightKg))
    warnings.push({ key: 'no_trailer', level: 'high', text: 'Trailer dimensions missing: trailer-aware route checks cannot be prepared.' })
  if (isTrailerSetup && !vehicle.totalCombinedWeightKg)
    warnings.push({ key: 'no_combined_weight', level: 'high', text: 'Total combined weight missing: trailer weight restriction checks cannot be prepared.' })

  // Always add planning advisory
  warnings.push({ key: 'draft_advisory',  level: 'info', text: 'This is a planning draft only. Map-based validation will be added in Run 4.' })
  warnings.push({ key: 'driver_resp',     level: 'info', text: 'Driver/operator remains responsible for checking live road signs and restrictions.' })

  return warnings
}

// ─── Validation ───────────────────────────────────────────────

export function validateRoutePlanInput(input, activeVehicle) {
  const errors = {}

  if (!activeVehicle) {
    errors._vehicle = 'An active vehicle is required before creating a route plan. Go to Saved Vehicles and set an active vehicle.'
  }
  if (!input.origin?.label?.trim() && !input.origin?.address?.trim()) {
    errors.origin = 'Origin is required before a route plan can be saved.'
  }
  if (!input.destination?.label?.trim() && !input.destination?.address?.trim()) {
    errors.destination = 'Destination is required before a route plan can be saved.'
  }
  if (input.origin?.label && input.destination?.label &&
      input.origin.label.trim().toLowerCase() === input.destination.label.trim().toLowerCase()) {
    errors.destination = 'Origin and destination cannot be the same location.'
  }
  if (!input.routeIntent) {
    errors.routeIntent = 'Route intent is required.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

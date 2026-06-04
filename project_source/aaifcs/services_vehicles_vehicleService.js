/**
 * ============================================================
 * Big V's Best Routes™ — Vehicle Service  (Run 2)
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 *
 * Pure logic — no UI, no side effects.
 * Exports:
 *   VEHICLE_TEMPLATES       — type templates with field configs
 *   getVehicleTemplate(type)
 *   createVehicleId()
 *   buildVehicleDefaults(type)
 *   calculateVehicleReadiness(vehicle)
 *   getMissingVehicleFields(vehicle)
 *   getReadinessLabel(score)
 *
 * ADVISORY: This service prepares vehicle data for route-risk checks.
 * It does not guarantee legal compliance. The driver/operator remains
 * responsible for verifying dimensions, weights, restrictions, and
 * legal requirements before and during every journey.
 * ============================================================
 */

// ─── Vehicle type identifiers ─────────────────────────────────
export const VEHICLE_TYPES = {
  CAR:          'car',
  VAN:          'van',
  LARGE_VAN:    'large_van',
  BOX_TRUCK:    'box_truck',
  MOTORHOME:    'motorhome',
  CAR_TRAILER:  'car_trailer',
  VAN_TRAILER:  'van_trailer',
  CUSTOM:       'custom',
}

// ─── Field registry ───────────────────────────────────────────
// Each field key maps to a display label, unit, description, and flags.
export const VEHICLE_FIELDS = {
  name:                { label: 'Vehicle Name',              unit: '',    group: 'basic',       legalCritical: false, help: 'A friendly name for this vehicle.' },
  type:                { label: 'Vehicle Type',              unit: '',    group: 'basic',       legalCritical: false, help: 'Select the vehicle type to load the right fields.' },
  registration:        { label: 'Registration',              unit: '',    group: 'basic',       legalCritical: false, help: 'Vehicle registration/number plate.' },
  make:                { label: 'Make',                      unit: '',    group: 'basic',       legalCritical: false, help: 'e.g. Ford, Mercedes, Vauxhall' },
  model:               { label: 'Model',                     unit: '',    group: 'basic',       legalCritical: false, help: 'e.g. Transit, Sprinter, Vivaro' },
  year:                { label: 'Year',                      unit: '',    group: 'basic',       legalCritical: false, help: 'Year of manufacture.' },
  fuelType:            { label: 'Fuel Type',                 unit: '',    group: 'basic',       legalCritical: false, help: 'e.g. Diesel, Petrol, Electric, Hybrid' },
  heightM:             { label: 'Height',                    unit: 'm',   group: 'dimensions',  legalCritical: true,  help: 'Legal-critical for low bridge checks. Measure to highest point including load.' },
  widthM:              { label: 'Width',                     unit: 'm',   group: 'dimensions',  legalCritical: true,  help: 'Legal-critical for narrow road and lane checks.' },
  lengthM:             { label: 'Length',                    unit: 'm',   group: 'dimensions',  legalCritical: true,  help: 'Route-critical for access and turning suitability.' },
  weightKg:            { label: 'Unladen Weight',            unit: 'kg',  group: 'dimensions',  legalCritical: true,  help: 'Legal-critical for weight restriction checks.' },
  maxGrossWeightKg:    { label: 'Max Gross Weight (GVW)',    unit: 'kg',  group: 'dimensions',  legalCritical: true,  help: 'Legal-critical. Maximum permitted total weight including load. Check your Ministry plate.' },
  axleCount:           { label: 'Axle Count',                unit: '',    group: 'dimensions',  legalCritical: true,  help: 'Legal-critical for bridge formula and weight restriction checks.' },
  hasTrailer:          { label: 'Has Trailer',               unit: '',    group: 'trailer',     legalCritical: false, help: 'Enable to enter trailer details.' },
  trailerLengthM:      { label: 'Trailer Length',            unit: 'm',   group: 'trailer',     legalCritical: true,  help: 'Legal-critical for total combination length and access checks.' },
  trailerWidthM:       { label: 'Trailer Width',             unit: 'm',   group: 'trailer',     legalCritical: true,  help: 'Legal-critical for narrow road checks.' },
  trailerWeightKg:     { label: 'Trailer Weight',            unit: 'kg',  group: 'trailer',     legalCritical: true,  help: 'Legal-critical for total combined weight checks.' },
  totalCombinedLengthM:  { label: 'Total Combined Length',   unit: 'm',   group: 'trailer',     legalCritical: true,  help: 'Legal-critical. Total length of vehicle + trailer.' },
  totalCombinedWeightKg: { label: 'Total Combined Weight',   unit: 'kg',  group: 'trailer',     legalCritical: true,  help: 'Legal-critical for weight restriction checks on the full combination.' },
  avoidLowBridges:       { label: 'Avoid Low Bridges',       unit: '',    group: 'preferences', legalCritical: false, help: 'Route planner will flag low bridge risks (Run 3).' },
  avoidNarrowRoads:      { label: 'Avoid Narrow Roads',      unit: '',    group: 'preferences', legalCritical: false, help: 'Route planner will flag narrow road risks (Run 3).' },
  avoidWeightRestricted: { label: 'Avoid Weight Restricted', unit: '',    group: 'preferences', legalCritical: false, help: 'Route planner will flag weight restriction risks (Run 3).' },
  avoidSteepRoads:       { label: 'Avoid Steep Roads',       unit: '',    group: 'preferences', legalCritical: false, help: 'Useful for motorhomes and heavy vehicles on hilly routes.' },
  avoidTightTurns:       { label: 'Avoid Tight Turns',       unit: '',    group: 'preferences', legalCritical: false, help: 'Useful for long vehicles and trailers.' },
  notes:               { label: 'Notes',                     unit: '',    group: 'notes',       legalCritical: false, help: 'Any additional notes about this vehicle.' },
}

// ─── Vehicle type templates ───────────────────────────────────
export const VEHICLE_TEMPLATES = {
  [VEHICLE_TYPES.CAR]: {
    type:        VEHICLE_TYPES.CAR,
    label:       'Car / Small Vehicle',
    description: 'Standard car or small passenger vehicle.',
    icon:        'Car',
    showTrailer: false,
    requiredFields:      ['name', 'type'],
    optionalFields:      ['registration', 'make', 'model', 'year', 'fuelType', 'widthM', 'heightM', 'weightKg'],
    legalCriticalFields: [],
    routeRelevantFields: ['widthM', 'heightM', 'weightKg'],
    preferenceFields:    ['avoidLowBridges', 'avoidNarrowRoads'],
  },

  [VEHICLE_TYPES.VAN]: {
    type:        VEHICLE_TYPES.VAN,
    label:       'Van',
    description: 'Panel van or light commercial vehicle.',
    icon:        'Truck',
    showTrailer: false,
    requiredFields:      ['name', 'type', 'heightM', 'widthM', 'lengthM', 'weightKg'],
    optionalFields:      ['registration', 'make', 'model', 'year', 'fuelType', 'maxGrossWeightKg', 'notes'],
    legalCriticalFields: ['heightM', 'widthM', 'weightKg'],
    routeRelevantFields: ['heightM', 'widthM', 'lengthM', 'weightKg'],
    preferenceFields:    ['avoidLowBridges', 'avoidNarrowRoads', 'avoidWeightRestricted'],
  },

  [VEHICLE_TYPES.LARGE_VAN]: {
    type:        VEHICLE_TYPES.LARGE_VAN,
    label:       'Large Van',
    description: 'Large panel van / high-top or long-wheelbase van.',
    icon:        'Truck',
    showTrailer: false,
    requiredFields:      ['name', 'type', 'heightM', 'widthM', 'lengthM', 'weightKg', 'maxGrossWeightKg'],
    optionalFields:      ['registration', 'make', 'model', 'year', 'fuelType', 'notes'],
    legalCriticalFields: ['heightM', 'widthM', 'lengthM', 'weightKg', 'maxGrossWeightKg'],
    routeRelevantFields: ['heightM', 'widthM', 'lengthM', 'weightKg', 'maxGrossWeightKg'],
    preferenceFields:    ['avoidLowBridges', 'avoidNarrowRoads', 'avoidWeightRestricted'],
  },

  [VEHICLE_TYPES.BOX_TRUCK]: {
    type:        VEHICLE_TYPES.BOX_TRUCK,
    label:       'Box Truck / Luton',
    description: 'Luton or box-body truck, typically 3.5–7.5 tonne.',
    icon:        'Truck',
    showTrailer: false,
    requiredFields:      ['name', 'type', 'heightM', 'widthM', 'lengthM', 'weightKg', 'maxGrossWeightKg', 'axleCount'],
    optionalFields:      ['registration', 'make', 'model', 'year', 'fuelType', 'notes'],
    legalCriticalFields: ['heightM', 'widthM', 'lengthM', 'weightKg', 'maxGrossWeightKg', 'axleCount'],
    routeRelevantFields: ['heightM', 'widthM', 'lengthM', 'weightKg', 'maxGrossWeightKg', 'axleCount'],
    preferenceFields:    ['avoidLowBridges', 'avoidNarrowRoads', 'avoidWeightRestricted', 'avoidTightTurns'],
  },

  [VEHICLE_TYPES.MOTORHOME]: {
    type:        VEHICLE_TYPES.MOTORHOME,
    label:       'Motorhome / RV',
    description: 'Motorhome, campervan, or recreational vehicle.',
    icon:        'Bus',
    showTrailer: false,
    requiredFields:      ['name', 'type', 'heightM', 'widthM', 'lengthM', 'weightKg'],
    optionalFields:      ['registration', 'make', 'model', 'year', 'fuelType', 'maxGrossWeightKg', 'notes'],
    legalCriticalFields: ['heightM', 'widthM', 'lengthM', 'weightKg'],
    routeRelevantFields: ['heightM', 'widthM', 'lengthM', 'weightKg'],
    preferenceFields:    ['avoidLowBridges', 'avoidNarrowRoads', 'avoidWeightRestricted', 'avoidSteepRoads', 'avoidTightTurns'],
  },

  [VEHICLE_TYPES.CAR_TRAILER]: {
    type:        VEHICLE_TYPES.CAR_TRAILER,
    label:       'Car + Trailer',
    description: 'Car towing a trailer.',
    icon:        'Car',
    showTrailer: true,
    requiredFields:      ['name', 'type', 'lengthM', 'weightKg', 'trailerLengthM', 'trailerWidthM', 'trailerWeightKg', 'totalCombinedLengthM', 'totalCombinedWeightKg'],
    optionalFields:      ['registration', 'make', 'model', 'year', 'fuelType', 'heightM', 'widthM', 'notes'],
    legalCriticalFields: ['trailerLengthM', 'trailerWidthM', 'trailerWeightKg', 'totalCombinedLengthM', 'totalCombinedWeightKg'],
    routeRelevantFields: ['lengthM', 'weightKg', 'trailerLengthM', 'trailerWidthM', 'trailerWeightKg', 'totalCombinedLengthM', 'totalCombinedWeightKg'],
    preferenceFields:    ['avoidLowBridges', 'avoidNarrowRoads', 'avoidWeightRestricted', 'avoidTightTurns'],
  },

  [VEHICLE_TYPES.VAN_TRAILER]: {
    type:        VEHICLE_TYPES.VAN_TRAILER,
    label:       'Van + Trailer',
    description: 'Van towing a trailer.',
    icon:        'Truck',
    showTrailer: true,
    requiredFields:      ['name', 'type', 'heightM', 'widthM', 'lengthM', 'weightKg', 'trailerLengthM', 'trailerWidthM', 'trailerWeightKg', 'totalCombinedLengthM', 'totalCombinedWeightKg'],
    optionalFields:      ['registration', 'make', 'model', 'year', 'fuelType', 'maxGrossWeightKg', 'notes'],
    legalCriticalFields: ['heightM', 'widthM', 'weightKg', 'trailerLengthM', 'trailerWidthM', 'trailerWeightKg', 'totalCombinedLengthM', 'totalCombinedWeightKg'],
    routeRelevantFields: ['heightM', 'widthM', 'lengthM', 'weightKg', 'trailerLengthM', 'trailerWidthM', 'trailerWeightKg', 'totalCombinedLengthM', 'totalCombinedWeightKg'],
    preferenceFields:    ['avoidLowBridges', 'avoidNarrowRoads', 'avoidWeightRestricted', 'avoidTightTurns'],
  },

  [VEHICLE_TYPES.CUSTOM]: {
    type:        VEHICLE_TYPES.CUSTOM,
    label:       'Custom Vehicle',
    description: 'Any other vehicle type. All fields are optional but recommended.',
    icon:        'Settings',
    showTrailer: true,
    requiredFields:      ['name', 'type'],
    optionalFields:      ['registration', 'make', 'model', 'year', 'fuelType', 'heightM', 'widthM', 'lengthM', 'weightKg', 'maxGrossWeightKg', 'axleCount', 'trailerLengthM', 'trailerWidthM', 'trailerWeightKg', 'totalCombinedLengthM', 'totalCombinedWeightKg', 'notes'],
    legalCriticalFields: [],
    routeRelevantFields: ['heightM', 'widthM', 'lengthM', 'weightKg'],
    preferenceFields:    ['avoidLowBridges', 'avoidNarrowRoads', 'avoidWeightRestricted', 'avoidSteepRoads', 'avoidTightTurns'],
    customWarning:       'Custom vehicles may require additional manual checks before route planning.',
  },
}

// ─── Helpers ──────────────────────────────────────────────────

export function getVehicleTemplate(type) {
  return VEHICLE_TEMPLATES[type] || VEHICLE_TEMPLATES[VEHICLE_TYPES.CUSTOM]
}

export function createVehicleId() {
  return 'bv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)
}

/**
 * Build a blank vehicle object with defaults for a given type.
 */
export function buildVehicleDefaults(type = VEHICLE_TYPES.CAR) {
  const now = new Date().toISOString()
  return {
    id:                    createVehicleId(),
    name:                  '',
    type,
    registration:          '',
    make:                  '',
    model:                 '',
    year:                  '',
    fuelType:              '',
    heightM:               '',
    widthM:                '',
    lengthM:               '',
    weightKg:              '',
    maxGrossWeightKg:      '',
    axleCount:             '',
    hasTrailer:            false,
    trailerLengthM:        '',
    trailerWidthM:         '',
    trailerWeightKg:       '',
    totalCombinedLengthM:  '',
    totalCombinedWeightKg: '',
    avoidLowBridges:       true,
    avoidNarrowRoads:      true,
    avoidWeightRestricted: true,
    avoidSteepRoads:       false,
    avoidTightTurns:       false,
    notes:                 '',
    createdAt:             now,
    updatedAt:             now,
    isActive:              false,
    readinessScore:        0,
    missingCriticalFields: [],
  }
}

/**
 * getMissingVehicleFields — returns array of field keys that are
 * required by this vehicle's template but empty/null.
 */
export function getMissingVehicleFields(vehicle) {
  const tmpl = getVehicleTemplate(vehicle.type)
  return tmpl.requiredFields.filter(field => {
    const val = vehicle[field]
    if (val === undefined || val === null || val === '' || val === false) return true
    if (typeof val === 'string' && val.trim() === '') return true
    return false
  })
}

/**
 * getMissingCriticalFields — returns fields that are LEGAL-CRITICAL and missing.
 */
export function getMissingCriticalFields(vehicle) {
  const tmpl   = getVehicleTemplate(vehicle.type)
  const critical = tmpl.legalCriticalFields
  return critical.filter(field => {
    const val = vehicle[field]
    if (val === undefined || val === null || val === '') return true
    if (typeof val === 'string' && val.trim() === '') return true
    return false
  })
}

/**
 * calculateVehicleReadiness — returns 0–100 score.
 * Score = (filled required + 50% of filled optional) / (required + 50% optional max) * 100
 * Legal-critical fields that are missing apply an extra penalty.
 */
export function calculateVehicleReadiness(vehicle) {
  const tmpl     = getVehicleTemplate(vehicle.type)
  const required = tmpl.requiredFields
  const optional = tmpl.optionalFields
  const critical = tmpl.legalCriticalFields

  const isPresent = (field) => {
    const val = vehicle[field]
    if (val === undefined || val === null || val === '' || val === false) return false
    if (typeof val === 'string' && val.trim() === '') return false
    return true
  }

  const reqFilled  = required.filter(isPresent).length
  const reqTotal   = required.length || 1

  const optFilled  = optional.filter(isPresent).length
  const optTotal   = optional.length || 1

  // Weight required fields 70%, optional 30%
  const reqScore  = (reqFilled / reqTotal) * 70
  const optScore  = (optFilled / optTotal) * 30

  // Penalty: each missing legal-critical field costs 8 points (max 40 penalty)
  const missingCrit   = critical.filter(f => !isPresent(f)).length
  const critPenalty   = Math.min(missingCrit * 8, 40)

  const raw = reqScore + optScore - critPenalty
  return Math.round(Math.max(0, Math.min(100, raw)))
}

/**
 * getReadinessLabel — human label from score.
 */
export function getReadinessLabel(score) {
  if (score >= 90) return { label: 'Ready',                  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' }
  if (score >= 70) return { label: 'Needs Details',          color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25' }
  return             { label: 'Legal-critical Data Missing', color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/25' }
}

/**
 * validateVehicleForm — returns { valid: bool, errors: { field: message } }
 * Used by the add/edit form before saving.
 */
export function validateVehicleForm(vehicle) {
  const errors = {}
  const tmpl   = getVehicleTemplate(vehicle.type)

  if (!vehicle.name?.trim()) {
    errors.name = 'Vehicle name is required.'
  }
  if (!vehicle.type) {
    errors.type = 'Please select a vehicle type.'
  }

  // Required template fields
  for (const field of tmpl.requiredFields) {
    if (field === 'name' || field === 'type') continue
    const val = vehicle[field]
    const isEmpty = val === undefined || val === null || val === '' ||
                    (typeof val === 'string' && val.trim() === '')
    if (isEmpty) {
      const fieldDef = VEHICLE_FIELDS[field]
      const isLegal  = tmpl.legalCriticalFields.includes(field)
      errors[field] = isLegal
        ? `${fieldDef?.label || field} is required because future route checks need it for ${_criticalReason(field)}.`
        : `${fieldDef?.label || field} is required for this vehicle type.`
    }
  }

  // Numeric validation
  const numericFields = ['heightM', 'widthM', 'lengthM', 'weightKg', 'maxGrossWeightKg', 'axleCount',
    'trailerLengthM', 'trailerWidthM', 'trailerWeightKg', 'totalCombinedLengthM', 'totalCombinedWeightKg', 'year']
  for (const field of numericFields) {
    const val = vehicle[field]
    if (val !== '' && val !== null && val !== undefined) {
      const n = parseFloat(val)
      if (isNaN(n) || n < 0) {
        errors[field] = `${VEHICLE_FIELDS[field]?.label || field} must be a positive number.`
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

function _criticalReason(field) {
  const reasons = {
    heightM:               'low bridge risk warnings',
    widthM:                'narrow road and lane width checks',
    lengthM:               'turning and access suitability checks',
    weightKg:              'weight restriction checks',
    maxGrossWeightKg:      'maximum gross weight restriction checks',
    axleCount:             'bridge formula and weight restriction checks',
    trailerLengthM:        'total combination length and access checks',
    trailerWidthM:         'narrow road checks for the trailer',
    trailerWeightKg:       'total combined weight checks',
    totalCombinedLengthM:  'total combination length checks',
    totalCombinedWeightKg: 'total combination weight restriction checks',
  }
  return reasons[field] || 'route risk checks'
}

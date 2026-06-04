/**
 * ============================================================
 * Big V's Best Routes™ — 4P3X Intelligent AI™ Advisory Engine
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 * Run 7 — Local-First Advisory Intelligence Layer
 *
 * ── Advisory Only ─────────────────────────────────────────────
 * This engine uses deterministic local rules only.
 * No external AI API is called. No road restriction database.
 * No fake legal database. No hallucinated facts.
 *
 * ALL outputs are advisory only. The driver and operator
 * remain responsible for safe and legal driving, checking
 * live road signs, restrictions, road conditions, and
 * professional judgement.
 *
 * AI recommendations require human review before driving
 * or acting on them.
 *
 * "If there is any doubt about route legality, vehicle
 * suitability, restrictions, road safety, or live conditions,
 * stop safely and verify through official sources."
 *
 * ── Agents ────────────────────────────────────────────────────
 * Agent 1: Route Safety & Vehicle Suitability AI
 * Agent 2: Legal Compliance & Evidence Review AI
 * ============================================================
 */

import {
  getMissingCriticalFields,
  calculateVehicleReadiness,
  getMissingVehicleFields,
} from './services_vehicles_vehicleService'
import {
  calculateRouteReadiness,
  calculateRouteRiskLevel,
  getRouteWarnings,
  getRiskLevelStyle,
  RISK_LEVELS,
} from './services_routes_routeService'
import { useAiAdvisoryStore, useAuditStore } from './core_storage'

// ─── Constants ────────────────────────────────────────────────
export const AI_SEVERITY = {
  INFO:     'info',
  CAUTION:  'caution',
  HIGH:     'high',
  CRITICAL: 'critical',
}

export const AI_CATEGORY = {
  VEHICLE:   'vehicle',
  ROUTE:     'route',
  GPS:       'gps',
  MAP:       'map',
  LEGAL:     'legal',
  EVIDENCE:  'evidence',
  REPORT:    'report',
  SYNC:      'sync',
  DEMO_LIVE: 'demoLive',
  SYSTEM:    'system',
}

export const AI_REVIEW_STATUS = {
  CLEAR:             'clear',
  ADVISORY:          'advisory',
  CAUTION:           'caution',
  HIGH_REVIEW:       'highReview',
  CRITICAL_REVIEW:   'criticalReview',
  INSUFFICIENT_DATA: 'insufficientData',
}

export const AI_EVIDENCE_STATUS = {
  READY:             'readyForHumanReview',
  NEEDS_MORE:        'needsMoreData',
  HIGH_REVIEW:       'highReviewNeeded',
  CRITICAL:          'criticalUnresolved',
  DEMO_ONLY:         'demoOnlyEvidence',
}

const RESOLVE_STATUS = {
  OPEN:            'open',
  ACKNOWLEDGED:    'acknowledged',
  REVIEWED:        'reviewed',
  RESOLVED:        'resolved',
  NOT_APPLICABLE:  'notApplicable',
}

// ─── Finding builder ──────────────────────────────────────────
let _findingSeq = 0
function makeFinding(agentId, severity, category, title, explanation, recommendedAction, sourceData = {}, requiresHumanReview = true) {
  return {
    findingId:          `bv-fnd-${Date.now()}-${++_findingSeq}`,
    agentId,
    severity,
    category,
    title,
    explanation,
    recommendedAction,
    sourceData,
    createdAt:          new Date().toISOString(),
    requiresHumanReview,
    resolvedStatus:     RESOLVE_STATUS.OPEN,
    resolvedAt:         null,
  }
}

// ─── Agent 1: Route Safety & Vehicle Suitability AI ──────────
/**
 * analyzeVehicleSuitability
 * Deterministic local rule engine.
 * Inputs: vehicle profile, route plan, GPS state, driver reports, nav session, isOnline, isDemoMode
 * Output: { score, riskLevel, findings, missingData, recommendations, warnings }
 */
export function analyzeVehicleSuitability({ vehicle, routePlan, gpsState, reports = [], navSession, isOnline = true, isDemoMode = false }) {
  const findings = []
  const missingData = []
  const recommendations = []
  let score = 100  // Start at 100, subtract for each issue

  // ── No vehicle ────────────────────────────────────────────────
  if (!vehicle) {
    findings.push(makeFinding(
      'agent1', AI_SEVERITY.CRITICAL, AI_CATEGORY.VEHICLE,
      'No vehicle selected',
      'A vehicle must be selected before route suitability can be assessed. Without vehicle dimensions, the system cannot check for height, width, weight, or legal restrictions.',
      'Select a vehicle from the Fleet section and complete its dimensions before planning a route.',
      { vehicle: null }, true
    ))
    missingData.push('Vehicle not selected')
    return { score: 0, riskLevel: AI_REVIEW_STATUS.INSUFFICIENT_DATA, findings, missingData, recommendations: ['Select a vehicle and complete its profile before driving.'], warnings: [] }
  }

  // ── Missing critical vehicle fields ───────────────────────────
  const missingCritical = getMissingCriticalFields(vehicle)
  const vReadiness      = calculateVehicleReadiness(vehicle)

  if (missingCritical.includes('heightM') || missingCritical.includes('height')) {
    score -= 25
    missingData.push('Vehicle height not entered')
    findings.push(makeFinding(
      'agent1', AI_SEVERITY.HIGH, AI_CATEGORY.VEHICLE,
      'Vehicle height missing',
      'Height is legal-critical for low bridge clearance checks. Without height data, the system cannot flag potential low bridge risks on the route.',
      'Enter the vehicle\'s maximum height (including any load, roof boxes, or raised components) in the vehicle profile.',
      { field: 'heightM', vehicleId: vehicle.id }, true
    ))
    recommendations.push('Complete missing vehicle height before driving.')
  }
  if (missingCritical.includes('widthM') || missingCritical.includes('width')) {
    score -= 20
    missingData.push('Vehicle width not entered')
    findings.push(makeFinding(
      'agent1', AI_SEVERITY.HIGH, AI_CATEGORY.VEHICLE,
      'Vehicle width missing',
      'Width is legal-critical for narrow road and lane suitability checks. Without width data, narrow road clearance cannot be estimated.',
      'Enter the vehicle\'s maximum width in the vehicle profile.',
      { field: 'widthM', vehicleId: vehicle.id }, true
    ))
    recommendations.push('Complete missing vehicle width before driving.')
  }
  if (missingCritical.includes('weightKg') || missingCritical.includes('maxGrossWeightKg')) {
    score -= 20
    missingData.push('Vehicle weight / GVW not entered')
    findings.push(makeFinding(
      'agent1', AI_SEVERITY.HIGH, AI_CATEGORY.VEHICLE,
      'Vehicle weight or GVW missing',
      'Weight data is legal-critical for weight restriction checks on roads, bridges, and access points. Without weight data, weight-restricted areas cannot be flagged.',
      'Enter the vehicle\'s unladen weight and maximum gross vehicle weight (GVW) in the vehicle profile.',
      { fields: ['weightKg', 'maxGrossWeightKg'], vehicleId: vehicle.id }, true
    ))
    recommendations.push('Complete missing vehicle weight / GVW before driving.')
  }
  if (missingCritical.includes('axleCount')) {
    score -= 10
    missingData.push('Axle count not entered')
    findings.push(makeFinding(
      'agent1', AI_SEVERITY.CAUTION, AI_CATEGORY.VEHICLE,
      'Axle count missing',
      'Axle count is relevant for bridge formula calculations and some weight restriction checks.',
      'Enter the axle count in the vehicle profile.',
      { field: 'axleCount', vehicleId: vehicle.id }, true
    ))
    recommendations.push('Review and complete vehicle axle count.')
  }
  if (vReadiness < 60) {
    score -= 10
    missingData.push(`Vehicle readiness low: ${vReadiness}%`)
    findings.push(makeFinding(
      'agent1', AI_SEVERITY.CAUTION, AI_CATEGORY.VEHICLE,
      `Vehicle profile readiness: ${vReadiness}%`,
      'The vehicle profile is less than 60% complete. Key fields may be missing. Incomplete profiles reduce the accuracy of advisory route checks.',
      'Complete the vehicle profile, focusing on dimensions and weight fields.',
      { readiness: vReadiness, vehicleId: vehicle.id }, true
    ))
    recommendations.push('Complete the vehicle profile to at least 80% before advisory checks are meaningful.')
  }

  // ── No route ──────────────────────────────────────────────────
  if (!routePlan) {
    findings.push(makeFinding(
      'agent1', AI_SEVERITY.HIGH, AI_CATEGORY.ROUTE,
      'No route selected',
      'A route plan is required to run route suitability checks. Without route origin, destination, and geometry, no route-specific checks can be performed.',
      'Create and select a route in the Route Planner before running an AI advisory review.',
      { route: null }, true
    ))
    missingData.push('Route plan not selected')
    score -= 20
    recommendations.push('Select or create a route in the Route Planner.')
  } else {
    // ── Route quality checks ─────────────────────────────────────
    const routeReadiness = calculateRouteReadiness(routePlan, vehicle)
    const hasOrigin      = !!(routePlan.origin?.label?.trim() || routePlan.origin?.address?.trim())
    const hasDest        = !!(routePlan.destination?.label?.trim() || routePlan.destination?.address?.trim())
    const hasGeometry    = !!(routePlan.polyline || routePlan.geometry || routePlan.geojson || (routePlan.waypoints?.length >= 2))
    const riskLevel      = calculateRouteRiskLevel(routePlan, vehicle)
    const riskStyle      = getRiskLevelStyle(riskLevel)

    if (!hasOrigin || !hasDest) {
      score -= 15
      missingData.push('Route origin or destination incomplete')
      findings.push(makeFinding(
        'agent1', AI_SEVERITY.HIGH, AI_CATEGORY.ROUTE,
        'Route origin or destination incomplete',
        'A complete route requires both a clearly defined origin and destination to enable any route review.',
        'Open the Route Planner and complete the origin and destination for this route.',
        { routeId: routePlan.id, hasOrigin, hasDest }, true
      ))
      recommendations.push('Complete route origin and destination before driving.')
    }
    if (!hasGeometry) {
      score -= 15
      missingData.push('Route geometry not available')
      findings.push(makeFinding(
        'agent1', AI_SEVERITY.CAUTION, AI_CATEGORY.ROUTE,
        'Route geometry not available',
        'The route map geometry (polyline / waypoints) is not available. The map layer cannot display or validate this route without geometry data. The GPS navigation layer will operate in review-only mode.',
        'A route provider such as GraphHopper or OSRM must be connected to generate route geometry. This is backend-ready and can be configured in a later run.',
        { routeId: routePlan.id, hasGeometry }, true
      ))
      recommendations.push('Note: route geometry is unavailable — driver must manually verify the route on a map before driving.')
    }
    if (routeReadiness < 50) {
      score -= 10
      findings.push(makeFinding(
        'agent1', AI_SEVERITY.CAUTION, AI_CATEGORY.ROUTE,
        `Route readiness low: ${routeReadiness}%`,
        `This route plan is only ${routeReadiness}% complete. Low readiness may mean missing key fields, no geometry, or unresolved issues.`,
        'Review and complete the route plan in the Route Planner.',
        { routeId: routePlan.id, readiness: routeReadiness }, true
      ))
      recommendations.push('Complete route plan to at least 70% before driving advisory is meaningful.')
    }
    if (riskLevel === RISK_LEVELS.HIGH) {
      score -= 15
      findings.push(makeFinding(
        'agent1', AI_SEVERITY.HIGH, AI_CATEGORY.ROUTE,
        `Advisory route risk: ${riskStyle.label}`,
        `Based on vehicle data and route data, this route has a ${riskStyle.label} advisory risk rating. This does not mean the route is unsafe or illegal — it indicates that data is insufficient for confident advisory support.`,
        'Review all high-severity warnings, complete missing vehicle data, and perform human checks of the route before driving.',
        { routeId: routePlan.id, riskLevel, vehicleId: vehicle.id }, true
      ))
      recommendations.push('Human review of all high-risk findings is required before driving this route.')
    }
  }

  // ── GPS check ─────────────────────────────────────────────────
  if (gpsState === 'denied') {
    score -= 5
    findings.push(makeFinding(
      'agent1', AI_SEVERITY.CAUTION, AI_CATEGORY.GPS,
      'GPS permission denied',
      'Location permission was denied. GPS-based navigation will not be available. The navigation module will operate in map-review mode only.',
      'Allow location permission in browser settings if GPS navigation is needed. Navigation in map-review mode is still available.',
      { gpsState }, false
    ))
  } else if (gpsState === 'unavailable') {
    score -= 5
    findings.push(makeFinding(
      'agent1', AI_SEVERITY.CAUTION, AI_CATEGORY.GPS,
      'GPS unavailable',
      'GPS is unavailable on this device or browser. Navigation will operate in map-review mode.',
      'Use a device with GPS capability if live GPS navigation is required.',
      { gpsState }, false
    ))
  } else if (gpsState === 'lowAccuracy') {
    score -= 3
    findings.push(makeFinding(
      'agent1', AI_SEVERITY.INFO, AI_CATEGORY.GPS,
      'GPS accuracy is low',
      'Current GPS accuracy appears low (over 100m). Position data may not be precise enough for accurate route tracking.',
      'Check GPS signal quality, move to an area with better sky visibility, or use a separate GPS device if accuracy is critical.',
      { gpsState }, false
    ))
  }

  // ── Map provider offline ─────────────────────────────────────
  if (!isOnline) {
    score -= 5
    findings.push(makeFinding(
      'agent1', AI_SEVERITY.CAUTION, AI_CATEGORY.MAP,
      'Device is offline',
      'The device appears to be offline. Live map tiles, GPS accuracy data, route provider data, and sync are unavailable.',
      'Ensure a stable data connection before starting navigation. Cached map tiles may be partially available.',
      { isOnline }, false
    ))
    recommendations.push('Check data connection before starting navigation.')
  }

  // ── Driver reports linked to this route ───────────────────────
  const linkedReports = reports.filter(r => r.routeId === routePlan?.id || r.assignmentId)
  const criticalReports = linkedReports.filter(r => r.severity === 'critical' && r.status !== 'resolved')
  const highReports     = linkedReports.filter(r => r.severity === 'high'     && r.status !== 'resolved')

  if (criticalReports.length > 0) {
    score -= 25
    findings.push(makeFinding(
      'agent1', AI_SEVERITY.CRITICAL, AI_CATEGORY.REPORT,
      `${criticalReports.length} critical unresolved driver report${criticalReports.length !== 1 ? 's' : ''}`,
      `Critical driver reports are linked to this route or assignment and have not been resolved. These may indicate serious route, vehicle, or safety concerns requiring immediate human review.`,
      'Review and resolve all critical driver reports before this route assignment is driven again.',
      { count: criticalReports.length, reportIds: criticalReports.map(r => r.id) }, true
    ))
    recommendations.push('Resolve all critical driver reports before re-assigning this route.')
  }
  if (highReports.length > 0) {
    score -= 15
    findings.push(makeFinding(
      'agent1', AI_SEVERITY.HIGH, AI_CATEGORY.REPORT,
      `${highReports.length} high-severity unresolved driver report${highReports.length !== 1 ? 's' : ''}`,
      `High-severity driver reports are linked to this route or assignment. These reports require human review before the route is driven again.`,
      'Mark all high-severity reports as reviewed or resolved in the dashboard Driver Reports panel.',
      { count: highReports.length, reportIds: highReports.map(r => r.id) }, true
    ))
    recommendations.push('Review high-severity driver reports in the dashboard before re-assigning this route.')
  }

  // ── Nav session acknowledgement ───────────────────────────────
  if (navSession && !navSession.acknowledgementAccepted) {
    score -= 5
    findings.push(makeFinding(
      'agent1', AI_SEVERITY.CAUTION, AI_CATEGORY.ROUTE,
      'Advisory acknowledgement not recorded',
      'The driver has not yet confirmed they understand this route is advisory only. Acknowledgement is required before starting navigation.',
      'The driver must review and accept the advisory acknowledgement in the Route Review screen before starting navigation.',
      { sessionId: navSession?.sessionId }, false
    ))
  }

  // ── Demo mode ─────────────────────────────────────────────────
  if (isDemoMode) {
    findings.push(makeFinding(
      'agent1', AI_SEVERITY.INFO, AI_CATEGORY.DEMO_LIVE,
      'Demo mode is active',
      'Demo AI advisory output — data is from demo/sample sources and must not be used for real driving. Switch to Live mode with a configured backend for production use.',
      'This advisory review is based on demo data only. Do not drive based on demo advisory output.',
      { demoMode: true }, false
    ))
  } else {
    findings.push(makeFinding(
      'agent1', AI_SEVERITY.INFO, AI_CATEGORY.DEMO_LIVE,
      'Live mode — local advisory only',
      'Live mode is on, but no AI backend provider is configured. This review uses local advisory rules only. No external AI, road restriction database, or live traffic data is used.',
      'To add real AI advisory capabilities, configure an AI backend provider in a later run.',
      { demoMode: false, backendConfigured: false }, false
    ))
  }

  // ── Score clamping + overall risk ─────────────────────────────
  score = Math.max(0, Math.min(100, score))
  const critCount = findings.filter(f => f.severity === AI_SEVERITY.CRITICAL).length
  const highCount = findings.filter(f => f.severity === AI_SEVERITY.HIGH).length

  let riskLevel = AI_REVIEW_STATUS.CLEAR
  if (!vehicle || !routePlan)   riskLevel = AI_REVIEW_STATUS.INSUFFICIENT_DATA
  else if (critCount > 0)       riskLevel = AI_REVIEW_STATUS.CRITICAL_REVIEW
  else if (highCount > 0)       riskLevel = AI_REVIEW_STATUS.HIGH_REVIEW
  else if (score >= 85)         riskLevel = AI_REVIEW_STATUS.CLEAR
  else if (score >= 65)         riskLevel = AI_REVIEW_STATUS.ADVISORY
  else                          riskLevel = AI_REVIEW_STATUS.CAUTION

  return {
    score,
    riskLevel,
    findings,
    missingData,
    recommendations,
    warnings: findings.filter(f => f.severity === AI_SEVERITY.HIGH || f.severity === AI_SEVERITY.CRITICAL),
  }
}

// ─── Agent 2: Legal Compliance & Evidence Review AI ──────────
/**
 * analyzeComplianceEvidence
 * Checks whether enough evidence exists for a human compliance review.
 * Does NOT claim legal approval. Output is evidence-completeness only.
 */
export function analyzeComplianceEvidence({ vehicle, routePlan, assignment, navSession, tripSession, reports = [], auditEvents = [], syncQueue = [], isDemoMode = false, backendConfigured = false }) {
  const findings = []
  const evidenceGaps = []
  const humanChecklist = []
  let score = 100

  // ── Vehicle evidence ──────────────────────────────────────────
  if (!vehicle) {
    score -= 25
    evidenceGaps.push('Vehicle not selected — no vehicle evidence')
    humanChecklist.push({ id: 'hc-vehicle', item: 'Select and complete a vehicle profile before any route is driven.', priority: 'critical' })
    findings.push(makeFinding(
      'agent2', AI_SEVERITY.CRITICAL, AI_CATEGORY.EVIDENCE,
      'Vehicle evidence missing',
      'No vehicle is selected. Legal compliance review requires at minimum a complete vehicle profile including dimensions and weight data.',
      'Select a vehicle and complete its profile.',
      {}, true
    ))
  } else {
    const missingCrit = getMissingCriticalFields(vehicle)
    const vReadiness  = calculateVehicleReadiness(vehicle)
    if (missingCrit.length > 0) {
      const pct = Math.min(25, missingCrit.length * 6)
      score -= pct
      evidenceGaps.push(`Missing critical vehicle fields: ${missingCrit.join(', ')}`)
      missingCrit.forEach(f => {
        humanChecklist.push({ id: `hc-veh-${f}`, item: `Complete missing vehicle field: ${f}`, priority: 'high' })
      })
      findings.push(makeFinding(
        'agent2', AI_SEVERITY.HIGH, AI_CATEGORY.EVIDENCE,
        `${missingCrit.length} critical vehicle field${missingCrit.length !== 1 ? 's' : ''} missing`,
        `The following legal-critical vehicle fields are missing from the vehicle profile: ${missingCrit.join(', ')}. Without these, a full compliance review cannot be completed by a human reviewer.`,
        'Complete all critical vehicle fields before submitting for human compliance review.',
        { missingFields: missingCrit, vehicleId: vehicle.id }, true
      ))
    }
    if (vReadiness < 70) {
      score -= 10
      evidenceGaps.push(`Vehicle readiness only ${vReadiness}%`)
      humanChecklist.push({ id: 'hc-readiness', item: `Complete vehicle profile (currently ${vReadiness}%)`, priority: 'medium' })
    }
  }

  // ── Route evidence ────────────────────────────────────────────
  if (!routePlan) {
    score -= 20
    evidenceGaps.push('No route plan — no route evidence')
    humanChecklist.push({ id: 'hc-route', item: 'Create and link a route plan for this assignment.', priority: 'high' })
    findings.push(makeFinding(
      'agent2', AI_SEVERITY.HIGH, AI_CATEGORY.EVIDENCE,
      'Route plan evidence missing',
      'No route plan is linked. Evidence review requires a route plan with at minimum origin, destination, and intent.',
      'Create a route plan in the Route Planner and link it to the assignment.',
      {}, true
    ))
  } else {
    const hasGeometry = !!(routePlan.polyline || routePlan.geometry || routePlan.geojson || (routePlan.waypoints?.length >= 2))
    if (!hasGeometry) {
      score -= 10
      evidenceGaps.push('Route geometry not recorded')
      humanChecklist.push({ id: 'hc-geometry', item: 'Review route on a map and confirm the planned path before driving.', priority: 'medium' })
      findings.push(makeFinding(
        'agent2', AI_SEVERITY.CAUTION, AI_CATEGORY.EVIDENCE,
        'Route geometry not recorded',
        'Route polyline or waypoints are not available. A human reviewer cannot visually verify the planned route without geometry data.',
        'Connect a route provider (GraphHopper, OSRM) to generate route geometry, or manually document the planned route.',
        { routeId: routePlan.id }, true
      ))
    }
  }

  // ── Assignment evidence ───────────────────────────────────────
  if (!assignment) {
    score -= 10
    evidenceGaps.push('No route assignment created')
    humanChecklist.push({ id: 'hc-assignment', item: 'Create a route assignment linking the route to the vehicle.', priority: 'medium' })
    findings.push(makeFinding(
      'agent2', AI_SEVERITY.CAUTION, AI_CATEGORY.EVIDENCE,
      'No route assignment recorded',
      'No route assignment has been created for this route. Assignments provide the audit evidence linking a route, vehicle, and timing together.',
      'Create a route assignment from the dashboard Route Assignments panel.',
      {}, true
    ))
  } else {
    // Check assignment timeline completeness
    const tl = assignment.timeline || []
    const hasOpened    = tl.some(e => e.type?.includes('received') || e.type?.includes('reviewed'))
    const hasCompleted = tl.some(e => e.type?.includes('completed'))
    if (!hasOpened) {
      score -= 5
      evidenceGaps.push('Assignment not yet opened by driver')
      humanChecklist.push({ id: 'hc-asgn-open', item: 'Confirm driver has opened and reviewed the assignment.', priority: 'low' })
    }
  }

  // ── Driver acknowledgement ────────────────────────────────────
  const ackAccepted = navSession?.acknowledgementAccepted || tripSession?.acknowledgementAccepted || false
  const ackAt       = navSession?.acknowledgementAcceptedAt || tripSession?.acknowledgementAcceptedAt || null
  if (!ackAccepted) {
    score -= 10
    evidenceGaps.push('Driver acknowledgement not recorded')
    humanChecklist.push({ id: 'hc-ack', item: 'Confirm driver has accepted the advisory acknowledgement.', priority: 'high' })
    findings.push(makeFinding(
      'agent2', AI_SEVERITY.HIGH, AI_CATEGORY.EVIDENCE,
      'Driver acknowledgement not recorded',
      'The advisory acknowledgement has not been accepted by the driver. This should be recorded before navigation starts.',
      'Driver must accept the advisory acknowledgement in the Route Review screen.',
      { ackAccepted, ackAt }, true
    ))
  } else {
    humanChecklist.push({ id: 'hc-ack-ok', item: `Advisory acknowledgement recorded at ${ackAt ? new Date(ackAt).toLocaleString() : '—'}`, priority: 'ok', resolved: true })
  }

  // ── Checklist ─────────────────────────────────────────────────
  const cl = navSession?.checklist || tripSession?.checklistSnapshot || {}
  const clItems   = Object.keys(cl).length
  const clChecked = Object.values(cl).filter(Boolean).length
  const clComplete = clItems > 0 && clChecked === clItems
  if (!clComplete) {
    score -= 8
    evidenceGaps.push(`Safety checklist incomplete: ${clChecked}/${clItems || '?'}`)
    humanChecklist.push({ id: 'hc-checklist', item: `Complete the safety checklist (${clChecked}/${clItems || '?'} items)`, priority: 'high' })
    if (clItems > 0) {
      findings.push(makeFinding(
        'agent2', AI_SEVERITY.CAUTION, AI_CATEGORY.EVIDENCE,
        `Safety checklist incomplete (${clChecked}/${clItems})`,
        `The pre-navigation safety checklist is only ${clChecked}/${clItems} items completed. A complete checklist provides evidence that the driver performed pre-journey safety checks.`,
        'Driver should complete the full safety checklist before starting navigation.',
        { clChecked, clItems }, true
      ))
    }
  } else if (clItems > 0) {
    humanChecklist.push({ id: 'hc-checklist-ok', item: 'Safety checklist completed', priority: 'ok', resolved: true })
  }

  // ── Trip session evidence ─────────────────────────────────────
  if (!tripSession) {
    evidenceGaps.push('No trip session recorded yet')
    humanChecklist.push({ id: 'hc-session', item: 'Start navigation to record a trip session as evidence.', priority: 'medium' })
    findings.push(makeFinding(
      'agent2', AI_SEVERITY.INFO, AI_CATEGORY.EVIDENCE,
      'No trip session recorded',
      'No trip session has been started for this assignment. Trip sessions record the navigation timeline, GPS status, and events as part of the evidence trail.',
      'Start navigation from the Driver PWA to create a trip session record.',
      {}, false
    ))
    score -= 5
  } else {
    const hasStart = !!tripSession.startedAt
    const hasGps   = tripSession.gpsStatus === 'active' || tripSession.gpsStatus === 'lowAccuracy'
    if (!hasStart)   evidenceGaps.push('Trip start time not recorded')
    if (!hasGps)     evidenceGaps.push('GPS was not active during trip')
    if (tripSession.warningsDuringTrip?.length > 0) {
      humanChecklist.push({ id: 'hc-trip-warn', item: `Review ${tripSession.warningsDuringTrip.length} warnings recorded during trip`, priority: 'medium' })
    }
  }

  // ── Driver reports ────────────────────────────────────────────
  const unresolvedCritical = reports.filter(r => r.severity === 'critical' && r.status !== 'resolved' && r.status !== 'archived')
  const unresolvedHigh     = reports.filter(r => r.severity === 'high'     && r.status !== 'resolved' && r.status !== 'archived')
  if (unresolvedCritical.length > 0) {
    score -= 20
    evidenceGaps.push(`${unresolvedCritical.length} critical unresolved driver report(s)`)
    humanChecklist.push({ id: 'hc-crit-rpt', item: `Resolve ${unresolvedCritical.length} critical driver report(s) before clearing for review`, priority: 'critical' })
    findings.push(makeFinding(
      'agent2', AI_SEVERITY.CRITICAL, AI_CATEGORY.REPORT,
      `${unresolvedCritical.length} critical unresolved driver report(s)`,
      `Critical-severity driver reports remain unresolved. These must be reviewed by a human before any compliance review can be marked complete.`,
      'Review and resolve all critical driver reports in the dashboard Driver Reports panel.',
      { count: unresolvedCritical.length, ids: unresolvedCritical.map(r => r.id) }, true
    ))
  }
  if (unresolvedHigh.length > 0) {
    score -= 10
    evidenceGaps.push(`${unresolvedHigh.length} high-severity unresolved driver report(s)`)
    humanChecklist.push({ id: 'hc-high-rpt', item: `Review ${unresolvedHigh.length} high-severity driver report(s)`, priority: 'high' })
    findings.push(makeFinding(
      'agent2', AI_SEVERITY.HIGH, AI_CATEGORY.REPORT,
      `${unresolvedHigh.length} high-severity unresolved driver report(s)`,
      `High-severity driver reports linked to this assignment or route have not been resolved. These should be reviewed before the route is driven again.`,
      'Review all high-severity reports. Mark as reviewed or resolve in the dashboard.',
      { count: unresolvedHigh.length }, true
    ))
  }
  if (reports.length > 0 && unresolvedCritical.length === 0 && unresolvedHigh.length === 0) {
    humanChecklist.push({ id: 'hc-rpt-ok', item: `${reports.length} driver report(s) — all reviewed/resolved`, priority: 'ok', resolved: true })
  }

  // ── Sync / backend ────────────────────────────────────────────
  const pendingSync = syncQueue.filter(q => q.status === 'pending').length
  if (pendingSync > 0) {
    score -= 5
    evidenceGaps.push(`${pendingSync} sync item(s) pending`)
    humanChecklist.push({ id: 'hc-sync', item: `Run Sync Now to process ${pendingSync} pending item(s) before compliance review.`, priority: 'low' })
    findings.push(makeFinding(
      'agent2', AI_SEVERITY.INFO, AI_CATEGORY.SYNC,
      `${pendingSync} pending sync items`,
      'Some data changes are queued and not yet marked as synced. Run Sync Now to process the local queue.',
      'Press "Sync Now" in the dashboard to process pending queue items.',
      { pendingSync }, false
    ))
  }
  if (!backendConfigured && !isDemoMode) {
    evidenceGaps.push('Backend not configured — data is local-only')
    humanChecklist.push({ id: 'hc-backend', item: 'Configure a backend (Supabase, Firebase, AWS/custom) for production evidence storage.', priority: 'medium' })
    findings.push(makeFinding(
      'agent2', AI_SEVERITY.CAUTION, AI_CATEGORY.SYNC,
      'Backend not configured',
      'Live mode is active but no backend has been configured. All evidence is stored locally only. For production compliance records, a backend database should be configured.',
      'Configure a backend provider in a later run (Run 8).',
      { backendConfigured }, false
    ))
  }

  // ── Demo / live ───────────────────────────────────────────────
  if (isDemoMode) {
    score = Math.min(score, 40) // cap demo score
    findings.push(makeFinding(
      'agent2', AI_SEVERITY.INFO, AI_CATEGORY.DEMO_LIVE,
      'Demo mode — evidence is sample data only',
      'Demo AI advisory output. Evidence data is from demo/sample sources and must not be treated as real compliance evidence. Do not use this output for legal or regulatory purposes.',
      'Switch to Live mode with a configured backend for real compliance evidence records.',
      { demoMode: true }, false
    ))
    evidenceGaps.push('Evidence is demo/sample data — not valid for real compliance review')
    humanChecklist.push({ id: 'hc-demo', item: 'Switch to Live mode for real compliance evidence records.', priority: 'info' })
  } else {
    findings.push(makeFinding(
      'agent2', AI_SEVERITY.INFO, AI_CATEGORY.DEMO_LIVE,
      'Live mode — local advisory only',
      'Live mode is on, but no AI backend provider is configured. This review uses local advisory rules only.',
      'To add real AI compliance review capabilities, configure an AI backend provider in a later run.',
      { demoMode: false, backendConfigured }, false
    ))
  }

  // ── Score + status ────────────────────────────────────────────
  score = Math.max(0, Math.min(100, score))
  const critCount = findings.filter(f => f.severity === AI_SEVERITY.CRITICAL).length
  const highCount = findings.filter(f => f.severity === AI_SEVERITY.HIGH).length

  let evidenceStatus = AI_EVIDENCE_STATUS.READY
  if (isDemoMode)            evidenceStatus = AI_EVIDENCE_STATUS.DEMO_ONLY
  else if (critCount > 0)    evidenceStatus = AI_EVIDENCE_STATUS.CRITICAL
  else if (highCount > 0)    evidenceStatus = AI_EVIDENCE_STATUS.HIGH_REVIEW
  else if (score >= 75)      evidenceStatus = AI_EVIDENCE_STATUS.READY
  else                       evidenceStatus = AI_EVIDENCE_STATUS.NEEDS_MORE

  return {
    score,
    evidenceStatus,
    findings,
    evidenceGaps,
    humanChecklist,
    summary: {
      hasAck:          ackAccepted,
      checklistComplete: clComplete,
      hasTrip:         !!tripSession,
      hasAssignment:   !!assignment,
      unresolvedCritical: unresolvedCritical.length,
      unresolvedHigh:   unresolvedHigh.length,
      pendingSync,
      backendConfigured,
    },
  }
}

// ─── Combined review runner ───────────────────────────────────
export function runFullAdvisoryReview({
  vehicle, routePlan, assignment, navSession, tripSession,
  reports = [], auditEvents = [], syncQueue = [],
  gpsState = 'idle', isOnline = true, isDemoMode = false, backendConfigured = false,
}) {
  const now = new Date().toISOString()
  const runId = `bv-run-${Date.now()}`

  // Run agent 1
  const agent1 = analyzeVehicleSuitability({
    vehicle, routePlan, gpsState, reports, navSession, isOnline, isDemoMode,
  })

  // Run agent 2
  const agent2 = analyzeComplianceEvidence({
    vehicle, routePlan, assignment, navSession, tripSession,
    reports, auditEvents, syncQueue, isDemoMode, backendConfigured,
  })

  // Merge all findings
  const allFindings = [...agent1.findings, ...agent2.findings]
  const critCount   = allFindings.filter(f => f.severity === AI_SEVERITY.CRITICAL && f.resolvedStatus === 'open').length
  const highCount   = allFindings.filter(f => f.severity === AI_SEVERITY.HIGH     && f.resolvedStatus === 'open').length

  // Overall advisory state
  const advisory = {
    lastRunAt:                  now,
    mode:                       isDemoMode ? 'demo' : 'localRules',
    overallRisk:                agent1.riskLevel,
    vehicleSuitabilityScore:    agent1.score,
    routeSafetyScore:           agent1.score,
    evidenceCompletenessScore:  agent2.score,
    legalReviewStatus:          agent2.evidenceStatus,
    unresolvedCriticalCount:    critCount,
    unresolvedHighCount:        highCount,
    demoMode:                   isDemoMode,
    liveMode:                   !isDemoMode,
    backendConfigured,
    recommendations:            [...new Set([...agent1.recommendations])],
    humanReviewChecklist:       agent2.humanChecklist,
    lastUpdatedAt:              now,
  }

  const agentRun = {
    runId,
    agentIds:     ['agent1', 'agent2'],
    scope:        'full',
    createdAt:    now,
    mode:         advisory.mode,
    status:       'completed',
    findingCount: allFindings.length,
    inputRefs: {
      vehicleId:    vehicle?.id    || null,
      routeId:      routePlan?.id  || null,
      assignmentId: assignment?.id || null,
      tripSessionId:tripSession?.id|| null,
    },
    outputSummary: {
      vehicleSuitabilityScore:   agent1.score,
      evidenceCompletenessScore: agent2.score,
      overallRisk:               agent1.riskLevel,
      critCount,
      highCount,
    },
  }

  // Persist to SSOT
  const store = useAiAdvisoryStore.getState()
  store.setAdvisory(advisory)
  store.setFindings(allFindings)
  store.addAgentRun(agentRun)

  // Audit event
  const audit = useAuditStore.getState()
  audit.addEvent('aiReviewCompleted', 'AI advisory review completed', 'aiReview', runId, {
    vehicleSuitabilityScore:   agent1.score,
    evidenceCompletenessScore: agent2.score,
    overallRisk:               agent1.riskLevel,
    critCount, highCount,
  }, 'system', isDemoMode)

  if (critCount > 0) {
    audit.addEvent('criticalFindingRaised', `${critCount} critical finding(s) raised`, 'aiReview', runId, { critCount }, 'system', isDemoMode)
  }
  if (critCount > 0 || highCount > 0) {
    audit.addEvent('humanReviewRecommended', 'Human review recommended by AI advisory', 'aiReview', runId, { critCount, highCount }, 'system', isDemoMode)
  }

  return { advisory, findings: allFindings, agentRun, agent1, agent2 }
}

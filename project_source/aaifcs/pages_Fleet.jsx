/**
 * ============================================================
 * Big V's Best Routes™ — Vehicle Manager  (Run 2)
 * Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
 *
 * Route: /fleet  (internal path kept for router compatibility)
 * Label: Saved Vehicles
 *
 * Advisory: saved vehicle data supports risk awareness but does
 * not replace live road signs, official restrictions, or driver
 * judgement. The driver/operator remains responsible for all
 * route safety and legal verification.
 * ============================================================
 */

import { useState, useMemo } from 'react'
import Icon from './components_ui_Icon'
import { useVehicleStore } from './core_storage'
import {
  VEHICLE_TYPES,
  VEHICLE_TEMPLATES,
  VEHICLE_FIELDS,
  getVehicleTemplate,
  buildVehicleDefaults,
  createVehicleId,
  calculateVehicleReadiness,
  getMissingVehicleFields,
  getMissingCriticalFields,
  getReadinessLabel,
  validateVehicleForm,
} from './services_vehicles_vehicleService'

// ─── Readiness badge ──────────────────────────────────────────
function ReadinessBadge({ score }) {
  const { label, color, bg, border } = getReadinessLabel(score)
  return (
    <span className={`inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded-full border ${color} ${bg} ${border}`}>
      <span className="font-mono">{score}%</span>
      <span>{label}</span>
    </span>
  )
}

// ─── Vehicle type icon ────────────────────────────────────────
function VehicleTypeIcon({ type, size = 16, className = '' }) {
  const tmpl = getVehicleTemplate(type)
  return <Icon name={tmpl.icon} size={size} className={className} />
}

// ─── Missing fields warning ───────────────────────────────────
function MissingFieldsWarning({ vehicle }) {
  const missing  = getMissingVehicleFields(vehicle)
  const critical = getMissingCriticalFields(vehicle)
  if (missing.length === 0 && critical.length === 0) return null

  return (
    <div className="mt-2 p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg">
      {critical.length > 0 && (
        <div className="flex items-start gap-1.5 mb-1">
          <Icon name="AlertTriangle" size={11} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-2xs text-red-400 leading-relaxed">
            Legal-critical missing: {critical.map(f => VEHICLE_FIELDS[f]?.label || f).join(', ')}
          </p>
        </div>
      )}
      {missing.filter(f => !critical.includes(f)).length > 0 && (
        <div className="flex items-start gap-1.5">
          <Icon name="Info" size={11} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-2xs text-amber-400 leading-relaxed">
            Required missing: {missing.filter(f => !critical.includes(f)).map(f => VEHICLE_FIELDS[f]?.label || f).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Vehicle card ─────────────────────────────────────────────
function VehicleListCard({ vehicle, isActive, onSetActive, onEdit, onDelete }) {
  const score   = calculateVehicleReadiness(vehicle)
  const tmpl    = getVehicleTemplate(vehicle.type)
  const missing = getMissingCriticalFields(vehicle)

  return (
    <div className={`
      relative bg-slate-950 border rounded-xl p-4 transition-all
      ${isActive
        ? 'border-[#b8860b]/50 shadow-[0_0_20px_rgba(184,134,11,0.08)]'
        : 'border-slate-800/60 hover:border-slate-700/50'}
    `}>
      {/* Active badge */}
      {isActive && (
        <div className="absolute -top-2.5 left-4 flex items-center gap-1 bg-[#b8860b] text-black text-2xs font-bold px-2 py-0.5 rounded-full">
          <Icon name="Star" size={9} />
          ACTIVE VEHICLE
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5
          ${isActive ? 'bg-[#b8860b]/15 border border-[#b8860b]/30' : 'bg-slate-900 border border-slate-800'}
        `}>
          <VehicleTypeIcon type={vehicle.type} size={18} className={isActive ? 'text-[#d4a017]' : 'text-slate-500'} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white truncate">{vehicle.name || 'Unnamed Vehicle'}</span>
            <ReadinessBadge score={score} />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-2xs text-slate-500">{tmpl.label}</span>
            {vehicle.registration && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-2xs text-slate-500 font-mono">{vehicle.registration}</span>
              </>
            )}
            {vehicle.make && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-2xs text-slate-500">{[vehicle.make, vehicle.model].filter(Boolean).join(' ')}</span>
              </>
            )}
          </div>

          {/* Dimension summary */}
          {(vehicle.heightM || vehicle.widthM || vehicle.lengthM || vehicle.weightKg) && (
            <div className="mt-1.5 flex flex-wrap gap-2">
              {vehicle.heightM && (
                <span className="text-2xs text-slate-600 font-mono">H: {vehicle.heightM}m</span>
              )}
              {vehicle.widthM && (
                <span className="text-2xs text-slate-600 font-mono">W: {vehicle.widthM}m</span>
              )}
              {vehicle.lengthM && (
                <span className="text-2xs text-slate-600 font-mono">L: {vehicle.lengthM}m</span>
              )}
              {vehicle.weightKg && (
                <span className="text-2xs text-slate-600 font-mono">{Number(vehicle.weightKg).toLocaleString()}kg</span>
              )}
            </div>
          )}

          <MissingFieldsWarning vehicle={vehicle} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {!isActive && (
            <button
              onClick={() => onSetActive(vehicle.id)}
              className="text-2xs px-2 py-1 rounded-lg border border-[#b8860b]/30 text-[#b8860b]/80 bg-[#b8860b]/5 hover:bg-[#b8860b]/15 hover:text-[#d4a017] transition-all font-medium"
            >
              Set Active
            </button>
          )}
          {isActive && (
            <button
              onClick={() => onSetActive(null)}
              className="text-2xs px-2 py-1 rounded-lg border border-slate-700/50 text-slate-500 bg-slate-900/60 hover:bg-slate-800 transition-all"
            >
              Deactivate
            </button>
          )}
          <button
            onClick={() => onEdit(vehicle)}
            className="w-7 h-7 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 flex items-center justify-center transition-all"
          >
            <Icon name="Pencil" size={12} className="text-slate-400" />
          </button>
          <button
            onClick={() => onDelete(vehicle)}
            className="w-7 h-7 rounded-lg border border-red-900/30 bg-red-950/20 hover:bg-red-900/30 hover:border-red-700/40 flex items-center justify-center transition-all"
          >
            <Icon name="Trash2" size={12} className="text-red-500/70 hover:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#b8860b]/10 border border-[#b8860b]/20 flex items-center justify-center mb-4">
        <Icon name="Truck" size={28} className="text-[#b8860b]/60" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">No vehicles saved yet</h3>
      <p className="text-xs text-slate-500 max-w-xs mb-6 leading-relaxed">
        Add your first vehicle to start building safer, vehicle-aware route plans.
      </p>
      <button onClick={onAdd} className="btn-primary text-sm px-5 py-2">
        Add Your First Vehicle
      </button>
    </div>
  )
}

// ─── Delete confirmation modal ────────────────────────────────
function DeleteConfirmModal({ vehicle, isActive, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0a0b] border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <Icon name="Trash2" size={16} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Remove Vehicle?</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="text-white font-medium">{vehicle.name || 'This vehicle'}</span> will be permanently removed.
            </p>
          </div>
        </div>
        {isActive && (
          <div className="mb-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-400">
              ⚠ This is your active vehicle. Removing it will clear the active vehicle selection.
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 text-sm rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-semibold transition-all">
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Form section header ──────────────────────────────────────
function FormSection({ icon, title, children, isLegal = false }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800/60">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isLegal ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-800/60 border border-slate-700/40'}`}>
          <Icon name={icon} size={12} className={isLegal ? 'text-amber-400' : 'text-slate-400'} />
        </div>
        <span className="text-xs font-semibold text-slate-300">{title}</span>
        {isLegal && (
          <span className="text-2xs text-amber-400 bg-amber-500/8 border border-amber-500/20 px-1.5 py-0.5 rounded font-medium ml-1">
            Legal-critical fields
          </span>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

// ─── Form field ───────────────────────────────────────────────
function FormField({ fieldKey, value, onChange, error, required, isLegal, tmpl, isSelect = false, options = [], isToggle = false }) {
  const def = VEHICLE_FIELDS[fieldKey]
  if (!def) return null
  const label = def.label + (def.unit ? ` (${def.unit})` : '')
  const id    = `vf_${fieldKey}`

  if (isToggle) {
    return (
      <div className="flex items-center justify-between py-1">
        <div>
          <label htmlFor={id} className="text-xs text-slate-300 cursor-pointer">{def.label}</label>
          {def.help && <p className="text-2xs text-slate-600 mt-0.5">{def.help}</p>}
        </div>
        <button
          id={id}
          type="button"
          onClick={() => onChange(fieldKey, !value)}
          className={`relative w-10 h-5 rounded-full transition-all flex-shrink-0 ${
            value ? 'bg-emerald-500/70' : 'bg-slate-700'
          }`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? 'left-5.5' : 'left-0.5'}`}
            style={{ left: value ? '22px' : '2px' }} />
        </button>
      </div>
    )
  }

  if (isSelect) {
    return (
      <div>
        <label htmlFor={id} className={`block text-xs mb-1 ${error ? 'text-red-400' : isLegal ? 'text-amber-300' : 'text-slate-400'}`}>
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
          {isLegal && <span className="ml-1 text-2xs text-amber-500">⚠ Legal-critical</span>}
        </label>
        <select
          id={id}
          value={value || ''}
          onChange={e => onChange(fieldKey, e.target.value)}
          className={`apex-input w-full text-sm py-2 ${error ? 'border-red-500/50' : ''}`}
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {def.help && !error && <p className="text-2xs text-slate-600 mt-0.5">{def.help}</p>}
        {error && <p className="text-2xs text-red-400 mt-0.5">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <label htmlFor={id} className={`block text-xs mb-1 ${error ? 'text-red-400' : isLegal ? 'text-amber-300' : 'text-slate-400'}`}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        {isLegal && <span className="ml-1 text-2xs text-amber-500">⚠ Legal-critical</span>}
      </label>
      <input
        id={id}
        type={def.unit && def.unit !== '' ? 'number' : 'text'}
        step={def.unit === 'm' ? '0.01' : def.unit === 'kg' ? '1' : undefined}
        min={def.unit ? '0' : undefined}
        value={value ?? ''}
        onChange={e => onChange(fieldKey, e.target.value)}
        placeholder={def.unit ? `e.g. ${def.unit === 'm' ? '2.50' : '3500'}` : `Enter ${def.label.toLowerCase()}…`}
        className={`apex-input w-full text-sm py-2 ${error ? 'border-red-500/50' : ''}`}
      />
      {def.help && !error && <p className="text-2xs text-slate-600 mt-0.5">{def.help}</p>}
      {error && <p className="text-2xs text-red-400 mt-0.5">{error}</p>}
    </div>
  )
}

// ─── Vehicle Add / Edit Form ──────────────────────────────────
function VehicleForm({ initial, onSave, onCancel }) {
  const isEdit       = !!initial?.id
  const [form, setForm]     = useState(initial || buildVehicleDefaults(VEHICLE_TYPES.CAR))
  const [errors, setErrors] = useState({})

  const tmpl    = getVehicleTemplate(form.type)
  const score   = calculateVehicleReadiness(form)
  const readiness = getReadinessLabel(score)

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleTypeChange = (_, value) => {
    // Rebuild defaults for the new type, preserve name/registration/make/model
    const newForm = buildVehicleDefaults(value)
    setForm(prev => ({
      ...newForm,
      id:           prev.id,
      name:         prev.name,
      registration: prev.registration,
      make:         prev.make,
      model:        prev.model,
      year:         prev.year,
      fuelType:     prev.fuelType,
      notes:        prev.notes,
      createdAt:    prev.createdAt,
    }))
    setErrors({})
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { valid, errors: errs } = validateVehicleForm(form)
    if (!valid) { setErrors(errs); return }
    const now = new Date().toISOString()
    const finalVehicle = {
      ...form,
      readinessScore:        calculateVehicleReadiness(form),
      missingCriticalFields: getMissingCriticalFields(form),
      updatedAt:             now,
      createdAt:             form.createdAt || now,
    }
    onSave(finalVehicle)
  }

  const isRequired  = (f) => tmpl.requiredFields.includes(f)
  const isLegal     = (f) => tmpl.legalCriticalFields.includes(f)
  const showField   = (f) => tmpl.requiredFields.includes(f) || tmpl.optionalFields.includes(f)
  const showTrailer = tmpl.showTrailer || form.hasTrailer

  const TYPE_OPTIONS = [{ value: '', label: 'Select vehicle type…' },
    ...Object.values(VEHICLE_TEMPLATES).map(t => ({ value: t.type, label: t.label }))]

  const FUEL_OPTIONS = [
    { value: '', label: 'Select fuel type…' },
    { value: 'diesel', label: 'Diesel' },
    { value: 'petrol', label: 'Petrol' },
    { value: 'electric', label: 'Electric' },
    { value: 'hybrid', label: 'Hybrid (Petrol)' },
    { value: 'hybrid_diesel', label: 'Hybrid (Diesel)' },
    { value: 'lpg', label: 'LPG' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#09090a] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <div>
            <h2 className="text-sm font-bold text-white">{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
            <p className="text-2xs text-slate-600 mt-0.5">Big V's Best Routes™ · Vehicle Profile</p>
          </div>
          <div className="flex items-center gap-2">
            <ReadinessBadge score={score} />
            <button onClick={onCancel} className="w-7 h-7 rounded-lg border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
              <Icon name="X" size={13} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-0">

          {/* Section 1: Basic Details */}
          <FormSection icon="Tag" title="Basic Details">
            <FormField fieldKey="name" value={form.name} onChange={handleChange} error={errors.name} required tmpl={tmpl} />
            <FormField fieldKey="type" value={form.type} onChange={handleTypeChange} error={errors.type} required tmpl={tmpl}
              isSelect options={TYPE_OPTIONS} />
            {tmpl.type === VEHICLE_TYPES.CUSTOM && tmpl.customWarning && (
              <div className="p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <p className="text-2xs text-amber-400">{tmpl.customWarning}</p>
              </div>
            )}
            {showField('registration') && (
              <FormField fieldKey="registration" value={form.registration} onChange={handleChange} error={errors.registration} required={isRequired('registration')} isLegal={isLegal('registration')} tmpl={tmpl} />
            )}
            <div className="grid grid-cols-2 gap-2">
              {showField('make') && (
                <FormField fieldKey="make" value={form.make} onChange={handleChange} error={errors.make} required={isRequired('make')} tmpl={tmpl} />
              )}
              {showField('model') && (
                <FormField fieldKey="model" value={form.model} onChange={handleChange} error={errors.model} required={isRequired('model')} tmpl={tmpl} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {showField('year') && (
                <FormField fieldKey="year" value={form.year} onChange={handleChange} error={errors.year} required={isRequired('year')} tmpl={tmpl} />
              )}
              {showField('fuelType') && (
                <FormField fieldKey="fuelType" value={form.fuelType} onChange={handleChange} error={errors.fuelType} required={isRequired('fuelType')} tmpl={tmpl}
                  isSelect options={FUEL_OPTIONS} />
              )}
            </div>
          </FormSection>

          {/* Section 2: Legal / Physical Dimensions — only when template requires */}
          {(tmpl.requiredFields.some(f => ['heightM','widthM','lengthM','weightKg','maxGrossWeightKg','axleCount'].includes(f)) ||
            tmpl.optionalFields.some(f => ['heightM','widthM','lengthM','weightKg','maxGrossWeightKg','axleCount'].includes(f))) && (
            <FormSection icon="Ruler" title="Dimensions & Weight" isLegal={tmpl.legalCriticalFields.some(f => ['heightM','widthM','lengthM','weightKg','maxGrossWeightKg','axleCount'].includes(f))}>
              <div className="grid grid-cols-3 gap-2">
                {showField('heightM') && (
                  <FormField fieldKey="heightM" value={form.heightM} onChange={handleChange} error={errors.heightM} required={isRequired('heightM')} isLegal={isLegal('heightM')} tmpl={tmpl} />
                )}
                {showField('widthM') && (
                  <FormField fieldKey="widthM" value={form.widthM} onChange={handleChange} error={errors.widthM} required={isRequired('widthM')} isLegal={isLegal('widthM')} tmpl={tmpl} />
                )}
                {showField('lengthM') && (
                  <FormField fieldKey="lengthM" value={form.lengthM} onChange={handleChange} error={errors.lengthM} required={isRequired('lengthM')} isLegal={isLegal('lengthM')} tmpl={tmpl} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {showField('weightKg') && (
                  <FormField fieldKey="weightKg" value={form.weightKg} onChange={handleChange} error={errors.weightKg} required={isRequired('weightKg')} isLegal={isLegal('weightKg')} tmpl={tmpl} />
                )}
                {showField('maxGrossWeightKg') && (
                  <FormField fieldKey="maxGrossWeightKg" value={form.maxGrossWeightKg} onChange={handleChange} error={errors.maxGrossWeightKg} required={isRequired('maxGrossWeightKg')} isLegal={isLegal('maxGrossWeightKg')} tmpl={tmpl} />
                )}
              </div>
              {showField('axleCount') && (
                <FormField fieldKey="axleCount" value={form.axleCount} onChange={handleChange} error={errors.axleCount} required={isRequired('axleCount')} isLegal={isLegal('axleCount')} tmpl={tmpl} />
              )}
            </FormSection>
          )}

          {/* Section 3: Trailer Details — only when template has trailer */}
          {showTrailer && (
            <FormSection icon="Link" title="Trailer Details" isLegal={tmpl.legalCriticalFields.some(f => f.startsWith('trailer') || f.startsWith('totalCombined'))}>
              {tmpl.type === VEHICLE_TYPES.CUSTOM && (
                <FormField fieldKey="hasTrailer" value={form.hasTrailer} onChange={handleChange} tmpl={tmpl} isToggle />
              )}
              {(tmpl.showTrailer || form.hasTrailer) && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {showField('trailerLengthM') && (
                      <FormField fieldKey="trailerLengthM" value={form.trailerLengthM} onChange={handleChange} error={errors.trailerLengthM} required={isRequired('trailerLengthM')} isLegal={isLegal('trailerLengthM')} tmpl={tmpl} />
                    )}
                    {showField('trailerWidthM') && (
                      <FormField fieldKey="trailerWidthM" value={form.trailerWidthM} onChange={handleChange} error={errors.trailerWidthM} required={isRequired('trailerWidthM')} isLegal={isLegal('trailerWidthM')} tmpl={tmpl} />
                    )}
                  </div>
                  {showField('trailerWeightKg') && (
                    <FormField fieldKey="trailerWeightKg" value={form.trailerWeightKg} onChange={handleChange} error={errors.trailerWeightKg} required={isRequired('trailerWeightKg')} isLegal={isLegal('trailerWeightKg')} tmpl={tmpl} />
                  )}
                  <div className="mt-1 pt-2 border-t border-slate-800/40">
                    <p className="text-2xs text-slate-600 mb-2">Combined measurements (vehicle + trailer)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {showField('totalCombinedLengthM') && (
                        <FormField fieldKey="totalCombinedLengthM" value={form.totalCombinedLengthM} onChange={handleChange} error={errors.totalCombinedLengthM} required={isRequired('totalCombinedLengthM')} isLegal={isLegal('totalCombinedLengthM')} tmpl={tmpl} />
                      )}
                      {showField('totalCombinedWeightKg') && (
                        <FormField fieldKey="totalCombinedWeightKg" value={form.totalCombinedWeightKg} onChange={handleChange} error={errors.totalCombinedWeightKg} required={isRequired('totalCombinedWeightKg')} isLegal={isLegal('totalCombinedWeightKg')} tmpl={tmpl} />
                      )}
                    </div>
                  </div>
                </>
              )}
            </FormSection>
          )}

          {/* Section 4: Route Preferences */}
          {tmpl.preferenceFields.length > 0 && (
            <FormSection icon="Route" title="Route Preferences">
              <p className="text-2xs text-slate-600 -mt-1 mb-1">Route Planner (Run 3) will use these preferences to flag potential risks.</p>
              {tmpl.preferenceFields.map(f => (
                <FormField key={f} fieldKey={f} value={form[f]} onChange={handleChange} tmpl={tmpl} isToggle />
              ))}
            </FormSection>
          )}

          {/* Section 5: Notes */}
          <FormSection icon="FileText" title="Notes">
            <div>
              <label htmlFor="vf_notes" className="block text-xs text-slate-400 mb-1">Notes (optional)</label>
              <textarea
                id="vf_notes"
                rows={3}
                value={form.notes || ''}
                onChange={e => handleChange('notes', e.target.value)}
                placeholder="Any additional notes about this vehicle…"
                className="apex-input w-full text-sm py-2 resize-none"
              />
            </div>
          </FormSection>

          {/* Advisory */}
          <div className="p-3 bg-slate-950 border border-slate-800/60 rounded-xl mb-4">
            <p className="text-2xs text-slate-600 leading-relaxed">
              ⚠ Advisory: Vehicle dimensions and weights should be verified against official vehicle documents.
              Big V's Best Routes™ uses this information for advisory route-risk checks only and does not
              guarantee legal compliance.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900/60 transition-all">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-[#b8860b] hover:bg-[#d4a017] text-black font-bold transition-all">
              {isEdit ? 'Save Changes' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Active vehicle banner ────────────────────────────────────
function ActiveVehicleBanner({ activeVehicle, onSelect }) {
  if (!activeVehicle) {
    return (
      <div className="flex items-center gap-3 p-3 bg-slate-900/40 border border-slate-800/50 rounded-xl">
        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
          <Icon name="Car" size={15} className="text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400">No active vehicle selected.</p>
          <p className="text-2xs text-slate-600">Select a vehicle before planning a route.</p>
        </div>
      </div>
    )
  }
  const score = calculateVehicleReadiness(activeVehicle)
  const tmpl  = getVehicleTemplate(activeVehicle.type)
  return (
    <div className="flex items-center gap-3 p-3 bg-[#b8860b]/5 border border-[#b8860b]/30 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-[#b8860b]/10 border border-[#b8860b]/25 flex items-center justify-center flex-shrink-0">
        <VehicleTypeIcon type={activeVehicle.type} size={15} className="text-[#d4a017]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#d4a017]">Active Vehicle:</span>
          <span className="text-xs text-white">{activeVehicle.name}</span>
          <ReadinessBadge score={score} />
        </div>
        <p className="text-2xs text-slate-500 mt-0.5">{tmpl.label}{activeVehicle.registration ? ` · ${activeVehicle.registration}` : ''}</p>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────
export default function VehicleManager() {
  const { vehicles, activeVehicleId, addVehicle, updateVehicle, deleteVehicle, setActiveVehicle, getActiveVehicle } = useVehicleStore(s => ({
    vehicles:       s.vehicles,
    activeVehicleId: s.activeVehicleId,
    addVehicle:     s.addVehicle,
    updateVehicle:  s.updateVehicle,
    deleteVehicle:  s.deleteVehicle,
    setActiveVehicle: s.setActiveVehicle,
    getActiveVehicle: s.getActiveVehicle,
  }))

  const [showForm, setShowForm]         = useState(false)
  const [editTarget, setEditTarget]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch]             = useState('')

  const activeVehicle = useMemo(() => vehicles.find(v => v.id === activeVehicleId) || null, [vehicles, activeVehicleId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return vehicles
    return vehicles.filter(v =>
      v.name?.toLowerCase().includes(q) ||
      v.registration?.toLowerCase().includes(q) ||
      v.make?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      getVehicleTemplate(v.type).label.toLowerCase().includes(q)
    )
  }, [vehicles, search])

  const handleAdd = () => {
    setEditTarget(null)
    setShowForm(true)
  }

  const handleEdit = (vehicle) => {
    setEditTarget(vehicle)
    setShowForm(true)
  }

  const handleSave = (vehicle) => {
    if (editTarget) {
      updateVehicle(vehicle.id, vehicle)
    } else {
      addVehicle({ ...vehicle, id: createVehicleId() })
    }
    setShowForm(false)
    setEditTarget(null)
  }

  const handleDeleteRequest = (vehicle) => setDeleteTarget(vehicle)

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteVehicle(deleteTarget.id)
    setDeleteTarget(null)
  }

  const handleSetActive = (id) => {
    if (id === null) {
      setActiveVehicle(null)
    } else {
      setActiveVehicle(id)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-800/60 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display text-xl font-bold text-white">Saved Vehicles</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} saved
              {activeVehicleId && activeVehicle ? ` · Active: ${activeVehicle.name}` : ''}
            </p>
          </div>
          <button onClick={handleAdd} className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2 flex items-center gap-1.5">
            <Icon name="Plus" size={14} />
            Add Vehicle
          </button>
        </div>

        {/* Active vehicle banner */}
        <ActiveVehicleBanner activeVehicle={activeVehicle} onSelect={handleSetActive} />
      </div>

      {/* Search */}
      {vehicles.length > 0 && (
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800/40 flex-shrink-0">
          <div className="relative">
            <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, reg, make…"
              className="apex-input w-full text-xs pl-8 py-1.5 sm:max-w-xs"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {vehicles.length === 0 ? (
          <EmptyState onAdd={handleAdd} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No vehicles match your search.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(v => (
              <VehicleListCard
                key={v.id}
                vehicle={v}
                isActive={v.id === activeVehicleId}
                onSetActive={handleSetActive}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        )}

        {/* Run 3 placeholder note */}
        {vehicles.length > 0 && (
          <div className="mt-6 p-3 bg-cyan-500/5 border border-cyan-500/15 rounded-xl">
            <div className="flex items-start gap-2">
              <Icon name="Route" size={13} className="text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="text-2xs text-slate-500 leading-relaxed">
                <span className="text-cyan-400 font-medium">Run 3</span> will use your active vehicle profile
                to plan safer, vehicle-aware routes. Make sure your active vehicle has all legal-critical
                dimensions completed before route planning.
              </p>
            </div>
          </div>
        )}

        {/* Safety advisory */}
        <div className="mt-4 p-3 bg-[#0a0700] border border-[#b8860b]/15 rounded-xl">
          <p className="text-2xs text-slate-600 leading-relaxed">
            ⚠ Advisory only: saved vehicle data supports risk awareness but does not replace live road signs,
            official restrictions, or driver judgement. The driver/operator remains responsible for all route
            safety and legal verification.
          </p>
        </div>
      </div>

      {/* Forms / modals */}
      {showForm && (
        <VehicleForm
          initial={editTarget || undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditTarget(null) }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          vehicle={deleteTarget}
          isActive={deleteTarget.id === activeVehicleId}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

import React from 'react';
import { Fuel, Wrench, Shield, RotateCcw, Share2, Sparkles, CheckCircle2 } from 'lucide-react';
import VehicleImageResolver from './VehicleImageResolver.jsx';
import VehicleTechnicalBadges from './VehicleTechnicalBadges.jsx';
import { resolveBodyArchetype, resolvePowertrainArchetype, getArchetypeLabel } from './vehicleArchetypes.js';
import { useUnits } from '../../../context/UnitContext.jsx';

/**
 * Master Vehicle Visual Card
 * 
 * Supports 3 variants:
 *  - 'hero': Full-fidelity 2-column card used in TcoCalculator & MaintenanceRiskMatrix
 *  - 'showcase': Modern studio card used in HeroVehicleFinder with metrics & CTAs
 *  - 'compact': Streamlined card with mini-silhouette used in VehicleComparator
 */
export default function VehicleVisualCard({
  vehicle = {},
  variant = 'hero',
  codePrefix = 'EST',
  onChangeVehicle,
  onShareReport,
  actionButtons,
  secondaryMetrics,
  className = '',
  id,
}) {
  const { formatCurrency, formatDistance } = useUnits();
  const bodyArchetype = resolveBodyArchetype(vehicle);
  const powertrain = resolvePowertrainArchetype(vehicle);
  const bodyLabel = getArchetypeLabel(bodyArchetype);

  // Transmission short string
  const transDisplay = vehicle.transmissionLabel
    ? vehicle.transmissionLabel.split('/')[0].trim()
    : vehicle.transmission || 'Automatic';

  // =========================================================================
  // VARIANT: COMPACT (Vehicle Comparator & Mini Drawers)
  // =========================================================================
  if (variant === 'compact') {
    return (
      <div className={`space-y-3 ${className}`} id={id}>
        {/* Compact Silhouette Studio Box */}
        <div className="rounded-xl overflow-hidden bg-surface-subtle dark:bg-slate-900/90 aspect-[16/7] relative border border-border/60 dark:border-slate-700 shadow-inner flex items-center justify-center p-1 group">
          <VehicleImageResolver vehicle={vehicle} variant={variant} interactive />
        </div>

        {/* Compact Technical Badges */}
        <VehicleTechnicalBadges vehicle={vehicle} maxBadges={2} showCategory={false} size="sm" />
      </div>
    );
  }

  // =========================================================================
  // VARIANT: SHOWCASE (HeroVehicleFinder on Home Tab)
  // =========================================================================
  if (variant === 'showcase') {
    return (
      <div className={`rounded-2xl border border-border dark:border-slate-700 shadow-md bg-surface dark:bg-slate-900/90 p-5 space-y-4 ${className}`} id={id}>
        {/* Header with Telemetry Tag & Price */}
        <div className="flex items-center justify-between pb-3 border-b border-border dark:border-slate-700">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold block">
              TELEMETRY PRESET BENCHMARK
            </span>
            <h3 className="text-base sm:text-lg font-bold text-ink dark:text-slate-100">
              {vehicle.name}
            </h3>
            <p className="font-code text-xs text-muted mt-0.5">
              {vehicle.powertrainLabel || `${vehicle.powerHp || 150} HP · ${vehicle.fuelType || 'Fuel'}`}
            </p>
          </div>
          {vehicle.purchasePriceUsd && (
            <span className="font-code text-xs text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100 font-bold shrink-0">
              {formatCurrency(vehicle.purchasePriceUsd)}
            </span>
          )}
        </div>

        {/* Studio Silhouette Canvas */}
        <div className="rounded-xl overflow-hidden bg-surface-subtle dark:bg-slate-900/90 aspect-[16/7] sm:h-[160px] relative border border-border/60 dark:border-slate-700 shadow-inner flex items-center justify-center p-1.5 group">
          <VehicleImageResolver vehicle={vehicle} variant={variant} interactive />
        </div>

        {/* 4-Tier Mechanical Specification Badges */}
        <div className="pt-1">
          <VehicleTechnicalBadges vehicle={vehicle} maxBadges={4} size="sm" />
        </div>

        {/* Key Indicators 3-Col Mini Strip or Custom Secondary Metrics */}
        {secondaryMetrics ? (
          secondaryMetrics
        ) : (
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-surface-subtle dark:bg-slate-800/80 border border-border dark:border-slate-700 text-center font-code text-xs">
            <div>
              <span className="text-[10px] text-muted block">Baseline Odo</span>
              <strong className="text-ink dark:text-slate-100 text-xs font-bold">
                {formatDistance(vehicle.defaultOdometerMiles || 48000)}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-muted block">Efficiency</span>
              <strong className="text-ink dark:text-slate-100 text-xs font-bold">
                {vehicle.isEv ? `${vehicle.mpgUs} kWh` : `${vehicle.mpgUs} MPG`}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-muted block">Wear Rate</span>
              <strong className={`text-xs font-bold ${
                (vehicle.maintenanceWearFactor || 1.0) > 1.3 ? 'text-score-poor' : 'text-score-good'
              }`}>
                {(vehicle.maintenanceWearFactor || 1.0).toFixed(2)}x
              </strong>
            </div>
          </div>
        )}

        {/* Action Buttons Slot */}
        {actionButtons}
      </div>
    );
  }

  // =========================================================================
  // VARIANT: HERO (Default 2-Column Hero Card in TCO & Risk Matrix)
  // =========================================================================
  return (
    <div
      id={id}
      className={`bg-surface dark:bg-slate-900/90 rounded-2xl border border-border/80 dark:border-slate-700 shadow-card p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
        {/* Photo / Studio Visual Left (sm:col-span-5) */}
        <div className="sm:col-span-5 rounded-xl overflow-hidden bg-surface-subtle dark:bg-slate-900/90 aspect-[4/3] sm:h-[156px] relative border border-border/50 dark:border-slate-700 flex flex-col items-center justify-center p-1.5 shadow-inner group">
          <VehicleImageResolver vehicle={vehicle} variant={variant} interactive />
        </div>

        {/* Vehicle Specs Right (sm:col-span-7) */}
        <div className="sm:col-span-7 flex flex-col justify-between h-full">
          <div>
            <h3 className="font-h3 text-h3 text-ink font-semibold tracking-tight">
              {vehicle.name}
            </h3>
            <p className="font-code text-small text-muted mt-0.5 tracking-tight">
              {vehicle.engineCode || `${vehicle.powerHp || 150} HP · ${vehicle.fuelType || 'Fuel'}`}
            </p>

            {/* Spec Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className="bg-[#F1F3F6] text-ink font-micro text-micro px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium">
                <Fuel className="w-3.5 h-3.5 text-muted" />
                <span>{vehicle.fuelType}</span>
              </span>
              <span className="bg-[#F1F3F6] text-ink font-micro text-micro px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium">
                <Wrench className="w-3.5 h-3.5 text-muted" />
                <span>{transDisplay}</span>
              </span>
              <span className="bg-[#F1F3F6] text-ink font-micro text-micro px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium capitalize">
                <span>{vehicle.bodyType || bodyArchetype}</span>
              </span>
              <span className="bg-[#F1F3F6] text-ink font-micro text-micro px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium">
                <span>{vehicle.year || 2022}</span>
              </span>
            </div>

            {/* 4-Tier Mechanical Specification Badges */}
            <div className="mt-2.5">
              <VehicleTechnicalBadges vehicle={vehicle} maxBadges={4} size="sm" />
            </div>
          </div>

          {/* Secondary Telemetry Baseline subtext */}
          <div className="font-micro text-micro text-faint mt-3 flex items-center gap-1">
            {secondaryMetrics ? (
              secondaryMetrics
            ) : (
              <span>Generated on 22 Oct 2026, 15:50 · Verified OEM Baseline</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mt-5 pt-4 border-t border-border/60">
        <div className="flex flex-wrap items-center gap-2">
          {actionButtons ? (
            actionButtons
          ) : (
            <>
              <button
                type="button"
                onClick={
                  onChangeVehicle ||
                  (() => {
                    const el = document.getElementById('vehicle-heading');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  })
                }
                className="bg-surface shadow-sm rounded-full px-4 py-1.5 font-small text-small font-medium text-ink hover:bg-surface-subtle border border-border-strong transition-all inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-muted" />
                <span>Change vehicle</span>
              </button>

              {onShareReport && (
                <button
                  type="button"
                  onClick={onShareReport}
                  className="bg-surface shadow-sm rounded-full px-4 py-1.5 font-small text-small font-medium text-ink hover:bg-surface-subtle border border-border-strong transition-all inline-flex items-center gap-1.5"
                >
                  <span>Share report ↗</span>
                </button>
              )}
            </>
          )}
        </div>
        <span className="font-code text-micro text-muted uppercase">
          {codePrefix}-{(vehicle.id || 'default').slice(0, 8)}
        </span>
      </div>
    </div>
  );
}

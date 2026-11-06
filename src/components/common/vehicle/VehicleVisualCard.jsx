import React from 'react';
import { RotateCcw } from 'lucide-react';
import VehicleImageResolver, { derivePowertrainMicroBadge } from './VehicleImageResolver.jsx';
import { resolveBodyArchetype } from './vehicleArchetypes.js';
import { useUnits } from '../../../context/UnitContext.jsx';

const NEUTRAL_TAG_CLASS =
  'rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 px-2 py-0.5 text-[11px] font-sans font-medium whitespace-nowrap';

function buildSingleRowMicroTags(vehicle, bodyArchetype) {
  const { transmissionTag } = derivePowertrainMicroBadge(vehicle);
  const transDisplay = transmissionTag || 'Automatic';

  const dispMatch = (vehicle.powertrainLabel || vehicle.engineCode || '').match(/\b(\d\.\d)\s*L?\b/i);
  const dispPrefix = dispMatch ? `${dispMatch[1]}L ` : '';
  const fuelLabel = `${dispPrefix}${vehicle.fuelType || 'Gasoline'}`.trim();

  const bodyTag = (vehicle.bodyType || bodyArchetype || 'Sedan')
    .replace(/^\w/, (c) => c.toUpperCase());

  const effTag = vehicle.isEv
    ? `${vehicle.mpgUs || 28} kWh/100mi`
    : `${vehicle.mpgUs || 38} MPG`;

  return [fuelLabel, transDisplay, bodyTag, effTag].slice(0, 4);
}

/**
 * Master Vehicle Visual Card
 *
 * Supports 3 variants:
 *  - 'hero': Full-fidelity 2-column card used in TcoCalculator & MaintenanceRiskMatrix
 *  - 'showcase': Modern studio card used in HeroVehicleFinder with metrics & CTAs
 *  - 'compact': Streamlined card used in VehicleComparator
 */
export default function VehicleVisualCard({
  vehicle = {},
  variant = 'hero',
  onChangeVehicle,
  onShareReport,
  actionButtons,
  secondaryMetrics,
  className = '',
  id,
}) {
  const { formatCurrency, formatDistance } = useUnits();
  const bodyArchetype = resolveBodyArchetype(vehicle);
  const singleRowTags = buildSingleRowMicroTags(vehicle, bodyArchetype);

  // =========================================================================
  // VARIANT: COMPACT (Vehicle Comparator & Mini Drawers)
  // =========================================================================
  if (variant === 'compact') {
    return (
      <div className={`space-y-3 ${className}`} id={id}>
        <div className="rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 aspect-[16/9] relative border border-zinc-200/80 dark:border-zinc-800 group">
          <VehicleImageResolver vehicle={vehicle} variant={variant} interactive showOverlays={false} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {singleRowTags.slice(0, 4).map((tag, idx) => (
            <span key={idx} className={NEUTRAL_TAG_CLASS}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VARIANT: SHOWCASE (HeroVehicleFinder on Home Tab)
  // =========================================================================
  if (variant === 'showcase') {
    return (
      <div className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm bg-surface dark:bg-[#121215] p-5 space-y-4 ${className}`} id={id}>
        {/* Header with Vehicle Title & Price */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="min-w-0">
            <h3 className="font-sans text-base sm:text-lg font-bold tracking-tight text-ink dark:text-zinc-50 truncate">
              {vehicle.name}
            </h3>
            <p className="font-sans font-medium text-xs text-muted dark:text-zinc-400 mt-0.5 truncate">
              {vehicle.powertrainLabel || `${vehicle.powerHp || 150} HP · ${vehicle.fuelType || 'Fuel'}`}
            </p>
          </div>
          {vehicle.purchasePriceUsd && (
            <span className="font-mono tabular-nums text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/40 font-bold shrink-0">
              {formatCurrency(vehicle.purchasePriceUsd)}
            </span>
          )}
        </div>

        {/* Real Vehicle Studio Photo Frame */}
        <div className="rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 aspect-[16/9] relative border border-zinc-200/80 dark:border-zinc-800 group">
          <VehicleImageResolver vehicle={vehicle} variant={variant} interactive showOverlays={false} />
        </div>

        {/* Single Row of max 4 Neutral Micro-Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {singleRowTags.map((tag, idx) => (
            <span key={idx} className={NEUTRAL_TAG_CLASS}>
              {tag}
            </span>
          ))}
        </div>

        {/* Key Indicators 3-Col Mini Strip or Custom Secondary Metrics */}
        {secondaryMetrics ? (
          secondaryMetrics
        ) : (
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 text-center text-xs">
            <div>
              <span className="font-sans font-medium text-[10px] text-muted dark:text-zinc-400 block">Baseline Odo</span>
              <strong className="font-mono tabular-nums text-ink dark:text-zinc-50 text-xs font-bold">
                {formatDistance(vehicle.defaultOdometerMiles || 48000)}
              </strong>
            </div>
            <div>
              <span className="font-sans font-medium text-[10px] text-muted dark:text-zinc-400 block">Efficiency</span>
              <strong className="font-mono tabular-nums text-ink dark:text-zinc-50 text-xs font-bold">
                {vehicle.isEv ? `${vehicle.mpgUs} kWh` : `${vehicle.mpgUs} MPG`}
              </strong>
            </div>
            <div>
              <span className="font-sans font-medium text-[10px] text-muted dark:text-zinc-400 block">Wear Rate</span>
              <strong className={`font-mono tabular-nums text-xs font-bold ${
                (vehicle.maintenanceWearFactor || 1.0) > 1.3 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
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
      className={`bg-surface dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-card p-6 flex flex-col justify-between transition-[transform,box-shadow] duration-200 ease-out hover:shadow-card-hover hover:-translate-y-0.5 ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
        {/* Real Vehicle Photo Left (sm:col-span-5) */}
        <div className="sm:col-span-5 aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900 relative border border-zinc-200/80 dark:border-zinc-800 group">
          <VehicleImageResolver vehicle={vehicle} variant={variant} interactive showOverlays={false} />
        </div>

        {/* Vehicle Specs Right (sm:col-span-7) */}
        <div className="sm:col-span-7 flex flex-col justify-between h-full">
          <div>
            <h3 className="font-sans text-lg sm:text-xl text-ink dark:text-zinc-50 font-bold tracking-tight">
              {vehicle.name}
            </h3>
            <p className="font-sans font-medium text-xs sm:text-sm text-muted dark:text-zinc-400 mt-0.5">
              {vehicle.engineCode || `${vehicle.powerHp || 150} HP · ${vehicle.fuelType || 'Fuel'}`}
            </p>

            {/* Strictly ONE single row of max 4 neutral micro-tags */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {singleRowTags.map((tag, idx) => (
                <span key={idx} className={NEUTRAL_TAG_CLASS}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {secondaryMetrics && (
            <div className="font-sans text-xs text-muted dark:text-zinc-400 mt-3 flex items-center gap-1">
              {secondaryMetrics}
            </div>
          )}
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mt-5 pt-4 border-t border-zinc-200/80 dark:border-zinc-800">
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
                className="bg-surface dark:bg-zinc-900 shadow-xs rounded-lg px-3.5 py-1.5 font-sans text-xs font-medium text-ink dark:text-zinc-200 hover:bg-surface-subtle dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors duration-150 inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-muted dark:text-zinc-400" />
                <span>Change vehicle</span>
              </button>

              {onShareReport && (
                <button
                  type="button"
                  onClick={onShareReport}
                  className="bg-surface dark:bg-zinc-900 shadow-xs rounded-lg px-3.5 py-1.5 font-sans text-xs font-medium text-ink dark:text-zinc-200 hover:bg-surface-subtle dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors duration-150 inline-flex items-center gap-1.5"
                >
                  <span>Share report ↗</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


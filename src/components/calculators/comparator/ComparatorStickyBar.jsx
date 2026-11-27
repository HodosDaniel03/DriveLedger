import React from 'react';
import { RotateCcw, Car, GitCompare } from 'lucide-react';
import { VEHICLE_PRESETS } from '../../../data/vehiclePresets';
import { Pill } from '../../common/OdometerPrimitives';
import { useUnits } from '../../../context/UnitContext';

export default function ComparatorStickyBar({
  standalone,
  activePresetAId,
  vehicleBId,
  vehicleA,
  vehicleB,
  priceA,
  odoA,
  priceB,
  odoB,
  updateVehicleA,
  updateVehicleB,
  setCustomPriceAUsd,
  setCustomOdoAMiles,
  setCustomPriceBUsd,
  setCustomOdoBMiles,
  hasBothVehicles,
  onSwapVehicles,
}) {
  const {
    currencySymbol,
    distanceUnit,
    convertUsdToRegion,
    convertRegionToUsd,
    convertMilesToRegion,
    convertRegionToMiles,
  } = useUnits();

  return (
    <>
      {/* Compact Single-Row Sticky A vs B Selector Header (< 80px mobile & desktop, sticky across entire Card) */}
      <div
        data-testid="comparator-sticky-bar"
        className={`${
          standalone ? 'sticky top-14 sm:top-16 z-20' : 'relative z-10'
        } rounded-2xl border border-border/90 dark:border-zinc-800 bg-surface/95 dark:bg-[#121215]/95 backdrop-blur-md px-2.5 py-2 sm:px-4 sm:py-3 shadow-sm`}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-1.5 sm:gap-3 items-end min-w-0">
          {/* Vehicle A Selector */}
          <div className="min-w-0">
            <div className="hidden sm:flex items-center justify-between gap-2 mb-1.5 min-w-0">
              <Pill tone="neutral" className="shrink-0">
                VEHICLE A (Current)
              </Pill>
              {vehicleA && (
                <span className="font-mono text-[11px] text-muted dark:text-zinc-400 truncate">
                  {vehicleA.engineCode}
                </span>
              )}
            </div>
            <span className="sm:hidden block text-[10px] font-sans font-semibold text-muted dark:text-zinc-400 mb-0.5 truncate">
              Vehicle A
            </span>
            <select
              value={activePresetAId || ''}
              onChange={(e) => updateVehicleA(e.target.value)}
              aria-label="Select primary vehicle"
              className="w-full min-w-0 min-h-[42px] sm:min-h-[40px] truncate rounded-xl border border-border dark:border-zinc-700 bg-surface-subtle dark:bg-zinc-900 px-2.5 sm:px-3 py-1.5 text-xs font-sans font-semibold text-ink dark:text-zinc-50 focus:outline-none focus:border-[#183D22] dark:focus:border-emerald-500 cursor-pointer"
            >
              <option value="">Vehicle A...</option>
              {VEHICLE_PRESETS.filter((p) => p.id !== vehicleBId).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.shortName || p.name} ({p.fuelType})
                </option>
              ))}
            </select>
          </div>

          {/* Center Swap Action */}
          <div className="flex items-center justify-center pb-0.5">
            <button
              type="button"
              disabled={!hasBothVehicles}
              onClick={onSwapVehicles}
              aria-label="Swap Vehicle A and Vehicle B"
              title="Swap Vehicle A and Vehicle B"
              className={`min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-xl border transition-colors ${
                hasBothVehicles
                  ? 'border-border-strong dark:border-zinc-700 bg-surface-subtle dark:bg-zinc-800 text-ink dark:text-zinc-100 hover:border-[#183D22] dark:hover:border-emerald-500 cursor-pointer'
                  : 'border-border/60 dark:border-zinc-800 bg-surface-subtle/50 dark:bg-zinc-900/40 text-faint dark:text-zinc-600 cursor-not-allowed'
              }`}
            >
              <RotateCcw aria-hidden="true" className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Vehicle B Selector */}
          <div className="min-w-0">
            <div className="hidden sm:flex items-center justify-between gap-2 mb-1.5 min-w-0">
              <Pill tone="brand" className="shrink-0">
                VEHICLE B (Counterpart)
              </Pill>
              {vehicleB && (
                <span className="font-mono text-[11px] text-muted dark:text-zinc-400 truncate">
                  {vehicleB.engineCode}
                </span>
              )}
            </div>
            <span className="sm:hidden block text-[10px] font-sans font-semibold text-[#183D22] dark:text-emerald-400 mb-0.5 truncate">
              Vehicle B
            </span>
            <select
              value={vehicleBId || ''}
              onChange={(e) => updateVehicleB(e.target.value)}
              aria-label="Select comparison vehicle"
              className="w-full min-w-0 min-h-[42px] sm:min-h-[40px] truncate rounded-xl border border-border dark:border-zinc-700 bg-surface-subtle dark:bg-zinc-900 px-2.5 sm:px-3 py-1.5 text-xs font-sans font-semibold text-ink dark:text-zinc-50 focus:outline-none focus:border-[#183D22] dark:focus:border-emerald-500 cursor-pointer"
            >
              <option value="">Vehicle B...</option>
              {VEHICLE_PRESETS.filter((p) => p.id !== activePresetAId).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.shortName || p.name} ({p.fuelType})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Non-Sticky Price & Odometer Calibration Row (Scrolls naturally out of the way) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 min-w-0">
        {vehicleA ? (
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center justify-between gap-1.5 min-h-[42px] sm:min-h-[36px] rounded-xl bg-surface-subtle dark:bg-zinc-900 border border-border/80 dark:border-zinc-800 px-3 py-1 text-[11px] font-sans min-w-0">
              <span className="text-muted dark:text-zinc-400 shrink-0">A Price ({currencySymbol})</span>
              <input
                data-testid="comparator-price-a"
                type="number"
                min={500}
                max={250000}
                step={500}
                value={Math.round(convertUsdToRegion(priceA))}
                onChange={(e) => {
                  if (e.target.value === '') return;
                  setCustomPriceAUsd(convertRegionToUsd(Math.max(500, Number(e.target.value) || 500)));
                }}
                className="w-20 min-w-0 text-right text-base sm:text-xs bg-transparent outline-none font-mono font-semibold text-ink dark:text-zinc-50 tabular-nums"
              />
            </label>
            <label className="flex items-center justify-between gap-1.5 min-h-[42px] sm:min-h-[36px] rounded-xl bg-surface-subtle dark:bg-zinc-900 border border-border/80 dark:border-zinc-800 px-3 py-1 text-[11px] font-sans min-w-0">
              <span className="text-muted dark:text-zinc-400 shrink-0">A Odo ({distanceUnit})</span>
              <input
                data-testid="comparator-odo-a"
                type="number"
                min={0}
                max={500000}
                step={1000}
                value={Math.round(convertMilesToRegion(odoA))}
                onChange={(e) => {
                  if (e.target.value === '') return;
                  setCustomOdoAMiles(convertRegionToMiles(Math.max(0, Number(e.target.value) || 0)));
                }}
                className="w-20 min-w-0 text-right text-base sm:text-xs bg-transparent outline-none font-mono font-semibold text-ink dark:text-zinc-50 tabular-nums"
              />
            </label>
          </div>
        ) : (
          <div
            data-testid="comparator-empty-card-a"
            className="flex items-center gap-2 rounded-xl bg-surface-subtle dark:bg-zinc-900/70 px-3 py-2.5 text-xs font-sans text-muted dark:text-zinc-400"
          >
            <Car aria-hidden="true" className="w-4 h-4 shrink-0" />
            <span className="truncate">Choose Vehicle A above or tap a matchup</span>
          </div>
        )}

        {vehicleB ? (
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center justify-between gap-1.5 min-h-[42px] sm:min-h-[36px] rounded-xl bg-surface-subtle dark:bg-zinc-900 border border-border/80 dark:border-zinc-800 px-3 py-1 text-[11px] font-sans min-w-0">
              <span className="text-muted dark:text-zinc-400 shrink-0">B Price ({currencySymbol})</span>
              <input
                data-testid="comparator-price-b"
                type="number"
                min={500}
                max={250000}
                step={500}
                value={Math.round(convertUsdToRegion(priceB))}
                onChange={(e) => {
                  if (e.target.value === '') return;
                  setCustomPriceBUsd(convertRegionToUsd(Math.max(500, Number(e.target.value) || 500)));
                }}
                className="w-20 min-w-0 text-right text-base sm:text-xs bg-transparent outline-none font-mono font-semibold text-ink dark:text-zinc-50 tabular-nums"
              />
            </label>
            <label className="flex items-center justify-between gap-1.5 min-h-[42px] sm:min-h-[36px] rounded-xl bg-surface-subtle dark:bg-zinc-900 border border-border/80 dark:border-zinc-800 px-3 py-1 text-[11px] font-sans min-w-0">
              <span className="text-muted dark:text-zinc-400 shrink-0">B Odo ({distanceUnit})</span>
              <input
                data-testid="comparator-odo-b"
                type="number"
                min={0}
                max={500000}
                step={1000}
                value={Math.round(convertMilesToRegion(odoB))}
                onChange={(e) => {
                  if (e.target.value === '') return;
                  setCustomOdoBMiles(convertRegionToMiles(Math.max(0, Number(e.target.value) || 0)));
                }}
                className="w-20 min-w-0 text-right text-base sm:text-xs bg-transparent outline-none font-mono font-semibold text-ink dark:text-zinc-50 tabular-nums"
              />
            </label>
          </div>
        ) : (
          <div
            data-testid="comparator-empty-card-b"
            className="flex items-center gap-2 rounded-xl bg-surface-subtle dark:bg-zinc-900/70 px-3 py-2.5 text-xs font-sans text-muted dark:text-zinc-400"
          >
            <GitCompare aria-hidden="true" className="w-4 h-4 shrink-0" />
            <span className="truncate">Choose Vehicle B above to run comparison</span>
          </div>
        )}
      </div>
    </>
  );
}

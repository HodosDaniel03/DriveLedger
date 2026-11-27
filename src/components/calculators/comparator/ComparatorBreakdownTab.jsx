import React from 'react';
import { ArrowRight } from 'lucide-react';
import VehicleImageResolver from '../../common/vehicle/VehicleImageResolver.jsx';
import { useUnits } from '../../../context/UnitContext';

export default function ComparatorBreakdownTab({
  vehicleA,
  vehicleB,
  priceA,
  odoA,
  priceB,
  odoB,
  tcoA,
  tcoB,
  horizonYears,
  depreciationDiffTotal,
  maintenanceDiffTotal,
  total5YrSavingsB,
  monthlyCostDeltaB,
  onApplyPreset,
  onPromoteVehicleB,
}) {
  const { formatCurrency, formatDistance } = useUnits();
  const labelA = vehicleA.shortName || vehicleA.name;
  const labelB = vehicleB.shortName || vehicleB.name;

  return (
    <div className="pt-5 space-y-6 min-w-0">
      {/* Side-by-Side Visual Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
        <div className="cq-card rounded-2xl bg-surface-subtle/80 dark:bg-zinc-900/60 p-4 space-y-3 min-w-0">
          <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-surface dark:bg-zinc-950 relative border border-border/70 dark:border-zinc-800">
            <VehicleImageResolver vehicle={vehicleA} variant="compact" className="w-full h-full" interactive />
          </div>
          <div className="flex items-baseline justify-between gap-2 pt-1 min-w-0">
            <div className="min-w-0">
              <h3 className="font-sans text-sm sm:text-base font-bold text-ink dark:text-zinc-50 truncate">
                {vehicleA.name}
              </h3>
              <p className="font-sans text-xs text-muted dark:text-zinc-400">
                <span className="font-mono tabular-nums">{formatCurrency(priceA)}</span> ·{' '}
                <span className="font-mono tabular-nums">{formatDistance(odoA)}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono text-lg sm:text-xl font-bold tabular-nums text-ink dark:text-zinc-50">
                {formatCurrency(tcoA.monthlyEconomicCostUsd)}
              </span>
              <span className="font-sans text-xs text-muted dark:text-zinc-400">/mo</span>
            </div>
          </div>
        </div>

        <div className="cq-card rounded-2xl bg-surface-subtle/80 dark:bg-zinc-900/60 p-4 space-y-3 min-w-0">
          <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-surface dark:bg-zinc-950 relative border border-border/70 dark:border-zinc-800">
            <VehicleImageResolver vehicle={vehicleB} variant="compact" className="w-full h-full" interactive />
          </div>
          <div className="flex items-baseline justify-between gap-2 pt-1 min-w-0">
            <div className="min-w-0">
              <h3 className="font-sans text-sm sm:text-base font-bold text-ink dark:text-zinc-50 truncate">
                {vehicleB.name}
              </h3>
              <p className="font-sans text-xs text-muted dark:text-zinc-400">
                <span className="font-mono tabular-nums">{formatCurrency(priceB)}</span> ·{' '}
                <span className="font-mono tabular-nums">{formatDistance(odoB)}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-baseline justify-end gap-1.5">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold tabular-nums whitespace-nowrap ${
                    monthlyCostDeltaB <= 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400'
                  }`}
                >
                  {monthlyCostDeltaB <= 0
                    ? `-${formatCurrency(Math.abs(monthlyCostDeltaB))}/mo`
                    : `+${formatCurrency(monthlyCostDeltaB)}/mo`}
                </span>
                <span className="font-mono text-lg sm:text-xl font-bold tabular-nums text-[#183D22] dark:text-emerald-400">
                  {formatCurrency(tcoB.monthlyEconomicCostUsd)}
                </span>
                <span className="font-sans text-xs text-muted dark:text-zinc-400">/mo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* @container Keyboard-Accessible Side-by-Side Financial Table */}
      <div
        tabIndex={0}
        role="region"
        aria-labelledby="comparator-breakdown-caption"
        className="cq-card w-full max-w-full overflow-x-auto rounded-2xl border border-border/80 dark:border-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        <table className="dl-comp-table w-full text-left text-xs sm:text-sm border-separate border-spacing-0">
          <caption id="comparator-breakdown-caption" className="sr-only">
            {horizonYears}-year side-by-side cost breakdown between {vehicleA.name} and {vehicleB.name}
          </caption>
          <thead>
            <tr className="bg-surface-subtle dark:bg-zinc-900 text-[11px] sm:text-xs font-sans font-semibold text-muted dark:text-zinc-400">
              <th scope="col" className="sticky left-0 z-10 bg-surface-subtle dark:bg-zinc-900 py-3 px-3 sm:px-4 border-b border-border/80 dark:border-zinc-800">
                Category
              </th>
              <th scope="col" className="py-3 px-3 sm:px-4 text-right border-b border-border/80 dark:border-zinc-800">
                {labelA}
              </th>
              <th scope="col" className="py-3 px-3 sm:px-4 text-right border-b border-border/80 dark:border-zinc-800">
                {labelB}
              </th>
              <th scope="col" className="py-3 px-3 sm:px-4 text-right border-b border-border/80 dark:border-zinc-800">
                Delta (B vs A)
              </th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs text-body dark:text-zinc-300">
            <tr>
              <th scope="row" className="sticky left-0 bg-surface dark:bg-[#121215] py-3 px-3 sm:px-4 font-sans font-semibold text-ink dark:text-zinc-200 border-b border-border/60 dark:border-zinc-800/80">
                Purchase Price
              </th>
              <td data-col-label={labelA} className="py-3 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap border-b border-border/60 dark:border-zinc-800/80">
                {formatCurrency(priceA)}
              </td>
              <td data-col-label={labelB} className="py-3 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap border-b border-border/60 dark:border-zinc-800/80">
                {formatCurrency(priceB)}
              </td>
              <td data-col-label="Delta" className="py-3 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap font-semibold text-ink dark:text-zinc-50 border-b border-border/60 dark:border-zinc-800/80">
                {priceB - priceA >= 0 ? '+' : ''}
                {formatCurrency(priceB - priceA)}
              </td>
            </tr>
            <tr>
              <th scope="row" className="sticky left-0 bg-surface dark:bg-[#121215] py-3 px-3 sm:px-4 font-sans font-semibold text-ink dark:text-zinc-200 border-b border-border/60 dark:border-zinc-800/80">
                {horizonYears}-Year Depreciation
              </th>
              <td data-col-label={labelA} className="py-3 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap border-b border-border/60 dark:border-zinc-800/80">
                {formatCurrency(tcoA.totalDepreciationUsd)}
              </td>
              <td data-col-label={labelB} className="py-3 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap border-b border-border/60 dark:border-zinc-800/80">
                {formatCurrency(tcoB.totalDepreciationUsd)}
              </td>
              <td
                data-col-label="Delta"
                className={`py-3 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap font-semibold border-b border-border/60 dark:border-zinc-800/80 ${
                  depreciationDiffTotal >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {depreciationDiffTotal >= 0 ? '-' : '+'}
                {formatCurrency(Math.abs(depreciationDiffTotal))}
              </td>
            </tr>
            <tr>
              <th scope="row" className="sticky left-0 bg-surface dark:bg-[#121215] py-3 px-3 sm:px-4 font-sans font-semibold text-ink dark:text-zinc-200 border-b border-border/60 dark:border-zinc-800/80">
                Fuel / Energy ({horizonYears} Yrs)
              </th>
              <td data-col-label={labelA} className="py-3 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap border-b border-border/60 dark:border-zinc-800/80">
                {formatCurrency(tcoA.totalFuelUsd)}
              </td>
              <td data-col-label={labelB} className="py-3 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap border-b border-border/60 dark:border-zinc-800/80">
                {formatCurrency(tcoB.totalFuelUsd)}
              </td>
              <td
                data-col-label="Delta"
                className={`py-3 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap font-semibold border-b border-border/60 dark:border-zinc-800/80 ${
                  tcoA.totalFuelUsd - tcoB.totalFuelUsd >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {tcoA.totalFuelUsd - tcoB.totalFuelUsd >= 0 ? '-' : '+'}
                {formatCurrency(Math.abs(tcoA.totalFuelUsd - tcoB.totalFuelUsd))}
              </td>
            </tr>
            <tr>
              <th scope="row" className="sticky left-0 bg-surface dark:bg-[#121215] py-3 px-3 sm:px-4 font-sans font-semibold text-ink dark:text-zinc-200 border-b border-border/60 dark:border-zinc-800/80">
                Maintenance Reserve
              </th>
              <td data-col-label={labelA} className="py-3 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap border-b border-border/60 dark:border-zinc-800/80">
                {formatCurrency(tcoA.totalMaintenanceUsd)}
              </td>
              <td data-col-label={labelB} className="py-3 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap border-b border-border/60 dark:border-zinc-800/80">
                {formatCurrency(tcoB.totalMaintenanceUsd)}
              </td>
              <td
                data-col-label="Delta"
                className={`py-3 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap font-semibold border-b border-border/60 dark:border-zinc-800/80 ${
                  maintenanceDiffTotal >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {maintenanceDiffTotal >= 0 ? '-' : '+'}
                {formatCurrency(Math.abs(maintenanceDiffTotal))}
              </td>
            </tr>
            <tr>
              <th scope="row" className="sticky left-0 bg-surface dark:bg-[#121215] py-3 px-3 sm:px-4 font-sans font-semibold text-ink dark:text-zinc-200 border-b border-border/80 dark:border-zinc-800">
                Insurance ({horizonYears} Yrs)
              </th>
              <td data-col-label={labelA} className="py-3 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap border-b border-border/80 dark:border-zinc-800">
                {formatCurrency(tcoA.totalInsuranceUsd)}
              </td>
              <td data-col-label={labelB} className="py-3 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap border-b border-border/80 dark:border-zinc-800">
                {formatCurrency(tcoB.totalInsuranceUsd)}
              </td>
              <td data-col-label="Delta" className="py-3 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap border-b border-border/80 dark:border-zinc-800">
                {tcoB.totalInsuranceUsd - tcoA.totalInsuranceUsd >= 0 ? '+' : ''}
                {formatCurrency(tcoB.totalInsuranceUsd - tcoA.totalInsuranceUsd)}
              </td>
            </tr>
            <tr className="bg-surface-subtle dark:bg-zinc-900 font-semibold">
              <th scope="row" className="sticky left-0 bg-surface-subtle dark:bg-zinc-900 py-3.5 px-3 sm:px-4 font-sans font-bold text-ink dark:text-zinc-50">
                Total 5-Year True Cost to Own
              </th>
              <td data-col-label={labelA} className="py-3.5 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap font-bold text-ink dark:text-zinc-50">
                <span>{formatCurrency(tcoA.totalEconomicCostUsd)}</span>
                <span className="block text-[10px] font-normal text-muted dark:text-zinc-400">
                  {formatCurrency(tcoA.monthlyEconomicCostUsd)}/mo
                </span>
              </td>
              <td data-col-label={labelB} className="py-3.5 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap font-bold text-ink dark:text-zinc-50">
                <span>{formatCurrency(tcoB.totalEconomicCostUsd)}</span>
                <span className="block text-[10px] font-normal text-muted dark:text-zinc-400">
                  {formatCurrency(tcoB.monthlyEconomicCostUsd)}/mo
                </span>
              </td>
              <td
                data-col-label="Delta"
                className={`py-3.5 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap font-bold ${
                  total5YrSavingsB >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {total5YrSavingsB >= 0
                  ? `-${formatCurrency(total5YrSavingsB)}`
                  : `+${formatCurrency(Math.abs(total5YrSavingsB))}`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {onApplyPreset && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onPromoteVehicleB}
            className="min-h-[44px] sm:min-h-[38px] inline-flex items-center gap-1.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 px-4 py-2 text-xs font-sans font-semibold text-ink dark:text-zinc-100 border border-border/80 dark:border-zinc-800 hover:border-[#183D22] dark:hover:border-emerald-500 transition-colors cursor-pointer"
          >
            <span>Set Vehicle B as Primary</span>
            <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 text-[#183D22] dark:text-emerald-400" />
          </button>
        </div>
      )}
    </div>
  );
}

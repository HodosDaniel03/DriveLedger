import React from 'react';
import { CheckCircle2, Copy, Car } from 'lucide-react';
import { BottomSheet } from '../../common/OdometerPrimitives';
import { useUnits } from '../../../context/UnitContext';

export default function TcoMobileBreakdownSheet({
  open,
  onClose,
  hasSelectedVehicle,
  activePreset,
  odometerMiles,
  horizonYears,
  tco,
  costPerLocalUnit,
  ownershipValueScore,
  ownershipVerdict,
  allocationColors,
  battlecard,
  copiedScript,
  onCopySellerScript,
  onOpenVehiclePicker,
}) {
  const { currencySymbol, distanceUnit, formatCurrency, formatDistance } = useUnits();

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      id="tco-mobile-breakdown-sheet"
      title={hasSelectedVehicle ? `${activePreset.shortName || activePreset.name} · Cost Breakdown` : 'Live Cost Breakdown'}
    >
      <div data-testid="tco-mobile-breakdown-content" className="space-y-5">
        {!hasSelectedVehicle ? (
          <div className="p-4 rounded-xl bg-surface-subtle dark:bg-zinc-900 text-center space-y-3">
            <p className="font-sans text-sm font-semibold text-ink dark:text-zinc-100">
              No vehicle selected yet
            </p>
            <p className="font-sans text-xs text-muted dark:text-zinc-400 leading-relaxed">
              Pick one of 179+ benchmarked models to unlock your {horizonYears}-year monthly breakdown and negotiation battlecard.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenVehiclePicker) onOpenVehiclePicker();
              }}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#183D22] dark:bg-emerald-600 text-white font-sans text-xs font-semibold px-4 py-2.5"
            >
              <Car aria-hidden="true" className="w-4 h-4" />
              <span>Select a Vehicle</span>
            </button>
          </div>
        ) : (
          <>
            {/* Headline Verdict Strip */}
            <div className="flex items-baseline justify-between gap-3 pb-4 border-b border-border/80 dark:border-zinc-800">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-2xl font-bold tabular-nums text-ink dark:text-zinc-50">
                    {formatCurrency(tco.monthlyEconomicCostUsd)}
                  </span>
                  <span className="font-sans text-xs text-muted dark:text-zinc-400">/mo</span>
                </div>
                <p className="font-sans text-xs text-muted dark:text-zinc-400 mt-0.5">
                  {horizonYears}-yr total: <strong className="font-mono tabular-nums text-ink dark:text-zinc-200">{formatCurrency(tco.totalEconomicCostUsd)}</strong> ·{' '}
                  <span className="font-mono tabular-nums">{formatCurrency(costPerLocalUnit, 2)}/{distanceUnit}</span>
                </p>
              </div>
              <span className={`rounded-md border px-2 py-1 text-[11px] font-sans font-semibold shrink-0 ${ownershipVerdict.badgeClass}`}>
                {ownershipValueScore}/100 · {ownershipVerdict.text}
              </span>
            </div>

            {/* Visual Breakdown Bar + Rows */}
            <div className="space-y-3">
              <div className="h-2.5 rounded-full overflow-hidden flex bg-surface-subtle dark:bg-zinc-900 gap-0.5">
                {tco.breakdown
                  .filter((c) => c.amountUsd > 0)
                  .map((c) => (
                    <div
                      key={c.id}
                      style={{
                        flexGrow: c.amountUsd,
                        flexBasis: 0,
                        backgroundColor: allocationColors[c.id] || c.color,
                      }}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                    />
                  ))}
              </div>

              <div className="divide-y divide-border/70 dark:divide-zinc-800 text-xs">
                {tco.breakdown.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2">
                    <span className="flex items-center gap-2 font-sans text-body dark:text-zinc-200">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: allocationColors[c.id] || c.color }}
                      />
                      <span>{c.label}</span>
                    </span>
                    <span className="font-mono tabular-nums font-medium text-ink dark:text-zinc-100">
                      {formatCurrency(Math.round(c.amountUsd / (horizonYears * 12)))}/mo ({Math.round(c.sharePct)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Negotiation Battlecard inside Bottom Sheet */}
            {battlecard && (
              <div className="pt-4 border-t border-border/80 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-sans text-xs font-semibold text-ink dark:text-zinc-100">
                    Negotiation Battlecard ({formatDistance(odometerMiles)})
                  </h3>
                  <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    Offer: {formatCurrency(battlecard.targetOfferPriceUsd)}
                  </span>
                </div>

                <div className="grid grid-cols-3 divide-x divide-border/70 dark:divide-zinc-800 rounded-xl bg-surface-subtle dark:bg-zinc-900 p-3 text-center text-xs">
                  <div className="pr-2">
                    <span className="block text-[10px] text-muted dark:text-zinc-400">Fair Value</span>
                    <span className="font-mono font-bold tabular-nums text-ink dark:text-zinc-100">
                      {formatCurrency(battlecard.fairValueUsd)}
                    </span>
                  </div>
                  <div className="px-2">
                    <span className="block text-[10px] text-muted dark:text-zinc-400">Yr 1 Service</span>
                    <span className="font-mono font-bold tabular-nums text-amber-700 dark:text-amber-400">
                      {formatCurrency(battlecard.upcomingMaintenanceUsd)}
                    </span>
                  </div>
                  <div className="pl-2">
                    <span className="block text-[10px] text-muted dark:text-zinc-400">Yr 1 Depr.</span>
                    <span className="font-mono font-bold tabular-nums text-ink dark:text-zinc-200">
                      {formatCurrency(battlecard.year1DepreciationUsd)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onCopySellerScript}
                  className={`w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-sans text-xs font-semibold text-white transition-colors ${
                    copiedScript ? 'bg-emerald-600' : 'bg-[#183D22] dark:bg-emerald-600'
                  }`}
                >
                  {copiedScript ? (
                    <>
                      <CheckCircle2 aria-hidden="true" className="w-4 h-4" />
                      <span>Message Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy aria-hidden="true" className="w-4 h-4" />
                      <span>Copy Seller Negotiation Script</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
}

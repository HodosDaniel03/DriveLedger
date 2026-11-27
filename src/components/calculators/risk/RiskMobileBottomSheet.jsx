import React from 'react';
import { Car, CheckCircle2, Printer, Share2 } from 'lucide-react';
import { BottomSheet } from '../../common/OdometerPrimitives';
import { useUnits } from '../../../context/UnitContext';

export default function RiskMobileBottomSheet({
  open,
  onClose,
  isVehicleSelected,
  activePreset,
  physicalOdometerMiles,
  reliabilityScore,
  serviceReserveUsd,
  criticalCount,
  warningCount,
  evaluatedComponents,
  isSavedInGarage,
  onSaveToGarage,
  onOpenDossierPrint,
  onOpenForumShare,
  onOpenVehiclePicker,
}) {
  const { formatCurrency, formatDistance } = useUnits();

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      id="risk-mobile-breakdown-sheet"
      title={
        isVehicleSelected && activePreset
          ? `${activePreset.shortName || activePreset.name} · Health & Reserve`
          : 'Powertrain Health & Reserve'
      }
    >
      <div data-testid="risk-mobile-breakdown-content" className="space-y-5 overscroll-contain">
        {!isVehicleSelected || !activePreset ? (
          <div className="p-4 rounded-xl bg-surface-subtle dark:bg-zinc-900 text-center space-y-3">
            <p className="font-sans text-sm font-semibold text-ink dark:text-zinc-100">
              No vehicle selected yet
            </p>
            <p className="font-sans text-xs text-muted dark:text-zinc-400 leading-relaxed">
              Pick one of 179+ benchmarked models to unlock your Reliability Score, 12-month service reserve, and component wear timeline.
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
                <span className="block text-[11px] font-sans text-muted dark:text-zinc-400">
                  12-Month Service Reserve
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-2xl font-bold tabular-nums text-ink dark:text-zinc-50">
                    {formatCurrency(serviceReserveUsd)}
                  </span>
                  <span className="font-sans text-xs text-muted dark:text-zinc-400">/yr</span>
                </div>
                <p className="font-sans text-xs text-muted dark:text-zinc-400 mt-0.5">
                  Odometer: <strong className="font-mono tabular-nums text-ink dark:text-zinc-200">{formatDistance(physicalOdometerMiles)}</strong>
                </p>
              </div>
              <span
                className={`rounded-md border px-2.5 py-1 text-xs font-mono tabular-nums font-semibold shrink-0 ${
                  reliabilityScore >= 70
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/40'
                    : reliabilityScore >= 40
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/40'
                    : 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/40'
                }`}
              >
                Score {reliabilityScore}/100
              </span>
            </div>

            {/* 3-Column Critical / Due / Monitored Strip */}
            <div className="grid grid-cols-3 divide-x divide-border/70 dark:divide-zinc-800 rounded-xl bg-surface-subtle dark:bg-zinc-900 p-3 text-center text-xs">
              <div className="pr-2">
                <span className="block text-[11px] text-muted dark:text-zinc-400">Critical</span>
                <span className="font-mono font-bold tabular-nums text-rose-600 dark:text-rose-400">
                  {criticalCount}
                </span>
              </div>
              <div className="px-2">
                <span className="block text-[11px] text-muted dark:text-zinc-400">Due Soon</span>
                <span className="font-mono font-bold tabular-nums text-amber-700 dark:text-amber-400">
                  {warningCount}
                </span>
              </div>
              <div className="pl-2">
                <span className="block text-[11px] text-muted dark:text-zinc-400">Assemblies</span>
                <span className="font-mono font-bold tabular-nums text-ink dark:text-zinc-200">
                  {evaluatedComponents.length}
                </span>
              </div>
            </div>

            {/* Top Assemblies Summary */}
            <div className="divide-y divide-border/70 dark:divide-zinc-800 text-xs">
              {evaluatedComponents.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 py-2.5">
                  <span className="font-sans text-body dark:text-zinc-200 truncate">{item.name}</span>
                  <span className="font-mono tabular-nums font-medium text-ink dark:text-zinc-100 shrink-0">
                    {item.health.wearPctOfCritical}% wear
                  </span>
                </div>
              ))}
            </div>

            {/* Sheet Actions */}
            <div className="pt-3 border-t border-border/80 dark:border-zinc-800 space-y-2">
              <button
                type="button"
                onClick={onSaveToGarage}
                className={`w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-sans text-xs font-semibold border transition-colors ${
                  isSavedInGarage
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                    : 'bg-[#183D22] dark:bg-emerald-600 text-white border-[#183D22] dark:border-emerald-500'
                }`}
              >
                {isSavedInGarage ? (
                  <>
                    <CheckCircle2 aria-hidden="true" className="w-4 h-4" />
                    <span>Saved to Garage</span>
                  </>
                ) : (
                  <>
                    <Car aria-hidden="true" className="w-4 h-4" />
                    <span>Save to My Garage</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenForumShare) onOpenForumShare();
                  }}
                  className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 px-3 py-2 font-sans text-xs font-medium text-ink dark:text-zinc-200 border border-border/80 dark:border-zinc-800"
                >
                  <Share2 aria-hidden="true" className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400" />
                  <span>Reddit Share</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenDossierPrint) onOpenDossierPrint();
                  }}
                  className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 px-3 py-2 font-sans text-xs font-medium text-ink dark:text-zinc-200 border border-border/80 dark:border-zinc-800"
                >
                  <Printer aria-hidden="true" className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}

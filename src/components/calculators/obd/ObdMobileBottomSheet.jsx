import React from 'react';
import { Car } from 'lucide-react';
import { BottomSheet, Pill, Segmented } from '../../common/OdometerPrimitives';
import { useUnits } from '../../../context/UnitContext';

export default function ObdMobileBottomSheet({
  open,
  onClose,
  activeDossier,
  activePreset,
  isVehicleSelected,
  est,
  dealershipEst,
  diyEst,
  diySavingsVsDealerUsd,
  laborTierId,
  setLaborTierId,
  partsShare,
  drivabilityTone,
  drivabilityLabel,
  drivabilityGuidance,
  liveVerdict,
  onOpenVehiclePicker,
}) {
  const { formatCurrency } = useUnits();

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      id="obd-mobile-summary-sheet"
      title={`${activeDossier.code} Workshop Cost Summary`}
    >
      <div data-testid="obd-mobile-bottom-sheet-content" className="space-y-5">
        {/* Headline Quote & Drivability Status */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-border/80 dark:border-zinc-800">
          <div className="min-w-0">
            <div className="font-mono text-2xl font-bold tabular-nums text-ink dark:text-zinc-50 leading-tight">
              {formatCurrency(est.minTotalUsd)} – {formatCurrency(est.maxTotalUsd)}
            </div>
            <p className="font-sans text-xs text-muted dark:text-zinc-400 mt-1">
              Typical expected:{' '}
              <strong className="font-mono tabular-nums text-ink dark:text-zinc-100">
                {formatCurrency(est.weightedExpectedUsd)}
              </strong>{' '}
              ({est.tierLabel})
            </p>
          </div>
          <Pill tone={drivabilityTone} className="shrink-0">
            {drivabilityLabel}
          </Pill>
        </div>

        {/* Drivability Guidance + Book Time */}
        <div className="rounded-xl bg-surface-subtle dark:bg-zinc-900 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-sans font-semibold text-ink dark:text-zinc-100">
              Can I keep driving?
            </span>
            <span className="font-mono tabular-nums font-medium text-muted dark:text-zinc-400">
              Book: {activeDossier.laborHoursRange ? `${activeDossier.laborHoursRange[0]}–${activeDossier.laborHoursRange[1]} hrs` : '1.5–3.0 hrs'}
            </span>
          </div>
          <p className="font-sans text-body dark:text-zinc-300 leading-relaxed">
            {drivabilityGuidance}
          </p>
        </div>

        {/* Live Telemetry Narrowed Range (when active) */}
        {liveVerdict && (
          <div className="rounded-xl bg-surface-subtle dark:bg-zinc-900 p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-sans font-semibold text-ink dark:text-zinc-100">
                Live PID Narrowed Range
              </span>
              {liveVerdict.tone !== 'good' && (
                <Pill tone={liveVerdict.tone}>{liveVerdict.badgeLabel}</Pill>
              )}
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-base font-bold tabular-nums text-primary-600 dark:text-emerald-400">
                {formatCurrency(liveVerdict.narrowedMinUsd)} – {formatCurrency(liveVerdict.narrowedMaxUsd)}
              </span>
              <span className="font-mono tabular-nums text-muted dark:text-zinc-400">
                Avg {formatCurrency(liveVerdict.narrowedExpectedUsd)}
              </span>
            </div>
            <p className="font-sans text-muted dark:text-zinc-400 truncate" title={liveVerdict.primarySuspectCause}>
              Suspect: <span className="font-medium text-ink dark:text-zinc-200">{liveVerdict.primarySuspectCause}</span>
            </p>
          </div>
        )}

        {/* Workshop Tier Switcher */}
        <div className="space-y-2.5">
          <Segmented
            label="Workshop labor rate tier"
            value={laborTierId}
            onChange={setLaborTierId}
            options={[
              { value: 'independent', label: 'Independent', hint: `${formatCurrency(115)}/hr` },
              { value: 'dealership', label: 'Dealership', hint: `${formatCurrency(185)}/hr` },
              { value: 'diy', label: 'DIY Garage', hint: `${formatCurrency(0)}/hr` },
            ]}
          />
          {diySavingsVsDealerUsd > 0 && (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 px-3 py-2 text-xs font-sans font-medium text-emerald-800 dark:text-emerald-400">
              <span>DIY saves {formatCurrency(diySavingsVsDealerUsd)} vs. Dealership</span>
              <span className="font-mono tabular-nums">
                {formatCurrency(diyEst.weightedExpectedUsd)} vs {formatCurrency(dealershipEst.weightedExpectedUsd)}
              </span>
            </div>
          )}
        </div>

        {/* Parts vs Labor Allocation */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-sans text-muted dark:text-zinc-400">
            <span className="font-medium">Cost allocation</span>
            <span className="font-mono tabular-nums">
              {partsShare}% Parts / {100 - partsShare}% Labor
            </span>
          </div>
          <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface-subtle dark:bg-zinc-800" aria-hidden="true">
            <div
              className="h-full bg-primary-600 dark:bg-emerald-500 first:rounded-l-full"
              style={{ width: `${partsShare}%` }}
            />
            <div className="h-full flex-1 bg-zinc-400 dark:bg-zinc-600 last:rounded-r-full" />
          </div>
          <dl className="grid grid-cols-2 divide-x divide-border/70 dark:divide-zinc-800 pt-1 text-xs">
            <div className="pr-3">
              <dt className="font-sans text-muted dark:text-zinc-400">Parts</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums text-ink dark:text-zinc-50 mt-0.5">
                {formatCurrency(est.weightedPartsUsd)}
              </dd>
            </div>
            <div className="pl-3">
              <dt className="font-sans text-muted dark:text-zinc-400">Labor</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums text-ink dark:text-zinc-50 mt-0.5">
                {formatCurrency(est.weightedLaborUsd)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Vehicle Calibration Trigger */}
        <button
          type="button"
          onClick={() => {
            onClose();
            if (onOpenVehiclePicker) onOpenVehiclePicker();
          }}
          className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-border dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900 px-4 py-2.5 font-sans text-xs font-semibold text-ink dark:text-zinc-100 hover:bg-canvas dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Car aria-hidden="true" className="w-4 h-4 text-primary-600 dark:text-emerald-400" />
          <span>
            {isVehicleSelected && activePreset
              ? `Vehicle: ${activePreset.shortName || activePreset.name} · Switch`
              : 'Calibrate for a specific vehicle'}
          </span>
        </button>
      </div>
    </BottomSheet>
  );
}

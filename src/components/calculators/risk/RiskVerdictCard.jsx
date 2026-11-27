import React from 'react';
import {
  Car,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  Printer,
  Share2,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { Card, InfoTooltip, RadialScoreGauge } from '../../common/OdometerPrimitives';
import { useUnits } from '../../../context/UnitContext';

export default function RiskVerdictCard({
  isVehicleSelected,
  activePreset,
  physicalOdometerMiles,
  scheduleMode,
  oemRiskMultiplier,
  oemScoreDeduction,
  reliabilityScore,
  serviceReserveUsd,
  baseReserveUsd,
  effectiveWearMax,
  criticalCount,
  warningCount,
  evaluatedComponents,
  verifiedServiceCreditUsd,
  maintenanceBonusPts,
  isSavedInGarage,
  onSaveToGarage,
  showComparator,
  onToggleComparator,
  showExportMenu,
  setShowExportMenu,
  onOpenForumShare,
  onOpenNegotiationPdf,
  onOpenDossierPrint,
}) {
  const { currencySymbol, formatCurrency, formatDistance } = useUnits();

  return (
    <Card className="h-fit p-5 sm:p-6" aria-labelledby="risk-verdict-heading">
      {/* Calm Header (Max 1 status badge) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="risk-verdict-heading"
          className="font-sans text-xs font-semibold text-muted dark:text-zinc-400 scroll-mt-28 lg:scroll-mt-32"
        >
          Powertrain Health &amp; Reserve
        </h2>
        {scheduleMode === 'oem' ? (
          <span className="rounded-md bg-rose-50/80 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40 px-2.5 py-0.5 text-[11px] font-sans font-medium shrink-0">
            OEM Risk (+{oemRiskMultiplier.toFixed(2)}x)
          </span>
        ) : (
          <span className="rounded-md bg-surface-subtle dark:bg-zinc-900 text-body dark:text-zinc-300 border border-border/80 dark:border-zinc-800 px-2.5 py-0.5 text-[11px] font-sans font-medium shrink-0">
            Specialist Preventative
          </span>
        )}
      </div>

      {/* Gauge + 12-Month Service Reserve */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-5 pb-4">
        <div className="flex flex-col items-center justify-center shrink-0">
          {isVehicleSelected ? (
            <RadialScoreGauge score={reliabilityScore} size={128} inverted={false} />
          ) : (
            <div
              data-testid="risk-empty-gauge"
              className="w-[128px] h-[128px] rounded-full border-[10px] border-border/80 dark:border-zinc-800 flex flex-col items-center justify-center text-center bg-surface-subtle/40 dark:bg-zinc-900/40"
            >
              <span className="font-mono text-2xl font-bold text-muted dark:text-zinc-400 tabular-nums">--/100</span>
              <span className="mt-1 px-2 py-0.5 rounded-md bg-surface dark:bg-zinc-800 border border-border/80 dark:border-zinc-700 text-[10px] font-sans font-medium text-muted dark:text-zinc-400">
                Select a Car
              </span>
            </div>
          )}
          <span className="mt-1.5 font-sans text-xs font-medium text-muted dark:text-zinc-400">
            Reliability Score
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-xs font-sans font-medium text-muted dark:text-zinc-400 inline-flex items-center gap-1">
              <span>Estimated 12-month service reserve</span>
              <InfoTooltip
                label="What is the 12-Month Service Reserve?"
                content="The recommended annual maintenance fund weighted by each component's current wear percentage, workshop labor tier, and annual driving distance."
              />
            </p>
            <p
              className="mt-1 text-metric-xl font-bold tabular-nums tracking-tight font-mono text-ink dark:text-zinc-50 leading-none"
              aria-live="polite"
            >
              {isVehicleSelected ? formatCurrency(serviceReserveUsd) : `${currencySymbol}-`}
            </p>
            {isVehicleSelected && scheduleMode === 'oem' && (
              <p className="text-xs text-muted dark:text-zinc-400 font-sans mt-1.5">
                Base preventative: <span className="font-mono tabular-nums">{formatCurrency(baseReserveUsd)}</span> ·{' '}
                <span className="font-mono tabular-nums text-rose-700 dark:text-rose-400 font-medium">{oemRiskMultiplier.toFixed(2)}x</span> risk
              </p>
            )}
          </div>

          <p className="truncate font-sans text-xs text-muted dark:text-zinc-400">
            {isVehicleSelected && activePreset ? (
              <>
                {activePreset.name} · <span className="font-mono tabular-nums">{formatDistance(physicalOdometerMiles)}</span>
              </>
            ) : (
              'Select a vehicle on the left to compute wear'
            )}
          </p>
        </div>
      </div>

      {/* Active Bonus & Credit Badges */}
      {isVehicleSelected && (maintenanceBonusPts > 0 || verifiedServiceCreditUsd > 0) && (
        <div className="flex flex-wrap items-center gap-2 pb-4">
          {maintenanceBonusPts > 0 && (
            <span
              data-testid="maintenance-bonus-badge"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40 text-[11px] font-sans font-medium"
            >
              <CheckCircle2 aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono tabular-nums">+{maintenanceBonusPts} pts</span> Maintenance Bonus
            </span>
          )}
          {verifiedServiceCreditUsd > 0 && (
            <span
              data-testid="verified-service-credit-badge"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40 text-[11px] font-sans font-medium"
            >
              <CheckCircle2 aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono tabular-nums">-{formatCurrency(verifiedServiceCreditUsd)}</span> Verified Service Credit
            </span>
          )}
        </div>
      )}

      {/* Hairline 3-Metric Strip */}
      <dl className="grid grid-cols-3 divide-x divide-border/80 dark:divide-zinc-800 py-3.5 border-y border-border/80 dark:border-zinc-800 text-xs mb-4">
        <div className="pr-2.5 min-w-0">
          <dt className="text-muted dark:text-zinc-400 font-sans inline-flex items-center gap-1 max-w-full">
            <span className="truncate">Effective wear</span>
            <InfoTooltip
              label="What is Effective Wear?"
              content="Mechanical stress age adjusted for urban stop-and-go thermal cycles and oil drain intervals, often 20-45% higher than raw physical odometer miles."
            />
          </dt>
          <dd className="font-semibold tabular-nums font-mono text-ink dark:text-zinc-50 mt-0.5 truncate">
            {isVehicleSelected ? formatDistance(effectiveWearMax) : '—'}
          </dd>
        </div>
        <div className="px-2.5 min-w-0">
          <dt className="text-muted dark:text-zinc-400 font-sans truncate">Odometer</dt>
          <dd className="font-semibold tabular-nums font-mono text-ink dark:text-zinc-50 mt-0.5 truncate">
            {formatDistance(physicalOdometerMiles)}
          </dd>
        </div>
        <div className="pl-2.5 min-w-0">
          <dt className="text-muted dark:text-zinc-400 font-sans truncate">Risk Status</dt>
          <dd className="font-semibold tabular-nums font-mono text-ink dark:text-zinc-50 mt-0.5 truncate">
            {isVehicleSelected ? `${criticalCount} Crit · ${warningCount} Due` : '—'}
          </dd>
        </div>
      </dl>

      {/* Diagnostic Verdict Callout */}
      {!isVehicleSelected ? (
        <div className="mb-5 p-3.5 rounded-xl bg-surface-subtle dark:bg-zinc-900/80 text-xs font-sans text-muted dark:text-zinc-300 leading-relaxed">
          Select a vehicle on the left to evaluate powertrain-specific wear horizons, failure probabilities, and 12-month service reserves.
        </div>
      ) : scheduleMode === 'oem' ? (
        <div className="mb-5 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 p-3.5 text-xs text-rose-900 dark:text-rose-200 leading-relaxed border border-rose-200/80 dark:border-rose-800/40 flex items-start gap-2">
          <AlertTriangle aria-hidden="true" className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong>OEM &quot;Lifetime&quot; Risk Alert:</strong> Dealership &quot;sealed for life&quot; guidelines are calibrated for the 60k-mi warranty period. Switching to <strong>Specialist Preventative</strong> restores score by <strong className="font-mono tabular-nums">+{oemScoreDeduction} points</strong>.
          </div>
        </div>
      ) : (
        <div className="mb-5 p-3.5 rounded-xl bg-surface-subtle dark:bg-zinc-900/80 text-xs font-sans text-body dark:text-zinc-300 leading-relaxed">
          {evaluatedComponents.some((c) => c.health.status === 'CRITICAL' && !c.isRecentlyServiced)
            ? 'High-priority assemblies have passed their preventative threshold and require timely servicing.'
            : evaluatedComponents.some((c) => c.health.status === 'WARNING' && !c.isRecentlyServiced)
            ? 'Wear items are approaching their preventative window based on your current odometer and driving profile.'
            : `All evaluated assemblies for ${activePreset.name} are operating within specialist preventative tolerances.`}
        </div>
      )}

      {/* Actions & Export */}
      <div className="pt-4 border-t border-border/80 dark:border-zinc-800 space-y-2.5">
        {/* Single Primary CTA */}
        <button
          type="button"
          disabled={!isVehicleSelected}
          onClick={() => {
            if (!isVehicleSelected) return;
            onSaveToGarage();
          }}
          className={`w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-sans text-xs sm:text-sm font-semibold transition-colors border ${
            !isVehicleSelected
              ? 'bg-surface-subtle dark:bg-zinc-900 text-muted dark:text-zinc-500 border-border dark:border-zinc-800 cursor-not-allowed'
              : isSavedInGarage
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40 cursor-pointer'
              : 'bg-[#183D22] text-white border-[#183D22] hover:bg-[#122E19] dark:bg-emerald-600 dark:border-emerald-500 dark:hover:bg-emerald-500 cursor-pointer'
          }`}
        >
          {isSavedInGarage ? (
            <>
              <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Saved ✓</span>
            </>
          ) : (
            <>
              <Car aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span>Save to My Garage</span>
            </>
          )}
        </button>

        {/* Secondary Compare Toggle */}
        <button
          type="button"
          onClick={onToggleComparator}
          className={`w-full min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 font-sans text-xs font-medium transition-colors border cursor-pointer ${
            showComparator
              ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500'
              : 'bg-surface-subtle dark:bg-zinc-900 text-ink dark:text-zinc-200 border-border/80 dark:border-zinc-800 hover:bg-canvas dark:hover:bg-zinc-800'
          }`}
        >
          <GitCompare aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
          <span>{showComparator ? 'Hide Comparison' : 'Compare Vehicles'}</span>
        </button>

        {/* Quiet Export & Share Trigger */}
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            data-testid="toggle-risk-export-menu"
            disabled={!isVehicleSelected}
            aria-expanded={showExportMenu}
            onClick={() => {
              if (!isVehicleSelected) return;
              setShowExportMenu((prev) => !prev);
            }}
            title={!isVehicleSelected ? 'Select a vehicle first to export or share' : undefined}
            className={`min-h-[44px] sm:min-h-[32px] inline-flex items-center gap-1 font-sans text-xs font-medium ${
              !isVehicleSelected
                ? 'text-faint dark:text-zinc-600 cursor-not-allowed'
                : 'text-primary-600 dark:text-emerald-400 hover:underline cursor-pointer'
            }`}
          >
            <Printer aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
            <span>{showExportMenu ? 'Hide Export & Share' : 'Export & Share (PDF / Reddit)'}</span>
            <ChevronDown
              aria-hidden="true"
              className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${showExportMenu ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Collapsible Export Drawer (mounted in DOM via sr-only when closed) */}
        <div
          className={
            showExportMenu && isVehicleSelected
              ? 'grid grid-cols-1 gap-1.5 pt-2 border-t border-border/70 dark:border-zinc-800 animate-fade-in'
              : 'sr-only'
          }
        >
          <button
            type="button"
            data-testid="open-forum-share-btn"
            disabled={!isVehicleSelected}
            onClick={() => {
              if (!isVehicleSelected) return;
              onOpenForumShare();
            }}
            className="min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 px-3 py-2 font-sans text-xs font-medium text-ink dark:text-zinc-200 border border-border/80 dark:border-zinc-800 hover:bg-canvas dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Share2 aria-hidden="true" className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Share for Reddit / Forums</span>
          </button>

          <button
            type="button"
            disabled={!isVehicleSelected}
            onClick={() => {
              if (!isVehicleSelected) return;
              onOpenNegotiationPdf();
            }}
            className="min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 px-3 py-2 font-sans text-xs font-medium text-ink dark:text-zinc-200 border border-border/80 dark:border-zinc-800 hover:bg-canvas dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileText aria-hidden="true" className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">Export Buyer&apos;s Inspection Sheet (PDF)</span>
          </button>

          <button
            type="button"
            disabled={!isVehicleSelected}
            onClick={() => {
              if (!isVehicleSelected) return;
              onOpenDossierPrint();
            }}
            className="min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 px-3 py-2 font-sans text-xs font-medium text-ink dark:text-zinc-200 border border-border/80 dark:border-zinc-800 hover:bg-canvas dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Printer aria-hidden="true" className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Export Dossier / Print</span>
          </button>
        </div>
      </div>
    </Card>
  );
}

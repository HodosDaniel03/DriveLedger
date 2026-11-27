import React from 'react';
import {
  Car,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  Zap,
  Printer,
  Share2,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { Card, InfoTooltip } from '../../common/OdometerPrimitives';
import { useUnits } from '../../../context/UnitContext';

export default function TcoVerdictCard({
  hasSelectedVehicle,
  activePreset,
  odometerMiles,
  horizonYears,
  tco,
  costPerLocalUnit,
  ownershipValueScore,
  ownershipVerdict,
  verifiedGarageCreditUsd,
  financeType,
  highlightedCategory,
  setHighlightedCategory,
  allocationColors,
  isSavedInGarage,
  onSaveToGarage,
  showComparator,
  onToggleComparator,
  showEvBreakEven,
  onToggleEvBreakEven,
  showExportMenu,
  setShowExportMenu,
  onOpenForumShare,
  onOpenNegotiationPdf,
  onOpenDossierPrint,
}) {
  const { currencySymbol, distanceUnit, formatCurrency, formatDistance } = useUnits();

  return (
    <Card className="h-fit p-5 sm:p-6" aria-labelledby="summary-heading">
      {/* Calm Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="summary-heading"
          className="font-sans text-xs font-semibold text-muted dark:text-zinc-400 scroll-mt-28 lg:scroll-mt-32"
        >
          Estimated Cost to Own
        </h2>
        <span className="rounded-md bg-surface-subtle dark:bg-zinc-900 text-body dark:text-zinc-300 border border-border/80 dark:border-zinc-800 px-2.5 py-0.5 text-[11px] font-sans font-medium shrink-0">
          {horizonYears}-Year Forecast
        </span>
      </div>

      {/* Headline Monthly Cost */}
      <div className="mt-3 mb-4 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap" aria-live="polite">
          <span
            id="monthly-total"
            className="text-metric-xl font-bold font-mono tabular-nums text-ink dark:text-zinc-50 tracking-tight leading-none"
          >
            {hasSelectedVehicle ? formatCurrency(tco.monthlyEconomicCostUsd) : `${currencySymbol}-`}
          </span>
          <span className="font-sans text-base text-muted dark:text-zinc-400 font-medium">/mo</span>
        </div>

        <p className="mt-1.5 truncate font-sans text-xs text-muted dark:text-zinc-400">
          {hasSelectedVehicle ? (
            <>
              {activePreset.name} · <span className="font-mono tabular-nums">{formatDistance(odometerMiles)}</span>
            </>
          ) : (
            'Select a vehicle on the left to compute your live forecast'
          )}
        </p>

        {hasSelectedVehicle && verifiedGarageCreditUsd > 0 && (
          <div
            data-testid="garage-service-credit-badge"
            className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40 text-[11px] font-sans font-medium max-w-full"
          >
            <CheckCircle2 aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              Garage service credit: -<span className="font-mono tabular-nums">{formatCurrency(verifiedGarageCreditUsd)}</span>
            </span>
          </div>
        )}

        {hasSelectedVehicle && tco.hasUnderwaterEquity && financeType === 'loan' && (
          <div
            data-testid="summary-underwater-alert"
            className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50/80 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40 text-[11px] font-sans font-medium max-w-full"
          >
            <AlertTriangle aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              Peak negative equity: <span className="font-mono font-bold tabular-nums">{formatCurrency(tco.maxUnderwaterEquityUsd || 0)}</span>
            </span>
          </div>
        )}
      </div>

      {/* Hairline 2-Metric Strip (No Nested Bordered Boxes) */}
      <div className="grid grid-cols-2 divide-x divide-border/80 dark:divide-zinc-800 py-3.5 border-y border-border/80 dark:border-zinc-800 mb-4">
        <div className="pr-3 min-w-0">
          <span className="block font-sans text-[11px] text-muted dark:text-zinc-400 truncate">
            {horizonYears}-year total
          </span>
          <span className="mt-0.5 block font-mono tabular-nums text-base sm:text-lg font-bold text-ink dark:text-zinc-50 truncate">
            {hasSelectedVehicle ? formatCurrency(tco.totalEconomicCostUsd) : `${currencySymbol}-`}
          </span>
        </div>
        <div className="pl-3 min-w-0">
          <span className="block font-sans text-[11px] text-muted dark:text-zinc-400 truncate">
            Cost per {distanceUnit}
          </span>
          <span className="mt-0.5 block font-mono tabular-nums text-base sm:text-lg font-bold text-ink dark:text-zinc-50 truncate">
            {hasSelectedVehicle ? formatCurrency(costPerLocalUnit, 2) : `${currencySymbol}-`}
          </span>
        </div>
      </div>

      {/* Ownership Value Score Tint Block */}
      <div className="mb-5 p-3.5 rounded-xl bg-surface-subtle dark:bg-zinc-900/80">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="font-sans text-xs font-semibold text-ink dark:text-zinc-200 inline-flex items-center gap-1 min-w-0">
            <span className="truncate">Ownership Value Score</span>
            <InfoTooltip
              label="What is Ownership Value Score?"
              content="A 0–100 composite score weighing 5-year depreciation retention, fuel efficiency, and projected maintenance burden against segment peers."
            />
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono tabular-nums text-xs font-bold text-ink dark:text-zinc-50">
              {hasSelectedVehicle ? `${ownershipValueScore}/100` : '-/100'}
            </span>
            <span
              data-testid="ownership-value-verdict-badge"
              className={`rounded-md border px-2 py-0.5 text-[11px] font-sans font-semibold ${
                hasSelectedVehicle
                  ? ownershipVerdict.badgeClass
                  : 'bg-surface dark:bg-zinc-800 text-muted dark:text-zinc-400 border-border dark:border-zinc-700'
              }`}
            >
              {hasSelectedVehicle ? ownershipVerdict.text : 'Select a Vehicle'}
            </span>
          </div>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border dark:bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              hasSelectedVehicle ? ownershipVerdict.barClass : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
            style={{ width: hasSelectedVehicle ? `${ownershipValueScore}%` : '0%' }}
          />
        </div>
      </div>

      {/* Stacked Expense Allocation Bar */}
      <div className="flex flex-col gap-1.5 mb-3 scroll-mt-28 lg:scroll-mt-32" id="cost-breakdown-heading">
        <div className="flex justify-between items-center font-sans text-xs text-muted dark:text-zinc-400 font-medium">
          <span className="inline-flex items-center gap-1">
            <span>Expense allocation</span>
            <InfoTooltip
              label="About Expense Allocation"
              content="Hover over any color segment or category row to highlight how depreciation, fuel, maintenance, insurance, and financing split your monthly cost."
            />
          </span>
          <span className="font-mono tabular-nums text-[11px]">{hasSelectedVehicle ? '100%' : '0%'}</span>
        </div>
        <div
          className="h-2.5 rounded-full overflow-hidden flex bg-surface-subtle dark:bg-zinc-900 gap-0.5"
          aria-hidden="true"
          onMouseLeave={() => setHighlightedCategory(null)}
        >
          {hasSelectedVehicle &&
            tco.breakdown
              .filter((c) => c.amountUsd > 0)
              .map((c) => {
                const segmentColor = allocationColors[c.id] || c.color;
                const isDimmed = highlightedCategory !== null && highlightedCategory !== c.id;
                return (
                  <div
                    key={c.id}
                    onMouseEnter={() => setHighlightedCategory(c.id)}
                    className={`h-full transition-[flex-grow,opacity] duration-200 ease-out first:rounded-l-full last:rounded-r-full cursor-pointer ${
                      isDimmed ? 'opacity-25' : 'opacity-100'
                    }`}
                    style={{
                      flexGrow: c.amountUsd,
                      flexBasis: 0,
                      backgroundColor: segmentColor,
                    }}
                    title={`${c.label}: ${Math.round(c.sharePct)}%`}
                  />
                );
              })}
        </div>
      </div>

      {/* Hairline Breakdown Rows */}
      <div
        className="divide-y divide-border/60 dark:divide-zinc-800/80 text-xs"
        onMouseLeave={() => setHighlightedCategory(null)}
      >
        {tco.breakdown.map((c) => {
          const segmentColor = allocationColors[c.id] || c.color;
          const isDimmed = hasSelectedVehicle && highlightedCategory !== null && highlightedCategory !== c.id;
          const isHighlighted = hasSelectedVehicle && highlightedCategory === c.id;
          return (
            <div
              key={c.id}
              onMouseEnter={() => hasSelectedVehicle && setHighlightedCategory(c.id)}
              className={`flex items-center justify-between py-2 transition-opacity duration-150 ${
                hasSelectedVehicle ? 'cursor-pointer' : ''
              } ${isDimmed ? 'opacity-30' : 'opacity-100'} ${isHighlighted ? 'font-semibold' : ''}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: segmentColor }}
                />
                <span className="font-sans text-xs sm:text-sm text-body dark:text-zinc-200 truncate">
                  {c.label}
                </span>
              </div>
              <span className="font-mono text-xs font-medium text-ink dark:text-zinc-100 tabular-nums shrink-0 ml-2">
                {hasSelectedVehicle ? (
                  <>
                    {formatCurrency(Math.round(c.amountUsd / (horizonYears * 12)))}/mo{' '}
                    <span className="text-muted dark:text-zinc-400">({Math.round(c.sharePct)}%)</span>
                  </>
                ) : (
                  <span className="text-muted dark:text-zinc-500">-</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Actions & Comparison */}
      <div className="mt-5 pt-4 border-t border-border/80 dark:border-zinc-800 space-y-2.5">
        {/* Single Primary CTA inside Summary Card */}
        <button
          type="button"
          disabled={!hasSelectedVehicle}
          onClick={onSaveToGarage}
          className={`w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-sans text-xs sm:text-sm font-semibold transition-colors border ${
            !hasSelectedVehicle
              ? 'bg-surface-subtle dark:bg-zinc-900 text-muted dark:text-zinc-500 border-border dark:border-zinc-800 cursor-not-allowed'
              : isSavedInGarage
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
              : 'bg-[#183D22] text-white border-[#183D22] hover:bg-[#122E19] dark:bg-emerald-600 dark:border-emerald-500 dark:hover:bg-emerald-500 cursor-pointer'
          }`}
        >
          {isSavedInGarage ? (
            <>
              <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Saved to Garage</span>
            </>
          ) : (
            <>
              <Car aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span>Save to My Garage</span>
            </>
          )}
        </button>

        {/* Secondary Tool Toggles */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onToggleComparator}
            className={`min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 font-sans text-xs font-medium transition-colors border cursor-pointer ${
              showComparator
                ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500'
                : 'bg-surface-subtle dark:bg-zinc-900 text-ink dark:text-zinc-200 border-border/80 dark:border-zinc-800 hover:bg-canvas dark:hover:bg-zinc-800'
            }`}
          >
            <GitCompare aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{showComparator ? 'Hide Comparison' : 'Side-by-Side Comparison'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleEvBreakEven}
            className={`min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 font-sans text-xs font-medium transition-colors border cursor-pointer ${
              showEvBreakEven
                ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500'
                : 'bg-surface-subtle dark:bg-zinc-900 text-ink dark:text-zinc-200 border-border/80 dark:border-zinc-800 hover:bg-canvas dark:hover:bg-zinc-800'
            }`}
          >
            <Zap aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{showEvBreakEven ? 'Hide EV Break-Even' : 'Fuel vs. EV Break-Even'}</span>
          </button>
        </div>

        {/* Quiet Export & Share Trigger */}
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            data-testid="toggle-tco-export-menu"
            disabled={!hasSelectedVehicle}
            aria-expanded={showExportMenu}
            onClick={() => hasSelectedVehicle && setShowExportMenu((prev) => !prev)}
            title={!hasSelectedVehicle ? 'Select a vehicle first to export or share' : undefined}
            className={`min-h-[44px] sm:min-h-[32px] inline-flex items-center gap-1 font-sans text-xs font-medium ${
              !hasSelectedVehicle
                ? 'text-faint dark:text-zinc-600 cursor-not-allowed'
                : 'text-primary-600 dark:text-emerald-400 hover:underline cursor-pointer'
            }`}
          >
            <Printer aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
            <span>{showExportMenu ? 'Hide export options' : 'Export & share (PDF / Reddit)'}</span>
            <ChevronDown
              aria-hidden="true"
              className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${showExportMenu ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Collapsible Export Drawer (mounted in DOM via sr-only when closed) */}
        <div
          className={
            showExportMenu && hasSelectedVehicle
              ? 'grid grid-cols-1 gap-1.5 pt-2 border-t border-border/70 dark:border-zinc-800 animate-fade-in'
              : 'sr-only'
          }
        >
          <button
            type="button"
            data-testid="open-forum-share-btn"
            disabled={!hasSelectedVehicle}
            onClick={() => hasSelectedVehicle && onOpenForumShare()}
            className="min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 px-3 py-2 font-sans text-xs font-medium text-ink dark:text-zinc-200 border border-border/80 dark:border-zinc-800 hover:bg-canvas dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 aria-hidden="true" className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Share for Reddit / Forums</span>
          </button>

          <button
            type="button"
            disabled={!hasSelectedVehicle}
            onClick={() => hasSelectedVehicle && onOpenNegotiationPdf()}
            className="min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 px-3 py-2 font-sans text-xs font-medium text-ink dark:text-zinc-200 border border-border/80 dark:border-zinc-800 hover:bg-canvas dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText aria-hidden="true" className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">Export Buyer&apos;s Inspection Sheet (PDF)</span>
          </button>

          <button
            type="button"
            disabled={!hasSelectedVehicle}
            onClick={() => hasSelectedVehicle && onOpenDossierPrint()}
            className="min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 px-3 py-2 font-sans text-xs font-medium text-ink dark:text-zinc-200 border border-border/80 dark:border-zinc-800 hover:bg-canvas dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer aria-hidden="true" className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Export Dossier / Print</span>
          </button>
        </div>
      </div>
    </Card>
  );
}

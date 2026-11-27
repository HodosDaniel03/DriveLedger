import React, { useState, useEffect, useMemo } from 'react';
import { Scale, ChevronDown, ArrowRight, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useUnits } from '../../context/UnitContext';
import { Card, RiskBadge } from '../common/OdometerPrimitives';
import {
  evaluateFixOrSellDecision,
  estimateMileageAdjustedMarketValue,
} from '../../data/fixOrSellEngine';

export default function FixOrSellCalculator({
  vehicle,
  initialRepairQuoteUsd = 1850,
  initialOdometerMiles,
  sourceLabel = 'Repair Estimate',
  onClose,
  onNavigateToCompare,
}) {
  const {
    currencySymbol,
    distanceUnit,
    formatCurrency,
    formatDistance,
    convertUsdToRegion,
    convertRegionToUsd,
    convertMilesToRegion,
    convertRegionToMiles,
  } = useUnits();

  const resolvedStartOdo = Math.max(
    0,
    Number(initialOdometerMiles ?? vehicle?.defaultOdometerMiles ?? 95000) || 95000
  );

  const [odometerMiles, setOdometerMiles] = useState(resolvedStartOdo);
  const [repairQuoteUsd, setRepairQuoteUsd] = useState(() =>
    Math.max(150, Math.round(Number(initialRepairQuoteUsd) || 1850))
  );
  const [marketValueUsd, setMarketValueUsd] = useState(() =>
    estimateMileageAdjustedMarketValue(vehicle, resolvedStartOdo)
  );
  const [customOpen, setCustomOpen] = useState(false);
  const [replacementBudgetUsd, setReplacementBudgetUsd] = useState(28500);
  const [customBrokenValUsd, setCustomBrokenValUsd] = useState(null);

  useEffect(() => {
    const nextOdo = Math.max(
      0,
      Number(initialOdometerMiles ?? vehicle?.defaultOdometerMiles ?? 95000) || 95000
    );
    setOdometerMiles(nextOdo);
    setMarketValueUsd(estimateMileageAdjustedMarketValue(vehicle, nextOdo));
    setCustomBrokenValUsd(null);
  }, [vehicle?.id, initialOdometerMiles]);

  useEffect(() => {
    if (Number(initialRepairQuoteUsd) > 0) {
      setRepairQuoteUsd(Math.max(100, Math.round(Number(initialRepairQuoteUsd))));
    }
  }, [initialRepairQuoteUsd]);

  const decision = useMemo(
    () =>
      evaluateFixOrSellDecision({
        vehicle,
        repairQuoteUsd,
        currentMarketValueUsd: marketValueUsd,
        brokenAsIsValueUsd: customBrokenValUsd,
        odometerMiles,
        replacementVehiclePriceUsd: replacementBudgetUsd,
      }),
    [vehicle, repairQuoteUsd, marketValueUsd, customBrokenValUsd, odometerMiles, replacementBudgetUsd]
  );

  const displayRepair = Math.round(convertUsdToRegion(repairQuoteUsd));
  const displayMarket = Math.round(convertUsdToRegion(marketValueUsd));
  const displayOdo = Math.round(convertMilesToRegion(odometerMiles));
  const displayBroken = Math.round(convertUsdToRegion(decision.resolvedBrokenValueUsd));
  const displayReplacement = Math.round(convertUsdToRegion(replacementBudgetUsd));

  const maxRepairSlider = Math.max(8000, Math.round(convertUsdToRegion(12000)));
  const maxMarketSlider = Math.max(40000, Math.round(convertUsdToRegion(65000)));
  const maxOdoSlider = Math.round(convertMilesToRegion(250000));

  return (
    <Card
      id="fix-or-sell-calculator"
      data-testid="fix-or-sell-calculator"
      className="p-5 sm:p-6 space-y-6 print:hidden"
      aria-labelledby="fix-or-sell-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/80 dark:border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-xl bg-surface-subtle dark:bg-emerald-950/50 p-2.5 text-[#183D22] dark:text-emerald-400 shrink-0">
            <Scale aria-hidden="true" className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3
              id="fix-or-sell-heading"
              className="font-sans text-h3 font-bold tracking-tight text-ink dark:text-zinc-50"
            >
              Should I Fix It or Sell It?
            </h3>
            <p className="font-sans text-xs sm:text-sm text-muted dark:text-zinc-400 mt-0.5">
              Compare your {sourceLabel.toLowerCase()} against vehicle equity, cascading wear, and replacement costs.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Fix or Sell calculator"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-muted hover:bg-surface-subtle hover:text-ink dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left (58%): 3 Primary Controls + Native <details> Secondary Drawer */}
        <div className="lg:col-span-7 space-y-5 min-w-0">
          {/* Primary 1: Repair Quote */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <label
                htmlFor="fix-sell-repair-input"
                className="font-sans text-xs sm:text-sm font-medium text-body dark:text-zinc-300"
              >
                Workshop repair quote
              </label>
              <div className="inline-flex min-h-[38px] items-center gap-1 font-mono font-semibold text-base sm:text-sm text-ink dark:text-zinc-50 tabular-nums bg-surface-subtle dark:bg-zinc-900 px-2.5 py-1 rounded-lg border border-border dark:border-zinc-800 focus-within:border-[#183D22] dark:focus-within:border-emerald-500">
                <span className="text-muted dark:text-zinc-400">{currencySymbol}</span>
                <input
                  id="fix-sell-repair-input"
                  type="number"
                  min={0}
                  max={50000}
                  step={50}
                  value={displayRepair}
                  onChange={(e) =>
                    setRepairQuoteUsd(convertRegionToUsd(Math.max(0, Number(e.target.value) || 0)))
                  }
                  className="w-24 sm:w-20 text-right text-base sm:text-sm bg-transparent outline-none font-mono tabular-nums"
                />
              </div>
            </div>
            <input
              type="range"
              aria-label="Workshop repair quote slider"
              min={100}
              max={maxRepairSlider}
              step={50}
              value={Math.min(maxRepairSlider, Math.max(100, displayRepair))}
              onChange={(e) => setRepairQuoteUsd(convertRegionToUsd(Number(e.target.value)))}
              className="odo-range telemetry-slider"
              style={{
                '--fill': `${((Math.min(maxRepairSlider, Math.max(100, displayRepair)) - 100) / (maxRepairSlider - 100)) * 100}%`,
              }}
            />
          </div>

          {/* Primary 2: Repaired Running Market Value */}
          <div className="pt-4 border-t border-border/60 dark:border-zinc-800/80">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <label
                htmlFor="fix-sell-market-input"
                className="font-sans text-xs sm:text-sm font-medium text-body dark:text-zinc-300"
              >
                Repaired running market value
              </label>
              <div className="inline-flex min-h-[38px] items-center gap-1 font-mono font-semibold text-base sm:text-sm text-ink dark:text-zinc-50 tabular-nums bg-surface-subtle dark:bg-zinc-900 px-2.5 py-1 rounded-lg border border-border dark:border-zinc-800 focus-within:border-[#183D22] dark:focus-within:border-emerald-500">
                <span className="text-muted dark:text-zinc-400">{currencySymbol}</span>
                <input
                  id="fix-sell-market-input"
                  type="number"
                  min={500}
                  max={150000}
                  step={250}
                  value={displayMarket}
                  onChange={(e) =>
                    setMarketValueUsd(convertRegionToUsd(Math.max(500, Number(e.target.value) || 500)))
                  }
                  className="w-24 sm:w-20 text-right text-base sm:text-sm bg-transparent outline-none font-mono tabular-nums"
                />
              </div>
            </div>
            <input
              type="range"
              aria-label="Repaired running market value slider"
              min={1500}
              max={maxMarketSlider}
              step={250}
              value={Math.min(maxMarketSlider, Math.max(1500, displayMarket))}
              onChange={(e) => setMarketValueUsd(convertRegionToUsd(Number(e.target.value)))}
              className="odo-range telemetry-slider"
              style={{
                '--fill': `${((Math.min(maxMarketSlider, Math.max(1500, displayMarket)) - 1500) / (maxMarketSlider - 1500)) * 100}%`,
              }}
            />
          </div>

          {/* Primary 3: Current Odometer */}
          <div className="pt-4 border-t border-border/60 dark:border-zinc-800/80">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <label
                htmlFor="fix-sell-odo-input"
                className="font-sans text-xs sm:text-sm font-medium text-body dark:text-zinc-300"
              >
                Current odometer
              </label>
              <div className="inline-flex min-h-[38px] items-center gap-1.5 font-mono font-semibold text-base sm:text-sm text-ink dark:text-zinc-50 tabular-nums bg-surface-subtle dark:bg-zinc-900 px-2.5 py-1 rounded-lg border border-border dark:border-zinc-800 focus-within:border-[#183D22] dark:focus-within:border-emerald-500">
                <input
                  id="fix-sell-odo-input"
                  type="number"
                  min={0}
                  max={500000}
                  step={2500}
                  value={displayOdo}
                  onChange={(e) => {
                    const nextMiles = convertRegionToMiles(Math.max(0, Number(e.target.value) || 0));
                    setOdometerMiles(nextMiles);
                    setMarketValueUsd(estimateMileageAdjustedMarketValue(vehicle, nextMiles));
                  }}
                  className="w-24 sm:w-20 text-right text-base sm:text-sm bg-transparent outline-none font-mono tabular-nums"
                />
                <span className="font-sans text-xs text-muted dark:text-zinc-400">{distanceUnit}</span>
              </div>
            </div>
            <input
              type="range"
              aria-label="Current odometer slider"
              min={10000}
              max={maxOdoSlider}
              step={2500}
              value={Math.min(maxOdoSlider, Math.max(10000, displayOdo))}
              onChange={(e) => {
                const nextMiles = convertRegionToMiles(Number(e.target.value));
                setOdometerMiles(nextMiles);
                setMarketValueUsd(estimateMileageAdjustedMarketValue(vehicle, nextMiles));
              }}
              className="odo-range telemetry-slider"
              style={{
                '--fill': `${((Math.min(maxOdoSlider, Math.max(10000, displayOdo)) - 10000) / (maxOdoSlider - 10000)) * 100}%`,
              }}
            />
          </div>

          {/* Progressive Disclosure: Native <details> Secondary Assumptions */}
          <details
            className="dl-disclosure group border-t border-border/80 dark:border-zinc-800 pt-1"
            open={customOpen}
            onToggle={(e) => setCustomOpen(Boolean(e.currentTarget?.open))}
          >
            <summary className="min-h-[48px] py-3 flex items-center justify-between gap-3 text-left font-sans text-xs sm:text-sm font-semibold text-ink dark:text-zinc-100 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors">
              <span>Fine-tune assumptions (as-is value &amp; replacement budget)</span>
              <ChevronDown
                aria-hidden="true"
                className="w-4 h-4 shrink-0 text-muted dark:text-zinc-400 transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 pb-2">
              <div>
                <label
                  htmlFor="fix-sell-broken-input"
                  className="font-sans text-xs font-medium text-body dark:text-zinc-300 block mb-1.5"
                >
                  As-is broken sale value ({currencySymbol})
                </label>
                <input
                  id="fix-sell-broken-input"
                  type="number"
                  min={0}
                  step={200}
                  value={displayBroken}
                  onChange={(e) =>
                    setCustomBrokenValUsd(convertRegionToUsd(Math.max(0, Number(e.target.value) || 0)))
                  }
                  className="w-full min-h-[44px] rounded-xl border border-border dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900 px-3 text-base sm:text-sm font-mono font-semibold tabular-nums text-ink dark:text-zinc-100 outline-none focus:border-[#183D22] dark:focus:border-emerald-500"
                />
              </div>
              <div>
                <label
                  htmlFor="fix-sell-replace-input"
                  className="font-sans text-xs font-medium text-body dark:text-zinc-300 block mb-1.5"
                >
                  Replacement car budget ({currencySymbol})
                </label>
                <input
                  id="fix-sell-replace-input"
                  type="number"
                  min={3000}
                  step={500}
                  value={displayReplacement}
                  onChange={(e) =>
                    setReplacementBudgetUsd(convertRegionToUsd(Math.max(3000, Number(e.target.value) || 3000)))
                  }
                  className="w-full min-h-[44px] rounded-xl border border-border dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900 px-3 text-base sm:text-sm font-mono font-semibold tabular-nums text-ink dark:text-zinc-100 outline-none focus:border-[#183D22] dark:focus:border-emerald-500"
                />
              </div>
            </div>
          </details>
        </div>

        {/* Right (42%): Sticky Calm Verdict Surface (Hairline Dividers, Zero Nested Border Boxes) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 lg:[top:5.25rem] rounded-2xl bg-surface-subtle dark:bg-zinc-900/80 p-5 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-sans text-xs font-semibold text-muted dark:text-zinc-400">
              Economic verdict
            </span>
            <RiskBadge level={decision.tone} label={decision.badgeLabel} />
          </div>

          <h4
            data-testid="fix-or-sell-verdict-headline"
            className="font-sans text-lg sm:text-xl font-bold tracking-tight text-ink dark:text-zinc-50"
          >
            {decision.headline}
          </h4>

          {/* Repair-to-Value Ratio Bar */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
              <span className="font-sans font-medium text-muted dark:text-zinc-400">
                Repair-to-Value Ratio (RVR)
              </span>
              <span className="font-mono font-bold tabular-nums text-ink dark:text-zinc-100">
                {decision.rvrPct}% ({formatCurrency(decision.repairQuoteUsd)} / {formatCurrency(decision.resolvedMarketValueUsd)})
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-border dark:bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  decision.tone === 'low'
                    ? 'bg-score-good'
                    : decision.tone === 'moderate'
                    ? 'bg-score-fair'
                    : 'bg-score-poor'
                }`}
                style={{ width: `${Math.min(100, Math.max(3, decision.rvrPct))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-sans text-faint dark:text-zinc-500">
              <span><span className="font-mono tabular-nums">0%</span> Keep</span>
              <span><span className="font-mono tabular-nums">35%</span> Caution</span>
              <span><span className="font-mono tabular-nums">60%+</span> Sell</span>
            </div>
          </div>

          {/* Hairline-Divided 3 Financial Pillars */}
          <div className="grid grid-cols-3 divide-x divide-border/80 dark:divide-zinc-800 py-3.5 border-y border-border/80 dark:border-zinc-800">
            <div className="pr-2 min-w-0">
              <span className="block text-[11px] font-sans text-muted dark:text-zinc-400 truncate">
                Net equity
              </span>
              <span className="mt-0.5 block text-sm sm:text-base font-bold font-mono tabular-nums text-ink dark:text-zinc-50 truncate">
                {decision.netEquityGainUsd >= 0 ? '+' : ''}
                {formatCurrency(decision.netEquityGainUsd)}
              </span>
            </div>
            <div className="px-2 min-w-0">
              <span className="block text-[11px] font-sans text-muted dark:text-zinc-400 truncate">
                Yr-1 switch hit
              </span>
              <span className="mt-0.5 block text-sm sm:text-base font-bold font-mono tabular-nums text-ink dark:text-zinc-50 truncate">
                {formatCurrency(decision.annualReplacementSunkCostUsd)}/yr
              </span>
            </div>
            <div className="pl-2 min-w-0">
              <span className="block text-[11px] font-sans text-muted dark:text-zinc-400 truncate">
                +{distanceUnit === 'km' ? '24k km' : '15k mi'} risk
              </span>
              <span className="mt-0.5 block text-sm sm:text-base font-bold font-mono tabular-nums text-ink dark:text-zinc-50 truncate">
                {formatCurrency(decision.cascadingExposureUsd)}
              </span>
            </div>
          </div>

          {/* 3-Bullet Action Summary */}
          <ul className="space-y-1.5 font-sans text-xs text-body dark:text-zinc-300">
            {decision.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 leading-relaxed">
                {decision.tone === 'critical' ? (
                  <AlertTriangle aria-hidden="true" className="w-3.5 h-3.5 text-score-poor shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 aria-hidden="true" className="w-3.5 h-3.5 text-score-good shrink-0 mt-0.5" />
                )}
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {onNavigateToCompare && (
            <div className="pt-3 border-t border-border/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-muted dark:text-zinc-400 font-sans">
                {vehicle?.shortName || vehicle?.name || 'Generic Vehicle'} ·{' '}
                <span className="font-mono tabular-nums">{formatDistance(odometerMiles)}</span>
              </span>
              <button
                type="button"
                onClick={() => onNavigateToCompare(vehicle?.id)}
                className="min-h-[44px] sm:min-h-[32px] inline-flex items-center gap-1 font-sans text-xs font-semibold text-[#183D22] dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <span>Compare Replacement Cars</span>
                <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

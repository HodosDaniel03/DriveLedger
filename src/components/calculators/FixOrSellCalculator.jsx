import React, { useState, useEffect, useMemo } from 'react';
import { Wrench, Scale, ChevronDown, ArrowRight, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useUnits } from '../../context/UnitContext';
import { Card, RiskBadge, Collapse } from '../common/OdometerPrimitives';
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
      className="rounded-2xl border border-border dark:border-zinc-800 bg-surface dark:bg-[#121215] shadow-card p-5 sm:p-6 space-y-5 print:hidden"
      aria-labelledby="fix-or-sell-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary-50 dark:bg-primary-950/60 p-2.5 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 id="fix-or-sell-heading" className="font-sans text-base sm:text-lg font-bold tracking-tight text-ink dark:text-zinc-100">
                Should I Fix It or Sell It?
              </h3>
              <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300">
                4-Factor Economic Verdict
              </span>
            </div>
            <p className="font-sans font-medium text-xs text-muted dark:text-zinc-400 mt-0.5">
              Compare your {sourceLabel.toLowerCase()} against vehicle equity, cascading wear, and replacement costs.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Fix or Sell calculator"
            className="rounded-lg p-1.5 text-muted hover:bg-surface-subtle hover:text-ink dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 3 Core Inputs + Progressive Disclosure */}
        <div className="lg:col-span-6 space-y-4">
          {/* Core 1: Repair Quote */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <label htmlFor="fix-sell-repair-input" className="font-sans text-xs font-semibold text-body dark:text-zinc-300">
                Workshop repair quote
              </label>
              <div className="flex items-center gap-1 font-mono font-bold text-sm text-ink dark:text-zinc-100 tabular-nums bg-canvas dark:bg-zinc-800 px-2.5 py-0.5 rounded-md border border-border dark:border-zinc-700">
                <span>{currencySymbol}</span>
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
                  className="w-20 text-right bg-transparent outline-none font-mono"
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

          {/* Core 2: Running Market Value */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <label htmlFor="fix-sell-market-input" className="font-sans text-xs font-semibold text-body dark:text-zinc-300">
                Repaired running market value
              </label>
              <div className="flex items-center gap-1 font-mono font-bold text-sm text-ink dark:text-zinc-100 tabular-nums bg-canvas dark:bg-zinc-800 px-2.5 py-0.5 rounded-md border border-border dark:border-zinc-700">
                <span>{currencySymbol}</span>
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
                  className="w-20 text-right bg-transparent outline-none font-mono"
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

          {/* Core 3: Current Odometer */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <label htmlFor="fix-sell-odo-input" className="font-sans text-xs font-semibold text-body dark:text-zinc-300">
                Current odometer
              </label>
              <div className="flex items-center gap-1 font-mono font-bold text-sm text-ink dark:text-zinc-100 tabular-nums bg-canvas dark:bg-zinc-800 px-2.5 py-0.5 rounded-md border border-border dark:border-zinc-700">
                <input
                  id="fix-sell-odo-input"
                  type="number"
                  min={0}
                  max={500000}
                  step={2500}
                  value={displayOdo}
                  onChange={(e) =>
                    setOdometerMiles(convertRegionToMiles(Math.max(0, Number(e.target.value) || 0)))
                  }
                  className="w-20 text-right bg-transparent outline-none font-mono"
                />
                <span className="font-sans text-xs text-muted">{distanceUnit}</span>
              </div>
            </div>
            <input
              type="range"
              aria-label="Current odometer slider"
              min={10000}
              max={maxOdoSlider}
              step={2500}
              value={Math.min(maxOdoSlider, Math.max(10000, displayOdo))}
              onChange={(e) => setOdometerMiles(convertRegionToMiles(Number(e.target.value)))}
              className="odo-range telemetry-slider"
              style={{
                '--fill': `${((Math.min(maxOdoSlider, Math.max(10000, displayOdo)) - 10000) / (maxOdoSlider - 10000)) * 100}%`,
              }}
            />
          </div>

          {/* Progressive Disclosure: Secondary Assumptions */}
          <div className="pt-2 border-t border-border/60 dark:border-zinc-800">
            <button
              type="button"
              aria-expanded={customOpen}
              onClick={() => setCustomOpen((o) => !o)}
              className="flex w-full items-center justify-between font-sans text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline py-1"
            >
              <span>Customize assumptions (as-is broken value &amp; replacement budget)</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${customOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <Collapse open={customOpen}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                <div>
                  <label htmlFor="fix-sell-broken-input" className="font-sans text-[11px] font-medium text-muted block mb-1">
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
                    className="w-full h-9 rounded-xl border border-border dark:border-zinc-700 bg-canvas dark:bg-zinc-800 px-3 text-xs font-mono font-semibold tabular-nums text-ink dark:text-zinc-100 outline-none focus:border-primary-600"
                  />
                </div>
                <div>
                  <label htmlFor="fix-sell-replace-input" className="font-sans text-[11px] font-medium text-muted block mb-1">
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
                    className="w-full h-9 rounded-xl border border-border dark:border-zinc-700 bg-canvas dark:bg-zinc-800 px-3 text-xs font-mono font-semibold tabular-nums text-ink dark:text-zinc-100 outline-none focus:border-primary-600"
                  />
                </div>
              </div>
            </Collapse>
          </div>
        </div>

        {/* Right: Live Decision Verdict Card */}
        <div className="lg:col-span-6 rounded-2xl border border-border dark:border-zinc-800 bg-canvas dark:bg-zinc-950/70 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-sans uppercase tracking-wider font-bold text-muted dark:text-zinc-400">
              Algorithmic Recommendation
            </span>
            <RiskBadge level={decision.tone} label={decision.badgeLabel} />
          </div>

          <div>
            <h4
              data-testid="fix-or-sell-verdict-headline"
              className="font-sans text-lg sm:text-xl font-bold tracking-tight text-ink dark:text-zinc-100"
            >
              {decision.headline}
            </h4>
          </div>

          {/* Repair-to-Value Ratio Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-sans font-medium text-muted dark:text-zinc-400">Repair-to-Value Ratio (RVR)</span>
              <span className="font-mono font-bold tabular-nums text-ink dark:text-zinc-100">
                {decision.rvrPct}% ({formatCurrency(decision.repairQuoteUsd)} / {formatCurrency(decision.resolvedMarketValueUsd)})
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-border dark:bg-zinc-800 overflow-hidden relative">
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
            <div className="flex justify-between text-[10px] font-sans font-medium text-faint">
              <span><span className="font-mono tabular-nums">0%</span> (Keep)</span>
              <span><span className="font-mono tabular-nums">35%</span> (Caution)</span>
              <span><span className="font-mono tabular-nums">60%+</span> (Sell As-Is)</span>
            </div>
          </div>

          {/* 3 Financial Pillars Grid */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="rounded-xl bg-surface dark:bg-[#121215] p-2.5 border border-border/70 dark:border-zinc-800">
              <span className="block text-[10px] font-sans font-medium uppercase text-muted">Net Equity</span>
              <span className="mt-0.5 block text-xs sm:text-sm font-bold font-mono tabular-nums text-ink dark:text-zinc-100">
                {decision.netEquityGainUsd >= 0 ? '+' : ''}
                {formatCurrency(decision.netEquityGainUsd)}
              </span>
            </div>
            <div className="rounded-xl bg-surface dark:bg-[#121215] p-2.5 border border-border/70 dark:border-zinc-800">
              <span className="block text-[10px] font-sans font-medium uppercase text-muted">Yr-1 New Car Hit</span>
              <span className="mt-0.5 block text-xs sm:text-sm font-bold font-mono tabular-nums text-ink dark:text-zinc-100">
                {formatCurrency(decision.annualReplacementSunkCostUsd)}/yr
              </span>
            </div>
            <div className="rounded-xl bg-surface dark:bg-[#121215] p-2.5 border border-border/70 dark:border-zinc-800">
              <span className="block text-[10px] font-sans font-medium uppercase text-muted">+15k Wear Risk</span>
              <span className="mt-0.5 block text-xs sm:text-sm font-bold font-mono tabular-nums text-ink dark:text-zinc-100">
                {formatCurrency(decision.cascadingExposureUsd)}
              </span>
            </div>
          </div>

          {/* Concise 3-Bullet Action Summary */}
          <ul className="space-y-1.5 font-sans text-xs text-body dark:text-zinc-300 pt-1">
            {decision.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                {decision.tone === 'critical' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-score-poor shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-score-good shrink-0 mt-0.5" />
                )}
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {onNavigateToCompare && (
            <div className="pt-2 border-t border-border/60 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-muted font-sans font-medium">
                {vehicle?.shortName || vehicle?.name || 'Active Vehicle'} · <span className="font-mono tabular-nums">{formatDistance(odometerMiles)}</span>
              </span>
              <button
                type="button"
                onClick={onNavigateToCompare}
                className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                <span>Compare Replacement Cars</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { Zap, X, ChevronDown } from 'lucide-react';
import { useUnits } from '../../context/UnitContext';
import { Card } from '../common/OdometerPrimitives';

export default function EvBreakEvenCalculator({
  initialIcePrice = 30000,
  initialEvPrice = 36000,
  annualDistanceMiles = 12000,
  activePreset,
  horizonYears = 5,
  onClose,
}) {
  const {
    region,
    currencySymbol,
    distanceUnit,
    efficiencyUnit,
    evEfficiencyUnit,
    convertMilesToRegion,
    convertUsdToRegion,
  } = useUnits();

  const resolveRegionalIceConsumption = (reg, preset) => {
    const baseMpg = !preset?.isEv && Number(preset?.mpgUs) > 0 ? Number(preset.mpgUs) : 30.0;
    if (reg === 'EU') return +(235.214583 / baseMpg).toFixed(1);
    if (reg === 'UK') return +(baseMpg * 1.20095).toFixed(1);
    return +baseMpg.toFixed(1);
  };

  const resolveRegionalEvConsumption = (reg, preset) => {
    const raw = preset?.isEv && Number(preset?.mpgUs) > 0 ? Number(preset.mpgUs) : 28.0;
    const baseKwh100Mi = raw > 60 ? 3370.5 / raw : raw;
    if (reg === 'EU') return +(baseKwh100Mi / 1.609344).toFixed(1);
    return +baseKwh100Mi.toFixed(1);
  };

  const localIcePriceDefault = Math.round(convertUsdToRegion(initialIcePrice));
  const localEvPriceDefault = Math.round(convertUsdToRegion(initialEvPrice));

  const [icePurchasePrice, setIcePurchasePrice] = useState(localIcePriceDefault);
  const [evPurchasePrice, setEvPurchasePrice] = useState(localEvPriceDefault);
  const [customOpen, setCustomOpen] = useState(false);

  const [iceConsumption, setIceConsumption] = useState(() =>
    resolveRegionalIceConsumption(region, activePreset)
  );
  const [evConsumption, setEvConsumption] = useState(() =>
    resolveRegionalEvConsumption(region, activePreset)
  );

  const [fuelPriceLocal, setFuelPriceLocal] = useState(() => {
    if (region === 'EU') return 1.85;
    if (region === 'UK') return 1.45;
    return 3.65;
  });

  const [electricityPriceLocal, setElectricityPriceLocal] = useState(() => {
    if (region === 'EU') return 0.28;
    if (region === 'UK') return 0.26;
    return 0.16;
  });

  useEffect(() => {
    setIcePurchasePrice(Math.round(convertUsdToRegion(initialIcePrice)));
    setEvPurchasePrice(Math.round(convertUsdToRegion(initialEvPrice)));
    setIceConsumption(resolveRegionalIceConsumption(region, activePreset));
    setEvConsumption(resolveRegionalEvConsumption(region, activePreset));
    setFuelPriceLocal(region === 'EU' ? 1.85 : region === 'UK' ? 1.45 : 3.65);
    setElectricityPriceLocal(region === 'EU' ? 0.28 : region === 'UK' ? 0.26 : 0.16);
  }, [region, initialIcePrice, initialEvPrice, activePreset?.id]);

  const annualDistLocal = Math.round(convertMilesToRegion(annualDistanceMiles));

  const { iceCostPerUnit, energySavingsPerUnit } = useMemo(() => {
    let iceCost = 0;
    let evCost = 0;

    if (region === 'EU') {
      iceCost = ((Number(iceConsumption) || 6.5) / 100) * (Number(fuelPriceLocal) || 1.85);
      evCost = ((Number(evConsumption) || 18.0) / 100) * (Number(electricityPriceLocal) || 0.28);
    } else if (region === 'UK') {
      const litCostPerImpGal = (Number(fuelPriceLocal) || 1.45) * 4.54609;
      iceCost = (Number(iceConsumption) || 38.0) > 0 ? litCostPerImpGal / Number(iceConsumption) : 0;
      evCost = ((Number(evConsumption) || 28.0) / 100) * (Number(electricityPriceLocal) || 0.26);
    } else {
      iceCost = (Number(iceConsumption) || 30.0) > 0 ? (Number(fuelPriceLocal) || 3.65) / Number(iceConsumption) : 0;
      evCost = ((Number(evConsumption) || 28.0) / 100) * (Number(electricityPriceLocal) || 0.16);
    }

    return {
      iceCostPerUnit: iceCost,
      evCostPerUnit: evCost,
      energySavingsPerUnit: iceCost - evCost,
    };
  }, [region, iceConsumption, evConsumption, fuelPriceLocal, electricityPriceLocal]);

  const pricePremiumLocal = Math.max(0, evPurchasePrice - icePurchasePrice);
  const annualSavingsLocal = Math.round(energySavingsPerUnit * annualDistLocal);

  const isCheaperUpfront = evPurchasePrice <= icePurchasePrice;
  const isNegativeSavings = energySavingsPerUnit <= 0;

  const targetHorizonYears = Math.max(1, Number(horizonYears) || 5);
  let breakEvenDistanceLocal = 0;
  let breakEvenYears = 0;
  let requiredAnnualDist5Yr = 0;
  let requiredAnnualDist3Yr = 0;

  if (!isCheaperUpfront && !isNegativeSavings) {
    breakEvenDistanceLocal = Math.round(pricePremiumLocal / energySavingsPerUnit);
    breakEvenYears = annualSavingsLocal > 0 ? +(pricePremiumLocal / annualSavingsLocal).toFixed(1) : 0;
    requiredAnnualDist5Yr = Math.round(breakEvenDistanceLocal / targetHorizonYears);
    requiredAnnualDist3Yr = Math.round(breakEvenDistanceLocal / 3);
  }

  const pctCheaper =
    iceCostPerUnit > 0 && energySavingsPerUnit > 0
      ? Math.round((energySavingsPerUnit / iceCostPerUnit) * 100)
      : 0;

  const iceMin = region === 'EU' ? 3.5 : 15;
  const iceMax = region === 'EU' ? 16.0 : 65;
  const iceFill = ((Math.min(iceMax, Math.max(iceMin, iceConsumption)) - iceMin) / (iceMax - iceMin)) * 100;

  const evMin = region === 'EU' ? 11.0 : 18.0;
  const evMax = region === 'EU' ? 30.0 : 48.0;
  const evFill = ((Math.min(evMax, Math.max(evMin, evConsumption)) - evMin) / (evMax - evMin)) * 100;

  return (
    <Card className="p-5 sm:p-6 space-y-6" aria-labelledby="breakeven-heading">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/80 dark:border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-xl bg-surface-subtle dark:bg-emerald-950/50 p-2.5 text-[#183D22] dark:text-emerald-400 shrink-0">
            <Zap aria-hidden="true" className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2
              id="breakeven-heading"
              className="font-sans text-h3 font-bold tracking-tight text-ink dark:text-zinc-50 scroll-mt-28 lg:scroll-mt-32"
            >
              Real-World Fuel vs. EV Break-Even Calculator
            </h2>
            <p className="font-sans text-xs sm:text-sm text-muted dark:text-zinc-400 mt-0.5">
              How many {distanceUnit}/year are needed for electricity savings to pay off an EV purchase premium.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-muted dark:text-zinc-400 hover:bg-surface-subtle dark:hover:bg-zinc-900 hover:text-ink dark:hover:text-zinc-100 transition-colors cursor-pointer"
            aria-label="Close break-even calculator"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        )}
      </div>

      {/*Desktop Split: Left Primary Price Inputs + Assumptions Drawer / Right Live Verdict Surface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-7 space-y-5 min-w-0">
          {/* Primary Upfront Controls: Vehicle Purchase Prices */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label
                htmlFor="input-ice-price"
                className="font-sans text-xs sm:text-sm font-medium text-body dark:text-zinc-300 block mb-1.5 truncate"
              >
                ICE / Petrol Price ({currencySymbol})
              </label>
              <input
                id="input-ice-price"
                type="number"
                value={icePurchasePrice}
                onChange={(e) => setIcePurchasePrice(Math.max(0, Number(e.target.value) || 0))}
                className="w-full min-h-[44px] rounded-xl border border-border dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900 px-3.5 py-2 text-base sm:text-sm font-mono font-semibold tabular-nums text-ink dark:text-zinc-100 outline-none focus:border-[#183D22] dark:focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="input-ev-price"
                className="font-sans text-xs sm:text-sm font-medium text-body dark:text-zinc-300 block mb-1.5 truncate"
              >
                EV / Hybrid Price ({currencySymbol})
              </label>
              <input
                id="input-ev-price"
                type="number"
                value={evPurchasePrice}
                onChange={(e) => setEvPurchasePrice(Math.max(0, Number(e.target.value) || 0))}
                className="w-full min-h-[44px] rounded-xl border border-border dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900 px-3.5 py-2 text-base sm:text-sm font-mono font-semibold tabular-nums text-ink dark:text-zinc-100 outline-none focus:border-[#183D22] dark:focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Progressive Disclosure: Native <details> Energy Rate & Consumption Assumptions */}
          <details
            id="ev-assumptions-panel"
            className="dl-disclosure group border-t border-border/80 dark:border-zinc-800 pt-1"
            open={customOpen}
            onToggle={(e) => setCustomOpen(Boolean(e.currentTarget?.open))}
          >
            <summary className="min-h-[48px] py-3 flex items-center justify-between gap-3 text-left font-sans text-xs sm:text-sm font-semibold text-ink dark:text-zinc-100 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors">
              <span>Fine-tune energy rates &amp; consumption assumptions</span>
              <ChevronDown
                aria-hidden="true"
                className="w-4 h-4 shrink-0 text-muted dark:text-zinc-400 transition-transform duration-200 group-open:rotate-180"
              />
            </summary>

            <div className="pb-2 pt-2 grid gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label
                  htmlFor="input-fuel-rate"
                  className="font-sans text-xs font-medium text-body dark:text-zinc-300 block mb-1.5 truncate"
                >
                  Fuel price ({currencySymbol} / {region === 'US' ? 'gal' : 'L'})
                </label>
                <input
                  id="input-fuel-rate"
                  type="number"
                  step="0.05"
                  value={fuelPriceLocal}
                  onChange={(e) => setFuelPriceLocal(Math.max(0.1, Number(e.target.value) || 0))}
                  className="w-full min-h-[44px] rounded-xl border border-border dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900 px-3 py-2 text-base sm:text-sm font-mono font-semibold tabular-nums text-ink dark:text-zinc-100 outline-none focus:border-[#183D22] dark:focus:border-emerald-500"
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="input-electricity-rate"
                  className="font-sans text-xs font-medium text-body dark:text-zinc-300 block mb-1.5 truncate"
                >
                  Electricity rate ({currencySymbol} / kWh)
                </label>
                <input
                  id="input-electricity-rate"
                  type="number"
                  step="0.01"
                  value={electricityPriceLocal}
                  onChange={(e) => setElectricityPriceLocal(Math.max(0.01, Number(e.target.value) || 0))}
                  className="w-full min-h-[44px] rounded-xl border border-border dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900 px-3 py-2 text-base sm:text-sm font-mono font-semibold tabular-nums text-ink dark:text-zinc-100 outline-none focus:border-[#183D22] dark:focus:border-emerald-500"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="input-ice-consumption"
                    className="font-sans text-xs font-medium text-body dark:text-zinc-300 truncate"
                  >
                    ICE consumption ({efficiencyUnit})
                  </label>
                  <span className="text-xs font-mono font-semibold text-ink dark:text-zinc-100 tabular-nums">
                    {iceConsumption} {efficiencyUnit}
                  </span>
                </div>
                <input
                  id="input-ice-consumption"
                  type="range"
                  min={iceMin}
                  max={iceMax}
                  step={region === 'EU' ? 0.2 : 1}
                  value={iceConsumption}
                  onChange={(e) => setIceConsumption(Math.max(1, Number(e.target.value) || 1))}
                  className="odo-range telemetry-slider"
                  style={{ '--fill': `${iceFill}%` }}
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="input-ev-consumption"
                    className="font-sans text-xs font-medium text-body dark:text-zinc-300 truncate"
                  >
                    EV consumption ({evEfficiencyUnit})
                  </label>
                  <span className="text-xs font-mono font-semibold text-ink dark:text-zinc-100 tabular-nums">
                    {evConsumption} {evEfficiencyUnit}
                  </span>
                </div>
                <input
                  id="input-ev-consumption"
                  type="range"
                  min={evMin}
                  max={evMax}
                  step={0.5}
                  value={evConsumption}
                  onChange={(e) => setEvConsumption(Math.max(5, Number(e.target.value) || 5))}
                  className="odo-range telemetry-slider"
                  style={{ '--fill': `${evFill}%` }}
                />
              </div>
            </div>
          </details>
        </div>

        {/* Right: Calm Unified Break-Even Verdict Surface (No Nested Boxes) */}
        <div className="lg:col-span-5 rounded-2xl bg-surface-subtle dark:bg-zinc-900/80 p-5 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-sans text-xs font-semibold text-muted dark:text-zinc-400">
              <span className="sr-only">BREAK-EVEN HORIZON</span>
              <span aria-hidden="true">Break-even horizon</span>
            </span>
            {pctCheaper > 0 ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 text-[11px] font-sans font-medium border border-emerald-200/80 dark:border-emerald-800/40">
                <span className="font-mono tabular-nums">+{pctCheaper}%</span>&nbsp;cheaper / {distanceUnit}
              </span>
            ) : isNegativeSavings ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 text-[11px] font-sans font-medium border border-rose-200/80 dark:border-rose-800/40">
                Higher energy cost
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-surface dark:bg-zinc-800 text-body dark:text-zinc-300 text-[11px] font-sans font-medium border border-border/80 dark:border-zinc-700">
                Cost parity
              </span>
            )}
          </div>

          <div aria-live="polite">
            <p className="text-2xl sm:text-3xl font-bold text-ink dark:text-zinc-50 tracking-tight leading-tight">
              {isCheaperUpfront ? (
                <span className="font-sans">Immediate (0 yrs)</span>
              ) : isNegativeSavings ? (
                <span className="font-sans">No Payoff</span>
              ) : (
                <span className="font-mono tabular-nums">
                  {breakEvenDistanceLocal.toLocaleString()} {distanceUnit}
                </span>
              )}
            </p>
            <p className="mt-1 font-sans text-xs text-muted dark:text-zinc-400">
              {isCheaperUpfront
                ? 'EV purchase price is already at or below the ICE model.'
                : isNegativeSavings
                ? 'Current electricity rate exceeds fuel cost per mile/km.'
                : `~${breakEvenYears} years at ${annualDistLocal.toLocaleString()} ${distanceUnit}/yr`}
            </p>
          </div>

          <div className="pt-3 border-t border-border/80 dark:border-zinc-800 font-sans text-xs text-body dark:text-zinc-300">
            {isNegativeSavings ? (
              <span className="text-rose-700 dark:text-rose-400 font-medium">
                EV adds{' '}
                <strong className="font-mono tabular-nums">
                  +{currencySymbol}
                  {Math.abs(annualSavingsLocal).toLocaleString()}/yr
                </strong>{' '}
                in energy cost at current rates.
              </span>
            ) : (
              <span>
                Energy savings:{' '}
                <strong className="font-mono tabular-nums text-[#183D22] dark:text-emerald-400">
                  {currencySymbol}
                  {annualSavingsLocal.toLocaleString()}/yr
                </strong>{' '}
                (
                <span className="font-mono tabular-nums">
                  {currencySymbol}
                  {Math.round(annualSavingsLocal / 12).toLocaleString()}/mo
                </span>
                )
              </span>
            )}
          </div>

          {!isCheaperUpfront && !isNegativeSavings && (
            <div className="pt-3 border-t border-border/80 dark:border-zinc-800 space-y-2">
              <p className="text-[11px] font-semibold text-muted dark:text-zinc-400 font-sans">
                <span className="sr-only">ANNUAL DRIVING NEEDED TO BREAK EVEN:</span>
                <span aria-hidden="true">Annual driving needed to break even</span>
              </p>
              <div className="grid grid-cols-3 divide-x divide-border/80 dark:divide-zinc-800 text-xs">
                <div className="pr-2 min-w-0">
                  <span className="text-muted dark:text-zinc-400 block font-sans text-[11px] truncate">
                    {targetHorizonYears}-yr target
                  </span>
                  <span className="mt-0.5 block font-bold font-mono tabular-nums text-[#183D22] dark:text-emerald-400 truncate">
                    {requiredAnnualDist5Yr.toLocaleString()}
                  </span>
                </div>
                <div className="px-2 min-w-0">
                  <span className="text-muted dark:text-zinc-400 block font-sans text-[11px] truncate">
                    3-yr target
                  </span>
                  <span className="mt-0.5 block font-bold font-mono tabular-nums text-[#183D22] dark:text-emerald-400 truncate">
                    {requiredAnnualDist3Yr.toLocaleString()}
                  </span>
                </div>
                <div className="pl-2 min-w-0">
                  <span className="text-muted dark:text-zinc-400 block font-sans text-[11px] truncate">
                    Your mileage
                  </span>
                  <span className="mt-0.5 block font-bold font-mono tabular-nums text-ink dark:text-zinc-100 truncate">
                    {annualDistLocal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

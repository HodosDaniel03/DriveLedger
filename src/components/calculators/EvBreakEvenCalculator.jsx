import React, { useState, useMemo } from 'react';
import { Zap, Fuel, ArrowRight, X, Gauge, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
import { useUnits } from '../../context/UnitContext';
import { Card, Pill, TldrVerdictBox, RiskBadge, Collapse } from '../common/OdometerPrimitives';

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
    fuelVolumeUnit,
    formatCurrency,
    formatDistance,
    convertMilesToRegion,
    convertRegionToMiles,
    convertUsdToRegion,
    convertRegionToUsd,
  } = useUnits();

  // Localized initial defaults
  const localIcePriceDefault = Math.round(convertUsdToRegion(initialIcePrice));
  const localEvPriceDefault = Math.round(convertUsdToRegion(initialEvPrice));

  const [icePurchasePrice, setIcePurchasePrice] = useState(localIcePriceDefault);
  const [evPurchasePrice, setEvPurchasePrice] = useState(localEvPriceDefault);
  const [customOpen, setCustomOpen] = useState(false);

  // Region-aware consumption and energy rates
  const [iceConsumption, setIceConsumption] = useState(() => {
    if (region === 'EU') return 6.5; // L/100km
    if (region === 'UK') return 38.0; // MPG UK
    return 30.0; // MPG US
  });

  const [evConsumption, setEvConsumption] = useState(() => {
    if (region === 'EU') return 18.0; // kWh/100km
    return 28.0; // kWh/100mi
  });

  const [fuelPriceLocal, setFuelPriceLocal] = useState(() => {
    if (region === 'EU') return 1.85; // €/L
    if (region === 'UK') return 1.45; // £/L
    return 3.65; // $/gal
  });

  const [electricityPriceLocal, setElectricityPriceLocal] = useState(() => {
    if (region === 'EU') return 0.28; // €/kWh
    if (region === 'UK') return 0.26; // £/kWh
    return 0.16; // $/kWh
  });

  // Annual distance in local units (miles or km)
  const annualDistLocal = Math.round(convertMilesToRegion(annualDistanceMiles));

  // Running cost per local distance unit (mile or km)
  const { iceCostPerUnit, evCostPerUnit, energySavingsPerUnit } = useMemo(() => {
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

    const savings = iceCost - evCost;
    return {
      iceCostPerUnit: iceCost,
      evCostPerUnit: evCost,
      energySavingsPerUnit: savings,
    };
  }, [region, iceConsumption, evConsumption, fuelPriceLocal, electricityPriceLocal]);

  // Price premium in local currency
  const pricePremiumLocal = Math.max(0, evPurchasePrice - icePurchasePrice);

  // Annual savings in local currency
  const annualSavingsLocal = Math.round(energySavingsPerUnit * annualDistLocal);

  // Break-even metrics
  const isCheaperUpfront = evPurchasePrice <= icePurchasePrice;
  const isNegativeSavings = energySavingsPerUnit <= 0;

  let breakEvenDistanceLocal = 0;
  let breakEvenYears = 0;
  let requiredAnnualDist5Yr = 0;
  let requiredAnnualDist3Yr = 0;

  if (!isCheaperUpfront && !isNegativeSavings) {
    breakEvenDistanceLocal = Math.round(pricePremiumLocal / energySavingsPerUnit);
    breakEvenYears = annualSavingsLocal > 0 ? +(pricePremiumLocal / annualSavingsLocal).toFixed(1) : 0;
    requiredAnnualDist5Yr = Math.round(breakEvenDistanceLocal / 5);
    requiredAnnualDist3Yr = Math.round(breakEvenDistanceLocal / 3);
  }

  const pctCheaper = iceCostPerUnit > 0 && energySavingsPerUnit > 0
    ? Math.round((energySavingsPerUnit / iceCostPerUnit) * 100)
    : 0;

  const evTldrFacts = useMemo(() => [
    {
      label: 'Break-Even Horizon',
      value: isCheaperUpfront ? 'Immediate (0 yrs)' : isNegativeSavings ? 'No Payoff' : `${breakEvenYears} yrs (${breakEvenDistanceLocal.toLocaleString()} ${distanceUnit})`,
      subtext: isCheaperUpfront
        ? 'EV is cheaper upfront.'
        : isNegativeSavings
        ? 'Electricity exceeds fuel cost.'
        : 'Running cost savings recover premium.',
      badge: (
        <RiskBadge
          level={isCheaperUpfront ? 'low' : breakEvenYears <= 4 ? 'low' : breakEvenYears <= 7 ? 'moderate' : 'critical'}
          label={isCheaperUpfront ? 'Immediate' : breakEvenYears <= 4 ? 'Fast Payoff' : 'Extended'}
        />
      ),
    },
    {
      label: 'Annual Energy Savings',
      value: `${currencySymbol}${annualSavingsLocal.toLocaleString()} / yr`,
      subtext: `${pctCheaper}% lower energy cost (${currencySymbol}${Math.round(annualSavingsLocal / 12).toLocaleString()} / mo).`,
      badge: <RiskBadge level={annualSavingsLocal > 0 ? 'low' : 'critical'} label={`${pctCheaper}% cheaper`} />,
    },
    {
      label: 'Required Annual Mileage',
      value: isCheaperUpfront ? 'Any mileage' : `${requiredAnnualDist5Yr.toLocaleString()} ${distanceUnit} / yr`,
      subtext: 'Minimum annual driving for 5-year break-even.',
      badge: <RiskBadge level="moderate" label="5-Yr Threshold" />,
    },
  ], [isCheaperUpfront, isNegativeSavings, breakEvenYears, breakEvenDistanceLocal, distanceUnit, currencySymbol, annualSavingsLocal, pctCheaper, requiredAnnualDist5Yr]);

  return (
    <Card className="rounded-2xl border border-[#E6E6E1] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-6" aria-labelledby="breakeven-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E6E6E1]">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#E8F5E9] p-2 text-[#183D22]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 id="breakeven-heading" className="text-base sm:text-lg font-bold tracking-tight text-ink scroll-mt-28 lg:scroll-mt-32">
              Real-World Fuel vs. EV Break-Even Calculator
            </h2>
            <p className="text-xs text-muted">
              Determine how many {distanceUnit}/year are needed for electricity savings to pay off an EV purchase premium
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-subtle hover:text-ink transition-colors"
            aria-label="Close break-even calculator"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* TL;DR Verdict Box: 3 Key EV Break-Even Metrics */}
      <TldrVerdictBox
        title="TL;DR Verdict"
        subtitle="3 key EV break-even metrics (Zero fluff)"
        badge="Break-Even Balance"
        facts={evTldrFacts}
      />

      {/* Hero Summary Badge */}
      <div className="mt-5 rounded-xl bg-[#F2F6F3] dark:bg-zinc-900 p-5 border border-[#DCE6DF] dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase font-sans tracking-wider font-bold text-[#183D22] dark:text-emerald-400">
            BREAK-EVEN HORIZON
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold font-sans text-ink dark:text-zinc-50">
            {isCheaperUpfront ? (
              'Immediate'
            ) : isNegativeSavings ? (
              'Never (Higher Running Cost)'
            ) : (
              <span className="font-mono tabular-nums">{breakEvenDistanceLocal.toLocaleString()} {distanceUnit}</span>
            )}
            <span className="text-xs sm:text-sm font-normal text-muted dark:text-zinc-400 ml-2 font-sans">
              {isCheaperUpfront
                ? '(EV is already cheaper to purchase)'
                : isNegativeSavings
                ? '(Electricity rate exceeds fuel cost)'
                : `(~${breakEvenYears} years at current mileage)`}
            </span>
          </p>
          <p className="mt-1.5 font-sans text-xs text-body dark:text-zinc-300">
            {isNegativeSavings ? (
              <span className="text-danger-text dark:text-rose-400 font-medium font-sans">
                EV costs <span className="font-mono tabular-nums">+{currencySymbol}{Math.abs(annualSavingsLocal).toLocaleString()}/yr</span> more in energy at current rates
              </span>
            ) : (
              <>
                Saves <span className="font-bold text-[#183D22] dark:text-emerald-400 font-mono tabular-nums">{currencySymbol}{annualSavingsLocal.toLocaleString()}/year</span> in energy costs (<span className="font-mono tabular-nums">{currencySymbol}{Math.round(annualSavingsLocal / 12).toLocaleString()}/mo</span>)
              </>
            )}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {pctCheaper > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-sans font-medium border border-emerald-200 dark:border-emerald-800/40">
              <span className="font-mono tabular-nums">+{pctCheaper}%</span> Cheaper per {distanceUnit}
            </span>
          ) : isNegativeSavings ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-[11px] font-sans font-medium border border-rose-200 dark:border-rose-800/40">
              Negative Energy Savings
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-[11px] font-sans font-medium border border-zinc-200 dark:border-zinc-700/60">
              Parity per {distanceUnit}
            </span>
          )}
        </div>
      </div>

      {/* Break-Even Target Driving Requirements Callout */}
      {!isCheaperUpfront && !isNegativeSavings && (
        <div className="mt-4 rounded-xl border border-[#E6E6E1] dark:border-zinc-800 bg-[#F7F7F4] dark:bg-zinc-900 p-4">
          <p className="text-xs font-bold text-ink dark:text-zinc-100 uppercase tracking-wider font-sans">
            ANNUAL DRIVING NEEDED TO BREAK EVEN:
          </p>
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-white dark:bg-[#121215] border border-[#E6E6E1] dark:border-zinc-800 shadow-xs">
              <span className="text-muted dark:text-zinc-400 block font-sans font-medium text-[11px]">Over 5 Years</span>
              <span className="text-base font-bold font-mono tabular-nums text-[#183D22] dark:text-emerald-400">
                {requiredAnnualDist5Yr.toLocaleString()} {distanceUnit}/yr
              </span>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-[#121215] border border-[#E6E6E1] dark:border-zinc-800 shadow-xs">
              <span className="text-muted dark:text-zinc-400 block font-sans font-medium text-[11px]">Over 3 Years</span>
              <span className="text-base font-bold font-mono tabular-nums text-[#183D22] dark:text-emerald-400">
                {requiredAnnualDist3Yr.toLocaleString()} {distanceUnit}/yr
              </span>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-[#121215] border border-[#E6E6E1] dark:border-zinc-800 shadow-xs">
              <span className="text-muted dark:text-zinc-400 block font-sans font-medium text-[11px]">Your Current Driving</span>
              <span className="text-base font-bold font-mono tabular-nums text-ink dark:text-zinc-100">
                {annualDistLocal.toLocaleString()} {distanceUnit}/yr
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Core Inputs: Vehicle Purchase Prices (Default Visible) */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="input-ice-price" className="font-sans text-xs font-medium text-muted dark:text-zinc-400 block mb-1.5 truncate">
            ICE / Petrol Price ({currencySymbol})
          </label>
          <input
            id="input-ice-price"
            type="number"
            value={icePurchasePrice}
            onChange={(e) => setIcePurchasePrice(Math.max(0, Number(e.target.value) || 0))}
            className="w-full rounded-xl border border-[#E6E6E1] dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-mono tabular-nums text-ink dark:text-zinc-100 outline-none focus:border-[#183D22] shadow-xs"
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="input-ev-price" className="font-sans text-xs font-medium text-muted dark:text-zinc-400 block mb-1.5 truncate">
            EV / Hybrid Price ({currencySymbol})
          </label>
          <input
            id="input-ev-price"
            type="number"
            value={evPurchasePrice}
            onChange={(e) => setEvPurchasePrice(Math.max(0, Number(e.target.value) || 0))}
            className="w-full rounded-xl border border-[#E6E6E1] dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-mono tabular-nums text-ink dark:text-zinc-100 outline-none focus:border-[#183D22] shadow-xs"
          />
        </div>
      </div>

      {/* Progressive Disclosure: Collapsible Energy Rate Assumptions */}
      <div className="border-t border-[#E6E6E1] dark:border-zinc-800 pt-3">
        <button
          type="button"
          aria-expanded={customOpen}
          aria-controls="ev-assumptions-panel"
          onClick={() => setCustomOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl py-2 px-3 font-sans text-sm font-semibold text-[#183D22] dark:text-emerald-400 bg-[#F2F6F3] dark:bg-zinc-900 hover:bg-[#E8F0EA] dark:hover:bg-zinc-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Plus
              aria-hidden="true"
              className={`w-4 h-4 transition-transform duration-300 ${customOpen ? 'rotate-45' : ''}`}
            />
            <span>Customize energy rates &amp; consumption assumptions</span>
          </span>
          <span className="text-xs font-sans font-medium text-[#5F665F] dark:text-zinc-400">
            {customOpen ? 'Hide' : 'Expand'}
          </span>
        </button>

        <Collapse open={customOpen} id="ev-assumptions-panel">
          <div className="mt-3 grid gap-4 sm:grid-cols-2 p-3.5 rounded-xl border border-[#E6E6E1] bg-[#F7F7F4]">
            <div className="min-w-0">
              <label htmlFor="input-fuel-rate" className="text-xs font-medium text-muted block mb-1.5 truncate">
                Fuel Price ({currencySymbol} / {region === 'US' ? 'gal' : 'L'})
              </label>
              <input
                id="input-fuel-rate"
                type="number"
                step="0.05"
                value={fuelPriceLocal}
                onChange={(e) => setFuelPriceLocal(Math.max(0.1, Number(e.target.value) || 0))}
                className="w-full rounded-xl border border-[#E6E6E1] dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-mono tabular-nums text-ink dark:text-zinc-100 outline-none focus:border-[#183D22] shadow-xs"
              />
            </div>

            <div className="min-w-0">
              <label htmlFor="input-electricity-rate" className="text-xs font-medium text-muted block mb-1.5 truncate">
                Electricity Rate ({currencySymbol} / kWh)
              </label>
              <input
                id="input-electricity-rate"
                type="number"
                step="0.01"
                value={electricityPriceLocal}
                onChange={(e) => setElectricityPriceLocal(Math.max(0.01, Number(e.target.value) || 0))}
                className="w-full rounded-xl border border-[#E6E6E1] dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-mono tabular-nums text-ink dark:text-zinc-100 outline-none focus:border-[#183D22] shadow-xs"
              />
            </div>
          </div>
        </Collapse>
      </div>
    </Card>
  );
}

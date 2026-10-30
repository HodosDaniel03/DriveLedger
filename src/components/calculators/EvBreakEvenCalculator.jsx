import React, { useState, useMemo } from 'react';
import { Zap, Fuel, ArrowRight, X, Gauge, TrendingUp, AlertTriangle } from 'lucide-react';
import { useUnits } from '../../context/UnitContext';
import { Card, Pill } from '../common/OdometerPrimitives';

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

  return (
    <Card className="border border-primary-100 bg-surface shadow-card" aria-labelledby="breakeven-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary-50 p-2 text-primary-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 id="breakeven-heading" className="text-base sm:text-lg font-bold tracking-tight text-ink">
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
            className="rounded-full p-1.5 text-muted hover:bg-surface-subtle hover:text-ink transition-colors"
            aria-label="Close break-even calculator"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Hero Summary Badge */}
      <div className="mt-5 rounded-xl bg-primary-50/50 p-5 border border-primary-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase font-code tracking-wider font-bold text-primary-700">
            BREAK-EVEN HORIZON
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold font-code tabular-nums text-ink">
            {isCheaperUpfront ? (
              'Immediate'
            ) : isNegativeSavings ? (
              'Never (Higher Running Cost)'
            ) : (
              `${breakEvenDistanceLocal.toLocaleString()} ${distanceUnit}`
            )}
            <span className="text-xs sm:text-sm font-normal text-muted ml-2 font-body">
              {isCheaperUpfront
                ? '(EV is already cheaper to purchase)'
                : isNegativeSavings
                ? '(Electricity rate exceeds fuel cost)'
                : `(~${breakEvenYears} years at current mileage)`}
            </span>
          </p>
          <p className="mt-1.5 text-xs text-body">
            {isNegativeSavings ? (
              <span className="text-danger-text font-medium font-code">
                EV costs +{currencySymbol}{Math.abs(annualSavingsLocal).toLocaleString()}/yr more in energy at current rates
              </span>
            ) : (
              <>
                Saves <span className="font-bold text-primary-700 font-code">{currencySymbol}{annualSavingsLocal.toLocaleString()}/year</span> in energy costs ({currencySymbol}{Math.round(annualSavingsLocal / 12).toLocaleString()}/mo)
              </>
            )}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {pctCheaper > 0 ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success-bg text-success-text text-xs font-code font-bold border border-[#BFE8CF]">
              +{pctCheaper}% Cheaper per {distanceUnit}
            </span>
          ) : isNegativeSavings ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-danger-bg text-danger-text text-xs font-code font-bold border border-[#F7C1BB]">
              Negative Energy Savings
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-subtle text-body text-xs font-code font-bold border border-border">
              Parity per {distanceUnit}
            </span>
          )}
        </div>
      </div>

      {/* Break-Even Target Driving Requirements Callout */}
      {!isCheaperUpfront && !isNegativeSavings && (
        <div className="mt-4 rounded-xl border border-border bg-surface-subtle p-4">
          <p className="text-xs font-bold text-ink uppercase tracking-wider font-code">
            ANNUAL DRIVING NEEDED TO BREAK EVEN:
          </p>
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-surface border border-border shadow-sm">
              <span className="text-muted block font-code text-[11px]">Over 5 Years</span>
              <span className="text-base font-bold font-code text-primary-700">
                {requiredAnnualDist5Yr.toLocaleString()} {distanceUnit}/yr
              </span>
            </div>
            <div className="p-3 rounded-lg bg-surface border border-border shadow-sm">
              <span className="text-muted block font-code text-[11px]">Over 3 Years</span>
              <span className="text-base font-bold font-code text-primary-700">
                {requiredAnnualDist3Yr.toLocaleString()} {distanceUnit}/yr
              </span>
            </div>
            <div className="p-3 rounded-lg bg-surface border border-border shadow-sm">
              <span className="text-muted block font-code text-[11px]">Your Current Driving</span>
              <span className="text-base font-bold font-code text-ink">
                {annualDistLocal.toLocaleString()} {distanceUnit}/yr
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Controls Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="input-ice-price" className="text-xs font-medium text-muted block mb-1.5">
            ICE / Petrol Price ({currencySymbol})
          </label>
          <input
            id="input-ice-price"
            type="number"
            value={icePurchasePrice}
            onChange={(e) => setIcePurchasePrice(Math.max(1000, Number(e.target.value) || 0))}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-code text-ink outline-none focus:border-primary-600 shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="input-ev-price" className="text-xs font-medium text-muted block mb-1.5">
            EV / Hybrid Price ({currencySymbol})
          </label>
          <input
            id="input-ev-price"
            type="number"
            value={evPurchasePrice}
            onChange={(e) => setEvPurchasePrice(Math.max(1000, Number(e.target.value) || 0))}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-code text-ink outline-none focus:border-primary-600 shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="input-fuel-rate" className="text-xs font-medium text-muted block mb-1.5">
            Fuel Price ({currencySymbol} / {region === 'US' ? 'gal' : 'L'})
          </label>
          <input
            id="input-fuel-rate"
            type="number"
            step="0.05"
            value={fuelPriceLocal}
            onChange={(e) => setFuelPriceLocal(Math.max(0.1, Number(e.target.value) || 0))}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-code text-ink outline-none focus:border-primary-600 shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="input-electricity-rate" className="text-xs font-medium text-muted block mb-1.5">
            Electricity Rate ({currencySymbol} / kWh)
          </label>
          <input
            id="input-electricity-rate"
            type="number"
            step="0.01"
            value={electricityPriceLocal}
            onChange={(e) => setElectricityPriceLocal(Math.max(0.01, Number(e.target.value) || 0))}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-code text-ink outline-none focus:border-primary-600 shadow-sm"
          />
        </div>
      </div>
    </Card>
  );
}

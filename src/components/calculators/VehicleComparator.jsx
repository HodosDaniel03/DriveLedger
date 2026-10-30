import React, { useState, useMemo } from 'react';
import { GitCompare, TrendingDown, TrendingUp, Check, ArrowRight, X, ShieldCheck, AlertTriangle, Wrench } from 'lucide-react';
import { VEHICLE_PRESETS, getPresetById } from '../../data/vehiclePresets';
import {
  MAINTENANCE_COMPONENTS,
  evaluateComponentHealth,
  calculateOemRiskMultiplier,
} from '../../data/maintenanceData';
import { calculateTcoProjection } from './TcoCalculator';
import { useUnits } from '../../context/UnitContext';
import { Card, Pill } from '../common/OdometerPrimitives';
import VehicleSilhouette from '../common/vehicle/VehicleSilhouette.jsx';

/**
 * Evaluates applicable mechanical assemblies for a vehicle preset and returns:
 * - reliabilityScore (0–100)
 * - serviceReserveUsd (12-month expected repair risk exposure in USD)
 * - criticalCount & warningCount
 */
export function computeReliabilityAndRisk(
  preset,
  odoMiles = 62000,
  schedMode = 'preventative',
  urbanPct = 35,
  tier = 'independent'
) {
  const safePreset = preset || VEHICLE_PRESETS[0];
  const physicalOdometerMiles = Math.max(0, Number(odoMiles) >= 0 ? Number(odoMiles) : (safePreset.defaultOdometerMiles || 62000));
  const oilIntervalId = schedMode === 'oem' ? 'extended' : 'standard';

  const relevant = MAINTENANCE_COMPONENTS.filter((comp) =>
    comp.applicablePowertrains.includes(safePreset.powertrain || 'diesel')
  );

  const evaluatedComponents = relevant.map((comp) => {
    const health = evaluateComponentHealth({
      component: comp,
      physicalOdometerMiles,
      urbanTripSharePct: urbanPct,
      oilIntervalId,
      serviceHistoryId: 'verified',
      transmissionId: safePreset.transmission || 'dct-dsg',
    });
    return {
      ...comp,
      health,
    };
  });

  let reserve = 0;
  for (const item of evaluatedComponents) {
    const costRange = tier === 'dealership' ? item.costsUsd.dealership : item.costsUsd.independent;
    const avgCost = (costRange[0] + costRange[1]) / 2;

    if (item.health.status === 'CRITICAL') {
      reserve += avgCost * 0.75;
    } else if (item.health.status === 'WARNING') {
      reserve += avgCost * 0.35;
    } else {
      reserve += avgCost * 0.12;
    }
  }

  const baseReserveUsd = Math.round(reserve);
  const oemRiskMultiplier = calculateOemRiskMultiplier(physicalOdometerMiles);
  const serviceReserveUsd = schedMode === 'oem' ? Math.round(baseReserveUsd * oemRiskMultiplier) : baseReserveUsd;

  const criticalCount = evaluatedComponents.filter((c) => c.health.status === 'CRITICAL').length;
  const warningCount = evaluatedComponents.filter((c) => c.health.status === 'WARNING').length;
  const optimalCount = evaluatedComponents.filter((c) => c.health.status === 'OPTIMAL').length;

  const oemScoreDeduction =
    schedMode === 'oem'
      ? Math.min(25, Math.max(18, Math.round(18 + (physicalOdometerMiles / 120000) * 7)))
      : 0;

  let reliabilityScore = 75;
  if (evaluatedComponents.length > 0) {
    const avgWear =
      evaluatedComponents.reduce((acc, c) => acc + c.health.wearPctOfCritical, 0) /
      evaluatedComponents.length;
    const penalty = criticalCount * 14 + warningCount * 6;
    const raw = 100 - avgWear * 0.45 - penalty - oemScoreDeduction;
    reliabilityScore = Math.min(95, Math.max(18, Math.round(raw)));
  }

  return {
    reliabilityScore,
    serviceReserveUsd,
    baseReserveUsd,
    criticalCount,
    warningCount,
    optimalCount,
    totalComponents: evaluatedComponents.length,
    evaluatedComponents,
  };
}

export default function VehicleComparator({
  primaryPresetId,
  primaryPurchasePriceUsd,
  primaryPriceUsd,
  primaryOdometerMiles = 62000,
  primaryMpgUs,
  primaryFuelPriceUsdGal,
  primaryInsuranceUsd,
  primaryTco,
  horizonYears = 5,
  annualDistanceMiles = 12000,
  primaryAnnualMiles,
  downPaymentPct = 20,
  aprPct = 6.4,
  loanTermMonths = 60,
  scheduleMode = 'preventative',
  urbanTripSharePct = 35,
  workshopTier = 'independent',
  onClose,
  onApplyPreset,
}) {
  const { formatCurrency, formatDistance } = useUnits();

  const vehicleA = useMemo(() => getPresetById(primaryPresetId), [primaryPresetId]);
  const [vehicleBId, setVehicleBId] = useState(() => {
    if (primaryPresetId === 'toyota-camry-hybrid') return 'ford-focus-ecoblue';
    if (vehicleA.fuelType === 'Diesel') return 'toyota-camry-hybrid';
    if (vehicleA.isEv) return 'bmw-330i-g20';
    return 'tesla-model-3-lr';
  });

  // Prevent Vehicle B from ever being identical to Vehicle A
  React.useEffect(() => {
    if (vehicleBId === primaryPresetId) {
      const fallback = VEHICLE_PRESETS.find((p) => p.id !== primaryPresetId);
      if (fallback) setVehicleBId(fallback.id);
    }
  }, [primaryPresetId, vehicleBId]);

  const vehicleB = useMemo(() => getPresetById(vehicleBId), [vehicleBId]);

  // Telemetry parameters for Vehicle A
  const resolvedPrimaryPrice = primaryPurchasePriceUsd ?? primaryPriceUsd;
  const resolvedAnnualMiles = Number(primaryAnnualMiles) > 0 ? Number(primaryAnnualMiles) : annualDistanceMiles;
  const priceA = Number(resolvedPrimaryPrice) > 0 ? Number(resolvedPrimaryPrice) : vehicleA.purchasePriceUsd;
  const odoA = Number(primaryOdometerMiles) >= 0 ? Number(primaryOdometerMiles) : (vehicleA.defaultOdometerMiles || 62000);
  const mpgA = Number(primaryMpgUs) > 0 ? Number(primaryMpgUs) : vehicleA.mpgUs;
  const fuelPriceA = Number(primaryFuelPriceUsdGal) > 0 ? Number(primaryFuelPriceUsdGal) : vehicleA.defaultFuelPriceUsdGal;
  const insuranceA = Number(primaryInsuranceUsd) >= 0 ? Number(primaryInsuranceUsd) : vehicleA.annualInsuranceUsd;

  // Calculate TCO projections for both vehicles under identical driving parameters
  const tcoA = useMemo(() => {
    if (primaryTco && primaryTco.yearlySchedule?.length === horizonYears) {
      return primaryTco;
    }
    return calculateTcoProjection({
      purchasePriceUsd: priceA,
      odometerMiles: odoA,
      annualDistanceMiles: resolvedAnnualMiles,
      mpgUs: mpgA,
      isEv: vehicleA.isEv,
      fuelPriceUsdGal: fuelPriceA,
      annualInsuranceUsd: insuranceA,
      baseAnnualMaintenanceUsd: vehicleA.baseAnnualMaintenanceUsd,
      maintenanceWearFactor: vehicleA.maintenanceWearFactor,
      downPaymentPct,
      aprPct: vehicleA.isEv ? 5.2 : aprPct,
      loanTermMonths,
      horizonYears,
      residualCurve10Yr: vehicleA.residualCurve10Yr,
    });
  }, [
    primaryTco,
    priceA,
    odoA,
    resolvedAnnualMiles,
    mpgA,
    vehicleA,
    fuelPriceA,
    insuranceA,
    downPaymentPct,
    aprPct,
    loanTermMonths,
    horizonYears,
  ]);

  const tcoB = useMemo(() => {
    return calculateTcoProjection({
      purchasePriceUsd: vehicleB.purchasePriceUsd,
      odometerMiles: vehicleB.defaultOdometerMiles,
      annualDistanceMiles: resolvedAnnualMiles,
      mpgUs: vehicleB.mpgUs,
      isEv: vehicleB.isEv,
      fuelPriceUsdGal: vehicleB.defaultFuelPriceUsdGal,
      annualInsuranceUsd: vehicleB.annualInsuranceUsd,
      baseAnnualMaintenanceUsd: vehicleB.baseAnnualMaintenanceUsd,
      maintenanceWearFactor: vehicleB.maintenanceWearFactor,
      downPaymentPct,
      aprPct: vehicleB.isEv ? 5.2 : aprPct,
      loanTermMonths,
      horizonYears,
      residualCurve10Yr: vehicleB.residualCurve10Yr,
    });
  }, [vehicleB, resolvedAnnualMiles, horizonYears, downPaymentPct, aprPct, loanTermMonths]);

  // Calculate Mechanical Reliability & 12-Month Repair Risk Exposure for both vehicles
  const riskA = useMemo(
    () => computeReliabilityAndRisk(vehicleA, odoA, scheduleMode, urbanTripSharePct, workshopTier),
    [vehicleA, odoA, scheduleMode, urbanTripSharePct, workshopTier]
  );

  const riskB = useMemo(
    () => computeReliabilityAndRisk(vehicleB, odoA, scheduleMode, urbanTripSharePct, workshopTier),
    [vehicleB, odoA, scheduleMode, urbanTripSharePct, workshopTier]
  );

  // Financial & Mechanical Deltas
  // Savings convention: Positive monthlySavingsB means Vehicle B is CHEAPER than Vehicle A
  const monthlySavingsB = tcoA.monthlyEconomicCostUsd - tcoB.monthlyEconomicCostUsd;
  const monthlyCostDeltaB = tcoB.monthlyEconomicCostUsd - tcoA.monthlyEconomicCostUsd;
  const total5YrSavingsB = tcoA.totalEconomicCostUsd - tcoB.totalEconomicCostUsd;
  const fuelDiffMonthly = Math.round((tcoA.totalFuelUsd - tcoB.totalFuelUsd) / (horizonYears * 12));
  const depreciationDiffTotal = tcoA.totalDepreciationUsd - tcoB.totalDepreciationUsd;
  const maintenanceDiffTotal = tcoA.totalMaintenanceUsd - tcoB.totalMaintenanceUsd;

  // Reliability & Repair Risk Deltas (Vehicle B relative to Vehicle A)
  const reliabilityDeltaB = riskB.reliabilityScore - riskA.reliabilityScore;
  const riskExposureDeltaB = riskB.serviceReserveUsd - riskA.serviceReserveUsd;
  const alertCountA = riskA.criticalCount + riskA.warningCount;
  const alertCountB = riskB.criticalCount + riskB.warningCount;
  const alertDeltaB = alertCountB - alertCountA;

  const handlePromoteVehicleB = () => {
    const oldPrimary = primaryPresetId;
    const newPrimary = vehicleBId;
    if (onApplyPreset) {
      onApplyPreset(newPrimary);
    }
    setVehicleBId(oldPrimary);
  };

  const quickBenchmarkPairs = [
    { label: 'Diesel vs Hybrid', idA: 'ford-focus-ecoblue', idB: 'toyota-camry-hybrid' },
    { label: 'Petrol vs Pure EV', idA: 'bmw-330i-g20', idB: 'tesla-model-3-lr' },
    { label: 'Work Truck vs Van', idA: 'ford-f150-ecoboost', idB: 'ford-transit-ecoblue' },
    { label: 'Compact vs Executive', idA: 'vw-golf-20-tdi', idB: 'bmw-330i-g20' },
  ];

  return (
    <Card
      className="border border-primary-100 dark:border-slate-800 bg-surface dark:bg-slate-900 shadow-card"
      aria-labelledby="comparator-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary-50 dark:bg-primary-950/60 p-2 text-primary-600 dark:text-primary-400">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h2 id="comparator-heading" className="text-base sm:text-lg font-bold tracking-tight text-ink dark:text-slate-100">
              Dual-Vehicle Side-by-Side Comparison
            </h2>
            <p className="text-xs text-muted dark:text-slate-400">
              Compare 5-year carrying cost, mechanical reliability score, and 12-month repair risk exposure at {formatDistance(odoA)}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted dark:text-slate-400 hover:bg-surface-subtle dark:hover:bg-slate-800 hover:text-ink dark:hover:text-slate-100 transition-colors"
            aria-label="Close comparison drawer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Preset pair quick buttons */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[10px] font-code uppercase tracking-wider text-muted dark:text-slate-400 font-bold mr-1">
          POPULAR COMPARISONS:
        </span>
        {quickBenchmarkPairs.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              if (onApplyPreset) onApplyPreset(p.idA);
              setVehicleBId(p.idB);
            }}
            className="px-3 py-1 rounded-full font-code text-[11px] font-semibold transition-all border bg-surface-subtle dark:bg-slate-800/80 text-body dark:text-slate-300 border-border dark:border-slate-700 hover:border-primary-600 dark:hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main Comparative Cards */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {/* Vehicle A (Primary Active Vehicle) */}
        <div className="rounded-xl border border-border dark:border-slate-800 bg-surface-subtle dark:bg-slate-800/50 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <Pill tone="neutral" className="text-[10px] font-code font-bold uppercase">
                VEHICLE A (Current)
              </Pill>
              <span className="text-xs text-muted dark:text-slate-400 font-code">{vehicleA.fuelType}</span>
            </div>
            <h3 className="mt-2 text-base font-bold text-ink dark:text-slate-100 truncate" title={vehicleA.name}>
              {vehicleA.name}
            </h3>
            <p className="text-xs text-muted dark:text-slate-400 font-code">
              Purchase {formatCurrency(vehicleA.purchasePriceUsd)} · {vehicleA.powerHp ? `${vehicleA.powerHp} HP` : ''}
            </p>

            {/* Vehicle A Studio Silhouette */}
            <div className="mt-3 rounded-lg overflow-hidden bg-surface dark:bg-slate-900 aspect-[16/7] relative border border-border/50 dark:border-slate-800 flex items-center justify-center p-1.5 shadow-inner">
              <VehicleSilhouette vehicle={vehicleA} className="w-full h-full" interactive />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border dark:border-slate-700/80 space-y-3">
            <div>
              <p className="text-xs text-muted dark:text-slate-400">Monthly Carrying Cost</p>
              <p className="mt-0.5 text-3xl font-bold font-code tabular-nums text-ink dark:text-slate-100">
                {formatCurrency(tcoA.monthlyEconomicCostUsd)}
                <span className="text-sm font-normal text-muted dark:text-slate-400 font-body">/mo</span>
              </p>
              <p className="text-xs font-code text-muted dark:text-slate-400 mt-1">
                {formatCurrency(tcoA.totalEconomicCostUsd)} over {horizonYears} yrs
              </p>
            </div>

            {/* Reliability & Risk Sub-Grid for Vehicle A */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/60 dark:border-slate-700/60">
              <div className="rounded-lg bg-surface dark:bg-slate-900/90 p-2.5 border border-border/60 dark:border-slate-800">
                <span className="block text-[10px] font-code uppercase text-muted dark:text-slate-400">Reliability</span>
                <span className="mt-0.5 block text-sm font-bold font-code tabular-nums text-ink dark:text-slate-100">
                  {riskA.reliabilityScore}/100 <span className="text-[10px] font-normal text-muted dark:text-slate-400">pts</span>
                </span>
              </div>
              <div className="rounded-lg bg-surface dark:bg-slate-900/90 p-2.5 border border-border/60 dark:border-slate-800">
                <span className="block text-[10px] font-code uppercase text-muted dark:text-slate-400">Repair Risk</span>
                <span className="mt-0.5 block text-sm font-bold font-code tabular-nums text-ink dark:text-slate-100">
                  {formatCurrency(riskA.serviceReserveUsd)}
                </span>
              </div>
              <div className="rounded-lg bg-surface dark:bg-slate-900/90 p-2.5 border border-border/60 dark:border-slate-800">
                <span className="block text-[10px] font-code uppercase text-muted dark:text-slate-400">Wear Alerts</span>
                <span className="mt-0.5 block text-xs font-bold font-code tabular-nums text-ink dark:text-slate-100">
                  {riskA.criticalCount} Crit · {riskA.warningCount} Warn
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle B (Counterpart Vehicle) */}
        <div className="rounded-xl border-2 border-primary-600/30 dark:border-primary-500/40 bg-primary-50/30 dark:bg-slate-800/70 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <Pill tone="brand" className="text-[10px] font-code font-bold uppercase">
                VEHICLE B (Counterpart)
              </Pill>
              <select
                value={vehicleBId}
                onChange={(e) => setVehicleBId(e.target.value)}
                aria-label="Select counterpart vehicle B"
                className="text-xs font-medium rounded-lg border border-border dark:border-slate-700 bg-surface dark:bg-slate-900 px-2.5 py-1 text-ink dark:text-slate-100 focus:outline-none focus:border-primary-600"
              >
                {VEHICLE_PRESETS.filter((p) => p.id !== primaryPresetId).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.fuelType})
                  </option>
                ))}
              </select>
            </div>
            <h3 className="mt-2 text-base font-bold text-ink dark:text-slate-100 truncate" title={vehicleB.name}>
              {vehicleB.name}
            </h3>
            <p className="text-xs text-muted dark:text-slate-400 font-code">
              Purchase {formatCurrency(vehicleB.purchasePriceUsd)} · {vehicleB.powerHp ? `${vehicleB.powerHp} HP` : ''}
            </p>

            {/* Vehicle B Studio Silhouette */}
            <div className="mt-3 rounded-lg overflow-hidden bg-surface dark:bg-slate-900 aspect-[16/7] relative border border-border/50 dark:border-slate-800 flex items-center justify-center p-1.5 shadow-inner">
              <VehicleSilhouette vehicle={vehicleB} className="w-full h-full" interactive />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-primary-100 dark:border-slate-700/80 space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted dark:text-slate-400">Monthly Carrying Cost</p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-code font-bold tabular-nums ${
                    monthlyCostDeltaB <= 0
                      ? 'bg-success-bg text-success-text dark:bg-emerald-950/70 dark:text-emerald-300'
                      : 'bg-warning-bg text-warning-text dark:bg-amber-950/70 dark:text-amber-300'
                  }`}
                >
                  {monthlyCostDeltaB <= 0
                    ? `-${formatCurrency(Math.abs(monthlyCostDeltaB))}/mo`
                    : `+${formatCurrency(monthlyCostDeltaB)}/mo`}
                </span>
              </div>
              <p className="mt-0.5 text-3xl font-bold font-code tabular-nums text-primary-700 dark:text-primary-400">
                {formatCurrency(tcoB.monthlyEconomicCostUsd)}
                <span className="text-sm font-normal text-muted dark:text-slate-400 font-body">/mo</span>
              </p>
              <p className="text-xs font-code text-muted dark:text-slate-400 mt-1">
                {formatCurrency(tcoB.totalEconomicCostUsd)} over {horizonYears} yrs
              </p>
            </div>

            {/* Reliability & Risk Sub-Grid for Vehicle B with Delta Badges */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-primary-100/80 dark:border-slate-700/60">
              <div className="rounded-lg bg-surface dark:bg-slate-900/90 p-2.5 border border-border/60 dark:border-slate-800">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-code uppercase text-muted dark:text-slate-400">Reliability</span>
                  <span
                    className={`text-[10px] font-code font-bold tabular-nums ${
                      reliabilityDeltaB >= 0
                        ? 'text-success-text dark:text-emerald-400'
                        : 'text-danger-text dark:text-rose-400'
                    }`}
                  >
                    {reliabilityDeltaB >= 0 ? `+${reliabilityDeltaB}` : reliabilityDeltaB} pts
                  </span>
                </div>
                <span className="mt-0.5 block text-sm font-bold font-code tabular-nums text-ink dark:text-slate-100">
                  {riskB.reliabilityScore}/100 <span className="text-[10px] font-normal text-muted dark:text-slate-400">pts</span>
                </span>
              </div>

              <div className="rounded-lg bg-surface dark:bg-slate-900/90 p-2.5 border border-border/60 dark:border-slate-800">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-code uppercase text-muted dark:text-slate-400">Repair Risk</span>
                  <span
                    className={`text-[10px] font-code font-bold tabular-nums ${
                      riskExposureDeltaB <= 0
                        ? 'text-success-text dark:text-emerald-400'
                        : 'text-danger-text dark:text-rose-400'
                    }`}
                  >
                    {riskExposureDeltaB <= 0
                      ? `-${formatCurrency(Math.abs(riskExposureDeltaB))}`
                      : `+${formatCurrency(riskExposureDeltaB)}`}
                  </span>
                </div>
                <span className="mt-0.5 block text-sm font-bold font-code tabular-nums text-ink dark:text-slate-100">
                  {formatCurrency(riskB.serviceReserveUsd)}
                </span>
              </div>

              <div className="rounded-lg bg-surface dark:bg-slate-900/90 p-2.5 border border-border/60 dark:border-slate-800">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-code uppercase text-muted dark:text-slate-400">Wear Alerts</span>
                  <span
                    className={`text-[10px] font-code font-bold tabular-nums ${
                      alertDeltaB <= 0
                        ? 'text-success-text dark:text-emerald-400'
                        : 'text-danger-text dark:text-rose-400'
                    }`}
                  >
                    {alertDeltaB <= 0 ? `${alertDeltaB}` : `+${alertDeltaB}`}
                  </span>
                </div>
                <span className="mt-0.5 block text-xs font-bold font-code tabular-nums text-ink dark:text-slate-100">
                  {riskB.criticalCount} Crit · {riskB.warningCount} Warn
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delta Callout Banner */}
      <div
        className={`mt-5 rounded-xl p-4.5 border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${
          monthlySavingsB >= 0
            ? 'bg-success-bg dark:bg-emerald-950/30 border-[#BFE8CF] dark:border-emerald-800/60 text-success-text dark:text-emerald-300'
            : 'bg-warning-bg dark:bg-amber-950/30 border-[#F5DE8A] dark:border-amber-800/60 text-warning-text dark:text-amber-300'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`rounded-full p-2 text-white shrink-0 ${
              monthlySavingsB >= 0 ? 'bg-score-good' : 'bg-score-fair'
            }`}
          >
            {monthlySavingsB >= 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-ink dark:text-slate-100">
              {monthlySavingsB >= 0
                ? `+${formatCurrency(monthlySavingsB)}/mo savings with ${vehicleB.name}`
                : `${vehicleB.name} costs +${formatCurrency(Math.abs(monthlySavingsB))} more per month`}
            </p>
            <p className="text-xs font-code opacity-90 mt-0.5 text-ink/80 dark:text-slate-300">
              {total5YrSavingsB >= 0
                ? `Net 5-year financial savings: ${formatCurrency(total5YrSavingsB)}`
                : `Net 5-year additional cost: +${formatCurrency(Math.abs(total5YrSavingsB))}`}
              {' · '}Fuel divergence: {fuelDiffMonthly >= 0 ? `-${formatCurrency(fuelDiffMonthly)}/mo` : `+${formatCurrency(Math.abs(fuelDiffMonthly))}/mo`}
              {' · '}Depreciation gap: {depreciationDiffTotal >= 0 ? `-${formatCurrency(depreciationDiffTotal)}` : `+${formatCurrency(Math.abs(depreciationDiffTotal))}`}
            </p>

            {/* Side-by-Side Delta Badges Row */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 dark:bg-slate-900/90 px-2.5 py-0.5 text-[11px] font-code font-semibold text-ink dark:text-slate-200 border border-border/80 dark:border-slate-700 tabular-nums">
                {monthlyCostDeltaB <= 0
                  ? `-${formatCurrency(Math.abs(monthlyCostDeltaB))}/mo TCO`
                  : `+${formatCurrency(monthlyCostDeltaB)}/mo TCO`}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 dark:bg-slate-900/90 px-2.5 py-0.5 text-[11px] font-code font-semibold text-ink dark:text-slate-200 border border-border/80 dark:border-slate-700 tabular-nums">
                <ShieldCheck className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                {reliabilityDeltaB >= 0 ? `+${reliabilityDeltaB} pts Reliability` : `${reliabilityDeltaB} pts Reliability`}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 dark:bg-slate-900/90 px-2.5 py-0.5 text-[11px] font-code font-semibold text-ink dark:text-slate-200 border border-border/80 dark:border-slate-700 tabular-nums">
                <Wrench className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                {riskExposureDeltaB <= 0
                  ? `-${formatCurrency(Math.abs(riskExposureDeltaB))} Risk Exposure`
                  : `+${formatCurrency(riskExposureDeltaB)} Risk Exposure`}
              </span>
            </div>
          </div>
        </div>

        {onApplyPreset && (
          <button
            type="button"
            onClick={handlePromoteVehicleB}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-surface dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-ink dark:text-slate-100 shadow-sm border border-border-strong dark:border-slate-700 hover:bg-surface-subtle dark:hover:bg-slate-800 transition-all"
          >
            <span>Set Vehicle B as Primary</span>
            <ArrowRight className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
          </button>
        )}
      </div>

      {/* Detailed Side-by-Side Breakdown Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border dark:border-slate-800 bg-surface-subtle dark:bg-slate-800/70 text-xs font-semibold text-muted dark:text-slate-400 uppercase font-code">
              <th className="py-3 px-3">Expense &amp; Telemetry Category</th>
              <th className="py-3 px-3 text-right">Vehicle A</th>
              <th className="py-3 px-3 text-right">Vehicle B</th>
              <th className="py-3 px-3 text-right">Side-by-Side Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-slate-800 font-code text-xs text-body dark:text-slate-300">
            <tr>
              <td className="py-3 px-3 font-body text-xs font-medium text-ink dark:text-slate-200">Purchase Price</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(priceA)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(vehicleB.purchasePriceUsd)}</td>
              <td className="py-3 px-3 text-right tabular-nums font-semibold text-ink dark:text-slate-100">
                {vehicleB.purchasePriceUsd - priceA >= 0 ? '+' : ''}
                {formatCurrency(vehicleB.purchasePriceUsd - priceA)}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-3 font-body text-xs font-medium text-ink dark:text-slate-200">5-Year Depreciation Loss</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(tcoA.totalDepreciationUsd)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(tcoB.totalDepreciationUsd)}</td>
              <td
                className={`py-3 px-3 text-right tabular-nums font-semibold ${
                  depreciationDiffTotal >= 0
                    ? 'text-success-text dark:text-emerald-400'
                    : 'text-danger-text dark:text-rose-400'
                }`}
              >
                {depreciationDiffTotal >= 0 ? '-' : '+'}
                {formatCurrency(Math.abs(depreciationDiffTotal))}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-3 font-body text-xs font-medium text-ink dark:text-slate-200">
                Fuel / Energy Expense ({horizonYears} yrs)
              </td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(tcoA.totalFuelUsd)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(tcoB.totalFuelUsd)}</td>
              <td
                className={`py-3 px-3 text-right tabular-nums font-semibold ${
                  tcoA.totalFuelUsd - tcoB.totalFuelUsd >= 0
                    ? 'text-success-text dark:text-emerald-400'
                    : 'text-danger-text dark:text-rose-400'
                }`}
              >
                {tcoA.totalFuelUsd - tcoB.totalFuelUsd >= 0 ? '-' : '+'}
                {formatCurrency(Math.abs(tcoA.totalFuelUsd - tcoB.totalFuelUsd))}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-3 font-body text-xs font-medium text-ink dark:text-slate-200">
                Maintenance &amp; Wear Reserve
              </td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(tcoA.totalMaintenanceUsd)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(tcoB.totalMaintenanceUsd)}</td>
              <td
                className={`py-3 px-3 text-right tabular-nums font-semibold ${
                  maintenanceDiffTotal >= 0
                    ? 'text-success-text dark:text-emerald-400'
                    : 'text-danger-text dark:text-rose-400'
                }`}
              >
                {maintenanceDiffTotal >= 0 ? '-' : '+'}
                {formatCurrency(Math.abs(maintenanceDiffTotal))}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-3 font-body text-xs font-medium text-ink dark:text-slate-200">
                Insurance ({horizonYears} yrs)
              </td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(tcoA.totalInsuranceUsd)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(tcoB.totalInsuranceUsd)}</td>
              <td className="py-3 px-3 text-right tabular-nums">
                {tcoB.totalInsuranceUsd - tcoA.totalInsuranceUsd >= 0 ? '+' : ''}
                {formatCurrency(tcoB.totalInsuranceUsd - tcoA.totalInsuranceUsd)}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-3 font-body text-xs font-medium text-ink dark:text-slate-200">
                Reliability Score (0–100 pts)
              </td>
              <td className="py-3 px-3 text-right tabular-nums font-semibold text-ink dark:text-slate-200">
                {riskA.reliabilityScore} pts
              </td>
              <td className="py-3 px-3 text-right tabular-nums font-semibold text-ink dark:text-slate-200">
                {riskB.reliabilityScore} pts
              </td>
              <td
                className={`py-3 px-3 text-right tabular-nums font-semibold ${
                  reliabilityDeltaB >= 0
                    ? 'text-success-text dark:text-emerald-400'
                    : 'text-danger-text dark:text-rose-400'
                }`}
              >
                {reliabilityDeltaB >= 0 ? `+${reliabilityDeltaB} pts` : `${reliabilityDeltaB} pts`}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-3 font-body text-xs font-medium text-ink dark:text-slate-200">
                Expected Repair Risk Exposure (12-Mo Reserve)
              </td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(riskA.serviceReserveUsd)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(riskB.serviceReserveUsd)}</td>
              <td
                className={`py-3 px-3 text-right tabular-nums font-semibold ${
                  riskExposureDeltaB <= 0
                    ? 'text-success-text dark:text-emerald-400'
                    : 'text-danger-text dark:text-rose-400'
                }`}
              >
                {riskExposureDeltaB <= 0
                  ? `-${formatCurrency(Math.abs(riskExposureDeltaB))}`
                  : `+${formatCurrency(riskExposureDeltaB)}`}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-3 font-body text-xs font-medium text-ink dark:text-slate-200">
                Critical / Warning Components
              </td>
              <td className="py-3 px-3 text-right tabular-nums">
                {riskA.criticalCount} Critical · {riskA.warningCount} Warning
              </td>
              <td className="py-3 px-3 text-right tabular-nums">
                {riskB.criticalCount} Critical · {riskB.warningCount} Warning
              </td>
              <td
                className={`py-3 px-3 text-right tabular-nums font-semibold ${
                  alertDeltaB <= 0
                    ? 'text-success-text dark:text-emerald-400'
                    : 'text-danger-text dark:text-rose-400'
                }`}
              >
                {alertDeltaB === 0 ? '0 alerts' : alertDeltaB > 0 ? `+${alertDeltaB} alerts` : `${alertDeltaB} alerts`}
              </td>
            </tr>
            <tr className="bg-surface-subtle dark:bg-slate-800/80 font-semibold text-xs">
              <td className="py-3 px-3 font-body font-bold text-ink dark:text-slate-100">
                Total 5-Year True Cost to Own
              </td>
              <td className="py-3 px-3 text-right tabular-nums font-bold text-ink dark:text-slate-100">
                {formatCurrency(tcoA.totalEconomicCostUsd)} ({formatCurrency(tcoA.monthlyEconomicCostUsd)}/mo)
              </td>
              <td className="py-3 px-3 text-right tabular-nums font-bold text-ink dark:text-slate-100">
                {formatCurrency(tcoB.totalEconomicCostUsd)} ({formatCurrency(tcoB.monthlyEconomicCostUsd)}/mo)
              </td>
              <td
                className={`py-3 px-3 text-right tabular-nums font-bold ${
                  total5YrSavingsB >= 0
                    ? 'text-success-text dark:text-emerald-400'
                    : 'text-danger-text dark:text-rose-400'
                }`}
              >
                {total5YrSavingsB >= 0
                  ? `-${formatCurrency(total5YrSavingsB)}`
                  : `+${formatCurrency(Math.abs(total5YrSavingsB))}`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

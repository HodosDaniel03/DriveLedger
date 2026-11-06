import React, { useState, useMemo } from 'react';
import {
  GitCompare,
  TrendingDown,
  TrendingUp,
  Check,
  ArrowRight,
  X,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  Zap,
  Fuel,
  Car,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { VEHICLE_PRESETS, getPresetById } from '../../data/vehiclePresets';
import {
  MAINTENANCE_COMPONENTS,
  evaluateComponentHealth,
  calculateOemRiskMultiplier,
} from '../../data/maintenanceData';
import { calculateTcoProjection } from './TcoCalculator';
import { findEngineVariant, getKnownIssuesForVehicle } from '../../data/vehicles/index.js';
import { useUnits } from '../../context/UnitContext';
import { useGarage } from '../../context/GarageContext';
import { Card, Pill, TldrVerdictBox, RiskBadge } from '../common/OdometerPrimitives';
import VehicleImageResolver from '../common/vehicle/VehicleImageResolver.jsx';
import AffiliateCTA from '../monetization/AffiliateCTA';
import AdUnit from '../monetization/AdUnit';
import { computeBreakEvenTrajectory } from '../../data/breakEvenAndPpi.js';

export { computeBreakEvenTrajectory };

/**
 * Evaluates applicable mechanical assemblies for a vehicle preset
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
  secondaryPresetId,
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
  onSelectSecondaryPreset,
  standalone = false,
}) {
  const {
    currencySymbol,
    formatCurrency,
    formatDistance,
    region,
    distanceUnit,
    convertUsdToRegion,
    convertRegionToUsd,
    convertMilesToRegion,
    convertRegionToMiles,
  } = useUnits();
  const garage = useGarage();

  const [activePresetAId, setActivePresetAId] = useState(() => primaryPresetId || VEHICLE_PRESETS[0].id);
  const vehicleA = useMemo(() => getPresetById(activePresetAId) || VEHICLE_PRESETS[0], [activePresetAId]);

  const [vehicleBId, setVehicleBId] = useState(() => {
    if (
      secondaryPresetId &&
      secondaryPresetId !== (primaryPresetId || VEHICLE_PRESETS[0].id) &&
      VEHICLE_PRESETS.some((p) => p.id === secondaryPresetId)
    ) {
      return secondaryPresetId;
    }
    if (activePresetAId === 'toyota-camry-hybrid') return 'ford-focus-ecoblue';
    if (vehicleA.fuelType === 'Diesel') return 'toyota-camry-hybrid';
    if (vehicleA.isEv) return 'bmw-330i-g20';
    return 'tesla-model-3-lr';
  });

  // Editable custom listing price & odometer overrides for Vehicle A and Vehicle B
  const [customPriceAUsd, setCustomPriceAUsd] = useState(null);
  const [customOdoAMiles, setCustomOdoAMiles] = useState(null);
  const [customPriceBUsd, setCustomPriceBUsd] = useState(null);
  const [customOdoBMiles, setCustomOdoBMiles] = useState(null);

  const updateVehicleB = (nextBId) => {
    setVehicleBId(nextBId);
    setCustomPriceBUsd(null);
    setCustomOdoBMiles(null);
    if (typeof onSelectSecondaryPreset === 'function') {
      onSelectSecondaryPreset(nextBId);
    }
  };

  // Keep Vehicle A in sync if prop changes
  React.useEffect(() => {
    if (primaryPresetId && primaryPresetId !== activePresetAId) {
      setActivePresetAId(primaryPresetId);
      setCustomPriceAUsd(null);
      setCustomOdoAMiles(null);
    }
  }, [primaryPresetId]);

  // Keep Vehicle B in sync if secondaryPresetId prop changes (e.g. /compare/:carA-vs-:carB route)
  React.useEffect(() => {
    if (
      secondaryPresetId &&
      secondaryPresetId !== activePresetAId &&
      secondaryPresetId !== vehicleBId &&
      VEHICLE_PRESETS.some((p) => p.id === secondaryPresetId)
    ) {
      setVehicleBId(secondaryPresetId);
      setCustomPriceBUsd(null);
      setCustomOdoBMiles(null);
    }
  }, [secondaryPresetId, activePresetAId]);

  // Prevent Vehicle B from ever being identical to Vehicle A
  React.useEffect(() => {
    if (vehicleBId === activePresetAId) {
      const fallback = VEHICLE_PRESETS.find((p) => p.id !== activePresetAId);
      if (fallback) updateVehicleB(fallback.id);
    }
  }, [activePresetAId, vehicleBId]);

  const vehicleB = useMemo(() => getPresetById(vehicleBId) || VEHICLE_PRESETS[1], [vehicleBId]);

  // Telemetry parameters for Vehicle A & Vehicle B
  const resolvedPrimaryPrice = primaryPurchasePriceUsd ?? primaryPriceUsd;
  const resolvedAnnualMiles = Number(primaryAnnualMiles) > 0 ? Number(primaryAnnualMiles) : annualDistanceMiles;
  const basePriceA = Number(resolvedPrimaryPrice) > 0 ? Number(resolvedPrimaryPrice) : vehicleA.purchasePriceUsd;
  const baseOdoA =
    standalone && customOdoAMiles === null
      ? (vehicleA.defaultOdometerMiles || 62000)
      : Number(primaryOdometerMiles) >= 0
      ? Number(primaryOdometerMiles)
      : (vehicleA.defaultOdometerMiles || 62000);

  const priceA = customPriceAUsd !== null ? customPriceAUsd : basePriceA;
  const odoA = customOdoAMiles !== null ? customOdoAMiles : baseOdoA;
  const priceB = customPriceBUsd !== null ? customPriceBUsd : vehicleB.purchasePriceUsd;
  const odoB = customOdoBMiles !== null ? customOdoBMiles : (vehicleB.defaultOdometerMiles || 58000);

  const mpgA = Number(primaryMpgUs) > 0 ? Number(primaryMpgUs) : vehicleA.mpgUs;
  const fuelPriceA = Number(primaryFuelPriceUsdGal) > 0 ? Number(primaryFuelPriceUsdGal) : vehicleA.defaultFuelPriceUsdGal;
  const insuranceA = Number(primaryInsuranceUsd) >= 0 ? Number(primaryInsuranceUsd) : vehicleA.annualInsuranceUsd;

  // Calculate TCO projections for both vehicles
  const tcoA = useMemo(() => {
    if (
      primaryTco &&
      customPriceAUsd === null &&
      customOdoAMiles === null &&
      primaryTco.yearlySchedule?.length === horizonYears &&
      activePresetAId === primaryPresetId
    ) {
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
    customPriceAUsd,
    customOdoAMiles,
    activePresetAId,
    primaryPresetId,
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
      purchasePriceUsd: priceB,
      odometerMiles: odoB,
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
  }, [vehicleB, priceB, odoB, resolvedAnnualMiles, horizonYears, downPaymentPct, aprPct, loanTermMonths]);

  // Compute Break-even Trajectory across mileage using live custom prices & odometers
  const breakEvenTrajectory = useMemo(() => {
    return computeBreakEvenTrajectory(
      { ...vehicleA, purchasePriceUsd: priceA, defaultOdometerMiles: odoA },
      { ...vehicleB, purchasePriceUsd: priceB, defaultOdometerMiles: odoB },
      {
        horizonYears,
        annualDistanceMiles: resolvedAnnualMiles,
      }
    );
  }, [vehicleA, vehicleB, priceA, odoA, priceB, odoB, horizonYears, resolvedAnnualMiles]);

  // Known Issues comparison for Vehicle A and Vehicle B at active odometer
  const currentKm = Math.round(odoA * 1.609344);

  const knownIssuesA = useMemo(() => {
    const engineVariant = findEngineVariant(vehicleA.id);
    return engineVariant
      ? [...(engineVariant.engine?.knownIssues || []), ...(engineVariant.generation?.modelKnownIssues || [])]
      : getKnownIssuesForVehicle({ brandId: vehicleA.brand, modelId: vehicleA.modelName });
  }, [vehicleA]);

  const knownIssuesB = useMemo(() => {
    const engineVariant = findEngineVariant(vehicleB.id);
    return engineVariant
      ? [...(engineVariant.engine?.knownIssues || []), ...(engineVariant.generation?.modelKnownIssues || [])]
      : getKnownIssuesForVehicle({ brandId: vehicleB.brand, modelId: vehicleB.modelName });
  }, [vehicleB]);

  // Calculate Mechanical Reliability & 12-Month Repair Risk Exposure for both vehicles
  const riskA = useMemo(
    () => computeReliabilityAndRisk(vehicleA, odoA, scheduleMode, urbanTripSharePct, workshopTier),
    [vehicleA, odoA, scheduleMode, urbanTripSharePct, workshopTier]
  );

  const riskB = useMemo(
    () => computeReliabilityAndRisk(vehicleB, odoB, scheduleMode, urbanTripSharePct, workshopTier),
    [vehicleB, odoB, scheduleMode, urbanTripSharePct, workshopTier]
  );

  // Financial & Mechanical Deltas
  const monthlySavingsB = tcoA.monthlyEconomicCostUsd - tcoB.monthlyEconomicCostUsd;
  const monthlyCostDeltaB = tcoB.monthlyEconomicCostUsd - tcoA.monthlyEconomicCostUsd;
  const total5YrSavingsB = tcoA.totalEconomicCostUsd - tcoB.totalEconomicCostUsd;
  const fuelDiffMonthly = Math.round((tcoA.totalFuelUsd - tcoB.totalFuelUsd) / (horizonYears * 12));
  const depreciationDiffTotal = tcoA.totalDepreciationUsd - tcoB.totalDepreciationUsd;
  const maintenanceDiffTotal = tcoA.totalMaintenanceUsd - tcoB.totalMaintenanceUsd;

  // Reliability & Repair Risk Deltas
  const reliabilityDeltaB = riskB.reliabilityScore - riskA.reliabilityScore;
  const riskExposureDeltaB = riskB.serviceReserveUsd - riskA.serviceReserveUsd;
  const alertCountA = riskA.criticalCount + riskA.warningCount;
  const alertCountB = riskB.criticalCount + riskB.warningCount;
  const alertDeltaB = alertCountB - alertCountA;

  const handlePromoteVehicleB = () => {
    const oldPrimary = activePresetAId;
    const newPrimary = vehicleBId;
    if (onApplyPreset) {
      onApplyPreset(newPrimary);
    }
    setActivePresetAId(newPrimary);
    setCustomPriceAUsd(customPriceBUsd);
    setCustomOdoAMiles(customOdoBMiles);
    updateVehicleB(oldPrimary);
  };

  const quickBenchmarkPairs = [
    { label: 'Diesel vs Hybrid', idA: 'ford-focus-ecoblue', idB: 'toyota-camry-hybrid' },
    { label: 'Petrol vs Pure EV', idA: 'bmw-330i-g20', idB: 'tesla-model-3-lr' },
    { label: 'Compact vs Executive', idA: 'vw-golf-20-tdi', idB: 'bmw-320d-b47' },
    { label: 'Family Hybrid vs Kia EV6', idA: 'toyota-corolla-18-hybrid', idB: 'kia-ev6-long-range' },
  ];

  const comparatorTldrFacts = useMemo(() => [
    {
      label: '5-Year Cost Differential',
      value: monthlySavingsB >= 0
        ? `${vehicleB.name} is cheaper`
        : `${vehicleA.name} is cheaper`,
      subtext: `Monthly delta: ${formatCurrency(Math.abs(monthlySavingsB))}/mo · 5-yr net difference: ${formatCurrency(Math.abs(total5YrSavingsB))}.`,
      badge: (
        <RiskBadge
          level={Math.abs(monthlySavingsB) > 100 ? 'low' : 'moderate'}
          label="Winner · Lower TCO"
        />
      ),
    },
    {
      label: 'Break-Even Payback Distance',
      value: breakEvenTrajectory.status === 'crossover'
        ? `${(region === 'EU' ? breakEvenTrajectory.breakEvenKm : breakEvenTrajectory.breakEvenMiles).toLocaleString()} ${distanceUnit} (${breakEvenTrajectory.breakEvenYears} yrs)`
        : breakEvenTrajectory.status === 'b_always_cheaper'
        ? `${vehicleB.name} cheaper from mile zero`
        : `${vehicleA.name} cheaper across all miles`,
      subtext: breakEvenTrajectory.status === 'crossover'
        ? 'Lower running costs offset upfront premium at this distance.'
        : 'No crossover point within analyzed mileage range.',
      badge: (
        <RiskBadge
          level={breakEvenTrajectory.status === 'crossover' && breakEvenTrajectory.breakEvenYears <= 4 ? 'low' : 'moderate'}
          label={breakEvenTrajectory.status === 'crossover' ? `${breakEvenTrajectory.breakEvenYears}-Yr Payback` : 'Dominant Choice'}
        />
      ),
    },
    {
      label: 'Reliability Risk & Service Buffer',
      value: `${formatCurrency(riskA.serviceReserveUsd)} vs ${formatCurrency(riskB.serviceReserveUsd)}`,
      subtext: riskExposureDeltaB <= 0
        ? `${vehicleB.name} requires ${formatCurrency(Math.abs(riskExposureDeltaB))} lower service buffer.`
        : `${vehicleA.name} requires ${formatCurrency(Math.abs(riskExposureDeltaB))} lower service buffer.`,
      badge: (
        <RiskBadge
          level={Math.abs(riskExposureDeltaB) > 600 ? 'critical' : 'low'}
          label={riskExposureDeltaB <= 0 ? 'B Lower Service' : 'A Lower Service'}
        />
      ),
    },
  ], [monthlySavingsB, total5YrSavingsB, vehicleA.name, vehicleB.name, formatCurrency, riskA, riskB, riskExposureDeltaB, breakEvenTrajectory, region, distanceUnit]);

  // SVG Chart Dimensions & Scales
  const svgWidth = 620;
  const svgHeight = 220;
  const padding = { top: 25, right: 30, bottom: 35, left: 55 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const points = breakEvenTrajectory.points;
  const maxDist = points[points.length - 1].distMiles;
  const maxCost = Math.max(
    ...points.map((p) => p.costA),
    ...points.map((p) => p.costB)
  ) * 1.08;
  const minCost = Math.min(
    ...points.map((p) => p.costA),
    ...points.map((p) => p.costB)
  ) * 0.85;

  const getX = (distMiles) => padding.left + (distMiles / maxDist) * graphWidth;
  const getY = (cost) => padding.top + graphHeight - ((cost - minCost) / (maxCost - minCost)) * graphHeight;

  const pathD_A = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.distMiles).toFixed(1)} ${getY(p.costA).toFixed(1)}`)
    .join(' ');

  const pathD_B = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.distMiles).toFixed(1)} ${getY(p.costB).toFixed(1)}`)
    .join(' ');

  // User current 5-year point X coordinate
  const userX = getX(Math.min(maxDist, breakEvenTrajectory.user5YrMiles));

  // Break-even X coordinate if crossover exists
  const crossX = breakEvenTrajectory.breakEvenMiles ? getX(Math.min(maxDist, breakEvenTrajectory.breakEvenMiles)) : null;

  return (
    <Card
      className="border border-primary-100 dark:border-zinc-800 bg-surface dark:bg-[#121215] shadow-card space-y-6"
      aria-labelledby="comparator-heading"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border dark:border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-xl bg-primary-50 dark:bg-primary-950/60 p-2.5 text-primary-600 dark:text-primary-400">
            <GitCompare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 id="comparator-heading" className="text-base sm:text-lg font-sans font-bold tracking-tight text-ink dark:text-zinc-50 scroll-mt-28 lg:scroll-mt-32">
              Dual-Vehicle Side-by-Side Comparison
            </h2>
            <p className="text-xs font-sans font-medium text-muted dark:text-zinc-400">
              5-year TCO comparison, dynamic break-even crossover trajectory, and odometer-calibrated known flaws.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted dark:text-zinc-400 hover:bg-surface-subtle dark:hover:bg-zinc-900 hover:text-ink dark:hover:text-zinc-50 transition-colors"
            aria-label="Close comparison drawer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Comparison Summary Box */}
      <TldrVerdictBox
        title="Comparison Summary"
        subtitle="3 key comparative metrics at a glance (zero fluff)"
        badge="Decision Balance"
        facts={comparatorTldrFacts}
      />

      {/* My Garage Multi-Vehicle Comparison Strip (when 2+ cars saved) */}
      {garage?.savedVehicles && garage.savedVehicles.length >= 2 && (
        <div
          data-testid="garage-comparison-strip"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 px-4 py-2.5 text-xs font-sans"
        >
          <div className="flex items-center gap-2 text-ink dark:text-zinc-50">
            <Car className="w-4 h-4 text-primary-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>My Garage ({garage.savedVehicles.length} saved):</strong> Compare your top 2 parked candidates side-by-side.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const first = garage.savedVehicles[0];
              const second = garage.savedVehicles.find((v) => v.presetId !== first.presetId) || garage.savedVehicles[1];
              if (first?.presetId) {
                setActivePresetAId(first.presetId);
                setCustomPriceAUsd(Number(first.purchasePriceUsd) > 0 ? Number(first.purchasePriceUsd) : null);
                setCustomOdoAMiles(Number(first.odometerMiles) >= 0 ? Number(first.odometerMiles) : null);
                if (onApplyPreset) onApplyPreset(first.presetId);
              }
              if (second?.presetId && second.presetId !== first?.presetId) {
                setVehicleBId(second.presetId);
                setCustomPriceBUsd(Number(second.purchasePriceUsd) > 0 ? Number(second.purchasePriceUsd) : null);
                setCustomOdoBMiles(Number(second.odometerMiles) >= 0 ? Number(second.odometerMiles) : null);
                if (typeof onSelectSecondaryPreset === 'function') onSelectSecondaryPreset(second.presetId);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-1.5 text-[11px] font-sans font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            <span>Load My Garage Pair</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Popular Preset Pairs Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[11px] font-sans font-semibold text-muted dark:text-zinc-400 mr-1">
          Popular matchups:
        </span>
        {quickBenchmarkPairs.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setActivePresetAId(p.idA);
              setCustomPriceAUsd(null);
              setCustomOdoAMiles(null);
              if (onApplyPreset) onApplyPreset(p.idA);
              updateVehicleB(p.idB);
            }}
            className="px-2.5 py-1 rounded-md font-sans text-[11px] font-medium transition-colors duration-150 border bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-primary-600 dark:hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Dual Vehicle Studio Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Vehicle A */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-5 flex flex-col justify-between min-w-0 overflow-hidden">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
              <Pill tone="neutral" className="shrink-0">
                VEHICLE A (Current)
              </Pill>
              <select
                value={activePresetAId}
                onChange={(e) => {
                  setActivePresetAId(e.target.value);
                  setCustomPriceAUsd(null);
                  setCustomOdoAMiles(null);
                  if (onApplyPreset) onApplyPreset(e.target.value);
                }}
                aria-label="Select primary vehicle"
                className="min-w-0 flex-1 max-w-[240px] truncate text-xs font-sans font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] px-2.5 py-1 text-ink dark:text-zinc-50 focus:outline-none focus:border-primary-600"
              >
                {VEHICLE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.fuelType})
                  </option>
                ))}
              </select>
            </div>
            <h3 className="mt-2 text-base font-sans font-bold tracking-tight text-ink dark:text-zinc-50 truncate" title={vehicleA.name}>
              {vehicleA.name}
            </h3>
            <p className="text-xs text-muted dark:text-zinc-400 font-sans font-medium">
              Purchase Price: <span className="font-mono tabular-nums">{formatCurrency(priceA)}</span> · {vehicleA.powerHp ? `${vehicleA.powerHp} HP` : ''} · {vehicleA.engineCode}
            </p>

            {/* Inline Listing Price & Odometer Overrides for Vehicle A */}
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <label className="flex items-center justify-between gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] px-2.5 py-1 text-[11px] font-sans font-medium">
                <span className="text-muted dark:text-zinc-400">Price ({currencySymbol})</span>
                <input
                  data-testid="comparator-price-a"
                  type="number"
                  min={500}
                  max={250000}
                  step={500}
                  value={Math.round(convertUsdToRegion(priceA))}
                  onChange={(e) => {
                    if (e.target.value === '') return;
                    setCustomPriceAUsd(convertRegionToUsd(Math.max(500, Number(e.target.value) || 500)));
                  }}
                  className="w-20 text-right bg-transparent outline-none font-mono font-semibold text-ink dark:text-zinc-50 tabular-nums"
                />
              </label>
              <label className="flex items-center justify-between gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] px-2.5 py-1 text-[11px] font-sans font-medium">
                <span className="text-muted dark:text-zinc-400">Odo ({distanceUnit})</span>
                <input
                  data-testid="comparator-odo-a"
                  type="number"
                  min={0}
                  max={500000}
                  step={1000}
                  value={Math.round(convertMilesToRegion(odoA))}
                  onChange={(e) => {
                    if (e.target.value === '') return;
                    setCustomOdoAMiles(convertRegionToMiles(Math.max(0, Number(e.target.value) || 0)));
                  }}
                  className="w-20 text-right bg-transparent outline-none font-mono font-semibold text-ink dark:text-zinc-50 tabular-nums"
                />
              </label>
            </div>

            <div className="mt-3 aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900 relative border border-zinc-200 dark:border-zinc-800 group">
              <VehicleImageResolver vehicle={vehicleA} variant="compact" className="w-full h-full" interactive />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <div>
              <p className="text-xs font-sans font-medium text-muted dark:text-zinc-400">Monthly True Operating Cost</p>
              <p className="mt-0.5 text-3xl font-bold font-mono tabular-nums text-ink dark:text-zinc-50">
                {formatCurrency(tcoA.monthlyEconomicCostUsd)}
                <span className="text-sm font-normal text-muted dark:text-zinc-400 font-sans">/mo</span>
              </p>
              <p className="text-xs font-sans font-medium text-muted dark:text-zinc-400 mt-1">
                <span className="font-mono tabular-nums">{formatCurrency(tcoA.totalEconomicCostUsd)}</span> over 5 yrs (at <span className="font-mono tabular-nums">{formatDistance(odoA)}</span>)
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-200/70 dark:border-zinc-800/80">
              <div className="rounded-lg bg-white dark:bg-[#121215] p-2 border border-zinc-200 dark:border-zinc-800">
                <span className="block text-[10px] font-sans font-medium text-muted dark:text-zinc-400">Reliability</span>
                <span className="mt-0.5 block text-sm font-bold font-mono tabular-nums text-ink dark:text-zinc-50">
                  {riskA.reliabilityScore}/100
                </span>
              </div>
              <div className="rounded-lg bg-white dark:bg-[#121215] p-2 border border-zinc-200 dark:border-zinc-800">
                <span className="block text-[10px] font-sans font-medium text-muted dark:text-zinc-400">Service Risk</span>
                <span className="mt-0.5 block text-sm font-bold font-mono tabular-nums text-ink dark:text-zinc-50">
                  {formatCurrency(riskA.serviceReserveUsd)}
                </span>
              </div>
              <div className="rounded-lg bg-white dark:bg-[#121215] p-2 border border-zinc-200 dark:border-zinc-800">
                <span className="block text-[10px] font-sans font-medium text-muted dark:text-zinc-400">Known Flaws</span>
                <span className="mt-0.5 block text-xs font-bold font-sans text-ink dark:text-zinc-50">
                  <span className="font-mono tabular-nums">{knownIssuesA.length}</span> documented
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle B */}
        <div className="rounded-xl border-2 border-primary-600/30 dark:border-primary-500/40 bg-primary-50/20 dark:bg-zinc-900/80 p-5 flex flex-col justify-between min-w-0 overflow-hidden">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
              <Pill tone="brand" className="shrink-0">
                VEHICLE B (Counterpart)
              </Pill>
              <select
                value={vehicleBId}
                onChange={(e) => updateVehicleB(e.target.value)}
                aria-label="Select comparison vehicle"
                className="min-w-0 flex-1 max-w-[240px] truncate text-xs font-sans font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] px-2.5 py-1 text-ink dark:text-zinc-50 focus:outline-none focus:border-primary-600"
              >
                {VEHICLE_PRESETS.filter((p) => p.id !== activePresetAId).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.fuelType})
                  </option>
                ))}
              </select>
            </div>
            <h3 className="mt-2 text-base font-sans font-bold tracking-tight text-ink dark:text-zinc-50 truncate" title={vehicleB.name}>
              {vehicleB.name}
            </h3>
            <p className="text-xs text-muted dark:text-zinc-400 font-sans font-medium">
              Purchase Price: <span className="font-mono tabular-nums">{formatCurrency(priceB)}</span> · {vehicleB.powerHp ? `${vehicleB.powerHp} HP` : ''} · {vehicleB.engineCode}
            </p>

            {/* Inline Listing Price & Odometer Overrides for Vehicle B */}
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <label className="flex items-center justify-between gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] px-2.5 py-1 text-[11px] font-sans font-medium">
                <span className="text-muted dark:text-zinc-400">Price ({currencySymbol})</span>
                <input
                  data-testid="comparator-price-b"
                  type="number"
                  min={500}
                  max={250000}
                  step={500}
                  value={Math.round(convertUsdToRegion(priceB))}
                  onChange={(e) => {
                    if (e.target.value === '') return;
                    setCustomPriceBUsd(convertRegionToUsd(Math.max(500, Number(e.target.value) || 500)));
                  }}
                  className="w-20 text-right bg-transparent outline-none font-mono font-semibold text-ink dark:text-zinc-50 tabular-nums"
                />
              </label>
              <label className="flex items-center justify-between gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] px-2.5 py-1 text-[11px] font-sans font-medium">
                <span className="text-muted dark:text-zinc-400">Odo ({distanceUnit})</span>
                <input
                  data-testid="comparator-odo-b"
                  type="number"
                  min={0}
                  max={500000}
                  step={1000}
                  value={Math.round(convertMilesToRegion(odoB))}
                  onChange={(e) => {
                    if (e.target.value === '') return;
                    setCustomOdoBMiles(convertRegionToMiles(Math.max(0, Number(e.target.value) || 0)));
                  }}
                  className="w-20 text-right bg-transparent outline-none font-mono font-semibold text-ink dark:text-zinc-50 tabular-nums"
                />
              </label>
            </div>

            <div className="mt-3 aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900 relative border border-zinc-200 dark:border-zinc-800 group">
              <VehicleImageResolver vehicle={vehicleB} variant="compact" className="w-full h-full" interactive />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-primary-100 dark:border-zinc-800 space-y-3">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-sans font-medium text-muted dark:text-zinc-400">Monthly True Operating Cost</p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold tabular-nums border ${
                    monthlyCostDeltaB <= 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
                  }`}
                >
                  {monthlyCostDeltaB <= 0
                    ? `-${formatCurrency(Math.abs(monthlyCostDeltaB))}/mo`
                    : `+${formatCurrency(monthlyCostDeltaB)}/mo`}
                </span>
              </div>
              <p className="mt-0.5 text-3xl font-bold font-mono tabular-nums text-primary-700 dark:text-primary-400">
                {formatCurrency(tcoB.monthlyEconomicCostUsd)}
                <span className="text-sm font-normal text-muted dark:text-zinc-400 font-sans">/mo</span>
              </p>
              <p className="text-xs font-sans font-medium text-muted dark:text-zinc-400 mt-1">
                <span className="font-mono tabular-nums">{formatCurrency(tcoB.totalEconomicCostUsd)}</span> over 5 yrs (at <span className="font-mono tabular-nums">{formatDistance(odoB)}</span>)
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-primary-100/80 dark:border-zinc-800/80">
              <div className="rounded-lg bg-white dark:bg-[#121215] p-2 border border-zinc-200 dark:border-zinc-800">
                <span className="block text-[10px] font-sans font-medium text-muted dark:text-zinc-400">Reliability</span>
                <span className="mt-0.5 block text-sm font-bold font-mono tabular-nums text-ink dark:text-zinc-50">
                  {riskB.reliabilityScore}/100
                </span>
              </div>
              <div className="rounded-lg bg-white dark:bg-[#121215] p-2 border border-zinc-200 dark:border-zinc-800">
                <span className="block text-[10px] font-sans font-medium text-muted dark:text-zinc-400">Service Risk</span>
                <span className="mt-0.5 block text-sm font-bold font-mono tabular-nums text-ink dark:text-zinc-50">
                  {formatCurrency(riskB.serviceReserveUsd)}
                </span>
              </div>
              <div className="rounded-lg bg-white dark:bg-[#121215] p-2 border border-zinc-200 dark:border-zinc-800">
                <span className="block text-[10px] font-sans font-medium text-muted dark:text-zinc-400">Known Flaws</span>
                <span className="mt-0.5 block text-xs font-bold font-sans text-ink dark:text-zinc-50">
                  <span className="font-mono tabular-nums">{knownIssuesB.length}</span> documented
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Break-Even Crossover Interactive SVG Graph */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <h3 className="text-sm font-sans font-bold tracking-tight text-ink dark:text-zinc-50">
                5-Year Break-Even Crossover Trajectory
              </h3>
            </div>
            <p className="text-xs font-sans font-medium text-muted dark:text-zinc-400 mt-0.5">
              Cumulative total cost of ownership by distance traveled (Purchase + Depreciation + Fuel + Maintenance)
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-sans font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
              <span className="text-muted dark:text-zinc-400">{vehicleA.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              <span className="text-muted dark:text-zinc-400">{vehicleB.name}</span>
            </div>
          </div>
        </div>

        {/* Responsive SVG Chart */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[540px] text-xs font-sans select-none"
          >
            {/* Grid lines and X labels */}
            {points.map((p) => {
              const x = getX(p.distMiles);
              return (
                <g key={p.distMiles}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + graphHeight}
                    stroke="currentColor"
                    className="text-zinc-200 dark:text-zinc-800"
                    strokeDasharray="2,3"
                  />
                  <text
                    x={x}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-muted dark:text-zinc-400 text-[10px] font-mono tabular-nums"
                  >
                    {region === 'EU' ? `${Math.round(p.distKm / 1000)}k km` : `${Math.round(p.distMiles / 1000)}k mi`}
                  </text>
                </g>
              );
            })}

            {/* User current 5-year distance vertical marker */}
            <line
              x1={userX}
              y1={padding.top}
              x2={userX}
              y2={padding.top + graphHeight}
              stroke="#F59E0B"
              strokeWidth="2"
              strokeDasharray="4,4"
            />
            <text
              x={userX}
              y={padding.top - 8}
              textAnchor="middle"
              fill="#D97706"
              className="font-bold text-[10px] font-sans"
            >
              Your 5-Year Distance ({formatDistance(breakEvenTrajectory.user5YrMiles)})
            </text>

            {/* Vehicle A Line (Blue) */}
            <path
              d={pathD_A}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Vehicle B Line (Emerald) */}
            <path
              d={pathD_B}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Break-even Crossover Point Marker */}
            {crossX && breakEvenTrajectory.breakEvenMiles <= maxDist && (
              <g>
                <circle
                  cx={crossX}
                  cy={getY(
                    points[0].costA +
                      ((points[points.length - 1].costA - points[0].costA) *
                        breakEvenTrajectory.breakEvenMiles) /
                        maxDist
                  )}
                  r="6"
                  fill="#10B981"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>
        </div>

        {/* Break-Even Interpretation Banner */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-ink dark:text-zinc-200">
              {breakEvenTrajectory.status === 'crossover' ? (
                <>
                  <strong>Break-Even Crossover:</strong>{' '}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                    {formatDistance(breakEvenTrajectory.breakEvenMiles)} (~{breakEvenTrajectory.breakEvenYears} yrs)
                  </span>
                  . Beyond this distance, {vehicleB.name} delivers net savings through lower fuel and maintenance costs.
                </>
              ) : breakEvenTrajectory.status === 'b_always_cheaper' ? (
                <>
                  <strong>Immediate Savings:</strong> <strong>{vehicleB.name}</strong> has a lower purchase price and running cost, remaining cheaper from mile zero.
                </>
              ) : (
                <>
                  <strong>{vehicleA.name} More Economical:</strong> Across this mileage profile, {vehicleA.name} maintains a lower total ownership cost.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Known Issues at Current Mileage */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-sans font-bold tracking-tight text-ink dark:text-zinc-50">
                Known Vulnerabilities at <span className="font-mono tabular-nums">{formatDistance(odoA)}</span>
              </h3>
            </div>
            <p className="text-xs font-sans font-medium text-muted dark:text-zinc-400 mt-0.5">
              Documented engineering flaws and active wear windows for selected powertrains
            </p>
          </div>
          <span className="text-xs font-sans font-medium text-muted dark:text-zinc-400">
            Database: ShiftMetric Curated Dossier
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Vehicle A Known Issues */}
          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-200 dark:border-zinc-800 font-sans font-semibold">
              <span className="text-ink dark:text-zinc-200 truncate">{vehicleA.name} ({vehicleA.engineCode})</span>
              <span className="text-muted dark:text-zinc-400 shrink-0 ml-2"><span className="font-mono tabular-nums">{knownIssuesA.length}</span> known issues</span>
            </div>

            {knownIssuesA.length === 0 ? (
              <p className="text-xs font-sans text-muted dark:text-zinc-400 py-3 text-center italic">
                No severe vulnerabilities documented in this mileage window.
              </p>
            ) : (
              knownIssuesA.map((issue) => {
                const isActive =
                  currentKm >= (issue.criticalMileage?.minKm || 0) &&
                  currentKm <= (issue.criticalMileage?.maxKm || 999999);
                return (
                  <div
                    key={issue.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 transition-colors ${
                      isActive
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/50'
                        : 'bg-white dark:bg-[#121215] border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-sans font-bold text-ink dark:text-zinc-50 truncate">{issue.name}</span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 shrink-0">
                            Active Window
                          </span>
                        )}
                      </div>
                      <span className="font-mono tabular-nums text-muted dark:text-zinc-400 shrink-0 text-[11px]">
                        {issue.criticalMileage?.display}
                      </span>
                    </div>
                    <p className="text-body dark:text-zinc-300 leading-normal text-[11px] font-sans">
                      {issue.symptoms}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 dark:border-zinc-800 text-[10px] text-muted dark:text-zinc-400 font-sans">
                      <span>Repair: <strong className="font-mono tabular-nums">{issue.repairCost?.formattedEur || issue.repairCost?.formattedUsd}</strong></span>
                      <span className="font-sans text-primary-600 dark:text-primary-400 font-semibold">{issue.prevention.slice(0, 45)}...</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Vehicle B Known Issues */}
          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-200 dark:border-zinc-800 font-sans font-semibold">
              <span className="text-ink dark:text-zinc-200 truncate">{vehicleB.name} ({vehicleB.engineCode})</span>
              <span className="text-muted dark:text-zinc-400 shrink-0 ml-2"><span className="font-mono tabular-nums">{knownIssuesB.length}</span> known issues</span>
            </div>

            {knownIssuesB.length === 0 ? (
              <p className="text-xs font-sans text-muted dark:text-zinc-400 py-3 text-center italic">
                No severe vulnerabilities documented in this mileage window.
              </p>
            ) : (
              knownIssuesB.map((issue) => {
                const isActive =
                  currentKm >= (issue.criticalMileage?.minKm || 0) &&
                  currentKm <= (issue.criticalMileage?.maxKm || 999999);
                return (
                  <div
                    key={issue.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 transition-colors ${
                      isActive
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/50'
                        : 'bg-white dark:bg-[#121215] border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-sans font-bold text-ink dark:text-zinc-50 truncate">{issue.name}</span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 shrink-0">
                            Active Window
                          </span>
                        )}
                      </div>
                      <span className="font-mono tabular-nums text-muted dark:text-zinc-400 shrink-0 text-[11px]">
                        {issue.criticalMileage?.display}
                      </span>
                    </div>
                    <p className="text-body dark:text-zinc-300 leading-normal text-[11px] font-sans">
                      {issue.symptoms}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 dark:border-zinc-800 text-[10px] text-muted dark:text-zinc-400 font-sans">
                      <span>Repair: <strong className="font-mono tabular-nums">{issue.repairCost?.formattedEur || issue.repairCost?.formattedUsd}</strong></span>
                      <span className="font-sans text-primary-600 dark:text-primary-400 font-semibold">{issue.prevention.slice(0, 45)}...</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Side-by-Side Detailed Financial Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-sans font-semibold text-muted dark:text-zinc-400">
              <th className="py-3 px-3">Cost &amp; Telemetry Category</th>
              <th className="py-3 px-3 text-right">{vehicleA.name}</th>
              <th className="py-3 px-3 text-right">{vehicleB.name}</th>
              <th className="py-3 px-3 text-right">Difference (Delta)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-xs text-body dark:text-zinc-300">
            <tr>
              <td className="py-3 px-3 font-sans text-xs font-medium text-ink dark:text-zinc-200">Purchase Price</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(priceA)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(priceB)}</td>
              <td className="py-3 px-3 text-right tabular-nums font-semibold text-ink dark:text-zinc-50">
                {priceB - priceA >= 0 ? '+' : ''}
                {formatCurrency(priceB - priceA)}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-3 font-sans text-xs font-medium text-ink dark:text-zinc-200">5-Year Depreciation</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(tcoA.totalDepreciationUsd)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(tcoB.totalDepreciationUsd)}</td>
              <td
                className={`py-3 px-3 text-right tabular-nums font-semibold ${
                  depreciationDiffTotal >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {depreciationDiffTotal >= 0 ? '-' : '+'}
                {formatCurrency(Math.abs(depreciationDiffTotal))}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-3 font-sans text-xs font-medium text-ink dark:text-zinc-200">
                Fuel / Energy ({horizonYears} Years)
              </td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(tcoA.totalFuelUsd)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(tcoB.totalFuelUsd)}</td>
              <td
                className={`py-3 px-3 text-right tabular-nums font-semibold ${
                  tcoA.totalFuelUsd - tcoB.totalFuelUsd >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {tcoA.totalFuelUsd - tcoB.totalFuelUsd >= 0 ? '-' : '+'}
                {formatCurrency(Math.abs(tcoA.totalFuelUsd - tcoB.totalFuelUsd))}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-3 font-sans text-xs font-medium text-ink dark:text-zinc-200">
                Maintenance Reserve Buffer
              </td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(tcoA.totalMaintenanceUsd)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(tcoB.totalMaintenanceUsd)}</td>
              <td
                className={`py-3 px-3 text-right tabular-nums font-semibold ${
                  maintenanceDiffTotal >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {maintenanceDiffTotal >= 0 ? '-' : '+'}
                {formatCurrency(Math.abs(maintenanceDiffTotal))}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-3 font-sans text-xs font-medium text-ink dark:text-zinc-200">
                Insurance ({horizonYears} Years)
              </td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(tcoA.totalInsuranceUsd)}</td>
              <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(tcoB.totalInsuranceUsd)}</td>
              <td className="py-3 px-3 text-right tabular-nums">
                {tcoB.totalInsuranceUsd - tcoA.totalInsuranceUsd >= 0 ? '+' : ''}
                {formatCurrency(tcoB.totalInsuranceUsd - tcoA.totalInsuranceUsd)}
              </td>
            </tr>
            <tr className="bg-zinc-100/80 dark:bg-zinc-900 font-semibold text-xs">
              <td className="py-3 px-3 font-sans font-bold text-ink dark:text-zinc-50">
                Total 5-Year True Cost to Own
              </td>
              <td className="py-3 px-3 text-right tabular-nums font-bold text-ink dark:text-zinc-50">
                {formatCurrency(tcoA.totalEconomicCostUsd)} ({formatCurrency(tcoA.monthlyEconomicCostUsd)}/mo)
              </td>
              <td className="py-3 px-3 text-right tabular-nums font-bold text-ink dark:text-zinc-50">
                {formatCurrency(tcoB.totalEconomicCostUsd)} ({formatCurrency(tcoB.monthlyEconomicCostUsd)}/mo)
              </td>
              <td
                className={`py-3 px-3 text-right tabular-nums font-bold ${
                  total5YrSavingsB >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
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

      {/* Set Vehicle B as Primary Button */}
      {onApplyPreset && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handlePromoteVehicleB}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 px-4 py-2 text-xs font-sans font-semibold text-ink dark:text-zinc-50 shadow-sm border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors duration-150"
          >
            <span>Set Vehicle B as Primary</span>
            <ArrowRight className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
          </button>
        </div>
      )}

      {/* Dynamic Winner VIN History Verification CTA + Zero-CLS AdSense Slot (when standalone /compare) */}
      {(() => {
        const bIsWinner = monthlySavingsB >= 0;
        const winVehicle = bIsWinner ? vehicleB : vehicleA;
        const winPrice = bIsWinner ? priceB : priceA;
        const winOdo = bIsWinner ? odoB : odoA;
        const winReserve = bIsWinner ? riskB.serviceReserveUsd : riskA.serviceReserveUsd;
        return (
          <div className="space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <AffiliateCTA
              type="vin-check"
              stepLabel="Winner Verification"
              vehicleName={winVehicle.name}
              purchasePriceUsd={winPrice}
              odometerMiles={winOdo}
              serviceReserveUsd={winReserve}
            />
            {standalone && (
              <AdUnit
                slotId="compare-bottom-leaderboard"
                variant="leaderboard"
                contextLabel={`${vehicleA.name} vs ${vehicleB.name} 5-Year Comparison`}
              />
            )}
          </div>
        );
      })()}
    </Card>
  );
}

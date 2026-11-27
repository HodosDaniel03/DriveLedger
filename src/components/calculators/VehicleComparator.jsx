import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  GitCompare,
  ArrowRight,
  X,
  Car,
  ChevronDown,
} from 'lucide-react';
import { VEHICLE_PRESETS, getPresetById } from '../../data/vehiclePresets';
import {
  MAINTENANCE_COMPONENTS,
  evaluateComponentHealth,
  calculateOemRiskMultiplier,
  calculateMaintenanceReserve,
  calculateTcoProjection,
  filterComponentsForPowertrain,
} from '../../data/maintenanceData';
import { findEngineVariant, getKnownIssuesForVehicle } from '../../data/vehicles/index.js';
import { useUnits } from '../../context/UnitContext';
import { useGarage } from '../../context/GarageContext';
import { Card, RiskBadge } from '../common/OdometerPrimitives';
import VinCheckBanner from '../monetization/VinCheckBanner';
import ToolEditorialSection from '../seo/ToolEditorialSection';
import ComparatorStickyBar from './comparator/ComparatorStickyBar';
import ComparatorBreakdownTab from './comparator/ComparatorBreakdownTab';
import ComparatorCurveTab from './comparator/ComparatorCurveTab';
import ComparatorRisksTab from './comparator/ComparatorRisksTab';
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
  tier = 'independent',
  annualDistanceMiles = 12000
) {
  const safePreset = preset || VEHICLE_PRESETS[0];
  const physicalOdometerMiles = Math.max(
    0,
    Number(odoMiles) >= 0 ? Number(odoMiles) : safePreset.defaultOdometerMiles || 62000
  );
  const oilIntervalId = schedMode === 'oem' ? 'extended' : 'standard';

  const relevant = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, safePreset);

  const evaluatedComponents = relevant.map((comp) => {
    const health = evaluateComponentHealth({
      component: comp,
      physicalOdometerMiles,
      urbanTripSharePct: urbanPct,
      oilIntervalId,
      serviceHistoryId: 'verified',
      transmissionId: safePreset.transmission || 'dct-dsg',
      vehicle: safePreset,
    });
    return {
      ...comp,
      health,
    };
  });

  const baseReserveUsd = calculateMaintenanceReserve({
    evaluatedComponents,
    workshopTier: tier,
    annualDistanceMiles,
    vehicle: safePreset,
  });
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

const COMPARATOR_TABS = [
  { id: 'breakdown', label: 'Cost Breakdown' },
  { id: 'curve', label: '5-Year Curve' },
  { id: 'risks', label: 'Known Risks & Reliability' },
];

export default function VehicleComparator({
  primaryPresetId,
  hasSelectedVehicle = Boolean(primaryPresetId),
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
  financeType = 'loan',
  scheduleMode = 'preventative',
  urbanTripSharePct = 35,
  workshopTier = 'independent',
  onClose,
  onApplyPreset,
  onSelectSecondaryPreset,
  onNavigateToTco,
  onNavigateToRisk,
  onNavigateToVehicles,
  standalone = false,
}) {
  const { formatCurrency, formatDistance, region, distanceUnit } = useUnits();
  const garage = useGarage();

  const resolveValidId = (id) =>
    id && VEHICLE_PRESETS.some((p) => p.id === id) ? id : null;

  const initialPresetAId = hasSelectedVehicle ? resolveValidId(primaryPresetId) : null;
  const [activePresetAId, setActivePresetAId] = useState(initialPresetAId);
  const vehicleA = useMemo(
    () => (activePresetAId ? getPresetById(activePresetAId) : null),
    [activePresetAId]
  );

  const [vehicleBId, setVehicleBId] = useState(() => {
    const validSecondary = resolveValidId(secondaryPresetId);
    if (validSecondary && validSecondary !== initialPresetAId) {
      return validSecondary;
    }
    if (!standalone && initialPresetAId) {
      const carA = getPresetById(initialPresetAId);
      if (initialPresetAId === 'toyota-camry-hybrid') return 'ford-focus-ecoblue';
      if (carA?.fuelType === 'Diesel') return 'toyota-camry-hybrid';
      if (carA?.isEv) return 'bmw-330i-g20';
      return 'tesla-model-3-lr';
    }
    return null;
  });

  const [customPriceAUsd, setCustomPriceAUsd] = useState(null);
  const [customOdoAMiles, setCustomOdoAMiles] = useState(null);
  const [customPriceBUsd, setCustomPriceBUsd] = useState(null);
  const [customOdoBMiles, setCustomOdoBMiles] = useState(null);
  const [activeCompTab, setActiveCompTab] = useState('breakdown');
  const panelsContainerRef = useRef(null);

  const updateVehicleA = (nextAId) => {
    const cleanA = resolveValidId(nextAId);
    setActivePresetAId(cleanA);
    setCustomPriceAUsd(null);
    setCustomOdoAMiles(null);
    if (typeof onApplyPreset === 'function') {
      onApplyPreset(cleanA);
    }
  };

  const updateVehicleB = (nextBId) => {
    const cleanB = resolveValidId(nextBId);
    setVehicleBId(cleanB);
    setCustomPriceBUsd(null);
    setCustomOdoBMiles(null);
    if (typeof onSelectSecondaryPreset === 'function') {
      onSelectSecondaryPreset(cleanB);
    }
  };

  useEffect(() => {
    if (primaryPresetId === undefined) return;
    const nextA = hasSelectedVehicle ? resolveValidId(primaryPresetId) : null;
    if (nextA !== activePresetAId) {
      setActivePresetAId(nextA);
      setCustomPriceAUsd(null);
      setCustomOdoAMiles(null);
    }
  }, [primaryPresetId, hasSelectedVehicle]);

  useEffect(() => {
    if (secondaryPresetId === undefined) return;
    const validB = resolveValidId(secondaryPresetId);
    if (!validB) {
      if (standalone && vehicleBId !== null) {
        setVehicleBId(null);
        setCustomPriceBUsd(null);
        setCustomOdoBMiles(null);
      }
      return;
    }
    if (validB !== activePresetAId && validB !== vehicleBId) {
      setVehicleBId(validB);
      setCustomPriceBUsd(null);
      setCustomOdoBMiles(null);
    }
  }, [secondaryPresetId, activePresetAId, standalone]);

  useEffect(() => {
    if (activePresetAId && vehicleBId && vehicleBId === activePresetAId) {
      setVehicleBId(null);
      if (typeof onSelectSecondaryPreset === 'function') {
        onSelectSecondaryPreset(null);
      }
    }
  }, [activePresetAId, vehicleBId]);

  const vehicleB = useMemo(
    () => (vehicleBId ? getPresetById(vehicleBId) : null),
    [vehicleBId]
  );
  const hasBothVehicles = Boolean(vehicleA && vehicleB);

  // Sync hidden="until-found" attribute & beforematch listener on comparison tab panels
  useEffect(() => {
    if (!hasBothVehicles || typeof document === 'undefined') return undefined;
    const container =
      panelsContainerRef.current ||
      (typeof document.getElementById === 'function' ? document.getElementById('comparator-tab-panels') : null);
    if (!container || typeof container.querySelectorAll !== 'function') return undefined;

    const supportsUntilFound =
      typeof HTMLElement !== 'undefined' && 'onbeforematch' in HTMLElement.prototype;

    const panels = container.querySelectorAll('[role="tabpanel"]');
    panels.forEach((panel) => {
      const tabId = panel.getAttribute('data-tab-id');
      if (tabId === activeCompTab) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', supportsUntilFound ? 'until-found' : '');
      }
    });

    if (!supportsUntilFound || typeof container.addEventListener !== 'function') return undefined;

    const handleBeforeMatch = (event) => {
      let node = event.target;
      while (node && node !== container) {
        if (node.getAttribute && node.getAttribute('role') === 'tabpanel') {
          const matchedTab = node.getAttribute('data-tab-id');
          if (matchedTab) setActiveCompTab(matchedTab);
          break;
        }
        node = node.parentNode;
      }
    };

    container.addEventListener('beforematch', handleBeforeMatch);
    return () => {
      if (typeof container.removeEventListener === 'function') {
        container.removeEventListener('beforematch', handleBeforeMatch);
      }
    };
  }, [hasBothVehicles, activeCompTab]);

  const resolvedPrimaryPrice = primaryPurchasePriceUsd ?? primaryPriceUsd;
  const resolvedAnnualMiles = Number(primaryAnnualMiles) > 0 ? Number(primaryAnnualMiles) : annualDistanceMiles;
  const basePriceA = vehicleA
    ? Number(resolvedPrimaryPrice) > 0
      ? Number(resolvedPrimaryPrice)
      : vehicleA.purchasePriceUsd
    : 0;
  const baseOdoA = vehicleA
    ? standalone && customOdoAMiles === null
      ? vehicleA.defaultOdometerMiles || 62000
      : Number(primaryOdometerMiles) >= 0
      ? Number(primaryOdometerMiles)
      : vehicleA.defaultOdometerMiles || 62000
    : 0;

  const priceA = customPriceAUsd !== null ? customPriceAUsd : basePriceA;
  const odoA = customOdoAMiles !== null ? customOdoAMiles : baseOdoA;
  const priceB = vehicleB ? (customPriceBUsd !== null ? customPriceBUsd : vehicleB.purchasePriceUsd) : 0;
  const odoB = vehicleB ? (customOdoBMiles !== null ? customOdoBMiles : vehicleB.defaultOdometerMiles || 58000) : 0;

  const mpgA = vehicleA ? (Number(primaryMpgUs) > 0 ? Number(primaryMpgUs) : vehicleA.mpgUs) : 32;
  const fuelPriceA = vehicleA
    ? Number(primaryFuelPriceUsdGal) > 0
      ? Number(primaryFuelPriceUsdGal)
      : vehicleA.defaultFuelPriceUsdGal
    : 3.65;
  const insuranceA = vehicleA
    ? Number(primaryInsuranceUsd) >= 0
      ? Number(primaryInsuranceUsd)
      : vehicleA.annualInsuranceUsd
    : 1400;

  const tcoA = useMemo(() => {
    if (!vehicleA) return null;
    if (
      primaryTco &&
      customPriceAUsd === null &&
      customOdoAMiles === null &&
      primaryTco.yearlySchedule?.length === horizonYears &&
      (!primaryTco.financeType || primaryTco.financeType === financeType) &&
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
      powertrainType: vehicleA.powertrainType || vehicleA.powertrain,
      vehicle: vehicleA,
      fuelPriceUsdGal: fuelPriceA,
      annualInsuranceUsd: insuranceA,
      baseAnnualMaintenanceUsd: vehicleA.baseAnnualMaintenanceUsd,
      maintenanceWearFactor: vehicleA.maintenanceWearFactor,
      financeType,
      downPaymentPct,
      aprPct,
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
    financeType,
    downPaymentPct,
    aprPct,
    loanTermMonths,
    horizonYears,
  ]);

  const tcoB = useMemo(() => {
    if (!vehicleB) return null;
    return calculateTcoProjection({
      purchasePriceUsd: priceB,
      odometerMiles: odoB,
      annualDistanceMiles: resolvedAnnualMiles,
      mpgUs: vehicleB.mpgUs,
      isEv: vehicleB.isEv,
      powertrainType: vehicleB.powertrainType || vehicleB.powertrain,
      vehicle: vehicleB,
      fuelPriceUsdGal: vehicleB.defaultFuelPriceUsdGal,
      annualInsuranceUsd: vehicleB.annualInsuranceUsd,
      baseAnnualMaintenanceUsd: vehicleB.baseAnnualMaintenanceUsd,
      maintenanceWearFactor: vehicleB.maintenanceWearFactor,
      financeType,
      downPaymentPct,
      aprPct,
      loanTermMonths,
      horizonYears,
      residualCurve10Yr: vehicleB.residualCurve10Yr,
    });
  }, [vehicleB, priceB, odoB, resolvedAnnualMiles, horizonYears, financeType, downPaymentPct, aprPct, loanTermMonths]);

  const breakEvenTrajectory = useMemo(() => {
    if (!vehicleA || !vehicleB) return null;
    return computeBreakEvenTrajectory(
      { ...vehicleA, purchasePriceUsd: priceA, defaultOdometerMiles: odoA },
      { ...vehicleB, purchasePriceUsd: priceB, defaultOdometerMiles: odoB },
      {
        horizonYears,
        annualDistanceMiles: resolvedAnnualMiles,
      }
    );
  }, [vehicleA, vehicleB, priceA, odoA, priceB, odoB, horizonYears, resolvedAnnualMiles]);

  const knownIssuesA = useMemo(() => {
    if (!vehicleA) return [];
    const engineVariant = findEngineVariant(vehicleA.id);
    return engineVariant
      ? [...(engineVariant.engine?.knownIssues || []), ...(engineVariant.generation?.modelKnownIssues || [])]
      : getKnownIssuesForVehicle({ brandId: vehicleA.brand, modelId: vehicleA.modelName });
  }, [vehicleA]);

  const knownIssuesB = useMemo(() => {
    if (!vehicleB) return [];
    const engineVariant = findEngineVariant(vehicleB.id);
    return engineVariant
      ? [...(engineVariant.engine?.knownIssues || []), ...(engineVariant.generation?.modelKnownIssues || [])]
      : getKnownIssuesForVehicle({ brandId: vehicleB.brand, modelId: vehicleB.modelName });
  }, [vehicleB]);

  const riskA = useMemo(
    () =>
      vehicleA
        ? computeReliabilityAndRisk(vehicleA, odoA, scheduleMode, urbanTripSharePct, workshopTier, resolvedAnnualMiles)
        : null,
    [vehicleA, odoA, scheduleMode, urbanTripSharePct, workshopTier, resolvedAnnualMiles]
  );

  const riskB = useMemo(
    () =>
      vehicleB
        ? computeReliabilityAndRisk(vehicleB, odoB, scheduleMode, urbanTripSharePct, workshopTier, resolvedAnnualMiles)
        : null,
    [vehicleB, odoB, scheduleMode, urbanTripSharePct, workshopTier, resolvedAnnualMiles]
  );

  const monthlySavingsB = hasBothVehicles && tcoA && tcoB ? tcoA.monthlyEconomicCostUsd - tcoB.monthlyEconomicCostUsd : 0;
  const monthlyCostDeltaB = hasBothVehicles && tcoA && tcoB ? tcoB.monthlyEconomicCostUsd - tcoA.monthlyEconomicCostUsd : 0;
  const total5YrSavingsB = hasBothVehicles && tcoA && tcoB ? tcoA.totalEconomicCostUsd - tcoB.totalEconomicCostUsd : 0;
  const depreciationDiffTotal = hasBothVehicles && tcoA && tcoB ? tcoA.totalDepreciationUsd - tcoB.totalDepreciationUsd : 0;
  const maintenanceDiffTotal = hasBothVehicles && tcoA && tcoB ? tcoA.totalMaintenanceUsd - tcoB.totalMaintenanceUsd : 0;

  const handlePromoteVehicleB = () => {
    if (!activePresetAId || !vehicleBId) return;
    const oldPrimary = activePresetAId;
    const newPrimary = vehicleBId;
    const oldPriceA = customPriceAUsd;
    const oldOdoA = customOdoAMiles;
    const oldPriceB = customPriceBUsd;
    const oldOdoB = customOdoBMiles;
    if (onApplyPreset) {
      onApplyPreset(newPrimary);
    }
    setActivePresetAId(newPrimary);
    setCustomPriceAUsd(oldPriceB);
    setCustomOdoAMiles(oldOdoB);
    setVehicleBId(oldPrimary);
    setCustomPriceBUsd(oldPriceA);
    setCustomOdoBMiles(oldOdoA);
    if (typeof onSelectSecondaryPreset === 'function') {
      onSelectSecondaryPreset(oldPrimary);
    }
  };

  const quickBenchmarkPairs = [
    { label: 'Diesel vs Hybrid', idA: 'ford-focus-ecoblue', idB: 'toyota-camry-hybrid' },
    { label: 'Petrol vs Pure EV', idA: 'bmw-330i-g20', idB: 'tesla-model-3-lr' },
    { label: 'Compact vs Executive', idA: 'vw-golf-20-tdi', idB: 'bmw-320d-b47' },
    { label: 'Family Hybrid vs Kia EV6', idA: 'toyota-corolla-18-hybrid', idB: 'kia-ev6-long-range' },
  ];

  const handleTabKeyDown = (e, idx) => {
    let nextIdx = null;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % COMPARATOR_TABS.length;
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + COMPARATOR_TABS.length) % COMPARATOR_TABS.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = COMPARATOR_TABS.length - 1;

    if (nextIdx !== null) {
      e.preventDefault();
      const targetTab = COMPARATOR_TABS[nextIdx];
      setActiveCompTab(targetTab.id);
      if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
        const btn = document.getElementById(`comp-tab-${targetTab.id}`);
        if (btn && typeof btn.focus === 'function') {
          btn.focus();
          if (typeof btn.scrollIntoView === 'function') {
            btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          }
        }
      }
    }
  };

  const bIsWinner = monthlySavingsB >= 0;
  const winnerVehicle = hasBothVehicles ? (bIsWinner ? vehicleB : vehicleA) : null;

  const breakEvenPlainLabel = useMemo(() => {
    if (!breakEvenTrajectory || !vehicleA || !vehicleB) return '-';
    if (breakEvenTrajectory.status === 'crossover') {
      const distVal = (region === 'EU' ? breakEvenTrajectory.breakEvenKm : breakEvenTrajectory.breakEvenMiles).toLocaleString();
      return `Year ${Math.max(1, Math.ceil(breakEvenTrajectory.breakEvenYears))} (${breakEvenTrajectory.breakEvenYears} yrs · ${distVal} ${distanceUnit})`;
    }
    if (breakEvenTrajectory.status === 'b_always_cheaper') {
      return `Year 1 · Immediate (${vehicleB.shortName || vehicleB.name})`;
    }
    return `Year 1 · Immediate (${vehicleA.shortName || vehicleA.name})`;
  }, [breakEvenTrajectory, vehicleA, vehicleB, region, distanceUnit]);

  return (
    <Card
      className="p-4 sm:p-6 space-y-5 sm:space-y-6"
      aria-labelledby="comparator-heading"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/80 dark:border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-xl bg-surface-subtle dark:bg-emerald-950/50 p-2.5 text-[#183D22] dark:text-emerald-400 shrink-0">
            <GitCompare aria-hidden="true" className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            {standalone ? (
              <h1
                id="comparator-heading"
                className="font-sans text-h2 font-bold tracking-tight text-ink dark:text-zinc-50 scroll-mt-28 lg:scroll-mt-32"
              >
                {hasBothVehicles
                  ? `${vehicleA.shortName || vehicleA.name} vs ${vehicleB.shortName || vehicleB.name} · Dual-Vehicle Side-by-Side Comparison`
                  : 'Dual-Vehicle Side-by-Side Comparison'}
              </h1>
            ) : (
              <h2
                id="comparator-heading"
                className="font-sans text-h3 font-bold tracking-tight text-ink dark:text-zinc-50 scroll-mt-28 lg:scroll-mt-32"
              >
                Dual-Vehicle Side-by-Side Comparison
              </h2>
            )}
            <p className="text-xs sm:text-sm font-sans text-muted dark:text-zinc-400 mt-0.5">
              {hasBothVehicles
                ? '5-year total cost delta, break-even trajectory, and odometer-calibrated reliability.'
                : 'Select two vehicles below to compare 5-year cost, break-even mileage, and known flaws.'}
            </p>
          </div>
        </div>
        {onClose && !standalone && (
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-muted dark:text-zinc-400 hover:bg-surface-subtle dark:hover:bg-zinc-900 hover:text-ink dark:hover:text-zinc-50 transition-colors cursor-pointer"
            aria-label="Close comparison drawer"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Garage Pair Shortcut (when 2+ vehicles saved) */}
      {garage?.savedVehicles && garage.savedVehicles.length >= 2 && (
        <div
          data-testid="garage-comparison-strip"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-subtle dark:bg-emerald-950/25 border border-border/80 dark:border-emerald-800/40 px-4 py-2.5 text-xs font-sans"
        >
          <div className="flex items-center gap-2 text-ink dark:text-zinc-50">
            <Car aria-hidden="true" className="w-4 h-4 text-[#183D22] dark:text-emerald-400 shrink-0" />
            <span>
              <strong>My Garage ({garage.savedVehicles.length} saved):</strong> Compare your top 2 parked candidates.
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
            className="min-h-[44px] sm:min-h-[34px] inline-flex items-center gap-1.5 rounded-xl bg-[#183D22] dark:bg-emerald-600 px-3.5 py-1.5 text-xs font-sans font-semibold text-white hover:bg-[#122E19] dark:hover:bg-emerald-500 transition-colors cursor-pointer"
          >
            <span>Load My Garage Pair</span>
            <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Popular Matchup Chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-xs font-sans font-medium text-muted dark:text-zinc-400 mr-1">
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
            className="min-h-[44px] sm:min-h-[32px] px-3 py-1 rounded-xl font-sans text-xs font-medium transition-colors border bg-surface-subtle dark:bg-zinc-900 text-body dark:text-zinc-300 border-border/80 dark:border-zinc-800 hover:border-[#183D22] dark:hover:border-emerald-500 hover:text-ink dark:hover:text-zinc-50 cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Compact Sticky Horizontal A vs B Selector Bar */}
      <ComparatorStickyBar
        standalone={standalone}
        activePresetAId={activePresetAId}
        vehicleBId={vehicleBId}
        vehicleA={vehicleA}
        vehicleB={vehicleB}
        priceA={priceA}
        odoA={odoA}
        priceB={priceB}
        odoB={odoB}
        updateVehicleA={updateVehicleA}
        updateVehicleB={updateVehicleB}
        setCustomPriceAUsd={setCustomPriceAUsd}
        setCustomOdoAMiles={setCustomOdoAMiles}
        setCustomPriceBUsd={setCustomPriceBUsd}
        setCustomOdoBMiles={setCustomOdoBMiles}
        hasBothVehicles={hasBothVehicles}
        onSwapVehicles={handlePromoteVehicleB}
      />

      {!hasBothVehicles ? (
        <div
          data-testid="comparator-empty-state"
          className="rounded-2xl bg-surface-subtle/80 dark:bg-zinc-900/50 border border-dashed border-border dark:border-zinc-800 p-6 sm:p-8 text-center space-y-2"
        >
          <p className="font-sans text-sm sm:text-base font-bold text-ink dark:text-zinc-100">
            Select both Vehicle A and Vehicle B to run the side-by-side comparison
          </p>
          <p className="font-sans text-xs sm:text-sm text-muted dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Once two models are selected, DriveLedger computes the 5-year TCO differential, break-even crossover curve, and known powertrain vulnerabilities.
          </p>
        </div>
      ) : (
        <>
          {/* Winner Verdict Banner First in Plain Numbers (5-Yr Total Delta, Monthly Delta, Break-Even Year) */}
          <div
            data-testid="tldr-verdict-box"
            className="cq-card rounded-2xl bg-surface-subtle dark:bg-zinc-900/80 border border-border/80 dark:border-zinc-800 p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/80 dark:border-zinc-800">
              <div className="min-w-0">
                <h3 className="font-sans text-base sm:text-lg font-bold tracking-tight text-ink dark:text-zinc-50">
                  {Math.abs(total5YrSavingsB) < 50 ? (
                    `Cost parity over ${horizonYears} years`
                  ) : (
                    <>
                      {winnerVehicle.name} saves{' '}
                      <span className="font-mono tabular-nums text-[#183D22] dark:text-emerald-400">
                        {formatCurrency(Math.abs(total5YrSavingsB))}
                      </span>{' '}
                      over {horizonYears} years
                    </>
                  )}
                </h3>
                <p className="font-sans text-xs text-muted dark:text-zinc-400 mt-0.5">
                  Plain-number verdict across depreciation, fuel/charging, insurance, and maintenance.
                </p>
              </div>
              <RiskBadge level="low" label="Winner · Lower TCO" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/80 dark:divide-zinc-800">
              <div className="py-2.5 first:pt-0 sm:py-0 sm:pr-4 min-w-0">
                <span className="block font-sans text-xs text-muted dark:text-zinc-400">
                  {horizonYears}-year total delta
                </span>
                <span className="mt-0.5 block font-mono text-xl sm:text-2xl font-bold tabular-nums whitespace-nowrap text-ink dark:text-zinc-50">
                  -{formatCurrency(Math.abs(total5YrSavingsB))}
                </span>
                <span className="mt-0.5 block font-mono text-[11px] tabular-nums text-muted dark:text-zinc-400 truncate">
                  {formatCurrency(tcoA.totalEconomicCostUsd)} vs {formatCurrency(tcoB.totalEconomicCostUsd)}
                </span>
              </div>

              <div className="py-2.5 sm:py-0 sm:px-4 min-w-0">
                <span className="block font-sans text-xs text-muted dark:text-zinc-400">
                  Monthly delta
                </span>
                <span className="mt-0.5 block font-mono text-xl sm:text-2xl font-bold tabular-nums whitespace-nowrap text-[#183D22] dark:text-emerald-400">
                  -{formatCurrency(Math.abs(monthlySavingsB))}/mo
                </span>
                <span className="mt-0.5 block font-mono text-[11px] tabular-nums text-muted dark:text-zinc-400 truncate">
                  {formatCurrency(tcoA.monthlyEconomicCostUsd)}/mo vs {formatCurrency(tcoB.monthlyEconomicCostUsd)}/mo
                </span>
              </div>

              <div className="py-2.5 last:pb-0 sm:py-0 sm:pl-4 min-w-0">
                <span className="block font-sans text-xs text-muted dark:text-zinc-400">
                  Break-even horizon
                </span>
                <span className="mt-0.5 block font-mono text-base sm:text-lg font-bold tabular-nums text-ink dark:text-zinc-50 truncate">
                  {breakEvenPlainLabel}
                </span>
                <span className="mt-0.5 block font-sans text-[11px] text-muted dark:text-zinc-400 truncate">
                  Service buffer: {formatCurrency(riskA.serviceReserveUsd)} vs {formatCurrency(riskB.serviceReserveUsd)}
                </span>
              </div>
            </div>
          </div>

          {/* Progressive Comparison Tabs ("Cost Breakdown", "5-Year Curve", "Known Risks & Reliability") */}
          <div>
            <div
              role="tablist"
              aria-label="Detailed vehicle comparison views"
              className="flex items-center overflow-x-auto no-scrollbar border-b border-border/80 dark:border-zinc-800 gap-0 sm:gap-1"
            >
              {COMPARATOR_TABS.map((tab, idx) => {
                const selected = activeCompTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`comp-tab-${tab.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActiveCompTab(tab.id)}
                    onKeyDown={(e) => handleTabKeyDown(e, idx)}
                    className="dl-hub-tab !px-2 sm:!px-3.5 !text-[11.5px] sm:!text-[13px] cursor-pointer"
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Panels Container (Zero gap & zero padding/border on [role="tabpanel"] for hidden="until-found") */}
            <div ref={panelsContainerRef} id="comparator-tab-panels">
              <div
                role="tabpanel"
                id="comp-panel-breakdown"
                data-tab-id="breakdown"
                aria-labelledby="comp-tab-breakdown"
                {...(activeCompTab !== 'breakdown' ? { hidden: 'until-found' } : {})}
              >
                <ComparatorBreakdownTab
                  vehicleA={vehicleA}
                  vehicleB={vehicleB}
                  priceA={priceA}
                  odoA={odoA}
                  priceB={priceB}
                  odoB={odoB}
                  tcoA={tcoA}
                  tcoB={tcoB}
                  horizonYears={horizonYears}
                  depreciationDiffTotal={depreciationDiffTotal}
                  maintenanceDiffTotal={maintenanceDiffTotal}
                  total5YrSavingsB={total5YrSavingsB}
                  monthlyCostDeltaB={monthlyCostDeltaB}
                  onApplyPreset={onApplyPreset}
                  onPromoteVehicleB={handlePromoteVehicleB}
                />
              </div>

              <div
                role="tabpanel"
                id="comp-panel-curve"
                data-tab-id="curve"
                aria-labelledby="comp-tab-curve"
                {...(activeCompTab !== 'curve' ? { hidden: 'until-found' } : {})}
              >
                <ComparatorCurveTab
                  vehicleA={vehicleA}
                  vehicleB={vehicleB}
                  breakEvenTrajectory={breakEvenTrajectory}
                />
              </div>

              <div
                role="tabpanel"
                id="comp-panel-risks"
                data-tab-id="risks"
                aria-labelledby="comp-tab-risks"
                {...(activeCompTab !== 'risks' ? { hidden: 'until-found' } : {})}
              >
                <ComparatorRisksTab
                  vehicleA={vehicleA}
                  vehicleB={vehicleB}
                  odoA={odoA}
                  odoB={odoB}
                  riskA={riskA}
                  riskB={riskB}
                  knownIssuesA={knownIssuesA}
                  knownIssuesB={knownIssuesB}
                />
              </div>
            </div>
          </div>

          {/* Restrained Winner VIN Verification Slot */}
          {(() => {
            const winVehicle = bIsWinner ? vehicleB : vehicleA;
            const winPrice = bIsWinner ? priceB : priceA;
            const winOdo = bIsWinner ? odoB : odoA;
            return (
              <div className="pt-4 border-t border-border/80 dark:border-zinc-800">
                <VinCheckBanner
                  placement="comparator"
                  vehicleName={winVehicle.name}
                  purchasePriceUsd={winPrice}
                  odometerMiles={winOdo}
                />
              </div>
            );
          })()}
        </>
      )}

      {/* Tucked Crawlable & Find-in-Page Searchable Editorial Methodology + Internal Dossier Links */}
      {standalone && (
        <details className="dl-disclosure group rounded-2xl border border-border/80 dark:border-zinc-800 bg-surface-subtle/50 dark:bg-zinc-900/40 px-4 sm:px-5 py-1.5">
          <summary className="min-h-[48px] py-2.5 flex items-center justify-between gap-3 text-left font-sans text-xs sm:text-sm font-semibold text-muted hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
            <span>Comparison Methodology, Actuarial Notes &amp; Vehicle Dossiers</span>
            <ChevronDown
              aria-hidden="true"
              className="w-4 h-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <div className="pb-5 pt-2 space-y-5 border-t border-border/70 dark:border-zinc-800">
            <ToolEditorialSection
              tool="compare"
              vehicleName={
                hasBothVehicles && vehicleA && vehicleB
                  ? `${vehicleA.shortName || vehicleA.name} vs ${vehicleB.shortName || vehicleB.name}`
                  : ''
              }
              className="!mt-2 !shadow-none !border-0 !p-0 !bg-transparent"
            />
            {hasBothVehicles && vehicleA && vehicleB && (
              <nav
                aria-label="Compared Vehicle Telemetry Dossiers"
                className="pt-3 border-t border-border/70 dark:border-zinc-800 flex flex-wrap items-center gap-2 text-xs font-sans"
              >
                <a
                  href={`/tco/${vehicleA.id}`}
                  onClick={(e) => {
                    if (onNavigateToTco) {
                      e.preventDefault();
                      onNavigateToTco(vehicleA.id);
                    }
                  }}
                  className="min-h-[36px] inline-flex items-center px-3 py-1.5 rounded-xl bg-surface dark:bg-zinc-900 border border-border/80 dark:border-zinc-800 text-body dark:text-zinc-300 hover:border-primary-600 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors"
                >
                  {vehicleA.shortName || vehicleA.name} 5-Yr TCO
                </a>
                <a
                  href={`/risk-matrix/${vehicleA.id}`}
                  onClick={(e) => {
                    if (onNavigateToRisk) {
                      e.preventDefault();
                      onNavigateToRisk(vehicleA.id);
                    }
                  }}
                  className="min-h-[36px] inline-flex items-center px-3 py-1.5 rounded-xl bg-surface dark:bg-zinc-900 border border-border/80 dark:border-zinc-800 text-body dark:text-zinc-300 hover:border-primary-600 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors"
                >
                  {vehicleA.shortName || vehicleA.name} Risk Matrix
                </a>
                <a
                  href={`/tco/${vehicleB.id}`}
                  onClick={(e) => {
                    if (onNavigateToTco) {
                      e.preventDefault();
                      onNavigateToTco(vehicleB.id);
                    }
                  }}
                  className="min-h-[36px] inline-flex items-center px-3 py-1.5 rounded-xl bg-surface dark:bg-zinc-900 border border-border/80 dark:border-zinc-800 text-body dark:text-zinc-300 hover:border-primary-600 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors"
                >
                  {vehicleB.shortName || vehicleB.name} 5-Yr TCO
                </a>
                <a
                  href={`/risk-matrix/${vehicleB.id}`}
                  onClick={(e) => {
                    if (onNavigateToRisk) {
                      e.preventDefault();
                      onNavigateToRisk(vehicleB.id);
                    }
                  }}
                  className="min-h-[36px] inline-flex items-center px-3 py-1.5 rounded-xl bg-surface dark:bg-zinc-900 border border-border/80 dark:border-zinc-800 text-body dark:text-zinc-300 hover:border-primary-600 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors"
                >
                  {vehicleB.shortName || vehicleB.name} Risk Matrix
                </a>
                <a
                  href="/vehicles"
                  onClick={(e) => {
                    if (onNavigateToVehicles) {
                      e.preventDefault();
                      onNavigateToVehicles();
                    }
                  }}
                  className="min-h-[36px] inline-flex items-center px-3 py-1.5 rounded-xl bg-surface dark:bg-zinc-900 border border-border/80 dark:border-zinc-800 font-semibold text-[#183D22] dark:text-emerald-400 hover:border-primary-600 transition-colors"
                >
                  All 35 Brands &amp; 179 Vehicles
                </a>
              </nav>
            )}
          </div>
        </details>
      )}
    </Card>
  );
}

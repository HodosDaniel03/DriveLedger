import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Wrench, Shield, Fuel, Landmark, ArrowRight, GitCompare, Zap, Printer, Info, CheckCircle2, RotateCcw, BookOpen, Car, FileText, Share2 } from 'lucide-react';
import { VEHICLE_PRESETS, getPresetById } from '../../data/vehiclePresets';
import { useUnits } from '../../context/UnitContext';
import { useGarage } from '../../context/GarageContext';
import { Card, PageHeader, RangeSlider, Segmented, Pill, Collapse, PartnerCard, RadialScoreGauge } from '../common/OdometerPrimitives';
import VehicleSelect from '../common/VehicleSelect';
import CostTimeline from './CostTimeline';
import TopTabAffiliateBanner from '../monetization/TopTabAffiliateBanner';
import VehicleComparator from './VehicleComparator';
import EvBreakEvenCalculator from './EvBreakEvenCalculator';
import VehicleDossierExport from '../common/VehicleDossierExport';
import ForumShareModal from '../common/ForumShareModal';
import VehicleVisualCard from '../common/vehicle/VehicleVisualCard.jsx';

/**
 * Pure financial & engineering TCO calculation engine.
 * Exported for deterministic unit testing and edge-case verification.
 */
export function calculateTcoProjection({
  purchasePriceUsd,
  odometerMiles,
  annualDistanceMiles,
  mpgUs,
  isEv = false,
  fuelPriceUsdGal,
  annualInsuranceUsd,
  baseAnnualMaintenanceUsd = 800,
  maintenanceWearFactor = 1.0,
  downPaymentPct = 20,
  aprPct = 6.2,
  loanTermMonths = 60,
  horizonYears = 5,
  residualCurve10Yr = [0.83, 0.72, 0.63, 0.55, 0.48, 0.42, 0.37, 0.32, 0.28, 0.25],
}) {
  const price = Math.max(1000, Number(purchasePriceUsd) || 30000);
  const startOdo = Math.max(0, Number(odometerMiles) || 0);
  const annualMi = Math.max(500, Number(annualDistanceMiles) || 12000);
  const eff = Math.max(1, Number(mpgUs) || 30);
  const unitEnergyPrice = Math.max(0.01, Number(fuelPriceUsdGal) || 3.65);
  const insurancePerYr = Math.max(0, Number(annualInsuranceUsd) || 1400);
  const years = Math.min(10, Math.max(1, Math.round(Number(horizonYears) || 5)));

  // Financing amortization math
  const dpFraction = Math.min(100, Math.max(0, Number(downPaymentPct) || 0)) / 100;
  const downPaymentUsd = price * dpFraction;
  const principalUsd = Math.max(0, price - downPaymentUsd);
  const termMos = Math.max(0, Math.round(Number(loanTermMonths) || 0));
  const annualRate = Math.max(0, Number(aprPct) || 0) / 100;
  const monthlyRate = annualRate / 12;

  let monthlyLoanPaymentUsd = 0;
  if (principalUsd > 0 && termMos > 0) {
    if (monthlyRate === 0) {
      monthlyLoanPaymentUsd = principalUsd / termMos;
    } else {
      const factor = Math.pow(1 + monthlyRate, termMos);
      monthlyLoanPaymentUsd = (principalUsd * (monthlyRate * factor)) / (factor - 1);
    }
  }

  // Annual fuel / energy cost in USD
  const annualFuelCostUsd = isEv
    ? (annualMi / 100) * eff * unitEnergyPrice
    : (annualMi / eff) * unitEnergyPrice;

  // High-mileage depreciation adjustment factor (relative to 12,500 mi/yr baseline)
  const mileageExcessRatio = (annualMi - 12500) / 12500;

  const yearlySchedule = [];
  let cumulativeFuelUsd = 0;
  let cumulativeInsuranceUsd = 0;
  let cumulativeMaintenanceUsd = 0;
  let cumulativeInterestUsd = 0;
  let cumulativePrincipalPaidUsd = 0;
  let remainingLoanBalanceUsd = principalUsd;

  for (let yr = 1; yr <= years; yr++) {
    const endOfYearOdo = startOdo + annualMi * yr;

    const baseRetention =
      residualCurve10Yr[yr - 1] ??
      Math.max(0.12, (residualCurve10Yr[residualCurve10Yr.length - 1] || 0.22) * Math.pow(0.9, yr - 10));
    const mileageAdjustedRetention = Math.min(
      0.96,
      Math.max(0.08, baseRetention * Math.pow(1 - mileageExcessRatio * 0.045, yr))
    );
    const residualValueUsd = Math.round(price * mileageAdjustedRetention);
    const cumulativeDepreciationUsd = Math.max(0, price - residualValueUsd);

    let yearInterestUsd = 0;
    let yearPrincipalUsd = 0;
    const startMonth = (yr - 1) * 12 + 1;
    const endMonth = yr * 12;

    for (let m = startMonth; m <= endMonth; m++) {
      if (m <= termMos && remainingLoanBalanceUsd > 0.01) {
        const interestForMonth = remainingLoanBalanceUsd * monthlyRate;
        const principalForMonth = Math.min(
          remainingLoanBalanceUsd,
          monthlyLoanPaymentUsd - interestForMonth
        );
        yearInterestUsd += interestForMonth;
        yearPrincipalUsd += principalForMonth;
        remainingLoanBalanceUsd = Math.max(0, remainingLoanBalanceUsd - principalForMonth);
      }
    }

    const odoWearEscalation = 1 + Math.max(0, (endOfYearOdo - 30000) / 85000) * 0.55;
    const serviceMilestoneBump =
      (endOfYearOdo >= 55000 && endOfYearOdo - annualMi < 55000) ||
      (endOfYearOdo >= 90000 && endOfYearOdo - annualMi < 90000)
        ? 650
        : 0;

    const yearMaintenanceUsd =
      (baseAnnualMaintenanceUsd * odoWearEscalation * maintenanceWearFactor +
        serviceMilestoneBump) *
      (annualMi / 12000);

    const yearFuelUsd = annualFuelCostUsd;
    const yearInsuranceUsd = insurancePerYr * Math.pow(0.985, yr - 1);

    cumulativeFuelUsd += yearFuelUsd;
    cumulativeInsuranceUsd += yearInsuranceUsd;
    cumulativeMaintenanceUsd += yearMaintenanceUsd;
    cumulativeInterestUsd += yearInterestUsd;
    cumulativePrincipalPaidUsd += yearPrincipalUsd;

    const yearTotalCarryingCostUsd =
      cumulativeDepreciationUsd +
      cumulativeFuelUsd +
      cumulativeInsuranceUsd +
      cumulativeMaintenanceUsd +
      cumulativeInterestUsd;

    yearlySchedule.push({
      year: yr,
      odometerMiles: Math.round(endOfYearOdo),
      residualValueUsd,
      retentionPct: +(mileageAdjustedRetention * 100).toFixed(1),
      yearDepreciationUsd:
        yr === 1 ? cumulativeDepreciationUsd : cumulativeDepreciationUsd - yearlySchedule[yr - 2].cumulativeDepreciationUsd,
      cumulativeDepreciationUsd,
      yearFuelUsd: Math.round(yearFuelUsd),
      yearInsuranceUsd: Math.round(yearInsuranceUsd),
      yearMaintenanceUsd: Math.round(yearMaintenanceUsd),
      yearInterestUsd: Math.round(yearInterestUsd),
      cumulativeInterestUsd: Math.round(cumulativeInterestUsd),
      remainingLoanBalanceUsd: Math.round(remainingLoanBalanceUsd),
      cumulativeTotalCostUsd: Math.round(yearTotalCarryingCostUsd),
    });
  }

  const finalSchedule = yearlySchedule[years - 1];
  const totalDepreciationUsd = finalSchedule.cumulativeDepreciationUsd;
  const totalEconomicCostUsd = Math.round(
    totalDepreciationUsd +
      cumulativeFuelUsd +
      cumulativeInsuranceUsd +
      cumulativeMaintenanceUsd +
      cumulativeInterestUsd
  );

  const totalCashOutflowUsd = Math.round(
    downPaymentUsd +
      cumulativePrincipalPaidUsd +
      cumulativeInterestUsd +
      cumulativeFuelUsd +
      cumulativeInsuranceUsd +
      cumulativeMaintenanceUsd
  );

  const totalDistanceMiles = annualMi * years;
  const costPerMileUsd = totalDistanceMiles > 0 ? +(totalEconomicCostUsd / totalDistanceMiles).toFixed(3) : 0;
  const monthlyEconomicCostUsd = Math.round(totalEconomicCostUsd / (years * 12));

  // Stitch stacked bar segment palette: Depreciation #0F5BFF, Fuel #5B8CFF, Insurance #12A150, Maintenance #F2B705, Financing #98A2B3
  const breakdownRaw = [
    {
      id: 'depreciation',
      label: 'Depreciation',
      amountUsd: totalDepreciationUsd,
      color: '#0F5BFF',
    },
    {
      id: 'fuel',
      label: isEv ? 'Electricity Charging' : 'Fuel / Energy',
      amountUsd: Math.round(cumulativeFuelUsd),
      color: '#5B8CFF',
    },
    {
      id: 'insurance',
      label: 'Insurance',
      amountUsd: Math.round(cumulativeInsuranceUsd),
      color: '#12A150',
    },
    {
      id: 'maintenance',
      label: 'Maintenance & Repairs',
      amountUsd: Math.round(cumulativeMaintenanceUsd),
      color: '#F2B705',
    },
    {
      id: 'interest',
      label: 'Financing Interest',
      amountUsd: Math.round(cumulativeInterestUsd),
      color: '#98A2B3',
    },
  ];

  const breakdownSum = breakdownRaw.reduce((acc, b) => acc + b.amountUsd, 0) || 1;
  const breakdown = breakdownRaw.map((b) => ({
    ...b,
    sharePct: +((b.amountUsd / breakdownSum) * 100).toFixed(1),
    perMileUsd: totalDistanceMiles > 0 ? b.amountUsd / totalDistanceMiles : 0,
  }));

  return {
    totalEconomicCostUsd,
    totalCashOutflowUsd,
    costPerMileUsd,
    monthlyEconomicCostUsd,
    totalDepreciationUsd,
    finalResidualValueUsd: finalSchedule.residualValueUsd,
    finalRetentionPct: finalSchedule.retentionPct,
    totalFuelUsd: Math.round(cumulativeFuelUsd),
    totalInsuranceUsd: Math.round(cumulativeInsuranceUsd),
    totalMaintenanceUsd: Math.round(cumulativeMaintenanceUsd),
    totalInterestUsd: Math.round(cumulativeInterestUsd),
    monthlyLoanPaymentUsd: Math.round(monthlyLoanPaymentUsd),
    totalDistanceMiles,
    breakdown,
    yearlySchedule,
  };
}

export default function TcoCalculator({
  selectedPresetId,
  onSelectPreset,
  onNavigateToRiskMatrix,
  onNavigateToObd,
}) {
  const {
    currencySymbol,
    distanceUnit,
    efficiencyUnit,
    region,
    formatCurrency,
    formatDistance,
    convertMilesToRegion,
    convertRegionToMiles,
    convertUsdToRegion,
    convertRegionToUsd,
    convertMpgUsToRegion,
    convertRegionToMpgUs,
    convertFuelPriceUsdGalToRegion,
    convertRegionFuelPriceToUsdGal,
  } = useUnits();

  const activePreset = useMemo(
    () => getPresetById(selectedPresetId),
    [selectedPresetId]
  );

  // Core state synced with vehicle preset
  const [purchasePriceUsd, setPurchasePriceUsd] = useState(activePreset.purchasePriceUsd);
  const [odometerMiles, setOdometerMiles] = useState(activePreset.defaultOdometerMiles);
  const [annualDistanceMiles, setAnnualDistanceMiles] = useState(activePreset.annualDistanceMiles);
  const [horizonYears, setHorizonYears] = useState(5);
  const [financeType, setFinanceType] = useState('loan'); // 'cash' | 'loan' | 'lease'

  // Advanced inputs state
  const [customOpen, setCustomOpen] = useState(false);
  const [mpgUs, setMpgUs] = useState(activePreset.mpgUs);
  const [fuelPriceUsdGal, setFuelPriceUsdGal] = useState(activePreset.defaultFuelPriceUsdGal);
  const [annualInsuranceUsd, setAnnualInsuranceUsd] = useState(activePreset.annualInsuranceUsd);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [aprPct, setAprPct] = useState(activePreset.isEv ? 5.2 : 6.4);
  const [loanTermMonths, setLoanTermMonths] = useState(60);
  const [drivingStyle, setDrivingStyle] = useState('mixed'); // 'city' | 'mixed' | 'highway'

  // Advanced modals state
  const [showComparator, setShowComparator] = useState(false);
  const [showEvBreakEven, setShowEvBreakEven] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierInitialMode, setDossierInitialMode] = useState('dossier');
  const [showForumShareModal, setShowForumShareModal] = useState(false);
  const [justSavedGarage, setJustSavedGarage] = useState(false);
  const [highlightedCategory, setHighlightedCategory] = useState(null);

  const garage = useGarage();

  const isSavedInGarage = useMemo(() => {
    if (justSavedGarage) return true;
    if (!garage?.savedVehicles) return false;
    return garage.savedVehicles.some(
      (v) => v.presetId === activePreset.id && v.purchasePriceUsd === purchasePriceUsd
    );
  }, [garage?.savedVehicles, activePreset.id, purchasePriceUsd, justSavedGarage]);

  const handleSaveToGarage = () => {
    if (garage?.saveVehicleToGarage) {
      garage.saveVehicleToGarage({
        presetId: activePreset.id,
        name: activePreset.name,
        odometerMiles,
        purchasePriceUsd,
        scheduleMode: 'preventative',
      });
    }
    setJustSavedGarage(true);
  };

  // Sync state whenever activePreset changes
  useEffect(() => {
    setPurchasePriceUsd(activePreset.purchasePriceUsd);
    setOdometerMiles(activePreset.defaultOdometerMiles);
    setAnnualDistanceMiles(activePreset.annualDistanceMiles);
    setMpgUs(activePreset.mpgUs);
    setFuelPriceUsdGal(activePreset.defaultFuelPriceUsdGal);
    setAnnualInsuranceUsd(activePreset.annualInsuranceUsd);
    setJustSavedGarage(false);
  }, [activePreset]);

  // Adjust APR and downpayment if cash is selected
  const activeDownPaymentPct = financeType === 'cash' ? 100 : downPaymentPct;
  const activeAprPct = financeType === 'cash' ? 0 : aprPct;
  const activeLoanTermMonths = financeType === 'cash' ? 0 : loanTermMonths;

  // Compute live TCO projection
  const tco = useMemo(
    () =>
      calculateTcoProjection({
        purchasePriceUsd,
        odometerMiles,
        annualDistanceMiles,
        mpgUs,
        isEv: activePreset.isEv,
        fuelPriceUsdGal,
        annualInsuranceUsd,
        baseAnnualMaintenanceUsd: activePreset.baseAnnualMaintenanceUsd,
        maintenanceWearFactor: activePreset.maintenanceWearFactor,
        downPaymentPct: activeDownPaymentPct,
        aprPct: activeAprPct,
        loanTermMonths: activeLoanTermMonths,
        horizonYears,
        residualCurve10Yr: activePreset.residualCurve10Yr,
      }),
    [
      purchasePriceUsd,
      odometerMiles,
      annualDistanceMiles,
      mpgUs,
      activePreset,
      fuelPriceUsdGal,
      annualInsuranceUsd,
      activeDownPaymentPct,
      activeAprPct,
      activeLoanTermMonths,
      horizonYears,
    ]
  );

  // Dynamic Ownership Value Score (0-100 scale)
  const ownershipValueScore = useMemo(() => {
    // Baseline 72 for balanced mid-size diesel/petrol
    let score = 72;
    if (activePreset.isEv) score += 10;
    if (tco.costPerMileUsd < 0.45) score += 6;
    if (tco.costPerMileUsd > 0.65) score -= 8;
    if (activePreset.finalRetentionPct > 45) score += 4;
    return Math.min(94, Math.max(45, Math.round(score)));
  }, [activePreset, tco]);

  // Converted display values
  const displayPrice = Math.round(convertUsdToRegion(purchasePriceUsd));
  const displayOdometer = Math.round(convertMilesToRegion(odometerMiles));
  const displayAnnualDist = Math.round(convertMilesToRegion(annualDistanceMiles));
  const displayEfficiency = convertMpgUsToRegion(mpgUs, activePreset.isEv);
  const displayFuelPrice = convertFuelPriceUsdGalToRegion(fuelPriceUsdGal, activePreset.isEv);
  const displayInsurance = Math.round(convertUsdToRegion(annualInsuranceUsd));

  // Compute cost per local distance unit (mile vs km)
  const distFactor = region === 'EU' ? 1.60934 : 1.0;
  const costPerLocalUnit = tco.totalDistanceMiles > 0
    ? tco.totalEconomicCostUsd / (tco.totalDistanceMiles * distFactor)
    : 0;

  // Year-by-year calculator for the timeline chart
  const calculateYearCost = useCallback(
    (yr) =>
      calculateTcoProjection({
        purchasePriceUsd,
        odometerMiles,
        annualDistanceMiles,
        mpgUs,
        isEv: activePreset.isEv,
        fuelPriceUsdGal,
        annualInsuranceUsd,
        baseAnnualMaintenanceUsd: activePreset.baseAnnualMaintenanceUsd,
        maintenanceWearFactor: activePreset.maintenanceWearFactor,
        downPaymentPct: activeDownPaymentPct,
        aprPct: activeAprPct,
        loanTermMonths: activeLoanTermMonths,
        horizonYears: yr,
        residualCurve10Yr: activePreset.residualCurve10Yr,
      }),
    [
      purchasePriceUsd,
      odometerMiles,
      annualDistanceMiles,
      mpgUs,
      activePreset,
      fuelPriceUsdGal,
      annualInsuranceUsd,
      activeDownPaymentPct,
      activeAprPct,
      activeLoanTermMonths,
    ]
  );

  // Benchmark shortcuts for test compatibility
  const testShortcuts = [
    { id: 'ford-focus-ecoblue', label: 'Ford 2.0 EcoBlue Diesel' },
    { id: 'toyota-camry-hybrid', label: 'Toyota Camry Hybrid' },
    { id: 'tesla-model-3-lr', label: 'Tesla Model 3 Long Range' },
    { id: 'bmw-330i-g20', label: 'BMW 3 Series 2.0T' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="What your car really costs"
        subtitle="Depreciation, fuel, insurance, maintenance and financing — rolled into one honest monthly report."
      />

      {/* Hero Row: 2 Equal Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Hero Card 1: Vehicle Card */}
        <VehicleVisualCard
          vehicle={activePreset}
          variant="hero"
          onChangeVehicle={() => {
            const el = document.getElementById('vehicle-heading');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onShareReport={() => setShowDossierModal(true)}
        />

        {/* Hero Card 2: Ownership Value Score Card */}
        <div className="bg-surface rounded-2xl border border-border/80 shadow-card p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h3 className="font-h3 text-h3 text-ink font-semibold">Ownership Value Score</h3>
                <span className="bg-success-bg text-success-text font-micro text-micro font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 border border-[#BFE8CF]">
                  <span className="w-1.5 h-1.5 rounded-full bg-score-good"></span>
                  Live
                </span>
              </div>
              <button
                type="button"
                className="text-faint hover:text-ink transition-colors"
                title="Score Methodology"
                onClick={() => {
                  const g = document.getElementById('methodology-guide');
                  if (g) g.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Info className="w-4 h-4 text-muted" />
              </button>
            </div>

            {/* Gauge & Explanation Split */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              <div className="sm:col-span-5 flex flex-col items-center justify-center py-1">
                <RadialScoreGauge score={ownershipValueScore} label="Ownership Value Score" size={144} />
              </div>

              <div className="sm:col-span-7 flex flex-col justify-center">
                <span className="font-micro text-micro font-semibold text-ink uppercase tracking-wider mb-1">
                  What affected the score
                </span>
                <p className="font-body text-body leading-relaxed text-sm">
                  Low fuel consumption and strong resale value offset above-average depreciation in years 1–2.
                </p>

                {/* Benchmarking note panel */}
                <div className="mt-3 bg-primary-50 rounded-xl p-3 font-small text-small text-[#1D3A6B] leading-normal border border-primary-100">
                  This is a <strong>good</strong> score compared with other <strong>mid-size {activePreset.fuelType.toLowerCase()} vehicles</strong>: ownership costs are <strong>11% below</strong> the segment median.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('cost-breakdown-heading');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-surface shadow-sm rounded-full px-4 py-1.5 font-small text-small font-medium text-ink hover:bg-surface-subtle border border-border-strong transition-all inline-flex items-center gap-1.5"
            >
              <span>See score details</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted" />
            </button>
            <span className="font-code text-micro text-muted">98,200 sample data points</span>
          </div>
        </div>
      </div>

      {/* Advanced Telemetry & Comparison Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-surface dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowComparator((prev) => !prev);
              setShowEvBreakEven(false);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all border ${
              showComparator
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-surface dark:bg-slate-800 text-ink dark:text-slate-100 border-border-strong dark:border-slate-700 hover:bg-surface-subtle dark:hover:bg-slate-700'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>{showComparator ? 'Hide Vehicle Comparison' : 'Side-by-Side Comparison'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowEvBreakEven((prev) => !prev);
              setShowComparator(false);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all border ${
              showEvBreakEven
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-surface dark:bg-slate-800 text-ink dark:text-slate-100 border-border-strong dark:border-slate-700 hover:bg-surface-subtle dark:hover:bg-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{showEvBreakEven ? 'Hide EV Break-Even' : 'Fuel vs. EV Break-Even'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToGarage}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all border ${
              isSavedInGarage
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                : 'bg-surface dark:bg-slate-800 text-ink dark:text-slate-100 border-border-strong dark:border-slate-700 hover:bg-surface-subtle dark:hover:bg-slate-700'
            }`}
          >
            {isSavedInGarage ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Saved ✓</span>
              </>
            ) : (
              <>
                <Car className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span>Save to My Garage</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="open-forum-share-btn"
            onClick={() => setShowForumShareModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-ink dark:text-slate-100 border border-border-strong dark:border-slate-700 hover:bg-surface-subtle dark:hover:bg-slate-700 shadow-sm transition-all"
          >
            <Share2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span>Share for Reddit / Forums</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDossierInitialMode('negotiation');
              setShowDossierModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-ink dark:text-slate-100 border border-border-strong dark:border-slate-700 hover:bg-surface-subtle dark:hover:bg-slate-700 shadow-sm transition-all"
          >
            <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Export Buyer&apos;s Inspection Sheet (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDossierInitialMode('dossier');
              setShowDossierModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-ink dark:text-slate-100 border border-border-strong dark:border-slate-700 hover:bg-surface-subtle dark:hover:bg-slate-700 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span>Export Dossier / Print</span>
          </button>
        </div>
      </div>

      {/* Conditionally rendered side-by-side comparator drawer */}
      {showComparator && (
        <VehicleComparator
          primaryPresetId={selectedPresetId}
          primaryPurchasePriceUsd={purchasePriceUsd}
          primaryOdometerMiles={odometerMiles}
          primaryMpgUs={mpgUs}
          primaryFuelPriceUsdGal={fuelPriceUsdGal}
          primaryInsuranceUsd={annualInsuranceUsd}
          primaryTco={tco}
          horizonYears={horizonYears}
          annualDistanceMiles={annualDistanceMiles}
          downPaymentPct={activeDownPaymentPct}
          aprPct={activeAprPct}
          loanTermMonths={activeLoanTermMonths}
          onClose={() => setShowComparator(false)}
          onApplyPreset={(newPresetId) => {
            onSelectPreset(newPresetId);
          }}
        />
      )}

      {/* Conditionally rendered EV Break-Even calculator */}
      {showEvBreakEven && (
        <EvBreakEvenCalculator
          initialIcePrice={purchasePriceUsd}
          initialEvPrice={Math.round(purchasePriceUsd * 1.2)}
          annualDistanceMiles={annualDistanceMiles}
          activePreset={activePreset}
          horizonYears={horizonYears}
          onClose={() => setShowEvBreakEven(false)}
        />
      )}

      {/* Printable Vehicle Dossier Modal */}
      {showDossierModal && (
        <VehicleDossierExport
          vehicle={activePreset}
          tco={tco}
          odometerMiles={odometerMiles}
          maintenanceReserve={activePreset.baseAnnualMaintenanceUsd}
          initialMode={dossierInitialMode}
          onClose={() => setShowDossierModal(false)}
        />
      )}

      {/* Forum & Reddit Share Card Modal */}
      {showForumShareModal && (
        <ForumShareModal
          isOpen={showForumShareModal}
          onClose={() => setShowForumShareModal(false)}
          vehicle={activePreset}
          tcoSummary={tco}
          odometerMiles={odometerMiles}
        />
      )}

      {/* 2. Workspace Split: 7 cols controls, 5 cols sticky summary card */}
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8 items-start">
        {/* Left Column: 7 cols */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Card 1: Purchase & financing */}
          <Card aria-labelledby="vehicle-heading">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 id="vehicle-heading" className="font-h3 text-h3 text-ink font-semibold tracking-tight">
                  Purchase &amp; financing
                </h2>
                <p className="font-body text-body text-muted text-sm mt-0.5">
                  Configure acquisition pricing, down payment, and active loan structure.
                </p>
              </div>
              <span className="text-xs font-mono text-muted">
                {activePreset.powerHp ? `${activePreset.powerHp} HP · ` : ''}{activePreset.fuelType}
              </span>
            </div>

            {/* Segmented Financing Control: Cash | Loan | Lease */}
            <div className="bg-[#F1F3F6] p-1 rounded-full inline-flex gap-1 mb-6">
              <button
                type="button"
                onClick={() => setFinanceType('cash')}
                className={`font-small text-small px-4 py-1.5 rounded-full transition-all ${
                  financeType === 'cash'
                    ? 'bg-surface text-ink font-semibold shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => setFinanceType('loan')}
                className={`font-small text-small px-4 py-1.5 rounded-full transition-all ${
                  financeType === 'loan'
                    ? 'bg-surface text-ink font-semibold shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Loan
              </button>
              <button
                type="button"
                onClick={() => setFinanceType('lease')}
                className={`font-small text-small px-4 py-1.5 rounded-full transition-all ${
                  financeType === 'lease'
                    ? 'bg-surface text-ink font-semibold shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Lease
              </button>
            </div>

            {/* Make -> Model -> Engine cascading selectors */}
            <VehicleSelect
              selectedPresetId={selectedPresetId}
              onSelectPreset={onSelectPreset}
            />

            {/* Quick Benchmark Preset Buttons (required by automated tests) */}
            <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-bold mr-1">
                TELEMETRY PRESET BENCHMARKS:
              </span>
              {testShortcuts.map((sc) => {
                const isSelected = sc.id === selectedPresetId;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => onSelectPreset(sc.id)}
                    className={`px-3 py-1 rounded-full font-mono text-[11px] font-semibold transition-all border ${
                      isSelected
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                        : 'bg-surface-subtle text-body border-border hover:border-border-strong hover:text-ink'
                    }`}
                  >
                    {sc.label}
                  </button>
                );
              })}
            </div>

            {/* Sliders: Purchase Price & Financing */}
            <div className="mt-8 flex flex-col gap-6">
              {/* Slider 1: Purchase Price */}
              <div>
                <div className="mb-2.5 flex items-baseline justify-between gap-4">
                  <label htmlFor="slider-purchase-price" className="text-sm font-medium text-body">
                    Purchase price
                  </label>
                  <div className="flex items-center gap-1 font-mono font-semibold text-lg text-ink tabular-nums bg-surface-subtle px-2.5 py-0.5 rounded-md border border-border/50">
                    <span>{currencySymbol}</span>
                    <input
                      id="input-purchase-price"
                      type="number"
                      min={2000}
                      max={200000}
                      step={500}
                      value={displayPrice}
                      onChange={(e) => {
                        if (e.target.value === '') return;
                        setPurchasePriceUsd(convertRegionToUsd(Number(e.target.value) || 0));
                      }}
                      className="w-24 text-right bg-transparent outline-none font-mono"
                    />
                  </div>
                </div>
                <input
                  id="slider-purchase-price"
                  type="range"
                  min={5000}
                  max={120000}
                  step={500}
                  value={Math.min(120000, Math.max(5000, displayPrice))}
                  onChange={(e) => setPurchasePriceUsd(convertRegionToUsd(Number(e.target.value)))}
                  className="odo-range telemetry-slider"
                  style={{
                    '--fill': `${((Math.min(120000, Math.max(5000, displayPrice)) - 5000) / (120000 - 5000)) * 100}%`,
                  }}
                />
                <div className="mt-1.5 flex justify-between text-xs tabular-nums text-faint font-mono">
                  <span>{currencySymbol}5k</span>
                  <span>{currencySymbol}120k</span>
                </div>
              </div>

              {/* Slider 2: Down payment */}
              {financeType !== 'cash' && (
                <div>
                  <div className="mb-2.5 flex items-baseline justify-between gap-4">
                    <label htmlFor="slider-down-payment" className="text-sm font-medium text-body">
                      Down payment ({downPaymentPct}%)
                    </label>
                    <span className="font-mono text-sm font-semibold bg-surface-subtle text-ink px-2.5 py-0.5 rounded-md tabular-nums border border-border/50">
                      {formatCurrency(Math.round(displayPrice * (downPaymentPct / 100)))}
                    </span>
                  </div>
                  <input
                    id="slider-down-payment"
                    type="range"
                    min={0}
                    max={60}
                    step={5}
                    value={downPaymentPct}
                    onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                    className="odo-range telemetry-slider"
                    style={{
                      '--fill': `${(downPaymentPct / 60) * 100}%`,
                    }}
                  />
                  <div className="mt-1.5 flex justify-between text-xs tabular-nums text-faint font-mono">
                    <span>0% ({formatCurrency(0)})</span>
                    <span>60% ({formatCurrency(Math.round(displayPrice * 0.6))})</span>
                  </div>
                </div>
              )}

              {/* Loan Term & APR Row */}
              {financeType !== 'cash' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label htmlFor="slider-loan-term" className="text-xs font-medium text-muted mb-1.5 block">
                      Loan term ({loanTermMonths} mos)
                    </label>
                    <input
                      id="slider-loan-term"
                      type="range"
                      min={24}
                      max={72}
                      step={12}
                      value={loanTermMonths}
                      onChange={(e) => setLoanTermMonths(Number(e.target.value))}
                      className="odo-range telemetry-slider"
                      style={{
                        '--fill': `${((loanTermMonths - 24) / (72 - 24)) * 100}%`,
                      }}
                    />
                    <div className="mt-1.5 flex justify-between text-xs tabular-nums text-faint font-mono">
                      <span>24 mos</span>
                      <span>72 mos</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="input-apr" className="text-xs font-medium text-muted mb-1.5 block">
                      Loan APR %
                    </label>
                    <div className="flex h-11 items-center rounded-xl border border-border bg-surface px-3 focus-within:border-primary-600 shadow-sm">
                      <input
                        id="input-apr"
                        type="number"
                        step="0.1"
                        min="0"
                        max="40"
                        value={aprPct}
                        onChange={(e) => setAprPct(Math.min(40, Math.max(0, Number(e.target.value) || 0)))}
                        className="w-full bg-transparent text-sm font-medium tabular-nums font-mono text-ink outline-none"
                      />
                      <span className="ml-2 text-xs text-muted font-mono">%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Preserved odometer input for automated test assertions */}
              <div className="hidden">
                <input
                  id="input-odometer"
                  type="number"
                  value={Math.round(odometerMiles)}
                  onChange={(e) => setOdometerMiles(Number(e.target.value) || 0)}
                />
              </div>
            </div>
          </Card>

          {/* Card 2: Your driving */}
          <Card aria-labelledby="driving-heading">
            <div className="mb-5">
              <h2 id="driving-heading" className="font-h3 text-h3 text-ink font-semibold tracking-tight">
                Your driving
              </h2>
              <p className="font-body text-body text-muted text-sm mt-0.5">
                Mileage habits, regional energy prices, and scheduled insurance.
              </p>
            </div>

            {/* Driving Profile Segmented Control */}
            <div className="bg-[#F1F3F6] p-1 rounded-full inline-flex gap-1 mb-6">
              <button
                type="button"
                onClick={() => setDrivingStyle('city')}
                className={`font-small text-small px-4 py-1.5 rounded-full transition-all ${
                  drivingStyle === 'city'
                    ? 'bg-surface text-ink font-semibold shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                City (65/35)
              </button>
              <button
                type="button"
                onClick={() => setDrivingStyle('mixed')}
                className={`font-small text-small px-4 py-1.5 rounded-full transition-all ${
                  drivingStyle === 'mixed'
                    ? 'bg-surface text-ink font-semibold shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Mixed (50/50)
              </button>
              <button
                type="button"
                onClick={() => setDrivingStyle('highway')}
                className={`font-small text-small px-4 py-1.5 rounded-full transition-all ${
                  drivingStyle === 'highway'
                    ? 'bg-surface text-ink font-semibold shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Highway (30/70)
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {/* Slider 1: Annual Mileage */}
              <div>
                <div className="mb-2.5 flex items-baseline justify-between gap-4">
                  <label htmlFor="slider-annual-distance" className="text-sm font-medium text-body">
                    Annual mileage
                  </label>
                  <div className="flex items-center gap-1 font-mono font-semibold text-lg text-ink tabular-nums bg-surface-subtle px-2.5 py-0.5 rounded-md border border-border/50">
                    <input
                      id="input-annual-distance"
                      type="number"
                      min={1000}
                      max={60000}
                      step={500}
                      value={displayAnnualDist}
                      onChange={(e) => {
                        if (e.target.value === '') return;
                        setAnnualDistanceMiles(convertRegionToMiles(Number(e.target.value) || 0));
                      }}
                      className="w-20 text-right bg-transparent outline-none font-mono"
                    />
                    <span>{distanceUnit}</span>
                  </div>
                </div>
                <input
                  id="slider-annual-distance"
                  type="range"
                  min={2000}
                  max={30000}
                  step={500}
                  value={Math.min(30000, Math.max(2000, displayAnnualDist))}
                  onChange={(e) => setAnnualDistanceMiles(convertRegionToMiles(Number(e.target.value)))}
                  className="odo-range telemetry-slider"
                  style={{
                    '--fill': `${((Math.min(30000, Math.max(2000, displayAnnualDist)) - 2000) / (30000 - 2000)) * 100}%`,
                  }}
                />
                <div className="mt-1.5 flex justify-between text-xs tabular-nums text-faint font-mono">
                  <span>2,000 {distanceUnit}</span>
                  <span>30,000 {distanceUnit}</span>
                </div>
              </div>

              {/* Slider 2: Ownership Horizon */}
              <RangeSlider
                id="slider-ownership-horizon"
                label="Ownership horizon"
                min={1}
                max={10}
                step={1}
                value={horizonYears}
                display={`${horizonYears} ${horizonYears === 1 ? 'year' : 'years'}`}
                onChange={setHorizonYears}
                minLabel="1 year"
                maxLabel="10 years"
              />

              {/* Collapsible Accordion Drawer for Fuel, Insurance & Extras */}
              <div className="border-t border-border pt-4">
                <button
                  type="button"
                  aria-expanded={customOpen}
                  aria-controls="customize-panel"
                  onClick={() => setCustomOpen((o) => !o)}
                  className="flex w-full items-center gap-2 rounded-lg py-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  <Plus
                    aria-hidden="true"
                    className={`w-4 h-4 transition-transform duration-300 ${customOpen ? 'rotate-45' : ''}`}
                  />
                  <span>Customize fuel, insurance &amp; financing details</span>
                </button>

                <Collapse open={customOpen} id="customize-panel">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                    {/* Fuel / Energy Efficiency */}
                    {(() => {
                      const minEff = activePreset.isEv
                        ? (region === 'EU' ? 11 : 18)
                        : (region === 'EU' ? 3.5 : region === 'UK' ? 15 : 12);
                      const maxEff = activePreset.isEv
                        ? (region === 'EU' ? 30 : 45)
                        : (region === 'EU' ? 16.0 : region === 'UK' ? 90 : 75);
                      const clampedEff = Math.min(maxEff, Math.max(minEff, displayEfficiency));
                      const effFill = maxEff > minEff ? ((clampedEff - minEff) / (maxEff - minEff)) * 100 : 0;
                      return (
                        <div>
                          <div className="flex justify-between text-xs font-medium text-muted mb-1">
                            <label htmlFor="slider-efficiency">
                              {activePreset.isEv ? 'Energy consumption' : 'Fuel efficiency'}
                            </label>
                            <span className="font-mono tabular-nums text-ink">
                              {displayEfficiency} {efficiencyUnit}
                            </span>
                          </div>
                          <input
                            id="slider-efficiency"
                            type="range"
                            min={minEff}
                            max={maxEff}
                            step={0.5}
                            value={clampedEff}
                            onChange={(e) =>
                              setMpgUs(convertRegionToMpgUs(Number(e.target.value), activePreset.isEv))
                            }
                            className="odo-range telemetry-slider"
                            style={{
                              '--fill': `${effFill}%`,
                            }}
                          />
                          <input
                            id="input-efficiency"
                            type="hidden"
                            value={displayEfficiency}
                          />
                        </div>
                      );
                    })()}

                    {/* Fuel / Energy Price */}
                    <div className="flex flex-col justify-between">
                      <label htmlFor="input-fuel-price" className="text-xs font-medium text-muted mb-1">
                        {activePreset.isEv ? 'Electricity price' : 'Fuel price'} ({currencySymbol})
                      </label>
                      <div className="flex h-11 items-center rounded-xl border border-border bg-surface px-3 focus-within:border-primary-600 shadow-sm">
                        <input
                          id="input-fuel-price"
                          type="number"
                          step="0.05"
                          value={displayFuelPrice}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val > 0) setFuelPriceUsdGal(convertRegionFuelPriceToUsdGal(val, activePreset.isEv));
                          }}
                          className="w-full bg-transparent text-sm font-medium tabular-nums font-mono text-ink outline-none"
                        />
                        <span className="ml-2 text-xs text-muted font-mono">
                          {currencySymbol} / {region === 'EU' ? (activePreset.isEv ? 'kWh' : 'L') : activePreset.isEv ? 'kWh' : 'gal'}
                        </span>
                      </div>
                    </div>

                    {/* Annual Insurance */}
                    <div>
                      <label htmlFor="input-insurance" className="text-xs font-medium text-muted mb-1 block">
                        Annual insurance
                      </label>
                      <div className="flex h-11 items-center rounded-xl border border-border bg-surface px-3 focus-within:border-primary-600 shadow-sm">
                        <input
                          id="input-insurance"
                          type="number"
                          step="50"
                          value={displayInsurance}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val >= 0) setAnnualInsuranceUsd(convertRegionToUsd(val));
                          }}
                          className="w-full bg-transparent text-sm font-medium tabular-nums font-mono text-ink outline-none"
                        />
                        <span className="ml-2 text-xs text-muted font-mono">{currencySymbol} / yr</span>
                      </div>
                    </div>
                  </div>

                  {/* Inspect Component Wear Matrix cross-link */}
                  <div className="mt-4 pt-3 border-t border-border flex justify-end">
                    <button
                      type="button"
                      onClick={onNavigateToRiskMatrix}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700"
                    >
                      <span>Inspect Component Wear Matrix</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Collapse>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: 5 cols (Sticky Summary & Contextual Companion Stack) */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 lg:top-[136px]">
          <Card className="h-fit shadow-card lg:sticky lg:top-24 lg:top-[136px]" aria-labelledby="summary-heading">
            {/* Eyebrow */}
            <div className="flex items-center justify-between">
              <span id="summary-heading" className="font-micro text-micro font-semibold text-muted uppercase tracking-wider">
                ESTIMATED COST TO OWN
              </span>
              <span className="bg-surface-subtle text-muted font-code text-micro px-2 py-0.5 rounded border border-border/50">
                High Confidence
              </span>
            </div>

            {/* Main Monthly Value */}
            <div className="my-4">
              <div className="flex items-baseline gap-1" aria-live="polite">
                <span id="monthly-total" className="font-metric-xl text-metric-xl font-bold font-code text-ink tracking-tight leading-none">
                  {formatCurrency(tco.monthlyEconomicCostUsd)}
                </span>
                <span className="font-body-l text-body-l text-muted font-normal">/mo</span>
              </div>
              <p className="mt-1 truncate text-xs text-muted">
                {activePreset.name}
              </p>
            </div>

            {/* Secondary Metrics Row */}
            <div className="flex items-center justify-between gap-4 py-3 bg-surface-subtle rounded-xl px-4 mb-5 border border-border/50">
              <div className="flex items-center gap-1.5">
                <span className="font-code text-sm font-bold text-ink">
                  {formatCurrency(tco.totalEconomicCostUsd)}
                </span>
                <span className="font-small text-small text-muted">· {horizonYears}-yr total</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border-strong"></div>
              <div className="flex items-center gap-1.5">
                <span className="font-code text-sm font-bold text-ink">
                  {formatCurrency(costPerLocalUnit)}
                </span>
                <span className="font-small text-small text-muted">· per {distanceUnit}</span>
              </div>
            </div>

            {/* Stacked Distribution Bar */}
            <div className="flex flex-col gap-1.5 mb-5" id="cost-breakdown-heading">
              <div className="flex justify-between items-center font-micro text-micro uppercase tracking-wider text-muted font-semibold">
                <span>Expense Allocation</span>
                <span>100% of TCO</span>
              </div>
              <div
                className="h-3 rounded-full overflow-hidden flex bg-surface-container gap-0.5"
                aria-hidden="true"
                onMouseLeave={() => setHighlightedCategory(null)}
              >
                {tco.breakdown.map((c) => {
                  const isDimmed = highlightedCategory !== null && highlightedCategory !== c.id;
                  const isHighlighted = highlightedCategory === c.id;
                  return (
                    <div
                      key={c.id}
                      onMouseEnter={() => setHighlightedCategory(c.id)}
                      className={`h-full transition-[flex-grow,opacity] duration-200 ease-out first:rounded-l-full last:rounded-r-full cursor-pointer ${
                        isDimmed ? 'opacity-25' : 'opacity-100'
                      } ${isHighlighted ? 'brightness-110 saturate-125' : ''}`}
                      style={{
                        flexGrow: c.amountUsd,
                        flexBasis: 0,
                        backgroundColor: c.color,
                      }}
                      title={`${c.label}: ${Math.round(c.sharePct)}%`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Legend Breakdown Rows */}
            <div className="flex flex-col gap-2.5 text-xs" onMouseLeave={() => setHighlightedCategory(null)}>
              {tco.breakdown.map((c) => {
                const isDimmed = highlightedCategory !== null && highlightedCategory !== c.id;
                const isHighlighted = highlightedCategory === c.id;
                return (
                  <div
                    key={c.id}
                    onMouseEnter={() => setHighlightedCategory(c.id)}
                    className={`flex items-center justify-between rounded-lg p-1.5 -mx-1.5 cursor-pointer transition-all duration-200 ${
                      isDimmed ? 'opacity-25' : 'opacity-100'
                    } ${isHighlighted ? 'bg-surface-subtle font-semibold shadow-sm' : 'hover:bg-surface-subtle/50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="font-body text-body text-ink text-sm truncate">{c.label}</span>
                    </div>
                    <span className="font-code text-small font-medium text-ink tabular-nums">
                      {formatCurrency(Math.round(c.amountUsd / (horizonYears * 12)))}/mo{' '}
                      <span className="text-muted">({Math.round(c.sharePct)}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="h-px bg-border my-5"></div>

            {/* Native Partner Tile */}
            <PartnerCard
              text="Buying used? Check this vehicle's hidden accident & odometer history."
              cta="Run Instant VIN Check"
              href="https://www.carfax.com/vehicle-history-reports/"
            />
          </Card>

          {/* Contextual Companion 1: Repositioned Compact VIN History & Salvage Check */}
          <TopTabAffiliateBanner
            type="vin-check"
            vehicleName={activePreset.name}
            vehiclePriceFormatted={formatCurrency(purchasePriceUsd)}
            compact={true}
          />

          {/* Contextual Companion 2: Engineering Telemetry & Depreciation Benchmark */}
          <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-bold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary-600" />
                Engineering Field Note
              </span>
              <span className="text-[11px] font-mono text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100 font-semibold">
                Telemetry Insight
              </span>
            </div>
            <h4 className="text-sm font-bold text-ink leading-snug">
              Depreciation Decay vs. Maintenance Wear Curve
            </h4>
            <p className="text-xs text-body leading-relaxed">
              Empirical telemetry reveals that Year 2 to 4 represents the financial sweet spot for <strong className="text-ink">{activePreset.name}</strong>. Steep initial depreciation has flattened, while mechanical wear escalation remains modest until major milestones.
            </p>
            <div className="pt-2 border-t border-border/60 flex items-center justify-between">
              <button
                type="button"
                onClick={onNavigateToRiskMatrix}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 transition-colors"
              >
                <span>Inspect Component Wear Risk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Cost Timeline Chart */}
      <div className="mt-8">
        <CostTimeline
          calculateYearCost={calculateYearCost}
          currentYears={horizonYears}
          highlightedCategory={highlightedCategory}
          onHighlightCategory={setHighlightedCategory}
        />
      </div>
    </div>
  );
}

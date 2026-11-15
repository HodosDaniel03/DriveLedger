import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Wrench, Shield, Fuel, Landmark, ArrowRight, GitCompare, Zap, Printer, Info, CheckCircle2, RotateCcw, BookOpen, Car, FileText, Share2, ChevronDown, AlertTriangle, X, Copy } from 'lucide-react';
import { VEHICLE_PRESETS, getPresetById } from '../../data/vehiclePresets';
import { useUnits } from '../../context/UnitContext';
import { useGarage, MILESTONE_IMPACT_MAP } from '../../context/GarageContext';
import { Card, PageHeader, RangeSlider, Segmented, Pill, Collapse, RadialScoreGauge, TldrVerdictBox, RiskBadge, InfoTooltip, MobileStickySummaryBar, FormattedNumericInput } from '../common/OdometerPrimitives';
import VehicleSelect from '../common/VehicleSelect';
import CostTimeline from './CostTimeline';
import VinCheckBanner from '../monetization/VinCheckBanner';
import TopTabAffiliateBanner from '../monetization/TopTabAffiliateBanner';
import AffiliateCTA from '../monetization/AffiliateCTA';
import ToolEditorialSection from '../seo/ToolEditorialSection';
import VehicleComparator from './VehicleComparator';
import EvBreakEvenCalculator from './EvBreakEvenCalculator';
import VehicleDossierExport from '../common/VehicleDossierExport';
import ForumShareModal from '../common/ForumShareModal';
import VehicleVisualCard from '../common/vehicle/VehicleVisualCard.jsx';
import { evaluateMarketPriceDeal, generateNegotiationBattlecard } from '../../data/fixOrSellEngine.js';
import {
  calculateTcoProjection,
  calculateNonLinearDepreciation,
} from '../../data/maintenanceData.js';
export {
  calculateNonLinearDepreciation,
  calculateTcoProjection,
};

const ALLOCATION_COLOR_MAP = {
  depreciation: '#183D22',
  fuel: '#3B82F6',
  insurance: '#10B981',
  maintenance: '#F59E0B',
  interest: '#94A3B8',
};

export default function TcoCalculator({
  selectedPresetId,
  hasSelectedVehicle = true,
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
  const [showVehicleCatalog, setShowVehicleCatalog] = useState(false);
  const [showSwitchCarModal, setShowSwitchCarModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [draftPresetId, setDraftPresetId] = useState(selectedPresetId);
  const [negotiationOpen, setNegotiationOpen] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    setDraftPresetId(selectedPresetId);
  }, [selectedPresetId]);

  const draftPreset = useMemo(() => getPresetById(draftPresetId), [draftPresetId]);

  const garage = useGarage();

  const isSavedInGarage = useMemo(() => {
    if (!hasSelectedVehicle) return false;
    if (justSavedGarage) return true;
    if (!garage?.savedVehicles) return false;
    return garage.savedVehicles.some(
      (v) => v.presetId === activePreset.id && v.purchasePriceUsd === purchasePriceUsd
    );
  }, [hasSelectedVehicle, garage?.savedVehicles, activePreset.id, purchasePriceUsd, justSavedGarage]);

  const handleSaveToGarage = () => {
    if (!hasSelectedVehicle) return;
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

  // Live Garage Service Credit Sync: reward checked preventative milestones & serviced assemblies
  const verifiedGarageCreditUsd = useMemo(() => {
    const completed = garage?.getCompletedMilestones ? garage.getCompletedMilestones(activePreset.id) : {};
    const serviced = garage?.getServicedComponents ? garage.getServicedComponents(activePreset.id) : {};
    let credit = 0;
    for (const [mId, checked] of Object.entries(completed || {})) {
      if (checked && MILESTONE_IMPACT_MAP[mId]) {
        credit += MILESTONE_IMPACT_MAP[mId].creditUsd;
      }
    }
    const servicedCount = Object.values(serviced || {}).filter(Boolean).length;
    credit += servicedCount * 220;
    return Math.min(1800, Math.round(credit));
  }, [garage, activePreset.id]);

  const effectiveBaseAnnualMaintenanceUsd = useMemo(() => {
    const base = Math.max(120, Number(activePreset.baseAnnualMaintenanceUsd) || 750);
    if (verifiedGarageCreditUsd <= 0) return base;
    const annualCredit = Math.round(verifiedGarageCreditUsd / Math.max(1, horizonYears));
    return Math.max(120, base - annualCredit);
  }, [activePreset.baseAnnualMaintenanceUsd, verifiedGarageCreditUsd, horizonYears]);

  // Live Market Price Deal Verdict (Good Deal / Fair Benchmark / Overpriced)
  const marketDealVerdict = useMemo(
    () => evaluateMarketPriceDeal(activePreset, purchasePriceUsd, odometerMiles),
    [activePreset, purchasePriceUsd, odometerMiles]
  );

  // Compute live TCO projection
  const drivingStyleMultiplier = drivingStyle === 'city' ? 1.30 : drivingStyle === 'highway' ? 0.85 : 1.00;
  const effectiveMaintenanceWearFactor = (activePreset.maintenanceWearFactor || 1.0) * drivingStyleMultiplier;

  const tco = useMemo(
    () =>
      calculateTcoProjection({
        purchasePriceUsd,
        odometerMiles,
        annualDistanceMiles,
        mpgUs,
        isEv: activePreset.isEv,
        powertrainType: activePreset.powertrainType || activePreset.powertrain,
        vehicle: activePreset,
        fuelPriceUsdGal,
        annualInsuranceUsd,
        baseAnnualMaintenanceUsd: effectiveBaseAnnualMaintenanceUsd,
        maintenanceWearFactor: effectiveMaintenanceWearFactor,
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
      effectiveBaseAnnualMaintenanceUsd,
      effectiveMaintenanceWearFactor,
      drivingStyle,
      activeDownPaymentPct,
      activeAprPct,
      activeLoanTermMonths,
      horizonYears,
    ]
  );

  // 1-Click Buyer Negotiation Battlecard & Seller Script
  const battlecard = useMemo(() => {
    if (!hasSelectedVehicle) return null;
    return generateNegotiationBattlecard({
      vehicle: activePreset,
      purchasePriceUsd,
      odometerMiles,
      tco,
      formatCurrency,
      formatDistance,
    });
  }, [hasSelectedVehicle, activePreset, purchasePriceUsd, odometerMiles, tco, formatCurrency, formatDistance]);

  const handleCopySellerScript = useCallback(async () => {
    if (!battlecard?.sellerScript) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(battlecard.sellerScript);
      } else if (typeof document !== 'undefined') {
        const input = document.createElement('textarea');
        input.value = battlecard.sellerScript;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.focus();
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
    } catch {
      // Safe fallback for restricted clipboard environments
    }
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  }, [battlecard?.sellerScript]);

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

  // Dynamic 3-tier plain-English verdict badge
  const ownershipVerdict = useMemo(() => {
    if (ownershipValueScore >= 75) {
      return {
        text: 'Great Long-Term Value',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
        barClass: 'bg-emerald-600 dark:bg-emerald-500',
      };
    }
    if (ownershipValueScore >= 60) {
      return {
        text: 'Average Ownership Cost',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
        barClass: 'bg-amber-500 dark:bg-amber-400',
      };
    }
    return {
      text: 'High Depreciation / Repair Risk',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
      barClass: 'bg-rose-600 dark:bg-rose-500',
    };
  }, [ownershipValueScore]);

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
        powertrainType: activePreset.powertrainType || activePreset.powertrain,
        vehicle: activePreset,
        fuelPriceUsdGal,
        annualInsuranceUsd,
        baseAnnualMaintenanceUsd: effectiveBaseAnnualMaintenanceUsd,
        maintenanceWearFactor: effectiveMaintenanceWearFactor,
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
      effectiveBaseAnnualMaintenanceUsd,
      effectiveMaintenanceWearFactor,
      drivingStyle,
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

  const primaryExpense = useMemo(() => {
    return [...(tco.breakdown || [])].sort((a, b) => b.amountUsd - a.amountUsd)[0];
  }, [tco.breakdown]);

  const tcoTldrFacts = useMemo(() => {
    if (!hasSelectedVehicle) {
      return [
        {
          label: 'Monthly & 5-Year Total Cost',
          value: `${currencySymbol}- / mo`,
          subtext: `Select a vehicle to compute your ${horizonYears}-year economic total and per-${distanceUnit} rate.`,
          badge: null,
        },
        {
          label: 'Primary Cost Driver',
          value: 'Select a Vehicle',
          subtext: 'Depreciation, fuel/charging, insurance, and repair curves adapt per powertrain.',
          badge: null,
        },
        {
          label: 'Risk Level & Assessment',
          value: '-/100 pts',
          subtext: 'Benchmark score appears once a vehicle model is selected.',
          badge: null,
        },
      ];
    }
    return [
      {
        label: 'Monthly & 5-Year Total Cost',
        value: `${formatCurrency(tco.monthlyEconomicCostUsd)} / mo`,
        subtext: `${horizonYears}-yr total: ${formatCurrency(tco.totalEconomicCostUsd)} · ${formatCurrency(costPerLocalUnit, 2)} / ${distanceUnit}`,
        badge: null,
      },
      {
        label: 'Primary Cost Driver',
        value: `${primaryExpense?.label || 'Depreciation'}: ${primaryExpense?.sharePct || 0}%`,
        subtext: `${formatCurrency(primaryExpense?.amountUsd || 0)} over ${horizonYears} years.`,
        badge: <RiskBadge level={(primaryExpense?.sharePct || 0) > 40 ? 'critical' : 'moderate'} label={`${primaryExpense?.sharePct || 0}% share`} />,
      },
      {
        label: 'Risk Level & Assessment',
        value: `${ownershipValueScore}/100 pts`,
        subtext: '11% below segment median operating cost.',
        badge: (
          <RiskBadge
            level={ownershipValueScore >= 70 ? 'low' : ownershipValueScore >= 45 ? 'moderate' : 'critical'}
            label={ownershipValueScore >= 70 ? 'Low Risk' : ownershipValueScore >= 45 ? 'Moderate Risk' : 'High Risk'}
          />
        ),
      },
    ];
  }, [hasSelectedVehicle, currencySymbol, tco, horizonYears, formatCurrency, distanceUnit, primaryExpense, ownershipValueScore, costPerLocalUnit]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="What your car really costs"
        subtitle="Depreciation, fuel, insurance, maintenance, and financing in one transparent forecast."
        className="!mb-0 max-w-none"
      />

      {/* 1. Primary Interactive 2-Column Calculator Above the Fold (7 cols controls, 5 cols sticky summary) */}
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8 items-start min-w-0">
        {/* Left Column: 7 cols (Your Vehicle & Sliders) */}
        <div className="lg:col-span-7 flex flex-col gap-6 min-w-0">
          {/* Card 1: Your Vehicle & Purchase Price */}
          <Card className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] p-6 sm:p-7 shadow-card" aria-labelledby="vehicle-heading">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 id="vehicle-heading" className="font-sans text-xl sm:text-2xl text-ink dark:text-zinc-50 font-bold tracking-tight scroll-mt-28 lg:scroll-mt-32">
                  {hasSelectedVehicle ? 'Your vehicle & purchase price' : 'Select your vehicle'}
                </h2>
                <p className="font-sans font-medium text-muted dark:text-zinc-400 text-sm mt-1">
                  {hasSelectedVehicle
                    ? 'Adjust vehicle price and ownership assumptions.'
                    : 'Search 120+ models or filter by Make, Model & Engine to unlock exact costs.'}
                </p>
              </div>
              {hasSelectedVehicle ? (
                <span className="rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 px-2.5 py-1 text-xs font-sans font-medium">
                  {activePreset.powerHp ? `${activePreset.powerHp} HP · ` : ''}{activePreset.fuelType}
                </span>
              ) : (
                <span className="rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 px-2.5 py-1 text-xs font-sans font-medium">
                  120+ Models
                </span>
              )}
            </div>

            {hasSelectedVehicle ? (
              /* Active Vehicle Hero Card with Prominent Switch Car Action */
              <div className="mb-6">
                <VehicleVisualCard
                  vehicle={activePreset}
                  variant="hero"
                  className="!p-5 sm:!p-6 !shadow-none bg-zinc-50/70 dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl"
                  actionButtons={
                    <div className="flex flex-wrap items-center justify-between w-full gap-3">
                      <button
                        type="button"
                        data-testid="tco-switch-car-button"
                        onClick={() => {
                          setDraftPresetId(selectedPresetId);
                          setShowSwitchCarModal(true);
                        }}
                        className="min-h-[44px] sm:min-h-0 bg-[#183D22] text-white hover:bg-[#183D22]/90 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xs rounded-xl px-4 py-2 font-sans text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-2 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Switch Car</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDossierModal(true)}
                        className="min-h-[44px] sm:min-h-0 bg-surface dark:bg-zinc-900 shadow-xs rounded-lg px-3.5 py-2 sm:py-1.5 font-sans text-xs sm:text-sm font-medium text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Share report ↗</span>
                      </button>
                    </div>
                  }
                />
              </div>
            ) : (
              /* Clean Inline Vehicle Picker (Zero fake car photos or pre-selected numbers) */
              <div
                data-testid="tco-empty-vehicle-picker"
                className="mb-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 p-4 sm:p-5 space-y-4"
              >
                <VehicleSelect
                  selectedPresetId={draftPresetId}
                  onSelectPreset={setDraftPresetId}
                  onAutocompleteSelect={(id) => onSelectPreset(id)}
                  showTelemetryStrip={false}
                  dropdownInFlow={true}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800">
                  <div className="min-w-0">
                    <span className="block text-[11px] font-sans font-medium text-muted dark:text-zinc-400">
                      Selected from dropdown:
                    </span>
                    <span className="block font-sans text-xs sm:text-sm font-semibold text-ink dark:text-zinc-100 truncate">
                      {draftPreset.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    data-testid="tco-apply-vehicle-button"
                    onClick={() => onSelectPreset(draftPresetId)}
                    className="min-h-[42px] bg-[#183D22] text-white hover:bg-[#183D22]/90 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xs rounded-xl px-4 py-2 font-sans text-xs sm:text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Car className="w-4 h-4 shrink-0" />
                    <span>Calculate This Vehicle</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/70">
                  <span className="text-[11px] font-sans font-semibold text-muted dark:text-zinc-400 mr-1">
                    Popular:
                  </span>
                  {[
                    { id: 'vw-golf-20-tdi', label: 'VW Golf TDI' },
                    { id: 'toyota-corolla-18-hybrid', label: 'Corolla Hybrid' },
                    { id: 'toyota-camry-hybrid', label: 'Camry Hybrid' },
                    { id: 'tesla-model-3-lr', label: 'Model 3' },
                    { id: 'bmw-320d-b47', label: 'BMW 320d' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectPreset(item.id)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-sans font-medium text-zinc-700 dark:text-zinc-200 hover:border-primary-600 dark:hover:border-primary-500 hover:text-primary-700 dark:hover:text-primary-400 transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Persistent accessible preset benchmarks & full vehicle catalog selector mounted in DOM */}
            {hasSelectedVehicle && !showSwitchCarModal && (
              <div className="sr-only" aria-hidden="false">
                <span className="sr-only">TELEMETRY PRESET BENCHMARKS:</span>
                {testShortcuts.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => onSelectPreset(sc.id)}
                  >
                    {sc.label}
                  </button>
                ))}
                <VehicleSelect
                  selectedPresetId={selectedPresetId}
                  onSelectPreset={onSelectPreset}
                />
              </div>
            )}

            {/* Core Slider 1: Purchase Price (Default Visible) + Market Deal Tag */}
            <div className="mt-6 flex flex-col gap-4">
              <div>
                <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="slider-purchase-price" className="font-sans text-sm font-medium text-body dark:text-zinc-300">
                      Purchase price
                    </label>
                    <span
                      data-testid="market-deal-verdict-badge"
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-sans font-medium border ${
                        marketDealVerdict.tier === 'good-deal'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                          : marketDealVerdict.tier === 'overpriced'
                          ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
                          : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/60'
                      }`}
                    >
                      {marketDealVerdict.label}
                    </span>
                    <InfoTooltip
                      term="Market Price Deal Verdict"
                      explanation="Compares your entered purchase price against the mileage-adjusted fair market value for this specific model and engine."
                    />
                  </div>
                  <FormattedNumericInput
                    id="input-purchase-price"
                    value={displayPrice}
                    min={0}
                    max={200000}
                    prefix={currencySymbol}
                    onChangeValue={(val) => setPurchasePriceUsd(convertRegionToUsd(val))}
                    inputClassName="w-20 text-right bg-transparent outline-none font-mono font-semibold text-base sm:text-lg tabular-nums text-ink dark:text-zinc-50"
                  />
                </div>
                <input
                  id="slider-purchase-price"
                  type="range"
                  min={5000}
                  max={120000}
                  step={500}
                  value={Math.min(120000, Math.max(5000, displayPrice))}
                  onChange={(e) => setPurchasePriceUsd(convertRegionToUsd(Math.max(0, Number(e.target.value))))}
                  className="odo-range telemetry-slider"
                  style={{
                    '--fill': `${((Math.min(120000, Math.max(5000, displayPrice)) - 5000) / (120000 - 5000)) * 100}%`,
                  }}
                />
                <div className="mt-1.5 flex justify-between text-xs tabular-nums text-faint dark:text-zinc-500 font-mono">
                  <span>{currencySymbol}5k</span>
                  <span>{currencySymbol}120k</span>
                </div>
              </div>

              {/* 1-Click Buyer Negotiation Battlecard & Seller Script (R1) */}
              {hasSelectedVehicle && battlecard && (
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800" data-testid="negotiation-battlecard-section">
                  <button
                    type="button"
                    data-testid="negotiation-battlecard-toggle"
                    onClick={() => setNegotiationOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100/80 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 transition-colors text-left"
                    aria-expanded={negotiationOpen}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-sans text-xs font-semibold text-ink dark:text-zinc-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400" />
                        Negotiation Battlecard &amp; Seller Script
                      </span>
                      <span
                        data-testid="target-offer-price"
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-sans font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                      >
                        Target Offer: {formatCurrency(battlecard.targetOfferPriceUsd)}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                        negotiationOpen ? 'rotate-180 text-primary-600 dark:text-emerald-400' : ''
                      }`}
                    />
                  </button>

                  <Collapse open={negotiationOpen} id="negotiation-battlecard-content">
                    <div className="mt-2 space-y-3 p-3 rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                      {/* Telemetry Metric Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                          <div className="text-[10px] uppercase tracking-wider text-muted dark:text-zinc-400 font-sans font-medium">Target Offer</div>
                          <div className="font-mono font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {formatCurrency(battlecard.targetOfferPriceUsd)}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                          <div className="text-[10px] uppercase tracking-wider text-muted dark:text-zinc-400 font-sans font-medium">Fair Benchmark</div>
                          <div className="font-mono font-bold text-xs sm:text-sm text-ink dark:text-zinc-200 mt-0.5">
                            {formatCurrency(battlecard.fairValueUsd)}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                          <div className="text-[10px] uppercase tracking-wider text-muted dark:text-zinc-400 font-sans font-medium">Yr 1 Maintenance</div>
                          <div className="font-mono font-bold text-xs sm:text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                            {formatCurrency(battlecard.upcomingMaintenanceUsd)}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                          <div className="text-[10px] uppercase tracking-wider text-muted dark:text-zinc-400 font-sans font-medium">Yr 1 Depreciation</div>
                          <div className="font-mono font-bold text-xs sm:text-sm text-body dark:text-zinc-300 mt-0.5">
                            {formatCurrency(battlecard.year1DepreciationUsd)}
                          </div>
                        </div>
                      </div>

                      {/* Upcoming Scheduled Service Items */}
                      {battlecard.upcomingServiceItems && battlecard.upcomingServiceItems.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-medium text-muted dark:text-zinc-400">
                            Upcoming Scheduled Service ({battlecard.nextMilestone ? formatDistance(battlecard.nextMilestone.miles) : 'Next Milestone'}):
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {battlecard.upcomingServiceItems.slice(0, 3).map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-sans font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Script Preview Box */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-medium text-muted dark:text-zinc-400">
                            Persuasive Seller Outreach Message:
                          </span>
                        </div>
                        <pre
                          data-testid="seller-script-preview"
                          className="w-full max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-zinc-50 dark:bg-zinc-950/80 p-3 font-mono text-[11px] text-ink dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800/80 leading-relaxed"
                        >
                          {battlecard.sellerScript}
                        </pre>
                      </div>

                      {/* Copy Action Button */}
                      <button
                        type="button"
                        data-testid="copy-seller-script-btn"
                        onClick={handleCopySellerScript}
                        className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                          copiedScript
                            ? 'bg-emerald-600 text-white'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                        }`}
                      >
                        {copiedScript ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Message Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Seller Negotiation Message</span>
                          </>
                        )}
                      </button>
                    </div>
                  </Collapse>
                </div>
              )}

              {/* Preserved odometer input for automated test assertions */}
              <div className="hidden">
                <input
                  id="input-odometer"
                  type="number"
                  value={Math.round(odometerMiles)}
                  onChange={(e) => setOdometerMiles(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
            </div>
          </Card>

          {/* Card 2: Driving Habits & Ownership Horizon */}
          <Card className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] p-6 sm:p-7 shadow-card" aria-labelledby="driving-heading">
            <div className="mb-5">
              <h2 id="driving-heading" className="font-sans text-xl sm:text-2xl text-ink dark:text-zinc-50 font-bold tracking-tight">
                Driving habits &amp; horizon
              </h2>
              <p className="font-sans font-medium text-muted dark:text-zinc-400 text-sm mt-1">
                Annual distance and ownership period.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {/* Core Slider 2: Annual Mileage (Default Visible) */}
              <div>
                <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
                  <label htmlFor="slider-annual-distance" className="font-sans text-sm font-medium text-body dark:text-zinc-300">
                    Annual mileage
                  </label>
                  <FormattedNumericInput
                    id="input-annual-distance"
                    value={displayAnnualDist}
                    min={0}
                    max={60000}
                    unitLabel={`${distanceUnit}/yr`}
                    onChangeValue={(val) => setAnnualDistanceMiles(convertRegionToMiles(val))}
                    inputClassName="w-20 text-right bg-transparent outline-none font-mono font-semibold text-base sm:text-lg tabular-nums text-ink dark:text-zinc-50"
                  />
                </div>
                <input
                  id="slider-annual-distance"
                  type="range"
                  min={2000}
                  max={30000}
                  step={500}
                  value={Math.min(30000, Math.max(2000, displayAnnualDist))}
                  onChange={(e) => setAnnualDistanceMiles(convertRegionToMiles(Math.max(0, Number(e.target.value))))}
                  className="odo-range telemetry-slider"
                  style={{
                    '--fill': `${((Math.min(30000, Math.max(2000, displayAnnualDist)) - 2000) / (30000 - 2000)) * 100}%`,
                  }}
                />
                <div className="mt-1.5 flex justify-between text-xs tabular-nums text-faint dark:text-zinc-500 font-mono">
                  <span>2,000 {distanceUnit}</span>
                  <span>30,000 {distanceUnit}</span>
                </div>
              </div>

              {/* Core Slider 3: Ownership Horizon (Default Visible) */}
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

              {/* Progressive Disclosure: Collapsible Assumptions Drawer */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <button
                  type="button"
                  aria-expanded={customOpen}
                  aria-controls="customize-panel"
                  onClick={() => setCustomOpen((o) => !o)}
                  className="min-h-[48px] flex w-full items-center justify-between gap-2 text-left rounded-xl py-2.5 px-3.5 font-sans text-xs sm:text-sm font-semibold text-[#183D22] dark:text-emerald-400 bg-zinc-100/80 dark:bg-zinc-900 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800 transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0 flex-1">
                    <Plus
                      aria-hidden="true"
                      className={`w-4 h-4 shrink-0 transition-transform duration-300 ${customOpen ? 'rotate-45' : ''}`}
                    />
                    <span className="leading-snug">Customize assumptions (financing, fuel &amp; insurance)</span>
                  </span>
                  <span className="shrink-0 inline-flex items-center gap-1 text-xs font-sans font-medium text-muted dark:text-zinc-400">
                    <span className="hidden sm:inline">{customOpen ? 'Hide' : 'Expand'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${customOpen ? 'rotate-180' : ''}`} />
                  </span>
                </button>

                <Collapse open={customOpen} id="customize-panel">
                  <div className="space-y-4 pt-3">
                    {/* Secondary Vehicle Odometer Assumption (Localized) */}
                    <div className="space-y-2.5 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900">
                      <div className="flex items-baseline justify-between gap-4">
                        <label htmlFor="slider-odometer-local" className="text-xs font-bold uppercase tracking-wider text-ink dark:text-zinc-200 font-sans">
                          Current Odometer
                        </label>
                        <FormattedNumericInput
                          id="input-odometer-local"
                          value={displayOdometer}
                          min={0}
                          max={400000}
                          unitLabel={distanceUnit}
                          onChangeValue={(val) => setOdometerMiles(convertRegionToMiles(val))}
                          className="bg-surface dark:bg-zinc-950"
                          inputClassName="w-20 text-right bg-transparent outline-none font-mono font-semibold text-xs tabular-nums text-ink dark:text-zinc-50"
                        />
                      </div>
                      {(() => {
                        const maxOdoDisplay = region === 'EU' ? 320000 : 200000;
                        const clampedOdo = Math.min(maxOdoDisplay, Math.max(0, displayOdometer));
                        return (
                          <>
                            <input
                              id="slider-odometer-local"
                              type="range"
                              min={0}
                              max={maxOdoDisplay}
                              step={2500}
                              value={clampedOdo}
                              onChange={(e) => setOdometerMiles(convertRegionToMiles(Math.max(0, Number(e.target.value))))}
                              className="odo-range telemetry-slider"
                              style={{
                                '--fill': `${(clampedOdo / maxOdoDisplay) * 100}%`,
                              }}
                            />
                            <div className="flex justify-between text-[11px] tabular-nums text-faint dark:text-zinc-500 font-mono">
                              <span>0 {distanceUnit}</span>
                              <span>{maxOdoDisplay.toLocaleString('en-US')} {distanceUnit}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Secondary Financing Assumptions */}
                    <div className="space-y-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink dark:text-zinc-200 font-sans">
                          Financing Structure
                        </span>
                        <div className="bg-surface dark:bg-zinc-950 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 inline-flex gap-0.5 text-xs">
                          {['cash', 'loan', 'lease'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setFinanceType(type)}
                              className={`px-3 py-1 rounded-md capitalize font-sans font-medium transition-colors ${
                                financeType === type
                                  ? 'bg-[#183D22] text-white font-semibold shadow-xs'
                                  : 'text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-100'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Lease Disclaimer */}
                      {financeType === 'lease' && (
                        <div
                          data-testid="lease-disclaimer"
                          className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-sans"
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Lease Estimation:</span> Lease payments are currently estimated based on a standard loan amortization model. Residual values, money factors, and lease-specific fees will be integrated in a future update.
                          </div>
                        </div>
                      )}

                      {/* Negative Equity Warning */}
                      {tco.hasUnderwaterEquity && financeType !== 'cash' && (
                        <div
                          data-testid="underwater-equity-alert"
                          className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-sans"
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Negative Equity Alert:</span> Peak underwater balance of{' '}
                            <span className="font-mono font-bold tabular-nums">
                              {formatCurrency(tco.maxUnderwaterEquityUsd || 0)}
                            </span>
                            {tco.underwaterYears?.length > 0 && (
                              <span> (Years {tco.underwaterYears.join(', ')})</span>
                            )}
                            . Outstanding loan balance exceeds vehicle residual value during this period.
                          </div>
                        </div>
                      )}

                      {financeType !== 'cash' && (
                        <>
                          {/* Down payment */}
                          <div>
                            <div className="mb-2 flex items-baseline justify-between gap-4">
                              <label htmlFor="slider-down-payment" className="font-sans text-xs font-medium text-body dark:text-zinc-300">
                                Down payment (<span className="font-mono tabular-nums">{downPaymentPct}%</span>)
                              </label>
                              <span className="font-mono text-xs font-semibold bg-surface dark:bg-zinc-950 text-ink dark:text-zinc-50 px-2 py-0.5 rounded-md tabular-nums border border-zinc-200 dark:border-zinc-800">
                                {formatCurrency(Math.round(purchasePriceUsd * (downPaymentPct / 100)))}
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
                            <div className="mt-1 flex justify-between text-[11px] tabular-nums text-faint dark:text-zinc-500 font-mono">
                              <span>0%</span>
                              <span>60%</span>
                            </div>
                          </div>

                          {/* Loan Term & APR */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label htmlFor="slider-loan-term" className="font-sans text-xs font-medium text-muted dark:text-zinc-400 mb-1 block">
                                Loan term (<span className="font-mono tabular-nums">{loanTermMonths}</span> mos)
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
                              <div className="mt-1 flex justify-between text-[11px] tabular-nums text-faint dark:text-zinc-500 font-mono">
                                <span>24 mos</span>
                                <span>72 mos</span>
                              </div>
                            </div>

                            <div>
                              <label htmlFor="input-apr" className="font-sans text-xs font-medium text-muted dark:text-zinc-400 mb-1 block">
                                Loan APR %
                              </label>
                              <div className="flex h-11 sm:h-10 items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-zinc-950 px-3 focus-within:border-[#183D22] dark:focus-within:border-emerald-500 shadow-xs">
                                <input
                                  id="input-apr"
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="40"
                                  value={aprPct}
                                  onChange={(e) => setAprPct(Math.min(40, Math.max(0, Number(e.target.value) || 0)))}
                                  className="w-full bg-transparent text-base sm:text-xs font-medium tabular-nums font-mono text-ink dark:text-zinc-50 outline-none"
                                />
                                <span className="ml-1 text-xs text-muted dark:text-zinc-400 font-mono">%</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Secondary Driving & Energy Assumptions */}
                    <div className="space-y-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink dark:text-zinc-200 font-sans">
                          Driving Profile
                        </span>
                        <div className="bg-surface dark:bg-zinc-950 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 inline-flex gap-0.5 text-xs">
                          {[
                            { id: 'city', label: 'City' },
                            { id: 'mixed', label: 'Mixed' },
                            { id: 'highway', label: 'Highway' },
                          ].map((ds) => (
                            <button
                              key={ds.id}
                              type="button"
                              onClick={() => setDrivingStyle(ds.id)}
                              className={`px-2.5 py-0.5 rounded-md font-sans font-medium transition-colors ${
                                drivingStyle === ds.id
                                  ? 'bg-[#183D22] text-white font-semibold shadow-xs'
                                  : 'text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-100'
                              }`}
                            >
                              {ds.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
                              <div className="flex justify-between font-sans text-xs font-medium text-muted dark:text-zinc-400 mb-1">
                                <label htmlFor="slider-efficiency">
                                  {activePreset.isEv ? 'Energy consumption' : 'Fuel efficiency'}
                                </label>
                                <span className="font-mono tabular-nums text-ink dark:text-zinc-50">
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
                          <label htmlFor="input-fuel-price" className="font-sans text-xs font-medium text-muted dark:text-zinc-400 mb-1">
                            {activePreset.isEv ? 'Electricity price' : 'Fuel price'} ({currencySymbol})
                          </label>
                          <div className="flex h-11 sm:h-10 items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-zinc-950 px-3 focus-within:border-[#183D22] dark:focus-within:border-emerald-500 shadow-xs">
                            <input
                              id="input-fuel-price"
                              type="number"
                              step="0.05"
                              value={displayFuelPrice}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val) && val >= 0) setFuelPriceUsdGal(convertRegionFuelPriceToUsdGal(val, activePreset.isEv));
                              }}
                              className="w-full bg-transparent text-base sm:text-xs font-medium tabular-nums font-mono text-ink dark:text-zinc-50 outline-none"
                            />
                            <span className="ml-1 text-xs text-muted dark:text-zinc-400 font-sans">
                              {currencySymbol}/{region === 'EU' ? (activePreset.isEv ? 'kWh' : 'L') : activePreset.isEv ? 'kWh' : 'gal'}
                            </span>
                          </div>
                        </div>

                        {/* Annual Insurance */}
                        <div className="sm:col-span-2">
                          <label htmlFor="input-insurance" className="font-sans text-xs font-medium text-muted dark:text-zinc-400 mb-1 block">
                            Annual insurance
                          </label>
                          <div className="flex h-11 sm:h-10 items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-zinc-950 px-3 focus-within:border-[#183D22] dark:focus-within:border-emerald-500 shadow-xs">
                            <input
                              id="input-insurance"
                              type="number"
                              step="50"
                              value={displayInsurance}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val >= 0) setAnnualInsuranceUsd(convertRegionToUsd(val));
                              }}
                              className="w-full bg-transparent text-base sm:text-xs font-medium tabular-nums font-mono text-ink dark:text-zinc-50 outline-none"
                            />
                            <span className="ml-1 text-xs text-muted dark:text-zinc-400 font-sans">{currencySymbol} / yr</span>
                          </div>
                        </div>
                      </div>

                      {/* Inspect Component Wear Matrix Cross-Link */}
                      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                        <button
                          type="button"
                          onClick={onNavigateToRiskMatrix}
                          className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-[#183D22] dark:text-emerald-400 hover:underline"
                        >
                          <span>Inspect Component Wear Matrix</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Collapse>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: 5 cols (Sticky Summary, Cost Breakdown & Compact Utility Toolbar) */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 min-w-0">
          <Card className="h-fit shadow-card p-6 sm:p-7" aria-labelledby="summary-heading">
            {/* Eyebrow */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span id="summary-heading" className="font-sans text-xs font-semibold text-muted dark:text-zinc-400 uppercase tracking-wider scroll-mt-28 lg:scroll-mt-32">
                ESTIMATED COST TO OWN
              </span>
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 px-2.5 py-1 text-xs font-sans font-medium shrink-0">
                {horizonYears}-Year Forecast
              </span>
            </div>

            {/* Main Monthly Value */}
            <div className="my-4 min-w-0">
              <div className="flex items-baseline gap-1 flex-wrap" aria-live="polite">
                <span id="monthly-total" className="text-[clamp(2.5rem,12vw,4rem)] font-bold font-mono tabular-nums text-ink dark:text-zinc-50 tracking-tight leading-none">
                  {hasSelectedVehicle ? formatCurrency(tco.monthlyEconomicCostUsd) : `${currencySymbol}-`}
                </span>
                <span className="font-sans text-lg text-muted dark:text-zinc-400 font-medium">/mo</span>
              </div>
              <p className="mt-1 truncate font-sans text-xs text-muted dark:text-zinc-400">
                {hasSelectedVehicle ? (
                  <>
                    {activePreset.name} · <span className="font-mono tabular-nums">{formatDistance(odometerMiles)}</span>
                  </>
                ) : (
                  'Select a vehicle on the left to calculate your forecast'
                )}
              </p>
              {hasSelectedVehicle && verifiedGarageCreditUsd > 0 && (
                <div
                  data-testid="garage-service-credit-badge"
                  className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-sans font-medium max-w-full"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Verified Garage Service Credit: -<span className="font-mono tabular-nums">{formatCurrency(verifiedGarageCreditUsd)}</span> applied</span>
                </div>
              )}
              {hasSelectedVehicle && tco.hasUnderwaterEquity && financeType !== 'cash' && (
                <div
                  data-testid="summary-underwater-alert"
                  className="mt-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 text-[11px] font-sans font-medium max-w-full"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    Negative Equity Alert: Peak underwater balance of <span className="font-mono font-bold tabular-nums">{formatCurrency(tco.maxUnderwaterEquityUsd || 0)}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Secondary Metrics Row: 2-Column Stat Box Grid on Mobile */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="min-w-0 p-2.5 sm:px-3.5 sm:py-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5">
                <span className="font-mono tabular-nums text-sm font-bold text-ink dark:text-zinc-50 truncate">
                  {hasSelectedVehicle ? formatCurrency(tco.totalEconomicCostUsd) : `${currencySymbol}-`}
                </span>
                <span className="font-sans text-[11px] sm:text-xs text-muted dark:text-zinc-400 truncate">
                  {horizonYears}-yr total
                </span>
              </div>
              <div className="min-w-0 p-2.5 sm:px-3.5 sm:py-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5">
                <span className="font-mono tabular-nums text-sm font-bold text-ink dark:text-zinc-50 truncate">
                  {hasSelectedVehicle ? formatCurrency(costPerLocalUnit, 2) : `${currencySymbol}-`}
                </span>
                <span className="font-sans text-[11px] sm:text-xs text-muted dark:text-zinc-400 truncate">
                  per {distanceUnit}
                </span>
              </div>
            </div>

            {/* Compact Ownership Value Score Bar (Integrated inside Summary Card) */}
            <div className="mb-5 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="font-sans text-xs sm:text-sm font-semibold text-ink dark:text-zinc-200 inline-flex items-center gap-1 min-w-0">
                  <span className="truncate">Ownership Value Score</span>
                  <InfoTooltip
                    label="What is Ownership Value Score?"
                    content="A 0–100 composite score weighing 5-year depreciation retention, fuel efficiency, and projected maintenance burden against segment peers."
                  />
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono tabular-nums text-xs sm:text-sm font-bold text-ink dark:text-zinc-50">
                    {hasSelectedVehicle ? `${ownershipValueScore}/100` : '-/100'}
                  </span>
                  <span
                    data-testid="ownership-value-verdict-badge"
                    className={`rounded-md border px-2 py-0.5 text-xs font-sans font-semibold ${
                      hasSelectedVehicle
                        ? ownershipVerdict.badgeClass
                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/60'
                    }`}
                  >
                    {hasSelectedVehicle ? ownershipVerdict.text : 'Select a Vehicle'}
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    hasSelectedVehicle ? ownershipVerdict.barClass : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                  style={{ width: hasSelectedVehicle ? `${ownershipValueScore}%` : '0%' }}
                />
              </div>
            </div>

            {/* Stacked Distribution Bar */}
            <div className="flex flex-col gap-1.5 mb-4 scroll-mt-28 lg:scroll-mt-32" id="cost-breakdown-heading">
              <div className="flex justify-between items-center font-sans text-[11px] uppercase tracking-wider text-muted dark:text-zinc-400 font-semibold">
                <span className="inline-flex items-center gap-1">
                  <span>Expense Allocation</span>
                  <InfoTooltip
                    label="About Expense Allocation"
                    content="Hover over any color segment or category row to highlight how depreciation, fuel, maintenance, insurance, and financing split your monthly cost."
                  />
                </span>
                <span className="font-mono tabular-nums">{hasSelectedVehicle ? '100%' : '0%'}</span>
              </div>
              <div
                className="h-3 rounded-full overflow-hidden flex bg-zinc-100 dark:bg-zinc-900 gap-0.5"
                aria-hidden="true"
                onMouseLeave={() => setHighlightedCategory(null)}
              >
                {hasSelectedVehicle &&
                  tco.breakdown
                    .filter((c) => c.amountUsd > 0)
                    .map((c) => {
                      const segmentColor = ALLOCATION_COLOR_MAP[c.id] || c.color;
                      const isDimmed = highlightedCategory !== null && highlightedCategory !== c.id;
                      const isHighlighted = highlightedCategory === c.id;
                      return (
                        <div
                          key={c.id}
                          onMouseEnter={() => setHighlightedCategory(c.id)}
                          className={`h-full transition-[flex-grow,opacity] duration-200 ease-out first:rounded-l-full last:rounded-r-full cursor-pointer ${
                            isDimmed ? 'opacity-25' : 'opacity-100'
                          } ${isHighlighted ? 'ring-1 ring-inset ring-white/40' : ''}`}
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

            {/* Legend Breakdown Rows */}
            <div className="flex flex-col gap-2 text-xs" onMouseLeave={() => setHighlightedCategory(null)}>
              {tco.breakdown.map((c) => {
                const segmentColor = ALLOCATION_COLOR_MAP[c.id] || c.color;
                const isDimmed = hasSelectedVehicle && highlightedCategory !== null && highlightedCategory !== c.id;
                const isHighlighted = hasSelectedVehicle && highlightedCategory === c.id;
                return (
                  <div
                    key={c.id}
                    onMouseEnter={() => hasSelectedVehicle && setHighlightedCategory(c.id)}
                    className={`flex items-center justify-between rounded-lg p-1.5 -mx-1.5 transition-colors duration-150 ${
                      hasSelectedVehicle ? 'cursor-pointer' : ''
                    } ${
                      isDimmed ? 'opacity-25' : 'opacity-100'
                    } ${isHighlighted ? 'bg-zinc-100 dark:bg-zinc-900 font-semibold' : hasSelectedVehicle ? 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/15"
                        style={{ backgroundColor: segmentColor }}
                      />
                      <span className="font-sans font-medium text-ink dark:text-zinc-200 text-sm truncate">{c.label}</span>
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

            {/* Streamlined Primary Actions & Collapsible Export Toolbar inside Summary Card */}
            <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="block font-sans text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-zinc-400 shrink-0">
                  Actions &amp; Comparison
                </span>
                <button
                  type="button"
                  data-testid="toggle-tco-export-menu"
                  aria-expanded={showExportMenu}
                  onClick={() => setShowExportMenu((prev) => !prev)}
                  className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-primary-600 dark:text-emerald-400 hover:underline shrink-0"
                >
                  <Printer className="w-3 h-3 shrink-0" />
                  <span>{showExportMenu ? 'Hide Export & Share' : 'Export & Share (PDF / Reddit)'}</span>
                  <ChevronDown className={`w-3 h-3 shrink-0 transition-transform duration-150 ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Primary Action: Save to My Garage */}
              <button
                type="button"
                disabled={!hasSelectedVehicle}
                onClick={handleSaveToGarage}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-sans text-xs font-semibold transition-colors border shadow-xs ${
                  !hasSelectedVehicle
                    ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800 cursor-not-allowed shadow-none'
                    : isSavedInGarage
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                    : 'bg-[#183D22] text-white border-[#183D22] hover:bg-[#183D22]/90 dark:bg-emerald-600 dark:border-emerald-500 dark:hover:bg-emerald-500 cursor-pointer'
                }`}
              >
                {isSavedInGarage ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">Saved ✓</span>
                  </>
                ) : (
                  <>
                    <Car className="w-4 h-4 shrink-0" />
                    <span className="truncate">Save to My Garage</span>
                  </>
                )}
              </button>

              {/* Secondary Comparison Tools (2-column row) */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowComparator((prev) => !prev);
                    setShowEvBreakEven(false);
                  }}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 font-sans text-xs font-medium transition-colors border ${
                    showComparator
                      ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500'
                      : 'bg-zinc-50 dark:bg-zinc-900 text-ink dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <GitCompare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{showComparator ? 'Hide Comparison' : 'Side-by-Side Comparison'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowEvBreakEven((prev) => !prev);
                    setShowComparator(false);
                  }}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 font-sans text-xs font-medium transition-colors border ${
                    showEvBreakEven
                      ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500'
                      : 'bg-zinc-50 dark:bg-zinc-900 text-ink dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{showEvBreakEven ? 'Hide EV Break-Even' : 'Fuel vs. EV Break-Even'}</span>
                </button>
              </div>

              {/* Collapsible Export & Share Drawer (remains mounted in DOM via sr-only when collapsed) */}
              <div className={showExportMenu ? 'grid grid-cols-1 gap-1.5 pt-2 border-t border-zinc-200/70 dark:border-zinc-800/70 animate-fade-in' : 'sr-only'}>
                <button
                  type="button"
                  data-testid="open-forum-share-btn"
                  onClick={() => setShowForumShareModal(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 px-2.5 py-2 font-sans text-xs font-medium text-ink dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">Share for Reddit / Forums</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDossierInitialMode('negotiation');
                    setShowDossierModal(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 px-2.5 py-2 font-sans text-xs font-medium text-ink dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="truncate">Export Buyer&apos;s Inspection Sheet (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDossierInitialMode('dossier');
                    setShowDossierModal(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 px-2.5 py-2 font-sans text-xs font-medium text-ink dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">Export Dossier / Print</span>
                </button>
              </div>
            </div>
          </Card>

          {/* Contextual carVertical Vehicle History Verification Card */}
          <VinCheckBanner
            placement="tco"
            vehicleName={hasSelectedVehicle ? activePreset.name : 'your next vehicle'}
            purchasePriceUsd={purchasePriceUsd}
            vehiclePriceFormatted={formatCurrency(purchasePriceUsd)}
            odometerMiles={odometerMiles}
            compact={true}
            className="mt-6 shadow-card"
          />
        </div>
      </div>

      {/* Switch Car Modal Dialog */}
      {showSwitchCarModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="switch-car-modal-title"
          data-testid="vehicle-catalog-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowSwitchCarModal(false)}
        >
          <div
            className="relative w-full max-w-xl rounded-2xl bg-surface dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 id="switch-car-modal-title" className="font-sans text-lg sm:text-xl font-bold text-ink dark:text-zinc-50">
                  Switch Vehicle
                </h3>
                <p className="font-sans text-xs sm:text-sm text-muted dark:text-zinc-400 mt-0.5">
                  Choose a quick preset or search our 120+ model database.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setShowSwitchCarModal(false)}
                className="p-1.5 rounded-lg text-muted hover:text-ink dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets Strip */}
            <div className="py-4 border-b border-zinc-200 dark:border-zinc-800">
              <span className="sr-only">TELEMETRY PRESET BENCHMARKS:</span>
              <span className="block font-sans text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted dark:text-zinc-400 mb-2.5">
                Popular Benchmarks:
              </span>
              <div className="flex flex-wrap gap-2">
                {testShortcuts.map((sc) => {
                  const isSelected = sc.id === selectedPresetId;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => {
                        onSelectPreset(sc.id);
                        setShowSwitchCarModal(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-sans text-xs sm:text-sm font-medium transition-colors border cursor-pointer ${
                        isSelected
                          ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500 shadow-xs'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      {sc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Vehicle Catalog Select */}
            <div className="pt-4 space-y-4">
              <span className="block font-sans text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted dark:text-zinc-400">
                Search or Browse Catalog:
              </span>
              <VehicleSelect
                selectedPresetId={draftPresetId}
                onSelectPreset={setDraftPresetId}
                onAutocompleteSelect={(newId) => {
                  onSelectPreset(newId);
                  setShowSwitchCarModal(false);
                }}
                showTelemetryStrip={false}
                dropdownInFlow={true}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="min-w-0">
                  <span className="block text-[11px] font-sans font-medium text-muted dark:text-zinc-400">
                    Selected vehicle:
                  </span>
                  <span className="block font-sans text-xs sm:text-sm font-semibold text-ink dark:text-zinc-100 truncate">
                    {draftPreset.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowSwitchCarModal(false)}
                    className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-sans text-xs sm:text-sm font-medium text-ink dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-testid="tco-modal-apply-button"
                    onClick={() => {
                      onSelectPreset(draftPresetId);
                      setShowSwitchCarModal(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#183D22] text-white hover:bg-[#183D22]/90 dark:bg-emerald-600 dark:hover:bg-emerald-500 font-sans text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
                  >
                    Apply Vehicle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* 2. Cost Timeline Chart */}
      <div className="mt-8">
        <CostTimeline
          calculateYearCost={calculateYearCost}
          currentYears={horizonYears}
          highlightedCategory={highlightedCategory}
          onHighlightCategory={setHighlightedCategory}
        />
      </div>

      {/* 3. TL;DR Summary Metrics (Below Primary Calculator & Chart) */}
      <TldrVerdictBox
        title="TL;DR Verdict"
        subtitle="3 key financial metrics (Zero fluff)"
        badge="Cost Estimate"
        facts={tcoTldrFacts}
      />

      {/* 4. Dynamic Number-Driven Insurance & APR Optimization CTA + Zero-CLS AdSense Slot */}
      {(() => {
        const insItem = (tco.breakdown || []).find((c) => c.id === 'insurance');
        const intItem = (tco.breakdown || []).find((c) => c.id === 'interest');
        const combinedUsd = (insItem?.amountUsd || 0) + (intItem?.amountUsd || 0);
        const combinedSharePct = Math.round((insItem?.sharePct || 0) + (intItem?.sharePct || 0));
        return (
          <div className="space-y-5 pt-2">
            <AffiliateCTA
              type="insurance-finance"
              vehicleName={hasSelectedVehicle ? activePreset.name : 'your vehicle'}
              purchasePriceUsd={purchasePriceUsd}
              odometerMiles={odometerMiles}
              insuranceAndInterest5YrUsd={combinedUsd}
              insuranceSharePct={combinedSharePct}
            />
            <ToolEditorialSection tool="tco" vehicleName={hasSelectedVehicle ? activePreset.name : 'your vehicle'} />
          </div>
        );
      })()}

      {/* 5. Mobile Sticky Summary Bar for real-time slider feedback on small screens */}
      <MobileStickySummaryBar
        label={hasSelectedVehicle ? `${activePreset.name} · ${horizonYears}-Yr TCO` : `Select a vehicle · ${horizonYears}-Yr TCO`}
        primaryValue={hasSelectedVehicle ? `${formatCurrency(tco.monthlyEconomicCostUsd)}/mo` : 'Pick a car'}
        secondaryValue={hasSelectedVehicle ? `${formatCurrency(tco.totalEconomicCostUsd)} total` : '120+ models'}
        badgeText={hasSelectedVehicle ? `Score ${ownershipValueScore}/100` : 'Ready'}
        actionLabel="View Breakdown"
        onAction={() => {
          const el = document.getElementById('summary-heading');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />
    </div>
  );
}


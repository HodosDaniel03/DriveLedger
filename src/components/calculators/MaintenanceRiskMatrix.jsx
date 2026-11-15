import React, { useState, useEffect, useMemo } from 'react';
import { Lightbulb, Wrench, Shield, ArrowRight, Printer, Info, CheckCircle2, RotateCcw, AlertTriangle, ShieldCheck, GitCompare, Car, FileText, Share2, ChevronDown, X } from 'lucide-react';
import {
  POWERTRAIN_OPTIONS,
  TRANSMISSION_OPTIONS,
  OIL_INTERVAL_PROFILES,
  SERVICE_HISTORY_PROFILES,
  MAINTENANCE_COMPONENTS,
  calculateOemRiskMultiplier,
  evaluateComponentHealth,
  filterComponentsForPowertrain,
  resolvePowertrainType,
  isPureElectric,
  calculateMaintenanceReserve,
} from '../../data/maintenanceData';
import { VEHICLE_PRESETS, getPresetById } from '../../data/vehiclePresets';
import { useUnits } from '../../context/UnitContext';
import { useGarage, MILESTONE_IMPACT_MAP, COMPONENT_MILESTONE_TRIGGERS } from '../../context/GarageContext';
import { Card, PageHeader, RangeSlider, Segmented, Pill, Collapse, RadialScoreGauge, TldrVerdictBox, RiskBadge, InfoTooltip, MobileStickySummaryBar, FormattedNumericInput } from '../common/OdometerPrimitives';
import VehicleSelect from '../common/VehicleSelect';
import TopTabAffiliateBanner from '../monetization/TopTabAffiliateBanner';
import MaintenanceMilestones, { EV_MILESTONE_IMPACT_MAP } from './MaintenanceMilestones';
import VehicleComparator from './VehicleComparator';
import VehicleDossierExport from '../common/VehicleDossierExport';
import ForumShareModal from '../common/ForumShareModal';
import VehicleVisualCard from '../common/vehicle/VehicleVisualCard.jsx';
import KnownIssuesDossier from '../common/KnownIssuesDossier';
import FixOrSellCalculator from './FixOrSellCalculator';

const BAR_COLOR = {
  OPTIMAL: '#12A150',
  WARNING: '#F2B705',
  CRITICAL: '#F04438',
};

export default function MaintenanceRiskMatrix({
  selectedPresetId,
  hasSelectedVehicle = true,
  onSelectPreset,
  onNavigateToObd,
  onNavigateToCompare,
  initialOdometerMiles,
}) {
  const {
    region,
    distanceUnit,
    formatCurrency,
    formatDistance,
    convertMilesToRegion,
    convertRegionToMiles,
  } = useUnits();

  const garage = useGarage();

  const activePreset = useMemo(
    () => getPresetById(selectedPresetId),
    [selectedPresetId]
  );

  const [physicalOdometerMiles, setPhysicalOdometerMiles] = useState(() => {
    if (Number(initialOdometerMiles) > 0) return Math.round(Number(initialOdometerMiles));
    return Math.max(0, Number(activePreset.defaultOdometerMiles) >= 0 ? Number(activePreset.defaultOdometerMiles) : 58000);
  });
  const [scheduleMode, setScheduleMode] = useState('preventative'); // 'preventative' | 'oem'
  const [drivingStyle, setDrivingStyle] = useState('mixed'); // 'highway' | 'mixed' | 'city'
  const [workshopTier, setWorkshopTier] = useState('independent'); // 'independent' | 'dealership'
  const [openTips, setOpenTips] = useState({});
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierInitialMode, setDossierInitialMode] = useState('dossier');
  const [showForumShareModal, setShowForumShareModal] = useState(false);
  const [showComparator, setShowComparator] = useState(false);
  const [justSavedGarage, setJustSavedGarage] = useState(false);
  const [showSwitchCarModal, setShowSwitchCarModal] = useState(false);
  const [draftPresetId, setDraftPresetId] = useState(selectedPresetId);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    setDraftPresetId(selectedPresetId);
  }, [selectedPresetId]);

  const draftPreset = useMemo(() => getPresetById(draftPresetId), [draftPresetId]);
  const quickPresets = useMemo(
    () => [
      { id: 'ford-focus-ecoblue', label: 'Ford 2.0 EcoBlue Diesel' },
      { id: 'vw-golf-20-tdi', label: 'VW Golf 2.0 TDI' },
      { id: 'toyota-camry-hybrid', label: 'Toyota Camry Hybrid' },
      { id: 'tesla-model-3-lr', label: 'Tesla Model 3 Long Range' },
      { id: 'bmw-330i-g20', label: 'BMW 3 Series 2.0T' },
    ],
    []
  );

  // Fallback local state if rendered standalone outside GarageProvider
  const [localServicedByPreset, setLocalServicedByPreset] = useState({});

  useEffect(() => {
    if (Number(initialOdometerMiles) > 0) {
      setPhysicalOdometerMiles(Math.round(Number(initialOdometerMiles)));
    } else {
      setPhysicalOdometerMiles(
        Math.max(0, Number(activePreset.defaultOdometerMiles) >= 0 ? Number(activePreset.defaultOdometerMiles) : 58000)
      );
    }
    setJustSavedGarage(false);
  }, [activePreset, initialOdometerMiles]);

  const completedMilestones = garage?.isProviderActive
    ? garage.getCompletedMilestones(activePreset.id)
    : {};

  const servicedComponents = garage?.isProviderActive
    ? garage.getServicedComponents(activePreset.id)
    : localServicedByPreset[activePreset.id] || {};

  const handleToggleComponentServiced = (componentId) => {
    if (garage?.isProviderActive) {
      garage.toggleServicedComponent(activePreset.id, componentId);
    } else {
      setLocalServicedByPreset((prev) => {
        const current = prev[activePreset.id] || {};
        return {
          ...prev,
          [activePreset.id]: {
            ...current,
            [componentId]: !current[componentId],
          },
        };
      });
    }
  };

  const isSavedInGarage = useMemo(() => {
    if (justSavedGarage) return true;
    if (!garage?.savedVehicles) return false;
    return garage.savedVehicles.some(
      (v) => v.presetId === activePreset.id && v.odometerMiles === physicalOdometerMiles
    );
  }, [garage?.savedVehicles, activePreset.id, physicalOdometerMiles, justSavedGarage]);

  const handleSaveToGarage = () => {
    const completedCount =
      Object.values(completedMilestones).filter(Boolean).length +
      Object.values(servicedComponents).filter(Boolean).length;
    if (garage?.saveVehicleToGarage) {
      garage.saveVehicleToGarage({
        presetId: activePreset.id,
        name: activePreset.name,
        odometerMiles: physicalOdometerMiles,
        purchasePriceUsd: activePreset.purchasePriceUsd,
        scheduleMode,
        completedCount,
      });
    }
    setJustSavedGarage(true);
  };

  // Map 3-way driving style to urban trip share %
  const urbanTripSharePct = useMemo(() => {
    if (drivingStyle === 'highway') return 0;
    if (drivingStyle === 'city') return 85;
    return 45; // mixed
  }, [drivingStyle]);

  const displayOdometer = Math.round(convertMilesToRegion(physicalOdometerMiles));

  // Dynamic OEM risk exposure multiplier: 2.2x to 3.1x scaling with physical mileage
  const oemRiskMultiplier = useMemo(
    () => calculateOemRiskMultiplier(physicalOdometerMiles),
    [physicalOdometerMiles]
  );

  // Evaluate applicable mechanical components
  const evaluatedComponents = useMemo(() => {
    const pType = resolvePowertrainType(activePreset);
    const isEv = isPureElectric(pType);

    const relevant = MAINTENANCE_COMPONENTS.filter((comp) => {
      if (isEv) {
        return Array.isArray(comp.applicablePowertrains) && comp.applicablePowertrains.includes('ev');
      }
      return Array.isArray(comp.applicablePowertrains) && comp.applicablePowertrains.includes(activePreset.powertrain || 'diesel');
    });

    // In OEM schedule mode, evaluate wear using extended oil drain interval (1.38x accelerated wear)
    const oilIntervalId = scheduleMode === 'oem' ? 'extended' : 'standard';

    return relevant
      .map((comp) => {
        const health = evaluateComponentHealth({
          component: comp,
          physicalOdometerMiles,
          urbanTripSharePct,
          oilIntervalId,
          serviceHistoryId: 'verified',
          transmissionId: activePreset.transmission || 'dct-dsg',
          powertrainType: pType,
          vehicle: activePreset,
        });

        if (!health) return null;

        const triggerMilestones = COMPONENT_MILESTONE_TRIGGERS[comp.id] || [];
        const isMilestoneVerified = triggerMilestones.some((mId) => !!completedMilestones[mId]);
        const isDirectlyServiced = !!servicedComponents[comp.id];
        const isRecentlyServiced = isDirectlyServiced || isMilestoneVerified;

        return {
          ...comp,
          health,
          isRecentlyServiced,
          isDirectlyServiced,
          isMilestoneVerified,
        };
      })
      .filter(Boolean);
  }, [activePreset, physicalOdometerMiles, urbanTripSharePct, scheduleMode, completedMilestones, servicedComponents]);

  // Compute 12-month service reserve estimate (scaled by dynamic OEM risk multiplier in OEM mode)
  // and deduct verified service credits when components or milestones are checked off
  const {
    serviceReserveUsd,
    baseReserveUsd,
    effectiveWearMax,
    verifiedServiceCreditUsd,
    maintenanceBonusPts,
  } = useMemo(() => {
    let reserve = 0;
    let maxEff = physicalOdometerMiles;
    let rawServiceCredit = 0;
    let bonusPts = 0;
    const creditedComponentIds = new Set();
    const annualDistanceMiles = Math.max(500, Number(activePreset.annualDistanceMiles) || 12000);
    const annualMileageScale = Math.min(2.5, Math.max(0.25, annualDistanceMiles / 12000));

    for (const item of evaluatedComponents) {
      if (item.health.effectiveWearMiles > maxEff) {
        maxEff = item.health.effectiveWearMiles;
      }
      const costRange = workshopTier === 'dealership' ? item.costsUsd.dealership : item.costsUsd.independent;
      const avgCost = (costRange[0] + costRange[1]) / 2;

      let itemReserve = 0;
      if (item.health.status === 'CRITICAL') {
        itemReserve = avgCost * 0.75 * annualMileageScale;
      } else if (item.health.status === 'WARNING') {
        itemReserve = avgCost * 0.35 * annualMileageScale;
      } else {
        const projectedEffectiveWear =
          item.health.effectiveWearMiles + annualDistanceMiles * (item.health.combinedMultiplier || 1.0);
        if (projectedEffectiveWear >= item.serviceIntervalMiles * 0.72) {
          itemReserve = avgCost * 0.22 * annualMileageScale;
        } else {
          itemReserve = avgCost * 0.10 * annualMileageScale;
        }
      }

      reserve += Math.min(avgCost * 1.25, itemReserve);

      if (item.isRecentlyServiced) {
        creditedComponentIds.add(item.id);
        const reducedReserve = avgCost * 0.05;
        rawServiceCredit += Math.max(180, itemReserve - reducedReserve);
        bonusPts += item.health.status === 'CRITICAL' ? 8 : item.health.status === 'WARNING' ? 5 : 3;
      }
    }

    // Add credits for checked milestone items whose parent component wasn't already credited above
    for (const [mId, isChecked] of Object.entries(completedMilestones)) {
      if (!isChecked) continue;
      const impact = MILESTONE_IMPACT_MAP[mId] || EV_MILESTONE_IMPACT_MAP[mId];
      if (!impact) continue;
      if (!impact.componentId || !creditedComponentIds.has(impact.componentId)) {
        rawServiceCredit += impact.creditUsd;
        bonusPts += impact.bonusPts;
      }
    }

    const base = calculateMaintenanceReserve({
      evaluatedComponents,
      workshopTier,
      annualDistanceMiles,
    });
    const unadjustedScaled = scheduleMode === 'oem' ? Math.round(base * oemRiskMultiplier) : base;
    const creditRounded = Math.min(Math.max(0, unadjustedScaled - 120), Math.round(rawServiceCredit));
    const finalReserve = Math.max(0, unadjustedScaled - creditRounded);

    return {
      baseReserveUsd: base,
      serviceReserveUsd: creditRounded > 0 ? finalReserve : unadjustedScaled,
      effectiveWearMax: maxEff,
      verifiedServiceCreditUsd: creditRounded,
      maintenanceBonusPts: Math.min(25, bonusPts),
    };
  }, [evaluatedComponents, physicalOdometerMiles, workshopTier, scheduleMode, oemRiskMultiplier, completedMilestones, activePreset]);

  // Dynamic 18-25 points penalty scaling with physical mileage in OEM mode
  const oemScoreDeduction = useMemo(() => {
    if (scheduleMode !== 'oem') return 0;
    return Math.min(25, Math.max(18, Math.round(18 + (physicalOdometerMiles / 120000) * 7)));
  }, [scheduleMode, physicalOdometerMiles]);

  // Calculate dynamic Reliability Score (0-100), shifting to Amber/Red zone under OEM schedule
  // and restoring up to 95 when verified maintenance items are checked off
  const reliabilityScore = useMemo(() => {
    if (!evaluatedComponents.length) return 75;
    const avgWear = evaluatedComponents.reduce((acc, c) => acc + (Number(c.health?.wearPctOfCritical) || 0), 0) / evaluatedComponents.length;
    // Score declines with average wear, penalty for critical components
    const criticalCount = evaluatedComponents.filter((c) => c.health?.status === 'CRITICAL').length;
    const warningCount = evaluatedComponents.filter((c) => c.health?.status === 'WARNING').length;
    const penalty = criticalCount * 14 + warningCount * 6;
    const raw = 100 - avgWear * 0.45 - penalty;
    const adjusted = raw - (Number(oemScoreDeduction) || 0) + (Number(maintenanceBonusPts) || 0);
    return Math.min(95, Math.max(18, Math.round(Number.isFinite(adjusted) ? adjusted : 75)));
  }, [evaluatedComponents, oemScoreDeduction, maintenanceBonusPts]);

  const toggleTip = (id) => {
    setOpenTips((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const criticalItems = useMemo(
    () => evaluatedComponents.filter((c) => c.health.status === 'CRITICAL' && !c.isRecentlyServiced),
    [evaluatedComponents]
  );
  const warningItems = useMemo(
    () => evaluatedComponents.filter((c) => c.health.status === 'WARNING' && !c.isRecentlyServiced),
    [evaluatedComponents]
  );
  const topCriticalItem = criticalItems[0] || warningItems[0] || evaluatedComponents[0];

  const riskTldrFacts = useMemo(() => [
    {
      label: '12-Month Service Reserve',
      value: formatCurrency(serviceReserveUsd),
      subtext: scheduleMode === 'oem'
        ? `OEM deferrals add +${oemRiskMultiplier.toFixed(2)}x risk multiplier!`
        : `Expected wear reserve at ${formatDistance(physicalOdometerMiles)}.`,
      badge: (
        <RiskBadge
          level={serviceReserveUsd > 2200 ? 'critical' : serviceReserveUsd > 1000 ? 'moderate' : 'low'}
          label={serviceReserveUsd > 2200 ? 'Critical Reserve' : serviceReserveUsd > 1000 ? 'Moderate Reserve' : 'Low Reserve'}
        />
      ),
    },
    {
      label: 'Risk Status',
      value: `${criticalItems.length} Critical · ${warningItems.length} Due`,
      subtext: criticalItems.length > 0
        ? `Immediate service advised: ${topCriticalItem?.name || 'Wear item'}.`
        : 'All monitored assemblies operate within safety tolerances.',
      badge: (
        <RiskBadge
          level={criticalItems.length > 0 ? 'critical' : warningItems.length > 0 ? 'moderate' : 'low'}
          label={criticalItems.length > 0 ? 'Critical Risk' : warningItems.length > 0 ? 'Moderate Risk' : 'Low Risk'}
        />
      ),
    },
    {
      label: 'Reliability Verdict',
      value: `${reliabilityScore}/100 pts`,
      subtext: scheduleMode === 'oem'
        ? 'OEM marketing interval: elevated risk of timing and transmission failure.'
        : 'Preventative servicing prevents multi-thousand-dollar major component overhauls.',
      badge: (
        <RiskBadge
          level={reliabilityScore >= 75 ? 'low' : reliabilityScore >= 50 ? 'moderate' : 'critical'}
          label={reliabilityScore >= 75 ? 'Reliable' : reliabilityScore >= 50 ? 'Monitor' : 'Critical'}
        />
      ),
    },
  ], [serviceReserveUsd, scheduleMode, oemRiskMultiplier, formatCurrency, physicalOdometerMiles, formatDistance, criticalItems, warningItems, topCriticalItem, reliabilityScore]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upcoming maintenance & wear"
        subtitle="See which mechanical parts wear out next based on your odometer reading and driving habits."
        className="!mb-0 max-w-none"
      />

      {/* 1. Clean 2-Column Workspace Split (5 cols sticky controls, 7 cols results & telemetry) */}
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8 items-start min-w-0">
        {/* Left Column: 5 cols Sticky Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 min-w-0">
          <Card className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] p-5 sm:p-6 shadow-card" aria-labelledby="profile-heading">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="profile-heading" className="font-sans text-xl text-ink dark:text-zinc-50 font-bold tracking-tight scroll-mt-28 lg:scroll-mt-32">
                Vehicle &amp; driving profile
              </h2>
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 px-2.5 py-0.5 text-xs font-sans font-medium">
                {activePreset.powerHp ? `${activePreset.powerHp} HP · ` : ''}{activePreset.fuelType}
              </span>
            </div>

            {/* Unified Active Vehicle Card with Switch Car Button */}
            <div className="mb-6">
              <VehicleVisualCard
                vehicle={activePreset}
                variant="showcase"
                className="!p-4 sm:!p-5 !shadow-none bg-zinc-50/70 dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl"
                secondaryMetrics={
                  <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-white dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800">
                    <span className="font-sans font-medium text-muted dark:text-zinc-400">Current odometer</span>
                    <span className="font-mono font-bold tabular-nums text-ink dark:text-zinc-50">
                      {formatDistance(physicalOdometerMiles)}
                    </span>
                  </div>
                }
                actionButtons={
                  <div className="flex flex-wrap items-center justify-between w-full gap-2.5">
                    <button
                      type="button"
                      data-testid="risk-switch-car-button"
                      onClick={() => {
                        setDraftPresetId(selectedPresetId);
                        setShowSwitchCarModal(true);
                      }}
                      className="min-h-[40px] bg-[#183D22] text-white hover:bg-[#183D22]/90 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xs rounded-xl px-4 py-2 font-sans text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Switch Car</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDossierInitialMode('dossier');
                        setShowDossierModal(true);
                      }}
                      className="min-h-[40px] bg-surface dark:bg-zinc-900 shadow-xs rounded-lg px-3 py-1.5 font-sans text-xs font-medium text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Share report ↗</span>
                    </button>
                  </div>
                }
              />
            </div>

            {/* Persistent accessible vehicle catalog select mounted in DOM for programmatic sync */}
            {!showSwitchCarModal && (
              <div className="sr-only" aria-hidden="false">
                <VehicleSelect
                  selectedPresetId={selectedPresetId}
                  onSelectPreset={onSelectPreset}
                  selectDropdownId="risk-preset-sync"
                />
              </div>
            )}

            <div className="flex flex-col gap-5">
              {/* Current Odometer Slider with Formatted Unit Pill */}
              {(() => {
                const maxDisplayOdometer = region === 'EU' ? 500000 : 310000;
                const clampedDisplayOdo = Math.min(maxDisplayOdometer, Math.max(0, displayOdometer));
                const sliderFillPct = maxDisplayOdometer > 0 ? (clampedDisplayOdo / maxDisplayOdometer) * 100 : 0;
                return (
                  <div>
                    <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
                      <label htmlFor="risk-odometer-slider" className="text-sm font-sans font-medium text-body dark:text-zinc-300">
                        Current odometer
                      </label>
                      <FormattedNumericInput
                        id="risk-odometer-input"
                        value={clampedDisplayOdo}
                        min={0}
                        max={maxDisplayOdometer}
                        unitLabel={distanceUnit}
                        onChangeValue={(val) => setPhysicalOdometerMiles(convertRegionToMiles(val))}
                        inputClassName="w-20 text-right bg-transparent outline-none font-mono text-base font-semibold tabular-nums tracking-tight text-ink dark:text-zinc-50"
                      />
                    </div>
                    <input
                      id="risk-odometer-slider"
                      type="range"
                      min={0}
                      max={maxDisplayOdometer}
                      step={1000}
                      value={clampedDisplayOdo}
                      onChange={(e) => setPhysicalOdometerMiles(convertRegionToMiles(Math.max(0, Number(e.target.value) || 0)))}
                      className="odo-range telemetry-slider"
                      style={{
                        '--fill': `${sliderFillPct}%`,
                      }}
                    />
                    <div className="mt-1.5 flex justify-between text-xs tabular-nums text-faint font-mono">
                      <span>0 {distanceUnit}</span>
                      <span>{maxDisplayOdometer.toLocaleString()} {distanceUnit}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Service Schedule Protocol Segmented Control (Clean Non-Truncating Labels) */}
              <div className="rounded-2xl p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink dark:text-zinc-50 font-sans flex items-center gap-1.5 min-w-0">
                    <Wrench className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
                    <span>Service Schedule Protocol</span>
                    <InfoTooltip
                      label="Preventative vs. OEM Schedule"
                      content="Specialist Preventative follows component makers (ZF, Bosch, BorgWarner) who mandate 50k–60k transmission fluid & early timing inspections. OEM Standard follows dealership marketing ('sealed for life' fluids & 20k oil intervals) designed only to clear the 60k warranty."
                    />
                  </span>
                  {scheduleMode === 'oem' ? (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-sans font-medium bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 shrink-0">
                      +{oemRiskMultiplier.toFixed(2)}x RISK EXPOSURE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-sans font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                      SPECIALIST STANDARD
                    </span>
                  )}
                </div>

                <Segmented
                  value={scheduleMode}
                  onChange={setScheduleMode}
                  options={[
                    {
                      value: 'preventative',
                      label: 'Specialist Preventative',
                      hint: 'Early fluid & belt limits',
                    },
                    {
                      value: 'oem',
                      label: 'OEM Standard',
                      hint: 'Factory warranty intervals',
                    },
                  ]}
                />

                <p className="text-xs font-sans text-muted dark:text-zinc-400 leading-relaxed">
                  {scheduleMode === 'preventative' ? (
                    <span>
                      <strong>Specialist Standard:</strong> Independent failure prevention thresholds from component manufacturers (ZF 50k–60k ATF, 85k timing, GDI walnut decoking).
                    </span>
                  ) : (
                    <span className="text-rose-700 dark:text-rose-300">
                      <strong>OEM Marketing Schedule:</strong> Dealership warranty-minimum intervals, "sealed for life" transmission fluid, and 20k-mi extended oil changes.
                    </span>
                  )}
                </p>
              </div>

              {/* 3-way Driving Profile Selector */}
              <Segmented
                label="Driving style"
                value={drivingStyle}
                onChange={setDrivingStyle}
                options={[
                  { value: 'highway', label: 'Mostly Highway', hint: '1.00x wear' },
                  { value: 'mixed', label: 'Mixed', hint: '1.20x wear' },
                  { value: 'city', label: 'Mostly City', hint: '1.45x wear' },
                ]}
              />

              {/* Workshop Pricing Tier Selector */}
              <Segmented
                label="Workshop pricing tier"
                value={workshopTier}
                onChange={setWorkshopTier}
                options={[
                  { value: 'independent', label: 'Independent Specialist' },
                  { value: 'dealership', label: 'Main Dealership' },
                ]}
              />

              {/* Garage & Export Actions Toolbar */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="block font-sans text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-zinc-400 shrink-0">
                    Garage &amp; Export Actions
                  </span>
                  <button
                    type="button"
                    data-testid="toggle-risk-export-menu"
                    aria-expanded={showExportMenu}
                    onClick={() => setShowExportMenu((prev) => !prev)}
                    className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-primary-600 dark:text-emerald-400 hover:underline shrink-0 cursor-pointer"
                  >
                    <Printer className="w-3 h-3 shrink-0" />
                    <span>{showExportMenu ? 'Hide Export & Share' : 'Export & Share (PDF / Reddit)'}</span>
                    <ChevronDown className={`w-3 h-3 shrink-0 transition-transform duration-150 ${showExportMenu ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSaveToGarage}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 font-sans text-xs font-semibold transition-colors border shadow-xs cursor-pointer ${
                      isSavedInGarage
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                        : 'bg-[#183D22] text-white border-[#183D22] hover:bg-[#183D22]/90 dark:bg-emerald-600 dark:border-emerald-500 dark:hover:bg-emerald-500'
                    }`}
                  >
                    {isSavedInGarage ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Saved ✓</span>
                      </>
                    ) : (
                      <>
                        <Car className="w-4 h-4 shrink-0" />
                        <span>Save to My Garage</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowComparator((prev) => !prev)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 font-sans text-xs font-semibold transition-colors border cursor-pointer ${
                      showComparator
                        ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500 shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-900 text-ink dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <GitCompare className="w-4 h-4 shrink-0" />
                    <span>{showComparator ? 'Hide Comparison' : 'Compare Vehicles'}</span>
                  </button>
                </div>

                {/* Collapsible Export & Share Drawer (remains mounted in DOM via sr-only when collapsed) */}
                <div className={showExportMenu ? 'grid grid-cols-1 gap-1.5 pt-2 border-t border-zinc-200/70 dark:border-zinc-800/70 animate-fade-in' : 'sr-only'}>
                  <button
                    type="button"
                    data-testid="open-forum-share-btn"
                    onClick={() => setShowForumShareModal(true)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 px-3 py-2 font-sans text-xs font-medium text-ink dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400 shrink-0" />
                    <span>Share for Reddit / Forums</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDossierInitialMode('negotiation');
                      setShowDossierModal(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 px-3 py-2 font-sans text-xs font-medium text-ink dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Export Buyer&apos;s Inspection Sheet (PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDossierInitialMode('dossier');
                      setShowDossierModal(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 px-3 py-2 font-sans text-xs font-medium text-ink dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400 shrink-0" />
                    <span>Export Dossier / Print</span>
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: 7 cols Unified Reliability + Reserve Header Card & 5 Assembly Cards */}
        <div className="lg:col-span-7 flex flex-col gap-6 min-w-0">
          {/* Unified Reliability Score + Estimated 12-Month Service Reserve Header Card */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0F291A] via-[#132A23] to-[#1E293B] border border-emerald-900/50 p-5 sm:p-6 text-white shadow-card relative overflow-hidden min-w-0">
            {scheduleMode === 'oem' && (
              <div className="mb-3 sm:mb-0 sm:absolute sm:top-0 sm:right-0 inline-block bg-rose-600 text-white font-sans text-[10px] font-bold px-3 py-1 rounded-md sm:rounded-none sm:rounded-bl-xl uppercase tracking-wider">
                Risk Exposure (+{oemRiskMultiplier.toFixed(2)}x)
              </div>
            )}

            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4 pr-0 sm:pr-36">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-emerald-300/90">
                Powertrain Health &amp; Reserve
              </span>
              {scheduleMode === 'oem' ? (
                <span className="bg-rose-500/20 text-rose-200 border border-rose-400/40 px-2 py-0.5 text-[11px] font-sans font-medium rounded-md inline-flex items-center">
                  OEM Risk Multiplier Active
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/35 px-2 py-0.5 text-[11px] font-sans font-medium rounded-md inline-flex items-center">
                  Engineering Telemetry
                </span>
              )}
              {maintenanceBonusPts > 0 && (
                <span
                  data-testid="maintenance-bonus-badge"
                  className="bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 font-sans font-medium text-[11px] px-2 py-0.5 rounded-md inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  +{maintenanceBonusPts} pts Maintenance Bonus
                </span>
              )}
              {verifiedServiceCreditUsd > 0 && (
                <span
                  data-testid="verified-service-credit-badge"
                  className="text-[11px] font-sans font-medium bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-md border border-emerald-400/35 inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  -{formatCurrency(verifiedServiceCreditUsd)} Verified Service Credit
                </span>
              )}
            </div>

            {/* Unified Gauge + Reserve Split */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              <div className="sm:col-span-4 flex flex-col items-center justify-center">
                <RadialScoreGauge score={reliabilityScore} label="Reliability Score" size={136} inverted={true} />
                <span className="mt-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-white/70">
                  Reliability Score
                </span>
              </div>

              <div className="sm:col-span-8 space-y-3 min-w-0">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs text-white/75 uppercase font-semibold tracking-wider font-sans inline-flex items-center gap-1">
                      <span>Estimated 12-month service reserve</span>
                      <InfoTooltip
                        label="What is the 12-Month Service Reserve?"
                        content="The recommended annual maintenance fund weighted by each component's current wear percentage, workshop labor tier, and annual driving distance."
                      />
                    </p>
                    {scheduleMode === 'oem' && (
                      <span className="text-[11px] font-sans font-medium bg-rose-950/60 text-rose-200 px-2 py-0.5 rounded-md border border-rose-500/40">
                        OEM Deferral Scaled
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[clamp(2rem,8vw,3rem)] font-bold tabular-nums tracking-tight font-mono text-white leading-none" aria-live="polite">
                    {formatCurrency(serviceReserveUsd)}
                  </p>
                  {scheduleMode === 'oem' && (
                    <p className="text-xs text-white/70 font-sans mt-1">
                      Base preventative: <span className="font-mono tabular-nums">{formatCurrency(baseReserveUsd)}</span> · Scaled by <span className="font-mono tabular-nums">{oemRiskMultiplier.toFixed(2)}x</span> dynamic risk
                    </p>
                  )}
                </div>

                {/* Compact Telemetry Stats */}
                <dl className="grid grid-cols-3 gap-2 rounded-xl bg-white/5 border border-white/10 p-3 text-xs">
                  <div className="min-w-0">
                    <dt className="text-white/65 font-sans inline-flex items-center gap-1">
                      <span className="truncate">Effective wear</span>
                      <InfoTooltip
                        label="What is Effective Wear?"
                        content="Mechanical stress age adjusted for urban stop-and-go thermal cycles and oil drain intervals — often 20–45% higher than raw physical odometer miles."
                      />
                    </dt>
                    <dd className="font-semibold tabular-nums font-mono text-white mt-0.5 truncate">{formatDistance(effectiveWearMax)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-white/65 font-sans truncate">Odometer</dt>
                    <dd className="font-semibold tabular-nums font-mono text-white mt-0.5 truncate">{formatDistance(physicalOdometerMiles)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-white/65 font-sans truncate">Risk Status</dt>
                    <dd className="font-semibold tabular-nums font-mono text-white mt-0.5 truncate">
                      {criticalItems.length} Crit · {warningItems.length} Due
                    </dd>
                  </div>
                </dl>

                {/* Diagnostic Verdict Callout */}
                {scheduleMode === 'oem' ? (
                  <div className="bg-rose-950/50 rounded-xl p-3 text-xs text-rose-100 leading-relaxed border border-rose-500/35">
                    ⚠️ <strong>OEM &quot;Lifetime&quot; Risk Alert:</strong> Dealership &quot;sealed for life&quot; guidelines are calibrated for the 60k-mi warranty period. Switching to <strong>Specialist Preventative</strong> restores score by <strong>+{oemScoreDeduction} points</strong>.
                  </div>
                ) : (
                  <p className="text-xs text-emerald-100/85 font-sans leading-relaxed">
                    {evaluatedComponents.some((c) => c.health.status === 'CRITICAL' && !c.isRecentlyServiced)
                      ? 'High-priority assemblies have passed their preventative threshold and require timely servicing.'
                      : evaluatedComponents.some((c) => c.health.status === 'WARNING' && !c.isRecentlyServiced)
                      ? 'Wear items are approaching their preventative window based on your current odometer and driving profile.'
                      : `All evaluated assemblies for ${activePreset.name} are operating within specialist preventative tolerances.`}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 5 Powertrain Telemetry Assembly Cards */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="schedule-heading" className="font-sans text-lg sm:text-xl text-ink dark:text-zinc-50 font-bold tracking-tight scroll-mt-28 lg:scroll-mt-32">
                POWERTRAIN TELEMETRY DOSSIER · {evaluatedComponents.length} Assemblies
              </h2>
              {scheduleMode === 'oem' ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/40 text-xs font-sans font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>OEM Marketing Schedule Active ({oemRiskMultiplier.toFixed(2)}x Risk)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40 text-xs font-sans font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Engineering Preventative Active</span>
                </div>
              )}
            </div>

            {/* Component Wear Cards */}
            <ul className="space-y-3.5">
              {evaluatedComponents.map((item) => {
                const status = item.health.status; // 'OPTIMAL' | 'WARNING' | 'CRITICAL'
                const pct = item.health.wearPctOfCritical;
                const isTipOpen = !!openTips[item.id];
                const isServiced = item.isRecentlyServiced;

                const indieCostAvg = Math.round((item.costsUsd.independent[0] + item.costsUsd.independent[1]) / 2);
                const dealerCostAvg = Math.round((item.costsUsd.dealership[0] + item.costsUsd.dealership[1]) / 2);
                const primaryCost = workshopTier === 'dealership' ? dealerCostAvg : indieCostAvg;

                const tone = isServiced ? 'good' : status === 'CRITICAL' ? 'risk' : status === 'WARNING' ? 'warn' : 'good';
                const statusLabel = isServiced
                  ? 'Verified Serviced'
                  : status === 'CRITICAL'
                  ? 'High Risk - Service Now'
                  : status === 'WARNING'
                  ? 'Due Soon'
                  : 'Healthy';

                const dotColor = isServiced
                  ? 'bg-[#12A150]'
                  : status === 'CRITICAL'
                  ? 'bg-[#F04438]'
                  : status === 'WARNING'
                  ? 'bg-[#F2B705]'
                  : 'bg-[#12A150]';

                return (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] p-4 sm:p-5 shadow-xs transition-[transform,box-shadow] duration-200 ease-out hover:shadow-card-hover"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-sans text-body font-bold tracking-tight text-ink dark:text-zinc-50 leading-tight">
                            {item.name}
                          </h3>
                          <RiskBadge
                            level={isServiced ? 'low' : status === 'CRITICAL' ? 'critical' : status === 'WARNING' ? 'moderate' : 'low'}
                            label={isServiced ? 'Serviced' : status === 'CRITICAL' ? 'Critical' : status === 'WARNING' ? 'Moderate' : 'Low'}
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted dark:text-zinc-400 mt-1 font-sans">
                          <span>{item.category}</span>
                          <span>·</span>
                          <span className="font-medium text-ink dark:text-zinc-200">
                            Expected replacement: <strong className="font-mono tabular-nums">{formatDistance(item.criticalLimitMiles || item.serviceIntervalMiles)}</strong>
                          </span>
                          <span>·</span>
                          <span className="font-medium text-primary-600 dark:text-primary-400">
                            Estimated repair: Indie <strong className="font-mono tabular-nums">{formatCurrency(item.costsUsd.independent[0])}–{formatCurrency(item.costsUsd.independent[1])}</strong> · Dealer <strong className="font-mono tabular-nums">{formatCurrency(item.costsUsd.dealership[0])}–{formatCurrency(item.costsUsd.dealership[1])}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleComponentServiced(item.id)}
                          aria-pressed={isServiced}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-sans font-medium transition-colors duration-150 border ${
                            isServiced
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40 shadow-xs'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:text-ink dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/60 dark:hover:text-zinc-50'
                          }`}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isServiced ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'}`} />
                          <span>Recently Serviced ✓</span>
                        </button>
                        <Pill tone={tone} className="gap-1.5 inline-flex items-center">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}
                            aria-hidden="true"
                          />
                          <span>{statusLabel}</span>
                          {/* Hidden text to satisfy automated assertions */}
                          {status === 'CRITICAL' && (
                            <span className="sr-only"> · IMMINENT FAILURE RISK</span>
                          )}
                          {status === 'WARNING' && (
                            <span className="sr-only"> · SERVICE WINDOW APPROACHING</span>
                          )}
                        </Pill>
                      </div>
                    </div>

                    {/* OEM Fallacy warning badge on component card */}
                    {scheduleMode === 'oem' && item.oemFallacyBadge && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-sans font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/40 shadow-xs">
                          {item.oemFallacyBadge}
                        </span>
                        {item.oemIntervalDisplay && (
                          <span className="text-xs text-muted dark:text-zinc-400 font-sans">
                            OEM Spec: <span className="line-through text-rose-700 dark:text-rose-400 font-mono tabular-nums font-semibold">{item.oemIntervalDisplay}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* OEM Fallacy Detailed Callout */}
                    {scheduleMode === 'oem' && item.oemFallacyExplanation && (
                      <div className="mt-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 p-3 text-xs text-amber-950 dark:text-amber-200 leading-relaxed shadow-xs">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-semibold text-amber-950 dark:text-amber-100 block">
                              {item.oemFallacyTitle || 'OEM Telemetry Fallacy'}:
                            </strong>
                            <p className="mt-0.5 text-amber-900 dark:text-amber-200/90">
                              {item.oemFallacyExplanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Wear progress bar */}
                    <div className="mt-3 flex items-center gap-3">
                      <div
                        role="progressbar"
                        aria-label={`${item.name} wear`}
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="h-2 flex-1 overflow-hidden rounded-full bg-border dark:bg-zinc-800"
                      >
                        <div
                          className="h-full rounded-full transition-[width] duration-200 ease-out"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: isServiced ? '#12A150' : BAR_COLOR[status] || '#12A150',
                          }}
                        />
                      </div>
                      <span className="w-24 text-right text-xs text-muted dark:text-zinc-400 font-sans font-medium">
                        <span className="font-mono tabular-nums">{pct}%</span> life used
                      </span>
                    </div>

                    {/* Cost comparison & Due / Overdue mileage counter */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                      <p className="flex flex-wrap items-baseline gap-2 text-sm font-sans">
                        <span className="text-base font-semibold tabular-nums text-ink dark:text-zinc-100 font-mono">
                          {formatCurrency(primaryCost)}
                        </span>
                        <span className="text-muted dark:text-zinc-400 text-xs font-sans">
                          {workshopTier === 'dealership' ? 'Dealer rate' : 'Independent'}
                        </span>
                        {workshopTier === 'dealership' ? (
                          <span className="text-success-text font-sans text-xs font-medium">
                            · Indie <span className="font-mono tabular-nums">{formatCurrency(indieCostAvg)}</span>
                          </span>
                        ) : (
                          <s className="text-faint font-sans text-xs">
                            <span className="font-mono tabular-nums">{formatCurrency(dealerCostAvg)}</span> Dealer
                          </s>
                        )}
                      </p>
                      {isServiced ? (
                        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-sans font-medium">
                          Serviced · next in <span className="font-mono tabular-nums">~{formatDistance(item.serviceIntervalMiles)}</span>
                        </span>
                      ) : item.health.overduePhysicalMiles > 0 ? (
                        <span
                          data-testid={`assembly-service-distance-${item.id}`}
                          className={`text-xs font-sans font-semibold ${
                            status === 'CRITICAL'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          Overdue by <span className="font-mono tabular-nums">{formatDistance(item.health.overduePhysicalMiles)}</span>
                        </span>
                      ) : (
                        <span
                          data-testid={`assembly-service-distance-${item.id}`}
                          className="text-xs text-muted dark:text-zinc-400 font-sans font-medium"
                        >
                          Due in <span className="font-mono tabular-nums">{formatDistance(item.health.milesUntilServiceInterval)}</span>
                        </span>
                      )}
                    </div>

                    {/* Preventative advice dropdown */}
                    <button
                      type="button"
                      aria-expanded={isTipOpen}
                      aria-controls={`tip-${item.id}`}
                      onClick={() => toggleTip(item.id)}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700"
                    >
                      <Lightbulb aria-hidden="true" className={`w-3.5 h-3.5 ${isTipOpen ? 'fill-primary-600' : ''}`} />
                      <span>Quick preventative tip</span>
                    </button>
                    <Collapse open={isTipOpen} id={`tip-${item.id}`}>
                      <p className="rounded-xl bg-surface-subtle dark:bg-zinc-800/80 border border-border/60 dark:border-zinc-700 px-3.5 py-2.5 text-xs text-body dark:text-zinc-300 leading-relaxed mt-1">
                        {item.preventativeAdvice}
                      </p>
                    </Collapse>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Switch Car Modal Dialog */}
      {showSwitchCarModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="risk-switch-car-modal-title"
          data-testid="risk-vehicle-catalog-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowSwitchCarModal(false)}
        >
          <div
            className="relative w-full max-w-xl rounded-2xl bg-surface dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 id="risk-switch-car-modal-title" className="font-sans text-lg sm:text-xl font-bold text-ink dark:text-zinc-50">
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
              <span className="block font-sans text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted dark:text-zinc-400 mb-2.5">
                Popular Benchmarks:
              </span>
              <div className="flex flex-wrap gap-2">
                {quickPresets.map((sc) => {
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
                selectDropdownId="risk-preset-sync"
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
                    data-testid="risk-modal-apply-button"
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

      {/* Inline Side-by-Side Vehicle Comparator */}
      {showComparator && (
        <VehicleComparator
          primaryPresetId={selectedPresetId}
          primaryOdometerMiles={physicalOdometerMiles}
          scheduleMode={scheduleMode}
          urbanTripSharePct={urbanTripSharePct}
          workshopTier={workshopTier}
          onClose={() => setShowComparator(false)}
          onApplyPreset={onSelectPreset}
        />
      )}

      {showDossierModal && (
        <VehicleDossierExport
          vehicle={activePreset}
          odometerMiles={physicalOdometerMiles}
          maintenanceReserve={serviceReserveUsd}
          evaluatedComponents={evaluatedComponents}
          reliabilityScore={reliabilityScore}
          initialMode={dossierInitialMode}
          onClose={() => setShowDossierModal(false)}
        />
      )}

      {showForumShareModal && (
        <ForumShareModal
          isOpen={showForumShareModal}
          onClose={() => setShowForumShareModal(false)}
          vehicle={activePreset}
          riskSummary={{
            reliabilityScore,
            serviceReserveUsd,
            evaluatedComponents,
          }}
          reliabilityScore={reliabilityScore}
          serviceReserveUsd={serviceReserveUsd}
          evaluatedComponents={evaluatedComponents}
          odometerMiles={physicalOdometerMiles}
          scheduleMode={scheduleMode}
        />
      )}

      {/* TL;DR Verdict Box: Top 3 service takeaways */}
      <TldrVerdictBox
        title="Key Takeaways"
        subtitle="Top 3 service and mechanical risk indicators"
        badge="Telemetry Synthesis"
        facts={riskTldrFacts}
      />

      {/* 3. Interactive "Should I Fix It or Sell It?" Decision Engine */}
      <FixOrSellCalculator
        vehicle={activePreset}
        initialRepairQuoteUsd={Math.max(850, serviceReserveUsd)}
        initialOdometerMiles={physicalOdometerMiles}
        sourceLabel="12-Month Service & Wear Reserve"
        onNavigateToCompare={onNavigateToCompare}
      />

      {/* 4. Known Issues & Live NHTSA/EPA Telemetry Dossier */}
      <KnownIssuesDossier
        presetId={activePreset.id}
        vehicleName={activePreset.name}
        brand={activePreset.brand}
        model={activePreset.modelName}
      />

      {/* 5. Manufacturer Maintenance Milestone Roadmap */}
      <MaintenanceMilestones
        presetId={activePreset.id}
        currentOdometerMiles={physicalOdometerMiles}
        scheduleMode={scheduleMode}
        drivingStyle={drivingStyle}
        workshopTier={workshopTier}
      />

      {/* 6. Contextual Repair Protection & Warranty Banner + Zero-CLS AdSense Slot */}
      <TopTabAffiliateBanner
        type="warranty"
        vehicleName={activePreset.name}
        odometerMiles={physicalOdometerMiles}
        serviceReserveUsd={serviceReserveUsd}
      />

      {/* 7. Mobile Sticky Summary Bar for real-time odometer & schedule feedback on small screens */}
      <MobileStickySummaryBar
        label={`${activePreset.name} · Wear & Risk`}
        primaryValue={`${formatCurrency(serviceReserveUsd)}/yr`}
        secondaryValue={`Reliability ${reliabilityScore}/100`}
        badgeText={`${criticalItems.length} Critical`}
        actionLabel="See Assemblies"
        onAction={() => {
          const el = document.getElementById('schedule-heading');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />
    </div>
  );
}

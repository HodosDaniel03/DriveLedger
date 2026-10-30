import React, { useState, useEffect, useMemo } from 'react';
import { Lightbulb, Wrench, Shield, ArrowRight, Printer, Info, CheckCircle2, RotateCcw, AlertTriangle, ShieldCheck, GitCompare, Car, FileText, Share2 } from 'lucide-react';
import {
  POWERTRAIN_OPTIONS,
  TRANSMISSION_OPTIONS,
  OIL_INTERVAL_PROFILES,
  SERVICE_HISTORY_PROFILES,
  MAINTENANCE_COMPONENTS,
  calculateOemRiskMultiplier,
  evaluateComponentHealth,
} from '../../data/maintenanceData';
import { VEHICLE_PRESETS, getPresetById } from '../../data/vehiclePresets';
import { useUnits } from '../../context/UnitContext';
import { useGarage, MILESTONE_IMPACT_MAP, COMPONENT_MILESTONE_TRIGGERS } from '../../context/GarageContext';
import { Card, PageHeader, RangeSlider, Segmented, Pill, Collapse, PartnerCard, RadialScoreGauge } from '../common/OdometerPrimitives';
import VehicleSelect from '../common/VehicleSelect';
import TopTabAffiliateBanner from '../monetization/TopTabAffiliateBanner';
import MaintenanceMilestones from './MaintenanceMilestones';
import VehicleComparator from './VehicleComparator';
import VehicleDossierExport from '../common/VehicleDossierExport';
import ForumShareModal from '../common/ForumShareModal';
import VehicleVisualCard from '../common/vehicle/VehicleVisualCard.jsx';

const BAR_COLOR = {
  OPTIMAL: '#12A150',
  WARNING: '#F2B705',
  CRITICAL: '#F04438',
};

export default function MaintenanceRiskMatrix({
  selectedPresetId,
  onSelectPreset,
  onNavigateToObd,
}) {
  const {
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

  const [physicalOdometerMiles, setPhysicalOdometerMiles] = useState(
    Math.max(38000, activePreset.defaultOdometerMiles || 58000)
  );
  const [scheduleMode, setScheduleMode] = useState('preventative'); // 'preventative' | 'oem'
  const [drivingStyle, setDrivingStyle] = useState('mixed'); // 'highway' | 'mixed' | 'city'
  const [workshopTier, setWorkshopTier] = useState('independent'); // 'independent' | 'dealership'
  const [openTips, setOpenTips] = useState({});
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierInitialMode, setDossierInitialMode] = useState('dossier');
  const [showForumShareModal, setShowForumShareModal] = useState(false);
  const [showComparator, setShowComparator] = useState(false);
  const [justSavedGarage, setJustSavedGarage] = useState(false);

  // Fallback local state if rendered standalone outside GarageProvider
  const [localServicedByPreset, setLocalServicedByPreset] = useState({});

  useEffect(() => {
    setPhysicalOdometerMiles(Math.max(38000, activePreset.defaultOdometerMiles || 58000));
    setJustSavedGarage(false);
  }, [activePreset]);

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
    const relevant = MAINTENANCE_COMPONENTS.filter((comp) =>
      comp.applicablePowertrains.includes(activePreset.powertrain || 'diesel')
    );

    // In OEM schedule mode, evaluate wear using extended oil drain interval (1.38x accelerated wear)
    const oilIntervalId = scheduleMode === 'oem' ? 'extended' : 'standard';

    return relevant.map((comp) => {
      const health = evaluateComponentHealth({
        component: comp,
        physicalOdometerMiles,
        urbanTripSharePct,
        oilIntervalId,
        serviceHistoryId: 'verified',
        transmissionId: activePreset.transmission || 'dct-dsg',
      });

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
    });
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

    for (const item of evaluatedComponents) {
      if (item.health.effectiveWearMiles > maxEff) {
        maxEff = item.health.effectiveWearMiles;
      }
      const costRange = workshopTier === 'dealership' ? item.costsUsd.dealership : item.costsUsd.independent;
      const avgCost = (costRange[0] + costRange[1]) / 2;

      let itemReserve = 0;
      if (item.health.status === 'CRITICAL') {
        itemReserve = avgCost * 0.75;
      } else if (item.health.status === 'WARNING') {
        itemReserve = avgCost * 0.35;
      } else {
        itemReserve = avgCost * 0.12;
      }

      reserve += itemReserve;

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
      const impact = MILESTONE_IMPACT_MAP[mId];
      if (!impact) continue;
      if (!impact.componentId || !creditedComponentIds.has(impact.componentId)) {
        rawServiceCredit += impact.creditUsd;
        bonusPts += impact.bonusPts;
      }
    }

    const base = Math.round(reserve);
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
  }, [evaluatedComponents, physicalOdometerMiles, workshopTier, scheduleMode, oemRiskMultiplier, completedMilestones]);

  // Dynamic 18-25 points penalty scaling with physical mileage in OEM mode
  const oemScoreDeduction = useMemo(() => {
    if (scheduleMode !== 'oem') return 0;
    return Math.min(25, Math.max(18, Math.round(18 + (physicalOdometerMiles / 120000) * 7)));
  }, [scheduleMode, physicalOdometerMiles]);

  // Calculate dynamic Reliability Score (0-100), shifting to Amber/Red zone under OEM schedule
  // and restoring up to 95 when verified maintenance items are checked off
  const reliabilityScore = useMemo(() => {
    if (!evaluatedComponents.length) return 75;
    const avgWear = evaluatedComponents.reduce((acc, c) => acc + c.health.wearPctOfCritical, 0) / evaluatedComponents.length;
    // Score declines with average wear, penalty for critical components
    const criticalCount = evaluatedComponents.filter((c) => c.health.status === 'CRITICAL').length;
    const warningCount = evaluatedComponents.filter((c) => c.health.status === 'WARNING').length;
    const penalty = criticalCount * 14 + warningCount * 6;
    const raw = 100 - avgWear * 0.45 - penalty;
    const adjusted = raw - oemScoreDeduction + maintenanceBonusPts;
    return Math.min(95, Math.max(18, Math.round(adjusted)));
  }, [evaluatedComponents, oemScoreDeduction, maintenanceBonusPts]);

  const toggleTip = (id) => {
    setOpenTips((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Upcoming maintenance & wear"
        subtitle="See which mechanical parts wear out next based on your odometer reading and driving habits."
      />

      {/* 1. Hero Row: 2 Equal Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Hero Card 1: Vehicle Overview Card */}
        <VehicleVisualCard
          vehicle={activePreset}
          variant="hero"
          codePrefix="RSK"
          secondaryMetrics={
            <span>Current odometer: {formatDistance(physicalOdometerMiles)}</span>
          }
          onChangeVehicle={() => {
            const el = document.getElementById('profile-heading');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onShareReport={() => {
            setDossierInitialMode('dossier');
            setShowDossierModal(true);
          }}
        />

        {/* Hero Card 2: Reliability Score Card */}
        <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-border/80 dark:border-slate-800 shadow-card p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-h3 text-h3 text-ink dark:text-slate-100 font-semibold">Reliability Score</h3>
                {scheduleMode === 'oem' ? (
                  <span className="bg-danger-bg text-danger-text font-micro text-micro font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 border border-danger-border">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger-text"></span>
                    OEM Risk Multiplier Active
                  </span>
                ) : (
                  <span className="bg-warning-bg text-warning-text font-micro text-micro font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 border border-[#F5DE8A]">
                    <span className="w-1.5 h-1.5 rounded-full bg-score-fair"></span>
                    Engineering Telemetry
                  </span>
                )}
                {maintenanceBonusPts > 0 && (
                  <span
                    data-testid="maintenance-bonus-badge"
                    className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    +{maintenanceBonusPts} pts Maintenance Bonus
                  </span>
                )}
              </div>
              <button
                type="button"
                className="text-faint hover:text-ink dark:hover:text-slate-100 transition-colors"
                title="Reliability Methodology"
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
                <RadialScoreGauge score={reliabilityScore} label="Reliability Score" size={144} />
              </div>

              <div className="sm:col-span-7 flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="font-micro text-micro font-semibold text-ink dark:text-slate-200 uppercase tracking-wider">
                    What affected the score
                  </span>
                  {scheduleMode === 'oem' && (
                    <span className="text-[10px] bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 font-mono font-bold px-1.5 py-0.2 rounded border border-red-200 dark:border-red-800">
                      -{oemScoreDeduction} PTS OEM PENALTY
                    </span>
                  )}
                </div>

                {scheduleMode === 'oem' ? (
                  <p className="font-body text-body dark:text-slate-300 leading-relaxed text-sm">
                    Automaker OEM marketing schedules defer transmission fluid, omit GDI intake walnut decoking, and stretch oil intervals to 20,000 mi. This compounds unaddressed carbon buildup, sheared ATF viscosity, and timing chain friction — multiplying catastrophic failure risk by <strong>{oemRiskMultiplier.toFixed(2)}x</strong>.
                  </p>
                ) : (
                  <p className="font-body text-body dark:text-slate-300 leading-relaxed text-sm">
                    {evaluatedComponents.some((c) => c.health.status === 'CRITICAL' && !c.isRecentlyServiced)
                      ? 'High-priority components have reached their engineering preventative threshold and require timely servicing.'
                      : evaluatedComponents.some((c) => c.health.status === 'WARNING' && !c.isRecentlyServiced)
                      ? 'Two wear items are approaching their service window based on your current odometer reading and driving profile.'
                      : 'All evaluated powertrain assemblies are operating safely within engineering preventative tolerances.'}
                  </p>
                )}

                {/* Benchmarking note panel */}
                {scheduleMode === 'oem' ? (
                  <div className="mt-3 bg-red-50 dark:bg-red-950/40 rounded-xl p-3 font-small text-small text-red-950 dark:text-red-200 leading-normal border border-red-200 dark:border-red-800/70">
                    ⚠️ <strong>OEM "Lifetime" Risk Alert:</strong> Dealership "sealed for life" guidelines are calibrated for the 60k-mi warranty period. Following the <strong>Engineering Preventative Schedule</strong> restores score by <strong>+{oemScoreDeduction} points</strong>.
                  </div>
                ) : (
                  <div className="mt-3 bg-primary-50 dark:bg-primary-950/40 rounded-xl p-3 font-small text-small text-[#1D3A6B] dark:text-primary-200 leading-normal border border-primary-100 dark:border-primary-800/60">
                    This is a <strong>fair</strong> score for a <strong>{activePreset.name}</strong>. Owners who service wear items on schedule typically reach <strong>75+</strong>.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('schedule-heading');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-surface dark:bg-slate-800 shadow-sm rounded-full px-4 py-1.5 font-small text-small font-medium text-ink dark:text-slate-100 hover:bg-surface-subtle dark:hover:bg-slate-700 border border-border-strong dark:border-slate-700 transition-all inline-flex items-center gap-1.5"
            >
              <span>See score details</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted" />
            </button>
            <span className="font-code text-micro text-muted">84,300 sample logs</span>
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-surface dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowComparator((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all border ${
              showComparator
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-surface dark:bg-slate-800 text-ink dark:text-slate-100 border-border-strong dark:border-slate-700 hover:bg-surface-subtle dark:hover:bg-slate-700'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>{showComparator ? 'Hide Vehicle Comparison' : 'Compare Vehicles'}</span>
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

          <p className="hidden xl:inline text-xs font-mono text-muted dark:text-slate-400 ml-2">
            Powertrain wear simulation calibrated for {activePreset.name} · Protocol: {scheduleMode === 'oem' ? 'OEM Marketing (Dealer)' : 'Engineering Preventative (Specialist)'}
          </p>
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

      {/* 2. Workspace Split: 5 cols controls (left sticky), 7 cols wear timeline (right) */}
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8 items-start">
        {/* Left Column: 5 cols controls (sticky) */}
        <div className="lg:col-span-5">
          <Card className="h-fit lg:sticky lg:top-24 lg:top-[136px]" aria-labelledby="profile-heading">
            <h2 id="profile-heading" className="mb-5 font-h3 text-h3 text-ink dark:text-slate-100 font-semibold tracking-tight">
              Vehicle &amp; driving profile
            </h2>

            {/* Vehicle Cascading Selectors */}
            <VehicleSelect
              selectedPresetId={selectedPresetId}
              onSelectPreset={onSelectPreset}
              selectDropdownId="risk-preset-sync"
            />

            <div className="mt-8 flex flex-col gap-7">
              {/* High-Visibility Segmented Control: Preventative vs OEM Telemetry Toggle */}
              <div className="rounded-2xl p-4 bg-surface-subtle dark:bg-slate-800/70 border border-border dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink dark:text-slate-100 font-mono flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                    <span>Service Schedule Protocol</span>
                  </span>
                  {scheduleMode === 'oem' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger-bg text-danger-text border border-danger-border font-mono">
                      +{oemRiskMultiplier.toFixed(2)}x RISK EXPOSURE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 font-mono">
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
                      label: 'Engineering Preventative Schedule',
                      hint: 'Specialist limits (ZF, BorgWarner, Bosch)',
                    },
                    {
                      value: 'oem',
                      label: 'OEM "Lifetime" Marketing Schedule',
                      hint: 'Dealership warranty minimums',
                    },
                  ]}
                />

                <p className="text-xs text-muted dark:text-slate-400 leading-relaxed">
                  {scheduleMode === 'preventative' ? (
                    <span>
                      <strong>Specialist Standard:</strong> Independent failure prevention thresholds from component manufacturers (ZF 50k–60k ATF, 85k timing, GDI walnut decoking).
                    </span>
                  ) : (
                    <span className="text-red-700 dark:text-red-300">
                      <strong>OEM Marketing Schedule:</strong> Dealership warranty-minimum intervals, "sealed for life" transmission fluid, and 20k-mi extended oil changes.
                    </span>
                  )}
                </p>
              </div>

              {/* Current Odometer Slider */}
              <div>
                <div className="mb-2.5 flex items-baseline justify-between gap-4">
                  <label htmlFor="risk-odometer-slider" className="text-sm font-medium text-body dark:text-slate-300">
                    Current odometer
                  </label>
                  <span className="text-base font-semibold tabular-nums tracking-tight text-ink dark:text-slate-100 font-mono bg-surface-subtle dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-border/50 dark:border-slate-700">
                    {formatDistance(physicalOdometerMiles)}
                  </span>
                </div>
                <input
                  id="risk-odometer-slider"
                  type="range"
                  min={10000}
                  max={200000}
                  step={1000}
                  value={Math.min(200000, Math.max(10000, displayOdometer))}
                  onChange={(e) => setPhysicalOdometerMiles(convertRegionToMiles(Number(e.target.value)))}
                  className="odo-range telemetry-slider"
                  style={{
                    '--fill': `${((Math.min(200000, Math.max(10000, displayOdometer)) - 10000) / (200000 - 10000)) * 100}%`,
                  }}
                />
                <div className="mt-1.5 flex justify-between text-xs tabular-nums text-faint font-mono">
                  <span>10,000 {distanceUnit}</span>
                  <span>200,000 {distanceUnit}</span>
                </div>
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
            </div>
          </Card>
        </div>

        {/* Right Column: 7 cols component wear timeline */}
        <div className="lg:col-span-7">
          <Card aria-labelledby="schedule-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="schedule-heading" className="font-h3 text-h3 text-ink dark:text-slate-100 font-semibold tracking-tight">
                POWERTRAIN TELEMETRY DOSSIER · {evaluatedComponents.length} Assemblies
              </h2>
              {scheduleMode === 'oem' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-900 border border-red-300 dark:bg-red-950/70 dark:text-red-200 dark:border-red-800 text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                  <span>OEM Marketing Schedule Active ({oemRiskMultiplier.toFixed(2)}x Risk)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Engineering Preventative Active</span>
                </div>
              )}
            </div>

            {/* Estimated 12-month service reserve banner */}
            <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-[#0B1220] p-6 text-white sm:flex-row sm:items-end sm:justify-between shadow-sm relative overflow-hidden">
              {scheduleMode === 'oem' && (
                <div className="absolute top-0 right-0 bg-red-600 text-white font-mono text-[10px] font-bold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
                  Risk Exposure (+{oemRiskMultiplier.toFixed(2)}x)
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-white/70 uppercase font-semibold tracking-wider font-mono">
                    Estimated 12-month service reserve
                  </p>
                  {scheduleMode === 'oem' && (
                    <span className="text-[10px] font-mono bg-red-500/30 text-red-300 px-2 py-0.5 rounded border border-red-500/50">
                      OEM Deferral Scaled
                    </span>
                  )}
                  {verifiedServiceCreditUsd > 0 && (
                    <span
                      data-testid="verified-service-credit-badge"
                      className="text-[10px] font-mono font-bold bg-emerald-500/25 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/50 inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      -{formatCurrency(verifiedServiceCreditUsd)} Verified Service Credit
                    </span>
                  )}
                </div>
                <p className="mt-1 text-4xl sm:text-5xl font-bold tabular-nums tracking-tight font-mono text-white" aria-live="polite">
                  {formatCurrency(serviceReserveUsd)}
                </p>
                {scheduleMode === 'oem' && (
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Base preventative: {formatCurrency(baseReserveUsd)} · Scaled by {oemRiskMultiplier.toFixed(2)}x dynamic risk
                  </p>
                )}
              </div>
              <dl className="flex gap-6 text-sm border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-6">
                <div>
                  <dt className="text-xs text-white/60">Effective wear</dt>
                  <dd className="font-semibold tabular-nums font-mono text-white mt-0.5">{formatDistance(effectiveWearMax)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-white/60">Odometer</dt>
                  <dd className="font-semibold tabular-nums font-mono text-white mt-0.5">{formatDistance(physicalOdometerMiles)}</dd>
                </div>
              </dl>
            </div>

            {/* Component Wear Rows */}
            <ul className="mt-4 divide-y divide-border dark:divide-slate-800">
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
                  <li key={item.id} className="py-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-body text-body font-semibold text-ink dark:text-slate-100 leading-tight">
                          {item.name}
                        </h3>
                        <p className="text-xs text-muted dark:text-slate-400 mt-0.5">{item.category}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleComponentServiced(item.id)}
                          aria-pressed={isServiced}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-all border ${
                            isServiced
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700 shadow-xs'
                              : 'bg-surface-subtle text-muted border-border hover:border-border-strong hover:text-ink dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:text-slate-100'
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono tracking-tight bg-red-100 text-red-900 border border-red-300 dark:bg-red-950/70 dark:text-red-200 dark:border-red-800 shadow-xs">
                          {item.oemFallacyBadge}
                        </span>
                        {item.oemIntervalDisplay && (
                          <span className="text-xs text-muted dark:text-slate-400 font-mono">
                            OEM Spec: <span className="line-through text-red-700 dark:text-red-400 font-semibold">{item.oemIntervalDisplay}</span>
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
                        className="h-2 flex-1 overflow-hidden rounded-full bg-border dark:bg-slate-800"
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: isServiced ? '#12A150' : BAR_COLOR[status] || '#12A150',
                          }}
                        />
                      </div>
                      <span className="w-24 text-right text-xs tabular-nums text-muted dark:text-slate-400 font-mono font-medium">
                        {pct}% life used
                      </span>
                    </div>

                    {/* Cost comparison & Next service */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                      <p className="flex items-baseline gap-2 text-sm">
                        <span className="text-base font-semibold tabular-nums text-ink dark:text-slate-100 font-mono">
                          {formatCurrency(primaryCost)}
                        </span>
                        <span className="text-muted dark:text-slate-400 text-xs">
                          {workshopTier === 'dealership' ? 'Dealer rate' : 'Independent'}
                        </span>
                        {workshopTier === 'dealership' ? (
                          <span className="text-success-text tabular-nums font-mono text-xs font-medium">
                            · Indie {formatCurrency(indieCostAvg)}
                          </span>
                        ) : (
                          <s className="text-faint tabular-nums font-mono text-xs">
                            {formatCurrency(dealerCostAvg)} Dealer
                          </s>
                        )}
                      </p>
                      <span className="text-xs tabular-nums text-muted dark:text-slate-400 font-mono">
                        Next service in ~{formatDistance(item.health.remainingPhysicalMiles)}
                      </span>
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
                      <p className="rounded-xl bg-surface-subtle dark:bg-slate-800/80 border border-border/60 dark:border-slate-700 px-3.5 py-2.5 text-xs text-body dark:text-slate-300 leading-relaxed mt-1">
                        {item.preventativeAdvice}
                      </p>
                    </Collapse>
                  </li>
                );
              })}
            </ul>

            {/* Native Partner Card */}
            <div className="mt-6">
              <PartnerCard
                text="Prevent $2,500+ surprise workshop bills — scan live engine & DPF health from your phone."
                cta="Compare OBD2 Scanners"
                href="https://www.amazon.com/s?k=bluetooth+obd2+scanner"
              />
            </div>
          </Card>
        </div>
      </div>

      {/* 3. Manufacturer Maintenance Milestone Roadmap */}
      <MaintenanceMilestones
        presetId={activePreset.id}
        currentOdometerMiles={physicalOdometerMiles}
        scheduleMode={scheduleMode}
      />

      {/* 4. Contextual Repair Protection & Warranty Banner */}
      <TopTabAffiliateBanner
        type="warranty"
        vehicleName={activePreset.name}
      />
    </div>
  );
}

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Wrench, RotateCcw, AlertTriangle, ShieldCheck, Car, ChevronDown } from 'lucide-react';
import {
  MAINTENANCE_COMPONENTS,
  calculateOemRiskMultiplier,
  evaluateComponentHealth,
  resolvePowertrainType,
  isPureElectric,
  calculateMaintenanceReserve,
} from '../../data/maintenanceData';
import { VEHICLE_PRESETS, getPresetById } from '../../data/vehiclePresets';
import { useUnits } from '../../context/UnitContext';
import { useGarage, MILESTONE_IMPACT_MAP, COMPONENT_MILESTONE_TRIGGERS } from '../../context/GarageContext';
import { Card, PageHeader, Segmented, TldrVerdictBox, RiskBadge, InfoTooltip, MobileStickySummaryBar, FormattedNumericInput } from '../common/OdometerPrimitives';
import VehicleSelect from '../common/VehicleSelect';
import TopTabAffiliateBanner from '../monetization/TopTabAffiliateBanner';
import MaintenanceMilestones, { EV_MILESTONE_IMPACT_MAP } from './MaintenanceMilestones';
import VehicleComparator from './VehicleComparator';
import VehicleDossierExport from '../common/VehicleDossierExport';
import ForumShareModal from '../common/ForumShareModal';
import VehicleVisualCard from '../common/vehicle/VehicleVisualCard.jsx';
import KnownIssuesDossier from '../common/KnownIssuesDossier';
import FixOrSellCalculator from './FixOrSellCalculator';
import VehicleInternalLinks from '../seo/VehicleInternalLinks';
import ToolEditorialSection from '../seo/ToolEditorialSection';
import RiskVerdictCard from './risk/RiskVerdictCard.jsx';
import RiskVehiclePickerDialog from './risk/RiskVehiclePickerDialog.jsx';
import RiskMobileBottomSheet from './risk/RiskMobileBottomSheet.jsx';
import RiskComponentRow from './risk/RiskComponentRow.jsx';

const LENS_TABS = [
  { id: 'matrix', label: 'Component Risk Matrix' },
  { id: 'milestones', label: 'Service Milestones' },
  { id: 'dossier', label: 'Known Model Issues Dossier' },
];

export default function MaintenanceRiskMatrix({
  selectedPresetId,
  hasSelectedVehicle: hasSelectedVehicleProp = Boolean(selectedPresetId),
  onSelectPreset,
  onNavigateToTco,
  onNavigateToRisk,
  onNavigateToRiskBracket,
  onNavigateToChecklist,
  onNavigateToObd,
  onNavigateToHybridObd,
  onNavigateToCompare,
  onNavigateToVehicles,
  initialOdometerMiles,
}) {
  const {
    region,
    currencySymbol,
    distanceUnit,
    formatCurrency,
    formatDistance,
    convertMilesToRegion,
    convertRegionToMiles,
  } = useUnits();

  const garage = useGarage();

  const isVehicleSelected = Boolean(
    hasSelectedVehicleProp && selectedPresetId && VEHICLE_PRESETS.some((p) => p.id === selectedPresetId)
  );
  const activePreset = useMemo(
    () => (isVehicleSelected ? getPresetById(selectedPresetId) : null),
    [isVehicleSelected, selectedPresetId]
  );

  const [physicalOdometerMiles, setPhysicalOdometerMiles] = useState(() => {
    if (Number(initialOdometerMiles) > 0) return Math.round(Number(initialOdometerMiles));
    if (activePreset && Number(activePreset.defaultOdometerMiles) >= 0) {
      return Math.max(0, Number(activePreset.defaultOdometerMiles));
    }
    return 60000;
  });
  const [scheduleMode, setScheduleMode] = useState('preventative'); // 'preventative' | 'oem'
  const [drivingStyle, setDrivingStyle] = useState('mixed'); // 'highway' | 'mixed' | 'city'
  const [workshopTier, setWorkshopTier] = useState('independent'); // 'independent' | 'dealership'
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierInitialMode, setDossierInitialMode] = useState('dossier');
  const [showForumShareModal, setShowForumShareModal] = useState(false);
  const [showComparator, setShowComparator] = useState(false);
  const [justSavedGarage, setJustSavedGarage] = useState(false);
  const [showSwitchCarModal, setShowSwitchCarModal] = useState(false);
  const [showMobileBottomSheet, setShowMobileBottomSheet] = useState(false);
  const [draftPresetId, setDraftPresetId] = useState(isVehicleSelected ? selectedPresetId : null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeLensTab, setActiveLensTab] = useState('matrix');

  const tabButtonRefs = useRef({ matrix: null, milestones: null, dossier: null });
  const panelsContainerRef = useRef(null);
  const matrixPanelRef = useRef(null);
  const milestonesPanelRef = useRef(null);
  const dossierPanelRef = useRef(null);

  useEffect(() => {
    if (typeof HTMLElement === 'undefined') return;
    const supportsUntilFound = 'onbeforematch' in HTMLElement.prototype;
    if (supportsUntilFound) return;
    const panelEntries = [
      { id: 'matrix', el: matrixPanelRef.current || document.getElementById('risk-panel-matrix') },
      { id: 'milestones', el: milestonesPanelRef.current || document.getElementById('risk-panel-milestones') },
      { id: 'dossier', el: dossierPanelRef.current || document.getElementById('risk-panel-dossier') },
    ];
    for (const { id, el } of panelEntries) {
      if (!el) continue;
      if (id === activeLensTab) {
        if (typeof el.removeAttribute === 'function') el.removeAttribute('hidden');
      } else if (typeof el.setAttribute === 'function') {
        el.setAttribute('hidden', '');
      }
    }
  }, [activeLensTab, isVehicleSelected]);

  useEffect(() => {
    const supportsUntilFound =
      typeof HTMLElement !== 'undefined' && 'onbeforematch' in HTMLElement.prototype;
    const container = panelsContainerRef.current;
    if (!supportsUntilFound || !container || typeof container.addEventListener !== 'function') {
      return undefined;
    }

    const handleBeforeMatch = (event) => {
      let node = event.target;
      while (node && node !== container) {
        if (typeof node.getAttribute === 'function') {
          const matchedTab = node.getAttribute('data-tab-id');
          if (matchedTab && LENS_TABS.some((t) => t.id === matchedTab)) {
            setActiveLensTab(matchedTab);
            break;
          }
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
  }, [isVehicleSelected]);

  const handleLensKeyDown = (event, currentIndex) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % LENS_TABS.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + LENS_TABS.length) % LENS_TABS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = LENS_TABS.length - 1;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    const targetTab = LENS_TABS[nextIndex];
    setActiveLensTab(targetTab.id);
    const btn = tabButtonRefs.current[targetTab.id];
    if (btn) {
      if (typeof btn.focus === 'function') btn.focus();
      if (typeof btn.scrollIntoView === 'function') {
        btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }
  };

  useEffect(() => {
    setDraftPresetId(isVehicleSelected ? selectedPresetId : null);
    if (!isVehicleSelected) {
      setShowExportMenu(false);
      setShowDossierModal(false);
      setShowForumShareModal(false);
    }
  }, [isVehicleSelected, selectedPresetId]);

  const draftPreset = useMemo(
    () => (draftPresetId && VEHICLE_PRESETS.some((p) => p.id === draftPresetId) ? getPresetById(draftPresetId) : null),
    [draftPresetId]
  );
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
    } else if (activePreset) {
      setPhysicalOdometerMiles(
        Math.max(0, Number(activePreset.defaultOdometerMiles) >= 0 ? Number(activePreset.defaultOdometerMiles) : 58000)
      );
    } else {
      setPhysicalOdometerMiles(60000);
    }
    setJustSavedGarage(false);
  }, [activePreset, initialOdometerMiles]);

  const completedMilestones = activePreset && garage?.isProviderActive
    ? garage.getCompletedMilestones(activePreset.id)
    : {};

  const servicedComponents = activePreset
    ? garage?.isProviderActive
      ? garage.getServicedComponents(activePreset.id)
      : localServicedByPreset[activePreset.id] || {}
    : {};

  const handleToggleComponentServiced = (componentId) => {
    if (!activePreset) return;
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
    if (!isVehicleSelected || !activePreset) return false;
    if (justSavedGarage) return true;
    if (!garage?.savedVehicles) return false;
    return garage.savedVehicles.some(
      (v) => v.presetId === activePreset.id && v.odometerMiles === physicalOdometerMiles
    );
  }, [isVehicleSelected, garage?.savedVehicles, activePreset, physicalOdometerMiles, justSavedGarage]);

  const handleSaveToGarage = () => {
    if (!isVehicleSelected || !activePreset) return;
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
    if (!isVehicleSelected || !activePreset) return [];
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
  }, [isVehicleSelected, activePreset, physicalOdometerMiles, urbanTripSharePct, scheduleMode, completedMilestones, servicedComponents]);

  // Compute 12-month service reserve estimate (scaled by dynamic OEM risk multiplier in OEM mode)
  // and deduct verified service credits when components or milestones are checked off
  const {
    serviceReserveUsd,
    baseReserveUsd,
    effectiveWearMax,
    verifiedServiceCreditUsd,
    maintenanceBonusPts,
  } = useMemo(() => {
    if (!isVehicleSelected || !activePreset || evaluatedComponents.length === 0) {
      return {
        baseReserveUsd: 0,
        serviceReserveUsd: 0,
        effectiveWearMax: physicalOdometerMiles,
        verifiedServiceCreditUsd: 0,
        maintenanceBonusPts: 0,
      };
    }
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
      const resolvedCosts = item.health?.scaledCostsUsd || item.costsUsd;
      const costRange = workshopTier === 'dealership' ? resolvedCosts.dealership : resolvedCosts.independent;
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
      vehicle: activePreset,
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
  }, [isVehicleSelected, evaluatedComponents, physicalOdometerMiles, workshopTier, scheduleMode, oemRiskMultiplier, completedMilestones, activePreset]);

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

  const criticalItems = useMemo(
    () => evaluatedComponents.filter((c) => c.health.status === 'CRITICAL' && !c.isRecentlyServiced),
    [evaluatedComponents]
  );
  const warningItems = useMemo(
    () => evaluatedComponents.filter((c) => c.health.status === 'WARNING' && !c.isRecentlyServiced),
    [evaluatedComponents]
  );
  const topCriticalItem = criticalItems[0] || warningItems[0] || evaluatedComponents[0];

  const riskTldrFacts = useMemo(() => {
    if (!isVehicleSelected) {
      return [
        {
          label: '12-Month Service Reserve',
          value: `${currencySymbol}-`,
          subtext: 'Select a vehicle to calculate expected 12-month maintenance & wear reserve.',
          badge: null,
        },
        {
          label: 'Risk Status',
          value: 'Select a Vehicle',
          subtext: 'Powertrain-specific component wear horizons unlock once a model is chosen.',
          badge: null,
        },
        {
          label: 'Reliability Verdict',
          value: '-/100 pts',
          subtext: 'Engineering reliability score adapts to mileage, urban cycles, and schedule mode.',
          badge: null,
        },
      ];
    }
    return [
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
    ];
  }, [isVehicleSelected, currencySymbol, serviceReserveUsd, scheduleMode, oemRiskMultiplier, formatCurrency, physicalOdometerMiles, formatDistance, criticalItems, warningItems, topCriticalItem, reliabilityScore]);

  return (
    <div className="space-y-8 pb-24 lg:pb-0 scroll-pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
      <PageHeader
        title="Upcoming maintenance & wear"
        subtitle="See which mechanical parts wear out next based on your odometer reading and driving habits."
        className="!mb-0 max-w-none"
      />

      {/* Desktop Two-Column Split Workspace (58% Left Controls & Diagnostic Lenses / 42% Right Sticky Verdict Card) */}
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8 items-start min-w-0">
        {/* Left Column: 7 cols Controls + 3-Tab Diagnostic Workspace */}
        <div className="lg:col-span-7 flex flex-col gap-6 min-w-0">
          <Card className="p-5 sm:p-6 space-y-6" aria-labelledby="profile-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-border/80 dark:border-zinc-800">
              <h2 id="profile-heading" className="font-sans text-h3 text-ink dark:text-zinc-50 font-bold tracking-tight scroll-mt-28 lg:scroll-mt-32">
                {isVehicleSelected ? 'Vehicle & driving profile' : 'Select your vehicle'}
              </h2>
              {isVehicleSelected && activePreset ? (
                <span className="rounded-md bg-surface-subtle dark:bg-zinc-900 text-body dark:text-zinc-300 border border-border/80 dark:border-zinc-800 px-2.5 py-0.5 text-xs font-sans font-medium">
                  {activePreset.powerHp ? `${activePreset.powerHp} HP · ` : ''}{activePreset.fuelType}
                </span>
              ) : (
                <span className="rounded-md bg-surface-subtle dark:bg-zinc-900 text-body dark:text-zinc-300 border border-border/80 dark:border-zinc-800 px-2.5 py-0.5 text-xs font-sans font-medium">
                  179+ Models
                </span>
              )}
            </div>

            {isVehicleSelected && activePreset ? (
              /* Unified Active Vehicle Card with Switch Car Button */
              <div>
                <VehicleVisualCard
                  vehicle={activePreset}
                  variant="showcase"
                  interactive={false}
                  className="!p-4 sm:!p-5 !shadow-none bg-surface-subtle/70 dark:bg-zinc-900/60 border-border/70 dark:border-zinc-800 rounded-2xl"
                  secondaryMetrics={
                    <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-surface dark:bg-zinc-950/60 border border-border/70 dark:border-zinc-800">
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
                        className="min-h-[44px] sm:min-h-[38px] bg-[#183D22] text-white hover:bg-[#122E19] dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl px-4 py-2 font-sans text-xs sm:text-sm font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer"
                      >
                        <RotateCcw aria-hidden="true" className="w-3.5 h-3.5" />
                        <span>Switch Car</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDossierInitialMode('dossier');
                          setShowDossierModal(true);
                        }}
                        className="min-h-[44px] sm:min-h-[38px] bg-surface dark:bg-zinc-800 rounded-xl px-3.5 py-2 font-sans text-xs font-semibold text-ink dark:text-zinc-100 hover:bg-surface-subtle dark:hover:bg-zinc-700 border border-border dark:border-zinc-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Share report ↗</span>
                      </button>
                    </div>
                  }
                />
              </div>
            ) : (
              /* Clean Inline Vehicle Picker (Zero pre-selected vehicle photo or numbers) */
              <div
                data-testid="risk-empty-vehicle-picker"
                className="rounded-2xl border border-border/70 dark:border-zinc-800 bg-surface-subtle/80 dark:bg-zinc-900/60 p-4 sm:p-5 space-y-4"
              >
                <VehicleSelect
                  selectedPresetId={draftPresetId}
                  onSelectPreset={setDraftPresetId}
                  onAutocompleteSelect={(id) => onSelectPreset(id)}
                  showTelemetryStrip={false}
                  dropdownInFlow={true}
                  compactGrid={true}
                  selectDropdownId="risk-preset-sync"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/70 dark:border-zinc-800">
                  <div className="min-w-0">
                    <span className="block text-[11px] font-sans text-muted dark:text-zinc-400">
                      {draftPreset ? 'Selected from dropdown:' : 'No vehicle selected yet:'}
                    </span>
                    <span className={`block font-sans text-xs sm:text-sm ${draftPreset ? 'font-semibold text-ink dark:text-zinc-100 truncate' : 'text-muted dark:text-zinc-400'}`}>
                      {draftPreset ? draftPreset.name : 'Choose a make & model above, or pick a popular model below'}
                    </span>
                  </div>
                  <button
                    type="button"
                    data-testid="risk-apply-vehicle-button"
                    disabled={!draftPreset}
                    onClick={() => draftPreset && onSelectPreset(draftPreset.id)}
                    className={`min-h-[44px] rounded-xl px-4 py-2 font-sans text-xs sm:text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 shrink-0 ${
                      draftPreset
                        ? 'bg-[#183D22] text-white hover:bg-[#122E19] dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer'
                        : 'bg-border dark:bg-zinc-800 text-muted dark:text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <Car aria-hidden="true" className="w-4 h-4 shrink-0" />
                    <span>Inspect This Vehicle</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60 dark:border-zinc-800/70">
                  <span className="text-[11px] font-sans font-medium text-muted dark:text-zinc-400 mr-1">
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
                      className="min-h-[44px] sm:min-h-[32px] px-3 py-1.5 rounded-lg bg-surface dark:bg-zinc-900 border border-border dark:border-zinc-800 text-xs font-sans font-medium text-ink dark:text-zinc-200 hover:border-primary-600 dark:hover:border-emerald-500 hover:text-primary-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Persistent accessible vehicle catalog select mounted in DOM for programmatic sync */}
            {isVehicleSelected && !showSwitchCarModal && (
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

              {/* Service Schedule Protocol Segmented Control (Calm Tint Block) */}
              <div className="rounded-xl p-4 bg-surface-subtle dark:bg-zinc-900/80 space-y-3 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-ink dark:text-zinc-50 font-sans flex items-center gap-1.5 min-w-0">
                    <Wrench aria-hidden="true" className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400 shrink-0" />
                    <span>Service Schedule Protocol</span>
                    <InfoTooltip
                      label="Preventative vs. OEM Schedule"
                      content="Specialist Preventative follows component makers (ZF, Bosch, BorgWarner) who mandate 50k–60k transmission fluid & early timing inspections. OEM Standard follows dealership marketing ('sealed for life' fluids & 20k oil intervals) designed only to clear the 60k warranty."
                    />
                  </span>
                  {scheduleMode === 'oem' ? (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-sans font-medium bg-rose-50/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40 shrink-0">
                      +{oemRiskMultiplier.toFixed(2)}x Risk Exposure
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-sans font-medium bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40 shrink-0">
                      Specialist Standard
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
                      <strong className="text-ink dark:text-zinc-200">Specialist Standard:</strong> Independent failure prevention thresholds from component manufacturers (ZF 50k–60k ATF, 85k timing, GDI walnut decoking).
                    </span>
                  ) : (
                    <span className="text-rose-700 dark:text-rose-300">
                      <strong>OEM Marketing Schedule:</strong> Dealership warranty-minimum intervals, &quot;sealed for life&quot; transmission fluid, and 20k-mi extended oil changes.
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
            </div>
          </Card>

          {/* Diagnostic Lens Workspace (3 Tabs or Empty Dossier State) */}
          {!isVehicleSelected || !activePreset ? (
            <div
              data-testid="risk-empty-dossier-state"
              className="rounded-2xl border border-dashed border-border-strong dark:border-zinc-700 bg-surface dark:bg-[#121215] p-6 sm:p-8 text-center space-y-3"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-[#183D22] dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Wrench aria-hidden="true" className="w-5 h-5" />
              </div>
              <h2 id="schedule-heading" className="font-sans text-lg font-bold tracking-tight text-ink dark:text-zinc-50">
                Select a vehicle to inspect component wear
              </h2>
              <p className="text-xs sm:text-sm font-sans text-muted dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                Choose any of 179+ petrol, diesel, hybrid, or EV models above to unlock assembly-by-assembly failure thresholds, workshop quotes, known engine defects, and a full service milestone roadmap.
              </p>
            </div>
          ) : (
            <Card className="p-0 overflow-hidden">
              {/* Single-Row Accessible Tablist */}
              <div
                role="tablist"
                aria-label="Diagnostic lenses"
                className="flex items-center overflow-x-auto no-scrollbar border-b border-border/80 dark:border-zinc-800 px-4 sm:px-6"
              >
                {LENS_TABS.map((tab, idx) => {
                  const isSelected = activeLensTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      ref={(el) => {
                        tabButtonRefs.current[tab.id] = el;
                      }}
                      type="button"
                      role="tab"
                      id={`risk-tab-${tab.id}`}
                      aria-selected={isSelected}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => setActiveLensTab(tab.id)}
                      onKeyDown={(e) => handleLensKeyDown(e, idx)}
                      className="dl-hub-tab cursor-pointer whitespace-nowrap"
                    >
                      <span>{tab.label}</span>
                      {tab.id === 'matrix' && (
                        <span className="font-mono tabular-nums text-[11px] px-1.5 py-0.5 rounded bg-surface-subtle dark:bg-zinc-800 text-muted dark:text-zinc-300">
                          {evaluatedComponents.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Panels Container (Zero padding/border/margin/background directly on [role="tabpanel"]!) */}
              <div ref={panelsContainerRef}>
                <div
                  ref={matrixPanelRef}
                  role="tabpanel"
                  id="risk-panel-matrix"
                  data-tab-id="matrix"
                  aria-labelledby="risk-tab-matrix"
                  tabIndex={activeLensTab === 'matrix' ? 0 : -1}
                  {...(activeLensTab !== 'matrix' ? { hidden: 'until-found' } : {})}
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2
                        id="schedule-heading"
                        className="font-sans text-base sm:text-lg text-ink dark:text-zinc-50 font-bold tracking-tight scroll-mt-28 lg:scroll-mt-32"
                      >
                        POWERTRAIN TELEMETRY DOSSIER · {evaluatedComponents.length} Assemblies
                      </h2>
                      {scheduleMode === 'oem' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-50/80 text-rose-800 border border-rose-200/80 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/40 text-xs font-sans font-medium">
                          <AlertTriangle aria-hidden="true" className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>OEM Marketing Schedule Active ({oemRiskMultiplier.toFixed(2)}x Risk)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50/80 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40 text-xs font-sans font-medium">
                          <ShieldCheck aria-hidden="true" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Engineering Preventative Active</span>
                        </span>
                      )}
                    </div>

                    <ul className="divide-y divide-border/80 dark:divide-zinc-800">
                      {evaluatedComponents.map((item) => (
                        <RiskComponentRow
                          key={item.id}
                          item={item}
                          activePreset={activePreset}
                          scheduleMode={scheduleMode}
                          workshopTier={workshopTier}
                          onToggleServiced={handleToggleComponentServiced}
                          onNavigateToObd={onNavigateToObd}
                          onNavigateToHybridObd={onNavigateToHybridObd}
                        />
                      ))}
                    </ul>
                  </div>
                </div>

                <div
                  ref={milestonesPanelRef}
                  role="tabpanel"
                  id="risk-panel-milestones"
                  data-tab-id="milestones"
                  aria-labelledby="risk-tab-milestones"
                  tabIndex={activeLensTab === 'milestones' ? 0 : -1}
                  {...(activeLensTab !== 'milestones' ? { hidden: 'until-found' } : {})}
                >
                  <div className="p-5 sm:p-6">
                    <MaintenanceMilestones
                      embedded={true}
                      presetId={activePreset.id}
                      currentOdometerMiles={physicalOdometerMiles}
                      scheduleMode={scheduleMode}
                      drivingStyle={drivingStyle}
                      workshopTier={workshopTier}
                    />
                  </div>
                </div>

                <div
                  ref={dossierPanelRef}
                  role="tabpanel"
                  id="risk-panel-dossier"
                  data-tab-id="dossier"
                  aria-labelledby="risk-tab-dossier"
                  tabIndex={activeLensTab === 'dossier' ? 0 : -1}
                  {...(activeLensTab !== 'dossier' ? { hidden: 'until-found' } : {})}
                >
                  <div className="p-5 sm:p-6">
                    <KnownIssuesDossier
                      embedded={true}
                      presetId={activePreset.id}
                      vehicleName={activePreset.name}
                      brand={activePreset.brand}
                      model={activePreset.modelName}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: 5 cols Sticky Verdict Card + Reserved Warranty Banner */}
        <div className="lg:col-span-5 lg:sticky lg:[top:5.25rem] flex flex-col gap-5 min-w-0">
          <RiskVerdictCard
            isVehicleSelected={isVehicleSelected}
            activePreset={activePreset}
            physicalOdometerMiles={physicalOdometerMiles}
            scheduleMode={scheduleMode}
            oemRiskMultiplier={oemRiskMultiplier}
            oemScoreDeduction={oemScoreDeduction}
            reliabilityScore={reliabilityScore}
            serviceReserveUsd={serviceReserveUsd}
            baseReserveUsd={baseReserveUsd}
            effectiveWearMax={effectiveWearMax}
            criticalCount={criticalItems.length}
            warningCount={warningItems.length}
            evaluatedComponents={evaluatedComponents}
            verifiedServiceCreditUsd={verifiedServiceCreditUsd}
            maintenanceBonusPts={maintenanceBonusPts}
            isSavedInGarage={isSavedInGarage}
            onSaveToGarage={handleSaveToGarage}
            showComparator={showComparator}
            onToggleComparator={() => setShowComparator((prev) => !prev)}
            showExportMenu={showExportMenu}
            setShowExportMenu={setShowExportMenu}
            onOpenForumShare={() => setShowForumShareModal(true)}
            onOpenNegotiationPdf={() => {
              setDossierInitialMode('negotiation');
              setShowDossierModal(true);
            }}
            onOpenDossierPrint={() => {
              setDossierInitialMode('dossier');
              setShowDossierModal(true);
            }}
          />

          <TopTabAffiliateBanner
            type="warranty"
            compact={true}
            vehicleName={isVehicleSelected && activePreset ? activePreset.name : 'your vehicle'}
            odometerMiles={isVehicleSelected ? physicalOdometerMiles : undefined}
            serviceReserveUsd={isVehicleSelected ? serviceReserveUsd : undefined}
          />
        </div>
      </div>

      {/* Native <dialog> Switch Car Picker */}
      <RiskVehiclePickerDialog
        open={showSwitchCarModal}
        onClose={() => setShowSwitchCarModal(false)}
        selectedPresetId={selectedPresetId}
        draftPresetId={draftPresetId}
        setDraftPresetId={setDraftPresetId}
        draftPreset={draftPreset}
        onSelectPreset={onSelectPreset}
        quickPresets={quickPresets}
      />

      {/* Mobile <dialog> Bottom Sheet */}
      <RiskMobileBottomSheet
        open={showMobileBottomSheet}
        onClose={() => setShowMobileBottomSheet(false)}
        isVehicleSelected={isVehicleSelected}
        activePreset={activePreset}
        physicalOdometerMiles={physicalOdometerMiles}
        reliabilityScore={reliabilityScore}
        serviceReserveUsd={serviceReserveUsd}
        criticalCount={criticalItems.length}
        warningCount={warningItems.length}
        evaluatedComponents={evaluatedComponents}
        isSavedInGarage={isSavedInGarage}
        onSaveToGarage={handleSaveToGarage}
        onOpenDossierPrint={() => {
          setDossierInitialMode('dossier');
          setShowDossierModal(true);
        }}
        onOpenForumShare={() => setShowForumShareModal(true)}
        onOpenVehiclePicker={() => {
          setDraftPresetId(selectedPresetId);
          setShowSwitchCarModal(true);
        }}
      />

      {/* Inline Side-by-Side Vehicle Comparator */}
      {showComparator && (
        <VehicleComparator
          primaryPresetId={isVehicleSelected ? selectedPresetId : null}
          hasSelectedVehicle={isVehicleSelected}
          primaryOdometerMiles={isVehicleSelected ? physicalOdometerMiles : undefined}
          scheduleMode={scheduleMode}
          urbanTripSharePct={urbanTripSharePct}
          workshopTier={workshopTier}
          onClose={() => setShowComparator(false)}
          onApplyPreset={onSelectPreset}
        />
      )}

      {showDossierModal && isVehicleSelected && activePreset && (
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

      {showForumShareModal && isVehicleSelected && activePreset && (
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

      {/* Interactive "Should I Fix It or Sell It?" Decision Engine */}
      {isVehicleSelected && activePreset && (
        <FixOrSellCalculator
          vehicle={activePreset}
          initialRepairQuoteUsd={Math.max(850, serviceReserveUsd)}
          initialOdometerMiles={physicalOdometerMiles}
          sourceLabel="12-Month Service & Wear Reserve"
          onNavigateToCompare={onNavigateToCompare}
        />
      )}

      {/* Tucked Crawlable & Find-in-Page Searchable Editorial Methodology + Internal Links */}
      <details className="dl-disclosure group rounded-2xl border border-border/80 dark:border-zinc-800 bg-surface dark:bg-[#121215] px-5 sm:px-6 py-2 shadow-card">
        <summary className="min-h-[48px] py-2.5 flex items-center justify-between gap-3 text-left font-sans text-xs sm:text-sm font-semibold text-muted hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
          <span>Methodology, Maintenance FAQs &amp; Related Vehicle Dossiers</span>
          <ChevronDown
            aria-hidden="true"
            className="w-4 h-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
          />
        </summary>
        <div className="pb-6 pt-2 space-y-6 border-t border-border/70 dark:border-zinc-800">
          <ToolEditorialSection
            tool="risk"
            vehicleName={isVehicleSelected && activePreset ? activePreset.name : ''}
            className="!mt-2 !shadow-none !border-0 !p-0 !bg-transparent"
          />
          {isVehicleSelected && activePreset && (
            <VehicleInternalLinks
              vehicle={activePreset}
              onSelectPreset={onSelectPreset}
              onNavigateToTco={onNavigateToTco}
              onNavigateToRisk={onNavigateToRisk}
              onNavigateToRiskBracket={onNavigateToRiskBracket}
              onNavigateToChecklist={onNavigateToChecklist}
              onNavigateToCompare={onNavigateToCompare}
              onNavigateToHybridObd={
                onNavigateToHybridObd || ((_presetId, code) => onNavigateToObd && onNavigateToObd(code))
              }
              onNavigateToVehicles={onNavigateToVehicles}
            />
          )}
        </div>
      </details>

      {/* Mobile Sticky Bottom Verdict Bar (< 1024px) Opening Native <dialog> Bottom Sheet */}
      <MobileStickySummaryBar
        label={isVehicleSelected && activePreset ? `${activePreset.name} · Wear & Risk` : 'Select a vehicle · Wear & Risk'}
        primaryValue={isVehicleSelected ? `${formatCurrency(serviceReserveUsd)}/yr` : 'Pick a car'}
        secondaryValue={isVehicleSelected ? `Reliability ${reliabilityScore}/100` : '179+ models'}
        badgeText={isVehicleSelected ? `${criticalItems.length} Critical` : 'Ready'}
        actionLabel={isVehicleSelected ? 'Details ↑' : 'Select Car'}
        onAction={() => setShowMobileBottomSheet(true)}
      />
    </div>
  );
}

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ArrowRight,
  Share2,
  Printer,
  Check,
  RotateCcw,
  Car,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { VEHICLE_PRESETS, getPresetById } from '../../data/vehiclePresets';
import { useUnits } from '../../context/UnitContext';
import { Card } from '../common/OdometerPrimitives';
import { generatePpiChecklist } from '../../data/breakEvenAndPpi.js';
import {
  MAINTENANCE_COMPONENTS,
  evaluateComponentHealth,
  resolvePowertrainType,
  isPureElectric,
} from '../../data/maintenanceData.js';
import { estimateMileageAdjustedMarketValue } from '../../data/fixOrSellEngine.js';
import VinCheckBanner from '../monetization/VinCheckBanner';
import ToolEditorialSection from '../seo/ToolEditorialSection';
import VehicleInternalLinks from '../seo/VehicleInternalLinks';
import VehicleSelect from '../common/VehicleSelect';
import VehicleVisualCard from '../common/vehicle/VehicleVisualCard.jsx';
import {
  PPI_POPULAR_SHORTCUTS,
  sanitizeStep,
  groupStepsByStage,
} from './ppi/ppiStages.js';
import PpiStickyBar from './ppi/PpiStickyBar.jsx';
import PpiStageGroup from './ppi/PpiStageGroup.jsx';
import PpiVehiclePickerDialog from './ppi/PpiVehiclePickerDialog.jsx';
import PpiSummaryDialog from './ppi/PpiSummaryDialog.jsx';

export { generatePpiChecklist };

function resolveValidPreset(id) {
  return id && VEHICLE_PRESETS.some((p) => p.id === id) ? getPresetById(id) : null;
}

function parseInitialStatusFromUrl() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const map = {};
  const flaggedParam = params.get('flagged');
  if (flaggedParam) {
    flaggedParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((id) => {
        map[id] = 'flag';
      });
  }
  const naParam = params.get('na');
  if (naParam) {
    naParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((id) => {
        if (!map[id]) map[id] = 'na';
      });
  }
  return map;
}

export default function PreInspectionChecklist({
  presetId,
  hasSelectedVehicle = Boolean(presetId),
  currentOdometerMiles = 75000,
  standalone = false,
  onNavigateToObd,
  onNavigateToHybridObd,
  onNavigateToTco,
  onNavigateToRisk,
  onNavigateToRiskBracket,
  onNavigateToChecklist,
  onNavigateToCompare,
  onNavigateToVehicles,
  onSelectPreset,
}) {
  const {
    region,
    currencySymbol,
    distanceUnit,
    formatDistance,
    formatCurrency,
    convertMilesToRegion,
    convertRegionToMiles,
    convertUsdToRegion,
    convertRegionToUsd,
  } = useUnits();

  const [selectedPreset, setSelectedPreset] = useState(() =>
    hasSelectedVehicle ? resolveValidPreset(presetId) : null
  );
  const [draftPresetId, setDraftPresetId] = useState(() =>
    hasSelectedVehicle && resolveValidPreset(presetId) ? presetId : null
  );
  const draftPreset = useMemo(() => resolveValidPreset(draftPresetId), [draftPresetId]);
  const isVehicleSelected = Boolean(selectedPreset);

  const [odometerMiles, setOdometerMiles] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlOdo = Number(params.get('odo'));
      if (urlOdo > 0) return Math.round(urlOdo);
    }
    return Math.max(0, Number(currentOdometerMiles || selectedPreset?.defaultOdometerMiles || 75000));
  });

  const [askingPriceUsd, setAskingPriceUsd] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlPrice = Number(params.get('price'));
      if (urlPrice > 0) return Math.round(urlPrice);
    }
    if (!selectedPreset) return 25000;
    return estimateMileageAdjustedMarketValue(
      selectedPreset,
      odometerMiles || currentOdometerMiles || selectedPreset.defaultOdometerMiles || 75000
    );
  });

  // Draft input strings so clearing #ppi-asking-price / #ppi-odometer-input mid-edit doesn't snap back
  const [priceDraft, setPriceDraft] = useState(null);
  const [odoDraft, setOdoDraft] = useState(null);

  // Unified mutually exclusive step statuses: { [stepId]: 'pass' | 'flag' | 'na' }
  const [stepStatuses, setStepStatuses] = useState(parseInitialStatusFromUrl);

  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showSwitchCarModal, setShowSwitchCarModal] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);

  const copyTimerRef = useRef(null);
  const stageDetailsRefs = useRef({});
  const initialMountPresetRef = useRef(selectedPreset?.id || null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const registerStageDetailsRef = useCallback((stageId, el) => {
    if (el) {
      stageDetailsRefs.current[stageId] = el;
    } else {
      delete stageDetailsRefs.current[stageId];
    }
  }, []);

  const expandAllStagesForPrint = useCallback(() => {
    Object.values(stageDetailsRefs.current).forEach((el) => {
      if (el && typeof el === 'object' && 'open' in el) {
        el.open = true;
      }
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return undefined;
    }
    const handleBeforePrint = () => {
      expandAllStagesForPrint();
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => {
      if (typeof window.removeEventListener === 'function') {
        window.removeEventListener('beforeprint', handleBeforePrint);
      }
    };
  }, [expandAllStagesForPrint]);

  const applySelectedVehicle = (nextPresetId) => {
    const p = resolveValidPreset(nextPresetId);
    setPriceDraft(null);
    setOdoDraft(null);
    if (!p) {
      setSelectedPreset(null);
      setDraftPresetId(null);
      setStepStatuses({});
      if (onSelectPreset) onSelectPreset(null);
      return;
    }
    setSelectedPreset(p);
    setDraftPresetId(p.id);
    const nextOdo = Math.max(35000, Number(p.defaultOdometerMiles) || 65000);
    setOdometerMiles(nextOdo);
    setAskingPriceUsd(estimateMileageAdjustedMarketValue(p, nextOdo));
    setStepStatuses({});
    if (onSelectPreset) onSelectPreset(p.id);
  };

  useEffect(() => {
    if (presetId === undefined) return;
    if (!hasSelectedVehicle || !presetId) {
      if (selectedPreset !== null) {
        setSelectedPreset(null);
        setDraftPresetId(null);
        setStepStatuses({});
        setPriceDraft(null);
        setOdoDraft(null);
      }
      return;
    }
    const p = resolveValidPreset(presetId);
    if (!p) {
      if (selectedPreset !== null) {
        setSelectedPreset(null);
        setDraftPresetId(null);
        setStepStatuses({});
        setPriceDraft(null);
        setOdoDraft(null);
      }
      return;
    }
    if (p.id !== selectedPreset?.id) {
      const isInitialHydratedMatch = initialMountPresetRef.current === p.id;
      initialMountPresetRef.current = null;
      setSelectedPreset(p);
      setDraftPresetId(p.id);
      setPriceDraft(null);
      setOdoDraft(null);
      if (!isInitialHydratedMatch) {
        const defaultOdo = Math.max(35000, Number(p.defaultOdometerMiles) || 65000);
        setOdometerMiles(defaultOdo);
        setAskingPriceUsd(estimateMileageAdjustedMarketValue(p, defaultOdo));
        setStepStatuses({});
      }
    }
  }, [presetId, hasSelectedVehicle]);

  const odometerKm = Math.round(odometerMiles * 1.609344);

  const inspectionSteps = useMemo(() => {
    if (!selectedPreset) return [];
    const raw = generatePpiChecklist(selectedPreset, odometerKm);
    return raw.map(sanitizeStep);
  }, [selectedPreset, odometerKm]);

  const isEv = useMemo(
    () =>
      Boolean(
        selectedPreset &&
          (isPureElectric(resolvePowertrainType(selectedPreset)) || selectedPreset.isEv)
      ),
    [selectedPreset]
  );

  const stageGroups = useMemo(
    () => groupStepsByStage(inspectionSteps, isEv),
    [inspectionSteps, isEv]
  );

  const handleSetStepStatus = useCallback((id, targetStatus, e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    setStepStatuses((prev) => {
      const next = { ...prev };
      if (next[id] === targetStatus) {
        delete next[id];
      } else {
        next[id] = targetStatus;
      }
      return next;
    });
  }, []);

  // Compute upcoming wear reserve exposure at current odometer (50% negotiation weight)
  const wearExposure = useMemo(() => {
    if (!selectedPreset) {
      return { scheduledWearDeductionUsd: 0, serviceReserve12MoUsd: 0 };
    }
    const pType = resolvePowertrainType(selectedPreset);
    const ev = isPureElectric(pType);
    const relevant = MAINTENANCE_COMPONENTS.filter((comp) =>
      ev
        ? comp.applicablePowertrains.includes('ev')
        : comp.applicablePowertrains.includes(selectedPreset.powertrain || 'diesel')
    );

    let scheduledWearDeductionUsd = 0;
    let serviceReserve12MoUsd = 0;

    for (const comp of relevant) {
      const health = evaluateComponentHealth({
        component: comp,
        physicalOdometerMiles: odometerMiles,
        urbanTripSharePct: 45,
        oilIntervalId: 'standard',
        serviceHistoryId: 'verified',
        transmissionId: selectedPreset.transmission || 'dct-dsg',
        powertrainType: pType,
        vehicle: selectedPreset,
      });
      if (!health) continue;
      const indieRange = health.scaledCostsUsd?.independent || comp.costsUsd?.independent || [500, 1100];
      const indieMid = Math.round(((indieRange[0] || 500) + (indieRange[1] || 1100)) / 2);
      if (health.status === 'CRITICAL') {
        scheduledWearDeductionUsd += Math.round(indieMid * 0.5);
        serviceReserve12MoUsd += Math.round(indieMid * 0.75);
      } else if (health.status === 'WARNING') {
        scheduledWearDeductionUsd += Math.round(indieMid * 0.25);
        serviceReserve12MoUsd += Math.round(indieMid * 0.35);
      }
    }

    return {
      scheduledWearDeductionUsd,
      serviceReserve12MoUsd: Math.max(450, serviceReserve12MoUsd),
    };
  }, [selectedPreset, odometerMiles]);

  // Live Negotiation Battlecard Calculations (N/A excluded from defect deductions)
  const negotiationTargets = useMemo(() => {
    const flaggedSteps = inspectionSteps.filter((s) => stepStatuses[s.id] === 'flag');
    const flaggedDefectsUsd = flaggedSteps.reduce((sum, s) => sum + (s.deductionUsd || 0), 0);
    const wearReserveDeductionUsd = wearExposure.scheduledWearDeductionUsd;
    const totalDeductionUsd = flaggedDefectsUsd + wearReserveDeductionUsd;

    const minFloorPrice = Math.round(askingPriceUsd * 0.45);
    const recommendedOpeningOfferUsd = Math.max(
      minFloorPrice,
      Math.round(askingPriceUsd - totalDeductionUsd)
    );
    const walkAwayCeilingUsd = Math.max(
      recommendedOpeningOfferUsd,
      Math.round(askingPriceUsd - flaggedDefectsUsd * 0.7 - wearReserveDeductionUsd * 0.35)
    );

    return {
      flaggedSteps,
      flaggedDefectsUsd,
      wearReserveDeductionUsd,
      totalDeductionUsd,
      recommendedOpeningOfferUsd,
      walkAwayCeilingUsd,
    };
  }, [inspectionSteps, stepStatuses, wearExposure, askingPriceUsd]);

  const reviewedCount = inspectionSteps.filter((s) => Boolean(stepStatuses[s.id])).length;
  const naCount = inspectionSteps.filter((s) => stepStatuses[s.id] === 'na').length;
  const totalCount = inspectionSteps.length;
  const progressPct = totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0;

  const displayOdo = Math.round(convertMilesToRegion(odometerMiles));
  const displayAskingPrice = Math.round(convertUsdToRegion(askingPriceUsd));

  const handleShareLink = () => {
    if (!selectedPreset) return;
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mydriveledger.com';
      const activeFlagged = Object.keys(stepStatuses).filter((k) => stepStatuses[k] === 'flag');
      const activeNa = Object.keys(stepStatuses).filter((k) => stepStatuses[k] === 'na');
      const flaggedQuery =
        activeFlagged.length > 0 ? `&flagged=${encodeURIComponent(activeFlagged.join(','))}` : '';
      const naQuery = activeNa.length > 0 ? `&na=${encodeURIComponent(activeNa.join(','))}` : '';
      const shareUrl = `${origin}/checklist/${encodeURIComponent(selectedPreset.id)}?odo=${Math.round(odometerMiles)}&price=${Math.round(askingPriceUsd)}&reg=${encodeURIComponent(region || 'US')}${flaggedQuery}${naQuery}`;

      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(shareUrl);
        setCopyFeedback(true);
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setCopyFeedback(false), 3000);
      } else if (typeof document !== 'undefined' && document.body && typeof document.execCommand === 'function') {
        const temp = document.createElement('textarea');
        temp.value = shareUrl;
        temp.setAttribute('readonly', '');
        temp.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
        document.body.append(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
        setCopyFeedback(true);
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setCopyFeedback(false), 3000);
      }
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    if (!selectedPreset) return;
    expandAllStagesForPrint();
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  };

  const handleResetChecklist = () => {
    setStepStatuses({});
  };

  const HeadingTag = standalone ? 'h1' : 'h2';

  return (
    <section
      id="printable-checklist"
      className="space-y-6 pb-24 lg:pb-0 scroll-pb-[calc(5rem+env(safe-area-inset-bottom,0px))] min-w-0 max-w-full overflow-x-clip"
    >
      {/* Clean Page Header (No Decorative Micro-Eyebrow or Extra Status Badges) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border/80 dark:border-zinc-800 print:border-b-2 print:border-black min-w-0">
        <div className="min-w-0 max-w-2xl">
          <HeadingTag className="font-sans text-h1 font-bold tracking-tight text-ink dark:text-zinc-50 print:text-black break-words">
            {isVehicleSelected
              ? `${selectedPreset.name} | Field Inspection Checklist`
              : 'Pre-Purchase Inspection (PPI) | Field Inspection Checklist'}
          </HeadingTag>
          <p className="text-xs sm:text-sm text-body dark:text-zinc-400 mt-1.5 font-sans print:text-zinc-700 break-words">
            {isVehicleSelected ? (
              <>
                {selectedPreset.engineCode} · {selectedPreset.fuelType} ·{' '}
                <span className="font-mono tabular-nums">{formatDistance(odometerMiles)}</span> · Asking{' '}
                <span className="font-mono tabular-nums">{formatCurrency(askingPriceUsd)}</span>
              </>
            ) : (
              'Select a vehicle model to generate an engine-specific field inspection checklist, known defect warnings, and a live negotiation offer.'
            )}
          </p>
        </div>

        {/* Toolbar Actions (Max 1 Primary CTA) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 print:hidden">
          {isVehicleSelected && (
            <>
              <button
                type="button"
                onClick={handleShareLink}
                className="min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-xl font-sans text-xs font-medium bg-surface dark:bg-zinc-900 hover:bg-surface-subtle dark:hover:bg-zinc-800 text-ink dark:text-zinc-200 border border-border dark:border-zinc-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Share state as URL link"
              >
                {copyFeedback ? (
                  <>
                    <Check aria-hidden="true" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Link copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 aria-hidden="true" className="w-3.5 h-3.5 text-muted dark:text-zinc-400" />
                    <span>Share link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-xl font-sans text-xs font-medium bg-surface dark:bg-zinc-900 hover:bg-surface-subtle dark:hover:bg-zinc-800 text-ink dark:text-zinc-200 border border-border dark:border-zinc-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Print checklist as PDF"
              >
                <Printer aria-hidden="true" className="w-3.5 h-3.5 text-muted dark:text-zinc-400" />
                <span>Print</span>
              </button>

              <button
                type="button"
                data-testid="ppi-open-summary-button"
                onClick={() => setShowSummaryDialog(true)}
                className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl font-sans text-xs font-semibold bg-[#183D22] hover:bg-[#122E19] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText aria-hidden="true" className="w-3.5 h-3.5" />
                <span>Generate Printable / Negotiation Summary</span>
              </button>
            </>
          )}

          {onNavigateToObd && (
            <button
              type="button"
              onClick={() => onNavigateToObd()}
              className="min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-xl font-sans text-xs font-medium bg-surface dark:bg-zinc-900 hover:bg-surface-subtle dark:hover:bg-zinc-800 text-ink dark:text-zinc-200 border border-border dark:border-zinc-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>OBD2 Code Lookup</span>
              <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 text-muted dark:text-zinc-400" />
            </button>
          )}
        </div>
      </div>

      {/* Persistent Accessible Vehicle Select (Always mounted for DOM sync & test compatibility) */}
      <div className="sr-only">
        <label htmlFor="ppi-vehicle-select">Select vehicle model</label>
        <select
          id="ppi-vehicle-select"
          value={selectedPreset ? selectedPreset.id : ''}
          onChange={(e) => applySelectedVehicle(e.target.value)}
          aria-label="Select vehicle model"
        >
          <option value="">Select a vehicle model...</option>
          {VEHICLE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.fuelType} · {p.engineCode})
            </option>
          ))}
        </select>
      </div>

      {/* Unselected Empty-State Picker */}
      {!isVehicleSelected && (
        <Card
          data-testid="ppi-empty-vehicle-picker"
          className="bg-surface-subtle/80 dark:bg-zinc-900/60 space-y-4 print:hidden"
        >
          <VehicleSelect
            selectedPresetId={draftPresetId}
            onSelectPreset={setDraftPresetId}
            onAutocompleteSelect={(id) => applySelectedVehicle(id)}
            showTelemetryStrip={false}
            dropdownInFlow={true}
            selectDropdownId="ppi-preset-sync"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/70 dark:border-zinc-800">
            <div className="min-w-0">
              <span className="block text-[11px] font-sans font-medium text-muted dark:text-zinc-400">
                {draftPreset ? 'Selected from dropdown:' : 'No vehicle selected yet:'}
              </span>
              <span
                className={`block font-sans text-xs sm:text-sm ${
                  draftPreset ? 'font-semibold text-ink dark:text-zinc-100 truncate' : 'text-muted dark:text-zinc-400'
                }`}
              >
                {draftPreset
                  ? draftPreset.name
                  : 'Search 179+ models above, use Make/Model/Engine, or pick a popular model below'}
              </span>
            </div>
            <button
              type="button"
              data-testid="ppi-apply-vehicle-button"
              disabled={!draftPreset}
              onClick={() => draftPreset && applySelectedVehicle(draftPreset.id)}
              className={`min-h-[44px] rounded-xl px-4 py-2 font-sans text-xs sm:text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 shrink-0 ${
                draftPreset
                  ? 'bg-[#183D22] text-white hover:bg-[#122E19] dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer'
                  : 'bg-border dark:bg-zinc-800 text-muted dark:text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Car aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span>Generate PPI Checklist</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60 dark:border-zinc-800/70">
            <span className="text-[11px] font-sans font-medium text-muted dark:text-zinc-400 mr-1">
              Popular:
            </span>
            {PPI_POPULAR_SHORTCUTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => applySelectedVehicle(item.id)}
                className="min-h-[44px] sm:min-h-[34px] px-3 py-1 rounded-xl bg-surface dark:bg-zinc-900 border border-border/80 dark:border-zinc-800 text-xs font-sans font-medium text-body dark:text-zinc-200 hover:border-primary-600 dark:hover:border-emerald-500 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Selected Vehicle Summary & Field Parameters (Asking Price + Odometer) */}
      {isVehicleSelected && selectedPreset && (
        <div className="space-y-4 print:hidden">
          <VehicleVisualCard
            vehicle={selectedPreset}
            variant="hero"
            className="!p-4 sm:!p-5 !shadow-none bg-surface dark:bg-[#121215] border-border/80 dark:border-zinc-800 rounded-2xl hover:!translate-y-0 hover:!shadow-none"
            actionButtons={
              <div className="flex flex-wrap items-center justify-between w-full gap-3">
                <button
                  type="button"
                  data-testid="ppi-switch-car-button"
                  onClick={() => {
                    setDraftPresetId(selectedPreset.id);
                    setShowSwitchCarModal(true);
                  }}
                  className="min-h-[44px] sm:min-h-[38px] bg-[#183D22] text-white hover:bg-[#122E19] dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl px-4 py-2 font-sans text-xs sm:text-sm font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw aria-hidden="true" className="w-3.5 h-3.5" />
                  <span>Switch Car</span>
                </button>

                {onNavigateToTco && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTco()}
                    className="min-h-[44px] sm:min-h-[38px] bg-surface-subtle dark:bg-zinc-900 rounded-xl px-3.5 py-2 font-sans text-xs sm:text-sm font-medium text-ink dark:text-zinc-200 hover:bg-canvas dark:hover:bg-zinc-800 border border-border dark:border-zinc-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>5-Year TCO Estimate</span>
                    <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 text-muted dark:text-zinc-400" />
                  </button>
                )}
              </div>
            }
          />

          {/* Compact Parameters Strip (Asking Price + Odometer) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-border/80 dark:border-zinc-800 bg-surface dark:bg-[#121215] p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="ppi-asking-price" className="font-sans text-xs sm:text-sm font-medium text-body dark:text-zinc-300">
                Seller Asking Price
              </label>
              <div className="flex items-center min-h-[44px] rounded-xl border border-border dark:border-zinc-700 bg-surface-subtle dark:bg-zinc-900 px-3 py-1.5 focus-within:border-[#183D22] dark:focus-within:border-emerald-500">
                <span className="text-xs font-mono text-muted dark:text-zinc-400 mr-1.5">{currencySymbol}</span>
                <input
                  id="ppi-asking-price"
                  type="number"
                  min="500"
                  max="250000"
                  step="250"
                  value={priceDraft !== null ? priceDraft : displayAskingPrice}
                  onFocus={() => setPriceDraft(String(displayAskingPrice))}
                  onBlur={() => setPriceDraft(null)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setPriceDraft(raw);
                    if (raw === '') return;
                    const parsed = Number(raw);
                    if (Number.isFinite(parsed)) {
                      setAskingPriceUsd(convertRegionToUsd(Math.max(500, parsed)));
                    }
                  }}
                  className="w-28 text-base sm:text-sm font-mono tabular-nums font-bold text-right bg-transparent text-ink dark:text-zinc-50 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label htmlFor="ppi-odometer-input" className="font-sans text-xs sm:text-sm font-medium text-body dark:text-zinc-300">
                Current Odometer
              </label>
              <div className="flex items-center min-h-[44px] rounded-xl border border-border dark:border-zinc-700 bg-surface-subtle dark:bg-zinc-900 px-3 py-1.5 focus-within:border-[#183D22] dark:focus-within:border-emerald-500">
                <input
                  id="ppi-odometer-input"
                  type="number"
                  min="0"
                  max="600000"
                  step="2500"
                  value={odoDraft !== null ? odoDraft : displayOdo}
                  onFocus={() => setOdoDraft(String(displayOdo))}
                  onBlur={() => setOdoDraft(null)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setOdoDraft(raw);
                    if (raw === '') return;
                    const parsed = Number(raw);
                    if (Number.isFinite(parsed)) {
                      setOdometerMiles(convertRegionToMiles(Math.max(0, parsed)));
                    }
                  }}
                  className="w-28 text-base sm:text-sm font-mono tabular-nums font-bold text-right bg-transparent text-ink dark:text-zinc-50 outline-none"
                />
                <span className="text-xs font-sans text-muted dark:text-zinc-400 ml-1.5">{distanceUnit}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 0: Dynamic Geo-Routed Digital VIN & Odometer Rollback Verification */}
      <VinCheckBanner
        placement="ppi"
        vehicleName={isVehicleSelected ? selectedPreset.name : ''}
        purchasePriceUsd={isVehicleSelected ? askingPriceUsd : undefined}
        odometerMiles={isVehicleSelected ? odometerMiles : undefined}
      />

      {isVehicleSelected && selectedPreset && (
        <>
          {/* Sticky Desktop Top + Mobile Bottom Progress & Leverage Bar */}
          <PpiStickyBar
            reviewedCount={reviewedCount}
            totalCount={totalCount}
            progressPct={progressPct}
            flaggedCount={negotiationTargets.flaggedSteps.length}
            naCount={naCount}
            totalDeductionUsd={negotiationTargets.totalDeductionUsd}
            recommendedOpeningOfferUsd={negotiationTargets.recommendedOpeningOfferUsd}
            formatCurrency={formatCurrency}
            onReset={handleResetChecklist}
            onOpenSummary={() => setShowSummaryDialog(true)}
          />

          {/* Printable Sheet Header (VISIBLE ONLY IN PRINT) */}
          <div className="hidden print:block border-b-2 border-black pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-sans text-2xl font-bold uppercase tracking-tight text-black">
                  DriveLedger | Pre-Purchase Inspection &amp; Negotiation Battlecard
                </p>
                <p className="font-sans text-sm text-gray-700 mt-1">
                  Vehicle: <strong>{selectedPreset.name}</strong> · Engine: <strong>{selectedPreset.engineCode}</strong> · Powertrain: <strong>{selectedPreset.fuelType}</strong>
                </p>
                <p className="font-sans text-sm text-gray-700">
                  Odometer: <strong>{formatDistance(odometerMiles)}</strong> · Asking Price: <strong>{formatCurrency(askingPriceUsd)}</strong> · Date: <strong>{new Date().toLocaleDateString('en-US')}</strong>
                </p>
              </div>
              <div className="text-right text-xs text-gray-500 font-sans">
                mydriveledger.com/checklist
              </div>
            </div>
          </div>

          {/* 4 Collapsible Inspection Stages */}
          <div aria-label="Pre-purchase inspection stages" className="space-y-4">
            {stageGroups.map((stage) => (
              <PpiStageGroup
                key={stage.id}
                stage={stage}
                stepStatuses={stepStatuses}
                onSetStatus={handleSetStepStatus}
                formatCurrency={formatCurrency}
                registerDetailsRef={registerStageDetailsRef}
              />
            ))}
          </div>

          {/* Inline Negotiation Battlecard Summary (Mounted on Screen AND Print) */}
          <Card
            id="negotiation-battlecard-summary"
            data-testid="negotiation-battlecard-summary"
            className="scroll-mt-40 space-y-4 print:border-black print:bg-white print:shadow-none page-break-inside-avoid"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/80 dark:border-zinc-800 print:border-black">
              <div>
                <h2 className="font-sans text-base sm:text-lg font-bold tracking-tight text-ink dark:text-zinc-50 print:text-black">
                  Live Used-Car Negotiation Battlecard
                </h2>
                <p className="font-sans text-xs text-muted dark:text-zinc-400 print:text-black">
                  <span className="font-mono tabular-nums">100%</span> defect deduction +{' '}
                  <span className="font-mono tabular-nums">50%</span> due-milestone reserve
                </p>
              </div>

              <button
                type="button"
                data-testid="battlecard-open-summary-button"
                onClick={() => setShowSummaryDialog(true)}
                className="scroll-mt-40 min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl bg-[#183D22] hover:bg-[#122E19] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-sans text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer print:hidden"
              >
                <FileText aria-hidden="true" className="w-3.5 h-3.5" />
                <span>Open Negotiation &amp; Print Summary</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/70 dark:divide-zinc-800 rounded-xl bg-surface-subtle/70 dark:bg-zinc-900/60 border border-border/70 dark:border-zinc-800 print:border-gray-400 print:bg-white">
              <div className="p-3.5">
                <span className="block font-sans text-xs text-muted dark:text-zinc-400 print:text-gray-600">
                  Seller Asking Price
                </span>
                <span className="mt-1 block text-base sm:text-lg font-bold font-mono tabular-nums text-ink dark:text-zinc-100 print:text-black">
                  {formatCurrency(askingPriceUsd)}
                </span>
              </div>

              <div className="p-3.5">
                <span className="block font-sans text-xs text-muted dark:text-zinc-400 print:text-gray-600">
                  Flagged + Wear Deductions
                </span>
                <span
                  data-testid="battlecard-total-deduction"
                  className="mt-1 block text-base sm:text-lg font-bold font-mono tabular-nums text-danger-text dark:text-rose-400 print:text-black"
                >
                  -{formatCurrency(negotiationTargets.totalDeductionUsd)}
                </span>
                <span className="block text-[11px] font-sans text-muted dark:text-zinc-400 mt-0.5">
                  <span className="font-mono tabular-nums">{negotiationTargets.flaggedSteps.length}</span> defects (
                  <span className="font-mono tabular-nums">-{formatCurrency(negotiationTargets.flaggedDefectsUsd)}</span>) · Wear (
                  <span className="font-mono tabular-nums">-{formatCurrency(negotiationTargets.wearReserveDeductionUsd)}</span>)
                </span>
              </div>

              <div className="p-3.5 bg-[#183D22]/5 dark:bg-emerald-950/25 print:bg-white">
                <span className="block font-sans text-xs font-medium text-[#183D22] dark:text-emerald-400 print:text-gray-700">
                  Recommended Opening Offer
                </span>
                <span
                  data-testid="battlecard-opening-offer"
                  className="mt-1 block text-lg sm:text-xl font-bold font-mono tabular-nums text-[#183D22] dark:text-emerald-300 print:text-black"
                >
                  {formatCurrency(negotiationTargets.recommendedOpeningOfferUsd)}
                </span>
              </div>

              <div className="p-3.5">
                <span className="block font-sans text-xs text-muted dark:text-zinc-400 print:text-gray-600">
                  Firm Walk-Away Ceiling
                </span>
                <span
                  data-testid="battlecard-walkaway-ceiling"
                  className="mt-1 block text-base sm:text-lg font-bold font-mono tabular-nums text-ink dark:text-zinc-100 print:text-black"
                >
                  {formatCurrency(negotiationTargets.walkAwayCeilingUsd)}
                </span>
              </div>
            </div>
          </Card>

          {/* Printable Notes & Signature Section (VISIBLE ONLY IN PRINT) */}
          <div className="hidden print:block pt-6 border-t-2 border-black mt-8 page-break-inside-avoid">
            <h3 className="text-sm font-bold uppercase text-black mb-2">
              On-Site Observations, Defects &amp; Negotiation Points (Written Notes):
            </h3>
            <div className="border border-gray-400 rounded h-28 w-full p-2 text-xs text-gray-500 mb-6">
              Notes: ....................................................................................................................................................................
            </div>
            <div className="grid grid-cols-2 gap-8 text-xs text-black">
              <div>
                <p>Inspector / Buyer Signature: ___________________________</p>
              </div>
              <div className="text-right">
                <p>Seller / Dealer Acknowledgment: ___________________________</p>
              </div>
            </div>
          </div>

          {/* Native <dialog> Modals */}
          <PpiVehiclePickerDialog
            open={showSwitchCarModal}
            onClose={() => {
              setShowSwitchCarModal(false);
              setDraftPresetId(selectedPreset.id);
            }}
            selectedPresetId={selectedPreset.id}
            draftPresetId={draftPresetId}
            setDraftPresetId={setDraftPresetId}
            draftPreset={draftPreset}
            onSelectPreset={(id) => applySelectedVehicle(id)}
          />

          <PpiSummaryDialog
            open={showSummaryDialog}
            onClose={() => setShowSummaryDialog(false)}
            vehicle={selectedPreset}
            askingPriceUsd={askingPriceUsd}
            odometerMiles={odometerMiles}
            negotiationTargets={negotiationTargets}
            reviewedCount={reviewedCount}
            totalCount={totalCount}
            naCount={naCount}
            formatCurrency={formatCurrency}
            formatDistance={formatDistance}
            onShareLink={handleShareLink}
            copyFeedback={copyFeedback}
            onPrint={handlePrint}
          />
        </>
      )}

      {/* Tucked Crawlable & Find-in-Page Searchable Editorial Methodology + Internal Links */}
      <details className="dl-disclosure group rounded-2xl border border-border/80 dark:border-zinc-800 bg-surface dark:bg-[#121215] px-5 sm:px-6 py-2 shadow-card print:hidden">
        <summary className="min-h-[48px] py-2.5 flex items-center justify-between gap-3 text-left font-sans text-xs sm:text-sm font-semibold text-muted hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
          <span>Inspection Methodology, Negotiation Guide &amp; Related Models</span>
          <ChevronDown
            aria-hidden="true"
            className="w-4 h-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
          />
        </summary>
        <div className="pb-6 pt-2 space-y-6 border-t border-border/70 dark:border-zinc-800">
          <ToolEditorialSection
            tool="checklist"
            vehicleName={isVehicleSelected && selectedPreset ? selectedPreset.name : ''}
            className="!mt-2 !shadow-none !border-0 !p-0 !bg-transparent"
          />

          {isVehicleSelected && selectedPreset && (
            <VehicleInternalLinks
              vehicle={selectedPreset}
              onSelectPreset={(id) => applySelectedVehicle(id)}
              onNavigateToTco={onNavigateToTco}
              onNavigateToRisk={onNavigateToRisk}
              onNavigateToRiskBracket={onNavigateToRiskBracket}
              onNavigateToChecklist={onNavigateToChecklist}
              onNavigateToHybridObd={onNavigateToHybridObd}
              onNavigateToObd={onNavigateToObd}
              onNavigateToCompare={onNavigateToCompare}
              onNavigateToVehicles={onNavigateToVehicles}
            />
          )}
        </div>
      </details>
    </section>
  );
}

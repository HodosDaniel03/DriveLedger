import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  CircleCheck,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  Car,
  ChevronDown,
} from 'lucide-react';
import {
  OBD_CODES,
  LABOR_RATE_TIERS,
  calculateObdWorkshopEstimate,
  buildObdCodeSummary,
} from '../../data/obdCodes';
import { VEHICLE_PRESETS } from '../../data/vehiclePresets';
import { getHybridVehicleObdContext, isObdCompatibleWithVehicle } from '../../data/seoMatrixData';
import { useUnits } from '../../context/UnitContext';
import {
  Card,
  PageHeader,
  Pill,
  Segmented,
  InfoTooltip,
  MobileStickySummaryBar,
  Collapse,
} from '../common/OdometerPrimitives';
import { buildAffiliateUrl } from '../../config/monetizationConfig';
import TopTabAffiliateBanner from '../monetization/TopTabAffiliateBanner';
import ToolEditorialSection from '../seo/ToolEditorialSection';
import VehicleInternalLinks from '../seo/VehicleInternalLinks';
import LivePidEvaluator from './LivePidEvaluator';
import FixOrSellCalculator from './FixOrSellCalculator';
import ObdVehiclePickerDialog from './obd/ObdVehiclePickerDialog';
import ObdMobileBottomSheet from './obd/ObdMobileBottomSheet';

const QUICK_CODES = ['P0420', 'P2002', 'P0171', 'P0300', 'P0299', 'P0401', 'P0128', 'P0700'];

const OBD_QUICK_VEHICLES = [
  { id: 'vw-golf-20-tdi', label: 'VW Golf 2.0 TDI' },
  { id: 'ford-focus-ecoblue', label: 'Ford Focus EcoBlue' },
  { id: 'toyota-camry-hybrid', label: 'Toyota Camry Hybrid' },
  { id: 'bmw-320d-b47', label: 'BMW 320d B47' },
  { id: 'tesla-model-3-lr', label: 'Tesla Model 3 LR' },
];

const OBD_DEEPDIVE_TABS = [
  { id: 'causes', label: 'Root Causes' },
  { id: 'telemetry', label: 'Live PID Check' },
  { id: 'diy', label: 'DIY Inspection' },
  { id: 'negotiation', label: 'Workshop Tips' },
];

const CODE_LABELS = {
  P0420: 'Catalytic converter',
  P2002: 'DPF filter',
  P0171: 'System too lean',
  P0300: 'Random misfire',
  P0299: 'Turbo underboost',
  P0401: 'EGR insufficient flow',
  P0128: 'Coolant thermostat',
  P0700: 'Transmission control',
  P0A80: 'HV battery pack',
  U0100: 'ECM/PCM CAN bus',
};

const OBD_CATEGORIES = [
  'All Systems',
  'Emissions & Exhaust',
  'Forced Induction & Air',
  'Fuel & Air Induction',
  'Engine Mechanical & Ignition',
  'Transmission & Drivetrain',
  'Cooling & Thermal',
  'Hybrid & Network Telemetry',
];

export const SYMPTOM_FILTERS = [
  { id: 'smoke', label: 'Black Smoke / DPF', codes: ['P2002', 'P2463', 'P0299', 'P0401'] },
  { id: 'dpf-light', label: 'DPF Warning Light', codes: ['P2002', 'P2463', 'P20EE'] },
  { id: 'limp', label: 'Limp Mode / Reduced Power', codes: ['P0299', 'P2002', 'P0087', 'P0700', 'P2015'] },
  { id: 'misfire', label: 'Engine Sputter / Misfire', codes: ['P0300', 'P0301', 'P0171', 'P0101'] },
  { id: 'start', label: 'Hard Cold Start', codes: ['P0087', 'P0113', 'P0016'] },
  { id: 'overheat', label: 'Overheating / Thermostat', codes: ['P0128'] },
  { id: 'trans', label: 'Transmission Jerking', codes: ['P0700', 'U0100'] },
  { id: 'smell', label: 'Sulfur / Rotten Egg', codes: ['P0420'] },
];

export default function ObdEstimator({
  selectedObdCode,
  selectedCode,
  onSelectObdCode,
  onSelectCode,
  selectedPresetId,
  hasSelectedVehicle = Boolean(selectedPresetId),
  onSelectPreset,
  onNavigateToTco,
  onNavigateToRisk,
  onNavigateToRiskBracket,
  onNavigateToChecklist,
  onNavigateToHybridObd,
  onNavigateToCompare,
  onNavigateToVehicles,
}) {
  const { region, formatCurrency } = useUnits();

  const [localPresetId, setLocalPresetId] = useState(() =>
    hasSelectedVehicle && selectedPresetId && VEHICLE_PRESETS.some((p) => p.id === selectedPresetId)
      ? selectedPresetId
      : null
  );
  const resolvedDefaultCode = useMemo(() => {
    if (!localPresetId) return 'P0420';
    const presetObj = VEHICLE_PRESETS.find((p) => p.id === localPresetId);
    if (!presetObj) return 'P0420';
    const preferred = (presetObj.commonObdCodes || []).find((c) => isObdCompatibleWithVehicle(presetObj, c));
    if (preferred) return preferred;
    const firstCompat = OBD_CODES.find((c) => isObdCompatibleWithVehicle(presetObj, c));
    return firstCompat ? firstCompat.code : 'P0420';
  }, [localPresetId]);
  const activeCodeId = selectedObdCode || selectedCode || resolvedDefaultCode;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Systems');
  const [laborTierId, setLaborTierId] = useState('independent'); // 'independent' | 'dealership' | 'diy'
  const [selectedSymptom, setSelectedSymptom] = useState(null);
  const [liveVerdict, setLiveVerdict] = useState(null);
  const [showLivePids, setShowLivePids] = useState(false);
  const [expandedCause, setExpandedCause] = useState(null);
  const [activeDeepDiveTab, setActiveDeepDiveTab] = useState('causes');
  const [showVehicleDialog, setShowVehicleDialog] = useState(false);
  const [draftPresetId, setDraftPresetId] = useState('');
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const tabRefs = useRef({});
  const panelRefs = useRef({});

  // Synchronize hidden="until-found" fallback when onbeforematch is unsupported + register beforematch listener
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (typeof HTMLElement !== 'undefined' && !('onbeforematch' in HTMLElement.prototype)) {
      for (const tab of OBD_DEEPDIVE_TABS) {
        const panelEl = panelRefs.current[tab.id] || document.getElementById(`obd-panel-${tab.id}`);
        if (!panelEl) continue;
        if (tab.id === activeDeepDiveTab) {
          if (typeof panelEl.removeAttribute === 'function') panelEl.removeAttribute('hidden');
        } else if (typeof panelEl.setAttribute === 'function') {
          panelEl.setAttribute('hidden', '');
        }
      }
      return undefined;
    }

    const cleanups = [];
    for (const tab of OBD_DEEPDIVE_TABS) {
      const panelEl = panelRefs.current[tab.id];
      if (!panelEl || typeof panelEl.addEventListener !== 'function') continue;
      const handleBeforeMatch = () => setActiveDeepDiveTab(tab.id);
      panelEl.addEventListener('beforematch', handleBeforeMatch);
      cleanups.push(() => {
        if (typeof panelEl.removeEventListener === 'function') {
          panelEl.removeEventListener('beforematch', handleBeforeMatch);
        }
      });
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [activeDeepDiveTab]);

  useEffect(() => {
    const activeTabEl = tabRefs.current[activeDeepDiveTab];
    if (activeTabEl && typeof activeTabEl.scrollIntoView === 'function') {
      try {
        activeTabEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      } catch {
        // Safe guard in older browsers / mock DOM
      }
    }
  }, [activeDeepDiveTab]);

  const handleDeepDiveTabKeyDown = (e, currentIndex) => {
    let nextIndex = null;
    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % OBD_DEEPDIVE_TABS.length;
    else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + OBD_DEEPDIVE_TABS.length) % OBD_DEEPDIVE_TABS.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = OBD_DEEPDIVE_TABS.length - 1;

    if (nextIndex === null) return;
    e.preventDefault();
    const nextTab = OBD_DEEPDIVE_TABS[nextIndex];
    setActiveDeepDiveTab(nextTab.id);
    const nextBtn = tabRefs.current[nextTab.id];
    if (nextBtn && typeof nextBtn.focus === 'function') {
      nextBtn.focus();
    }
  };

  useEffect(() => {
    if (selectedPresetId === undefined) return;
    const nextId =
      hasSelectedVehicle && selectedPresetId && VEHICLE_PRESETS.some((p) => p.id === selectedPresetId)
        ? selectedPresetId
        : null;
    if (nextId !== localPresetId) {
      setLocalPresetId(nextId);
    }
  }, [selectedPresetId, hasSelectedVehicle]);

  const handlePresetChange = (nextPresetId) => {
    const cleanId =
      nextPresetId && VEHICLE_PRESETS.some((p) => p.id === nextPresetId) ? nextPresetId : null;
    setLocalPresetId(cleanId);
    if (typeof onSelectPreset === 'function') {
      onSelectPreset(cleanId);
      return;
    }
    if (!cleanId) return;
    const nextPreset = VEHICLE_PRESETS.find((p) => p.id === cleanId);
    if (nextPreset && !isObdCompatibleWithVehicle(nextPreset, activeCodeId)) {
      const compatibleCommon = (nextPreset.commonObdCodes || []).find((c) =>
        isObdCompatibleWithVehicle(nextPreset, c)
      );
      const fallbackCode = compatibleCommon || (nextPreset.isEv ? 'U0100' : 'P0420');
      handleSelect(fallbackCode);
    }
  };

  const handleSelect = (code) => {
    if (typeof onSelectObdCode === 'function') onSelectObdCode(code);
    if (typeof onSelectCode === 'function' && onSelectCode !== onSelectObdCode) onSelectCode(code);
    setSearchQuery('');
  };

  // Active dossier & optional hybrid vehicle context (null when no vehicle is selected)
  const hybridContext = useMemo(() => {
    if (!localPresetId) return null;
    return getHybridVehicleObdContext(localPresetId, activeCodeId);
  }, [localPresetId, activeCodeId]);

  const activePreset = hybridContext ? hybridContext.preset : null;
  const isVehicleSelected = Boolean(activePreset);
  const draftPreset = useMemo(
    () => (draftPresetId ? VEHICLE_PRESETS.find((p) => p.id === draftPresetId) || null : null),
    [draftPresetId]
  );
  const activeDossier = useMemo(() => {
    if (hybridContext?.dossier) return hybridContext.dossier;
    const normalized = String(activeCodeId || 'P0420').toUpperCase();
    return OBD_CODES.find((c) => c.code === normalized) || OBD_CODES[0];
  }, [hybridContext, activeCodeId]);
  const isKnownVulnerability = Boolean(hybridContext?.isKnownWeakPoint);
  const codeSummary = useMemo(
    () => buildObdCodeSummary(activeDossier, activePreset || undefined),
    [activeDossier, activePreset]
  );

  // Workshop cost estimate + Independent/Dealership/DIY comparison (scaled by vehicle maintenanceWearFactor when selected)
  const est = useMemo(() => {
    return calculateObdWorkshopEstimate(activeDossier, laborTierId, { vehicle: activePreset || undefined });
  }, [activeDossier, laborTierId, activePreset]);

  const independentEst = useMemo(
    () => calculateObdWorkshopEstimate(activeDossier, 'independent', { vehicle: activePreset || undefined }),
    [activeDossier, activePreset]
  );
  const dealershipEst = useMemo(
    () => calculateObdWorkshopEstimate(activeDossier, 'dealership', { vehicle: activePreset || undefined }),
    [activeDossier, activePreset]
  );
  const diyEst = useMemo(
    () => calculateObdWorkshopEstimate(activeDossier, 'diy', { vehicle: activePreset || undefined }),
    [activeDossier, activePreset]
  );
  const diySavingsVsDealerUsd = Math.max(
    0,
    (dealershipEst?.weightedExpectedUsd || 0) - (diyEst?.weightedExpectedUsd || 0)
  );

  // Root-cause cost extremes for dynamic OBD2 scanner payback math (scaled by maintenanceWearFactor)
  const causeCostStats = useMemo(() => {
    const causes = activeDossier.rootCauses || [];
    const wearScale = Number(activePreset?.maintenanceWearFactor) || 1.0;
    if (!causes.length) {
      return { cheapestCauseUsd: 95, costliestCauseUsd: 1650, cheapCauseProbPct: 42 };
    }
    const priced = causes.map((rc) => {
      const pAvg = (((Number(rc.partsCostUsd?.[0]) || 0) + (Number(rc.partsCostUsd?.[1]) || 0)) / 2) * wearScale;
      const lAvg = (((Number(rc.laborHours?.[0]) || 0) + (Number(rc.laborHours?.[1]) || 0)) / 2) * wearScale;
      return {
        totalUsd: Math.max(35, Math.round(pAvg + lAvg * 115)),
        prob: Number(rc.probabilityPct) || 0,
      };
    });
    const sortedAsc = [...priced].sort((a, b) => a.totalUsd - b.totalUsd);
    return {
      cheapestCauseUsd: sortedAsc[0].totalUsd,
      costliestCauseUsd: sortedAsc[sortedAsc.length - 1].totalUsd,
      cheapCauseProbPct: sortedAsc[0].prob || 35,
    };
  }, [activeDossier, activePreset]);

  const effectiveLaborRate = est.rateUsdPerHr;

  // Search & category filter
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return OBD_CODES.filter((item) => {
      if (selectedCategory !== 'All Systems' && item.systemCategory !== selectedCategory) {
        return false;
      }
      const inCode = item.code.toLowerCase().includes(q);
      const inTitle = item.title.toLowerCase().includes(q);
      const inSymptoms = (item.symptoms || []).some((s) => s.toLowerCase().includes(q));
      const inCauses = (item.rootCauses || []).some((rc) => rc.cause.toLowerCase().includes(q));
      return inCode || inTitle || inSymptoms || inCauses;
    });
  }, [searchQuery, selectedCategory]);

  const displayedQuickCodes = useMemo(() => {
    if (selectedCategory === 'All Systems') {
      return QUICK_CODES;
    }
    return OBD_CODES.filter((item) => item.systemCategory === selectedCategory).map((item) => item.code);
  }, [selectedCategory]);

  // Top 3 ranked root causes
  const topRootCauses = useMemo(() => {
    const sorted = [...(activeDossier.rootCauses || [])].sort(
      (a, b) => (b.probabilityPct || 0) - (a.probabilityPct || 0)
    );
    return sorted.slice(0, 4);
  }, [activeDossier]);

  // Split parts vs labor share: handle 0 labor rate (DIY) and zero parts cost cleanly
  const totalWeightedCost = Math.max(0, (est.weightedPartsUsd || 0) + (est.weightedLaborUsd || 0));
  const partsShare = totalWeightedCost > 0
    ? Math.min(100, Math.max(0, Math.round(((est.weightedPartsUsd || 0) / totalWeightedCost) * 100)))
    : ((est.weightedPartsUsd || 0) > 0 ? 100 : 0);
  const laborShare = totalWeightedCost > 0 ? 100 - partsShare : 0;

  // Severity pill mapping
  const severityTone =
    activeDossier.severity?.includes('CRITICAL') ? 'risk' :
    activeDossier.severity?.includes('HIGH') ? 'warn' : 'good';

  const severityLabel =
    activeDossier.severity?.includes('CRITICAL') ? 'Critical: Stop Driving' :
    activeDossier.severity?.includes('HIGH') ? 'Limp Mode Risk: Service Soon' :
    'Safe for Short Trips';

  const sevUpper = String(activeDossier.severity || '').toUpperCase();
  const drivabilityTone = sevUpper.includes('CRITICAL')
    ? 'risk'
    : sevUpper.includes('HIGH')
    ? 'warn'
    : 'good';

  const drivabilityLabel = sevUpper.includes('CRITICAL')
    ? 'Do Not Drive'
    : sevUpper.includes('HIGH')
    ? 'Service Within 2 Weeks'
    : 'Safe to Drive';

  const drivabilityGuidance = sevUpper.includes('CRITICAL')
    ? 'No. Stop driving immediately to prevent permanent engine or catalyst destruction.'
    : sevUpper.includes('HIGH')
    ? 'Avoid high load and highway driving. Service within 1–2 weeks to prevent limp mode.'
    : 'Yes, short-term. Repair within 1–2 months to pass emissions testing and avoid component wear.';

  const scannerCtaProps = useMemo(() => {
    return buildAffiliateUrl('obd-scanner', {
      activeCode: activeDossier.code,
      vehicleName: activePreset?.name || '',
      region,
      skipPlaceholder: true,
    });
  }, [activeDossier.code, activePreset?.name, region]);

  const activeSymptomObj = selectedSymptom
    ? SYMPTOM_FILTERS.find((s) => s.id === selectedSymptom) || null
    : null;

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 lg:pb-0 scroll-pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
      <PageHeader
        className="!mb-0 max-w-none"
        title="Check engine light cost estimator"
        subtitle="Enter any fault code to see the real culprit, verified labor hours, and fair workshop pricing."
      />

      {/* Always-mounted accessible vehicle preset selector synced with ObdVehiclePickerDialog */}
      <div className="sr-only">
        <label htmlFor="obd-preset-select">
          Select vehicle powertrain for OBD-II telemetry correlation
        </label>
        <select
          id="obd-preset-select"
          aria-label="Select vehicle powertrain for OBD-II telemetry correlation"
          value={activePreset ? activePreset.id : ''}
          onChange={(e) => handlePresetChange(e.target.value)}
        >
          <option value="">No specific vehicle (Generic OBD-II estimate)</option>
          {VEHICLE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.engineCode})
            </option>
          ))}
        </select>
      </div>

      {/* 1. Front-and-Center DTC Code + Vehicle Search Bar */}
      <Card className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (searchMatches[0]) handleSelect(searchMatches[0].code);
            }}
            className="relative flex-1 min-w-0"
          >
            <label htmlFor="code-search" className="sr-only">
              Search fault code or symptom
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 w-5 h-5 -translate-y-1/2 text-muted dark:text-zinc-400"
            />
            <input
              id="code-search"
              type="search"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code or symptom (e.g. P0420, P2002, misfire)..."
              className="h-12 sm:h-14 w-full rounded-xl border border-border-strong dark:border-zinc-800 bg-surface dark:bg-zinc-900 pr-24 pl-12 font-sans text-base sm:text-sm text-ink dark:text-zinc-50 placeholder:text-faint dark:placeholder:text-zinc-500 focus-visible:border-primary-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600/30 shadow-xs scroll-mt-28 lg:scroll-mt-32"
            />
            <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1.5">
              <span className="font-mono tabular-nums font-bold text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-1 rounded-md">
                {activeDossier.code}
              </span>
            </div>
          </form>

          {/* Single Unified Vehicle Picker Trigger (<dialog>) + Clear Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="obd-switch-vehicle-button"
              onClick={() => {
                setDraftPresetId(localPresetId || '');
                setShowVehicleDialog(true);
              }}
              className="min-h-[44px] sm:h-14 flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl border border-border dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900 px-4 py-2 font-sans text-xs sm:text-sm font-semibold text-ink dark:text-zinc-100 hover:border-border-strong dark:hover:border-zinc-700 transition-colors cursor-pointer"
            >
              <Car aria-hidden="true" className="w-4 h-4 text-primary-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate max-w-[14rem]">
                {activePreset ? activePreset.shortName || activePreset.name : 'Select vehicle (optional)'}
              </span>
            </button>
            {isVehicleSelected && (
              <button
                type="button"
                aria-label="Clear selected vehicle"
                onClick={() => handlePresetChange('')}
                className="min-h-[44px] sm:h-14 inline-flex items-center justify-center rounded-xl border border-border dark:border-zinc-800 bg-surface dark:bg-[#121215] px-3.5 py-2 font-sans text-xs font-medium text-muted hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-surface-subtle dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Instant Autocomplete Results */}
        {searchQuery.trim() && (
          <div
            className="rounded-xl border border-border dark:border-zinc-800 bg-surface dark:bg-zinc-900 overflow-hidden shadow-card"
            aria-live="polite"
          >
            {searchMatches.length > 0 ? (
              <ul className="divide-y divide-border/80 dark:divide-zinc-800 max-h-64 overflow-y-auto">
                {searchMatches.map((m) => (
                  <li key={m.code}>
                    <button
                      type="button"
                      onClick={() => handleSelect(m.code)}
                      className="min-h-[44px] flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-surface-subtle dark:hover:bg-zinc-800/60 focus-visible:bg-surface-subtle dark:focus-visible:bg-zinc-800/60 focus-visible:outline-none transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-bold tabular-nums text-primary-600 dark:text-emerald-400 font-mono text-base shrink-0">
                          {m.code}
                        </span>
                        <span className="font-sans text-ink dark:text-zinc-50 font-medium truncate">
                          {m.title}
                        </span>
                      </div>
                      <span className="text-xs text-muted dark:text-zinc-400 font-sans font-medium shrink-0 hidden sm:inline">
                        {m.systemCategory || m.category}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 font-sans text-sm text-muted dark:text-zinc-400">
                No matching fault code found for &ldquo;{searchQuery}&rdquo;. Try searching &ldquo;P0420&rdquo; or &ldquo;misfire&rdquo;.
              </p>
            )}
          </div>
        )}

        {/* System Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {OBD_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-xl font-sans font-medium whitespace-nowrap transition-colors duration-150 border shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40 font-semibold'
                    : 'bg-surface dark:bg-zinc-900 text-body dark:text-zinc-300 border-border/80 dark:border-zinc-800 hover:border-border-strong dark:hover:border-zinc-700 hover:text-ink dark:hover:text-zinc-50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Symptom Quick Filters */}
        <div className="pt-3 border-t border-border/80 dark:border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted dark:text-zinc-400 font-sans">
              Filter by symptom
            </span>
            {selectedSymptom && (
              <button
                type="button"
                onClick={() => setSelectedSymptom(null)}
                className="min-h-[36px] px-2 text-xs font-sans font-medium text-primary-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Reset filter
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SYMPTOM_FILTERS.map((sf) => {
              const isActive = selectedSymptom === sf.id;
              return (
                <button
                  key={sf.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSelectedSymptom(isActive ? null : sf.id)}
                  className={`min-h-[44px] sm:min-h-[34px] px-3 py-1.5 rounded-xl font-sans text-xs font-medium transition-colors duration-150 border cursor-pointer ${
                    isActive
                      ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500'
                      : 'bg-surface-subtle dark:bg-zinc-900 text-body dark:text-zinc-300 border-border/80 dark:border-zinc-800 hover:border-border-strong dark:hover:border-zinc-700 hover:text-ink dark:hover:text-zinc-50'
                  }`}
                >
                  {sf.label}
                </button>
              );
            })}
          </div>

          {activeSymptomObj && (
            <div className="mt-2 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 text-xs">
              <p className="font-sans font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
                Likely codes for {activeSymptomObj.label}:
              </p>
              <div className="flex flex-wrap gap-2">
                {activeSymptomObj.codes.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`min-h-[44px] sm:min-h-[34px] px-3 py-1.5 rounded-xl font-mono tabular-nums text-xs font-bold border transition-colors cursor-pointer ${
                      c === activeDossier.code
                        ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500'
                        : 'bg-surface dark:bg-zinc-900 text-ink dark:text-zinc-100 border-border dark:border-zinc-700 hover:bg-surface-subtle dark:hover:bg-zinc-800'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Popular Diagnostic Fault Chips (>= 44px mobile targets) */}
        <div className="pt-2">
          <span className="font-sans text-xs font-medium text-muted dark:text-zinc-400 block mb-2">
            {selectedCategory === 'All Systems' ? 'Popular fault codes:' : `${selectedCategory} fault codes:`}
          </span>
          <div className="flex flex-wrap gap-2">
            {displayedQuickCodes.map((c) => {
              const active = c === activeDossier.code;
              const isKnownForVehicle = Boolean(
                activePreset && Array.isArray(activePreset.commonObdCodes) && activePreset.commonObdCodes.includes(c)
              );
              const codeObj = OBD_CODES.find((item) => item.code === c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelect(c)}
                  title={isKnownForVehicle && activePreset ? `Known weak point on ${activePreset.name}` : codeObj?.title}
                  className={`min-h-[44px] sm:min-h-[36px] inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'border-[#183D22] bg-[#183D22] text-white dark:bg-emerald-600 dark:border-emerald-500'
                      : isKnownForVehicle
                      ? 'border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:border-amber-300'
                      : 'border-border/80 dark:border-zinc-800 bg-surface dark:bg-zinc-900 text-body dark:text-zinc-300 hover:border-border-strong dark:hover:border-zinc-700 hover:text-ink dark:hover:text-zinc-50'
                  }`}
                >
                  <span className="font-semibold tabular-nums font-mono">{c}</span>
                  <span className="font-sans text-[11px] opacity-85">
                    {CODE_LABELS[c] || codeObj?.title?.split(':')[0] || ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Concise Vehicle Correlation Footer (replaces heavy stacked telemetry banner card) */}
        <div
          id="obd-vehicle-telemetry-banner"
          className="pt-4 border-t border-border/80 dark:border-zinc-800 space-y-3 min-w-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="hybrid-vehicle-obd-heading"
              className="font-sans text-sm sm:text-base font-semibold tracking-tight text-ink dark:text-zinc-50 break-words"
            >
              {isVehicleSelected && activePreset ? `${activePreset.name} · ` : ''}
              <span className="font-mono tabular-nums">{activeDossier.code}</span> {activeDossier.title}
            </h2>

            {isVehicleSelected ? (
              isKnownVulnerability ? (
                <Pill tone="risk">KNOWN POWERTRAIN VULNERABILITY</Pill>
              ) : (
                <Pill tone="neutral">POWERTRAIN DIAGNOSTIC PROFILE</Pill>
              )
            ) : (
              <Pill tone="neutral">GENERIC SAE J1979 PROFILE</Pill>
            )}
          </div>

          {isVehicleSelected && activePreset ? (
            <div className="rounded-xl bg-surface-subtle dark:bg-zinc-900 p-3.5 space-y-2.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="font-sans text-body dark:text-zinc-300 leading-relaxed">
                  <strong className="font-semibold text-ink dark:text-zinc-100">{activePreset.engineCode}:</strong>{' '}
                  {activePreset.knownRiskNotes}
                </p>
                <span className="font-mono tabular-nums font-semibold text-ink dark:text-zinc-100 shrink-0">
                  {formatCurrency(activePreset.baseAnnualMaintenanceUsd)}/yr baseline
                </span>
              </div>

              {activePreset.commonObdCodes && activePreset.commonObdCodes.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/70 dark:border-zinc-800">
                  <span className="font-sans text-muted dark:text-zinc-400 font-medium mr-1">
                    Known model faults:
                  </span>
                  {activePreset.commonObdCodes
                    .filter((c) => isObdCompatibleWithVehicle(activePreset, c))
                    .map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleSelect(c)}
                        className={`min-h-[36px] sm:min-h-[30px] px-2.5 py-1 rounded-lg font-mono tabular-nums text-xs font-semibold border transition-colors cursor-pointer ${
                          c === activeDossier.code
                            ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500'
                            : 'bg-surface dark:bg-zinc-800 text-ink dark:text-zinc-200 border-border dark:border-zinc-700 hover:border-emerald-500'
                        }`}
                      >
                        DTC {c}
                      </button>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div
              data-testid="obd-no-vehicle-prompt"
              className="rounded-xl bg-surface-subtle dark:bg-zinc-900 p-3 text-xs font-sans text-muted dark:text-zinc-400"
            >
              Showing universal SAE J1979 workshop benchmarks. Use <strong className="text-ink dark:text-zinc-200">Select vehicle</strong> above to calibrate parts &amp; labor for your engine.
            </div>
          )}
        </div>
      </Card>

      {/* 2. Crisp 3-Metric Verdict Strip (Calm Surface, No Hover Lift) */}
      <section
        data-testid="obd-verdict-strip"
        aria-label="Diagnostic Verdict Summary"
        className="cq-card rounded-2xl border border-border/80 dark:border-zinc-800 bg-surface dark:bg-[#121215] shadow-card dark:shadow-none overflow-hidden"
      >
        <div className="px-4 sm:px-6 py-3 border-b border-border/70 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="font-mono text-base sm:text-lg font-bold tabular-nums text-ink dark:text-zinc-50">
              {activeDossier.code}
            </span>
            <span className="font-sans text-sm font-semibold text-ink dark:text-zinc-100 truncate">
              {activeDossier.title}
            </span>
            <span className="rounded-md bg-surface-subtle dark:bg-zinc-900 px-2 py-0.5 text-xs font-sans text-muted dark:text-zinc-400">
              {codeSummary.systemCategory}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('code-search');
                if (el) {
                  el.focus();
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="min-h-[44px] sm:min-h-[34px] inline-flex items-center gap-1.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 px-3 py-1.5 font-sans text-xs font-medium text-ink dark:text-zinc-200 hover:bg-canvas dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <RotateCcw aria-hidden="true" className="w-3.5 h-3.5 text-muted dark:text-zinc-400" />
              <span>Change code</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard && typeof window !== 'undefined') {
                  navigator.clipboard.writeText(window.location.href);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }
              }}
              className="min-h-[44px] sm:min-h-[34px] inline-flex items-center gap-1.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 px-3 py-1.5 font-sans text-xs font-medium text-ink dark:text-zinc-200 hover:bg-canvas dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <span>{copiedLink ? 'Copied' : 'Share ↗'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/70 dark:divide-zinc-800">
          {/* Metric 1: Severity / Safe to Drive */}
          <div className="p-4 sm:px-6 sm:py-5 space-y-1.5 min-w-0">
            <span className="block font-sans text-xs font-medium text-muted dark:text-zinc-400">
              Severity &amp; Safe to Drive
            </span>
            <div className="flex items-center gap-2">
              <span
                data-testid="obd-drivability-status-badge"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans font-semibold border ${
                  drivabilityTone === 'good'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/40'
                    : drivabilityTone === 'warn'
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/40'
                    : 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/40'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    drivabilityTone === 'good'
                      ? 'bg-emerald-500'
                      : drivabilityTone === 'warn'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
                <span>{drivabilityLabel}</span>
              </span>
            </div>
            <p className="font-sans text-xs text-muted dark:text-zinc-400 truncate">
              Subsystem: {codeSummary.subsystem}
            </p>
          </div>

          {/* Metric 2: Fair Independent Quote Range */}
          <div className="p-4 sm:px-6 sm:py-5 space-y-1 min-w-0">
            <span className="block font-sans text-xs font-medium text-muted dark:text-zinc-400">
              Fair Independent Quote
            </span>
            <div className="font-mono text-lg sm:text-xl font-bold tabular-nums text-ink dark:text-zinc-50">
              {formatCurrency(independentEst.minTotalUsd)} – {formatCurrency(independentEst.maxTotalUsd)}
            </div>
            <p className="font-sans text-xs text-muted dark:text-zinc-400">
              Expected avg{' '}
              <span className="font-mono tabular-nums font-semibold text-ink dark:text-zinc-200">
                {formatCurrency(independentEst.weightedExpectedUsd)}
              </span>{' '}
              · {formatCurrency(115)}/hr
            </p>
          </div>

          {/* Metric 3: Dealership Quote Range */}
          <div className="p-4 sm:px-6 sm:py-5 space-y-1 min-w-0">
            <span className="block font-sans text-xs font-medium text-muted dark:text-zinc-400">
              Dealership Quote
            </span>
            <div className="font-mono text-lg sm:text-xl font-bold tabular-nums text-ink dark:text-zinc-50">
              {formatCurrency(dealershipEst.minTotalUsd)} – {formatCurrency(dealershipEst.maxTotalUsd)}
            </div>
            <p className="font-sans text-xs text-muted dark:text-zinc-400">
              OEM book{' '}
              <span className="font-mono tabular-nums font-semibold text-ink dark:text-zinc-200">
                {activeDossier.laborHoursRange
                  ? `${activeDossier.laborHoursRange[0]}–${activeDossier.laborHoursRange[1]} hrs`
                  : '1.5–3.0 hrs'}
              </span>
              {diySavingsVsDealerUsd > 0 && (
                <> · DIY saves <span className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(diySavingsVsDealerUsd)}</span></>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Workspace Split: 7 cols Tabbed Deep-Dives / 5 cols Sticky Workshop Summary */}
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8 items-start min-w-0">
        {/* Left Column: 7 cols */}
        <div className="lg:col-span-7 min-w-0">
          <Card className="p-0 overflow-hidden">
            {/* Concise Diagnostic Overview */}
            <div className="px-5 sm:px-6 pt-5 pb-4">
              <p className="font-sans text-sm text-body dark:text-zinc-300 leading-relaxed">
                {codeSummary.description}
              </p>
            </div>

            {/* Single-Row Accessible Tablist */}
            <div
              role="tablist"
              aria-label="Diagnostic deep dives"
              className="px-5 sm:px-6 flex items-center overflow-x-auto no-scrollbar border-b border-border/80 dark:border-zinc-800 gap-0 sm:gap-1"
            >
              {OBD_DEEPDIVE_TABS.map((tab, idx) => {
                const selected = activeDeepDiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      tabRefs.current[tab.id] = el;
                    }}
                    id={`obd-tab-${tab.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActiveDeepDiveTab(tab.id)}
                    onKeyDown={(e) => handleDeepDiveTabKeyDown(e, idx)}
                    className="dl-hub-tab cursor-pointer"
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Panels Container (Zero padding/border/margin/gap on [role="tabpanel"] itself) */}
            <div id="obd-deepdive-panels">
              {/* Panel 1: Root Causes */}
              <div
                ref={(el) => {
                  panelRefs.current.causes = el;
                }}
                role="tabpanel"
                id="obd-panel-causes"
                aria-labelledby="obd-tab-causes"
                {...(activeDeepDiveTab !== 'causes' ? { hidden: 'until-found' } : {})}
              >
                <div className="p-5 sm:p-6 space-y-5" aria-labelledby="causes-heading">
                  <div>
                    <h3
                      id="causes-heading"
                      className="font-sans text-lg font-bold tracking-tight text-ink dark:text-zinc-50 scroll-mt-28 lg:scroll-mt-32"
                    >
                      Most likely root causes
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-muted dark:text-zinc-400 mt-0.5">
                      Statistical probability breakdown based on workshop diagnostic tickets.
                    </p>
                  </div>

                  <ol className="divide-y divide-border/80 dark:divide-zinc-800">
                    {topRootCauses.map((c, i) => {
                      const wearScale = Number(activePreset?.maintenanceWearFactor) || 1.0;
                      const p0 = Math.max(0, Number(c.partsCostUsd?.[0]) || 0) * wearScale;
                      const p1 = Math.max(p0, (Number(c.partsCostUsd?.[1]) || 0) * wearScale);
                      const activeTierObj =
                        LABOR_RATE_TIERS.find((t) => t.id === laborTierId) || LABOR_RATE_TIERS[1];
                      const markup =
                        activeTierObj?.partsMarkupFactor ??
                        (laborTierId === 'dealership' ? 1.25 : laborTierId === 'diy' ? 0.85 : 1.0);
                      const avgPart = ((p0 + p1) / 2) * markup;

                      const h0 = Math.max(0, Number(c.laborHours?.[0]) || 0);
                      const h1 = Math.max(h0, Number(c.laborHours?.[1]) || h0);
                      const rate =
                        activeTierObj?.rateUsdPerHr ??
                        (laborTierId === 'dealership' ? 185 : laborTierId === 'diy' ? 0 : 115);
                      const avgLabor = ((h0 + h1) / 2) * rate * wearScale;
                      const estimatedCulpritCost = Math.max(0, Math.round(avgPart + avgLabor));
                      const isExpanded = expandedCause === i;

                      return (
                        <li key={c.cause} className="py-3 first:pt-0 last:pb-0">
                          <button
                            type="button"
                            onClick={() => setExpandedCause(isExpanded ? null : i)}
                            aria-expanded={isExpanded}
                            className="min-h-[44px] w-full flex items-center justify-between gap-3 text-left py-1.5 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors group cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="shrink-0 font-bold font-mono tabular-nums text-primary-600 dark:text-emerald-400 text-sm">
                                {i + 1}.
                              </span>
                              <span className="font-sans text-ink dark:text-zinc-50 font-medium text-sm group-hover:text-primary-600 dark:group-hover:text-emerald-400 truncate">
                                {c.cause}
                              </span>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="inline-flex items-center rounded-md bg-surface-subtle dark:bg-zinc-800/80 text-body dark:text-zinc-300 px-2 py-0.5 text-xs font-mono font-bold tabular-nums">
                                {c.probabilityPct}%
                              </span>
                              <span className="font-mono font-semibold text-sm text-primary-600 dark:text-emerald-400 tabular-nums">
                                {formatCurrency(estimatedCulpritCost)}
                              </span>
                              <ChevronDown
                                aria-hidden="true"
                                className={`w-4 h-4 text-muted dark:text-zinc-400 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180 text-primary-600 dark:text-emerald-400' : ''
                                }`}
                              />
                            </div>
                          </button>

                          <Collapse open={isExpanded} id={`root-cause-detail-${i}`}>
                            <div className="pt-2 pb-1 space-y-2.5 text-xs">
                              <div className="h-2 overflow-hidden rounded-full bg-surface-subtle dark:bg-zinc-800">
                                <div
                                  className="h-full rounded-full bg-primary-600 dark:bg-emerald-500 transition-[width] duration-200 ease-out"
                                  style={{ width: `${c.probabilityPct}%` }}
                                />
                              </div>

                              <div className="flex flex-wrap items-center justify-between font-sans text-muted dark:text-zinc-400 gap-2">
                                <span>
                                  Parts:{' '}
                                  <span className="font-mono tabular-nums text-ink dark:text-zinc-200">
                                    {formatCurrency(Math.round(p0 * markup))}–{formatCurrency(Math.round(p1 * markup))}
                                  </span>{' '}
                                  · Labour:{' '}
                                  <span className="font-mono tabular-nums text-ink dark:text-zinc-200">
                                    {c.laborHours[0]}–{c.laborHours[1]}
                                  </span>{' '}
                                  hrs
                                </span>
                              </div>

                              {c.componentNote && (
                                <p className="font-sans text-body dark:text-zinc-300 leading-relaxed bg-surface-subtle dark:bg-zinc-900 p-3 rounded-xl">
                                  {c.componentNote}
                                </p>
                              )}
                            </div>
                          </Collapse>
                        </li>
                      );
                    })}
                  </ol>

                  {activeDossier.symptoms && activeDossier.symptoms.length > 0 && (
                    <details className="dl-disclosure group pt-3 border-t border-border/70 dark:border-zinc-800">
                      <summary className="min-h-[44px] py-2 flex items-center justify-between gap-3 text-left font-sans text-xs sm:text-sm font-semibold text-ink dark:text-zinc-100 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors">
                        <span>Common symptoms ({activeDossier.symptoms.length})</span>
                        <ChevronDown
                          aria-hidden="true"
                          className="w-4 h-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
                        />
                      </summary>
                      <ul className="pt-2 pb-1 space-y-2 font-sans text-xs sm:text-sm text-body dark:text-zinc-300">
                        {activeDossier.symptoms.map((sym, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CircleCheck
                              aria-hidden="true"
                              className="w-4 h-4 text-primary-600 dark:text-emerald-400 shrink-0 mt-0.5"
                            />
                            <span>{sym}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>

              {/* Panel 2: Live PID Check */}
              <div
                ref={(el) => {
                  panelRefs.current.telemetry = el;
                }}
                role="tabpanel"
                id="obd-panel-telemetry"
                aria-labelledby="obd-tab-telemetry"
                {...(activeDeepDiveTab !== 'telemetry' ? { hidden: 'until-found' } : {})}
              >
                <div className="p-5 sm:p-6 space-y-5" aria-labelledby="telemetry-check-heading">
                  <div>
                    <h3
                      id="telemetry-check-heading"
                      className="font-sans text-lg font-bold tracking-tight text-ink dark:text-zinc-50 scroll-mt-28 lg:scroll-mt-32"
                    >
                      What to check before replacing expensive parts (First-Principles Live Telemetry Check)
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-muted dark:text-zinc-400 mt-0.5">
                      Targeted sensor verification checklist to avoid premature replacement of costly assemblies.
                    </p>
                  </div>

                  {activeDossier.liveTelemetryCheck && (
                    <div className="space-y-4 font-sans text-sm text-body dark:text-zinc-300">
                      <div>
                        <p className="text-xs font-semibold text-ink dark:text-zinc-100 mb-2 font-sans inline-flex items-center gap-1.5">
                          <span>Target PIDs to monitor</span>
                          <InfoTooltip
                            label="What are OBD-II PIDs?"
                            content="Parameter IDs (PIDs) are live sensor streams from your car's ECU (e.g., fuel trims, DPF soot differential pressure, or O2 voltage). Checking these before replacing parts prevents costly misdiagnosis."
                          />
                        </p>
                        <ul className="divide-y divide-border/70 dark:divide-zinc-800 rounded-xl bg-surface-subtle/70 dark:bg-zinc-900/60 px-3.5 text-xs">
                          {activeDossier.liveTelemetryCheck.pidsToMonitor.map((pid) => (
                            <li key={pid} className="flex items-center gap-2.5 py-2.5">
                              <CircleCheck
                                aria-hidden="true"
                                className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                              />
                              <span className="font-mono font-semibold text-ink dark:text-zinc-200">{pid}</span>
                              <span className="font-sans text-muted dark:text-zinc-400 ml-auto shrink-0">
                                Live Feed
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Progressive Disclosure Toggle & Scanner CTA */}
                  <div className="pt-4 border-t border-border/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      data-testid="live-pid-toggle"
                      onClick={() => setShowLivePids(!showLivePids)}
                      aria-expanded={showLivePids}
                      className="min-h-[44px] inline-flex items-center gap-2 font-sans text-xs sm:text-sm font-semibold text-primary-600 dark:text-emerald-400 hover:text-primary-700 dark:hover:text-emerald-300 transition-colors cursor-pointer text-left"
                    >
                      <span>Have an OBD-II scanner? Enter live sensor readings {showLivePids ? '▴' : '▾'}</span>
                    </button>

                    <a
                      href={scannerCtaProps.href}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      className="min-h-[44px] inline-flex items-center gap-1 font-sans text-xs font-semibold text-body dark:text-zinc-300 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <span>Don&apos;t have a scanner yet? Read live fault codes &amp; DPF data from your phone →</span>
                    </a>
                  </div>

                  <Collapse open={showLivePids} id="live-telemetry-sliders-collapse">
                    <LivePidEvaluator
                      activeDossier={activeDossier}
                      workshopRate={effectiveLaborRate}
                      laborTierId={laborTierId}
                      onVerdictChange={setLiveVerdict}
                    />
                  </Collapse>
                </div>
              </div>

              {/* Panel 3: DIY Inspection Steps */}
              <div
                ref={(el) => {
                  panelRefs.current.diy = el;
                }}
                role="tabpanel"
                id="obd-panel-diy"
                aria-labelledby="obd-tab-diy"
                {...(activeDeepDiveTab !== 'diy' ? { hidden: 'until-found' } : {})}
              >
                <div className="p-5 sm:p-6 space-y-5">
                  <div>
                    <h3 className="font-sans text-lg font-bold tracking-tight text-ink dark:text-zinc-50">
                      DIY &amp; Bench Inspection Steps
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-muted dark:text-zinc-400 mt-0.5">
                      First-principles checks to rule out low-cost sensor or wiring faults before ordering assemblies.
                    </p>
                  </div>

                  {activeDossier.liveTelemetryCheck?.baselineValues && (
                    <div className="rounded-xl bg-surface-subtle dark:bg-zinc-900 p-4 space-y-1.5">
                      <span className="block font-sans text-xs font-semibold text-ink dark:text-zinc-100">
                        Healthy OEM Baseline Targets
                      </span>
                      <p className="font-sans text-xs sm:text-sm leading-relaxed text-body dark:text-zinc-300">
                        {activeDossier.liveTelemetryCheck.baselineValues}
                      </p>
                    </div>
                  )}

                  {activeDossier.liveTelemetryCheck?.diagnosticProtocol && (
                    <div className="space-y-1.5">
                      <span className="block font-sans text-xs font-semibold text-ink dark:text-zinc-100">
                        Step-by-Step Verification Protocol
                      </span>
                      <p className="font-sans text-xs sm:text-sm leading-relaxed text-body dark:text-zinc-300">
                        {activeDossier.liveTelemetryCheck.diagnosticProtocol}
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl bg-surface-subtle dark:bg-zinc-900 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="block font-sans text-xs font-semibold text-ink dark:text-zinc-100">
                        DIY Garage Parts-Only Benchmark
                      </span>
                      <p className="font-sans text-xs text-muted dark:text-zinc-400">
                        Cheapest likely culprit ({causeCostStats.cheapCauseProbPct}% probability) averages{' '}
                        <span className="font-mono tabular-nums font-semibold text-ink dark:text-zinc-200">
                          {formatCurrency(causeCostStats.cheapestCauseUsd)}
                        </span>{' '}
                        vs.{' '}
                        <span className="font-mono tabular-nums font-semibold text-ink dark:text-zinc-200">
                          {formatCurrency(causeCostStats.costliestCauseUsd)}
                        </span>{' '}
                        full assembly.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDeepDiveTab('telemetry');
                        setShowLivePids(true);
                      }}
                      className="min-h-[44px] sm:min-h-[38px] shrink-0 rounded-xl bg-[#183D22] dark:bg-emerald-600 text-white px-4 py-2 font-sans text-xs font-semibold hover:bg-[#122E19] dark:hover:bg-emerald-500 transition-colors cursor-pointer"
                    >
                      Open Live PID Sliders
                    </button>
                  </div>
                </div>
              </div>

              {/* Panel 4: Workshop Negotiation Tips */}
              <div
                ref={(el) => {
                  panelRefs.current.negotiation = el;
                }}
                role="tabpanel"
                id="obd-panel-negotiation"
                aria-labelledby="obd-tab-negotiation"
                {...(activeDeepDiveTab !== 'negotiation' ? { hidden: 'until-found' } : {})}
              >
                <div className="p-5 sm:p-6 space-y-5">
                  <div>
                    <h3 className="font-sans text-lg font-bold tracking-tight text-ink dark:text-zinc-50">
                      Workshop Negotiation &amp; Cost Guardrails
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-muted dark:text-zinc-400 mt-0.5">
                      Verify OEM book labor hours and demand live diagnostic freeze-frame proof before approving parts.
                    </p>
                  </div>

                  {activeDossier.liveTelemetryCheck?.costTrapWarning && (
                    <div className="rounded-xl border-l-4 border-l-amber-500 bg-amber-50/70 dark:bg-amber-950/30 p-4 font-sans text-xs sm:text-sm text-amber-900 dark:text-amber-300 leading-relaxed flex items-start gap-2.5">
                      <AlertTriangle aria-hidden="true" className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold">Cost Trap Warning:</strong>{' '}
                        {activeDossier.liveTelemetryCheck.costTrapWarning}
                      </div>
                    </div>
                  )}

                  <div className="divide-y divide-border/70 dark:divide-zinc-800 rounded-xl bg-surface-subtle/70 dark:bg-zinc-900/60 px-4 text-xs sm:text-sm">
                    <div className="flex items-center justify-between py-3 gap-3">
                      <span className="font-sans text-muted dark:text-zinc-400">Independent Specialist Benchmark</span>
                      <span className="font-mono font-semibold tabular-nums text-ink dark:text-zinc-100">
                        {formatCurrency(independentEst.minTotalUsd)} – {formatCurrency(independentEst.maxTotalUsd)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 gap-3">
                      <span className="font-sans text-muted dark:text-zinc-400">Main Dealership Benchmark</span>
                      <span className="font-mono font-semibold tabular-nums text-ink dark:text-zinc-100">
                        {formatCurrency(dealershipEst.minTotalUsd)} – {formatCurrency(dealershipEst.maxTotalUsd)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 gap-3">
                      <span className="font-sans text-muted dark:text-zinc-400">OEM Flat-Rate Book Time</span>
                      <span className="font-mono font-semibold tabular-nums text-ink dark:text-zinc-100">
                        {activeDossier.laborHoursRange
                          ? `${activeDossier.laborHoursRange[0]}–${activeDossier.laborHoursRange[1]} hrs`
                          : '1.5–3.0 hrs'}
                      </span>
                    </div>
                  </div>

                  {/* Cross-Module Powertrain Wear Check */}
                  <div className="pt-3 border-t border-border/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-sans text-xs font-semibold text-ink dark:text-zinc-100">
                        <ShieldAlert aria-hidden="true" className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Powertrain Component Wear Check</span>
                      </div>
                      <p className="font-sans text-xs text-muted dark:text-zinc-400">
                        Fault <span className="font-mono tabular-nums font-semibold">{activeDossier.code}</span> correlates with wear on {codeSummary.subsystem}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateToRisk && onNavigateToRisk(activePreset ? activePreset.id : undefined)}
                      className="min-h-[44px] sm:min-h-[38px] shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900 px-3.5 py-2 font-sans text-xs font-semibold text-primary-600 dark:text-emerald-400 hover:bg-canvas dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <span>Open Risk Matrix</span>
                      <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: 5 cols Sticky Workshop Cost Summary */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 lg:[top:5.25rem] min-w-0">
          <Card className="h-fit p-5 sm:p-6" aria-labelledby="workshop-summary-heading">
            {/* H2 Title as direct child of summary Card (preserves parentNode guidance assertions) */}
            <h2
              id="workshop-summary-heading"
              className="font-sans text-lg font-bold tracking-tight text-ink dark:text-zinc-50 scroll-mt-28 lg:scroll-mt-32"
            >
              {activeDossier.code} WORKSHOP COST SUMMARY
            </h2>

            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
              <p className="font-sans text-xs text-muted dark:text-zinc-400 min-w-0">
                {activeDossier.title}
              </p>
              <Pill tone={drivabilityTone} className="shrink-0">
                {drivabilityLabel}
              </Pill>
            </div>

            {/* Drivability Guidance (direct child alongside #workshop-summary-heading) */}
            <div className="mt-4 p-3.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 space-y-1.5">
              <span className="font-sans text-xs font-semibold text-ink dark:text-zinc-100 block">
                Can I keep driving?
              </span>
              <p className="font-sans text-xs text-body dark:text-zinc-300 leading-relaxed">
                {drivabilityGuidance}
              </p>
              <div className="pt-2 flex items-center justify-between text-xs text-muted dark:text-zinc-400 border-t border-border/70 dark:border-zinc-800">
                <span>OEM Book Time</span>
                <span className="font-mono tabular-nums font-semibold text-ink dark:text-zinc-200">
                  {activeDossier.laborHoursRange
                    ? `${activeDossier.laborHoursRange[0]}–${activeDossier.laborHoursRange[1]} hrs`
                    : '1.5–3.0 hrs'}
                </span>
              </div>
            </div>

            {/* Headline Price Range */}
            <div className="my-5">
              <div className="text-metric-xl font-bold font-mono text-ink dark:text-zinc-50 tracking-tight tabular-nums leading-none">
                {formatCurrency(est.minTotalUsd)} – {formatCurrency(est.maxTotalUsd)}
              </div>
              <p className="mt-2 font-sans text-xs text-muted dark:text-zinc-400">
                Typical expected cost:{' '}
                <span className="font-semibold text-ink dark:text-zinc-100 font-mono tabular-nums">
                  {formatCurrency(est.weightedExpectedUsd)}
                </span>{' '}
                ({est.tierLabel})
              </p>

              {/* Dynamic Live Telemetry-Adjusted Repair Cost Callout */}
              {liveVerdict && (
                <div
                  id="summary-live-telemetry-verdict"
                  className="mt-3.5 p-3.5 rounded-xl bg-surface-subtle dark:bg-zinc-900 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-sans text-muted dark:text-zinc-400 font-semibold">
                      Expected Cost Range
                    </span>
                    <Pill tone={liveVerdict.tone} className="text-[11px] py-0 px-2">
                      {liveVerdict.badgeLabel}
                    </Pill>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
                    <span className="font-mono text-base font-bold tabular-nums text-primary-600 dark:text-emerald-400 min-w-0">
                      {formatCurrency(liveVerdict.narrowedMinUsd)} – {formatCurrency(liveVerdict.narrowedMaxUsd)}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-muted dark:text-zinc-400 shrink-0">
                      Est. avg: {formatCurrency(liveVerdict.narrowedExpectedUsd)}
                    </span>
                  </div>
                  <p
                    className="font-sans text-xs text-muted dark:text-zinc-400 truncate"
                    title={liveVerdict.primarySuspectCause}
                  >
                    Suspect:{' '}
                    <span className="font-medium text-ink dark:text-zinc-200">
                      {liveVerdict.primarySuspectCause}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Workshop Pricing Tier Switcher + DIY vs Dealership Savings Badge */}
            <div className="mb-5 space-y-2.5">
              <Segmented
                label="Workshop labor rate tier"
                value={laborTierId}
                onChange={setLaborTierId}
                options={[
                  { value: 'independent', label: 'Independent', hint: `${formatCurrency(115)}/hr` },
                  { value: 'dealership', label: 'Dealership', hint: `${formatCurrency(185)}/hr` },
                  { value: 'diy', label: 'DIY Garage', hint: `${formatCurrency(0)}/hr` },
                ]}
              />
              {diySavingsVsDealerUsd > 0 && (
                <div
                  data-testid="diy-vs-dealer-savings-badge"
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 text-xs font-sans font-medium"
                >
                  <span>
                    DIY Garage saves{' '}
                    <span className="font-mono tabular-nums font-bold">
                      {formatCurrency(diySavingsVsDealerUsd)}
                    </span>{' '}
                    vs. Dealership
                  </span>
                  <span className="font-mono tabular-nums opacity-85">
                    {formatCurrency(diyEst.weightedExpectedUsd)} vs {formatCurrency(dealershipEst.weightedExpectedUsd)}
                  </span>
                </div>
              )}
            </div>

            {/* Parts vs Labor Allocation (Hairline Divided, No Nested Boxes) */}
            <div>
              <div className="flex justify-between items-center font-sans text-xs text-muted dark:text-zinc-400 font-medium mb-1.5">
                <span>Cost allocation</span>
                <span>
                  <span className="font-mono tabular-nums">{partsShare}%</span> Parts /{' '}
                  <span className="font-mono tabular-nums">{100 - partsShare}%</span> Labor
                </span>
              </div>
              <div
                className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface-subtle dark:bg-zinc-800"
                aria-hidden="true"
              >
                <div
                  className="h-full bg-primary-600 dark:bg-emerald-500 transition-[width] duration-200 ease-out first:rounded-l-full"
                  style={{ width: `${partsShare}%` }}
                />
                <div className="h-full flex-1 bg-zinc-400 dark:bg-zinc-600 last:rounded-r-full" />
              </div>

              <dl className="mt-3.5 grid grid-cols-2 divide-x divide-border/70 dark:divide-zinc-800 pt-2 text-xs">
                <div className="pr-3">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span aria-hidden="true" className="w-2 h-2 rounded-sm bg-primary-600 dark:bg-emerald-500" />
                    <dt className="font-sans text-muted dark:text-zinc-400 font-medium">Parts</dt>
                  </div>
                  <dd className="font-semibold tabular-nums text-ink dark:text-zinc-50 font-mono text-sm">
                    {formatCurrency(est.weightedPartsUsd)}
                  </dd>
                </div>
                <div className="pl-3">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span aria-hidden="true" className="w-2 h-2 rounded-sm bg-zinc-400 dark:bg-zinc-600" />
                    <dt className="font-sans text-muted dark:text-zinc-400 font-medium">Labor</dt>
                  </div>
                  <dd className="font-semibold tabular-nums text-ink dark:text-zinc-50 font-mono text-sm">
                    {formatCurrency(est.weightedLaborUsd)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Single Calm Partner CTA */}
            <TopTabAffiliateBanner
              type="obd-scanner"
              vehicleName={activePreset ? activePreset.name : ''}
              activeCode={activeDossier.code}
              activeCodeTitle={activeDossier.title}
              cheapestCauseUsd={causeCostStats.cheapestCauseUsd}
              costliestCauseUsd={causeCostStats.costliestCauseUsd}
              cheapCauseProbPct={causeCostStats.cheapCauseProbPct}
              compact={true}
              className="mt-5"
            />
          </Card>
        </div>
      </div>

      {/* 4. Secondary Decision Engine & Editorial/SEO Links inside Native <details> Disclosures */}
      <details className="dl-disclosure group rounded-2xl border border-border/80 dark:border-zinc-800 bg-surface dark:bg-[#121215] px-5 sm:px-6 py-2 shadow-card dark:shadow-none">
        <summary className="min-h-[48px] py-2.5 flex items-center justify-between gap-3 text-left font-sans text-xs sm:text-sm font-semibold text-muted hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
          <span>Should I Fix It or Sell It? · Equity vs. Repair Decision Engine</span>
          <ChevronDown
            aria-hidden="true"
            className="w-4 h-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
          />
        </summary>
        <div className="pb-6 pt-3 border-t border-border/70 dark:border-zinc-800">
          <FixOrSellCalculator
            vehicle={activePreset || null}
            initialRepairQuoteUsd={liveVerdict ? liveVerdict.narrowedExpectedUsd : est.weightedExpectedUsd}
            initialOdometerMiles={activePreset?.defaultOdometerMiles || 75000}
            sourceLabel={`DTC ${activeDossier.code} Workshop Estimate`}
            onNavigateToCompare={onNavigateToCompare}
          />
        </div>
      </details>

      <details className="dl-disclosure group rounded-2xl border border-border/80 dark:border-zinc-800 bg-surface dark:bg-[#121215] px-5 sm:px-6 py-2 shadow-card dark:shadow-none">
        <summary className="min-h-[48px] py-2.5 flex items-center justify-between gap-3 text-left font-sans text-xs sm:text-sm font-semibold text-muted hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
          <span>Methodology, OBD-II FAQs &amp; Related Vehicle Dossiers</span>
          <ChevronDown
            aria-hidden="true"
            className="w-4 h-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
          />
        </summary>
        <div className="pb-6 pt-2 space-y-6 border-t border-border/70 dark:border-zinc-800">
          <ToolEditorialSection
            tool="obd"
            activeCode={activeDossier.code}
            vehicleName={activePreset ? activePreset.name : ''}
            className="!mt-2 !shadow-none !border-0 !p-0 !bg-transparent"
          />
          {isVehicleSelected && activePreset && (
            <VehicleInternalLinks
              vehicle={activePreset}
              onSelectPreset={handlePresetChange}
              onNavigateToTco={onNavigateToTco}
              onNavigateToRisk={onNavigateToRisk}
              onNavigateToRiskBracket={onNavigateToRiskBracket}
              onNavigateToChecklist={onNavigateToChecklist}
              onNavigateToCompare={onNavigateToCompare}
              onNavigateToHybridObd={
                onNavigateToHybridObd ||
                ((presetId, code) => {
                  handlePresetChange(presetId);
                  handleSelect(code);
                })
              }
              onNavigateToVehicles={onNavigateToVehicles}
            />
          )}
        </div>
      </details>

      {/* 5. Mobile Sticky Bottom Bar + Native <dialog> Bottom Sheet & Vehicle Picker */}
      <MobileStickySummaryBar
        label={`DTC ${activeDossier.code} · ${est.tierLabel}`}
        primaryValue={`${formatCurrency(est.minTotalUsd)}–${formatCurrency(est.maxTotalUsd)}`}
        secondaryValue={`Avg ${formatCurrency(est.weightedExpectedUsd)}`}
        badgeText={drivabilityLabel}
        actionLabel="Cost Summary"
        onAction={() => setShowMobileSheet(true)}
      />

      <ObdMobileBottomSheet
        open={showMobileSheet}
        onClose={() => setShowMobileSheet(false)}
        activeDossier={activeDossier}
        activePreset={activePreset}
        isVehicleSelected={isVehicleSelected}
        est={est}
        dealershipEst={dealershipEst}
        diyEst={diyEst}
        diySavingsVsDealerUsd={diySavingsVsDealerUsd}
        laborTierId={laborTierId}
        setLaborTierId={setLaborTierId}
        partsShare={partsShare}
        drivabilityTone={drivabilityTone}
        drivabilityLabel={drivabilityLabel}
        drivabilityGuidance={drivabilityGuidance}
        liveVerdict={liveVerdict}
        onOpenVehiclePicker={() => {
          setDraftPresetId(localPresetId || '');
          setShowVehicleDialog(true);
        }}
      />

      <ObdVehiclePickerDialog
        open={showVehicleDialog}
        onClose={() => setShowVehicleDialog(false)}
        selectedPresetId={localPresetId}
        draftPresetId={draftPresetId}
        setDraftPresetId={setDraftPresetId}
        draftPreset={draftPreset}
        onSelectPreset={handlePresetChange}
        quickVehicles={OBD_QUICK_VEHICLES}
      />
    </div>
  );
}

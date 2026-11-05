import React, { useState, useEffect, useMemo } from 'react';
import { Search, CircleCheck, Filter, Wrench, Shield, ArrowRight, RotateCcw, Info, Terminal, AlertTriangle, ShieldAlert, Car } from 'lucide-react';
import {
  OBD_CODES,
  LABOR_RATE_TIERS,
  calculateObdWorkshopEstimate,
} from '../../data/obdCodes';
import { VEHICLE_PRESETS } from '../../data/vehiclePresets';
import { getHybridVehicleObdContext } from '../../data/seoMatrixData';
import { useUnits } from '../../context/UnitContext';
import { Card, PageHeader, Pill, Segmented, PartnerCard, SeverityGauge, TldrVerdictBox, RiskBadge } from '../common/OdometerPrimitives';
import TopTabAffiliateBanner from '../monetization/TopTabAffiliateBanner';
import AdUnit from '../monetization/AdUnit';
import LivePidEvaluator from './LivePidEvaluator';
import FixOrSellCalculator from './FixOrSellCalculator';
import { REGIONAL_PARTNER_URLS } from '../../data/affiliatePartners';

const QUICK_CODES = ['P0420', 'P2002', 'P0171', 'P0300', 'P0299', 'P0401', 'P0128', 'P0700'];

const CODE_LABELS = {
  P0420: 'Catalytic converter',
  P2002: 'DPF filter',
  P0171: 'System too lean',
  P0300: 'Random misfire',
  P0299: 'Turbo underboost',
  P0401: 'EGR insufficient flow',
  P0128: 'Coolant thermostat',
  P0700: 'Transmission control',
};

const OBD_CATEGORIES = [
  'All Systems',
  'Emissions & Exhaust',
  'Forced Induction & Air',
  'Fuel & Air Induction',
  'Engine Mechanical & Ignition',
  'Transmission & Drivetrain',
  'Cooling & Thermal',
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
  onSelectPreset,
  onNavigateToRisk,
  onNavigateToCompare,
}) {
  const activeCodeId = selectedObdCode || selectedCode || 'P2002';
  const { region, formatCurrency } = useUnits();

  const [localPresetId, setLocalPresetId] = useState(
    selectedPresetId || VEHICLE_PRESETS[0].id
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Systems');
  const [laborTierId, setLaborTierId] = useState('independent'); // 'independent' | 'dealership' | 'diy'
  const [selectedSymptom, setSelectedSymptom] = useState(null);
  const [liveVerdict, setLiveVerdict] = useState(null);

  useEffect(() => {
    if (selectedPresetId && selectedPresetId !== localPresetId) {
      setLocalPresetId(selectedPresetId);
    }
  }, [selectedPresetId]);

  const handlePresetChange = (nextPresetId) => {
    setLocalPresetId(nextPresetId);
    if (typeof onSelectPreset === 'function') {
      onSelectPreset(nextPresetId);
    }
  };

  const handleSelect = (code) => {
    if (typeof onSelectObdCode === 'function') onSelectObdCode(code);
    if (typeof onSelectCode === 'function') onSelectCode(code);
    setSearchQuery('');
  };

  // Active dossier & hybrid vehicle context
  const hybridContext = useMemo(() => {
    return getHybridVehicleObdContext(localPresetId, activeCodeId);
  }, [localPresetId, activeCodeId]);

  const activePreset = hybridContext.preset;
  const activeDossier = hybridContext.dossier;
  const isKnownVulnerability = hybridContext.isKnownWeakPoint;

  // Workshop cost estimate + DIY vs Dealership savings comparison
  const est = useMemo(() => {
    return calculateObdWorkshopEstimate(activeDossier, laborTierId);
  }, [activeDossier, laborTierId]);

  const dealershipEst = useMemo(
    () => calculateObdWorkshopEstimate(activeDossier, 'dealership'),
    [activeDossier]
  );
  const diyEst = useMemo(
    () => calculateObdWorkshopEstimate(activeDossier, 'diy'),
    [activeDossier]
  );
  const diySavingsVsDealerUsd = Math.max(
    0,
    (dealershipEst?.weightedExpectedUsd || 0) - (diyEst?.weightedExpectedUsd || 0)
  );

  // Root-cause cost extremes for dynamic OBD2 scanner payback math
  const causeCostStats = useMemo(() => {
    const causes = activeDossier.rootCauses || [];
    if (!causes.length) {
      return { cheapestCauseUsd: 95, costliestCauseUsd: 1650, cheapCauseProbPct: 42 };
    }
    const priced = causes.map((rc) => {
      const pAvg = ((Number(rc.partsCostUsd?.[0]) || 0) + (Number(rc.partsCostUsd?.[1]) || 0)) / 2;
      const lAvg = ((Number(rc.laborHours?.[0]) || 0) + (Number(rc.laborHours?.[1]) || 0)) / 2;
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
  }, [activeDossier]);

  const effectiveLaborRate = est.rateUsdPerHr;

  // Search filter
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return OBD_CODES.filter((item) => {
      const inCode = item.code.toLowerCase().includes(q);
      const inTitle = item.title.toLowerCase().includes(q);
      const inSymptoms = (item.symptoms || []).some((s) => s.toLowerCase().includes(q));
      const inCauses = (item.rootCauses || []).some((rc) => rc.cause.toLowerCase().includes(q));
      return inCode || inTitle || inSymptoms || inCauses;
    });
  }, [searchQuery]);

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
    activeDossier.severity?.includes('CRITICAL') ? 'Critical — Stop Driving' :
    activeDossier.severity?.includes('HIGH') ? 'Limp Mode Risk — Service Soon' :
    'Safe for Short Trips';

  const obdTldrFacts = useMemo(() => [
    {
      label: 'Estimated Workshop Cost',
      value: `${formatCurrency(est.minTotalUsd)} – ${formatCurrency(est.maxTotalUsd)}`,
      subtext: `Typical expected expense: ${formatCurrency(est.weightedExpectedUsd)} (${est.tierLabel}).`,
      badge: (
        <RiskBadge
          level={est.weightedExpectedUsd > 1200 ? 'critical' : est.weightedExpectedUsd > 500 ? 'moderate' : 'low'}
          label={est.tierLabel}
        />
      ),
    },
    {
      label: 'Severity & Drivability',
      value: activeDossier.severity?.includes('CRITICAL') ? 'Critical (Stop driving immediately)' : activeDossier.severity?.includes('HIGH') ? 'Moderate (Service within 1–2 weeks)' : 'Low (Safe for short trips)',
      subtext: activeDossier.severity?.includes('CRITICAL')
        ? 'Continued driving causes permanent engine or catalyst destruction!'
        : 'Service promptly to safeguard catalytic converter and emissions hardware.',
      badge: (
        <RiskBadge
          level={activeDossier.severity?.includes('CRITICAL') ? 'critical' : activeDossier.severity?.includes('HIGH') ? 'moderate' : 'low'}
          label={`DTC ${activeDossier.code}`}
        />
      ),
    },
    {
      label: 'Most Common Culprit',
      value: `${topRootCauses[0]?.cause || 'Sensor fault'} (${topRootCauses[0]?.probabilityPct || 0}%)`,
      subtext: 'Do not replace expensive major components blindly: verify live PID readings first!',
      badge: <RiskBadge level="low" label="Primary Suspect" />,
    },
  ], [est, formatCurrency, activeDossier, topRootCauses]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Check engine light cost estimator"
        subtitle="Enter any fault code to see the real culprit, verified labor hours, and fair workshop pricing."
      />

      {/* TL;DR Verdict Box: Top 3 diagnostic takeaways */}
      <TldrVerdictBox
        title="Key Takeaways"
        subtitle="Top 3 diagnostic and repair data points"
        badge="DTC Diagnostics"
        facts={obdTldrFacts}
      />

      {/* Top Search Bar Card (Full Width) */}
      <div className="bg-surface dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Main 56px Search Input */}
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (searchMatches[0]) handleSelect(searchMatches[0].code);
            }}
            className="relative flex-1"
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
              className="h-14 w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-surface dark:bg-zinc-900 pr-24 pl-12 font-sans text-sm text-ink dark:text-zinc-50 placeholder:text-faint dark:placeholder:text-zinc-500 focus-visible:border-primary-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600/30 shadow-xs scroll-mt-28 lg:scroll-mt-32"
            />
            <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1.5">
              <span className="font-mono tabular-nums font-bold text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-1 rounded-md">
                {activeDossier.code}
              </span>
            </div>
          </form>
        </div>

        {/* Live Search Results Dropdown */}
        {searchQuery.trim() && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-zinc-900 overflow-hidden shadow-card" aria-live="polite">
            {searchMatches.length > 0 ? (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-64 overflow-y-auto">
                {searchMatches.map((m) => (
                  <li key={m.code}>
                    <button
                      type="button"
                      onClick={() => handleSelect(m.code)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/60 focus-visible:bg-zinc-50 dark:focus-visible:bg-zinc-800/60 focus-visible:outline-none transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold tabular-nums text-primary-600 dark:text-emerald-400 font-mono text-base">{m.code}</span>
                        <span className="font-sans text-ink dark:text-zinc-50 font-medium">{m.title}</span>
                      </div>
                      <span className="text-xs text-muted dark:text-zinc-400 font-sans font-medium">{m.category}</span>
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

        {/* Horizontally Scrollable Category Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {OBD_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-sans font-medium whitespace-nowrap transition-colors duration-150 border ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40 font-semibold shadow-xs'
                    : 'bg-surface dark:bg-zinc-900 text-body dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-ink dark:hover:text-zinc-50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Symptom Quick Diagnosis Filter Chips */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-zinc-400 font-sans">
              Symptom Quick Diagnosis
            </span>
            {selectedSymptom && (
              <button
                type="button"
                onClick={() => setSelectedSymptom(null)}
                className="text-[11px] font-sans font-medium text-primary-600 dark:text-emerald-400 hover:underline"
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
                  onClick={() => setSelectedSymptom(isActive ? null : sf.id)}
                  className={`px-2.5 py-1 rounded-md font-sans text-xs font-medium transition-colors duration-150 border ${
                    isActive
                      ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500 shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/60 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-ink dark:hover:text-zinc-50'
                  }`}
                >
                  {sf.label}
                </button>
              );
            })}
          </div>

          {/* Matched Symptom Codes Quick Launcher */}
          {selectedSymptom && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs">
              <p className="font-sans font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
                Likely codes for {SYMPTOM_FILTERS.find((s) => s.id === selectedSymptom)?.label}:
              </p>
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_FILTERS.find((s) => s.id === selectedSymptom)?.codes.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`px-3 py-1 rounded-md font-mono tabular-nums text-xs font-bold border transition-colors shadow-xs ${
                      c === activeDossier.code
                        ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500'
                        : 'bg-surface dark:bg-zinc-900 text-ink dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Common Codes Quick-Select Chips */}
        <div className="pt-2">
          <span className="font-sans text-xs font-medium text-muted dark:text-zinc-400 block mb-2">Common diagnostic codes:</span>
          <div className="flex flex-wrap gap-2">
            {QUICK_CODES.map((c) => {
              const active = c === activeDossier.code;
              const isKnownForVehicle = Array.isArray(activePreset.commonObdCodes) && activePreset.commonObdCodes.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelect(c)}
                  title={isKnownForVehicle ? `Known weak point on ${activePreset.name}` : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-[#183D22] bg-[#183D22] text-white dark:bg-emerald-600 dark:border-emerald-500 shadow-xs'
                      : isKnownForVehicle
                      ? 'border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:border-amber-300'
                      : 'border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-zinc-900 text-body dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-ink dark:hover:text-zinc-50'
                  }`}
                >
                  <span className="font-semibold tabular-nums font-mono">{c}</span>
                  <span className="font-sans text-[11px] opacity-85">{CODE_LABELS[c] || ''}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vehicle × OBD-II Programmatic Telemetry Banner */}
      <div
        id="obd-vehicle-telemetry-banner"
        className="bg-surface dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-card p-6 space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-wider text-[#183D22] dark:text-emerald-400">
                <Car className="w-3.5 h-3.5" />
                Vehicle × OBD-II Programmatic Telemetry
              </span>
              {isKnownVulnerability ? (
                <span className="inline-flex items-center rounded-md bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 px-2 py-0.5 text-[11px] font-sans font-medium">
                  KNOWN POWERTRAIN VULNERABILITY
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 px-2 py-0.5 text-[11px] font-sans font-medium">
                  POWERTRAIN DIAGNOSTIC PROFILE
                </span>
              )}
              {activePreset.criticalDefectTag && (
                <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 px-2 py-0.5 text-[11px] font-sans font-medium">
                  {activePreset.criticalDefectTag}
                </span>
              )}
            </div>

            <h2
              id="hybrid-vehicle-obd-heading"
              className="font-sans text-lg sm:text-xl font-bold tracking-tight text-ink dark:text-zinc-50"
            >
              {activePreset.name} · <span className="font-mono tabular-nums">{activeDossier.code}</span> {activeDossier.title}: Repair Cost &amp; Live PID Guide
            </h2>
          </div>

          {/* Compact Vehicle Selector Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
            <label
              htmlFor="obd-preset-select"
              className="text-[11px] font-sans uppercase tracking-wider text-muted dark:text-zinc-400 font-semibold whitespace-nowrap"
            >
              Target Vehicle:
            </label>
            <select
              id="obd-preset-select"
              aria-label="Select vehicle powertrain for OBD-II telemetry correlation"
              value={activePreset.id}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 font-sans text-xs font-medium text-ink dark:text-zinc-100 focus-visible:border-primary-600 focus-visible:outline-2 focus-visible:outline-primary-600/30"
            >
              {VEHICLE_PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="dark:bg-zinc-900 dark:text-zinc-100">
                  {p.name} ({p.engineCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center text-xs">
          <div className="lg:col-span-8 space-y-1">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-zinc-400 block">
              Factory Mechanical Risk Notes ({activePreset.engineCode})
            </span>
            <p className="font-sans text-body dark:text-zinc-300 leading-relaxed">
              {activePreset.knownRiskNotes}
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col justify-between gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80">
            <div className="flex items-center justify-between gap-2">
              <span className="font-sans text-muted dark:text-zinc-400 font-medium">Baseline Annual Maintenance:</span>
              <span className="font-mono font-bold tabular-nums text-ink dark:text-zinc-50">
                {formatCurrency(activePreset.baseAnnualMaintenanceUsd)}/yr
              </span>
            </div>
            {activePreset.commonObdCodes && activePreset.commonObdCodes.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] font-sans uppercase tracking-wider text-muted dark:text-zinc-400 font-semibold mr-1">
                  Known Faults:
                </span>
                {activePreset.commonObdCodes.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`px-2 py-0.5 rounded-md font-mono tabular-nums text-[11px] font-bold border transition-colors ${
                      c === activeDossier.code
                        ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500'
                        : 'bg-surface dark:bg-zinc-800 text-ink dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-emerald-500'
                    }`}
                  >
                    DTC {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Row: 2 Equal Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Hero Card 1: Code Information Card */}
        <div className="bg-surface dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-card p-6 flex flex-col justify-between transition-[transform,box-shadow] duration-200 ease-out hover:shadow-card-hover hover:-translate-y-0.5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-metric-l font-bold text-ink dark:text-zinc-50 tracking-tight font-mono tabular-nums">
                  {activeDossier.code}
                </span>
                <span className="rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 px-2 py-0.5 text-[11px] font-sans font-medium">
                  {activeDossier.category || 'Emissions & Exhaust'}
                </span>
              </div>
              <Pill tone={severityTone}>
                {severityLabel}
              </Pill>
            </div>

            <h3 className="font-sans text-lg sm:text-xl text-ink dark:text-zinc-50 font-bold tracking-tight mt-1">
              {activeDossier.title}
            </h3>

            <p className="font-sans text-body dark:text-zinc-300 text-sm mt-2 leading-relaxed">
              {activeDossier.description || 'Catalytic converter efficiency or sensor threshold fault registered by powertrain control module.'}
            </p>

            {/* Common Symptoms List */}
            {activeDossier.symptoms && activeDossier.symptoms.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <span className="font-sans text-[11px] font-semibold text-ink dark:text-zinc-100 uppercase tracking-wider block mb-2">
                  Common symptoms
                </span>
                <ul className="space-y-1.5 font-sans text-xs text-body dark:text-zinc-300">
                  {activeDossier.symptoms.map((sym, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CircleCheck className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400 shrink-0" />
                      <span>{sym}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('code-search');
                  if (el) {
                    el.focus();
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="bg-zinc-50 dark:bg-zinc-900 shadow-xs rounded-lg px-3.5 py-1.5 font-sans text-xs font-medium text-ink dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors duration-150 inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-muted dark:text-zinc-400" />
                <span>Change code</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
                className="bg-zinc-50 dark:bg-zinc-900 shadow-xs rounded-lg px-3.5 py-1.5 font-sans text-xs font-medium text-ink dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors duration-150 inline-flex items-center gap-1.5"
              >
                <span>Share ↗</span>
              </button>
            </div>
            <span className="font-sans text-[11px] font-medium text-muted dark:text-zinc-400">SAE J1979 Verified</span>
          </div>
        </div>

        {/* Hero Card 2: Severity & Repair Overview Card */}
        <div className="bg-surface dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-card p-6 flex flex-col justify-between transition-[transform,box-shadow] duration-200 ease-out hover:shadow-card-hover hover:-translate-y-0.5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans text-lg sm:text-xl text-ink dark:text-zinc-50 font-bold tracking-tight">Repair Severity</h3>
              <Info className="w-4 h-4 text-muted dark:text-zinc-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              <div className="sm:col-span-5 flex flex-col items-center justify-center py-1">
                <SeverityGauge severity={activeDossier.severity} size={144} />
              </div>

              <div className="sm:col-span-7 flex flex-col justify-center">
                <span className="font-sans text-[11px] font-semibold text-ink dark:text-zinc-100 uppercase tracking-wider mb-1">
                  Can I keep driving?
                </span>
                <p className="font-sans text-body dark:text-zinc-300 leading-relaxed text-sm">
                  {activeDossier.severity?.includes('CRITICAL')
                    ? 'No. Stop driving immediately to prevent permanent engine or catalyst destruction.'
                    : activeDossier.severity?.includes('HIGH')
                    ? 'Avoid high load and highway driving. Service within 1–2 weeks to prevent limp mode.'
                    : 'Yes, short-term. Repair within 1–2 months to pass emissions testing and avoid component wear.'}
                </p>

                <div className="mt-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl p-3 font-sans text-xs text-body dark:text-zinc-300 leading-normal border border-zinc-200 dark:border-zinc-800">
                  Most drivers pay <strong className="font-mono tabular-nums text-ink dark:text-zinc-50">{formatCurrency(est.minTotalUsd)}–{formatCurrency(est.maxTotalUsd)}</strong> at an independent specialist. Dealers average <strong className="font-mono tabular-nums text-ink dark:text-zinc-50">38%</strong> more.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('workshop-summary-heading');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-zinc-50 dark:bg-zinc-900 shadow-xs rounded-lg px-3.5 py-1.5 font-sans text-xs font-medium text-ink dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors duration-150 inline-flex items-center gap-1.5"
            >
              <span>See cost breakdown</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted dark:text-zinc-400" />
            </button>
            <span className="font-sans text-[11px] text-muted dark:text-zinc-400">
              OEM Book Time: <span className="font-mono tabular-nums">{activeDossier.laborHoursRange ? `${activeDossier.laborHoursRange[0]}-${activeDossier.laborHoursRange[1]} hrs` : '1.5-3.0 hrs'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4. Workspace Split: 7 cols left, 5 cols right */}
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8 items-start">
        {/* Left Column: 7 cols */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Card 1: Most Likely Root Causes */}
          <Card aria-labelledby="causes-heading">
            <div className="mb-5">
              <h3 id="causes-heading" className="font-sans text-lg sm:text-xl text-ink dark:text-zinc-50 font-bold tracking-tight scroll-mt-28 lg:scroll-mt-32">
                Most likely root causes
              </h3>
              <p className="font-sans font-medium text-muted dark:text-zinc-400 text-sm mt-0.5">
                Statistical probability breakdown based on real-world workshop diagnostic tickets.
              </p>
            </div>

            <ol className="flex flex-col gap-5">
              {topRootCauses.map((c, i) => {
                const p0 = Math.max(0, Number(c.partsCostUsd?.[0]) || 0);
                const p1 = Math.max(p0, Number(c.partsCostUsd?.[1]) || p0);
                const activeTierObj = LABOR_RATE_TIERS.find((t) => t.id === laborTierId) || LABOR_RATE_TIERS[1];
                const markup = activeTierObj?.partsMarkupFactor ?? (laborTierId === 'dealership' ? 1.25 : laborTierId === 'diy' ? 0.85 : 1.0);
                const avgPart = ((p0 + p1) / 2) * markup;

                const h0 = Math.max(0, Number(c.laborHours?.[0]) || 0);
                const h1 = Math.max(h0, Number(c.laborHours?.[1]) || h0);
                const rate = activeTierObj?.rateUsdPerHr ?? (laborTierId === 'dealership' ? 185 : laborTierId === 'diy' ? 0 : 115);
                const avgLabor = ((h0 + h1) / 2) * rate;
                const estimatedCulpritCost = Math.max(0, Math.round(avgPart + avgLabor));

                return (
                  <li key={c.cause} className="pb-4 border-b border-zinc-200 dark:border-zinc-800 last:border-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-sans text-ink dark:text-zinc-50 font-medium">
                        <span className="mr-2 font-bold font-mono tabular-nums text-primary-600 dark:text-emerald-400">
                          {i + 1}.
                        </span>
                        {c.cause}
                      </span>
                      <span className="shrink-0 tabular-nums font-mono text-muted dark:text-zinc-400">
                        <span className="font-bold text-ink dark:text-zinc-50">{c.probabilityPct}%</span> ·{' '}
                        <span className="font-semibold text-primary-600 dark:text-emerald-400">
                          {formatCurrency(estimatedCulpritCost)}
                        </span>
                      </span>
                    </div>

                    {/* Probability Progress Bar */}
                    <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-primary-600 dark:bg-emerald-500 transition-[width] duration-200 ease-out"
                        style={{ width: `${c.probabilityPct}%` }}
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between font-sans text-xs text-muted dark:text-zinc-400">
                      <span>
                        Parts: <span className="font-mono tabular-nums">{formatCurrency(c.partsCostUsd[0])}–{formatCurrency(c.partsCostUsd[1])}</span> · Labour: <span className="font-mono tabular-nums">{c.laborHours[0]}–{c.laborHours[1]}</span> hrs
                      </span>
                      {c.componentNote && (
                        <span className="text-faint dark:text-zinc-500">{c.componentNote}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          {/* Card 2: Check Before Replacing Expensive Parts (First-Principles Live Telemetry Check) */}
          <Card aria-labelledby="telemetry-check-heading">
            <h3 id="telemetry-check-heading" className="font-sans text-lg sm:text-xl text-ink dark:text-zinc-50 font-bold tracking-tight scroll-mt-28 lg:scroll-mt-32">
              What to check before replacing expensive parts (First-Principles Live Telemetry Check)
            </h3>
            <p className="font-sans font-medium text-muted dark:text-zinc-400 text-sm mt-0.5 mb-5">
              Targeted sensor verification checklist to avoid premature replacement of costly assemblies.
            </p>

            {activeDossier.liveTelemetryCheck && (
              <div className="space-y-4 font-sans text-sm text-body dark:text-zinc-300">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink dark:text-zinc-100 mb-2 font-sans">
                    Target PIDs to monitor
                  </p>
                  <ul className="space-y-2 text-xs">
                    {activeDossier.liveTelemetryCheck.pidsToMonitor.map((pid) => (
                      <li key={pid} className="flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <CircleCheck aria-hidden="true" className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-mono font-semibold text-ink dark:text-zinc-200">{pid}</span>
                        <span className="font-sans text-muted dark:text-zinc-400 ml-auto">Live Sensor Feed</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink dark:text-zinc-100 mb-1 font-sans">
                    Baseline Diagnostic Protocol
                  </p>
                  <p className="font-sans text-xs leading-relaxed text-body dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    {activeDossier.liveTelemetryCheck.diagnosticProtocol}
                  </p>
                </div>

                {activeDossier.liveTelemetryCheck.costTrapWarning && (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-3 font-sans text-xs text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Cost Trap Warning:</strong> {activeDossier.liveTelemetryCheck.costTrapWarning}
                    </div>
                  </div>
                )}
              </div>
            )}

            <LivePidEvaluator
              activeDossier={activeDossier}
              workshopRate={effectiveLaborRate}
              laborTierId={laborTierId}
              onVerdictChange={setLiveVerdict}
            />
          </Card>
        </div>

        {/* Right Column: 5 cols (Sticky Summary & Single Integrated Partner CTA) */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
          <Card className="h-fit shadow-card" aria-labelledby="workshop-summary-heading">
            {/* Eyebrow */}
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] font-semibold text-muted dark:text-zinc-400 uppercase tracking-wider">
                FAIR WORKSHOP ESTIMATE
              </span>
              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 px-2 py-0.5 text-[11px] font-sans font-medium">
                Regional Benchmark
              </span>
            </div>

            {/* H2 Title with EXACT required format */}
            <h2 id="workshop-summary-heading" className="font-sans text-lg font-bold tracking-tight text-ink dark:text-zinc-50 mt-3 scroll-mt-28 lg:scroll-mt-32">
              {activeDossier.code} WORKSHOP COST SUMMARY
            </h2>
            <p className="font-sans text-xs text-muted dark:text-zinc-400 mt-0.5">
              {activeDossier.title}
            </p>

            {/* Price Range Display */}
            <div className="my-5">
              <div className="text-metric-xl font-bold font-mono text-ink dark:text-zinc-50 tracking-tight tabular-nums leading-none">
                {formatCurrency(est.minTotalUsd)} – {formatCurrency(est.maxTotalUsd)}
              </div>
              <p className="mt-1.5 font-sans text-xs text-muted dark:text-zinc-400">
                Typical expected cost: <span className="font-semibold text-ink dark:text-zinc-100 font-mono tabular-nums">{formatCurrency(est.weightedExpectedUsd)}</span> ({est.tierLabel})
              </p>

              {/* Dynamic Live Telemetry-Adjusted Repair Cost Callout */}
              {liveVerdict && (
                <div
                  id="summary-live-telemetry-verdict"
                  className="mt-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-sans uppercase tracking-wider text-muted dark:text-zinc-400 font-bold">
                      PID Telemetry-Narrowed Range
                    </span>
                    <Pill tone={liveVerdict.tone} className="text-[11px] py-0 px-2">
                      {liveVerdict.badgeLabel}
                    </Pill>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
                    <span className="font-mono text-base font-bold tabular-nums text-primary-600 dark:text-emerald-400 min-w-0">
                      {formatCurrency(liveVerdict.narrowedMinUsd)} – {formatCurrency(liveVerdict.narrowedMaxUsd)}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-muted dark:text-zinc-400 shrink-0">
                      Est. avg: {formatCurrency(liveVerdict.narrowedExpectedUsd)}
                    </span>
                  </div>
                  <p className="font-sans text-[11px] text-muted dark:text-zinc-400 truncate" title={liveVerdict.primarySuspectCause}>
                    Suspect: <span className="font-medium text-ink dark:text-zinc-200">{liveVerdict.primarySuspectCause}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Workshop Pricing Tier Switcher + Live DIY vs. Dealership Savings Badge */}
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
                  className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-sans font-medium"
                >
                  <span>DIY Garage saves <span className="font-mono tabular-nums font-bold">{formatCurrency(diySavingsVsDealerUsd)}</span> vs. Main Dealership</span>
                  <span className="font-mono tabular-nums opacity-85">
                    {formatCurrency(diyEst.weightedExpectedUsd)} vs {formatCurrency(dealershipEst.weightedExpectedUsd)}
                  </span>
                </div>
              )}
            </div>

            {/* Parts vs Labor Segmented Bar */}
            <div className="mb-5">
              <div className="flex justify-between items-center font-sans text-[11px] uppercase tracking-wider text-muted dark:text-zinc-400 font-semibold mb-1.5">
                <span>Cost Allocation</span>
                <span><span className="font-mono tabular-nums">{partsShare}%</span> Parts / <span className="font-mono tabular-nums">{100 - partsShare}%</span> Labor</span>
              </div>
              <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" aria-hidden="true">
                <div
                  className="h-full bg-primary-600 dark:bg-emerald-500 transition-[width] duration-200 ease-out first:rounded-l-full"
                  style={{ width: `${partsShare}%` }}
                />
                <div className="h-full flex-1 bg-zinc-400 dark:bg-zinc-600 last:rounded-r-full" />
              </div>

              <dl className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-sm bg-primary-600 dark:bg-emerald-500" />
                    <dt className="font-sans text-muted dark:text-zinc-400 font-medium">Parts</dt>
                  </div>
                  <dd className="font-semibold tabular-nums text-ink dark:text-zinc-50 font-mono text-sm">
                    {formatCurrency(est.weightedPartsUsd)}
                  </dd>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-sm bg-zinc-400 dark:bg-zinc-600" />
                    <dt className="font-sans text-muted dark:text-zinc-400 font-medium">Labor</dt>
                  </div>
                  <dd className="font-semibold tabular-nums text-ink dark:text-zinc-50 font-mono text-sm">
                    {formatCurrency(est.weightedLaborUsd)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Single Clean Partner CTA at Bottom of Right Dossier Card (mt-5, zero overlap) */}
            <TopTabAffiliateBanner
              type="obd-scanner"
              vehicleName={activePreset.name}
              activeCode={activeDossier.code}
              activeCodeTitle={activeDossier.title}
              cheapestCauseUsd={causeCostStats.cheapestCauseUsd}
              costliestCauseUsd={causeCostStats.costliestCauseUsd}
              cheapCauseProbPct={causeCostStats.cheapCauseProbPct}
              compact={true}
              className="mt-5"
            />
          </Card>

          {/* Contextual Companion: Powertrain Wear Matrix Cross-Module Card */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-sans uppercase tracking-wider text-muted dark:text-zinc-400 font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                Cross-Module Telemetry
              </span>
              <span className="rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 px-2 py-0.5 text-[11px] font-sans font-medium">
                Risk Escalation
              </span>
            </div>
            <h4 className="font-sans text-sm font-bold text-ink dark:text-zinc-50 leading-snug">
              Powertrain Component Wear Check
            </h4>
            <p className="font-sans text-xs text-body dark:text-zinc-300 leading-relaxed">
              Fault code <strong className="text-ink dark:text-zinc-50 font-mono tabular-nums">{activeDossier.code}</strong> frequently correlates with mechanical wear on {activeDossier.subsystem || 'exhaust and induction subsystems'}. Check component failure probabilities by mileage.
            </p>
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <button
                type="button"
                onClick={onNavigateToRisk}
                className="font-sans text-xs font-semibold text-primary-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 transition-colors"
              >
                <span>Open Powertrain Risk Matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Interactive "Should I Fix It or Sell It?" Decision Engine (Pre-Filled with Active DTC Quote) */}
      <FixOrSellCalculator
        vehicle={activePreset}
        initialRepairQuoteUsd={liveVerdict ? liveVerdict.narrowedExpectedUsd : est.weightedExpectedUsd}
        initialOdometerMiles={activePreset.defaultOdometerMiles}
        sourceLabel={`DTC ${activeDossier.code} Workshop Estimate`}
        onNavigateToCompare={onNavigateToCompare}
      />

      {/* 6. Zero-CLS Responsive AdSense Slot */}
      <AdUnit
        slotId="obd-bottom-leaderboard"
        variant="leaderboard"
        contextLabel={`${activePreset.name} ${activeDossier.code} Repair Estimator`}
      />
    </div>
  );
}

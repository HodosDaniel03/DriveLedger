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
import { Card, PageHeader, Pill, Segmented, PartnerCard, SeverityGauge } from '../common/OdometerPrimitives';
import TopTabAffiliateBanner from '../monetization/TopTabAffiliateBanner';
import LivePidEvaluator from './LivePidEvaluator';

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
}) {
  const activeCodeId = selectedObdCode || selectedCode || 'P2002';
  const { formatCurrency } = useUnits();

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

  // Workshop cost estimate
  const est = useMemo(() => {
    return calculateObdWorkshopEstimate(activeDossier, laborTierId);
  }, [activeDossier, laborTierId]);

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

  // Split parts vs labor share
  const partsShare = est.weightedPartsUsd + est.weightedLaborUsd > 0
    ? Math.round((est.weightedPartsUsd / (est.weightedPartsUsd + est.weightedLaborUsd)) * 100)
    : 100;

  // Severity pill mapping
  const severityTone =
    activeDossier.severity?.includes('CRITICAL') ? 'risk' :
    activeDossier.severity?.includes('HIGH') ? 'warn' : 'good';

  const severityLabel =
    activeDossier.severity?.includes('CRITICAL') ? 'Critical — Stop Driving' :
    activeDossier.severity?.includes('HIGH') ? 'Limp Mode Risk — Service Soon' :
    'Safe for Short Trips';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Check engine light cost estimator"
        subtitle="Enter any fault code to see the real culprit, verified labor hours, and fair workshop pricing."
      />

      {/* Top Search Bar Card (Full Width) */}
      <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-border/80 dark:border-slate-800 shadow-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Main 56px Search Pill Input */}
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
              className="pointer-events-none absolute top-1/2 left-4 w-5 h-5 -translate-y-1/2 text-muted dark:text-slate-400"
            />
            <input
              id="code-search"
              type="search"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code or symptom (e.g. P0420, P2002, misfire)..."
              className="h-14 w-full rounded-full border border-border-strong dark:border-slate-700 bg-surface dark:bg-slate-950 pr-24 pl-12 text-sm text-ink dark:text-slate-100 placeholder:text-faint dark:placeholder:text-slate-500 focus-visible:border-primary-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600/30 shadow-sm"
            />
            <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1.5">
              <span className="font-code font-bold text-xs bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300 border border-primary-100 dark:border-primary-800 px-2.5 py-1 rounded-md">
                {activeDossier.code}
              </span>
            </div>
          </form>
        </div>

        {/* Live Search Results Dropdown */}
        {searchQuery.trim() && (
          <div className="rounded-xl border border-border dark:border-slate-800 bg-surface dark:bg-slate-900 overflow-hidden shadow-card" aria-live="polite">
            {searchMatches.length > 0 ? (
              <ul className="divide-y divide-border dark:divide-slate-800 max-h-64 overflow-y-auto">
                {searchMatches.map((m) => (
                  <li key={m.code}>
                    <button
                      type="button"
                      onClick={() => handleSelect(m.code)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-surface-subtle dark:hover:bg-slate-800/60 focus-visible:bg-surface-subtle dark:focus-visible:bg-slate-800/60 focus-visible:outline-none transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold tabular-nums text-primary-600 dark:text-primary-400 font-mono text-base">{m.code}</span>
                        <span className="text-ink dark:text-slate-100 font-medium">{m.title}</span>
                      </div>
                      <span className="text-xs text-muted dark:text-slate-400 font-mono">{m.category}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-sm text-muted dark:text-slate-400">
                No matching fault code found for "{searchQuery}". Try searching "P0420" or "misfire".
              </p>
            )}
          </div>
        )}

        {/* Horizontally Scrollable Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {OBD_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300 border-primary-100 dark:border-primary-800 font-semibold shadow-sm'
                    : 'bg-surface dark:bg-slate-900 text-body dark:text-slate-300 border-border dark:border-slate-800 hover:border-border-strong dark:hover:border-slate-700 hover:text-ink dark:hover:text-slate-100'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Symptom Quick Diagnosis Filter Chips */}
        <div className="pt-3 border-t border-border/60 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-slate-400 font-mono">
              Symptom Quick Diagnosis
            </span>
            {selectedSymptom && (
              <button
                type="button"
                onClick={() => setSelectedSymptom(null)}
                className="text-[11px] font-medium text-primary-600 dark:text-primary-400 hover:underline"
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
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    isActive
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'bg-surface-subtle dark:bg-slate-800 text-body dark:text-slate-300 border-border dark:border-slate-700 hover:border-border-strong dark:hover:border-slate-600 hover:text-ink dark:hover:text-slate-100'
                  }`}
                >
                  {sf.label}
                </button>
              );
            })}
          </div>

          {/* Matched Symptom Codes Quick Launcher */}
          {selectedSymptom && (
            <div className="mt-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-900 text-xs">
              <p className="font-semibold text-primary-800 dark:text-primary-200 mb-2">
                Likely codes for {SYMPTOM_FILTERS.find((s) => s.id === selectedSymptom)?.label}:
              </p>
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_FILTERS.find((s) => s.id === selectedSymptom)?.codes.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`px-3 py-1 rounded-md font-mono text-xs font-bold border transition-colors shadow-sm ${
                      c === activeDossier.code
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-surface dark:bg-slate-900 text-ink dark:text-slate-200 border-border dark:border-slate-700 hover:bg-surface-subtle dark:hover:bg-slate-800'
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
          <span className="text-xs font-medium text-muted dark:text-slate-400 block mb-2">Common diagnostic codes:</span>
          <div className="flex flex-wrap gap-2">
            {QUICK_CODES.map((c) => {
              const active = c === activeDossier.code;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelect(c)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                      : 'border-border dark:border-slate-700 bg-surface dark:bg-slate-900 text-body dark:text-slate-300 hover:border-border-strong dark:hover:border-slate-600 hover:text-ink dark:hover:text-slate-100'
                  }`}
                >
                  <span className="font-semibold tabular-nums font-mono">{c}</span>{' '}
                  <span className="text-[11px] opacity-80">{CODE_LABELS[c] || ''}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vehicle × OBD-II Programmatic Telemetry Banner */}
      <div
        id="obd-vehicle-telemetry-banner"
        className="bg-surface dark:bg-slate-900 rounded-2xl border border-border/80 dark:border-slate-800 shadow-card p-6 space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-border/60 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                <Car className="w-3.5 h-3.5" />
                Vehicle × OBD-II Programmatic Telemetry
              </span>
              {isKnownVulnerability ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-danger-bg dark:bg-rose-950/70 border border-[#F5C2C7] dark:border-rose-800/80 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-danger-text dark:text-rose-300">
                  KNOWN POWERTRAIN VULNERABILITY
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-subtle dark:bg-slate-800 border border-border dark:border-slate-700 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted dark:text-slate-400">
                  POWERTRAIN DIAGNOSTIC PROFILE
                </span>
              )}
              {activePreset.criticalDefectTag && (
                <span className="inline-flex items-center rounded-full bg-warning-bg dark:bg-amber-950/60 border border-[#F5DE8A] dark:border-amber-800/80 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-warning-text dark:text-amber-300">
                  {activePreset.criticalDefectTag}
                </span>
              )}
            </div>

            <h2
              id="hybrid-vehicle-obd-heading"
              className="text-lg sm:text-xl font-bold tracking-tight text-ink dark:text-slate-100"
            >
              {activePreset.name} · {activeDossier.code} {activeDossier.title}: Repair Cost &amp; Live PID Guide
            </h2>
          </div>

          {/* Compact Vehicle Selector Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
            <label
              htmlFor="obd-preset-select"
              className="text-[11px] font-mono uppercase tracking-wider text-muted dark:text-slate-400 font-semibold whitespace-nowrap"
            >
              Target Vehicle:
            </label>
            <select
              id="obd-preset-select"
              aria-label="Select vehicle powertrain for OBD-II telemetry correlation"
              value={activePreset.id}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="h-10 rounded-xl border border-border-strong dark:border-slate-700 bg-surface-subtle dark:bg-slate-950 px-3 text-xs font-medium text-ink dark:text-slate-100 focus-visible:border-primary-600 focus-visible:outline-2 focus-visible:outline-primary-600/30"
            >
              {VEHICLE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.engineCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center text-xs">
          <div className="lg:col-span-8 space-y-1">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-slate-400 block">
              Factory Mechanical Risk Notes ({activePreset.engineCode})
            </span>
            <p className="text-body dark:text-slate-300 leading-relaxed">
              {activePreset.knownRiskNotes}
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col justify-between gap-2 p-3 rounded-xl bg-surface-subtle dark:bg-slate-950 border border-border/60 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted dark:text-slate-400 font-medium">Baseline Annual Maintenance:</span>
              <span className="font-mono font-bold tabular-nums text-ink dark:text-slate-100">
                {formatCurrency(activePreset.baseAnnualMaintenanceUsd)}/yr
              </span>
            </div>
            {activePreset.commonObdCodes && activePreset.commonObdCodes.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-border/60 dark:border-slate-800">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted dark:text-slate-400 mr-1">
                  Known Faults:
                </span>
                {activePreset.commonObdCodes.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold border transition-colors ${
                      c === activeDossier.code
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-surface dark:bg-slate-900 text-ink dark:text-slate-200 border-border dark:border-slate-700 hover:border-primary-500'
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
        <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-border/80 dark:border-slate-800 shadow-card p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="font-metric-l text-metric-l font-bold text-ink dark:text-slate-100 tracking-tight font-mono">
                  {activeDossier.code}
                </span>
                <span className="bg-surface-subtle dark:bg-slate-800 text-body dark:text-slate-300 border border-border dark:border-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {activeDossier.category || 'Emissions & Exhaust'}
                </span>
              </div>
              <Pill tone={severityTone}>
                {severityLabel}
              </Pill>
            </div>

            <h3 className="font-h3 text-h3 text-ink dark:text-slate-100 font-semibold tracking-tight mt-1">
              {activeDossier.title}
            </h3>

            <p className="font-body text-body dark:text-slate-300 text-sm mt-2 leading-relaxed">
              {activeDossier.description || 'Catalytic converter efficiency or sensor threshold fault registered by powertrain control module.'}
            </p>

            {/* Common Symptoms List */}
            {activeDossier.symptoms && activeDossier.symptoms.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/60 dark:border-slate-800">
                <span className="font-micro text-micro font-semibold text-ink dark:text-slate-100 uppercase tracking-wider block mb-2">
                  Common symptoms
                </span>
                <ul className="space-y-1.5 text-xs text-body dark:text-slate-300">
                  {activeDossier.symptoms.map((sym, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CircleCheck className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
                      <span>{sym}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-border/60 dark:border-slate-800 flex items-center justify-between gap-2">
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
                className="bg-surface dark:bg-slate-800 shadow-sm rounded-full px-4 py-1.5 font-small text-small font-medium text-ink dark:text-slate-200 hover:bg-surface-subtle dark:hover:bg-slate-700 border border-border-strong dark:border-slate-700 transition-all inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-muted dark:text-slate-400" />
                <span>Change code</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
                className="bg-surface dark:bg-slate-800 shadow-sm rounded-full px-4 py-1.5 font-small text-small font-medium text-ink dark:text-slate-200 hover:bg-surface-subtle dark:hover:bg-slate-700 border border-border-strong dark:border-slate-700 transition-all inline-flex items-center gap-1.5"
              >
                <span>Share ↗</span>
              </button>
            </div>
            <span className="font-code text-micro text-muted dark:text-slate-400">SAE J1979 Verified</span>
          </div>
        </div>

        {/* Hero Card 2: Severity & Repair Overview Card */}
        <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-border/80 dark:border-slate-800 shadow-card p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-h3 text-h3 text-ink dark:text-slate-100 font-semibold">Repair Severity</h3>
              <Info className="w-4 h-4 text-muted dark:text-slate-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              <div className="sm:col-span-5 flex flex-col items-center justify-center py-1">
                <SeverityGauge severity={activeDossier.severity} size={144} />
              </div>

              <div className="sm:col-span-7 flex flex-col justify-center">
                <span className="font-micro text-micro font-semibold text-ink dark:text-slate-100 uppercase tracking-wider mb-1">
                  Can I keep driving?
                </span>
                <p className="font-body text-body dark:text-slate-300 leading-relaxed text-sm">
                  {activeDossier.severity?.includes('CRITICAL')
                    ? 'No. Stop driving immediately to prevent permanent engine or catalyst destruction.'
                    : activeDossier.severity?.includes('HIGH')
                    ? 'Avoid high load and highway driving. Service within 1–2 weeks to prevent limp mode.'
                    : 'Yes, short-term. Repair within 1–2 months to pass emissions testing and avoid component wear.'}
                </p>

                <div className="mt-3 bg-primary-50 dark:bg-primary-950/50 rounded-xl p-3 font-small text-small text-[#1D3A6B] dark:text-primary-200 leading-normal border border-primary-100 dark:border-primary-900">
                  Most drivers pay <strong>{formatCurrency(est.minTotalUsd)}–{formatCurrency(est.maxTotalUsd)}</strong> at an independent specialist. Dealers average <strong>38% more</strong>.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('workshop-summary-heading');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-surface dark:bg-slate-800 shadow-sm rounded-full px-4 py-1.5 font-small text-small font-medium text-ink dark:text-slate-200 hover:bg-surface-subtle dark:hover:bg-slate-700 border border-border-strong dark:border-slate-700 transition-all inline-flex items-center gap-1.5"
            >
              <span>See cost breakdown</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted dark:text-slate-400" />
            </button>
            <span className="font-code text-micro text-muted dark:text-slate-400">OEM Book Time: {activeDossier.laborHoursRange ? `${activeDossier.laborHoursRange[0]}-${activeDossier.laborHoursRange[1]} hrs` : '1.5-3.0 hrs'}</span>
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
              <h3 id="causes-heading" className="font-h3 text-h3 text-ink dark:text-slate-100 font-semibold tracking-tight">
                Most likely root causes
              </h3>
              <p className="font-body text-body text-muted dark:text-slate-400 text-sm mt-0.5">
                Statistical probability breakdown based on real-world workshop diagnostic tickets.
              </p>
            </div>

            <ol className="flex flex-col gap-5">
              {topRootCauses.map((c, i) => {
                const avgPart = ((c.partsCostUsd[0] + c.partsCostUsd[1]) / 2) * (laborTierId === 'dealership' ? 1.25 : laborTierId === 'diy' ? 0.85 : 1.0);
                const rate = laborTierId === 'dealership' ? 185 : laborTierId === 'diy' ? 0 : 115;
                const avgLabor = ((c.laborHours[0] + c.laborHours[1]) / 2) * rate;
                const estimatedCulpritCost = Math.round(avgPart + avgLabor);

                return (
                  <li key={c.cause} className="pb-4 border-b border-border/60 dark:border-slate-800 last:border-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-ink dark:text-slate-100 font-medium">
                        <span className="mr-2 font-bold font-mono text-primary-600 dark:text-primary-400">
                          {i + 1}.
                        </span>
                        {c.cause}
                      </span>
                      <span className="shrink-0 tabular-nums font-mono text-muted dark:text-slate-400">
                        <span className="font-bold text-ink dark:text-slate-100">{c.probabilityPct}%</span> ·{' '}
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                          {formatCurrency(estimatedCulpritCost)}
                        </span>
                      </span>
                    </div>

                    {/* Probability Progress Bar */}
                    <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-border dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-primary-600 dark:bg-primary-500 transition-all duration-300"
                        style={{ width: `${c.probabilityPct}%` }}
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-muted dark:text-slate-400">
                      <span>
                        Parts: {formatCurrency(c.partsCostUsd[0])}–{formatCurrency(c.partsCostUsd[1])} · Labour: {c.laborHours[0]}–{c.laborHours[1]} hrs
                      </span>
                      {c.componentNote && (
                        <span className="text-faint dark:text-slate-500">{c.componentNote}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          {/* Card 2: Check Before Replacing Expensive Parts (First-Principles Live Telemetry Check) */}
          <Card aria-labelledby="telemetry-check-heading">
            <h3 id="telemetry-check-heading" className="font-h3 text-h3 text-ink dark:text-slate-100 font-semibold tracking-tight">
              What to check before replacing expensive parts (First-Principles Live Telemetry Check)
            </h3>
            <p className="font-body text-body text-muted dark:text-slate-400 text-sm mt-0.5 mb-5">
              Targeted sensor verification checklist to avoid premature replacement of costly assemblies.
            </p>

            {activeDossier.liveTelemetryCheck && (
              <div className="space-y-4 text-sm text-body dark:text-slate-300">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink dark:text-slate-100 mb-2 font-mono">
                    Target PIDs to monitor
                  </p>
                  <ul className="space-y-2 text-xs">
                    {activeDossier.liveTelemetryCheck.pidsToMonitor.map((pid) => (
                      <li key={pid} className="flex items-center gap-2.5 bg-surface-subtle dark:bg-slate-950 p-2 rounded-lg border border-border/50 dark:border-slate-800">
                        <CircleCheck aria-hidden="true" className="w-4 h-4 shrink-0 text-success-text dark:text-emerald-400" />
                        <span className="font-mono font-semibold text-ink dark:text-slate-200">{pid}</span>
                        <span className="text-muted dark:text-slate-400 ml-auto">Live Sensor Feed</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink dark:text-slate-100 mb-1 font-mono">
                    Baseline Diagnostic Protocol
                  </p>
                  <p className="text-xs leading-relaxed text-body dark:text-slate-300 bg-surface-subtle dark:bg-slate-950 p-3 rounded-xl border border-border/50 dark:border-slate-800">
                    {activeDossier.liveTelemetryCheck.diagnosticProtocol}
                  </p>
                </div>

                {activeDossier.liveTelemetryCheck.costTrapWarning && (
                  <div className="rounded-xl bg-warning-bg dark:bg-amber-950/50 border border-[#F5DE8A] dark:border-amber-800/80 p-3 text-xs text-warning-text dark:text-amber-400 leading-relaxed flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-warning-text dark:text-amber-400 shrink-0 mt-0.5" />
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
              onVerdictChange={setLiveVerdict}
            />
          </Card>
        </div>

        {/* Right Column: 5 cols (Sticky Summary & Contextual Companion Stack) */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 lg:top-[136px]">
          <Card className="h-fit shadow-card lg:sticky lg:top-24 lg:top-[136px]" aria-labelledby="workshop-summary-heading">
            {/* Eyebrow */}
            <div className="flex items-center justify-between">
              <span className="font-micro text-micro font-semibold text-muted dark:text-slate-400 uppercase tracking-wider">
                FAIR WORKSHOP ESTIMATE
              </span>
              <span className="bg-surface-subtle dark:bg-slate-800 text-muted dark:text-slate-400 font-code text-micro px-2 py-0.5 rounded border border-border/50 dark:border-slate-700">
                Regional Benchmark
              </span>
            </div>

            {/* H2 Title with EXACT required format */}
            <h2 id="workshop-summary-heading" className="text-lg font-bold tracking-tight text-ink dark:text-slate-100 mt-3 font-h3">
              {activeDossier.code} WORKSHOP COST SUMMARY
            </h2>
            <p className="text-xs text-muted dark:text-slate-400 mt-0.5">
              {activeDossier.title}
            </p>

            {/* Price Range Display */}
            <div className="my-5">
              <div className="font-metric-xl text-metric-xl font-bold font-code text-ink dark:text-slate-100 tracking-tight tabular-nums leading-none">
                {formatCurrency(est.minTotalUsd)} – {formatCurrency(est.maxTotalUsd)}
              </div>
              <p className="mt-1.5 text-xs text-muted dark:text-slate-400">
                Typical expected cost: <span className="font-semibold text-ink dark:text-slate-200 font-mono">{formatCurrency(est.weightedExpectedUsd)}</span> ({est.tierLabel})
              </p>

              {/* Dynamic Live Telemetry-Adjusted Repair Cost Callout */}
              {liveVerdict && (
                <div
                  id="summary-live-telemetry-verdict"
                  className="mt-3 p-3 rounded-xl border border-border/80 dark:border-slate-800 bg-surface-subtle dark:bg-slate-950 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted dark:text-slate-400 font-bold">
                      PID Telemetry-Narrowed Range
                    </span>
                    <Pill tone={liveVerdict.tone} className="text-[11px] py-0 px-2">
                      {liveVerdict.badgeLabel}
                    </Pill>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-base font-bold tabular-nums text-primary-600 dark:text-primary-400">
                      {formatCurrency(liveVerdict.narrowedMinUsd)} – {formatCurrency(liveVerdict.narrowedMaxUsd)}
                    </span>
                    <span className="text-[11px] font-mono text-muted dark:text-slate-400">
                      Est. avg: {formatCurrency(liveVerdict.narrowedExpectedUsd)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted dark:text-slate-400 truncate" title={liveVerdict.primarySuspectCause}>
                    Suspect: <span className="font-medium text-ink dark:text-slate-200">{liveVerdict.primarySuspectCause}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Workshop Pricing Tier Switcher */}
            <div className="mb-5">
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
            </div>

            {/* Parts vs Labor Segmented Bar */}
            <div className="mb-5">
              <div className="flex justify-between items-center font-micro text-micro uppercase tracking-wider text-muted dark:text-slate-400 font-semibold mb-1.5">
                <span>Cost Allocation</span>
                <span>{partsShare}% Parts / {100 - partsShare}% Labor</span>
              </div>
              <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-surface-container dark:bg-slate-800" aria-hidden="true">
                <div
                  className="h-full bg-primary-600 transition-all duration-300 first:rounded-l-full"
                  style={{ width: `${partsShare}%` }}
                />
                <div className="h-full flex-1 bg-[#5B8CFF] last:rounded-r-full" />
              </div>

              <dl className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-surface-subtle dark:bg-slate-950 rounded-xl border border-border/50 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-primary-600" />
                    <dt className="text-muted dark:text-slate-400 font-medium">Parts</dt>
                  </div>
                  <dd className="font-semibold tabular-nums text-ink dark:text-slate-100 font-mono text-sm">
                    {formatCurrency(est.weightedPartsUsd)}
                  </dd>
                </div>
                <div className="p-3 bg-surface-subtle dark:bg-slate-950 rounded-xl border border-border/50 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#5B8CFF]" />
                    <dt className="text-muted dark:text-slate-400 font-medium">Labor</dt>
                  </div>
                  <dd className="font-semibold tabular-nums text-ink dark:text-slate-100 font-mono text-sm">
                    {formatCurrency(est.weightedLaborUsd)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="h-px bg-border dark:bg-slate-800 my-5"></div>

            {/* Native Partner Card */}
            <PartnerCard
              text="Don't guess with expensive parts. Scan live sensor PIDs and freeze frame data with a verified OBD2 scanner."
              cta="Get Recommended OBD2 Scanner"
              href="https://www.amazon.com/s?k=bluetooth+obd2+scanner"
            />
          </Card>

          {/* Contextual Companion 1: Repositioned Compact Bluetooth OBD2 Scanner Dispatch */}
          <TopTabAffiliateBanner
            type="obd-scanner"
            activeCode={activeDossier.code}
            activeCodeTitle={activeDossier.title}
            compact={true}
          />

          {/* Contextual Companion 2: Powertrain Wear Matrix Cross-Module Card */}
          <div className="rounded-2xl border border-border/80 dark:border-slate-800 bg-surface dark:bg-slate-900 p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted dark:text-slate-400 font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-score-fair" />
                Cross-Module Telemetry
              </span>
              <span className="text-[11px] font-mono text-warning-text dark:text-amber-400 bg-warning-bg dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-[#F5DE8A] dark:border-amber-800/80 font-semibold">
                Risk Escalation
              </span>
            </div>
            <h4 className="text-sm font-bold text-ink dark:text-slate-100 leading-snug">
              Powertrain Component Wear Check
            </h4>
            <p className="text-xs text-body dark:text-slate-300 leading-relaxed">
              Fault code <strong className="text-ink dark:text-slate-100 font-mono">{activeDossier.code}</strong> frequently correlates with mechanical wear on {activeDossier.subsystem || 'exhaust and induction subsystems'}. Check component failure probabilities by mileage.
            </p>
            <div className="pt-2 border-t border-border/60 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={onNavigateToRisk}
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 inline-flex items-center gap-1 transition-colors"
              >
                <span>Open Powertrain Risk Matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

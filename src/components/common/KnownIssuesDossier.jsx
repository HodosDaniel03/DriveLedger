import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Wrench,
  Clock,
  Info,
  RotateCcw,
  ChevronDown,
  Cpu,
} from 'lucide-react';
import { vehicleDataService } from '../../services/vehicleDataService.js';
import {
  findEngineVariant,
  getGenerationsForModel,
  getEnginesForGeneration,
} from '../../data/vehicles/index.js';
import { useUnits } from '../../context/UnitContext';

const SEVERITY_COLORS = {
  critical: {
    accent: 'border-l-2 border-l-rose-500 dark:border-l-rose-400',
    badge: 'bg-rose-50/80 text-rose-800 border-rose-200/80 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40',
    dot: 'bg-rose-500',
    label: 'Critical Risk',
  },
  high: {
    accent: 'border-l-2 border-l-amber-500 dark:border-l-amber-400',
    badge: 'bg-amber-50/80 text-amber-800 border-amber-200/80 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40',
    dot: 'bg-amber-500',
    label: 'High Risk',
  },
  medium: {
    accent: 'border-l-2 border-l-zinc-400 dark:border-l-zinc-500',
    badge: 'bg-surface-subtle text-body border-border/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/60',
    dot: 'bg-zinc-500',
    label: 'Moderate Risk',
  },
  low: {
    accent: 'border-l-2 border-l-emerald-500 dark:border-l-emerald-400',
    badge: 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40',
    dot: 'bg-emerald-500',
    label: 'Low Risk',
  },
};

export default function KnownIssuesDossier({
  presetId,
  vehicleName,
  brand,
  model,
  embedded = false,
  className = '',
}) {
  const { region, formatCurrency, formatDistance, formatEfficiency } = useUnits();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [selectedGenId, setSelectedGenId] = useState('');
  const [selectedEngineId, setSelectedEngineId] = useState('');

  // Derive initial resolved architecture from presetId, model, or vehicleName
  const initialResolved = useMemo(() => {
    return findEngineVariant(presetId || model || vehicleName);
  }, [presetId, model, vehicleName]);

  const activeBrandId = initialResolved?.brand?.id || brand || 'ford';
  const activeBrandName = initialResolved?.brand?.name || brand || 'Ford';
  const activeModelId = initialResolved?.model?.id || model || 'ford-focus';
  const activeModelName = initialResolved?.model?.name || model || 'Focus';

  const isSynthesizedPreset = Boolean(initialResolved?.generation?.id?.endsWith('-gen'));

  // Available model generations
  const availableGenerations = useMemo(() => {
    if (isSynthesizedPreset) {
      return initialResolved?.generation ? [initialResolved.generation] : [];
    }
    const gens = getGenerationsForModel(activeBrandId, activeModelId);
    if (gens && gens.length > 0) return gens;
    return initialResolved?.generation ? [initialResolved.generation] : [];
  }, [activeBrandId, activeModelId, initialResolved, isSynthesizedPreset]);

  const currentGenId = selectedGenId || initialResolved?.generation?.id || availableGenerations[0]?.id;

  // Available engines for current generation
  const availableEngines = useMemo(() => {
    if (isSynthesizedPreset) {
      return initialResolved?.engine ? [initialResolved.engine] : [];
    }
    const engs = getEnginesForGeneration(activeBrandId, activeModelId, currentGenId);
    if (engs && engs.length > 0) return engs;
    return initialResolved?.engine ? [initialResolved.engine] : [];
  }, [activeBrandId, activeModelId, currentGenId, initialResolved, isSynthesizedPreset]);

  const currentEngineId = selectedEngineId || initialResolved?.engine?.id || availableEngines[0]?.id;

  const resolvedYear = useMemo(() => {
    const m = String(vehicleName || '').match(/\b(20\d{2})\b/);
    if (m) return Number(m[1]);
    const fromYr = initialResolved?.engine?.years?.from || initialResolved?.generation?.years?.from;
    return fromYr ? Math.min(2024, fromYr + 2) : 2021;
  }, [vehicleName, initialResolved]);

  // Sync state when presetId or vehicle changes
  useEffect(() => {
    if (initialResolved) {
      if (initialResolved.generation?.id) setSelectedGenId(initialResolved.generation.id);
      if (initialResolved.engine?.id) setSelectedEngineId(initialResolved.engine.id);
    }
  }, [initialResolved, presetId]);

  const loadData = async (forceRefresh = false) => {
    const targetEngineId = currentEngineId || selectedEngineId || initialResolved?.engine?.id;

    // 1. Instant Curated Snapshot (<1ms zero-latency render)
    const instant = vehicleDataService.getCuratedIntelligence({
      make: activeBrandName,
      model: activeModelName,
      year: resolvedYear,
      generationId: currentGenId,
      engineId: targetEngineId,
    });
    setData((prev) =>
      prev && prev.engine?.id === targetEngineId
        ? {
            ...instant,
            nhtsaRecalls: prev.nhtsaRecalls?.length ? prev.nhtsaRecalls : instant.nhtsaRecalls,
            nhtsaComplaints: prev.nhtsaComplaints?.totalCount ? prev.nhtsaComplaints : instant.nhtsaComplaints,
            fuelEconomy: prev.fuelEconomy?.combinedMpg ? prev.fuelEconomy : instant.fuelEconomy,
          }
        : instant
    );

    // 2. Background Revalidation via Live APIs
    setLoading(true);
    try {
      const liveIntel = await vehicleDataService.getVehicleIntelligence({
        make: activeBrandName,
        model: activeModelName,
        year: resolvedYear,
        generationId: currentGenId,
        engineId: targetEngineId,
        bypassCache: forceRefresh,
      });

      setData(liveIntel);
    } catch (err) {
      console.warn('Vehicle intelligence live sync falling back to curated records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, [presetId, currentGenId, currentEngineId, brand, model, resolvedYear]);

  const formatCostInRegion = (cost) => {
    if (!cost) return 'N/A';
    const minEur = (Number(cost.parts?.min) || 0) + (Number(cost.labor?.min) || 0);
    const maxEur = (Number(cost.parts?.max) || 0) + (Number(cost.labor?.max) || 0);
    if (minEur > 0 || maxEur > 0) {
      return formatEurBandInRegion(minEur, maxEur);
    }
    return region === 'EU' ? cost.formattedEur : cost.formattedUsd;
  };

  const formatEurBandInRegion = (minEur, maxEur) => {
    if (region === 'EU') {
      return `€${Number(minEur || 0).toLocaleString()} – €${Number(maxEur || 0).toLocaleString()}`;
    }
    // Convert EUR to USD baseline (1 EUR = 1 / 0.92 USD) then format via UnitContext
    const minUsd = Math.round((Number(minEur) || 0) / 0.92);
    const maxUsd = Math.round((Number(maxEur) || 0) / 0.92);
    return `${formatCurrency(minUsd)} – ${formatCurrency(maxUsd)}`;
  };

  const formatCriticalMileage = (crit) => {
    if (!crit) return '';
    if (region === 'EU') return crit.display;
    const minMiles = Math.round((Number(crit.minKm) || 0) / 1.609344 / 1000) * 1000;
    const maxMiles = Math.round((Number(crit.maxKm) || 0) / 1.609344 / 1000) * 1000;
    return `${formatDistance(minMiles, false)} – ${formatDistance(maxMiles)}`;
  };

  if (!data && loading) {
    return (
      <div
        className={
          embedded
            ? `py-4 animate-pulse ${className}`
            : `p-6 rounded-2xl bg-surface dark:bg-[#121215] border border-border/80 dark:border-zinc-800 animate-pulse ${className}`
        }
      >
        <div className="h-6 bg-surface-subtle dark:bg-zinc-800 rounded w-1/3 mb-4" />
        <div className="h-24 bg-surface-subtle dark:bg-zinc-800 rounded mb-3" />
        <div className="h-24 bg-surface-subtle dark:bg-zinc-800 rounded" />
      </div>
    );
  }

  if (!data) return null;

  const { knownIssues, nhtsaRecalls, nhtsaComplaints, fuelEconomy, metadata, engine } = data;

  return (
    <section
      aria-labelledby="known-issues-heading"
      className={
        embedded
          ? `cq-card w-full max-w-full min-w-0 space-y-5 ${className}`
          : `cq-card rounded-2xl bg-surface dark:bg-[#121215] border border-border/80 dark:border-zinc-800/90 shadow-card overflow-hidden ${className}`
      }
    >
      {/* Header Banner */}
      <div className={embedded ? 'pb-4 border-b border-border/80 dark:border-zinc-800' : 'p-5 sm:p-6 border-b border-border/80 dark:border-zinc-800'}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200/80 dark:border-amber-800/60">
              <ShieldAlert aria-hidden="true" className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="known-issues-heading"
                  className="font-sans text-base sm:text-lg font-bold tracking-tight text-ink dark:text-zinc-100"
                >
                  Engine-Specific Known Issues &amp; OEM Recalls
                </h2>
                <span
                  className={`text-[11px] font-sans px-2 py-0.5 rounded-md font-medium border shrink-0 ${
                    metadata.source === 'live-api'
                      ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40'
                      : metadata.source === 'memory-cache' || metadata.source === 'storage-cache'
                      ? 'bg-surface-subtle text-body border-border/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/60'
                      : 'bg-amber-50/80 text-amber-800 border-amber-200/80 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40'
                  }`}
                >
                  {metadata.source === 'live-api' && `Live NHTSA/EPA (${metadata.responseTimeMs}ms)`}
                  {(metadata.source === 'memory-cache' || metadata.source === 'storage-cache') && 'In-Memory Cache (<1ms)'}
                  {metadata.source === 'curated-fallback' && 'Curated Database (<50ms)'}
                </span>
              </div>
              <p className="mt-1 text-xs font-sans text-muted dark:text-zinc-400">
                Inspect generation-specific failure points, parts &amp; labor ranges, and federal recall history.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading}
            className="min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-sans text-xs font-semibold text-body hover:text-ink bg-surface-subtle dark:bg-zinc-900 border border-border/80 dark:border-zinc-800 hover:bg-canvas dark:hover:bg-zinc-800 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw aria-hidden="true" className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary-600' : ''}`} />
            <span>Refresh Live Telemetry</span>
          </button>
        </div>

        {/* Interactive Generation & Engine Variant Selector Toolbar */}
        <div className="mt-4 pt-3.5 border-t border-border/70 dark:border-zinc-800/80 space-y-3">
          {availableGenerations.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-sans font-medium text-muted dark:text-zinc-400">
                Generation:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableGenerations.map((gen) => {
                  const isActive = gen.id === currentGenId;
                  return (
                    <button
                      key={gen.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        setSelectedGenId(gen.id);
                        if (gen.engines && gen.engines.length > 0) {
                          setSelectedEngineId(gen.engines[0].id);
                        }
                      }}
                      className={`min-h-[44px] sm:min-h-[36px] px-3 py-2 rounded-xl text-xs font-sans font-medium inline-flex items-center transition-colors border cursor-pointer ${
                        isActive
                          ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500 font-semibold'
                          : 'bg-surface-subtle dark:bg-zinc-900 text-body hover:text-ink dark:text-zinc-300 border-border/80 dark:border-zinc-800'
                      }`}
                    >
                      <span>
                        {gen.name} (<span className="font-mono tabular-nums">{gen.years.from}–{gen.years.to || 'present'}</span>)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {availableEngines.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-sans font-medium text-muted dark:text-zinc-400">
                Engine Code / Powertrain:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableEngines.map((eng) => {
                  const isActive = eng.id === currentEngineId;
                  return (
                    <button
                      key={eng.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setSelectedEngineId(eng.id)}
                      className={`min-h-[44px] sm:min-h-[36px] px-3 py-2 rounded-xl text-xs font-sans font-medium transition-colors inline-flex items-center gap-1.5 border cursor-pointer ${
                        isActive
                          ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500 font-semibold'
                          : 'bg-surface-subtle dark:bg-zinc-900 text-body hover:text-ink dark:text-zinc-300 border-border/80 dark:border-zinc-800'
                      }`}
                    >
                      <span>{eng.name}</span>
                      <span className={`text-[11px] ${isActive ? 'text-white/80' : 'text-muted dark:text-zinc-400'}`}>
                        · {eng.fuelType}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Powertrain Telemetry Strip */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-sans font-medium pt-2.5 border-t border-border/60 dark:border-zinc-800/70">
            <span className="font-semibold text-ink dark:text-zinc-100">
              {engine?.name || vehicleName || `${data.brand} ${data.model}`}
            </span>
            {engine?.engineCode && (
              <span className="text-muted dark:text-zinc-400 font-mono">
                [{engine.engineCode}]
              </span>
            )}
            {engine?.powerHp && (
              <span className="text-muted dark:text-zinc-400 font-mono tabular-nums">
                · {engine.powerHp} HP {engine.torqueNm ? `· ${engine.torqueNm} Nm` : ''}
              </span>
            )}
            {engine?.criticalDefectTag && (
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                · {engine.criticalDefectTag}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className={embedded ? 'space-y-6' : 'p-5 sm:p-6 space-y-6'}>
        {/* Known Issues Hairline List */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-semibold text-ink dark:text-zinc-100 font-sans flex items-center gap-1.5">
              <AlertTriangle aria-hidden="true" className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Identified Known Flaws (<span className="font-mono tabular-nums">{knownIssues.length}</span>)</span>
            </h3>
            <span className="text-xs text-muted dark:text-zinc-400 font-sans">
              Parts + Labor breakdown
            </span>
          </div>

          {knownIssues.length === 0 ? (
            <div className="p-4 rounded-xl bg-surface-subtle dark:bg-zinc-900/60 text-center text-xs font-sans text-muted dark:text-zinc-400">
              No critical known issues recorded for this configuration.
            </div>
          ) : (
            <div className="divide-y divide-border/80 dark:divide-zinc-800 border-y border-border/80 dark:border-zinc-800">
              {knownIssues.map((issue) => {
                const styling = SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.medium;

                return (
                  <details key={issue.id} className={`dl-disclosure group ${styling.accent}`}>
                    <summary className="min-h-[48px] py-3.5 px-3 flex flex-col gap-1.5 hover:bg-surface-subtle/50 dark:hover:bg-zinc-900/40 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-sans font-medium px-2 py-0.5 rounded-md border ${styling.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styling.dot}`} aria-hidden="true" />
                            <span>{styling.label}</span>
                          </span>
                          <span className="text-xs font-sans text-muted dark:text-zinc-400">
                            · {issue.category}
                          </span>
                          <span className="text-xs font-mono tabular-nums font-medium text-ink dark:text-zinc-200 inline-flex items-center gap-1">
                            <Clock aria-hidden="true" className="w-3.5 h-3.5 text-muted shrink-0" />
                            {formatCriticalMileage(issue.criticalMileage)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs sm:text-sm font-mono tabular-nums font-semibold text-ink dark:text-zinc-100">
                            {formatCostInRegion(issue.repairCost)}
                          </span>
                          <ChevronDown
                            aria-hidden="true"
                            className="w-4 h-4 text-muted dark:text-zinc-400 transition-transform duration-200 group-open:rotate-180"
                          />
                        </div>
                      </div>

                      <div className="font-sans text-sm font-semibold text-ink dark:text-zinc-100">
                        {issue.name}
                      </div>

                      <div className="font-sans text-xs text-body dark:text-zinc-300 flex items-start gap-1.5">
                        <Info aria-hidden="true" className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          <strong className="font-semibold text-ink dark:text-zinc-200">Symptoms: </strong>
                          {issue.symptoms}
                        </span>
                      </div>
                    </summary>

                    <div className="pb-4 pt-2 px-3 space-y-3 text-xs font-sans bg-surface-subtle/35 dark:bg-zinc-900/30">
                      <div>
                        <span className="font-semibold block text-xs text-emerald-700 dark:text-emerald-400">
                          Prevention Protocol
                        </span>
                        <p className="mt-1 text-body dark:text-zinc-300 leading-relaxed">
                          {issue.prevention}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-border/60 dark:border-zinc-800/70 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div>
                          <span className="text-muted dark:text-zinc-400 block">Parts Range</span>
                          <span className="font-semibold font-mono tabular-nums text-ink dark:text-zinc-200">
                            {formatEurBandInRegion(issue.repairCost.parts.min, issue.repairCost.parts.max)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted dark:text-zinc-400 block">Labor Range</span>
                          <span className="font-semibold font-mono tabular-nums text-ink dark:text-zinc-200">
                            {formatEurBandInRegion(issue.repairCost.labor.min, issue.repairCost.labor.max)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted dark:text-zinc-400 block">Affected Components</span>
                          <span className="font-medium text-ink dark:text-zinc-200 block">
                            {issue.affectedComponents.join(', ')}
                          </span>
                        </div>
                      </div>

                      {issue.obdCodes && issue.obdCodes.length > 0 && (
                        <div className="pt-2 border-t border-border/60 dark:border-zinc-800/70 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-sans font-medium text-muted dark:text-zinc-400">DTC Codes:</span>
                          {issue.obdCodes.map((code) => (
                            <span
                              key={code}
                              className="text-[11px] font-mono tabular-nums font-semibold px-2 py-0.5 rounded-md bg-surface dark:bg-zinc-800 text-ink dark:text-zinc-200 border border-border/80 dark:border-zinc-700"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </div>

        {/* Verified External Telemetry (NHTSA & EPA) */}
        <div className="pt-4 border-t border-border/80 dark:border-zinc-800 space-y-4">
          <h3 className="text-sm font-semibold text-ink dark:text-zinc-100 font-sans flex items-center gap-1.5">
            <Cpu aria-hidden="true" className="w-4 h-4 text-primary-600 dark:text-emerald-400 shrink-0" />
            <span>Verified External Telemetry (NHTSA &amp; EPA FuelEconomy)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/80 dark:divide-zinc-800 rounded-xl border border-border/80 dark:border-zinc-800 bg-surface-subtle/50 dark:bg-zinc-900/40 font-sans">
            <div className="p-3.5">
              <span className="text-[11px] font-medium text-muted dark:text-zinc-400 block">OEM Recalls (NHTSA)</span>
              <span className="mt-1 block text-xl font-bold font-mono tabular-nums text-ink dark:text-zinc-100">
                {nhtsaRecalls.length}
              </span>
            </div>

            <div className="p-3.5">
              <span className="text-[11px] font-medium text-muted dark:text-zinc-400 block">Owner Complaints (NHTSA)</span>
              <span className="mt-1 block text-xl font-bold font-mono tabular-nums text-ink dark:text-zinc-100">
                {nhtsaComplaints.totalCount}
              </span>
            </div>

            <div className="p-3.5">
              <span className="text-[11px] font-medium text-muted dark:text-zinc-400 block">
                {engine?.fuelType === 'Electric' ? 'Official EV Energy Consumption' : 'Official EPA Fuel Economy'}
              </span>
              <div className="flex items-baseline justify-between gap-2 mt-1">
                {engine?.fuelType === 'Electric' ? (
                  <>
                    <span className="text-lg font-bold font-mono tabular-nums text-ink dark:text-zinc-100">
                      {formatEfficiency(
                        fuelEconomy.combinedMpg > 60 ? +(3370.5 / fuelEconomy.combinedMpg).toFixed(1) : fuelEconomy.combinedMpg,
                        true
                      )}
                    </span>
                    <span className="text-xs font-mono tabular-nums font-medium text-muted dark:text-zinc-400">
                      {fuelEconomy.kwhPer100Km
                        ? `${fuelEconomy.kwhPer100Km} kWh/100km`
                        : `${Math.round(fuelEconomy.combinedMpg)} MPGe`}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-lg font-bold font-mono tabular-nums text-ink dark:text-zinc-100">
                      {formatEfficiency(fuelEconomy.combinedMpg, false)}
                    </span>
                    <span className="text-xs font-mono tabular-nums font-medium text-muted dark:text-zinc-400">
                      {region === 'EU' ? `${fuelEconomy.combinedMpg} MPG` : `${fuelEconomy.lPer100Km} L/100km`}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Native <details> Disclosures for NHTSA Recalls & Complaints */}
          <div className="divide-y divide-border/80 dark:divide-zinc-800 border-y border-border/80 dark:border-zinc-800">
            <details className="dl-disclosure group">
              <summary className="min-h-[48px] py-3 px-1 flex items-center justify-between gap-2 text-xs sm:text-sm font-semibold text-ink dark:text-zinc-100 font-sans">
                <span className="inline-flex items-center gap-2">
                  <ChevronDown aria-hidden="true" className="w-4 h-4 text-muted dark:text-zinc-400 shrink-0 transition-transform duration-200 group-open:rotate-180" />
                  <span>OEM Recall Campaigns (<span className="font-mono tabular-nums">{nhtsaRecalls.length}</span>)</span>
                </span>
                <span className="text-xs font-medium text-primary-600 dark:text-emerald-400">View campaigns</span>
              </summary>
              <div className="pb-4 pt-1">
                {nhtsaRecalls.length === 0 ? (
                  <p className="text-xs font-sans text-muted dark:text-zinc-400 px-1">No OEM recalls recorded for this model year.</p>
                ) : (
                  <div className="divide-y divide-border/60 dark:divide-zinc-800 max-h-60 overflow-y-auto overscroll-contain pr-1">
                    {nhtsaRecalls.map((recall, idx) => (
                      <div key={idx} className="py-2.5 px-1 text-xs font-sans">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
                            {recall.campaignNumber}
                          </span>
                          <span className="font-sans font-medium text-[11px] text-muted dark:text-zinc-400 truncate max-w-[240px]">
                            {recall.component}
                          </span>
                        </div>
                        <p className="text-body dark:text-zinc-300 mt-1 leading-relaxed">
                          {recall.summary}
                        </p>
                        {recall.remedy && (
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                            <strong>Remedy:</strong> {recall.remedy}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>

            <details className="dl-disclosure group">
              <summary className="min-h-[48px] py-3 px-1 flex items-center justify-between gap-2 text-xs sm:text-sm font-semibold text-ink dark:text-zinc-100 font-sans">
                <span className="inline-flex items-center gap-2">
                  <ChevronDown aria-hidden="true" className="w-4 h-4 text-muted dark:text-zinc-400 shrink-0 transition-transform duration-200 group-open:rotate-180" />
                  <span>Frequently Reported Components (NHTSA Complaints · <span className="font-mono tabular-nums">{nhtsaComplaints.totalCount}</span>)</span>
                </span>
                <span className="text-xs font-medium text-primary-600 dark:text-emerald-400">Top flaws</span>
              </summary>
              <div className="pb-4 pt-1 divide-y divide-border/60 dark:divide-zinc-800 font-sans text-xs">
                {nhtsaComplaints.topComponents.map((comp, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 px-1">
                    <span className="text-ink dark:text-zinc-200">{comp.component}</span>
                    <span className="font-semibold text-primary-700 dark:text-emerald-400">
                      <span className="font-mono tabular-nums">{comp.count}</span> complaints
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}

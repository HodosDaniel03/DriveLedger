import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Wrench,
  Clock,
  DollarSign,
  Fuel,
  Info,
  RotateCcw,
  Zap,

  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react';
import { vehicleDataService } from '../../services/vehicleDataService.js';
import {
  findEngineVariant,
  getGenerationsForModel,
  getEnginesForGeneration,
  getKnownIssuesForEngine,
} from '../../data/vehicles/index.js';
import { useUnits } from '../../context/UnitContext';

const SEVERITY_COLORS = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-300 dark:border-red-800',
    badge: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-900/60 dark:text-red-200',
    dot: 'bg-red-600',
    label: 'Critical Risk',
  },
  high: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-300 dark:border-amber-800',
    badge: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200',
    dot: 'bg-amber-600',
    label: 'High Risk',
  },
  medium: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    badge: 'bg-yellow-100 text-yellow-900 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200',
    dot: 'bg-yellow-600',
    label: 'Moderate Risk',
  },
  low: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/40',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40',
    dot: 'bg-emerald-600',
    label: 'Low Risk',
  },
};

export default function KnownIssuesDossier({
  presetId,
  vehicleName,
  brand,
  model,
  className = '',
}) {
  const { region, formatCurrency, formatDistance } = useUnits();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [selectedGenId, setSelectedGenId] = useState('');
  const [selectedEngineId, setSelectedEngineId] = useState('');
  const [expandedIssues, setExpandedIssues] = useState({});
  const [showRecalls, setShowRecalls] = useState(false);
  const [showComplaints, setShowComplaints] = useState(false);

  // Derive initial resolved architecture from presetId, model, or vehicleName
  const initialResolved = useMemo(() => {
    return findEngineVariant(presetId || model || vehicleName);
  }, [presetId, model, vehicleName]);

  const activeBrandId = initialResolved?.brand?.id || brand || 'ford';
  const activeBrandName = initialResolved?.brand?.name || brand || 'Ford';
  const activeModelId = initialResolved?.model?.id || model || 'ford-focus';
  const activeModelName = initialResolved?.model?.name || model || 'Focus';

  // Available model generations
  const availableGenerations = useMemo(() => {
    return getGenerationsForModel(activeBrandId, activeModelId);
  }, [activeBrandId, activeModelId]);

  const currentGenId = selectedGenId || initialResolved?.generation?.id || availableGenerations[0]?.id;

  // Available engines for current generation
  const availableEngines = useMemo(() => {
    return getEnginesForGeneration(activeBrandId, activeModelId, currentGenId);
  }, [activeBrandId, activeModelId, currentGenId]);

  const currentEngineId = selectedEngineId || initialResolved?.engine?.id || availableEngines[0]?.id;

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
      year: 2021,
      generationId: currentGenId,
      engineId: targetEngineId,
    });
    setData((prev) => (prev ? {
      ...instant,
      nhtsaRecalls: prev.nhtsaRecalls?.length ? prev.nhtsaRecalls : instant.nhtsaRecalls,
      nhtsaComplaints: prev.nhtsaComplaints?.totalCount ? prev.nhtsaComplaints : instant.nhtsaComplaints,
      fuelEconomy: prev.fuelEconomy?.combinedMpg ? prev.fuelEconomy : instant.fuelEconomy,
    } : instant));

    // 2. Background Revalidation via Live APIs
    setLoading(true);
    try {
      const liveIntel = await vehicleDataService.getVehicleIntelligence({
        make: activeBrandName,
        model: activeModelName,
        year: 2021,
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
  }, [presetId, currentGenId, currentEngineId, brand, model]);

  const toggleIssueExpand = (issueId) => {
    setExpandedIssues((prev) => ({
      ...prev,
      [issueId]: !prev[issueId],
    }));
  };

  const formatCostInRegion = (cost) => {
    if (!cost) return 'N/A';
    if (region === 'EU') return cost.formattedEur;
    if (region === 'UK') {
      const gbpMin = Math.round(cost.parts.min * 0.85);
      const gbpMax = Math.round(cost.parts.max * 0.85 + cost.labor.max * 0.85);
      return `£${gbpMin.toLocaleString()} - £${gbpMax.toLocaleString()}`;
    }
    return cost.formattedUsd;
  };

  if (!data && loading) {
    return (
      <div className={`p-6 rounded-2xl bg-surface border border-border animate-pulse ${className}`}>
        <div className="h-6 bg-surface-subtle rounded w-1/3 mb-4" />
        <div className="h-24 bg-surface-subtle rounded mb-3" />
        <div className="h-24 bg-surface-subtle rounded" />
      </div>
    );
  }

  if (!data) return null;

  const { knownIssues, nhtsaRecalls, nhtsaComplaints, fuelEconomy, metadata, engine } = data;

  return (
    <div className={`rounded-2xl bg-surface dark:bg-[#121215] border border-border dark:border-zinc-800 shadow-sm overflow-hidden ${className}`}>
      {/* Header Banner */}
      <div className="p-5 sm:p-6 border-b border-border dark:border-zinc-800 bg-surface-subtle/50 dark:bg-zinc-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-sans font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                  Known Issues Dossier
                </span>
                <span className={`text-[11px] font-sans px-2 py-0.5 rounded-md font-medium border ${
                  metadata.source === 'live-api'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40'
                    : metadata.source === 'memory-cache' || metadata.source === 'storage-cache'
                    ? 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/60'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40'
                }`}>
                  {metadata.source === 'live-api' && `Live NHTSA/EPA (${metadata.responseTimeMs}ms)`}
                  {(metadata.source === 'memory-cache' || metadata.source === 'storage-cache') && `In-Memory Cache (<1ms)`}
                  {metadata.source === 'curated-fallback' && `Curated Database (<50ms)`}
                </span>
              </div>
              <h3 className="font-sans text-base sm:text-lg font-bold tracking-tight text-ink dark:text-zinc-100 mt-1">
                Engine-Specific Known Issues &amp; OEM Recalls
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-sans text-xs font-semibold text-body hover:text-ink bg-surface dark:bg-zinc-800 border border-border dark:border-zinc-700 shadow-xs hover:bg-surface-subtle transition-colors shrink-0 self-start sm:self-auto"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary-600' : ''}`} />
            <span>Refresh Live Telemetry</span>
          </button>
        </div>

        {/* Interactive Generation & Engine Variant Selector Toolbar */}
        <div className="mt-4 pt-3 border-t border-border/70 dark:border-zinc-800/80 space-y-3">
          {availableGenerations.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-sans font-semibold text-muted dark:text-zinc-400">
                Generation:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableGenerations.map((gen) => {
                  const isActive = gen.id === currentGenId;
                  return (
                    <button
                      key={gen.id}
                      type="button"
                      onClick={() => {
                        setSelectedGenId(gen.id);
                        if (gen.engines && gen.engines.length > 0) {
                          setSelectedEngineId(gen.engines[0].id);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-sans font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-600 text-white font-bold shadow-xs'
                          : 'bg-surface dark:bg-zinc-800 text-body hover:text-ink border border-border dark:border-zinc-700'
                      }`}
                    >
                      {gen.name} (<span className="font-mono tabular-nums">{gen.years.from}–{gen.years.to || 'present'}</span>)
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {availableEngines.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-sans font-semibold text-muted dark:text-zinc-400">
                Engine Code / Powertrain:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableEngines.map((eng) => {
                  const isActive = eng.id === currentEngineId;
                  return (
                    <button
                      key={eng.id}
                      type="button"
                      onClick={() => setSelectedEngineId(eng.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-sans font-medium transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-amber-600 dark:bg-amber-500 text-white font-bold shadow-xs'
                          : 'bg-surface dark:bg-zinc-800 text-body hover:text-ink border border-border dark:border-zinc-700'
                      }`}
                    >
                      <span>{eng.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-amber-700/60 text-white' : 'bg-surface-subtle text-muted'
                      }`}>
                        {eng.fuelType}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Powertrain Telemetry Strip */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-sans font-medium pt-1">
            <span className="font-bold text-ink dark:text-zinc-200">
              {engine?.name || vehicleName || `${data.brand} ${data.model}`}
            </span>
            {engine?.engineCode && (
              <span className="text-muted dark:text-zinc-400">
                [{engine.engineCode}]
              </span>
            )}
            {engine?.powerHp && (
              <span className="text-muted dark:text-zinc-400 font-mono tabular-nums">
                · {engine.powerHp} LE {engine.torqueNm ? `· ${engine.torqueNm} Nm` : ''}
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
      <div className="p-5 sm:p-6 space-y-6">
        {/* Known Issues Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted dark:text-zinc-400 font-sans flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Identified Known Flaws (<span className="font-mono tabular-nums">{knownIssues.length}</span>)</span>
            </h4>
            <span className="text-[11px] text-muted dark:text-zinc-400 font-sans font-medium">
              With Parts + Labor breakdown
            </span>
          </div>

          {knownIssues.length === 0 ? (
            <div className="p-4 rounded-xl bg-surface-subtle dark:bg-zinc-800/40 text-center text-xs font-sans text-muted dark:text-zinc-400">
              No critical known issues recorded for this configuration.
            </div>
          ) : (
            <div className="space-y-3">
              {knownIssues.map((issue) => {
                const styling = SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.medium;
                const isExpanded = Boolean(expandedIssues[issue.id]);

                return (
                  <div
                    key={issue.id}
                    className={`rounded-xl border p-4 transition-all duration-150 ${styling.bg} ${styling.border}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] font-sans font-medium px-2 py-0.5 rounded-md border ${styling.badge}`}>
                            {styling.label}
                          </span>
                          <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
                            {issue.category}
                          </span>
                          <span className="text-xs font-mono tabular-nums font-semibold text-ink dark:text-zinc-200 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-muted" />
                            {issue.criticalMileage.display}
                          </span>
                        </div>
                        <h5 className="font-sans text-sm font-bold tracking-tight text-ink dark:text-zinc-100 mt-1">
                          {issue.name}
                        </h5>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono tabular-nums font-bold text-primary-700 dark:text-primary-300 block">
                          {formatCostInRegion(issue.repairCost)}
                        </span>
                        <span className="text-[10px] font-sans font-medium text-muted dark:text-zinc-400">
                          Parts + Labor
                        </span>
                      </div>
                    </div>

                    {/* Symptoms concise 1 line */}
                    <div className="mt-3 font-sans text-xs text-body dark:text-zinc-300 flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold text-ink dark:text-zinc-200">Symptoms: </strong>
                        <span>{issue.symptoms}</span>
                      </div>
                    </div>

                    {/* Expandable Prevention & Details */}
                    <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleIssueExpand(issue.id)}
                        className="font-sans text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>{isExpanded ? 'Hide details' : 'Prevention guide & costs'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {issue.obdCodes && issue.obdCodes.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-sans font-medium text-muted">DTC Codes:</span>
                          {issue.obdCodes.map((code) => (
                            <span
                              key={code}
                              className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-ink dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-3 p-3 rounded-lg bg-surface/80 dark:bg-zinc-900/80 border border-border dark:border-zinc-800 text-xs font-sans space-y-2">
                        <div>
                          <strong className="font-semibold block text-[11px] uppercase tracking-wide font-sans text-emerald-700 dark:text-emerald-400">
                            🛡️ Prevention Protocol:
                          </strong>
                          <p className="mt-0.5 text-body dark:text-zinc-300 leading-relaxed">
                            {issue.prevention}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-border/50 dark:border-zinc-800/50 grid grid-cols-2 sm:grid-cols-3 gap-2 font-sans text-[11px]">
                          <div>
                            <span className="text-muted block">Parts Range:</span>
                            <span className="font-bold font-mono tabular-nums text-ink dark:text-zinc-200">
                              €{issue.repairCost.parts.min} – €{issue.repairCost.parts.max}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted block">Labor Range:</span>
                            <span className="font-bold font-mono tabular-nums text-ink dark:text-zinc-200">
                              €{issue.repairCost.labor.min} – €{issue.repairCost.labor.max}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted block">Affected Components:</span>
                            <span className="font-semibold text-ink dark:text-zinc-200 truncate block">
                              {issue.affectedComponents.join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live NHTSA & EPA Telemetry Overview Section */}
        <div className="pt-4 border-t border-border dark:border-zinc-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted dark:text-zinc-400 font-sans mb-3 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-primary-500" />
            <span>Verified External Telemetry (NHTSA &amp; EPA FuelEconomy)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
            {/* Recalls Stat Card */}
            <div className="p-3.5 rounded-xl bg-surface-subtle dark:bg-zinc-800/50 border border-border dark:border-zinc-700/80">
              <span className="text-[11px] font-medium text-muted dark:text-zinc-400 block">OEM Recalls (NHTSA)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono tabular-nums text-ink dark:text-zinc-100">
                  {nhtsaRecalls.length}
                </span>
                <button
                  type="button"
                  onClick={() => setShowRecalls(!showRecalls)}
                  className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {showRecalls ? 'Hide' : 'Campaigns'}
                </button>
              </div>
            </div>

            {/* Complaints Stat Card */}
            <div className="p-3.5 rounded-xl bg-surface-subtle dark:bg-zinc-800/50 border border-border dark:border-zinc-700/80">
              <span className="text-[11px] font-medium text-muted dark:text-zinc-400 block">Owner Complaints (NHTSA)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono tabular-nums text-ink dark:text-zinc-100">
                  {nhtsaComplaints.totalCount}
                </span>
                <button
                  type="button"
                  onClick={() => setShowComplaints(!showComplaints)}
                  className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {showComplaints ? 'Hide' : 'Top Flaws'}
                </button>
              </div>
            </div>

            {/* EPA Fuel Economy Stat Card */}
            <div className="p-3.5 rounded-xl bg-surface-subtle dark:bg-zinc-800/50 border border-border dark:border-zinc-700/80">
              <span className="text-[11px] font-medium text-muted dark:text-zinc-400 block">Official EPA Fuel Economy</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono tabular-nums text-ink dark:text-zinc-100">
                  {fuelEconomy.lPer100Km} <span className="text-xs font-sans font-normal text-muted">L/100km</span>
                </span>
                <span className="text-xs font-mono tabular-nums font-semibold text-muted">
                  {fuelEconomy.combinedMpg} MPG
                </span>
              </div>
            </div>
          </div>

          {/* Expanded Recalls Drawer */}
          {showRecalls && (
            <div className="mt-3 p-4 rounded-xl bg-surface-subtle dark:bg-zinc-800/60 border border-border dark:border-zinc-700 space-y-3">
              <h5 className="text-xs font-bold text-ink dark:text-zinc-100 font-sans uppercase tracking-wider">
                OEM Recall Campaigns (<span className="font-mono tabular-nums">{nhtsaRecalls.length}</span>)
              </h5>
              {nhtsaRecalls.length === 0 ? (
                <p className="text-xs font-sans text-muted">No OEM recalls recorded for this model year.</p>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {nhtsaRecalls.map((recall, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-surface dark:bg-[#121215] border border-border dark:border-zinc-800 text-xs font-sans">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono tabular-nums font-bold text-red-600 dark:text-red-400">
                          {recall.campaignNumber}
                        </span>
                        <span className="font-sans font-medium text-[10px] text-muted truncate max-w-[200px]">
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
          )}

          {/* Expanded Complaints Drawer */}
          {showComplaints && (
            <div className="mt-3 p-4 rounded-xl bg-surface-subtle dark:bg-zinc-800/60 border border-border dark:border-zinc-700 space-y-3">
              <h5 className="text-xs font-bold text-ink dark:text-zinc-100 font-sans uppercase tracking-wider">
                Frequently Reported Components (NHTSA Complaints)
              </h5>
              <div className="space-y-1.5 font-sans text-xs">
                {nhtsaComplaints.topComponents.map((comp, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-border/40 dark:border-zinc-700/40">
                    <span className="text-ink dark:text-zinc-200">{comp.component}</span>
                    <span className="font-bold text-primary-600 dark:text-primary-400"><span className="font-mono tabular-nums">{comp.count}</span> complaints</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

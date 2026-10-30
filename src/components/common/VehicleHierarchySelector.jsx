import React, { useState, useMemo, useEffect } from 'react';
import {
  Car,
  Search,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Check,
  RotateCcw,
  ShieldAlert,
  Fuel,
  Zap,
  Filter,
  X,
  Gauge,
  ArrowRight,
} from 'lucide-react';
import {
  VEHICLE_CATALOG,
  CATALOG_GROUPS,
  getAllCatalogBrands,
  getModelsForBrand,
  getEnginesForModel,
  searchCatalog,
  findEngineById,
  findCatalogHierarchyByEngineId,
  normalizeSearchText,
} from '../../data/vehicleCatalog';
import { VEHICLE_PRESETS, getPresetById } from '../../data/vehiclePresets';
import { useUnits } from '../../context/UnitContext';

const FUEL_BADGES = {
  Diesel: {
    badge: 'bg-primary-50 text-primary-700 border border-primary-100',
    dot: 'bg-primary-600',
  },
  Gasoline: {
    badge: 'bg-surface-subtle text-ink border border-border',
    dot: 'bg-muted',
  },
  Hybrid: {
    badge: 'bg-success-bg text-success-text border border-[#BFE8CF]',
    dot: 'bg-score-good',
  },
  'Plug-in Hybrid': {
    badge: 'bg-success-bg text-success-text border border-[#BFE8CF]',
    dot: 'bg-score-good',
  },
  Electric: {
    badge: 'bg-success-bg text-success-text border border-[#BFE8CF]',
    dot: 'bg-score-good',
  },
};

export default function VehicleHierarchySelector({
  selectedPresetId,
  onSelectPreset,
  className = '',
  embedded = true,
  title = 'Vehicle Catalog & Hierarchy Selector',
}) {
  const { formatCurrency } = useUnits();

  // Active vehicle preset
  const activePreset = useMemo(
    () => getPresetById(selectedPresetId),
    [selectedPresetId]
  );

  // Selector mode: 'cascade' (3-step) | 'search' (quick search)
  const [activeMode, setActiveMode] = useState('cascade');

  // Cascade step: 1 (Brand) | 2 (Model) | 3 (Engine)
  const [step, setStep] = useState(1);

  // Selected brand and model in the wizard
  const initialHierarchy = useMemo(
    () => findCatalogHierarchyByEngineId(activePreset.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [selectedBrandName, setSelectedBrandName] = useState(
    initialHierarchy ? initialHierarchy.brand.name : activePreset.brand
  );
  const [selectedModelId, setSelectedModelId] = useState(
    initialHierarchy ? initialHierarchy.model.id : null
  );

  // Group filter for brands (All, German, Japanese, etc.)
  const [selectedGroup, setSelectedGroup] = useState('All');

  // Search filter for brands within Step 1
  const [brandSearchQuery, setBrandSearchQuery] = useState('');

  // Global search input
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Sync internal state when activePreset changes from outside or via popstate
  useEffect(() => {
    if (activePreset) {
      const match = findCatalogHierarchyByEngineId(activePreset.id);
      if (match) {
        setSelectedBrandName(match.brand.name);
        setSelectedModelId(match.model.id);
      } else if (activePreset.brand) {
        setSelectedBrandName(activePreset.brand);
        const models = getModelsForBrand(activePreset.brand);
        if (models.length > 0) {
          setSelectedModelId(models[0].id);
        }
      }
    }
  }, [activePreset]);

  // Filtered brands for Step 1 (diacritic-insensitive)
  const filteredBrands = useMemo(() => {
    let list = VEHICLE_CATALOG;
    if (selectedGroup !== 'All') {
      list = list.filter((b) => b.group === selectedGroup);
    }
    if (brandSearchQuery.trim()) {
      const q = normalizeSearchText(brandSearchQuery);
      list = list.filter(
        (b) =>
          normalizeSearchText(b.name).includes(q) ||
          normalizeSearchText(b.country).includes(q) ||
          normalizeSearchText(b.badge).includes(q)
      );
    }
    return list;
  }, [selectedGroup, brandSearchQuery]);

  // Models for selected brand (Step 2)
  const currentBrandModels = useMemo(() => {
    return getModelsForBrand(selectedBrandName);
  }, [selectedBrandName]);

  // Engines for selected model (Step 3)
  const currentModelEngines = useMemo(() => {
    if (!selectedModelId) return [];
    const model = currentBrandModels.find((m) => m.id === selectedModelId);
    return model ? model.engines : [];
  }, [selectedModelId, currentBrandModels]);

  // Global search results
  const searchResults = useMemo(() => {
    if (!globalSearchQuery.trim()) return [];
    return searchCatalog(globalSearchQuery).slice(0, 16);
  }, [globalSearchQuery]);

  // Handlers
  const handleSelectBrand = (brandName) => {
    setSelectedBrandName(brandName);
    const models = getModelsForBrand(brandName);
    if (models.length > 0) {
      setSelectedModelId(models[0].id);
      setStep(2);
    }
  };

  const handleSelectModel = (modelId) => {
    setSelectedModelId(modelId);
    setStep(3);
  };

  const handleSelectEngine = (engineId) => {
    onSelectPreset(engineId);
  };

  const handleGlobalSelect = (engineId) => {
    onSelectPreset(engineId);
    setGlobalSearchQuery('');
    const match = findCatalogHierarchyByEngineId(engineId);
    if (match) {
      setSelectedBrandName(match.brand.name);
      setSelectedModelId(match.model.id);
      setStep(3);
    }
  };

  const selectedModelObj = currentBrandModels.find((m) => m.id === selectedModelId);

  return (
    <div
      className={`rounded-2xl bg-surface border border-border shadow-card overflow-hidden transition-all ${className}`}
    >
      {/* 1. Header Bar: Active Vehicle Badge & Mode Switcher */}
      <div className="p-4 sm:p-5 border-b border-border bg-surface-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Active Vehicle Status Chip */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 border border-primary-100">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                  {activePreset.brand}
                </span>
                <span className="text-xs font-mono text-muted">
                  {activePreset.powerHp} HP · {activePreset.fuelType} · {formatCurrency(activePreset.purchasePriceUsd)}
                </span>
                {activePreset.criticalDefectTag && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-warning-bg text-warning-text border border-[#F5DE8A] truncate max-w-[200px]">
                    {activePreset.criticalDefectTag}
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-ink truncate mt-0.5">
                {activePreset.name}
              </h2>
            </div>
          </div>

          {/* Mode Tabs: 3-Step Picker vs Global Search */}
          <div className="flex items-center gap-1 self-start lg:self-auto bg-surface p-1 rounded-full border border-border text-xs font-semibold shadow-sm">
            <button
              type="button"
              onClick={() => setActiveMode('cascade')}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeMode === 'cascade'
                  ? 'bg-primary-600 text-white shadow-sm font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Make · Model · Engine</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('search')}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeMode === 'search'
                  ? 'bg-primary-600 text-white shadow-sm font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Quick Finder</span>
            </button>
          </div>
        </div>

        {/* Cascading Breadcrumb Navigation (when in cascade mode) */}
        {activeMode === 'cascade' && (
          <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-mono text-muted uppercase font-semibold">
              Selection Steps:
            </span>

            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 border ${
                step === 1
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm font-semibold'
                  : 'bg-surface text-ink border-border hover:border-primary-600'
              }`}
            >
              <span className="text-muted">1. Make:</span>
              <strong className="font-bold">{selectedBrandName || 'Select'}</strong>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-muted" />

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => {
                if (selectedBrandName) setStep(2);
              }}
              disabled={!selectedBrandName}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 border ${
                step === 2
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm font-semibold'
                  : 'bg-surface text-ink border-border hover:border-primary-600 disabled:opacity-50'
              }`}
            >
              <span className="text-muted">2. Model:</span>
              <strong className="font-bold">{selectedModelObj?.name || 'Select'}</strong>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-muted" />

            {/* Step 3 Pill */}
            <button
              type="button"
              onClick={() => {
                if (selectedModelId) setStep(3);
              }}
              disabled={!selectedModelId}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 border ${
                step === 3
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm font-semibold'
                  : 'bg-surface text-ink border-border hover:border-primary-600 disabled:opacity-50'
              }`}
            >
              <span className="text-muted">3. Engine:</span>
              <strong className="font-bold truncate max-w-[140px]">
                {activePreset.shortName || 'Select'}
              </strong>
            </button>
          </div>
        )}
      </div>

      {/* 2. Mode Content: Global Instant Search */}
      {activeMode === 'search' && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-muted absolute left-4 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Search by make, model, engine code or keyword (e.g. 'Golf 2.0 TDI', 'BMW 320d', 'Passat B8')..."
              className="w-full bg-surface text-ink border border-border-strong rounded-full pl-11 pr-10 py-2.5 text-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15 outline-none transition-all placeholder:text-faint shadow-sm"
            />
            {globalSearchQuery && (
              <button
                type="button"
                onClick={() => setGlobalSearchQuery('')}
                className="absolute right-3.5 top-3 p-1 rounded-full text-muted hover:text-ink hover:bg-surface-subtle"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Results Display */}
          {globalSearchQuery.trim() ? (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              <div className="text-[11px] font-mono text-muted uppercase tracking-wider font-semibold">
                Matching Vehicles ({searchResults.length}):
              </div>
              {searchResults.length === 0 ? (
                <div className="py-8 text-center text-muted text-xs">
                  No vehicles found matching your query. Try searching by brand or model name.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {searchResults.map(({ engine, brand, model }) => {
                    const isSelected = engine.id === selectedPresetId;
                    const fuelStyle = FUEL_BADGES[engine.fuelType] || FUEL_BADGES.Gasoline;
                    return (
                      <div
                        key={engine.id}
                        onClick={() => handleGlobalSelect(engine.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-primary-50/50 border-primary-600 shadow-sm ring-1 ring-primary-600'
                            : 'bg-surface border-border hover:border-primary-600 shadow-sm'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-mono uppercase font-bold text-muted">
                              {brand.name} · {model.name}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${fuelStyle.badge}`}
                            >
                              {engine.fuelType}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-ink leading-snug">
                            {engine.name}
                          </h4>
                          <p className="text-[11px] font-mono text-muted mt-1">
                            {engine.powerHp} HP · {engine.engineCode}
                          </p>
                        </div>

                        <div className="pt-2.5 mt-2.5 border-t border-border flex items-center justify-between text-xs">
                          <span className="font-bold text-primary-700 font-mono">
                            {formatCurrency(engine.purchasePriceUsd)}
                          </span>
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-success-text font-bold">
                              <Check className="w-3.5 h-3.5" /> Selected
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted hover:text-primary-600 flex items-center gap-0.5 font-medium">
                              Select <ArrowRight className="w-3 h-3 ml-0.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-muted">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-primary-600 opacity-70" />
              <p className="font-semibold text-ink">
                Instant Vehicle Intelligence Search
              </p>
              <p className="text-[11px] text-muted mt-1">
                Type a vehicle model or engine (e.g. &ldquo;Golf 2.0 TDI&rdquo;, &ldquo;BMW 320d&rdquo;, &ldquo;Model 3&rdquo;) to search.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. Mode Content: 3-Step Workshop Picker */}
      {activeMode === 'cascade' && (
        <div className="p-4 sm:p-5">
          {/* STEP 1: Select Brand */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Regional Group Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-border">
                {CATALOG_GROUPS.map((grp) => {
                  const isActive = selectedGroup === grp;
                  return (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setSelectedGroup(grp)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                        isActive
                          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                          : 'bg-surface-subtle text-muted border-border hover:border-border-strong hover:text-ink'
                      }`}
                    >
                      {grp === 'All' ? 'All Makes (35)' : grp}
                    </button>
                  );
                })}
              </div>

              {/* Brand Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-muted absolute left-3.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={brandSearchQuery}
                  onChange={(e) => setBrandSearchQuery(e.target.value)}
                  placeholder="Filter makes (e.g. Volkswagen, BMW, Toyota, Ford)..."
                  className="w-full bg-surface text-ink border border-border-strong rounded-full pl-9 pr-3 py-2 text-xs focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15 outline-none transition-all shadow-sm"
                />
              </div>

              {/* Brand Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredBrands.map((b) => {
                  const isCurrent = selectedBrandName === b.name;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleSelectBrand(b.name)}
                      className={`p-3 rounded-xl border text-left transition-all hover:-translate-y-0.5 flex items-center justify-between ${
                        isCurrent
                          ? 'bg-primary-50/50 border-primary-600 shadow-sm ring-1 ring-primary-600'
                          : 'bg-surface border-border hover:border-primary-600 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-base select-none">{b.countryFlag}</span>
                        <div className="truncate">
                          <div className="text-xs font-bold text-ink truncate">
                            {b.name}
                          </div>
                          <div className="text-[10px] font-mono text-muted">
                            {b.models.length} models
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Select Model */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1"
                >
                  ← Back to Makes ({selectedBrandName})
                </button>
                <span className="text-xs font-mono text-muted">
                  {currentBrandModels.length} available models
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {currentBrandModels.map((m) => {
                  const isSelected = selectedModelId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectModel(m.id)}
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-primary-50/50 border-primary-600 shadow-sm ring-1 ring-primary-600'
                          : 'bg-surface border-border hover:border-primary-600 shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-sm font-bold text-ink">
                            {m.name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-subtle text-body border border-border uppercase">
                            {m.bodyType}
                          </span>
                        </div>
                        <p className="text-xs text-muted font-mono">
                          {m.generations}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs">
                        <span className="text-[11px] font-mono text-primary-700 font-semibold">
                          {m.engines.length} powertrains
                        </span>
                        <span className="text-primary-600 flex items-center gap-0.5 font-bold">
                          Select <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Select Engine / Powertrain */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1"
                >
                  ← Back to Models ({selectedBrandName} · {selectedModelObj?.name})
                </button>
                <span className="text-xs font-mono text-muted">
                  {currentModelEngines.length} engines available
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {currentModelEngines.map((eng) => {
                  const isCurrent = eng.id === selectedPresetId;
                  const fuelStyle = FUEL_BADGES[eng.fuelType] || FUEL_BADGES.Gasoline;
                  return (
                    <div
                      key={eng.id}
                      onClick={() => handleSelectEngine(eng.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-primary-50/50 border-primary-600 shadow-sm ring-1 ring-primary-600'
                          : 'bg-surface border-border hover:border-primary-600 shadow-sm'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${fuelStyle.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${fuelStyle.dot}`} />
                            {eng.fuelType}
                          </span>
                          <span className="text-xs font-bold text-ink">
                            {eng.name}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted font-mono">
                          <span>Code: <strong>{eng.engineCode}</strong></span>
                          <span>·</span>
                          <span>Output: <strong className="text-ink">{eng.powerHp} HP</strong></span>
                          <span>·</span>
                          <span>Transmission: <strong>{eng.transmissionLabel}</strong></span>
                        </div>
                        {eng.criticalDefectTag && (
                          <div className="text-[11px] font-mono text-warning-text font-semibold pt-0.5">
                            {eng.criticalDefectTag}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 sm:shrink-0 self-end sm:self-center">
                        <div className="text-right">
                          <div className="text-sm font-bold text-ink font-mono tabular-nums">
                            {formatCurrency(eng.purchasePriceUsd)}
                          </div>
                          <div className="text-[10px] font-mono text-muted">
                            Market Baseline
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectEngine(eng.id);
                          }}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            isCurrent
                              ? 'bg-score-good text-white shadow-sm'
                              : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'
                          }`}
                        >
                          {isCurrent ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <span>Select</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

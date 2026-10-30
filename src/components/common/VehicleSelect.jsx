import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Cpu, ShieldAlert, Layers, Fuel } from 'lucide-react';
import { SelectField } from './OdometerPrimitives';
import { useUnits } from '../../context/UnitContext';
import {
  VEHICLE_CATALOG,
  getAllCatalogBrands,
  getModelsForBrand,
  getEnginesForModel,
  findCatalogHierarchyByEngineId,
} from '../../data/vehicleCatalog';
import { VEHICLE_PRESETS, getPresetById } from '../../data/vehiclePresets';

const LUXURY_BRANDS = new Set([
  'porsche',
  'bmw',
  'mercedes-benz',
  'audi',
  'land rover',
  'jaguar',
  'lexus',
  'volvo',
  'alfa romeo',
  'cadillac',
  'genesis',
  'tesla',
]);

const ECONOMY_RELIABILITY_BRANDS = new Set([
  'toyota',
  'honda',
  'mazda',
  'suzuki',
  'subaru',
  'hyundai',
  'kia',
  'nissan',
  'mitsubishi',
  'dacia',
]);

function normalizeText(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function resolvePresetArchetype(preset) {
  if (!preset) {
    return {
      id: 'standard-ice',
      label: 'Standard ICE Powertrain',
      shortBadge: 'ICE Powertrain',
    };
  }
  const archObj = preset.archetype && typeof preset.archetype === 'object' ? preset.archetype : null;
  const explicitId = preset.archetypeId || archObj?.id || '';
  const explicitLabel =
    archObj?.shortLabel ||
    archObj?.name ||
    archObj?.label ||
    preset.archetypeLabel ||
    preset.archetypeName ||
    '';

  const fuel = String(preset.fuelType || '').toLowerCase();
  const pt = String(preset.powertrain || '').toLowerCase();
  const tx = String(preset.transmission || '').toLowerCase();
  const defect = String(preset.criticalDefectTag || '').toLowerCase();
  const eng = String(preset.engineCode || '').toLowerCase();

  let derivedId = explicitId;
  let derivedLabel = explicitLabel;

  if (!derivedId) {
    if (preset.isEv || fuel === 'ev' || fuel === 'electric' || pt === 'ev') {
      derivedId = 'bev-lithium';
    } else if (fuel.includes('hybrid') || fuel.includes('phev') || pt === 'hybrid') {
      derivedId = 'toyota-hybrid-ecvt';
    } else if (fuel === 'diesel' || pt === 'diesel') {
      derivedId = 'euro6-diesel-dpf-wetbelt';
    } else if (defect.includes('wet') && defect.includes('belt')) {
      derivedId = 'puretech-ecoboost-wetbelt';
    } else if (tx.includes('dct') || tx.includes('dsg') || eng.includes('ea888') || eng.includes('tsi')) {
      derivedId = 'direct-inj-turbo-petrol';
    } else if (pt.includes('turbo')) {
      derivedId = 'direct-inj-turbo-petrol';
    } else {
      derivedId = 'naturally_aspirated_ice';
    }
  }

  if (!derivedLabel) {
    const idNorm = derivedId.toLowerCase();
    if (idNorm.includes('bev') || idNorm.includes('ev')) {
      derivedLabel = 'BEV Lithium Electric Drive';
    } else if (idNorm.includes('phev')) {
      derivedLabel = 'PHEV Turbo + Dual-Clutch';
    } else if (idNorm.includes('hybrid')) {
      derivedLabel = 'Hybrid Atkinson e-CVT';
    } else if (idNorm.includes('vag') && idNorm.includes('tdi')) {
      derivedLabel = 'VAG 2.0 TDI + Wet DSG';
    } else if (idNorm.includes('b47') || idNorm.includes('zf8')) {
      derivedLabel = 'Exec Diesel + ZF 8HP';
    } else if (idNorm.includes('diesel') || idNorm.includes('dpf')) {
      derivedLabel = 'Euro 6 Diesel (DPF/Wet-Belt)';
    } else if (idNorm.includes('wetbelt') || idNorm.includes('wet_belt') || idNorm.includes('puretech')) {
      derivedLabel = 'Turbo GDI Wet-Belt Architecture';
    } else if (idNorm.includes('turbo') || idNorm.includes('direct-inj')) {
      derivedLabel = 'Direct-Injection Turbo Petrol';
    } else {
      derivedLabel =
        derivedId
          .replace(/[_-]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Standard Powertrain';
    }
  }

  return {
    id: derivedId,
    label: derivedLabel,
    shortBadge: archObj?.shortLabel || preset.powertrainLabel || derivedLabel,
  };
}

export function resolvePresetBrandTier(preset) {
  if (!preset) {
    return {
      tierId: 'mainstream',
      label: 'Mainstream Global Marque',
      multiplierLabel: '1.15x Parts · 1.05x Labor',
      tone: 'neutral',
    };
  }

  const explicitTier = String(preset.brandTier || preset.brandTierId || '');
  const explicitLabel = preset.brandTierLabel || '';
  const brandNorm = String(preset.brand || '').toLowerCase().trim();
  const partsMult = preset.brandTierMultiplier ? `${Number(preset.brandTierMultiplier).toFixed(2)}x Parts` : null;
  const laborMult = preset.brandLaborMultiplier ? `${Number(preset.brandLaborMultiplier).toFixed(2)}x Labor` : null;
  const combinedMult = [partsMult, laborMult].filter(Boolean).join(' · ');

  if (
    explicitTier.toLowerCase().includes('premium') ||
    explicitTier.toLowerCase().includes('luxury') ||
    explicitTier === 'tier3' ||
    LUXURY_BRANDS.has(brandNorm)
  ) {
    return {
      tierId: explicitTier || 'premium',
      label: explicitLabel || 'German / Luxury Premium',
      multiplierLabel: combinedMult || '1.55x Parts · 1.45x Labor',
      tone: 'warn',
    };
  }

  if (explicitTier.toLowerCase() === 'ev') {
    return {
      tierId: 'ev',
      label: explicitLabel || 'Dedicated EV Architecture',
      multiplierLabel: combinedMult || '0.90x Parts · 1.20x Labor',
      tone: 'brand',
    };
  }

  if (
    explicitTier.toLowerCase().includes('economy') ||
    explicitTier.toLowerCase().includes('asian') ||
    explicitTier === 'tier1' ||
    ECONOMY_RELIABILITY_BRANDS.has(brandNorm)
  ) {
    return {
      tierId: explicitTier || 'economy',
      label: explicitLabel || 'Economy / Value Marque',
      multiplierLabel: combinedMult || '1.00x Parts · 0.95x Labor',
      tone: 'good',
    };
  }

  return {
    tierId: explicitTier || 'mainstream',
    label: explicitLabel || 'Mainstream Global Marque',
    multiplierLabel: combinedMult || '1.15x Parts · 1.05x Labor',
    tone: 'neutral',
  };
}

export default function VehicleSelect({
  selectedPresetId,
  onSelectPreset,
  selectDropdownId = 'preset-select-dropdown',
  className = '',
}) {
  let unitCtx = null;
  try {
    unitCtx = useUnits();
  } catch {
    unitCtx = null;
  }

  const formatVehiclePrice = (usdAmount) => {
    const val = Number(usdAmount) || 0;
    if (unitCtx && typeof unitCtx.formatCurrency === 'function') {
      return unitCtx.formatCurrency(val);
    }
    return `$${Math.round(val).toLocaleString('en-US')}`;
  };

  // Command Search & Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // 120ms debounce for command search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setDebouncedQuery('');
      return undefined;
    }
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      setDebouncedQuery(trimmed);
      return undefined;
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, 120);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const effectiveSearchQuery = (debouncedQuery || searchQuery).trim();

  // Filter VEHICLE_PRESETS across name, brand, modelName, engineCode, criticalDefectTag, archetypeId, and commonObdCodes
  const autocompleteMatches = useMemo(() => {
    const normQ = normalizeText(effectiveSearchQuery);
    if (!normQ) return [];

    const tokens = normQ.split(/\s+/).filter(Boolean);
    const scored = [];

    for (const preset of VEHICLE_PRESETS) {
      const arch = resolvePresetArchetype(preset);
      const tier = resolvePresetBrandTier(preset);
      const obdStr = Array.isArray(preset.commonObdCodes) ? preset.commonObdCodes.join(' ') : '';

      const nameNorm = normalizeText(preset.name);
      const shortNorm = normalizeText(preset.shortName);
      const brandNorm = normalizeText(preset.brand);
      const modelNorm = normalizeText(preset.modelName);
      const engineNorm = normalizeText(preset.engineCode);
      const defectNorm = normalizeText(preset.criticalDefectTag);
      const archNorm = normalizeText(`${preset.archetypeId || ''} ${arch.id} ${arch.label}`);
      const obdNorm = normalizeText(obdStr);
      const fuelNorm = normalizeText(preset.fuelType);
      const transNorm = normalizeText(`${preset.transmission || ''} ${preset.transmissionLabel || ''}`);
      const notesNorm = normalizeText(preset.knownRiskNotes);
      const tierNorm = normalizeText(`${preset.brandTier || ''} ${tier.tierId} ${tier.label}`);
      const yearNorm = String(preset.year || '');

      const fullCorpus = [
        nameNorm,
        shortNorm,
        brandNorm,
        modelNorm,
        engineNorm,
        defectNorm,
        archNorm,
        obdNorm,
        fuelNorm,
        transNorm,
        notesNorm,
        tierNorm,
        yearNorm,
      ].join(' ');

      const isMatch =
        fullCorpus.includes(normQ) ||
        (tokens.length > 1 && tokens.every((tok) => fullCorpus.includes(tok)));

      if (isMatch) {
        let score = 0;
        if (brandNorm.startsWith(normQ) || modelNorm.startsWith(normQ)) score += 50;
        if (engineNorm.includes(normQ)) score += 45;
        if (nameNorm.includes(normQ) || shortNorm.includes(normQ)) score += 35;
        if (obdNorm.includes(normQ)) score += 40;
        if (defectNorm.includes(normQ)) score += 30;
        if (archNorm.includes(normQ)) score += 25;
        scored.push({ preset, arch, tier, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 8);
  }, [effectiveSearchQuery]);

  const activePreset = useMemo(
    () => getPresetById(selectedPresetId),
    [selectedPresetId]
  );

  const activeArchetype = useMemo(
    () => resolvePresetArchetype(activePreset),
    [activePreset]
  );

  const activeBrandTier = useMemo(
    () => resolvePresetBrandTier(activePreset),
    [activePreset]
  );

  // Find hierarchy from vehicle catalog and gracefully handle any normalized preset from VEHICLE_PRESETS
  const hierarchy = useMemo(() => {
    const found = findCatalogHierarchyByEngineId(selectedPresetId);
    if (found) {
      return {
        brand: found.brand,
        model: found.model,
        engine: getPresetById(found.engine.id) || found.engine,
      };
    }

    const activeBrandName = (activePreset.brand || '').trim();
    const activeModelName = (activePreset.modelName || '').trim();
    const normBrand = normalizeText(activeBrandName);
    const normModel = normalizeText(activeModelName);

    const brandObj =
      VEHICLE_CATALOG.find((b) => normalizeText(b.name) === normBrand) ||
      (activeBrandName
        ? {
            id: normBrand,
            name: activeBrandName,
            models: [
              {
                id: normModel || 'default-model',
                name: activeModelName || activePreset.shortName || 'Model',
                engines: [activePreset],
              },
            ],
          }
        : VEHICLE_CATALOG[0]);

    const matchedCatalogModel = brandObj.models.find((m) => {
      const mNorm = normalizeText(m.name);
      return (
        mNorm === normModel ||
        (normModel && mNorm && (normModel.includes(mNorm) || mNorm.includes(normModel)))
      );
    });

    const modelObj =
      matchedCatalogModel ||
      (activeModelName
        ? {
            id: normModel,
            name: activeModelName,
            engines: [activePreset],
          }
        : brandObj.models[0]);

    const engineObj =
      modelObj.engines?.find((e) => e.id === selectedPresetId) ||
      activePreset ||
      modelObj.engines?.[0];

    return { brand: brandObj, model: modelObj, engine: engineObj };
  }, [selectedPresetId, activePreset]);

  const currentBrand = hierarchy.brand;
  const currentModel = hierarchy.model;
  const currentEngine = hierarchy.engine;

  const brands = useMemo(() => {
    const catalogBrands = getAllCatalogBrands();
    const seen = new Set(catalogBrands.map((b) => normalizeText(b.name)));
    const extraBrands = [];

    for (const p of VEHICLE_PRESETS) {
      const pBrandNorm = normalizeText(p.brand);
      if (p.brand && pBrandNorm && !seen.has(pBrandNorm)) {
        seen.add(pBrandNorm);
        extraBrands.push({
          id: pBrandNorm,
          name: p.brand,
          group: 'Global',
          country: '',
          countryFlag: '🚗',
          badge: p.brand.slice(0, 3).toUpperCase(),
          modelCount: 1,
        });
      }
    }
    return [...catalogBrands, ...extraBrands];
  }, []);

  const models = useMemo(() => {
    const catalogModels = [...getModelsForBrand(currentBrand.name)];
    const normBrand = normalizeText(currentBrand.name);

    // Include any normalized presets for this brand whose model is not yet in catalogModels
    for (const p of VEHICLE_PRESETS) {
      if (normalizeText(p.brand) !== normBrand) continue;
      const pModelName = (p.modelName || '').trim();
      const pModelNorm = normalizeText(pModelName);
      if (!pModelNorm) continue;

      const exists = catalogModels.some((m) => {
        const mNorm = normalizeText(m.name);
        return mNorm === pModelNorm || pModelNorm.includes(mNorm) || mNorm.includes(pModelNorm);
      });
      if (!exists) {
        catalogModels.push({
          id: pModelNorm,
          name: pModelName,
          engines: [p],
        });
      }
    }

    const hasCurrentModel = catalogModels.some(
      (m) => normalizeText(m.name) === normalizeText(currentModel.name)
    );
    if (!hasCurrentModel && currentModel) {
      catalogModels.push({
        id: currentModel.id || normalizeText(currentModel.name),
        name: currentModel.name,
        engines: [currentEngine],
      });
    }
    return catalogModels;
  }, [currentBrand.name, currentModel, currentEngine]);

  const engines = useMemo(() => {
    const rawEngines = getEnginesForModel(currentBrand.name, currentModel.name);
    const enriched = rawEngines.map((e) => getPresetById(e.id) || e);
    const seenIds = new Set(enriched.map((e) => e.id));

    const normBrand = normalizeText(currentBrand.name);
    const normModel = normalizeText(currentModel.name);

    // Also include any normalized presets from VEHICLE_PRESETS matching this brand & model
    for (const p of VEHICLE_PRESETS) {
      if (seenIds.has(p.id)) continue;
      if (normalizeText(p.brand) !== normBrand) continue;
      const pModelNorm = normalizeText(p.modelName);
      if (
        pModelNorm === normModel ||
        (pModelNorm && normModel && (pModelNorm.includes(normModel) || normModel.includes(pModelNorm)))
      ) {
        seenIds.add(p.id);
        enriched.push(p);
      }
    }

    if (currentEngine && !seenIds.has(currentEngine.id)) {
      return [currentEngine, ...enriched];
    }
    return enriched;
  }, [currentBrand.name, currentModel.name, currentEngine]);

  const handleMakeChange = (brandName) => {
    const normBrand = normalizeText(brandName);
    const brand = VEHICLE_CATALOG.find((b) => normalizeText(b.name) === normBrand);
    if (brand && brand.models.length > 0 && brand.models[0].engines.length > 0) {
      onSelectPreset(brand.models[0].engines[0].id);
      return;
    }
    const fallbackPreset =
      VEHICLE_PRESETS.find((p) => normalizeText(p.brand) === normBrand) ||
      VEHICLE_PRESETS[0];
    onSelectPreset(fallbackPreset.id);
  };

  const handleModelChange = (modelName) => {
    const normModel = normalizeText(modelName);
    const model = currentBrand.models?.find((m) => normalizeText(m.name) === normModel);
    if (model && model.engines && model.engines.length > 0) {
      onSelectPreset(model.engines[0].id);
      return;
    }
    const normBrand = normalizeText(currentBrand.name);
    const fallbackPreset =
      VEHICLE_PRESETS.find((p) => {
        if (normalizeText(p.brand) !== normBrand) return false;
        const pMod = normalizeText(p.modelName);
        return pMod === normModel || pMod.includes(normModel) || normModel.includes(pMod);
      }) || VEHICLE_PRESETS[0];
    onSelectPreset(fallbackPreset.id);
  };

  const handleEngineChange = (engineId) => {
    onSelectPreset(engineId);
  };

  const handleSelectAutocomplete = (presetId) => {
    onSelectPreset(presetId);
    setIsSearchOpen(false);
    setSearchQuery('');
    setDebouncedQuery('');
    setHighlightedIndex(0);
  };

  const handleSearchInputChange = (e) => {
    const nextVal = e.target.value;
    setSearchQuery(nextVal);
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      setDebouncedQuery(nextVal.trim());
    }
    setIsSearchOpen(Boolean(nextVal.trim()));
    setHighlightedIndex(0);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setIsSearchOpen(false);
    setHighlightedIndex(0);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      return;
    }
    if (!autocompleteMatches.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsSearchOpen(true);
      setHighlightedIndex((prev) => (prev + 1) % autocompleteMatches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsSearchOpen(true);
      setHighlightedIndex(
        (prev) => (prev - 1 + autocompleteMatches.length) % autocompleteMatches.length
      );
    } else if (e.key === 'Enter' && isSearchOpen) {
      e.preventDefault();
      const chosen = autocompleteMatches[highlightedIndex] || autocompleteMatches[0];
      if (chosen) {
        handleSelectAutocomplete(chosen.preset.id);
      }
    }
  };

  const showAutocompleteDropdown = isSearchOpen && effectiveSearchQuery.length > 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Instant Debounced Command Search / Autocomplete Bar */}
      <div className="relative">
        <label htmlFor="vehicle-command-search" className="sr-only">
          Quick search vehicle make, model, engine code, or fault
        </label>
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted dark:text-slate-400" />
          <input
            id="vehicle-command-search"
            type="text"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onFocus={() => {
              if (searchQuery.trim()) setIsSearchOpen(true);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Quick search make, model, engine code, or fault (e.g. EcoBlue, EA888, Golf, PDK, Hybrid)..."
            aria-autocomplete="list"
            aria-expanded={showAutocompleteDropdown}
            aria-controls="vehicle-command-search-results"
            autoComplete="off"
            className="h-11 w-full rounded-xl border border-border bg-surface pr-10 pl-10 text-xs sm:text-sm font-medium text-ink placeholder:text-muted/80 shadow-sm transition-all duration-200 hover:border-border-strong focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:hover:border-slate-700"
          />
          {searchQuery && (
            <button
              id="vehicle-command-search-clear"
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear vehicle search"
              className="absolute right-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-surface-subtle hover:text-ink transition-colors dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown Results (up to 8 matches) */}
        {showAutocompleteDropdown && (
          <div
            id="vehicle-command-search-results"
            role="listbox"
            aria-label="Matching vehicle presets"
            className="absolute z-40 mt-1.5 max-h-96 w-full overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 shadow-xl dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
          >
            {autocompleteMatches.length === 0 ? (
              <div className="px-3.5 py-4 text-center text-xs text-muted dark:text-slate-400">
                No vehicles matched &ldquo;{effectiveSearchQuery}&rdquo;. Try an engine code (e.g. EA888, B48, EcoBlue) or OBD fault (e.g. P2002).
              </div>
            ) : (
              <div className="divide-y divide-border/50 dark:divide-slate-800/80">
                {autocompleteMatches.map(({ preset: item, arch, tier }, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  const isCurrent = item.id === selectedPresetId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={isHighlighted}
                      data-preset-id={item.id}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onClick={() => handleSelectAutocomplete(item.id)}
                      className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors flex flex-col gap-1.5 ${
                        isHighlighted
                          ? 'bg-primary-50/90 dark:bg-slate-800/95'
                          : 'hover:bg-surface-subtle dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {/* Row 1: Vehicle Name, Year & Base Price */}
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          <span className="font-semibold text-xs sm:text-sm text-ink dark:text-slate-100 truncate">
                            {item.name}
                          </span>
                          {item.year && (
                            <span className="shrink-0 rounded bg-surface-subtle px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted border border-border/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                              {item.year}
                            </span>
                          )}
                          {isCurrent && (
                            <span className="shrink-0 rounded-full bg-primary-600 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 font-mono text-xs sm:text-sm font-bold tabular-nums text-ink dark:text-slate-100">
                          {formatVehiclePrice(item.purchasePriceUsd)}
                        </span>
                      </div>

                      {/* Row 2: Engine code, HP, Fuel pill, Brand tier / Archetype badge & Critical defect tag */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        {item.engineCode && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-surface-subtle px-2 py-0.5 font-mono text-[10px] font-semibold text-ink border border-border/60 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                            <Cpu className="h-3 w-3 text-primary-600 dark:text-primary-400" />
                            <span>{item.engineCode}</span>
                          </span>
                        )}
                        {item.powerHp && (
                          <span className="rounded-md bg-surface-subtle px-1.5 py-0.5 font-mono text-[10px] font-medium text-body border border-border/50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                            {item.powerHp} HP
                          </span>
                        )}
                        {item.fuelType && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-blue-700 border border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800/80">
                            <Fuel className="h-2.5 w-2.5" />
                            <span>{item.fuelType}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                          {tier.label} · {arch.id}
                        </span>
                        {item.criticalDefectTag && (
                          <span className="inline-flex items-center rounded-full bg-amber-50/90 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-800 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70">
                            {item.criticalDefectTag}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3 Cascading Selectors: Make -> Model -> Engine */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SelectField
          label="Make"
          id="select-make"
          value={currentBrand.name}
          options={brands.map((b) => ({ value: b.name, label: b.name }))}
          onChange={handleMakeChange}
        />
        <SelectField
          label="Model"
          id="select-model"
          value={currentModel.name}
          options={models.map((m) => ({ value: m.name, label: m.name }))}
          onChange={handleModelChange}
        />
        <SelectField
          label="Engine"
          id="select-engine"
          value={currentEngine.id}
          options={engines.map((e) => ({
            value: e.id,
            label: `${e.name}${e.powerHp ? ` (${e.powerHp} hp)` : ''}`,
          }))}
          onChange={handleEngineChange}
        />
      </div>

      {/* Compact Active Archetype & Brand-Tier Telemetry Pill Strip */}
      <div
        id="vehicle-telemetry-strip"
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 bg-surface-subtle/70 px-3 py-2 text-xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-0.5 font-mono text-[11px] font-semibold text-ink border border-border/70 shadow-2xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
            <Cpu className="h-3 w-3 text-primary-600 dark:text-primary-400" />
            <span>{activeArchetype.label}</span>
            <span className="text-[10px] text-muted dark:text-slate-400">({activeArchetype.id})</span>
          </span>

          <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-0.5 font-mono text-[11px] font-medium text-body border border-border/70 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
            <Layers className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>{activeBrandTier.label}</span>
            <span className="text-[10px] text-muted dark:text-slate-400">· {activeBrandTier.multiplierLabel}</span>
          </span>

          {activePreset.engineCode && (
            <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 font-mono text-[11px] font-medium text-muted border border-border/60 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
              {activePreset.engineCode}
            </span>
          )}
        </div>

        {activePreset.criticalDefectTag && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-amber-900 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80">
            <ShieldAlert className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{activePreset.criticalDefectTag}</span>
          </span>
        )}
      </div>

      {/* Hidden / accessible test selector to preserve #preset-select-dropdown test compatibility */}
      <div className="sr-only">
        <label htmlFor={selectDropdownId}>Select Preset Dropdown</label>
        <select
          id={selectDropdownId}
          value={selectedPresetId}
          onChange={(e) => onSelectPreset(e.target.value)}
        >
          {VEHICLE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}


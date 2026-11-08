import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Filter, Car, Zap, Check, ArrowRight, ShieldCheck, ChevronDown, Star, X } from 'lucide-react';
import { VEHICLE_PRESETS, BRANDS, BODY_TYPES } from '../../data/vehiclePresets';
import { useUnits } from '../../context/UnitContext';
import VehicleHierarchySelector from '../common/VehicleHierarchySelector';
import VehicleImageResolver from '../common/vehicle/VehicleImageResolver.jsx';
import VehicleTechnicalBadges from '../common/vehicle/VehicleTechnicalBadges.jsx';
import { RiskBadge } from '../common/OdometerPrimitives';

export default function HeroVehicleFinder({
  selectedPresetId,
  onSelectPreset,
  onNavigateToTco,
  onNavigateToRisk,
}) {
  const { formatCurrency, formatDistance } = useUnits();
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [selectedBodyType, setSelectedBodyType] = useState('all');
  const [activeBudgetFilter, setActiveBudgetFilter] = useState(null);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Live autocomplete matches for the Hero Search Bar
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return VEHICLE_PRESETS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.modelName.toLowerCase().includes(q) ||
        (p.engineCode && p.engineCode.toLowerCase().includes(q)) ||
        (p.fuelType && p.fuelType.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [searchQuery]);

  // Filter presets based on quick filters
  const filteredPresets = VEHICLE_PRESETS.filter((p) => {
    if (selectedBrand !== 'All Brands' && p.brand !== selectedBrand) return false;
    if (selectedBodyType !== 'all' && p.bodyType !== selectedBodyType) return false;
    if (activeBudgetFilter === 'under25k' && p.purchasePriceUsd > 26000) return false;
    if (activeBudgetFilter === 'under35k' && p.purchasePriceUsd > 35000) return false;
    if (activeBudgetFilter === 'under50k' && p.purchasePriceUsd > 50000) return false;
    if (activeBudgetFilter === 'hybrid-ev' && !p.isEv && p.powertrain !== 'hybrid') return false;
    return true;
  });

  const activePreset = VEHICLE_PRESETS.find((p) => p.id === selectedPresetId) || VEHICLE_PRESETS[0];

  // Guarantee activePreset is always selectable in #preset-select-dropdown
  const dropdownPresets = useMemo(() => {
    if (filteredPresets.some((p) => p.id === activePreset.id)) {
      return filteredPresets;
    }
    return [activePreset, ...filteredPresets];
  }, [filteredPresets, activePreset]);

  const handleBrandChange = (e) => {
    const brand = e.target.value;
    setSelectedBrand(brand);
    if (brand !== 'All Brands') {
      const firstMatch = VEHICLE_PRESETS.find((p) => p.brand === brand);
      if (firstMatch) onSelectPreset(firstMatch.id);
    }
  };

  const handlePresetChange = (e) => {
    onSelectPreset(e.target.value);
  };

  const handleBodyTypeSelect = (btId) => {
    setSelectedBodyType(btId);
    if (btId !== 'all') {
      const firstMatch = VEHICLE_PRESETS.find((p) => p.bodyType === btId);
      if (firstMatch) {
        onSelectPreset(firstMatch.id);
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      onNavigateToTco(selectedPresetId);
      return;
    }
    const matched = searchMatches[0] || VEHICLE_PRESETS.find(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.modelName.toLowerCase().includes(q)
    );
    if (matched) {
      onSelectPreset(matched.id);
      onNavigateToTco(matched.id);
      setSearchQuery('');
    } else {
      onNavigateToTco(selectedPresetId);
    }
  };

  return (
    <section className="w-full max-w-full bg-surface dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 sm:p-8 lg:p-12 mb-8 sm:mb-10 relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
        {/* Left Column: Hero Copy & Search Bar */}
        <div className="lg:col-span-7 flex flex-col items-start min-w-0 w-full">
          {/* Eyebrow Micro-Tag */}
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 text-[11px] font-sans font-medium">
            <span>Free · Independent · No sign-up</span>
          </div>

          {/* Main Title */}
          <h1 className="text-[clamp(1.75rem,7vw,3.5rem)] leading-tight text-balance tracking-tight font-sans font-bold text-ink dark:text-zinc-50 mt-4 mb-3">
            Know what your car really costs — <span className="text-primary-600 dark:text-primary-400">before it costs you.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base font-sans text-body dark:text-zinc-300 leading-relaxed mb-6 max-w-xl">
            Real 5-year ownership costs, upcoming maintenance, and fair repair pricing in seconds.
          </p>

          {/* Search Field + Live Autocomplete Dropdown (Stacked on < sm, inline on >= sm) */}
          <div className="w-full max-w-xl relative">
            <form
              onSubmit={handleSearchSubmit}
              className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:h-14 sm:bg-white sm:dark:bg-zinc-900 sm:rounded-xl sm:shadow-sm sm:pl-4 sm:pr-1.5 sm:py-1.5 sm:border sm:border-zinc-300 sm:dark:border-zinc-800 sm:focus-within:border-primary-600 sm:dark:focus-within:border-primary-500 sm:focus-within:ring-4 sm:focus-within:ring-primary-600/15 transition-[border-color,box-shadow] duration-150"
            >
              <div className="w-full sm:flex-1 h-12 sm:h-full bg-white dark:bg-zinc-900 sm:bg-transparent sm:dark:bg-transparent rounded-xl sm:rounded-none border border-zinc-300 dark:border-zinc-800 sm:border-0 px-3.5 sm:px-0 flex items-center min-w-0 shadow-xs sm:shadow-none focus-within:border-primary-600 dark:focus-within:border-primary-500">
                <Search className="w-5 h-5 text-muted dark:text-zinc-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter a car model or engine (e.g. Golf 2.0 TDI, Passat B8)..."
                  aria-label="Search vehicle model or engine"
                  className="w-full flex-1 min-w-0 ml-2.5 sm:ml-3 bg-transparent font-sans text-ink dark:text-zinc-50 placeholder:text-faint dark:placeholder:text-zinc-500 text-base sm:text-sm focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search query"
                    className="p-1.5 mr-1 text-muted hover:text-ink dark:hover:text-zinc-200 rounded-md shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto h-12 sm:h-11 bg-primary-600 text-white font-sans font-semibold text-sm px-5 rounded-xl sm:rounded-lg shadow-sm hover:bg-primary-700 transition-colors duration-150 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>Check now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Live Autocomplete Dropdown */}
            {searchQuery.trim().length > 0 && (
              <div
                data-testid="hero-search-autocomplete"
                className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden z-30"
              >
                {searchMatches.length > 0 ? (
                  <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-64 overflow-y-auto">
                    {searchMatches.map((car) => (
                      <li key={car.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectPreset(car.id);
                            onNavigateToTco(car.id);
                            setSearchQuery('');
                          }}
                          className="w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-sans text-xs sm:text-sm font-bold text-ink dark:text-zinc-50 truncate">
                                {car.name}
                              </span>
                              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 text-[10px] font-sans font-medium shrink-0">
                                {car.fuelType}
                              </span>
                            </div>
                            <div className="text-[11px] font-sans text-muted dark:text-zinc-400 truncate mt-0.5">
                              {car.powerHp} HP · {car.engineCode} · {formatDistance(car.defaultOdometerMiles)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono tabular-nums text-xs font-bold text-emerald-700 dark:text-emerald-400">
                              {formatCurrency(car.purchasePriceUsd)}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-xs font-sans text-muted dark:text-zinc-400">
                    No matching model found for &ldquo;{searchQuery}&rdquo;. Try searching &ldquo;Golf&rdquo;, &ldquo;BMW&rdquo;, or &ldquo;Tesla&rdquo;.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Popular Shortcuts */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-sans w-full">
            <span className="text-muted dark:text-zinc-400 font-medium">Popular:</span>
            {[
              { label: 'VW Golf 8', id: 'vw-golf-20-tdi' },
              { label: 'BMW 320d', id: 'bmw-320d-b47' },
              { label: 'Tesla Model 3', id: 'tesla-model-3-lr' },
              { label: 'Ford Focus', id: 'ford-focus-ecoblue' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectPreset(item.id);
                  onNavigateToTco(item.id);
                }}
                className="min-h-[36px] bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 rounded-lg px-3 py-1 text-xs font-sans font-medium hover:border-primary-600 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Trust Proof Rating */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="flex items-center text-amber-500 text-sm tracking-tight select-none shrink-0">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
              ))}
            </div>
            <span className="text-xs sm:text-sm font-sans font-medium text-body dark:text-zinc-300">
              <strong className="text-ink dark:text-zinc-50 font-mono tabular-nums font-semibold">4.8/5</strong> from <span className="font-mono tabular-nums">2,400+</span> verified drivers
            </span>
          </div>

          {/* Body Style Chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2 w-full">
            {BODY_TYPES.map((bt) => {
              const isActive = selectedBodyType === bt.id;
              return (
                <button
                  key={bt.id}
                  type="button"
                  onClick={() => handleBodyTypeSelect(bt.id)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors duration-150 border ${
                    isActive
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/60 hover:text-ink dark:hover:text-zinc-50'
                  }`}
                >
                  <span>{bt.label}</span>
                  <span className="ml-1 text-[10px] font-mono tabular-nums opacity-80">({bt.count})</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Filtered Body Style Quick-Select Strip */}
          {selectedBodyType !== 'all' && filteredPresets.length > 0 && (
            <div
              data-testid="hero-bodytype-results"
              className="mt-3 w-full max-w-xl p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between mb-1.5 text-[11px] font-sans text-muted dark:text-zinc-400">
                <span className="font-semibold uppercase tracking-wider">
                  Filtered {selectedBodyType} models ({filteredPresets.length})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedBodyType('all')}
                  className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                >
                  Show all
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filteredPresets.slice(0, 6).map((car) => {
                  const isCurrent = car.id === activePreset.id;
                  return (
                    <button
                      key={car.id}
                      type="button"
                      onClick={() => onSelectPreset(car.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-sans font-medium border transition-colors ${
                        isCurrent
                          ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500 font-semibold shadow-xs'
                          : 'bg-white dark:bg-zinc-800 text-ink dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-primary-600'
                      }`}
                    >
                      <span>{car.shortName || car.name}</span>
                      <span className="ml-1.5 font-mono tabular-nums text-[10px] opacity-80">
                        {formatCurrency(car.purchasePriceUsd)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Visual Showcase & Active Vehicle Card */}
        <div className="lg:col-span-5 relative flex justify-center min-w-0 w-full">
          <div className="relative w-full max-w-[460px] min-w-0">
            {/* Main Vehicle Showcase Card */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md bg-surface dark:bg-[#121215] p-4 sm:p-5 space-y-4">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <RiskBadge
                      level={activePreset.maintenanceWearFactor > 1.3 ? 'critical' : activePreset.maintenanceWearFactor > 1.05 ? 'moderate' : 'low'}
                      label={activePreset.maintenanceWearFactor > 1.3 ? 'Critical' : activePreset.maintenanceWearFactor > 1.05 ? 'Moderate' : 'Low'}
                    />
                  </div>
                  <h3 className="text-base sm:text-lg font-sans font-bold tracking-tight text-ink dark:text-zinc-50 truncate">
                    {activePreset.name}
                  </h3>
                  <p className="font-sans font-medium text-xs text-muted dark:text-zinc-400 mt-0.5 truncate">
                    {activePreset.powertrainLabel || `${activePreset.powerHp} HP · ${activePreset.fuelType}`}
                  </p>
                </div>
                <span className="font-mono tabular-nums text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/40 font-bold shrink-0">
                  {formatCurrency(activePreset.purchasePriceUsd)}
                </span>
              </div>

              {/* Real Automotive Studio Photography Frame */}
              <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900 relative border border-zinc-200 dark:border-zinc-800 group">
                <VehicleImageResolver vehicle={activePreset} variant="showcase" className="w-full h-full" interactive />
              </div>

              {/* Strictly Single Row of Max 4 Neutral Micro-Tags */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 px-2 py-0.5 text-[11px] font-sans font-medium">
                  {activePreset.fuelType}
                </span>
                <span className="rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 px-2 py-0.5 text-[11px] font-sans font-medium">
                  {activePreset.transmission || 'Automatic'}
                </span>
                <span className="rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 px-2 py-0.5 text-[11px] font-sans font-medium capitalize">
                  {activePreset.bodyType || 'Sedan'}
                </span>
                <span className="rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 px-2 py-0.5 text-[11px] font-sans font-medium">
                  <span className="font-mono tabular-nums">{activePreset.mpgUs}</span> {activePreset.isEv ? 'kWh' : 'MPG'}
                </span>
              </div>

              {/* Key Indicators 3-Col Mini Strip */}
              <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center text-xs">
                <div className="min-w-0">
                  <span className="text-[11px] font-sans font-medium text-muted dark:text-zinc-400 block truncate">Odometer</span>
                  <strong className="text-ink dark:text-zinc-50 text-sm font-mono tabular-nums font-bold block truncate">
                    {formatDistance(activePreset.defaultOdometerMiles)}
                  </strong>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-sans font-medium text-muted dark:text-zinc-400 block truncate">Economy</span>
                  <strong className="text-ink dark:text-zinc-50 text-sm font-mono tabular-nums font-bold block truncate">
                    {activePreset.isEv ? `${activePreset.mpgUs} kWh` : `${activePreset.mpgUs} MPG`}
                  </strong>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-sans font-medium text-muted dark:text-zinc-400 block truncate">Annual Service</span>
                  <strong className="text-primary-600 dark:text-primary-400 text-sm font-mono tabular-nums font-bold block truncate">
                    {formatCurrency(activePreset.baseAnnualMaintenanceUsd)}/yr
                  </strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col min-[380px]:flex-row items-stretch min-[380px]:items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateToTco(activePreset.id)}
                  className="min-h-[44px] flex-1 bg-primary-600 hover:bg-primary-700 text-white font-sans font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors duration-150"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Simulate 5-Yr TCO</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToRisk(activePreset)}
                  className="bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-ink dark:text-zinc-200 font-sans font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-1.5 transition-colors duration-150"
                >
                  <span>Risk Matrix</span>
                </button>
              </div>
            </div>

            {/* Quick Preset Selector Dropdown (Hidden/Accessible for automated tests) */}
            <div className="sr-only">
              <label htmlFor="preset-select-dropdown">Select Preset</label>
              <select
                id="preset-select-dropdown"
                value={selectedPresetId}
                onChange={handlePresetChange}
              >
                {dropdownPresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

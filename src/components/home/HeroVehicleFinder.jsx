import React, { useState, useMemo } from 'react';
import { Search, Calculator, ShieldAlert, Cpu, ArrowRight, X } from 'lucide-react';
import { VEHICLE_PRESETS } from '../../data/vehiclePresets';
import { OBD_CODES } from '../../data/obdCodes';
import { useUnits } from '../../context/UnitContext';

export default function HeroVehicleFinder({
  selectedPresetId,
  onSelectPreset,
  onNavigateToTco,
  onNavigateToRisk,
  onNavigateToObd,
}) {
  const { formatCurrency, formatDistance } = useUnits();
  const [searchQuery, setSearchQuery] = useState('');

  // Autocomplete matching both vehicle models and OBD-II codes
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { vehicles: [], obdCodes: [] };

    const matchedVehicles = VEHICLE_PRESETS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.modelName.toLowerCase().includes(q) ||
        (p.engineCode && p.engineCode.toLowerCase().includes(q)) ||
        (p.fuelType && p.fuelType.toLowerCase().includes(q))
    ).slice(0, 5);

    const matchedObd = OBD_CODES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.systemCategory && c.systemCategory.toLowerCase().includes(q))
    ).slice(0, 4);

    return { vehicles: matchedVehicles, obdCodes: matchedObd };
  }, [searchQuery]);

  const hasResults = searchResults.vehicles.length > 0 || searchResults.obdCodes.length > 0;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      onNavigateToTco(selectedPresetId);
      return;
    }

    // If query starts with 'p' followed by digits, or is an OBD code match, prioritize OBD
    const isLikelyObd = /^p\d{2,4}/i.test(q) || (searchResults.obdCodes.length > 0 && searchResults.vehicles.length === 0);
    if (isLikelyObd && searchResults.obdCodes.length > 0) {
      const obd = searchResults.obdCodes[0];
      if (onNavigateToObd) onNavigateToObd(obd.code);
      setSearchQuery('');
      return;
    }

    // Vehicle match
    if (searchResults.vehicles.length > 0) {
      const car = searchResults.vehicles[0];
      onSelectPreset(car.id);
      onNavigateToTco(car.id);
      setSearchQuery('');
      return;
    }

    // Fallback if only OBD matched
    if (searchResults.obdCodes.length > 0) {
      const obd = searchResults.obdCodes[0];
      if (onNavigateToObd) onNavigateToObd(obd.code);
      setSearchQuery('');
      return;
    }

    onNavigateToTco(selectedPresetId);
  };

  return (
    <section className="w-full max-w-full bg-surface dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 sm:p-10 lg:p-12 mb-8 sm:mb-10 relative overflow-hidden">
      <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
        {/* Eyebrow Micro-Tag */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 text-xs font-sans font-medium mb-4">
          <span>Free · Independent · No sign-up</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight font-sans font-bold text-ink dark:text-zinc-50 mb-3 text-balance">
          Know what your car really costs <span className="text-primary-600 dark:text-primary-400">before it costs you.</span>
        </h1>

        {/* Plain-English Subtitle */}
        <p className="text-sm sm:text-base lg:text-lg font-sans text-body dark:text-zinc-300 leading-relaxed mb-7 max-w-2xl text-balance">
          Real 5-year ownership costs, upcoming maintenance, and fair repair pricing in seconds.
        </p>

        {/* Unified Smart Search Bar */}
        <div className="w-full max-w-2xl relative mb-4">
          <form
            onSubmit={handleSearchSubmit}
            className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:h-14 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-xl shadow-md sm:shadow-sm sm:pl-4 sm:pr-1.5 sm:py-1.5 border border-zinc-300 dark:border-zinc-800 focus-within:border-primary-600 dark:focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-600/15 transition-all duration-150 p-2 sm:p-0"
          >
            <div className="flex-1 flex items-center min-w-0 px-2 sm:px-0">
              <Search className="w-5 h-5 text-muted dark:text-zinc-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any car model or OBD-II code (e.g. Golf 2.0 TDI, P2002)..."
                aria-label="Search vehicle model or OBD-II code"
                className="w-full flex-1 min-w-0 ml-3 bg-transparent font-sans text-ink dark:text-zinc-50 placeholder:text-faint dark:placeholder:text-zinc-500 text-base sm:text-sm focus:outline-none"
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
              className="w-full sm:w-auto h-12 sm:h-11 bg-primary-600 text-white font-sans font-semibold text-sm px-6 rounded-xl sm:rounded-lg shadow-sm hover:bg-primary-700 transition-colors duration-150 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Check now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {searchQuery.trim().length > 0 && (
            <div
              data-testid="hero-search-autocomplete"
              className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden z-30 text-left"
            >
              {hasResults ? (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-80 overflow-y-auto">
                  {/* Vehicle Matches */}
                  {searchResults.vehicles.length > 0 && (
                    <div>
                      <div className="px-4 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-sans font-semibold uppercase tracking-wider text-muted dark:text-zinc-400">
                        Vehicles ({searchResults.vehicles.length})
                      </div>
                      <ul>
                        {searchResults.vehicles.map((car) => (
                          <li key={`hero-car-${car.id}`}>
                            <button
                              type="button"
                              onClick={() => {
                                onSelectPreset(car.id);
                                onNavigateToTco(car.id);
                                setSearchQuery('');
                              }}
                              className="w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer"
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
                    </div>
                  )}

                  {/* OBD-II Code Matches */}
                  {searchResults.obdCodes.length > 0 && (
                    <div>
                      <div className="px-4 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-sans font-semibold uppercase tracking-wider text-muted dark:text-zinc-400">
                        OBD-II Fault Codes ({searchResults.obdCodes.length})
                      </div>
                      <ul>
                        {searchResults.obdCodes.map((obd) => (
                          <li key={`hero-obd-${obd.code}`}>
                            <button
                              type="button"
                              onClick={() => {
                                if (onNavigateToObd) onNavigateToObd(obd.code);
                                setSearchQuery('');
                              }}
                              className="w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs sm:text-sm font-bold text-primary-700 dark:text-primary-400">
                                    {obd.code}
                                  </span>
                                  <span className="rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 text-[10px] font-sans font-medium shrink-0">
                                    {obd.systemCategory}
                                  </span>
                                </div>
                                <div className="text-[11px] font-sans text-muted dark:text-zinc-400 truncate mt-0.5">
                                  {obd.title}
                                </div>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-4 py-4 text-xs font-sans text-muted dark:text-zinc-400 text-center">
                  No matching models or fault codes for &ldquo;{searchQuery}&rdquo;. Try searching &ldquo;Golf&rdquo;, &ldquo;P0420&rdquo;, or &ldquo;Tesla&rdquo;.
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3 Action Starter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 my-2">
          <button
            type="button"
            onClick={() => onNavigateToTco(selectedPresetId)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-ink dark:text-zinc-100 font-sans text-xs font-semibold border border-zinc-200 dark:border-zinc-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
            <span>Calculate 5-Yr Cost</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToRisk(selectedPresetId)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-ink dark:text-zinc-100 font-sans text-xs font-semibold border border-zinc-200 dark:border-zinc-700 shadow-2xs transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Check Maintenance Risks</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onNavigateToObd) onNavigateToObd();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-ink dark:text-zinc-100 font-sans text-xs font-semibold border border-zinc-200 dark:border-zinc-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Look Up Fault Code</span>
          </button>
        </div>

        {/* Popular Shortcuts */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-sans">
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
              className="min-h-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg px-2.5 py-1 text-xs font-sans font-medium hover:border-primary-600 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Factual Highlights */}
        <div className="mt-5 text-xs font-sans font-medium text-body dark:text-zinc-400">
          <strong className="text-ink dark:text-zinc-200 font-mono tabular-nums font-semibold">120+</strong> models covered · US, UK &amp; EU regional pricing · Free, no sign-up
        </div>

        {/* Accessible hidden select for test compatibility */}
        <div className="sr-only">
          <label htmlFor="preset-select-dropdown">Select Preset</label>
          <select
            id="preset-select-dropdown"
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
    </section>
  );
}

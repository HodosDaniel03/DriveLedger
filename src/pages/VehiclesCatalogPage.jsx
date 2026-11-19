import React, { useState, useMemo, useEffect } from 'react';
import { Car, Search, ShieldAlert, Calculator, CheckCircle2, ArrowLeft, ArrowRight, Wrench } from 'lucide-react';
import { VEHICLE_PRESETS } from '../data/vehiclePresets';
import {
  BRAND_DIRECTORY,
  getBrandBySlug,
  computeBrandTelemetrySummary,
} from '../data/brandDirectory';
import { resolvePowertrainType } from '../data/maintenanceData';
import { BrandModelDirectory } from '../components/seo/VehicleInternalLinks';
import { useUnits } from '../context/UnitContext';

const POWERTRAIN_FILTERS = [
  { id: 'all', label: 'All Powertrains' },
  { id: 'gasoline', label: 'Petrol / Gasoline' },
  { id: 'diesel', label: 'Diesel' },
  { id: 'hybrid', label: 'Hybrid / PHEV' },
  { id: 'ev', label: 'Electric (EV)' },
];

function matchesPowertrainFilter(preset, filterPowertrain) {
  if (filterPowertrain === 'all') return true;
  const pt = resolvePowertrainType(preset);
  if (filterPowertrain === 'ev') return pt === 'EV';
  if (filterPowertrain === 'hybrid') return pt === 'HEV' || pt === 'PHEV';
  if (filterPowertrain === 'diesel') return pt === 'ICE_DIESEL';
  if (filterPowertrain === 'gasoline') return pt === 'ICE_PETROL';
  return true;
}

export default function VehiclesCatalogPage({
  activeBrandSlug = null,
  onNavigateToBrand,
  onSelectPreset,
  onNavigateToTco,
  onNavigateToRisk,
  onNavigateToChecklist,
}) {
  const { formatCurrency, formatDistance } = useUnits();
  const [searchQuery, setSearchQuery] = useState('');
  const [powertrainFilter, setPowertrainFilter] = useState('all');

  const activeBrand = useMemo(
    () => (activeBrandSlug ? getBrandBySlug(activeBrandSlug) : null),
    [activeBrandSlug]
  );

  const brandTelemetry = useMemo(
    () => (activeBrand ? computeBrandTelemetrySummary(activeBrand) : null),
    [activeBrand]
  );

  // Reset local search filters when switching brands
  useEffect(() => {
    setSearchQuery('');
    setPowertrainFilter('all');
  }, [activeBrandSlug]);

  // Scroll smoothly to #brand-... anchor when arriving on /vehicles with a hash
  useEffect(() => {
    if (activeBrand || typeof window === 'undefined' || !window.location?.hash) return;
    const id = window.location.hash.replace(/^#/, '');
    if (!id) return;
    const el = document.getElementById(id);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeBrand]);

  const filteredBrandModels = useMemo(() => {
    if (!brandTelemetry) return [];
    const q = String(searchQuery || '').trim().toLowerCase();
    return brandTelemetry.modelSummaries.filter(({ preset }) => {
      if (!matchesPowertrainFilter(preset, powertrainFilter)) return false;
      if (q) {
        const hay = `${preset.brand} ${preset.modelName} ${preset.name} ${preset.engineCode || ''} ${preset.segment || ''} ${preset.criticalDefectTag || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [brandTelemetry, searchQuery, powertrainFilter]);

  const siblingBrands = useMemo(() => {
    if (!activeBrand) return [];
    return BRAND_DIRECTORY.filter((b) => b.slug !== activeBrand.slug);
  }, [activeBrand]);

  // =========================================================================
  // DEDICATED BRAND HUB PAGE (/vehicles/:brand)
  // =========================================================================
  if (activeBrand && brandTelemetry) {
    const ptParts = [];
    if (brandTelemetry.powertrainCounts.gasoline > 0) ptParts.push(`${brandTelemetry.powertrainCounts.gasoline} Petrol`);
    if (brandTelemetry.powertrainCounts.diesel > 0) ptParts.push(`${brandTelemetry.powertrainCounts.diesel} Diesel`);
    if (brandTelemetry.powertrainCounts.hybrid > 0) ptParts.push(`${brandTelemetry.powertrainCounts.hybrid} Hybrid`);
    if (brandTelemetry.powertrainCounts.ev > 0) ptParts.push(`${brandTelemetry.powertrainCounts.ev} EV`);

    return (
      <div data-testid="brand-hub-page" data-brand-slug={activeBrand.slug} className="space-y-8">
        {/* Breadcrumb & Back Link */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-sans text-muted dark:text-zinc-400">
          <a
            href="/vehicles"
            onClick={(e) => {
              if (onNavigateToBrand) {
                e.preventDefault();
                onNavigateToBrand(null);
              }
            }}
            className="inline-flex items-center gap-1.5 font-semibold text-primary-600 dark:text-emerald-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All {BRAND_DIRECTORY.length} Brands Directory</span>
          </a>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-ink dark:text-zinc-100">{activeBrand.name}</span>
        </nav>

        {/* Brand Hub Hero & Summary Telemetry */}
        <header className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-emerald-950/50 border border-primary-100 dark:border-emerald-800 text-primary-700 dark:text-emerald-300 text-xs font-sans font-semibold uppercase tracking-wider">
              <Car className="w-3.5 h-3.5" />
              <span>{activeBrand.name} Reliability &amp; Ownership Hub</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-sans font-extrabold tracking-tight text-ink dark:text-zinc-50">
              {activeBrand.name} Maintenance Cost, 5-Year TCO &amp; Reliability ({activeBrand.modelCount}{' '}
              {activeBrand.modelCount === 1 ? 'Model' : 'Models'})
            </h1>
            <p className="text-xs sm:text-sm font-sans text-body dark:text-zinc-300 leading-relaxed">
              Compare 5-year True Cost to Own (TCO), non-linear depreciation, powertrain wear schedules, and pre-purchase inspection checklists across all {activeBrand.modelCount} benchmarked {activeBrand.name} configurations in the DriveLedger telemetry catalog.
            </p>
          </div>

          {/* Brand-Level Quantitative Summary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
              <span className="text-[11px] font-sans uppercase tracking-wider text-muted dark:text-zinc-400 block">
                Benchmarked Models
              </span>
              <span className="font-mono tabular-nums text-lg sm:text-xl font-bold text-ink dark:text-zinc-50">
                {brandTelemetry.modelCount}
              </span>
              <span className="block text-[11px] font-sans text-muted dark:text-zinc-400 truncate mt-0.5">
                {ptParts.join(' · ') || 'Multi-powertrain'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
              <span className="text-[11px] font-sans uppercase tracking-wider text-muted dark:text-zinc-400 block">
                Avg 5-Year TCO
              </span>
              <span className="font-mono tabular-nums text-lg sm:text-xl font-bold text-ink dark:text-zinc-50">
                {formatCurrency(brandTelemetry.avg5YrTcoUsd)}
              </span>
              <span className="block text-[11px] font-mono tabular-nums text-muted dark:text-zinc-400 mt-0.5">
                {formatCurrency(brandTelemetry.avgMonthlyTcoUsd)}/mo avg
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
              <span className="text-[11px] font-sans uppercase tracking-wider text-muted dark:text-zinc-400 block">
                5-Yr TCO Range
              </span>
              <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-ink dark:text-zinc-50">
                {formatCurrency(brandTelemetry.min5YrTcoUsd)} – {formatCurrency(brandTelemetry.max5YrTcoUsd)}
              </span>
              <span className="block text-[11px] font-sans text-muted dark:text-zinc-400 mt-0.5">
                Across {activeBrand.name} lineup
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50">
              <span className="text-[11px] font-sans uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-semibold block">
                Lowest-Cost {activeBrand.name}
              </span>
              <a
                href={`/tco/${brandTelemetry.lowestTcoModel.preset.id}`}
                onClick={(e) => {
                  if (onNavigateToTco) {
                    e.preventDefault();
                    if (onSelectPreset) onSelectPreset(brandTelemetry.lowestTcoModel.preset.id);
                    onNavigateToTco(brandTelemetry.lowestTcoModel.preset.id);
                  }
                }}
                className="font-sans text-sm font-bold text-emerald-900 dark:text-emerald-200 hover:underline block truncate mt-0.5"
              >
                {brandTelemetry.lowestTcoModel.preset.shortName || brandTelemetry.lowestTcoModel.preset.name}
              </a>
              <span className="block text-[11px] font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-0.5">
                {formatCurrency(brandTelemetry.lowestTcoModel.total5YrTcoUsd)} / 5 yrs
              </span>
            </div>
          </div>

          {/* Search & Powertrain Filter Bar scoped to Brand */}
          <div className="flex flex-col md:flex-row gap-3 pt-1">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3.5 w-4 h-4 -translate-y-1/2 text-muted dark:text-zinc-400"
              />
              <input
                id="brand-hub-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Filter ${activeBrand.name} models by engine code, trim, or known risk...`}
                className="w-full h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-canvas dark:bg-zinc-900 pl-10 pr-4 text-sm font-sans text-ink dark:text-zinc-100 placeholder:text-muted outline-none focus:border-primary-600"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {POWERTRAIN_FILTERS.map((pf) => {
                const active = powertrainFilter === pf.id;
                return (
                  <button
                    key={pf.id}
                    type="button"
                    onClick={() => setPowertrainFilter(pf.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-sans font-semibold border transition-colors ${
                      active
                        ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500'
                        : 'bg-canvas dark:bg-zinc-900 text-body dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {pf.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Brand Model Cards Grid */}
        <section aria-label={`${activeBrand.name} Benchmarked Models`} className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-sans font-bold text-ink dark:text-zinc-100">
              {activeBrand.name} Model Ownership &amp; Reliability Profiles ({filteredBrandModels.length})
            </h2>
          </div>

          {filteredBrandModels.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] p-8 text-center text-sm text-muted dark:text-zinc-400">
              No {activeBrand.name} models match your active filter. Try resetting the powertrain filter or clearing the search box.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBrandModels.map((item) => {
                const car = item.preset;
                return (
                  <article
                    key={car.id}
                    className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] p-5 shadow-xs hover:border-primary-500/60 dark:hover:border-emerald-700 transition-colors flex flex-col justify-between gap-4 min-w-0"
                  >
                    <div className="space-y-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-base font-sans font-bold text-ink dark:text-zinc-50 leading-snug">
                            <a
                              href={`/tco/${car.id}`}
                              onClick={(e) => {
                                if (onNavigateToTco) {
                                  e.preventDefault();
                                  if (onSelectPreset) onSelectPreset(car.id);
                                  onNavigateToTco(car.id);
                                }
                              }}
                              className="hover:text-primary-600 dark:hover:text-emerald-400 hover:underline"
                            >
                              {car.name}
                            </a>
                          </h3>
                          <p className="text-xs font-mono text-muted dark:text-zinc-400 mt-0.5 truncate">
                            {car.engineCode} · {car.powerHp} HP · {car.fuelType}
                          </p>
                        </div>
                        <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-sans font-semibold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          {car.segment || 'Standard'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
                          <span className="block text-[10px] uppercase tracking-wider text-muted dark:text-zinc-400 font-sans">
                            5-Year TCO
                          </span>
                          <span className="font-mono tabular-nums font-bold text-sm text-ink dark:text-zinc-100">
                            {formatCurrency(item.total5YrTcoUsd)}
                          </span>
                          <span className="block text-[10px] font-mono tabular-nums text-muted dark:text-zinc-400">
                            {formatCurrency(item.monthlyTcoUsd)}/mo
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
                          <span className="block text-[10px] uppercase tracking-wider text-muted dark:text-zinc-400 font-sans">
                            5-Yr Maintenance
                          </span>
                          <span className="font-mono tabular-nums font-bold text-sm text-ink dark:text-zinc-100">
                            {formatCurrency(item.maintenance5YrUsd)}
                          </span>
                          <span className="block text-[10px] font-mono tabular-nums text-muted dark:text-zinc-400">
                            Base {formatDistance(car.defaultOdometerMiles || 35000)}
                          </span>
                        </div>
                      </div>

                      {car.criticalDefectTag && (
                        <div className="flex items-start gap-2 text-[11px] font-sans text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 rounded-lg px-2.5 py-2">
                          <Wrench className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                          <span className="line-clamp-2">
                            <strong>Watchpoint:</strong> {car.criticalDefectTag}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Direct Action Links */}
                    <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs font-sans font-semibold">
                      <a
                        href={`/tco/${car.id}`}
                        onClick={(e) => {
                          if (onNavigateToTco) {
                            e.preventDefault();
                            if (onSelectPreset) onSelectPreset(car.id);
                            onNavigateToTco(car.id);
                          }
                        }}
                        className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-[#183D22] text-white hover:bg-[#183D22]/90 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors text-center"
                      >
                        <Calculator className="w-3.5 h-3.5 shrink-0" />
                        <span>TCO</span>
                      </a>
                      <a
                        href={`/risk-matrix/${car.id}`}
                        onClick={(e) => {
                          if (onNavigateToRisk) {
                            e.preventDefault();
                            if (onSelectPreset) onSelectPreset(car.id);
                            onNavigateToRisk(car);
                          }
                        }}
                        className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-amber-800 dark:text-amber-300 hover:border-amber-500 transition-colors text-center"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span>Risk</span>
                      </a>
                      <a
                        href={`/checklist/${car.id}`}
                        onClick={(e) => {
                          if (onNavigateToChecklist) {
                            e.preventDefault();
                            if (onSelectPreset) onSelectPreset(car.id);
                            onNavigateToChecklist(car.id);
                          }
                        }}
                        className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-emerald-800 dark:text-emerald-300 hover:border-emerald-500 transition-colors text-center"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>PPI</span>
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Cross-Link Navigation to Other 34 Brand Hubs & Full Directory */}
        <nav
          aria-label="Explore Other Automotive Brands"
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] p-5 sm:p-6 shadow-xs space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-ink dark:text-zinc-100">
              Explore Other Manufacturers ({siblingBrands.length} Brands)
            </h2>
            <a
              href="/vehicles"
              onClick={(e) => {
                if (onNavigateToBrand) {
                  e.preventDefault();
                  onNavigateToBrand(null);
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-sans font-semibold text-primary-600 dark:text-emerald-400 hover:underline"
            >
              <span>View All {VEHICLE_PRESETS.length} Vehicles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <ul className="flex flex-wrap gap-1.5 text-xs font-sans">
            {siblingBrands.map((b) => (
              <li key={b.slug}>
                <a
                  href={`/vehicles/${b.slug}`}
                  onClick={(e) => {
                    if (onNavigateToBrand) {
                      e.preventDefault();
                      onNavigateToBrand(b.slug);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-body dark:text-zinc-300 hover:border-primary-500 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <span>{b.name}</span>
                  <span className="text-[10px] font-mono tabular-nums text-muted dark:text-zinc-500">
                    {b.modelCount}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    );
  }

  // =========================================================================
  // ALL-BRANDS HTML CATALOG PAGE (/vehicles)
  // =========================================================================
  return (
    <div data-testid="vehicles-catalog-page" className="space-y-8">
      {/* Header */}
      <header className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] p-6 sm:p-8 shadow-sm space-y-5">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-emerald-950/50 border border-primary-100 dark:border-emerald-800 text-primary-700 dark:text-emerald-300 text-xs font-sans font-semibold uppercase tracking-wider">
            <Car className="w-3.5 h-3.5" />
            <span>Complete HTML Vehicle Directory</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-sans font-extrabold tracking-tight text-ink dark:text-zinc-50">
            All {BRAND_DIRECTORY.length} Brands &amp; {VEHICLE_PRESETS.length} Vehicle Telemetry Profiles
          </h1>
          <p className="text-xs sm:text-sm font-sans text-body dark:text-zinc-300 leading-relaxed">
            Explore every benchmarked vehicle in the DriveLedger database. Open any dedicated manufacturer hub below or jump straight to a model&apos;s 5-Year True Cost to Own (TCO) breakdown, Powertrain Maintenance Risk Matrix, or model-specific Pre-Purchase Inspection (PPI) checklist.
          </p>
        </div>

        {/* Search & Powertrain Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 w-4 h-4 -translate-y-1/2 text-muted dark:text-zinc-400"
            />
            <input
              id="vehicles-catalog-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by brand, model, engine code, or segment (e.g. BMW, TDI, Hybrid, Tesla)..."
              className="w-full h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-canvas dark:bg-zinc-900 pl-10 pr-4 text-sm font-sans text-ink dark:text-zinc-100 placeholder:text-muted outline-none focus:border-primary-600"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {POWERTRAIN_FILTERS.map((pf) => {
              const active = powertrainFilter === pf.id;
              return (
                <button
                  key={pf.id}
                  type="button"
                  onClick={() => setPowertrainFilter(pf.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-sans font-semibold border transition-colors ${
                    active
                      ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500'
                      : 'bg-canvas dark:bg-zinc-900 text-body dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {pf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Direct Links to Dedicated Brand Hub Pages (/vehicles/:brand) */}
        <nav aria-label="Browse Dedicated Brand Hubs" className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] font-sans uppercase tracking-wider font-bold text-muted dark:text-zinc-400 block mb-2">
            Dedicated Manufacturer Hubs ({BRAND_DIRECTORY.length} Brands)
          </span>
          <ul className="flex flex-wrap gap-1.5 text-xs font-sans">
            {BRAND_DIRECTORY.map((b) => (
              <li key={b.slug}>
                <a
                  href={`/vehicles/${b.slug}`}
                  onClick={(e) => {
                    if (onNavigateToBrand) {
                      e.preventDefault();
                      onNavigateToBrand(b.slug);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-body dark:text-zinc-300 hover:border-primary-500 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <span>{b.name}</span>
                  <span className="text-[10px] font-mono tabular-nums text-muted dark:text-zinc-500">
                    {b.modelCount}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-sans text-muted dark:text-zinc-400 pt-1">
          <span className="inline-flex items-center gap-1">
            <Calculator className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            <strong>TCO:</strong> 5-Year True Cost to Own
          </span>
          <span className="inline-flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <strong>Risk:</strong> Powertrain Risk Matrix &amp; Known Defects
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <strong>PPI:</strong> Pre-Purchase Inspection Checklist
          </span>
        </div>
      </header>

      {/* Full Brand & Model HTML Catalog */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] p-5 sm:p-7 shadow-sm">
        <BrandModelDirectory
          onSelectPreset={onSelectPreset}
          onNavigateToTco={onNavigateToTco}
          onNavigateToRisk={onNavigateToRisk}
          onNavigateToChecklist={onNavigateToChecklist}
          onNavigateToBrand={onNavigateToBrand}
          filterQuery={searchQuery}
          filterPowertrain={powertrainFilter}
        />
      </section>
    </div>
  );
}

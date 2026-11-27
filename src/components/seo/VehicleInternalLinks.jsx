import React, { useMemo } from 'react';
import { Car, GitCompare, ShieldAlert, Cpu, Calculator, ArrowRight } from 'lucide-react';
import { VEHICLE_PRESETS } from '../../data/vehiclePresets';
import { OBD_CODES } from '../../data/obdCodes';
import {
  isObdCompatibleWithVehicle,
  PROGRAMMATIC_COMPARE_PAIRS,
} from '../../data/seoMatrixData';
import {
  BRAND_DIRECTORY,
  slugifyBrandName,
  getBrandBySlug,
} from '../../data/brandDirectory';
import { resolvePowertrainType } from '../../data/maintenanceData';

export { slugifyBrandName };

const MILEAGE_BRACKETS = [
  { slug: '60k-miles', miles: 60000, label: '60,000 Miles (100k km) Major Service Window' },
  { slug: '100k-miles', miles: 100000, label: '100,000 Miles (160k km) Overhaul Window' },
  { slug: '150k-miles', miles: 150000, label: '150,000 Miles (240k km) High-Mileage Audit' },
];

/**
 * Crawlable Internal Link Hub rendered at the bottom of every vehicle & OBD tool page
 * (/tco/:id, /risk-matrix/:id, /checklist/:id, /obd/:id/:code).
 */
export function VehicleInternalLinks({
  vehicle,
  preset,
  onSelectPreset,
  onNavigateToTco,
  onNavigateToRisk,
  onNavigateToRiskBracket,
  onNavigateToChecklist,
  onNavigateToHybridObd,
  onNavigateToObd,
  onNavigateToCompare,
  onNavigateToVehicles,
}) {
  const activeVehicle = vehicle || preset || VEHICLE_PRESETS[0];

  const compareLinks = useMemo(() => {
    if (!activeVehicle) return [];
    const presetMap = new Map(VEHICLE_PRESETS.map((p) => [p.id, p]));
    const canonicalPairs = PROGRAMMATIC_COMPARE_PAIRS.filter(
      (m) => m.idA === activeVehicle.id || m.idB === activeVehicle.id
    ).slice(0, 4);

    return canonicalPairs.map((m) => {
      const carA = presetMap.get(m.idA);
      const carB = presetMap.get(m.idB);
      return {
        key: m.path,
        path: m.path,
        idA: m.idA,
        idB: m.idB,
        label: `${carA?.shortName || carA?.name || m.idA} vs ${carB?.shortName || carB?.name || m.idB}`,
      };
    });
  }, [activeVehicle]);

  const compatibleObdList = useMemo(() => {
    if (!activeVehicle) return [];
    const commonSet = new Set(activeVehicle.commonObdCodes || []);
    const primary = OBD_CODES.filter(
      (c) => commonSet.has(c.code) && isObdCompatibleWithVehicle(activeVehicle, c)
    );
    if (primary.length > 0) {
      return primary.slice(0, 6);
    }
    return OBD_CODES.filter((c) => isObdCompatibleWithVehicle(activeVehicle, c)).slice(0, 3);
  }, [activeVehicle]);

  if (!activeVehicle) return null;

  const shortName = activeVehicle.shortName || activeVehicle.name;
  const activeBrandSlug = slugifyBrandName(activeVehicle.brand);
  const activeBrandInfo = getBrandBySlug(activeBrandSlug);

  return (
    <nav
      aria-label={`${activeVehicle.name} Internal Telemetry Links`}
      data-testid="vehicle-internal-links"
      className="mt-8 rounded-2xl border border-border/80 dark:border-zinc-800/90 bg-surface dark:bg-[#121215] p-5 sm:p-6 shadow-card dark:shadow-none space-y-5 print:hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 dark:border-zinc-800 pb-3">
        <div>
          <h3 className="text-sm sm:text-base font-sans font-bold text-ink dark:text-zinc-100">
            Explore All Reports for {activeVehicle.name}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {activeBrandInfo && (
            <a
              href={`/vehicles/${activeBrandInfo.slug}`}
              onClick={(e) => {
                if (onNavigateToVehicles) {
                  e.preventDefault();
                  onNavigateToVehicles(activeBrandInfo.slug);
                }
              }}
              className="min-h-[44px] inline-flex items-center gap-1 py-2 text-xs font-sans font-semibold text-ink dark:text-zinc-200 hover:text-primary-600 dark:hover:text-emerald-400 hover:underline"
            >
              <span>All {activeBrandInfo.name} Models ({activeBrandInfo.modelCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
          <a
            href="/vehicles"
            onClick={(e) => {
              if (onNavigateToVehicles) {
                e.preventDefault();
                onNavigateToVehicles();
              }
            }}
            className="min-h-[44px] inline-flex items-center gap-1 py-2 text-xs font-sans font-semibold text-primary-600 dark:text-emerald-400 hover:underline"
          >
            <span>All {BRAND_DIRECTORY.length} Brands &amp; {VEHICLE_PRESETS.length} Models</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-xs font-sans">
        {/* 1. Core Vehicle Dossiers */}
        <div className="space-y-1.5 min-w-0">
          <div className="font-semibold text-ink dark:text-zinc-200 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400 shrink-0" />
            <span>Core Calculators</span>
          </div>
          <ul className="space-y-0.5 text-body dark:text-zinc-300">
            <li>
              <a
                href={`/tco/${activeVehicle.id}`}
                onClick={(e) => {
                  if (onNavigateToTco) {
                    e.preventDefault();
                    if (onSelectPreset) onSelectPreset(activeVehicle.id);
                    onNavigateToTco(activeVehicle.id);
                  }
                }}
                className="min-h-[44px] flex items-center py-1.5 hover:text-primary-600 dark:hover:text-emerald-400 hover:underline"
              >
                <span className="truncate">{shortName} 5-Year TCO Calculator</span>
              </a>
            </li>
            <li>
              <a
                href={`/risk-matrix/${activeVehicle.id}`}
                onClick={(e) => {
                  if (onNavigateToRisk) {
                    e.preventDefault();
                    if (onSelectPreset) onSelectPreset(activeVehicle.id);
                    onNavigateToRisk(activeVehicle);
                  }
                }}
                className="min-h-[44px] flex items-center py-1.5 hover:text-primary-600 dark:hover:text-emerald-400 hover:underline"
              >
                <span className="truncate">{shortName} Powertrain Risk Matrix</span>
              </a>
            </li>
            <li>
              <a
                href={`/checklist/${activeVehicle.id}`}
                onClick={(e) => {
                  if (onNavigateToChecklist) {
                    e.preventDefault();
                    if (onSelectPreset) onSelectPreset(activeVehicle.id);
                    onNavigateToChecklist(activeVehicle.id);
                  }
                }}
                className="min-h-[44px] flex items-center py-1.5 hover:text-primary-600 dark:hover:text-emerald-400 hover:underline"
              >
                <span className="truncate">{shortName} Pre-Purchase Checklist (PPI)</span>
              </a>
            </li>
          </ul>
        </div>

        {/* 2. Mileage Bracket Risk Dossiers */}
        <div className="space-y-1.5 min-w-0">
          <div className="font-semibold text-ink dark:text-zinc-200 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Mileage Risk Brackets</span>
          </div>
          <ul className="space-y-0.5 text-body dark:text-zinc-300">
            {MILEAGE_BRACKETS.map((b) => (
              <li key={b.slug}>
                <a
                  href={`/risk-matrix/${activeVehicle.id}/${b.slug}`}
                  onClick={(e) => {
                    if (onNavigateToRiskBracket) {
                      e.preventDefault();
                      onNavigateToRiskBracket(activeVehicle.id, b.slug, b.miles);
                    } else if (onNavigateToRisk) {
                      e.preventDefault();
                      if (onSelectPreset) onSelectPreset(activeVehicle.id);
                      onNavigateToRisk({
                        ...activeVehicle,
                        defaultOdometerMiles: b.miles,
                        mileageSlug: b.slug,
                      });
                    }
                  }}
                  className="min-h-[44px] flex items-center py-1.5 hover:text-primary-600 dark:hover:text-emerald-400 hover:underline"
                >
                  <span className="truncate">{shortName} at {b.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Segment Rival Comparisons */}
        <div className="space-y-1.5 min-w-0">
          <div className="font-semibold text-ink dark:text-zinc-200 flex items-center gap-1.5">
            <GitCompare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Segment Rival Comparisons</span>
          </div>
          <ul className="space-y-0.5 text-body dark:text-zinc-300">
            {compareLinks.map((pair) => (
              <li key={pair.key}>
                <a
                  href={pair.path}
                  onClick={(e) => {
                    if (onNavigateToCompare) {
                      e.preventDefault();
                      onNavigateToCompare(pair.idA, pair.idB);
                    }
                  }}
                  className="min-h-[44px] flex items-center py-1.5 hover:text-primary-600 dark:hover:text-emerald-400 hover:underline"
                >
                  <span className="truncate">{pair.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* 4. Compatible OBD-II Fault Dossiers */}
        <div className="space-y-1.5 min-w-0">
          <div className="font-semibold text-ink dark:text-zinc-200 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400 shrink-0" />
            <span>Common OBD-II Fault Codes</span>
          </div>
          <ul className="space-y-0.5 text-body dark:text-zinc-300">
            {compatibleObdList.map((obd) => (
              <li key={obd.code}>
                <a
                  href={`/obd/${activeVehicle.id}/${obd.code.toLowerCase()}`}
                  onClick={(e) => {
                    if (onNavigateToHybridObd) {
                      e.preventDefault();
                      onNavigateToHybridObd(activeVehicle.id, obd.code);
                    } else if (onNavigateToObd) {
                      e.preventDefault();
                      if (onSelectPreset) onSelectPreset(activeVehicle.id);
                      onNavigateToObd(obd.code);
                    }
                  }}
                  className="min-h-[44px] flex items-center gap-1.5 py-1.5 hover:text-primary-600 dark:hover:text-emerald-400 hover:underline"
                >
                  <span className="font-mono font-bold text-primary-600 dark:text-emerald-400 shrink-0">
                    {obd.code}
                  </span>
                  <span className="truncate">{obd.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

/**
 * Compact 35-Brand Quick Jump Strip linking directly into /vehicles#brand-...
 * Ideal for Footer & Homepage without repeating 500+ boilerplate model links across every page.
 */
export function BrandQuickJumpIndex({ onNavigateToVehicles }) {
  const brandsSummary = useMemo(() => {
    const counts = new Map();
    for (const preset of VEHICLE_PRESETS) {
      const brand = preset.brand || 'Other';
      counts.set(brand, (counts.get(brand) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({
        name,
        count,
        slug: slugifyBrandName(name),
      }));
  }, []);

  return (
    <nav
      aria-label="Browse Vehicles by Brand"
      data-testid="brand-quick-jump-index"
      className="space-y-3 pt-4 border-t border-border/80 dark:border-zinc-800"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-primary-600 dark:text-emerald-400" />
          <h3 className="text-sm font-sans font-semibold text-ink dark:text-zinc-100">
            Browse by Brand ({brandsSummary.length} Brands · {VEHICLE_PRESETS.length} Benchmarked Models)
          </h3>
        </div>
        <a
          href="/vehicles"
          onClick={(e) => {
            if (onNavigateToVehicles) {
              e.preventDefault();
              onNavigateToVehicles();
            }
          }}
          className="min-h-[44px] inline-flex items-center gap-1 py-2 text-xs font-sans font-semibold text-primary-600 dark:text-emerald-400 hover:underline"
        >
          <span>Open Full HTML Vehicle Directory</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
      <ul className="flex flex-wrap gap-2 text-xs font-sans">
        {brandsSummary.map((b) => (
          <li key={b.slug}>
            <a
              href={`/vehicles/${b.slug}`}
              onClick={(e) => {
                if (onNavigateToVehicles) {
                  e.preventDefault();
                  onNavigateToVehicles(b.slug);
                }
              }}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-subtle dark:bg-zinc-900 border border-border/80 dark:border-zinc-800 text-body dark:text-zinc-300 hover:border-border-strong dark:hover:border-zinc-700 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors"
            >
              <span className="font-medium">{b.name}</span>
              <span className="text-[11px] font-mono tabular-nums text-muted dark:text-zinc-500">
                {b.count}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Crawlable Brand & Model HTML Directory (All 35 Brands & 179 Vehicle Configurations).
 * Eliminates orphan pages by providing direct <a href="/tco/:id">, <a href="/risk-matrix/:id">,
 * and <a href="/checklist/:id"> links.
 */
export function BrandModelDirectory({
  onSelectPreset,
  onNavigateToTco,
  onNavigateToRisk,
  onNavigateToChecklist,
  onNavigateToBrand,
  filterQuery = '',
  filterPowertrain = 'all',
}) {
  const brandsGroup = useMemo(() => {
    const q = String(filterQuery || '').trim().toLowerCase();
    const map = new Map();
    for (const preset of VEHICLE_PRESETS) {
      if (filterPowertrain !== 'all') {
        const pt = resolvePowertrainType(preset);
        if (filterPowertrain === 'ev' && pt !== 'EV') continue;
        if (filterPowertrain === 'hybrid' && pt !== 'HEV' && pt !== 'PHEV') continue;
        if (filterPowertrain === 'diesel' && pt !== 'ICE_DIESEL') continue;
        if (filterPowertrain === 'gasoline' && pt !== 'ICE_PETROL') continue;
      }
      if (q) {
        const hay = `${preset.brand} ${preset.modelName} ${preset.name} ${preset.engineCode || ''} ${preset.segment || ''}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      const brand = preset.brand || 'Other';
      if (!map.has(brand)) {
        map.set(brand, []);
      }
      map.get(brand).push(preset);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filterQuery, filterPowertrain]);

  const matchedCount = useMemo(
    () => brandsGroup.reduce((sum, [, models]) => sum + models.length, 0),
    [brandsGroup]
  );

  return (
    <div
      data-testid="brand-model-directory"
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-primary-600 dark:text-emerald-400" />
          <h2 className="text-base sm:text-lg font-sans font-bold text-ink dark:text-zinc-100">
            Complete Brand &amp; Model Telemetry Catalog ({brandsGroup.length} Brands · {matchedCount} Models)
          </h2>
        </div>
        <span className="text-xs font-sans text-muted dark:text-zinc-400">
          Direct TCO, Risk Matrix &amp; PPI Index
        </span>
      </div>

      {brandsGroup.length === 0 ? (
        <div className="rounded-2xl border border-border/80 dark:border-zinc-800/90 bg-surface dark:bg-[#121215] p-6 text-sm text-muted dark:text-zinc-400 text-center shadow-card dark:shadow-none">
          No vehicle configurations match your current filter. Try clearing the search box.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 text-xs font-sans">
          {brandsGroup.map(([brandName, models]) => {
            const brandSlug = slugifyBrandName(brandName);
            return (
              <section
                key={brandName}
                id={`brand-${brandSlug}`}
                aria-label={`${brandName} vehicles`}
                className="scroll-mt-28 rounded-2xl border border-border/80 dark:border-zinc-800/90 bg-surface dark:bg-[#121215] p-5 shadow-card dark:shadow-none space-y-3 min-w-0"
              >
                <div className="flex items-center justify-between border-b border-border/70 dark:border-zinc-800 pb-2">
                  <h3 className="font-bold text-ink dark:text-zinc-100 text-sm">
                    <a
                      href={`/vehicles/${brandSlug}`}
                      onClick={(e) => {
                        if (onNavigateToBrand) {
                          e.preventDefault();
                          onNavigateToBrand(brandSlug);
                        }
                      }}
                      className="inline-flex items-center min-h-[44px] py-1 text-sm font-bold text-ink dark:text-zinc-100 hover:text-primary-600 dark:hover:text-emerald-400 hover:underline"
                    >
                      {brandName}
                    </a>
                  </h3>
                  <span className="text-xs font-mono tabular-nums text-muted dark:text-zinc-400 shrink-0">
                    {models.length} {models.length === 1 ? 'model' : 'models'}
                  </span>
                </div>
                <ul className="divide-y divide-border/60 dark:divide-zinc-800/80">
                  {models.map((car) => {
                    const modelLabel = car.shortName || car.name;
                    return (
                      <li key={car.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-1.5 min-w-0">
                        <a
                          href={`/tco/${car.id}`}
                          onClick={(e) => {
                            if (onNavigateToTco) {
                              e.preventDefault();
                              if (onSelectPreset) onSelectPreset(car.id);
                              onNavigateToTco(car.id);
                            }
                          }}
                          className="min-h-[44px] inline-flex items-center text-sm font-medium text-body dark:text-zinc-200 hover:text-primary-600 dark:hover:text-emerald-400 hover:underline truncate"
                        >
                          {modelLabel}
                        </a>
                        <div className="grid grid-cols-3 gap-1.5 font-mono">
                          <a
                            href={`/tco/${car.id}`}
                            aria-label={`TCO for ${modelLabel}`}
                            onClick={(e) => {
                              if (onNavigateToTco) {
                                e.preventDefault();
                                if (onSelectPreset) onSelectPreset(car.id);
                                onNavigateToTco(car.id);
                              }
                            }}
                            className="min-h-[44px] inline-flex items-center justify-center rounded-lg bg-surface-subtle dark:bg-zinc-900 border border-border/80 dark:border-zinc-800 text-xs font-sans font-semibold text-primary-700 dark:text-emerald-400 hover:border-border-strong dark:hover:border-zinc-600 transition-colors"
                          >
                            TCO
                          </a>
                          <a
                            href={`/risk-matrix/${car.id}`}
                            aria-label={`Risk matrix for ${modelLabel}`}
                            onClick={(e) => {
                              if (onNavigateToRisk) {
                                e.preventDefault();
                                if (onSelectPreset) onSelectPreset(car.id);
                                onNavigateToRisk(car);
                              }
                            }}
                            className="min-h-[44px] inline-flex items-center justify-center rounded-lg bg-surface-subtle dark:bg-zinc-900 border border-border/80 dark:border-zinc-800 text-xs font-sans font-semibold text-amber-700 dark:text-amber-400 hover:border-amber-500 transition-colors"
                          >
                            Risk
                          </a>
                          <a
                            href={`/checklist/${car.id}`}
                            aria-label={`Pre-purchase checklist for ${modelLabel}`}
                            onClick={(e) => {
                              if (onNavigateToChecklist) {
                                e.preventDefault();
                                if (onSelectPreset) onSelectPreset(car.id);
                                onNavigateToChecklist(car.id);
                              }
                            }}
                            className="min-h-[44px] inline-flex items-center justify-center rounded-lg bg-surface-subtle dark:bg-zinc-900 border border-border/80 dark:border-zinc-800 text-xs font-sans font-semibold text-emerald-700 dark:text-emerald-400 hover:border-emerald-500 transition-colors"
                          >
                            PPI
                          </a>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default VehicleInternalLinks;

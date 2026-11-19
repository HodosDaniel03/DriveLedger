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
      className="mt-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface dark:bg-[#121215] p-5 sm:p-6 shadow-xs space-y-5 print:hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <span className="text-[10px] font-sans uppercase tracking-widest text-primary-600 dark:text-primary-400 font-bold block">
            Related Vehicle Telemetry &amp; Diagnostics
          </span>
          <h3 className="text-sm sm:text-base font-sans font-bold text-ink dark:text-zinc-100 mt-0.5">
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
              className="inline-flex items-center gap-1 text-xs font-sans font-semibold text-ink dark:text-zinc-200 hover:text-primary-600 dark:hover:text-emerald-400 hover:underline"
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
            className="inline-flex items-center gap-1 text-xs font-sans font-semibold text-primary-600 dark:text-emerald-400 hover:underline"
          >
            <span>All {BRAND_DIRECTORY.length} Brands &amp; {VEHICLE_PRESETS.length} Models</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-xs font-sans">
        {/* 1. Core Vehicle Dossiers */}
        <div className="space-y-2">
          <div className="font-semibold text-ink dark:text-zinc-200 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
            <span>Core Calculators</span>
          </div>
          <ul className="space-y-1.5 text-body dark:text-zinc-300">
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
                className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline block truncate"
              >
                {shortName} 5-Year TCO Calculator
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
                className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline block truncate"
              >
                {shortName} Powertrain Risk Matrix
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
                className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline block truncate"
              >
                {shortName} Pre-Purchase Checklist (PPI)
              </a>
            </li>
          </ul>
        </div>

        {/* 2. Mileage Bracket Risk Dossiers */}
        <div className="space-y-2">
          <div className="font-semibold text-ink dark:text-zinc-200 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Mileage Risk Brackets</span>
          </div>
          <ul className="space-y-1.5 text-body dark:text-zinc-300">
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
                  className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline block truncate"
                >
                  {shortName} at {b.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Segment Rival Comparisons */}
        <div className="space-y-2">
          <div className="font-semibold text-ink dark:text-zinc-200 flex items-center gap-1.5">
            <GitCompare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Segment Rival Comparisons</span>
          </div>
          <ul className="space-y-1.5 text-body dark:text-zinc-300">
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
                  className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline block truncate"
                >
                  {pair.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* 4. Compatible OBD-II Fault Dossiers */}
        <div className="space-y-2">
          <div className="font-semibold text-ink dark:text-zinc-200 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
            <span>Common OBD-II Fault Codes</span>
          </div>
          <ul className="space-y-1.5 text-body dark:text-zinc-300">
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
                  className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline flex items-center gap-1.5 truncate"
                >
                  <span className="font-mono font-bold text-primary-600 dark:text-primary-400 shrink-0">
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
      className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <h3 className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wider text-ink dark:text-zinc-100">
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
          className="inline-flex items-center gap-1 text-xs font-sans font-semibold text-primary-600 dark:text-emerald-400 hover:underline"
        >
          <span>Open Full HTML Vehicle Directory</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
      <ul className="flex flex-wrap gap-1.5 text-xs font-sans">
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-body dark:text-zinc-300 hover:border-primary-500 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors"
            >
              <span className="font-medium">{b.name}</span>
              <span className="text-[10px] font-mono tabular-nums text-muted dark:text-zinc-500">
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
      className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wider text-ink dark:text-zinc-100">
            Complete Brand &amp; Model Telemetry Catalog ({brandsGroup.length} Brands · {matchedCount} Models)
          </h2>
        </div>
        <span className="text-[11px] font-sans text-muted dark:text-zinc-400">
          Direct TCO, Risk Matrix &amp; PPI Index
        </span>
      </div>

      {brandsGroup.length === 0 ? (
        <p className="text-sm text-muted dark:text-zinc-400 py-8 text-center">
          No vehicle configurations match your current filter. Try clearing the search box.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 text-xs font-sans">
          {brandsGroup.map(([brandName, models]) => {
            const brandSlug = slugifyBrandName(brandName);
            return (
              <section
                key={brandName}
                id={`brand-${brandSlug}`}
                aria-label={`${brandName} vehicles`}
                className="scroll-mt-28 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 space-y-2"
              >
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                  <h3 className="font-bold text-ink dark:text-zinc-100 text-xs">
                    <a
                      href={`/vehicles/${brandSlug}`}
                      onClick={(e) => {
                        if (onNavigateToBrand) {
                          e.preventDefault();
                          onNavigateToBrand(brandSlug);
                        }
                      }}
                      className="hover:text-primary-600 dark:hover:text-emerald-400 hover:underline"
                    >
                      {brandName}
                    </a>
                  </h3>
                  <span className="text-[10px] font-mono tabular-nums text-muted dark:text-zinc-400">
                    {models.length} {models.length === 1 ? 'model' : 'models'}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {models.map((car) => (
                    <li key={car.id} className="flex items-center justify-between gap-2">
                      <a
                        href={`/tco/${car.id}`}
                        onClick={(e) => {
                          if (onNavigateToTco) {
                            e.preventDefault();
                            if (onSelectPreset) onSelectPreset(car.id);
                            onNavigateToTco(car.id);
                          }
                        }}
                        className="text-body dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 hover:underline truncate"
                        title={`${car.name} 5-Year True Cost to Own`}
                      >
                        {car.shortName || car.name}
                      </a>
                      <div className="flex items-center gap-1 shrink-0 text-[10px] font-mono">
                        <a
                          href={`/tco/${car.id}`}
                          onClick={(e) => {
                            if (onNavigateToTco) {
                              e.preventDefault();
                              if (onSelectPreset) onSelectPreset(car.id);
                              onNavigateToTco(car.id);
                            }
                          }}
                          className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-primary-700 dark:text-primary-400 hover:border-primary-500"
                        >
                          TCO
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
                          className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-amber-700 dark:text-amber-400 hover:border-amber-500"
                        >
                          Risk
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
                          className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-emerald-700 dark:text-emerald-400 hover:border-emerald-500"
                        >
                          PPI
                        </a>
                      </div>
                    </li>
                  ))}
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

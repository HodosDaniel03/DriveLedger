/**
 * DriveLedger | Canonical 35-Brand Directory & Brand Hub Route Helpers
 *
 * Pure JS module shared by React views (App.jsx, VehiclesCatalogPage.jsx,
 * VehicleInternalLinks.jsx, DynamicSeoHead.jsx) and build-time SEO scripts
 * (generate-sitemap-seo.mjs, prerender-seo-routes.mjs).
 */

import { VEHICLE_PRESETS } from './vehiclePresets.js';
import { calculateTcoProjection, resolvePowertrainType } from './maintenanceData.js';

export function slugifyBrandName(brandName) {
  return String(brandName || 'other')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildBrandDirectory() {
  const byBrand = new Map();
  for (const preset of VEHICLE_PRESETS) {
    const name = preset.brand || 'Other';
    if (!byBrand.has(name)) {
      byBrand.set(name, []);
    }
    byBrand.get(name).push(preset);
  }

  return Array.from(byBrand.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, models]) => {
      const slug = slugifyBrandName(name);
      const sortedModels = [...models].sort((a, b) =>
        (a.shortName || a.name).localeCompare(b.shortName || b.name)
      );
      const powertrainCounts = {
        gasoline: 0,
        diesel: 0,
        hybrid: 0,
        ev: 0,
      };
      for (const m of sortedModels) {
        const pt = resolvePowertrainType(m);
        if (pt === 'EV') powertrainCounts.ev += 1;
        else if (pt === 'HEV' || pt === 'PHEV') powertrainCounts.hybrid += 1;
        else if (pt === 'ICE_DIESEL') powertrainCounts.diesel += 1;
        else powertrainCounts.gasoline += 1;
      }
      return {
        name,
        slug,
        models: sortedModels,
        modelCount: sortedModels.length,
        powertrainCounts,
      };
    });
}

export const BRAND_DIRECTORY = Object.freeze(buildBrandDirectory());

const BRAND_BY_SLUG = new Map(BRAND_DIRECTORY.map((b) => [b.slug, b]));

const STRICT_CANONICAL_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function getBrandBySlug(slug) {
  if (!slug || typeof slug !== 'string') return null;
  let decoded;
  try {
    decoded = decodeURIComponent(slug.trim());
  } catch {
    return null;
  }
  const normalized = decoded
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (!STRICT_CANONICAL_SLUG_REGEX.test(normalized)) {
    return null;
  }
  return BRAND_BY_SLUG.get(normalized) || null;
}

const BRAND_HUB_PATH_REGEX = /^\/vehicles\/([^/?#]+)\/?$/i;

export function parseBrandHubPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return null;
  const match = pathname.match(BRAND_HUB_PATH_REGEX);
  if (!match) return null;
  const brand = getBrandBySlug(match[1]);
  if (!brand) return null;
  return {
    tab: 'vehicles',
    brandSlug: brand.slug,
    brandName: brand.name,
    brand,
  };
}

const brandTelemetryCache = new Map();

export function computeBrandTelemetrySummary(brandEntryOrSlug) {
  const brand =
    typeof brandEntryOrSlug === 'string'
      ? getBrandBySlug(brandEntryOrSlug)
      : brandEntryOrSlug;
  if (!brand || !Array.isArray(brand.models) || brand.models.length === 0) {
    return null;
  }
  if (brandTelemetryCache.has(brand.slug)) {
    return brandTelemetryCache.get(brand.slug);
  }

  const modelSummaries = brand.models.map((preset) => {
    const tco = calculateTcoProjection({
      purchasePriceUsd: preset.purchasePriceUsd,
      odometerMiles: preset.defaultOdometerMiles,
      annualDistanceMiles: preset.annualDistanceMiles,
      mpgUs: preset.mpgUs,
      isEv: preset.isEv,
      powertrainType: preset.powertrainType || preset.powertrain,
      vehicle: preset,
      fuelPriceUsdGal: preset.defaultFuelPriceUsdGal,
      annualInsuranceUsd: preset.annualInsuranceUsd,
      baseAnnualMaintenanceUsd: preset.baseAnnualMaintenanceUsd,
      maintenanceWearFactor: preset.maintenanceWearFactor,
      downPaymentPct: 20,
      aprPct: 6.2,
      loanTermMonths: 60,
      horizonYears: 5,
      residualCurve10Yr: preset.residualCurve10Yr,
    });
    return {
      preset,
      total5YrTcoUsd: tco.totalEconomicCostUsd,
      monthlyTcoUsd: tco.monthlyEconomicCostUsd,
      costPerMileUsd: tco.costPerMileUsd,
      depreciation5YrUsd: tco.totalDepreciationUsd,
      fuel5YrUsd: tco.totalFuelUsd,
      maintenance5YrUsd: tco.totalMaintenanceUsd,
    };
  });

  const count = modelSummaries.length;
  const totalSum = modelSummaries.reduce((acc, m) => acc + m.total5YrTcoUsd, 0);
  const monthlySum = modelSummaries.reduce((acc, m) => acc + m.monthlyTcoUsd, 0);
  const maintenance5YrSum = modelSummaries.reduce((acc, m) => acc + (m.maintenance5YrUsd || 0), 0);
  const sortedByCost = [...modelSummaries].sort((a, b) => a.total5YrTcoUsd - b.total5YrTcoUsd);
  const avg5YrMaintenanceUsd = Math.round(maintenance5YrSum / count);
  const avgAnnualMaintenanceUsd = Math.round(avg5YrMaintenanceUsd / 5);

  const summary = {
    brandName: brand.name,
    brandSlug: brand.slug,
    modelCount: count,
    powertrainCounts: brand.powertrainCounts,
    avg5YrTcoUsd: Math.round(totalSum / count),
    avgMonthlyTcoUsd: Math.round(monthlySum / count),
    avg5YrMaintenanceUsd,
    avgAnnualMaintenanceUsd,
    min5YrTcoUsd: sortedByCost[0].total5YrTcoUsd,
    max5YrTcoUsd: sortedByCost[count - 1].total5YrTcoUsd,
    lowestTcoModel: sortedByCost[0],
    highestTcoModel: sortedByCost[count - 1],
    modelSummaries,
  };

  brandTelemetryCache.set(brand.slug, summary);
  return summary;
}

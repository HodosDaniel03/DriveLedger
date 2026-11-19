import React, { useEffect, useMemo } from 'react';
import { VEHICLE_PRESETS, getPresetById } from '../../data/vehiclePresets';
import { OBD_CODES } from '../../data/obdCodes';
import {
  MAINTENANCE_COMPONENTS,
  evaluateComponentHealth,
  calculateTcoProjection,
  filterComponentsForPowertrain,
  isPureElectric,
} from '../../data/maintenanceData';
import { FAQ_ITEMS } from '../../data/faqItems';
import { MILEAGE_BRACKET_SLUGS } from '../../data/seoMatrixData';
import { MONETIZATION_CONFIG } from '../../config/monetizationConfig';
import { GUIDES_DATA } from '../../data/guidesData';
import { LEGAL_POLICIES, resolveLegalPolicyKey } from '../../data/legalPolicies';
import { resolveVehiclePhotoUrl } from '../common/vehicle/VehicleImageResolver';
import {
  BRAND_DIRECTORY,
  getBrandBySlug,
  computeBrandTelemetrySummary,
} from '../../data/brandDirectory';

const SITE_ORIGIN = `https://${MONETIZATION_CONFIG.domain}`;
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;
const BRAND_LOGO_URL = `${SITE_ORIGIN}/logo-512.png`;

const CANONICAL_TAB_PATHS = {
  overview: '/',
  tco: '/tco',
  risk: '/risk-matrix',
  obd: '/obd-estimator',
  compare: '/compare',
  checklist: '/checklist',
  vehicles: '/vehicles',
  methodology: '/methodology',
  reviews: '/reviews',
  blog: '/guides',
  guides: '/guides',
  about: '/about',
  contact: '/contact',
};

/**
 * Computes baseline 5-Year TCO and Reliability Score for a given vehicle preset
 * so dynamic meta tags and JSON-LD structured data expose live quantitative telemetry.
 */
export function computePresetSeoTelemetry(preset) {
  const safePreset = preset || VEHICLE_PRESETS[0];

  const tco = calculateTcoProjection({
    purchasePriceUsd: safePreset.purchasePriceUsd,
    odometerMiles: safePreset.defaultOdometerMiles,
    annualDistanceMiles: safePreset.annualDistanceMiles,
    mpgUs: safePreset.mpgUs,
    isEv: safePreset.isEv,
    powertrainType: safePreset.powertrainType || safePreset.powertrain,
    vehicle: safePreset,
    fuelPriceUsdGal: safePreset.defaultFuelPriceUsdGal,
    annualInsuranceUsd: safePreset.annualInsuranceUsd,
    baseAnnualMaintenanceUsd: safePreset.baseAnnualMaintenanceUsd,
    maintenanceWearFactor: safePreset.maintenanceWearFactor,
    downPaymentPct: 20,
    aprPct: 6.2,
    loanTermMonths: 60,
    horizonYears: 5,
    residualCurve10Yr: safePreset.residualCurve10Yr,
  });

  const physicalOdometerMiles = Math.max(38000, safePreset.defaultOdometerMiles || 58000);
  const relevantComponents = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, safePreset);

  const evaluated = relevantComponents.map((comp) =>
    evaluateComponentHealth({
      component: comp,
      physicalOdometerMiles,
      urbanTripSharePct: 45,
      oilIntervalId: 'standard',
      serviceHistoryId: 'verified',
      transmissionId: safePreset.transmission || 'dct-dsg',
      maintenanceWearFactor: safePreset.maintenanceWearFactor,
    })
  );

  let reliabilityScore = 75;
  if (evaluated.length > 0) {
    const avgWear = evaluated.reduce((acc, h) => acc + h.wearPctOfCritical, 0) / evaluated.length;
    const criticalCount = evaluated.filter((h) => h.status === 'CRITICAL').length;
    const warningCount = evaluated.filter((h) => h.status === 'WARNING').length;
    const penalty = criticalCount * 14 + warningCount * 6;
    const raw = 100 - avgWear * 0.45 - penalty;
    reliabilityScore = Math.min(95, Math.max(18, Math.round(raw)));
  }

  return {
    total5YrTcoUsd: tco.totalEconomicCostUsd,
    monthlyTcoUsd: tco.monthlyEconomicCostUsd,
    costPerMileUsd: tco.costPerMileUsd,
    depreciation5YrUsd: tco.totalDepreciationUsd,
    reliabilityScore,
    odometerMiles: physicalOdometerMiles,
  };
}

function upsertMetaTag(attrName, attrValue, content) {
  if (
    typeof document === 'undefined' ||
    !document.head ||
    typeof document.head.querySelector !== 'function' ||
    typeof document.createElement !== 'function'
  ) {
    return;
  }
  const selector = `meta[${attrName}="${attrValue}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertCanonicalLink(href) {
  if (
    typeof document === 'undefined' ||
    !document.head ||
    typeof document.head.querySelector !== 'function' ||
    typeof document.createElement !== 'function'
  ) {
    return;
  }
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);

  // Upsert regional hreflang alternates for US, UK, EU, and x-default
  const hreflangs = ['en-us', 'en-gb', 'en-ie', 'x-default'];
  for (const lang of hreflangs) {
    let alt = document.head.querySelector(`link[rel="alternate"][hreflang="${lang}"]`);
    if (!alt) {
      alt = document.createElement('link');
      alt.setAttribute('rel', 'alternate');
      alt.setAttribute('hreflang', lang);
      document.head.appendChild(alt);
    }
    alt.setAttribute('href', href);
  }
}

export default function DynamicSeoHead({
  activeTab = 'overview',
  activeGuideSlug = null,
  activeBrandSlug = null,
  selectedPresetId,
  secondaryPresetId,
  mileageBracketSlug,
  selectedObdCode = 'P2002',
  activeLegalPolicy = null,
  hasSelectedVehicle = false,
  hasSelectedObdCode = false,
  isNotFound = false,
  currentPath = null,
}) {
  const resolvedLegalKey = useMemo(() => {
    if (activeLegalPolicy) {
      return resolveLegalPolicyKey(activeLegalPolicy);
    }
    if (typeof window !== 'undefined' && window.location) {
      return (
        resolveLegalPolicyKey(window.location.pathname) ||
        resolveLegalPolicyKey(window.location.hash)
      );
    }
    return null;
  }, [activeLegalPolicy]);

  const preset = useMemo(
    () => getPresetById(selectedPresetId) || VEHICLE_PRESETS[0],
    [selectedPresetId]
  );

  const secondaryPreset = useMemo(() => {
    if (!secondaryPresetId || secondaryPresetId === preset.id) return null;
    const found = VEHICLE_PRESETS.find((p) => p.id === secondaryPresetId);
    return found || null;
  }, [secondaryPresetId, preset.id]);

  const secondaryTelemetry = useMemo(
    () => (secondaryPreset ? computePresetSeoTelemetry(secondaryPreset) : null),
    [secondaryPreset]
  );

  const activeMileageBracket = useMemo(
    () => (mileageBracketSlug ? MILEAGE_BRACKET_SLUGS[mileageBracketSlug] || null : null),
    [mileageBracketSlug]
  );

  const obdDossier = useMemo(() => {
    const normalized = String(selectedObdCode || 'P2002').toUpperCase();
    return OBD_CODES.find((item) => item.code === normalized) || OBD_CODES[0];
  }, [selectedObdCode]);

  const telemetry = useMemo(() => computePresetSeoTelemetry(preset), [preset]);

  const isVehicleSelected = useMemo(() => {
    if (hasSelectedVehicle || Boolean(activeMileageBracket)) return true;
    if (typeof window !== 'undefined' && window.location) {
      const pathname = String(window.location.pathname || '');
      const cleanMatch = pathname.match(/^\/(?:tco|risk-matrix|checklist)\/([^/]+)(?:\/[^/]+)?\/?$/i);
      if (cleanMatch) {
        try {
          const seg = decodeURIComponent(cleanMatch[1]).toLowerCase();
          if (VEHICLE_PRESETS.some((p) => p.id.toLowerCase() === seg)) return true;
        } catch {
          // Malformed URI segment safely treated as unselected
        }
      }
      const obdMatch = pathname.match(/^\/obd\/([^/]+)\/[^/]+\/?$/i);
      if (obdMatch) {
        try {
          const seg = decodeURIComponent(obdMatch[1]).toLowerCase();
          if (VEHICLE_PRESETS.some((p) => p.id.toLowerCase() === seg)) return true;
        } catch {
          // Malformed URI segment safely treated as unselected
        }
      }
      const params = new URLSearchParams(window.location.search || '');
      const qPreset = params.get('preset') || params.get('presetA');
      if (qPreset && VEHICLE_PRESETS.some((p) => p.id === qPreset)) return true;
    }
    return false;
  }, [hasSelectedVehicle, activeMileageBracket, activeTab, selectedPresetId]);

  const activeBrand = useMemo(
    () => (activeTab === 'vehicles' && activeBrandSlug ? getBrandBySlug(activeBrandSlug) : null),
    [activeTab, activeBrandSlug]
  );

  const activeBrandTelemetry = useMemo(
    () => (activeBrand ? computeBrandTelemetrySummary(activeBrand) : null),
    [activeBrand]
  );

  const vehicleImageUrl = useMemo(() => {
    if (!isVehicleSelected) return DEFAULT_OG_IMAGE;
    return resolveVehiclePhotoUrl({ vehicle: preset }) || DEFAULT_OG_IMAGE;
  }, [isVehicleSelected, preset]);

  const seoMetadata = useMemo(() => {
    const resolvedImageUrl = isVehicleSelected ? vehicleImageUrl : DEFAULT_OG_IMAGE;
    const withImage = (meta) => ({
      robots: 'index, follow',
      ...meta,
      imageUrl: meta.imageUrl || resolvedImageUrl,
    });

    if (isNotFound) {
      const badPath =
        currentPath ||
        (typeof window !== 'undefined' && window.location?.pathname
          ? window.location.pathname
          : '/404');
      return withImage({
        title: '404 Page Not Found | DriveLedger',
        description:
          'The requested automotive telemetry page could not be found. Browse 179+ vehicle TCO calculators, powertrain risk matrices, and OBD-II repair estimators.',
        canonicalUrl: `${SITE_ORIGIN}${badPath}`,
        canonicalPath: badPath,
        imageUrl: DEFAULT_OG_IMAGE,
        robots: 'noindex, nofollow',
      });
    }

    if (resolvedLegalKey && LEGAL_POLICIES[resolvedLegalKey]) {
      const policy = LEGAL_POLICIES[resolvedLegalKey];
      const canonicalPath = policy.path || `/${resolvedLegalKey}`;
      const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`;

      let title = `${policy.title} | ${MONETIZATION_CONFIG.brandName}`;
      let description = policy.subtitle;

      if (resolvedLegalKey === 'privacy') {
        title = `Privacy Policy & Telemetry Data Governance | ${MONETIZATION_CONFIG.brandName}`;
        description = `DriveLedger Privacy Policy: European GDPR, UK GDPR, and US state regulations (CCPA/CPRA/VCDPA/CPA/CTDPA) compliance, Google AdSense (ca-pub-6581535125716295) disclosures, and telemetry governance.`;
      } else if (resolvedLegalKey === 'terms') {
        title = `Terms of Service, Liability Shield & Disclaimers | ${MONETIZATION_CONFIG.brandName}`;
        description = `DriveLedger Terms of Service: workshop safety waiver, statistical depreciation disclaimers, and nominative trademark fair use notices.`;
      } else if (resolvedLegalKey === 'cookies') {
        title = `Cookie Policy, Local Storage & Consent Governance | ${MONETIZATION_CONFIG.brandName}`;
        description = `DriveLedger Cookie Policy: First-party local storage, Google AdSense (ca-pub-6581535125716295) DoubleClick advertising cookies, IAB TCF v2.2 compliance, and opt-out controls.`;
      } else if (resolvedLegalKey === 'disclaimer') {
        title = `Comprehensive Automotive & Financial Disclaimer | ${MONETIZATION_CONFIG.brandName}`;
        description = `DriveLedger Liability Disclaimer: Statistical financial estimates, workshop safety waivers, and nominative fair use declarations.`;
      } else if (resolvedLegalKey === 'affiliate-disclosure') {
        title = `FTC Affiliate Disclosure & Editorial Independence | ${MONETIZATION_CONFIG.brandName}`;
        description = `DriveLedger FTC 16 CFR Part 255 compliance, Amazon Associates program disclosure, and algorithmic firewall guarantees.`;
      } else if (resolvedLegalKey === 'do-not-sell') {
        title = `Do Not Sell or Share My Personal Information | ${MONETIZATION_CONFIG.brandName}`;
        description = `Exercise your US state privacy rights under CCPA, CPRA, VCDPA, CPA, and CTDPA to opt out of the sale or sharing of personal information for cross-context behavioral advertising.`;
      }

      return withImage({
        title,
        description,
        canonicalUrl,
        canonicalPath,
        imageUrl: DEFAULT_OG_IMAGE,
      });
    }

    if (activeTab === 'overview') {
      return withImage({
        title: 'DriveLedger | Independent Car Ownership Cost, Reliability & OBD-II Platform',
        description:
          'Calculate real 5-year car ownership costs, depreciation curves, mileage failure risks, and fair OBD-II workshop repair prices across 179+ models.',
        canonicalUrl: `${SITE_ORIGIN}/`,
        canonicalPath: '/',
        imageUrl: DEFAULT_OG_IMAGE,
      });
    }

    const codeLower = obdDossier.code.toLowerCase();
    const wearScale = Number(preset.maintenanceWearFactor) > 0 ? Number(preset.maintenanceWearFactor) : 1.0;
    const minParts = Math.round((obdDossier.partsCostRangeUsd?.[0] ?? 95) * wearScale);
    const maxParts = Math.round((obdDossier.partsCostRangeUsd?.[1] ?? 1650) * wearScale);
    const minLabor = obdDossier.laborHoursRange?.[0] ?? 1.0;
    const maxLabor = obdDossier.laborHoursRange?.[1] ?? 4.0;

    if (activeTab === 'obd') {
      const isExplicitObdLanding =
        hasSelectedObdCode ||
        (typeof window !== 'undefined' && /^\/obd\//i.test(window.location.pathname));

      if (isExplicitObdLanding) {
        const canonicalPath = `/obd/${preset.id}/${codeLower}`;
        const title = `${preset.name} ${obdDossier.code} ${obdDossier.title}: Repair Cost & Live PID Guide | DriveLedger`;
        const description = `Diagnose ${obdDossier.code} (${obdDossier.title}) on the ${preset.name} (${preset.engineCode}). Compare Dealership vs Independent vs DIY repair costs ($${minParts}–$${maxParts} parts, ${minLabor}–${maxLabor}h labor) and run First-Principles OBD-II Live PID telemetry checks.`;
        return withImage({
          title,
          description,
          canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
          canonicalPath,
        });
      }

      const canonicalPath = '/obd-estimator';
      const title = 'OBD-II Diagnostic Trouble Code Repair Cost Estimator | DriveLedger';
      const description =
        'Lookup diagnostic trouble codes (DTC), compare DIY vs Independent vs Dealership repair prices, and run first-principles live PID tests.';
      return withImage({
        title,
        description,
        canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
        canonicalPath,
      });
    }

    if (activeTab === 'tco') {
      if (!isVehicleSelected) {
        return withImage({
          title: '5-Year True Cost to Own (TCO) Calculator | DriveLedger',
          description:
            'Calculate 5-year ownership costs, non-linear depreciation curves, financing interest, fuel, insurance, and scheduled maintenance for any vehicle.',
          canonicalUrl: `${SITE_ORIGIN}/tco`,
          canonicalPath: '/tco',
          imageUrl: DEFAULT_OG_IMAGE,
        });
      }
      const canonicalPath = `/tco/${preset.id}`;
      const title = `${preset.name} 5-Year True Cost to Own & Depreciation | DriveLedger`;
      const description = `${preset.name} (${preset.engineCode}) 5-year True Cost to Own is projected at $${telemetry.total5YrTcoUsd.toLocaleString()} ($${telemetry.monthlyTcoUsd}/mo or $${telemetry.costPerMileUsd}/mi), including $${telemetry.depreciation5YrUsd.toLocaleString()} non-linear depreciation and maintenance reserves.`;
      return withImage({
        title,
        description,
        canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
        canonicalPath,
      });
    }

    if (activeTab === 'risk') {
      if (activeMileageBracket) {
        const canonicalPath = `/risk-matrix/${preset.id}/${activeMileageBracket.slug}`;
        const isPureEv = isPureElectric(preset);
        const title = `${preset.name} at ${activeMileageBracket.label}: Reliability Risk & Maintenance Costs | DriveLedger`;
        const description = isPureEv
          ? `Buying or owning a ${preset.name} (${preset.engineCode}) at ${activeMileageBracket.label}? Inspect HV battery State of Health (SoH %), OBC/ICCU electronics, heat pump thermal valves, reduction gear wear, and 12-month repair reserves.`
          : `Buying or owning a ${preset.name} (${preset.engineCode}) at ${activeMileageBracket.label}? Inspect imminent timing, transmission, DPF/emissions, and suspension failure probabilities, 12-month repair reserves, and OEM vs Preventative service schedules.`;
        return withImage({
          title,
          description,
          canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
          canonicalPath,
        });
      }
      if (!isVehicleSelected) {
        return withImage({
          title: 'Powertrain Maintenance Risk Matrix & Reliability Score | DriveLedger',
          description:
            'Inspect upcoming maintenance horizons, thermodynamic urban wear penalties, and known powertrain defects across 179 vehicle configurations.',
          canonicalUrl: `${SITE_ORIGIN}/risk-matrix`,
          canonicalPath: '/risk-matrix',
          imageUrl: DEFAULT_OG_IMAGE,
        });
      }
      const canonicalPath = `/risk-matrix/${preset.id}`;
      const title = `${preset.name} Reliability Score & Maintenance Risk Matrix | DriveLedger`;
      const description = `${preset.name} achieves a ${telemetry.reliabilityScore}/100 Engineering Reliability Score at ${telemetry.odometerMiles.toLocaleString()} miles. Inspect critical wear horizons, thermodynamic urban duty penalties, and known defects (${preset.criticalDefectTag || 'Powertrain Telemetry'}).`;
      return withImage({
        title,
        description,
        canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
        canonicalPath,
      });
    }

    if (activeTab === 'compare') {
      if (secondaryPreset && secondaryTelemetry) {
        const canonicalPath = `/compare/${preset.id}-vs-${secondaryPreset.id}`;
        const delta5Yr = Math.abs(telemetry.total5YrTcoUsd - secondaryTelemetry.total5YrTcoUsd);
        const cheaperName =
          secondaryTelemetry.total5YrTcoUsd < telemetry.total5YrTcoUsd
            ? secondaryPreset.name
            : preset.name;
        const title = `${preset.name} vs ${secondaryPreset.name}: 5-Year TCO & Reliability Comparison | DriveLedger`;
        const description = `${preset.name} ($${telemetry.total5YrTcoUsd.toLocaleString()} 5-yr TCO, ${telemetry.reliabilityScore}/100 reliability) vs ${secondaryPreset.name} ($${secondaryTelemetry.total5YrTcoUsd.toLocaleString()} 5-yr TCO, ${secondaryTelemetry.reliabilityScore}/100 reliability). ${cheaperName} saves $${delta5Yr.toLocaleString()} over 5 years.`;
        return withImage({
          title,
          description,
          canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
          canonicalPath,
        });
      }
      const canonicalPath = '/compare';
      const title = isVehicleSelected
        ? `Side-by-Side Comparison: ${preset.name} TCO & Break-Even Trajectory | DriveLedger`
        : 'Head-to-Head Vehicle Cost & Reliability Comparator | DriveLedger';
      const description = isVehicleSelected
        ? `Compare the ${preset.name} (${preset.engineCode}) against alternatives: 5-year TCO break-even crossover trajectory, true running costs, and known reliability flaws.`
        : 'Compare any two vehicles side-by-side: 5-year TCO break-even crossover trajectory, true running costs, and known reliability flaws.';
      return withImage({
        title,
        description,
        canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
        canonicalPath,
      });
    }

    if (activeTab === 'checklist') {
      if (!isVehicleSelected) {
        return withImage({
          title: 'Pre-Purchase Inspection (PPI) Checklist & Defect Flagging | DriveLedger',
          description:
            'Master the used car pre-purchase inspection: cold-start protocols, fluid condition tests, diagnostic scans, and printable PDF inspection reports.',
          canonicalUrl: `${SITE_ORIGIN}/checklist`,
          canonicalPath: '/checklist',
          imageUrl: DEFAULT_OG_IMAGE,
        });
      }
      const canonicalPath = `/checklist/${preset.id}`;
      const title = `Pre-Purchase Inspection Checklist (PPI) – ${preset.name} | DriveLedger`;
      const description = `On-site used car inspection checklist for ${preset.name} (${preset.engineCode}): critical known flaws, engine bay and chassis inspection, OBD-II diagnostics, and printable PDF report.`;
      return withImage({
        title,
        description,
        canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
        canonicalPath,
      });
    }

    if (activeTab === 'methodology') {
      const canonicalPath = '/methodology';
      const title = 'Automotive Engineering & Cost Methodology | DriveLedger';
      const description =
        'Mathematical models, logarithmic depreciation formulas, Bayesian OBD-II probability, and actuarial data sources powering the DriveLedger platform.';
      return withImage({
        title,
        description,
        canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
        canonicalPath,
        imageUrl: DEFAULT_OG_IMAGE,
      });
    }

    if (activeTab === 'reviews') {
      const canonicalPath = '/reviews';
      const title = 'Owner Reviews & Repair Cost Benchmarks | DriveLedger';
      const description =
        'Compare real-world repair shop quotes against independent parts and labor benchmarks, and read verified owner maintenance notes.';
      return withImage({
        title,
        description,
        canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
        canonicalPath,
        imageUrl: DEFAULT_OG_IMAGE,
      });
    }

    if (activeTab === 'about') {
      const canonicalPath = '/about';
      const title = 'About DriveLedger | Independent Car Cost & Reliability Analytics';
      const description = 'DriveLedger is an independent automotive engineering and financial analytics platform. Learn about our actuarial depreciation curves, mileage risk weighting, and regional labor rates.';
      return withImage({
        title,
        description,
        canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
        canonicalPath,
        imageUrl: DEFAULT_OG_IMAGE,
      });
    }

    if (activeTab === 'contact') {
      const canonicalPath = '/contact';
      const title = 'Contact DriveLedger | Editorial, Engineering & Legal Desk';
      const description = 'Contact the DriveLedger automotive engineering team for calculation inquiries, catalog corrections, or data protection assistance.';
      return withImage({
        title,
        description,
        canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
        canonicalPath,
        imageUrl: DEFAULT_OG_IMAGE,
      });
    }

    if (activeTab === 'vehicles') {
      if (activeBrand && activeBrandTelemetry) {
        const canonicalPath = `/vehicles/${activeBrand.slug}`;
        const modelWord = activeBrand.modelCount === 1 ? 'Model' : 'Models';
        const title = `${activeBrand.name} Maintenance Cost, 5-Year TCO & Reliability (${activeBrand.modelCount} ${modelWord}) | DriveLedger`;
        const description = `Compare ${activeBrand.name} 5-year True Cost to Own (avg $${activeBrandTelemetry.avg5YrTcoUsd.toLocaleString()}, $${activeBrandTelemetry.avgMonthlyTcoUsd}/mo), powertrain wear risks, and pre-purchase inspection checklists across ${activeBrand.modelCount} benchmarked ${activeBrand.name} models.`;
        const brandHeroImage =
          resolveVehiclePhotoUrl({ vehicle: activeBrand.models[0] }) || DEFAULT_OG_IMAGE;
        return withImage({
          title,
          description,
          canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
          canonicalPath,
          imageUrl: brandHeroImage,
        });
      }
      const canonicalPath = '/vehicles';
      const title = `All ${BRAND_DIRECTORY.length} Brands & ${VEHICLE_PRESETS.length} Benchmarked Vehicle Models | DriveLedger Directory`;
      const description =
        `Browse all ${BRAND_DIRECTORY.length} automotive manufacturers and ${VEHICLE_PRESETS.length} vehicle configurations. Direct links to dedicated brand hubs, 5-Year True Cost to Own calculators, Powertrain Risk Matrices, and Pre-Purchase Inspection checklists.`;
      return withImage({
        title,
        description,
        canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
        canonicalPath,
        imageUrl: DEFAULT_OG_IMAGE,
      });
    }

    if (activeTab === 'guides' || activeTab === 'blog') {
      if (activeGuideSlug) {
        const guide = GUIDES_DATA.find((g) => g.slug === activeGuideSlug);
        if (guide) {
          const canonicalPath = `/guides/${guide.slug}`;
          return withImage({
            title: guide.metaTitle || `${guide.title} | DriveLedger`,
            description: guide.metaDescription || guide.summary,
            canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
            canonicalPath,
            imageUrl: DEFAULT_OG_IMAGE,
          });
        }
      }
      const canonicalPath = '/guides';
      const title = 'Buyer Guides & Automotive Due Diligence Insights | DriveLedger';
      const description = 'In-depth used car buyer guides, pre-purchase inspection protocols, and long-term ownership cost analyses written by master automotive technicians.';
      return withImage({
        title,
        description,
        canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
        canonicalPath,
        imageUrl: DEFAULT_OG_IMAGE,
      });
    }

    const baseTabPath = CANONICAL_TAB_PATHS[activeTab] || '/';
    const title = `${preset.name} TCO, Reliability Score (${telemetry.reliabilityScore}/100) & ${obdDossier.code} Diagnostics | DriveLedger`;
    const description = `Independent automotive engineering platform: ${preset.name} 5-year TCO ($${telemetry.total5YrTcoUsd.toLocaleString()}), powertrain reliability score (${telemetry.reliabilityScore}/100), and ${obdDossier.code} live PID diagnostic protocols.`;
    return withImage({
      title,
      description,
      canonicalUrl: `${SITE_ORIGIN}${baseTabPath}`,
      canonicalPath: baseTabPath,
    });
  }, [isNotFound, currentPath, resolvedLegalKey, activeTab, activeGuideSlug, activeBrand, activeBrandTelemetry, preset, secondaryPreset, secondaryTelemetry, activeMileageBracket, obdDossier, telemetry, isVehicleSelected, hasSelectedObdCode, vehicleImageUrl]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = seoMetadata.title;
      upsertMetaTag('name', 'description', seoMetadata.description);
      upsertMetaTag('name', 'robots', seoMetadata.robots || 'index, follow');
      upsertMetaTag('property', 'og:title', seoMetadata.title);
      upsertMetaTag('property', 'og:description', seoMetadata.description);
      upsertMetaTag('property', 'og:url', seoMetadata.canonicalUrl);
      upsertMetaTag('property', 'og:image', seoMetadata.imageUrl || DEFAULT_OG_IMAGE);
      upsertMetaTag('name', 'twitter:card', 'summary_large_image');
      upsertMetaTag('name', 'twitter:title', seoMetadata.title);
      upsertMetaTag('name', 'twitter:description', seoMetadata.description);
      upsertMetaTag('name', 'twitter:image', seoMetadata.imageUrl || DEFAULT_OG_IMAGE);
      upsertCanonicalLink(seoMetadata.canonicalUrl);

      // Remove build-time static JSON-LD once React takes over structured data
      // so hydrated pages never emit duplicate FAQPage / Vehicle / HowTo schemas.
      const prerenderJsonLd =
        typeof document.getElementById === 'function'
          ? document.getElementById('prerender-jsonld')
          : document.head?.querySelector?.('#prerender-jsonld');
      if (prerenderJsonLd && typeof prerenderJsonLd.remove === 'function') {
        prerenderJsonLd.remove();
      } else if (prerenderJsonLd?.parentNode) {
        prerenderJsonLd.parentNode.removeChild(prerenderJsonLd);
      }
    }
  }, [seoMetadata]);

  // 0. Top-Level Organization & WebSite Schema for Google Search Brand Identity
  const organizationAndWebsiteSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${SITE_ORIGIN}/#organization`,
          name: 'DriveLedger',
          url: SITE_ORIGIN,
          logo: BRAND_LOGO_URL,
          image: DEFAULT_OG_IMAGE,
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE_ORIGIN}/#website`,
          name: 'DriveLedger',
          url: SITE_ORIGIN,
          publisher: {
            '@id': `${SITE_ORIGIN}/#organization`,
          },
          logo: BRAND_LOGO_URL,
          image: DEFAULT_OG_IMAGE,
        },
      ],
    }),
    []
  );

  // 1. Vehicle / TCO / Reliability Quantitative Schema
  const vehicleSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Vehicle',
      name: preset.name,
      image: vehicleImageUrl,
      brand: {
        '@type': 'Brand',
        name: preset.brand,
      },
      model: preset.modelName,
      vehicleModelDate: String(preset.year || 2022),
      bodyType: preset.bodyType,
      fuelType: preset.fuelType,
      vehicleTransmission: preset.transmissionLabel,
      vehicleEngine: {
        '@type': 'EngineSpecification',
        name: preset.engineCode,
        fuelType: preset.fuelType,
        enginePower: {
          '@type': 'QuantitativeValue',
          value: preset.powerHp,
          unitCode: 'BHP',
        },
      },
      mileageFromOdometer: {
        '@type': 'QuantitativeValue',
        value: telemetry.odometerMiles,
        unitCode: 'SMI',
      },
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Estimated 5-Year True Cost to Own (TCO)',
          value: telemetry.total5YrTcoUsd,
          unitText: 'USD',
        },
        {
          '@type': 'PropertyValue',
          name: '5-Year Non-Linear Depreciation',
          value: telemetry.depreciation5YrUsd,
          unitText: 'USD',
        },
        {
          '@type': 'PropertyValue',
          name: 'Engineering Reliability Score',
          value: telemetry.reliabilityScore,
          minValue: 0,
          maxValue: 100,
          unitText: 'Points',
        },
      ],
      potentialAction: {
        '@type': 'AssessAction',
        name: `Calculate 5-Year TCO & Reliability Risk for ${preset.name}`,
        target: `${SITE_ORIGIN}/tco/${preset.id}`,
        result: {
          '@type': 'QuantitativeValue',
          name: '5-Year Net Economic Ownership Cost',
          value: telemetry.total5YrTcoUsd,
          unitText: 'USD',
        },
      },
    }),
    [preset, telemetry, vehicleImageUrl]
  );

  // 2. OBD Diagnostic TechArticle + HowTo Schema
  const obdDiagnosticSchema = useMemo(() => {
    const pids = obdDossier.liveTelemetryCheck?.pidsToMonitor || [];
    const pidSteps = pids.map((pid, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: `Monitor OBD-II Live PID: ${pid}`,
      text: `Connect an SAE J1979 OBD-II scanner to the ${preset.name} (${preset.engineCode}) and graph live telemetry for ${pid}.`,
    }));

    const protocolStep = {
      '@type': 'HowToStep',
      position: pidSteps.length + 1,
      name: `Execute ${obdDossier.code} First-Principles Verification Protocol`,
      text: `${obdDossier.liveTelemetryCheck?.baselineValues || ''} ${obdDossier.liveTelemetryCheck?.diagnosticProtocol || ''}`.trim(),
    };

    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'TechArticle',
          headline: `${preset.name} ${obdDossier.code}: ${obdDossier.title} Diagnostic & Repair Guide`,
          description: seoMetadata.description,
          proficiencyLevel: 'Expert',
          about: {
            '@type': 'Vehicle',
            name: preset.name,
            vehicleEngine: {
              '@type': 'EngineSpecification',
              name: preset.engineCode,
            },
          },
        },
        {
          '@type': 'HowTo',
          name: `How to Diagnose ${obdDossier.code} (${obdDossier.title}) on ${preset.name} Before Replacing Parts`,
          description:
            obdDossier.liveTelemetryCheck?.diagnosticProtocol ||
            `Step-by-step live PID diagnostic verification for ${obdDossier.code}.`,
          about: {
            '@type': 'Vehicle',
            name: preset.name,
            fuelType: preset.fuelType,
          },
          estimatedCost: {
            '@type': 'MonetaryAmount',
            currency: 'USD',
            minValue: Math.round((obdDossier.partsCostRangeUsd?.[0] ?? 95) * (Number(preset.maintenanceWearFactor) > 0 ? Number(preset.maintenanceWearFactor) : 1.0)),
            maxValue: Math.round((obdDossier.partsCostRangeUsd?.[1] ?? 1650) * (Number(preset.maintenanceWearFactor) > 0 ? Number(preset.maintenanceWearFactor) : 1.0)),
          },
          step: [...pidSteps, protocolStep],
        },
      ],
    };
  }, [preset, obdDossier, seoMetadata.description]);

  // 3. Route-Specific FAQPage Schema (strictly one FAQPage per relevant page, never duplicated)
  const faqSchema = useMemo(() => {
    if ((activeTab === 'guides' || activeTab === 'blog') && activeGuideSlug) {
      const guide = GUIDES_DATA.find((g) => g.slug === activeGuideSlug);
      if (guide?.faqs?.length) {
        return {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: guide.faqs.map((item) => ({
            '@type': 'Question',
            name: item.question || item.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer || item.a,
            },
          })),
        };
      }
    }

    const dynamicFaqs = [];
    if (isVehicleSelected && ['tco', 'risk', 'checklist', 'compare'].includes(activeTab)) {
      dynamicFaqs.push({
        question: `What is the 5-year True Cost to Own (TCO) and Reliability Score for the ${preset.name}?`,
        answer: `Based on DriveLedger telemetry modeling, the ${preset.name} (${preset.engineCode}) carries an estimated 5-year True Cost to Own of $${telemetry.total5YrTcoUsd.toLocaleString()} ($${telemetry.monthlyTcoUsd}/month or $${telemetry.costPerMileUsd}/mile) and an Engineering Reliability Score of ${telemetry.reliabilityScore}/100 at ${telemetry.odometerMiles.toLocaleString()} miles.`,
      });
    }
    if (activeTab === 'obd' && (hasSelectedObdCode || isVehicleSelected)) {
      const wearScale = Number(preset.maintenanceWearFactor) > 0 ? Number(preset.maintenanceWearFactor) : 1.0;
      const faqMinParts = Math.round((obdDossier.partsCostRangeUsd?.[0] ?? 95) * wearScale);
      const faqMaxParts = Math.round((obdDossier.partsCostRangeUsd?.[1] ?? 1650) * wearScale);
      dynamicFaqs.push({
        question: `How much does it cost to fix OBD-II code ${obdDossier.code} (${obdDossier.title}) on a ${preset.name}?`,
        answer: `For code ${obdDossier.code} on the ${preset.name}, component parts typically range from $${faqMinParts} to $${faqMaxParts} with ${obdDossier.laborHoursRange?.[0] ?? 1.0} to ${obdDossier.laborHoursRange?.[1] ?? 4.0} hours of workshop labor. ${obdDossier.liveTelemetryCheck?.costTrapWarning || ''}`,
      });
    }
    dynamicFaqs.push(...FAQ_ITEMS.slice(0, 3));

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: dynamicFaqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };
  }, [activeTab, activeGuideSlug, isVehicleSelected, hasSelectedObdCode, preset, obdDossier, telemetry]);

  // 4. Pre-Purchase Inspection (PPI) HowTo Schema (EV-aware)
  const ppiChecklistSchema = useMemo(() => {
    if (activeTab !== 'checklist' || !isVehicleSelected) return null;
    const isPureEv = isPureElectric(preset);
    return {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `Pre-Purchase Vehicle Inspection Checklist: ${preset.name}`,
      description: `Step-by-step on-site inspection protocol for ${preset.name} (${preset.engineCode}) condition assessment and known vulnerability detection.`,
      step: isPureEv
        ? [
            {
              '@type': 'HowToStep',
              name: 'OBD-II BMS & Isolation Fault Scan',
              text: 'Scan active and pending battery management system (BMS), thermal chiller, and HV isolation fault codes.',
            },
            {
              '@type': 'HowToStep',
              name: 'HV Battery State of Health (SoH %) & Cell Delta-V Load Test',
              text: 'Verify BMS State of Health (SoH %), total DC fast-charge ratio, and cell voltage imbalance (<30 mV under acceleration load).',
            },
            {
              '@type': 'HowToStep',
              name: 'Paint Depth & Structural Chassis Alignment Inspection',
              text: 'Measure coating thickness across outer panels, rockers, and battery pack undercarriage shield for impact damage.',
            },
            {
              '@type': 'HowToStep',
              name: 'AC/DC Charging, OBC/ICCU, Heat Pump & Reduction Gear Test',
              text: 'Confirm Level 2 AC and CCS/NACS DC fast-charging handshakes, heat pump thermal output, and quiet reduction gear regen.',
            },
          ]
        : [
            {
              '@type': 'HowToStep',
              name: 'OBD-II DTC & Freeze Frame Diagnostic Scan',
              text: 'Scan active and pending trouble codes and verify distance traveled since DTCs were cleared.',
            },
            {
              '@type': 'HowToStep',
              name: 'Engine Bay & Vulnerability Inspection',
              text: 'Check timing belt/chain wear, high-pressure fuel pump condition, cold-start acoustics, and fluid leaks.',
            },
            {
              '@type': 'HowToStep',
              name: 'Paint Depth & Structural Alignment Inspection',
              text: 'Measure coating thickness across outer panels and pillars to detect hidden collision repairs.',
            },
            {
              '@type': 'HowToStep',
              name: 'Transmission & Clutch Load Dynamic Road Test',
              text: 'Evaluate clutch slip, dual-mass flywheel shudder, and mechatronic shift quality under acceleration.',
            },
          ],
    };
  }, [activeTab, isVehicleSelected, preset]);

  // 5. Head-to-Head Vehicle Comparison ItemList Schema
  const compareItemListSchema = useMemo(() => {
    if (activeTab !== 'compare' || !secondaryPreset || !secondaryTelemetry) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${preset.name} vs ${secondaryPreset.name} 5-Year Ownership Comparison`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@type': 'Vehicle',
            name: preset.name,
            fuelType: preset.fuelType,
            description: `5-Year TCO: $${telemetry.total5YrTcoUsd.toLocaleString()} ($${telemetry.monthlyTcoUsd}/mo) · Reliability Score: ${telemetry.reliabilityScore}/100`,
          },
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: {
            '@type': 'Vehicle',
            name: secondaryPreset.name,
            fuelType: secondaryPreset.fuelType,
            description: `5-Year TCO: $${secondaryTelemetry.total5YrTcoUsd.toLocaleString()} ($${secondaryTelemetry.monthlyTcoUsd}/mo) · Reliability Score: ${secondaryTelemetry.reliabilityScore}/100`,
          },
        },
      ],
    };
  }, [activeTab, preset, telemetry, secondaryPreset, secondaryTelemetry]);

  // 6. Editorial Guide Article Schema
  const guideArticleSchema = useMemo(() => {
    if ((activeTab !== 'guides' && activeTab !== 'blog') || !activeGuideSlug) return null;
    const guide = GUIDES_DATA.find((g) => g.slug === activeGuideSlug);
    if (!guide) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: guide.title,
      description: guide.summary,
      author: {
        '@type': 'Organization',
        name: guide.author,
        url: SITE_ORIGIN,
      },
      publisher: {
        '@type': 'Organization',
        name: 'DriveLedger',
        url: SITE_ORIGIN,
      },
      datePublished: guide.publishedDate,
      dateModified: guide.lastUpdated || guide.publishedDate,
      mainEntityOfPage: `${SITE_ORIGIN}/guides/${guide.slug}`,
    };
  }, [activeTab, activeGuideSlug]);

  // 7. AboutPage Schema
  const aboutPageSchema = useMemo(() => {
    if (activeTab !== 'about') return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About DriveLedger',
      description: 'Independent automotive financial analytics and repair engineering platform.',
      url: `${SITE_ORIGIN}/about`,
      mainEntity: {
        '@type': 'Organization',
        name: 'DriveLedger',
        url: SITE_ORIGIN,
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'contact@mydriveledger.com',
          contactType: 'Customer Support',
        },
      },
    };
  }, [activeTab]);

  // 8. ContactPage Schema
  const contactPageSchema = useMemo(() => {
    if (activeTab !== 'contact') return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact DriveLedger',
      url: `${SITE_ORIGIN}/contact`,
      mainEntity: {
        '@type': 'Organization',
        name: 'DriveLedger',
        url: SITE_ORIGIN,
        contactPoint: [
          {
            '@type': 'ContactPoint',
            email: 'contact@mydriveledger.com',
            contactType: 'Technical Support',
          },
          {
            '@type': 'ContactPoint',
            email: 'legal@mydriveledger.com',
            contactType: 'Data Protection Officer',
          },
        ],
      },
    };
  }, [activeTab]);

  // 8b. Vehicles Directory & Brand Hub CollectionPage Schema
  const vehiclesDirectorySchema = useMemo(() => {
    if (activeTab !== 'vehicles') return null;
    if (activeBrand && activeBrandTelemetry) {
      return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${activeBrand.name} Maintenance Cost, 5-Year TCO & Reliability Profiles`,
        description: `Benchmarked ownership cost and powertrain reliability catalog for ${activeBrand.modelCount} ${activeBrand.name} models (average 5-year TCO: $${activeBrandTelemetry.avg5YrTcoUsd.toLocaleString()}).`,
        url: `${SITE_ORIGIN}/vehicles/${activeBrand.slug}`,
        numberOfItems: activeBrand.modelCount,
        about: {
          '@type': 'Brand',
          name: activeBrand.name,
        },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: activeBrand.modelCount,
          itemListElement: activeBrandTelemetry.modelSummaries.map((item, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `${SITE_ORIGIN}/tco/${item.preset.id}`,
            name: item.preset.name,
          })),
        },
      };
    }
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'DriveLedger Complete Brand & Model Telemetry Directory',
      description: `Complete catalog of ${VEHICLE_PRESETS.length} benchmarked vehicle configurations across ${BRAND_DIRECTORY.length} global automotive manufacturers.`,
      url: `${SITE_ORIGIN}/vehicles`,
      numberOfItems: VEHICLE_PRESETS.length,
    };
  }, [activeTab, activeBrand, activeBrandTelemetry]);

  // 8c. SoftwareApplication Schema for primary interactive calculator & platform tabs
  const softwareApplicationSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'DriveLedger Automotive Ownership Cost & Diagnostic Platform',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      url: SITE_ORIGIN,
      description:
        'Independent automotive True Cost to Own (TCO) calculator, powertrain maintenance risk matrix, and SAE J1979 OBD-II workshop repair estimator covering 179+ vehicle models.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      publisher: {
        '@id': `${SITE_ORIGIN}/#organization`,
      },
    }),
    []
  );

  // 9. Legal Policy WebPage Schema
  const legalPageSchema = useMemo(() => {
    if (!resolvedLegalKey || !LEGAL_POLICIES[resolvedLegalKey]) return null;
    const policy = LEGAL_POLICIES[resolvedLegalKey];
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: seoMetadata.title,
      description: seoMetadata.description,
      url: seoMetadata.canonicalUrl,
      inLanguage: 'en-US',
      isPartOf: {
        '@type': 'WebSite',
        name: MONETIZATION_CONFIG.brandName,
        url: SITE_ORIGIN,
      },
      publisher: {
        '@type': 'Organization',
        name: MONETIZATION_CONFIG.brandName,
        url: SITE_ORIGIN,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Legal & Privacy Desk',
          email: MONETIZATION_CONFIG.legalEmail,
        },
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: SITE_ORIGIN,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: policy.shortLabel || policy.title,
            item: seoMetadata.canonicalUrl,
          },
        ],
      },
    };
  }, [resolvedLegalKey, seoMetadata]);

  const showVehicleTelemetrySchema =
    !isNotFound &&
    !resolvedLegalKey &&
    isVehicleSelected &&
    ['tco', 'risk', 'obd', 'compare', 'checklist'].includes(activeTab);

  const showObdHowToSchema =
    !isNotFound &&
    !resolvedLegalKey &&
    activeTab === 'obd' &&
    (hasSelectedObdCode || isVehicleSelected);

  const showFaqSchema =
    !isNotFound &&
    !resolvedLegalKey &&
    ['overview', 'tco', 'risk', 'obd', 'compare', 'checklist', 'guides', 'blog', 'methodology'].includes(activeTab);

  const showSoftwareAppSchema =
    !isNotFound &&
    !resolvedLegalKey &&
    ['overview', 'tco', 'risk', 'obd', 'compare', 'checklist', 'methodology'].includes(activeTab);

  return (
    <>
      <script
        id="schema-organization-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationAndWebsiteSchema) }}
      />
      {showSoftwareAppSchema && (
        <script
          id="schema-software-application"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
        />
      )}
      {legalPageSchema && (
        <script
          id="schema-legal-page"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(legalPageSchema) }}
        />
      )}
      {showVehicleTelemetrySchema && (
        <script
          id="schema-vehicle-telemetry"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleSchema) }}
        />
      )}
      {showObdHowToSchema && (
        <script
          id="schema-obd-howto"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obdDiagnosticSchema) }}
        />
      )}
      {showFaqSchema && (
        <script
          id="schema-dynamic-faq"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {!isNotFound && !resolvedLegalKey && ppiChecklistSchema && (
        <script
          id="schema-ppi-checklist"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ppiChecklistSchema) }}
        />
      )}
      {!isNotFound && !resolvedLegalKey && compareItemListSchema && (
        <script
          id="schema-compare-itemlist"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(compareItemListSchema) }}
        />
      )}
      {!isNotFound && !resolvedLegalKey && guideArticleSchema && (
        <script
          id="schema-guide-article"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(guideArticleSchema) }}
        />
      )}
      {!isNotFound && !resolvedLegalKey && aboutPageSchema && (
        <script
          id="schema-about-page"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
        />
      )}
      {!isNotFound && !resolvedLegalKey && contactPageSchema && (
        <script
          id="schema-contact-page"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
        />
      )}
      {!isNotFound && !resolvedLegalKey && vehiclesDirectorySchema && (
        <script
          id="schema-vehicles-directory"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(vehiclesDirectorySchema) }}
        />
      )}
    </>
  );
}

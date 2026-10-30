import React, { useEffect, useMemo } from 'react';
import { VEHICLE_PRESETS, getPresetById } from '../../data/vehiclePresets';
import { OBD_CODES } from '../../data/obdCodes';
import { MAINTENANCE_COMPONENTS, evaluateComponentHealth } from '../../data/maintenanceData';
import { calculateTcoProjection } from '../calculators/TcoCalculator';
import { FAQ_ITEMS } from './TechnicalMethodologyGuide';

const SITE_ORIGIN = 'https://shiftmetric.com';

const CANONICAL_TAB_PATHS = {
  overview: '/',
  tco: '/tco',
  risk: '/risk-matrix',
  obd: '/obd-estimator',
  methodology: '/methodology',
  reviews: '/reviews',
  blog: '/blog',
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
  const relevantComponents = MAINTENANCE_COMPONENTS.filter((comp) =>
    comp.applicablePowertrains.includes(safePreset.powertrain || 'diesel')
  );

  const evaluated = relevantComponents.map((comp) =>
    evaluateComponentHealth({
      component: comp,
      physicalOdometerMiles,
      urbanTripSharePct: 45,
      oilIntervalId: 'standard',
      serviceHistoryId: 'verified',
      transmissionId: safePreset.transmission || 'dct-dsg',
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
}

export default function DynamicSeoHead({
  activeTab = 'overview',
  selectedPresetId,
  selectedObdCode = 'P2002',
}) {
  const preset = useMemo(
    () => getPresetById(selectedPresetId) || VEHICLE_PRESETS[0],
    [selectedPresetId]
  );

  const obdDossier = useMemo(() => {
    const normalized = String(selectedObdCode || 'P2002').toUpperCase();
    return OBD_CODES.find((item) => item.code === normalized) || OBD_CODES[0];
  }, [selectedObdCode]);

  const telemetry = useMemo(() => computePresetSeoTelemetry(preset), [preset]);

  const seoMetadata = useMemo(() => {
    const codeLower = obdDossier.code.toLowerCase();
    const minParts = obdDossier.partsCostRangeUsd?.[0] ?? 95;
    const maxParts = obdDossier.partsCostRangeUsd?.[1] ?? 1650;
    const minLabor = obdDossier.laborHoursRange?.[0] ?? 1.0;
    const maxLabor = obdDossier.laborHoursRange?.[1] ?? 4.0;

    if (activeTab === 'obd') {
      const canonicalPath = `/obd/${preset.id}/${codeLower}`;
      const title = `${preset.name} ${obdDossier.code} ${obdDossier.title}: Repair Cost & Live PID Guide | ShiftMetric`;
      const description = `Diagnose ${obdDossier.code} (${obdDossier.title}) on the ${preset.name} (${preset.engineCode}). Compare Dealership vs Independent vs DIY repair costs ($${minParts}–$${maxParts} parts, ${minLabor}–${maxLabor}h labor) and run First-Principles OBD-II Live PID telemetry checks.`;
      return {
        title,
        description,
        canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
        canonicalPath,
      };
    }

    if (activeTab === 'tco') {
      const canonicalPath = `/tco?preset=${preset.id}`;
      const title = `${preset.name} 5-Year True Cost to Own & Depreciation | ShiftMetric`;
      const description = `${preset.name} (${preset.engineCode}) 5-year True Cost to Own is projected at $${telemetry.total5YrTcoUsd.toLocaleString()} ($${telemetry.monthlyTcoUsd}/mo or $${telemetry.costPerMileUsd}/mi), including $${telemetry.depreciation5YrUsd.toLocaleString()} non-linear depreciation and maintenance reserves.`;
      return {
        title,
        description,
        canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
        canonicalPath,
      };
    }

    if (activeTab === 'risk') {
      const canonicalPath = `/risk-matrix?preset=${preset.id}`;
      const title = `${preset.name} Reliability Score & Maintenance Risk Matrix | ShiftMetric`;
      const description = `${preset.name} achieves a ${telemetry.reliabilityScore}/100 Engineering Reliability Score at ${telemetry.odometerMiles.toLocaleString()} miles. Inspect critical wear horizons, thermodynamic urban duty penalties, and known defects (${preset.criticalDefectTag || 'Powertrain Telemetry'}).`;
      return {
        title,
        description,
        canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
        canonicalPath,
      };
    }

    const baseTabPath = CANONICAL_TAB_PATHS[activeTab] || '/';
    const title = `${preset.name} TCO, Reliability Score (${telemetry.reliabilityScore}/100) & ${obdDossier.code} Diagnostics | ShiftMetric`;
    const description = `Independent automotive engineering platform: ${preset.name} 5-year TCO ($${telemetry.total5YrTcoUsd.toLocaleString()}), powertrain reliability score (${telemetry.reliabilityScore}/100), and ${obdDossier.code} live PID diagnostic protocols.`;
    return {
      title,
      description,
      canonicalUrl: `${SITE_ORIGIN}${baseTabPath}`,
      canonicalPath: baseTabPath,
    };
  }, [activeTab, preset, obdDossier, telemetry]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = seoMetadata.title;
      upsertMetaTag('name', 'description', seoMetadata.description);
      upsertMetaTag('property', 'og:title', seoMetadata.title);
      upsertMetaTag('property', 'og:description', seoMetadata.description);
      upsertMetaTag('property', 'og:url', seoMetadata.canonicalUrl);
      upsertMetaTag('name', 'twitter:card', 'summary_large_image');
      upsertMetaTag('name', 'twitter:title', seoMetadata.title);
      upsertMetaTag('name', 'twitter:description', seoMetadata.description);
      upsertCanonicalLink(seoMetadata.canonicalUrl);
    }
  }, [seoMetadata]);

  // 1. Vehicle / TCO / Reliability Quantitative Schema
  const vehicleSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Vehicle',
      name: preset.name,
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
        target: `${SITE_ORIGIN}/tco?preset=${preset.id}`,
        result: {
          '@type': 'QuantitativeValue',
          name: '5-Year Net Economic Ownership Cost',
          value: telemetry.total5YrTcoUsd,
          unitText: 'USD',
        },
      },
    }),
    [preset, telemetry]
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
            minValue: obdDossier.partsCostRangeUsd?.[0] ?? 95,
            maxValue: obdDossier.partsCostRangeUsd?.[1] ?? 1650,
          },
          step: [...pidSteps, protocolStep],
        },
      ],
    };
  }, [preset, obdDossier, seoMetadata.description]);

  // 3. FAQPage Schema combining dynamic vehicle/OBD Q&As with core methodology FAQs
  const faqSchema = useMemo(() => {
    const dynamicFaqs = [
      {
        question: `What is the 5-year True Cost to Own (TCO) and Reliability Score for the ${preset.name}?`,
        answer: `Based on ShiftMetric telemetry modeling, the ${preset.name} (${preset.engineCode}) carries an estimated 5-year True Cost to Own of $${telemetry.total5YrTcoUsd.toLocaleString()} ($${telemetry.monthlyTcoUsd}/month or $${telemetry.costPerMileUsd}/mile) and an Engineering Reliability Score of ${telemetry.reliabilityScore}/100 at ${telemetry.odometerMiles.toLocaleString()} miles.`,
      },
      {
        question: `How much does it cost to fix OBD-II code ${obdDossier.code} (${obdDossier.title}) on a ${preset.name}?`,
        answer: `For code ${obdDossier.code} on the ${preset.name}, component parts typically range from $${obdDossier.partsCostRangeUsd?.[0] ?? 95} to $${obdDossier.partsCostRangeUsd?.[1] ?? 1650} with ${obdDossier.laborHoursRange?.[0] ?? 1.0} to ${obdDossier.laborHoursRange?.[1] ?? 4.0} hours of workshop labor. ${obdDossier.liveTelemetryCheck?.costTrapWarning || ''}`,
      },
      ...FAQ_ITEMS.slice(0, 3),
    ];

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
  }, [preset, obdDossier, telemetry]);

  return (
    <>
      <script
        id="schema-vehicle-telemetry"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleSchema) }}
      />
      <script
        id="schema-obd-howto"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(obdDiagnosticSchema) }}
      />
      <script
        id="schema-dynamic-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

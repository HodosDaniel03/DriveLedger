/**
 * ShiftMetric — Programmatic Vehicle × OBD-II, Head-to-Head Matchup & Mileage-Bracket SEO Engine
 * Connects all 179 vehicle powertrains with powertrain-validated OBD-II fault dossiers,
 * segment-matched /compare/:carA-vs-:carB matchups, and /risk-matrix/:presetId/:mileageSlug buyer guides.
 */

import { VEHICLE_PRESETS } from './vehiclePresets.js';
import { OBD_CODES, calculateObdWorkshopEstimate } from './obdCodes.js';

const PRESET_ID_SET = new Set(VEHICLE_PRESETS.map((p) => p.id));

const DIESEL_ONLY_CODES = new Set(['P2002', 'P2463', 'P20EE']);
const EVAP_PETROL_ONLY_CODES = new Set(['P0455', 'P0442', 'P0420']);
const TURBO_ONLY_CODES = new Set(['P0299']);
const HV_BATTERY_CODES = new Set(['P0A80']);
const PURE_EV_COMPATIBLE_CODES = new Set(['U0100', 'P0A80', 'P0128']);

export const MILEAGE_BRACKET_SLUGS = {
  '60k-miles': {
    slug: '60k-miles',
    miles: 60000,
    kmApprox: 96500,
    label: '60,000 Miles',
  },
  '100k-miles': {
    slug: '100k-miles',
    miles: 100000,
    kmApprox: 160000,
    label: '100,000 Miles',
  },
  '150k-miles': {
    slug: '150k-miles',
    miles: 150000,
    kmApprox: 240000,
    label: '150,000 Miles',
  },
};

/**
 * Engineering powertrain filter: prevents nonsensical SEO pages
 * (e.g., never pairs a Diesel Particulate Filter P2002 or EVAP P0455 code with a pure EV).
 */
export function isObdCompatibleWithVehicle(preset, obdOrCode) {
  if (!preset || !obdOrCode) return false;
  const code = String(typeof obdOrCode === 'string' ? obdOrCode : obdOrCode.code || '').toUpperCase();
  if (!code) return false;

  const pType = String(preset.powertrain || '').toLowerCase();
  const fuel = String(preset.fuelType || '').toLowerCase();
  const isEv = Boolean(preset.isEv || pType === 'ev' || fuel === 'electric');

  if (isEv) {
    return PURE_EV_COMPATIBLE_CODES.has(code);
  }

  const isDiesel = pType === 'diesel' || (fuel.includes('diesel') && !fuel.includes('hybrid'));
  if (isDiesel) {
    if (EVAP_PETROL_ONLY_CODES.has(code)) return false;
    if (HV_BATTERY_CODES.has(code)) return false;
    return true;
  }

  const isHybrid = pType === 'hybrid' || fuel.includes('hybrid') || fuel.includes('phev');
  if (isHybrid) {
    if (!fuel.includes('diesel') && DIESEL_ONLY_CODES.has(code)) return false;
    return true;
  }

  const isGasNa = pType === 'gasoline-na';
  if (isGasNa) {
    if (DIESEL_ONLY_CODES.has(code)) return false;
    if (TURBO_ONLY_CODES.has(code)) return false;
    if (HV_BATTERY_CODES.has(code)) return false;
    return true;
  }

  // Default gasoline-turbo / mild-hybrid petrol
  if (DIESEL_ONLY_CODES.has(code)) return false;
  if (HV_BATTERY_CODES.has(code)) return false;
  return true;
}

const MATRIX_PAIRS = [
  {
    presetId: 'ford-focus-ecoblue',
    code: 'P2002',
    anchorText: 'Ford 2.0 EcoBlue P2002 DPF Efficiency Fix',
  },
  {
    presetId: 'vw-golf-20-tdi',
    code: 'P0299',
    anchorText: 'VW Golf 2.0 TDI P0299 Turbo Underboost Guide',
  },
  {
    presetId: 'bmw-320d-n47',
    code: 'P0016',
    anchorText: 'BMW 320d N47 P0016 Timing Chain Correlation',
  },
  {
    presetId: 'audi-a4-20-tfsi',
    code: 'P0171',
    anchorText: 'Audi A4 2.0 TFSI P0171 Lean PCV Fault Cost',
  },
  {
    presetId: 'toyota-rav4-25-hybrid',
    code: 'P0420',
    anchorText: 'Toyota RAV4 Hybrid P0420 Catalyst Diagnosis',
  },
  {
    presetId: 'peugeot-208-12-puretech',
    code: 'P0016',
    anchorText: 'Peugeot 1.2 PureTech P0016 Wet Belt Warning',
  },
  {
    presetId: 'ford-focus-ecoblue',
    code: 'P2463',
    anchorText: 'Ford Focus 2.0 EcoBlue P2463 DPF Soot Lockout',
  },
  {
    presetId: 'vw-golf-15-tsi',
    code: 'P0700',
    anchorText: 'VW Golf 1.5 TSI DQ200 P0700 Mechatronic Cost',
  },
  {
    presetId: 'bmw-320d-b47',
    code: 'P0401',
    anchorText: 'BMW 320d B47 P0401 EGR Cooler Recall Check',
  },
  {
    presetId: 'ford-f150-ecoboost',
    code: 'P0016',
    anchorText: 'Ford F-150 3.5 EcoBoost P0016 Cam Phaser Fix',
  },
  {
    presetId: 'mercedes-c220d-om654',
    code: 'P20EE',
    anchorText: 'Mercedes C220d OM654 P20EE AdBlue SCR Fault',
  },
  {
    presetId: 'toyota-camry-hybrid',
    code: 'P0A80',
    anchorText: 'Toyota Camry Hybrid P0A80 HV Battery Telemetry',
  },
  {
    presetId: 'peugeot-308-15-bluehdi',
    code: 'P0016',
    anchorText: 'Peugeot 308/3008 1.5 BlueHDi P0016 8mm Chain',
  },
  {
    presetId: 'porsche-macan-20t',
    code: 'P0700',
    anchorText: 'Porsche Macan PDK P0700 Transmission Dossier',
  },
];

export const PROGRAMMATIC_OBD_MATRIX = MATRIX_PAIRS.map((pair) => {
  const preset = VEHICLE_PRESETS.find((p) => p.id === pair.presetId) || VEHICLE_PRESETS[0];
  const dossier = OBD_CODES.find((c) => c.code === pair.code) || OBD_CODES[0];
  const est = calculateObdWorkshopEstimate(dossier, 'independent');

  return {
    id: `${preset.id}-${dossier.code.toLowerCase()}`,
    presetId: preset.id,
    vehicleName: preset.shortName || preset.name,
    fullVehicleName: preset.name,
    engineCode: preset.engineCode,
    code: dossier.code,
    codeTitle: dossier.title,
    path: `/obd/${preset.id}/${dossier.code.toLowerCase()}`,
    queryUrl: `/obd-estimator?tab=obd&preset=${preset.id}&code=${dossier.code}`,
    anchorText: pair.anchorText,
    estimatedCostRange: [est.minTotalUsd, est.maxTotalUsd],
  };
});

/**
 * Generates the complete powertrain-validated Vehicle × OBD-II diagnostic matrix (~2,779 routes).
 */
export function generateFullVehicleObdMatrix() {
  const entries = [];
  for (const preset of VEHICLE_PRESETS) {
    for (const obd of OBD_CODES) {
      if (!isObdCompatibleWithVehicle(preset, obd)) continue;
      const isKnown = Boolean(preset.commonObdCodes?.includes(obd.code));
      entries.push({
        id: `${preset.id}-${obd.code.toLowerCase()}`,
        presetId: preset.id,
        code: obd.code,
        isKnownWeakPoint: isKnown,
        path: `/obd/${preset.id}/${obd.code.toLowerCase()}`,
      });
    }
  }
  return entries;
}

/**
 * Generates segment- and price-matched Head-to-Head Comparison routes (/compare/:idA-vs-:idB).
 */
export function generateProgrammaticComparePairs(maxPairs = 800) {
  const pairs = [];
  const seenKeys = new Set();

  function addPair(idA, idB) {
    if (!idA || !idB || idA === idB) return false;
    if (!PRESET_ID_SET.has(idA) || !PRESET_ID_SET.has(idB)) return false;
    const canonicalPairKey = `${idA}::${idB}`;
    const reversePairKey = `${idB}::${idA}`;
    if (seenKeys.has(canonicalPairKey) || seenKeys.has(reversePairKey)) return false;
    seenKeys.add(canonicalPairKey);
    const carA = VEHICLE_PRESETS.find((p) => p.id === idA);
    const carB = VEHICLE_PRESETS.find((p) => p.id === idB);
    pairs.push({
      idA,
      idB,
      slug: `${idA}-vs-${idB}`,
      path: `/compare/${idA}-vs-${idB}`,
      title: `${carA.name} vs ${carB.name}`,
    });
    return true;
  }

  // Always seed flagship high-search-volume cross-powertrain rivalries first
  const flagshipRivalries = [
    ['bmw-330i-g20', 'tesla-model-3-lr'],
    ['ford-focus-ecoblue', 'toyota-camry-hybrid'],
    ['vw-golf-20-tdi', 'bmw-320d-b47'],
    ['toyota-corolla-18-hybrid', 'kia-ev6-long-range'],
    ['toyota-rav4-25-hybrid', 'honda-crv-15t'],
    ['audi-a4-20-tfsi', 'bmw-330i-g20'],
    ['mercedes-c220d-om654', 'bmw-320d-b47'],
    ['vw-golf-15-tsi', 'toyota-corolla-18-hybrid'],
  ];
  for (const [a, b] of flagshipRivalries) {
    addPair(a, b);
  }

  // For each vehicle preset, match top 5 closest segment & price rivals
  for (const carA of VEHICLE_PRESETS) {
    if (pairs.length >= maxPairs) break;
    const candidates = VEHICLE_PRESETS.filter((carB) => carB.id !== carA.id)
      .map((carB) => {
        const sameBody = carB.bodyType && carA.bodyType && carB.bodyType === carA.bodyType ? 0 : 8000;
        const diffBrandBonus = carB.brand !== carA.brand ? 0 : 4500;
        const priceDiff = Math.abs((carB.purchasePriceUsd || 28000) - (carA.purchasePriceUsd || 28000));
        return {
          id: carB.id,
          distanceScore: sameBody + diffBrandBonus + priceDiff,
        };
      })
      .sort((x, y) => x.distanceScore - y.distanceScore);

    let addedForCar = 0;
    for (const cand of candidates) {
      if (pairs.length >= maxPairs || addedForCar >= 5) break;
      if (addPair(carA.id, cand.id)) {
        addedForCar += 1;
      }
    }
  }

  return pairs;
}

export const PROGRAMMATIC_COMPARE_PAIRS = generateProgrammaticComparePairs(800);

/**
 * Parses clean Head-to-Head comparison URLs: /compare/:idA-vs-:idB
 */
export function parseCompareMatchupPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return null;
  const match = pathname.match(/^\/compare\/([^/]+)$/i);
  if (!match) return null;
  const slug = decodeURIComponent(match[1]).toLowerCase();
  const separator = '-vs-';
  let idx = slug.indexOf(separator);
  while (idx !== -1) {
    const candidateA = slug.slice(0, idx);
    const candidateB = slug.slice(idx + separator.length);
    if (PRESET_ID_SET.has(candidateA) && PRESET_ID_SET.has(candidateB) && candidateA !== candidateB) {
      return {
        tab: 'compare',
        presetA: candidateA,
        presetB: candidateB,
        slug: `${candidateA}-vs-${candidateB}`,
      };
    }
    idx = slug.indexOf(separator, idx + 1);
  }
  return null;
}

/**
 * Parses clean Mileage-Bracket Risk Matrix URLs: /risk-matrix/:presetId/:mileageSlug
 */
export function parseRiskMileagePath(pathname) {
  if (!pathname || typeof pathname !== 'string') return null;
  const match = pathname.match(/^\/risk-matrix\/([^/]+)\/([^/]+)$/i);
  if (!match) return null;
  const rawPreset = decodeURIComponent(match[1]).toLowerCase();
  const rawBracket = decodeURIComponent(match[2]).toLowerCase();
  if (!PRESET_ID_SET.has(rawPreset)) return null;
  const bracket = MILEAGE_BRACKET_SLUGS[rawBracket];
  if (!bracket) return null;
  return {
    tab: 'risk',
    preset: rawPreset,
    mileageSlug: bracket.slug,
    odometerMiles: bracket.miles,
    bracketLabel: bracket.label,
  };
}

/**
 * Resolves full hybrid vehicle × OBD-II diagnostic context for programmatic landing views.
 */
export function getHybridVehicleObdContext(presetId, code) {
  const normalizedCode = String(code || 'P2002').toUpperCase();
  const preset = VEHICLE_PRESETS.find((p) => p.id === presetId) || VEHICLE_PRESETS[0];
  const dossier = OBD_CODES.find((c) => c.code === normalizedCode) || OBD_CODES[0];
  const isKnownWeakPoint = Boolean(preset.commonObdCodes?.includes(dossier.code));
  const hybridTitle = `${preset.name} ${dossier.code} ${dossier.title}: Repair Cost & Live PID Guide`;
  const est = calculateObdWorkshopEstimate(dossier, 'independent');

  return {
    preset,
    dossier,
    title: hybridTitle,
    hybridTitle,
    isKnownWeakPoint,
    isKnownVulnerability: isKnownWeakPoint,
    isPowertrainCompatible: isObdCompatibleWithVehicle(preset, dossier),
    path: `/obd/${preset.id}/${dossier.code.toLowerCase()}`,
    queryUrl: `/obd-estimator?tab=obd&preset=${preset.id}&code=${dossier.code}`,
    estimatedCostRange: [est.minTotalUsd, est.maxTotalUsd],
  };
}

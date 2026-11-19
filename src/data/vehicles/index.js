/**
 * DriveLedger | Central Vehicle Known Issues (Red Flags & Common Defects) & Modular Catalog Registry
 */

import { VehicleBrandSchema } from './schema.js';
import { fordData } from './ford.js';
import { bmwData } from './bmw.js';
import { vagData } from './vag.js';
import { teslaData } from './tesla.js';
import { hyundaiKiaData } from './hyundaiKia.js';
import { toyotaData } from './toyota.js';
import { stellantisData } from './stellantis.js';
import { mercedesData } from './mercedes.js';
import { VEHICLE_PRESETS } from '../vehiclePresets.js';

export * from './schema.js';
export { fordData } from './ford.js';
export { bmwData } from './bmw.js';
export { vagData } from './vag.js';
export { teslaData } from './tesla.js';
export { hyundaiKiaData } from './hyundaiKia.js';
export { toyotaData } from './toyota.js';
export { stellantisData } from './stellantis.js';
export { mercedesData } from './mercedes.js';

export const MODULAR_BRANDS = [
  fordData,
  bmwData,
  vagData,
  teslaData,
  hyundaiKiaData,
  toyotaData,
  stellantisData,
  mercedesData,
];

// Validate all datasets on load (throws detailed ZodError if schema violated)
export function validateAllVehicles() {
  const validationResults = [];
  for (const brand of MODULAR_BRANDS) {
    const parsed = VehicleBrandSchema.safeParse(brand);
    validationResults.push({
      brandId: brand.id,
      brandName: brand.name,
      success: parsed.success,
      errors: parsed.success ? null : parsed.error.format(),
    });
    if (!parsed.success) {
      console.error(`Validation failed for brand ${brand.name}:`, JSON.stringify(parsed.error.format(), null, 2));
      throw new Error(`Zod validation failed for brand: ${brand.name}`);
    }
  }
  return validationResults;
}

// Auto-run validation
validateAllVehicles();

/**
 * Returns all available brands in the modular catalog
 */
export function getAllBrands() {
  return MODULAR_BRANDS.map((b) => ({
    id: b.id,
    name: b.name,
    country: b.country,
    countryFlag: b.countryFlag,
    group: b.group,
    modelCount: b.models.length,
  }));
}

export const ENGINE_PRESET_ALIASES = {
  // Ford
  'ford-focus-ecoblue': 'ford-focus-mk4-20-ecoblue',
  'ford-focus-10-ecoboost': 'ford-focus-mk4-10-ecoboost',
  'ford-kuga-20-ecoblue': 'ford-focus-mk4-20-ecoblue',
  'ford-kuga-20-ecoblue-norm': 'ford-focus-mk4-20-ecoblue',
  'ford-mondeo-mk5-20-tdci': 'ford-mondeo-mk5-20-ecoblue',
  'ford-fiesta-10-ecoboost': 'ford-focus-mk4-10-ecoboost',
  'ford-puma-10-ecoboost': 'ford-focus-mk4-10-ecoboost',
  'ford-transit-custom-20-ecoblue': 'ford-focus-mk4-20-ecoblue',

  // Volkswagen & VAG
  'vw-golf-20-tdi': 'vw-golf-mk8-20-tdi',
  'vw-golf-15-tsi': 'vw-golf-mk8-15-tsi',
  'vw-golf-gti-ea888': 'vw-golf-mk8-20-tsi',
  'vw-passat-20-tdi': 'vw-passat-b8-20-tdi',
  'vw-passat-b8-15-tsi': 'vw-golf-mk8-15-tsi',
  'vw-passat-b7-20-tdi': 'vw-passat-b8-20-tdi',
  'vw-tiguan-20-tdi': 'vw-golf-mk8-20-tdi',
  'vw-tiguan-15-tsi': 'vw-golf-mk8-15-tsi',
  'vw-golf-tdi-tsi': 'vw-golf-mk8-20-tdi',
  'vw-golf-mk6-20-tdi': 'vw-golf-mk8-20-tdi',
  'vw-t-roc-15-tsi-dsg': 'vw-golf-mk8-15-tsi',
  'vw-arteon-20-tsi-r-line': 'vw-golf-mk8-20-tsi',
  'vw-touran-20-tdi': 'vw-golf-mk8-20-tdi',
  'skoda-octavia-20-tdi': 'vw-golf-mk8-20-tdi',
  'skoda-octavia-15-tsi': 'vw-golf-mk8-15-tsi',
  'skoda-superb-20-tdi': 'vw-passat-b8-20-tdi',
  'skoda-superb-20-tdi-dsg-norm': 'vw-passat-b8-20-tdi',
  'skoda-kodiaq-20-tdi-4x4': 'vw-golf-mk8-20-tdi',
  'skoda-karoq-15-tsi': 'vw-golf-mk8-15-tsi',
  'audi-a4-20-tdi': 'vw-golf-mk8-20-tdi',
  'audi-a4-20-tfsi': 'vw-golf-mk8-20-tsi',
  'audi-a3-20-tdi': 'vw-golf-mk8-20-tdi',
  'audi-a3-15-tfsi': 'vw-golf-mk8-15-tsi',
  'audi-a3-35-tfsi-norm': 'vw-golf-mk8-15-tsi',
  'seat-leon-mk3-20-tdi': 'vw-golf-mk8-20-tdi',
  'seat-ateca-20-tdi': 'vw-golf-mk8-20-tdi',
  'cupra-formentor-vz-20-tsi': 'vw-golf-mk8-20-tsi',

  // BMW
  'bmw-320d-b47': 'bmw-320d-b47-g20',
  'bmw-320d-n47': 'bmw-320d-n47-f30',
  'bmw-330i-g20': 'bmw-330i-b58-g20',
  'bmw-m340i-b58': 'bmw-330i-b58-g20',
  'bmw-520d-g30': 'bmw-520d-b47-g30',
  'bmw-520d-g31-touring-norm': 'bmw-520d-b47-g30',
  'bmw-530d-b57': 'bmw-530d-b57-g30',
  'bmw-120d-f20': 'bmw-320d-n47-f30',
  'bmw-x1-sdrive18d-f48': 'bmw-320d-b47-g20',
  'bmw-x3-xdrive20d-g01': 'bmw-320d-b47-g20',
  'bmw-420d-gran-coupe': 'bmw-320d-b47-g20',

  // Mercedes-Benz
  'mercedes-c220d-om654': 'mercedes-c220d-om654-w205',
  'mercedes-e220d-w213': 'mercedes-e220d-om654-w213',
  'mb-gla200d-om654': 'mercedes-c220d-om654-w205',
  'mb-glc220d-om654': 'mercedes-c220d-om654-w205',

  // Tesla
  'tesla-model-3-lr': 'tesla-model-3-lr-nmc',
  'tesla-model-3-rwd': 'tesla-model-3-rwd-lfp',
  'tesla-model-y-lr': 'tesla-model-y-lr-nmc',

  // Hyundai & Kia
  'hyundai-ioniq-5': 'ioniq-5-long-range-awd',
  'ioniq-5': 'ioniq-5-long-range-awd',
  'kia-ev6': 'kia-ev6-long-range-rwd',
  'kia-ev6-long-range': 'kia-ev6-long-range-rwd',

  // Toyota
  'toyota-corolla-18-hybrid': 'toyota-corolla-18-hybrid',
  'toyota-corolla-20-hybrid': 'toyota-corolla-20-hybrid',
  'toyota-rav4-25-hybrid': 'toyota-rav4-25-hybrid',
  'toyota-auris-18-hybrid-ts': 'toyota-corolla-18-hybrid',
  'toyota-prius-gen3-18-hybrid': 'toyota-corolla-18-hybrid',
  'toyota-c-hr-18-hybrid': 'toyota-corolla-18-hybrid',

  // Stellantis
  'peugeot-208-12-puretech': 'peugeot-208-12-puretech',
  'peugeot-2008-12-puretech': 'peugeot-2008-12-puretech',
  'peugeot-308-15-bluehdi': 'peugeot-208-15-bluehdi',
  'citroen-c3-12-puretech': 'peugeot-208-12-puretech',
  'citroen-c3-12-puretech-norm': 'peugeot-208-12-puretech',
  'citroen-c4-12-puretech': 'peugeot-208-12-puretech',
  'citroen-c4-15-bluehdi': 'peugeot-208-15-bluehdi',
  'opel-corsa-12-turbo': 'peugeot-208-12-puretech',
  'opel-mokka-12-turbo': 'peugeot-208-12-puretech',
};

/**
 * Returns models for a specific brand
 */
export function getModelsForBrand(brandId) {
  if (!brandId) return [];
  const normalizedId = String(brandId).toLowerCase();
  const brand = MODULAR_BRANDS.find(
    (b) =>
      b.id.toLowerCase() === normalizedId ||
      b.name.toLowerCase() === normalizedId ||
      normalizedId.includes(b.id.toLowerCase()) ||
      b.id.toLowerCase().includes(normalizedId)
  );
  return brand ? brand.models : [];
}

/**
 * Returns generations for a specific model
 */
export function getGenerationsForModel(brandId, modelId) {
  const models = getModelsForBrand(brandId);
  if (!models || models.length === 0) return [];
  if (!modelId) return models[0]?.generations || [];

  const rawModelId = String(modelId).toLowerCase();
  // Support compound model names like "Focus / Mondeo"
  const tokens = rawModelId.split(/[\/\s,]+/).map((t) => t.trim()).filter(Boolean);

  const model = models.find((m) => {
    const mId = m.id.toLowerCase();
    const mName = m.name.toLowerCase();
    if (mId === rawModelId || mName === rawModelId) return true;
    return tokens.some((t) => t.length >= 2 && (mId.includes(t) || mName.includes(t)));
  });

  return model ? model.generations : [];
}

/**
 * Returns engines for a specific model generation
 */
export function getEnginesForGeneration(brandId, modelId, generationId) {
  const gens = getGenerationsForModel(brandId, modelId);
  if (!gens || gens.length === 0) return [];
  if (!generationId) return gens[0]?.engines || [];

  const normalizedGenId = String(generationId).toLowerCase();
  const gen = gens.find(
    (g) => g.id.toLowerCase() === normalizedGenId || g.name.toLowerCase() === normalizedGenId
  );
  return gen ? gen.engines : gens[0]?.engines || [];
}

const GENERIC_MODEL_STOPWORDS = new Set([
  'model',
  'series',
  'class',
  'hybrid',
  'plug',
  'phev',
  'mhev',
  'electric',
  'ev',
  'diesel',
  'gasoline',
  'petrol',
  'turbo',
  'long',
  'range',
  'awd',
  'rwd',
  'fwd',
  'norm',
  'touring',
  'wagon',
  'sedan',
  'suv',
  'hatchback',
  'coupe',
]);

function normalizeAlphaNum(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function queryMatchesBrand(normQuery, brandName, brandId = '') {
  const bName = normalizeAlphaNum(brandName);
  const bId = normalizeAlphaNum(brandId);
  const padded = `-${normQuery}-`;
  if (bName && padded.includes(`-${bName}-`)) return true;
  if (bId && padded.includes(`-${bId}-`)) return true;
  if ((bName.includes('volkswagen') || bId.includes('volkswagen')) && (padded.includes('-vw-') || padded.includes('-volkswagen-'))) {
    return true;
  }
  if ((bName.includes('mercedes') || bId.includes('mercedes')) && (padded.includes('-mb-') || padded.includes('-mercedes-'))) {
    return true;
  }
  if ((bName.includes('hyundai') || bId.includes('hyundai')) && (padded.includes('-hyundai-') || padded.includes('-kia-'))) {
    return true;
  }
  if ((bName.includes('stellantis') || bId.includes('stellantis')) && (padded.includes('-peugeot-') || padded.includes('-citroen-') || padded.includes('-opel-'))) {
    return true;
  }
  return false;
}

function queryMatchesModel(normQuery, modelName, modelId = '') {
  const mName = normalizeAlphaNum(modelName);
  const mId = normalizeAlphaNum(modelId);
  const padded = `-${normQuery}-`;

  if (mName && padded.includes(`-${mName}-`)) return true;
  if (mId && padded.includes(`-${mId}-`)) return true;

  // Special series/class designations in modular brands
  if (mName === '3-series' || mId === 'bmw-3-series') {
    return /-(3-series|318d|320i|320d|330i|330d|330e|m340i|m340d|f30|g20)-/.test(padded);
  }
  if (mName === '5-series' || mId === 'bmw-5-series') {
    return /-(5-series|520i|520d|530i|530d|530e|540i|g30|g31|f10)-/.test(padded);
  }
  if (mName === 'c-class' || mId === 'mercedes-c-class') {
    return /-(c-class|c180|c200|c220d|c300|c300de|c43|c63|w205|w206)-/.test(padded);
  }
  if (mName === 'e-class' || mId === 'mercedes-e-class') {
    return /-(e-class|e200|e220d|e300|e300de|e350|e400|w213|w214)-/.test(padded);
  }
  if (mName === 'model-3' || mId === 'tesla-model-3') {
    return padded.includes('-model-3-');
  }
  if (mName === 'model-y' || mId === 'tesla-model-y') {
    return padded.includes('-model-y-');
  }

  // For multi-token model names (e.g. "RAV4", "IONIQ 5", "EV6", "F-150", "CR-V"), require all non-generic tokens
  const rawTokens = mName
    .split('-')
    .filter((t) => t.length > 0 && !GENERIC_MODEL_STOPWORDS.has(t));
  if (rawTokens.length === 0) return false;

  // If the model has a short number/letter suffix (like "model-3", "ioniq-5", "id-4", "cx-5"), require the full sequence
  if (mName.startsWith('model-') || rawTokens.some((t) => t.length <= 2)) {
    return padded.includes(`-${rawTokens.join('-')}-`);
  }

  return rawTokens.every((t) => padded.includes(`-${t}-`));
}

function inferIssueCategoryFromText(text = '', isEv = false) {
  const t = String(text).toLowerCase();
  if (isEv || t.includes('battery') || t.includes('soh') || t.includes('hv') || t.includes('cell')) return 'battery_hv';
  if (t.includes('iccu') || t.includes('inverter') || t.includes('sensor') || t.includes('infotainment') || t.includes('electrical') || t.includes('12v')) return 'electrical';
  if (t.includes('belt') || t.includes('chain') || t.includes('timing') || t.includes('phaser') || t.includes('vanos')) return 'timing';
  if (t.includes('dsg') || t.includes('cvt') || t.includes('transmission') || t.includes('gearbox') || t.includes('clutch') || t.includes('mechatronic') || t.includes('10r80') || t.includes('zf') || t.includes('flywheel') || t.includes('dmf')) return 'transmission';
  if (t.includes('dpf') || t.includes('egr') || t.includes('adblue') || t.includes('scr') || t.includes('catalyst') || t.includes('exhaust') || t.includes('gpf')) return 'exhaust_aftertreatment';
  if (t.includes('cp4') || t.includes('injector') || t.includes('fuel') || t.includes('hpfp') || t.includes('pump')) return 'fuel_system';
  if (t.includes('coolant') || t.includes('thermostat') || t.includes('water pump') || t.includes('radiator') || t.includes('heat pump') || t.includes('octovalve')) return 'cooling';
  if (t.includes('bushing') || t.includes('suspension') || t.includes('control arm') || t.includes('damper') || t.includes('air spring') || t.includes('strut')) return 'suspension';
  if (t.includes('brake') || t.includes('rotor') || t.includes('caliper') || t.includes('abs')) return 'brakes';
  if (t.includes('rust') || t.includes('subframe') || t.includes('paint') || t.includes('chassis') || t.includes('door')) return 'body_chassis';
  return 'engine';
}

function cleanDefectHeadline(tag = '', fallbackName = 'Powertrain Assembly') {
  const cleaned = String(tag || '')
    .replace(/^[^\wA-Za-z0-9]+/, '')
    .trim();
  if (!cleaned) return `${fallbackName} Accelerated Component Wear`;
  // Convert ALL CAPS tag into readable title case while preserving acronyms
  const ACRONYMS = new Set(['CP4', 'DPF', 'EGR', 'SCR', 'DSG', 'DMF', 'CVT', 'ECVT', 'ICCU', 'BMS', 'HV', 'EV', 'PHEV', 'MHEV', 'GDI', 'TDI', 'TSI', 'TFSI', 'PCV', 'VVT', 'VANOS', 'HPFP', 'OBC', 'ZF', 'PDK', 'DCT', 'AWD', '10R80', 'EA888', 'EA288', 'B47', 'N47', 'B48', 'B58', 'OM654', 'LFP', 'NMC']);
  return cleaned
    .split(/\s+/)
    .map((word) => {
      const upper = word.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (ACRONYMS.has(upper) || /\d/.test(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Synthesizes a schema-valid { brand, model, generation, engine } dossier entry
 * from a VEHICLE_PRESETS object so all 179 catalog vehicles have 100% model-specific known issues.
 */
export function synthesizeModularEntryForPreset(preset, donorVariant = null) {
  if (!preset) return null;

  const isEv = Boolean(
    preset.isEv ||
      preset.powertrain === 'ev' ||
      preset.powertrain === 'electric' ||
      String(preset.fuelType || '').toLowerCase() === 'electric'
  );
  const wearFactor = Number(preset.maintenanceWearFactor) || 1.15;
  const baseMaint = Number(preset.baseAnnualMaintenanceUsd) || 800;
  const obdCodes = Array.isArray(preset.commonObdCodes) ? preset.commonObdCodes : ['P0420'];

  const rawRiskNotes = String(preset.knownRiskNotes || '').trim();
  const sentences = rawRiskNotes
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const primaryTitle = cleanDefectHeadline(preset.criticalDefectTag, preset.engineCode || preset.name);
  const primaryCategory = inferIssueCategoryFromText(`${preset.criticalDefectTag || ''} ${sentences[0] || ''}`, isEv);
  const primarySeverity = wearFactor >= 1.3 ? 'critical' : wearFactor >= 1.1 ? 'high' : 'medium';

  const odoBaseKm = Math.max(60000, Math.round(((Number(preset.defaultOdometerMiles) || 55000) * 1.609344) / 5000) * 5000);
  const minKm1 = Math.max(50000, odoBaseKm - 15000);
  const maxKm1 = minKm1 + 60000;

  const partsMin1 = Math.max(250, Math.round(baseMaint * 0.55 * wearFactor / 10) * 10);
  const partsMax1 = Math.max(partsMin1 + 250, Math.round(baseMaint * 1.15 * wearFactor / 10) * 10);
  const laborMin1 = Math.max(150, Math.round(baseMaint * 0.35 * wearFactor / 10) * 10);
  const laborMax1 = Math.max(laborMin1 + 150, Math.round(baseMaint * 0.75 * wearFactor / 10) * 10);
  const totalEurMin1 = partsMin1 + laborMin1;
  const totalEurMax1 = partsMax1 + laborMax1;
  const totalUsdMin1 = Math.round(totalEurMin1 / 0.92 / 10) * 10;
  const totalUsdMax1 = Math.round(totalEurMax1 / 0.92 / 10) * 10;

  const primarySymptoms = sentences[0]
    ? sentences[0].replace(/\n+/g, ' ')
    : `Elevated wear or fault codes (${obdCodes.slice(0, 2).join(', ')}) on ${preset.engineCode || preset.name} past ${minKm1.toLocaleString('en-US')} km.`;

  const primaryPrevention = sentences[1]
    ? sentences[1].replace(/\n+/g, ' ')
    : isEv
      ? 'Perform live BMS cell delta-V telemetry scan, inspect thermal management coolant valve operation, and verify OBC/DC charging current stability.'
      : `Follow strict preventative service intervals on ${preset.engineCode || preset.name}, verify live OBD-II telemetry (${obdCodes.join(', ')}), and inspect OEM service history.`;

  const primaryIssue = {
    id: `${preset.id}-primary-defect`,
    name: `${primaryTitle} (${preset.engineCode || preset.modelName})`,
    severity: primarySeverity,
    category: primaryCategory,
    criticalMileage: {
      minKm: minKm1,
      maxKm: maxKm1,
      display: `${minKm1.toLocaleString('en-US')} - ${maxKm1.toLocaleString('en-US')} km`,
    },
    symptoms: primarySymptoms,
    prevention: primaryPrevention,
    repairCost: {
      parts: { min: partsMin1, max: partsMax1 },
      labor: { min: laborMin1, max: laborMax1 },
      currency: 'EUR',
      formattedUsd: `$${totalUsdMin1.toLocaleString('en-US')} - $${totalUsdMax1.toLocaleString('en-US')}`,
      formattedEur: `€${totalEurMin1.toLocaleString('en-US')} - €${totalEurMax1.toLocaleString('en-US')}`,
      formattedHuf: `${(totalEurMin1 * 400).toLocaleString('en-US')} - ${(totalEurMax1 * 400).toLocaleString('en-US')} Ft`,
    },
    affectedComponents: [
      preset.engineCode || preset.powertrainLabel || 'Primary Powertrain',
      primaryCategory.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    ],
    obdCodes: obdCodes.slice(0, 3),
  };

  // Secondary model-specific driveline/chassis/thermal issue
  const secondaryCategory = isEv
    ? 'cooling'
    : primaryCategory === 'transmission'
      ? 'suspension'
      : 'transmission';
  const minKm2 = minKm1 + 20000;
  const maxKm2 = maxKm1 + 30000;
  const partsMin2 = Math.max(180, Math.round(partsMin1 * 0.65 / 10) * 10);
  const partsMax2 = Math.max(partsMin2 + 180, Math.round(partsMax1 * 0.7 / 10) * 10);
  const laborMin2 = Math.max(120, Math.round(laborMin1 * 0.65 / 10) * 10);
  const laborMax2 = Math.max(laborMin2 + 120, Math.round(laborMax1 * 0.7 / 10) * 10);
  const totalEurMin2 = partsMin2 + laborMin2;
  const totalEurMax2 = partsMax2 + laborMax2;
  const totalUsdMin2 = Math.round(totalEurMin2 / 0.92 / 10) * 10;
  const totalUsdMax2 = Math.round(totalEurMax2 / 0.92 / 10) * 10;

  const secondaryIssue = {
    id: `${preset.id}-driveline-thermal-wear`,
    name: isEv
      ? `${preset.modelName} Heat Pump Chiller Valve, 12V Auxiliary & Suspension Bushing Wear`
      : `${preset.modelName} (${preset.transmission || 'Drivetrain'}) Fluid Shear & Chassis Mount Fatigue`,
    severity: wearFactor >= 1.25 ? 'high' : 'medium',
    category: secondaryCategory,
    criticalMileage: {
      minKm: minKm2,
      maxKm: maxKm2,
      display: `${minKm2.toLocaleString('en-US')} - ${maxKm2.toLocaleString('en-US')} km`,
    },
    symptoms: isEv
      ? `Reduced cabin heating efficiency during DC fast charging, 12V auxiliary battery warning, or front control arm creak over speed bumps.`
      : `Delayed shift engagement or low-speed driveline vibration under load, accompanied by front lower control arm bushing play past ${minKm2.toLocaleString('en-US')} km.`,
    prevention: isEv
      ? `Replace desiccant/coolant at scheduled interval, test 12V auxiliary state of health annually, and inspect lower control arm ball joints.`
      : `Renew transmission fluid and filter every 60,000 - 80,000 km regardless of OEM lifetime claims, and inspect engine/transmission mounts during alignment.`,
    repairCost: {
      parts: { min: partsMin2, max: partsMax2 },
      labor: { min: laborMin2, max: laborMax2 },
      currency: 'EUR',
      formattedUsd: `$${totalUsdMin2.toLocaleString('en-US')} - $${totalUsdMax2.toLocaleString('en-US')}`,
      formattedEur: `€${totalEurMin2.toLocaleString('en-US')} - €${totalEurMax2.toLocaleString('en-US')}`,
      formattedHuf: `${(totalEurMin2 * 400).toLocaleString('en-US')} - ${(totalEurMax2 * 400).toLocaleString('en-US')} Ft`,
    },
    affectedComponents: isEv
      ? ['Thermal Management Chiller Valve', '12V Auxiliary DC-DC Circuit', 'Front Control Arm Bushings']
      : ['Transmission Valve Body & Fluid', 'Drivetrain Mounts', 'Front Control Arm Bushings'],
    obdCodes: obdCodes.slice(-2),
  };

  // If a shared-engine donor variant was provided (same engine family), include its unique engine issues after the preset's primary issue
  const donorEngineIssues = donorVariant?.engine?.knownIssues || [];
  const mergedIssues = [primaryIssue];
  for (const dIssue of donorEngineIssues) {
    if (!mergedIssues.some((m) => m.id === dIssue.id || m.name === dIssue.name)) {
      mergedIssues.push(dIssue);
    }
  }
  if (mergedIssues.length < 2) {
    mergedIssues.push(secondaryIssue);
  }

  let normalizedFuelType = 'Gasoline';
  const rawFuel = String(preset.fuelType || '').toLowerCase();
  if (isEv || rawFuel.includes('electric')) normalizedFuelType = 'Electric';
  else if (rawFuel.includes('plug-in') || rawFuel.includes('phev')) normalizedFuelType = 'Plug-in Hybrid';
  else if (rawFuel.includes('hybrid')) normalizedFuelType = 'Hybrid';
  else if (rawFuel.includes('diesel')) normalizedFuelType = 'Diesel';

  const mpg = Math.max(15, Number(preset.mpgUs) || 32);
  const lPer100 = isEv ? 2.2 : +(235.215 / mpg).toFixed(1);

  const dispMatch = String(preset.engineCode || preset.powertrainLabel || preset.name || '').match(/\b(\d\.\d)\s*L?\b/i);
  const displacementCc = isEv
    ? undefined
    : dispMatch
      ? Math.round(Number(dispMatch[1]) * 1000)
      : donorVariant?.engine?.displacementCc || 1998;

  const yearMatch = String(preset.name || '').match(/\b(20\d{2})\b/);
  const fromYear = yearMatch ? Math.max(2014, Number(yearMatch[1]) - 2) : 2018;

  const synthEngine = {
    id: preset.id,
    name: `${preset.name} (${preset.powerHp || 150} HP)`,
    engineCode: preset.engineCode || donorVariant?.engine?.engineCode || preset.powertrainLabel || 'OEM Powertrain',
    fuelType: normalizedFuelType,
    powerHp: Math.max(50, Number(preset.powerHp) || 150),
    torqueNm: donorVariant?.engine?.torqueNm || Math.round((Number(preset.powerHp) || 150) * 1.7),
    ...(displacementCc ? { displacementCc } : {}),
    years: { from: fromYear, to: 2025 },
    transmission: [preset.transmission || 'Automatic'],
    criticalDefectTag: preset.criticalDefectTag || donorVariant?.engine?.criticalDefectTag || '⚠️ POWERTRAIN WEAR MONITOR',
    knownIssues: mergedIssues,
    epaEfficiency: {
      combinedMpg: mpg,
      cityMpg: Math.max(12, Math.round(mpg * 0.88)),
      highwayMpg: Math.round(mpg * 1.14),
      lPer100Km: lPer100,
      ...(isEv
        ? {
            kwhPer100Km: +((mpg > 60 ? 3370.5 / mpg : mpg) / 1.609344).toFixed(1),
          }
        : {}),
    },
    defaultOdometerMiles: preset.defaultOdometerMiles,
    annualDistanceMiles: preset.annualDistanceMiles,
  };

  const synthGen = {
    id: `${preset.id}-gen`,
    name: `${preset.modelName}`,
    generationCode: preset.modelName,
    years: { from: fromYear, to: 2025 },
    bodyTypes: [preset.bodyType || 'sedan'],
    modelKnownIssues: [],
    engines: [synthEngine],
  };

  const synthModel = {
    id: normalizeAlphaNum(`${preset.brand}-${preset.modelName}`),
    name: preset.modelName,
    brand: preset.brand,
    segment: preset.segment || 'Passenger Vehicle',
    generations: [synthGen],
  };

  const synthBrand = {
    id: normalizeAlphaNum(preset.brand),
    name: preset.brand,
    group: preset.segment || 'Global Automotive',
    country: 'Global',
    countryFlag: '🚗',
    models: [synthModel],
  };

  return {
    brand: synthBrand,
    model: synthModel,
    generation: synthGen,
    engine: synthEngine,
  };
}

function findModularEngineById(exactEngineId) {
  if (!exactEngineId) return null;
  const target = String(exactEngineId).toLowerCase().trim();
  for (const brand of MODULAR_BRANDS) {
    for (const model of brand.models) {
      for (const gen of model.generations) {
        for (const eng of gen.engines) {
          if (eng.id.toLowerCase() === target) {
            return { brand, model, generation: gen, engine: eng };
          }
        }
      }
    }
  }
  return null;
}

/**
 * Finds an engine across all brands, models and generations.
 * Enforces brand + model fidelity so presets never cross-map to a different model,
 * and synthesizes model-faithful dossiers for presets outside MODULAR_BRANDS.
 */
export function findEngineVariant(engineId) {
  if (!engineId) return null;
  const targetId = String(engineId).toLowerCase().trim();
  const normQuery = normalizeAlphaNum(targetId);

  // 1. Exact modular engine ID match (e.g. 'ford-focus-mk4-20-ecoblue')
  const directModular = findModularEngineById(targetId);
  if (directModular) {
    return directModular;
  }

  // 2. Check if query matches a VEHICLE_PRESETS entry by ID or exact name
  const matchedPreset = VEHICLE_PRESETS.find(
    (p) =>
      p.id.toLowerCase() === targetId ||
      p.name.toLowerCase() === targetId ||
      normalizeAlphaNum(p.name) === normQuery
  );

  // 3. Check explicit alias table
  const aliasedEngineId = ENGINE_PRESET_ALIASES[targetId] || (matchedPreset ? ENGINE_PRESET_ALIASES[matchedPreset.id] : null);
  const aliasedModular = aliasedEngineId ? findModularEngineById(aliasedEngineId) : null;

  if (matchedPreset) {
    // If the aliased modular entry belongs to the EXACT SAME brand and model, return it directly
    if (
      aliasedModular &&
      queryMatchesBrand(normalizeAlphaNum(matchedPreset.brand), aliasedModular.brand.name, aliasedModular.brand.id) &&
      queryMatchesModel(normalizeAlphaNum(`${matchedPreset.brand} ${matchedPreset.modelName} ${matchedPreset.id}`), aliasedModular.model.name, aliasedModular.model.id)
    ) {
      return aliasedModular;
    }

    // Check if MODULAR_BRANDS has an entry with the exact same brand, model, fuel category, displacement, and generation
    const classifyFuel = (fuelStr, isEvFlag = false) => {
      const f = String(fuelStr || '').toLowerCase();
      if (isEvFlag || f === 'electric') return 'electric';
      if (f.includes('diesel')) return 'diesel';
      if (f.includes('hybrid') || f.includes('phev')) return 'hybrid';
      return 'gasoline';
    };
    const extractDispLiters = (str) => {
      const m = String(str || '').match(/\b([1-6]\.\d)\s*L?\b/i);
      return m ? Number(m[1]) : null;
    };
    const extractGenTag = (str) => {
      const m = String(str || '').toLowerCase().match(/\b(e39|e46|e90|f10|f20|f30|g20|g30|g31|w204|w205|w206|w212|w213|w214|mk4|mk5|mk6|mk7|mk8|b7|b8)\b/);
      return m ? m[1] : null;
    };

    const presetFuelCat = classifyFuel(matchedPreset.fuelType, matchedPreset.isEv);
    const presetDisp = extractDispLiters(`${matchedPreset.name} ${matchedPreset.engineCode}`);
    const presetGenTag = extractGenTag(`${matchedPreset.id} ${matchedPreset.name}`);

    let bestSameModelModular = null;
    let bestSameModelScore = 0;
    const presetTokens = normalizeAlphaNum(`${matchedPreset.id} ${matchedPreset.name} ${matchedPreset.engineCode} ${matchedPreset.fuelType}`)
      .split('-')
      .filter((t) => t.length > 1);

    for (const brand of MODULAR_BRANDS) {
      if (!queryMatchesBrand(normalizeAlphaNum(matchedPreset.brand), brand.name, brand.id)) continue;
      for (const model of brand.models) {
        if (!queryMatchesModel(normalizeAlphaNum(`${matchedPreset.brand} ${matchedPreset.modelName} ${matchedPreset.id}`), model.name, model.id)) continue;
        for (const gen of model.generations) {
          for (const eng of gen.engines) {
            // Strictly enforce fuel category fidelity (never map Gasoline C300 to Diesel OM654)
            if (classifyFuel(eng.fuelType) !== presetFuelCat) continue;

            // Enforce displacement compatibility when both specify liters (prevent 3.0L->2.0L, 1.9->2.0, 2.0->1.8)
            const engDisp = eng.displacementCc
              ? +(eng.displacementCc / 1000).toFixed(1)
              : extractDispLiters(`${eng.name} ${eng.engineCode}`);
            if (presetDisp && engDisp && Math.abs(presetDisp - engDisp) >= 0.15) continue;

            // Enforce generation compatibility when both specify chassis/gen codes (prevent E46->G20, Mk4->Mk8, W204->W205)
            const engGenTag = extractGenTag(`${gen.id} ${gen.name} ${eng.id} ${eng.name}`);
            if (presetGenTag && engGenTag && presetGenTag !== engGenTag) continue;

            const engText = normalizeAlphaNum(`${gen.name} ${eng.name} ${eng.engineCode} ${eng.fuelType} ${eng.id}`);
            let score = 0;
            for (const tok of presetTokens) {
              if (engText.includes(tok)) score++;
            }
            if (score > bestSameModelScore && score >= 2) {
              bestSameModelScore = score;
              bestSameModelModular = { brand, model, generation: gen, engine: eng };
            }
          }
        }
      }
    }

    if (bestSameModelModular) {
      return bestSameModelModular;
    }

    // Otherwise synthesize a 100% model-accurate dossier for this preset (using aliasedModular only as same-engine issue donor)
    const safeDonor =
      aliasedModular && classifyFuel(aliasedModular.engine?.fuelType) === presetFuelCat
        ? aliasedModular
        : null;
    return synthesizeModularEntryForPreset(matchedPreset, safeDonor);
  }

  // If no preset matched by exact ID/name, but an explicit alias matched (e.g. 'ioniq-5', 'kia-ev6')
  if (aliasedModular) {
    return aliasedModular;
  }

  // 4. Strict Brand + Model fuzzy matching against MODULAR_BRANDS
  const tokens = normQuery.split('-').filter((t) => t.length >= 2);
  let bestMatch = null;
  let maxScore = 0;

  for (const brand of MODULAR_BRANDS) {
    if (!queryMatchesBrand(normQuery, brand.name, brand.id)) continue;
    for (const model of brand.models) {
      if (!queryMatchesModel(normQuery, model.name, model.id)) continue;
      for (const gen of model.generations) {
        for (const eng of gen.engines) {
          let score = 0;
          const engText = normalizeAlphaNum(
            `${brand.name} ${model.name} ${gen.name} ${eng.name} ${eng.engineCode} ${eng.fuelType} ${eng.id}`
          );
          for (const token of tokens) {
            if (engText.includes(token)) score++;
          }
          if (score > maxScore && score >= 2) {
            maxScore = score;
            bestMatch = { brand, model, generation: gen, engine: eng };
          }
        }
      }
    }
  }

  if (bestMatch) {
    return bestMatch;
  }

  // 5. Strict Brand + Model fuzzy matching against VEHICLE_PRESETS
  let bestPreset = null;
  let bestPresetScore = 0;
  for (const preset of VEHICLE_PRESETS) {
    if (!queryMatchesBrand(normQuery, preset.brand)) continue;
    if (!queryMatchesModel(normQuery, preset.modelName)) continue;
    const presetText = normalizeAlphaNum(
      `${preset.brand} ${preset.modelName} ${preset.name} ${preset.engineCode} ${preset.fuelType} ${preset.id}`
    );
    let score = 0;
    for (const token of tokens) {
      if (presetText.includes(token)) score++;
    }
    if (score > bestPresetScore && score >= 2) {
      bestPresetScore = score;
      bestPreset = preset;
    }
  }

  if (bestPreset) {
    const donorId = ENGINE_PRESET_ALIASES[bestPreset.id];
    const donor = donorId ? findModularEngineById(donorId) : null;
    return synthesizeModularEntryForPreset(bestPreset, donor);
  }

  return null;
}

/**
 * Returns known issues (red flags & common defects) for a specific engine and model generation
 */
export function getKnownIssuesForEngine(engineId) {
  const resolved = findEngineVariant(engineId);
  if (!resolved) return [];

  const genIssues = resolved.generation.modelKnownIssues || [];
  const engIssues = resolved.engine.knownIssues || [];

  return [...engIssues, ...genIssues];
}

/**
 * Returns known issues by hierarchical selector keys
 */
export function getKnownIssuesForVehicle({ brandId, modelId, generationId, engineId }) {
  if (engineId) {
    const issues = getKnownIssuesForEngine(engineId);
    if (issues.length > 0) return issues;
  }

  // Try strict brand+model resolution first (supports both MODULAR_BRANDS and synthesized VEHICLE_PRESETS)
  if (brandId && modelId) {
    const query = [brandId, modelId, generationId].filter(Boolean).join(' ');
    const resolved = findEngineVariant(query);
    if (resolved) {
      const genIssues = resolved.generation?.modelKnownIssues || [];
      const engIssues = resolved.engine?.knownIssues || [];
      if (engIssues.length + genIssues.length > 0) {
        return [...engIssues, ...genIssues];
      }
    }
  }

  const gens = getGenerationsForModel(brandId, modelId);
  const gen = generationId
    ? gens.find((g) => g.id.toLowerCase() === String(generationId).toLowerCase())
    : gens[0];

  if (!gen) return [];

  const genIssues = gen.modelKnownIssues || [];
  const eng = engineId
    ? gen.engines.find((e) => e.id.toLowerCase() === String(engineId).toLowerCase())
    : gen.engines[0];

  const engIssues = eng ? eng.knownIssues || [] : [];
  return [...engIssues, ...genIssues];
}

/**
 * Free text search across all brands, models, engines and known issues
 */
export function searchKnownIssues(query) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) return [];
  const q = query.trim().toLowerCase();

  const results = [];
  for (const brand of MODULAR_BRANDS) {
    for (const model of brand.models) {
      for (const gen of model.generations) {
        // Check model level issues
        for (const issue of gen.modelKnownIssues || []) {
          if (
            issue.name.toLowerCase().includes(q) ||
            issue.symptoms.toLowerCase().includes(q) ||
            issue.prevention.toLowerCase().includes(q) ||
            issue.category.toLowerCase().includes(q) ||
            (issue.affectedComponents || []).some((c) => c.toLowerCase().includes(q)) ||
            (issue.obdCodes || []).some((code) => code.toLowerCase().includes(q))
          ) {
            results.push({
              brand: brand.name,
              model: model.name,
              generation: gen.name,
              engine: 'General Chassis / Chassis & Electronics',
              issue,
            });
          }
        }

        // Check engine level issues
        for (const eng of gen.engines) {
          const matchVehicle =
            brand.name.toLowerCase().includes(q) ||
            model.name.toLowerCase().includes(q) ||
            gen.name.toLowerCase().includes(q) ||
            eng.name.toLowerCase().includes(q) ||
            eng.engineCode.toLowerCase().includes(q);

          for (const issue of eng.knownIssues || []) {
            const matchIssue =
              issue.name.toLowerCase().includes(q) ||
              issue.symptoms.toLowerCase().includes(q) ||
              issue.prevention.toLowerCase().includes(q) ||
              issue.category.toLowerCase().includes(q) ||
              (issue.affectedComponents || []).some((c) => c.toLowerCase().includes(q)) ||
              (issue.obdCodes || []).some((code) => code.toLowerCase().includes(q));

            if (matchIssue || matchVehicle) {
              results.push({
                brand: brand.name,
                model: model.name,
                generation: gen.name,
                engine: eng.name,
                engineId: eng.id,
                issue,
              });
            }
          }
        }
      }
    }
  }

  return results;
}

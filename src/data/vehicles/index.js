/**
 * ShiftMetric — Central Vehicle Known Issues (Red Flags & Common Defects) & Modular Catalog Registry
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
  'ford-focus-mk4-10-mhev': 'ford-focus-mk4-10-ecoboost',
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
    return tokens.some((t) => mId.includes(t) || mName.includes(t));
  });

  return model ? model.generations : models[0]?.generations || [];
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

/**
 * Finds an engine across all brands, models and generations
 * Supports exact ID, known aliases, and fuzzy tokens
 */
export function findEngineVariant(engineId) {
  if (!engineId) return null;
  const targetId = String(engineId).toLowerCase().trim();

  // 1. Direct alias check
  const resolvedId = ENGINE_PRESET_ALIASES[targetId] || targetId;

  // 2. Exact match against modular brands
  for (const brand of MODULAR_BRANDS) {
    for (const model of brand.models) {
      for (const gen of model.generations) {
        for (const eng of gen.engines) {
          if (eng.id.toLowerCase() === resolvedId || eng.id.toLowerCase() === targetId) {
            return {
              brand,
              model,
              generation: gen,
              engine: eng,
            };
          }
        }
      }
    }
  }

  // 3. Fallback fuzzy token matching
  const tokens = targetId.split(/[-_\s]+/).filter((t) => t.length > 2);
  let bestMatch = null;
  let maxScore = 0;

  for (const brand of MODULAR_BRANDS) {
    for (const model of brand.models) {
      for (const gen of model.generations) {
        for (const eng of gen.engines) {
          let score = 0;
          const engText = `${brand.name} ${model.name} ${gen.name} ${eng.name} ${eng.engineCode} ${eng.id}`.toLowerCase();
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

  return bestMatch;
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

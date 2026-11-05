import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MODULAR_BRANDS,
  validateAllVehicles,
  getAllBrands,
  getModelsForBrand,
  getGenerationsForModel,
  getEnginesForGeneration,
  findEngineVariant,
  getKnownIssuesForEngine,
  getKnownIssuesForVehicle,
  searchKnownIssues,
  VehicleBrandSchema,
  KnownIssueSchema,
  EngineVariantSchema,
} from '../src/data/vehicles/index.js';

test('1. Modular Vehicle Datasets Pass Zod Validation & Schema Invariants', () => {
  const results = validateAllVehicles();
  assert.ok(results.length >= 8, `Expected at least 8 modular brands, got ${results.length}`);

  for (const res of results) {
    assert.equal(res.success, true, `Brand ${res.brandName} failed Zod validation`);
    assert.equal(res.errors, null);
  }

  // Check specific brands
  const brandIds = new Set(MODULAR_BRANDS.map((b) => b.id));
  assert.ok(brandIds.has('ford'), 'Ford must be present');
  assert.ok(brandIds.has('bmw'), 'BMW must be present');
  assert.ok(brandIds.has('volkswagen'), 'Volkswagen must be present');
  assert.ok(brandIds.has('tesla'), 'Tesla must be present');
  assert.ok(brandIds.has('hyundai-kia'), 'Hyundai & Kia must be present');
  assert.ok(brandIds.has('toyota'), 'Toyota must be present');
  assert.ok(brandIds.has('stellantis'), 'Stellantis must be present');
  assert.ok(brandIds.has('mercedes-benz'), 'Mercedes-Benz must be present');
});

test('2. Required Vehicle Models, Generations & Engine Variants Coverage', () => {
  // A. Ford Focus Mk4 2.0 EcoBlue & 1.0 EcoBoost
  const focusPanther = findEngineVariant('ford-focus-mk4-20-ecoblue');
  assert.ok(focusPanther, 'Must find Ford Focus Mk4 2.0 EcoBlue');
  assert.equal(focusPanther.brand.name, 'Ford');
  assert.equal(focusPanther.model.name, 'Focus');
  assert.equal(focusPanther.generation.id, 'focus-mk4');
  assert.equal(focusPanther.engine.fuelType, 'Diesel');
  assert.equal(focusPanther.engine.powerHp, 150);

  const focusEcoBoost = findEngineVariant('ford-focus-mk4-10-ecoboost');
  assert.ok(focusEcoBoost, 'Must find Ford Focus Mk4 1.0 EcoBoost');
  assert.ok(focusEcoBoost.engine.name.includes('1.0 EcoBoost'));

  // B. BMW N47 and B47 2.0d & B58
  const bmwN47 = findEngineVariant('bmw-320d-n47-f30');
  assert.ok(bmwN47, 'Must find BMW N47 2.0d in F30');
  assert.equal(bmwN47.engine.engineCode, 'N47D20 2.0d Common Rail');

  const bmwB47 = findEngineVariant('bmw-320d-b47-g20');
  assert.ok(bmwB47, 'Must find BMW B47 2.0d in G20');
  assert.equal(bmwB47.engine.powerHp, 190);

  const bmwB58 = findEngineVariant('bmw-330i-b58-g20');
  assert.ok(bmwB58, 'Must find BMW B58 3.0i');

  // C. VW Golf Mk8 2.0 TDI EA288 & 2.0 TSI EA888
  const golfEa288 = findEngineVariant('vw-golf-mk8-20-tdi');
  assert.ok(golfEa288, 'Must find VW Golf Mk8 2.0 TDI EA288');
  assert.equal(golfEa288.engine.powerHp, 150);

  const golfEa888 = findEngineVariant('vw-golf-mk8-20-tsi');
  assert.ok(golfEa888, 'Must find VW Golf Mk8 2.0 TSI EA888');
  assert.equal(golfEa888.engine.powerHp, 245);

  // D. Tesla Model 3 RWD LFP vs Long Range NMC
  const teslaLfp = findEngineVariant('tesla-model-3-rwd-lfp');
  assert.ok(teslaLfp, 'Must find Tesla Model 3 RWD LFP');
  assert.ok(teslaLfp.engine.engineCode.includes('LFP'));

  const teslaNmc = findEngineVariant('tesla-model-3-lr-nmc');
  assert.ok(teslaNmc, 'Must find Tesla Model 3 Long Range NMC');
  assert.ok(teslaNmc.engine.engineCode.includes('NMC'));

  // E. Hyundai Ioniq 5 & Kia EV6
  const ioniq5 = findEngineVariant('ioniq-5-long-range-awd');
  assert.ok(ioniq5, 'Must find Hyundai Ioniq 5');
  assert.equal(ioniq5.engine.fuelType, 'Electric');

  const kiaEv6 = findEngineVariant('kia-ev6-long-range-rwd');
  assert.ok(kiaEv6, 'Must find Kia EV6');
  assert.equal(kiaEv6.engine.fuelType, 'Electric');
});

test('3. Exact Red Flag / Known Defect Named Invariants Verification', () => {
  // A. CP4 high-pressure pump roller fatigue / swarf
  const cp4Matches = searchKnownIssues('CP4');
  assert.ok(cp4Matches.length >= 3, `Expected at least 3 CP4 defect matches, got ${cp4Matches.length}`);
  const pantherCp4 = cp4Matches.find((m) => m.issue.id === 'panther-cp4-pump-wear');
  assert.ok(pantherCp4, 'Panther 2.0 EcoBlue must have CP4 issue');
  assert.ok(pantherCp4.issue.name.includes('CP4'));
  assert.ok(pantherCp4.issue.criticalMileage.minKm >= 100000);
  assert.ok(pantherCp4.issue.symptoms.length > 10);
  assert.ok(pantherCp4.issue.prevention.length > 10);
  assert.ok(pantherCp4.issue.repairCost.parts.min > 0);
  assert.ok(pantherCp4.issue.repairCost.labor.min > 0);

  // B. Wet oil pump / timing belt degradation
  const wetBeltMatches = searchKnownIssues('wet belt');
  assert.ok(wetBeltMatches.length >= 3, `Expected at least 3 wet belt matches, got ${wetBeltMatches.length}`);
  const pureTechBelt = wetBeltMatches.find((m) => m.issue.id === 'puretech-wet-belt-delamination');
  assert.ok(pureTechBelt, 'PureTech must have wet belt issue');
  const ecoboostBelt = wetBeltMatches.find((m) => m.issue.id === 'ecoboost-wet-belt-dissolution');
  assert.ok(ecoboostBelt, 'EcoBoost must have wet belt dissolution issue');

  // C. ICCU charging unit failure
  const iccuMatches = searchKnownIssues('ICCU');
  assert.ok(iccuMatches.length >= 2, `Expected at least 2 ICCU defect matches, got ${iccuMatches.length}`);
  for (const m of iccuMatches) {
    assert.equal(m.issue.severity, 'critical');
    assert.ok(m.issue.name.includes('ICCU'));
    assert.ok(m.issue.symptoms.includes('12V') || m.issue.symptoms.includes('AC'));
  }

  // D. Rear trailing arm suspension bushing tear
  const bushingMatches = searchKnownIssues('bushing').length >= 2
    ? searchKnownIssues('bushing')
    : searchKnownIssues('szilent');
  assert.ok(bushingMatches.length >= 2, `Expected at least 2 suspension bushing matches, got ${bushingMatches.length}`);
  const focusBushing = bushingMatches.find((m) => m.issue.id === 'focus-mk4-rear-bushing');
  assert.ok(focusBushing, 'Focus Mk4 must have rear bushing issue');
  const teslaBushing = bushingMatches.find((m) => m.issue.id === 'model-3-rear-bushing-tear');
  assert.ok(teslaBushing, 'Tesla Model 3 must have rear bushing tear issue');
});

test('4. Comprehensive Field Integrity on Every Known Issue', () => {
  let totalIssuesVerified = 0;

  for (const brand of MODULAR_BRANDS) {
    for (const model of brand.models) {
      for (const gen of model.generations) {
        const allGenIssues = [
          ...(gen.modelKnownIssues || []),
          ...gen.engines.flatMap((e) => e.knownIssues || []),
        ];

        for (const issue of allGenIssues) {
          totalIssuesVerified++;

          // Validate against Zod schema
          const validation = KnownIssueSchema.safeParse(issue);
          assert.equal(validation.success, true, `Issue ${issue.id} failed KnownIssueSchema`);

          // Critical Mileage bounds
          assert.ok(issue.criticalMileage.minKm >= 0);
          assert.ok(issue.criticalMileage.maxKm > issue.criticalMileage.minKm);
          assert.ok(issue.criticalMileage.display.includes('km'));

          // Symptoms 1 concise line
          assert.ok(issue.symptoms.length >= 10, `Issue ${issue.id} symptoms too short`);
          assert.ok(!issue.symptoms.includes('\n'), `Issue ${issue.id} symptoms must be 1 line`);

          // Prevention advice
          assert.ok(issue.prevention.length >= 15, `Issue ${issue.id} prevention too short`);

          // Repair costs
          assert.ok(issue.repairCost.parts.max >= issue.repairCost.parts.min);
          assert.ok(issue.repairCost.labor.max >= issue.repairCost.labor.min);
          assert.ok(issue.repairCost.formattedUsd.includes('$'));
          assert.ok(issue.repairCost.formattedEur.includes('€'));
          if (issue.repairCost.formattedHuf) {
            assert.ok(issue.repairCost.formattedHuf.includes('Ft'));
          }

          // Category & Severity
          assert.ok(['critical', 'high', 'medium', 'low'].includes(issue.severity));
          assert.ok(Array.isArray(issue.affectedComponents) && issue.affectedComponents.length >= 1);
        }
      }
    }
  }

  assert.ok(totalIssuesVerified >= 20, `Expected at least 20 verified known issues, found ${totalIssuesVerified}`);
});

test('5. Catalog Navigation and Hierarchical Query Functions', () => {
  // Test getAllBrands
  const brands = getAllBrands();
  assert.equal(brands.length, 8);
  assert.ok(brands[0].name);

  // Test getModelsForBrand
  const fordModels = getModelsForBrand('ford');
  assert.ok(fordModels.length >= 2, 'Ford must have at least Focus and Mondeo');

  // Test getGenerationsForModel
  const focusGens = getGenerationsForModel('ford', 'ford-focus');
  assert.ok(focusGens.length >= 1);
  assert.equal(focusGens[0].id, 'focus-mk4');

  // Test getEnginesForGeneration
  const mk4Engines = getEnginesForGeneration('ford', 'ford-focus', 'focus-mk4');
  assert.ok(mk4Engines.length >= 2, 'Focus Mk4 must have at least 2 engines');

  // Test getKnownIssuesForVehicle by keys
  const issues = getKnownIssuesForVehicle({
    brandId: 'ford',
    modelId: 'ford-focus',
    generationId: 'focus-mk4',
    engineId: 'ford-focus-mk4-20-ecoblue',
  });
  assert.ok(issues.length >= 3, 'Must return combined engine & model issues');

  // Test searchKnownIssues edge cases
  assert.deepEqual(searchKnownIssues(''), []);
  assert.deepEqual(searchKnownIssues(null), []);
  assert.deepEqual(searchKnownIssues('non-existent-xyz-defect'), []);
});

test('6. Preset ID Resolution & Fuzzy Matching Across Global Fleet Presets', () => {
  // Test canonical presets that must resolve into the modular engine database
  const presetMappings = [
    { preset: 'ford-focus-ecoblue', expectedEngine: 'ford-focus-mk4-20-ecoblue' },
    { preset: 'ford-focus-10-ecoboost', expectedEngine: 'ford-focus-mk4-10-ecoboost' },
    { preset: 'vw-golf-20-tdi', expectedEngine: 'vw-golf-mk8-20-tdi' },
    { preset: 'vw-golf-gti-ea888', expectedEngine: 'vw-golf-mk8-20-tsi' },
    { preset: 'bmw-320d-b47', expectedEngine: 'bmw-320d-b47-g20' },
    { preset: 'bmw-320d-n47', expectedEngine: 'bmw-320d-n47-f30' },
    { preset: 'tesla-model-3-lr', expectedEngine: 'tesla-model-3-lr-nmc' },
    { preset: 'tesla-model-3-rwd', expectedEngine: 'tesla-model-3-rwd-lfp' },
    { preset: 'hyundai-ioniq-5', expectedEngine: 'ioniq-5-long-range-awd' },
    { preset: 'kia-ev6-long-range', expectedEngine: 'kia-ev6-long-range-rwd' },
  ];

  for (const { preset, expectedEngine } of presetMappings) {
    const resolved = findEngineVariant(preset);
    assert.ok(resolved, `Preset '${preset}' must resolve to an engine variant`);
    assert.equal(resolved.engine.id, expectedEngine, `Preset '${preset}' mapped to unexpected engine`);
  }
});

test('7. Multi-Generation and Engine Variant Swapping Telemetry', () => {
  // A. Ford Focus: Mk4 2.0 EcoBlue vs 1.0 EcoBoost
  const focusPantherIssues = getKnownIssuesForEngine('ford-focus-mk4-20-ecoblue');
  const focusEcoBoostIssues = getKnownIssuesForEngine('ford-focus-mk4-10-ecoboost');
  assert.ok(focusPantherIssues.some((i) => i.id === 'panther-cp4-pump-wear'), 'Panther must have CP4 issue');
  assert.ok(focusEcoBoostIssues.some((i) => i.id === 'ecoboost-wet-belt-dissolution'), 'EcoBoost must have wet belt issue');

  // Both should inherit Mk4 generation chassis issue (rear trailing arm bushing)
  assert.ok(focusPantherIssues.some((i) => i.id === 'focus-mk4-rear-bushing'), 'Panther must inherit Mk4 rear bushing');
  assert.ok(focusEcoBoostIssues.some((i) => i.id === 'focus-mk4-rear-bushing'), 'EcoBoost must inherit Mk4 rear bushing');

  // B. BMW 3 Series: G20 (B47) vs F30 (N47)
  const bmwG20Gens = getGenerationsForModel('bmw', '3 Series');
  assert.ok(bmwG20Gens.length >= 2, 'BMW 3 Series must have multiple generations (G20 & F30)');
  const b47Issues = getKnownIssuesForEngine('bmw-320d-b47-g20');
  const n47Issues = getKnownIssuesForEngine('bmw-320d-n47-f30');
  assert.ok(b47Issues.some((i) => i.id === 'b47-egr-cooler-fire-recall'), 'B47 must have EGR cooler recall');
  assert.ok(n47Issues.some((i) => i.id === 'n47-rear-timing-chain-snap'), 'N47 must have rear timing chain snap');

  // C. Tesla Model 3: LFP vs NMC
  const lfpIssues = getKnownIssuesForEngine('tesla-model-3-rwd-lfp');
  const nmcIssues = getKnownIssuesForEngine('tesla-model-3-lr-nmc');
  assert.ok(lfpIssues.some((i) => i.id === 'tesla-lfp-bms-cold-drop'), 'LFP must have winter BMS calibration issue');
  assert.ok(nmcIssues.some((i) => i.id === 'tesla-nmc-supercharging-degradation'), 'NMC must have DC Supercharger degradation');
  assert.ok(nmcIssues.some((i) => i.id === 'tesla-heatpump-octovalve-failure'), 'NMC must have Octovalve heatpump issue');
});


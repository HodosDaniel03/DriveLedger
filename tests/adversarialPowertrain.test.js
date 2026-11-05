import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  POWERTRAIN_TYPES,
  PowertrainType,
  resolvePowertrainType,
  normalizePowertrainType,
  isPureElectric,
  calculateEvEnergyCost,
  calculatePhevEnergyCost,
  calculateVehicleEnergyCost,
  calculateBatterySoh,
  convertKwh100MiToKwh100Km,
  convertKwh100KmToKwh100Mi,
  convertKwh100MiToMiPerKwh,
  convertMiPerKwhToKwh100Mi,
} from '../src/data/powertrainTypes.js';

import {
  MAINTENANCE_COMPONENTS,
  ICE_EXCLUSIVE_COMPONENT_IDS,
  evaluateComponentHealth,
  filterComponentsForPowertrain,
  STANDARD_MILESTONES,
  EV_MILESTONES,
  ICE_MILESTONES,
  getMilestonesForPowertrain,
  filterMilestonesByPowertrain,
} from '../src/data/maintenanceData.js';

import {
  VEHICLE_PRESETS,
  getPresetById,
} from '../src/data/vehiclePresets.js';

import {
  POWERTRAIN_ARCHETYPES,
  resolveArchetypeIdForPreset,
  hydrateVehiclePreset,
} from '../src/data/powertrainArchetypes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const BANNED_ICE_PATTERNS = [
  /\bengine oil\b/i,
  /\bmotor oil\b/i,
  /\bspark plug\b/i,
  /\btiming belt\b/i,
  /\btiming chain\b/i,
  /\bwater pump replacement\b/i,
  /\bdpf\b/i,
  /\bdiesel particulate\b/i,
  /\begr\b/i,
  /\bscr\b/i,
  /\badblue\b/i,
  /\bdual-mass flywheel\b/i,
  /\bdmf\b/i,
  /\bdsg fluid\b/i,
  /\btorque converter\b/i,
  /\bintake valve walnut\b/i,
  /\bfuel pump\b/i,
  /\bhpfp\b/i,
  /\boxygen \(lambda\)\b/i,
  /\blambda sensor\b/i,
  /\bpcv valve\b/i,
  /\bexhaust system\b/i,
];

const REQUIRED_EV_COMPONENT_IDS = [
  'ev-battery-soh',
  'ev-obc-iccu',
  'ev-thermal-heatpump',
  'ev-reduction-gear',
  'ev-curb-suspension',
  'ev-torque-tires',
  'ev-regen-brake-corrosion',
];

test('ADV-1: Fuzzing & Combinatorial Resolution of Powertrain Types', () => {
  // Test bizarre and boundary inputs to resolvePowertrainType
  const weirdInputs = [
    null,
    undefined,
    '',
    '   ',
    123,
    0,
    -1,
    true,
    false,
    [],
    [1, 2, 3],
    {},
    { foo: 'bar' },
    NaN,
    Infinity,
  ];

  for (const input of weirdInputs) {
    const resolved = resolvePowertrainType(input);
    assert.ok(
      Object.values(POWERTRAIN_TYPES).includes(resolved),
      `Input ${JSON.stringify(input)} must resolve to a valid canonical PowertrainType, got ${resolved}`
    );
    // Non-EV weird input should NOT accidentally resolve to EV
    assert.notEqual(resolved, POWERTRAIN_TYPES.EV, `Input ${JSON.stringify(input)} must not resolve to EV`);
    assert.equal(isPureElectric(input), false, `Input ${JSON.stringify(input)} must not be pure electric`);
  }

  // String casing, whitespace, and substrings that contain "ev" or "electric" but are not EV
  assert.equal(resolvePowertrainType('  ev  '), POWERTRAIN_TYPES.EV);
  assert.equal(resolvePowertrainType('EV'), POWERTRAIN_TYPES.EV);
  assert.equal(resolvePowertrainType('bev'), POWERTRAIN_TYPES.EV);
  assert.equal(resolvePowertrainType('Electric'), POWERTRAIN_TYPES.EV);

  // Substrings that should NOT resolve to EV
  assert.equal(resolvePowertrainType('EVALUATION'), POWERTRAIN_TYPES.ICE_PETROL);
  assert.equal(resolvePowertrainType('EVERYTHING'), POWERTRAIN_TYPES.ICE_PETROL);
  assert.equal(resolvePowertrainType('CHEVROLET'), POWERTRAIN_TYPES.ICE_PETROL);
  assert.equal(resolvePowertrainType('ELECTRICIAN'), POWERTRAIN_TYPES.ICE_PETROL);
  assert.equal(resolvePowertrainType('HYBRID_ELECTRIC'), POWERTRAIN_TYPES.ICE_PETROL);

  // Canonical tag overrides legacy fields
  assert.equal(
    resolvePowertrainType({ powertrainType: 'EV', fuelType: 'Diesel', powertrain: 'diesel', isEv: false }),
    POWERTRAIN_TYPES.EV,
    'Canonical powertrainType: EV must override conflicting legacy fields'
  );

  assert.equal(
    resolvePowertrainType({ powertrainType: 'ICE_DIESEL', fuelType: 'Electric', isEv: true }),
    POWERTRAIN_TYPES.ICE_DIESEL,
    'Canonical powertrainType: ICE_DIESEL must override legacy isEv'
  );
});

test('ADV-2: Combinatorial Fuzzing of EV Isolation (0 ICE Items under any EV configuration)', () => {
  const isEvValues = [true, 'true', 1];
  const powertrains = ['ev', 'electric'];
  const fuelTypes = ['Electric', 'electric', 'ELECTRIC'];
  const archetypes = ['bev-lithium'];
  const labels = [
    'Tesla Model 3 Dual-Motor AWD',
    'Porsche Taycan Battery Electric',
    'Nissan Ariya Electric Crossover',
  ];

  let testedCombos = 0;

  for (const isEv of isEvValues) {
    for (const pt of [...powertrains, undefined]) {
      for (const ft of [...fuelTypes, undefined]) {
        for (const arch of [...archetypes, undefined]) {
          for (const lbl of [...labels, undefined]) {
            const candidate = {
              id: 'custom-fuzz-ev',
              name: lbl,
              isEv,
              powertrain: pt,
              fuelType: ft,
              archetypeId: arch,
            };

            const resolvedType = resolvePowertrainType(candidate);
            assert.equal(resolvedType, POWERTRAIN_TYPES.EV, `Candidate ${JSON.stringify(candidate)} must resolve to EV`);
            assert.equal(isPureElectric(candidate), true);

            // 1. Filtered components MUST contain 0 ICE items
            const filteredComps = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, candidate);
            const compIds = filteredComps.map((c) => c.id);

            for (const iceId of ICE_EXCLUSIVE_COMPONENT_IDS) {
              assert.ok(!compIds.includes(iceId), `Filtered components for EV must not contain ICE component: ${iceId}`);
            }

            // Must contain all 7 EV components
            for (const reqId of REQUIRED_EV_COMPONENT_IDS) {
              assert.ok(compIds.includes(reqId), `Filtered components for EV must contain ${reqId}`);
            }

            // Every component's description/name must not contain banned patterns
            for (const comp of filteredComps) {
              for (const pattern of BANNED_ICE_PATTERNS) {
                assert.ok(
                  !pattern.test(comp.name),
                  `EV component ${comp.id} name "${comp.name}" matches banned pattern ${pattern}`
                );
              }
              // EV components must have oilSensitivity === 0.0
              assert.equal(comp.oilSensitivity, 0.0, `EV component ${comp.id} must have oilSensitivity 0.0`);
            }

            // 2. Milestones MUST contain 0 ICE items
            const milestones = getMilestonesForPowertrain(candidate);
            assert.equal(milestones.length, 6, 'Must provide 6 milestone intervals for EV');

            for (const m of milestones) {
              for (const item of m.items) {
                for (const pattern of BANNED_ICE_PATTERNS) {
                  assert.ok(
                    !pattern.test(item.name),
                    `EV milestone item "${item.name}" at ${m.miles} mi matches banned pattern ${pattern}`
                  );
                }
                assert.deepEqual(item.applicablePowertrains, ['EV'], `Item ${item.id} must be applicable only to EV`);
              }
            }

            // 3. evaluateComponentHealth MUST return null for all ICE components
            for (const iceId of ICE_EXCLUSIVE_COMPONENT_IDS) {
              const iceComp = MAINTENANCE_COMPONENTS.find((c) => c.id === iceId);
              if (iceComp) {
                // Object signature
                const healthObj = evaluateComponentHealth({
                  component: iceComp,
                  physicalOdometerMiles: 75000,
                  vehicle: candidate,
                });
                assert.equal(healthObj, null, `evaluateComponentHealth must return null for ${iceId} on EV`);

                // Positional signature
                const healthPos = evaluateComponentHealth(iceComp, 75000, { vehicle: candidate });
                assert.equal(healthPos, null, `Positional evaluateComponentHealth must return null for ${iceId} on EV`);
              }
            }

            testedCombos++;
          }
        }
      }
    }
  }

  assert.ok(testedCombos > 50, `Expected >50 fuzzing permutations tested, tested ${testedCombos}`);
});

test('ADV-3: EV Component Evaluation Monotonicity & Boundary Stress', () => {
  const evPreset = getPresetById('tesla-model-3-lr');
  assert.ok(evPreset, 'Tesla Model 3 preset must exist');

  const evComponents = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, evPreset);
  assert.equal(evComponents.length, 7, 'Must have exactly 7 EV components');

  // Test across odometers from 0 to 500,000 miles
  const testOdometers = [0, 1, 100, 15000, 30000, 60000, 90000, 120000, 150000, 200000, 500000];

  for (const comp of evComponents) {
    let prevWearPct = -1;
    let prevEffectiveWear = -1;

    for (const odo of testOdometers) {
      const health = evaluateComponentHealth({
        component: comp,
        physicalOdometerMiles: odo,
        urbanTripSharePct: 50,
        oilIntervalId: 'extended', // should not affect EV (oilSensitivity === 0)
        vehicle: evPreset,
      });

      assert.ok(health, `Health must be returned for EV component ${comp.id} at ${odo} miles`);
      assert.ok(!isNaN(health.effectiveWearMiles), `effectiveWearMiles must not be NaN for ${comp.id}`);
      assert.ok(!isNaN(health.wearPctOfCritical), `wearPctOfCritical must not be NaN for ${comp.id}`);
      assert.ok(!isNaN(health.combinedMultiplier), `combinedMultiplier must not be NaN for ${comp.id}`);

      // Monotonic wear progression
      assert.ok(
        health.effectiveWearMiles >= prevEffectiveWear,
        `effectiveWearMiles must be monotonic for ${comp.id} (odo ${odo})`
      );
      assert.ok(
        health.wearPctOfCritical >= prevWearPct,
        `wearPctOfCritical must be monotonic for ${comp.id} (odo ${odo})`
      );

      // Wear percentage bounded between 0 and 100
      assert.ok(health.wearPctOfCritical >= 0 && health.wearPctOfCritical <= 100);
      assert.ok(health.remainingLifespanPct >= 0 && health.remainingLifespanPct <= 100);

      // Remaining miles must be non-negative
      assert.ok(health.remainingPhysicalMiles >= 0);

      prevWearPct = health.wearPctOfCritical;
      prevEffectiveWear = health.effectiveWearMiles;
    }
  }

  // Verify oil interval discipline DOES NOT affect EV components (since oilSensitivity is 0.0)
  for (const comp of evComponents) {
    const healthStrict = evaluateComponentHealth({
      component: comp,
      physicalOdometerMiles: 60000,
      urbanTripSharePct: 40,
      oilIntervalId: 'strict',
      vehicle: evPreset,
    });

    const healthExtended = evaluateComponentHealth({
      component: comp,
      physicalOdometerMiles: 60000,
      urbanTripSharePct: 40,
      oilIntervalId: 'extended',
      vehicle: evPreset,
    });

    assert.equal(
      healthStrict.effectiveWearMiles,
      healthExtended.effectiveWearMiles,
      `EV component ${comp.id} wear must be completely invariant to engine oil interval`
    );
  }
});

test('ADV-4: High-Voltage Battery Degradation Stress & Boundary Testing', () => {
  // Test extreme inputs to calculateBatterySoh
  const extremeCases = [
    { chemistry: 'LFP', odometerMiles: -1000, ageYears: -5, dcFastChargingSharePct: -20, nominalCapacityKwh: -50 },
    { chemistry: 'NMC', odometerMiles: 1000000, ageYears: 25, dcFastChargingSharePct: 150, nominalCapacityKwh: 200 },
    { chemistry: 'weird', odometerMiles: 0, ageYears: 0, dcFastChargingSharePct: 0, nominalCapacityKwh: 0 },
  ];

  for (const tc of extremeCases) {
    const soh = calculateBatterySoh(tc);
    assert.ok(!isNaN(soh.sohPct), 'SoH % must not be NaN');
    assert.ok(!isNaN(soh.capacityLossPct), 'capacityLossPct must not be NaN');
    assert.ok(!isNaN(soh.remainingCapacityKwh), 'remainingCapacityKwh must not be NaN');
    assert.ok(!isNaN(soh.cycleEquivalentCount), 'cycleEquivalentCount must not be NaN');
    assert.ok(soh.sohPct >= 65 && soh.sohPct <= 100, `SoH % must be within realistic bounds [65, 100], got ${soh.sohPct}`);
    assert.ok(['HEALTHY', 'DEGRADED', 'WARRANTY_CLAIM_ELIGIBLE'].includes(soh.warrantyStatus));
  }

  // Warranty claim trigger test: SoH < 70%, age <= 8 yr, odo <= 100,000 mi
  const warrantyCase = calculateBatterySoh({
    chemistry: 'NMC',
    odometerMiles: 95000,
    ageYears: 7,
    dcFastChargingSharePct: 100,
    nominalCapacityKwh: 75,
  });
  assert.equal(warrantyCase.warrantyStatus, 'DEGRADED');

  // Heavy abusive case driving SoH to floor
  const flooredNmc = calculateBatterySoh({
    chemistry: 'NMC',
    odometerMiles: 400000,
    ageYears: 15,
    dcFastChargingSharePct: 90,
  });
  assert.equal(flooredNmc.sohPct, 65.0, 'NMC SoH floor must be 65.0%');

  const flooredLfp = calculateBatterySoh({
    chemistry: 'LFP',
    odometerMiles: 600000,
    ageYears: 25,
    dcFastChargingSharePct: 90,
  });
  assert.equal(flooredLfp.sohPct, 70.0, 'LFP SoH floor must be 70.0%');
});

test('ADV-5: EV and PHEV Energy Cost Stress & Boundary Math', () => {
  // Test zero distance
  const zeroEv = calculateEvEnergyCost({ annualDistanceMiles: 0 });
  assert.equal(zeroEv.annualCostUsd, 0);
  assert.equal(zeroEv.annualKwh, 0);
  assert.equal(zeroEv.costPerMileUsd, 0);

  // Test 100% home charging vs 100% DC fast charging
  const homeOnly = calculateEvEnergyCost({
    annualDistanceMiles: 10000,
    efficiencyKwh100Mi: 25.0,
    homeChargePct: 100,
    homeTariffUsdPerKwh: 0.15,
    dcFastTariffUsdPerKwh: 0.50,
  });
  assert.equal(homeOnly.blendedTariffUsdPerKwh, 0.15);
  assert.equal(homeOnly.homeCostUsd, homeOnly.annualCostUsd);
  assert.equal(homeOnly.dcFastCostUsd, 0);

  const dcOnly = calculateEvEnergyCost({
    annualDistanceMiles: 10000,
    efficiencyKwh100Mi: 25.0,
    homeChargePct: 0,
    homeTariffUsdPerKwh: 0.15,
    dcFastTariffUsdPerKwh: 0.50,
  });
  assert.equal(dcOnly.blendedTariffUsdPerKwh, 0.50);
  assert.equal(dcOnly.dcFastCostUsd, dcOnly.annualCostUsd);
  assert.equal(dcOnly.homeCostUsd, 0);

  // PHEV boundaries: 100% electric vs 0% electric
  const phevFullElectric = calculatePhevEnergyCost({
    annualDistanceMiles: 10000,
    electricSharePct: 100,
    fuelPriceUsdPerGal: 4.00,
  });
  assert.equal(phevFullElectric.iceMiles, 0);
  assert.equal(phevFullElectric.iceCostUsd, 0);
  assert.equal(phevFullElectric.electricMiles, 10000);
  assert.equal(phevFullElectric.totalAnnualCostUsd, phevFullElectric.electricCostUsd);

  const phevFullIce = calculatePhevEnergyCost({
    annualDistanceMiles: 10000,
    electricSharePct: 0,
    fuelPriceUsdPerGal: 4.00,
  });
  assert.equal(phevFullIce.electricMiles, 0);
  assert.equal(phevFullIce.electricCostUsd, 0);
  assert.equal(phevFullIce.iceMiles, 10000);
  assert.equal(phevFullIce.totalAnnualCostUsd, phevFullIce.iceCostUsd);
});

test('ADV-6: Archetype Hydration & OBD Sanitization for EV vs Combustion', () => {
  // Test hydrateVehiclePreset with raw EV object containing dirty ICE codes
  const dirtyEv = {
    id: 'dirty-ev-test',
    brand: 'Tesla',
    modelName: 'Model 3 Test',
    isEv: true,
    powertrain: 'ev',
    commonObdCodes: ['P0700', 'P0128', 'U0100', 'P0A80'],
  };

  const hydrated = hydrateVehiclePreset(dirtyEv);
  assert.equal(hydrated.powertrainType, 'EV');
  assert.equal(hydrated.isEv, true);
  // Verify that P0700 and P0128 are stripped
  assert.ok(!hydrated.commonObdCodes.includes('P0700'), 'P0700 must be stripped on EV');
  assert.ok(!hydrated.commonObdCodes.includes('P0128'), 'P0128 must be stripped on EV');
  assert.ok(hydrated.commonObdCodes.includes('U0100'), 'U0100 must be retained');
  assert.ok(hydrated.commonObdCodes.includes('P0A80'), 'P0A80 must be retained');

  // Combustion vehicle must retain P0700 and P0128 if applicable
  const dirtyIce = {
    id: 'dirty-ice-test',
    brand: 'Volkswagen',
    modelName: 'Golf TDI Test',
    isEv: false,
    powertrain: 'diesel',
    fuelType: 'Diesel',
    commonObdCodes: ['P0700', 'P0128', 'P2002'],
  };
  const hydratedIce = hydrateVehiclePreset(dirtyIce);
  assert.equal(hydratedIce.powertrainType, 'ICE_DIESEL');
  assert.ok(hydratedIce.commonObdCodes.includes('P0700'), 'ICE must retain P0700');
  assert.ok(hydratedIce.commonObdCodes.includes('P0128'), 'ICE must retain P0128');
});

test('ADV-7: Milestone Impact Map & Component Triggers Coverage for EV', () => {
  // Check that all 24 EV milestone items have entries in EV_MILESTONE_IMPACT_MAP
  const allEvMilestones = getMilestonesForPowertrain('EV');
  const allEvItems = allEvMilestones.flatMap((m) => m.items);

  assert.equal(allEvItems.length, 24, 'EV milestones must contain exactly 24 checklist items (4 items x 6 intervals)');

  // Verify EV_MILESTONE_IMPACT_MAP from file content
  const milestonesSource = fs.readFileSync(
    path.join(projectRoot, 'src/components/calculators/MaintenanceMilestones.jsx'),
    'utf-8'
  );

  for (const item of allEvItems) {
    assert.ok(
      milestonesSource.includes(`'${item.id}'`),
      `MaintenanceMilestones.jsx must define impact mapping for EV item "${item.id}"`
    );
  }
});

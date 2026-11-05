import test from 'node:test';
import assert from 'node:assert/strict';

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

import fs from 'node:fs';
import path from 'node:path';

import {
  VEHICLE_PRESETS,
  getPresetById,
} from '../src/data/vehiclePresets.js';

import { getAllEnginesFlat } from '../src/data/vehicleCatalog.js';

test('1. Canonical PowertrainType Enumeration & Resolver', () => {
  // Enum values
  assert.equal(POWERTRAIN_TYPES.EV, 'EV');
  assert.equal(POWERTRAIN_TYPES.PHEV, 'PHEV');
  assert.equal(POWERTRAIN_TYPES.HEV, 'HEV');
  assert.equal(POWERTRAIN_TYPES.ICE_PETROL, 'ICE_PETROL');
  assert.equal(POWERTRAIN_TYPES.ICE_DIESEL, 'ICE_DIESEL');
  assert.equal(PowertrainType, POWERTRAIN_TYPES);

  // String resolver
  assert.equal(resolvePowertrainType('EV'), 'EV');
  assert.equal(resolvePowertrainType('bev'), 'EV');
  assert.equal(resolvePowertrainType('electric'), 'EV');
  assert.equal(resolvePowertrainType('phev'), 'PHEV');
  assert.equal(resolvePowertrainType('plug-in hybrid'), 'PHEV');
  assert.equal(resolvePowertrainType('hybrid'), 'HEV');
  assert.equal(resolvePowertrainType('mhev'), 'HEV');
  assert.equal(resolvePowertrainType('diesel'), 'ICE_DIESEL');
  assert.equal(resolvePowertrainType('petrol'), 'ICE_PETROL');
  assert.equal(resolvePowertrainType('gasoline-turbo'), 'ICE_PETROL');

  // Object / Preset resolver
  assert.equal(resolvePowertrainType({ isEv: true }), 'EV');
  assert.equal(resolvePowertrainType({ fuelType: 'Electric' }), 'EV');
  assert.equal(resolvePowertrainType({ powertrain: 'ev' }), 'EV');
  assert.equal(resolvePowertrainType({ powertrain: 'phev' }), 'PHEV');
  assert.equal(resolvePowertrainType({ fuelType: 'Plug-in Hybrid' }), 'PHEV');
  assert.equal(resolvePowertrainType({ powertrain: 'hybrid' }), 'HEV');
  assert.equal(resolvePowertrainType({ fuelType: 'Hybrid' }), 'HEV');
  assert.equal(resolvePowertrainType({ fuelType: 'Diesel' }), 'ICE_DIESEL');
  assert.equal(resolvePowertrainType({ powertrain: 'diesel' }), 'ICE_DIESEL');
  assert.equal(resolvePowertrainType({ fuelType: 'Gasoline' }), 'ICE_PETROL');
  assert.equal(resolvePowertrainType(null), 'ICE_PETROL');
  assert.equal(normalizePowertrainType({ isEv: true }), 'EV');

  // isPureElectric predicate
  assert.equal(isPureElectric('EV'), true);
  assert.equal(isPureElectric('ev'), true);
  assert.equal(isPureElectric('PHEV'), false);
  assert.equal(isPureElectric('HEV'), false);
  assert.equal(isPureElectric('ICE_DIESEL'), false);
  assert.equal(isPureElectric('ICE_PETROL'), false);
  assert.equal(isPureElectric({ isEv: true }), true);
  assert.equal(isPureElectric({ fuelType: 'Plug-in Hybrid' }), false);
  assert.equal(isPureElectric(null), false);
});

test('2. EV Strict ICE Exclusion in Component Dossiers (Zero ICE Contamination)', () => {
  // Verify drivetrain-dmf-dsg does NOT include 'ev'
  const dmfComp = MAINTENANCE_COMPONENTS.find((c) => c.id === 'drivetrain-dmf-dsg');
  assert.ok(dmfComp, 'drivetrain-dmf-dsg must exist');
  assert.ok(!dmfComp.applicablePowertrains.includes('ev'), 'drivetrain-dmf-dsg must NOT include "ev"');
  assert.ok(!dmfComp.applicableTransmissions.includes('single-speed-ev'), 'drivetrain-dmf-dsg must NOT include "single-speed-ev"');

  // Filter components for EV
  const evComponents = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, 'EV');
  const evCompIds = evComponents.map((c) => c.id);

  // Strictly verify 0 ICE components in EV
  assert.ok(!evCompIds.includes('timing-assembly'), 'EV must not include timing-assembly');
  assert.ok(!evCompIds.includes('drivetrain-dmf-dsg'), 'EV must not include drivetrain-dmf-dsg');
  assert.ok(!evCompIds.includes('dpf-egr-scr-injectors'), 'EV must not include dpf-egr-scr-injectors');
  assert.ok(!evCompIds.includes('hpfp-turbo-vnt'), 'EV must not include hpfp-turbo-vnt');
  assert.ok(!evCompIds.includes('gdi-intake-pcv-ignition'), 'EV must not include gdi-intake-pcv-ignition');

  // Strictly verify all 7 dedicated EV components are present
  assert.ok(evCompIds.includes('ev-battery-soh'), 'EV must include ev-battery-soh');
  assert.ok(evCompIds.includes('ev-obc-iccu'), 'EV must include ev-obc-iccu');
  assert.ok(evCompIds.includes('ev-thermal-heatpump'), 'EV must include ev-thermal-heatpump');
  assert.ok(evCompIds.includes('ev-reduction-gear'), 'EV must include ev-reduction-gear');
  assert.ok(evCompIds.includes('ev-curb-suspension'), 'EV must include ev-curb-suspension');
  assert.ok(evCompIds.includes('ev-torque-tires'), 'EV must include ev-torque-tires');
  assert.ok(evCompIds.includes('ev-regen-brake-corrosion'), 'EV must include ev-regen-brake-corrosion');

  // evaluateComponentHealth with powertrainType: 'EV' returns null for ICE components
  const timingComp = MAINTENANCE_COMPONENTS.find((c) => c.id === 'timing-assembly');
  const iceHealth = evaluateComponentHealth({
    component: timingComp,
    physicalOdometerMiles: 50000,
    powertrainType: 'EV',
  });
  assert.equal(iceHealth, null, 'Evaluating ICE component with EV powertrainType must return null');

  // Positional evaluateComponentHealth signature check
  const positionalIce = evaluateComponentHealth(timingComp, 50000, { powertrainType: 'EV' });
  assert.equal(positionalIce, null, 'Positional signature must also return null for ICE on EV');
});

test('3. EV Strict ICE Exclusion in Milestone Roadmap Schedules', () => {
  const evMilestones = getMilestonesForPowertrain('EV');
  assert.ok(Array.isArray(evMilestones) && evMilestones.length === 6, 'Must provide 6 milestone intervals for EV');

  // Flat list of all EV items
  const allEvItemNames = evMilestones.flatMap((m) => m.items).map((i) => i.name.toLowerCase());

  // Prohibit 10 internal combustion keywords
  const bannedKeywords = [
    'engine oil',
    'motor oil',
    'spark plug',
    'timing belt',
    'water pump replacement',
    'dpf',
    'torque converter',
    'intake valve walnut',
    'fuel pump',
    'oxygen (lambda)',
    'pcv valve',
  ];

  for (const banned of bannedKeywords) {
    const found = allEvItemNames.some((name) => name.includes(banned));
    assert.equal(found, false, `EV milestone roadmap must NEVER contain ICE item: "${banned}"`);
  }

  // Verify EV-specific items exist
  assert.ok(allEvItemNames.some((name) => name.includes('reduction gearbox fluid')), 'EV milestone must include reduction gearbox fluid');
  assert.ok(allEvItemNames.some((name) => name.includes('battery capacity soh')), 'EV milestone must include battery capacity SoH');
  assert.ok(allEvItemNames.some((name) => name.includes('on-board charger') || name.includes('obc')), 'EV milestone must include OBC/ICCU');
  assert.ok(allEvItemNames.some((name) => name.includes('regenerative brake rotor')), 'EV milestone must include regen brake rotor');
  assert.ok(allEvItemNames.some((name) => name.includes('chiller loop') || name.includes('octovalve')), 'EV milestone must include chiller loop');

  // filterMilestonesByPowertrain verification
  const filtered = filterMilestonesByPowertrain(STANDARD_MILESTONES, 'EV');
  assert.equal(filtered, EV_MILESTONES);
});

test('4. Sanitized EV Presets & OBD Fault Codes', () => {
  const tesla3 = getPresetById('tesla-model-3-lr');
  assert.ok(tesla3, 'Tesla Model 3 LR must exist');
  assert.equal(tesla3.powertrainType, 'EV');
  assert.equal(tesla3.isEv, true);
  assert.equal(tesla3.batteryChemistry, 'NMC');
  assert.ok(!tesla3.commonObdCodes.includes('P0700'), 'Tesla Model 3 must NOT contain ICE transmission code P0700');
  assert.ok(!tesla3.commonObdCodes.includes('P0128'), 'Tesla Model 3 must NOT contain ICE thermostat code P0128');
  assert.ok(tesla3.commonObdCodes.includes('U0100'), 'Tesla Model 3 must retain communication code U0100');
  assert.ok(tesla3.commonObdCodes.includes('P0A80'), 'Tesla Model 3 must retain battery pack code P0A80');

  const teslaY = getPresetById('tesla-model-y-lr');
  assert.ok(teslaY, 'Tesla Model Y LR must exist');
  assert.equal(teslaY.powertrainType, 'EV');
  assert.equal(teslaY.isEv, true);
  assert.equal(teslaY.batteryChemistry, 'NMC');
  assert.ok(!teslaY.commonObdCodes.includes('P0700'), 'Tesla Model Y must NOT contain P0700');
  assert.ok(!teslaY.commonObdCodes.includes('P0128'), 'Tesla Model Y must NOT contain P0128');
});

test('5. EV & PHEV Fuel / Energy Calculation Engines', () => {
  // EV Energy Calculation: 12,000 miles, 28 kWh/100mi, 80% Home ($0.14) / 20% DC Fast ($0.48)
  // Blended tariff: 0.8 * 0.14 + 0.2 * 0.48 = 0.112 + 0.096 = $0.208 / kWh
  // Annual kWh: (12000 / 100) * 28 = 3,360 kWh
  // Annual Cost: 3360 * 0.208 = $698.88
  const evResult = calculateEvEnergyCost({
    annualDistanceMiles: 12000,
    efficiencyKwh100Mi: 28.0,
    homeChargePct: 80,
    homeTariffUsdPerKwh: 0.14,
    dcFastTariffUsdPerKwh: 0.48,
  });

  assert.equal(evResult.blendedTariffUsdPerKwh, 0.208);
  assert.equal(evResult.annualKwh, 3360);
  assert.equal(evResult.annualCostUsd, 698.88);
  assert.ok(evResult.costPerMileUsd > 0.05 && evResult.costPerMileUsd < 0.06);

  // PHEV Energy Calculation: 12,000 miles, 55% electric (6,600 mi) / 45% ICE (5,400 mi)
  const phevResult = calculatePhevEnergyCost({
    annualDistanceMiles: 12000,
    electricSharePct: 55,
    evEfficiencyKwh100Mi: 28.0,
    iceMpg: 34.0,
    homeChargePct: 80,
    homeTariffUsdPerKwh: 0.14,
    dcFastTariffUsdPerKwh: 0.48,
    fuelPriceUsdPerGal: 3.85,
  });

  assert.equal(phevResult.electricMiles, 6600);
  assert.equal(phevResult.iceMiles, 5400);
  assert.ok(phevResult.electricCostUsd > 0);
  assert.ok(phevResult.iceCostUsd > 0);
  assert.equal(phevResult.totalAnnualCostUsd, +(phevResult.electricCostUsd + phevResult.iceCostUsd).toFixed(2));

  // Universal dispatcher calculateVehicleEnergyCost
  const evPresetEnergy = calculateVehicleEnergyCost(getPresetById('tesla-model-3-lr'));
  assert.ok(evPresetEnergy.annualCostUsd > 0);
  assert.ok(evPresetEnergy.blendedTariffUsdPerKwh > 0);
});

test('6. High-Voltage Battery Degradation (SoH % LFP vs. NMC Curve)', () => {
  // LFP at 50,000 miles, 3 years, 20% DC fast charging
  const lfpSoh = calculateBatterySoh({
    chemistry: 'LFP',
    odometerMiles: 50000,
    ageYears: 3,
    dcFastChargingSharePct: 20,
    nominalCapacityKwh: 60,
  });
  assert.equal(lfpSoh.chemistry, 'LFP');
  assert.ok(lfpSoh.sohPct >= 90 && lfpSoh.sohPct <= 96, `LFP SoH should be ~93-95% (got ${lfpSoh.sohPct}%)`);
  assert.equal(lfpSoh.warrantyStatus, 'HEALTHY');

  // NMC at 50,000 miles, 3 years, 20% DC fast charging
  const nmcSoh = calculateBatterySoh({
    chemistry: 'NMC',
    odometerMiles: 50000,
    ageYears: 3,
    dcFastChargingSharePct: 20,
    nominalCapacityKwh: 75,
  });
  assert.equal(nmcSoh.chemistry, 'NMC');
  // NMC should degrade slightly more than LFP under same conditions
  assert.ok(nmcSoh.sohPct < lfpSoh.sohPct, 'NMC SoH should degrade faster than LFP');
  assert.ok(nmcSoh.remainingCapacityKwh > 60 && nmcSoh.remainingCapacityKwh < 75);

  // Unit conversion helpers
  assert.equal(convertKwh100MiToKwh100Km(28.0), 17.4);
  assert.equal(convertKwh100KmToKwh100Mi(17.4), 28.0);
  assert.equal(convertKwh100MiToMiPerKwh(25.0), 4.0);
  assert.equal(convertMiPerKwhToKwh100Mi(4.0), 25.0);
});

test('7. Classifier Collision Prevention across Presets and Catalog Invariants', () => {
  // Specific critical vehicles that previously failed via false keyword collision
  const criticalExpectations = [
    { id: 'audi-a6-30-tdi', expected: 'ICE_DIESEL', notExpected: 'EV' },
    { id: 'audi-a6-c7-20-tdi', expected: 'ICE_DIESEL', notExpected: 'EV' },
    { id: 'ford-transit-custom-20-ecoblue', expected: 'ICE_DIESEL', notExpected: 'EV' },
    { id: 'toyota-avensis-t27-20-d4d', expected: 'ICE_DIESEL', notExpected: 'EV' },
    { id: 'fiat-panda-12-fire', expected: 'ICE_PETROL', notExpected: 'EV' },
    { id: 'honda-jazz-15-ehev', expected: 'HEV', notExpected: 'EV' },
    { id: 'peugeot-208-12-puretech', expected: 'ICE_PETROL', notExpected: 'PHEV' },
    { id: 'peugeot-308-15-bluehdi', expected: 'ICE_DIESEL', notExpected: 'PHEV' },
    { id: 'peugeot-508-20-bluehdi', expected: 'ICE_DIESEL', notExpected: 'PHEV' },
    { id: 'peugeot-3008-15-bluehdi', expected: 'ICE_DIESEL', notExpected: 'PHEV' },
    { id: 'ds-7-20-bluehdi', expected: 'ICE_DIESEL', notExpected: 'PHEV' },
    { id: 'ds4-12-puretech', expected: 'ICE_PETROL', notExpected: 'PHEV' },
    { id: 'audi-a3-15-tfsi', expected: 'ICE_PETROL', notExpected: 'PHEV' },
    { id: 'audi-a3-35-tfsi-norm', expected: 'ICE_PETROL', notExpected: 'PHEV' },
    { id: 'bmw-520d-g31-touring-norm', expected: 'ICE_DIESEL', notExpected: 'ICE_PETROL' },
    { id: 'mazda-cx5-skyactiv', expected: 'ICE_PETROL', notExpected: 'ICE_DIESEL' },
    { id: 'tesla-model-3-lr', expected: 'EV', notExpected: 'ICE_PETROL' },
    { id: 'tesla-model-y-lr', expected: 'EV', notExpected: 'ICE_PETROL' },
    { id: 'mitsubishi-outlander-phev-20', expected: 'PHEV', notExpected: 'EV' },
    { id: 'toyota-corolla-18-hybrid', expected: 'HEV', notExpected: 'EV' },
  ];

  for (const item of criticalExpectations) {
    const preset = getPresetById(item.id);
    assert.ok(preset, `Preset ${item.id} must exist`);
    const resolved = resolvePowertrainType(preset);
    assert.equal(resolved, item.expected, `${item.id} must resolve to ${item.expected} (got ${resolved})`);
    assert.notEqual(resolved, item.notExpected, `${item.id} must NEVER resolve to ${item.notExpected}`);
  }

  // Preset Invariant 1: 0 non-EV presets can EVER resolve to EV
  const falseEvs = VEHICLE_PRESETS.filter((p) => p.isEv === false && resolvePowertrainType(p) === 'EV');
  assert.equal(falseEvs.length, 0, `False EV count must be 0 (got: ${falseEvs.map((p) => p.id).join(', ')})`);

  // Preset Invariant 2: 0 non-PHEV presets can resolve to PHEV
  const falsePhevs = VEHICLE_PRESETS.filter((p) => {
    const f = (p.fuelType || '').toLowerCase();
    const isPhev = f === 'plug-in hybrid' || f.includes('plug-in') || p.powertrain === 'phev';
    return !isPhev && resolvePowertrainType(p) === 'PHEV';
  });
  assert.equal(falsePhevs.length, 0, `False PHEV count must be 0 (got: ${falsePhevs.map((p) => p.id).join(', ')})`);

  // Full Catalog Invariant: Test all catalog engines
  const allEngines = getAllEnginesFlat();
  assert.ok(allEngines.length >= 170, `Expected >= 170 catalog engines, got ${allEngines.length}`);

  let mismatches = 0;
  for (const engine of allEngines) {
    const resolved = resolvePowertrainType(engine);
    const fuel = (engine.fuelType || '').toLowerCase();
    let expected;
    if (fuel === 'electric') expected = 'EV';
    else if (fuel === 'diesel') expected = 'ICE_DIESEL';
    else if (fuel === 'gasoline') expected = 'ICE_PETROL';
    else if (fuel === 'hybrid') expected = 'HEV';
    else if (fuel.includes('plug-in')) expected = 'PHEV';

    if (expected && resolved !== expected) {
      mismatches++;
    }
  }
  assert.equal(mismatches, 0, `Catalog engine classifier mismatches must be 0 (got ${mismatches})`);
});

test('8. MaintenanceRiskMatrix EV Component Filtering & Isolation', () => {
  const evPreset = getPresetById('tesla-model-3-lr');
  assert.ok(evPreset, 'Tesla Model 3 preset must exist');

  // Filter components for EV
  const relevantComponents = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, evPreset);
  assert.equal(relevantComponents.length, 7, 'EV must have exactly 7 applicable components');

  // Assert 0 ICE components
  for (const comp of relevantComponents) {
    assert.equal(
      ICE_EXCLUSIVE_COMPONENT_IDS.has(comp.id),
      false,
      `EV relevant components must not contain ICE component: ${comp.id}`
    );
  }

  // Simulate MaintenanceRiskMatrix evaluation loop
  const pType = resolvePowertrainType(evPreset);
  const evaluatedComponents = relevantComponents
    .map((comp) => {
      const health = evaluateComponentHealth({
        component: comp,
        physicalOdometerMiles: 45000,
        urbanTripSharePct: 45,
        oilIntervalId: 'standard',
        serviceHistoryId: 'verified',
        transmissionId: evPreset.transmission || 'direct-drive',
        powertrainType: pType,
        vehicle: evPreset,
      });
      if (!health) return null;
      return { ...comp, health };
    })
    .filter(Boolean);

  assert.equal(evaluatedComponents.length, 7, 'All 7 EV components must evaluate with valid health on EV');
  for (const item of evaluatedComponents) {
    assert.ok(item.health.status, 'Component must have health status');
    assert.ok(typeof item.health.wearPctOfCritical === 'number', 'Wear pct must be numeric');
    assert.ok(typeof item.health.effectiveWearMiles === 'number', 'Effective wear miles must be numeric');
  }

  // Verify that passing an ICE component to evaluateComponentHealth for an EV returns null
  for (const iceId of ICE_EXCLUSIVE_COMPONENT_IDS) {
    const iceComp = MAINTENANCE_COMPONENTS.find((c) => c.id === iceId);
    if (iceComp) {
      const health = evaluateComponentHealth({
        component: iceComp,
        physicalOdometerMiles: 45000,
        powertrainType: pType,
        vehicle: evPreset,
      });
      assert.equal(health, null, `evaluateComponentHealth must reject ICE component ${iceId} for EV`);
    }
  }
});

test('9. EV Milestone Impact Badges & Component Wiring', () => {
  const milestonesFilePath = path.resolve('src/components/calculators/MaintenanceMilestones.jsx');
  const milestonesSource = fs.readFileSync(milestonesFilePath, 'utf-8');

  // Verify render loop uses EV_MILESTONE_IMPACT_MAP on line 500
  assert.ok(
    milestonesSource.includes('MILESTONE_IMPACT_MAP[it.id] || EV_MILESTONE_IMPACT_MAP[it.id]'),
    'MaintenanceMilestones.jsx render loop must include EV_MILESTONE_IMPACT_MAP[it.id]'
  );

  // Verify live risk deduction loop on line 332
  assert.ok(
    milestonesSource.includes('MILESTONE_IMPACT_MAP[itemId] || EV_MILESTONE_IMPACT_MAP[itemId]'),
    'MaintenanceMilestones.jsx calculation loop must include EV_MILESTONE_IMPACT_MAP[itemId]'
  );

  // Verify MaintenanceRiskMatrix.jsx uses EV_MILESTONE_IMPACT_MAP
  const riskMatrixPath = path.resolve('src/components/calculators/MaintenanceRiskMatrix.jsx');
  const riskMatrixSource = fs.readFileSync(riskMatrixPath, 'utf-8');
  assert.ok(
    riskMatrixSource.includes('MILESTONE_IMPACT_MAP[mId] || EV_MILESTONE_IMPACT_MAP[mId]'),
    'MaintenanceRiskMatrix.jsx must credit EV milestone items via EV_MILESTONE_IMPACT_MAP'
  );

  // Verify that all 24 EV milestone items have creditUsd > 0 and bonusPts > 0
  const evMilestones = getMilestonesForPowertrain('EV');
  const allEvItems = evMilestones.flatMap((m) => m.items);
  assert.equal(allEvItems.length, 24, 'EV milestones must contain 24 items');

  // Parse EV_MILESTONE_IMPACT_MAP from source
  const mapMatch = milestonesSource.match(/export const EV_MILESTONE_IMPACT_MAP = (\{[\s\S]*?\n\};)/);
  assert.ok(mapMatch, 'EV_MILESTONE_IMPACT_MAP must be exported in MaintenanceMilestones.jsx');
  const evImpactMap = eval('(' + mapMatch[1].replace(/;$/, '') + ')');

  for (const item of allEvItems) {
    const impact = evImpactMap[item.id];
    assert.ok(impact, `EV milestone item "${item.id}" must have impact entry`);
    assert.ok(impact.creditUsd > 0, `EV milestone item "${item.id}" creditUsd must be > 0 (got ${impact.creditUsd})`);
    assert.ok(impact.bonusPts > 0, `EV milestone item "${item.id}" bonusPts must be > 0 (got ${impact.bonusPts})`);
  }

  // Verify COMPONENT_MILESTONE_TRIGGERS in GarageContext.jsx maps all 7 EV components
  const garageContextPath = path.resolve('src/context/GarageContext.jsx');
  const garageContextSource = fs.readFileSync(garageContextPath, 'utf-8');
  const triggerMapMatch = garageContextSource.match(/export const COMPONENT_MILESTONE_TRIGGERS = (\{[\s\S]*?\n\};)/);
  assert.ok(triggerMapMatch, 'COMPONENT_MILESTONE_TRIGGERS must be exported in GarageContext.jsx');
  const triggerMap = eval('(' + triggerMapMatch[1].replace(/;$/, '') + ')');
  const evComponentIds = [
    'ev-battery-soh',
    'ev-obc-iccu',
    'ev-thermal-heatpump',
    'ev-reduction-gear',
    'ev-curb-suspension',
    'ev-torque-tires',
    'ev-regen-brake-corrosion',
  ];
  for (const compId of evComponentIds) {
    assert.ok(Array.isArray(triggerMap[compId]) && triggerMap[compId].length > 0, `COMPONENT_MILESTONE_TRIGGERS must map "${compId}"`);
  }
});

test('10. Zero-Tariff Energy Calculation & Battery Degradation Warranty Status Boundary', () => {
  // 1. Free home solar charging ($0.00/kWh) and $0.00 DC fast charging
  const freeEv = calculateEvEnergyCost({
    annualDistanceMiles: 15000,
    efficiencyKwh100Mi: 25.0,
    homeChargePct: 100,
    homeTariffUsdPerKwh: 0,
    dcFastTariffUsdPerKwh: 0,
  });
  assert.equal(freeEv.annualCostUsd, 0.00, 'Free solar charging must produce $0.00 annual cost');
  assert.equal(freeEv.blendedTariffUsdPerKwh, 0.0000, 'Free solar charging must produce $0.0000 blended tariff');
  assert.equal(freeEv.costPerMileUsd, 0, 'Cost per mile must be $0');
  assert.equal(freeEv.homeCostUsd, 0.00);
  assert.equal(freeEv.dcFastCostUsd, 0.00);

  // Mixed 80% free home solar ($0.00) / 20% paid DC fast ($0.45)
  const mixedSolar = calculateEvEnergyCost({
    annualDistanceMiles: 10000,
    efficiencyKwh100Mi: 30.0,
    homeChargePct: 80,
    homeTariffUsdPerKwh: 0,
    dcFastTariffUsdPerKwh: 0.45,
  });
  // 3000 kWh total; 2400 kWh home @ $0 = $0; 600 kWh DC @ $0.45 = $270
  assert.equal(mixedSolar.homeCostUsd, 0.00);
  assert.equal(mixedSolar.dcFastCostUsd, 270.00);
  assert.equal(mixedSolar.annualCostUsd, 270.00);

  // PHEV with free electric charging ($0.00/kWh)
  const freePhev = calculatePhevEnergyCost({
    annualDistanceMiles: 10000,
    electricSharePct: 60,
    evEfficiencyKwh100Mi: 25.0,
    iceMpg: 35.0,
    homeChargePct: 100,
    homeTariffUsdPerKwh: 0,
    dcFastTariffUsdPerKwh: 0,
    fuelPriceUsdPerGal: 4.00,
  });
  assert.equal(freePhev.electricCostUsd, 0.00, 'Free PHEV electric mode must cost $0.00');
  assert.ok(freePhev.iceCostUsd > 0, 'PHEV ICE mode must cost > $0');
  assert.equal(freePhev.totalAnnualCostUsd, freePhev.iceCostUsd, 'Total annual cost must equal ICE cost when electric is free');

  // 2. Battery Degradation Warranty Status Boundary:
  // LFP Battery with extreme degradation below 70% within warranty (< 70% SoH, <= 8 yrs, <= 100,000 mi)
  // Simulated via anomalous cell defect loss (25%) on a 4-year, 40,000-mile vehicle:
  const abnormalLfp = calculateBatterySoh({
    chemistry: 'LFP',
    odometerMiles: 40000,
    ageYears: 4,
    dcFastChargingSharePct: 20,
    nominalCapacityKwh: 60,
    cellDefectLossPct: 25,
  });
  assert.strictEqual(abnormalLfp.warrantyStatus, 'WARRANTY_CLAIM_ELIGIBLE');
  assert.ok(abnormalLfp.sohPct < 70.0, `SoH must drop below 70.0% for warranty claim, got ${abnormalLfp.sohPct}%`);
  assert.strictEqual(abnormalLfp.chemistry, 'LFP');

  // Out-of-warranty degraded battery with cell defect (> 8 yrs or > 100,000 mi):
  const outOfWarrantyLfp = calculateBatterySoh({
    chemistry: 'LFP',
    odometerMiles: 120000,
    ageYears: 10,
    dcFastChargingSharePct: 20,
    nominalCapacityKwh: 60,
    cellDefectLossPct: 25,
  });
  assert.strictEqual(outOfWarrantyLfp.warrantyStatus, 'OUT_OF_WARRANTY_DEGRADED');
  assert.ok(outOfWarrantyLfp.sohPct < 70.0, `Out of warranty SoH must drop below 70.0%, got ${outOfWarrantyLfp.sohPct}%`);

  // Verify healthy status (SoH >= 80%):
  const healthy = calculateBatterySoh({ chemistry: 'LFP', odometerMiles: 20000, ageYears: 1 });
  assert.equal(healthy.warrantyStatus, 'HEALTHY');
  assert.ok(healthy.sohPct >= 80.0);

  // Verify degraded status (70% <= SoH < 80%):
  const degraded = calculateBatterySoh({ chemistry: 'NMC', odometerMiles: 95000, ageYears: 7, dcFastChargingSharePct: 100 });
  assert.equal(degraded.warrantyStatus, 'DEGRADED');
  assert.ok(degraded.sohPct < 80.0 && degraded.sohPct >= 70.0);
});

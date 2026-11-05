/**
 * Empirical Challenger 2 Test Harness for Milestone 1
 * Mathematical model stress-testing of src/data/powertrainTypes.js
 */

import {
  calculateBatterySoh,
  calculateEvEnergyCost,
  calculatePhevEnergyCost,
  calculateVehicleEnergyCost,
  convertKwh100MiToKwh100Km,
  convertKwh100KmToKwh100Mi,
  convertKwh100MiToMiPerKwh,
  convertMiPerKwhToKwh100Mi,
  POWERTRAIN_TYPES,
  resolvePowertrainType,
  isPureElectric,
} from '../src/data/powertrainTypes.js';

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    console.error(`  FAIL: ${message}`);
  }
}

function assertClose(actual, expected, tolerance = 0.05, message = '') {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    passed++;
  } else {
    failed++;
    const fullMsg = `${message} — Expected ~${expected}, got ${actual} (diff: ${diff.toFixed(4)})`;
    failures.push(fullMsg);
    console.error(`  FAIL: ${fullMsg}`);
  }
}

console.log('================================================================');
console.log('CHALLENGER 2: EMPIRICAL MATHEMATICAL AUDIT FOR MILESTONE 1');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// SECTION 1: BATTERY DEGRADATION CURVE (calculateBatterySoh)
// -----------------------------------------------------------------------------
console.log('--- 1. Testing Battery Degradation Curve Across Mileage & Age ---');

const testCases = [
  { miles: 0, age: 1, desc: 'Brand new showroom baseline (0 mi, 1 yr)' },
  { miles: 50000, age: 3, desc: '3-year lease return (50,000 mi, 3 yr)' },
  { miles: 100000, age: 6, desc: '6-year high mileage (100,000 mi, 6 yr)' },
  { miles: 200000, age: 10, desc: '10-year veteran (200,000 mi, 10 yr)' },
  { miles: 500000, age: 15, desc: '500k extreme duty fleet (500,000 mi, 15 yr)' },
  { miles: 1000000, age: 25, desc: '1M hyper-mileage ceiling (1,000,000 mi, 25 yr)' },
];

for (const tc of testCases) {
  const lfp = calculateBatterySoh({ chemistry: 'LFP', odometerMiles: tc.miles, ageYears: tc.age, dcFastChargingSharePct: 20 });
  const nmc = calculateBatterySoh({ chemistry: 'NMC', odometerMiles: tc.miles, ageYears: tc.age, dcFastChargingSharePct: 20 });

  console.log(`[${tc.desc}]`);
  console.log(`  LFP: SoH=${lfp.sohPct}%, Rem=${lfp.remainingCapacityKwh}kWh, Loss=${lfp.capacityLossPct}%, Status=${lfp.warrantyStatus}`);
  console.log(`  NMC: SoH=${nmc.sohPct}%, Rem=${nmc.remainingCapacityKwh}kWh, Loss=${nmc.capacityLossPct}%, Status=${nmc.warrantyStatus}`);

  // Invariant 1: LFP degrades slower than or equal to NMC
  assert(lfp.sohPct >= nmc.sohPct, `${tc.desc}: LFP SoH (${lfp.sohPct}%) must be >= NMC SoH (${nmc.sohPct}%)`);

  // Invariant 2: Capacity loss + SoH == 100.0%
  assertClose(lfp.sohPct + lfp.capacityLossPct, 100.0, 0.1, `${tc.desc}: LFP SoH + loss sum`);
  assertClose(nmc.sohPct + nmc.capacityLossPct, 100.0, 0.1, `${tc.desc}: NMC SoH + loss sum`);

  // Invariant 3: Floors are strictly respected
  assert(lfp.sohPct >= 70.0, `${tc.desc}: LFP SoH (${lfp.sohPct}%) must not drop below 70.0% floor`);
  assert(nmc.sohPct >= 65.0, `${tc.desc}: NMC SoH (${nmc.sohPct}%) must not drop below 65.0% floor`);

  // Invariant 4: Cycle count equals round(miles / 250)
  assert(lfp.cycleEquivalentCount === Math.round(tc.miles / 250), `${tc.desc}: Cycle count`);
}

// -----------------------------------------------------------------------------
// SECTION 2: DC FAST CHARGING SENSITIVITY & MONOTONICITY
// -----------------------------------------------------------------------------
console.log('\n--- 2. Testing DC Fast Charging Penalty & Monotonicity ---');

let prevLfpSoh = 100;
let prevNmcSoh = 100;

for (let dc = 0; dc <= 100; dc += 10) {
  const lfp = calculateBatterySoh({ chemistry: 'LFP', odometerMiles: 60000, ageYears: 4, dcFastChargingSharePct: dc });
  const nmc = calculateBatterySoh({ chemistry: 'NMC', odometerMiles: 60000, ageYears: 4, dcFastChargingSharePct: dc });

  assert(lfp.sohPct <= prevLfpSoh + 0.001, `LFP SoH must decrease monotonically with DC charging (dc=${dc}%)`);
  assert(nmc.sohPct <= prevNmcSoh + 0.001, `NMC SoH must decrease monotonically with DC charging (dc=${dc}%)`);

  prevLfpSoh = lfp.sohPct;
  prevNmcSoh = nmc.sohPct;
}

const lfp0 = calculateBatterySoh({ chemistry: 'LFP', odometerMiles: 50000, ageYears: 3, dcFastChargingSharePct: 0 });
const lfp100 = calculateBatterySoh({ chemistry: 'LFP', odometerMiles: 50000, ageYears: 3, dcFastChargingSharePct: 100 });
const nmc0 = calculateBatterySoh({ chemistry: 'NMC', odometerMiles: 50000, ageYears: 3, dcFastChargingSharePct: 0 });
const nmc100 = calculateBatterySoh({ chemistry: 'NMC', odometerMiles: 50000, ageYears: 3, dcFastChargingSharePct: 100 });

const lfpPenalty = +(lfp0.sohPct - lfp100.sohPct).toFixed(1);
const nmcPenalty = +(nmc0.sohPct - nmc100.sohPct).toFixed(1);

console.log(`  Max DC fast charging penalty (0% -> 100% DC):`);
console.log(`  LFP Penalty: ${lfpPenalty}% (Model theoretical: 1.5%)`);
console.log(`  NMC Penalty: ${nmcPenalty}% (Model theoretical: 3.5%)`);
assertClose(lfpPenalty, 1.5, 0.1, 'LFP DC penalty at 100% DC');
assertClose(nmcPenalty, 3.5, 0.1, 'NMC DC penalty at 100% DC');
assert(nmcPenalty > lfpPenalty, 'NMC penalty must exceed LFP penalty');

// Clamping of DC% bounds
const negDc = calculateBatterySoh({ dcFastChargingSharePct: -30 });
const zeroDc = calculateBatterySoh({ dcFastChargingSharePct: 0 });
const overDc = calculateBatterySoh({ dcFastChargingSharePct: 140 });
const maxDc = calculateBatterySoh({ dcFastChargingSharePct: 100 });
assert(negDc.sohPct === zeroDc.sohPct, 'Negative DC% clamped to 0%');
assert(overDc.sohPct === maxDc.sohPct, 'Over-100 DC% clamped to 100%');

// -----------------------------------------------------------------------------
// SECTION 3: BOUNDARY CONDITIONS & INVALID INPUT RESILIENCE
// -----------------------------------------------------------------------------
console.log('\n--- 3. Testing Boundary Conditions & Resilience ---');

// Negative miles
const negMiles = calculateBatterySoh({ odometerMiles: -100000 });
assert(negMiles.sohPct === calculateBatterySoh({ odometerMiles: 0 }).sohPct, 'Negative miles clamped to 0');
assert(negMiles.cycleEquivalentCount === 0, 'Negative miles cycle count is 0');

// Negative years
const negYears = calculateBatterySoh({ ageYears: -10 });
assert(negYears.sohPct === calculateBatterySoh({ ageYears: 0 }).sohPct, 'Negative years clamped to 0');

// Extreme years
const extYears = calculateBatterySoh({ ageYears: 200 });
assert(extYears.sohPct === 65.0, '200 years NMC clamped to floor 65.0%');

// Chemistry fallback
const weirdChems = [null, undefined, '', 'SODIUM_ION', 'UNKNOWN', 999, {}, []];
for (const wc of weirdChems) {
  const res = calculateBatterySoh({ chemistry: wc });
  assert(res.chemistry === 'NMC', `Chemistry ${JSON.stringify(wc)} safely falls back to NMC`);
}

// Case insensitivity
assert(calculateBatterySoh({ chemistry: 'lfp' }).chemistry === 'LFP', 'lowercase lfp');
assert(calculateBatterySoh({ chemistry: ' Lfp ' }).chemistry === 'LFP', 'padded Lfp');

// Nominal capacity boundaries
const zeroCap = calculateBatterySoh({ nominalCapacityKwh: 0 });
assert(zeroCap.remainingCapacityKwh > 0, 'Zero nominal capacity clamped/defaulted to positive');
const negCap = calculateBatterySoh({ nominalCapacityKwh: -20 });
assert(negCap.remainingCapacityKwh > 0, 'Negative nominal capacity clamped to positive');

// -----------------------------------------------------------------------------
// SECTION 4: EV ENERGY CONSUMPTION & TARIFF SPLIT (calculateEvEnergyCost)
// -----------------------------------------------------------------------------
console.log('\n--- 4. Testing EV Energy Cost Formulas & Tariff Split ---');

// Baseline: 12000 mi, 28 kWh/100mi, 80% home @ $0.14, 20% DC @ $0.48
const evBase = calculateEvEnergyCost({
  annualDistanceMiles: 12000,
  efficiencyKwh100Mi: 28.0,
  homeChargePct: 80,
  homeTariffUsdPerKwh: 0.14,
  dcFastTariffUsdPerKwh: 0.48,
});
console.log('  EV Baseline (12k mi, 28 kWh/100mi, 80/20 split @ $0.14/$0.48):');
console.log(`  Annual kWh: ${evBase.annualKwh} (Expected: 3360)`);
console.log(`  Blended Tariff: $${evBase.blendedTariffUsdPerKwh} / kWh (Expected: $0.2080)`);
console.log(`  Home Cost: $${evBase.homeCostUsd} (Expected: $376.32)`);
console.log(`  DC Fast Cost: $${evBase.dcFastCostUsd} (Expected: $322.56)`);
console.log(`  Total Annual Cost: $${evBase.annualCostUsd} (Expected: $698.88)`);
console.log(`  Cost Per Mile: $${evBase.costPerMileUsd} / mi`);

assertClose(evBase.annualKwh, 3360, 0.1, 'Annual kWh calculation');
assertClose(evBase.blendedTariffUsdPerKwh, 0.208, 0.0001, 'Blended tariff calculation');
assertClose(evBase.homeCostUsd, 376.32, 0.1, 'Home cost USD');
assertClose(evBase.dcFastCostUsd, 322.56, 0.1, 'DC fast cost USD');
assertClose(evBase.annualCostUsd, 698.88, 0.1, 'Total EV annual cost USD');
assertClose(evBase.costPerMileUsd, 698.88 / 12000, 0.0001, 'Cost per mile USD');

// Split variation: 100% Home vs 100% DC Fast
const ev100Home = calculateEvEnergyCost({ annualDistanceMiles: 10000, efficiencyKwh100Mi: 30, homeChargePct: 100, homeTariffUsdPerKwh: 0.15, dcFastTariffUsdPerKwh: 0.50 });
assertClose(ev100Home.annualCostUsd, (10000 / 100) * 30 * 0.15, 0.1, '100% Home charging cost');
assertClose(ev100Home.dcFastCostUsd, 0, 0.01, '100% Home has 0 DC cost');

const ev100Dc = calculateEvEnergyCost({ annualDistanceMiles: 10000, efficiencyKwh100Mi: 30, homeChargePct: 0, homeTariffUsdPerKwh: 0.15, dcFastTariffUsdPerKwh: 0.50 });
assertClose(ev100Dc.annualCostUsd, (10000 / 100) * 30 * 0.50, 0.1, '100% DC charging cost');
assertClose(ev100Dc.homeCostUsd, 0, 0.01, '100% DC has 0 Home cost');

// Metric / Imperial unit converters
assertClose(convertKwh100MiToKwh100Km(28.0), 17.40, 0.05, '28 kWh/100mi -> 17.4 kWh/100km');
assertClose(convertKwh100KmToKwh100Mi(17.4), 28.00, 0.05, '17.4 kWh/100km -> 28 kWh/100mi');
assertClose(convertKwh100MiToMiPerKwh(25.0), 4.00, 0.01, '25 kWh/100mi -> 4.0 mi/kWh');
assertClose(convertMiPerKwhToKwh100Mi(4.0), 25.00, 0.01, '4.0 mi/kWh -> 25 kWh/100mi');

// Distance 0 handling
const evZeroMi = calculateEvEnergyCost({ annualDistanceMiles: 0 });
assert(evZeroMi.annualCostUsd === 0, 'Zero miles = 0 cost');
assert(evZeroMi.costPerMileUsd === 0, 'Zero miles = 0 costPerMile (no NaN)');

// AUDIT OF ZERO TARIFF HANDLING
console.log('\n--- 5. Adversarial Audit of Zero-Tariff Edge Cases ($0.00 / kWh) ---');
const zeroTariffEv = calculateEvEnergyCost({
  annualDistanceMiles: 10000,
  efficiencyKwh100Mi: 30,
  homeChargePct: 100,
  homeTariffUsdPerKwh: 0,
  dcFastTariffUsdPerKwh: 0,
});
console.log(`  Passed homeTariffUsdPerKwh = $0.00 (e.g. Free Home Solar Charging):`);
console.log(`  Actual annualCostUsd: $${zeroTariffEv.annualCostUsd}`);
console.log(`  Actual blendedTariffUsdPerKwh: $${zeroTariffEv.blendedTariffUsdPerKwh}`);
const zeroTariffBugFound = zeroTariffEv.annualCostUsd !== 0;
if (zeroTariffBugFound) {
  console.log('  ⚠️ FLAW CONFIRMED: 0 was coerced by || operator to default $0.14 tariff!');
}

// -----------------------------------------------------------------------------
// SECTION 6: PHEV COMBINED ENERGY CALCULATION (calculatePhevEnergyCost)
// -----------------------------------------------------------------------------
console.log('\n--- 6. Testing PHEV Combined Energy Calculations ---');

const phevBase = calculatePhevEnergyCost({
  annualDistanceMiles: 12000,
  electricSharePct: 55,
  evEfficiencyKwh100Mi: 28.0,
  iceMpg: 34.0,
  homeChargePct: 80,
  homeTariffUsdPerKwh: 0.14,
  dcFastTariffUsdPerKwh: 0.48,
  fuelPriceUsdPerGal: 3.85,
});

console.log('  PHEV Baseline (12k mi, 55% electric @ 28 kWh/100mi, 45% ICE @ 34 MPG):');
console.log(`  Electric Miles: ${phevBase.electricMiles} (Expected: 6600)`);
console.log(`  ICE Miles: ${phevBase.iceMiles} (Expected: 5400)`);
console.log(`  Electric Cost: $${phevBase.electricCostUsd}`);
console.log(`  ICE Gallons: ${phevBase.iceGallons} gal (Expected: ~158.82 gal)`);
console.log(`  ICE Cost: $${phevBase.iceCostUsd} (Expected: ~158.82 * $3.85 = $611.46)`);
console.log(`  Total Annual Cost: $${phevBase.totalAnnualCostUsd}`);
console.log(`  Cost Per Mile: $${phevBase.costPerMileUsd} / mi`);

assert(phevBase.electricMiles === 6600, 'PHEV electric miles split');
assert(phevBase.iceMiles === 5400, 'PHEV ICE miles split');
assertClose(phevBase.iceGallons, 5400 / 34, 0.1, 'PHEV ICE fuel gallons');
assertClose(phevBase.iceCostUsd, (5400 / 34) * 3.85, 0.5, 'PHEV ICE fuel cost');
assertClose(phevBase.totalAnnualCostUsd, phevBase.electricCostUsd + phevBase.iceCostUsd, 0.05, 'PHEV total sum');

// PHEV 0% and 100% electric extremes
const phevPureElec = calculatePhevEnergyCost({ annualDistanceMiles: 12000, electricSharePct: 100 });
assert(phevPureElec.iceMiles === 0, '100% electric PHEV has 0 ICE miles');
assert(phevPureElec.iceCostUsd === 0, '100% electric PHEV has 0 ICE cost');

const phevPureGas = calculatePhevEnergyCost({ annualDistanceMiles: 12000, electricSharePct: 0 });
assert(phevPureGas.electricMiles === 0, '0% electric PHEV has 0 electric miles');
assert(phevPureGas.electricCostUsd === 0, '0% electric PHEV has 0 electric cost');

// Zero fuel price in PHEV audit
const zeroFuelPhev = calculatePhevEnergyCost({ annualDistanceMiles: 10000, electricSharePct: 0, fuelPriceUsdPerGal: 0 });
console.log(`  Passed fuelPriceUsdPerGal = $0.00: Actual iceCostUsd = $${zeroFuelPhev.iceCostUsd}`);
const zeroFuelBugFound = zeroFuelPhev.iceCostUsd !== 0;
if (zeroFuelBugFound) {
  console.log('  ⚠️ FLAW CONFIRMED: 0 was coerced by || operator to default $3.85 fuel price!');
}

// -----------------------------------------------------------------------------
// SECTION 7: SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TEST RESULTS: ${passed} assertions passed, ${failed} assertions failed.`);
if (failures.length > 0) {
  console.log('Failures:');
  failures.forEach(f => console.log(`  - ${f}`));
}
console.log('================================================================');

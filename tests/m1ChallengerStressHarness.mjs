import assert from 'node:assert/strict';
import {
  calculateMaintenanceReserve,
  calculateDynamicMaintenance,
  calculateTcoProjection,
  MAINTENANCE_COMPONENTS,
  evaluateComponentHealth,
  REVISION_THRESHOLDS,
  POWERTRAIN_TYPES,
} from '../src/data/maintenanceData.js';
import {
  calculateNonLinearDepreciation,
  getFactoryRetention,
  parseSanitizedNumber,
  parseNonNegativeNumber,
  calculateBatterySoh,
  POWERTRAIN_DEFAULT_RESIDUAL_CURVES,
  DEFAULT_RESIDUAL_CURVE_10YR,
} from '../src/data/powertrainTypes.js';

console.log('=== Milestone 1 Challenger 2 Deep Empirical Stress Harness ===\n');

// ============================================================================
// SUITE 1: MAINTENANCE RESERVE CROSS-COHERENCE (calculateMaintenanceReserve)
// ============================================================================
console.log('--- Suite 1: Maintenance Reserve Cross-Coherence ---');

// 1.1 Test with variety of evaluated components: brakes, tires, battery, suspension, cooling, etc.
const componentTypes = [
  'timing-assembly',
  'suspension-brakes-chassis',
  'hv-battery-thermal-loop',
  'ev-battery-soh',
  'ev-curb-suspension',
  'ev-torque-tires',
  'ev-regen-brake-corrosion',
  'ev-thermal-heatpump',
  'drivetrain-dmf-dsg',
  'hpfp-turbo-vnt',
];

const foundComps = MAINTENANCE_COMPONENTS.filter((c) => componentTypes.includes(c.id));
assert.ok(foundComps.length >= 6, `Expected at least 6 diverse components, found ${foundComps.length}`);

// Test with empty array and nullish/invalid inputs
assert.equal(calculateMaintenanceReserve(), 0, 'Omitted args must return 0');
assert.equal(calculateMaintenanceReserve({}), 0, 'Empty object must return 0');
assert.equal(calculateMaintenanceReserve({ evaluatedComponents: [] }), 0, 'Empty array must return 0');
assert.equal(calculateMaintenanceReserve({ evaluatedComponents: null }), 0, 'Null components must return 0');
assert.equal(calculateMaintenanceReserve({ evaluatedComponents: [null, undefined, {}] }), 0, 'Invalid elements must be skipped');

// 1.2 Test Workshop Tier Scaling (Independent vs Dealership vs Omitted vs Invalid)
const sampleEvaluated = foundComps.map((c) => ({
  ...c,
  health: {
    status: 'WARNING',
    effectiveWearMiles: 45000,
    combinedMultiplier: 1.0,
  },
}));

const reserveIndie = calculateMaintenanceReserve({
  evaluatedComponents: sampleEvaluated,
  workshopTier: 'independent',
  annualDistanceMiles: 12000,
});
const reserveDealer = calculateMaintenanceReserve({
  evaluatedComponents: sampleEvaluated,
  workshopTier: 'dealership',
  annualDistanceMiles: 12000,
});
const reserveOmittedTier = calculateMaintenanceReserve({
  evaluatedComponents: sampleEvaluated,
  annualDistanceMiles: 12000,
});
const reserveFranchiseTier = calculateMaintenanceReserve({
  evaluatedComponents: sampleEvaluated,
  workshopTier: 'franchise',
  annualDistanceMiles: 12000,
});

assert.ok(reserveDealer > reserveIndie, `Dealer reserve (${reserveDealer}) must be higher than indie (${reserveIndie})`);
assert.equal(reserveOmittedTier, reserveIndie, 'Omitted workshop tier must default to independent');
// In this codebase, unknown tier fallback routes to independent
assert.equal(reserveFranchiseTier, reserveIndie, 'Unknown tier (franchise) routes safely to independent');

console.log(`✓ Workshop Tier Scaling: Indie=$${reserveIndie}, Dealer=$${reserveDealer}, Default=$${reserveOmittedTier}`);

// 1.3 Annual Distance Scaling (low 5k, normal 12k, high 30k) & Clamping
const reserve5k = calculateMaintenanceReserve({
  evaluatedComponents: sampleEvaluated,
  workshopTier: 'independent',
  annualDistanceMiles: 5000,
});
const reserve12k = calculateMaintenanceReserve({
  evaluatedComponents: sampleEvaluated,
  workshopTier: 'independent',
  annualDistanceMiles: 12000,
});
const reserve30k = calculateMaintenanceReserve({
  evaluatedComponents: sampleEvaluated,
  workshopTier: 'independent',
  annualDistanceMiles: 30000,
});
const reserveUltraLow = calculateMaintenanceReserve({
  evaluatedComponents: sampleEvaluated,
  workshopTier: 'independent',
  annualDistanceMiles: 100, // Clamped to 500 mi => 500/12000 = 0.0416, then clamped to min 0.25x
});
const reserveUltraHigh = calculateMaintenanceReserve({
  evaluatedComponents: sampleEvaluated,
  workshopTier: 'independent',
  annualDistanceMiles: 50000, // 50000/12000 = 4.16x, clamped to max 2.5x
});

assert.ok(reserve5k < reserve12k, `5k reserve ($${reserve5k}) must be less than 12k ($${reserve12k})`);
assert.ok(reserve12k < reserve30k, `12k reserve ($${reserve12k}) must be less than 30k ($${reserve30k})`);

// 5k scaling: 5000/12000 = 0.416667x
const expectedRatio5k = 5000 / 12000;
const actualRatio5k = reserve5k / reserve12k;
assert.ok(Math.abs(actualRatio5k - expectedRatio5k) < 0.01, `5k scale ratio ~${actualRatio5k} should match ${expectedRatio5k}`);

// 30k scaling: 30000/12000 = 2.5x cap. Since capped at 2.5x, 50k should match 30k (or per-item 1.25x avgCost cap)
assert.equal(reserveUltraHigh, reserve30k, `50k reserve ($${reserveUltraHigh}) must match 30k cap ($${reserve30k})`);

// Ultra low scaling: 0.25x floor
const expectedRatioUltraLow = 0.25;
const actualRatioUltraLow = reserveUltraLow / reserve12k;
assert.ok(Math.abs(actualRatioUltraLow - expectedRatioUltraLow) < 0.01, `Ultra low scale ratio ~${actualRatioUltraLow} should match 0.25`);

console.log(`✓ Annual Distance Scaling: 5k=$${reserve5k}, 12k=$${reserve12k}, 30k=$${reserve30k}, MinFloor=$${reserveUltraLow}, MaxCap=$${reserveUltraHigh}`);

// 1.4 Wear Threshold Logic & Health Allocation Multipliers
// CRITICAL: 75%
// WARNING: 35%
// OPTIMAL (projected wear >= 72% of service interval): 22%
// OPTIMAL (projected wear < 72% of service interval): 10%
const testComp = {
  id: 'test-item',
  costsUsd: {
    independent: [1000, 1000], // avgCost = 1000
    dealership: [1600, 1600],
  },
  serviceIntervalMiles: 100000,
};

// Case A: CRITICAL status
const rCritical = calculateMaintenanceReserve({
  evaluatedComponents: [{ ...testComp, health: { status: 'CRITICAL' } }],
  workshopTier: 'independent',
  annualDistanceMiles: 12000, // scale = 1.0
});
assert.equal(rCritical, 750, 'CRITICAL should allocate exactly 75% of avgCost ($750)');

// Case B: WARNING status
const rWarning = calculateMaintenanceReserve({
  evaluatedComponents: [{ ...testComp, health: { status: 'WARNING' } }],
  workshopTier: 'independent',
  annualDistanceMiles: 12000,
});
assert.equal(rWarning, 350, 'WARNING should allocate exactly 35% of avgCost ($350)');

// Case C: OPTIMAL status with projected wear >= 72% (72,000 miles)
// effectiveWear = 65,000 + 12,000 * 1.0 = 77,000 miles >= 72,000 (72% of 100,000)
const rOptimalNearThreshold = calculateMaintenanceReserve({
  evaluatedComponents: [
    {
      ...testComp,
      health: {
        status: 'OPTIMAL',
        effectiveWearMiles: 65000,
        combinedMultiplier: 1.0,
      },
    },
  ],
  workshopTier: 'independent',
  annualDistanceMiles: 12000,
});
assert.equal(rOptimalNearThreshold, 220, 'OPTIMAL crossing 72% threshold should allocate 22% of avgCost ($220)');

// Case D: OPTIMAL status with projected wear < 72% (72,000 miles)
// effectiveWear = 20,000 + 12,000 * 1.0 = 32,000 miles < 72,000
const rOptimalLowWear = calculateMaintenanceReserve({
  evaluatedComponents: [
    {
      ...testComp,
      health: {
        status: 'OPTIMAL',
        effectiveWearMiles: 20000,
        combinedMultiplier: 1.0,
      },
    },
  ],
  workshopTier: 'independent',
  annualDistanceMiles: 12000,
});
assert.equal(rOptimalLowWear, 100, 'OPTIMAL under 72% threshold should allocate 10% of avgCost ($100)');

// Case E: Per-item reserve cap at 1.25x avgCost ($1,250)
const rCriticalHighMileage = calculateMaintenanceReserve({
  evaluatedComponents: [{ ...testComp, health: { status: 'CRITICAL' } }],
  workshopTier: 'independent',
  annualDistanceMiles: 30000, // scale = 2.5 => 750 * 2.5 = 1875, capped at 1.25 * 1000 = 1250
});
assert.equal(rCriticalHighMileage, 1250, 'Per-item reserve must cap at 1.25x avgCost ($1,250)');

console.log('✓ Wear Threshold & Allocation Logic: CRITICAL=75%, WARNING=35%, OPTIMAL>=72%=22%, OPTIMAL<72%=10%, Cap=125%');

// ============================================================================
// SUITE 2: POWERTRAIN BASE FACTOR COHERENCE (calculateDynamicMaintenance)
// ============================================================================
console.log('\n--- Suite 2: Powertrain Base Factor Coherence ---');

// 2.1 Verify EV uses factor 1.0 (no double discount on EV maintenance)
const evMaint = calculateDynamicMaintenance({
  baseAnnualMaintenanceUsd: 420,
  odometerMiles: 0,
  annualDistanceMiles: 12000,
  powertrainType: 'EV',
  maintenanceWearFactor: 1.0,
  ownershipYear: 1,
});
assert.equal(evMaint.routineMaintenanceUsd, 420, 'EV routine maintenance must equal baseAnnualMaintenance ($420), not 0.65x ($273)');

// 2.2 Compare EV maintenance output against gas/hybrid baselines
// With identical base inputs, routine maintenance should be identical
const iceMaintSameBase = calculateDynamicMaintenance({
  baseAnnualMaintenanceUsd: 420,
  odometerMiles: 0,
  annualDistanceMiles: 12000,
  powertrainType: 'ICE_PETROL',
  maintenanceWearFactor: 1.0,
  ownershipYear: 1,
});
assert.equal(evMaint.routineMaintenanceUsd, iceMaintSameBase.routineMaintenanceUsd, 'With identical base, EV and ICE routine maintenance must match');

// With realistic archetype baselines: EV ($400) vs Hybrid ($650) vs Gas ($850) vs Diesel ($920)
const evArchetypeMaint = calculateDynamicMaintenance({
  baseAnnualMaintenanceUsd: 400,
  odometerMiles: 0,
  annualDistanceMiles: 12000,
  powertrainType: 'EV',
  ownershipYear: 1,
});
const hevArchetypeMaint = calculateDynamicMaintenance({
  baseAnnualMaintenanceUsd: 650,
  odometerMiles: 0,
  annualDistanceMiles: 12000,
  powertrainType: 'HEV',
  ownershipYear: 1,
});
const iceArchetypeMaint = calculateDynamicMaintenance({
  baseAnnualMaintenanceUsd: 850,
  odometerMiles: 0,
  annualDistanceMiles: 12000,
  powertrainType: 'ICE_PETROL',
  ownershipYear: 1,
});
const dieselArchetypeMaint = calculateDynamicMaintenance({
  baseAnnualMaintenanceUsd: 920,
  odometerMiles: 0,
  annualDistanceMiles: 12000,
  powertrainType: 'ICE_DIESEL',
  ownershipYear: 1,
});

assert.ok(evArchetypeMaint.routineMaintenanceUsd < hevArchetypeMaint.routineMaintenanceUsd);
assert.ok(hevArchetypeMaint.routineMaintenanceUsd < iceArchetypeMaint.routineMaintenanceUsd);
assert.ok(iceArchetypeMaint.routineMaintenanceUsd < dieselArchetypeMaint.routineMaintenanceUsd);

console.log(`✓ Archetype Routine Maintenance Hierarchy: EV=$${evArchetypeMaint.routineMaintenanceUsd} < HEV=$${hevArchetypeMaint.routineMaintenanceUsd} < ICE=$${iceArchetypeMaint.routineMaintenanceUsd} < Diesel=$${dieselArchetypeMaint.routineMaintenanceUsd}`);

// 2.3 Verify Wear Escalation and Revision Milestones over multi-year horizon
// Year 1 (0-12k mi), Year 4 (36-48k mi crosses 60,000 km / 37,282 mi threshold)
const yr4EvMaint = calculateDynamicMaintenance({
  baseAnnualMaintenanceUsd: 400,
  odometerMiles: 0,
  annualDistanceMiles: 12000,
  powertrainType: 'EV',
  ownershipYear: 4,
});
assert.ok(yr4EvMaint.wearEscalation > 1.0, `Wear escalation (${yr4EvMaint.wearEscalation}) must increase above 1.0 at 48k mi`);
assert.equal(yr4EvMaint.revisionSurchargeUsd, 160, 'Year 4 EV must incur 60k km surcharge of $160');

const yr4IceMaint = calculateDynamicMaintenance({
  baseAnnualMaintenanceUsd: 850,
  odometerMiles: 0,
  annualDistanceMiles: 12000,
  powertrainType: 'ICE_PETROL',
  ownershipYear: 4,
});
assert.equal(yr4IceMaint.revisionSurchargeUsd, 420, 'Year 4 ICE must incur 60k km surcharge of $420');

console.log(`✓ Multi-Year Dynamic Escalation & Surcharges: Year 4 EV total=$${yr4EvMaint.yearMaintenanceUsd} (surcharge $160), ICE total=$${yr4IceMaint.yearMaintenanceUsd} (surcharge $420)`);

// ============================================================================
// SUITE 3: TCO PROJECTION COHERENCE & PROFILES (calculateTcoProjection)
// ============================================================================
console.log('\n--- Suite 3: TCO Projection Coherence across Profiles ---');

// 3.1 Test all 5 Powertrain Profiles under identical financial constraints
const powertrains = ['EV', 'PHEV', 'HEV', 'ICE_PETROL', 'ICE_DIESEL'];
const profiles = {};

for (const pt of powertrains) {
  profiles[pt] = calculateTcoProjection({
    purchasePriceUsd: 45000,
    odometerMiles: 0,
    annualDistanceMiles: 12000,
    powertrainType: pt,
    downPaymentPct: 15,
    aprPct: 5.5,
    loanTermMonths: 60,
    horizonYears: 5,
  });

  // Verify core structure invariants
  assert.equal(profiles[pt].yearlySchedule.length, 5, `${pt} must have 5 yearly schedule rows`);
  assert.equal(typeof profiles[pt].totalEconomicCostUsd, 'number', `${pt} totalEconomicCostUsd must be number`);
  assert.equal(typeof profiles[pt].hasUnderwaterEquity, 'boolean', `${pt} hasUnderwaterEquity must be boolean`);
  assert.ok(Array.isArray(profiles[pt].underwaterYears), `${pt} underwaterYears must be array`);
  assert.ok(Array.isArray(profiles[pt].breakdown), `${pt} breakdown must be array`);
  assert.equal(profiles[pt].breakdown.length, 5, `${pt} breakdown must have 5 categories`);
}

// 3.2 Verify Fuel / Energy Cost Coherence across Profiles
console.log(`✓ 5-Yr Fuel Costs: EV=$${profiles.EV.totalFuelUsd}, PHEV=$${profiles.PHEV.totalFuelUsd}, HEV=$${profiles.HEV.totalFuelUsd}, ICE_PETROL=$${profiles.ICE_PETROL.totalFuelUsd}, ICE_DIESEL=$${profiles.ICE_DIESEL.totalFuelUsd}`);
assert.ok(profiles.EV.totalFuelUsd < profiles.HEV.totalFuelUsd, 'EV fuel cost should be lower than HEV');
assert.ok(profiles.PHEV.totalFuelUsd < profiles.ICE_PETROL.totalFuelUsd, 'PHEV fuel cost should be lower than ICE');

// 3.3 Verify Insurance Cost Compounding (+1.5%/yr positive inflation)
const evSchedule = profiles.EV.yearlySchedule;
for (let yr = 1; yr <= 5; yr++) {
  const expectedIns = Math.round(1400 * Math.pow(1.015, yr - 1));
  assert.equal(evSchedule[yr - 1].yearInsuranceUsd, expectedIns, `Year ${yr} insurance must compound at +1.5%`);
  if (yr > 1) {
    assert.ok(
      evSchedule[yr - 1].yearInsuranceUsd > evSchedule[yr - 2].yearInsuranceUsd,
      `Year ${yr} insurance ($${evSchedule[yr - 1].yearInsuranceUsd}) must strictly exceed Year ${yr - 1} ($${evSchedule[yr - 2].yearInsuranceUsd})`
    );
  }
}
console.log(`✓ Insurance positive inflation verified: Yr1=$${evSchedule[0].yearInsuranceUsd} -> Yr5=$${evSchedule[4].yearInsuranceUsd}`);

// 3.4 Deep Underwater Negative Equity Analysis
// Profile A: Highly underwater financing: $50,000 car, 0% down, 8.5% APR, 84-month loan
const deepUnderwater = calculateTcoProjection({
  purchasePriceUsd: 50000,
  downPaymentPct: 0,
  aprPct: 8.5,
  loanTermMonths: 84,
  horizonYears: 5,
});
assert.equal(deepUnderwater.hasUnderwaterEquity, true, '0% down 84mo loan must trigger underwater equity');
assert.ok(deepUnderwater.maxUnderwaterEquityUsd > 3000, `Max underwater ($${deepUnderwater.maxUnderwaterEquityUsd}) must be significant`);
assert.ok(deepUnderwater.underwaterYears.length >= 2, 'Should be underwater for multiple years');

for (const row of deepUnderwater.yearlySchedule) {
  if (deepUnderwater.underwaterYears.includes(row.year)) {
    assert.equal(row.isUnderwater, true, `Row year ${row.year} must be marked isUnderwater=true`);
    assert.ok(row.negativeEquityUsd > 0, `Row year ${row.year} negativeEquityUsd must be positive`);
    assert.ok(row.remainingLoanBalanceUsd > row.residualValueUsd, `Row year ${row.year} remaining loan must exceed residual`);
  } else {
    assert.equal(row.isUnderwater, false);
    assert.equal(row.negativeEquityUsd, 0);
  }
}

// Profile B: Solvent financing: $50,000 car, 100% cash down
const solventCash = calculateTcoProjection({
  purchasePriceUsd: 50000,
  downPaymentPct: 100,
  aprPct: 5.0,
  loanTermMonths: 60,
  horizonYears: 5,
});
assert.equal(solventCash.hasUnderwaterEquity, false, '100% down payment must never be underwater');
assert.equal(solventCash.maxUnderwaterEquityUsd, 0, 'Max underwater equity must be 0');
assert.equal(solventCash.underwaterYears.length, 0, 'Underwater years must be empty');
for (const row of solventCash.yearlySchedule) {
  assert.equal(row.isUnderwater, false);
  assert.equal(row.negativeEquityUsd, 0);
  assert.equal(row.remainingLoanBalanceUsd, 0);
}

// Profile C: High down payment: 40% down on 48mo loan
const solventLoan = calculateTcoProjection({
  purchasePriceUsd: 50000,
  downPaymentPct: 40,
  aprPct: 4.0,
  loanTermMonths: 48,
  horizonYears: 5,
});
assert.equal(solventLoan.hasUnderwaterEquity, false, '40% down payment on 48mo loan should not be underwater');

console.log(`✓ Underwater Equity Detection: 0% down 84mo max underwater=$${deepUnderwater.maxUnderwaterEquityUsd} (years: ${deepUnderwater.underwaterYears.join(', ')}), 100% down max underwater=$${solventCash.maxUnderwaterEquityUsd}`);

// ============================================================================
// SUITE 4: DEPRECIATION ASYMPTOTE & INTERPOLATION (getFactoryRetention, calculateNonLinearDepreciation)
// ============================================================================
console.log('\n--- Suite 4: Depreciation Asymptote & Piecewise Interpolation ---');

// 4.1 Knot-point continuity and exact matching for t in [0, 10]
const customCurve = [0.82, 0.70, 0.60, 0.51, 0.44, 0.38, 0.33, 0.28, 0.24, 0.21];
for (let yr = 1; yr <= 10; yr++) {
  const ret = getFactoryRetention(yr, customCurve);
  assert.equal(ret, customCurve[yr - 1], `Year ${yr} retention (${ret}) must match curve value (${customCurve[yr - 1]})`);
}

// 4.2 C0 continuity at t = 10 knot boundary
const ret10 = getFactoryRetention(10.0, customCurve);
const ret10Minus = getFactoryRetention(9.999, customCurve);
const ret10Plus = getFactoryRetention(10.001, customCurve);
assert.ok(Math.abs(ret10 - customCurve[9]) < 1e-6, 'Retention at t=10 must equal c9');
assert.ok(Math.abs(ret10Plus - ret10) < 0.001, `Retention at boundary must be continuous: t=10 (${ret10}) vs t=10.001 (${ret10Plus})`);
assert.ok(Math.abs(ret10Minus - ret10) < 0.001, `Retention at boundary must be continuous: t=10 (${ret10}) vs t=9.999 (${ret10Minus})`);

// 4.3 Asymptote towards 5% salvage floor for t > 10 (no +0.15 offset)
const ret15 = getFactoryRetention(15, customCurve);
const ret25 = getFactoryRetention(25, customCurve);
const ret50 = getFactoryRetention(50, customCurve);
const ret100 = getFactoryRetention(100, customCurve);

assert.ok(ret15 < ret10, `Year 15 (${ret15}) must be strictly less than Year 10 (${ret10})`);
assert.ok(ret25 < ret15, `Year 25 (${ret25}) must be strictly less than Year 15 (${ret15})`);
assert.ok(ret50 < ret25, `Year 50 (${ret50}) must be strictly less than Year 25 (${ret25})`);
assert.ok(ret50 >= 0.05, `Year 50 (${ret50}) must not drop below 0.05`);
assert.ok(Math.abs(ret100 - 0.05) < 0.0001, `Year 100 (${ret100}) must asymptote to 0.05 floor`);

// 4.4 calculateNonLinearDepreciation Salvage Floor Enforced
const extremeDep = calculateNonLinearDepreciation({
  purchasePriceUsd: 60000,
  odometerMiles: 400000,
  annualDistanceMiles: 20000,
  ownershipYear: 30,
});
assert.equal(extremeDep.residualValueUsd, 3000, '60k purchase price must floor at 5% = $3,000');
assert.equal(extremeDep.retentionPct, 5.0, 'Retention pct must floor at 5.0%');

console.log(`✓ Depreciation Asymptote & Continuity: t=10: ${ret10}, t=15: ${ret15.toFixed(4)}, t=50: ${ret50.toFixed(4)}, t=100: ${ret100.toFixed(4)}, SalvageFloor=$${extremeDep.residualValueUsd} (5.0%)`);

// ============================================================================
// SUITE 5: SANITIZATION & BOUNDARY INTEGRITY (parseSanitizedNumber, SOH, PHEV)
// ============================================================================
console.log('\n--- Suite 5: Sanitization & Robust Boundary Integrity ---');

// 5.1 parseSanitizedNumber behavior
assert.equal(parseSanitizedNumber(123, 10), 123);
assert.equal(parseSanitizedNumber(' 456 ', 10), 456);
assert.equal(parseSanitizedNumber(0, 10), 0, 'Zero must be preserved');
assert.equal(parseSanitizedNumber('0', 10), 0, '"0" string must evaluate to 0');
assert.equal(parseSanitizedNumber('', 10), 10, 'Empty string must evaluate to fallback');
assert.equal(parseSanitizedNumber('   ', 10), 10, 'Whitespace string must evaluate to fallback');
assert.equal(parseSanitizedNumber(null, 10), 10, 'null must evaluate to fallback');
assert.equal(parseSanitizedNumber(undefined, 10), 10, 'undefined must evaluate to fallback');
assert.equal(parseSanitizedNumber(NaN, 10), 10, 'NaN must evaluate to fallback');
assert.equal(parseSanitizedNumber(-5, 10, 0), 0, 'Negative clamped to min 0');
assert.equal(parseSanitizedNumber(150, 10, 0, 100), 100, 'Over-max clamped to max 100');

// 5.2 Battery SOH Boundary Integrity
const corruptSohInputs = [
  null,
  undefined,
  {},
  { ageYears: '', odometerMiles: '   ', floorSoh: NaN },
  { nominalCapacityKwh: null, chemistry: 'UNKNOWN', dcFastChargingSharePct: null },
];

for (const input of corruptSohInputs) {
  const res = calculateBatterySoh(input);
  assert.ok(!Number.isNaN(res.sohPct), `SOH pct must not be NaN for input ${JSON.stringify(input)}`);
  assert.ok(!Number.isNaN(res.remainingCapacityKwh), 'remainingCapacityKwh must not be NaN');
  assert.ok(res.sohPct >= 50.0 && res.sohPct <= 100.0, 'SOH must stay within safe bounds');
}

// 5.3 PHEV Tariff Edge Cases
const phevDefault = calculateTcoProjection({ purchasePriceUsd: 35000, powertrainType: 'PHEV' });
const phevEmpty = calculateTcoProjection({ purchasePriceUsd: 35000, powertrainType: 'PHEV', homeTariffUsdPerKwh: '' });
const phevWhitespace = calculateTcoProjection({ purchasePriceUsd: 35000, powertrainType: 'PHEV', homeTariffUsdPerKwh: '   ' });
const phevZero = calculateTcoProjection({ purchasePriceUsd: 35000, powertrainType: 'PHEV', homeTariffUsdPerKwh: 0 });

assert.equal(phevEmpty.totalFuelUsd, phevDefault.totalFuelUsd, 'Empty string tariff must match default tariff');
assert.equal(phevWhitespace.totalFuelUsd, phevDefault.totalFuelUsd, 'Whitespace tariff must match default tariff');
assert.ok(phevZero.totalFuelUsd < phevDefault.totalFuelUsd, 'Explicit 0 tariff (free solar) must reduce fuel cost below default');

// 5.4 EV Price Monotonicity Above $1.00/kWh
const evT050 = calculateTcoProjection({ purchasePriceUsd: 40000, powertrainType: 'EV', fuelPriceUsdGal: 0.50 }).totalFuelUsd;
const evT100 = calculateTcoProjection({ purchasePriceUsd: 40000, powertrainType: 'EV', fuelPriceUsdGal: 1.00 }).totalFuelUsd;
const evT150 = calculateTcoProjection({ purchasePriceUsd: 40000, powertrainType: 'EV', fuelPriceUsdGal: 1.50 }).totalFuelUsd;
const evT200 = calculateTcoProjection({ purchasePriceUsd: 40000, powertrainType: 'EV', fuelPriceUsdGal: 2.00 }).totalFuelUsd;

assert.ok(evT100 > evT050, 'EV cost at $1.00 must exceed $0.50');
assert.ok(evT150 > evT100, 'EV cost at $1.50 must exceed $1.00 (monotonicity across $1.00 threshold)');
assert.ok(evT200 > evT150, 'EV cost at $2.00 must exceed $1.50');

console.log(`✓ Monotonic EV Tariff Scaling: $0.50=$${evT050} < $1.00=$${evT100} < $1.50=$${evT150} < $2.00=$${evT200}`);

console.log('\n====================================================================');
console.log('ALL MILITARY-GRADE STRESS TESTS COMPLETED SUCCESSFULLY WITH 0 ERRORS');
console.log('====================================================================\n');

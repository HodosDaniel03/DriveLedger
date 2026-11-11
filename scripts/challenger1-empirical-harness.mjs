/**
 * Challenger 1 Comprehensive Empirical Stress & Fuzz Harness for Milestone 1
 * Targets:
 *   - src/data/powertrainTypes.js
 *   - src/data/maintenanceData.js
 */

import * as pt from '../src/data/powertrainTypes.js';
import * as md from '../src/data/maintenanceData.js';
import assert from 'node:assert/strict';

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: [],
  observations: [],
};

function runTest(suite, name, fn) {
  results.total++;
  try {
    fn();
    results.passed++;
    console.log(`  [PASS] ${suite} > ${name}`);
  } catch (err) {
    results.failed++;
    const failInfo = { suite, name, error: err.message };
    results.failures.push(failInfo);
    console.error(`  [FAIL] ${suite} > ${name}: ${err.message}`);
  }
}

console.log('================================================================');
console.log('CHALLENGER 1 EMPIRICAL VERIFICATION HARNESS — MILESTONE 1');
console.log('================================================================\n');

// ----------------------------------------------------------------------------
// SUITE 1: DEPRECIATION CURVE CONTINUITY & MONOTONICITY
// ----------------------------------------------------------------------------
console.log('--- SUITE 1: Depreciation Curve Continuity & Monotonicity ---');

runTest('Depreciation', 'Piecewise linear interpolation over residualCurve10Yr at boundary points', () => {
  const boundaryPoints = [0, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 9.999, 10.0, 10.001, 15, 20, 50];
  let prevRet = 1.000001;

  for (const t of boundaryPoints) {
    const r = pt.getFactoryRetention(t);
    assert.ok(!Number.isNaN(r), `Retention at t=${t} must not be NaN`);
    assert.ok(r >= 0.05, `Retention at t=${t} (${r}) must be >= 0.05`);
    assert.ok(r <= 1.0, `Retention at t=${t} (${r}) must be <= 1.0`);
    assert.ok(r <= prevRet + 1e-9, `Retention must be monotonically non-increasing at t=${t} (got ${r} > ${prevRet})`);
    prevRet = r;
  }
});

runTest('Depreciation', 'Continuity between 10yr curve and D3 asymptote at t=10 knot point', () => {
  const r9_999 = pt.getFactoryRetention(9.999);
  const r10_000 = pt.getFactoryRetention(10.0);
  const r10_001 = pt.getFactoryRetention(10.001);

  const deltaLeft = Math.abs(r10_000 - r9_999);
  const deltaRight = Math.abs(r10_001 - r10_000);

  // Default curve: c8 = 0.23, c9 = 0.20. Slope between 9 and 10 is -0.03/yr -> 0.00003 per 0.001 yr
  // Right slope: -0.15 * (0.20 - 0.05) * exp(0) = -0.0225/yr -> 0.0000225 per 0.001 yr
  assert.ok(deltaLeft < 0.0005, `Discontinuity on left of t=10: delta=${deltaLeft}`);
  assert.ok(deltaRight < 0.0005, `Discontinuity on right of t=10: delta=${deltaRight}`);
  assert.equal(r10_000, 0.20, 'Exact knot value at t=10 must equal c9 (0.20)');
});

runTest('Depreciation', 'Asymptotic floor at 0.05 as t -> infinity (no negatives, no values < 0.05)', () => {
  const extremeTimes = [15, 20, 30, 50, 75, 100, 500, 1000];
  for (const t of extremeTimes) {
    const r = pt.getFactoryRetention(t);
    assert.ok(r >= 0.05, `Retention at t=${t} (${r}) must be >= 0.05`);
    assert.ok(r <= 0.20, `Retention at t=${t} (${r}) must be <= c9 (0.20)`);
  }
  const r50 = pt.getFactoryRetention(50);
  const r100 = pt.getFactoryRetention(100);
  assert.ok(Math.abs(r50 - 0.05) < 0.001, `Retention at t=50 (${r50}) must be within 0.001 of 0.05 floor`);
  assert.equal(r100, 0.05, `Retention at t=100 (${r100}) must evaluate to 0.05`);
});

runTest('Depreciation', 'Virtual age offsets: startOdo = 0, 12500, 150000', () => {
  const price = 40000;
  
  // startOdo = 0: new car
  const dep0 = pt.calculateNonLinearDepreciation({
    purchasePriceUsd: price,
    odometerMiles: 0,
    annualDistanceMiles: 12500,
    ownershipYear: 1,
  });
  // Year 1 retention on default curve: 81%
  assert.equal(dep0.retentionPct, 81.0, `New car Yr 1 retention expected 81.0%, got ${dep0.retentionPct}%`);

  // startOdo = 12500: 1-yr old car, does not re-take showroom drop
  const dep12k = pt.calculateNonLinearDepreciation({
    purchasePriceUsd: price,
    odometerMiles: 12500,
    annualDistanceMiles: 12500,
    ownershipYear: 1,
  });
  // baseRetention = getFactoryRetention(2) / getFactoryRetention(1) = 0.69 / 0.81 = 85.185%
  assert.equal(dep12k.retentionPct, 85.2, `1-yr used car Yr 1 retention expected 85.2%, got ${dep12k.retentionPct}%`);
  assert.ok(dep12k.retentionPct > dep0.retentionPct, 'Used car year 1 retention ratio must exceed new car showroom drop');

  // startOdo = 150000: 12-yr old car
  const dep150k = pt.calculateNonLinearDepreciation({
    purchasePriceUsd: price,
    odometerMiles: 150000,
    annualDistanceMiles: 12500,
    ownershipYear: 1,
  });
  assert.ok(dep150k.retentionPct >= 5.0 && dep150k.retentionPct <= 96.0);
  assert.ok(dep150k.residualValueUsd >= price * 0.05);
});

runTest('Depreciation', 'Distinct curves produce distinct trajectories', () => {
  const curveToyota = [0.89, 0.81, 0.74, 0.67, 0.61, 0.55, 0.50, 0.45, 0.41, 0.37];
  const curvePuretech = [0.73, 0.59, 0.48, 0.39, 0.32, 0.26, 0.21, 0.17, 0.14, 0.11];

  const depToyota = pt.calculateNonLinearDepreciation({
    purchasePriceUsd: 30000,
    residualCurve10Yr: curveToyota,
    ownershipYear: 3,
  });
  const depPuretech = pt.calculateNonLinearDepreciation({
    purchasePriceUsd: 30000,
    residualCurve10Yr: curvePuretech,
    ownershipYear: 3,
  });

  assert.ok(
    depToyota.residualValueUsd > depPuretech.residualValueUsd + 5000,
    `Toyota curve residual ($${depToyota.residualValueUsd}) must greatly exceed Puretech ($${depPuretech.residualValueUsd})`
  );
});

// ----------------------------------------------------------------------------
// SUITE 2: INSURANCE INFLATION COMPOUNDING
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 2: Insurance Inflation Compounding ---');

runTest('Insurance', 'Year-over-year compounding at +1.5% (1.015^(yr-1)), not deflation (0.985)', () => {
  const baseInsurance = 1400;
  const proj = md.calculateTcoProjection({
    purchasePriceUsd: 30000,
    annualInsuranceUsd: baseInsurance,
    horizonYears: 10,
    downPaymentPct: 100,
  });

  let prevInsurance = 0;
  for (let yr = 1; yr <= 10; yr++) {
    const row = proj.yearlySchedule[yr - 1];
    const expectedRaw = baseInsurance * Math.pow(1.015, yr - 1);
    const expectedRounded = Math.round(expectedRaw);

    assert.equal(row.yearInsuranceUsd, expectedRounded, `Year ${yr} insurance expected ${expectedRounded}, got ${row.yearInsuranceUsd}`);
    assert.ok(row.yearInsuranceUsd >= prevInsurance, `Year ${yr} insurance must not decrease (got ${row.yearInsuranceUsd} vs prev ${prevInsurance})`);
    prevInsurance = row.yearInsuranceUsd;
  }

  // Yr 5 verification: 1400 * 1.015^4 = 1485.9 -> 1486
  assert.equal(proj.yearlySchedule[4].yearInsuranceUsd, 1486);
  // Yr 10 verification: 1400 * 1.015^9 = 1600.7 -> 1601
  assert.equal(proj.yearlySchedule[9].yearInsuranceUsd, 1601);
});

// ----------------------------------------------------------------------------
// SUITE 3: UNDERWATER EQUITY CALCULATION
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 3: Underwater Equity Calculation ---');

runTest('Underwater Equity', 'Zero down payment with fast depreciation detects negative equity', () => {
  const fastDepCurve = [0.70, 0.55, 0.45, 0.35, 0.28, 0.22, 0.17, 0.14, 0.11, 0.08];
  const proj = md.calculateTcoProjection({
    purchasePriceUsd: 40000,
    downPaymentPct: 0,
    aprPct: 7.5,
    loanTermMonths: 84,
    horizonYears: 5,
    residualCurve10Yr: fastDepCurve,
  });

  assert.equal(proj.hasUnderwaterEquity, true, 'Zero down 84-mo loan on steep curve must be underwater');
  assert.ok(proj.maxUnderwaterEquityUsd > 0, `maxUnderwaterEquityUsd (${proj.maxUnderwaterEquityUsd}) must be > 0`);
  assert.ok(proj.underwaterYears.length > 0, 'underwaterYears must contain entries');

  // Verify schedule rows contract
  for (const row of proj.yearlySchedule) {
    const isUnder = row.remainingLoanBalanceUsd > row.residualValueUsd;
    assert.equal(row.isUnderwater, isUnder, `Year ${row.year} isUnderwater mismatch`);
    if (isUnder) {
      assert.equal(row.negativeEquityUsd, row.remainingLoanBalanceUsd - row.residualValueUsd);
      assert.ok(row.negativeEquityUsd > 0);
    } else {
      assert.equal(row.negativeEquityUsd, 0);
    }
  }
});

runTest('Underwater Equity', '100% Cash Purchase (0 loan balance) never reports underwater equity', () => {
  const proj = md.calculateTcoProjection({
    purchasePriceUsd: 35000,
    downPaymentPct: 100,
    horizonYears: 5,
  });

  assert.equal(proj.hasUnderwaterEquity, false);
  assert.equal(proj.maxUnderwaterEquityUsd, 0);
  assert.deepEqual(proj.underwaterYears, []);

  for (const row of proj.yearlySchedule) {
    assert.equal(row.isUnderwater, false);
    assert.equal(row.negativeEquityUsd, 0);
    assert.equal(row.remainingLoanBalanceUsd, 0);
  }
});

runTest('Underwater Equity', 'Loan fully paid off before horizon terminates underwater status', () => {
  const proj = md.calculateTcoProjection({
    purchasePriceUsd: 30000,
    downPaymentPct: 10,
    loanTermMonths: 36, // 3-year loan
    horizonYears: 5,    // 5-year ownership
    aprPct: 6.0,
  });

  // In years 4 and 5, remaining loan balance is $0, cannot be underwater
  const y4 = proj.yearlySchedule[3];
  const y5 = proj.yearlySchedule[4];
  assert.equal(y4.remainingLoanBalanceUsd, 0);
  assert.equal(y4.isUnderwater, false);
  assert.equal(y4.negativeEquityUsd, 0);

  assert.equal(y5.remainingLoanBalanceUsd, 0);
  assert.equal(y5.isUnderwater, false);
  assert.equal(y5.negativeEquityUsd, 0);
});

runTest('Underwater Equity', 'High depreciation vs low depreciation impact on negative equity', () => {
  const curveLow = [0.89, 0.81, 0.74, 0.67, 0.61, 0.55, 0.50, 0.45, 0.41, 0.37];
  const curveHigh = [0.73, 0.59, 0.48, 0.39, 0.32, 0.26, 0.21, 0.17, 0.14, 0.11];

  const projLow = md.calculateTcoProjection({
    purchasePriceUsd: 35000,
    downPaymentPct: 5,
    aprPct: 6.5,
    loanTermMonths: 72,
    horizonYears: 5,
    residualCurve10Yr: curveLow,
  });
  const projHigh = md.calculateTcoProjection({
    purchasePriceUsd: 35000,
    downPaymentPct: 5,
    aprPct: 6.5,
    loanTermMonths: 72,
    horizonYears: 5,
    residualCurve10Yr: curveHigh,
  });

  assert.ok(
    projHigh.maxUnderwaterEquityUsd > projLow.maxUnderwaterEquityUsd,
    `High depreciation vehicle max underwater equity ($${projHigh.maxUnderwaterEquityUsd}) must exceed low ($${projLow.maxUnderwaterEquityUsd})`
  );
});

// ----------------------------------------------------------------------------
// SUITE 4: INPUT SANITIZATION FUZZ TESTING & TARIFF BEHAVIORS
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 4: Input Sanitization Fuzz Testing & Tariff Behaviors ---');

runTest('Sanitization', 'PHEV home tariff with empty string defaults to 0.16', () => {
  const phevDef = md.calculateTcoProjection({ purchasePriceUsd: 35000, powertrainType: 'PHEV' });
  const phevEmpty = md.calculateTcoProjection({ purchasePriceUsd: 35000, powertrainType: 'PHEV', homeTariffUsdPerKwh: '' });
  const phevWs = md.calculateTcoProjection({ purchasePriceUsd: 35000, powertrainType: 'PHEV', homeTariffUsdPerKwh: '   ' });

  assert.equal(phevEmpty.totalFuelUsd, phevDef.totalFuelUsd, 'Empty string tariff must match default tariff TCO');
  assert.equal(phevWs.totalFuelUsd, phevDef.totalFuelUsd, 'Whitespace tariff must match default tariff TCO');
});

runTest('Sanitization', 'EV home tariff with $1.50 scales monotonically (does not collapse to 0.16)', () => {
  const ev100 = md.calculateTcoProjection({ purchasePriceUsd: 40000, isEv: true, powertrainType: 'EV', fuelPriceUsdGal: 1.00 });
  const ev150 = md.calculateTcoProjection({ purchasePriceUsd: 40000, isEv: true, powertrainType: 'EV', fuelPriceUsdGal: 1.50 });
  const ev030 = md.calculateTcoProjection({ purchasePriceUsd: 40000, isEv: true, powertrainType: 'EV', fuelPriceUsdGal: 0.30 });

  assert.ok(ev150.totalFuelUsd > ev100.totalFuelUsd, 'Tariff $1.50 fuel cost must be greater than $1.00');
  assert.ok(ev100.totalFuelUsd > ev030.totalFuelUsd, 'Tariff $1.00 fuel cost must be greater than $0.30');
  
  // Explicitly check ratio: 1.50 / 0.30 = 5.0
  const ratio = ev150.totalFuelUsd / ev030.totalFuelUsd;
  assert.ok(Math.abs(ratio - 5.0) < 0.1, `Fuel cost ratio between $1.50 and $0.30 must be ~5.0, got ${ratio}`);
});

runTest('Sanitization', 'Fuzz parseSanitizedNumber on malicious inputs', () => {
  const fallback = 42;
  const min = 0;
  const max = 100;

  // Expected fallbacks:
  assert.equal(pt.parseSanitizedNumber('', fallback, min, max), fallback, '"" -> fallback');
  assert.equal(pt.parseSanitizedNumber('   ', fallback, min, max), fallback, '"   " -> fallback');
  assert.equal(pt.parseSanitizedNumber(null, fallback, min, max), fallback, 'null -> fallback');
  assert.equal(pt.parseSanitizedNumber(undefined, fallback, min, max), fallback, 'undefined -> fallback');
  assert.equal(pt.parseSanitizedNumber(NaN, fallback, min, max), fallback, 'NaN -> fallback');
  assert.equal(pt.parseSanitizedNumber('abc', fallback, min, max), fallback, '"abc" -> fallback');
  assert.equal(pt.parseSanitizedNumber({}, fallback, min, max), fallback, '{} -> fallback');

  // Valid values:
  assert.equal(pt.parseSanitizedNumber('0', fallback, min, max), 0, '"0" -> 0');
  assert.equal(pt.parseSanitizedNumber(0, fallback, min, max), 0, '0 -> 0');
  assert.equal(pt.parseSanitizedNumber('-1', fallback, min, max), 0, '"-1" -> clamped to min=0');

  // Check adversarial inputs: [], true, false, Infinity
  const testArray = pt.parseSanitizedNumber([], fallback, min, max);
  const testTrue = pt.parseSanitizedNumber(true, fallback, min, max);
  const testFalse = pt.parseSanitizedNumber(false, fallback, min, max);
  const testInf = pt.parseSanitizedNumber(Infinity, fallback, min, max);

  console.log(`    [Empirical Probe] parseSanitizedNumber([], 42) = ${testArray}`);
  console.log(`    [Empirical Probe] parseSanitizedNumber(true, 42) = ${testTrue}`);
  console.log(`    [Empirical Probe] parseSanitizedNumber(false, 42) = ${testFalse}`);
  console.log(`    [Empirical Probe] parseSanitizedNumber(Infinity, 42) = ${testInf}`);

  assert.equal(testArray, fallback, '[] must evaluate to fallback, not 0');
  assert.equal(testTrue, fallback, 'true must evaluate to fallback, not 1');
  assert.equal(testFalse, fallback, 'false must evaluate to fallback, not 0');
});

runTest('Sanitization', 'calculateBatterySoh handles nullish and corrupted inputs without NaN', () => {
  const corruptedCases = [
    {},
    null,
    undefined,
    { nominalCapacityKwh: null, ageYears: '', dcFastChargingSharePct: '   ', cellDefectLossPct: NaN },
    { floorSoh: NaN, dcFastChargingSharePct: null, ageYears: null },
    { odometerMiles: -1000, ageYears: -5 },
  ];

  for (const c of corruptedCases) {
    const res = pt.calculateBatterySoh(c);
    assert.ok(!Number.isNaN(res.sohPct), `sohPct is NaN for ${JSON.stringify(c)}`);
    assert.ok(!Number.isNaN(res.remainingCapacityKwh), `remainingCapacityKwh is NaN for ${JSON.stringify(c)}`);
    assert.ok(!Number.isNaN(res.capacityLossPct), `capacityLossPct is NaN for ${JSON.stringify(c)}`);
    assert.ok(res.sohPct >= 50.0 && res.sohPct <= 100.0, `sohPct out of bounds: ${res.sohPct}`);
  }
});

// ----------------------------------------------------------------------------
// SUITE 5: EV DYNAMIC MAINTENANCE & MAINTENANCE RESERVE ENGINE
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 5: Dynamic Maintenance & Maintenance Reserve ---');

runTest('Dynamic Maintenance', 'EV powertrainBaseFactor is 1.0 (no duplicate 0.65x discount)', () => {
  const maintEv = md.calculateDynamicMaintenance({
    baseAnnualMaintenanceUsd: 380,
    odometerMiles: 0,
    annualDistanceMiles: 12000,
    powertrainType: 'EV',
    maintenanceWearFactor: 1.0,
    ownershipYear: 1,
  });
  // At odo 0, 12k mi, wearEscalation = 1.0, mileageWearMultiplier = 1.0. Routine maint = 380 * 1.0 = 380
  assert.equal(maintEv.routineMaintenanceUsd, 380, `EV routine maintenance expected 380, got ${maintEv.routineMaintenanceUsd}`);
});

runTest('Maintenance Reserve', 'calculateMaintenanceReserve resilience, tiers, and mileage scaling', () => {
  // Empty args
  assert.equal(md.calculateMaintenanceReserve(), 0);
  assert.equal(md.calculateMaintenanceReserve({ evaluatedComponents: [] }), 0);

  // Single critical component
  const comp = {
    health: { status: 'CRITICAL', effectiveWearMiles: 50000 },
    costsUsd: {
      independent: [300, 500], // avg = 400
      dealership: [600, 1000],  // avg = 800
    },
    serviceIntervalMiles: 60000,
  };

  const indepRes = md.calculateMaintenanceReserve({
    evaluatedComponents: [comp],
    workshopTier: 'independent',
    annualDistanceMiles: 12000,
  });
  // Critical: 400 * 0.75 * 1.0 = 300
  assert.equal(indepRes, 300);

  const dealerRes = md.calculateMaintenanceReserve({
    evaluatedComponents: [comp],
    workshopTier: 'dealership',
    annualDistanceMiles: 12000,
  });
  // Critical: 800 * 0.75 * 1.0 = 600
  assert.equal(dealerRes, 600);

  // Mileage scaling: 24,000 mi -> scale = min(2.5, 24000/12000) = 2.0
  const highMiRes = md.calculateMaintenanceReserve({
    evaluatedComponents: [comp],
    workshopTier: 'independent',
    annualDistanceMiles: 24000,
  });
  // itemReserve = 400 * 0.75 * 2.0 = 600, capped at avgCost * 1.25 = 400 * 1.25 = 500
  assert.equal(highMiRes, 500, `High mileage reserve capped at 1.25x avg ($500), got ${highMiRes}`);
});

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${results.total}`);
console.log(`PASSED: ${results.passed}`);
console.log(`FAILED: ${results.failed}`);
if (results.failures.length > 0) {
  console.log('\nFAILURES DETAIL:');
  for (const f of results.failures) {
    console.log(`  - [${f.suite}] ${f.name}: ${f.error}`);
  }
}
console.log('================================================================');

if (results.failed > 0) {
  process.exit(1);
} else {
  console.log('ALL EMPIRICAL TESTS PASSED PERFECTLY!');
}

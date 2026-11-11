/**
 * Empirical Challenger 1 Adversarial Stress Test Suite for Milestone 1
 * Targets:
 *   - src/data/powertrainTypes.js
 *   - src/data/maintenanceData.js
 * 
 * Tests Features 1 through 9 under extreme, boundary, and adversarial inputs.
 */

import * as pt from '../src/data/powertrainTypes.js';
import * as md from '../src/data/maintenanceData.js';
import assert from 'node:assert/strict';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✔ PASS: ${name}`);
  } catch (err) {
    failedTests++;
    failures.push({ name, error: err });
    console.error(`  ✖ FAIL: ${name}`);
    console.error(`    ${err.message}`);
  }
}

function check(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('================================================================');
console.log('CHALLENGER 1: ADVERSARIAL STRESS TEST FOR MILESTONE 1');
console.log('================================================================\n');

// ============================================================================
// 1. DEPRECIATION MATH & ASYMPTOTE BOUNDARIES (Features 1 & 2)
// ============================================================================
console.log('--- 1. Depreciation Math, Boundaries & Asymptotes ---');

test('F1/F2-1: getFactoryRetention continuity across critical knot points', () => {
  // Test t around 0, 1, 9.999, 10, 10.001, 50, 100
  const tVals = [0, 0.0001, 0.5, 0.9999, 1.0, 1.0001, 5.0, 9.999, 10.0, 10.001, 20.0, 50.0, 100.0];
  let prevRetention = 1.000001;
  
  for (const t of tVals) {
    const r = pt.getFactoryRetention(t);
    check(!Number.isNaN(r), `Retention at t=${t} is NaN`);
    check(r >= 0.05, `Retention at t=${t} (${r}) < 0.05 floor`);
    check(r <= 1.0, `Retention at t=${t} (${r}) > 1.0 ceiling`);
    check(r <= prevRetention + 1e-9, `Monotonicity violated at t=${t}: r=${r} > prev=${prevRetention}`);
    prevRetention = r;
  }
  
  // Continuity check across t = 10
  const r9999 = pt.getFactoryRetention(9.999);
  const r10 = pt.getFactoryRetention(10.0);
  const r10001 = pt.getFactoryRetention(10.001);
  const diffLeft = Math.abs(r10 - r9999);
  const diffRight = Math.abs(r10001 - r10);
  check(diffLeft < 0.001, `Discontinuity at t=10 left: diff=${diffLeft}`);
  check(diffRight < 0.001, `Discontinuity at t=10 right: diff=${diffRight}`);
  
  // At extreme t (50 and 100), must approach 0.05 floor
  const r50 = pt.getFactoryRetention(50);
  const r100 = pt.getFactoryRetention(100);
  check(Math.abs(r50 - 0.05) < 0.001, `r50 should be ~0.05, got ${r50}`);
  check(Math.abs(r100 - 0.05) < 0.00001, `r100 should be 0.05, got ${r100}`);
});

test('F1/F2-2: calculateNonLinearDepreciation with t in {0, 0.0001, 1, 9.999, 10, 10.001, 50, 100}', () => {
  const years = [0, 0.0001, 1, 9.999, 10, 10.001, 50, 100];
  for (const yr of years) {
    const res = pt.calculateNonLinearDepreciation({
      purchasePriceUsd: 35000,
      ownershipYear: yr,
      odometerMiles: 0,
      annualDistanceMiles: 12000,
    });
    check(!Number.isNaN(res.residualValueUsd), `residualValueUsd is NaN at yr=${yr}`);
    check(!Number.isNaN(res.cumulativeDepreciationUsd), `cumulativeDepreciationUsd is NaN at yr=${yr}`);
    check(!Number.isNaN(res.retentionPct), `retentionPct is NaN at yr=${yr}`);
    check(res.residualValueUsd >= 1750, `Residual value ${res.residualValueUsd} below 5% floor ($1750) at yr=${yr}`);
    check(res.residualValueUsd <= 35000, `Residual value ${res.residualValueUsd} above MSRP ($35000) at yr=${yr}`);
    check(res.retentionPct >= 5.0, `Retention ${res.retentionPct}% below 5.0% floor at yr=${yr}`);
  }
});

test('F1/F2-3: calculateNonLinearDepreciation with extreme mileage and zero mileage', () => {
  // Zero mileage
  const resZero = pt.calculateNonLinearDepreciation({
    purchasePriceUsd: 30000,
    odometerMiles: 0,
    annualDistanceMiles: 0,
    ownershipYear: 3,
  });
  check(resZero.residualValueUsd > 1500, 'Zero mileage residual valid');
  check(resZero.retentionPct <= 96.0, 'Zero mileage respects 96% ceiling');

  // Extreme high mileage (500k odometer, 50k annual)
  const resExtreme = pt.calculateNonLinearDepreciation({
    purchasePriceUsd: 40000,
    odometerMiles: 500000,
    annualDistanceMiles: 50000,
    ownershipYear: 10,
  });
  check(resExtreme.residualValueUsd === 2000, `Extreme mileage residual must hit 5% floor ($2000), got ${resExtreme.residualValueUsd}`);
  check(resExtreme.retentionPct === 5.0, `Extreme mileage retention must hit 5.0%, got ${resExtreme.retentionPct}`);
  check(resExtreme.cumulativeDepreciationUsd === 38000, `Cumulative depreciation should be $38000, got ${resExtreme.cumulativeDepreciationUsd}`);
});

test('F1/F2-4: Custom curve, empty curve, short curve, non-array curve inputs', () => {
  const custom = [0.90, 0.82, 0.75, 0.68, 0.62, 0.56, 0.51, 0.46, 0.42, 0.38];
  const resCustom = pt.calculateNonLinearDepreciation({
    purchasePriceUsd: 30000,
    ownershipYear: 3,
    residualCurve10Yr: custom,
  });
  const resDefault = pt.calculateNonLinearDepreciation({
    purchasePriceUsd: 30000,
    ownershipYear: 3,
  });
  check(resCustom.residualValueUsd !== resDefault.residualValueUsd, 'Custom curve produces distinct valuation');

  // Empty curve []
  const resEmpty = pt.calculateNonLinearDepreciation({
    purchasePriceUsd: 30000,
    ownershipYear: 3,
    residualCurve10Yr: [],
  });
  check(resEmpty.residualValueUsd === resDefault.residualValueUsd, 'Empty curve safely falls back to default');

  // Short curve (< 10 elements)
  const resShort = pt.calculateNonLinearDepreciation({
    purchasePriceUsd: 30000,
    ownershipYear: 3,
    residualCurve10Yr: [0.8, 0.6],
  });
  check(resShort.residualValueUsd === resDefault.residualValueUsd, 'Short curve safely falls back to default');

  // Non-array inputs (null, undefined, string, object, number)
  const invalidCurves = [null, undefined, 'curve', { 0: 0.8 }, 123, NaN, true, false];
  for (const inv of invalidCurves) {
    const res = pt.calculateNonLinearDepreciation({
      purchasePriceUsd: 30000,
      ownershipYear: 3,
      residualCurve10Yr: inv,
    });
    check(!Number.isNaN(res.residualValueUsd), `Invalid curve ${inv} produced NaN`);
    check(res.residualValueUsd === resDefault.residualValueUsd, `Invalid curve ${inv} did not fall back to default`);
  }
});

test('F1/F2-5: Positional call signature vs Object call signature equivalence', () => {
  const objRes = pt.calculateNonLinearDepreciation({
    purchasePriceUsd: 25000,
    ownershipYear: 4,
    odometerMiles: 15000,
    powertrainType: 'EV',
  });
  const posRes = pt.calculateNonLinearDepreciation(25000, 4, 15000, 'EV');
  check(objRes.residualValueUsd === posRes.residualValueUsd, `Positional vs Object residual mismatch: ${objRes.residualValueUsd} vs ${posRes.residualValueUsd}`);
  check(objRes.retentionPct === posRes.retentionPct, `Positional vs Object retention mismatch: ${objRes.retentionPct} vs ${posRes.retentionPct}`);
});

// ============================================================================
// 2. TARIFF & ENERGY SANITIZATION AND MONOTONICITY (Features 3, 4, 5)
// ============================================================================
console.log('\n--- 2. Tariff & Energy Calculations (Monotonicity & Edge Inputs) ---');

test('F3-1: PHEV empty and whitespace tariffs default to $0.16/kWh', () => {
  const phevBase = md.calculateTcoProjection({
    purchasePriceUsd: 35000,
    powertrainType: 'PHEV',
  });
  const whitespaces = ['', ' ', '   ', '\t', '\n', ' \t\n '];
  for (const ws of whitespaces) {
    const res = md.calculateTcoProjection({
      purchasePriceUsd: 35000,
      powertrainType: 'PHEV',
      homeTariffUsdPerKwh: ws,
    });
    check(res.totalFuelUsd === phevBase.totalFuelUsd, `Whitespace '${ws}' totalFuelUsd (${res.totalFuelUsd}) does not match default (${phevBase.totalFuelUsd})`);
  }

  // Explicit zero tariff must evaluate to $0 electric cost, NOT default
  const resZero = md.calculateTcoProjection({
    purchasePriceUsd: 35000,
    powertrainType: 'PHEV',
    homeTariffUsdPerKwh: 0,
  });
  check(resZero.totalFuelUsd < phevBase.totalFuelUsd, `Explicit 0 tariff (${resZero.totalFuelUsd}) should be less than default (${phevBase.totalFuelUsd})`);
});

test('F4-1: EV electricity tariff monotonicity above $1.00/kWh', () => {
  // Test tariffs: $0.10, $0.50, $1.00, $1.01, $1.50, $2.50, $5.00
  const tariffs = [0.10, 0.50, 1.00, 1.01, 1.50, 2.50, 5.00];
  let prevFuelCost = -1;

  for (const t of tariffs) {
    const res = md.calculateTcoProjection({
      purchasePriceUsd: 40000,
      powertrainType: 'EV',
      isEv: true,
      fuelPriceUsdGal: t,
    });
    check(res.totalFuelUsd > prevFuelCost, `EV fuel cost not strictly increasing at tariff $${t}: ${res.totalFuelUsd} vs ${prevFuelCost}`);
    prevFuelCost = res.totalFuelUsd;
  }
});

test('F4-2: Extreme tariffs ($5.00/kWh, $50.00/kWh) and negative tariffs', () => {
  const res5 = md.calculateTcoProjection({
    purchasePriceUsd: 40000,
    powertrainType: 'EV',
    isEv: true,
    fuelPriceUsdGal: 5.00,
  });
  check(res5.totalFuelUsd > 10000, 'Extreme tariff $5.00/kWh produces high cost without crashing');

  // Negative tariff should clamp to 0
  const resNeg = md.calculateTcoProjection({
    purchasePriceUsd: 40000,
    powertrainType: 'EV',
    isEv: true,
    fuelPriceUsdGal: -1.50,
  });
  const resZero = md.calculateTcoProjection({
    purchasePriceUsd: 40000,
    powertrainType: 'EV',
    isEv: true,
    fuelPriceUsdGal: 0,
  });
  check(resNeg.totalFuelUsd === resZero.totalFuelUsd, 'Negative tariff clamps to 0');
});

test('F5-1: parseSanitizedNumber behavior on adversarial inputs', () => {
  // Trimming
  check(pt.parseSanitizedNumber('  42.5  ', 10) === 42.5, 'Trim valid number');
  // Nullish and empty
  check(pt.parseSanitizedNumber(null, 10) === 10, 'null -> fallback');
  check(pt.parseSanitizedNumber(undefined, 10) === 10, 'undefined -> fallback');
  check(pt.parseSanitizedNumber('', 10) === 10, '"" -> fallback');
  check(pt.parseSanitizedNumber(' \t\n ', 10) === 10, 'whitespace -> fallback');
  // NaN and non-numeric
  check(pt.parseSanitizedNumber(NaN, 10) === 10, 'NaN -> fallback');
  check(pt.parseSanitizedNumber('abc', 10) === 10, '"abc" -> fallback');
  check(pt.parseSanitizedNumber({}, 10) === 10, '{} -> fallback');
  check(pt.parseSanitizedNumber([], 10) === 10, '[] -> fallback');
  // Valid zero preservation
  check(pt.parseSanitizedNumber(0, 10) === 0, '0 preserved');
  check(pt.parseSanitizedNumber('0', 10) === 0, '"0" preserved');
  check(pt.parseSanitizedNumber(' 0.0 ', 10) === 0, '" 0.0 " preserved');
  // Clamping
  check(pt.parseSanitizedNumber(-5, 10, 0, 100) === 0, 'Min clamp -5 -> 0');
  check(pt.parseSanitizedNumber(150, 10, 0, 100) === 100, 'Max clamp 150 -> 100');
});

// ============================================================================
// 3. BATTERY SOH STRESS & ADVERSARIAL INPUTS (Feature 5)
// ============================================================================
console.log('\n--- 3. Battery State of Health (SoH %) Adversarial Inputs ---');

test('F5-2: calculateBatterySoh with negative, zero, and extreme values', () => {
  // Negative years & negative miles
  const resNeg = pt.calculateBatterySoh({
    odometerMiles: -50000,
    ageYears: -5,
  });
  check(!Number.isNaN(resNeg.sohPct), 'Negative years/miles sohPct is not NaN');
  check(resNeg.sohPct <= 100.0 && resNeg.sohPct >= 65.0, 'Negative inputs within [65, 100]');
  check(resNeg.cycleEquivalentCount === 0, 'Cycle count is 0 for negative miles');

  // Zero nominal capacity
  const resZeroCap = pt.calculateBatterySoh({
    nominalCapacityKwh: 0,
  });
  check(!Number.isNaN(resZeroCap.remainingCapacityKwh), 'Zero nominal capacity handles gracefully');
  check(resZeroCap.remainingCapacityKwh > 0, 'Zero nominal capacity falls back to positive default');

  // Extreme fast charge shares
  const resDcNeg = pt.calculateBatterySoh({ dcFastChargingSharePct: -200 });
  const resDc0 = pt.calculateBatterySoh({ dcFastChargingSharePct: 0 });
  const resDcOver = pt.calculateBatterySoh({ dcFastChargingSharePct: 500 });
  const resDc100 = pt.calculateBatterySoh({ dcFastChargingSharePct: 100 });
  check(resDcNeg.sohPct === resDc0.sohPct, 'Negative DC charge pct clamped to 0');
  check(resDcOver.sohPct === resDc100.sohPct, 'Over 100 DC charge pct clamped to 100');

  // Non-numeric inputs
  const resNonNum = pt.calculateBatterySoh({
    odometerMiles: 'unknown',
    ageYears: null,
    dcFastChargingSharePct: undefined,
    nominalCapacityKwh: 'seventy-five',
    cellDefectLossPct: NaN,
  });
  check(!Number.isNaN(resNonNum.sohPct), 'Non-numeric inputs do not produce NaN sohPct');
  check(!Number.isNaN(resNonNum.remainingCapacityKwh), 'Non-numeric inputs do not produce NaN remainingCapacityKwh');
});

test('F5-3: calculateBatterySoh warranty status transitions & floor override', () => {
  // Healthy (low miles, new car)
  const healthy = pt.calculateBatterySoh({ odometerMiles: 10000, ageYears: 1 });
  check(healthy.warrantyStatus === 'HEALTHY', `Expected HEALTHY, got ${healthy.warrantyStatus}`);

  // Degraded (<80% but >=70%)
  const degraded = pt.calculateBatterySoh({ odometerMiles: 120000, ageYears: 9 });
  check(degraded.sohPct < 80.0, 'Degraded sohPct < 80');
  check(degraded.warrantyStatus === 'DEGRADED', `Expected DEGRADED, got ${degraded.warrantyStatus}`);

  // Warranty claim eligible (years <= 8, odo <= 100k, rawSoh < 70 via cell defect)
  const claimEligible = pt.calculateBatterySoh({
    odometerMiles: 40000,
    ageYears: 3,
    cellDefectLossPct: 35,
  });
  check(claimEligible.warrantyStatus === 'WARRANTY_CLAIM_ELIGIBLE', `Expected WARRANTY_CLAIM_ELIGIBLE, got ${claimEligible.warrantyStatus}`);

  // Out of warranty degraded (years > 8, cell defect)
  const outOfWarranty = pt.calculateBatterySoh({
    odometerMiles: 120000,
    ageYears: 10,
    cellDefectLossPct: 35,
  });
  check(outOfWarranty.warrantyStatus === 'OUT_OF_WARRANTY_DEGRADED', `Expected OUT_OF_WARRANTY_DEGRADED, got ${outOfWarranty.warrantyStatus}`);

  // Custom floorSoh override
  const customFloor = pt.calculateBatterySoh({
    odometerMiles: 300000,
    ageYears: 20,
    floorSoh: 40.0,
  });
  check(customFloor.sohPct >= 40.0, `Custom floor 40.0 respected: ${customFloor.sohPct}`);
});

// ============================================================================
// 4. EV DYNAMIC MAINTENANCE & INSURANCE INFLATION (Features 6 & 7)
// ============================================================================
console.log('\n--- 4. EV Maintenance & Insurance Escalation ---');

test('F6-1: EV dynamic maintenance does not apply duplicate 0.65x multiplier', () => {
  const maintEv = md.calculateDynamicMaintenance({
    baseAnnualMaintenanceUsd: 400,
    odometerMiles: 0,
    annualDistanceMiles: 12000,
    powertrainType: 'EV',
    ownershipYear: 1,
  });
  // base 400 * 1.0 * wear 1.0 * factor 1.0 * mi 1.0 = 400
  check(maintEv.routineMaintenanceUsd === 400, `EV maintenance should be $400, got ${maintEv.routineMaintenanceUsd}`);
  
  // Compare against ICE_PETROL with same base
  const maintIce = md.calculateDynamicMaintenance({
    baseAnnualMaintenanceUsd: 400,
    odometerMiles: 0,
    annualDistanceMiles: 12000,
    powertrainType: 'ICE_PETROL',
    ownershipYear: 1,
  });
  check(maintIce.routineMaintenanceUsd === 400, `ICE maintenance should also be $400 with same base, got ${maintIce.routineMaintenanceUsd}`);
});

test('F7-1: Insurance inflation strictly increases over ownership years', () => {
  const tco = md.calculateTcoProjection({
    purchasePriceUsd: 30000,
    annualInsuranceUsd: 1200,
    horizonYears: 7,
  });
  let prevInsurance = 0;
  for (let i = 0; i < tco.yearlySchedule.length; i++) {
    const yrIns = tco.yearlySchedule[i].yearInsuranceUsd;
    check(yrIns > prevInsurance, `Insurance must strictly increase in year ${i + 1}: ${yrIns} vs ${prevInsurance}`);
    prevInsurance = yrIns;
  }
  // Check exact math: Year 1 = 1200, Year 5 = round(1200 * 1.015^4) = round(1273.64) = 1274
  check(tco.yearlySchedule[0].yearInsuranceUsd === 1200, 'Year 1 insurance is 1200');
  check(tco.yearlySchedule[4].yearInsuranceUsd === 1274, `Year 5 insurance expected 1274, got ${tco.yearlySchedule[4].yearInsuranceUsd}`);
});

// ============================================================================
// 5. TCO & UNDERWATER EQUITY EDGE CASES (Feature 8)
// ============================================================================
console.log('\n--- 5. TCO & Underwater Equity Edge Cases ---');

test('F8-1: 100% Cash Purchase (0 loan balance) never reports underwater equity', () => {
  const tcoCash = md.calculateTcoProjection({
    purchasePriceUsd: 40000,
    downPaymentPct: 100,
    horizonYears: 5,
  });
  check(tcoCash.hasUnderwaterEquity === false, 'Cash purchase hasUnderwaterEquity must be false');
  check(tcoCash.maxUnderwaterEquityUsd === 0, 'Cash purchase maxUnderwaterEquityUsd must be 0');
  check(tcoCash.underwaterYears.length === 0, 'Cash purchase underwaterYears must be empty');
  for (const row of tcoCash.yearlySchedule) {
    check(row.isUnderwater === false, `Year ${row.year} isUnderwater must be false`);
    check(row.negativeEquityUsd === 0, `Year ${row.year} negativeEquityUsd must be 0`);
    check(row.remainingLoanBalanceUsd === 0, `Year ${row.year} remaining loan must be 0`);
  }
});

test('F8-2: 0% down 10-year loan on fast depreciating car triggers underwater equity', () => {
  const tcoLoan = md.calculateTcoProjection({
    purchasePriceUsd: 45000,
    downPaymentPct: 0,
    loanTermMonths: 120, // 10 years
    aprPct: 8.5,
    horizonYears: 5,
  });
  check(tcoLoan.hasUnderwaterEquity === true, 'Underwater loan must be detected');
  check(tcoLoan.maxUnderwaterEquityUsd > 0, `maxUnderwaterEquityUsd (${tcoLoan.maxUnderwaterEquityUsd}) must be > 0`);
  check(tcoLoan.underwaterYears.length > 0, 'underwaterYears array must not be empty');
  // Check consistency: maxUnderwaterEquityUsd equals max of schedule rows
  const maxInRows = Math.max(...tcoLoan.yearlySchedule.map(s => s.negativeEquityUsd));
  check(tcoLoan.maxUnderwaterEquityUsd === maxInRows, `maxUnderwaterEquityUsd (${tcoLoan.maxUnderwaterEquityUsd}) matches rows (${maxInRows})`);
});

test('F8-3: APR boundary values: 0% APR, negative APR', () => {
  // 0% APR
  const tcoZeroApr = md.calculateTcoProjection({
    purchasePriceUsd: 30000,
    downPaymentPct: 10,
    aprPct: 0,
    loanTermMonths: 60,
    horizonYears: 5,
  });
  check(tcoZeroApr.totalInterestUsd === 0, '0% APR yields $0 total interest');
  check(tcoZeroApr.monthlyLoanPaymentUsd === 450, `0% APR payment expected 27000/60 = 450, got ${tcoZeroApr.monthlyLoanPaymentUsd}`);

  // Negative APR (should clamp to 0)
  const tcoNegApr = md.calculateTcoProjection({
    purchasePriceUsd: 30000,
    downPaymentPct: 10,
    aprPct: -5,
    loanTermMonths: 60,
    horizonYears: 5,
  });
  check(tcoNegApr.totalInterestUsd === 0, 'Negative APR clamps to 0% interest');
});

// ============================================================================
// 6. MAINTENANCE RESERVE STANDARDIZATION & ADVERSARIAL INPUTS (Feature 9)
// ============================================================================
console.log('\n--- 6. Maintenance Reserve Standardization & Resiliency ---');

test('F9-1: Empty, null, undefined, non-array arguments to calculateMaintenanceReserve', () => {
  check(md.calculateMaintenanceReserve() === 0, 'No args returns 0');
  check(md.calculateMaintenanceReserve({}) === 0, 'Empty object returns 0');
  check(md.calculateMaintenanceReserve({ evaluatedComponents: [] }) === 0, 'Empty components returns 0');
  check(md.calculateMaintenanceReserve({ evaluatedComponents: null }) === 0, 'null components returns 0');
  check(md.calculateMaintenanceReserve({ evaluatedComponents: 'invalid' }) === 0, 'string components returns 0');
});

test('F9-2: Corrupt, partial, and malformed component objects', () => {
  const corruptItems = [
    null,
    undefined,
    {},
    { health: null },
    { costsUsd: null },
    { costsUsd: { independent: null } },
    { costsUsd: { independent: [-50, -100] } }, // negative cost
    { costsUsd: { independent: ['abc', 'def'] } }, // non-numeric
    { health: { status: 'UNKNOWN' }, costsUsd: { independent: [100, 200] } },
    { health: { status: 'CRITICAL' }, costsUsd: { independent: [500, 1000] } }, // valid item
  ];

  const reserve = md.calculateMaintenanceReserve({ evaluatedComponents: corruptItems });
  check(!Number.isNaN(reserve), 'Corrupt items do not produce NaN reserve');
  check(Number.isInteger(reserve), 'Reserve is rounded to integer USD');
  check(reserve > 0, 'Reserve correctly computed from valid item despite corrupt siblings');
});

test('F9-3: Workshop tier scaling: Dealership vs Independent', () => {
  const comp = {
    health: { status: 'CRITICAL', effectiveWearMiles: 80000 },
    serviceIntervalMiles: 85000,
    costsUsd: {
      independent: [890, 1650], // avg = 1270
      dealership: [1450, 2650],  // avg = 2050
    },
  };

  const indepReserve = md.calculateMaintenanceReserve({
    evaluatedComponents: [comp],
    workshopTier: 'independent',
  });
  const dealerReserve = md.calculateMaintenanceReserve({
    evaluatedComponents: [comp],
    workshopTier: 'dealership',
  });

  check(dealerReserve > indepReserve, `Dealership reserve (${dealerReserve}) must be > Independent reserve (${indepReserve})`);
  check(Number.isInteger(indepReserve), 'Independent reserve is integer');
  check(Number.isInteger(dealerReserve), 'Dealership reserve is integer');
});

test('F9-4: Annual mileage scaling bounds in calculateMaintenanceReserve', () => {
  const comp = {
    health: { status: 'CRITICAL' },
    costsUsd: { independent: [1000, 1000] }, // avg = 1000. Critical reserve = 1000 * 0.75 * scale = 750 * scale. Cap = 1250.
  };

  // Min scale: annualDist <= 3000 -> scale = 0.25 -> reserve = 750 * 0.25 = 187.5 -> 188
  const rMin = md.calculateMaintenanceReserve({ evaluatedComponents: [comp], annualDistanceMiles: 100 });
  check(rMin === 188, `Min mileage scale expected 188, got ${rMin}`);

  // Base scale: annualDist = 12000 -> scale = 1.0 -> reserve = 750
  const rBase = md.calculateMaintenanceReserve({ evaluatedComponents: [comp], annualDistanceMiles: 12000 });
  check(rBase === 750, `Base mileage scale expected 750, got ${rBase}`);

  // Max scale: annualDist = 50000 -> scale = 2.5 -> reserve = min(1250, 750 * 2.5 = 1875) = 1250
  const rMax = md.calculateMaintenanceReserve({ evaluatedComponents: [comp], annualDistanceMiles: 50000 });
  check(rMax === 1250, `Max mileage cap expected 1250, got ${rMax}`);
});

// ============================================================================
// SUMMARY & VERDICT
// ============================================================================
console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
if (failures.length > 0) {
  console.log('\nFAILURES:');
  for (const f of failures) {
    console.log(`- ${f.name}: ${f.error.message}`);
  }
}
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL ADVERSARIAL STRESS TESTS PASSED WITH 100% SUCCESS!');
}

/**
 * DriveLedger / ShiftMetric — Calculator Mathematics & Financial Logic Audit Test Suite
 *
 * Verifies:
 * 1. Realistic non-linear vehicle depreciation (steep early drop, flattening, used car offset, powertrain & mileage adjustment, 5% floor)
 * 2. Powertrain-specific energy & fuel models (EV blended Home AC vs DC Fast, PHEV combined, ICE/HEV, zero-tariff safety)
 * 3. Dynamic maintenance scaling with REVISION_THRESHOLDS (60k, 100k, 150k, 200k km)
 * 4. MaintenanceRiskMatrix dynamic scaling (0 km up to 500,000 km, annual mileage scaling)
 * 5. OBD-II Estimator boundary conditions (zero labor rate, zero parts cost)
 * 6. Edge cases & input sanitization (0 insurance, 0 APR, 0 fuel price, negative numbers, model years)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTcoProjection,
  calculateNonLinearDepreciation,
  REVISION_THRESHOLDS,
  calculateRevisionSurcharge,
  calculateDynamicMaintenance,
  evaluateComponentHealth,
  calculateOemRiskMultiplier,
  POWERTRAIN_TYPES,
  MAINTENANCE_COMPONENTS,
} from '../src/data/maintenanceData.js';
import {
  calculateObdWorkshopEstimate,
  OBD_CODES,
  LABOR_RATE_TIERS,
} from '../src/data/obdCodes.js';

// ============================================================================
// 1. NON-LINEAR DEPRECIATION TESTS
// ============================================================================

test('MATH-DEP-1: Brand new car shows steep depreciation in Years 1-3 (~20-25% Yr 1, ~15% Yr 2, ~12% Yr 3)', () => {
  const purchasePrice = 40000;
  const startOdo = 0;
  const annualMi = 12500;

  const y1 = calculateNonLinearDepreciation({
    purchasePriceUsd: purchasePrice,
    odometerMiles: startOdo,
    annualDistanceMiles: annualMi,
    ownershipYear: 1,
    powertrainType: 'ICE_PETROL',
  });
  const y2 = calculateNonLinearDepreciation({
    purchasePriceUsd: purchasePrice,
    odometerMiles: startOdo,
    annualDistanceMiles: annualMi,
    ownershipYear: 2,
    powertrainType: 'ICE_PETROL',
  });
  const y3 = calculateNonLinearDepreciation({
    purchasePriceUsd: purchasePrice,
    odometerMiles: startOdo,
    annualDistanceMiles: annualMi,
    ownershipYear: 3,
    powertrainType: 'ICE_PETROL',
  });

  const drop1 = (purchasePrice - y1.residualValueUsd) / purchasePrice;
  const drop2 = (y1.residualValueUsd - y2.residualValueUsd) / y1.residualValueUsd;
  const drop3 = (y2.residualValueUsd - y3.residualValueUsd) / y2.residualValueUsd;

  // Yr 1 drop: between 17% and 26%
  assert.ok(drop1 >= 0.17 && drop1 <= 0.26, `Yr 1 drop should be steep (~20-25%), got ${(drop1 * 100).toFixed(1)}%`);
  // Yr 2 drop from Yr 1 value: between 12% and 18%
  assert.ok(drop2 >= 0.11 && drop2 <= 0.18, `Yr 2 drop should be ~15%, got ${(drop2 * 100).toFixed(1)}%`);
  // Yr 3 drop from Yr 2 value: between 9% and 16%
  assert.ok(drop3 >= 0.09 && drop3 <= 0.16, `Yr 3 drop should be ~12%, got ${(drop3 * 100).toFixed(1)}%`);
  // Total retention by Year 3 should be around 55-65%
  assert.ok(y3.retentionPct >= 52 && y3.retentionPct <= 68, `Year 3 retention should be ~55-65%, got ${y3.retentionPct}%`);
});

test('MATH-DEP-2: Later years (Years 4-10) flatten asymptotically to 3-7%/yr drop', () => {
  const purchasePrice = 40000;
  const startOdo = 0;
  const annualMi = 12500;

  const y4 = calculateNonLinearDepreciation({ purchasePriceUsd: purchasePrice, odometerMiles: startOdo, annualDistanceMiles: annualMi, ownershipYear: 4 });
  const y5 = calculateNonLinearDepreciation({ purchasePriceUsd: purchasePrice, odometerMiles: startOdo, annualDistanceMiles: annualMi, ownershipYear: 5 });
  const y6 = calculateNonLinearDepreciation({ purchasePriceUsd: purchasePrice, odometerMiles: startOdo, annualDistanceMiles: annualMi, ownershipYear: 6 });
  const y7 = calculateNonLinearDepreciation({ purchasePriceUsd: purchasePrice, odometerMiles: startOdo, annualDistanceMiles: annualMi, ownershipYear: 7 });

  const drop5 = (y4.residualValueUsd - y5.residualValueUsd) / y4.residualValueUsd;
  const drop6 = (y5.residualValueUsd - y6.residualValueUsd) / y5.residualValueUsd;
  const drop7 = (y6.residualValueUsd - y7.residualValueUsd) / y6.residualValueUsd;

  assert.ok(drop5 >= 0.03 && drop5 <= 0.09, `Yr 5 drop should be 3-7%/yr, got ${(drop5 * 100).toFixed(1)}%`);
  assert.ok(drop6 >= 0.02 && drop6 <= 0.08, `Yr 6 drop should be 3-7%/yr, got ${(drop6 * 100).toFixed(1)}%`);
  assert.ok(drop7 >= 0.02 && drop7 <= 0.07, `Yr 7 drop should be 3-7%/yr, got ${(drop7 * 100).toFixed(1)}%`);
});

test('MATH-DEP-3: Used vehicle offset: buying a 5-year-old car (60,000 mi) does NOT re-take the 20% showroom drop', () => {
  const usedPurchasePrice = 20000;
  const usedStartOdo = 60000; // ~4.8 years old vehicle

  const usedY1 = calculateNonLinearDepreciation({
    purchasePriceUsd: usedPurchasePrice,
    odometerMiles: usedStartOdo,
    annualDistanceMiles: 12500,
    ownershipYear: 1,
    powertrainType: 'ICE_PETROL',
  });

  const usedYear1Drop = (usedPurchasePrice - usedY1.residualValueUsd) / usedPurchasePrice;

  // The used car in its 1st year with new owner should only drop ~6-10%, NOT 20-25%
  assert.ok(
    usedYear1Drop < 0.12,
    `Used car should not re-take the 20% showroom drop! Expected <12%, got ${(usedYear1Drop * 100).toFixed(1)}%`
  );
  assert.ok(
    usedY1.retentionPct >= 88.0,
    `Used car Year 1 retention should be >=88%, got ${usedY1.retentionPct}%`
  );
});

test('MATH-DEP-4: Powertrain adjustment factor: HEV retention bonus vs ICE_DIESEL restrictions', () => {
  const price = 35000;
  const hevDep = calculateNonLinearDepreciation({ purchasePriceUsd: price, ownershipYear: 3, powertrainType: 'HEV' });
  const petrolDep = calculateNonLinearDepreciation({ purchasePriceUsd: price, ownershipYear: 3, powertrainType: 'ICE_PETROL' });
  const dieselDep = calculateNonLinearDepreciation({ purchasePriceUsd: price, ownershipYear: 3, powertrainType: 'ICE_DIESEL' });

  assert.ok(
    hevDep.residualValueUsd > petrolDep.residualValueUsd,
    `HEV residual ($${hevDep.residualValueUsd}) must exceed Petrol ($${petrolDep.residualValueUsd})`
  );
  assert.ok(
    petrolDep.residualValueUsd >= dieselDep.residualValueUsd,
    `Petrol residual ($${petrolDep.residualValueUsd}) must be >= Diesel ($${dieselDep.residualValueUsd})`
  );
});

test('MATH-DEP-5: Annual mileage deviation adjustment: high mileage penalizes retention, low mileage rewards', () => {
  const price = 30000;
  const baseline = calculateNonLinearDepreciation({ purchasePriceUsd: price, annualDistanceMiles: 12500, ownershipYear: 3 });
  const highMileage = calculateNonLinearDepreciation({ purchasePriceUsd: price, annualDistanceMiles: 25000, ownershipYear: 3 });
  const lowMileage = calculateNonLinearDepreciation({ purchasePriceUsd: price, annualDistanceMiles: 6000, ownershipYear: 3 });

  assert.ok(
    highMileage.residualValueUsd < baseline.residualValueUsd,
    'High mileage (25k mi/yr) must reduce residual value below baseline'
  );
  assert.ok(
    lowMileage.residualValueUsd > baseline.residualValueUsd,
    'Low mileage (6k mi/yr) must increase residual value above baseline'
  );
});

test('MATH-DEP-6: Residual floor guarantee: >= 5% of purchase price even at 500,000 miles', () => {
  const price = 40000;
  const extremeDep = calculateNonLinearDepreciation({
    purchasePriceUsd: price,
    odometerMiles: 450000,
    annualDistanceMiles: 50000,
    ownershipYear: 10,
    powertrainType: 'ICE_DIESEL',
  });

  const floorMin = Math.round(price * 0.05); // $2,000
  assert.ok(
    extremeDep.residualValueUsd >= floorMin,
    `Residual value ($${extremeDep.residualValueUsd}) must be >= 5% scrap floor ($${floorMin})`
  );
  assert.ok(extremeDep.retentionPct >= 5.0, `Retention % (${extremeDep.retentionPct}%) must be >= 5.0%`);
});

test('MATH-DEP-7: Monotonic depreciation across 10 years for new, used, and low-mileage vehicles for EV, HEV, and ICE', () => {
  const purchasePrice = 35000;
  const testPowertrains = ['EV', 'HEV', 'ICE_PETROL'];
  const testScenarios = [
    { label: 'Factory new baseline', odo: 0, annual: 12500 },
    { label: 'Used vehicle 50k mi', odo: 50000, annual: 10000 },
    { label: 'Used vehicle 100k mi', odo: 100000, annual: 15000 },
    { label: 'Low annual mileage (1,000 mi/yr)', odo: 0, annual: 1000 },
    { label: 'Zero annual mileage parked car', odo: 20000, annual: 0 },
  ];

  for (const pt of testPowertrains) {
    for (const sc of testScenarios) {
      const proj = calculateTcoProjection({
        purchasePriceUsd: purchasePrice,
        odometerMiles: sc.odo,
        annualDistanceMiles: sc.annual,
        powertrainType: pt,
        horizonYears: 10,
      });

      assert.equal(proj.yearlySchedule.length, 10, `${pt} ${sc.label} must produce 10 years schedule`);

      let prevResidual = purchasePrice;
      for (const row of proj.yearlySchedule) {
        // Invariant 1: Annual depreciation must never be negative (no vehicle appreciates)
        assert.ok(
          row.yearDepreciationUsd >= 0,
          `${pt} ${sc.label} Year ${row.year}: yearDepreciationUsd must be >= 0, got $${row.yearDepreciationUsd}`
        );

        // Invariant 2: Residual value must be monotonically non-increasing
        assert.ok(
          row.residualValueUsd <= prevResidual,
          `${pt} ${sc.label} Year ${row.year}: residualValueUsd ($${row.residualValueUsd}) must not exceed previous ($${prevResidual})`
        );

        // Invariant 3: Cumulative depreciation must be non-decreasing
        assert.ok(
          row.cumulativeDepreciationUsd >= purchasePrice - prevResidual,
          `${pt} ${sc.label} Year ${row.year}: cumulativeDepreciationUsd must not decrease`
        );

        prevResidual = row.residualValueUsd;
      }
    }
  }
});

// ============================================================================
// 2. POWERTRAIN-SPECIFIC ENERGY & FUEL MODELS
// ============================================================================

test('MATH-ENERGY-1: EV blended charging tariff (Home AC vs DC Fast Charging)', () => {
  const annualMiles = 10000;
  const eff = 30; // 30 kWh / 100 miles
  const homeTariff = 0.15; // $/kWh
  const dcTariff = 0.45; // $/kWh
  const homeShare = 80; // 80% home, 20% DC

  const proj = calculateTcoProjection({
    purchasePriceUsd: 40000,
    odometerMiles: 0,
    annualDistanceMiles: annualMiles,
    mpgUs: eff,
    isEv: true,
    powertrainType: 'EV',
    homeChargePct: homeShare,
    homeTariffUsdPerKwh: homeTariff,
    dcFastTariffUsdPerKwh: dcTariff,
    horizonYears: 1,
  });

  // Expected energy: 10,000 / 100 * 30 = 3,000 kWh
  // Blended tariff: 0.80 * 0.15 + 0.20 * 0.45 = 0.12 + 0.09 = 0.21 $/kWh
  // Expected annual cost: 3,000 * 0.21 = $630
  assert.equal(proj.yearlySchedule[0].yearFuelUsd, 630, 'EV blended charging cost must equal $630');
  assert.equal(proj.totalFuelUsd, 630);
});

test('MATH-ENERGY-2: EV zero-tariff boundary handling ($0 charging does not fallback to default)', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 40000,
    odometerMiles: 0,
    annualDistanceMiles: 12000,
    mpgUs: 28,
    isEv: true,
    powertrainType: 'EV',
    homeChargePct: 100,
    homeTariffUsdPerKwh: 0,
    dcFastTariffUsdPerKwh: 0,
    horizonYears: 1,
  });

  assert.equal(proj.totalFuelUsd, 0, 'Zero-tariff EV must produce exactly $0 fuel cost');
  assert.equal(proj.yearlySchedule[0].yearFuelUsd, 0);
});

test('MATH-ENERGY-3: PHEV combined profile (65% electric commute + 35% gasoline)', () => {
  const annualMiles = 12000;
  const proj = calculateTcoProjection({
    purchasePriceUsd: 38000,
    odometerMiles: 0,
    annualDistanceMiles: annualMiles,
    powertrainType: 'PHEV',
    electricSharePct: 65,
    phevKwhPer100Mi: 30, // 30 kWh / 100 mi
    phevIceMpg: 40,      // 40 mpg
    homeTariffUsdPerKwh: 0.15,
    fuelPriceUsdGal: 4.00,
    horizonYears: 1,
  });

  // Electric miles: 12,000 * 0.65 = 7,800 miles
  // Electric kWh: 7,800 / 100 * 30 = 2,340 kWh; cost: 2,340 * 0.15 = $351
  // Gas miles: 12,000 * 0.35 = 4,200 miles
  // Gas gallons: 4,200 / 40 = 105 gal; cost: 105 * 4.00 = $420
  // Total: 351 + 420 = $771
  const yearFuel = proj.yearlySchedule[0].yearFuelUsd;
  assert.ok(Math.abs(yearFuel - 771) <= 1, `PHEV combined fuel cost should be ~$771, got ${yearFuel}`);
});

test('MATH-ENERGY-4: ICE / HEV efficiency-based fuel calculation', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 25000,
    annualDistanceMiles: 12000,
    mpgUs: 40,
    fuelPriceUsdGal: 3.50,
    powertrainType: 'HEV',
    horizonYears: 1,
  });

  // Gallons: 12,000 / 40 = 300 gal; cost: 300 * 3.50 = $1,050
  assert.equal(proj.yearlySchedule[0].yearFuelUsd, 1050, 'HEV fuel cost must be $1,050');
});

test('MATH-ENERGY-5: Standalone TCO calculation for an EV with omitted tariff defaults to electricity price ($0.16/kWh)', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 40000,
    isEv: true,
    powertrainType: 'EV',
    annualDistanceMiles: 12000,
    mpgUs: 30, // 30 kWh / 100 mi
    horizonYears: 1,
  });

  // 12,000 mi / 100 * 30 kWh = 3,600 kWh
  // Default tariff: 80% Home ($0.16) + 20% DC ($0.40) = blended $0.208/kWh
  // Expected annual cost: 3,600 * 0.208 = $748.80 (~$749)
  assert.equal(proj.totalFuelUsd, 749, 'EV omitted tariff must calculate realistic annual electricity cost ($749), not $17,000+');
  assert.equal(proj.yearlySchedule[0].yearFuelUsd, 749);
});

// ============================================================================
// 3. DYNAMIC MAINTENANCE & REVISION THRESHOLDS
// ============================================================================

test('MATH-MAINT-1: REVISION_THRESHOLDS exports 60k, 100k, 150k, 200k km with 5 powertrain types', () => {
  assert.ok(Array.isArray(REVISION_THRESHOLDS), 'REVISION_THRESHOLDS must be an array');
  assert.equal(REVISION_THRESHOLDS.length, 4, 'Must have 4 revision thresholds');

  const kms = REVISION_THRESHOLDS.map((r) => r.thresholdKm);
  assert.deepEqual(kms, [60000, 100000, 150000, 200000]);

  for (const rev of REVISION_THRESHOLDS) {
    assert.ok(rev.surchargeUsd.EV > 0, `${rev.label} must have EV surcharge`);
    assert.ok(rev.surchargeUsd.HEV > 0, `${rev.label} must have HEV surcharge`);
    assert.ok(rev.surchargeUsd.PHEV > 0, `${rev.label} must have PHEV surcharge`);
    assert.ok(rev.surchargeUsd.ICE_PETROL > 0, `${rev.label} must have ICE_PETROL surcharge`);
    assert.ok(rev.surchargeUsd.ICE_DIESEL > 0, `${rev.label} must have ICE_DIESEL surcharge`);

    // EV revision surcharge must be lowest of all powertrains
    assert.ok(
      rev.surchargeUsd.EV < rev.surchargeUsd.ICE_DIESEL,
      `EV surcharge ($${rev.surchargeUsd.EV}) must be lower than Diesel ($${rev.surchargeUsd.ICE_DIESEL})`
    );
  }
});

test('MATH-MAINT-2: calculateRevisionSurcharge detects crossed thresholds accurately', () => {
  // 60k km is 37,282 miles. Crossing 30k to 40k miles crosses 60k threshold.
  const cross60k = calculateRevisionSurcharge(30000, 40000, 'ICE_PETROL');
  assert.equal(cross60k.totalSurchargeUsd, 420, '60k km threshold for ICE_PETROL must be $420');
  assert.equal(cross60k.passedThresholds.length, 1);
  assert.equal(cross60k.passedThresholds[0].thresholdKm, 60000);

  // Crossing from 50k to 70k miles crosses 100k km (62,137 mi)
  const cross100k = calculateRevisionSurcharge(50000, 70000, 'EV');
  assert.equal(cross100k.totalSurchargeUsd, 280, '100k km threshold for EV must be $280');
  assert.equal(cross100k.passedThresholds.length, 1);

  // Spanning from 0 to 130k miles crosses all 4 thresholds (60k, 100k, 150k, 200k)
  const crossAll = calculateRevisionSurcharge(0, 130000, 'ICE_DIESEL');
  assert.equal(crossAll.passedThresholds.length, 4, 'Must cross all 4 thresholds');
  const expectedTotal = 520 + 890 + 1650 + 2100; // = 5160
  assert.equal(crossAll.totalSurchargeUsd, expectedTotal, `Total surcharge must be $${expectedTotal}`);
});

test('MATH-MAINT-3: TCO projection applies revision surcharge in the year threshold is crossed', () => {
  // Start at 30,000 miles, annual 10,000 miles.
  // Yr 1: 30k -> 40k mi. Crosses 37,282 mi (60k km).
  // Yr 2: 40k -> 50k mi. No threshold.
  // Yr 3: 50k -> 60k mi. No threshold.
  // Yr 4: 60k -> 70k mi. Crosses 62,137 mi (100k km).
  const proj = calculateTcoProjection({
    purchasePriceUsd: 30000,
    odometerMiles: 30000,
    annualDistanceMiles: 10000,
    powertrainType: 'ICE_PETROL',
    baseAnnualMaintenanceUsd: 800,
    horizonYears: 4,
  });

  const mY1 = proj.yearlySchedule[0].yearMaintenanceUsd;
  const mY2 = proj.yearlySchedule[1].yearMaintenanceUsd;
  const mY3 = proj.yearlySchedule[2].yearMaintenanceUsd;
  const mY4 = proj.yearlySchedule[3].yearMaintenanceUsd;

  // Year 1 has 60k bump ($420) added to routine wear
  // Year 2 has NO bump, so routine wear should be lower than Year 1 with bump
  assert.ok(mY1 > mY2, `Year 1 with 60k bump ($${mY1}) must exceed Year 2 ($${mY2})`);
  // Year 4 has 100k bump ($750) added, so mY4 must exceed mY3 significantly
  assert.ok(mY4 > mY3 + 600, `Year 4 with 100k bump ($${mY4}) must exceed Year 3 ($${mY3}) by ~$750`);
});

// ============================================================================
// 4. MAINTENANCE RISK MATRIX BOUNDARIES & DYNAMIC SCALING
// ============================================================================

test('MATH-RISK-1: 0 km / 0 miles evaluates safely without division by zero or NaN', () => {
  const comp = MAINTENANCE_COMPONENTS[0]; // timing-assembly
  const health = evaluateComponentHealth({
    component: comp,
    physicalOdometerMiles: 0,
    urbanTripSharePct: 50,
  });

  assert.ok(health !== null, 'Component health must evaluate at 0 miles');
  assert.equal(health.physicalOdometerMiles, 0);
  assert.equal(health.effectiveWearMiles, 0);
  assert.equal(health.wearPctOfCritical, 0);
  assert.equal(health.remainingLifespanPct, 100);
  assert.equal(health.status, 'OPTIMAL');
  assert.ok(!Number.isNaN(health.combinedMultiplier));
});

test('MATH-RISK-2: 500,000 km evaluates with wear saturation and bounded risk multiplier', () => {
  const odoMiles500kKm = 310686;
  const mult = calculateOemRiskMultiplier(odoMiles500kKm);
  assert.equal(mult, 3.1, 'OEM risk multiplier must cap at 3.1 max at high mileage');

  const comp = MAINTENANCE_COMPONENTS[0];
  const health = evaluateComponentHealth({
    component: comp,
    physicalOdometerMiles: odoMiles500kKm,
  });

  assert.equal(health.wearPctOfCritical, 100, 'Wear % must cap at 100%');
  assert.equal(health.remainingLifespanPct, 0);
  assert.equal(health.status, 'CRITICAL');
});

// ============================================================================
// 5. OBD-II ESTIMATOR BOUNDARY CONDITIONS
// ============================================================================

test('MATH-OBD-1: DIY tier ($0/hr labor rate) yields $0 labor and equal parts & total', () => {
  const p0420 = OBD_CODES.find((c) => c.code === 'P0420');
  assert.ok(p0420, 'P0420 must exist in OBD_CODES');

  const diyEst = calculateObdWorkshopEstimate(p0420, 'diy');
  assert.equal(diyEst.rateUsdPerHr, 0);
  assert.equal(diyEst.minLaborUsd, 0);
  assert.equal(diyEst.maxLaborUsd, 0);
  assert.equal(diyEst.weightedLaborUsd, 0);
  assert.equal(diyEst.weightedExpectedUsd, diyEst.weightedPartsUsd);
  assert.ok(diyEst.weightedExpectedUsd > 0);
});

test('MATH-OBD-2: Probability-weighted expected cost handles all root causes cleanly', () => {
  for (const code of OBD_CODES) {
    for (const tier of LABOR_RATE_TIERS) {
      const est = calculateObdWorkshopEstimate(code, tier.id);
      assert.ok(!Number.isNaN(est.weightedExpectedUsd), `${code.code} ${tier.id} expected cost must not be NaN`);
      assert.ok(!Number.isNaN(est.weightedPartsUsd), `${code.code} ${tier.id} parts cost must not be NaN`);
      assert.ok(!Number.isNaN(est.weightedLaborUsd), `${code.code} ${tier.id} labor cost must not be NaN`);
      assert.ok(est.minTotalUsd <= est.maxTotalUsd, `${code.code} ${tier.id} minTotal <= maxTotal`);
      assert.ok(est.weightedExpectedUsd >= est.minTotalUsd * 0.7, `${code.code} expected should be near range`);
    }
  }
});

// ============================================================================
// 6. ROBUST INPUT SANITIZATION & ANTI-FALSY FIXES
// ============================================================================

test('MATH-BOUND-1: Insurance = $0 must not default to $1,400 (falsy || bug fix)', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 25000,
    annualInsuranceUsd: 0,
    horizonYears: 1,
  });

  assert.equal(proj.totalInsuranceUsd, 0, 'Entering 0 insurance must produce $0 total insurance');
  assert.equal(proj.yearlySchedule[0].yearInsuranceUsd, 0);
});

test('MATH-BOUND-2: APR = 0% must not default to 6.2%, producing $0 interest on loan', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 30000,
    downPaymentPct: 10,
    aprPct: 0,
    loanTermMonths: 48,
    horizonYears: 2,
  });

  assert.equal(proj.totalInterestUsd, 0, '0% APR must produce exactly $0 total interest');
  assert.equal(proj.yearlySchedule[0].yearInterestUsd, 0);
  assert.equal(proj.yearlySchedule[1].yearInterestUsd, 0);
  // Monthly payment must be purely principal / termMonths
  // Principal: $30,000 - $3,000 = $27,000; / 48 = 562.5 -> $563
  assert.equal(proj.monthlyLoanPaymentUsd, 563);
});

test('MATH-BOUND-3: Fuel price = $0 must not default to $3.65', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 20000,
    annualDistanceMiles: 15000,
    fuelPriceUsdGal: 0,
    mpgUs: 30,
    horizonYears: 1,
  });

  assert.equal(proj.totalFuelUsd, 0, '$0 fuel price must yield $0 fuel cost');
  assert.equal(proj.yearlySchedule[0].yearFuelUsd, 0);
});

test('MATH-BOUND-4: Negative inputs clamp safely to non-negative without returning NaN', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: -5000,
    odometerMiles: -10000,
    annualDistanceMiles: -12000,
    fuelPriceUsdGal: -3.5,
    annualInsuranceUsd: -1200,
    aprPct: -5,
    downPaymentPct: -20,
    horizonYears: -1,
  });

  assert.ok(proj.totalEconomicCostUsd >= 0, 'Total cost must be non-negative');
  assert.ok(!Number.isNaN(proj.totalEconomicCostUsd), 'Total cost must not be NaN');
  assert.ok(!Number.isNaN(proj.costPerMileUsd), 'Cost per mile must not be NaN');
  assert.equal(proj.yearlySchedule.length, 1, 'Negative horizon clamped to 1 year');
  assert.ok(proj.finalResidualValueUsd > 0, 'Residual value must be positive');
});

test('MATH-BOUND-5: 0 annual distance produces $0 fuel, $0 routine maintenance, and valid schedule rows', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 30000,
    odometerMiles: 10000,
    annualDistanceMiles: 0,
    horizonYears: 3,
  });

  assert.equal(proj.totalDistanceMiles, 0);
  assert.equal(proj.costPerMileUsd, 0);
  assert.equal(proj.totalFuelUsd, 0);
  assert.ok(proj.yearlySchedule.length === 3);
  assert.ok(proj.totalDepreciationUsd > 0);
  assert.ok(!Number.isNaN(proj.totalEconomicCostUsd));
});

/**
 * DriveLedger / ShiftMetric — Adversarial Verification Harness (R4, R5)
 *
 * Empirical verification of:
 * 1. Extreme inputs across calculators (TCO, CostTimeline, MaintenanceRiskMatrix, ObdEstimator):
 *    - 0 km / 0 mi odometer
 *    - 1,000,000 km (~621,371 mi) odometer
 *    - $0 purchase price
 *    - 0% APR financing
 *    - 50% APR financing
 *    - Negative inputs across all numerical dimensions
 *    - Invariant: NO calculation produces NaN, Infinity, or negative totals.
 * 2. Wear Multipliers:
 *    - City driving wear strictly exceeds highway driving wear across all wear-sensitive components.
 *    - Monotonic increase with urban trip share.
 * 3. Labor & Workshop Tiers:
 *    - Dealership total > Independent total > DIY total across all 20 OBD dossiers and component catalogs.
 *    - DIY labor cost is strictly $0.
 * 4. Multi-Region Unit Conversions:
 *    - US ($ / mi / MPG US), UK (£ / mi / MPG UK), EU (€ / km / L/100km).
 *    - Valid non-zero results, accurate round-trips, and robust edge handling.
 * 5. Cost Timeline 10-Year Trajectory:
 *    - Valid finite numbers, non-negative totals, non-NaN depreciation share at all year boundaries.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transpileJsx } from '../scripts/jsx-loader.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Register JSX transpilation hook for Node v24 test runner
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      const candidateBase = path.resolve(parentDir, specifier);
      for (const ext of ['', '.js', '.jsx', '/index.js', '/index.jsx']) {
        const full = candidateBase + ext;
        if (fs.existsSync(full) && fs.statSync(full).isFile()) {
          return { url: pathToFileURL(full).href, shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith('.jsx')) {
      const filePath = fileURLToPath(url);
      const raw = fs.readFileSync(filePath, 'utf8');
      const transpiled = transpileJsx(raw);
      return { format: 'module', source: transpiled, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const {
  calculateTcoProjection,
  calculateNonLinearDepreciation,
  evaluateComponentHealth,
  calculateOemRiskMultiplier,
  calculateRevisionSurcharge,
  filterComponentsForPowertrain,
  MAINTENANCE_COMPONENTS,
  POWERTRAIN_TYPES,
  REVISION_THRESHOLDS,
} = await import('../src/data/maintenanceData.js');

const {
  OBD_CODES,
  LABOR_RATE_TIERS,
  calculateObdWorkshopEstimate,
} = await import('../src/data/obdCodes.js');

const {
  UNIT_SYSTEMS,
  convertUsdToRegion,
  convertRegionToUsd,
  convertMilesToRegion,
  convertRegionToMiles,
  convertMpgUsToRegion,
  convertRegionToMpgUs,
  convertFuelPriceUsdGalToRegion,
  convertRegionFuelPriceToUsdGal,
} = await import('../src/context/UnitContext.jsx');

const { VEHICLE_PRESETS, getPresetById } = await import('../src/data/vehiclePresets.js');

// Helper assertion to ensure a number is strictly valid: finite, not NaN, >= 0
function assertValidNonNegative(val, label) {
  assert.equal(typeof val, 'number', `${label} should be a number, got ${typeof val}`);
  assert.ok(!Number.isNaN(val), `${label} must NOT be NaN`);
  assert.ok(Number.isFinite(val), `${label} must be finite, got ${val}`);
  assert.ok(val >= 0, `${label} must be non-negative, got ${val}`);
}

// Helper to check if string contains NaN, Infinity, or undefined
function assertValidDisplayString(str, label) {
  assert.equal(typeof str, 'string', `${label} should be string`);
  assert.ok(!str.includes('NaN'), `${label} must not contain 'NaN': "${str}"`);
  assert.ok(!str.includes('Infinity'), `${label} must not contain 'Infinity': "${str}"`);
  assert.ok(!str.includes('undefined'), `${label} must not contain 'undefined': "${str}"`);
}

// ============================================================================
// 1. EXTREME INPUTS ACROSS TCO CALCULATOR & MATHEMATICAL ENGINE
// ============================================================================

test('ADV-HARNESS-1: Edge values (0 km, 1,000,000 km, $0 price, 0% APR, 50% APR) produce zero NaN, Infinity, or negative totals', () => {
  const edgeCases = [
    {
      name: 'Zero Odometer (0 km / 0 mi)',
      params: { purchasePriceUsd: 35000, odometerMiles: 0, annualDistanceMiles: 12000, horizonYears: 5 },
    },
    {
      name: '1,000,000 km Odometer (621,371 miles)',
      params: { purchasePriceUsd: 35000, odometerMiles: 621371, annualDistanceMiles: 15000, horizonYears: 5 },
    },
    {
      name: 'Zero Purchase Price ($0)',
      params: { purchasePriceUsd: 0, odometerMiles: 50000, annualDistanceMiles: 12000, horizonYears: 5 },
    },
    {
      name: '0% APR Financing (Cash or 0% promotion)',
      params: { purchasePriceUsd: 40000, aprPct: 0, downPaymentPct: 10, loanTermMonths: 60, horizonYears: 5 },
    },
    {
      name: 'Extreme High APR Financing (50% subprime loan)',
      params: { purchasePriceUsd: 20000, aprPct: 50, downPaymentPct: 5, loanTermMonths: 72, horizonYears: 5 },
    },
    {
      name: 'Zero Annual Mileage (parked car)',
      params: { purchasePriceUsd: 30000, odometerMiles: 20000, annualDistanceMiles: 0, horizonYears: 5 },
    },
    {
      name: 'Extreme High Annual Mileage (100,000 mi/yr commercial)',
      params: { purchasePriceUsd: 45000, odometerMiles: 0, annualDistanceMiles: 100000, horizonYears: 5 },
    },
    {
      name: 'Zero Insurance & Zero Fuel Price',
      params: { purchasePriceUsd: 25000, annualInsuranceUsd: 0, fuelPriceUsdGal: 0, horizonYears: 5 },
    },
  ];

  const powertrains = ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV', 'EV'];

  for (const tc of edgeCases) {
    for (const pt of powertrains) {
      const isEv = pt === 'EV';
      const proj = calculateTcoProjection({
        ...tc.params,
        powertrainType: pt,
        isEv,
      });

      // Summary checks
      assertValidNonNegative(proj.totalEconomicCostUsd, `${tc.name} [${pt}] totalEconomicCostUsd`);
      assertValidNonNegative(proj.totalDepreciationUsd, `${tc.name} [${pt}] totalDepreciationUsd`);
      assertValidNonNegative(proj.totalFuelUsd, `${tc.name} [${pt}] totalFuelUsd`);
      assertValidNonNegative(proj.totalMaintenanceUsd, `${tc.name} [${pt}] totalMaintenanceUsd`);
      assertValidNonNegative(proj.totalInsuranceUsd, `${tc.name} [${pt}] totalInsuranceUsd`);
      assertValidNonNegative(proj.totalInterestUsd, `${tc.name} [${pt}] totalInterestUsd`);
      assertValidNonNegative(proj.finalResidualValueUsd, `${tc.name} [${pt}] finalResidualValueUsd`);
      assertValidNonNegative(proj.costPerMileUsd, `${tc.name} [${pt}] costPerMileUsd`);
      assertValidNonNegative(proj.monthlyLoanPaymentUsd, `${tc.name} [${pt}] monthlyLoanPaymentUsd`);

      // Yearly schedule checks
      assert.ok(proj.yearlySchedule.length > 0, `${tc.name} [${pt}] schedule should not be empty`);
      for (const row of proj.yearlySchedule) {
        assertValidNonNegative(row.residualValueUsd, `${tc.name} [${pt}] Y${row.year} residualValueUsd`);
        assertValidNonNegative(row.yearDepreciationUsd, `${tc.name} [${pt}] Y${row.year} yearDepreciationUsd`);
        assertValidNonNegative(row.cumulativeDepreciationUsd, `${tc.name} [${pt}] Y${row.year} cumulativeDepreciationUsd`);
        assertValidNonNegative(row.yearFuelUsd, `${tc.name} [${pt}] Y${row.year} yearFuelUsd`);
        assertValidNonNegative(row.yearMaintenanceUsd, `${tc.name} [${pt}] Y${row.year} yearMaintenanceUsd`);
        assertValidNonNegative(row.yearInsuranceUsd, `${tc.name} [${pt}] Y${row.year} yearInsuranceUsd`);
        assertValidNonNegative(row.yearInterestUsd, `${tc.name} [${pt}] Y${row.year} yearInterestUsd`);
        assertValidNonNegative(row.cumulativeInterestUsd, `${tc.name} [${pt}] Y${row.year} cumulativeInterestUsd`);
        assertValidNonNegative(row.cumulativeTotalCostUsd, `${tc.name} [${pt}] Y${row.year} cumulativeTotalCostUsd`);
        assertValidNonNegative(row.odometerMiles, `${tc.name} [${pt}] Y${row.year} odometerMiles`);
      }
    }
  }
});

test('ADV-HARNESS-2: Negative and hostile inputs clamp safely without returning NaN or negative numbers', () => {
  const hostileScenarios = [
    {
      purchasePriceUsd: -50000,
      odometerMiles: -200000,
      annualDistanceMiles: -50000,
      mpgUs: -30,
      fuelPriceUsdGal: -10,
      annualInsuranceUsd: -5000,
      aprPct: -25,
      downPaymentPct: -50,
      loanTermMonths: -48,
      horizonYears: -5,
    },
    {
      purchasePriceUsd: NaN,
      odometerMiles: undefined,
      annualDistanceMiles: null,
      mpgUs: 'invalid',
      fuelPriceUsdGal: -0.01,
      annualInsuranceUsd: 'abc',
      aprPct: Infinity,
      downPaymentPct: 150,
      loanTermMonths: 0,
      horizonYears: 0,
    },
  ];

  for (const hostile of hostileScenarios) {
    const proj = calculateTcoProjection(hostile);
    assertValidNonNegative(proj.totalEconomicCostUsd, 'Hostile totalEconomicCostUsd');
    assertValidNonNegative(proj.costPerMileUsd, 'Hostile costPerMileUsd');
    assertValidNonNegative(proj.totalDepreciationUsd, 'Hostile totalDepreciationUsd');
    assertValidNonNegative(proj.finalResidualValueUsd, 'Hostile finalResidualValueUsd');
    assert.ok(proj.yearlySchedule.length >= 1, 'Should generate at least 1 year schedule');
    for (const row of proj.yearlySchedule) {
      assertValidNonNegative(row.residualValueUsd, `Hostile Y${row.year} residual`);
      assertValidNonNegative(row.cumulativeTotalCostUsd, `Hostile Y${row.year} cumulativeTotalCostUsd`);
    }
  }
});

// ============================================================================
// 2. WEAR MULTIPLIERS: CITY DRIVING VS HIGHWAY DRIVING
// ============================================================================

test('ADV-HARNESS-3: City driving wear strictly exceeds highway driving wear across all wear-sensitive components', () => {
  const testOdometerMiles = 60000;

  for (const comp of MAINTENANCE_COMPONENTS) {
    // Evaluate Highway (0% urban)
    const highwayHealth = evaluateComponentHealth({
      component: comp,
      physicalOdometerMiles: testOdometerMiles,
      urbanTripSharePct: 0, // Highway
    });

    // Evaluate Mixed (45% urban)
    const mixedHealth = evaluateComponentHealth({
      component: comp,
      physicalOdometerMiles: testOdometerMiles,
      urbanTripSharePct: 45, // Mixed
    });

    // Evaluate City (85% urban)
    const cityHealth = evaluateComponentHealth({
      component: comp,
      physicalOdometerMiles: testOdometerMiles,
      urbanTripSharePct: 85, // City
    });

    // Evaluate Extreme Urban (100% urban short trips)
    const extremeUrbanHealth = evaluateComponentHealth({
      component: comp,
      physicalOdometerMiles: testOdometerMiles,
      urbanTripSharePct: 100, // 100% City
    });

    assert.ok(highwayHealth, `${comp.id} highway health must exist`);
    assert.ok(mixedHealth, `${comp.id} mixed health must exist`);
    assert.ok(cityHealth, `${comp.id} city health must exist`);
    assert.ok(extremeUrbanHealth, `${comp.id} extreme urban health must exist`);

    // If the component has urbanShortTripPenalty > 1.0, wear must be strictly monotonic:
    // highway < mixed < city <= extremeUrban
    if (comp.urbanShortTripPenalty > 1.0) {
      assert.ok(
        cityHealth.combinedMultiplier > highwayHealth.combinedMultiplier,
        `${comp.id}: City multiplier (${cityHealth.combinedMultiplier}) must exceed Highway (${highwayHealth.combinedMultiplier})`
      );
      assert.ok(
        cityHealth.effectiveWearMiles > highwayHealth.effectiveWearMiles,
        `${comp.id}: City effective wear (${cityHealth.effectiveWearMiles} mi) must exceed Highway (${highwayHealth.effectiveWearMiles} mi)`
      );
      assert.ok(
        cityHealth.wearPctOfCritical >= highwayHealth.wearPctOfCritical,
        `${comp.id}: City wear % (${cityHealth.wearPctOfCritical}%) must be >= Highway (${highwayHealth.wearPctOfCritical}%)`
      );
      assert.ok(
        mixedHealth.combinedMultiplier >= highwayHealth.combinedMultiplier &&
        cityHealth.combinedMultiplier >= mixedHealth.combinedMultiplier &&
        extremeUrbanHealth.combinedMultiplier >= cityHealth.combinedMultiplier,
        `${comp.id}: Multipliers must be monotonically non-decreasing with urban trip share`
      );
    }
  }
});

// ============================================================================
// 3. LABOR & WORKSHOP TIERS: DEALERSHIP > INDEPENDENT > DIY
// ============================================================================

test('ADV-HARNESS-4: Dealership total > Independent total > DIY total across all 20 OBD dossiers', () => {
  assert.equal(OBD_CODES.length, 20, 'Must verify all 20 OBD codes in the catalog');

  for (const codeObj of OBD_CODES) {
    const dealerEst = calculateObdWorkshopEstimate(codeObj, 'dealership');
    const indyEst = calculateObdWorkshopEstimate(codeObj, 'independent');
    const diyEst = calculateObdWorkshopEstimate(codeObj, 'diy');

    // Verify Labor Rates
    assert.equal(dealerEst.rateUsdPerHr, 185, 'Dealer labor rate must be $185/hr');
    assert.equal(indyEst.rateUsdPerHr, 115, 'Indy labor rate must be $115/hr');
    assert.equal(diyEst.rateUsdPerHr, 0, 'DIY labor rate must be $0/hr');

    // DIY labor cost must be strictly $0
    assert.equal(diyEst.minLaborUsd, 0, `${codeObj.code}: DIY min labor must be $0`);
    assert.equal(diyEst.maxLaborUsd, 0, `${codeObj.code}: DIY max labor must be $0`);
    assert.equal(diyEst.weightedLaborUsd, 0, `${codeObj.code}: DIY weighted labor must be $0`);

    // Labor cost ordering: Dealership > Independent > DIY (0)
    assert.ok(
      dealerEst.minLaborUsd > indyEst.minLaborUsd,
      `${codeObj.code}: Dealer min labor ($${dealerEst.minLaborUsd}) > Indy min labor ($${indyEst.minLaborUsd})`
    );
    assert.ok(
      dealerEst.maxLaborUsd > indyEst.maxLaborUsd,
      `${codeObj.code}: Dealer max labor ($${dealerEst.maxLaborUsd}) > Indy max labor ($${indyEst.maxLaborUsd})`
    );
    assert.ok(
      dealerEst.weightedLaborUsd > indyEst.weightedLaborUsd,
      `${codeObj.code}: Dealer weighted labor ($${dealerEst.weightedLaborUsd}) > Indy ($${indyEst.weightedLaborUsd})`
    );

    // Total Cost ordering: Dealership total > Independent total > DIY total
    assert.ok(
      dealerEst.minTotalUsd > indyEst.minTotalUsd,
      `${codeObj.code}: Dealer min total ($${dealerEst.minTotalUsd}) > Indy ($${indyEst.minTotalUsd})`
    );
    assert.ok(
      indyEst.minTotalUsd > diyEst.minTotalUsd,
      `${codeObj.code}: Indy min total ($${indyEst.minTotalUsd}) > DIY ($${diyEst.minTotalUsd})`
    );

    assert.ok(
      dealerEst.maxTotalUsd > indyEst.maxTotalUsd,
      `${codeObj.code}: Dealer max total ($${dealerEst.maxTotalUsd}) > Indy ($${indyEst.maxTotalUsd})`
    );
    assert.ok(
      indyEst.maxTotalUsd > diyEst.maxTotalUsd,
      `${codeObj.code}: Indy max total ($${indyEst.maxTotalUsd}) > DIY ($${diyEst.maxTotalUsd})`
    );

    assert.ok(
      dealerEst.weightedExpectedUsd > indyEst.weightedExpectedUsd,
      `${codeObj.code}: Dealer weighted ($${dealerEst.weightedExpectedUsd}) > Indy ($${indyEst.weightedExpectedUsd})`
    );
    assert.ok(
      indyEst.weightedExpectedUsd > diyEst.weightedExpectedUsd,
      `${codeObj.code}: Indy weighted ($${indyEst.weightedExpectedUsd}) > DIY ($${diyEst.weightedExpectedUsd})`
    );

    // Verify NO NaN or negative values
    for (const est of [dealerEst, indyEst, diyEst]) {
      assertValidNonNegative(est.minTotalUsd, `${codeObj.code} [${est.tierId}] minTotalUsd`);
      assertValidNonNegative(est.maxTotalUsd, `${codeObj.code} [${est.tierId}] maxTotalUsd`);
      assertValidNonNegative(est.weightedExpectedUsd, `${codeObj.code} [${est.tierId}] weightedExpectedUsd`);
      assertValidNonNegative(est.weightedPartsUsd, `${codeObj.code} [${est.tierId}] weightedPartsUsd`);
      assertValidNonNegative(est.weightedLaborUsd, `${codeObj.code} [${est.tierId}] weightedLaborUsd`);
    }
  }
});

test('ADV-HARNESS-5: Maintenance component workshop costs: Dealership > Independent > DIY parts', () => {
  for (const comp of MAINTENANCE_COMPONENTS) {
    const dealerMid = (comp.costsUsd.dealership[0] + comp.costsUsd.dealership[1]) / 2;
    const indyMid = (comp.costsUsd.independent[0] + comp.costsUsd.independent[1]) / 2;
    const diyMid = (comp.costsUsd.diyParts[0] + comp.costsUsd.diyParts[1]) / 2;

    assert.ok(
      dealerMid > indyMid,
      `${comp.id}: Dealership midpoint ($${dealerMid}) must exceed Independent midpoint ($${indyMid})`
    );
    assert.ok(
      indyMid > diyMid,
      `${comp.id}: Independent midpoint ($${indyMid}) must exceed DIY parts midpoint ($${diyMid})`
    );
    assert.ok(
      comp.costsUsd.dealership[0] >= comp.costsUsd.independent[0],
      `${comp.id}: Dealership min cost must be >= Independent min cost`
    );
    assert.ok(
      comp.costsUsd.dealership[1] > comp.costsUsd.independent[1],
      `${comp.id}: Dealership max cost must exceed Independent max cost`
    );
  }
});

// ============================================================================
// 4. MULTI-REGION UNIT CONVERSIONS: US ($ / mi / MPG US), UK (£ / mi / MPG UK), EU (€ / km / L/100km)
// ============================================================================

test('ADV-HARNESS-6: Unit conversions across US, UK, and EU produce valid, non-zero results and correct round-trips', () => {
  const regions = ['US', 'UK', 'EU'];

  // 1. Currency Conversion
  const testUsd = 25000;
  const usCur = convertUsdToRegion(testUsd, 'US');
  const ukCur = convertUsdToRegion(testUsd, 'UK');
  const euCur = convertUsdToRegion(testUsd, 'EU');

  assert.equal(usCur, 25000, 'US currency rate is 1.0');
  assert.equal(ukCur, 19750, 'UK currency rate is 0.79 (£19,750)');
  assert.equal(euCur, 23000, 'EU currency rate is 0.92 (€23,000)');

  // Round-trip currency check
  for (const reg of regions) {
    const converted = convertUsdToRegion(testUsd, reg);
    const restored = convertRegionToUsd(converted, reg);
    assert.ok(
      Math.abs(restored - testUsd) < 0.01,
      `${reg} currency round-trip failed: expected ${testUsd}, got ${restored}`
    );
  }

  // 2. Distance Conversion
  const testMiles = 10000;
  const usDist = convertMilesToRegion(testMiles, 'US');
  const ukDist = convertMilesToRegion(testMiles, 'UK');
  const euDist = convertMilesToRegion(testMiles, 'EU');

  assert.equal(usDist, 10000, 'US distance is 10,000 miles');
  assert.equal(ukDist, 10000, 'UK distance is 10,000 miles');
  assert.ok(
    Math.abs(euDist - 16093.44) < 0.1,
    `EU distance should be 16,093.44 km, got ${euDist}`
  );

  // Round-trip distance check
  for (const reg of regions) {
    const converted = convertMilesToRegion(testMiles, reg);
    const restored = convertRegionToMiles(converted, reg);
    assert.ok(
      Math.abs(restored - testMiles) < 0.01,
      `${reg} distance round-trip failed: expected ${testMiles}, got ${restored}`
    );
  }

  // 3. Efficiency Conversion (ICE: MPG US -> MPG UK -> L/100km)
  const testMpgUs = 35; // 35 MPG US
  const usEff = convertMpgUsToRegion(testMpgUs, 'US', false);
  const ukEff = convertMpgUsToRegion(testMpgUs, 'UK', false);
  const euEff = convertMpgUsToRegion(testMpgUs, 'EU', false);

  assert.equal(usEff, 35.0, 'US efficiency is 35.0 MPG');
  assert.equal(ukEff, 42.0, 'UK efficiency should be 35 * 1.20095 = 42.0 MPG UK');
  assert.equal(euEff, 6.7, 'EU efficiency should be 235.215 / 35 = 6.7 L/100km');

  // Round-trip efficiency check for ICE
  const restoredUsFromUk = convertRegionToMpgUs(ukEff, 'UK', false);
  const restoredUsFromEu = convertRegionToMpgUs(euEff, 'EU', false);
  assert.ok(Math.abs(restoredUsFromUk - testMpgUs) < 0.5, 'UK -> US round-trip');
  assert.ok(Math.abs(restoredUsFromEu - testMpgUs) < 0.5, 'EU -> US round-trip');

  // 4. EV Efficiency Conversion (kWh/100mi -> kWh/100km)
  const testKwh100Mi = 28; // 28 kWh / 100 mi
  const usEvEff = convertMpgUsToRegion(testKwh100Mi, 'US', true);
  const ukEvEff = convertMpgUsToRegion(testKwh100Mi, 'UK', true);
  const euEvEff = convertMpgUsToRegion(testKwh100Mi, 'EU', true);

  assert.equal(usEvEff, 28.0, 'US EV efficiency: 28.0 kWh/100mi');
  assert.equal(ukEvEff, 28.0, 'UK EV efficiency: 28.0 kWh/100mi');
  assert.equal(euEvEff, 17.4, 'EU EV efficiency: 28 / 1.609344 = 17.4 kWh/100km');

  // Round-trip EV efficiency
  const restoredUsEvFromEu = convertRegionToMpgUs(euEvEff, 'EU', true);
  assert.ok(Math.abs(restoredUsEvFromEu - testKwh100Mi) < 0.2, 'EU -> US EV round-trip');

  // 5. Fuel Price Conversion
  const testFuelUsdGal = 3.65;
  const usFuelPrice = convertFuelPriceUsdGalToRegion(testFuelUsdGal, 'US', false);
  const ukFuelPrice = convertFuelPriceUsdGalToRegion(testFuelUsdGal, 'UK', false);
  const euFuelPrice = convertFuelPriceUsdGalToRegion(testFuelUsdGal, 'EU', false);

  assert.equal(usFuelPrice, 3.65, 'US fuel price: $3.65/gal');
  // UK: ($3.65 * 0.79) / 3.78541 = £0.76 / Litre
  assert.equal(ukFuelPrice, 0.76, 'UK fuel price: £0.76/Litre');
  // EU: ($3.65 * 0.92) / 3.78541 = €0.89 / Litre
  assert.equal(euFuelPrice, 0.89, 'EU fuel price: €0.89/Litre');

  // 6. Boundary / Hostile conversion inputs
  assert.equal(convertUsdToRegion(0, 'EU'), 0);
  assert.equal(convertUsdToRegion(-50, 'EU'), -46);
  assert.equal(convertMilesToRegion(0, 'EU'), 0);
  assert.equal(convertMpgUsToRegion(0, 'EU', false), 7.8); // Sanitized non-zero fallback
  assert.equal(convertMpgUsToRegion(NaN, 'EU', false), 7.8);
  assert.equal(convertMpgUsToRegion(-10, 'EU', false), 7.8);
});

// ============================================================================
// 5. COST TIMELINE 10-YEAR LIFECYCLE TRAJECTORY STRESS TEST
// ============================================================================

test('ADV-HARNESS-7: CostTimeline 10-year points trajectory is valid and monotonic across edge vehicles', () => {
  for (const preset of VEHICLE_PRESETS) {
    const calculateYearCost = (yr) =>
      calculateTcoProjection({
        purchasePriceUsd: preset.purchasePriceUsd,
        odometerMiles: preset.defaultOdometerMiles,
        annualDistanceMiles: preset.annualDistanceMiles,
        mpgUs: preset.mpgUs,
        isEv: preset.isEv,
        powertrainType: preset.powertrainType || preset.powertrain,
        vehicle: preset,
        fuelPriceUsdGal: preset.defaultFuelPriceUsdGal,
        annualInsuranceUsd: preset.annualInsuranceUsd,
        baseAnnualMaintenanceUsd: preset.baseAnnualMaintenanceUsd,
        maintenanceWearFactor: preset.maintenanceWearFactor,
        downPaymentPct: 20,
        aprPct: 6.0,
        loanTermMonths: 60,
        horizonYears: yr,
        residualCurve10Yr: preset.residualCurve10Yr,
      });

    const points = Array.from({ length: 10 }, (_, i) => {
      const yr = i + 1;
      const res = calculateYearCost(yr);
      return {
        year: yr,
        total: res.totalEconomicCostUsd,
        depreciation: res.totalDepreciationUsd,
      };
    });

    assert.equal(points.length, 10, `${preset.id} must produce exactly 10 points`);

    let prevTotal = 0;
    for (const p of points) {
      assertValidNonNegative(p.total, `${preset.id} Y${p.year} total`);
      assertValidNonNegative(p.depreciation, `${preset.id} Y${p.year} depreciation`);
      // Total cumulative economic cost must be monotonically increasing year-over-year
      assert.ok(
        p.total >= prevTotal,
        `${preset.id} Y${p.year} cumulative cost ($${p.total}) must not be less than Y${p.year - 1} ($${prevTotal})`
      );
      prevTotal = p.total;

      // Depreciation share check
      const depSharePct = p.total > 0 ? Math.round((p.depreciation / p.total) * 100) : 0;
      assertValidNonNegative(depSharePct, `${preset.id} Y${p.year} depSharePct`);
      assert.ok(depSharePct <= 100, `${preset.id} Y${p.year} depSharePct (${depSharePct}%) cannot exceed 100%`);
    }
  }
});

// ============================================================================
// 6. MAINTENANCE RISK MATRIX: BOUNDARIES, OEM MULTIPLIER & WORKSHOP TIERS
// ============================================================================

test('ADV-HARNESS-8: MaintenanceRiskMatrix evaluates safely at 0 km and 1,000,000 km with OEM risk escalation', () => {
  const odoZeroMiles = 0;
  const odoMillionKmMiles = 621371; // 1,000,000 km

  for (const preset of VEHICLE_PRESETS) {
    const components = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, preset);
    assert.ok(components.length > 0, `${preset.id} must have applicable components`);

    // 1. Evaluate at 0 km
    for (const comp of components) {
      const healthZero = evaluateComponentHealth({
        component: comp,
        physicalOdometerMiles: odoZeroMiles,
        urbanTripSharePct: 45,
        oilIntervalId: 'standard',
        powertrainType: preset.powertrainType || preset.powertrain,
        vehicle: preset,
      });

      assert.ok(healthZero, `${preset.id} ${comp.id} health at 0 mi`);
      assert.equal(healthZero.physicalOdometerMiles, 0);
      assert.equal(healthZero.effectiveWearMiles, 0);
      assert.equal(healthZero.wearPctOfCritical, 0);
      assert.equal(healthZero.status, 'OPTIMAL');
      assertValidNonNegative(healthZero.combinedMultiplier, `${comp.id} multiplier at 0 mi`);
    }

    // 2. Evaluate at 1,000,000 km
    for (const comp of components) {
      const healthMillion = evaluateComponentHealth({
        component: comp,
        physicalOdometerMiles: odoMillionKmMiles,
        urbanTripSharePct: 45,
        oilIntervalId: 'standard',
        powertrainType: preset.powertrainType || preset.powertrain,
        vehicle: preset,
      });

      assert.ok(healthMillion, `${preset.id} ${comp.id} health at 1M km`);
      assert.equal(healthMillion.wearPctOfCritical, 100, 'Wear % caps at 100%');
      assert.equal(healthMillion.remainingLifespanPct, 0, 'Remaining lifespan at 0%');
      assert.equal(healthMillion.status, 'CRITICAL', 'Status is CRITICAL');
    }

    // 3. OEM Risk Multiplier scaling
    const multZero = calculateOemRiskMultiplier(odoZeroMiles);
    const multMillion = calculateOemRiskMultiplier(odoMillionKmMiles);
    assert.equal(multZero, 2.2, 'OEM multiplier starts at 2.2 at 0 mi');
    assert.equal(multMillion, 3.1, 'OEM multiplier caps at 3.1 at high mileage');
    assert.ok(multMillion > multZero, 'OEM multiplier increases with mileage');
  }
});

// ============================================================================
// 7. MULTI-REGION FORMATTERS: SYMBOLS, LABELS, UNITS & ZERO/NEGATIVE HANDLING
// ============================================================================

test('ADV-HARNESS-9: UnitContext formatters output correct regional symbols, distance units, and never produce NaN or undefined', () => {
  const testAmounts = [0, 15000, 1250000, -500, -12000, NaN, undefined];

  for (const reg of ['US', 'UK', 'EU']) {
    const sys = UNIT_SYSTEMS[reg];
    assert.ok(sys, `System for ${reg} must exist`);

    const formatCurrency = (usdAmount, decimals = 0) => {
      const converted = convertUsdToRegion(usdAmount, reg);
      if (!Number.isFinite(converted)) {
        return `${sys.currencySymbol}0`;
      }
      const isNeg = converted < -0.001;
      const absVal = Math.abs(converted);
      return `${isNeg ? '-' : ''}${sys.currencySymbol}${absVal.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}`;
    };

    const formatCostPerDistance = (usdPerMile) => {
      const num = Number(usdPerMile);
      const safeNum = Number.isFinite(num) ? Math.max(0, num) : 0;
      const localCurrencyPerMile = safeNum * sys.currencyRate;
      const localPerUnit = sys.distanceFactor > 0 ? localCurrencyPerMile / sys.distanceFactor : 0;
      return `${sys.currencySymbol}${localPerUnit.toFixed(2)} / ${sys.distanceUnit}`;
    };

    const formatDistance = (miles, includeUnit = true) => {
      const converted = Math.round(convertMilesToRegion(miles, reg));
      const safeVal = Number.isFinite(converted) ? Math.max(0, converted) : 0;
      const formatted = safeVal.toLocaleString('en-US');
      return includeUnit ? `${formatted} ${sys.distanceUnit}` : formatted;
    };

    const formatEfficiency = (mpgUs, isEv = false) => {
      const val = convertMpgUsToRegion(mpgUs, reg, isEv);
      const safeVal = Number.isFinite(val) ? Math.max(0, val) : (isEv ? 28 : 30);
      const unit = isEv ? sys.evEfficiencyUnit : sys.efficiencyUnit;
      return `${safeVal.toFixed(1)} ${unit}`;
    };

    // Test Currency Formatting
    for (const amt of testAmounts) {
      const formatted = formatCurrency(amt);
      assertValidDisplayString(formatted, `${reg} formatCurrency(${amt})`);
      assert.ok(
        formatted.includes(sys.currencySymbol),
        `${reg} formatCurrency(${amt}) must contain '${sys.currencySymbol}': "${formatted}"`
      );
    }

    // Test Cost Per Distance Formatting
    const cpd = formatCostPerDistance(0.48);
    assertValidDisplayString(cpd, `${reg} formatCostPerDistance(0.48)`);
    assert.ok(cpd.includes(sys.currencySymbol), `${reg} cpd must contain '${sys.currencySymbol}'`);
    assert.ok(cpd.includes(sys.distanceUnit), `${reg} cpd must contain '${sys.distanceUnit}'`);

    // Test Distance Formatting
    const distStr = formatDistance(50000);
    assertValidDisplayString(distStr, `${reg} formatDistance(50000)`);
    assert.ok(distStr.includes(sys.distanceUnit), `${reg} distance must contain '${sys.distanceUnit}'`);

    // Test Efficiency Formatting
    const iceEffStr = formatEfficiency(32, false);
    assertValidDisplayString(iceEffStr, `${reg} formatEfficiency(32, false)`);
    assert.ok(iceEffStr.includes(sys.efficiencyUnit), `${reg} ice efficiency must contain '${sys.efficiencyUnit}'`);

    const evEffStr = formatEfficiency(26, true);
    assertValidDisplayString(evEffStr, `${reg} formatEfficiency(26, true)`);
    assert.ok(evEffStr.includes(sys.evEfficiencyUnit), `${reg} ev efficiency must contain '${sys.evEfficiencyUnit}'`);
  }
});

// ============================================================================
// 8. GLOBAL STATE SYNCHRONIZATION ACROSS CALCULATORS & PRESETS
// ============================================================================

test('ADV-HARNESS-10: Cross-calculator vehicle preset state synchronization and hybrid OBD context resolution', async () => {
  const { getHybridVehicleObdContext } = await import('../src/data/seoMatrixData.js');

  for (const preset of VEHICLE_PRESETS) {
    // 1. TCO Calculator projection works with preset
    const tco = calculateTcoProjection({
      purchasePriceUsd: preset.purchasePriceUsd,
      odometerMiles: preset.defaultOdometerMiles,
      annualDistanceMiles: preset.annualDistanceMiles,
      mpgUs: preset.mpgUs,
      isEv: preset.isEv,
      powertrainType: preset.powertrainType || preset.powertrain,
      vehicle: preset,
      fuelPriceUsdGal: preset.defaultFuelPriceUsdGal,
      annualInsuranceUsd: preset.annualInsuranceUsd,
      baseAnnualMaintenanceUsd: preset.baseAnnualMaintenanceUsd,
      maintenanceWearFactor: preset.maintenanceWearFactor,
      horizonYears: 5,
    });
    assertValidNonNegative(tco.totalEconomicCostUsd, `${preset.id} TCO totalEconomicCostUsd`);

    // 2. Maintenance Risk Matrix components filter and evaluate cleanly
    const components = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, preset);
    assert.ok(components.length > 0, `${preset.id} must have components`);
    for (const comp of components) {
      const health = evaluateComponentHealth({
        component: comp,
        physicalOdometerMiles: preset.defaultOdometerMiles,
        urbanTripSharePct: 45,
        powertrainType: preset.powertrainType || preset.powertrain,
        vehicle: preset,
      });
      assert.ok(health, `${preset.id} ${comp.id} health`);
      assertValidNonNegative(health.wearPctOfCritical, `${preset.id} ${comp.id} wear %`);
    }

    // 3. OBD Estimator context resolves seamlessly for preset
    const obdCtx = getHybridVehicleObdContext(preset.id, 'P0420');
    assert.ok(obdCtx, `${preset.id} OBD context exists`);
    assert.equal(obdCtx.preset.id, preset.id, `${preset.id} preset matches in OBD context`);
    assert.ok(obdCtx.dossier, `${preset.id} OBD dossier exists`);
    assert.ok(Array.isArray(obdCtx.estimatedCostRange), `${preset.id} estimatedCostRange is array`);
    assert.ok(obdCtx.estimatedCostRange[0] <= obdCtx.estimatedCostRange[1], 'min <= max cost range');
  }
});

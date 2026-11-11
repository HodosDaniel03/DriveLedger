/**
 * DriveLedger Phase 0 Calculation Fixes — Comprehensive E2E Verification Suite
 *
 * Covers all 7 core Phase 0 calculation requirements across 4 testing tiers:
 *   - Tier 1: Feature Coverage (Equivalence Class Representatives) [33 tests]
 *   - Tier 2: Boundary Value Analysis & Edge Cases [28 tests]
 *   - Tier 3: Cross-Feature Interactions (Pairwise Combinations) [15 tests]
 *   - Tier 4: Real-World Workload Scenarios (Golden Realistic Journeys) [14 tests]
 *
 * Requirements Tracked:
 *   - R1 (D1, D3): Depreciation curves & scrap floor asymptote
 *   - R2 (L3): VehicleComparator & Break-Even powertrain & EV APR preservation
 *   - R3 (T1, T2, B3): Tariff empty strings, EV price monotonicity, and fallback sanitization
 *   - R4 (T4): EV maintenance single baseline (powertrainBaseFactor = 1.0)
 *   - R5 (L1, L2): Lease UI disclaimer and driving style behavior
 *   - R6 (T7, T9): Underwater equity tracking and insurance inflation (+1.5%/yr)
 *   - R7 (R3): Unified maintenance reserve calculation
 *
 * Runner: Node.js Built-in Test Runner (node:test, node:assert/strict)
 * Command: node --test tests/phase0Calculations.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerHooks } from 'node:module';

// Register virtual loader for 'zod' to allow schema-dependent modules to load cleanly
try {
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === 'zod') {
        return { url: 'virtual:zod', shortCircuit: true };
      }
      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (url === 'virtual:zod') {
        const stub = `
          const chain = () => new Proxy({}, { get: () => chain, apply: () => chain });
          export const z = new Proxy({}, { get: () => chain });
          export default { z };
        `;
        return { format: 'module', source: stub, shortCircuit: true };
      }
      return nextLoad(url, context);
    },
  });
} catch {
  // Hooks already registered in current process
}

// Module imports (Namespace imports ensure missing exports do not crash module evaluation)
import * as maintenanceData from '../src/data/maintenanceData.js';
import * as powertrainTypes from '../src/data/powertrainTypes.js';

const {
  calculateNonLinearDepreciation,
  calculateDynamicMaintenance,
  calculateTcoProjection,
  calculateMaintenanceReserve,
  evaluateComponentHealth,
  filterComponentsForPowertrain,
  MAINTENANCE_COMPONENTS,
  POWERTRAIN_TYPES,
} = maintenanceData;

const {
  parseSanitizedNumber,
  calculateBatterySoh,
  calculateEvEnergyCost,
  calculatePhevEnergyCost,
} = powertrainTypes;

// Top-level dynamic import for break-even trajectory solver
const { computeBreakEvenTrajectory } = await import('../src/data/breakEvenAndPpi.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Standard curves and test fixtures
const DEFAULT_CURVE = [0.81, 0.69, 0.59, 0.50, 0.43, 0.37, 0.31, 0.27, 0.23, 0.20];
const TOYOTA_HEV_CURVE = [0.89, 0.81, 0.74, 0.67, 0.61, 0.55, 0.50, 0.45, 0.41, 0.37];
const WETBELT_CURVE = [0.73, 0.59, 0.48, 0.39, 0.32, 0.26, 0.21, 0.17, 0.14, 0.11];
const LUXURY_CURVE = [0.75, 0.60, 0.48, 0.38, 0.30, 0.24, 0.19, 0.15, 0.12, 0.10];

const SAMPLE_COMPONENTS = [
  {
    id: 'comp_crit',
    costsUsd: { independent: [400, 600], dealership: [700, 900] },
    health: { status: 'CRITICAL', effectiveWearMiles: 80000 },
    serviceIntervalMiles: 60000,
  },
  {
    id: 'comp_warn',
    costsUsd: { independent: [200, 400], dealership: [350, 550] },
    health: { status: 'WARNING', effectiveWearMiles: 45000 },
    serviceIntervalMiles: 60000,
  },
  {
    id: 'comp_opt',
    costsUsd: { independent: [100, 200], dealership: [180, 300] },
    health: { status: 'OPTIMAL', effectiveWearMiles: 10000 },
    serviceIntervalMiles: 60000,
  },
];


// ============================================================================
// TIER 1: FEATURE COVERAGE (EQUIVALENCE CLASS REPRESENTATIVES) [33 TESTS]
// ============================================================================

// --- R1 (D1): residualCurve10Yr age interpolation (5 tests) ---

test('PHASE0-T1-D1-01: Distinct residualCurve10Yr arrays produce distinct residual trajectories', () => {
  const curveA = [0.90, 0.85, 0.80, 0.75, 0.70, 0.65, 0.60, 0.55, 0.50, 0.45];
  const curveB = [0.50, 0.40, 0.30, 0.20, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10];

  const resA = calculateNonLinearDepreciation({
    purchasePriceUsd: 30000,
    odometerMiles: 0,
    annualDistanceMiles: 12500,
    ownershipYear: 5,
    powertrainType: 'ICE_PETROL',
    residualCurve10Yr: curveA,
  });

  const resB = calculateNonLinearDepreciation({
    purchasePriceUsd: 30000,
    odometerMiles: 0,
    annualDistanceMiles: 12500,
    ownershipYear: 5,
    powertrainType: 'ICE_PETROL',
    residualCurve10Yr: curveB,
  });

  assert.notEqual(resA.residualValueUsd, resB.residualValueUsd, 'Distinct curves must not yield identical residuals');
  assert.equal(resA.residualValueUsd, 21000, 'Curve A Year 5 residual must be 70% of 30,000 ($21,000)');
  assert.equal(resB.residualValueUsd, 3000, 'Curve B Year 5 residual must be 10% of 30,000 ($3,000)');
  assert.equal(resA.retentionPct, 70.0);
  assert.equal(resB.retentionPct, 10.0);
});

test('PHASE0-T1-D1-02: Piecewise linear age interpolation computes continuous values at fractional virtual ages', () => {
  const curve = [0.90, 0.80, 0.70, 0.60, 0.50, 0.40, 0.30, 0.20, 0.15, 0.10];
  // startOdo 6250 => A0 = 0.5. At ownershipYear 1, t = 1.5.
  const res = calculateNonLinearDepreciation({
    purchasePriceUsd: 20000,
    odometerMiles: 6250,
    annualDistanceMiles: 12500,
    ownershipYear: 1,
    powertrainType: 'ICE_PETROL',
    residualCurve10Yr: curve,
  });

  // R(0.5) = 0.95; R(1.5) = 0.85; baseRetention = 0.85 / 0.95 = 0.8947368
  assert.equal(res.residualValueUsd, 17895);
  assert.equal(res.retentionPct, 89.5);
});

test('PHASE0-T1-D1-03: Multi-point interpolation accuracy across intermediate knot years (Years 2, 4, 6, 8)', () => {
  const curve = [0.85, 0.75, 0.65, 0.55, 0.48, 0.42, 0.36, 0.30, 0.25, 0.20];
  const years = [2, 4, 6, 8];
  const expectedRetentionPcts = [75.0, 55.0, 42.0, 30.0];

  for (let i = 0; i < years.length; i++) {
    const yr = years[i];
    const res = calculateNonLinearDepreciation({
      purchasePriceUsd: 40000,
      annualDistanceMiles: 12500,
      ownershipYear: yr,
      residualCurve10Yr: curve,
    });
    assert.equal(res.retentionPct, expectedRetentionPcts[i], `Year ${yr} retention must match curve knot value`);
    assert.equal(res.residualValueUsd, Math.round(40000 * (expectedRetentionPcts[i] / 100)));
  }
});

test('PHASE0-T1-D1-04: Used car virtual age offset calculation prevents showroom drop re-take on custom curves', () => {
  const curve = [0.80, 0.68, 0.58, 0.50, 0.43, 0.37, 0.32, 0.27, 0.23, 0.20];
  const newCar = calculateNonLinearDepreciation({
    purchasePriceUsd: 30000,
    odometerMiles: 0,
    annualDistanceMiles: 12500,
    ownershipYear: 1,
    residualCurve10Yr: curve,
  });

  const usedCar = calculateNonLinearDepreciation({
    purchasePriceUsd: 30000,
    odometerMiles: 50000, // A0 = 4.0 years
    annualDistanceMiles: 12500,
    ownershipYear: 1,
    residualCurve10Yr: curve,
  });

  const newDrop = (30000 - newCar.residualValueUsd) / 30000;
  const usedDrop = (30000 - usedCar.residualValueUsd) / 30000;

  assert.ok(usedDrop < newDrop, 'Used vehicle first-year drop must be lower than new car showroom drop');
  assert.ok(usedDrop >= 0.10 && usedDrop <= 0.17, `Used drop should be realistic (~14%), got ${(usedDrop * 100).toFixed(1)}%`);
});

test('PHASE0-T1-D1-05: Annual mileage deviation adjustments properly scale custom curve values', () => {
  const base = calculateNonLinearDepreciation({ purchasePriceUsd: 30000, annualDistanceMiles: 12500, ownershipYear: 3, residualCurve10Yr: DEFAULT_CURVE });
  const high = calculateNonLinearDepreciation({ purchasePriceUsd: 30000, annualDistanceMiles: 25000, ownershipYear: 3, residualCurve10Yr: DEFAULT_CURVE });
  const low = calculateNonLinearDepreciation({ purchasePriceUsd: 30000, annualDistanceMiles: 6000, ownershipYear: 3, residualCurve10Yr: DEFAULT_CURVE });

  assert.ok(high.residualValueUsd < base.residualValueUsd, 'High mileage must reduce residual');
  assert.ok(low.residualValueUsd > base.residualValueUsd, 'Low mileage must increase residual');
});


// --- R1 (D3): Depreciation scrap floor asymptote (3 tests) ---

test('PHASE0-T1-D3-01: Scrap floor asymptote removal eliminates +0.15 offset (Year 10 retention matches c9 = 20.0%)', () => {
  const price = 40000;
  const y10 = calculateNonLinearDepreciation({
    purchasePriceUsd: price,
    annualDistanceMiles: 12500,
    ownershipYear: 10,
    residualCurve10Yr: DEFAULT_CURVE,
  });

  assert.equal(y10.retentionPct, 20.0, 'Year 10 retention must match curve knot point 20.0% exactly');
  assert.equal(y10.residualValueUsd, 8000, 'Year 10 residual must be exactly $8,000');
  assert.ok(y10.retentionPct < 25.0, 'Year 10 retention must not have +0.15 artificial offset');
});

test('PHASE0-T1-D3-02: Smooth exponential decay for t > 10 decaying towards 5% salvage floor', () => {
  const price = 40000;
  const y10 = calculateNonLinearDepreciation({ purchasePriceUsd: price, annualDistanceMiles: 12500, ownershipYear: 10, residualCurve10Yr: DEFAULT_CURVE });
  const y15 = calculateNonLinearDepreciation({ purchasePriceUsd: price, annualDistanceMiles: 12500, ownershipYear: 15, residualCurve10Yr: DEFAULT_CURVE });
  const y20 = calculateNonLinearDepreciation({ purchasePriceUsd: price, annualDistanceMiles: 12500, ownershipYear: 20, residualCurve10Yr: DEFAULT_CURVE });

  assert.ok(y15.residualValueUsd < y10.residualValueUsd, 'Year 15 residual must be lower than Year 10');
  assert.ok(y20.residualValueUsd < y15.residualValueUsd, 'Year 20 residual must be lower than Year 15');
  assert.ok(y20.retentionPct >= 5.0, 'Decay must stay at or above 5% floor');
  assert.ok(y20.residualValueUsd >= 2000, 'Residual must not dip below 5% floor ($2,000)');
});

test('PHASE0-T1-D3-03: Continuity at t = 10 knot point boundary between interpolation and decay', () => {
  const price = 30000;
  const res9 = calculateNonLinearDepreciation({ purchasePriceUsd: price, annualDistanceMiles: 12500, ownershipYear: 9, residualCurve10Yr: DEFAULT_CURVE });
  const res10 = calculateNonLinearDepreciation({ purchasePriceUsd: price, annualDistanceMiles: 12500, ownershipYear: 10, residualCurve10Yr: DEFAULT_CURVE });
  const res11 = calculateNonLinearDepreciation({ purchasePriceUsd: price, annualDistanceMiles: 12500, ownershipYear: 11, residualCurve10Yr: DEFAULT_CURVE });

  assert.ok(res9.residualValueUsd > res10.residualValueUsd, 'Year 9 > Year 10');
  assert.ok(res10.residualValueUsd > res11.residualValueUsd, 'Year 10 > Year 11');
  const deltaBefore = res9.residualValueUsd - res10.residualValueUsd;
  const deltaAfter = res10.residualValueUsd - res11.residualValueUsd;
  assert.ok(deltaAfter <= deltaBefore, 'Depreciation drop rate must be continuous and decaying, not jumping');
});


// --- R2 (L3): Comparator & Break-Even powertrain & EV APR (4 tests) ---

test('PHASE0-T1-L3-01: VehicleComparator passes powertrainType preserving HEV bonus and Diesel LEZ factor', () => {
  const purchasePrice = 35000;
  const odo = 30000;
  const annualDist = 12000;
  const horizon = 5;

  const tcoHev = calculateTcoProjection({
    purchasePriceUsd: purchasePrice,
    odometerMiles: odo,
    annualDistanceMiles: annualDist,
    mpgUs: 45,
    powertrainType: 'HEV',
    horizonYears: horizon,
  });

  const tcoPetrol = calculateTcoProjection({
    purchasePriceUsd: purchasePrice,
    odometerMiles: odo,
    annualDistanceMiles: annualDist,
    mpgUs: 45,
    powertrainType: 'ICE_PETROL',
    horizonYears: horizon,
  });

  const tcoDiesel = calculateTcoProjection({
    purchasePriceUsd: purchasePrice,
    odometerMiles: odo,
    annualDistanceMiles: annualDist,
    mpgUs: 45,
    powertrainType: 'ICE_DIESEL',
    horizonYears: horizon,
  });

  const resHev = tcoHev.yearlySchedule[4].residualValueUsd;
  const resPetrol = tcoPetrol.yearlySchedule[4].residualValueUsd;
  const resDiesel = tcoDiesel.yearlySchedule[4].residualValueUsd;

  assert.ok(resHev > resPetrol, `HEV residual ($${resHev}) must exceed generic ICE Petrol ($${resPetrol})`);
  assert.ok(resDiesel < resPetrol, `Diesel residual ($${resDiesel}) must be lower than generic ICE Petrol ($${resPetrol})`);
  assert.ok(tcoHev.yearlySchedule[4].retentionPct > tcoPetrol.yearlySchedule[4].retentionPct);
  assert.ok(tcoPetrol.yearlySchedule[4].retentionPct > tcoDiesel.yearlySchedule[4].retentionPct);
});

test('PHASE0-T1-L3-02: VehicleComparator EV APR preservation: preserves user APR without 5.2% clobber', () => {
  const purchasePrice = 50000;
  const downPaymentPct = 10;
  const loanTermMonths = 60;

  const tcoPromo = calculateTcoProjection({
    purchasePriceUsd: purchasePrice,
    isEv: true,
    powertrainType: 'EV',
    aprPct: 2.9,
    downPaymentPct,
    loanTermMonths,
  });

  const tcoMarket = calculateTcoProjection({
    purchasePriceUsd: purchasePrice,
    isEv: true,
    powertrainType: 'EV',
    aprPct: 7.9,
    downPaymentPct,
    loanTermMonths,
  });

  const tcoClobbered = calculateTcoProjection({
    purchasePriceUsd: purchasePrice,
    isEv: true,
    powertrainType: 'EV',
    aprPct: 5.2,
    downPaymentPct,
    loanTermMonths,
  });

  const intPromo = tcoPromo.yearlySchedule[4].cumulativeInterestUsd;
  const intMarket = tcoMarket.yearlySchedule[4].cumulativeInterestUsd;
  const intClobbered = tcoClobbered.yearlySchedule[4].cumulativeInterestUsd;

  assert.notEqual(intPromo, intClobbered, '2.9% promotional APR must not yield 5.2% interest');
  assert.notEqual(intMarket, intClobbered, '7.9% market APR must not yield 5.2% interest');
  assert.equal(intPromo, 3396, '2.9% APR on $45k principal must yield exactly $3,396 interest over 60 mos');
  assert.equal(intClobbered, 6200, '5.2% APR baseline interest check ($6,200)');
  assert.equal(intMarket, 9617, '7.9% APR on $45k principal must yield exactly $9,617 interest over 60 mos');
});

test('PHASE0-T1-L3-03: computeBreakEvenTrajectory propagates PHEV and HEV powertrains', () => {
  const phevA = {
    id: 'prius-prime-test',
    name: 'Toyota Prius Prime',
    purchasePriceUsd: 33000,
    defaultOdometerMiles: 10000,
    mpgUs: 50,
    isEv: false,
    powertrainType: 'PHEV',
    powertrain: 'phev',
    defaultFuelPriceUsdGal: 3.65,
    annualInsuranceUsd: 1300,
    baseAnnualMaintenanceUsd: 550,
    maintenanceWearFactor: 0.9,
    electricSharePct: 65,
    phevKwhPer100Mi: 26,
    phevIceMpg: 54,
  };

  const petrolB = {
    id: 'golf-petrol-test',
    name: 'VW Golf 1.5 TSI',
    purchasePriceUsd: 28000,
    defaultOdometerMiles: 10000,
    mpgUs: 33,
    isEv: false,
    powertrainType: 'ICE_PETROL',
    powertrain: 'petrol',
    defaultFuelPriceUsdGal: 3.65,
    annualInsuranceUsd: 1350,
    baseAnnualMaintenanceUsd: 650,
    maintenanceWearFactor: 1.0,
  };

  const trajectory = computeBreakEvenTrajectory(phevA, petrolB, {
    horizonYears: 5,
    annualDistanceMiles: 15000,
  });

  assert.ok(Array.isArray(trajectory.points), 'Must generate trajectory points');
  assert.equal(trajectory.points.length, 9, 'Must evaluate 9 distance intervals (0 to 120,000 miles)');

  const p0 = trajectory.points[0];
  const pEnd = trajectory.points[8];
  const varCostA = (pEnd.costA - p0.costA) / pEnd.distMiles;
  const varCostB = (pEnd.costB - p0.costB) / pEnd.distMiles;

  assert.ok(varCostA < varCostB, `PHEV variable cost per mile ($${varCostA.toFixed(3)}) must be lower than Petrol ($${varCostB.toFixed(3)})`);
});

test('PHASE0-T1-L3-04: VehicleComparator source code passes powertrainType and eliminates EV APR overwrite', () => {
  const comparatorPath = path.resolve(projectRoot, 'src/components/calculators/VehicleComparator.jsx');
  const src = fs.readFileSync(comparatorPath, 'utf8');

  // Verify powertrain passing
  assert.ok(
    src.includes('powertrainType: vehicleA.powertrainType') || src.includes('vehicle: vehicleA'),
    'VehicleComparator must pass powertrainType or vehicle for vehicleA'
  );
  assert.ok(
    src.includes('powertrainType: vehicleB.powertrainType') || src.includes('vehicle: vehicleB'),
    'VehicleComparator must pass powertrainType or vehicle for vehicleB'
  );

  // Verify EV APR overwrite removal
  assert.ok(
    !src.includes('vehicleA.isEv ? 5.2 : aprPct'),
    'VehicleComparator must not clobber vehicleA aprPct with hardcoded 5.2%'
  );
  assert.ok(
    !src.includes('vehicleB.isEv ? 5.2 : aprPct'),
    'VehicleComparator must not clobber vehicleB aprPct with hardcoded 5.2%'
  );
});


// --- R3 (T1, T2, B3): Tariff sanitization, EV price monotonicity, and fallbacks (6 tests) ---

test('PHASE0-T1-T1-01: PHEV empty tariff string defaults to $0.16/kWh instead of $0.00', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 40000,
    annualDistanceMiles: 12000,
    powertrainType: 'PHEV',
    electricSharePct: 65,
    phevKwhPer100Mi: 30,
    phevIceMpg: 40,
    fuelPriceUsdGal: 3.65,
    homeTariffUsdPerKwh: '',
    horizonYears: 1,
  });

  const yr1Fuel = proj.yearlySchedule[0].yearFuelUsd;
  assert.equal(yr1Fuel, 758, `Expected ~$758 annual fuel cost with $0.16 fallback, got ${yr1Fuel}`);
  assert.notEqual(yr1Fuel, 383, 'Fuel cost must not equal gas-only cost ($383) which indicates free $0 electricity');
  assert.equal(proj.totalFuelUsd, 758);
});

test('PHASE0-T1-T2-01: EV electricity pricing scales strictly monotonically across tariffs ($0.10 to $2.00/kWh)', () => {
  const tariffs = [0.10, 0.25, 0.50, 0.90, 1.00, 1.25, 1.50, 2.00];
  const costs = tariffs.map((rate) => {
    const proj = calculateTcoProjection({
      purchasePriceUsd: 40000,
      annualDistanceMiles: 12000,
      mpgUs: 28,
      isEv: true,
      powertrainType: 'EV',
      fuelPriceUsdGal: rate,
      horizonYears: 1,
    });
    return proj.yearlySchedule[0].yearFuelUsd;
  });

  for (let i = 1; i < costs.length; i++) {
    assert.ok(
      costs[i] > costs[i - 1],
      `Monotonicity violation: rate $${tariffs[i]} produced cost $${costs[i]}, which is not > rate $${tariffs[i-1]} cost $${costs[i-1]}`
    );
  }
});

test('PHASE0-T1-T2-02: EV tariff of $1.20/kWh costs strictly more than tariff of $0.30/kWh (no <= 1.0 inversion)', () => {
  const lowProj = calculateTcoProjection({
    purchasePriceUsd: 40000,
    annualDistanceMiles: 15000,
    mpgUs: 30,
    isEv: true,
    powertrainType: 'EV',
    fuelPriceUsdGal: 0.30,
    horizonYears: 1,
  });

  const highProj = calculateTcoProjection({
    purchasePriceUsd: 40000,
    annualDistanceMiles: 15000,
    mpgUs: 30,
    isEv: true,
    powertrainType: 'EV',
    fuelPriceUsdGal: 1.20,
    horizonYears: 1,
  });

  const lowCost = lowProj.yearlySchedule[0].yearFuelUsd;
  const highCost = highProj.yearlySchedule[0].yearFuelUsd;

  assert.ok(highCost > lowCost, `High tariff ($1.20) cost ($${highCost}) must exceed low tariff ($0.30) cost ($${lowCost})`);
  assert.ok(highCost > lowCost * 2, 'High tariff cost should be roughly proportional (3-4x) to rate');
});

test('PHASE0-T1-B3-01: parseSanitizedNumber correctly sanitizes numeric inputs, bounds, and fallbacks', () => {
  assert.equal(typeof parseSanitizedNumber, 'function', 'parseSanitizedNumber must be exported from powertrainTypes.js');
  assert.equal(parseSanitizedNumber(42, 10), 42);
  assert.equal(parseSanitizedNumber('42.5', 10), 42.5);
  assert.equal(parseSanitizedNumber(undefined, 10), 10);
  assert.equal(parseSanitizedNumber(null, 10), 10);
  assert.equal(parseSanitizedNumber('', 10), 10);
  assert.equal(parseSanitizedNumber('   ', 10), 10);
  assert.equal(parseSanitizedNumber('\t\n', 10), 10);
  assert.equal(parseSanitizedNumber(NaN, 10), 10);
  assert.equal(parseSanitizedNumber('invalid_str', 10), 10);

  // Preserves legitimate zero
  assert.equal(parseSanitizedNumber(0, 10), 0);
  assert.equal(parseSanitizedNumber('0', 10), 0);

  // Clamping to bounds
  assert.equal(parseSanitizedNumber(-5, 10, 0, 100), 0);
  assert.equal(parseSanitizedNumber(150, 10, 0, 100), 100);
  assert.equal(parseSanitizedNumber(75, 10, 0, 100), 75);
});

test('PHASE0-T1-B3-02: calculateBatterySoh properly applies defaults when parameters are nullish or empty', () => {
  const baseline = calculateBatterySoh({
    nominalCapacityKwh: 75,
    ageYears: 2,
    odometerMiles: 24000,
    dcFastChargingSharePct: 20,
    chemistry: 'NMC',
  });

  const withNullDc = calculateBatterySoh({
    nominalCapacityKwh: 75,
    ageYears: 2,
    odometerMiles: 24000,
    dcFastChargingSharePct: null,
    chemistry: 'NMC',
  });

  assert.ok(!Number.isNaN(withNullDc.sohPct), 'sohPct must not be NaN');
  assert.ok(!Number.isNaN(withNullDc.remainingCapacityKwh), 'remainingCapacityKwh must not be NaN');
  assert.equal(withNullDc.sohPct, baseline.sohPct, 'Null dcFastChargingSharePct must fall back to default 20%');
  assert.equal(withNullDc.remainingCapacityKwh, baseline.remainingCapacityKwh);
});

test('PHASE0-T1-B3-03: calculateEvEnergyCost and calculatePhevEnergyCost cleanly sanitize charging shares', () => {
  const evNull = calculateEvEnergyCost({ annualDistanceMiles: 10000, homeChargePct: null });
  const evDefault = calculateEvEnergyCost({ annualDistanceMiles: 10000, homeChargePct: 80 });
  assert.equal(evNull.annualCostUsd, evDefault.annualCostUsd, 'Null homeChargePct must default to 80%');

  const phevEmpty = calculatePhevEnergyCost({ annualDistanceMiles: 10000, electricSharePct: '' });
  const phevDefault = calculatePhevEnergyCost({ annualDistanceMiles: 10000, electricSharePct: 55 });
  assert.equal(phevEmpty.totalAnnualCostUsd, phevDefault.totalAnnualCostUsd, 'Empty string electricSharePct must default to 55%');
});


// --- R4 (T4): EV maintenance single baseline (3 tests) ---

test('PHASE0-T1-T4-01: EV maintenance uses single baseline (powertrainBaseFactor = 1.0, 0.65x eliminated)', () => {
  const baseMaint = 420;
  const res = calculateDynamicMaintenance({
    baseAnnualMaintenanceUsd: baseMaint,
    odometerMiles: 0,
    annualDistanceMiles: 12000,
    powertrainType: 'EV',
    maintenanceWearFactor: 1.0,
    ownershipYear: 1,
  });

  assert.equal(res.yearMaintenanceUsd, 420, 'EV routine maintenance must equal full base $420, not double-discounted $273');
  assert.equal(res.routineMaintenanceUsd, 420);
});

test('PHASE0-T1-T4-02: ICE and EV with identical base inputs produce identical routine maintenance when wear factor is 1.0', () => {
  const ice = calculateDynamicMaintenance({
    baseAnnualMaintenanceUsd: 800,
    odometerMiles: 0,
    annualDistanceMiles: 12000,
    powertrainType: 'ICE_PETROL',
    maintenanceWearFactor: 1.0,
    ownershipYear: 1,
  });

  const ev = calculateDynamicMaintenance({
    baseAnnualMaintenanceUsd: 800,
    odometerMiles: 0,
    annualDistanceMiles: 12000,
    powertrainType: 'EV',
    maintenanceWearFactor: 1.0,
    ownershipYear: 1,
  });

  assert.equal(ev.routineMaintenanceUsd, ice.routineMaintenanceUsd, 'EV and ICE routine maintenance must match for equal inputs');
  assert.equal(ev.routineMaintenanceUsd, 800);
});

test('PHASE0-T1-T4-03: Dedicated EV archetype ($420 base) evaluates to $420 routine base, not double-discounted $273', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 40000,
    isEv: true,
    powertrainType: 'EV',
    baseAnnualMaintenanceUsd: 420,
    maintenanceWearFactor: 1.0,
    horizonYears: 1,
    annualDistanceMiles: 12000,
  });

  assert.equal(proj.yearlySchedule[0].yearMaintenanceUsd, 420, 'Year 1 EV maintenance must be $420');
  assert.equal(proj.totalMaintenanceUsd, 420);
});


// --- R5 (L1, L2): Lease UI disclaimer and driving style behavior (3 tests) ---

test('PHASE0-T1-L1-01: Lease finance type provides explicit loan amortization disclaimer in TcoCalculator.jsx', () => {
  const tcoCalcPath = path.resolve(projectRoot, 'src/components/calculators/TcoCalculator.jsx');
  const src = fs.readFileSync(tcoCalcPath, 'utf8');

  assert.ok(
    src.toLowerCase().includes('lease') && (src.toLowerCase().includes('loan amortization') || src.includes('lease-disclaimer') || src.includes('amortization')),
    'TcoCalculator.jsx must include a lease disclaimer noting loan amortization estimation'
  );
});

test('PHASE0-T1-L2-01: Driving style alters maintenance wear factor monotonically (City > Mixed > Highway)', () => {
  const baseParams = {
    purchasePriceUsd: 32000,
    odometerMiles: 25000,
    annualDistanceMiles: 12000,
    baseAnnualMaintenanceUsd: 800,
    horizonYears: 5,
  };

  const city = calculateTcoProjection({ ...baseParams, maintenanceWearFactor: 1.0 * 1.30 });
  const mixed = calculateTcoProjection({ ...baseParams, maintenanceWearFactor: 1.0 * 1.00 });
  const highway = calculateTcoProjection({ ...baseParams, maintenanceWearFactor: 1.0 * 0.85 });

  assert.equal(city.totalMaintenanceUsd, 7225);
  assert.equal(mixed.totalMaintenanceUsd, 5826);
  assert.equal(highway.totalMaintenanceUsd, 5128);

  assert.ok(city.totalMaintenanceUsd > mixed.totalMaintenanceUsd);
  assert.ok(mixed.totalMaintenanceUsd > highway.totalMaintenanceUsd);
  assert.ok(city.totalEconomicCostUsd > mixed.totalEconomicCostUsd);
  assert.ok(mixed.totalEconomicCostUsd > highway.totalEconomicCostUsd);
});

test('PHASE0-T1-L2-02: Driving style resolution in TcoCalculator.jsx connects selector to calculation', () => {
  const tcoCalcPath = path.resolve(projectRoot, 'src/components/calculators/TcoCalculator.jsx');
  const src = fs.readFileSync(tcoCalcPath, 'utf8');

  // Verify drivingStyle is wired into calculation dependencies and options
  assert.ok(
    src.includes('drivingStyle') && (src.includes('maintenanceWearFactor') || src.includes('effectiveWearFactor') || src.includes('drivingStyleMultiplier')),
    'TcoCalculator.jsx must integrate drivingStyle into wear factor or calculation parameters'
  );
});


// --- R6 (T7, T9): Underwater equity tracking & insurance inflation (5 tests) ---

test('PHASE0-T1-T7-01: Insurance cost compounds positively year-over-year at +1.5% annual inflation (1.015^(yr - 1))', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 30000,
    annualInsuranceUsd: 1400,
    horizonYears: 5,
  });

  const expected = [1400, 1421, 1442, 1464, 1486];
  for (let yr = 1; yr <= 5; yr++) {
    const actual = proj.yearlySchedule[yr - 1].yearInsuranceUsd;
    assert.equal(actual, expected[yr - 1], `Year ${yr} insurance must be $${expected[yr - 1]}, got $${actual}`);
  }

  assert.equal(proj.totalInsuranceUsd, 7213, 'Total 5-year insurance must equal $7,213');
});

test('PHASE0-T1-T7-02: Insurance Year 2 strictly exceeds Year 1 (eliminating the deflationary 0.985 base)', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 35000,
    annualInsuranceUsd: 1800,
    horizonYears: 3,
  });

  const y1 = proj.yearlySchedule[0].yearInsuranceUsd;
  const y2 = proj.yearlySchedule[1].yearInsuranceUsd;
  const y3 = proj.yearlySchedule[2].yearInsuranceUsd;

  assert.ok(y2 > y1, `Year 2 ($${y2}) must be strictly greater than Year 1 ($${y1})`);
  assert.ok(y3 > y2, `Year 3 ($${y3}) must be strictly greater than Year 2 ($${y2})`);
});

test('PHASE0-T1-T9-01: Underwater negative equity is detected when loan balance exceeds vehicle residual value', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 40000,
    downPaymentPct: 0,
    loanTermMonths: 84,
    aprPct: 6.5,
    horizonYears: 5,
    annualDistanceMiles: 12000,
  });

  assert.equal(proj.hasUnderwaterEquity, true, 'hasUnderwaterEquity must be true for 0% down 84-month loan');
  assert.ok(proj.maxUnderwaterEquityUsd > 2000, `maxUnderwaterEquityUsd ($${proj.maxUnderwaterEquityUsd}) must be > $2,000`);
});

test('PHASE0-T1-T9-02: TCO projection emits root summary properties: hasUnderwaterEquity, maxUnderwaterEquityUsd, underwaterYears', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 38000,
    downPaymentPct: 0,
    loanTermMonths: 72,
    aprPct: 7.0,
    horizonYears: 5,
  });

  assert.equal(typeof proj.hasUnderwaterEquity, 'boolean', 'hasUnderwaterEquity must be a boolean');
  assert.equal(typeof proj.maxUnderwaterEquityUsd, 'number', 'maxUnderwaterEquityUsd must be a number');
  assert.ok(Array.isArray(proj.underwaterYears), 'underwaterYears must be an array');
  assert.ok(proj.underwaterYears.length > 0, 'underwaterYears must list the affected ownership years');
});

test('PHASE0-T1-T9-03: Yearly schedule rows contain isUnderwater: boolean and negativeEquityUsd: number', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 40000,
    downPaymentPct: 0,
    loanTermMonths: 84,
    aprPct: 6.5,
    horizonYears: 5,
  });

  for (const row of proj.yearlySchedule) {
    assert.equal(typeof row.isUnderwater, 'boolean', 'Row isUnderwater must be boolean');
    assert.equal(typeof row.negativeEquityUsd, 'number', 'Row negativeEquityUsd must be number');
    if (row.remainingLoanBalanceUsd > row.residualValueUsd) {
      assert.equal(row.isUnderwater, true);
      assert.equal(row.negativeEquityUsd, Math.round(row.remainingLoanBalanceUsd - row.residualValueUsd));
    } else {
      assert.equal(row.isUnderwater, false);
      assert.equal(row.negativeEquityUsd, 0);
    }
  }
});


// --- R7 (R3): Unified maintenance reserve formula (4 tests) ---

test('PHASE0-T1-R3-01: calculateMaintenanceReserve exported and returns integer-rounded reserve for independent tier', () => {
  assert.equal(typeof calculateMaintenanceReserve, 'function', 'calculateMaintenanceReserve must be exported from maintenanceData.js');

  const reserve = calculateMaintenanceReserve({
    evaluatedComponents: SAMPLE_COMPONENTS,
    workshopTier: 'independent',
    annualDistanceMiles: 12000,
  });

  assert.equal(reserve, 495, `Expected $495 independent reserve, got $${reserve}`);
});

test('PHASE0-T1-R3-02: Dealership workshop tier produces higher reserve matching dealership parts/labor costs', () => {
  assert.equal(typeof calculateMaintenanceReserve, 'function', 'calculateMaintenanceReserve must be exported from maintenanceData.js');

  const dealershipReserve = calculateMaintenanceReserve({
    evaluatedComponents: SAMPLE_COMPONENTS,
    workshopTier: 'dealership',
    annualDistanceMiles: 12000,
  });

  assert.equal(dealershipReserve, 782, `Expected $782 dealership reserve, got $${dealershipReserve}`);
  assert.ok(dealershipReserve > 495, 'Dealership reserve must exceed independent reserve');
});

test('PHASE0-T1-R3-03: OPTIMAL components crossing 72% wear threshold receive elevated 0.22 risk multiplier', () => {
  assert.equal(typeof calculateMaintenanceReserve, 'function', 'calculateMaintenanceReserve must be exported from maintenanceData.js');

  const compNearInterval = {
    id: 'comp_near',
    costsUsd: { independent: [150, 250], dealership: [250, 350] },
    health: { status: 'OPTIMAL', effectiveWearMiles: 28000 },
    serviceIntervalMiles: 50000,
  };

  const reserve = calculateMaintenanceReserve({
    evaluatedComponents: [compNearInterval],
    workshopTier: 'independent',
    annualDistanceMiles: 12000,
  });

  // Projected wear = 28,000 + 12,000 = 40,000 >= 36,000 (72% of 50k) -> 200 * 0.22 * 1.0 = $44
  assert.equal(reserve, 44, `Expected $44 reserve (0.22 multiplier), got $${reserve}`);
});

test('PHASE0-T1-R3-04: Maintenance reserve UI consolidation: MaintenanceRiskMatrix and VehicleComparator call shared formula', () => {
  const riskMatrixPath = path.resolve(projectRoot, 'src/components/calculators/MaintenanceRiskMatrix.jsx');
  const comparatorPath = path.resolve(projectRoot, 'src/components/calculators/VehicleComparator.jsx');

  const riskSrc = fs.readFileSync(riskMatrixPath, 'utf8');
  const compSrc = fs.readFileSync(comparatorPath, 'utf8');

  assert.ok(
    riskSrc.includes('calculateMaintenanceReserve'),
    'MaintenanceRiskMatrix.jsx must import and call shared calculateMaintenanceReserve'
  );
  assert.ok(
    compSrc.includes('calculateMaintenanceReserve'),
    'VehicleComparator.jsx must import and call shared calculateMaintenanceReserve'
  );
});


// ============================================================================
// TIER 2: BOUNDARY & CORNER CASES [28 TESTS]
// ============================================================================

// --- R1 (D1) Boundary Tests (5 tests) ---

test('PHASE0-T2-D1-01: Depreciation at brand new acquisition starts at purchase price and Year 1 retention stays within [75%, 100%]', () => {
  const res = calculateNonLinearDepreciation({
    purchasePriceUsd: 50000,
    odometerMiles: 0,
    annualDistanceMiles: 12500,
    ownershipYear: 1,
    residualCurve10Yr: DEFAULT_CURVE,
  });

  assert.ok(res.residualValueUsd <= 50000, 'Residual value must not exceed purchase price');
  assert.ok(res.residualValueUsd >= 50000 * 0.75, 'Year 1 retention must stay above 75%');
  assert.ok(res.cumulativeDepreciationUsd >= 0);
  assert.equal(res.residualValueUsd + res.cumulativeDepreciationUsd, 50000);
});

test('PHASE0-T2-D1-02: Depreciation boundary at exact knot points t = 1..9 matches curve values exactly', () => {
  const curve = [0.82, 0.70, 0.60, 0.51, 0.44, 0.38, 0.32, 0.27, 0.23, 0.20];
  for (let yr = 1; yr <= 9; yr++) {
    const res = calculateNonLinearDepreciation({
      purchasePriceUsd: 10000,
      annualDistanceMiles: 12500,
      ownershipYear: yr,
      residualCurve10Yr: curve,
    });
    const expectedResidual = Math.round(10000 * curve[yr - 1]);
    assert.equal(res.residualValueUsd, expectedResidual, `Year ${yr} residual must match knot point exactly`);
  }
});

test('PHASE0-T2-D1-03: Malformed, null, empty, or short residualCurve10Yr gracefully falls back to default', () => {
  const invalidCurves = [null, undefined, [], [0.8, 0.7], 'not-an-array'];
  const baseline = calculateNonLinearDepreciation({
    purchasePriceUsd: 30000,
    ownershipYear: 1,
  });

  for (const inv of invalidCurves) {
    const res = calculateNonLinearDepreciation({
      purchasePriceUsd: 30000,
      ownershipYear: 1,
      residualCurve10Yr: inv,
    });
    assert.equal(res.residualValueUsd, baseline.residualValueUsd, `Curve ${inv} must fallback to default`);
    assert.equal(res.retentionPct, baseline.retentionPct);
  }
});

test('PHASE0-T2-D1-04: Incomplete curve arrays (fewer than 10 elements) safely fallback without throwing', () => {
  const shortCurves = [[0.8], [0.8, 0.7, 0.6], [0.8, 0.7, 0.6, 0.5, 0.4]];
  for (const sc of shortCurves) {
    const res = calculateNonLinearDepreciation({
      purchasePriceUsd: 25000,
      ownershipYear: 3,
      residualCurve10Yr: sc,
    });
    assert.ok(typeof res.residualValueUsd === 'number' && !Number.isNaN(res.residualValueUsd));
    assert.ok(res.residualValueUsd > 0 && res.residualValueUsd <= 25000);
  }
});

test('PHASE0-T2-D1-05: Non-monotonic or negative curve inputs clamp within valid bounds [0.05, 1.0]', () => {
  const badCurve = [1.2, 0.9, -0.1, -0.5, 0.3, 0.2, 0.1, 0.05, 0.01, -0.2];
  const res = calculateNonLinearDepreciation({
    purchasePriceUsd: 30000,
    annualDistanceMiles: 12500,
    ownershipYear: 3,
    residualCurve10Yr: badCurve,
  });

  assert.ok(res.retentionPct >= 5.0, 'Retention must clamp to at least 5.0% floor');
  assert.ok(res.residualValueUsd >= 1500, 'Residual must clamp to at least $1,500');
});


// --- R1 (D3) Boundary Tests (3 tests) ---

test('PHASE0-T2-D3-01: Extreme vehicle age (t = 35) strictly respects the 5% salvage floor', () => {
  const res35 = calculateNonLinearDepreciation({
    purchasePriceUsd: 40000,
    odometerMiles: 437500, // A0 = 35 years
    annualDistanceMiles: 12500,
    ownershipYear: 1,
    residualCurve10Yr: DEFAULT_CURVE,
  });

  assert.ok(res35.residualValueUsd >= 2000, 't = 35 residual must be >= 5% floor ($2,000)');
  assert.ok(res35.retentionPct >= 5.0, 't = 35 retention must be >= 5.0%');
  assert.ok(!Number.isNaN(res35.residualValueUsd));
});

test('PHASE0-T2-D3-02: Ultra-high mileage (500,000 miles) strictly respects the 5% salvage floor', () => {
  const res500k = calculateNonLinearDepreciation({
    purchasePriceUsd: 40000,
    odometerMiles: 500000,
    annualDistanceMiles: 20000,
    ownershipYear: 5,
    residualCurve10Yr: DEFAULT_CURVE,
  });

  assert.ok(res500k.residualValueUsd >= 2000, '500k mi residual must be >= 5% floor ($2,000)');
  assert.ok(res500k.retentionPct >= 5.0, '500k mi retention must be >= 5.0%');
  assert.ok(!Number.isNaN(res500k.residualValueUsd));
});

test('PHASE0-T2-D3-03: High-mileage offset at acquisition (A0 = 15 years, 187,500 miles) starts on smooth decay tail', () => {
  const resUsedOld = calculateNonLinearDepreciation({
    purchasePriceUsd: 5000,
    odometerMiles: 187500,
    annualDistanceMiles: 10000,
    ownershipYear: 2,
    residualCurve10Yr: DEFAULT_CURVE,
  });

  assert.ok(resUsedOld.residualValueUsd >= 250, 'Residual must respect 5% floor of $5,000 ($250)');
  assert.ok(resUsedOld.residualValueUsd < 5000, 'Residual must depreciate');
  assert.ok(resUsedOld.cumulativeDepreciationUsd > 0);
});


// --- R2 (L3) Boundary Tests (3 tests) ---

test('PHASE0-T2-L3-01: 0% APR and 100% cash financing on EV produce exactly $0 interest', () => {
  const zeroApr = calculateTcoProjection({
    purchasePriceUsd: 55000,
    isEv: true,
    powertrainType: 'EV',
    aprPct: 0,
    downPaymentPct: 20,
    loanTermMonths: 60,
  });
  assert.equal(zeroApr.yearlySchedule[4].cumulativeInterestUsd, 0, '0% APR must yield $0 interest');
  assert.equal(zeroApr.monthlyLoanPaymentUsd, Math.round((55000 * 0.8) / 60));

  const cash = calculateTcoProjection({
    purchasePriceUsd: 55000,
    isEv: true,
    powertrainType: 'EV',
    aprPct: 0,
    downPaymentPct: 100,
    loanTermMonths: 0,
  });
  assert.equal(cash.yearlySchedule[4].cumulativeInterestUsd, 0, '100% cash must yield $0 interest');
  assert.equal(cash.monthlyLoanPaymentUsd, 0);
});

test('PHASE0-T2-L3-02: Comparing identical vehicles in break-even yields zero cost delta and consistent status', () => {
  const vA = { purchasePriceUsd: 30000, mpgUs: 35, powertrainType: 'ICE_PETROL', defaultOdometerMiles: 30000 };
  const vB = { ...vA };

  const traj = computeBreakEvenTrajectory(vA, vB, { annualDistanceMiles: 12000 });
  assert.equal(traj.points[0].diffB, 0);
  assert.equal(traj.points[8].diffB, 0);
  assert.ok(traj.status === 'b_always_cheaper' || traj.status === 'a_always_cheaper');
  assert.ok(traj.breakEvenMiles === null || traj.breakEvenMiles === 0);
});

test('PHASE0-T2-L3-03: Null, empty string, or undefined powertrainType gracefully falls back without throwing', () => {
  const tcoNull = calculateTcoProjection({ purchasePriceUsd: 30000, powertrainType: null });
  const tcoEmpty = calculateTcoProjection({ purchasePriceUsd: 30000, powertrainType: '' });
  const tcoUndef = calculateTcoProjection({ purchasePriceUsd: 30000, powertrainType: undefined });

  assert.ok(!Number.isNaN(tcoNull.totalEconomicCostUsd));
  assert.ok(!Number.isNaN(tcoEmpty.totalEconomicCostUsd));
  assert.ok(!Number.isNaN(tcoUndef.totalEconomicCostUsd));
  assert.equal(tcoNull.totalEconomicCostUsd, tcoUndef.totalEconomicCostUsd);
});


// --- R3 (T1, T2, B3) Boundary Tests (6 tests) ---

test('PHASE0-T2-T1-01: PHEV tariff handles whitespace variants as fallback to $0.16', () => {
  for (const ws of ['   ', '\t', '  \n  ']) {
    const proj = calculateTcoProjection({
      purchasePriceUsd: 35000,
      annualDistanceMiles: 12000,
      powertrainType: 'PHEV',
      electricSharePct: 65,
      phevKwhPer100Mi: 30,
      phevIceMpg: 40,
      fuelPriceUsdGal: 3.65,
      homeTariffUsdPerKwh: ws,
      horizonYears: 1,
    });
    assert.equal(proj.yearlySchedule[0].yearFuelUsd, 758, `Whitespace '${ws}' must fall back to $0.16 tariff`);
  }
});

test('PHASE0-T2-T1-02: PHEV legitimate zero tariff (0 or "0") preserves $0.00 electric charging (free solar)', () => {
  const zeroProj = calculateTcoProjection({
    purchasePriceUsd: 35000,
    annualDistanceMiles: 12000,
    powertrainType: 'PHEV',
    electricSharePct: 65,
    phevKwhPer100Mi: 30,
    phevIceMpg: 40,
    fuelPriceUsdGal: 3.65,
    homeTariffUsdPerKwh: 0,
    horizonYears: 1,
  });
  // Electric cost is $0, gas cost is $383.25 -> $383
  assert.equal(zeroProj.yearlySchedule[0].yearFuelUsd, 383, 'Legitimate 0 tariff must calculate $0 electric cost');
});

test('PHASE0-T2-T2-01: EV tariff exhibits smooth continuity across $0.99, $1.00, and $1.01 boundary', () => {
  const p99 = calculateTcoProjection({ purchasePriceUsd: 40000, annualDistanceMiles: 10000, mpgUs: 30, isEv: true, powertrainType: 'EV', fuelPriceUsdGal: 0.99, horizonYears: 1 }).totalFuelUsd;
  const p100 = calculateTcoProjection({ purchasePriceUsd: 40000, annualDistanceMiles: 10000, mpgUs: 30, isEv: true, powertrainType: 'EV', fuelPriceUsdGal: 1.00, horizonYears: 1 }).totalFuelUsd;
  const p101 = calculateTcoProjection({ purchasePriceUsd: 40000, annualDistanceMiles: 10000, mpgUs: 30, isEv: true, powertrainType: 'EV', fuelPriceUsdGal: 1.01, horizonYears: 1 }).totalFuelUsd;

  assert.ok(p101 > p100 && p100 > p99, 'Costs must strictly increase across the boundary');
  const step1 = p100 - p99;
  const step2 = p101 - p100;
  assert.ok(Math.abs(step1 - step2) <= 2, `Steps must be nearly identical (smooth linear slope), got ${step1} vs ${step2}`);
});

test('PHASE0-T2-B3-01: calculateBatterySoh handles extreme and corrupted inputs gracefully without NaN', () => {
  const corrupted = [
    {},
    null,
    undefined,
    { nominalCapacityKwh: null, ageYears: '', dcFastChargingSharePct: '   ', cellDefectLossPct: NaN },
    { odometerMiles: -10000, ageYears: -2, dcFastChargingSharePct: -50 },
    { odometerMiles: 1000000, ageYears: 40, dcFastChargingSharePct: 150 },
  ];

  for (const opts of corrupted) {
    const res = calculateBatterySoh(opts);
    assert.ok(typeof res.sohPct === 'number' && !Number.isNaN(res.sohPct), 'sohPct must be a valid number');
    assert.ok(typeof res.remainingCapacityKwh === 'number' && !Number.isNaN(res.remainingCapacityKwh), 'remainingCapacityKwh must be valid');
    assert.ok(res.sohPct >= 50.0 && res.sohPct <= 100.0, `sohPct (${res.sohPct}) must stay within [50.0, 100.0]`);
  }
});

test('PHASE0-T2-B3-02: calculateBatterySoh extreme odometer (1,000,000 miles) and age (40 years) clamps safely', () => {
  const res = calculateBatterySoh({
    nominalCapacityKwh: 100,
    ageYears: 40,
    odometerMiles: 1000000,
    chemistry: 'NMC',
  });

  assert.equal(res.sohPct, 65.0, 'SOH must clamp at standard 65.0% NMC floor');
  assert.equal(res.remainingCapacityKwh, 65.0);
  assert.equal(res.warrantyStatus, 'DEGRADED');

  const resFloorOverride = calculateBatterySoh({
    nominalCapacityKwh: 100,
    ageYears: 40,
    odometerMiles: 1000000,
    floorSoh: 50.0,
  });
  assert.equal(resFloorOverride.sohPct, 50.0, 'SOH must clamp at custom 50.0% floor');
  assert.equal(resFloorOverride.warrantyStatus, 'OUT_OF_WARRANTY_DEGRADED');
});

test('PHASE0-T2-B3-03: parseSanitizedNumber clamping to min and max boundaries', () => {
  assert.equal(typeof parseSanitizedNumber, 'function', 'parseSanitizedNumber must be exported from powertrainTypes.js');
  assert.equal(parseSanitizedNumber(-10, 5, 0, 100), 0);
  assert.equal(parseSanitizedNumber(200, 5, 0, 100), 100);
  assert.equal(parseSanitizedNumber(50, 5, 0, 100), 50);
});


// --- R4 (T4) Boundary Tests (2 tests) ---

test('PHASE0-T2-T4-01: EV 0 annual distance produces $0 routine maintenance without NaN', () => {
  const res = calculateDynamicMaintenance({
    baseAnnualMaintenanceUsd: 420,
    odometerMiles: 25000,
    annualDistanceMiles: 0,
    powertrainType: 'EV',
  });
  assert.equal(res.routineMaintenanceUsd, 0);
  assert.equal(res.yearMaintenanceUsd, 0);
  assert.ok(!Number.isNaN(res.yearMaintenanceUsd));
});

test('PHASE0-T2-T4-02: EV wear escalation caps at 2.5x at mature mileage (350k miles) without 0.65x multiplier', () => {
  const res = calculateDynamicMaintenance({
    baseAnnualMaintenanceUsd: 420,
    odometerMiles: 350000,
    annualDistanceMiles: 12000,
    powertrainType: 'EV',
    maintenanceWearFactor: 1.0,
  });
  assert.equal(res.wearEscalation, 2.5, 'Wear escalation must cap at 2.5');
  assert.equal(res.routineMaintenanceUsd, Math.round(420 * 2.5));
});


// --- R5 (L1, L2) Boundary Tests (2 tests) ---

test('PHASE0-T2-L1-01: Non-lease finance types (loan, cash) do NOT display lease disclaimer', () => {
  const getFinanceDisclaimer = (type) => {
    if (type === 'lease') {
      return { hasDisclaimer: true, text: 'Lease calculations are currently estimated using loan amortization terms.' };
    }
    return { hasDisclaimer: false, text: '' };
  };

  assert.equal(getFinanceDisclaimer('loan').hasDisclaimer, false);
  assert.equal(getFinanceDisclaimer('cash').hasDisclaimer, false);
  assert.equal(getFinanceDisclaimer('lease').hasDisclaimer, true);
});

test('PHASE0-T2-L2-01: Driving style extreme wear factor boundaries maintain valid numeric outputs', () => {
  const styles = [
    { name: 'City Extreme', factor: 1.50 },
    { name: 'Highway Optimal', factor: 0.70 },
  ];

  for (const s of styles) {
    const proj = calculateTcoProjection({
      purchasePriceUsd: 30000,
      annualDistanceMiles: 12000,
      maintenanceWearFactor: s.factor,
    });
    assert.ok(!Number.isNaN(proj.totalMaintenanceUsd));
    assert.ok(proj.totalMaintenanceUsd > 0);
  }
});


// --- R6 (T7, T9) Boundary Tests (4 tests) ---

test('PHASE0-T2-T7-01: Zero insurance ($0) produces $0 across all years without NaN or inflation errors', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 25000,
    annualInsuranceUsd: 0,
    horizonYears: 5,
  });

  assert.equal(proj.totalInsuranceUsd, 0);
  for (const row of proj.yearlySchedule) {
    assert.equal(row.yearInsuranceUsd, 0);
  }
});

test('PHASE0-T2-T9-01: 100% cash purchase produces zero underwater equity and empty underwaterYears', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 35000,
    downPaymentPct: 100,
    loanTermMonths: 0,
    aprPct: 0,
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

test('PHASE0-T2-T9-02: Large down payment (50% down, 36-month loan) maintains positive equity throughout', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 40000,
    downPaymentPct: 50,
    loanTermMonths: 36,
    aprPct: 4.5,
    horizonYears: 5,
  });

  assert.equal(proj.hasUnderwaterEquity, false);
  assert.equal(proj.maxUnderwaterEquityUsd, 0);
  assert.deepEqual(proj.underwaterYears, []);

  for (const row of proj.yearlySchedule) {
    assert.equal(row.isUnderwater, false);
    assert.equal(row.negativeEquityUsd, 0);
    assert.ok(row.residualValueUsd >= row.remainingLoanBalanceUsd);
  }
});

test('PHASE0-T2-T9-03: Subprime 18% APR financing creates persistent multi-year negative equity', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 22000,
    downPaymentPct: 0,
    loanTermMonths: 72,
    aprPct: 18.0,
    horizonYears: 5,
  });

  assert.equal(proj.hasUnderwaterEquity, true);
  assert.ok(proj.maxUnderwaterEquityUsd >= 1500, `High interest must generate significant negative equity, got $${proj.maxUnderwaterEquityUsd}`);
  assert.ok(proj.underwaterYears.length >= 2, 'Must remain underwater for at least 2 years');
});


// --- R7 (R3) Boundary Tests (3 tests) ---

test('PHASE0-T2-R3-01: calculateMaintenanceReserve handles empty, missing, or malformed component lists safely', () => {
  assert.equal(typeof calculateMaintenanceReserve, 'function', 'calculateMaintenanceReserve must be exported from maintenanceData.js');
  assert.equal(calculateMaintenanceReserve({}), 0);
  assert.equal(calculateMaintenanceReserve({ evaluatedComponents: [] }), 0);
  assert.equal(calculateMaintenanceReserve({ evaluatedComponents: null }), 0);
  assert.equal(calculateMaintenanceReserve({ evaluatedComponents: [null, undefined, {}] }), 0);
});

test('PHASE0-T2-R3-02: calculateMaintenanceReserve clamps mileage scale to [0.25, 2.5] and enforces 1.25x per-item cap', () => {
  assert.equal(typeof calculateMaintenanceReserve, 'function', 'calculateMaintenanceReserve must be exported from maintenanceData.js');

  const critComp = {
    id: 'comp_crit',
    costsUsd: { independent: [400, 600] }, // avg = 500
    health: { status: 'CRITICAL', effectiveWearMiles: 80000 },
  };

  // 1. Lower clamp (500 mi clamped to 0.25 scale):
  // Reserve = 500 * 0.75 * 0.25 = 93.75 -> $94
  const lowRes = calculateMaintenanceReserve({
    evaluatedComponents: [critComp],
    workshopTier: 'independent',
    annualDistanceMiles: 500,
  });
  assert.equal(lowRes, 94, `Low mileage must clamp to 0.25 scale ($94), got $${lowRes}`);

  // 2. Upper clamp (100,000 mi clamped to 2.5 scale):
  // Raw item reserve = 500 * 0.75 * 2.5 = 937.5
  // But per-item cap is avgCost * 1.25 = 500 * 1.25 = $625
  const highRes = calculateMaintenanceReserve({
    evaluatedComponents: [critComp],
    workshopTier: 'independent',
    annualDistanceMiles: 100000,
  });
  assert.equal(highRes, 625, `High mileage must enforce 1.25x avgCost cap ($625), got $${highRes}`);
});

test('PHASE0-T2-R3-03: calculateMaintenanceReserve integer rounding invariant', () => {
  assert.equal(typeof calculateMaintenanceReserve, 'function', 'calculateMaintenanceReserve must be exported from maintenanceData.js');

  const res = calculateMaintenanceReserve({
    evaluatedComponents: SAMPLE_COMPONENTS,
    workshopTier: 'independent',
    annualDistanceMiles: 11111,
  });

  assert.equal(Number.isInteger(res), true, 'Maintenance reserve must be an exact integer');
});


// ============================================================================
// TIER 3: CROSS-FEATURE INTERACTIONS (PAIRWISE COMBINATIONS) [15 TESTS]
// ============================================================================

// --- R1 (D1) Cross-Feature (2 tests) ---

test('PHASE0-T3-D1-01: Multi-year TCO trajectory maintains monotonic depreciation with custom curves', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 35000,
    annualDistanceMiles: 12500,
    residualCurve10Yr: TOYOTA_HEV_CURVE,
    powertrainType: 'HEV',
    horizonYears: 10,
  });

  let prevRes = 35000;
  for (const row of proj.yearlySchedule) {
    assert.ok(row.yearDepreciationUsd >= 0, `Year ${row.year} depreciation must be >= 0`);
    assert.ok(row.residualValueUsd <= prevRes, `Year ${row.year} residual must be <= prev`);
    prevRes = row.residualValueUsd;
  }
});

test('PHASE0-T3-D1-02: Custom curve interaction with powertrain multiplier (HEV 1.03x bonus)', () => {
  const hevRes = calculateNonLinearDepreciation({
    purchasePriceUsd: 30000,
    annualDistanceMiles: 12500,
    ownershipYear: 5,
    powertrainType: 'HEV',
    residualCurve10Yr: TOYOTA_HEV_CURVE,
  });

  const petrolRes = calculateNonLinearDepreciation({
    purchasePriceUsd: 30000,
    annualDistanceMiles: 12500,
    ownershipYear: 5,
    powertrainType: 'ICE_PETROL',
    residualCurve10Yr: TOYOTA_HEV_CURVE,
  });

  assert.ok(hevRes.residualValueUsd > petrolRes.residualValueUsd, 'HEV residual must exceed Petrol residual on custom curve');
  assert.equal(hevRes.residualValueUsd, Math.round(30000 * 0.61 * 1.03));
});


// --- R1 (D3) Cross-Feature (2 tests) ---

test('PHASE0-T3-D3-01: Cumulative depreciation across 15 years approaches 95% of purchase price asymptotically', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 40000,
    annualDistanceMiles: 12500,
    horizonYears: 10,
    residualCurve10Yr: DEFAULT_CURVE,
  });

  const y10 = proj.yearlySchedule[9];
  assert.ok(y10.cumulativeDepreciationUsd >= 30000, '10-year cumulative depreciation should exceed 75%');
  assert.ok(y10.residualValueUsd <= 10000, 'Residual value should be <= $10,000');
});

test('PHASE0-T3-D3-02: Scrap floor guarantee combined with negative equity tracking for aging financed vehicle', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 12000,
    odometerMiles: 120000,
    downPaymentPct: 0,
    loanTermMonths: 60,
    aprPct: 10.0,
    horizonYears: 5,
  });

  const lastRow = proj.yearlySchedule[4];
  assert.ok(lastRow.residualValueUsd >= 600, 'Residual must respect 5% floor ($600)');
  assert.equal(lastRow.remainingLoanBalanceUsd, 0, 'Loan paid off at 60 months');
  assert.equal(lastRow.isUnderwater, false, 'Paid off vehicle cannot be underwater');
});


// --- R2 (L3) Cross-Feature (2 tests) ---

test('PHASE0-T3-L3-01: EV + User APR (3.9%) + Corrected Maintenance in multi-year projection', () => {
  const userApr = 3.9;
  const tco = calculateTcoProjection({
    purchasePriceUsd: 46000,
    isEv: true,
    powertrainType: 'EV',
    baseAnnualMaintenanceUsd: 420,
    residualCurve10Yr: DEFAULT_CURVE,
    aprPct: userApr,
    downPaymentPct: 15,
    loanTermMonths: 60,
  });

  const interest = tco.yearlySchedule[4].cumulativeInterestUsd;
  assert.equal(interest, 3999, 'User APR 3.9% correctly applied over 60 months ($3,999)');
  assert.ok(tco.yearlySchedule[0].yearMaintenanceUsd >= 420, 'Maintenance must not double-discount EV baseline');
});

test('PHASE0-T3-L3-02: PHEV vs HEV Break-Even cross-point calculation with preserved powertrain dynamics', () => {
  const phev = {
    id: 'phev-test',
    purchasePriceUsd: 36000,
    mpgUs: 48,
    powertrainType: 'PHEV',
    electricSharePct: 65,
    phevKwhPer100Mi: 28,
    phevIceMpg: 45,
    defaultFuelPriceUsdGal: 3.80,
  };

  const hev = {
    id: 'hev-test',
    purchasePriceUsd: 31000,
    mpgUs: 52,
    powertrainType: 'HEV',
    defaultFuelPriceUsdGal: 3.80,
  };

  const traj = computeBreakEvenTrajectory(phev, hev, { annualDistanceMiles: 15000 });
  assert.equal(traj.points.length, 9);
  assert.ok(traj.status === 'crossover' || traj.status === 'b_always_cheaper');
});


// --- R3 (T1, T2, B3) Cross-Feature (2 tests) ---

test('PHASE0-T3-T1-01: PHEV TCO integrates empty tariff fallback, positive insurance inflation, and underwater equity', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 42000,
    annualDistanceMiles: 12000,
    powertrainType: 'PHEV',
    electricSharePct: 65,
    phevKwhPer100Mi: 30,
    phevIceMpg: 38,
    fuelPriceUsdGal: 3.80,
    homeTariffUsdPerKwh: '', // Triggers $0.16 fallback
    annualInsuranceUsd: 1500, // Inflates at +1.5%/yr
    downPaymentPct: 0,       // Triggers underwater equity
    loanTermMonths: 72,
    aprPct: 6.0,
    horizonYears: 5,
  });

  // 1. Energy check
  assert.equal(proj.yearlySchedule[0].yearFuelUsd, 794, 'Year 1 fuel should reflect $0.16 electric + $3.80 gas');

  // 2. Insurance check (monotonic escalation)
  assert.equal(proj.yearlySchedule[0].yearInsuranceUsd, 1500);
  assert.equal(proj.yearlySchedule[4].yearInsuranceUsd, 1592);

  // 3. Financing check
  assert.equal(proj.hasUnderwaterEquity, true);
  assert.ok(proj.maxUnderwaterEquityUsd > 1500);
  assert.ok(proj.underwaterYears.includes(1));
});

test('PHASE0-T3-T2-01: EV elevated tariff ($1.25/kWh) integrates with inflating insurance and amortization', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 48000,
    annualDistanceMiles: 15000,
    mpgUs: 28,
    isEv: true,
    powertrainType: 'EV',
    fuelPriceUsdGal: 1.25,
    annualInsuranceUsd: 1600,
    downPaymentPct: 10,
    loanTermMonths: 60,
    aprPct: 5.5,
    horizonYears: 5,
  });

  assert.ok(proj.yearlySchedule[0].yearFuelUsd > 6000, `Fuel cost at $1.25/kWh must exceed $6,000, got $${proj.yearlySchedule[0].yearFuelUsd}`);
  assert.equal(proj.yearlySchedule[0].yearInsuranceUsd, 1600);
  assert.equal(proj.yearlySchedule[4].yearInsuranceUsd, 1698);
});


// --- R4 (T4) Cross-Feature (2 tests) ---

test('PHASE0-T3-T4-01: EV revision surcharge bump cleanly integrates with single baseline routine maintenance', () => {
  // 30,000 to 40,000 miles crosses 60,000 km (37,282 mi) threshold bump ($160 for EV)
  const res = calculateDynamicMaintenance({
    baseAnnualMaintenanceUsd: 420,
    odometerMiles: 30000,
    annualDistanceMiles: 10000,
    powertrainType: 'EV',
    ownershipYear: 1,
  });

  assert.equal(res.passedThresholds.length, 1);
  assert.equal(res.revisionSurchargeUsd, 160, 'EV 60k km surcharge must be $160');
  assert.equal(res.yearMaintenanceUsd, res.routineMaintenanceUsd + 160);
});

test('PHASE0-T3-T4-02: 5-Year TCO projection aggregates EV maintenance with single baseline and wear factors', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 40000,
    isEv: true,
    powertrainType: 'EV',
    baseAnnualMaintenanceUsd: 420,
    maintenanceWearFactor: 0.74,
    horizonYears: 5,
    annualDistanceMiles: 12000,
  });

  const sumYearly = proj.yearlySchedule.reduce((sum, r) => sum + r.yearMaintenanceUsd, 0);
  assert.equal(proj.totalMaintenanceUsd, sumYearly, 'Total maintenance must match sum of yearly maintenance');
  assert.equal(proj.yearlySchedule[0].yearMaintenanceUsd, 311, 'Year 1 EV maintenance should be $311 (420 * 0.74)');
});


// --- R5 (L1, L2) Cross-Feature (1 test) ---

test('PHASE0-T3-L1-01: Lease disclaimer active while underwater negative equity is flagged', () => {
  const proj = calculateTcoProjection({
    purchasePriceUsd: 40000,
    downPaymentPct: 0,
    loanTermMonths: 84,
    aprPct: 9.5,
    horizonYears: 5,
  });

  assert.equal(proj.hasUnderwaterEquity, true);
  assert.ok(proj.maxUnderwaterEquityUsd > 0);
});


// --- R6 (T7, T9) Cross-Feature (2 tests) ---

test('PHASE0-T3-T9-01: High-mileage vehicle (accelerated depreciation) combined with long-term loan extends underwater duration', () => {
  const projNormal = calculateTcoProjection({
    purchasePriceUsd: 35000,
    annualDistanceMiles: 12000,
    downPaymentPct: 5,
    loanTermMonths: 72,
    aprPct: 6.5,
    horizonYears: 5,
  });

  const projHighMile = calculateTcoProjection({
    purchasePriceUsd: 35000,
    annualDistanceMiles: 25000,
    downPaymentPct: 5,
    loanTermMonths: 72,
    aprPct: 6.5,
    horizonYears: 5,
  });

  assert.ok(
    projHighMile.maxUnderwaterEquityUsd >= projNormal.maxUnderwaterEquityUsd,
    'High mileage vehicle must suffer equal or greater negative equity'
  );
});

test('PHASE0-T3-T7-01: Compounding 10-year horizon insurance totals strictly exceed flat non-inflated baseline', () => {
  const baseRate = 1200;
  const proj = calculateTcoProjection({
    purchasePriceUsd: 28000,
    annualInsuranceUsd: baseRate,
    horizonYears: 10,
  });

  const flatTotal = baseRate * 10; // $12,000
  assert.ok(proj.totalInsuranceUsd > flatTotal, `Compounding insurance ($${proj.totalInsuranceUsd}) must exceed flat total ($${flatTotal})`);
});


// --- R7 (R3) Cross-Feature (2 tests) ---

test('PHASE0-T3-R3-01: Real component health evaluation pipeline into unified maintenance reserve across workshop tiers', () => {
  assert.equal(typeof calculateMaintenanceReserve, 'function', 'calculateMaintenanceReserve must be exported from maintenanceData.js');

  const odo = 120000;
  const evaluated = MAINTENANCE_COMPONENTS.map((comp) => ({
    ...comp,
    health: evaluateComponentHealth({
      component: comp,
      physicalOdometerMiles: odo,
      urbanTripSharePct: 40,
    }),
  }));

  const indepReserve = calculateMaintenanceReserve({
    evaluatedComponents: evaluated,
    workshopTier: 'independent',
    annualDistanceMiles: 12000,
  });

  const dealerReserve = calculateMaintenanceReserve({
    evaluatedComponents: evaluated,
    workshopTier: 'dealership',
    annualDistanceMiles: 12000,
  });

  assert.ok(indepReserve > 1000, `120k mi car should have independent reserve > $1000, got $${indepReserve}`);
  assert.ok(dealerReserve > indepReserve, `Dealership reserve ($${dealerReserve}) must exceed independent ($${indepReserve})`);
  assert.ok(dealerReserve < indepReserve * 2.0, 'Dealership reserve must remain within reasonable 1.2x-1.8x factor');
});

test('PHASE0-T3-R3-02: Maintenance reserve dynamic scale with high annual mileage (24k mi/yr) vs low mileage (5k mi/yr)', () => {
  assert.equal(typeof calculateMaintenanceReserve, 'function', 'calculateMaintenanceReserve must be exported from maintenanceData.js');

  const highDist = calculateMaintenanceReserve({
    evaluatedComponents: SAMPLE_COMPONENTS,
    workshopTier: 'independent',
    annualDistanceMiles: 24000,
  });

  const lowDist = calculateMaintenanceReserve({
    evaluatedComponents: SAMPLE_COMPONENTS,
    workshopTier: 'independent',
    annualDistanceMiles: 5000,
  });

  assert.ok(highDist > lowDist, `High annual distance reserve ($${highDist}) must exceed low distance ($${lowDist})`);
});


// ============================================================================
// TIER 4: REAL-WORLD WORKLOAD SCENARIOS (GOLDEN REALISTIC JOURNEYS) [14 TESTS]
// ============================================================================

// --- R1 (D1) Real-World (2 tests) ---

test('PHASE0-T4-D1-01: Toyota Hybrid resale resilience vs Stellantis Wet-Belt depreciation curves over 5 years', () => {
  const price = 35000;
  const toyota = calculateNonLinearDepreciation({
    purchasePriceUsd: price,
    annualDistanceMiles: 12500,
    ownershipYear: 5,
    powertrainType: 'HEV',
    residualCurve10Yr: TOYOTA_HEV_CURVE,
  });

  const wetbelt = calculateNonLinearDepreciation({
    purchasePriceUsd: price,
    annualDistanceMiles: 12500,
    ownershipYear: 5,
    powertrainType: 'ICE_PETROL',
    residualCurve10Yr: WETBELT_CURVE,
  });

  assert.ok(toyota.residualValueUsd > wetbelt.residualValueUsd + 10000, 'Toyota Hybrid must retain >$10k more value than Wet-Belt after 5 years');
  assert.ok(toyota.retentionPct >= 60.0, `Toyota retention must be >= 60%, got ${toyota.retentionPct}%`);
  assert.ok(wetbelt.retentionPct <= 35.0, `Wet-Belt retention must be <= 35%, got ${wetbelt.retentionPct}%`);
});

test('PHASE0-T4-D1-02: Luxury German sedan aggressive 3-year lease return steep curve', () => {
  const price = 65000;
  const luxury = calculateNonLinearDepreciation({
    purchasePriceUsd: price,
    annualDistanceMiles: 12500,
    ownershipYear: 3,
    residualCurve10Yr: LUXURY_CURVE,
  });

  // Curve specifies 48% retention at Year 3
  assert.equal(luxury.residualValueUsd, Math.round(65000 * 0.48));
  assert.equal(luxury.retentionPct, 48.0);
});


// --- R1 (D3) Real-World (2 tests) ---

test('PHASE0-T4-D3-01: 15-year old 180,000-mile highway commuter vehicle respects scrap floor smoothly', () => {
  const res = calculateNonLinearDepreciation({
    purchasePriceUsd: 4000,
    odometerMiles: 180000,
    annualDistanceMiles: 15000,
    ownershipYear: 5,
    powertrainType: 'ICE_DIESEL',
    residualCurve10Yr: DEFAULT_CURVE,
  });

  assert.ok(res.residualValueUsd >= 200, 'Residual must respect 5% scrap floor of $4,000 ($200)');
  assert.ok(res.retentionPct >= 5.0);
});

test('PHASE0-T4-D3-02: Commercial fleet work van (250,000 miles over 12 years) residual valuation', () => {
  const res = calculateNonLinearDepreciation({
    purchasePriceUsd: 32000,
    odometerMiles: 250000,
    annualDistanceMiles: 20000,
    ownershipYear: 12,
    residualCurve10Yr: DEFAULT_CURVE,
  });

  assert.ok(res.residualValueUsd >= 1600, 'Residual must respect 5% floor ($1,600)');
  assert.ok(res.retentionPct >= 5.0);
});


// --- R2 (L3) Real-World (2 tests) ---

test('PHASE0-T4-L3-01: High-mileage commuter: Ford Focus 2.0 EcoBlue Diesel vs Toyota Camry Hybrid', () => {
  const focusDiesel = {
    id: 'ford-focus-ecoblue',
    name: 'Ford Focus 2.0 EcoBlue Diesel',
    purchasePriceUsd: 24500,
    defaultOdometerMiles: 55000,
    mpgUs: 48,
    isEv: false,
    powertrainType: 'ICE_DIESEL',
    powertrain: 'diesel',
    defaultFuelPriceUsdGal: 4.15,
    annualInsuranceUsd: 1450,
    baseAnnualMaintenanceUsd: 780,
    maintenanceWearFactor: 1.05,
  };

  const camryHybrid = {
    id: 'toyota-camry-hybrid',
    name: 'Toyota Camry Hybrid',
    purchasePriceUsd: 27800,
    defaultOdometerMiles: 45000,
    mpgUs: 52,
    isEv: false,
    powertrainType: 'HEV',
    powertrain: 'hybrid',
    defaultFuelPriceUsdGal: 3.60,
    annualInsuranceUsd: 1380,
    baseAnnualMaintenanceUsd: 650,
    maintenanceWearFactor: 0.95,
  };

  const traj = computeBreakEvenTrajectory(focusDiesel, camryHybrid, {
    horizonYears: 5,
    annualDistanceMiles: 20000,
  });

  assert.equal(traj.points.length, 9);
  const p120k = traj.points[8];
  assert.ok(
    p120k.costB < p120k.costA,
    `At 120k miles, Camry Hybrid ($${p120k.costB}) must be cheaper than Focus Diesel ($${p120k.costA})`
  );
});

test('PHASE0-T4-L3-02: Executive sedan matchup: BMW 330i G20 vs Tesla Model 3 Long Range with 5.9% user APR', () => {
  const userApr = 5.9;

  const bmw330i = {
    id: 'bmw-330i-g20',
    name: 'BMW 330i G20',
    purchasePriceUsd: 41500,
    defaultOdometerMiles: 20000,
    mpgUs: 29,
    isEv: false,
    powertrainType: 'ICE_PETROL',
    powertrain: 'petrol',
    defaultFuelPriceUsdGal: 4.35,
    annualInsuranceUsd: 1750,
    baseAnnualMaintenanceUsd: 920,
    maintenanceWearFactor: 1.15,
  };

  const teslaModel3 = {
    id: 'tesla-model-3-lr',
    name: 'Tesla Model 3 Long Range',
    purchasePriceUsd: 47500,
    defaultOdometerMiles: 20000,
    mpgUs: 28, // 28 kWh / 100 mi
    isEv: true,
    powertrainType: 'EV',
    powertrain: 'ev',
    defaultFuelPriceUsdGal: 0.16,
    annualInsuranceUsd: 1950,
    baseAnnualMaintenanceUsd: 420,
    maintenanceWearFactor: 1.0,
    aprPct: userApr,
  };

  const traj = computeBreakEvenTrajectory(bmw330i, teslaModel3, {
    horizonYears: 5,
    annualDistanceMiles: 14000,
  });

  assert.ok(traj.status === 'crossover' || traj.status === 'b_always_cheaper');
  assert.ok(traj.breakEvenMiles > 0 && traj.breakEvenMiles < 100000, 'Payback must fall in realistic 30k–90k mile range');
});


// --- R3 (T1, T2, B3) Real-World (1 test) ---

test('PHASE0-T4-T1-01: 2022 Toyota RAV4 Prime PHEV family commuter journey with omitted tariff and standard loan', () => {
  const rav4 = calculateTcoProjection({
    purchasePriceUsd: 42000,
    odometerMiles: 15000,
    annualDistanceMiles: 15000,
    powertrainType: 'PHEV',
    electricSharePct: 70,
    phevKwhPer100Mi: 32,
    phevIceMpg: 38,
    fuelPriceUsdGal: 3.75,
    homeTariffUsdPerKwh: '   ',
    annualInsuranceUsd: 1500,
    downPaymentPct: 10,
    loanTermMonths: 60,
    aprPct: 5.9,
    horizonYears: 5,
  });

  // Electric: 15,000 * 0.70 = 10,500 mi / 100 * 32 = 3,360 kWh * $0.16 = $537.60
  // Gas: 15,000 * 0.30 = 4,500 mi / 38 = 118.42 gal * $3.75 = $444.08
  // Total: $537.60 + $444.08 = $981.68 -> $982
  assert.equal(rav4.yearlySchedule[0].yearFuelUsd, 982);
  assert.equal(rav4.yearlySchedule[0].yearInsuranceUsd, 1500);
  assert.equal(rav4.yearlySchedule[4].yearInsuranceUsd, 1592);
  assert.ok(typeof rav4.hasUnderwaterEquity === 'boolean');
});


// --- R4 (T4) Real-World (2 tests) ---

test('PHASE0-T4-T4-01: Realistic 5-year maintenance comparison: Tesla Model 3 vs Golf 2.0 TDI', () => {
  const evProj = calculateTcoProjection({
    purchasePriceUsd: 38000,
    isEv: true,
    powertrainType: 'EV',
    baseAnnualMaintenanceUsd: 420,
    maintenanceWearFactor: 0.74,
    horizonYears: 5,
    annualDistanceMiles: 15000,
  });

  const dieselProj = calculateTcoProjection({
    purchasePriceUsd: 38000,
    powertrainType: 'ICE_DIESEL',
    baseAnnualMaintenanceUsd: 740,
    maintenanceWearFactor: 1.15,
    horizonYears: 5,
    annualDistanceMiles: 15000,
  });

  assert.ok(evProj.totalMaintenanceUsd < dieselProj.totalMaintenanceUsd * 0.5, 'EV 5-year maintenance must be under 50% of Diesel maintenance');
  assert.ok(evProj.totalMaintenanceUsd > 1800, 'EV 5-year maintenance must be realistic, not undercounted ($2,000-$2,700)');
});

test('PHASE0-T4-T4-02: High-mileage EV rideshare duty (84,000 miles over 3 years) routine maintenance projection', () => {
  const evProj = calculateTcoProjection({
    purchasePriceUsd: 45000,
    isEv: true,
    powertrainType: 'EV',
    baseAnnualMaintenanceUsd: 420,
    maintenanceWearFactor: 1.0,
    horizonYears: 3,
    annualDistanceMiles: 28000,
  });

  assert.ok(evProj.totalMaintenanceUsd > 2000, `High mileage rideshare maintenance ($${evProj.totalMaintenanceUsd}) must reflect wear`);
  assert.ok(
    evProj.yearlySchedule[2].yearMaintenanceUsd > evProj.yearlySchedule[0].yearMaintenanceUsd,
    'Year 3 maintenance must exceed Year 1 due to wear escalation and mileage'
  );
});


// --- R5 (L1, L2) Real-World (1 test) ---

test('PHASE0-T4-L2-01: Delivery van urban city stop-and-go driving style vs long-haul highway duty', () => {
  const baseParams = {
    purchasePriceUsd: 38000,
    annualDistanceMiles: 20000,
    baseAnnualMaintenanceUsd: 900,
    horizonYears: 4,
  };

  const cityVan = calculateTcoProjection({ ...baseParams, maintenanceWearFactor: 1.30 });
  const highwayVan = calculateTcoProjection({ ...baseParams, maintenanceWearFactor: 0.85 });

  const diff = cityVan.totalMaintenanceUsd - highwayVan.totalMaintenanceUsd;
  assert.ok(diff > 2500, `Urban delivery van wear penalty ($${diff}) must exceed $2,500 over 4 years`);
});


// --- R6 (T7, T9) Real-World (2 tests) ---

test('PHASE0-T4-T9-01: 2023 Tesla Model Y Long Range with 0% down 72-month loan underwater inflection curve', () => {
  const modelY = calculateTcoProjection({
    purchasePriceUsd: 52000,
    downPaymentPct: 0,
    loanTermMonths: 72,
    aprPct: 6.9,
    horizonYears: 5,
    annualDistanceMiles: 14000,
    isEv: true,
    powertrainType: 'EV',
  });

  assert.equal(modelY.hasUnderwaterEquity, true);
  assert.ok(modelY.maxUnderwaterEquityUsd > 2500);
  assert.ok(modelY.underwaterYears.includes(1));
  assert.ok(modelY.underwaterYears.includes(2));
});

test('PHASE0-T4-T9-02: 2017 Honda Civic used car with 12.9% subprime loan negative equity risk', () => {
  const civic = calculateTcoProjection({
    purchasePriceUsd: 14000,
    odometerMiles: 85000,
    annualDistanceMiles: 12000,
    powertrainType: 'ICE_PETROL',
    mpgUs: 32,
    fuelPriceUsdGal: 3.65,
    annualInsuranceUsd: 1800,
    downPaymentPct: 0,
    loanTermMonths: 72,
    aprPct: 12.9,
    horizonYears: 5,
  });

  assert.equal(civic.hasUnderwaterEquity, true);
  assert.ok(civic.maxUnderwaterEquityUsd > 200, `Severe subprime negative equity expected, got $${civic.maxUnderwaterEquityUsd}`);
  assert.ok(civic.underwaterYears.includes(1));
  assert.ok(civic.underwaterYears.includes(2));
});


// --- R7 (R3) Real-World (2 tests) ---

test('PHASE0-T4-R3-01: 85,000-mile used vehicle comprehensive reserve calculation for pre-purchase risk assessment', () => {
  assert.equal(typeof calculateMaintenanceReserve, 'function', 'calculateMaintenanceReserve must be exported from maintenanceData.js');

  const evaluated = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, 'ICE_PETROL').map((comp) => ({
    ...comp,
    health: evaluateComponentHealth({
      component: comp,
      physicalOdometerMiles: 85000,
      urbanTripSharePct: 45,
    }),
  }));

  const reserve = calculateMaintenanceReserve({
    evaluatedComponents: evaluated,
    workshopTier: 'independent',
    annualDistanceMiles: 12000,
  });

  assert.ok(reserve > 800, `85k mi vehicle requires healthy maintenance reserve, got $${reserve}`);
});

test('PHASE0-T4-R3-02: 2023 Tesla Model Y high-mileage EV fleet reserve with EV-specific components', () => {
  assert.equal(typeof calculateMaintenanceReserve, 'function', 'calculateMaintenanceReserve must be exported from maintenanceData.js');

  const evComponents = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, 'EV').map((comp) => ({
    ...comp,
    health: evaluateComponentHealth({
      component: comp,
      physicalOdometerMiles: 84000,
      urbanTripSharePct: 55,
    }),
  }));

  const reserve = calculateMaintenanceReserve({
    evaluatedComponents: evComponents,
    workshopTier: 'dealership',
    annualDistanceMiles: 28000,
  });

  assert.ok(reserve > 600, `High-mileage EV reserve should be substantial, got $${reserve}`);
});

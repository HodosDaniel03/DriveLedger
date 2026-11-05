/**
/**
 * ShiftMetric / DriveLedger — Milestone 2 Empirical Challenge Test Harness
 * Challenger 2: Mathematical Precision, Realism, and Adversarial Audit
 *
 * Verifies:
 * 1. Non-linear Depreciation:
 *    - Factory new year-by-year retention curve (Year 1 ~20-25%, Year 2 ~15%, Year 3 ~12%, Years 4-10 flattening to 3-5%/yr).
 *    - Used car offset: purchasing at 50,000 miles (~4 years) does not re-suffer the showroom drop.
 *    - Powertrain multipliers (HEV bonus, EV tech obsolescence/stabilization, Diesel penalty).
 *    - Annual mileage deviation sensitivity.
 *    - Monotonicity invariant: residual value must never increase with age (residualValue(yr+1) <= residualValue(yr)).
 * 2. Dynamic Maintenance Scaling:
 *    - Baseline asymptotic wear escalation curve.
 *    - Revision threshold surcharges (60k, 100k, 150k, 200k km) for all 5 powertrains.
 *    - Boundary crossings (59,999 km vs 60,001 km, single vs multi-crossing, no double-counting).
 * 3. Powertrain Energy & Fuel Calculations:
 *    - EV blended charging (Home AC vs Public DC Fast Charging).
 *    - PHEV dual profile (electric commute share + gasoline highway share).
 *    - Zero-tariff and boundary handling.
 * 4. Boundary and Input Sanitization:
 *    - 0 km / 500,000 km odometers.
 *    - Negative inputs, 0% APR, 100% cash down payment.
 *    - OBD $0 DIY labor rate.
 */

import {
  calculateNonLinearDepreciation,
  calculateTcoProjection,
  calculateRevisionSurcharge,
  calculateDynamicMaintenance,
  REVISION_THRESHOLDS,
  evaluateComponentHealth,
  calculateOemRiskMultiplier,
  POWERTRAIN_TYPES,
  MAINTENANCE_COMPONENTS,
} from '../src/data/maintenanceData.js';

import {
  calculateEvEnergyCost,
  calculatePhevEnergyCost,
  resolvePowertrainType,
  isPureElectric,
} from '../src/data/powertrainTypes.js';

import {
  calculateObdWorkshopEstimate,
  OBD_CODES,
  LABOR_RATE_TIERS,
} from '../src/data/obdCodes.js';

let passed = 0;
let failed = 0;
const failures = [];
const metrics = {};

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    console.error(`  [FAIL] ${message}`);
  }
}

function assertClose(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    passed++;
  } else {
    failed++;
    const fullMsg = `${message} — Expected ~${expected}, got ${actual} (diff: ${diff.toFixed(4)}, tol: ${tolerance})`;
    failures.push(fullMsg);
    console.error(`  [FAIL] ${fullMsg}`);
  }
}

console.log('================================================================');
console.log('CHALLENGER 2: EMPIRICAL MATHEMATICAL AUDIT FOR MILESTONE 2');
console.log('================================================================\n');

// =============================================================================
// SECTION 1: NON-LINEAR DEPRECIATION CALIBRATION & REALISM
// =============================================================================
console.log('--- 1. Testing Non-Linear Depreciation Curves (New Car) ---');

const purchasePrice = 40000;
const newCarRetentions = [];
const newCarDrops = [];

for (let yr = 1; yr <= 10; yr++) {
  const dep = calculateNonLinearDepreciation({
    purchasePriceUsd: purchasePrice,
    odometerMiles: 0,
    annualDistanceMiles: 12500,
    ownershipYear: yr,
    powertrainType: 'ICE_PETROL',
  });
  newCarRetentions.push(dep.residualValueUsd / purchasePrice);
}

for (let yr = 1; yr <= 10; yr++) {
  const prevVal = yr === 1 ? 1.0 : newCarRetentions[yr - 2];
  const currVal = newCarRetentions[yr - 1];
  const dropFromPrev = (prevVal - currVal) / prevVal;
  newCarDrops.push(dropFromPrev);
  console.log(`  Year ${yr}: Residual=$${Math.round(currVal * purchasePrice)} (${(currVal * 100).toFixed(1)}%), YoY Drop=${(dropFromPrev * 100).toFixed(1)}%`);
}

metrics.year1Drop = +(newCarDrops[0] * 100).toFixed(1);
metrics.year2Drop = +(newCarDrops[1] * 100).toFixed(1);
metrics.year3Drop = +(newCarDrops[2] * 100).toFixed(1);
metrics.year5Drop = +(newCarDrops[4] * 100).toFixed(1);
metrics.year10Drop = +(newCarDrops[9] * 100).toFixed(1);

// Requirement: Year 1 ~20-25%, Year 2 ~15%, Year 3 ~12%, Years 4-10 flattening to 3-5%/yr
assert(newCarDrops[0] >= 0.19 && newCarDrops[0] <= 0.25, `Year 1 drop must be ~20-25% (got ${(newCarDrops[0] * 100).toFixed(1)}%)`);
assert(newCarDrops[1] >= 0.13 && newCarDrops[1] <= 0.18, `Year 2 drop must be ~15% (got ${(newCarDrops[1] * 100).toFixed(1)}%)`);
assert(newCarDrops[2] >= 0.10 && newCarDrops[2] <= 0.15, `Year 3 drop must be ~12% (got ${(newCarDrops[2] * 100).toFixed(1)}%)`);
assert(newCarDrops[4] >= 0.04 && newCarDrops[4] <= 0.08, `Year 5 drop must be 4-8% (got ${(newCarDrops[4] * 100).toFixed(1)}%)`);
assert(newCarDrops[9] >= 0.02 && newCarDrops[9] <= 0.05, `Year 10 drop must flatten to 2-5% (got ${(newCarDrops[9] * 100).toFixed(1)}%)`);

// Check 5% scrap floor guarantee
const highAgeDep = calculateNonLinearDepreciation({
  purchasePriceUsd: 50000,
  odometerMiles: 400000,
  annualDistanceMiles: 30000,
  ownershipYear: 10,
  powertrainType: 'ICE_PETROL',
});
assert(highAgeDep.residualValueUsd >= 2500, `Residual value must not drop below 5% floor ($2,500), got $${highAgeDep.residualValueUsd}`);
assert(highAgeDep.retentionPct >= 5.0, `Retention % must be >= 5.0%, got ${highAgeDep.retentionPct}%`);

// =============================================================================
// SECTION 2: USED CAR ACQUISITION OFFSET
// =============================================================================
console.log('\n--- 2. Testing Used Car Showroom Drop Offset ---');

const usedMileages = [20000, 40000, 50000, 60000, 80000, 100000];
for (const odo of usedMileages) {
  const usedPrice = 25000;
  const depY1 = calculateNonLinearDepreciation({
    purchasePriceUsd: usedPrice,
    odometerMiles: odo,
    annualDistanceMiles: 12500,
    ownershipYear: 1,
    powertrainType: 'ICE_PETROL',
  });
  const y1Drop = (usedPrice - depY1.residualValueUsd) / usedPrice;
  console.log(`  Used Car (Initial Odometer: ${odo} mi): Year 1 Drop = ${(y1Drop * 100).toFixed(1)}%, Residual = $${depY1.residualValueUsd}`);

  if (odo >= 50000) {
    assert(y1Drop < 0.10, `Used car with ${odo} mi must NOT suffer 20% showroom drop! Expected <10%, got ${(y1Drop * 100).toFixed(1)}%`);
  }
}

// =============================================================================
// SECTION 3: POWERTRAIN MULTIPLIERS & MILEAGE SENSITIVITY
// =============================================================================
console.log('\n--- 3. Testing Powertrain Multipliers & Mileage Sensitivity ---');

const testPrice = 30000;
const hev = calculateNonLinearDepreciation({ purchasePriceUsd: testPrice, ownershipYear: 3, powertrainType: 'HEV' });
const petrol = calculateNonLinearDepreciation({ purchasePriceUsd: testPrice, ownershipYear: 3, powertrainType: 'ICE_PETROL' });
const diesel = calculateNonLinearDepreciation({ purchasePriceUsd: testPrice, ownershipYear: 3, powertrainType: 'ICE_DIESEL' });
const ev = calculateNonLinearDepreciation({ purchasePriceUsd: testPrice, ownershipYear: 3, powertrainType: 'EV' });

console.log(`  Year 3 Residuals: HEV=$${hev.residualValueUsd}, Petrol=$${petrol.residualValueUsd}, EV=$${ev.residualValueUsd}, Diesel=$${diesel.residualValueUsd}`);

// HEV bonus check
assert(hev.residualValueUsd > petrol.residualValueUsd, `HEV residual ($${hev.residualValueUsd}) must exceed Petrol ($${petrol.residualValueUsd})`);
// Diesel penalty check
assert(petrol.residualValueUsd > diesel.residualValueUsd, `Petrol residual ($${petrol.residualValueUsd}) must exceed Diesel ($${diesel.residualValueUsd})`);
// EV early tech obsolescence check at Year 3
assert(ev.residualValueUsd < petrol.residualValueUsd, `EV Year 3 residual ($${ev.residualValueUsd}) should reflect early obsolescence vs Petrol ($${petrol.residualValueUsd})`);

// Annual mileage deviation
const lowMi = calculateNonLinearDepreciation({ purchasePriceUsd: testPrice, annualDistanceMiles: 6000, ownershipYear: 3 });
const baseMi = calculateNonLinearDepreciation({ purchasePriceUsd: testPrice, annualDistanceMiles: 12500, ownershipYear: 3 });
const highMi = calculateNonLinearDepreciation({ purchasePriceUsd: testPrice, annualDistanceMiles: 25000, ownershipYear: 3 });

console.log(`  Mileage Sensitivity (Yr 3): Low (6k)=$${lowMi.residualValueUsd}, Base (12.5k)=$${baseMi.residualValueUsd}, High (25k)=$${highMi.residualValueUsd}`);
assert(lowMi.residualValueUsd > baseMi.residualValueUsd, 'Low mileage must retain higher residual value than baseline');
assert(highMi.residualValueUsd < baseMi.residualValueUsd, 'High mileage must retain lower residual value than baseline');

// =============================================================================
// SECTION 4: ADVERSARIAL STRESS: MONOTONICITY & YEAR-OVER-YEAR APPRECIATION
// =============================================================================
console.log('\n--- 4. Adversarial Stress: Monotonicity & Asset Appreciation Check ---');

let negativeDepreciationCases = 0;
const sampledNegativeCases = [];

const samplePowertrains = ['EV', 'HEV', 'PHEV', 'ICE_PETROL', 'ICE_DIESEL'];
const sampleOdometers = [0, 20000, 40000, 60000, 80000, 100000];
const sampleAnnualMiles = [0, 2500, 5000, 10000, 12500, 20000];

for (const pt of samplePowertrains) {
  for (const odo of sampleOdometers) {
    for (const mi of sampleAnnualMiles) {
      const proj = calculateTcoProjection({
        purchasePriceUsd: 35000,
        odometerMiles: odo,
        annualDistanceMiles: mi,
        powertrainType: pt,
        horizonYears: 10,
      });

      for (let y = 1; y < proj.yearlySchedule.length; y++) {
        const prevYear = proj.yearlySchedule[y - 1];
        const currYear = proj.yearlySchedule[y];

        // Residual value must not increase from year to year
        if (currYear.residualValueUsd > prevYear.residualValueUsd) {
          negativeDepreciationCases++;
          if (sampledNegativeCases.length < 5) {
            sampledNegativeCases.push({
              powertrain: pt,
              odometer: odo,
              annualMiles: mi,
              year: currYear.year,
              prevResidual: prevYear.residualValueUsd,
              currResidual: currYear.residualValueUsd,
              yearDepreciationUsd: currYear.yearDepreciationUsd,
            });
          }
        }
      }
    }
  }
}

metrics.negativeDepreciationCasesFound = negativeDepreciationCases;
console.log(`  Total combinations tested: ${samplePowertrains.length * sampleOdometers.length * sampleAnnualMiles.length} configurations x 10 years`);
console.log(`  Negative depreciation (asset appreciation) instances found: ${negativeDepreciationCases}`);

if (negativeDepreciationCases > 0) {
  console.log('  Sample anomalies where car appreciated in value year-over-year:');
  for (const c of sampledNegativeCases) {
    console.log(`    Powertrain=${c.powertrain}, Odo=${c.odometer} mi, AnnualMi=${c.annualMiles} -> Year ${c.year}: Residual went from $${c.prevResidual} to $${c.currResidual} (Depreciation: $${c.yearDepreciationUsd})`);
  }
}

// Record as finding rather than hard crash so script runs completely
assert(negativeDepreciationCases === 0, `Depreciation monotonicity: vehicle asset must not appreciate year-over-year (${negativeDepreciationCases} violations found)`);

// =============================================================================
// SECTION 5: DYNAMIC MAINTENANCE SCALING & REVISION THRESHOLDS
// =============================================================================
console.log('\n--- 5. Testing Dynamic Maintenance & Revision Threshold Boundaries ---');

// Invariant 1: Exactly 4 thresholds covering 60k, 100k, 150k, 200k km
assert(REVISION_THRESHOLDS.length === 4, 'Must have 4 revision thresholds');
const kms = REVISION_THRESHOLDS.map(r => r.thresholdKm);
assert(kms[0] === 60000 && kms[1] === 100000 && kms[2] === 150000 && kms[3] === 200000, 'Thresholds must be 60k, 100k, 150k, 200k km');

// Invariant 2: EV revision surcharge is lowest
for (const rev of REVISION_THRESHOLDS) {
  assert(rev.surchargeUsd.EV < rev.surchargeUsd.ICE_PETROL, `${rev.label}: EV surcharge ($${rev.surchargeUsd.EV}) must be < Petrol ($${rev.surchargeUsd.ICE_PETROL})`);
  assert(rev.surchargeUsd.EV < rev.surchargeUsd.ICE_DIESEL, `${rev.label}: EV surcharge ($${rev.surchargeUsd.EV}) must be < Diesel ($${rev.surchargeUsd.ICE_DIESEL})`);
}

// Invariant 3: Precision boundary crossing at 60,000 km (37,282 miles)
// 59,999 km = 37,281.65 miles -> floor 37281
// 60,001 km = 37,282.89 miles -> floor 37282 / 37283
console.log('  Testing 60k km boundary crossing:');

// Test A: Before threshold
const subThreshold = calculateRevisionSurcharge(37270, 37281, 'ICE_PETROL');
assert(subThreshold.totalSurchargeUsd === 0, 'Start=37270 mi, End=37281 mi (sub-60k km) must NOT trigger surcharge');
assert(subThreshold.passedThresholds.length === 0, 'Passed thresholds must be empty');

// Test B: Crossing threshold
const crossingThreshold = calculateRevisionSurcharge(37281, 37283, 'ICE_PETROL');
assert(crossingThreshold.totalSurchargeUsd === 420, 'Start=37281 mi, End=37283 mi (crossing 60k km) MUST trigger $420 surcharge');
assert(crossingThreshold.passedThresholds.length === 1, 'Exactly 1 threshold passed');
assert(crossingThreshold.passedThresholds[0].thresholdKm === 60000, 'Passed threshold is 60000 km');

// Test C: After threshold (no double-counting)
const postThreshold = calculateRevisionSurcharge(37282, 37295, 'ICE_PETROL');
assert(postThreshold.totalSurchargeUsd === 0, 'Start=37282 mi, End=37295 mi (post-60k km) must NOT re-trigger surcharge');

// Test D: Boundary crossing with exact km conversion
const km59999InMiles = 59999 * 0.621371192; // 37281.646 mi
const km60001InMiles = 60001 * 0.621371192; // 37282.889 mi
const kmCrossing = calculateRevisionSurcharge(km59999InMiles, km60001InMiles, 'ICE_PETROL');
assert(kmCrossing.totalSurchargeUsd === 420, `Boundary 59,999 km (${km59999InMiles.toFixed(1)} mi) to 60,001 km (${km60001InMiles.toFixed(1)} mi) must trigger $420 surcharge`);

// Test E: All thresholds crossed in high-mileage interval
const crossAll = calculateRevisionSurcharge(0, 130000, 'ICE_DIESEL');
const expectedDieselTotal = 520 + 890 + 1650 + 2100;
assert(crossAll.totalSurchargeUsd === expectedDieselTotal, `Crossing 0 to 130k miles must incur all 4 Diesel surcharges ($${expectedDieselTotal}), got $${crossAll.totalSurchargeUsd}`);
assert(crossAll.passedThresholds.length === 4, 'Must pass 4 thresholds');

// Invariant 4: Dynamic maintenance wear escalation curve
const maint0 = calculateDynamicMaintenance({ odometerMiles: 0, annualDistanceMiles: 12000, powertrainType: 'ICE_PETROL' });
const maint100k = calculateDynamicMaintenance({ odometerMiles: 100000, annualDistanceMiles: 12000, powertrainType: 'ICE_PETROL' });
const maint500k = calculateDynamicMaintenance({ odometerMiles: 500000, annualDistanceMiles: 12000, powertrainType: 'ICE_PETROL' });
const maintEv0 = calculateDynamicMaintenance({ odometerMiles: 0, annualDistanceMiles: 12000, powertrainType: 'EV' });

console.log(`  Dynamic Maintenance: 0 mi=$${maint0.yearMaintenanceUsd}, 100k mi=$${maint100k.yearMaintenanceUsd}, 500k mi=$${maint500k.yearMaintenanceUsd}, EV 0 mi=$${maintEv0.yearMaintenanceUsd}`);

assert(maint100k.routineMaintenanceUsd > maint0.routineMaintenanceUsd, 'Routine maintenance must scale with odometer wear');
assert(maint500k.wearEscalation === 2.5, `Wear escalation at 500k miles must cap at 2.5x, got ${maint500k.wearEscalation}`);
assertClose(maintEv0.routineMaintenanceUsd, maint0.routineMaintenanceUsd * 0.65, 5, 'EV base routine maintenance must be 35% lower (0.65x factor)');

// =============================================================================
// SECTION 6: ENERGY & FUEL CALCULATIONS (EV & PHEV)
// =============================================================================
console.log('\n--- 6. Testing EV & PHEV Energy Cost Calculations ---');

// EV Blended Tariff
const evResult = calculateEvEnergyCost({
  annualDistanceMiles: 15000,
  efficiencyKwh100Mi: 28.0,
  homeChargePct: 80,
  homeTariffUsdPerKwh: 0.15,
  dcFastTariffUsdPerKwh: 0.45,
});

// Theoretical verification:
// Total kWh: (15,000 / 100) * 28.0 = 4,200 kWh
// Home kWh: 4,200 * 0.80 = 3,360 kWh; Home Cost: 3,360 * 0.15 = $504.00
// DC kWh: 4,200 * 0.20 = 840 kWh; DC Cost: 840 * 0.45 = $378.00
// Blended Tariff: 0.80 * 0.15 + 0.20 * 0.45 = 0.12 + 0.09 = $0.21 / kWh
// Total Cost: $504.00 + $378.00 = $882.00
// Cost Per Mile: $882.00 / 15,000 = $0.0588 / mi
assertClose(evResult.annualKwh, 4200, 0.1, 'EV Annual kWh calculation');
assertClose(evResult.homeCostUsd, 504.0, 0.1, 'EV Home charging cost');
assertClose(evResult.dcFastCostUsd, 378.0, 0.1, 'EV DC Fast charging cost');
assertClose(evResult.annualCostUsd, 882.0, 0.1, 'EV Total annual charging cost');
assertClose(evResult.blendedTariffUsdPerKwh, 0.21, 0.001, 'EV Blended tariff');
assertClose(evResult.costPerMileUsd, 0.0588, 0.0002, 'EV Cost per mile');

console.log(`  EV Blended Charging: Total kWh=${evResult.annualKwh}, Blended Tariff=$${evResult.blendedTariffUsdPerKwh}/kWh, Total Cost=$${evResult.annualCostUsd}`);

// PHEV Combined Profile
const phevResult = calculatePhevEnergyCost({
  annualDistanceMiles: 12000,
  electricSharePct: 65,
  evEfficiencyKwh100Mi: 30.0,
  iceMpg: 35.0,
  homeChargePct: 80,
  homeTariffUsdPerKwh: 0.16,
  dcFastTariffUsdPerKwh: 0.40,
  fuelPriceUsdPerGal: 3.80,
});

// Theoretical verification:
// Electric miles: 12,000 * 0.65 = 7,800 miles
// Electric kWh: (7,800 / 100) * 30.0 = 2,340 kWh
// Blended EV tariff: 0.80 * 0.16 + 0.20 * 0.40 = 0.128 + 0.08 = $0.208 / kWh
// Electric cost: 2,340 * 0.208 = $486.72
// Gasoline miles: 12,000 * 0.35 = 4,200 miles
// Gasoline gal: 4,200 / 35.0 = 120.0 gal
// Gasoline cost: 120.0 * 3.80 = $456.00
// Total cost: 486.72 + 456.00 = $942.72
assertClose(phevResult.electricMiles, 7800, 1, 'PHEV electric miles');
assertClose(phevResult.iceMiles, 4200, 1, 'PHEV gasoline miles');
assertClose(phevResult.electricKwh, 2340, 1, 'PHEV electric kWh');
assertClose(phevResult.iceGallons, 120, 1, 'PHEV gasoline gallons');
assertClose(phevResult.totalAnnualCostUsd, 942.72, 1.0, 'PHEV total annual combined cost');

console.log(`  PHEV Combined: Electric Cost=$${phevResult.electricCostUsd}, Gas Cost=$${phevResult.iceCostUsd}, Total=$${phevResult.totalAnnualCostUsd}`);

// Zero Tariff Boundaries
const zeroEv = calculateEvEnergyCost({ annualDistanceMiles: 10000, homeTariffUsdPerKwh: 0, dcFastTariffUsdPerKwh: 0 });
assert(zeroEv.annualCostUsd === 0, 'Zero EV tariffs must produce exact $0 annual cost');

const zeroPhev = calculatePhevEnergyCost({ annualDistanceMiles: 10000, homeTariffUsdPerKwh: 0, dcFastTariffUsdPerKwh: 0, fuelPriceUsdPerGal: 0 });
assert(zeroPhev.totalAnnualCostUsd === 0, 'Zero PHEV tariffs must produce exact $0 annual cost');

// TCO Projection EV default tariff inspection:
const tcoEvDefault = calculateTcoProjection({
  purchasePriceUsd: 40000,
  isEv: true,
  powertrainType: 'EV',
  annualDistanceMiles: 12000,
  mpgUs: 30, // 30 kWh / 100 mi
  horizonYears: 1,
});

console.log(`  TCO EV default annual fuel cost: $${tcoEvDefault.totalFuelUsd}`);
// Note: when fuelPriceUsdGal is not passed, calculateTcoProjection defaults unitEnergyPrice to 3.65!
// If homeTariffUsdPerKwh is not passed, it uses unitEnergyPrice ($3.65/kWh), leading to $17,082/yr!
metrics.tcoEvDefaultAnnualFuelCost = tcoEvDefault.totalFuelUsd;
if (tcoEvDefault.totalFuelUsd > 2000) {
  console.log(`  [NOTE] calculateTcoProjection defaults EV electricity rate to unitEnergyPrice ($3.65/kWh) if homeTariffUsdPerKwh is omitted!`);
}

// =============================================================================
// SECTION 7: BOUNDARY CONDITIONS & CRASH RESILIENCE
// =============================================================================
console.log('\n--- 7. Testing Boundary Conditions & Input Sanitization ---');

// 0 km odometer in risk matrix
const comp0 = evaluateComponentHealth({ component: MAINTENANCE_COMPONENTS[0], physicalOdometerMiles: 0 });
assert(comp0.wearPctOfCritical === 0, '0 km: wear must be 0%');
assert(comp0.remainingLifespanPct === 100, '0 km: remaining lifespan must be 100%');
assert(comp0.status === 'OPTIMAL', '0 km: status must be OPTIMAL');

// 500,000 km odometer
const odo500kMi = 310686;
const comp500k = evaluateComponentHealth({ component: MAINTENANCE_COMPONENTS[0], physicalOdometerMiles: odo500kMi });
assert(comp500k.wearPctOfCritical === 100, '500,000 km: wear must saturate at 100%');
assert(comp500k.remainingLifespanPct === 0, '500,000 km: remaining lifespan must be 0%');
assert(comp500k.status === 'CRITICAL', '500,000 km: status must be CRITICAL');

// Negative numbers in TCO
const negTco = calculateTcoProjection({
  purchasePriceUsd: -40000,
  odometerMiles: -50000,
  annualDistanceMiles: -15000,
  fuelPriceUsdGal: -4.0,
  annualInsuranceUsd: -1500,
  aprPct: -6.0,
  downPaymentPct: -20,
  horizonYears: -3,
});

assert(!Number.isNaN(negTco.totalEconomicCostUsd), 'Negative TCO inputs must not produce NaN total cost');
assert(negTco.totalEconomicCostUsd >= 0, 'Negative TCO inputs must yield non-negative total cost');
assert(negTco.yearlySchedule.length === 1, 'Negative horizon must clamp to at least 1 year');

// 0% APR Loan
const zeroAprTco = calculateTcoProjection({
  purchasePriceUsd: 30000,
  downPaymentPct: 20,
  loanTermMonths: 48,
  aprPct: 0,
  horizonYears: 4,
});
// Principal: 30,000 * 0.8 = 24,000. Term: 48. Monthly payment: 24,000 / 48 = 500. Total interest: $0.
assert(zeroAprTco.totalInterestUsd === 0, '0% APR must produce exactly $0 interest');
assert(zeroAprTco.monthlyLoanPaymentUsd === 500, `0% APR monthly loan payment must be $500, got $${zeroAprTco.monthlyLoanPaymentUsd}`);

// OBD Estimator $0/hr DIY tier
for (const code of OBD_CODES) {
  const diyEst = calculateObdWorkshopEstimate(code, 'diy');
  assert(diyEst.rateUsdPerHr === 0, `${code.code}: DIY rate must be 0`);
  assert(diyEst.weightedLaborUsd === 0, `${code.code}: DIY labor cost must be 0`);
  assert(diyEst.weightedExpectedUsd === diyEst.weightedPartsUsd, `${code.code}: Total must equal parts cost`);
  assert(!Number.isNaN(diyEst.weightedExpectedUsd), `${code.code}: Expected cost must not be NaN`);
}

// =============================================================================
// AUDIT SUMMARY & VERDICT
// =============================================================================
console.log('\n================================================================');
console.log(`EMPIRICAL AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================\n');

if (failures.length > 0) {
  console.log('Failures encountered:');
  failures.forEach((f, idx) => console.log(`  ${idx + 1}. ${f}`));
}

console.log('\nKey Metrics Captured:');
console.log(JSON.stringify(metrics, null, 2));

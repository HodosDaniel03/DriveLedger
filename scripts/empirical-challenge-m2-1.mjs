/**
 * Empirical Challenger 1 Stress Harness for Milestone 2:
 * Calculator Mathematics & Financial Logic Audit.
 *
 * Scope:
 * 1. 0 km / 0 miles: division by zero, NaN, crashes in depreciation, dynamic maintenance, TCO, risk matrix.
 * 2. 500,000+ km: residual retention floor (>= 5% of purchase price), wear escalation saturation.
 * 3. Negative numbers: negative purchase price, mileage, insurance, APR, fuel prices (safely clamped).
 * 4. Falsy zeros: $0.00 home tariff, $0.00 DC tariff, $0.00 fuel price, $0 insurance, 0% APR.
 * 5. Unrealistic model years: 1850, 2500, negative years.
 */

import {
  calculateTcoProjection,
  calculateNonLinearDepreciation,
  calculateDynamicMaintenance,
  calculateRevisionSurcharge,
  REVISION_THRESHOLDS,
  evaluateComponentHealth,
  calculateOemRiskMultiplier,
  filterComponentsForPowertrain,
  MAINTENANCE_COMPONENTS,
  POWERTRAIN_TYPES,
  isPureElectric,
  resolvePowertrainType,
} from '../src/data/maintenanceData.js';

import {
  calculateBatterySoh,
  calculateEvEnergyCost,
  calculatePhevEnergyCost,
  calculateVehicleEnergyCost,
} from '../src/data/powertrainTypes.js';

import {
  VEHICLE_PRESETS,
  getPresetById,
} from '../src/data/vehiclePresets.js';

import {
  hydrateVehiclePreset,
} from '../src/data/powertrainArchetypes.js';

import {
  deriveTechnicalBadges,
  resolvePowertrainArchetype,
} from '../src/components/common/vehicle/vehicleArchetypes.js';

import {
  calculateObdWorkshopEstimate,
  OBD_CODES,
  LABOR_RATE_TIERS,
} from '../src/data/obdCodes.js';

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    console.error(`  [FAIL]: ${message}`);
  }
}

function assertFiniteNumber(value, name) {
  assert(
    typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value),
    `${name} must be a finite number, received: ${value} (type: ${typeof value})`
  );
}

console.log('================================================================');
console.log('CHALLENGER 1: EMPIRICAL STRESS TEST SUITE (MILESTONE 2 AUDIT)');
console.log('================================================================\n');

// =============================================================================
// TEST SUITE 1: 0 KM / 0 MILES BOUNDARY CONDITIONS
// =============================================================================
console.log('--- 1. Testing 0 km / 0 miles boundary conditions ---');

// 1.1 calculateNonLinearDepreciation at 0 mi start, 0 mi annual
try {
  const dep0 = calculateNonLinearDepreciation({
    purchasePriceUsd: 45000,
    odometerMiles: 0,
    annualDistanceMiles: 0,
    ownershipYear: 1,
    powertrainType: 'EV',
  });

  assertFiniteNumber(dep0.residualValueUsd, 'dep0.residualValueUsd');
  assertFiniteNumber(dep0.cumulativeDepreciationUsd, 'dep0.cumulativeDepreciationUsd');
  assertFiniteNumber(dep0.retentionPct, 'dep0.retentionPct');
  assert(dep0.residualValueUsd > 0, `Residual value must be positive at 0 miles, got ${dep0.residualValueUsd}`);
  assert(dep0.retentionPct > 0 && dep0.retentionPct <= 100, `Retention pct must be valid 0-100%, got ${dep0.retentionPct}`);
  assert(dep0.residualValueUsd + dep0.cumulativeDepreciationUsd === 45000, 'Residual + cumulative depreciation must equal purchase price');
} catch (err) {
  assert(false, `calculateNonLinearDepreciation crashed at 0 miles: ${err.message}`);
}

// 1.2 calculateDynamicMaintenance at 0 mi start, 0 mi annual
try {
  const maint0 = calculateDynamicMaintenance({
    baseAnnualMaintenanceUsd: 800,
    odometerMiles: 0,
    annualDistanceMiles: 0,
    powertrainType: 'ICE_PETROL',
    ownershipYear: 1,
  });

  assertFiniteNumber(maint0.yearMaintenanceUsd, 'maint0.yearMaintenanceUsd');
  assertFiniteNumber(maint0.routineMaintenanceUsd, 'maint0.routineMaintenanceUsd');
  assertFiniteNumber(maint0.revisionSurchargeUsd, 'maint0.revisionSurchargeUsd');
  assert(maint0.yearMaintenanceUsd === 0, `Maintenance at 0 miles annual distance must be $0, got ${maint0.yearMaintenanceUsd}`);
  assert(maint0.revisionSurchargeUsd === 0, `Revision surcharge at 0 miles must be $0, got ${maint0.revisionSurchargeUsd}`);
  assert(maint0.wearEscalation === 1.0, `Wear escalation at 0 miles must be 1.0, got ${maint0.wearEscalation}`);
} catch (err) {
  assert(false, `calculateDynamicMaintenance crashed at 0 miles: ${err.message}`);
}

// 1.3 calculateTcoProjection at 0 mi start, 0 mi annual
try {
  const tco0 = calculateTcoProjection({
    purchasePriceUsd: 35000,
    odometerMiles: 0,
    annualDistanceMiles: 0,
    mpgUs: 32,
    horizonYears: 5,
    annualInsuranceUsd: 1200,
    powertrainType: 'ICE_PETROL',
  });

  assertFiniteNumber(tco0.totalEconomicCostUsd, 'tco0.totalEconomicCostUsd');
  assertFiniteNumber(tco0.costPerMileUsd, 'tco0.costPerMileUsd');
  assert(tco0.costPerMileUsd === 0, `Cost per mile at 0 total miles must be $0.00 (no div by zero), got ${tco0.costPerMileUsd}`);
  assert(tco0.totalFuelUsd === 0, `Total fuel cost at 0 miles must be $0, got ${tco0.totalFuelUsd}`);
  assert(tco0.totalDistanceMiles === 0, `Total distance must be 0, got ${tco0.totalDistanceMiles}`);

  // Breakdown sanity check
  for (const b of tco0.breakdown) {
    assertFiniteNumber(b.amountUsd, `breakdown[${b.id}].amountUsd`);
    assertFiniteNumber(b.sharePct, `breakdown[${b.id}].sharePct`);
    assertFiniteNumber(b.perMileUsd, `breakdown[${b.id}].perMileUsd`);
    assert(b.perMileUsd === 0, `breakdown[${b.id}].perMileUsd at 0 miles must be 0, got ${b.perMileUsd}`);
  }

  // Yearly schedule sanity check
  for (const row of tco0.yearlySchedule) {
    assertFiniteNumber(row.residualValueUsd, `year[${row.year}].residualValueUsd`);
    assertFiniteNumber(row.cumulativeTotalCostUsd, `year[${row.year}].cumulativeTotalCostUsd`);
    assert(row.odometerMiles === 0, `Yearly odometer at 0 annual miles must be 0, got ${row.odometerMiles}`);
  }
} catch (err) {
  assert(false, `calculateTcoProjection crashed at 0 miles: ${err.message}`);
}

// 1.4 MaintenanceRiskMatrix component evaluation at 0 odometer
try {
  const oemRisk0 = calculateOemRiskMultiplier(0);
  assertFiniteNumber(oemRisk0, 'calculateOemRiskMultiplier(0)');
  assert(oemRisk0 >= 2.2 && oemRisk0 <= 3.1, `OEM risk multiplier at 0 mi must be within [2.2, 3.1], got ${oemRisk0}`);

  for (const comp of MAINTENANCE_COMPONENTS) {
    const health = evaluateComponentHealth({
      component: comp,
      physicalOdometerMiles: 0,
      urbanTripSharePct: 45,
      powertrainType: 'ICE_PETROL',
    });
    if (health) {
      assertFiniteNumber(health.effectiveWearMiles, `${comp.id}.effectiveWearMiles at 0 mi`);
      assertFiniteNumber(health.wearPctOfCritical, `${comp.id}.wearPctOfCritical at 0 mi`);
      assertFiniteNumber(health.remainingPhysicalMiles, `${comp.id}.remainingPhysicalMiles at 0 mi`);
      assert(health.effectiveWearMiles === 0, `${comp.id} effective wear at 0 mi must be 0`);
      assert(health.wearPctOfCritical === 0, `${comp.id} wear % at 0 mi must be 0`);
      assert(health.status === 'OPTIMAL', `${comp.id} status at 0 mi must be OPTIMAL`);
      assert(health.remainingPhysicalMiles > 0, `${comp.id} remaining miles at 0 mi must be > 0`);
    }
  }
} catch (err) {
  assert(false, `Maintenance component health evaluation crashed at 0 miles: ${err.message}`);
}

// =============================================================================
// TEST SUITE 2: 500,000+ KM EXTREME MILEAGE & RESIDUAL RETENTION FLOOR
// =============================================================================
console.log('\n--- 2. Testing 500,000+ km extreme mileage & residual floor ---');

// 500,000 km is approx 310,686 miles
const MILES_500K_KM = 310686;
const MILES_1M_KM = 621371;

// 2.1 Residual floor guarantee across extreme odometers and ownership years
const testPrices = [5000, 25000, 60000, 150000];
const testPowertrains = ['EV', 'PHEV', 'HEV', 'ICE_PETROL', 'ICE_DIESEL'];

for (const price of testPrices) {
  for (const pt of testPowertrains) {
    for (const yr of [1, 5, 10, 20]) {
      const depHighOdo = calculateNonLinearDepreciation({
        purchasePriceUsd: price,
        odometerMiles: MILES_500K_KM,
        annualDistanceMiles: 30000,
        ownershipYear: yr,
        powertrainType: pt,
      });

      const floor = Math.round(price * 0.05);
      assert(
        depHighOdo.residualValueUsd >= floor,
        `Residual floor violated for price $${price}, pt ${pt}, yr ${yr}, odo ${MILES_500K_KM}: residual $${depHighOdo.residualValueUsd} < floor $${floor}`
      );
      assert(
        depHighOdo.retentionPct >= 5.0,
        `Retention % floor violated: got ${depHighOdo.retentionPct}% < 5.0%`
      );
      assert(
        depHighOdo.residualValueUsd > 0,
        `Residual value must never be 0 or negative: got $${depHighOdo.residualValueUsd}`
      );
    }
  }
}

// 2.2 Mega-mileage single vehicle starting new and running 100k mi/yr for 10 years (1,000,000 miles)
const megaDep = calculateNonLinearDepreciation({
  purchasePriceUsd: 50000,
  odometerMiles: 0,
  annualDistanceMiles: 100000,
  ownershipYear: 10,
  powertrainType: 'ICE_DIESEL',
});
assert(
  megaDep.residualValueUsd >= 2500,
  `1,000,000 mi cumulative vehicle residual must remain >= $2500 (5% floor), got $${megaDep.residualValueUsd}`
);

// 2.3 Dynamic maintenance wear escalation saturation at 500,000+ km
const maintHighOdo = calculateDynamicMaintenance({
  baseAnnualMaintenanceUsd: 800,
  odometerMiles: MILES_500K_KM,
  annualDistanceMiles: 15000,
  powertrainType: 'ICE_PETROL',
  ownershipYear: 1,
});

assertFiniteNumber(maintHighOdo.wearEscalation, 'maintHighOdo.wearEscalation');
assert(
  maintHighOdo.wearEscalation === 2.5,
  `Wear escalation must saturate at exactly 2.5 cap for 500,000+ km, got ${maintHighOdo.wearEscalation}`
);
assert(
  maintHighOdo.revisionSurchargeUsd === 0,
  `Vehicles past 200,000 km should incur 0 standard revision surcharges, got $${maintHighOdo.revisionSurchargeUsd}`
);

// 2.4 OEM Risk Multiplier saturation at 500,000 km
const oemRisk500k = calculateOemRiskMultiplier(MILES_500K_KM);
assert(
  oemRisk500k === 3.1,
  `OEM risk multiplier must cap cleanly at 3.1x for 500k km, got ${oemRisk500k}`
);

// 2.5 Component health at 500,000 km
for (const comp of MAINTENANCE_COMPONENTS) {
  const health500k = evaluateComponentHealth({
    component: comp,
    physicalOdometerMiles: MILES_500K_KM,
    urbanTripSharePct: 50,
    powertrainType: 'ICE_PETROL',
  });
  if (health500k) {
    assert(health500k.status === 'CRITICAL', `${comp.id} status at 500k km must be CRITICAL, got ${health500k.status}`);
    assert(health500k.wearPctOfCritical === 100, `${comp.id} wear % at 500k km must be 100%`);
    assert(health500k.remainingLifespanPct === 0, `${comp.id} remaining life % at 500k km must be 0%`);
    assert(health500k.remainingPhysicalMiles === 0, `${comp.id} remaining miles at 500k km must be 0`);
  }
}

// =============================================================================
// TEST SUITE 3: NEGATIVE NUMBERS & SANITIZATION
// =============================================================================
console.log('\n--- 3. Testing negative numbers & clamping sanitization ---');

const negTco = calculateTcoProjection({
  purchasePriceUsd: -40000,
  odometerMiles: -25000,
  annualDistanceMiles: -15000,
  mpgUs: -30,
  fuelPriceUsdGal: -3.85,
  annualInsuranceUsd: -1400,
  aprPct: -6.5,
  downPaymentPct: -20,
  loanTermMonths: -48,
  horizonYears: -3,
  homeTariffUsdPerKwh: -0.15,
  dcFastTariffUsdPerKwh: -0.40,
  electricSharePct: -65,
  phevKwhPer100Mi: -28,
  phevIceMpg: -40,
});

assertFiniteNumber(negTco.totalEconomicCostUsd, 'negTco.totalEconomicCostUsd');
assert(negTco.totalEconomicCostUsd >= 0, `Total economic cost must be non-negative, got $${negTco.totalEconomicCostUsd}`);
assertFiniteNumber(negTco.totalFuelUsd, 'negTco.totalFuelUsd');
assert(negTco.totalFuelUsd >= 0, `Total fuel cost must be non-negative, got $${negTco.totalFuelUsd}`);
assertFiniteNumber(negTco.totalInsuranceUsd, 'negTco.totalInsuranceUsd');
assert(negTco.totalInsuranceUsd >= 0, `Total insurance must be non-negative, got $${negTco.totalInsuranceUsd}`);
assertFiniteNumber(negTco.totalInterestUsd, 'negTco.totalInterestUsd');
assert(negTco.totalInterestUsd >= 0, `Total interest must be non-negative, got $${negTco.totalInterestUsd}`);
assertFiniteNumber(negTco.monthlyLoanPaymentUsd, 'negTco.monthlyLoanPaymentUsd');
assert(negTco.monthlyLoanPaymentUsd >= 0, `Monthly loan payment must be non-negative, got $${negTco.monthlyLoanPaymentUsd}`);
assert(negTco.yearlySchedule.length === 1, `Negative horizon should clamp to minimum 1 year, got ${negTco.yearlySchedule.length}`);
assert(negTco.finalResidualValueUsd > 0, `Final residual value must be positive, got $${negTco.finalResidualValueUsd}`);

// Check negative inputs in depreciation function directly
const negDep = calculateNonLinearDepreciation({
  purchasePriceUsd: -30000,
  odometerMiles: -50000,
  annualDistanceMiles: -15000,
  ownershipYear: -2,
  powertrainType: 'EV',
});

assertFiniteNumber(negDep.residualValueUsd, 'negDep.residualValueUsd');
assert(negDep.residualValueUsd > 0, `Residual value with negative inputs must be positive, got $${negDep.residualValueUsd}`);
assert(negDep.retentionPct >= 5.0, `Retention % with negative inputs must be >= 5%, got ${negDep.retentionPct}%`);

// Check negative inputs in dynamic maintenance directly
const negMaint = calculateDynamicMaintenance({
  baseAnnualMaintenanceUsd: 800,
  odometerMiles: -20000,
  annualDistanceMiles: -10000,
  powertrainType: 'ICE_PETROL',
  ownershipYear: -1,
});

assertFiniteNumber(negMaint.yearMaintenanceUsd, 'negMaint.yearMaintenanceUsd');
assert(negMaint.yearMaintenanceUsd >= 0, `Year maintenance must be non-negative, got $${negMaint.yearMaintenanceUsd}`);

// Check negative inputs in evaluateComponentHealth
for (const comp of MAINTENANCE_COMPONENTS.slice(0, 5)) {
  const negHealth = evaluateComponentHealth({
    component: comp,
    physicalOdometerMiles: -40000,
    urbanTripSharePct: -25,
    powertrainType: 'ICE_PETROL',
  });
  if (negHealth) {
    assert(negHealth.effectiveWearMiles === 0, `Negative physical odo must clamp to 0 wear, got ${negHealth.effectiveWearMiles}`);
    assert(negHealth.wearPctOfCritical === 0, `Wear % must be 0, got ${negHealth.wearPctOfCritical}`);
    assert(negHealth.remainingPhysicalMiles > 0, `Remaining physical miles must be positive, got ${negHealth.remainingPhysicalMiles}`);
  }
}

// =============================================================================
// TEST SUITE 4: FALSY ZERO INTEGRITY & PRESERVATION
// =============================================================================
console.log('\n--- 4. Testing falsy zeros preservation (no unwanted default fallback) ---');

// 4.1 $0 Home Tariff & $0 DC Fast Tariff for EV
const evZeroTariff = calculateTcoProjection({
  purchasePriceUsd: 42000,
  annualDistanceMiles: 15000,
  isEv: true,
  powertrainType: 'EV',
  homeChargePct: 70,
  homeTariffUsdPerKwh: 0,
  dcFastTariffUsdPerKwh: 0,
  horizonYears: 3,
});

assert(
  evZeroTariff.totalFuelUsd === 0,
  `EV with $0 home tariff and $0 DC tariff must produce $0 total charging cost, got $${evZeroTariff.totalFuelUsd}`
);
assert(
  evZeroTariff.yearlySchedule[0].yearFuelUsd === 0,
  `Yearly charging cost must be $0, got $${evZeroTariff.yearlySchedule[0].yearFuelUsd}`
);

// 4.2 $0 Fuel Price for ICE vehicle (e.g. company-paid fuel)
const iceZeroFuel = calculateTcoProjection({
  purchasePriceUsd: 30000,
  annualDistanceMiles: 12000,
  fuelPriceUsdGal: 0,
  mpgUs: 28,
  powertrainType: 'ICE_PETROL',
  horizonYears: 1,
});

assert(
  iceZeroFuel.totalFuelUsd === 0,
  `ICE vehicle with $0 fuel price must yield $0 fuel cost, got $${iceZeroFuel.totalFuelUsd}`
);

// 4.3 $0 Annual Insurance
const zeroInsurance = calculateTcoProjection({
  purchasePriceUsd: 25000,
  annualInsuranceUsd: 0,
  horizonYears: 2,
});

assert(
  zeroInsurance.totalInsuranceUsd === 0,
  `$0 annual insurance must not fallback to default ($1400), got $${zeroInsurance.totalInsuranceUsd}`
);
assert(
  zeroInsurance.yearlySchedule[0].yearInsuranceUsd === 0,
  `Yearly insurance must be $0, got $${zeroInsurance.yearlySchedule[0].yearInsuranceUsd}`
);

// 4.4 0% APR Financing
const zeroApr = calculateTcoProjection({
  purchasePriceUsd: 36000,
  downPaymentPct: 10, // $3600 down, $32400 financed
  aprPct: 0,
  loanTermMonths: 36, // $32400 / 36 = $900/mo
  horizonYears: 3,
});

assert(
  zeroApr.totalInterestUsd === 0,
  `0% APR must produce exactly $0 financing interest, got $${zeroApr.totalInterestUsd}`
);
assert(
  zeroApr.monthlyLoanPaymentUsd === 900,
  `0% APR monthly loan payment must be exactly principal / months ($900), got $${zeroApr.monthlyLoanPaymentUsd}`
);
assert(
  zeroApr.yearlySchedule[0].yearInterestUsd === 0,
  `Year 1 interest must be $0, got $${zeroApr.yearlySchedule[0].yearInterestUsd}`
);

// 4.5 0% Down payment
const zeroDown = calculateTcoProjection({
  purchasePriceUsd: 30000,
  downPaymentPct: 0,
  aprPct: 5.0,
  loanTermMonths: 60,
  horizonYears: 1,
});

assert(
  zeroDown.yearlySchedule[0].remainingLoanBalanceUsd > 0,
  '0% down payment must finance 100% of purchase price'
);

// 4.6 0 Annual Mileage
const zeroDistance = calculateTcoProjection({
  purchasePriceUsd: 28000,
  annualDistanceMiles: 0,
  horizonYears: 3,
});

assert(zeroDistance.totalDistanceMiles === 0, 'Total distance must be 0');
assert(zeroDistance.costPerMileUsd === 0, 'Cost per mile must be 0');
assert(zeroDistance.totalFuelUsd === 0, 'Total fuel must be 0');
assert(zeroDistance.totalMaintenanceUsd === 0, 'Routine maintenance must be 0');

// =============================================================================
// TEST SUITE 5: UNREALISTIC MODEL YEARS STRESS TESTING
// =============================================================================
console.log('\n--- 5. Testing unrealistic model years (1850, 2500, negative years) ---');

const unrealisticYears = [1850, 1900, 2035, 2500, -5, -2022, 0];

for (const y of unrealisticYears) {
  // Test 5.1: hydrateVehiclePreset with unusual model years
  try {
    const hydrated = hydrateVehiclePreset({
      brand: 'Toyota',
      modelName: 'Corolla',
      year: y,
      powertrain: 'hybrid',
      basePrice: 24000,
    });
    assert(hydrated !== null && typeof hydrated === 'object', `hydrateVehiclePreset should succeed for year ${y}`);
    assertFiniteNumber(hydrated.purchasePriceUsd, `hydrated.purchasePriceUsd for year ${y}`);
  } catch (err) {
    assert(false, `hydrateVehiclePreset threw for year ${y}: ${err.message}`);
  }

  // Test 5.2: deriveTechnicalBadges with unusual model years
  try {
    const badgesPetrol = deriveTechnicalBadges({
      year: y,
      powertrain: 'petrol-turbo',
      transmission: 'automatic',
    });
    assert(Array.isArray(badgesPetrol), `deriveTechnicalBadges must return array for year ${y}`);
    assert(badgesPetrol.length >= 3, `Badges must generate at least 3 tiers for year ${y}`);

    const badgesDiesel = deriveTechnicalBadges({
      year: y,
      powertrain: 'diesel',
      transmission: 'manual',
    });
    assert(Array.isArray(badgesDiesel), `deriveTechnicalBadges must return array for diesel year ${y}`);
    assert(badgesDiesel.length >= 3, `Diesel badges must generate at least 3 tiers for year ${y}`);

    const badgesEv = deriveTechnicalBadges({
      year: y,
      powertrain: 'ev',
      isEv: true,
    });
    assert(Array.isArray(badgesEv), `deriveTechnicalBadges must return array for EV year ${y}`);
  } catch (err) {
    assert(false, `deriveTechnicalBadges threw for year ${y}: ${err.message}`);
  }

  // Test 5.3: calculateBatterySoh with extreme vehicle ages / years
  try {
    // Current year is 2026. Age could be:
    const age = Math.max(0, 2026 - y);
    const soh = calculateBatterySoh(100000, age, 'NMC');
    assertFiniteNumber(soh.sohPct, `calculateBatterySoh sohPct for year ${y} (age ${age})`);
    assert(soh.sohPct >= 65.0 && soh.sohPct <= 100.0, `SoH must be bounded [65%, 100%], got ${soh.sohPct}% for age ${age}`);
  } catch (err) {
    assert(false, `calculateBatterySoh threw for year ${y}: ${err.message}`);
  }

  // Test 5.4: calculateTcoProjection with vehicle object carrying unusual year
  try {
    const tcoYear = calculateTcoProjection({
      purchasePriceUsd: 32000,
      annualDistanceMiles: 12000,
      vehicle: {
        id: `test-${y}`,
        year: y,
        powertrainType: 'ICE_PETROL',
      },
      horizonYears: 5,
    });
    assertFiniteNumber(tcoYear.totalEconomicCostUsd, `tcoYear.totalEconomicCostUsd for year ${y}`);
    assert(tcoYear.totalEconomicCostUsd > 0, `Total cost must be positive for year ${y}`);
  } catch (err) {
    assert(false, `calculateTcoProjection threw for vehicle with year ${y}: ${err.message}`);
  }
}

// =============================================================================
// TEST SUITE 6: COMBINATORIAL PRESETS, STRING FUZZING & FINANCIAL AMORTIZATION
// =============================================================================
console.log('\n--- 6. Testing combinatorial vehicle presets & string-type fuzzing ---');

// 6.1 String-number inputs into calculateTcoProjection
const stringTco = calculateTcoProjection({
  purchasePriceUsd: '45000',
  odometerMiles: '35000',
  annualDistanceMiles: '15000',
  fuelPriceUsdGal: '0.00',
  annualInsuranceUsd: '0',
  downPaymentPct: '15',
  aprPct: '0.0',
  loanTermMonths: '48',
  horizonYears: '5',
  homeChargePct: '80',
  homeTariffUsdPerKwh: '0.00',
  dcFastTariffUsdPerKwh: '0.00',
  powertrainType: 'EV',
  isEv: true,
});

assertFiniteNumber(stringTco.totalEconomicCostUsd, 'stringTco.totalEconomicCostUsd');
assert(stringTco.totalFuelUsd === 0, `String "0.00" tariff must yield $0 fuel, got $${stringTco.totalFuelUsd}`);
assert(stringTco.totalInsuranceUsd === 0, `String "0" insurance must yield $0 insurance, got $${stringTco.totalInsuranceUsd}`);
assert(stringTco.totalInterestUsd === 0, `String "0.0" APR must yield $0 interest, got $${stringTco.totalInterestUsd}`);
assertFiniteNumber(stringTco.monthlyLoanPaymentUsd, 'stringTco.monthlyLoanPaymentUsd');
assert(stringTco.monthlyLoanPaymentUsd > 0, `Monthly payment must be positive with 15% down on $45k, got $${stringTco.monthlyLoanPaymentUsd}`);

// 6.2 Extreme APR stress testing (500% APR)
const extremeAprTco = calculateTcoProjection({
  purchasePriceUsd: 20000,
  downPaymentPct: 10,
  aprPct: 500,
  loanTermMonths: 24,
  horizonYears: 2,
});
assertFiniteNumber(extremeAprTco.totalInterestUsd, 'extremeAprTco.totalInterestUsd');
assertFiniteNumber(extremeAprTco.monthlyLoanPaymentUsd, 'extremeAprTco.monthlyLoanPaymentUsd');
assert(extremeAprTco.totalInterestUsd > 0, 'Extreme APR must yield positive interest');

// 6.3 Horizon year bounding
// Note: horizonYears: 0 falls back to default 5 via (Number(horizonYears) || 5) to prevent empty schedule array crash
const minHorizonTco = calculateTcoProjection({
  purchasePriceUsd: 25000,
  horizonYears: 0,
});
assert(
  minHorizonTco.yearlySchedule.length === 5,
  `horizonYears: 0 safely falls back to default 5 years without crashing, got ${minHorizonTco.yearlySchedule.length}`
);

const maxHorizonTco = calculateTcoProjection({
  purchasePriceUsd: 25000,
  horizonYears: 50,
});
assert(maxHorizonTco.yearlySchedule.length === 10, `horizonYears: 50 must clamp to 10 years, got ${maxHorizonTco.yearlySchedule.length}`);

// 6.4 Combinatorial sweep across all 12 presets at 0, 50k, 200k, and 500k km
for (const preset of VEHICLE_PRESETS) {
  for (const odoKm of [0, 50000, 200000, 500000]) {
    const odoMiles = Math.round(odoKm * 0.621371);
    const pTco = calculateTcoProjection({
      purchasePriceUsd: preset.purchasePriceUsd,
      odometerMiles: odoMiles,
      annualDistanceMiles: preset.annualDistanceMiles || 12000,
      mpgUs: preset.mpgUs,
      isEv: preset.isEv,
      powertrainType: preset.powertrainType || preset.powertrain,
      vehicle: preset,
      horizonYears: 5,
    });

    assertFiniteNumber(pTco.totalEconomicCostUsd, `${preset.id} at ${odoKm}km total cost`);
    assert(pTco.totalEconomicCostUsd > 0, `${preset.id} at ${odoKm}km total cost must be > 0`);
    assertFiniteNumber(pTco.costPerMileUsd, `${preset.id} at ${odoKm}km costPerMileUsd`);
    assert(pTco.costPerMileUsd > 0, `${preset.id} at ${odoKm}km costPerMileUsd must be > 0`);

    // Verify residual floor
    const floor = Math.round(preset.purchasePriceUsd * 0.05);
    assert(
      pTco.finalResidualValueUsd >= floor,
      `${preset.id} at ${odoKm}km final residual $${pTco.finalResidualValueUsd} must be >= floor $${floor}`
    );

    // Verify all breakdown rows have finite values
    for (const b of pTco.breakdown) {
      assertFiniteNumber(b.amountUsd, `${preset.id} breakdown[${b.id}].amountUsd`);
      assertFiniteNumber(b.sharePct, `${preset.id} breakdown[${b.id}].sharePct`);
    }

    // Verify all yearly schedule rows have finite values
    for (const row of pTco.yearlySchedule) {
      assertFiniteNumber(row.residualValueUsd, `${preset.id} Y${row.year} residualValueUsd`);
      assertFiniteNumber(row.cumulativeTotalCostUsd, `${preset.id} Y${row.year} cumulativeTotalCostUsd`);
      assertFiniteNumber(row.yearMaintenanceUsd, `${preset.id} Y${row.year} yearMaintenanceUsd`);
      assert(row.residualValueUsd >= floor, `${preset.id} Y${row.year} residual must be >= floor`);
    }
  }
}

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log('\n================================================================');
console.log(`TOTAL ASSERTIONS: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log('================================================================');

if (failed > 0) {
  console.error('\nFAILURES ENCOUNTERED:');
  for (const f of failures) {
    console.error(`- ${f}`);
  }
  process.exit(1);
} else {
  console.log('\nVERDICT: ALL ADVERSARIAL STRESS TESTS PASSED EMPIRICALLY (0 ERRORS)');
  process.exit(0);
}


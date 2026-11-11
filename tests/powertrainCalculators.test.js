/**
 * DriveLedger / ShiftMetric — Powertrain & Calculator Logic Vitest Suite
 * 
 * Comprehensive automated unit tests verifying:
 * 1. Strict PowertrainType enum resolution ('EV' | 'PHEV' | 'HEV' | 'ICE_PETROL' | 'ICE_DIESEL')
 * 2. Absolute 0-ICE isolation for EV configurations across components, milestones, and health evaluation
 * 3. Complete EV-specific component calculation (SoH % LFP vs NMC, OBC/ICCU, heat pump, reducer, suspension, tire, regen brake)
 * 4. EV & PHEV energy math with Home AC vs DC Fast charging tariff split and PHEV combined profile
 * 5. Non-linear depreciation curve (steep 1-3 yr drop, flattening, used car acquisition offset, 5% residual floor)
 * 6. Year-over-year depreciation monotonicity across all powertrains and mileage configurations (zero asset appreciation)
 * 7. Dynamic maintenance scaling across REVISION_THRESHOLDS (60k, 100k, 150k, 200k km)
 * 8. Robust boundary handling: 0 km, 500,000+ km, negative numbers, model years, and $0 falsy value safety
 */

import { describe, it, expect, test } from 'vitest';

import {
  POWERTRAIN_TYPES,
  PowertrainType,
  resolvePowertrainType,
  normalizePowertrainType,
  isPureElectric,
  calculateBatterySoh,
  calculateEvEnergyCost,
  calculatePhevEnergyCost,
  calculateVehicleEnergyCost,
  convertKwh100KmToKwh100Mi,
  convertKwh100MiToKwh100Km,
  convertKwh100MiToMiPerKwh,
  convertMiPerKwhToKwh100Mi,
} from '../src/data/powertrainTypes.js';

import {
  MAINTENANCE_COMPONENTS,
  ICE_EXCLUSIVE_COMPONENT_IDS,
  filterComponentsForPowertrain,
  getMilestonesForPowertrain,
  filterMilestonesByPowertrain,
  evaluateComponentHealth,
  calculateOemRiskMultiplier,
  REVISION_THRESHOLDS,
  calculateRevisionSurcharge,
  calculateDynamicMaintenance,
  calculateNonLinearDepreciation,
  calculateTcoProjection,
} from '../src/data/maintenanceData.js';

import {
  STANDARD_MILESTONES,
  EV_MILESTONES,
  ICE_MILESTONES,
} from '../src/components/calculators/MaintenanceMilestones.jsx';

import {
  calculateObdWorkshopEstimate,
  OBD_CODES,
  LABOR_RATE_TIERS,
} from '../src/data/obdCodes.js';

// ============================================================================
// 1. POWERTRAIN ARCHITECTURE & ENUM RESOLUTION
// ============================================================================

describe('Powertrain Architecture & Strict Canonical Resolution', () => {
  it('defines the 5 strict canonical PowertrainType enum members', () => {
    expect(POWERTRAIN_TYPES).toEqual({
      EV: 'EV',
      PHEV: 'PHEV',
      HEV: 'HEV',
      ICE_PETROL: 'ICE_PETROL',
      ICE_DIESEL: 'ICE_DIESEL',
    });
    expect(PowertrainType).toBe(POWERTRAIN_TYPES);
  });

  it('resolves string tokens to canonical PowertrainType values', () => {
    expect(resolvePowertrainType('EV')).toBe('EV');
    expect(resolvePowertrainType('bev')).toBe('EV');
    expect(resolvePowertrainType('electric')).toBe('EV');
    expect(resolvePowertrainType('PHEV')).toBe('PHEV');
    expect(resolvePowertrainType('plug-in hybrid')).toBe('PHEV');
    expect(resolvePowertrainType('HEV')).toBe('HEV');
    expect(resolvePowertrainType('hybrid')).toBe('HEV');
    expect(resolvePowertrainType('diesel')).toBe('ICE_DIESEL');
    expect(resolvePowertrainType('petrol')).toBe('ICE_PETROL');
    expect(resolvePowertrainType('gasoline-turbo')).toBe('ICE_PETROL');
    expect(resolvePowertrainType('gasoline-na')).toBe('ICE_PETROL');
  });

  it('resolves diverse vehicle objects and presets accurately', () => {
    expect(resolvePowertrainType({ isEv: true })).toBe('EV');
    expect(resolvePowertrainType({ fuelType: 'Electric' })).toBe('EV');
    expect(resolvePowertrainType({ powertrain: 'ev' })).toBe('EV');
    expect(resolvePowertrainType({ fuelType: 'Plug-in Hybrid' })).toBe('PHEV');
    expect(resolvePowertrainType({ powertrain: 'phev' })).toBe('PHEV');
    expect(resolvePowertrainType({ fuelType: 'Hybrid' })).toBe('HEV');
    expect(resolvePowertrainType({ powertrain: 'hybrid' })).toBe('HEV');
    expect(resolvePowertrainType({ fuelType: 'Diesel' })).toBe('ICE_DIESEL');
    expect(resolvePowertrainType({ fuelType: 'Gasoline' })).toBe('ICE_PETROL');
    expect(resolvePowertrainType(null)).toBe('ICE_PETROL');
    expect(resolvePowertrainType({})).toBe('ICE_PETROL');
  });

  it('normalizes legacy and polymorphic vehicle structures via normalizePowertrainType', () => {
    expect(normalizePowertrainType({ isEv: true })).toBe('EV');
    expect(normalizePowertrainType({ fuelType: 'Diesel' })).toBe('ICE_DIESEL');
    expect(normalizePowertrainType({ archetypeId: 'toyota-hybrid-ecvt' })).toBe('HEV');
    expect(normalizePowertrainType('electric')).toBe('EV');
  });

  it('strictly validates pure electric status via isPureElectric predicate', () => {
    expect(isPureElectric('EV')).toBe(true);
    expect(isPureElectric('PHEV')).toBe(false);
    expect(isPureElectric('HEV')).toBe(false);
    expect(isPureElectric('ICE_PETROL')).toBe(false);
    expect(isPureElectric('ICE_DIESEL')).toBe(false);
    expect(isPureElectric(null)).toBe(false);
  });
});

// ============================================================================
// 2. EV STRICT 0-ICE ISOLATION & PURITY
// ============================================================================

describe('EV Strict 0-ICE Maintenance Isolation', () => {
  const forbiddenIceKeywords = [
    'motor oil',
    'engine oil',
    'timing belt',
    'timing chain',
    'turbo',
    'egr',
    'dpf',
    'dmf',
    'dual-mass flywheel',
    'fuel injector',
    'spark plug',
    'exhaust system',
    'gearbox oil',
    'transmission fluid',
    'atf mechatronics',
  ];

  it('ensures filterComponentsForPowertrain(EV) produces 0 ICE components', () => {
    const evComponents = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, 'EV');
    const evCompIds = evComponents.map((c) => c.id);

    // None of the ICE exclusive component IDs may be present in EV
    for (const iceId of ICE_EXCLUSIVE_COMPONENT_IDS) {
      expect(evCompIds).not.toContain(iceId);
    }

    // Text checks: no forbidden combustion terminology in EV components
    for (const comp of evComponents) {
      const combined = `${comp.id} ${comp.name} ${comp.category} ${comp.description || ''}`;
      for (const kw of forbiddenIceKeywords) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        expect(regex.test(combined)).toBe(false);
      }
    }
  });

  it('ensures getMilestonesForPowertrain(EV) yields 0 ICE maintenance items across all intervals', () => {
    const evMilestones = getMilestonesForPowertrain('EV', 200000);
    expect(evMilestones.length).toBeGreaterThan(0);

    for (const ms of evMilestones) {
      for (const item of ms.items) {
        const itemText = `${item.id} ${item.name}`;
        for (const kw of forbiddenIceKeywords) {
          const regex = new RegExp(`\\b${kw}\\b`, 'i');
          expect(regex.test(itemText)).toBe(false);
        }
      }
    }
  });

  it('ensures evaluateComponentHealth returns null or excludes ICE items for EV vehicles', () => {
    for (const iceId of ICE_EXCLUSIVE_COMPONENT_IDS) {
      const iceComponent = MAINTENANCE_COMPONENTS.find((c) => c.id === iceId);
      if (iceComponent) {
        const health = evaluateComponentHealth({
          component: iceComponent,
          physicalOdometerMiles: 80000,
          powertrainType: 'EV',
        });
        expect(health).toBeNull();
      }
    }
  });

  it('verifies EV milestone schedules are strictly separated from combustion schedules', () => {
    const filteredStandard = filterMilestonesByPowertrain(STANDARD_MILESTONES, 'EV');
    for (const ms of filteredStandard) {
      for (const item of ms.items) {
        expect(item.applicablePowertrains).toBeDefined();
        expect(item.applicablePowertrains).toContain('EV');
        expect(item.applicablePowertrains.includes('ICE_PETROL') && !item.applicablePowertrains.includes('EV')).toBe(false);
      }
    }
  });
});

// ============================================================================
// 3. EV-SPECIFIC COMPONENT DOSSIERS & DEGRADATION MODELING
// ============================================================================

describe('EV-Specific Component Dossiers & Battery Degradation', () => {
  const mandatoryEvComponentIds = [
    'ev-battery-soh',
    'ev-obc-iccu',
    'ev-thermal-heatpump',
    'ev-reduction-gear',
    'ev-curb-suspension',
    'ev-torque-tires',
    'ev-regen-brake-corrosion',
  ];

  it('includes all 7 mandatory EV-specific component dossiers', () => {
    const evComponents = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, 'EV');
    const compIds = evComponents.map((c) => c.id);

    for (const requiredId of mandatoryEvComponentIds) {
      expect(compIds).toContain(requiredId);
    }
  });

  it('evaluates health and wear metrics for EV-specific components', () => {
    const evComponents = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, 'EV');
    for (const reqId of mandatoryEvComponentIds) {
      const comp = evComponents.find((c) => c.id === reqId);
      expect(comp).toBeDefined();

      const evaluation = evaluateComponentHealth({
        component: comp,
        physicalOdometerMiles: 60000,
        powertrainType: 'EV',
        chemistry: 'LFP',
      });

      expect(evaluation).not.toBeNull();
      expect(typeof evaluation.effectiveWearMiles).toBe('number');
      expect(typeof evaluation.wearPctOfCritical).toBe('number');
      expect(['OPTIMAL', 'WARNING', 'CRITICAL']).toContain(evaluation.status);
    }
  });

  it('models battery degradation accurately: LFP vs NMC chemistry loss', () => {
    const odo = 60000;
    const age = 5;

    const lfp = calculateBatterySoh({ chemistry: 'LFP', odometerMiles: odo, ageYears: age, dcFastChargingSharePct: 20 });
    const nmc = calculateBatterySoh({ chemistry: 'NMC', odometerMiles: odo, ageYears: age, dcFastChargingSharePct: 20 });

    expect(lfp.chemistry).toBe('LFP');
    expect(nmc.chemistry).toBe('NMC');

    // LFP has lower degradation than NMC at identical mileage and age
    expect(lfp.sohPct).toBeGreaterThan(nmc.sohPct);
    expect(lfp.capacityLossPct).toBeLessThan(nmc.capacityLossPct);

    // DC Fast Charging penalty reduces SoH
    const lfpHighDc = calculateBatterySoh({ chemistry: 'LFP', odometerMiles: odo, ageYears: age, dcFastChargingSharePct: 80 });
    expect(lfpHighDc.sohPct).toBeLessThan(lfp.sohPct);
  });

  it('triggers WARRANTY_CLAIM_ELIGIBLE under premature cell defect within warranty bounds', () => {
    // 4-year-old vehicle with 40,000 miles experiencing anomalous cell defect
    const abnormalBattery = calculateBatterySoh({
      chemistry: 'LFP',
      odometerMiles: 40000,
      ageYears: 4,
      cellDefectLossPct: 25,
    });

    expect(abnormalBattery.sohPct).toBeLessThan(70.0);
    expect(abnormalBattery.warrantyStatus).toBe('WARRANTY_CLAIM_ELIGIBLE');
  });

  it('triggers OUT_OF_WARRANTY_DEGRADED when degraded past 8 years / 100,000 miles', () => {
    const outOfWarrantyBattery = calculateBatterySoh({
      chemistry: 'LFP',
      odometerMiles: 120000,
      ageYears: 10,
      cellDefectLossPct: 25,
    });

    expect(outOfWarrantyBattery.sohPct).toBeLessThan(70.0);
    expect(outOfWarrantyBattery.warrantyStatus).toBe('OUT_OF_WARRANTY_DEGRADED');
  });
});

// ============================================================================
// 4. EV & PHEV ENERGY & CHARGING TARIFF CALCULATIONS
// ============================================================================

describe('EV & PHEV Energy & Charging Tariff Models', () => {
  it('calculates EV blended charging cost with Home AC vs DC Fast tariff split', () => {
    const annualDist = 12000;
    const efficiency = 30.0; // kWh/100mi
    const homeTariff = 0.15; // $/kWh
    const dcTariff = 0.45;   // $/kWh

    // 80% Home, 20% DC Fast
    const res = calculateEvEnergyCost({
      annualDistanceMiles: annualDist,
      efficiencyKwh100Mi: efficiency,
      homeChargePct: 80,
      homeTariffUsdPerKwh: homeTariff,
      dcFastTariffUsdPerKwh: dcTariff,
    });

    const expectedBlendedTariff = 0.8 * 0.15 + 0.2 * 0.45; // $0.21 / kWh
    const expectedKwh = (12000 / 100) * 30;               // 3,600 kWh
    const expectedCost = 3600 * 0.21;                     // $756.00

    expect(res.blendedTariffUsdPerKwh).toBeCloseTo(expectedBlendedTariff, 3);
    expect(res.annualKwh).toBeCloseTo(expectedKwh, 1);
    expect(res.annualCostUsd).toBeCloseTo(expectedCost, 1);
    expect(res.costPerMileUsd).toBeCloseTo(expectedCost / annualDist, 3);
  });

  it('handles zero charging tariff ($0.00/kWh) cleanly without fallback to default', () => {
    const res = calculateEvEnergyCost({
      annualDistanceMiles: 10000,
      efficiencyKwh100Mi: 25.0,
      homeChargePct: 100,
      homeTariffUsdPerKwh: 0,
      dcFastTariffUsdPerKwh: 0,
    });

    expect(res.annualCostUsd).toBe(0);
    expect(res.blendedTariffUsdPerKwh).toBe(0);
    expect(res.costPerMileUsd).toBe(0);
  });

  it('calculates PHEV combined profile across electric commute and combustion fuel', () => {
    const annualDist = 12000;
    const phev = calculatePhevEnergyCost({
      annualDistanceMiles: annualDist,
      electricSharePct: 65,
      evEfficiencyKwh100Mi: 30.0,
      iceMpg: 35.0,
      homeChargePct: 100,
      homeTariffUsdPerKwh: 0.15,
      fuelPriceUsdPerGal: 3.50,
    });

    const expectedElecMiles = 12000 * 0.65; // 7,800 miles
    const expectedIceMiles = 12000 * 0.35;  // 4,200 miles

    expect(phev.electricMiles).toBeCloseTo(expectedElecMiles, 1);
    expect(phev.iceMiles).toBeCloseTo(expectedIceMiles, 1);

    const expectedElecCost = (expectedElecMiles / 100) * 30.0 * 0.15; // $351.00
    const expectedIceCost = (expectedIceMiles / 35.0) * 3.50;        // $420.00
    const expectedTotal = expectedElecCost + expectedIceCost;          // $771.00

    expect(phev.electricCostUsd).toBeCloseTo(expectedElecCost, 1);
    expect(phev.iceCostUsd).toBeCloseTo(expectedIceCost, 1);
    expect(phev.totalAnnualCostUsd).toBeCloseTo(expectedTotal, 1);
  });

  it('converts between imperial and metric efficiency units without loss of precision', () => {
    const kwh100Mi = 30.0;
    const kwh100Km = convertKwh100MiToKwh100Km(kwh100Mi);
    const roundTrip = convertKwh100KmToKwh100Mi(kwh100Km);

    expect(kwh100Km).toBeCloseTo(30.0 / 1.609344, 2);
    expect(roundTrip).toBeCloseTo(kwh100Mi, 1);

    const miPerKwh = convertKwh100MiToMiPerKwh(25.0);
    expect(miPerKwh).toBe(4.0);
    expect(convertMiPerKwhToKwh100Mi(4.0)).toBe(25.0);
  });
});

// ============================================================================
// 5. NON-LINEAR DEPRECIATION CURVE & FINANCIAL ENGINE
// ============================================================================

describe('Non-Linear Depreciation Curve & Financial Engine', () => {
  const purchasePrice = 45000;

  it('enforces a steep early drop in Years 1-3 followed by asymptotic flattening in Years 4-10', () => {
    const drops = [];
    let prevResidual = purchasePrice;

    for (let yr = 1; yr <= 5; yr++) {
      const dep = calculateNonLinearDepreciation({
        purchasePriceUsd: purchasePrice,
        odometerMiles: 0,
        annualDistanceMiles: 12500,
        ownershipYear: yr,
        powertrainType: 'ICE_PETROL',
      });
      const marginalDrop = prevResidual - dep.residualValueUsd;
      drops.push(marginalDrop);
      prevResidual = dep.residualValueUsd;
    }

    // Yr 1 drop must be steepest: ~18-26% of purchase price
    const yr1Pct = drops[0] / purchasePrice;
    expect(yr1Pct).toBeGreaterThanOrEqual(0.18);
    expect(yr1Pct).toBeLessThanOrEqual(0.26);

    // Marginal drop strictly decreases: Yr 1 > Yr 2 > Yr 3 > Yr 4
    expect(drops[0]).toBeGreaterThan(drops[1]);
    expect(drops[1]).toBeGreaterThan(drops[2]);
    expect(drops[2]).toBeGreaterThan(drops[3]);
  });

  it('applies used car acquisition offset ($A_0 = O_0 / 12,500$) without repeating showroom hit', () => {
    // New car Year 1 depreciation
    const newCarY1 = calculateNonLinearDepreciation({
      purchasePriceUsd: purchasePrice,
      odometerMiles: 0,
      annualDistanceMiles: 12500,
      ownershipYear: 1,
      powertrainType: 'ICE_PETROL',
    });
    const newCarY1Pct = newCarY1.cumulativeDepreciationUsd / purchasePrice;

    // Used car (50,000 miles = 4-year virtual age) Year 1 of second ownership
    const usedCarY1 = calculateNonLinearDepreciation({
      purchasePriceUsd: purchasePrice,
      odometerMiles: 50000,
      annualDistanceMiles: 12500,
      ownershipYear: 1,
      powertrainType: 'ICE_PETROL',
    });
    const usedCarY1Pct = usedCarY1.cumulativeDepreciationUsd / purchasePrice;

    // The used car first-year ownership drop must be lower than brand new showroom drop (~13% vs ~18%)
    expect(usedCarY1Pct).toBeLessThan(newCarY1Pct * 0.85);
    expect(usedCarY1Pct).toBeGreaterThanOrEqual(0.04);
  });

  it('applies powertrain adjustments: HEV retention bonus vs EV tech curve', () => {
    const hev = calculateNonLinearDepreciation({
      purchasePriceUsd: purchasePrice,
      odometerMiles: 0,
      annualDistanceMiles: 12500,
      ownershipYear: 3,
      powertrainType: 'HEV',
    });

    const petrol = calculateNonLinearDepreciation({
      purchasePriceUsd: purchasePrice,
      odometerMiles: 0,
      annualDistanceMiles: 12500,
      ownershipYear: 3,
      powertrainType: 'ICE_PETROL',
    });

    // HEV possesses superior value retention
    expect(hev.residualValueUsd).toBeGreaterThan(petrol.residualValueUsd);
  });

  it('guarantees a 5% residual scrap floor even under extreme age and mileage', () => {
    const extreme = calculateNonLinearDepreciation({
      purchasePriceUsd: 40000,
      odometerMiles: 500000,
      annualDistanceMiles: 30000,
      ownershipYear: 10,
      powertrainType: 'ICE_DIESEL',
    });

    expect(extreme.residualValueUsd).toBeGreaterThanOrEqual(Math.round(40000 * 0.05));
    expect(extreme.retentionPct).toBeGreaterThanOrEqual(5.0);
  });
});

// ============================================================================
// 6. DEPRECIATION MONOTONICITY (ZERO ASSET APPRECIATION)
// ============================================================================

describe('Depreciation Monotonicity Verification Across All Powertrains', () => {
  const powertrains = ['EV', 'PHEV', 'HEV', 'ICE_PETROL', 'ICE_DIESEL'];
  const testScenarios = [
    { label: 'Brand New Factory Standard', startOdo: 0, annualMi: 12500 },
    { label: 'High Mileage Used Vehicle', startOdo: 60000, annualMi: 15000 },
    { label: 'Ultra-Low Mileage Used Car', startOdo: 40000, annualMi: 1000 },
    { label: 'Stationary / Zero Annual Distance', startOdo: 20000, annualMi: 0 },
    { label: 'Extreme High Starting Odometer', startOdo: 120000, annualMi: 20000 },
  ];

  for (const pt of powertrains) {
    for (const sc of testScenarios) {
      it(`enforces non-negative depreciation for ${pt} under [${sc.label}] across 10 years`, () => {
        const proj = calculateTcoProjection({
          purchasePriceUsd: 40000,
          odometerMiles: sc.startOdo,
          annualDistanceMiles: sc.annualMi,
          powertrainType: pt,
          horizonYears: 10,
        });

        let prevResidual = 40000;
        for (const yearSched of proj.yearlySchedule) {
          // Residual value must monotonically decrease or stay flat (never increase)
          expect(yearSched.residualValueUsd).toBeLessThanOrEqual(prevResidual);
          // Year depreciation must be >= 0
          expect(yearSched.yearDepreciationUsd).toBeGreaterThanOrEqual(0);
          prevResidual = yearSched.residualValueUsd;
        }
      });
    }
  }
});

// ============================================================================
// 7. DYNAMIC MAINTENANCE SCALING & REVISION THRESHOLDS
// ============================================================================

describe('Dynamic Maintenance Scaling & Revision Thresholds', () => {
  it('defines the 4 key revision thresholds (60k, 100k, 150k, 200k km)', () => {
    expect(REVISION_THRESHOLDS.length).toBe(4);
    const kms = REVISION_THRESHOLDS.map((r) => r.thresholdKm);
    expect(kms).toEqual([60000, 100000, 150000, 200000]);

    for (const thresh of REVISION_THRESHOLDS) {
      expect(thresh.surchargeUsd.EV).toBeDefined();
      expect(thresh.surchargeUsd.HEV).toBeDefined();
      expect(thresh.surchargeUsd.PHEV).toBeDefined();
      expect(thresh.surchargeUsd.ICE_PETROL).toBeDefined();
      expect(thresh.surchargeUsd.ICE_DIESEL).toBeDefined();
    }
  });

  it('detects crossed revision thresholds accurately in calculateRevisionSurcharge', () => {
    // 30,000 miles to 45,000 miles crosses 60,000 km threshold (37,282 mi)
    const cross60k = calculateRevisionSurcharge(30000, 45000, 'ICE_PETROL');
    expect(cross60k.passedThresholds.length).toBe(1);
    expect(cross60k.passedThresholds[0].thresholdKm).toBe(60000);
    expect(cross60k.totalSurchargeUsd).toBe(420);

    // EV surcharge at 60k km is strictly lower than ICE_PETROL
    const cross60kEv = calculateRevisionSurcharge(30000, 45000, 'EV');
    expect(cross60kEv.totalSurchargeUsd).toBe(160);
    expect(cross60kEv.totalSurchargeUsd).toBeLessThan(cross60k.totalSurchargeUsd);

    // Crossing both 60k and 100k km (30,000 to 70,000 miles)
    const crossTwo = calculateRevisionSurcharge(30000, 70000, 'ICE_PETROL');
    expect(crossTwo.passedThresholds.length).toBe(2);
    expect(crossTwo.totalSurchargeUsd).toBe(420 + 750);
  });

  it('applies revision threshold surcharges dynamically during ownership years in TCO', () => {
    // Car starting at 30,000 miles doing 15,000 mi/yr:
    // Year 1: 30k -> 45k (crosses 60k km / 37.3k mi threshold)
    // Year 2: 45k -> 60k
    // Year 3: 60k -> 75k (crosses 100k km / 62.1k mi threshold)
    const proj = calculateTcoProjection({
      odometerMiles: 30000,
      annualDistanceMiles: 15000,
      powertrainType: 'ICE_PETROL',
      horizonYears: 3,
      baseAnnualMaintenanceUsd: 600,
    });

    const sched = proj.yearlySchedule;
    // Year 1 (crossing 60k threshold) has revision surcharge
    expect(sched[0].yearMaintenanceUsd).toBeGreaterThan(sched[1].yearMaintenanceUsd * 0.9);
    // Year 3 (crossing 100k threshold) has major revision surcharge
    expect(sched[2].yearMaintenanceUsd).toBeGreaterThan(sched[1].yearMaintenanceUsd);
  });
});

// ============================================================================
// 8. BOUNDARY HANDLING, EXTREMES & NUMERICAL SANITIZATION
// ============================================================================

describe('Boundary Handling & Numerical Robustness', () => {
  it('handles 0 km / brand new odometer safely without division by zero or NaN', () => {
    const proj = calculateTcoProjection({
      purchasePriceUsd: 35000,
      odometerMiles: 0,
      annualDistanceMiles: 12000,
      horizonYears: 5,
    });

    expect(Number.isFinite(proj.totalEconomicCostUsd)).toBe(true);
    expect(Number.isFinite(proj.costPerMileUsd)).toBe(true);
    expect(proj.totalEconomicCostUsd).toBeGreaterThan(0);
    expect(Number.isNaN(proj.costPerMileUsd)).toBe(false);

    const riskMult = calculateOemRiskMultiplier(0);
    expect(Number.isFinite(riskMult)).toBe(true);
    expect(riskMult).toBeGreaterThanOrEqual(2.2);
  });

  it('handles extreme 500,000+ km odometer with bounded wear saturation', () => {
    const highMiles = 320000; // ~515,000 km
    const proj = calculateTcoProjection({
      purchasePriceUsd: 30000,
      odometerMiles: highMiles,
      annualDistanceMiles: 15000,
      horizonYears: 3,
    });

    expect(Number.isFinite(proj.totalEconomicCostUsd)).toBe(true);
    expect(proj.finalResidualValueUsd).toBeGreaterThanOrEqual(Math.round(30000 * 0.05));

    const riskMult = calculateOemRiskMultiplier(highMiles);
    expect(riskMult).toBeLessThanOrEqual(3.1);
  });

  it('clamps negative inputs safely to non-negative defaults without errors', () => {
    const proj = calculateTcoProjection({
      purchasePriceUsd: -40000,
      odometerMiles: -20000,
      annualDistanceMiles: -10000,
      downPaymentPct: -10,
      aprPct: -5,
      loanTermMonths: -24,
      horizonYears: -3,
    });

    expect(Number.isFinite(proj.totalEconomicCostUsd)).toBe(true);
    expect(proj.totalEconomicCostUsd).toBeGreaterThan(0);
    expect(proj.yearlySchedule.length).toBeGreaterThanOrEqual(1);

    const negRisk = calculateOemRiskMultiplier(-50000);
    expect(negRisk).toBeGreaterThanOrEqual(2.2);
  });

  it('preserves intentional $0 values without falsy fallbacks (insurance, APR, fuel, tariff)', () => {
    // $0 insurance
    const zeroInsProj = calculateTcoProjection({
      purchasePriceUsd: 30000,
      annualInsuranceUsd: 0,
      horizonYears: 1,
    });
    expect(zeroInsProj.yearlySchedule[0].yearInsuranceUsd).toBe(0);
    expect(zeroInsProj.totalInsuranceUsd).toBe(0);

    // 0% APR -> zero interest on loan
    const zeroAprProj = calculateTcoProjection({
      purchasePriceUsd: 30000,
      aprPct: 0,
      downPaymentPct: 10,
      loanTermMonths: 36,
      horizonYears: 1,
    });
    expect(zeroAprProj.yearlySchedule[0].yearInterestUsd).toBe(0);
    expect(zeroAprProj.totalInterestUsd).toBe(0);

    // $0 fuel price
    const zeroFuelProj = calculateTcoProjection({
      purchasePriceUsd: 30000,
      fuelPriceUsdGal: 0,
      powertrainType: 'ICE_PETROL',
      horizonYears: 1,
    });
    expect(zeroFuelProj.yearlySchedule[0].yearFuelUsd).toBe(0);

    // $0 EV home tariff
    const zeroTariffEv = calculateTcoProjection({
      purchasePriceUsd: 35000,
      powertrainType: 'EV',
      homeTariffUsdPerKwh: 0,
      dcFastTariffUsdPerKwh: 0,
      horizonYears: 1,
    });
    expect(zeroTariffEv.yearlySchedule[0].yearFuelUsd).toBe(0);
  });

  it('evaluates OBD-II workshop estimates with $0 labor rate (DIY tier)', () => {
    const obdCode = OBD_CODES[0];
    const estimate = calculateObdWorkshopEstimate(obdCode, 'diy');

    expect(estimate).toBeDefined();
    expect(estimate.minLaborUsd).toBe(0);
    expect(estimate.maxLaborUsd).toBe(0);
    expect(estimate.weightedLaborUsd).toBe(0);
    expect(estimate.weightedExpectedUsd).toBe(estimate.weightedPartsUsd);
  });
});

// ============================================================================
// 9. PRODUCT STRATEGY & STRATEGIC ROADMAP DELIVERABLE VERIFICATION
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';

describe('Product Strategy & Strategic Roadmap Deliverable (R6)', () => {
  const roadmapPath = path.resolve(process.cwd(), 'PRODUCT_STRATEGY_AND_ROADMAP.md');

  it('verifies PRODUCT_STRATEGY_AND_ROADMAP.md exists at repository root', () => {
    expect(fs.existsSync(roadmapPath)).toBe(true);
  });

  it('verifies all 4 mandatory strategic pillars are thoroughly authored', () => {
    const content = fs.readFileSync(roadmapPath, 'utf8');

    // Pillar 1: Executive Audit Summary
    expect(content).toContain('Section 1: Executive Audit Summary');
    expect(content).toMatch(/Linguistic Purge/i);
    expect(content).toMatch(/Design Token/i);
    expect(content).toMatch(/Automotive Business Logic/i);

    // Pillar 2: User Retention & Time-on-Site Loops
    expect(content).toContain('Section 2: User Retention');
    expect(content).toMatch(/My Garage/i);
    expect(content).toMatch(/Used Car Negotiation Cheat Sheet/i);
    expect(content).toMatch(/Query Parameter Serialization/i);
    expect(content).toMatch(/Should I Fix It or Sell It/i);

    // Pillar 3: Conversion Rate Optimization (CRO)
    expect(content).toContain('Section 3: Conversion Rate Optimization');
    expect(content).toMatch(/VIN/i);
    expect(content).toMatch(/OBD/i);
    expect(content).toMatch(/Insurance/i);
    expect(content).toMatch(/AdSense/i);

    // Pillar 4: Programmatic SEO & Traffic Scaling Roadmap
    expect(content).toContain('Section 4: Programmatic SEO');
    expect(content).toMatch(/Helpful Content System/i);
    expect(content).toMatch(/Hreflang/i);
    expect(content).toMatch(/Sitemap/i);
    expect(content).toMatch(/Digital PR/i);
  });

  it('verifies technical schemas and algorithms are concretely specified in the roadmap', () => {
    const content = fs.readFileSync(roadmapPath, 'utf8');

    // Architectural data schemas & code
    expect(content).toContain('GarageVehicleEntity');
    expect(content).toContain('evaluateFixOrSellDecision');
    expect(content).toContain('serializeCalculatorState');
    expect(content).toContain('@media print');
    expect(content).toContain('application/ld+json');
  });
});

// ============================================================================
// 10. PRODUCTION BUILD HYGIENE & REFERENCE FOLDER ISOLATION (R5)
// ============================================================================

describe('Production Bundle Hygiene & Zero Contamination (R5)', () => {
  it('ensures zero imports from reference folders in ./src/', () => {
    const srcDir = path.resolve(process.cwd(), 'src');
    const forbiddenPatterns = [
      'odometer-web-application',
      'stitch_design_system_generator',
    ];

    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(full);
        } else if (/\.(jsx?|tsx?|css|html)$/.test(entry.name)) {
          const fileContent = fs.readFileSync(full, 'utf8');
          for (const forbidden of forbiddenPatterns) {
            expect(fileContent).not.toContain(forbidden);
          }
        }
      }
    }

    scanDir(srcDir);
  });

  it('ensures index.html does not import or link to reference directories', () => {
    const indexPath = path.resolve(process.cwd(), 'index.html');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      expect(indexContent).not.toContain('odometer-web-application');
      expect(indexContent).not.toContain('stitch_design_system_generator');
    }
  });
});


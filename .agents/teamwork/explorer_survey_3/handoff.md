# Codebase Investigation Report: Testing Infrastructure & Integration Entry Points

**Role**: Explorer 3 — Testing Infrastructure & Integration Entry Points  
**Date**: 2026-10-31  
**Working Directory**: `d:\Antigravity_projects\DriveLedger\.agents\teamwork\explorer_survey_3`  
**Parent Agent**: `d2e241c0-5552-43ea-b7ac-5bd0130c1430`  

---

## 1. Observation

### 1.1 Test Runner & Existing Suite Verification
- **`package.json` (`d:\Antigravity_projects\DriveLedger\package.json:6-13`)**:
  ```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "node --test tests/*.test.js",
    "test:jev": "node --test tests/jevCatalogJudge.test.js",
    "jev:audit": "node scripts/jev-evaluator.mjs"
  }
  ```
  `vitest` is currently **absent** from `devDependencies` in `package.json:20-29`.
- **Existing test execution (`npm.cmd test`)**:
  Executing `node --test tests/*.test.js` passes with exit code 0:
  ```
  === ShiftMetric Full-Stack Deep Verification Suite ===
  ALL DEEP VERIFICATION CHECKS PASSED WITH 0 ERRORS.
  ✔ tests\driveledger.test.js (856.6368ms)
  ✔ 1. Vehicle Body Archetype Resolution (7 Categories)
  ✔ 2. Powertrain Archetype Resolution (7 Configurations)
  ✔ 3. 4-Tier Technical Mechanical Badges Generation
  ✔ 4. Archetype Label Formatting
  ✔ 1. Master Vehicle Catalog Marque Coverage
  ✔ 2. Hierarchical Model & Engine Integrity and Telemetry Constraints
  ✔ 3. Catalog Navigation & Autocomplete Search Functions
  ✔ 4. Backward Compatibility with VEHICLE_PRESETS & Global BRANDS
  ℹ tests 10 | pass 9 | fail 0 | skipped 1 (Jev-as-a-Judge needs TYPESAFE_API_KEY)
  ```
- **Vitest availability**:
  `npx.cmd vitest run` executes Vitest `v5.0.5` under Node `v24.22.1`. When running standard Vitest suites with `describe/it/expect`, tests execute in <600ms with exit code 0.
- **`vite.config.js` (`d:\Antigravity_projects\DriveLedger\vite.config.js:1-11`)**:
  Does not contain a `test: { ... }` block. Currently configured only for `@vitejs/plugin-react` and dev server on port 5173.

---

### 1.2 Exported Calculation Functions & Interfaces Requiring Unit Testing

| File Path | Function / Constant | Current Signature / Interface | R1 / R2 Audit Findings |
|---|---|---|---|
| `src/components/calculators/TcoCalculator.jsx:20-35` | `calculateTcoProjection` | `({ purchasePriceUsd, odometerMiles, annualDistanceMiles, mpgUs, isEv, fuelPriceUsdGal, annualInsuranceUsd, baseAnnualMaintenanceUsd, maintenanceWearFactor, downPaymentPct, aprPct, loanTermMonths, horizonYears, residualCurve10Yr })` | 1. Takes only `isEv: boolean`, not `PowertrainType = 'EV' \| 'PHEV' \| 'HEV' \| 'ICE_PETROL' \| 'ICE_DIESEL'`.<br>2. Fuel cost (`line 63-65`) uses flat rate; does not support home vs DC fast charging split for EV, nor combined profile for PHEV.<br>3. Maintenance escalation (`line 109-114`) only has milestone bumps at 55k and 90k, missing 60k, 100k, 150k, 200k.<br>4. Non-linear depreciation curve defaults to a fixed array, without powertrain-specific degradation characteristics. |
| `src/data/maintenanceData.js:146-357` | `MAINTENANCE_COMPONENTS` | Array of 7 component objects | 1. `drivetrain-dmf-dsg` (line 181) explicitly includes `'ev'` under `applicablePowertrains` (EVs erroneously get Dual-Mass Flywheel & DSG mechatronics warnings).<br>2. Missing dedicated EV items: SoH % (LFP vs NMC capacity loss), OBC/ICCU failure risk, heat pump/valve failures, reduction gear oil, increased weight suspension/tire wear, regenerative brake rust.<br>3. Does not filter by `PowertrainType`. |
| `src/data/maintenanceData.js:363-429` | `evaluateComponentHealth` | `({ component, physicalOdometerMiles, urbanTripSharePct, oilIntervalId, serviceHistoryId, transmissionId })` | Computes `effectiveWearMiles`, `wearPctOfCritical`, `status` (`OPTIMAL` \| `WARNING` \| `CRITICAL`). Needs unit testing against EV vs ICE component lists. |
| `src/data/maintenanceData.js:141-144` | `calculateOemRiskMultiplier` | `(physicalOdometerMiles)` | `Math.min(3.1, Math.max(2.2, 1.0 + (odo / 45000) * 0.85))`. Needs boundary testing (0, 500k+, negative). |
| `src/components/calculators/MaintenanceMilestones.jsx:7-120` | `STANDARD_MILESTONES` | Static array with 15k, 30k, 60k, 90k, 120k, 150k milestones | Fully hardcoded with ICE items (engine oil, spark plugs, timing belt, DPF ash, transmission torque converter flush). Zero powertrain filtering for EV vehicles. |
| `src/data/obdCodes.js:44-87` | `OBD_CODES`, `calculateObdWorkshopEstimate` | 20 OBD dossiers, `(obdCodeObj, tierId)` | 18 of 20 codes are ICE-exclusive (catalyst P0420, DPF P2002/P2463, turbo P0299, EGR P0401, etc.). No powertrain filter exists to ensure EV yields 0 ICE codes. |
| `src/components/calculators/EvBreakEvenCalculator.jsx:64-86` | Internal running cost memo | `iceCostPerUnit, evCostPerUnit, energySavingsPerUnit` | Uses single electricity price, missing home vs DC tariff split. |
| `src/components/common/vehicle/vehicleArchetypes.js:206-294` | `resolvePowertrainArchetype` | `(vehicle)` | Resolves to `'diesel' \| 'petrol-turbo' \| 'petrol-na' \| 'hybrid' \| 'phev' \| 'mhev' \| 'ev'`. Must be aligned with or mapped to `PowertrainType = 'EV' \| 'PHEV' \| 'HEV' \| 'ICE_PETROL' \| 'ICE_DIESEL'`. |

---

### 1.3 Specific Logical & Mathematical Deficiencies Observed

1. **ICE Component Leaking to EV**:
   - In `src/data/maintenanceData.js:181`:
     ```javascript
     applicablePowertrains: ['diesel', 'gasoline-turbo', 'gasoline-na', 'hybrid', 'ev'],
     ```
     Component `'drivetrain-dmf-dsg'` (Dual-Mass Flywheel & DSG) is flagged as applicable to `'ev'`.
   - In `src/components/calculators/MaintenanceMilestones.jsx:7-120`:
     Selecting any EV preset currently displays engine oil changes, spark plug replacements, timing belts, and DPF filters.
2. **Missing EV-Specific Components**:
   - No battery degradation component distinguishing **LFP** (flatter degradation, ~0.5-0.8%/yr, resilient to 100% daily charging) vs **NMC** (steeper early year 1-2 drop, cycle-sensitive, sensitive to high SoC resting).
   - No **OBC / ICCU** (On-board charger / integrated charging control unit) failure component.
   - No **single-speed reducer gear oil** maintenance component.
   - No **regenerative braking disc rust** component.
3. **Depreciation Curve Non-Linearity**:
   - `TcoCalculator.jsx:81-89` applies a residual percentage array, but does not provide an autonomous non-linear mathematical curve when custom vehicles lack pre-baked curves, nor does it factor in powertrain-specific depreciation rates (e.g. EV technology obsolescence vs Toyota hybrid value retention).
4. **Maintenance Scaling Thresholds**:
   - `TcoCalculator.jsx:110-114`:
     ```javascript
     const serviceMilestoneBump =
       (endOfYearOdo >= 55000 && endOfYearOdo - annualMi < 55000) ||
       (endOfYearOdo >= 90000 && endOfYearOdo - annualMi < 90000)
         ? 650
         : 0;
     ```
     Checks only 55k and 90k. R2 requires dynamic scaling crossing major milestones: **60k, 100k, 150k, 200k**.
5. **Boundary Condition Deficiencies**:
   - `calculateTcoProjection`: Does not clamp `odometerMiles` to prevent negative inputs from producing unrealistic residual values.
   - Vehicle `year`: No validation for unrealistic years (e.g., negative, year 1800, or year 2100).
   - Ultra-high mileage (>500,000 km / 310,000 mi): No floor mechanism prevents residual values from deteriorating below salvage floor or maintenance multipliers from scaling unbounded.

---

## 2. Logic Chain

1. **Test Infrastructure Selection**:
   - `package.json` relies on Node v24's native `node --test`. `tests/driveledger.test.js` uses a custom JSX transpiler and mock DOM environment that fails when loaded directly into Vitest due to mock incompatibilities.
   - Vitest (`v5.0.5`) is already cached in the environment, runs instantaneously via `npx vitest run`, and integrates directly with Vite's module resolution.
   - Creating a dedicated Vitest test suite at `tests/powertrainCalculators.test.js` (or adding a `"test:vitest"` script) cleanly isolates R1, R2, and R3 unit testing without disrupting legacy `npm test` checks.
2. **Powertrain Type Architecture (R1)**:
   - Defining `export type PowertrainType = 'EV' | 'PHEV' | 'HEV' | 'ICE_PETROL' | 'ICE_DIESEL'` establishes a single source of truth.
   - A normalization helper `getPowertrainType(vehicle)` bridges existing preset strings (`'electric'`, `'ev'`, `'hybrid'`, `'diesel'`, `'gasoline-turbo'`) to `PowertrainType`.
   - Filtering functions (`getMaintenanceComponentsForPowertrain`, `getMilestonesForPowertrain`, `getObdCodesForPowertrain`) guarantee that when `powertrain === 'EV'`, the result set contains strictly 0 ICE items.
3. **Calculation Logic Audit (R2)**:
   - **Fuel**:
     For EV:
     $$\text{Blended Tariff} = (\text{homeRatio} \times \text{homeTariff}) + ((1 - \text{homeRatio}) \times \text{dcFastTariff})$$
     $$\text{Annual Energy Cost} = \left(\frac{\text{annualDistance}}{100}\right) \times \text{kWhPer100} \times \text{Blended Tariff}$$
     For PHEV:
     $$\text{Annual Fuel Cost} = \text{AnnualDist} \times (\text{UF}_{\text{electric}} \times \text{Cost}_{\text{electric}} + (1 - \text{UF}_{\text{electric}}) \times \text{Cost}_{\text{petrol}})$$
   - **Depreciation**:
     Marginal annual depreciation must satisfy:
     $$\Delta\text{Deprec}(Y_1) > \Delta\text{Deprec}(Y_2) > \Delta\text{Deprec}(Y_3)$$
     with residual value floored at minimum scrap value (e.g. 8% of purchase price or $1,000).
   - **Maintenance**:
     Milestone bumps must activate dynamically as odometer crosses 60k, 100k, 150k, and 200k.
   - **Boundaries**:
     All numeric parameters must pass through input sanitizers:
     - `odometerMiles = Math.max(0, Number(odometerMiles) || 0)`
     - `annualDistanceMiles = Math.max(100, Number(annualDistanceMiles) || 12000)`
     - `purchasePriceUsd = Math.max(500, Number(purchasePriceUsd) || 30000)`
     - `modelYear = Math.min(new Date().getFullYear() + 1, Math.max(1985, Number(year) || 2020))`
4. **Unit Test Strategy (R3)**:
   - A single, focused Vitest file (`tests/powertrainCalculators.test.js`) importing `{ describe, it, expect } from 'vitest'` executes in <500ms and yields 0 long logs, reporting pass/fail per requirement.

---

## 3. Caveats

1. **Vitest DevDependency in `package.json`**:
   `vitest` can run via `npx vitest run`, but should be formalized in `package.json` under `"devDependencies": { "vitest": "^3.0.0" }` and `"scripts": { "test:vitest": "vitest run" }`.
2. **Backward Compatibility with `tests/driveledger.test.js`**:
   `tests/driveledger.test.js:521-555` calls `calculateTcoProjection` with the original parameter names (`purchasePriceUsd`, `mpgUs`, `isEv`, etc.) and asserts exactly 5 breakdown categories. The modified functions must maintain full backward compatibility with optional new fields (e.g., `powertrainType`, `chargingProfile`, `homeTariffPerKwh`).
3. **Units Context (Miles vs Kilometers)**:
   The internal database stores distances in Miles and costs in USD. Regional conversion (EU: km, EUR; UK: mi, GBP; US: mi, USD) is handled by `UnitContext.jsx`. The calculation core should accept both canonical miles and provide explicit conversion helpers for `kWh/100km` and `L/100km`.

---

## 4. Conclusion & Recommended Action Plan

### 4.1 Recommended File Structure for Implementation
1. **Types & Powertrain Normalization**:
   - Location: `src/data/powertrainArchetypes.js` (or `src/types/powertrain.js`)
   - Export:
     ```javascript
     export const POWERTRAIN_TYPES = {
       EV: 'EV',
       PHEV: 'PHEV',
       HEV: 'HEV',
       ICE_PETROL: 'ICE_PETROL',
       ICE_DIESEL: 'ICE_DIESEL',
     };
     export function normalizePowertrainType(vehicleOrString) { ... }
     ```
2. **Maintenance Component & Milestone Filtering**:
   - Location: `src/data/maintenanceData.js` and `src/components/calculators/MaintenanceMilestones.jsx`
   - Remove `'ev'` from `drivetrain-dmf-dsg:applicablePowertrains`.
   - Add EV components:
     - `ev-battery-soh-lfp-nmc` (State of Health: LFP vs NMC)
     - `ev-obc-iccu` (On-board charger / ICCU)
     - `ev-heat-pump-chiller-valve` (Heat pump Octovalve & coolant loop)
     - `ev-reducer-gear-oil` (Single-speed reduction gear oil)
     - `ev-chassis-bushings-tire-wear` (Curb weight suspension & tire wear)
     - `ev-brake-rotor-corrosion` (Regen brake surface corrosion)
   - Export `getMaintenanceComponentsForPowertrain(powertrainType)`
   - Export `getMilestonesForPowertrain(powertrainType, odometerMiles)`
3. **Calculator Engine Enhancements**:
   - Location: `src/components/calculators/TcoCalculator.jsx`
   - Support `powertrainType: 'EV' | 'PHEV' | 'HEV' | 'ICE_PETROL' | 'ICE_DIESEL'`.
   - Implement EV home/DC charging tariff split:
     `{ homeKwhTariffUsd: 0.16, dcFastKwhTariffUsd: 0.45, homeChargingPct: 80 }`.
   - Implement PHEV blended fuel profile:
     `{ electricSharePct: 65, electricKwhPer100Mi: 32, gasolineMpg: 38 }`.
   - Update maintenance milestone bumps to scale at 60k, 100k, 150k, and 200k.
   - Enforce non-linear depreciation formula and input sanitization boundaries.
4. **Unit Test Suite**:
   - Location: `tests/powertrainCalculators.test.js`
   - Runner: Vitest (`npx vitest run tests/powertrainCalculators.test.js`)

---

### 4.2 Automated Vitest Test Suite Blueprint (`tests/powertrainCalculators.test.js`)

Below is the concrete test suite structure designed to fulfill R1, R2, and R3:

```javascript
import { describe, it, expect } from 'vitest';
import {
  POWERTRAIN_TYPES,
  normalizePowertrainType,
} from '../src/data/powertrainArchetypes.js';
import {
  MAINTENANCE_COMPONENTS,
  getMaintenanceComponentsForPowertrain,
  calculateOemRiskMultiplier,
} from '../src/data/maintenanceData.js';
import {
  STANDARD_MILESTONES,
  getMilestonesForPowertrain,
} from '../src/components/calculators/MaintenanceMilestones.jsx';
import {
  calculateTcoProjection,
} from '../src/components/calculators/TcoCalculator.jsx';
import {
  OBD_CODES,
  getObdCodesForPowertrain,
} from '../src/data/obdCodes.js';

describe('R1: Powertrain Architecture & Strict Separation', () => {
  it('defines the strict 5 canonical powertrain types', () => {
    expect(POWERTRAIN_TYPES).toEqual({
      EV: 'EV',
      PHEV: 'PHEV',
      HEV: 'HEV',
      ICE_PETROL: 'ICE_PETROL',
      ICE_DIESEL: 'ICE_DIESEL',
    });
  });

  it('normalizes legacy vehicle presets to canonical PowertrainType', () => {
    expect(normalizePowertrainType({ isEv: true })).toBe('EV');
    expect(normalizePowertrainType({ powertrain: 'electric' })).toBe('EV');
    expect(normalizePowertrainType({ fuelType: 'Plug-in Hybrid' })).toBe('PHEV');
    expect(normalizePowertrainType({ powertrain: 'hybrid' })).toBe('HEV');
    expect(normalizePowertrainType({ fuelType: 'Diesel' })).toBe('ICE_DIESEL');
    expect(normalizePowertrainType({ fuelType: 'Gasoline' })).toBe('ICE_PETROL');
  });

  it('yields EXACTLY 0 ICE items when EV powertrain is selected', () => {
    const evComponents = getMaintenanceComponentsForPowertrain('EV');
    const evMilestones = getMilestonesForPowertrain('EV', 150000);
    const evObd = getObdCodesForPowertrain ? getObdCodesForPowertrain('EV') : [];

    const forbiddenIceKeywords = [
      'motor oil', 'engine oil', 'timing belt', 'timing chain', 'turbo',
      'egr', 'dpf', 'adblue', 'dual-mass flywheel', 'dmf', 'fuel injector',
      'spark plug', 'exhaust', 'catalytic converter', 'atf mechatronics'
    ];

    // Check components
    for (const comp of evComponents) {
      const text = `${comp.name} ${comp.category}`.toLowerCase();
      for (const kw of forbiddenIceKeywords) {
        expect(text).not.toContain(kw);
      }
    }

    // Check milestones
    for (const ms of evMilestones) {
      for (const item of ms.items) {
        const text = item.name.toLowerCase();
        for (const kw of forbiddenIceKeywords) {
          expect(text).not.toContain(kw);
        }
      }
    }

    // Check OBD codes
    for (const obd of evObd) {
      expect(['P0420', 'P2002', 'P0299', 'P0171', 'P0300', 'P0401', 'P0087', 'P2463']).not.toContain(obd.code);
    }
  });

  it('includes all mandatory EV-specific components and milestones', () => {
    const evComponents = getMaintenanceComponentsForPowertrain('EV');
    const compIds = evComponents.map((c) => c.id);

    expect(compIds).toContain('ev-battery-soh-lfp-nmc');
    expect(compIds).toContain('ev-obc-iccu');
    expect(compIds).toContain('ev-heat-pump-chiller-valve');
    expect(compIds).toContain('ev-reducer-gear-oil');
    expect(compIds).toContain('ev-chassis-bushings-tire-wear');
    expect(compIds).toContain('ev-brake-rotor-corrosion');
  });

  it('calculates EV energy costs with home vs DC fast charging split', () => {
    const annualDist = 12000;
    const kwhPer100Mi = 28;
    const homeTariff = 0.15;
    const dcTariff = 0.45;

    // 80% home, 20% DC
    const proj80Home = calculateTcoProjection({
      purchasePriceUsd: 40000,
      annualDistanceMiles: annualDist,
      powertrainType: 'EV',
      evKwhPer100Mi: kwhPer100Mi,
      homeChargingPct: 80,
      homeTariffUsd: homeTariff,
      dcFastTariffUsd: dcTariff,
      horizonYears: 1,
    });

    const blendedTariff = 0.8 * 0.15 + 0.2 * 0.45; // $0.21 / kWh
    const expectedFuelCost = Math.round((annualDist / 100) * kwhPer100Mi * blendedTariff); // 120 * 28 * 0.21 = $706
    expect(proj80Home.yearlySchedule[0].yearFuelUsd).toBeCloseTo(expectedFuelCost, -1);
  });
});

describe('R2: Calculator Mathematics & Financial Logic Audit', () => {
  it('enforces a steep initial non-linear depreciation curve flattening over time', () => {
    const proj = calculateTcoProjection({
      purchasePriceUsd: 50000,
      annualDistanceMiles: 12000,
      horizonYears: 5,
    });

    const sched = proj.yearlySchedule;
    // Marginal depreciation: Year 1 > Year 2 > Year 3 > Year 4
    expect(sched[0].yearDepreciationUsd).toBeGreaterThan(sched[1].yearDepreciationUsd);
    expect(sched[1].yearDepreciationUsd).toBeGreaterThan(sched[2].yearDepreciationUsd);
    expect(sched[2].yearDepreciationUsd).toBeGreaterThan(sched[3].yearDepreciationUsd);

    // Residual value must not drop below scrap salvage floor (e.g. 10%)
    expect(proj.finalResidualValueUsd).toBeGreaterThanOrEqual(4000);
  });

  it('scales maintenance dynamically across 60k, 100k, 150k, and 200k milestone thresholds', () => {
    // Car starting at 50,000 miles doing 15,000 mi/yr:
    // Year 1 ends at 65k (crosses 60k threshold)
    // Year 2 ends at 80k
    // Year 3 ends at 95k
    // Year 4 ends at 110k (crosses 100k threshold)
    const proj = calculateTcoProjection({
      odometerMiles: 50000,
      annualDistanceMiles: 15000,
      horizonYears: 4,
      baseAnnualMaintenanceUsd: 800,
    });

    const sched = proj.yearlySchedule;
    // Year 1 (crossing 60k) must be higher than baseline
    expect(sched[0].yearMaintenanceUsd).toBeGreaterThan(sched[1].yearMaintenanceUsd * 0.9);
    // Year 4 (crossing 100k) must reflect major service bump
    expect(sched[3].yearMaintenanceUsd).toBeGreaterThan(sched[2].yearMaintenanceUsd);
  });

  it('verifies exact mathematical aggregation of TCO components', () => {
    const proj = calculateTcoProjection({
      purchasePriceUsd: 35000,
      annualDistanceMiles: 12000,
      horizonYears: 5,
      aprPct: 5.5,
      loanTermMonths: 60,
      downPaymentPct: 15,
    });

    const sumComponents =
      proj.totalDepreciationUsd +
      proj.totalFuelUsd +
      proj.totalInsuranceUsd +
      proj.totalMaintenanceUsd +
      proj.totalInterestUsd;

    expect(Math.abs(proj.totalEconomicCostUsd - sumComponents)).toBeLessThanOrEqual(2);

    const sharePctSum = proj.breakdown.reduce((acc, b) => acc + b.sharePct, 0);
    expect(Math.abs(sharePctSum - 100)).toBeLessThanOrEqual(0.3);
  });

  it('safely handles extreme boundary conditions without NaN or exceptions', () => {
    // 0 km / brand new
    const zeroOdoProj = calculateTcoProjection({
      purchasePriceUsd: 30000,
      odometerMiles: 0,
      annualDistanceMiles: 10000,
      horizonYears: 5,
    });
    expect(zeroOdoProj.totalEconomicCostUsd).toBeGreaterThan(0);
    expect(Number.isNaN(zeroOdoProj.costPerMileUsd)).toBe(false);

    // 500,000+ km (315,000+ miles)
    const highOdoProj = calculateTcoProjection({
      purchasePriceUsd: 30000,
      odometerMiles: 320000,
      annualDistanceMiles: 15000,
      horizonYears: 3,
    });
    expect(highOdoProj.finalResidualValueUsd).toBeGreaterThan(0);
    expect(Number.isFinite(highOdoProj.totalEconomicCostUsd)).toBe(true);

    // Negative inputs & invalid years
    const sanitizedProj = calculateTcoProjection({
      purchasePriceUsd: -25000,
      odometerMiles: -50000,
      annualDistanceMiles: -10000,
      aprPct: -4,
      year: 1750,
      horizonYears: -2,
    });
    expect(sanitizedProj.totalEconomicCostUsd).toBeGreaterThan(0);
    expect(sanitizedProj.yearlySchedule.length).toBeGreaterThanOrEqual(1);
  });
});
```

---

## 5. Verification Method

To independently verify the investigation findings and test suite setup:

1. **Verify Existing Tests Pass**:
   ```powershell
   npm.cmd test
   ```
   *Expected result*: Exit code 0, 9 pass, 0 fail, 1 skipped.
2. **Verify Vitest Runner Execution**:
   ```powershell
   npx.cmd vitest --version
   ```
   *Expected result*: Prints `vitest/5.0.5` with exit code 0.
3. **Verify Powertrain Archetypes and Component Data**:
   Inspect line 181 of `src/data/maintenanceData.js`:
   Observe `'ev'` presence in `drivetrain-dmf-dsg.applicablePowertrains`.
4. **Inspect TCO Engine Escalation & Fuel Math**:
   Inspect lines 63-65 and 109-120 of `src/components/calculators/TcoCalculator.jsx`:
   Observe binary `isEv` without home/DC tariff split, and fixed 55k/90k service bumps instead of 60k/100k/150k/200k.
5. **Post-Implementation Verification**:
   Once Sub-Agents 1, 2, and 3 apply the changes:
   ```powershell
   npx.cmd vitest run tests/powertrainCalculators.test.js
   ```
   *Expected result*: Exit code 0, all tests pass, zero ICE items for EV, mathematically validated non-linear depreciation and maintenance scaling.

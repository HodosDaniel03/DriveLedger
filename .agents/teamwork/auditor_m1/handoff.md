# Forensic Audit Report — Milestone 1: Powertrain Branching & Architecture

**Work Product**: Milestone 1 Implementation (`src/data/powertrainTypes.js`, `src/data/powertrainArchetypes.js`, `src/data/vehiclePresets.js`, `src/data/maintenanceData.js`, `src/components/calculators/MaintenanceMilestones.jsx`, `tests/powertrainBranching.test.js`)  
**Profile**: General Project  
**Integrity Mode**: Development (defined in `ORIGINAL_REQUEST.md`)  
**Verdict**: **CLEAN**

---

## 1. Observation

### 1.1 Source Code Static Inspection
- `src/data/powertrainTypes.js` (NEW, 462 lines):
  - Canonical frozen enumeration `POWERTRAIN_TYPES = Object.freeze({ EV: 'EV', PHEV: 'PHEV', HEV: 'HEV', ICE_PETROL: 'ICE_PETROL', ICE_DIESEL: 'ICE_DIESEL' })`.
  - Genuine resolver `resolvePowertrainType(vehicleOrType)` and alias `normalizePowertrainType` handling string tokens, canonical properties, legacy boolean flags (`isEv`), `fuelType`, `powertrain`, `archetypeId`, and descriptive token filters.
  - Strict boolean predicate `isPureElectric(vehicleOrPowertrainType)` returning `true` exclusively for 100% battery-electric vehicles, excluding `PHEV` and `HEV`.
  - Energy calculation functions `calculateEvEnergyCost()` and `calculatePhevEnergyCost()` dynamically computing costs from distance, efficiency (`kWh/100mi`), and charging split (Home AC vs. DC Fast Charging tariffs).
  - High-Voltage Battery degradation engine `calculateBatterySoh()` implementing chemistry-specific loss curves (`LFP` vs. `NMC`), calendar aging, mileage loss, and DC fast-charge penalties with floor caps (`70.0%` for LFP, `65.0%` for NMC) and warranty status tracking (`HEALTHY`, `DEGRADED`, `WARRANTY_CLAIM_ELIGIBLE`).
  - Metric/Imperial unit conversion utilities (`convertKwh100MiToKwh100Km`, `convertKwh100KmToKwh100Mi`, `convertKwh100MiToMiPerKwh`, `convertMiPerKwhToKwh100Mi`).
- `src/data/maintenanceData.js`:
  - Removed `'ev'` and `'single-speed-ev'` from `drivetrain-dmf-dsg` (lines 199-200), ensuring dual-mass flywheel failure warnings do not pollute EVs.
  - Removed `'ev'` from `suspension-brakes-chassis` and `hv-battery-thermal-loop`.
  - Added 7 dedicated EV component dossiers to `MAINTENANCE_COMPONENTS`:
    1. `ev-battery-soh` (High-Voltage Traction Battery Degradation & Cell Balance)
    2. `ev-obc-iccu` (On-Board Charger & Integrated Power Electronics)
    3. `ev-thermal-heatpump` (Heat Pump, Multi-Way Coolant Switching Valves & Battery Chiller)
    4. `ev-reduction-gear` (Single-Speed Reducer Gearbox Fluid & Differential Bearings)
    5. `ev-curb-suspension` (Heavy Curb-Weight Suspension Hydro-Bushings & Ball Joints)
    6. `ev-torque-tires` (High-Torque Accelerated EV Tire Wear & Wheel Alignment)
    7. `ev-regen-brake-corrosion` (Regenerative Braking Rotor Rust & Caliper Slide Pin Seizure)
  - All 7 EV components enforce `oilSensitivity: 0.0` and adhere to the strict thermodynamic `urbanShortTripPenalty` constraint (`1.35x` to `1.55x`, with values ranging from `1.36` to `1.48`).
  - Implemented `ICE_EXCLUSIVE_COMPONENT_IDS = new Set(['timing-assembly', 'drivetrain-dmf-dsg', 'dpf-egr-scr-injectors', 'hpfp-turbo-vnt', 'gdi-intake-pcv-ignition'])`.
  - In `evaluateComponentHealth()`, lines 628-636 return `null` whenever an ICE component is evaluated against a pure electric powertrain (`isPureElectric(resolvedType)`).
  - Exported `EV_MILESTONES` (6 maintenance intervals across 15k, 30k, 60k, 90k, 120k, 150k miles), completely devoid of combustion items, and helper functions `getMilestonesForPowertrain()` and `filterMilestonesByPowertrain()`.
- `src/data/vehiclePresets.js`:
  - EV presets `tesla-model-3-lr` and `tesla-model-y-lr` explicitly tagged with `powertrainType: 'EV'` and `batteryChemistry: 'NMC'`.
  - Purged ICE-specific OBD codes `P0700` (transmission control) and `P0128` (engine thermostat below regulating temp) from EV presets, retaining clean EV diagnostic codes `['U0100', 'P0A80']`.
- `src/components/calculators/MaintenanceMilestones.jsx`:
  - Dynamically switches milestone schedule between `EV_MILESTONES` and `ICE_MILESTONES` based on vehicle powertrain.
  - Added "Pure EV · 0 ICE Fluids" badge indicator.

### 1.2 Integrity Forensics Analysis
- **Hardcoded test bypasses**: None detected. Tests import and execute application logic.
- **Facade implementations**: None detected. All functions compute outputs dynamically from parameters.
- **Pre-populated verification artifacts**: None detected. A scan for pre-existing `*.log`, `*result*`, and `*output*` files in the repository confirmed no fabricated artifacts.
- **Tautological assertions**: None detected. Tests verify specific computed numerical values, boundary states, and set non-memberships.

### 1.3 Independent Execution Results
- `npm.cmd test`:
  ```
  > shiftmetric@2.4.0 test
  > node --test tests/*.test.js

  === ShiftMetric Full-Stack Deep Verification Suite ===
  ✓ 1. 12 Vehicle Presets & 10-year residual curves verified
  ✓ 2. Maintenance Risk Matrix & Monotonic Thermodynamic Multipliers (1.35x-1.55x) verified
  ✓ 3. 20 OBD-II Fault Dossiers, Probability Sums & Workshop Rate Tiers verified
  ✓ 4. UnitContext (US / UK / EU) live conversion math verified
  ✓ 5. TcoCalculator financial engine & edge cases verified
  ✓ 6A. In-place <input type="range"> slider drag & DOM node preservation verified
  ✓ 6B. Multi-tab switching (TCO -> Risk -> OBD) & hook isolation verified (0 state collisions)
  ✓ 6C. Global Unit Switcher (US/UK/EU), EU L/100km slider bounds & atomic Footer deep-links verified
  ✓ 6D. Legal Modals & TechnicalMethodologyGuide (1635 words + JSON-LD) verified
  ✓ 6E. Consecutive Preset Clicks, Consecutive Tab Clicks, OBD Code Clicks & PopState Sync verified
  ✓ 6F. Localized Slider Dragging (EU/UK/US), EV Efficiency Range Bounds, Status Dots & Single-Arrow CTAs verified
  ✓ 6G. Top Affiliate Banners, Vehicle Comparator, EV Break-Even, Maintenance Milestones, Dossier Export & Symptom Filter verified
  ✓ 6H. Advanced Edge Cases, Negative Currencies, Swapping & Code Catalog Integrity verified
  ✓ 6I. Brand Unification (ShiftMetric) & FAQ Deduplication verified
  ALL DEEP VERIFICATION CHECKS PASSED WITH 0 ERRORS.
  ✔ tests\driveledger.test.js (807.6849ms)
  ﹣ Jev-as-a-Judge: Szemantikai katalógus és szervizintervallum ellenőrzés (0.6533ms) # TYPESAFE_API_KEY környezeti változó hiányzik. A szemantikai Jev teszthez állítsd be: $env:TYPESAFE_API_KEY="your-key"
  ✔ 1. Canonical PowertrainType Enumeration & Resolver (0.7949ms)
  ✔ 2. EV Strict ICE Exclusion in Component Dossiers (Zero ICE Contamination) (0.397ms)
  ✔ 3. EV Strict ICE Exclusion in Milestone Roadmap Schedules (0.2901ms)
  ✔ 4. Sanitized EV Presets & OBD Fault Codes (0.1566ms)
  ✔ 5. EV & PHEV Fuel / Energy Calculation Engines (0.3849ms)
  ✔ 6. High-Voltage Battery Degradation (SoH % LFP vs. NMC Curve) (0.2629ms)
  ✔ 1. Vehicle Body Archetype Resolution (7 Categories) (1.1608ms)
  ✔ 2. Powertrain Archetype Resolution (7 Configurations) (0.2907ms)
  ✔ 3. 4-Tier Technical Mechanical Badges Generation (1.7388ms)
  ✔ 4. Archetype Label Formatting (0.1749ms)
  ✔ 1. Master Vehicle Catalog Marque Coverage (35 Brands across 7 Global Clusters) (0.8385ms)
  ✔ 2. Hierarchical Model & Engine Integrity and Telemetry Constraints (1.1708ms)
  ✔ 3. Catalog Navigation & Autocomplete Search Functions (4.8454ms)
  ✔ 4. Backward Compatibility with VEHICLE_PRESETS & Global BRANDS (0.2016ms)
  ℹ tests 16
  ℹ suites 0
  ℹ pass 15
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 1
  ℹ todo 0
  ℹ duration_ms 815.8695
  ```
- `npm.cmd run build`:
  Production Vite build succeeded in 3.10s without errors (`dist/index.html`, `dist/assets/index-DpKeTf3i.css`, `dist/assets/index-DgaVql74.js`).

### 1.4 Adversarial Stress Testing Results
Independent adversarial executions were executed against the code:
1. `resolvePowertrainType` stress test: Handled `undefined`, `null`, empty string, fallback strings, case insensitivity, conflicting object flags, and archetype tokens with 100% correct canonical mapping.
2. `isPureElectric` boundary test: Evaluated `true` strictly for EV, and `false` for PHEV, HEV, Diesel, Petrol, null, and empty objects.
3. Energy calculations boundary test: `calculateEvEnergyCost` and `calculatePhevEnergyCost` with 0 miles and negative miles safely returned $0.00 without NaN or division by zero. Percentage bounds (0% to 100%) correctly clamped.
4. Battery SoH degradation monotonicity test: Monotonically evaluated over 0 to 200,000 miles. Proved LFP degrades slower than NMC under identical wear conditions. Extreme 1,000,000-mile tests confirmed strict adherence to degradation floors (70.0% LFP, 65.0% NMC).
5. EV 0-ICE Exclusion word-boundary regex scan: Verified all 7 EV component dossiers and all 6 EV milestone intervals against 11 banned combustion categories (engine oil, timing belt/chain, turbo, EGR, DPF, flywheel/DMF, injectors, spark plugs, exhaust, transmission fluid). Result: **0 combustion occurrences found**.

---

## 2. Logic Chain

1. *Premise*: `ORIGINAL_REQUEST.md` mandates strict `PowertrainType` separation (`EV`, `PHEV`, `HEV`, `ICE_PETROL`, `ICE_DIESEL`), complete exclusion of 10 combustion items for EVs, and dynamic calculation of EV-specific replacement components (SoH % LFP/NMC, OBC/ICCU, heat pump, reducer fluid, suspension/tire wear, brake corrosion).
2. *Observation*: `src/data/powertrainTypes.js` implements the exact requested enum, resolvers, energy calculations, and SoH chemistry models without hardcoding or mocks.
3. *Observation*: `src/data/maintenanceData.js` introduces 7 dedicated EV component dossiers meeting all physical thermodynamic constraints (`urbanShortTripPenalty` between 1.35 and 1.55, `oilSensitivity: 0.0`), implements `ICE_EXCLUSIVE_COMPONENT_IDS`, returns `null` from `evaluateComponentHealth` on EV evaluations of ICE components, and defines `EV_MILESTONES` with zero combustion items.
4. *Observation*: Presets `tesla-model-3-lr` and `tesla-model-y-lr` were sanitized of ICE OBD codes `P0700` and `P0128`.
5. *Observation*: `npm.cmd test` and `npm.cmd run build` execute successfully with 15 passing tests and 0 errors.
6. *Conclusion*: Milestone 1 deliverables are genuine, complete, verified, and free of any integrity violations.

---

## 3. Caveats

- **Milestone 2 Handoff Note**: In `src/components/calculators/MaintenanceRiskMatrix.jsx`, component filtering is currently handled via `comp.applicablePowertrains.includes(activePreset.powertrain)`. Because Worker M1 purged `'ev'` from ICE components and added `'ev'` to the 7 EV components, EV risk matrix evaluations currently yield only the 7 EV components. Milestone 2 will directly integrate `filterComponentsForPowertrain` and the non-linear depreciation / odometer scaling logic across `MaintenanceRiskMatrix` and `TcoCalculator`.
- **Jev Catalog Judge**: The test `tests/jevCatalogJudge.test.js` is skipped due to the absence of the `TYPESAFE_API_KEY` environment variable in the local offline test environment, which is documented and expected.

---

## 4. Conclusion

**Verdict: CLEAN**

Milestone 1 (Powertrain Branching & Architecture) passes all forensic checks with zero integrity violations. The implementation is authentic, mathematically sound, dynamically tested, and fully aligned with the requirements of `ORIGINAL_REQUEST.md`.

---

## 5. Verification Method

To independently reproduce and verify this audit:
1. Run the test suite:
   ```powershell
   npm.cmd test
   ```
   *Expected outcome*: 15 passed, 0 failed, 1 skipped.
2. Run the production build:
   ```powershell
   npm.cmd run build
   ```
   *Expected outcome*: Vite compiles `dist/` with exit code 0.
3. Run the standalone powertrain branching test:
   ```powershell
   node --test tests/powertrainBranching.test.js
   ```
   *Expected outcome*: 6 passed, 0 failed.

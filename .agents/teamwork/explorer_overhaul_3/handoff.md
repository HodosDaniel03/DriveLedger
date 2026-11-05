# Codebase Survey Report: Automotive Business Logic, Math, State Sync, Tests & Build Hygiene (R4 & R5)

**Agent**: `explorer_overhaul_3`  
**Working Directory**: `d:\Antigravity_projects\DriveLedger\.agents\teamwork\explorer_overhaul_3`  
**Timestamp**: 2026-11-02T21:53:00Z  
**Scope**: Requirements R4 & R5 (Automotive Business Logic, Mathematical Engine, Global State Synchronization, Test Suites, Build Verification, Bundle Hygiene).

---

## 1. Observation

### 1.1 Test Suite Execution Results
- **Command Executed**: `cmd /c npm test`
  - Runs: `node --test tests/adversarialPowertrain.test.js tests/calculatorMath.test.js tests/driveledger.test.js tests/jevCatalogJudge.test.js tests/powertrainBranching.test.js tests/vehicleArchetypes.test.js tests/vehicleCatalog.test.js tests/vehicleKnownIssues.test.js tests/vehicleDataService.test.js tests/viralSeoFeatures.test.js && vitest run`
- **Node.js Native Test Runner Results**:
  - `tests/adversarialPowertrain.test.js`: 7 tests passed (ADV-1 through ADV-7).
  - `tests/calculatorMath.test.js`: 19 tests passed (MATH-DEP-1..7, MATH-ENERGY-1..5, MATH-MAINT-1..3, MATH-RISK-1..2, MATH-OBD-1..2, MATH-BOUND-1..5).
  - `tests/driveledger.test.js`: 14 deep verification suites passed with 0 errors (1328ms).
  - `tests/jevCatalogJudge.test.js`: 1 test skipped:
    `﹣ Jev-as-a-Judge: Szemantikai katalógus és szervizintervallum ellenőrzés (0.9446ms) # TYPESAFE_API_KEY környezeti változó hiányzik.`
  - `tests/powertrainBranching.test.js`: 10 tests passed (Canonical enum, EV ICE exclusion, Milestone impact wiring, etc.).
  - `tests/vehicleArchetypes.test.js`: 4 tests passed.
  - `tests/vehicleCatalog.test.js`: 4 tests passed.
  - `tests/vehicleDataService.test.js`: 9 tests passed.
  - `tests/vehicleKnownIssues.test.js`: 7 tests passed.
  - `tests/viralSeoFeatures.test.js`: 6 tests passed.
  - **Node Subtotal**: 73 tests total: **72 passed, 1 skipped, 0 failed** (Duration: 4090ms).
- **Vitest Runner Results**:
  - Config: `vitest.config.js:7` (`include: ['tests/powertrainCalculators.test.js']`).
  - Executed: `tests/powertrainCalculators.test.js` (55 tests passed in 24ms).
  - **Vitest Subtotal**: **55 passed, 0 failed**.
- **Combined Test Totals**: **128 tests executed across 11 test suites: 127 passed, 1 skipped (optional API key), 0 failed. Exit code 0.**

---

### 1.2 Production Build & Bundle Contamination Inspection
- **Command Executed**: `cmd /c npm run build`
  - Script: `node scripts/generate-sitemap-seo.mjs && vite build`
  - Sitemap generator: `[Sitemap Generator] Successfully generated 1064 programmatic URLs at D:\Antigravity_projects\DriveLedger\public\sitemap.xml`
  - Vite transformation: `✓ 1730 modules transformed in 4.11s`.
  - Artifacts:
    - `dist/index.html`: `1.95 kB │ gzip: 0.92 kB`
    - `dist/assets/index-DlTHBPkf.css`: `88.40 kB │ gzip: 14.33 kB`
    - `dist/assets/index-DOQNE6Os.js`: `1,173.37 kB │ gzip: 315.86 kB`
  - Build Exit Code: `0`.
- **Bundle Contamination Assessment**:
  - `odometer-web-application/`: **Zero imports** in `./src/` or `index.html`.
  - `stitch_design_system_generator/`: **Zero imports** in `./src/` or `index.html`.
  - `tailwind.config.js:4-7`: Content array is strictly scoped:
    ```javascript
    content: [
      './index.html',
      './src/**/*.{js,ts,jsx,tsx}',
    ]
    ```
  - Reference directories do not pollute or slow down the Vite production build.
- **Bundle Size Warning**:
  - Single production chunk warning: `dist/assets/index-DOQNE6Os.js` is 1,173.37 kB (> 500 kB limit) because all catalog datasets, vehicle known issues, and components are bundled synchronously into a single chunk.

---

### 1.3 Mathematical Formulas & Financial Engine Audit

#### A. 5-Year Non-Linear Depreciation (`src/data/maintenanceData.js:868-934`)
- **Factory-New Continuous Curve**:
  ```javascript
  const getFactoryRetention = (t) => {
    if (t <= 0) return 1.0;
    return Math.max(0.05, 0.45 * Math.exp(-0.58 * t) + 0.40 * Math.exp(-0.05 * t) + 0.15);
  };
  ```
- **Observed Behavior**:
  - Year 1: ~20-25% drop
  - Year 2: ~15% drop from Year 1
  - Year 3: ~12% drop from Year 2
  - Years 4–10: Flattens asymptotically to 3–7%/yr drop
- **Used Vehicle Acquisition Offset (`initialAgeYears`)**:
  - `const initialAgeYears = startOdo / 12500;`
  - `const baseRetention = Math.min(1.0, rCurrent / rAcquisition);`
  - Prevents used vehicles (e.g., 5-year-old at 60k mi) from retaking the initial 20% showroom drop.
- **Powertrain & Mileage Adjustments**:
  - HEV bonus: `ptMultiplier = 1.03`
  - EV tech obsolescence: `ptMultiplier = 0.97`
  - Diesel low-emission restrictions: `ptMultiplier = 0.985`
  - High annual mileage penalization: `Math.pow(Math.max(0.5, 1 - mileageExcessRatio * 0.04), yr)`
  - Low annual mileage reward: capped at `<= 1.5%/yr` with 5-year maximum compounding and 1.15x overall cap.
- **Residual Value Floor & Monotonicity**:
  - `finalRetention` clamped between `0.05` and `0.96`.
  - Residual value floor: `Math.max(Math.round(price * 0.05), Math.round(price * finalRetention))`.
  - In `calculateTcoProjection:1063`: Monotonicity invariant enforced: `Math.min(depResult.residualValueUsd, prevResidualValueUsd)`. Never appreciates.

#### B. Monthly Financing Amortization (`src/data/maintenanceData.js:980-1002`)
- **Amortization Formula**:
  ```javascript
  const factor = Math.pow(1 + monthlyRate, termMos);
  monthlyLoanPaymentUsd = (principalUsd * (monthlyRate * factor)) / (factor - 1);
  ```
- **Boundary Handling**:
  - Zero APR (`monthlyRate === 0`): `monthlyLoanPaymentUsd = principalUsd / termMos`.
  - Cash purchase (`termMos === 0` or `financeType === 'cash'`): `monthlyLoanPaymentUsd = 0`. Handled cleanly in `principalUsd > 0 && termMos > 0` condition.
  - Month-by-month loop (`maintenanceData.js:1073-1084`):
    `interestForMonth = remainingLoanBalanceUsd * monthlyRate`
    `principalForMonth = Math.min(remainingLoanBalanceUsd, monthlyLoanPaymentUsd - interestForMonth)`
    `remainingLoanBalanceUsd = Math.max(0, remainingLoanBalanceUsd - principalForMonth)`.
    Terminates cleanly without negative balances or infinite loops.

#### C. Powertrain-Specific Fuel / Energy Consumption
- **EV**:
  - Uses blended tariff (`homeFrac * homeTariff + dcFrac * dcTariff`).
  - Formula: `(annualMi / 100) * eff * effectiveTariff` where `eff` is kWh/100mi.
  - Zero tariff boundary: handles `$0.00/kWh` without falling back to default $0.16/kWh.
- **PHEV**:
  - Blends electric commute share (65%) and gasoline share (35%):
    `electricCost = (annualMi * evFrac / 100) * evEff * homeTariff`
    `gasCost = (annualMi * iceFrac / iceEfficiency) * gasRate`
- **ICE / HEV**:
  - Formula: `(annualMi / eff) * unitEnergyPrice`.

#### D. Conversions in `UnitContext.jsx:76-129`
- `convertMpgUsToRegion`:
  - `US` -> `MPG (US)`: identity
  - `UK` -> `MPG (UK)`: `+(val * 1.20095).toFixed(1)` (1.20095 UK Imperial gallons per US gallon)
  - `EU` -> `L/100km`: `+(235.21458 / val).toFixed(1)` (standard 235.21458 constant)
  - EV `EU` -> `kWh/100km`: `+(val / 1.609344).toFixed(1)`
- `convertRegionToMpgUs`: Exact mathematical inverse formulas.

---

### 1.4 Identified Bugs & Mathematical Edge Cases

#### BUG 1: Undefined Property Bug in `TcoCalculator.jsx:229` (High Severity)
- **File & Line**: `src/components/calculators/TcoCalculator.jsx:229`
- **Verbatim Code**:
  ```javascript
  subtext: `${horizonYears} évre összesen: ${formatCurrency(tco.totalEconomicCostUsd)} · ${formatCurrency(tco.costPerDistanceUnit)} / ${distanceUnit}`,
  ```
- **Observed Behavior**:
  - `tco` is the object returned by `calculateTcoProjection` (`src/data/maintenanceData.js:1194-1211`).
  - `calculateTcoProjection` returns `costPerMileUsd`, `totalEconomicCostUsd`, `totalDistanceMiles`, etc. It **does NOT return `costPerDistanceUnit`**.
  - Calling `formatCurrency(tco.costPerDistanceUnit)` passes `undefined`, which `convertUsdToRegion(undefined)` casts to `0`.
  - **Result**: The TL;DR verdict box renders `$0 / mi` or `€0 / km`.
- **Correct Solution**:
  - Use `costPerLocalUnit` (which is already correctly computed in `TcoCalculator.jsx:174-176`):
    ```javascript
    const distFactor = region === 'EU' ? 1.60934 : 1.0;
    const costPerLocalUnit = tco.totalDistanceMiles > 0
      ? tco.totalEconomicCostUsd / (tco.totalDistanceMiles * distFactor)
      : 0;
    ```
  - And format as: `${formatCurrency(costPerLocalUnit)} / ${distanceUnit}`.

#### BUG 2: Unclamped Negative Numeric Inputs in `TcoCalculator.jsx`
- **File & Lines**:
  - `src/components/calculators/TcoCalculator.jsx:601`:
    ```javascript
    onChange={(e) => {
      if (e.target.value === '') return;
      setPurchasePriceUsd(convertRegionToUsd(Number(e.target.value) || 0));
    }}
    ```
  - `src/components/calculators/TcoCalculator.jsx:781`:
    ```javascript
    setAnnualDistanceMiles(convertRegionToMiles(Number(e.target.value) || 0));
    ```
- **Observed Behavior**:
  - If a user inputs a negative number (e.g. `-5000`), `displayPrice` becomes `-5000`.
  - Line 634 renders negative down payment: `formatCurrency(Math.round(displayPrice * (downPaymentPct / 100)))` -> `-$1,000`.
  - Line 653 renders negative slider label: `formatCurrency(Math.round(displayPrice * 0.6))` -> `-$3,000`.
- **Correct Solution**:
  - Enforce `Math.max(0, ...)` or `Math.max(500, ...)` when parsing inputs.

#### BUG 3: Hungarian Text Contamination in Active Calculators & State Components
- **Scan Result**: 458 lines across 31 files in `./src/` contain Hungarian characters (`[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]`).
- **Notable Locations in Business Logic Components**:
  - `TcoCalculator.jsx:226-249`: `tcoTldrFacts` contains `'Havi & 5-Éves Összköltség'`, `'Fő Költségtényező'`, `'Értékvesztés'`, `'várható kiadás'`, `'Kockázati Szint & Értékelés'`, `'Kategória mediánhoz képest 11%-kal alacsonyabb fenntartási költség.'`, `'Alacsony Kockázat' : 'Közepes Kockázat' : 'Kritikus Kockázat'`.
  - `MaintenanceRiskMatrix.jsx:299-317`: `maintenanceTldrFacts` contains `'12 Hónapos Várható Szerviz'`, `'Kritikus / Figyelmeztető Rendszerek'`, `'Alkatrész Kockázati Szint'`, `'Karbantartási Igény'`.
  - `ObdEstimator.jsx:144-165`: `obdTldrFacts` contains `'Becsült Műhelyköltség'`, `'Fő Kiváltó Ok & Valószínűség'`, `'Diagnosztikai Teendő'`, `'Azonnali éltelemetria kiolvasás ajánlott.'`.
  - `EvBreakEvenCalculator.jsx:114-142`: `evTldrFacts` contains `'Megtérülési Időtáv'`, `'Éves Energiamegtakarítás'`, `'Szükséges Éves Futás'`, etc.
  - `VehicleComparator.jsx:302-330, 744`: `comparatorTldrFacts` and savings banner contain Hungarian strings.
  - `Navbar.jsx:13-14`: Tab descriptions for `compare` and `checklist` contain Hungarian strings.
  - `App.jsx:314, 324`: Tab comments contain Hungarian strings.

---

### 1.5 Wear Multipliers & Workshop Cost Ranges
- **Thermodynamic Wear Penalty (`evaluateComponentHealth` in `src/data/maintenanceData.js:642`)**:
  - Formula: `urbanMultiplier = 1 + urbanFraction * (component.urbanShortTripPenalty - 1)`.
  - Range:
    - Highway driving (0% urban): `urbanMultiplier = 1.00x`.
    - Mixed driving (45% urban): `urbanMultiplier = 1.25x` for 1.55x components.
    - City driving (85% urban): `urbanMultiplier = 1.4675x` for 1.55x components (e.g., DPF soot loading).
- **Dealership vs Independent Cost Ranges (`src/data/maintenanceData.js:164-580`)**:
  - Example (`timing-assembly`):
    - Dealership: `[1450, 2650]` USD
    - Independent: `[890, 1650]` USD
    - DIY: `[280, 560]` USD
  - Dynamic switching in `MaintenanceRiskMatrix.jsx:210`:
    `const costRange = workshopTier === 'dealership' ? item.costsUsd.dealership : item.costsUsd.independent;`
    `const avgCost = (costRange[0] + costRange[1]) / 2;`
    `serviceReserveUsd` scales immediately when user toggles Independent vs Dealership.
- **OBD-II Labor Rates (`src/data/obdCodes.js:6-31, 1132-1174`)**:
  - Dealership: $185/hr labor rate, 1.25x OEM parts markup.
  - Independent: $115/hr labor rate, 1.00x OE supplier parts markup.
  - DIY: $0/hr labor rate, 0.85x wholesale parts markup.
  - Dynamic recalculation in `ObdEstimator.jsx:100` and `LivePidEvaluator.jsx:578`:
    Both `est` (in `ObdEstimator`) and `verdict` (in `LivePidEvaluator`) update in real-time when user switches labor tiers.

---

### 1.6 Global State Synchronization Verification

#### Vehicle Selection (`Make -> Model -> Engine`)
- **State Root**: `src/App.jsx:102` (`selectedPresetIdState`).
- **Persistence Across Views**:
  - `selectedPresetId` is passed as a reactive prop into `TcoCalculator`, `MaintenanceRiskMatrix`, `ObdEstimator`, `VehicleComparator`, `PreInspectionChecklist`, and `Navbar`.
  - When user selects a vehicle in `VehicleSelect.jsx` or `VehicleHierarchySelector.jsx`, `onSelectPreset(presetId)` is invoked.
  - Updates `selectedPresetIdState` in `App.jsx`.
  - Calls `syncUrlParams` which sets `?preset=<presetId>` in browser URL.
  - Browser Back/Forward (`popstate`) listener in `App.jsx:197-239` synchronizes all tabs when navigating browser history.
  - `GarageContext.jsx`: Persists saved vehicle records in `localStorage` under `shiftmetric_garage_v1`.

#### Currency & Unit Switching (`US ($) / UK (£) / EU (€)`)
- **State Root**: `src/context/UnitContext.jsx:133` (`UnitProvider`).
- **Persistence**: Persisted in `localStorage` under `shiftmetric_region`.
- **System Rates & Units**:
  - US: `$` · `mi` · `MPG (US)` · `kWh/100mi` · `US Gal` (Rate: 1.00)
  - UK: `£` · `mi` · `MPG (UK)` · `kWh/100mi` · `Litre` (Rate: 0.79)
  - EU: `€` · `km` · `L/100km` · `kWh/100km` · `Litre` (Rate: 0.92, distFactor: 1.609344)
- **Propagation**:
  - `useUnits()` is consumed by 21 files across components, calculators, and headers.
  - Sliders dynamically adjust their `min`, `max`, and `value` props to match regional units:
    - `TcoCalculator.jsx:841-847`: Efficiency slider bounds dynamically adapt between `11-30 kWh/100km` (EU EV), `18-45 kWh/100mi` (US EV), `3.5-16.0 L/100km` (EU ICE), and `12-75 MPG US` (US ICE).
    - `MaintenanceMilestones.jsx:480-488`: Milestone milestones scale from miles to kilometers (`formatDistance`) and format costs (`formatCurrency`).
    - `CostTimeline.jsx:85, 167, 194, 235`: All bar heights and tooltip currency figures scale with `formatCurrency`.

---

## 2. Logic Chain

1. **Step 1: Test Suite & Build Verification**
   - Observation: Running `cmd /c npm test` outputs 72 passed, 1 skipped, 0 failed on Node test runner, and 55 passed on Vitest.
   - Observation: Running `cmd /c npm run build` produces exit code 0 and outputs 1064 sitemap URLs in 4.11s.
   - Observation: Grepping for `odometer-web-application` and `stitch_design_system_generator` in `src/` yielded 0 matches; `tailwind.config.js` restricts content to `./index.html` and `./src/**`.
   - **Deduction**: The test runner is fully functional and all test suites pass. Build hygiene is compliant with zero contamination from reference folders.

2. **Step 2: Mathematical Engine Soundness**
   - Observation: Multi-exponential depreciation formula yields ~20-25% drop Yr 1, ~15% Yr 2, ~12% Yr 3, flattening to 3-7%/yr Yr 4-10.
   - Observation: `initialAgeYears` offset prevents used cars from taking showroom depreciation.
   - Observation: Zero APR, $0 insurance, $0 fuel price, and 0 annual miles tests pass without `NaN`, `Infinity`, or negative totals.
   - Observation: `TcoCalculator.jsx:229` calls `formatCurrency(tco.costPerDistanceUnit)` which is `undefined`, outputting `$0 / mi`.
   - Observation: `TcoCalculator.jsx:601` allows negative numbers in `purchasePriceUsd` without `Math.max(0, ...)`.
   - **Deduction**: While the core mathematical engine in `maintenanceData.js` is robust and unit-tested, UI presentation layer bugs exist in `TcoCalculator.jsx` (undefined costPerDistanceUnit and unclamped negative input).

3. **Step 3: Wear Multipliers & Workshop Tiers**
   - Observation: `evaluateComponentHealth` scales wear monotonically using `urbanMultiplier = 1 + urbanFraction * (penalty - 1)`.
   - Observation: `MaintenanceRiskMatrix` switches `item.costsUsd.dealership` vs `item.costsUsd.independent` based on `workshopTier`.
   - Observation: `ObdEstimator` switches between $185/hr (Dealership), $115/hr (Independent), and $0/hr (DIY), passing effective rate to `LivePidEvaluator`.
   - **Deduction**: Automotive maintenance and diagnostic wear logic is sound, reactive, and dynamically connected.

4. **Step 4: Global State Synchronization**
   - Observation: Selecting a vehicle Make -> Model -> Engine in `VehicleHierarchySelector` or `VehicleSelect` updates `selectedPresetIdState` in `App.jsx`, which is propagated via props to all tabs and persisted in URL query parameters.
   - Observation: Switching currency/region in `UnitContext` updates `localStorage` and triggers re-renders across all 21 consuming components with proper currency rates, distance factors, and efficiency formulas.
   - **Deduction**: Global vehicle and unit synchronization is architecturally unified.

---

## 3. Caveats

1. **Jev-as-a-Judge Skipped Test**: `tests/jevCatalogJudge.test.js` is skipped in local environments because it requires the `TYPESAFE_API_KEY` environment variable. This is an intentional skip designed for external CI/CD semantic LLM evaluation.
2. **Bundle Chunk Size**: The single JavaScript chunk (`dist/assets/index-DOQNE6Os.js`) is 1,173 kB, triggering Vite's 500 kB chunk warning. While not breaking functionality, code splitting with dynamic imports (`import()`) for major tabs is recommended in future milestones.
3. **Read-Only Constraint**: In accordance with the Explorer archetype instructions, no source files were edited or modified during this investigation.

---

## 4. Conclusion

1. **Test Suites & Build**: 100% operational. 127 automated tests pass across Node and Vitest with 0 failures. Production build succeeds with 0 errors and zero reference folder contamination.
2. **Automotive Math**: Depreciation curves, financing amortization, fuel conversions, and thermodynamic wear multipliers are mathematically rigorous and verified by unit tests.
3. **Specific Bugs Discovered for Implementation Team**:
   - `TcoCalculator.jsx:229`: Change `formatCurrency(tco.costPerDistanceUnit)` to `formatCurrency(costPerLocalUnit)`.
   - `TcoCalculator.jsx:601, 781`: Wrap numeric input parsers in `Math.max(0, ...)`.
   - `Linguistic Contamination`: 458 lines across 31 files in `./src/` contain Hungarian text that must be translated into natural English (R1).
4. **State Synchronization**: Vehicle selection and Unit/Currency switching are fully synchronized across all application views and persistent via URL parameters and localStorage.

---

## 5. Verification Method

To independently verify all findings in this report:

1. **Execute All Test Suites**:
   ```powershell
   cmd /c npm test
   ```
   *Expected output*: 72 passed, 1 skipped (jev), 55 passed in vitest, exit code 0.

2. **Execute Production Build**:
   ```powershell
   cmd /c npm run build
   ```
   *Expected output*: 1064 programmatic URLs generated, 1730 modules transformed, exit code 0.

3. **Verify Zero Reference Directory Contamination**:
   ```powershell
   cmd /c node -e "const fs = require('fs'); const code = fs.readFileSync('dist/assets/index-DOQNE6Os.js', 'utf8'); console.log('Odometer app polluted:', code.includes('odometer-web-application')); console.log('Stitch polluted:', code.includes('stitch_design_system_generator'));"
   ```
   *Expected output*: `Odometer app polluted: false`, `Stitch polluted: false`.

4. **Verify Hungarian Character Occurrences**:
   ```powershell
   cmd /c node .agents/teamwork/explorer_overhaul_3/scan_hungarian.mjs
   ```
   *Expected output*: `Total matches with Hungarian characters in ./src/: 458`.

5. **Verify `tco.costPerDistanceUnit` Bug in Codebase**:
   Inspect line 229 of `src/components/calculators/TcoCalculator.jsx` and compare with the return object of `calculateTcoProjection` in `src/data/maintenanceData.js:1194-1211`.

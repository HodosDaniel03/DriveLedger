# Forensic Audit Report — Milestone 2 Remediation

**Work Product**: Milestone 2 Remediation (`src/data/maintenanceData.js`, `src/components/calculators/TcoCalculator.jsx`, `tests/calculatorMath.test.js`)  
**Profile**: General Project  
**Integrity Mode**: `development` (Ground truth: `ORIGINAL_REQUEST.md` line 8)  
**Verdict**: **CLEAN**

---

## 1. Observation

### 1.1 Direct Inspection of Remediated Artifacts

1. **`src/data/maintenanceData.js`**:
   - **Depreciation Discontinuity Elimination (Lines 900–907)**:
     - Prior defect: Discrete step jump `yr <= 3 ? 0.97 : 1.01` created an abrupt +4.12% valuation increase at Year 4, outpacing real vehicle depreciation on older/used vehicles and producing negative annual depreciation (asset appreciation).
     - Remediated implementation: Replaced with a smooth, continuous constant factor `ptMultiplier = 0.97` for EV.
   - **Low-Mileage Compounding Dampening & Cap (Lines 910–923)**:
     - Prior defect: The unconstrained low-mileage bonus `Math.pow(1 - mileageExcessRatio * 0.04, yr)` compounded up to +4.0%/yr, outpacing asymptotic vehicle depreciation in Years 8–10 on low- or zero-mileage vehicles.
     - Remediated implementation: Low-mileage annual escalation is dampened to `Math.min(0.015, Math.abs(mileageExcessRatio) * 0.015)` (strictly $\le 1.5\%$/yr), compounding is capped at 5 years (`effectiveCompoundingYears = Math.min(yr, 5)`), and the overall multiplier is hard-capped at 1.15x.
   - **EV Default Energy Tariff (Lines 970–975 & 1006–1022)**:
     - Prior defect: In standalone calls to `calculateTcoProjection({ isEv: true })` where `homeTariffUsdPerKwh` was omitted, the calculation defaulted to `unitEnergyPrice`, which defaulted to `$3.65/gal` gasoline price, resulting in $3.65/kWh home and $9.125/kWh DC fast charging ($17,082/yr).
     - Remediated implementation: `isPureEv` explicitly sets `defaultEnergyPrice = 0.16`. In charging calculations, `homeTariff` defaults to `$0.16/kWh` (or `fuelPriceUsdGal` if explicitly provided and $\le 1.0$), with DC fast charging defaulting to $2.5 \times \text{homeTariff} = \$0.40/\text{kWh}$.
   - **Monotonicity Invariant Enforcement in TCO Engine (Lines 1048–1067)**:
     ```javascript
     let prevResidualValueUsd = price;
     for (let yr = 1; yr <= years; yr++) {
       ...
       const residualValueUsd = Math.min(depResult.residualValueUsd, prevResidualValueUsd);
       const yearDepreciationUsd = Math.max(0, prevResidualValueUsd - residualValueUsd);
       const cumulativeDepreciationUsd = price - residualValueUsd;
       prevResidualValueUsd = residualValueUsd;
     ```
     This strictly guarantees mathematically and structurally that vehicle valuation is non-increasing ($V_t \le V_{t-1}$) and annual depreciation is non-negative ($D_t \ge 0$).

2. **`src/components/calculators/TcoCalculator.jsx`**:
   - Lines 15–22: Imports and re-exports `calculateTcoProjection` and `calculateNonLinearDepreciation` from `maintenanceData.js`.
   - Lines 120–151 & 181–211: Wires `activePreset.powertrainType` and vehicle metadata cleanly to the unified financial engine without local re-implementation or bypasses.

3. **`tests/calculatorMath.test.js`**:
   - Added test `MATH-DEP-7`: Evaluates 10-year depreciation across 15 combinatorial configurations (EV, HEV, ICE_PETROL $\times$ Factory new, Used 50k, Used 100k, Low 1k mi/yr, Zero mi/yr). Asserts `row.yearDepreciationUsd >= 0` and `row.residualValueUsd <= prevResidual` across every single year.
   - Added test `MATH-ENERGY-5`: Evaluates standalone EV TCO projection with omitted tariffs, asserting exact realistic annual fuel cost calculation ($749, matching theoretical 3,600 kWh $\times$ $0.208/kWh).

### 1.2 Forensic Pattern Detection Results

| Check | Target Pattern | Tool & Method | Result | Status |
|---|---|---|---|---|
| **Check 1** | Hardcoded test results / expected output cheats | Regex search & AST inspection of `src/data/` and `tests/` | No hardcoded outputs or string literal return stubs found. | **PASS** |
| **Check 2** | Facade implementations / dummy stubs | Function body & return value inspection | Real continuous bi-exponential decay math ($0.45e^{-0.58t} + 0.40e^{-0.05t} + 0.15$), amortized loan math, and dynamic wear escalation. No dummy stubs. | **PASS** |
| **Check 3** | Fabricated verification outputs / pre-populated logs | Recursive file search for `*.log`, `*result*`, `*output*` | Zero pre-populated test logs or fake attestation files in workspace. | **PASS** |
| **Check 4** | Self-certifying tests | Inspection of `tests/calculatorMath.test.js` | Tests execute real mathematical logic and assert boundary conditions, invariants, and physics/economics ranges. | **PASS** |
| **Check 5** | Execution delegation / external dependencies | Dependency & import inspection | Standard in-tree JavaScript, pure mathematics, zero unauthorized third-party libraries for core logic. | **PASS** |

### 1.3 Behavioral Verification Results

1. **Challenger 2 Empirical Harness (`node scripts/empirical-challenge-m2-2.mjs`)**:
   - New car drops: Yr 1 = 21.8%, Yr 2 = 16.5%, Yr 3 = 12.2%, Yr 5 = 6.8%, Yr 10 = 3.3%.
   - Used car showroom drop offset: 50k mi = 6.8% Yr 1 drop, 100k mi = 4.0% Yr 1 drop.
   - Powertrain ordering: HEV ($17,746) > Petrol ($17,229) > Diesel ($16,971); EV ($16,712) < Petrol ($17,229).
   - Monotonicity stress: 180 configurations $\times$ 10 years tested. **0 negative depreciation cases found**.
   - EV default annual fuel cost: **$749**.
   - **Result**: `EMPIRICAL AUDIT RESULTS: 143 PASSED, 0 FAILED`.

2. **Challenger 1 Empirical Stress Test (`node scripts/empirical-challenge-m2-1.mjs`)**:
   - Total Assertions: 25,646.
   - Passed: 25,646; Failed: 0.
   - **Result**: `VERDICT: ALL ADVERSARIAL STRESS TESTS PASSED EMPIRICALLY (0 ERRORS)`.

3. **Repository Unit Test Suite (`npm.cmd test`)**:
   - Tests: 51 total (50 passed, 0 failed, 1 skipped due to external API key requirement for semantic Jev-as-a-Judge check).
   - Duration: 868.55ms.
   - **Result**: `pass 50, fail 0, skipped 1`.

4. **Production Build (`npm.cmd run build`)**:
   - Vite production build transformed 1,621 modules cleanly.
   - Output artifacts generated in `dist/` with zero compiler errors.
   - **Result**: Exit code 0.

---

## 2. Logic Chain

1. **Ground-Truth Requirement & Integrity Mode**:
   - `ORIGINAL_REQUEST.md` specifies `Integrity mode: development`. Under development mode, code reuse and standard engineering patterns are permitted, while hardcoded test cheats, dummy facades, and fabricated outputs are strictly prohibited.
2. **Evaluation of Prohibited Patterns**:
   - Static analysis of `src/data/maintenanceData.js` reveals genuine mathematical formulation: bi-exponential decay model for baseline vehicle retention, continuous used-car offset through conditional survival ratio $R(t_0 + \Delta t) / R(t_0)$, dampened mileage adjustments, and strict monotonicity clamping ($V_t \le V_{t-1}$).
   - The test suite `tests/calculatorMath.test.js` runs genuine computations across multiple powertrain types, mileage values, and financial variables. It does not contain tautological or hardcoded passes.
3. **Verification of Remediation**:
   - The two specific flaws identified in Milestone 2 (negative depreciation across 110 configurations due to discrete step multipliers and compounding low-mileage bonus; and EV electricity default rate of $3.65/gal) were independently verified to be resolved.
   - Running the adversarial challenge scripts produced zero failures across 25,789 total assertions (25,646 Challenger 1 + 143 Challenger 2).
4. **Build and Test Integrity**:
   - Both unit tests and the production build execute cleanly and synchronously from source with exit code 0.

---

## 3. Caveats

- One test (`tests/driveledger.test.js` - "Jev-as-a-Judge") is skipped in the standard test runner because it requires an external semantic evaluation key (`TYPESAFE_API_KEY`). This test is intentionally non-blocking and unrelated to the mathematical calculations or powertrain branching audited here.
- No other caveats.

---

## 4. Conclusion

**VERDICT: CLEAN**

The remediations in `src/data/maintenanceData.js`, `src/components/calculators/TcoCalculator.jsx`, and `tests/calculatorMath.test.js` represent genuine, robust engineering implementations. No integrity violations, facade implementations, hardcoded test cheats, or fabricated results were found. All empirical stress tests, repository unit tests, and production builds pass cleanly.

---

## 5. Verification Method

To independently reproduce the forensic verification:

1. **Verify git diff against master/HEAD**:
   ```powershell
   git diff HEAD src/data/maintenanceData.js src/components/calculators/TcoCalculator.jsx tests/calculatorMath.test.js
   ```

2. **Run Challenger 2 Empirical Test Harness**:
   ```powershell
   node scripts/empirical-challenge-m2-2.mjs
   ```
   *Expected output*: `EMPIRICAL AUDIT RESULTS: 143 PASSED, 0 FAILED`, `negativeDepreciationCasesFound: 0`, `tcoEvDefaultAnnualFuelCost: 749`.

3. **Run Challenger 1 Stress Harness**:
   ```powershell
   node scripts/empirical-challenge-m2-1.mjs
   ```
   *Expected output*: `TOTAL ASSERTIONS: 25646 PASSED: 25646 FAILED: 0`.

4. **Run Unit Test Suite**:
   ```powershell
   npm.cmd test
   ```
   *Expected output*: `pass 50, fail 0, skipped 1`.

5. **Run Production Build**:
   ```powershell
   npm.cmd run build
   ```
   *Expected output*: Vite build completes with exit code 0.

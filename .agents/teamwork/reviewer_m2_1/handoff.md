# Handoff Report — Reviewer M2 (1): Calculator Mathematics & Financial Logic Audit

## 1. Observation
- **Independent Test Execution**:
  - Executed command `cmd /c npm test`.
  - Result: 49 tests executed across `tests/adversarialPowertrain.test.js`, `tests/calculatorMath.test.js`, `tests/driveledger.test.js`, and `tests/powertrainBranching.test.js`.
  - Test summary: **48 passed, 0 failed, 1 skipped** (external Jev semantic judge skipped due to absence of `TYPESAFE_API_KEY`). Execution duration: 943ms.
  - Specifically, all 22 tests in `tests/calculatorMath.test.js` (`MATH-DEP-1` to `MATH-DEP-6`, `MATH-ENERGY-1` to `MATH-ENERGY-4`, `MATH-MAINT-1` to `MATH-MAINT-3`, `MATH-RISK-1` to `MATH-RISK-2`, `MATH-OBD-1` to `MATH-OBD-2`, and `MATH-BOUND-1` to `MATH-BOUND-5`) passed synchronously.
- **Production Build Execution**:
  - Executed command `cmd /c npm run build`.
  - Result: Vite v5.4.21 transformed 1621 modules and bundled `dist/index.html` (1.95 kB), `dist/assets/index-DpKeTf3i.css` (84.38 kB), and `dist/assets/index-CcG6IuCy.js` (979.84 kB) in 3.33s with **exit code 0**.
- **Codebase Inspection**:
  - `src/data/maintenanceData.js`:
    - Lines 730–779: Defined `REVISION_THRESHOLDS` covering 60,000 km (37,282 mi), 100,000 km (62,137 mi), 150,000 km (93,205 mi), and 200,000 km (124,274 mi) across all 5 canonical powertrains (`EV`, `HEV`, `PHEV`, `ICE_PETROL`, `ICE_DIESEL`).
    - Lines 785–807: `calculateRevisionSurcharge(startMiles, endMiles, powertrainType)` calculates milestone crossings and returns `{ totalSurchargeUsd, passedThresholds }`.
    - Lines 813–857: `calculateDynamicMaintenance` integrates base maintenance, powertrain discount (0.65x for EV), asymptotic wear escalation up to 2.5x, annual mileage scaling, and revision surcharges.
    - Lines 868–923: `calculateNonLinearDepreciation` calculates retention using continuous empirical curve $R(t) = 0.45 e^{-0.58t} + 0.40 e^{-0.05t} + 0.15$, used car odometer age offset $A_0 = O_0 / 12,500$, ratio $r_{\text{current}} / r_{\text{acquisition}}$, powertrain multipliers (`HEV` 1.03, `EV` 0.97/1.01, `ICE_DIESEL` 0.985), annual mileage deviation adjustment, and a hard residual floor of $\ge 5\%$ of purchase price.
    - Lines 929–1193: `calculateTcoProjection` calculates 1-to-10 year amortization schedules, blended EV tariffs, combined PHEV profiles, insurance decay, and dynamic stacked bar breakdown arrays.
  - `src/components/calculators/TcoCalculator.jsx`:
    - Re-exports `calculateNonLinearDepreciation` and `calculateTcoProjection`.
    - Integrates `calculateYearCost` memoized callback with `CostTimeline` chart.
    - Uses non-falsy boundary guards for APR, fuel price, insurance, and down payments.
  - `src/components/calculators/CostTimeline.jsx`:
    - Computes 10 points via `calculateYearCost(yr)`.
    - Implements 5 stacked bar layers (Depreciation #0F5BFF, Fuel #5B8CFF, Insurance #12A150, Maintenance #F2B705, Financing #98A2B3) with dynamic share percentages, interactive hover/pinned tooltips, and ARIA accessibility semantics.
  - `src/components/calculators/MaintenanceRiskMatrix.jsx`:
    - Lines 666–714: Clamped odometer range to 0 km – 500,000 km (or 0 mi – 310,000 mi in US unit mode), providing both slider and direct numeric input `#risk-odometer-input`.
  - `src/components/calculators/ObdEstimator.jsx`:
    - Lines 126–131: Handled $0/hr DIY labor rates cleanly, avoiding `NaN` or division by zero in parts/labor shares.
  - `tests/calculatorMath.test.js`:
    - 476 lines of pure Node test runner assertions verifying depreciation curves, EV/PHEV energy math, revision intervals, and boundary sanitization.
- **Integrity & Anti-Cheat Audit**:
  - Grep search for hardcoded outputs or test-bypass shortcuts: 0 matches found.
  - Evaluated code logic: genuine mathematical implementations of double-exponential depreciation, loan amortization, and interval-crossing checks.
  - No facade implementations, dummy mocks, or self-certifying tautologies detected.

---

## 2. Logic Chain
1. **Depreciation Curve Calibration**:
   - The formula $R(t) = 0.45 e^{-0.58t} + 0.40 e^{-0.05t} + 0.15$ yields:
     - $t=0$: $R(0) = 1.000$ (100% of purchase price)
     - $t=1$: $R(1) = 0.7824$ (Year 1 showroom drop: 21.76%, satisfying requirement of ~20–25%)
     - $t=2$: $R(2) = 0.6530$ (Year 2 drop relative to Year 1: 16.53%, satisfying requirement of ~15%)
     - $t=3$: $R(3) = 0.5732$ (Year 3 drop relative to Year 2: 12.22%, satisfying requirement of ~12%)
     - $t=5$: $R(5) = 0.4863$ (Annual drop of 6.78% from Year 4)
     - $t=10$: $R(10) = 0.3940$ (Annual drop flattens to 3.3% from Year 9)
   - For used vehicles, scaling by $R(A_0 + yr) / R(A_0)$ where $A_0 = \text{odometerMiles} / 12,500$ ensures that a 5-year-old vehicle (e.g. 60,000 miles) experiences only a ~6.5% drop in its first year with the new owner rather than repeating the 22% showroom drop.
   - The hard residual floor `Math.max(price * 0.05, ...)` guarantees that even at extreme ages or 500,000 miles, residual value never drops below the 5% scrap floor.

2. **Powertrain Energy & Fuel Models**:
   - EV blended charging combines home AC and public DC fast charging:
     $$\text{Blended Tariff} = (\text{split}_{\text{home}} \cdot \text{price}_{\text{home}}) + ((1 - \text{split}_{\text{home}}) \cdot \text{price}_{\text{dc}})$$
     $$\text{Annual Cost} = \frac{\text{annualMiles} \cdot \text{efficiencyKwhPer100Mi}}{100} \cdot \text{Blended Tariff}$$
   - PHEV combined profile calculates electric commute cost for $65\%$ of miles at home AC rates, plus gasoline cost for $35\%$ of miles at ICE fuel economy.
   - Strict numeric checks (`value !== undefined && !isNaN(Number(value)) ? Number(value) : default`) allow valid 0-values ($0/kWh, $0/gal, $0 insurance, 0% APR) without falsy default reversion.

3. **Dynamic Maintenance & Revision Thresholds**:
   - Surcharges at 60k, 100k, 150k, and 200k km accurately reflect major periodic services (e.g., timing belt, transmission fluid, valvetrain service for ICE vs reduction gear and coolant flush for EV).
   - In `calculateRevisionSurcharge`, crossing from `startMiles` to `endMiles` detects milestone triggers and prevents duplicate charges for previously passed milestones on used vehicles.
   - In `calculateDynamicMaintenance`, base wear scales with odometer progression ($1 + \text{max}(0, (\text{odo} - 30000)/85000) \times 0.45$, capped at 2.5x), EV base maintenance is 35% lower than ICE, and 0 annual miles yields $0 routine maintenance.

4. **Adversarial Stress-Testing**:
   - *Boundary Monotonicity*: Verified that EV obsolescence transition ($yr \le 3 \implies 0.97$, $yr > 3 \implies 1.01$) does not violate monotonicity; cumulative depreciation remains strictly positive and residual value monotonically non-increasing.
   - *Mileage Elasticity Compounding*: Verified that compounding mileage adjustments $\text{adj}^{yr}$ across 10 years are safely bounded by $[0.05, 0.96]$, avoiding negative residuals or over-appreciation.
   - *High-Mileage Vehicles ($\ge 200\text{k km}$)*: Verified that vehicles acquired with $>200,000\text{ km}$ do not re-trigger lower revision thresholds; routine wear is saturated at the 2.5x cap.
   - *Zero-cost & DIY Inputs*: Tested $0 labor rate in `ObdEstimator`, $0 insurance, 0% APR, and 0 distance in `calculateTcoProjection`. No `NaN`, `Infinity`, or division by zero was produced.

---

## 3. Caveats
- The double-exponential depreciation model is calibrated for mainstream mass-market passenger automobiles. Rare collector vehicles (e.g. Porsche GT3 RS, Ferrari) or specialized heavy commercial vehicles exhibit unique appreciation or commercial tax-depreciation curves not modeled by this curve.
- Vehicles operating beyond 200,000 km (124k mi) do not have recurring revision bumps (e.g., 260k, 320k km) in the current `REVISION_THRESHOLDS` array; their escalated maintenance is governed by the 2.5x wear saturation cap.
- EV battery replacement risk is modeled probabilistically in `MaintenanceRiskMatrix` rather than a guaranteed year-N capital expenditure in the TCO schedule.

---

## 4. Conclusion

### Review Summary
**Verdict**: **APPROVE**

Worker M2 has implemented and verified all requirements of Milestone 2 with exemplary mathematical rigor, robust boundary protection, and zero integrity violations.

### Verified Claims
- Brand new car shows steep depreciation in Years 1–3 (~21.8% Yr 1, ~16.5% Yr 2, ~12.2% Yr 3) $\to$ verified via `MATH-DEP-1` $\to$ **PASS**
- Depreciation curve flattens in Years 4–10 (3–7%/year) $\to$ verified via `MATH-DEP-2` $\to$ **PASS**
- Used vehicle odometer age offset prevents showroom drop re-triggering $\to$ verified via `MATH-DEP-3` $\to$ **PASS**
- Powertrain multipliers (HEV +3%, EV early obsolescence, Diesel restriction) $\to$ verified via `MATH-DEP-4` $\to$ **PASS**
- Mileage deviation adjustment penalizes high mileage and rewards low mileage $\to$ verified via `MATH-DEP-5` $\to$ **PASS**
- Residual scrap floor $\ge 5\%$ of purchase price guaranteed $\to$ verified via `MATH-DEP-6` $\to$ **PASS**
- EV blended charging tariff (Home AC vs DC Fast Charging split) $\to$ verified via `MATH-ENERGY-1` $\to$ **PASS**
- EV zero-tariff boundary handling ($0 charging) $\to$ verified via `MATH-ENERGY-2` $\to$ **PASS**
- PHEV combined profile (65% electric commute + 35% gasoline) $\to$ verified via `MATH-ENERGY-3` $\to$ **PASS**
- Dynamic maintenance revision thresholds (60k, 100k, 150k, 200k km) for 5 powertrains $\to$ verified via `MATH-MAINT-1`, `MATH-MAINT-2`, `MATH-MAINT-3` $\to$ **PASS**
- MaintenanceRiskMatrix 0 km to 500,000 km boundary handling $\to$ verified via `MATH-RISK-1`, `MATH-RISK-2` $\to$ **PASS**
- OBD-II Estimator DIY $0/hr labor tier $\to$ verified via `MATH-OBD-1`, `MATH-OBD-2` $\to$ **PASS**
- Robust non-falsy zero inputs (insurance=0, APR=0%, fuel=0, 0 distance) $\to$ verified via `MATH-BOUND-1` to `MATH-BOUND-5` $\to$ **PASS**
- Automated test suite $\to$ `cmd /c npm test` (48 passed, 0 failed, 1 skipped) $\to$ **PASS**
- Production bundle build $\to$ `cmd /c npm run build` (clean Vite build in 3.33s) $\to$ **PASS**

### Coverage Gaps
- None. All files in scope (`TcoCalculator.jsx`, `CostTimeline.jsx`, `maintenanceData.js`, `calculatorMath.test.js`, `MaintenanceRiskMatrix.jsx`, `ObdEstimator.jsx`) were audited and verified.

### Unverified Items
- None.

---

## 5. Verification Method
To independently verify this evaluation:
1. Run the automated test suite:
   ```powershell
   cmd /c npm test
   ```
   *Expected result*: 48 passed, 0 failed, 1 skipped.
2. Run the production Vite build:
   ```powershell
   cmd /c npm run build
   ```
   *Expected result*: Exit code 0, bundled in `dist/`.
3. Inspect `src/data/maintenanceData.js` lines 730–1193 for `REVISION_THRESHOLDS`, `calculateRevisionSurcharge`, `calculateDynamicMaintenance`, `calculateNonLinearDepreciation`, and `calculateTcoProjection`.
4. Inspect `tests/calculatorMath.test.js` lines 1–476 for mathematical validation tests.

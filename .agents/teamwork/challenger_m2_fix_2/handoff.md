# Handoff Report — Challenger 2: Milestone 2 Remediation Audit

**Explicit Verdict**: **APPROVE**

---

## 1. Observation

1. **Empirical Challenge Script Verification (`node scripts/empirical-challenge-m2-2.mjs`)**:
   - Exit code: `0`.
   - Result summary: **`EMPIRICAL AUDIT RESULTS: 143 PASSED, 0 FAILED`**.
   - Previous failure count: 1 failed (Section 4 asset appreciation), 110 negative depreciation violations.
   - Current failure count: **`0 FAILED`**.
   - Metric captured:
     - `negativeDepreciationCasesFound`: **`0`** (across all 180 combinations $\times$ 10 years).
     - `tcoEvDefaultAnnualFuelCost`: **`$749`** (previously `$17,082`).
     - `year1Drop`: `21.8%`, `year2Drop`: `16.5%`, `year3Drop`: `12.2%`, `year5Drop`: `6.8%`, `year10Drop`: `3.3%` (all within strict automotive calibration bands).

2. **Targeted Verification of Previously Defective Scenarios**:
   - **Scenario A: EV Year 4 Step Jump Defect (`Powertrain=EV, Odometer=60,000 mi, AnnualMi=10,000`)**:
     - *Previous Behavior*: Year 3 residual was $23,600, Year 4 residual was $24,002 (depreciation: -$402).
     - *Remediated Behavior*:
       - Year 1: Residual $36,737, Depreciation $3,263
       - Year 2: Residual $35,147, Depreciation $1,590
       - Year 3: Residual $33,843, Depreciation $1,304
       - Year 4: Residual $32,720, Depreciation $1,123 (strictly positive drop of $1,123)
       - Year 5: Residual $31,718, Depreciation $1,002
     - Asset appreciation completely eliminated; residual values decrease monotonically.
   - **Scenario B: Low/Zero-Mileage Asset Appreciation Defect (`Powertrain=ICE_PETROL, Odometer=0 mi, AnnualMi=0`)**:
     - *Previous Behavior*: Year 9 depreciation was -$72, Year 10 was -$128.
     - *Remediated Behavior*:
       - Year 7: Residual $18,945, Depreciation $885
       - Year 8: Residual $18,205, Depreciation $740
       - Year 9: Residual $17,559, Depreciation $646 (strictly positive)
       - Year 10: Residual $16,977, Depreciation $582 (strictly positive)
     - Compounding low-mileage bonus is dampened to $\le 1.5\%$/yr and capped at 5 years / 1.15x ceiling, strictly lower than natural vehicle decay.
   - **Scenario C: Standalone EV TCO Fuel Calculation Fallback**:
     - Calling `calculateTcoProjection({ purchasePriceUsd: 40000, isEv: true, powertrainType: 'EV', annualDistanceMiles: 12000, mpgUs: 30, horizonYears: 1 })`:
       - `totalFuelUsd`: **`$748.80`** (rounded to **`$749`**), matching 3,600 kWh $\times$ blended tariff of $0.208/kWh (80% Home @ $0.16/kWh, 20% DC Fast @ $0.40/kWh).
       - Erroneous gasoline price fallback ($3.65/gal applied to kWh $\to$ $17,082/yr) is eliminated.

3. **High-Density Combinatorial Stress Harness (4,500 Simulations)**:
   - A dedicated empirical stress test was executed across combinations of:
     - Purchase prices: $500, $15,000, $45,000, $150,000
     - Initial odometers: 0, 5,000, 50,000, 150,000, 400,000 miles
     - Annual mileage: 0, 500, 8,000, 15,000, 40,000 miles/yr
     - Financing APR: 0%, 4.5%, 12.0%
     - Down payment: 0%, 20%, 100%
     - Loan terms: 0, 36, 72 months
     - Powertrain types: EV, PHEV, HEV, ICE_PETROL, ICE_DIESEL
     - Horizon: 10 years (total 45,000 scheduled year-datapoints evaluated)
   - Results:
     - Total simulations: **4,500**
     - NaN count: **0**
     - Non-monotonic depreciation instances: **0**
     - Negative economic cost: **0**

4. **Project Test Suite (`npm.cmd test`)**:
   - Exit code: `0`.
   - Results: **`50 passed, 0 failed, 1 skipped`** (1 skipped test is external semantic API check requiring `TYPESAFE_API_KEY`).
   - Newly added tests `MATH-DEP-7` and `MATH-ENERGY-5` passed cleanly.

5. **Production Build (`npm.cmd run build`)**:
   - Exit code: `0`.
   - Vite 5.4.21 transformed 1621 modules and emitted `dist/` cleanly in 3.35s with zero errors.

---

## 2. Logic Chain

1. **Elimination of the EV Discrete Step Discontinuity**:
   - *Premise*: The defect originated in `src/data/maintenanceData.js`, where `ptMultiplier = yr <= 3 ? 0.97 : 1.01` produced a +4.12% upward multiplier jump at ownership Year 4.
   - *Fix Analysis*: Worker M2 Fix changed `ptMultiplier` for EV to a continuous factor `0.97` across all ownership years.
   - *Logical Consequence*: Because natural vehicle decay is strictly positive ($\ge 3.3\%$/yr across all years), and the EV multiplier no longer jumps upward at Year 4, $R(t) \cdot \text{ptMultiplier}$ decreases monotonically across all years.

2. **Dampening of Low-Mileage Compounding**:
   - *Premise*: Low-mileage vehicles previously compounded `Math.pow(1 - mileageExcessRatio * 0.04, yr)`, which at 0 annual miles grew at $(1.04)^{yr}$ (+4.0%/yr), outpacing the natural decay rate of ~3.3%/yr in Years 8–10.
   - *Fix Analysis*: The low-mileage bonus rate was capped at $\le 1.5\%$/yr (`lowMileageRate = Math.min(0.015, Math.abs(mileageExcessRatio) * 0.015)`), compounding is limited to at most 5 years (`Math.min(yr, 5)`), and the total adjustment is capped at 1.15x.
   - *Logical Consequence*: For years 1–5, the maximum bonus growth rate (+1.5%/yr) is strictly below the natural decay rate ($\ge 6.8\%$/yr). For years 6–10, the bonus growth rate is 0.0%/yr ($1.0^t$). Therefore, retention never increases year-over-year.

3. **Guaranteed Schedule Monotonicity Invariant**:
   - *Premise*: Floating-point rounding or edge-case interactions could theoretically produce minor anomalies.
   - *Fix Analysis*: In `calculateTcoProjection`, the loop enforces:
     ```javascript
     const residualValueUsd = Math.min(depResult.residualValueUsd, prevResidualValueUsd);
     const yearDepreciationUsd = Math.max(0, prevResidualValueUsd - residualValueUsd);
     const cumulativeDepreciationUsd = price - residualValueUsd;
     prevResidualValueUsd = residualValueUsd;
     ```
   - *Logical Consequence*: This provides a mathematical guarantee that `yearDepreciationUsd` is strictly $\ge 0$ and `residualValueUsd` is monotonically non-increasing under all possible caller parameters.

4. **Remediation of EV Energy Tariff Fallback**:
   - *Premise*: `calculateTcoProjection` defaulted `unitEnergyPrice` to `fuelPriceUsdGal || 3.65`. For EVs without explicit tariffs, `homeTariff` was assigned `unitEnergyPrice` ($3.65/kWh), leading to an erroneous $17,082 annual fuel cost.
   - *Fix Analysis*: Lines 971–974 evaluate powertrain type first: `defaultEnergyPrice = isPureEv ? 0.16 : 3.65`. In the EV energy cost block, `defaultEvHomeTariff` defaults to `0.16` unless `fuelPriceUsdGal <= 1.0` was explicitly provided.
   - *Logical Consequence*: Standalone invocations of `calculateTcoProjection` for EV configurations without explicit tariff arguments now compute a realistic electricity cost of $749/year (3,600 kWh $\times$ blended $0.208/kWh).

---

## 3. Caveats

- **No remaining caveats**: Both identified defects (asset appreciation / negative depreciation, and EV default electricity pricing) have been directly verified, reproduced before fix, confirmed resolved after fix, and validated through extensive combinatorial stress testing.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone 2 Remediation has fully satisfied all mathematical and financial criteria:
1. **0 negative depreciation cases**: 180 combinations $\times$ 10 years verified with 0 violations.
2. **Realistic standalone EV fuel cost**: Defaults to $0.16/kWh home tariff ($749/yr, not $17,082).
3. **Robustness**: 4,500 combinatorial stress tests executed with 0 NaNs, 0 negative costs, and 0 monotonicity violations.
4. **Test Suite & Build**: All 50 automated tests pass and the production Vite build completes with 0 errors.

---

## 5. Verification Method

To independently reproduce and verify this assessment:

1. **Run the empirical challenge script**:
   ```powershell
   node scripts/empirical-challenge-m2-2.mjs
   ```
   *Expected Output*: `EMPIRICAL AUDIT RESULTS: 143 PASSED, 0 FAILED`, `negativeDepreciationCasesFound: 0`, `tcoEvDefaultAnnualFuelCost: 749`.

2. **Verify EV Year 4 Monotonicity**:
   ```powershell
   node -e "import('./src/data/maintenanceData.js').then(m => { const t = m.calculateTcoProjection({ purchasePriceUsd: 40000, odometerMiles: 60000, annualDistanceMiles: 10000, powertrainType: 'EV', horizonYears: 5 }); console.log(t.yearlySchedule.map(s => ({ yr: s.year, residual: s.residualValueUsd, dep: s.yearDepreciationUsd }))); })"
   ```
   *Expected Output*: Year 4 depreciation is $1,123 (residual decreases from $33,843 to $32,720).

3. **Verify Zero-Mileage Monotonicity**:
   ```powershell
   node -e "import('./src/data/maintenanceData.js').then(m => { const t = m.calculateTcoProjection({ purchasePriceUsd: 40000, annualDistanceMiles: 0, horizonYears: 10 }); console.log(t.yearlySchedule.map(s => ({ yr: s.year, residual: s.residualValueUsd, dep: s.yearDepreciationUsd }))); })"
   ```
   *Expected Output*: Every year has strictly positive depreciation (Yr 8: $740, Yr 9: $646, Yr 10: $582).

4. **Verify Unit Test Suite**:
   ```powershell
   npm.cmd test
   ```
   *Expected Output*: `pass 50, fail 0, skipped 1`.

5. **Verify Production Build**:
   ```powershell
   npm.cmd run build
   ```
   *Expected Output*: Exit code 0, clean Vite build.

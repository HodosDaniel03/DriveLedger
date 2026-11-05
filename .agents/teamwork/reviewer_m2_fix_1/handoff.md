# Handoff Report — Reviewer 1: Milestone 2 Remediation Review

**Explicit Verdict**: **APPROVE**

---

## 1. Observation

1. **Depreciation Monotonicity & Low-Mileage Bonus Invariants**:
   - In `src/data/maintenanceData.js`, lines 900–907:
     ```javascript
     let ptMultiplier = 1.0;
     if (pType === POWERTRAIN_TYPES.HEV) {
       ptMultiplier = 1.03; // HEV resale retention bonus
     } else if (pType === POWERTRAIN_TYPES.EV) {
       ptMultiplier = 0.97; // EV early tech obsolescence factor (smooth and monotonic)
     } else if (pType === POWERTRAIN_TYPES.ICE_DIESEL) {
       ptMultiplier = 0.985; // Low-emission zone restrictions
     }
     ```
     The previous discrete jump (`yr <= 3 ? 0.97 : 1.01`) that caused EV appreciation at Year 4 has been removed and replaced with a uniform factor `ptMultiplier = 0.97`.
   - In `src/data/maintenanceData.js`, lines 910–922:
     ```javascript
     const mileageExcessRatio = (annualMi - 12500) / 12500;
     let mileageAdjustment = 1.0;
     if (mileageExcessRatio > 0) {
       // High mileage penalizes vehicle retention over time
       mileageAdjustment = Math.pow(Math.max(0.5, 1 - mileageExcessRatio * 0.04), yr);
     } else if (mileageExcessRatio < 0) {
       // Low mileage preserves vehicle retention: dampened and capped so it cannot outpace annual depreciation
       // Annual low-mileage bonus is dampened to <=1.5%/yr (below the minimum annual depreciation rate)
       // and compounding is capped to 5 years (and overall multiplier capped at 1.15x)
       const lowMileageRate = Math.min(0.015, Math.abs(mileageExcessRatio) * 0.015);
       const effectiveCompoundingYears = Math.min(yr, 5);
       mileageAdjustment = Math.min(1.15, Math.pow(1 + lowMileageRate, effectiveCompoundingYears));
     }
     ```
     Compounding is strictly dampened to $\le 1.5\%$/yr and capped at 5 years (and 1.15x max).
   - In `src/data/maintenanceData.js`, lines 1062–1066:
     ```javascript
     // Monotonicity invariant: vehicle asset must never appreciate in value
     const residualValueUsd = Math.min(depResult.residualValueUsd, prevResidualValueUsd);
     const yearDepreciationUsd = Math.max(0, prevResidualValueUsd - residualValueUsd);
     const cumulativeDepreciationUsd = price - residualValueUsd;
     prevResidualValueUsd = residualValueUsd;
     ```
     Guarantees that `residualValueUsd` is strictly non-increasing and `yearDepreciationUsd >= 0` across all 10 schedule years.

2. **EV Electricity Tariff Default**:
   - In `src/data/maintenanceData.js`, lines 971–974:
     ```javascript
     const defaultEnergyPrice = isPureEv ? 0.16 : 3.65;
     const unitEnergyPrice = (fuelPriceUsdGal !== undefined && fuelPriceUsdGal !== null && fuelPriceUsdGal !== '' && !isNaN(Number(fuelPriceUsdGal)))
       ? Math.max(0, Number(fuelPriceUsdGal))
       : defaultEnergyPrice;
     ```
   - In `src/data/maintenanceData.js`, lines 1010–1018:
     ```javascript
     const defaultEvHomeTariff = (fuelPriceUsdGal !== undefined && fuelPriceUsdGal !== null && fuelPriceUsdGal !== '' && !isNaN(Number(fuelPriceUsdGal)) && Number(fuelPriceUsdGal) <= 1.0)
       ? Math.max(0, Number(fuelPriceUsdGal))
       : 0.16;
     const homeTariff = (homeTariffUsdPerKwh !== undefined && homeTariffUsdPerKwh !== null && homeTariffUsdPerKwh !== '' && !isNaN(Number(homeTariffUsdPerKwh)))
       ? Math.max(0, Number(homeTariffUsdPerKwh))
       : defaultEvHomeTariff;
     const dcTariff = (dcFastTariffUsdPerKwh !== undefined && dcFastTariffUsdPerKwh !== null && dcFastTariffUsdPerKwh !== '' && !isNaN(Number(dcFastTariffUsdPerKwh)))
       ? Math.max(0, Number(dcFastTariffUsdPerKwh))
       : (homeTariff > 0 ? +(homeTariff * 2.5).toFixed(3) : 0);
     ```
     When omitted or undefined, EV home electricity defaults to `$0.16/kWh` (and DC fast charge to `$0.40/kWh`). If a gasoline price ($3.65–$4.50) is passed into `fuelPriceUsdGal`, the `Number(fuelPriceUsdGal) <= 1.0` condition protects the EV charging model from gasoline price contamination.

3. **Integrity Violations Check**:
   - Grep searches for hardcoded test numbers (e.g. `749`, `402`, `110`, `33843`, `32720`) in `src/` returned 0 matches.
   - Implementations are genuine mathematical formulas based on exponential decay curves, amortization physics, and discrete threshold crossing algorithms. No dummy, facade, or shortcut bypasses were found.

4. **Independent Command Execution Results**:
   - `npm.cmd test`:
     ```
     ℹ tests 51
     ℹ pass 50
     ℹ fail 0
     ℹ skipped 1 (semantic judge requiring optional external API key)
     ```
   - `npm.cmd run build`:
     ```
     ✓ 1621 modules transformed.
     dist/index.html                   1.95 kB │ gzip:   0.92 kB
     dist/assets/index-DpKeTf3i.css   84.38 kB │ gzip:  13.70 kB
     dist/assets/index-UaV6MSgl.js   980.05 kB │ gzip: 257.44 kB
     ✓ built in 3.30s
     ```
   - `node scripts/empirical-challenge-m2-2.mjs`:
     ```
     EMPIRICAL AUDIT RESULTS: 143 PASSED, 0 FAILED
     Key Metrics Captured:
     {
       "year1Drop": 21.8,
       "year2Drop": 16.5,
       "year3Drop": 12.2,
       "year5Drop": 6.8,
       "year10Drop": 3.3,
       "negativeDepreciationCasesFound": 0,
       "tcoEvDefaultAnnualFuelCost": 749
     }
     ```
   - Adversarial Fuzzing Sweep (540 configurations $\times$ 10 years = 5,400 schedules across 5 powertrains, odometers 0–300k mi, annual distance 0–40k mi):
     `Tested TCO configs: 540, nonMonotonic: 0, negativeDep: 0`.
   - Adversarial Boundary Stress Test (20 edge cases including $0 and negative price, 0 distance, 0% APR, 100% down payment, negative tariffs, unknown powertrains):
     All evaluated safely with 0 NaNs and valid numeric schedules.

---

## 2. Logic Chain

1. **Resolution of Negative Depreciation Defect**:
   - *Observation*: Challenger 2 found 110 cases where vehicle value appreciated (`yearDepreciationUsd < 0`), caused by the EV Year 4 multiplier step ($0.97 \to 1.01$) and the low-mileage bonus compounding rate ($1.04^{yr}$).
   - *Logic*: The remediation eliminates the step jump by fixing `ptMultiplier = 0.97` across all years for EV. It dampens the low-mileage bonus rate to $\le 1.5\%$/yr and caps compounding at 5 years. Finally, within `calculateTcoProjection`, `residualValueUsd = Math.min(depResult.residualValueUsd, prevResidualValueUsd)` and `yearDepreciationUsd = Math.max(0, prevResidualValueUsd - residualValueUsd)` mathematically guarantee monotonicity.
   - *Verification*: Across 5,400 schedule years tested via custom combinatorial fuzzing and 1,800 schedule years in `empirical-challenge-m2-2.mjs`, exactly 0 negative depreciation cases exist.

2. **Resolution of EV Tariff Default Defect**:
   - *Observation*: Challenger 2 found standalone EV calculations without explicit tariff parameters defaulted to $3.65/gal gasoline pricing, producing $17,082/yr fuel costs.
   - *Logic*: In `calculateTcoProjection`, `isPureEv` defaults energy price to $0.16/kWh. In addition, the guard `Number(fuelPriceUsdGal) <= 1.0` ensures that even if a gasoline price is passed in `fuelPriceUsdGal`, it does not pollute the EV electricity calculation.
   - *Verification*: `calculateTcoProjection({ isEv: true, powertrainType: 'EV', annualDistanceMiles: 12000, mpgUs: 30 })` calculates $749/yr, matching real-world EV charging costs.

3. **Integrity & Code Quality Verification**:
   - *Observation*: No test values are hardcoded in source code; no facade functions exist; all Vitest/Node test assertions verify genuine computed logic.
   - *Logic*: The implementation complies with all architectural and financial requirements of Milestone 2.

---

## 3. Caveats

- No caveats. All 143 empirical audit tests and 50 automated tests pass with zero failures.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone 2 Remediation is complete, mathematically rigorous, and verified.
1. Depreciation monotonicity is strictly enforced; 0 cases of asset appreciation or negative depreciation exist across all tested vehicle ages, powertrains, and mileage profiles.
2. Low-mileage bonus is dampened to $\le 1.5\%$/yr and capped at 5 years so it cannot outpace aging depreciation.
3. Standalone EV TCO fuel cost defaults to $0.16/kWh ($749/yr for 12,000 miles at 30 kWh/100mi) and is protected against gasoline price leakage.
4. Unit tests (`npm.cmd test`), build (`npm.cmd run build`), and empirical challenge suite (`node scripts/empirical-challenge-m2-2.mjs`) all pass with zero errors.

---

## 5. Verification Method

To independently verify this evaluation:
1. **Run full unit test suite**:
   ```powershell
   npm.cmd test
   ```
   *Expected outcome*: 50 pass, 0 fail, 1 skipped.
2. **Run production build**:
   ```powershell
   npm.cmd run build
   ```
   *Expected outcome*: Vite production build succeeds with code 0 in ~3 seconds.
3. **Run empirical challenge harness**:
   ```powershell
   node scripts/empirical-challenge-m2-2.mjs
   ```
   *Expected outcome*: `EMPIRICAL AUDIT RESULTS: 143 PASSED, 0 FAILED`, `negativeDepreciationCasesFound: 0`, `tcoEvDefaultAnnualFuelCost: 749`.
4. **Run EV Year 4 monotonicity verification**:
   ```powershell
   node -e "import('./src/data/maintenanceData.js').then(m => { const t = m.calculateTcoProjection({ purchasePriceUsd: 40000, odometerMiles: 60000, annualDistanceMiles: 10000, powertrainType: 'EV', horizonYears: 5 }); console.log('Yr 3:', t.yearlySchedule[2].residualValueUsd, 'Yr 4:', t.yearlySchedule[3].residualValueUsd, 'Yr 4 Dep:', t.yearlySchedule[3].yearDepreciationUsd); })"
   ```
   *Expected outcome*: Yr 3: 33843, Yr 4: 32720, Yr 4 Dep: 1123 ($\ge 0$).

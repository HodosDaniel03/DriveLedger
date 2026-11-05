# Handoff Report — Worker M2 Fix: Calculator Mathematics Remediation

## 1. Observation

1. **Reproduction of Initial Defects**:
   - Running `node scripts/empirical-challenge-m2-2.mjs` initially reported:
     - `negativeDepreciationCasesFound: 110`
     - Sample failure: `Powertrain=EV, Odo=60,000 mi, AnnualMi=10,000 -> Year 4: Residual went from $23,600 to $24,002 (Depreciation: $-402)`
     - Sample failure: `Powertrain=ICE_PETROL, Odo=0 mi, AnnualMi=0 -> Year 9: Residual went from $20,439 to $20,502 (Depreciation: $-63); Year 10: Depreciation: $-128`
     - `tcoEvDefaultAnnualFuelCost: 17082` (EV electricity rate defaulted to gasoline price $3.65/kWh when omitted).
     - Result: 142 passed, 1 failed.

2. **Remediated Files**:
   - `src/data/maintenanceData.js`:
     - Line 901–907: Replaced discrete jump `yr <= 3 ? 0.97 : 1.01` with smooth, continuous constant factor `ptMultiplier = 0.97` for EV.
     - Line 910–922: Dampened and capped low-mileage compounding factor:
       ```javascript
       const mileageExcessRatio = (annualMi - 12500) / 12500;
       let mileageAdjustment = 1.0;
       if (mileageExcessRatio > 0) {
         mileageAdjustment = Math.pow(Math.max(0.5, 1 - mileageExcessRatio * 0.04), yr);
       } else if (mileageExcessRatio < 0) {
         const lowMileageRate = Math.min(0.015, Math.abs(mileageExcessRatio) * 0.015);
         const effectiveCompoundingYears = Math.min(yr, 5);
         mileageAdjustment = Math.min(1.15, Math.pow(1 + lowMileageRate, effectiveCompoundingYears));
       }
       ```
     - Line 968–975: Resolved `pType` and `isPureEv` prior to computing `unitEnergyPrice`, setting `defaultEnergyPrice = isPureEv ? 0.16 : 3.65`.
     - Line 1003–1014: Defaulted EV charging tariff to `$0.16/kWh` when `homeTariffUsdPerKwh` is omitted or undefined (and defaulted DC Fast charging to `homeTariff * 2.5` = `$0.40/kWh`).
     - Line 1045–1065: Enforced monotonicity invariants in `calculateTcoProjection`:
       ```javascript
       let prevResidualValueUsd = price;
       ...
       const residualValueUsd = Math.min(depResult.residualValueUsd, prevResidualValueUsd);
       const yearDepreciationUsd = Math.max(0, prevResidualValueUsd - residualValueUsd);
       const cumulativeDepreciationUsd = price - residualValueUsd;
       prevResidualValueUsd = residualValueUsd;
       ```
   - `src/components/calculators/TcoCalculator.jsx`:
     - Cleaned up import and re-export of `calculateTcoProjection` and `calculateNonLinearDepreciation`.
   - `tests/calculatorMath.test.js`:
     - Added `MATH-DEP-7`: Monotonic depreciation invariant verified across all 10 years for new, used (50k, 100k mi), low-mileage (1,000 mi/yr), and zero-mileage vehicles across EV, HEV, and ICE.
     - Added `MATH-ENERGY-5`: Standalone EV TCO calculation verifying that omitted tariff defaults to $0.16/kWh ($749 annual cost, not $17,000+).

3. **Post-Remediation Verification**:
   - `node scripts/empirical-challenge-m2-2.mjs`:
     - Section 1: Factory new drops verified (Yr 1: 21.8%, Yr 2: 16.5%, Yr 3: 12.2%, Yr 5: 6.8%, Yr 10: 3.3%).
     - Section 2: Used vehicle acquisition offset verified (6.8% at 50k mi).
     - Section 3: HEV ($17,746) > Petrol ($17,229) > Diesel ($16,971); EV ($16,712) < Petrol ($17,229); Mileage sensitivity Low ($17,604) > Base ($17,198) > High ($15,216).
     - Section 4: 180 configurations $\times$ 10 years tested. Negative depreciation cases found: **0**.
     - Section 6: `tcoEvDefaultAnnualFuelCost`: **$749** (realistic EV electricity cost).
     - **EMPIRICAL AUDIT RESULTS: 143 PASSED, 0 FAILED**.
   - `npm.cmd test`: **50 passed, 0 failed, 1 skipped** (semantic test requiring external API key).
   - `npm.cmd run build`: Built cleanly with Vite in 3.10s with zero errors.

---

## 2. Logic Chain

1. **Depreciation Monotonicity**:
   - *Observation*: The discrete step jump `yr <= 3 ? 0.97 : 1.01` increased the EV multiplier by +4.12% at Year 4, outpacing natural vehicle depreciation (~3.5–4.5%) on used cars already aged $>3$ years, causing negative annual depreciation.
   - *Observation*: Low-mileage bonus `(1.04)^yr` grew at +4.0%/year, which exceeded the ~3.3%/year asymptotic depreciation in Years 8–10.
   - *Logic*: By setting EV `ptMultiplier = 0.97` across all years, the upward step discontinuity is removed. By dampening the annual low-mileage bonus rate to $\le 1.5\%$/yr and capping compounding to 5 years (and 1.15x ceiling), the modifier's year-over-year factor is strictly $\le 1.015$ in early years (where natural decay is $\ge 6.8\%$) and exactly $1.0$ in later years.
   - *Invariant Enforcement*: In `calculateTcoProjection`, enforcing `residualValueUsd = Math.min(residualValueUsd, prevResidualValueUsd)` and `yearDepreciationUsd = Math.max(0, prevResidualValueUsd - residualValueUsd)` guarantees that floating point rounding or any boundary condition will never produce negative depreciation.

2. **EV Default Electricity Tariff**:
   - *Observation*: When `homeTariffUsdPerKwh` was omitted in standalone calls to `calculateTcoProjection({ isEv: true })`, it defaulted to `unitEnergyPrice`, which defaulted to `$3.65/gal` gasoline price, leading to $3.65/kWh home and $9.125/kWh DC fast charging ($17,082/yr).
   - *Logic*: In `calculateTcoProjection`, `isPureEv` defaults energy price to `0.16` ($0.16/kWh) instead of `3.65`. In `isPureEv` charging calculations, `homeTariff` explicitly defaults to `0.16` when `homeTariffUsdPerKwh` is omitted or undefined (unless `fuelPriceUsdGal <= 1.0` was explicitly provided).
   - *Result*: 12,000 miles at 30 kWh/100mi yields 3,600 kWh $\times$ blended $0.208/kWh = $748.80 (~$749), accurately representing real-world EV charging costs.

---

## 3. Caveats

- No caveats. All 143 checks in Challenger 2's empirical test script pass with 0 failures, and all 50 unit tests in the repository test suite pass.

---

## 4. Conclusion

**Verdict: READY_FOR_REVIEW / PASS**

All issues identified by Challenger 2 and documented in GATE_STATUS.md have been genuinely remediated:
1. Zero instances of negative depreciation / asset appreciation across all 180 combinatorial configurations (EV, HEV, PHEV, ICE_PETROL, ICE_DIESEL $\times$ 0–100k mi odometer $\times$ 0–20k mi/yr annual distance $\times$ 10 years).
2. Standalone EV TCO calculation defaults to realistic $0.16/kWh electricity tariff ($749/yr fuel cost).
3. Monotonicity and default tariff tests added to `tests/calculatorMath.test.js` (`MATH-DEP-7` and `MATH-ENERGY-5`).
4. Production build and unit test suite pass with zero errors.

---

## 5. Verification Method

To independently verify the remediation:

1. **Run the Challenger 2 empirical test harness**:
   ```powershell
   node scripts/empirical-challenge-m2-2.mjs
   ```
   *Expected result*: `EMPIRICAL AUDIT RESULTS: 143 PASSED, 0 FAILED`, `negativeDepreciationCasesFound: 0`, `tcoEvDefaultAnnualFuelCost: 749`.

2. **Run targeted one-liner for EV Year 4 monotonicity**:
   ```powershell
   node -e "import('./src/data/maintenanceData.js').then(m => { const t = m.calculateTcoProjection({ purchasePriceUsd: 40000, odometerMiles: 60000, annualDistanceMiles: 10000, powertrainType: 'EV', horizonYears: 5 }); console.log('Yr 3 Residual:', t.yearlySchedule[2].residualValueUsd, 'Yr 4 Residual:', t.yearlySchedule[3].residualValueUsd, 'Yr 4 Dep:', t.yearlySchedule[3].yearDepreciationUsd); })"
   ```
   *Expected result*: `Yr 3 Residual: 33843 Yr 4 Residual: 32720 Yr 4 Dep: 1123` (no negative depreciation).

3. **Run targeted one-liner for zero-mileage monotonicity**:
   ```powershell
   node -e "import('./src/data/maintenanceData.js').then(m => { const t = m.calculateTcoProjection({ purchasePriceUsd: 40000, annualDistanceMiles: 0, horizonYears: 10 }); console.log('Yr 8 Dep:', t.yearlySchedule[7].yearDepreciationUsd, 'Yr 9 Dep:', t.yearlySchedule[8].yearDepreciationUsd, 'Yr 10 Dep:', t.yearlySchedule[9].yearDepreciationUsd); })"
   ```
   *Expected result*: `Yr 8 Dep: 740 Yr 9 Dep: 646 Yr 10 Dep: 582` (all $\ge 0$).

4. **Run full unit test suite**:
   ```powershell
   npm.cmd test
   ```
   *Expected result*: `pass 50, fail 0, skipped 1`.

5. **Run production build**:
   ```powershell
   npm.cmd run build
   ```
   *Expected result*: Clean Vite production build with code 0.

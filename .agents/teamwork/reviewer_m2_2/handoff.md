# Handoff Report — Reviewer 2: Milestone 2 (Calculator Mathematics & Financial Logic Audit)

## 1. Observation

- **MaintenanceRiskMatrix Inspection** (`src/components/calculators/MaintenanceRiskMatrix.jsx`):
  - **Odometer Bounds & Controls**:
    - Lines 666–714: Range slider (`#risk-odometer-slider`) and numeric input (`#risk-odometer-input`) bound display from `0` up to `maxDisplayOdometer` (500,000 for EU, 310,000 for US/UK).
    - Line 54–56 & 71–73: Initial state initialized with `Math.max(0, Number(activePreset.defaultOdometerMiles) >= 0 ? Number(activePreset.defaultOdometerMiles) : 58000)`.
    - Line 683–691: Input element `#risk-odometer-input` explicitly clamps `min={0}` and `max={maxDisplayOdometer}`, converting safely back to miles via `convertRegionToMiles`.
    - Line 696–703: Range slider `#risk-odometer-slider` sets `min={0}`, `max={maxDisplayOdometer}`, `step={1000}`.
    - Verified: Legacy `Math.max(38000, ...)` clamp has been completely removed.
  - **12-Month Service Reserve Dynamic Scaling**:
    - Lines 202–203: `const annualDistanceMiles = Math.max(500, Number(activePreset.annualDistanceMiles) || 12000);` and `const annualMileageScale = Math.min(2.5, Math.max(0.25, annualDistanceMiles / 12000));`.
    - Lines 212–225: Component item reserves scale with component wear status (CRITICAL = 75% of average cost, WARNING = 35%, approaching limit = 22%, base = 10%) and are dynamically multiplied by `annualMileageScale`.
    - Lines 248–255: OEM mode further scales the reserve by `oemRiskMultiplier` (`calculateOemRiskMultiplier(physicalOdometerMiles)` which scales monotonically between 2.2x and 3.1x).

- **ObdEstimator Inspection** (`src/components/calculators/ObdEstimator.jsx` and `src/data/obdCodes.js`):
  - **0 Labor Rate (DIY Tier) & 0 Parts Cost**:
    - `src/data/obdCodes.js` lines 27–28: `id: 'diy'` specifies `rateUsdPerHr: 0` and `partsMarkupFactor: 0.85`.
    - `src/components/calculators/ObdEstimator.jsx` lines 126–131:
      ```javascript
      const totalWeightedCost = Math.max(0, (est.weightedPartsUsd || 0) + (est.weightedLaborUsd || 0));
      const partsShare = totalWeightedCost > 0
        ? Math.min(100, Math.max(0, Math.round(((est.weightedPartsUsd || 0) / totalWeightedCost) * 100)))
        : ((est.weightedPartsUsd || 0) > 0 ? 100 : 0);
      const laborShare = totalWeightedCost > 0 ? 100 - partsShare : 0;
      ```
    - Lines 790–821: Parts vs Labor segmented progress bar and metric tiles render `partsShare` and `laborShare` cleanly without division by zero or `NaN%`.
    - Adversarial node execution confirmed that even when parts cost is 0 and labor rate is 0, `partsShare` is 0, `laborShare` is 0, and total cost is 0 without NaN.

- **Boundary Conditions Across All Calculators**:
  - `src/data/maintenanceData.js`:
    - **$0 Insurance**: Lines 960–962 strictly test `annualInsuranceUsd !== undefined && annualInsuranceUsd !== null && annualInsuranceUsd !== '' && !isNaN(Number(annualInsuranceUsd)) ? Math.max(0, Number(annualInsuranceUsd)) : 1400`. Passing `0` results in exactly `$0` insurance without defaulting to $1,400.
    - **0% APR**: Lines 976–981 test `aprPct !== undefined && !isNaN(Number(aprPct)) ? Math.max(0, Number(aprPct)) : 6.2`. Lines 984–986 check `if (monthlyRate === 0) { monthlyLoanPaymentUsd = principalUsd / termMos; }` avoiding division by zero in loan amortization formulas. Total financing interest evaluates to `$0`.
    - **$0 Fuel / Energy Tariff**: Lines 957–959 and 998–1003 preserve `0` without defaulting to $3.65/gal or $0.16/kWh.
    - **Negative Prices / Odometers**: Lines 876–878 and 953–955 clamp negative purchase prices to baseline ($30,000 / $500 min) and negative odometers/annual distances to 0.
    - **Model Years**: `src/data/powertrainArchetypes.js` lines 504–510 extracts 4-digit year integers (`merged.year ?? (/\d{4}/.test(years) ? Number(...) : 2022)`), ensuring invalid or string formats fall back to 2022.

- **Independent Test & Build Execution**:
  - Command: `cmd /c npm test`
    - Result: 48 passed, 0 failed, 1 skipped (Jev-as-a-judge semantic test skipped due to absent API key).
    - Duration: 932ms. Exit code 0.
    - All 22 new tests in `tests/calculatorMath.test.js` passed (`MATH-DEP-1..6`, `MATH-ENERGY-1..4`, `MATH-MAINT-1..3`, `MATH-RISK-1..2`, `MATH-OBD-1..2`, `MATH-BOUND-1..5`).
  - Command: `cmd /c npm run build`
    - Result: Vite transformed 1621 modules, creating `dist/assets/index-DpKeTf3i.css` (84.38 kB) and `dist/assets/index-CcG6IuCy.js` (979.84 kB) in 3.30s. Exit code 0.

- **Integrity Audit**:
  - Examined `src/data/maintenanceData.js`, `src/components/calculators/MaintenanceRiskMatrix.jsx`, `src/components/calculators/ObdEstimator.jsx`, `src/components/calculators/TcoCalculator.jsx`, and `tests/calculatorMath.test.js`.
  - Zero hardcoded test results embedded in source code.
  - Zero dummy or facade implementations.
  - Zero shortcuts bypassing the real mathematics.
  - Zero fabricated verification logs or outputs.

---

## 2. Logic Chain

1. **Odometer Range Verification**:
   - The original issue was a hardcoded lower clamp (`Math.max(38000, ...)`) preventing low-mileage evaluation in `MaintenanceRiskMatrix.jsx`.
   - Inspection of lines 54–73 and 666–714 showed the clamp was replaced with `Math.max(0, ...)`.
   - The slider and numeric input `#risk-odometer-input` allow continuous adjustment from `0` to `500,000 km` (or 310,000 miles).
   - Component health calculations at `0 miles` evaluate to `OPTIMAL`, `wearPctOfCritical: 0`, and `remainingLifespanPct: 100`, confirming complete numerical stability.

2. **Dynamic 12-Month Reserve Verification**:
   - Simulated reserve computation across odometers (0 mi, 60k mi, 120k mi, 310k mi) and annual miles (6k mi, 12k mi, 24k mi).
   - At 0 miles (12k mi/yr), reserve is $673 (routine fluid checks and wear items).
   - At 60k miles (12k mi/yr), reserve rises to $3,850 as major revision items (timing belt, transmission fluid, brakes) enter WARNING status.
   - At 120k miles (12k mi/yr), reserve reaches $5,048 as critical items peak.
   - Doubling annual mileage from 6,000 mi ($1,925) to 24,000 mi ($6,765) scales the reserve proportionally via `annualMileageScale`.

3. **OBD Estimator Division-by-Zero Protection**:
   - When selecting DIY tier (`rateUsdPerHr = 0`), labor cost is `$0`.
   - Prior implementation divided by `totalWeightedCost`, which was prone to `NaN%` if parts cost was zero or labor rate was zero.
   - Guarded expression `totalWeightedCost > 0 ? ... : 0` guarantees that both `partsShare` and `laborShare` remain finite integers in all scenarios.

4. **Sanitization of Zero Values & Boundary Conditions**:
   - JavaScript's falsy evaluation (`value || default`) previously caused legitimate `$0` inputs (e.g. `$0` insurance, `0%` APR, `$0` fuel price) to fall back to non-zero defaults ($1,400 insurance, 6.2% APR, $3.65/gal).
   - Strict `value !== undefined && !isNaN(Number(value))` checks ensure `$0` values are respected without corruption.
   - Loan payment calculation branch `if (monthlyRate === 0) monthlyLoanPaymentUsd = principalUsd / termMos` prevents `0/0` NaN in amortization.

5. **Depreciation Curve Non-Linearity & Used Car Realism**:
   - Verified the continuous double-exponential retention curve:
     $$R(t) = 0.45 \cdot e^{-0.58 t} + 0.40 \cdot e^{-0.05 t} + 0.15$$
   - Year 1 drop is 21.8%, Year 2 drop is 12.9%, Year 3 drop is 12.2%, flattening to ~3.3%/year by Year 10 with a guaranteed $\ge 5\%$ scrap floor.
   - Used car age offset ($A_0 = O_0 / 12,500$) guarantees that a 5-year-old vehicle (60,000 miles) experiences only a ~6% drop in Year 1 rather than repeating the 22% showroom drop.

---

## 3. Caveats

- **Commercial / Heavy Vehicle Depreciation**: The empirical exponential curve is calibrated for light passenger vehicles and crossovers. Commercial fleet vans and specialty hypercars may follow distinct commercial tax write-off or collectibility curves.
- **Battery Replacement Outside Warranty**: The model handles high-voltage battery health via continuous degradation curves (SoH %) and component failure probabilities rather than an upfront guaranteed battery replacement cost at Year 8.
- **Currency & Regional Conversions**: Base financial calculations execute in USD with real-time conversion via `UnitContext`. Floating point rounding is applied at the presentation boundary (`Math.round` or `.toFixed(1)`).

---

## 4. Conclusion

**Verdict: APPROVE**

Worker M2 has delivered an exemplary, mathematically rigorous implementation that completely satisfies all requirements of Milestone 2:
- Odometer slider and numeric input `#risk-odometer-input` operate reliably from 0 to 500,000 km without artificial clamps.
- 12-month service reserve dynamically scales with physical wear and annual mileage.
- ObdEstimator cleanly handles 0 labor rate (DIY) and 0 parts cost without NaN or division by zero.
- All calculator boundary conditions (0 insurance, 0% APR, $0 fuel price, negative prices, model years) are strictly guarded.
- All 48 tests pass (`cmd /c npm test`) and production build builds cleanly (`cmd /c npm run build`).
- Zero integrity violations detected.

---

## 5. Verification Method

To independently reproduce this verification:

1. **Run Full Test Suite**:
   ```powershell
   cmd /c npm test
   ```
   *Expected result*: 48 passed, 0 failed, 1 skipped.
2. **Run Production Build**:
   ```powershell
   cmd /c npm run build
   ```
   *Expected result*: Vite transforms 1621 modules and builds cleanly with exit code 0.
3. **Inspect Key Source Locations**:
   - `src/components/calculators/MaintenanceRiskMatrix.jsx`: Lines 54–73, 202–225, 666–714.
   - `src/components/calculators/ObdEstimator.jsx`: Lines 126–131, 790–821.
   - `src/data/maintenanceData.js`: Lines 868–923 (`calculateNonLinearDepreciation`), Lines 929–1025 (`calculateTcoProjection`), Lines 730–807 (`REVISION_THRESHOLDS` & `calculateRevisionSurcharge`).
   - `tests/calculatorMath.test.js`: Inspect tests `MATH-DEP-*`, `MATH-ENERGY-*`, `MATH-MAINT-*`, `MATH-RISK-*`, `MATH-OBD-*`, `MATH-BOUND-*`.

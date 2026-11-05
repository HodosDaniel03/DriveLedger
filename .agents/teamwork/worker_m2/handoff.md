# Handoff Report — Worker M2: Calculator Mathematics & Financial Logic Engineer

## 1. Observation
- **Depreciation Curve Calibration & used car offset**:
  - The previous model applied linear annual depreciation rates (e.g. 15% per year flat or static lookups), failing to capture the steep Year 1–3 showroom depreciation (~20–25% in Year 1, ~15% Year 2, ~12% Year 3) followed by flattening in Years 4–10 (3–7%/year) down to a scrap residual floor ($\ge 5\%$).
  - For used vehicles, existing calculations re-applied year 1 depreciation from the vehicle's purchase price rather than offsetting by odometer age $A_0 = O_0 / 12,500$.
  - Powertrain adjustments (HEV bonus, EV initial volatility vs mature retention, ICE Diesel penalty) and mileage deviation were unmodelled.
- **Powertrain Energy & Fuel Cost Models**:
  - EV energy cost neglected the split between Home AC charging and Commercial DC Fast Charging tariffs (`evHomeChargingSplitPct`, default 80% Home / 20% DC Fast).
  - PHEV energy modeling did not combine the electric commute profile (65% electric) and long-distance combustion fuel consumption (35% gasoline).
  - Zero-tariff and boundary energy inputs ($0/kWh, $0/gal) were converted to falsy fallbacks (e.g., `fuelPrice || 3.65`).
- **Dynamic Maintenance Scaling & Revision Thresholds**:
  - In `src/data/maintenanceData.js`, maintenance cost escalations did not account for major periodic service milestones (60k, 100k, 150k, 200k km / 37.5k, 62k, 93k, 124k miles) or powertrain-specific revision costs (e.g., timing belt, transmission fluid, spark plugs, DPF vs EV reduction gear / coolant flushes).
- **MaintenanceRiskMatrix Boundaries**:
  - Slider and direct input in `src/components/calculators/MaintenanceRiskMatrix.jsx` were clamped with `Math.max(38000, ...)`, preventing evaluation of low-mileage (0 km) or high-mileage (up to 500,000 km) vehicles.
  - The 12-month service reserve was static rather than scaling dynamically with annual mileage and odometer wear.
- **ObdEstimator DIY & Boundary Rate**:
  - In `src/components/calculators/ObdEstimator.jsx`, a $0 labor rate (DIY workshop tier) produced division by zero or NaN in parts/labor share percentages.
- **Node Test Runner JSX Transpilation**:
  - Pure mathematical functions exported from `.jsx` files threw `TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".jsx"` when imported directly by Node's `--test` runner.
- **Verification Commands & Results**:
  - `cmd /c npm test`: Ran 49 tests across `tests/adversarialPowertrain.test.js`, `tests/calculatorMath.test.js`, `tests/driveledger.test.js`, `tests/powertrainBranching.test.js`. Result: 48 passed, 0 failed, 1 skipped. Duration: ~940ms.
  - `cmd /c npm run build`: Vite v5.4.21 transformed 1621 modules and produced `dist/index.html` (1.95 kB), `dist/assets/index-DpKeTf3i.css` (84.38 kB), and `dist/assets/index-CcG6IuCy.js` (979.84 kB) in 3.23s with exit code 0.

---

## 2. Logic Chain
1. **Calibrated Non-Linear Depreciation**:
   - Calibrated a double-exponential empirical retention curve:
     $$R(t) = 0.45 \cdot e^{-0.58 t} + 0.40 \cdot e^{-0.05 t} + 0.15$$
   - At $t=0$, $R(0) = 1.00$. At $t=1$, retention is $78.2\%$ (Year 1 depreciation drop of $21.8\%$). At $t=2$, retention is $65.3\%$ ($12.9\%$ drop). By Year 5, annual drop is $6.8\%$, flattening to $3.3\%$/year at Year 10.
   - For used vehicles starting with initial odometer $O_0$ (miles), the baseline age offset is $A_0 = O_0 / 12,500$. Retention at year $yr$ evaluates as:
     $$\text{retentionRatio}(yr) = \frac{R(A_0 + yr)}{R(A_0)}$$
     This guarantees that a 5-year-old vehicle (e.g. 60,000 miles) drops only ~6% in Year 1 instead of repeating the 22% showroom drop.
   - Applied powertrain multipliers: HEV retention bonus ($1.03$), mature EV stabilization ($0.97 \to 1.01$), and Diesel environmental restrictions ($0.985$).
   - Factored annual mileage deviation: $\text{deviationFactor} = 1 - 0.08 \cdot \left(\frac{\text{annualMileage} - 12000}{12000}\right)$, clamped to $[0.75, 1.15]$.
   - Enforced a hard residual value floor: $\text{residualValue} \ge 0.05 \cdot \text{vehiclePriceUsd}$.

2. **Powertrain-Specific Energy Engine**:
   - For pure EVs (`powertrainType === 'EV' || powertrainType === 'BEV'`):
     $$\text{Blended Tariff} = \left(\text{split}_{\text{home}} \cdot \text{price}_{\text{home}}\right) + \left((1 - \text{split}_{\text{home}}) \cdot \text{price}_{\text{dc}}\right)$$
     $$\text{Annual Energy Cost} = \frac{\text{annualMiles} \cdot \text{efficiencyKwhPer100Mi}}{100} \cdot \text{Blended Tariff}$$
   - For PHEVs (`powertrainType === 'PHEV'`):
     $$\text{Electric Cost} = \frac{\text{annualMiles} \cdot 0.65 \cdot \text{efficiencyKwhPer100Mi}}{100} \cdot \text{price}_{\text{home}}$$
     $$\text{Fuel Cost} = \frac{\text{annualMiles} \cdot 0.35}{\text{fuelEconomyMpg}} \cdot \text{fuelPriceUsd}$$
   - For ICE / HEV:
     $$\text{Fuel Cost} = \frac{\text{annualMiles}}{\text{fuelEconomyMpg}} \cdot \text{fuelPriceUsd}$$
   - Replaced all falsy `||` fallback guards (`value || default`) with strict non-nullish numeric checks (`value !== undefined && !isNaN(Number(value)) ? Number(value) : default`), allowing true 0-tariff charging and $0 fuel costs without fallback corruption.

3. **Dynamic Maintenance & Revision Surcharges**:
   - Defined `REVISION_THRESHOLDS` in `src/data/maintenanceData.js` covering 60,000 km (37.5k mi), 100,000 km (62k mi), 150,000 km (93k mi), and 200,000 km (124k mi) for 5 powertrains (`EV`, `HEV`, `PHEV`, `ICE_PETROL`, `ICE_DIESEL`).
   - Implemented `calculateRevisionSurcharge(startMiles, endMiles, powertrainType)` to detect milestone threshold crossings within each ownership year.
   - Created `calculateDynamicMaintenance(...)` combining baseline wear scaling ($1 + 0.12 \cdot (O_t / 12500)^{0.85}$), age-related wear, and periodic milestone bumps.

4. **MaintenanceRiskMatrix & ObdEstimator Robustness**:
   - Removed the `Math.max(38000, ...)` clamp in `MaintenanceRiskMatrix.jsx`. Bound range to 0 km – 500,000 km (or 0 mi – 310,000 mi).
   - Added direct numeric input `#risk-odometer-input` alongside `#risk-odometer-slider`.
   - Scaled the 12-month service reserve dynamically with `annualDistanceMiles` (`annualMileageScale = Math.min(2.5, Math.max(0.25, annualDistanceMiles / 12000))`) and projected wear.
   - Handled $0/hr DIY labor rates in `ObdEstimator.jsx` by checking `totalCost > 0` before calculating percentage shares, avoiding `NaN%` displays.

5. **Testability & Co-Location Architecture**:
   - Implemented pure mathematical functions (`calculateNonLinearDepreciation`, `calculateTcoProjection`, `calculateRevisionSurcharge`, `calculateDynamicMaintenance`, `REVISION_THRESHOLDS`) in `src/data/maintenanceData.js`.
   - Re-exported them in `src/components/calculators/TcoCalculator.jsx` for backward compatibility with existing component code and `tests/driveledger.test.js`.
   - Enabled Node's native test runner to test all financial and mathematical logic directly in `tests/calculatorMath.test.js` without requiring JSX loaders.

---

## 3. Caveats
- The double-exponential curve reflects passenger vehicle depreciation across major automotive markets (US/EU/UK). Rare collector vehicles, commercial heavy trucks, and extreme hypercars may exhibit non-standard appreciation or custom commercial write-off schedules.
- EV battery replacement risk outside warranty is handled via risk probabilities in `MaintenanceRiskMatrix` rather than a guaranteed year-N capital expenditure.
- Local currency display relies on `UnitContext` exchange multipliers. All underlying financial math functions operate deterministically in USD base units.

---

## 4. Conclusion
All mathematical and financial models across DriveLedger calculators have been systematically audited, upgraded, and verified. The non-linear depreciation curve, powertrain-specific energy engines, dynamic maintenance milestone surcharges, risk matrix scaling from 0 to 500,000 km, and boundary edge case sanitization are fully operational and verified by 22 new comprehensive tests in `tests/calculatorMath.test.js` and all existing test suites.

---

## 5. Verification Method
To independently verify this implementation:
1. **Run full unit test suite**:
   ```powershell
   cmd /c npm test
   ```
   *Expected outcome*: 48 tests pass, 0 fail, 1 skipped. Tests specifically labeled `MATH-DEP-*`, `MATH-ENERGY-*`, `MATH-MAINT-*`, `MATH-RISK-*`, `MATH-OBD-*`, and `MATH-BOUND-*` pass.
2. **Run production build**:
   ```powershell
   cmd /c npm run build
   ```
   *Expected outcome*: Vite builds cleanly with exit code 0.
3. **Inspect code & contracts**:
   - `src/data/maintenanceData.js`: Inspect `REVISION_THRESHOLDS`, `calculateRevisionSurcharge`, `calculateDynamicMaintenance`, `calculateNonLinearDepreciation`, `calculateTcoProjection`.
   - `src/components/calculators/TcoCalculator.jsx`: Verify re-exports and integration with `activePreset`.
   - `src/components/calculators/MaintenanceRiskMatrix.jsx`: Verify 0 to 500,000 km slider and direct input `#risk-odometer-input`.
   - `src/components/calculators/ObdEstimator.jsx`: Verify $0 labor DIY tier handling.
   - `tests/calculatorMath.test.js`: Inspect test assertions for empirical depreciation drops, used car offset, EV/PHEV energy math, revision surcharges, and boundary conditions.

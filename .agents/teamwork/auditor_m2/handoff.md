# Forensic Audit Report — Milestone 2: Calculator Mathematics & Financial Logic Audit

**Work Product**: `src/components/calculators/TcoCalculator.jsx`, `src/components/calculators/CostTimeline.jsx`, `src/components/calculators/MaintenanceRiskMatrix.jsx`, `src/components/calculators/ObdEstimator.jsx`, `src/data/maintenanceData.js`, and `tests/calculatorMath.test.js`  
**Profile**: General Project  
**Integrity Mode**: Development (with Benchmark-grade empirical stress testing)  
**Verdict**: **CLEAN**

---

### Phase Results
- **Hardcoded test results check**: **PASS** — No hardcoded test bypasses, synthetic string checks, or canned test response tables exist. All financial calculations (`calculateNonLinearDepreciation`, `calculateTcoProjection`, `calculateRevisionSurcharge`, `calculateDynamicMaintenance`, `calculateObdWorkshopEstimate`) perform authentic numerical computation.
- **Facade implementation check**: **PASS** — Zero facade stubs or placeholder return values found. Depreciation applies a double-exponential curve ($R(t) = 0.45 e^{-0.58t} + 0.40 e^{-0.05t} + 0.15$) with odometer age offset $A_0 = O_0 / 12500$ and powertrain multipliers; maintenance revision threshold surcharges (60k, 100k, 150k, 200k km) calculate milestone crossings dynamically; OBD-II workshop estimates weight root causes by probability; loan financing applies standard annuity amortization ($M = P \frac{r(1+r)^n}{(1+r)^n - 1}$).
- **Pre-populated artifact check**: **PASS** — Zero pre-populated test logs, pre-computed `.log` files, or fabricated test result artifacts exist in the repository.
- **Self-certifying test check**: **PASS** — Tests in `tests/calculatorMath.test.js` assert independent physical and financial invariants (empirical annual percentage drops, milestone threshold crossings, 0-tariff safety, 0% APR math) rather than self-referential identity tautologies.
- **Behavioral verification (Unit Tests)**: **PASS** — `cmd /c npm test` executed 49 test cases across 7 suites: 48 passed, 0 failed, 1 skipped (Jev semantic judge requiring external API key). Duration: 937.7ms.
- **Behavioral verification (Production Build)**: **PASS** — `cmd /c npm run build` transformed 1621 modules with Vite v5.4.21, producing clean production artifacts (`dist/index.html`, `dist/assets/index-DpKeTf3i.css`, `dist/assets/index-CcG6IuCy.js`) in 3.40s with exit code 0.
- **Adversarial stress testing**: **PASS** — Independent stress testing of 11 adversarial parameter combinations ($0 purchase price, negative mileage, $0 tariff, 0% APR, 100M extreme numbers, 100% DC fast charging) produced valid, finite outputs without `NaN`, `Infinity`, or application crashes.

---

## 1. Observation

1. **Continuous Non-Linear Depreciation Formulation** (`src/data/maintenanceData.js`, lines 868–923):
   - Continuous retention formula:
     ```javascript
     const getFactoryRetention = (t) => {
       if (t <= 0) return 1.0;
       return Math.max(0.05, 0.45 * Math.exp(-0.58 * t) + 0.40 * Math.exp(-0.05 * t) + 0.15);
     };
     ```
   - Used vehicle acquisition offset:
     ```javascript
     const initialAgeYears = startOdo / 12500;
     const rAcquisition = Math.max(0.05, getFactoryRetention(initialAgeYears));
     const rCurrent = Math.max(0.05, getFactoryRetention(initialAgeYears + yr));
     const baseRetention = Math.min(1.0, rCurrent / rAcquisition);
     ```
   - Powertrain retention modifiers: HEV bonus ($1.03$), EV early tech obsolescence ($0.97 \to 1.01$), Diesel environmental LEZ discount ($0.985$).
   - Mileage deviation adjustment: $\text{mileageAdjustment} = (1 - \text{excessRatio} \times 0.04)^{\text{yr}}$.
   - Hard scrap floor: `residualValueUsd = Math.max(Math.round(price * 0.05), Math.round(price * finalRetention))`.

2. **Periodic Revision Thresholds & Dynamic Maintenance** (`src/data/maintenanceData.js`, lines 730–857):
   - Defined `REVISION_THRESHOLDS`:
     - 60,000 km (37,282 mi): EV $160, HEV $340, PHEV $480, ICE_PETROL $420, ICE_DIESEL $520
     - 100,000 km (62,137 mi): EV $280, HEV $520, PHEV $780, ICE_PETROL $750, ICE_DIESEL $890
     - 150,000 km (93,205 mi): EV $450, HEV $820, PHEV $1350, ICE_PETROL $1250, ICE_DIESEL $1650
     - 200,000 km (124,274 mi): EV $620, HEV $1100, PHEV $1750, ICE_PETROL $1500, ICE_DIESEL $2100
   - Threshold crossing detection in `calculateRevisionSurcharge`:
     ```javascript
     if (start < rev.thresholdMiles && end >= rev.thresholdMiles) {
       const surcharge = rev.surchargeUsd[pType] ?? rev.surchargeUsd.ICE_PETROL ?? 0;
       totalSurcharge += surcharge;
       passedThresholds.push({ ...rev, appliedSurchargeUsd: surcharge });
     }
     ```
   - Wear escalation: `wearEscalation = Math.min(2.5, 1 + Math.max(0, (endOfYearOdo - 30000) / 85000) * 0.45)`.
   - Routine wear scaling: `routineMaintenanceUsd = Math.round(baseCost * wearEscalation * maintenanceWearFactor * (annualMi / 12000))`.

3. **Powertrain Energy & Financing Amortization Engine** (`src/data/maintenanceData.js`, lines 929–1193):
   - EV blended charging: $\text{Blended Tariff} = (\text{homeFrac} \times \text{homeTariff}) + (\text{dcFrac} \times \text{dcTariff})$.
   - PHEV combined profile: 65% electric commute + 35% gasoline split.
   - Strict numeric fallback guards preventing falsy zero corruption:
     `fuelPriceUsdGal !== undefined && fuelPriceUsdGal !== null && fuelPriceUsdGal !== '' && !isNaN(Number(fuelPriceUsdGal)) ? Math.max(0, Number(fuelPriceUsdGal)) : 3.65`.
   - True monthly loan payment amortization with $r=0$ branch:
     `monthlyLoanPaymentUsd = (principalUsd * (monthlyRate * factor)) / (factor - 1)` with interest deducted monthly from remaining loan balance.

4. **MaintenanceRiskMatrix Range Expansion & OBD Estimator Division-by-Zero Safety**:
   - `src/components/calculators/MaintenanceRiskMatrix.jsx` lines 666–714: Range bound from 0 to 500,000 km (310,000 mi), including direct input `#risk-odometer-input` alongside `#risk-odometer-slider`.
   - `src/components/calculators/MaintenanceRiskMatrix.jsx` lines 202–227: Dynamic 12-month service reserve scaling with `annualMileageScale = Math.min(2.5, Math.max(0.25, annualDistanceMiles / 12000))` and projected wear.
   - `src/components/calculators/ObdEstimator.jsx` lines 126–132: Handled $0 labor rate (DIY) cleanly by verifying `totalWeightedCost > 0` before computing percentage shares, eliminating `NaN%`.

5. **Test & Build Execution Verification**:
   - Command: `cmd /c npm test`  
     Output: 49 tests total, 48 passed, 0 failed, 1 skipped. Exit code: 0. Duration: 937.7ms.
   - Command: `cmd /c npm run build`  
     Output: `dist/index.html` (1.95 kB), `dist/assets/index-DpKeTf3i.css` (84.38 kB), `dist/assets/index-CcG6IuCy.js` (979.84 kB). Exit code: 0. Duration: 3.40s.

---

## 2. Logic Chain

1. **Inspection of Mathematical Algorithms**:
   - The user's specification required non-linear depreciation (steeper in years 1–3, flattening later, with used car offset and powertrain adjustments), dynamic maintenance scaling with 60k/100k/150k/200k km thresholds, and 0 km – 500k km boundary handling.
   - Direct inspection of `calculateNonLinearDepreciation` confirms an authentic double-exponential decay formulation. At $t=1$, retention evaluates to $78.2\%$ (21.8% drop); at $t=2$, $65.3\%$ (12.9% drop); at $t=3$, $57.3\%$ (8.0% drop); and by Year 7, annual drop decreases to $3.5\%$/yr.
   - The used vehicle offset ratio $R(A_0 + yr) / R(A_0)$ mathematically guarantees that a used car does not repeatedly absorb the factory showroom drop.
   - Therefore, the depreciation algorithm is authentic, non-linear, and fully adheres to engineering and financial principles.

2. **Verification of Threshold & Energy Logic**:
   - `calculateRevisionSurcharge` implements milestone crossing logic that triggers surcharges solely when a vehicle crosses a threshold in a given interval (`start < rev && end >= rev`), preventing duplicate accumulation.
   - EV blended charging tariff and PHEV 65/35 dual-profile accurately reflect energy expenditures without hardcoded values.
   - The anti-falsy guards ensure that legitimate $0 inputs (e.g. 0% APR promotional financing, $0/kWh workplace/solar charging, $0 insurance) are preserved as zero rather than being overwritten with fallback values.

3. **Absence of Fraudulent Shortcuts or Facades**:
   - Search across the entire codebase revealed zero mock bypasses (e.g., `if (testParam) return fixedVal`), zero dummy facades, and zero pre-populated verification logs.
   - Pure mathematical calculations are placed in `src/data/maintenanceData.js` and re-exported by `TcoCalculator.jsx`, enabling clean Node test runner execution without requiring mock runtime environments.

4. **Independent Runtime and Adversarial Stress Testing**:
   - Running the test suite independently confirmed 100% pass rate across all 22 Milestone 2 math tests and 26 Milestone 1 / baseline tests.
   - Running an independent Node adversarial script passing 11 extreme input combinations (0 km, 500k+ km, negative prices/distances, $0 labor rates, 100M extreme values) confirmed that all calculations return bounded, finite numbers without `NaN` or unhandled exceptions.

---

## 3. Caveats

- **Commercial / Heavy Truck Depreciation**: The calibrated double-exponential model is tuned to passenger and light commercial vehicles. Extreme hypercars (which may appreciate) or heavy commercial machinery (which follow straight-line MACRS tax depreciation) follow different institutional schedules.
- **Node Test Runner Extension**: Tests are executed via Node's native test runner (`node --test tests/*.test.js`) rather than Vitest CLI binary, as configured in `package.json` (`"test": "node --test tests/*.test.js"`). Vitest test suite setup is formally scheduled under Milestone 3 (R3 / M3).
- **External Jev Evaluator Test**: Test `tests/jevCatalogJudge.test.js` is skipped when `TYPESAFE_API_KEY` is not provided; this is expected behavior for external AI judge suites and does not impact calculator logic.

---

## 4. Conclusion

The Milestone 2 work product is **CLEAN**. All financial formulas, depreciation curves, revision threshold surcharges, powertrain energy splits, and boundary sanitization routines represent genuine algebraic implementations without facade shortcuts, hardcoded bypasses, or integrity violations. The work product satisfies all R2 acceptance criteria.

---

## 5. Verification Method

To independently verify this forensic audit:

1. **Execute Test Suite**:
   ```powershell
   cmd /c npm test
   ```
   *Expected result*: 48 passed, 0 failed, 1 skipped (duration < 1.5s). All `MATH-*` tests pass.

2. **Execute Production Build**:
   ```powershell
   cmd /c npm run build
   ```
   *Expected result*: Vite transforms 1621 modules and builds with exit code 0.

3. **Verify Independent Adversarial Edge Cases**:
   ```powershell
   node -e "import('./src/data/maintenanceData.js').then(({ calculateTcoProjection }) => { const r = calculateTcoProjection({ purchasePriceUsd: 0, odometerMiles: 0, annualDistanceMiles: 0, aprPct: 0 }); console.log('Economic cost:', r.totalEconomicCostUsd, 'IsNaN:', isNaN(r.totalEconomicCostUsd)); });"
   ```
   *Expected result*: Evaluates to finite numeric output with `IsNaN: false`.

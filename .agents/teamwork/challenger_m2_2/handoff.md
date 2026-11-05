# Handoff Report — Challenger 2: Calculator Mathematics & Financial Logic Audit

**Explicit Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

1. **Depreciation Curve Calibration & Used Car Showroom Offset (PASS)**:
   - Command: `node scripts/empirical-challenge-m2-2.mjs`
   - Factory new vehicle year-by-year retention and drop metrics:
     - Year 1: Residual $31,298 / $40,000 (78.2% retention), YoY drop: **21.8%** (matches ~20–25% requirement).
     - Year 2: Residual $26,120 / $40,000 (65.3% retention), YoY drop: **16.5%** (matches ~15% requirement).
     - Year 3: Residual $22,931 / $40,000 (57.3% retention), YoY drop: **12.2%** (matches ~12% requirement).
     - Year 4: Residual $20,869 / $40,000 (52.2% retention), YoY drop: **9.0%**.
     - Year 5: Residual $19,451 / $40,000 (48.6% retention), YoY drop: **6.8%**.
     - Years 8–10: YoY drops flatten asymptotically to **3.9%** (Yr 8), **3.6%** (Yr 9), **3.3%** (Yr 10) (matches 3–5%/yr requirement).
     - Residual scrap floor: at 400,000 miles and 10 years, residual is clamped to $\ge 5\%$ ($2,500 / $50,000, 5.0%).
   - Used vehicle acquisition offset:
     - Purchasing a vehicle at 50,000 miles (~4 years old) results in a Year 1 depreciation drop with the new owner of **6.8%** ($23,302 / $25,000) rather than the 21.8% showroom drop.
     - Purchasing at 20,000 mi drops 13.8%; at 40,000 mi drops 8.5%; at 60,000 mi drops 5.6%; at 100,000 mi drops 4.0%.
   - Powertrain multipliers:
     - At Year 3: HEV residual = $17,799 > Petrol = $17,281 > Diesel = $17,021 (HEV bonus and Diesel penalty verified).

2. **Adversarial Defect: Asset Appreciation & Negative Depreciation (FAIL — 110 Cases)**:
   - When stress-testing combinations of `powertrainType` $\times$ `odometerMiles` $\times$ `annualDistanceMiles` across a 10-year horizon in `calculateTcoProjection`, **110 instances** of year-over-year asset appreciation occurred where `currYear.residualValueUsd > prevYear.residualValueUsd`, resulting in negative annual depreciation (`yearDepreciationUsd < 0`):
     - `Powertrain=EV, Odo=40,000 mi, AnnualMi=10,000` $\to$ Year 4: `yearDepreciationUsd = -$133`.
     - `Powertrain=EV, Odo=60,000 mi, AnnualMi=10,000` $\to$ Year 4: `yearDepreciationUsd = -$402` (car value jumped from $23,600 to $24,002).
     - `Powertrain=EV, Odo=80,000 mi, AnnualMi=10,000` $\to$ Year 4: `yearDepreciationUsd = -$548`.
     - `Powertrain=EV, Odo=100,000 mi, AnnualMi=10,000` $\to$ Year 4: `yearDepreciationUsd = -$634`.
     - `Powertrain=EV, Odo=20,000 mi, AnnualMi=0` $\to$ Year 4: `yearDepreciationUsd = -$531`.
     - `Powertrain=ICE_PETROL, Odo=0 mi, AnnualMi=0` $\to$ Year 9: `yearDepreciationUsd = -$72`; Year 10: `yearDepreciationUsd = -$128`.
     - `Powertrain=ICE_PETROL, Odo=0 mi, AnnualMi=1,000` $\to$ Year 9: `yearDepreciationUsd = -$1`; Year 10: `yearDepreciationUsd = -$54`.
   - Code location:
     - `src/data/maintenanceData.js`, line 904:
       ```javascript
       } else if (pType === POWERTRAIN_TYPES.EV) {
         ptMultiplier = yr <= 3 ? 0.97 : 1.01; // EV early tech obsolescence, stabilizing after yr 3
       }
       ```
     - `src/data/maintenanceData.js`, lines 910–911:
       ```javascript
       const mileageExcessRatio = (annualMi - 12500) / 12500;
       const mileageAdjustment = Math.pow(Math.max(0.5, 1 - mileageExcessRatio * 0.04), yr);
       ```

3. **Dynamic Maintenance Scaling & Revision Thresholds (PASS)**:
   - `REVISION_THRESHOLDS` correctly defines 4 thresholds at 60,000 km (37,282 mi), 100,000 km (62,137 mi), 150,000 km (93,205 mi), and 200,000 km (124,274 mi).
   - All 5 powertrains defined; EV surcharge is lowest across all 4 milestones ($160, $280, $450, $620 vs Petrol $420, $750, $1,250, $1,500).
   - Boundary tests:
     - `calculateRevisionSurcharge(37270, 37281, 'ICE_PETROL')` $\to$ $0 (sub-threshold).
     - `calculateRevisionSurcharge(37281, 37283, 'ICE_PETROL')` $\to$ $420 (crossing 60k km).
     - `calculateRevisionSurcharge(37282, 37295, 'ICE_PETROL')` $\to$ $0 (post-threshold, no double-charge).
     - Exact km conversion: $59,999\text{ km} = 37,281.65\text{ mi}$ to $60,001\text{ km} = 37,282.89\text{ mi}$ cleanly triggers $420.
     - Spanning 0 to 130,000 mi incurs all 4 thresholds ($5,160 for Diesel).
   - Dynamic maintenance wear escalation:
     - Starts at 1.0x at 0 mi, scales to 1.45x at 115k mi, saturates at 2.5x at 500k mi.
     - EV routine maintenance is 35% lower ($520 base vs $800 Petrol).

4. **EV & PHEV Energy Cost Models (PASS in dedicated functions, DEFECT in TCO standalone default)**:
   - `calculateEvEnergyCost`:
     - 15,000 mi, 28 kWh/100mi, 80% Home ($0.15/kWh), 20% DC Fast ($0.45/kWh):
       - Blended tariff = $0.2100/kWh, Annual kWh = 4,200, Total annual cost = **$882.00**, cost per mile = **$0.0588/mi**. Exact match to theoretical model.
   - `calculatePhevEnergyCost`:
     - 12,000 mi, 65% electric / 35% gas, 30 kWh/100mi, 35 mpg, $0.16/kWh home, $0.40/kWh DC (80/20), $3.80/gal gas:
       - Electric cost = $486.72, Gas cost = $456.00, Total annual cost = **$942.72**. Exact match.
   - Zero-tariff boundaries: $0 electricity and $0 fuel cost cleanly evaluate to $0.00 without NaN or fallback.
   - **Standalone Defect in `calculateTcoProjection`**:
     - `src/data/maintenanceData.js`, lines 957 & 998–1004:
       If `homeTariffUsdPerKwh` is omitted when calling `calculateTcoProjection({ isEv: true, powertrainType: 'EV' })`, `homeTariff` defaults to `unitEnergyPrice`, which defaults to `$3.65` (gasoline price in $/gal). DC Fast tariff defaults to $3.65 $\times$ 2.5 = $9.125/kWh.
       Result: 1 year of EV driving (12,000 mi at 30 kWh/100mi) evaluates to **$17,082/yr** ($85,410 over 5 years).

5. **Boundary Sanitization & Anti-Crash (PASS)**:
   - 0 km / 0 miles: Risk matrix evaluates to OPTIMAL, 0% wear, 100% lifespan.
   - 500,000 km / 310,686 miles: Evaluates to CRITICAL, wear caps at 100%, OEM multiplier caps at 3.1x.
   - Negative inputs: All clamp to 0 or valid minimums without NaN.
   - 0% APR: Monthly payment is principal / term ($500/mo on $24,000/48mo), total interest is exactly $0.
   - OBD DIY tier: $0/hr rate yields $0 labor, total equals parts, no NaN.

---

## 2. Logic Chain

1. **Depreciation Non-Monotonicity Mechanism**:
   - Step 1: The empirical retention function $R(t) = 0.45 e^{-0.58 t} + 0.40 e^{-0.05 t} + 0.15$ models vehicle decay over physical vehicle age $t$. Past Year 4 ($t \ge 4$), the annual rate of natural depreciation drops below 5%/year, slowing to ~3%/year past Year 7.
   - Step 2: In `calculateNonLinearDepreciation`, `ptMultiplier` for EV is implemented as `yr <= 3 ? 0.97 : 1.01`. At Year 4 of ownership, `ptMultiplier` abruptly jumps by $+4.12\%$ ($1.01 / 0.97$).
   - Step 3: For used vehicles (e.g. initial odometer $\ge 40,000$ miles), the vehicle is already $>3$ years old physically. Between Year 3 and Year 4 of ownership, the vehicle's natural depreciation is only ~3.5–4.5%. Because the EV discrete jump ($+4.12\%$) exceeds natural depreciation, the vehicle's residual value in Year 4 becomes higher than in Year 3.
   - Step 4: Separately, the low-mileage bonus `Math.pow(1 - mileageExcessRatio * 0.04, yr)` compounds as $(1.04)^{yr}$ when annual mileage is 0. Between Year 8 and Year 9, $(1.04)^9 / (1.04)^8 = 1.04$ (+4.0%/year). Because natural retention only decays at 3.5% at Year 9, compounding the bonus at +4.0% outpaces decay, causing the vehicle to appreciate between Years 8, 9, and 10 for low-mileage cars.
   - Step 5: In `calculateTcoProjection`, `yearDepreciationUsd` is computed as `cumulativeDepreciationUsd - prevCumulativeDepreciationUsd`. When residual value increases, cumulative depreciation decreases, yielding negative depreciation (`yearDepreciationUsd < 0`), which directly corrupts annual carrying cost schedules.

2. **EV Fuel Cost Default Fallback Mechanism**:
   - Step 1: In `calculateTcoProjection`, `unitEnergyPrice` defaults to `fuelPriceUsdGal || 3.65`.
   - Step 2: Line 998 sets `homeTariff = ... homeTariffUsdPerKwh : unitEnergyPrice`. If `homeTariffUsdPerKwh` is omitted, it takes $3.65.
   - Step 3: Line 1001 sets `dcTariff = homeTariff * 2.5` ($9.125/kWh).
   - Step 4: Standalone API calls for EV without explicit tariff inputs compute fuel cost using $3.65/kWh rather than standard EV electricity tariffs ($0.14–$0.16/kWh), inflating EV fuel cost by ~25x ($17,082/yr).

---

## 3. Caveats

- In the interactive UI (`TcoCalculator.jsx`), vehicle presets supply `defaultFuelPriceUsdGal = 0.16` for EVs, masking the fallback defect during preset-based UI usage. However, standalone calls to `calculateTcoProjection` or presets lacking that specific field trigger the defect.
- The non-linear exponential calibration itself ($0.45 e^{-0.58 t} + 0.40 e^{-0.05 t} + 0.15$) and the used-car age offset ratio $R(A_0 + yr) / R(A_0)$ are mathematically elegant and accurately match real-world automotive depreciation curves (Year 1: 21.8%, Year 2: 16.5%, Year 3: 12.2%, Year 5: 6.8%). Only the two discrete modifier interactions (EV step jump and unbounded low-mileage compounding) require remediation.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

Worker M2 has delivered high quality mathematical implementations for non-linear depreciation curves, used-car showroom drop offsets, dynamic maintenance wear escalation, milestone revision threshold surcharges (60k, 100k, 150k, 200k km), and EV/PHEV energy calculations.

However, two concrete mathematical defects must be resolved before Milestone 2 can be approved:
1. **Enforce Depreciation Monotonicity (eliminate negative depreciation / asset appreciation)**:
   - In `calculateTcoProjection`: enforce `residualValueUsd = Math.min(residualValueUsd, prevResidualValueUsd)` and `yearDepreciationUsd = Math.max(0, ...)` across the yearly schedule.
   - In `calculateNonLinearDepreciation`:
     - Base the EV modifier on total physical vehicle age ($A_0 + yr$) rather than ownership year $yr$, or smooth the transition so $R(t) \cdot \text{ptMultiplier}$ is strictly monotonically non-increasing.
     - Cap the low-mileage bonus so that annual retention ratio never exceeds 1.0 (or never causes positive year-over-year asset appreciation).
2. **Fix EV Electricity Tariff Fallback in `calculateTcoProjection`**:
   - In `src/data/maintenanceData.js`, default `unitEnergyPrice` for pure EV to `0.16` instead of `3.65`:
     ```javascript
     const unitEnergyPrice = (fuelPriceUsdGal !== undefined && fuelPriceUsdGal !== null && fuelPriceUsdGal !== '' && !isNaN(Number(fuelPriceUsdGal)))
       ? Math.max(0, Number(fuelPriceUsdGal))
       : (isPureEv ? 0.16 : 3.65);
     ```

---

## 5. Verification Method

To independently reproduce and verify these findings:
1. **Run the empirical challenge test harness**:
   ```powershell
   node scripts/empirical-challenge-m2-2.mjs
   ```
   *Expected outcome*: 142 checks pass; Section 4 flags 110 instances of negative depreciation (`yearDepreciationUsd < 0`) and Section 6 notes the $17,082 EV default fuel cost anomaly.
2. **Run targeted one-liner reproducing Year 4 EV asset appreciation**:
   ```powershell
   node -e "import('./src/data/maintenanceData.js').then(m => { const t = m.calculateTcoProjection({ purchasePriceUsd: 40000, odometerMiles: 60000, annualDistanceMiles: 10000, powertrainType: 'EV', horizonYears: 5 }); console.log('Yr 3 Residual:', t.yearlySchedule[2].residualValueUsd, 'Yr 4 Residual:', t.yearlySchedule[3].residualValueUsd, 'Yr 4 Dep:', t.yearlySchedule[3].yearDepreciationUsd); })"
   ```
   *Observed result*: `Yr 3 Residual: 23600, Yr 4 Residual: 24002, Yr 4 Dep: -402`.
3. **Run targeted one-liner reproducing 0-mileage asset appreciation**:
   ```powershell
   node -e "import('./src/data/maintenanceData.js').then(m => { const t = m.calculateTcoProjection({ purchasePriceUsd: 40000, annualDistanceMiles: 0, horizonYears: 10 }); console.log('Yr 8 Dep:', t.yearlySchedule[7].yearDepreciationUsd, 'Yr 9 Dep:', t.yearlySchedule[8].yearDepreciationUsd); })"
   ```
   *Observed result*: `Yr 8 Dep: 14, Yr 9 Dep: -72`.

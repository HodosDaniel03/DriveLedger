# Handoff Report — Explorer 2: Calculator Math & Financial Logic

**Milestone**: Codebase Survey & Financial Logic Audit  
**Agent**: Explorer 2 (Calculator Math & Financial Logic)  
**Date**: 2026-10-31T11:07:00Z  
**Status**: Investigation Complete  

---

## 1. Observation

### Scope & Target Files Directly Inspected
- `src/components/calculators/TcoCalculator.jsx` (1,318 lines, core engine: lines 20–236, UI: lines 238–1318)
- `src/components/calculators/CostTimeline.jsx` (289 lines, lifecycle trajectory visualization)
- `src/components/calculators/MaintenanceRiskMatrix.jsx` (973 lines, component wear matrix & 12-month reserve)
- `src/components/calculators/MaintenanceMilestones.jsx` (385 lines, scheduled milestone roadmap)
- `src/components/calculators/ObdEstimator.jsx` (867 lines, DTC search & workshop estimation)
- `src/components/calculators/LivePidEvaluator.jsx` (819 lines, live OBD PID thresholds)
- `src/components/calculators/EvBreakEvenCalculator.jsx` (320 lines, ICE vs EV break-even analysis)
- `src/components/calculators/VehicleComparator.jsx` (758 lines, side-by-side reliability & TCO comparator)
- `src/data/maintenanceData.js` (430 lines, `MAINTENANCE_COMPONENTS`, wear penalties, `evaluateComponentHealth`)
- `src/data/obdCodes.js` (1,175 lines, 20 OBD dossiers, `LABOR_RATE_TIERS`, `calculateObdWorkshopEstimate`)
- `src/data/vehiclePresets.js` (1,402 lines, presets, residual curves, mileage defaults)
- `src/data/powertrainArchetypes.js` (658 lines, 8 archetypes, brand tier multipliers, hydration)
- `src/context/UnitContext.jsx` (245 lines, US/UK/EU distance, currency, and efficiency conversions)
- `tests/driveledger.test.js` (1,472 lines, baseline test suite passing: `cmd /c npm test` exits 0 with 9 passed, 1 skipped)

---

### Detailed Observations by Question

#### Obs 1. True Cost to Own (TCO) Calculator Engine
**Location**: `src/components/calculators/TcoCalculator.jsx:20-236`
- **Economic Cost Aggregation**:
  ```javascript
  // Lines 157-163
  const totalEconomicCostUsd = Math.round(
    totalDepreciationUsd +
      cumulativeFuelUsd +
      cumulativeInsuranceUsd +
      cumulativeMaintenanceUsd +
      cumulativeInterestUsd
  );
  ```
- **Cash Outflow Aggregation**:
  ```javascript
  // Lines 165-172
  const totalCashOutflowUsd = Math.round(
    downPaymentUsd +
      cumulativePrincipalPaidUsd +
      cumulativeInterestUsd +
      cumulativeFuelUsd +
      cumulativeInsuranceUsd +
      cumulativeMaintenanceUsd
  );
  ```
- **Category Palette & Share**:
  1. Depreciation (`id: 'depreciation'`, `#0F5BFF`)
  2. Fuel / Energy (`id: 'fuel'`, `#5B8CFF`, label: `isEv ? 'Electricity Charging' : 'Fuel / Energy'`)
  3. Insurance (`id: 'insurance'`, `#12A150`)
  4. Maintenance & Repairs (`id: 'maintenance'`, `#F2B705`)
  5. Financing Interest (`id: 'interest'`, `#98A2B3`)
- **Fuel/Energy Formulation**:
  ```javascript
  // Lines 63-65
  const annualFuelCostUsd = isEv
    ? (annualMi / 100) * eff * unitEnergyPrice
    : (annualMi / eff) * unitEnergyPrice;
  ```
  - For ICE/HEV: `annualMi / eff` computes gallons; multiplied by USD/gal. In EU mode, `UnitContext.jsx:89` converts MPG to L/100km via `235.21458 / mpg`.
  - For EV: Canonical value in `mpgUs` stores `kWh / 100 miles`. Converted for EU in `UnitContext.jsx:81` to `kWh / 100 km` via `mpg / 1.609344`. Multiplied by single flat electricity price `unitEnergyPrice`.
  - **Deficiency**: PHEV has no profile: treated as pure ICE (`isEv=false`) or pure EV (`isEv=true`). No home AC vs DC fast charging split for EV.
- **Maintenance Formulation**:
  ```javascript
  // Lines 109-120
  const odoWearEscalation = 1 + Math.max(0, (endOfYearOdo - 30000) / 85000) * 0.55;
  const serviceMilestoneBump =
    (endOfYearOdo >= 55000 && endOfYearOdo - annualMi < 55000) ||
    (endOfYearOdo >= 90000 && endOfYearOdo - annualMi < 90000)
      ? 650
      : 0;

  const yearMaintenanceUsd =
    (baseAnnualMaintenanceUsd * odoWearEscalation * maintenanceWearFactor +
      serviceMilestoneBump) *
    (annualMi / 12000);
  ```
  - `baseAnnualMaintenanceUsd` defaults to 800 USD.
  - Odometer escalation is strictly linear above 30,000 miles (`+0.55 * (odo - 30000) / 85000`).
  - Milestone bumps are fixed to $650 at exactly 55,000 mi (~88,500 km) and 90,000 mi (~145,000 km).
  - Note: `serviceMilestoneBump` is multiplied by `(annualMi / 12000)`, distorting fixed parts/labor service costs when annual mileage varies.

---

#### Obs 2. Depreciation Calculation (Értékvesztés)
**Location**: `src/components/calculators/TcoCalculator.jsx:81-90`
- **Code Quote**:
  ```javascript
  const baseRetention =
    residualCurve10Yr[yr - 1] ??
    Math.max(0.12, (residualCurve10Yr[residualCurve10Yr.length - 1] || 0.22) * Math.pow(0.9, yr - 10));
  const mileageAdjustedRetention = Math.min(
    0.96,
    Math.max(0.08, baseRetention * Math.pow(1 - mileageExcessRatio * 0.045, yr))
  );
  const residualValueUsd = Math.round(price * mileageAdjustedRetention);
  const cumulativeDepreciationUsd = Math.max(0, price - residualValueUsd);
  ```
- **Observations on Current Model**:
  1. Preset `residualCurve10Yr` array is 10 discrete numbers (e.g. `[0.81, 0.69, 0.59, 0.50, 0.43, 0.37, 0.31, 0.27, 0.23, 0.20]` for diesel).
  2. While the discrete points decrease non-linearly (Year 1: -19%, Year 2: -12%, Year 3: -10%, Year 4+: -7%/yr), **it always assumes the purchase is at Year 0 of the vehicle's life** (`yr = 1` evaluates `residualCurve10Yr[0]`).
  3. **Used vehicle starting odometer `startOdo` is completely ignored** in residual calculation: if a user buys a 5-year-old car with 80,000 miles for $15,000, in Year 1 the calculator computes residual value as $15,000 × 0.81 = $12,150 (taking the new-car showroom drop again, instead of retaining ~93% as a 5-year-old car should).
  4. Excess mileage ratio `(annualMi - 12500) / 12500` applies an exponential factor `Math.pow(1 - mileageExcessRatio * 0.045, yr)`, but does not consider the accumulated odometer.

---

#### Obs 3. Maintenance Risk Matrix & Odometer Scaling
**Locations**: `src/data/maintenanceData.js:146-430`, `src/components/calculators/MaintenanceRiskMatrix.jsx:137-234`, `src/components/calculators/MaintenanceMilestones.jsx:7-120`
- **Dynamic OEM Multiplier**:
  ```javascript
  // maintenanceData.js:141-144
  export function calculateOemRiskMultiplier(physicalOdometerMiles) {
    const odo = Math.max(0, Number(physicalOdometerMiles) || 0);
    return Math.min(3.1, Math.max(2.2, 1.0 + (odo / 45000) * 0.85));
  }
  ```
  Scales from 2.2x (at $\le 45,000$ mi) up to 3.1x (at $\ge 111,176$ mi).
- **Component Thermodynamic Wear Evaluation**:
  ```javascript
  // maintenanceData.js:375-394
  const urbanMultiplier = 1 + urbanFraction * (component.urbanShortTripPenalty - 1);
  const effectiveOilMultiplier = 1 + (oilProfile.multiplier - 1) * (component.oilSensitivity ?? 0.5);
  const transMultiplier =
    component.id === 'drivetrain-dmf-dsg' ? (transProfile.urbanWearFactor - 1) * urbanFraction * 0.4 + 1 : 1.0;
  const combinedMultiplier = urbanMultiplier * effectiveOilMultiplier * historyProfile.multiplier * transMultiplier;
  const effectiveWearMiles = Math.round(odo * combinedMultiplier);
  ```
- **12-Month Expected Service Reserve**:
  ```javascript
  // MaintenanceRiskMatrix.jsx:193-199
  if (item.health.status === 'CRITICAL') {
    itemReserve = avgCost * 0.75;
  } else if (item.health.status === 'WARNING') {
    itemReserve = avgCost * 0.35;
  } else {
    itemReserve = avgCost * 0.12;
  }
  ```
- **Current Milestone Roadmaps**:
  In `MaintenanceMilestones.jsx:7-120`, milestones are hardcoded to US mile increments:
  `15000`, `30000`, `60000`, `90000`, `120000`, `150000` miles.
  No 60k, 100k, 150k, 200k metric (km) revision thresholds are implemented.
- **Powertrain Leakage**:
  In `maintenanceData.js:181`, `drivetrain-dmf-dsg` lists `applicablePowertrains: ['diesel', 'gasoline-turbo', 'gasoline-na', 'hybrid', 'ev']`. Dual-mass flywheels and DSG mechatronics are evaluated for EVs, which violates Requirement R1.

---

#### Obs 4. OBD-II Repair Cost Estimator
**Locations**: `src/data/obdCodes.js:6-31, 1132-1174`, `src/components/calculators/ObdEstimator.jsx:98-172`
- **Workshop Labor Tiers**:
  ```javascript
  // obdCodes.js:6-31
  // dealership: $185/hr, 1.25x parts markup
  // independent: $115/hr, 1.00x parts markup
  // diy: $0/hr, 0.85x parts markup (wholesale)
  ```
- **Estimation Math**:
  ```javascript
  // obdCodes.js:1146-1158
  for (const rc of obdCodeObj.rootCauses) {
    const prob = (rc.probabilityPct || 0) / 100;
    const avgParts = ((rc.partsCostUsd[0] + rc.partsCostUsd[1]) / 2) * tier.partsMarkupFactor;
    const avgLabor = ((rc.laborHours[0] + rc.laborHours[1]) / 2) * tier.rateUsdPerHr;
    weightedPartsUsd += prob * avgParts;
    weightedLaborUsd += prob * avgLabor;
    weightedExpectedUsd += prob * (avgParts + avgLabor);
  }
  ```
- **Available OBD Dossiers**:
  Exactly 20 codes in `OBD_CODES`. 19 are combustion engine or generic: P0420 (Cat), P2002 (DPF), P0299 (Turbo), P0171 (Lean), P0300 (Misfire), P0401 (EGR), P0087 (HPFP), P0700 (Transmission), P2463 (DPF), P0128 (Thermostat), P0455 (EVAP), P0016 (Cam correlation), P2015 (Intake runner), P0101 (MAF), U0100 (CAN bus), P0442 (EVAP), P0113 (IAT), P0301 (Cyl 1 misfire), P20EE (SCR NOx), and P0A80 (Hybrid battery).
  **Zero EV-specific codes** are available in `OBD_CODES` (P0AA6 high-voltage isolation fault is merely an unhandled fallback mapped to U0100).

---

#### Obs 5. Boundary Conditions & Safety Checks
- **0 km / 0 miles**:
  - `TcoCalculator.jsx:37`: `startOdo = Math.max(0, Number(odometerMiles) || 0)` safely returns 0.
  - `MaintenanceRiskMatrix.jsx:51, 67`: Initial state and effect clamp to `Math.max(38000, ...)`.
  - `MaintenanceRiskMatrix.jsx:652`: Slider `id="risk-odometer-slider"` has `min={10000}`. **0 km cannot be selected via slider**.
- **500,000+ km**:
  - `TcoCalculator.jsx:81-89`: Residual value has no odometer penalty: a car purchased with 500,000 km still calculates retention as 83% of purchase price in year 1.
  - `MaintenanceRiskMatrix.jsx:653`: Slider `max={200000}`. In EU mode, this caps at 200,000 km, preventing evaluation of vehicles with 250k–500k km.
  - `maintenanceData.js:399`: `wearPctOfCritical` correctly clamps at `Math.min(100, ...)`.
- **Negative Numbers**:
  - `TcoCalculator.jsx:36`: `purchasePriceUsd`: `Math.max(1000, Number(purchasePriceUsd) || 30000)` clamps to 1000.
  - `TcoCalculator.jsx:41`: `annualInsuranceUsd`: `Math.max(0, Number(annualInsuranceUsd) || 1400)` — **Bug**: Entering 0 evaluates `0 || 1400 = 1400`. Users cannot specify 0 insurance.
  - `VehicleComparator.jsx:28`: If `odoMiles < 0`, `Number(odoMiles) >= 0` is false, causing silent fallback to `defaultOdometerMiles || 62000`.
- **Unrealistic Model Years**:
  - `powertrainArchetypes.js:451-455`:
    ```javascript
    const year = merged.year ?? (typeof years === 'string' && /\d{4}/.test(years) ? Number((years.match(/\d{4}/g) || []).slice(-1)[0]) : 2022);
    ```
    No range validation exists. Model years such as 1850 or 2150 pass through unvalidated.

---

## 2. Logic Chain

```
[Observation 1: TcoCalculator.jsx:63-65 & 109-120]
  ├── TCO engine computes 5 economic cost components
  ├── EV fuel cost uses single flat rate; PHEV has no dual profile
  └── Maintenance escalation is linear with only 2 fixed bump points ($650 at 55k and 90k mi)
        │
        ▼
[Observation 2: TcoCalculator.jsx:81-90]
  ├── Residual value formula indexes residualCurve10Yr[yr - 1]
  ├── Initial vehicle age (A0) and initial odometer (startOdo) are ignored
  └── A 5-year-old used vehicle suffers the 19% showroom depreciation hit again
        │
        ▼
[Observation 3: maintenanceData.js:146-430 & MaintenanceMilestones.jsx:7-120]
  ├── Component wear scales with urban cycle (1.35x-1.55x) and oil intervals
  ├── Milestones use fixed 15k, 30k, 60k, 90k, 120k, 150k miles
  └── No 60k, 100k, 150k, 200k metric revision thresholds exist in TCO or milestones
        │
        ▼
[Observation 4: obdCodes.js:1146-1158 & 44-1127]
  ├── Probability-weighted repair cost across root causes for 3 labor rate tiers
  └── 20 codes are combustion-focused; EV shows ICE codes (P0420, P2002, P0300)
        │
        ▼
[Observation 5: Boundary conditions across all calculators]
  ├── 0 km blocked on MaintenanceRiskMatrix slider (min=10,000)
  ├── 500,000+ km blocked on slider (max=200,000)
  ├── 0 insurance defaults to 1400 (falsy || bug)
  └── Unrealistic model years unconstrained in preset hydration
        │
        ▼
[Conclusion & Mathematical Specifications]
  ├── Define formal continuous depreciation model with used car age offset
  ├── Define PHEV dual-fuel and EV dual-tariff formulas
  ├── Define structured 60k, 100k, 150k, 200k revision threshold matrix
  └── Establish strict input sanitization boundaries
```

---

## 3. Caveats
1. **Existing Test Suite Stability**: `tests/driveledger.test.js` contains hardcoded assertions for specific return values (e.g., lines 457–470 assert `calculateOemRiskMultiplier(0) === 2.2` and `calculateOemRiskMultiplier(120000) === 3.1`). Any modifications to `calculateOemRiskMultiplier` must maintain exact clamping at 0 and 120k miles.
2. **Preset 10-Year Arrays**: All 12 primary presets in `vehiclePresets.js` provide `residualCurve10Yr`. The new depreciation formula should accept `residualCurve10Yr` for backward compatibility while introducing age-offset and continuous fallback formulas.
3. **No Network / External API Dependencies**: All calculations are local and deterministic in JavaScript/React.

---

## 4. Conclusion & Mathematical Recommendations

### 4.1 True Cost to Own (TCO) Architectural Recommendations

#### A. Powertrain-Specific Energy Model
Replace lines 63–65 in `src/components/calculators/TcoCalculator.jsx`:
```javascript
let annualFuelCostUsd = 0;

if (powertrainType === 'EV' || isEv) {
  // Dual-Tariff EV Model: 80% Home Charging + 20% DC Fast Charging
  const homeTariffUsdKwh = Number(homeElectricityPriceUsdKwh) || (Number(unitEnergyPrice) * 0.75);
  const dcTariffUsdKwh = Number(dcFastElectricityPriceUsdKwh) || (Number(unitEnergyPrice) * 1.85);
  const homeSharePct = Number(homeChargingSharePct ?? 80) / 100;
  const effectiveTariffUsdKwh = homeSharePct * homeTariffUsdKwh + (1 - homeSharePct) * dcTariffUsdKwh;
  
  // eff is kWh / 100 miles
  annualFuelCostUsd = (annualMi / 100) * eff * effectiveTariffUsdKwh;
} else if (powertrainType === 'PHEV') {
  // Combined PHEV Profile: 65% Electric Commute + 35% Gasoline
  const evFraction = Math.min(1, Math.max(0, (Number(phevElectricSharePct ?? 65)) / 100));
  const evEfficiencyKwh100Mi = Number(phevKwhPer100Mi) || 30.0;
  const iceMpg = Number(phevIceMpg) || 38.0;
  const homeTariff = Number(homeElectricityPriceUsdKwh) || 0.16;
  const gasPrice = Number(fuelPriceUsdGal) || 3.65;
  
  const electricCostUsd = (annualMi * evFraction / 100) * evEfficiencyKwh100Mi * homeTariff;
  const gasCostUsd = (annualMi * (1 - evFraction) / iceMpg) * gasPrice;
  annualFuelCostUsd = electricCostUsd + gasCostUsd;
} else {
  // Standard ICE / HEV
  annualFuelCostUsd = (annualMi / eff) * unitEnergyPrice;
}
```

---

### 4.2 Non-Linear Depreciation Model

#### Mathematical Formulation
Let:
- $V_0$: Purchase price in USD.
- $O_0$: Initial physical odometer (miles).
- $A_0$: Estimated vehicle age at acquisition: $A_0 = \max\left(0, \frac{O_0}{12500}\right)$.
- $yr$: Year of ownership ($1 \le yr \le 10$).
- $t = A_0 + yr$: Cumulative physical age of the vehicle.

The retained value ratio from factory new at age $t$ is modeled as a double-exponential curve:
$$R_{new}(t) = w_{rapid} \cdot e^{-k_1 \cdot t} + w_{slow} \cdot e^{-k_2 \cdot t} + R_{floor}$$

Where:
- $w_{rapid} = 0.38$, $k_1 = 0.42$ (fast initial loss over years 0–3)
- $w_{slow} = 0.50$, $k_2 = 0.08$ (slow wear decay over years 4–10)
- $R_{floor} = 0.12$ (scrap / baseline utility floor)
- At $t=0$: $R_{new}(0) = 0.38 + 0.50 + 0.12 = 1.00$ (100% of MSRP)
- At $t=1$: $0.38 e^{-0.42} + 0.50 e^{-0.08} + 0.12 \approx 0.250 + 0.461 + 0.12 = 0.831$ (~83%)
- At $t=3$: $0.38 e^{-1.26} + 0.50 e^{-0.24} + 0.12 \approx 0.108 + 0.393 + 0.12 = 0.621$ (~62%)
- At $t=5$: $0.38 e^{-2.10} + 0.50 e^{-0.40} + 0.12 \approx 0.046 + 0.335 + 0.12 = 0.501$ (~50%)
- At $t=10$: $0.38 e^{-4.20} + 0.50 e^{-0.80} + 0.12 \approx 0.006 + 0.225 + 0.12 = 0.351$ (~35%)

#### Powertrain Depreciation Multiplier ($\gamma_{pt}$)
Adjust decay rate $\lambda = k \cdot \gamma_{pt}$:
- `HEV`: $\gamma_{pt} = 0.85$ (strongest resale value, e.g. Toyota Dynamic Force)
- `ICE_PETROL`: $\gamma_{pt} = 1.00$ (baseline)
- `ICE_DIESEL`: $\gamma_{pt} = 1.08$ (urban environmental restrictions)
- `PHEV`: $\gamma_{pt} = 1.12$ (battery replacement fear on dual powertrain)
- `EV`: $\gamma_{pt} = 1.18$ in first 3 years, flattening to $\gamma_{pt} = 0.95$ past year 5

#### Used Vehicle Value Retention at Year $yr$
$$\text{Retention}(yr) = \frac{R_{new}(A_0 + yr)}{R_{new}(A_0)} \cdot \left(1 - \text{excessRatio} \cdot 0.04\right)^{yr}$$
This prevents used vehicles from taking the 19% showroom hit repeatedly.

---

### 4.3 Maintenance Revision Thresholds (60k, 100k, 150k, 200k)

#### Structured Revision Matrix
Add to `src/data/maintenanceData.js`:
```javascript
export const REVISION_THRESHOLDS = [
  {
    thresholdKm: 60000,
    thresholdMiles: 37282,
    label: '60,000 km / 37.5k mi Minor-Major Service',
    surchargeUsd: {
      EV: 160,       // Brake slider lubrication, reduction gear inspection, cabin filter
      HEV: 340,      // HV battery filter, brake fluid, engine filter
      PHEV: 480,     // Spark plugs, brake fluid, hybrid transmission inspection
      ICE_PETROL: 420,// Spark plugs, brake fluid, filters
      ICE_DIESEL: 520,// Fuel filter, brake fluid, DPF differential pressure check
    },
  },
  {
    thresholdKm: 100000,
    thresholdMiles: 62137,
    label: '100,000 km / 62k mi Major Powertrain Revision',
    surchargeUsd: {
      EV: 280,       // Reduction gearbox fluid exchange, inverter coolant conductivity check
      HEV: 520,      // Inverter coolant loop flush, auxiliary serpentine belt
      PHEV: 780,     // Automatic transmission fluid, inverter coolant flush
      ICE_PETROL: 750,// Transmission fluid & filter, serpentine belt & tensioner
      ICE_DIESEL: 890,// DSG/ATF fluid flush, auxiliary belt kit, glow plug check
    },
  },
  {
    thresholdKm: 150000,
    thresholdMiles: 93205,
    label: '150,000 km / 93k mi High-Mileage Valvetrain & Chassis',
    surchargeUsd: {
      EV: 450,       // Multi-link front hydro-bushings, brake rotors, heat pump valve check
      HEV: 820,      // Water pump, EGR passage decoke, brake rotors, dampers
      PHEV: 1350,    // Timing belt kit / water pump, dampers, GDI decoke
      ICE_PETROL: 1250,// Timing belt kit / chain tensioner check, intake valve walnut decoke
      ICE_DIESEL: 1650,// Timing belt kit + water pump, EGR cooler inspection, front suspension
    },
  },
  {
    thresholdKm: 200000,
    thresholdMiles: 124274,
    label: '200,000 km / 125k mi Deep System Overhaul',
    surchargeUsd: {
      EV: 620,       // Battery SoH diagnostic, drive unit mount refresh, AC compressor oil
      HEV: 1100,     // Transaxle damper, brake hydraulic actuator check
      PHEV: 1750,    // Turbocharger inspection, high-voltage battery cell balance check
      ICE_PETROL: 1500,// Fuel pump follower, PCV refresh, catalytic converter inspection
      ICE_DIESEL: 2100,// DPF pneumatic flush / core renewal, common-rail injector test, turbo VNT
    },
  },
];
```

#### TCO Integration Formula
In `calculateTcoProjection`:
```javascript
const yearStartOdo = startOdo + annualMi * (yr - 1);
const yearEndOdo = startOdo + annualMi * yr;

let revisionSurchargeUsd = 0;
for (const rev of REVISION_THRESHOLDS) {
  if (yearStartOdo < rev.thresholdMiles && yearEndOdo >= rev.thresholdMiles) {
    const cost = rev.surchargeUsd[powertrainType] ?? rev.surchargeUsd.ICE_PETROL;
    revisionSurchargeUsd += cost;
  }
}

// Add fixed revision surcharge (not distorted by annualMi / 12000)
const yearMaintenanceUsd =
  (baseAnnualMaintenanceUsd * odoWearEscalation * maintenanceWearFactor * (annualMi / 12000)) +
  revisionSurchargeUsd;
```

---

### 4.4 OBD-II Estimator Recommendations
1. **Filter by Powertrain**:
   In `ObdEstimator.jsx`, add a powertrain filter check:
   If `preset.powertrain === 'ev'`, combustion-only codes (P0420, P2002, P0299, P0171, P0300, P0401, P0087, P2463, P2015, P0101, P0301, P20EE) are hidden from search and quick pills.
2. **Add EV-Specific OBD-II Dossiers to `src/data/obdCodes.js`**:
   - `P0AA6`: Hybrid / EV Battery Voltage System Isolation Lost (chassis high-voltage leak)
   - `P0A78`: Drive Unit Inverter Performance / IGBT Overheat
   - `U0298`: Lost Communication With On-Board Charger (OBC / ICCU)
   - `P0E15`: Hybrid/EV Battery Pack Coolant Valve Control Performance Stuck

---

### 4.5 Boundary Conditions & Safety Guardrails
1. **0 km Support**:
   - In `MaintenanceRiskMatrix.jsx:652`, adjust slider `min={0}` instead of `min={10000}`.
   - Adjust `useState`: `useState(Number(activePreset.defaultOdometerMiles) >= 0 ? activePreset.defaultOdometerMiles : 58000)`.
2. **500,000+ km Support**:
   - In `MaintenanceRiskMatrix.jsx:653`, adjust slider `max={350000}` in miles (or `max={550000}` in EU km mode).
   - Add explicit numeric input box next to slider for direct entry of high mileage (e.g. 500,000 km).
3. **Negative Numbers Guardrails**:
   - In `TcoCalculator.jsx:41`:
     Fix: `const insurancePerYr = Math.max(0, Number(annualInsuranceUsd) >= 0 ? Number(annualInsuranceUsd) : 1400);`
   - In `VehicleComparator.jsx:28`:
     Fix: `const physicalOdometerMiles = Math.max(0, Number(odoMiles) || 0);`
4. **Model Year Guardrail**:
   - In `powertrainArchetypes.js:451-455`:
     ```javascript
     const currentYear = new Date().getFullYear();
     const rawYear = merged.year ?? (typeof years === 'string' && /\d{4}/.test(years) ? Number((years.match(/\d{4}/g) || []).slice(-1)[0]) : 2022);
     const year = Math.min(currentYear + 1, Math.max(1985, Number(rawYear) || 2022));
     ```

---

## 5. Verification Method

To independently verify all findings and test proposals:

1. **Verify Baseline Test Suite Execution**:
   Run the following terminal command from the workspace root:
   ```powershell
   cmd /c npm test
   ```
   **Expected Result**:
   - Exits with code 0.
   - 9 passed, 0 failed, 1 skipped.
   - Execution time under 1.2s.

2. **Inspect Calculator Code Locations**:
   - TCO Engine: `src/components/calculators/TcoCalculator.jsx:20-236`
   - Odometer Risk Multiplier: `src/data/maintenanceData.js:141-144`
   - Component Wear Algorithm: `src/data/maintenanceData.js:363-429`
   - OBD Workshop Estimator: `src/data/obdCodes.js:1132-1174`
   - Slider Constraints: `src/components/calculators/MaintenanceRiskMatrix.jsx:640-666`

3. **Invalidation Conditions**:
   - If `tests/driveledger.test.js` fails any assertion when `calculateOemRiskMultiplier(0)` or `calculateOemRiskMultiplier(120000)` are called, the existing tests require strict boundary preservation (min 2.2x, max 3.1x).
   - If an EV preset (e.g. `tesla-model-3-lr`) is run through `computeReliabilityAndRisk`, `drivetrain-dmf-dsg` must be excluded so 0 combustion items are evaluated.

# Powertrain & Maintenance Architecture Survey Report

**Explorer**: Codebase Explorer 1 — Powertrain & Maintenance Architecture  
**Working Directory**: `d:\Antigravity_projects\DriveLedger\.agents\teamwork\explorer_survey_1`  
**Target Milestone**: Codebase Survey & Powertrain Branching Blueprint  
**Date**: 2026-10-31  

---

## 1. Observation

All findings are based on direct verification of the active repository files under `src/`, `data/`, `tests/`, and project configuration files.

### 1.1 Definition of Vehicle Types, Fuel Types, and Powertrain Types

Currently, vehicle powertrain categorization is fragmented across four decoupled definitions with inconsistent string literals and heuristic resolvers:

1. **`src/data/powertrainArchetypes.js` (Lines 98–324 & 351–424)**:
   - Defines 8 powertrain archetype IDs:
     - `'euro6-diesel-dpf-wetbelt'` (fuelType: `'Diesel'`, powertrain: `'diesel'`)
     - `'vag-2.0-tdi-dsg'` (fuelType: `'Diesel'`, powertrain: `'diesel'`)
     - `'bmw-b47-zf8'` (fuelType: `'Diesel'`, powertrain: `'diesel'`)
     - `'direct-inj-turbo-petrol'` (fuelType: `'Gasoline'`, powertrain: `'gasoline-turbo'`)
     - `'puretech-ecoboost-wetbelt'` (fuelType: `'Gasoline'`, powertrain: `'gasoline-turbo'`)
     - `'toyota-hybrid-ecvt'` (fuelType: `'Hybrid'`, powertrain: `'hybrid'`)
     - `'phev-turbo-dct'` (fuelType: `'Plug-in Hybrid'`, powertrain: `'hybrid'`)
     - `'bev-lithium'` (fuelType: `'Electric'`, powertrain: `'ev'`)
   - Archetype resolver heuristic (`resolveArchetypeIdForPreset`, lines 351–424) inspects `preset.isEv || fuelType === 'electric' || powertrain === 'ev'`, then checks substrings like `'phev'`, `'plug-in'`, `'ehybrid'`, `'gte'`, `'330e'`, `'45e'`, `'t8 '`, then `'hybrid'`, then `'diesel'`, then wet-belt keywords, falling back to `'direct-inj-turbo-petrol'`.

2. **`src/data/vehicleCatalog.js` (Lines 18–9592)**:
   - 35 global marques containing 171 engine variants.
   - `fuelType` values across catalog records:
     - `"Diesel"` (79 occurrences)
     - `"Gasoline"` (60 occurrences)
     - `"Hybrid"` (24 occurrences)
     - `"Electric"` (7 occurrences)
     - `"Plug-in Hybrid"` (1 occurrence: `volvo-xc60-t8-phev`)
   - `powertrain` values across catalog records:
     - `"diesel"` (79 occurrences)
     - `"gasoline-turbo"` (50 occurrences)
     - `"gasoline-na"` (10 occurrences)
     - `"hybrid"` (24 occurrences)
     - `"electric"` (5 occurrences)
     - `"ev"` (2 occurrences)
   - *Inconsistency*: Pure electric models alternate between `"powertrain": "electric"` (e.g. BMW i4, Porsche Taycan) and `"powertrain": "ev"` (e.g. Tesla Model 3/Y).

3. **`src/data/vehiclePresets.js` (Lines 16–1360)**:
   - 65 baseline vehicle presets.
   - Categorized by `fuelType`: 18 Diesel, 15 Gasoline, 5 Hybrid, 2 Electric (Tesla Model 3 LR, Tesla Model Y LR).
   - Flagged with boolean `isEv: true` (only lines 1060 and 1092).
   - Filter function (`filterPresets`, lines 1378–1401) matches strictly against `preset.fuelType === fuelType`.

4. **`src/data/maintenanceData.js` (Lines 9–40)**:
   - Explicitly defines `POWERTRAIN_OPTIONS` as 5 IDs:
     - `'diesel'` ("Turbo Diesel")
     - `'gasoline-turbo'` ("Gasoline Direct-Injection Turbo")
     - `'gasoline-na'` ("Gasoline Naturally Aspirated")
     - `'hybrid'` ("Full Hybrid / Plug-In Hybrid")
     - `'ev'` ("Battery Electric Powertrain")

5. **`src/components/common/vehicle/vehicleArchetypes.js` (Lines 206–302)**:
   - `resolvePowertrainArchetype(vehicle)` maps vehicle objects to 7 string literals:
     - `'ev'` (pure electric)
     - `'phev'` (plug-in hybrid)
     - `'mhev'` (mild hybrid 48V)
     - `'hybrid'` (full HEV)
     - `'diesel'` (common-rail diesel)
     - `'petrol-na'` (naturally aspirated petrol)
     - `'petrol-turbo'` (turbo petrol)

### 1.2 Definition of Maintenance Items, Service Schedules, and Repair Cost Estimations

1. **Component Wear & Risk Dossiers (`src/data/maintenanceData.js`)**:
   - `MAINTENANCE_COMPONENTS` (lines 146–357) defines 7 component dossiers:
     1. `timing-assembly` (Timing Belt / Wet Belt / Timing Chain & Water Pump)
     2. `drivetrain-dmf-dsg` (Dual-Mass Flywheel (DMF), Clutch Pack & Mechatronics / ATF Service)
     3. `dpf-egr-scr-injectors` (DPF Filter, EGR Cooler & Valve, AdBlue/SCR & Piezo Injectors)
     4. `hpfp-turbo-vnt` (High-Pressure Fuel Pump (HPFP) & Turbocharger VNT Actuator / Bearings)
     5. `suspension-brakes-chassis` (Multi-Link Control Arm Bushings, Dampers & Brake Rotors/Pads)
     6. `hv-battery-thermal-loop` (EV / Hybrid High-Voltage Battery Thermal Chiller & Inverter Coolant Loop)
     7. `gdi-intake-pcv-ignition` (GDI Intake Valve Carbon Blasting, PCV Oil Separator & Ignition Coils)
   - Each component defines:
     - `applicablePowertrains`: string array
     - `applicableTransmissions`: string array
     - `serviceIntervalMiles` (e.g. 50,000 to 95,000 mi)
     - `criticalLimitMiles` (e.g. 70,000 to 120,000 mi)
     - `urbanShortTripPenalty` (1.35x to 1.55x)
     - `oilSensitivity` (0.0 to 1.0)
     - `costsUsd`: `{ dealership: [min, max], independent: [min, max], diyParts: [min, max] }`
     - `laborHours`: `[min, max]`
   - `evaluateComponentHealth()` (lines 363–429): calculates `effectiveWearMiles` = `physicalOdometerMiles * urbanMultiplier * oilMultiplier * historyMultiplier * transMultiplier`, computing wear percentage against `criticalLimitMiles` and assigning status (`OPTIMAL`, `WARNING`, `CRITICAL`).

2. **Milestone Service Schedules (`src/components/calculators/MaintenanceMilestones.jsx`)**:
   - `STANDARD_MILESTONES` (lines 7–120) defines 6 odometer thresholds:
     - `15,000 mi`: Engine oil & OEM filter change, tire rotation, brake pad inspection, fluid top-off.
     - `30,000 mi`: Brake fluid hydraulic flush, engine intake air filter, 12V AGM test, suspension check.
     - `60,000 mi`: Spark plugs / diesel fuel filter, Automatic/DSG transmission fluid & filter flush, engine coolant test, auxiliary serpentine belt check.
     - `90,000 mi`: Timing belt kit & water pump replacement, differential / transfer case gear oil, cooling hoses & thermostat, brake rotors.
     - `120,000 mi`: Upstream broadband Oxygen sensor, DPF soot load ash measurement / chemical regen, PCV valve / oil separator diaphragm, dampers & shocks.
     - `150,000 mi`: Complete transmission torque converter exchange, GDI intake valve walnut decoke, HPFP follower & seal renewal, subframe & motor mounts.
   - **Critical Observation**: `STANDARD_MILESTONES` is completely static and hardcoded. It is NOT filtered by vehicle powertrain.

3. **Risk Credit & Milestone Impact Mapping (`src/context/GarageContext.jsx`)**:
   - `MILESTONE_IMPACT_MAP` (lines 10–35): assigns dollar credits ($35 to $620) and reliability bonuses (+1 to +8 pts) to 24 milestone tasks.
   - `COMPONENT_MILESTONE_TRIGGERS` (lines 40–48): links completed milestone checkboxes to satisfying mechanical components in the Risk Matrix.

4. **OBD-II Repair Cost Estimator (`src/data/obdCodes.js`)**:
   - `OBD_CODES` (lines 44–1127): 20 DTC dossiers with root cause probability breakdowns and parts/labor ranges.
   - `calculateObdWorkshopEstimate()` (lines 1132–1174): computes tier-weighted repair estimates across Dealership ($185/hr), Independent ($115/hr), and DIY ($0/hr).

5. **TCO Maintenance & Depreciation Projection (`src/components/calculators/TcoCalculator.jsx`)**:
   - `calculateTcoProjection()` (lines 109–120):
     - `odoWearEscalation = 1 + Math.max(0, (endOfYearOdo - 30000) / 85000) * 0.55`
     - `serviceMilestoneBump = (endOfYearOdo >= 55000 && ...) || (endOfYearOdo >= 90000 && ...) ? 650 : 0`
     - `yearMaintenanceUsd = (baseAnnualMaintenanceUsd * odoWearEscalation * maintenanceWearFactor + serviceMilestoneBump) * (annualMi / 12000)`

### 1.3 Representation of ICE-Specific Parts & Existing EV Contamination

The table below catalogs how the 10 ICE-specific components specified in R1 are currently represented, and identifies where they contaminate EV calculations:

| ICE Component | Location in Codebase | Verbatim Representation | EV Contamination Finding |
|---|---|---|---|
| **1. Motor Oil & Filter** | `maintenanceData.js`: 75–97; `MaintenanceMilestones.jsx`: 14; `GarageContext.jsx`: 11 | `OIL_INTERVAL_PROFILES`, item `'15k-oil': 'Engine oil & OEM spec filter change'` | In `MaintenanceRiskMatrix.jsx`: line 143 applies `oilIntervalId = 'extended'` (1.38x wear) in OEM mode even when `activePreset.isEv === true`. In `MaintenanceMilestones.jsx`, EV checklist displays "Engine oil & OEM spec filter change". |
| **2. Timing Belt / Chain & Water Pump** | `maintenanceData.js`: 148–176; `MaintenanceMilestones.jsx`: 57; `GarageContext.jsx`: 23 | `id: 'timing-assembly'`, item `'90k-timing': 'Timing belt kit & water pump replacement'` | Correctly excludes `'ev'` in `applicablePowertrains` in `maintenanceData.js`, BUT still displays on the EV Maintenance Milestones checklist! |
| **3. Turbocharger / HPFP** | `maintenanceData.js`: 238–266; `MaintenanceMilestones.jsx`: 113; `GarageContext.jsx`: 33 | `id: 'hpfp-turbo-vnt'`, item `'150k-fuel-pump': 'High-pressure fuel pump (HPFP) follower'` | Excludes `'ev'` in `maintenanceData.js`, but displays on EV Milestones checklist. |
| **4. EGR, DPF & AdBlue/SCR** | `maintenanceData.js`: 208–236; `MaintenanceMilestones.jsx`: 80; `GarageContext.jsx`: 28 | `id: 'dpf-egr-scr-injectors'`, item `'120k-dpf': 'DPF soot load ash measurement'` | Excludes `'ev'` in `maintenanceData.js`, but displays on EV Milestones checklist. |
| **5. Dual-Mass Flywheel (DMF) & Clutch Pack** | `maintenanceData.js`: 178–206 (Lines 181–182); `MaintenanceMilestones.jsx`: 41, 101 | `id: 'drivetrain-dmf-dsg'`, `applicablePowertrains: ['diesel', 'gasoline-turbo', 'gasoline-na', 'hybrid', 'ev']` | **CRITICAL BUG**: Explicitly includes `'ev'` in `applicablePowertrains` and `'single-speed-ev'` in `applicableTransmissions`! Tesla Model 3/Y shows DMF arc-spring bottoming and DSG mechatronics risk ($1,120–$3,400). |
| **6. Injectors (Direct / Piezo)** | `maintenanceData.js`: 209, 329 | Common-rail 2,000+ bar piezo return leak-off; GDI direct injectors | Excluded in `maintenanceData.js`, but fuel filter cartridge appears on EV Milestones at 60k mi. |
| **7. Spark Plugs & Ignition Coils** | `maintenanceData.js`: 328–356; `MaintenanceMilestones.jsx`: 38; `GarageContext.jsx`: 19 | `id: 'gdi-intake-pcv-ignition'`, item `'60k-plugs': 'Iridium spark plugs (petrol)'` | Excludes `'ev'` in `maintenanceData.js`, but appears on EV Milestones checklist at 60,000 miles. |
| **8. Exhaust System & Catalytic Converter / OPF** | `obdCodes.js`: 46–101; `MaintenanceMilestones.jsx`: 77; `GarageContext.jsx`: 27 | Code `P0420`, item `'120k-o2': 'Upstream broadband Oxygen (Lambda) sensor'` | Appears on EV Milestones checklist at 120,000 miles. |
| **9. Traditional Gearbox Oil / Transmission Fluid** | `maintenanceData.js`: 178; `MaintenanceMilestones.jsx`: 41, 100 | Items `'60k-transmission'` (DSG fluid flush) and `'150k-trans-flush'` (torque converter exchange) | Both items appear on EV Milestones checklist. |
| **10. PCV Valve / Crankcase Ventilation** | `maintenanceData.js`: 329; `MaintenanceMilestones.jsx`: 86 | Item `'120k-pcv': 'PCV valve / oil separator diaphragm refresh'` | Appears on EV Milestones checklist at 120,000 miles. |

Furthermore, in `src/data/vehiclePresets.js`:
- Tesla Model 3 Long Range (line 1070) and Tesla Model Y Long Range (line 1102) are configured with:
  ```javascript
  commonObdCodes: ['U0100', 'P0A80', 'P0128', 'P0700']
  ```
  - `P0700` is **Transmission Control System Malfunction** (irrelevant for a fixed direct-drive reduction gear).
  - `P0128` is **Coolant Thermostat (Engine Coolant Temp Below Regulating Temp)** (an internal combustion engine thermostat code).

### 1.4 EV-Specific Items: Current State & Integration Architecture

The 7 EV-specific items mandated by Requirement R1 currently have the following implementation status in the codebase:

1. **Battery Degradation (SoH % and LFP vs NMC Chemistry)**:
   - *Current State*: Missing. Only referenced in descriptive text in `powertrainArchetypes.js` line 317 and `vehiclePresets.js` line 1053. No mathematical State of Health (SoH %) calculation exists.
   - *Required Integration*:
     - Add `batteryChemistry: 'LFP' | 'NMC'` to EV presets and catalog records.
     - Add dedicated `ev-battery-degradation` component dossier in `maintenanceData.js`.
     - Implement formula: SoH (%) degrades as a function of cumulative mileage, vehicle age (calendar aging), fast-charging percentage, and chemical curve (LFP degrades slower linearly after initial 3% break-in, but suffers in cold; NMC degrades faster with frequent 100% SoC holding).

2. **On-Board Charger (OBC) / Integrated Charging Control Unit (ICCU) Failure Risk**:
   - *Current State*: Missing. Not represented in `maintenanceData.js`, `obdCodes.js`, or milestones.
   - *Required Integration*:
     - Add `ev-obc-iccu-electronics` component to `MAINTENANCE_COMPONENTS` (`applicablePowertrains: ['ev', 'phev']`).
     - Cost: $1,200–$2,800 independent, $2,400–$4,500 dealership.
     - Add OBC/ICCU diagnostic codes (e.g. `U0111` / `P0A1A` or high-voltage charging interlock fault) to `OBD_CODES`.

3. **Heat Pump / Battery Chiller / Multi-Way Coolant Valve (Octovalve) Faults**:
   - *Current State*: Partially bundled in `hv-battery-thermal-loop` (lines 298–326), but conflated with hybrid fan filters and generic coolant flushes.
   - *Required Integration*:
     - Refine `hv-battery-thermal-loop` for EVs to explicitly target multi-way thermal coolant step-motor valve sticking, heat pump refrigerant pressure sensors, and dielectric battery loop fluid flushes.

4. **Electric Reducer Gearbox Oil Service**:
   - *Current State*: Missing. EV drive unit fluid is incorrectly lumped under `drivetrain-dmf-dsg` with dual-mass flywheels and torque converters.
   - *Required Integration*:
     - Remove `'ev'` and `'single-speed-ev'` from `drivetrain-dmf-dsg`.
     - Add `ev-reducer-gearbox-oil`:
       - `applicablePowertrains: ['ev']`
       - `applicableTransmissions: ['single-speed-ev', 'direct-drive']`
       - Specialist preventative interval: 50,000–60,000 mi (vs OEM "sealed for life" fallacy).
       - Cost: $180–$350 independent, $320–$600 dealership.

5. **Increased Vehicle Weight Curb Wear (Control Arm Hydro-Bushings & Ball Joints)**:
   - *Current State*: Mentioned in notes (`vehiclePresets.js` line 1069), but `suspension-brakes-chassis` uses the same uniform wear multiplier for 1,300 kg ICE hatchbacks and 2,100 kg dual-motor EVs.
   - *Required Integration*:
     - Apply curb-weight accelerated wear factor (1.25x–1.35x) to `suspension-brakes-chassis` when `powertrain === 'ev'`.

6. **Accelerated Tire Wear**:
   - *Current State*: Mentioned in `vehiclePresets.js` notes ("rapid inside shoulder rear tire wear"), but completely absent from maintenance calculations and cost models.
   - *Required Integration*:
     - Add dedicated EV tire rotation and alignment inspection milestone at 15,000 / 30,000 mi.
     - Incorporate higher tire replacement cadence into EV TCO calculations.

7. **Brake Rotor Corrosion & Caliper Seizure due to Regenerative Braking**:
   - *Current State*: Mentioned in `vehiclePresets.js` line 1101, but not branch-isolated in milestones or risk checks.
   - *Required Integration*:
     - Include annual/30,000-mi preventative milestone: "Caliper slide pin lubrication, brake pad anti-seize service & rotor rust de-glazing".

### 1.5 Fuel and Energy Consumption Calculations

Energy and running cost calculations are concentrated in three files:

1. **`src/components/calculators/TcoCalculator.jsx` (Lines 63–66)**:
   ```javascript
   // Annual fuel / energy cost in USD
   const annualFuelCostUsd = isEv
     ? (annualMi / 100) * eff * unitEnergyPrice
     : (annualMi / eff) * unitEnergyPrice;
   ```
   - For EV: `eff` represents `kWh/100mi` (or converted from `kWh/100km`) and `unitEnergyPrice` is $/kWh (stored in `defaultFuelPriceUsdGal`).
   - **Gaps**:
     - *No Home vs. DC Fast Charging Split*: Assumes a single flat rate ($0.16/kWh in US). Does not allow splitting e.g. 80% home charging at $0.14/kWh and 20% DC fast charging at $0.48/kWh.
     - *No PHEV Dual-Energy Profile*: If a vehicle is PHEV, `isEv` is `false`, so it computes purely as ICE fuel consumption `(annualMi / eff) * unitEnergyPrice`, ignoring all electric driving capability!

2. **`src/components/calculators/EvBreakEvenCalculator.jsx` (Lines 68–78)**:
   ```javascript
   if (region === 'EU') {
     iceCost = ((Number(iceConsumption) || 6.5) / 100) * (Number(fuelPriceLocal) || 1.85);
     evCost = ((Number(evConsumption) || 18.0) / 100) * (Number(electricityPriceLocal) || 0.28);
   } else if (region === 'UK') {
     const litCostPerImpGal = (Number(fuelPriceLocal) || 1.45) * 4.54609;
     iceCost = (Number(iceConsumption) || 38.0) > 0 ? litCostPerImpGal / Number(iceConsumption) : 0;
     evCost = ((Number(evConsumption) || 28.0) / 100) * (Number(electricityPriceLocal) || 0.26);
   } else {
     iceCost = (Number(iceConsumption) || 30.0) > 0 ? (Number(fuelPriceLocal) || 3.65) / Number(iceConsumption) : 0;
     evCost = ((Number(evConsumption) || 28.0) / 100) * (Number(electricityPriceLocal) || 0.16);
   }
   ```
   - Uses hardcoded regional baseline rates for electricity (€0.28/kWh, £0.26/kWh, $0.16/kWh).
   - Lacks home vs DC charging split.

3. **`src/context/UnitContext.jsx` (Lines 76–129)**:
   - Defines bidirectional conversions:
     - `convertMpgUsToRegion(mpgUs, regionId, isEv)`: for EV, maps `kWh/100mi` to `kWh/100km` via `val / 1.609344`.
     - `convertFuelPriceUsdGalToRegion(usdPerGal, regionId, isEv)`: for EV, price is treated directly as per-kWh and converted with `sys.currencyRate`.

---

## 2. Logic Chain

The step-by-step reasoning leading from observations to architectural conclusions:

```
[Observation 1.1] Four disparate, non-standardized powertrain representations across catalog, presets, archetypes, and components.
       │
       ▼
[Logic Step 1] Without a strict, canonical PowertrainType enum ('EV' | 'PHEV' | 'HEV' | 'ICE_PETROL' | 'ICE_DIESEL'), UI components and calculators use ad-hoc checks (e.g. preset.isEv || fuelType === 'electric'), leading to inconsistent behavior, especially for PHEVs and MHEVs.
       │
       ▼
[Observation 1.2 & 1.3] drivetrain-dmf-dsg includes 'ev' and 'single-speed-ev'; STANDARD_MILESTONES is static and unconditionally renders oil, spark plugs, DPF, and timing belts.
       │
       ▼
[Logic Step 2] Pure electric vehicles (EV) in the current application display and calculate costs for components they physically do not possess (Dual-Mass Flywheel, engine oil, DPF, spark plugs). This violates requirement R1 and undermines engineering credibility.
       │
       ▼
[Observation 1.4] EV-specific failure modes (Battery SoH degradation, OBC/ICCU, reducer oil, regen brake rust, high-mass bushing wear) are omitted from calculation engines and checklists.
       │
       ▼
[Logic Step 3] A dedicated branch for EV maintenance must be created. For EV:
       - Suppress 100% of ICE components.
       - Introduce EV-specific components and milestones.
       - Filter OBD fault codes to remove ICE codes (P0700, P0128) from EV presets.
       │
       ▼
[Observation 1.5] TcoCalculator computes EV energy using a single flat electricity tariff and treats PHEV as pure gasoline ICE.
       │
       ▼
[Logic Step 4] EV charging costs in the real world vary drastically between home AC (cheap) and public DC fast charging (3x–4x more expensive). PHEVs split mileage between battery and combustion. The energy calculation must incorporate:
       - Blended EV charging: (homeShare * homeTariff + dcShare * dcTariff)
       - Blended PHEV cycle: (electricShare * evConsumption * elecTariff) + (gasShare * iceConsumption * fuelTariff)
```

---

## 3. Caveats

1. **Backward Compatibility**:
   - The existing test suite (`npm.cmd test`, containing `driveledger.test.js`, `vehicleCatalog.test.js`, `vehicleArchetypes.test.js`) verifies all 65 presets across 4 badge categories and specific properties.
   - Any normalization must keep existing preset fields (`isEv`, `fuelType`, `powertrain`, `mpgUs`) populated as backward-compatible getters or properties while introducing `powertrainType`.
2. **Catalog Scope vs. Preset Scope**:
   - `vehicleCatalog.js` has 171 engines, whereas `vehiclePresets.js` has 65 curated presets. A universal helper function `resolvePowertrainType(vehicle)` must be capable of classifying ANY record from either source deterministically.
3. **PHEV Boundary Ambiguity**:
   - PHEVs have both an internal combustion engine (oil, plugs, exhaust) AND an electrified powertrain (HV battery, OBC, regen). They require both ICE service items AND electrified thermal/battery items, but must NOT be treated as pure EV.

---

## 4. Conclusion & Architectural Recommendations

To satisfy requirements R1, R2, and R3, the following architecture is recommended:

### 4.1 Powertrain Type Specification & Normalizer

Define a canonical module or export in `src/data/powertrainArchetypes.js` (or a dedicated `src/data/powertrainTypes.js`):

```typescript
export const POWERTRAIN_TYPES = {
  EV: 'EV',
  PHEV: 'PHEV',
  HEV: 'HEV',
  ICE_PETROL: 'ICE_PETROL',
  ICE_DIESEL: 'ICE_DIESEL',
};

/**
 * Resolves any vehicle preset or catalog object into canonical PowertrainType
 * @param {object} vehicle
 * @returns {'EV' | 'PHEV' | 'HEV' | 'ICE_PETROL' | 'ICE_DIESEL'}
 */
export function resolveCanonicalPowertrainType(vehicle = {}) {
  if (!vehicle) return 'ICE_PETROL';
  
  const isEv = Boolean(vehicle.isEv);
  const fuelType = String(vehicle.fuelType || '').trim().toLowerCase();
  const powertrain = String(vehicle.powertrain || '').trim().toLowerCase();
  const archetypeId = String(vehicle.archetypeId || '').toLowerCase();
  const label = [
    vehicle.id,
    vehicle.name,
    vehicle.powertrainLabel,
    vehicle.engineCode,
    vehicle.knownRiskNotes,
  ].filter(Boolean).join(' ').toLowerCase();

  // 1. Pure Electric (EV)
  if (
    isEv ||
    powertrain === 'ev' ||
    powertrain === 'electric' ||
    fuelType === 'electric' ||
    archetypeId === 'bev-lithium' ||
    label.includes('bev') ||
    label.includes('dual-motor') ||
    label.includes('electric')
  ) {
    return 'EV';
  }

  // 2. Plug-in Hybrid (PHEV)
  if (
    powertrain === 'phev' ||
    fuelType === 'plug-in hybrid' ||
    archetypeId === 'phev-turbo-dct' ||
    label.includes('phev') ||
    label.includes('plug-in') ||
    label.includes('ehybrid') ||
    label.includes('gte') ||
    label.includes('twin engine') ||
    label.includes('recharge phev') ||
    label.includes('330e') ||
    label.includes('45e') ||
    label.includes('t8 ')
  ) {
    return 'PHEV';
  }

  // 3. Full Hybrid (HEV) / Mild Hybrid (MHEV)
  if (
    powertrain === 'hybrid' ||
    powertrain === 'mhev' ||
    fuelType === 'hybrid' ||
    archetypeId === 'toyota-hybrid-ecvt' ||
    label.includes('hybrid') ||
    label.includes('hsd') ||
    label.includes('e:hev') ||
    label.includes('e-tech')
  ) {
    return 'HEV';
  }

  // 4. Diesel (ICE_DIESEL)
  if (
    fuelType === 'diesel' ||
    powertrain === 'diesel' ||
    archetypeId.includes('diesel') ||
    archetypeId.includes('tdi') ||
    label.includes('diesel') ||
    label.includes('tdi') ||
    label.includes('bluehdi') ||
    label.includes('ecoblue') ||
    label.includes('crdi') ||
    label.includes('d-4d') ||
    label.includes('dci')
  ) {
    return 'ICE_DIESEL';
  }

  // 5. Default Petrol (ICE_PETROL)
  return 'ICE_PETROL';
}
```

### 4.2 Maintenance Architecture & Component Branching

1. **`src/data/maintenanceData.js` Modifications**:
   - Fix `drivetrain-dmf-dsg`:
     - Change `applicablePowertrains`: remove `'ev'`. Keep `['diesel', 'gasoline-turbo', 'gasoline-na', 'hybrid']`.
     - Change `applicableTransmissions`: remove `'single-speed-ev'`.
   - Add new EV-specific components to `MAINTENANCE_COMPONENTS`:
     - `ev-reducer-gearbox-oil`:
       - `name`: 'EV Reduction Gearbox Fluid & Magnetic Sump Inspection'
       - `applicablePowertrains`: `['ev']`
       - `applicableTransmissions`: `['single-speed-ev', 'direct-drive', 'all']`
       - `serviceIntervalMiles`: 55,000, `criticalLimitMiles`: 80,000
       - `costsUsd`: dealership: [320, 650], independent: [180, 360], diyParts: [70, 140]
     - `ev-battery-degradation`:
       - `name`: 'High-Voltage Traction Battery Cell SoH & Degradation Tracking'
       - `applicablePowertrains`: `['ev']`
       - `applicableTransmissions`: `['all']`
       - Models LFP vs NMC capacity retention.
     - `ev-obc-iccu-electronics`:
       - `name`: 'On-Board Charger (OBC / ICCU) & High-Voltage Power Electronics'
       - `applicablePowertrains`: `['ev', 'phev']`
       - `applicableTransmissions`: `['all']`
       - `serviceIntervalMiles`: 65,000, `criticalLimitMiles`: 95,000
       - `costsUsd`: dealership: [2200, 4400], independent: [980, 1950], diyParts: [350, 800]
   - Adjust `suspension-brakes-chassis`:
     - Increase urban/weight penalty for EVs.
     - Highlight regenerative brake rotor rust pitting mechanism.

2. **`src/components/calculators/MaintenanceMilestones.jsx` Dynamic Filtering**:
   - Split milestones by powertrain or dynamically filter `STANDARD_MILESTONES`:
     - When `powertrainType === 'EV'`:
       - **Strictly suppress**: Engine oil, spark plugs, timing belt, automatic transmission fluid / torque converter, DPF, PCV valve, intake walnut decoke, fuel filter, HPFP, oxygen sensor.
       - **Include**:
         - 15k mi: EV tire rotation (inside shoulder wear check), brake pad slide pin inspection, fluid reservoir checks.
         - 30k mi: Brake fluid hydraulic flush, cabin HEPA/microfilter, 12V auxiliary battery test, suspension hydro-bushings inspection.
         - 60k mi: EV reduction gear oil renewal, battery thermal loop coolant hydrometer & pH test, brake rotor de-glazing / rust removal.
         - 90k mi: High-voltage battery capacity SoH % diagnosis, OBC/ICCU connector & terminal thermal scan, multi-link control arm ball joint torque check.
         - 120k mi: High-voltage chiller / Octovalve coolant flush & vacuum refill, drive unit subframe damping mounts inspection.
         - 150k mi: Deep power electronics capacitor & DC-DC converter evaluation, comprehensive battery pack cell delta-V telemetry scan.

3. **OBD Code Sanitization for EV Presets (`src/data/vehiclePresets.js`)**:
   - For `tesla-model-3-lr` and `tesla-model-y-lr`:
     - Replace `['U0100', 'P0A80', 'P0128', 'P0700']`
     - With EV-valid codes: `['U0100', 'P0A80', 'P0AA6', 'U0111']`
       - `U0100`: Lost Communication With ECM/PCM
       - `P0A80`: Replace Hybrid/EV Battery Pack
       - `P0AA6`: Hybrid/EV Battery Voltage System Isolation Fault
       - `U0111`: Lost Communication With Battery Energy Control Module

### 4.3 Energy Consumption & TCO Mathematical Blueprint

1. **Blended EV Charging Rate**:
   - Inputs:
     - `homeChargePct`: percentage of charging at home (default: 80%)
     - `homePricePerKwh`: home electricity tariff (default: $0.14/kWh US, €0.24/kWh EU)
     - `dcFastPricePerKwh`: public DC fast charging tariff (default: $0.48/kWh US, €0.65/kWh EU)
   - Formula:
     $$\text{Blended Tariff} = \left(\frac{\text{homeChargePct}}{100} \times \text{homePricePerKwh}\right) + \left(\frac{100 - \text{homeChargePct}}{100} \times \text{dcFastPricePerKwh}\right)$$
   - Annual EV Cost:
     $$\text{Annual Energy Cost} = \left(\frac{\text{Annual Miles}}{100}\right) \times \text{kWh/100mi} \times \text{Blended Tariff}$$

2. **Combined PHEV Energy Model**:
   - Inputs:
     - `electricSharePct`: percentage of annual distance driven on battery (default: 55%)
     - `evEfficiencyKwh100`: electric consumption (default: 26 kWh/100mi)
     - `iceMpg`: combustion engine fuel economy in hybrid mode (default: 32 MPG)
   - Formula:
     $$\text{Annual Electric Cost} = \left(\frac{\text{Annual Miles} \times \text{electricSharePct} / 100}{100}\right) \times \text{evEfficiencyKwh100} \times \text{Blended Tariff}$$
     $$\text{Annual Gasoline Cost} = \left(\frac{\text{Annual Miles} \times (100 - \text{electricSharePct}) / 100}{\text{iceMpg}}\right) \times \text{Fuel Price}$$
     $$\text{Total Annual Energy Cost} = \text{Annual Electric Cost} + \text{Annual Gasoline Cost}$$

3. **Battery Degradation SoH % Model**:
   - Baseline degradation by chemistry over time $t$ (years) and distance $d$ (miles):
     - **LFP**: Flatter curve, high cycle life.
       $$\text{SoH}_{\text{LFP}} = 100 - 3.0 - (d / 25000) \times 0.95 - (t \times 0.65) - (\text{dcFastPct} \times 0.02)$$
     - **NMC**: Higher degradation if kept at 100% SoC and rapid DC fast charged.
       $$\text{SoH}_{\text{NMC}} = 100 - 4.5 - (d / 20000) \times 1.25 - (t \times 0.95) - (\text{dcFastPct} \times 0.05)$$
   - Minimum bound: $70\%$, maximum: $100\%$.

---

## 5. Verification Method

To independently verify the findings and any future implementation:

1. **Verify Existing Tests**:
   - Execute:
     ```powershell
     npm.cmd test
     ```
   - All 10 test suites must pass cleanly with exit code 0.

2. **Verify EV ICE Contamination Absence**:
   - In any unit test or runtime inspection:
     - Select `tesla-model-3-lr` or `vw-id4-pro-bev-norm` (`isEv: true`, `powertrainType: 'EV'`).
     - Query evaluated components from `MaintenanceRiskMatrix`:
       ```javascript
       const components = evaluatedComponents.map(c => c.componentId);
       assert.ok(!components.includes('timing-assembly'));
       assert.ok(!components.includes('dpf-egr-scr-injectors'));
       assert.ok(!components.includes('hpfp-turbo-vnt'));
       assert.ok(!components.includes('gdi-intake-pcv-ignition'));
       assert.ok(!components.includes('drivetrain-dmf-dsg'));
       ```
     - Query milestones checklist items in `MaintenanceMilestones`:
       ```javascript
       const items = activeMilestones.flatMap(m => m.items).map(i => i.name.toLowerCase());
       assert.ok(!items.some(t => t.includes('engine oil') || t.includes('spark plug') || t.includes('timing belt') || t.includes('dpf')));
       ```

3. **Verify EV Specific Items Presence**:
   - Confirm EV view renders:
     - High-voltage battery degradation (SoH %)
     - Reduction gearbox fluid renewal
     - On-board charger (OBC) / power electronics check
     - Regenerative brake rotor rust prevention

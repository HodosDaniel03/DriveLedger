# Review & Adversarial Challenge Report — Milestone 1: Powertrain Branching & Architecture

**Reviewer**: Reviewer 1 (Archetype: Reviewer & Adversarial Critic)  
**Target Milestone**: Milestone 1 (Powertrain Branching & Architecture)  
**Reviewed Artifacts**:
- `src/data/powertrainTypes.js`
- `src/data/powertrainArchetypes.js`
- `src/data/maintenanceData.js`
- `src/components/common/vehicle/vehicleArchetypes.js`
- `src/data/vehiclePresets.js`
- `src/components/calculators/MaintenanceMilestones.jsx`
- `tests/powertrainBranching.test.js`
- Worker M1 handoff: `.agents/teamwork/worker_m1/handoff.md`

---

## 1. Executive Summary & Verdict

**Verdict**: **REQUEST_CHANGES**

While Worker M1 achieved substantial foundation work (canonical `POWERTRAIN_TYPES` enum, 7 dedicated EV component dossiers, 6-stage EV maintenance milestones, and unit test coverage), adversarial stress-testing across the full 179 vehicle preset database and catalog revealed **critical classification bugs** in `resolvePowertrainType` and `resolveArchetypeIdForPreset`. 

Due to over-eager substring matching on `knownRiskNotes`, multiple prominent diesel and gasoline vehicles (e.g. Audi A6 3.0 TDI, Ford Transit Custom 2.0 EcoBlue, Fiat Panda 1.2 Fire) are erroneously resolved as **100% Pure Electric (`EV`)**, causing all combustion maintenance (timing belt, DPF, engine oil) to be stripped and replaced with EV reduction gear and traction battery items. Furthermore, Peugeot/DS/Audi gasoline and diesel vehicles are misclassified as **PHEV** due to substrings matching transmission names (`EAT8 ` -> `t8 `) and engine names (`TFSI evo` -> `tfsi e`).

---

## 2. Review Report & Findings

### [Critical] Finding 1: Over-Eager Substring Matching Erroneously Classifies ICE Vehicles as Pure EV

- **Location**: `src/data/powertrainTypes.js`, lines 55–82 (`resolvePowertrainType`)
- **What**:
  `resolvePowertrainType` concatenates `vehicle.knownRiskNotes` into `label` and checks:
  ```javascript
  (label.includes('electric') && !label.includes('hybrid') && !label.includes('phev'))
  ```
  This check executes **before** checking `fuelType === 'diesel'`, `powertrain === 'diesel'`, or `fuelType === 'gasoline'`, and completely ignores `isEv === false`.
- **Why this is a problem**:
  Any internal combustion vehicle whose known defect description mentions words like "electrical", "electric steering rack", "electric parking brake", or "electric power steering" gets classified as `POWERTRAIN_TYPES.EV`.
  In `VEHICLE_PRESETS`, the following 6 non-EV vehicles are falsely classified as Pure EV:
  1. `audi-a6-30-tdi` (Audi A6 50 TDI Quattro 3.0 V6 Diesel, 286 HP) — defect note mentions "electrical shutdown"
  2. `audi-a6-c7-20-tdi` (Audi A6 2.0 TDI Ultra S-Tronic Diesel, 190 HP) — defect note mentions "Electric steering rack"
  3. `toyota-avensis-t27-20-d4d` (Toyota Avensis 2.0 D-4D Diesel, 126 HP) — defect note mentions "Electric parking brake"
  4. `ford-transit-custom-20-ecoblue` (Ford Transit Custom 2.0 EcoBlue Diesel, 130 HP) — defect note mentions "electrical short circuits"
  5. `fiat-panda-12-fire` (Fiat Panda 1.2 Fire Gasoline, 69 HP) — defect note mentions "Electric power steering"
  6. `honda-jazz-15-ehev` (Honda Jazz HEV Full Hybrid, 109 HP) — defect note mentions "Electric power steering"
  **Impact**: These diesel and petrol vehicles have all their real maintenance items (DPF, timing assembly, DMF, HPFP, motor oil) purged, display "Pure EV · 0 ICE Fluids", receive EV reduction gear fluid schedules, and have fuel cost calculated in kWh/100mi instead of diesel/gasoline!
- **Suggestion**:
  1. Restrict EV detection to authoritative fields first:
     ```javascript
     if (vehicle.isEv === true || fuelType === 'electric' || powertrain === 'ev' || archetypeId === 'bev-lithium') {
       return POWERTRAIN_TYPES.EV;
     }
     ```
  2. Do not match general substrings in `knownRiskNotes`. If matching `label`, strictly check vehicle name/model (e.g. `\b(bev|electric)\b`), and ensure `fuelType !== 'diesel' && fuelType !== 'gasoline' && !vehicle.isEv === false`.

---

### [Critical] Finding 2: False PHEV Classification Caused by "EAT8" and "TFSI evo" Substring Collisions

- **Location**: `src/data/powertrainTypes.js`, lines 84–103, and `src/data/powertrainArchetypes.js`, lines 406–418
- **What**:
  `resolvePowertrainType` and `resolveArchetypeIdForPreset` include pattern checks intended for specific vehicle variants:
  - `label.includes('t8 ')` (intended for Volvo T8 Twin-Engine Recharge)
  - `label.includes('tfsi e')` (intended for Audi TFSI e plug-in hybrid models)
- **Why this is a problem**:
  - `label.includes('t8 ')` matches `'EAT8 '` (the standard 8-speed automatic transmission on Stellantis Peugeot, Citroën, and DS gasoline and diesel models).
  - `label.includes('tfsi e')` matches any Audi engine with `"TFSI"` followed by `"evo"` (e.g. `"1.5 TFSI evo"`, where `"tfsi "` + `"e"` matches `"tfsi e"`).
  Consequently, 8 pure combustion vehicles in `VEHICLE_PRESETS` are erroneously classified as `PHEV`:
  1. `peugeot-208-12-puretech` (1.2 PureTech Petrol, EAT8)
  2. `peugeot-308-15-bluehdi` (1.5 BlueHDi Diesel, EAT8)
  3. `peugeot-508-20-bluehdi` (2.0 BlueHDi Diesel, EAT8)
  4. `peugeot-3008-15-bluehdi` (1.5 BlueHDi Diesel, EAT8)
  5. `ds-7-20-bluehdi` (2.0 BlueHDi Diesel, EAT8)
  6. `ds4-12-puretech` (1.2 PureTech Petrol, EAT8)
  7. `audi-a3-15-tfsi` (1.5 TFSI evo COD Gasoline)
  8. `audi-a3-35-tfsi-norm` (1.5 TFSI EA211 evo Gasoline)
- **Suggestion**:
  Use word-boundary regexes or prefix checks (e.g., `/\b(t8\s+twin|t8\s+recharge|t8\s+awd)\b/i` and `/\btfsi\s+e\b/i` where the `e` is not followed by `vo`/`vo2`), and ensure `fuelType.includes('plug-in') || powertrain === 'phev'` remains the primary arbiter.

---

### [Major] Finding 3: Omission of `EV_MILESTONE_IMPACT_MAP` in Individual Milestone Item Rendering

- **Location**: `src/components/calculators/MaintenanceMilestones.jsx`, line 501
- **What**:
  Inside the checklist item mapping loop:
  ```javascript
  const impact = MILESTONE_IMPACT_MAP[it.id];
  ```
- **Why this is a problem**:
  Line 332 correctly uses `const impact = MILESTONE_IMPACT_MAP[itemId] || EV_MILESTONE_IMPACT_MAP[itemId];` to calculate total live risk deduction and restored reliability points. However, on line 501, `EV_MILESTONE_IMPACT_MAP` was omitted.
  Because all EV milestone items (e.g. `15k-ev-tires`, `60k-ev-reduction-oil`, `90k-ev-soh`) have IDs defined in `EV_MILESTONE_IMPACT_MAP` rather than `MILESTONE_IMPACT_MAP`, `impact` evaluates to `undefined` for all EV checklist rows. As a result, the individual credit badge (`-creditUsd · +bonusPts pts`) fails to render next to EV checklist items.
- **Suggestion**:
  Update line 501 to:
  ```javascript
  const impact = MILESTONE_IMPACT_MAP[it.id] || EV_MILESTONE_IMPACT_MAP[it.id];
  ```

---

### [Major] Finding 4: LFP Battery Degradation State Clamping Precludes Warranty Claim Eligibility

- **Location**: `src/data/powertrainTypes.js`, lines 403, 415, 423 (`calculateBatterySoh`)
- **What**:
  For LFP battery chemistry:
  ```javascript
  floorSoh = 70.0;
  ...
  const sohPct = +(Math.min(100.0, Math.max(floorSoh, rawSoh))).toFixed(1);
  ...
  if (sohPct < 70.0 && years <= 8 && odo <= 100000) {
    warrantyStatus = 'WARRANTY_CLAIM_ELIGIBLE';
  } else if (sohPct < 80.0) {
    warrantyStatus = 'DEGRADED';
  }
  ```
- **Why this is a problem**:
  Because `sohPct` is clamped to a minimum of `floorSoh = 70.0`, `sohPct < 70.0` is mathematically impossible for an LFP battery. Even if an LFP battery suffers severe abnormal cell degradation, `sohPct` will be locked at `70.0%` and the warranty status will evaluate to `'DEGRADED'` instead of `'WARRANTY_CLAIM_ELIGIBLE'`.
- **Suggestion**:
  Lower `floorSoh` (e.g. to 50.0%) so catastrophic degradation is visible, or update the condition to `sohPct <= 70.0` or evaluate warranty eligibility using `rawSoh < 70.0`.

---

### [Minor] Finding 5: Falsy Zero Tariff Values Fall Back to Defaults in Energy Calculators

- **Location**: `src/data/powertrainTypes.js`, lines 206–207, 280
- **What**:
  ```javascript
  const homeRate = Math.max(0, Number(homeTariffUsdPerKwh) || 0.14);
  const dcRate = Math.max(0, Number(dcFastTariffUsdPerKwh) || 0.48);
  const fuelPrice = Math.max(0, Number(fuelPriceUsdPerGal) || 3.85);
  ```
- **Why this is a problem**:
  If a user specifies `0` (e.g. 100% free home solar charging, or free municipal DC charging), `Number(0) || 0.14` evaluates to `0 || 0.14` which yields `0.14`. Free charging is overridden by the non-zero default.
- **Suggestion**:
  Use nullish coalescing:
  ```javascript
  const homeRate = Math.max(0, Number(homeTariffUsdPerKwh ?? 0.14));
  ```

---

## 3. Adversarial Challenge & Stress-Test Results

**Overall Risk Assessment**: **HIGH** (due to widespread catalog misclassification)

| Scenario / Attack Vector | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|
| Query `resolvePowertrainType` on `audi-a6-30-tdi` (3.0 V6 TDI, 286 HP) | `ICE_DIESEL` | Returns `EV` | **FAIL** |
| Query `resolvePowertrainType` on `ford-transit-custom-20-ecoblue` (2.0 EcoBlue Diesel) | `ICE_DIESEL` | Returns `EV` | **FAIL** |
| Query `resolvePowertrainType` on `peugeot-208-12-puretech` (1.2 PureTech EAT8) | `ICE_PETROL` | Returns `PHEV` | **FAIL** |
| Query `resolvePowertrainType` on `audi-a3-15-tfsi` (1.5 TFSI evo Gasoline) | `ICE_PETROL` | Returns `PHEV` | **FAIL** |
| Render EV milestone checklist item badges in `MaintenanceMilestones` | Show `-creditUsd · +bonusPts` | Badges missing (undefined `impact`) | **FAIL** |
| Calculate LFP SoH with high mileage causing <70% health within 8yr warranty | `WARRANTY_CLAIM_ELIGIBLE` | Returns `DEGRADED` (clamped to 70.0) | **FAIL** |
| Calculate EV cost with free home solar (`homeTariffUsdPerKwh: 0`) | $0 home charging cost | Charges $0.14/kWh (falsy `||`) | **FAIL** |
| Unit tests (`tests/powertrainBranching.test.js`) execution | 6/6 pass | 6/6 pass (only tested synthetic inputs & Tesla) | PASS |
| Build command (`npm.cmd run build`) | Vite build succeeds | Exit code 0, clean build | PASS |

---

## 4. Integrity Check Assessment

- **Hardcoded test results in source code**: None detected. Formulas are algorithmic.
- **Facade implementations**: None detected. Components and calculations are fully implemented.
- **Shortcuts bypassing task**: None detected. Worker implemented comprehensive dossiers and milestone structures.
- **Fabricated verification outputs**: None detected. Test output matches local execution.
- **Diagnosis of failure**: The failure is an **architectural pattern-matching defect** in `resolvePowertrainType` and `resolveArchetypeIdForPreset`. The unit tests written by Worker M1 only tested synthetic objects (`{ isEv: true }`, `{ fuelType: 'Diesel' }`) and the 2 Tesla presets, failing to test the resolver against the actual 179 vehicle presets in `src/data/vehiclePresets.js`.

---

## 5. Handoff Protocol Specification (5 Components)

### 1. Observation
- `src/data/powertrainTypes.js:79`:
  `(label.includes('electric') && !label.includes('hybrid') && !label.includes('phev'))`
- Running adversarial verification on `VEHICLE_PRESETS`:
  `False EVs count: 6` (`audi-a6-30-tdi`, `audi-a6-c7-20-tdi`, `toyota-avensis-t27-20-d4d`, `honda-jazz-15-ehev`, `fiat-panda-12-fire`, `ford-transit-custom-20-ecoblue`).
- Running adversarial verification on PHEV matching:
  `False PHEVs count: 8` (`peugeot-208-12-puretech`, `peugeot-308-15-bluehdi`, `audi-a3-15-tfsi`, `peugeot-508-20-bluehdi`, `peugeot-3008-15-bluehdi`, `ds-7-20-bluehdi`, `ds4-12-puretech`, `audi-a3-35-tfsi-norm`).
- `src/components/calculators/MaintenanceMilestones.jsx:501`:
  `const impact = MILESTONE_IMPACT_MAP[it.id];` omits `EV_MILESTONE_IMPACT_MAP[it.id]`.
- Build & Tests:
  - `npm.cmd test`: 15 passed, 0 failed, 1 skipped.
  - `npm.cmd run build`: 0 errors, build in 3.09s.

### 2. Logic Chain
1. *Observation*: `label` is created by concatenating vehicle metadata including `knownRiskNotes`.
2. *Observation*: `knownRiskNotes` contains technical text such as "electrical shutdown" and "electric steering rack".
3. *Observation*: `resolvePowertrainType` checks `(label.includes('electric') && !label.includes('hybrid') && !label.includes('phev'))` before checking `fuelType === 'diesel'` or checking `isEv === false`.
4. *Inference*: Diesel and gasoline vehicles are misclassified as `EV`.
5. *Observation*: For `EV`, `filterComponentsForPowertrain` eliminates 100% of ICE components and replaces them with EV components.
6. *Inference*: Users selecting an Audi A6 3.0 TDI or Ford Transit EcoBlue see 0 ICE maintenance items and receive battery/reduction gear schedules. This directly breaks Requirement R1 and R2.

### 3. Caveats
- The underlying 7 EV component dossiers in `maintenanceData.js` and the 6-stage `EV_MILESTONES` schedule are well-crafted and comply with the required thermodynamic wear penalties (1.36x–1.48x).
- The production build passes without bundle or syntax errors.
- Once the regex/pattern-matching in `resolvePowertrainType` and `resolveArchetypeIdForPreset` is tightened and the 3 secondary bugs are fixed, Milestone 1 will be in excellent condition.

### 4. Conclusion
Explicit Verdict: **REQUEST_CHANGES**.
Worker M1 must address:
1. `resolvePowertrainType` loose substring matching (fix false EV and false PHEV classifications across `VEHICLE_PRESETS`).
2. `resolveArchetypeIdForPreset` `t8 ` and `tfsi e` pattern matching.
3. `MaintenanceMilestones.jsx:501` add `|| EV_MILESTONE_IMPACT_MAP[it.id]`.
4. `calculateBatterySoh` LFP warranty claim condition / floor clamp.
5. `calculateEvEnergyCost` nullish coalescing for zero tariff inputs.
6. Add unit test assertions in `tests/powertrainBranching.test.js` verifying that `audi-a6-30-tdi` resolves to `ICE_DIESEL`, `peugeot-208-12-puretech` resolves to `ICE_PETROL`, and `fiat-panda-12-fire` resolves to `ICE_PETROL`.

### 5. Verification Method
To independently verify the required fixes:
1. Run Node command checking `VEHICLE_PRESETS` powertrain distribution:
   ```powershell
   node -e "import('./src/data/vehiclePresets.js').then(m => { const falseEvs = m.VEHICLE_PRESETS.filter(p => p.isEv === false && m.resolvePowertrainType(p) === 'EV'); console.log('False EVs count:', falseEvs.length); process.exit(falseEvs.length === 0 ? 0 : 1); });"
   ```
   *Expected result*: `False EVs count: 0`, exit code 0.
2. Run test suite:
   ```powershell
   npm.cmd test
   ```
3. Run build:
   ```powershell
   npm.cmd run build
   ```

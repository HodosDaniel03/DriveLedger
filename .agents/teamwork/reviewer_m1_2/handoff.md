# Review & Adversarial Challenge Report — Milestone 1 (Powertrain Branching & Architecture)

**Reviewer**: Reviewer 2 (Adversarial Critic)  
**Target Worker**: Worker M1  
**Target Milestone**: Milestone 1 — Powertrain Branching & Architecture  
**Working Directory**: `d:\Antigravity_projects\DriveLedger\.agents\teamwork\reviewer_m1_2`  
**Date**: 2026-10-31  

---

## Review Summary

**Verdict**: **REQUEST_CHANGES**

Worker M1 has established substantial foundational architecture: canonical `PowertrainType` definitions, 0-ICE component exclusion rules, 7 detailed EV component dossiers in `src/data/maintenanceData.js`, a 6-interval EV milestone roadmap in `src/components/calculators/MaintenanceMilestones.jsx`, and real mathematical functions for EV/PHEV energy costs and battery degradation (LFP vs. NMC).

However, rigorous adversarial stress-testing against the real 171-vehicle catalog revealed **a Critical Regression in `resolvePowertrainType` where 20 real vehicles are misclassified — including pure internal combustion Diesel and Gasoline vehicles (Audi A6 3.0 TDI, Fiat Panda 1.2 Fire, Ford Transit Custom 2.0 EcoBlue, Toyota Avensis 2.0 D-4D) being classified as `EV` (Pure Electric with 0 ICE fluids)**. Additionally, an omission in `MaintenanceMilestones.jsx` breaks EV milestone credit badge rendering.

---

## 1. Observation

### Observation 1: Critical Misclassification in `src/data/powertrainTypes.js` (lines 55–144)
In `src/data/powertrainTypes.js`:
```javascript
55:   const label = [
56:     vehicle.id,
57:     vehicle.name,
58:     vehicle.shortName,
59:     vehicle.powertrainLabel,
60:     vehicle.engineCode,
61:     vehicle.transmissionLabel,
62:     vehicle.segment,
63:     vehicle.knownRiskNotes,
64:   ]
65:     .filter(Boolean)
66:     .join(' ')
67:     .toLowerCase();
68: 
69:   // 1. Pure Electric (EV)
...
79:     (label.includes('electric') && !label.includes('hybrid') && !label.includes('phev'))
80:   ) {
81:     return POWERTRAIN_TYPES.EV;
82:   }
```
Direct command execution:
```powershell
node -e "import('./src/data/vehiclePresets.js').then(m => { ['audi-a6-30-tdi', 'fiat-panda-12-fire', 'ford-transit-custom-20-ecoblue', 'honda-jazz-15-ehev', 'peugeot-208-12-puretech', 'mazda-cx5-skyactiv'].forEach(id => { const p = m.getPresetById(id); console.log(id, '->', m.resolvePowertrainType(p)); }); })"
```
Verbatim command output:
```
audi-a6-30-tdi -> EV
fiat-panda-12-fire -> EV
ford-transit-custom-20-ecoblue -> EV
honda-jazz-15-ehev -> EV
peugeot-208-12-puretech -> PHEV
mazda-cx5-skyactiv -> ICE_DIESEL
```

Root Causes Identified:
1. `audi-a6-30-tdi` (Diesel): `knownRiskNotes` contains *"48V starter-generator (BSG) recall causes sudden electrical shutdown."* Substring `"electrical"` matches `"electric"`, triggering `label.includes('electric')` and returning `EV`.
2. `fiat-panda-12-fire` (Gasoline): `knownRiskNotes` contains *"Electric power steering Dualdrive torque sensor..."*. Triggers `label.includes('electric')` and returns `EV`.
3. `ford-transit-custom-20-ecoblue` (Diesel): `knownRiskNotes` contains *"...Continental fuel injectors develop internal electrical short circuits..."*. Substring `"electrical"` matches `"electric"`, returning `EV`.
4. `toyota-avensis-t27-20-d4d` (Diesel): `knownRiskNotes` contains *"...electric parking brake actuator motor corrosion."* Triggers `label.includes('electric')` and returns `EV`.
5. `honda-jazz-15-ehev` (Hybrid): `engineCode` contains `"dual electric motor"`, but `name` uses `"e:hev"` rather than `"hybrid"`. Triggers `label.includes('electric') && !label.includes('hybrid')`, returning `EV`.
6. `peugeot-208-12-puretech` & `peugeot-308-15-bluehdi`: Line 99 checks `label.includes('t8 ')`. The transmission string `"EAT8 automatic"` contains `"t8 "`, causing both gasoline and diesel models to be misclassified as `PHEV`.
7. `mazda-cx5-skyactiv` (Gasoline NA): Line 140 checks `label.includes('skyactiv-d')`. The transmission label `"SkyActiv-Drive 6-Speed Automatic"` contains `"skyactiv-d"`, misclassifying this gasoline SUV as `ICE_DIESEL`.
8. `NORMALIZED_COMPACT_MODELS` (`src/data/powertrainArchetypes.js`):
   - `bmw-520d-g31-touring-norm` (2.0d diesel) resolves to `ICE_PETROL` because `archetypeId: 'bmw-b47-zf8'` was not recognized as diesel.
   - `audi-a3-35-tfsi-norm` (1.5 TFSI petrol) resolves to `PHEV` because `label.includes('tfsi e')` matches `"1.5 tfsi ea211 evo"`.

Across the 171 catalog engines (`getAllEnginesFlat()`), 20 engines are misclassified.

### Observation 2: Missing `EV_MILESTONE_IMPACT_MAP` in Item Rendering Loop in `src/components/calculators/MaintenanceMilestones.jsx`
In `MaintenanceMilestones.jsx`, lines 332-333:
```javascript
332:         const impact = MILESTONE_IMPACT_MAP[itemId] || EV_MILESTONE_IMPACT_MAP[itemId];
```
However, in the JSX item rendering loop at line 500:
```javascript
497:               <div className="mt-3 grid gap-2 sm:grid-cols-2">
498:                 {m.items.map((it) => {
499:                   const checked = !!completedItems[it.id];
500:                   const impact = MILESTONE_IMPACT_MAP[it.id];
...
541:                             {impact && (checked || impact.major) && (
542:                               <span className={...}>
543:                                 {checked ? '✓ ' : ''}
544:                                 -{formatCurrency(impact.creditUsd)} · +{impact.bonusPts} pts
545:                               </span>
546:                             )}
```
All EV milestone items (`15k-ev-tires`, `60k-ev-reduction-oil`, `90k-ev-soh`, etc.) are defined in `EV_MILESTONE_IMPACT_MAP`. Line 500 references only `MILESTONE_IMPACT_MAP[it.id]`, which evaluates to `undefined` for all EV items. Consequently, lines 541–553 never execute for EV items, and the financial risk credit badge is never displayed in the UI.

### Observation 3: Incomplete Powertrain Contract Integration in `src/components/calculators/MaintenanceRiskMatrix.jsx`
In `MaintenanceRiskMatrix.jsx`, line 138–140:
```javascript
138:     const relevant = MAINTENANCE_COMPONENTS.filter((comp) =>
139:       comp.applicablePowertrains.includes(activePreset.powertrain || 'diesel')
140:     );
```
Line 146–153:
```javascript
146:       const health = evaluateComponentHealth({
147:         component: comp,
148:         physicalOdometerMiles,
149:         urbanTripSharePct,
150:         oilIntervalId,
151:         serviceHistoryId: 'verified',
152:         transmissionId: activePreset.transmission || 'dct-dsg',
153:       });
```
`MaintenanceRiskMatrix.jsx` does not utilize `filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, activePreset)`. Furthermore, `evaluateComponentHealth` is called without passing `powertrainType` or `vehicle`, bypassing the EV component null-check guard implemented in `evaluateComponentHealth` (lines 628–636 of `maintenanceData.js`).

### Observation 4: Verified Test Execution
Direct command execution:
```powershell
npm.cmd test
```
Result:
- 15 tests passed, 0 failed, 1 skipped (`tests/jevCatalogJudge.test.js` due to missing optional API key).
- Duration: 806 ms.

Direct build command:
```powershell
npm.cmd run build
```
Result:
- Vite built 1,621 modules in 3.07s into `dist/` with exit code 0.

---

## 2. Logic Chain

1. *Observation 1*: `resolvePowertrainType` was designed to infer vehicle powertrain types from object attributes. By combining `knownRiskNotes`, `segment`, and `transmissionLabel` into a single string `label` and prioritizing fuzzy substring searches (`electric`, `t8 `, `tfsi e`, `skyactiv-d`) over explicit `fuelType` and `powertrain` fields:
   - Combustion vehicles mentioning electrical components (power steering, parking brake, starter-generator, injector wiring) are categorized as `POWERTRAIN_TYPES.EV`.
   - Vehicles equipped with Aisin EAT8 transmissions are categorized as `POWERTRAIN_TYPES.PHEV`.
   - Gasoline vehicles with SkyActiv-Drive transmissions are categorized as `POWERTRAIN_TYPES.ICE_DIESEL`.
2. *Impact on Application*: When a user navigates to `MaintenanceMilestones` for an Audi A6 3.0 TDI or Fiat Panda 1.2 Fire:
   - The UI displays the badge `"Pure EV · 0 ICE Fluids"`.
   - Engine oil, timing belts, DPF, and spark plug services are completely suppressed.
   - The user is instructed to service a high-voltage traction battery, an Octovalve heat pump, and an EV reduction gearbox on an internal combustion vehicle.
   - In energy calculators, charging tariffs in kWh are calculated instead of liquid fuel costs.
3. *Observation 2*: While Worker M1 created `EV_MILESTONE_IMPACT_MAP` and correctly referenced it in calculation line 332, omitting it in render loop line 500 causes a visible UI regression where EV checklist items fail to display the deducted risk credit badge (`-$X · +Y pts`).
4. *Observation 3*: The new `filterComponentsForPowertrain` helper and `powertrainType` parameter on `evaluateComponentHealth` were not plumbed into `MaintenanceRiskMatrix.jsx`, leaving component resolution vulnerable if `powertrain` string is missing or non-standard.
5. *Conclusion*: Because the resolver defect invalidates core telemetry across 20 real vehicles in the vehicle database, the milestone does not meet the acceptance criteria for robustness and correctness. A verdict of `REQUEST_CHANGES` is required.

---

## 3. Findings

### Finding 1 [CRITICAL]: Flawed Substring Inference in `resolvePowertrainType` Misclassifies 20 Catalog Vehicles
- **What**: 20 out of 171 catalog engine records are misclassified. Pure Diesel and Gasoline cars are resolved as `EV` and `PHEV`.
- **Where**: `src/data/powertrainTypes.js`, lines 55–144.
- **Why**: 
  1. `knownRiskNotes` and `transmissionLabel` are concatenated into `label`.
  2. The EV check `label.includes('electric')` executes before checking `vehicle.fuelType`. Words like `"electrical"`, `"electric power steering"`, and `"electric parking brake"` falsely trigger pure EV classification.
  3. `label.includes('t8 ')` matches `"eat8 "`.
  4. `label.includes('tfsi e')` matches `"tfsi ea211"`.
  5. `label.includes('skyactiv-d')` matches `"skyactiv-drive"`.
  6. In `hydrateVehiclePreset` (`powertrainArchetypes.js:475`), `powertrainType` resolves before archetype default `fuelType` and `powertrain` are merged.
- **Suggestion**:
  1. Follow the deterministic interface contract from `PROJECT.md` §Interface Contracts:
     - Check explicit fields first: `isEv === true`, `fuelType === 'Electric'`, `powertrain === 'ev'` $\to$ `EV`.
     - `fuelType === 'Diesel'`, `powertrain === 'diesel'` $\to$ `ICE_DIESEL`.
     - `fuelType === 'Gasoline'`, `powertrain === 'gasoline-turbo'`, `powertrain === 'gasoline-na'` $\to$ `ICE_PETROL`.
     - `fuelType === 'Hybrid'`, `powertrain === 'hybrid'` $\to$ `HEV`.
     - `fuelType === 'Plug-in Hybrid'`, `powertrain === 'phev'` $\to$ `PHEV`.
  2. Exclude `knownRiskNotes` from the label used for powertrain type inference. Diagnostic risk notes describing electrical actuators or auxiliary pumps must never dictate vehicle propulsion architecture.
  3. Use word-boundary or distinct token matching for transmission/model keywords (e.g. `\bt8\b`, `\btfsi\s*e\b`, `\bskyactiv-d\b`).
  4. Ensure `hydrateVehiclePreset` applies archetype defaults before calling `resolvePowertrainType`.

### Finding 2 [MAJOR]: EV Milestone Item Badges Missing in `MaintenanceMilestones.jsx`
- **What**: Financial risk credit badges (`-$XX · +X pts`) do not render on EV milestone checklist items.
- **Where**: `src/components/calculators/MaintenanceMilestones.jsx`, line 500.
- **Why**: Line 500 uses `const impact = MILESTONE_IMPACT_MAP[it.id];`. Because EV item IDs exist in `EV_MILESTONE_IMPACT_MAP`, `impact` is `undefined`.
- **Suggestion**:
  Update line 500 to:
  ```javascript
  const impact = MILESTONE_IMPACT_MAP[it.id] || EV_MILESTONE_IMPACT_MAP[it.id];
  ```

### Finding 3 [MAJOR]: `MaintenanceRiskMatrix.jsx` Does Not Use `filterComponentsForPowertrain`
- **What**: Component filtering in the Risk Matrix still uses raw `applicablePowertrains.includes(activePreset.powertrain || 'diesel')` and omits `powertrainType` when calling `evaluateComponentHealth`.
- **Where**: `src/components/calculators/MaintenanceRiskMatrix.jsx`, lines 138–153.
- **Why**: Bypasses the unified powertrain architecture created in `powertrainTypes.js` and `maintenanceData.js`.
- **Suggestion**:
  Use `filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, activePreset)` and pass `powertrainType: resolvePowertrainType(activePreset)` to `evaluateComponentHealth`.

### Finding 4 [MINOR]: Windows ExecutionPolicy Warning for `npm test`
- **What**: Running `npm test` directly in PowerShell can fail on Windows if `npm.ps1` execution is restricted.
- **Where**: CLI execution.
- **Suggestion**: Document in development guides to use `npm.cmd test` or `npm.cmd run build` on Windows.

---

## 4. Verified Claims

| Claim from Worker M1 | Verified via | Result | Notes |
|----------------------|--------------|--------|-------|
| Canonical `POWERTRAIN_TYPES` enum exported | `tests/powertrainBranching.test.js` | PASS | Enum values match requirement R1 |
| 0 ICE components for pure EV in `filterComponentsForPowertrain` | `tests/powertrainBranching.test.js` | PASS | Timing, DMF, DPF, HPFP, GDI excluded |
| 7 EV component dossiers with 1.35x–1.55x penalties | Code inspection `src/data/maintenanceData.js` | PASS | Values: 1.36 to 1.48 |
| EV presets sanitized of `P0700` and `P0128` | Code inspection & runtime check | PASS | Presets have `['U0100', 'P0A80']` |
| EV & PHEV energy cost formulas | Math trace & test assertions | PASS | Formulas calculate blended AC/DC tariffs and PHEV split correctly |
| High-voltage battery SoH degradation curves | Math trace & test assertions | PASS | LFP vs. NMC curves correctly modeled |
| Automated test suite passes | `npm.cmd test` | PASS | 15 passed, 0 failed, 1 skipped |
| Production build passes | `npm.cmd run build` | PASS | Clean Vite build in 3.07s |
| Robustness across vehicle catalog | Adversarial stress test | **FAIL** | 20 catalog vehicles misclassified by `resolvePowertrainType` |

---

## 5. Adversarial Stress Test Results

| Attack Scenario | Expected Behavior | Actual Behavior | Result |
|-----------------|-------------------|-----------------|--------|
| Resolve `audi-a6-30-tdi` (3.0L V6 TDI Diesel) | `POWERTRAIN_TYPES.ICE_DIESEL` | `POWERTRAIN_TYPES.EV` | **FAIL** |
| Resolve `fiat-panda-12-fire` (1.2L Petrol NA) | `POWERTRAIN_TYPES.ICE_PETROL` | `POWERTRAIN_TYPES.EV` | **FAIL** |
| Resolve `ford-transit-custom-20-ecoblue` (Diesel) | `POWERTRAIN_TYPES.ICE_DIESEL` | `POWERTRAIN_TYPES.EV` | **FAIL** |
| Resolve `honda-jazz-15-ehev` (Hybrid) | `POWERTRAIN_TYPES.HEV` | `POWERTRAIN_TYPES.EV` | **FAIL** |
| Resolve `peugeot-208-12-puretech` (Gasoline EAT8) | `POWERTRAIN_TYPES.ICE_PETROL` | `POWERTRAIN_TYPES.PHEV` | **FAIL** |
| Resolve `peugeot-308-15-bluehdi` (Diesel EAT8) | `POWERTRAIN_TYPES.ICE_DIESEL` | `POWERTRAIN_TYPES.PHEV` | **FAIL** |
| Resolve `mazda-cx5-skyactiv` (Gasoline SkyActiv-Drive) | `POWERTRAIN_TYPES.ICE_PETROL` | `POWERTRAIN_TYPES.ICE_DIESEL` | **FAIL** |
| Resolve `bmw-520d-g31-touring-norm` (Compact Diesel record) | `POWERTRAIN_TYPES.ICE_DIESEL` | `POWERTRAIN_TYPES.ICE_PETROL` | **FAIL** |
| Resolve `audi-a3-35-tfsi-norm` (Compact Petrol record) | `POWERTRAIN_TYPES.ICE_PETROL` | `POWERTRAIN_TYPES.PHEV` | **FAIL** |
| Render EV milestone checklist item badge | Renders `-$XX · +X pts` badge | Badge is missing (`impact` is `undefined`) | **FAIL** |

---

## 6. Caveats

- Testing of non-linear depreciation and dynamic mileage threshold scaling (60k/100k/150k/200k) is deferred to Milestone 2 per the `PROJECT.md` milestone schedule.
- The `tests/jevCatalogJudge.test.js` test was skipped due to the absence of `TYPESAFE_API_KEY` in the local environment, which is expected and documented.

---

## 7. Conclusion

**Verdict: REQUEST_CHANGES**

Worker M1 has implemented the required powertrain enums, EV component dossiers, milestone schedules, and energy math engines. However, the classifier in `resolvePowertrainType` introduces severe regressions by relying on unconstrained substring searching over descriptive text fields like `knownRiskNotes` and `transmissionLabel`. This causes 20 real vehicles in the catalog—including pure diesel and gasoline models—to be classified as pure electric or plug-in hybrid vehicles.

Before Milestone 1 can be approved, Worker M1 must:
1. Fix `resolvePowertrainType` to respect explicit `fuelType` and `powertrain` attributes and eliminate false-positive substring collisions.
2. Fix line 500 of `MaintenanceMilestones.jsx` to include `EV_MILESTONE_IMPACT_MAP`.
3. Integrate `filterComponentsForPowertrain` in `MaintenanceRiskMatrix.jsx`.
4. Add regression test assertions covering catalog presets and edge-case keyword strings in `tests/powertrainBranching.test.js`.

---

## 8. Verification Method

To independently verify the issues and subsequent fixes:

1. **Verify Classifier Errors**:
   ```powershell
   node -e "import('./src/data/vehiclePresets.js').then(m => { ['audi-a6-30-tdi', 'fiat-panda-12-fire', 'ford-transit-custom-20-ecoblue', 'honda-jazz-15-ehev', 'peugeot-208-12-puretech', 'mazda-cx5-skyactiv'].forEach(id => { const p = m.getPresetById(id); console.log(id, '->', m.resolvePowertrainType(p)); }); })"
   ```
   *Current output*:
   - `audi-a6-30-tdi -> EV` (Should be `ICE_DIESEL`)
   - `fiat-panda-12-fire -> EV` (Should be `ICE_PETROL`)
   - `ford-transit-custom-20-ecoblue -> EV` (Should be `ICE_DIESEL`)
   - `honda-jazz-15-ehev -> EV` (Should be `HEV`)
   - `peugeot-208-12-puretech -> PHEV` (Should be `ICE_PETROL`)
   - `mazda-cx5-skyactiv -> ICE_DIESEL` (Should be `ICE_PETROL`)

2. **Verify Full Catalog Classifier Invariant**:
   ```powershell
   node -e "import('./src/data/vehicleCatalog.js').then(m => { import('./src/data/powertrainTypes.js').then(pt => { const engines = m.getAllEnginesFlat(); let errs = 0; for (const e of engines) { const resolved = pt.resolvePowertrainType(e); const fuel = (e.fuelType || '').toLowerCase(); if (fuel === 'electric' && resolved !== 'EV') errs++; else if (fuel === 'diesel' && resolved !== 'ICE_DIESEL') errs++; else if (fuel === 'gasoline' && resolved !== 'ICE_PETROL') errs++; else if (fuel === 'hybrid' && resolved !== 'HEV') errs++; else if (fuel.includes('plug-in') && resolved !== 'PHEV') errs++; } console.log('Mismatches:', errs); }); })"
   ```
   *Target fix condition*: `Mismatches: 0`.

3. **Verify Existing Tests and Build**:
   ```powershell
   npm.cmd test
   npm.cmd run build
   ```

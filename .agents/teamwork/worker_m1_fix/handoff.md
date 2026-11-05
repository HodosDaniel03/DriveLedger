# Handoff Report — Milestone 1 Remediation (Powertrain Branching & Architecture)

**Agent**: Worker M1 Fix (Powertrain Remediation Engineer)  
**Date**: 2026-10-31  
**Milestone**: Milestone 1 Remediation  
**Status**: COMPLETE (Passes all adversarial stress tests, full catalog invariants, and production build)

---

## 1. Observation

### Prior Defect State
1. `src/data/powertrainTypes.js:55-82`: `resolvePowertrainType` concatenated `knownRiskNotes` and `transmissionLabel` into `label` and checked `(label.includes('electric') && !label.includes('hybrid') && !label.includes('phev'))` before checking `fuelType` or `powertrain`.
   - Ad-hoc Node check on un-remediated code showed:
     ```
     audi-a6-30-tdi -> EV
     fiat-panda-12-fire -> EV
     ford-transit-custom-20-ecoblue -> EV
     honda-jazz-15-ehev -> EV
     peugeot-208-12-puretech -> PHEV
     mazda-cx5-skyactiv -> ICE_DIESEL
     ```
   - Running full catalog invariant on 171 engines: `Mismatches: 20`.
   - Running false EV check on 179 presets: `False EVs count: 6`.
2. `src/components/calculators/MaintenanceMilestones.jsx:500`:
   - `const impact = MILESTONE_IMPACT_MAP[it.id];` omitted `EV_MILESTONE_IMPACT_MAP`, causing all 24 EV milestone items to evaluate to `undefined` for `impact` and suppressing `-creditUsd · +bonusPts pts` badges.
3. `src/data/powertrainTypes.js:206, 280`:
   - `const homeRate = Math.max(0, Number(homeTariffUsdPerKwh) || 0.14);` falsy fallback treated `$0.00` tariff as missing and defaulted to `$0.14`.
4. `src/data/powertrainTypes.js:403, 423`:
   - LFP floor clamp `floorSoh = 70.0` locked degraded battery health at `70.0%`, preventing `sohPct < 70.0` from evaluating to true for warranty claims.
5. `src/components/calculators/MaintenanceRiskMatrix.jsx:138-153`:
   - Evaluated components using raw `comp.applicablePowertrains.includes(activePreset.powertrain || 'diesel')` without EV branch handling or passing `powertrainType` to `evaluateComponentHealth`.

### Remediated Code State & Verifications
1. `src/data/powertrainTypes.js`:
   - Prioritized canonical `vehicle.powertrainType` (line 47), then explicit fields `isEv`, `fuelType`, `powertrain`, `archetypeId` (lines 51-118).
   - Removed `knownRiskNotes` and `transmissionLabel` from search string `label` (lines 122-130).
   - Applied word boundaries: `/\bt8\s+(recharge|twin|awd|phev)\b/`, `/\bt8\b/`, `/\btfsi\s+e\b/`, `/\bskyactiv[- ]d\b/`.
   - Replaced falsy `||` with `parseNonNegativeNumber` (lines 227-231).
   - Warranty check updated to `(sohPct < 70.0 || rawSoh < 70.0) && years <= 8 && odo <= 100000` (line 455).
2. `src/data/powertrainArchetypes.js`:
   - Removed `transmissionLabel` and `knownRiskNotes` from `searchBlob` in `resolveArchetypeIdForPreset` (lines 390-399).
   - In `hydrateVehiclePreset` (lines 469-474), merged `fuelType` and `powertrain` from archetype before resolving `powertrainType`.
3. `src/components/calculators/MaintenanceMilestones.jsx:500`:
   - Updated to `const impact = MILESTONE_IMPACT_MAP[it.id] || EV_MILESTONE_IMPACT_MAP[it.id];`.
4. `src/components/calculators/MaintenanceRiskMatrix.jsx:140-170, 218`:
   - Wired `isPureElectric(pType)` branching: EV presets evaluate strictly `comp.applicablePowertrains.includes('ev')` (7 assemblies, 0 ICE items).
   - Passed `powertrainType: pType` and `vehicle: activePreset` to `evaluateComponentHealth`.
   - Wired `EV_MILESTONE_IMPACT_MAP` to milestone credit reserve deduction loop.
5. `tests/powertrainBranching.test.js`:
   - Added 4 comprehensive tests (Tests 7, 8, 9, 10):
     - Test 7: Verifies exact resolution of all 20 tricky presets/catalog engines, invariant of 0 false EVs and 0 false PHEVs across all 179 presets, and 0 mismatches across all 171 catalog engines.
     - Test 8: Verifies EV component filtering (exactly 7 EV components, 0 ICE components) and null-rejection on ICE components.
     - Test 9: Verifies EV milestone impact badges in JSX and all 24 EV items with positive credits.
     - Test 10: Verifies $0.00 tariff energy calculation and battery degradation warranty status logic.

### Verbatim Tool Results
- **Test execution (`npm.cmd test`)**:
  ```
  ✔ ADV-1: Fuzzing & Combinatorial Resolution of Powertrain Types (1.3716ms)
  ✔ ADV-2: Combinatorial Fuzzing of EV Isolation (0 ICE Items under any EV configuration) (92.9617ms)
  ✔ ADV-3: EV Component Evaluation Monotonicity & Boundary Stress (0.559ms)
  ✔ ADV-4: High-Voltage Battery Degradation Stress & Boundary Testing (0.2892ms)
  ✔ ADV-5: EV and PHEV Energy Cost Stress & Boundary Math (0.3385ms)
  ✔ ADV-6: Archetype Hydration & OBD Sanitization for EV vs Combustion (0.2584ms)
  ✔ ADV-7: Milestone Impact Map & Component Triggers Coverage for EV (0.3893ms)
  ✔ tests\driveledger.test.js (791.6764ms)
  ✔ 1. Canonical PowertrainType Enumeration & Resolver (0.9482ms)
  ✔ 2. EV Strict ICE Exclusion in Component Dossiers (Zero ICE Contamination) (0.3998ms)
  ✔ 3. EV Strict ICE Exclusion in Milestone Roadmap Schedules (0.2682ms)
  ✔ 4. Sanitized EV Presets & OBD Fault Codes (0.1646ms)
  ✔ 5. EV & PHEV Fuel / Energy Calculation Engines (0.3946ms)
  ✔ 6. High-Voltage Battery Degradation (SoH % LFP vs. NMC Curve) (0.2728ms)
  ✔ 7. Classifier Collision Prevention across Presets and Catalog Invariants (0.5645ms)
  ✔ 8. MaintenanceRiskMatrix EV Component Filtering & Isolation (0.3342ms)
  ✔ 9. EV Milestone Impact Badges & Component Wiring (0.6661ms)
  ✔ 10. Zero-Tariff Energy Calculation & Battery Degradation Warranty Status Boundary (0.2733ms)
  ✔ 1. Vehicle Body Archetype Resolution (7 Categories) (1.0216ms)
  ✔ 2. Powertrain Archetype Resolution (7 Configurations) (0.2832ms)
  ✔ 3. 4-Tier Technical Mechanical Badges Generation (1.5409ms)
  ✔ 4. Archetype Label Formatting (0.1824ms)
  ✔ 1. Master Vehicle Catalog Marque Coverage (35 Brands across 7 Global Clusters) (0.8397ms)
  ✔ 2. Hierarchical Model & Engine Integrity and Telemetry Constraints (2.0121ms)
  ✔ 3. Catalog Navigation & Autocomplete Search Functions (6.456ms)
  ✔ 4. Backward Compatibility with VEHICLE_PRESETS & Global BRANDS (0.2933ms)
  ℹ tests 27 | pass 26 | fail 0 | skipped 1 | duration_ms 807.5ms
  Exit code: 0
  ```
- **Build execution (`npm.cmd run build`)**:
  ```
  vite v5.4.21 building for production...
  ✓ 1621 modules transformed.
  dist/index.html                   1.95 kB │ gzip:   0.92 kB
  dist/assets/index-DpKeTf3i.css   84.38 kB │ gzip:  13.70 kB
  dist/assets/index-BnMW2254.js   974.52 kB │ gzip: 255.79 kB
  ✓ built in 3.11s
  Exit code: 0
  ```
- **Catalog Invariant Verification**:
  ```powershell
  node -e "import('./src/data/vehicleCatalog.js').then(m => { import('./src/data/powertrainTypes.js').then(pt => { const engines = m.getAllEnginesFlat(); let errs = 0; for (const e of engines) { const resolved = pt.resolvePowertrainType(e); const fuel = (e.fuelType || '').toLowerCase(); if (fuel === 'electric' && resolved !== 'EV') errs++; else if (fuel === 'diesel' && resolved !== 'ICE_DIESEL') errs++; else if (fuel === 'gasoline' && resolved !== 'ICE_PETROL') errs++; else if (fuel === 'hybrid' && resolved !== 'HEV') errs++; else if (fuel.includes('plug-in') && resolved !== 'PHEV') errs++; } console.log('Mismatches:', errs); }); })"
  ```
  *Output*: `Mismatches: 0` (Exit code: 0)
- **Vehicle Presets Adversarial Verification**:
  ```powershell
  node -e "import('./src/data/vehiclePresets.js').then(m => { ['audi-a6-30-tdi', 'fiat-panda-12-fire', 'ford-transit-custom-20-ecoblue', 'honda-jazz-15-ehev', 'peugeot-208-12-puretech', 'mazda-cx5-skyactiv'].forEach(id => { const p = m.getPresetById(id); console.log(id, '->', m.resolvePowertrainType(p)); }); })"
  ```
  *Output*:
  ```
  audi-a6-30-tdi -> ICE_DIESEL
  fiat-panda-12-fire -> ICE_PETROL
  ford-transit-custom-20-ecoblue -> ICE_DIESEL
  honda-jazz-15-ehev -> HEV
  peugeot-208-12-puretech -> ICE_PETROL
  mazda-cx5-skyactiv -> ICE_PETROL
  ```
- **False EVs Invariant**:
  ```powershell
  node -e "import('./src/data/vehiclePresets.js').then(m => { const falseEvs = m.VEHICLE_PRESETS.filter(p => p.isEv === false && m.resolvePowertrainType(p) === 'EV'); console.log('False EVs count:', falseEvs.length); process.exit(falseEvs.length === 0 ? 0 : 1); });"
  ```
  *Output*: `False EVs count: 0` (Exit code: 0)

---

## 2. Logic Chain

1. *Observation*: The root cause of misclassification was that `resolvePowertrainType` and `resolveArchetypeIdForPreset` pooled `knownRiskNotes` and `transmissionLabel` into a single text blob and checked fuzzy substrings (`electric`, `t8 `, `tfsi e`, `skyactiv-d`) before checking explicit model metadata fields.
2. *Inference*: Removing `knownRiskNotes` and `transmissionLabel` from the search strings eliminates the noise (e.g. electrical fault notes on diesel engines, EAT8 gearboxes on Stellantis petrol/diesels, SkyActiv-Drive transmissions on gasoline Mazdas).
3. *Inference*: Checking explicit fields (`isEv`, `fuelType`, `powertrain`, `archetypeId`) first establishes deterministic resolution matching the interface contract of `PROJECT.md`.
4. *Observation*: `MaintenanceMilestones.jsx` defined `EV_MILESTONE_IMPACT_MAP` and referenced it in summary calculation line 332, but line 500 only queried `MILESTONE_IMPACT_MAP[it.id]`.
5. *Inference*: Adding `|| EV_MILESTONE_IMPACT_MAP[it.id]` restores the impact definition for every EV item, allowing credit badges to render.
6. *Observation*: `MaintenanceRiskMatrix.jsx` bypassed EV component filtering and evaluated wear using raw `activePreset.powertrain || 'diesel'`.
7. *Inference*: Branching on `isPureElectric(pType)` to select `comp.applicablePowertrains.includes('ev')` ensures that EV selections yield exactly the 7 EV component dossiers and zero ICE components, while passing `powertrainType` to `evaluateComponentHealth` enforces runtime safety.
8. *Observation*: Falsy `Number(x) || fallback` replaced `$0.00` rates with default rates, and LFP floor clamping prevented warranty claims below 70%.
9. *Inference*: Replacing `||` with `parseNonNegativeNumber` correctly preserves `$0.00` tariffs, and evaluating `(sohPct < 70.0 || rawSoh < 70.0)` enables warranty claim detection without altering boundary clamping.
10. *Conclusion*: All 5 defects identified by Reviewer 1 and Reviewer 2 have been structurally remediated with genuine implementations.

---

## 3. Caveats

- `tests/jevCatalogJudge.test.js` is skipped when the optional `TYPESAFE_API_KEY` environment variable is not present; this is documented project behavior and does not affect local deterministic test suites.
- No other caveats.

---

## 4. Conclusion

All 8 remediation tasks for Milestone 1 are complete.
- Classifier collisions: RESOLVED (0 false EVs, 0 false PHEVs, 0 catalog mismatches).
- Milestone impact mapping: RESOLVED (EV badges render).
- Battery degradation warranty condition: RESOLVED.
- Zero-tariff energy calculations: RESOLVED ($0.00 home/DC supported).
- MaintenanceRiskMatrix powertrain integration: RESOLVED (7 EV components, 0 ICE components).
- Automated test suite: Expanded with Tests 7-10 in `tests/powertrainBranching.test.js`.
- Build & tests: 26 passed, 0 failed, clean Vite build.
Milestone 1 is ready for final approval.

---

## 5. Verification Method

Run the following commands in the workspace root:

1. **Verify Classifier on Tricky Presets**:
   ```powershell
   node -e "import('./src/data/vehiclePresets.js').then(m => { ['audi-a6-30-tdi', 'fiat-panda-12-fire', 'ford-transit-custom-20-ecoblue', 'honda-jazz-15-ehev', 'peugeot-208-12-puretech', 'mazda-cx5-skyactiv'].forEach(id => { const p = m.getPresetById(id); console.log(id, '->', m.resolvePowertrainType(p)); }); })"
   ```
   *Expected*: All resolve to `ICE_DIESEL`, `ICE_PETROL`, `HEV`, etc. (No false EVs or PHEVs).

2. **Verify Full Catalog Invariant (0 Mismatches)**:
   ```powershell
   node -e "import('./src/data/vehicleCatalog.js').then(m => { import('./src/data/powertrainTypes.js').then(pt => { const engines = m.getAllEnginesFlat(); let errs = 0; for (const e of engines) { const resolved = pt.resolvePowertrainType(e); const fuel = (e.fuelType || '').toLowerCase(); if (fuel === 'electric' && resolved !== 'EV') errs++; else if (fuel === 'diesel' && resolved !== 'ICE_DIESEL') errs++; else if (fuel === 'gasoline' && resolved !== 'ICE_PETROL') errs++; else if (fuel === 'hybrid' && resolved !== 'HEV') errs++; else if (fuel.includes('plug-in') && resolved !== 'PHEV') errs++; } console.log('Mismatches:', errs); process.exit(errs); }); })"
   ```
   *Expected*: `Mismatches: 0`, exit code 0.

3. **Verify False EVs Count is Zero**:
   ```powershell
   node -e "import('./src/data/vehiclePresets.js').then(m => { const falseEvs = m.VEHICLE_PRESETS.filter(p => p.isEv === false && m.resolvePowertrainType(p) === 'EV'); console.log('False EVs count:', falseEvs.length); process.exit(falseEvs.length === 0 ? 0 : 1); });"
   ```
   *Expected*: `False EVs count: 0`, exit code 0.

4. **Run Automated Test Suite**:
   ```powershell
   npm.cmd test
   ```
   *Expected*: 26 passed, 0 failed, exit code 0.

5. **Run Production Build**:
   ```powershell
   npm.cmd run build
   ```
   *Expected*: Vite build completed in ~3s, exit code 0.

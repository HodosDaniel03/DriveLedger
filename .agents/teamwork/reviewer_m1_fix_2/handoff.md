# Review & Adversarial Challenge Report — Milestone 1 Remediation (Powertrain Branching & Architecture)

**Reviewer**: Reviewer 2 (Roles: Reviewer, Critic)  
**Target Milestone**: Milestone 1 Remediation (Powertrain Branching & Architecture)  
**Remediation Agent**: Worker M1 Fix  
**Working Directory**: `d:\Antigravity_projects\DriveLedger\.agents\teamwork\reviewer_m1_fix_2`  
**Date**: 2026-10-31  

---

## Review Summary

**Verdict**: **APPROVE**

Worker M1 Fix has completely remediated all critical, major, and minor defects identified in the initial Milestone 1 reviews. Independent adversarial stress-testing confirms:
1. **Classifier Accuracy**: Across the entire catalog (171 engines) and vehicle presets database (179 models), there are **0 false EVs**, **0 false PHEVs**, and **0 catalog mismatches**. All prior misclassified ICE vehicles (Audi A6 3.0 TDI, Ford Transit Custom EcoBlue, Fiat Panda 1.2 Fire, Peugeot 208 EAT8, Mazda CX-5 SkyActiv, etc.) now resolve deterministically to their physical powertrains.
2. **Milestone UI & Risk Deduction**: In `MaintenanceMilestones.jsx`, `EV_MILESTONE_IMPACT_MAP` is wired into the item rendering loop (line 500) and calculation loop (line 332). All 24 EV milestone checklist items now display dynamic risk deduction badges (`-creditUsd · +bonusPts`).
3. **Risk Matrix Integration**: In `MaintenanceRiskMatrix.jsx`, EV presets isolate exactly the 7 EV mechanical component dossiers with 0 ICE components, and pass `powertrainType` to `evaluateComponentHealth`.
4. **Tariff & Degradation Math**: Energy calculators handle free ($0.00) home solar and municipal charging tariffs via `parseNonNegativeNumber`. Battery SoH evaluates abnormal degradation for warranty claims via `(sohPct < 70.0 || rawSoh < 70.0)`.
5. **Integrity & Verification**: 0 hardcoded preset IDs in resolvers; 26/26 tests pass; production build succeeds cleanly.

---

## 1. Observation

### Observation 1: Classifier Resolution Across Catalog and Presets
- Ran full preset and catalog classification audit across all 179 vehicle presets in `src/data/vehiclePresets.js` and all 171 engines in `src/data/vehicleCatalog.js`:
  ```powershell
  node -e "
  import('./src/data/vehiclePresets.js').then(vp => {
    import('./src/data/powertrainTypes.js').then(pt => {
      import('./src/data/vehicleCatalog.js').then(vc => {
        console.log('Total presets:', vp.VEHICLE_PRESETS.length);
        const allEngines = vc.getAllEnginesFlat();
        console.log('Total catalog engines:', allEngines.length);

        const falseEvs = vp.VEHICLE_PRESETS.filter(p => p.isEv === false && pt.resolvePowertrainType(p) === 'EV');
        console.log('False EVs in presets count:', falseEvs.length);

        const falsePhevs = vp.VEHICLE_PRESETS.filter(p => {
          const f = (p.fuelType || '').toLowerCase();
          const isPhev = f === 'plug-in hybrid' || f.includes('plug-in') || p.powertrain === 'phev';
          return !isPhev && pt.resolvePowertrainType(p) === 'PHEV';
        });
        console.log('False PHEVs in presets count:', falsePhevs.length);

        let catalogMismatches = 0;
        for (const e of allEngines) {
          const resolved = pt.resolvePowertrainType(e);
          const fuel = (e.fuelType || '').toLowerCase();
          let expected;
          if (fuel === 'electric') expected = 'EV';
          else if (fuel === 'diesel') expected = 'ICE_DIESEL';
          else if (fuel === 'gasoline') expected = 'ICE_PETROL';
          else if (fuel === 'hybrid') expected = 'HEV';
          else if (fuel.includes('plug-in')) expected = 'PHEV';
          if (expected && resolved !== expected) catalogMismatches++;
        }
        console.log('Catalog mismatches count:', catalogMismatches);
      });
    });
  });"
  ```
  **Verbatim output**:
  ```
  Total presets: 179
  Total catalog engines: 171
  False EVs in presets count: 0
  False PHEVs in presets count: 0
  Catalog mismatches count: 0
  ```

- Inspected previously misclassified presets:
  - `audi-a6-30-tdi` $\to$ `ICE_DIESEL` (previously `EV`)
  - `audi-a6-c7-20-tdi` $\to$ `ICE_DIESEL` (previously `EV`)
  - `toyota-avensis-t27-20-d4d` $\to$ `ICE_DIESEL` (previously `EV`)
  - `ford-transit-custom-20-ecoblue` $\to$ `ICE_DIESEL` (previously `EV`)
  - `fiat-panda-12-fire` $\to$ `ICE_PETROL` (previously `EV`)
  - `honda-jazz-15-ehev` $\to$ `HEV` (previously `EV`)
  - `peugeot-208-12-puretech` $\to$ `ICE_PETROL` (previously `PHEV`)
  - `peugeot-308-15-bluehdi` $\to$ `ICE_DIESEL` (previously `PHEV`)
  - `peugeot-508-20-bluehdi` $\to$ `ICE_DIESEL` (previously `PHEV`)
  - `peugeot-3008-15-bluehdi` $\to$ `ICE_DIESEL` (previously `PHEV`)
  - `ds-7-20-bluehdi` $\to$ `ICE_DIESEL` (previously `PHEV`)
  - `ds4-12-puretech` $\to$ `ICE_PETROL` (previously `PHEV`)
  - `audi-a3-15-tfsi` $\to$ `ICE_PETROL` (previously `PHEV`)
  - `mazda-cx5-skyactiv` $\to$ `ICE_PETROL` (previously `ICE_DIESEL`)
  - `audi-a3-35-tfsi-norm` $\to$ `ICE_PETROL` (previously `PHEV`)
  - `bmw-520d-g31-touring-norm` $\to$ `ICE_DIESEL` (previously `ICE_PETROL`)

- Inspected EV presets distribution:
  Out of 179 presets, exactly 8 are resolved as `EV`, and each is an authentic BEV:
  1. `tesla-model-3-lr` (Tesla Model 3 LR Dual-Motor AWD)
  2. `tesla-model-y-lr` (Tesla Model Y LR Dual-Motor AWD)
  3. `vw-id4-pro-77kwh` (VW ID.4 Pro Performance 77kWh)
  4. `vw-id3-pro-58kwh` (VW ID.3 Pro Performance 58kWh)
  5. `nissan-leaf-40kwh` (Nissan Leaf 40 kWh EV)
  6. `renault-zoe-r135-52kwh` (Renault Zoe R135 Z.E. 50 52kWh)
  7. `tesla-model-s-long-range` (Tesla Model S Long Range Dual Motor)
  8. `vw-id4-pro-bev-norm` (VW ID.4 Pro MEB APP550)

- Inspected PHEV presets distribution:
  Exactly 2 are resolved as `PHEV`:
  1. `mitsubishi-outlander-phev-20` (Mitsubishi Outlander PHEV 2.0 Twin-Motor)
  2. `volvo-xc60-t8-phev-norm` (Volvo XC60 Recharge T8 Twin-Engine PHEV)

### Observation 2: Code Inspection of `MaintenanceMilestones.jsx`
- In `src/components/calculators/MaintenanceMilestones.jsx:500`:
  ```javascript
  const impact = MILESTONE_IMPACT_MAP[it.id] || EV_MILESTONE_IMPACT_MAP[it.id];
  ```
  Lines 541–552 render the credit badge:
  ```javascript
  {impact && (checked || impact.major) && (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${...}`}>
      {checked ? '✓ ' : ''}
      -{formatCurrency(impact.creditUsd)} · +{impact.bonusPts} pts
    </span>
  )}
  ```
- In `src/components/calculators/MaintenanceMilestones.jsx:332`:
  ```javascript
  const impact = MILESTONE_IMPACT_MAP[itemId] || EV_MILESTONE_IMPACT_MAP[itemId];
  if (impact) {
    riskUsd += impact.creditUsd;
    pts += impact.bonusPts;
  }
  ```
- All 24 EV milestone checklist items are mapped with positive `creditUsd` and `bonusPts` in `EV_MILESTONE_IMPACT_MAP`.

### Observation 3: Code Inspection of `MaintenanceRiskMatrix.jsx`
- In `src/components/calculators/MaintenanceRiskMatrix.jsx:140–165`:
  ```javascript
  const pType = resolvePowertrainType(activePreset);
  const isEv = isPureElectric(pType);

  const relevant = MAINTENANCE_COMPONENTS.filter((comp) => {
    if (isEv) {
      return Array.isArray(comp.applicablePowertrains) && comp.applicablePowertrains.includes('ev');
    }
    return Array.isArray(comp.applicablePowertrains) && comp.applicablePowertrains.includes(activePreset.powertrain || 'diesel');
  });
  ```
  `evaluateComponentHealth` call passes `powertrainType: pType` and `vehicle: activePreset`.
- In `src/components/calculators/MaintenanceRiskMatrix.jsx:229`:
  ```javascript
  const impact = MILESTONE_IMPACT_MAP[mId] || EV_MILESTONE_IMPACT_MAP[mId];
  ```
  Milestone verified service credit reserve deduction incorporates both ICE and EV impact items.
- Evaluated components for pure EV yield exactly 7 components:
  `['ev-battery-soh', 'ev-obc-iccu', 'ev-thermal-heatpump', 'ev-reduction-gear', 'ev-curb-suspension', 'ev-torque-tires', 'ev-regen-brake-corrosion']`.
  Zero ICE components are included.

### Observation 4: Test Suite & Build Verification
- Command: `npm.cmd test`
  Output:
  - 26 tests passed, 0 failed, 1 skipped (`tests/jevCatalogJudge.test.js` due to optional `TYPESAFE_API_KEY`).
  - Total test run duration: ~811 ms.
  - Exit code: 0.
- Command: `npm.cmd run build`
  Output:
  - Vite v5.4.21 transformed 1,621 modules.
  - Built `dist/` in 3.10s.
  - Exit code: 0.

### Observation 5: Integrity Verification
- Verified absence of hardcoded preset IDs (`audi-a6-30-tdi`, `fiat-panda-12-fire`, `ford-transit`, `peugeot-208`) in `src/data/powertrainTypes.js` and `src/data/powertrainArchetypes.js`.
- Verified algorithmic and structural regex boundary implementations.
- No dummy/facade implementations or skipped logic detected.

---

## 2. Logic Chain

1. *Observation 1*: Running the classifier across all 179 vehicle presets and 171 catalog engines yields exactly 0 false EVs, 0 false PHEVs, and 0 mismatches.
2. *Observation 1 & Source Code*: In `src/data/powertrainTypes.js:51–118`, explicit vehicle fields (`powertrainType`, `isEv`, `fuelType`, `powertrain`, `archetypeId`) are checked first before any heuristic string analysis.
3. *Observation 1 & Source Code*: In `src/data/powertrainTypes.js:123–133` and `src/data/powertrainArchetypes.js:392–402`, `knownRiskNotes` and `transmissionLabel` were completely removed from the text blob `label` and `searchBlob`.
4. *Logic Inference*: Because descriptive defect notes (e.g. electrical power steering or starter generator shorts) and transmission labels (e.g. Aisin EAT8 or SkyActiv-Drive) are no longer included in the fuzzy search blob, and because regexes use word boundaries (`/\bt8\s+(recharge|twin|awd|phev)\b/`, `/\bt8\b/`, `/\btfsi\s+e\b/`, `/\bskyactiv[- ]d\b/`), false-positive collisions are structurally impossible.
5. *Observation 2 & Source Code*: Adding `|| EV_MILESTONE_IMPACT_MAP[it.id]` to `MaintenanceMilestones.jsx:500` ensures `impact` resolves for all 24 EV milestone items, allowing the credit badge (`-$X · +Y pts`) to render in the UI.
6. *Observation 3 & Source Code*: In `MaintenanceRiskMatrix.jsx`, branching on `isPureElectric(pType)` ensures that selecting an EV evaluates exactly the 7 EV component dossiers and suppresses all ICE components.
7. *Observation 4*: Both the automated test suite (`npm.cmd test`, 26 passed) and the production Vite build (`npm.cmd run build`) pass cleanly with exit code 0.
8. *Conclusion*: All requirements and acceptance criteria for Milestone 1 are satisfied.

---

## 3. Caveats

- Milestone 2 items (non-linear depreciation curves and dynamic 60k/100k/150k/200k maintenance threshold scaling in `TcoCalculator.jsx`) are part of Milestone 2 per `PROJECT.md` and are scheduled for the next milestone.
- `tests/jevCatalogJudge.test.js` is skipped when `TYPESAFE_API_KEY` is not set; this is normal project configuration.
- No other caveats.

---

## 4. Conclusion

**Verdict: APPROVE**

The remediation performed by Worker M1 Fix resolves all reported classification defects, milestone rendering omissions, and risk matrix integration gaps with high engineering rigor.
- 0 false EVs and 0 false PHEVs across 179 presets and 171 catalog engines.
- 100% strict ICE exclusion for pure electric vehicles.
- Full EV component telemetry (7 dedicated component dossiers).
- Production build and test suite passing cleanly.
Milestone 1 is certified complete and ready for Milestone 2.

---

## 5. Verification Method

To independently reproduce and verify this assessment:

1. **Preset & Catalog Invariant Verification**:
   ```powershell
   node -e "import('./src/data/vehiclePresets.js').then(vp => { import('./src/data/powertrainTypes.js').then(pt => { const falseEvs = vp.VEHICLE_PRESETS.filter(p => p.isEv === false && pt.resolvePowertrainType(p) === 'EV'); console.log('False EVs count:', falseEvs.length); process.exit(falseEvs.length === 0 ? 0 : 1); }); });"
   ```
   *Expected*: `False EVs count: 0`, exit code 0.

2. **Full Catalog Classifier Invariant**:
   ```powershell
   node -e "import('./src/data/vehicleCatalog.js').then(vc => { import('./src/data/powertrainTypes.js').then(pt => { const engines = vc.getAllEnginesFlat(); let mismatches = 0; for (const e of engines) { const resolved = pt.resolvePowertrainType(e); const fuel = (e.fuelType || '').toLowerCase(); let expected; if (fuel === 'electric') expected = 'EV'; else if (fuel === 'diesel') expected = 'ICE_DIESEL'; else if (fuel === 'gasoline') expected = 'ICE_PETROL'; else if (fuel === 'hybrid') expected = 'HEV'; else if (fuel.includes('plug-in')) expected = 'PHEV'; if (expected && resolved !== expected) mismatches++; } console.log('Catalog mismatches:', mismatches); process.exit(mismatches === 0 ? 0 : 1); }); });"
   ```
   *Expected*: `Catalog mismatches: 0`, exit code 0.

3. **Critical Preset Spot-Check**:
   ```powershell
   node -e "import('./src/data/vehiclePresets.js').then(vp => { import('./src/data/powertrainTypes.js').then(pt => { ['audi-a6-30-tdi', 'fiat-panda-12-fire', 'ford-transit-custom-20-ecoblue', 'honda-jazz-15-ehev', 'peugeot-208-12-puretech', 'mazda-cx5-skyactiv'].forEach(id => { const p = vp.getPresetById(id); console.log(id, '->', pt.resolvePowertrainType(p)); }); }); });"
   ```
   *Expected*:
   `audi-a6-30-tdi -> ICE_DIESEL`  
   `fiat-panda-12-fire -> ICE_PETROL`  
   `ford-transit-custom-20-ecoblue -> ICE_DIESEL`  
   `honda-jazz-15-ehev -> HEV`  
   `peugeot-208-12-puretech -> ICE_PETROL`  
   `mazda-cx5-skyactiv -> ICE_PETROL`  

4. **Test Suite**:
   ```powershell
   npm.cmd test
   ```
   *Expected*: 26 passed, 0 failed, exit code 0.

5. **Production Build**:
   ```powershell
   npm.cmd run build
   ```
   *Expected*: Vite build completed in ~3s, exit code 0.

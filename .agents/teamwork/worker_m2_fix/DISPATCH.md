## 2026-10-31T12:53:05Z
You are Worker M2 Fix: Calculator Mathematics Remediation Engineer.
Your working directory is: d:\Antigravity_projects\DriveLedger\.agents\teamwork\worker_m2_fix
Your parent is: d2e241c0-5552-43ea-b7ac-5bd0130c1430

MANDATORY FIRST STEP: Read ORIGINAL_REQUEST.md at:
d:\Antigravity_projects\DriveLedger\.agents\teamwork\ORIGINAL_REQUEST.md

Read the Challenger 2 handoff report at:
d:\Antigravity_projects\DriveLedger\.agents\teamwork\challenger_m2_2\handoff.md
And GATE_STATUS.md at:
d:\Antigravity_projects\DriveLedger\.agents\teamwork\orchestrator\GATE_STATUS.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write Ownership (Exclusive to this Worker):
- src/data/maintenanceData.js
- src/components/calculators/TcoCalculator.jsx
- tests/calculatorMath.test.js

Remediation Tasks to Implement:
1. Fix Depreciation Asset Appreciation & Monotonicity in `calculateNonLinearDepreciation`, `calculateTcoProjection`, and `TcoCalculator.jsx`:
   - In `calculateNonLinearDepreciation`:
     - Remove discrete jump `yr <= 3 ? 0.97 : 1.01`. Use a smooth continuous factor or ensure that `R_used(A0 + yr)` is monotonically non-increasing.
     - Dampen/cap the low-mileage factor `(1 - excess * 0.04)^yr` so low annual mileage (e.g. 0–1,000 mi/yr) cannot cause vehicle valuation to increase in later years.
   - In `calculateTcoProjection` and `TcoCalculator.jsx`:
     - Enforce `residualValueUsd = Math.min(residualValueUsd, prevResidualValueUsd);`
     - Enforce `yearDepreciationUsd = Math.max(0, prevResidualValueUsd - residualValueUsd);`
     - Guarantee: vehicle depreciation must NEVER be negative (no vehicle appreciates in value).
2. Fix Standalone TCO Default EV Electricity Tariff in `src/data/maintenanceData.js`:
   - When vehicle is `EV` (`isPureElectric(pType)` or `isEv`), if `homeTariffUsdPerKwh` is omitted or undefined, default to `0.16` ($0.16/kWh), NOT `unitEnergyPrice` (which defaults to $3.65 gasoline price).
3. Test Suite:
   - Add tests in `tests/calculatorMath.test.js` checking monotonic depreciation:
     - Year-over-year depreciation >= 0 for all 10 years across factory-new, used (50k, 100k mi), and low-mileage (1,000 mi/yr) vehicles for EV, HEV, and ICE.
     - Standalone TCO calculation for an EV with omitted tariff defaults to electricity price ($0.16/kWh), giving realistic annual energy cost.
4. Verification:
   - Run `npm test` and `npm run build` using run_command.
   - Run `node scripts/empirical-challenge-m2-2.mjs` to ensure Challenger 2's empirical harness passes 100%.
5. Documentation:
   - Write handoff.md in your working directory and notify parent.

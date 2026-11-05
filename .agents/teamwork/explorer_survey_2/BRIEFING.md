# BRIEFING — 2026-10-31T11:06:30Z

## Mission
Investigate calculator math and financial logic across DriveLedger src/ (TCO, depreciation, maintenance risk matrix & odometer scaling, OBD-II estimator, boundary conditions).

## 🔒 My Identity
- Archetype: explorer
- Roles: codebase explorer, financial logic & calculator math
- Working directory: d:\Antigravity_projects\DriveLedger\.agents\teamwork\explorer_survey_2
- Original parent: d2e241c0-5552-43ea-b7ac-5bd0130c1430
- Milestone: codebase-survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Analyze problems, synthesize findings, produce structured reports
- Write only to working directory: d:\Antigravity_projects\DriveLedger\.agents\teamwork\explorer_survey_2

## Current Parent
- Conversation ID: d2e241c0-5552-43ea-b7ac-5bd0130c1430
- Updated: 2026-10-31T11:06:30Z

## Investigation State
- **Explored paths**:
  - `src/components/calculators/TcoCalculator.jsx` (lines 20-236: `calculateTcoProjection`, lines 238-1318 UI)
  - `src/components/calculators/MaintenanceRiskMatrix.jsx` (lines 1-973)
  - `src/components/calculators/MaintenanceMilestones.jsx` (lines 1-385)
  - `src/components/calculators/ObdEstimator.jsx` (lines 1-867)
  - `src/components/calculators/LivePidEvaluator.jsx` (lines 1-819)
  - `src/components/calculators/EvBreakEvenCalculator.jsx` (lines 1-320)
  - `src/components/calculators/VehicleComparator.jsx` (lines 1-758)
  - `src/components/calculators/CostTimeline.jsx` (lines 1-289)
  - `src/data/maintenanceData.js` (lines 1-430)
  - `src/data/obdCodes.js` (lines 1-1175)
  - `src/data/vehiclePresets.js` (lines 1-1402)
  - `src/data/powertrainArchetypes.js` (lines 1-658)
  - `src/context/UnitContext.jsx` (lines 1-245)
  - `src/components/seo/DynamicSeoHead.jsx` (lines 1-374)
  - `tests/driveledger.test.js` (verified existing test suite passes with `cmd /c npm test`)
- **Key findings**:
  1. TCO Calculator sums 5 economic items (Depreciation, Fuel/Energy, Insurance, Maintenance, Financing Interest) and cash outflow. Flaws: no PHEV profile (all-or-nothing EV flag), no dual home/DC fast charging tariff for EV, linear maintenance odometer scaling with only 2 fixed bump points ($650 at 55k and 90k miles).
  2. Depreciation: `residualCurve10Yr` array is piecewise non-linear from new, but fails completely on used car purchase (always resets to year 1 of new vehicle curve regardless of initial age or odometer). Continuous non-linear double exponential decay formula needed with powertrain and starting age adjustment.
  3. Maintenance Matrix & Scaling: `evaluateComponentHealth` scales monotonically with urban cycle, oil interval, and service history. Missing explicit 60k, 100k, 150k, 200k revision milestones in both TCO and milestone roadmap. ICE parts like DMF/clutch currently appear in EV lists.
  4. OBD-II Estimator: `calculateObdWorkshopEstimate` computes weighted expected cost across root causes for 3 labor tiers. Missing EV-specific DTCs (OBC/ICCU, high-voltage isolation P0AA6, heat pump/chiller valves) and currently shows ICE codes for EV presets.
  5. Boundaries: 0 km is locked out on `MaintenanceRiskMatrix` slider (min=10,000); 500k+ km is capped at 200k on slider; $0 insurance defaults to $1400 via `Number(val) || 1400` bug; model years are unvalidated in preset hydration.
- **Unexplored areas**: None within calculator and financial scope.

## Key Decisions Made
- Fully documented all 5 investigation questions with exact file paths, line references, code snippets, mathematical formulas, and concrete implementation recommendations.

## Artifact Index
- handoff.md — Complete 5-section handoff report
- progress.md — Liveness & task execution heartbeat
- DISPATCH.md — Record of dispatch instructions
- BRIEFING.md — Persistent context & state

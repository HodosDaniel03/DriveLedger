# BRIEFING — 2026-10-31T11:25:00Z

## Mission
Investigate DriveLedger codebase regarding Powertrain architecture and maintenance items, specifically for ICE vs EV/PHEV components and energy calculations.

## 🔒 My Identity
- Archetype: explorer
- Roles: Codebase Explorer - Powertrain & Maintenance Architecture
- Working directory: d:\Antigravity_projects\DriveLedger\.agents\teamwork\explorer_survey_1
- Original parent: d2e241c0-5552-43ea-b7ac-5bd0130c1430
- Milestone: codebase-survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Investigation only under src/ and project docs
- Write only to .agents/teamwork/explorer_survey_1/
- Produce 5-component handoff report in handoff.md

## Current Parent
- Conversation ID: d2e241c0-5552-43ea-b7ac-5bd0130c1430
- Updated: 2026-10-31T11:25:00Z

## Investigation State
- **Explored paths**:
  - `ORIGINAL_REQUEST.md` (Scope, R1, R2, R3)
  - `src/data/powertrainArchetypes.js` (8 archetypes, brand multipliers, compact models)
  - `src/data/vehicleCatalog.js` (35 marques, 171 engines, fuelType & powertrain distribution)
  - `src/data/vehiclePresets.js` (65 vehicle presets, Tesla Model 3/Y configurations)
  - `src/data/maintenanceData.js` (7 components, evaluateComponentHealth, wear models)
  - `src/data/obdCodes.js` (20 OBD-II dossiers, calculateObdWorkshopEstimate)
  - `src/components/calculators/TcoCalculator.jsx` (calculateTcoProjection, fuel, depreciation, maintenance)
  - `src/components/calculators/MaintenanceMilestones.jsx` (STANDARD_MILESTONES static list)
  - `src/components/calculators/MaintenanceRiskMatrix.jsx` (evaluatedComponents, OEM risk multiplier)
  - `src/components/calculators/EvBreakEvenCalculator.jsx` (ICE vs EV break-even math)
  - `src/components/calculators/LivePidEvaluator.jsx` (PIDs for DPF, turbo, lean, misfire, transmission)
  - `src/context/GarageContext.jsx` (MILESTONE_IMPACT_MAP, COMPONENT_MILESTONE_TRIGGERS)
  - `src/context/UnitContext.jsx` (Unit conversions, EV kWh/100mi vs kWh/100km, currency)
  - `tests/` (`driveledger.test.js`, `vehicleArchetypes.test.js`, `vehicleCatalog.test.js`)
- **Key findings**:
  - Inconsistent powertrain categorization across catalog, presets, and archetypes; need for canonical `PowertrainType = 'EV' | 'PHEV' | 'HEV' | 'ICE_PETROL' | 'ICE_DIESEL'`.
  - EV contamination: `drivetrain-dmf-dsg` includes `'ev'` and `'single-speed-ev'`; `STANDARD_MILESTONES` statically presents oil changes, spark plugs, timing belt, DPF to all vehicles including pure EVs.
  - Tesla Model 3/Y presets are assigned ICE OBD codes `P0700` and `P0128`.
  - EV-specific items (SoH % LFP vs NMC, OBC/ICCU failure, reducer oil, regen brake corrosion, weight suspension/tire wear) are currently missing.
  - Energy calculations lack home vs DC fast charging split and PHEV combined electric/petrol profiles.
- **Unexplored areas**: None for Powertrain & Maintenance survey. Ready for handoff.

## Key Decisions Made
- Documented precise 5-part architecture analysis in `handoff.md`.
- Formulated mathematical models for SoH % (LFP vs NMC), Blended EV charging tariffs, and Dual-energy PHEV cycle.
- Documented testing verification criteria for 0 ICE items in EV mode.

## Artifact Index
- `DISPATCH.md` — Incoming dispatch messages
- `progress.md` — Liveness heartbeat and execution log
- `BRIEFING.md` — Situational awareness index
- `handoff.md` — Full 5-component handoff report

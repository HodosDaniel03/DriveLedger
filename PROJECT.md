# Project: DriveLedger Comprehensive Overhaul & Product Strategy

## Architecture
DriveLedger is a Vite + React automotive total cost of ownership (TCO) and maintenance diagnostics application.
- Architecture: Component-based React SPA with Vite bundler and Tailwind CSS.
- Data Layer: Static JavaScript catalogues and presets (`src/data/`).
- State Management: React Context (`GarageContext.jsx`, `UnitContext.jsx`).
- Design System: Custom Tailwind design language aligned with Odometer benchmark (#F7F7F4 canvas, #FFFFFF rounded-2xl cards, #183D22 deep forest green, tabular-nums).
- Test Suites: Vitest test runner and Node test runner under `tests/`.

## Feature Inventory
| # | Feature | Description | Workstream | Status | Source |
|---|---------|-------------|------------|--------|--------|
| 1 | Hungarian Linguistic Purge | Zero Hungarian words/characters `[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]` in catalog, presets, and HTML | Sub-Agent 1 (R1) | DONE | ORIGINAL_REQUEST §R1 |
| 2 | Catalog & Preset English Standardization | 100% plain, authoritative English translations across all vehicle dossiers & OBD codes | Sub-Agent 1 (R1) | DONE | ORIGINAL_REQUEST §R1 |
| 3 | Marketing Text Bloat Reduction | Cut 70% of prose in HomePage, BlogPage, Reviews, Hero, Subsystems | Sub-Agent 2 (R2) | DONE | ORIGINAL_REQUEST §R2 |
| 4 | Card Subtitle 10-15 Word Enforcement | Strict limit of 1 short sentence (10-15 words) per card header | Sub-Agent 2 (R2) | DONE | ORIGINAL_REQUEST §R2 |
| 5 | Collapsed SEO / Methodology Drawers | Tuck long-form AdSense text and Technical Methodology into `<details>` / Accordion | Sub-Agent 2 (R2) | DONE | ORIGINAL_REQUEST §R2 |
| 6 | Design Benchmark DNA Alignment | Warm off-white `#F7F7F4` canvas, `rounded-2xl` `#FFFFFF` cards, `#183D22` accents, `tabular-nums` | Sub-Agent 3 (R3) | DONE | ORIGINAL_REQUEST §R3 |
| 7 | Single-Line Navbar Decluttering | Compact region pill, garage pill, horizontal tab scroll; clean 1-line fit on all viewports | Sub-Agent 3 (R3) | DONE | ORIGINAL_REQUEST §R3 |
| 8 | Calculator Progressive Disclosure | 3-4 core sliders visible by default; secondary assumptions tucked in expandable drawer | Sub-Agent 3 (R3) | DONE | ORIGINAL_REQUEST §R3 |
| 9 | Duplicate Control Elimination | Remove redundant slider pill buttons and duplicate vehicle selectors on single views | Sub-Agent 3 (R3) | DONE | ORIGINAL_REQUEST §R3 |
| 10 | Mathematical Audit & Bug Fixes | Fix `costPerLocalUnit` in TCO verdict; clamp negative numbers; ensure no NaN/Infinity | Sub-Agent 4 (R4) | DONE | ORIGINAL_REQUEST §R4 |
| 11 | Wear Multipliers & Workshop Tiers | Highway vs city wear multipliers; Dealer vs Independent vs DIY labor rate recalculation | Sub-Agent 4 (R4) | DONE | ORIGINAL_REQUEST §R4 |
| 12 | Global State & Unit Persistence | Vehicle selection and currency/unit conversions persist across all tabs and calculators | Sub-Agent 4 (R4) | DONE | ORIGINAL_REQUEST §R4 |
| 13 | QA & Build Verification | Run all Vitest suites, verify `npm run build`, automated Hungarian regex scan (0 hits) | Sub-Agent 5 (R5) | DONE | ORIGINAL_REQUEST §R5 |
| 14 | Strategic Product Report | Create `PRODUCT_STRATEGY_AND_ROADMAP.md` covering audit, retention loops, CRO, and SEO | Sub-Agent 5 (R6) | DONE | ORIGINAL_REQUEST §R6 |
| 15 | Zero-Hungarian Final Purge (Data & Vehicles) | Clean remaining 154 Hungarian characters in `src/data/vehicles/*.js` and service | Sub-Agent 1B | DONE | ORIGINAL_REQUEST §R1 |
| 16 | Zero-Hungarian Final Purge (Components) | Clean remaining Hungarian characters in Comparator, Dossier, SEO Head, Primitives | Sub-Agent 2B | DONE | ORIGINAL_REQUEST §R1 |

## Workstreams & File Ownership Boundaries
| Workstream | Sub-Agent Role | Exclusive File Boundaries |
|------------|----------------|---------------------------|
| Sub-Agent 1 | Linguistic Purge & Catalog Localization | `index.html`, `src/data/vehicleCatalog.js`, `src/data/vehiclePresets.js`, `src/data/obdCodes.js`, `src/data/maintenanceData.js`, `src/data/vehicleArchetypes.js`, `src/components/common/vehicle/vehicleArchetypes.js`, `src/data/breakEvenAndPpi.js`, `src/data/powertrainArchetypes.js`, `src/data/powertrainTypes.js`, `tests/vehicleKnownIssues.test.js`, `tests/viralSeoFeatures.test.js` |
| Sub-Agent 2 | Text Bloat Reduction & Scannability | `src/pages/HomePage.jsx`, `src/pages/BlogPage.jsx`, `src/pages/ReviewsPage.jsx`, `src/components/reviews/ReviewsSection.jsx`, `src/components/home/HeroVehicleFinder.jsx`, `src/components/home/SubsystemGrid.jsx`, `src/components/common/PreInspectionChecklist.jsx`, `src/components/common/TechnicalMethodologyGuide.jsx` |
| Sub-Agent 3 | UI/UX & Design DNA Alignment | `src/components/layout/Navbar.jsx`, `src/components/layout/Footer.jsx`, `src/index.css`, `src/App.css`, `src/components/calculators/TcoCalculator.jsx`, `src/components/calculators/CostTimeline.jsx`, `src/components/calculators/EvBreakEvenCalculator.jsx`, `src/components/common/VehicleHierarchySelector.jsx` |
| Sub-Agent 4 | Automotive Math & Global State Sync | `src/context/GarageContext.jsx`, `src/context/UnitContext.jsx`, `src/components/calculators/MaintenanceRiskMatrix.jsx`, `src/components/calculators/MaintenanceMilestones.jsx`, `src/components/calculators/ObdEstimator.jsx`, `src/components/calculators/LivePidEvaluator.jsx` |
| Sub-Agent 5 | QA, Build & Product Strategy | `tests/**`, `PRODUCT_STRATEGY_AND_ROADMAP.md` |
| Sub-Agent 1B | Zero-Hungarian Final Purge (Data & Vehicles) | `src/data/vehicles/*.js`, `src/services/vehicleDataService.js` |
| Sub-Agent 2B | Zero-Hungarian Final Purge (Components & App) | `src/components/calculators/VehicleComparator.jsx`, `src/components/common/KnownIssuesDossier.jsx`, `src/components/home/PreInspectionChecklist.jsx`, `src/components/seo/DynamicSeoHead.jsx`, `src/components/common/OdometerPrimitives.jsx`, `src/App.jsx` |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Survey Codebase Mapping | Explorers survey R1-R6, design tokens, math formulas, test suites | none | DONE |
| M1 | Core Implementation | Sub-Agents 1, 2, 3, 4, 5 execute with strict file ownership | M0 | DONE |
| M1B | Zero-Hungarian Final Purge | Sub-Agents 1B and 2B clean vehicle dossiers and remaining UI components | M1 | DONE |
| M2 | Final QA & Build Verification | Full Vitest suite, npm test, npm run build, regex scan | M1B | DONE |
| M3 | Verification Squad & Gate | Reviewers, Challengers, and Forensic Auditor evaluate full overhaul | M2 | DONE (Gate PASS) |

# Original User Request

## Approved Task Prompt — 2026-11-02T19:40:33Z

Spawn and coordinate 5 Specialized Sub-Agents with strict file ownership boundaries to execute this overhaul, and conclude with a comprehensive Product & User Retention Strategy Report. Perform a comprehensive audit, UX streamlining, English-only linguistic purge, business logic and cross-component synchronization, build verification, and product strategy report for the active Vite + React application in `./src/`.

Working directory: d:\Antigravity_projects\DriveLedger
Integrity mode: development

## Reference Material
- Visual benchmarks: `./odometer-web-application/` and `./stitch_design_system_generator/clear_report/DESIGN.md`

## Requirements

### R1. Zero-Hungarian Linguistic Purge & 100% English UI
- Scan every `.js`, `.jsx`, and `.html` file in `./src/` (including regex searches for Hungarian characters `[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]` and Hungarian words).
- Translate and rewrite every remaining Hungarian string, label, badge, tooltip, placeholder, vehicle note, or modal text into natural, authoritative, plain English.

### R2. Text Bloat Reduction & Visual Scannability
- Cut 70% of the prose across `HomePage.jsx`, `BlogPage.jsx`, `ReviewsPage.jsx`, `HeroVehicleFinder.jsx`, `SubsystemGrid.jsx`, `PreInspectionChecklist.jsx`, and `TechnicalMethodologyGuide.jsx`.
- Enforce card subtitle rule: maximum 1 short sentence (10–15 words) per card header.
- Replace multi-sentence explanations inside calculators with 3-to-5 word bullet points or hover tooltips.
- Tuck long-form AdSense SEO text strictly inside collapsed-by-default `<details>` / Accordion drawers at the bottom of the page.

### R3. UI/UX Simplification & Visual Alignment
- Align all surfaces with the visual DNA in `./odometer-web-application/components/odometer/` and `./stitch_design_system_generator/clear_report/DESIGN.md` (warm off-white `#F7F7F4` canvas, crisp white `rounded-2xl` cards, `#183D22` deep forest green accents, `tabular-nums` monospace numbers).
- Declutter navigation: ensure `Navbar.jsx` fits cleanly on one line across all screen sizes without tab overflow; group secondary tools cleanly.
- Apply progressive disclosure: show only the 3–4 core sliders/inputs by default in each calculator, hiding secondary/advanced inputs inside a clean "Customize assumptions" expandable row.
- Remove redundant pill buttons underneath sliders and eliminate duplicate vehicle selectors on the same view.

### R4. Automotive Business Logic, Math & Global State Synchronization
- Math and formula audit: verify 5-year depreciation curves, monthly financing amortization (APR%), fuel consumption conversions (`MPG US` vs `MPG UK` vs `L/100km` vs `kWh/100mi`), and per-mile/km totals in `TcoCalculator.jsx` and `CostTimeline.jsx` are 100% mathematically consistent and never produce `NaN`, `Infinity`, or negative values.
- Verify `MaintenanceRiskMatrix.jsx` and `MaintenanceMilestones.jsx` accurately calculate wear multipliers (highway vs. city short trips) and display realistic Independent vs. Dealership cost ranges.
- Verify `ObdEstimator.jsx` and `LivePidEvaluator.jsx` dynamically recalculate labor costs when switching between Dealership, Independent, and DIY tiers.
- Global state synchronization: selecting a vehicle (`Make -> Model -> Engine`) in `VehicleHierarchySelector.jsx` / `GarageContext.jsx` must persist across all tabs (`TCO`, `Maintenance`, `OBD2`, `Comparator`).
- Currency/unit switching (`US ($) / UK (£) / EU (€)`) in `UnitContext.jsx` must convert every single price and distance unit across all active calculators and charts.

### R5. QA, Test Runner & Build Hygiene
- Run all test suites in `./tests/**` (`driveledger.test.js`, `jevCatalogJudge.test.js`, `vehicleArchetypes.test.js`, `vehicleCatalog.test.js`) and verify all pass.
- Run `npm run build` to verify zero broken imports, missing icons, or syntax errors.
- Ensure reference folders (`./odometer-web-application/` and `./stitch_design_system_generator/`) do not pollute or slow down the Vite production bundle.
- Perform automated grep/scan across `./src/` to confirm 0 Hungarian strings remain.

### R6. Product Strategy & User Retention Report
- Inspect the application and generate a comprehensive strategic document named `PRODUCT_STRATEGY_AND_ROADMAP.md` covering:
  1. Executive Audit Summary: fixes in UI/UX, copywriting, and business logic.
  2. User Retention & "Time-on-Site" Loops: concrete interactive features to double average session duration (e.g., Interactive "My Garage" persistence, "Used Car Negotiation Cheat Sheet" generator, Shareable URL states, Interactive "Should I Fix It or Sell It?" decision calculator).
  3. Conversion Rate Optimization (CRO) for AdSense & Affiliates: positioning VIN checks, OBD2 scanners, and insurance comparisons at peak user intent without hurting UX.
  4. Programmatic SEO & Traffic Scaling Roadmap: turning `vehicleCatalog.js` and `obdCodes.js` into indexable landing pages targeting Google US/UK/EU.

## Verification Resources
- Existing test suites in `./tests/**` (`driveledger.test.js`, `jevCatalogJudge.test.js`, `vehicleArchetypes.test.js`, `vehicleCatalog.test.js`)
- Production build: `npm run build`
- Hungarian character scan: regex `[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]` across `./src/`
- Design benchmarks: `./odometer-web-application/` and `./stitch_design_system_generator/clear_report/DESIGN.md`
- Additional verification methods and test cases may be determined and added by the team.

## Acceptance Criteria

### Linguistic & Text Quality
- [ ] Zero Hungarian words or characters (`[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]`) remain anywhere in `./src/` and `index.html`.
- [ ] Card headers across `HomePage.jsx`, `BlogPage.jsx`, `ReviewsPage.jsx`, `HeroVehicleFinder.jsx`, `SubsystemGrid.jsx`, `PreInspectionChecklist.jsx`, and `TechnicalMethodologyGuide.jsx` have at most 1 short sentence (10–15 words).
- [ ] Calculator explanations use concise 3-to-5 word bullet points or tooltips with no multi-sentence blocks of text.
- [ ] Long SEO text is collapsed by default within `<details>` / Accordion components.

### UI/UX & Layout
- [ ] UI styling follows the design language with `#F7F7F4` canvas background, `rounded-2xl` white cards, `#183D22` accents, and `tabular-nums` formatting.
- [ ] `Navbar.jsx` displays on a single line across desktop and mobile breakpoints without tab overflow.
- [ ] Calculator views show only 3–4 core inputs by default, with secondary inputs inside a "Customize assumptions" expandable section.
- [ ] Redundant slider pill buttons and duplicate vehicle selectors on single views are removed.

### Business Logic & State Synchronization
- [ ] Depreciation, financing APR%, and fuel consumption calculations in `TcoCalculator.jsx` and `CostTimeline.jsx` produce valid numbers without `NaN`, `Infinity`, or negative values.
- [ ] Wear multipliers (highway vs. city) and labor tiers (Dealership, Independent, DIY) dynamically update calculations in maintenance and OBD estimators.
- [ ] Vehicle selection in `VehicleHierarchySelector.jsx` / `GarageContext.jsx` persists across all tabs (`TCO`, `Maintenance`, `OBD2`, `Comparator`).
- [ ] Switching currencies/units (`US ($) / UK (£) / EU (€)`) in `UnitContext.jsx` updates all displayed prices, distances, and consumption metrics across all calculators.

### Verification & Hygiene
- [ ] All Vitest tests in `./tests/` pass with exit code 0.
- [ ] Production build `npm run build` succeeds with exit code 0 and zero bundle contamination from reference folders.
- [ ] Grep scan across `./src/` for `[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]` returns 0 matches.

### Product Strategy Deliverable
- [ ] `PRODUCT_STRATEGY_AND_ROADMAP.md` is created at the repository root containing Executive Audit Summary, User Retention Loops, CRO for AdSense & Affiliates, and Programmatic SEO Scaling Roadmap.

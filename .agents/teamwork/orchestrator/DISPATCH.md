## 2026-10-31T10:59:55Z
Kalkulátorok logikai auditja és hajtáslánc-specifikus (EV / PHEV / HEV / Benzin / Dízel) szétválasztás a DriveLedger alkalmazásban. A feladatot a megadott al-ágens szerepkörök mentén kell végrehajtani: Sub-Agent 1 (Hajtáslánc Architektúra - Powertrain Branching), Sub-Agent 2 (Kalkulátor Matematika & Pénzügyi Logika Audit), Sub-Agent 3 (Unit Tesztelés).

Working directory: d:\Antigravity_projects\DriveLedger
Integrity mode: development

## Requirements

### R1. Hajtáslánc Architektúra és szétválasztás (Powertrain Branching)
- Vezesd be a szigorú `PowertrainType = 'EV' | 'PHEV' | 'HEV' | 'ICE_PETROL' | 'ICE_DIESEL'` megkülönböztetést az adatmodellben.
- Ha a felhasználó elektromos autót (`EV`) választ:
  - TILOS megjeleníteni és számolni: motorolaj-cserét, vezérműszíjat/láncot, turbót, EGR-t, DPF-et, kettőstömegű lendkereket, befecskendezőket, gyújtógyertyát, kipufogót vagy hagyományos váltóolajat.
  - HELYETTE `EV` esetén ezeket számold és jelenítsd meg: akkumulátor degradáció (SoH % és kémiától függő kapacitásvesztés: LFP vs. NMC), fedélzeti töltő (OBC / ICCU) meghibásodási kockázat, hőszivattyú / akku-hűtőkör szelep hibák, reduktorház-olaj csere, megnövekedett tömeg miatti futómű- (lengőkar, szilent) és gumikopás, valamint rekuperáció miatti fékberohadás kockázata.
- Üzemanyag-kalkuláció: EV-nél `kWh / 100 km` (vagy `mi/kWh`) és otthoni vs. DC villámtöltési tarifa alapján számoljon; PHEV-nél kombinált elektromos + benzines profillal.

### R2. Kalkulátor Matematika & Pénzügyi Logika Audit
- Csak a kalkulátorokért, típusdefiníciókért és hibakódokért/karbantartásért felelős fájlokat vizsgáld a `src/` alatt.
- Vizsgáld felül az összes kalkulátort (True Cost to Own, értékvesztés/depreciation, karbantartási kockázati mátrix, OBD-II javítási költségbecslő).
- Javítsd a logikai hibákat:
  - Az értékvesztés (depreciation) ne lineáris legyen, hanem kövesse a valós görbét (első 3 évben meredekebb, majd laposodó, hajtáslánctól és futásteljesítménytől függő korrekcióval).
  - A karbantartási költség skálázódjon az aktuális futásteljesítmény (odometer) és az éves futás alapján (pl. nagyrevíziós küszöbök: 60k, 100k, 150k, 200k).
  - Kezeld a szélsőértékeket (0 km, 500 000+ km, negatív számok tiltása, irreális évjáratok szűrése).

### R3. Unit Tesztelés
- Készíts egy tömör automatizált Vitest tesztfájlt a számítási függvényekhez ahelyett, hogy hosszú logokat generálnál.
- A teszt ellenőrizze, hogy EV kiválasztásakor 0 db ICE-specifikus hiba/költség jelenik meg, és a TCO számítás matematikailag pontos.


## 2026-11-02T19:41:54Z
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

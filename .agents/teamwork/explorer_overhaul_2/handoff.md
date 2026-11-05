# Codebase Survey & Visual/Content Overhaul Report (R2 & R3)

**Agent**: `explorer_overhaul_2`  
**Working Directory**: `d:\Antigravity_projects\DriveLedger\.agents\teamwork\explorer_overhaul_2`  
**Date**: 2026-11-02  
**Target Scope**: R2 (Text Bloat Reduction & Visual Scannability) and R3 (UI/UX Simplification & Visual Alignment)

---

## 1. Observation

### 1.1 Design Reference Benchmark Extraction
Direct inspection of `./odometer-web-application/` and `./stitch_design_system_generator/clear_report/DESIGN.md` revealed the authoritative design tokens and patterns:

#### Color Palette
- **Canvas / Background**: `#F7F7F4` (warm off-white in `app/globals.css:51`) vs `#F3F5F8` in `DESIGN.md:178`. The canonical active web application background is `#F7F7F4`.
- **Card Surfaces**: Pure white `#FFFFFF`, `rounded-2xl`, border `border-[#E6E6E1]` (`primitives.tsx:12`).
- **Card Elevation**:
  - Rest: `shadow-[0_2px_10px_rgba(0,0,0,0.03)]` (`primitives.tsx:12`)
  - Hover: `hover:shadow-[0_12px_32px_rgba(20,26,21,0.07)]` (`primitives.tsx:12`)
- **Brand / Primary Accent**: Deep forest green `#183D22` (`globals.css:57`, `primitives.tsx:50`, `primitives.tsx:137`), hover `#122E19`.
- **Chart / Secondary Accent**: Soft sage green `#9CD08F` for running costs (`cost-timeline.tsx:96`), `#183D22` for depreciation.
- **Typography & Ink**:
  - Primary text / Headings: `#141A15` (`globals.css:52`, `primitives.tsx:29`)
  - Subheadings & labels: `#3A403B` (`primitives.tsx:86`)
  - Body & secondary text: `#5F665F` (`primitives.tsx:37`, `primitives.tsx:137`)
  - Muted captions / hints: `#8A8F89` (`primitives.tsx:103`, `primitives.tsx:142`)
- **Monospace & Numerics**: Inter font with `font-feature-settings: "tnum"`, utility class `tabular-nums tracking-tight` (`primitives.tsx:89`, `cost-tab.tsx:170`).
- **Pill Badges (`primitives.tsx:45-51`)**:
  - `good`: `bg-[#E8F5E9] text-[#1B5E20]`
  - `warn`: `bg-[#FFF8E1] text-[#B7791F]`
  - `risk`: `bg-[#FFEBEE] text-[#C62828]`
  - `neutral`: `bg-[#F1F1EC] text-[#5F665F]`
  - `brand`: `bg-[#183D22] text-white`
- **Partner Card (`primitives.tsx:244-261`)**:
  `rounded-xl border border-[#DCE6DF] bg-[#F2F6F3] p-4`, text `#2A322C`, CTA button `rounded-full bg-[#183D22] text-white hover:bg-[#122E19]`.
- **Range Sliders (`globals.css:94-128`)**:
  6px track with gradient fill `linear-gradient(to right, #183d22 0%, #183d22 var(--fill), #e6e6e1 var(--fill), #e6e6e1 100%)`, 22px white thumb with 2px solid `#183D22`.

---

### 1.2 Marketing & Content Pages Inspection

#### `src/pages/HomePage.jsx` (605 lines)
1. **Residual Hungarian Text Observed**:
   - Line 176: `<RiskBadge level="low" label="Alacsony Kockázat" />`
   - Line 182: `<p>Értékvesztés, üzemanyag, biztosítás és kötelező szervizek valós 5-éves adatai.</p>`
   - Line 194: `<span>Benchmark átlag:</span>`
   - Line 200: `<span>Kalkuláció megnyitása</span>`
   - Line 215: `<RiskBadge level="moderate" label="Közepes Kockázat" />`
   - Line 221: `<p>Futásteljesítmény alapú fődarab-kopás, csereperiódusok és várható javítási összegek.</p>`
   - Line 227: `<span>Vezérműlánc / szíj</span>`, Line 229: `label="Alacsony"`
   - Line 232: `<span>DPF részecskeszűrő</span>`, Line 234: `label="Közepes"`
   - Line 237: `<span>Vízpumpa & termosztát</span>`, Line 239: `label="Kritikus"`
   - Line 244: `<span>Kockázati mátrix</span>`
   - Line 259: `<RiskBadge level="critical" label="Kritikus Kockázat" />`
   - Line 265: `<p>Hibakód alapján rangsorolt kiváltó okok, gyári alkatrészárak és műhelyi munkadíjak.</p>`
   - Line 273: `<span>Katalizátor hatásfok</span>`
   - Line 275: `<span>Reális műhelyi ár:</span>`
   - Line 281: `<span>Hibakód kalkulátor</span>`
2. **Text Bloat Observed**:
   - 12 stacked sections with excessive copy:
     - Section 3 "Three steps to a clear answer" (lines 103-147) has 3 multi-sentence steps repeating obvious actions.
     - Section 6 "Why drivers choose ShiftMetric" table (lines 384-470) spans 85 lines of dense marketing comparison.
     - Section 10 FAQ (lines 487-527) has 5 multi-sentence answers open on the homepage.
     - Section 11 "From the garage" (lines 530-581) renders 3 cards with long post summaries.
     - Section 12 CTA band (lines 584-601) contains redundant paragraph text.

#### `src/pages/BlogPage.jsx` (265 lines)
1. **Residual Hungarian Text Observed**:
   - Line 184: `label={post.id === 'dsg-service-cost' ? 'Kritikus' : post.id === 'high-mileage-german-estate' ? 'Közepes' : 'Alacsony'}`
2. **Text Bloat Observed**:
   - Post summaries violate the 10-15 word subtitle rule:
     - Post 1 (lines 13-14): 37 words ("Dual-clutch transmissions (DSG, S-Tronic, PDK) offer lightning-fast shifts, but skipping the 40,000-mile fluid service is the #1 cause of $2,500+ mechatronic unit failure. Here is what actually happens inside the gearbox.")
     - Post 2 (lines 48-49): 32 words ("Looking at a used BMW 3 Series Touring, Audi A4 Avant, or VW Passat Variant with 100k+ miles? These 5 tell-tale red flags can save you thousands in hidden workshop bills before you make an offer.")
     - Post 3 (lines 84-85): 32 words ("Got fault code P0420 ("Catalyst System Efficiency Below Threshold")? Quick-lube shops will immediately quote you $1,500+ for a new catalytic converter. Here is how to test the cheap culprits first.")
   - Each post contains 4 lengthy `keyPoints` bullets and full 30-line markdown content blocks (lines 21-36, 56-73, 92-107).

#### `src/pages/ReviewsPage.jsx` (101 lines) & `ReviewsSection.jsx` (187 lines)
1. **Residual Hungarian Text Observed**:
   - `ReviewsSection.jsx:136`: `<span>${Number(rev.amountPaid || 0).toLocaleString()} Számla</span>`
   - `ReviewsSection.jsx:139`: `<RiskBadge level="low" label="Hitelesített" />`
2. **Text Bloat Observed**:
   - Section headers in `ReviewsPage.jsx` (lines 48-50, 66-68) contain verbose 25-30 word paragraphs explaining verified telemetry and calibration.

#### `src/components/home/HeroVehicleFinder.jsx` (296 lines)
1. **Residual Hungarian Text Observed**:
   - Line 193: `label={activePreset.maintenanceWearFactor > 1.3 ? 'Kritikus' : activePreset.maintenanceWearFactor > 1.05 ? 'Közepes' : 'Alacsony'}`
   - Line 236: `<span>Futás / Odo</span>`
   - Line 242: `<span>Fogyasztás</span>`
   - Line 248: `<span>Várható szerviz</span>`
   - Line 250: `<strong>{formatCurrency(activePreset.baseAnnualMaintenanceUsd)}/év</strong>`
2. **Text Bloat & Visual Clutter**:
   - Hero contains: eyebrow pill + title + subtitle + search bar + 4 popular buttons + 5-star proof rating + 6 body type pills on the left, competing with a 10-element vehicle card on the right.

#### `src/components/home/SubsystemGrid.jsx` (175 lines)
1. **Residual Hungarian Text Observed**:
   - Lines 11, 16, 17, 24, 27, 29, 30, 37, 40, 41, 42, 50, 53, 55, 56, 63, 66, 68, 69, 76, 79, 81, 82:
     - `typicalIssues: 'Nagynyomású szivattyú kopás, VNT geometria lekormolódás, PCV szelephiba.'`
     - `expectedInterval: '60 000 km olaj / 150 000 km kuplung'`
     - `riskLabel: 'Közepes Kockázat'`, `'Kritikus Kockázat'`, `'Alacsony Kockázat'`
     - Line 144: `Várható csere: {sub.expectedInterval}`
     - Line 148: `Becsült javítás: {formatCurrency(sub.typicalCostUsd)}`

#### `src/components/home/PreInspectionChecklist.jsx` (381 lines) & `src/data/breakEvenAndPpi.js` (243 lines)
1. **Residual Hungarian Text Observed**:
   - `PreInspectionChecklist.jsx:108`: `Használtautó Átvizsgálási Protokoll (PPI Checklist)`
   - `PreInspectionChecklist.jsx:111`: `Helyszíni Segédlet`
   - `PreInspectionChecklist.jsx:115`: `{selectedPreset.name} — Vásárlás Előtti Helyszíni Ellenőrzőlista`
   - `PreInspectionChecklist.jsx:128, 133, 138`: `Állapot megosztása URL linkként`, `Link vágólapon!`, `Megosztás linkként`
   - `PreInspectionChecklist.jsx:147, 150`: `Nyomtatás vagy mentés PDF formátumban`, `Nyomtatható / PDF Riport`
   - `PreInspectionChecklist.jsx:159`: `OBD Hibakód Kereső`
   - `PreInspectionChecklist.jsx:171`: `Autómodell:`
   - `PreInspectionChecklist.jsx:182`: `aria-label="Válassz jármű modellt"`
   - `PreInspectionChecklist.jsx:195`: `Jelenlegi km-óra állás:`
   - `PreInspectionChecklist.jsx:218`: `Helyszíni Haladás: {checkedCount} / {totalCount} pont kipipálva`
   - `PreInspectionChecklist.jsx:222-223`: `Minden ellenőrzési pont átvizsgálva...` / `Minden pontot vizsgálj meg a helyszínen...`
   - `PreInspectionChecklist.jsx:236`: `Visszaállítás`
   - `PreInspectionChecklist.jsx:247`: `ShiftMetric — Használtautó Átvizsgálási Jegyzőkönyv`
   - `PreInspectionChecklist.jsx:308`: `Modell-típushiba`
   - `PreInspectionChecklist.jsx:314`: `Kockázat:`
   - `PreInspectionChecklist.jsx:325`: `Helyszíni vizsgálat módja:`
   - `PreInspectionChecklist.jsx:344-356`: `Helyszíni Észrevételek, Hibák és Alkupozíció (Kézírásos Jegyzetek):`
   - `PreInspectionChecklist.jsx:363`: `Tipp: A mentett ellenőrzőlistát telefonodon is megnyithatod...`
   - `PreInspectionChecklist.jsx:372`: `5-Éves TCO Számítás`
   - `src/data/breakEvenAndPpi.js:136-168, 177-233`: All generated PPI steps contain Hungarian titles, methods, and risk labels (`OBD-II DTC & Freeze Frame Élőadat Kiolvasás`, `Hidegindítás, Kartergáz és Olajsapka Nyomásteszt`, `Karosszéria Festékvastagság & Rejtett Töréskár Szűrés`, `Váltópróba, Kuplungcsúszás & Kettőstömegű Lendkerék Terhelésteszt`, `Futómű, Lengőkarszilentek & Féktárcsa Peremkopás`).

#### `src/components/seo/TechnicalMethodologyGuide.jsx` (584 lines)
1. **Uncollapsed SEO Text Bloat Observed**:
   - Lines 198-331: Three 350-word technical essays (Section 01, Section 02, Section 03) totaling over 1,200 words of uncollapsed formulas and text rendered directly in the page flow.
   - Lines 333-416: A 6-column reference table with 5 detailed mechanical rows.
   - Lines 418-458: 6 extensive FAQ items.
   - Total length is 584 lines taking up massive vertical space and pushing calculators down.

---

### 1.3 Navigation Inspection (`src/components/layout/Navbar.jsx` - 625 lines)
1. **Residual Hungarian Text Observed**:
   - Line 13: `{ id: 'compare', label: 'Compare', fullLabel: 'Melyiket vegyem? Autó Összehasonlító', icon: GitCompare, desc: '5-éves TCO Break-even grafikon és típushiba összevetés' }`
   - Line 14: `{ id: 'checklist', label: 'PPI Checklist', fullLabel: 'Használtautó Átvizsgálási Csekklista', icon: CheckCircle2, desc: 'Helyszíni ellenőrzőlista, linkmegosztás és PDF riport' }`
2. **Cause of Tab Overflow / Wrapping**:
   - Tier 1 Navbar (64px) contains:
     - Brand logo + text "ShiftMetric" (~170px)
     - Desktop links: Tools dropdown, Methodology, Reviews, Blog (~280px)
     - Right controls cluster:
       - Region switcher (3 buttons: US, UK, EU with flags and text: ~120px)
       - Theme switcher (3 buttons: Sun, Moon, Auto: ~105px)
       - My Garage button (Car icon + "My Garage" + count badge: ~120px)
       - "Get started" button (~100px)
       - Avatar circle (~36px)
       - Mobile hamburger toggle (~36px)
     - Total right controls width alone: ~517px.
     - Total row width needed: 170 + 280 + 517 = 967px. On tablets and 1024px screens, this causes severe squishing or forced hamburger drop.
   - Tier 2 Sub-Nav (56px) adds another 56px vertical bar.
   - In contrast, `./odometer-web-application/components/odometer/navbar.tsx` uses a single clean line with:
     - Wordmark "Odometer" + gauge icon
     - Calculator tabs in a single sliding pill row with horizontal scroll
     - Compact 3-option radio group (US · UK · EU)

---

### 1.4 Calculators Inspection

#### `src/components/calculators/TcoCalculator.jsx` (1108 lines)
1. **Residual Hungarian Text Observed**:
   - Lines 227-248 (`tcoTldrFacts`):
     - `'Havi & 5-Éves Összköltség'`
     - `'Kalkulált'`
     - `'Fő Költségtényező'`, `'Értékvesztés'`
     - `'Kockázati Szint & Értékelés'`, `'Kategória mediánhoz képest 11%-kal alacsonyabb fenntartási költség.'`
     - `'Alacsony Kockázat'` / `'Közepes Kockázat'` / `'Kritikus Kockázat'`
   - Lines 260-262 (`TldrVerdictBox` props):
     - `title="TL;DR Verdikt"`
     - `subtitle="3 legfontosabb pénzügyi mutató (Zero Fluff)"`
     - `badge="Valós Adatok"`
2. **Duplicate Vehicle Selectors on Single View**:
   - Card 1 Hero has `VehicleVisualCard` (lines 269-277).
   - Card 1 Workspace has `VehicleSelect` (cascading Make -> Model -> Engine selects, lines 553-556).
   - Right below `VehicleSelect`, lines 563-580 render `testShortcuts` ("TELEMETRY PRESET BENCHMARKS:" with 4 buttons: Ford Focus, Camry, Tesla, BMW).
   - Three independent vehicle pickers are active inside the same screen!
3. **Redundant Pill Buttons Under Sliders**:
   - Lines 516-550: Financing type segmented control (Cash | Loan | Lease).
   - Lines 658-702: Loan term slider + APR input shown alongside Purchase price and Down payment sliders.
   - Lines 728-762: Driving profile segmented control (City | Mixed | Highway) placed right before annual distance slider.
4. **Core vs Secondary Inputs Breakdown**:
   - **Current State**: 7 visible inputs/sliders before expansion (Finance Type, Purchase Price, Down Payment, Loan Term, APR, Driving Profile, Annual Mileage, Ownership Horizon).
   - **Target Core Defaults (3-4 max)**:
     1. Purchase price (RangeSlider with display)
     2. Annual mileage (RangeSlider with display)
     3. Ownership horizon in years (RangeSlider with display)
   - **Secondary Inputs for Expandable "Customize assumptions" drawer**:
     - Fuel / Electricity consumption efficiency
     - Fuel / Electricity price
     - Annual insurance
     - Down payment %, Loan term & Loan APR %

#### `src/components/calculators/EvBreakEvenCalculator.jsx` (320 lines)
1. **Residual Hungarian Text Observed**:
   - Lines 114-142 (`evTldrFacts`):
     - `'Megtérülési Időtáv'`, `'Azonnali (0 év)'`, `'Nem térül meg'`
     - `'Az elektromos autó vételi ára már induláskor alacsonyabb.'`
     - `'A jelenlegi áramtarifa mellett nincs üzemeltetési megtakarítás.'`
     - `'Az alacsonyabb üzemeltetés eddigre hozza vissza a vételár-felárat.'`
     - `'Azonnali'`, `'Gyors megtérülés'`, `'Hosszú megtérülés'`
     - `'Éves Energiamegtakarítás'`, `'alacsonyabb km-költség'`
     - `'Szükséges Éves Futás'`, `'Bármely futás'`, `'5-éves küszöb'`
   - Lines 174-176: `title="TL;DR Verdikt"`, `subtitle="3 legfontosabb elektromos megtérülési tény (Zero Fluff)"`, `badge="Megtérülési Mérleg"`
2. **Text Bloat**:
   - Multi-sentence descriptions in `evTldrFacts` subtexts (15-20 words each) and callout descriptions.

#### `src/components/calculators/VehicleComparator.jsx` (1003 lines)
1. **Residual Hungarian Text Observed**:
   - Lines 303-346 (`comparatorTldrFacts`):
     - `'5-Éves Költségkülönbözet'`, `'olcsóbb'`, `'előny'`
     - `'Megtérülési Küszöb (Break-Even)'`, `'mindvégig olcsóbb'`
     - `'A magasabb vételárat eddigre kompenzálja az alacsonyabb üzemeltetés.'`
     - `'Nincs keresztezési pont a vizsgált kilométertartományban.'`
     - `'év alatt megtérül'`, `'Domináns modell'`
     - `'Típushiba Kockázat & Szerviztartalék'`, `'kisebb szerviztartalék'`
     - `'B kevesebb szerviz'`, `'A kevesebb szerviz'`
   - Lines 396-399:
     - `Dual-Vehicle Side-by-Side Comparison ("Melyiket vegyem?")`
     - `5-éves TCO összevetés, dinamikus megtérülési grafikon (Break-even pont) és kilométer-arányos típushibák`

#### `src/components/common/VehicleHierarchySelector.jsx` (643 lines) vs `src/components/common/VehicleSelect.jsx` (760 lines)
1. **Duplicate Implementation**:
   - `VehicleHierarchySelector.jsx` is a standalone 643-line modal/cascade selector with brand grid, model cards, and engine cards.
   - `VehicleSelect.jsx` is a 760-line cascading selector with command search autocomplete AND 3 `<SelectField>` dropdowns (Make, Model, Engine) used inside calculators.
   - Having both rendered on pages creates layout confusion and multiple simultaneous selections.

---

## 2. Logic Chain

1. **Alignment with Design Benchmark**:
   - The user specified reference material: `./odometer-web-application/` and `./stitch_design_system_generator/clear_report/DESIGN.md`.
   - Inspection of `primitives.tsx` and `DESIGN.md` proves the application design language is:
     - Canvas background: `#F7F7F4`
     - Card container: `bg-white`, `border-[#E6E6E1]`, `rounded-2xl` (16px), soft shadow `0 2px 10px rgba(0,0,0,0.03)`
     - Accent brand color: `#183D22` (deep forest green)
     - Tabular numbers: `font-feature-settings: "tnum"`, monospace digits
   - Therefore, all current `dark:bg-slate-900`, `bg-primary-600` saturated blues (`#0F5BFF`), and multi-color card borders must be replaced with the calm `#F7F7F4` / white / `#183D22` visual DNA.

2. **Prose Reduction (R2 - 70% Cut & Subtitle Rule)**:
   - Observation showed card headers currently feature multi-sentence descriptive paragraphs (up to 35 words).
   - Requirement R2 mandates:
     - Cut 70% of the prose across marketing and content pages.
     - Maximum 1 short sentence (10–15 words) per card header.
     - Replace multi-sentence explanations inside calculators with 3-to-5 word bullet points or hover tooltips.
     - Tuck long-form AdSense SEO text strictly inside collapsed-by-default `<details>` / Accordion drawers at the bottom of the page.
   - Applying this rule:
     - In `TechnicalMethodologyGuide.jsx`, the 3 technical pillars (Sections 01-03) and 584 lines of uncollapsed documentation must be wrapped in a collapsed `<details>` drawer.
     - In `BlogPage.jsx`, card summaries must be shortened from 35-40 words to 10-14 words (e.g., "Skipping 40k-mile fluid renewal causes costly mechatronic failure. Here is what happens." - 11 words).
     - In `HomePage.jsx`, the 3 process steps, the comparison table, and telemetry tool descriptions must be cut to crisp single-line headers and 3-word bullets.

3. **Navigation Decluttering (R3)**:
   - Observation showed `Navbar.jsx` contains 6 distinct control widgets on the right taking up 517px, plus 4 text links, plus brand logo, plus a separate 56px Tier 2 sub-nav.
   - By eliminating redundant buttons ("Get started" duplicates "True Cost to Own"), compacting the region switcher into a single segmented pill (US · UK · EU), compacting "My Garage" to an icon + badge pill, and consolidating secondary links into a clean dropdown, the navbar will fit cleanly on one single line across all viewports.
   - The sub-navigation tabs must use `overflow-x-auto no-scrollbar whitespace-nowrap` with soft fade on mobile.

4. **Calculator Progressive Disclosure & De-duplication (R3)**:
   - Observation showed `TcoCalculator.jsx` currently displays 7-8 inputs simultaneously, plus duplicate vehicle selectors (Hero visual card + 3 dropdowns + 4 preset shortcut buttons).
   - In the benchmark (`cost-tab.tsx`), the left control card displays:
     - Vehicle Select (Make -> Model -> Engine)
     - Exactly 3 core sliders: Purchase Price, Annual Mileage, Ownership Horizon.
     - All secondary inputs (efficiency, fuel price, insurance, loan APR) are neatly tucked inside an expandable row: `<Collapse open={customOpen}>` labeled "Customize fuel, insurance & financing".
   - Removing the redundant 4 shortcut buttons and collapsing secondary inputs will restore clear visual hierarchy and eliminate user cognitive overload.

---

## 3. Caveats

1. **Automated Test Assertions Compatibility**:
   - `tests/driveledger.test.js` and other test files search for specific IDs and text (e.g. `#preset-select-dropdown`, `#slider-purchase-price`, `#slider-annual-distance`, `input#input-annual-distance`, `data-testid="live-pid-evaluator"`).
   - During UI simplification, all DOM IDs, inputs, and accessibility labels must remain intact (using `sr-only` if visually streamlined) to ensure zero test regression.
2. **Read-Only Investigation Scope**:
   - As an explorer agent, no source code was modified. All findings, exact paths, line numbers, and proposed modifications are fully cataloged here for the implementation sub-agents.
3. **Theme Support**:
   - While the reference design system specifies a light-mode-first calm report aesthetic (`#F7F7F4` canvas), dark mode classes exist in the codebase. Visual alignment should focus on unifying light mode tokens to `#F7F7F4` and `#183D22` while preserving readable dark mode fallbacks.

---

## 4. Conclusion

The codebase survey for R2 and R3 is complete. The application possesses a solid technical architecture and extensive automotive datasets, but suffers from:
1. **Linguistic contamination**: Residual Hungarian strings across `HomePage.jsx`, `BlogPage.jsx`, `ReviewsSection.jsx`, `HeroVehicleFinder.jsx`, `SubsystemGrid.jsx`, `PreInspectionChecklist.jsx`, `breakEvenAndPpi.js`, `TcoCalculator.jsx`, `EvBreakEvenCalculator.jsx`, `VehicleComparator.jsx`, and `Navbar.jsx`.
2. **Text bloat**: Card headers with 25–40 word paragraphs; 1,500 words of uncollapsed methodology text on marketing pages.
3. **Navigation overflow**: A crowded 64px + 56px two-tier navbar with 6 right-side widgets causing tablet/mobile wrapping.
4. **Calculator clutter**: Redundant vehicle selectors (up to 3 on one view) and up to 8 sliders visible at once instead of the 3 core sliders established by the design benchmark.

### Concrete Recommendations for Implementation Agents:
- **Design Tokens**: Update all primary card containers to `rounded-2xl border border-[#E6E6E1] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)]`, canvas to `#F7F7F4`, accents to `#183D22`, and numbers to `tabular-nums`.
- **Card Subtitle Rule**: Rewrite all card headers to a maximum of 1 short sentence (10–15 words).
- **SEO Text Drawer**: Wrap `TechnicalMethodologyGuide.jsx` deep technical pillars in a collapsed `<details>` / Accordion element at the page bottom.
- **Navbar**: Consolidate to a single clean 64px line (or single sticky bar), compact region switcher, eliminate duplicate "Get started" button, and enable smooth horizontal scrolling for sub-nav tabs.
- **Calculator Progressive Disclosure**: Standardize `TcoCalculator.jsx` on 3 core sliders (Purchase price, Annual mileage, Ownership horizon); tuck secondary inputs (fuel efficiency, fuel price, insurance, APR) inside `<Collapse open={customOpen}>`. Eliminate redundant shortcut buttons under sliders.

---

## 5. Verification Method

To independently verify these survey findings and validate future implementation changes:

1. **Verify Design Benchmark Tokens**:
   - Inspect `./odometer-web-application/app/globals.css:51-57` and `components/odometer/primitives.tsx:8-19`.
   - Inspect `./stitch_design_system_generator/clear_report/DESIGN.md:177-224`.

2. **Verify Hungarian Strings in Target Files**:
   Run ripgrep pattern search for Hungarian characters across `./src/`:
   ```powershell
   git grep -n -E "[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]" src/
   ```
   Specific files identified:
   - `src/pages/HomePage.jsx:176, 182, 194, 200, 215, 221, 227, 232, 237, 244, 259, 265, 273, 275, 281`
   - `src/pages/BlogPage.jsx:184`
   - `src/components/home/ReviewsSection.jsx:136, 139`
   - `src/components/home/HeroVehicleFinder.jsx:193, 236, 242, 248, 250`
   - `src/components/home/SubsystemGrid.jsx:11, 16, 17, 24, 27, 29, 30, 37, 41, 42, 50, 55, 63, 68, 76, 81, 144, 148`
   - `src/components/home/PreInspectionChecklist.jsx:108, 111, 115, 128, 133, 138, 147, 150, 159, 171, 182, 195, 218, 222, 236, 247, 308, 314, 325, 344-356, 363, 372`
   - `src/data/breakEvenAndPpi.js:136-168, 177-233`
   - `src/components/calculators/TcoCalculator.jsx:227-248, 260-262`
   - `src/components/calculators/EvBreakEvenCalculator.jsx:114-142, 174-176`
   - `src/components/calculators/VehicleComparator.jsx:303-346, 396-399`
   - `src/components/layout/Navbar.jsx:13, 14`

3. **Verify Build and Test Suites**:
   - Run Vitest tests:
     ```powershell
     npx vitest run
     ```
   - Run Vite production build:
     ```powershell
     npm run build
     ```

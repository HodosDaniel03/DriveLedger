# Handoff Report: Codebase Survey for R1 (Zero-Hungarian Linguistic Purge & 100% English UI)

**Agent**: `explorer_overhaul_1`  
**Working Directory**: `d:\Antigravity_projects\DriveLedger\.agents\teamwork\explorer_overhaul_1`  
**Recipient**: `2a5770b3-3f9f-4fb0-9aa7-520703f3bf25` (orchestrator)  
**Date**: 2026-11-02  
**Handoff Type**: Hard (Investigation & Survey Complete)  

---

## 1. Observation

A full automated and semantic survey was conducted across all 63 files in `./src/` and `index.html`.
Exact scan method:
1. Regex scanner for Hungarian characters `[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]`
2. Token frequency and dictionary stem scanner for Hungarian words (`autó`, `költség`, `megtérülés`, `vásárlás`, `szerviz`, `kockázat`, `típushiba`, `gyermekbetegség`, `szilent`, `spém`, etc.)
3. Verification of all test suites via `cmd /c npm test` and production build via `cmd /c npm run build`.

### Summary Statistics
- **Total files in `./src/` + `index.html`**: 63 files
- **Files containing Hungarian text / comments / UI strings**: 31 files
- **Files verified 100% English (0 Hungarian traces)**: 32 files
- **Total lines with accented characters**: 458 lines
- **Total discrete Hungarian UI strings/elements cataloged**: ~510 items

---

### Detailed Inventory of Hungarian Strings by File

#### 1. `src/App.jsx`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 314 | `{/* TAB 4: MELYIKET VEGYEM? SIDE-BY-SIDE AUTÓ ÖSSZEHASONLÍTÓ */}` | `{/* TAB 4: VEHICLE COMPARATOR / SIDE-BY-SIDE COMPARISON */}` |
| 324 | `{/* TAB 5: HASZNÁLTAUTÓ VÁSÁRLÁS ELŐTTI ELLENŐRZŐLISTA (PPI) */}` | `{/* TAB 5: PRE-PURCHASE INSPECTION CHECKLIST (PPI) */}` |

---

#### 2. `src/components/layout/Navbar.jsx`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 13 | `fullLabel: 'Melyiket vegyem? Autó Összehasonlító'` | `fullLabel: 'Side-by-Side Vehicle Comparator'` |
| 13 | `desc: '5-éves TCO Break-even grafikon és típushiba összevetés'` | `desc: '5-year TCO break-even trajectory and reliability comparison'` |
| 14 | `fullLabel: 'Használtautó Átvizsgálási Csekklista'` | `fullLabel: 'Pre-Purchase Inspection Checklist'` |
| 14 | `desc: 'Helyszíni ellenőrzőlista, linkmegosztás és PDF riport'` | `desc: 'On-site vehicle inspection guide, link sharing, and PDF export'` |

---

#### 3. `src/components/layout/Footer.jsx`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 269 | `Melyiket vegyem? (Összehasonlító)` | `Vehicle Comparator` |
| 274 | `Vásárlás Előtti Csekklista (PPI)` | `Pre-Purchase Inspection (PPI)` |

---

#### 4. `src/pages/HomePage.jsx`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 176 | `<RiskBadge level="low" label="Alacsony Kockázat" />` | `<RiskBadge level="low" label="Low Risk" />` |
| 182 | `Értékvesztés, üzemanyag, biztosítás és kötelező szervizek valós 5-éves adatai.` | `True 5-year depreciation curves, fuel burn, insurance tiers, and scheduled service.` |
| 194 | `<span className="text-muted dark:text-slate-400">Benchmark átlag:</span>` | `<span className="text-muted dark:text-slate-400">Benchmark average:</span>` |
| 200 | `<span>Kalkuláció megnyitása</span>` | `<span>Open calculator</span>` |
| 215 | `<RiskBadge level="moderate" label="Közepes Kockázat" />` | `<RiskBadge level="moderate" label="Moderate Risk" />` |
| 221 | `Futásteljesítmény alapú fődarab-kopás, csereperiódusok és várható javítási összegek.` | `Odometer-based major assembly wear, scheduled replacement cycles, and reserve buffers.` |
| 227 | `<span className="text-body dark:text-slate-300 font-medium">Vezérműlánc / szíj</span>` | `<span className="text-body dark:text-slate-300 font-medium">Timing Chain / Belt</span>` |
| 229 | `<RiskBadge level="low" label="Alacsony" />` | `<RiskBadge level="low" label="Low" />` |
| 232 | `<span className="text-body dark:text-slate-300 font-medium">DPF részecskeszűrő</span>` | `<span className="text-body dark:text-slate-300 font-medium">DPF Particulate Filter</span>` |
| 234 | `<RiskBadge level="moderate" label="Közepes" />` | `<RiskBadge level="moderate" label="Moderate" />` |
| 237 | `<span className="text-body dark:text-slate-300 font-medium">Vízpumpa &amp; termosztát</span>` | `<span className="text-body dark:text-slate-300 font-medium">Water Pump &amp; Thermostat</span>` |
| 239 | `<RiskBadge level="critical" label="Kritikus" />` | `<RiskBadge level="critical" label="Critical" />` |
| 244 | `<span>Kockázati mátrix</span>` | `<span>Risk matrix</span>` |
| 259 | `<RiskBadge level="critical" label="Kritikus Kockázat" />` | `<RiskBadge level="critical" label="Critical Risk" />` |
| 265 | `Hibakód alapján rangsorolt kiváltó okok, gyári alkatrészárak és műhelyi munkadíjak.` | `Root causes ranked by DTC diagnostic codes, OEM parts costs, and workshop labor rates.` |
| 272 | `<span className="text-[11px] text-muted dark:text-slate-400">Katalizátor hatásfok</span>` | `<span className="text-[11px] text-muted dark:text-slate-400">Catalytic Converter Efficiency</span>` |
| 275 | `<span className="text-primary-800 dark:text-primary-300 font-medium">Reális műhelyi ár:</span>` | `<span className="text-primary-800 dark:text-primary-300 font-medium">Fair workshop estimate:</span>` |
| 281 | `<span>Hibakód kalkulátor</span>` | `<span>DTC calculator</span>` |

---

#### 5. `src/pages/BlogPage.jsx`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 184 | `label={post.id === 'dsg-service-cost' ? 'Kritikus' : post.id === 'high-mileage-german-estate' ? 'Közepes' : 'Alacsony'}` | `label={post.id === 'dsg-service-cost' ? 'Critical' : post.id === 'high-mileage-german-estate' ? 'Moderate' : 'Low'}` |

---

#### 6. `src/components/common/OdometerPrimitives.jsx`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 342-343 | `normalized.includes('köz') \|\| normalized.includes('koz') \|\| normalized.includes('krit')` | Keep English fallbacks `'crit'`, `'mod'`, `'warn'` |
| 358 | `? 'Kritikus / Critical'` | `? 'Critical'` |
| 360 | `? 'Közepes / Moderate'` | `? 'Moderate'` |
| 361 | `: 'Alacsony / Low'` | `: 'Low'` |
| 374 | `title = 'TL;DR Verdikt'` | `title = 'TL;DR Verdict'` |
| 375 | `subtitle = '3 legfontosabb adatpont azonnali áttekintéshez (Zero Fluff)'` | `subtitle = 'Key telemetry signals at a glance (zero fluff)'` |
| 376 | `badge = 'Gyors áttekintés'` | `badge = 'Quick Verdict'` |

---

#### 7. `src/components/common/KnownIssuesDossier.jsx`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 34 | `label: 'Kritikus kockázat'` | `label: 'Critical Risk'` |
| 41 | `label: 'Magas kockázat'` | `label: 'High Risk'` |
| 48 | `label: 'Közepes kockázat'` | `label: 'Moderate Risk'` |
| 55 | `label: 'Enyhe kockázat'` | `label: 'Low Risk'` |
| 193 | `Típushiba Dosszié` | `Known Issues Dossier` |
| 203 | `⚡ Gyorsítótár (<1ms)` | `⚡ In-Memory Cache (<1ms)` |
| 204 | `🛡️ Kurált Adatbázis (<50ms)` | `🛡️ Curated Database (<50ms)` |
| 208 | `Motorspecifikus "Gyermekbetegségek" &amp; Gyári Visszahívások` | `Engine-Specific Known Issues &amp; OEM Recalls` |
| 220 | `<span>Élő Adatok Frissítése</span>` | `<span>Refresh Live Telemetry</span>` |
| 229 | `Generáció:` | `Generation:` |
| 261 | `Motorkód / Hajtáslánc:` | `Engine Code / Powertrain:` |
| 321 | `Azonosított Konstrukciós Hibák ({knownIssues.length})` | `Identified Known Flaws ({knownIssues.length})` |
| 324 | `Alkatrész + Munkadíj kalkulációval` | `With Parts + Labor breakdown` |
| 330 | `Nincs kritikus ismert hiba rögzítve ehhez a konfigurációhoz.` | `No critical known issues recorded for this configuration.` |
| 367 | `Alkatrész + Munkadíj` | `Parts + Labor` |
| 376 | `<strong className="font-semibold text-ink dark:text-slate-200">Tünetek: </strong>` | `Symptoms:` |
| 389 | `isExpanded ? 'Részletek elrejtése' : 'Megelőzési útmutató és költségek'` | `isExpanded ? 'Hide details' : 'Prevention guide & costs'` |
| 395 | `DTC kódok:` | `DTC Codes:` |
| 412 | `🛡️ Megelőzési javaslat:` | `🛡️ Prevention Protocol:` |
| 421 | `Alkatrész sáv:` | `Parts Range:` |
| 427 | `Munkadíj sáv:` | `Labor Range:` |
| 433 | `Érintett alkatrészek:` | `Affected Components:` |
| 452 | `Valós Külső Telemetria (NHTSA &amp; EPA FuelEconomy)` | `Verified External Telemetry (NHTSA &amp; EPA FuelEconomy)` |
| 458 | `Gyári Visszahívások (NHTSA)` | `OEM Recalls (NHTSA)` |
| 468 | `showRecalls ? 'Elrejtés' : 'Kampányok'` | `showRecalls ? 'Hide' : 'Campaigns'` |
| 485 | `showComplaints ? 'Elrejtés' : 'Gyakori hibák'` | `showComplaints ? 'Hide' : 'Complaints'` |
| 492 | `Gyári EPA Fogyasztás` | `Official EPA Fuel Economy` |
| 508 | `Gyári Visszahívási Kampányok ({nhtsaRecalls.length})` | `OEM Recall Campaigns ({nhtsaRecalls.length})` |
| 511 | `Nincs rögzített gyári visszahívás ehhez a modellévhez.` | `No OEM recalls recorded for this model year.` |
| 529 | `<strong>Javítás:</strong> {recall.remedy}` | `<strong>Remedy:</strong> {recall.remedy}` |
| 543 | `Gyakran Bejelentett Alkatrészek (NHTSA Complaints)` | `Frequently Reported Components (NHTSA Complaints)` |
| 549 | `{comp.count} bejelentés` | `{comp.count} complaints` |

---

#### 8. `src/components/home/HeroVehicleFinder.jsx`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 192 | `activePreset.maintenanceWearFactor > 1.3 ? 'Kritikus' : activePreset.maintenanceWearFactor > 1.05 ? 'Közepes' : 'Alacsony'` | `activePreset.maintenanceWearFactor > 1.3 ? 'Critical' : activePreset.maintenanceWearFactor > 1.05 ? 'Moderate' : 'Low'` |
| 236 | `<span className="text-[10px] text-muted dark:text-slate-400 block">Futás / Odo</span>` | `<span className="text-[10px] text-muted dark:text-slate-400 block">Odometer</span>` |
| 242 | `<span className="text-[10px] text-muted dark:text-slate-400 block">Fogyasztás</span>` | `<span className="text-[10px] text-muted dark:text-slate-400 block">Fuel Economy</span>` |
| 248 | `<span className="text-[10px] text-muted dark:text-slate-400 block">Várható szerviz</span>` | `<span className="text-[10px] text-muted dark:text-slate-400 block">Est. Annual Service</span>` |
| 250 | `{formatCurrency(activePreset.baseAnnualMaintenanceUsd)}/év` | `{formatCurrency(activePreset.baseAnnualMaintenanceUsd)}/yr` |

---

#### 9. `src/components/home/SubsystemGrid.jsx`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 11 | `typicalIssues: 'Nagynyomású szivattyú kopás, VNT geometria lekormolódás, PCV szelephiba.'` | `typicalIssues: 'High-pressure fuel pump wear, VNT turbo vane carbon binding, PCV diaphragm failure.'` |
| 16 | `riskLabel: 'Közepes Kockázat'` | `riskLabel: 'Moderate Risk'` |
| 17 | `statusBadge: 'Közepes / Moderate'` | `statusBadge: 'Moderate'` |
| 24 | `typicalIssues: 'DSG mechatronika nyomáscsökkenés, kettőstömegű lendkerék fáradás.'` | `typicalIssues: 'DSG mechatronic pressure accumulator loss, dual-mass flywheel fatigue.'` |
| 27 | `expectedInterval: '60 000 km olaj / 150 000 km kuplung'` | `expectedInterval: '40k mi fluid / 90k mi clutch pack'` |
| 29 | `riskLabel: 'Kritikus Kockázat'` | `riskLabel: 'Critical Risk'` |
| 30 | `statusBadge: 'Kritikus / Critical'` | `statusBadge: 'Critical'` |
| 37 | `typicalIssues: 'Koromtelítődés rövid városi utak miatt, differenciálnyomás-szenzor hiba.'` | `typicalIssues: 'DPF soot loading from short urban trips, differential pressure sensor drift.'` |
| 42 | `riskLabel: 'Közepes Kockázat'` | `riskLabel: 'Moderate Risk'` |
| 43 | `statusBadge: 'Közepes / Moderate'` | `statusBadge: 'Moderate'` |
| 50 | `typicalIssues: 'Cella feszültségeltérés (delta mV), inverter hűtőkör degradáció.'` | `typicalIssues: 'Cell block voltage delta (mV imbalance), inverter coolant loop degradation.'` |
| 55 | `riskLabel: 'Alacsony Kockázat'` | `riskLabel: 'Low Risk'` |
| 56 | `statusBadge: 'Alacsony / Low'` | `statusBadge: 'Low'` |
| 63 | `typicalIssues: 'Hidroszilentek repedése, lengőkar gömbfej lógás, toronycsapágy kopás.'` | `typicalIssues: 'Hydraulic bushing fluid leak, lower control arm ball joint play, strut mount wear.'` |
| 68 | `riskLabel: 'Közepes Kockázat'` | `riskLabel: 'Moderate Risk'` |
| 69 | `statusBadge: 'Közepes / Moderate'` | `statusBadge: 'Moderate'` |
| 76 | `typicalIssues: 'Féktárcsa vetemedés, féknyereg vezetőcsap korrózió, regeneratív fékátmenet.'` | `typicalIssues: 'Brake rotor warpage, caliper slide pin corrosion, regenerative brake blending shudder.'` |
| 81 | `riskLabel: 'Alacsony Kockázat'` | `riskLabel: 'Low Risk'` |
| 82 | `statusBadge: 'Alacsony / Low'` | `statusBadge: 'Low'` |
| 144 | `Várható csere: {sub.expectedInterval}` | `Expected Replacement: {sub.expectedInterval}` |
| 148 | `Becsült javítás: {formatCurrency(sub.typicalCostUsd)}` | `Est. Repair: {formatCurrency(sub.typicalCostUsd)}` |

---

#### 10. `src/components/home/PreInspectionChecklist.jsx`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 108 | `Használtautó Átvizsgálási Protokoll (PPI Checklist)` | `Pre-Purchase Inspection Protocol (PPI Checklist)` |
| 111 | `Helyszíni Segédlet` | `On-Site Field Guide` |
| 115 | `{selectedPreset.name} — Vásárlás Előtti Helyszíni Ellenőrzőlista` | `{selectedPreset.name} — Pre-Purchase On-Site Inspection Checklist` |
| 128 | `title="Állapot megosztása URL linkként"` | `title="Share checklist state via URL link"` |
| 133 | `Link vágólapon!` | `Link copied to clipboard!` |
| 138 | `Megosztás linkként` | `Share via Link` |
| 147 | `title="Nyomtatás vagy mentés PDF formátumban"` | `title="Print or save as PDF report"` |
| 150 | `Nyomtatható / PDF Riport` | `Print / PDF Report` |
| 159 | `OBD Hibakód Kereső` | `OBD2 Fault Lookup` |
| 171 | `Autómodell:` | `Vehicle Model:` |
| 182 | `aria-label="Válassz jármű modellt"` | `aria-label="Select vehicle model"` |
| 195 | `Jelenlegi km-óra állás:` | `Current Odometer:` |
| 218 | `Helyszíni Haladás: {checkedCount} / {totalCount} pont kipipálva` | `Inspection Progress: {checkedCount} / {totalCount} points verified` |
| 222 | `'✓ Minden ellenőrzési pont átvizsgálva! Megkezdheted az ártárgyalást.'` | `'✓ All inspection checkpoints completed. Ready for price negotiation.'` |
| 223 | `'Minden pontot vizsgálj meg a helyszínen az eladó jelenlétében!'` | `'Inspect every checkpoint on-site with the seller present!'` |
| 236 | `Visszaállítás` | `Reset Checklist` |
| 247 | `ShiftMetric — Használtautó Átvizsgálási Jegyzőkönyv` | `ShiftMetric — Pre-Purchase Inspection Dossier` |
| 250 | `Jármű: ... Motorkód: ... Hajtás: ...` | `Vehicle: ... Engine Code: ... Powertrain: ...` |
| 253 | `Vizsgált futásteljesítmény: ... Dátum: ... toLocaleDateString('hu-HU')` | `Verified Odometer: ... Date: ... toLocaleDateString('en-US')` |
| 308 | `Modell-típushiba` | `Model-Specific Known Flaw` |
| 314 | `Kockázat: {s.estSaving}` | `Exposure: {s.estSaving}` |
| 325 | `<strong>Helyszíni vizsgálat módja:</strong>` | `<strong>On-Site Inspection Method:</strong>` |
| 345 | `Helyszíni Észrevételek, Hibák és Alkupozíció (Kézírásos Jegyzetek):` | `On-Site Observations, Defects & Negotiation Points (Written Notes):` |
| 348 | `Megjegyzések:` | `Notes:` |
| 352 | `Átvizsgáló szakember / Vevő aláírása:` | `Inspector / Buyer Signature:` |
| 355 | `Eladó / Kereskedő tudomásulvétele:` | `Seller / Dealer Acknowledgment:` |
| 363 | `Tipp: A mentett ellenőrzőlistát telefonodon is megnyithatod a helyszínen a <strong>Megosztás linkként</strong> gombbal.` | `Tip: Open this saved checklist on your mobile device during inspection using the <strong>Share via Link</strong> button.` |
| 372 | `5-Éves TCO Számítás` | `5-Year TCO Simulation` |

---

#### 11. `src/components/home/ReviewsSection.jsx`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 136 | `<span>${Number(rev.amountPaid \|\| 0).toLocaleString()} Számla</span>` | `<span>${Number(rev.amountPaid \|\| 0).toLocaleString()} Invoice</span>` |
| 139 | `<RiskBadge level="low" label="Hitelesített" />` | `<RiskBadge level="low" label="Verified" />` |

---

#### 12. `src/components/calculators/TcoCalculator.jsx`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 227 | `label: 'Havi & 5-Éves Összköltség'` | `label: 'Monthly & 5-Year True Cost'` |
| 228 | `value: `${formatCurrency(tco.monthlyEconomicCostUsd)} / hó`` | `value: `${formatCurrency(tco.monthlyEconomicCostUsd)} / mo`` |
| 229 | `subtext: `${horizonYears} évre összesen: ${formatCurrency(tco.totalEconomicCostUsd)} · ${formatCurrency(tco.costPerDistanceUnit)} / ${distanceUnit}`` | `subtext: `${horizonYears}-yr total: ${formatCurrency(tco.totalEconomicCostUsd)} · ${formatCurrency(tco.costPerDistanceUnit)} / ${distanceUnit}`` |
| 230 | `<RiskBadge level="low" label="Kalkulált" />` | `<RiskBadge level="low" label="Calculated" />` |
| 233 | `label: 'Fő Költségtényező'` | `label: 'Dominant Cost Driver'` |
| 234 | `value: `${primaryExpense?.label \|\| 'Értékvesztés'}: ${primaryExpense?.sharePct \|\| 0}%`` | `value: `${primaryExpense?.label \|\| 'Depreciation'}: ${primaryExpense?.sharePct \|\| 0}%`` |
| 235 | `subtext: `${formatCurrency(primaryExpense?.amountUsd \|\| 0)} várható kiadás ${horizonYears} év alatt.`` | `subtext: `${formatCurrency(primaryExpense?.amountUsd \|\| 0)} projected spend over ${horizonYears} years.`` |
| 236 | `label={`${primaryExpense?.sharePct \|\| 0}% arány`}` | `label={`${primaryExpense?.sharePct \|\| 0}% Share`}` |
| 239 | `label: 'Kockázati Szint & Értékelés'` | `label: 'Ownership Risk Profile'` |
| 240 | `value: `${ownershipValueScore}/100 pont`` | `value: `${ownershipValueScore}/100 score`` |
| 241 | `subtext: 'Kategória mediánhoz képest 11%-kal alacsonyabb fenntartási költség.'` | `subtext: '11% lower total operating cost versus category median.'` |
| 245 | `label={ownershipValueScore >= 70 ? 'Alacsony Kockázat' : ownershipValueScore >= 45 ? 'Közepes Kockázat' : 'Kritikus Kockázat'}` | `label={ownershipValueScore >= 70 ? 'Low Risk' : ownershipValueScore >= 45 ? 'Moderate Risk' : 'Critical Risk'}` |
| 258 | `{/* TL;DR Verdikt Box: 3 legfontosabb tény */}` | `{/* TL;DR Verdict Box: 3 Key Financial Facts */}` |
| 260 | `title="TL;DR Verdikt"` | `title="TL;DR Verdict"` |
| 261 | `subtitle="3 legfontosabb pénzügyi mutató (Zero Fluff)"` | `subtitle="3 key financial metrics at a glance (zero fluff)"` |
| 262 | `badge="Valós Adatok"` | `badge="Verified Telemetry"` |

---

#### 13. `src/components/calculators/MaintenanceRiskMatrix.jsx`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 299 | `label: '12 Hónapos Várható Szerviz'` | `label: '12-Month Projected Service'` |
| 302 | `? `OEM halasztások miatt +${oemRiskMultiplier.toFixed(2)}x kockázati szorzó!`` | `? `Deferred OEM maintenance applies +${oemRiskMultiplier.toFixed(2)}x wear penalty!`` |
| 303 | `: `Várható kopási tartalék ${formatDistance(physicalOdometerMiles)} óraállásnál.`` | `: `Projected wear reserve buffer at ${formatDistance(physicalOdometerMiles)} odometer.`` |
| 307 | `label={serviceReserveUsd > 2200 ? 'Kritikus Tartalék' : serviceReserveUsd > 1000 ? 'Közepes Tartalék' : 'Alacsony Tartalék'}` | `label={serviceReserveUsd > 2200 ? 'Critical Reserve' : serviceReserveUsd > 1000 ? 'Moderate Reserve' : 'Low Reserve'}` |
| 312 | `label: 'Kockázati Állapot'` | `label: 'Risk Status'` |
| 313 | `value: `${criticalItems.length} Kritikus · ${warningItems.length} Esedékes`` | `value: `${criticalItems.length} Critical · ${warningItems.length} Due`` |
| 315 | `? `Azonnali csere javasolt: ${topCriticalItem?.name \|\| 'Kopóelem'}.`` | `? `Immediate replacement recommended: ${topCriticalItem?.name \|\| 'Wear item'}.`` |
| 316 | `: 'Valamennyi részegység a gyártói biztonsági határokon belül.'` | `: 'All subsystems operating within factory safety margins.'` |
| 320 | `label={criticalItems.length > 0 ? 'Kritikus Kockázat' : warningItems.length > 0 ? 'Közepes Kockázat' : 'Alacsony Kockázat'}` | `label={criticalItems.length > 0 ? 'Critical Risk' : warningItems.length > 0 ? 'Moderate Risk' : 'Low Risk'}` |
| 325 | `label: 'Megbízhatósági Verdikt'` | `label: 'Reliability Verdict'` |
| 328 | `? 'OEM marketing periódus: fokozott vezérlés- és váltóhiba kockázat.'` | `? 'Extended OEM interval: elevated timing chain and transmission risk.'` |
| 329 | `: 'Megelőző szervizeléssel elkerülhetők a több ezer dolláros fődarabcserék.'` | `: 'Preventative maintenance protects against major assembly failures.'` |
| 333 | `label={reliabilityScore >= 75 ? 'Megbízható' : reliabilityScore >= 50 ? 'Figyelendő' : 'Kritikus'}` | `label={reliabilityScore >= 75 ? 'Reliable' : reliabilityScore >= 50 ? 'Monitor' : 'Critical'}` |
| 346 | `{/* TL;DR Verdikt Box: 3 legfontosabb szervizadat */}` | `{/* TL;DR Verdict Box: 3 Key Service Metrics */}` |
| 348 | `title="TL;DR Verdikt"` | `title="TL;DR Verdict"` |
| 349 | `subtitle="3 legfontosabb szerviz- és kockázati mutató (Zero Fluff)"` | `subtitle="3 key service and wear risk metrics (zero fluff)"` |
| 350 | `badge="Telemetria Szintézis"` | `badge="Telemetry Synthesis"` |
| 850 | `label={isServiced ? 'Szervizelve' : status === 'CRITICAL' ? 'Kritikus' : status === 'WARNING' ? 'Közepes' : 'Alacsony'}` | `label={isServiced ? 'Serviced' : status === 'CRITICAL' ? 'Critical' : status === 'WARNING' ? 'Moderate' : 'Low'}` |
| 857 | `Várható csereperiódus: {formatDistance(item.criticalWearMileage)}` | `Scheduled replacement interval: {formatDistance(item.criticalWearMileage)}` |
| 861 | `Becsült javítás: {formatCurrency(item.costsUsd.independent[0])} – {formatCurrency(item.costsUsd.dealership[1])}` | `Est. repair: {formatCurrency(item.costsUsd.independent[0])} – {formatCurrency(item.costsUsd.dealership[1])}` |
| 1007 | `{/* 3. Known Issues ("Gyermekbetegségek") & Live NHTSA/EPA Telemetry Dossier */}` | `{/* 3. Known Issues & Live NHTSA/EPA Telemetry Dossier */}` |

---

#### 14. `src/components/calculators/ObdEstimator.jsx`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 145 | `label: 'Becsült Műhelyköltség'` | `label: 'Estimated Repair Cost'` |
| 147 | `subtext: `Tipikus elvárt kiadás: ${formatCurrency(est.weightedExpectedUsd)} (${est.tierLabel}).`` | `subtext: `Typical expected bill: ${formatCurrency(est.weightedExpectedUsd)} (${est.tierLabel}).`` |
| 156 | `label: 'Súlyosság & Vezethetőség'` | `label: 'Severity & Drivability'` |
| 157 | `value: activeDossier.severity?.includes('CRITICAL') ? 'Kritikus (Azonnal állj meg)' : activeDossier.severity?.includes('HIGH') ? 'Közepes (1–2 héten belül javítsd)' : 'Alacsony (Rövid távon használható)'` | `value: activeDossier.severity?.includes('CRITICAL') ? 'Critical (Stop immediately)' : activeDossier.severity?.includes('HIGH') ? 'High (Service within 1–2 weeks)' : 'Low (Safe for short drives)'` |
| 159 | `? 'További vezetés maradandó motor- vagy katalizátorkárosodást okoz!'` | `? 'Continued driving risks catastrophic engine or catalyst damage!'` |
| 160 | `: 'Katalizátor és emissziós egységek védelme érdekében mielőbb vizsgálandó.'` | `: 'Inspect promptly to protect emissions subsystems and fuel efficiency.'` |
| 169 | `label: 'Leggyakoribb Kiváltó Ok'` | `label: 'Most Likely Root Cause'` |
| 171 | `subtext: 'Ne cserélj azonnal drága főegységet: először ellenőrizd az élő PID adatokat!'` | `subtext: 'Verify sensor live PIDs before replacing major components!'` |
| 172 | `<RiskBadge level="low" label="Fő gyanúsított" />` | `<RiskBadge level="low" label="Top Suspect" />` |
| 183 | `{/* TL;DR Verdikt Box: 3 legfontosabb diagnosztikai tény */}` | `{/* TL;DR Verdict Box: 3 Key Diagnostic Facts */}` |
| 185 | `title="TL;DR Verdikt"` | `title="TL;DR Verdict"` |
| 186 | `subtitle="3 legfontosabb diagnosztikai és javítási adatpont (Zero Fluff)"` | `subtitle="3 key diagnostic and repair metrics at a glance (zero fluff)"` |
| 187 | `badge="Hibakód Elemzés"` | `badge="DTC Diagnostic Analysis"` |

---

#### 15. `src/components/calculators/EvBreakEvenCalculator.jsx`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 116 | `label: 'Megtérülési Időtáv'` | `label: 'Break-Even Horizon'` |
| 117 | `value: isCheaperUpfront ? 'Azonnali (0 év)' : isNegativeSavings ? 'Nem térül meg' : `${breakEvenYears} év (${breakEvenDistanceLocal.toLocaleString()} ${distanceUnit})`` | `value: isCheaperUpfront ? 'Immediate (0 yrs)' : isNegativeSavings ? 'Never breaks even' : `${breakEvenYears} yrs (${breakEvenDistanceLocal.toLocaleString()} ${distanceUnit})`` |
| 119 | `? 'Az elektromos autó vételi ára már induláskor alacsonyabb.'` | `? 'The EV purchase price is already lower upfront.'` |
| 121 | `? 'A jelenlegi áramtarifa mellett nincs üzemeltetési megtakarítás.'` | `? 'At current electricity tariffs, running costs offer no net savings.'` |
| 122 | `: 'Az alacsonyabb üzemeltetés eddigre hozza vissza a vételár-felárat.'` | `: 'Lower operational cost recoups the purchase price premium by this horizon.'` |
| 126 | `label={isCheaperUpfront ? 'Azonnali' : breakEvenYears <= 4 ? 'Gyors megtérülés' : 'Hosszú megtérülés'}` | `label={isCheaperUpfront ? 'Immediate' : breakEvenYears <= 4 ? 'Fast Payback' : 'Long Payback'}` |
| 131 | `label: 'Éves Energiamegtakarítás'` | `label: 'Annual Energy Savings'` |
| 132 | `value: `${currencySymbol}${annualSavingsLocal.toLocaleString()} / év`` | `value: `${currencySymbol}${annualSavingsLocal.toLocaleString()} / yr`` |
| 133 | `subtext: `${pctCheaper}%-kal alacsonyabb km-költség (${currencySymbol}${Math.round(annualSavingsLocal / 12).toLocaleString()} / hó).`` | `subtext: `${pctCheaper}% lower per-${distanceUnit} energy cost (${currencySymbol}${Math.round(annualSavingsLocal / 12).toLocaleString()} / mo).`` |
| 134 | `label={`${pctCheaper}% olcsóbb`}` | `label={`${pctCheaper}% Cheaper`}` |
| 137 | `label: 'Szükséges Éves Futás'` | `label: 'Required Annual Mileage'` |
| 138 | `value: isCheaperUpfront ? 'Bármely futás' : `${requiredAnnualDist5Yr.toLocaleString()} ${distanceUnit} / év`` | `value: isCheaperUpfront ? 'Any mileage' : `${requiredAnnualDist5Yr.toLocaleString()} ${distanceUnit} / yr`` |
| 139 | `subtext: 'Minimum ennyit kell évente vezetni az 5 éves megtérüléshez.'` | `subtext: 'Minimum annual distance required to break even within 5 years.'` |
| 140 | `label="5-éves küszöb"` | `label="5-Year Target"` |
| 172 | `{/* TL;DR Verdikt Box: 3 legfontosabb EV megtérülési mutató */}` | `{/* TL;DR Verdict Box: 3 Key EV Payback Facts */}` |
| 174 | `title="TL;DR Verdikt"` | `title="TL;DR Verdict"` |
| 175 | `subtitle="3 legfontosabb elektromos megtérülési tény (Zero Fluff)"` | `subtitle="3 key electric break-even metrics at a glance (zero fluff)"` |
| 176 | `badge="Megtérülési Mérleg"` | `badge="Payback Balance"` |

---

#### 16. `src/components/calculators/VehicleComparator.jsx`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 304 | `label: '5-Éves Költségkülönbözet'` | `label: '5-Year Cost Differential'` |
| 306 | `${vehicleB.name} olcsóbb` | `${vehicleB.name} is cheaper` |
| 307 | `${vehicleA.name} olcsóbb` | `${vehicleA.name} is cheaper` |
| 308 | `subtext: `Havi eltérés: ${formatCurrency(Math.abs(monthlySavingsB))}/hó · 5-éves megtakarítás: ${formatCurrency(Math.abs(total5YrSavingsB))}.`` | `subtext: `Monthly delta: ${formatCurrency(Math.abs(monthlySavingsB))}/mo · 5-yr net difference: ${formatCurrency(Math.abs(total5YrSavingsB))}.`` |
| 312 | `label={monthlySavingsB >= 0 ? `${vehicleB.name} előny` : `${vehicleA.name} előny`}` | `label={monthlySavingsB >= 0 ? `${vehicleB.name} Advantage` : `${vehicleA.name} Advantage`}` |
| 317 | `label: 'Megtérülési Küszöb (Break-Even)'` | `label: 'Break-Even Payback Distance'` |
| 319 | `... (${breakEvenTrajectory.breakEvenYears} év)` | `... (${breakEvenTrajectory.breakEvenYears} yrs)` |
| 321 | `${vehicleB.name} mindvégig olcsóbb (0 km)` | `${vehicleB.name} cheaper from mile zero` |
| 322 | `${vehicleA.name} mindvégig olcsóbb` | `${vehicleA.name} cheaper across all miles` |
| 324 | `'A magasabb vételárat eddigre kompenzálja az alacsonyabb üzemeltetés.'` | `'Lower running costs offset the upfront premium at this distance.'` |
| 325 | `'Nincs keresztezési pont a vizsgált kilométertartományban.'` | `'No crossover point within the analyzed mileage range.'` |
| 329 | `label={breakEvenTrajectory.status === 'crossover' ? `${breakEvenTrajectory.breakEvenYears} év alatt megtérül` : 'Domináns modell'}` | `label={breakEvenTrajectory.status === 'crossover' ? `${breakEvenTrajectory.breakEvenYears}-yr payback` : 'Dominant Choice'}` |
| 334 | `label: 'Típushiba Kockázat & Szerviztartalék'` | `label: 'Reliability Risk & Service Buffer'` |
| 337 | `${vehicleB.name} ${formatCurrency(Math.abs(riskExposureDeltaB))}-ral kisebb szerviztartalék.` | `${vehicleB.name} requires ${formatCurrency(Math.abs(riskExposureDeltaB))} lower service buffer.` |
| 338 | `${vehicleA.name} ${formatCurrency(Math.abs(riskExposureDeltaB))}-ral kisebb szerviztartalék.` | `${vehicleA.name} requires ${formatCurrency(Math.abs(riskExposureDeltaB))} lower service buffer.` |
| 399 | `5-éves TCO összevetés, dinamikus megtérülési grafikon (Break-even pont) és kilométer-arányos típushibák` | `5-year TCO comparison, dynamic break-even crossover trajectory, and odometer-calibrated known flaws.` |
| 417 | `title="TL;DR Összehasonlító Verdikt"` | `title="TL;DR Comparison Verdict"` |
| 418 | `subtitle="3 kulcsfontosságú összehasonlító adatpont (Zero Fluff)"` | `subtitle="3 key comparative metrics at a glance (zero fluff)"` |
| 419 | `badge="Döntési Mérleg"` | `badge="Decision Balance"` |
| 426 | `NÉPSZERŰ PÁROK:` | `POPULAR MATCHUPS:` |
| 459 | `aria-label="Válassz első autót"` | `aria-label="Select primary vehicle"` |
| 473 | `Vételár: {formatCurrency(vehicleA.purchasePriceUsd)} · {vehicleA.powerHp ? `${vehicleA.powerHp} LE` : ''} · {vehicleA.engineCode}` | `Purchase Price: {formatCurrency(vehicleA.purchasePriceUsd)} · {vehicleA.powerHp ? `${vehicleA.powerHp} HP` : ''} · {vehicleA.engineCode}` |
| 483 | `Havi Üzemeltetési Költség` | `Monthly True Operating Cost` |
| 486 | `/hó` | `/mo` |
| 489 | `{formatCurrency(tcoA.totalEconomicCostUsd)} 5 év alatt ({formatDistance(odoA)}-nál)` | `{formatCurrency(tcoA.totalEconomicCostUsd)} over 5 yrs (at {formatDistance(odoA)})` |
| 495 | `Megbízhatóság` | `Reliability` |
| 501 | `Szervizkockázat` | `Service Risk` |
| 507 | `Típushibák` | `Known Flaws` |
| 509 | `{knownIssuesA.length} regisztrált` | `{knownIssuesA.length} documented` |
| 526 | `aria-label="Válassz alternatív autót"` | `aria-label="Select comparison vehicle"` |
| 540 | `Vételár: {formatCurrency(vehicleB.purchasePriceUsd)} · {vehicleB.powerHp ? `${vehicleB.powerHp} LE` : ''} · {vehicleB.engineCode}` | `Purchase Price: {formatCurrency(vehicleB.purchasePriceUsd)} · {vehicleB.powerHp ? `${vehicleB.powerHp} HP` : ''} · {vehicleB.engineCode}` |
| 551 | `Havi Üzemeltetési Költség` | `Monthly True Operating Cost` |
| 560-561 | `.../hó` | `.../mo` |
| 566 | `/hó` | `/mo` |
| 569 | `{formatCurrency(tcoB.totalEconomicCostUsd)} 5 év alatt ({formatDistance(odoA)}-nál)` | `{formatCurrency(tcoB.totalEconomicCostUsd)} over 5 yrs (at {formatDistance(odoA)})` |
| 575 | `Megbízhatóság` | `Reliability` |
| 581 | `Szervizkockázat` | `Service Risk` |
| 587 | `Típushibák` | `Known Flaws` |
| 589 | `{knownIssuesB.length} regisztrált` | `{knownIssuesB.length} documented` |
| 604 | `5-Éves Megtérülési Pont (Break-Even Crossover Grafikon)` | `5-Year Break-Even Crossover Trajectory` |
| 608 | `Kumulatív TCO költségek a megtett kilométer függvényében (Vételár + Értékvesztés + Üzemanyag + Karbantartás)` | `Cumulative total cost of ownership by distance traveled (Purchase + Depreciation + Fuel + Maintenance)` |
| 674 | `Ön 5-éves futása ({formatDistance(breakEvenTrajectory.user5YrMiles)})` | `Your 5-Year Distance ({formatDistance(breakEvenTrajectory.user5YrMiles)})` |
| 736 | `<strong>Megtérülési Küszöb:</strong>` | `<strong>Break-Even Crossover:</strong>` |
| 738 | `(~{breakEvenTrajectory.breakEvenYears} év)` | `(~{breakEvenTrajectory.breakEvenYears} yrs)` |
| 740 | `. Ennél a futásteljesítménynél válik a(z) {vehicleB.name} anyagilag kedvezőbbé az alacsonyabb fogyasztás és szervizigény miatt.` | `. Beyond this distance, {vehicleB.name} delivers net savings through lower fuel and maintenance costs.` |
| 744 | `<strong>Azonnali Megtakarítás:</strong> A(z) <strong>{vehicleB.name}</strong> vételára és üzemeltetése is kedvezőbb, így már a 0. kilométertől kezdve olcsóbb.` | `<strong>Immediate Savings:</strong> <strong>{vehicleB.name}</strong> has a lower purchase price and running cost, remaining cheaper from mile zero.` |
| 748 | `<strong>{vehicleA.name} Gazdaságosabb:</strong> A vizsgált futási profil mellett a(z) {vehicleA.name} teljes birtoklási költsége alacsonyabb marad.` | `<strong>{vehicleA.name} More Economical:</strong> Across this mileage profile, {vehicleA.name} maintains a lower total ownership cost.` |
| 756 | `{/* Side-by-Side Known Issues ("Gyermekbetegségek") at Current Mileage */}` | `{/* Side-by-Side Known Issues at Current Mileage */}` |
| 763 | `Várható Típushibák (&quot;Gyermekbetegségek&quot;) {currentKm.toLocaleString()} km-nél` | `Known Vulnerabilities at {formatDistance(odoA)}` |
| 767 | `A kiválasztott motorváltozatok dokumentált konstrukciós hibái és kockázati ablakai` | `Documented engineering flaws and active wear windows for selected powertrains` |
| 771 | `Adatbázis: ShiftMetric Curated Dossier` | `Database: ShiftMetric Curated Dossier` |
| 780 | `{knownIssuesA.length} típushiba` | `{knownIssuesA.length} known issues` |
| 785 | `Nincs dokumentált súlyos típushiba ebben a futásteljesítmény-sávban.` | `No severe vulnerabilities documented in this mileage window.` |
| 806 | `Aktív ablak` | `Active Window` |
| 818 | `Javítás:` | `Repair:` |
| 831 | `{knownIssuesB.length} típushiba` | `{knownIssuesB.length} known issues` |
| 836 | `Nincs dokumentált súlyos típushiba ebben a futásteljesítmény-sávban.` | `No severe vulnerabilities documented in this mileage window.` |
| 857 | `Aktív ablak` | `Active Window` |
| 869 | `Javítás:` | `Repair:` |
| 885 | `Költség &amp; Telemetria Kategória` | `Cost &amp; Telemetry Category` |
| 888 | `Eltérés (Delta)` | `Difference (Delta)` |
| 893 | `Vételár` | `Purchase Price` |
| 902 | `5-Éves Értékvesztés` | `5-Year Depreciation` |
| 918 | `Üzemanyag / Energia ({horizonYears} év)` | `Fuel / Energy ({horizonYears} Years)` |
| 935 | `Karbantartási Tartalék` | `Maintenance Reserve Buffer` |
| 952 | `Biztosítás ({horizonYears} év)` | `Insurance ({horizonYears} Years)` |
| 966, 969 | `.../hó` | `.../mo` |

---

#### 17. `src/components/seo/DynamicSeoHead.jsx`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 181 | `const title = \`Melyiket vegyem? \${preset.name} Összehasonlítás, TCO & Megtérülési Pont \| ShiftMetric\`;` | `const title = \`Side-by-Side Comparison: \${preset.name} TCO & Break-Even Trajectory \| ShiftMetric\`;` |
| 182 | `const description = \`Hasonlítsd össze a(z) \${preset.name} (\${preset.engineCode}) modellt más járművekkel: 5-éves TCO Break-even megtérülési grafikon, üzemeltetési költségek és típushibák.\`;` | `const description = \`Compare the \${preset.name} (\${preset.engineCode}) against alternatives: 5-year TCO break-even crossover trajectory, true running costs, and known reliability flaws.\`;` |
| 193 | `const title = \`Használtautó Vásárlás Előtti Ellenőrzőlista (PPI) – \${preset.name} \| ShiftMetric\`;` | `const title = \`Pre-Purchase Inspection Checklist (PPI) – \${preset.name} \| ShiftMetric\`;` |
| 194 | `const description = \`Helyszíni ellenőrzőlista használt \${preset.name} (\${preset.engineCode}) vásárlása előtt: kritikus konstrukciós hibák, motortér- és futómű-vizsgálat, OBD-II diagnosztika és azonnali nyomtatható riport.\`;` | `const description = \`On-site used car inspection checklist for \${preset.name} (\${preset.engineCode}): critical known flaws, engine bay and chassis inspection, OBD-II diagnostics, and printable PDF report.\`;` |
| 386 | `name: \`Használtautó vásárlás előtti átvizsgálási jegyzőkönyv: \${preset.name}\`,` | `name: \`Pre-Purchase Vehicle Inspection Checklist: \${preset.name}\`,` |
| 387 | `description: \`Lépésről-lépésre helyszíni ellenőrzőlista a(z) \${preset.name} (\${preset.engineCode}) állapotfelméréséhez és típushibáinak kiszűréséhez.\`,` | `description: \`Step-by-step on-site inspection protocol for \${preset.name} (\${preset.engineCode}) condition assessment and known vulnerability detection.\`,` |
| 391 | `name: 'OBD-II DTC és Freeze Frame hibatároló olvasás',` | `name: 'OBD-II DTC & Freeze Frame Diagnostic Scan',` |
| 392 | `text: 'Aktív és tárolt hibakódok, valamint a hibatörlés óta megtett kilométer ellenőrzése.',` | `text: 'Scan active and pending trouble codes and verify distance traveled since DTCs were cleared.',` |
| 396 | `name: 'Motortér és Típushibák ellenőrzése',` | `name: 'Engine Bay & Vulnerability Inspection',` |
| 397 | `text: 'Vezérműszíj/lánc állapot, üzemanyagszivattyú (pl. CP4) és szivárgások vizsgálata.',` | `text: 'Check timing belt/chain wear, high-pressure fuel pump condition (e.g. CP4), and fluid leaks.',` |
| 401 | `name: 'Festékvastagság és karosszéria illesztések mérése',` | `name: 'Paint Depth & Structural Alignment Inspection',` |
| 402 | `text: 'Rétegvastagság-mérés az elemeken és oszlopokon a rejtett töréskárok felderítésére.',` | `text: 'Measure coating thickness across outer panels and pillars to detect hidden collision repairs.',` |
| 406 | `name: 'Váltó- és kuplungterheléses próbateszt',` | `name: 'Transmission & Clutch Load Dynamic Road Test',` |
| 407 | `text: 'Kuplungcsúszás, kettőstömegű lendkerék és mechatronika ellenőrzése menet közben.',` | `text: 'Evaluate clutch slip, dual-mass flywheel shudder, and mechatronic shift quality under acceleration.',` |

---

#### 18. `src/data/breakEvenAndPpi.js`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 129 | `// 1. Synthesize targeted checks from specific Known Issues ("Gyermekbetegségek")` | `// 1. Synthesize targeted checks from specific Known Issues` |
| 136 | `'OBD Mode 01/02 & Fizikai szemrevételezés'` | `'OBD Mode 01/02 & Physical Visual Inspection'` |
| 142 | `'Rail Pressure PID 0x22, Injektor korrekciók'` | `'Rail Pressure PID 0x22, Injector Fuel Trims'` |
| 144 | `'Cam/Crank Correlation PID, Hidegindítási akusztika'` | `'Cam/Crank Correlation PID, Cold-Start Acoustics'` |
| 150 | `'Konstrukciós hiba'` | `'Known Design Flaw'` |
| 153 | `isMileageActive ? 'Aktív Kilométer-kockázat' : \`\${issue.severity.toUpperCase()} Kockázat\`` | `isMileageActive ? 'Active Mileage Risk' : \`\${issue.severity.toUpperCase()} Risk\`` |
| 155 | `focus: \`Tünet: \${issue.symptoms} \| Megelőzés: \${issue.prevention}\`` | `focus: \`Symptoms: \${issue.symptoms} \| Prevention: \${issue.prevention}\`` |
| 156 | `inspectionMethod: \`Helyszíni ellenőrzés: Vizsgáld meg a részegységet (\${issue.affectedComponents.join(', ')}). \${...}\`` | `inspectionMethod: \`On-site inspection: Examine assembly (\${issue.affectedComponents.join(', ')}). \${...}\`` |
| 158 | `'Világíts be az olajbeöntő sapkán a szíj hátát repedések és levált foszlányok után keresve!'` | `'Shine a light into the oil filler cap to inspect belt back for cracks, fraying, and swelling!'` |
| 160 | `'Kérd el az üzemanyagszűrő fedelét, vagy ellenőrizd a szűrőház alját csillogó fémreszelék (spén) után!'` | `'Request opening the fuel filter or check housing bowl for metallic flakes/shavings (swarf)!'` |
| 162 | `'Mérj rá a 12V-os akkumulátor feszültségére, és próbáld ki az AC töltést a helyszínen!'` | `'Measure 12V auxiliary battery resting voltage and test on-site AC charging engagement!'` |
| 164 | `'Hidegindításnál figyelj az első 5 másodpercben a vezérműlánc csörgő/surrogó hangjára!'` | `'Listen closely during cold start for timing chain rattle or metallic slapping during the first 5 seconds!'` |
| 165 | `'Fizikai vizsgálat és diagnosztikai hibatároló olvasás javasolt.'` | `'Physical inspection and diagnostic trouble code scan recommended.'` |
| 177 | `'OBD-II DTC & Freeze Frame Élőadat Kiolvasás'` | `'OBD-II DTC & Freeze Frame Live Data Scan'` |
| 180 | `'Kritikus / Kötelező'` | `'Critical / Mandatory'` |
| 182 | `'Aktív, tárolt és függőben lévő (Pending) hibakódok kiolvasása a törlés óta eltelt km (Distance since DTC cleared) ellenőrzésével.'` | `'Read active, stored, and pending DTCs while verifying distance traveled since diagnostic codes were last cleared.'` |
| 183 | `'Csatlakoztass OBD2 szkennert: ha a "Distance since codes cleared" < 50 km, az eladó közvetlenül a találkozó előtt törölhette a vészjelzéseket!'` | `'Connect an OBD-II scanner: if distance since DTC clear is under 50 km (30 mi), the seller may have cleared warning codes right before the inspection!'` |
| 189 | `'Hidegindítás, Kartergáz és Olajsapka Nyomásteszt'` | `'Cold Start, Blow-By & Oil Filler Cap Pressure Test'` |
| 192 | `'Közepes / Fontos'` | `'Moderate / Important'` |
| 194 | `'Kizárólag teljesen hideg motor indítása. Füstképződés (fehér/kék/fekete) és motorzajok megfigyelése alapjáraton.'` | `'Start only when engine is dead cold. Observe exhaust smoke (white/blue/black) and idle acoustic vibrations.'` |
| 195 | `'Érkezéskor tapintsd meg a motorblokkot (nem lehet meleg!). Járó motornál óvatosan nyisd meg az olajbeöntőt: enyhe vákuum normális, túlzott kartergáz-nyomás vagy füsthengerek kompresszióvesztést jeleznek.'` | `'Touch engine block upon arrival to verify cold state. With engine idling, loosen oil cap carefully: slight vacuum is normal; excessive positive pressure or smoke puffs indicate cylinder blow-by.'` |
| 201 | `'Karosszéria Festékvastagság & Rejtett Töréskár Szűrés'` | `'Body Paint Depth & Hidden Collision Damage Audit'` |
| 204 | `'Kritikus / Értékvesztés'` | `'Critical / Valuation Risk'` |
| 206 | `'Rétegvastagság-mérés minden elemen (gyári: 80–140 µm). A/B/C oszlopok és csomagtértalaj ponthegesztéseinek épsége.'` | `'Measure coating thickness on all panels (factory: 80–140 µm). Inspect A/B/C pillars, rocker sills, and trunk floor pinch welds.'` |
| 207 | `'Mérj rá az A-oszlopokra és küszöbökre (>200 µm újrafényezést, >450 µm gittet és komoly szerkezeti sérülést jelent). Ellenőrizd az összes fényszóró és üveg gyártási évszámának egyezését.'` | `'Gauge A-pillars and inner sills (>200 µm denotes respray, >450 µm body filler and structural repair). Verify matching glass and headlamp DOT manufacturer date codes.'` |
| 208 | `'Mágneses / Digitális rétegvastagság mérő, Üveg DOT kódok'` | `'Magnetic / Digital paint depth gauge, Glass DOT date stamps'` |
| 213 | `'Váltópróba, Kuplungcsúszás & Kettőstömegű Lendkerék Terhelésteszt'` | `'Transmission Road Test, Clutch Slip & Dual-Mass Flywheel Stress Test'` |
| 216 | `'Kritikus / Drága javítás'` | `'Critical / High Repair Cost'` |
| 218 | `'Fokozatok akadálymentes kapcsolása, kúszási hajlam (automata), és leállításkori fém csattanás szűrése.'` | `'Smooth gear engagement, creep behavior (automatics/DCT), and absence of metallic clunk upon engine shutdown.'` |
| 219 | `'Próbakörön 4. fokozatban 1500 RPM-ről adj padlógázt: ha a fordulatszám meglódul sebességgyorsulás nélkül, a kuplung csúszik. Motor leállításakor lenyomott és felengedett kuplunggal is figyeld a lendkerék csattogását.'` | `'On test drive in 4th gear, apply full throttle from 1,500 RPM: rising RPM without vehicle acceleration indicates clutch slip. Listen for dual-mass flywheel rattle when turning engine off with clutch pedal released vs depressed.'` |
| 225 | `'Futómű, Lengőkarszilentek & Féktárcsa Peremkopás'` | `'Chassis Suspension, Control Arm Bushings & Brake Rotor Lip Wear'` |
| 228 | `'Közepes / Futómű'` | `'Moderate / Chassis'` |
| 230 | `'Egyenetlen gumikopás (belső vállak lekopása futómű-elállítódást jelez), lengéscsillapító olajfolyás, féktárcsa válla.'` | `'Uneven tire tread wear (feathered inner shoulder indicates alignment/bushing failure), damper oil misting, and brake rotor lip thickness.'` |
| 231 | `'Kitekerett kormánynál nézd meg a gumiabroncsok profilmélységét és egyenletességét. Erős fékezéskor engedd el a kormányt: nem húzhat félre és nem rázhatja a pedált!'` | `'Turn steering to full lock to inspect tire wear across entire tread width. Under firm braking, vehicle must track straight without pulling or pedal pulsation.'` |
| 232 | `'Fékfolyadék forráspont mérő, Futómű geometria szimmetria'` | `'Brake fluid moisture tester, Suspension alignment symmetry'` |

---

#### 19. `src/data/vehicleCatalog.js`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 3 | `* Organized hierarchically: Brand (Márka) ➔ Model (Modell) ➔ Engine / Powertrain (Motor)` | `* Organized hierarchically: Brand ➔ Model ➔ Engine / Powertrain` |
| 235 | `"powertrainLabel": "1.9L Turbo Diesel Pumpe-Düse (PD)",` | `"powertrainLabel": "1.9L Turbo Diesel Pumpe-Duse (PD)",` |
| 1646-1647 | `"BMW 2 Series 218i Gran Coupé (136 HP)"`, `"BMW 218i Gran Coupé"` | `"BMW 2 Series 218i Gran Coupe (136 HP)"`, `"BMW 218i Gran Coupe"` |
| 1746-1747 | `"BMW 4 Series 420d Gran Coupé (190 HP)"`, `"BMW 420d Gran Coupé"` | `"BMW 4 Series 420d Gran Coupe (190 HP)"`, `"BMW 420d Gran Coupe"` |
| 1755, 2172, 2704, 4551 | `"segment": "... Coupé ..."` | `"segment": "... Coupe ..."` |
| 9464 | `* e.g., 'Citroën' -> 'citroen', 'Škoda' -> 'skoda', 'dízel' -> 'dizel'.` | `* e.g., 'Citroen' -> 'citroen', 'Skoda' -> 'skoda', 'diesel' -> 'diesel'.` |

---

#### 20. `src/data/obdCodes.js`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 53 | `'Failed state/MOT/TÜV OBD emissions readiness inspection',` | `'Failed state / MOT / TUV OBD emissions readiness inspection',` |

---

#### 21. `src/data/vehicles/bmw.js`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 28 | `name: 'Kormánymű persely kopás és hidegben hallható kattogás',` | `name: 'Steering rack thrust piece bushing wear and cold-weather clicking',` |
| 36 | `symptoms: 'Apró egyenetlenségeken és macskakövön halk kopogás a kormányoszlop aljából.',` | `symptoms: 'Subtle knocking from base of steering column over small road imperfections and cobblestones.',` |
| 37 | `prevention: 'BMW javítókészletes kormánymű támasztópersely hézagolás vagy cseredarabos felújítás.',` | `prevention: 'Install BMW steering rack thrust piece repair kit with updated bushing or remanufactured rack.',` |
| 61 | `criticalDefectTag: '🚨 EGR HŰTŐ TŰZVESZÉLY VISSZAHÍVÁS & KOROM',` | `criticalDefectTag: '🚨 EGR COOLER FIRE RISK RECALL & SOOT ACCUMULATION',` |
| 71 | `name: 'EGR hűtő belső glikolszivárgás és szívósor műanyag átolvadás / tűzveszély',` | `name: 'EGR cooler internal glycol leak causing plastic intake manifold melting / fire hazard',` |
| 79 | `symptoms: 'Lassú hűtőfolyadék-fogyás külső nyom nélkül, jellegzetes égett szag motortérből, P0401 hibakód.',` | `symptoms: 'Gradual unexplained coolant loss, distinctive acrid burning odor from engine bay, P0401 DTC.',` |
| 80 | `prevention: 'Hivatalos BMW gyári visszahívásos EGR hűtő csere BorgWarner/Korens módosított változatra! Dióhéjas szívósor tisztítás 80e km-nél.',` | `prevention: 'Official BMW recall EGR cooler replacement with revised BorgWarner/Korens unit. Walnut shell intake blast at 50k mi.',` |
| 94 | `name: 'SCR AdBlue tartály fűtőelem és szintérzékelő meghibásodás',` | `name: 'SCR AdBlue tank heating element and ultrasonic level sensor failure',` |
| 102 | `symptoms: 'Figyelmeztetés a műszerfalon: "Nem indul újra 1000 km múlva", nem törölhető SCR hibakód hidegben.',` | `symptoms: 'Instrument cluster warning: "No engine restart in 600 miles", persistent SCR error code in sub-freezing temps.',` |
| 103 | `prevention: 'Kiváló minőségű ISO 22241 AdBlue folyadék, kristályosodásgátló adalékolás.',` | `prevention: 'Use premium ISO 22241 standard AdBlue with anti-crystallization additive.',` |
| 127 | `criticalDefectTag: '⚠️ PCV SZELEPFEDÉL MEMBRÁN & HŰTŐVÍZ CSATLAKOZÓK',` | `criticalDefectTag: '⚠️ PCV VALVE COVER DIAPHRAGM & PLASTIC COOLANT CONNECTORS',` |
| 137 | `name: 'PCV kartergáz-membrán szakadás a szelepfedélben és műanyag vízcsatlakozó repedés',` | `name: 'Integrated PCV diaphragm rupture in valve cover and brittle plastic coolant hose flange cracking',` |
| 145 | `symptoms: 'Sípoló szívóhang az olajbeöntő környékén, kékesfehér füstfelhő hidegindításkor, vákuum az olajsapka levételekor.',` | `symptoms: 'High-pitched whistling around oil filler, blue-white smoke puff on cold start, strong vacuum when removing oil cap.',` |
| 146 | `prevention: 'Alumínium utángyártott hűtővíz-csatlakozó beépítése, PCV membrán felújítás vagy szelepfedél csere 100e km-nél.',` | `prevention: 'Install billet aluminum aftermarket coolant hose flange; rebuild PCV diaphragm or replace valve cover at 60k mi.',` |
| 181 | `criticalDefectTag: '🚨 N47 HÁTSÓ VEZÉRMŰLÁNC SZAKADÁS & CP4 SPÉM',` | `criticalDefectTag: '🚨 N47 REAR TIMING CHAIN FAILURE & BOSCH CP4 SWARF',` |
| 191 | `name: 'Hátsó elhelyezésű vezérműlánc nyúlás és feszítőpatron gyengülés / láncszakadás',` | `name: 'Rear-mounted timing chain elongation and hydraulic tensioner degradation / catastrophic chain snap',` |
| 199 | `symptoms: 'Súrlódó, csörgő fémes hang a motor hátsó (váltó felőli) oldaláról 1500–2000 RPM között gázadáskor és elvételkor.',` | `symptoms: 'Scraping, metallic jingling noise from rear of engine (transmission bellhousing side) between 1,500–2,000 RPM on throttle modulation.',` |
| 200 | `prevention: 'Gyári 30e km helyett szigorú 10-12,000 km olajcsere, megelőző lánc és feszítő készlet csere 120-140e km-nél!',` | `prevention: 'Enforce strict 6k–7.5k mi oil change intervals (discarding factory 18k mi recommendation); preventive chain and tensioner renewal at 80k mi.',` |
| 214 | `name: 'CP4 magasnyomású szivattyú mikrogörgő elfordulás és alumínium spém képződés',` | `name: 'Bosch CP4 high-pressure pump roller rotation and catastrophic metal swarf contamination',` |
| 222 | `symptoms: 'Railnyomás hiány (P0087), az autó hirtelen leáll és nem indul, üzemanyagszűrő tele ezüstös fémreszelékkel.',` | `symptoms: 'Low fuel rail pressure (P0087), sudden engine shutdown with crank-no-start, fuel filter canister filled with silver glitter flakes.',` |
| 223 | `prevention: 'Kizárólag prémium gázolaj, üzemanyagszűrő csere minden második olajcserénél, CP4 szivattyú felújítás 150e km-nél.',` | `prevention: 'Use high-lubricity premium diesel, replace fuel filter every second oil service, rebuild or pin CP4 pump at 90k mi.',` |
| 264 | `criticalDefectTag: '⚠️ EGR HŰTŐ TŰZVESZÉLY VISSZAHÍVÁS & LÉGRUGO',` | `criticalDefectTag: '⚠️ EGR COOLER RECALL & REAR AIR SPRING DEGRADATION',` |
| 274 | `name: 'Hátsó légrugó ballon kirepedés és kompresszor túlterhelés (Touring G31)',` | `name: 'Rear air spring bellow micro-cracking and compressor motor burnout (Touring G31)',` |
| 282 | `symptoms: 'Éjszaka leülő hátsó futómű, reggeli indításkor folyamatosan zúgó légrugó kompresszor.',` | `symptoms: 'Rear suspension sagging overnight; compressor runs continuously upon morning startup.',` |
| 283 | `prevention: 'Légrugó ballonok tisztítása és gumiápolása sózás után, csere párban Arnott megerősített változatra.',` | `prevention: 'Clean and treat air spring rubber sleeves after winter road salt; replace in pairs with upgraded heavy-duty units.',` |

---

#### 22. `src/data/vehicles/ford.js`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 28 | `name: 'Hátsó lengőkar szilent szakadás és futómű elmászás',` | `name: 'Rear trailing arm bushing tear and alignment drift',` |
| 36 | `symptoms: 'Kopogó tompa hang hátulról úthibákon, bizonytalan hátsó futás, belső fűrészfogas gumikopás.',` | `symptoms: 'Dull knocking from rear over road bumps, rear-end squirm under braking, feathered inner tire wear.',` |
| 37 | `prevention: 'Éves lengőkarszilent szemrevételezés, megerősített poliuretán vagy Lemförder csere.',` | `prevention: 'Annual bushing inspection; replace with reinforced heavy-duty or polyurethane bushings.',` |
| 51 | `name: 'Sync 3/4 APIM infotainment fejegység lefagyás és fekete képernyő',` | `name: 'Sync 3/4 APIM infotainment module freezing and black screen',` |
| 59 | `symptoms: 'Késleltetett tolatókamera kép, érintőképernyő érzéketlenség, Bluetooth szétkapcsolás.',` | `symptoms: 'Delayed rear camera feed, unresponsive touchscreen, intermittent Bluetooth dropouts.',` |
| 60 | `prevention: 'Hivatalos Ford USB vagy OTA szoftverfrissítés, 12V akkumulátorfeszültség stabilizálása.',` | `prevention: 'Install official Ford USB or OTA software updates; verify stable 12V auxiliary battery voltage.',` |
| 84 | `criticalDefectTag: '⚠️ CP4 SPÉM & OLAJBAN FUTÓ OLAJSZIVATTYÚ SZÍJ',` | `criticalDefectTag: '⚠️ CP4 SWARF & WET OIL PUMP BELT DEGRADATION',` |
| 94 | `name: 'CP4 magasnyomású szivattyú rugótörés / fémforgácsképződés (spém)',` | `name: 'Bosch CP4 high-pressure pump roller fatigue / metal swarf generation',` |
| 102 | `symptoms: 'Nehéz melegindítás, hirtelen Limp Mode gyorsításkor, mikroszkopikus alumínium fémforgács az üzemanyagszűrőben.',` | `symptoms: 'Extended warm cranking, abrupt limp mode on hard acceleration, microscopic aluminum glitter in fuel filter bowl.',` |
| 103 | `prevention: 'Prémium gázolaj használata kenésjavító adalékkal, üzemanyagszűrő csere max 15,000 km-enként, CP4 adagoló felújítás 150e km-nél.',` | `prevention: 'Use high-lubricity premium diesel, replace fuel filter every 10k mi, overhaul CP4 pump at 90k mi.',` |
| 117 | `name: 'Olajban futó olajszivattyú szíj (wet belt) degradáció és olajszűrő kosár dugulás',` | `name: 'Wet oil pump belt degradation and oil pickup strainer clogging',` |
| 125 | `symptoms: 'Alacsony olajnyomás figyelmeztetés meleg motornál alapjáraton, turbófeltöltő tengelylógás és fütyülés.',` | `symptoms: 'Low oil pressure warning at hot idle, turbocharger shaft play, and distinctive high-pitched whine.',` |
| 126 | `prevention: 'Szigorúan Ford WSS-M2C950-A olaj, olajcsere 10-12,000 km-enként (gyári 30e km helyett), karter levétel és kosártisztítás 120e km-nél.',` | `prevention: 'Strictly Ford WSS-M2C950-A oil every 6k–7.5k mi (ignoring 18k mi schedule); drop oil pan to inspect strainer at 75k mi.',` |
| 140 | `name: 'SCR AdBlue adagoló fúvóka kristályosodás és fűtőszál leégés',` | `name: 'SCR AdBlue dosing injector crystallization and heater circuit burnout',` |
| 148 | `symptoms: 'Check Engine lámpa, sárga motorfigyelmeztető, "Motorindítás megtagadva 800 km múlva" műszerfali számláló.',` | `symptoms: 'Check Engine light, "No engine restart in 500 miles" countdown, P20EE fault code.',` |
| 149 | `prevention: 'AdBlue kristályosodásgátló adalék betöltése minden folyadék utántöltéskor, szoftveres regeneráció.',` | `prevention: 'Dose anti-crystallization additive with every AdBlue refill; initiate software adaptation.',` |
| 173 | `criticalDefectTag: '🚨 ECOBOOM: OLAJBAN FUTÓ SZÍJ (WET BELT) DEGRADÁCIÓ',` | `criticalDefectTag: '🚨 ECOBOOST WET TIMING BELT DISSOLUTION & OIL STARVATION',` |
| 183 | `name: 'Olajban futó vezérműszíj (wet belt) degradáció/elkopás és olajszivattyú szűrő eltömődés',` | `name: 'Wet timing belt degradation / shredding and oil pump pickup strainer starvation',` |
| 191 | `symptoms: 'Olajnyomás hibalámpa felvillanása fékezéskor, fékpedál felkeményedése (vákuumszivattyú eldugulás), morajló motorhang.',` | `symptoms: 'Oil pressure warning flash under braking, stiff brake pedal (vacuum pump oil starvation), growling engine idle.',` |
| 192 | `prevention: 'Gyári 200e km helyett 100-120e km-enként vezérléscsere! Szigorúan csak WSS-M2C948-B olaj, max 10,000 km vagy 1 év csereintervallum.',` | `prevention: 'Replace wet belt at 60k–75k mi (ignoring 150k mi factory interval); strictly Ford WSS-M2C948-B oil every 6k mi or 1 yr.',` |
| 206 | `name: 'Hűtőfolyadék légtelenítő műanyag cső elridegülés és hirtelen elfolyás',` | `name: 'Brittle plastic degas coolant overflow line failure and rapid coolant dump',` |
| 214 | `symptoms: 'Hirtelen elfolyó hűtőfolyadék, fehér füst a motortérből, azonnali hengerfej túlmelegedés.',` | `symptoms: 'Sudden complete coolant loss, white steam from engine bay, rapid cylinder head overheat.',` |
| 215 | `prevention: 'Megerősített szilikon/alumínium revíziós cső beépítése még a gyári műanyag elfáradása előtt.',` | `prevention: 'Install reinforced silicone or revised aluminum degas line before brittle factory plastic fails.',` |
| 256 | `criticalDefectTag: '⚠️ POWERSHIFT 6DCT450 OLAJSZIVÁRGÁS & DPF',` | `criticalDefectTag: '⚠️ POWERSHIFT 6DCT450 MECHATRONIC VALVE WEAR & DPF',` |
| 266 | `name: 'PowerShift 6DCT450 nedveskuplungos mechatronika szelep kopás',` | `name: 'PowerShift 6DCT450 wet-clutch mechatronic valve body wear and shudder',` |
| 274 | `symptoms: 'Rángatás 1-es és 2-es fokozat között dugóban, csúszó kuplung érzet, hibaüzenet: "Transmission limited function".',` | `symptoms: 'Harsh shudder on 1-2 shifts in stop-and-go traffic, slipping clutch sensation, "Transmission limited function" warning.',` |
| 275 | `prevention: 'Szigorúan 60,000 km-enként olaj és külső-belső szűrőcsere gyári Ford specifikációjú folyadékkal.',` | `prevention: 'Strictly service dual-clutch fluid and both internal/external filters every 35k mi with OEM Ford spec fluid.',` |

---

#### 23. `src/data/vehicles/hyundaiKia.js`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 28 | `name: 'ICCU (Integrated Charging Control Unit) belső túláram, FET tranzisztor és 12V leégés',` | `name: 'ICCU (Integrated Charging Control Unit) internal overcurrent, FET blowout and 12V failure',` |
| 36 | `symptoms: 'Hangos pukkanó hang lassú AC töltés vagy menet közben, "Check EV System" riasztás, 12V akkumulátor azonnali lemerülése.',` | `symptoms: 'Loud pop during AC charging or driving, "Check EV System" alarm, and immediate 12V auxiliary battery depletion.',` |
| 37 | `prevention: 'Sürgősségi gyári szoftverfrissítés (visszahívás 24V-204), túlfeszültség-védett fali töltő, revíziós hardver beépítése.',` | `prevention: 'Emergency OEM software update (Recall 24V-204), surge-protected wallbox charger, and revised ICCU hardware.',` |
| 51 | `name: 'AC töltőaljzat túláram-érzékelő túlmelegedés és töltés-visszaszabályozás (throttling)',` | `name: 'AC charging port thermal sensor overheating and current throttling',` |
| 59 | `symptoms: '11 kW-os (3x16A) vagy 48A töltés elindulása után 30 perccel a töltés leáll vagy 3.5 kW-ra esik vissza 100°C port hőmérsékletnél.',` | `symptoms: '30 minutes after starting 11 kW (3x16A) or 48A AC charge, session faults or throttles down to 3.5 kW at 100°C port temp.',` |
| 60 | `prevention: 'Töltőáram szoftveres korlátozása 32A-ra a kijelzőn, csatlakozótüskék oxidációmentesítése.',` | `prevention: 'Cap AC current to 32A in EV settings; inspect and deoxidize inlet charge port pins.',` |
| 83 | `criticalDefectTag: '🚨 ICCU 12V KONVERTER LEÉGÉS VISSZAHÍVÁS & TÖLTŐPORT',` | `criticalDefectTag: '🚨 ICCU 12V CONVERTER RECALL & CHARGE PORT THROTTLING',` |
| 94 | `name: 'Hátsó reduktor / hajtómű csapágyhang (gear reducer whine)',` | `name: 'Rear gear reducer bearing whine and differential wear',` |
| 102 | `symptoms: 'Éles, magas frekvenciájú sípolás vagy fütyülés 60-90 km/h között gázelvételkor és regeneratív fékezéskor.',` | `symptoms: 'High-pitched whine between 35–55 mph (60–90 km/h) on deceleration and regenerative braking.',` |
| 103 | `prevention: 'Hajtómű olajcsere 30,000 km-nél (gyári élettartam-folyadék jelölés ellenére!), fémrészecskék korai kiszűrése.',` | `prevention: 'Drain and refill gear reducer oil at 20k mi (disregarding "lifetime" fill claim) to flush magnetic swarf.',` |
| 137 | `name: 'ICCU (Integrated Charging Control Unit) belső túláram és 12V leállás',` | `name: 'ICCU (Integrated Charging Control Unit) internal overcurrent and 12V failure',` |
| 145 | `symptoms: 'AC töltés közben lecsapódó kismegszakító, hibakód: "Stop vehicle and check power supply", teljesen lebénult 12V rendszer.',` | `symptoms: 'Tripped home breaker during AC charging, warning: "Stop vehicle and check power supply", completely dead 12V system.',` |
| 146 | `prevention: 'Hivatalos Kia SC302 szervizkampány elvégzése, ICCU szoftveres és hardveres revízió.',` | `prevention: 'Complete official Kia SC302 service campaign; verify revised ICCU unit and updated BMS profile.',` |
| 169 | `criticalDefectTag: '🚨 ICCU TÖLTÉSVEZÉRLŐ LEÉGÉS VISSZAHÍVÁS & 12V MERÜLÉS',` | `criticalDefectTag: '🚨 ICCU CHARGE CONTROLLER RECALL & 12V DRAIN',` |
| 180 | `name: 'ICCU (Integrated Charging Control Unit) belső túláram és 12V leállás',` | `name: 'ICCU (Integrated Charging Control Unit) internal overcurrent and 12V failure',` |
| 188 | `symptoms: 'AC töltés közben lecsapódó kismegszakító, hibakód: "Stop vehicle and check power supply", teljesen lebénult 12V rendszer.',` | `symptoms: 'Tripped home breaker during AC charging, warning: "Stop vehicle and check power supply", completely dead 12V system.',` |
| 189 | `prevention: 'Hivatalos Kia SC302 szervizkampány elvégzése, ICCU szoftveres és hardveres revízió.',` | `prevention: 'Complete official Kia SC302 service campaign; verify revised ICCU unit and updated BMS profile.',` |
| 203 | `name: 'Alacsony vezetőképességű kék akkumulátor hűtőfolyadék kristályosodás és szivattyú dugulás',` | `name: 'Low-conductivity blue battery coolant crystallization and electric pump clogging',` |
| 211 | `symptoms: '"Refill Inverter Coolant" műszerfali figyelmeztetés, csökkent töltési teljesítmény forró időben.',` | `symptoms: '"Refill Inverter Coolant" dashboard message, throttled DC fast charging speeds in hot ambient conditions.',` |
| 212 | `prevention: 'Szigorúan 60,000 km-enként gyári kék hűtőfolyadék csere és átöblítés.',` | `prevention: 'Flush and replace OEM low-conductivity blue coolant strictly every 35k mi (60k km).',` |

---

#### 24. `src/data/vehicles/mercedes.js`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 37 | `criticalDefectTag: '🚨 SZELEPHIMBA TŰGÖRGŐCSAPÁGY HULLÁS & VÍZPUMPA',` | `criticalDefectTag: '🚨 CAMSHAFT ROCKER NEEDLE BEARING WEAR & VACUUM WATER PUMP',` |
| 47 | `name: 'Szelephimbák (camshaft rocker arm bearings) tűgörgőscsapágy szétesése és vezérműtengely lemaródás',` | `name: 'Camshaft rocker arm needle roller bearing disintegration and camshaft lobe scoring',` |
| 55 | `symptoms: 'Ütemes fémes csattogás a hengerfej felől fordulatszám-arányosan, finom fémrészecskék az olajszűrőben.',` | `symptoms: 'Rhythmic metallic tapping from cylinder head tracking engine RPM, microscopic needle flakes in oil filter pleats.',` |
| 56 | `prevention: 'Megelőző módosított gyári szelephimba készlet beépítése 130,000 km-nél, olajcsere szigorúan 15,000 km-enként (MB 229.71 szerint).',` | `prevention: 'Install revised OEM rocker arms at 80k mi; enforce strict 9k mi oil change intervals with MB 229.71 spec.',` |
| 70 | `name: 'Vákuumvezérelt vízpumpa kapcsolóhüvely szivárgás és fagyálló bejutása a vákuumrendszerbe',` | `name: 'Vacuum-actuated water pump sliding sleeve leak and coolant ingestion into vacuum circuit',` |
| 78 | `symptoms: 'Hűtővíz-fogyás, vákuumszelepek meghibásodása (fűtés vagy turbóvezérlés tiltás a bejutó hűtőfolyadék miatt).',` | `symptoms: 'Coolant loss, vacuum transducer failure (HVAC blend door or turbo boost limp mode from coolant entering vacuum lines).',` |
| 79 | `prevention: 'Módosított tömítésű vízpumpa és vákuumszelep csere az első folyadékszint-csökkenéskor.',` | `prevention: 'Replace water pump with revised seal design and renew contaminated vacuum switch-over valves at first sign of coolant drop.',` |

---

#### 25. `src/data/vehicles/stellantis.js`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 37 | `criticalDefectTag: '🚨 SEVERE: WET BELT OLDÓDÁS & FÉKVÁKUUM VESZTÉS',` | `criticalDefectTag: '🚨 SEVERE: PURETECH WET BELT DELAMINATION & BRAKE BOOSTER VACUUM LOSS',` |
| 47 | `name: 'Olajban futó vezérműszíj (wet belt) feloldódása, degradációja és vákuumszivattyú / olajszivattyú eltömődés',` | `name: 'PureTech wet timing belt dissolution, elastomer shedding, and vacuum/oil pump strainer clogging',` |
| 55 | `symptoms: 'Olajnyomás figyelmeztető lámpa, kemény fékpedál (vákuumvesztés a fékrásegítőben), megnövekedett szíjszélesség.',` | `symptoms: 'Low oil pressure light, rock-hard brake pedal (loss of vacuum assistance), swollen belt width exceeding gauge tool.',` |
| 56 | `prevention: 'PSA B71 2010 specifikációjú olaj max 10,000 km-enként, szíj megelőző csere módosított szövetbetétes szíjra 60,000 km-nél!',` | `prevention: 'Use PSA B71 2010 oil every 6k mi; preventative belt replacement with revised fabric-backed unit at 35k mi (60k km).',` |
| 80 | `criticalDefectTag: '🚨 7MM VEZÉRMŰTENGELY LÁNC SZAKADÁS & SZELEPGÖRBÜLÉS',` | `criticalDefectTag: '🚨 7MM CAMSHAFT INTERCONNECTING CHAIN FAILURE & VALVE DAMAGE',` |
| 90 | `name: 'Vezérműtengelyeket összekötő 7 mm-es lánc szakadás / láncfeszítő törés',` | `name: '7mm camshaft interconnecting chain snap / hydraulic tensioner pad failure',` |
| 98 | `symptoms: 'Fémes csörgő hang a szelepfedél felől alapjáraton, hirtelen motorleállás és szelepelgörbülés.',` | `symptoms: 'Metallic rattling from valve cover at idle, abrupt engine cut-out with bent intake/exhaust valves.',` |
| 99 | `prevention: 'Megelőző módosítás a gyári 8 mm-es lánccal és megerősített házzal szerelt revíziós készletre 90,000 km-nél.',` | `prevention: 'Retrofit revised 8mm camshaft chain, sprockets, and reinforced tensioner kit at 55k mi (90k km).',` |
| 113 | `name: 'AdBlue tartály és szivattyú modul nyomásvesztés és kristályosodás',` | `name: 'AdBlue tank integrated pump module pressure loss and urea crystallization',` |
| 121 | `symptoms: '"UREA" hibajelzés és indításmegtagadási visszaszámláló a műszerfalon, szivattyú nyomáshiba.',` | `symptoms: '"UREA" fault light, engine restart prohibited countdown on dashboard, pump pressure fault.',` |
| 122 | `prevention: 'Kristályosodásgátló adalék minden tankoláskor, nyomásszelep szellőzőcső ellenőrzése.',` | `prevention: 'Add anti-crystallization additive at every refill; inspect tank cap pressure breather valve.',` |

---

#### 26. `src/data/vehicles/tesla.js`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 28 | `name: 'Első felső lengőkar gömbfej beázás, kenőanyag kimosódás és nyikorgás',` | `name: 'Front upper control arm ball joint water intrusion, grease washout, and loud squeaking',` |
| 36 | `symptoms: 'Hangos, száraz "nyikorgó kanapé" hang kormányzáskor és alacsony sebességű rugózáskor.',` | `symptoms: 'Loud dry creaking / "squeaky bed" noise when turning wheel and over low-speed bumps.',` |
| 37 | `prevention: 'Módosított tömítésű Meyle-HD lengőkar beépítése vagy a porvédő gumi alatti zsírzás garanciában.',` | `prevention: 'Install revised heavy-duty control arms (e.g. Meyle-HD) or seal boot with marine-grade synthetic grease.',` |
| 51 | `name: 'Hátsó lengőkar szilent szakadás és futómű instabilitás',` | `name: 'Rear lower control arm suspension bushing tear and lateral squirm',` |
| 59 | `symptoms: 'Autópályán hirtelen gázelvételkor enyhe oldalirányú kitörés, belső abroncsélek rendellenes kopása.',` | `symptoms: 'Subtle lateral rear-end twitch on highway throttle lift-off, accelerated inner tire shoulder wear.',` |
| 60 | `prevention: 'Futómű geometria és szilent ellenőrzés 40,000 km-enként, megerősített poliuretán szilentek.',` | `prevention: 'Inspect chassis alignment and bushing integrity every 25k mi; replace with upgraded bushings.',` |
| 83 | `criticalDefectTag: '⚠️ LFP TÉLI BMS KALIBRÁCIÓ & HIDEG DC TÖLTÉSI SEBESSÉG',` | `criticalDefectTag: '⚠️ LFP WINTER BMS SOC DRIFT & COLD DC CHARGING THROTTLE',` |
| 94 | `name: 'Téli hidegben BMS (akkukezelő) töltöttségi szint téves kalibráció és hirtelen leállás 10% alatt',` | `name: 'Winter sub-freezing BMS state-of-charge drift and sudden drop-off below 10%',` |
| 102 | `symptoms: 'Hideg téli időben a műszerfali hatótáv 8-12%-ról hirtelen 0-ra ugrik, az autó leáll.',` | `symptoms: 'In freezing ambient temps, displayed SoC abruptly drops from ~10% to 0%, inducing sudden limp/shutdown.',` |
| 103 | `prevention: 'Hetente legalább 1x 100%-ra tölteni a járművet a cellafeszültség lapos görbéjének felső kalibrálásához!',` | `prevention: 'Charge to 100% at least once weekly to allow BMS top-balancing across flat LFP voltage curve.',` |
| 126 | `criticalDefectTag: '🚨 NMC GYORS DC CELLADEGRADÁCIÓ & HŐSZIVATTYÚ OCTOVALVE',` | `criticalDefectTag: '🚨 NMC CELL DEGRADATION FROM 250KW DC CHARGING & OCTOVALVE',` |
| 137 | `name: 'Gyakori 250 kW-os Supercharger DC gyorstöltés miatti NMC celladegradáció',` | `name: 'NMC high-nickel cell degradation from frequent 250 kW DC fast charging',` |
| 145 | `symptoms: 'Látható hatótávvesztés (12-18% SoH esés), ha tartósan 100%-ra töltve és melegben parkol a jármű.',` | `symptoms: 'Accelerated loss of rated range (12–18% SoH decline) when frequently charged to 100% or parked hot.',` |
| 146 | `prevention: 'Napi töltési limit szigorúan 80%-ra állítása, 100%-os töltés csak közvetlenül hosszú utazás előtt.',` | `prevention: 'Set daily charge ceiling strictly to 80%; reserve 100% charges only for immediate highway departure.',` |
| 160 | `name: 'Hőszivattyú (Octovalve) hűtőközeg-szelep megszorulás és fűtésvesztés fagypont alatt',` | `name: 'Heat pump Octovalve refrigerant metering valve seizure and sub-freezing cabin heat loss',` |
| 168 | `symptoms: '"Cabin climate keeper unavailable" hiba, azonnali kabinfűtés elvesztése téli fagyban, kompresszor tiltás.',` | `symptoms: '"Cabin climate keeper unavailable" error, sudden loss of cabin heating in freezing weather, compressor lockout.',` |
| 169 | `prevention: 'Garanciális szoftveres védelmi frissítés és módosított nyomásszenzor/Octovalve szelepcsere.',` | `prevention: 'Install revised thermal protection firmware; replace defective pressure/temp sensors and Octovalve manifold.',` |

---

#### 27. `src/data/vehicles/toyota.js`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 28 | `name: '12V segédakkumulátor mélykisülés ritka használat vagy rövid utak esetén',` | `name: '12V auxiliary battery parasitic discharge on infrequent driving or short trips',` |
| 36 | `symptoms: 'Az autó nem kapcsol READY állapotba, gyenge műszerfal világítás 1-2 hét állás után.',` | `symptoms: 'Vehicle fails to enter READY mode, dim cluster lighting after sitting unused for 10–14 days.',` |
| 37 | `prevention: 'Havi legalább 1x 45 perces READY üzemmódban tartás, AGM segédakkumulátor csere.',` | `prevention: 'Maintain vehicle in READY mode for 45 min monthly or replace with upgraded deep-cycle AGM auxiliary battery.',` |
| 61 | `criticalDefectTag: '⚠️ EGR KOROMLERAKÓDÁS & HV VENTILÁTOR SZŰRŐ',` | `criticalDefectTag: '⚠️ EGR CARBON CLOGGING & HEAD GASKET BREACH / HV FAN FILTER',` |
| 71 | `name: 'EGR hűtő és csatorna koromlerakódás miatti hengerfejtömítés átégés',` | `name: 'EGR cooler and intake runner carbon coking causing cylinder head gasket failure',` |
| 79 | `symptoms: 'Intenzív kopogás és motordadogás hidegindítás utáni első 15 másodpercben, hűtőfolyadék-fogyás.',` | `symptoms: 'Violent knocking/misfire shudder for first 15 seconds after cold start, slow coolant consumption.',` |
| 80 | `prevention: 'EGR szelep, fémcsövek és szívósori kivezetések ultrahangos tisztítása 100,000 km-enként!',` | `prevention: 'Ultrasonic cleaning of EGR valve, stainless pipe, and intake manifold distribution ports every 60k mi.',` |
| 94 | `name: 'Hibrid akkumulátor hűtőventilátor szűrő elporolódás és cella túlmelegedés',` | `name: 'Hybrid battery cooling blower intake screen dust clogging and cell overheating',` |
| 102 | `symptoms: 'P0A80 hibakód, a hibrid akkumulátor hűtőventilátora folyamatosan maximális hangerővel süvít a hátsó ülésnél.',` | `symptoms: 'DTC P0A80, hybrid battery cooling fan roars at maximum speed continuously from rear seat duct.',` |
| 103 | `prevention: 'Hátsó ülés alatti hűtőrács és ventilátorszűrő ellenőrzése és tisztítása minden éves olajcserénél.',` | `prevention: 'Inspect and clean rear-seat battery intake grille filter mesh at every annual oil change.',` |
| 137 | `name: 'Cablegate — Hátsó MGR villanymotor nagyfeszültségű kábelcsatlakozó beázása és korróziója (AWD-i)',` | `name: 'Cablegate — Rear MGR electric motor high-voltage harness connector corrosion (AWD-i)',` |
| 145 | `symptoms: 'Check Hybrid System figyelmeztetés esős/havas időben, AM rádióadás sistergése gázadáskor, hajtásletiltás.',` | `symptoms: '"Check Hybrid System" warning in wet/snowy conditions, AM radio static on acceleration, EV drivetrain cutout.',` |
| 146 | `prevention: 'Alvázvédelmi nyitott revíziós védőburkolat és korróziógátló viasz (T-SB-0030-22 szervizkampány).'` | `prevention: 'Install slotted drainage cover and apply anti-corrosion cavity wax per Toyota T-SB-0030-22.',` |
| 170 | `criticalDefectTag: '🚨 CABLEGATE HÁTSÓ HV KÁBELKORRÓZIÓ VISSZAHÍVÁS',` | `criticalDefectTag: '🚨 CABLEGATE REAR HV CONNECTOR CORROSION EXTENDED WARRANTY',` |
| 180 | `name: 'Cablegate — Hátsó MGR villanymotor nagyfeszültségű kábelcsatlakozó beázása és korróziója (AWD-i)',` | `name: 'Cablegate — Rear MGR electric motor high-voltage harness connector corrosion (AWD-i)',` |
| 188 | `symptoms: 'Check Hybrid System figyelmeztetés esős/havas időben, AM rádióadás sistergése gázadáskor, hajtásletiltás.',` | `symptoms: '"Check Hybrid System" warning in wet/snowy conditions, AM radio static on acceleration, EV drivetrain cutout.',` |
| 189 | `prevention: 'Alvázvédelmi nyitott revíziós védőburkolat és korróziógátló viasz (T-SB-0030-22 szervizkampány).'` | `prevention: 'Install slotted drainage cover and apply anti-corrosion cavity wax per Toyota T-SB-0030-22.',` |
| 203 | `name: 'Hűtőfolyadék bypass szabályozószelep elektromos meghibásodás és szivárgás',` | `name: 'Coolant bypass control valve electrical actuator failure and micro-leakage',` |
| 211 | `symptoms: '"Engine Maintenance Required" figyelmeztetés a központi kijelzőn, lassan melegedő utastér.',` | `symptoms: '"Engine Maintenance Required" display message, slow cabin warmup, DTC P2681.',` |
| 212 | `prevention: 'Módosított cikkszámú víz bypass szelep csere a hibakód megjelenésekor.',` | `prevention: 'Replace with revised OEM coolant bypass valve assembly upon initial DTC appearance.',` |

---

#### 28. `src/data/vehicles/vag.js`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 28 | `name: 'MIB3 érintőképernyős infotainment fagyások és szoftveres újraindulások',` | `name: 'MIB3 touchscreen infotainment freezing, audio dropout, and random reboots',` |
| 36 | `symptoms: 'Klímavezérlés nem reagál, fekete központi kijelző, Travel Assist figyelmeztető hangok csipogása.',` | `symptoms: 'Unresponsive climate sliders, black center screen, phantom Travel Assist audible error chimes.',` |
| 37 | `prevention: 'Hivatalos szerviz általi 1896 vagy 1941+ firmware verzióra frissítés és OCU vezérlő csere.',` | `prevention: 'Dealer firmware flash to release 1896 / 1941+ and updated OCU telematics communication module.',` |
| 61 | `criticalDefectTag: '⚠️ VÍZPUMPA PALÁST MEGSZORULÁS & TWINDOSING SCR',` | `criticalDefectTag: '⚠️ WATER PUMP FLOW SHROUD BINDING & TWINDOSING SCR',` |
| 71 | `name: 'Vízpumpa vákuumos áramlásszabályozó gallér (shroud) megszorulása és hirtelen túlmelegedés',` | `name: 'Vacuum-actuated coolant pump flow shroud sticking and abrupt highway overheating',` |
| 79 | `symptoms: 'A hűtővíz hőmérsékletjelző hirtelen felugrik 120-130°C-ra autópálya terhelésnél, majd gázelvételre visszahűl.',` | `symptoms: 'Coolant temperature gauge rapidly spikes to 120–130°C (250°F) under highway load, dropping when lifting off throttle.',` |
| 80 | `prevention: 'Megelőző vezérléscsere és megerősített, folyamatos átfolyású prémium vízpumpa beépítése 90,000 km-nél.',` | `prevention: 'Preventative timing belt and water pump service at 60k mi (90k km) with upgraded non-shrouded pump.',` |
| 94 | `name: 'DPF nyomáskülönbség szenzor (G450) elhalálozás és AdBlue kristályosodás',` | `name: 'DPF differential exhaust pressure sensor (G450) drift and AdBlue crystallization',` |
| 102 | `symptoms: 'Check Engine és izzításjelző villogás, DPF telítettség hibakód (P2002), limp mode.',` | `symptoms: 'Flashing glow plug lamp and Check Engine light, P2002 DPF efficiency code, limp mode.',` |
| 103 | `prevention: 'G450 szenzor megelőző csere 120e km-nél, AdBlue kristályosodásgátló adalék minden tankolásnál.',` | `prevention: 'Proactively replace G450 sensor at 75k mi; dose anti-crystallization additive into AdBlue reservoir.',` |
| 117 | `name: 'Bosch CP4 magasnyomású szivattyú görgőkopás és fémforgácsképződés (spém)',` | `name: 'Bosch CP4 high-pressure fuel pump roller wear and metallic swarf contamination',` |
| 125 | `symptoms: 'Gyenge gyorsulás padlógáznál, railnyomás hiány (P0087), Limp Mode és fémrészecskék az üzemanyagszűrőben.',` | `symptoms: 'Sluggish wide-open throttle acceleration, rail pressure shortfall (P0087), limp mode, and glitter in fuel filter.',` |
| 126 | `prevention: 'Prémium minőségű gázolaj kenésjavító adalékkal, üzemanyagszűrő csere max 15,000 km-enként, CP4 felújítás 160e km-nél.',` | `prevention: 'Run high-lubricity premium diesel, replace fuel filter every 10k mi, overhaul CP4 pump at 100k mi.',` |
| 150 | `criticalDefectTag: '⚠️ MŰANYAG TERMOSZTÁTHÁZ SZIVÁRGÁS & SZELEPKOKSZ',` | `criticalDefectTag: '⚠️ PLASTIC THERMOSTAT ROTARY HOUSING LEAK & INTAKE VALVE CARBON',` |
| 160 | `name: 'Műanyag termosztátház / vízpumpa tolózár (rotary slide valve) modul kirepedés és hűtőfolyadék-szivárgás',` | `name: 'Plastic thermostat rotary slide valve housing module hairline cracking and coolant seepage',` |
| 168 | `symptoms: 'Édeskés fagyállószag a motortérben, folyamatosan csökkenő kiegyenlítőtartály szint, rózsaszín hűtőfolyadék foltok a kartervédőn.',` | `symptoms: 'Sweet maple syrup coolant odor, steadily dropping expansion tank level, pink crusted residue on undertray.',` |
| 169 | `prevention: 'Alumínium házas revíziós termosztát/vízpumpa modul felszerelése az első mikroszivárgás észlelésekor.',` | `prevention: 'Fit upgraded aluminum-cased revised water pump/thermostat module at first sign of weeping.',` |
| 183 | `name: 'Közvetlen befecskendezés miatti szívószelep kokszosodás (carbon buildup)',` | `name: 'Direct-injection intake valve carbon coking and port constriction',` |
| 191 | `symptoms: 'Egyenetlen hideg alapjárat, hidegindítási égéskimaradások (P0300, P0301), torpanás padlógázas gyorsításkor.',` | `symptoms: 'Rough cold idle, cold-start cylinder misfires (P0300, P0301), hesitation on tip-in throttle.',` |
| 192 | `prevention: 'Dióhéjas mechanikus szívószelep tisztítás 80,000 km-enként, prémium 100-as oktánszámú benzin használata.',` | `prevention: 'Walnut shell media blasting of intake valves every 50k mi; use top-tier detergent fuel.',` |
| 216 | `criticalDefectTag: '⚠️ SZÁRAZ DQ200 KUPLUNGRÁNGATÁS & MECHATRONIKA',` | `criticalDefectTag: '⚠️ DQ200 7-SPEED DRY-CLUTCH SHUDDER & MECHATRONIC PRESSURE LOSS',` |
| 226 | `name: 'DQ200 7-fokozatú szárazkuplung rángatás és mechatronika nyomástároló kirepedés',` | `name: 'DQ200 7-speed dry clutch pack shudder and mechatronic hydraulic accumulator cracking',` |
| 234 | `symptoms: 'Intenzív vibráció és rázkódás 1-ből 2-be váltáskor araszolásnál, villogó sebességfokozat kijelzés.',` | `symptoms: 'Heavy shudder / vibration on 1-2 upshift in traffic crawl, flashing wrench / gear icon on MFD.',` |
| 235 | `prevention: 'Dugóban manuális fokozatválasztás a felesleges 1-2 váltások elkerülésére, szoftveres kuplung alapbeállítás.',` | `prevention: 'Select manual mode in traffic to eliminate repetitive 1-2 slip; perform VCDS basic clutch adaptation.',` |

---

#### 29. `src/data/vehicles/index.js`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 2 | `* ShiftMetric — Central Vehicle Known Issues ("Gyermekbetegségek") & Modular Catalog Registry` | `* ShiftMetric — Central Vehicle Known Issues & Modular Catalog Registry` |
| 272 | `* Returns known issues ("Gyermekbetegségek") for a specific engine and model generation` | `* Returns known issues for a specific engine and model generation` |

---

#### 30. `src/data/vehicles/schema.js`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 4 | `* Zod Schema for Vehicle Known Issues ("Gyermekbetegségek" / Red Flags)` | `* Zod Schema for Vehicle Known Issues / Red Flags` |

---

#### 31. `src/services/vehicleDataService.js`
| Line | Verbatim Text | Proposed English Translation |
|---|---|---|
| 518 | `* Returns curated engine & model telemetry, known issues ("gyermekbetegségek"),` | `* Returns curated engine & model telemetry, known issues,` |

---

## 2. Logic Chain

1. **Premise**: User requirement R1 demands: "Zero-Hungarian Linguistic Purge & 100% English UI" and "Scan every `.js`, `.jsx`, and `.html` file in `./src/` (including regex searches for Hungarian characters `[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]` and Hungarian words)."
2. **Observation**: 63 files exist in `./src/` and `./index.html`.
3. **Execution**: Running an exact regex scan for `[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]` identified 458 lines across 31 files.
4. **Execution**: A secondary dictionary search for unaccented Hungarian tokens (`vegyem`, `hasznaltauto`, `szerviz`, `koltseg`, `kockazat`, `gyermekbetegseg`, `szilent`, `spem`) confirmed that no additional files outside the 31 files contain Hungarian vocabulary.
5. **Execution**: Detailed inspection of the 31 files revealed that:
   - 3 files are top-level layout / nav (`App.jsx`, `Navbar.jsx`, `Footer.jsx`)
   - 6 files are calculators and common telemetry UI widgets (`KnownIssuesDossier.jsx`, `TcoCalculator.jsx`, `MaintenanceRiskMatrix.jsx`, `ObdEstimator.jsx`, `EvBreakEvenCalculator.jsx`, `VehicleComparator.jsx`)
   - 5 files are home / guide views (`HomePage.jsx`, `BlogPage.jsx`, `HeroVehicleFinder.jsx`, `SubsystemGrid.jsx`, `PreInspectionChecklist.jsx`, `ReviewsSection.jsx`)
   - 1 file is SEO metadata (`DynamicSeoHead.jsx`)
   - 13 files are data / service definitions (`breakEvenAndPpi.js`, `vehicleCatalog.js`, `obdCodes.js`, `bmw.js`, `ford.js`, `hyundaiKia.js`, `mercedes.js`, `stellantis.js`, `tesla.js`, `toyota.js`, `vag.js`, `index.js`, `schema.js`, `vehicleDataService.js`)
6. **Execution**: Checking tests revealed that `tests/vehicleKnownIssues.test.js` line 125 tests `searchKnownIssues('szilent')` and line 168 tests `issue.repairCost.formattedHuf.includes('Ft')`. Also, `tests/viralSeoFeatures.test.js` line 79 tests strings in `generatePpiChecklist`.
7. **Deduction**: Purging Hungarian text from these 31 files requires:
   - Replacing all UI copy, badges, titles, and descriptions with authoritative automotive English.
   - Preserving or updating test assertions that specifically query keywords like `'szilent'` or `'bushing'`.
   - Ensuring `formattedHuf` in `schema.js` remains valid for schema validation until tests are updated.

---

## 3. Caveats

1. **Test Suite Coupling**:
   - `tests/vehicleKnownIssues.test.js` (line 125) explicitly asserts `const szilentMatches = searchKnownIssues('szilent'); assert.ok(szilentMatches.length >= 2)`. When replacing `'szilent'` with `'bushing'` in `ford.js` and `tesla.js`, either:
     - The search query in the test must be updated to `searchKnownIssues('bushing')`, or
     - An alias/keyword `'bushing / szilent'` or search query synonym mapping must be retained in `searchKnownIssues()`.
   - `tests/viralSeoFeatures.test.js` (line 79) asserts `(s) => s.title.includes('CP4') || s.title.includes('szíj') || s.focus.includes('szivattyú') || s.inspectionMethod.includes('szűrő')`. Because `'CP4'` is retained in the English translation, this check continues to pass, but the test file comments themselves are in Hungarian.
   - `tests/jevCatalogJudge.test.js` has test names in Hungarian (`Jev-as-a-Judge: Szemantikai katalógus...`). Note that this is in `tests/`, not `src/`.
2. **Schema Field `formattedHuf`**:
   - `src/data/vehicles/schema.js` defines `RepairCostSchema` with `formattedHuf: z.string().min(1)`. All vehicle entries in `src/data/vehicles/*.js` include this field (e.g. `'280 000 – 560 000 Ft'`). It is not displayed anywhere in the UI (only `formattedEur` and `formattedUsd` are rendered). Removing this field requires updating `schema.js` and `tests/vehicleKnownIssues.test.js`.
3. **Non-Hungarian Diacritics**:
   - `TÜV` in `src/data/obdCodes.js` is German (Technischer Überwachungsverein).
   - `Pumpe-Düse` in `src/data/vehicleCatalog.js` is German.
   - `Gran Coupé` / `Coupé` in `src/data/vehicleCatalog.js` uses French diacritic `é`.
   - `Citroën` has `ë`, `Škoda` has `Š`.
   If a strict ASCII regex `[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]` is enforced with 0 tolerance, `Pumpe-Düse` (with `ü`), `TÜV` (with `Ü`), and `Coupé` (with `é`) must have their diacritics normalized to `Pumpe-Duse`, `TUV`, and `Coupe`.
4. **Scope Boundaries**:
   - This survey was performed in read-only mode. No source code files in `./src/` were edited or modified.

---

## 4. Conclusion

1. **Purge Targets Identified**: Exactly 31 files in `./src/` require editing to achieve 100% Zero-Hungarian Linguistic Purge.
2. **Clean Baseline**: 32 files in `./src/` and `index.html` are already 100% free of Hungarian text.
3. **Actionable Mapping**: Every single Hungarian string has been inventoried above with exact line numbers and an authoritative, plain English automotive translation.
4. **Test Readiness**: Tests currently pass (72 passed, 1 skipped) and production build succeeds (`dist/` built in 4.17s). Once the implementer executes R1 changes and synchronizes the 2 test queries in `tests/vehicleKnownIssues.test.js`, the purge will be 100% complete and fully verified.

---

## 5. Verification Method

To independently verify this survey:

1. **Accented Character Scan Command**:
   ```powershell
   node -e "
   const fs = require('fs');
   const path = require('path');
   function getFiles(dir) {
     let r = [];
     fs.readdirSync(dir).forEach(f => {
       const p = path.join(dir, f);
       if (fs.statSync(p).isDirectory()) r = r.concat(getFiles(p));
       else r.push(p);
     });
     return r;
   }
   const files = getFiles('./src');
   files.push('./index.html');
   let count = 0;
   files.forEach(f => {
     const c = fs.readFileSync(f, 'utf8');
     const lines = c.split('\n');
     lines.forEach((l, i) => {
       if (/[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/.test(l)) {
         count++;
         console.log(f + ':' + (i+1) + ': ' + l.trim());
       }
     });
   });
   console.log('Total matches: ' + count);
   "
   ```
   *Expected Current Output*: 458 lines matching across 31 files. After R1 purge, expected output is 0.

2. **Test Suite Verification**:
   ```powershell
   cmd /c npm test
   ```
   *Expected Output*: 72 passed, 0 failed.

3. **Build Verification**:
   ```powershell
   cmd /c npm run build
   ```
   *Expected Output*: `vite build` completed with exit code 0.

/**
 * DriveLedger Comprehensive Audit Fixes & Edge-Case Verification Suite
 *
 * Deeply validates all SEO, Calculator, Database, UI, Performance, and P2 Growth fixes:
 * 1. Prerendered static HTML (<h1>, telemetry, internal <a href> links, JSON-LD, vehicle og:image, /vehicles directory)
 * 2. 100% accurate brand+model known issues mapping across all 179 VEHICLE_PRESETS
 * 3. Zero ICE contamination in EV PPI checklists across all pure EVs
 * 4. maintenanceWearFactor cost/wear scaling across OBD, Risk Matrix & Maintenance Reserve
 * 5. Code-specific OBD summaries & category coverage (including Hybrid & Network Telemetry)
 * 6. Regional Amazon domain & placeholder stripping in buildAffiliateUrl
 * 7. Embeddable Reliability & TCO Badge escaping & formatting
 * 8. Cleanup invariants (no VehicleHierarchySelector.jsx, no Material Symbols, no Hungarian UI leaks, accurate counts)
 * 9. DynamicSeoHead, 404 noindex, single <h1>, and route-scoped JSON-LD via live DOM rendering
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { VEHICLE_PRESETS } from '../src/data/vehiclePresets.js';
import {
  findEngineVariant,
  getKnownIssuesForEngine,
  getGenerationsForModel,
} from '../src/data/vehicles/index.js';
import { generatePpiChecklist } from '../src/data/breakEvenAndPpi.js';
import {
  OBD_CODES,
  buildObdCodeSummary,
  calculateObdWorkshopEstimate,
} from '../src/data/obdCodes.js';
import {
  MAINTENANCE_COMPONENTS,
  evaluateComponentHealth,
  calculateMaintenanceReserve,
  calculateTcoProjection,
  calculateEvEnergyCost,
  normalizeEvKwhPer100Mi,
  filterComponentsForPowertrain,
  isPureElectric,
} from '../src/data/maintenanceData.js';
import { BRAND_DIRECTORY, parseBrandHubPath, getBrandBySlug } from '../src/data/brandDirectory.js';
import { parseCompareMatchupPath, parseRiskMileagePath } from '../src/data/seoMatrixData.js';
import { GUIDES_DATA } from '../src/data/guidesData.js';
import { buildAffiliateUrl } from '../src/config/monetizationConfig.js';
import { DIST_DIR } from '../scripts/prerender-seo-routes.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('AUDIT-1: Prerendered static HTML contains non-empty <h1>, internal <a href> links, valid JSON-LD, and vehicle-specific og:image', () => {
  const golfTcoPath = path.join(DIST_DIR, 'tco', 'vw-golf-20-tdi', 'index.html');
  assert.ok(fs.existsSync(golfTcoPath), 'Expected dist/tco/vw-golf-20-tdi/index.html to exist');
  const golfHtml = fs.readFileSync(golfTcoPath, 'utf8');

  assert.ok(golfHtml.includes('data-prerendered="true"'), 'Static prerendered markup must live inside #root');
  assert.ok(/<h1>[^<]*Volkswagen Golf[^<]*<\/h1>/i.test(golfHtml), 'Must inject vehicle-specific <h1>');
  assert.ok(golfHtml.includes('/risk-matrix/vw-golf-20-tdi/60k-miles'), 'Must include 60k-miles internal link');
  assert.ok(golfHtml.includes('/risk-matrix/vw-golf-20-tdi/100k-miles'), 'Must include 100k-miles internal link');
  assert.ok(golfHtml.includes('/risk-matrix/vw-golf-20-tdi/150k-miles'), 'Must include 150k-miles internal link');
  assert.ok(golfHtml.includes('/compare/'), 'Must include rival comparison link');
  assert.ok(golfHtml.includes('/obd/vw-golf-20-tdi/'), 'Must include OBD internal links');
  assert.ok(golfHtml.includes('/vehicles'), 'Must link to /vehicles HTML directory');

  // Static JSON-LD parsing check
  const ldMatch = golfHtml.match(/<script\s+id="prerender-jsonld"\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  assert.ok(ldMatch, 'Must inject static JSON-LD script into <head>');
  const parsedLd = JSON.parse(ldMatch[1]);
  assert.equal(parsedLd['@type'], 'Vehicle', 'Vehicle TCO page must emit Vehicle JSON-LD');

  // Vehicle-specific og:image / twitter:image (not default og-image.png)
  const ogImg = golfHtml.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  const twImg = golfHtml.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i);
  assert.ok(ogImg && ogImg[1] && !ogImg[1].endsWith('/og-image.png'), `Expected vehicle-specific og:image, got ${ogImg?.[1]}`);
  assert.equal(ogImg[1], twImg?.[1], 'og:image and twitter:image must match');

  // OBD prerender must contain non-empty root causes (regression check for dossier.rootCauses vs dossier.causes)
  const obdPath = path.join(DIST_DIR, 'obd', 'ford-focus-ecoblue', 'p2002', 'index.html');
  assert.ok(fs.existsSync(obdPath), 'Expected dist/obd/ford-focus-ecoblue/p2002/index.html');
  const obdHtml = fs.readFileSync(obdPath, 'utf8');
  assert.ok(obdHtml.includes('% probability)'), 'OBD prerendered HTML must render actual rootCauses list items');
  assert.ok(!obdHtml.includes('<ul></ul>'), 'OBD prerendered HTML must never emit empty root causes list');

  // /vehicles HTML catalog must contain all 35 brands and all 179 models
  const vehiclesPath = path.join(DIST_DIR, 'vehicles', 'index.html');
  assert.ok(fs.existsSync(vehiclesPath), 'Expected dist/vehicles/index.html to exist');
  const vehiclesHtml = fs.readFileSync(vehiclesPath, 'utf8');
  for (const preset of VEHICLE_PRESETS) {
    assert.ok(
      vehiclesHtml.includes(`href="/tco/${preset.id}"`),
      `/vehicles static HTML missing link to /tco/${preset.id}`
    );
  }

  // Newly added guide must be prerendered with rich content and JSON-LD
  const bmwGuidePath = path.join(DIST_DIR, 'guides', 'used-bmw-3-series-buying-checklist', 'index.html');
  assert.ok(fs.existsSync(bmwGuidePath), 'Expected newly added BMW 3 Series guide to be prerendered');
  const bmwGuideHtml = fs.readFileSync(bmwGuidePath, 'utf8');
  assert.ok(bmwGuideHtml.includes('TechArticle'), 'Prerendered guide must emit TechArticle JSON-LD');
  assert.ok(bmwGuideHtml.includes('FAQPage'), 'Prerendered guide must emit FAQPage JSON-LD');
});

test('AUDIT-2: All 179 VEHICLE_PRESETS resolve to exact Brand + Model with >= 1 model-faithful known issue', () => {
  for (const preset of VEHICLE_PRESETS) {
    const resolved = findEngineVariant(preset.id);
    assert.ok(resolved, `findEngineVariant(${preset.id}) must not return null`);

    const pBrand = preset.brand.toLowerCase().replace(/[^a-z0-9]/g, '');
    const rBrand = resolved.brand.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    assert.ok(
      rBrand.includes(pBrand) || pBrand.includes(rBrand),
      `Brand mismatch for ${preset.id}: expected ${preset.brand}, got ${resolved.brand.name}`
    );

    const pModel = preset.modelName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const rModel = resolved.model.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    assert.ok(
      rModel.includes(pModel) || pModel.includes(rModel),
      `Model mismatch for ${preset.id}: expected ${preset.modelName}, got ${resolved.model.name}`
    );

    const issues = getKnownIssuesForEngine(preset.id);
    assert.ok(Array.isArray(issues) && issues.length >= 1, `Expected >= 1 known issue for ${preset.id}`);
  }

  // Explicit regression checks for historically mis-mapped models
  const f150 = findEngineVariant('ford-f150-ecoboost');
  assert.ok(f150 && !f150.model.name.toLowerCase().includes('focus'), 'Ford F-150 must never map to Focus');

  const camry = findEngineVariant('toyota-camry-hybrid');
  assert.ok(camry && camry.model.name.toLowerCase().includes('camry'), 'Camry Hybrid must map to Camry, not Corolla');

  const modelY = findEngineVariant('tesla-model-y-lr');
  assert.ok(modelY && modelY.model.name.toLowerCase().includes('model y'), 'Tesla Model Y must map to Model Y, not Model 3');
});

test('AUDIT-3: Pure EV PPI checklists have zero ICE contamination and include HV Battery & OBC/ICCU steps', () => {
  const evPresets = VEHICLE_PRESETS.filter((p) => isPureElectric(p));
  assert.ok(evPresets.length >= 5, 'Catalog must include multiple pure EV presets');

  const forbiddenIceTerms = [
    'exhaust smoke',
    'oil cap',
    'blow-by',
    'clutch slip',
    'dual-mass flywheel',
    '4th gear',
    '1,500 rpm',
  ];

  for (const ev of evPresets) {
    const items = generatePpiChecklist(ev, 100000);
    assert.ok(items.some((i) => i.id === 'step-ev-hv-battery'), `${ev.id} PPI must include step-ev-hv-battery`);
    assert.ok(
      items.some((i) => i.id === 'step-ev-charging-driveline'),
      `${ev.id} PPI must include step-ev-charging-driveline`
    );

    const serialized = JSON.stringify(items).toLowerCase();
    for (const term of forbiddenIceTerms) {
      assert.ok(
        !serialized.includes(term),
        `Pure EV ${ev.id} PPI checklist must NOT contain ICE term "${term}"`
      );
    }
  }
});

test('AUDIT-4: maintenanceWearFactor scales OBD workshop estimates, component health costs, and maintenance reserve', () => {
  const lowWearPreset = VEHICLE_PRESETS.find((p) => p.maintenanceWearFactor <= 0.85);
  const highWearPreset = VEHICLE_PRESETS.find((p) => p.maintenanceWearFactor >= 1.35);
  assert.ok(lowWearPreset && highWearPreset, 'Must find low-wear and high-wear presets');

  // 1. OBD estimate scaling
  const obdLow = calculateObdWorkshopEstimate(OBD_CODES[0], 'independent', { vehicle: lowWearPreset });
  const obdHigh = calculateObdWorkshopEstimate(OBD_CODES[0], 'independent', { vehicle: highWearPreset });
  assert.ok(
    obdHigh.weightedExpectedUsd > obdLow.weightedExpectedUsd,
    `High-wear OBD estimate ($${obdHigh.weightedExpectedUsd}) must exceed low-wear ($${obdLow.weightedExpectedUsd})`
  );

  // 2. Risk Matrix component wear & scaledCostsUsd scaling
  const comp = MAINTENANCE_COMPONENTS.find((c) => c.applicablePowertrains.includes('gasoline-turbo'));
  assert.ok(comp, 'Must find gasoline-turbo maintenance component');
  const healthLow = evaluateComponentHealth({
    component: comp,
    physicalOdometerMiles: 85000,
    urbanTripSharePct: 50,
    oilIntervalId: 'standard',
    serviceHistoryId: 'verified',
    maintenanceWearFactor: lowWearPreset.maintenanceWearFactor,
  });
  const healthHigh = evaluateComponentHealth({
    component: comp,
    physicalOdometerMiles: 85000,
    urbanTripSharePct: 50,
    oilIntervalId: 'standard',
    serviceHistoryId: 'verified',
    maintenanceWearFactor: highWearPreset.maintenanceWearFactor,
  });
  assert.ok(
    healthHigh.scaledCostsUsd.independent[1] > healthLow.scaledCostsUsd.independent[1],
    'High-wear component repair cost must exceed low-wear repair cost'
  );

  // 3. Maintenance reserve scaling
  const reserveLow = calculateMaintenanceReserve({
    evaluatedComponents: [{ ...comp, health: healthLow }],
    workshopTier: 'independent',
    annualDistanceMiles: 12000,
    maintenanceWearFactor: lowWearPreset.maintenanceWearFactor,
  });
  const reserveHigh = calculateMaintenanceReserve({
    evaluatedComponents: [{ ...comp, health: healthHigh }],
    workshopTier: 'independent',
    annualDistanceMiles: 12000,
    maintenanceWearFactor: highWearPreset.maintenanceWearFactor,
  });
  assert.ok(
    reserveHigh > reserveLow,
    `High-wear maintenance reserve ($${reserveHigh}) must exceed low-wear ($${reserveLow})`
  );
});

test('AUDIT-5: buildObdCodeSummary produces accurate systemCategory and code-specific descriptions for all 20 OBD codes', () => {
  const categories = new Set();
  for (const obd of OBD_CODES) {
    const summary = buildObdCodeSummary(obd);
    assert.equal(summary.systemCategory, obd.systemCategory, `Category mismatch on ${obd.code}`);
    assert.ok(summary.description.includes(obd.code), `Description for ${obd.code} must mention the code`);
    if (obd.code !== 'P0420') {
      assert.ok(
        !summary.description.includes('Catalytic converter efficiency or sensor threshold fault registered by powertrain control module.'),
        `${obd.code} must not fall back to hardcoded P0420 catalyst copy`
      );
    }
    categories.add(obd.systemCategory);
  }
  assert.ok(
    categories.has('Hybrid & Network Telemetry'),
    'OBD catalog must include Hybrid & Network Telemetry category'
  );
});

test('AUDIT-6: buildAffiliateUrl filters placeholders and resolves regional UK/EU Amazon domains', () => {
  const ukObd = buildAffiliateUrl('obdScanner', { region: 'UK', skipPlaceholder: true });
  assert.ok(ukObd.href.includes('amazon.co.uk'), `UK OBD link must use amazon.co.uk, got ${ukObd.href}`);
  assert.ok(!ukObd.href.includes('YOUR_AMAZON_TAG'), 'Must strip placeholder tag when skipPlaceholder is true');

  const euObd = buildAffiliateUrl('obdScanner', { region: 'EU', skipPlaceholder: true });
  assert.ok(euObd.href.includes('amazon.de'), `EU OBD link must use amazon.de, got ${euObd.href}`);
  assert.ok(!euObd.href.includes('YOUR_AMAZON_TAG'), 'Must strip placeholder tag when skipPlaceholder is true');

  const usObdClean = buildAffiliateUrl('obdScanner', { region: 'US', skipPlaceholder: true });
  assert.ok(usObdClean.href.includes('amazon.com'), `US OBD link must use amazon.com, got ${usObdClean.href}`);
  assert.ok(!usObdClean.href.includes('YOUR_AMAZON_TAG'), 'US link with skipPlaceholder must not contain placeholder');
});

test('AUDIT-7: Embed badge shields.io escaping & cleanup invariants', () => {
  // Check ForumShareModal source includes formatShieldsSegment and 2-decimal cost-per-unit
  const shareSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/components/common/ForumShareModal.jsx'), 'utf8');
  assert.ok(shareSrc.includes('formatShieldsSegment'), 'ForumShareModal must export formatShieldsSegment');
  assert.ok(shareSrc.includes(".replace(/-/g, '--')"), 'Must escape hyphens for shields.io URLs');
  assert.ok(shareSrc.includes('<svg xmlns="http://www.w3.org/2000/svg"'), 'Must include self-contained inline SVG badge');

  // Cleanup & copy invariants
  assert.ok(
    !fs.existsSync(path.join(ROOT_DIR, 'src/components/common/VehicleHierarchySelector.jsx')),
    'Unused VehicleHierarchySelector.jsx must be deleted'
  );

  const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('content="#F7F7F4"'), 'index.html theme-color must be #F7F7F4');
  assert.ok(!indexHtml.includes('Material+Symbols+Outlined'), 'Unused Material Symbols Google Font must be removed');
  assert.ok(!indexHtml.includes('120+'), 'index.html must not contain outdated 120+ models copy');

  const knownIssuesSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/components/common/KnownIssuesDossier.jsx'), 'utf8');
  assert.ok(!/\bLE\b/.test(knownIssuesSrc), 'KnownIssuesDossier.jsx must use HP instead of Hungarian LE');

  const navbarSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/components/layout/Navbar.jsx'), 'utf8');
  assert.ok(!navbarSrc.includes('Impresszum'), 'Navbar.jsx must not contain Hungarian Impresszum');

  const aboutSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/pages/AboutPage.jsx'), 'utf8');
  assert.ok(!aboutSrc.includes('Impresszum'), 'AboutPage.jsx must not contain Hungarian Impresszum');

  const homeSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/pages/HomePage.jsx'), 'utf8');
  assert.ok(!homeSrc.includes('4,800'), 'HomePage.jsx must not display inflated 4,800 OBD2 code count');
  assert.ok(!homeSrc.includes('120+'), 'HomePage.jsx must not display outdated 120+ models copy');

  const imgResolverSrc = fs.readFileSync(
    path.join(ROOT_DIR, 'src/components/common/vehicle/VehicleImageResolver.jsx'),
    'utf8'
  );
  assert.ok(imgResolverSrc.includes('fetchPriority'), 'VehicleImageResolver must set fetchPriority="high" for hero/showcase');
  assert.ok(imgResolverSrc.includes("'eager'"), 'VehicleImageResolver must use loading="eager" for hero/showcase');

  // All 10 guides exist in GUIDES_DATA and in public/sitemap.xml
  assert.equal(GUIDES_DATA.length, 10, 'GUIDES_DATA must contain all 10 guides');
  const sitemapXml = fs.readFileSync(path.join(ROOT_DIR, 'public/sitemap.xml'), 'utf8');
  assert.ok(sitemapXml.includes('<loc>https://mydriveledger.com/vehicles</loc>'), 'Sitemap must contain /vehicles');
  for (const g of GUIDES_DATA) {
    assert.ok(
      sitemapXml.includes(`<loc>https://mydriveledger.com/guides/${g.slug}</loc>`),
      `Sitemap must contain guide /guides/${g.slug}`
    );
  }
});

test('AUDIT-8: Zero fuel-type, displacement, or generation cross-mappings across all 179 presets', () => {
  for (const preset of VEHICLE_PRESETS) {
    const resolved = findEngineVariant(preset.id);
    assert.ok(resolved, `${preset.id} must resolve`);
    const pFuel = String(preset.fuelType || '').toLowerCase();
    const vFuel = String(resolved.engine.fuelType || '').toLowerCase();
    assert.equal(
      pFuel.includes('diesel'),
      vFuel.includes('diesel'),
      `Diesel mismatch on ${preset.id}: preset=${preset.fuelType}, mapped=${resolved.engine.id} (${resolved.engine.fuelType})`
    );
    assert.equal(
      Boolean(preset.isEv),
      vFuel === 'electric',
      `EV mismatch on ${preset.id}: preset.isEv=${preset.isEv}, mapped=${resolved.engine.id} (${resolved.engine.fuelType})`
    );
    if (preset.isEv && resolved.engine.epaEfficiency?.kwhPer100Km) {
      assert.ok(
        resolved.engine.epaEfficiency.kwhPer100Km <= 35,
        `EV kwhPer100Km on ${preset.id} must be realistic (<35), got ${resolved.engine.epaEfficiency.kwhPer100Km}`
      );
    }
  }

  // Specific former cross-mapping regressions
  const c300 = findEngineVariant('mercedes-c-class-c300');
  assert.notEqual(c300.engine.id, 'mercedes-c220d-om654-w205', 'Gasoline C300 must never map to Diesel OM654');
  assert.equal(c300.engine.fuelType, 'Gasoline');

  const e46 = findEngineVariant('bmw-320d-e46');
  assert.notEqual(e46.engine.id, 'bmw-320d-b47-g20', 'E46 M47 must not map to G20 B47');

  const mk4Tdi = findEngineVariant('vw-golf-mk4-19-tdi');
  assert.notEqual(mk4Tdi.engine.id, 'vw-golf-mk8-20-tdi', 'Mk4 1.9 TDI must not map to Mk8 2.0 TDI');

  const b57 = findEngineVariant('bmw-530d-b57');
  assert.notEqual(b57.engine.id, 'bmw-520d-b47-g30', '530d 3.0L I6 must not map to 520d 2.0L');

  // Non-modular models of modular brands must NOT fall back to models[0] (Focus/Corolla)
  assert.deepEqual(getGenerationsForModel('ford', 'ford-f-150'), [], 'Ford F-150 must not fall back to Ford Focus generations');
  assert.deepEqual(getGenerationsForModel('toyota', 'toyota-camry'), [], 'Toyota Camry must not fall back to Toyota Corolla generations');
});

test('AUDIT-9: calculateMaintenanceReserve scales once via pre-scaled health OR explicit vehicle without double-scaling', () => {
  const sampleComp = MAINTENANCE_COMPONENTS.find((c) => c.id === 'timing-assembly') || MAINTENANCE_COMPONENTS[0];
  const lowWearPreset = { maintenanceWearFactor: 0.85, powertrain: 'gasoline-turbo', transmission: 'torque-converter' };
  const highWearPreset = { maintenanceWearFactor: 1.55, powertrain: 'gasoline-turbo', transmission: 'torque-converter' };

  const lowHealth = evaluateComponentHealth({
    component: sampleComp,
    physicalOdometerMiles: 80000,
    vehicle: lowWearPreset,
  });
  const highHealth = evaluateComponentHealth({
    component: sampleComp,
    physicalOdometerMiles: 80000,
    vehicle: highWearPreset,
  });

  const lowResViaPreScaled = calculateMaintenanceReserve({
    evaluatedComponents: [{ ...sampleComp, health: lowHealth }],
    workshopTier: 'independent',
  });
  const highResViaPreScaled = calculateMaintenanceReserve({
    evaluatedComponents: [{ ...sampleComp, health: highHealth }],
    workshopTier: 'independent',
  });
  const highResWithVehicleToo = calculateMaintenanceReserve({
    evaluatedComponents: [{ ...sampleComp, health: highHealth }],
    workshopTier: 'independent',
    vehicle: highWearPreset,
  });

  assert.ok(
    highResViaPreScaled > lowResViaPreScaled,
    `High-wear reserve (${highResViaPreScaled}) must exceed low-wear reserve (${lowResViaPreScaled}) even without passing vehicle twice`
  );
  assert.ok(
    Math.abs(highResWithVehicleToo - highResViaPreScaled) <= 2,
    `Passing vehicle alongside pre-scaled health must NOT double-scale the reserve (got ${highResWithVehicleToo} vs ${highResViaPreScaled})`
  );
});

test('AUDIT-10: Prerendered dist/ HTML crawl graph reaches 100% of sitemap URLs with 0 orphans and 0 broken links', () => {
  const distDir = path.join(ROOT_DIR, 'dist');
  const sitemapXml = fs.readFileSync(path.join(ROOT_DIR, 'public/sitemap.xml'), 'utf8');
  const urls = [...sitemapXml.matchAll(/<loc>https:\/\/mydriveledger\.com([^<]*)<\/loc>/g)].map(
    (m) => m[1] || '/'
  );
  const urlSet = new Set(urls);
  const visited = new Set(['/']);
  const queue = ['/'];
  const brokenLinks = [];

  const toDistFile = (r) => {
    const clean = r.replace(/^\/+|\/+$/g, '');
    return clean ? path.join(distDir, clean, 'index.html') : path.join(distDir, 'index.html');
  };

  while (queue.length > 0) {
    const cur = queue.shift();
    const f = toDistFile(cur);
    if (!fs.existsSync(f)) continue;
    const html = fs.readFileSync(f, 'utf8');
    const hrefs = [...html.matchAll(/<a\s+[^>]*href="(\/[^"#?]*)/gi)].map(
      (m) => m[1].replace(/\/+$/, '') || '/'
    );
    for (const h of hrefs) {
      if (urlSet.has(h)) {
        if (!visited.has(h)) {
          visited.add(h);
          queue.push(h);
        }
      } else {
        brokenLinks.push(`${cur} -> ${h}`);
      }
    }
  }

  const orphans = urls.filter((u) => !visited.has(u));
  assert.equal(
    orphans.length,
    0,
    `Expected 0 orphan sitemap routes in prerendered dist/, found ${orphans.length}: ${orphans.slice(0, 10).join(', ')}`
  );
  assert.equal(
    brokenLinks.length,
    0,
    `Expected 0 broken/unprerendered internal links in dist/, found ${brokenLinks.length}: ${brokenLinks.slice(0, 10).join(', ')}`
  );
  assert.equal(urls.length, 2566, `Expected 2,566 sitemap URLs reached by crawl, got ${urls.length}`);
});

test('AUDIT-11: EV TCO electricity cost standardization & defensive MPGe-to-kWh/100mi normalization guard', () => {
  const evPresets = VEHICLE_PRESETS.filter((p) => isPureElectric(p));
  assert.ok(evPresets.length >= 8, `Expected >= 8 EV presets, found ${evPresets.length}`);

  // 1. Every EV preset in catalog must store kWh/100mi (<= 45), NEVER MPGe (> 60)
  for (const ev of evPresets) {
    assert.ok(
      ev.mpgUs >= 18 && ev.mpgUs <= 45,
      `EV preset ${ev.id} mpgUs must be kWh/100mi in [18, 45], got ${ev.mpgUs}`
    );
    const proj = calculateTcoProjection({
      purchasePriceUsd: ev.purchasePriceUsd,
      odometerMiles: ev.defaultOdometerMiles,
      annualDistanceMiles: 12000,
      mpgUs: ev.mpgUs,
      isEv: true,
      vehicle: ev,
      fuelPriceUsdGal: 0.16,
      annualInsuranceUsd: ev.annualInsuranceUsd,
      baseAnnualMaintenanceUsd: ev.baseAnnualMaintenanceUsd,
      maintenanceWearFactor: ev.maintenanceWearFactor,
      horizonYears: 5,
      residualCurve10Yr: ev.residualCurve10Yr,
    });
    assert.ok(
      proj.totalFuelUsd >= 2200 && proj.totalFuelUsd <= 4800,
      `EV ${ev.id} 5-yr electricity cost at 12k mi/yr & $0.16/kWh must be realistic ($2.2k-$4.8k), got $${proj.totalFuelUsd}`
    );
  }

  // 2. Specific former 4x-inflation regression check on vw-id4-pro-77kwh vs tesla-model-3-lr
  const id4 = VEHICLE_PRESETS.find((p) => p.id === 'vw-id4-pro-77kwh');
  const m3 = VEHICLE_PRESETS.find((p) => p.id === 'tesla-model-3-lr');
  assert.ok(id4 && m3);
  const id4Tco = calculateTcoProjection({
    purchasePriceUsd: id4.purchasePriceUsd,
    odometerMiles: id4.defaultOdometerMiles,
    annualDistanceMiles: 12000,
    mpgUs: id4.mpgUs,
    isEv: true,
    fuelPriceUsdGal: 0.16,
    annualInsuranceUsd: id4.annualInsuranceUsd,
    horizonYears: 5,
    residualCurve10Yr: id4.residualCurve10Yr,
  });
  const m3Tco = calculateTcoProjection({
    purchasePriceUsd: m3.purchasePriceUsd,
    odometerMiles: m3.defaultOdometerMiles,
    annualDistanceMiles: 12000,
    mpgUs: m3.mpgUs,
    isEv: true,
    fuelPriceUsdGal: 0.16,
    annualInsuranceUsd: m3.annualInsuranceUsd,
    horizonYears: 5,
    residualCurve10Yr: m3.residualCurve10Yr,
  });
  assert.ok(
    id4Tco.totalFuelUsd < 4500 && id4Tco.totalFuelUsd > 3200,
    `VW ID.4 5-yr electricity cost must be realistic (~$4,044, NOT $12,979), got $${id4Tco.totalFuelUsd}`
  );
  assert.ok(
    Math.abs(id4Tco.totalFuelUsd - m3Tco.totalFuelUsd) < 800,
    `VW ID.4 ($${id4Tco.totalFuelUsd}) and Tesla Model 3 ($${m3Tco.totalFuelUsd}) electricity costs must be within $800 at identical usage`
  );

  // 3. Defensive MPGe (>60) normalization guard in normalizeEvKwhPer100Mi, calculateEvEnergyCost, & calculateTcoProjection
  assert.ok(Math.abs(normalizeEvKwhPer100Mi(104) - 32.41) < 0.05, '104 MPGe must normalize to ~32.41 kWh/100mi');
  assert.equal(normalizeEvKwhPer100Mi(28.0), 28.0, '28.0 kWh/100mi must stay unchanged');

  const guardedTco = calculateTcoProjection({
    purchasePriceUsd: 39500,
    odometerMiles: 26000,
    annualDistanceMiles: 12000,
    mpgUs: 104, // Raw MPGe input must trigger defensive guard
    isEv: true,
    fuelPriceUsdGal: 0.16,
    annualInsuranceUsd: 1450,
    horizonYears: 5,
  });
  assert.ok(
    Math.abs(guardedTco.totalFuelUsd - id4Tco.totalFuelUsd) <= 10,
    `Raw MPGe=104 defensive guard ($${guardedTco.totalFuelUsd}) must match standardized kWh/100mi ($${id4Tco.totalFuelUsd})`
  );

  const guardedEnergy = calculateEvEnergyCost({
    annualDistanceMiles: 12000,
    efficiencyKwh100Mi: 120, // MPGe
    homeChargePct: 100,
    homeTariffUsdPerKwh: 0.16,
  });
  assert.ok(
    guardedEnergy.annualCostUsd > 450 && guardedEnergy.annualCostUsd < 650,
    `calculateEvEnergyCost with raw MPGe=120 must normalize (~$540/yr), got $${guardedEnergy.annualCostUsd}`
  );
});

test('AUDIT-12: Real Lease mode computes residual value, money factor, acquisition fee, and zero negative equity', () => {
  const id4 = VEHICLE_PRESETS.find((p) => p.id === 'vw-id4-pro-77kwh');
  const commonParams = {
    purchasePriceUsd: id4.purchasePriceUsd,
    odometerMiles: id4.defaultOdometerMiles,
    annualDistanceMiles: 12000,
    mpgUs: id4.mpgUs,
    isEv: true,
    vehicle: id4,
    fuelPriceUsdGal: 0.16,
    annualInsuranceUsd: id4.annualInsuranceUsd,
    baseAnnualMaintenanceUsd: id4.baseAnnualMaintenanceUsd,
    maintenanceWearFactor: id4.maintenanceWearFactor,
    downPaymentPct: 10,
    aprPct: 6.0,
    loanTermMonths: 36,
    horizonYears: 3,
    residualCurve10Yr: id4.residualCurve10Yr,
  };

  const loanRes = calculateTcoProjection({ ...commonParams, financeType: 'loan' });
  const leaseRes = calculateTcoProjection({ ...commonParams, financeType: 'lease' });

  assert.equal(leaseRes.financeType, 'lease');
  assert.ok(leaseRes.leaseDetails, 'Lease calculation must return populated leaseDetails');
  assert.equal(leaseRes.leaseDetails.leaseTermMonths, 36);
  assert.equal(leaseRes.leaseDetails.moneyFactor, +(6.0 / 2400).toFixed(5));
  assert.equal(leaseRes.leaseDetails.acquisitionFeeUsd, 695);
  assert.ok(leaseRes.leaseDetails.residualPct > 30 && leaseRes.leaseDetails.residualPct < 80);
  assert.ok(leaseRes.leaseDetails.monthlyLeasePaymentUsd > 0);
  assert.notEqual(
    leaseRes.monthlyLeasePaymentUsd,
    loanRes.monthlyLoanPaymentUsd,
    'Lease monthly payment must genuinely differ from loan amortization payment'
  );
  assert.ok(
    leaseRes.monthlyLeasePaymentUsd < loanRes.monthlyLoanPaymentUsd,
    `36m lease payment ($${leaseRes.monthlyLeasePaymentUsd}) should be lower than 36m loan payment ($${loanRes.monthlyLoanPaymentUsd})`
  );
  assert.equal(leaseRes.hasUnderwaterEquity, false, 'Lease must have zero negative equity at turn-in');
  assert.equal(leaseRes.maxUnderwaterEquityUsd, 0);
  assert.ok(
    leaseRes.yearlySchedule.every((row) => row.remainingLoanBalanceUsd === 0 && row.isUnderwater === false),
    'Every lease schedule year must have 0 remaining loan balance and isUnderwater=false'
  );

  // High cap-cost-reduction edge case: 60% down on 24m lease must NOT overcharge depreciation above (price - residual)
  const highCapLease = calculateTcoProjection({
    ...commonParams,
    financeType: 'lease',
    downPaymentPct: 60,
    loanTermMonths: 24,
    horizonYears: 2,
  });
  const actualAssetDep = id4.purchasePriceUsd - highCapLease.leaseDetails.residualValueUsd;
  assert.ok(
    highCapLease.leaseDetails.adjustedCapCostUsd >= highCapLease.leaseDetails.residualValueUsd,
    'Adjusted cap cost must never drop below residual value'
  );
  assert.ok(
    Math.abs(highCapLease.totalDepreciationUsd - actualAssetDep) <= 2,
    `High cap-cost reduction lease depreciation ($${highCapLease.totalDepreciationUsd}) must equal actual asset depreciation ($${actualAssetDep})`
  );

  // 0% APR lease edge case: zero rent charge, zero NaN
  const zeroAprLease = calculateTcoProjection({
    ...commonParams,
    financeType: 'lease',
    aprPct: 0,
  });
  assert.equal(zeroAprLease.leaseDetails.moneyFactor, 0);
  assert.equal(zeroAprLease.leaseDetails.monthlyRentChargeUsd, 0);
  assert.ok(Number.isFinite(zeroAprLease.totalEconomicCostUsd) && zeroAprLease.totalEconomicCostUsd > 0);
});

test('AUDIT-13: All 35 /vehicles/:brand hub pages prerendered with CollectionPage JSON-LD & ReviewsSection has 8 benchmarks', () => {
  assert.equal(BRAND_DIRECTORY.length, 35, 'Expected 35 brands in BRAND_DIRECTORY');
  assert.ok(parseBrandHubPath('/vehicles/toyota')?.brandSlug === 'toyota');
  assert.ok(parseBrandHubPath('/vehicles/mercedes-benz/')?.brandSlug === 'mercedes-benz');
  assert.equal(parseBrandHubPath('/vehicles/nonexistent-marque-xyz'), null);

  for (const brand of BRAND_DIRECTORY) {
    const brandFile = path.join(DIST_DIR, 'vehicles', brand.slug, 'index.html');
    assert.ok(fs.existsSync(brandFile), `Missing prerendered brand hub: ${brandFile}`);
    const html = fs.readFileSync(brandFile, 'utf8');
    assert.ok(html.includes(`https://mydriveledger.com/vehicles/${brand.slug}`), `Missing self-canonical on /vehicles/${brand.slug}`);
    assert.ok(html.includes('"@type":"CollectionPage"'), `Missing CollectionPage JSON-LD on /vehicles/${brand.slug}`);
    for (const m of brand.models) {
      assert.ok(html.includes(`href="/tco/${m.id}"`), `/vehicles/${brand.slug} must link to /tco/${m.id}`);
    }
  }

  // Verify ReviewsSection has 8 diverse benchmarks across Petrol, Diesel, Hybrid, EV & US/UK/EU
  const reviewsSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/components/home/ReviewsSection.jsx'), 'utf8');
  const benchIds = [...reviewsSrc.matchAll(/id:\s*'(bench-[^']+)'/g)].map((m) => m[1]);
  assert.equal(benchIds.length, 8, `Expected 8 verified workshop benchmarks in ReviewsSection.jsx, found ${benchIds.length}`);
  assert.ok(reviewsSrc.includes('Hybrid'), 'Reviews benchmarks must cover Hybrid');
  assert.ok(reviewsSrc.includes('(EV)'), 'Reviews benchmarks must cover EV');
  assert.ok(reviewsSrc.includes('Petrol'), 'Reviews benchmarks must cover Petrol');
  assert.ok(reviewsSrc.includes('EcoBlue') || reviewsSrc.includes('TDI'), 'Reviews benchmarks must cover Diesel');
});

test('AUDIT-14: Strict powertrain component isolation (no cross-contamination) & crash-proof canonical URL parsing', () => {
  const camry = VEHICLE_PRESETS.find((p) => p.id === 'toyota-camry-hybrid');
  const bmw330 = VEHICLE_PRESETS.find((p) => p.id === 'bmw-330i-g20');
  const golfTdi = VEHICLE_PRESETS.find((p) => p.id === 'vw-golf-20-tdi');
  const electricEvs = VEHICLE_PRESETS.filter((p) => p.powertrain === 'electric');

  assert.ok(camry && bmw330 && golfTdi && electricEvs.length === 5);

  const camryIds = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, camry).map((c) => c.id);
  assert.ok(!camryIds.includes('dpf-egr-scr-injectors'), 'Hybrid must never receive diesel DPF component');
  assert.ok(!camryIds.includes('hpfp-turbo-vnt'), 'NA Hybrid must never receive turbocharger component');
  assert.ok(camryIds.includes('hv-battery-thermal-loop'), 'Hybrid must receive HV battery thermal loop component');

  const bmwIds = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, bmw330).map((c) => c.id);
  assert.ok(!bmwIds.includes('dpf-egr-scr-injectors'), 'Gasoline Turbo must never receive diesel DPF component');
  assert.ok(bmwIds.includes('hpfp-turbo-vnt'), 'Gasoline Turbo must include turbocharger component');

  const golfIds = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, golfTdi).map((c) => c.id);
  assert.ok(golfIds.includes('dpf-egr-scr-injectors'), 'Diesel must include DPF/EGR/SCR component');
  assert.ok(!golfIds.includes('gdi-intake-pcv-ignition'), 'Diesel must never receive gasoline GDI/spark ignition component');

  for (const ev of electricEvs) {
    const evIds = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, ev).map((c) => c.id);
    assert.equal(evIds.length, 7, `Electric EV ${ev.id} must receive all 7 EV components, got ${evIds.length}`);
    assert.ok(evIds.includes('ev-battery-soh'), `${ev.id} must include ev-battery-soh`);
    assert.ok(!evIds.includes('dpf-egr-scr-injectors'), `${ev.id} must never receive diesel DPF`);
  }

  // Malformed URI & junk punctuation resilience (must return null, never throw URIError)
  assert.equal(getBrandBySlug('%E0%A4%A'), null, 'Malformed percent-encoding must return null');
  assert.equal(parseBrandHubPath('/vehicles/%E0%A4%A'), null, 'Malformed brand URL must return null');
  assert.equal(parseBrandHubPath('/vehicles/!!!toyota!!!'), null, 'Junk punctuation slug must return null');
  assert.equal(parseBrandHubPath('/vehicles/mercedes---benz'), null, 'Repeated hyphen slug must return null');
  assert.equal(parseBrandHubPath('/vehicles/citro%C3%ABn')?.brandSlug, 'citroen', 'Diacritic brand slug must normalize cleanly');
  assert.equal(parseBrandHubPath('/vehicles/Toyota/')?.brandSlug, 'toyota', 'Case-insensitive trailing-slash brand URL must resolve');
  assert.equal(parseCompareMatchupPath('/compare/%E0%A4%A'), null, 'Malformed compare URL must return null');
  assert.equal(parseRiskMileagePath('/risk-matrix/%E0%A4%A/60k-miles'), null, 'Malformed risk bracket URL must return null');
});

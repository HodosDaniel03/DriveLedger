import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transpileJsx } from '../scripts/jsx-loader.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Register JSX transpilation hook for Node v24 test runner
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      const candidateBase = path.resolve(parentDir, specifier);
      for (const ext of ['', '.js', '.jsx', '/index.js', '/index.jsx']) {
        const full = candidateBase + ext;
        if (fs.existsSync(full) && fs.statSync(full).isFile()) {
          return { url: pathToFileURL(full).href, shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith('.jsx')) {
      const filePath = fileURLToPath(url);
      const raw = fs.readFileSync(filePath, 'utf8');
      const transpiled = transpileJsx(raw);
      return { format: 'module', source: transpiled, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

import {
  REGIONAL_PARTNER_URLS,
  resolveRegionalPartnerOffer,
} from '../src/data/affiliatePartners.js';
import {
  estimateMileageAdjustedMarketValue,
  evaluateMarketPriceDeal,
  evaluateFixOrSellDecision,
  generateNegotiationBattlecard,
} from '../src/data/fixOrSellEngine.js';

const {
  parseGarageParam,
  mergeGarageVehicles,
  extractGarageParamFromUrl,
  getShareableGarageUrl,
} = await import('../src/context/GarageContext.jsx');
import {
  isObdCompatibleWithVehicle,
  generateFullVehicleObdMatrix,
  PROGRAMMATIC_COMPARE_PAIRS,
  MILEAGE_BRACKET_SLUGS,
  parseCompareMatchupPath,
  parseRiskMileagePath,
} from '../src/data/seoMatrixData.js';
import { generateSitemapXml } from '../scripts/generate-sitemap-seo.mjs';
import { VEHICLE_PRESETS, getPresetById } from '../src/data/vehiclePresets.js';
import { OBD_CODES } from '../src/data/obdCodes.js';

// ============================================================================
// PRIORITY 1: DYNAMIC NUMBER-DRIVEN AFFILIATE & GEO-ROUTING ENGINE
// ============================================================================

test('1. resolveRegionalPartnerOffer: Geo-routes VIN, OBD2, Warranty, and Insurance across US, UK, EU', () => {
  const usVin = resolveRegionalPartnerOffer({
    type: 'vin-check',
    region: 'US',
    vehicleName: 'BMW 330i (G20)',
    purchasePriceUsd: 31500,
    odometerMiles: 64000,
    serviceReserveUsd: 1850,
  });
  assert.equal(usVin.href, REGIONAL_PARTNER_URLS['vin-check'].US.href);
  assert.ok(usVin.title.includes('Check odometer rollbacks & salvage records'));
  assert.equal(usVin.ctaText, 'Run Instant VIN Check');
  assert.ok(usVin.features.includes('Odometer Rollback Detection'));

  const ukVin = resolveRegionalPartnerOffer({
    type: 'vin-check',
    region: 'UK',
    vehicleName: 'Ford Focus 2.0 EcoBlue',
    purchasePriceUsd: 16500,
    odometerMiles: 82000,
    formatCurrency: (v) => `£${Math.round(v * 0.79).toLocaleString('en-GB')}`,
    formatDistance: (m) => `${Math.round(m).toLocaleString('en-GB')} mi`,
  });
  assert.equal(
    ukVin.href,
    'https://www.carvertical.deal/4CMF46B/5NWWWN/?source_id=AFF&sub1=mydriveledger&sub2=regional_uk'
  );
  assert.ok(ukVin.partnerName.includes('carVertical UK'));
  assert.ok(ukVin.title.includes('£'));

  const euObd = resolveRegionalPartnerOffer({
    type: 'obd-scanner',
    region: 'EU',
    activeCode: 'P2002',
    activeCodeTitle: 'Diesel Particulate Filter Efficiency',
    cheapestCauseUsd: 95,
    costliestCauseUsd: 2600,
    cheapCauseProbPct: 48,
    formatCurrency: (v) => `€${Math.round(v * 0.92).toLocaleString('en-US')}`,
  });
  assert.equal(euObd.href, 'https://www.amazon.de/s?k=bluetooth+obd2+scanner');
  assert.equal(euObd.ctaText, 'Get Recommended OBD2 Scanner');
  assert.ok(euObd.features.includes('iOS & Android Bluetooth'));
  assert.ok(euObd.description.includes('48%'), 'Must surface cheap sensor root-cause probability');

  const usObd = resolveRegionalPartnerOffer({
    type: 'obd-scanner',
    region: 'US',
    activeCode: 'P0420',
  });
  assert.ok(usObd.title.includes("Don't pay $150+ in workshop diagnostic fees"));

  const ukWarranty = resolveRegionalPartnerOffer({
    type: 'warranty',
    region: 'UK',
    vehicleName: 'BMW 320d',
    serviceReserveUsd: 2100,
  });
  assert.equal(ukWarranty.href, 'https://www.motoreasy.com/');
  assert.equal(ukWarranty.ctaText, 'Compare Warranty Plans');

  const euIns = resolveRegionalPartnerOffer({
    type: 'insurance-finance',
    region: 'EU',
    vehicleName: 'VW Golf 2.0 TDI',
    insuranceAndInterest5YrUsd: 11200,
    insuranceSharePct: 28,
  });
  assert.equal(euIns.href, 'https://www.check24.de/kfz-versicherung/');
  assert.ok(euIns.description.includes('28%'));
});

// ============================================================================
// PRIORITY 2: "FIX IT OR SELL IT?" 4-FACTOR DECISION ENGINE & MARKET DEAL BADGE
// ============================================================================

test('2. evaluateMarketPriceDeal: Classifies Good Deal, Fair Benchmark, and Overpriced Listings', () => {
  const camry = getPresetById('toyota-camry-hybrid');
  const fairVal = estimateMileageAdjustedMarketValue(camry, camry.defaultOdometerMiles);
  assert.equal(fairVal, camry.purchasePriceUsd, 'At default odometer, benchmark equals preset price');

  const goodDeal = evaluateMarketPriceDeal(camry, Math.round(fairVal * 0.88), camry.defaultOdometerMiles);
  assert.equal(goodDeal.tier, 'good-deal');
  assert.ok(goodDeal.label.includes('Below Market'));

  const fairDeal = evaluateMarketPriceDeal(camry, fairVal, camry.defaultOdometerMiles);
  assert.equal(fairDeal.tier, 'fair');

  const overpriced = evaluateMarketPriceDeal(camry, Math.round(fairVal * 1.15), camry.defaultOdometerMiles);
  assert.equal(overpriced.tier, 'overpriced');
  assert.ok(overpriced.label.includes('Above Market'));
});

test('3. evaluateFixOrSellDecision: Produces FIX_AND_KEEP, FIX_AND_SELL, and SELL_AS_IS Verdicts Without NaN', () => {
  const camry = getPresetById('toyota-camry-hybrid');
  const focus = getPresetById('ford-focus-ecoblue');
  const tesla = getPresetById('tesla-model-3-lr');

  // Case A: Modest $950 repair on $26,000 low-mileage Camry -> FIX_AND_KEEP
  const keepRes = evaluateFixOrSellDecision({
    vehicle: camry,
    repairQuoteUsd: 950,
    currentMarketValueUsd: 26000,
    odometerMiles: 42000,
  });
  assert.equal(keepRes.verdict, 'FIX_AND_KEEP');
  assert.ok(keepRes.rvrPct < 10);
  assert.ok(Number.isFinite(keepRes.net12MoAdvantageKeepUsd));

  // Case B: Moderate $2,600 repair on higher-mileage Focus where fixing restores broken-car discount -> FIX_AND_SELL
  const fixSellRes = evaluateFixOrSellDecision({
    vehicle: focus,
    repairQuoteUsd: 2600,
    currentMarketValueUsd: 6800,
    brokenAsIsValueUsd: 3500,
    odometerMiles: 125000,
  });
  assert.equal(fixSellRes.verdict, 'FIX_AND_SELL');
  assert.equal(fixSellRes.netEquityGainUsd, 700);

  // Case C: Catastrophic $6,800 repair on $5,500 high-mileage car -> SELL_AS_IS
  const sellAsIsRes = evaluateFixOrSellDecision({
    vehicle: focus,
    repairQuoteUsd: 6800,
    currentMarketValueUsd: 5500,
    odometerMiles: 185000,
  });
  assert.equal(sellAsIsRes.verdict, 'SELL_AS_IS');
  assert.ok(sellAsIsRes.rvr > 1.0);

  // Case D: Pure EV boundary & extreme zero/negative safety
  const evExtreme = evaluateFixOrSellDecision({
    vehicle: tesla,
    repairQuoteUsd: -50,
    currentMarketValueUsd: 0,
    odometerMiles: 500000,
  });
  assert.ok(['FIX_AND_KEEP', 'FIX_AND_SELL', 'SELL_AS_IS'].includes(evExtreme.verdict));
  assert.ok(Number.isFinite(evExtreme.rvr));
  assert.ok(!Number.isNaN(evExtreme.cascadingExposureUsd));
});

// ============================================================================
// PRIORITY 3: PROGRAMMATIC SEO TURBO (4,500+ POWERTRAIN-VALIDATED ROUTES)
// ============================================================================

test('4. isObdCompatibleWithVehicle & generateFullVehicleObdMatrix: Strictly Blocks ICE/DPF Codes on Pure EVs', () => {
  const tesla = getPresetById('tesla-model-3-lr');
  const focusDiesel = getPresetById('ford-focus-ecoblue');

  assert.equal(isObdCompatibleWithVehicle(tesla, 'P2002'), false, 'EV must never match DPF code P2002');
  assert.equal(isObdCompatibleWithVehicle(tesla, 'P0420'), false, 'EV must never match Catalytic Converter P0420');
  assert.equal(isObdCompatibleWithVehicle(tesla, 'P0299'), false, 'EV must never match Turbo Underboost P0299');
  assert.equal(isObdCompatibleWithVehicle(tesla, 'P0A80'), true, 'EV must match HV Battery Pack P0A80');
  assert.equal(isObdCompatibleWithVehicle(tesla, 'U0100'), true, 'EV must match CAN-Bus U0100');

  assert.equal(isObdCompatibleWithVehicle(focusDiesel, 'P2002'), true, 'Diesel must match DPF P2002');
  assert.equal(isObdCompatibleWithVehicle(focusDiesel, 'P0455'), false, 'Diesel must not match petrol EVAP P0455');
  assert.equal(isObdCompatibleWithVehicle(focusDiesel, 'P0A80'), false, 'Pure ICE Diesel must not match HV Battery P0A80');

  const fullMatrix = generateFullVehicleObdMatrix();
  assert.ok(fullMatrix.length >= 2500, `Expected >=2,500 powertrain-safe Vehicle x OBD routes, got ${fullMatrix.length}`);

  const evIds = new Set(VEHICLE_PRESETS.filter((p) => p.isEv).map((p) => p.id));
  for (const entry of fullMatrix) {
    if (evIds.has(entry.presetId)) {
      assert.ok(
        ['U0100', 'P0A80', 'P0128'].includes(entry.code),
        `Pure EV ${entry.presetId} leaked incompatible ICE code ${entry.code}`
      );
    }
  }
});

test('5. parseCompareMatchupPath & parseRiskMileagePath: Resolve Clean SEO URLs Deterministically', () => {
  assert.ok(PROGRAMMATIC_COMPARE_PAIRS.length >= 600, `Expected >=600 head-to-head pairs, got ${PROGRAMMATIC_COMPARE_PAIRS.length}`);

  const parsedCompare = parseCompareMatchupPath('/compare/bmw-330i-g20-vs-tesla-model-3-lr');
  assert.deepEqual(parsedCompare, {
    tab: 'compare',
    presetA: 'bmw-330i-g20',
    presetB: 'tesla-model-3-lr',
    slug: 'bmw-330i-g20-vs-tesla-model-3-lr',
  });
  assert.equal(parseCompareMatchupPath('/compare/invalid-car-vs-tesla-model-3-lr'), null);
  assert.equal(parseCompareMatchupPath('/compare/tesla-model-3-lr-vs-tesla-model-3-lr'), null);

  const parsedRisk = parseRiskMileagePath('/risk-matrix/ford-focus-ecoblue/100k-miles');
  assert.ok(parsedRisk);
  assert.equal(parsedRisk.tab, 'risk');
  assert.equal(parsedRisk.preset, 'ford-focus-ecoblue');
  assert.equal(parsedRisk.odometerMiles, 100000);
  assert.equal(parseRiskMileagePath('/risk-matrix/ford-focus-ecoblue/999k-miles'), null);
  assert.equal(Object.keys(MILEAGE_BRACKET_SLUGS).length, 3);
});

test('6. generateSitemapXml: Scales Cleanly to 2,566 Prerendered Indexable Canonical URLs With Zero EV/DPF Pollution', () => {
  const { xml, count } = generateSitemapXml();
  assert.equal(count, 2566, `Expected exactly 2,566 canonical sitemap URLs, got ${count}`);
  assert.ok(xml.includes('<loc>https://mydriveledger.com/vehicles</loc>'), 'Sitemap must include /vehicles HTML catalog');
  assert.ok(xml.includes('<loc>https://mydriveledger.com/vehicles/toyota</loc>'), 'Sitemap must include /vehicles/toyota brand hub');
  assert.ok(xml.includes('<loc>https://mydriveledger.com/vehicles/bmw</loc>'), 'Sitemap must include /vehicles/bmw brand hub');
  assert.ok(xml.includes('<loc>https://mydriveledger.com/guides/used-bmw-3-series-buying-checklist</loc>'));
  assert.ok(xml.includes('<loc>https://mydriveledger.com/compare/bmw-330i-g20-vs-tesla-model-3-lr</loc>'));
  assert.ok(xml.includes('<loc>https://mydriveledger.com/risk-matrix/ford-focus-ecoblue/100k-miles</loc>'));
  assert.ok(!xml.includes('/obd/tesla-model-3-lr/p2002</loc>'), 'Sitemap must never emit EV + DPF P2002 URL');
  assert.ok(xml.includes('/obd/tesla-model-3-lr/p0a80</loc>'), 'Sitemap must emit EV + HV Battery P0A80 URL');
});

// ============================================================================
// PHASE 5 FEATURES: BUYER NEGOTIATION BATTLECARD, SHAREABLE GARAGE & CONTACT DISPATCH
// ============================================================================

test('7. generateNegotiationBattlecard: Computes Target Offer, Deducts Maint Leverage, & Builds Persuasive Seller Script', () => {
  const golf = getPresetById('vw-golf-20-tdi');
  assert.ok(golf, 'Golf preset must exist');

  // Case A: Overpriced listing ($31,000 asking vs ~24,800 fair value)
  const overpricedCard = generateNegotiationBattlecard({
    vehicle: golf,
    purchasePriceUsd: 31000,
    odometerMiles: golf.defaultOdometerMiles,
    tco: {
      yearlySchedule: [
        { yearMaintenanceUsd: 1200, yearDepreciationUsd: 3800 },
      ],
    },
  });

  assert.equal(overpricedCard.dealEvaluation.tier, 'overpriced');
  assert.equal(overpricedCard.fairValueUsd, golf.purchasePriceUsd);
  // Deduction: 50% of upcoming maintenance ($600) subtracted from fair value ($24,800) -> $24,200
  assert.ok(overpricedCard.targetOfferPriceUsd <= overpricedCard.fairValueUsd);
  assert.ok(overpricedCard.targetOfferPriceUsd >= Math.round(31000 * 0.75));
  assert.equal(overpricedCard.targetOfferPriceUsd % 50, 0, 'Target offer rounded to nearest $50');
  assert.ok(overpricedCard.potentialSavingsUsd > 0);
  assert.equal(overpricedCard.upcomingMaintenanceUsd, 1200);
  assert.equal(overpricedCard.year1DepreciationUsd, 3800);

  // Script contents check
  const scriptA = overpricedCard.sellerScript;
  assert.ok(scriptA.includes('VW Golf 2.0 TDI') || scriptA.includes('Volkswagen Golf') || scriptA.includes(golf.name));
  assert.ok(scriptA.includes('fair market benchmark'));
  assert.ok(scriptA.includes('approaching its'));
  assert.ok(scriptA.includes('first-year scheduled maintenance'));
  assert.ok(scriptA.includes('serious, verified buyer'));

  // Case B: Fair / Good deal listing ($20,000 asking on $24,800 fair value)
  const fairCard = generateNegotiationBattlecard({
    vehicle: golf,
    purchasePriceUsd: 20000,
    odometerMiles: golf.defaultOdometerMiles,
    tco: {
      yearlySchedule: [
        { yearMaintenanceUsd: 1000, yearDepreciationUsd: 2500 },
      ],
    },
  });

  assert.equal(fairCard.dealEvaluation.tier, 'good-deal');
  // Deduction: 30% of upcoming maintenance ($300) subtracted from asking price ($20,000) -> $19,700
  assert.ok(fairCard.targetOfferPriceUsd <= 20000);
  assert.ok(fairCard.targetOfferPriceUsd >= 15000);
  assert.equal(fairCard.targetOfferPriceUsd % 50, 0);
  assert.ok(fairCard.potentialSavingsUsd > 0);
});

test('8. generateNegotiationBattlecard EV Isolation: Guarantees 0 ICE Contamination for Electric Vehicles', () => {
  const teslaM3 = getPresetById('tesla-model-3-lr');
  assert.ok(teslaM3.isEv, 'Tesla Model 3 must be recognized as EV');

  const evBattlecard = generateNegotiationBattlecard({
    vehicle: teslaM3,
    purchasePriceUsd: 38000,
    odometerMiles: 48000,
  });

  assert.ok(evBattlecard.upcomingServiceItems.length > 0, 'EV must have scheduled service milestones');
  const iceKeywords = [
    'spark plug',
    'engine oil',
    'oil filter',
    'timing belt',
    'water pump',
    'dpf',
    'exhaust',
    'fuel filter',
    'pcv',
    'transmission fluid',
    'alternator',
  ];

  for (const item of evBattlecard.upcomingServiceItems) {
    const lower = item.toLowerCase();
    for (const kw of iceKeywords) {
      assert.ok(
        !lower.includes(kw),
        `EV scheduled service leaked ICE item "${item}" matching keyword "${kw}"`
      );
    }
  }

  // Also verify sellerScript has 0 ICE contamination
  const scriptLower = evBattlecard.sellerScript.toLowerCase();
  for (const kw of ['timing belt', 'engine oil & filter', 'dpf ash', 'spark plugs']) {
    assert.ok(
      !scriptLower.includes(kw),
      `EV sellerScript leaked combustion maintenance term: ${kw}`
    );
  }
});

test('9. R2: Garage URL Parameter Parsing, Merging & Shareable URL Generation (?garage=...)', () => {
  // Test 9.1: parseGarageParam
  const rawQuery = 'vw-golf-20-tdi:24800:48000,bmw-320d-b47:27500:55000,unknown-car-fake:99999:99999';
  const parsed = parseGarageParam(rawQuery);

  assert.equal(parsed.length, 2, 'Must extract exactly 2 valid preset vehicles and discard invalid preset');
  assert.equal(parsed[0].presetId, 'vw-golf-20-tdi');
  assert.equal(parsed[0].purchasePriceUsd, 24800);
  assert.equal(parsed[0].odometerMiles, 48000);
  assert.equal(parsed[1].presetId, 'bmw-320d-b47');
  assert.equal(parsed[1].purchasePriceUsd, 27500);
  assert.equal(parsed[1].odometerMiles, 55000);

  // Test 9.2: Default price & odometer fallback when omitted
  const minimalQuery = 'toyota-corolla-18-hybrid';
  const parsedMinimal = parseGarageParam(minimalQuery);
  assert.equal(parsedMinimal.length, 1);
  const corollaPreset = getPresetById('toyota-corolla-18-hybrid');
  assert.equal(parsedMinimal[0].purchasePriceUsd, corollaPreset.purchasePriceUsd);
  assert.equal(parsedMinimal[0].odometerMiles, corollaPreset.defaultOdometerMiles);

  // Test 9.3: Deduplication in incoming query
  const dupQuery = 'vw-golf-20-tdi:24000:40000,vw-golf-20-tdi:25000:50000';
  const parsedDup = parseGarageParam(dupQuery);
  assert.equal(parsedDup.length, 1, 'Duplicate preset in URL must be deduplicated to first instance');
  assert.equal(parsedDup[0].purchasePriceUsd, 24000);

  // Test 9.4: mergeGarageVehicles
  const existing = [
    { presetId: 'vw-golf-20-tdi', name: 'Golf TDI', purchasePriceUsd: 22000, odometerMiles: 60000, completedCount: 3 },
  ];
  const incoming = [
    { presetId: 'vw-golf-20-tdi', purchasePriceUsd: 24800, odometerMiles: 48000 },
    { presetId: 'bmw-320d-b47', name: 'BMW 320d', purchasePriceUsd: 27500, odometerMiles: 55000, completedCount: 0 },
  ];
  const merged = mergeGarageVehicles(existing, incoming);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].presetId, 'vw-golf-20-tdi');
  assert.equal(merged[0].purchasePriceUsd, 24800, 'Price updated from URL');
  assert.equal(merged[0].odometerMiles, 48000, 'Odometer updated from URL');
  assert.equal(merged[0].completedCount, 3, 'Completed count preserved on merge');
  assert.equal(merged[1].presetId, 'bmw-320d-b47');

  // Test 9.5: extractGarageParamFromUrl
  const urlWithParam = 'https://mydriveledger.com/compare?garage=vw-golf-20-tdi:24800:48000,bmw-320d-b47:27500:55000#section';
  assert.equal(
    extractGarageParamFromUrl(urlWithParam),
    'vw-golf-20-tdi:24800:48000,bmw-320d-b47:27500:55000'
  );
  assert.equal(extractGarageParamFromUrl('https://mydriveledger.com/'), null);

  // Test 9.6: getShareableGarageUrl
  const shareableUrl = getShareableGarageUrl(merged, 'https://mydriveledger.com/');
  assert.ok(shareableUrl.startsWith('https://mydriveledger.com/?garage='));
  assert.ok(shareableUrl.includes('vw-golf-20-tdi:24800:48000'));
  assert.ok(shareableUrl.includes('bmw-320d-b47:27500:55000'));

  const emptyShareableUrl = getShareableGarageUrl([], 'https://mydriveledger.com/');
  assert.equal(emptyShareableUrl, 'https://mydriveledger.com/');
});

test('10. R1/R2/R3 UI & Component Source Invariants Verification', () => {
  // Verify ContactPage (R3)
  const contactPath = path.resolve(ROOT_DIR, 'src', 'pages', 'ContactPage.jsx');
  const contactSrc = fs.readFileSync(contactPath, 'utf8');

  assert.ok(contactSrc.includes('Copy Formatted Inquiry'), 'ContactPage must render "Copy Formatted Inquiry" button');
  assert.ok(contactSrc.includes('Send via Email App'), 'ContactPage must render "Send via Email App" button');
  assert.ok(contactSrc.includes('Inquiry Copied!'), 'ContactPage must support copied confirmation state');
  assert.ok(contactSrc.includes('contact@mydriveledger.com'), 'ContactPage must target contact@mydriveledger.com');
  assert.ok(contactSrc.includes('copiedInquiry'), 'ContactPage must manage copied state');

  // Verify TcoCalculator (R1)
  const tcoPath = path.resolve(ROOT_DIR, 'src', 'components', 'calculators', 'TcoCalculator.jsx');
  const tcoSrc = fs.readFileSync(tcoPath, 'utf8');

  assert.ok(tcoSrc.includes('data-testid="negotiation-battlecard-toggle"'), 'TcoCalculator must render battlecard toggle button');
  assert.ok(tcoSrc.includes('data-testid="negotiation-battlecard-section"'), 'TcoCalculator must render battlecard section');
  assert.ok(tcoSrc.includes('data-testid="target-offer-price"'), 'TcoCalculator must render target offer price');
  assert.ok(tcoSrc.includes('data-testid="copy-seller-script-btn"'), 'TcoCalculator must render copy script button');
  assert.ok(tcoSrc.includes('data-testid="seller-script-preview"'), 'TcoCalculator must render script preview');
  assert.ok(tcoSrc.includes('Message Copied!'), 'TcoCalculator must display "Message Copied!" confirmation');
  assert.ok(tcoSrc.includes('generateNegotiationBattlecard'), 'TcoCalculator must use generateNegotiationBattlecard');

  // Verify Navbar (R2)
  const navbarPath = path.resolve(ROOT_DIR, 'src', 'components', 'layout', 'Navbar.jsx');
  const navbarSrc = fs.readFileSync(navbarPath, 'utf8');

  assert.ok(navbarSrc.includes('data-testid="copy-shareable-garage-link-button"'), 'Navbar must render copy shareable garage link button');
  assert.ok(navbarSrc.includes('Copy Shareable Garage Link'), 'Navbar must have "Copy Shareable Garage Link" label');
  assert.ok(navbarSrc.includes('Link Copied!'), 'Navbar must display "Link Copied!" state');
  assert.ok(navbarSrc.includes('getShareableGarageUrl'), 'Navbar must invoke getShareableGarageUrl');
});

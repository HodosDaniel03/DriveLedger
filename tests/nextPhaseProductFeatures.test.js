import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REGIONAL_PARTNER_URLS,
  resolveRegionalPartnerOffer,
} from '../src/data/affiliatePartners.js';
import {
  estimateMileageAdjustedMarketValue,
  evaluateMarketPriceDeal,
  evaluateFixOrSellDecision,
} from '../src/data/fixOrSellEngine.js';
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
  assert.equal(ukVin.href, 'https://www.carvertical.com/gb');
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

test('6. generateSitemapXml: Scales Cleanly Beyond 4,500 Unique Programmatic URLs With Zero EV/DPF Pollution', () => {
  const { xml, count } = generateSitemapXml();
  assert.ok(count >= 4500, `Expected >=4,500 sitemap URLs, got ${count}`);
  assert.ok(xml.includes('<loc>https://mydriveledger.com/compare/bmw-330i-g20-vs-tesla-model-3-lr</loc>'));
  assert.ok(xml.includes('<loc>https://mydriveledger.com/risk-matrix/ford-focus-ecoblue/100k-miles</loc>'));
  assert.ok(!xml.includes('/obd/tesla-model-3-lr/p2002</loc>'), 'Sitemap must never emit EV + DPF P2002 URL');
  assert.ok(xml.includes('/obd/tesla-model-3-lr/p0a80</loc>'), 'Sitemap must emit EV + HV Battery P0A80 URL');
});

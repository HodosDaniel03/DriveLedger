import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { transpileJsx } from '../scripts/jsx-loader.mjs';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      const candidateBase = path.resolve(parentDir, specifier);
      for (const ext of ['', '.js', '.jsx', '/index.js', '/index.jsx', '.ts']) {
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
      return { format: 'module', source: transpileJsx(raw), shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

import {
  getCarVerticalUrl,
  CARVERTICAL_AFFILIATE_URL,
  CARVERTICAL_DIRECT_VIN_TEMPLATE,
  CARVERTICAL_DISCOUNT_CODE,
  CARVERTICAL_DISCOUNT_PERCENT,
  CARVERTICAL_LEGAL_ATTRIBUTION,
  affiliatePartners,
  buildAffiliateUrl,
  MONETIZATION_CONFIG,
} from '../src/config/monetizationConfig.js';
import { REGIONAL_PARTNER_URLS } from '../src/data/affiliatePartners.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

test('carVertical: Official static logo assets exist in public/', () => {
  const blueLogo = path.join(projectRoot, 'public', 'carVertical logo in blue.png');
  const standardizedLogo = path.join(projectRoot, 'public', 'carvertical-logo.png');

  assert.ok(fs.existsSync(blueLogo), 'Original blue logo must exist in public/');
  assert.ok(fs.existsSync(standardizedLogo), 'Standardized logo /carvertical-logo.png must exist in public/');

  const stats = fs.statSync(standardizedLogo);
  assert.ok(stats.size > 1000, 'Logo file must be a non-empty image asset');
});

test('carVertical: Constants and Everflow configuration in monetizationConfig.js', () => {
  assert.equal(
    CARVERTICAL_AFFILIATE_URL,
    'https://www.carvertical.deal/4CMF46B/5NWWWN/?source_id=AFF&sub1=mydriveledger'
  );
  assert.equal(
    CARVERTICAL_DIRECT_VIN_TEMPLATE,
    'https://www.carvertical.deal/4CMF46B/5NWWWN/?uid=40&source_id=AFF&sub1=mydriveledger&sub3={VIN}'
  );
  assert.equal(CARVERTICAL_DISCOUNT_CODE, 'mydriveledger');
  assert.equal(CARVERTICAL_DISCOUNT_PERCENT, 20);
  assert.equal(
    CARVERTICAL_LEGAL_ATTRIBUTION,
    'Vehicle history check services are provided and sold by carVertical. All intellectual property rights are owned by carVertical.'
  );

  assert.equal(affiliatePartners.vinCheck.baseUrl, CARVERTICAL_AFFILIATE_URL);
  assert.equal(affiliatePartners.vinCheck.affiliateParam, undefined);
  assert.equal(affiliatePartners.vinCheck.discountCode, 'mydriveledger');
  assert.equal(affiliatePartners.vinCheck.discountPercent, 20);
  assert.equal(affiliatePartners.vinCheck.legalAttribution, CARVERTICAL_LEGAL_ATTRIBUTION);
  assert.equal(MONETIZATION_CONFIG.carVerticalAttribution, CARVERTICAL_LEGAL_ATTRIBUTION);
  assert.equal(MONETIZATION_CONFIG.carVertical.discountCode, 'mydriveledger');

  assert.equal(
    buildAffiliateUrl('vinCheck').href,
    'https://www.carvertical.deal/4CMF46B/5NWWWN/?source_id=AFF&sub1=mydriveledger&sub2=partner-slot'
  );
  assert.equal(
    buildAffiliateUrl('vinCheck', { vin: 'WAUZZZ8V1KA123456', placement: 'ad-unit' }).href,
    'https://www.carvertical.deal/4CMF46B/5NWWWN/?uid=40&source_id=AFF&sub1=mydriveledger&sub2=ad-unit&sub3=WAUZZZ8V1KA123456'
  );

  assert.equal(
    REGIONAL_PARTNER_URLS['vin-check'].US.href,
    'https://www.carvertical.deal/4CMF46B/5NWWWN/?source_id=AFF&sub1=mydriveledger&sub2=regional_us'
  );
  assert.equal(
    REGIONAL_PARTNER_URLS['vin-check'].UK.href,
    'https://www.carvertical.deal/4CMF46B/5NWWWN/?source_id=AFF&sub1=mydriveledger&sub2=regional_uk'
  );
  assert.equal(
    REGIONAL_PARTNER_URLS['vin-check'].EU.href,
    'https://www.carvertical.deal/4CMF46B/5NWWWN/?source_id=AFF&sub1=mydriveledger&sub2=regional_eu'
  );
});

test('carVertical: getCarVerticalUrl helper generates compliant tracking URLs', () => {
  // Empty VIN / License plate defaults
  const emptyUrl = getCarVerticalUrl();
  assert.equal(
    emptyUrl,
    'https://www.carvertical.deal/4CMF46B/5NWWWN/?source_id=AFF&sub1=mydriveledger&sub2=general'
  );

  const emptyTcoUrl = getCarVerticalUrl('', 'tco');
  assert.equal(
    emptyTcoUrl,
    'https://www.carvertical.deal/4CMF46B/5NWWWN/?source_id=AFF&sub1=mydriveledger&sub2=tco'
  );

  // Non-empty VIN trims whitespace and converts to uppercase
  const vinUrl = getCarVerticalUrl('  wauzzz8v1ka123456  ', 'tco');
  assert.equal(
    vinUrl,
    'https://www.carvertical.deal/4CMF46B/5NWWWN/?uid=40&source_id=AFF&sub1=mydriveledger&sub2=tco&sub3=WAUZZZ8V1KA123456'
  );

  // License plate with spaces / symbols
  const plateUrl = getCarVerticalUrl('B 123 ABC', 'ppi');
  assert.equal(
    plateUrl,
    'https://www.carvertical.deal/4CMF46B/5NWWWN/?uid=40&source_id=AFF&sub1=mydriveledger&sub2=ppi&sub3=B%20123%20ABC'
  );

  // Special placement encoding
  const guideUrl = getCarVerticalUrl('WVWZZZ3CZWE123456', 'buyer guide / ppi');
  assert.ok(guideUrl.includes('sub2=buyer%20guide%20%2F%20ppi'));
  assert.ok(guideUrl.includes('sub3=WVWZZZ3CZWE123456'));
  assert.ok(guideUrl.includes('uid=40'));

  // Edge cases: null, undefined, numeric, whitespace placement
  assert.equal(
    getCarVerticalUrl(null, 'test'),
    'https://www.carvertical.deal/4CMF46B/5NWWWN/?source_id=AFF&sub1=mydriveledger&sub2=test'
  );
  assert.equal(
    getCarVerticalUrl(undefined),
    'https://www.carvertical.deal/4CMF46B/5NWWWN/?source_id=AFF&sub1=mydriveledger&sub2=general'
  );
  assert.equal(
    getCarVerticalUrl('WAUZZZ8V1KA123456', '   '),
    'https://www.carvertical.deal/4CMF46B/5NWWWN/?uid=40&source_id=AFF&sub1=mydriveledger&sub2=general&sub3=WAUZZZ8V1KA123456'
  );
  assert.equal(
    getCarVerticalUrl('', '   '),
    'https://www.carvertical.deal/4CMF46B/5NWWWN/?source_id=AFF&sub1=mydriveledger&sub2=general'
  );
});

test('carVertical: Placements across TCO, PPI, Comparator, and Guides have VinCheckBanner wired', () => {
  const tcoContent = fs.readFileSync(path.join(projectRoot, 'src/components/calculators/TcoCalculator.jsx'), 'utf8');
  assert.ok(tcoContent.includes('VinCheckBanner'), 'TcoCalculator must import and use VinCheckBanner');
  assert.ok(tcoContent.includes('placement="tco"'), 'TcoCalculator must specify placement="tco"');

  const ppiContent = fs.readFileSync(path.join(projectRoot, 'src/components/home/PreInspectionChecklist.jsx'), 'utf8');
  assert.ok(ppiContent.includes('VinCheckBanner'), 'PreInspectionChecklist must import and use VinCheckBanner');
  assert.ok(ppiContent.includes('placement="ppi"'), 'PreInspectionChecklist must specify placement="ppi"');

  const compContent = fs.readFileSync(path.join(projectRoot, 'src/components/calculators/VehicleComparator.jsx'), 'utf8');
  assert.ok(compContent.includes('VinCheckBanner'), 'VehicleComparator must import and use VinCheckBanner');
  assert.ok(compContent.includes('placement="comparator"'), 'VehicleComparator must specify placement="comparator"');

  const blogContent = fs.readFileSync(path.join(projectRoot, 'src/pages/BlogPage.jsx'), 'utf8');
  assert.ok(blogContent.includes('VinCheckBanner'), 'BlogPage must import and use VinCheckBanner');
  assert.ok(blogContent.includes('placement="buyer-guide"'), 'BlogPage must specify placement="buyer-guide"');

  const guidesContent = fs.readFileSync(path.join(projectRoot, 'src/pages/GuidesPage.jsx'), 'utf8');
  assert.ok(guidesContent.includes('VinCheckBanner'), 'GuidesPage must import and use VinCheckBanner');
  assert.ok(guidesContent.includes('placement="buyer-guide"'), 'GuidesPage must specify placement="buyer-guide"');

  const footerContent = fs.readFileSync(path.join(projectRoot, 'src/components/layout/Footer.jsx'), 'utf8');
  assert.ok(footerContent.includes('VinCheckBanner'), 'Footer must import and use VinCheckBanner');
  assert.ok(footerContent.includes('placement="footer"'), 'Footer must specify placement="footer"');
});

test('carVertical: VinCheckBanner implementation contains all mandated features', () => {
  const bannerContent = fs.readFileSync(path.join(projectRoot, 'src/components/monetization/VinCheckBanner.jsx'), 'utf8');
  assert.ok(bannerContent.includes('CarVerticalLogo'), 'Banner must render CarVerticalLogo');
  assert.ok(bannerContent.includes('Enter 17-digit VIN or License Plate (Optional)'), 'Banner must have the exact VIN placeholder');
  assert.ok(bannerContent.includes('Check Vehicle History (20% OFF)'), 'Banner must render the exact CTA text');
  assert.ok(bannerContent.includes('CARVERTICAL_DISCOUNT_CODE'), 'Banner must bind 20% discount code');
  assert.ok(bannerContent.includes('CARVERTICAL_LEGAL_ATTRIBUTION'), 'Banner must render Clause 1.3 legal attribution');
  assert.ok(bannerContent.includes('handleCopyCode'), 'Banner must provide copy coupon code action');
  assert.ok(bannerContent.includes('execCommand'), 'Banner must have clipboard fallback for non-secure / restricted environments');
});

test('carVertical: CarVerticalLogo component renders official static asset and SVG fallback', () => {
  const logoContent = fs.readFileSync(path.join(projectRoot, 'src/components/common/CarVerticalLogo.jsx'), 'utf8');
  assert.ok(logoContent.includes('/carvertical-logo.png'), 'CarVerticalLogo must point to /carvertical-logo.png');
  assert.ok(logoContent.includes('withPill'), 'CarVerticalLogo must support high-contrast pill styling');
  assert.ok(logoContent.includes('<svg'), 'CarVerticalLogo must have SVG fallback');
  assert.ok(logoContent.includes('#0068FF'), 'CarVerticalLogo must render carVertical blue');
});

test('carVertical: VinCheckBanner renders cleanly with 2-step Live NHTSA VIN Decoder funnel', async () => {
  const bannerPath = path.join(projectRoot, 'src/components/monetization/VinCheckBanner.jsx');
  const bannerContent = fs.readFileSync(bannerPath, 'utf8');

  // 1. Verify clean JSX compilation (no syntax or JSX nesting errors)
  let transpiled;
  assert.doesNotThrow(() => {
    transpiled = transpileJsx(bannerContent);
  }, 'VinCheckBanner JSX must compile cleanly without syntax errors');
  assert.ok(transpiled && transpiled.length > 500, 'Transpiled output must be non-empty JS code');

  // 2. Verify NHTSA live decoder integration & secondary pill button
  assert.ok(
    bannerContent.includes('decodeVinNhtsa') && bannerContent.includes('vehicleApi'),
    'Banner must import decodeVinNhtsa from vehicleApi'
  );
  assert.ok(
    bannerContent.includes('Decode Free Factory Specs'),
    'Banner must provide the secondary "Decode Free Factory Specs" trigger button'
  );

  // 3. Verify in-flight loading & error/offline states
  assert.ok(bannerContent.includes('isDecoding'), 'Banner must track isDecoding loading state');
  assert.ok(bannerContent.includes('decodeError'), 'Banner must handle decoding errors gracefully');
  assert.ok(bannerContent.includes('AbortController'), 'Banner must use AbortController for in-flight requests and unmount cleanup');

  // 4. Verify preview strip and telemetry badges
  assert.ok(
    bannerContent.includes('factory-vin-decoded-strip') && bannerContent.includes('Factory VIN Decoded'),
    'Banner must render Factory VIN Decoded preview strip'
  );
  const requiredBadges = [
    'Make',
    'Model',
    'ModelYear',
    'DisplacementL',
    'EngineCylinders',
    'FuelTypePrimary',
    'PlantCountry',
  ];
  for (const badge of requiredBadges) {
    assert.ok(
      bannerContent.includes(badge),
      `Banner must handle decoded telemetry property: ${badge}`
    );
  }

  // 5. Verify high-contrast conversion prompt verbatim
  const expectedPrompt =
    'Factory specifications confirmed. Note: Free government VIN decoding does NOT reveal odometer rollbacks, hidden accident damage, salvage titles, or theft records. Unlock the full history report on carVertical below (20% OFF code: mydriveledger).';
  assert.ok(
    bannerContent.includes(expectedPrompt),
    'Banner must render verbatim high-contrast conversion prompt'
  );

  // 6. Verify primary CTA points to getCarVerticalUrl with sub3
  assert.ok(
    bannerContent.includes('getCarVerticalUrl(vinOrPlate, placement)'),
    'Banner must bind primary CTA to getCarVerticalUrl with vinOrPlate for Everflow sub3 tracking'
  );
  assert.ok(
    bannerContent.includes('Check Vehicle History (20% OFF)'),
    'Banner must retain primary CTA label'
  );

  // 7. Verify live component rendering with React & ReactDOMServer
  const { default: VinCheckBanner } = await import('../src/components/monetization/VinCheckBanner.jsx');
  const renderedHtml = ReactDOMServer.renderToStaticMarkup(
    React.createElement(VinCheckBanner, {
      placement: 'tco',
      initialVin: '1HGCR2F83HA123456',
      vehicleName: 'Honda Accord',
      purchasePriceUsd: 24500,
      vehiclePriceFormatted: '$24,500',
    })
  );

  assert.ok(renderedHtml.includes('data-placement="tco"'), 'Rendered banner has data-placement="tco"');
  assert.ok(renderedHtml.includes('id="affiliate-cta-vin-check"'), 'Rendered banner has id="affiliate-cta-vin-check"');
  assert.ok(renderedHtml.includes('Check Vehicle History (20% OFF)'), 'Rendered banner includes primary CTA button');
  assert.ok(renderedHtml.includes('Decode Free Factory Specs'), 'Rendered banner includes secondary decode button');
  assert.ok(renderedHtml.includes('sub3=1HGCR2F83HA123456'), 'Rendered affiliate URL populates sub3 parameter with VIN');
  assert.ok(renderedHtml.includes('uid=40'), 'Rendered affiliate URL populates uid=40');
  assert.ok(renderedHtml.includes('mydriveledger'), 'Rendered banner contains discount coupon code');
  assert.ok(renderedHtml.includes(CARVERTICAL_LEGAL_ATTRIBUTION), 'Rendered banner contains legal partnership attribution');
});

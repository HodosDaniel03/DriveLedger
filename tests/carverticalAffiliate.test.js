import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getCarVerticalUrl,
  CARVERTICAL_AFFILIATE_URL,
  CARVERTICAL_DIRECT_VIN_TEMPLATE,
  CARVERTICAL_DISCOUNT_CODE,
  CARVERTICAL_DISCOUNT_PERCENT,
  CARVERTICAL_LEGAL_ATTRIBUTION,
  affiliatePartners,
  MONETIZATION_CONFIG,
} from '../src/config/monetizationConfig.js';

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

  assert.equal(affiliatePartners.vinCheck.discountCode, 'mydriveledger');
  assert.equal(affiliatePartners.vinCheck.discountPercent, 20);
  assert.equal(affiliatePartners.vinCheck.legalAttribution, CARVERTICAL_LEGAL_ATTRIBUTION);
  assert.equal(MONETIZATION_CONFIG.carVerticalAttribution, CARVERTICAL_LEGAL_ATTRIBUTION);
  assert.equal(MONETIZATION_CONFIG.carVertical.discountCode, 'mydriveledger');
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

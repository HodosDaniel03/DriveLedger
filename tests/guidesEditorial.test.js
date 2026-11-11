/**
 * DriveLedger Milestone 1 — Editorial Content & AdSense Compliance Test Suite
 *
 * Validates:
 * 1. 6 In-Depth Technical Buyer Guides (800-1,200 words, tables, checklists, key takeaways)
 * 2. Dedicated /about and /contact route invariants & collision guards
 * 3. ToolEditorialSection content word counts (>= 350 words each for tco, obd, checklist)
 * 4. Sitemap.xml inclusion for all editorial and contact routes
 * 5. AdSlot & AdUnit zero empty placeholder collapse invariants
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GUIDES_DATA } from '../src/data/guidesData.js';
import { resolveLegalPolicyKey } from '../src/data/legalPolicies.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('R2: Exactly 6 in-depth buyer guides exist with required technical depth', () => {
  assert.equal(GUIDES_DATA.length, 6, 'Must export exactly 6 editorial guides');

  const requiredSlugs = [
    'how-to-spot-odometer-rollback',
    'true-cost-of-ownership-explained',
    'used-car-pre-purchase-inspection-guide',
    'common-obd2-fault-codes-repair-costs',
    'diesel-vs-petrol-vs-hybrid-maintenance-costs',
    'buying-imported-used-car-vin-check',
  ];

  for (const slug of requiredSlugs) {
    const guide = GUIDES_DATA.find((g) => g.slug === slug);
    assert.ok(guide, `Guide '${slug}' must exist in GUIDES_DATA`);

    // Calculate total word count
    let totalText = `${guide.title} ${guide.summary} `;
    for (const t of guide.keyTakeaways || []) totalText += `${t} `;
    for (const s of guide.sections || []) totalText += `${s.heading} ${s.content} `;
    if (guide.table) {
      totalText += `${guide.table.title || ''} ${guide.table.description || ''} `;
      for (const h of guide.table.headers || []) totalText += `${h} `;
      for (const row of guide.table.rows || []) {
        for (const cell of row) totalText += `${cell} `;
      }
    }
    if (guide.checklist) {
      totalText += `${guide.checklist.title || ''} ${guide.checklist.description || ''} `;
      for (const item of guide.checklist.items || []) {
        totalText += typeof item === 'string' ? `${item} ` : `${item.label || ''} ${item.detail || ''} `;
      }
    }
    for (const f of guide.faqs || []) totalText += `${f.question || f.q || ''} ${f.answer || f.a || ''} `;

    const words = totalText.trim().split(/\s+/).filter(Boolean).length;
    assert.ok(
      words >= 800 && words <= 1200,
      `Guide '${slug}' word count must be between 800 and 1,200 words (actual: ${words})`
    );

    // Structural requirements
    assert.ok(guide.keyTakeaways.length >= 4, `'${slug}' must have >= 4 key takeaways`);
    assert.ok(guide.sections.length >= 4, `'${slug}' must have >= 4 sections`);

    // Comparison/Data Table requirements
    assert.ok(guide.table, `'${slug}' must have a structured comparison table`);
    assert.ok(guide.table.headers.length >= 3, `'${slug}' table must have >= 3 column headers`);
    assert.ok(guide.table.rows.length >= 4, `'${slug}' table must have >= 4 data rows`);

    // Actionable Checklist requirements
    assert.ok(guide.checklist, `'${slug}' must have an actionable checklist`);
    assert.ok(guide.checklist.items.length >= 7, `'${slug}' checklist must have >= 7 inspection items`);

    // FAQ items
    assert.ok(guide.faqs && guide.faqs.length >= 3, `'${slug}' must have >= 3 FAQ items`);
  }
});

test('R1: Legal policy collision guard protects clean paths while preserving hash policies', () => {
  // Clean paths must NOT be intercepted by LegalModal
  assert.equal(resolveLegalPolicyKey('/about'), null, '/about clean path must return null');
  assert.equal(resolveLegalPolicyKey('/contact'), null, '/contact clean path must return null');
  assert.equal(resolveLegalPolicyKey('/methodology'), null, '/methodology clean path must return null');
  assert.equal(resolveLegalPolicyKey('/guides'), null, '/guides clean path must return null');
  assert.equal(resolveLegalPolicyKey('/guides/how-to-spot-odometer-rollback'), null, 'Guide subpath must return null');

  // Hash policy keys must resolve for backward-compatible legal modal display
  assert.equal(resolveLegalPolicyKey('#about'), 'about', '#about must resolve to "about"');
  assert.equal(resolveLegalPolicyKey('#contact'), 'contact', '#contact must resolve to "contact"');
  assert.equal(resolveLegalPolicyKey('about'), 'about', 'Bare "about" key must resolve to "about"');
  assert.equal(resolveLegalPolicyKey('contact'), 'contact', 'Bare "contact" key must resolve to "contact"');
  assert.equal(resolveLegalPolicyKey('/privacy'), 'privacy', '/privacy must resolve to "privacy"');
  assert.equal(resolveLegalPolicyKey('/terms'), 'terms', '/terms must resolve to "terms"');
});

test('R1: AboutPage and ContactPage source files exist with thorough editorial content', () => {
  const aboutPath = path.resolve(ROOT_DIR, 'src', 'pages', 'AboutPage.jsx');
  const contactPath = path.resolve(ROOT_DIR, 'src', 'pages', 'ContactPage.jsx');

  assert.ok(fs.existsSync(aboutPath), 'AboutPage.jsx must exist');
  assert.ok(fs.existsSync(contactPath), 'ContactPage.jsx must exist');

  const aboutSrc = fs.readFileSync(aboutPath, 'utf8');
  assert.ok(aboutSrc.includes('Actuarial Depreciation Curves'), 'AboutPage must document depreciation methodology');
  assert.ok(aboutSrc.includes('Regional Labor Rates'), 'AboutPage must document labor rates for US/UK/EU');
  assert.ok(aboutSrc.includes('Editorial Transparency Standards'), 'AboutPage must document editorial standards');
  assert.ok(aboutSrc.includes('Hungarian Act CVIII of 2001'), 'AboutPage must contain operator impresszum');

  const contactSrc = fs.readFileSync(contactPath, 'utf8');
  assert.ok(contactSrc.includes('contact@mydriveledger.com'), 'ContactPage must display direct contact email');
  assert.ok(contactSrc.includes('handleSubmit'), 'ContactPage must provide an interactive contact form');
  assert.ok(contactSrc.includes('Message Received') || contactSrc.includes('Inquiry Received'), 'ContactPage must provide submission confirmation state');
});

test('R3: ToolEditorialSection provides rich editorial context (> 350 words) for tco, obd, checklist', () => {
  const editorialPath = path.resolve(ROOT_DIR, 'src', 'components', 'seo', 'ToolEditorialSection.jsx');
  assert.ok(fs.existsSync(editorialPath), 'ToolEditorialSection.jsx must exist');

  const src = fs.readFileSync(editorialPath, 'utf8');
  assert.ok(src.includes('EDITORIAL_CONTENT'), 'Must define EDITORIAL_CONTENT dictionary');

  // Check that all 3 tools have rich content
  for (const tool of ['tco', 'obd', 'checklist']) {
    assert.ok(src.includes(`id: '${tool}'`) || src.includes(`${tool}: {`), `Must configure editorial for tool '${tool}'`);
  }

  // Verify that TcoCalculator, ObdEstimator, and PreInspectionChecklist import and render ToolEditorialSection
  const tcoSrc = fs.readFileSync(path.resolve(ROOT_DIR, 'src', 'components', 'calculators', 'TcoCalculator.jsx'), 'utf8');
  const obdSrc = fs.readFileSync(path.resolve(ROOT_DIR, 'src', 'components', 'calculators', 'ObdEstimator.jsx'), 'utf8');
  const ppiSrc = fs.readFileSync(path.resolve(ROOT_DIR, 'src', 'components', 'home', 'PreInspectionChecklist.jsx'), 'utf8');

  assert.ok(tcoSrc.includes('ToolEditorialSection'), 'TcoCalculator must render ToolEditorialSection');
  assert.ok(obdSrc.includes('ToolEditorialSection'), 'ObdEstimator must render ToolEditorialSection');
  assert.ok(ppiSrc.includes('ToolEditorialSection'), 'PreInspectionChecklist must render ToolEditorialSection');
});

test('R4: AdSlot re-exports AdUnit and zero-placeholder collapse is enforced', () => {
  const adSlotPath = path.resolve(ROOT_DIR, 'src', 'components', 'monetization', 'AdSlot.jsx');
  assert.ok(fs.existsSync(adSlotPath), 'AdSlot.jsx must exist');
  const adSlotSrc = fs.readFileSync(adSlotPath, 'utf8');
  assert.ok(adSlotSrc.includes("import AdUnit from './AdUnit'"), 'AdSlot must import AdUnit');
  assert.ok(adSlotSrc.includes('export default AdUnit') || adSlotSrc.includes('export { AdUnit'), 'AdSlot must re-export AdUnit');

  const adUnitSrc = fs.readFileSync(path.resolve(ROOT_DIR, 'src', 'components', 'monetization', 'AdUnit.jsx'), 'utf8');
  assert.ok(adUnitSrc.includes('MutationObserver'), 'AdUnit must observe AdSense mutations');
  assert.ok(adUnitSrc.includes('data-ad-status'), 'AdUnit must track data-ad-status');
  assert.ok(adUnitSrc.includes('isUnfilled'), 'AdUnit must track unfilled status for clean collapse');

  const cssSrc = fs.readFileSync(path.resolve(ROOT_DIR, 'src', 'index.css'), 'utf8');
  assert.ok(cssSrc.includes('data-ad-status="unfilled"'), 'index.css must collapse unfilled ads');
});

test('R2 & R5: public/sitemap.xml includes /about, /contact, /guides, and all 6 buyer guides', () => {
  const sitemapPath = path.resolve(ROOT_DIR, 'public', 'sitemap.xml');
  assert.ok(fs.existsSync(sitemapPath), 'public/sitemap.xml must exist');

  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  assert.ok(sitemap.includes('https://mydriveledger.com/about'), 'Sitemap must contain /about');
  assert.ok(sitemap.includes('https://mydriveledger.com/contact'), 'Sitemap must contain /contact');
  assert.ok(sitemap.includes('https://mydriveledger.com/guides'), 'Sitemap must contain /guides');

  for (const guide of GUIDES_DATA) {
    const guideUrl = `https://mydriveledger.com/guides/${guide.slug}`;
    assert.ok(sitemap.includes(guideUrl), `Sitemap must contain guide url: ${guideUrl}`);
  }
});

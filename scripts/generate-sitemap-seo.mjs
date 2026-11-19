/**
 * DriveLedger | Programmatic SEO & Dynamic XML Sitemap Generator
 *
 * Generates public/sitemap.xml at build-time containing 2,566 indexable canonical URLs:
 * 1. Core workspace, HTML vehicle directory & legal routes (18 canonical URLs)
 * 2. Dedicated Brand Hub SEO pages (/vehicles/:brand, 35 canonical URLs)
 * 3. In-Depth Technical Buyer Guides (/guides/:slug, 10 canonical URLs)
 * 4. Programmatic Vehicle Preset routes (TCO, Risk Matrix, Checklist: 179 × 3 = 537 canonical URLs)
 * 5. Mileage-Bracket Buyer & Reliability Guides (/risk-matrix/:presetId/60k-miles | 100k-miles | 150k-miles: 179 × 3 = 537 canonical URLs)
 * 6. Head-to-Head Vehicle Comparison Matchups (/compare/:carA-vs-:carB: 800 canonical URLs)
 * 7. Powertrain-Validated Known Weak-Point OBD-II Diagnostic routes (/obd/:preset/:code: 629 canonical URLs)
 * Total: 2,566 canonical URLs matching 1:1 with prerendered static HTML files.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { VEHICLE_PRESETS } from '../src/data/vehiclePresets.js';
import { BRAND_DIRECTORY } from '../src/data/brandDirectory.js';
import { GUIDES_DATA } from '../src/data/guidesData.js';
import {
  generateFullVehicleObdMatrix,
  PROGRAMMATIC_COMPARE_PAIRS,
  MILEAGE_BRACKET_SLUGS,
} from '../src/data/seoMatrixData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SITEMAP_PATH = path.resolve(ROOT_DIR, 'public', 'sitemap.xml');

const SITE_ORIGIN = 'https://mydriveledger.com';
const TODAY = new Date().toISOString().split('T')[0];

function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateSitemapXml() {
  const urlEntries = [];

  const addedUrls = new Set();
  function addUrl(loc, priority = '0.8', changefreq = 'weekly') {
    const cleanLoc = loc.trim();
    if (addedUrls.has(cleanLoc)) return;
    addedUrls.add(cleanLoc);
    urlEntries.push({
      loc: escapeXml(cleanLoc),
      lastmod: TODAY,
      changefreq,
      priority,
    });
  }

  // 1. Core Platform Routes
  addUrl(`${SITE_ORIGIN}/`, '1.0', 'daily');
  addUrl(`${SITE_ORIGIN}/tco`, '0.9', 'weekly');
  addUrl(`${SITE_ORIGIN}/risk-matrix`, '0.9', 'weekly');
  addUrl(`${SITE_ORIGIN}/obd-estimator`, '0.9', 'weekly');
  addUrl(`${SITE_ORIGIN}/compare`, '0.9', 'weekly');
  addUrl(`${SITE_ORIGIN}/checklist`, '0.9', 'weekly');
  addUrl(`${SITE_ORIGIN}/vehicles`, '0.9', 'weekly');
  addUrl(`${SITE_ORIGIN}/guides`, '0.85', 'weekly');
  addUrl(`${SITE_ORIGIN}/about`, '0.8', 'monthly');
  addUrl(`${SITE_ORIGIN}/contact`, '0.8', 'monthly');
  addUrl(`${SITE_ORIGIN}/methodology`, '0.8', 'monthly');
  addUrl(`${SITE_ORIGIN}/reviews`, '0.8', 'weekly');
  addUrl(`${SITE_ORIGIN}/privacy`, '0.7', 'monthly');
  addUrl(`${SITE_ORIGIN}/terms`, '0.7', 'monthly');
  addUrl(`${SITE_ORIGIN}/cookies`, '0.7', 'monthly');
  addUrl(`${SITE_ORIGIN}/disclaimer`, '0.7', 'monthly');
  addUrl(`${SITE_ORIGIN}/affiliate-disclosure`, '0.7', 'monthly');
  addUrl(`${SITE_ORIGIN}/do-not-sell`, '0.7', 'monthly');

  // 1b. Dedicated Brand Hub Pages (/vehicles/:brand, 35 canonical URLs)
  for (const brand of BRAND_DIRECTORY) {
    addUrl(`${SITE_ORIGIN}/vehicles/${brand.slug}`, '0.88', 'weekly');
  }

  // 1c. In-Depth Technical Buyer Guides (/guides/:slug)
  for (const guide of GUIDES_DATA) {
    addUrl(`${SITE_ORIGIN}/guides/${guide.slug}`, '0.80', 'weekly');
  }

  // 2. Programmatic Preset Routes & Mileage-Bracket Risk Guides for all 179 Vehicle Presets
  const bracketKeys = Object.keys(MILEAGE_BRACKET_SLUGS);
  for (const preset of VEHICLE_PRESETS) {
    addUrl(`${SITE_ORIGIN}/tco/${preset.id}`, '0.85', 'weekly');
    addUrl(`${SITE_ORIGIN}/risk-matrix/${preset.id}`, '0.85', 'weekly');
    addUrl(`${SITE_ORIGIN}/checklist/${preset.id}`, '0.85', 'weekly');

    for (const bracketSlug of bracketKeys) {
      addUrl(`${SITE_ORIGIN}/risk-matrix/${preset.id}/${bracketSlug}`, '0.80', 'weekly');
    }
  }

  // 3. Segment-Matched Head-to-Head Comparison Routes (/compare/:carA-vs-:carB)
  for (const matchup of PROGRAMMATIC_COMPARE_PAIRS) {
    addUrl(`${SITE_ORIGIN}${matchup.path}`, '0.82', 'weekly');
  }

  // 4. Powertrain-Validated Vehicle × OBD-II Diagnostic Routes (/obd/:preset/:code - Known Weak Points only)
  const fullObdMatrix = generateFullVehicleObdMatrix();
  const targetObdEntries = fullObdMatrix.filter((item) => item.isKnownWeakPoint);
  for (const item of targetObdEntries) {
    addUrl(`${SITE_ORIGIN}${item.path}`, '0.82', 'weekly');
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntries
      .map(
        (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
      )
      .join('\n'),
    '</urlset>',
  ].join('\n');

  return { xml, count: urlEntries.length };
}

// Execute file generation when run directly
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const { xml, count } = generateSitemapXml();
    fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
    console.log(`[Sitemap Generator] Successfully generated ${count} programmatic URLs at ${SITEMAP_PATH}`);
  } catch (err) {
    console.error('[Sitemap Generator] Failed to generate sitemap.xml:', err);
    process.exit(1);
  }
}

/**
 * ShiftMetric — Programmatic SEO & Dynamic XML Sitemap Generator
 *
 * Generates public/sitemap.xml at build-time containing 4,800+ powertrain-validated URLs:
 * 1. Core workspace & editorial routes (/overview, /tco, /risk-matrix, /obd-estimator, /compare, /checklist, /methodology, /reviews, /blog)
 * 2. Programmatic Vehicle Preset routes (TCO, Risk Matrix, Checklist, Compare)
 * 3. Mileage-Bracket Buyer & Reliability Guides (/risk-matrix/:presetId/60k-miles | 100k-miles | 150k-miles)
 * 4. Head-to-Head Vehicle Comparison Matchups (/compare/:carA-vs-:carB)
 * 5. Modular Vehicle Model & Engine Variant PPI Checklist routes
 * 6. Powertrain-Validated Vehicle × OBD-II Diagnostic routes (/obd/:preset/:code — strictly 0 ICE/DPF codes on EVs)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { VEHICLE_PRESETS } from '../src/data/vehiclePresets.js';
import { MODULAR_BRANDS } from '../src/data/vehicles/index.js';
import {
  generateFullVehicleObdMatrix,
  PROGRAMMATIC_COMPARE_PAIRS,
  MILEAGE_BRACKET_SLUGS,
} from '../src/data/seoMatrixData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SITEMAP_PATH = path.resolve(ROOT_DIR, 'public', 'sitemap.xml');

const SITE_ORIGIN = 'https://shiftmetric.com';
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
  addUrl(`${SITE_ORIGIN}/methodology`, '0.8', 'monthly');
  addUrl(`${SITE_ORIGIN}/reviews`, '0.8', 'weekly');
  addUrl(`${SITE_ORIGIN}/blog`, '0.8', 'weekly');

  // 2. Programmatic Preset Routes & Mileage-Bracket Risk Guides for all 179 Vehicle Presets
  const bracketKeys = Object.keys(MILEAGE_BRACKET_SLUGS);
  for (const preset of VEHICLE_PRESETS) {
    addUrl(`${SITE_ORIGIN}/tco?preset=${preset.id}`, '0.85', 'weekly');
    addUrl(`${SITE_ORIGIN}/risk-matrix?preset=${preset.id}`, '0.85', 'weekly');
    addUrl(`${SITE_ORIGIN}/checklist?preset=${preset.id}`, '0.85', 'weekly');
    addUrl(`${SITE_ORIGIN}/compare?presetA=${preset.id}`, '0.75', 'weekly');

    for (const bracketSlug of bracketKeys) {
      addUrl(`${SITE_ORIGIN}/risk-matrix/${preset.id}/${bracketSlug}`, '0.80', 'weekly');
    }
  }

  // 3. Segment-Matched Head-to-Head Comparison Routes (/compare/:carA-vs-:carB)
  for (const matchup of PROGRAMMATIC_COMPARE_PAIRS) {
    addUrl(`${SITE_ORIGIN}${matchup.path}`, '0.82', 'weekly');
  }

  // 4. Programmatic Modular Brand & Engine Variant Checklist Routes
  for (const brand of MODULAR_BRANDS) {
    for (const model of brand.models) {
      for (const gen of model.generations) {
        for (const eng of gen.engines) {
          addUrl(
            `${SITE_ORIGIN}/checklist?make=${brand.id}&model=${model.id}&gen=${gen.id}&engine=${eng.id}`,
            '0.75',
            'weekly'
          );
        }
      }
    }
  }

  // 5. Powertrain-Validated Vehicle × OBD-II Diagnostic Routes (/obd/:preset/:code)
  const fullObdMatrix = generateFullVehicleObdMatrix();
  for (const item of fullObdMatrix) {
    addUrl(`${SITE_ORIGIN}${item.path}`, item.isKnownWeakPoint ? '0.82' : '0.70', 'weekly');
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

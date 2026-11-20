import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  escapeHtml,
  routePathToDistFile,
  injectRouteMetadata,
  collectAllSeoRoutes,
  computePresetTelemetry,
  prerenderSeoRoutes,
  ROOT_DIR,
  DIST_DIR,
} from '../scripts/prerender-seo-routes.mjs';

import { VEHICLE_PRESETS, getPresetById } from '../src/data/vehiclePresets.js';
import { BRAND_DIRECTORY } from '../src/data/brandDirectory.js';
import { GUIDES_DATA } from '../src/data/guidesData.js';
import {
  PROGRAMMATIC_COMPARE_PAIRS,
  MILEAGE_BRACKET_SLUGS,
  generateFullVehicleObdMatrix,
  parseCompareMatchupPath,
  parseRiskMileagePath,
} from '../src/data/seoMatrixData.js';
import { generateSitemapXml } from '../scripts/generate-sitemap-seo.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// 1. HTML ENTITY ESCAPING TESTS
// ============================================================================

test('1. escapeHtml: Escapes special characters safely and handles falsy values', () => {
  assert.equal(escapeHtml(null), '', 'null must resolve to empty string');
  assert.equal(escapeHtml(undefined), '', 'undefined must resolve to empty string');
  assert.equal(escapeHtml(''), '', 'empty string remains empty');

  // Basic entity replacements
  assert.equal(escapeHtml('A & B'), 'A &amp; B');
  assert.equal(escapeHtml('x < y > z'), 'x &lt; y &gt; z');
  assert.equal(escapeHtml('He said "quote"'), 'He said &quot;quote&quot;');
  assert.equal(escapeHtml("Owner's manual"), 'Owner&#39;s manual');

  // Combined automotive metadata test string
  const complexString = `Volkswagen Golf 2.0 TDI & Audi A3 2.0 TFSI "Black Edition" <150k mi> Owner's TCO`;
  const escaped = escapeHtml(complexString);

  assert.ok(!escaped.includes('& '), 'Unescaped ampersand must not remain');
  assert.ok(!escaped.includes('<150k'), 'Unescaped angle bracket must not remain');
  assert.ok(!escaped.includes('"Black'), 'Unescaped quote must not remain');
  assert.ok(!escaped.includes("Owner's"), 'Unescaped apostrophe must not remain');
  assert.ok(escaped.includes('&amp;'));
  assert.ok(escaped.includes('&quot;Black Edition&quot;'));
  assert.ok(escaped.includes('&lt;150k mi&gt;'));
  assert.ok(escaped.includes('Owner&#39;s'));
});

// ============================================================================
// 2. ROUTE PATH RESOLUTION TESTS
// ============================================================================

test('2. routePathToDistFile: Deterministically resolves URL paths to dist HTML files', () => {
  const dummyDist = path.join(ROOT_DIR, 'dist');

  // Root paths
  assert.equal(routePathToDistFile(dummyDist, '/'), path.join(dummyDist, 'index.html'));
  assert.equal(routePathToDistFile(dummyDist, ''), path.join(dummyDist, 'index.html'));

  // Core single-segment routes
  assert.equal(routePathToDistFile(dummyDist, '/tco'), path.join(dummyDist, 'tco', 'index.html'));
  assert.equal(routePathToDistFile(dummyDist, '/tco/'), path.join(dummyDist, 'tco', 'index.html'));
  assert.equal(routePathToDistFile(dummyDist, 'tco'), path.join(dummyDist, 'tco', 'index.html'));

  // Editorial guide routes
  assert.equal(
    routePathToDistFile(dummyDist, '/guides/how-to-spot-odometer-rollback'),
    path.join(dummyDist, 'guides', 'how-to-spot-odometer-rollback', 'index.html')
  );

  // Preset subpaths
  assert.equal(
    routePathToDistFile(dummyDist, '/tco/vw-golf-20-tdi'),
    path.join(dummyDist, 'tco', 'vw-golf-20-tdi', 'index.html')
  );
  assert.equal(
    routePathToDistFile(dummyDist, '/risk-matrix/bmw-320d-f30'),
    path.join(dummyDist, 'risk-matrix', 'bmw-320d-f30', 'index.html')
  );

  // Mileage bracket routes
  assert.equal(
    routePathToDistFile(dummyDist, '/risk-matrix/bmw-320d-f30/60k-miles'),
    path.join(dummyDist, 'risk-matrix', 'bmw-320d-f30', '60k-miles', 'index.html')
  );

  // OBD diagnostic routes
  assert.equal(
    routePathToDistFile(dummyDist, '/obd/ford-focus-ecoblue/p2002'),
    path.join(dummyDist, 'obd', 'ford-focus-ecoblue', 'p2002', 'index.html')
  );

  // Query parameter and hash normalization
  assert.equal(
    routePathToDistFile(dummyDist, '/compare?presetA=bmw-330i-g20'),
    path.join(dummyDist, 'compare', 'index.html')
  );
  assert.equal(
    routePathToDistFile(dummyDist, '/tco#break-even-section'),
    path.join(dummyDist, 'tco', 'index.html')
  );
});

// ============================================================================
// 3. HTML INJECTION AND MULTILINE DESCRIPTION REPLACEMENT
// ============================================================================

test('3. injectRouteMetadata: Injects metadata and replaces multiline description correctly', () => {
  const sampleTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Default Fallback Title</title>
  <meta name="description"
    content="Initial multiline default description that spans across multiple source lines." />
  <link rel="canonical" href="https://mydriveledger.com/" />
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

  const injected = injectRouteMetadata(sampleTemplate, {
    title: 'Volkswagen Golf 2.0 TDI Cost to Own | DriveLedger',
    description: 'Calculate 5-year ownership costs for Volkswagen Golf 2.0 TDI EA288.',
    canonicalUrl: 'https://mydriveledger.com/tco/vw-golf-20-tdi',
  });

  // Verify title replacement
  assert.ok(
    injected.includes('<title>Volkswagen Golf 2.0 TDI Cost to Own | DriveLedger</title>'),
    'Title must be replaced'
  );
  assert.ok(!injected.includes('Default Fallback Title'), 'Old title must not remain');

  // Verify multiline description replacement
  assert.ok(
    injected.includes(
      '<meta name="description" content="Calculate 5-year ownership costs for Volkswagen Golf 2.0 TDI EA288." />'
    ),
    'Description must be replaced cleanly'
  );
  assert.ok(
    !injected.includes('Initial multiline default description'),
    'Old multiline description must not remain'
  );

  // Verify canonical link replacement
  assert.ok(
    injected.includes('<link rel="canonical" href="https://mydriveledger.com/tco/vw-golf-20-tdi" />'),
    'Canonical URL must be replaced'
  );
  assert.ok(
    !injected.includes('href="https://mydriveledger.com/"'),
    'Root canonical must not remain on subpage'
  );

  // Verify OpenGraph tags
  assert.ok(
    injected.includes(
      '<meta property="og:title" content="Volkswagen Golf 2.0 TDI Cost to Own | DriveLedger" />'
    )
  );
  assert.ok(
    injected.includes(
      '<meta property="og:description" content="Calculate 5-year ownership costs for Volkswagen Golf 2.0 TDI EA288." />'
    )
  );
  assert.ok(
    injected.includes(
      '<meta property="og:url" content="https://mydriveledger.com/tco/vw-golf-20-tdi" />'
    )
  );
  assert.ok(injected.includes('<meta property="og:type" content="website" />'));
  assert.ok(injected.includes('<meta property="og:site_name" content="DriveLedger" />'));

  // Verify Twitter tags
  assert.ok(injected.includes('<meta name="twitter:card" content="summary_large_image" />'));
  assert.ok(
    injected.includes(
      '<meta name="twitter:title" content="Volkswagen Golf 2.0 TDI Cost to Own | DriveLedger" />'
    )
  );
  assert.ok(
    injected.includes(
      '<meta name="twitter:description" content="Calculate 5-year ownership costs for Volkswagen Golf 2.0 TDI EA288." />'
    )
  );
});

// ============================================================================
// 4. IDEMPOTENCY TESTS
// ============================================================================

test('4. injectRouteMetadata: Idempotency check — running multiple times does not duplicate tags', () => {
  const sampleTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Initial</title>
  <meta name="description" content="Initial description." />
  <link rel="canonical" href="https://mydriveledger.com/" />
</head>
<body><div id="root"></div></body>
</html>`;

  // First pass
  const pass1 = injectRouteMetadata(sampleTemplate, {
    title: 'First Pass Title',
    description: 'First Pass Description',
    canonicalUrl: 'https://mydriveledger.com/privacy',
  });

  // Second pass on already-transformed HTML with new values
  const pass2 = injectRouteMetadata(pass1, {
    title: 'Second Pass Title & Updated',
    description: 'Second Pass Description & Updated',
    canonicalUrl: 'https://mydriveledger.com/terms',
  });

  // Count occurrences
  const countMatches = (str, regex) => (str.match(regex) || []).length;

  assert.equal(countMatches(pass2, /<title\b/gi), 1, 'Exactly one <title> tag must exist');
  assert.equal(
    countMatches(pass2, /<meta\s+[^>]*name=["']description["']/gi),
    1,
    'Exactly one meta description tag must exist'
  );
  assert.equal(
    countMatches(pass2, /<link\s+[^>]*rel=["']canonical["']/gi),
    1,
    'Exactly one canonical link tag must exist'
  );
  assert.equal(
    countMatches(pass2, /<meta\s+[^>]*property=["']og:title["']/gi),
    1,
    'Exactly one og:title tag must exist'
  );
  assert.equal(
    countMatches(pass2, /<meta\s+[^>]*property=["']og:description["']/gi),
    1,
    'Exactly one og:description tag must exist'
  );
  assert.equal(
    countMatches(pass2, /<meta\s+[^>]*property=["']og:url["']/gi),
    1,
    'Exactly one og:url tag must exist'
  );
  assert.equal(
    countMatches(pass2, /<meta\s+[^>]*name=["']twitter:title["']/gi),
    1,
    'Exactly one twitter:title tag must exist'
  );
  assert.equal(
    countMatches(pass2, /<meta\s+[^>]*name=["']twitter:description["']/gi),
    1,
    'Exactly one twitter:description tag must exist'
  );

  // Content should reflect pass2
  assert.ok(pass2.includes('<title>Second Pass Title &amp; Updated</title>'));
  assert.ok(pass2.includes('href="https://mydriveledger.com/terms"'));
});

// ============================================================================
// 5. ROUTE COLLECTION & ENUMERATION INTEGRITY
// ============================================================================

test('5. collectAllSeoRoutes: Generates complete inventory of 2,565 programmatic SEO routes (including 35 brand hubs)', () => {
  const routes = collectAllSeoRoutes();
  assert.equal(routes.length, 2565, 'Total route count must match 2,565 programmatic SEO routes');

  const pathSet = new Set(routes.map((r) => r.path));

  // 17 Core, Directory & Legal Routes
  const requiredCoreRoutes = [
    '/tco',
    '/risk-matrix',
    '/obd-estimator',
    '/compare',
    '/checklist',
    '/vehicles',
    '/guides',
    '/about',
    '/contact',
    '/methodology',
    '/reviews',
    '/privacy',
    '/terms',
    '/cookies',
    '/disclaimer',
    '/affiliate-disclosure',
    '/do-not-sell',
  ];
  for (const corePath of requiredCoreRoutes) {
    assert.ok(pathSet.has(corePath), `Core route ${corePath} must be present`);
  }

  // All 35 Dedicated Brand Hub Pages (/vehicles/:brand)
  assert.equal(BRAND_DIRECTORY.length, 35, 'Expected 35 automotive brands');
  for (const brand of BRAND_DIRECTORY) {
    assert.ok(
      pathSet.has(`/vehicles/${brand.slug}`),
      `Brand hub route /vehicles/${brand.slug} must be present`
    );
  }

  // All 6 Editorial Guides
  for (const guide of GUIDES_DATA) {
    const guidePath = `/guides/${guide.slug}`;
    assert.ok(pathSet.has(guidePath), `Editorial guide ${guidePath} must be present`);
  }

  // 179 Presets across tabs and brackets
  const bracketSlugs = Object.keys(MILEAGE_BRACKET_SLUGS);
  for (const preset of VEHICLE_PRESETS) {
    assert.ok(pathSet.has(`/tco/${preset.id}`), `Preset TCO ${preset.id} must be present`);
    assert.ok(pathSet.has(`/risk-matrix/${preset.id}`), `Preset Risk Matrix ${preset.id} must be present`);
    assert.ok(pathSet.has(`/checklist/${preset.id}`), `Preset Checklist ${preset.id} must be present`);
    for (const bSlug of bracketSlugs) {
      assert.ok(
        pathSet.has(`/risk-matrix/${preset.id}/${bSlug}`),
        `Preset bracket ${preset.id}/${bSlug} must be present`
      );
    }
  }

  // Head-to-Head Comparisons (800)
  for (const matchup of PROGRAMMATIC_COMPARE_PAIRS) {
    assert.ok(pathSet.has(matchup.path), `Matchup ${matchup.path} must be present`);
  }

  // Vehicle × OBD-II Known Weak Points (629)
  const fullObdMatrix = generateFullVehicleObdMatrix();
  const knownWeakPoints = fullObdMatrix.filter((item) => item.isKnownWeakPoint);
  assert.equal(knownWeakPoints.length, 629, 'Must have 629 known weak points');

  for (const item of knownWeakPoints) {
    assert.ok(pathSet.has(item.path), `Known weak-point OBD path ${item.path} must be present`);
  }

  // Invariant verification on every route object
  for (const route of routes) {
    assert.ok(typeof route.path === 'string' && route.path.startsWith('/'), 'Path must start with /');
    assert.ok(typeof route.title === 'string' && route.title.length > 5, `Title on ${route.path} must be non-trivial`);
    assert.ok(typeof route.description === 'string' && route.description.length > 15, `Description on ${route.path} must be non-trivial`);
    assert.ok(
      typeof route.canonicalUrl === 'string' && route.canonicalUrl.startsWith('https://mydriveledger.com'),
      `Canonical URL on ${route.path} must be valid HTTPS`
    );
  }
});

// ============================================================================
// 6. TELEMETRY PRECOMPUTATION TEST
// ============================================================================

test('6. computePresetTelemetry: Derives valid financial & reliability telemetry for all presets', () => {
  for (const preset of VEHICLE_PRESETS) {
    const tel = computePresetTelemetry(preset);
    assert.ok(Number.isFinite(tel.total5YrTcoUsd) && tel.total5YrTcoUsd > 1000, '5-yr TCO must be a positive number');
    assert.ok(Number.isFinite(tel.monthlyTcoUsd) && tel.monthlyTcoUsd > 50, 'Monthly TCO must be positive');
    assert.ok(Number.isFinite(tel.costPerMileUsd) && tel.costPerMileUsd > 0.05, 'Cost per mile must be positive');
    assert.ok(Number.isFinite(tel.depreciation5YrUsd) && tel.depreciation5YrUsd >= 0, 'Depreciation must be non-negative');
    assert.ok(
      tel.reliabilityScore >= 18 && tel.reliabilityScore <= 95,
      `Reliability score for ${preset.id} must be in [18, 95], got ${tel.reliabilityScore}`
    );
  }
});

// ============================================================================
// 7. VERIFY BUILT STATIC ARTIFACTS IN DIST
// ============================================================================

test('7. Built Static Artifacts: Verifies dist static files and canonical metadata invariants', () => {
  const testFiles = [
    {
      file: path.join(DIST_DIR, 'tco', 'index.html'),
      canonical: 'https://mydriveledger.com/tco',
      title: '5-Year True Cost to Own (TCO) Calculator | DriveLedger',
    },
    {
      file: path.join(DIST_DIR, 'guides', 'index.html'),
      canonical: 'https://mydriveledger.com/guides',
      title: 'Buyer Guides',
    },
    {
      file: path.join(DIST_DIR, 'privacy', 'index.html'),
      canonical: 'https://mydriveledger.com/privacy',
      title: 'Privacy Policy',
    },
    {
      file: path.join(DIST_DIR, 'tco', 'vw-golf-20-tdi', 'index.html'),
      canonical: 'https://mydriveledger.com/tco/vw-golf-20-tdi',
      title: 'Volkswagen Golf',
    },
    {
      file: path.join(DIST_DIR, 'vehicles', 'toyota', 'index.html'),
      canonical: 'https://mydriveledger.com/vehicles/toyota',
      title: 'Toyota Maintenance Cost',
    },
    {
      file: path.join(DIST_DIR, 'vehicles', 'bmw', 'index.html'),
      canonical: 'https://mydriveledger.com/vehicles/bmw',
      title: 'BMW Maintenance Cost',
    },
  ];

  for (const item of testFiles) {
    assert.ok(fs.existsSync(item.file), `Expected static artifact to exist: ${item.file}`);
    const content = fs.readFileSync(item.file, 'utf8');
    assert.ok(content.includes(item.canonical), `Missing canonical ${item.canonical} in ${item.file}`);
    assert.ok(content.includes(item.title), `Missing title phrase ${item.title} in ${item.file}`);
    assert.ok(content.includes('property="og:title"'), `Missing og:title in ${item.file}`);
    assert.ok(content.includes('property="og:description"'), `Missing og:description in ${item.file}`);
    assert.ok(content.includes('property="og:url"'), `Missing og:url in ${item.file}`);
  }
});

// ============================================================================
// 8. FALLBACK CANONICAL INJECTION TEST
// ============================================================================

test('8. injectRouteMetadata: Injects fallback canonical link when template lacks canonical tag', () => {
  const templateWithoutCanonical = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Base Title</title>
  <meta name="description" content="Base description." />
</head>
<body><div id="root"></div></body>
</html>`;

  const injected = injectRouteMetadata(templateWithoutCanonical, {
    title: 'Custom Title',
    description: 'Custom Description',
    canonicalUrl: 'https://mydriveledger.com/obd-estimator',
  });

  assert.ok(
    injected.includes('<link rel="canonical" href="https://mydriveledger.com/obd-estimator" />'),
    'Fallback canonical link must be injected before </head>'
  );
  assert.ok(injected.includes('</head>'), '</head> tag must remain intact');
  assert.ok(
    injected.includes('<meta property="og:url" content="https://mydriveledger.com/obd-estimator" />'),
    'Social meta tags must be upserted'
  );
});

// ============================================================================
// 9. SITEMAP AND PRERENDER 1:1 PARITY TEST
// ============================================================================

test('9. Sitemap vs Prerender Parity: 100% 1-to-1 exact match with zero query params or unprerendered URLs', () => {
  const { xml, count } = generateSitemapXml();
  const prerenderRoutes = collectAllSeoRoutes();

  // Prerender has 2,565 programmatic sub-routes + 1 root = 2,566
  assert.equal(prerenderRoutes.length, 2565, 'Expected 2,565 programmatic prerender routes');
  assert.equal(count, 2566, 'Expected exactly 2,566 sitemap URLs');

  // Extract all sitemap URLs
  const sitemapUrls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  assert.equal(sitemapUrls.length, 2566, 'Extracted sitemap URLs count must equal 2,566');

  // Zero query parameter URLs
  const queryUrls = sitemapUrls.filter((u) => u.includes('?'));
  assert.equal(queryUrls.length, 0, `Sitemap must contain 0 query URLs, found: ${queryUrls.join(', ')}`);

  // Zero redirecting URLs
  assert.ok(!sitemapUrls.includes('https://mydriveledger.com/blog'), 'Sitemap must not contain /blog');
  assert.ok(!sitemapUrls.includes('https://mydriveledger.com/overview'), 'Sitemap must not contain /overview');

  // Set of expected URLs
  const expectedUrls = new Set(prerenderRoutes.map((r) => `https://mydriveledger.com${r.path}`));
  expectedUrls.add('https://mydriveledger.com/');

  for (const url of sitemapUrls) {
    assert.ok(expectedUrls.has(url), `Sitemap URL missing from prerender inventory: ${url}`);
  }
  for (const url of expectedUrls) {
    assert.ok(sitemapUrls.includes(url), `Prerender URL missing from sitemap inventory: ${url}`);
  }

  // Ensure dist/overview does not exist as a duplicate static file
  assert.ok(
    !fs.existsSync(path.join(DIST_DIR, 'overview')),
    'dist/overview directory must not exist (duplicate of root /)'
  );
});

// ============================================================================
// 10. TRAILING SLASH ROUTING TEST
// ============================================================================

test('10. Trailing Slash Handling: Route matchers parse paths with and without trailing slash', () => {
  // Compare matchup with trailing slash
  const compareClean = parseCompareMatchupPath('/compare/bmw-330i-g20-vs-tesla-model-3-lr');
  const compareSlash = parseCompareMatchupPath('/compare/bmw-330i-g20-vs-tesla-model-3-lr/');
  assert.ok(compareClean, 'Clean compare path must match');
  assert.ok(compareSlash, 'Compare path with trailing slash must match');
  assert.equal(compareClean.presetA, compareSlash.presetA);
  assert.equal(compareClean.presetB, compareSlash.presetB);

  // Risk mileage with trailing slash
  const riskClean = parseRiskMileagePath('/risk-matrix/ford-focus-ecoblue/100k-miles');
  const riskSlash = parseRiskMileagePath('/risk-matrix/ford-focus-ecoblue/100k-miles/');
  assert.ok(riskClean, 'Clean risk mileage path must match');
  assert.ok(riskSlash, 'Risk mileage path with trailing slash must match');
  assert.equal(riskClean.preset, riskSlash.preset);
  assert.equal(riskClean.odometerMiles, riskSlash.odometerMiles);
});

// ============================================================================
// 11. PRERENDERED APP SHELL, ZERO NESTED DIVS & LAZY BUNDLE SPLIT TEST
// ============================================================================

test('11. Prerendered Branded App Shell, Zero Nested Divs & Lazy Bundle Split', () => {
  const sampleHtmlFiles = [
    path.join(DIST_DIR, 'index.html'),
    path.join(DIST_DIR, 'tco', 'index.html'),
    path.join(DIST_DIR, 'tco', 'vw-golf-20-tdi', 'index.html'),
    path.join(DIST_DIR, 'vehicles', 'bmw', 'index.html'),
  ];

  for (const filePath of sampleHtmlFiles) {
    assert.ok(fs.existsSync(filePath), `Expected prerendered file to exist: ${filePath}`);
    const html = fs.readFileSync(filePath, 'utf8');

    // 1. Scoped inline shell CSS supporting both light and dark themes
    assert.ok(
      html.includes('<style id="prerender-shell-styles">'),
      `Missing inline prerender shell styles in ${filePath}`
    );
    assert.ok(html.includes('#F7F7F4'), `Missing light canvas #F7F7F4 in ${filePath}`);
    assert.ok(html.includes('html.dark') && html.includes('#09090B'), `Missing dark theme #09090B in ${filePath}`);

    // 2. Semantic App Shell structure inside #root
    const rootMatch = html.match(/<div\s+id=["']root["'][^>]*>([\s\S]*?)<\/div>/i);
    assert.ok(rootMatch, `Missing <div id="root">...</div> in ${filePath}`);
    const innerRoot = rootMatch[1];

    assert.ok(innerRoot.includes('<main data-prerendered="true" class="dl-pr">'), `Missing dl-pr main shell in ${filePath}`);
    assert.ok(innerRoot.includes('<header class="dl-pr-header">'), `Missing dl-pr-header in ${filePath}`);
    assert.ok(innerRoot.includes('<section class="dl-pr-viewport">'), `Missing dl-pr-viewport in ${filePath}`);
    assert.ok(innerRoot.includes('<section class="dl-pr-below-fold"'), `Missing dl-pr-below-fold in ${filePath}`);

    // 3. Strictly zero nested <div> tags inside #root (guarantees idempotency of rootDivRegex)
    assert.ok(
      !/<\/?div\b/i.test(innerRoot),
      `Prerendered #root content must not contain any nested <div> tags in ${filePath}`
    );
  }

  // 4. Running injectRouteMetadata twice on built dist/index.html stays idempotent
  const rootDistHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');
  const pass1 = injectRouteMetadata(rootDistHtml, {
    title: 'Idempotency Check Title',
    description: 'Idempotency check description for prerendered app shell.',
    canonicalUrl: 'https://mydriveledger.com/tco',
  });
  const pass2 = injectRouteMetadata(pass1, {
    title: 'Idempotency Check Title',
    description: 'Idempotency check description for prerendered app shell.',
    canonicalUrl: 'https://mydriveledger.com/tco',
  });
  assert.equal(
    (pass2.match(/<main\s+data-prerendered="true"/gi) || []).length,
    1,
    'Re-injecting metadata into dist/index.html must yield strictly 1 <main data-prerendered="true">'
  );
  assert.ok(
    pass2.includes('</main></div>'),
    'Re-injected root container must close cleanly with </main></div>'
  );

  // 5. Homepage hero headline & lazy calculator split verification
  assert.ok(
    rootDistHtml.includes('Know what your car really costs'),
    'dist/index.html must render branded hero headline'
  );
  assert.ok(
    !/<link\s+rel=["']modulepreload["'][^>]*calculators-/i.test(rootDistHtml),
    'dist/index.html must not eagerly modulepreload monolithic calculators chunk'
  );
});

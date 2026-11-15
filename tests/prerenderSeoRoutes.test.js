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
import { GUIDES_DATA } from '../src/data/guidesData.js';
import {
  PROGRAMMATIC_COMPARE_PAIRS,
  MILEAGE_BRACKET_SLUGS,
  generateFullVehicleObdMatrix,
} from '../src/data/seoMatrixData.js';

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

test('5. collectAllSeoRoutes: Generates complete inventory of 2,525 programmatic SEO routes', () => {
  const routes = collectAllSeoRoutes();
  assert.equal(routes.length, 2525, 'Total route count must match 2,525 programmatic SEO routes');

  const pathSet = new Set(routes.map((r) => r.path));

  // 16 Core & Legal Routes
  const requiredCoreRoutes = [
    '/tco',
    '/risk-matrix',
    '/obd-estimator',
    '/compare',
    '/checklist',
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

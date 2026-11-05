import assert from 'node:assert/strict';
import test from 'node:test';

import { computeBreakEvenTrajectory, generatePpiChecklist } from '../src/data/breakEvenAndPpi.js';
import { generateSitemapXml } from '../scripts/generate-sitemap-seo.mjs';
import { VEHICLE_PRESETS, getPresetById } from '../src/data/vehiclePresets.js';
import { OBD_CODES } from '../src/data/obdCodes.js';

// ============================================================================
// 1. "WHICH ONE TO BUY?" — BREAK-EVEN TRAJECTORY & CROSSOVER MATH
// ============================================================================

test('1. computeBreakEvenTrajectory: Calculates 5-Year Crossover Distance between EV and ICE', () => {
  const dieselCar = getPresetById('ford-focus-ecoblue');
  const evCar = getPresetById('tesla-model-3-lr');

  assert.ok(dieselCar, 'Must find diesel preset');
  assert.ok(evCar, 'Must find EV preset');

  const trajectory = computeBreakEvenTrajectory(dieselCar, evCar, {
    horizonYears: 5,
    annualDistanceMiles: 15000,
  });

  assert.ok(trajectory, 'Trajectory result must be defined');
  assert.equal(trajectory.points.length, 9, 'Must generate 9 discrete distance sampling points');

  // Validate points monotonicity
  for (let i = 1; i < trajectory.points.length; i++) {
    const prev = trajectory.points[i - 1];
    const curr = trajectory.points[i];
    assert.ok(curr.distMiles > prev.distMiles, 'Distance must strictly increase');
    assert.ok(curr.costA > prev.costA, 'Cumulative cost A must increase with distance');
    assert.ok(curr.costB > prev.costB, 'Cumulative cost B must increase with distance');
  }

  // Crossover check: Tesla has higher initial price, but lower cost per mile
  assert.ok(['crossover', 'a_always_cheaper', 'b_always_cheaper'].includes(trajectory.status));
  if (trajectory.status === 'crossover') {
    assert.ok(Number.isFinite(trajectory.breakEvenMiles), 'Break-even miles must be a finite number');
    assert.ok(trajectory.breakEvenMiles > 0, 'Break-even miles must be positive');
    assert.ok(trajectory.breakEvenKm > 0, 'Break-even km must be positive');
    assert.ok(trajectory.breakEvenYears > 0, 'Break-even years must be positive');
  }
});

test('2. computeBreakEvenTrajectory: Handles Dominant Model (Always Cheaper) Cleanly', () => {
  const cheapCar = getPresetById('toyota-corolla-18-hybrid');
  const expensiveCar = getPresetById('bmw-330i-g20');

  // Corolla is cheaper upfront and cheaper to run than 330i
  const trajectory = computeBreakEvenTrajectory(expensiveCar, cheapCar, {
    horizonYears: 5,
    annualDistanceMiles: 12000,
  });

  assert.equal(trajectory.status, 'b_always_cheaper', 'Corolla must be always cheaper than BMW 330i');
  assert.equal(trajectory.breakEvenMiles, 0);
  assert.equal(trajectory.breakEvenKm, 0);
});

// ============================================================================
// 2. PRE-PURCHASE INSPECTION (PPI) CHECKLIST GENERATION
// ============================================================================

test('3. generatePpiChecklist: Synthesizes 5-8 Items with Engine-Specific Known Defects', () => {
  // A. Ford Focus 2.0 EcoBlue (Panther)
  const focus = getPresetById('ford-focus-ecoblue');
  const focusChecklist = generatePpiChecklist(focus, 140000);

  assert.ok(focusChecklist.length >= 5 && focusChecklist.length <= 8, `Expected 5-8 items, got ${focusChecklist.length}`);

  // Must include model-specific items
  const modelSpecificItems = focusChecklist.filter((s) => s.isModelSpecific);
  assert.ok(modelSpecificItems.length >= 1, 'Must include at least 1 model-specific defect item');

  // Check CP4 or wet belt mention for Panther diesel
  const hasFuelOrBelt = focusChecklist.some(
    (s) =>
      s.title.includes('CP4') ||
      s.title.toLowerCase().includes('belt') ||
      s.title.toLowerCase().includes('pump') ||
      s.focus.toLowerCase().includes('pump') ||
      s.inspectionMethod.toLowerCase().includes('filter') ||
      s.inspectionMethod.toLowerCase().includes('swarf')
  );
  assert.ok(hasFuelOrBelt, 'Focus 2.0 EcoBlue checklist must inspect CP4 pump or wet belt');

  // Must include mandatory baseline physical checks
  assert.ok(focusChecklist.some((s) => s.id === 'step-obd-scan'), 'Must include OBD-II scan');
  assert.ok(focusChecklist.some((s) => s.id === 'step-body-chassis'), 'Must include body/paint thickness check');
  assert.ok(focusChecklist.some((s) => s.id === 'step-cold-start'), 'Must include cold start check');
});

test('4. generatePpiChecklist: Adapts Specifically for Electric Vehicles (Tesla Model 3)', () => {
  const tesla = getPresetById('tesla-model-3-lr');
  const teslaChecklist = generatePpiChecklist(tesla, 80000);

  assert.ok(teslaChecklist.length >= 5 && teslaChecklist.length <= 8);

  // Must NOT include combustion engine oil cap / fuel injection steps
  for (const s of teslaChecklist) {
    if (s.isModelSpecific) {
      assert.ok(
        !s.title.includes('EGR') &&
        !s.title.includes('DPF') &&
        !s.title.toLowerCase().includes('flywheel') &&
        !s.title.toLowerCase().includes('clutch') &&
        !s.title.includes('Kettostomegu')
      );
    }
  }

  // Must include high-voltage or suspension checks
  const hasEvSpecific = teslaChecklist.some(
    (s) => s.isModelSpecific || s.keyPids.includes('Voltage') || s.title.includes('OBD')
  );
  assert.ok(hasEvSpecific, 'Tesla checklist must include appropriate telemetry verification');
});

test('5. generatePpiChecklist: All Items Have Complete Telemetry Attributes', () => {
  const camry = getPresetById('toyota-camry-hybrid');
  const items = generatePpiChecklist(camry, 100000);

  for (const item of items) {
    assert.ok(item.id, 'Item must have an id');
    assert.ok(item.title && item.title.length >= 5, 'Title must be descriptive');
    assert.ok(['critical', 'moderate', 'low'].includes(item.riskLevel), `Invalid riskLevel: ${item.riskLevel}`);
    assert.ok(item.estSaving, 'Item must have estimated saving/risk cost');
    assert.ok(item.focus, 'Item must have focus summary');
    assert.ok(item.inspectionMethod, 'Item must have physical inspection instructions');
    assert.ok(item.keyPids, 'Item must have target PIDs or physical inspection tools');
  }
});

// ============================================================================
// 3. PROGRAMMATIC SEO & BUILD-TIME SITEMAP GENERATOR
// ============================================================================

test('6. generateSitemapXml: Generates Valid XML with Core, Preset and Diagnostic Routes', () => {
  const { xml, count } = generateSitemapXml();

  assert.ok(count >= 1000, `Expected at least 1000 sitemap entries, got ${count}`);
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'XML declaration required');
  assert.ok(xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'Valid urlset xmlns required');
  assert.ok(xml.endsWith('</urlset>'), 'Closing urlset tag required');

  // Verify Core Routes exist
  assert.ok(xml.includes('<loc>https://shiftmetric.com/</loc>'), 'Homepage route required');
  assert.ok(xml.includes('<loc>https://shiftmetric.com/compare</loc>'), 'Compare route required');
  assert.ok(xml.includes('<loc>https://shiftmetric.com/checklist</loc>'), 'Checklist route required');
  assert.ok(xml.includes('<loc>https://shiftmetric.com/tco</loc>'), 'TCO route required');
  assert.ok(xml.includes('<loc>https://shiftmetric.com/risk-matrix</loc>'), 'Risk matrix route required');

  // Verify Programmatic Vehicle Routes
  assert.ok(xml.includes('<loc>https://shiftmetric.com/checklist?preset=ford-focus-ecoblue</loc>'));
  assert.ok(xml.includes('<loc>https://shiftmetric.com/compare?presetA=tesla-model-3-lr</loc>'));

  // Verify Hybrid OBD-II Routes
  assert.ok(xml.includes('/obd/ford-focus-ecoblue/p2002</loc>'));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  vehicleDataService,
  VehicleDataService,
} from '../src/services/vehicleDataService.js';
import {
  convertMpgToL100Km,
  fetchNhtsaRecalls,
  fetchNhtsaComplaints,
  fetchEpaFuelEconomy,
} from '../src/services/vehicleApi.ts';

test('1. convertMpgToL100Km Mathematical Precision & Boundary Handling', () => {
  // Standard conversion checks
  // Formula: L/100km = 235.214583 / mpg
  assert.equal(convertMpgToL100Km(40), 5.9);
  assert.equal(convertMpgToL100Km(50), 4.7);
  assert.equal(convertMpgToL100Km(23.5), 10.0);

  // Boundary conditions: 0 or negative
  assert.equal(convertMpgToL100Km(0), 0);
  assert.equal(convertMpgToL100Km(-15), 0);
  assert.equal(convertMpgToL100Km(NaN), 0);
});

test('2. Instant Curated Fallback (<50ms) Response Guarantee', async () => {
  const service = new VehicleDataService();

  const start = performance.now();
  const intel = await service.getVehicleIntelligence({
    make: 'Ford',
    model: 'Focus',
    year: 2021,
    engineId: 'ford-focus-mk4-20-ecoblue',
    timeoutMs: 1, // trigger instant timeout fallback
    bypassCache: true,
  });
  const duration = performance.now() - start;

  assert.ok(
    duration < 50,
    `Fallback response must take < 50ms, took ${duration.toFixed(2)}ms`
  );
  assert.equal(intel.brand, 'Ford');
  assert.equal(intel.model, 'Focus');
  assert.ok(intel.engine, 'Must have resolved engine');
  assert.equal(intel.engine.id, 'ford-focus-mk4-20-ecoblue');
  assert.ok(intel.knownIssues.length >= 3, 'Must include known issues in fallback');
  assert.ok(intel.nhtsaRecalls.length >= 1, 'Must include curated recalls fallback');
  assert.ok(intel.nhtsaComplaints.topComponents.length >= 1, 'Must include complaints fallback');
  assert.ok(intel.fuelEconomy.combinedMpg > 0, 'Must include fuel economy fallback');
  assert.equal(intel.metadata.source, 'curated-fallback');
});

test('3. In-Memory Cache Multi-Tier Speed & Key Management', async () => {
  const service = new VehicleDataService();
  service.clearCache();

  // Populate cache
  await service.getVehicleIntelligence({
    make: 'BMW',
    model: '3 Series',
    year: 2021,
    engineId: 'bmw-320d-b47-g20',
    timeoutMs: 1,
  });

  const statsAfterFirst = service.getCacheStats();
  assert.ok(statsAfterFirst.memoryEntriesCount >= 1, 'Cache should have entries');

  // Second invocation should hit memory cache immediately (< 5ms)
  const start = performance.now();
  const cachedIntel = await service.getVehicleIntelligence({
    make: 'BMW',
    model: '3 Series',
    year: 2021,
    engineId: 'bmw-320d-b47-g20',
  });
  const duration = performance.now() - start;

  assert.ok(
    duration < 10,
    `Memory cache lookup must take < 10ms, took ${duration.toFixed(2)}ms`
  );
  assert.equal(cachedIntel.metadata.source, 'memory-cache');
  assert.equal(cachedIntel.brand, 'BMW');

  // Clear cache and verify count resets
  service.clearCache();
  const statsAfterClear = service.getCacheStats();
  assert.equal(statsAfterClear.memoryEntriesCount, 0);
});

test('4. Live NHTSA Recalls & Complaints Integration Network Test', async (t) => {
  // Test live API directly over network
  let recalls;
  try {
    recalls = await fetchNhtsaRecalls('toyota', 'rav4', 2021);
  } catch (err) {
    t.skip(`Skipping live NHTSA recalls test due to network constraint: ${err.message}`);
    return;
  }

  assert.ok(Array.isArray(recalls), 'Recalls must be an array');
  if (recalls.length > 0) {
    const firstRecall = recalls[0];
    assert.ok(firstRecall.campaignNumber, 'Recall must have campaignNumber');
    assert.ok(firstRecall.component, 'Recall must have component');
    assert.ok(typeof firstRecall.summary === 'string', 'Recall must have summary string');
  }

  // Complaints test
  let complaints;
  try {
    complaints = await fetchNhtsaComplaints('toyota', 'rav4', 2021);
  } catch (err) {
    t.skip(`Skipping live NHTSA complaints test due to network constraint: ${err.message}`);
    return;
  }

  assert.ok(complaints.totalCount > 0, 'Toyota RAV4 2021 should have recorded complaints');
  assert.ok(Array.isArray(complaints.topComponents), 'Complaints must aggregate top components');
  assert.ok(Array.isArray(complaints.sampleComplaints), 'Complaints must include sample reports');
});

test('5. Live EPA FuelEconomy API Integration Network Test', async (t) => {
  let epaData;
  try {
    epaData = await fetchEpaFuelEconomy('Toyota', 'RAV4', 2021);
  } catch (err) {
    t.skip(`Skipping live EPA test due to network constraint: ${err.message}`);
    return;
  }

  if (epaData) {
    assert.ok(epaData.combinedMpg > 20, 'EPA combined MPG should be realistic');
    assert.ok(epaData.cityMpg > 0, 'EPA city MPG should be > 0');
    assert.ok(epaData.highwayMpg > 0, 'EPA highway MPG should be > 0');
    assert.ok(epaData.lPer100Km > 0, 'L/100km should be calculated');
    assert.equal(epaData.source, 'EPA FuelEconomy.gov Official Database');
  }
});

test('6. VehicleDataService Robustness with Edge Cases & Unknown Vehicles', async () => {
  const service = new VehicleDataService();

  // Edge case: completely unknown vehicle
  const unknownIntel = await service.getVehicleIntelligence({
    make: 'NonExistentBrand123',
    model: 'FictionalModel456',
    year: 1999,
    timeoutMs: 5,
  });

  assert.ok(unknownIntel, 'Must return fallback response even for unknown vehicle');
  assert.equal(unknownIntel.brand, 'NonExistentBrand123');
  assert.equal(unknownIntel.model, 'FictionalModel456');
  assert.equal(unknownIntel.engine, null);
  assert.deepEqual(unknownIntel.knownIssues, []);
  assert.ok(unknownIntel.fuelEconomy.combinedMpg > 0);

  // Edge case: Empty / null inputs
  const emptyIntel = await service.getVehicleIntelligence({
    make: null,
    model: undefined,
    year: null,
    timeoutMs: 5,
  });

  assert.ok(emptyIntel);
  assert.ok(emptyIntel.metadata.responseTimeMs >= 0);
});

test('7. Synchronous / Instant Curated Intelligence (getCuratedIntelligence)', () => {
  const service = new VehicleDataService();

  const start = performance.now();
  const intel = service.getCuratedIntelligence({
    make: 'Ford',
    model: 'Focus',
    year: 2021,
    engineId: 'ford-focus-mk4-20-ecoblue',
  });
  const duration = performance.now() - start;

  assert.ok(duration < 10, `Synchronous lookup took ${duration.toFixed(2)}ms, expected < 10ms`);
  assert.equal(intel.brand, 'Ford');
  assert.equal(intel.model, 'Focus');
  assert.equal(intel.engine.id, 'ford-focus-mk4-20-ecoblue');
  assert.ok(intel.knownIssues.length >= 3);
  assert.ok(intel.nhtsaRecalls.length >= 1);
  assert.ok(intel.nhtsaComplaints.topComponents.length >= 1);
  assert.equal(intel.metadata.source, 'curated-fallback');
});

test('8. Explicit Offline Mode (offline: true) Zero-Latency Fallback Guarantee', async () => {
  const service = new VehicleDataService();

  const start = performance.now();
  const intel = await service.getVehicleIntelligence({
    make: 'Tesla',
    model: 'Model 3',
    year: 2022,
    engineId: 'tesla-model-3-rwd-lfp',
    offline: true,
  });
  const duration = performance.now() - start;

  assert.ok(duration < 15, `Offline intelligence lookup took ${duration.toFixed(2)}ms, expected < 15ms`);
  assert.equal(intel.metadata.source, 'curated-fallback');
  assert.ok(intel.knownIssues.length >= 2, 'Must include Tesla LFP known issues');
  assert.ok(intel.nhtsaRecalls.length >= 1, 'Must include curated upper control arm recall');
});

test('9. International Curated Fallback Recalls Coverage (Stellantis & Mercedes)', async () => {
  const service = new VehicleDataService();

  // Test Stellantis / Peugeot PureTech recall
  const stellantisRecalls = await service.getRecalls('Peugeot', '208', 2021, { timeoutMs: 1 });
  assert.ok(stellantisRecalls.data.length >= 1, 'Peugeot must have curated wet belt recall');
  assert.ok(stellantisRecalls.data[0].summary.includes('wet belt') || stellantisRecalls.data[0].summary.includes('timing belt'));

  // Test Mercedes-Benz OM654 recall
  const mbRecalls = await service.getRecalls('Mercedes-Benz', 'C-Class', 2020, { timeoutMs: 1 });
  assert.ok(mbRecalls.data.length >= 1, 'Mercedes must have curated coolant switching valve recall');
  assert.ok(mbRecalls.data[0].campaignNumber.includes('MB-20V-704'));
});


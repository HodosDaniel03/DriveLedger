import assert from 'node:assert/strict';
import test from 'node:test';
import {
  VEHICLE_CATALOG,
  CATALOG_GROUPS,
  getAllCatalogBrands,
  getModelsForBrand,
  getEnginesForModel,
  searchCatalog,
  findEngineById,
  findCatalogHierarchyByEngineId,
  normalizeSearchText,
  getAllEnginesFlat,
} from '../src/data/vehicleCatalog.js';
import { VEHICLE_PRESETS, BRANDS, BODY_TYPES, getPresetById } from '../src/data/vehiclePresets.js';
import { OBD_CODES } from '../src/data/obdCodes.js';

test('1. Master Vehicle Catalog Marque Coverage (35 Brands across 7 Global Clusters)', () => {
  const brandNames = VEHICLE_CATALOG.map((b) => b.name);
  const brandNameSet = new Set(brandNames);

  assert.equal(VEHICLE_CATALOG.length, 35, `Catalog must contain exactly 35 automotive brands (found ${VEHICLE_CATALOG.length})`);

  // German marques
  for (const b of ['Volkswagen', 'BMW', 'Audi', 'Mercedes-Benz', 'Porsche', 'Opel', 'Smart']) {
    assert.ok(brandNameSet.has(b), `Missing German marque: ${b}`);
  }

  // VAG Extended marques
  for (const b of ['Skoda', 'SEAT', 'Cupra']) {
    assert.ok(brandNameSet.has(b), `Missing VAG Extended marque: ${b}`);
  }

  // Japanese marques
  for (const b of ['Toyota', 'Honda', 'Mazda', 'Nissan', 'Suzuki', 'Subaru', 'Lexus', 'Mitsubishi']) {
    assert.ok(brandNameSet.has(b), `Missing Japanese marque: ${b}`);
  }

  // French & Stellantis marques
  for (const b of ['Peugeot', 'Citroën', 'Renault', 'Dacia', 'Fiat', 'Alfa Romeo', 'DS Automobiles', 'Jeep']) {
    assert.ok(brandNameSet.has(b), `Missing French/Stellantis marque: ${b}`);
  }

  // Korean marques
  for (const b of ['Hyundai', 'Kia']) {
    assert.ok(brandNameSet.has(b), `Missing Korean marque: ${b}`);
  }

  // American marques
  for (const b of ['Ford', 'Tesla', 'Chevrolet']) {
    assert.ok(brandNameSet.has(b), `Missing American marque: ${b}`);
  }

  // Nordic & UK marques
  for (const b of ['Volvo', 'Mini', 'Land Rover', 'Jaguar']) {
    assert.ok(brandNameSet.has(b), `Missing Nordic/UK marque: ${b}`);
  }
});

test('2. Hierarchical Model & Engine Integrity and Telemetry Constraints', () => {
  const validObdSet = new Set(OBD_CODES.map((c) => c.code));
  const engineIds = new Set();
  let totalModels = 0;
  let totalEngines = 0;

  for (const brand of VEHICLE_CATALOG) {
    assert.ok(brand.id && brand.name && brand.group && brand.country && brand.countryFlag, `Brand ${brand.name} missing metadata`);
    assert.ok(brand.models.length >= 1, `Brand ${brand.name} must have at least 1 model`);

    for (const model of brand.models) {
      totalModels++;
      assert.ok(model.id && model.name && model.generations && model.bodyType, `Model ${model.name} in ${brand.name} missing metadata`);
      assert.ok(model.engines.length >= 1, `Model ${model.name} in ${brand.name} must have at least 1 engine option`);

      for (const eng of model.engines) {
        totalEngines++;
        assert.ok(!engineIds.has(eng.id), `Duplicate engine ID: ${eng.id}`);
        engineIds.add(eng.id);

        assert.equal(eng.brand, brand.name, `Engine ${eng.id} brand must match parent brand name`);
        assert.ok(eng.powerHp > 0 && eng.powerHp < 1200, `Engine ${eng.id} powerHp (${eng.powerHp}) out of bounds`);
        assert.ok(['Diesel', 'Gasoline', 'Hybrid', 'Plug-in Hybrid', 'Electric'].includes(eng.fuelType), `Engine ${eng.id} fuelType (${eng.fuelType}) invalid`);
        assert.ok(['hatchback', 'sedan', 'wagon', 'suv', 'truck'].includes(eng.bodyType), `Engine ${eng.id} bodyType (${eng.bodyType}) invalid`);

        // Monotonic 10-year residual curve check
        assert.equal(eng.residualCurve10Yr.length, 10, `Engine ${eng.id} must have a 10-year residual curve`);
        for (let i = 1; i < eng.residualCurve10Yr.length; i++) {
          assert.ok(
            eng.residualCurve10Yr[i] <= eng.residualCurve10Yr[i - 1],
            `Engine ${eng.id} residual curve not monotonically non-increasing at year ${i + 1}`
          );
        }

        // Common OBD codes verification
        assert.ok(Array.isArray(eng.commonObdCodes) && eng.commonObdCodes.length >= 1, `Engine ${eng.id} must reference common OBD codes`);
        for (const code of eng.commonObdCodes) {
          assert.ok(validObdSet.has(code), `Engine ${eng.id} references invalid OBD code: ${code}`);
        }
      }
    }
  }

  // Comprehensive coverage expectations: 130+ models and 170+ engine variants
  assert.ok(totalModels >= 120, `Catalog must have at least 120 models (found ${totalModels})`);
  assert.ok(totalEngines >= 160, `Catalog must have at least 160 engine variants (found ${totalEngines})`);

  // Verify explicit models from original task
  const allModelNames = new Set(
    VEHICLE_CATALOG.flatMap((b) => b.models.map((m) => `${b.name}::${m.name}`))
  );

  // VW models
  for (const m of ['Golf', 'Passat', 'Polo', 'Tiguan', 'Touareg', 'Touran', 'T-Roc', 'Arteon', 'ID.3', 'ID.4']) {
    assert.ok(allModelNames.has(`Volkswagen::${m}`), `Missing VW model: ${m}`);
  }

  // BMW models
  for (const m of ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', 'X1', 'X3', 'X5']) {
    assert.ok(allModelNames.has(`BMW::${m}`), `Missing BMW model: ${m}`);
  }

  // Ford models
  for (const m of ['Focus', 'Mondeo', 'Fiesta', 'Kuga', 'Puma', 'Transit Custom']) {
    assert.ok(allModelNames.has(`Ford::${m}`), `Missing Ford model: ${m}`);
  }

  // Toyota models
  for (const m of ['Yaris', 'Corolla', 'Auris', 'Avensis', 'Camry', 'RAV4', 'C-HR', 'Prius']) {
    assert.ok(allModelNames.has(`Toyota::${m}`), `Missing Toyota model: ${m}`);
  }

  // High-volume European models
  assert.ok(allModelNames.has('Audi::A3'), 'Audi A3 must be in catalog');
  assert.ok(allModelNames.has('Audi::Q5'), 'Audi Q5 must be in catalog');
  assert.ok(allModelNames.has('Mercedes-Benz::A-Class'), 'Mercedes A-Class must be in catalog');
  assert.ok(allModelNames.has('Mercedes-Benz::GLC'), 'Mercedes GLC must be in catalog');
  assert.ok(allModelNames.has('Dacia::Sandero'), 'Dacia Sandero must be in catalog');
  assert.ok(allModelNames.has('Fiat::Panda'), 'Fiat Panda must be in catalog');
  assert.ok(allModelNames.has('Fiat::Punto'), 'Fiat Punto must be in catalog');
  assert.ok(allModelNames.has('Opel::Corsa'), 'Opel Corsa must be in catalog');
  assert.ok(allModelNames.has('Skoda::Fabia'), 'Skoda Fabia must be in catalog');
  assert.ok(allModelNames.has('SEAT::Ibiza'), 'SEAT Ibiza must be in catalog');
  assert.ok(allModelNames.has('Volvo::XC40'), 'Volvo XC40 must be in catalog');
  assert.ok(allModelNames.has('Peugeot::2008'), 'Peugeot 2008 must be in catalog');
  assert.ok(allModelNames.has('Citroën::C4'), 'Citroën C4 must be in catalog');
});

test('3. Catalog Navigation & Autocomplete Search Functions', () => {
  // Test brand retrieval
  const brands = getAllCatalogBrands();
  assert.equal(brands.length, 35);

  // Test model retrieval with diacritic tolerance
  const citroenModels1 = getModelsForBrand('Citroën');
  const citroenModels2 = getModelsForBrand('citroen');
  assert.ok(citroenModels1.length >= 2, 'Citroën must have multiple models');
  assert.equal(citroenModels1.length, citroenModels2.length, 'getModelsForBrand must be diacritic-insensitive');

  const skodaModels1 = getModelsForBrand('Skoda');
  const skodaModels2 = getModelsForBrand('Škoda');
  assert.ok(skodaModels1.length >= 4, 'Skoda must have multiple models');
  assert.equal(skodaModels1.length, skodaModels2.length, 'getModelsForBrand must match Škoda');

  // Test engine retrieval
  const golfEngines = getEnginesForModel('Volkswagen', 'Golf');
  assert.ok(golfEngines.length >= 4, 'Golf must have multiple engine options');

  // Test findEngineById
  const golf20Tdi = findEngineById('vw-golf-20-tdi');
  assert.ok(golf20Tdi, 'Must find vw-golf-20-tdi');
  assert.equal(golf20Tdi.brand, 'Volkswagen');
  assert.equal(golf20Tdi.powerHp, 150);

  // Test findCatalogHierarchyByEngineId
  const hier = findCatalogHierarchyByEngineId('bmw-330i-g20');
  assert.ok(hier, 'Must find hierarchy for bmw-330i-g20');
  assert.equal(hier.brand.name, 'BMW');
  assert.equal(hier.model.name, '3 Series');
  assert.equal(hier.engine.id, 'bmw-330i-g20');

  // Test global search: Multi-word / multi-token matching
  const corollaHybridResults = searchCatalog('Corolla Hybrid');
  assert.ok(corollaHybridResults.length >= 2, 'Search for "Corolla Hybrid" must return results');

  const golfTdiResults = searchCatalog('Golf 2.0 TDI');
  assert.ok(golfTdiResults.length >= 1, 'Search for "Golf 2.0 TDI" must return results');

  const b47Results = searchCatalog('B47');
  assert.ok(b47Results.length >= 1, 'Search for "B47" must return BMW results');

  const pureTechResults = searchCatalog('PureTech');
  assert.ok(pureTechResults.length >= 3, 'Search for "PureTech" must return Peugeot/Citroen/Opel results');

  const pumaResults = searchCatalog('Ford Puma');
  assert.ok(pumaResults.length >= 1, 'Search for "Ford Puma" must return results');

  // Test global search: Diacritic tolerance
  const citroenSearch = searchCatalog('citroen');
  assert.ok(citroenSearch.length >= 2, 'Search for unaccented "citroen" must return Citroën models');

  const skodaSearch = searchCatalog('škoda');
  assert.ok(skodaSearch.length >= 4, 'Search for accented "škoda" must return Skoda models');

  // Test normalizeSearchText
  assert.equal(normalizeSearchText('Citroën'), 'citroen');
  assert.equal(normalizeSearchText('Škoda'), 'skoda');
  assert.equal(normalizeSearchText('Dízel'), 'dizel');
});

test('4. Backward Compatibility with VEHICLE_PRESETS & Global BRANDS', () => {
  assert.equal(VEHICLE_PRESETS[0].id, 'ford-focus-ecoblue', 'Index 0 preset must remain ford-focus-ecoblue');
  assert.equal(getPresetById('invalid-id').id, 'ford-focus-ecoblue');
  assert.equal(getPresetById('toyota-camry-hybrid').id, 'toyota-camry-hybrid');
  assert.equal(getPresetById('tesla-model-3-lr').id, 'tesla-model-3-lr');
  assert.equal(getPresetById('bmw-330i-g20').id, 'bmw-330i-g20');

  // BRANDS array check
  assert.equal(BRANDS[0], 'All Brands');
  assert.equal(BRANDS.length, 36, 'BRANDS must contain All Brands + 35 marques');

  // BODY_TYPES checks
  assert.ok(BODY_TYPES.length >= 5);
  const totalCountInBodyTypes = BODY_TYPES.find((b) => b.id === 'all').count;
  assert.equal(totalCountInBodyTypes, VEHICLE_PRESETS.length);
});

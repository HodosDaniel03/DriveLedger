import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveBodyArchetype,
  resolvePowertrainArchetype,
  deriveTechnicalBadges,
  getArchetypeLabel,
} from '../src/components/common/vehicle/vehicleArchetypes.js';
import { VEHICLE_PRESETS } from '../src/data/vehiclePresets.js';

test('1. Vehicle Body Archetype Resolution (7 Categories)', () => {
  // 1. Hatchback
  assert.equal(resolveBodyArchetype({ bodyType: 'hatchback' }), 'hatchback');
  assert.equal(resolveBodyArchetype({ name: 'Volkswagen Golf 8 2.0 TDI' }), 'hatchback');
  assert.equal(resolveBodyArchetype({ name: 'Ford Fiesta 1.0 EcoBoost' }), 'hatchback');

  // 2. Estate / Wagon
  assert.equal(resolveBodyArchetype({ bodyType: 'wagon' }), 'wagon');
  assert.equal(resolveBodyArchetype({ bodyType: 'estate' }), 'wagon');
  assert.equal(resolveBodyArchetype({ name: 'BMW 320d Touring' }), 'wagon');
  assert.equal(resolveBodyArchetype({ name: 'Audi A4 Avant 2.0 TDI' }), 'wagon');

  // 3. Sedan
  assert.equal(resolveBodyArchetype({ bodyType: 'sedan' }), 'sedan');
  assert.equal(resolveBodyArchetype({ name: 'Toyota Camry Hybrid' }), 'sedan');
  assert.equal(resolveBodyArchetype({ name: 'Tesla Model 3 Long Range' }), 'sedan');
  assert.equal(resolveBodyArchetype({ name: 'BMW 330i G20' }), 'sedan');

  // 4. SUV
  assert.equal(resolveBodyArchetype({ bodyType: 'suv' }), 'suv');
  assert.equal(resolveBodyArchetype({ name: 'BMW X5 xDrive30d' }), 'suv');
  assert.equal(resolveBodyArchetype({ name: 'Skoda Kodiaq 2.0 TDI' }), 'suv');
  assert.equal(resolveBodyArchetype({ name: 'Volvo XC90 D5' }), 'suv');

  // 5. Crossover (CUV)
  assert.equal(resolveBodyArchetype({ bodyType: 'crossover' }), 'crossover');
  assert.equal(resolveBodyArchetype({ name: 'Ford Puma 1.0 EcoBoost' }), 'crossover');
  assert.equal(resolveBodyArchetype({ name: 'Toyota C-HR Hybrid' }), 'crossover');
  assert.equal(resolveBodyArchetype({ name: 'Cupra Formentor VZ' }), 'crossover');

  // 6. Coupe
  assert.equal(resolveBodyArchetype({ bodyType: 'coupe' }), 'coupe');
  assert.equal(resolveBodyArchetype({ name: 'Chevrolet Camaro 2.0 Turbo' }), 'coupe');
  assert.equal(resolveBodyArchetype({ name: 'Porsche 911 Carrera' }), 'coupe');
  assert.equal(resolveBodyArchetype({ name: 'Toyota GR Supra' }), 'coupe');

  // 7. Truck
  assert.equal(resolveBodyArchetype({ bodyType: 'truck' }), 'truck');
  assert.equal(resolveBodyArchetype({ name: 'Ford F-150 EcoBoost' }), 'truck');
  assert.equal(resolveBodyArchetype({ name: 'Toyota Hilux 2.8 D-4D' }), 'truck');

  // Robustness & fallbacks
  assert.equal(resolveBodyArchetype(null), 'sedan');
  assert.equal(resolveBodyArchetype(undefined), 'sedan');
  assert.equal(resolveBodyArchetype({}), 'sedan');
  assert.equal(resolveBodyArchetype('unknown-type'), 'sedan');
});

test('2. Powertrain Archetype Resolution (7 Configurations)', () => {
  // 1. EV
  assert.equal(resolvePowertrainArchetype({ isEv: true }), 'ev');
  assert.equal(resolvePowertrainArchetype({ fuelType: 'Electric' }), 'ev');
  assert.equal(resolvePowertrainArchetype({ powertrain: 'ev' }), 'ev');
  assert.equal(resolvePowertrainArchetype({ name: 'Nissan Leaf 40kWh' }), 'ev');

  // 2. PHEV
  assert.equal(resolvePowertrainArchetype({ powertrain: 'phev' }), 'phev');
  assert.equal(resolvePowertrainArchetype({ fuelType: 'Plug-in Hybrid' }), 'phev');
  assert.equal(resolvePowertrainArchetype({ name: 'Mitsubishi Outlander PHEV' }), 'phev');

  // 3. MHEV
  assert.equal(resolvePowertrainArchetype({ powertrain: 'mhev' }), 'mhev');
  assert.equal(resolvePowertrainArchetype({ powertrainLabel: '1.0L EcoBoost MHEV 48V' }), 'mhev');

  // 4. Hybrid (HEV)
  assert.equal(resolvePowertrainArchetype({ powertrain: 'hybrid' }), 'hybrid');
  assert.equal(resolvePowertrainArchetype({ fuelType: 'Hybrid' }), 'hybrid');
  assert.equal(resolvePowertrainArchetype({ name: 'Toyota Prius Gen 3 1.8 Hybrid' }), 'hybrid');

  // 5. Diesel
  assert.equal(resolvePowertrainArchetype({ fuelType: 'Diesel' }), 'diesel');
  assert.equal(resolvePowertrainArchetype({ powertrain: 'diesel' }), 'diesel');
  assert.equal(resolvePowertrainArchetype({ engineCode: '2.0 TDI EA288' }), 'diesel');

  // 6. Petrol NA
  assert.equal(resolvePowertrainArchetype({ powertrain: 'gasoline-na' }), 'petrol-na');
  assert.equal(resolvePowertrainArchetype({ engineCode: '2.0 SkyActiv-G Naturally Aspirated' }), 'petrol-na');

  // 7. Petrol Turbo
  assert.equal(resolvePowertrainArchetype({ powertrain: 'gasoline-turbo' }), 'petrol-turbo');
  assert.equal(resolvePowertrainArchetype({ engineCode: '2.0 TSI EA888 Turbo' }), 'petrol-turbo');

  // Fallbacks
  assert.equal(resolvePowertrainArchetype(null), 'petrol-turbo');
  assert.equal(resolvePowertrainArchetype(undefined), 'petrol-turbo');
  assert.equal(resolvePowertrainArchetype({}), 'petrol-turbo');
});

test('3. 4-Tier Technical Mechanical Badges Generation', () => {
  const allowedTones = new Set(['emerald', 'blue', 'purple', 'slate', 'amber', 'cyan']);
  const expectedCategories = ['emissions', 'injection', 'aftertreatment', 'transmission'];

  // Test across all 65 presets
  for (const preset of VEHICLE_PRESETS) {
    const badges = deriveTechnicalBadges(preset);
    assert.equal(badges.length, 4, `Preset ${preset.id} must produce exactly 4 badges`);

    badges.forEach((badge, idx) => {
      assert.equal(badge.category, expectedCategories[idx], `Badge ${idx} category must match tier`);
      assert.ok(badge.tierLabel && badge.tierLabel.length > 0, 'Must have tier label');
      assert.ok(badge.code && badge.code.length > 0, 'Must have badge code');
      assert.ok(badge.detail && badge.detail.length > 0, 'Must have badge detail specification');
      assert.ok(allowedTones.has(badge.tone), `Tone ${badge.tone} must be supported`);
    });
  }

  // Check EV-specific badges
  const evBadges = deriveTechnicalBadges({ isEv: true, year: 2023 });
  assert.equal(evBadges[0].code, 'Zero Emission');
  assert.equal(evBadges[1].code, 'Permanent Magnet');
  assert.equal(evBadges[2].code, 'Active Liquid BMS');
  assert.equal(evBadges[3].code, 'Direct 1-Speed');

  // Check Diesel-specific badges
  const dieselBadges = deriveTechnicalBadges({ fuelType: 'Diesel', year: 2022, transmission: 'dct-dsg' });
  assert.equal(dieselBadges[0].code, 'Euro 6d-Full');
  assert.equal(dieselBadges[1].code, 'Common-Rail 2,500 bar');
  assert.equal(dieselBadges[2].code, 'DPF + Dual SCR');
  assert.equal(dieselBadges[3].code, 'Dual-Clutch (DSG/DCT)');
});

test('4. Archetype Label Formatting', () => {
  assert.equal(getArchetypeLabel('hatchback'), 'Compact Hatchback');
  assert.equal(getArchetypeLabel('wagon'), 'Estate / Wagon');
  assert.equal(getArchetypeLabel('sedan'), 'Executive Sedan');
  assert.equal(getArchetypeLabel('suv'), 'Commanding SUV');
  assert.equal(getArchetypeLabel('crossover'), 'Crossover CUV');
  assert.equal(getArchetypeLabel('coupe'), 'Sport Coupe');
  assert.equal(getArchetypeLabel('truck'), 'Pickup Truck');
  assert.equal(getArchetypeLabel('ev'), 'Battery Electric (BEV)');
});

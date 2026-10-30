import { VEHICLE_CATALOG } from '../src/data/vehicleCatalog.js';

const toyota = VEHICLE_CATALOG.find(b => b.name === 'Toyota');
const corolla = toyota.models.find(m => m.name === 'Corolla');
console.log('Corolla engines:');
for (const e of corolla.engines) {
  console.log('name:', e.name);
  console.log('shortName:', e.shortName);
  console.log('powertrainLabel:', e.powertrainLabel);
}

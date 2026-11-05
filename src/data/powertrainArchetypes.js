/**
 * ShiftMetric — Normalized Powertrain Archetype & Brand Tier Telemetry Engine (Phase 5.1)
 * Decouples mechanical risk architectures (8 core powertrain archetypes) and brand labor/parts
 * tier multipliers from individual vehicle model shells, enabling compact normalized model records
 * to hydrate dynamically into full ShiftMetric TCO & Risk Matrix telemetry presets.
 */

export {
  POWERTRAIN_TYPES,
  PowertrainType,
  resolvePowertrainType,
  normalizePowertrainType,
  isPureElectric,
  calculateEvEnergyCost,
  calculatePhevEnergyCost,
  calculateVehicleEnergyCost,
  calculateBatterySoh,
  convertKwh100MiToKwh100Km,
  convertKwh100KmToKwh100Mi,
  convertKwh100MiToMiPerKwh,
  convertMiPerKwhToKwh100Mi,
} from './powertrainTypes.js';

import {
  POWERTRAIN_TYPES,
  resolvePowertrainType,
  isPureElectric,
} from './powertrainTypes.js';

const VALID_CATALOG_OBD_CODES = new Set([
  'P0420', 'P2002', 'P0299', 'P0171', 'P0300',
  'P0401', 'P0087', 'P0700', 'P2463', 'P0128',
  'P0455', 'P0016', 'P2015', 'P0101', 'U0100',
  'P0442', 'P0113', 'P0301', 'P20EE', 'P0A80',
]);

const FALLBACK_OBD_CODE_MAP = {
  P0524: 'P0171',
  P0AA6: 'U0100',
  P0562: 'P0128',
};

export const BRAND_TIER_MULTIPLIERS = {
  economy: {
    id: 'economy',
    label: 'Economy / Value Marque',
    multiplier: 1.0,
    laborMultiplier: 0.95,
  },
  mainstream: {
    id: 'mainstream',
    label: 'Mainstream Global Marque',
    multiplier: 1.15,
    laborMultiplier: 1.05,
  },
  premium: {
    id: 'premium',
    label: 'German / Luxury Premium',
    multiplier: 1.55,
    laborMultiplier: 1.45,
  },
  ev: {
    id: 'ev',
    label: 'Dedicated EV Architecture',
    multiplier: 0.90,
    laborMultiplier: 1.20,
  },
};

export const BRAND_TO_TIER = {
  // Economy / Value Marques
  Dacia: 'economy',
  Suzuki: 'economy',
  Fiat: 'economy',
  Skoda: 'economy',
  'Škoda': 'economy',
  SEAT: 'economy',
  Smart: 'economy',
  Mitsubishi: 'economy',
  Chevrolet: 'economy',

  // Mainstream Global Marques
  Ford: 'mainstream',
  Volkswagen: 'mainstream',
  Toyota: 'mainstream',
  Honda: 'mainstream',
  Hyundai: 'mainstream',
  Kia: 'mainstream',
  Peugeot: 'mainstream',
  'Citroën': 'mainstream',
  Citroen: 'mainstream',
  Renault: 'mainstream',
  Mazda: 'mainstream',
  Nissan: 'mainstream',
  Opel: 'mainstream',
  Cupra: 'mainstream',
  Subaru: 'mainstream',
  Jeep: 'mainstream',

  // German / Luxury Premium Marques
  BMW: 'premium',
  'Mercedes-Benz': 'premium',
  Audi: 'premium',
  Porsche: 'premium',
  Volvo: 'premium',
  Lexus: 'premium',
  'Land Rover': 'premium',
  Jaguar: 'premium',
  'Alfa Romeo': 'premium',
  Mini: 'premium',
  'DS Automobiles': 'premium',

  // Dedicated EV Architectures
  Tesla: 'ev',
  Polestar: 'ev',
  BYD: 'ev',
  Rivian: 'ev',
};

export const POWERTRAIN_ARCHETYPES = {
  'euro6-diesel-dpf-wetbelt': {
    id: 'euro6-diesel-dpf-wetbelt',
    name: 'Euro 6 Turbo-Diesel (Wet Belt / Chain + DPF/SCR)',
    label: 'Euro 6 Common-Rail Diesel (DPF / SCR AdBlue + Wet Belt)',
    shortLabel: 'Euro 6 Diesel (DPF/Wet-Belt)',
    exemplarEngines: 'Ford 2.0 EcoBlue / PSA 1.5 & 2.0 BlueHDi / Renault 1.5 dCi',
    fuelType: 'Diesel',
    powertrain: 'diesel',
    powertrainType: POWERTRAIN_TYPES.ICE_DIESEL,
    transmission: 'dct-dsg',
    transmissionLabel: '8-Speed Auto / 6-Speed Dual-Clutch',
    oemIntervalMiles: 120000,
    preventativeIntervalMiles: 60000,
    oemVsPreventativeLabel: 'OEM 120,000 mi vs. Preventative 60,000 mi',
    baseAnnualMaintenanceUsd: 850,
    maintenanceWearFactor: 1.28,
    criticalDefectTag: '⚠️ WET OIL PUMP BELT / DPF SOOT',
    knownRiskNotes:
      'Wet oil pump/timing belt elastomer degradation if oil service exceeds 10k mi (OEM 120k mi interval vs 60k mi preventative replacement); DPF soot loading and SCR AdBlue injector crusting under cold urban cycles; 2,000+ bar common-rail injector erosion.',
    commonObdCodes: ['P2002', 'P2463', 'P0401', 'P0299'],
    diagnosticCodes: ['P2002', 'P2463', 'P0401', 'P0299'],
    residualCurve10Yr: [0.81, 0.69, 0.59, 0.50, 0.43, 0.37, 0.31, 0.27, 0.23, 0.20],
    keyFailureModes: [
      'Wet oil pump / timing belt elastomer delamination in fuel-diluted oil',
      'DPF soot saturation & SCR AdBlue urea nozzle crystallization',
      'Common-rail 2,000+ bar piezo injector return leak-off',
    ],
  },

  'vag-2.0-tdi-dsg': {
    id: 'vag-2.0-tdi-dsg',
    name: 'VAG EA288 2.0 TDI + DQ381 Wet DSG',
    label: '2.0L TDI Common-Rail DPF/SCR (EA288) + 7-Speed Wet DSG',
    shortLabel: 'VAG 2.0 TDI + Wet DSG',
    exemplarEngines: 'VAG EA288 / EA288 evo 2.0 TDI + DQ250/DQ381 Wet-Clutch DSG',
    fuelType: 'Diesel',
    powertrain: 'diesel',
    powertrainType: POWERTRAIN_TYPES.ICE_DIESEL,
    transmission: 'dct-dsg',
    transmissionLabel: '7-Speed DSG Wet-Clutch (DQ381)',
    oemIntervalMiles: 80000,
    preventativeIntervalMiles: 40000,
    oemVsPreventativeLabel: 'OEM 80,000 mi vs. Preventative 40,000 mi',
    baseAnnualMaintenanceUsd: 740,
    maintenanceWearFactor: 1.15,
    criticalDefectTag: '⚠️ WATER PUMP SLEEVE OVERHEAT / DSG',
    knownRiskNotes:
      'Switchable water pump vacuum collar sticks shut causing rapid engine overheating at 50k–75k mi; DPF differential pressure sensor failure; Dual-Mass Flywheel chatter & DQ381 DSG mechatronics (OEM 80k mi vs Preventative 40k mi fluid service).',
    commonObdCodes: ['P2002', 'P0128', 'P0299', 'P0700'],
    diagnosticCodes: ['P2002', 'P0128', 'P0299', 'P0700'],
    residualCurve10Yr: [0.82, 0.71, 0.61, 0.52, 0.45, 0.39, 0.34, 0.29, 0.25, 0.21],
    keyFailureModes: [
      'Switchable water pump thermal sleeve seizure causing overheat',
      'DPF differential pressure sensor drift under short urban cycles',
      'Dual-Mass Flywheel (DMF) chatter & DQ381 DSG mechatronics wear',
    ],
  },

  'bmw-b47-zf8': {
    id: 'bmw-b47-zf8',
    name: 'Executive Longitudinal Diesel + ZF 8HP',
    label: '2.0L/3.0L Longitudinal Turbo-Diesel + ZF 8HP Torque-Converter Auto',
    shortLabel: 'Longitudinal Diesel + ZF 8HP',
    exemplarEngines: 'BMW B47/B57 + ZF 8HP / Mercedes OM654 + 9G-Tronic',
    fuelType: 'Diesel',
    powertrain: 'diesel',
    powertrainType: POWERTRAIN_TYPES.ICE_DIESEL,
    transmission: 'torque-converter',
    transmissionLabel: 'ZF 8HP 8-Speed Steptronic Automatic',
    oemIntervalMiles: 100000,
    preventativeIntervalMiles: 55000,
    oemVsPreventativeLabel: 'OEM "Lifetime" Fluid vs. Preventative 55,000 mi',
    baseAnnualMaintenanceUsd: 880,
    maintenanceWearFactor: 1.25,
    criticalDefectTag: '⚠️ EGR COOLER RECALL / REAR TIMING CHAIN',
    knownRiskNotes:
      'EGR cooler internal glycol leak thermal recall; rear-mounted firewall timing chain tensioner wear requiring gearbox removal; intake manifold swirl flap soot binding; ZF 8HP "lifetime fluid" fallacy vs mandatory 55k mi fluid/pan replacement.',
    commonObdCodes: ['P0401', 'P2002', 'P0700', 'P0299'],
    diagnosticCodes: ['P0401', 'P2002', 'P0700', 'P0299'],
    residualCurve10Yr: [0.81, 0.69, 0.59, 0.50, 0.43, 0.37, 0.32, 0.27, 0.23, 0.19],
    keyFailureModes: [
      'EGR cooler glycol fissure & plastic intake manifold thermal risk',
      'Firewall-side rear-mounted timing chain guide & tensioner wear',
      'Intake swirl flap actuator binding & ZF 8HP valve body wear past 55k mi',
    ],
  },

  'direct-inj-turbo-petrol': {
    id: 'direct-inj-turbo-petrol',
    name: 'GDI / TSI / TFSI / TwinPower Turbo Petrol',
    label: 'Direct-Injection Turbocharged Gasoline (GDI / TSI / TFSI)',
    shortLabel: 'GDI / TSI Turbo Petrol',
    exemplarEngines: 'VAG EA211/EA888 TSI, BMW B48, Honda 1.5 VTEC Turbo, Renault 1.3 TCe',
    fuelType: 'Gasoline',
    powertrain: 'gasoline-turbo',
    powertrainType: POWERTRAIN_TYPES.ICE_PETROL,
    transmission: 'dct-dsg',
    transmissionLabel: '7-Speed Dual-Clutch / 8-Speed Automatic',
    oemIntervalMiles: 90000,
    preventativeIntervalMiles: 50000,
    oemVsPreventativeLabel: 'OEM Unscheduled vs. Preventative 50,000 mi',
    baseAnnualMaintenanceUsd: 680,
    maintenanceWearFactor: 1.12,
    criticalDefectTag: '⚠️ INTAKE VALVE CARBON / THERMOSTAT HOUSING',
    knownRiskNotes:
      'Direct-injection intake valve carbon coking requiring walnut media blasting at 50k–60k mi; timing chain hydraulic tensioner wear; plastic water pump & thermostat housing hairline cracks; PCV breather diaphragm failure.',
    commonObdCodes: ['P0299', 'P0171', 'P0300', 'P0016'],
    diagnosticCodes: ['P0299', 'P0171', 'P0300', 'P0016'],
    residualCurve10Yr: [0.82, 0.71, 0.61, 0.53, 0.46, 0.40, 0.35, 0.30, 0.26, 0.22],
    keyFailureModes: [
      'Intake valve stem carbon coking (no port fuel wash)',
      'Timing chain tensioner ratchet wear & cold-start rattle',
      'Plastic water pump / thermostat housing thermal cracking & PCV failure',
    ],
  },

  'puretech-ecoboost-wetbelt': {
    id: 'puretech-ecoboost-wetbelt',
    name: '1.0 EcoBoost / 1.2 PureTech 3-Cyl Wet Belt Turbo',
    label: '3-Cylinder Turbo Gasoline (Belt-In-Oil Wet Timing Belt)',
    shortLabel: '3-Cyl Wet Belt Turbo',
    exemplarEngines: 'Ford 1.0L Fox EcoBoost / Stellantis 1.2L EB2 PureTech',
    fuelType: 'Gasoline',
    powertrain: 'gasoline-turbo',
    powertrainType: POWERTRAIN_TYPES.ICE_PETROL,
    transmission: 'manual',
    transmissionLabel: '6-Speed Manual / 8-Speed EAT8 Automatic',
    oemIntervalMiles: 100000,
    preventativeIntervalMiles: 40000,
    oemVsPreventativeLabel: 'OEM 100,000 mi vs. Critical 40,000 mi Belt Swap',
    baseAnnualMaintenanceUsd: 1260,
    maintenanceWearFactor: 1.65,
    criticalDefectTag: '🚨 WET TIMING BELT DELAMINATION & OIL STARVATION',
    knownRiskNotes:
      'Belt-in-oil elastomer delamination shedding rubber fibers that clog the oil pump pickup strainer and brake vacuum pump (starving bearings and turbocharger); low-speed pre-ignition (LSPI) and piston ring oil consumption.',
    commonObdCodes: ['P0016', 'P0524', 'P0299', 'P0300'],
    catalogObdCodes: ['P0016', 'P0171', 'P0299', 'P0300'],
    diagnosticCodes: ['P0016', 'P0524', 'P0299', 'P0300'],
    residualCurve10Yr: [0.73, 0.59, 0.48, 0.39, 0.32, 0.26, 0.21, 0.17, 0.14, 0.11],
    keyFailureModes: [
      'Belt-in-oil elastomer delamination clogging oil pickup strainer (P0524/P0016)',
      'Low-speed pre-ignition (LSPI) & oil control ring coking',
      'Brake vacuum pump screen blockage from wet-belt debris',
    ],
  },

  'toyota-hybrid-ecvt': {
    id: 'toyota-hybrid-ecvt',
    name: 'Atkinson Cycle HEV + Planetary e-CVT',
    label: 'Atkinson-Cycle Full Hybrid + Planetary Power-Split e-CVT',
    shortLabel: 'Atkinson Hybrid + e-CVT',
    exemplarEngines: 'Toyota 1.8/2.0/2.5 Dynamic Force HSD / Lexus 300h / Honda 2.0 e:HEV',
    fuelType: 'Hybrid',
    powertrain: 'hybrid',
    powertrainType: POWERTRAIN_TYPES.HEV,
    transmission: 'cvt-ecvt',
    transmissionLabel: 'Planetary Power-Split e-CVT (Zero Clutches/Belts)',
    oemIntervalMiles: 100000,
    preventativeIntervalMiles: 60000,
    oemVsPreventativeLabel: 'OEM 100,000 mi vs. Preventative 60,000 mi',
    baseAnnualMaintenanceUsd: 490,
    maintenanceWearFactor: 0.78,
    criticalDefectTag: '✅ PLANETARY E-CVT / HV FAN FILTER VIGILANCE',
    knownRiskNotes:
      'Zero clutch, starter, or alternator wear via planetary power-split e-CVT; requires HV battery cooling fan filter cleaning every 30k mi, EGR cooler passage soot cleaning past 90k mi, and inverter coolant loop maintenance.',
    commonObdCodes: ['P0A80', 'P0401', 'P0171', 'P0420'],
    diagnosticCodes: ['P0A80', 'P0401', 'P0171', 'P0420'],
    residualCurve10Yr: [0.89, 0.81, 0.74, 0.67, 0.61, 0.55, 0.50, 0.45, 0.41, 0.37],
    keyFailureModes: [
      'HV battery cooling fan lint blockage causing pack thermal throttling',
      'EGR cooler passage soot accumulation causing rough warm restarts',
      'Inverter coolant loop electric pump seepage at high mileage',
    ],
  },

  'phev-turbo-dct': {
    id: 'phev-turbo-dct',
    name: 'Plug-In Hybrid Turbo + Dual-Clutch / Auto',
    label: 'Plug-In Hybrid (PHEV) Turbo Gasoline + Integrated Electric DCT/Auto',
    shortLabel: 'PHEV Turbo + DCT/Auto',
    exemplarEngines: 'VAG 1.4/1.5 eHybrid GTE, BMW 330e/X5 45e, Volvo T6/T8 Recharge, Stellantis Hybrid4',
    fuelType: 'Plug-in Hybrid',
    powertrain: 'hybrid',
    powertrainType: POWERTRAIN_TYPES.PHEV,
    transmission: 'dct-dsg',
    transmissionLabel: '6/7-Speed Hybrid Dual-Clutch / 8-Speed Hybrid Auto',
    oemIntervalMiles: 75000,
    preventativeIntervalMiles: 38000,
    oemVsPreventativeLabel: 'OEM 75,000 mi vs. Preventative 38,000 mi',
    baseAnnualMaintenanceUsd: 820,
    maintenanceWearFactor: 1.22,
    criticalDefectTag: '⚠️ COLD-START FUEL DILUTION & HV THERMAL VALVE',
    knownRiskNotes:
      'Cold-start fuel dilution and moisture condensation in crankcase oil from frequent engine cycling without reaching full thermal equilibrium; HV battery thermal expansion valve faults; triple-clutch mechatronic fluid wear.',
    commonObdCodes: ['P0A80', 'P0700', 'P0171', 'P0300'],
    diagnosticCodes: ['P0A80', 'P0700', 'P0171', 'P0300'],
    residualCurve10Yr: [0.80, 0.68, 0.57, 0.48, 0.41, 0.35, 0.29, 0.25, 0.21, 0.18],
    keyFailureModes: [
      'Cold-start fuel dilution from frequent short ICE cycling',
      'HV battery chiller / thermal management valve failure',
      'Integrated traction motor + mechatronic clutch fluid degradation',
    ],
  },

  'bev-lithium': {
    id: 'bev-lithium',
    name: 'Battery Electric Single/Dual Motor',
    label: 'Dedicated Battery Electric Powertrain (NMC / LFP Pack)',
    shortLabel: 'Battery Electric (BEV)',
    exemplarEngines: 'Tesla 3/Y Dual-Motor, VW MEB ID.3/ID.4, Hyundai/Kia E-GMP, BMW eDrive',
    fuelType: 'Electric',
    powertrain: 'ev',
    powertrainType: POWERTRAIN_TYPES.EV,
    transmission: 'direct-drive',
    transmissionLabel: 'Single-Speed Fixed Reduction Gear',
    oemIntervalMiles: 120000,
    preventativeIntervalMiles: 60000,
    oemVsPreventativeLabel: 'OEM "Sealed" Drive Unit vs. 60,000 mi Reduction Oil',
    baseAnnualMaintenanceUsd: 420,
    maintenanceWearFactor: 0.74,
    criticalDefectTag: '⚠️ HV CHILLER VALVE & CONTROL ARM HYDRO-BUSHINGS',
    knownRiskNotes:
      'Zero engine oil or spark plug maintenance; HV chiller thermal expansion valve / heat pump refrigerant issues; reduction gear oil shear; heavy curb weight accelerates lower control arm hydro-bushings and inner tire shoulder wear.',
    commonObdCodes: ['U0100', 'P0A80'],
    catalogObdCodes: ['U0100', 'P0A80'],
    diagnosticCodes: ['U0100', 'P0A80'],
    residualCurve10Yr: [0.83, 0.71, 0.60, 0.51, 0.43, 0.36, 0.30, 0.25, 0.21, 0.18],
    keyFailureModes: [
      'HV chiller thermal expansion valve / heat pump manifold faults',
      'Drive unit reduction gear oil shear under instant EV torque',
      'Heavy curb weight lower control arm hydro-bushing & ball joint wear',
    ],
  },
};

// Attach non-enumerable array convenience helpers so POWERTRAIN_ARCHETYPES and BRAND_TIER_MULTIPLIERS
// work seamlessly whether accessed by key (dict[id]) or iterated/mapped like an array.
function attachCollectionHelpers(dictObj) {
  const values = () => Object.values(dictObj);
  Object.defineProperties(dictObj, {
    length: { get: () => values().length, enumerable: false },
    find: { value: (fn) => values().find(fn), enumerable: false },
    filter: { value: (fn) => values().filter(fn), enumerable: false },
    map: { value: (fn) => values().map(fn), enumerable: false },
    forEach: { value: (fn) => values().forEach(fn), enumerable: false },
    some: { value: (fn) => values().some(fn), enumerable: false },
    every: { value: (fn) => values().every(fn), enumerable: false },
    [Symbol.iterator]: { value: () => values()[Symbol.iterator](), enumerable: false },
  });
}

attachCollectionHelpers(POWERTRAIN_ARCHETYPES);
attachCollectionHelpers(BRAND_TIER_MULTIPLIERS);

export function getBrandTierForMake(makeOrBrand) {
  const normalized = String(makeOrBrand || '').trim();
  const tierId = BRAND_TO_TIER[normalized] || 'mainstream';
  return BRAND_TIER_MULTIPLIERS[tierId] || BRAND_TIER_MULTIPLIERS.mainstream;
}

export function resolveArchetypeIdForPreset(preset = {}) {
  if (preset.archetypeId && POWERTRAIN_ARCHETYPES[preset.archetypeId]) {
    return preset.archetypeId;
  }

  const brand = String(preset.brand || preset.make || '').trim();
  const fuelType = String(preset.fuelType || '').trim().toLowerCase();
  const powertrain = String(preset.powertrain || '').trim().toLowerCase();

  // Explicitly exclude knownRiskNotes and transmissionLabel from searchBlob
  // to prevent collisions (e.g. EAT8 matching 't8 ', SkyActiv-Drive matching 'skyactiv-d', or electrical notes matching 'electric')
  const searchBlob = [
    preset.id,
    preset.name,
    preset.shortName,
    preset.engineCode,
    preset.powertrainLabel,
    preset.segment,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // 1. BEV
  if (preset.isEv || fuelType === 'electric' || powertrain === 'ev' || powertrain === 'electric') {
    return 'bev-lithium';
  }

  // 2. PHEV
  if (
    fuelType === 'plug-in hybrid' ||
    fuelType === 'phev' ||
    fuelType.includes('plug-in') ||
    fuelType.includes('plugin') ||
    powertrain === 'phev' ||
    /\b(phev|plug-in|plugin|ehybrid|e-hybrid|gte|330e|45e)\b/i.test(searchBlob) ||
    /\bt8\s+(recharge|twin|awd|phev)\b/i.test(searchBlob) ||
    /\bt8\b/i.test(searchBlob) ||
    /\btfsi\s+e\b/i.test(searchBlob)
  ) {
    return 'phev-turbo-dct';
  }

  // 3. HEV
  if (
    fuelType === 'hybrid' ||
    fuelType === 'hev' ||
    powertrain === 'hybrid' ||
    powertrain === 'mhev' ||
    /\b(hybrid|hsd|e:hev|e-tech)\b/i.test(searchBlob)
  ) {
    return 'toyota-hybrid-ecvt';
  }

  // 4. Diesel
  if (
    fuelType === 'diesel' ||
    powertrain === 'diesel' ||
    /\b(diesel|tdi|bluehdi|ecoblue|crdi|d-4d|dci|multijet|cdi|did|skyactiv-d|ea288|ea189|b47|b57|om654)\b/i.test(searchBlob)
  ) {
    const vagBrands = new Set(['Volkswagen', 'Audi', 'Skoda', 'Škoda', 'SEAT', 'Cupra']);
    if (vagBrands.has(brand) || searchBlob.includes('tdi') || searchBlob.includes('ea288') || searchBlob.includes('ea189')) {
      return 'vag-2.0-tdi-dsg';
    }
    const execDieselBrands = new Set(['BMW', 'Mercedes-Benz', 'Land Rover', 'Jaguar', 'Volvo', 'Alfa Romeo']);
    if (
      execDieselBrands.has(brand) ||
      searchBlob.includes('b47') ||
      searchBlob.includes('b57') ||
      searchBlob.includes('om654') ||
      searchBlob.includes('zf 8hp')
    ) {
      return 'bmw-b47-zf8';
    }
    return 'euro6-diesel-dpf-wetbelt';
  }

  // 5. Wet Belt Gasoline
  if (
    searchBlob.includes('puretech') ||
    searchBlob.includes('1.0 ecoboost') ||
    searchBlob.includes('1.0l fox') ||
    searchBlob.includes('wet belt') ||
    searchBlob.includes('belt-in-oil') ||
    searchBlob.includes('eb2')
  ) {
    return 'puretech-ecoboost-wetbelt';
  }

  // 6. Default Petrol
  return 'direct-inj-turbo-petrol';
}

function sanitizeCatalogObdCodes(codes, fallbackCodes) {
  const raw = Array.isArray(codes) && codes.length > 0 ? codes : fallbackCodes;
  const mapped = raw.map((c) => (VALID_CATALOG_OBD_CODES.has(c) ? c : FALLBACK_OBD_CODE_MAP[c] || 'P0171'));
  return Array.from(new Set(mapped));
}

export function hydrateVehiclePreset(presetOrCompactRecord) {
  if (!presetOrCompactRecord) return presetOrCompactRecord;

  const overrides = presetOrCompactRecord.overrides || {};
  const merged = { ...presetOrCompactRecord, ...overrides };

  const brand = merged.brand || merged.make || 'Volkswagen';
  const modelName = merged.modelName || merged.model || 'Model';
  const archetypeId = resolveArchetypeIdForPreset(merged);
  const archetype = POWERTRAIN_ARCHETYPES[archetypeId] || POWERTRAIN_ARCHETYPES['direct-inj-turbo-petrol'];
  const brandTierObj = getBrandTierForMake(brand);

  const isEv = merged.isEv ?? (archetype.powertrain === 'ev' || archetype.fuelType === 'Electric');
  const fuelType = merged.fuelType || archetype.fuelType || (isEv ? 'Electric' : 'Gasoline');
  const powertrain = merged.powertrain || archetype.powertrain || (isEv ? 'ev' : 'gasoline-turbo');
  const powertrainType =
    merged.powertrainType ||
    archetype.powertrainType ||
    resolvePowertrainType({ ...merged, isEv, fuelType, powertrain, archetypeId });
  const purchasePriceUsd = merged.purchasePriceUsd ?? merged.basePrice ?? 28500;
  const powerHp = merged.powerHp ?? 150;
  const mpgUs = merged.mpgUs ?? (isEv ? 29.0 : archetype.fuelType === 'Diesel' ? 47.0 : 38.0);
  const bodyType = merged.bodyType || merged.bodyStyle || 'hatchback';
  const generation = merged.generation || '';
  const years = merged.years || String(merged.year || 2022);
  const year =
    merged.year ??
    (typeof years === 'string' && /\d{4}/.test(years)
      ? Number((years.match(/\d{4}/g) || []).slice(-1)[0])
      : 2022);

  const engineCode = merged.engineCode || archetype.shortLabel;
  const name =
    merged.name ||
    `${brand} ${modelName}${generation ? ` ${generation}` : ''} ${engineCode} (${powerHp} HP)`;
  const shortName = merged.shortName || `${brand} ${modelName} ${engineCode}`;

  const computedBaseMaintUsd = Math.round(archetype.baseAnnualMaintenanceUsd * brandTierObj.multiplier);
  const computedWearFactor = Number(
    (archetype.maintenanceWearFactor * (0.85 + 0.15 * brandTierObj.multiplier)).toFixed(2)
  );

  const rawObdCodes =
    merged.commonObdCodes || archetype.catalogObdCodes || archetype.commonObdCodes || (isEv ? ['U0100', 'P0A80'] : ['P0171']);
  const sanitized = Array.isArray(merged.commonObdCodes)
    ? merged.commonObdCodes
    : sanitizeCatalogObdCodes(rawObdCodes, isEv ? ['U0100', 'P0A80'] : ['P0171', 'P0299']);
  const commonObdCodes = isEv
    ? sanitized.filter((c) => c !== 'P0128' && c !== 'P0700')
    : sanitized;

  return {
    ...merged,
    id: merged.id,
    name,
    shortName,
    brand,
    make: merged.make || brand,
    modelName,
    model: merged.model || modelName,
    generation,
    years,
    year,
    bodyType,
    bodyStyle: merged.bodyStyle || bodyType,
    engineCode,
    powerHp,
    fuelType: merged.fuelType || archetype.fuelType,
    segment: merged.segment || `${brandTierObj.label} — ${archetype.shortLabel}`,
    powertrain: merged.powertrain || archetype.powertrain,
    powertrainType,
    powertrainLabel: merged.powertrainLabel || archetype.label,
    transmission: merged.transmission || archetype.transmission,
    transmissionLabel: merged.transmissionLabel || archetype.transmissionLabel,
    purchasePriceUsd,
    basePrice: merged.basePrice ?? purchasePriceUsd,
    defaultOdometerMiles: merged.defaultOdometerMiles ?? 38000,
    annualDistanceMiles: merged.annualDistanceMiles ?? 13000,
    mpgUs,
    isEv,
    defaultFuelPriceUsdGal:
      merged.defaultFuelPriceUsdGal ?? (isEv ? 0.16 : archetype.fuelType === 'Diesel' ? 4.10 : 3.90),
    annualInsuranceUsd:
      merged.annualInsuranceUsd ?? Math.round(1150 * brandTierObj.multiplier),
    baseAnnualMaintenanceUsd: merged.baseAnnualMaintenanceUsd ?? computedBaseMaintUsd,
    maintenanceWearFactor: merged.maintenanceWearFactor ?? computedWearFactor,
    rating: merged.rating ?? 4.5,
    criticalDefectTag: merged.criticalDefectTag || archetype.criticalDefectTag,
    residualCurve10Yr: Array.isArray(merged.residualCurve10Yr)
      ? merged.residualCurve10Yr
      : [...archetype.residualCurve10Yr],
    knownRiskNotes: merged.knownRiskNotes || archetype.knownRiskNotes,
    commonObdCodes,
    archetypeId,
    archetype,
    brandTier: brandTierObj.id,
    brandTierLabel: brandTierObj.label,
    brandTierMultiplier: brandTierObj.multiplier,
    brandLaborMultiplier: brandTierObj.laborMultiplier,
  };
}

/**
 * Compact normalized vehicle records (`VehicleModelPreset`) demonstrating decoupled
 * model shells hydrated automatically by `hydrateVehiclePreset` across all 8 archetypes.
 */
export const NORMALIZED_COMPACT_MODELS = [
  {
    id: 'ford-kuga-20-ecoblue-norm',
    make: 'Ford',
    model: 'Kuga',
    generation: 'Mk3',
    years: '2020-2024',
    bodyStyle: 'suv',
    archetypeId: 'euro6-diesel-dpf-wetbelt',
    basePrice: 28400,
    powerHp: 150,
    mpgUs: 44.5,
    overrides: {
      engineCode: '2.0L EcoBlue TDCi',
      shortName: 'Ford Kuga 2.0 EcoBlue',
    },
  },
  {
    id: 'skoda-superb-20-tdi-dsg-norm',
    make: 'Skoda',
    model: 'Superb Combi',
    generation: 'B8',
    years: '2019-2024',
    bodyStyle: 'wagon',
    archetypeId: 'vag-2.0-tdi-dsg',
    basePrice: 29200,
    powerHp: 190,
    mpgUs: 47.5,
    overrides: {
      engineCode: 'EA288 2.0 TDI SCR DSG',
      shortName: 'Skoda Superb 2.0 TDI DSG',
    },
  },
  {
    id: 'bmw-520d-g31-touring-norm',
    make: 'BMW',
    model: '5 Series Touring',
    generation: 'G31',
    years: '2018-2023',
    bodyStyle: 'wagon',
    archetypeId: 'bmw-b47-zf8',
    basePrice: 39800,
    powerHp: 190,
    mpgUs: 45.0,
    overrides: {
      engineCode: 'B47D20 2.0d + ZF 8HP',
      shortName: 'BMW 520d Touring (B47)',
    },
  },
  {
    id: 'audi-a3-35-tfsi-norm',
    make: 'Audi',
    model: 'A3 Sportback',
    generation: '8Y',
    years: '2020-2024',
    bodyStyle: 'hatchback',
    archetypeId: 'direct-inj-turbo-petrol',
    basePrice: 31500,
    powerHp: 150,
    mpgUs: 41.0,
    overrides: {
      engineCode: '1.5 TFSI EA211 evo',
      shortName: 'Audi A3 35 TFSI',
    },
  },
  {
    id: 'citroen-c3-12-puretech-norm',
    make: 'Citroën',
    model: 'C3',
    generation: 'Mk3',
    years: '2018-2023',
    bodyStyle: 'hatchback',
    archetypeId: 'puretech-ecoboost-wetbelt',
    basePrice: 15900,
    powerHp: 110,
    mpgUs: 44.0,
    overrides: {
      engineCode: '1.2L EB2 PureTech Wet Belt',
      shortName: 'Citroën C3 1.2 PureTech',
    },
  },
  {
    id: 'lexus-nx-350h-ecvt-norm',
    make: 'Lexus',
    model: 'NX 350h',
    generation: 'AZ20',
    years: '2022-2025',
    bodyStyle: 'suv',
    archetypeId: 'toyota-hybrid-ecvt',
    basePrice: 44500,
    powerHp: 240,
    mpgUs: 39.5,
    overrides: {
      engineCode: 'A25A-FXS 2.5L Hybrid e-CVT',
      shortName: 'Lexus NX 350h e-CVT',
    },
  },
  {
    id: 'volvo-xc60-t8-phev-norm',
    make: 'Volvo',
    model: 'XC60 Recharge',
    generation: 'SPA',
    years: '2021-2024',
    bodyStyle: 'suv',
    archetypeId: 'phev-turbo-dct',
    powertrainType: POWERTRAIN_TYPES.PHEV,
    basePrice: 49500,
    powerHp: 455,
    mpgUs: 34.0,
    overrides: {
      engineCode: '2.0T T8 Twin-Engine PHEV',
      shortName: 'Volvo XC60 T8 PHEV',
    },
  },
  {
    id: 'vw-id4-pro-bev-norm',
    make: 'Volkswagen',
    model: 'ID.4 Pro',
    generation: 'MEB',
    years: '2021-2024',
    bodyStyle: 'suv',
    archetypeId: 'bev-lithium',
    powertrainType: POWERTRAIN_TYPES.EV,
    isEv: true,
    basePrice: 38900,
    powerHp: 286,
    mpgUs: 29.0,
    overrides: {
      engineCode: 'APP550 Rear Permanent-Magnet Motor (77 kWh)',
      shortName: 'VW ID.4 Pro 77kWh',
    },
  },
];

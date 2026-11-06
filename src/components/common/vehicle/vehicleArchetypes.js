/**
 * DriveLedger Vehicle Archetypes & Engineering Telemetry Badge Resolver
 * 
 * Maps vehicle database records into:
 *  1. 7 Vector Body Archetypes ('hatchback', 'wagon', 'sedan', 'suv', 'crossover', 'coupe', 'truck')
 *  2. 7 Powertrain Archetypes ('diesel', 'petrol-turbo', 'petrol-na', 'hybrid', 'phev', 'mhev', 'ev')
 *  3. 4-Tier Mechanical Specification Badges (Emissions, Injection, Aftertreatment, Transmission)
 */

export {
  POWERTRAIN_TYPES,
  PowertrainType,
  resolvePowertrainType,
  normalizePowertrainType,
  isPureElectric,
} from '../../../data/powertrainTypes.js';

import {
  POWERTRAIN_TYPES,
  resolvePowertrainType,
  isPureElectric,
} from '../../../data/powertrainTypes.js';

/**
 * Normalizes vehicle object / style strings into one of the 7 canonical body archetypes.
 * @param {object|string} vehicle - Vehicle preset or catalog object, or body type string
 * @returns {'hatchback'|'wagon'|'sedan'|'suv'|'crossover'|'coupe'|'truck'}
 */
export function resolveBodyArchetype(vehicle) {
  if (!vehicle) return 'sedan';

  const bodyType = (
    typeof vehicle === 'string'
      ? vehicle
      : vehicle.bodyType || vehicle.bodyStyle || vehicle.segment || ''
  ).toLowerCase();

  const id = (vehicle.id || '').toLowerCase();
  const name = (vehicle.name || vehicle.modelName || '').toLowerCase();
  const text = `${bodyType} ${id} ${name}`;

  // 1. Truck / Pickup
  if (
    bodyType === 'truck' ||
    bodyType === 'pickup' ||
    text.includes('pickup') ||
    text.includes('f-150') ||
    text.includes('ranger') ||
    text.includes('hilux') ||
    text.includes('ram 1500') ||
    text.includes('silverado') ||
    text.includes('navara') ||
    text.includes('amarok')
  ) {
    return 'truck';
  }

  // 2. Coupe / Sports Car / Roadster
  if (
    bodyType === 'coupe' ||
    bodyType === 'cabriolet' ||
    bodyType === 'roadster' ||
    text.includes('camaro') ||
    text.includes('mustang') ||
    text.includes('911') ||
    text.includes('supra') ||
    text.includes('miata') ||
    text.includes('mx-5') ||
    text.includes('cayman') ||
    text.includes('boxster') ||
    text.includes('m4 coupe') ||
    text.includes('m2 coupe') ||
    text.includes('gr86') ||
    text.includes('brz') ||
    text.includes('tt coupe')
  ) {
    return 'coupe';
  }

  // 3. Crossover (CUV)
  // Distinct compact high-riding sporty crossovers
  if (
    bodyType === 'crossover' ||
    bodyType === 'cuv' ||
    text.includes('crossover') ||
    text.includes('puma') ||
    text.includes('c-hr') ||
    text.includes('captur') ||
    text.includes('juke') ||
    text.includes('formentor') ||
    text.includes('yaris cross') ||
    text.includes('kona') ||
    text.includes('niro') ||
    text.includes('mokka') ||
    text.includes('t-roc') ||
    text.includes('t-cross') ||
    text.includes('arona') ||
    text.includes('kamiq') ||
    text.includes('cx-30') ||
    text.includes('cx-3') ||
    text.includes('bayon') ||
    text.includes('stonic') ||
    text.includes('taigo')
  ) {
    return 'crossover';
  }

  // 4. Full SUV
  if (
    bodyType === 'suv' ||
    text.includes('suv') ||
    text.includes('kodiaq') ||
    text.includes('karoq') ||
    text.includes('tiguan') ||
    text.includes('touareg') ||
    text.includes('ateca') ||
    text.includes('tarraco') ||
    text.includes('rav4') ||
    text.includes('highlander') ||
    text.includes('cr-v') ||
    text.includes('hr-v') ||
    text.includes('xc40') ||
    text.includes('xc60') ||
    text.includes('xc90') ||
    text.includes('macan') ||
    text.includes('cayenne') ||
    text.includes('duster') ||
    text.includes('stelvio') ||
    text.includes('discovery') ||
    text.includes('evoque') ||
    text.includes('renegade') ||
    text.includes('compass') ||
    text.includes('sportage') ||
    text.includes('tucson') ||
    text.includes('outlander') ||
    text.includes('asx') ||
    text.includes('vitara') ||
    text.includes('scross') ||
    text.includes('forester') ||
    text.includes('f-pace') ||
    text.includes('x1') ||
    text.includes('x3') ||
    text.includes('x5') ||
    text.includes('q3') ||
    text.includes('q5') ||
    text.includes('q7') ||
    text.includes('gla') ||
    text.includes('glc') ||
    text.includes('gle')
  ) {
    return 'suv';
  }

  // 5. Estate / Wagon
  if (
    bodyType === 'wagon' ||
    bodyType === 'estate' ||
    text.includes('wagon') ||
    text.includes('estate') ||
    text.includes('touring') ||
    text.includes('avant') ||
    text.includes('variant') ||
    text.includes('combi') ||
    text.includes('kombi') ||
    text.includes('allroad') ||
    text.includes('shooting brake') ||
    text.includes('active tourer') ||
    text.includes('transit') ||
    text.includes('berlingo') ||
    text.includes('scenic')
  ) {
    return 'wagon';
  }

  // 6. Hatchback
  if (
    bodyType === 'hatchback' ||
    bodyType === 'hatch' ||
    text.includes('hatchback') ||
    text.includes('golf') ||
    text.includes('focus') ||
    text.includes('polo') ||
    text.includes('fiesta') ||
    text.includes('clio') ||
    text.includes('yaris') ||
    text.includes('a3') ||
    text.includes('a1') ||
    text.includes('1-series') ||
    text.includes('120d') ||
    text.includes('i30') ||
    text.includes('i20') ||
    text.includes('ceed') ||
    text.includes('fabia') ||
    text.includes('ibiza') ||
    text.includes('leon') ||
    text.includes('sandero') ||
    text.includes('punto') ||
    text.includes('500') ||
    text.includes('panda') ||
    text.includes('zoe') ||
    text.includes('leaf') ||
    text.includes('swift') ||
    text.includes('smart') ||
    text.includes('mini cooper') ||
    text.includes('c3') ||
    text.includes('c4')
  ) {
    return 'hatchback';
  }

  // 7. Sedan / Saloon (default standard 3-box profile)
  return 'sedan';
}

/**
 * Resolves the vehicle's powertrain into 7 technical classifications.
 * @param {object} vehicle
 * @returns {'diesel'|'petrol-turbo'|'petrol-na'|'hybrid'|'phev'|'mhev'|'ev'}
 */
export function resolvePowertrainArchetype(vehicle) {
  if (!vehicle) return 'petrol-turbo';

  const powertrain = (vehicle.powertrain || '').toLowerCase();
  const fuelType = (vehicle.fuelType || '').toLowerCase();
  const label = (vehicle.powertrainLabel || vehicle.engineCode || vehicle.name || '').toLowerCase();
  const isEv = Boolean(vehicle.isEv);

  // 1. Pure Electric (BEV)
  if (
    isEv ||
    powertrain === 'ev' ||
    powertrain === 'electric' ||
    fuelType === 'electric' ||
    label.includes('electric') ||
    label.includes('bev') ||
    label.includes('kwh')
  ) {
    return 'ev';
  }

  // 2. Plug-in Hybrid (PHEV)
  if (
    powertrain === 'phev' ||
    fuelType.includes('plug-in') ||
    label.includes('phev') ||
    label.includes('plug-in') ||
    label.includes('twin engine') ||
    label.includes('recharge phev') ||
    label.includes('tfsi e')
  ) {
    return 'phev';
  }

  // 3. Mild Hybrid (MHEV 48V)
  if (
    powertrain === 'mhev' ||
    label.includes('mhev') ||
    label.includes('mild hybrid') ||
    label.includes('48v') ||
    label.includes('eq boost') ||
    label.includes('e-boxer')
  ) {
    return 'mhev';
  }

  // 4. Full Hybrid (HEV)
  if (
    powertrain === 'hybrid' ||
    fuelType.includes('hybrid') ||
    label.includes('hybrid') ||
    label.includes('ehev') ||
    label.includes('e-tech') ||
    label.includes('self-charging') ||
    label.includes('hsd')
  ) {
    return 'hybrid';
  }

  // 5. Diesel
  if (
    fuelType === 'diesel' ||
    powertrain === 'diesel' ||
    label.includes('diesel') ||
    label.includes('tdi') ||
    label.includes('cdi') ||
    label.includes('dci') ||
    label.includes('ecoblue') ||
    label.includes('bluehdi') ||
    label.includes('hdi') ||
    label.includes('crdi') ||
    label.includes('multijet') ||
    label.includes('d-4d') ||
    label.includes('did') ||
    label.includes('skyactiv-d')
  ) {
    return 'diesel';
  }

  // 6. Naturally Aspirated Petrol
  if (
    powertrain === 'gasoline-na' ||
    powertrain === 'petrol-na' ||
    label.includes('naturally aspirated') ||
    label.includes('skyactiv-g') ||
    label.includes('skyactiv-x') ||
    label.includes('fire') ||
    label.includes('dpi') ||
    label.includes('2.5i') ||
    label.includes('dualjet')
  ) {
    return 'petrol-na';
  }

  // 7. Turbocharged Petrol
  return 'petrol-turbo';
}

/**
 * Returns a human-readable title for a body or powertrain archetype.
 * @param {string} archetype
 * @returns {string}
 */
export function getArchetypeLabel(archetype) {
  const map = {
    hatchback: 'Compact Hatchback',
    wagon: 'Estate / Wagon',
    sedan: 'Executive Sedan',
    suv: 'Commanding SUV',
    crossover: 'Crossover CUV',
    coupe: 'Sport Coupe',
    truck: 'Pickup Truck',
    diesel: 'Common-Rail Diesel',
    'petrol-turbo': 'Turbocharged Petrol',
    'petrol-na': 'Atmospheric Petrol',
    hybrid: 'Full Hybrid (HEV)',
    phev: 'Plug-in Hybrid (PHEV)',
    mhev: 'Mild Hybrid 48V (MHEV)',
    ev: 'Battery Electric (BEV)',
  };
  return map[archetype] || archetype;
}

/**
 * Generates an authoritative 4-tier technical specification badge set.
 * 
 * Tiers:
 *  1. Emissions Standard (Euro 6d / Zero Emission)
 *  2. Injection / Induction Architecture (Common-Rail 2,500 bar / Turbo GDI / Hairpin Synchronous)
 *  3. Aftertreatment & Filtration (DPF + Dual SCR / OPF Filter / Active BMS Thermal)
 *  4. Transmission Architecture (Wet DSG / ZF 8HP / e-CVT / Direct 1-Speed)
 * 
 * @param {object} vehicle
 * @returns {Array<{ category: string, tierLabel: string, code: string, detail: string, tone: 'emerald'|'blue'|'purple'|'slate'|'amber'|'cyan' }>}
 */
export function deriveTechnicalBadges(vehicle = {}) {
  const powertrain = resolvePowertrainArchetype(vehicle);
  const year = vehicle.year || 2021;
  const trans = (vehicle.transmission || vehicle.transmissionLabel || '').toLowerCase();
  const name = (vehicle.name || '').toLowerCase();
  const engine = (vehicle.engineCode || vehicle.powertrainLabel || '').toLowerCase();

  const badges = [];

  // ==========================================
  // TIER 1: EMISSIONS CERTIFICATION
  // ==========================================
  if (powertrain === 'ev') {
    badges.push({
      category: 'emissions',
      tierLabel: 'Emissions',
      code: 'Zero Emission',
      detail: '0 g/km CO₂ · WLTP Cycle Clean',
      tone: 'emerald',
    });
  } else if (powertrain === 'phev') {
    badges.push({
      category: 'emissions',
      tierLabel: 'Emissions',
      code: 'Euro 6d-TEMP',
      detail: '<45 g/km CO₂ · WLTP PHEV Phase 2',
      tone: 'emerald',
    });
  } else if (powertrain === 'hybrid' || powertrain === 'mhev') {
    badges.push({
      category: 'emissions',
      tierLabel: 'Emissions',
      code: 'Euro 6d-ISC-FCM',
      detail: 'RDE Step 2 · Real Driving Certified',
      tone: 'emerald',
    });
  } else if (powertrain === 'diesel') {
    const euroCode = year >= 2021 ? 'Euro 6d-Full' : year >= 2018 ? 'Euro 6d-TEMP' : 'Euro 6b';
    badges.push({
      category: 'emissions',
      tierLabel: 'Emissions',
      code: euroCode,
      detail: 'RDE Real Driving Emissions & NOx Limit',
      tone: 'blue',
    });
  } else {
    // Petrol
    const euroCode = year >= 2020 ? 'Euro 6d' : year >= 2017 ? 'Euro 6c' : 'Euro 6';
    badges.push({
      category: 'emissions',
      tierLabel: 'Emissions',
      code: euroCode,
      detail: 'WLTP Particle Number & HC Compliance',
      tone: 'blue',
    });
  }

  // ==========================================
  // TIER 2: INJECTION & INDUCTION
  // ==========================================
  if (powertrain === 'ev') {
    badges.push({
      category: 'injection',
      tierLabel: 'Induction',
      code: 'Permanent Magnet',
      detail: 'Hairpin Synchronous Dual-Inverter',
      tone: 'cyan',
    });
  } else if (powertrain === 'diesel') {
    const pressure = year >= 2020 ? '2,500 bar' : '2,000 bar';
    badges.push({
      category: 'injection',
      tierLabel: 'Injection',
      code: `Common-Rail ${pressure}`,
      detail: 'Solenoid / Piezo Direct Multi-Stage',
      tone: 'blue',
    });
  } else if (powertrain === 'hybrid') {
    badges.push({
      category: 'injection',
      tierLabel: 'Induction',
      code: 'Atkinson Dual VVT-i',
      detail: 'High-Expansion Ratio Hybrid Combustion Loop',
      tone: 'emerald',
    });
  } else if (powertrain === 'petrol-turbo') {
    badges.push({
      category: 'injection',
      tierLabel: 'Injection',
      code: 'Turbo GDI 350 bar',
      detail: 'Direct Gasoline Injection + Twin-Scroll Turbo',
      tone: 'amber',
    });
  } else {
    // Petrol NA
    badges.push({
      category: 'injection',
      tierLabel: 'Injection',
      code: 'Dual-Port EFI',
      detail: 'Electronic Multi-Point Sequential Injection',
      tone: 'slate',
    });
  }

  // ==========================================
  // TIER 3: AFTERTREATMENT & FILTRATION
  // ==========================================
  if (powertrain === 'ev') {
    badges.push({
      category: 'aftertreatment',
      tierLabel: 'Battery Pack',
      code: 'Active Liquid BMS',
      detail: 'Multi-Zone Thermal Loop + Cell Balancing',
      tone: 'purple',
    });
  } else if (powertrain === 'diesel') {
    const hasScr = year >= 2017 || engine.includes('scr') || engine.includes('blue') || engine.includes('adblue');
    badges.push({
      category: 'aftertreatment',
      tierLabel: 'Filtration',
      code: hasScr ? 'DPF + Dual SCR' : 'DPF + LNT',
      detail: hasScr
        ? 'AdBlue Twin-Dosing Selective Catalytic'
        : 'Closed Wall-Flow Particulate Trap + Lean NOx',
      tone: 'purple',
    });
  } else if (powertrain === 'hybrid' || powertrain === 'phev') {
    badges.push({
      category: 'aftertreatment',
      tierLabel: 'Hybrid Core',
      code: 'NiMH / Li-Ion Loop',
      detail: 'Close-Coupled 3-Way Cat + Cooled EGR',
      tone: 'emerald',
    });
  } else if (powertrain === 'petrol-turbo') {
    const hasOpf = year >= 2018;
    badges.push({
      category: 'aftertreatment',
      tierLabel: 'Filtration',
      code: hasOpf ? 'OPF / GPF Filter' : 'Close-Coupled Cat',
      detail: hasOpf
        ? 'Gasoline Particulate Filter + Wideband Lambda'
        : '3-Way Ceramic Catalytic Converter + EGR',
      tone: 'amber',
    });
  } else {
    badges.push({
      category: 'aftertreatment',
      tierLabel: 'Filtration',
      code: '3-Way Catalytic',
      detail: 'Cooled EGR Loop + Dual Oxygen Sensing',
      tone: 'slate',
    });
  }

  // ==========================================
  // TIER 4: TRANSMISSION ARCHITECTURE
  // ==========================================
  if (powertrain === 'ev') {
    badges.push({
      category: 'transmission',
      tierLabel: 'Transmission',
      code: 'Direct 1-Speed',
      detail: 'Helical Reduction Gearbox (9.0:1 Ratio)',
      tone: 'cyan',
    });
  } else if (trans.includes('cvt') || trans.includes('single-speed') || powertrain === 'hybrid') {
    badges.push({
      category: 'transmission',
      tierLabel: 'Transmission',
      code: 'e-CVT Power-Split',
      detail: 'Planetary Gear Dual-Motor Generator Loop',
      tone: 'emerald',
    });
  } else if (trans.includes('dsg') || trans.includes('dct') || trans.includes('dual-clutch') || trans.includes('powershift')) {
    badges.push({
      category: 'transmission',
      tierLabel: 'Transmission',
      code: 'Dual-Clutch (DSG/DCT)',
      detail: 'Wet Multi-Plate Electro-Hydraulic Shift',
      tone: 'blue',
    });
  } else if (trans.includes('torque-converter') || trans.includes('automatic') || trans.includes('auto') || trans.includes('zf')) {
    badges.push({
      category: 'transmission',
      tierLabel: 'Transmission',
      code: 'ZF / Aisin 8-Speed',
      detail: 'Hydrodynamic Planetary Lockup Converter',
      tone: 'purple',
    });
  } else if (trans.includes('manual')) {
    badges.push({
      category: 'transmission',
      tierLabel: 'Transmission',
      code: '6-Speed Manual',
      detail: 'Dual-Mass Flywheel (DMF) Short-Throw Transaxle',
      tone: 'slate',
    });
  } else {
    badges.push({
      category: 'transmission',
      tierLabel: 'Transmission',
      code: 'Adaptive Auto',
      detail: 'Multi-Ratio Dynamic Torque Converter',
      tone: 'slate',
    });
  }

  return badges;
}

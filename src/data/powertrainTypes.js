/**
 * ShiftMetric — Canonical Powertrain Architecture & Telemetry Module
 * 
 * Provides:
 *  1. Canonical PowertrainType enumeration ('EV' | 'PHEV' | 'HEV' | 'ICE_PETROL' | 'ICE_DIESEL')
 *  2. Robust vehicle powertrain resolvers and EV predicates
 *  3. EV & PHEV blended energy consumption calculators (Home AC vs. DC Fast Charging tariff split)
 *  4. High-Voltage Battery degradation (SoH % LFP vs. NMC chemistry loss curves)
 *  5. Metric/Imperial efficiency conversion utilities
 */

export const POWERTRAIN_TYPES = Object.freeze({
  EV: 'EV',
  PHEV: 'PHEV',
  HEV: 'HEV',
  ICE_PETROL: 'ICE_PETROL',
  ICE_DIESEL: 'ICE_DIESEL',
});

export const PowertrainType = POWERTRAIN_TYPES;

/**
 * Resolves any vehicle preset, catalog record, or configuration object
 * into one of the 5 canonical PowertrainType values.
 * 
 * @param {object|string} vehicleOrType
 * @returns {'EV' | 'PHEV' | 'HEV' | 'ICE_PETROL' | 'ICE_DIESEL'}
 */
export function resolvePowertrainType(vehicleOrType) {
  if (!vehicleOrType) return POWERTRAIN_TYPES.ICE_PETROL;

  // Direct string match handling
  if (typeof vehicleOrType === 'string') {
    const s = vehicleOrType.trim().toUpperCase();
    if (s === 'EV' || s === 'BEV' || s === 'ELECTRIC') return POWERTRAIN_TYPES.EV;
    if (s === 'PHEV' || s === 'PLUG-IN HYBRID' || s === 'PLUGIN HYBRID') return POWERTRAIN_TYPES.PHEV;
    if (s === 'HEV' || s === 'HYBRID' || s === 'MHEV') return POWERTRAIN_TYPES.HEV;
    if (s === 'ICE_DIESEL' || s === 'DIESEL') return POWERTRAIN_TYPES.ICE_DIESEL;
    if (s === 'ICE_PETROL' || s === 'PETROL' || s === 'GASOLINE' || s === 'GASOLINE-TURBO' || s === 'GASOLINE-NA') {
      return POWERTRAIN_TYPES.ICE_PETROL;
    }
  }

  const vehicle = typeof vehicleOrType === 'object' ? vehicleOrType : {};

  // 1. Canonical powertrainType property (if valid)
  if (vehicle.powertrainType && POWERTRAIN_TYPES[vehicle.powertrainType]) {
    return vehicle.powertrainType;
  }

  const isEv = vehicle.isEv === true || vehicle.isEv === 'true' || vehicle.isEv === 1;
  const explicitlyNotEv = vehicle.isEv === false || vehicle.isEv === 'false' || vehicle.isEv === 0;
  const fuelType = String(vehicle.fuelType || '').trim().toLowerCase();
  const powertrain = String(vehicle.powertrain || '').trim().toLowerCase();
  const archetypeId = String(vehicle.archetypeId || '').trim().toLowerCase();

  // 2. Explicit Fields Take Absolute Priority (PROJECT.md Interface Contract)
  // Check explicit EV
  if (
    isEv ||
    fuelType === 'electric' ||
    powertrain === 'ev' ||
    powertrain === 'electric' ||
    archetypeId === 'bev-lithium'
  ) {
    return POWERTRAIN_TYPES.EV;
  }

  // Check explicit PHEV
  if (
    fuelType === 'plug-in hybrid' ||
    fuelType === 'phev' ||
    fuelType.includes('plug-in') ||
    fuelType.includes('plugin') ||
    powertrain === 'phev' ||
    archetypeId === 'phev-turbo-dct'
  ) {
    return POWERTRAIN_TYPES.PHEV;
  }

  // Check explicit HEV
  if (
    fuelType === 'hybrid' ||
    fuelType === 'hev' ||
    fuelType === 'mhev' ||
    fuelType.includes('hybrid') ||
    powertrain === 'hybrid' ||
    powertrain === 'mhev' ||
    powertrain === 'hev' ||
    archetypeId === 'toyota-hybrid-ecvt'
  ) {
    return POWERTRAIN_TYPES.HEV;
  }

  // Check explicit Diesel
  if (
    fuelType === 'diesel' ||
    powertrain === 'diesel' ||
    archetypeId === 'vag-2.0-tdi-dsg' ||
    archetypeId === 'bmw-b47-zf8' ||
    archetypeId === 'euro6-diesel-dpf-wetbelt' ||
    archetypeId.includes('diesel') ||
    archetypeId.includes('tdi')
  ) {
    return POWERTRAIN_TYPES.ICE_DIESEL;
  }

  // Check explicit Petrol / Gasoline
  if (
    fuelType === 'gasoline' ||
    fuelType === 'petrol' ||
    powertrain === 'gasoline-turbo' ||
    powertrain === 'gasoline-na' ||
    archetypeId === 'direct-inj-turbo-petrol' ||
    archetypeId === 'puretech-ecoboost-wetbelt'
  ) {
    return POWERTRAIN_TYPES.ICE_PETROL;
  }

  // 3. Constrained Heuristic Substring Matching
  // Explicitly EXCLUDE knownRiskNotes and transmissionLabel to avoid false triggers
  // (e.g. electrical fault notes, EAT8 gearbox containing 't8 ', SkyActiv-Drive containing 'skyactiv-d')
  const label = [
    vehicle.id,
    vehicle.name,
    vehicle.shortName,
    vehicle.powertrainLabel,
    vehicle.engineCode,
    vehicle.segment,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Heuristic EV
  if (!explicitlyNotEv && !fuelType.includes('diesel') && !fuelType.includes('gasoline') && !fuelType.includes('petrol')) {
    if (
      /\b(bev|battery\s+electric)\b/i.test(label) ||
      label.includes('dual-motor awd') ||
      (/\belectric\b/i.test(label) && !/\b(hybrid|phev|e:hev|e-tech)\b/i.test(label))
    ) {
      return POWERTRAIN_TYPES.EV;
    }
  }

  // Heuristic PHEV: require word boundaries or distinct phrases
  if (
    /\b(phev|plug-in|plugin|ehybrid|e-hybrid|gte|330e|45e)\b/i.test(label) ||
    label.includes('twin engine') ||
    label.includes('recharge phev') ||
    /\bt8\s+(recharge|twin|awd|phev)\b/i.test(label) ||
    /\btfsi\s+e\b/i.test(label)
  ) {
    return POWERTRAIN_TYPES.PHEV;
  }

  // Heuristic HEV
  if (
    /\b(hybrid|hsd|e:hev|e-tech|self-charging|mhev|48v|eq\s+boost)\b/i.test(label)
  ) {
    return POWERTRAIN_TYPES.HEV;
  }

  // Heuristic Diesel: require word boundaries or distinct engine prefixes
  if (
    /\b(diesel|tdi|bluehdi|ecoblue|crdi|d-4d|dci|multijet|cdi|did|ea288|ea189|b47|b57|om654)\b/i.test(label) ||
    /\bskyactiv[- ]d\b/i.test(label)
  ) {
    return POWERTRAIN_TYPES.ICE_DIESEL;
  }

  // 5. Default Petrol (ICE_PETROL)
  return POWERTRAIN_TYPES.ICE_PETROL;
}

/**
 * Normalizer alias matching PROJECT.md interface contract.
 */
export const normalizePowertrainType = resolvePowertrainType;

/**
 * Returns true if the powertrain or vehicle is 100% Pure Electric (EV),
 * strictly excluding PHEV, HEV, and combustion vehicles.
 * 
 * @param {object|string} vehicleOrPowertrainType
 * @returns {boolean}
 */
export function isPureElectric(vehicleOrPowertrainType) {
  if (!vehicleOrPowertrainType) return false;
  if (typeof vehicleOrPowertrainType === 'string') {
    const s = vehicleOrPowertrainType.trim().toUpperCase();
    if (s === 'EV' || s === 'BEV' || s === 'ELECTRIC') return true;
    if (s === 'PHEV' || s === 'HEV' || s === 'ICE_DIESEL' || s === 'ICE_PETROL') return false;
  }
  return resolvePowertrainType(vehicleOrPowertrainType) === POWERTRAIN_TYPES.EV;
}

// ============================================================================
// EV / PHEV FUEL & ENERGY CONSUMPTION CALCULATIONS
// ============================================================================

/**
 * Calculates EV annual energy costs considering a split between
 * Home AC charging (e.g. 80%) and Public DC Fast Charging (e.g. 20%).
 * 
 * @param {object} params
 * @param {number} params.annualDistanceMiles - Annual distance in miles
 * @param {number} params.efficiencyKwh100Mi - Consumption in kWh / 100 miles (e.g. 28.0)
 * @param {number} [params.homeChargePct=80] - % of charging done at home (0–100)
 * @param {number} [params.homeTariffUsdPerKwh=0.14] - Home AC tariff in $/kWh
 * @param {number} [params.dcFastTariffUsdPerKwh=0.48] - Public DC fast tariff in $/kWh
 * @returns {{
 *   annualCostUsd: number,
 *   blendedTariffUsdPerKwh: number,
 *   annualKwh: number,
 *   costPerMileUsd: number,
 *   homeCostUsd: number,
 *   dcFastCostUsd: number,
 * }}
 */
function parseNonNegativeNumber(val, fallback) {
  if (val === undefined || val === null || val === '') return fallback;
  const num = Number(val);
  return !Number.isNaN(num) && num >= 0 ? num : fallback;
}

export function calculateEvEnergyCost({
  annualDistanceMiles = 12000,
  efficiencyKwh100Mi = 28.0,
  homeChargePct = 80,
  homeTariffUsdPerKwh = 0.14,
  dcFastTariffUsdPerKwh = 0.48,
}) {
  const miles = Math.max(0, Number(annualDistanceMiles) || 0);
  const eff = Math.max(1, Number(efficiencyKwh100Mi) || 28.0);
  const homeFrac = Math.min(100, Math.max(0, Number(homeChargePct) ?? 80)) / 100;
  const dcFrac = 1 - homeFrac;

  const homeRate = parseNonNegativeNumber(homeTariffUsdPerKwh, 0.14);
  const dcRate = parseNonNegativeNumber(dcFastTariffUsdPerKwh, 0.48);

  const blendedTariffUsdPerKwh = +(homeFrac * homeRate + dcFrac * dcRate).toFixed(4);
  const annualKwh = +( (miles / 100) * eff ).toFixed(2);

  const homeCostUsd = +( (annualKwh * homeFrac) * homeRate ).toFixed(2);
  const dcFastCostUsd = +( (annualKwh * dcFrac) * dcRate ).toFixed(2);
  const annualCostUsd = +(homeCostUsd + dcFastCostUsd).toFixed(2);
  const costPerMileUsd = miles > 0 ? +(annualCostUsd / miles).toFixed(4) : 0;

  return {
    annualCostUsd,
    blendedTariffUsdPerKwh,
    annualKwh,
    costPerMileUsd,
    homeCostUsd,
    dcFastCostUsd,
  };
}

/**
 * Calculates PHEV annual combined energy costs by splitting total distance
 * between battery-electric mode and combustion fuel mode.
 * 
 * @param {object} params
 * @param {number} params.annualDistanceMiles - Total annual distance in miles
 * @param {number} [params.electricSharePct=55] - % driven on electric battery power (0–100)
 * @param {number} [params.evEfficiencyKwh100Mi=28.0] - Electric consumption in kWh/100mi
 * @param {number} [params.iceMpg=34.0] - Combustion engine fuel efficiency in MPG
 * @param {number} [params.homeChargePct=80] - % of electric charging done at home
 * @param {number} [params.homeTariffUsdPerKwh=0.14] - Home AC tariff in $/kWh
 * @param {number} [params.dcFastTariffUsdPerKwh=0.48] - Public DC fast tariff in $/kWh
 * @param {number} [params.fuelPriceUsdPerGal=3.85] - Gasoline price per gallon
 * @returns {{
 *   totalAnnualCostUsd: number,
 *   electricCostUsd: number,
 *   iceCostUsd: number,
 *   electricMiles: number,
 *   iceMiles: number,
 *   electricKwh: number,
 *   iceGallons: number,
 *   blendedTariffUsdPerKwh: number,
 *   costPerMileUsd: number,
 * }}
 */
export function calculatePhevEnergyCost({
  annualDistanceMiles = 12000,
  electricSharePct = 55,
  evEfficiencyKwh100Mi = 28.0,
  iceMpg = 34.0,
  homeChargePct = 80,
  homeTariffUsdPerKwh = 0.14,
  dcFastTariffUsdPerKwh = 0.48,
  fuelPriceUsdPerGal = 3.85,
}) {
  const miles = Math.max(0, Number(annualDistanceMiles) || 0);
  const elecFrac = Math.min(100, Math.max(0, Number(electricSharePct) ?? 55)) / 100;
  const iceFrac = 1 - elecFrac;

  const electricMiles = +(miles * elecFrac).toFixed(1);
  const iceMiles = +(miles * iceFrac).toFixed(1);

  // Electric calculation
  const evResult = calculateEvEnergyCost({
    annualDistanceMiles: electricMiles,
    efficiencyKwh100Mi: evEfficiencyKwh100Mi,
    homeChargePct,
    homeTariffUsdPerKwh,
    dcFastTariffUsdPerKwh,
  });

  // ICE calculation
  const mpg = Math.max(5, Number(iceMpg) || 34.0);
  const fuelPrice = parseNonNegativeNumber(fuelPriceUsdPerGal, 3.85);
  const iceGallons = +(iceMiles / mpg).toFixed(2);
  const iceCostUsd = +(iceGallons * fuelPrice).toFixed(2);

  const totalAnnualCostUsd = +(evResult.annualCostUsd + iceCostUsd).toFixed(2);
  const costPerMileUsd = miles > 0 ? +(totalAnnualCostUsd / miles).toFixed(4) : 0;

  return {
    totalAnnualCostUsd,
    electricCostUsd: evResult.annualCostUsd,
    iceCostUsd,
    electricMiles,
    iceMiles,
    electricKwh: evResult.annualKwh,
    iceGallons,
    blendedTariffUsdPerKwh: evResult.blendedTariffUsdPerKwh,
    costPerMileUsd,
  };
}

/**
 * Universal dispatcher calculating energy costs for any vehicle preset/record.
 */
export function calculateVehicleEnergyCost(vehicle = {}, options = {}) {
  const pType = resolvePowertrainType(vehicle);
  const annualDistanceMiles = options.annualDistanceMiles ?? vehicle.annualDistanceMiles ?? 12000;

  if (pType === POWERTRAIN_TYPES.EV) {
    const eff = options.efficiencyKwh100Mi ?? vehicle.mpgUs ?? 28.0;
    return calculateEvEnergyCost({
      annualDistanceMiles,
      efficiencyKwh100Mi: eff,
      homeChargePct: options.homeChargePct ?? 80,
      homeTariffUsdPerKwh: parseNonNegativeNumber(options.homeTariffUsdPerKwh ?? vehicle.defaultFuelPriceUsdGal, 0.16),
      dcFastTariffUsdPerKwh: parseNonNegativeNumber(options.dcFastTariffUsdPerKwh, 0.48),
    });
  }

  if (pType === POWERTRAIN_TYPES.PHEV) {
    return calculatePhevEnergyCost({
      annualDistanceMiles,
      electricSharePct: options.electricSharePct ?? 55,
      evEfficiencyKwh100Mi: options.evEfficiencyKwh100Mi ?? 28.0,
      iceMpg: options.iceMpg ?? (vehicle.mpgUs || 34.0),
      homeChargePct: options.homeChargePct ?? 80,
      homeTariffUsdPerKwh: parseNonNegativeNumber(options.homeTariffUsdPerKwh, 0.14),
      dcFastTariffUsdPerKwh: parseNonNegativeNumber(options.dcFastTariffUsdPerKwh, 0.48),
      fuelPriceUsdPerGal: parseNonNegativeNumber(options.fuelPriceUsdPerGal, 3.85),
    });
  }

  // ICE_PETROL, ICE_DIESEL, HEV
  const mpg = Math.max(5, Number(vehicle.mpgUs) || 32.0);
  const fuelPrice = parseNonNegativeNumber(options.fuelPriceUsdPerGal ?? vehicle.defaultFuelPriceUsdGal, 3.90);
  const gallons = (annualDistanceMiles / mpg);
  const annualCostUsd = +(gallons * fuelPrice).toFixed(2);
  const costPerMileUsd = annualDistanceMiles > 0 ? +(annualCostUsd / annualDistanceMiles).toFixed(4) : 0;

  return {
    annualCostUsd,
    totalAnnualCostUsd: annualCostUsd,
    fuelGallons: +gallons.toFixed(2),
    costPerMileUsd,
  };
}

// ============================================================================
// BATTERY DEGRADATION & STATE OF HEALTH (SoH %) MODEL
// ============================================================================

/**
 * Calculates battery State of Health (SoH %) based on battery chemistry
 * (LFP vs. NMC), cumulative mileage, calendar age, and DC fast charging exposure.
 * 
 * Chemistry characteristics:
 * - LFP (Lithium Iron Phosphate):
 *   High cycle durability (3,000+ full cycles). Small initial 2.5% formation loss,
 *   followed by slow linear degradation (0.95% per 25k mi) and low calendar aging.
 * - NMC (Nickel Manganese Cobalt):
 *   Higher energy density, but faster degradation under high SoC holding and
 *   repeated high-C DC fast charging (1.25% per 20k mi, 0.95%/year calendar aging).
 * 
 * @param {object} params
 * @param {'LFP'|'NMC'} [params.chemistry='NMC'] - Battery cell chemistry
 * @param {number} [params.odometerMiles=0] - Current physical odometer miles
 * @param {number} [params.ageYears=1] - Vehicle age in years
 * @param {number} [params.dcFastChargingSharePct=20] - % of charging via DC fast chargers
 * @param {number} [params.nominalCapacityKwh=75] - Original pack capacity in kWh
 * @param {number} [params.cellDefectLossPct=0] - Anomalous cell defect loss percentage
 * @param {number} [params.floorSoh] - Optional custom degradation floor override
 * @returns {{
 *   sohPct: number,
 *   chemistry: 'LFP' | 'NMC',
 *   capacityLossPct: number,
 *   remainingCapacityKwh: number,
 *   cycleEquivalentCount: number,
 *   warrantyStatus: 'HEALTHY' | 'DEGRADED' | 'WARRANTY_CLAIM_ELIGIBLE' | 'OUT_OF_WARRANTY_DEGRADED',
 * }}
 */
export function calculateBatterySoh(options = {}) {
  const {
    chemistry = 'NMC',
    odometerMiles = 0,
    ageYears = 1,
    dcFastChargingSharePct = 20,
    nominalCapacityKwh = 75,
  } = options || {};

  const cellDefectLossPct = Math.max(0, Number(options?.cellDefectLossPct) || 0);

  const odo = Math.max(0, Number(odometerMiles) || 0);
  const years = Math.max(0, Number(ageYears) || 0);
  const dcPct = Math.min(100, Math.max(0, Number(dcFastChargingSharePct) || 0));
  const nominal = Math.max(10, Number(nominalCapacityKwh) || 75);

  const isLfp = String(chemistry).trim().toUpperCase() === 'LFP';

  let initialBreakInLoss;
  let mileageLoss;
  let calendarLoss;
  let dcFastPenalty;
  let floorSoh;

  if (isLfp) {
    // LFP: flat degradation, durable against 100% SoC, resilient to thermal cycling
    initialBreakInLoss = 2.5;
    mileageLoss = (odo / 25000) * 0.95;
    calendarLoss = years * 0.65;
    dcFastPenalty = (dcPct / 100) * 1.5;
    floorSoh = 50.0;
  } else {
    // NMC: higher degradation if kept at high voltage and subjected to high-C fast charging
    initialBreakInLoss = 4.0;
    mileageLoss = (odo / 20000) * 1.25;
    calendarLoss = years * 0.95;
    dcFastPenalty = (dcPct / 100) * 3.5;
    floorSoh = 50.0;
  }

  // Preserve standard physical floor of 70% (LFP) / 65% (NMC) under normal non-defective aging
  // while allowing anomalous cell defects or custom floor overrides down to 50.0%
  const effectiveFloor = options?.floorSoh !== undefined
    ? Number(options.floorSoh)
    : (cellDefectLossPct > 0 ? floorSoh : (isLfp ? 70.0 : 65.0));

  const totalLoss = initialBreakInLoss + mileageLoss + calendarLoss + dcFastPenalty + cellDefectLossPct;
  const rawSoh = 100.0 - totalLoss;
  const sohPct = +(Math.min(100.0, Math.max(effectiveFloor, rawSoh))).toFixed(1);
  const capacityLossPct = +(100.0 - sohPct).toFixed(1);
  const remainingCapacityKwh = +(nominal * (sohPct / 100)).toFixed(1);

  // Typical full-cycle equivalent estimation assuming ~250 mi per full pack cycle
  const cycleEquivalentCount = Math.round(odo / 250);

  let warrantyStatus = 'HEALTHY';
  if ((sohPct < 70.0 || rawSoh < 70.0) && years <= 8 && odo <= 100000) {
    warrantyStatus = 'WARRANTY_CLAIM_ELIGIBLE';
  } else if (sohPct < 70.0 && (years > 8 || odo > 100000)) {
    warrantyStatus = (cellDefectLossPct > 0 || options?.floorSoh !== undefined)
      ? 'OUT_OF_WARRANTY_DEGRADED'
      : 'DEGRADED';
  } else if (sohPct < 80.0) {
    warrantyStatus = 'DEGRADED';
  }

  return {
    sohPct,
    chemistry: isLfp ? 'LFP' : 'NMC',
    capacityLossPct,
    remainingCapacityKwh,
    cycleEquivalentCount,
    warrantyStatus,
  };
}

// ============================================================================
// EFFICIENCY UNIT CONVERSIONS
// ============================================================================

export function convertKwh100MiToKwh100Km(kwh100Mi) {
  const val = Number(kwh100Mi) || 0;
  return +(val / 1.609344).toFixed(2);
}

export function convertKwh100KmToKwh100Mi(kwh100Km) {
  const val = Number(kwh100Km) || 0;
  return +(val * 1.609344).toFixed(2);
}

export function convertKwh100MiToMiPerKwh(kwh100Mi) {
  const val = Number(kwh100Mi) || 0;
  return val > 0 ? +(100 / val).toFixed(2) : 0;
}

export function convertMiPerKwhToKwh100Mi(miPerKwh) {
  const val = Number(miPerKwh) || 0;
  return val > 0 ? +(100 / val).toFixed(2) : 0;
}

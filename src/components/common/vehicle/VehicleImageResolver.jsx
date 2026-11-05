import React, { useState, useEffect, useMemo } from 'react';
import {
  resolveBodyArchetype,
  resolvePowertrainArchetype,
  getArchetypeLabel,
} from './vehicleArchetypes.js';

/**
 * High-Resolution Segment Fallback Photography (3/4 Automotive Studio & Road Angles)
 */
export const SEGMENT_FALLBACK_PHOTOS = {
  hatchback: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1000&q=80',
  sedan: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80',
  wagon: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80',
  suv: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=80',
  crossover: 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=1000&q=80',
  coupe: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80',
  truck: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1000&q=80',
};

/**
 * Verified Make & Model Automotive Photography Catalog (3/4 Studio & Editorial Shots)
 */
const VERIFIED_MODEL_PHOTOS = [
  // Ford
  { match: ['focus'], url: 'https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1000&q=80' },
  { match: ['fiesta', 'puma'], url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=80' },
  { match: ['mondeo', 'fusion'], url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80' },
  { match: ['kuga', 'escape', 'explorer'], url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80' },
  { match: ['f-150', 'f150', 'ranger', 'maverick', 'transit'], url: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1000&q=80' },
  { match: ['mustang', 'mach-e'], url: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1000&q=80' },

  // Volkswagen
  { match: ['golf gti', 'golf r'], url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80' },
  { match: ['golf', 'polo', 'id.3', 'id3'], url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80' },
  { match: ['passat', 'arteon', 'jetta'], url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1000&q=80' },
  { match: ['tiguan', 'touareg', 't-roc', 'id.4', 'id4'], url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1000&q=80' },

  // BMW
  { match: ['3 series', '320', '330', 'm340', 'm3', 'i4'], url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80' },
  { match: ['5 series', '520', '530', '540', 'm5', 'i5', '7 series'], url: 'https://images.unsplash.com/photo-1523983388277-336a66bf9bcd?auto=format&fit=crop&w=1000&q=80' },
  { match: ['x1', 'x3', 'x5', 'ix3', 'ix'], url: 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=1000&q=80' },
  { match: ['1 series', '118', '120', '2 series'], url: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=1000&q=80' },

  // Toyota & Lexus
  { match: ['camry', 'avalon', 'mirai'], url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1000&q=80' },
  { match: ['corolla', 'yaris', 'auris', 'prius'], url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80' },
  { match: ['rav4', 'highlander', 'c-hr', 'chr', 'land cruiser', 'bz4x'], url: 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=1000&q=80' },
  { match: ['hilux', 'tacoma', 'tundra'], url: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1000&q=80' },
  { match: ['lexus', 'nx', 'rx', 'es', 'is', 'ux'], url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1000&q=80' },

  // Tesla
  { match: ['model 3', 'model s'], url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1000&q=80' },
  { match: ['model y', 'model x'], url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1000&q=80' },

  // Audi
  { match: ['a3', 's3', 'rs3', 'a1'], url: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1000&q=80' },
  { match: ['a4', 's4', 'a5', 'a6', 'e-tron gt'], url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1000&q=80' },
  { match: ['q3', 'q4', 'q5', 'q7', 'q8', 'e-tron'], url: 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?auto=format&fit=crop&w=1000&q=80' },

  // Mercedes-Benz
  { match: ['c-class', 'c200', 'c220', 'c300', 'e-class', 'e220', 'e300', 'eqe', 's-class'], url: 'https://images.unsplash.com/photo-1618843479319-56173152d6e5?auto=format&fit=crop&w=1000&q=80' },
  { match: ['a-class', 'a180', 'a200', 'cla', 'b-class'], url: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=1000&q=80' },
  { match: ['glc', 'gla', 'gle', 'eqa', 'eqc'], url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1000&q=80' },

  // Honda
  { match: ['civic', 'accord', 'jazz', 'fit'], url: 'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?auto=format&fit=crop&w=1000&q=80' },
  { match: ['cr-v', 'crv', 'hr-v', 'hrv', 'pilot'], url: 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=1000&q=80' },

  // Skoda, SEAT, Cupra
  { match: ['octavia', 'superb', 'scala', 'fabia'], url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80' },
  { match: ['kodiaq', 'karoq', 'kamiq', 'enyaq'], url: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=80' },
  { match: ['leon', 'ibiza', 'ateca', 'formentor', 'born'], url: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1000&q=80' },

  // Hyundai & Kia
  { match: ['i30', 'i20', 'ceed', 'elantra', 'rio'], url: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1000&q=80' },
  { match: ['tucson', 'sportage', 'santa fe', 'sorento', 'kona', 'niro'], url: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=80' },
  { match: ['ioniq', 'ev6', 'ev9'], url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1000&q=80' },

  // Volvo
  { match: ['xc60', 'xc90', 'xc40', 'ex30'], url: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=80' },
  { match: ['v60', 'v90', 's60', 's90'], url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80' },

  // Peugeot, Renault, Citroen, Dacia, Opel
  { match: ['208', '308', 'clio', 'megane', 'sandero', 'astra', 'corsa', 'c3', 'c4'], url: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1000&q=80' },
  { match: ['3008', '5008', '2008', 'captur', 'austral', 'duster', 'mokka', 'grandland', 'c5'], url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80' },

  // Mazda, Nissan, Porsche
  { match: ['mazda3', 'mazda 3', 'mazda6', 'mazda 6'], url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1000&q=80' },
  { match: ['cx-5', 'cx5', 'cx-30', 'cx-60', 'qashqai', 'x-trail', 'juke', 'ariyah', 'leaf'], url: 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=1000&q=80' },
  { match: ['911', 'cayman', 'boxster', 'taycan', 'macan', 'cayenne', 'panamera'], url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80' },
];

const BRAND_DEFAULT_PHOTOS = {
  ford: 'https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1000&q=80',
  volkswagen: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80',
  vw: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80',
  bmw: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80',
  audi: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1000&q=80',
  'mercedes-benz': 'https://images.unsplash.com/photo-1618843479319-56173152d6e5?auto=format&fit=crop&w=1000&q=80',
  mercedes: 'https://images.unsplash.com/photo-1618843479319-56173152d6e5?auto=format&fit=crop&w=1000&q=80',
  porsche: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80',
  toyota: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80',
  lexus: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1000&q=80',
  tesla: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1000&q=80',
  honda: 'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?auto=format&fit=crop&w=1000&q=80',
  skoda: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80',
  seat: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1000&q=80',
  cupra: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1000&q=80',
  volvo: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=80',
  hyundai: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1000&q=80',
  kia: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1000&q=80',
  mazda: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1000&q=80',
  nissan: 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=1000&q=80',
  renault: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1000&q=80',
  peugeot: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1000&q=80',
  citroen: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1000&q=80',
  dacia: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80',
  opel: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1000&q=80',
};

/**
 * Brand Marque Identity & Tier Multiplier Registry
 */
const BRAND_MARQUE_REGISTRY = {
  ford: { name: 'Ford', monogram: 'FD', countryCode: 'US', defaultMultiplier: 1.15, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  volkswagen: { name: 'Volkswagen', monogram: 'VW', countryCode: 'DE', defaultMultiplier: 1.15, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  vw: { name: 'Volkswagen', monogram: 'VW', countryCode: 'DE', defaultMultiplier: 1.15, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  bmw: { name: 'BMW', monogram: 'BMW', countryCode: 'DE', defaultMultiplier: 1.55, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  audi: { name: 'Audi', monogram: 'AUDI', countryCode: 'DE', defaultMultiplier: 1.50, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  'mercedes-benz': { name: 'Mercedes-Benz', monogram: 'MB', countryCode: 'DE', defaultMultiplier: 1.55, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  mercedes: { name: 'Mercedes-Benz', monogram: 'MB', countryCode: 'DE', defaultMultiplier: 1.55, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  porsche: { name: 'Porsche', monogram: 'POR', countryCode: 'DE', defaultMultiplier: 1.75, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  toyota: { name: 'Toyota', monogram: 'TYT', countryCode: 'JP', defaultMultiplier: 0.95, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  lexus: { name: 'Lexus', monogram: 'LEX', countryCode: 'JP', defaultMultiplier: 1.35, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  tesla: { name: 'Tesla', monogram: 'TSLA', countryCode: 'US', defaultMultiplier: 1.30, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  skoda: { name: 'Škoda', monogram: 'SK', countryCode: 'CZ', defaultMultiplier: 1.05, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  seat: { name: 'SEAT', monogram: 'SEAT', countryCode: 'ES', defaultMultiplier: 1.05, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  cupra: { name: 'Cupra', monogram: 'CUP', countryCode: 'ES', defaultMultiplier: 1.25, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  volvo: { name: 'Volvo', monogram: 'VOL', countryCode: 'SE', defaultMultiplier: 1.40, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  hyundai: { name: 'Hyundai', monogram: 'HYU', countryCode: 'KR', defaultMultiplier: 1.05, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  kia: { name: 'Kia', monogram: 'KIA', countryCode: 'KR', defaultMultiplier: 1.05, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  honda: { name: 'Honda', monogram: 'HND', countryCode: 'JP', defaultMultiplier: 1.00, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  mazda: { name: 'Mazda', monogram: 'MZD', countryCode: 'JP', defaultMultiplier: 1.05, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  nissan: { name: 'Nissan', monogram: 'NIS', countryCode: 'JP', defaultMultiplier: 1.10, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  renault: { name: 'Renault', monogram: 'REN', countryCode: 'FR', defaultMultiplier: 1.10, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  peugeot: { name: 'Peugeot', monogram: 'PEU', countryCode: 'FR', defaultMultiplier: 1.10, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  citroen: { name: 'Citroën', monogram: 'CIT', countryCode: 'FR', defaultMultiplier: 1.10, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  dacia: { name: 'Dacia', monogram: 'DAC', countryCode: 'RO', defaultMultiplier: 0.90, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  opel: { name: 'Opel', monogram: 'OPL', countryCode: 'DE', defaultMultiplier: 1.10, crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
};

export function resolveBrandIdentity(vehicle = {}) {
  const rawBrand = (vehicle.brand || (vehicle.name || '').split(' ')[0] || 'OEM').trim();
  const normalizedKey = rawBrand
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const entry = BRAND_MARQUE_REGISTRY[normalizedKey] || {
    name: rawBrand,
    monogram: rawBrand.slice(0, 3).toUpperCase(),
    countryCode: 'EU',
    defaultMultiplier: 1.15,
    crestBg: 'bg-zinc-800 text-zinc-100 border-zinc-700',
  };

  const explicitMult = Number(vehicle.brandTierMultiplier);
  const multiplierValue =
    Number.isFinite(explicitMult) && explicitMult > 0
      ? explicitMult
      : entry.defaultMultiplier;

  let tierClassLabel = 'Mainstream';
  if (vehicle.brandTierLabel) {
    tierClassLabel = vehicle.brandTierLabel;
  } else if (multiplierValue >= 1.35) {
    tierClassLabel = 'Premium';
  } else if (multiplierValue < 1.02) {
    tierClassLabel = 'Economy';
  }

  return {
    brandName: vehicle.brand || entry.name,
    monogram: entry.monogram,
    crestBg: entry.crestBg,
    multiplierValue,
    tierClassLabel,
    tierPillText: `${multiplierValue.toFixed(2)}x ${tierClassLabel}`,
  };
}

/**
 * Resolves a verified high-resolution 3/4-angle vehicle photo URL for any catalog make/model or body segment.
 */
export function resolveVehiclePhotoUrl({ vehicle = {}, imageUrl, cdnTemplate } = {}) {
  const directUrl = imageUrl || vehicle?.imageUrl || vehicle?.photoUrl || '';
  if (typeof directUrl === 'string' && directUrl.trim().length > 0) {
    return directUrl.trim();
  }

  if (typeof cdnTemplate === 'string' && cdnTemplate.trim().length > 0 && vehicle?.id) {
    const slugBrand = (vehicle.brand || 'oem')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const slugModel = (vehicle.modelName || vehicle.id || 'model')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    return cdnTemplate
      .replace(/\{id\}/g, encodeURIComponent(vehicle.id))
      .replace(/\{brand\}/g, encodeURIComponent(slugBrand))
      .replace(/\{model\}/g, encodeURIComponent(slugModel));
  }

  const haystack = `${vehicle?.id || ''} ${vehicle?.brand || ''} ${vehicle?.modelName || ''} ${vehicle?.shortName || ''} ${vehicle?.name || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  for (const item of VERIFIED_MODEL_PHOTOS) {
    if (item.match.some((keyword) => haystack.includes(keyword))) {
      return item.url;
    }
  }

  const brandKey = (vehicle?.brand || (vehicle?.name || '').split(' ')[0] || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (BRAND_DEFAULT_PHOTOS[brandKey]) {
    return BRAND_DEFAULT_PHOTOS[brandKey];
  }

  const bodyArchetype = resolveBodyArchetype(vehicle);
  return SEGMENT_FALLBACK_PHOTOS[bodyArchetype] || SEGMENT_FALLBACK_PHOTOS.sedan;
}

export function derivePowertrainMicroBadge(vehicle = {}) {
  const powertrain = resolvePowertrainArchetype(vehicle);
  const label = vehicle.powertrainLabel || vehicle.engineCode || '';
  const trans = (vehicle.transmission || vehicle.transmissionLabel || '').toLowerCase();

  const dispMatch = label.match(/\b(\d\.\d)\s*L?\b/i);
  const dispPrefix = dispMatch ? `${dispMatch[1]}L ` : '';

  let primaryTag = 'Turbo Powertrain';
  if (powertrain === 'ev') {
    primaryTag = 'BEV Lithium';
  } else if (powertrain === 'phev') {
    primaryTag = `${dispPrefix}PHEV Plug-In`.trim();
  } else if (powertrain === 'hybrid') {
    primaryTag = 'Hybrid e-CVT';
  } else if (powertrain === 'mhev') {
    primaryTag = `${dispPrefix}48V Mild Hybrid`.trim();
  } else if (powertrain === 'diesel') {
    primaryTag = `${dispPrefix}Diesel`;
  } else if (powertrain === 'petrol-na') {
    primaryTag = `${dispPrefix}Naturally Aspirated`.trim();
  } else {
    primaryTag = `${dispPrefix}Turbo GDI`.trim();
  }

  let transmissionTag = 'Automatic';
  if (powertrain === 'ev' || trans.includes('single-speed')) {
    transmissionTag = '1-Spd Direct';
  } else if (trans.includes('cvt') || powertrain === 'hybrid') {
    transmissionTag = 'e-CVT';
  } else if (
    trans.includes('dsg') ||
    trans.includes('dct') ||
    trans.includes('pdk') ||
    trans.includes('dual-clutch') ||
    trans.includes('powershift')
  ) {
    transmissionTag = 'Dual-Clutch';
  } else if (trans.includes('manual')) {
    transmissionTag = '6-Spd Manual';
  } else if (trans.includes('torque-converter') || trans.includes('zf') || trans.includes('auto')) {
    transmissionTag = 'Automatic';
  }

  return {
    primaryTag,
    transmissionTag,
  };
}

/**
 * Real Automotive Photography Resolver
 * Renders verified 3/4-angle vehicle photographs inside a recessed zinc frame
 * (dark:bg-zinc-900) without floating overlay text covering tires or bumpers.
 */
export default function VehicleImageResolver({
  vehicle = {},
  variant = 'hero',
  imageUrl,
  cdnTemplate,
  interactive = true,
  showOverlays = false,
  className = '',
}) {
  const bodyArchetype = resolveBodyArchetype(vehicle);
  const fallbackSegmentUrl = SEGMENT_FALLBACK_PHOTOS[bodyArchetype] || SEGMENT_FALLBACK_PHOTOS.sedan;

  const primaryPhotoUrl = useMemo(
    () => resolveVehiclePhotoUrl({ vehicle, imageUrl, cdnTemplate }),
    [vehicle, imageUrl, cdnTemplate]
  );

  const [activeSrc, setActiveSrc] = useState(primaryPhotoUrl);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setActiveSrc(primaryPhotoUrl);
    setImgFailed(false);
  }, [primaryPhotoUrl, vehicle?.id]);

  const bodyLabel = getArchetypeLabel(bodyArchetype);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900 select-none ${className}`}
      data-testid="vehicle-image-resolver"
      data-tier="tier-1-photo"
      data-archetype={bodyArchetype}
    >
      {!imgFailed ? (
        <img
          src={activeSrc}
          alt={vehicle?.name || 'Vehicle'}
          loading="lazy"
          onError={() => {
            if (activeSrc !== fallbackSegmentUrl) {
              setActiveSrc(fallbackSegmentUrl);
            } else {
              setImgFailed(true);
            }
          }}
          className={`w-full h-full object-cover object-center transition-transform duration-300 ease-out ${
            interactive ? 'group-hover:scale-[1.03]' : ''
          }`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 p-4 text-center">
          <span className="font-sans text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {vehicle?.shortName || vehicle?.name || 'Vehicle'}
          </span>
          <span className="font-sans text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            {bodyLabel}
          </span>
        </div>
      )}

      {showOverlays && (
        <div className="sr-only">
          {vehicle?.name} · {bodyLabel}
        </div>
      )}
    </div>
  );
}


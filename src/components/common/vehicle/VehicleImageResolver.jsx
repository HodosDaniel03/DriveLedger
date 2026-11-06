import React, { useState, useEffect, useMemo } from 'react';
import vehiclePhotoMap from '../../../data/vehiclePhotoMap.json' with { type: 'json' };
import {
  resolveBodyArchetype,
  resolvePowertrainArchetype,
  getArchetypeLabel,
} from './vehicleArchetypes.js';

/**
 * High-Resolution Segment Fallback Photography (3/4 Automotive Studio & Road Angles)
 */
export const SEGMENT_FALLBACK_PHOTOS = {
  hatchback:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/2020_Volkswagen_Golf_Style_1.5_Front.jpg/960px-2020_Volkswagen_Golf_Style_1.5_Front.jpg',
  sedan:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/2019_BMW_318d_SE_Automatic_2.0_Front.jpg/960px-2019_BMW_318d_SE_Automatic_2.0_Front.jpg',
  wagon:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Skoda_Octavia_IV_Combi_IMG_3615.jpg/960px-Skoda_Octavia_IV_Combi_IMG_3615.jpg',
  suv:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/2019_Toyota_RAV4_Design_HEV_CVT_2.5_Front.jpg/960px-2019_Toyota_RAV4_Design_HEV_CVT_2.5_Front.jpg',
  crossover:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/2021_Hyundai_Tucson_Ultimate_T-GDi_HEV_Automatic_1.6_Front.jpg/960px-2021_Hyundai_Tucson_Ultimate_T-GDi_HEV_Automatic_1.6_Front.jpg',
  coupe:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Porsche_992_Carrera_S_Cabriolet_Genf_2019_1Y7A5736.jpg/960px-Porsche_992_Carrera_S_Cabriolet_Genf_2019_1Y7A5736.jpg',
  truck:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/2018_Ford_F-150_XLT_Crew_Cab%2C_front_11.10.19.jpg/960px-2018_Ford_F-150_XLT_Crew_Cab%2C_front_11.10.19.jpg',
};

const BRAND_DEFAULT_PHOTOS = {
  ford: vehiclePhotoMap['ford-focus'] || SEGMENT_FALLBACK_PHOTOS.hatchback,
  volkswagen: vehiclePhotoMap['volkswagen-golf'] || SEGMENT_FALLBACK_PHOTOS.hatchback,
  vw: vehiclePhotoMap['volkswagen-golf'] || SEGMENT_FALLBACK_PHOTOS.hatchback,
  bmw: vehiclePhotoMap['bmw-3-series'] || SEGMENT_FALLBACK_PHOTOS.sedan,
  audi: vehiclePhotoMap['audi-a4'] || SEGMENT_FALLBACK_PHOTOS.sedan,
  'mercedes-benz': vehiclePhotoMap['mercedes-benz-c-class'] || SEGMENT_FALLBACK_PHOTOS.sedan,
  mercedes: vehiclePhotoMap['mercedes-benz-c-class'] || SEGMENT_FALLBACK_PHOTOS.sedan,
  porsche: vehiclePhotoMap['porsche-macan'] || SEGMENT_FALLBACK_PHOTOS.coupe,
  toyota: vehiclePhotoMap['toyota-corolla'] || SEGMENT_FALLBACK_PHOTOS.sedan,
  lexus: vehiclePhotoMap['lexus-nx'] || SEGMENT_FALLBACK_PHOTOS.suv,
  tesla: vehiclePhotoMap['tesla-model-3'] || SEGMENT_FALLBACK_PHOTOS.sedan,
  honda: vehiclePhotoMap['honda-civic'] || SEGMENT_FALLBACK_PHOTOS.sedan,
  skoda: vehiclePhotoMap['skoda-octavia'] || SEGMENT_FALLBACK_PHOTOS.wagon,
  seat: vehiclePhotoMap['seat-leon'] || SEGMENT_FALLBACK_PHOTOS.hatchback,
  cupra: vehiclePhotoMap['cupra-formentor'] || SEGMENT_FALLBACK_PHOTOS.crossover,
  volvo: vehiclePhotoMap['volvo-xc60'] || SEGMENT_FALLBACK_PHOTOS.suv,
  hyundai: vehiclePhotoMap['hyundai-tucson'] || SEGMENT_FALLBACK_PHOTOS.crossover,
  kia: vehiclePhotoMap['kia-sportage'] || SEGMENT_FALLBACK_PHOTOS.suv,
  mazda: vehiclePhotoMap['mazda-cx-5'] || SEGMENT_FALLBACK_PHOTOS.suv,
  nissan: vehiclePhotoMap['nissan-qashqai'] || SEGMENT_FALLBACK_PHOTOS.crossover,
  renault: vehiclePhotoMap['renault-clio'] || SEGMENT_FALLBACK_PHOTOS.hatchback,
  peugeot: vehiclePhotoMap['peugeot-3008'] || SEGMENT_FALLBACK_PHOTOS.crossover,
  citroen: vehiclePhotoMap['citroen-c4'] || SEGMENT_FALLBACK_PHOTOS.crossover,
  dacia: vehiclePhotoMap['dacia-duster'] || SEGMENT_FALLBACK_PHOTOS.suv,
  opel: vehiclePhotoMap['opel-astra'] || SEGMENT_FALLBACK_PHOTOS.hatchback,
  chevrolet: vehiclePhotoMap['chevrolet-camaro'] || SEGMENT_FALLBACK_PHOTOS.coupe,
  subaru: vehiclePhotoMap['subaru-outback'] || SEGMENT_FALLBACK_PHOTOS.wagon,
  jeep: vehiclePhotoMap['jeep-compass'] || SEGMENT_FALLBACK_PHOTOS.suv,
  fiat: vehiclePhotoMap['fiat-500'] || SEGMENT_FALLBACK_PHOTOS.hatchback,
  'alfa-romeo': vehiclePhotoMap['alfa-romeo-giulia'] || SEGMENT_FALLBACK_PHOTOS.sedan,
  mini: vehiclePhotoMap['mini-cooper'] || SEGMENT_FALLBACK_PHOTOS.hatchback,
  'land-rover': vehiclePhotoMap['land-rover-range-rover-evoque'] || SEGMENT_FALLBACK_PHOTOS.suv,
  jaguar: vehiclePhotoMap['jaguar-f-pace'] || SEGMENT_FALLBACK_PHOTOS.suv,
  suzuki: vehiclePhotoMap['suzuki-vitara'] || SEGMENT_FALLBACK_PHOTOS.suv,
  mitsubishi: vehiclePhotoMap['mitsubishi-outlander'] || SEGMENT_FALLBACK_PHOTOS.suv,
  ram: SEGMENT_FALLBACK_PHOTOS.truck,
  gmc: SEGMENT_FALLBACK_PHOTOS.truck,
};

const PHOTO_MAP_KEYS = Object.keys(vehiclePhotoMap);

const BRAND_SLUG_ALIASES = {
  vw: 'volkswagen',
  mercedes: 'mercedes-benz',
  ds: 'ds-automobiles',
};

export function normalizePhotoKey(make, model) {
  return `${make || ''}-${model || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function canonicalizeBrandPrefix(slug) {
  if (!slug) return '';
  for (const [alias, canonical] of Object.entries(BRAND_SLUG_ALIASES)) {
    if (slug === canonical || slug.startsWith(`${canonical}-`)) return slug;
    if (slug === alias) return canonical;
    if (slug.startsWith(`${alias}-`)) {
      return `${canonical}-${slug.slice(alias.length + 1)}`;
    }
  }
  return slug;
}

/**
 * Looks up a vehicle in src/data/vehiclePhotoMap.json (Tier 1).
 * Returns { url, key, isExactMapMatch }.
 */
export function lookupVerifiedPhotoFromMap(vehicle = {}) {
  if (!vehicle || typeof vehicle !== 'object') {
    return { url: null, key: null, isExactMapMatch: false };
  }

  const rawBrand = vehicle.brand || (vehicle.name || '').split(' ')[0] || '';
  const normBrand = canonicalizeBrandPrefix(normalizePhotoKey(rawBrand, ''));
  const cleanedName = (vehicle.name || '')
    .replace(/\([^)]*\)/g, '')
    .trim();

  const rawModelInput =
    vehicle.model ||
    vehicle.modelName ||
    (rawBrand ? cleanedName.replace(new RegExp(`^${rawBrand}\\s+`, 'i'), '').trim() : '');

  const candidateKeys = [
    normBrand && vehicle.model ? normalizePhotoKey(normBrand, vehicle.model) : '',
    normBrand && vehicle.modelName ? normalizePhotoKey(normBrand, vehicle.modelName) : '',
    vehicle.id ? canonicalizeBrandPrefix(normalizePhotoKey('', vehicle.id)) : '',
    cleanedName ? canonicalizeBrandPrefix(normalizePhotoKey('', cleanedName)) : '',
    vehicle.shortName ? canonicalizeBrandPrefix(normalizePhotoKey('', vehicle.shortName)) : '',
    normBrand && vehicle.shortName ? normalizePhotoKey(normBrand, vehicle.shortName) : '',
  ]
    .filter(Boolean)
    .filter((k) => k !== normBrand);

  // 1. Direct key hit in vehiclePhotoMap.json
  for (const key of candidateKeys) {
    if (vehiclePhotoMap[key]) {
      return { url: vehiclePhotoMap[key], key, isExactMapMatch: true };
    }
  }

  // 2. Prefix / normalized model match against vehiclePhotoMap.json keys (only when key includes a model segment)
  for (const key of candidateKeys) {
    if (!key.includes('-')) continue;
    const prefixHit = PHOTO_MAP_KEYS.find(
      (mapKey) => mapKey.startsWith(`${key}-`) || key.startsWith(`${mapKey}-`)
    );
    if (prefixHit && vehiclePhotoMap[prefixHit]) {
      return { url: vehiclePhotoMap[prefixHit], key: prefixHit, isExactMapMatch: true };
    }
  }

  // 3. Token intersection match for make + primary model token
  const primaryModelToken = normalizePhotoKey('', (rawModelInput || '').split(/[/,(]/)[0] || '');

  if (normBrand && primaryModelToken && primaryModelToken !== normBrand) {
    const combinedPrefix = `${normBrand}-${primaryModelToken}`;
    const tokenHit = PHOTO_MAP_KEYS.find(
      (mapKey) =>
        mapKey === combinedPrefix ||
        mapKey.startsWith(`${combinedPrefix}-`) ||
        (mapKey.startsWith(`${normBrand}-`) && mapKey.includes(`-${primaryModelToken}`))
    );
    if (tokenHit && vehiclePhotoMap[tokenHit]) {
      return { url: vehiclePhotoMap[tokenHit], key: tokenHit, isExactMapMatch: true };
    }
  }

  return {
    url: null,
    key: candidateKeys[0] || (normBrand && primaryModelToken ? `${normBrand}-${primaryModelToken}` : null),
    isExactMapMatch: false,
  };
}

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
 * Tier 1: Direct lookup in src/data/vehiclePhotoMap.json.
 * Tier 2: Cached Wikipedia REST API thumbnail in localStorage (if previously resolved).
 * Tier 3: Brand or Segment fallback photo.
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

  // Tier 1: Exact or normalized match from src/data/vehiclePhotoMap.json
  const mapLookup = lookupVerifiedPhotoFromMap(vehicle);
  if (mapLookup.url) {
    return mapLookup.url;
  }

  // Tier 2 (Sync Cache Check): Check localStorage for previously fetched Wikipedia photo
  if (mapLookup.key && typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem(`shiftmetric_wiki_photo_${mapLookup.key}`);
      if (cached && cached.startsWith('http')) {
        return cached;
      }
    } catch {
      // Ignore storage access errors
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

function isValidWikiVehiclePhotoUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const clean = rawUrl.split('?')[0].toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].some((ext) => clean.endsWith(ext))) {
    return false;
  }
  const banned = ['logo', 'emblem', 'badge', 'wordmark', 'engine_bay', 'dashboard', 'interior', 'cockpit', 'diagram', 'map'];
  return !banned.some((kw) => clean.includes(kw));
}

/**
 * Real Automotive Photography Resolver
 * Renders verified 3/4-angle vehicle photographs inside a recessed zinc frame
 * (aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900)
 * without floating overlay text covering tires or bumpers.
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

  const mapLookup = useMemo(() => lookupVerifiedPhotoFromMap(vehicle), [vehicle]);

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

  // Tier 2: Live Client-Side Fallback to Wikipedia REST Summary API for custom/new models
  useEffect(() => {
    if (imageUrl || cdnTemplate || mapLookup.isExactMapMatch) return;
    if (!mapLookup.key) return;

    const cacheKey = `shiftmetric_wiki_photo_${mapLookup.key}`;
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached && cached.startsWith('http')) {
          setActiveSrc(cached);
          return;
        }
      } catch {
        // Ignore storage errors
      }
    }

    if (typeof fetch !== 'function') return;

    const make = (vehicle?.brand || '').trim();
    const model = (vehicle?.model || vehicle?.modelName || vehicle?.name || '')
      .replace(/\([^)]*\)/g, '')
      .split('/')[0]
      .trim();
    const wikiQuery = `${make} ${model}`.trim();
    if (!wikiQuery || wikiQuery.length < 3) return;

    let cancelled = false;
    const summaryEndpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      wikiQuery.replace(/\s+/g, '_')
    )}`;

    fetch(summaryEndpoint, { headers: { Accept: 'application/json' } })
      .then((res) => (res && res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const candidateUrl = (data.thumbnail?.source || data.originalimage?.source || '').split('?')[0];
        const width = data.originalimage?.width || data.thumbnail?.width || 0;
        if (width >= 400 && isValidWikiVehiclePhotoUrl(candidateUrl)) {
          const hiResUrl = candidateUrl.replace(/\/\d+px-/, '/960px-');
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(cacheKey, hiResUrl);
            }
          } catch {
            // Ignore storage errors
          }
          setActiveSrc(hiResUrl);
          setImgFailed(false);
        }
      })
      .catch(() => {
        // Silent fallback to segment photo
      });

    return () => {
      cancelled = true;
    };
  }, [vehicle, imageUrl, cdnTemplate, mapLookup.isExactMapMatch, mapLookup.key]);

  const bodyLabel = getArchetypeLabel(bodyArchetype);

  return (
    <div
      className={`relative aspect-[16/9] w-full h-full flex items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900 select-none ${className}`}
      data-testid="vehicle-image-resolver"
      data-tier={mapLookup.isExactMapMatch ? 'tier-1-photo' : 'tier-2-wiki-fallback'}
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

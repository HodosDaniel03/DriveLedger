import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VEHICLE_CATALOG } from '../src/data/vehicleCatalog.js';
import { VEHICLE_PRESETS } from '../src/data/vehiclePresets.js';
import { MODULAR_BRANDS } from '../src/data/vehicles/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, '../src/data/vehiclePhotoMap.json');

const USER_AGENT = 'ShiftMetricVehiclePhotoSync/1.0 (https://shiftmetric.com; contact@shiftmetric.com)';

export function normalizeVehicleKey(make, model) {
  const raw = `${make || ''}-${model || ''}`;
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function cleanWikimediaUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  return rawUrl
    .split('?')[0]
    .replace('https://thumb.wikimedia.org/', 'https://upload.wikimedia.org/')
    .replace(/\/\d+px-/, '/960px-');
}

export function extractWikimediaFilename(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const clean = rawUrl.split('?')[0];
    const lastSegment = decodeURIComponent(clean.split('/').pop() || '');
    return lastSegment.replace(/^\d+px-/, '').toLowerCase();
  } catch {
    return rawUrl.toLowerCase();
  }
}

function isUrlOrFileUsed(url, usedUrls, usedFilenames) {
  if (!url) return true;
  const fn = extractWikimediaFilename(url);
  return usedUrls.has(url) || (Boolean(fn) && usedFilenames.has(fn));
}

function markUrlAndFileUsed(url, usedUrls, usedFilenames) {
  if (!url) return;
  usedUrls.add(url);
  const fn = extractWikimediaFilename(url);
  if (fn) usedFilenames.add(fn);
}

const REJECT_KEYWORDS = [
  'logo',
  'emblem',
  'badge',
  'wordmark',
  'coat_of_arms',
  'engine_bay',
  'engine_compartment',
  'motorraum',
  'modifizierter_motor',
  '_engine',
  'engine_',
  'interior',
  'innenraum',
  'dashboard',
  'cockpit',
  'cabin',
  'steering_wheel',
  'steering-wheel',
  'lenkrad',
  'diagram',
  'schematic',
  'blueprint',
  'graph',
  'chart',
  'sales_map',
  'icon',
  'symbol',
  'flag_of',
  'signature',
  'portrait',
  'founder',
  'headquarters',
  'racing',
  'rally',
  'motorsport',
  'btcc',
  'wtcc',
  'wtcr',
  'medical_car',
  'safety_car',
  'circuit',
  'cycliste',
  'cofidis',
  'custom_car_show',
  'police',
  'polizei',
  'gendarmerie',
  'ambulance',
  'wreck',
  'accident',
];

export function isValidExteriorPhotoUrl(url, width = 800, title = '') {
  const cleaned = cleanWikimediaUrl(url);
  if (!cleaned) return false;
  const lowerUrl = cleaned.toLowerCase();
  const lowerTitle = (title || '').toLowerCase().replace(/\s+/g, '_');

  // Reject SVG or non-photo extensions
  if (
    lowerUrl.includes('.svg') ||
    lowerUrl.includes('.gif') ||
    lowerUrl.includes('.pdf') ||
    lowerUrl.includes('.tif') ||
    lowerUrl.includes('.webm') ||
    lowerUrl.includes('.ogv')
  ) {
    return false;
  }

  // Must end with a valid raster photo extension
  const hasValidExt =
    lowerUrl.endsWith('.jpg') ||
    lowerUrl.endsWith('.jpeg') ||
    lowerUrl.endsWith('.png') ||
    lowerUrl.endsWith('.webp');
  if (!hasValidExt) return false;

  // Enforce minimum width >= 600px
  if (Number(width) > 0 && Number(width) < 600) {
    return false;
  }

  // Reject logos, emblems, engines, or interior diagrams
  const combined = `${lowerUrl} ${lowerTitle}`;
  for (const kw of REJECT_KEYWORDS) {
    if (combined.includes(kw)) {
      return false;
    }
  }

  return true;
}

async function fetchJsonWithRetry(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
      });
      if (res.status === 404) return null;
      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 250 * (i + 1)));
        continue;
      }
      return await res.json();
    } catch {
      await new Promise((r) => setTimeout(r, 250 * (i + 1)));
    }
  }
  return null;
}

function buildWikiCandidateTitles(make, model) {
  const cleanMake = make.trim();
  const cleanModel = model.replace(/\s*\/.*$/, '').trim();
  const baseModel = cleanModel
    .replace(/\b(Hybrid|Recharge|Pro|Crew Cab|Combi|Touring|Sportback|Long Range|M340i|GTI)\b/gi, '')
    .trim();

  const candidates = [
    `${cleanMake}_${cleanModel}`,
    `${cleanMake}_${cleanModel}_(automobile)`,
    `${cleanMake}_${cleanModel}_(car)`,
  ];

  if (baseModel && baseModel !== cleanModel) {
    candidates.push(`${cleanMake}_${baseModel}`);
    candidates.push(`${cleanMake}_${baseModel}_(automobile)`);
  }

  // Brand-specific Wikipedia title conventions
  if (cleanMake.toLowerCase() === 'ford' && cleanModel.toLowerCase() === 'puma') {
    candidates.unshift('Ford_Puma_(crossover)');
  }
  if (cleanMake.toLowerCase() === 'honda' && cleanModel.toLowerCase() === 'jazz') {
    candidates.unshift('Honda_Fit');
  }
  if (cleanMake.toLowerCase() === 'fiat' && cleanModel.toLowerCase() === '500') {
    candidates.unshift('Fiat_500_(2007)', 'Fiat_New_500');
  }
  if (cleanMake.toLowerCase() === 'fiat' && cleanModel.toLowerCase() === 'tipo') {
    candidates.unshift('Fiat_Tipo_(2015)');
  }
  if (cleanMake.toLowerCase() === 'cupra' && cleanModel.toLowerCase() === 'leon') {
    return ['Cupra_León', 'Cupra_Leon'];
  }
  if (cleanMake.toLowerCase() === 'volkswagen' && cleanModel.toLowerCase() === 'golf gti') {
    return ['Volkswagen_Golf_GTI'];
  }
  if (cleanMake.toLowerCase() === 'mazda' && cleanModel.toLowerCase().startsWith('mazda ')) {
    const collapsed = cleanModel.replace(/\s+/g, '');
    candidates.unshift(collapsed, `Mazda_${collapsed}`);
  }
  if (cleanMake.toLowerCase() === 'mini') {
    candidates.unshift(`Mini_${cleanModel}`, `Mini_Hatch`, `Mini_(marque)`);
  }
  if (cleanMake.toLowerCase() === 'mercedes-benz' && !cleanModel.toLowerCase().includes('class')) {
    candidates.unshift(`Mercedes-Benz_${cleanModel}-Class`, `Mercedes-Benz_${cleanModel}`);
  }
  if (cleanMake.toLowerCase() === 'land rover' && cleanModel.toLowerCase().startsWith('range rover')) {
    candidates.unshift(cleanModel.replace(/\s+/g, '_'));
  }
  if (cleanMake.toLowerCase() === 'ds automobiles') {
    candidates.unshift(cleanModel.replace(/\s+/g, '_'));
  }

  return Array.from(new Set(candidates.map((c) => c.replace(/\s+/g, '_'))));
}

async function queryWikipediaSummary(make, model, usedUrls, usedFilenames) {
  const titles = buildWikiCandidateTitles(make, model);
  for (const wikiTitle of titles) {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
    const data = await fetchJsonWithRetry(url, 1);
    if (!data || data.type === 'disambiguation') continue;

    const thumbUrl = data.thumbnail?.source ? cleanWikimediaUrl(data.thumbnail.source) : null;
    const origUrl = data.originalimage?.source ? cleanWikimediaUrl(data.originalimage.source) : null;
    const origWidth = Number(data.originalimage?.width) || 960;

    for (const candidateUrl of [thumbUrl, origUrl]) {
      if (
        candidateUrl &&
        !isUrlOrFileUsed(candidateUrl, usedUrls, usedFilenames) &&
        isValidExteriorPhotoUrl(candidateUrl, Math.max(origWidth, 800), data.title || wikiTitle)
      ) {
        return candidateUrl;
      }
    }
  }
  return null;
}

async function queryWikimediaCommons(make, model, usedUrls, usedFilenames) {
  const cleanModel = model.replace(/\s*\/.*$/, '').trim();
  const baseToken = cleanModel
    .replace(/\b(Hybrid|Recharge|Pro|Crew Cab|Combi|Touring|Sportback|Long Range|M340i|Series|Class)\b/gi, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const queries = [
    `${make} ${cleanModel} car`,
    `${make} ${cleanModel} front`,
    `${make} ${cleanModel} automobile`,
    `${make} ${cleanModel}`,
  ];

  for (const q of queries) {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      q
    )}&gsrnamespace=6&gsrlimit=30&prop=imageinfo&iiprop=url|dimensions&iiurlwidth=800&format=json&origin=*`;

    const data = await fetchJsonWithRetry(apiUrl, 2);
    const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
    if (!pages.length) continue;

    pages.sort((a, b) => (a.index || 999) - (b.index || 999));

    for (const page of pages) {
      const info = page?.imageinfo?.[0];
      if (!info) continue;
      const origWidth = Number(info.width) || 0;
      const thumbWidth = Number(info.thumbwidth) || origWidth;
      if (origWidth < 600 && thumbWidth < 600) continue;

      const normTitle = (page.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (baseToken && baseToken.length >= 2 && !normTitle.includes(baseToken)) {
        continue;
      }

      const candidateUrl = cleanWikimediaUrl(info.thumburl || info.url);
      if (
        candidateUrl &&
        !isUrlOrFileUsed(candidateUrl, usedUrls, usedFilenames) &&
        isValidExteriorPhotoUrl(candidateUrl, Math.max(origWidth, thumbWidth), page.title || '')
      ) {
        return candidateUrl;
      }
    }
  }
  return null;
}

function collectAllMakeModelPairs() {
  const pairs = new Map();

  for (const brand of VEHICLE_CATALOG) {
    for (const model of brand.models) {
      const key = normalizeVehicleKey(brand.name, model.name);
      if (key && !pairs.has(key)) {
        pairs.set(key, { make: brand.name, model: model.name });
      }
    }
  }

  for (const brand of MODULAR_BRANDS) {
    for (const model of brand.models) {
      const makeName = model.brand || brand.name;
      const key = normalizeVehicleKey(makeName, model.name);
      if (key && !pairs.has(key)) {
        pairs.set(key, { make: makeName, model: model.name });
      }
    }
  }

  for (const preset of VEHICLE_PRESETS) {
    const brandName = preset.brand || (preset.name || '').split(' ')[0];
    const rawModel = preset.modelName || '';
    const subModels = rawModel
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const sub of subModels) {
      const key = normalizeVehicleKey(brandName, sub);
      if (key && !pairs.has(key)) {
        pairs.set(key, { make: brandName, model: sub });
      }
    }

    const fullKey = normalizeVehicleKey(brandName, rawModel);
    if (fullKey && !pairs.has(fullKey)) {
      pairs.set(fullKey, { make: brandName, model: rawModel });
    }
  }

  return pairs;
}

async function main() {
  const pairs = collectAllMakeModelPairs();
  console.log(`Harvesting verified real exterior photos for ${pairs.size} unique Make + Model pairs...`);

  const photoMap = {};
  const usedUrls = new Set();
  const usedFilenames = new Set();
  const entries = Array.from(pairs.entries());

  const BATCH_SIZE = 5;
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async ([key, { make, model }]) => {
        const wikiUrl = await queryWikipediaSummary(make, model, usedUrls, usedFilenames);
        return { key, make, model, wikiUrl };
      })
    );

    for (const item of results) {
      let finalUrl = item.wikiUrl;
      if (!finalUrl || isUrlOrFileUsed(finalUrl, usedUrls, usedFilenames)) {
        finalUrl = await queryWikimediaCommons(item.make, item.model, usedUrls, usedFilenames);
      }
      if (finalUrl && !isUrlOrFileUsed(finalUrl, usedUrls, usedFilenames)) {
        markUrlAndFileUsed(finalUrl, usedUrls, usedFilenames);
        photoMap[item.key] = finalUrl;
        console.log(`  [OK] ${item.key} -> ${finalUrl}`);
      } else {
        console.warn(`  [WARN] Could not resolve photo for ${item.key} (${item.make} ${item.model})`);
      }
    }
  }

  // Sort keys alphabetically for deterministic JSON output
  const sortedMap = Object.keys(photoMap)
    .sort()
    .reduce((acc, k) => {
      acc[k] = photoMap[k];
      return acc;
    }, {});

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sortedMap, null, 2) + '\n', 'utf8');

  const totalKeys = Object.keys(sortedMap).length;
  const uniqueUrls = new Set(Object.values(sortedMap)).size;
  const uniqueFiles = new Set(Object.values(sortedMap).map(extractWikimediaFilename)).size;
  console.log(`\nSaved ${totalKeys}/${pairs.size} verified vehicle photos to ${OUTPUT_PATH}`);
  console.log(`Unique URLs: ${uniqueUrls}/${totalKeys}, Unique Wikimedia files: ${uniqueFiles}/${totalKeys} (Zero duplicates: ${uniqueUrls === totalKeys && uniqueFiles === totalKeys})`);

  if (uniqueUrls !== totalKeys || uniqueFiles !== totalKeys || totalKeys < pairs.size) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}

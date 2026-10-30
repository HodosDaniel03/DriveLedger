import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Cpu, Gauge } from 'lucide-react';
import VehicleSilhouette from './VehicleSilhouette.jsx';
import {
  resolveBodyArchetype,
  resolvePowertrainArchetype,
  getArchetypeLabel,
} from './vehicleArchetypes.js';

/**
 * Brand Marque Identity & Tier Multiplier Registry
 * Provides monogram initials, crest styling, and baseline maintenance tier multipliers
 * for global & European automotive manufacturers.
 */
const BRAND_MARQUE_REGISTRY = {
  ford: {
    name: 'Ford',
    monogram: 'FD',
    countryCode: 'US',
    defaultMultiplier: 1.15,
    crestBg: 'bg-blue-600 text-white border-blue-400/50 dark:bg-blue-500 dark:border-blue-300/40',
  },
  volkswagen: {
    name: 'Volkswagen',
    monogram: 'VW',
    countryCode: 'DE',
    defaultMultiplier: 1.15,
    crestBg: 'bg-sky-700 text-white border-sky-400/50 dark:bg-sky-600 dark:border-sky-300/40',
  },
  vw: {
    name: 'Volkswagen',
    monogram: 'VW',
    countryCode: 'DE',
    defaultMultiplier: 1.15,
    crestBg: 'bg-sky-700 text-white border-sky-400/50 dark:bg-sky-600 dark:border-sky-300/40',
  },
  bmw: {
    name: 'BMW',
    monogram: 'BMW',
    countryCode: 'DE',
    defaultMultiplier: 1.55,
    crestBg: 'bg-indigo-700 text-white border-indigo-400/50 dark:bg-indigo-600 dark:border-indigo-300/40',
  },
  audi: {
    name: 'Audi',
    monogram: 'AUDI',
    countryCode: 'DE',
    defaultMultiplier: 1.50,
    crestBg: 'bg-slate-800 text-white border-slate-500/50 dark:bg-slate-700 dark:border-slate-400/40',
  },
  'mercedes-benz': {
    name: 'Mercedes-Benz',
    monogram: 'MB',
    countryCode: 'DE',
    defaultMultiplier: 1.55,
    crestBg: 'bg-zinc-800 text-amber-300 border-amber-400/40 dark:bg-zinc-700 dark:border-amber-300/40',
  },
  mercedes: {
    name: 'Mercedes-Benz',
    monogram: 'MB',
    countryCode: 'DE',
    defaultMultiplier: 1.55,
    crestBg: 'bg-zinc-800 text-amber-300 border-amber-400/40 dark:bg-zinc-700 dark:border-amber-300/40',
  },
  porsche: {
    name: 'Porsche',
    monogram: 'POR',
    countryCode: 'DE',
    defaultMultiplier: 1.75,
    crestBg: 'bg-red-700 text-amber-200 border-amber-400/50 dark:bg-red-600 dark:border-amber-300/40',
  },
  toyota: {
    name: 'Toyota',
    monogram: 'TYT',
    countryCode: 'JP',
    defaultMultiplier: 0.95,
    crestBg: 'bg-rose-600 text-white border-rose-400/50 dark:bg-rose-500 dark:border-rose-300/40',
  },
  lexus: {
    name: 'Lexus',
    monogram: 'LEX',
    countryCode: 'JP',
    defaultMultiplier: 1.35,
    crestBg: 'bg-slate-800 text-slate-100 border-slate-500/50 dark:bg-slate-700 dark:border-slate-400/40',
  },
  tesla: {
    name: 'Tesla',
    monogram: 'TSLA',
    countryCode: 'US',
    defaultMultiplier: 1.30,
    crestBg: 'bg-red-600 text-white border-red-400/50 dark:bg-red-500 dark:border-red-300/40',
  },
  skoda: {
    name: 'Škoda',
    monogram: 'SK',
    countryCode: 'CZ',
    defaultMultiplier: 1.05,
    crestBg: 'bg-emerald-700 text-white border-emerald-400/50 dark:bg-emerald-600 dark:border-emerald-300/40',
  },
  seat: {
    name: 'SEAT',
    monogram: 'SEAT',
    countryCode: 'ES',
    defaultMultiplier: 1.05,
    crestBg: 'bg-orange-600 text-white border-orange-400/50 dark:bg-orange-500 dark:border-orange-300/40',
  },
  cupra: {
    name: 'Cupra',
    monogram: 'CUP',
    countryCode: 'ES',
    defaultMultiplier: 1.25,
    crestBg: 'bg-amber-700 text-amber-100 border-amber-400/50 dark:bg-amber-600 dark:border-amber-300/40',
  },
  volvo: {
    name: 'Volvo',
    monogram: 'VOL',
    countryCode: 'SE',
    defaultMultiplier: 1.40,
    crestBg: 'bg-blue-800 text-white border-blue-400/50 dark:bg-blue-700 dark:border-blue-300/40',
  },
  hyundai: {
    name: 'Hyundai',
    monogram: 'HYU',
    countryCode: 'KR',
    defaultMultiplier: 1.05,
    crestBg: 'bg-blue-700 text-white border-blue-400/50 dark:bg-blue-600 dark:border-blue-300/40',
  },
  kia: {
    name: 'Kia',
    monogram: 'KIA',
    countryCode: 'KR',
    defaultMultiplier: 1.05,
    crestBg: 'bg-slate-900 text-white border-slate-500/50 dark:bg-slate-700 dark:border-slate-400/40',
  },
  honda: {
    name: 'Honda',
    monogram: 'HND',
    countryCode: 'JP',
    defaultMultiplier: 1.00,
    crestBg: 'bg-red-600 text-white border-red-400/50 dark:bg-red-500 dark:border-red-300/40',
  },
  mazda: {
    name: 'Mazda',
    monogram: 'MZD',
    countryCode: 'JP',
    defaultMultiplier: 1.05,
    crestBg: 'bg-rose-800 text-white border-rose-400/50 dark:bg-rose-700 dark:border-rose-300/40',
  },
  nissan: {
    name: 'Nissan',
    monogram: 'NIS',
    countryCode: 'JP',
    defaultMultiplier: 1.10,
    crestBg: 'bg-slate-700 text-white border-slate-400/50 dark:bg-slate-600 dark:border-slate-300/40',
  },
  renault: {
    name: 'Renault',
    monogram: 'REN',
    countryCode: 'FR',
    defaultMultiplier: 1.10,
    crestBg: 'bg-amber-500 text-slate-950 border-amber-300/60 dark:bg-amber-400 dark:text-slate-950',
  },
  peugeot: {
    name: 'Peugeot',
    monogram: 'PEU',
    countryCode: 'FR',
    defaultMultiplier: 1.10,
    crestBg: 'bg-indigo-900 text-white border-indigo-400/50 dark:bg-indigo-800 dark:border-indigo-300/40',
  },
  citroen: {
    name: 'Citroën',
    monogram: 'CIT',
    countryCode: 'FR',
    defaultMultiplier: 1.10,
    crestBg: 'bg-red-700 text-white border-red-400/50 dark:bg-red-600 dark:border-red-300/40',
  },
  dacia: {
    name: 'Dacia',
    monogram: 'DAC',
    countryCode: 'RO',
    defaultMultiplier: 0.90,
    crestBg: 'bg-teal-700 text-white border-teal-400/50 dark:bg-teal-600 dark:border-teal-300/40',
  },
  opel: {
    name: 'Opel',
    monogram: 'OPL',
    countryCode: 'DE',
    defaultMultiplier: 1.10,
    crestBg: 'bg-yellow-500 text-slate-950 border-yellow-300/60 dark:bg-yellow-400 dark:text-slate-950',
  },
};

/**
 * Resolves the brand monogram shield metadata and tier multiplier pill for a vehicle.
 * @param {object} vehicle
 * @returns {{ brandName: string, monogram: string, crestBg: string, multiplierValue: number, tierClassLabel: string, tierPillText: string }}
 */
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
    crestBg: 'bg-slate-700 text-white border-slate-500/50 dark:bg-slate-600 dark:border-slate-400/40',
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
 * Resolves an optional Tier 1 external/CDN transparent vehicle image URL.
 * @param {object} params
 * @param {object} params.vehicle
 * @param {string} [params.imageUrl]
 * @param {string} [params.cdnTemplate]
 * @returns {string|null}
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

  return null;
}

/**
 * Derives a high-density powertrain & transmission micro-badge string for Tier 3 overlays.
 * Examples: '2.0L Turbo Diesel · DPF/SCR', 'Dual-Clutch DSG', 'Hybrid e-CVT', 'BEV Lithium'
 * @param {object} vehicle
 * @returns {{ primaryTag: string, transmissionTag: string }}
 */
export function derivePowertrainMicroBadge(vehicle = {}) {
  const powertrain = resolvePowertrainArchetype(vehicle);
  const label = vehicle.powertrainLabel || vehicle.engineCode || '';
  const trans = (vehicle.transmission || vehicle.transmissionLabel || '').toLowerCase();

  // Extract engine displacement if present (e.g. "2.0L", "1.5L", "3.0L")
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
    primaryTag = `${dispPrefix}Turbo Diesel · DPF/SCR`;
  } else if (powertrain === 'petrol-na') {
    primaryTag = `${dispPrefix}Naturally Aspirated`.trim();
  } else {
    primaryTag = `${dispPrefix}Turbo GDI`.trim();
  }

  let transmissionTag = 'Adaptive Auto';
  if (powertrain === 'ev' || trans.includes('single-speed')) {
    transmissionTag = '1-Spd Direct';
  } else if (trans.includes('cvt') || powertrain === 'hybrid') {
    transmissionTag = 'Hybrid e-CVT';
  } else if (
    trans.includes('dsg') ||
    trans.includes('dct') ||
    trans.includes('pdk') ||
    trans.includes('dual-clutch') ||
    trans.includes('powershift')
  ) {
    transmissionTag = 'Dual-Clutch DSG';
  } else if (trans.includes('manual')) {
    transmissionTag = '6-Spd Manual';
  } else if (trans.includes('torque-converter') || trans.includes('zf') || trans.includes('auto')) {
    transmissionTag = 'Torque-Conv Auto';
  }

  return {
    primaryTag,
    transmissionTag,
  };
}

/**
 * Multi-Tier VehicleImageResolver & Studio SVG Component (Phase 5.2)
 *
 * Implements a resilient 3-tier visual resolution pipeline:
 *  - Tier 1: Real Transparent PNG / CDN Image with lazy loading, fade-in & automatic error trapping
 *  - Tier 2: Body-Specific Multi-Layer Studio SVG Fallback across all 7 archetypes
 *  - Tier 3: Integrated Brand Monogram Shield, Brand Tier Multiplier Pill, and Powertrain/Archetype Micro-Badges
 */
export default function VehicleImageResolver({
  vehicle = {},
  variant = 'hero',
  imageUrl,
  cdnTemplate,
  interactive = true,
  showOverlays = true,
  className = '',
}) {
  const resolvedPhotoUrl = useMemo(
    () => resolveVehiclePhotoUrl({ vehicle, imageUrl, cdnTemplate }),
    [vehicle, imageUrl, cdnTemplate]
  );

  const [imgFailed, setImgFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Reset image error/loaded states whenever the target vehicle or photo URL changes
  useEffect(() => {
    setImgFailed(false);
    setImgLoaded(false);
  }, [resolvedPhotoUrl, vehicle?.id]);

  const bodyArchetype = resolveBodyArchetype(vehicle);
  const bodyLabel = getArchetypeLabel(bodyArchetype);
  const brandIdentity = useMemo(() => resolveBrandIdentity(vehicle), [vehicle]);
  const microBadge = useMemo(() => derivePowertrainMicroBadge(vehicle), [vehicle]);

  const isCompact = variant === 'compact';
  const showPhoto = Boolean(resolvedPhotoUrl) && !imgFailed;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-slate-100/90 to-slate-200/75 dark:bg-slate-900/90 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-800/90 dark:border-slate-700 dark:text-slate-100 select-none ${className}`}
      data-testid="vehicle-image-resolver"
      data-tier={showPhoto ? 'tier-1-photo' : 'tier-2-studio-svg'}
      data-archetype={bodyArchetype}
    >
      {/* TIER 1: Real Transparent PNG / CDN Image */}
      {showPhoto ? (
        <img
          src={resolvedPhotoUrl}
          alt={vehicle?.name || 'Vehicle'}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgFailed(true)}
          className={`w-full h-full object-contain p-2 transition-all duration-500 ease-out ${
            interactive ? 'group-hover:scale-[1.03]' : ''
          } ${imgLoaded ? 'opacity-100' : 'opacity-95'}`}
        />
      ) : (
        /* TIER 2: Body-Specific Multi-Layer Studio SVG Fallback */
        <VehicleSilhouette
          vehicle={vehicle}
          className="w-full h-full"
          interactive={interactive}
        />
      )}

      {/* TIER 3: Integrated Brand Monogram Shield & Powertrain Archetype Overlays */}
      {showOverlays && (
        <>
          {/* Top-Left Overlay: Brand Monogram Shield & Tier Multiplier Pill */}
          <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 pointer-events-none max-w-[72%]">
            <div className="inline-flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700 shadow-sm text-slate-900 dark:text-slate-100">
              {/* Stylized Marque Crest Monogram */}
              <span
                className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold tracking-tighter border leading-none ${brandIdentity.crestBg}`}
              >
                {brandIdentity.monogram}
              </span>

              {/* Brand Name */}
              <span className="text-[10px] font-semibold tracking-tight truncate max-w-[78px] sm:max-w-[96px]">
                {brandIdentity.brandName}
              </span>

              {/* Brand Tier Multiplier Pill (Hidden on ultra-compact comparator view to preserve canvas breathing room) */}
              {!isCompact && (
                <span className="hidden xs:inline-flex items-center px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-mono font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 whitespace-nowrap">
                  {brandIdentity.tierPillText}
                </span>
              )}
            </div>
          </div>

          {/* Top-Right Overlay (Compact Mode): Body Archetype Pill */}
          {isCompact && (
            <span className="absolute top-1.5 right-1.5 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-[10px] font-mono px-2 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-100 font-semibold uppercase pointer-events-none">
              {bodyArchetype}
            </span>
          )}

          {/* Bottom Overlay Strip: Body Archetype Pill (Left) & Powertrain/Transmission Micro-Badge (Right) */}
          <div className="absolute bottom-1.5 inset-x-1.5 z-10 flex items-center justify-between gap-1 pointer-events-none">
            {/* Body Archetype Label Pill */}
            {!isCompact ? (
              <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-[10px] font-mono px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold shadow-xs truncate">
                {bodyLabel}
              </span>
            ) : (
              <span />
            )}

            {/* Powertrain & Transmission Micro-Badge */}
            <span
              className="bg-slate-900/85 dark:bg-slate-900/90 text-white dark:text-slate-100 backdrop-blur-sm text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-md border border-slate-700/80 dark:border-slate-700 font-medium tracking-tight shadow-xs truncate max-w-[70%]"
              title={`${microBadge.primaryTag} · ${microBadge.transmissionTag}`}
            >
              {isCompact
                ? microBadge.transmissionTag
                : `${microBadge.primaryTag} · ${microBadge.transmissionTag}`}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

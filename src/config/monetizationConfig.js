/**
 * DriveLedger — Turnkey Monetization & Site Configuration Control Center
 * Single Source of Truth for Site Metadata, Google AdSense Slots, and Affiliate Partner Links.
 *
 * To activate live monetization in production:
 * 1. Set `adsenseEnabled: true` and replace `publisherId` + `slots` with your live Google AdSense IDs.
 * 2. Set your approved partner tracking parameters in `affiliatePartners` (`affiliateParam`).
 */

import { REGIONAL_PARTNER_URLS } from '../data/affiliatePartners.js';

export const SITE_METADATA = {
  brandName: 'DriveLedger',
  domain: 'mydriveledger.com',
  contactEmail: 'contact@mydriveledger.com',
  legalEmail: 'legal@mydriveledger.com',
  lastUpdated: 'November 6, 2026',
};

export const ADSENSE_CONFIG = {
  adsenseEnabled: false,
  publisherId: 'ca-pub-6581535125716295',
  slots: {
    topLeaderboard: '1111111111',
    inContentRectangle: '2222222222',
    bottomStickyBanner: '3333333333',
  },
};

export const affiliatePartners = {
  vinCheck: {
    name: 'carVertical',
    baseUrl: 'https://www.carvertical.com/en/landing/v3',
    affiliateParam: 'a=YOUR_CARVERTICAL_ID',
    buttonText: 'Check Vehicle VIN History',
    badgeText: 'Official History Report',
  },
  obdScanner: {
    name: 'Amazon Automotive',
    baseUrl: 'https://www.amazon.com/s?k=Bluetooth+OBD2+Scanner',
    affiliateParam: 'tag=YOUR_AMAZON_TAG-20',
    buttonText: 'Get Recommended OBD2 Scanner',
    badgeText: 'Verified Diagnostic Tool',
  },
  autoInsurance: {
    name: 'Insurance Comparison',
    baseUrl: 'https://www.insurify.com/',
    affiliateParam: 'ref=YOUR_INSURANCE_ID',
    buttonText: 'Compare Insurance Rates',
    badgeText: 'Rate Comparison',
  },
  partsLookup: {
    name: 'OEM Parts Catalog',
    baseUrl: 'https://www.rockauto.com/',
    affiliateParam: 'ref=YOUR_PARTS_ID',
    buttonText: 'Check Replacement Part Prices',
    badgeText: 'Parts Supplier',
  },
};

export const AFFILIATE_PARTNERS = affiliatePartners;

export const FTC_PROXIMATE_DISCLOSURE =
  'Partner link · We may earn a commission at no extra cost to you.';

export const MONETIZATION_CONFIG = {
  ...SITE_METADATA,
  ...ADSENSE_CONFIG,
  site: SITE_METADATA,
  adsense: ADSENSE_CONFIG,
  affiliatePartners,
  ftcMicroDisclosure: FTC_PROXIMATE_DISCLOSURE,
};

const PARTNER_KEY_MAP = {
  vinCheck: 'vinCheck',
  'vin-check': 'vinCheck',
  obdScanner: 'obdScanner',
  'obd-scanner': 'obdScanner',
  autoInsurance: 'autoInsurance',
  'insurance-finance': 'autoInsurance',
  insurance: 'autoInsurance',
  partsLookup: 'partsLookup',
  'parts-lookup': 'partsLookup',
  parts: 'partsLookup',
  warranty: 'partsLookup',
};

/**
 * Normalizes any partner identifier (camelCase or kebab-case) to a canonical key in `affiliatePartners`.
 */
export function resolvePartnerKey(partnerKey = 'vinCheck') {
  return PARTNER_KEY_MAP[partnerKey] || 'vinCheck';
}

export function isPlaceholderAffiliateParam(param) {
  const cleaned = String(param || '').trim();
  if (!cleaned) return true;
  return /YOUR_[A-Z0-9_-]+/i.test(cleaned);
}

function appendTrackingParam(rawBaseUrl, affiliateParam, { skipPlaceholder = false } = {}) {
  const baseUrl = String(rawBaseUrl || '').trim();
  const rawParam = String(affiliateParam || '').trim().replace(/^[?&]+/, '');
  if (!rawParam || (skipPlaceholder && isPlaceholderAffiliateParam(rawParam)) || !baseUrl || baseUrl.includes(rawParam)) {
    return baseUrl;
  }
  const hashIdx = baseUrl.indexOf('#');
  if (hashIdx !== -1) {
    const baseWithoutHash = baseUrl.slice(0, hashIdx);
    const hash = baseUrl.slice(hashIdx);
    const separator = baseWithoutHash.includes('?') ? '&' : '?';
    return `${baseWithoutHash}${separator}${rawParam}${hash}`;
  }
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${rawParam}`;
}

/**
 * Automatically appends the affiliate tracking parameter for the requested partner
 * and returns safe external link props (`href`, `target: "_blank"`, `rel: "sponsored noopener noreferrer"`).
 *
 * @param {string} partnerKey - Key in `affiliatePartners` (e.g., 'vinCheck', 'obdScanner', 'autoInsurance', 'partsLookup')
 * @param {object} [vehicleContext] - Optional vehicle or diagnostic context
 * @returns {{ href: string, target: string, rel: string }}
 */
export function buildAffiliateUrl(partnerKey = 'vinCheck', vehicleContext = null) {
  const canonicalKey = resolvePartnerKey(partnerKey);
  const partner = affiliatePartners[canonicalKey] || affiliatePartners.vinCheck;
  const href = appendTrackingParam(partner.baseUrl, partner.affiliateParam);

  const linkProps = {
    href,
    target: '_blank',
    rel: 'sponsored noopener noreferrer',
  };

  Object.defineProperties(linkProps, {
    url: { value: href, enumerable: false },
    partnerKey: { value: canonicalKey, enumerable: false },
    partnerName: { value: partner.name, enumerable: false },
    buttonText: { value: partner.buttonText, enumerable: false },
    badgeText: { value: partner.badgeText, enumerable: false },
    vehicleContext: { value: vehicleContext || null, enumerable: false },
    toString: {
      value() {
        return href;
      },
      enumerable: false,
    },
  });

  return linkProps;
}

function defaultFormatCurrency(usd) {
  const num = Number(usd);
  const safe = Number.isFinite(num) ? Math.round(Math.max(0, num)) : 0;
  return `$${safe.toLocaleString('en-US')}`;
}

function defaultFormatDistance(miles) {
  const num = Number(miles);
  const safe = Number.isFinite(num) ? Math.round(Math.max(0, num)) : 0;
  return `${safe.toLocaleString('en-US')} mi`;
}

/**
 * Resolves a complete contextual partner offer from `monetizationConfig.js` and
 * `REGIONAL_PARTNER_URLS` (`affiliatePartners.js`) for `AffiliateCTA` and `TopTabAffiliateBanner`.
 */
export function resolveAffiliateOffer({
  type = 'vin-check',
  region = 'US',
  vehicleName = 'Selected Vehicle',
  purchasePriceUsd = 28500,
  vehiclePriceFormatted,
  odometerMiles,
  serviceReserveUsd,
  activeCode = 'P2002',
  activeCodeTitle = 'Diesel Particulate Filter Efficiency',
  cheapestCauseUsd,
  costliestCauseUsd,
  cheapCauseProbPct,
  insuranceAndInterest5YrUsd,
  insuranceSharePct,
  monthlySavingsEstUsd,
  formatCurrency = defaultFormatCurrency,
  formatDistance = defaultFormatDistance,
} = {}) {
  const regKey = ['US', 'UK', 'EU'].includes(String(region).toUpperCase())
    ? String(region).toUpperCase()
    : 'US';

  const canonicalKey = resolvePartnerKey(type);
  const partner = affiliatePartners[canonicalKey] || affiliatePartners.vinCheck;

  const regionalBucketKey =
    type === 'vin-check' || type === 'vinCheck'
      ? 'vin-check'
      : type === 'warranty' || type === 'partsLookup' || type === 'parts-lookup'
        ? 'warranty'
        : type === 'insurance-finance' || type === 'autoInsurance'
          ? 'insurance-finance'
          : 'obd-scanner';

  const regionalEntry =
    REGIONAL_PARTNER_URLS[regionalBucketKey]?.[regKey] ||
    REGIONAL_PARTNER_URLS[regionalBucketKey]?.US;

  const baseLinkProps = buildAffiliateUrl(canonicalKey, {
    type,
    region: regKey,
    vehicleName,
    purchasePriceUsd,
    odometerMiles,
    activeCode,
  });

  const resolvedHref = regionalEntry?.href
    ? appendTrackingParam(regionalEntry.href, partner.affiliateParam, { skipPlaceholder: true })
    : baseLinkProps.href;

  const linkProps = {
    ...baseLinkProps,
    href: resolvedHref,
  };

  const resolvedPartnerName = regionalEntry?.partnerName || partner.name;
  const resolvedTrustDetail = regionalEntry?.trustProof || '';

  const formattedPrice =
    vehiclePriceFormatted || formatCurrency(Number(purchasePriceUsd) || 28500);
  const hasOdometer = Number(odometerMiles) > 0;
  const formattedOdo = hasOdometer ? formatDistance(odometerMiles) : null;
  const hasReserve = Number(serviceReserveUsd) > 0;

  if (type === 'vin-check' || type === 'vinCheck') {
    const odoClause = formattedOdo ? ` at ${formattedOdo}` : '';
    return {
      type: 'vin-check',
      partnerKey: canonicalKey,
      region: regKey,
      partnerName: resolvedPartnerName,
      badgeText: partner.badgeText,
      badge: `Partner link · ${resolvedPartnerName}`,
      title: `Buying or owning this ${vehicleName}${odoClause}? Check odometer rollbacks & salvage records before paying ${formattedPrice}`,
      description: `Check chronological mileage records, past damage history, salvage or flood title status, and theft records via ${resolvedPartnerName} before paying ${formattedPrice}.`,
      features: [
        'Odometer Rollback Detection',
        'Salvage & Flood Title Records',
        'Accident & Repair History',
      ],
      ctaText: partner.buttonText,
      secondaryActionLabel: 'Run Instant VIN Check',
      href: resolvedHref,
      linkProps,
      highlightBadge: 'Mileage, damage & title history check',
      trustProof: `Partner link · ${resolvedPartnerName}${resolvedTrustDetail ? ` · ${resolvedTrustDetail}` : ''} · Run Instant VIN Check`,
      microDisclosure: FTC_PROXIMATE_DISCLOSURE,
    };
  }

  if (type === 'warranty' || type === 'partsLookup' || type === 'parts-lookup') {
    const savingsPerYr = formatCurrency(420);
    const reserveText = hasReserve
      ? `Projected 12-month wear exposure is ${formatCurrency(serviceReserveUsd)}${formattedOdo ? ` at ${formattedOdo}` : ''}. `
      : '';
    return {
      type: type === 'warranty' ? 'warranty' : 'parts-lookup',
      partnerKey: canonicalKey,
      region: regKey,
      partnerName: resolvedPartnerName,
      badgeText: partner.badgeText,
      badge: `Partner link · ${resolvedPartnerName}`,
      title: `Avoid unexpected workshop bills for ${vehicleName} — Compare repair protection & OEM replacement part prices (save up to ${savingsPerYr}/yr)`,
      description: `${reserveText}Compare OEM replacement part pricing and extended coverage options for fuel system, timing assembly, turbocharger, and transmission repairs.`,
      features: [
        `Save up to ${savingsPerYr}/yr on Coverage`,
        'OEM & Aftermarket Part Price Lookup',
        'Compare Warranty Plans & Parts',
      ],
      ctaText: partner.buttonText,
      secondaryActionLabel: 'Compare Warranty Plans',
      href: resolvedHref,
      linkProps,
      highlightBadge: `Save up to ${savingsPerYr}/yr on Coverage`,
      trustProof: `Partner link · ${resolvedPartnerName}${resolvedTrustDetail ? ` · ${resolvedTrustDetail}` : ''} · Compare Warranty Plans`,
      microDisclosure: FTC_PROXIMATE_DISCLOSURE,
    };
  }

  if (type === 'insurance-finance' || type === 'autoInsurance') {
    const totalOutlay =
      Number(insuranceAndInterest5YrUsd) > 0
        ? formatCurrency(insuranceAndInterest5YrUsd)
        : formatCurrency(6800);
    const shareLabel =
      Number(insuranceSharePct) > 0 ? ` (${Math.round(insuranceSharePct)}% of 5-yr TCO)` : '';
    const monthlySave =
      Number(monthlySavingsEstUsd) > 0
        ? formatCurrency(monthlySavingsEstUsd)
        : formatCurrency(45);
    return {
      type: 'insurance-finance',
      partnerKey: canonicalKey,
      region: regKey,
      partnerName: resolvedPartnerName,
      badgeText: partner.badgeText,
      badge: `Partner link · ${resolvedPartnerName}`,
      title: `Insurance & financing consume ${totalOutlay}${shareLabel} on ${vehicleName} — trim ~${monthlySave}/mo`,
      description: `Fixed insurance and APR charges account for${shareLabel || ' a major share of ownership cost'}. Compare motor insurance tariffs and refinancing quotes via ${resolvedPartnerName}.`,
      features: [
        `Trim ~${monthlySave}/mo off Fixed Costs`,
        'Multi-Carrier Rate Check',
        'APR Refinance Comparison',
      ],
      ctaText: partner.buttonText,
      secondaryActionLabel: 'Compare Lower Rates',
      href: resolvedHref,
      linkProps,
      highlightBadge: `Potential ${monthlySave}/mo Fixed-Cost Reduction`,
      trustProof: `Partner link · ${resolvedPartnerName}${resolvedTrustDetail ? ` · ${resolvedTrustDetail}` : ''}`,
      microDisclosure: FTC_PROXIMATE_DISCLOSURE,
    };
  }

  // Default: 'obd-scanner' / 'obdScanner'
  const diagFee = formatCurrency(150);
  const scannerCost = formatCurrency(39);
  const hasCauseDelta =
    Number(costliestCauseUsd) > 0 &&
    Number(cheapestCauseUsd) > 0 &&
    Number(costliestCauseUsd) > Number(cheapestCauseUsd);
  const paybackRatio = hasCauseDelta
    ? Math.max(4, Math.min(45, Math.round((costliestCauseUsd - cheapestCauseUsd) / 39)))
    : null;
  const probLabel =
    Number(cheapCauseProbPct) > 0 ? ` (${Math.round(cheapCauseProbPct)}% of cases)` : '';

  return {
    type: 'obd-scanner',
    partnerKey: canonicalKey,
    region: regKey,
    partnerName: resolvedPartnerName,
    badgeText: partner.badgeText,
    badge: `Partner link · ${resolvedPartnerName}`,
    title: `Don't pay ${diagFee}+ in workshop diagnostic fees — Read ${activeCode} and live sensor PIDs yourself with a Bluetooth OBD2 scanner`,
    description: hasCauseDelta
      ? `Before authorizing a ${formatCurrency(costliestCauseUsd)} replacement when a ${formatCurrency(cheapestCauseUsd)} sensor or seal fault${probLabel} triggers ${activeCode}, check live sensor PIDs on your phone with a ${scannerCost} scanner.`
      : `Read freeze-frame data, live O2/boost/fuel PIDs, and clear fault codes on your phone. Compatible hardware diagnostic tool for ${activeCodeTitle}.`,
    features: [
      'iOS & Android Bluetooth',
      'Live Sensor Telemetry PIDs',
      'Reset Check Engine Light',
    ],
    ctaText: partner.buttonText,
    secondaryActionLabel: partner.buttonText,
    href: resolvedHref,
    linkProps,
    highlightBadge: paybackRatio
      ? `${paybackRatio}x Payback vs. Blind Parts Swap`
      : 'Read fault codes & live sensor data at home',
    trustProof: `Partner link · ${resolvedPartnerName} · ${resolvedTrustDetail || 'Works with 1996+ OBD-II vehicles'}`,
    microDisclosure: FTC_PROXIMATE_DISCLOSURE,
  };
}

export default MONETIZATION_CONFIG;

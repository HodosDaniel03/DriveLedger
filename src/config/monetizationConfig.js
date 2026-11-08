/**
 * DriveLedger — Turnkey Monetization & Site Configuration Control Center
 * Single Source of Truth for Site Metadata, Google AdSense Slots, and Affiliate Partner Links.
 *
 * To activate live monetization in production:
 * 1. Set `adsenseEnabled: true` and replace `publisherId` + `slots` with your live Google AdSense IDs.
 * 2. Replace `YOUR_CARVERTICAL_ID`, `YOUR_AMAZON_TAG-20`, `YOUR_INSURANCE_ID`, and `YOUR_PARTS_ID`
 *    in `affiliatePartners` with your live partner tracking parameters.
 */

export const SITE_METADATA = {
  brandName: 'DriveLedger',
  domain: 'mydriveledger.com',
  contactEmail: 'contact@mydriveledger.com',
  legalEmail: 'contact@mydriveledger.com',
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
  const baseUrl = String(partner.baseUrl || '').trim();
  const rawParam = String(partner.affiliateParam || '').trim().replace(/^[?&]+/, '');
  let href = baseUrl;
  if (rawParam) {
    const hashIdx = baseUrl.indexOf('#');
    if (hashIdx !== -1) {
      const baseWithoutHash = baseUrl.slice(0, hashIdx);
      const hash = baseUrl.slice(hashIdx);
      const separator = baseWithoutHash.includes('?') ? '&' : '?';
      href = `${baseWithoutHash}${separator}${rawParam}${hash}`;
    } else {
      const separator = baseUrl.includes('?') ? '&' : '?';
      href = `${baseUrl}${separator}${rawParam}`;
    }
  }

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
 * Resolves a complete contextual partner offer from `monetizationConfig.js` for
 * `AffiliateCTA` and `TopTabAffiliateBanner`.
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
  const linkProps = buildAffiliateUrl(canonicalKey, {
    type,
    region: regKey,
    vehicleName,
    purchasePriceUsd,
    odometerMiles,
    activeCode,
  });

  const formattedPrice =
    vehiclePriceFormatted || formatCurrency(Number(purchasePriceUsd) || 28500);
  const hasOdometer = Number(odometerMiles) > 0;
  const formattedOdo = hasOdometer ? formatDistance(odometerMiles) : null;
  const hasReserve = Number(serviceReserveUsd) > 0;
  const exposureAmount = hasReserve
    ? formatCurrency(Math.max(850, Math.round(serviceReserveUsd * 1.45)))
    : formatCurrency(3200);

  if (type === 'vin-check' || type === 'vinCheck') {
    const odoClause = formattedOdo ? ` at ${formattedOdo}` : '';
    return {
      type: 'vin-check',
      partnerKey: canonicalKey,
      region: regKey,
      partnerName: partner.name,
      badgeText: partner.badgeText,
      badge: `Verified Partner · ${partner.name} · ${partner.badgeText}`,
      title: `Buying or owning this ${vehicleName}${odoClause}? Check odometer rollbacks & salvage records before paying ${formattedPrice}`,
      description: hasReserve
        ? `At ${formattedOdo || 'current mileage'}, a rolled-back odometer hides ${exposureAmount}+ in imminent timing, DPF, or transmission wear. Verify title, structural collision records, and real mileage via ${partner.name} before paying ${formattedPrice}.`
        : `Verify real mileage, hidden structural collision damage, past salvage titles, and theft history via ${partner.name} before paying ${formattedPrice}.`,
      features: [
        'Odometer Rollback Detection',
        'Salvage & Flood Title Records',
        'Accident & Repair History',
      ],
      ctaText: partner.buttonText,
      secondaryActionLabel: 'Run Instant VIN Check',
      href: linkProps.href,
      linkProps,
      highlightBadge: `Avoids ${exposureAmount}+ in undisclosed repairs`,
      trustProof: `${partner.badgeText} · ${partner.name} · Run Instant VIN Check`,
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
      partnerName: partner.name,
      badgeText: partner.badgeText,
      badge: `Verified Partner · ${partner.name} · ${partner.badgeText}`,
      title: `Avoid unexpected workshop bills for ${vehicleName} — Compare repair protection & OEM replacement part prices (save up to ${savingsPerYr}/yr)`,
      description: `${reserveText}Verify exact OEM replacement part pricing and protect against high-pressure fuel pump, timing assembly, turbocharger, and transmission failures.`,
      features: [
        `Save up to ${savingsPerYr}/yr on Coverage`,
        'OEM & Aftermarket Part Price Lookup',
        'Compare Warranty Plans & Parts',
      ],
      ctaText: partner.buttonText,
      secondaryActionLabel: 'Compare Warranty Plans',
      href: linkProps.href,
      linkProps,
      highlightBadge: `Save up to ${savingsPerYr}/yr on Coverage`,
      trustProof: `${partner.badgeText} · ${partner.name} · Compare Warranty Plans`,
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
      partnerName: partner.name,
      badgeText: partner.badgeText,
      badge: `Verified Partner · ${partner.name} · ${partner.badgeText}`,
      title: `Insurance & financing consume ${totalOutlay}${shareLabel} on ${vehicleName} — trim ~${monthlySave}/mo`,
      description: `Fixed insurance and APR charges account for${shareLabel || ' a major share of ownership cost'}. Compare live motor insurance tariffs and lower-APR refinancing quotes via ${partner.name} without affecting your credit score.`,
      features: [
        `Trim ~${monthlySave}/mo off Fixed Costs`,
        'Instant Multi-Carrier Rate Check',
        'Soft-Pull APR Refinance Match',
      ],
      ctaText: partner.buttonText,
      secondaryActionLabel: 'Compare Lower Rates',
      href: linkProps.href,
      linkProps,
      highlightBadge: `Potential ${monthlySave}/mo Fixed-Cost Reduction`,
      trustProof: `${partner.badgeText} · ${partner.name}`,
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
    partnerName: partner.name,
    badgeText: partner.badgeText,
    badge: `Verified Partner · ${partner.name} · ${partner.badgeText}`,
    title: `Don't pay ${diagFee}+ in workshop diagnostic fees — Read ${activeCode} and live sensor PIDs yourself with a Bluetooth OBD2 scanner`,
    description: hasCauseDelta
      ? `Don't authorize a blind ${formatCurrency(costliestCauseUsd)} replacement when a ${formatCurrency(cheapestCauseUsd)} sensor or seal fault${probLabel} triggers ${activeCode}. Verify live telemetry PIDs on your phone with a ${scannerCost} scanner (${paybackRatio}x payback on first scan).`
      : `Read freeze-frame telemetry, live O2/boost/fuel PIDs, and reset the Check Engine light in under 60 seconds. Recommended hardware diagnostic tool for ${activeCodeTitle}.`,
    features: [
      'iOS & Android Bluetooth',
      'Live Sensor Telemetry PIDs',
      'Reset Check Engine Light',
    ],
    ctaText: partner.buttonText,
    secondaryActionLabel: partner.buttonText,
    href: linkProps.href,
    linkProps,
    highlightBadge: paybackRatio
      ? `${paybackRatio}x Payback vs. Blind Parts Swap`
      : 'Pays for itself on the first diagnostic scan',
    trustProof: `${partner.badgeText} · ${partner.name} · Works with 1996+ OBD-II vehicles`,
    microDisclosure: FTC_PROXIMATE_DISCLOSURE,
  };
}

export default MONETIZATION_CONFIG;

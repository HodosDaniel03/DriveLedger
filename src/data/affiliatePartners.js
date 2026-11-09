/**
 * DriveLedger — Regional Partner Geo-Routing & Dynamic Telemetry CRO Engine
 * Dynamically binds live calculator numbers (asking price, odometer, 12-month wear reserve,
 * OBD root-cause price delta, and 5-year insurance/APR spend) to regional partners across US, UK, and EU.
 */

export const REGIONAL_PARTNER_URLS = {
  'vin-check': {
    US: {
      partnerName: 'carVertical US',
      href: 'https://www.carvertical.com/us',
      trustProof: 'North American & International VIN History Check',
    },
    UK: {
      partnerName: 'carVertical UK',
      href: 'https://www.carvertical.com/gb',
      trustProof: 'UK & Cross-Border VIN History Check',
    },
    EU: {
      partnerName: 'carVertical Europe',
      href: 'https://www.carvertical.com/eu',
      trustProof: 'European Cross-Border VIN History Check',
    },
  },
  'obd-scanner': {
    US: {
      partnerName: 'Amazon US Automotive',
      href: 'https://www.amazon.com/s?k=bluetooth+obd2+scanner',
      trustProof: 'Works with 1996+ OBD-II vehicles (iOS & Android)',
    },
    UK: {
      partnerName: 'Amazon UK Automotive',
      href: 'https://www.amazon.co.uk/s?k=bluetooth+obd2+scanner',
      trustProof: 'Compatible with UK EOBD / OBD-II petrol, diesel & hybrid cars',
    },
    EU: {
      partnerName: 'Amazon EU Automotive',
      href: 'https://www.amazon.de/s?k=bluetooth+obd2+scanner',
      trustProof: 'Compatible with EU EOBD / OBD-II vehicles (iOS & Android)',
    },
  },
  warranty: {
    US: {
      partnerName: 'CarShield ASE Network',
      href: 'https://www.carshield.com/',
      trustProof: 'Vehicle service protection plans for US workshops & dealerships',
    },
    UK: {
      partnerName: 'MotorEasy UK Warranty',
      href: 'https://www.motoreasy.com/',
      trustProof: 'Extended warranty options for UK garages',
    },
    EU: {
      partnerName: 'AUTODOC Europe',
      href: 'https://www.autodoc.eu/',
      trustProof: 'European Replacement Parts & Service Catalog',
    },
  },
  'insurance-finance': {
    US: {
      partnerName: 'Insurify Rate Compare',
      href: 'https://insurify.com/car-insurance/',
      trustProof: 'Online US auto insurance rate comparison',
    },
    UK: {
      partnerName: 'Compare The Market UK',
      href: 'https://www.comparethemarket.com/car-insurance/',
      trustProof: 'UK motor insurance & auto finance comparison',
    },
    EU: {
      partnerName: 'CHECK24 Auto & Finance',
      href: 'https://www.check24.de/kfz-versicherung/',
      trustProof: 'European motor insurance & auto loan comparison',
    },
  },
};

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

export function resolveRegionalPartnerOffer({
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

  const group = REGIONAL_PARTNER_URLS[type] || REGIONAL_PARTNER_URLS['vin-check'];
  const partner = group[regKey] || group.US;

  const formattedPrice =
    vehiclePriceFormatted || formatCurrency(Number(purchasePriceUsd) || 28500);
  const hasOdometer = Number(odometerMiles) > 0;
  const formattedOdo = hasOdometer ? formatDistance(odometerMiles) : null;
  const hasReserve = Number(serviceReserveUsd) > 0;

  if (type === 'vin-check') {
    const odoClause = formattedOdo ? ` at ${formattedOdo}` : '';
    return {
      type: 'vin-check',
      region: regKey,
      partnerName: partner.partnerName,
      badge: `Partner link · ${partner.partnerName}`,
      title: `Buying or owning this ${vehicleName}${odoClause}? Check odometer rollbacks & salvage records before paying ${formattedPrice}`,
      description: `Check chronological mileage records, past damage history, salvage or flood title status, and theft records via ${partner.partnerName} before paying ${formattedPrice}.`,
      features: [
        'Odometer Rollback Detection',
        'Salvage & Flood Title Records',
        'Accident & Repair History',
      ],
      ctaText: 'Run Instant VIN Check',
      href: partner.href,
      highlightBadge: 'Mileage, damage & title history check',
      trustProof: partner.trustProof,
    };
  }

  if (type === 'warranty') {
    const savingsPerYr = formatCurrency(420);
    const reserveText = hasReserve
      ? `Projected 12-month wear exposure is ${formatCurrency(serviceReserveUsd)}${formattedOdo ? ` at ${formattedOdo}` : ''}. `
      : '';
    return {
      type: 'warranty',
      region: regKey,
      partnerName: partner.partnerName,
      badge: `Partner link · ${partner.partnerName}`,
      title: `Avoid unexpected workshop bills for ${vehicleName} — Compare repair protection & save up to ${savingsPerYr}/yr`,
      description: `${reserveText}Compare extended coverage options for fuel system, timing assembly, turbocharger, and transmission repairs.`,
      features: [
        `Save up to ${savingsPerYr}/yr on Coverage`,
        `${formatCurrency(0)} Deductible Options`,
        'Direct Workshop Billing Options',
      ],
      ctaText: 'Compare Warranty Plans',
      href: partner.href,
      highlightBadge: 'Extended Powertrain & Repair Coverage',
      trustProof: partner.trustProof,
    };
  }

  if (type === 'insurance-finance') {
    const totalOutlay = Number(insuranceAndInterest5YrUsd) > 0
      ? formatCurrency(insuranceAndInterest5YrUsd)
      : formatCurrency(6800);
    const shareLabel = Number(insuranceSharePct) > 0 ? ` (${Math.round(insuranceSharePct)}% of 5-yr TCO)` : '';
    const monthlySave = Number(monthlySavingsEstUsd) > 0
      ? formatCurrency(monthlySavingsEstUsd)
      : formatCurrency(45);
    return {
      type: 'insurance-finance',
      region: regKey,
      partnerName: partner.partnerName,
      badge: `Partner link · ${partner.partnerName}`,
      title: `Insurance & financing consume ${totalOutlay}${shareLabel} on ${vehicleName} — trim ~${monthlySave}/mo`,
      description: `Fixed insurance and APR charges account for${shareLabel || ' a major share of ownership cost'}. Compare regional motor insurance tariffs and refinancing quotes via ${partner.partnerName}.`,
      features: [
        `Trim ~${monthlySave}/mo off Fixed Costs`,
        'Multi-Carrier Rate Check',
        'APR Refinance Comparison',
      ],
      ctaText: 'Compare Lower Rates',
      href: partner.href,
      highlightBadge: `Potential ${monthlySave}/mo Fixed-Cost Reduction`,
      trustProof: partner.trustProof,
    };
  }

  // Default: 'obd-scanner'
  const diagFee = formatCurrency(150);
  const scannerCost = formatCurrency(39);
  const hasCauseDelta =
    Number(costliestCauseUsd) > 0 &&
    Number(cheapestCauseUsd) > 0 &&
    Number(costliestCauseUsd) > Number(cheapestCauseUsd);
  const paybackRatio = hasCauseDelta
    ? Math.max(4, Math.min(45, Math.round((costliestCauseUsd - cheapestCauseUsd) / 39)))
    : null;
  const probLabel = Number(cheapCauseProbPct) > 0 ? ` (${Math.round(cheapCauseProbPct)}% of cases)` : '';

  return {
    type: 'obd-scanner',
    region: regKey,
    partnerName: partner.partnerName,
    badge: `Partner link · ${partner.partnerName}`,
    title: `Don't pay ${diagFee}+ in workshop diagnostic fees — Read ${activeCode} and live sensor PIDs yourself with a Bluetooth OBD2 scanner`,
    description: hasCauseDelta
      ? `Before authorizing a ${formatCurrency(costliestCauseUsd)} assembly replacement when a ${formatCurrency(cheapestCauseUsd)} sensor or seal fault${probLabel} can trigger ${activeCode}, check live sensor PIDs on your phone with a ${scannerCost} scanner.`
      : `Read freeze-frame data, live O2/boost/fuel PIDs, and clear fault codes on your phone. Compatible hardware diagnostic tool for ${activeCodeTitle}.`,
    features: [
      'iOS & Android Bluetooth',
      'Live Sensor Telemetry PIDs',
      'Reset Check Engine Light',
    ],
    ctaText: 'Get Recommended OBD2 Scanner',
    href: partner.href,
    highlightBadge: paybackRatio
      ? `${paybackRatio}x Payback vs. Blind Parts Swap`
      : 'Read fault codes & live sensor data at home',
    trustProof: partner.trustProof,
  };
}

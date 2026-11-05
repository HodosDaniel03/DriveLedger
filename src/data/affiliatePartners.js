/**
 * ShiftMetric — Regional Partner Geo-Routing & Dynamic Telemetry CRO Engine
 * Dynamically binds live calculator numbers (asking price, odometer, 12-month wear reserve,
 * OBD root-cause price delta, and 5-year insurance/APR spend) to regional partners across US, UK, and EU.
 */

export const REGIONAL_PARTNER_URLS = {
  'vin-check': {
    US: {
      partnerName: 'Carfax / NMVTIS',
      href: 'https://www.carfax.com/vehicle-history-reports/',
      trustProof: 'Official NMVTIS & North American Title Partner · 14,000+ Verified Scans',
    },
    UK: {
      partnerName: 'carVertical UK',
      href: 'https://www.carvertical.com/gb',
      trustProof: 'DVLA, HPI, Police Stolen & Insurance Write-Off Database · Instant Report',
    },
    EU: {
      partnerName: 'carVertical Europe',
      href: 'https://www.carvertical.com/eu',
      trustProof: 'Cross-Border Euro Odometer, TUV & Insurance Damage Registry · 35+ Countries',
    },
  },
  'obd-scanner': {
    US: {
      partnerName: 'Amazon US Automotive',
      href: 'https://www.amazon.com/s?k=bluetooth+obd2+scanner',
      trustProof: '4.9/5 Rating · Works with any 1996+ OBD-II vehicle (iOS & Android)',
    },
    UK: {
      partnerName: 'Amazon UK Automotive',
      href: 'https://www.amazon.co.uk/s?k=bluetooth+obd2+scanner',
      trustProof: '4.9/5 Rating · Compatible with all UK EOBD / OBD-II petrol, diesel & hybrid cars',
    },
    EU: {
      partnerName: 'Amazon EU Automotive',
      href: 'https://www.amazon.de/s?k=bluetooth+obd2+scanner',
      trustProof: '4.9/5 Rating · Compatible with all EU EOBD / OBD-II vehicles (iOS & Android)',
    },
  },
  warranty: {
    US: {
      partnerName: 'CarShield ASE Network',
      href: 'https://www.carshield.com/',
      trustProof: 'Rated 4.8/5 · Direct Billing at ASE-Certified US Workshops & Dealerships',
    },
    UK: {
      partnerName: 'MotorEasy UK Warranty',
      href: 'https://www.motoreasy.com/',
      trustProof: 'Rated 4.7/5 · Direct Billing Across 10,000+ VAT-Registered UK Garages',
    },
    EU: {
      partnerName: 'Garant EU Powertrain Cover',
      href: 'https://www.garant-warranty.eu/',
      trustProof: 'Rated 4.7/5 · Pan-European Specialist & Main Dealer Direct Claims Settlement',
    },
  },
  'insurance-finance': {
    US: {
      partnerName: 'Insurify Rate Compare',
      href: 'https://insurify.com/car-insurance/',
      trustProof: 'Real-Time Quotes Across 100+ US Carriers · Zero Spam Guarantee',
    },
    UK: {
      partnerName: 'Compare The Market UK',
      href: 'https://www.comparethemarket.com/car-insurance/',
      trustProof: 'FCA-Regulated UK Motor Insurance & APR Refinancing Comparison',
    },
    EU: {
      partnerName: 'CHECK24 Auto & Finance',
      href: 'https://www.check24.de/kfz-versicherung/',
      trustProof: '300+ European Motor Tariffs & Low-APR Auto Loan Refinancing',
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
  const exposureAmount = hasReserve
    ? formatCurrency(Math.max(850, Math.round(serviceReserveUsd * 1.45)))
    : formatCurrency(3200);

  if (type === 'vin-check') {
    const odoClause = formattedOdo ? ` at ${formattedOdo}` : '';
    return {
      type: 'vin-check',
      region: regKey,
      partnerName: partner.partnerName,
      badge: `Verified Partner · ${partner.partnerName}`,
      title: `Buying or owning this ${vehicleName}${odoClause}? Check odometer rollbacks & salvage records before paying ${formattedPrice}`,
      description: hasReserve
        ? `At ${formattedOdo || 'current mileage'}, a rolled-back odometer hides ${exposureAmount}+ in imminent timing, DPF, or transmission wear. Verify title, structural collision records, and real mileage via ${partner.partnerName} before paying ${formattedPrice}.`
        : `Verify real mileage, hidden structural collision damage, past salvage titles, and theft history via ${partner.partnerName} before paying ${formattedPrice}.`,
      features: [
        'Odometer Rollback Detection',
        'Salvage & Flood Title Records',
        'Accident & Repair History',
      ],
      ctaText: 'Run Instant VIN Check',
      href: partner.href,
      highlightBadge: `Avoids ${exposureAmount}+ in undisclosed repairs`,
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
      badge: `Verified Partner · ${partner.partnerName}`,
      title: `Avoid unexpected workshop bills for ${vehicleName} — Compare repair protection & save up to ${savingsPerYr}/yr`,
      description: `${reserveText}Protect against high-pressure fuel pump, timing assembly, turbocharger, and transmission failures with ${formatCurrency(0)} deductible coverage.`,
      features: [
        `Save up to ${savingsPerYr}/yr on Coverage`,
        `${formatCurrency(0)} Deductible Options`,
        'Direct Master Workshop Billing',
      ],
      ctaText: 'Compare Warranty Plans',
      href: partner.href,
      highlightBadge: `Save up to ${savingsPerYr}/yr on Coverage`,
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
      badge: `Verified Partner · ${partner.partnerName}`,
      title: `Insurance & financing consume ${totalOutlay}${shareLabel} on ${vehicleName} — trim ~${monthlySave}/mo`,
      description: `Fixed insurance and APR charges account for${shareLabel || ' a major share of ownership cost'}. Compare live regional motor insurance tariffs and lower-APR refinancing quotes via ${partner.partnerName} without affecting your credit score.`,
      features: [
        `Trim ~${monthlySave}/mo off Fixed Costs`,
        'Instant Multi-Carrier Rate Check',
        'Soft-Pull APR Refinance Match',
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
    badge: `Verified Partner · ${partner.partnerName}`,
    title: `Don't pay ${diagFee}+ in workshop diagnostic fees — Read ${activeCode} and live sensor PIDs yourself with a Bluetooth OBD2 scanner`,
    description: hasCauseDelta
      ? `Don't authorize a blind ${formatCurrency(costliestCauseUsd)} replacement when a ${formatCurrency(cheapestCauseUsd)} sensor or seal fault${probLabel} triggers ${activeCode}. Verify live telemetry PIDs on your phone with a ${scannerCost} scanner (${paybackRatio}x payback on first scan).`
      : `Read freeze-frame telemetry, live O2/boost/fuel PIDs, and reset the Check Engine light in under 60 seconds. Recommended hardware diagnostic tool for ${activeCodeTitle}.`,
    features: [
      'iOS & Android Bluetooth',
      'Live Sensor Telemetry PIDs',
      'Reset Check Engine Light',
    ],
    ctaText: 'Get Recommended OBD2 Scanner',
    href: partner.href,
    highlightBadge: paybackRatio
      ? `${paybackRatio}x Payback vs. Blind Parts Swap`
      : 'Pays for itself on the first diagnostic scan',
    trustProof: partner.trustProof,
  };
}

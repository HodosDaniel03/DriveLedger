/**
 * ShiftMetric — "Should I Fix It or Sell It?" 4-Factor Economic Decision Engine
 * & Mileage-Adjusted Market Benchmark Estimator
 */

import {
  MAINTENANCE_COMPONENTS,
  evaluateComponentHealth,
  resolvePowertrainType,
  isPureElectric,
} from './maintenanceData.js';

/**
 * Estimates fair private-party / retail benchmark value for a preset adjusted for physical odometer.
 * Anchored so that at `vehicle.defaultOdometerMiles`, benchmark equals `vehicle.purchasePriceUsd`.
 */
export function estimateMileageAdjustedMarketValue(vehicle, odometerMiles) {
  const basePrice = Math.max(1500, Number(vehicle?.purchasePriceUsd) || 25000);
  const baseOdo = Math.max(0, Number(vehicle?.defaultOdometerMiles) || 45000);
  const currentOdo = Math.max(0, Number(odometerMiles ?? baseOdo) || 0);

  const deltaMiles = currentOdo - baseOdo;
  // Smooth exponential mileage adjustment (~5.5% value decay per +15,000 miles, bounded by 12% scrap floor)
  const decayPerMile = 0.055 / 15000;
  const multiplier = Math.exp(-deltaMiles * decayPerMile);
  const rawAdjusted = basePrice * multiplier;
  const scrapFloor = Math.max(1200, basePrice * 0.12);
  const ceiling = basePrice * 1.45;

  return Math.round(Math.min(ceiling, Math.max(scrapFloor, rawAdjusted)));
}

/**
 * Evaluates a user's asking/purchase price against the mileage-adjusted fair benchmark.
 */
export function evaluateMarketPriceDeal(vehicle, askingPriceUsd, odometerMiles) {
  const fairValueUsd = estimateMileageAdjustedMarketValue(vehicle, odometerMiles);
  const price = Math.max(0, Number(askingPriceUsd) || 0);
  if (fairValueUsd <= 0 || price <= 0) {
    return {
      fairValueUsd,
      deltaUsd: 0,
      deltaPct: 0,
      tier: 'fair',
      label: 'Fair Market Benchmark',
    };
  }

  const deltaUsd = Math.round(price - fairValueUsd);
  const deltaPct = Math.round(((price - fairValueUsd) / fairValueUsd) * 100);

  if (deltaPct <= -6) {
    return {
      fairValueUsd,
      deltaUsd,
      deltaPct,
      tier: 'good-deal',
      label: `${Math.abs(deltaPct)}% Below Market — Strong Deal`,
    };
  }
  if (deltaPct >= 7) {
    return {
      fairValueUsd,
      deltaUsd,
      deltaPct,
      tier: 'overpriced',
      label: `${deltaPct}% Above Market — Negotiate Down`,
    };
  }
  return {
    fairValueUsd,
    deltaUsd,
    deltaPct,
    tier: 'fair',
    label: deltaPct === 0 ? 'At Fair Market Benchmark' : `Fair Market Price (${deltaPct > 0 ? '+' : ''}${deltaPct}%)`,
  };
}

/**
 * 4-Factor "Should I Fix It or Sell It?" Decision Engine:
 * 1. Repair-to-Value Ratio (RVR)
 * 2. Immediate Post-Repair Equity Recovery vs. As-Is Broken Sale
 * 3. 12-Month Replacement Vehicle Depreciation + Financing Sunk Cost
 * 4. Next-15,000-Mile Cascading Mechanical Failure Risk
 */
export function evaluateFixOrSellDecision({
  vehicle,
  repairQuoteUsd = 1850,
  currentMarketValueUsd,
  brokenAsIsValueUsd,
  odometerMiles,
  replacementVehiclePriceUsd = 28500,
  urbanTripSharePct = 45,
} = {}) {
  const safeOdo = Math.max(0, Number(odometerMiles ?? vehicle?.defaultOdometerMiles ?? 95000) || 0);
  const safeRepair = Math.max(0, Number(repairQuoteUsd) || 0);

  const resolvedMarketValue =
    Number(currentMarketValueUsd) > 0
      ? Math.max(500, Number(currentMarketValueUsd))
      : estimateMileageAdjustedMarketValue(vehicle, safeOdo);

  // Buyers typically discount an un-repaired broken vehicle by ~1.35x the repair quote for tow/risk uncertainty
  const defaultBrokenVal = Math.max(
    400,
    Math.round(resolvedMarketValue - Math.max(safeRepair * 1.35, resolvedMarketValue * 0.15))
  );
  const resolvedBrokenValue =
    Number(brokenAsIsValueUsd) >= 0 && brokenAsIsValueUsd !== undefined && brokenAsIsValueUsd !== null
      ? Math.min(resolvedMarketValue, Math.max(0, Number(brokenAsIsValueUsd)))
      : Math.min(resolvedMarketValue, defaultBrokenVal);

  const safeReplacementPrice = Math.max(3000, Number(replacementVehiclePriceUsd) || 28500);

  // Factor 1: Repair-to-Value Ratio
  const rvr = safeRepair / Math.max(500, resolvedMarketValue);
  const rvrPct = Math.round(rvr * 100);

  // Factor 2: Equity Recovery
  const equityRestoredUsd = Math.max(0, Math.round(resolvedMarketValue - resolvedBrokenValue));
  const netEquityGainUsd = Math.round(equityRestoredUsd - safeRepair);

  // Factor 3: 12-Month Replacement Vehicle Sunk Cost (Year-1 depreciation ~14% + 6.2% APR interest on 80% LTV + taxes/fees)
  const replacementYr1DepreciationUsd = Math.round(safeReplacementPrice * 0.14);
  const replacementYr1InterestUsd = Math.round(safeReplacementPrice * 0.8 * 0.058);
  const annualReplacementSunkCostUsd = replacementYr1DepreciationUsd + replacementYr1InterestUsd;

  // Factor 4: Cascading Subsystem Failure Risk over next 15,000 miles
  const pType = resolvePowertrainType(vehicle || { powertrain: 'diesel' });
  const isEv = isPureElectric(pType);
  const relevantComponents = MAINTENANCE_COMPONENTS.filter((comp) => {
    if (isEv) {
      return Array.isArray(comp.applicablePowertrains) && comp.applicablePowertrains.includes('ev');
    }
    return (
      Array.isArray(comp.applicablePowertrains) &&
      comp.applicablePowertrains.includes(vehicle?.powertrain || 'diesel')
    );
  });

  const projectedOdo = safeOdo + 15000;
  const upcomingCritical = [];
  let cascadingExposureUsd = 0;

  for (const comp of relevantComponents) {
    const health = evaluateComponentHealth({
      component: comp,
      physicalOdometerMiles: projectedOdo,
      urbanTripSharePct,
      oilIntervalId: 'standard',
      serviceHistoryId: 'verified',
      transmissionId: vehicle?.transmission || 'dct-dsg',
      powertrainType: pType,
      vehicle,
    });
    if (!health) continue;
    const avgIndieCost = Math.round(
      ((comp.costsUsd?.independent?.[0] || 600) + (comp.costsUsd?.independent?.[1] || 1200)) / 2
    );
    if (health.status === 'CRITICAL') {
      upcomingCritical.push({ name: comp.name, status: 'CRITICAL', estCostUsd: avgIndieCost });
      cascadingExposureUsd += Math.round(avgIndieCost * 0.65);
    } else if (health.status === 'WARNING') {
      upcomingCritical.push({ name: comp.name, status: 'WARNING', estCostUsd: avgIndieCost });
      cascadingExposureUsd += Math.round(avgIndieCost * 0.3);
    }
  }

  const criticalCount = upcomingCritical.filter((c) => c.status === 'CRITICAL').length;
  const cascadeRatio = cascadingExposureUsd / Math.max(1000, resolvedMarketValue);
  const cascadeRiskLevel =
    (criticalCount >= 2 && cascadeRatio >= 0.28) || cascadeRatio >= 0.38
      ? 'critical'
      : criticalCount >= 1 || upcomingCritical.length >= 2 || cascadeRatio >= 0.16
      ? 'moderate'
      : 'low';

  const net12MoAdvantageKeepUsd = Math.round(
    annualReplacementSunkCostUsd - (safeRepair + cascadingExposureUsd * 0.5)
  );

  // Verdict Synthesis
  if (rvr <= 0.35 && cascadeRiskLevel !== 'critical') {
    return {
      verdict: 'FIX_AND_KEEP',
      headline: 'Fix It & Keep Driving',
      tone: 'low',
      badgeLabel: 'Economically Favorable',
      rvr,
      rvrPct,
      resolvedMarketValueUsd: resolvedMarketValue,
      resolvedBrokenValueUsd: resolvedBrokenValue,
      repairQuoteUsd: safeRepair,
      equityRestoredUsd,
      netEquityGainUsd,
      annualReplacementSunkCostUsd,
      cascadingExposureUsd,
      cascadeRiskLevel,
      upcomingCritical: upcomingCritical.slice(0, 3),
      net12MoAdvantageKeepUsd,
      bullets: [
        `Repair is ${rvrPct}% of vehicle value (under 35% threshold)`,
        `Avoids ${annualReplacementSunkCostUsd > 0 ? 'steep Year-1 replacement depreciation & interest' : 'replacement costs'}`,
        `Use independent specialist parts to maximize 12-month savings`,
      ],
    };
  }

  if (rvr <= 0.6 && netEquityGainUsd >= -300) {
    return {
      verdict: 'FIX_AND_SELL',
      headline: 'Repair Economically, Then Sell Within 90 Days',
      tone: 'moderate',
      badgeLabel: 'Recover Equity & Exit',
      rvr,
      rvrPct,
      resolvedMarketValueUsd: resolvedMarketValue,
      resolvedBrokenValueUsd: resolvedBrokenValue,
      repairQuoteUsd: safeRepair,
      equityRestoredUsd,
      netEquityGainUsd,
      annualReplacementSunkCostUsd,
      cascadingExposureUsd,
      cascadeRiskLevel,
      upcomingCritical: upcomingCritical.slice(0, 3),
      net12MoAdvantageKeepUsd,
      bullets: [
        `Fixing restores full running market value vs. broken sale penalty`,
        `Upcoming wear exposure makes multi-year retention riskier`,
        `Keep repair invoice to prove work to private-party buyers`,
      ],
    };
  }

  return {
    verdict: 'SELL_AS_IS',
    headline: 'Do Not Repair — Sell As-Is or Trade In',
    tone: 'critical',
    badgeLabel: 'Economic Total-Loss Zone',
    rvr,
    rvrPct,
    resolvedMarketValueUsd: resolvedMarketValue,
    resolvedBrokenValueUsd: resolvedBrokenValue,
    repairQuoteUsd: safeRepair,
    equityRestoredUsd,
    netEquityGainUsd,
    annualReplacementSunkCostUsd,
    cascadingExposureUsd,
    cascadeRiskLevel,
    upcomingCritical: upcomingCritical.slice(0, 3),
    net12MoAdvantageKeepUsd,
    bullets: [
      `Repair consumes ${rvrPct}% of total running vehicle value`,
      `High probability of secondary subsystem repairs within 15k miles`,
      `Disclose fault and liquidate as-is rather than sinking capital`,
    ],
  };
}

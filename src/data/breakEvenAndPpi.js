/**
 * DriveLedger — Break-Even Trajectory & Pre-Purchase Inspection (PPI) Engine
 * Pure JS calculation and data-synthesis modules for node/browser interoperability.
 */

import { calculateTcoProjection } from './maintenanceData.js';
import { VEHICLE_PRESETS, getPresetById } from './vehiclePresets.js';
import { findEngineVariant, getKnownIssuesForVehicle } from './vehicles/index.js';

/**
 * Computes 5-year break-even trajectory and crossover distance between two vehicles.
 */
export function computeBreakEvenTrajectory(vehicleA, vehicleB, options = {}) {
  const safeA = vehicleA || VEHICLE_PRESETS[0];
  const safeB = vehicleB || VEHICLE_PRESETS[1];
  const horizonYears = options.horizonYears || 5;
  const userAnnualMiles = Math.max(500, options.annualDistanceMiles || 12000);
  const user5YrMiles = userAnnualMiles * horizonYears;

  // Discrete test distances (in miles): 0 to 120,000 miles (0 to ~193,000 km)
  const distanceSamplesMiles = [0, 15000, 30000, 45000, 60000, 75000, 90000, 105000, 120000];

  const points = distanceSamplesMiles.map((distMiles) => {
    const annualDist = Math.max(100, Math.round(distMiles / horizonYears));
    const projA = calculateTcoProjection({
      purchasePriceUsd: safeA.purchasePriceUsd,
      odometerMiles: safeA.defaultOdometerMiles || 60000,
      annualDistanceMiles: annualDist,
      mpgUs: safeA.mpgUs,
      isEv: safeA.isEv,
      powertrainType: safeA.powertrainType || safeA.powertrain,
      vehicle: safeA,
      fuelPriceUsdGal: safeA.defaultFuelPriceUsdGal,
      annualInsuranceUsd: safeA.annualInsuranceUsd,
      baseAnnualMaintenanceUsd: safeA.baseAnnualMaintenanceUsd,
      maintenanceWearFactor: safeA.maintenanceWearFactor,
      horizonYears,
      residualCurve10Yr: safeA.residualCurve10Yr,
    });

    const projB = calculateTcoProjection({
      purchasePriceUsd: safeB.purchasePriceUsd,
      odometerMiles: safeB.defaultOdometerMiles || 60000,
      annualDistanceMiles: annualDist,
      mpgUs: safeB.mpgUs,
      isEv: safeB.isEv,
      powertrainType: safeB.powertrainType || safeB.powertrain,
      vehicle: safeB,
      fuelPriceUsdGal: safeB.defaultFuelPriceUsdGal,
      annualInsuranceUsd: safeB.annualInsuranceUsd,
      baseAnnualMaintenanceUsd: safeB.baseAnnualMaintenanceUsd,
      maintenanceWearFactor: safeB.maintenanceWearFactor,
      horizonYears,
      residualCurve10Yr: safeB.residualCurve10Yr,
    });

    return {
      distMiles,
      distKm: Math.round(distMiles * 1.609344),
      costA: projA.totalEconomicCostUsd,
      costB: projB.totalEconomicCostUsd,
      diffB: projA.totalEconomicCostUsd - projB.totalEconomicCostUsd, // >0 means B is cheaper
    };
  });

  // Calculate analytical crossover
  const p0 = points[0];
  const pEnd = points[points.length - 1];
  const deltaFixed = p0.costB - p0.costA; // If >0, Vehicle B has higher fixed / upfront cost
  const varPerMileA = (pEnd.costA - p0.costA) / pEnd.distMiles;
  const varPerMileB = (pEnd.costB - p0.costB) / pEnd.distMiles;
  const deltaVarPerMile = varPerMileA - varPerMileB; // If >0, Vehicle B is cheaper per mile

  let breakEvenMiles = null;
  let breakEvenKm = null;
  let breakEvenYears = null;
  let status = 'none'; // 'crossover' | 'a_always_cheaper' | 'b_always_cheaper' | 'parallel'

  if (Math.abs(deltaVarPerMile) < 0.005) {
    status = deltaFixed <= 0 ? 'b_always_cheaper' : 'a_always_cheaper';
  } else if (deltaFixed > 0 && deltaVarPerMile > 0) {
    const rawMiles = Math.round(deltaFixed / deltaVarPerMile);
    breakEvenMiles = rawMiles;
    breakEvenKm = Math.round(rawMiles * 1.609344);
    breakEvenYears = +(rawMiles / userAnnualMiles).toFixed(1);
    status = 'crossover';
  } else if (deltaFixed < 0 && deltaVarPerMile < 0) {
    const rawMiles = Math.round(-deltaFixed / -deltaVarPerMile);
    breakEvenMiles = rawMiles;
    breakEvenKm = Math.round(rawMiles * 1.609344);
    breakEvenYears = +(rawMiles / userAnnualMiles).toFixed(1);
    status = 'crossover';
  } else if (deltaFixed <= 0 && deltaVarPerMile >= 0) {
    status = 'b_always_cheaper';
    breakEvenMiles = 0;
    breakEvenKm = 0;
    breakEvenYears = 0;
  } else {
    status = 'a_always_cheaper';
    breakEvenMiles = 0;
    breakEvenKm = 0;
    breakEvenYears = 0;
  }

  return {
    points,
    breakEvenMiles,
    breakEvenKm,
    breakEvenYears,
    status,
    user5YrMiles,
    user5YrKm: Math.round(user5YrMiles * 1.609344),
  };
}

/**
 * Synthesizes dynamic 5-8 point Pre-Purchase Inspection (PPI) checklist items
 * tailored directly to the vehicle model, engine variant, and physical odometer.
 */
export function generatePpiChecklist(preset, odometerKm = 120000) {
  const safePreset = preset || VEHICLE_PRESETS[0];
  const odo = Math.max(0, Number(odometerKm) || 120000);
  const engineVariant = findEngineVariant(safePreset.id) || findEngineVariant(safePreset.presetId);
  const knownIssues = engineVariant
    ? [...(engineVariant.engine?.knownIssues || []), ...(engineVariant.generation?.modelKnownIssues || [])]
    : getKnownIssuesForVehicle({
        brandId: safePreset.brand,
        modelId: safePreset.modelName,
      });

  const generatedSteps = [];

  // 1. Synthesize targeted checks from specific Known Issues
  if (knownIssues && knownIssues.length > 0) {
    for (const issue of knownIssues.slice(0, 4)) {
      const isMileageActive =
        odo >= (issue.criticalMileage?.minKm || 0) &&
        odo <= (issue.criticalMileage?.maxKm || 999999);

      let keyPids = 'OBD Mode 01/02 & Physical Visual Inspection';
      if (issue.obdCodes && issue.obdCodes.length > 0) {
        keyPids = `DTC: ${issue.obdCodes.slice(0, 3).join(', ')}`;
      } else if (issue.category === 'battery_hv') {
        keyPids = 'High Voltage SoH PID, 12V Aux Voltage PID';
      } else if (issue.category === 'fuel_system') {
        keyPids = 'Rail Pressure PID 0x22, Injector Fuel Trims';
      } else if (issue.category === 'timing') {
        keyPids = 'Cam/Crank Correlation PID, Cold-Start Acoustics';
      }

      generatedSteps.push({
        id: `issue-${issue.id}`,
        isModelSpecific: true,
        title: `${issue.name} (${issue.criticalMileage?.display || 'Design flaw'})`,
        timeEst: '~15-20 min',
        riskLevel: issue.severity === 'critical' ? 'critical' : issue.severity === 'high' ? 'critical' : 'moderate',
        riskLabel: isMileageActive ? 'Active Mileage Risk' : `${issue.severity.toUpperCase()} Risk`,
        estSaving: issue.repairCost?.formattedEur || issue.repairCost?.formattedUsd || '$500 – $2,500',
        focus: `Symptoms: ${issue.symptoms} | Prevention: ${issue.prevention}`,
        inspectionMethod: `On-site inspection: Examine assembly (${issue.affectedComponents.join(', ')}). ${
          issue.id.includes('wet-belt')
            ? 'Shine a light into the oil filler cap to inspect belt back for cracks, fraying, and swelling!'
            : issue.id.includes('cp4')
            ? 'Request opening the fuel filter or check housing bowl for metallic flakes/shavings (swarf)!'
            : issue.id.includes('iccu')
            ? 'Measure 12V auxiliary battery resting voltage and test on-site AC charging engagement!'
            : issue.id.includes('timing')
            ? 'Listen closely during cold start for timing chain rattle or metallic slapping during first 5 seconds!'
            : 'Physical inspection and diagnostic trouble code scan recommended.'
        }`,
        keyPids,
      });
    }
  }

  // 2. Comprehensive Standard Mechanical & Telemetry Inspection Points
  const standardBaseline = [
    {
      id: 'step-obd-scan',
      isModelSpecific: false,
      title: 'OBD-II DTC & Freeze Frame Live Data Scan',
      timeEst: '~20 min',
      riskLevel: 'critical',
      riskLabel: 'Critical / Mandatory',
      estSaving: '$400 – $1,800',
      focus: 'Read active, stored, and pending DTCs while verifying distance traveled since diagnostic codes were last cleared.',
      inspectionMethod: 'Connect an OBD-II scanner: if distance since DTC clear is under 50 km (30 mi), the seller may have cleared warning codes right before the inspection!',
      keyPids: 'Mode 03 (DTC), Mode 07 (Pending), PID 0x31 (Distance since clear)',
    },
    {
      id: 'step-cold-start',
      isModelSpecific: false,
      title: 'Cold Start, Blow-By & Oil Filler Cap Pressure Test',
      timeEst: '~15 min',
      riskLevel: 'moderate',
      riskLabel: 'Moderate / Important',
      estSaving: '$350 – $1,200',
      focus: 'Start only when engine is dead cold. Observe exhaust smoke (white/blue/black) and idle acoustic vibrations.',
      inspectionMethod: 'Touch engine block upon arrival to verify cold state. With engine idling, loosen oil cap carefully: slight vacuum is normal; excessive positive pressure or smoke puffs indicate cylinder blow-by.',
      keyPids: 'Coolant Temp PID 0x05, Oil Pressure PID',
    },
    {
      id: 'step-body-chassis',
      isModelSpecific: false,
      title: 'Body Paint Depth & Hidden Collision Damage Audit',
      timeEst: '~20 min',
      riskLevel: 'critical',
      riskLabel: 'Critical / Valuation Risk',
      estSaving: '$1,500 – $4,500',
      focus: 'Measure coating thickness on all panels (factory: 80–140 µm). Inspect A/B/C pillars, rocker sills, and trunk floor pinch welds.',
      inspectionMethod: 'Gauge A-pillars and inner sills (>200 µm denotes respray, >450 µm body filler and structural repair). Verify matching glass and headlamp DOT manufacturer date codes.',
      keyPids: 'Magnetic / Digital paint depth gauge, Glass DOT date stamps',
    },
    {
      id: 'step-transmission-driveline',
      isModelSpecific: false,
      title: 'Transmission Road Test, Clutch Slip & Dual-Mass Flywheel Stress Test',
      timeEst: '~25 min',
      riskLevel: 'critical',
      riskLabel: 'Critical / High Repair Cost',
      estSaving: '$1,200 – $3,400',
      focus: 'Smooth gear engagement, creep behavior (automatics/DCT), and absence of metallic clunk upon engine shutdown.',
      inspectionMethod: 'On test drive in 4th gear, apply full throttle from 1,500 RPM: rising RPM without vehicle acceleration indicates clutch slip. Listen for dual-mass flywheel rattle when turning engine off with clutch pedal released vs depressed.',
      keyPids: 'TCU Clutch Slip PID, Mechatronics Line Pressure Target',
    },
    {
      id: 'step-undercarriage-brakes',
      isModelSpecific: false,
      title: 'Chassis Suspension, Control Arm Bushings & Brake Rotor Lip Wear',
      timeEst: '~15 min',
      riskLevel: 'moderate',
      riskLabel: 'Moderate / Chassis',
      estSaving: '$300 – $900',
      focus: 'Uneven tire tread wear (feathered inner shoulder indicates alignment/bushing failure), damper oil misting, and brake rotor lip thickness.',
      inspectionMethod: 'Turn steering to full lock to inspect tire wear across entire tread width. Under firm braking, vehicle must track straight without pulling or pedal pulsation.',
      keyPids: 'Brake fluid moisture tester, Suspension alignment symmetry',
    },
  ];

  for (const step of standardBaseline) {
    if (generatedSteps.length >= 8) break;
    generatedSteps.push(step);
  }

  return generatedSteps.slice(0, 8);
}

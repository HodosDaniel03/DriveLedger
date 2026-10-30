/**
 * ShiftMetric — Mechanical Component Wear & Thermodynamic Penalty Database
 * Models physical odometer vs. effective thermodynamic wear age across:
 * - Short-trip urban cold cycles (1.35x to 1.55x wear multiplier)
 * - Oil change interval discipline (Strict 6k-8k mi vs Extended 15k-20k mi)
 * - Prior service record verification status
 */

export const POWERTRAIN_OPTIONS = [
  {
    id: 'diesel',
    label: 'Turbo Diesel (Common-Rail DPF / EGR / SCR)',
    shortLabel: 'Turbo Diesel',
    description: 'High torque efficiency; highly sensitive to short-trip DPF soot loading & wet-belt oil dilution.',
  },
  {
    id: 'gasoline-turbo',
    label: 'Gasoline Direct-Injection Turbo (GDI / TGDI)',
    shortLabel: 'Gasoline Turbo',
    description: 'High specific output; prone to intake valve carbon coking, timing chain wear & turbo wastegate play.',
  },
  {
    id: 'gasoline-na',
    label: 'Gasoline Naturally Aspirated (Port / Dual-Injection)',
    shortLabel: 'Gasoline NA',
    description: 'Lowest forced-induction complexity; primary wear on cooling elastomers, suspension & transmissions.',
  },
  {
    id: 'hybrid',
    label: 'Full Hybrid / Plug-In Hybrid (HEV / PHEV)',
    shortLabel: 'Hybrid (HEV)',
    description: 'Reduced brake & starter wear via regen; requires thermal management & oil condensation vigilance.',
  },
  {
    id: 'ev',
    label: 'Battery Electric Powertrain (BEV Dual/Single Motor)',
    shortLabel: 'Battery EV',
    description: 'Zero combustion wear; high curb weight accelerates multi-link suspension & HV chiller valve wear.',
  },
];

export const TRANSMISSION_OPTIONS = [
  {
    id: 'dct-dsg',
    label: 'Dual-Clutch Automated (DSG / PDK / S-Tronic / Powershift)',
    shortLabel: 'Dual-Clutch (DSG/PDK)',
    urbanWearFactor: 1.42,
  },
  {
    id: 'torque-converter',
    label: 'Multi-Speed Torque Converter Automatic (ZF 8HP / 9G / 10R80)',
    shortLabel: 'Torque Converter Auto',
    urbanWearFactor: 1.22,
  },
  {
    id: 'cvt-ecvt',
    label: 'Continuously Variable (Steel-Belt CVT / Planetary e-CVT)',
    shortLabel: 'CVT / e-CVT',
    urbanWearFactor: 1.28,
  },
  {
    id: 'manual',
    label: '6-Speed Manual w/ Dual-Mass Flywheel (DMF)',
    shortLabel: 'Manual + DMF',
    urbanWearFactor: 1.45,
  },
  {
    id: 'single-speed-ev',
    label: 'Single-Speed Fixed Reduction Gear (EV Drive Unit)',
    shortLabel: 'EV Reduction Gear',
    urbanWearFactor: 1.08,
  },
];

export const OIL_INTERVAL_PROFILES = [
  {
    id: 'strict',
    label: 'Strict Enthusiast (6,000–7,500 mi / 10,000 km)',
    multiplier: 0.90,
    badge: '0.90x Wear Reduction',
    description: 'Prevents soot thickening, timing chain pin wear, and wet-belt elastomer degradation.',
  },
  {
    id: 'standard',
    label: 'OEM Standard Schedule (10,000–12,000 mi / 16,000 km)',
    multiplier: 1.05,
    badge: '1.05x Baseline Wear',
    description: 'Acceptable for predominantly highway cycles; marginal for turbocharged urban vehicles.',
  },
  {
    id: 'extended',
    label: 'Extended / LongLife Fleet (18,000–20,000 mi / 30,000 km)',
    multiplier: 1.38,
    badge: '1.38x Accelerated Wear',
    description: 'High risk of oil control ring coking, VCT cam phaser varnish, and turbo bearing starvation.',
  },
];

export const SERVICE_HISTORY_PROFILES = [
  {
    id: 'verified',
    label: 'Full Verified OEM / Specialist Digital Invoices',
    multiplier: 1.0,
    description: 'Confirmed fluid specifications (VW 504/507, LL-04, WSS-M2C950-A) and timely filter changes.',
  },
  {
    id: 'partial',
    label: 'Partial / Unstamped Receipts (Gaps > 18 Months)',
    multiplier: 1.15,
    description: 'Assumes at least one skipped transmission/brake fluid flush or generic oil specification.',
  },
  {
    id: 'unknown',
    label: 'No Verified Service History / Auction Acquisition',
    multiplier: 1.32,
    description: 'Must assume deferred preventative maintenance and maximum thermal fluid degradation.',
  },
];

export const SCHEDULE_MODES = [
  {
    id: 'preventative',
    label: 'Engineering Preventative Schedule',
    shortLabel: 'Engineering Preventative',
    subtitle: 'Independent marque specialist failure prevention thresholds (ZF, BorgWarner, Bosch)',
    badge: 'Specialist Protocols',
  },
  {
    id: 'oem',
    label: 'OEM "Lifetime" Marketing Schedule',
    shortLabel: 'OEM "Lifetime" Marketing',
    subtitle: 'Dealership warranty-limited intervals, "sealed for life" transmission marketing',
    badge: 'Dealer Warranty Minimums',
  },
];

/**
 * Calculates dynamic OEM risk exposure multiplier based on physical odometer:
 * Math.min(3.1, Math.max(2.2, 1.0 + (physicalOdometerMiles / 45000) * 0.85))
 */
export function calculateOemRiskMultiplier(physicalOdometerMiles) {
  const odo = Math.max(0, Number(physicalOdometerMiles) || 0);
  return Math.min(3.1, Math.max(2.2, 1.0 + (odo / 45000) * 0.85));
}

export const MAINTENANCE_COMPONENTS = [
  {
    id: 'timing-assembly',
    name: 'Timing Belt / Wet Belt / Timing Chain & Water Pump',
    category: 'Primary Valvetrain Synchronization',
    applicablePowertrains: ['diesel', 'gasoline-turbo', 'gasoline-na', 'hybrid'],
    applicableTransmissions: ['all'],
    serviceIntervalMiles: 85000,
    criticalLimitMiles: 105000,
    urbanShortTripPenalty: 1.42,
    oilSensitivity: 1.0, // Fully affected by oil interval discipline (chains & wet belts)
    oemMarketingIntervalMiles: 150000,
    oemIntervalDisplay: '150,000 mi / 10 yr (or Unscheduled Chain)',
    oemFallacyBadge: '🚨 OEM EXTENDED BELT INTERVAL RISK',
    oemFallacyTitle: 'OEM Extended Belt & Chain Interval Fallacy',
    oemFallacyExplanation:
      'Automakers push timing belt intervals to 150,000 mi and market chains as "lifetime" to lower initial 3-year fleet ownership metrics. Real-world fuel dilution disintegrates wet belts (EcoBoost/PureTech) and hydraulic chain tensioners reach maximum extension by 85,000–100,000 mi.',
    costsUsd: {
      dealership: [1450, 2650],
      independent: [890, 1650],
      diyParts: [280, 560],
    },
    laborHours: [5.5, 9.5],
    failureModeSummary:
      'Catastrophic piston-to-valve interference if belt teeth shear, wet belt delaminates into oil pickup strainer, or hydraulic chain tensioner ratchets past limit.',
    thermodynamicMechanism:
      'Cold urban starts create unburned fuel condensation in crankcase oil (up to 4–6% dilution), chemically swelling Belt-in-Oil (EcoBlue/PureTech) elastomers and abrasive-wearing timing chain roller pins.',
    preventativeAdvice:
      'Replace dry/wet timing belts + water pump 20% ahead of OEM mileage cap. On chain engines (EA888, B48, EcoBoost), monitor cold-start rattle for >2 seconds and inspect cam phase adaptation angle via OBD-II PID (replace if beyond ±4.5°).',
    relatedObdCodes: ['P0016', 'P0128'],
  },
  {
    id: 'drivetrain-dmf-dsg',
    name: 'Dual-Mass Flywheel (DMF), Clutch Pack & Mechatronics / ATF Service',
    category: 'Transmission & Torque Coupling',
    applicablePowertrains: ['diesel', 'gasoline-turbo', 'gasoline-na', 'hybrid', 'ev'],
    applicableTransmissions: ['dct-dsg', 'torque-converter', 'cvt-ecvt', 'manual', 'single-speed-ev'],
    serviceIntervalMiles: 55000,
    criticalLimitMiles: 80000,
    urbanShortTripPenalty: 1.52,
    oilSensitivity: 0.25,
    oemMarketingIntervalMiles: null,
    oemIntervalDisplay: 'Sealed for Life ("Lifetime Transmission Fluid")',
    oemFallacyBadge: '🚨 OEM "LIFETIME FLUID" FALLACY',
    oemFallacyTitle: 'OEM "Lifetime Fluid" Marketing Fallacy',
    oemFallacyExplanation:
      'Automaker "Lifetime Fluid" marketing defines lifetime strictly as the 60,000-mile warranty window. Transmission designer ZF explicitly mandates ATF and filter pan renewal every 50,000–60,000 miles to prevent valve body scoring, accumulator failure, and clutch burn.',
    costsUsd: {
      dealership: [1850, 3400],
      independent: [1120, 2150],
      diyParts: [420, 980],
    },
    laborHours: [4.5, 8.5],
    failureModeSummary:
      'Dual-mass flywheel arc-spring bottoming, DSG/PDK mechatronic hydraulic accumulator micro-cracks, or torque converter lock-up clutch shudder.',
    thermodynamicMechanism:
      'Urban stop-and-go traffic forces thousands of micro-slip engagement cycles per 1,000 miles, spiking clutch friction plate & ATF temperatures above 125°C and shearing viscosity modifiers.',
    preventativeAdvice:
      'Never accept "lifetime transmission fluid" marketing. Perform wet-clutch DSG/PDK fluid & filter service every 38,000 miles (60,000 km) and ZF/Aisin torque converter fluid exchanges every 55,000 miles.',
    relatedObdCodes: ['P0700'],
  },
  {
    id: 'dpf-egr-scr-injectors',
    name: 'DPF Filter, EGR Cooler & Valve, AdBlue/SCR & Piezo Injectors',
    category: 'Aftertreatment & High-Pressure Injection',
    applicablePowertrains: ['diesel'],
    applicableTransmissions: ['all'],
    serviceIntervalMiles: 75000,
    criticalLimitMiles: 95000,
    urbanShortTripPenalty: 1.55,
    oilSensitivity: 0.75,
    oemMarketingIntervalMiles: null,
    oemIntervalDisplay: 'Unscheduled (Run-to-failure / Hard DTC lock)',
    oemFallacyBadge: '⚠️ OEM UNSCHEDULED ADVICE',
    oemFallacyTitle: 'Dealer "Replace, Don\'t Clean" Policy',
    oemFallacyExplanation:
      'OEM manuals schedule no preventative DPF soot washing or differential pressure sensor testing, allowing ash to permanently blind the silicon carbide monolith until a $3,500+ DPF/SCR replacement is forced.',
    costsUsd: {
      dealership: [2100, 4200],
      independent: [1180, 2450],
      diyParts: [450, 1250],
    },
    laborHours: [4.0, 8.0],
    failureModeSummary:
      'DPF monolith thermal runaway or ash plugging, EGR cooler soot-sludge restriction, AdBlue urea dosing valve crystallization, and injector nozzle coking.',
    thermodynamicMechanism:
      'Passive DPF regeneration requires exhaust gas temperatures (EGT) >380°C, and active regeneration requires >580°C for 15+ minutes. Urban trips under 12 miles abort active regens, dumping post-injection diesel into the oil sump.',
    preventativeAdvice:
      'Monitor DPF Differential Pressure (kPa) and Calculated Soot vs. Oil Ash Mass (g) via OBD-II. Use Low-SAPS (C2/C3/C4) oil exclusively to minimize non-combustible sulfated ash accumulation.',
    relatedObdCodes: ['P2002', 'P2463', 'P0401', 'P20EE'],
  },
  {
    id: 'hpfp-turbo-vnt',
    name: 'High-Pressure Fuel Pump (HPFP) & Turbocharger VNT Actuator / Bearings',
    category: 'Forced Induction & Fuel Rail Delivery',
    applicablePowertrains: ['diesel', 'gasoline-turbo'],
    applicableTransmissions: ['all'],
    serviceIntervalMiles: 95000,
    criticalLimitMiles: 120000,
    urbanShortTripPenalty: 1.38,
    oilSensitivity: 0.90,
    oemMarketingIntervalMiles: null,
    oemIntervalDisplay: 'Unscheduled / Run-to-Failure',
    oemFallacyBadge: '⚠️ OEM RUN-TO-FAILURE INTERVAL',
    oemFallacyTitle: 'Turbo VNT & HPFP Follower Omission',
    oemFallacyExplanation:
      'Factory dealer checklists do not test turbocharger wastegate pivot backlash or CP4 high-pressure pump cam followers until total seizure contaminates the entire common rail with metal filings.',
    costsUsd: {
      dealership: [1950, 3850],
      independent: [1150, 2300],
      diyParts: [520, 1180],
    },
    laborHours: [4.5, 7.5],
    failureModeSummary:
      'Turbocharger variable nozzle turbine (VNT) unison ring carbon sticking or wastegate pivot wear (P0299 underboost); HPFP roller tappet galling sending metallic swarf into fuel rails (P0087).',
    thermodynamicMechanism:
      'Turbocharger journal & thrust bearings spin up to 220,000 RPM floating on a 15-micron hydrodynamic oil film. Hot shutdowns or degraded extended-drain oil cause carbon coking inside the bearing cartridge.',
    preventativeAdvice:
      'Allow 45 seconds of idle oil circulation after high-load highway driving before shutdown. Replace fuel filters every 20,000 miles on common-rail diesels to protect the CP4/HPFP lubricity film.',
    relatedObdCodes: ['P0299', 'P0087', 'P0101'],
  },
  {
    id: 'suspension-brakes-chassis',
    name: 'Multi-Link Control Arm Bushings, Dampers & Brake Rotors/Pads',
    category: 'Chassis Dynamics & Braking System',
    applicablePowertrains: ['diesel', 'gasoline-turbo', 'gasoline-na', 'hybrid', 'ev'],
    applicableTransmissions: ['all'],
    serviceIntervalMiles: 50000,
    criticalLimitMiles: 70000,
    urbanShortTripPenalty: 1.36,
    oilSensitivity: 0.0,
    oemMarketingIntervalMiles: null,
    oemIntervalDisplay: 'Visual Inspection Only',
    oemFallacyBadge: '⚠️ VISUAL-ONLY DEALER CHECK',
    oemFallacyTitle: 'Superficial Dealer Inspection Fallacy',
    oemFallacyExplanation:
      'Standard dealer multi-point checks verify only whether rubber boots are torn, routinely passing leaking front hydro-bushings and glazed EV friction brake rotors.',
    costsUsd: {
      dealership: [1350, 2600],
      independent: [780, 1520],
      diyParts: [310, 690],
    },
    laborHours: [3.5, 6.5],
    failureModeSummary:
      'Fluid-filled hydro-bushing tearing on front thrust arms, strut top-mount bearing binding, and inner brake rotor surface delamination/corrosion (especially on EVs/Hybrids due to light friction use).',
    thermodynamicMechanism:
      'Urban speed bumps, potholes, and full-lock parking maneuvers subject elastomeric control arm bushings to high-amplitude shear loads, while regenerative braking leaves rear steel brake discs un-wiped and prone to rust pitting.',
    preventativeAdvice:
      'Inspect front lower hydro-bushings for silicone fluid trails at 45k miles. On EVs and Hybrids, lubricate brake caliper slide pins annually and perform periodic firm friction stops to clean rotor faces.',
    relatedObdCodes: ['U0100'],
  },
  {
    id: 'hv-battery-thermal-loop',
    name: 'EV / Hybrid High-Voltage Battery Thermal Chiller & Inverter Coolant Loop',
    category: 'Electrified Thermal & Power Electronics',
    applicablePowertrains: ['hybrid', 'ev'],
    applicableTransmissions: ['all'],
    serviceIntervalMiles: 65000,
    criticalLimitMiles: 90000,
    urbanShortTripPenalty: 1.35,
    oilSensitivity: 0.0,
    oemMarketingIntervalMiles: 120000,
    oemIntervalDisplay: '120,000–150,000 mi / 10 yr',
    oemFallacyBadge: '⚠️ OEM EXTENDED COOLANT INTERVAL',
    oemFallacyTitle: 'Extended Dielectric Coolant Degradation',
    oemFallacyExplanation:
      'OEM schedules defer battery loop coolant flushes beyond 100,000 miles, allowing dielectric conductivity drift and chiller valve motor cavitation that trigger high-voltage battery cell delta-V imbalance.',
    costsUsd: {
      dealership: [1250, 2900],
      independent: [720, 1680],
      diyParts: [220, 640],
    },
    laborHours: [3.0, 6.0],
    failureModeSummary:
      'Multi-way thermal coolant valve (Octovalve/chiller actuator) step-motor stalling, auxiliary electric inverter pump impeller wear, or HV battery blowers clogging with cabin dust.',
    thermodynamicMechanism:
      'Rapid DC fast charging and repeated urban regenerative braking cycle lithium-ion/NiMH cells through steep thermal gradients, accelerating dielectric coolant conductivity drift and valve seal swelling.',
    preventativeAdvice:
      'Flush low-conductivity inverter/battery coolant on strict schedule; clean hybrid rear seat HV battery intake fan filter every 25,000 miles to prevent cell module delta-V divergence (P0A80).',
    relatedObdCodes: ['P0A80', 'P0128', 'U0100'],
  },
  {
    id: 'gdi-intake-pcv-ignition',
    name: 'GDI Intake Valve Carbon Blasting, PCV Oil Separator & Ignition Coils',
    category: 'Air Induction, Crankcase Ventilation & Spark',
    applicablePowertrains: ['gasoline-turbo', 'gasoline-na', 'hybrid'],
    applicableTransmissions: ['all'],
    serviceIntervalMiles: 60000,
    criticalLimitMiles: 82000,
    urbanShortTripPenalty: 1.44,
    oilSensitivity: 0.85,
    oemMarketingIntervalMiles: null,
    oemIntervalDisplay: 'Unscheduled / Not in Dealer Service Book',
    oemFallacyBadge: '⚠️ UNSCHEDULED OEM ITEM',
    oemFallacyTitle: 'Unscheduled GDI Intake Decoke Fallacy',
    oemFallacyExplanation:
      'No factory dealership maintenance schedule includes intake valve walnut media blasting. Because GDI injectors bypass intake ports, blow-by oil mist bakes onto valve stems by 60,000 miles, causing cold-start misfires (P0300) and intake flap failures.',
    costsUsd: {
      dealership: [1150, 2100],
      independent: [650, 1250],
      diyParts: [190, 440],
    },
    laborHours: [3.5, 6.0],
    failureModeSummary:
      'Crankcase PCV fluorosilicone diaphragm rupture causing unmetered vacuum air leak (P0171), heavy carbon stalagmites on intake valve stems causing cold-start misfires (P0300/P0301), and intake runner flap binding (P2015).',
    thermodynamicMechanism:
      'In Direct-Injection (GDI) engines, gasoline no longer washes over intake valve backs. Blow-by oil mist from the PCV valve bakes onto 240°C intake valves, restricting airflow swirl during cold urban warmup.',
    preventativeAdvice:
      'Proactively replace the PCV oil separator assembly every 50,000 miles before crankcase over-pressure blows out the rear main seal. Perform walnut-shell intake valve media blasting at 60k–75k miles.',
    relatedObdCodes: ['P0171', 'P0300', 'P0301', 'P2015'],
  },
];

/**
 * Pure thermodynamic & operational wear evaluation function.
 * Computes effective wear age vs. physical odometer for a given powertrain & driving profile.
 */
export function evaluateComponentHealth({
  component,
  physicalOdometerMiles,
  urbanTripSharePct, // 0 to 100 (% of driving that is short urban trips)
  oilIntervalId = 'standard',
  serviceHistoryId = 'verified',
  transmissionId = 'torque-converter',
}) {
  const odo = Math.max(0, Number(physicalOdometerMiles) || 0);
  const urbanFraction = Math.min(1, Math.max(0, (Number(urbanTripSharePct) || 0) / 100));

  // Urban cycle multiplier interpolates from 1.00 (100% highway) up to component.urbanShortTripPenalty (100% short-trip urban)
  const urbanMultiplier = 1 + urbanFraction * (component.urbanShortTripPenalty - 1);

  const oilProfile =
    OIL_INTERVAL_PROFILES.find((p) => p.id === oilIntervalId) || OIL_INTERVAL_PROFILES[1];
  const historyProfile =
    SERVICE_HISTORY_PROFILES.find((p) => p.id === serviceHistoryId) || SERVICE_HISTORY_PROFILES[0];
  const transProfile =
    TRANSMISSION_OPTIONS.find((t) => t.id === transmissionId) || TRANSMISSION_OPTIONS[1];

  // Apply oil multiplier weighted by component's oilSensitivity
  const effectiveOilMultiplier = 1 + (oilProfile.multiplier - 1) * (component.oilSensitivity ?? 0.5);

  // If evaluating drivetrain component, include transmission type urban factor
  const transMultiplier =
    component.id === 'drivetrain-dmf-dsg' ? (transProfile.urbanWearFactor - 1) * urbanFraction * 0.4 + 1 : 1.0;

  const combinedMultiplier =
    urbanMultiplier * effectiveOilMultiplier * historyProfile.multiplier * transMultiplier;

  const effectiveWearMiles = Math.round(odo * combinedMultiplier);

  // Calculate wear percentage monotonically relative to critical limit and service interval
  const cycleMiles = effectiveWearMiles;

  const wearPctOfCritical = Math.min(100, Math.round((cycleMiles / component.criticalLimitMiles) * 100));
  const remainingLifespanPct = Math.max(0, 100 - wearPctOfCritical);
  const remainingPhysicalMiles = Math.max(
    0,
    Math.round((component.criticalLimitMiles - cycleMiles) / combinedMultiplier)
  );

  let status = 'OPTIMAL';
  let statusBadgeText = 'OPTIMAL';
  if (cycleMiles >= component.serviceIntervalMiles * 0.98 || wearPctOfCritical >= 82) {
    status = 'CRITICAL';
    statusBadgeText = 'IMMINENT FAILURE RISK';
  } else if (cycleMiles >= component.serviceIntervalMiles * 0.72 || wearPctOfCritical >= 60) {
    status = 'WARNING';
    statusBadgeText = 'SERVICE WINDOW APPROACHING';
  }

  return {
    componentId: component.id,
    physicalOdometerMiles: odo,
    effectiveWearMiles,
    cycleMiles,
    combinedMultiplier: +combinedMultiplier.toFixed(2),
    urbanMultiplier: +urbanMultiplier.toFixed(2),
    wearPctOfCritical,
    remainingLifespanPct,
    remainingPhysicalMiles,
    status,
    statusBadgeText,
  };
}

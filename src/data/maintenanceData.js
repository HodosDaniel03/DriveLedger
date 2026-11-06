/**
 * DriveLedger — Mechanical Component Wear & Thermodynamic Penalty Database
 * Models physical odometer vs. effective thermodynamic wear age across:
 * - Short-trip urban cold cycles (1.35x to 1.55x wear multiplier)
 * - Oil change interval discipline (Strict 6k-8k mi vs Extended 15k-20k mi)
 * - Prior service record verification status
 */

export {
  POWERTRAIN_TYPES,
  PowertrainType,
  resolvePowertrainType,
  normalizePowertrainType,
  isPureElectric,
  calculateBatterySoh,
  calculateEvEnergyCost,
  calculatePhevEnergyCost,
  calculateVehicleEnergyCost,
} from './powertrainTypes.js';

import {
  POWERTRAIN_TYPES,
  resolvePowertrainType,
  isPureElectric,
} from './powertrainTypes.js';

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
    applicablePowertrains: ['diesel', 'gasoline-turbo', 'gasoline-na', 'hybrid'],
    applicableTransmissions: ['dct-dsg', 'torque-converter', 'cvt-ecvt', 'manual'],
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
    applicablePowertrains: ['diesel', 'gasoline-turbo', 'gasoline-na', 'hybrid'],
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
      'Standard dealer multi-point checks verify only whether rubber boots are torn, routinely passing leaking front hydro-bushings and glazed friction brake rotors.',
    costsUsd: {
      dealership: [1350, 2600],
      independent: [780, 1520],
      diyParts: [310, 690],
    },
    laborHours: [3.5, 6.5],
    failureModeSummary:
      'Fluid-filled hydro-bushing tearing on front thrust arms, strut top-mount bearing binding, and inner brake rotor surface delamination/corrosion.',
    thermodynamicMechanism:
      'Urban speed bumps, potholes, and full-lock parking maneuvers subject elastomeric control arm bushings to high-amplitude shear loads, accelerating hydraulic fluid leaks.',
    preventativeAdvice:
      'Inspect front lower hydro-bushings for silicone fluid trails at 45k miles. Lubricate brake caliper slide pins and perform periodic firm friction stops.',
    relatedObdCodes: ['U0100'],
  },
  {
    id: 'hv-battery-thermal-loop',
    name: 'Hybrid High-Voltage Battery Thermal Chiller & Inverter Coolant Loop',
    category: 'Electrified Thermal & Power Electronics',
    applicablePowertrains: ['hybrid'],
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
      'Multi-way thermal coolant valve (chiller actuator) step-motor stalling, auxiliary electric inverter pump impeller wear, or HV battery blowers clogging with cabin dust.',
    thermodynamicMechanism:
      'Repeated urban regenerative braking cycles lithium-ion/NiMH cells through steep thermal gradients, accelerating dielectric coolant conductivity drift and valve seal swelling.',
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
  {
    id: 'ev-battery-soh',
    name: 'Traction Battery Degradation (SoH % · LFP vs. NMC Curve)',
    category: 'High-Voltage Energy Storage',
    applicablePowertrains: ['ev'],
    applicableTransmissions: ['all'],
    serviceIntervalMiles: 80000,
    criticalLimitMiles: 120000,
    urbanShortTripPenalty: 1.36,
    oilSensitivity: 0.0,
    oemMarketingIntervalMiles: 100000,
    oemIntervalDisplay: '100,000 mi / 8-Year Warranty Floor (70% SoH Cap)',
    oemFallacyBadge: '⚠️ OEM 70% CAPACITY FLOOR FALLACY',
    oemFallacyTitle: 'OEM Battery Warranty Threshold Fallacy',
    oemFallacyExplanation:
      'Automaker 8-year warranties only trigger if capacity falls below 70%, leaving owners to absorb 15–28% range loss and cold-weather internal resistance degradation as "normal operational aging".',
    costsUsd: {
      dealership: [4500, 11500],
      independent: [2200, 5800],
      diyParts: [1200, 3200],
    },
    laborHours: [6.0, 14.0],
    failureModeSummary:
      'SEI layer growth, lithium plating under rapid DC charging, cathode transition metal dissolution, and pouch/prismatic cell delta-V imbalance.',
    thermodynamicMechanism:
      'Repeated high-C charging (150kW+ DC) and 100% state-of-charge holding accelerate NMC electrolyte oxidation; LFP cells exhibit flatter degradation but suffer voltage plateau calibration drift.',
    preventativeAdvice:
      'Maintain 20–80% daily charge limits for NMC chemistry. For LFP chemistry, perform monthly 100% calibration charging while minimizing sub-zero fast charging without battery preconditioning.',
    relatedObdCodes: ['P0A80', 'U0100'],
  },
  {
    id: 'ev-obc-iccu',
    name: 'On-Board Charger (OBC) & Integrated Power Electronics (ICCU)',
    category: 'Power Electronics & AC/DC Conversion',
    applicablePowertrains: ['ev', 'phev'],
    applicableTransmissions: ['all'],
    serviceIntervalMiles: 65000,
    criticalLimitMiles: 95000,
    urbanShortTripPenalty: 1.38,
    oilSensitivity: 0.0,
    oemMarketingIntervalMiles: null,
    oemIntervalDisplay: 'Unscheduled / Run-to-Failure',
    oemFallacyBadge: '🚨 OEM UNSCHEDULED POWER ELECTRONICS',
    oemFallacyTitle: 'OBC / ICCU Thermal Stress Omission',
    oemFallacyExplanation:
      'Factory dealer guides schedule zero preventative inspection of AC charging interlocks, high-voltage gate driver capacitors, or ICCU 12V DC-DC converter FETs until a sudden no-charge lockout leaves the car stranded.',
    costsUsd: {
      dealership: [2400, 4800],
      independent: [1100, 2200],
      diyParts: [450, 950],
    },
    laborHours: [3.5, 7.0],
    failureModeSummary:
      'ICCU primary circuit FET short-circuits, AC charge port thermocouple sensor drift, blown high-voltage pyrofuses, and 12V auxiliary DC-DC charging dropouts.',
    thermodynamicMechanism:
      'High ambient temperature Level 2 AC charging (7.4–11 kW) for 6–10 hours continuously cooks high-frequency switching transistors and internal dielectric potting material.',
    preventativeAdvice:
      'Perform annual thermal imaging scans of charge port pin terminals and OBC heatsink coolant flow; avoid continuous 48A AC home charging in unventilated garages during summer peaks.',
    relatedObdCodes: ['U0100', 'P0A80'],
  },
  {
    id: 'ev-thermal-heatpump',
    name: 'Heat Pump, Multi-Way Coolant Switching Valves & Battery Chiller',
    category: 'Electrified Thermal Management',
    applicablePowertrains: ['ev'],
    applicableTransmissions: ['all'],
    serviceIntervalMiles: 60000,
    criticalLimitMiles: 85000,
    urbanShortTripPenalty: 1.42,
    oilSensitivity: 0.0,
    oemMarketingIntervalMiles: 120000,
    oemIntervalDisplay: '120,000 mi / 10-Year Extended Coolant',
    oemFallacyBadge: '⚠️ OEM MULTI-WAY VALVE CAVITATION',
    oemFallacyTitle: 'Octovalve & Chiller Loop Neglect',
    oemFallacyExplanation:
      'Modern EVs route thermal energy via 5-way or 8-way multi-port valves and electric scroll heat pumps. OEM 10-year coolant intervals allow silicate depletion and dielectric fluid acidity to seize stepper-motor valve gates.',
    costsUsd: {
      dealership: [1650, 3400],
      independent: [850, 1850],
      diyParts: [320, 750],
    },
    laborHours: [4.0, 7.5],
    failureModeSummary:
      'Rotary multi-way coolant valve (Octovalve) step-motor sticking, electronic expansion valve (EXV) hunting, and heat pump refrigerant pressure sensor loss.',
    thermodynamicMechanism:
      'Complex dual-loop cooling (battery loop + cabin HVAC + inverter loop) switches flow paths dozens of times per hour, subjecting actuator seals and scroll compressor bearings to intense thermal shock cycles.',
    preventativeAdvice:
      'Vacuum flush and refill low-conductivity battery dielectric coolant at 60,000 miles (not 120k). Verify compressor oil and refrigerant subcooling pressure at major services.',
    relatedObdCodes: ['P0A80', 'U0100'],
  },
  {
    id: 'ev-reduction-gear',
    name: 'Electric Reducer Gearbox Fluid & Differential Bearings',
    category: 'Direct-Drive Mechanical Transmission',
    applicablePowertrains: ['ev'],
    applicableTransmissions: ['single-speed-ev', 'direct-drive', 'all'],
    serviceIntervalMiles: 50000,
    criticalLimitMiles: 75000,
    urbanShortTripPenalty: 1.38,
    oilSensitivity: 0.0,
    oemMarketingIntervalMiles: null,
    oemIntervalDisplay: 'Sealed for Life ("Maintenance-Free Drive Unit")',
    oemFallacyBadge: '🚨 OEM "SEALED DRIVE UNIT" FALLACY',
    oemFallacyTitle: 'Single-Speed Reducer Lifetime Myth',
    oemFallacyExplanation:
      'Automakers market single-speed reduction gearboxes as "sealed for life". In reality, instant peak torque and 18,000+ RPM input shaft speeds shear gear oil viscosity and generate magnetic metallic swarf within 50,000 miles.',
    costsUsd: {
      dealership: [350, 680],
      independent: [190, 380],
      diyParts: [75, 160],
    },
    laborHours: [1.5, 3.0],
    failureModeSummary:
      'Helical gear tooth micro-pitting, intermediate shaft needle bearing whine, high-speed input seal weeping, and magnetic drain plug saturation.',
    thermodynamicMechanism:
      'Instant EV torque (400–700 Nm from 0 RPM) imposes violent shock loads on helical gear teeth, shearing synthetic 75W gear lubricant and accelerating bearing raceway spalling.',
    preventativeAdvice:
      'Drain and replace drive unit reduction gear fluid with OEM-specified low-viscosity gear oil every 45,000–50,000 miles; clean magnetic collection drain plugs of break-in metallic sludge.',
    relatedObdCodes: ['U0100'],
  },
  {
    id: 'ev-curb-suspension',
    name: 'Heavy Curb-Weight Suspension Hydro-Bushings & Ball Joints',
    category: 'Chassis Dynamics & High-Mass Articulation',
    applicablePowertrains: ['ev'],
    applicableTransmissions: ['all'],
    serviceIntervalMiles: 45000,
    criticalLimitMiles: 65000,
    urbanShortTripPenalty: 1.45,
    oilSensitivity: 0.0,
    oemMarketingIntervalMiles: null,
    oemIntervalDisplay: 'Visual Inspection Only',
    oemFallacyBadge: '⚠️ 2.2-TON CURB WEIGHT PENALTY',
    oemFallacyTitle: 'High-Mass Suspension Wear Omission',
    oemFallacyExplanation:
      'EV battery packs add 400–700 kg over equivalent combustion platforms. OEM checklists overlook front control arm hydraulic fluid leakage and ball joint radial play that accelerate rapidly under 2.2+ ton vehicle masses.',
    costsUsd: {
      dealership: [1450, 2850],
      independent: [820, 1650],
      diyParts: [340, 720],
    },
    laborHours: [3.5, 6.5],
    failureModeSummary:
      'Front upper/lower control arm hydro-bushing tears, ball joint knuckle creaking, stabilizer sway bar link play, and strut top-mount binding.',
    thermodynamicMechanism:
      'Heavy chassis inertial loads over road imperfections and aggressive regenerative deceleration impose severe repetitive shear and tensile strains on polyurethane and rubber-isolated hydro-bushings.',
    preventativeAdvice:
      'Inspect front thrust arm bushings under load at 40,000-mile intervals; replace worn control arms with reinforced aftermarket heavy-duty bushings designed for EV load ratings.',
    relatedObdCodes: ['U0100'],
  },
  {
    id: 'ev-torque-tires',
    name: 'High-Torque Accelerated EV Tire Wear & Wheel Alignment',
    category: 'Tire Dynamics & Traction Interface',
    applicablePowertrains: ['ev'],
    applicableTransmissions: ['all'],
    serviceIntervalMiles: 18000,
    criticalLimitMiles: 28000,
    urbanShortTripPenalty: 1.48,
    oilSensitivity: 0.0,
    oemMarketingIntervalMiles: 30000,
    oemIntervalDisplay: '30,000 mi / Tread Wear Indicators',
    oemFallacyBadge: '⚠️ ACCELERATED EV TIRE CONSUMPTION',
    oemFallacyTitle: 'Instant Torque EV Tire Consumption',
    oemFallacyExplanation:
      'Instant zero-RPM torque delivery and heavy battery ballast chew through tire tread 30–40% faster than internal combustion equivalents, especially wearing the inner shoulder on multi-link rear axles.',
    costsUsd: {
      dealership: [980, 1850],
      independent: [680, 1350],
      diyParts: [520, 1050],
    },
    laborHours: [1.0, 2.0],
    failureModeSummary:
      'Accelerated inner-shoulder tread wear, uneven tire cupping, steering vibration from rapid dynamic unbalance, and degraded wet-weather hydroplaning resistance.',
    thermodynamicMechanism:
      'Instant electric motor torque induces micro-slip across tread blocks during every stoplight acceleration, while high static negative camber on heavy rear axles focuses frictional heat on inner tire shoulders.',
    preventativeAdvice:
      'Rotate tires front-to-back every 6,000–8,000 miles. Perform precision 4-wheel alignment annually with EV-specific camber calibration to prevent premature inner-edge cord exposure.',
    relatedObdCodes: [],
  },
  {
    id: 'ev-regen-brake-corrosion',
    name: 'Regenerative Braking Rotor Rust & Caliper Slide Pin Seizure',
    category: 'Hydraulic Friction Braking Safeguards',
    applicablePowertrains: ['ev'],
    applicableTransmissions: ['all'],
    serviceIntervalMiles: 25000,
    criticalLimitMiles: 40000,
    urbanShortTripPenalty: 1.40,
    oilSensitivity: 0.0,
    oemMarketingIntervalMiles: null,
    oemIntervalDisplay: 'Visual Inspection Only',
    oemFallacyBadge: '⚠️ EV BRAKE UNDER-UTILIZATION RUST',
    oemFallacyTitle: 'Friction Brake Disuse Corrosion Fallacy',
    oemFallacyExplanation:
      'Because one-pedal regenerative braking handles 90%+ of deceleration, steel brake discs and hydraulic caliper sliders suffer from severe disuse corrosion, pitting rotors and seizing slide pins within 3 winters.',
    costsUsd: {
      dealership: [650, 1350],
      independent: [340, 720],
      diyParts: [120, 290],
    },
    laborHours: [2.0, 4.0],
    failureModeSummary:
      'Brake caliper guide pin seizing, brake pad binding in rusted abutment clips, rotor swept-surface rust pitting, and reduced emergency stopping distance.',
    thermodynamicMechanism:
      'Lack of regular thermal friction dissipation prevents moisture evaporation from disc faces; road salt and moisture form iron oxide crusts that tear friction linings when panic braking occurs.',
    preventativeAdvice:
      'Dismantle and lubricate caliper slide pins with high-temperature silicone grease annually. Perform periodic firm mechanical friction stops from highway speeds to scrub rust glaze from rotor faces.',
    relatedObdCodes: [],
  },
];

export const ICE_EXCLUSIVE_COMPONENT_IDS = new Set([
  'timing-assembly',
  'drivetrain-dmf-dsg',
  'dpf-egr-scr-injectors',
  'hpfp-turbo-vnt',
  'gdi-intake-pcv-ignition',
]);

/**
 * Pure thermodynamic & operational wear evaluation function.
 * Computes effective wear age vs. physical odometer for a given powertrain & driving profile.
 * When isPureElectric is true (or powertrainType === 'EV'), all ICE components return null.
 */
export function evaluateComponentHealth(firstArg, ...rest) {
  let params;
  if (firstArg && typeof firstArg === 'object' && ('component' in firstArg || 'physicalOdometerMiles' in firstArg)) {
    params = firstArg;
  } else {
    // Positional signature: (component, physicalOdometerMiles, vehicleOptions)
    const [comp, odo, opts = {}] = [firstArg, rest[0], rest[1] || {}];
    params = {
      component: comp,
      physicalOdometerMiles: odo,
      ...opts,
    };
  }

  const {
    component,
    physicalOdometerMiles,
    urbanTripSharePct, // 0 to 100 (% of driving that is short urban trips)
    oilIntervalId = 'standard',
    serviceHistoryId = 'verified',
    transmissionId = 'torque-converter',
    powertrainType,
    vehicle,
  } = params || {};

  if (!component) return null;

  // Strict Pure Electric (EV) exclusion of internal combustion components
  const resolvedType = powertrainType || (vehicle ? resolvePowertrainType(vehicle) : null);
  if (resolvedType && isPureElectric(resolvedType)) {
    if (ICE_EXCLUSIVE_COMPONENT_IDS.has(component.id)) {
      return null;
    }
    if (Array.isArray(component.applicablePowertrains) && !component.applicablePowertrains.includes('ev')) {
      return null;
    }
  }

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

  // Apply oil multiplier weighted by component's oilSensitivity (0.0 for EV components)
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

/**
 * Filters the component catalog so that EV strictly contains only EV-applicable components,
 * eliminating 100% of internal combustion items.
 */
export function filterComponentsForPowertrain(components = MAINTENANCE_COMPONENTS, powertrainOrVehicle) {
  const pType = resolvePowertrainType(powertrainOrVehicle);
  const isEv = isPureElectric(pType);
  return (components || MAINTENANCE_COMPONENTS).filter((comp) => {
    if (isEv) {
      if (ICE_EXCLUSIVE_COMPONENT_IDS.has(comp.id)) return false;
      return Array.isArray(comp.applicablePowertrains) && comp.applicablePowertrains.includes('ev');
    }
    const legacyKey =
      pType === POWERTRAIN_TYPES.ICE_DIESEL
        ? 'diesel'
        : pType === POWERTRAIN_TYPES.HEV || pType === POWERTRAIN_TYPES.PHEV
        ? 'hybrid'
        : 'gasoline-turbo';
    return (
      Array.isArray(comp.applicablePowertrains) &&
      (comp.applicablePowertrains.includes(legacyKey) ||
        comp.applicablePowertrains.includes('diesel') ||
        comp.applicablePowertrains.includes('gasoline-turbo') ||
        comp.applicablePowertrains.includes('gasoline-na'))
    );
  });
}

// ============================================================================
// DYNAMIC MAINTENANCE REVISION THRESHOLDS (60k, 100k, 150k, 200k km)
// ============================================================================

export const REVISION_THRESHOLDS = [
  {
    thresholdKm: 60000,
    thresholdMiles: 37282,
    label: '60,000 km / 37.5k mi Minor-Major Service',
    surchargeUsd: {
      EV: 160,
      HEV: 340,
      PHEV: 480,
      ICE_PETROL: 420,
      ICE_DIESEL: 520,
    },
  },
  {
    thresholdKm: 100000,
    thresholdMiles: 62137,
    label: '100,000 km / 62k mi Major Powertrain Revision',
    surchargeUsd: {
      EV: 280,
      HEV: 520,
      PHEV: 780,
      ICE_PETROL: 750,
      ICE_DIESEL: 890,
    },
  },
  {
    thresholdKm: 150000,
    thresholdMiles: 93205,
    label: '150,000 km / 93k mi High-Mileage Valvetrain & Chassis',
    surchargeUsd: {
      EV: 450,
      HEV: 820,
      PHEV: 1350,
      ICE_PETROL: 1250,
      ICE_DIESEL: 1650,
    },
  },
  {
    thresholdKm: 200000,
    thresholdMiles: 124274,
    label: '200,000 km / 125k mi Deep System Overhaul',
    surchargeUsd: {
      EV: 620,
      HEV: 1100,
      PHEV: 1750,
      ICE_PETROL: 1500,
      ICE_DIESEL: 2100,
    },
  },
];

/**
 * Calculates revision threshold surcharges incurred between two mileage points
 * for a specific powertrain type.
 */
export function calculateRevisionSurcharge(startMiles, endMiles, powertrainType = 'ICE_PETROL') {
  const pType = resolvePowertrainType(powertrainType);
  const start = Math.max(0, Number(startMiles) || 0);
  const end = Math.max(start, Number(endMiles) || start);
  let totalSurcharge = 0;
  const passedThresholds = [];

  for (const rev of REVISION_THRESHOLDS) {
    if (start < rev.thresholdMiles && end >= rev.thresholdMiles) {
      const surcharge = rev.surchargeUsd[pType] ?? rev.surchargeUsd.ICE_PETROL ?? 0;
      totalSurcharge += surcharge;
      passedThresholds.push({
        ...rev,
        appliedSurchargeUsd: surcharge,
      });
    }
  }

  return {
    totalSurchargeUsd: totalSurcharge,
    passedThresholds,
  };
}

/**
 * Dynamic maintenance scaling calculator factoring in physical odometer,
 * annual mileage, wear escalation, and revision threshold milestone bumps.
 */
export function calculateDynamicMaintenance({
  baseAnnualMaintenanceUsd = 800,
  odometerMiles = 0,
  annualDistanceMiles = 12000,
  powertrainType = 'ICE_PETROL',
  maintenanceWearFactor = 1.0,
  ownershipYear = 1,
}) {
  const pType = resolvePowertrainType(powertrainType);
  const isEv = isPureElectric(pType);
  const odo = Math.max(0, Number(odometerMiles) || 0);
  const annualMi = Math.max(0, Number(annualDistanceMiles) || 0);
  const yr = Math.max(1, Number(ownershipYear) || 1);

  const startOfYearOdo = odo + annualMi * (yr - 1);
  const endOfYearOdo = odo + annualMi * yr;

  // Asymptotic wear escalation with cap at mature mileage
  const wearEscalation = Math.min(2.5, 1 + Math.max(0, (endOfYearOdo - 30000) / 85000) * 0.45);

  // EV base maintenance reduction (30-40% lower)
  const powertrainBaseFactor = isEv ? 0.65 : 1.0;
  const baseCost = baseAnnualMaintenanceUsd * powertrainBaseFactor;

  // Revision threshold milestones crossed in this year
  const { totalSurchargeUsd, passedThresholds } = calculateRevisionSurcharge(
    startOfYearOdo,
    endOfYearOdo,
    pType
  );

  const mileageWearMultiplier = annualMi > 0 ? (annualMi / 12000) : 0;
  const routineMaintenanceUsd = Math.round(
    baseCost * wearEscalation * maintenanceWearFactor * mileageWearMultiplier
  );
  const yearMaintenanceUsd = routineMaintenanceUsd + totalSurchargeUsd;

  return {
    yearMaintenanceUsd,
    routineMaintenanceUsd,
    revisionSurchargeUsd: totalSurchargeUsd,
    passedThresholds,
    wearEscalation,
  };
}

/**
 * Calculates realistic non-linear vehicle depreciation:
 * - Steep drop in first 3 years (~20-25% in Yr 1, ~15% in Yr 2, ~12% in Yr 3)
 * - Gradual flattening past year 4 (3-7%/yr down to scrap residual floor)
 * - Powertrain adjustment (HEV retention bonus, EV tech obsolescence / curve, ICE_DIESEL restrictions)
 * - Annual mileage deviation adjustment
 * - Used vehicles: initial vehicle age offset based on starting odometer so used cars do not repeatedly take the showroom drop
 * - Residual value floor >= 5% of purchase price
 */
export function calculateNonLinearDepreciation({
  purchasePriceUsd,
  odometerMiles = 0,
  annualDistanceMiles = 12000,
  ownershipYear = 1,
  powertrainType = 'ICE_PETROL',
  residualCurve10Yr,
}) {
  const price = Math.max(500, Number(purchasePriceUsd) > 0 ? Number(purchasePriceUsd) : 30000);
  const startOdo = Math.max(0, Number(odometerMiles) >= 0 ? Number(odometerMiles) : 0);
  const annualMi = Math.max(0, Number(annualDistanceMiles) >= 0 ? Number(annualDistanceMiles) : 12000);
  const yr = Math.max(1, Number(ownershipYear) || 1);
  const pType = resolvePowertrainType(powertrainType);

  // 1. Initial vehicle age offset at acquisition (A0 in years, 12,500 miles = 1 year baseline)
  const initialAgeYears = startOdo / 12500;

  // Continuous factory-new retention curve function
  // Steep drop in first 3 years (~20-25% Yr 1, ~15% Yr 2, ~12% Yr 3)
  // Gradual flattening past year 4 (3-7%/yr down to scrap residual floor)
  const getFactoryRetention = (t) => {
    if (t <= 0) return 1.0;
    return Math.max(0.05, 0.45 * Math.exp(-0.58 * t) + 0.40 * Math.exp(-0.05 * t) + 0.15);
  };

  const rAcquisition = Math.max(0.05, getFactoryRetention(initialAgeYears));
  const rCurrent = Math.max(0.05, getFactoryRetention(initialAgeYears + yr));

  // Used vehicle retention ratio relative to value at acquisition: prevents re-taking showroom drop
  const baseRetention = Math.min(1.0, rCurrent / rAcquisition);

  // 2. Powertrain adjustment factor
  let ptMultiplier = 1.0;
  if (pType === POWERTRAIN_TYPES.HEV) {
    ptMultiplier = 1.03; // HEV resale retention bonus
  } else if (pType === POWERTRAIN_TYPES.EV) {
    ptMultiplier = 0.97; // EV early tech obsolescence factor (smooth and monotonic)
  } else if (pType === POWERTRAIN_TYPES.ICE_DIESEL) {
    ptMultiplier = 0.985; // Low-emission zone restrictions
  }

  // 3. Mileage deviation adjustment (relative to 12,500 mi/yr baseline)
  const mileageExcessRatio = (annualMi - 12500) / 12500;
  let mileageAdjustment = 1.0;
  if (mileageExcessRatio > 0) {
    // High mileage penalizes vehicle retention over time
    mileageAdjustment = Math.pow(Math.max(0.5, 1 - mileageExcessRatio * 0.04), yr);
  } else if (mileageExcessRatio < 0) {
    // Low mileage preserves vehicle retention: dampened and capped so it cannot outpace annual depreciation
    // Annual low-mileage bonus is dampened to <=1.5%/yr (below the minimum annual depreciation rate)
    // and compounding is capped to 5 years (and overall multiplier capped at 1.15x)
    const lowMileageRate = Math.min(0.015, Math.abs(mileageExcessRatio) * 0.015);
    const effectiveCompoundingYears = Math.min(yr, 5);
    mileageAdjustment = Math.min(1.15, Math.pow(1 + lowMileageRate, effectiveCompoundingYears));
  }

  // Combined retention bounded between 5% residual floor and 96% ceiling
  const finalRetention = Math.min(0.96, Math.max(0.05, baseRetention * ptMultiplier * mileageAdjustment));
  const residualValueUsd = Math.max(Math.round(price * 0.05), Math.round(price * finalRetention));
  const cumulativeDepreciationUsd = Math.max(0, price - residualValueUsd);

  return {
    residualValueUsd,
    cumulativeDepreciationUsd,
    retentionPct: +(finalRetention * 100).toFixed(1),
  };
}

/**
 * Pure financial & engineering TCO calculation engine.
 * Exported for deterministic unit testing and edge-case verification.
 */
export function calculateTcoProjection({
  purchasePriceUsd,
  odometerMiles,
  annualDistanceMiles,
  mpgUs,
  isEv = false,
  powertrainType,
  vehicle,
  fuelPriceUsdGal,
  annualInsuranceUsd,
  baseAnnualMaintenanceUsd = 800,
  maintenanceWearFactor = 1.0,
  downPaymentPct = 20,
  aprPct = 6.2,
  loanTermMonths = 60,
  horizonYears = 5,
  residualCurve10Yr = [0.81, 0.69, 0.59, 0.50, 0.43, 0.37, 0.31, 0.27, 0.23, 0.20],
  homeChargePct = 80,
  homeTariffUsdPerKwh,
  dcFastTariffUsdPerKwh,
  electricSharePct = 65,
  phevKwhPer100Mi,
  phevIceMpg,
}) {
  const price = Math.max(500, Number(purchasePriceUsd) > 0 ? Number(purchasePriceUsd) : 30000);
  const startOdo = Math.max(0, Number(odometerMiles) >= 0 ? Number(odometerMiles) : 0);
  const annualMi = Math.max(0, Number(annualDistanceMiles) >= 0 ? Number(annualDistanceMiles) : 12000);
  const eff = Math.max(1, Number(mpgUs) > 0 ? Number(mpgUs) : 30);
  const pType = resolvePowertrainType(powertrainType || vehicle || (isEv ? 'EV' : 'ICE_PETROL'));
  const isPureEv = isPureElectric(pType);

  const defaultEnergyPrice = isPureEv ? 0.16 : 3.65;
  const unitEnergyPrice = (fuelPriceUsdGal !== undefined && fuelPriceUsdGal !== null && fuelPriceUsdGal !== '' && !isNaN(Number(fuelPriceUsdGal)))
    ? Math.max(0, Number(fuelPriceUsdGal))
    : defaultEnergyPrice;
  const insurancePerYr = (annualInsuranceUsd !== undefined && annualInsuranceUsd !== null && annualInsuranceUsd !== '' && !isNaN(Number(annualInsuranceUsd)))
    ? Math.max(0, Number(annualInsuranceUsd))
    : 1400;
  const years = Math.min(10, Math.max(1, Math.round(Number(horizonYears) || 5)));

  // Financing amortization math
  const dpPct = (downPaymentPct !== undefined && downPaymentPct !== null && downPaymentPct !== '' && !isNaN(Number(downPaymentPct)))
    ? Math.min(100, Math.max(0, Number(downPaymentPct)))
    : 20;
  const dpFraction = dpPct / 100;
  const downPaymentUsd = price * dpFraction;
  const principalUsd = Math.max(0, price - downPaymentUsd);
  const termMos = Math.max(0, Math.round(Number(loanTermMonths) >= 0 ? Number(loanTermMonths) : 60));
  const apr = (aprPct !== undefined && aprPct !== null && aprPct !== '' && !isNaN(Number(aprPct)))
    ? Math.max(0, Number(aprPct))
    : 6.2;
  const annualRate = apr / 100;
  const monthlyRate = annualRate / 12;

  let monthlyLoanPaymentUsd = 0;
  if (principalUsd > 0 && termMos > 0) {
    if (monthlyRate === 0) {
      monthlyLoanPaymentUsd = principalUsd / termMos;
    } else {
      const factor = Math.pow(1 + monthlyRate, termMos);
      monthlyLoanPaymentUsd = (principalUsd * (monthlyRate * factor)) / (factor - 1);
    }
  }

  // Powertrain-Specific Energy / Fuel Models
  let annualFuelCostUsd = 0;
  if (isPureEv) {
    // EV: blended charging cost using Home AC vs DC Fast Charging tariff split
    const homeFrac = Math.min(100, Math.max(0, Number(homeChargePct ?? 80))) / 100;
    const dcFrac = 1 - homeFrac;
    const defaultEvHomeTariff = (fuelPriceUsdGal !== undefined && fuelPriceUsdGal !== null && fuelPriceUsdGal !== '' && !isNaN(Number(fuelPriceUsdGal)) && Number(fuelPriceUsdGal) <= 1.0)
      ? Math.max(0, Number(fuelPriceUsdGal))
      : 0.16;
    const homeTariff = (homeTariffUsdPerKwh !== undefined && homeTariffUsdPerKwh !== null && homeTariffUsdPerKwh !== '' && !isNaN(Number(homeTariffUsdPerKwh)))
      ? Math.max(0, Number(homeTariffUsdPerKwh))
      : defaultEvHomeTariff;
    const dcTariff = (dcFastTariffUsdPerKwh !== undefined && dcFastTariffUsdPerKwh !== null && dcFastTariffUsdPerKwh !== '' && !isNaN(Number(dcFastTariffUsdPerKwh)))
      ? Math.max(0, Number(dcFastTariffUsdPerKwh))
      : (homeTariff > 0 ? +(homeTariff * 2.5).toFixed(3) : 0);
    const effectiveTariff = homeFrac * homeTariff + dcFrac * dcTariff;
    // eff is kWh / 100 miles
    annualFuelCostUsd = annualMi > 0 ? (annualMi / 100) * eff * effectiveTariff : 0;
  } else if (pType === POWERTRAIN_TYPES.PHEV) {
    // PHEV: combined profile (electric commute share e.g. 65% + gasoline share e.g. 35%)
    const evFrac = Math.min(1, Math.max(0, (Number(electricSharePct ?? 65)) / 100));
    const iceFrac = 1 - evFrac;
    const evEff = Number(phevKwhPer100Mi) > 0 ? Number(phevKwhPer100Mi) : 30.0;
    const iceEfficiency = Number(phevIceMpg) > 0 ? Number(phevIceMpg) : Math.max(5, eff);
    const homeTariff = (homeTariffUsdPerKwh !== undefined && homeTariffUsdPerKwh !== null && !isNaN(Number(homeTariffUsdPerKwh)))
      ? Math.max(0, Number(homeTariffUsdPerKwh))
      : 0.16;
    const gasRate = unitEnergyPrice;

    const electricCost = annualMi > 0 ? (annualMi * evFrac / 100) * evEff * homeTariff : 0;
    const gasCost = annualMi > 0 && iceEfficiency > 0 ? (annualMi * iceFrac / iceEfficiency) * gasRate : 0;
    annualFuelCostUsd = electricCost + gasCost;
  } else {
    // ICE / HEV: calculate fuel consumption based on efficiency and fuel price
    annualFuelCostUsd = annualMi > 0 && eff > 0 ? (annualMi / eff) * unitEnergyPrice : 0;
  }

  const yearlySchedule = [];
  let cumulativeFuelUsd = 0;
  let cumulativeInsuranceUsd = 0;
  let cumulativeMaintenanceUsd = 0;
  let cumulativeInterestUsd = 0;
  let cumulativePrincipalPaidUsd = 0;
  let remainingLoanBalanceUsd = principalUsd;
  let prevResidualValueUsd = price;

  for (let yr = 1; yr <= years; yr++) {
    const endOfYearOdo = startOdo + annualMi * yr;

    // Non-linear depreciation calculation
    const depResult = calculateNonLinearDepreciation({
      purchasePriceUsd: price,
      odometerMiles: startOdo,
      annualDistanceMiles: annualMi,
      ownershipYear: yr,
      powertrainType: pType,
      residualCurve10Yr,
    });
    // Monotonicity invariant: vehicle asset must never appreciate in value
    const residualValueUsd = Math.min(depResult.residualValueUsd, prevResidualValueUsd);
    const yearDepreciationUsd = Math.max(0, prevResidualValueUsd - residualValueUsd);
    const cumulativeDepreciationUsd = price - residualValueUsd;
    prevResidualValueUsd = residualValueUsd;

    let yearInterestUsd = 0;
    let yearPrincipalUsd = 0;
    const startMonth = (yr - 1) * 12 + 1;
    const endMonth = yr * 12;

    for (let m = startMonth; m <= endMonth; m++) {
      if (m <= termMos && remainingLoanBalanceUsd > 0.01) {
        const interestForMonth = remainingLoanBalanceUsd * monthlyRate;
        const principalForMonth = Math.min(
          remainingLoanBalanceUsd,
          monthlyLoanPaymentUsd - interestForMonth
        );
        yearInterestUsd += interestForMonth;
        yearPrincipalUsd += principalForMonth;
        remainingLoanBalanceUsd = Math.max(0, remainingLoanBalanceUsd - principalForMonth);
      }
    }

    // Dynamic wear escalation with revision thresholds
    const maintResult = calculateDynamicMaintenance({
      baseAnnualMaintenanceUsd,
      odometerMiles: startOdo,
      annualDistanceMiles: annualMi,
      powertrainType: pType,
      maintenanceWearFactor,
      ownershipYear: yr,
    });
    const yearMaintenanceUsd = maintResult.yearMaintenanceUsd;

    const yearFuelUsd = annualFuelCostUsd;
    const yearInsuranceUsd = insurancePerYr * Math.pow(0.985, yr - 1);

    cumulativeFuelUsd += yearFuelUsd;
    cumulativeInsuranceUsd += yearInsuranceUsd;
    cumulativeMaintenanceUsd += yearMaintenanceUsd;
    cumulativeInterestUsd += yearInterestUsd;
    cumulativePrincipalPaidUsd += yearPrincipalUsd;

    const yearTotalCarryingCostUsd =
      cumulativeDepreciationUsd +
      cumulativeFuelUsd +
      cumulativeInsuranceUsd +
      cumulativeMaintenanceUsd +
      cumulativeInterestUsd;

    yearlySchedule.push({
      year: yr,
      odometerMiles: Math.round(endOfYearOdo),
      residualValueUsd,
      retentionPct: +(Math.max(5.0, (residualValueUsd / price) * 100)).toFixed(1),
      yearDepreciationUsd,
      cumulativeDepreciationUsd,
      yearFuelUsd: Math.round(yearFuelUsd),
      yearInsuranceUsd: Math.round(yearInsuranceUsd),
      yearMaintenanceUsd: Math.round(yearMaintenanceUsd),
      yearInterestUsd: Math.round(yearInterestUsd),
      cumulativeInterestUsd: Math.round(cumulativeInterestUsd),
      remainingLoanBalanceUsd: Math.round(remainingLoanBalanceUsd),
      cumulativeTotalCostUsd: Math.round(yearTotalCarryingCostUsd),
    });
  }

  const finalSchedule = yearlySchedule[years - 1];
  const totalDepreciationUsd = finalSchedule.cumulativeDepreciationUsd;
  const totalEconomicCostUsd = Math.round(
    totalDepreciationUsd +
      cumulativeFuelUsd +
      cumulativeInsuranceUsd +
      cumulativeMaintenanceUsd +
      cumulativeInterestUsd
  );

  const totalCashOutflowUsd = Math.round(
    downPaymentUsd +
      cumulativePrincipalPaidUsd +
      cumulativeInterestUsd +
      cumulativeFuelUsd +
      cumulativeInsuranceUsd +
      cumulativeMaintenanceUsd
  );

  const totalDistanceMiles = annualMi * years;
  const costPerMileUsd = totalDistanceMiles > 0 ? +(totalEconomicCostUsd / totalDistanceMiles).toFixed(3) : 0;
  const monthlyEconomicCostUsd = Math.round(totalEconomicCostUsd / (years * 12));

  // Stitch stacked bar segment palette: Depreciation #0F5BFF, Fuel #5B8CFF, Insurance #12A150, Maintenance #F2B705, Financing #98A2B3
  const breakdownRaw = [
    {
      id: 'depreciation',
      label: 'Depreciation',
      amountUsd: totalDepreciationUsd,
      color: '#0F5BFF',
    },
    {
      id: 'fuel',
      label: isPureEv ? 'Electricity Charging' : (pType === POWERTRAIN_TYPES.PHEV ? 'Electricity & Fuel' : 'Fuel / Energy'),
      amountUsd: Math.round(cumulativeFuelUsd),
      color: '#5B8CFF',
    },
    {
      id: 'insurance',
      label: 'Insurance',
      amountUsd: Math.round(cumulativeInsuranceUsd),
      color: '#12A150',
    },
    {
      id: 'maintenance',
      label: 'Maintenance & Repairs',
      amountUsd: Math.round(cumulativeMaintenanceUsd),
      color: '#F2B705',
    },
    {
      id: 'interest',
      label: 'Financing Interest',
      amountUsd: Math.round(cumulativeInterestUsd),
      color: '#98A2B3',
    },
  ];

  const breakdownSum = breakdownRaw.reduce((acc, b) => acc + b.amountUsd, 0) || 1;
  const breakdown = breakdownRaw.map((b) => ({
    ...b,
    sharePct: +((b.amountUsd / breakdownSum) * 100).toFixed(1),
    perMileUsd: totalDistanceMiles > 0 ? b.amountUsd / totalDistanceMiles : 0,
  }));

  return {
    totalEconomicCostUsd,
    totalCashOutflowUsd,
    costPerMileUsd,
    monthlyEconomicCostUsd,
    totalDepreciationUsd,
    finalResidualValueUsd: finalSchedule.residualValueUsd,
    finalRetentionPct: finalSchedule.retentionPct,
    totalFuelUsd: Math.round(cumulativeFuelUsd),
    totalInsuranceUsd: Math.round(cumulativeInsuranceUsd),
    totalMaintenanceUsd: Math.round(cumulativeMaintenanceUsd),
    totalInterestUsd: Math.round(cumulativeInterestUsd),
    monthlyLoanPaymentUsd: Math.round(monthlyLoanPaymentUsd),
    totalDistanceMiles,
    breakdown,
    yearlySchedule,
  };
}

// ============================================================================
// MAINTENANCE MILESTONES (POWERTRAIN-BRANCHED SCHEDULES)
// ============================================================================

export const ICE_MILESTONES = [
  {
    miles: 15000,
    title: '15,000 mi / 1-Year Minor Inspection',
    costRangeUsd: [120, 260],
    category: 'Routine Prevention',
    items: [
      { id: '15k-oil', name: 'Engine oil & OEM spec filter change', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      { id: '15k-tires', name: 'Tire rotation & tread depth balance check', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      { id: '15k-brakes', name: 'Brake pad lining & rotor thickness visual inspection', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      { id: '15k-fluids', name: 'Top-off washer, coolant, and brake fluid reservoirs', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
    ],
  },
  {
    miles: 30000,
    title: '30,000 mi / 2-Year Intermediate Service',
    costRangeUsd: [280, 550],
    category: 'Hydraulics & Filtration',
    items: [
      { id: '30k-brake-fluid', name: 'Brake fluid full hydraulic flush (DOT 4 / 5.1)', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      { id: '30k-air-filters', name: 'Engine intake air filter & activated charcoal cabin filter', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      { id: '30k-battery', name: '12V AGM auxiliary battery conductance test', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      { id: '30k-suspension', name: 'Suspension ball joints, tie rod ends & CV boot inspection', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
    ],
  },
  {
    miles: 60000,
    title: '60,000 mi / 4-Year Major Service',
    costRangeUsd: [550, 1100],
    category: 'Powertrain Major Check',
    items: [
      { id: '60k-plugs', name: 'Iridium spark plugs (petrol) or fuel filter cartridge (diesel)', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      {
        id: '60k-transmission',
        name: 'Automatic / DSG transmission fluid & filter drain and fill',
        omittedByOem: true,
        oemOmissionReason: 'Omitted by OEM as "Lifetime Fluid / Sealed for Life" despite ZF 50k–60k mi mandate',
        applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'],
      },
      { id: '60k-coolant', name: 'Engine coolant hydrometer acidity test & pH check', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      { id: '60k-belts', name: 'Serpentine auxiliary drive belt & tensioner pulley check', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
    ],
  },
  {
    miles: 90000,
    title: '90,000 mi / 6-Year Critical Milestone',
    costRangeUsd: [850, 1850],
    category: 'Critical Engine Hardware',
    items: [
      {
        id: '90k-timing',
        name: 'Timing belt kit & water pump replacement (or chain stretch test)',
        omittedByOem: true,
        oemOmissionReason: 'Deferred by OEM to 150,000 mi or uninspected "lifetime" chain',
        applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'],
      },
      {
        id: '90k-differential',
        name: 'Front & rear differential / transfer case gear oil renewal',
        omittedByOem: true,
        oemOmissionReason: 'Unscheduled item; dealer manuals treat differentials as maintenance-free fill',
        applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'],
      },
      { id: '90k-cooling-hoses', name: 'Radiator hoses, thermostat housing & heater core inspection', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      { id: '90k-rotors', name: 'Complete brake disc rotor replacement and caliper slide lubrication', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
    ],
  },
  {
    miles: 120000,
    title: '120,000 mi / 8-Year Longevity Refresh',
    costRangeUsd: [650, 1500],
    category: 'Emissions & Sensors',
    items: [
      { id: '120k-o2', name: 'Upstream broadband Oxygen (Lambda) sensor replacement', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
      {
        id: '120k-dpf',
        name: 'DPF soot load ash measurement / chemical regeneration check',
        omittedByOem: true,
        oemOmissionReason: 'Omitted by OEM; dealers replace DPF only after permanent blockage lock',
        applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL'],
      },
      {
        id: '120k-pcv',
        name: 'PCV valve / oil separator diaphragm refresh',
        omittedByOem: true,
        oemOmissionReason: 'Unscheduled item; dealers replace only after rear main seal rupture or lean code P0171',
        applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'],
      },
      { id: '120k-shocks', name: 'Dampers & strut top mounts rebound and leakage inspection', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
    ],
  },
  {
    miles: 150000,
    title: '150,000 mi / 10-Year High-Mileage Overhaul',
    costRangeUsd: [1100, 2400],
    category: 'Deep System Refresh',
    items: [
      {
        id: '150k-trans-flush',
        name: 'Complete transmission torque converter fluid exchange',
        omittedByOem: true,
        oemOmissionReason: 'Never scheduled in OEM service logs due to sealed gearbox marketing',
        applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'],
      },
      {
        id: '150k-carbon',
        name: 'Direct-injection intake valve walnut shell carbon decoke',
        omittedByOem: true,
        oemOmissionReason: 'Omitted from all factory service schedules; causes P0300 misfires',
        applicablePowertrains: ['ICE_PETROL', 'HEV', 'PHEV'],
      },
      {
        id: '150k-fuel-pump',
        name: 'High-pressure fuel pump (HPFP) follower & seal renewal',
        omittedByOem: true,
        oemOmissionReason: 'Unscheduled run-to-failure component in dealer checklists',
        applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL'],
      },
      { id: '150k-chassis', name: 'Subframe bushings & motor mounts vibration damping test', applicablePowertrains: ['ICE_PETROL', 'ICE_DIESEL', 'HEV', 'PHEV'] },
    ],
  },
];

export const EV_MILESTONES = [
  {
    miles: 15000,
    title: '15,000 mi / 1-Year Minor Inspection',
    costRangeUsd: [80, 190],
    category: 'EV Routine Prevention',
    items: [
      { id: '15k-ev-tires', name: 'EV tire rotation, alignment check & inside shoulder wear inspection', applicablePowertrains: ['EV'] },
      { id: '15k-ev-brakes', name: 'Brake pad slide pin inspection & friction sweep test', applicablePowertrains: ['EV'] },
      { id: '15k-ev-fluids', name: 'Top-off washer fluid, reservoir caps & low-temp battery cooling level', applicablePowertrains: ['EV'] },
      { id: '15k-ev-wipers', name: 'Wiper blades, safety interlock sensors & camera lens cleaning', applicablePowertrains: ['EV'] },
    ],
  },
  {
    miles: 30000,
    title: '30,000 mi / 2-Year Intermediate Service',
    costRangeUsd: [190, 420],
    category: 'Hydraulics, Cabin & Braking',
    items: [
      { id: '30k-ev-brake-fluid', name: 'Brake fluid full hydraulic flush (DOT 4 LV / 5.1)', applicablePowertrains: ['EV'] },
      { id: '30k-ev-cabin-filter', name: 'Cabin HEPA & activated charcoal microfilter replacement', applicablePowertrains: ['EV'] },
      { id: '30k-ev-battery', name: '12V AGM auxiliary battery conductance & state-of-health test', applicablePowertrains: ['EV'] },
      { id: '30k-ev-suspension', name: 'Suspension ball joints, high-mass hydro-bushings & CV boots inspection', applicablePowertrains: ['EV'] },
    ],
  },
  {
    miles: 60000,
    title: '60,000 mi / 4-Year Major Service',
    costRangeUsd: [320, 750],
    category: 'EV Powertrain & Reducer Service',
    items: [
      {
        id: '60k-ev-reduction-oil',
        name: 'Single-speed EV reduction gearbox fluid renewal & magnetic plug cleaning',
        omittedByOem: true,
        oemOmissionReason: 'Omitted by OEM as "sealed for life" despite high instant-torque gear shear',
        applicablePowertrains: ['EV'],
      },
      { id: '60k-ev-coolant', name: 'Traction battery thermal loop dielectric coolant hydrometer & pH acidity test', applicablePowertrains: ['EV'] },
      {
        id: '60k-ev-rotor-rust',
        name: 'Regenerative brake rotor de-glazing, rust removal & caliper slider service',
        omittedByOem: true,
        oemOmissionReason: 'Omitted by OEM; regenerative braking leaves friction discs prone to severe rust pitting',
        applicablePowertrains: ['EV'],
      },
      { id: '60k-ev-chassis-harness', name: 'High-voltage orange cable shielding, ground straps & port latch inspection', applicablePowertrains: ['EV'] },
    ],
  },
  {
    miles: 90000,
    title: '90,000 mi / 6-Year Critical Milestone',
    costRangeUsd: [450, 1100],
    category: 'Battery Degradation & Power Electronics',
    items: [
      { id: '90k-ev-soh', name: 'High-voltage battery capacity SoH % diagnostic scan & cell delta-V balance', applicablePowertrains: ['EV'] },
      {
        id: '90k-ev-obc-iccu',
        name: 'On-Board Charger (OBC / ICCU) thermal scan & AC/DC power electronics check',
        omittedByOem: true,
        oemOmissionReason: 'Unscheduled item; dealers replace ICCU only after complete charging breakdown',
        applicablePowertrains: ['EV'],
      },
      { id: '90k-ev-valve-actuator', name: 'Heat pump multi-way coolant switching valve (Octovalve) actuator response test', applicablePowertrains: ['EV'] },
      { id: '90k-ev-rotors', name: 'Brake disc rotor thickness verification, pad replacement & hardware renewal', applicablePowertrains: ['EV'] },
    ],
  },
  {
    miles: 120000,
    title: '120,000 mi / 8-Year Longevity Refresh',
    costRangeUsd: [550, 1350],
    category: 'Electrified Thermal & Chassis Refresh',
    items: [
      {
        id: '120k-ev-chiller-flush',
        name: 'High-voltage chiller loop & Octovalve dielectric coolant flush and vacuum refill',
        omittedByOem: true,
        oemOmissionReason: 'Omitted by OEM as "lifetime coolant", leading to valve motor sticking',
        applicablePowertrains: ['EV'],
      },
      { id: '120k-ev-subframe-mounts', name: 'Heavy curb-weight front/rear subframe hydro-bushings & motor mount test', applicablePowertrains: ['EV'] },
      { id: '120k-ev-shocks', name: 'Suspension dampers & strut top-mount rebound and leakage inspection', applicablePowertrains: ['EV'] },
      { id: '120k-ev-wheel-bearings', name: 'Front & rear heavy-axle wheel bearings play and acoustic telemetry check', applicablePowertrains: ['EV'] },
    ],
  },
  {
    miles: 150000,
    title: '150,000 mi / 10-Year High-Mileage Overhaul',
    costRangeUsd: [850, 1950],
    category: 'Deep Electrified System Overhaul',
    items: [
      {
        id: '150k-ev-power-electronics',
        name: 'Inverter DC-DC converter & high-voltage capacitor thermal degradation evaluation',
        omittedByOem: true,
        oemOmissionReason: 'Unscheduled in factory service schedules; causes loss of drive',
        applicablePowertrains: ['EV'],
      },
      { id: '150k-ev-drive-unit-seals', name: 'Drive unit input/output axle shaft oil seals & CV boot replacement', applicablePowertrains: ['EV'] },
      { id: '150k-ev-pack-integrity', name: 'Deep battery pack enclosure pressure test, breather valve & cell telemetry scan', applicablePowertrains: ['EV'] },
      { id: '150k-ev-chassis-refresh', name: 'Complete multi-link control arm hydro-bushing & ball joint assembly renewal', applicablePowertrains: ['EV'] },
    ],
  },
];

export const STANDARD_MILESTONES = ICE_MILESTONES;
STANDARD_MILESTONES.forPowertrain = (pt) => getMilestonesForPowertrain(pt);
STANDARD_MILESTONES.getEvMilestones = () => EV_MILESTONES;
STANDARD_MILESTONES.getIceMilestones = () => ICE_MILESTONES;

export function getMilestonesForPowertrain(powertrainOrVehicle) {
  const pType = resolvePowertrainType(powertrainOrVehicle);
  if (isPureElectric(pType)) {
    return EV_MILESTONES;
  }
  return ICE_MILESTONES;
}

export function filterMilestonesByPowertrain(milestones, powertrainType) {
  if (isPureElectric(powertrainType)) {
    return EV_MILESTONES;
  }
  return milestones || ICE_MILESTONES;
}

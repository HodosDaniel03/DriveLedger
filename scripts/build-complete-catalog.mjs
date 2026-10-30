// scripts/build-complete-catalog.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

import { RAW_CATALOG } from './generate-catalog-full.mjs';
import { VEHICLE_PRESETS as EXISTING_PRESETS } from '../src/data/vehiclePresets.js';
import { OBD_CODES } from '../src/data/obdCodes.js';

const VALID_OBD = new Set(OBD_CODES.map((c) => c.code));

const CURVE_STD_DIESEL = [0.81, 0.69, 0.59, 0.50, 0.43, 0.37, 0.31, 0.27, 0.23, 0.20];
const CURVE_STD_PETROL = [0.80, 0.68, 0.58, 0.49, 0.42, 0.36, 0.30, 0.26, 0.22, 0.19];
const CURVE_STD_HYBRID = [0.84, 0.74, 0.65, 0.57, 0.50, 0.44, 0.39, 0.34, 0.30, 0.26];
const CURVE_STD_EV = [0.78, 0.64, 0.53, 0.44, 0.37, 0.31, 0.26, 0.22, 0.19, 0.16];
const CURVE_PREMIUM = [0.83, 0.72, 0.63, 0.54, 0.47, 0.41, 0.36, 0.31, 0.27, 0.23];

// Helper to find brand
function getBrand(brandId) {
  const b = RAW_CATALOG.find((x) => x.id === brandId);
  if (!b) throw new Error(`Brand ${brandId} not found`);
  return b;
}

// Additional models to inject
const ADDITIONAL_MODELS = [
  // Volkswagen
  {
    brandId: 'volkswagen',
    model: {
      id: 'vw-touareg',
      name: 'Touareg',
      generations: '7L / 7P / CR (2002-2024)',
      bodyType: 'suv',
      engines: [
        {
          id: 'vw-touareg-30-v6-tdi',
          name: 'Volkswagen Touareg III 3.0 V6 TDI 4Motion (286 HP)',
          shortName: 'VW Touareg 3.0 V6 TDI',
          brand: 'Volkswagen',
          modelName: 'Touareg',
          generation: 'CR (2018-2024)',
          engineCode: 'EA897evo2 3.0 V6 TDI',
          powerHp: 286,
          fuelType: 'Diesel',
          year: 2021,
          bodyType: 'suv',
          segment: 'Luxury Flagship SUV',
          powertrain: 'diesel',
          powertrainLabel: '3.0L V6 Turbo Diesel SCR AdBlue Torsen 4Motion',
          transmission: 'torque-converter',
          transmissionLabel: '8-Speed ZF Tiptronic Automatic',
          purchasePriceUsd: 54900,
          defaultOdometerMiles: 46000,
          annualDistanceMiles: 14000,
          mpgUs: 32.0,
          isEv: false,
          defaultFuelPriceUsdGal: 4.10,
          annualInsuranceUsd: 1850,
          baseAnnualMaintenanceUsd: 1350,
          maintenanceWearFactor: 1.28,
          rating: 4.8,
          criticalDefectTag: '⚠️ AIR SUSPENSION VALVE BLOCK & CAM DRIVE',
          residualCurve10Yr: CURVE_PREMIUM,
          knownRiskNotes: 'Air suspension solenoid valve block moisture corrosion causing corner drop; AdBlue injector crusting; rear multi-link suspension bushing wear under towing.',
          commonObdCodes: ['P20EE', 'P2002', 'P0128', 'P0087'],
        },
      ],
    },
  },
  {
    brandId: 'volkswagen',
    model: {
      id: 'vw-touran',
      name: 'Touran',
      generations: '1T / 5T (2003-2024)',
      bodyType: 'wagon',
      engines: [
        {
          id: 'vw-touran-20-tdi',
          name: 'Volkswagen Touran 2.0 TDI Family (150 HP)',
          shortName: 'VW Touran 2.0 TDI',
          brand: 'Volkswagen',
          modelName: 'Touran',
          generation: '5T (2015-2024)',
          engineCode: 'EA288 2.0 TDI SCR',
          powerHp: 150,
          fuelType: 'Diesel',
          year: 2019,
          bodyType: 'wagon',
          segment: '7-Seat Family MPV',
          powertrain: 'diesel',
          powertrainLabel: '2.0L TDI Common-Rail SCR/AdBlue',
          transmission: 'dct-dsg',
          transmissionLabel: '7-Speed DSG Wet-Clutch (DQ381)',
          purchasePriceUsd: 21500,
          defaultOdometerMiles: 68000,
          annualDistanceMiles: 13500,
          mpgUs: 46.0,
          isEv: false,
          defaultFuelPriceUsdGal: 4.10,
          annualInsuranceUsd: 1080,
          baseAnnualMaintenanceUsd: 820,
          maintenanceWearFactor: 1.15,
          rating: 4.7,
          criticalDefectTag: '⚠️ WATER PUMP SLIDE SLEEVE OVERHEAT',
          residualCurve10Yr: CURVE_STD_DIESEL,
          knownRiskNotes: 'Vacuum-actuated water pump slide collar sticks closed leading to quick overheating; DPF differential pressure sensor failure.',
          commonObdCodes: ['P0128', 'P2002', 'P0299', 'P2463'],
        },
      ],
    },
  },
  {
    brandId: 'volkswagen',
    model: {
      id: 'vw-t-roc',
      name: 'T-Roc',
      generations: 'A1 (2017-2024)',
      bodyType: 'suv',
      engines: [
        {
          id: 'vw-t-roc-15-tsi-dsg',
          name: 'Volkswagen T-Roc 1.5 TSI evo Design DSG (150 HP)',
          shortName: 'VW T-Roc 1.5 TSI',
          brand: 'Volkswagen',
          modelName: 'T-Roc',
          generation: 'A1 (2017-2024)',
          engineCode: 'EA211 evo 1.5 TSI ACT',
          powerHp: 150,
          fuelType: 'Gasoline',
          year: 2021,
          bodyType: 'suv',
          segment: 'Urban Lifestyle Crossover',
          powertrain: 'gasoline-turbo',
          powertrainLabel: '1.5L Turbo Gasoline ACT Cylinder Cutoff',
          transmission: 'dct-dsg',
          transmissionLabel: '7-Speed DSG Dry-Clutch (DQ200)',
          purchasePriceUsd: 23900,
          defaultOdometerMiles: 34000,
          annualDistanceMiles: 11000,
          mpgUs: 41.0,
          isEv: false,
          defaultFuelPriceUsdGal: 3.90,
          annualInsuranceUsd: 1040,
          baseAnnualMaintenanceUsd: 740,
          maintenanceWearFactor: 1.12,
          rating: 4.6,
          criticalDefectTag: '⚠️ DQ200 DRY CLUTCH SHUDDER',
          residualCurve10Yr: CURVE_STD_PETROL,
          knownRiskNotes: 'Kangarooing hesitation in 1st/2nd gear when engine cold; dry dual clutch disc wear in stop-and-go driving; thermostat housing weep.',
          commonObdCodes: ['P0128', 'P0700', 'P0171', 'P0300'],
        },
      ],
    },
  },
  {
    brandId: 'volkswagen',
    model: {
      id: 'vw-arteon',
      name: 'Arteon',
      generations: '3H7 / Shooting Brake (2017-2024)',
      bodyType: 'sedan',
      engines: [
        {
          id: 'vw-arteon-20-tsi-r-line',
          name: 'Volkswagen Arteon 2.0 TSI R-Line DSG (190 HP)',
          shortName: 'VW Arteon 2.0 TSI',
          brand: 'Volkswagen',
          modelName: 'Arteon',
          generation: '3H7 (2017-2024)',
          engineCode: 'EA888 Gen 3B 2.0 TSI B-Cycle',
          powerHp: 190,
          fuelType: 'Gasoline',
          year: 2021,
          bodyType: 'sedan',
          segment: 'Fastback Executive Gran Turismo',
          powertrain: 'gasoline-turbo',
          powertrainLabel: '2.0L Turbocharged Gasoline Budack-Cycle',
          transmission: 'dct-dsg',
          transmissionLabel: '7-Speed DSG Wet-Clutch (DQ381)',
          purchasePriceUsd: 32500,
          defaultOdometerMiles: 39000,
          annualDistanceMiles: 13000,
          mpgUs: 37.0,
          isEv: false,
          defaultFuelPriceUsdGal: 4.10,
          annualInsuranceUsd: 1380,
          baseAnnualMaintenanceUsd: 890,
          maintenanceWearFactor: 1.16,
          rating: 4.7,
          criticalDefectTag: '⚠️ ROTARY SLIDE WATER PUMP LEAK',
          residualCurve10Yr: CURVE_PREMIUM,
          knownRiskNotes: 'Rotary slide coolant thermostat module leaks coolant into engine valley; frameless door window drop regulator icing in sub-zero winter weather.',
          commonObdCodes: ['P0128', 'P0299', 'P0171', 'P0300'],
        },
      ],
    },
  },
  {
    brandId: 'volkswagen',
    model: {
      id: 'vw-id3',
      name: 'ID.3',
      generations: 'Mk1 (2020-2024)',
      bodyType: 'hatchback',
      engines: [
        {
          id: 'vw-id3-pro-58kwh',
          name: 'Volkswagen ID.3 Pro Performance 58kWh (204 HP)',
          shortName: 'VW ID.3 Pro 58kWh EV',
          brand: 'Volkswagen',
          modelName: 'ID.3',
          generation: 'Mk1 (2020-2024)',
          engineCode: 'APP310 Permanent Magnet Synchronous',
          powerHp: 204,
          fuelType: 'Electric',
          year: 2021,
          bodyType: 'hatchback',
          segment: 'All-Electric Compact Hatchback',
          powertrain: 'electric',
          powertrainLabel: 'Rear-Mounted Electric Motor + 58kWh Net Battery',
          transmission: 'direct-drive',
          transmissionLabel: 'Single-Speed Reduction Gear',
          purchasePriceUsd: 27900,
          defaultOdometerMiles: 34000,
          annualDistanceMiles: 11000,
          mpgUs: 108.0,
          isEv: true,
          defaultFuelPriceUsdGal: 0.16,
          annualInsuranceUsd: 1180,
          baseAnnualMaintenanceUsd: 460,
          maintenanceWearFactor: 1.05,
          rating: 4.5,
          criticalDefectTag: '⚠️ 12V BATTERY DRAIN & SOFTWARE 2.X',
          residualCurve10Yr: CURVE_STD_EV,
          knownRiskNotes: 'Software bugs on versions below 3.0 causing black infotainment screens; 12V starter battery discharge; front suspension drop link knocking.',
          commonObdCodes: ['U0100', 'P0A80'],
        },
      ],
    },
  },

  // BMW additions
  {
    brandId: 'bmw',
    model: {
      id: 'bmw-1-series',
      name: '1 Series',
      generations: 'E87 / F20 / F40 (2004-2024)',
      bodyType: 'hatchback',
      engines: [
        {
          id: 'bmw-118i-f20',
          name: 'BMW 118i (F20 LCI) 1.5T B38 (136 HP)',
          shortName: 'BMW 118i F20',
          brand: 'BMW',
          modelName: '1 Series',
          generation: 'F20 LCI (2015-2019)',
          engineCode: 'B38B15 1.5L TwinPower Turbo 3-Cylinder',
          powerHp: 136,
          fuelType: 'Gasoline',
          year: 2018,
          bodyType: 'hatchback',
          segment: 'Rear-Wheel-Drive Compact Hatch',
          powertrain: 'gasoline-turbo',
          powertrainLabel: '1.5L Turbo 3-Cylinder RWD',
          transmission: 'torque-converter',
          transmissionLabel: '8-Speed ZF 8HP Automatic',
          purchasePriceUsd: 16800,
          defaultOdometerMiles: 54000,
          annualDistanceMiles: 11000,
          mpgUs: 42.0,
          isEv: false,
          defaultFuelPriceUsdGal: 3.90,
          annualInsuranceUsd: 1080,
          baseAnnualMaintenanceUsd: 790,
          maintenanceWearFactor: 1.15,
          rating: 4.7,
          criticalDefectTag: '⚠️ COOLANT EXPANSION TANK RETURN HOSE',
          residualCurve10Yr: CURVE_PREMIUM,
          knownRiskNotes: 'Brittle plastic coolant vent line from cylinder head to expansion tank snaps causing sudden coolant loss; oil filter housing plastic gasket leak.',
          commonObdCodes: ['P0128', 'P0171', 'P0299', 'P0300'],
        },
        {
          id: 'bmw-120d-f20',
          name: 'BMW 120d (F20 LCI) 2.0d B47 (190 HP)',
          shortName: 'BMW 120d F20',
          brand: 'BMW',
          modelName: '1 Series',
          generation: 'F20 LCI (2015-2019)',
          engineCode: 'B47D20 2.0L Turbo Diesel',
          powerHp: 190,
          fuelType: 'Diesel',
          year: 2017,
          bodyType: 'hatchback',
          segment: 'Sport Diesel Hot Hatch RWD',
          powertrain: 'diesel',
          powertrainLabel: '2.0L TwinPower Turbo Diesel RWD',
          transmission: 'torque-converter',
          transmissionLabel: '8-Speed ZF 8HP Automatic',
          purchasePriceUsd: 17900,
          defaultOdometerMiles: 72000,
          annualDistanceMiles: 13500,
          mpgUs: 49.0,
          isEv: false,
          defaultFuelPriceUsdGal: 4.10,
          annualInsuranceUsd: 1180,
          baseAnnualMaintenanceUsd: 890,
          maintenanceWearFactor: 1.16,
          rating: 4.8,
          criticalDefectTag: '⚠️ EGR COOLER RECALL (FIRE RISK)',
          residualCurve10Yr: CURVE_PREMIUM,
          knownRiskNotes: 'EGR cooler internal glycol leak; rear differential axle seal weep; DPF soot build-up on short urban runs.',
          commonObdCodes: ['P0401', 'P2002', 'P0128', 'P2463'],
        },
      ],
    },
  },
  {
    brandId: 'bmw',
    model: {
      id: 'bmw-x1',
      name: 'X1',
      generations: 'E84 / F48 / U11 (2009-2024)',
      bodyType: 'suv',
      engines: [
        {
          id: 'bmw-x1-sdrive18d-f48',
          name: 'BMW X1 sDrive18d (F48) 2.0d B47 (150 HP)',
          shortName: 'BMW X1 18d F48',
          brand: 'BMW',
          modelName: 'X1',
          generation: 'F48 (2015-2022)',
          engineCode: 'B47C20 2.0L Turbo Diesel',
          powerHp: 150,
          fuelType: 'Diesel',
          year: 2019,
          bodyType: 'suv',
          segment: 'Compact Premium SAV',
          powertrain: 'diesel',
          powertrainLabel: '2.0L TwinPower Turbo Diesel FWD',
          transmission: 'torque-converter',
          transmissionLabel: '8-Speed Aisin Steptronic Automatic',
          purchasePriceUsd: 22800,
          defaultOdometerMiles: 58000,
          annualDistanceMiles: 13000,
          mpgUs: 47.0,
          isEv: false,
          defaultFuelPriceUsdGal: 4.10,
          annualInsuranceUsd: 1140,
          baseAnnualMaintenanceUsd: 840,
          maintenanceWearFactor: 1.15,
          rating: 4.7,
          criticalDefectTag: '⚠️ UPPER HYDRAULIC ENGINE MOUNT LEAK',
          residualCurve10Yr: CURVE_PREMIUM,
          knownRiskNotes: 'Right top hydraulic engine rubber mount collapses and leaks dark oil; EGR cooler safety recall; Aisin 8-speed fluid service at 60k mi.',
          commonObdCodes: ['P0401', 'P2002', 'P0128', 'P0700'],
        },
      ],
    },
  },
  {
    brandId: 'bmw',
    model: {
      id: 'bmw-x3',
      name: 'X3',
      generations: 'E83 / F25 / G01 / G45 (2003-2024)',
      bodyType: 'suv',
      engines: [
        {
          id: 'bmw-x3-xdrive20d-g01',
          name: 'BMW X3 xDrive20d (G01) 2.0d B47 MHEV (190 HP)',
          shortName: 'BMW X3 xDrive20d',
          brand: 'BMW',
          modelName: 'X3',
          generation: 'G01 (2017-2024)',
          engineCode: 'B47D20 2.0L Turbo Diesel 48V MHEV',
          powerHp: 190,
          fuelType: 'Diesel',
          year: 2021,
          bodyType: 'suv',
          segment: 'Midsize Premium SAV',
          powertrain: 'diesel',
          powertrainLabel: '2.0L TwinPower Turbo Diesel 48V Mild Hybrid AWD',
          transmission: 'torque-converter',
          transmissionLabel: '8-Speed ZF 8HP Automatic',
          purchasePriceUsd: 38900,
          defaultOdometerMiles: 39000,
          annualDistanceMiles: 14000,
          mpgUs: 41.0,
          isEv: false,
          defaultFuelPriceUsdGal: 4.10,
          annualInsuranceUsd: 1460,
          baseAnnualMaintenanceUsd: 1050,
          maintenanceWearFactor: 1.20,
          rating: 4.8,
          criticalDefectTag: '⚠️ REAR DIFF PINION SEAL & EGR COOLER',
          residualCurve10Yr: CURVE_PREMIUM,
          knownRiskNotes: 'EGR cooler recall inspect for glycol smell; rear differential pinion shaft oil seal weeping; active shutter grille motor fault.',
          commonObdCodes: ['P0401', 'P2002', 'P0128', 'P2463'],
        },
      ],
    },
  },

  // Toyota additions
  {
    brandId: 'toyota',
    model: {
      id: 'toyota-auris',
      name: 'Auris',
      generations: 'E150 / E180 (2006-2019)',
      bodyType: 'wagon',
      engines: [
        {
          id: 'toyota-auris-18-hybrid-ts',
          name: 'Toyota Auris Touring Sports 1.8 Hybrid HSD (136 HP)',
          shortName: 'Toyota Auris 1.8 Hybrid',
          brand: 'Toyota',
          modelName: 'Auris',
          generation: 'E180 (2012-2019)',
          engineCode: '2ZR-FXE 1.8L Atkinson HSD',
          powerHp: 136,
          fuelType: 'Hybrid',
          year: 2017,
          bodyType: 'wagon',
          segment: 'EU High-Reliability Family Wagon',
          powertrain: 'hybrid',
          powertrainLabel: '1.8L Atkinson Cycle + Planetary Hybrid Synergy Drive',
          transmission: 'cvt',
          transmissionLabel: 'e-CVT Power-Split Device',
          purchasePriceUsd: 14800,
          defaultOdometerMiles: 82000,
          annualDistanceMiles: 13500,
          mpgUs: 52.0,
          isEv: false,
          defaultFuelPriceUsdGal: 3.90,
          annualInsuranceUsd: 920,
          baseAnnualMaintenanceUsd: 540,
          maintenanceWearFactor: 1.04,
          rating: 4.9,
          criticalDefectTag: '⚠️ EGR COOLER CARBON & INVERTER PUMP',
          residualCurve10Yr: CURVE_STD_HYBRID,
          knownRiskNotes: 'EGR circuit carbon blockage causing engine knocking at low RPM past 90k mi; inverter electric water pump replacement at 120k mi; zero starter/alternator/clutch wear.',
          commonObdCodes: ['P0401', 'P0171', 'P0A80', 'P0128'],
        },
      ],
    },
  },
  {
    brandId: 'toyota',
    model: {
      id: 'toyota-avensis',
      name: 'Avensis',
      generations: 'T25 / T27 (2003-2018)',
      bodyType: 'wagon',
      engines: [
        {
          id: 'toyota-avensis-t27-20-d4d',
          name: 'Toyota Avensis (T27) 2.0 D-4D Executive (126 HP)',
          shortName: 'Toyota Avensis 2.0 D-4D',
          brand: 'Toyota',
          modelName: 'Avensis',
          generation: 'T27 (2009-2015)',
          engineCode: '1AD-FTV 2.0L D-4D Common-Rail',
          powerHp: 126,
          fuelType: 'Diesel',
          year: 2014,
          bodyType: 'wagon',
          segment: 'Durable Fleet Highway Cruiser',
          powertrain: 'diesel',
          powertrainLabel: '2.0L Common-Rail Turbo Diesel D-4D',
          transmission: 'manual',
          transmissionLabel: '6-Speed Manual',
          purchasePriceUsd: 9600,
          defaultOdometerMiles: 132000,
          annualDistanceMiles: 14000,
          mpgUs: 47.0,
          isEv: false,
          defaultFuelPriceUsdGal: 4.10,
          annualInsuranceUsd: 890,
          baseAnnualMaintenanceUsd: 760,
          maintenanceWearFactor: 1.15,
          rating: 4.6,
          criticalDefectTag: '⚠️ HEAD GASKET OIL CONSUMPTION (EARLY 1AD)',
          residualCurve10Yr: CURVE_STD_DIESEL,
          knownRiskNotes: 'Cylinder head gasket failure and piston carbon deposits on pre-2012 1AD engines (revised block in late T27); electric parking brake actuator motor corrosion.',
          commonObdCodes: ['P2002', 'P0401', 'P0128', 'P0087'],
        },
      ],
    },
  },
  {
    brandId: 'toyota',
    model: {
      id: 'toyota-prius',
      name: 'Prius',
      generations: 'Gen 2 / Gen 3 / Gen 4 / Gen 5 (2003-2024)',
      bodyType: 'hatchback',
      engines: [
        {
          id: 'toyota-prius-gen3-18-hybrid',
          name: 'Toyota Prius Gen 3 1.8 Hybrid HSD (136 HP)',
          shortName: 'Toyota Prius 1.8 Hybrid',
          brand: 'Toyota',
          modelName: 'Prius',
          generation: 'Gen 3 (2009-2015)',
          engineCode: '2ZR-FXE 1.8L Atkinson Cycle',
          powerHp: 136,
          fuelType: 'Hybrid',
          year: 2013,
          bodyType: 'hatchback',
          segment: 'Global Benchmark Hybrid Liftback',
          powertrain: 'hybrid',
          powertrainLabel: '1.8L Atkinson + Planetary e-CVT Ni-MH Battery',
          transmission: 'cvt',
          transmissionLabel: 'e-CVT Power-Split Transmission',
          purchasePriceUsd: 10500,
          defaultOdometerMiles: 145000,
          annualDistanceMiles: 15000,
          mpgUs: 50.0,
          isEv: false,
          defaultFuelPriceUsdGal: 3.90,
          annualInsuranceUsd: 880,
          baseAnnualMaintenanceUsd: 510,
          maintenanceWearFactor: 1.04,
          rating: 4.9,
          criticalDefectTag: '⚠️ HEAD GASKET LEAK FROM CLOGGED EGR (AT 130K MI)',
          residualCurve10Yr: CURVE_STD_HYBRID,
          knownRiskNotes: 'Clogged EGR cooler passages lead to excessive cylinder #1 and #2 heat and head gasket leak past 130k mi (clean EGR every 60k mi prevents this entirely); brake booster pump accumulator squeak.',
          commonObdCodes: ['P0401', 'P0171', 'P0A80', 'P0301'],
        },
      ],
    },
  },
  {
    brandId: 'toyota',
    model: {
      id: 'toyota-c-hr',
      name: 'C-HR',
      generations: 'AX10 / AX20 (2016-2024)',
      bodyType: 'suv',
      engines: [
        {
          id: 'toyota-c-hr-18-hybrid',
          name: 'Toyota C-HR 1.8 Hybrid Dynamic (122 HP)',
          shortName: 'Toyota C-HR 1.8 Hybrid',
          brand: 'Toyota',
          modelName: 'C-HR',
          generation: 'AX10 (2016-2023)',
          engineCode: '2ZR-FXE 1.8L Atkinson Hybrid',
          powerHp: 122,
          fuelType: 'Hybrid',
          year: 2020,
          bodyType: 'suv',
          segment: 'Coupé-SUV Hybrid Crossover',
          powertrain: 'hybrid',
          powertrainLabel: '1.8L Atkinson + Hybrid Synergy Drive e-CVT',
          transmission: 'cvt',
          transmissionLabel: 'e-CVT Planetary Power-Split',
          purchasePriceUsd: 22800,
          defaultOdometerMiles: 38000,
          annualDistanceMiles: 11500,
          mpgUs: 51.0,
          isEv: false,
          defaultFuelPriceUsdGal: 3.90,
          annualInsuranceUsd: 990,
          baseAnnualMaintenanceUsd: 550,
          maintenanceWearFactor: 1.04,
          rating: 4.8,
          criticalDefectTag: '⚠️ REAR VISIBILITY & 12V AUXILIARY BATTERY',
          residualCurve10Yr: CURVE_STD_HYBRID,
          knownRiskNotes: 'Extreme reliability; small 12V auxiliary lead-acid battery discharge if vehicle sits unused for weeks; thick rear C-pillar blind spots.',
          commonObdCodes: ['P0A80', 'P0171', 'P0401'],
        },
      ],
    },
  },

  // Ford additions
  {
    brandId: 'ford',
    model: {
      id: 'ford-mondeo',
      name: 'Mondeo',
      generations: 'Mk3 / Mk4 / Mk5 (2000-2022)',
      bodyType: 'wagon',
      engines: [
        {
          id: 'ford-mondeo-mk5-20-tdci',
          name: 'Ford Mondeo Mk5 2.0 TDCi Titanium (150 HP)',
          shortName: 'Ford Mondeo 2.0 TDCi',
          brand: 'Ford',
          modelName: 'Mondeo',
          generation: 'Mk5 (2014-2022)',
          engineCode: 'DW10F 2.0L Duratorq TDCi (PSA)',
          powerHp: 150,
          fuelType: 'Diesel',
          year: 2017,
          bodyType: 'wagon',
          segment: 'EU Midsize Fleet Estate',
          powertrain: 'diesel',
          powertrainLabel: '2.0L Turbo Diesel Common-Rail (DW10)',
          transmission: 'manual',
          transmissionLabel: '6-Speed Manual (MMT6)',
          purchasePriceUsd: 13900,
          defaultOdometerMiles: 92000,
          annualDistanceMiles: 14500,
          mpgUs: 48.0,
          isEv: false,
          defaultFuelPriceUsdGal: 4.10,
          annualInsuranceUsd: 980,
          baseAnnualMaintenanceUsd: 840,
          maintenanceWearFactor: 1.18,
          rating: 4.6,
          criticalDefectTag: '⚠️ DPF VAPORIZER INJECTOR (GLOW PLUG)',
          residualCurve10Yr: CURVE_STD_DIESEL,
          knownRiskNotes: 'Ford exhaust DPF fuel vaporizer glow plug / dosing injector blocks with fuel coke preventing active DPF regeneration; dual-mass flywheel rattling at idle.',
          commonObdCodes: ['P2002', 'P2463', 'P0401', 'P0299'],
        },
      ],
    },
  },
  {
    brandId: 'ford',
    model: {
      id: 'ford-fiesta',
      name: 'Fiesta',
      generations: 'Mk6 / Mk7 / Mk8 (2002-2023)',
      bodyType: 'hatchback',
      engines: [
        {
          id: 'ford-fiesta-10-ecoboost',
          name: 'Ford Fiesta Mk7 1.0 EcoBoost Titanium (100 HP)',
          shortName: 'Ford Fiesta 1.0 EcoBoost',
          brand: 'Ford',
          modelName: 'Fiesta',
          generation: 'Mk7 (2012-2017)',
          engineCode: 'Fox 1.0L EcoBoost Wet Belt',
          powerHp: 100,
          fuelType: 'Gasoline',
          year: 2016,
          bodyType: 'hatchback',
          segment: 'Benchmark European Supermini',
          powertrain: 'gasoline-turbo',
          powertrainLabel: '1.0L Turbo 3-Cylinder Wet Belt (Fox)',
          transmission: 'manual',
          transmissionLabel: '5-Speed Manual (IB5)',
          purchasePriceUsd: 8400,
          defaultOdometerMiles: 65000,
          annualDistanceMiles: 9500,
          mpgUs: 46.0,
          isEv: false,
          defaultFuelPriceUsdGal: 3.90,
          annualInsuranceUsd: 780,
          baseAnnualMaintenanceUsd: 740,
          maintenanceWearFactor: 1.25,
          rating: 4.3,
          criticalDefectTag: '⚠️ WET TIMING BELT DEGRADATION & DEGASSING HOSE',
          residualCurve10Yr: CURVE_STD_PETROL,
          knownRiskNotes: 'Wet timing belt delaminates if wrong engine oil (non-WSS-M2C948-B) is used, clogging oil pickup and seizing engine; degas bottle plastic coolant pipe snaps.',
          commonObdCodes: ['P0016', 'P0128', 'P0171', 'P0299'],
        },
      ],
    },
  },
  {
    brandId: 'ford',
    model: {
      id: 'ford-transit-custom',
      name: 'Transit Custom',
      generations: 'Gen 1 / Gen 2 (2012-2024)',
      bodyType: 'wagon',
      engines: [
        {
          id: 'ford-transit-custom-20-ecoblue',
          name: 'Ford Transit Custom 2.0 EcoBlue (130 HP)',
          shortName: 'Ford Transit 2.0 EcoBlue',
          brand: 'Ford',
          modelName: 'Transit Custom',
          generation: 'Gen 1 (2016-2023)',
          engineCode: '2.0L EcoBlue Panther Diesel',
          powerHp: 130,
          fuelType: 'Diesel',
          year: 2020,
          bodyType: 'wagon',
          segment: 'Europe No.1 Commercial Van',
          powertrain: 'diesel',
          powertrainLabel: '2.0L Turbo Diesel Panther AdBlue/SCR',
          transmission: 'manual',
          transmissionLabel: '6-Speed Manual (VMT6)',
          purchasePriceUsd: 24500,
          defaultOdometerMiles: 68000,
          annualDistanceMiles: 18000,
          mpgUs: 36.0,
          isEv: false,
          defaultFuelPriceUsdGal: 4.10,
          annualInsuranceUsd: 1350,
          baseAnnualMaintenanceUsd: 1120,
          maintenanceWearFactor: 1.26,
          rating: 4.6,
          criticalDefectTag: '⚠️ WET OIL PUMP BELT & CONTINENTAL INJECTORS',
          residualCurve10Yr: CURVE_STD_DIESEL,
          knownRiskNotes: 'Wet belt driving oil pump sheds teeth before 100k mi; Continental fuel injectors develop internal electrical short circuits causing sudden misfires under load.',
          commonObdCodes: ['P2002', 'P0087', 'P2463', 'P0301'],
        },
      ],
    },
  },

  // Renault additions
  {
    brandId: 'renault',
    model: {
      id: 'renault-scenic',
      name: 'Scenic',
      generations: 'Gen 3 / Gen 4 (2009-2022)',
      bodyType: 'wagon',
      engines: [
        {
          id: 'renault-scenic-15-dci',
          name: 'Renault Grand Scenic IV 1.5 Blue dCi (120 HP)',
          shortName: 'Renault Scenic 1.5 Blue dCi',
          brand: 'Renault',
          modelName: 'Scenic',
          generation: 'Gen 4 (2016-2022)',
          engineCode: 'K9K 1.5L Blue dCi SCR',
          powerHp: 120,
          fuelType: 'Diesel',
          year: 2019,
          bodyType: 'wagon',
          segment: '7-Seat European Family MPV',
          powertrain: 'diesel',
          powertrainLabel: '1.5L Turbo Diesel Common-Rail AdBlue SCR',
          transmission: 'manual',
          transmissionLabel: '6-Speed Manual',
          purchasePriceUsd: 16500,
          defaultOdometerMiles: 62000,
          annualDistanceMiles: 13000,
          mpgUs: 49.0,
          isEv: false,
          defaultFuelPriceUsdGal: 4.10,
          annualInsuranceUsd: 960,
          baseAnnualMaintenanceUsd: 780,
          maintenanceWearFactor: 1.15,
          rating: 4.6,
          criticalDefectTag: '⚠️ 20-INCH TYRE WEAR & DPF PRESSURE SENSOR',
          residualCurve10Yr: CURVE_STD_DIESEL,
          knownRiskNotes: 'Distinctive tall/skinny 195/55 R20 tyres wear prematurely on front axle; exhaust back-pressure sensor silicone tube splitting; durable K9K bottom end.',
          commonObdCodes: ['P2002', 'P0401', 'P2463', 'P0128'],
        },
      ],
    },
  },
  {
    brandId: 'renault',
    model: {
      id: 'renault-zoe',
      name: 'Zoe',
      generations: 'Gen 1 / Gen 2 (2012-2024)',
      bodyType: 'hatchback',
      engines: [
        {
          id: 'renault-zoe-r135-52kwh',
          name: 'Renault Zoe R135 Z.E. 50 52kWh (135 HP)',
          shortName: 'Renault Zoe R135 EV',
          brand: 'Renault',
          modelName: 'Zoe',
          generation: 'Gen 2 (2019-2024)',
          engineCode: '5AM 100kW Wound Rotor Synchronous',
          powerHp: 135,
          fuelType: 'Electric',
          year: 2021,
          bodyType: 'hatchback',
          segment: 'Pioneer EU Electric City Hatch',
          powertrain: 'electric',
          powertrainLabel: 'Electric Motor + 52kWh Usable Lithium-Ion Battery',
          transmission: 'direct-drive',
          transmissionLabel: 'Single-Speed Reduction Gear',
          purchasePriceUsd: 17200,
          defaultOdometerMiles: 32000,
          annualDistanceMiles: 9500,
          mpgUs: 112.0,
          isEv: true,
          defaultFuelPriceUsdGal: 0.16,
          annualInsuranceUsd: 820,
          baseAnnualMaintenanceUsd: 420,
          maintenanceWearFactor: 1.05,
          rating: 4.6,
          criticalDefectTag: '⚠️ 12V AUXILIARY BATTERY & CHAMELEON CHARGER',
          residualCurve10Yr: CURVE_STD_EV,
          knownRiskNotes: 'Chameleon AC onboard charger sensitive to household earthing/ground resistance over 100 ohms; front suspension wishbone balljoint wear.',
          commonObdCodes: ['P0A80', 'U0100'],
        },
      ],
    },
  },

  // Peugeot additions
  {
    brandId: 'peugeot',
    model: {
      id: 'peugeot-508',
      name: '508',
      generations: 'Gen 1 / Gen 2 (R83) (2010-2024)',
      bodyType: 'sedan',
      engines: [
        {
          id: 'peugeot-508-20-bluehdi',
          name: 'Peugeot 508 II Fastback 2.0 BlueHDi GT-Line (177 HP)',
          shortName: 'Peugeot 508 2.0 BlueHDi',
          brand: 'Peugeot',
          modelName: '508',
          generation: 'Gen 2 (2018-2024)',
          engineCode: 'DW10FC 2.0L BlueHDi',
          powerHp: 177,
          fuelType: 'Diesel',
          year: 2020,
          bodyType: 'sedan',
          segment: 'Design Fastback Executive Sedan',
          powertrain: 'diesel',
          powertrainLabel: '2.0L Turbo Diesel Common-Rail SCR AdBlue',
          transmission: 'torque-converter',
          transmissionLabel: '8-Speed EAT8 Automatic (Aisin)',
          purchasePriceUsd: 22800,
          defaultOdometerMiles: 48000,
          annualDistanceMiles: 13500,
          mpgUs: 47.0,
          isEv: false,
          defaultFuelPriceUsdGal: 4.10,
          annualInsuranceUsd: 1180,
          baseAnnualMaintenanceUsd: 880,
          maintenanceWearFactor: 1.15,
          rating: 4.7,
          criticalDefectTag: '⚠️ ADBLUE UREA TANK TANK MODULE CRUSTING',
          residualCurve10Yr: CURVE_STD_DIESEL,
          knownRiskNotes: 'AdBlue tank integrated pump/heater unit failure requiring full tank replacement; frameless door window motor drop adjustment; rock-solid DW10 mechanicals.',
          commonObdCodes: ['P20EE', 'P2002', 'P0128', 'P0401'],
        },
      ],
    },
  },
];

// Append additional models into RAW_CATALOG
for (const item of ADDITIONAL_MODELS) {
  const brand = getBrand(item.brandId);
  const existingModel = brand.models.find((m) => m.id === item.model.id);
  if (existingModel) {
    for (const eng of item.model.engines) {
      if (!existingModel.engines.some((e) => e.id === eng.id)) {
        existingModel.engines.push(eng);
      }
    }
  } else {
    brand.models.push(item.model);
  }
}

// Validation pass on every engine in RAW_CATALOG
let totalEngines = 0;
const engineIdSet = new Set();

for (const brand of RAW_CATALOG) {
  if (!brand.id || !brand.name || !brand.group || !brand.country) {
    throw new Error(`Invalid brand structure: ${JSON.stringify(brand)}`);
  }
  for (const model of brand.models) {
    if (!model.id || !model.name || !Array.isArray(model.engines)) {
      throw new Error(`Invalid model structure in ${brand.name}: ${JSON.stringify(model)}`);
    }
    for (const eng of model.engines) {
      if (!eng) throw new Error(`Null engine in ${brand.name} -> ${model.name}`);
      if (engineIdSet.has(eng.id)) {
        throw new Error(`Duplicate engine ID: ${eng.id}`);
      }
      engineIdSet.add(eng.id);
      totalEngines++;

      if (!Array.isArray(eng.residualCurve10Yr) || eng.residualCurve10Yr.length !== 10) {
        throw new Error(`Engine ${eng.id} residual curve must have 10 elements`);
      }
      for (let i = 1; i < eng.residualCurve10Yr.length; i++) {
        if (eng.residualCurve10Yr[i] > eng.residualCurve10Yr[i - 1]) {
          throw new Error(`Engine ${eng.id} non-monotonic residual curve`);
        }
      }
      for (const c of eng.commonObdCodes) {
        if (!VALID_OBD.has(c)) {
          throw new Error(`Engine ${eng.id} has invalid OBD code: ${c}`);
        }
      }
    }
  }
}

console.log(`Validated catalog: ${RAW_CATALOG.length} brands, ${totalEngines} unique engines.`);

// Generate vehicleCatalog.js content
const catalogJsContent = `/**
 * ShiftMetric — Comprehensive Automotive Workshop Hierarchy Database
 * Organized hierarchically: Brand (Márka) ➔ Model (Modell) ➔ Engine / Powertrain (Motor)
 * Covering 35 global & European automotive marques with verified engineering telemetry.
 */

export const CATALOG_GROUPS = [
  'All',
  'German',
  'VAG Extended',
  'Japanese',
  'French & Stellantis',
  'Korean',
  'American',
  'Nordic & UK',
];

export const VEHICLE_CATALOG = ${JSON.stringify(RAW_CATALOG, null, 2)};

export function getAllCatalogBrands() {
  return VEHICLE_CATALOG.map((b) => ({
    id: b.id,
    name: b.name,
    group: b.group,
    country: b.country,
    countryFlag: b.countryFlag,
    badge: b.badge,
    modelCount: b.models.length,
    engineCount: b.models.reduce((acc, m) => acc + m.engines.length, 0),
  }));
}

export function getModelsForBrand(brandNameOrId) {
  if (!brandNameOrId || brandNameOrId === 'All Brands') return [];
  const b = VEHICLE_CATALOG.find(
    (x) => x.id.toLowerCase() === brandNameOrId.toLowerCase() || x.name.toLowerCase() === brandNameOrId.toLowerCase()
  );
  return b ? b.models : [];
}

export function getEnginesForModel(brandNameOrId, modelNameOrId) {
  const models = getModelsForBrand(brandNameOrId);
  const m = models.find(
    (x) => x.id.toLowerCase() === modelNameOrId.toLowerCase() || x.name.toLowerCase() === modelNameOrId.toLowerCase()
  );
  return m ? m.engines : [];
}

export function findEngineById(engineId) {
  for (const b of VEHICLE_CATALOG) {
    for (const m of b.models) {
      for (const e of m.engines) {
        if (e.id === engineId) return e;
      }
    }
  }
  return null;
}

export function searchCatalog(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const results = [];
  for (const b of VEHICLE_CATALOG) {
    for (const m of b.models) {
      for (const e of m.engines) {
        const inBrand = b.name.toLowerCase().includes(q);
        const inModel = m.name.toLowerCase().includes(q);
        const inEngine = (e.engineCode || '').toLowerCase().includes(q) || e.name.toLowerCase().includes(q);
        const inDefect = (e.knownRiskNotes || '').toLowerCase().includes(q) || (e.criticalDefectTag || '').toLowerCase().includes(q);
        const inFuel = (e.fuelType || '').toLowerCase().includes(q);
        if (inBrand || inModel || inEngine || inDefect || inFuel) {
          results.push({
            engine: e,
            brand: b,
            model: m,
          });
        }
      }
    }
  }
  return results;
}

export function getAllEnginesFlat() {
  const flat = [];
  for (const b of VEHICLE_CATALOG) {
    for (const m of b.models) {
      for (const e of m.engines) {
        flat.push(e);
      }
    }
  }
  return flat;
}
`;

fs.writeFileSync(path.join(projectRoot, 'src', 'data', 'vehicleCatalog.js'), catalogJsContent, 'utf8');
console.log('Successfully wrote src/data/vehicleCatalog.js!');

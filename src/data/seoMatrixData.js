/**
 * ShiftMetric — Programmatic Vehicle × OBD-II SEO Matrix Engine
 * Connects high-frequency vehicle powertrains with their known factory fault dossiers
 * for deep-linkable long-tail diagnostic telemetry pages.
 */

import { VEHICLE_PRESETS } from './vehiclePresets.js';
import { OBD_CODES, calculateObdWorkshopEstimate } from './obdCodes.js';

const MATRIX_PAIRS = [
  {
    presetId: 'ford-focus-ecoblue',
    code: 'P2002',
    anchorText: 'Ford 2.0 EcoBlue P2002 DPF Efficiency Fix',
  },
  {
    presetId: 'vw-golf-20-tdi',
    code: 'P0299',
    anchorText: 'VW Golf 2.0 TDI P0299 Turbo Underboost Guide',
  },
  {
    presetId: 'bmw-320d-n47',
    code: 'P0016',
    anchorText: 'BMW 320d N47 P0016 Timing Chain Correlation',
  },
  {
    presetId: 'audi-a4-20-tfsi',
    code: 'P0171',
    anchorText: 'Audi A4 2.0 TFSI P0171 Lean PCV Fault Cost',
  },
  {
    presetId: 'toyota-rav4-25-hybrid',
    code: 'P0420',
    anchorText: 'Toyota RAV4 Hybrid P0420 Catalyst Diagnosis',
  },
  {
    presetId: 'peugeot-208-12-puretech',
    code: 'P0016',
    anchorText: 'Peugeot 1.2 PureTech P0016 Wet Belt Warning',
  },
  {
    presetId: 'ford-focus-ecoblue',
    code: 'P2463',
    anchorText: 'Ford Focus 2.0 EcoBlue P2463 DPF Soot Lockout',
  },
  {
    presetId: 'vw-golf-15-tsi',
    code: 'P0700',
    anchorText: 'VW Golf 1.5 TSI DQ200 P0700 Mechatronic Cost',
  },
  {
    presetId: 'bmw-320d-b47',
    code: 'P0401',
    anchorText: 'BMW 320d B47 P0401 EGR Cooler Recall Check',
  },
  {
    presetId: 'ford-f150-ecoboost',
    code: 'P0016',
    anchorText: 'Ford F-150 3.5 EcoBoost P0016 Cam Phaser Fix',
  },
  {
    presetId: 'mercedes-c220d-om654',
    code: 'P20EE',
    anchorText: 'Mercedes C220d OM654 P20EE AdBlue SCR Fault',
  },
  {
    presetId: 'toyota-camry-hybrid',
    code: 'P0A80',
    anchorText: 'Toyota Camry Hybrid P0A80 HV Battery Telemetry',
  },
  {
    presetId: 'peugeot-308-15-bluehdi',
    code: 'P0016',
    anchorText: 'Peugeot 308/3008 1.5 BlueHDi P0016 8mm Chain',
  },
  {
    presetId: 'porsche-macan-20t',
    code: 'P0700',
    anchorText: 'Porsche Macan PDK P0700 Transmission Dossier',
  },
];

export const PROGRAMMATIC_OBD_MATRIX = MATRIX_PAIRS.map((pair) => {
  const preset = VEHICLE_PRESETS.find((p) => p.id === pair.presetId) || VEHICLE_PRESETS[0];
  const dossier = OBD_CODES.find((c) => c.code === pair.code) || OBD_CODES[0];
  const est = calculateObdWorkshopEstimate(dossier, 'independent');

  return {
    id: `${preset.id}-${dossier.code.toLowerCase()}`,
    presetId: preset.id,
    vehicleName: preset.shortName || preset.name,
    fullVehicleName: preset.name,
    engineCode: preset.engineCode,
    code: dossier.code,
    codeTitle: dossier.title,
    path: `/obd/${preset.id}/${dossier.code.toLowerCase()}`,
    queryUrl: `/obd-estimator?tab=obd&preset=${preset.id}&code=${dossier.code}`,
    anchorText: pair.anchorText,
    estimatedCostRange: [est.minTotalUsd, est.maxTotalUsd],
  };
});

/**
 * Resolves full hybrid vehicle × OBD-II diagnostic context for programmatic landing views.
 */
export function getHybridVehicleObdContext(presetId, code) {
  const normalizedCode = String(code || 'P2002').toUpperCase();
  const preset = VEHICLE_PRESETS.find((p) => p.id === presetId) || VEHICLE_PRESETS[0];
  const dossier = OBD_CODES.find((c) => c.code === normalizedCode) || OBD_CODES[0];
  const isKnownWeakPoint = Boolean(preset.commonObdCodes?.includes(dossier.code));
  const hybridTitle = `${preset.name} ${dossier.code} ${dossier.title}: Repair Cost & Live PID Guide`;
  const est = calculateObdWorkshopEstimate(dossier, 'independent');

  return {
    preset,
    dossier,
    title: hybridTitle,
    hybridTitle,
    isKnownWeakPoint,
    isKnownVulnerability: isKnownWeakPoint,
    path: `/obd/${preset.id}/${dossier.code.toLowerCase()}`,
    queryUrl: `/obd-estimator?tab=obd&preset=${preset.id}&code=${dossier.code}`,
    estimatedCostRange: [est.minTotalUsd, est.maxTotalUsd],
  };
}

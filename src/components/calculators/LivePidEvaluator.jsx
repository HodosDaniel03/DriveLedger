import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Sliders, CircleCheck, AlertTriangle, ShieldAlert, RotateCcw } from 'lucide-react';
import { useUnits } from '../../context/UnitContext';
import { Pill } from '../common/OdometerPrimitives';

/**
 * Code-specific interactive OBD-II Live PID definitions with engineering thresholds.
 * P2002 is tailored with DPF Differential Pressure (hPa), Soot Mass Load (%), and Exhaust Gas Temp (°C).
 */
export const CODE_PID_CONFIGS = {
  P2002: [
    {
      id: 'dpf_diff_pressure',
      label: 'DPF Differential Pressure (Idle / Load)',
      shortName: 'DPF Diff Pressure',
      unit: 'hPa',
      min: 0,
      max: 350,
      step: 5,
      defaultValue: 15,
      normalRangeLabel: '5 – 65 hPa',
      warnRangeLabel: '66 – 150 hPa',
      critRangeLabel: '> 150 hPa',
      evaluate: (val) => {
        if (val <= 65) return 'good';
        if (val <= 150) return 'warn';
        return 'risk';
      },
      hint: 'Key-ON Engine-OFF should read 0 hPa. Warm idle: 5–18 hPa; 2,500 RPM load: < 65 hPa.',
    },
    {
      id: 'soot_mass_load',
      label: 'DPF Soot Mass Load (Calculated / Measured)',
      shortName: 'Soot Mass Load',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 28,
      normalRangeLabel: '0 – 45%',
      warnRangeLabel: '46 – 79%',
      critRangeLabel: '≥ 80%',
      evaluate: (val) => {
        if (val <= 45) return 'good';
        if (val < 80) return 'warn';
        return 'risk';
      },
      hint: 'Below 45% is normal passive/active cycling. 46–79% requires forced service regen. ≥80% locks out ECU regen.',
    },
    {
      id: 'exhaust_gas_temp',
      label: 'Exhaust Gas Temp (EGT Pre-DPF B1S1)',
      shortName: 'Exhaust Gas Temp',
      unit: '°C',
      min: 100,
      max: 750,
      step: 10,
      defaultValue: 280,
      normalRangeLabel: '180 – 620 °C',
      warnRangeLabel: '140–179 or 621–680 °C',
      critRangeLabel: '< 140 or > 680 °C',
      evaluate: (val) => {
        if (val >= 180 && val <= 620) return 'good';
        if ((val >= 140 && val < 180) || (val > 620 && val <= 680)) return 'warn';
        return 'risk';
      },
      hint: 'Normal cruise: 220–400 °C; active regen: 550–620 °C. Low EGT (<180 °C) indicates stuck thermostat blocking regen.',
    },
  ],
  P2463: [
    {
      id: 'dpf_diff_pressure',
      label: 'DPF Differential Pressure (Idle / Load)',
      shortName: 'DPF Diff Pressure',
      unit: 'hPa',
      min: 0,
      max: 350,
      step: 5,
      defaultValue: 85,
      normalRangeLabel: '5 – 65 hPa',
      warnRangeLabel: '66 – 150 hPa',
      critRangeLabel: '> 150 hPa',
      evaluate: (val) => (val <= 65 ? 'good' : val <= 150 ? 'warn' : 'risk'),
      hint: 'High backpressure (>150 hPa) confirms physical soot/ash restriction inside DPF channels.',
    },
    {
      id: 'soot_mass_load',
      label: 'DPF Soot Accumulation Load',
      shortName: 'Soot Mass Load',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 62,
      normalRangeLabel: '0 – 45%',
      warnRangeLabel: '46 – 79%',
      critRangeLabel: '≥ 80%',
      evaluate: (val) => (val <= 45 ? 'good' : val < 80 ? 'warn' : 'risk'),
      hint: 'Between 46% and 79% a diagnostic tool forced stationary regeneration can recover the filter.',
    },
    {
      id: 'exhaust_gas_temp',
      label: 'Exhaust Gas Temp (EGT Pre-DPF)',
      shortName: 'Exhaust Gas Temp',
      unit: '°C',
      min: 100,
      max: 750,
      step: 10,
      defaultValue: 310,
      normalRangeLabel: '180 – 620 °C',
      warnRangeLabel: '621 – 680 °C',
      critRangeLabel: '> 680 °C',
      evaluate: (val) => (val >= 180 && val <= 620 ? 'good' : val <= 680 ? 'warn' : 'risk'),
      hint: 'Verify EGT sensor plausibility before initiating stationary regeneration.',
    },
  ],
  P0420: [
    {
      id: 'o2_b1s2_mirror',
      label: 'Downstream O2 (B1S2) Switching Index',
      shortName: 'B1S2 Osc Index',
      unit: '%',
      min: 0,
      max: 100,
      step: 2,
      defaultValue: 18,
      normalRangeLabel: '0 – 25%',
      warnRangeLabel: '26 – 65%',
      critRangeLabel: '> 65%',
      evaluate: (val) => (val <= 25 ? 'good' : val <= 65 ? 'warn' : 'risk'),
      hint: 'Steady B1S2 voltage (~0.70V, <25% oscillation) means catalyst stores oxygen properly; >65% mirrors B1S1 (depleted washcoat).',
    },
    {
      id: 'fuel_trim_ltft',
      label: 'Long-Term Fuel Trim (LTFT Bank 1)',
      shortName: 'LTFT Bank 1',
      unit: '%',
      min: -25,
      max: 25,
      step: 1,
      defaultValue: 3,
      normalRangeLabel: '-6% to +6%',
      warnRangeLabel: '±7% to ±14%',
      critRangeLabel: '> ±14%',
      evaluate: (val) => (Math.abs(val) <= 6 ? 'good' : Math.abs(val) <= 14 ? 'warn' : 'risk'),
      hint: 'Fix fuel trim deviations or exhaust pinhole leaks before condemning the catalytic converter.',
    },
    {
      id: 'cat_substrate_temp',
      label: 'Catalyst Substrate Temperature (B1S1)',
      shortName: 'Catalyst Temp',
      unit: '°C',
      min: 200,
      max: 950,
      step: 10,
      defaultValue: 540,
      normalRangeLabel: '420 – 760 °C',
      warnRangeLabel: '761 – 840 °C',
      critRangeLabel: '> 840 °C',
      evaluate: (val) => (val >= 420 && val <= 760 ? 'good' : val <= 840 ? 'warn' : 'risk'),
      hint: 'Catalyst light-off requires >400 °C. Temps above 840 °C risk sintering/melting the ceramic monolith.',
    },
  ],
  P0299: [
    {
      id: 'boost_pressure_deficit',
      label: 'Commanded vs. Actual MAP Boost Deficit',
      shortName: 'Boost Deficit',
      unit: 'hPa',
      min: 0,
      max: 800,
      step: 10,
      defaultValue: 70,
      normalRangeLabel: '0 – 120 hPa',
      warnRangeLabel: '121 – 340 hPa',
      critRangeLabel: '> 340 hPa',
      evaluate: (val) => (val <= 120 ? 'good' : val <= 340 ? 'warn' : 'risk'),
      hint: 'Under 3rd-gear full load (2,500 RPM), Actual MAP should track Commanded MAP within 120 hPa.',
    },
    {
      id: 'wastegate_pwm_duty',
      label: 'Wastegate / VNT Solenoid Duty Cycle',
      shortName: 'Wastegate Duty',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 58,
      normalRangeLabel: '35 – 75%',
      warnRangeLabel: '76 – 89%',
      critRangeLabel: '≥ 90%',
      evaluate: (val) => (val >= 35 && val <= 75 ? 'good' : val < 90 ? 'warn' : 'risk'),
      hint: 'Maxed-out 90%+ duty with low boost points to a split charge hose, diverter valve, or seized VNT vanes.',
    },
    {
      id: 'intake_air_temp',
      label: 'Charge-Air Temp (IAT Post-Intercooler)',
      shortName: 'Charge Air Temp',
      unit: '°C',
      min: 10,
      max: 110,
      step: 2,
      defaultValue: 38,
      normalRangeLabel: '15 – 55 °C',
      warnRangeLabel: '56 – 75 °C',
      critRangeLabel: '> 75 °C',
      evaluate: (val) => (val <= 55 ? 'good' : val <= 75 ? 'warn' : 'risk'),
      hint: 'Elevated charge temps indicate intercooler restriction or turbo compressor inefficiency.',
    },
  ],
  P0171: [
    {
      id: 'ltft_idle_lean',
      label: 'Long-Term Fuel Trim at Warm Idle (LTFT)',
      shortName: 'LTFT at Idle',
      unit: '%',
      min: -10,
      max: 35,
      step: 1,
      defaultValue: 5,
      normalRangeLabel: '-5% to +7%',
      warnRangeLabel: '+8% to +17%',
      critRangeLabel: '≥ +18%',
      evaluate: (val) => (Math.abs(val) <= 7 ? 'good' : val <= 17 ? 'warn' : 'risk'),
      hint: 'If LTFT is +22% at idle but drops to +4% at 2,500 RPM, you have an intake vacuum/PCV leak, not a bad fuel pump.',
    },
    {
      id: 'maf_idle_gps',
      label: 'Mass Air Flow (MAF) at 800 RPM Idle',
      shortName: 'MAF at Idle',
      unit: 'g/s',
      min: 0.8,
      max: 7.0,
      step: 0.2,
      defaultValue: 2.8,
      normalRangeLabel: '2.0 – 4.5 g/s',
      warnRangeLabel: '1.4 – 1.9 g/s',
      critRangeLabel: '< 1.4 g/s',
      evaluate: (val) => (val >= 2.0 && val <= 4.8 ? 'good' : val >= 1.4 ? 'warn' : 'risk'),
      hint: 'Low MAF reading (<1.5 g/s on a 2.0L engine) indicates unmetered air bypassing the MAF or dirty hot-wire film.',
    },
    {
      id: 'fuel_rail_pressure_dev',
      label: 'Fuel Rail Pressure Deviation',
      shortName: 'Fuel Pressure Dev',
      unit: '%',
      min: 0,
      max: 35,
      step: 1,
      defaultValue: 3,
      normalRangeLabel: '0 – 6%',
      warnRangeLabel: '7 – 15%',
      critRangeLabel: '> 15%',
      evaluate: (val) => (val <= 6 ? 'good' : val <= 15 ? 'warn' : 'risk'),
      hint: 'High deviation under load indicates weak low-pressure tank pump or clogged fuel filter.',
    },
  ],
  P0300: [
    {
      id: 'misfire_ewma_count',
      label: 'Cylinder Misfire Count (per 1,000 rev)',
      shortName: 'Misfire Count',
      unit: 'cnt',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 2,
      normalRangeLabel: '0 – 3 cnt',
      warnRangeLabel: '4 – 24 cnt',
      critRangeLabel: '≥ 25 cnt',
      evaluate: (val) => (val <= 3 ? 'good' : val <= 24 ? 'warn' : 'risk'),
      hint: 'Continuous misfires >25 cnt dump raw fuel into the exhaust and quickly melt the catalytic converter.',
    },
    {
      id: 'ignition_timing_retard',
      label: 'Knock Sensor Timing Retard',
      shortName: 'Timing Deviation',
      unit: '°',
      min: 0,
      max: 15,
      step: 0.5,
      defaultValue: 1.5,
      normalRangeLabel: '0 – 3.0°',
      warnRangeLabel: '3.5 – 7.0°',
      critRangeLabel: '> 7.0°',
      evaluate: (val) => (val <= 3.0 ? 'good' : val <= 7.0 ? 'warn' : 'risk'),
      hint: 'Excessive knock retard points to carbon buildup on intake valves or failing ignition coil packs.',
    },
    {
      id: 'stft_bank_delta',
      label: 'Short-Term Fuel Trim (STFT) Instability',
      shortName: 'Fuel Trim Delta',
      unit: '%',
      min: 0,
      max: 30,
      step: 1,
      defaultValue: 4,
      normalRangeLabel: '0 – 7%',
      warnRangeLabel: '8 – 16%',
      critRangeLabel: '> 16%',
      evaluate: (val) => (val <= 7 ? 'good' : val <= 16 ? 'warn' : 'risk'),
      hint: 'Unstable STFT alongside misfires indicates leaking/clogged fuel injectors.',
    },
  ],
  P0700: [
    {
      id: 'atf_fluid_temp',
      label: 'Transmission Fluid Temperature (ATF)',
      shortName: 'ATF Temp',
      unit: '°C',
      min: 40,
      max: 150,
      step: 2,
      defaultValue: 82,
      normalRangeLabel: '65 – 95 °C',
      warnRangeLabel: '96 – 118 °C',
      critRangeLabel: '> 118 °C',
      evaluate: (val) => (val <= 95 ? 'good' : val <= 118 ? 'warn' : 'risk'),
      hint: 'ATF above 115 °C Varnishes valve body solenoids and degrades friction clutch packs rapidly.',
    },
    {
      id: 'torque_converter_slip',
      label: 'Torque Converter Lockup Slip Speed',
      shortName: 'Clutch Slip',
      unit: 'RPM',
      min: 0,
      max: 400,
      step: 5,
      defaultValue: 25,
      normalRangeLabel: '0 – 45 RPM',
      warnRangeLabel: '46 – 150 RPM',
      critRangeLabel: '> 150 RPM',
      evaluate: (val) => (val <= 45 ? 'good' : val <= 150 ? 'warn' : 'risk'),
      hint: 'High slip (>150 RPM) with commanded lockup confirms worn friction lining or valve body pressure loss.',
    },
    {
      id: 'solenoid_line_pressure',
      label: 'Mechatronic Line Pressure Deviation',
      shortName: 'Line Pressure Dev',
      unit: '%',
      min: 0,
      max: 35,
      step: 1,
      defaultValue: 4,
      normalRangeLabel: '0 – 7%',
      warnRangeLabel: '8 – 18%',
      critRangeLabel: '> 18%',
      evaluate: (val) => (val <= 7 ? 'good' : val <= 18 ? 'warn' : 'risk'),
      hint: '7–18% deviation is often resolved by an ATF + filter service and solenoid cleaning.',
    },
  ],
};

const DEFAULT_FALLBACK_PIDS = [
  {
    id: 'primary_sensor_deviation',
    label: 'Primary Sensor / Actuator Deviation',
    shortName: 'Signal Deviation',
    unit: '%',
    min: 0,
    max: 50,
    step: 1,
    defaultValue: 6,
    normalRangeLabel: '0 – 10%',
    warnRangeLabel: '11 – 25%',
    critRangeLabel: '> 25%',
    evaluate: (val) => (val <= 10 ? 'good' : val <= 25 ? 'warn' : 'risk'),
    hint: 'Compares live sensor feedback against ECU commanded target map.',
  },
  {
    id: 'fuel_or_timing_trim',
    label: 'Long-Term Fuel / Timing Trim Shift',
    shortName: 'System Trim',
    unit: '%',
    min: 0,
    max: 35,
    step: 1,
    defaultValue: 4,
    normalRangeLabel: '0 – 8%',
    warnRangeLabel: '9 – 18%',
    critRangeLabel: '> 18%',
    evaluate: (val) => (val <= 8 ? 'good' : val <= 18 ? 'warn' : 'risk'),
    hint: 'Adaptive ECU compensation factor under steady-state closed-loop operation.',
  },
  {
    id: 'operating_thermal_load',
    label: 'Subsystem Operating Temp / Load',
    shortName: 'Subsystem Temp',
    unit: '°C',
    min: 50,
    max: 140,
    step: 2,
    defaultValue: 88,
    normalRangeLabel: '75 – 102 °C',
    warnRangeLabel: '60–74 or 103–115 °C',
    critRangeLabel: '< 60 or > 115 °C',
    evaluate: (val) => (val >= 75 && val <= 102 ? 'good' : val >= 60 && val <= 115 ? 'warn' : 'risk'),
    hint: 'Verifies thermal operating window required for ECU readiness monitors.',
  },
];

export function getPidsForCode(code) {
  return CODE_PID_CONFIGS[code] || DEFAULT_FALLBACK_PIDS;
}

/**
 * Computes the overall diagnostic verdict and narrowed repair cost range
 * based on individual PID evaluations and the active OBD dossier.
 */
export function evaluatePidTelemetryVerdict(pidConfigs, pidValues, activeDossier, workshopRate = 115, laborTierId) {
  const evaluations = pidConfigs.map((cfg) => {
    const val = pidValues[cfg.id] ?? cfg.defaultValue;
    return cfg.evaluate(Number(val));
  });

  const hasRisk = evaluations.includes('risk');
  const hasWarn = evaluations.includes('warn');
  const riskCount = evaluations.filter((e) => e === 'risk').length;

  let tone = 'good';
  let colorCode = 'GREEN';
  let badgeLabel = 'Normal / Sensor fault likely';

  if (hasRisk) {
    tone = 'risk';
    colorCode = 'RED';
    badgeLabel = 'Core clogged / Hardware failure';
  } else if (hasWarn) {
    tone = 'warn';
    colorCode = 'YELLOW';
    badgeLabel = 'Service / Active Regen needed';
  }

  // Resolve effective rate and parts markup factor based on workshop tier
  const safeRate = Math.max(0, Number(workshopRate) || 0);
  const markupFactor =
    laborTierId === 'dealership' || safeRate >= 160
      ? 1.25
      : laborTierId === 'diy' || safeRate === 0
      ? 0.85
      : 1.0;

  const rootCauses = activeDossier?.rootCauses || [];

  const causeEstimates = rootCauses.map((rc) => {
    const p0 = Array.isArray(rc.partsCostUsd) ? Math.max(0, Number(rc.partsCostUsd[0]) || 0) : 0;
    const p1 = Array.isArray(rc.partsCostUsd) ? Math.max(p0, Number(rc.partsCostUsd[1]) || p0) : p0;
    const l0 = Array.isArray(rc.laborHours) ? Math.max(0, Number(rc.laborHours[0]) || 0) : 0;
    const l1 = Array.isArray(rc.laborHours) ? Math.max(l0, Number(rc.laborHours[1]) || l0) : l0;

    const minCost = Math.round(p0 * markupFactor + l0 * safeRate);
    const maxCost = Math.round(p1 * markupFactor + l1 * safeRate);
    const avgCost = Math.round((minCost + maxCost) / 2);
    return {
      ...rc,
      minCost,
      maxCost,
      avgCost,
    };
  });

  // Sort causes from least expensive (sensor/hose/wiring) to most expensive (core assembly)
  const sortedByCost = [...causeEstimates].sort((a, b) => a.avgCost - b.avgCost);

  const fbParts0 = Math.max(0, Number(activeDossier?.partsCostRangeUsd?.[0]) || 90);
  const fbParts1 = Math.max(fbParts0, Number(activeDossier?.partsCostRangeUsd?.[1]) || 1500);
  const fbLabor0 = Math.max(0, Number(activeDossier?.laborHoursRange?.[0]) || 1);
  const fbLabor1 = Math.max(fbLabor0, Number(activeDossier?.laborHoursRange?.[1]) || 4);

  const fallbackMin = Math.round(fbParts0 * markupFactor + fbLabor0 * safeRate);
  const fallbackMax = Math.round(fbParts1 * markupFactor + fbLabor1 * safeRate);

  let narrowedMinUsd = fallbackMin;
  let narrowedMaxUsd = fallbackMax;
  let primarySuspectCause = sortedByCost[0]?.cause || 'Sensor / Wiring Reference Circuit Fault';
  let recommendation = '';

  if (sortedByCost.length > 0) {
    const cheapest = sortedByCost[0];
    const costliest = sortedByCost[sortedByCost.length - 1];
    const midIndex = Math.min(sortedByCost.length - 1, Math.floor(sortedByCost.length / 2));
    const middle = sortedByCost[midIndex];

    if (tone === 'good') {
      narrowedMinUsd = cheapest.minCost;
      narrowedMaxUsd = cheapest.maxCost;
      primarySuspectCause = cheapest.cause;
      recommendation =
        activeDossier?.code === 'P2002'
          ? 'Live DPF backpressure and soot load are within healthy OEM limits. High probability of a drifted G450 Differential Pressure Sensor or cracked silicone reference hose—do NOT replace the DPF monolith.'
          : `Live telemetry parameters remain within healthy bounds. Fault is most likely triggered by ${cheapest.cause.toLowerCase()} rather than a major mechanical failure.`;
    } else if (tone === 'warn') {
      narrowedMinUsd = Math.min(cheapest.maxCost, middle.minCost);
      narrowedMaxUsd = middle.maxCost;
      primarySuspectCause = middle.cause;
      recommendation =
        activeDossier?.code === 'P2002'
          ? 'Elevated backpressure / soot accumulation detected, but below irreversible ash-lock threshold. Perform a workshop forced service regeneration, check boost/EGR hoses, and verify coolant reaches >82 °C.'
          : `Moderate telemetry deviation detected. Recommend targeted service intervention (${middle.cause.toLowerCase()}) before authorizing full assembly replacement.`;
    } else {
      // RED / risk
      narrowedMinUsd = riskCount >= 2 ? Math.round((costliest.minCost + costliest.maxCost) / 2) : costliest.minCost;
      narrowedMaxUsd = costliest.maxCost;
      primarySuspectCause = costliest.cause;
      recommendation =
        activeDossier?.code === 'P2002'
          ? 'Critical exhaust restriction (>150 hPa / ≥80% soot load) confirmed. ECU active regeneration is locked out due to thermal runaway risk—off-car pneumatic/thermal DPF flush or core replacement required.'
          : `Severe telemetry threshold breach confirms hardware degradation (${costliest.cause.toLowerCase()}). Budget for major component overhaul or replacement.`;
    }
  }

  // Ensure calculations never produce NaN, Infinity, or negative values
  narrowedMinUsd = Math.max(0, Number.isFinite(narrowedMinUsd) ? narrowedMinUsd : 0);
  narrowedMaxUsd = Math.max(narrowedMinUsd, Number.isFinite(narrowedMaxUsd) ? narrowedMaxUsd : narrowedMinUsd);
  const narrowedExpectedUsd = Math.round((narrowedMinUsd + narrowedMaxUsd) / 2);
  const savingsVsMaxUsd = Math.max(0, fallbackMax - narrowedMaxUsd);

  return {
    tone,
    colorCode,
    badgeLabel,
    narrowedMinUsd,
    narrowedMaxUsd,
    narrowedExpectedUsd,
    baselineMinUsd: fallbackMin,
    baselineMaxUsd: fallbackMax,
    primarySuspectCause,
    recommendation,
    savingsVsMaxUsd,
    evaluations,
  };
}

export default function LivePidEvaluator({
  activeDossier,
  workshopRate = 115,
  laborTierId = 'independent',
  onVerdictChange,
}) {
  const { formatCurrency } = useUnits();
  const code = activeDossier?.code || 'P2002';

  const pidConfigs = useMemo(() => getPidsForCode(code), [code]);

  // Build initial default map for current code
  const defaultMap = useMemo(() => {
    const map = {};
    for (const cfg of pidConfigs) {
      map[cfg.id] = cfg.defaultValue;
    }
    return map;
  }, [pidConfigs]);

  const [pidValues, setPidValues] = useState(defaultMap);

  // Reset PID values when active OBD code changes
  useEffect(() => {
    setPidValues(defaultMap);
  }, [code, defaultMap]);

  const handlePidChange = (id, rawVal, min, max) => {
    const parsed = Number(rawVal);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(max, Math.max(min, parsed));
    setPidValues((prev) => ({
      ...prev,
      [id]: clamped,
    }));
  };

  // Preset quick-simulation scenarios so users can test GREEN / YELLOW / RED states in 1 click
  const applyScenario = (scenarioType) => {
    const next = {};
    for (const cfg of pidConfigs) {
      if (scenarioType === 'good') {
        next[cfg.id] = cfg.defaultValue;
      } else if (scenarioType === 'warn') {
        if (cfg.id === 'dpf_diff_pressure') next[cfg.id] = 105;
        else if (cfg.id === 'soot_mass_load') next[cfg.id] = 64;
        else if (cfg.id === 'exhaust_gas_temp') next[cfg.id] = 640;
        else {
          next[cfg.id] = Number(((cfg.min + cfg.max) * 0.52).toFixed(1));
        }
      } else {
        // risk
        if (cfg.id === 'dpf_diff_pressure') next[cfg.id] = 240;
        else if (cfg.id === 'soot_mass_load') next[cfg.id] = 92;
        else if (cfg.id === 'exhaust_gas_temp') next[cfg.id] = 710;
        else if (cfg.id === 'maf_idle_gps') next[cfg.id] = 1.0;
        else {
          next[cfg.id] = Number((cfg.max * 0.88).toFixed(1));
        }
      }
    }
    setPidValues(next);
  };

  const verdict = useMemo(
    () => evaluatePidTelemetryVerdict(pidConfigs, pidValues, activeDossier, workshopRate, laborTierId),
    [pidConfigs, pidValues, activeDossier, workshopRate, laborTierId]
  );

  useEffect(() => {
    if (typeof onVerdictChange === 'function') {
      onVerdictChange(verdict);
    }
  }, [
    verdict.tone,
    verdict.narrowedMinUsd,
    verdict.narrowedMaxUsd,
    verdict.primarySuspectCause,
    code,
    workshopRate,
    laborTierId,
  ]);

  const STATUS_DOT = {
    good: 'bg-emerald-500',
    warn: 'bg-amber-500',
    risk: 'bg-rose-500',
  };

  const CALLOUT_STYLES = {
    good: 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/70 text-emerald-950 dark:text-emerald-200',
    warn: 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/70 text-amber-950 dark:text-amber-200',
    risk: 'bg-rose-50/80 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/70 text-rose-950 dark:text-rose-200',
  };

  return (
    <div
      id="live-pid-evaluator"
      data-testid="live-pid-evaluator"
      className="mt-5 pt-5 border-t border-border/80 dark:border-zinc-800 space-y-5"
    >
      {/* Header Row with Real-Time Verdict Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-subtle dark:bg-zinc-950 p-4 rounded-xl border border-border/70 dark:border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
            <h4 className="text-xs font-bold uppercase tracking-wider font-sans text-ink dark:text-zinc-100">
              Interactive Live OBD2 PID Evaluator (<span className="font-mono tabular-nums">{code}</span>)
            </h4>
          </div>
          <p className="text-xs font-sans font-medium text-muted dark:text-zinc-400">
            Dial in your OBD-II scanner readings below to isolate sensor faults from costly hardware failures.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
          <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-muted dark:text-zinc-400">
            Live Telemetry Verdict
          </span>
          <Pill tone={verdict.tone}>
            <span data-testid="pid-verdict-badge">{verdict.badgeLabel}</span>
          </Pill>
        </div>
      </div>

      {/* Quick Telemetry Scenario Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-[11px] font-sans uppercase tracking-wider text-muted dark:text-zinc-400 font-semibold">
          Simulate Scanner Feed:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            id="pid-preset-good"
            onClick={() => applyScenario('good')}
            className={`px-2.5 py-1 rounded-lg font-sans font-medium border text-xs transition-colors ${
              verdict.tone === 'good'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-surface dark:bg-[#121215] text-body dark:text-zinc-300 border-border dark:border-zinc-700 hover:bg-surface-subtle dark:hover:bg-zinc-800'
            }`}
          >
            Sensor Fault / Healthy Core
          </button>
          <button
            type="button"
            id="pid-preset-warn"
            onClick={() => applyScenario('warn')}
            className={`px-2.5 py-1 rounded-lg font-sans font-medium border text-xs transition-colors ${
              verdict.tone === 'warn'
                ? 'bg-amber-500 text-zinc-950 border-amber-500 font-semibold shadow-sm'
                : 'bg-surface dark:bg-[#121215] text-body dark:text-zinc-300 border-border dark:border-zinc-700 hover:bg-surface-subtle dark:hover:bg-zinc-800'
            }`}
          >
            Service / Regen Needed
          </button>
          <button
            type="button"
            id="pid-preset-risk"
            onClick={() => applyScenario('risk')}
            className={`px-2.5 py-1 rounded-lg font-sans font-medium border text-xs transition-colors ${
              verdict.tone === 'risk'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-surface dark:bg-[#121215] text-body dark:text-zinc-300 border-border dark:border-zinc-700 hover:bg-surface-subtle dark:hover:bg-zinc-800'
            }`}
          >
            Clogged Core / Hardware Fail
          </button>
          <button
            type="button"
            onClick={() => setPidValues(defaultMap)}
            title="Reset PIDs to baseline"
            className="p-1.5 rounded-lg border border-border dark:border-zinc-700 bg-surface dark:bg-[#121215] text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Combined Slider + Synchronized Number Input Controls for Each PID */}
      <div className="space-y-4">
        {pidConfigs.map((cfg, idx) => {
          const val = pidValues[cfg.id] ?? cfg.defaultValue;
          const clamped = Math.min(cfg.max, Math.max(cfg.min, Number(val) || cfg.min));
          const fill = cfg.max > cfg.min ? ((clamped - cfg.min) / (cfg.max - cfg.min)) * 100 : 0;
          const pidTone = cfg.evaluate(clamped);
          const pidToneLabel =
            pidTone === 'good' ? 'Normal' : pidTone === 'warn' ? 'Warning' : 'Critical';

          return (
            <div
              key={cfg.id}
              className="p-4 rounded-xl border border-border/70 dark:border-zinc-800 bg-surface dark:bg-zinc-900/90 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`pid-slider-${cfg.id}`}
                    className="font-sans text-xs sm:text-sm font-semibold text-ink dark:text-zinc-100"
                  >
                    {cfg.label}
                  </label>
                  <Pill tone={pidTone} className="text-[11px] py-0 px-2">
                    {pidToneLabel}
                  </Pill>
                </div>

                {/* Synchronized Number Input + Unit Badge */}
                <div className="flex items-center gap-1.5">
                  <input
                    id={`pid-input-${cfg.id}`}
                    type="number"
                    min={cfg.min}
                    max={cfg.max}
                    step={cfg.step}
                    value={val}
                    aria-label={`${cfg.label} numeric input`}
                    onChange={(e) => handlePidChange(cfg.id, e.target.value, cfg.min, cfg.max)}
                    className="w-20 h-8 rounded-lg border border-border-strong dark:border-zinc-700 bg-surface-subtle dark:bg-zinc-950 px-2 text-right font-mono text-xs sm:text-sm font-bold tabular-nums text-ink dark:text-zinc-100 focus-visible:border-primary-600 focus-visible:outline-none"
                  />
                  <span className="font-sans text-xs font-semibold text-muted dark:text-zinc-400 min-w-[2.25rem]">
                    {cfg.unit}
                  </span>
                </div>
              </div>

              {/* Range Slider */}
              <input
                id={`pid-slider-${cfg.id}`}
                type="range"
                min={cfg.min}
                max={cfg.max}
                step={cfg.step}
                value={clamped}
                onChange={(e) => handlePidChange(cfg.id, e.target.value, cfg.min, cfg.max)}
                className="odo-range telemetry-slider w-full"
                style={{ '--fill': `${fill}%` }}
              />

              {/* Threshold Legend Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans font-medium text-muted dark:text-zinc-400 pt-0.5">
                <span className="inline-flex items-center gap-1">
                  Normal: <span className="font-mono tabular-nums">{cfg.normalRangeLabel}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  Warn: <span className="font-mono tabular-nums">{cfg.warnRangeLabel}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  Critical: <span className="font-mono tabular-nums">{cfg.critRangeLabel}</span>
                </span>
              </div>

              {cfg.hint && (
                <p className="text-[11px] font-sans font-medium text-muted dark:text-zinc-400 leading-relaxed pt-0.5">
                  {cfg.hint}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Telemetry Cost Impact Callout */}
      <div
        id="live-telemetry-cost-impact"
        className={`rounded-xl border p-4 space-y-2.5 transition-colors ${CALLOUT_STYLES[verdict.tone]}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {verdict.tone === 'good' ? (
              <CircleCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : verdict.tone === 'warn' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider font-sans">
              Live Telemetry Cost Impact
            </span>
          </div>

          <div className="font-sans text-sm sm:text-base font-bold" data-testid="telemetry-narrowed-cost">
            Narrowed Estimate: <span className="font-mono tabular-nums">{formatCurrency(verdict.narrowedMinUsd)} – {formatCurrency(verdict.narrowedMaxUsd)}</span>
          </div>
        </div>

        <p className="text-xs font-sans leading-relaxed">
          <strong className="font-semibold">Primary Telemetry Suspect:</strong> {verdict.primarySuspectCause}
        </p>

        <p className="text-xs font-sans leading-relaxed opacity-90">
          {verdict.recommendation}
        </p>

        {verdict.savingsVsMaxUsd > 0 && verdict.tone !== 'risk' && (
          <div className="pt-1.5 border-t border-current/15 flex items-center justify-between text-xs font-sans font-semibold">
            <span>Potential Unnecessary Assembly Savings:</span>
            <span>Up to <span className="font-mono tabular-nums">{formatCurrency(verdict.savingsVsMaxUsd)}</span> saved</span>
          </div>
        )}
      </div>
    </div>
  );
}

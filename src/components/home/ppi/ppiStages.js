export const PPI_POPULAR_SHORTCUTS = [
  { id: 'vw-golf-20-tdi', label: 'VW Golf TDI' },
  { id: 'toyota-corolla-18-hybrid', label: 'Corolla Hybrid' },
  { id: 'toyota-camry-hybrid', label: 'Camry Hybrid' },
  { id: 'tesla-model-3-lr', label: 'Model 3' },
  { id: 'bmw-320d-b47', label: 'BMW 320d' },
];

export const STANDARD_STEP_TRANSLATIONS = {
  'step-obd-scan': {
    title: 'OBD-II DTC & Freeze Frame Live Data Scan',
    focus: 'Scan active, stored, and pending DTCs. Verify distance traveled since codes were cleared.',
    inspectionMethod:
      'Connect OBD2 scanner: if distance since DTC clear is under 50 km (30 mi), fault codes may have been cleared right before arrival.',
    riskLabel: 'Critical / Mandatory',
    timeEst: '~20 mins',
    keyPids: 'Mode 03 (DTC), Mode 07 (Pending), PID 0x31 (Distance since clear)',
  },
  'step-cold-start': {
    title: 'Cold Start, Blowby & Oil Filler Cap Pressure Test',
    focus: 'Start engine strictly cold. Inspect exhaust smoke color and listen for idle valvetrain rattle.',
    inspectionMethod:
      'Check engine block temperature (must not be warm). With engine idling, loosen oil cap: gentle vacuum is normal, excessive smoke indicates blowby.',
    riskLabel: 'Moderate / Important',
    timeEst: '~15 mins',
    keyPids: 'Coolant Temp PID 0x05, Oil Pressure PID',
  },
  'step-ev-hv-battery': {
    title: 'HV Battery State of Health (SoH %) & Cell Delta-V Load Test',
    focus:
      'Read BMS State of Health (SoH %), total DC fast-charge vs AC charge counter, and cell voltage imbalance (mV delta) under load.',
    inspectionMethod:
      'Query BMS via OBD2 at <30% SoC under acceleration: cell delta-V must remain <25 mV with zero HV isolation fault history.',
    riskLabel: 'Critical / HV Battery',
    timeEst: '~20 mins',
    keyPids: 'BMS SoH %, Min/Max Cell Voltage Delta (mV), HV Isolation Resistance (kOhm)',
  },
  'step-body-chassis': {
    title: 'Body Paint Thickness & Structural Damage Screening',
    focus: 'Measure paint depth across panels (factory: 80–140 µm). Inspect A/B/C pillar spot welds and trunk floor.',
    inspectionMethod:
      'Measure pillars and sills (>200 µm indicates respray, >450 µm indicates body filler). Verify matching date stamps on all glass and headlights.',
    riskLabel: 'Critical / Resale Value',
    timeEst: '~20 mins',
    keyPids: 'Digital Coating Gauge, Glass DOT Date Codes',
  },
  'step-transmission-driveline': {
    title: 'Transmission Shift Quality & Clutch Slip Road Test',
    focus: 'Verify smooth gear engagement, low-speed creep, and absence of metallic clunking on engine shutdown.',
    inspectionMethod:
      'On test drive, apply full throttle from 1,500 RPM in 4th gear: if engine revs spike without vehicle acceleration, the clutch is slipping. Listen for flywheel chatter at shutdown.',
    riskLabel: 'Critical / High Repair Cost',
    timeEst: '~25 mins',
    keyPids: 'TCU Clutch Slip PID, Mechatronics Line Pressure Target',
  },
  'step-ev-charging-driveline': {
    title: 'On-Board Charger (OBC / ICCU), DC Fast-Charge & Reduction Gear Check',
    focus:
      'Test both Level 2 AC charging phases and CCS/NACS DC fast-charging handshake. Listen for drive unit bearing whine under regen.',
    inspectionMethod:
      'Verify AC charging reaches full rated kW across all phases, test heat pump cabin heating & battery chiller valve actuation, and check reduction gear backlash.',
    riskLabel: 'Critical / Charging & Drive Unit',
    timeEst: '~25 mins',
    keyPids: 'OBC Phase Current, DC-DC 12V Charging Voltage (>13.8V), Inverter & Chiller Temp',
  },
  'step-undercarriage-brakes': {
    title: 'Suspension Bushings, Damper Seepage & Rotor Edge Lip',
    focus: 'Check uneven tire shoulder wear, shock absorber oil seepage, and brake rotor edge wear.',
    inspectionMethod:
      'Turn wheels to inspect tread depth and shoulder wear. Perform firm straight-line braking test: vehicle must track straight without pedal pulsation.',
    riskLabel: 'Moderate / Chassis',
    timeEst: '~15 mins',
    keyPids: 'Brake Fluid Boiling Tester, Alignment Symmetry',
  },
};

export function parseRepairRangeUsd(estSavingStr, riskLevel) {
  const raw = String(estSavingStr || '');
  const isEur = raw.includes('€') || /eur/i.test(raw);
  const matches = raw.match(/\d[\d,]*/g);
  if (matches && matches.length >= 2) {
    const low = Number(matches[0].replace(/,/g, '')) || 400;
    const high = Number(matches[1].replace(/,/g, '')) || 1400;
    const factor = isEur ? 1 / 0.92 : 1.0;
    const minUsd = Math.round(low * factor);
    const maxUsd = Math.round(Math.max(low, high) * factor);
    return {
      minUsd,
      maxUsd,
      midpointUsd: Math.round((minUsd + maxUsd) / 2),
    };
  }
  const fallbackMid = riskLevel === 'critical' ? 1250 : 650;
  return {
    minUsd: Math.round(fallbackMid * 0.6),
    maxUsd: Math.round(fallbackMid * 1.4),
    midpointUsd: fallbackMid,
  };
}

export function sanitizeStep(step) {
  const baseStep = STANDARD_STEP_TRANSLATIONS[step.id]
    ? { ...step, ...STANDARD_STEP_TRANSLATIONS[step.id] }
    : (() => {
        const stepId = step.id || '';
        let method = 'Physical inspection and diagnostic trouble code scan recommended.';
        if (stepId.includes('wet-belt')) {
          method = 'Inspect oil filler neck to examine timing belt for cracking or delamination.';
        } else if (stepId.includes('cp4')) {
          method = 'Inspect high-pressure fuel pump and filter housing for metal debris.';
        } else if (stepId.includes('iccu')) {
          method = 'Test 12V auxiliary battery resting voltage and verify AC charging port operation.';
        } else if (stepId.includes('timing')) {
          method = 'Listen during the first 5 seconds of cold start for timing chain chatter.';
        }

        const riskLabel =
          step.riskLevel === 'critical'
            ? 'Critical Risk'
            : step.riskLevel === 'low'
            ? 'Low Risk'
            : 'Moderate Risk';

        const toAscii = (str) =>
          str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';

        let title = toAscii(step.title || 'Mechanical Inspection');
        title = title.replace(/\([^)]*fault[^)]*\)/gi, '').trim();

        let focus = toAscii(step.focus || '');
        if (focus.includes('|')) {
          const parts = focus.split('|');
          const s1 = parts[0].replace(/^[^:]*:\s*/, '').trim();
          const s2 = parts[1] ? parts[1].replace(/^[^:]*:\s*/, '').trim() : '';
          focus = `Symptoms: ${s1}${s2 ? ` | Prevention: ${s2}` : ''}`;
        }

        const keyPids = toAscii(step.keyPids || 'OBD Diagnostic Scan & Visual Check');

        return {
          ...step,
          title,
          timeEst: '~15-20 mins',
          riskLabel,
          focus,
          inspectionMethod: method,
          keyPids,
        };
      })();

  const range = parseRepairRangeUsd(baseStep.estSaving, baseStep.riskLevel);
  return {
    ...baseStep,
    minRepairUsd: range.minUsd,
    maxRepairUsd: range.maxUsd,
    deductionUsd: range.midpointUsd,
  };
}

export function getPpiStageDefinitions(isEv = false) {
  return [
    {
      id: 'cold-start',
      title: isEv ? 'Powertrain & HV Bay' : 'Cold Start & Engine Bay',
      description: isEv
        ? 'HV traction battery SoH, thermal valves, and 12V auxiliary system'
        : 'Cold-start acoustics, timing, cooling, and fuel system checks',
    },
    {
      id: 'exterior-paint',
      title: 'Exterior & Paint',
      description: 'Paint depth gauge readings, pillars, glass stamps, and underbody corrosion',
    },
    {
      id: 'cabin-obd',
      title: 'Cabin & OBD Scan',
      description: 'OBD-II live codes, distance since DTC clear, and infotainment/electrical checks',
    },
    {
      id: 'road-test',
      title: 'Road Test',
      description: isEv
        ? 'AC/DC charging handshake, regen bearing acoustics, suspension, and brakes'
        : 'Transmission/clutch load test, suspension bushings, steering, and braking',
    },
  ];
}

export function classifyStepStage(step) {
  const id = String(step?.id || '');
  const title = String(step?.title || '');

  // Exact standard step IDs
  if (id === 'step-obd-scan') return 'cabin-obd';
  if (id === 'step-cold-start' || id === 'step-ev-hv-battery') return 'cold-start';
  if (id === 'step-body-chassis') return 'exterior-paint';
  if (
    id === 'step-transmission-driveline' ||
    id === 'step-ev-charging-driveline' ||
    id === 'step-undercarriage-brakes'
  ) {
    return 'road-test';
  }

  // Model-specific classification strictly on step.id and step.title (never step.focus)
  if (id.includes('driveline-thermal-wear')) return 'road-test';

  if (/\b(paintwork|paint|cablegate|rear visibility)\b/i.test(title)) {
    return 'exterior-paint';
  }

  if (/\b(infotainment|mib3|sync ?3|uconnect|easy link|relay box|wiring loom|software)\b/i.test(title)) {
    return 'cabin-obd';
  }

  if (
    /\b(bushing|suspension|steering|tie rod|fore link|control arm|ball joint|caliper|brake|crabbing|tyre|tire|clutch|dsg|dct|powershift|s-tronic|mechatronic|transfer case|transfer box|haldex|allgrip|rear diff|diff pinion|flywheel|e-cvt|air suspension)\b/i.test(
      title
    ) &&
    !/\btiming chain\b/i.test(title)
  ) {
    return 'road-test';
  }

  return 'cold-start';
}

export function groupStepsByStage(inspectionSteps = [], isEv = false) {
  const definitions = getPpiStageDefinitions(isEv);
  const buckets = {
    'cold-start': [],
    'exterior-paint': [],
    'cabin-obd': [],
    'road-test': [],
  };

  inspectionSteps.forEach((step, idx) => {
    const stageId = classifyStepStage(step);
    const bucket = buckets[stageId] || buckets['cold-start'];
    bucket.push({
      ...step,
      displayIndex: idx + 1,
      stageId,
    });
  });

  return definitions
    .map((stage, stageIdx) => ({
      ...stage,
      stageNumber: stageIdx + 1,
      steps: buckets[stage.id] || [],
    }))
    .filter((stage) => stage.steps.length > 0);
}

export function buildSellerNegotiationScript({
  vehicle,
  askingPriceUsd,
  odometerMiles,
  negotiationTargets,
  reviewedCount = 0,
  totalCount = 0,
  naCount = 0,
  formatCurrency,
  formatDistance,
}) {
  if (!vehicle) return '';
  const fmtMoney = typeof formatCurrency === 'function' ? formatCurrency : (v) => `$${Math.round(v).toLocaleString('en-US')}`;
  const fmtDist = typeof formatDistance === 'function' ? formatDistance : (v) => `${Math.round(v).toLocaleString('en-US')} mi`;

  const flagged = negotiationTargets?.flaggedSteps || [];
  const lines = [
    `Hi, thank you for showing me the ${vehicle.name} (${vehicle.engineCode || vehicle.fuelType}) at ${fmtDist(odometerMiles)}.`,
    `After completing a ${reviewedCount}/${totalCount}-point inspection${naCount > 0 ? ` (${naCount} N/A)` : ''} against the ${fmtMoney(askingPriceUsd)} asking price, here are the documented findings:`,
  ];

  if (flagged.length > 0) {
    flagged.forEach((item) => {
      lines.push(`- ${item.title}: est. ${fmtMoney(item.deductionUsd)} repair midpoint (${fmtMoney(item.minRepairUsd)}–${fmtMoney(item.maxRepairUsd)})`);
    });
  } else {
    lines.push('- No acute mechanical defects flagged during inspection.');
  }

  if ((negotiationTargets?.wearReserveDeductionUsd || 0) > 0) {
    lines.push(
      `- Due scheduled maintenance reserve at ${fmtDist(odometerMiles)} (50% share): -${fmtMoney(negotiationTargets.wearReserveDeductionUsd)}`
    );
  }

  lines.push(
    `Total documented adjustment: -${fmtMoney(negotiationTargets?.totalDeductionUsd || 0)}.`,
    `Based on independent workshop repair midpoints, I can make a clean offer today at ${fmtMoney(negotiationTargets?.recommendedOpeningOfferUsd || askingPriceUsd)} (maximum ceiling ${fmtMoney(negotiationTargets?.walkAwayCeilingUsd || askingPriceUsd)}).`
  );

  return lines.join('\n');
}

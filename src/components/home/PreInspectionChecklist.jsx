import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock,
  ArrowRight,
  Share2,
  Printer,
  Check,
  AlertTriangle,
  RotateCcw,
  Car,
  DollarSign,
} from 'lucide-react';
import { VEHICLE_PRESETS, getPresetById } from '../../data/vehiclePresets';
import { useUnits } from '../../context/UnitContext';
import { RiskBadge } from '../common/OdometerPrimitives';
import { generatePpiChecklist } from '../../data/breakEvenAndPpi.js';
import {
  MAINTENANCE_COMPONENTS,
  evaluateComponentHealth,
  resolvePowertrainType,
  isPureElectric,
} from '../../data/maintenanceData.js';
import { estimateMileageAdjustedMarketValue } from '../../data/fixOrSellEngine.js';
import AffiliateCTA from '../monetization/AffiliateCTA';

export { generatePpiChecklist };

const STANDARD_STEP_TRANSLATIONS = {
  'step-obd-scan': {
    title: 'OBD-II DTC & Freeze Frame Live Data Scan',
    focus: 'Scan active, stored, and pending DTCs. Verify distance traveled since codes were cleared.',
    inspectionMethod: 'Connect OBD2 scanner: if distance since DTC clear is under 50 km (30 mi), fault codes may have been cleared right before arrival.',
    riskLabel: 'Critical / Mandatory',
    timeEst: '~20 mins',
    keyPids: 'Mode 03 (DTC), Mode 07 (Pending), PID 0x31 (Distance since clear)',
  },
  'step-cold-start': {
    title: 'Cold Start, Blowby & Oil Filler Cap Pressure Test',
    focus: 'Start engine strictly cold. Inspect exhaust smoke color and listen for idle valvetrain rattle.',
    inspectionMethod: 'Check engine block temperature (must not be warm). With engine idling, loosen oil cap: gentle vacuum is normal, excessive smoke indicates blowby.',
    riskLabel: 'Moderate / Important',
    timeEst: '~15 mins',
    keyPids: 'Coolant Temp PID 0x05, Oil Pressure PID',
  },
  'step-body-chassis': {
    title: 'Body Paint Thickness & Structural Damage Screening',
    focus: 'Measure paint depth across panels (factory: 80–140 µm). Inspect A/B/C pillar spot welds and trunk floor.',
    inspectionMethod: 'Measure pillars and sills (>200 µm indicates respray, >450 µm indicates body filler). Verify matching date stamps on all glass and headlights.',
    riskLabel: 'Critical / Resale Value',
    timeEst: '~20 mins',
    keyPids: 'Digital Coating Gauge, Glass DOT Date Codes',
  },
  'step-transmission-driveline': {
    title: 'Transmission Shift Quality & Clutch Slip Road Test',
    focus: 'Verify smooth gear engagement, low-speed creep, and absence of metallic clunking on engine shutdown.',
    inspectionMethod: 'On test drive, apply full throttle from 1,500 RPM in 4th gear: if engine revs spike without vehicle acceleration, the clutch is slipping. Listen for flywheel chatter at shutdown.',
    riskLabel: 'Critical / High Repair Cost',
    timeEst: '~25 mins',
    keyPids: 'TCU Clutch Slip PID, Mechatronics Line Pressure Target',
  },
  'step-undercarriage-brakes': {
    title: 'Suspension Bushings, Damper Seepage & Rotor Edge Lip',
    focus: 'Check uneven tire shoulder wear, shock absorber oil seepage, and brake rotor edge wear.',
    inspectionMethod: 'Turn wheels to inspect tread depth and shoulder wear. Perform firm straight-line braking test: vehicle must track straight without pedal pulsation.',
    riskLabel: 'Moderate / Chassis',
    timeEst: '~15 mins',
    keyPids: 'Brake Fluid Boiling Tester, Alignment Symmetry',
  },
};

function parseRepairRangeUsd(estSavingStr, riskLevel) {
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

function sanitizeStep(step) {
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

export default function PreInspectionChecklist({
  presetId,
  currentOdometerMiles = 75000,
  onNavigateToObd,
  onNavigateToTco,
  onSelectPreset,
}) {
  const {
    currencySymbol,
    distanceUnit,
    formatDistance,
    formatCurrency,
    convertMilesToRegion,
    convertRegionToMiles,
    convertUsdToRegion,
    convertRegionToUsd,
  } = useUnits();

  const [selectedPreset, setSelectedPreset] = useState(() => {
    return getPresetById(presetId) || VEHICLE_PRESETS[0];
  });

  const [odometerMiles, setOdometerMiles] = useState(() =>
    Math.max(0, Number(currentOdometerMiles || selectedPreset.defaultOdometerMiles || 75000))
  );

  const [askingPriceUsd, setAskingPriceUsd] = useState(() =>
    estimateMileageAdjustedMarketValue(
      selectedPreset,
      currentOdometerMiles || selectedPreset.defaultOdometerMiles || 75000
    )
  );

  useEffect(() => {
    if (presetId) {
      const p = getPresetById(presetId);
      if (p) {
        setSelectedPreset(p);
        const defaultOdo = Math.max(35000, Number(p.defaultOdometerMiles) || 65000);
        setOdometerMiles(defaultOdo);
        setAskingPriceUsd(estimateMileageAdjustedMarketValue(p, defaultOdo));
        setCheckedIds({});
        setFlaggedDefectIds({});
      }
    }
  }, [presetId]);

  // Verified OK state vs Flagged Defect state
  const [checkedIds, setCheckedIds] = useState({});
  const [flaggedDefectIds, setFlaggedDefectIds] = useState({});
  const [copyFeedback, setCopyFeedback] = useState(false);

  const odometerKm = Math.round(odometerMiles * 1.609344);

  const inspectionSteps = useMemo(() => {
    const raw = generatePpiChecklist(selectedPreset, odometerKm);
    return raw.map(sanitizeStep);
  }, [selectedPreset, odometerKm]);

  // Toggle Verified OK
  const toggleStep = (id) => {
    setCheckedIds((prev) => {
      const next = !prev[id];
      if (next) {
        setFlaggedDefectIds((f) => ({ ...f, [id]: false }));
      }
      return { ...prev, [id]: next };
    });
  };

  // Toggle Flagged Defect (adds 100% repair midpoint to negotiation deduction!)
  const toggleDefectFlag = (e, id) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    setFlaggedDefectIds((prev) => {
      const next = !prev[id];
      if (next) {
        setCheckedIds((c) => ({ ...c, [id]: false }));
      }
      return { ...prev, [id]: next };
    });
  };

  // Compute upcoming wear reserve exposure at current odometer (50% negotiation weight)
  const wearExposure = useMemo(() => {
    const pType = resolvePowertrainType(selectedPreset);
    const isEv = isPureElectric(pType);
    const relevant = MAINTENANCE_COMPONENTS.filter((comp) =>
      isEv
        ? comp.applicablePowertrains.includes('ev')
        : comp.applicablePowertrains.includes(selectedPreset.powertrain || 'diesel')
    );

    let scheduledWearDeductionUsd = 0;
    let serviceReserve12MoUsd = 0;

    for (const comp of relevant) {
      const health = evaluateComponentHealth({
        component: comp,
        physicalOdometerMiles: odometerMiles,
        urbanTripSharePct: 45,
        oilIntervalId: 'standard',
        serviceHistoryId: 'verified',
        transmissionId: selectedPreset.transmission || 'dct-dsg',
        powertrainType: pType,
        vehicle: selectedPreset,
      });
      if (!health) continue;
      const indieMid = Math.round(
        ((comp.costsUsd?.independent?.[0] || 500) + (comp.costsUsd?.independent?.[1] || 1100)) / 2
      );
      if (health.status === 'CRITICAL') {
        scheduledWearDeductionUsd += Math.round(indieMid * 0.5);
        serviceReserve12MoUsd += Math.round(indieMid * 0.75);
      } else if (health.status === 'WARNING') {
        scheduledWearDeductionUsd += Math.round(indieMid * 0.25);
        serviceReserve12MoUsd += Math.round(indieMid * 0.35);
      }
    }

    return {
      scheduledWearDeductionUsd,
      serviceReserve12MoUsd: Math.max(450, serviceReserve12MoUsd),
    };
  }, [selectedPreset, odometerMiles]);

  // Live Negotiation Battlecard Calculations
  const negotiationTargets = useMemo(() => {
    const flaggedSteps = inspectionSteps.filter((s) => Boolean(flaggedDefectIds[s.id]));
    const flaggedDefectsUsd = flaggedSteps.reduce((sum, s) => sum + (s.deductionUsd || 0), 0);
    const wearReserveDeductionUsd = wearExposure.scheduledWearDeductionUsd;
    const totalDeductionUsd = flaggedDefectsUsd + wearReserveDeductionUsd;

    const minFloorPrice = Math.round(askingPriceUsd * 0.45);
    const recommendedOpeningOfferUsd = Math.max(
      minFloorPrice,
      Math.round(askingPriceUsd - totalDeductionUsd)
    );
    const walkAwayCeilingUsd = Math.max(
      recommendedOpeningOfferUsd,
      Math.round(askingPriceUsd - flaggedDefectsUsd * 0.7 - wearReserveDeductionUsd * 0.35)
    );

    return {
      flaggedSteps,
      flaggedDefectsUsd,
      wearReserveDeductionUsd,
      totalDeductionUsd,
      recommendedOpeningOfferUsd,
      walkAwayCeilingUsd,
    };
  }, [inspectionSteps, flaggedDefectIds, wearExposure, askingPriceUsd]);

  const reviewedCount = inspectionSteps.filter(
    (s) => Boolean(checkedIds[s.id]) || Boolean(flaggedDefectIds[s.id])
  ).length;
  const totalCount = inspectionSteps.length;
  const progressPct = totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0;

  const displayOdo = Math.round(convertMilesToRegion(odometerMiles));
  const displayAskingPrice = Math.round(convertUsdToRegion(askingPriceUsd));

  const handleShareLink = () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://shiftmetric.com';
      const shareUrl = `${origin}/checklist?preset=${encodeURIComponent(selectedPreset.id)}&odo=${Math.round(odometerMiles)}&price=${Math.round(askingPriceUsd)}`;
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 3000);
      }
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  };

  const handleResetChecklist = () => {
    setCheckedIds({});
    setFlaggedDefectIds({});
  };

  return (
    <section
      id="printable-checklist"
      className="p-6 sm:p-8 rounded-2xl bg-surface dark:bg-[#121215] border border-border dark:border-zinc-800 shadow-sm space-y-6"
    >
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border dark:border-zinc-800 print:border-b-2 print:border-black">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-sans text-[11px] uppercase tracking-widest text-primary-600 dark:text-primary-400 font-bold block print:text-black">
              Pre-Purchase Inspection &amp; Negotiation Battlecard
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-sans font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 print:hidden">
              Live Offer Calculator
            </span>
          </div>
          <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-ink dark:text-zinc-100 mt-1 print:text-black">
            {selectedPreset.name} — Field Inspection Checklist
          </h2>
          <p className="text-xs text-muted dark:text-zinc-400 mt-0.5 font-sans font-medium print:text-zinc-700">
            {selectedPreset.engineCode} · {selectedPreset.fuelType} · <span className="font-mono tabular-nums">{formatDistance(odometerMiles)}</span> · Asking <span className="font-mono tabular-nums">{formatCurrency(askingPriceUsd)}</span>
          </p>
        </div>

        {/* Toolbar Buttons (Hidden during Print) */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handleShareLink}
            className="px-3.5 py-2 rounded-lg font-sans text-xs font-semibold bg-surface-subtle dark:bg-zinc-800 hover:bg-surface dark:hover:bg-zinc-700 text-ink dark:text-zinc-200 border border-border dark:border-zinc-700 flex items-center gap-1.5 shadow-sm transition-colors duration-150"
            title="Share state as URL link"
          >
            {copyFeedback ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">Link copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                <span>Share link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg font-sans text-xs font-semibold bg-surface-subtle dark:bg-zinc-800 hover:bg-surface dark:hover:bg-zinc-700 text-ink dark:text-zinc-200 border border-border dark:border-zinc-700 flex items-center gap-1.5 shadow-sm transition-colors duration-150"
            title="Print or save Negotiation Battlecard as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            <span>Print Negotiation Battlecard</span>
          </button>

          {onNavigateToObd && (
            <button
              type="button"
              onClick={() => onNavigateToObd()}
              className="px-3.5 py-2 rounded-lg font-sans text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-1.5 shadow-sm transition-colors duration-150"
            >
              <span>OBD2 Code Lookup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Vehicle Preset, Asking Price & Odometer Quick Selector (Hidden during print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-subtle dark:bg-zinc-800/60 border border-border dark:border-zinc-800 print:hidden">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <label htmlFor="ppi-vehicle-select" className="font-sans text-xs font-semibold text-ink dark:text-zinc-200 flex items-center gap-1.5 shrink-0">
            <Car className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span>Vehicle:</span>
          </label>
          <select
            id="ppi-vehicle-select"
            value={selectedPreset.id}
            onChange={(e) => {
              const p = getPresetById(e.target.value);
              if (p) {
                setSelectedPreset(p);
                const nextOdo = Math.max(35000, Number(p.defaultOdometerMiles) || 65000);
                setOdometerMiles(nextOdo);
                setAskingPriceUsd(estimateMileageAdjustedMarketValue(p, nextOdo));
                setCheckedIds({});
                setFlaggedDefectIds({});
                if (onSelectPreset) onSelectPreset(p.id);
              }
            }}
            aria-label="Select vehicle model"
            className="max-w-[260px] truncate font-sans text-xs font-medium rounded-lg border border-border dark:border-zinc-700 bg-surface dark:bg-[#121215] px-3 py-1.5 text-ink dark:text-zinc-100 focus:outline-none focus:border-primary-600 shadow-sm"
          >
            {VEHICLE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.fuelType} · {p.engineCode})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="ppi-asking-price" className="font-sans text-xs font-semibold text-ink dark:text-zinc-200">
              Asking Price:
            </label>
            <div className="flex items-center rounded-lg border border-border dark:border-zinc-700 bg-surface dark:bg-[#121215] px-2.5 py-1">
              <span className="text-xs font-mono text-muted mr-1">{currencySymbol}</span>
              <input
                id="ppi-asking-price"
                type="number"
                min="500"
                max="250000"
                step="250"
                value={displayAskingPrice}
                onChange={(e) =>
                  setAskingPriceUsd(convertRegionToUsd(Math.max(500, Number(e.target.value) || 500)))
                }
                className="w-20 text-xs font-mono tabular-nums font-bold text-right bg-transparent text-ink dark:text-zinc-100 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="ppi-odometer-input" className="font-sans text-xs font-semibold text-ink dark:text-zinc-200">
              Odometer:
            </label>
            <div className="flex items-center rounded-lg border border-border dark:border-zinc-700 bg-surface dark:bg-[#121215] px-2.5 py-1">
              <input
                id="ppi-odometer-input"
                type="number"
                min="0"
                max="600000"
                step="2500"
                value={displayOdo}
                onChange={(e) =>
                  setOdometerMiles(convertRegionToMiles(Math.max(0, Number(e.target.value) || 0)))
                }
                className="w-20 text-xs font-mono tabular-nums font-bold text-right bg-transparent text-ink dark:text-zinc-100 outline-none"
              />
              <span className="text-xs font-sans text-muted ml-1">{distanceUnit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 0: Dynamic Geo-Routed Digital VIN & Odometer Rollback Verification */}
      <AffiliateCTA
        type="vin-check"
        stepLabel="Step 0 · Digital Check"
        vehicleName={selectedPreset.name}
        purchasePriceUsd={askingPriceUsd}
        odometerMiles={odometerMiles}
        serviceReserveUsd={wearExposure.serviceReserve12MoUsd}
      />

      {/* Interactive Progress & Live Negotiation Strip */}
      <div className="p-4 rounded-xl bg-primary-50/50 dark:bg-zinc-800/40 border border-primary-100 dark:border-zinc-800 print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold font-mono tabular-nums text-sm shrink-0">
            {progressPct}%
          </div>
          <div>
            <div className="font-sans text-xs font-bold text-ink dark:text-zinc-100">
              Reviewed: <span className="font-mono tabular-nums">{reviewedCount} / {totalCount}</span> points · <span className="font-mono tabular-nums">{negotiationTargets.flaggedSteps.length}</span> defects flagged
            </div>
            <p className="font-sans text-[11px] text-muted dark:text-zinc-400">
              Click a row to mark Verified OK, or click &ldquo;Flag Defect&rdquo; to deduct repair cost from your opening offer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {reviewedCount > 0 && (
            <button
              type="button"
              onClick={handleResetChecklist}
              className="px-3 py-1 text-[11px] font-sans font-semibold text-muted hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Printable Sheet Header (VISIBLE ONLY IN PRINT) */}
      <div className="hidden print:block border-b-2 border-black pb-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-sans text-2xl font-bold uppercase tracking-tight text-black">
              ShiftMetric — Pre-Purchase Inspection &amp; Negotiation Battlecard
            </h1>
            <p className="font-sans text-sm text-gray-700 mt-1">
              Vehicle: <strong>{selectedPreset.name}</strong> · Engine: <strong>{selectedPreset.engineCode}</strong> · Powertrain: <strong>{selectedPreset.fuelType}</strong>
            </p>
            <p className="font-sans text-sm text-gray-700">
              Odometer: <strong>{formatDistance(odometerMiles)}</strong> · Asking Price: <strong>{formatCurrency(askingPriceUsd)}</strong> · Date: <strong>{new Date().toLocaleDateString('en-US')}</strong>
            </p>
          </div>
          <div className="text-right text-xs text-gray-500 font-sans">
            shiftmetric.com/checklist
          </div>
        </div>
      </div>

      {/* Checklist Items List */}
      <div className="space-y-3.5">
        {inspectionSteps.map((s, index) => {
          const isChecked = Boolean(checkedIds[s.id]);
          const isFlagged = Boolean(flaggedDefectIds[s.id]);
          return (
            <div
              key={s.id}
              onClick={() => toggleStep(s.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer select-none print:cursor-default print:border-gray-400 print:bg-white ${
                isFlagged
                  ? 'bg-danger-bg/60 dark:bg-rose-950/30 border-[#F5C2C7] dark:border-rose-800'
                  : isChecked
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                  : 'bg-surface-subtle dark:bg-zinc-800/70 border-border dark:border-zinc-700 hover:border-primary-600/50 dark:hover:border-zinc-600'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 shrink-0">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors print:border-2 print:border-black print:bg-white ${
                      isFlagged
                        ? 'bg-score-poor text-white'
                        : isChecked
                        ? 'bg-emerald-600 text-white'
                        : 'border-2 border-border-strong dark:border-zinc-600 bg-surface dark:bg-[#121215] text-transparent hover:border-primary-600'
                    }`}
                  >
                    {isFlagged ? (
                      <AlertTriangle className="w-3.5 h-3.5 print:hidden" />
                    ) : (
                      <Check className={`w-4 h-4 print:hidden ${isChecked ? 'opacity-100' : 'opacity-0'}`} />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono tabular-nums font-bold text-xs text-muted dark:text-zinc-400">
                        #{index + 1}
                      </span>
                      <h3
                        className={`font-sans text-sm font-bold tracking-tight print:text-black ${
                          isChecked
                            ? 'line-through text-muted dark:text-zinc-400'
                            : 'text-ink dark:text-zinc-100'
                        }`}
                      >
                        {s.title}
                      </h3>
                      {s.isModelSpecific && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium font-sans bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 print:text-black print:border-black">
                          Known Model Flaw
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 font-sans text-[11px] print:text-black">
                      <span className="font-semibold text-primary-600 dark:text-primary-400 print:text-black">
                        Exposure: <span className="font-mono tabular-nums">{formatCurrency(s.minRepairUsd)}–{formatCurrency(s.maxRepairUsd)}</span>
                      </span>
                      <RiskBadge level={s.riskLevel} label={s.riskLabel} />
                      <button
                        type="button"
                        data-testid={`flag-defect-${s.id}`}
                        onClick={(e) => toggleDefectFlag(e, s.id)}
                        className={`print:hidden px-2.5 py-0.5 rounded-md text-[11px] font-sans font-semibold border transition-colors ${
                          isFlagged
                            ? 'bg-score-poor text-white border-score-poor shadow-xs'
                            : 'bg-surface dark:bg-[#121215] text-danger-text dark:text-rose-300 border-[#F5C2C7] dark:border-rose-800 hover:bg-danger-bg'
                        }`}
                      >
                        {isFlagged ? (
                          <>Defect Flagged (<span className="font-mono tabular-nums">-{formatCurrency(s.deductionUsd)}</span>)</>
                        ) : (
                          <>Flag Defect (<span className="font-mono tabular-nums">-{formatCurrency(s.deductionUsd)}</span>)</>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-body dark:text-zinc-300 mb-1.5 leading-relaxed font-sans print:text-black">
                    {s.focus}
                  </p>

                  <div className="p-2.5 rounded-lg bg-surface dark:bg-zinc-900/90 border border-border/80 dark:border-zinc-700/80 text-xs text-ink dark:text-zinc-200 leading-normal font-sans mb-2 print:border-gray-300 print:bg-gray-50 print:text-black">
                    <strong>Inspection procedure:</strong> {s.inspectionMethod}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans font-medium text-muted dark:text-zinc-400 print:text-gray-700">
                    <span>{s.keyPids}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted dark:text-zinc-400" />
                      {s.timeEst}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live On-Site Negotiation Battlecard Summary (Visible On Screen AND in Print!) */}
      <div
        id="negotiation-battlecard-summary"
        data-testid="negotiation-battlecard-summary"
        className="rounded-2xl border-2 border-primary-600/30 dark:border-primary-500/40 bg-canvas dark:bg-zinc-950/80 p-5 space-y-4 print:border-black print:bg-white page-break-inside-avoid"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border dark:border-zinc-800 print:border-black">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary-600 dark:text-primary-400 print:text-black" />
            <h3 className="font-sans text-sm sm:text-base font-bold tracking-tight text-ink dark:text-zinc-100 print:text-black">
              Live Used-Car Negotiation Battlecard
            </h3>
          </div>
          <span className="text-[11px] font-sans font-medium text-muted dark:text-zinc-400 print:text-black">
            <span className="font-mono tabular-nums">100%</span> defect deduction + <span className="font-mono tabular-nums">50%</span> due-milestone reserve
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl bg-surface dark:bg-[#121215] p-3 border border-border dark:border-zinc-800 print:border-gray-400">
            <span className="block text-[10px] font-sans font-medium uppercase text-muted print:text-gray-600">
              Seller Asking Price
            </span>
            <span className="mt-1 block text-base sm:text-lg font-bold font-mono tabular-nums text-ink dark:text-zinc-100 print:text-black">
              {formatCurrency(askingPriceUsd)}
            </span>
          </div>

          <div className="rounded-xl bg-surface dark:bg-[#121215] p-3 border border-border dark:border-zinc-800 print:border-gray-400">
            <span className="block text-[10px] font-sans font-medium uppercase text-muted print:text-gray-600">
              Flagged + Wear Deductions
            </span>
            <span
              data-testid="battlecard-total-deduction"
              className="mt-1 block text-base sm:text-lg font-bold font-mono tabular-nums text-danger-text dark:text-rose-400 print:text-black"
            >
              -{formatCurrency(negotiationTargets.totalDeductionUsd)}
            </span>
            <span className="block text-[10px] font-sans font-medium text-muted">
              <span className="font-mono tabular-nums">{negotiationTargets.flaggedSteps.length}</span> defects (<span className="font-mono tabular-nums">-{formatCurrency(negotiationTargets.flaggedDefectsUsd)}</span>) · Wear (<span className="font-mono tabular-nums">-{formatCurrency(negotiationTargets.wearReserveDeductionUsd)}</span>)
            </span>
          </div>

          <div className="rounded-xl bg-primary-600 text-white p-3 shadow-xs print:bg-white print:text-black print:border-2 print:border-black">
            <span className="block text-[10px] font-sans font-medium uppercase text-white/80 print:text-gray-700">
              Recommended Opening Offer
            </span>
            <span
              data-testid="battlecard-opening-offer"
              className="mt-1 block text-lg sm:text-xl font-bold font-mono tabular-nums"
            >
              {formatCurrency(negotiationTargets.recommendedOpeningOfferUsd)}
            </span>
          </div>

          <div className="rounded-xl bg-surface dark:bg-[#121215] p-3 border border-border dark:border-zinc-800 print:border-gray-400">
            <span className="block text-[10px] font-sans font-medium uppercase text-muted print:text-gray-600">
              Firm Walk-Away Ceiling
            </span>
            <span
              data-testid="battlecard-walkaway-ceiling"
              className="mt-1 block text-base sm:text-lg font-bold font-mono tabular-nums text-ink dark:text-zinc-100 print:text-black"
            >
              {formatCurrency(negotiationTargets.walkAwayCeilingUsd)}
            </span>
          </div>
        </div>
      </div>

      {/* Printable Notes & Signature Section (VISIBLE ONLY IN PRINT) */}
      <div className="hidden print:block pt-6 border-t-2 border-black mt-8 page-break-inside-avoid">
        <h3 className="text-sm font-bold uppercase text-black mb-2">
          On-Site Observations, Defects &amp; Negotiation Points (Written Notes):
        </h3>
        <div className="border border-gray-400 rounded h-28 w-full p-2 text-xs text-gray-500 mb-6">
          Notes: ....................................................................................................................................................................
        </div>
        <div className="grid grid-cols-2 gap-8 text-xs text-black">
          <div>
            <p>Inspector / Buyer Signature: ___________________________</p>
          </div>
          <div className="text-right">
            <p>Seller / Dealer Acknowledgment: ___________________________</p>
          </div>
        </div>
      </div>

      {/* Summary Footer Bar (Hidden in print) */}
      <div className="pt-4 border-t border-border dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted dark:text-zinc-400 print:hidden">
        <p>
          Tip: Flag discovered defects on-site, then tap <strong>Print Negotiation Battlecard</strong> to present an itemized offer.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          {onNavigateToTco && (
            <button
              type="button"
              onClick={() => onNavigateToTco()}
              className="text-primary-600 dark:text-primary-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>5-Year TCO Estimate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

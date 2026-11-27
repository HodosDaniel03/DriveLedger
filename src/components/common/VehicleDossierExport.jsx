import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  ShieldCheck,
  CheckSquare,
  DollarSign,
  FileText,
  Gauge,
} from 'lucide-react';
import { useUnits } from '../../context/UnitContext';
import { Pill } from './OdometerPrimitives';
import BrandLogo from './BrandLogo';
import {
  MAINTENANCE_COMPONENTS,
  evaluateComponentHealth,
  calculateTcoProjection,
  filterComponentsForPowertrain,
  isPureElectric,
} from '../../data/maintenanceData';

const EV_INSPECTION_CHECKLIST = [
  {
    id: 'ev-hv-soh',
    label: 'HV Battery State of Health (SoH %) & cell delta-V load check',
    detail:
      'Query BMS State of Health (SoH %) and min/max cell voltage delta (<30 mV under acceleration load at <30% SoC).',
    tag: 'HV BATTERY',
  },
  {
    id: 'ev-charging-iccu',
    label: 'Level 2 AC, DC fast-charging & heat pump thermal check',
    detail:
      'Confirm full-rate 3-phase AC and CCS/NACS DC charging handshakes, OBC/ICCU 12V charging (>13.8V), and quiet reduction gear regen.',
    tag: 'POWERTRAIN',
  },
  {
    id: 'obd-mode-scan',
    label: 'OBD2 BMS & HV isolation fault memory scan',
    detail:
      'Scan stored and pending BMS, chiller valve, and HV isolation resistance faults; confirm zero recent DTC clear tamper.',
    tag: 'TELEMETRY',
  },
  {
    id: 'ecu-cluster-mileage',
    label: 'BMS / ABS vs. Instrument Cluster mileage & DC fast-charge ratio',
    detail:
      'Cross-verify odometer against BMS cumulative kWh throughput, DC vs AC charging ratio, and chassis paint thickness.',
    tag: 'AUTHENTICITY',
  },
  {
    id: 'service-invoice-audit',
    label: 'Brake fluid, reduction gear oil & undercarriage battery shield audit',
    detail:
      'Inspect brake rotors for regenerative rust pitting, verify battery shield has zero impact dents, and review coolant/brake receipts.',
    tag: 'DOCUMENTATION',
  },
];

const DEFAULT_INSPECTION_CHECKLIST = [
  {
    id: 'cold-start-timing',
    label: 'Cold-start timing rattle check',
    detail:
      'Start engine dead-cold after overnight sit; listen for >1.5s timing chain/phaser rattle or wet-belt oil pressure lag.',
    tag: 'MECHANICAL',
  },
  {
    id: 'trans-hot-shift',
    label: 'Transmission hot shift quality',
    detail:
      'At full operating temp (>80°C ATF), test low-speed creep, reverse engagement delay, and under-load 2–3–4 shift flare or DMF chatter.',
    tag: 'DRIVETRAIN',
  },
  {
    id: 'obd-mode-scan',
    label: 'OBD2 Mode $03/$07/$0A permanent fault scan',
    detail:
      'Scan stored ($03), pending ($07), and permanent ($0A) DTCs; verify I/M readiness monitors were not recently reset to hide faults.',
    tag: 'TELEMETRY',
  },
  {
    id: 'ecu-cluster-mileage',
    label: 'ECU vs. Instrument Cluster mileage verification',
    detail:
      'Cross-verify instrument cluster odometer against ECM engine hours, TCM clutch counters, and ABS wheel-speed distance logs.',
    tag: 'AUTHENTICITY',
  },
  {
    id: 'service-invoice-audit',
    label: 'Service invoice verification for critical assemblies',
    detail:
      'Verify physical/digital invoices with exact OEM fluid approvals (ZF Lifeguard, VW 504/507, Low-SAPS) for timing, ATF, and cooling.',
    tag: 'DOCUMENTATION',
  },
];

function isOutsidePanelRect(clientX, clientY, panelEl) {
  if (!panelEl || typeof panelEl.getBoundingClientRect !== 'function' || !Number.isFinite(clientX) || !Number.isFinite(clientY)) {
    return true;
  }
  const rect = panelEl.getBoundingClientRect();
  return (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  );
}

export default function VehicleDossierExport({
  vehicle,
  tco,
  maintenanceReserve,
  odometerMiles,
  onClose,
  evaluatedComponents,
  reliabilityScore,
  scheduleMode = 'preventative',
  initialMode = 'negotiation',
}) {
  const { region, currencySymbol, formatCurrency, formatDistance, distanceUnit } = useUnits();
  const [activeMode, setActiveMode] = useState(
    initialMode === 'dossier' ? 'dossier' : 'negotiation'
  );
  const isPureEv = isPureElectric(vehicle);
  const activeChecklist = isPureEv ? EV_INSPECTION_CHECKLIST : DEFAULT_INSPECTION_CHECKLIST;
  const [checkedItems, setCheckedItems] = useState({});
  const dialogRef = useRef(null);
  const panelRef = useRef(null);
  const programmaticCloseCountRef = useRef(0);

  const closeDialogProgrammatically = (dialogEl) => {
    if (!dialogEl) return;
    if (!dialogEl.isConnected) {
      programmaticCloseCountRef.current = 0;
      try {
        if (typeof dialogEl.close === 'function' && dialogEl.open) {
          dialogEl.close();
        }
      } catch {
        // Safe guard on detached dialog
      }
      return;
    }
    if (typeof dialogEl.close !== 'function' || !dialogEl.open) return;
    const isNativeDialog =
      typeof HTMLDialogElement !== 'undefined' && dialogEl instanceof HTMLDialogElement;
    if (isNativeDialog) {
      programmaticCloseCountRef.current += 1;
    }
    try {
      dialogEl.close();
    } catch {
      if (isNativeDialog && programmaticCloseCountRef.current > 0) {
        programmaticCloseCountRef.current -= 1;
      }
    }
  };

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const dialogEl = dialogRef.current;
    if (!dialogEl) return undefined;

    if (typeof dialogEl.showModal === 'function' && !dialogEl.open) {
      try {
        dialogEl.showModal();
      } catch {
        // Safe guard in mock DOM or already-open state
      }
    }
    return () => {
      closeDialogProgrammatically(dialogEl);
    };
  }, []);

  // Light-dismiss for full-viewport <dialog> overlays (supplements closedby="any" Esc/back-gesture)
  useEffect(() => {
    if (typeof document === 'undefined' || typeof HTMLDialogElement === 'undefined') {
      return undefined;
    }

    const dialogEl = dialogRef.current;
    if (!dialogEl || typeof dialogEl.addEventListener !== 'function') return undefined;

    let pressedOutside = false;
    let suppressNextClick = false;

    const handlePointerDown = (event) => {
      pressedOutside =
        event.target === dialogEl &&
        isOutsidePanelRect(event.clientX, event.clientY, panelRef.current);
      suppressNextClick = !pressedOutside;
    };

    const handlePointerUp = (event) => {
      if (
        pressedOutside &&
        event.target === dialogEl &&
        isOutsidePanelRect(event.clientX, event.clientY, panelRef.current)
      ) {
        suppressNextClick = true;
        if (typeof onClose === 'function') onClose();
      }
      pressedOutside = false;
    };

    const handleDialogClick = (event) => {
      if (suppressNextClick) {
        suppressNextClick = false;
        return;
      }
      if (
        event.target === dialogEl &&
        !Number.isFinite(event.clientX) &&
        typeof onClose === 'function'
      ) {
        onClose();
      }
    };

    dialogEl.addEventListener('pointerdown', handlePointerDown);
    dialogEl.addEventListener('pointerup', handlePointerUp);
    dialogEl.addEventListener('click', handleDialogClick);
    return () => {
      if (typeof dialogEl.removeEventListener === 'function') {
        dialogEl.removeEventListener('pointerdown', handlePointerDown);
        dialogEl.removeEventListener('pointerup', handlePointerUp);
        dialogEl.removeEventListener('click', handleDialogClick);
      }
    };
  }, [onClose]);

  const handlePrint = () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  };

  const toggleChecklistItem = (id) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const physicalOdometerMiles = useMemo(
    () => Math.max(0, Number(odometerMiles || vehicle?.defaultOdometerMiles || 45000)),
    [odometerMiles, vehicle]
  );

  const resolvedTco = useMemo(() => {
    if (
      tco &&
      typeof tco.totalEconomicCostUsd === 'number' &&
      typeof tco.monthlyEconomicCostUsd === 'number'
    ) {
      return tco;
    }
    const price = Math.max(1000, Number(vehicle?.purchasePriceUsd) || 28000);
    const computed = calculateTcoProjection({
      purchasePriceUsd: price,
      odometerMiles: physicalOdometerMiles,
      annualDistanceMiles: Math.max(500, Number(vehicle?.annualDistanceMiles) || 12000),
      mpgUs: Number(vehicle?.mpgUs) || (isPureEv ? 28 : 32),
      isEv: isPureEv,
      powertrainType: vehicle?.powertrainType || vehicle?.powertrain,
      vehicle,
      fuelPriceUsdGal: Number(vehicle?.defaultFuelPriceUsdGal) || (isPureEv ? 0.16 : 3.85),
      annualInsuranceUsd: Math.max(0, Number(vehicle?.annualInsuranceUsd) || 1350),
      baseAnnualMaintenanceUsd: Number(vehicle?.baseAnnualMaintenanceUsd) || 850,
      maintenanceWearFactor: Number(vehicle?.maintenanceWearFactor) || 1.1,
      downPaymentPct: 20,
      aprPct: 6.2,
      loanTermMonths: 60,
      horizonYears: 5,
      residualCurve10Yr: vehicle?.residualCurve10Yr,
    });

    return {
      ...computed,
      purchasePriceUsd: price,
    };
  }, [tco, vehicle, physicalOdometerMiles, isPureEv]);

  // Automatically compute evaluatedComponents if not provided by parent (e.g. when opened from TCO tab)
  const resolvedComponents = useMemo(() => {
    if (Array.isArray(evaluatedComponents) && evaluatedComponents.length > 0) {
      return evaluatedComponents;
    }
    const relevant = filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, vehicle);
    const oilIntervalId = scheduleMode === 'oem' ? 'extended' : 'standard';

    return relevant.map((comp) => {
      const health = evaluateComponentHealth({
        component: comp,
        physicalOdometerMiles,
        urbanTripSharePct: 45,
        oilIntervalId,
        serviceHistoryId: 'verified',
        transmissionId: vehicle?.transmission || 'dct-dsg',
        vehicle,
      });
      return {
        ...comp,
        health,
      };
    });
  }, [evaluatedComponents, vehicle, physicalOdometerMiles, scheduleMode]);

  // Automatically compute reliabilityScore (0-100) if not provided by parent
  const resolvedReliabilityScore = useMemo(() => {
    if (typeof reliabilityScore === 'number' && !Number.isNaN(reliabilityScore)) {
      return reliabilityScore;
    }
    if (!resolvedComponents.length) return 75;
    const avgWear =
      resolvedComponents.reduce((acc, c) => acc + (c.health?.wearPctOfCritical || 0), 0) /
      resolvedComponents.length;
    const criticalCount = resolvedComponents.filter((c) => c.health?.status === 'CRITICAL').length;
    const warningCount = resolvedComponents.filter((c) => c.health?.status === 'WARNING').length;
    const penalty = criticalCount * 14 + warningCount * 6;
    const oemDeduction =
      scheduleMode === 'oem'
        ? Math.min(25, Math.max(18, Math.round(18 + (physicalOdometerMiles / 120000) * 7)))
        : 0;
    const raw = 100 - avgWear * 0.45 - penalty - oemDeduction;
    return Math.min(95, Math.max(18, Math.round(raw)));
  }, [reliabilityScore, resolvedComponents, scheduleMode, physicalOdometerMiles]);

  // Build Price Negotiation & Immediate Risk Deduction items
  const negotiationAnalysis = useMemo(() => {
    const askingPriceUsd = Number(
      tco?.purchasePriceUsd || vehicle?.purchasePriceUsd || 28500
    );

    const flagged = resolvedComponents.filter(
      (c) => c.health?.status === 'CRITICAL' || c.health?.status === 'WARNING'
    );

    // If vehicle is low-mileage with no CRITICAL/WARNING components yet, show top 2 highest-wear assemblies for proactive negotiation
    const targetList =
      flagged.length > 0
        ? flagged
        : [...resolvedComponents]
            .sort(
              (a, b) =>
                (b.health?.wearPctOfCritical || 0) - (a.health?.wearPctOfCritical || 0)
            )
            .slice(0, 2);

    const rows = targetList.map((item) => {
      const range = item.health?.scaledCostsUsd?.independent || item.costsUsd?.independent || [750, 1450];
      const midpoint = Math.round((range[0] + range[1]) / 2);
      const status = item.health?.status || 'OPTIMAL';
      const weight =
        status === 'CRITICAL' ? 0.85 : status === 'WARNING' ? 0.5 : 0.25;
      const deductionUsd = Math.round(midpoint * weight);

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        status,
        wearPct: item.health?.wearPctOfCritical ?? 0,
        effectiveWearMiles: item.health?.effectiveWearMiles ?? physicalOdometerMiles,
        minCostUsd: range[0],
        maxCostUsd: range[1],
        midpointUsd: midpoint,
        deductionUsd,
        weightPct: Math.round(weight * 100),
      };
    });

    const rawDeductionUsd = rows.reduce((sum, r) => sum + r.deductionUsd, 0);
    // Cap deduction at 35% of asking price for realistic negotiation bounds
    const recommendedDeductionUsd = Math.min(
      Math.round(askingPriceUsd * 0.35),
      rawDeductionUsd
    );
    const targetFairOfferUsd = Math.max(
      1500,
      askingPriceUsd - recommendedDeductionUsd
    );

    return {
      askingPriceUsd,
      rows,
      recommendedDeductionUsd,
      targetFairOfferUsd,
    };
  }, [resolvedComponents, tco, vehicle, physicalOdometerMiles]);

  const resolvedReserveUsd = useMemo(() => {
    if (typeof maintenanceReserve === 'number' && maintenanceReserve > 0) {
      return maintenanceReserve;
    }
    return Math.max(850, Math.round(negotiationAnalysis.recommendedDeductionUsd * 0.8));
  }, [maintenanceReserve, negotiationAnalysis]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  const scoreToneClass =
    resolvedReliabilityScore >= 75
      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
      : resolvedReliabilityScore >= 50
        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
        : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30';

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="dossier-modal-title"
      onClose={() => {
        if (programmaticCloseCountRef.current > 0) {
          programmaticCloseCountRef.current -= 1;
          return;
        }
        if (typeof onClose === 'function') onClose();
      }}
      className="dl-bottom-sheet-dialog dl-printable-dialog sm:items-center sm:justify-center sm:p-4"
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-4xl rounded-t-2xl sm:rounded-2xl border border-border dark:border-zinc-800 bg-surface dark:bg-[#121215] text-ink dark:text-zinc-100 p-4 sm:p-7 shadow-2xl max-h-[92dvh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:shadow-none print:border-0 print:w-full print:max-w-none print:bg-white print:text-black"
      >
        {/* Top Action & Mode Switcher Bar (hidden in print) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border dark:border-zinc-800 print:hidden">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="font-sans font-bold text-sm text-ink dark:text-zinc-100">
              Executive Telemetry Dossier
            </span>
            <Pill tone="brand">
              Print Ready 1-Page
            </Pill>
            <div
              role="tablist"
              aria-label="Export Document Mode"
              className="flex flex-wrap items-center rounded-xl bg-surface-subtle dark:bg-zinc-800 p-1 border border-border dark:border-zinc-700 max-w-full"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === 'negotiation'}
                onClick={() => setActiveMode('negotiation')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-sans text-xs font-semibold transition-colors duration-150 ${
                  activeMode === 'negotiation'
                    ? 'bg-primary-600 dark:bg-emerald-700 text-white shadow-sm'
                    : 'text-muted dark:text-zinc-300 hover:text-ink dark:hover:text-white'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Buyer&apos;s Inspection &amp; Negotiation Sheet</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === 'dossier'}
                onClick={() => setActiveMode('dossier')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-sans text-xs font-semibold transition-colors duration-150 ${
                  activeMode === 'dossier'
                    ? 'bg-primary-600 dark:bg-emerald-700 text-white shadow-sm'
                    : 'text-muted dark:text-zinc-300 hover:text-ink dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Full Telemetry Dossier</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 px-4 py-2 font-sans text-xs font-semibold text-white shadow-sm transition-colors duration-150"
            >
              <Printer className="w-4 h-4" aria-hidden="true" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg p-2 text-muted dark:text-zinc-400 hover:bg-surface-subtle dark:hover:bg-zinc-800 hover:text-ink dark:hover:text-white transition-colors"
              aria-label="Close dossier"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          id="printable-dossier"
          className="mt-5 space-y-5 text-ink dark:text-zinc-100 print:mt-0 print:space-y-3 print:text-black print:bg-white"
        >
          {/* Shared Vehicle Summary Header, Odometer & Reliability Score (0-100) Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b-2 border-primary-600 dark:border-emerald-600 print:pb-2.5 print:border-black">
            <div>
              <BrandLogo size="sm" className="mb-1.5" />
              <p className="text-[11px] font-sans tracking-wide text-primary-600 dark:text-emerald-400 print:text-black font-bold">
                DRIVELEDGER AUTOMOTIVE TELEMETRY REPORT
              </p>
              <h1
                id="dossier-modal-title"
                className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-ink dark:text-zinc-100 print:text-black mt-1"
              >
                {vehicle?.name || 'Automotive Inspection Report'}
              </h1>
              <p className="text-xs text-muted dark:text-zinc-400 print:text-black/80 mt-0.5 font-sans font-medium">
                Powertrain: {vehicle?.powertrainLabel || vehicle?.powertrain || 'Internal Combustion'} ·{' '}
                {vehicle?.powerHp ? <><span className="font-mono tabular-nums">{vehicle.powerHp}</span> HP · </> : ''}
                {vehicle?.fuelType || 'Gasoline / Diesel'} · Schedule:{' '}
                {scheduleMode === 'oem' ? 'OEM Marketing Intervals' : 'Engineering Preventative'}
              </p>
            </div>

            <div className="flex items-center sm:flex-col sm:items-end justify-between gap-3">
              {/* Reliability Score (0-100) Badge */}
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-sans ${scoreToneClass} print:border-black print:text-black print:bg-transparent`}
              >
                <Gauge className="w-4 h-4 shrink-0" aria-hidden="true" />
                <div className="text-left sm:text-right">
                  <span className="block text-[11px] font-medium">
                    Reliability Score
                  </span>
                  <span className="text-sm font-mono font-bold tabular-nums">
                    {resolvedReliabilityScore}/100
                  </span>
                </div>
              </div>
              <div className="text-right text-xs font-sans text-muted dark:text-zinc-400 print:text-black">
                <p>Generated: {currentDate}</p>
                <p className="font-semibold text-ink dark:text-zinc-200 print:text-black">
                  Inspection Mileage: <span className="font-mono tabular-nums">{formatDistance(physicalOdometerMiles)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* =====================================================================
              MODE 1: BUYER'S INSPECTION & NEGOTIATION SHEET
             ===================================================================== */}
          <div
            className={
              activeMode === 'negotiation'
                ? 'space-y-5 print:space-y-3'
                : 'hidden'
            }
          >
            {/* Price Negotiation & Immediate Risk Deduction Table */}
            <div>
              <div className="flex items-center justify-between mb-2.5 gap-2">
                <h2 className="text-xs sm:text-sm font-bold font-sans text-primary-600 dark:text-emerald-400 print:text-black flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Price Negotiation &amp; Immediate Risk Deduction Table</span>
                </h2>
                <span className="text-[11px] font-sans font-medium text-muted dark:text-zinc-400 print:text-black">
                  Independent Specialist Benchmark Rates
                </span>
              </div>

              <div className="rounded-xl border border-border dark:border-zinc-800 print:border-black/40 overflow-hidden bg-surface dark:bg-[#121215] print:bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-sans">
                    <thead>
                      <tr className="border-b border-border dark:border-zinc-800 print:border-black/30 bg-surface-subtle dark:bg-zinc-800/80 print:bg-transparent text-[11px] font-sans font-semibold text-muted dark:text-zinc-300 print:text-black">
                        <th scope="col" className="py-2.5 px-3">Component / Assembly</th>
                        <th scope="col" className="py-2.5 px-3">Risk Status</th>
                        <th scope="col" className="py-2.5 px-3 text-right">Est. Repair Range</th>
                        <th scope="col" className="py-2.5 px-3 text-right">Negotiation Deduction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-zinc-800 print:divide-black/20">
                      {negotiationAnalysis.rows.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-surface-subtle/50 dark:hover:bg-zinc-800/40"
                        >
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-ink dark:text-zinc-100 print:text-black">
                              {row.name}
                            </p>
                            <p className="text-[11px] text-muted dark:text-zinc-400 print:text-black/75 font-sans">
                              {row.category} · Effective Wear: <span className="font-mono tabular-nums">{formatDistance(row.effectiveWearMiles)} ({row.wearPct}%</span> of limit)
                            </p>
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-sans font-medium ${
                                row.status === 'CRITICAL'
                                  ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
                                  : row.status === 'WARNING'
                                    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                                    : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                              } print:border-black print:text-black print:bg-transparent`}
                            >
                              {row.status} (<span className="font-mono tabular-nums">{row.weightPct}%</span> Weight)
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-body dark:text-zinc-300 print:text-black">
                            {formatCurrency(row.minCostUsd)} – {formatCurrency(row.maxCostUsd)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-rose-700 dark:text-rose-400 print:text-black">
                            -{formatCurrency(row.deductionUsd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Offer Summary Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-surface-subtle dark:bg-zinc-800/90 print:bg-transparent border-t border-border dark:border-zinc-700 print:border-black">
                  <div className="rounded-lg border border-border dark:border-zinc-700 print:border-black/40 bg-surface dark:bg-[#121215] print:bg-white p-2.5">
                    <p className="text-[11px] font-sans font-medium text-muted dark:text-zinc-400 print:text-black">
                      Seller Asking / Reference Price
                    </p>
                    <p className="text-base font-bold font-mono tabular-nums text-ink dark:text-zinc-100 print:text-black mt-0.5">
                      {formatCurrency(negotiationAnalysis.askingPriceUsd)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-rose-500/30 dark:border-rose-500/40 print:border-black/40 bg-rose-500/5 dark:bg-rose-950/30 print:bg-white p-2.5">
                    <p className="text-[11px] font-sans text-rose-700 dark:text-rose-300 print:text-black font-semibold">
                      Recommended Price Negotiation Deduction ({currencySymbol})
                    </p>
                    <p className="text-base font-bold font-mono tabular-nums text-rose-700 dark:text-rose-400 print:text-black mt-0.5">
                      -{formatCurrency(negotiationAnalysis.recommendedDeductionUsd)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-500/40 dark:border-emerald-500/40 print:border-black bg-emerald-500/10 dark:bg-emerald-950/30 print:bg-white p-2.5">
                    <p className="text-[11px] font-sans text-emerald-800 dark:text-emerald-300 print:text-black font-semibold">
                      Target Walk-Away / Fair Offer Price ({currencySymbol})
                    </p>
                    <p className="text-base font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-300 print:text-black mt-0.5">
                      {formatCurrency(negotiationAnalysis.targetFairOfferUsd)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* On-Site Physical & OBD2 Pre-Purchase Inspection Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2.5 gap-2">
                <h2 className="text-xs sm:text-sm font-bold font-sans text-primary-600 dark:text-emerald-400 print:text-black flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>On-Site Physical &amp; OBD2 Pre-Purchase Inspection Checklist</span>
                </h2>
                <span className="text-[11px] font-sans font-semibold text-primary-600 dark:text-emerald-400 print:text-black">
                  <span className="font-mono tabular-nums">{checkedCount}/{activeChecklist.length}</span> Verified
                </span>
              </div>

              <div className="rounded-xl border border-border dark:border-zinc-800 print:border-black/40 divide-y divide-border dark:divide-zinc-800 print:divide-black/20 bg-surface dark:bg-[#121215] print:bg-white">
                {activeChecklist.map((item) => {
                  const isChecked = !!checkedItems[item.id];
                  return (
                    <label
                      key={item.id}
                      htmlFor={`inspection-check-${item.id}`}
                      className="flex items-start gap-3 p-3 cursor-pointer hover:bg-surface-subtle/60 dark:hover:bg-zinc-800/50 transition-colors font-sans"
                    >
                      <input
                        id={`inspection-check-${item.id}`}
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleChecklistItem(item.id)}
                        className="mt-0.5 h-4 w-4 rounded border-border-strong dark:border-zinc-600 accent-primary-600 dark:accent-emerald-500 text-primary-600 print:border-black"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`text-xs font-semibold ${
                              isChecked
                                ? 'line-through text-muted dark:text-zinc-400 print:no-underline print:text-black'
                                : 'text-ink dark:text-zinc-100 print:text-black'
                            }`}
                          >
                            {item.label}
                          </span>
                          <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-md bg-surface-subtle dark:bg-zinc-800 text-muted dark:text-zinc-300 border border-border dark:border-zinc-700 print:border-black/30 print:text-black print:bg-transparent">
                            {item.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-body dark:text-zinc-300 print:text-black/80 mt-0.5 leading-snug">
                          {item.detail}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* =====================================================================
              MODE 2: FULL TELEMETRY DOSSIER (Always mounted in DOM for instant switch & test integrity)
             ===================================================================== */}
          <div
            className={
              activeMode === 'dossier'
                ? 'space-y-5 print:space-y-3'
                : 'hidden'
            }
          >
            {/* Section 1: Financial Ownership Summary */}
            <div>
              <h2 className="text-xs sm:text-sm font-bold font-sans text-primary-600 dark:text-emerald-400 print:text-black mb-3">
                1. {resolvedTco.yearlySchedule?.length || 5}-Year True Cost of Ownership Projections ({resolvedTco.yearlySchedule?.length || 5}-Year TCO Projections)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
                <div className="rounded-xl border border-border dark:border-zinc-800 print:border-black/30 bg-surface-subtle dark:bg-zinc-800/70 print:bg-white p-3 text-center">
                  <p className="text-[11px] text-muted dark:text-zinc-400 print:text-black">
                    Monthly Cost
                  </p>
                  <p className="text-lg font-bold font-mono tabular-nums text-ink dark:text-zinc-100 print:text-black mt-0.5">
                    {formatCurrency(resolvedTco.monthlyEconomicCostUsd)}/mo
                  </p>
                </div>
                <div className="rounded-xl border border-border dark:border-zinc-800 print:border-black/30 bg-surface-subtle dark:bg-zinc-800/70 print:bg-white p-3 text-center">
                  <p className="text-[11px] text-muted dark:text-zinc-400 print:text-black">
                    Cost per {distanceUnit}
                  </p>
                  <p className="text-lg font-bold font-mono tabular-nums text-ink dark:text-zinc-100 print:text-black mt-0.5">
                    {formatCurrency(
                      (resolvedTco.costPerMileUsd || 0.45) / (region === 'EU' ? 1.60934 : 1.0),
                      2
                    )}/{distanceUnit}
                  </p>
                </div>
                <div className="rounded-xl border border-border dark:border-zinc-800 print:border-black/30 bg-surface-subtle dark:bg-zinc-800/70 print:bg-white p-3 text-center">
                  <p className="text-[11px] text-muted dark:text-zinc-400 print:text-black">
                    {resolvedTco.yearlySchedule?.length || 5}-Year Total Cost
                  </p>
                  <p className="text-lg font-bold font-mono tabular-nums text-ink dark:text-zinc-100 print:text-black mt-0.5">
                    {formatCurrency(resolvedTco.totalEconomicCostUsd)}
                  </p>
                </div>
                <div className="rounded-xl border border-border dark:border-zinc-800 print:border-black/30 bg-surface-subtle dark:bg-zinc-800/70 print:bg-white p-3 text-center">
                  <p className="text-[11px] text-muted dark:text-zinc-400 print:text-black">
                    {resolvedTco.financeType === 'lease' && resolvedTco.leaseDetails ? 'Lease Residual' : 'Residual Retention'}
                  </p>
                  <p className="text-lg font-bold font-mono tabular-nums text-primary-700 dark:text-emerald-400 print:text-black mt-0.5">
                    {resolvedTco.financeType === 'lease' && resolvedTco.leaseDetails
                      ? `${resolvedTco.leaseDetails.residualPct}%`
                      : `${resolvedTco.finalRetentionPct || 48}%`}
                  </p>
                </div>
              </div>
              {resolvedTco.financeType === 'lease' && resolvedTco.leaseDetails && (
                <div
                  data-testid="dossier-lease-terms"
                  className="mt-3 rounded-xl border border-emerald-500/30 dark:border-emerald-800/50 print:border-black/40 bg-emerald-50/70 dark:bg-emerald-950/30 print:bg-white px-3.5 py-2.5 text-xs font-sans text-emerald-900 dark:text-emerald-200 print:text-black flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="font-semibold">
                    Active Lease Structure ({resolvedTco.leaseDetails.leaseTermMonths} mos):{' '}
                    <span className="font-mono tabular-nums">{formatCurrency(resolvedTco.leaseDetails.monthlyLeasePaymentUsd)}/mo</span>
                  </span>
                  <span className="font-mono tabular-nums text-[11px]">
                    Residual {formatCurrency(resolvedTco.leaseDetails.residualValueUsd)} ({resolvedTco.leaseDetails.residualPct}%) · MF {resolvedTco.leaseDetails.moneyFactor.toFixed(5)} · Acq. Fee {formatCurrency(resolvedTco.leaseDetails.acquisitionFeeUsd)}
                  </span>
                </div>
              )}
            </div>

            {/* Section 2: Mechanical Wear & Maintenance Reserve */}
            <div>
              <h2 className="text-xs sm:text-sm font-bold font-sans text-primary-600 dark:text-emerald-400 print:text-black mb-3">
                2. Mechanical Wear &amp; Maintenance Reserve (12-Month Maintenance Reserve &amp; Critical Known Defects)
              </h2>
              <div className="rounded-xl border border-border dark:border-zinc-800 print:border-black/30 p-4 bg-surface-subtle dark:bg-zinc-800/70 print:bg-white space-y-3 font-sans">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink dark:text-zinc-100 print:text-black">
                    12-Month Recommended Service Reserve:
                  </span>
                  <span className="font-bold font-mono tabular-nums text-ink dark:text-zinc-100 print:text-black text-sm">
                    {formatCurrency(resolvedReserveUsd)}
                  </span>
                </div>
                <p className="text-xs text-body dark:text-zinc-300 print:text-black/80 leading-relaxed">
                  Calculated using statistical failure distributions, urban duty cycle thermal penalties, and component wear curves calibrated against real-world fleet maintenance datasets.
                </p>

                {/* Critical Known Defects Callout */}
                {(vehicle?.criticalDefectTag || vehicle?.knownRiskNotes) && (
                  <div className="mt-2.5 pt-2.5 border-t border-border dark:border-zinc-700 print:border-black/30 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-danger-text dark:text-rose-400 print:text-black font-sans text-[11px]">
                        {vehicle?.criticalDefectTag || '⚠️ KNOWN POWERTRAIN RISK ADVISORY'}
                      </span>
                    </div>
                    <p className="text-body dark:text-zinc-300 print:text-black leading-relaxed">
                      {vehicle?.knownRiskNotes ||
                        'Routine inspection of turbo oil feed lines, DPF differential pressure, and transmission solenoids recommended.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Diagnostic Telemetry Protocol & Known Faults */}
            <div>
              <h2 className="text-xs sm:text-sm font-bold font-sans text-primary-600 dark:text-emerald-400 print:text-black mb-3">
                3. Master Diagnostic Verification Protocol
              </h2>
              <div className="rounded-xl border border-border dark:border-zinc-800 print:border-black/30 p-4 space-y-2 text-xs font-sans bg-surface dark:bg-[#121215] print:bg-white">
                <div className="flex items-center justify-between gap-3 py-1 border-b border-border dark:border-zinc-800 print:border-black/20">
                  <span className="text-body dark:text-zinc-300 print:text-black">
                    Common Marque OBD-II Codes to Scan:
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-primary-600 dark:text-emerald-400 print:text-black">
                    {(vehicle?.commonObdCodes || ['P0420', 'P2002', 'P0171']).join(' · ')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 py-1 border-b border-border dark:border-zinc-800 print:border-black/20">
                  <span className="text-body dark:text-zinc-300 print:text-black">
                    Live Sensor PIDs to Monitor:
                  </span>
                  <span className="font-sans font-medium text-muted dark:text-zinc-400 print:text-black text-right">
                    {isPureEv
                      ? 'BMS SoH %, Cell Voltage Delta (mV), HV Isolation Resistance, Chiller Valve, OBC Current'
                      : 'MAF, Boost Pressure, DPF Delta-P, Fuel Rail Pressure, STFT/LTFT'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-body dark:text-zinc-300 print:text-black">
                    Odometer Rollback Inspection:
                  </span>
                  <span className="font-sans text-success-text dark:text-emerald-400 print:text-black font-semibold text-right">
                    {isPureEv
                      ? 'Cross-verify BMS cumulative kWh throughput & ABS logs vs cluster odometer'
                      : 'Cross-verify ECU hours vs transmission control module log'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shared Master Inspector & Buyer Sign-Off Footer */}
          <div className="pt-3 border-t border-border dark:border-zinc-800 print:border-black grid grid-cols-2 gap-6 text-xs font-sans">
            <div>
              <p className="text-muted dark:text-zinc-400 print:text-black font-medium text-[11px]">
                Inspection Technician / Buyer Sign-Off
              </p>
              <div className="mt-3 border-b border-border dark:border-zinc-700 print:border-black h-5"></div>
              <p className="mt-1 text-muted dark:text-zinc-400 print:text-black">
                Signature, VIN &amp; Agreed Offer Price
              </p>
            </div>
            <div>
              <p className="text-muted dark:text-zinc-400 print:text-black font-medium text-[11px]">
                Verification Status
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-success-text dark:text-emerald-400 print:text-black font-bold">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  TELEMETRY VERIFIED
                </span>
              </div>
              <p className="mt-1 text-muted dark:text-zinc-400 print:text-black">
                Odometer &amp; Title Authentic · Score <span className="font-mono tabular-nums">{resolvedReliabilityScore}/100</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

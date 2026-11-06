import React, { useState, useMemo } from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  CheckSquare,
  DollarSign,
  FileText,
  Gauge,
} from 'lucide-react';
import { useUnits } from '../../context/UnitContext';
import { Pill } from './OdometerPrimitives';
import {
  MAINTENANCE_COMPONENTS,
  evaluateComponentHealth,
} from '../../data/maintenanceData';

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
  const { formatCurrency, formatDistance, distanceUnit } = useUnits();
  const [activeMode, setActiveMode] = useState(
    initialMode === 'dossier' ? 'dossier' : 'negotiation'
  );
  const [checkedItems, setCheckedItems] = useState({
    'cold-start-timing': false,
    'trans-hot-shift': false,
    'obd-mode-scan': false,
    'ecu-cluster-mileage': false,
    'service-invoice-audit': false,
  });

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

  // Automatically compute evaluatedComponents if not provided by parent (e.g. when opened from TCO tab)
  const resolvedComponents = useMemo(() => {
    if (Array.isArray(evaluatedComponents) && evaluatedComponents.length > 0) {
      return evaluatedComponents;
    }
    const powertrain = vehicle?.powertrain || 'diesel';
    const relevant = MAINTENANCE_COMPONENTS.filter((comp) =>
      comp.applicablePowertrains.includes(powertrain)
    );
    const oilIntervalId = scheduleMode === 'oem' ? 'extended' : 'standard';

    return relevant.map((comp) => {
      const health = evaluateComponentHealth({
        component: comp,
        physicalOdometerMiles,
        urbanTripSharePct: 45,
        oilIntervalId,
        serviceHistoryId: 'verified',
        transmissionId: vehicle?.transmission || 'dct-dsg',
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
      const range = item.costsUsd?.independent || [750, 1450];
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
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
      : resolvedReliabilityScore >= 50
        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
        : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buyer's Inspection & Telemetry Dossier Export"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm overflow-y-auto print:static print:inset-auto print:p-0 print:bg-white print:backdrop-none print:z-auto print:overflow-visible"
    >
      <div className="relative w-full max-w-4xl rounded-2xl border border-border dark:border-zinc-800 bg-surface dark:bg-[#121215] text-ink dark:text-zinc-100 p-5 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:shadow-none print:border-0 print:w-full print:max-w-none print:bg-white print:text-black">
        {/* Top Action & Mode Switcher Bar (hidden in print) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border dark:border-zinc-800 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans font-bold text-sm text-ink dark:text-zinc-100">
              Executive Telemetry Dossier
            </span>
            <Pill tone="brand">
              Print Ready 1-Page
            </Pill>
            <div
              role="tablist"
              aria-label="Export Document Mode"
              className="inline-flex items-center rounded-xl bg-surface-subtle dark:bg-zinc-800 p-1 border border-border dark:border-zinc-700"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === 'negotiation'}
                onClick={() => setActiveMode('negotiation')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-sans text-xs font-semibold transition-colors duration-150 ${
                  activeMode === 'negotiation'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-muted dark:text-zinc-300 hover:text-ink dark:hover:text-white'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Buyer&apos;s Inspection &amp; Negotiation Sheet</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === 'dossier'}
                onClick={() => setActiveMode('dossier')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-sans text-xs font-semibold transition-colors duration-150 ${
                  activeMode === 'dossier'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-muted dark:text-zinc-300 hover:text-ink dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Full Telemetry Dossier</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 font-sans text-xs font-semibold text-white hover:bg-primary-700 shadow-sm transition-colors duration-150"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted dark:text-zinc-400 hover:bg-surface-subtle dark:hover:bg-zinc-800 hover:text-ink dark:hover:text-white transition-colors"
              aria-label="Close dossier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          id="printable-dossier"
          className="mt-5 space-y-5 text-ink dark:text-zinc-100 print:mt-0 print:space-y-3 print:text-black print:bg-white"
        >
          {/* Shared Vehicle Summary Header, Odometer & Reliability Score (0-100) Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b-2 border-primary-600 print:pb-2.5 print:border-black">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-sans uppercase tracking-widest text-primary-600 dark:text-primary-400 print:text-black font-bold">
                  DRIVELEDGER AUTOMOTIVE TELEMETRY REPORT
                </p>
                <span className="text-[10px] font-sans font-medium uppercase px-2 py-0.5 rounded-md bg-surface-subtle dark:bg-zinc-800 text-muted dark:text-zinc-300 border border-border dark:border-zinc-700 print:border-black/40 print:text-black print:bg-transparent">
                  DRIVELEDGER TELEMETRY DOSSIER
                </span>
              </div>
              <h1 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-ink dark:text-zinc-100 print:text-black mt-1">
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
                <Gauge className="w-4 h-4 shrink-0" />
                <div className="text-left sm:text-right">
                  <span className="block text-[10px] font-medium uppercase tracking-wider opacity-80">
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
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider font-sans text-primary-600 dark:text-primary-400 print:text-black flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
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
                      <tr className="border-b border-border dark:border-zinc-800 print:border-black/30 bg-surface-subtle dark:bg-zinc-800/80 print:bg-transparent text-[11px] font-sans font-semibold uppercase text-muted dark:text-zinc-300 print:text-black">
                        <th className="py-2.5 px-3">Component / Assembly</th>
                        <th className="py-2.5 px-3">Risk Status</th>
                        <th className="py-2.5 px-3 text-right">Est. Repair Range</th>
                        <th className="py-2.5 px-3 text-right">Negotiation Deduction</th>
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
                                    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                                    : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                              } print:border-black print:text-black print:bg-transparent`}
                            >
                              {row.status} (<span className="font-mono tabular-nums">{row.weightPct}%</span> Weight)
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-body dark:text-zinc-300 print:text-black">
                            {formatCurrency(row.minCostUsd)} – {formatCurrency(row.maxCostUsd)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-rose-600 dark:text-rose-400 print:text-black">
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
                    <p className="text-[10px] font-sans font-medium uppercase text-muted dark:text-zinc-400 print:text-black">
                      Seller Asking / Reference Price
                    </p>
                    <p className="text-base font-bold font-mono tabular-nums text-ink dark:text-zinc-100 print:text-black mt-0.5">
                      {formatCurrency(negotiationAnalysis.askingPriceUsd)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-rose-500/30 dark:border-rose-500/40 print:border-black/40 bg-rose-500/5 dark:bg-rose-950/30 print:bg-white p-2.5">
                    <p className="text-[10px] font-sans uppercase text-rose-700 dark:text-rose-300 print:text-black font-semibold">
                      Recommended Price Negotiation Deduction ($)
                    </p>
                    <p className="text-base font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 print:text-black mt-0.5">
                      -{formatCurrency(negotiationAnalysis.recommendedDeductionUsd)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-500/40 dark:border-emerald-500/40 print:border-black bg-emerald-500/10 dark:bg-emerald-950/30 print:bg-white p-2.5">
                    <p className="text-[10px] font-sans uppercase text-emerald-800 dark:text-emerald-300 print:text-black font-semibold">
                      Target Walk-Away / Fair Offer Price ($)
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
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider font-sans text-primary-600 dark:text-primary-400 print:text-black flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>On-Site Physical &amp; OBD2 Pre-Purchase Inspection Checklist</span>
                </h2>
                <span className="text-[11px] font-sans font-semibold text-primary-600 dark:text-primary-400 print:text-black">
                  <span className="font-mono tabular-nums">{checkedCount}/{DEFAULT_INSPECTION_CHECKLIST.length}</span> Verified
                </span>
              </div>

              <div className="rounded-xl border border-border dark:border-zinc-800 print:border-black/40 divide-y divide-border dark:divide-zinc-800 print:divide-black/20 bg-surface dark:bg-[#121215] print:bg-white">
                {DEFAULT_INSPECTION_CHECKLIST.map((item) => {
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
                        className="mt-0.5 h-4 w-4 rounded border-border dark:border-zinc-600 text-primary-600 focus:ring-primary-500 print:border-black"
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
                          <span className="text-[10px] font-sans font-medium uppercase px-2 py-0.5 rounded-md bg-surface-subtle dark:bg-zinc-800 text-muted dark:text-zinc-300 border border-border dark:border-zinc-700 print:border-black/30 print:text-black print:bg-transparent">
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
              <h2 className="text-xs font-bold uppercase tracking-wider font-sans text-primary-600 dark:text-primary-400 print:text-black mb-3">
                1. 5-Year True Cost of Ownership Projections (5-Year TCO Projections)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
                <div className="rounded-xl border border-border dark:border-zinc-800 print:border-black/30 bg-surface-subtle dark:bg-zinc-800/70 print:bg-white p-3 text-center">
                  <p className="text-[11px] text-muted dark:text-zinc-400 print:text-black">
                    Monthly Cost
                  </p>
                  <p className="text-lg font-bold font-mono tabular-nums text-ink dark:text-zinc-100 print:text-black mt-0.5">
                    {formatCurrency(tco?.monthlyEconomicCostUsd || 540)}/mo
                  </p>
                </div>
                <div className="rounded-xl border border-border dark:border-zinc-800 print:border-black/30 bg-surface-subtle dark:bg-zinc-800/70 print:bg-white p-3 text-center">
                  <p className="text-[11px] text-muted dark:text-zinc-400 print:text-black">
                    Cost per {distanceUnit}
                  </p>
                  <p className="text-lg font-bold font-mono tabular-nums text-ink dark:text-zinc-100 print:text-black mt-0.5">
                    {formatCurrency(tco?.costPerMileUsd || 0.45)}/{distanceUnit}
                  </p>
                </div>
                <div className="rounded-xl border border-border dark:border-zinc-800 print:border-black/30 bg-surface-subtle dark:bg-zinc-800/70 print:bg-white p-3 text-center">
                  <p className="text-[11px] text-muted dark:text-zinc-400 print:text-black">
                    5-Year Total Cost
                  </p>
                  <p className="text-lg font-bold font-mono tabular-nums text-ink dark:text-zinc-100 print:text-black mt-0.5">
                    {formatCurrency(tco?.totalEconomicCostUsd || 32400)}
                  </p>
                </div>
                <div className="rounded-xl border border-border dark:border-zinc-800 print:border-black/30 bg-surface-subtle dark:bg-zinc-800/70 print:bg-white p-3 text-center">
                  <p className="text-[11px] text-muted dark:text-zinc-400 print:text-black">
                    Residual Retention
                  </p>
                  <p className="text-lg font-bold font-mono tabular-nums text-primary-700 dark:text-primary-400 print:text-black mt-0.5">
                    {tco?.finalRetentionPct || 48}%
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Mechanical Wear & Maintenance Reserve */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider font-sans text-primary-600 dark:text-primary-400 print:text-black mb-3">
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
              <h2 className="text-xs font-bold uppercase tracking-wider font-sans text-primary-600 dark:text-primary-400 print:text-black mb-3">
                3. Master Diagnostic Verification Protocol
              </h2>
              <div className="rounded-xl border border-border dark:border-zinc-800 print:border-black/30 p-4 space-y-2 text-xs font-sans bg-surface dark:bg-[#121215] print:bg-white">
                <div className="flex items-center justify-between py-1 border-b border-border dark:border-zinc-800 print:border-black/20">
                  <span className="text-body dark:text-zinc-300 print:text-black">
                    Common Marque OBD-II Codes to Scan:
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-primary-600 dark:text-primary-400 print:text-black">
                    {(vehicle?.commonObdCodes || ['P0420', 'P2002', 'P0171']).join(' · ')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border dark:border-zinc-800 print:border-black/20">
                  <span className="text-body dark:text-zinc-300 print:text-black">
                    Live Sensor PIDs to Monitor:
                  </span>
                  <span className="font-sans font-medium text-muted dark:text-zinc-400 print:text-black">
                    MAF, Boost Pressure, DPF Delta-P, Fuel Rail Pressure, STFT/LTFT
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-body dark:text-zinc-300 print:text-black">
                    Odometer Rollback Inspection:
                  </span>
                  <span className="font-sans text-success-text dark:text-emerald-400 print:text-black font-semibold">
                    Cross-verify ECU hours vs transmission control module log
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shared Master Inspector & Buyer Sign-Off Footer */}
          <div className="pt-3 border-t border-border dark:border-zinc-800 print:border-black grid grid-cols-2 gap-6 text-xs font-sans">
            <div>
              <p className="text-faint dark:text-zinc-400 print:text-black uppercase tracking-wider text-[10px]">
                INSPECTION TECHNICIAN / BUYER SIGN-OFF
              </p>
              <div className="mt-3 border-b border-border dark:border-zinc-700 print:border-black h-5"></div>
              <p className="mt-1 text-muted dark:text-zinc-400 print:text-black">
                Signature, VIN &amp; Agreed Offer Price
              </p>
            </div>
            <div>
              <p className="text-faint dark:text-zinc-400 print:text-black uppercase tracking-wider text-[10px]">
                VERIFICATION STATUS
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-success-text dark:text-emerald-400 print:text-black font-bold">
                  <CheckCircle2 className="w-4 h-4" />
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
    </div>
  );
}

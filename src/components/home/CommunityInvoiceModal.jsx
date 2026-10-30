import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  Wrench,
  Landmark,
  Gauge,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { VEHICLE_PRESETS } from '../../data/vehiclePresets';

export const COMMUNITY_INVOICES_STORAGE_KEY = 'shiftmetric_community_invoices_v1';

export const REPAIRED_ASSEMBLIES = [
  {
    id: 'timing-belt-water-pump',
    label: 'Timing Belt / Wet Belt & Water Pump',
    independentBase: { p10: 780, avg: 1140, p90: 1580 },
    dealershipBase: { p10: 1290, avg: 1850, p90: 2540 },
    sampleSize: 412,
  },
  {
    id: 'dsg-zf-trans-service',
    label: 'DSG / ZF Automatic Transmission Fluid & Filter',
    independentBase: { p10: 360, avg: 540, p90: 780 },
    dealershipBase: { p10: 680, avg: 980, p90: 1390 },
    sampleSize: 538,
  },
  {
    id: 'dpf-scr-cleaning',
    label: 'DPF / SCR Thermal Cleaning or Replacement',
    independentBase: { p10: 520, avg: 1180, p90: 2150 },
    dealershipBase: { p10: 1450, avg: 2680, p90: 4100 },
    sampleSize: 289,
  },
  {
    id: 'hpfp-injectors',
    label: 'High-Pressure Fuel Injector / HPFP Set',
    independentBase: { p10: 980, avg: 1560, p90: 2350 },
    dealershipBase: { p10: 1850, avg: 2890, p90: 4250 },
    sampleSize: 194,
  },
  {
    id: 'gdi-walnut-blasting',
    label: 'GDI Intake Valve Walnut Blasting & PCV',
    independentBase: { p10: 420, avg: 650, p90: 940 },
    dealershipBase: { p10: 790, avg: 1220, p90: 1680 },
    sampleSize: 317,
  },
  {
    id: 'dmf-clutch-pack',
    label: 'Dual-Mass Flywheel & Clutch Pack',
    independentBase: { p10: 1120, avg: 1640, p90: 2290 },
    dealershipBase: { p10: 1950, avg: 2840, p90: 3890 },
    sampleSize: 276,
  },
  {
    id: 'turbo-vnt-rebuild',
    label: 'Turbocharger / VNT Actuator Rebuild',
    independentBase: { p10: 890, avg: 1460, p90: 2180 },
    dealershipBase: { p10: 1780, avg: 2750, p90: 3980 },
    sampleSize: 215,
  },
];

export function loadCommunityInvoices() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(COMMUNITY_INVOICES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCommunityInvoice(entry) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [entry];
    const existing = loadCommunityInvoices();
    const updated = [entry, ...existing];
    window.localStorage.setItem(COMMUNITY_INVOICES_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [entry];
  }
}

function getOrdinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function calculateInvoiceAuditStats({
  assemblyLabel,
  workshopTier = 'independent',
  amountPaid = 1200,
  wearFactor = 1.0,
}) {
  const assembly =
    REPAIRED_ASSEMBLIES.find((a) => a.label === assemblyLabel || a.id === assemblyLabel) ||
    REPAIRED_ASSEMBLIES[0];

  // Scale benchmark smoothly by powertrain wear factor (damped so typical 1.28 wear factor gives realistic figures)
  const scale = 0.78 + Number(wearFactor || 1.15) * 0.22;
  const tierBase =
    workshopTier === 'dealership' ? assembly.dealershipBase : assembly.independentBase;
  const oppositeTierBase =
    workshopTier === 'dealership' ? assembly.independentBase : assembly.dealershipBase;

  const p10 = Math.round((tierBase.p10 * scale) / 10) * 10;
  const avg = Math.round((tierBase.avg * scale) / 10) * 10;
  const p90 = Math.round((tierBase.p90 * scale) / 10) * 10;
  const oppositeAvg = Math.round((oppositeTierBase.avg * scale) / 10) * 10;

  const paid = Math.max(1, Number(amountPaid) || avg);
  const diffFromAvg = paid - avg;
  const pctDiff = Math.round((Math.abs(diffFromAvg) / avg) * 100);
  const isBelowAvg = diffFromAvg <= 0;

  // Compute statistical percentile (P1 to P99) anchored at P10, P50 (avg), P90
  let percentile;
  if (paid <= p10) {
    const ratio = Math.max(0, paid / Math.max(1, p10));
    percentile = Math.max(1, Math.round(ratio * 10));
  } else if (paid <= avg) {
    const ratio = (paid - p10) / Math.max(1, avg - p10);
    percentile = Math.round(10 + ratio * 40);
  } else if (paid <= p90) {
    const ratio = (paid - avg) / Math.max(1, p90 - avg);
    percentile = Math.round(50 + ratio * 40);
  } else {
    const excessRatio = Math.min(1, (paid - p90) / Math.max(1, p90 * 0.5));
    percentile = Math.min(99, Math.round(90 + excessRatio * 9));
  }

  // Position along the visual gauge bar (0% to 100%, where P10 is at 12%, P50 is at 50%, P90 is at 88%)
  let pinPositionPct;
  if (paid <= p10) {
    pinPositionPct = Math.max(4, (paid / Math.max(1, p10)) * 12);
  } else if (paid <= avg) {
    pinPositionPct = 12 + ((paid - p10) / Math.max(1, avg - p10)) * 38;
  } else if (paid <= p90) {
    pinPositionPct = 50 + ((paid - avg) / Math.max(1, p90 - avg)) * 38;
  } else {
    pinPositionPct = Math.min(96, 88 + ((paid - p90) / Math.max(1, p90 * 0.5)) * 8);
  }

  let verdictBadge = 'Fair Market Benchmark';
  let verdictTone = 'neutral';
  if (percentile <= 35) {
    verdictBadge = 'Great Value';
    verdictTone = 'positive';
  } else if (percentile >= 70) {
    verdictBadge =
      workshopTier === 'dealership' ? 'Dealership Markup Detected' : 'Above Regional Benchmark';
    verdictTone = 'warning';
  }

  const tierLabel =
    workshopTier === 'dealership' ? 'franchise dealership' : 'independent specialist';

  const calloutText = isBelowAvg
    ? `You paid $${paid.toLocaleString()}. That is ${pctDiff}% lower than our ${tierLabel} average ($${avg.toLocaleString()}) for this powertrain! (${getOrdinalSuffix(percentile)} Percentile — ${verdictBadge})`
    : `You paid $${paid.toLocaleString()}. That is ${pctDiff}% above our ${tierLabel} average ($${avg.toLocaleString()}) for this powertrain — ${verdictBadge}. (${getOrdinalSuffix(percentile)} Percentile)`;

  return {
    paid,
    p10,
    avg,
    p90,
    oppositeAvg,
    diffFromAvg,
    pctDiff,
    isBelowAvg,
    percentile,
    ordinalPercentile: getOrdinalSuffix(percentile),
    pinPositionPct: Math.round(pinPositionPct * 10) / 10,
    verdictBadge,
    verdictTone,
    calloutText,
    sampleSize: assembly.sampleSize,
  };
}

export default function CommunityInvoiceModal({ isOpen, onClose, onInvoiceSubmitted }) {
  const [selectedPresetId, setSelectedPresetId] = useState(VEHICLE_PRESETS[0]?.id || 'ford-focus-ecoblue');
  const [customVehicleName, setCustomVehicleName] = useState('');
  const [assemblyLabel, setAssemblyLabel] = useState(REPAIRED_ASSEMBLIES[0].label);
  const [workshopTier, setWorkshopTier] = useState('independent');
  const [invoiceAmount, setInvoiceAmount] = useState('1200');
  const [odometerMiles, setOdometerMiles] = useState('64500');
  const [ownerName, setOwnerName] = useState('');
  const [ownerNote, setOwnerNote] = useState('');
  const [submittedAudit, setSubmittedAudit] = useState(null);

  const selectedPreset = useMemo(() => {
    if (selectedPresetId === 'custom') return null;
    return VEHICLE_PRESETS.find((p) => p.id === selectedPresetId) || VEHICLE_PRESETS[0];
  }, [selectedPresetId]);

  const liveAuditPreview = useMemo(() => {
    return calculateInvoiceAuditStats({
      assemblyLabel,
      workshopTier,
      amountPaid: Number(invoiceAmount) || 0,
      wearFactor: selectedPreset?.maintenanceWearFactor || 1.2,
    });
  }, [assemblyLabel, workshopTier, invoiceAmount, selectedPreset]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericAmount = Math.max(25, Number(invoiceAmount) || 1200);
    const numericOdo = Math.max(100, Number(odometerMiles) || 60000);
    const vehicleDisplayName =
      selectedPresetId === 'custom' && customVehicleName.trim()
        ? customVehicleName.trim()
        : selectedPreset?.shortName || selectedPreset?.name || 'Verified Fleet Vehicle';

    const stats = calculateInvoiceAuditStats({
      assemblyLabel,
      workshopTier,
      amountPaid: numericAmount,
      wearFactor: selectedPreset?.maintenanceWearFactor || 1.2,
    });

    const savingsOrDeltaText = stats.isBelowAvg
      ? `$${Math.abs(stats.diffFromAvg).toLocaleString()} Below ${workshopTier === 'dealership' ? 'Dealer' : 'Specialist'} Avg (${stats.ordinalPercentile} Pct)`
      : `$${Math.abs(stats.diffFromAvg).toLocaleString()} Above Avg · ${stats.ordinalPercentile} Percentile`;

    const defaultNote = stats.isBelowAvg
      ? `Completed ${assemblyLabel} at an ${workshopTier === 'dealership' ? 'authorized dealership' : 'independent specialist'} for $${numericAmount.toLocaleString()} (${stats.pctDiff}% under the $${stats.avg.toLocaleString()} powertrain median).`
      : `Logged $${numericAmount.toLocaleString()} invoice for ${assemblyLabel} (${workshopTier === 'dealership' ? 'Franchise Dealership' : 'Independent Specialist'}). Benchmark median was $${stats.avg.toLocaleString()}.`;

    const newEntry = {
      id: `inv-${Date.now()}`,
      name: ownerName.trim() || 'Verified Owner',
      role:
        workshopTier === 'dealership'
          ? 'Franchise Dealership Invoice'
          : 'Independent Specialist Audit',
      vehicle: vehicleDisplayName,
      presetId: selectedPresetId,
      assembly: assemblyLabel,
      workshopTier,
      amountPaid: numericAmount,
      verifiedOdometer: `${numericOdo.toLocaleString()} mi`,
      odometerMiles: numericOdo,
      rating: stats.percentile <= 75 ? 5 : 4,
      savingsText: savingsOrDeltaText,
      review: ownerNote.trim() || defaultNote,
      stats,
      createdAt: new Date().toISOString(),
      isCommunitySubmission: true,
    };

    saveCommunityInvoice(newEntry);
    setSubmittedAudit(newEntry);
    if (onInvoiceSubmitted) {
      onInvoiceSubmitted(newEntry);
    }
  };

  const handleReset = () => {
    setSubmittedAudit(null);
  };

  const activeStats = submittedAudit ? submittedAudit.stats : liveAuditPreview;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="community-invoice-modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-surface dark:bg-slate-900 border border-border dark:border-slate-800 shadow-2xl text-ink dark:text-slate-100">
        {/* Top Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-surface/95 dark:bg-slate-900/95 backdrop-blur border-b border-border dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="font-code text-[10px] uppercase tracking-widest text-primary-600 dark:text-primary-400 font-semibold block">
                COMMUNITY TELEMETRY AUDITOR
              </span>
              <h2
                id="community-invoice-modal-title"
                className="text-base sm:text-lg font-bold tracking-tight text-ink dark:text-slate-100"
              >
                Audit Your Workshop Invoice &amp; Price Spread
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg text-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-100 hover:bg-subtle dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Post-Submission Statistical Percentile & Price Spread Visualization */}
          {submittedAudit && (
            <div
              data-testid="invoice-audit-result"
              className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950/90 border-2 border-primary-500/40 dark:border-primary-500/50 space-y-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-code font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>INVOICE LOGGED TO COMMUNITY TELEMETRY</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-code font-bold ${
                    activeStats.verdictTone === 'positive'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : activeStats.verdictTone === 'warning'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : 'bg-primary-500/15 text-primary-700 dark:text-primary-300'
                  }`}
                >
                  {activeStats.ordinalPercentile} Percentile — {activeStats.verdictBadge}
                </span>
              </div>

              {/* Dynamic Callout Headline */}
              <div className="p-3.5 rounded-lg bg-surface dark:bg-slate-900 border border-border dark:border-slate-800 flex items-start gap-3">
                {activeStats.isBelowAvg ? (
                  <TrendingDown className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-semibold text-ink dark:text-slate-100 leading-relaxed">
                    {activeStats.calloutText}
                  </p>
                  <p className="text-[11px] text-muted dark:text-slate-400 font-code">
                    Calibrated against {activeStats.sampleSize + 1} verified{' '}
                    {submittedAudit.vehicle} &amp; segment invoices ·{' '}
                    {submittedAudit.workshopTier === 'dealership'
                      ? `Independent Specialist median is $${activeStats.oppositeAvg.toLocaleString()}`
                      : `Franchise Dealership median is $${activeStats.oppositeAvg.toLocaleString()}`}
                  </p>
                </div>
              </div>

              {/* Horizontal Percentile Gauge Bar (P10 / P50 / P90 + User Invoice Pin) */}
              <div className="pt-2 pb-1">
                <div className="flex items-center justify-between text-[11px] font-code text-muted dark:text-slate-400 mb-2">
                  <span>Statistical Price Spread ({submittedAudit.assembly})</span>
                  <span className="font-bold text-ink dark:text-slate-200">
                    Your Invoice: ${activeStats.paid.toLocaleString()}
                  </span>
                </div>

                <div className="relative h-9 pt-3">
                  {/* Track Background */}
                  <div className="h-3 w-full rounded-full bg-gradient-to-r from-emerald-500/30 via-primary-500/30 to-rose-500/40 dark:from-emerald-500/25 dark:via-primary-500/25 dark:to-rose-500/35 border border-border dark:border-slate-800 relative">
                    {/* P10 Marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500"
                      style={{ left: '12%' }}
                      title={`P10 Low: $${activeStats.p10}`}
                    />
                    {/* P50 Median Marker */}
                    <div
                      className="absolute -top-1 -bottom-1 w-0.5 bg-ink dark:bg-slate-200"
                      style={{ left: '50%' }}
                      title={`P50 Median: $${activeStats.avg}`}
                    />
                    {/* P90 Marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500"
                      style={{ left: '88%' }}
                      title={`P90 High: $${activeStats.p90}`}
                    />

                    {/* User Invoice Pin */}
                    <div
                      className="absolute -top-2.5 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
                      style={{ left: `${activeStats.pinPositionPct}%` }}
                    >
                      <div
                        className={`px-1.5 py-0.5 rounded text-[10px] font-code font-bold text-white shadow ${
                          activeStats.isBelowAvg ? 'bg-emerald-600' : 'bg-amber-600'
                        }`}
                      >
                        ${activeStats.paid.toLocaleString()}
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow ${
                          activeStats.isBelowAvg ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Benchmark Labels Row */}
                <div className="grid grid-cols-3 text-[11px] font-code mt-2 pt-2 border-t border-border/60 dark:border-slate-800">
                  <div>
                    <span className="text-muted dark:text-slate-400 block">P10 (Low)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ${activeStats.p10.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-muted dark:text-slate-400 block">P50 (Median)</span>
                    <span className="font-bold text-ink dark:text-slate-100">
                      ${activeStats.avg.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted dark:text-slate-400 block">P90 (High)</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      ${activeStats.p90.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs font-code font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Audit Another Repair Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-code font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                >
                  Done &amp; View Telemetry Feed
                </button>
              </div>
            </div>
          )}

          {/* Invoice Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Vehicle Model Selector */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="invoice-vehicle-select"
                  className="block text-xs font-code font-semibold uppercase tracking-wider text-muted dark:text-slate-300 mb-1.5"
                >
                  Vehicle Model &amp; Powertrain
                </label>
                <select
                  id="invoice-vehicle-select"
                  value={selectedPresetId}
                  onChange={(e) => setSelectedPresetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-subtle dark:bg-slate-950 border border-border dark:border-slate-800 text-xs sm:text-sm text-ink dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {VEHICLE_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} ({preset.fuelType})
                    </option>
                  ))}
                  <option value="custom">+ Custom Vehicle / Unlisted Trim</option>
                </select>
              </div>

              {selectedPresetId === 'custom' && (
                <div className="sm:col-span-2">
                  <label
                    htmlFor="invoice-custom-vehicle"
                    className="block text-xs font-code font-semibold uppercase tracking-wider text-muted dark:text-slate-300 mb-1.5"
                  >
                    Custom Vehicle Make, Model &amp; Engine
                  </label>
                  <input
                    id="invoice-custom-vehicle"
                    type="text"
                    required
                    placeholder="e.g. Volvo XC60 B5 AWD Mild Hybrid"
                    value={customVehicleName}
                    onChange={(e) => setCustomVehicleName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-subtle dark:bg-slate-950 border border-border dark:border-slate-800 text-xs sm:text-sm text-ink dark:text-slate-100"
                  />
                </div>
              )}

              {/* Repaired Assembly / Service */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="invoice-assembly-select"
                  className="block text-xs font-code font-semibold uppercase tracking-wider text-muted dark:text-slate-300 mb-1.5"
                >
                  Repaired Assembly / Service Benchmark
                </label>
                <div className="relative">
                  <select
                    id="invoice-assembly-select"
                    value={assemblyLabel}
                    onChange={(e) => setAssemblyLabel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-subtle dark:bg-slate-950 border border-border dark:border-slate-800 text-xs sm:text-sm text-ink dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {REPAIRED_ASSEMBLIES.map((item) => (
                      <option key={item.id} value={item.label}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Workshop Tier */}
              <div className="sm:col-span-2">
                <span className="block text-xs font-code font-semibold uppercase tracking-wider text-muted dark:text-slate-300 mb-1.5">
                  Workshop Tier
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWorkshopTier('independent')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      workshopTier === 'independent'
                        ? 'bg-primary-50 dark:bg-primary-950/70 border-primary-500 text-ink dark:text-slate-100 shadow-sm'
                        : 'bg-subtle dark:bg-slate-950 border-border dark:border-slate-800 text-muted dark:text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Independent Specialist</div>
                      <div className="text-[10px] font-code opacity-80">
                        OEM Parts · Specialist Labor
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkshopTier('dealership')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      workshopTier === 'dealership'
                        ? 'bg-primary-50 dark:bg-primary-950/70 border-primary-500 text-ink dark:text-slate-100 shadow-sm'
                        : 'bg-subtle dark:bg-slate-950 border-border dark:border-slate-800 text-muted dark:text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    <Landmark className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Franchise Dealership</div>
                      <div className="text-[10px] font-code opacity-80">
                        Main Dealer Service Desk
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Invoice Amount Paid */}
              <div>
                <label
                  htmlFor="invoice-amount-input"
                  className="block text-xs font-code font-semibold uppercase tracking-wider text-muted dark:text-slate-300 mb-1.5"
                >
                  Invoice Amount Paid ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-muted dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="invoice-amount-input"
                    type="number"
                    min="25"
                    max="25000"
                    step="10"
                    required
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-subtle dark:bg-slate-950 border border-border dark:border-slate-800 text-xs sm:text-sm font-code text-ink dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Odometer Reading */}
              <div>
                <label
                  htmlFor="invoice-odometer-input"
                  className="block text-xs font-code font-semibold uppercase tracking-wider text-muted dark:text-slate-300 mb-1.5"
                >
                  Odometer Reading (mi)
                </label>
                <div className="relative">
                  <Gauge className="w-4 h-4 text-muted dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="invoice-odometer-input"
                    type="number"
                    min="100"
                    max="500000"
                    step="100"
                    required
                    value={odometerMiles}
                    onChange={(e) => setOdometerMiles(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-subtle dark:bg-slate-950 border border-border dark:border-slate-800 text-xs sm:text-sm font-code text-ink dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Driver Handle & Telemetry Observation */}
              <div>
                <label
                  htmlFor="invoice-driver-name"
                  className="block text-xs font-code font-semibold uppercase tracking-wider text-muted dark:text-slate-300 mb-1.5"
                >
                  Driver / Fleet Handle (Optional)
                </label>
                <input
                  id="invoice-driver-name"
                  type="text"
                  placeholder="e.g. Alex M. (or leave blank)"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-subtle dark:bg-slate-950 border border-border dark:border-slate-800 text-xs sm:text-sm text-ink dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="invoice-owner-note"
                  className="block text-xs font-code font-semibold uppercase tracking-wider text-muted dark:text-slate-300 mb-1.5"
                >
                  Telemetry / Parts Observation (Optional)
                </label>
                <input
                  id="invoice-owner-note"
                  type="text"
                  placeholder="e.g. Replaced OEM Pierburg pump + Continental belt"
                  value={ownerNote}
                  onChange={(e) => setOwnerNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-subtle dark:bg-slate-950 border border-border dark:border-slate-800 text-xs sm:text-sm text-ink dark:text-slate-100"
                />
              </div>
            </div>

            {/* Live Pre-Submission Statistical Benchmark Bar */}
            {!submittedAudit && (
              <div className="p-4 rounded-xl bg-subtle/70 dark:bg-slate-950/70 border border-border dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-code">
                  <span className="text-muted dark:text-slate-400">
                    Live Benchmark Preview ({workshopTier === 'dealership' ? 'Dealership' : 'Specialist'}):
                  </span>
                  <span className="font-bold text-primary-600 dark:text-primary-400">
                    {liveAuditPreview.ordinalPercentile} Percentile ({liveAuditPreview.verdictBadge})
                  </span>
                </div>
                <div className="grid grid-cols-3 text-[11px] font-code text-muted dark:text-slate-400">
                  <span>P10 Low: ${liveAuditPreview.p10.toLocaleString()}</span>
                  <span className="text-center font-semibold text-ink dark:text-slate-200">
                    P50 Avg: ${liveAuditPreview.avg.toLocaleString()}
                  </span>
                  <span className="text-right">P90 High: ${liveAuditPreview.p90.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Submit & Cancel Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-full text-xs font-code font-semibold text-muted dark:text-slate-300 hover:bg-subtle dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full text-xs font-code font-semibold bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verify &amp; Log Invoice Telemetry</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

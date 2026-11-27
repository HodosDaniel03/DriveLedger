import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Share2,
  CheckSquare,
  CheckCircle2,
  X,
  ExternalLink,
  MessageSquare,
  FileText,
  Terminal,
  ShieldAlert,
  Gauge,
} from 'lucide-react';
import { useUnits } from '../../context/UnitContext';
import { VEHICLE_PRESETS } from '../../data/vehiclePresets';
import {
  MAINTENANCE_COMPONENTS,
  evaluateComponentHealth,
  calculateOemRiskMultiplier,
  calculateTcoProjection,
  filterComponentsForPowertrain,
  isPureElectric,
} from '../../data/maintenanceData';
import { Pill } from './OdometerPrimitives';

export function formatShieldsSegment(value) {
  return encodeURIComponent(
    String(value || '')
      .replace(/_/g, '__')
      .replace(/-/g, '--')
      .replace(/\s+/g, '_')
  );
}

const FORMAT_TABS = [
  {
    id: 'quick',
    label: 'Quick Summary',
    subtitle: 'Discord / One-Liner',
    icon: Terminal,
  },
  {
    id: 'reddit',
    label: 'Reddit Markdown',
    subtitle: 'r/cars · r/MechanicAdvice',
    icon: MessageSquare,
  },
  {
    id: 'bbcode',
    label: 'Forum BBCode',
    subtitle: 'VWVortex · Bimmerpost · PistonHeads',
    icon: FileText,
  },
  {
    id: 'badge',
    label: 'Embed Badge',
    subtitle: 'HTML / SVG / Markdown',
    icon: ShieldAlert,
  },
];

/**
 * Fallback 5-year TCO projection when ForumShareModal is opened from the
 * Maintenance Risk Matrix without an active tcoSummary object.
 */
function computeFallbackTco(vehicle, odometerMiles) {
  const isEv = isPureElectric(vehicle);
  return calculateTcoProjection({
    purchasePriceUsd: Math.max(1000, Number(vehicle?.purchasePriceUsd) || 28000),
    odometerMiles: Math.max(0, Number(odometerMiles ?? vehicle?.defaultOdometerMiles) || 45000),
    annualDistanceMiles: Math.max(500, Number(vehicle?.annualDistanceMiles) || 12000),
    mpgUs: Number(vehicle?.mpgUs) || (isEv ? 28 : 32),
    isEv,
    powertrainType: vehicle?.powertrainType || vehicle?.powertrain,
    vehicle,
    fuelPriceUsdGal: Number(vehicle?.defaultFuelPriceUsdGal) || (isEv ? 0.16 : 3.85),
    annualInsuranceUsd: Math.max(0, Number(vehicle?.annualInsuranceUsd) || 1350),
    baseAnnualMaintenanceUsd: Number(vehicle?.baseAnnualMaintenanceUsd) || 850,
    maintenanceWearFactor: Number(vehicle?.maintenanceWearFactor) || 1.1,
    downPaymentPct: 20,
    aprPct: 6.2,
    loanTermMonths: 60,
    horizonYears: 5,
    residualCurve10Yr: vehicle?.residualCurve10Yr,
  });
}

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

export default function ForumShareModal({
  isOpen = true,
  onClose,
  vehicle,
  tcoSummary,
  riskSummary,
  odometerMiles,
  scheduleMode = 'preventative',
  // Optional flat prop fallbacks
  tco,
  reliabilityScore,
  serviceReserveUsd,
  evaluatedComponents,
}) {
  const {
    distanceUnit,
    region,
    formatCurrency,
    formatDistance,
  } = useUnits();

  const [activeFormat, setActiveFormat] = useState('quick');
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
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

    if (isOpen) {
      if (typeof dialogEl.showModal === 'function' && !dialogEl.open) {
        try {
          dialogEl.showModal();
        } catch {
          // Safe guard in mock DOM or already-open state
        }
      }
    } else {
      closeDialogProgrammatically(dialogEl);
    }
    return () => {
      closeDialogProgrammatically(dialogEl);
    };
  }, [isOpen]);

  // Light-dismiss for full-viewport <dialog> overlays (supplements closedby="any" Esc/back-gesture)
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined' || typeof HTMLDialogElement === 'undefined') {
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
  }, [isOpen, onClose]);

  const resolvedVehicle = useMemo(
    () => vehicle || VEHICLE_PRESETS[0],
    [vehicle]
  );

  const resolvedOdometerMiles = useMemo(
    () =>
      Math.max(
        0,
        Number(odometerMiles ?? resolvedVehicle?.defaultOdometerMiles ?? 48000)
      ),
    [odometerMiles, resolvedVehicle]
  );

  // Resolve TCO metrics (use passed tcoSummary/tco or compute deterministic fallback)
  const resolvedTco = useMemo(() => {
    const source = tcoSummary || tco;
    if (
      source &&
      typeof source.totalEconomicCostUsd === 'number' &&
      typeof source.monthlyEconomicCostUsd === 'number'
    ) {
      return source;
    }
    return computeFallbackTco(resolvedVehicle, resolvedOdometerMiles);
  }, [tcoSummary, tco, resolvedVehicle, resolvedOdometerMiles]);

  // Resolve Risk Matrix metrics (use passed riskSummary or compute deterministic fallback)
  const resolvedRisk = useMemo(() => {
    const providedComponents =
      riskSummary?.evaluatedComponents || evaluatedComponents;

    const components =
      Array.isArray(providedComponents) && providedComponents.length > 0
        ? providedComponents
        : filterComponentsForPowertrain(MAINTENANCE_COMPONENTS, resolvedVehicle).map((comp) => ({
            ...comp,
            health: evaluateComponentHealth({
              component: comp,
              physicalOdometerMiles: resolvedOdometerMiles,
              urbanTripSharePct: 45,
              oilIntervalId: scheduleMode === 'oem' ? 'extended' : 'standard',
              serviceHistoryId: 'verified',
              transmissionId: resolvedVehicle?.transmission || 'dct-dsg',
              vehicle: resolvedVehicle,
            }),
          }));

    const oemMultiplier = calculateOemRiskMultiplier(resolvedOdometerMiles);

    // Reliability Score (0-100)
    let score = riskSummary?.reliabilityScore ?? reliabilityScore;
    if (typeof score !== 'number' || Number.isNaN(score)) {
      if (!components.length) {
        score = 75;
      } else {
        const avgWear =
          components.reduce(
            (acc, c) => acc + (c.health?.wearPctOfCritical || 0),
            0
          ) / components.length;
        const criticalCount = components.filter(
          (c) => c.health?.status === 'CRITICAL'
        ).length;
        const warningCount = components.filter(
          (c) => c.health?.status === 'WARNING'
        ).length;
        const penalty = criticalCount * 14 + warningCount * 6;
        const oemDeduction =
          scheduleMode === 'oem'
            ? Math.min(
                25,
                Math.max(18, Math.round(18 + (resolvedOdometerMiles / 120000) * 7))
              )
            : 0;
        score = Math.min(
          95,
          Math.max(18, Math.round(100 - avgWear * 0.45 - penalty - oemDeduction))
        );
      }
    }

    // 12-Month Repair Risk Reserve
    let reserveUsd = riskSummary?.serviceReserveUsd ?? serviceReserveUsd;
    if (typeof reserveUsd !== 'number' || Number.isNaN(reserveUsd)) {
      let rawReserve = 0;
      for (const item of components) {
        const range = item.health?.scaledCostsUsd?.independent || item.costsUsd?.independent || [700, 1300];
        const avgCost = (range[0] + range[1]) / 2;
        if (item.health?.status === 'CRITICAL') {
          rawReserve += avgCost * 0.75;
        } else if (item.health?.status === 'WARNING') {
          rawReserve += avgCost * 0.35;
        } else {
          rawReserve += avgCost * 0.12;
        }
      }
      const baseRounded = Math.round(rawReserve);
      reserveUsd =
        scheduleMode === 'oem'
          ? Math.round(baseRounded * oemMultiplier)
          : baseRounded;
    }

    // Highest-risk component
    const sortedByWear = [...components].sort(
      (a, b) =>
        (b.health?.wearPctOfCritical || 0) - (a.health?.wearPctOfCritical || 0)
    );
    const topComponent = sortedByWear[0];
    const topRiskLabel = topComponent
      ? `${topComponent.name} (${topComponent.health?.wearPctOfCritical ?? 0}% wear)`
      : resolvedVehicle?.criticalDefectTag || 'Scheduled Powertrain Wear';

    return {
      score,
      reserveUsd,
      topRiskLabel,
      criticalDefectTag:
        resolvedVehicle?.criticalDefectTag || '⚠️ POWERTRAIN WEAR MONITOR',
    };
  }, [
    riskSummary,
    evaluatedComponents,
    reliabilityScore,
    serviceReserveUsd,
    resolvedVehicle,
    resolvedOdometerMiles,
    scheduleMode,
  ]);

  // Deep-link share URL
  const shareUrl = useMemo(() => {
    const tabParam = riskSummary && !tcoSummary ? 'risk' : 'tco';
    const pathSegment = tabParam === 'risk' ? '/risk-matrix' : '/tco';
    const presetParam = encodeURIComponent(resolvedVehicle?.id || 'ford-focus-ecoblue');
    const odoParam = Math.round(resolvedOdometerMiles);
    const origin =
      typeof window !== 'undefined' &&
      window.location?.origin &&
      window.location.origin.startsWith('http')
        ? window.location.origin
        : 'https://mydriveledger.com';
    return `${origin}${pathSegment}?tab=${tabParam}&preset=${presetParam}&odo=${odoParam}&reg=${region}`;
  }, [resolvedVehicle, resolvedOdometerMiles, riskSummary, tcoSummary, region]);

  // Formatted telemetry strings
  const tcoFormatted = formatCurrency(resolvedTco.totalEconomicCostUsd);
  const monthlyFormatted = formatCurrency(resolvedTco.monthlyEconomicCostUsd);
  const reserveFormatted = formatCurrency(resolvedRisk.reserveUsd);
  const distanceFormatted = formatDistance(resolvedOdometerMiles);
  const distFactor = region === 'EU' ? 1.60934 : 1.0;
  const totalDistMiles = resolvedTco.totalDistanceMiles || 60000;
  const costPerUnitFormatted = formatCurrency(
    totalDistMiles > 0
      ? resolvedTco.totalEconomicCostUsd / (totalDistMiles * distFactor)
      : resolvedTco.costPerMileUsd || 0.48,
    2
  );
  const score = resolvedRisk.score;
  const topRiskLabel = resolvedRisk.topRiskLabel;
  const criticalDefectTag = resolvedRisk.criticalDefectTag;
  const horizonYears = resolvedTco.yearlySchedule?.length || 5;
  const isLeaseSummary = resolvedTco.financeType === 'lease' && Boolean(resolvedTco.leaseDetails);
  const leaseSummaryNote = isLeaseSummary
    ? `Lease (${resolvedTco.leaseDetails.leaseTermMonths}m): ${formatCurrency(resolvedTco.leaseDetails.monthlyLeasePaymentUsd)}/mo · Residual ${resolvedTco.leaseDetails.residualPct}% · MF ${resolvedTco.leaseDetails.moneyFactor.toFixed(5)}`
    : null;

  // Generate the 4 copyable formats
  const snippets = useMemo(() => {
    const quick = `Vehicle: ${resolvedVehicle.name} | ${horizonYears}-Yr TCO: ${tcoFormatted} (${monthlyFormatted}/mo · ${costPerUnitFormatted}/${distanceUnit}${leaseSummaryNote ? ` · ${leaseSummaryNote}` : ''}) | Reliability Score: ${score}/100 | Top Risk: ${topRiskLabel} (${reserveFormatted}) | Source: ${shareUrl}`;

    const reddit = [
      `### DriveLedger Telemetry Report: ${resolvedVehicle.name}`,
      '',
      '| Metric | Telemetry Value | Notes |',
      '| :- | :- | :- |',
      `| **${horizonYears}-Yr TCO** | **${tcoFormatted}** | ${distanceFormatted} odometer · ${costPerUnitFormatted}/${distanceUnit} carrying cost |`,
      `| **Monthly Cost** | **${monthlyFormatted}/mo** | ${leaseSummaryNote || 'Depreciation, fuel/energy, insurance, maintenance & financing'} |`,
      `| **Reliability Score** | **${score}/100** | ${
        scheduleMode === 'oem'
          ? 'OEM Marketing Schedule (Risk Multiplier Active)'
          : 'Engineering Preventative Schedule'
      } |`,
      `| **12-Mo Repair Risk Reserve** | **${reserveFormatted}** | Primary exposure: ${topRiskLabel} |`,
      `| **Critical Defect Tag** | \`${criticalDefectTag}\` | ${
        resolvedVehicle.engineCode || resolvedVehicle.powertrainLabel || 'Powertrain Telemetry'
      } |`,
      '',
      `*Interactive Deep-Link: [DriveLedger Telemetry Benchmark](${shareUrl})*`,
    ].join('\n');

    const bbcode = [
      `[b][size=4]DriveLedger Telemetry Report: ${resolvedVehicle.name}[/size][/b]`,
      `[i]Odometer: ${distanceFormatted} | Protocol: ${
        scheduleMode === 'oem'
          ? 'OEM Marketing Schedule'
          : 'Engineering Preventative Schedule'
      }[/i]`,
      '',
      '[table]',
      '[tr][th]Metric[/th][th]Telemetry Value[/th][th]Notes[/th][/tr]',
      `[tr][td][b]${horizonYears}-Yr TCO[/b][/td][td]${tcoFormatted}[/td][td]${costPerUnitFormatted}/${distanceUnit} total carrying cost[/td][/tr]`,
      `[tr][td][b]Monthly Cost[/b][/td][td]${monthlyFormatted}/mo[/td][td]${leaseSummaryNote || 'All-in depreciation, energy, insurance & upkeep'}[/td][/tr]`,
      `[tr][td][b]Reliability Score[/b][/td][td]${score}/100[/td][td]Component wear matrix evaluation[/td][/tr]`,
      `[tr][td][b]12-Mo Repair Risk Reserve[/b][/td][td]${reserveFormatted}[/td][td]Top Risk: ${topRiskLabel}[/td][/tr]`,
      `[tr][td][b]Critical Defect Tag[/b][/td][td]${criticalDefectTag}[/td][td]${
        resolvedVehicle.engineCode || resolvedVehicle.powertrainLabel || 'Powertrain'
      }[/td][/tr]`,
      '[/table]',
      '',
      `[b]Source & Interactive Telemetry:[/b] [url=${shareUrl}]${shareUrl}[/url]`,
    ].join('\n');

    const escXml = (s) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const safeBadgeLabel = formatShieldsSegment(
      `DriveLedger ${resolvedVehicle.shortName || resolvedVehicle.name}`
    );
    const safeBadgeValue = formatShieldsSegment(
      `${score}/100 Reliability | ${monthlyFormatted}/mo`
    );
    const svgTitle = escXml(`${resolvedVehicle.name} · ${score}/100 · ${tcoFormatted} 5-Yr TCO`);
    const safeHtmlUrl = escXml(shareUrl);
    const safeVehicleName = escXml(resolvedVehicle.name);
    const safeShortName = escXml(resolvedVehicle.shortName || resolvedVehicle.name);

    const badge = [
      `<!-- 1. DriveLedger Reliability & TCO Embed Badge (HTML) -->`,
      `<a href="${safeHtmlUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;background:#121215;color:#F7F7F4;border:1px solid #27272A;font-family:system-ui,-apple-system,sans-serif;font-size:12px;text-decoration:none;line-height:1.4;">`,
      `  <strong style="color:#4ADE80;">DriveLedger ${score}/100</strong>`,
      `  <span>${safeVehicleName} · 5-Yr TCO: <strong>${escXml(tcoFormatted)}</strong> (${escXml(monthlyFormatted)}/mo · ${escXml(costPerUnitFormatted)}/${escXml(distanceUnit)}) · 12-Mo Reserve: ${escXml(reserveFormatted)}</span>`,
      `</a>`,
      '',
      `<!-- 2. Self-Contained Inline SVG Badge (Zero External Dependencies) -->`,
      `<a href="${safeHtmlUrl}" target="_blank" rel="noopener"><svg xmlns="http://www.w3.org/2000/svg" width="460" height="36" role="img" aria-label="${svgTitle}"><rect width="460" height="36" rx="8" fill="#121215"/><rect x="1" y="1" width="138" height="34" rx="7" fill="#183D22"/><text x="70" y="22" fill="#FFFFFF" font-family="system-ui,sans-serif" font-size="12" font-weight="700" text-anchor="middle">DriveLedger ${score}/100</text><text x="152" y="22" fill="#F7F7F4" font-family="system-ui,sans-serif" font-size="11.5">${safeShortName} · ${escXml(tcoFormatted)} ${horizonYears}-Yr (${escXml(monthlyFormatted)}/mo)</text></svg></a>`,
      '',
      `<!-- 3. Markdown Badge for Listings / Blogs / GitHub / Forums -->`,
      `[![DriveLedger ${resolvedVehicle.name} Reliability ${score}/100 | ${horizonYears}-Yr TCO ${tcoFormatted}](https://img.shields.io/badge/${safeBadgeLabel}-${safeBadgeValue}-183D22?style=for-the-badge)](${shareUrl})`,
    ].join('\n');

    return {
      quick,
      reddit,
      bbcode,
      badge,
    };
  }, [
    resolvedVehicle,
    tcoFormatted,
    monthlyFormatted,
    score,
    topRiskLabel,
    reserveFormatted,
    shareUrl,
    distanceFormatted,
    costPerUnitFormatted,
    distanceUnit,
    scheduleMode,
    criticalDefectTag,
    horizonYears,
    leaseSummaryNote,
  ]);

  if (!isOpen) {
    programmaticCloseCountRef.current = 0;
    return null;
  }

  const activeSnippetText = snippets[activeFormat] || snippets.quick;

  const copyTextSafe = async (text, setFlag) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Fallback silent catch for restricted clipboard environments
    }
    setFlag(true);
    setTimeout(() => setFlag(false), 2500);
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="forum-share-modal-title"
      data-testid="forum-share-modal"
      onClose={() => {
        if (programmaticCloseCountRef.current > 0) {
          programmaticCloseCountRef.current -= 1;
          return;
        }
        if (typeof onClose === 'function') onClose();
      }}
      className="dl-bottom-sheet-dialog sm:items-center sm:justify-center sm:p-4 print:hidden"
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border dark:border-zinc-800 bg-surface dark:bg-[#121215] text-ink dark:text-zinc-100 p-4 sm:p-6 shadow-2xl space-y-5"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border dark:border-zinc-800 pb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Share2 className="w-4 h-4 text-primary-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
              <h1
                id="forum-share-modal-title"
                className="font-sans text-h3 font-bold tracking-tight text-ink dark:text-zinc-100"
              >
                Share for Reddit &amp; Enthusiast Forums
              </h1>
              <Pill tone="brand">
                1-Click Embed
              </Pill>
            </div>
            <p className="font-sans text-xs text-muted dark:text-zinc-400 mt-1">
              Copy pre-formatted ownership telemetry for Discord, r/cars, r/MechanicAdvice, VWVortex, Bimmerpost, or TalkFord.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share modal"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg p-2 text-muted hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-surface-subtle dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Visual Telemetry Snapshot Card */}
        <div className="rounded-xl bg-[#18181B] text-white p-4 border border-zinc-800 shadow-inner space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-sans text-sm sm:text-base font-bold text-white leading-snug">
                {resolvedVehicle.name}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-400/40 px-2.5 py-0.5 text-[11px] font-sans font-medium text-amber-300">
              <ShieldAlert className="w-3 h-3" aria-hidden="true" />
              {criticalDefectTag}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="rounded-lg bg-zinc-900/90 border border-zinc-800 p-2.5">
              <span className="text-[11px] font-sans font-medium text-zinc-400 block">
                5-Yr TCO
              </span>
              <span className="text-sm sm:text-base font-mono font-bold text-white tabular-nums">
                {tcoFormatted}
              </span>
            </div>
            <div className="rounded-lg bg-zinc-900/90 border border-zinc-800 p-2.5">
              <span className="text-[11px] font-sans font-medium text-zinc-400 block">
                Monthly Cost
              </span>
              <span className="text-sm sm:text-base font-mono font-bold text-emerald-400 tabular-nums">
                {monthlyFormatted}/mo
              </span>
            </div>
            <div className="rounded-lg bg-zinc-900/90 border border-zinc-800 p-2.5">
              <span className="text-[11px] font-sans font-medium text-zinc-400 block">
                Reliability
              </span>
              <span className="text-sm sm:text-base font-mono font-bold text-emerald-400 tabular-nums inline-flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5" aria-hidden="true" />
                {score}/100
              </span>
            </div>
            <div className="rounded-lg bg-zinc-900/90 border border-zinc-800 p-2.5">
              <span className="text-[11px] font-sans font-medium text-zinc-400 block">
                12-Mo Reserve
              </span>
              <span className="text-sm sm:text-base font-mono font-bold text-amber-300 tabular-nums">
                {reserveFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* Format Selector Tabs */}
        <div>
          <div
            role="tablist"
            aria-label="Share Format Tabs"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2"
          >
            {FORMAT_TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeFormat === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  data-testid={`share-tab-${tab.id}`}
                  onClick={() => {
                    setActiveFormat(tab.id);
                    setCopiedMain(false);
                  }}
                  className={`flex items-center gap-2.5 rounded-xl p-3 text-left font-sans transition-colors duration-150 border ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-600 dark:bg-emerald-700 dark:border-emerald-600 shadow-sm'
                      : 'bg-surface-subtle dark:bg-zinc-800 text-ink dark:text-zinc-100 border-border dark:border-zinc-700 hover:border-border-strong'
                  }`}
                >
                  <Icon
                    aria-hidden="true"
                    className={`w-4 h-4 shrink-0 ${
                      isSelected ? 'text-white' : 'text-primary-600 dark:text-emerald-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{tab.label}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isSelected ? 'text-white' : 'text-muted dark:text-zinc-400'
                      }`}
                    >
                      {tab.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-sans text-muted dark:text-zinc-400 font-semibold">
              Live Embed Preview ({FORMAT_TABS.find((t) => t.id === activeFormat)?.label})
            </span>
            <button
              type="button"
              data-testid="copy-share-snippet-btn"
              onClick={() => copyTextSafe(activeSnippetText, setCopiedMain)}
              className={`min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 font-sans text-xs font-semibold transition-colors duration-150 shadow-sm ${
                copiedMain
                  ? 'bg-emerald-700 text-white'
                  : 'bg-primary-600 hover:bg-primary-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white'
              }`}
            >
              {copiedMain ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copied to Clipboard ✓</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>
          </div>

          {activeFormat === 'badge' && (
            <div
              data-testid="embed-badge-visual-preview"
              className="rounded-xl border border-border dark:border-zinc-800 bg-canvas dark:bg-zinc-900/70 p-3 flex flex-wrap items-center justify-between gap-2"
            >
              <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#121215] text-[#F7F7F4] border border-zinc-800 text-xs font-sans shadow-xs">
                <strong className="text-emerald-400 font-mono tabular-nums">
                  DriveLedger {score}/100
                </strong>
                <span className="text-zinc-200">
                  {resolvedVehicle.shortName || resolvedVehicle.name} · 5-Yr TCO:{' '}
                  <strong className="font-mono tabular-nums">{tcoFormatted}</strong> ({monthlyFormatted}/mo · {costPerUnitFormatted}/{distanceUnit})
                </span>
              </div>
              <span className="text-[11px] font-sans text-muted dark:text-zinc-400">
                Includes HTML, Inline SVG &amp; Markdown formats
              </span>
            </div>
          )}

          <pre
            data-testid="forum-share-preview"
            className="w-full rounded-xl bg-surface-subtle dark:bg-[#09090B] border border-border dark:border-zinc-800 p-3.5 text-xs font-mono text-ink dark:text-zinc-200 overflow-x-auto whitespace-pre-wrap break-words max-h-56 leading-relaxed select-all"
          >
            {activeSnippetText}
          </pre>
        </div>

        {/* Direct Deep-Link URL Bar */}
        <div className="pt-2 border-t border-border dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0 flex-1 rounded-xl bg-surface-subtle dark:bg-zinc-800/80 border border-border dark:border-zinc-700 px-3 py-2">
            <ExternalLink className="w-4 h-4 text-muted dark:text-zinc-400 shrink-0" aria-hidden="true" />
            <span
              data-testid="forum-share-deep-link"
              className="text-xs font-mono text-muted dark:text-zinc-300 truncate"
            >
              {shareUrl}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="copy-direct-url-btn"
              onClick={() => copyTextSafe(shareUrl, setCopiedUrl)}
              className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 rounded-xl bg-surface dark:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-ink dark:text-zinc-100 border border-border-strong dark:border-zinc-700 hover:bg-surface-subtle dark:hover:bg-zinc-700 transition-colors duration-150"
            >
              {copiedUrl ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                  <span>URL Copied ✓</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-3.5 h-3.5 text-primary-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>Copy Direct URL</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] sm:min-h-0 rounded-xl bg-surface-subtle dark:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-muted hover:text-ink dark:text-zinc-300 dark:hover:text-white transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

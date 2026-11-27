import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Lightbulb,
} from 'lucide-react';
import { Pill } from '../../common/OdometerPrimitives';
import { useUnits } from '../../../context/UnitContext';

const BAR_COLOR = {
  OPTIMAL: '#12A150',
  WARNING: '#F2B705',
  CRITICAL: '#F04438',
};

export default function RiskComponentRow({
  item,
  activePreset,
  scheduleMode,
  workshopTier,
  onToggleServiced,
  onNavigateToObd,
  onNavigateToHybridObd,
}) {
  const { formatCurrency, formatDistance } = useUnits();

  const status = item.health.status; // 'OPTIMAL' | 'WARNING' | 'CRITICAL'
  const pct = item.health.wearPctOfCritical;
  const isServiced = item.isRecentlyServiced;

  const resolvedCosts = item.health?.scaledCostsUsd || item.costsUsd;
  const indieCostAvg = Math.round((resolvedCosts.independent[0] + resolvedCosts.independent[1]) / 2);
  const dealerCostAvg = Math.round((resolvedCosts.dealership[0] + resolvedCosts.dealership[1]) / 2);
  const primaryCost = workshopTier === 'dealership' ? dealerCostAvg : indieCostAvg;

  const tone = isServiced ? 'good' : status === 'CRITICAL' ? 'risk' : status === 'WARNING' ? 'warn' : 'good';
  const statusLabel = isServiced
    ? 'Verified Serviced'
    : status === 'CRITICAL'
    ? 'High Risk - Service Now'
    : status === 'WARNING'
    ? 'Due Soon'
    : 'Healthy';

  const dotColor = isServiced
    ? 'bg-[#12A150]'
    : status === 'CRITICAL'
    ? 'bg-[#F04438]'
    : status === 'WARNING'
    ? 'bg-[#F2B705]'
    : 'bg-[#12A150]';

  return (
    <li className="py-4 first:pt-2 last:pb-1">
      {/* Single-Row Scannable Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0">
        <div className="min-w-0">
          <h3 className="font-sans text-sm sm:text-base font-semibold tracking-tight text-ink dark:text-zinc-50 leading-snug">
            {item.name}
          </h3>
          <p className="text-xs font-sans text-muted dark:text-zinc-400 mt-0.5 truncate">
            {item.category}
            {scheduleMode === 'oem' && item.oemFallacyBadge ? ' · OEM omission risk' : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 shrink-0">
          <Pill tone={tone} className="gap-1.5 inline-flex items-center">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}
              aria-hidden="true"
            />
            <span>{statusLabel}</span>
            {status === 'CRITICAL' && (
              <span className="sr-only"> · IMMINENT FAILURE RISK</span>
            )}
            {status === 'WARNING' && (
              <span className="sr-only"> · SERVICE WINDOW APPROACHING</span>
            )}
          </Pill>

          {isServiced ? (
            <span
              data-testid={`assembly-service-distance-${item.id}`}
              className="text-xs text-emerald-700 dark:text-emerald-400 font-sans font-medium"
            >
              Serviced · next in <span className="font-mono tabular-nums">~{formatDistance(item.serviceIntervalMiles)}</span>
            </span>
          ) : item.health.overduePhysicalMiles > 0 ? (
            <span
              data-testid={`assembly-service-distance-${item.id}`}
              className={`text-xs font-sans font-semibold ${
                status === 'CRITICAL'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              Overdue by <span className="font-mono tabular-nums">{formatDistance(item.health.overduePhysicalMiles)}</span>
            </span>
          ) : (
            <span
              data-testid={`assembly-service-distance-${item.id}`}
              className="text-xs text-muted dark:text-zinc-400 font-sans font-medium"
            >
              Due in <span className="font-mono tabular-nums">{formatDistance(item.health.milesUntilServiceInterval)}</span>
            </span>
          )}

          <span className="font-mono text-sm sm:text-base font-semibold tabular-nums text-ink dark:text-zinc-100">
            {formatCurrency(primaryCost)}
          </span>
        </div>
      </div>

      {/* On-Demand Engineering Notes, Wear Progress & DIY/Workshop Split */}
      <details className="dl-disclosure group mt-1.5">
        <summary className="min-h-[44px] sm:min-h-[34px] inline-flex items-center gap-1.5 text-xs font-sans font-medium text-primary-600 dark:text-emerald-400 hover:underline">
          <ChevronDown
            aria-hidden="true"
            className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-open:rotate-180"
          />
          <span>Engineering notes, wear &amp; DIY/workshop tips</span>
        </summary>

        <div className="pt-2.5 pb-1 space-y-3 text-xs font-sans">
          {/* Action + Expected Interval Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onToggleServiced(item.id)}
              aria-pressed={isServiced}
              className={`min-h-[44px] sm:min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-colors border cursor-pointer ${
                isServiced
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40'
                  : 'bg-surface-subtle text-body border-border/80 hover:text-ink dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:text-zinc-50'
              }`}
            >
              <CheckCircle2 aria-hidden="true" className={`w-3.5 h-3.5 ${isServiced ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'}`} />
              <span>Recently Serviced ✓</span>
            </button>

            <span className="text-xs text-muted dark:text-zinc-400">
              Expected replacement:{' '}
              <strong className="font-mono tabular-nums text-ink dark:text-zinc-200">
                {formatDistance(item.criticalLimitMiles || item.serviceIntervalMiles)}
              </strong>
            </span>
          </div>

          {/* Wear Progress Bar */}
          <div className="flex items-center gap-3">
            <div
              role="progressbar"
              aria-label={`${item.name} wear`}
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 flex-1 overflow-hidden rounded-full bg-border dark:bg-zinc-800"
            >
              <div
                className="h-full rounded-full transition-[width] duration-200 ease-out"
                style={{
                  width: `${pct}%`,
                  backgroundColor: isServiced ? '#12A150' : BAR_COLOR[status] || '#12A150',
                }}
              />
            </div>
            <span className="w-24 text-right text-xs text-muted dark:text-zinc-400 font-medium">
              <span className="font-mono tabular-nums">{pct}%</span> life used
            </span>
          </div>

          {/* Workshop & DIY Cost Split */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/70 dark:divide-zinc-800 rounded-xl bg-surface-subtle/70 dark:bg-zinc-900/60 border border-border/60 dark:border-zinc-800 px-3 py-2.5">
            <div className="py-1 sm:py-0 sm:pr-3">
              <span className="block text-[11px] text-muted dark:text-zinc-400">Independent Specialist</span>
              <span className="font-mono tabular-nums font-semibold text-ink dark:text-zinc-100">
                {formatCurrency(resolvedCosts.independent[0])}–{formatCurrency(resolvedCosts.independent[1])}
              </span>
            </div>
            <div className="py-1 sm:py-0 sm:px-3">
              <span className="block text-[11px] text-muted dark:text-zinc-400">Main Dealership</span>
              <span className="font-mono tabular-nums font-semibold text-ink dark:text-zinc-100">
                {formatCurrency(resolvedCosts.dealership[0])}–{formatCurrency(resolvedCosts.dealership[1])}
              </span>
            </div>
            <div className="py-1 sm:py-0 sm:pl-3">
              <span className="block text-[11px] text-muted dark:text-zinc-400">DIY Parts Est.</span>
              <span className="font-mono tabular-nums font-semibold text-ink dark:text-zinc-100">
                {Array.isArray(resolvedCosts.diyParts)
                  ? `${formatCurrency(resolvedCosts.diyParts[0])}–${formatCurrency(resolvedCosts.diyParts[1])}`
                  : 'Specialist tools required'}
              </span>
            </div>
          </div>

          {/* OEM Fallacy Warning & Callout */}
          {scheduleMode === 'oem' && (item.oemFallacyBadge || item.oemFallacyExplanation) && (
            <div className="rounded-xl bg-rose-50/75 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/40 p-3 text-xs text-rose-900 dark:text-rose-200 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {item.oemFallacyBadge && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-sans font-semibold bg-rose-100/80 text-rose-800 border border-rose-200 dark:bg-rose-900/50 dark:text-rose-200 dark:border-rose-800/50">
                    {item.oemFallacyBadge}
                  </span>
                )}
                {item.oemIntervalDisplay && (
                  <span className="text-xs text-rose-800 dark:text-rose-300">
                    OEM Spec: <span className="line-through font-mono tabular-nums font-semibold">{item.oemIntervalDisplay}</span>
                  </span>
                )}
              </div>
              {item.oemFallacyExplanation && (
                <div className="flex items-start gap-2">
                  <AlertTriangle aria-hidden="true" className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block">{item.oemFallacyTitle || 'OEM Telemetry Fallacy'}</strong>
                    <p className="mt-0.5 leading-relaxed">{item.oemFallacyExplanation}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Symptoms & Thermodynamic Mechanism */}
          {(item.failureModeSummary || item.thermodynamicMechanism) && (
            <div className="space-y-1.5 text-body dark:text-zinc-300 leading-relaxed">
              {item.failureModeSummary && (
                <p>
                  <strong className="font-semibold text-ink dark:text-zinc-100">Symptoms &amp; Failure Modes: </strong>
                  {item.failureModeSummary}
                </p>
              )}
              {item.thermodynamicMechanism && (
                <p>
                  <strong className="font-semibold text-ink dark:text-zinc-100">Engineering Mechanism: </strong>
                  {item.thermodynamicMechanism}
                </p>
              )}
            </div>
          )}

          {/* Preventative Advice */}
          {item.preventativeAdvice && (
            <div className="rounded-xl bg-surface-subtle/80 dark:bg-zinc-900/70 px-3.5 py-2.5 text-body dark:text-zinc-300 leading-relaxed flex items-start gap-2">
              <Lightbulb aria-hidden="true" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-ink dark:text-zinc-100">Preventative Strategy: </strong>
                {item.preventativeAdvice}
              </div>
            </div>
          )}

          {/* Related OBD-II Fault Links */}
          {Array.isArray(item.relatedObdCodes) && item.relatedObdCodes.length > 0 && activePreset && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-medium text-muted dark:text-zinc-400">Related DTCs:</span>
              {item.relatedObdCodes.map((code) => (
                <a
                  key={code}
                  href={`/obd/${activePreset.id}/${String(code).toLowerCase()}`}
                  onClick={(e) => {
                    if (onNavigateToHybridObd) {
                      e.preventDefault();
                      onNavigateToHybridObd(activePreset.id, code);
                    } else if (onNavigateToObd) {
                      e.preventDefault();
                      onNavigateToObd(code);
                    }
                  }}
                  className="min-h-[36px] inline-flex items-center px-2.5 py-1 rounded-lg font-mono tabular-nums text-[11px] font-semibold bg-surface-subtle hover:bg-canvas dark:bg-zinc-900 dark:hover:bg-zinc-800 text-primary-700 dark:text-emerald-400 border border-border/80 dark:border-zinc-800 transition-colors"
                  title={`Inspect ${code} repair cost for ${activePreset.name}`}
                >
                  {code}
                </a>
              ))}
            </div>
          )}
        </div>
      </details>
    </li>
  );
}

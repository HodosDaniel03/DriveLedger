import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '../common/OdometerPrimitives';
import { useUnits } from '../../context/UnitContext';

const DEFAULT_CATEGORIES = [
  { id: 'depreciation', label: 'Depreciation', color: '#183D22' },
  { id: 'fuel', label: 'Fuel / Energy', color: '#3B82F6' },
  { id: 'insurance', label: 'Insurance', color: '#10B981' },
  { id: 'maintenance', label: 'Maintenance & Repairs', color: '#F59E0B' },
  { id: 'interest', label: 'Financing Interest', color: '#94A3B8' },
];

export default function CostTimeline({
  calculateYearCost,
  currentYears = 5,
  highlightedCategory = null,
  onHighlightCategory,
  onSelectYear,
  className = '',
}) {
  const { formatCurrency } = useUnits();
  const [hoveredYear, setHoveredYear] = useState(null);
  const [pinnedYear, setPinnedYear] = useState(null);
  const [internalHighlight, setInternalHighlight] = useState(null);

  const activeHighlight =
    highlightedCategory !== undefined && highlightedCategory !== null
      ? highlightedCategory
      : internalHighlight;

  const handleHighlight = useCallback(
    (catId) => {
      if (onHighlightCategory) {
        onHighlightCategory(catId);
      } else {
        setInternalHighlight(catId);
      }
    },
    [onHighlightCategory]
  );

  const points = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const yr = i + 1;
      const res = calculateYearCost(yr);
      return {
        year: yr,
        total: res.totalEconomicCostUsd,
        depreciation: res.totalDepreciationUsd,
        breakdown: res.breakdown || [],
      };
    });
  }, [calculateYearCost]);

  const activeYear = hoveredYear ?? pinnedYear ?? currentYears;
  const activeIndex = activeYear - 1;
  const active = points[Math.max(0, Math.min(points.length - 1, activeIndex))] || points[0];
  const maxTotal = points[points.length - 1]?.total || 1;

  const depSharePct = active.total > 0 ? Math.round((active.depreciation / active.total) * 100) : 0;
  const showTooltip = hoveredYear !== null || pinnedYear !== null;

  const categories =
    points[0]?.breakdown && points[0].breakdown.length > 0
      ? points[0].breakdown
      : DEFAULT_CATEGORIES;

  return (
    <Card className={`p-5 sm:p-6 overflow-hidden ${className}`} aria-labelledby="timeline-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4 min-w-0 pb-4 border-b border-border/70 dark:border-zinc-800">
        <div className="min-w-0">
          <span className="sr-only">Lifecycle trajectory</span>
          <h2
            id="timeline-heading"
            className="font-sans text-h3 font-bold tracking-tight text-ink dark:text-zinc-50 scroll-mt-28 lg:scroll-mt-32"
          >
            Cost over time
          </h2>
          <p className="mt-0.5 font-sans text-xs sm:text-sm text-muted dark:text-zinc-400">
            Cumulative cost of ownership, year by year.
          </p>
        </div>
        <dl className="flex gap-6 text-left sm:text-right divide-x divide-border/70 dark:divide-zinc-800" aria-live="polite">
          <div className="pr-0 sm:pr-0">
            <dt className="font-sans text-xs text-muted dark:text-zinc-400">After year {active.year}</dt>
            <dd className="text-lg sm:text-xl font-bold tabular-nums tracking-tight text-ink dark:text-zinc-50 font-mono">
              {formatCurrency(active.total)}
            </dd>
          </div>
          <div className="hidden sm:block pl-6">
            <dt className="font-sans text-xs text-muted dark:text-zinc-400">Depreciation share</dt>
            <dd className="text-lg sm:text-xl font-bold tabular-nums tracking-tight text-[#183D22] dark:text-emerald-400 font-mono">
              {depSharePct}%
            </dd>
          </div>
        </dl>
      </div>

      {/* 10-Year Interactive Stacked Bar Chart */}
      <div
        className="mt-7 sm:mt-8 flex h-52 sm:h-60 items-end gap-1.5 sm:gap-3 relative min-w-0"
        role="img"
        aria-label={`Cumulative cost chart. After 10 years: ${formatCurrency(maxTotal)}.`}
        onMouseLeave={() => {
          setHoveredYear(null);
          handleHighlight(null);
        }}
      >
        {points.map((p) => {
          const isCurrentSelected = p.year === currentYears;
          const isPinned = p.year === pinnedYear;
          const isActive = p.year === activeYear;
          const isBarHighlighted = isActive || isPinned;
          const heightPct = Math.min(100, Math.max(12, Math.round((p.total / maxTotal) * 100)));

          let alignmentClass = 'left-1/2 -translate-x-1/2';
          if (p.year <= 3) {
            alignmentClass = 'left-0';
          } else if (p.year >= 8) {
            alignmentClass = 'right-0';
          }

          return (
            <div
              key={p.year}
              role="button"
              tabIndex={0}
              aria-label={`Year ${p.year} cumulative cost: ${formatCurrency(p.total)}`}
              aria-pressed={isPinned}
              onClick={() => {
                setPinnedYear((prev) => (prev === p.year ? null : p.year));
                onSelectYear?.(p.year);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setPinnedYear((prev) => (prev === p.year ? null : p.year));
                  onSelectYear?.(p.year);
                }
              }}
              onFocus={() => setHoveredYear(p.year)}
              onBlur={() => setHoveredYear(null)}
              onMouseEnter={() => setHoveredYear(p.year)}
              className="relative flex h-full flex-1 min-w-0 flex-col items-center justify-end gap-1.5 sm:gap-2 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-lg"
            >
              <div className="relative w-full" style={{ height: `${heightPct}%` }}>
                {isActive && showTooltip && (
                  <div
                    className={`absolute bottom-full mb-2.5 z-30 pointer-events-none w-52 sm:w-64 max-w-[calc(100dvw-2.5rem)] rounded-xl border border-border/90 dark:border-zinc-700/80 bg-surface/98 dark:bg-zinc-900/95 backdrop-blur-md p-3 shadow-xl transition-opacity duration-150 ${alignmentClass}`}
                    role="tooltip"
                    aria-hidden="false"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-border/70 dark:border-zinc-800">
                      <span className="font-sans text-xs font-semibold text-ink dark:text-zinc-50">
                        Year {p.year} Total
                      </span>
                      <span className="font-mono text-xs sm:text-sm font-bold text-ink dark:text-zinc-50 tabular-nums">
                        {formatCurrency(p.total)}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-xs">
                      {p.breakdown.map((b) => {
                        const isDimmed = activeHighlight !== null && activeHighlight !== b.id;
                        const isCatHighlighted = activeHighlight === b.id;
                        return (
                          <div
                            key={b.id}
                            className={`flex items-center justify-between py-0.5 px-1 rounded transition-opacity duration-150 min-w-0 ${
                              isDimmed ? 'opacity-35' : 'opacity-100'
                            } ${isCatHighlighted ? 'bg-surface-subtle dark:bg-zinc-800 font-semibold' : ''}`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                              <span
                                className="w-2 h-2 rounded-sm shrink-0"
                                style={{ backgroundColor: b.color }}
                                aria-hidden="true"
                              />
                              <span className="truncate font-sans text-ink dark:text-zinc-200 text-[11px] sm:text-xs">
                                {b.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 font-mono tabular-nums text-[11px] sm:text-xs">
                              <span className="font-medium text-ink dark:text-zinc-100">
                                {formatCurrency(b.amountUsd)}
                              </span>
                              <span className="text-muted dark:text-zinc-400 text-[10px] w-8 text-right">
                                {Math.round(b.sharePct)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5 Stacked Bar Layers */}
                <div
                  className={`flex w-full h-full flex-col-reverse overflow-hidden rounded-t-lg transition-[height,opacity] duration-200 ease-out ${
                    isBarHighlighted ? 'ring-2 ring-primary-600/50 dark:ring-emerald-400/50' : 'opacity-85 group-hover:opacity-100'
                  }`}
                  onMouseLeave={() => handleHighlight(null)}
                >
                  {p.breakdown.map((layer) => {
                    const isDimmed = activeHighlight !== null && activeHighlight !== layer.id;
                    const isCatHighlighted = activeHighlight === layer.id;
                    const layerHeightPct = p.total > 0 ? (layer.amountUsd / p.total) * 100 : 0;

                    if (layerHeightPct <= 0) return null;

                    return (
                      <div
                        key={layer.id}
                        className={`w-full transition-[height,opacity] duration-200 ease-out ${
                          isDimmed ? 'opacity-25' : 'opacity-100'
                        } ${isCatHighlighted ? 'brightness-110 saturate-125' : ''}`}
                        style={{
                          height: `${layerHeightPct}%`,
                          backgroundColor: layer.color,
                        }}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          handleHighlight(layer.id);
                        }}
                        title={`${layer.label}: ${formatCurrency(layer.amountUsd)} (${layer.sharePct}%)`}
                      />
                    );
                  })}
                </div>
              </div>

              <span
                className={`text-[11px] sm:text-xs tabular-nums font-mono transition-colors ${
                  isCurrentSelected
                    ? 'font-bold text-ink dark:text-zinc-50 underline decoration-primary-600 dark:decoration-emerald-400 decoration-2 underline-offset-4'
                    : isPinned
                    ? 'font-bold text-primary-600 dark:text-emerald-400'
                    : 'text-faint dark:text-zinc-400'
                }`}
              >
                Y{p.year}
              </span>
            </div>
          );
        })}
      </div>

      {/* 5-Category Synchronized Interactive Legend */}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-body dark:text-zinc-300 pt-3 border-t border-border/70 dark:border-zinc-800 min-w-0">
        {categories.map((cat) => {
          const isCategoryDimmed = activeHighlight !== null && activeHighlight !== cat.id;
          const isCategoryHighlighted = activeHighlight === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onMouseEnter={() => handleHighlight(cat.id)}
              onMouseLeave={() => handleHighlight(null)}
              onFocus={() => handleHighlight(cat.id)}
              onBlur={() => handleHighlight(null)}
              title={cat.label}
              className={`min-h-[44px] sm:min-h-[32px] inline-flex items-center gap-2 min-w-0 max-w-full font-sans font-medium transition-opacity duration-150 cursor-pointer rounded-lg px-2 py-1 -mx-1 ${
                isCategoryDimmed ? 'opacity-30' : 'opacity-100'
              } ${
                isCategoryHighlighted
                  ? 'bg-surface-subtle dark:bg-zinc-800 text-ink dark:text-zinc-50 font-semibold'
                  : 'text-body dark:text-zinc-300 hover:text-ink dark:hover:text-zinc-50'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
                aria-hidden="true"
              />
              <span className="truncate">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

import React from 'react';
import { FileText, RotateCcw } from 'lucide-react';

export default function PpiStickyBar({
  reviewedCount,
  totalCount,
  progressPct,
  flaggedCount,
  naCount,
  totalDeductionUsd,
  recommendedOpeningOfferUsd,
  formatCurrency,
  onReset,
  onOpenSummary,
}) {
  const flagLabel = flaggedCount === 1 ? 'flag' : 'flags';

  return (
    <>
      {/* Desktop Sticky Top Progress & Leverage Bar */}
      <div
        data-testid="ppi-desktop-sticky-bar"
        className="hidden lg:flex lg:sticky lg:top-[5.25rem] z-20 items-center justify-between gap-4 rounded-2xl border border-border/90 dark:border-zinc-800 bg-surface/95 dark:bg-[#121215]/95 backdrop-blur-md px-5 py-3 shadow-sm print:hidden"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="inline-flex items-center justify-center rounded-xl bg-[#183D22] dark:bg-emerald-600 text-white px-2.5 py-1 font-mono text-xs font-bold tabular-nums shrink-0">
            {progressPct}%
          </span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-xs">
            <span className="font-semibold text-ink dark:text-zinc-100">
              <span className="font-mono tabular-nums">{reviewedCount} / {totalCount}</span> checked
            </span>
            <span
              className={`font-medium ${
                flaggedCount > 0
                  ? 'text-rose-700 dark:text-rose-400 font-semibold'
                  : 'text-muted dark:text-zinc-400'
              }`}
            >
              <span className="font-mono tabular-nums">{flaggedCount}</span> {flagLabel}
            </span>
            {naCount > 0 && (
              <span className="text-muted dark:text-zinc-400">
                <span className="font-mono tabular-nums">{naCount}</span> N/A
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs font-sans border-r border-border/80 dark:border-zinc-800 pr-3">
            <div>
              <span className="text-muted dark:text-zinc-400 mr-1.5">Leverage</span>
              <span className="font-mono font-bold tabular-nums text-rose-700 dark:text-rose-400">
                -{formatCurrency(totalDeductionUsd)}
              </span>
            </div>
            <div>
              <span className="text-muted dark:text-zinc-400 mr-1.5">Offer</span>
              <span className="font-mono font-bold tabular-nums text-ink dark:text-zinc-50">
                {formatCurrency(recommendedOpeningOfferUsd)}
              </span>
            </div>
          </div>

          {reviewedCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-sans font-medium text-muted hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-surface-subtle dark:hover:bg-zinc-900 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw aria-hidden="true" className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSummary}
            className="min-h-[40px] rounded-xl bg-[#183D22] hover:bg-[#122E19] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-4 py-2 font-sans text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText aria-hidden="true" className="w-3.5 h-3.5" />
            <span>Summary &amp; Offer</span>
          </button>
        </div>
      </div>

      {/* Mobile Compact Single-Row Sticky Bottom Bar (< 12% dvh) */}
      <div
        data-testid="ppi-mobile-sticky-bar"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border dark:border-zinc-800 bg-surface/95 dark:bg-zinc-950/95 backdrop-blur-md px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-lg flex items-center justify-between gap-3 safe-area-x print:hidden"
      >
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[11px] font-medium tabular-nums text-muted dark:text-zinc-400 truncate">
            {reviewedCount}/{totalCount} checked ·{' '}
            <span className={flaggedCount > 0 ? 'text-rose-700 dark:text-rose-400 font-semibold' : ''}>
              {flaggedCount} {flagLabel}
            </span>
            {naCount > 0 ? ` · ${naCount} N/A` : ''}
          </div>
          <div className="font-mono text-sm font-bold tabular-nums text-ink dark:text-zinc-50 truncate">
            -{formatCurrency(totalDeductionUsd)} · Offer {formatCurrency(recommendedOpeningOfferUsd)}
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenSummary}
          className="min-h-[44px] shrink-0 rounded-xl bg-[#183D22] hover:bg-[#122E19] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-3.5 py-2 font-sans text-xs font-semibold transition-colors cursor-pointer"
        >
          Summary ↑
        </button>
      </div>
    </>
  );
}

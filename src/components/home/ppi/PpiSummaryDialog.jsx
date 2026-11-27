import React, { useEffect, useRef, useMemo, useState } from 'react';
import { X, Copy, Check, Printer, Share2, AlertTriangle } from 'lucide-react';
import { buildSellerNegotiationScript } from './ppiStages';

function isOutsideRect(clientX, clientY, panelEl) {
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

function legacyCopyText(text) {
  if (typeof document === 'undefined' || !document.body) return false;
  const previousFocus = document.activeElement;
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
  document.body.append(field);
  field.select();
  try {
    return typeof document.execCommand === 'function' ? document.execCommand('copy') : false;
  } catch {
    return false;
  } finally {
    field.remove();
    if (previousFocus && typeof previousFocus.focus === 'function') {
      try {
        previousFocus.focus({ preventScroll: true });
      } catch {
        // Safe guard
      }
    }
  }
}

export default function PpiSummaryDialog({
  open,
  onClose,
  vehicle,
  askingPriceUsd,
  odometerMiles,
  negotiationTargets,
  reviewedCount,
  totalCount,
  naCount,
  formatCurrency,
  formatDistance,
  onShareLink,
  copyFeedback,
  onPrint,
}) {
  const dialogRef = useRef(null);
  const sheetRef = useRef(null);
  const scriptTimerRef = useRef(null);
  const [scriptCopyState, setScriptCopyState] = useState('idle'); // 'idle' | 'copied' | 'failed'
  const dialogId = 'ppi-summary-dialog';

  useEffect(() => {
    return () => {
      if (scriptTimerRef.current) clearTimeout(scriptTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) setScriptCopyState('idle');
  }, [open]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const dialogEl =
      dialogRef.current ||
      (typeof document.getElementById === 'function' ? document.getElementById(dialogId) : null);
    if (!dialogEl) return undefined;

    if (open) {
      if (typeof dialogEl.showModal === 'function' && !dialogEl.open) {
        try {
          dialogEl.showModal();
        } catch {
          // Safe guard in mock DOM
        }
      }
    } else if (typeof dialogEl.close === 'function' && dialogEl.open) {
      try {
        dialogEl.close();
      } catch {
        // Safe guard
      }
    }
    return undefined;
  }, [open]);

  // Light-dismiss fallback for browsers without native <dialog closedby="any">
  useEffect(() => {
    if (!open || typeof document === 'undefined' || typeof HTMLDialogElement === 'undefined') {
      return undefined;
    }
    if ('closedBy' in HTMLDialogElement.prototype) return undefined;

    const dialogEl =
      dialogRef.current ||
      (typeof document.getElementById === 'function' ? document.getElementById(dialogId) : null);
    if (!dialogEl || typeof dialogEl.addEventListener !== 'function') return undefined;

    let pressedOutside = false;
    const handlePointerDown = (event) => {
      pressedOutside = event.target === dialogEl && isOutsideRect(event.clientX, event.clientY, sheetRef.current);
    };
    const handlePointerUp = (event) => {
      if (pressedOutside && event.target === dialogEl && isOutsideRect(event.clientX, event.clientY, sheetRef.current)) {
        if (typeof onClose === 'function') onClose();
      }
      pressedOutside = false;
    };

    dialogEl.addEventListener('pointerdown', handlePointerDown);
    dialogEl.addEventListener('pointerup', handlePointerUp);
    return () => {
      if (typeof dialogEl.removeEventListener === 'function') {
        dialogEl.removeEventListener('pointerdown', handlePointerDown);
        dialogEl.removeEventListener('pointerup', handlePointerUp);
      }
    };
  }, [open, onClose]);

  const sellerScript = useMemo(
    () =>
      buildSellerNegotiationScript({
        vehicle,
        askingPriceUsd,
        odometerMiles,
        negotiationTargets,
        reviewedCount,
        totalCount,
        naCount,
        formatCurrency,
        formatDistance,
      }),
    [
      vehicle,
      askingPriceUsd,
      odometerMiles,
      negotiationTargets,
      reviewedCount,
      totalCount,
      naCount,
      formatCurrency,
      formatDistance,
    ]
  );

  const handleCopyScript = async () => {
    if (!sellerScript) return;
    if (scriptTimerRef.current) clearTimeout(scriptTimerRef.current);
    let copied = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(sellerScript);
        copied = true;
      } else {
        copied = legacyCopyText(sellerScript);
      }
    } catch {
      copied = legacyCopyText(sellerScript);
    }

    setScriptCopyState(copied ? 'copied' : 'failed');
    scriptTimerRef.current = setTimeout(() => {
      setScriptCopyState('idle');
    }, 2500);
  };

  if (!open || !vehicle) return null;

  const flaggedSteps = negotiationTargets?.flaggedSteps || [];

  return (
    <dialog
      ref={dialogRef}
      id={dialogId}
      closedby="any"
      aria-labelledby="ppi-summary-modal-title"
      data-testid="ppi-summary-dialog"
      onClose={() => {
        if (typeof onClose === 'function') onClose();
      }}
      onClick={(e) => {
        if (
          e.target === e.currentTarget &&
          isOutsideRect(e.clientX, e.clientY, sheetRef.current) &&
          typeof onClose === 'function'
        ) {
          onClose();
        }
      }}
      className="dl-bottom-sheet-dialog sm:items-center sm:justify-center sm:p-4 print:hidden"
    >
      <div
        ref={sheetRef}
        className="w-full max-w-2xl max-h-[88dvh] rounded-t-2xl sm:rounded-2xl bg-surface dark:bg-[#121215] border-t border-x sm:border border-border dark:border-zinc-800 p-5 sm:p-6 shadow-xl overflow-y-auto safe-area-bottom space-y-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-border/80 dark:border-zinc-800">
          <div className="min-w-0">
            <h2
              id="ppi-summary-modal-title"
              className="font-sans text-lg font-bold tracking-tight text-ink dark:text-zinc-50"
            >
              Negotiation &amp; Print Summary
            </h2>
            <p className="font-sans text-xs sm:text-sm text-muted dark:text-zinc-400 mt-0.5 break-words">
              {vehicle.name} · <span className="font-mono tabular-nums">{formatDistance(odometerMiles)}</span> ·{' '}
              <span className="font-mono tabular-nums">{reviewedCount}/{totalCount}</span> checked
              {naCount > 0 ? ` (${naCount} N/A)` : ''}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close summary dialog"
            onClick={() => onClose && onClose()}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-muted hover:text-ink dark:hover:text-zinc-100 hover:bg-surface-subtle dark:hover:bg-zinc-900 transition-colors shrink-0 cursor-pointer"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Metric Negotiation Strip (Hairline Dividers, Zero Box-in-Box) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/70 dark:divide-zinc-800 rounded-xl bg-surface-subtle/70 dark:bg-zinc-900/60 border border-border/70 dark:border-zinc-800">
          <div className="p-3.5">
            <span className="block font-sans text-xs text-muted dark:text-zinc-400">Asking Price</span>
            <span className="mt-1 block font-mono text-base font-bold tabular-nums text-ink dark:text-zinc-50">
              {formatCurrency(askingPriceUsd)}
            </span>
          </div>
          <div className="p-3.5">
            <span className="block font-sans text-xs text-muted dark:text-zinc-400">Total Leverage</span>
            <span className="mt-1 block font-mono text-base font-bold tabular-nums text-rose-700 dark:text-rose-400">
              -{formatCurrency(negotiationTargets.totalDeductionUsd)}
            </span>
          </div>
          <div className="p-3.5 bg-[#183D22]/5 dark:bg-emerald-950/25">
            <span className="block font-sans text-xs font-medium text-[#183D22] dark:text-emerald-400">
              Opening Offer
            </span>
            <span className="mt-1 block font-mono text-base font-bold tabular-nums text-[#183D22] dark:text-emerald-300">
              {formatCurrency(negotiationTargets.recommendedOpeningOfferUsd)}
            </span>
          </div>
          <div className="p-3.5">
            <span className="block font-sans text-xs text-muted dark:text-zinc-400">Walk-Away Ceiling</span>
            <span className="mt-1 block font-mono text-base font-bold tabular-nums text-ink dark:text-zinc-50">
              {formatCurrency(negotiationTargets.walkAwayCeilingUsd)}
            </span>
          </div>
        </div>

        {/* Itemized Flagged Defects */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-sans text-sm font-semibold text-ink dark:text-zinc-100">
              Flagged Defects ({flaggedSteps.length})
            </h3>
            {negotiationTargets.wearReserveDeductionUsd > 0 && (
              <span className="font-mono text-xs tabular-nums text-muted dark:text-zinc-400">
                + Wear reserve -{formatCurrency(negotiationTargets.wearReserveDeductionUsd)}
              </span>
            )}
          </div>

          {flaggedSteps.length > 0 ? (
            <ul className="divide-y divide-border/70 dark:divide-zinc-800 rounded-xl border border-border/70 dark:border-zinc-800 bg-canvas/50 dark:bg-zinc-950/40">
              {flaggedSteps.map((item) => (
                <li key={item.id} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                  <span className="inline-flex items-center gap-2 font-sans font-medium text-ink dark:text-zinc-200 min-w-0">
                    <AlertTriangle aria-hidden="true" className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </span>
                  <span className="font-mono font-bold tabular-nums text-rose-700 dark:text-rose-400 shrink-0">
                    -{formatCurrency(item.deductionUsd)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-surface-subtle/70 dark:bg-zinc-900/50 px-3.5 py-2.5 font-sans text-xs text-muted dark:text-zinc-400">
              No inspection defects flagged yet. Flag any discovered issues on-site to itemize repair deductions.
            </p>
          )}
        </div>

        {/* Copyable Seller Negotiation Script */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-sans text-sm font-semibold text-ink dark:text-zinc-100">
              Seller Negotiation Script
            </h3>
            <div className="flex items-center gap-2">
              <span
                role="status"
                className="font-sans text-xs font-medium text-emerald-700 dark:text-emerald-400"
              >
                {scriptCopyState === 'copied'
                  ? 'Copied to clipboard'
                  : scriptCopyState === 'failed'
                  ? 'Copy unavailable — select text below'
                  : ''}
              </span>
              <button
                type="button"
                onClick={handleCopyScript}
                className="min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-xl border border-border dark:border-zinc-700 bg-surface-subtle dark:bg-zinc-900 hover:bg-canvas dark:hover:bg-zinc-800 text-xs font-sans font-semibold text-ink dark:text-zinc-100 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {scriptCopyState === 'copied' ? (
                  <Check aria-hidden="true" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy aria-hidden="true" className="w-3.5 h-3.5 text-muted dark:text-zinc-400" />
                )}
                <span>{scriptCopyState === 'copied' ? 'Copied' : 'Copy Script'}</span>
              </button>
            </div>
          </div>

          <pre
            id="ppi-seller-script"
            tabIndex={0}
            className="whitespace-pre-wrap break-words rounded-xl bg-surface-subtle/80 dark:bg-zinc-900/80 border border-border/70 dark:border-zinc-800 p-3.5 font-sans text-xs leading-relaxed text-ink dark:text-zinc-200 max-h-48 overflow-y-auto"
          >
            {sellerScript}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-border/80 dark:border-zinc-800">
          <button
            type="button"
            onClick={onShareLink}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-border dark:border-zinc-700 bg-surface-subtle dark:bg-zinc-900 hover:bg-canvas dark:hover:bg-zinc-800 font-sans text-xs sm:text-sm font-semibold text-ink dark:text-zinc-100 inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copyFeedback ? (
              <>
                <Check aria-hidden="true" className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Link copied!</span>
              </>
            ) : (
              <>
                <Share2 aria-hidden="true" className="w-4 h-4 text-muted dark:text-zinc-400" />
                <span>Share Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (typeof onClose === 'function') onClose();
              if (typeof onPrint === 'function') onPrint();
            }}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#183D22] hover:bg-[#122E19] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-sans text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer aria-hidden="true" className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}

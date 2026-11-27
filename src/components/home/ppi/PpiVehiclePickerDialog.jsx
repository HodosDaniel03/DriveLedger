import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import VehicleSelect from '../../common/VehicleSelect';
import { PPI_POPULAR_SHORTCUTS } from './ppiStages';

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

export default function PpiVehiclePickerDialog({
  open,
  onClose,
  selectedPresetId,
  draftPresetId,
  setDraftPresetId,
  draftPreset,
  onSelectPreset,
}) {
  const dialogRef = useRef(null);
  const sheetRef = useRef(null);
  const dialogId = 'ppi-switch-car-dialog';

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
          // Safe guard in mock DOM or already-open state
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

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      id={dialogId}
      closedby="any"
      aria-labelledby="ppi-switch-car-title"
      data-testid="ppi-vehicle-catalog-modal"
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
        className="w-full max-w-xl max-h-[88dvh] rounded-t-2xl sm:rounded-2xl bg-surface dark:bg-[#121215] border-t border-x sm:border border-border dark:border-zinc-800 p-5 sm:p-6 shadow-xl overflow-y-auto safe-area-bottom"
      >
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-border/80 dark:border-zinc-800">
          <div>
            <h2
              id="ppi-switch-car-title"
              className="font-sans text-lg font-bold tracking-tight text-ink dark:text-zinc-50"
            >
              Switch Vehicle
            </h2>
            <p className="font-sans text-xs sm:text-sm text-muted dark:text-zinc-400 mt-0.5">
              Search 179+ benchmarked models or pick a popular configuration.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close vehicle picker"
            onClick={() => onClose && onClose()}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-muted hover:text-ink dark:hover:text-zinc-100 hover:bg-surface-subtle dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 border-b border-border/80 dark:border-zinc-800">
          <span className="block font-sans text-xs font-medium text-muted dark:text-zinc-400 mb-2">
            Popular benchmarks
          </span>
          <div className="flex flex-wrap gap-2">
            {PPI_POPULAR_SHORTCUTS.map((sc) => {
              const isSelected = sc.id === selectedPresetId;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    onSelectPreset(sc.id);
                    onClose();
                  }}
                  className={`min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-xl font-sans text-xs font-medium transition-colors border cursor-pointer ${
                    isSelected
                      ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500'
                      : 'bg-surface-subtle dark:bg-zinc-900 text-body dark:text-zinc-300 border-border/80 dark:border-zinc-800 hover:border-border-strong dark:hover:border-zinc-700'
                  }`}
                >
                  {sc.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 space-y-4">
          <VehicleSelect
            selectedPresetId={draftPresetId}
            onSelectPreset={setDraftPresetId}
            onAutocompleteSelect={(newId) => {
              onSelectPreset(newId);
              onClose();
            }}
            showTelemetryStrip={false}
            dropdownInFlow={true}
            selectDropdownId="ppi-modal-preset-sync"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border/80 dark:border-zinc-800">
            <div className="min-w-0">
              <span className="block text-[11px] font-sans text-muted dark:text-zinc-400">
                Selected vehicle
              </span>
              <span className="block font-sans text-xs sm:text-sm font-semibold text-ink dark:text-zinc-100 truncate">
                {draftPreset ? draftPreset.name : 'Choose a vehicle above'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onClose && onClose()}
                className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl border border-border dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900 font-sans text-xs sm:text-sm font-medium text-ink dark:text-zinc-200 hover:bg-canvas dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="ppi-modal-apply-button"
                disabled={!draftPreset}
                onClick={() => {
                  if (!draftPreset) return;
                  onSelectPreset(draftPreset.id);
                  onClose();
                }}
                className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl bg-[#183D22] text-white hover:bg-[#122E19] dark:bg-emerald-600 dark:hover:bg-emerald-500 font-sans text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Apply Vehicle
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

import React from 'react';
import { Check, AlertTriangle, ChevronDown, Clock } from 'lucide-react';
import { RiskBadge } from '../../common/OdometerPrimitives';

export default function PpiStageGroup({
  stage,
  stepStatuses,
  onSetStatus,
  formatCurrency,
  registerDetailsRef,
}) {
  const stageReviewed = stage.steps.filter((s) => Boolean(stepStatuses[s.id])).length;
  const stageFlagged = stage.steps.filter((s) => stepStatuses[s.id] === 'flag').length;

  return (
    <details
      open
      ref={(el) => {
        if (typeof registerDetailsRef === 'function') {
          registerDetailsRef(stage.id, el);
        }
      }}
      data-testid={`ppi-stage-${stage.id}`}
      className="dl-disclosure group rounded-2xl border border-border/80 dark:border-zinc-800 bg-surface dark:bg-[#121215] shadow-card print:border-gray-400 print:shadow-none"
    >
      <summary className="min-h-[52px] px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 select-none hover:bg-surface-subtle/60 dark:hover:bg-zinc-900/50 transition-colors rounded-2xl group-open:rounded-b-none">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-6 h-6 rounded-lg bg-surface-subtle dark:bg-zinc-800 border border-border/80 dark:border-zinc-700 font-mono text-xs font-bold tabular-nums text-ink dark:text-zinc-100 inline-flex items-center justify-center shrink-0">
            {stage.stageNumber}
          </span>
          <div className="min-w-0">
            <span className="font-sans text-sm sm:text-base font-semibold tracking-tight text-ink dark:text-zinc-50 block truncate print:text-black">
              {stage.title}
            </span>
            <span className="hidden md:block font-sans text-xs text-muted dark:text-zinc-400 truncate print:hidden">
              {stage.description}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {stageFlagged > 0 && (
            <span className="inline-flex items-center rounded-md bg-rose-50/90 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/40 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums">
              {stageFlagged} flagged
            </span>
          )}
          <span className="inline-flex items-center rounded-md bg-surface-subtle dark:bg-zinc-800/80 text-ink dark:text-zinc-200 border border-border/80 dark:border-zinc-700/70 px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums">
            {stageReviewed}/{stage.steps.length}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="w-4 h-4 text-muted dark:text-zinc-400 transition-transform duration-200 group-open:rotate-180 print:hidden"
          />
        </div>
      </summary>

      <div className="divide-y divide-border/70 dark:divide-zinc-800 border-t border-border/70 dark:border-zinc-800 print:border-gray-400">
        {stage.steps.map((s) => {
          const status = stepStatuses[s.id] || null;
          const isPass = status === 'pass';
          const isFlagged = status === 'flag';
          const isNa = status === 'na';

          const rowToneClass = isFlagged
            ? 'bg-rose-50/50 dark:bg-rose-950/20 print:bg-white'
            : isPass
            ? 'bg-emerald-50/40 dark:bg-emerald-950/15 print:bg-white'
            : isNa
            ? 'bg-surface-subtle/60 dark:bg-zinc-900/40 opacity-80 print:bg-white'
            : 'bg-transparent';

          return (
            <div
              key={s.id}
              data-testid={`ppi-step-row-${s.id}`}
              className={`px-4 sm:px-5 py-4 space-y-2.5 transition-colors ${rowToneClass}`}
            >
              {/* Header row: #index, title, max 2 badges, and exposure */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="font-mono tabular-nums font-bold text-xs text-muted dark:text-zinc-400 shrink-0">
                    #{s.displayIndex}
                  </span>
                  <h3
                    className={`font-sans text-sm font-semibold tracking-tight print:text-black ${
                      isPass || isNa
                        ? 'line-through text-muted dark:text-zinc-400'
                        : 'text-ink dark:text-zinc-100'
                    }`}
                  >
                    {s.title}
                  </h3>
                  {s.isModelSpecific && (
                    <span className="inline-flex min-h-[22px] items-center px-2 py-0.5 rounded-md text-[11px] font-medium font-sans bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40 print:text-black print:border-black">
                      Known Model Flaw
                    </span>
                  )}
                  <RiskBadge level={s.riskLevel} label={s.riskLabel} />
                </div>

                <div className="font-sans text-xs font-semibold text-primary-700 dark:text-emerald-400 shrink-0 print:text-black">
                  Exposure:{' '}
                  <span className="font-mono tabular-nums">
                    {formatCurrency(s.minRepairUsd)}–{formatCurrency(s.maxRepairUsd)}
                  </span>
                </div>
              </div>

              {/* Focus & Inspection Procedure (no box-in-box border) */}
              <p className="text-xs sm:text-[13px] text-body dark:text-zinc-300 leading-relaxed font-sans print:text-black">
                {s.focus}
              </p>

              <p className="rounded-xl bg-surface-subtle/80 dark:bg-zinc-900/70 px-3 py-2 text-xs text-ink dark:text-zinc-200 leading-relaxed font-sans print:bg-gray-50 print:text-black">
                <strong>Inspection procedure:</strong> {s.inspectionMethod}
              </p>

              {/* Footer metadata + 3-state >= 44px controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-sans font-medium text-muted dark:text-zinc-400 print:text-gray-700 min-w-0">
                  <span className="break-words">{s.keyPids}</span>
                  <span className="inline-flex items-center gap-1 shrink-0">
                    <Clock aria-hidden="true" className="w-3 h-3" />
                    {s.timeEst}
                  </span>
                </div>

                {/* Print-only status line */}
                <div className="hidden print:block font-mono text-xs font-semibold text-black">
                  {isFlagged
                    ? `[FLAGGED: -${formatCurrency(s.deductionUsd)}]`
                    : isPass
                    ? '[PASS]'
                    : isNa
                    ? '[N/A]'
                    : '[ ] Pass   [ ] Flag   [ ] N/A'}
                </div>

                {/* Interactive >= 44px Pass / Flag / N/A controls */}
                <div
                  role="group"
                  aria-label={`Inspection result for ${s.title}`}
                  className="grid grid-cols-3 sm:inline-flex gap-2 shrink-0 print:hidden"
                >
                  <button
                    type="button"
                    aria-pressed={isPass ? 'true' : 'false'}
                    onClick={(e) => {
                      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                      onSetStatus(s.id, 'pass', e);
                    }}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-sans font-semibold border inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isPass
                        ? 'bg-[#183D22] text-white border-[#183D22] dark:bg-emerald-600 dark:border-emerald-500'
                        : 'bg-surface dark:bg-zinc-900 text-ink dark:text-zinc-200 border-border dark:border-zinc-700 hover:bg-surface-subtle dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Check aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                    <span>{isPass ? 'Passed' : 'Pass'}</span>
                  </button>

                  <button
                    type="button"
                    data-testid={`flag-defect-${s.id}`}
                    aria-pressed={isFlagged ? 'true' : 'false'}
                    onClick={(e) => {
                      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                      onSetStatus(s.id, 'flag', e);
                    }}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-sans font-semibold border inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isFlagged
                        ? 'bg-score-poor text-white border-score-poor shadow-xs'
                        : 'bg-surface dark:bg-[#121215] text-danger-text dark:text-rose-300 border-[#F5C2C7] dark:border-rose-800 hover:bg-danger-bg dark:hover:bg-rose-950/30'
                    }`}
                  >
                    <AlertTriangle aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isFlagged ? 'Flagged' : 'Flag'}{' '}
                      <span className="font-mono tabular-nums">(-{formatCurrency(s.deductionUsd)})</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={isNa ? 'true' : 'false'}
                    onClick={(e) => {
                      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                      onSetStatus(s.id, 'na', e);
                    }}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-sans font-semibold border inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isNa
                        ? 'bg-zinc-700 text-white border-zinc-700 dark:bg-zinc-600 dark:border-zinc-500'
                        : 'bg-surface dark:bg-zinc-900 text-muted dark:text-zinc-300 border-border dark:border-zinc-700 hover:bg-surface-subtle dark:hover:bg-zinc-800'
                    }`}
                  >
                    <svg
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3.5 h-3.5 shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m4.9 4.9 14.2 14.2" />
                    </svg>
                    <span>N/A</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}

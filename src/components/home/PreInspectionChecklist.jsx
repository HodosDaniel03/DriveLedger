import React from 'react';
import { CheckCircle2, Clock, Wrench, Shield, ArrowRight } from 'lucide-react';
import { useUnits } from '../../context/UnitContext';

const INSPECTION_STEPS = [
  {
    step: 1,
    title: 'OBD-II DTC & Freeze Frame Scan',
    timeEst: '~0.5 hour',
    focus: 'Scan pending and permanent Diagnostic Trouble Codes; inspect Freeze Frame engine RPM, load, and coolant temp at fault occurrence.',
    keyPids: 'Mode 03, Mode 07, Mode 0A, Mode 02 Freeze Frame',
  },
  {
    step: 2,
    title: 'Live PID Telemetry & Sensor Sanity Check',
    timeEst: '~1.0 hour',
    focus: 'Compare Bank 1 vs Bank 2 Long-Term Fuel Trims (LTFT) at idle vs 2500 RPM; log DPF differential pressure and boost target vs actual.',
    keyPids: 'PID 0x06 (LTFT), PID 0x0B (MAP), PID 0x22 (Rail Pressure)',
  },
  {
    step: 3,
    title: 'Fluid Health & Cold-Cycle Dilution Audit',
    timeEst: '~0.5 hour',
    focus: 'Check oil viscosity and fuel odor dilution on direct-injected turbo engines; test brake fluid copper ppm and coolant pH balance.',
    keyPids: 'Kinematic Viscosity 100°C, Boiling Point >180°C',
  },
  {
    step: 4,
    title: 'Transmission & Dual-Mass Flywheel Evaluation',
    timeEst: '~1.5 hours',
    focus: 'Cold start and warm restart clutch engagement acoustic test; listen for DMF idle rattle; verify shift smoothness under wide-open throttle.',
    keyPids: 'TCU Slip Counters, Line Pressure Target Bar',
  },
  {
    step: 5,
    title: '5-Year Financial & Residual Outflow Audit',
    timeEst: '~0.5 hour',
    focus: 'Synthesize verified odometer wear factor against 5-year non-linear depreciation curve and mandatory specialist maintenance intervals.',
    keyPids: 'ShiftMetric Net TCO & Residual Curve Model',
  },
];

export default function PreInspectionChecklist({ onNavigateToObd, onNavigateToTco }) {
  const { formatCurrency } = useUnits();

  return (
    <section className="mb-12 p-6 sm:p-8 rounded-xl bg-surface dark:bg-slate-900 border border-border dark:border-slate-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-border dark:border-slate-800">
        <div>
          <span className="font-micro text-micro uppercase tracking-widest text-primary-600 dark:text-primary-400 font-semibold block">
            Pre-Purchase &amp; Workshop Protocol
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink dark:text-slate-100 mt-1">
            5-Step Automotive Telemetry Inspection
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateToObd()}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>Scan OBD-II Codes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Step-by-Step Inspection List */}
        <div className="lg:col-span-8 space-y-3">
          {INSPECTION_STEPS.map((s) => (
            <div
              key={s.step}
              className="p-4 rounded-xl bg-surface-subtle dark:bg-slate-800/80 border border-border dark:border-slate-700 flex items-start gap-3.5 hover:border-border-strong dark:hover:border-slate-600 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary-600 text-white font-code font-bold text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                {s.step}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <h3 className="text-sm font-bold text-ink dark:text-slate-100">
                    {s.title}
                  </h3>
                  <span className="text-[11px] font-code tabular-nums text-muted dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted dark:text-slate-400" />
                    {s.timeEst}
                  </span>
                </div>
                <p className="text-xs text-body dark:text-slate-300 mb-2 leading-relaxed">
                  {s.focus}
                </p>
                <span className="inline-block px-2.5 py-0.5 rounded bg-surface dark:bg-slate-900 border border-border dark:border-slate-700 text-[11px] font-code text-muted dark:text-slate-400">
                  Target PIDs: {s.keyPids}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Workshop Labor & Time Summary Table */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-surface-subtle dark:bg-slate-800/80 border border-border dark:border-slate-700 space-y-4 font-code text-xs">
          <div className="flex items-center justify-between border-b border-border dark:border-slate-700 pb-3">
            <span className="font-semibold uppercase tracking-wider text-muted dark:text-slate-400 text-[11px]">
              Inspection Benchmark
            </span>
            <span className="text-success-text dark:text-emerald-400 font-bold">~4.0 Hours Total</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between text-body dark:text-slate-300">
              <span>Main Dealership Rate:</span>
              <span className="font-bold tabular-nums text-ink dark:text-slate-100">$185 / hr</span>
            </div>
            <div className="flex justify-between text-body dark:text-slate-300">
              <span>Independent Specialist:</span>
              <span className="font-bold tabular-nums text-ink dark:text-slate-100">$115 / hr</span>
            </div>
            <div className="flex justify-between text-body dark:text-slate-300">
              <span>DIY Diagnostics Interface:</span>
              <span className="font-bold tabular-nums text-success-text dark:text-emerald-400">$35 (One-time)</span>
            </div>
          </div>

          <div className="pt-3 border-t border-border dark:border-slate-700">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-muted dark:text-slate-400 text-[11px]">Avg Pre-Purchase Value:</span>
              <span className="text-lg font-bold tabular-nums text-success-text dark:text-emerald-400">$2,450 Saved</span>
            </div>
            <p className="text-[11px] text-body dark:text-slate-300 font-sans leading-normal">
              73% of pre-owned vehicle buyers who run telemetry checks negotiate down or avoid major mechatronic / DPF repair bills.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTco()}
            className="w-full py-2.5 px-4 rounded-full text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-all text-center flex items-center justify-center gap-1.5 shadow-sm font-sans"
          >
            <span>Run 5-Yr Cost Audit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

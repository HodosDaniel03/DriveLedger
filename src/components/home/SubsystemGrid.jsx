import React from 'react';
import { Cpu, Wrench, Flame, Droplets, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { useUnits } from '../../context/UnitContext';

const SUBSYSTEMS = [
  {
    id: 'engine-turbo',
    name: 'Engine & Turbocharger',
    icon: Flame,
    typicalIssues: 'HPFP micro-pitting, VNT vane carbon sticking, PCV diaphragm tears',
    inspectionCheck: 'Fuel Rail Pressure (PID 0x22) & Turbo Boost Target vs Actual',
    typicalCostUsd: 1850,
    statusBadge: 'Attention',
    badgeTone: 'warn',
  },
  {
    id: 'transmission-clutch',
    name: 'Transmission & Dual-Clutch',
    icon: Cpu,
    typicalIssues: 'DSG mechatronic accumulator leak, DMF spring fatigue, clutch shudder',
    inspectionCheck: 'Clutch slip RPM telemetry & TCU fluid degradation counters',
    typicalCostUsd: 2450,
    statusBadge: 'Critical',
    badgeTone: 'risk',
  },
  {
    id: 'dpf-emissions',
    name: 'Exhaust, DPF & AdBlue/SCR',
    icon: Droplets,
    typicalIssues: 'Soot mass saturation under cold urban cycles, AdBlue crystallization',
    inspectionCheck: 'DPF Delta-P Sensor kPa at idle vs 2500 RPM (< 8 kPa)',
    typicalCostUsd: 2100,
    statusBadge: 'Service soon',
    badgeTone: 'warn',
  },
  {
    id: 'hv-battery',
    name: 'Hybrid & EV High-Voltage Pack',
    icon: Zap,
    typicalIssues: 'Cell delta voltage spread, thermal loop degradation, inverter coolant',
    inspectionCheck: 'Cell block mV balance (< 18 mV delta) & State-of-Health %',
    typicalCostUsd: 3800,
    statusBadge: 'Healthy',
    badgeTone: 'good',
  },
  {
    id: 'suspension-bushings',
    name: 'Multi-Link Suspension & Struts',
    icon: Wrench,
    typicalIssues: 'Hydraulic hydro-bushings cracking, ball-joint play, top mount tear',
    inspectionCheck: 'Dynamic wheel alignment deviation & damper rebound telemetry',
    typicalCostUsd: 1100,
    statusBadge: 'Attention',
    badgeTone: 'warn',
  },
  {
    id: 'brakes-regen',
    name: 'Braking & Energy Recuperation',
    icon: ShieldCheck,
    typicalIssues: 'Rotor warping, caliper slide corrosion, regenerative blending lag',
    inspectionCheck: 'Rotor runout measurement & brake fluid boiling point (> 180°C)',
    typicalCostUsd: 780,
    statusBadge: 'No issues found',
    badgeTone: 'good',
  },
];

export default function SubsystemGrid({ onNavigateToRisk }) {
  const { formatCurrency } = useUnits();

  return (
    <section className="mb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
        <div>
          <span className="font-micro text-micro uppercase tracking-widest text-primary-600 dark:text-primary-400 font-semibold block">
            Telemetry Diagnostic Nodes
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-ink dark:text-slate-100 mt-1">
            Critical Mechanical Subsystems Under Watch
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onNavigateToRisk()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-code transition-colors"
        >
          <span>Open Full Risk Matrix</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SUBSYSTEMS.map((sub) => {
          const Icon = sub.icon;
          const badgeClasses =
            sub.badgeTone === 'risk'
              ? 'bg-danger-bg text-danger-text border-[#F7C1BB] dark:bg-rose-950/70 dark:text-rose-400 dark:border-rose-800/80'
              : sub.badgeTone === 'warn'
              ? 'bg-warning-bg text-warning-text border-[#F5DE8A] dark:bg-amber-950/70 dark:text-amber-400 dark:border-amber-800/80'
              : 'bg-success-bg text-success-text border-[#BFE8CF] dark:bg-emerald-950/70 dark:text-emerald-400 dark:border-emerald-800/80';

          return (
            <div
              key={sub.id}
              onClick={() => onNavigateToRisk()}
              className="group p-6 rounded-xl bg-surface dark:bg-slate-900 border border-border dark:border-slate-800 shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClasses}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      sub.badgeTone === 'risk' ? 'bg-score-poor' : sub.badgeTone === 'warn' ? 'bg-score-fair' : 'bg-score-good'
                    }`} />
                    {sub.statusBadge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-ink dark:text-slate-100 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {sub.name}
                </h3>
                <p className="text-xs text-body dark:text-slate-300 leading-relaxed mb-4">
                  {sub.typicalIssues}
                </p>

                <div className="p-3 rounded-lg bg-surface-subtle dark:bg-slate-800/80 border border-border dark:border-slate-700 text-xs text-body dark:text-slate-300 space-y-1">
                  <span className="font-semibold text-ink dark:text-slate-100 block text-[10px] uppercase tracking-wider font-code">
                    First-Principles Check:
                  </span>
                  <p className="font-code text-[11px] text-muted dark:text-slate-400 truncate">
                    {sub.inspectionCheck}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-muted dark:text-slate-400">Fair Specialist Bill:</span>
                <span className="font-code tabular-nums font-bold text-ink dark:text-slate-100 text-sm">
                  {formatCurrency(sub.typicalCostUsd)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

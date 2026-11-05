import React from 'react';
import { Cpu, Wrench, Flame, Droplets, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { useUnits } from '../../context/UnitContext';
import { RiskBadge } from '../common/OdometerPrimitives';

const SUBSYSTEMS = [
  {
    id: 'engine-turbo',
    name: 'Engine & Turbocharger',
    icon: Flame,
    typicalIssues: 'High-pressure fuel pump wear, VNT carbon fouling, and PCV diaphragm rupture.',
    inspectionCheck: 'Fuel Rail Pressure (PID 0x22) & Turbo Boost Target vs Actual',
    typicalCostUsd: 1850,
    expectedInterval: '75,000 – 95,000 mi / 120,000 – 150,000 km',
    riskLevel: 'moderate',
    riskLabel: 'Moderate Risk',
    statusBadge: 'Moderate',
    badgeTone: 'warn',
  },
  {
    id: 'transmission-clutch',
    name: 'Transmission & Dual-Clutch',
    icon: Cpu,
    typicalIssues: 'DSG mechatronic solenoid pressure loss and dual-mass flywheel fatigue.',
    inspectionCheck: 'Clutch slip RPM telemetry & TCU fluid degradation counters',
    typicalCostUsd: 2450,
    expectedInterval: '40,000 mi (60,000 km) fluid / 95,000 mi clutch',
    riskLevel: 'critical',
    riskLabel: 'Critical Risk',
    statusBadge: 'Critical',
    badgeTone: 'risk',
  },
  {
    id: 'dpf-emissions',
    name: 'Exhaust, DPF & AdBlue/SCR',
    icon: Droplets,
    typicalIssues: 'Short-trip soot saturation, cracked DPF substrates, and differential pressure sensor drift.',
    inspectionCheck: 'DPF Delta-P Sensor kPa at idle vs 2500 RPM (< 8 kPa)',
    typicalCostUsd: 2100,
    expectedInterval: '85,000 – 110,000 mi / 140,000 – 180,000 km',
    riskLevel: 'moderate',
    riskLabel: 'Moderate Risk',
    statusBadge: 'Moderate',
    badgeTone: 'warn',
  },
  {
    id: 'hv-battery',
    name: 'Hybrid & EV High-Voltage Pack',
    icon: Zap,
    typicalIssues: 'Cell block voltage variance, contactor pitting, and inverter coolant degradation.',
    inspectionCheck: 'Cell block mV balance (< 18 mV delta) & State-of-Health %',
    typicalCostUsd: 3800,
    expectedInterval: '125,000 – 155,000 mi / 200,000 – 250,000 km',
    riskLevel: 'low',
    riskLabel: 'Low Risk',
    statusBadge: 'Low',
    badgeTone: 'good',
  },
  {
    id: 'suspension-bushings',
    name: 'Multi-Link Suspension & Struts',
    icon: Wrench,
    typicalIssues: 'Hydromount bushing cracking, control arm ball joint play, and top mount wear.',
    inspectionCheck: 'Dynamic wheel alignment deviation & damper rebound telemetry',
    typicalCostUsd: 1100,
    expectedInterval: '55,000 – 75,000 mi / 90,000 – 120,000 km',
    riskLevel: 'moderate',
    riskLabel: 'Moderate Risk',
    statusBadge: 'Moderate',
    badgeTone: 'warn',
  },
  {
    id: 'brakes-regen',
    name: 'Braking & Energy Recuperation',
    icon: ShieldCheck,
    typicalIssues: 'Rotor thickness variation, guide pin seizure, and brake blending valve corrosion.',
    inspectionCheck: 'Rotor runout measurement & brake fluid boiling point (> 180°C)',
    typicalCostUsd: 780,
    expectedInterval: '40,000 – 55,000 mi / 60,000 – 90,000 km',
    riskLevel: 'low',
    riskLabel: 'Low Risk',
    statusBadge: 'Low',
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
          <h2 className="text-2xl font-bold tracking-tight text-ink dark:text-zinc-100 mt-1">
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
              className="group p-6 rounded-xl bg-surface dark:bg-[#121215] border border-border dark:border-zinc-800 shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-[transform,box-shadow] duration-200 ease-out cursor-pointer flex flex-col justify-between min-w-0"
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-105 transition-transform shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <RiskBadge level={sub.riskLevel} label={sub.riskLabel} />
                </div>

                <h3 className="text-base font-bold text-ink dark:text-zinc-100 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                  {sub.name}
                </h3>
                <p className="text-xs text-body dark:text-zinc-300 leading-relaxed mb-3">
                  {sub.typicalIssues}
                </p>

                <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-sans font-medium text-muted dark:text-zinc-400">
                  <span className="font-semibold text-ink dark:text-zinc-200">
                    Interval: <span className="font-mono tabular-nums">{sub.expectedInterval}</span>
                  </span>
                  <span>·</span>
                  <span className="font-semibold text-primary-600 dark:text-primary-400">
                    Est. repair: <span className="font-mono tabular-nums">{formatCurrency(sub.typicalCostUsd)}</span>
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface-subtle dark:bg-zinc-800/80 border border-border dark:border-zinc-700 text-xs text-body dark:text-zinc-300 space-y-1 min-w-0">
                  <span className="font-semibold text-ink dark:text-zinc-100 block text-[10px] uppercase tracking-wider font-sans">
                    First-Principles Check:
                  </span>
                  <p className="font-sans text-[11px] text-muted dark:text-zinc-400 truncate">
                    {sub.inspectionCheck}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border dark:border-zinc-800 flex items-center justify-between gap-2 text-xs font-sans">
                <span className="text-muted dark:text-zinc-400 truncate">Fair Specialist Bill:</span>
                <span className="font-mono tabular-nums font-bold text-ink dark:text-zinc-100 text-sm shrink-0">
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

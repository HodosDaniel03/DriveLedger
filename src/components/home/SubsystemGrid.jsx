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
    expectedInterval: '75k–95k mi',
    riskLevel: 'moderate',
    riskLabel: 'Moderate',
  },
  {
    id: 'transmission-clutch',
    name: 'Transmission & Dual-Clutch',
    icon: Cpu,
    typicalIssues: 'DSG mechatronic solenoid pressure loss and dual-mass flywheel fatigue.',
    inspectionCheck: 'Clutch slip RPM telemetry & TCU fluid degradation counters',
    typicalCostUsd: 2450,
    expectedInterval: '40k mi fluid / 95k clutch',
    riskLevel: 'critical',
    riskLabel: 'Critical',
  },
  {
    id: 'dpf-emissions',
    name: 'Exhaust, DPF & AdBlue/SCR',
    icon: Droplets,
    typicalIssues: 'Short-trip soot saturation, cracked DPF substrates, and differential pressure sensor drift.',
    inspectionCheck: 'DPF Delta-P Sensor kPa at idle vs 2500 RPM (< 8 kPa)',
    typicalCostUsd: 2100,
    expectedInterval: '85k–110k mi',
    riskLevel: 'moderate',
    riskLabel: 'Moderate',
  },
  {
    id: 'hv-battery',
    name: 'Hybrid & EV High-Voltage Pack',
    icon: Zap,
    typicalIssues: 'Cell block voltage variance, contactor pitting, and inverter coolant degradation.',
    inspectionCheck: 'Cell block mV balance (< 18 mV delta) & State-of-Health %',
    typicalCostUsd: 3800,
    expectedInterval: '125k–155k mi',
    riskLevel: 'low',
    riskLabel: 'Low',
  },
  {
    id: 'suspension-bushings',
    name: 'Multi-Link Suspension & Struts',
    icon: Wrench,
    typicalIssues: 'Hydromount bushing cracking, control arm ball joint play, and top mount wear.',
    inspectionCheck: 'Dynamic wheel alignment deviation & damper rebound telemetry',
    typicalCostUsd: 1100,
    expectedInterval: '55k–75k mi',
    riskLevel: 'moderate',
    riskLabel: 'Moderate',
  },
  {
    id: 'brakes-regen',
    name: 'Braking & Energy Recuperation',
    icon: ShieldCheck,
    typicalIssues: 'Rotor thickness variation, guide pin seizure, and brake blending valve corrosion.',
    inspectionCheck: 'Rotor runout measurement & brake fluid boiling point (> 180°C)',
    typicalCostUsd: 780,
    expectedInterval: '40k–55k mi',
    riskLevel: 'low',
    riskLabel: 'Low',
  },
];

export default function SubsystemGrid({ onNavigateToRisk, embedded = false }) {
  const { formatCurrency } = useUnits();

  return (
    <div className={embedded ? '' : 'mb-10'}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
        <div>
          <h3 className="text-h3 font-sans font-semibold tracking-tight text-ink dark:text-zinc-50">
            Critical Mechanical Subsystems Under Watch
          </h3>
          <p className="text-xs sm:text-sm font-sans text-muted dark:text-zinc-400 mt-1">
            Mileage horizons, live sensor checks, and specialist replacement benchmarks across powertrains.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateToRisk()}
          className="min-h-[44px] sm:min-h-[36px] inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-primary-600 dark:text-emerald-400 hover:underline shrink-0"
        >
          <span>Open Full Risk Matrix</span>
          <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SUBSYSTEMS.map((sub) => {
          const Icon = sub.icon;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => onNavigateToRisk()}
              className="cq-card group p-5 rounded-xl bg-surface-subtle/70 hover:bg-surface dark:bg-zinc-900/60 dark:hover:bg-zinc-900 border border-border/80 dark:border-zinc-800 sm:hover:shadow-card-hover sm:hover:-translate-y-0.5 transition-[transform,box-shadow,background-color] duration-200 ease-out cursor-pointer flex flex-col justify-between min-w-0 w-full text-left"
            >
              <div className="min-w-0 w-full">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-surface dark:bg-zinc-800 flex items-center justify-center text-primary-600 dark:text-emerald-400 shrink-0">
                    <Icon aria-hidden="true" className="w-4 h-4" />
                  </div>
                  <RiskBadge level={sub.riskLevel} label={sub.riskLabel} />
                </div>

                <h4 className="text-sm sm:text-base font-sans font-semibold text-ink dark:text-zinc-100 mb-1.5 group-hover:text-primary-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                  {sub.name}
                </h4>
                <p className="text-xs font-sans text-body dark:text-zinc-300 leading-relaxed mb-3">
                  {sub.typicalIssues}
                </p>
                <p className="text-[11px] font-sans text-muted dark:text-zinc-400 truncate">
                  <span className="font-medium text-ink dark:text-zinc-300">PID check:</span> {sub.inspectionCheck}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/70 dark:border-zinc-800 w-full flex items-center justify-between gap-2 text-xs font-sans">
                <span className="text-muted dark:text-zinc-400 font-mono tabular-nums truncate">
                  {sub.expectedInterval}
                </span>
                <span className="font-mono tabular-nums font-semibold text-ink dark:text-zinc-100 shrink-0">
                  {formatCurrency(sub.typicalCostUsd)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Calendar, CheckCircle2, Clock, Wrench, AlertTriangle, ShieldCheck, AlertOctagon, Sparkles } from 'lucide-react';
import { useUnits } from '../../context/UnitContext';
import { useGarage, MILESTONE_IMPACT_MAP } from '../../context/GarageContext';
import { Card, Pill } from '../common/OdometerPrimitives';

export const STANDARD_MILESTONES = [
  {
    miles: 15000,
    title: '15,000 mi / 1-Year Minor Inspection',
    costRangeUsd: [120, 260],
    category: 'Routine Prevention',
    items: [
      { id: '15k-oil', name: 'Engine oil & OEM spec filter change' },
      { id: '15k-tires', name: 'Tire rotation & tread depth balance check' },
      { id: '15k-brakes', name: 'Brake pad lining & rotor thickness visual inspection' },
      { id: '15k-fluids', name: 'Top-off washer, coolant, and brake fluid reservoirs' },
    ],
  },
  {
    miles: 30000,
    title: '30,000 mi / 2-Year Intermediate Service',
    costRangeUsd: [280, 550],
    category: 'Hydraulics & Filtration',
    items: [
      { id: '30k-brake-fluid', name: 'Brake fluid full hydraulic flush (DOT 4 / 5.1)' },
      { id: '30k-air-filters', name: 'Engine intake air filter & activated charcoal cabin filter' },
      { id: '30k-battery', name: '12V AGM auxiliary battery conductance test' },
      { id: '30k-suspension', name: 'Suspension ball joints, tie rod ends & CV boot inspection' },
    ],
  },
  {
    miles: 60000,
    title: '60,000 mi / 4-Year Major Service',
    costRangeUsd: [550, 1100],
    category: 'Powertrain Major Check',
    items: [
      { id: '60k-plugs', name: 'Iridium spark plugs (petrol) or fuel filter cartridge (diesel)' },
      {
        id: '60k-transmission',
        name: 'Automatic / DSG transmission fluid & filter drain and fill',
        omittedByOem: true,
        oemOmissionReason: 'Omitted by OEM as "Lifetime Fluid / Sealed for Life" despite ZF 50k–60k mi mandate',
      },
      { id: '60k-coolant', name: 'Engine coolant hydrometer acidity test & pH check' },
      { id: '60k-belts', name: 'Serpentine auxiliary drive belt & tensioner pulley check' },
    ],
  },
  {
    miles: 90000,
    title: '90,000 mi / 6-Year Critical Milestone',
    costRangeUsd: [850, 1850],
    category: 'Critical Engine Hardware',
    items: [
      {
        id: '90k-timing',
        name: 'Timing belt kit & water pump replacement (or chain stretch test)',
        omittedByOem: true,
        oemOmissionReason: 'Deferred by OEM to 150,000 mi or uninspected "lifetime" chain',
      },
      {
        id: '90k-differential',
        name: 'Front & rear differential / transfer case gear oil renewal',
        omittedByOem: true,
        oemOmissionReason: 'Unscheduled item; dealer manuals treat differentials as maintenance-free fill',
      },
      { id: '90k-cooling-hoses', name: 'Radiator hoses, thermostat housing & heater core inspection' },
      { id: '90k-rotors', name: 'Complete brake disc rotor replacement and caliper slide lubrication' },
    ],
  },
  {
    miles: 120000,
    title: '120,000 mi / 8-Year Longevity Refresh',
    costRangeUsd: [650, 1500],
    category: 'Emissions & Sensors',
    items: [
      { id: '120k-o2', name: 'Upstream broadband Oxygen (Lambda) sensor replacement' },
      {
        id: '120k-dpf',
        name: 'DPF soot load ash measurement / chemical regeneration check',
        omittedByOem: true,
        oemOmissionReason: 'Omitted by OEM; dealers replace DPF only after permanent blockage lock',
      },
      {
        id: '120k-pcv',
        name: 'PCV valve / oil separator diaphragm refresh',
        omittedByOem: true,
        oemOmissionReason: 'Unscheduled item; dealers replace only after rear main seal rupture or lean code P0171',
      },
      { id: '120k-shocks', name: 'Dampers & strut top mounts rebound and leakage inspection' },
    ],
  },
  {
    miles: 150000,
    title: '150,000 mi / 10-Year High-Mileage Overhaul',
    costRangeUsd: [1100, 2400],
    category: 'Deep System Refresh',
    items: [
      {
        id: '150k-trans-flush',
        name: 'Complete transmission torque converter fluid exchange',
        omittedByOem: true,
        oemOmissionReason: 'Never scheduled in OEM service logs due to sealed gearbox marketing',
      },
      {
        id: '150k-carbon',
        name: 'Direct-injection intake valve walnut shell carbon decoke',
        omittedByOem: true,
        oemOmissionReason: 'Omitted from all factory service schedules; causes P0300 misfires',
      },
      {
        id: '150k-fuel-pump',
        name: 'High-pressure fuel pump (HPFP) follower & seal renewal',
        omittedByOem: true,
        oemOmissionReason: 'Unscheduled run-to-failure component in dealer checklists',
      },
      { id: '150k-chassis', name: 'Subframe bushings & motor mounts vibration damping test' },
    ],
  },
];

export default function MaintenanceMilestones({
  presetId = 'default-preset',
  currentOdometerMiles = 58000,
  scheduleMode = 'preventative',
}) {
  const { formatCurrency, formatDistance } = useUnits();
  const garage = useGarage();
  const [localCompletedItems, setLocalCompletedItems] = useState({});
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'due' | 'upcoming'

  const completedItems = garage?.isProviderActive
    ? garage.getCompletedMilestones(presetId)
    : localCompletedItems;

  const toggleItem = (itemId) => {
    if (garage?.isProviderActive) {
      garage.toggleMilestoneItem(presetId, itemId);
    } else {
      setLocalCompletedItems((prev) => ({
        ...prev,
        [itemId]: !prev[itemId],
      }));
    }
  };

  // Compute live risk deduction ($) and reliability points (+pts) from checked items
  const { checkedCount, totalRiskDeductedUsd, totalPointsRestored } = useMemo(() => {
    let count = 0;
    let riskUsd = 0;
    let pts = 0;
    for (const [itemId, isDone] of Object.entries(completedItems)) {
      if (isDone) {
        count += 1;
        const impact = MILESTONE_IMPACT_MAP[itemId];
        if (impact) {
          riskUsd += impact.creditUsd;
          pts += impact.bonusPts;
        }
      }
    }
    return {
      checkedCount: count,
      totalRiskDeductedUsd: riskUsd,
      totalPointsRestored: Math.min(25, pts),
    };
  }, [completedItems]);

  const filteredMilestones = STANDARD_MILESTONES.filter((m) => {
    const isPastDue = currentOdometerMiles >= m.miles;
    const isUpcoming = currentOdometerMiles < m.miles && m.miles - currentOdometerMiles <= 30000;
    if (activeFilter === 'due') return isPastDue;
    if (activeFilter === 'upcoming') return isUpcoming;
    return true;
  });

  return (
    <Card className="mt-8 border border-border dark:border-slate-800 bg-surface dark:bg-slate-900 shadow-sm" aria-labelledby="milestones-heading">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="milestones-heading" className="text-base sm:text-lg font-bold tracking-tight text-ink dark:text-slate-100">
              Manufacturer Maintenance Milestone Roadmap
            </h2>
            <Pill tone={scheduleMode === 'oem' ? 'risk' : 'brand'} className="text-[10px] font-mono uppercase">
              {scheduleMode === 'oem' ? 'OEM Marketing View' : 'Schedule Planner'}
            </Pill>
            {checkedCount > 0 && (
              <span
                data-testid="milestone-live-credit-badge"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700/70 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  -{formatCurrency(totalRiskDeductedUsd)} Risk Deducted · +{totalPointsRestored} pts Restored
                </span>
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted dark:text-slate-400">
            Interactive checklist of scheduled inspections based on current odometer ({formatDistance(currentOdometerMiles)}). Check off completed services to dynamically reduce risk exposure.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {[
            { id: 'all', label: 'All Milestones' },
            { id: 'due', label: 'Due / Overdue' },
            { id: 'upcoming', label: 'Next 30k' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1 text-xs rounded-full font-semibold transition-all border ${
                activeFilter === f.id
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-surface-subtle text-muted border-border hover:border-border-strong hover:text-ink dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:text-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* OEM False Sense of Security Telemetry Warning Banner */}
      {scheduleMode === 'oem' ? (
        <div className="mt-5 rounded-2xl bg-amber-950 text-amber-100 p-5 border border-amber-600/40 shadow-sm">
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-amber-200 tracking-tight">
                  Dealer Service Checklist: False Positive &amp; False Sense of Security
                </h3>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-400/30 font-bold">
                  OEM TELEMETRY BLINDSPOT
                </span>
              </div>
              <p className="mt-1.5 text-xs text-amber-100/90 leading-relaxed">
                Dealership multi-point checklists prioritize superficial visual checks while omitting crucial thermodynamic wear items — such as <strong>transmission fluid changes ("sealed for life")</strong>, <strong>intake valve walnut decoking</strong>, and <strong>preventative timing assembly replacement</strong>. Vehicles stamped with "Full Dealer Service History" often suffer catastrophic gearbox, wet-belt, or valvetrain failures because factory schedules are tuned to minimize initial warranty-period fleet ownership figures rather than 150k+ mile mechanical longevity.
              </p>
              <div className="mt-2.5 flex items-center gap-2 text-[11px] font-mono text-amber-300">
                <span>⚠️ Red strikethrough items below are omitted or deferred by OEM dealer schedules.</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl bg-surface-subtle dark:bg-slate-800/70 p-3.5 border border-border/80 dark:border-slate-700 flex items-center justify-between text-xs text-muted dark:text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>Engineering Preventative Protocol Active:</strong> Includes all mechanical failure prevention thresholds recommended by component manufacturers (ZF, BorgWarner, Bosch).
            </span>
          </div>
          <span className="hidden sm:inline font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            Zero Omitted Items
          </span>
        </div>
      )}

      {/* Roadmap Timeline */}
      <div className="mt-6 space-y-6">
        {filteredMilestones.map((m) => {
          const isOverdue = currentOdometerMiles >= m.miles;
          const isUpcoming = currentOdometerMiles < m.miles && m.miles - currentOdometerMiles <= 30000;
          const allChecked = m.items.every((it) => !!completedItems[it.id]);

          let statusTone = 'neutral';
          let statusLabel = 'Future Milestone';
          if (allChecked) {
            statusTone = 'good';
            statusLabel = 'Completed';
          } else if (isOverdue) {
            statusTone = 'risk';
            statusLabel = 'Action Required';
          } else if (isUpcoming) {
            statusTone = 'warn';
            statusLabel = 'Approaching Soon';
          }

          return (
            <div
              key={m.miles}
              className={`rounded-xl border p-4 transition-all ${
                allChecked
                  ? 'border-[#BFE8CF] bg-success-bg/40 dark:border-emerald-800/70 dark:bg-emerald-950/20'
                  : isOverdue
                  ? 'border-[#F7C1BB] bg-danger-bg/40 dark:border-red-800/70 dark:bg-red-950/20'
                  : 'border-border bg-surface-subtle dark:border-slate-800 dark:bg-slate-800/50'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60 dark:border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-sm text-ink dark:text-slate-100">
                    {formatDistance(m.miles)}
                  </span>
                  <span className="text-sm font-semibold text-ink dark:text-slate-100">· {m.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted dark:text-slate-400 tabular-nums">
                    Est: {formatCurrency(m.costRangeUsd[0])} – {formatCurrency(m.costRangeUsd[1])}
                  </span>
                  <Pill tone={statusTone} className="text-[11px] font-medium">
                    {statusLabel}
                  </Pill>
                </div>
              </div>

              {/* Checklist items */}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {m.items.map((it) => {
                  const checked = !!completedItems[it.id];
                  const isOmittedByOem = scheduleMode === 'oem' && it.omittedByOem;
                  const impact = MILESTONE_IMPACT_MAP[it.id];

                  return (
                    <label
                      key={it.id}
                      className={`flex items-start gap-2.5 cursor-pointer text-xs text-body dark:text-slate-300 hover:text-ink dark:hover:text-slate-100 select-none p-2 rounded-lg transition-colors ${
                        isOmittedByOem
                          ? 'bg-red-50/70 border border-red-200/80 dark:bg-red-950/40 dark:border-red-800/60'
                          : checked
                          ? 'bg-emerald-50/70 border border-emerald-200/80 dark:bg-emerald-950/30 dark:border-emerald-800/50'
                          : 'hover:bg-surface/80 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleItem(it.id)}
                        className="mt-0.5 h-4 w-4 rounded border-border-strong text-primary-600 focus:ring-primary-600 cursor-pointer"
                      />
                      <div className="flex-1">
                        {isOmittedByOem ? (
                          <>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="line-through text-slate-500 dark:text-slate-400 font-medium decoration-red-600 decoration-2">
                                {it.name}
                              </span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-tight bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/60 dark:text-red-200 dark:border-red-700 uppercase">
                                [OMITTED / DEFERRED BY OEM]
                              </span>
                            </div>
                            {it.oemOmissionReason && (
                              <p className="text-[11px] text-red-700 dark:text-red-300 font-mono mt-0.5 leading-tight">
                                ↳ {it.oemOmissionReason}
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className={checked ? 'line-through text-faint dark:text-slate-500' : 'font-medium'}>
                              {it.name}
                            </span>
                            {impact && (checked || impact.major) && (
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                                  checked
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700'
                                    : 'bg-surface text-muted border-border dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                                }`}
                              >
                                {checked ? '✓ ' : ''}
                                -{formatCurrency(impact.creditUsd)} · +{impact.bonusPts} pts
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

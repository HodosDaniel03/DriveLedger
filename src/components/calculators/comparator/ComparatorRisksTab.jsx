import React from 'react';
import { AlertTriangle, ShieldCheck, Wrench } from 'lucide-react';
import { useUnits } from '../../../context/UnitContext';

function formatIssueMileage(issue, region, formatDistance) {
  if (region === 'EU') return issue.criticalMileage?.display || '';
  const minMi = Math.round((issue.criticalMileage?.minKm || 0) / 1.609344 / 1000) * 1000;
  const maxMi = Math.round((issue.criticalMileage?.maxKm || 0) / 1.609344 / 1000) * 1000;
  return `${formatDistance(minMi, false)} – ${formatDistance(maxMi)}`;
}

function formatIssueRepairCost(issue, region) {
  if (region === 'EU') return issue.repairCost?.formattedEur;
  if (region === 'UK' && issue.repairCost?.parts) {
    const minGbp = Math.round((issue.repairCost.parts.min + issue.repairCost.labor.min) * 0.85).toLocaleString();
    const maxGbp = Math.round((issue.repairCost.parts.max + issue.repairCost.labor.max) * 0.85).toLocaleString();
    return `£${minGbp} – £${maxGbp}`;
  }
  return issue.repairCost?.formattedUsd || issue.repairCost?.formattedEur;
}

function VehicleRiskColumn({ vehicle, odoMiles, risk, knownIssues, region, formatCurrency, formatDistance }) {
  const currentKm = Math.round(odoMiles * 1.609344);
  return (
    <div className="rounded-2xl bg-surface-subtle/80 dark:bg-zinc-900/60 p-4 sm:p-5 space-y-4 min-w-0">
      <div className="pb-3 border-b border-border/80 dark:border-zinc-800">
        <h3 className="font-sans text-sm sm:text-base font-bold text-ink dark:text-zinc-50 truncate">
          {vehicle.name} ({vehicle.engineCode})
        </h3>
        <p className="font-sans text-xs text-muted dark:text-zinc-400 mt-0.5">
          Evaluated at <span className="font-mono tabular-nums">{formatDistance(odoMiles)}</span>
        </p>
      </div>

      {/* Hairline 3-Metric Reliability Strip */}
      <div className="grid grid-cols-3 divide-x divide-border/80 dark:divide-zinc-800 text-xs">
        <div className="pr-2 min-w-0">
          <span className="flex items-center gap-1 text-[11px] font-sans text-muted dark:text-zinc-400 truncate">
            <ShieldCheck aria-hidden="true" className="w-3.5 h-3.5 text-[#183D22] dark:text-emerald-400 shrink-0" />
            <span className="truncate">Reliability</span>
          </span>
          <span className="mt-0.5 block font-mono text-base font-bold tabular-nums text-ink dark:text-zinc-50">
            {risk.reliabilityScore}/100
          </span>
        </div>
        <div className="px-2 min-w-0">
          <span className="flex items-center gap-1 text-[11px] font-sans text-muted dark:text-zinc-400 truncate">
            <Wrench aria-hidden="true" className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">12m Reserve</span>
          </span>
          <span className="mt-0.5 block font-mono text-base font-bold tabular-nums text-ink dark:text-zinc-50 truncate">
            {formatCurrency(risk.serviceReserveUsd)}
          </span>
        </div>
        <div className="pl-2 min-w-0">
          <span className="block text-[11px] font-sans text-muted dark:text-zinc-400 truncate">
            Known flaws
          </span>
          <span className="mt-0.5 block font-mono text-base font-bold tabular-nums text-ink dark:text-zinc-50">
            {knownIssues.length}
          </span>
        </div>
      </div>

      {/* Hairline Known Issues List */}
      <div className="divide-y divide-border/70 dark:divide-zinc-800 border-t border-border/80 dark:border-zinc-800">
        {knownIssues.length === 0 ? (
          <p className="text-xs font-sans text-muted dark:text-zinc-400 py-4">
            No severe vulnerabilities documented in this mileage window.
          </p>
        ) : (
          knownIssues.map((issue) => {
            const isActive =
              currentKm >= (issue.criticalMileage?.minKm || 0) &&
              currentKm <= (issue.criticalMileage?.maxKm || 999999);
            return (
              <div key={issue.id} className="py-3 space-y-1.5 text-xs min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-sans font-semibold text-ink dark:text-zinc-50 truncate">
                      {issue.name}
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/50 shrink-0">
                        Active Window
                      </span>
                    )}
                  </div>
                  <span className="font-mono tabular-nums text-muted dark:text-zinc-400 shrink-0 text-[11px]">
                    {formatIssueMileage(issue, region, formatDistance)}
                  </span>
                </div>
                <p className="text-body dark:text-zinc-300 leading-relaxed text-[11px] font-sans">
                  {issue.symptoms}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted dark:text-zinc-400 font-sans">
                  <span>
                    Est. repair:{' '}
                    <strong className="font-mono tabular-nums text-ink dark:text-zinc-200">
                      {formatIssueRepairCost(issue, region)}
                    </strong>
                  </span>
                  {issue.prevention && (
                    <span className="text-[#183D22] dark:text-emerald-400 font-medium truncate max-w-full">
                      {issue.prevention.slice(0, 48)}
                      {issue.prevention.length > 48 ? '...' : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function ComparatorRisksTab({
  vehicleA,
  vehicleB,
  odoA,
  odoB,
  riskA,
  riskB,
  knownIssuesA,
  knownIssuesB,
}) {
  const { region, formatCurrency, formatDistance } = useUnits();

  return (
    <div className="pt-5 space-y-4 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle aria-hidden="true" className="w-4 h-4 text-amber-500 shrink-0" />
          <h3 className="text-sm sm:text-base font-sans font-bold tracking-tight text-ink dark:text-zinc-50">
            Known Vulnerabilities &amp; Service Exposure
          </h3>
        </div>
        <span className="text-xs font-sans text-muted dark:text-zinc-400">
          Odometer-calibrated powertrain dossier
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 min-w-0">
        <VehicleRiskColumn
          vehicle={vehicleA}
          odoMiles={odoA}
          risk={riskA}
          knownIssues={knownIssuesA}
          region={region}
          formatCurrency={formatCurrency}
          formatDistance={formatDistance}
        />
        <VehicleRiskColumn
          vehicle={vehicleB}
          odoMiles={odoB}
          risk={riskB}
          knownIssues={knownIssuesB}
          region={region}
          formatCurrency={formatCurrency}
          formatDistance={formatDistance}
        />
      </div>
    </div>
  );
}

import React from 'react';
import { TrendingDown, Sparkles } from 'lucide-react';
import { useUnits } from '../../../context/UnitContext';

export default function ComparatorCurveTab({
  vehicleA,
  vehicleB,
  breakEvenTrajectory,
}) {
  const { region, formatDistance } = useUnits();

  if (!breakEvenTrajectory) return null;

  const svgWidth = 620;
  const svgHeight = 230;
  const padding = { top: 28, right: 24, bottom: 34, left: 24 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const points = breakEvenTrajectory.points || [];
  const maxDist = points.length > 0 ? points[points.length - 1].distMiles : 1;
  const maxCost =
    points.length > 0
      ? Math.max(...points.map((p) => p.costA), ...points.map((p) => p.costB)) * 1.08
      : 1;
  const minCost =
    points.length > 0
      ? Math.min(...points.map((p) => p.costA), ...points.map((p) => p.costB)) * 0.85
      : 0;
  const costRange = Math.max(1, maxCost - minCost);

  const getX = (distMiles) => padding.left + (distMiles / Math.max(1, maxDist)) * graphWidth;
  const getY = (cost) => padding.top + graphHeight - ((cost - minCost) / costRange) * graphHeight;

  const pathD_A = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.distMiles).toFixed(1)} ${getY(p.costA).toFixed(1)}`)
    .join(' ');

  const pathD_B = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.distMiles).toFixed(1)} ${getY(p.costB).toFixed(1)}`)
    .join(' ');

  const userX = getX(Math.min(maxDist, breakEvenTrajectory.user5YrMiles));
  const userLabelAnchor = userX > svgWidth * 0.6 ? 'end' : userX < svgWidth * 0.4 ? 'start' : 'middle';
  const userLabelX = Math.max(padding.left + 4, Math.min(svgWidth - padding.right - 4, userX));
  const crossX = breakEvenTrajectory.breakEvenMiles
    ? getX(Math.min(maxDist, breakEvenTrajectory.breakEvenMiles))
    : null;

  return (
    <div className="pt-5 space-y-5 min-w-0">
      <div className="rounded-2xl bg-surface-subtle/80 dark:bg-zinc-900/60 p-4 sm:p-5 space-y-4 min-w-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80 dark:border-zinc-800 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <TrendingDown aria-hidden="true" className="w-4 h-4 text-[#183D22] dark:text-emerald-400 shrink-0" />
              <h3 className="text-sm sm:text-base font-sans font-bold tracking-tight text-ink dark:text-zinc-50">
                5-Year Break-Even Crossover Trajectory
              </h3>
            </div>
            <p className="text-xs font-sans text-muted dark:text-zinc-400 mt-0.5">
              Cumulative total cost of ownership by distance traveled (depreciation + energy + maintenance).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-sans font-medium min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shrink-0" aria-hidden="true" />
              <span className="text-body dark:text-zinc-300 truncate" title={vehicleA.name}>
                {vehicleA.shortName || vehicleA.name}
              </span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0" aria-hidden="true" />
              <span className="text-body dark:text-zinc-300 truncate" title={vehicleB.name}>
                {vehicleB.shortName || vehicleB.name}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-[220px] sm:h-[250px] text-xs font-sans select-none block"
          >
            {points.map((p, idx) => {
              const x = getX(p.distMiles);
              const isFirst = idx === 0;
              const isLast = idx === points.length - 1;
              const showMobileTick = idx % 2 === 0 || isLast;
              return (
                <g key={p.distMiles}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + graphHeight}
                    stroke="currentColor"
                    className="text-border dark:text-zinc-800"
                    strokeDasharray="2,3"
                  />
                  <text
                    x={x}
                    y={svgHeight - 8}
                    textAnchor={isFirst ? 'start' : isLast ? 'end' : 'middle'}
                    fill="currentColor"
                    className={`text-muted dark:text-zinc-400 text-[11px] sm:text-[10px] font-mono tabular-nums ${
                      showMobileTick ? '' : 'hidden sm:inline'
                    }`}
                  >
                    {region === 'EU' ? `${Math.round(p.distKm / 1000)}k km` : `${Math.round(p.distMiles / 1000)}k mi`}
                  </text>
                </g>
              );
            })}

            <line
              x1={userX}
              y1={padding.top}
              x2={userX}
              y2={padding.top + graphHeight}
              stroke="#F59E0B"
              strokeWidth="2"
              strokeDasharray="4,4"
            />
            <text
              x={userLabelX}
              y={padding.top - 8}
              textAnchor={userLabelAnchor}
              fill="#D97706"
              className="font-bold text-[11px] sm:text-[10px] font-sans"
            >
              Your 5-Year Distance ({formatDistance(breakEvenTrajectory.user5YrMiles)})
            </text>

            <path d={pathD_A} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
            <path d={pathD_B} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />

            {crossX && breakEvenTrajectory.breakEvenMiles <= maxDist && (
              <g>
                <circle
                  cx={crossX}
                  cy={getY(
                    points[0].costA +
                      ((points[points.length - 1].costA - points[0].costA) *
                        breakEvenTrajectory.breakEvenMiles) /
                        maxDist
                  )}
                  r="6"
                  fill="#10B981"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>
        </div>

        <div className="pt-3 border-t border-border/80 dark:border-zinc-800 flex items-start gap-2.5 text-xs font-sans text-ink dark:text-zinc-200 leading-relaxed">
          <Sparkles aria-hidden="true" className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p>
            {breakEvenTrajectory.status === 'crossover' ? (
              <>
                <strong>Break-even crossover:</strong>{' '}
                <span className="font-bold text-[#183D22] dark:text-emerald-400 font-mono tabular-nums">
                  {formatDistance(breakEvenTrajectory.breakEvenMiles)} (~{breakEvenTrajectory.breakEvenYears} yrs)
                </span>
                . Beyond this distance, {vehicleB.name} delivers net savings through lower energy and maintenance costs.
              </>
            ) : breakEvenTrajectory.status === 'b_always_cheaper' ? (
              <>
                <strong>Immediate savings:</strong> <strong>{vehicleB.name}</strong> starts lower and stays cheaper across the entire 5-year distance curve.
              </>
            ) : (
              <>
                <strong>{vehicleA.name} stays lower:</strong> Across this mileage profile, {vehicleA.name} maintains a lower cumulative ownership cost.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

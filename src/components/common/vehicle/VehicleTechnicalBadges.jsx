import React from 'react';
import { deriveTechnicalBadges } from './vehicleArchetypes.js';

const NEUTRAL_MICRO_TAG_CLASS =
  'inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 px-2 py-0.5 text-[11px] font-sans font-medium transition-colors cursor-default whitespace-nowrap';

/**
 * Clean Single-Row Mechanical Specification Micro-Tags
 * Renders strictly one single row of max 4 neutral micro-tags under vehicle names.
 */
export default function VehicleTechnicalBadges({
  vehicle,
  badges: customBadges,
  maxBadges = 4,
  size = 'sm',
  showCategory = false,
  className = '',
}) {
  const badgeList = React.useMemo(() => {
    if (customBadges && Array.isArray(customBadges)) {
      return customBadges.slice(0, Math.min(4, maxBadges));
    }
    return deriveTechnicalBadges(vehicle).slice(0, Math.min(4, maxBadges));
  }, [vehicle, customBadges, maxBadges]);

  if (!badgeList || badgeList.length === 0) return null;

  const isMd = size === 'md';

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {badgeList.map((badge, idx) => (
        <span
          key={`${badge.category || 'spec'}-${idx}`}
          title={badge.detail ? `${badge.tierLabel || badge.category}: ${badge.code} (${badge.detail})` : badge.code}
          className={`${NEUTRAL_MICRO_TAG_CLASS} ${isMd ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'}`}
        >
          {showCategory && badge.tierLabel && (
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-sans font-normal hidden xs:inline">
              {badge.tierLabel}:
            </span>
          )}
          <span className="font-sans font-medium tracking-tight">{badge.code}</span>
        </span>
      ))}
    </div>
  );
}


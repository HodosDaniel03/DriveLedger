import React from 'react';
import { ShieldCheck, Zap, Filter, Cpu, Settings2, Sparkles, CheckCircle2 } from 'lucide-react';
import { deriveTechnicalBadges } from './vehicleArchetypes.js';

/**
 * Technical Badges Pill Tones
 */
const TONE_STYLES = {
  emerald: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/60',
    dot: 'bg-emerald-500',
    iconColor: 'text-emerald-600',
    subtext: 'text-emerald-700',
  },
  blue: {
    badge: 'bg-blue-50 text-blue-800 border-blue-200/80 hover:bg-blue-100/60',
    dot: 'bg-blue-500',
    iconColor: 'text-blue-600',
    subtext: 'text-blue-700',
  },
  purple: {
    badge: 'bg-purple-50 text-purple-800 border-purple-200/80 hover:bg-purple-100/60',
    dot: 'bg-purple-500',
    iconColor: 'text-purple-600',
    subtext: 'text-purple-700',
  },
  slate: {
    badge: 'bg-slate-100 text-slate-800 border-slate-200/80 hover:bg-slate-200/60',
    dot: 'bg-slate-500',
    iconColor: 'text-slate-600',
    subtext: 'text-slate-600',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/60',
    dot: 'bg-amber-500',
    iconColor: 'text-amber-600',
    subtext: 'text-amber-700',
  },
  cyan: {
    badge: 'bg-cyan-50 text-cyan-800 border-cyan-200/80 hover:bg-cyan-100/60',
    dot: 'bg-cyan-500',
    iconColor: 'text-cyan-600',
    subtext: 'text-cyan-700',
  },
};

/**
 * Icon by Category
 */
function getCategoryIcon(category, className = 'w-3 h-3') {
  switch (category) {
    case 'emissions':
      return <ShieldCheck className={className} />;
    case 'injection':
      return <Zap className={className} />;
    case 'aftertreatment':
      return <Filter className={className} />;
    case 'transmission':
      return <Settings2 className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

/**
 * High-Density Mechanical Specification Badges
 * Renders verified OEM technical badges for Euro standards, injection architectures,
 * emission aftertreatment loops, and transmission gearboxes.
 */
export default function VehicleTechnicalBadges({
  vehicle,
  badges: customBadges,
  maxBadges = 4,
  size = 'sm',
  showCategory = true,
  className = '',
}) {
  const badgeList = React.useMemo(() => {
    if (customBadges && Array.isArray(customBadges)) {
      return customBadges.slice(0, maxBadges);
    }
    return deriveTechnicalBadges(vehicle).slice(0, maxBadges);
  }, [vehicle, customBadges, maxBadges]);

  if (!badgeList || badgeList.length === 0) return null;

  const isMd = size === 'md';

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {badgeList.map((badge, idx) => {
        const toneStyle = TONE_STYLES[badge.tone] || TONE_STYLES.slate;
        return (
          <span
            key={`${badge.category}-${idx}`}
            title={`${badge.tierLabel}: ${badge.code} (${badge.detail})`}
            className={`inline-flex items-center gap-1.5 rounded-lg border font-mono font-medium transition-colors cursor-default ${
              isMd ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'
            } ${toneStyle.badge}`}
          >
            {getCategoryIcon(badge.category, `${isMd ? 'w-3.5 h-3.5' : 'w-3 h-3'} ${toneStyle.iconColor} shrink-0`)}
            
            {showCategory && (
              <span className="text-[9px] uppercase tracking-wider opacity-60 font-semibold hidden xs:inline">
                {badge.tierLabel}:
              </span>
            )}
            
            <span className="font-semibold tracking-tight">
              {badge.code}
            </span>
          </span>
        );
      })}
    </div>
  );
}

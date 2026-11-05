import React, { useEffect, useState } from 'react';

export default function AdUnit({
  slotId = 'shiftmetric-responsive-leaderboard',
  variant = 'leaderboard',
  contextLabel = 'Automotive Financial & Diagnostic Partner Slot',
  className = '',
}) {
  const [containerNode, setContainerNode] = useState(null);
  const [isActivated, setIsActivated] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (isActivated) return undefined;
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setIsActivated(true);
      return undefined;
    }
    if (!containerNode) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsActivated(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(containerNode);
    return () => observer.disconnect();
  }, [isActivated, containerNode]);

  const minHeightClass = variant === 'rectangle' ? 'min-h-[250px]' : 'min-h-[90px]';

  return (
    <div
      ref={setContainerNode}
      data-ad-slot={slotId}
      data-ad-activated={isActivated ? 'true' : 'false'}
      className={`${minHeightClass} w-full border border-dashed border-border dark:border-zinc-800 rounded-2xl bg-surface-subtle dark:bg-zinc-900/60 flex flex-col items-center justify-center p-4 relative overflow-hidden print:hidden no-print ${className}`}
      aria-label="Advertisement"
    >
      <span className="text-[10px] font-sans tracking-widest uppercase text-faint dark:text-zinc-500 font-semibold mb-0.5">
        ADVERTISEMENT · ZERO-CLS RESERVED PLACEMENT
      </span>
      <p className="text-xs text-muted dark:text-zinc-400 text-center">
        {isActivated
          ? `Google AdSense Responsive ${variant === 'rectangle' ? 'In-Feed Unit' : 'Leaderboard'} (${contextLabel})`
          : 'Preparing Viewport-Lazy Ad Container...'}
      </p>
    </div>
  );
}

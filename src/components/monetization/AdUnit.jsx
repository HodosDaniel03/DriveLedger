import React from 'react';

export default function AdUnit({ className = '' }) {
  return (
    <div
      className={`min-h-[90px] border border-dashed border-border rounded-xl bg-surface-subtle flex flex-col items-center justify-center p-4 relative overflow-hidden ${className}`}
      aria-label="Advertisement"
    >
      <span className="text-[11px] font-micro tracking-widest uppercase text-faint font-semibold mb-0.5 font-mono">
        ADVERTISEMENT · SPONSORED PARTNER PLACEMENT
      </span>
      <p className="text-xs text-muted">
        Google AdSense Zero-CLS Reserved Container (Responsive Leaderboard)
      </p>
    </div>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import {
  MONETIZATION_CONFIG,
  buildAffiliateUrl,
  FTC_PROXIMATE_DISCLOSURE,
} from '../../config/monetizationConfig';

function resolveAdSenseSlotId(slotId, variant) {
  const slots = MONETIZATION_CONFIG.slots || {};
  if (slotId && Object.prototype.hasOwnProperty.call(slots, slotId) && slots[slotId]) {
    return slots[slotId];
  }
  if (slotId && Object.values(slots).includes(slotId)) {
    return slotId;
  }
  if (variant === 'rectangle') {
    return slots.inContentRectangle || '2222222222';
  }
  if (variant === 'sticky' || variant === 'bottom') {
    return slots.bottomStickyBanner || '3333333333';
  }
  return slots.topLeaderboard || '1111111111';
}

export function AdUnit({
  slotId = 'topLeaderboard',
  variant = 'leaderboard',
  partnerKey = 'vinCheck',
  contextLabel = 'Automotive Financial & Diagnostic Partner Slot',
  hideWhenDisabled = false,
  className = '',
}) {
  const [containerNode, setContainerNode] = useState(null);
  const [isActivated, setIsActivated] = useState(
    () => typeof IntersectionObserver === 'undefined'
  );
  const [isUnfilled, setIsUnfilled] = useState(false);
  const insRef = useRef(null);

  const adsenseEnabled = Boolean(MONETIZATION_CONFIG.adsenseEnabled);
  const publisherId = MONETIZATION_CONFIG.publisherId;
  const resolvedSlotId = resolveAdSenseSlotId(slotId, variant);
  const fallbackPartnerLink = buildAffiliateUrl(partnerKey, { contextLabel, variant });

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

  // Push to adsbygoogle and observe fill status
  useEffect(() => {
    if (!adsenseEnabled || !isActivated || typeof window === 'undefined') {
      return undefined;
    }
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (_err) {
      // Safeguard against ad-blocker or duplicate slot push errors
    }

    const insEl = insRef.current;
    if (!insEl) return undefined;

    // MutationObserver to watch data-ad-status on <ins> element
    let observer = null;
    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (
            mutation.type === 'attributes' &&
            mutation.attributeName === 'data-ad-status'
          ) {
            const status = insEl.getAttribute('data-ad-status');
            if (status === 'unfilled') {
              setIsUnfilled(true);
            }
          }
        }
      });
      observer.observe(insEl, { attributes: true, attributeFilter: ['data-ad-status'] });
    }

    // Safety timeout: if 3.5s elapsed and ad remains unfilled / empty, collapse container
    const timeoutId = setTimeout(() => {
      const status = insEl.getAttribute('data-ad-status');
      if (status === 'unfilled') {
        setIsUnfilled(true);
      } else if (!status && insEl.childElementCount === 0) {
        // No ad served and no iframe present
        setIsUnfilled(true);
      }
    }, 3500);

    return () => {
      if (observer) observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [adsenseEnabled, isActivated, resolvedSlotId]);

  if (!adsenseEnabled && hideWhenDisabled) {
    return null;
  }

  // If AdSense unfilled state is confirmed, cleanly collapse to zero space
  if (adsenseEnabled && isUnfilled) {
    return (
      <div
        data-ad-slot={resolvedSlotId}
        data-ad-unfilled="true"
        className="hidden h-0 min-h-0 w-0 p-0 m-0 border-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      />
    );
  }

  const minHeightClass = variant === 'rectangle' ? 'min-h-[250px]' : 'min-h-[90px]';

  if (adsenseEnabled) {
    return (
      <div
        ref={setContainerNode}
        data-ad-slot={resolvedSlotId}
        data-ad-client={publisherId}
        data-ad-activated={isActivated ? 'true' : 'false'}
        data-ad-unfilled={isUnfilled ? 'true' : 'false'}
        className={`${minHeightClass} w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900/60 flex flex-col items-center justify-center p-3 relative overflow-hidden print:hidden no-print ${className}`}
        aria-label="Advertisement"
      >
        <span className="text-[10px] font-sans tracking-widest uppercase text-faint dark:text-zinc-500 font-semibold mb-1">
          ADVERTISEMENT · SPONSORED PLACEMENT
        </span>
        {isActivated && (
          <ins
            ref={insRef}
            className="adsbygoogle w-full"
            style={{ display: 'block' }}
            data-ad-client={publisherId}
            data-ad-slot={resolvedSlotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        )}
      </div>
    );
  }

  // When adsenseEnabled is false: Zero-CLS Native Partner Box (no empty broken AdSense boxes during review)
  return (
    <div
      ref={setContainerNode}
      data-ad-slot={resolvedSlotId}
      data-ad-activated={isActivated ? 'true' : 'false'}
      className={`${minHeightClass} w-full max-w-full min-w-0 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-surface-subtle dark:bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-5 py-3.5 relative overflow-hidden print:hidden no-print ${className}`}
      aria-label="Advertisement"
    >
      <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto text-center sm:text-left">
        <div className="hidden sm:flex w-8 h-8 shrink-0 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 items-center justify-center">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-sans tracking-widest uppercase text-faint dark:text-zinc-500 font-semibold block break-words">
            ADVERTISEMENT · PARTNER RESOURCE
          </span>
          <p className="text-xs font-sans text-body dark:text-zinc-300 truncate">
            {contextLabel} — External resource via {fallbackPartnerLink.partnerName}.
          </p>
        </div>
      </div>

      <div className="shrink-0 w-full sm:w-auto flex flex-col items-center sm:items-end gap-1">
        <a
          href={fallbackPartnerLink.href}
          target={fallbackPartnerLink.target}
          rel={fallbackPartnerLink.rel}
          className="w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3.5 py-2 sm:py-1.5 text-xs font-sans font-semibold text-ink dark:text-zinc-100 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors shadow-2xs"
        >
          <span className="truncate">{fallbackPartnerLink.buttonText}</span>
          <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
        </a>
        <span className="text-[10px] font-sans text-muted dark:text-zinc-400 text-center sm:text-right">
          {FTC_PROXIMATE_DISCLOSURE}
        </span>
      </div>
    </div>
  );
}

export default AdUnit;
export { AdUnit as AdSlot };


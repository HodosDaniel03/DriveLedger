import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import { scrollElementIntoView, scrollWindowToTop } from '../../utils/scroll';

/**
 * ScrollToTop component:
 * 1. Listens to location changes (pathname, search, hash).
 *    If a hash is present, smoothly scrolls to the element with that ID (respecting prefers-reduced-motion).
 *    Otherwise, instantly scrolls the window to the top (0, 0) to avoid jarring page-load CLS.
 * 2. Renders a 44x44px floating scroll-to-top button in the bottom-right corner
 *    only after the user has scrolled > 600px down the page.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const [visible, setVisible] = useState(false);
  const [hasMobileStickyBar, setHasMobileStickyBar] = useState(false);

  useEffect(() => {
    if (hash) {
      const targetId = hash.replace(/^#/, '');
      const element = document.getElementById(targetId);
      if (element) {
        scrollElementIntoView(element, { behavior: 'smooth' });
      } else {
        // Fallback retry in case element renders asynchronously
        const timer = setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) {
            scrollElementIntoView(el, { behavior: 'smooth' });
          }
        }, 50);
        return () => clearTimeout(timer);
      }
    } else {
      scrollWindowToTop('instant');
    }
  }, [pathname, search, hash]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return undefined;
    }
    const handleScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      setVisible(y > 600);
      if (typeof document !== 'undefined' && typeof document.querySelector === 'function') {
        setHasMobileStickyBar(
          Boolean(
            document.querySelector(
              '[data-testid="ppi-mobile-sticky-bar"], [data-testid="mobile-sticky-summary-bar"]'
            )
          )
        );
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname, search]);

  if (!visible) return null;

  const bottomPositionClass = hasMobileStickyBar
    ? 'bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]'
    : 'bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]';

  return (
    <button
      type="button"
      data-testid="scroll-to-top-btn"
      aria-label="Scroll to top"
      onClick={() => scrollWindowToTop('smooth')}
      className={`fixed right-4 ${bottomPositionClass} z-30 inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border dark:border-zinc-800 bg-surface/95 dark:bg-[#121215]/95 text-ink dark:text-zinc-100 shadow-lg backdrop-blur-sm transition-transform duration-150 motion-reduce:transition-none hover:bg-surface-subtle dark:hover:bg-zinc-800 active:scale-95 motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:focus-visible:outline-emerald-400 print:hidden no-print`}
    >
      <ChevronUp className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

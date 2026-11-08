import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';

/**
 * ScrollToTop component:
 * 1. Listens to location changes (pathname, search, hash).
 *    If a hash is present, smoothly scrolls to the element with that ID.
 *    Otherwise, instantly scrolls the window to the top (0, 0) to avoid jarring page-load CLS.
 * 2. Renders a 44x44px floating scroll-to-top button in the bottom-right corner
 *    only after the user has scrolled > 600px down the page.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hash) {
      const targetId = hash.replace(/^#/, '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Fallback retry in case element renders asynchronously
        const timer = setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 50);
        return () => clearTimeout(timer);
      }
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname, search, hash]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return undefined;
    }
    const handleScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      setVisible(y > 600);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      data-testid="scroll-to-top-btn"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}
      className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-30 inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-surface/95 dark:bg-zinc-900/95 text-ink dark:text-zinc-100 shadow-lg backdrop-blur-sm transition-transform duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 print:hidden no-print"
    >
      <ChevronUp className="h-4 w-4" />
    </button>
  );
}

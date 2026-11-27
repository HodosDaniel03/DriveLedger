/**
 * Reduced-motion-aware scroll utilities with SSR & mock-DOM safety guards.
 */

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return Boolean(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch {
    return false;
  }
}

export function getScrollBehavior(preferred = 'smooth') {
  if (preferred === 'instant' || preferred === 'auto') {
    return preferred;
  }
  return prefersReducedMotion() ? 'auto' : preferred;
}

export function scrollWindowToTop(preferredBehavior = 'smooth') {
  if (typeof window === 'undefined' || typeof window.scrollTo !== 'function') {
    return;
  }
  const behavior = getScrollBehavior(preferredBehavior);
  try {
    window.scrollTo({ top: 0, left: 0, behavior });
  } catch {
    try {
      window.scrollTo(0, 0);
    } catch {
      // Safe no-op in restricted mock environments
    }
  }
}

export function scrollElementIntoView(element, options = {}) {
  if (!element || typeof element.scrollIntoView !== 'function') {
    return;
  }
  const { behavior: preferredBehavior = 'smooth', ...rest } = options || {};
  const behavior = getScrollBehavior(preferredBehavior);
  try {
    element.scrollIntoView({ behavior, ...rest });
  } catch {
    try {
      element.scrollIntoView();
    } catch {
      // Safe no-op in restricted mock environments
    }
  }
}

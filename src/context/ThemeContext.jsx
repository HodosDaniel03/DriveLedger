import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const THEME_STORAGE_KEY = 'shiftmetric_theme';

const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  cycleTheme: () => {},
});

function getSystemTheme() {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }
  return 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('driveledger_theme');
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
          return saved;
        }
      }
    } catch {
      // ignore
    }
    return 'system';
  });

  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  // Listen to prefers-color-scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
    return undefined;
  }, []);

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  // Dynamically apply or remove 'dark' class on document.documentElement
  useEffect(() => {
    if (typeof document === 'undefined' || !document.documentElement) return;
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme]);

  // Persist choice to localStorage
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      }
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const setTheme = useCallback((newTheme) => {
    setThemeState((prev) => {
      const next = typeof newTheme === 'function' ? newTheme(prev) : newTheme;
      if (['light', 'dark', 'system'].includes(next)) {
        return next;
      }
      return prev;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const currentResolved = prev === 'system' ? getSystemTheme() : prev;
      return currentResolved === 'dark' ? 'light' : 'dark';
    });
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      cycleTheme,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme, cycleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  return context;
}

export default ThemeContext;

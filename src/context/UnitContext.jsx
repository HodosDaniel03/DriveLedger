import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useTheme } from './ThemeContext';

export const UNIT_SYSTEMS = {
  US: {
    id: 'US',
    label: 'US ($ · mi · MPG)',
    shortLabel: 'US · USD',
    currencySymbol: '$',
    currencyCode: 'USD',
    currencyRate: 1.0,
    distanceUnit: 'mi',
    distanceLabel: 'Miles',
    distanceFactor: 1.0,
    efficiencyUnit: 'MPG (US)',
    evEfficiencyUnit: 'kWh/100mi',
    fuelVolumeUnit: 'US Gal',
    fuelVolumeFactor: 1.0, // 1 US Gal
  },
  UK: {
    id: 'UK',
    label: 'UK (£ · mi · MPG UK)',
    shortLabel: 'UK · GBP',
    currencySymbol: '£',
    currencyCode: 'GBP',
    currencyRate: 0.79,
    distanceUnit: 'mi',
    distanceLabel: 'Miles',
    distanceFactor: 1.0,
    efficiencyUnit: 'MPG (UK)',
    evEfficiencyUnit: 'kWh/100mi',
    fuelVolumeUnit: 'Litre',
    fuelVolumeFactor: 3.78541178, // Litres per US Gal
  },
  EU: {
    id: 'EU',
    label: 'EU (€ · km · L/100km)',
    shortLabel: 'EU · EUR',
    currencySymbol: '€',
    currencyCode: 'EUR',
    currencyRate: 0.92,
    distanceUnit: 'km',
    distanceLabel: 'Kilometers',
    distanceFactor: 1.609344,
    efficiencyUnit: 'L/100km',
    evEfficiencyUnit: 'kWh/100km',
    fuelVolumeUnit: 'Litre',
    fuelVolumeFactor: 3.78541178, // Litres per US Gal
  },
};

export function convertUsdToRegion(usdAmount, regionId = 'US') {
  const regKey = typeof regionId === 'string' ? regionId.toUpperCase() : 'US';
  const sys = UNIT_SYSTEMS[regKey] || UNIT_SYSTEMS.US;
  const num = Number(usdAmount);
  if (!Number.isFinite(num)) return 0;
  return num * sys.currencyRate;
}

export function convertRegionToUsd(localAmount, regionId = 'US') {
  const regKey = typeof regionId === 'string' ? regionId.toUpperCase() : 'US';
  const sys = UNIT_SYSTEMS[regKey] || UNIT_SYSTEMS.US;
  const num = Number(localAmount);
  if (!Number.isFinite(num) || sys.currencyRate <= 0) return 0;
  return num / sys.currencyRate;
}

export function convertMilesToRegion(miles, regionId = 'US') {
  const regKey = typeof regionId === 'string' ? regionId.toUpperCase() : 'US';
  const sys = UNIT_SYSTEMS[regKey] || UNIT_SYSTEMS.US;
  const num = Number(miles);
  if (!Number.isFinite(num)) return 0;
  return num * sys.distanceFactor;
}

export function convertRegionToMiles(distance, regionId = 'US') {
  const regKey = typeof regionId === 'string' ? regionId.toUpperCase() : 'US';
  const sys = UNIT_SYSTEMS[regKey] || UNIT_SYSTEMS.US;
  const num = Number(distance);
  if (!Number.isFinite(num) || sys.distanceFactor <= 0) return 0;
  return num / sys.distanceFactor;
}

export function convertMpgUsToRegion(mpgUs, regionId = 'US', isEv = false) {
  const regKey = typeof regionId === 'string' ? regionId.toUpperCase() : 'US';
  const raw = Number(mpgUs);
  const val = Number.isFinite(raw) && raw > 0 ? raw : 30;
  if (isEv) {
    // For EV, canonical value stored is kWh/100mi (e.g. 26 kWh/100mi)
    if (regKey === 'EU') {
      return +(val / 1.609344).toFixed(1); // kWh/100km
    }
    return +val.toFixed(1); // kWh/100mi
  }
  if (regKey === 'UK') {
    return +(val * 1.20095).toFixed(1);
  }
  if (regKey === 'EU') {
    return +(235.21458 / val).toFixed(1);
  }
  return +val.toFixed(1);
}

export function convertRegionToMpgUs(displayVal, regionId = 'US', isEv = false) {
  const regKey = typeof regionId === 'string' ? regionId.toUpperCase() : 'US';
  const raw = Number(displayVal);
  const val = Number.isFinite(raw) && raw > 0 ? raw : 30;
  if (isEv) {
    if (regKey === 'EU') {
      return +(val * 1.609344).toFixed(2);
    }
    return +val.toFixed(2);
  }
  if (regKey === 'UK') {
    return +(val / 1.20095).toFixed(2);
  }
  if (regKey === 'EU') {
    return +(235.21458 / val).toFixed(2);
  }
  return +val.toFixed(2);
}

export function convertFuelPriceUsdGalToRegion(usdPerGal, regionId = 'US', isEv = false) {
  const regKey = typeof regionId === 'string' ? regionId.toUpperCase() : 'US';
  const sys = UNIT_SYSTEMS[regKey] || UNIT_SYSTEMS.US;
  const raw = Number(usdPerGal);
  const val = Number.isFinite(raw) ? raw : 0;
  if (isEv) {
    // EV energy price is per kWh in all regions, just converted for currency
    return +(val * sys.currencyRate).toFixed(2);
  }
  // Convert USD/US Gal to local currency per local fuel volume unit (US Gal for US, Litre for UK/EU)
  return +((val * sys.currencyRate) / sys.fuelVolumeFactor).toFixed(2);
}

export function convertRegionFuelPriceToUsdGal(localPrice, regionId = 'US', isEv = false) {
  const regKey = typeof regionId === 'string' ? regionId.toUpperCase() : 'US';
  const sys = UNIT_SYSTEMS[regKey] || UNIT_SYSTEMS.US;
  const raw = Number(localPrice);
  const val = Number.isFinite(raw) ? raw : 0;
  if (isEv) {
    return sys.currencyRate > 0 ? +(val / sys.currencyRate).toFixed(3) : 0;
  }
  return sys.currencyRate > 0 ? +((val * sys.fuelVolumeFactor) / sys.currencyRate).toFixed(3) : 0;
}

const UnitContext = createContext(null);

export function UnitProvider({ children }) {
  const [region, setRegionState] = useState(() => {
    try {
      const saved = localStorage.getItem('shiftmetric_region') || localStorage.getItem('driveledger_region');
      return saved && UNIT_SYSTEMS[saved] ? saved : 'US';
    } catch {
      return 'US';
    }
  });

  const themeCtx = useTheme();

  // If inside ThemeProvider, themeCtx provides { theme, resolvedTheme, setTheme, toggleTheme, cycleTheme }
  // Otherwise, fallback gracefully to internal state for standalone tests
  const [fallbackTheme, setFallbackTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('shiftmetric_theme') || localStorage.getItem('driveledger_theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const theme = themeCtx?.theme ?? fallbackTheme;
  const resolvedTheme = themeCtx?.resolvedTheme ?? (fallbackTheme === 'dark' ? 'dark' : 'light');
  const setTheme = themeCtx?.setTheme ?? setFallbackTheme;
  const toggleTheme = themeCtx?.toggleTheme ?? (() => setFallbackTheme((prev) => (prev === 'dark' ? 'light' : 'dark')));

  useEffect(() => {
    try {
      localStorage.setItem('shiftmetric_region', region);
    } catch {
      // ignore storage errors
    }
  }, [region]);

  const setRegion = (newRegion) => {
    if (!newRegion) return;
    const upper = String(newRegion).toUpperCase();
    if (UNIT_SYSTEMS[upper]) {
      setRegionState(upper);
    }
  };

  const value = useMemo(() => {
    const activeSystem = UNIT_SYSTEMS[region] || UNIT_SYSTEMS.US;

    const formatCurrency = (usdAmount, decimals = 0) => {
      const converted = convertUsdToRegion(usdAmount, region);
      if (!Number.isFinite(converted)) {
        return `${activeSystem.currencySymbol}0`;
      }
      const isNeg = converted < -0.001;
      const absVal = Math.abs(converted);
      return `${isNeg ? '-' : ''}${activeSystem.currencySymbol}${absVal.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}`;
    };

    const formatCostPerDistance = (usdPerMile) => {
      // Convert USD/mile -> LocalCurrency / LocalDistanceUnit
      // Note: 1 mile = 1.609344 km, so cost per km = cost per mile / 1.609344
      const num = Number(usdPerMile);
      const safeNum = Number.isFinite(num) ? Math.max(0, num) : 0;
      const localCurrencyPerMile = safeNum * activeSystem.currencyRate;
      const localPerUnit = activeSystem.distanceFactor > 0 ? localCurrencyPerMile / activeSystem.distanceFactor : 0;
      return `${activeSystem.currencySymbol}${localPerUnit.toFixed(2)} / ${activeSystem.distanceUnit}`;
    };

    const formatDistance = (miles, includeUnit = true) => {
      const converted = Math.round(convertMilesToRegion(miles, region));
      const safeVal = Number.isFinite(converted) ? Math.max(0, converted) : 0;
      const formatted = safeVal.toLocaleString('en-US');
      return includeUnit ? `${formatted} ${activeSystem.distanceUnit}` : formatted;
    };

    const formatEfficiency = (mpgUs, isEv = false) => {
      const val = convertMpgUsToRegion(mpgUs, region, isEv);
      const safeVal = Number.isFinite(val) ? Math.max(0, val) : (isEv ? 28 : 30);
      const unit = isEv ? activeSystem.evEfficiencyUnit : activeSystem.efficiencyUnit;
      return `${safeVal.toFixed(1)} ${unit}`;
    };

    return {
      region,
      setRegion,
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      cycleTheme: themeCtx?.cycleTheme,
      unitSystem: activeSystem,
      currencySymbol: activeSystem.currencySymbol,
      currencyCode: activeSystem.currencyCode,
      currencyRate: activeSystem.currencyRate,
      distanceUnit: activeSystem.distanceUnit,
      distanceLabel: activeSystem.distanceLabel,
      distanceFactor: activeSystem.distanceFactor,
      efficiencyUnit: activeSystem.efficiencyUnit,
      evEfficiencyUnit: activeSystem.evEfficiencyUnit,
      fuelVolumeUnit: activeSystem.fuelVolumeUnit,
      formatCurrency,
      formatCostPerDistance,
      formatDistance,
      formatEfficiency,
      convertUsdToRegion: (usd) => convertUsdToRegion(usd, region),
      convertRegionToUsd: (loc) => convertRegionToUsd(loc, region),
      convertMilesToRegion: (mi) => convertMilesToRegion(mi, region),
      convertRegionToMiles: (dist) => convertRegionToMiles(dist, region),
      convertMpgUsToRegion: (mpg, isEv) => convertMpgUsToRegion(mpg, region, isEv),
      convertRegionToMpgUs: (val, isEv) => convertRegionToMpgUs(val, region, isEv),
      convertFuelPriceUsdGalToRegion: (usdGal, isEv) => convertFuelPriceUsdGalToRegion(usdGal, region, isEv),
      convertRegionFuelPriceToUsdGal: (locPrice, isEv) => convertRegionFuelPriceToUsdGal(locPrice, region, isEv),
    };
  }, [region, theme]);

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}

export function useUnits() {
  const ctx = useContext(UnitContext);
  if (!ctx) {
    throw new Error('useUnits must be used within a UnitProvider');
  }
  return ctx;
}

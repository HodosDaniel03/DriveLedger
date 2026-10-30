export type Region = "US" | "UK" | "EU"
export type Fuel = "petrol" | "diesel" | "hybrid" | "ev"

interface RegionConfig {
  currency: string
  locale: string
  rate: number
  distance: "mi" | "km"
  distFactor: number
}

export const REGIONS: Record<Region, RegionConfig> = {
  US: { currency: "USD", locale: "en-US", rate: 1, distance: "mi", distFactor: 1 },
  UK: { currency: "GBP", locale: "en-GB", rate: 0.79, distance: "mi", distFactor: 1 },
  EU: { currency: "EUR", locale: "en-IE", rate: 0.92, distance: "km", distFactor: 1.609344 },
}

const LITRES_PER_US_GALLON = 3.78541
const KM_PER_MI = 1.609344
const UK_MPG_PER_US_MPG = 1.20095

const numberFormatters = new Map<number, Intl.NumberFormat>()
export function formatNumber(n: number, decimals = 0) {
  let f = numberFormatters.get(decimals)
  if (!f) {
    f = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    numberFormatters.set(decimals, f)
  }
  return f.format(n)
}

export function formatMoney(region: Region, usd: number, decimals = 0) {
  const c = REGIONS[region]
  return new Intl.NumberFormat(c.locale, {
    style: "currency",
    currency: c.currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(usd * c.rate)
}

export const currencySymbol = (region: Region) =>
  region === "US" ? "$" : region === "UK" ? "£" : "€"

export const toLocalMoney = (r: Region, usd: number) => usd * REGIONS[r].rate
export const fromLocalMoney = (r: Region, local: number) => local / REGIONS[r].rate

export const toLocalDistance = (r: Region, mi: number) => mi * REGIONS[r].distFactor
export const fromLocalDistance = (r: Region, local: number) => local / REGIONS[r].distFactor
export const distanceUnit = (r: Region) => REGIONS[r].distance

export function formatDistance(r: Region, mi: number) {
  return `${formatNumber(toLocalDistance(r, mi))} ${distanceUnit(r)}`
}

export function compactDistance(r: Region, mi: number) {
  const v = toLocalDistance(r, mi)
  return `${formatNumber(Math.round(v / 1000))}k ${distanceUnit(r)}`
}

/** Base efficiency: US MPG for combustion/hybrid, mi/kWh for EVs. */
export function toLocalEfficiency(r: Region, base: number, fuel: Fuel) {
  if (fuel === "ev") return r === "EU" ? 100 / (base * KM_PER_MI) : base
  if (r === "UK") return base * UK_MPG_PER_US_MPG
  if (r === "EU") return 235.215 / base
  return base
}

export function fromLocalEfficiency(r: Region, local: number, fuel: Fuel) {
  if (fuel === "ev") return r === "EU" ? 100 / (local * KM_PER_MI) : local
  if (r === "UK") return local / UK_MPG_PER_US_MPG
  if (r === "EU") return 235.215 / local
  return local
}

export function efficiencyUnit(r: Region, fuel: Fuel) {
  if (fuel === "ev") return r === "EU" ? "kWh/100km" : "mi/kWh"
  return r === "EU" ? "L/100km" : "MPG"
}

/** Base fuel price: USD per US gallon, or USD per kWh for EVs. */
export function toLocalFuelPrice(r: Region, base: number, fuel: Fuel) {
  const local = base * REGIONS[r].rate
  if (fuel === "ev" || r === "US") return local
  return local / LITRES_PER_US_GALLON
}

export function fromLocalFuelPrice(r: Region, local: number, fuel: Fuel) {
  const usd = local / REGIONS[r].rate
  if (fuel === "ev" || r === "US") return usd
  return usd * LITRES_PER_US_GALLON
}

export function fuelPriceUnit(r: Region, fuel: Fuel) {
  if (fuel === "ev") return "per kWh"
  return r === "US" ? "per gallon" : "per litre"
}

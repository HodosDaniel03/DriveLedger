import type { Engine, Make } from "./catalog"

export interface CostInputs {
  make: Make
  engine: Engine
  price: number
  annualMiles: number
  years: number
  efficiency: number
  fuelPrice: number
  insurance: number
  apr: number
}

export interface CostCategory {
  id: string
  label: string
  total: number
  color: string
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export function computeCost(i: CostInputs) {
  const months = i.years * 12

  const mileageAdjustment = clamp(1 - ((i.annualMiles - 12000) / 1000) * 0.015, 0.6, 1.15)
  const resale = i.price * Math.pow(1 - i.make.depreciation, i.years) * mileageAdjustment
  const depreciation = Math.max(0, i.price - resale)

  const fuel = (i.annualMiles / Math.max(i.efficiency, 0.1)) * i.fuelPrice * i.years

  const insurance = i.insurance * i.years

  const fuelFactor =
    i.engine.fuel === "ev" ? 0.6 : i.engine.fuel === "diesel" ? 1.15 : i.engine.fuel === "hybrid" ? 0.9 : 1
  let maintenance = 0
  for (let y = 0; y < i.years; y++) {
    maintenance += (i.annualMiles / 12000) * i.make.maintenanceBase * fuelFactor * (1 + 0.08 * y)
  }

  const fees = i.years * (150 + i.price * 0.007)

  let financing = 0
  if (i.apr > 0) {
    const r = i.apr / 100 / 12
    const payment = (i.price * r) / (1 - Math.pow(1 + r, -months))
    financing = payment * months - i.price
  }

  const categories: CostCategory[] = [
    { id: "depreciation", label: "Depreciation", total: depreciation, color: "#183D22" },
    { id: "fuel", label: i.engine.fuel === "ev" ? "Charging" : "Fuel", total: fuel, color: "#3B6E4C" },
    { id: "insurance", label: "Insurance", total: insurance, color: "#689F77" },
    { id: "maintenance", label: "Maintenance", total: maintenance, color: "#9CD08F" },
    { id: "fees", label: "Registration & fees", total: fees, color: "#D4DFD0" },
  ]
  if (financing > 0) {
    categories.push({ id: "financing", label: "Loan interest", total: financing, color: "#A9B8A4" })
  }

  const total = categories.reduce((s, c) => s + c.total, 0)

  return {
    categories,
    total,
    monthly: total / months,
    perMile: total / Math.max(1, i.annualMiles * i.years),
  }
}

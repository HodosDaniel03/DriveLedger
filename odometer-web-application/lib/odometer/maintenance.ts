import type { Make } from "./catalog"
import type { Fuel } from "./units"

export type DrivingStyle = "highway" | "mixed" | "city"
export type WorkshopTier = "independent" | "dealer"

interface ComponentSpec {
  id: string
  name: string
  /** Service interval in miles per fuel type; null = not applicable */
  interval: Record<Fuel, number | null>
  /** Independent specialist cost, USD, before brand factor */
  cost: Record<Fuel, number>
  cityAffected: boolean
  tip: string
}

const COMPONENTS: ComponentSpec[] = [
  {
    id: "timing",
    name: "Timing Belt / Chain & Water Pump",
    interval: { petrol: 100000, diesel: 100000, hybrid: 150000, ev: null },
    cost: { petrol: 640, diesel: 720, hybrid: 520, ev: 0 },
    cityAffected: false,
    tip: "Always replace the water pump with the belt — it shares the same labor.",
  },
  {
    id: "transmission",
    name: "Transmission Fluid & Clutch / Dual-Mass Flywheel",
    interval: { petrol: 60000, diesel: 60000, hybrid: 80000, ev: 120000 },
    cost: { petrol: 480, diesel: 560, hybrid: 320, ev: 180 },
    cityAffected: true,
    tip: "A fluid change every 60k is far cheaper than a gearbox rebuild, despite “lifetime fill” claims.",
  },
  {
    id: "dpf",
    name: "DPF / Catalytic Converter & EGR System",
    interval: { petrol: 150000, diesel: 90000, hybrid: 160000, ev: null },
    cost: { petrol: 900, diesel: 1100, hybrid: 850, ev: 0 },
    cityAffected: true,
    tip: "A 20-minute highway drive every couple of weeks lets the DPF burn off soot on its own.",
  },
  {
    id: "turbo",
    name: "Turbocharger, High-Pressure Fuel & Injectors",
    interval: { petrol: 130000, diesel: 120000, hybrid: 180000, ev: null },
    cost: { petrol: 1100, diesel: 1300, hybrid: 800, ev: 0 },
    cityAffected: true,
    tip: "Idle for 30 seconds after hard driving so the turbo bearings can cool down.",
  },
  {
    id: "brakes",
    name: "Brakes, Rotors & Suspension Bushings",
    interval: { petrol: 45000, diesel: 45000, hybrid: 80000, ev: 80000 },
    cost: { petrol: 520, diesel: 540, hybrid: 480, ev: 520 },
    cityAffected: true,
    tip: "Ask for pad thickness in millimetres at every service — under 3 mm means it’s time.",
  },
  {
    id: "battery",
    name: "Battery & Cooling System",
    interval: { petrol: 60000, diesel: 60000, hybrid: 70000, ev: 100000 },
    cost: { petrol: 360, diesel: 380, hybrid: 420, ev: 450 },
    cityAffected: false,
    tip: "Test the 12V battery before winter; most fail on the first cold morning.",
  },
]

const STYLE_MULTIPLIER: Record<DrivingStyle, number> = { highway: 0.85, mixed: 1, city: 1.35 }
const DEALER_MARKUP = 1.75
const ANNUAL_MILES = 12000

export type ComponentStatus = "good" | "soon" | "risk" | "na"

export interface ComponentHealth {
  id: string
  name: string
  tip: string
  status: ComponentStatus
  lifeUsed: number
  remainingMiles: number
  independentCost: number
  dealerCost: number
}

const round10 = (n: number) => Math.round(n / 10) * 10

export function computeMaintenance(make: Make, fuel: Fuel, odometer: number, style: DrivingStyle, tier: WorkshopTier) {
  const styleMult = STYLE_MULTIPLIER[style]
  let reserve = 0

  const components: ComponentHealth[] = COMPONENTS.map((c) => {
    const interval = c.interval[fuel]
    if (interval === null) {
      return {
        id: c.id,
        name: c.name,
        tip: "Electric drivetrains don’t have this part, so there’s nothing to budget here.",
        status: "na",
        lifeUsed: 0,
        remainingMiles: 0,
        independentCost: 0,
        dealerCost: 0,
      }
    }
    const mult = make.wear * (c.cityAffected ? styleMult : 1)
    const effective = odometer * mult
    const lifeUsed = (effective % interval) / interval
    const remainingMiles = (interval - (effective % interval)) / mult
    const independentCost = round10(c.cost[fuel] * make.partFactor)
    const dealerCost = round10(independentCost * DEALER_MARKUP)
    const status: ComponentStatus = lifeUsed >= 0.9 ? "risk" : remainingMiles <= 15000 ? "soon" : "good"

    const price = tier === "dealer" ? dealerCost : independentCost
    reserve += remainingMiles <= ANNUAL_MILES ? price : price * ((ANNUAL_MILES * mult) / interval)

    return { id: c.id, name: c.name, tip: c.tip, status, lifeUsed, remainingMiles, independentCost, dealerCost }
  })

  return {
    components,
    reserve,
    effectiveMiles: odometer * make.wear * styleMult,
  }
}

import type { Fuel } from "./units"

export interface Engine {
  id: string
  name: string
  fuel: Fuel
  /** USD */
  price: number
  /** US MPG, or mi/kWh for EVs */
  efficiency: number
  /** USD per year */
  insurance: number
}

export interface Model {
  id: string
  name: string
  engines: Engine[]
}

export interface Make {
  id: string
  name: string
  /** Annual value loss rate */
  depreciation: number
  /** Annual maintenance baseline at 12k mi, USD */
  maintenanceBase: number
  /** Mechanical wear multiplier vs. average car */
  wear: number
  /** Parts & labor price multiplier */
  partFactor: number
  models: Model[]
}

function e(id: string, name: string, fuel: Fuel, price: number, efficiency: number, insurance: number): Engine {
  return { id, name, fuel, price, efficiency, insurance }
}

export const CATALOG: Make[] = [
  {
    id: "bmw",
    name: "BMW",
    depreciation: 0.16,
    maintenanceBase: 1050,
    wear: 1.15,
    partFactor: 1.3,
    models: [
      {
        id: "3-series",
        name: "3 Series",
        engines: [
          e("330i", "2.0L Turbo (330i)", "petrol", 45000, 30, 1900),
          e("320d", "2.0L Diesel (320d)", "diesel", 44000, 41, 1850),
        ],
      },
      {
        id: "5-series",
        name: "5 Series",
        engines: [
          e("530i", "2.0L Turbo (530i)", "petrol", 58000, 28, 2150),
          e("520d", "2.0L Diesel (520d)", "diesel", 56000, 45, 2100),
        ],
      },
      {
        id: "x5",
        name: "X5",
        engines: [
          e("x5-40i", "3.0L Turbo I6 (xDrive40i)", "petrol", 66000, 23, 2400),
          e("x5-50e", "3.0L Plug-in Hybrid (xDrive50e)", "hybrid", 72000, 48, 2500),
        ],
      },
    ],
  },
  {
    id: "ford",
    name: "Ford",
    depreciation: 0.15,
    maintenanceBase: 750,
    wear: 1.0,
    partFactor: 1.0,
    models: [
      {
        id: "focus",
        name: "Focus",
        engines: [
          e("focus-10", "1.0L EcoBoost", "petrol", 24000, 38, 1350),
          e("focus-20d", "2.0L EcoBlue Diesel", "diesel", 26000, 52, 1400),
        ],
      },
      {
        id: "mondeo",
        name: "Mondeo",
        engines: [
          e("mondeo-20d", "2.0L EcoBlue Diesel", "diesel", 32000, 50, 1500),
          e("mondeo-hev", "2.0L Hybrid", "hybrid", 33000, 48, 1500),
        ],
      },
      {
        id: "f-150",
        name: "F-150",
        engines: [
          e("f150-27", "2.7L EcoBoost V6", "petrol", 46000, 21, 1650),
          e("f150-35", "3.5L EcoBoost V6", "petrol", 52000, 20, 1750),
          e("f150-50", "5.0L V8", "petrol", 50000, 19, 1750),
        ],
      },
    ],
  },
  {
    id: "toyota",
    name: "Toyota",
    depreciation: 0.11,
    maintenanceBase: 550,
    wear: 0.85,
    partFactor: 0.9,
    models: [
      {
        id: "corolla",
        name: "Corolla",
        engines: [
          e("corolla-18h", "1.8L Hybrid", "hybrid", 24000, 50, 1350),
          e("corolla-20", "2.0L Petrol", "petrol", 23000, 35, 1350),
        ],
      },
      {
        id: "camry",
        name: "Camry",
        engines: [
          e("camry-25h", "2.5L Hybrid", "hybrid", 31000, 51, 1500),
          e("camry-25", "2.5L Petrol", "petrol", 28000, 32, 1500),
        ],
      },
      {
        id: "rav4",
        name: "RAV4",
        engines: [
          e("rav4-25h", "2.5L Hybrid", "hybrid", 34000, 40, 1550),
          e("rav4-phev", "2.5L Plug-in Hybrid", "hybrid", 44000, 60, 1650),
        ],
      },
    ],
  },
  {
    id: "vw",
    name: "Volkswagen",
    depreciation: 0.14,
    maintenanceBase: 800,
    wear: 1.05,
    partFactor: 1.05,
    models: [
      {
        id: "golf",
        name: "Golf",
        engines: [
          e("golf-15tsi", "1.5 TSI", "petrol", 29000, 36, 1450),
          e("golf-20tdi", "2.0 TDI", "diesel", 31000, 50, 1500),
          e("golf-gti", "2.0 TSI (GTI)", "petrol", 33000, 29, 1750),
        ],
      },
      {
        id: "passat",
        name: "Passat",
        engines: [
          e("passat-20tdi", "2.0 TDI", "diesel", 35000, 48, 1550),
          e("passat-15tsi", "1.5 TSI", "petrol", 33000, 35, 1500),
        ],
      },
      {
        id: "tiguan",
        name: "Tiguan",
        engines: [
          e("tiguan-20tsi", "2.0 TSI", "petrol", 32000, 26, 1550),
          e("tiguan-20tdi", "2.0 TDI", "diesel", 35000, 40, 1600),
        ],
      },
    ],
  },
  {
    id: "tesla",
    name: "Tesla",
    depreciation: 0.15,
    maintenanceBase: 750,
    wear: 0.9,
    partFactor: 1.2,
    models: [
      {
        id: "model-3",
        name: "Model 3",
        engines: [
          e("m3-rwd", "Rear-Wheel Drive", "ev", 40000, 4.2, 2100),
          e("m3-lr", "Long Range AWD", "ev", 48000, 3.9, 2250),
        ],
      },
      {
        id: "model-y",
        name: "Model Y",
        engines: [
          e("my-lr", "Long Range AWD", "ev", 50000, 3.7, 2200),
          e("my-perf", "Performance", "ev", 55000, 3.4, 2500),
        ],
      },
    ],
  },
  {
    id: "honda",
    name: "Honda",
    depreciation: 0.11,
    maintenanceBase: 580,
    wear: 0.88,
    partFactor: 0.9,
    models: [
      {
        id: "civic",
        name: "Civic",
        engines: [
          e("civic-15t", "1.5L Turbo", "petrol", 27000, 36, 1450),
          e("civic-20h", "2.0L Hybrid", "hybrid", 30000, 49, 1450),
        ],
      },
      {
        id: "cr-v",
        name: "CR-V",
        engines: [
          e("crv-15t", "1.5L Turbo", "petrol", 32000, 30, 1500),
          e("crv-20h", "2.0L Hybrid", "hybrid", 35000, 40, 1550),
        ],
      },
      {
        id: "accord",
        name: "Accord",
        engines: [
          e("accord-15t", "1.5L Turbo", "petrol", 29000, 32, 1500),
          e("accord-20h", "2.0L Hybrid", "hybrid", 34000, 46, 1550),
        ],
      },
    ],
  },
  {
    id: "audi",
    name: "Audi",
    depreciation: 0.16,
    maintenanceBase: 1000,
    wear: 1.12,
    partFactor: 1.3,
    models: [
      {
        id: "a3",
        name: "A3",
        engines: [
          e("a3-15tfsi", "1.5 TFSI", "petrol", 36000, 34, 1700),
          e("a3-20tdi", "2.0 TDI", "diesel", 37000, 48, 1700),
        ],
      },
      {
        id: "a4",
        name: "A4",
        engines: [
          e("a4-20tfsi", "2.0 TFSI", "petrol", 42000, 29, 1850),
          e("a4-20tdi", "2.0 TDI", "diesel", 43000, 45, 1850),
        ],
      },
      {
        id: "q5",
        name: "Q5",
        engines: [
          e("q5-20tfsi", "2.0 TFSI", "petrol", 47000, 25, 2000),
          e("q5-30tdi", "3.0 TDI V6", "diesel", 54000, 36, 2150),
        ],
      },
    ],
  },
  {
    id: "mercedes",
    name: "Mercedes-Benz",
    depreciation: 0.17,
    maintenanceBase: 1100,
    wear: 1.12,
    partFactor: 1.35,
    models: [
      {
        id: "c-class",
        name: "C-Class",
        engines: [
          e("c300", "2.0L Turbo (C 300)", "petrol", 47000, 28, 1950),
          e("c220d", "2.0L Diesel (C 220 d)", "diesel", 46000, 46, 1900),
        ],
      },
      {
        id: "e-class",
        name: "E-Class",
        engines: [
          e("e350", "2.0L Turbo (E 350)", "petrol", 60000, 26, 2250),
          e("e220d", "2.0L Diesel (E 220 d)", "diesel", 58000, 45, 2200),
        ],
      },
      {
        id: "glc",
        name: "GLC",
        engines: [
          e("glc300", "2.0L Turbo (GLC 300)", "petrol", 49000, 25, 2050),
          e("glc300e", "2.0L Plug-in Hybrid (GLC 300e)", "hybrid", 55000, 50, 2150),
        ],
      },
    ],
  },
]

export const DEFAULT_FUEL_PRICE: Record<Fuel, number> = {
  petrol: 3.6,
  hybrid: 3.6,
  diesel: 4.1,
  ev: 0.17,
}

export interface VehicleSelection {
  makeId: string
  modelId: string
  engineId: string
}

export function resolveVehicle(sel: VehicleSelection) {
  const make = CATALOG.find((m) => m.id === sel.makeId) ?? CATALOG[0]
  const model = make.models.find((m) => m.id === sel.modelId) ?? make.models[0]
  const engine = model.engines.find((en) => en.id === sel.engineId) ?? model.engines[0]
  return { make, model, engine }
}

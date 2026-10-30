export type LaborTier = "independent" | "dealer" | "diy"

export const LABOR_RATES: Record<LaborTier, number> = { independent: 115, dealer: 185, diy: 0 }

export interface Culprit {
  name: string
  probability: number
  /** USD parts */
  parts: number
  hours: number
}

export interface FaultCode {
  code: string
  short: string
  title: string
  driveability: "safe" | "risk"
  keywords: string[]
  culprits: Culprit[]
  checks: [string, string]
}

export const FAULT_CODES: FaultCode[] = [
  {
    code: "P0420",
    short: "Catalyst",
    title: "Catalytic converter efficiency below threshold",
    driveability: "safe",
    keywords: ["catalyst", "catalytic", "converter", "emissions", "rotten egg", "o2"],
    culprits: [
      { name: "Faulty downstream O2 sensor", probability: 0.45, parts: 85, hours: 0.8 },
      { name: "Exhaust leak ahead of the rear sensor", probability: 0.3, parts: 60, hours: 1.5 },
      { name: "Worn-out catalytic converter", probability: 0.25, parts: 1100, hours: 2.0 },
    ],
    checks: [
      "Compare live O2 readings: the rear sensor should hold steady around 0.6–0.7 V, not mirror the front one.",
      "Listen for a ticking exhaust leak near the manifold before anyone quotes a new converter.",
    ],
  },
  {
    code: "P2002",
    short: "DPF Efficiency",
    title: "Diesel particulate filter efficiency below threshold",
    driveability: "risk",
    keywords: ["dpf", "particulate", "diesel", "soot", "regen", "regeneration"],
    culprits: [
      { name: "Faulty DPF differential pressure sensor", probability: 0.48, parts: 140, hours: 0.8 },
      { name: "Soot-loaded DPF requiring forced regen / cleaning", probability: 0.37, parts: 280, hours: 1.5 },
      { name: "Damaged DPF core replacement", probability: 0.15, parts: 1650, hours: 2.5 },
    ],
    checks: [
      "Read live DPF differential pressure at idle — a clean filter shows only a few mbar.",
      "Inspect the two small sensor hoses for splits; a cracked hose mimics a blocked DPF.",
    ],
  },
  {
    code: "P0171",
    short: "System Lean",
    title: "Fuel system too lean (Bank 1)",
    driveability: "safe",
    keywords: ["lean", "vacuum", "maf", "air", "rough idle", "hesitation"],
    culprits: [
      { name: "Vacuum leak (intake hose or PCV)", probability: 0.45, parts: 40, hours: 1.0 },
      { name: "Dirty or failing MAF sensor", probability: 0.35, parts: 180, hours: 0.5 },
      { name: "Weak fuel pump or clogged filter", probability: 0.2, parts: 420, hours: 2.5 },
    ],
    checks: [
      "Check long-term fuel trims: high at idle but normal at 2,500 rpm points to a vacuum leak.",
      "Try MAF cleaner spray first — it fixes many lean codes for under $15.",
    ],
  },
  {
    code: "P0300",
    short: "Misfire",
    title: "Random or multiple cylinder misfire detected",
    driveability: "risk",
    keywords: ["misfire", "shaking", "rough", "spark", "coil", "flashing"],
    culprits: [
      { name: "Worn spark plugs", probability: 0.4, parts: 80, hours: 1.0 },
      { name: "Failing ignition coil", probability: 0.35, parts: 120, hours: 0.6 },
      { name: "Leaking or clogged fuel injector", probability: 0.25, parts: 280, hours: 1.8 },
    ],
    checks: [
      "Look at per-cylinder misfire counters to find which cylinder is actually failing.",
      "Swap the suspect coil to another cylinder — if the misfire moves, you’ve found it.",
    ],
  },
  {
    code: "P0299",
    short: "Underboost",
    title: "Turbocharger underboost condition",
    driveability: "risk",
    keywords: ["turbo", "boost", "underboost", "limp", "power loss", "whistle"],
    culprits: [
      { name: "Split intercooler or boost hose", probability: 0.45, parts: 90, hours: 1.2 },
      { name: "Sticking wastegate / VNT actuator", probability: 0.35, parts: 380, hours: 2.0 },
      { name: "Worn turbocharger", probability: 0.2, parts: 1500, hours: 5.0 },
    ],
    checks: [
      "Compare requested vs actual boost in live data under load to confirm a real shortfall.",
      "Run a cheap smoke or pressure test on the intake hoses before condemning the turbo.",
    ],
  },
  {
    code: "P0401",
    short: "EGR Flow",
    title: "Exhaust gas recirculation flow insufficient",
    driveability: "safe",
    keywords: ["egr", "recirculation", "carbon", "knock", "pinging"],
    culprits: [
      { name: "Carbon-clogged EGR valve (clean)", probability: 0.5, parts: 60, hours: 2.0 },
      { name: "Failed EGR valve", probability: 0.35, parts: 350, hours: 2.0 },
      { name: "Blocked EGR cooler or passages", probability: 0.15, parts: 600, hours: 4.0 },
    ],
    checks: [
      "Command the EGR valve open with a scanner and watch for an idle drop to confirm it moves.",
      "Ask whether cleaning is an option — most clogged valves don’t need replacing.",
    ],
  },
  {
    code: "P0128",
    short: "Thermostat",
    title: "Coolant temperature below thermostat regulating temperature",
    driveability: "safe",
    keywords: ["thermostat", "coolant", "temperature", "heater", "cold", "warm up"],
    culprits: [
      { name: "Thermostat stuck open", probability: 0.7, parts: 60, hours: 1.5 },
      { name: "Faulty coolant temperature sensor", probability: 0.25, parts: 40, hours: 0.5 },
      { name: "Low coolant level", probability: 0.05, parts: 20, hours: 0.3 },
    ],
    checks: [
      "Watch live coolant temp on a drive — it should reach about 190–200°F within 15 minutes.",
      "Top up and check coolant level first; it’s the cheapest possible fix.",
    ],
  },
  {
    code: "P0700",
    short: "Transmission",
    title: "Transmission control system malfunction",
    driveability: "risk",
    keywords: ["transmission", "gearbox", "shifting", "slipping", "tcm", "limp"],
    culprits: [
      { name: "Low or degraded transmission fluid", probability: 0.4, parts: 120, hours: 1.5 },
      { name: "Faulty shift solenoid pack", probability: 0.4, parts: 450, hours: 3.0 },
      { name: "Transmission control module fault", probability: 0.2, parts: 700, hours: 2.0 },
    ],
    checks: [
      "P0700 is only a flag — read the TCM directly for the specific companion code.",
      "Check fluid level and smell; burnt fluid changes the repair plan entirely.",
    ],
  },
]

export function estimateRepair(code: FaultCode, laborRate: number) {
  const totals = code.culprits.map((c) => c.parts + c.hours * laborRate)
  const parts = code.culprits.reduce((s, c) => s + c.parts * c.probability, 0)
  const hours = code.culprits.reduce((s, c) => s + c.hours * c.probability, 0)
  return {
    low: Math.min(...totals),
    high: Math.max(...totals),
    parts,
    hours,
    labor: hours * laborRate,
  }
}

export function searchCodes(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return FAULT_CODES.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.includes(q) || q.includes(k)),
  )
}

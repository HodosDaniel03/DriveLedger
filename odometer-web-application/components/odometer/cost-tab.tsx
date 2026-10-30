"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveVehicle, type VehicleSelection } from "@/lib/odometer/catalog"
import { computeCost } from "@/lib/odometer/cost"
import {
  currencySymbol,
  distanceUnit,
  efficiencyUnit,
  formatMoney,
  formatNumber,
  fromLocalDistance,
  fromLocalEfficiency,
  fromLocalFuelPrice,
  fromLocalMoney,
  fuelPriceUnit,
  REGIONS,
  toLocalDistance,
  toLocalEfficiency,
  toLocalFuelPrice,
  toLocalMoney,
  type Region,
} from "@/lib/odometer/units"
import { motion } from "motion/react"
import { CostTimeline } from "./cost-timeline"
import { AnimatedNumber, EASE_OUT, InViewReveal, Reveal } from "./motion"
import { Card, Collapse, NumberField, PageHeader, PartnerCard, RangeSlider } from "./primitives"
import { VehicleSelect } from "./vehicle-select"

export interface CostState {
  price: number
  annualMiles: number
  years: number
  efficiency: number
  fuelPrice: number
  insurance: number
  apr: number
}

interface CostTabProps {
  region: Region
  selection: VehicleSelection
  onSelectionChange: (s: VehicleSelection) => void
  cost: CostState
  onCostChange: (patch: Partial<CostState>) => void
}

const snap = (n: number, step: number) => Math.round(n / step) * step

export function CostTab({ region, selection, onSelectionChange, cost, onCostChange }: CostTabProps) {
  const [customOpen, setCustomOpen] = useState(false)
  const { make, model, engine } = resolveVehicle(selection)
  const result = useMemo(() => computeCost({ make, engine, ...cost }), [make, engine, cost])
  const unit = distanceUnit(region)
  const sym = currencySymbol(region)
  const fuel = engine.fuel

  return (
    <>
      <PageHeader
        title="What your car really costs"
        subtitle="Depreciation, fuel, insurance, maintenance and fees — rolled into one honest monthly number."
      />
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-7" delay={0.05}>
        <Card className="h-fit" aria-labelledby="vehicle-heading">
          <h2 id="vehicle-heading" className="mb-5 text-base font-semibold tracking-tight text-[#141A15]">
            Your vehicle
          </h2>
          <VehicleSelect selection={selection} onChange={onSelectionChange} />

          <div className="mt-8 flex flex-col gap-8">
            <RangeSlider
              label="Purchase price"
              min={5000}
              max={100000}
              step={500}
              value={snap(toLocalMoney(region, cost.price), 500)}
              display={formatMoney(region, cost.price)}
              onChange={(v) => onCostChange({ price: fromLocalMoney(region, v) })}
              minLabel={`${sym}5k`}
              maxLabel={`${sym}100k`}
            />
            <RangeSlider
              label="Annual mileage"
              min={2000}
              max={30000}
              step={500}
              value={snap(toLocalDistance(region, cost.annualMiles), 500)}
              display={`${formatNumber(snap(toLocalDistance(region, cost.annualMiles), 500))} ${unit}`}
              onChange={(v) => onCostChange({ annualMiles: fromLocalDistance(region, v) })}
              minLabel={`2,000 ${unit}`}
              maxLabel={`30,000 ${unit}`}
            />
            <RangeSlider
              label="Ownership"
              min={1}
              max={10}
              step={1}
              value={cost.years}
              display={`${cost.years} ${cost.years === 1 ? "year" : "years"}`}
              onChange={(v) => onCostChange({ years: v })}
              minLabel="1 year"
              maxLabel="10 years"
            />
          </div>

          <div className="mt-8 border-t border-[#EFEFEA] pt-4">
            <button
              type="button"
              aria-expanded={customOpen}
              aria-controls="customize-panel"
              onClick={() => setCustomOpen((o) => !o)}
              className="flex w-full items-center gap-2 rounded-lg py-1 text-sm font-medium text-[#183D22] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183D22]"
            >
              <Plus
                aria-hidden="true"
                className={cn("size-4 transition-transform duration-300", customOpen && "rotate-45")}
              />
              Customize fuel, insurance & financing
            </button>
            <Collapse open={customOpen} id="customize-panel">
              <div className="grid grid-cols-2 gap-3 pt-4">
                <NumberField
                  label={fuel === "ev" ? "Efficiency" : "Fuel efficiency"}
                  value={toLocalEfficiency(region, cost.efficiency, fuel)}
                  decimals={1}
                  suffix={efficiencyUnit(region, fuel)}
                  onCommit={(v) => onCostChange({ efficiency: fromLocalEfficiency(region, v, fuel) })}
                />
                <NumberField
                  label={fuel === "ev" ? "Electricity price" : "Fuel price"}
                  value={toLocalFuelPrice(region, cost.fuelPrice, fuel)}
                  decimals={2}
                  suffix={`${sym} ${fuelPriceUnit(region, fuel)}`}
                  onCommit={(v) => onCostChange({ fuelPrice: fromLocalFuelPrice(region, v, fuel) })}
                />
                <NumberField
                  label="Annual insurance"
                  value={toLocalMoney(region, cost.insurance)}
                  decimals={0}
                  suffix={`${sym} / yr`}
                  onCommit={(v) => onCostChange({ insurance: fromLocalMoney(region, v) })}
                />
                <NumberField
                  label="Loan APR"
                  value={cost.apr}
                  decimals={1}
                  suffix="%"
                  min={-0.01}
                  onCommit={(v) => onCostChange({ apr: Math.min(v, 40) })}
                />
              </div>
            </Collapse>
          </div>
        </Card>
        </Reveal>

        <Reveal className="lg:col-span-5" delay={0.15}>
        <Card className="h-fit lg:sticky lg:top-24" aria-labelledby="summary-heading">
          <p id="summary-heading" className="text-sm font-medium text-[#5F665F]">
            Monthly cost
          </p>
          <p className="mt-1 flex items-baseline gap-1.5" aria-live="polite">
            <AnimatedNumber
              value={result.monthly}
              format={(n) => formatMoney(region, n)}
              className="text-5xl font-bold tabular-nums tracking-tight text-[#141A15]"
            />
            <span className="text-lg font-medium text-[#8A8F89]">/mo</span>
          </p>
          <p className="mt-1.5 truncate text-sm text-[#5F665F]">
            {make.name} {model.name} · {engine.name}
          </p>

          <dl className="mt-5 grid grid-cols-2 divide-x divide-[#E6E6E1] rounded-xl border border-[#E6E6E1]">
            <div className="p-3.5">
              <dt className="text-xs text-[#5F665F]">Cost per {unit === "km" ? "kilometre" : "mile"}</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight text-[#141A15]">
                <AnimatedNumber
                  value={result.perMile / REGIONS[region].distFactor}
                  format={(n) => formatMoney(region, n, 2)}
                />
                /{unit}
              </dd>
            </div>
            <div className="p-3.5">
              <dt className="text-xs text-[#5F665F]">
                Total over {cost.years} {cost.years === 1 ? "year" : "years"}
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight text-[#141A15]">
                <AnimatedNumber value={result.total} format={(n) => formatMoney(region, n)} />
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-[#141A15]">Cost breakdown</h3>
              <span className="text-xs text-[#8A8F89]">per month</span>
            </div>
            <motion.div
              className="flex h-3 origin-left gap-0.5 overflow-hidden rounded-full"
              aria-hidden="true"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.3, ease: EASE_OUT }}
            >
              {result.categories.map((c) => (
                <div
                  key={c.id}
                  className="h-full transition-[flex-grow] duration-500 ease-out first:rounded-l-full last:rounded-r-full"
                  style={{ flexGrow: c.total, flexBasis: 0, backgroundColor: c.color }}
                />
              ))}
            </motion.div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {result.categories.map((c, i) => (
                <motion.li
                  key={c.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 + i * 0.05, ease: EASE_OUT }}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />
                  <span className="flex-1 text-[#3A403B]">{c.label}</span>
                  <span className="w-10 text-right tabular-nums text-[#8A8F89]">
                    {Math.round((c.total / result.total) * 100)}%
                  </span>
                  <span className="w-20 text-right font-medium tabular-nums text-[#141A15]">
                    <AnimatedNumber value={c.total / (cost.years * 12)} format={(n) => formatMoney(region, n)} />
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <PartnerCard
              text="Buying used? Check this vehicle's hidden accident & odometer history."
              cta="Run VIN Check"
              href="https://www.carfax.com/vehicle-history-reports/"
            />
          </div>
        </Card>
        </Reveal>
      </div>

      <InViewReveal className="mt-6 lg:mt-8">
        <CostTimeline region={region} make={make} engine={engine} cost={cost} />
      </InViewReveal>
    </>
  )
}

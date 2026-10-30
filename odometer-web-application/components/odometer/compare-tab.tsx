"use client"

import { useMemo } from "react"
import { motion } from "motion/react"
import { ArrowLeftRight, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { DEFAULT_FUEL_PRICE, resolveVehicle, type VehicleSelection } from "@/lib/odometer/catalog"
import { computeCost } from "@/lib/odometer/cost"
import {
  distanceUnit,
  formatMoney,
  formatNumber,
  fromLocalDistance,
  toLocalDistance,
  type Region,
} from "@/lib/odometer/units"
import { AnimatedNumber, EASE_OUT, InViewReveal, Reveal } from "./motion"
import { Card, PageHeader, Pill, RangeSlider } from "./primitives"
import { VehicleSelect } from "./vehicle-select"

interface CompareTabProps {
  region: Region
  a: VehicleSelection
  b: VehicleSelection
  onAChange: (s: VehicleSelection) => void
  onBChange: (s: VehicleSelection) => void
  onSwap: () => void
  annualMiles: number
  onAnnualMilesChange: (v: number) => void
  years: number
  onYearsChange: (v: number) => void
}

const snap = (n: number, step: number) => Math.round(n / step) * step
const COLORS = { a: "#183D22", b: "#9CD08F" }

function useVehicleCost(sel: VehicleSelection, annualMiles: number, years: number) {
  return useMemo(() => {
    const { make, model, engine } = resolveVehicle(sel)
    const result = computeCost({
      make,
      engine,
      price: engine.price,
      efficiency: engine.efficiency,
      fuelPrice: DEFAULT_FUEL_PRICE[engine.fuel],
      insurance: engine.insurance,
      annualMiles,
      years,
      apr: 0,
    })
    return { make, model, engine, result }
  }, [sel, annualMiles, years])
}

export function CompareTab(props: CompareTabProps) {
  const { region, annualMiles, years } = props
  const A = useVehicleCost(props.a, annualMiles, years)
  const B = useVehicleCost(props.b, annualMiles, years)
  const unit = distanceUnit(region)
  const money = (n: number) => formatMoney(region, n)

  const diff = A.result.total - B.result.total
  const winner = Math.abs(diff) < 1 ? null : diff < 0 ? "a" : "b"
  const winnerName = winner === "a" ? `${A.make.name} ${A.model.name}` : `${B.make.name} ${B.model.name}`

  const rows = A.result.categories
    .map((c) => {
      const other = B.result.categories.find((x) => x.id === c.id)
      return { id: c.id, label: c.label, a: c.total, b: other?.total ?? 0 }
    })
    .filter((r) => r.a > 0 || r.b > 0)
  const rowMax = Math.max(...rows.flatMap((r) => [r.a, r.b]), 1)

  return (
    <>
      <PageHeader
        title="Compare two cars, side by side"
        subtitle="Same mileage, same ownership period — see which car actually costs less to live with."
      />

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-7" delay={0.05}>
          <Card aria-labelledby="compare-vehicles" className="flex flex-col gap-6">
            <h2 id="compare-vehicles" className="sr-only">
              Vehicles
            </h2>
            <VehicleSlot label="Car A" color={COLORS.a} selection={props.a} onChange={props.onAChange} />
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[#EFEFEA]" />
              <motion.button
                type="button"
                onClick={props.onSwap}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94, rotate: 180 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E6E6E1] bg-white px-3 py-1.5 text-xs font-medium text-[#3A403B] hover:border-[#C9C9C2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183D22]"
              >
                <ArrowLeftRight aria-hidden="true" className="size-3.5" />
                Swap
              </motion.button>
              <span className="h-px flex-1 bg-[#EFEFEA]" />
            </div>
            <VehicleSlot label="Car B" color={COLORS.b} selection={props.b} onChange={props.onBChange} />

            <div className="flex flex-col gap-8 border-t border-[#EFEFEA] pt-6">
              <RangeSlider
                label="Annual mileage"
                min={2000}
                max={30000}
                step={500}
                value={snap(toLocalDistance(region, annualMiles), 500)}
                display={`${formatNumber(snap(toLocalDistance(region, annualMiles), 500))} ${unit}`}
                onChange={(v) => props.onAnnualMilesChange(fromLocalDistance(region, v))}
                minLabel={`2,000 ${unit}`}
                maxLabel={`30,000 ${unit}`}
              />
              <RangeSlider
                label="Ownership"
                min={1}
                max={10}
                step={1}
                value={years}
                display={`${years} ${years === 1 ? "year" : "years"}`}
                onChange={props.onYearsChange}
                minLabel="1 year"
                maxLabel="10 years"
              />
            </div>
          </Card>
        </Reveal>

        <Reveal className="lg:col-span-5" delay={0.15}>
          <Card className="lg:sticky lg:top-24" aria-labelledby="verdict-heading">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#E8F5E9] p-1.5 text-[#1B5E20]">
                <Trophy aria-hidden="true" className="size-4" />
              </span>
              <h2 id="verdict-heading" className="text-sm font-medium text-[#5F665F]">
                The verdict
              </h2>
            </div>
            <div aria-live="polite" className="mt-3">
              {winner ? (
                <motion.div key={winner} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT }}>
                  <p className="text-pretty text-lg leading-snug font-semibold text-[#141A15]">
                    The {winnerName} saves you
                  </p>
                  <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-[#183D22]">
                    <AnimatedNumber value={Math.abs(diff)} format={money} />
                  </p>
                  <p className="mt-1 text-sm text-[#5F665F]">
                    over {years} {years === 1 ? "year" : "years"} ·{" "}
                    <AnimatedNumber value={Math.abs(diff) / (years * 12)} format={money} />
                    /mo
                  </p>
                </motion.div>
              ) : (
                <p className="text-lg font-semibold text-[#141A15]">These two cost the same to own.</p>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {(["a", "b"] as const).map((k) => {
                const v = k === "a" ? A : B
                return (
                  <div
                    key={k}
                    className={cn(
                      "rounded-xl border p-3.5 transition-colors duration-500",
                      winner === k ? "border-[#183D22] bg-[#F2F6F3]" : "border-[#E6E6E1]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-[#5F665F]">
                        <span className="size-2 rounded-full" style={{ backgroundColor: COLORS[k] }} aria-hidden="true" />
                        Car {k.toUpperCase()}
                      </span>
                      {winner === k && <Pill tone="good">Cheaper</Pill>}
                    </div>
                    <p className="mt-1.5 truncate text-sm font-medium text-[#141A15]">
                      {v.make.name} {v.model.name}
                    </p>
                    <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-[#141A15]">
                      <AnimatedNumber value={v.result.monthly} format={money} />
                      <span className="text-sm font-medium text-[#8A8F89]">/mo</span>
                    </p>
                    <p className="text-xs tabular-nums text-[#8A8F89]">
                      <AnimatedNumber value={v.result.total} format={money} /> total
                    </p>
                  </div>
                )
              })}
            </div>
          </Card>
        </Reveal>
      </div>

      <InViewReveal className="mt-6 lg:mt-8">
        <Card aria-labelledby="compare-breakdown">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="compare-breakdown" className="text-base font-semibold tracking-tight text-[#141A15]">
              Where the money goes
            </h2>
            <div className="flex items-center gap-4 text-xs text-[#5F665F]">
              <Legend color={COLORS.a} label="Car A" />
              <Legend color={COLORS.b} label="Car B" />
            </div>
          </div>
          <ul className="flex flex-col gap-5">
            {rows.map((r, i) => (
              <li key={r.id} className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:items-center sm:gap-6">
                <span className="text-sm font-medium text-[#3A403B]">{r.label}</span>
                <div className="flex flex-col gap-1.5">
                  <Bar value={r.a} max={rowMax} color={COLORS.a} delay={i * 0.06} label={money(r.a)} />
                  <Bar value={r.b} max={rowMax} color={COLORS.b} delay={i * 0.06 + 0.03} label={money(r.b)} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </InViewReveal>
    </>
  )
}

function VehicleSlot({
  label,
  color,
  selection,
  onChange,
}: {
  label: string
  color: string
  selection: VehicleSelection
  onChange: (s: VehicleSelection) => void
}) {
  return (
    <div>
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#141A15]">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
        {label}
      </p>
      <VehicleSelect selection={selection} onChange={onChange} />
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
    </span>
  )
}

function Bar({ value, max, color, delay, label }: { value: number; max: number; color: string; delay: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#F1F1EC]">
        <motion.div
          className="h-full origin-left rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${(value / max) * 100}%` }}
          animate={{ width: `${(value / max) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay, ease: EASE_OUT }}
        />
      </div>
      <span className="w-20 text-right text-xs font-medium tabular-nums text-[#3A403B]">{label}</span>
    </div>
  )
}

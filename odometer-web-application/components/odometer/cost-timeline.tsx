"use client"

import { useMemo, useState } from "react"
import { motion } from "motion/react"
import type { Engine, Make } from "@/lib/odometer/catalog"
import { computeCost } from "@/lib/odometer/cost"
import { formatMoney, type Region } from "@/lib/odometer/units"
import { cn } from "@/lib/utils"
import type { CostState } from "./cost-tab"
import { AnimatedNumber, EASE_OUT } from "./motion"
import { Card } from "./primitives"

const MAX_YEARS = 10

export function CostTimeline({
  region,
  make,
  engine,
  cost,
}: {
  region: Region
  make: Make
  engine: Engine
  cost: CostState
}) {
  const points = useMemo(
    () =>
      Array.from({ length: MAX_YEARS }, (_, i) => {
        const r = computeCost({ make, engine, ...cost, years: i + 1 })
        const depreciation = r.categories.find((c) => c.id === "depreciation")?.total ?? 0
        return { year: i + 1, total: r.total, depreciation, running: r.total - depreciation }
      }),
    [make, engine, cost],
  )
  const [hovered, setHovered] = useState<number | null>(null)
  const active = points[(hovered ?? cost.years) - 1]
  const max = points[points.length - 1].total
  const money = (n: number) => formatMoney(region, n)

  return (
    <Card aria-labelledby="timeline-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="timeline-heading" className="text-base font-semibold tracking-tight text-[#141A15]">
            Cost over time
          </h2>
          <p className="mt-1 text-sm text-[#5F665F]">Cumulative cost of ownership, year by year.</p>
        </div>
        <dl className="flex gap-6 text-right" aria-live="polite">
          <div>
            <dt className="text-xs text-[#5F665F]">After year {active.year}</dt>
            <dd className="text-xl font-bold tabular-nums tracking-tight text-[#141A15]">
              <AnimatedNumber value={active.total} format={money} duration={0.4} />
            </dd>
          </div>
          <div className="hidden sm:block">
            <dt className="text-xs text-[#5F665F]">Depreciation share</dt>
            <dd className="text-xl font-bold tabular-nums tracking-tight text-[#183D22]">
              <AnimatedNumber
                value={(active.depreciation / active.total) * 100}
                format={(n) => `${Math.round(n)}%`}
                duration={0.4}
              />
            </dd>
          </div>
        </dl>
      </div>

      <div
        className="mt-8 flex h-56 items-end gap-1.5 sm:gap-3"
        role="img"
        aria-label={`Cumulative cost chart. After ${MAX_YEARS} years: ${money(max)}.`}
        onMouseLeave={() => setHovered(null)}
      >
        {points.map((p, i) => {
          const selected = p.year === cost.years
          const highlighted = p.year === active.year
          const h = (p.total / max) * 100
          return (
            <div
              key={p.year}
              className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              onMouseEnter={() => setHovered(p.year)}
            >
              <motion.div
                className={cn(
                  "flex w-full flex-col overflow-hidden rounded-t-lg transition-opacity duration-300",
                  highlighted ? "opacity-100" : "opacity-45",
                )}
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                animate={{ height: `${h}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.04, ease: EASE_OUT }}
              >
                <div className="w-full bg-[#9CD08F]" style={{ flexGrow: p.running }} />
                <div className="w-full bg-[#183D22]" style={{ flexGrow: p.depreciation }} />
              </motion.div>
              <span
                className={cn(
                  "text-xs tabular-nums transition-colors",
                  selected ? "font-semibold text-[#141A15]" : "text-[#8A8F89]",
                )}
              >
                Y{p.year}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-[#5F665F]">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[#183D22]" aria-hidden="true" />
          Depreciation
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[#9CD08F]" aria-hidden="true" />
          Running costs
        </span>
      </div>
    </Card>
  )
}

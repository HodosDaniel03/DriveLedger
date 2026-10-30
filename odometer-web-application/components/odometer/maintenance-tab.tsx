"use client"

import { useMemo, useState } from "react"
import { Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveVehicle, type VehicleSelection } from "@/lib/odometer/catalog"
import {
  computeMaintenance,
  type ComponentHealth,
  type DrivingStyle,
  type WorkshopTier,
} from "@/lib/odometer/maintenance"
import {
  compactDistance,
  distanceUnit,
  formatDistance,
  formatMoney,
  formatNumber,
  fromLocalDistance,
  toLocalDistance,
  type Region,
} from "@/lib/odometer/units"
import { Card, Collapse, PageHeader, PartnerCard, Pill, RangeSlider, Segmented } from "./primitives"
import { VehicleSelect } from "./vehicle-select"

interface MaintenanceTabProps {
  region: Region
  selection: VehicleSelection
  onSelectionChange: (s: VehicleSelection) => void
  odometer: number
  onOdometerChange: (miles: number) => void
  style: DrivingStyle
  onStyleChange: (s: DrivingStyle) => void
  tier: WorkshopTier
  onTierChange: (t: WorkshopTier) => void
}

const BAR_COLOR = { good: "#3B6E4C", soon: "#D69E2E", risk: "#C62828", na: "#D4DFD0" } as const

export function MaintenanceTab(props: MaintenanceTabProps) {
  const { region, selection, odometer, style, tier } = props
  const { make, engine } = resolveVehicle(selection)
  const result = useMemo(
    () => computeMaintenance(make, engine.fuel, odometer, style, tier),
    [make, engine.fuel, odometer, style, tier],
  )
  const unit = distanceUnit(region)
  const localOdo = Math.round(toLocalDistance(region, odometer) / 1000) * 1000

  return (
    <>
      <PageHeader
        title="Upcoming maintenance & wear"
        subtitle="See which mechanical parts wear out next based on your mileage and driving style."
      />
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <Card className="h-fit lg:sticky lg:top-24 lg:col-span-5" aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="mb-5 text-base font-semibold tracking-tight text-[#141A15]">
            Vehicle & driving profile
          </h2>
          <VehicleSelect selection={selection} onChange={props.onSelectionChange} />
          <div className="mt-8 flex flex-col gap-7">
            <RangeSlider
              label="Current odometer"
              min={10000}
              max={200000}
              step={1000}
              value={localOdo}
              display={`${formatNumber(localOdo)} ${unit}`}
              onChange={(v) => props.onOdometerChange(fromLocalDistance(region, v))}
              minLabel={`10k ${unit}`}
              maxLabel={`200k ${unit}`}
            />
            <Segmented
              label="Driving style"
              value={style}
              onChange={props.onStyleChange}
              options={[
                { value: "highway", label: "Mostly Highway" },
                { value: "mixed", label: "Mixed" },
                { value: "city", label: "Mostly City" },
              ]}
            />
            <Segmented
              label="Workshop pricing tier"
              value={tier}
              onChange={props.onTierChange}
              options={[
                { value: "independent", label: "Independent Specialist" },
                { value: "dealer", label: "Main Dealership" },
              ]}
            />
          </div>
        </Card>

        <Card className="lg:col-span-7" aria-labelledby="schedule-heading">
          <h2 id="schedule-heading" className="text-base font-semibold tracking-tight text-[#141A15]">
            Component health schedule
          </h2>

          <div className="mt-4 flex flex-col gap-4 rounded-xl bg-[#183D22] p-5 text-white sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-white/70">Estimated 12-month service reserve</p>
              <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight" aria-live="polite">
                {formatMoney(region, result.reserve)}
              </p>
            </div>
            <dl className="flex gap-6 text-sm">
              <div>
                <dt className="text-white/70">Effective wear</dt>
                <dd className="font-semibold tabular-nums">{formatDistance(region, result.effectiveMiles)}</dd>
              </div>
              <div>
                <dt className="text-white/70">Odometer</dt>
                <dd className="font-semibold tabular-nums">{formatDistance(region, odometer)}</dd>
              </div>
            </dl>
          </div>

          <ul className="mt-2 divide-y divide-[#EFEFEA]">
            {result.components.map((c) => (
              <ComponentRow key={c.id} component={c} region={region} tier={tier} />
            ))}
          </ul>

          <div className="mt-4">
            <PartnerCard
              text="Prevent $2,500+ surprise workshop bills — scan live engine & DPF health from your phone."
              cta="Compare OBD2 Scanners"
              href="https://www.amazon.com/s?k=bluetooth+obd2+scanner"
            />
          </div>
        </Card>
      </div>
    </>
  )
}

function ComponentRow({ component: c, region, tier }: { component: ComponentHealth; region: Region; tier: WorkshopTier }) {
  const [tipOpen, setTipOpen] = useState(false)
  const tipId = `tip-${c.id}`
  const pct = Math.round(c.lifeUsed * 100)

  const pill =
    c.status === "na" ? (
      <Pill tone="neutral">Not applicable</Pill>
    ) : c.status === "risk" ? (
      <Pill tone="risk">High Risk - Service Now</Pill>
    ) : c.status === "soon" ? (
      <Pill tone="warn">Due within {compactDistance(region, 15000)}</Pill>
    ) : (
      <Pill tone="good">Good</Pill>
    )

  const primary = tier === "dealer" ? c.dealerCost : c.independentCost

  return (
    <li className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-pretty text-[#141A15]">{c.name}</h3>
        {pill}
      </div>

      {c.status !== "na" && (
        <>
          <div className="mt-3 flex items-center gap-3">
            <div
              role="progressbar"
              aria-label={`${c.name} life consumed`}
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 flex-1 overflow-hidden rounded-full bg-[#EFEFEA]"
            >
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${pct}%`, backgroundColor: BAR_COLOR[c.status] }}
              />
            </div>
            <span className="w-24 text-right text-xs tabular-nums text-[#5F665F]">{pct}% life used</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="flex items-baseline gap-2 text-sm">
              <span className="text-base font-semibold tabular-nums text-[#141A15]">
                {formatMoney(region, primary)}
              </span>
              <span className="text-[#5F665F]">{tier === "dealer" ? "Dealer" : "Independent"}</span>
              {tier === "dealer" ? (
                <span className="text-[#1B5E20] tabular-nums">
                  · Indie {formatMoney(region, c.independentCost)}
                </span>
              ) : (
                <s className="text-[#8A8F89] tabular-nums">{formatMoney(region, c.dealerCost)} Dealer</s>
              )}
            </p>
            <span className="text-xs tabular-nums text-[#8A8F89]">
              Next in ~{formatDistance(region, Math.round(c.remainingMiles / 500) * 500)}
            </span>
          </div>
        </>
      )}

      <button
        type="button"
        aria-expanded={tipOpen}
        aria-controls={tipId}
        onClick={() => setTipOpen((o) => !o)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-[#183D22] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183D22]"
      >
        <Lightbulb aria-hidden="true" className={cn("size-3.5", tipOpen && "fill-[#9CD08F]")} />
        Quick preventative tip
      </button>
      <Collapse open={tipOpen} id={tipId}>
        <p className="mt-2 rounded-lg bg-[#F2F6F3] px-3 py-2 text-sm text-[#2A322C]">{c.tip}</p>
      </Collapse>
    </li>
  )
}

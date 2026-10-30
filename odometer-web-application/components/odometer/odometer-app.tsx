"use client"

import { useState } from "react"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { CATALOG, DEFAULT_FUEL_PRICE, resolveVehicle, type VehicleSelection } from "@/lib/odometer/catalog"
import type { DrivingStyle, WorkshopTier } from "@/lib/odometer/maintenance"
import type { LaborTier } from "@/lib/odometer/obd"
import type { Region } from "@/lib/odometer/units"
import { CompareTab } from "./compare-tab"
import { CostTab, type CostState } from "./cost-tab"
import { MaintenanceTab } from "./maintenance-tab"
import { Navbar, TABS, type TabId } from "./navbar"
import { ObdTab } from "./obd-tab"
import { SiteBottom } from "./site-bottom"

const INITIAL_SELECTION: VehicleSelection = { makeId: "bmw", modelId: "3-series", engineId: "330i" }
const COMPARE_B_SELECTION: VehicleSelection = (() => {
  const make = CATALOG.find((m) => m.id !== INITIAL_SELECTION.makeId) ?? CATALOG[0]
  return { makeId: make.id, modelId: make.models[0].id, engineId: make.models[0].engines[0].id }
})()

function defaultsFor(selection: VehicleSelection) {
  const { engine } = resolveVehicle(selection)
  return {
    price: engine.price,
    efficiency: engine.efficiency,
    fuelPrice: DEFAULT_FUEL_PRICE[engine.fuel],
    insurance: engine.insurance,
  }
}

export function OdometerApp() {
  const [tab, setTab] = useState<TabId>("cost")
  const [region, setRegion] = useState<Region>("US")
  const [selection, setSelection] = useState(INITIAL_SELECTION)
  const [cost, setCost] = useState<CostState>(() => ({
    ...defaultsFor(INITIAL_SELECTION),
    annualMiles: 12000,
    years: 5,
    apr: 0,
  }))
  const [odometer, setOdometer] = useState(65000)
  const [style, setStyle] = useState<DrivingStyle>("mixed")
  const [tier, setTier] = useState<WorkshopTier>("independent")
  const [code, setCode] = useState("P2002")
  const [laborTier, setLaborTier] = useState<LaborTier>("independent")
  const [compareA, setCompareA] = useState<VehicleSelection>(INITIAL_SELECTION)
  const [compareB, setCompareB] = useState<VehicleSelection>(COMPARE_B_SELECTION)

  const changeSelection = (next: VehicleSelection) => {
    setSelection(next)
    setCost((c) => ({ ...c, ...defaultsFor(next) }))
  }

  const changeTab = (next: TabId) => {
    setTab(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-dvh bg-[#F7F7F4] text-[#141A15]">
      <Navbar tab={tab} onTabChange={changeTab} region={region} onRegionChange={setRegion} />
      <main className="mx-auto max-w-6xl px-4 pt-10 pb-4 sm:px-6 lg:pt-14">
        {TABS.filter((t) => t.id !== tab).map((t) => (
          <div key={t.id} id={`panel-${t.id}`} role="tabpanel" aria-labelledby={`tab-${t.id}`} hidden />
        ))}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            id={`panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === "compare" && (
              <CompareTab
                region={region}
                a={compareA}
                b={compareB}
                onAChange={setCompareA}
                onBChange={setCompareB}
                onSwap={() => {
                  setCompareA(compareB)
                  setCompareB(compareA)
                }}
                annualMiles={cost.annualMiles}
                onAnnualMilesChange={(annualMiles) => setCost((c) => ({ ...c, annualMiles }))}
                years={cost.years}
                onYearsChange={(years) => setCost((c) => ({ ...c, years }))}
              />
            )}
            {tab === "cost" && (
              <CostTab
                region={region}
                selection={selection}
                onSelectionChange={changeSelection}
                cost={cost}
                onCostChange={(patch) => setCost((c) => ({ ...c, ...patch }))}
              />
            )}
            {tab === "maintenance" && (
              <MaintenanceTab
                region={region}
                selection={selection}
                onSelectionChange={changeSelection}
                odometer={odometer}
                onOdometerChange={setOdometer}
                style={style}
                onStyleChange={setStyle}
                tier={tier}
                onTierChange={setTier}
              />
            )}
            {tab === "obd" && (
              <ObdTab
                region={region}
                code={code}
                onCodeChange={setCode}
                laborTier={laborTier}
                onLaborTierChange={setLaborTier}
              />
            )}
          </motion.div>
        </AnimatePresence>
        <SiteBottom />
      </main>
    </div>
    </MotionConfig>
  )
}

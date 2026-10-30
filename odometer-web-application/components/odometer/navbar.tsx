"use client"

import { Gauge } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import type { Region } from "@/lib/odometer/units"

export type TabId = "cost" | "compare" | "maintenance" | "obd"

export const TABS: { id: TabId; label: string }[] = [
  { id: "cost", label: "True Cost to Own" },
  { id: "compare", label: "Compare Cars" },
  { id: "maintenance", label: "Maintenance Check" },
  { id: "obd", label: "OBD2 Repair Estimator" },
]

const REGION_OPTIONS: { id: Region; label: string; hint: string }[] = [
  { id: "US", label: "US", hint: "$ · mi · MPG" },
  { id: "UK", label: "UK", hint: "£ · mi · MPG" },
  { id: "EU", label: "EU", hint: "€ · km · L/100km" },
]

const PILL_SPRING = { type: "spring", stiffness: 420, damping: 34 } as const

interface NavbarProps {
  tab: TabId
  onTabChange: (tab: TabId) => void
  region: Region
  onRegionChange: (region: Region) => void
}

export function Navbar({ tab, onTabChange, region, onRegionChange }: NavbarProps) {
  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 border-b border-[#E6E6E1] bg-[#F7F7F4]/85 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:h-16 lg:flex-nowrap lg:py-0">
        <a href="#" className="group flex items-center gap-2" aria-label="Odometer home">
          <span className="rounded-full bg-[#183D22] p-1.5 text-white transition-transform duration-500 group-hover:rotate-[-25deg]">
            <Gauge aria-hidden="true" className="size-4" />
          </span>
          <span className="text-lg font-bold tracking-tight text-[#141A15]">Odometer</span>
        </a>

        <nav
          aria-label="Main"
          className="order-last -mx-4 w-[calc(100%+2rem)] overflow-x-auto px-4 lg:order-none lg:mx-0 lg:w-auto lg:px-0"
        >
          <div role="tablist" aria-label="Calculators" className="flex items-center gap-1">
            {TABS.map((t) => {
              const active = t.id === tab
              return (
                <button
                  key={t.id}
                  id={`tab-${t.id}`}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  aria-controls={`panel-${t.id}`}
                  onClick={() => onTabChange(t.id)}
                  className={cn(
                    "relative rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183D22]",
                    active ? "font-medium text-white" : "text-[#5F665F] hover:text-[#141A15]",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-tab-pill"
                      className="absolute inset-0 rounded-full bg-[#183D22]"
                      transition={PILL_SPRING}
                    />
                  )}
                  <span className="relative">{t.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        <div
          role="radiogroup"
          aria-label="Units and currency"
          className="flex items-center rounded-full border border-[#E6E6E1] bg-white p-0.5"
        >
          {REGION_OPTIONS.map((r) => {
            const active = r.id === region
            return (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={active}
                title={r.hint}
                onClick={() => onRegionChange(r.id)}
                className={cn(
                  "relative rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#183D22]",
                  active ? "text-white" : "text-[#5F665F] hover:text-[#141A15]",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-region-pill"
                    className="absolute inset-0 rounded-full bg-[#183D22]"
                    transition={PILL_SPRING}
                  />
                )}
                <span className="relative">{r.label}</span>
                <span className="sr-only"> ({r.hint})</span>
              </button>
            )
          })}
        </div>
      </div>
    </motion.header>
  )
}

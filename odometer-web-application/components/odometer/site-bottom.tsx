"use client"

import { useRef, useState } from "react"
import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Collapse } from "./primitives"

const FAQS = [
  {
    q: "How do we calculate 5-year depreciation?",
    a: "We apply a brand-specific annual value loss rate to the purchase price, compounded for each year you own the car. Above-average annual mileage lowers the expected resale value further, while low mileage protects it. The difference between what you pay and the estimated resale value is spread across every month of ownership.",
  },
  {
    q: "Why do short city trips wear out modern engines faster?",
    a: "Short trips rarely let the engine, oil and exhaust reach full operating temperature. Diesel particulate filters can’t complete their soot-burning regeneration, EGR valves clog with carbon, and brakes and clutches work far harder in stop-start traffic. That’s why we apply a 1.35x wear multiplier to these systems for mostly-city driving.",
  },
  {
    q: "Independent specialist vs. Dealership service costs",
    a: "Main dealerships typically charge 50–80% more per hour than independent specialists and often fit only branded parts. A good independent using OE-quality parts can usually do the same job, and most regions protect your warranty as long as servicing follows the manufacturer schedule. Keep receipts and stamped records either way.",
  },
  {
    q: "How to read OBD2 codes before visiting a workshop",
    a: "Every car sold since the late 1990s has an OBD2 port under the dashboard. A low-cost Bluetooth scanner and a free phone app will read the stored fault code and live sensor data. Knowing the code, and checking the cheap culprits first, makes it much harder for anyone to sell you parts you don’t need.",
  },
]

const LEGAL: Record<string, { title: string; body: string }> = {
  about: {
    title: "About Odometer",
    body: "Odometer is an independent set of calculators that helps drivers understand what owning and maintaining a car really costs.",
  },
  methodology: {
    title: "Methodology",
    body: "Figures combine brand depreciation curves, published fuel economy, typical insurance premiums, service intervals and average labor rates. All results are estimates and vary by region, condition and driving habits.",
  },
  privacy: {
    title: "Privacy Policy",
    body: "Calculations run entirely in your browser. We don’t store the vehicle details or numbers you enter.",
  },
  terms: {
    title: "Terms",
    body: "Odometer provides estimates for general information only. Always confirm repair decisions with a qualified mechanic.",
  },
  affiliate: {
    title: "Affiliate Disclosure",
    body: "Some partner links may earn us a commission at no extra cost to you. Partner placements never change our estimates.",
  },
}

export function SiteBottom() {
  return (
    <>
      <div
        className="mt-16 flex min-h-[90px] items-center justify-center rounded-xl border border-dashed border-[#D5D5CE] bg-white/60"
        aria-label="Advertisement"
      >
        <span className="text-xs tracking-wide text-[#A3A79F] uppercase">Sponsored Partner Placement</span>
      </div>
      <Faq />
      <Footer />
    </>
  )
}

function Faq() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section aria-labelledby="faq-heading" className="mt-16">
      <h2 id="faq-heading" className="text-2xl font-semibold tracking-tight text-[#141A15]">
        FAQ & methodology
      </h2>
      <div className="mt-6 divide-y divide-[#E6E6E1] rounded-2xl border border-[#E6E6E1] bg-white">
        {FAQS.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={f.q}>
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-[#141A15] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#183D22] sm:px-6"
                >
                  {f.q}
                  <Plus
                    aria-hidden="true"
                    className={cn("size-4 shrink-0 text-[#183D22] transition-transform duration-300", isOpen && "rotate-45")}
                  />
                </button>
              </h3>
              <Collapse open={isOpen} id={`faq-${i}`}>
                <p className="px-5 pb-5 text-sm leading-relaxed text-pretty text-[#5F665F] sm:px-6">{f.a}</p>
              </Collapse>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Footer() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [active, setActive] = useState<keyof typeof LEGAL>("about")

  const openModal = (key: keyof typeof LEGAL) => {
    setActive(key)
    dialogRef.current?.showModal()
  }

  return (
    <footer className="mt-16 flex flex-col gap-4 border-t border-[#E6E6E1] py-8 text-sm text-[#5F665F] md:flex-row md:items-center md:justify-between">
      <div>
        <p>© 2026 Odometer. Estimates only.</p>
        <p className="mt-1 text-xs text-[#8A8F89]">Currency and units follow the US / UK / EU switcher above.</p>
      </div>
      <nav aria-label="Footer">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {Object.entries(LEGAL).map(([key, item]) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => openModal(key)}
                className="hover:text-[#141A15] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183D22]"
              >
                {item.title.replace(" Odometer", "")}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <dialog
        ref={dialogRef}
        aria-labelledby="legal-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close()
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[#E6E6E1] bg-white p-0 text-[#141A15] shadow-xl backdrop:bg-[#141A15]/30 backdrop:backdrop-blur-sm"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id="legal-title" className="text-lg font-semibold tracking-tight">
              {LEGAL[active].title}
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-full p-1 text-[#5F665F] hover:bg-[#F7F7F4] hover:text-[#141A15]"
            >
              <X aria-hidden="true" className="size-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#5F665F]">{LEGAL[active].body}</p>
        </div>
      </dialog>
    </footer>
  )
}

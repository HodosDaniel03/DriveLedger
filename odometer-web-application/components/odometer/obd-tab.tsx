"use client"

import { useMemo, useState } from "react"
import { CircleCheck, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { estimateRepair, FAULT_CODES, LABOR_RATES, searchCodes, type LaborTier } from "@/lib/odometer/obd"
import { formatMoney, formatNumber, type Region } from "@/lib/odometer/units"
import { Card, PageHeader, Pill, Segmented } from "./primitives"

interface ObdTabProps {
  region: Region
  code: string
  onCodeChange: (code: string) => void
  laborTier: LaborTier
  onLaborTierChange: (t: LaborTier) => void
}

export function ObdTab({ region, code, onCodeChange, laborTier, onLaborTierChange }: ObdTabProps) {
  const [query, setQuery] = useState("")
  const matches = useMemo(() => searchCodes(query), [query])
  const fault = FAULT_CODES.find((c) => c.code === code) ?? FAULT_CODES[0]
  const rate = LABOR_RATES[laborTier]
  const est = estimateRepair(fault, rate)
  const partsShare = est.parts + est.labor > 0 ? (est.parts / (est.parts + est.labor)) * 100 : 100

  const select = (c: string) => {
    onCodeChange(c)
    setQuery("")
  }

  return (
    <>
      <PageHeader
        title="Check engine light cost estimator"
        subtitle="Enter any fault code to see the real culprit, labor hours, and fair workshop price."
      />
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <Card className="h-fit lg:sticky lg:top-24 lg:col-span-5" aria-labelledby="lookup-heading">
          <h2 id="lookup-heading" className="mb-5 text-base font-semibold tracking-tight text-[#141A15]">
            Fault code lookup
          </h2>

          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              if (matches[0]) select(matches[0].code)
            }}
            className="relative"
          >
            <label htmlFor="code-search" className="sr-only">
              Search fault code or symptom
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8A8F89]"
            />
            <input
              id="code-search"
              type="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault()
              }}
              placeholder="Search code like P0420, P2002, P0171 or symptom..."
              className="h-12 w-full rounded-xl border border-[#E6E6E1] bg-white pr-3 pl-10 text-sm text-[#141A15] placeholder:text-[#8A8F89] focus-visible:border-[#183D22] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#183D22]/30"
            />
          </form>

          {query.trim() && (
            <div className="mt-2 rounded-xl border border-[#E6E6E1]" aria-live="polite">
              {matches.length ? (
                <ul className="divide-y divide-[#EFEFEA]">
                  {matches.map((m) => (
                    <li key={m.code}>
                      <button
                        type="button"
                        onClick={() => select(m.code)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-[#F7F7F4] focus-visible:bg-[#F7F7F4] focus-visible:outline-none"
                      >
                        <span className="font-semibold tabular-nums text-[#183D22]">{m.code}</span>
                        <span className="truncate text-[#3A403B]">{m.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-2.5 text-sm text-[#5F665F]">No match yet — try a code like P0420.</p>
              )}
            </div>
          )}

          <p className="mt-6 mb-2 text-sm font-medium text-[#3A403B]">Common codes</p>
          <div className="flex flex-wrap gap-2">
            {FAULT_CODES.map((c) => {
              const active = c.code === fault.code
              return (
                <button
                  key={c.code}
                  type="button"
                  aria-pressed={active}
                  onClick={() => select(c.code)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183D22]",
                    active
                      ? "border-[#183D22] bg-[#183D22] text-white"
                      : "border-[#E6E6E1] bg-white text-[#3A403B] hover:border-[#C9C9C2]",
                  )}
                >
                  <span className="font-semibold tabular-nums">{c.code}</span> {c.short}
                </button>
              )
            })}
          </div>

          <div className="mt-7">
            <Segmented
              label="Workshop labor rate"
              value={laborTier}
              onChange={onLaborTierChange}
              options={[
                { value: "independent", label: "Independent", hint: `${formatMoney(region, LABOR_RATES.independent)}/hr` },
                { value: "dealer", label: "Dealership", hint: `${formatMoney(region, LABOR_RATES.dealer)}/hr` },
                { value: "diy", label: "DIY Parts Only", hint: `${formatMoney(region, 0)}/hr` },
              ]}
            />
          </div>
        </Card>

        <Card className="lg:col-span-7" aria-labelledby="dossier-heading" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="brand" className="text-sm tabular-nums">
              {fault.code}
            </Pill>
            {fault.driveability === "safe" ? (
              <Pill tone="good">Safe for short trips</Pill>
            ) : (
              <Pill tone="warn">Limp mode risk — check soon</Pill>
            )}
          </div>
          <h2 id="dossier-heading" className="mt-3 text-xl font-semibold tracking-tight text-balance text-[#141A15]">
            {fault.title}
          </h2>

          <div className="mt-6">
            <p className="text-4xl font-bold tabular-nums tracking-tight text-[#141A15] sm:text-5xl">
              {formatMoney(region, est.low)} – {formatMoney(region, est.high)}
            </p>
            <p className="mt-1 text-sm text-[#5F665F]">Typical total at selected labor rate</p>
          </div>

          <div className="mt-5">
            <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
              <div className="h-full bg-[#183D22] transition-[width] duration-300" style={{ width: `${partsShare}%` }} />
              <div className="h-full flex-1 bg-[#9CD08F]" />
            </div>
            <dl className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#183D22]" aria-hidden="true" />
                <dt className="text-[#5F665F]">Parts</dt>
                <dd className="font-semibold tabular-nums text-[#141A15]">{formatMoney(region, est.parts)}</dd>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#9CD08F]" aria-hidden="true" />
                <dt className="text-[#5F665F]">Labor</dt>
                <dd className="font-semibold tabular-nums text-[#141A15]">
                  {formatMoney(region, est.labor)} · {formatNumber(est.hours, 1)} hrs
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-[#141A15]">Most likely culprits</h3>
            <ol className="mt-3 flex flex-col gap-4">
              {fault.culprits.map((c, i) => (
                <li key={c.name}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-[#2A322C]">
                      <span className="mr-1.5 font-semibold tabular-nums text-[#183D22]">{i + 1}.</span>
                      {c.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-[#5F665F]">
                      {Math.round(c.probability * 100)}% ·{" "}
                      <span className="font-medium text-[#141A15]">
                        {formatMoney(region, c.parts + c.hours * rate)}
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EFEFEA]">
                    <div
                      className="h-full rounded-full bg-[#689F77] transition-[width] duration-300"
                      style={{ width: `${c.probability * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 rounded-xl bg-[#F2F6F3] p-4">
            <h3 className="text-sm font-semibold text-[#183D22]">Check this before buying expensive parts</h3>
            <ul className="mt-3 flex flex-col gap-2.5">
              {fault.checks.map((tip) => (
                <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-[#2A322C]">
                  <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#3B6E4C]" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </>
  )
}

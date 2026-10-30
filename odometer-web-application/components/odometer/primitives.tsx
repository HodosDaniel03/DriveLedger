"use client"

import { useId, useState, type ReactNode } from "react"
import { ArrowRight, ChevronDown } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

export function Card({ className, children, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[#E6E6E1] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-shadow duration-500 hover:shadow-[0_12px_32px_rgba(20,26,21,0.07)] sm:p-6",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-8 max-w-2xl">
      <motion.h1
        initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-balance text-3xl font-semibold tracking-tight text-[#141A15] sm:text-4xl"
      >
        {title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="mt-2 text-pretty text-base leading-relaxed text-[#5F665F]"
      >
        {subtitle}
      </motion.p>
    </header>
  )
}

const PILL_STYLES = {
  good: "bg-[#E8F5E9] text-[#1B5E20]",
  warn: "bg-[#FFF8E1] text-[#B7791F]",
  risk: "bg-[#FFEBEE] text-[#C62828]",
  neutral: "bg-[#F1F1EC] text-[#5F665F]",
  brand: "bg-[#183D22] text-white",
} as const

export function Pill({ tone, children, className }: { tone: keyof typeof PILL_STYLES; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        PILL_STYLES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

interface RangeSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (value: number) => void
  minLabel?: string
  maxLabel?: string
}

export function RangeSlider({ label, value, min, max, step, display, onChange, minLabel, maxLabel }: RangeSliderProps) {
  const id = useId()
  const clamped = Math.min(max, Math.max(min, value))
  const fill = ((clamped - min) / (max - min)) * 100
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-[#3A403B]">
          {label}
        </label>
        <span className="text-lg font-semibold tabular-nums tracking-tight text-[#141A15]">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamped}
        onChange={(e) => onChange(Number(e.target.value))}
        className="odo-range"
        style={{ "--fill": `${fill}%` } as React.CSSProperties}
      />
      {(minLabel || maxLabel) && (
        <div className="mt-2 flex justify-between text-xs tabular-nums text-[#8A8F89]">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  )
}

interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string; hint?: string }[]
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-[#3A403B]">{label}</legend>
      <div
  className="grid gap-1 rounded-2xl border border-[#E6E6E1] bg-[#F7F7F4] p-1"
  style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
  >
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-2 py-1.5 text-center text-sm leading-tight font-medium text-balance transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183D22]",
                active ? "bg-[#183D22] text-white shadow-sm" : "text-[#5F665F] hover:text-[#141A15]",
              )}
            >
  {o.label}
  {o.hint && (
  <span className={cn("mt-0.5 text-xs font-normal tabular-nums", active ? "text-white/75" : "text-[#8A8F89]")}>
  {o.hint}
  </span>
  )}
  </button>
          )
        })}
      </div>
    </fieldset>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

export function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  const id = useId()
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-[#5F665F]">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full cursor-pointer appearance-none truncate rounded-xl border border-[#E6E6E1] bg-white pr-9 pl-3 text-sm font-medium text-[#141A15] transition-colors hover:border-[#C9C9C2] focus-visible:border-[#183D22] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#183D22]/30"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#8A8F89]"
        />
      </div>
    </div>
  )
}

interface NumberFieldProps {
  label: string
  value: number
  decimals: number
  suffix: string
  onCommit: (value: number) => void
  min?: number
}

export function NumberField({ label, value, decimals, suffix, onCommit, min = 0 }: NumberFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? (Number.isFinite(value) ? value.toFixed(decimals) : "")
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-[#5F665F]">
        {label}
      </label>
      <div className="flex h-11 items-center rounded-xl border border-[#E6E6E1] bg-white px-3 transition-colors focus-within:border-[#183D22]">
        <input
          id={id}
          inputMode="decimal"
          value={shown}
          onFocus={() => setDraft(value.toFixed(decimals))}
          onBlur={() => setDraft(null)}
          onChange={(e) => {
            const text = e.target.value
            setDraft(text)
            const n = Number.parseFloat(text)
            if (Number.isFinite(n) && n > min) onCommit(n)
          }}
          className="w-full min-w-0 bg-transparent text-sm font-medium tabular-nums text-[#141A15] outline-none"
        />
        <span className="ml-2 shrink-0 text-xs text-[#8A8F89]">{suffix}</span>
      </div>
    </div>
  )
}

export function Collapse({ open, id, children }: { open: boolean; id: string; children: ReactNode }) {
  return (
    <div
      id={id}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
      inert={!open}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  )
}

export function PartnerCard({ text, cta, href }: { text: string; cta: string; href: string }) {
  return (
    <aside className="rounded-xl border border-[#DCE6DF] bg-[#F2F6F3] p-4">
      <Pill tone="brand" className="text-[10px] tracking-wide uppercase">
        Verified Partner
      </Pill>
      <p className="mt-2.5 text-sm leading-relaxed text-[#2A322C]">{text}</p>
      <a
        href={href}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="group mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#183D22] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#122E19] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183D22]"
      >
        {cta}
        <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
      </a>
    </aside>
  )
}

import React, { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';

export function Card({ className = '', children, ...props }) {
  return (
    <section
      className={`rounded-xl border border-border/70 bg-surface p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 sm:p-6 dark:bg-slate-900 dark:border-slate-800 dark:shadow-none ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, className = '' }) {
  return (
    <header className={`mb-8 max-w-2xl ${className}`}>
      <h1 className="text-balance text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-ink dark:text-slate-100">
        {title}
      </h1>
      <p className="mt-2 text-pretty text-sm sm:text-base leading-relaxed text-body dark:text-slate-300">
        {subtitle}
      </p>
    </header>
  );
}

const PILL_STYLES = {
  good: 'bg-success-bg text-success-text border border-[#BFE8CF] dark:bg-emerald-950/70 dark:text-emerald-400 dark:border-emerald-800/80',
  warn: 'bg-warning-bg text-warning-text border border-[#F5DE8A] dark:bg-amber-950/70 dark:text-amber-400 dark:border-amber-800/80',
  risk: 'bg-danger-bg text-danger-text border border-[#F7C1BB] dark:bg-rose-950/70 dark:text-rose-400 dark:border-rose-800/80',
  neutral: 'bg-surface-subtle text-body border border-border dark:bg-slate-800/90 dark:text-slate-300 dark:border-slate-700',
  brand: 'bg-primary-600 text-white shadow-sm dark:bg-primary-600 dark:text-white',
};

export function Pill({ tone = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors duration-200 ${PILL_STYLES[tone] || PILL_STYLES.neutral} ${className}`}
    >
      {children}
    </span>
  );
}

export function RangeSlider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
  minLabel,
  maxLabel,
  className = '',
}) {
  const clamped = Math.min(max, Math.max(min, Number(value) || min));
  const fill = max > min ? ((clamped - min) / (max - min)) * 100 : 0;
  return (
    <div className={className}>
      <div className="mb-2.5 flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-xs sm:text-sm font-medium text-body dark:text-slate-300">
          {label}
        </label>
        <span className="font-code text-sm sm:text-base font-semibold bg-surface-subtle text-ink dark:bg-slate-800 dark:text-slate-100 px-2.5 py-0.5 rounded-md tabular-nums border border-border/50 dark:border-slate-700">
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamped}
        onChange={(e) => onChange(Number(e.target.value))}
        className="odo-range telemetry-slider"
        style={{ '--fill': `${fill}%` }}
      />
      {(minLabel || maxLabel) && (
        <div className="mt-1.5 flex justify-between text-xs tabular-nums text-faint dark:text-slate-500 font-code">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}

export function Segmented({ label, value, options, onChange, className = '' }) {
  return (
    <fieldset className={className}>
      {label && <legend className="mb-2 text-xs sm:text-sm font-medium text-body dark:text-slate-300">{label}</legend>}
      <div
        className="grid gap-1 rounded-full border border-border bg-surface-subtle dark:bg-slate-950 dark:border-slate-800 p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`flex flex-col items-center justify-center rounded-full px-2 py-1.5 text-center text-xs sm:text-sm leading-tight font-medium text-balance transition-all duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${
                active
                  ? 'bg-surface text-ink font-semibold shadow-sm border border-border/50 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'
                  : 'text-muted hover:text-ink dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span>{o.label}</span>
              {o.hint && (
                <span
                  className={`mt-0.5 text-[11px] font-normal tabular-nums font-code ${
                    active ? 'text-primary-700 dark:text-primary-400 font-semibold' : 'text-faint dark:text-slate-500'
                  }`}
                >
                  {o.hint}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function SelectField({ label, value, options, onChange, id, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted dark:text-slate-400">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full cursor-pointer appearance-none truncate rounded-xl border border-border bg-surface pr-9 pl-3 text-xs sm:text-sm font-medium text-ink transition-all duration-200 hover:border-border-strong focus-visible:border-primary-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600/30 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:border-slate-700"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="dark:bg-slate-900 dark:text-slate-200">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 w-4 h-4 -translate-y-1/2 text-muted dark:text-slate-400"
        />
      </div>
    </div>
  );
}

export function NumberField({ label, value, decimals = 0, suffix = '', onCommit, min = 0, id, className = '' }) {
  const [draft, setDraft] = useState(null);
  const shown = draft ?? (Number.isFinite(value) ? (decimals > 0 ? value.toFixed(decimals) : String(Math.round(value))) : '');
  return (
    <div className={`min-w-0 ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted dark:text-slate-400">
          {label}
        </label>
      )}
      <div className="flex h-11 items-center rounded-xl border border-border bg-surface px-3 transition-all duration-200 focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-600/10 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:focus-within:border-primary-500">
        <input
          id={id}
          inputMode="decimal"
          value={shown}
          onFocus={() => setDraft(decimals > 0 ? value.toFixed(decimals) : String(Math.round(value)))}
          onBlur={() => setDraft(null)}
          onChange={(e) => {
            const text = e.target.value;
            setDraft(text);
            const n = Number.parseFloat(text);
            if (Number.isFinite(n) && n >= min) onCommit(n);
          }}
          className="w-full min-w-0 bg-transparent text-sm font-medium tabular-nums font-code text-ink dark:text-slate-200 outline-none"
        />
        {suffix && <span className="ml-2 shrink-0 text-xs text-muted dark:text-slate-400">{suffix}</span>}
      </div>
    </div>
  );
}

export function Collapse({ open, id, children, className = '' }) {
  return (
    <div
      id={id}
      className={`transition-all duration-300 ease-out overflow-hidden ${
        open ? 'max-h-[1400px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
      } ${className}`}
    >
      <div className="pt-2">{children}</div>
    </div>
  );
}

export function PartnerCard({ text, cta, href, badge = 'Verified Partner', className = '' }) {
  const cleanCta = typeof cta === 'string' ? cta.replace(/\s*→\s*$/, '').trim() : cta;
  return (
    <aside className={`rounded-xl border border-border bg-surface-subtle p-4 transition-all duration-300 hover:shadow-md dark:bg-slate-900/80 dark:border-slate-800 ${className}`}>
      <span className="bg-surface text-body font-micro text-micro font-semibold px-2 py-0.5 rounded-md inline-block mb-2 shadow-sm border border-border/40 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
        {badge}
      </span>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-code font-bold text-xs text-muted dark:bg-slate-800 dark:text-slate-400 shrink-0">
          VP
        </div>
        <p className="font-body text-body text-ink text-xs font-medium leading-relaxed dark:text-slate-200">
          {text}
        </p>
      </div>
      <a
        href={href}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="w-full text-center mt-3 py-2 bg-surface shadow-sm rounded-full font-small text-small font-semibold text-ink hover:bg-surface-subtle border border-border-strong transition-all inline-flex items-center justify-center gap-1.5 active:scale-[0.98] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-700"
      >
        <span>{cleanCta}</span>
        <ArrowRight aria-hidden="true" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 text-primary-600 dark:text-primary-400" />
      </a>
    </aside>
  );
}

export function RadialScoreGauge({ score = 72, label = 'Ownership Value Score', size = 144, className = '' }) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const tone = clamped >= 70 ? 'good' : clamped >= 40 ? 'fair' : 'poor';
  const color = tone === 'good' ? '#12A150' : tone === 'fair' ? '#F2B705' : '#F04438';
  const trackColor = tone === 'good' ? '#E8F7EE' : tone === 'fair' ? '#FFF3C4' : '#FDE3E1';
  const toneLabel = tone === 'good' ? 'Good Value' : tone === 'fair' ? 'Fair condition' : 'Needs attention';
  const toneBg =
    tone === 'good'
      ? 'bg-success-bg text-success-text dark:bg-emerald-950/70 dark:text-emerald-400'
      : tone === 'fair'
      ? 'bg-warning-bg text-warning-text dark:bg-amber-950/70 dark:text-amber-400'
      : 'bg-danger-bg text-danger-text dark:bg-rose-950/70 dark:text-rose-400';

  const strokeWidth = 11;
  const radius = (120 - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke={trackColor} className="dark:stroke-slate-800" strokeWidth={strokeWidth} />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline">
          <span className="font-metric-l text-metric-l font-bold font-code text-ink dark:text-slate-100 tracking-tight tabular-nums">{clamped}</span>
          <span className="font-small text-small text-muted dark:text-slate-400 font-medium font-code">/100</span>
        </div>
        <span className={`${toneBg} font-micro text-micro font-semibold px-2 py-0.5 rounded-full mt-0.5 whitespace-nowrap`}>
          {toneLabel}
        </span>
      </div>
    </div>
  );
}

export function SeverityGauge({ severity = 'MODERATE', size = 144, className = '' }) {
  const str = String(severity || 'MODERATE').toUpperCase();
  const isCritical = str.includes('CRITICAL');
  const isModerate = str.includes('MODERATE') || str.includes('HIGH');
  const tier = isCritical ? 'critical' : isModerate ? 'moderate' : 'low';

  const label = isCritical ? 'Critical' : isModerate ? 'Moderate' : 'Low';
  const badgeClass =
    isCritical
      ? 'bg-danger-bg text-danger-text dark:bg-rose-950/70 dark:text-rose-400'
      : isModerate
      ? 'bg-warning-bg text-warning-text dark:bg-amber-950/70 dark:text-amber-400'
      : 'bg-success-bg text-success-text dark:bg-emerald-950/70 dark:text-emerald-400';

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        {/* Low Arc */}
        <circle
          cx="60" cy="60" r="48" fill="none"
          stroke={tier === 'low' ? '#12A150' : '#E4E8EE'}
          className={tier === 'low' ? '' : 'dark:stroke-slate-800'}
          strokeWidth="11"
          strokeDasharray="80 220"
          strokeDashoffset="0"
          strokeLinecap="round"
        />
        {/* Moderate Arc */}
        <circle
          cx="60" cy="60" r="48" fill="none"
          stroke={tier === 'moderate' ? '#F2B705' : '#E4E8EE'}
          className={tier === 'moderate' ? '' : 'dark:stroke-slate-800'}
          strokeWidth="11"
          strokeDasharray="80 220"
          strokeDashoffset="-100"
          strokeLinecap="round"
        />
        {/* Critical Arc */}
        <circle
          cx="60" cy="60" r="48" fill="none"
          stroke={tier === 'critical' ? '#F04438' : '#E4E8EE'}
          className={tier === 'critical' ? '' : 'dark:stroke-slate-800'}
          strokeWidth="11"
          strokeDasharray="80 220"
          strokeDashoffset="-200"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-metric-l text-metric-l font-bold text-ink dark:text-slate-100 tracking-tight capitalize leading-none">{label}</span>
        <span className={`${badgeClass} font-micro text-micro font-semibold px-2 py-0.5 rounded-full mt-1.5`}>
          Severity
        </span>
      </div>
    </div>
  );
}


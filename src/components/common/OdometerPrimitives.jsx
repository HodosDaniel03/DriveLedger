import React, { useState } from 'react';
import { ArrowRight, ChevronDown, Info } from 'lucide-react';

export function Card({ className = '', children, ...props }) {
  return (
    <section
      className={`w-full max-w-full min-w-0 rounded-2xl border border-border/70 bg-surface p-4 shadow-card transition-[transform,box-shadow] duration-200 ease-out sm:hover:shadow-card-hover sm:hover:-translate-y-0.5 sm:p-6 dark:bg-[#121215] dark:border-zinc-800 dark:shadow-none ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, className = '' }) {
  return (
    <header className={`mb-6 max-w-2xl ${className}`}>
      <h1 className="font-sans text-balance text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-ink dark:text-zinc-50">
        {title}
      </h1>
      <p className="mt-2 font-sans font-medium text-pretty text-sm sm:text-base leading-relaxed text-body dark:text-zinc-400">
        {subtitle}
      </p>
    </header>
  );
}

const PILL_STYLES = {
  good: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40',
  warn: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40',
  risk: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40',
  neutral: 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60',
  brand: 'bg-primary-600 text-white border border-primary-700 dark:bg-primary-600 dark:text-white',
};

function extractNodeText(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractNodeText).join('');
  if (node && typeof node === 'object' && node.props) {
    return extractNodeText(node.props.children);
  }
  return '';
}

export function Pill({ tone = 'neutral', children, className = '' }) {
  const normalizedText = extractNodeText(children)
    .replace(/^[●•\s]+/, '')
    .trim()
    .toLowerCase();
  if (
    normalizedText === 'calculated' ||
    normalizedText === 'live' ||
    normalizedText === 'verified oem baseline' ||
    normalizedText === 'telemetry preset benchmark' ||
    normalizedText === 'normal / sensor fault likely'
  ) {
    return null;
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-sans font-medium whitespace-nowrap transition-colors duration-200 ${PILL_STYLES[tone] || PILL_STYLES.neutral} ${className}`}
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
        <label htmlFor={id} className="font-sans text-xs sm:text-sm font-medium text-body dark:text-zinc-300">
          {label}
        </label>
        <span className="font-mono text-sm sm:text-base font-semibold bg-surface-subtle text-ink dark:bg-zinc-900 dark:text-zinc-50 px-2.5 py-0.5 rounded-md tabular-nums border border-border/50 dark:border-zinc-800">
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
        <div className="mt-1.5 flex justify-between text-xs tabular-nums text-faint dark:text-zinc-500 font-sans font-medium">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}

export function Segmented({ label, value, options, onChange, className = '' }) {
  return (
    <fieldset className={`w-full max-w-full min-w-0 [min-inline-size:0] ${className}`}>
      {label && <legend className="mb-2 font-sans text-xs sm:text-sm font-medium text-body dark:text-zinc-300">{label}</legend>}
      <div
        className="w-full min-w-0 grid gap-1 rounded-xl border border-border bg-surface-subtle dark:bg-zinc-900 dark:border-zinc-800 p-1"
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
              className={`min-h-[44px] min-w-0 flex flex-col items-center justify-center rounded-lg px-1.5 sm:px-2 py-1.5 text-center font-sans text-xs sm:text-sm leading-tight font-medium text-balance transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${
                active
                  ? 'bg-surface text-ink font-semibold shadow-sm border border-border/50 dark:bg-zinc-800 dark:text-zinc-50 dark:border-zinc-700'
                  : 'text-muted hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <span className="truncate max-w-full">{o.label}</span>
              {o.hint && (
                <span
                  className={`mt-0.5 text-[10px] sm:text-[11px] font-normal tabular-nums font-sans truncate max-w-full ${
                    active ? 'text-primary-700 dark:text-emerald-400 font-semibold' : 'text-faint dark:text-zinc-500'
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
    <div className={`min-w-0 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block font-sans text-xs font-medium text-muted dark:text-zinc-400">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 min-h-[44px] w-full cursor-pointer appearance-none truncate rounded-xl border border-border bg-surface pr-9 pl-3 font-sans text-base sm:text-sm font-medium text-ink transition-colors duration-150 hover:border-border-strong focus-visible:border-primary-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600/30 shadow-sm dark:bg-zinc-900 dark:border-zinc-800/80 dark:text-zinc-100 dark:hover:border-zinc-700"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="dark:bg-zinc-900 dark:text-zinc-100">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 w-4 h-4 -translate-y-1/2 text-muted dark:text-zinc-400"
        />
      </div>
    </div>
  );
}

export function NumberField({ label, value, decimals = 0, suffix = '', onCommit, min = 0, id, className = '' }) {
  const [draft, setDraft] = useState(null);
  const shown = draft ?? (Number.isFinite(value) ? (decimals > 0 ? value.toFixed(decimals) : String(Math.round(value))) : '');
  return (
    <div className={`min-w-0 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block font-sans text-xs font-medium text-muted dark:text-zinc-400">
          {label}
        </label>
      )}
      <div className="flex h-11 min-h-[44px] items-center rounded-xl border border-border bg-surface px-3 transition-colors duration-150 focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-600/10 shadow-sm dark:bg-zinc-900 dark:border-zinc-800/80 dark:focus-within:border-emerald-500">
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
          className="w-full min-w-0 bg-transparent text-base sm:text-sm font-medium tabular-nums font-mono text-ink dark:text-zinc-100 outline-none"
        />
        {suffix && <span className="ml-2 shrink-0 font-sans text-xs text-muted dark:text-zinc-400">{suffix}</span>}
      </div>
    </div>
  );
}

export function Collapse({ open, id, children, className = '' }) {
  return (
    <div
      id={id}
      className={`transition-[max-height,opacity] duration-300 ease-out overflow-hidden ${
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
    <aside className={`rounded-xl border border-border bg-surface-subtle p-4 transition-[transform,box-shadow] duration-200 ease-out hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800 ${className}`}>
      <span className="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 px-2 py-0.5 text-[11px] font-sans font-medium rounded-md inline-block mb-2">
        {badge}
      </span>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-sans font-bold text-xs text-muted dark:bg-zinc-800 dark:text-zinc-400 shrink-0">
          VP
        </div>
        <p className="font-sans text-ink text-xs font-medium leading-relaxed dark:text-zinc-200">
          {text}
        </p>
      </div>
      <a
        href={href}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="w-full text-center mt-3 py-2 bg-surface shadow-sm rounded-lg font-sans text-xs font-semibold text-ink hover:bg-surface-subtle border border-border-strong transition-colors duration-150 inline-flex items-center justify-center gap-1.5 active:scale-[0.98] dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:border-zinc-700"
      >
        <span>{cleanCta}</span>
        <ArrowRight aria-hidden="true" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 text-primary-600 dark:text-emerald-400" />
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
      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
      : tone === 'fair'
      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
      : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40';

  const strokeWidth = 11;
  const radius = (120 - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke={trackColor} className="dark:stroke-zinc-800" strokeWidth={strokeWidth} />
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
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline">
          <span className="text-metric-l font-bold font-mono text-ink dark:text-zinc-50 tracking-tight tabular-nums">{clamped}</span>
          <span className="text-small text-muted dark:text-zinc-400 font-medium font-mono tabular-nums">/100</span>
        </div>
        <span className={`${toneBg} px-2 py-0.5 text-[11px] font-sans font-medium rounded-md mt-0.5 whitespace-nowrap`}>
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
      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
      : isModerate
      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
      : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40';

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        {/* Low Arc */}
        <circle
          cx="60" cy="60" r="48" fill="none"
          stroke={tier === 'low' ? '#12A150' : '#E4E8EE'}
          className={tier === 'low' ? '' : 'dark:stroke-zinc-800'}
          strokeWidth="11"
          strokeDasharray="80 220"
          strokeDashoffset="0"
          strokeLinecap="round"
        />
        {/* Moderate Arc */}
        <circle
          cx="60" cy="60" r="48" fill="none"
          stroke={tier === 'moderate' ? '#F2B705' : '#E4E8EE'}
          className={tier === 'moderate' ? '' : 'dark:stroke-zinc-800'}
          strokeWidth="11"
          strokeDasharray="80 220"
          strokeDashoffset="-100"
          strokeLinecap="round"
        />
        {/* Critical Arc */}
        <circle
          cx="60" cy="60" r="48" fill="none"
          stroke={tier === 'critical' ? '#F04438' : '#E4E8EE'}
          className={tier === 'critical' ? '' : 'dark:stroke-zinc-800'}
          strokeWidth="11"
          strokeDasharray="80 220"
          strokeDashoffset="-200"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-sans text-metric-l font-bold text-ink dark:text-zinc-50 tracking-tight capitalize leading-none">{label}</span>
        <span className={`${badgeClass} px-2 py-0.5 text-[11px] font-sans font-medium rounded-md mt-1.5`}>
          Severity
        </span>
      </div>
    </div>
  );
}

export function RiskBadge({ level = 'low', label, className = '' }) {
  const normalizedLabel = String(label || '').trim().toLowerCase();
  if (
    normalizedLabel === 'calculated' ||
    normalizedLabel === 'live' ||
    normalizedLabel === 'verified oem baseline' ||
    normalizedLabel === 'telemetry preset benchmark' ||
    normalizedLabel === 'normal / sensor fault likely'
  ) {
    return null;
  }

  const normalized = String(level).toLowerCase();
  const isCritical = normalized.includes('crit');
  const isModerate = normalized.includes('mod') || normalized.includes('warn') || normalized.includes('med');
  const isNeutral = normalized.includes('neutral');

  const toneClass = isCritical
    ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
    : isModerate
    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
    : isNeutral
    ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60'
    : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40';

  const defaultText = isCritical
    ? 'Critical'
    : isModerate
    ? 'Moderate'
    : 'Low';

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-sans font-medium tracking-tight ${toneClass} ${className}`}
    >
      <span>{label || defaultText}</span>
    </span>
  );
}

export function TldrVerdictBox({
  title = 'TL;DR Verdict',
  subtitle = 'Key telemetry signals at a glance (zero fluff)',
  badge = 'Quick Verdict',
  facts = [],
  className = '',
}) {
  return (
    <div
      data-testid="tldr-verdict-box"
      className={`rounded-2xl border border-zinc-200 bg-surface dark:bg-[#121215] dark:border-zinc-800 p-4 sm:p-5 shadow-sm space-y-3.5 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/70 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <h3 className="font-sans text-xs sm:text-sm font-bold uppercase tracking-tight text-ink dark:text-zinc-50">
            {title}
          </h3>
          {badge && (
            <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 text-[11px] font-sans font-medium">
              {badge}
            </span>
          )}
        </div>
        <span className="text-[11px] font-sans font-medium text-muted dark:text-zinc-400">
          {subtitle}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
        {facts.map((fact, idx) => (
          <div
            key={idx}
            className="min-w-0 overflow-hidden p-3.5 rounded-xl bg-surface-subtle/60 dark:bg-zinc-900 border border-border/80 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs transition-colors"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5 min-w-0">
                <span className="text-[11px] font-sans uppercase tracking-wider text-muted dark:text-zinc-400 font-semibold truncate">
                  {fact.label}
                </span>
                {fact.badge}
              </div>
              <div className="font-sans text-base sm:text-lg font-bold tabular-nums text-ink dark:text-zinc-50 leading-snug truncate">
                {fact.value}
              </div>
            </div>
            {fact.subtext && (
              <p className="mt-2 pt-2 border-t border-border/50 dark:border-zinc-800/80 text-xs text-muted dark:text-zinc-400 leading-relaxed font-sans font-medium line-clamp-2">
                {fact.subtext}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function InfoTooltip({ term, explanation, label, content, className = '' }) {
  const [open, setOpen] = useState(false);
  const resolvedTitle = term || label;
  const resolvedBody = explanation || content;
  return (
    <span className={`relative inline-flex items-center align-middle ${className}`}>
      <button
        type="button"
        aria-label={`Explanation for ${resolvedTitle || 'metric'}`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100 focus:outline-none transition-colors cursor-help"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="fixed left-4 right-4 bottom-20 sm:absolute sm:inset-auto sm:bottom-full sm:left-1/2 sm:-translate-x-1/2 sm:mb-2 sm:w-72 p-3 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-sans font-normal leading-relaxed shadow-xl border border-zinc-700 z-50 pointer-events-none whitespace-normal text-left"
        >
          {resolvedTitle && <strong className="block font-semibold text-emerald-400 mb-1">{resolvedTitle}</strong>}
          <span className="text-zinc-200">{resolvedBody}</span>
        </span>
      )}
    </span>
  );
}

export function MobileStickySummaryBar({
  primaryLabel,
  label,
  primaryValue,
  secondaryText,
  secondaryValue,
  actionLabel = 'Details ↑',
  onAction,
  badge,
  badgeText,
}) {
  const resolvedLabel = primaryLabel || label;
  const resolvedSecondary = secondaryText || secondaryValue;
  return (
    <div
      data-testid="mobile-sticky-summary-bar"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] shadow-2xl flex items-center justify-between gap-3 safe-area-x"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-sans uppercase tracking-wider text-muted dark:text-zinc-400 font-semibold truncate">
            {resolvedLabel}
          </span>
          {badge || (badgeText && (
            <span className="rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-1.5 py-0.2 text-[10px] font-sans font-semibold shrink-0">
              {badgeText}
            </span>
          ))}
        </div>
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-mono text-base font-bold tabular-nums text-ink dark:text-zinc-50 truncate">
            {primaryValue}
          </span>
          {resolvedSecondary && (
            <span className="font-sans text-xs text-muted dark:text-zinc-400 truncate">
              {resolvedSecondary}
            </span>
          )}
        </div>
      </div>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="min-h-[44px] shrink-0 rounded-lg bg-[#183D22] dark:bg-emerald-600 text-white px-3.5 py-2 font-sans text-xs font-semibold shadow-xs active:scale-95 transition-transform"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}





import React from 'react';
import { ChevronDown, CheckCircle2, AlertTriangle, ArrowRight, Landmark, Wrench } from 'lucide-react';
import { FormattedNumericInput } from '../../common/OdometerPrimitives';
import { useUnits } from '../../../context/UnitContext';

export default function TcoSecondaryDrawers({
  leaseDisclaimerTestId = 'lease-disclaimer',
  financeType,
  setFinanceType,
  tco,
  purchasePriceUsd,
  downPaymentPct,
  setDownPaymentPct,
  loanTermMonths,
  setLoanTermMonths,
  leaseTermMonths,
  setLeaseTermMonths,
  aprPct,
  setAprPct,
  financeDrawerOpen,
  setFinanceDrawerOpen,
  assumptionsDrawerOpen,
  setAssumptionsDrawerOpen,
  displayOdometer,
  setOdometerMiles,
  drivingStyle,
  setDrivingStyle,
  workshopTier,
  setWorkshopTier,
  activePreset,
  displayEfficiency,
  setMpgUs,
  displayFuelPrice,
  setFuelPriceUsdGal,
  displayInsurance,
  setAnnualInsuranceUsd,
  displayTaxReg,
  setAnnualTaxRegUsd,
  depreciationTweakPct,
  setDepreciationTweakPct,
  onNavigateToRiskMatrix,
}) {
  const {
    region,
    currencySymbol,
    distanceUnit,
    efficiencyUnit,
    evEfficiencyUnit,
    formatCurrency,
    convertRegionToMiles,
    convertRegionToUsd,
    convertRegionToMpgUs,
    convertRegionFuelPriceToUsdGal,
  } = useUnits();

  const maxOdoDisplay = region === 'EU' ? 320000 : 200000;
  const clampedOdo = Math.min(maxOdoDisplay, Math.max(0, displayOdometer));

  const minEff = activePreset.isEv
    ? region === 'EU' ? 11 : 18
    : region === 'EU' ? 3.5 : region === 'UK' ? 15 : 12;
  const maxEff = activePreset.isEv
    ? region === 'EU' ? 30 : 45
    : region === 'EU' ? 16.0 : region === 'UK' ? 90 : 75;
  const clampedEff = Math.min(maxEff, Math.max(minEff, displayEfficiency));
  const effFill = maxEff > minEff ? ((clampedEff - minEff) / (maxEff - minEff)) * 100 : 0;

  const requestedDownUsd = Math.round(purchasePriceUsd * (downPaymentPct / 100));
  const effectiveCapUsd =
    financeType === 'lease' && tco.leaseDetails
      ? tco.leaseDetails.capCostReductionUsd
      : requestedDownUsd;
  const isCapReductionCapped =
    financeType === 'lease' &&
    tco.leaseDetails &&
    requestedDownUsd > tco.leaseDetails.capCostReductionUsd + 5;
  const effectiveCapPct =
    purchasePriceUsd > 0 ? Math.round((effectiveCapUsd / purchasePriceUsd) * 100) : downPaymentPct;
  const displayedTermMonths = financeType === 'lease' ? leaseTermMonths : loanTermMonths;

  return (
    <div className="divide-y divide-border/80 dark:divide-zinc-800 border-t border-border/80 dark:border-zinc-800">
      {/* Drawer 1: Financing & Lease */}
      <details
        className="dl-disclosure group"
        open={financeDrawerOpen}
        onToggle={(e) => setFinanceDrawerOpen(Boolean(e.currentTarget?.open))}
      >
        <summary className="min-h-[48px] py-3.5 flex items-center justify-between gap-3 text-left font-sans text-xs sm:text-sm font-semibold text-ink dark:text-zinc-100 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors">
          <span className="flex items-center gap-2 min-w-0">
            <Landmark aria-hidden="true" className="w-4 h-4 text-primary-600 dark:text-emerald-400 shrink-0" />
            <span>Financing &amp; Lease</span>
            <span className="font-mono text-[11px] font-medium text-muted dark:text-zinc-400 capitalize">
              · {financeType === 'cash' ? '100% Cash' : `${financeType} (${displayedTermMonths}m @ ${aprPct}%)`}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className="w-4 h-4 shrink-0 text-muted dark:text-zinc-400 transition-transform duration-200 group-open:rotate-180"
          />
        </summary>

        <div className="pb-5 pt-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-sans font-medium text-body dark:text-zinc-300">
              Payment structure
            </span>
            <div className="bg-surface-subtle dark:bg-zinc-900 p-1 rounded-xl inline-flex gap-1 text-xs">
              {['cash', 'loan', 'lease'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFinanceType(type)}
                  className={`min-h-[36px] px-3 py-1 rounded-lg capitalize font-sans font-medium transition-colors cursor-pointer ${
                    financeType === type
                      ? 'bg-[#183D22] text-white font-semibold dark:bg-emerald-600'
                      : 'text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Computed Lease Terms Summary */}
          {financeType === 'lease' && tco.leaseDetails && (
            <div
              data-testid={leaseDisclaimerTestId}
              className="space-y-3 p-4 rounded-xl bg-surface-subtle dark:bg-emerald-950/20 border border-border/80 dark:border-emerald-800/40 text-xs font-sans"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-ink dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Residual &amp; Money-Factor Lease Model</span>
                </span>
                <span
                  data-testid="lease-monthly-payment-badge"
                  className="font-mono font-bold tabular-nums px-2.5 py-0.5 rounded-md bg-surface dark:bg-zinc-900 text-[#183D22] dark:text-emerald-300 border border-border dark:border-emerald-800/60"
                >
                  {formatCurrency(tco.leaseDetails.monthlyLeasePaymentUsd)}/mo lease
                </span>
              </div>

              <div
                data-testid="lease-terms-summary"
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/70 dark:border-zinc-800 text-[11px]"
              >
                <div>
                  <span className="block text-muted dark:text-zinc-400">Residual ({tco.leaseDetails.leaseTermMonths}m)</span>
                  <span className="font-mono font-semibold tabular-nums text-ink dark:text-zinc-100">
                    {tco.leaseDetails.residualPct}% · {formatCurrency(tco.leaseDetails.residualValueUsd)}
                  </span>
                </div>
                <div>
                  <span className="block text-muted dark:text-zinc-400">Money Factor</span>
                  <span className="font-mono font-semibold tabular-nums text-ink dark:text-zinc-100">
                    {tco.leaseDetails.moneyFactor.toFixed(5)}
                  </span>
                </div>
                <div>
                  <span className="block text-muted dark:text-zinc-400">Depr. / Rent</span>
                  <span className="font-mono font-semibold tabular-nums text-ink dark:text-zinc-100">
                    {formatCurrency(tco.leaseDetails.monthlyDepreciationUsd)} + {formatCurrency(tco.leaseDetails.monthlyRentChargeUsd)}
                  </span>
                </div>
                <div>
                  <span className="block text-muted dark:text-zinc-400">Acq. Fee</span>
                  <span className="font-mono font-semibold tabular-nums text-ink dark:text-zinc-100">
                    {formatCurrency(tco.leaseDetails.acquisitionFeeUsd)}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted dark:text-zinc-400 leading-relaxed">
                Adjusted cap cost {formatCurrency(tco.leaseDetails.adjustedCapCostUsd)} · Due at signing {formatCurrency(tco.leaseDetails.dueAtSigningUsd)} · Zero negative equity at lease turn-in.
              </p>
            </div>
          )}

          {/* Negative Equity Alert (Loan only) */}
          {tco.hasUnderwaterEquity && financeType === 'loan' && (
            <div
              data-testid="underwater-equity-alert"
              className="flex items-start gap-2 p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/25 border border-rose-200/80 dark:border-rose-800/40 text-rose-800 dark:text-rose-300 text-xs font-sans"
            >
              <AlertTriangle aria-hidden="true" className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Negative Equity Alert:</span> Peak underwater balance of{' '}
                <span className="font-mono font-bold tabular-nums">
                  {formatCurrency(tco.maxUnderwaterEquityUsd || 0)}
                </span>
                {tco.underwaterYears?.length > 0 && (
                  <span> (Years {tco.underwaterYears.join(', ')})</span>
                )}
                . Loan balance exceeds estimated residual value during this window.
              </div>
            </div>
          )}

          {financeType === 'cash' ? (
            <p className="text-xs font-sans text-muted dark:text-zinc-400">
              Paying outright eliminates financing interest. Depreciation still reflects residual value loss over your ownership horizon.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-baseline justify-between gap-4">
                  <label htmlFor="slider-down-payment" className="font-sans text-xs font-medium text-body dark:text-zinc-300">
                    {financeType === 'lease' ? 'Cap cost reduction' : 'Down payment'} (
                    <span className="font-mono tabular-nums">{downPaymentPct}%</span>
                    {isCapReductionCapped && (
                      <span className="text-amber-700 dark:text-amber-400"> · capped at {effectiveCapPct}% max</span>
                    )}
                    )
                  </label>
                  <span className="font-mono text-xs font-semibold text-ink dark:text-zinc-50 tabular-nums">
                    {formatCurrency(effectiveCapUsd)}
                  </span>
                </div>
                <input
                  id="slider-down-payment"
                  type="range"
                  min={0}
                  max={60}
                  step={5}
                  value={downPaymentPct}
                  onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                  className="odo-range telemetry-slider"
                  style={{ '--fill': `${(downPaymentPct / 60) * 100}%` }}
                />
                <div className="mt-1 flex justify-between text-[11px] tabular-nums text-faint dark:text-zinc-500 font-mono">
                  <span>0%</span>
                  <span>60%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="slider-loan-term" className="font-sans text-xs font-medium text-body dark:text-zinc-300 mb-1.5 block">
                    {financeType === 'lease' ? 'Lease term' : 'Loan term'} (<span className="font-mono tabular-nums">{displayedTermMonths}</span> mos)
                  </label>
                  <input
                    id="slider-loan-term"
                    type="range"
                    min={24}
                    max={72}
                    step={12}
                    value={displayedTermMonths}
                    onChange={(e) => {
                      const nextTerm = Number(e.target.value);
                      if (financeType === 'lease') setLeaseTermMonths(nextTerm);
                      else setLoanTermMonths(nextTerm);
                    }}
                    className="odo-range telemetry-slider"
                    style={{ '--fill': `${((displayedTermMonths - 24) / (72 - 24)) * 100}%` }}
                  />
                  <div className="mt-1 flex justify-between text-[11px] tabular-nums text-faint dark:text-zinc-500 font-mono">
                    <span>24 mos</span>
                    <span>72 mos</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="input-apr" className="font-sans text-xs font-medium text-body dark:text-zinc-300 mb-1.5 block">
                    {financeType === 'lease' ? 'Money factor (APR % equiv.)' : 'Loan APR %'}
                  </label>
                  <div className="flex min-h-[44px] sm:min-h-[40px] items-center rounded-xl border border-border dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900 px-3 focus-within:border-[#183D22] dark:focus-within:border-emerald-500">
                    <input
                      id="input-apr"
                      type="number"
                      step="0.1"
                      min="0"
                      max="40"
                      value={aprPct}
                      onChange={(e) => setAprPct(Math.min(40, Math.max(0, Number(e.target.value) || 0)))}
                      className="w-full bg-transparent text-base sm:text-xs font-semibold tabular-nums font-mono text-ink dark:text-zinc-50 outline-none"
                    />
                    <span className="ml-1 text-xs text-muted dark:text-zinc-400 font-mono">%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </details>

      {/* Drawer 2: Fine-tune assumptions */}
      <details
        id="customize-panel"
        className="dl-disclosure group"
        open={assumptionsDrawerOpen}
        onToggle={(e) => setAssumptionsDrawerOpen(Boolean(e.currentTarget?.open))}
      >
        <summary className="min-h-[48px] py-3.5 flex items-center justify-between gap-3 text-left font-sans text-xs sm:text-sm font-semibold text-ink dark:text-zinc-100 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors">
          <span className="flex items-center gap-2 min-w-0">
            <Wrench aria-hidden="true" className="w-4 h-4 text-primary-600 dark:text-emerald-400 shrink-0" />
            <span>Fine-tune assumptions</span>
            <span className="font-sans text-[11px] font-normal text-muted dark:text-zinc-400 hidden sm:inline">
              · Odometer, fuel, insurance, tax &amp; service tier
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className="w-4 h-4 shrink-0 text-muted dark:text-zinc-400 transition-transform duration-200 group-open:rotate-180"
          />
        </summary>

        <div className="pb-5 pt-1 space-y-5">
          {/* Current Odometer */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-4">
              <label htmlFor="slider-odometer-local" className="font-sans text-xs font-medium text-body dark:text-zinc-300">
                Current odometer
              </label>
              <FormattedNumericInput
                id="input-odometer-local"
                value={displayOdometer}
                min={0}
                max={400000}
                unitLabel={distanceUnit}
                onChangeValue={(val) => setOdometerMiles(convertRegionToMiles(val))}
                inputClassName="w-20 text-right bg-transparent outline-none font-mono font-semibold text-xs sm:text-sm tabular-nums text-ink dark:text-zinc-50"
              />
            </div>
            <input
              id="slider-odometer-local"
              type="range"
              min={0}
              max={maxOdoDisplay}
              step={2500}
              value={clampedOdo}
              onChange={(e) => setOdometerMiles(convertRegionToMiles(Math.max(0, Number(e.target.value))))}
              className="odo-range telemetry-slider"
              style={{ '--fill': `${(clampedOdo / maxOdoDisplay) * 100}%` }}
            />
            <div className="mt-1 flex justify-between text-[11px] tabular-nums text-faint dark:text-zinc-500 font-mono">
              <span>0 {distanceUnit}</span>
              <span>{maxOdoDisplay.toLocaleString('en-US')} {distanceUnit}</span>
            </div>
          </div>

          {/* City/Highway Split + DIY vs Dealership Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/60 dark:border-zinc-800/80">
            <div>
              <span className="block font-sans text-xs font-medium text-body dark:text-zinc-300 mb-1.5">
                City / highway split
              </span>
              <div className="bg-surface-subtle dark:bg-zinc-900 p-1 rounded-xl grid grid-cols-3 gap-1 text-xs">
                {[
                  { id: 'city', label: 'City' },
                  { id: 'mixed', label: 'Mixed' },
                  { id: 'highway', label: 'Highway' },
                ].map((ds) => (
                  <button
                    key={ds.id}
                    type="button"
                    onClick={() => setDrivingStyle(ds.id)}
                    className={`min-h-[38px] px-2 py-1 rounded-lg font-sans font-medium transition-colors cursor-pointer ${
                      drivingStyle === ds.id
                        ? 'bg-surface dark:bg-zinc-800 text-ink dark:text-zinc-50 font-semibold shadow-sm'
                        : 'text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-100'
                    }`}
                  >
                    {ds.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block font-sans text-xs font-medium text-body dark:text-zinc-300 mb-1.5">
                Workshop service tier
              </span>
              <div className="bg-surface-subtle dark:bg-zinc-900 p-1 rounded-xl grid grid-cols-3 gap-1 text-xs">
                {[
                  { id: 'diy', label: 'DIY' },
                  { id: 'independent', label: 'Indep.' },
                  { id: 'dealership', label: 'Dealer' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setWorkshopTier(tier.id)}
                    className={`min-h-[38px] px-2 py-1 rounded-lg font-sans font-medium transition-colors cursor-pointer ${
                      workshopTier === tier.id
                        ? 'bg-surface dark:bg-zinc-800 text-ink dark:text-zinc-50 font-semibold shadow-sm'
                        : 'text-muted dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-100'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fuel Efficiency & Energy Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/60 dark:border-zinc-800/80">
            <div>
              <div className="flex justify-between font-sans text-xs font-medium text-body dark:text-zinc-300 mb-1.5">
                <label htmlFor="slider-efficiency">
                  {activePreset.isEv ? 'Energy consumption' : 'Fuel efficiency'}
                </label>
                <span className="font-mono font-semibold tabular-nums text-ink dark:text-zinc-50">
                  {displayEfficiency} {activePreset.isEv ? evEfficiencyUnit : efficiencyUnit}
                </span>
              </div>
              <input
                id="slider-efficiency"
                type="range"
                min={minEff}
                max={maxEff}
                step={0.5}
                value={clampedEff}
                onChange={(e) => setMpgUs(convertRegionToMpgUs(Number(e.target.value), activePreset.isEv))}
                className="odo-range telemetry-slider"
                style={{ '--fill': `${effFill}%` }}
              />
              <input id="input-efficiency" type="hidden" value={displayEfficiency} />
            </div>

            <div>
              <label htmlFor="input-fuel-price" className="font-sans text-xs font-medium text-body dark:text-zinc-300 mb-1.5 block">
                {activePreset.isEv ? 'Electricity rate' : 'Fuel price'} ({currencySymbol})
              </label>
              <div className="flex min-h-[44px] sm:min-h-[40px] items-center rounded-xl border border-border dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900 px-3 focus-within:border-[#183D22] dark:focus-within:border-emerald-500">
                <input
                  id="input-fuel-price"
                  type="number"
                  step="0.05"
                  value={displayFuelPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!Number.isNaN(val) && val >= 0) {
                      setFuelPriceUsdGal(convertRegionFuelPriceToUsdGal(val, activePreset.isEv));
                    }
                  }}
                  className="w-full bg-transparent text-base sm:text-xs font-semibold tabular-nums font-mono text-ink dark:text-zinc-50 outline-none"
                />
                <span className="ml-1 text-xs text-muted dark:text-zinc-400 font-sans shrink-0">
                  {currencySymbol}/{activePreset.isEv ? 'kWh' : region === 'US' ? 'gal' : 'L'}
                </span>
              </div>
            </div>
          </div>

          {/* Insurance, Tax/Registration & Depreciation Tweak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/60 dark:border-zinc-800/80">
            <div>
              <label htmlFor="input-insurance" className="font-sans text-xs font-medium text-body dark:text-zinc-300 mb-1.5 block">
                Annual insurance
              </label>
              <div className="flex min-h-[44px] sm:min-h-[40px] items-center rounded-xl border border-border dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900 px-3 focus-within:border-[#183D22] dark:focus-within:border-emerald-500">
                <input
                  id="input-insurance"
                  type="number"
                  step="50"
                  value={displayInsurance}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 0) setAnnualInsuranceUsd(convertRegionToUsd(val));
                  }}
                  className="w-full bg-transparent text-base sm:text-xs font-semibold tabular-nums font-mono text-ink dark:text-zinc-50 outline-none"
                />
                <span className="ml-1 text-xs text-muted dark:text-zinc-400 font-sans shrink-0">{currencySymbol}/yr</span>
              </div>
            </div>

            <div>
              <label htmlFor="input-tax-reg" className="font-sans text-xs font-medium text-body dark:text-zinc-300 mb-1.5 block">
                Annual road tax / registration
              </label>
              <div className="flex min-h-[44px] sm:min-h-[40px] items-center rounded-xl border border-border dark:border-zinc-800 bg-surface-subtle dark:bg-zinc-900 px-3 focus-within:border-[#183D22] dark:focus-within:border-emerald-500">
                <input
                  id="input-tax-reg"
                  type="number"
                  step="25"
                  min="0"
                  value={displayTaxReg}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 0) setAnnualTaxRegUsd(convertRegionToUsd(val));
                  }}
                  className="w-full bg-transparent text-base sm:text-xs font-semibold tabular-nums font-mono text-ink dark:text-zinc-50 outline-none"
                />
                <span className="ml-1 text-xs text-muted dark:text-zinc-400 font-sans shrink-0">{currencySymbol}/yr</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="flex justify-between font-sans text-xs font-medium text-body dark:text-zinc-300 mb-1.5">
                <label htmlFor="slider-depreciation-tweak">Residual value sensitivity</label>
                <span className="font-mono font-semibold tabular-nums text-ink dark:text-zinc-50">
                  {depreciationTweakPct > 0 ? `+${depreciationTweakPct}%` : `${depreciationTweakPct}%`} retention
                </span>
              </div>
              <input
                id="slider-depreciation-tweak"
                type="range"
                min={-10}
                max={10}
                step={1}
                value={depreciationTweakPct}
                onChange={(e) => setDepreciationTweakPct(Number(e.target.value))}
                className="odo-range telemetry-slider"
                style={{ '--fill': `${((depreciationTweakPct + 10) / 20) * 100}%` }}
              />
              <div className="mt-1 flex justify-between text-[11px] tabular-nums text-faint dark:text-zinc-500 font-sans">
                <span>Faster depreciation (-10%)</span>
                <span>Baseline (0%)</span>
                <span>Stronger resale (+10%)</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 dark:border-zinc-800/80 flex items-center justify-between gap-3">
            <span className="text-xs font-sans text-muted dark:text-zinc-400">
              Want to adjust individual timing, clutch, or DPF service milestones?
            </span>
            <button
              type="button"
              onClick={onNavigateToRiskMatrix}
              className="min-h-[44px] sm:min-h-[34px] inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-[#183D22] dark:text-emerald-400 hover:underline shrink-0 cursor-pointer"
            >
              <span>Inspect Component Wear Matrix</span>
              <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}

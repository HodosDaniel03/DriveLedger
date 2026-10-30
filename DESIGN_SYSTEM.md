# ShiftMetric — UI/UX Design System & Aesthetic Specification ("Precision FinTech & Telemetry")

## 1. Visual Benchmarks & Live Reference URLs
All UI components must draw layout, spacing, and visual hierarchy inspiration from these industry leaders:
- **Split-Screen Calculator & Sticky Summary UX:** `https://www.nerdwallet.com/calculator/auto-loan-calculator` & `https://www.omnicalculator.com/finance/car-depreciation`
- **Automotive TCO & Repair Breakdown Architecture:** `https://caredge.com/ranks/costs` & `https://repairpal.com/estimator`
- **Telemetry Dossier & Risk Badges:** `https://www.carvertical.com/en/sample-report`
- **Bento Grid Hairline Craftsmanship:** `https://stripe.com` & `https://linear.app`

## 2. Core Aesthetic & Anti-AI-Slop Guardrails
- **Archetype:** Stripe Financial Dashboard meets Porsche/Rivian Telemetry UI.
- **NO Generic AI Gradients:** Strictly forbid neon purple-to-pink or cyan gradients. Use solid, authoritative Slate/Zinc surfaces, crisp `1px` structural borders, and subtle elevation shadows.
- **12-Column Split-Screen Workspace (`lg:grid-cols-12 lg:gap-8`):**
  - **Left 7 Columns (`lg:col-span-7`):** Interactive control groups, tactile range sliders, vehicle presets, and configuration toggles.
  - **Right 5 Columns (`lg:col-span-5`):** Sticky Live Telemetry Summary (`lg:sticky lg:top-24 h-fit`) containing the primary metric, visual stacked breakdown bar, and contextual partner recommendation.

## 3. Color Palette Tokens (Adaptive Dark/Light Slate System)
- **App Canvas Background:**
  - Light Mode: `#F8FAFC` (Slate 50)
  - Dark Mode: `#0B0F17` (Deep Obsidian Slate)
- **Elevated Card Surface:**
  - Light Mode: `#FFFFFF` with `1px solid #E2E8F0` (`border-slate-200`) and `shadow-sm`
  - Dark Mode: `#111827` (`bg-slate-900/90`) with `1px solid rgba(255, 255, 255, 0.08)` (`border-slate-800`)
- **Primary Brand & Interactive Accent:** `#2563EB` (Royal Blue 600) -> Hover `#1D4ED8` (Blue 700), focus ring `ring-blue-500/20`.
- **Semantic Telemetry Status Tokens:**
  - **Optimal / Healthy (`OPTIMAL`):** Text `#10B981` (Emerald 500), Badge BG `rgba(16, 185, 129, 0.12)`, Border `rgba(16, 185, 129, 0.25)`
  - **Service Window (`WARNING`):** Text `#F59E0B` (Amber 500), Badge BG `rgba(245, 158, 11, 0.12)`, Border `rgba(245, 158, 11, 0.25)`
  - **High Failure Risk (`CRITICAL`):** Text `#EF4444` (Rose 500), Badge BG `rgba(239, 68, 68, 0.12)`, Border `rgba(239, 68, 68, 0.25)`

## 4. Typography & Numeric Discipline
- **UI & Editorial Font:** `Inter` or system sans-serif with tight heading tracking (`tracking-tight font-semibold`).
- **Telemetry, Currency, Mileage & OBD-II Codes Font:** `JetBrains Mono` or `font-mono tabular-nums`.
- **Mandatory Zero-Jitter Rule:** Every dollar/euro/pound amount, cost-per-mile figure, kilometer reading, percentage share, and OBD2 code (`P2002`, `$0.54/mi`) MUST apply `font-mono tabular-nums` so numbers never shift horizontally during 60fps slider adjustments.

## 5. Interactive Controls & Monetization Components
- **Tactile Sliders:** Every `<input type="range">` must feature a top label row displaying the field title on the left and a high-contrast `font-mono tabular-nums` value badge (or direct numeric input) on the right.
- **Segmented Distribution Bars:** Multi-segment horizontal bars (Depreciation, Fuel, Maintenance, Insurance, Financing) with smooth width transitions (`transition-all duration-300`) and color-coded legend pills below.
- **Zero-CLS AdSense Slots (`<AdUnit />`):** Reserved fixed minimum heights (`min-h-[90px]` for leaderboard, `min-h-[250px]` for rectangle) with subtle dashed/hairline borders and a centered `ADVERTISEMENT` micro-label (`text-[10px] uppercase tracking-widest text-slate-400`).
- **Contextual Affiliate Cards (`<AffiliateCTA />`):** Designed as native diagnostic/financial action cards inside the results flow with a `Verified Partner` badge, dynamic cost-saving hook, and high-contrast CTA button.
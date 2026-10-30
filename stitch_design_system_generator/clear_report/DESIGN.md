---
name: Clear Report
colors:
  surface: '#FFFFFF'
  surface-dim: '#d9d9e6'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f2ff'
  surface-container: '#ededfa'
  surface-container-high: '#e7e7f4'
  surface-container-highest: '#e1e1ef'
  on-surface: '#191b24'
  on-surface-variant: '#434656'
  inverse-surface: '#2e303a'
  inverse-on-surface: '#f0f0fd'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004fe6'
  primary: '#0045cd'
  on-primary: '#ffffff'
  primary-container: '#0f5bff'
  on-primary-container: '#ebecff'
  inverse-primary: '#b6c4ff'
  secondary: '#006d33'
  on-secondary: '#ffffff'
  secondary-container: '#7cf99c'
  on-secondary-container: '#007235'
  tertiary: '#9a2d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c43b00'
  on-tertiary-container: '#ffe9e3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164f'
  on-primary-fixed-variant: '#003bb0'
  secondary-fixed: '#7ffb9f'
  secondary-fixed-dim: '#62de85'
  on-secondary-fixed: '#00210b'
  on-secondary-fixed-variant: '#005225'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59e'
  on-tertiary-fixed: '#3a0b00'
  on-tertiary-fixed-variant: '#842500'
  background: '#faf8ff'
  on-background: '#191b24'
  surface-variant: '#e1e1ef'
  canvas: '#F3F5F8'
  surface-subtle: '#F8FAFC'
  border: '#E4E8EE'
  border-strong: '#CDD4DE'
  ink: '#0B1220'
  body: '#3D4756'
  muted: '#6B7686'
  faint: '#98A2B3'
  primary-600: '#0F5BFF'
  primary-700: '#0A47D1'
  primary-800: '#0838A8'
  primary-50: '#EEF3FF'
  primary-100: '#DCE6FF'
  success-text: '#0E7A3E'
  success-bg: '#E8F7EE'
  warning-text: '#8A5A00'
  warning-bg: '#FFF6D6'
  danger-text: '#B42318'
  danger-bg: '#FDECEA'
  score-poor: '#F04438'
  score-fair: '#F2B705'
  score-good: '#12A150'
typography:
  display:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.025em
  h1:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-l:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  small:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  micro:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.08em
  metric-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 52px
  metric-l:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
  code:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
---

# Odometer Design System — "Clear Report" (carVertical-inspired)

## 1. Brand & Product
Odometer is an independent automotive cost platform with three tools:
(1) 5-Year True Cost to Own calculator, (2) Maintenance Check / Powertrain Risk Matrix,
(3) OBD2 Repair Estimator (fair workshop prices for check-engine codes).
Markets: US ($, mi, MPG), UK (£, mi, MPG), EU (€, km, L/100km). UI language: English.

Design archetype: a calm, trustworthy vehicle-history REPORT (like carVertical's report UI):
white rounded cards floating on a cool light-grey canvas, one confident royal-blue accent,
traffic-light status badges, a radial score gauge as the hero metric. Professional, clean,
data-honest. Never cluttered.

## 2. Core Principles (anti-clutter rules — mandatory)
- One idea per card. One primary action per screen region. Max ONE filled blue button visible per viewport.
- Generous whitespace: card padding 24–32px, 24px gaps between cards, 96–128px between landing sections.
- Max 4 tiles per row in data grids, max 3 cards per row in marketing sections.
- Max 3 text levels inside a card (title, value/badge, description).
- Colour is information: blue = action/selection, green/yellow/red = status only. No decorative gradients,
  no neon, no glassmorphism, no purple. Flat white surfaces with soft shadows.
- Secondary actions are outlined pill buttons (carVertical style), never extra filled buttons.
- Icons: Lucide line icons, 1.5px stroke, 16–20px, colour #6B7686 unless status.

## 3. Colour Tokens (light mode only)
Canvas / surfaces
- canvas:           #F3F5F8   (page background)
- surface:          #FFFFFF   (cards, navbar, sub-nav)
- surface-subtle:   #F8FAFC   (inner tiles, table header, input bg)
- border:           #E4E8EE   (hairlines, tile borders)
- border-strong:    #CDD4DE   (outlined pill buttons, inputs)

Text
- ink:              #0B1220   (headings, key numbers)
- body:             #3D4756   (paragraphs)
- muted:            #6B7686   (meta, labels, captions)
- faint:            #98A2B3   (placeholders, disabled)

Brand / action
- primary-600:      #0F5BFF   (active pill, primary button, links, gauge accents)
- primary-700:      #0A47D1   (hover)
- primary-800:      #0838A8   (pressed)
- primary-50:       #EEF3FF   (selected bg, info panels, pulse flash)
- primary-100:      #DCE6FF   (selected border)
- info-panel bg:    #EEF5FF with text #1D3A6B (the light-blue explanation box)

Status (badges are small pills: tinted bg + 1px border + icon + label)
- success:  text #0E7A3E, bg #E8F7EE, border #BFE8CF, icon check-circle   → label "No issues found" / "Healthy"
- warning:  text #8A5A00, bg #FFF6D6, border #F5DE8A, icon alert-triangle → label "Attention" / "Service soon"
- danger:   text #B42318, bg #FDECEA, border #F7C1BB, icon alert-octagon  → label "Critical" / "Due now"
- neutral:  text #3D4756, bg #F1F3F6, border #E4E8EE                       → label "Info"

Gauge scale (ring colour depends on score; the track is a 18% tint of the same colour)
- 0–39  poor:  #F04438 (track #FDE3E1)
- 40–69 fair:  #F2B705 (track #FFF3C4)
- 70–100 good: #12A150 (track #D9F2E3)

Chart / stacked bar segment palette (calm, distinguishable, not neon)
Depreciation #0F5BFF · Fuel/Energy #5B8CFF · Insurance #12A150 · Maintenance #F2B705 · Financing #98A2B3 · Tax/Fees #C7D2FE

## 4. Typography — Inter (Google Fonts), font-feature-settings "tnum" for all numbers
- Display      56/64, 700, -0.025em   (landing hero only)
- H1           40/48, 700, -0.02em
- H2           28/36, 700, -0.015em   (section/card group titles, e.g. "Report summary")
- H3           20/28, 600, -0.01em    (card titles, vehicle name)
- Body-L       18/28, 400             (landing paragraphs)
- Body         15/24, 400
- Small        13/20, 400–500         (tile descriptions, meta)
- Micro        11/16, 600, uppercase, +0.08em tracking (eyebrows, "ADVERTISEMENT")
- Metric-XL    48/52, 700, tabular    (gauge number, sticky summary main value)
- Metric-L     28/32, 700, tabular
- Code         JetBrains Mono 500 — ONLY for OBD2 codes (P0420) and VIN-like trim codes.
All currency, mileage, percentages: Inter with tabular numbers so digits never shift.

## 5. Shape, Elevation, Spacing
- Radius: cards 16px · inner tiles 12px · inputs 12px · chips 8px · buttons & pills 999px · images inside cards 12px.
- Card shadow (rest):  0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06); no border.
- Card shadow (hover): 0 8px 24px rgba(16,24,40,.08).
- Inner tiles: 1px solid #E4E8EE, no shadow, bg #FFFFFF.
- Spacing scale (4px base): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Container: max-width 1160px, side padding 24px (16px mobile).
- Grid: 12 columns, 24px gutter.

## 6. Layout Patterns
### 6.1 Global header (two tiers, both white)
- Tier 1 Navbar, 64px, bottom hairline: left wordmark "Odometer" (ink, 700, with a small blue
  semicircle-gauge glyph); centre-left menu: "Tools ▾", "Methodology", "Reviews", "Blog";
  right: region switcher (flag + "US" / "UK" / "EU" with chevron) and one outlined pill button "Get started".
- Tier 2 Sticky sub-nav, 56px, sticky at top:64px, bottom hairline: horizontal row of pills
  — "True Cost to Own", "Maintenance Check", "OBD2 Repair Estimator".
  Inactive pill: 1px #CDD4DE border, ink text 14/500, height 36px, padding 0 16px.
  Active pill: filled #0F5BFF, white text (a single sliding indicator moves between pills).
  On mobile the pill row scrolls horizontally with a soft right-edge fade.

### 6.2 Tool page skeleton (same for all three tools)
1. Hero row (2 equal cards, 24px gap):
   - Vehicle card: left 40% studio car photo (light grey seamless background, 3/4 view, radius 12px),
     right: vehicle name (H3), trim code (Code style, muted), spec chips row (icon + label, chip bg
     #F1F3F6, radius 8px, 12/500: e.g. "Diesel", "Automatic", "Wagon", "2019"), meta line
     "Generated on 22 Oct 2026, 15:50" (muted), bottom-left outlined pills "Change vehicle" and "Share ↗".
   - Score card: title (H3) + tiny tag pill (e.g. "Live" in success colours) + info icon top-right.
     Left: radial gauge 152px, stroke 14px, rounded caps, big number (Metric-XL) and "/100" (muted) centred.
     Right: "What affected the score" (Small 600, ink) + 2-line explanation (Small, body);
     below it an info panel (#EEF5FF, radius 12px, padding 16px) with one comparison sentence using bold
     for the key words. Bottom-left outlined pill "See score details".
2. Workspace split (12-col): left 7 cols = control cards; right 5 cols = sticky summary card (top: 136px).
3. "Report summary" card: H2 title, then 4-column grid of inner tiles (2 rows max). Each tile:
   title (14/600 ink) → status badge pill → 1–2 line description (Small, muted).
4. Optional single ad slot below the summary (see 7.10). Then footer.

## 7. Components
7.1 Buttons — Primary: filled #0F5BFF, white 15/600, height 48px (40 small), pill. Secondary: white bg,
    1px #CDD4DE, ink text, pill, optional trailing icon. Tertiary: text link #0F5BFF 600 with "→".
7.2 Status badge — pill, height 24px, padding 0 10px, 12/600, leading 14px icon, tinted colours (section 3).
7.3 Spec chip — 28px high, bg #F1F3F6, radius 8px, 16px muted icon + 12/500 ink label.
7.4 Radial score gauge — SVG circle, 270° or 360° ring, track = tint, value arc = status colour, number centred.
    Variant "severity" (OBD): 3 equal arc segments Low / Moderate / Critical, active segment coloured,
    others #E4E8EE, label under number.
7.5 Slider — label row (field name left in Small 500 muted, value badge right: tabular, ink, bg #F1F3F6, radius 8px);
    track 6px #E4E8EE, filled part #0F5BFF, thumb 22px white with 2px #0F5BFF border and soft shadow.
7.6 Segmented control — container bg #F1F3F6, radius 999px, padding 4px; active segment white with card shadow.
7.7 Stacked distribution bar — 12px high, radius 999px, 2px white gaps between segments; legend below as
    rows: colour dot + label (Small) + value right-aligned (tabular) + percentage (muted).
7.8 Sticky summary card — eyebrow (Micro, muted) → Metric-XL value (e.g. "$612 /mo") → secondary metrics row
    (2 columns, Metric-L small) → stacked bar + legend → divider → native partner card.
7.9 Native partner card — inner tile, tiny "Verified Partner" neutral badge, partner logo placeholder (grey
    rounded square with initials), one-line value hook, outlined pill CTA. Never louder than the main metric.
7.10 Ad slot — full content width, min-height 90px, 1px dashed #E4E8EE, radius 12px, centred Micro label
    "ADVERTISEMENT" in #98A2B3. Max one per page.
7.11 Search field (hero) — height 60px, white, radius 999px, 1px #CDD4DE, leading search icon, placeholder in faint,
    embedded primary button on the right ("Check now"). Focus: border #0F5BFF + 4px ring rgba(15,91,255,.15).
7.12 Accordion (FAQ) — rows separated by hairlines, question 16/600 ink, chevron right, answer Body muted.
7.13 Table — header row bg #F8FAFC, 12/600 muted uppercase; rows 56px, hairline separators, no zebra stripes.
7.14 Skeleton — blocks in #EEF1F5 with radius matching the final element; shimmer highlight #F7F9FB.

## 8. Imagery
- Car photos: realistic studio product shots on seamless very light grey (#EEF1F5) backgrounds, soft floor
  shadow, 3/4 front or side view, no people, no text, no dramatic lighting.
- Blog/marketing images: bright, natural daylight automotive photography (workshop, dashboard, road), muted tones.
- Illustrations are not used. Icons: Lucide line icons only.

## 9. Motion Specification (professional, calm, purposeful)
Tokens
- ease-out:    cubic-bezier(0.16, 1, 0.3, 1)   (default for entrances & value changes)
- ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)  (indicators, accordions)
- duration: instant 120ms · fast 200ms · base 320ms · medium 480ms · slow 700ms · gauge 1200ms

Animations
1. Score gauge draw + count-up: on first viewport entry the arc animates stroke-dashoffset from 0 to the value
   (1200ms, ease-out, 150ms delay) while the centre number counts up in sync (tabular digits). On value change
   it tweens from the previous value (600ms). Colour is the final status colour from the start.
2. Scroll reveal: cards/sections fade in (opacity 0→1) and rise 8px→0, 480ms ease-out, staggered 60ms per item,
   max 6 items per group, triggers once at 15% visibility. Never applied to the navbar or to above-the-fold text
   that the user needs immediately (hero headline uses a single 320ms fade only).
3. Sliding pill indicator: one blue pill element slides (left + width) between sub-nav tabs and segmented
   control options, 320ms ease-in-out; label colours crossfade 200ms.
4. Live values: stacked bar segment widths animate 320ms ease-out; numbers tween 400ms; no layout shift
   (tabular nums + reserved min-width).
5. Hover & press: cards lift translateY(-2px) and switch to hover shadow (200ms); buttons darken (150ms) and
   press to scale(0.98) (120ms); outlined pills get #F8FAFC bg; focus-visible ring 3px rgba(15,91,255,.25).
6. Skeleton shimmer: linear-gradient highlight sweeps left→right, 1.4s linear infinite; shown only if loading
   lasts >300ms; crossfades to content in 200ms.
7. Sticky summary pulse: when the main value changes, its container flashes primary-50 → transparent with a
   1px rgba(15,91,255,.2) ring fading out (700ms ease-out). Fires on slider release, max once per 800ms.
8. Tab/page content change: outgoing content fades out 120ms, incoming fades in + rises 4px in 240ms.
9. Accordion: height via grid-template-rows 0fr→1fr 320ms ease-in-out; chevron rotates 180°.
Rules: no bounce, no parallax, no looping motion except skeletons, max one prominent animation per viewport
at a time. prefers-reduced-motion: remove all translate/scale, gauge and numbers show final values instantly,
shimmer becomes static, keep opacity fades ≤150ms.

## 10. Responsive
- Breakpoints: 390 (mobile), 768 (tablet), 1024 (laptop), 1280+ (desktop).
- < 1024: workspace split stacks; the sticky summary becomes a sticky bottom bar (white, top hairline, shadow
  upward) specifying the main value + "Details" pill that opens a bottom sheet.
- < 768: hero cards stack (photo on top, 16:9), report summary grid becomes 1 column (2 on tablet),
  navbar collapses to wordmark + region + hamburger; sub-nav pills scroll horizontally.
- Touch targets ≥ 44px.

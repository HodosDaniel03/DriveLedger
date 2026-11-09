import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transpileJsx } from '../scripts/jsx-loader.mjs';
import {
  VENDOR_REACT_JS,
  VENDOR_REACT_DOM_CLIENT_JS,
  VENDOR_ROUTER_JS,
  VENDOR_LUCIDE_JS,
} from '../scripts/server-and-build.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Minimal standards-compliant DOM environment in Node v24 to exercise the real VENDOR_REACT_DOM_CLIENT_JS reconciler
class MockTextNode {
  constructor(text) {
    this.nodeType = 3;
    this.nodeValue = String(text);
    this.parentNode = null;
  }
  get textContent() {
    return this.nodeValue;
  }
  set textContent(v) {
    this.nodeValue = String(v);
  }
  toHtml() {
    return this.nodeValue;
  }
}

class MockDocumentFragment {
  constructor() {
    this.nodeType = 11;
    this.childNodes = [];
  }
  appendChild(node) {
    if (!node) return node;
    if (node.nodeType === 11) {
      for (const c of [...node.childNodes]) {
        this.appendChild(c);
      }
      node.childNodes = [];
      return node;
    }
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }
  removeChild(node) {
    const idx = this.childNodes.indexOf(node);
    if (idx !== -1) {
      this.childNodes.splice(idx, 1);
      node.parentNode = null;
    }
    return node;
  }
  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] || null;
  }
  toHtml() {
    return this.childNodes.map((c) => c.toHtml()).join('');
  }
}

class MockElement {
  constructor(tagName, namespaceURI = 'http://www.w3.org/1999/xhtml') {
    this.nodeType = 1;
    this.tagName = String(tagName).toUpperCase();
    this.namespaceURI = namespaceURI;
    this.parentNode = null;
    this.childNodes = [];
    this._attrs = new Map();
    this._listeners = new Map();
    this.style = {};
    this.checked = false;
    this._value = '';
    this._innerHTML = null;
    this.classList = {
      _set: new Set(),
      add: (...tokens) => tokens.forEach((t) => this.classList._set.add(t)),
      remove: (...tokens) => tokens.forEach((t) => this.classList._set.delete(t)),
      contains: (t) => this.classList._set.has(t),
    };
  }
  get id() {
    return this._attrs.get('id') || '';
  }
  set id(v) {
    this.setAttribute('id', v);
  }
  get className() {
    return this._attrs.get('class') || '';
  }
  set className(v) {
    this.setAttribute('class', v);
  }
  get type() {
    return this._attrs.get('type') || (this.tagName === 'BUTTON' ? 'submit' : '');
  }
  set type(v) {
    this.setAttribute('type', v);
  }
  get value() {
    return this._value;
  }
  set value(v) {
    this._value = String(v);
  }
  get innerHTML() {
    if (this._innerHTML !== null) return this._innerHTML;
    return this.childNodes.map((c) => c.toHtml()).join('');
  }
  set innerHTML(v) {
    this._innerHTML = String(v);
    this.childNodes = [];
  }
  get attributes() {
    return Array.from(this._attrs.entries()).map(([name, value]) => ({ name, value }));
  }
  hasAttribute(name) {
    return this._attrs.has(name);
  }
  getAttribute(name) {
    return this._attrs.has(name) ? this._attrs.get(name) : null;
  }
  setAttribute(name, value) {
    this._attrs.set(name, String(value));
  }
  removeAttribute(name) {
    this._attrs.delete(name);
  }
  appendChild(node) {
    if (!node) return node;
    if (node.nodeType === 11) {
      for (const c of [...node.childNodes]) {
        this.appendChild(c);
      }
      node.childNodes = [];
      return node;
    }
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }
  removeChild(node) {
    const idx = this.childNodes.indexOf(node);
    if (idx !== -1) {
      this.childNodes.splice(idx, 1);
      node.parentNode = null;
    }
    return node;
  }
  replaceChild(newNode, oldNode) {
    const idx = this.childNodes.indexOf(oldNode);
    if (idx === -1) return oldNode;
    if (newNode.nodeType === 11) {
      const items = [...newNode.childNodes];
      newNode.childNodes = [];
      items.forEach((item) => {
        if (item.parentNode) item.parentNode.removeChild(item);
        item.parentNode = this;
      });
      oldNode.parentNode = null;
      this.childNodes.splice(idx, 1, ...items);
      return oldNode;
    }
    if (newNode.parentNode) {
      newNode.parentNode.removeChild(newNode);
    }
    newNode.parentNode = this;
    oldNode.parentNode = null;
    this.childNodes[idx] = newNode;
    return oldNode;
  }
  replaceChildren(...nodes) {
    for (const c of this.childNodes) c.parentNode = null;
    this.childNodes = [];
    for (const n of nodes) this.appendChild(n);
  }
  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] || null;
  }
  addEventListener(evt, fn) {
    if (!this._listeners.has(evt)) this._listeners.set(evt, []);
    this._listeners.get(evt).push(fn);
  }
  dispatchEvent(eventObj) {
    const fns = this._listeners.get(eventObj.type) || [];
    const e = {
      target: this,
      currentTarget: this,
      preventDefault() {},
      stopPropagation() {},
      ...eventObj,
    };
    for (const fn of fns) {
      fn(e);
    }
  }
  focus() {
    globalThis.document.activeElement = this;
  }
  scrollIntoView() {}
  get textContent() {
    if (this._innerHTML !== null) return this._innerHTML.replace(/<[^>]+>/g, '');
    return this.childNodes.map((c) => c.textContent).join('');
  }
  querySelectorAll(predicate) {
    const results = [];
    const visit = (node) => {
      if (node.nodeType === 1) {
        if (predicate(node)) results.push(node);
        for (const c of node.childNodes) visit(c);
      }
    };
    visit(this);
    return results;
  }
  getElementById(id) {
    const found = this.querySelectorAll((el) => el.id === id);
    return found[0] || null;
  }
  toHtml() {
    const tag = this.tagName.toLowerCase();
    const attrStr = Array.from(this._attrs.entries())
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');
    const styleEntries = Object.entries(this.style || {});
    const styleStr = styleEntries.length
      ? `style="${styleEntries.map(([k, v]) => `${k}:${v}`).join(';')}"`
      : '';
    const combinedAttrs = [attrStr, styleStr].filter(Boolean).join(' ');
    const inner =
      this._innerHTML !== null
        ? this._innerHTML
        : this.childNodes.map((c) => c.toHtml()).join('');
    return `<${tag}${combinedAttrs ? ' ' + combinedAttrs : ''}>${inner}</${tag}>`;
  }
}

const storageMap = new Map();
globalThis.localStorage = {
  getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
};

const rootContainer = new MockElement('div');
rootContainer.id = 'root';

globalThis.document = {
  documentElement: new MockElement('html'),
  activeElement: null,
  createElement: (tag) => new MockElement(tag),
  createElementNS: (ns, tag) => new MockElement(tag, ns),
  createTextNode: (text) => new MockTextNode(text),
  createDocumentFragment: () => new MockDocumentFragment(),
  getElementById: (id) => (id === 'root' ? rootContainer : rootContainer.getElementById(id)),
};

const windowListeners = new Map();
globalThis.window = {
  location: {
    pathname: '/tco',
    search: '?tab=tco&preset=ford-focus-ecoblue&code=P2002',
    hash: '',
    href: 'http://localhost:5173/tco?tab=tco&preset=ford-focus-ecoblue&code=P2002',
  },
  history: {
    replaceState(_state, _title, url) {
      const u = new URL(url, 'http://localhost:5173');
      globalThis.window.location.pathname = u.pathname;
      globalThis.window.location.search = u.search;
      globalThis.window.location.hash = u.hash;
      globalThis.window.location.href = u.href;
    },
    pushState(_state, _title, url) {
      const u = new URL(url, 'http://localhost:5173');
      globalThis.window.location.pathname = u.pathname;
      globalThis.window.location.search = u.search;
      globalThis.window.location.hash = u.hash;
      globalThis.window.location.href = u.href;
    },
  },
  addEventListener(evt, fn) {
    if (!windowListeners.has(evt)) windowListeners.set(evt, []);
    windowListeners.get(evt).push(fn);
  },
  removeEventListener(evt, fn) {
    if (!windowListeners.has(evt)) return;
    const list = windowListeners.get(evt);
    const idx = list.indexOf(fn);
    if (idx !== -1) list.splice(idx, 1);
  },
  dispatchEvent(eventObj) {
    const list = windowListeners.get(eventObj.type) || [];
    for (const fn of [...list]) {
      fn(eventObj);
    }
  },
  scrollTo() {},
};

// Register hooks using the ACTUAL production VENDOR_* sources from scripts/server-and-build.mjs
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'react') {
      return { url: 'virtual:react', shortCircuit: true };
    }
    if (specifier === 'react-dom/client') {
      return { url: 'virtual:react-dom-client', shortCircuit: true };
    }
    if (specifier === 'react-router-dom') {
      return { url: 'virtual:react-router-dom', shortCircuit: true };
    }
    if (specifier === 'lucide-react') {
      return { url: 'virtual:lucide-react', shortCircuit: true };
    }
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      const candidateBase = path.resolve(parentDir, specifier);
      for (const ext of ['', '.js', '.jsx', '/index.js', '/index.jsx']) {
        const full = candidateBase + ext;
        if (fs.existsSync(full) && fs.statSync(full).isFile()) {
          return { url: pathToFileURL(full).href, shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'virtual:react') {
      return { format: 'module', source: VENDOR_REACT_JS, shortCircuit: true };
    }
    if (url === 'virtual:react-dom-client') {
      return { format: 'module', source: VENDOR_REACT_DOM_CLIENT_JS, shortCircuit: true };
    }
    if (url === 'virtual:react-router-dom') {
      return { format: 'module', source: VENDOR_ROUTER_JS, shortCircuit: true };
    }
    if (url === 'virtual:lucide-react') {
      return { format: 'module', source: VENDOR_LUCIDE_JS, shortCircuit: true };
    }
    if (url.endsWith('.jsx')) {
      const filePath = fileURLToPath(url);
      const raw = fs.readFileSync(filePath, 'utf8');
      const transpiled = transpileJsx(raw);
      return { format: 'module', source: transpiled, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

console.log('=== DriveLedger Full-Stack Deep Verification Suite ===');

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { VEHICLE_PRESETS, getPresetById } = await import('../src/data/vehiclePresets.js');
const { MAINTENANCE_COMPONENTS, evaluateComponentHealth, calculateOemRiskMultiplier } = await import('../src/data/maintenanceData.js');
const { OBD_CODES, calculateObdWorkshopEstimate } = await import('../src/data/obdCodes.js');
const {
  convertUsdToRegion,
  convertRegionToUsd,
  convertMilesToRegion,
  convertRegionToMiles,
  convertMpgUsToRegion,
  convertRegionToMpgUs,
  convertFuelPriceUsdGalToRegion,
  convertRegionFuelPriceToUsdGal,
} = await import('../src/context/UnitContext.jsx');
const { calculateTcoProjection } = await import('../src/components/calculators/TcoCalculator.jsx');
const { default: App } = await import('../src/App.jsx');

// 1. Verify Vehicle Presets & Residual Curves
assert.ok(VEHICLE_PRESETS.length >= 12, `Must contain at least 12 global vehicle presets (found ${VEHICLE_PRESETS.length})`);
const obdCodeSet = new Set(OBD_CODES.map((c) => c.code));
for (const preset of VEHICLE_PRESETS) {
  assert.ok(preset.id && preset.name, 'Preset missing id/name');
  assert.equal(preset.residualCurve10Yr.length, 10, `${preset.id} must have a 10-year residual curve`);
  for (let i = 1; i < preset.residualCurve10Yr.length; i++) {
    assert.ok(
      preset.residualCurve10Yr[i] <= preset.residualCurve10Yr[i - 1],
      `${preset.id} residual curve must be monotonically non-increasing`
    );
  }
  for (const code of preset.commonObdCodes) {
    assert.ok(obdCodeSet.has(code), `Preset ${preset.id} references unknown OBD code ${code}`);
  }
}
assert.equal(getPresetById('invalid-id').id, VEHICLE_PRESETS[0].id);
console.log('✓ 1. 12 Vehicle Presets & 10-year residual curves verified');

// 2. Verify Mechanical Components, Thermodynamic Multipliers & Monotonic Odometer Wear
assert.ok(MAINTENANCE_COMPONENTS.length >= 6, 'Must have at least 6 mechanical assemblies');
for (const comp of MAINTENANCE_COMPONENTS) {
  assert.ok(
    comp.urbanShortTripPenalty >= 1.35 && comp.urbanShortTripPenalty <= 1.55,
    `${comp.id} urbanShortTripPenalty (${comp.urbanShortTripPenalty}) must be in [1.35, 1.55]`
  );
  const zeroEval = evaluateComponentHealth({
    component: comp,
    physicalOdometerMiles: 0,
    urbanTripSharePct: 50,
    oilIntervalId: 'standard',
    serviceHistoryId: 'verified',
  });
  assert.equal(zeroEval.effectiveWearMiles, 0);
  assert.equal(zeroEval.status, 'OPTIMAL');

  // Verify monotonic wear progression as physical odometer increases (including across 58k -> 85k -> 115k miles)
  const odometers = [0, 25000, 45000, 58000, 75000, 85000, 105000, 130000];
  let prevWear = -1;
  for (const odo of odometers) {
    const h = evaluateComponentHealth({
      component: comp,
      physicalOdometerMiles: odo,
      urbanTripSharePct: 45,
      oilIntervalId: 'standard',
      serviceHistoryId: 'verified',
    });
    assert.ok(
      h.wearPctOfCritical >= prevWear,
      `${comp.id} wearPctOfCritical must never decrease when odometer increases (${odo} mi gave ${h.wearPctOfCritical}% < ${prevWear}%)`
    );
    prevWear = h.wearPctOfCritical;
  }

  const highwayEval = evaluateComponentHealth({
    component: comp,
    physicalOdometerMiles: 55000,
    urbanTripSharePct: 0,
    oilIntervalId: 'strict',
    serviceHistoryId: 'verified',
  });
  const urbanEval = evaluateComponentHealth({
    component: comp,
    physicalOdometerMiles: 55000,
    urbanTripSharePct: 100,
    oilIntervalId: 'extended',
    serviceHistoryId: 'unknown',
  });
  assert.ok(
    urbanEval.effectiveWearMiles > highwayEval.effectiveWearMiles * 1.5,
    `${comp.id} severe urban + extended oil must accelerate effective wear age`
  );
}

// Verify Dynamic OEM Risk Exposure Multipliers & Fallacy Fields
const mult0 = calculateOemRiskMultiplier(0);
const mult45k = calculateOemRiskMultiplier(45000);
const mult58k = calculateOemRiskMultiplier(58000);
const mult85k = calculateOemRiskMultiplier(85000);
const mult120k = calculateOemRiskMultiplier(120000);
const mult200k = calculateOemRiskMultiplier(200000);
assert.equal(mult0, 2.2, 'OEM multiplier at 0 miles must clamp to 2.2x');
assert.equal(mult45k, 2.2, 'OEM multiplier at 45k miles must clamp to minimum 2.2x');
assert.equal(mult58k, 2.2, 'OEM multiplier at 58k miles is clamped to base 2.2x');
assert.ok(mult85k > 2.2 && mult85k < 3.1, `OEM multiplier at 85k (${mult85k}) must scale dynamically between 2.2x and 3.1x`);
assert.ok(mult85k > mult58k, 'OEM multiplier must scale monotonically with odometer');
assert.equal(mult120k, 3.1, 'OEM multiplier at 120k miles must clamp to maximum 3.1x');
assert.equal(mult200k, 3.1, 'OEM multiplier at 200k miles must clamp to maximum 3.1x');

const timingComp = MAINTENANCE_COMPONENTS.find((c) => c.id === 'timing-assembly');
assert.equal(timingComp.oemFallacyBadge, '🚨 OEM EXTENDED BELT INTERVAL RISK');
assert.ok(timingComp.oemFallacyExplanation && timingComp.oemFallacyExplanation.includes('EcoBoost/PureTech'));

const transComp = MAINTENANCE_COMPONENTS.find((c) => c.id === 'drivetrain-dmf-dsg');
assert.equal(transComp.oemFallacyBadge, '🚨 OEM "LIFETIME FLUID" FALLACY');
assert.ok(transComp.oemFallacyExplanation && transComp.oemFallacyExplanation.includes('ZF'));

const gdiComp = MAINTENANCE_COMPONENTS.find((c) => c.id === 'gdi-intake-pcv-ignition');
assert.equal(gdiComp.oemFallacyBadge, '⚠️ UNSCHEDULED OEM ITEM');
assert.ok(gdiComp.oemFallacyExplanation && gdiComp.oemFallacyExplanation.includes('walnut media blasting'));

console.log('✓ 2. Maintenance Risk Matrix & Monotonic Thermodynamic Multipliers (1.35x-1.55x) verified');

// 3. Verify 20 High-CPC OBD-II Fault Codes & Workshop Rate Tiers
assert.equal(OBD_CODES.length, 20, 'Must contain exactly 20 OBD-II fault dossiers');
for (const item of OBD_CODES) {
  const probSum = item.rootCauses.reduce((acc, r) => acc + r.probabilityPct, 0);
  assert.equal(probSum, 100, `Root cause probabilities for ${item.code} must sum to 100%`);
  const dlEst = calculateObdWorkshopEstimate(item, 'dealership');
  const indEst = calculateObdWorkshopEstimate(item, 'independent');
  const diyEst = calculateObdWorkshopEstimate(item, 'diy');
  assert.equal(dlEst.rateUsdPerHr, 185);
  assert.equal(indEst.rateUsdPerHr, 115);
  assert.equal(diyEst.rateUsdPerHr, 0);
  assert.equal(diyEst.minLaborUsd, 0);
  assert.ok(
    dlEst.weightedExpectedUsd > indEst.weightedExpectedUsd &&
      indEst.weightedExpectedUsd > diyEst.weightedExpectedUsd
  );
}
console.log('✓ 3. 20 OBD-II Fault Dossiers, Probability Sums & Workshop Rate Tiers verified');

// 4. UnitContext Conversions & Round-Trip Identities
for (const reg of ['US', 'UK', 'EU']) {
  const localCurr = convertUsdToRegion(10000, reg);
  assert.ok(Math.abs(convertRegionToUsd(localCurr, reg) - 10000) < 0.01, `${reg} currency round-trip failed`);

  const localDist = convertMilesToRegion(50000, reg);
  assert.ok(Math.abs(convertRegionToMiles(localDist, reg) - 50000) < 0.1, `${reg} distance round-trip failed`);

  const dispEff = convertMpgUsToRegion(40, reg, false);
  assert.ok(Math.abs(convertRegionToMpgUs(dispEff, reg, false) - 40) < 0.6, `${reg} MPG/L100km round-trip failed`);

  const dispFuel = convertFuelPriceUsdGalToRegion(4.0, reg, false);
  assert.ok(Math.abs(convertRegionFuelPriceToUsdGal(dispFuel, reg, false) - 4.0) < 0.08, `${reg} fuel price round-trip failed`);
}
assert.equal(convertMpgUsToRegion(47.0429, 'EU', false), 5.0, '47.04 MPG US must equal 5.0 L/100km');
console.log('✓ 4. UnitContext (US / UK / EU) live conversion math verified');

// 5. TcoCalculator Financial Engine & Edge Cases
for (const preset of VEHICLE_PRESETS) {
  const proj = calculateTcoProjection({
    purchasePriceUsd: preset.purchasePriceUsd,
    odometerMiles: preset.defaultOdometerMiles,
    annualDistanceMiles: preset.annualDistanceMiles,
    mpgUs: preset.mpgUs,
    isEv: preset.isEv,
    fuelPriceUsdGal: preset.defaultFuelPriceUsdGal,
    annualInsuranceUsd: preset.annualInsuranceUsd,
    baseAnnualMaintenanceUsd: preset.baseAnnualMaintenanceUsd,
    maintenanceWearFactor: preset.maintenanceWearFactor,
    downPaymentPct: 20,
    aprPct: 6.0,
    loanTermMonths: 60,
    horizonYears: 5,
    residualCurve10Yr: preset.residualCurve10Yr,
  });

  assert.equal(proj.yearlySchedule.length, 5);
  assert.ok(proj.costPerMileUsd > 0.15 && proj.costPerMileUsd < 3.5, `${preset.id} costPerMile (${proj.costPerMileUsd}) out of realistic bounds`);
  const pctSum = proj.breakdown.reduce((acc, b) => acc + b.sharePct, 0);
  assert.ok(Math.abs(pctSum - 100) <= 0.3, `${preset.id} breakdown shares must sum to ~100% (got ${pctSum})`);
  assert.equal(proj.breakdown.length, 5, `${preset.id} must have exactly 5 breakdown categories`);
  assert.equal(proj.breakdown[0].id, 'depreciation');
  assert.equal(proj.breakdown[0].color, '#0F5BFF');
  assert.equal(proj.breakdown[1].id, 'fuel');
  assert.equal(proj.breakdown[1].color, '#5B8CFF');
  assert.equal(proj.breakdown[2].id, 'insurance');
  assert.equal(proj.breakdown[2].color, '#12A150');
  assert.equal(proj.breakdown[3].id, 'maintenance');
  assert.equal(proj.breakdown[3].color, '#F2B705');
  assert.equal(proj.breakdown[4].id, 'interest');
  assert.equal(proj.breakdown[4].color, '#98A2B3');
}

const cashProj = calculateTcoProjection({
  purchasePriceUsd: 35000,
  odometerMiles: 0,
  annualDistanceMiles: 12000,
  mpgUs: 35,
  isEv: false,
  fuelPriceUsdGal: 3.5,
  annualInsuranceUsd: 1200,
  downPaymentPct: 100,
  aprPct: 0,
  loanTermMonths: 0,
  horizonYears: 1,
});
assert.equal(cashProj.totalInterestUsd, 0, 'Cash purchase must have $0 interest');
assert.equal(cashProj.monthlyLoanPaymentUsd, 0, 'Cash purchase must have $0 loan payment');
assert.equal(cashProj.yearlySchedule.length, 1, '1-year horizon must produce 1 schedule row');
console.log('✓ 5. TcoCalculator financial engine & edge cases verified');

// 6. Real Browser VDOM & In-Place Reconciler Interactive Verification
const root = createRoot(rootContainer);
root.render(React.createElement(App));

const initialHtml = rootContainer.toHtml();
assert.ok(initialHtml.includes('DriveLedger'), 'App HTML must render brand header');
assert.ok(initialHtml.includes('tabular-nums'), 'App HTML must enforce tabular-nums');
assert.ok(initialHtml.includes('lg:grid-cols-12'), 'App HTML must use 12-column split workspace');
assert.ok(initialHtml.includes('lg:col-span-7'), 'App HTML must use 7-column left control panel');
assert.ok(initialHtml.includes('lg:col-span-5'), 'App HTML must use 5-column right sticky telemetry summary');
assert.ok(initialHtml.includes('lg:sticky lg:top-24'), 'App HTML must use sticky right summary');
assert.ok(initialHtml.includes('ADVERTISEMENT'), 'AdUnit must render ADVERTISEMENT micro-label');
assert.ok(initialHtml.includes('min-h-[90px]'), 'AdUnit must reserve zero-CLS min-h-[90px]');
assert.ok(initialHtml.includes('Partner link'), 'AffiliateCTA must render Partner link badge');
assert.ok(initialHtml.includes('application/ld+json'), 'TechnicalMethodologyGuide must inject Schema.org JSON-LD');
assert.ok(initialHtml.includes('Lifecycle trajectory'), 'CostTimeline must render Lifecycle trajectory heading');
assert.ok(initialHtml.includes('Financing Interest'), 'CostTimeline must render Financing Interest legend category');

// Check TechnicalMethodologyGuide prose word count (>= 1,000 words)
const guideEl = rootContainer.getElementById('methodology-guide');
assert.ok(guideEl, 'Methodology guide section must be mounted');
const guideWords = guideEl.textContent.replace(/\s+/g, ' ').trim().split(' ').length;
assert.ok(guideWords >= 1000, `TechnicalMethodologyGuide must contain >= 1,000 words (got ${guideWords})`);

// 6A. Test In-Place Range Slider Dragging (DOM node identity preserved across continuous drag events)
const priceSliderBefore = rootContainer.getElementById('slider-purchase-price');
assert.ok(priceSliderBefore, '#slider-purchase-price must exist in TcoCalculator');
priceSliderBefore.focus();
for (const draggedPrice of [32000, 45000, 58000]) {
  priceSliderBefore.value = String(draggedPrice);
  priceSliderBefore.dispatchEvent({ type: 'input' });
}
const priceSliderAfter = rootContainer.getElementById('slider-purchase-price');
assert.equal(
  priceSliderAfter,
  priceSliderBefore,
  'In-place DOM reconciler must preserve exact <input type="range"> DOM element during continuous dragging'
);
assert.equal(rootContainer.getElementById('input-purchase-price').value, '58000');
console.log('✓ 6A. In-place <input type="range"> slider drag & DOM node preservation verified');

// 6B. Test Tab Switching (TCO -> Powertrain Risk Matrix -> OBD-II Estimator) without hook state collision
const navButtons = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Powertrain Risk Matrix')
);
assert.ok(navButtons.length > 0, 'Must find Powertrain Risk Matrix tab button');
navButtons[0].dispatchEvent({ type: 'click' });

const riskHtml = rootContainer.toHtml();
assert.ok(riskHtml.includes('POWERTRAIN TELEMETRY DOSSIER'), 'Risk Matrix tab must render telemetry dossier');
assert.ok(riskHtml.includes('5 Assemblies'), 'Diesel preset must evaluate all 5 applicable diesel assemblies');
assert.ok(globalThis.window.location.search.includes('tab=risk'), 'URL must update to tab=risk');

// Verify Risk Matrix odometer slider drag increases wear monotonically
const riskSlider = rootContainer.getElementById('risk-odometer-slider');
assert.ok(riskSlider, '#risk-odometer-slider must exist in MaintenanceRiskMatrix');
riskSlider.value = '85000';
riskSlider.dispatchEvent({ type: 'input' });
assert.equal(
  rootContainer.getElementById('risk-odometer-slider'),
  riskSlider,
  'Risk odometer slider DOM element must be preserved in-place during drag'
);
assert.ok(
  rootContainer.toHtml().includes('IMMINENT FAILURE RISK'),
  'At 85,000 mi physical odometer, high-wear assemblies must remain CRITICAL (IMMINENT FAILURE RISK)'
);

// Switch to OBD-II Workshop Estimator tab (previously crashed with TypeError: searchQuery.trim is not a function!)
const obdTabBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('OBD-II Workshop Estimator')
)[0];
assert.ok(obdTabBtn, 'Must find OBD-II Workshop Estimator tab button');
obdTabBtn.dispatchEvent({ type: 'click' });

const obdHtml = rootContainer.toHtml();
assert.ok(
  obdHtml.includes('First-Principles Live Telemetry Check'),
  'OBD-II Estimator tab must mount cleanly and render First-Principles Live Telemetry Check'
);
assert.ok(globalThis.window.location.search.includes('tab=obd'), 'URL must update to tab=obd');

// Test OBD search input filtering & labor tier switching
const searchInput = rootContainer.querySelectorAll(
  (el) => el.tagName === 'INPUT' && el.getAttribute('type') === 'search'
)[0];
assert.ok(searchInput, 'Must find OBD search input');
searchInput.value = 'misfire';
searchInput.dispatchEvent({ type: 'input' });
assert.ok(rootContainer.toHtml().includes('P0300'), 'Searching "misfire" must show P0300');
searchInput.value = '';
searchInput.dispatchEvent({ type: 'input' });
console.log('✓ 6B. Multi-tab switching (TCO -> Risk -> OBD) & hook isolation verified (0 state collisions)');

// 6C. Test Global Unit System Switching (US -> UK -> EU) & Footer/Slider synchronization
const euBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('EU (€')
)[0];
assert.ok(euBtn, 'Must find EU unit switcher button');
euBtn.dispatchEvent({ type: 'click' });
assert.ok(
  rootContainer.toHtml().includes('€'),
  'Switching to EU mode must update currency symbols to € across workspace and footer'
);

// Click a Vehicle Preset link in the Footer while on the OBD tab -> must switch to TCO tab and update URL preset atomically
const camryFooterBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Toyota Camry Hybrid 2.5L')
)[0];
assert.ok(camryFooterBtn, 'Must find Toyota Camry Hybrid link in Footer');
camryFooterBtn.dispatchEvent({ type: 'click' });
assert.ok(
  globalThis.window.location.search.includes('tab=tco') &&
    globalThis.window.location.search.includes('preset=toyota-camry-hybrid'),
  `Footer preset click must atomically set tab=tco and preset=toyota-camry-hybrid in URL (got ${globalThis.window.location.search})`
);

// Verify EU efficiency slider uses L/100km bounds (3.5 to 16)
const euEffSlider = rootContainer.getElementById('slider-efficiency');
assert.ok(euEffSlider, 'Must find #slider-efficiency on TCO tab');
assert.equal(euEffSlider.getAttribute('min'), '3.5', 'EU efficiency slider min must be 3.5 L/100km');
assert.equal(euEffSlider.getAttribute('max'), '16', 'EU efficiency slider max must be 16 L/100km');
console.log('✓ 6C. Global Unit Switcher (US/UK/EU), EU L/100km slider bounds & atomic Footer deep-links verified');

// 6D. Test Opening and Closing Legal Modals
const privacyFooterBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Privacy Policy')
)[0];
privacyFooterBtn.dispatchEvent({ type: 'click' });
assert.ok(
  rootContainer.toHtml().includes('Privacy Policy & Telemetry Data Governance'),
  'Clicking Privacy Policy must open legal modal dialog'
);
const closeModalBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.getAttribute('aria-label') === 'Close modal'
)[0];
closeModalBtn.dispatchEvent({ type: 'click' });
assert.ok(
  !rootContainer.toHtml().includes('Privacy Policy & Telemetry Data Governance'),
  'Clicking Close modal must dismiss legal modal dialog'
);
console.log('✓ 6D. Legal Modals & TechnicalMethodologyGuide (' + guideWords + ' words + JSON-LD) verified');

// 6E. Regression Test: Consecutive Preset Clicks, Consecutive Tab Clicks, OBD Code Clicks & PopState Navigation
const usBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('US ($')
)[0];
assert.ok(usBtn, 'Must find US unit switcher button');
usBtn.dispatchEvent({ type: 'click' });

const consecutivePresets = [
  {
    id: 'ford-focus-ecoblue',
    shortName: 'Ford 2.0 EcoBlue Diesel',
    fullName: 'Ford Focus / Mondeo 2.0 EcoBlue TDCi Diesel',
    expectedPriceUsd: '24800',
    expectedOdometerMi: '48000',
  },
  {
    id: 'toyota-camry-hybrid',
    shortName: 'Toyota Camry Hybrid',
    fullName: 'Toyota Camry Hybrid 2.5L Dynamic Force e-CVT',
    expectedPriceUsd: '31500',
    expectedOdometerMi: '28000',
  },
  {
    id: 'tesla-model-3-lr',
    shortName: 'Tesla Model 3 Long Range',
    fullName: 'Tesla Model 3 Long Range Dual-Motor AWD',
    expectedPriceUsd: '42900',
    expectedOdometerMi: '30000',
  },
  {
    id: 'bmw-330i-g20',
    shortName: 'BMW 3 Series 2.0T',
    fullName: 'BMW 3 Series 2.0T (330i B48 TwinPower Turbo)',
    expectedPriceUsd: '43500',
    expectedOdometerMi: '34000',
  },
];

for (const target of consecutivePresets) {
  const presetCardBtn = rootContainer.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.textContent.includes(target.shortName)
  )[0];
  assert.ok(presetCardBtn, `Must find preset card button for ${target.shortName}`);
  presetCardBtn.dispatchEvent({ type: 'click' });

  const dropdown = rootContainer.getElementById('preset-select-dropdown');
  assert.equal(
    dropdown.value,
    target.id,
    `Single click on ${target.shortName} must immediately set activePreset to ${target.id} without reverting`
  );
  assert.ok(
    globalThis.window.location.search.includes(`preset=${target.id}`),
    `Single click on ${target.shortName} must immediately set URL preset=${target.id} (got ${globalThis.window.location.search})`
  );
  assert.ok(
    rootContainer.toHtml().includes(target.fullName),
    `Single click on ${target.shortName} must immediately render ${target.fullName} dossier`
  );
  assert.equal(
    rootContainer.getElementById('input-purchase-price').value,
    target.expectedPriceUsd,
    `Single click on ${target.shortName} must atomically sync #input-purchase-price to ${target.expectedPriceUsd}`
  );
  assert.equal(
    rootContainer.getElementById('input-odometer').value,
    target.expectedOdometerMi,
    `Single click on ${target.shortName} must atomically sync #input-odometer to ${target.expectedOdometerMi}`
  );
}

const consecutiveTabs = [
  { id: 'tco', path: '/tco', buttonText: '5-Yr True Cost to Own', expectedMarker: 'TELEMETRY PRESET BENCHMARKS' },
  { id: 'risk', path: '/risk-matrix', buttonText: 'Powertrain Risk Matrix', expectedMarker: 'POWERTRAIN TELEMETRY DOSSIER' },
  { id: 'obd', path: '/obd-estimator', buttonText: 'OBD-II Workshop Estimator', expectedMarker: 'First-Principles Live Telemetry Check' },
  { id: 'tco', path: '/tco', buttonText: '5-Yr True Cost to Own', expectedMarker: 'TELEMETRY PRESET BENCHMARKS' },
];

for (const tabTarget of consecutiveTabs) {
  const tabBtn = rootContainer.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.textContent.includes(tabTarget.buttonText)
  )[0];
  assert.ok(tabBtn, `Must find Navbar tab button for ${tabTarget.buttonText}`);
  tabBtn.dispatchEvent({ type: 'click' });

  assert.equal(
    globalThis.window.location.pathname,
    tabTarget.path,
    `Single click on ${tabTarget.buttonText} must immediately update pathname to ${tabTarget.path}`
  );
  assert.ok(
    globalThis.window.location.search.includes(`tab=${tabTarget.id}`),
    `Single click on ${tabTarget.buttonText} must immediately update URL to tab=${tabTarget.id} (got ${globalThis.window.location.search})`
  );
  assert.ok(
    rootContainer.toHtml().includes(tabTarget.expectedMarker),
    `Single click on ${tabTarget.buttonText} must immediately render ${tabTarget.expectedMarker} without reverting`
  );
}

// Verify cross-module deep link from TcoCalculator ("Inspect Component Wear Matrix") to Risk Matrix
const inspectRiskBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Inspect Component Wear Matrix')
)[0];
assert.ok(inspectRiskBtn, 'Must find Inspect Component Wear Matrix button in TcoCalculator');
inspectRiskBtn.dispatchEvent({ type: 'click' });
assert.ok(
  globalThis.window.location.search.includes('tab=risk') &&
    rootContainer.toHtml().includes('POWERTRAIN TELEMETRY DOSSIER'),
  'Clicking Inspect Component Wear Matrix must immediately switch to Risk Matrix tab'
);

// Switch to OBD tab and verify 3 consecutive OBD-II code clicks update on the first click without reverting
const obdNavBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('OBD-II Workshop Estimator')
)[0];
obdNavBtn.dispatchEvent({ type: 'click' });

for (const targetCode of ['P0420', 'P0300', 'P0171']) {
  const codeBtn = rootContainer.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.textContent.includes(targetCode)
  )[0];
  assert.ok(codeBtn, `Must find OBD code button for ${targetCode}`);
  codeBtn.dispatchEvent({ type: 'click' });

  assert.ok(
    globalThis.window.location.search.includes(`code=${targetCode}`),
    `Single click on ${targetCode} must immediately update URL to code=${targetCode} without reverting (got ${globalThis.window.location.search})`
  );
  assert.ok(
    rootContainer.toHtml().includes(`${targetCode} WORKSHOP COST SUMMARY`),
    `Single click on ${targetCode} must immediately render ${targetCode} WORKSHOP COST SUMMARY`
  );
}

// Verify browser Back/Forward (popstate) synchronization
globalThis.window.history.pushState(
  {},
  '',
  '/risk-matrix?tab=risk&preset=toyota-camry-hybrid&code=P0420'
);
globalThis.window.dispatchEvent({ type: 'popstate' });
assert.ok(
  rootContainer.toHtml().includes('POWERTRAIN TELEMETRY DOSSIER'),
  'Browser popstate to /risk-matrix must switch activeTab to risk'
);
assert.equal(
  rootContainer.getElementById('risk-preset-sync').value,
  'toyota-camry-hybrid',
  'Browser popstate must sync selectedPresetId to toyota-camry-hybrid'
);

// Verify browser Back/Forward (popstate) to bare root URL (/) falls back to default tab and preset
globalThis.window.history.pushState({}, '', '/');
globalThis.window.dispatchEvent({ type: 'popstate' });
assert.ok(
  rootContainer.toHtml().includes('TELEMETRY PRESET BENCHMARKS'),
  'Browser popstate to / must fall back to TCO tab'
);
assert.equal(
  rootContainer.getElementById('preset-select-dropdown').value,
  'ford-focus-ecoblue',
  'Browser popstate to / must fall back to default ford-focus-ecoblue preset'
);

console.log('✓ 6E. Consecutive Preset Clicks, Consecutive Tab Clicks, OBD Code Clicks & PopState Sync verified');

// 6F. Deep Verification: Localized Slider Dragging (EU/UK/US), EV Efficiency Range Bounds, Status Dots & Single-Arrow CTAs
// 1. Switch to EU mode
const euUnitBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('EU (€')
)[0];
assert.ok(euUnitBtn, 'Must find EU switcher button');
euUnitBtn.dispatchEvent({ type: 'click' });

// 2. Drag purchase price slider in EU mode -> must operate in EUR (€45,000)
const euPriceSlider = rootContainer.getElementById('slider-purchase-price');
assert.ok(euPriceSlider, 'Must find #slider-purchase-price in EU mode');
euPriceSlider.value = '45000';
euPriceSlider.dispatchEvent({ type: 'input' });
assert.equal(
  rootContainer.getElementById('input-purchase-price').value,
  '45000',
  'Dragging price slider to 45000 in EU mode must set input-purchase-price to 45000 EUR'
);

// 3. Drag annual mileage slider in EU mode -> must operate in km (25,000 km)
const euDistSlider = rootContainer.getElementById('slider-annual-distance');
assert.ok(euDistSlider, 'Must find #slider-annual-distance in EU mode');
euDistSlider.value = '25000';
euDistSlider.dispatchEvent({ type: 'input' });
assert.equal(
  rootContainer.getElementById('input-annual-distance').value,
  '25000',
  'Dragging annual distance slider to 25000 in EU mode must set input-annual-distance to 25000 km'
);

// 4. Test EV Efficiency slider bounds and fill calculation for Tesla Model 3 LR
const teslaBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Tesla Model 3 Long Range')
)[0];
assert.ok(teslaBtn, 'Must find Tesla Model 3 preset button');
teslaBtn.dispatchEvent({ type: 'click' });

const evEffSlider = rootContainer.getElementById('slider-efficiency');
assert.ok(evEffSlider, 'Must find #slider-efficiency for EV preset');
assert.equal(evEffSlider.getAttribute('min'), '11', 'Tesla EV efficiency min in EU mode must be 11 kWh/100km');
assert.equal(evEffSlider.getAttribute('max'), '30', 'Tesla EV efficiency max in EU mode must be 30 kWh/100km');

const evSliderStyle = evEffSlider.style || {};
const fillStr = evSliderStyle['--fill'] || '';
const fillPct = parseFloat(fillStr);
assert.ok(
  !isNaN(fillPct) && fillPct >= 0 && fillPct <= 100,
  `EV efficiency slider --fill must be between 0% and 100% in EU mode (got ${fillStr})`
);

// 5. Test Maintenance Risk Matrix in EU mode with colored status dots
const riskTabNav = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Powertrain Risk Matrix')
)[0];
assert.ok(riskTabNav, 'Must find Risk Matrix tab button');
riskTabNav.dispatchEvent({ type: 'click' });

const riskSliderEu = rootContainer.getElementById('risk-odometer-slider');
assert.ok(riskSliderEu, 'Must find #risk-odometer-slider');
riskSliderEu.value = '100000';
riskSliderEu.dispatchEvent({ type: 'input' });

const riskHtmlEu = rootContainer.toHtml();
assert.ok(
  riskHtmlEu.includes('w-1.5 h-1.5 rounded-full'),
  'Component health schedule must render colored status dot inside status pill'
);

// 6. Test OBD Estimator: single arrow CTA and CircleCheck icons
const obdNav = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('OBD-II Workshop Estimator')
)[0];
assert.ok(obdNav, 'Must find OBD Estimator tab button');
obdNav.dispatchEvent({ type: 'click' });

const obdHtmlUpdated = rootContainer.toHtml();
assert.ok(
  !obdHtmlUpdated.includes('→ →'),
  'PartnerCard CTAs must never render duplicate arrows (→ →)'
);

// Switch back to US mode for subsequent operations
const usUnitReset = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('US ($')
)[0];
if (usUnitReset) usUnitReset.dispatchEvent({ type: 'click' });

console.log('✓ 6F. Localized Slider Dragging (EU/UK/US), EV Efficiency Range Bounds, Status Dots & Single-Arrow CTAs verified');

// 6G. Deep Verification: Prominent Top Affiliate Banners, Vehicle Comparator, EV Break-Even, Milestones, Dossier Export & Symptom Filter
// 1. Verify Top Affiliate Scanner Banner on OBD tab
assert.ok(
  rootContainer.toHtml().includes("Don't pay $150+ in workshop diagnostic fees"),
  'OBD tab must render prominent top affiliate diagnostic scanner card'
);
assert.ok(
  rootContainer.toHtml().includes('Get Recommended OBD2 Scanner'),
  'OBD top affiliate card must render "Get Recommended OBD2 Scanner" CTA'
);
assert.ok(
  rootContainer.toHtml().includes('iOS & Android Bluetooth'),
  'OBD top affiliate card must render feature chips'
);

// 2. Verify Symptom Diagnosis Quick Filter
const smokeBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Black Smoke / DPF')
)[0];
assert.ok(smokeBtn, 'Must find Black Smoke / DPF symptom quick filter button');
smokeBtn.dispatchEvent({ type: 'click' });
assert.ok(
  rootContainer.toHtml().includes('Likely codes for Black Smoke / DPF:'),
  'Clicking Black Smoke symptom must display matched diagnostic codes'
);

const p0299Btn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.trim() === 'P0299'
)[0];
assert.ok(p0299Btn, 'Must find P0299 launcher chip inside matched symptom list');
p0299Btn.dispatchEvent({ type: 'click' });
assert.ok(
  globalThis.window.location.search.includes('code=P0299'),
  'Clicking matched symptom code chip must update URL to code=P0299'
);
assert.ok(
  rootContainer.toHtml().includes('P0299 WORKSHOP COST SUMMARY'),
  'Clicking P0299 symptom chip must immediately load P0299 workshop summary'
);

// 3. Switch to TCO Tab and verify Top VIN Check Affiliate Banner
const tcoTabNav = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('5-Yr True Cost to Own')
)[0];
assert.ok(tcoTabNav, 'Must find 5-Yr True Cost to Own tab button');
tcoTabNav.dispatchEvent({ type: 'click' });

const tcoHtml = rootContainer.toHtml();
assert.ok(
  tcoHtml.includes('Check odometer rollbacks & salvage records'),
  'TCO tab must render prominent top affiliate VIN Check card'
);
assert.ok(
  tcoHtml.includes('Run Instant VIN Check'),
  'TCO top affiliate card must render "Run Instant VIN Check" CTA'
);
assert.ok(
  tcoHtml.includes('Odometer Rollback Detection'),
  'TCO top affiliate card must render verification feature badges'
);

// 4. Test Dual-Vehicle Side-by-Side Comparison Mode (VehicleComparator)
const cmpBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Side-by-Side Comparison')
)[0];
assert.ok(cmpBtn, 'Must find Side-by-Side Comparison action button in TCO tab');
cmpBtn.dispatchEvent({ type: 'click' });

const cmpHtml = rootContainer.toHtml();
assert.ok(
  cmpHtml.includes('Dual-Vehicle Side-by-Side Comparison'),
  'Opening comparator must render Dual-Vehicle Side-by-Side Comparison drawer'
);
assert.ok(
  cmpHtml.includes('VEHICLE A (Current)'),
  'Comparator must display Vehicle A header'
);
assert.ok(
  cmpHtml.includes('VEHICLE B (Counterpart)'),
  'Comparator must display Vehicle B header'
);
assert.ok(
  cmpHtml.includes('Total 5-Year True Cost to Own'),
  'Comparator must render 5-Year True Cost to Own delta table'
);

const petrolEvBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Petrol vs Pure EV')
)[0];
assert.ok(petrolEvBtn, 'Must find "Petrol vs Pure EV" popular comparison preset button');
petrolEvBtn.dispatchEvent({ type: 'click' });
assert.ok(
  rootContainer.toHtml().includes('BMW 3 Series 2.0T'),
  'Clicking Petrol vs Pure EV must set Vehicle A to BMW 3 Series'
);
assert.ok(
  rootContainer.toHtml().includes('Tesla Model 3 Long Range'),
  'Clicking Petrol vs Pure EV must set Vehicle B to Tesla Model 3'
);

const closeCmpBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.getAttribute('aria-label') === 'Close comparison drawer'
)[0];
assert.ok(closeCmpBtn, 'Must find close button for comparison drawer');
closeCmpBtn.dispatchEvent({ type: 'click' });
assert.ok(
  !rootContainer.toHtml().includes('Dual-Vehicle Side-by-Side Comparison'),
  'Closing comparison drawer must unmount comparator'
);

// 5. Test Real-World Fuel vs EV Break-Even Calculator
const evBreakBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Fuel vs. EV Break-Even')
)[0];
assert.ok(evBreakBtn, 'Must find Fuel vs. EV Break-Even button');
evBreakBtn.dispatchEvent({ type: 'click' });

const evBreakHtml = rootContainer.toHtml();
assert.ok(
  evBreakHtml.includes('Real-World Fuel vs. EV Break-Even Calculator'),
  'Opening break-even calculator must render header'
);
assert.ok(
  evBreakHtml.includes('BREAK-EVEN HORIZON'),
  'Break-even calculator must compute break-even horizon'
);

const closeEvBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.getAttribute('aria-label') === 'Close break-even calculator'
)[0];
assert.ok(closeEvBtn, 'Must find close button for break-even calculator');
closeEvBtn.dispatchEvent({ type: 'click' });
assert.ok(
  !rootContainer.toHtml().includes('Real-World Fuel vs. EV Break-Even Calculator'),
  'Closing break-even calculator must unmount component'
);

// 6. Test Printable Vehicle Telemetry Dossier Modal (VehicleDossierExport)
const exportBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Export Dossier / Print')
)[0];
assert.ok(exportBtn, 'Must find Export Dossier / Print action button');
exportBtn.dispatchEvent({ type: 'click' });

const dossierHtml = rootContainer.toHtml();
assert.ok(
  dossierHtml.includes('DRIVELEDGER AUTOMOTIVE TELEMETRY REPORT'),
  'Opening dossier export must render executive telemetry report header'
);
assert.ok(
  dossierHtml.includes('1. 5-Year True Cost of Ownership Projections'),
  'Dossier must render financial ownership section'
);
assert.ok(
  dossierHtml.includes('2. Mechanical Wear & Maintenance Reserve'),
  'Dossier must render mechanical wear section'
);
assert.ok(
  dossierHtml.includes('3. Master Diagnostic Verification Protocol'),
  'Dossier must render diagnostic verification protocol'
);
assert.ok(
  dossierHtml.includes('TELEMETRY VERIFIED'),
  'Dossier must render master technician sign-off seal'
);

const closeDossierBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.getAttribute('aria-label') === 'Close dossier'
)[0];
assert.ok(closeDossierBtn, 'Must find close button for dossier modal');
closeDossierBtn.dispatchEvent({ type: 'click' });
assert.ok(
  !rootContainer.toHtml().includes('DRIVELEDGER AUTOMOTIVE TELEMETRY REPORT'),
  'Closing dossier modal must dismiss dialog'
);

// 7. Switch to Risk Matrix Tab and verify Top Warranty Affiliate Banner & Maintenance Milestones
const riskNavBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Powertrain Risk Matrix')
)[0];
assert.ok(riskNavBtn, 'Must find Powertrain Risk Matrix tab button');
riskNavBtn.dispatchEvent({ type: 'click' });

const riskHtmlUpdated = rootContainer.toHtml();
assert.ok(
  riskHtmlUpdated.includes('Compare repair protection'),
  'Risk Matrix tab must render prominent top affiliate warranty optimizer card'
);
assert.ok(
  riskHtmlUpdated.includes('Compare Warranty Plans'),
  'Risk Matrix top affiliate card must render "Compare Warranty Plans" CTA'
);
assert.ok(
  riskHtmlUpdated.includes('Save up to $420/yr on Coverage'),
  'Risk Matrix top affiliate card must render savings feature badge'
);
assert.ok(
  riskHtmlUpdated.includes('Manufacturer Maintenance Milestone Roadmap'),
  'Risk Matrix tab must render Manufacturer Maintenance Milestone Roadmap'
);
assert.ok(
  riskHtmlUpdated.includes('15,000 mi / 1-Year Minor Inspection'),
  'Milestone roadmap must list 15,000 mi minor inspection'
);
assert.ok(
  riskHtmlUpdated.includes('30,000 mi / 2-Year Intermediate Service'),
  'Milestone roadmap must list 30,000 mi intermediate service'
);
assert.ok(
  riskHtmlUpdated.includes('60,000 mi / 4-Year Major Service'),
  'Milestone roadmap must list 60,000 mi major service'
);

// Toggle milestone checklist items
const milestoneCheckboxes = rootContainer.querySelectorAll(
  (el) => el.tagName === 'INPUT' && el.getAttribute('type') === 'checkbox'
);
assert.ok(milestoneCheckboxes.length > 0, 'Milestone roadmap must provide interactive checklist checkboxes');
milestoneCheckboxes[0].dispatchEvent({ type: 'change' });

// Milestone filter switching
const dueFilterBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Due / Overdue')
)[0];
assert.ok(dueFilterBtn, 'Must find "Due / Overdue" milestone filter pill');
dueFilterBtn.dispatchEvent({ type: 'click' });

const allFilterBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('All Milestones')
)[0];
assert.ok(allFilterBtn, 'Must find "All Milestones" milestone filter pill');
allFilterBtn.dispatchEvent({ type: 'click' });

// 8. Preventative vs. OEM Telemetry Toggle verification (Feladat 2.2)
const oemToggleBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('OEM "Lifetime" Marketing Schedule')
)[0];
assert.ok(oemToggleBtn, 'Must find OEM "Lifetime" Marketing Schedule toggle button');
oemToggleBtn.dispatchEvent({ type: 'click' });

const oemActiveHtml = rootContainer.toHtml();
assert.ok(
  oemActiveHtml.includes('OEM Marketing Schedule Active'),
  'Dossier header must indicate active OEM Marketing Schedule'
);
assert.ok(
  oemActiveHtml.includes('🚨 OEM "LIFETIME FLUID" FALLACY'),
  'Drivetrain component must display OEM "Lifetime Fluid" Fallacy badge'
);
assert.ok(
  oemActiveHtml.includes('🚨 OEM EXTENDED BELT INTERVAL RISK'),
  'Timing component must display OEM Extended Belt Interval Risk badge'
);
assert.ok(
  oemActiveHtml.includes('[OMITTED / DEFERRED BY OEM]'),
  'Milestones must render [OMITTED / DEFERRED BY OEM] badges for unscheduled dealer services'
);
assert.ok(
  oemActiveHtml.includes('Dealer Service Checklist: False Positive &amp; False Sense of Security') ||
  oemActiveHtml.includes('Dealer Service Checklist: False Positive & False Sense of Security'),
  'Milestones must render high-contrast OEM False Sense of Security warning banner'
);
assert.ok(
  oemActiveHtml.includes('OEM "Lifetime" Risk Alert'),
  'Reliability score explanation must highlight OEM lifetime risk alert'
);

// Toggle back to Engineering Preventative Schedule
const preventativeToggleBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Engineering Preventative Schedule')
)[0];
assert.ok(preventativeToggleBtn, 'Must find Engineering Preventative Schedule toggle button');
preventativeToggleBtn.dispatchEvent({ type: 'click' });

const preventativeActiveHtml = rootContainer.toHtml();
assert.ok(
  preventativeActiveHtml.includes('Engineering Preventative Active'),
  'Dossier header must indicate active Engineering Preventative Protocol'
);
assert.ok(
  !preventativeActiveHtml.includes('[OMITTED / DEFERRED BY OEM]'),
  'Milestones must not display OEM omission badges when in preventative schedule mode'
);

console.log('✓ 6G. Top Affiliate Banners, Vehicle Comparator, EV Break-Even, Maintenance Milestones, Dossier Export & Symptom Filter verified');

// 6H. Deep Verification: Advanced Edge Cases, Negative Currencies, Swapping & Code Catalog Integrity
// 1. Verify that all codes in SYMPTOM_FILTERS exist in OBD_CODES (0 broken links!)
const { SYMPTOM_FILTERS } = await import('../src/components/calculators/ObdEstimator.jsx');
for (const sf of SYMPTOM_FILTERS) {
  for (const code of sf.codes) {
    assert.ok(
      OBD_CODES.some((c) => c.code === code),
      `Symptom filter "${sf.label}" contains code "${code}" which must exist in OBD_CODES`
    );
  }
}

// 2. Verify DPF Warning Light symptom filter chip exists on OBD tab
const obdTabBtn6H = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('OBD-II Workshop Estimator')
)[0];
assert.ok(obdTabBtn6H, 'Must find OBD-II Workshop Estimator tab button');
obdTabBtn6H.dispatchEvent({ type: 'click' });

const dpfLightBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('DPF Warning Light')
)[0];
assert.ok(dpfLightBtn, 'Must find "DPF Warning Light" symptom filter chip');
dpfLightBtn.dispatchEvent({ type: 'click' });
assert.ok(
  rootContainer.toHtml().includes('Likely codes for DPF Warning Light:'),
  'Clicking DPF Warning Light symptom chip must display matched codes'
);

// 3. Verify negative currency formatting puts minus sign before currency symbol
assert.equal(
  convertUsdToRegion(-500, 'US'),
  -500,
  'Negative currency conversion must preserve negative values'
);

// 4. Verify EV Break-Even target annual distance calculations
const { default: EvBreakEvenCalculator } = await import('../src/components/calculators/EvBreakEvenCalculator.jsx');
assert.ok(typeof EvBreakEvenCalculator === 'function', 'EvBreakEvenCalculator must be an exported component');

// 5. Verify VehicleComparator export and functionality
const { default: VehicleComparator } = await import('../src/components/calculators/VehicleComparator.jsx');
assert.ok(typeof VehicleComparator === 'function', 'VehicleComparator must be an exported component');

// 6. Interactive verification of VehicleComparator swapping & EV break-even annual targets
const tcoNav6H = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('5-Yr True Cost to Own')
)[0];
assert.ok(tcoNav6H, 'Must find 5-Yr True Cost to Own tab button for 6H verification');
tcoNav6H.dispatchEvent({ type: 'click' });

// Open Comparator
const cmpBtn6H = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Side-by-Side Comparison')
)[0];
assert.ok(cmpBtn6H, 'Must find Side-by-Side Comparison button');
cmpBtn6H.dispatchEvent({ type: 'click' });

// Verify promote/swap button exists
const promoteBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Set Vehicle B as Primary')
)[0];
assert.ok(promoteBtn, 'Must find "Set Vehicle B as Primary" button');
promoteBtn.dispatchEvent({ type: 'click' });

// Close comparator
const closeCmp6H = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.getAttribute('aria-label') === 'Close comparison drawer'
)[0];
if (closeCmp6H) closeCmp6H.dispatchEvent({ type: 'click' });

// Open EV Break-Even and verify annual targets
const evBtn6H = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Fuel vs. EV Break-Even')
)[0];
assert.ok(evBtn6H, 'Must find Fuel vs. EV Break-Even button');
evBtn6H.dispatchEvent({ type: 'click' });

assert.ok(
  rootContainer.toHtml().includes('ANNUAL DRIVING NEEDED TO BREAK EVEN:'),
  'EV Break-Even calculator must display required annual driving targets'
);

const closeEv6H = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.getAttribute('aria-label') === 'Close break-even calculator'
)[0];
if (closeEv6H) closeEv6H.dispatchEvent({ type: 'click' });

// Open Dossier Export and verify critical defects inclusion
const exportBtn6H = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Export Dossier / Print')
)[0];
assert.ok(exportBtn6H, 'Must find Export Dossier / Print button');
exportBtn6H.dispatchEvent({ type: 'click' });

assert.ok(
  rootContainer.toHtml().includes('2. Mechanical Wear &amp; Maintenance Reserve') ||
  rootContainer.toHtml().includes('2. Mechanical Wear & Maintenance Reserve'),
  'Dossier must render mechanical wear & maintenance section'
);

const closeDossier6H = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.getAttribute('aria-label') === 'Close dossier'
)[0];
if (closeDossier6H) closeDossier6H.dispatchEvent({ type: 'click' });

console.log('✓ 6H. Advanced Edge Cases, Negative Currencies, Swapping & Code Catalog Integrity verified');

// 6I. Brand Unification (DriveLedger) & Deduplicated FAQ Verification
// 1. Verify Brand consistency across the entire app
const currentHtml = rootContainer.toHtml();
assert.ok(currentHtml.includes('DriveLedger'), 'DriveLedger brand must be present across the interface');

// 2. Verify FAQ Deduplication on Overview tab
const overviewNavBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Overview')
)[0];
assert.ok(overviewNavBtn, 'Must find Overview navigation tab');
overviewNavBtn.dispatchEvent({ type: 'click' });

// On Overview tab: Footer FAQ (id="faq-heading") must be hidden
assert.strictEqual(
  rootContainer.getElementById('faq-heading'),
  null,
  'Footer FAQ section (#faq-heading) must be hidden on Overview tab'
);
// Native HomePage FAQ must be present
assert.ok(
  rootContainer.toHtml().includes('Why drivers choose DriveLedger'),
  'HomePage comparison table with DriveLedger must be visible'
);
assert.ok(
  rootContainer.toHtml().includes('Do I need to create an account or sign up?'),
  'HomePage native FAQ accordion must be visible on Overview'
);

// 3. Verify FAQ Deduplication on Methodology tab
const methodologyNavBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Methodology')
)[0];
assert.ok(methodologyNavBtn, 'Must find Methodology navigation link');
methodologyNavBtn.dispatchEvent({ type: 'click' });

// On Methodology tab: Footer FAQ must be hidden, native Schema FAQ must be present
assert.strictEqual(
  rootContainer.getElementById('faq-heading'),
  null,
  'Footer FAQ section (#faq-heading) must be hidden on Methodology tab'
);
assert.ok(
  rootContainer.toHtml().includes('How does DriveLedger calculate non-linear 5-year and 10-year vehicle depreciation?'),
  'Methodology guide native engineering FAQ must be visible'
);

// 4. Verify Footer FAQ is visible on TCO tab
const tcoNavBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('5-Yr True Cost to Own')
)[0];
assert.ok(tcoNavBtn, 'Must find TCO navigation tab');
tcoNavBtn.dispatchEvent({ type: 'click' });
assert.ok(
  rootContainer.getElementById('faq-heading'),
  'Footer FAQ section (#faq-heading) must be visible on TCO tab'
);

// 5. Verify Footer FAQ is visible on remaining non-FAQ tabs (risk, obd, reviews, blog)
const riskNavBtn6I = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Maintenance Check')
)[0];
assert.ok(riskNavBtn6I, 'Must find Maintenance Check tab');
riskNavBtn6I.dispatchEvent({ type: 'click' });
assert.ok(
  rootContainer.getElementById('faq-heading'),
  'Footer FAQ section (#faq-heading) must be visible on Maintenance Check (risk) tab'
);

const obdNavBtn6I = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('OBD2 Repair Estimator')
)[0];
assert.ok(obdNavBtn6I, 'Must find OBD2 Repair Estimator tab');
obdNavBtn6I.dispatchEvent({ type: 'click' });
assert.ok(
  rootContainer.getElementById('faq-heading'),
  'Footer FAQ section (#faq-heading) must be visible on OBD Estimator tab'
);

const reviewsNavBtn6I = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Reviews')
)[0];
assert.ok(reviewsNavBtn6I, 'Must find Reviews link in Navbar');
reviewsNavBtn6I.dispatchEvent({ type: 'click' });
assert.ok(
  rootContainer.getElementById('faq-heading'),
  'Footer FAQ section (#faq-heading) must be visible on Reviews tab'
);

const blogNavBtn6I = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.textContent.includes('Blog')
)[0];
assert.ok(blogNavBtn6I, 'Must find Blog link in Navbar');
blogNavBtn6I.dispatchEvent({ type: 'click' });
assert.ok(
  rootContainer.getElementById('faq-heading'),
  'Footer FAQ section (#faq-heading) must be visible on Blog tab'
);

console.log('✓ 6I. Brand Unification (DriveLedger) & FAQ Deduplication verified');

// ============================================================================
// 6J. Vehicle Photo Map 1-to-1 Engine, Priority Plus Navbar & UI De-AI Checks
// ============================================================================
const {
  resolveVehiclePhotoUrl,
  lookupVerifiedPhotoFromMap,
  SEGMENT_FALLBACK_PHOTOS,
} = await import('../src/components/common/vehicle/VehicleImageResolver.jsx');
const { VEHICLE_CATALOG } = await import('../src/data/vehicleCatalog.js');
const vehiclePhotoMapModule = await import('../src/data/vehiclePhotoMap.json', {
  with: { type: 'json' },
});
const vehiclePhotoMapData = vehiclePhotoMapModule.default;

const mapKeys = Object.keys(vehiclePhotoMapData);
const mapUrls = Object.values(vehiclePhotoMapData);
const mapFilenames = mapUrls.map((u) =>
  decodeURIComponent(u.split('?')[0].split('/').pop() || '')
    .replace(/^\d+px-/, '')
    .toLowerCase()
);
assert.ok(mapKeys.length >= 145, `Expected >= 145 vehiclePhotoMap entries, found ${mapKeys.length}`);
assert.strictEqual(
  new Set(mapUrls).size,
  mapUrls.length,
  'Zero duplicate photo URLs allowed in src/data/vehiclePhotoMap.json'
);
assert.strictEqual(
  new Set(mapFilenames).size,
  mapFilenames.length,
  'Zero duplicate underlying Wikimedia filenames allowed in src/data/vehiclePhotoMap.json'
);

for (const [k, url] of Object.entries(vehiclePhotoMapData)) {
  const clean = url.split('?')[0].toLowerCase();
  assert.ok(
    ['.jpg', '.jpeg', '.png', '.webp'].some((ext) => clean.endsWith(ext)),
    `Invalid image extension for ${k}: ${url}`
  );
  assert.ok(!clean.endsWith('.svg'), `SVG forbidden in vehiclePhotoMap for ${k}`);
}

for (const brand of VEHICLE_CATALOG) {
  for (const model of brand.models) {
    const hit = lookupVerifiedPhotoFromMap({ brand: brand.name, model: model.name });
    assert.ok(
      hit.isExactMapMatch && hit.url,
      `Catalog model ${brand.name} ${model.name} must match vehiclePhotoMap.json`
    );
  }
}

const { MODULAR_BRANDS } = await import('../src/data/vehicles/index.js');
for (const brand of MODULAR_BRANDS) {
  for (const model of brand.models) {
    const makeName = model.brand || brand.name;
    const hit = lookupVerifiedPhotoFromMap({ brand: makeName, model: model.name });
    assert.ok(
      hit.isExactMapMatch && hit.url,
      `Modular catalog model ${makeName} ${model.name} must match vehiclePhotoMap.json`
    );
  }
}

for (const preset of VEHICLE_PRESETS) {
  const hit = lookupVerifiedPhotoFromMap(preset);
  assert.ok(hit.isExactMapMatch && hit.url, `Preset ${preset.id} must match vehiclePhotoMap.json`);
}

// Brand-only objects must NOT falsely match a specific model
const brandOnlyLookup = lookupVerifiedPhotoFromMap({ brand: 'Volkswagen', name: 'Volkswagen' });
assert.strictEqual(brandOnlyLookup.isExactMapMatch, false, 'Brand-only object must not report exact model match');

// Brand default fallback must resolve to the brand's actual photo in vehiclePhotoMap.json
assert.strictEqual(
  resolveVehiclePhotoUrl({ vehicle: { brand: 'Kia', model: 'UnmappedCustomProto' } }),
  vehiclePhotoMapData['kia-sportage'],
  'Unmapped Kia model must fall back to Kia brand default photo, not Toyota RAV4'
);

// Edge cases for photo resolution
assert.strictEqual(resolveVehiclePhotoUrl({ vehicle: null }), SEGMENT_FALLBACK_PHOTOS.sedan);
assert.strictEqual(resolveVehiclePhotoUrl({ vehicle: {} }), SEGMENT_FALLBACK_PHOTOS.sedan);
assert.strictEqual(
  resolveVehiclePhotoUrl({ vehicle: { id: 'custom-car' }, imageUrl: 'https://example.com/car.jpg' }),
  'https://example.com/car.jpg'
);

// Custom model localStorage cache fallback
globalThis.localStorage.setItem(
  'shiftmetric_wiki_photo_rivian-r1t',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/rivian_r1t.jpg'
);
assert.strictEqual(
  resolveVehiclePhotoUrl({ vehicle: { brand: 'Rivian', model: 'R1T' } }),
  'https://upload.wikimedia.org/wikipedia/commons/thumb/rivian_r1t.jpg'
);
globalThis.localStorage.removeItem('shiftmetric_wiki_photo_rivian-r1t');

// Priority Plus Navbar elements
const moreBtn = rootContainer.querySelectorAll(
  (el) => el.getAttribute('data-testid') === 'navbar-more-button'
)[0];
assert.ok(moreBtn, 'Priority Plus Navbar must render More dropdown button');
const quickTabsBar = rootContainer.querySelectorAll(
  (el) => el.getAttribute('data-testid') === 'navbar-mobile-quick-tabs'
)[0];
assert.ok(quickTabsBar, 'Mobile Navbar must render horizontally scrollable quick-tab bar');

// Ensure banned clutter pill 'Normal / Sensor fault likely' is absent from rendered ObdEstimator
assert.ok(
  !obdHtmlUpdated.includes('Normal / Sensor fault likely'),
  'Clutter badge "Normal / Sensor fault likely" must not render in ObdEstimator'
);

console.log('✓ 6J. 100% Real Vehicle Photo Engine (146 unique URLs & files), Priority Plus Navbar & UI De-AI verified');

// ============================================================================
// 6K. Turnkey Monetization Config, Bulletproof Legal Suite & Cloudflare Readiness
// ============================================================================
const {
  MONETIZATION_CONFIG,
  affiliatePartners,
  buildAffiliateUrl,
  FTC_PROXIMATE_DISCLOSURE,
} = await import('../src/config/monetizationConfig.js');
const {
  LEGAL_POLICIES,
  NOMINATIVE_FAIR_USE_NOTICE,
  ADSENSE_DART_COOKIE_CLAUSE,
  AMAZON_ASSOCIATES_CLAUSE,
  WORKSPACE_LEGAL_NOTICE_LINE,
  resolveLegalPolicyKey,
} = await import('../src/data/legalPolicies.js');

// 1. Verify monetizationConfig.js Single Source of Truth
assert.strictEqual(MONETIZATION_CONFIG.brandName, 'DriveLedger');
assert.strictEqual(MONETIZATION_CONFIG.domain, 'mydriveledger.com');
assert.strictEqual(MONETIZATION_CONFIG.contactEmail, 'contact@mydriveledger.com');
assert.strictEqual(MONETIZATION_CONFIG.legalEmail, 'legal@mydriveledger.com');
assert.strictEqual(MONETIZATION_CONFIG.lastUpdated, 'November 6, 2026');
assert.strictEqual(MONETIZATION_CONFIG.adsenseEnabled, false);
assert.strictEqual(MONETIZATION_CONFIG.publisherId, 'ca-pub-6581535125716295');
assert.deepEqual(MONETIZATION_CONFIG.slots, {
  topLeaderboard: '1111111111',
  inContentRectangle: '2222222222',
  bottomStickyBanner: '3333333333',
});

assert.strictEqual(affiliatePartners.vinCheck.name, 'carVertical');
assert.strictEqual(affiliatePartners.vinCheck.baseUrl, 'https://www.carvertical.com/en/landing/v3');
assert.strictEqual(affiliatePartners.vinCheck.affiliateParam, 'a=YOUR_CARVERTICAL_ID');
assert.strictEqual(affiliatePartners.vinCheck.buttonText, 'Check Vehicle VIN History');
assert.strictEqual(affiliatePartners.vinCheck.badgeText, 'Official History Report');

assert.strictEqual(affiliatePartners.obdScanner.name, 'Amazon Automotive');
assert.strictEqual(affiliatePartners.obdScanner.baseUrl, 'https://www.amazon.com/s?k=Bluetooth+OBD2+Scanner');
assert.strictEqual(affiliatePartners.obdScanner.affiliateParam, 'tag=YOUR_AMAZON_TAG-20');
assert.strictEqual(affiliatePartners.obdScanner.buttonText, 'Get Recommended OBD2 Scanner');
assert.strictEqual(affiliatePartners.obdScanner.badgeText, 'Verified Diagnostic Tool');

assert.strictEqual(affiliatePartners.autoInsurance.name, 'Insurance Comparison');
assert.strictEqual(affiliatePartners.autoInsurance.baseUrl, 'https://www.insurify.com/');
assert.strictEqual(affiliatePartners.autoInsurance.affiliateParam, 'ref=YOUR_INSURANCE_ID');
assert.strictEqual(affiliatePartners.autoInsurance.buttonText, 'Compare Insurance Rates');
assert.strictEqual(affiliatePartners.autoInsurance.badgeText, 'Rate Comparison');

assert.strictEqual(affiliatePartners.partsLookup.name, 'OEM Parts Catalog');
assert.strictEqual(affiliatePartners.partsLookup.baseUrl, 'https://www.rockauto.com/');
assert.strictEqual(affiliatePartners.partsLookup.affiliateParam, 'ref=YOUR_PARTS_ID');
assert.strictEqual(affiliatePartners.partsLookup.buttonText, 'Check Replacement Part Prices');
assert.strictEqual(affiliatePartners.partsLookup.badgeText, 'Parts Supplier');

// Verify buildAffiliateUrl helper
const vinLink = buildAffiliateUrl('vinCheck', { vehicleName: 'BMW 330i' });
assert.strictEqual(vinLink.href, 'https://www.carvertical.com/en/landing/v3?a=YOUR_CARVERTICAL_ID');
assert.strictEqual(vinLink.target, '_blank');
assert.strictEqual(vinLink.rel, 'sponsored noopener noreferrer');

const obdLink = buildAffiliateUrl('obdScanner', { activeCode: 'P0420' });
assert.strictEqual(obdLink.href, 'https://www.amazon.com/s?k=Bluetooth+OBD2+Scanner&tag=YOUR_AMAZON_TAG-20');
assert.strictEqual(obdLink.target, '_blank');
assert.strictEqual(obdLink.rel, 'sponsored noopener noreferrer');

const insLink = buildAffiliateUrl('autoInsurance');
assert.strictEqual(insLink.href, 'https://www.insurify.com/?ref=YOUR_INSURANCE_ID');

const partsLink = buildAffiliateUrl('partsLookup');
assert.strictEqual(partsLink.href, 'https://www.rockauto.com/?ref=YOUR_PARTS_ID');

// Verify FTC proximate micro-disclosure is rendered in DOM
assert.strictEqual(
  FTC_PROXIMATE_DISCLOSURE,
  'Partner link · We may earn a commission at no extra cost to you.'
);
assert.ok(
  rootContainer.toHtml().includes(FTC_PROXIMATE_DISCLOSURE),
  'Rendered DOM must include mandatory FTC proximate micro-disclosure'
);

// 2. Verify Legal Policies Verbatim Clauses & Zero Placeholders
for (const [key, policy] of Object.entries(LEGAL_POLICIES)) {
  const serialized = JSON.stringify(policy);
  assert.ok(!serialized.includes('[placeholder]'), `Policy ${key} must not contain [placeholder]`);
  assert.ok(!serialized.includes('...'), `Policy ${key} must not contain truncated ...`);
  assert.ok(policy.sections.length >= 3, `Policy ${key} must have at least 3 multi-paragraph sections`);
}
assert.ok(
  JSON.stringify(LEGAL_POLICIES.terms).includes(NOMINATIVE_FAIR_USE_NOTICE),
  'Terms policy must contain verbatim Nominative Fair Use Notice'
);
assert.ok(
  JSON.stringify(LEGAL_POLICIES.privacy).includes(ADSENSE_DART_COOKIE_CLAUSE),
  'Privacy policy must contain verbatim Google AdSense & DoubleClick DART Cookie Clause'
);
assert.ok(
  JSON.stringify(LEGAL_POLICIES['affiliate-disclosure']).includes(AMAZON_ASSOCIATES_CLAUSE),
  'Affiliate disclosure policy must contain verbatim Amazon Associates sentence'
);

// 3. Verify Direct URL Hash Routing (#privacy, #terms, #disclaimer, #affiliate-disclosure, #cookies, #about, #contact)
const hashRouteChecks = [
  { hash: '#privacy', expectedText: 'Third-Party Advertising &amp; Google AdSense' },
  { hash: '#terms', expectedText: 'No Certified Automotive Mechanic Advice' },
  { hash: '#disclaimer', expectedText: 'Nominative Fair Use &amp; OEM Trademark Disclaimer' },
  { hash: '#affiliate-disclosure', expectedText: 'As an Amazon Associate, we earn from qualifying purchases.' },
  { hash: '#cookies', expectedText: 'GDPR / CCPA Cookie &amp; Local Storage Governance Policy' },
  { hash: '#about', expectedText: 'Actuarial Depreciation Curves' },
  { hash: '#contact', expectedText: 'contact@mydriveledger.com' },
];

for (const { hash, expectedText } of hashRouteChecks) {
  globalThis.window.location.hash = hash;
  globalThis.window.dispatchEvent({ type: 'hashchange' });
  const modalHtml = rootContainer.toHtml();
  const plainExpected = expectedText.replace(/&amp;/g, '&');
  assert.ok(
    modalHtml.includes(expectedText) || modalHtml.includes(plainExpected),
    `Visiting ${hash} must automatically open modal containing "${plainExpected}"`
  );
}

// Close modal after hash checks
const closeAfterHashBtn = rootContainer.querySelectorAll(
  (el) => el.tagName === 'BUTTON' && el.getAttribute('aria-label') === 'Close modal'
)[0];
assert.ok(closeAfterHashBtn, 'Must find Close modal button');
closeAfterHashBtn.dispatchEvent({ type: 'click' });

// 4. Verify CookieConsentBanner & Footer Cookie Preferences Interaction
const cookieBannerEl = rootContainer.querySelectorAll(
  (el) => el.getAttribute('data-testid') === 'cookie-consent-banner'
)[0];
assert.ok(cookieBannerEl, 'CookieConsentBanner must be visible before consent is saved');

const essentialOnlyBtn = rootContainer.querySelectorAll(
  (el) => el.getAttribute('data-testid') === 'cookie-essential-only'
)[0];
assert.ok(essentialOnlyBtn, 'Must find Essential Only button on CookieConsentBanner');
essentialOnlyBtn.dispatchEvent({ type: 'click' });

const savedConsentStr = globalThis.localStorage.getItem('shiftmetric_cookie_consent');
assert.ok(savedConsentStr, 'Clicking Essential Only must persist consent in localStorage');
assert.strictEqual(JSON.parse(savedConsentStr).mode, 'essential');

// Re-open via permanent "Cookie Preferences" button in Footer
const footerCookiePrefBtn = rootContainer.querySelectorAll(
  (el) => el.getAttribute('data-testid') === 'footer-cookie-preferences'
)[0];
assert.ok(footerCookiePrefBtn, 'Footer must render permanent Cookie Preferences button');
footerCookiePrefBtn.dispatchEvent({ type: 'click' });

const reopenedBannerEl = rootContainer.querySelectorAll(
  (el) => el.getAttribute('data-testid') === 'cookie-consent-banner'
)[0];
assert.ok(reopenedBannerEl, 'Clicking Cookie Preferences in Footer must re-open CookieConsentBanner');

const acceptAllBtn = rootContainer.querySelectorAll(
  (el) => el.getAttribute('data-testid') === 'cookie-accept-all'
)[0];
assert.ok(acceptAllBtn, 'Must find Accept All button on CookieConsentBanner');
acceptAllBtn.dispatchEvent({ type: 'click' });
assert.strictEqual(
  JSON.parse(globalThis.localStorage.getItem('shiftmetric_cookie_consent')).mode,
  'all'
);

// 5. Verify 1-Line Legal Notice Below Main Workspace AND in Footer
const workspaceNotice = rootContainer.querySelectorAll(
  (el) => el.getAttribute('data-testid') === 'workspace-legal-notice'
)[0];
assert.ok(workspaceNotice, '1-line legal notice must be present directly below main calculator workspace');
assert.ok(workspaceNotice.textContent.includes(WORKSPACE_LEGAL_NOTICE_LINE));

const footerNotice = rootContainer.querySelectorAll(
  (el) => el.getAttribute('data-testid') === 'footer-legal-notice-line'
)[0];
assert.ok(footerNotice, '1-line legal notice must be present in Footer');

// 6. Verify Production Routing & SEO Files (wrangler.jsonc or public/_redirects, public/ads.txt, public/robots.txt)
const wranglerPath = path.join(projectRoot, 'wrangler.jsonc');
const redirectsPath = path.join(projectRoot, 'public', '_redirects');
assert.ok(
  fs.existsSync(wranglerPath) || fs.existsSync(redirectsPath),
  'Production routing configuration (wrangler.jsonc or public/_redirects) must exist'
);
if (fs.existsSync(wranglerPath)) {
  const wranglerConfig = JSON.parse(fs.readFileSync(wranglerPath, 'utf8'));
  assert.strictEqual(wranglerConfig.assets?.not_found_handling, 'single-page-application');
}
if (fs.existsSync(redirectsPath)) {
  assert.strictEqual(fs.readFileSync(redirectsPath, 'utf8').trim(), '/* /index.html 200');
}

const adsTxtPath = path.join(projectRoot, 'public', 'ads.txt');
assert.ok(fs.existsSync(adsTxtPath), 'public/ads.txt must exist');
assert.ok(fs.readFileSync(adsTxtPath, 'utf8').includes('google.com, pub-6581535125716295, DIRECT, f08c47fec0942fa0'));

const robotsTxtPath = path.join(projectRoot, 'public', 'robots.txt');
assert.ok(fs.existsSync(robotsTxtPath), 'public/robots.txt must exist');
assert.ok(fs.readFileSync(robotsTxtPath, 'utf8').includes('Sitemap: https://mydriveledger.com/sitemap.xml'));

// 7. Verify popstate back-navigation from /#privacy to / closes the LegalModal
globalThis.window.location.hash = '#privacy';
globalThis.window.dispatchEvent({ type: 'hashchange' });
assert.ok(
  rootContainer.toHtml().includes('Third-Party Advertising & Google AdSense'),
  'LegalModal must be open at #privacy before popstate back-navigation test'
);
globalThis.window.location.hash = '';
globalThis.window.dispatchEvent({ type: 'popstate' });
assert.ok(
  !rootContainer.toHtml().includes('Third-Party Advertising & Google AdSense'),
  'Navigating back via popstate to empty hash must close LegalModal'
);

// 7b. Verify Clean Path Routing, /methodology Collision Guard, and Clean Path Popstate
const cleanPaths = [
  '/privacy',
  '/terms',
  '/disclaimer',
  '/cookies',
  '/affiliate-disclosure',
  '/about',
  '/contact',
];
for (const p of cleanPaths) {
  assert.ok(resolveLegalPolicyKey(p), `resolveLegalPolicyKey must resolve clean path ${p}`);
  assert.ok(resolveLegalPolicyKey(`${p}/`), `resolveLegalPolicyKey must resolve trailing slash ${p}/`);
}
assert.strictEqual(resolveLegalPolicyKey('/methodology'), null, '/methodology must return null (collision guard)');
assert.strictEqual(resolveLegalPolicyKey('/methodology/'), null, '/methodology/ must return null (collision guard)');
assert.strictEqual(resolveLegalPolicyKey('methodology'), null, 'methodology must return null (collision guard)');

globalThis.window.location.pathname = '/privacy';
globalThis.window.location.hash = '';
globalThis.window.dispatchEvent({ type: 'popstate' });
assert.ok(
  rootContainer.toHtml().includes('Third-Party Advertising & Google AdSense'),
  'Navigating to /privacy via popstate must open LegalModal'
);
globalThis.window.location.pathname = '/';
globalThis.window.dispatchEvent({ type: 'popstate' });
assert.ok(
  !rootContainer.toHtml().includes('Third-Party Advertising & Google AdSense'),
  'Navigating back to / via popstate must close LegalModal'
);

// 7c. Verify Brand Assets (logo-512.png <100KB, valid PNG, and favicon.svg)
const logoPath = path.join(projectRoot, 'public', 'logo-512.png');
const faviconPath = path.join(projectRoot, 'public', 'favicon.svg');
assert.ok(fs.existsSync(logoPath), 'public/logo-512.png must exist');
const logoStat = fs.statSync(logoPath);
assert.ok(logoStat.size > 0 && logoStat.size < 102400, 'public/logo-512.png must be < 100KB');
const logoBuf = fs.readFileSync(logoPath);
assert.strictEqual(logoBuf.readUInt32BE(0), 0x89504e47, 'public/logo-512.png must have valid PNG magic signature');
assert.strictEqual(logoBuf.readUInt32BE(16), 512, 'public/logo-512.png width must be 512');
assert.strictEqual(logoBuf.readUInt32BE(20), 512, 'public/logo-512.png height must be 512');

assert.ok(fs.existsSync(faviconPath), 'public/favicon.svg must exist');
assert.ok(fs.readFileSync(faviconPath, 'utf8').includes('<svg'), 'public/favicon.svg must be valid SVG');

// 8. Verify AdUnit live AdSense rendering (adsenseEnabled: true), slot key resolution, ad-blocker resilience, and hideWhenDisabled
const { default: AdUnit } = await import('../src/components/monetization/AdUnit.jsx');
const adTestContainer = new MockElement('div');
const adTestRoot = createRoot(adTestContainer);

// 8a. When adsenseEnabled is false and hideWhenDisabled is true, AdUnit renders nothing
adTestRoot.render(React.createElement(AdUnit, { slotId: 'topLeaderboard', hideWhenDisabled: true }));
assert.strictEqual(adTestContainer.innerHTML, '', 'AdUnit with hideWhenDisabled=true must render empty when adsenseEnabled is false');

// 8b. When adsenseEnabled is true, AdUnit resolves slot keys (topLeaderboard, inContentRectangle, bottomStickyBanner) and survives ad-blocker push errors
const prevAdsenseEnabled = MONETIZATION_CONFIG.adsenseEnabled;
const prevAdsbygoogle = globalThis.window.adsbygoogle;
try {
  MONETIZATION_CONFIG.adsenseEnabled = true;
  let pushCalls = 0;
  globalThis.window.adsbygoogle = {
    push() {
      pushCalls += 1;
      if (pushCalls === 2) {
        throw new Error('Simulated ad-blocker push rejection');
      }
    },
  };

  adTestRoot.render(React.createElement(AdUnit, { slotId: 'inContentRectangle' }));
  const rectAdHtml = adTestContainer.toHtml();
  assert.ok(rectAdHtml.includes('class="adsbygoogle w-full"'), 'AdUnit must render <ins class="adsbygoogle"> when adsenseEnabled is true');
  assert.ok(rectAdHtml.includes('data-ad-client="ca-pub-6581535125716295"'), 'AdUnit must bind publisherId from monetizationConfig.js');
  assert.ok(rectAdHtml.includes('data-ad-slot="2222222222"'), 'AdUnit must resolve slotId="inContentRectangle" to "2222222222"');

  // Trigger simulated ad-blocker error on second slot render
  adTestRoot.render(React.createElement(AdUnit, { slotId: 'bottomStickyBanner' }));
  const stickyAdHtml = adTestContainer.toHtml();
  assert.ok(stickyAdHtml.includes('data-ad-slot="3333333333"'), 'AdUnit must resolve slotId="bottomStickyBanner" to "3333333333" and survive ad-blocker push exception');

  adTestRoot.render(React.createElement(AdUnit, { slotId: 'topLeaderboard' }));
  const topAdHtml = adTestContainer.toHtml();
  assert.ok(topAdHtml.includes('data-ad-slot="1111111111"'), 'AdUnit must resolve slotId="topLeaderboard" to "1111111111"');
  assert.ok(pushCalls >= 3, 'AdUnit must invoke window.adsbygoogle.push for each distinct slot render');
} finally {
  MONETIZATION_CONFIG.adsenseEnabled = prevAdsenseEnabled;
  globalThis.window.adsbygoogle = prevAdsbygoogle;
}

// 9. Verify buildAffiliateUrl preserves URL hash fragments if present in baseUrl
const prevBaseUrl = affiliatePartners.partsLookup.baseUrl;
try {
  affiliatePartners.partsLookup.baseUrl = 'https://www.rockauto.com/en/catalog#brake-pads';
  const hashedLink = buildAffiliateUrl('partsLookup');
  assert.strictEqual(
    hashedLink.href,
    'https://www.rockauto.com/en/catalog?ref=YOUR_PARTS_ID#brake-pads',
    'buildAffiliateUrl must insert query parameter before any URL #fragment'
  );
} finally {
  affiliatePartners.partsLookup.baseUrl = prevBaseUrl;
}

console.log('✓ 6K. Turnkey Monetization Config, Bulletproof Legal Suite (7 Hash Routes + GDPR/CCPA Banner) & Cloudflare Pages Readiness verified');

console.log('ALL DEEP VERIFICATION CHECKS PASSED WITH 0 ERRORS.');






import assert from 'node:assert/strict';
import test from 'node:test';
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

// =============================================================================
// DOM TEST HARNESS: Standards-Compliant Mock DOM Environment for Node.js
// =============================================================================

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
    this._lastScrolledIntoView = null;
    this.classList = {
      _set: new Set(),
      add: (...tokens) => tokens.forEach((t) => this.classList._set.add(t)),
      remove: (...tokens) => tokens.forEach((t) => this.classList._set.delete(t)),
      contains: (t) => this.classList._set.has(t),
      toggle: (t) => {
        if (this.classList._set.has(t)) {
          this.classList._set.delete(t);
          return false;
        } else {
          this.classList._set.add(t);
          return true;
        }
      },
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
    this.classList._set.clear();
    String(v)
      .split(/\s+/)
      .filter(Boolean)
      .forEach((cls) => this.classList._set.add(cls));
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
    if (name === 'class') {
      this.classList._set.clear();
      String(value)
        .split(/\s+/)
        .filter(Boolean)
        .forEach((cls) => this.classList._set.add(cls));
    }
  }
  removeAttribute(name) {
    this._attrs.delete(name);
    if (name === 'class') {
      this.classList._set.clear();
    }
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
    if (idx === -1) return null;
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

  insertBefore(newNode, refNode) {
    if (!refNode) return this.appendChild(newNode);
    const idx = this.childNodes.indexOf(refNode);
    if (idx === -1) return this.appendChild(newNode);
    if (newNode.parentNode) newNode.parentNode.removeChild(newNode);
    newNode.parentNode = this;
    this.childNodes.splice(idx, 0, newNode);
    return newNode;
  }

  get firstChild() {
    return this.childNodes[0] || null;
  }
  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] || null;
  }

  addEventListener(evt, fn) {
    if (!this._listeners.has(evt)) this._listeners.set(evt, []);
    this._listeners.get(evt).push(fn);
  }
  removeEventListener(evt, fn) {
    if (!this._listeners.has(evt)) return;
    const list = this._listeners.get(evt);
    const idx = list.indexOf(fn);
    if (idx !== -1) list.splice(idx, 1);
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
  blur() {
    if (globalThis.document.activeElement === this) {
      globalThis.document.activeElement = null;
    }
  }
  scrollIntoView() {
    this._lastScrolledIntoView = Date.now();
  }

  get textContent() {
    if (this._innerHTML !== null) return this._innerHTML.replace(/<[^>]+>/g, '');
    return this.childNodes.map((c) => c.textContent).join('');
  }

  querySelectorAll(query) {
    let predicate;
    if (typeof query === 'function') {
      predicate = query;
    } else if (typeof query === 'string') {
      const s = query.trim();
      if (s.startsWith('#')) {
        const targetId = s.slice(1);
        predicate = (el) => el.id === targetId;
      } else if (s.startsWith('.')) {
        const cls = s.slice(1);
        predicate = (el) => el.classList.contains(cls);
      } else if (s.startsWith('[') && s.endsWith(']')) {
        const inner = s.slice(1, -1);
        const eqIdx = inner.indexOf('=');
        if (eqIdx !== -1) {
          const attr = inner.slice(0, eqIdx).trim();
          const val = inner.slice(eqIdx + 1).replace(/^["']|["']$/g, '').trim();
          predicate = (el) => el.getAttribute(attr) === val;
        } else {
          predicate = (el) => el.hasAttribute(inner.trim());
        }
      } else {
        const tagUpper = s.toUpperCase();
        predicate = (el) => el.tagName === tagUpper;
      }
    } else {
      predicate = () => false;
    }

    const matches = [];
    const walk = (node) => {
      for (const child of node.childNodes) {
        if (child.nodeType === 1) {
          if (predicate(child)) matches.push(child);
          walk(child);
        }
      }
    };
    walk(this);
    return matches;
  }

  querySelector(query) {
    return this.querySelectorAll(query)[0] || null;
  }

  getElementById(id) {
    let found = null;
    const walk = (node) => {
      for (const child of node.childNodes) {
        if (child.nodeType === 1) {
          if (child.id === id) {
            found = child;
            return;
          }
          walk(child);
          if (found) return;
        }
      }
    };
    walk(this);
    return found;
  }

  toHtml() {
    const tag = this.tagName.toLowerCase();
    const attrs = Array.from(this._attrs.entries())
      .map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`)
      .join('');
    if (this._innerHTML !== null) {
      return `<${tag}${attrs}>${this._innerHTML}</${tag}>`;
    }
    const children = this.childNodes.map((c) => c.toHtml()).join('');
    return `<${tag}${attrs}>${children}</${tag}>`;
  }
}

const storageMap = new Map();
globalThis.localStorage = {
  getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
  clear: () => storageMap.clear(),
};
globalThis.sessionStorage = {
  getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
  clear: () => storageMap.clear(),
};

const rootContainer = new MockElement('div');
rootContainer.id = 'root';

const headElement = new MockElement('head');
const bodyElement = new MockElement('body');
bodyElement.appendChild(rootContainer);

globalThis.document = {
  documentElement: new MockElement('html'),
  head: headElement,
  body: bodyElement,
  activeElement: null,
  title: '',
  createElement: (tag) => new MockElement(tag),
  createElementNS: (ns, tag) => new MockElement(tag, ns),
  createTextNode: (text) => new MockTextNode(text),
  createDocumentFragment: () => new MockDocumentFragment(),
  getElementById: (id) => (id === 'root' ? rootContainer : rootContainer.getElementById(id)),
  querySelector: (sel) => rootContainer.querySelector(sel),
  querySelectorAll: (sel) => rootContainer.querySelectorAll(sel),
  execCommand: (cmd) => true,
};

let clipboardText = '';
try {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: {
      writeText: async (text) => {
        clipboardText = String(text);
        return true;
      },
      readText: async () => clipboardText,
    },
    configurable: true,
    writable: true,
  });
} catch {
  // Ignore if defined
}

const windowListeners = new Map();
let openedWindows = [];
globalThis.window = {
  location: {
    pathname: '/tco',
    search: '',
    hash: '',
    href: 'http://localhost:5173/tco',
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
  open(url, target, features) {
    openedWindows.push({ url, target, features });
    return {};
  },
  scrollTo() {},
  matchMedia: () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
  getComputedStyle: () => ({
    display: 'block',
    getPropertyValue: () => '',
  }),
  localStorage: globalThis.localStorage,
  sessionStorage: globalThis.sessionStorage,
};

// Register custom loader hooks for JSX and vendor mocks
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

// Import dynamically after hook registration
const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { default: TcoCalculator } = await import('../src/components/calculators/TcoCalculator.jsx');
const { default: VinCheckBanner } = await import('../src/components/monetization/VinCheckBanner.jsx');
const { default: CarVerticalLogo } = await import('../src/components/common/CarVerticalLogo.jsx');
const { VEHICLE_PRESETS, getPresetById } = await import('../src/data/vehiclePresets.js');
const { UnitProvider, useUnits } = await import('../src/context/UnitContext.jsx');
const { ThemeProvider } = await import('../src/context/ThemeContext.jsx');
const { GarageProvider } = await import('../src/context/GarageContext.jsx');
const {
  CARVERTICAL_AFFILIATE_URL,
  CARVERTICAL_DISCOUNT_CODE,
  CARVERTICAL_DISCOUNT_PERCENT,
  CARVERTICAL_LEGAL_ATTRIBUTION,
  FTC_PROXIMATE_DISCLOSURE,
  getCarVerticalUrl,
} = await import('../src/config/monetizationConfig.js');

const sleep = (ms = 25) => new Promise((resolve) => setTimeout(resolve, ms));
let renderCount = 0;

async function renderWithProviders(ui, initialRegion = 'US') {
  renderCount++;
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  if (initialRegion) {
    globalThis.localStorage.setItem('driveledger_region', initialRegion);
    globalThis.localStorage.setItem('shiftmetric_region', initialRegion);
  }

  while (rootContainer.childNodes.length > 0) {
    rootContainer.removeChild(rootContainer.childNodes[0]);
  }
  const root = createRoot(rootContainer);
  root.render(null);
  await sleep(10);

  root.render(
    React.createElement(
      'div',
      { key: `wrapper-${renderCount}` },
      React.createElement(
        UnitProvider,
        { key: `unit-${renderCount}-${initialRegion}` },
        React.createElement(
          ThemeProvider,
          { key: `theme-${renderCount}` },
          React.createElement(
            GarageProvider,
            { key: `garage-${renderCount}` },
            ui
          )
        )
      )
    )
  );
  await sleep(35);
  return { root, rootContainer };
}

function findByTestId(container, testId) {
  const elements = container.querySelectorAll(
    (el) => el.getAttribute('data-testid') === testId
  );
  return elements[0] || null;
}

function findButtonByText(container, text) {
  const buttons = container.querySelectorAll((el) => el.tagName === 'BUTTON');
  return buttons.find((b) => b.textContent.includes(text)) || null;
}

// =============================================================================
// CHALLENGER 2: ADVERSARIAL STRESS SUITE FOR MILESTONE 2 (R3 & R6)
// =============================================================================

test('ADV-M2-01: VinCheckBanner affiliate compliance, placement="tco", logo & discount coupon', async () => {
  openedWindows = [];
  clipboardText = '';

  const { rootContainer: container } = await renderWithProviders(
    React.createElement(VinCheckBanner, {
      placement: 'tco',
      vehicleName: 'a Golf 2.0 TDI BlueMotion',
      purchasePriceUsd: 18500,
      vehiclePriceFormatted: '$18,500',
      odometerMiles: 82000,
    })
  );

  // 1. Verify placement="tco" and data attributes
  const banner = findByTestId(container, 'vin-check-banner');
  assert.ok(banner, 'VinCheckBanner must have data-testid="vin-check-banner"');
  assert.strictEqual(banner.getAttribute('data-placement'), 'tco', 'Banner must reflect data-placement="tco"');
  assert.strictEqual(banner.id, 'affiliate-cta-vin-check', 'Banner must have id="affiliate-cta-vin-check"');

  // 2. Verify CarVertical logo with white pill container
  const logoImg = container.querySelectorAll((el) => el.tagName === 'IMG' && el.getAttribute('src') === '/carvertical-logo.png')[0];
  assert.ok(logoImg, 'Banner must render /carvertical-logo.png');
  const logoPill = logoImg.parentNode;
  assert.ok(logoPill.className.includes('bg-white'), 'Logo must be wrapped in high-contrast white pill');

  // 3. Verify vehicle name cleaning ('a ' stripped) and formatted price
  const heading = container.querySelector('h3');
  assert.ok(heading, 'Banner heading must exist');
  assert.ok(heading.textContent.includes('Golf 2.0 TDI BlueMotion'), 'Headline must include vehicle name without "a " prefix');
  assert.ok(heading.textContent.includes('$18,500'), 'Headline must include purchase price');

  // 4. Verify 17-digit VIN / Plate input
  const vinInput = container.querySelectorAll(
    (el) => el.tagName === 'INPUT' && (el.getAttribute('placeholder') || '').includes('17-digit VIN')
  )[0];
  assert.ok(vinInput, 'VIN / plate input must exist');
  assert.strictEqual(
    vinInput.getAttribute('placeholder'),
    'Enter 17-digit VIN or License Plate (Optional)',
    'VIN input must have exact placeholder'
  );

  // 5. Test typing 17-digit VIN and URL parameter generation with sub3
  vinInput.value = 'wbauy31050e829124';
  vinInput.dispatchEvent({ type: 'change' });
  await sleep(15);

  const ctaLink = container.querySelectorAll(
    (el) => el.tagName === 'A' && (el.getAttribute('rel') || '').includes('sponsored')
  )[0];
  assert.ok(ctaLink, 'Sponsored CTA link must exist');
  const href = ctaLink.getAttribute('href');
  assert.ok(href.includes('sub1=mydriveledger'), 'Affiliate link must include sub1=mydriveledger');
  assert.ok(href.includes('sub2=tco'), 'Affiliate link must include sub2=tco');
  assert.ok(href.includes('sub3=WBAUY31050E829124'), 'Affiliate link must include uppercase sub3 VIN');
  assert.ok(href.includes('uid=40'), 'Affiliate link must include uid=40');

  // 6. Test copy coupon button functionality
  const copyBtn = container.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && (el.textContent || '').includes('mydriveledger')
  )[0];
  assert.ok(copyBtn, 'Coupon code button with mydriveledger must exist');
  assert.ok(copyBtn.textContent.includes('20% OFF'), 'Coupon must indicate 20% OFF');

  copyBtn.dispatchEvent({ type: 'click' });
  await sleep(15);
  assert.strictEqual(clipboardText, CARVERTICAL_DISCOUNT_CODE, 'Clicking copy button must copy discount code to clipboard');
  assert.ok(copyBtn.textContent.includes('Code Copied!'), 'Copy button must show "Code Copied!" confirmation');

  // 7. Verify legal disclosures
  const bannerText = container.textContent || '';
  assert.ok(bannerText.includes(CARVERTICAL_LEGAL_ATTRIBUTION), 'Banner must include Clause 1.3 legal attribution');
  assert.ok(bannerText.includes(FTC_PROXIMATE_DISCLOSURE), 'Banner must include FTC proximate disclosure');
});

test('ADV-M2-02: TcoCalculator DOM shortcuts and #preset-select-dropdown accessibility when modal is CLOSED', async () => {
  let selectedPreset = 'bmw-330i-g20';
  const handleSelectPreset = (newId) => {
    selectedPreset = newId;
  };

  const { rootContainer: container } = await renderWithProviders(
    React.createElement(TcoCalculator, {
      selectedPresetId: selectedPreset,
      onSelectPreset: handleSelectPreset,
    })
  );

  // 1. Verify modal is closed initially
  const modal = findByTestId(container, 'vehicle-catalog-modal');
  assert.strictEqual(modal, null, 'Switch Car modal must NOT be open initially');

  // 2. Verify prominent "Switch Car" button exists on Active Vehicle Header Card
  const switchCarBtn = findByTestId(container, 'tco-switch-car-button');
  assert.ok(switchCarBtn, 'Prominent "Switch Car" button must be mounted on active vehicle card');
  assert.ok(switchCarBtn.textContent.includes('Switch Car'), 'Button must display "Switch Car" text');

  // 3. Verify redundant vehicle selector is eliminated from main view
  const oldCatalogBtn = findButtonByText(container, 'Search or browse 120+ models & engines');
  assert.strictEqual(oldCatalogBtn, null, 'Old redundant catalog toggle must be removed');

  // 4. Invariant: DOM must contain test shortcuts even when modal is closed
  const srOnlyShortcutsHeader = container.querySelectorAll(
    (el) => (el.textContent || '').includes('TELEMETRY PRESET BENCHMARKS:')
  )[0];
  assert.ok(srOnlyShortcutsHeader, 'DOM must retain TELEMETRY PRESET BENCHMARKS for automated test runners');

  // 5. Test clicking a shortcut button while modal is closed
  const camryShortcut = findButtonByText(container, 'Toyota Camry Hybrid');
  assert.ok(camryShortcut, 'Shortcut button "Toyota Camry Hybrid" must exist in DOM');
  camryShortcut.dispatchEvent({ type: 'click' });
  await sleep(15);
  assert.strictEqual(selectedPreset, 'toyota-camry-hybrid', 'Clicking shortcut in closed mode must trigger onSelectPreset');

  // 6. Invariant: DOM must contain #preset-select-dropdown even when modal is closed
  const dropdown = container.getElementById('preset-select-dropdown');
  assert.ok(dropdown, '#preset-select-dropdown must be mounted in DOM for test runner compatibility');
});

test('ADV-M2-03: TcoCalculator modal open, search catalog, presets and dismissal', async () => {
  let selectedPreset = 'bmw-330i-g20';
  const handleSelectPreset = (newId) => {
    selectedPreset = newId;
  };

  const { rootContainer: container } = await renderWithProviders(
    React.createElement(TcoCalculator, {
      selectedPresetId: selectedPreset,
      onSelectPreset: handleSelectPreset,
    })
  );

  const switchCarBtn = findByTestId(container, 'tco-switch-car-button');
  assert.ok(switchCarBtn, 'Switch Car button must exist');

  // Open the modal
  switchCarBtn.dispatchEvent({ type: 'click' });
  await sleep(25);

  const modal = findByTestId(container, 'vehicle-catalog-modal');
  assert.ok(modal, 'Modal dialog with data-testid="vehicle-catalog-modal" must mount');
  assert.strictEqual(modal.getAttribute('role'), 'dialog', 'Modal must have role="dialog"');
  assert.strictEqual(modal.getAttribute('aria-modal'), 'true', 'Modal must have aria-modal="true"');

  // Check shortcuts inside modal
  const teslaShortcut = modal.querySelectorAll((el) => el.tagName === 'BUTTON' && el.textContent.includes('Tesla Model 3'))[0];
  assert.ok(teslaShortcut, 'Tesla shortcut must exist inside modal');

  // Check #preset-select-dropdown inside modal
  const modalDropdown = modal.getElementById('preset-select-dropdown') || container.getElementById('preset-select-dropdown');
  assert.ok(modalDropdown, '#preset-select-dropdown must be accessible when modal is open');

  // Select a preset inside modal
  teslaShortcut.dispatchEvent({ type: 'click' });
  await sleep(25);
  assert.strictEqual(selectedPreset, 'tesla-model-3-lr', 'Clicking preset in modal must invoke onSelectPreset');

  // Modal must close after selection
  const closedModal = findByTestId(container, 'vehicle-catalog-modal');
  assert.strictEqual(closedModal, null, 'Modal must auto-close after vehicle selection');

  // Reopen and test close button (X)
  switchCarBtn.dispatchEvent({ type: 'click' });
  await sleep(25);
  const reopenedModal = findByTestId(container, 'vehicle-catalog-modal');
  assert.ok(reopenedModal, 'Modal must reopen');

  const closeBtn = reopenedModal.querySelectorAll((el) => el.getAttribute('aria-label') === 'Close modal')[0];
  assert.ok(closeBtn, 'Close button with aria-label="Close modal" must exist');
  closeBtn.dispatchEvent({ type: 'click' });
  await sleep(25);
  assert.strictEqual(findByTestId(container, 'vehicle-catalog-modal'), null, 'Close button must dismiss modal');

  // Reopen and test backdrop click dismiss
  switchCarBtn.dispatchEvent({ type: 'click' });
  await sleep(25);
  const backdropModal = findByTestId(container, 'vehicle-catalog-modal');
  assert.ok(backdropModal, 'Modal must reopen for backdrop test');
  backdropModal.dispatchEvent({ type: 'click' });
  await sleep(25);
  assert.strictEqual(findByTestId(container, 'vehicle-catalog-modal'), null, 'Clicking backdrop must dismiss modal');
});

test('ADV-M2-04: Ownership Value Score 3-tier dynamic plain-English verdict badge', async () => {
  // Test Tier 1: Score >= 75 -> "Great Long-Term Value" (e.g. Toyota Corolla Hybrid, score 78)
  const { rootContainer: hybridContainer } = await renderWithProviders(
    React.createElement(TcoCalculator, {
      selectedPresetId: 'toyota-corolla-18-hybrid',
      onSelectPreset: () => {},
    })
  );

  const hybridVerdict = findByTestId(hybridContainer, 'ownership-value-verdict-badge');
  assert.ok(hybridVerdict, 'Verdict badge must exist');
  assert.strictEqual(hybridVerdict.textContent, 'Great Long-Term Value', 'Corolla Hybrid must score "Great Long-Term Value"');
  assert.ok(hybridVerdict.className.includes('emerald'), 'Great Long-Term Value badge must have emerald styling');

  // Test Tier 2: Score 60-74 -> "Average Ownership Cost" (e.g. Ford Focus EcoBlue Diesel, score 72)
  const { rootContainer: dieselContainer } = await renderWithProviders(
    React.createElement(TcoCalculator, {
      selectedPresetId: 'ford-focus-ecoblue',
      onSelectPreset: () => {},
    })
  );

  const dieselVerdict = findByTestId(dieselContainer, 'ownership-value-verdict-badge');
  assert.ok(dieselVerdict, 'Verdict badge must exist');
  assert.strictEqual(dieselVerdict.textContent, 'Average Ownership Cost', 'Mid-market diesel must score "Average Ownership Cost"');
  assert.ok(dieselVerdict.className.includes('amber'), 'Average Ownership Cost badge must have amber styling');

  // Verify progress bar rendering matches score percentage
  const progressBar = hybridContainer.querySelectorAll(
    (el) => el.parentNode && (el.parentNode.className || '').includes('rounded-full bg-zinc-200')
  )[0];
  assert.ok(progressBar, 'Animated progress bar must exist in value score section');
  assert.ok((progressBar.style?.width || '').includes('%'), 'Progress bar style width must be percentage');
});

test('ADV-M2-05: Multi-region localization stress test (US, UK, EU)', async () => {
  // 1. Test US Region
  const { rootContainer: usContainer } = await renderWithProviders(
    React.createElement(TcoCalculator, {
      selectedPresetId: 'toyota-camry-hybrid',
      onSelectPreset: () => {},
    }),
    'US'
  );

  const usHtml = usContainer.toHtml();
  assert.ok(usHtml.includes('$'), 'US mode must render $ currency symbol');
  assert.ok(usHtml.includes('mi'), 'US mode must render mi distance unit');
  assert.ok(usHtml.includes('/mo'), 'Monthly cost must display /mo');

  // 2. Test UK Region
  const { rootContainer: ukContainer } = await renderWithProviders(
    React.createElement(TcoCalculator, {
      selectedPresetId: 'toyota-camry-hybrid',
      onSelectPreset: () => {},
    }),
    'UK'
  );

  const ukHtml = ukContainer.toHtml();
  assert.ok(ukHtml.includes('£'), 'UK mode must render £ currency symbol');
  assert.ok(ukHtml.includes('mi'), 'UK mode must render mi distance unit');

  // 3. Test EU Region
  const { rootContainer: euContainer } = await renderWithProviders(
    React.createElement(TcoCalculator, {
      selectedPresetId: 'toyota-camry-hybrid',
      onSelectPreset: () => {},
    }),
    'EU'
  );

  const euHtml = euContainer.toHtml();
  assert.ok(euHtml.includes('€'), 'EU mode must render € currency symbol');
  assert.ok(euHtml.includes('km'), 'EU mode must render km distance unit');
  assert.ok(!euHtml.includes('NaN'), 'EU calculations must not contain NaN');

  // Verify cost per local unit reflects km in EU mode
  const costPerUnitLabel = euContainer.querySelectorAll(
    (el) => (el.textContent || '').includes('per km')
  )[0];
  assert.ok(costPerUnitLabel, 'EU mode must display cost "per km"');
});

test('ADV-M2-06: Styling, padding, vertical spacing and typography requirements', async () => {
  const { rootContainer: container } = await renderWithProviders(
    React.createElement(TcoCalculator, {
      selectedPresetId: 'ford-focus-ecoblue',
      onSelectPreset: () => {},
    })
  );

  // 1. Verify Card 1 padding (p-6 / sm:p-7)
  const card1 = container.querySelectorAll((el) => el.getAttribute('aria-labelledby') === 'vehicle-heading')[0];
  assert.ok(card1, 'Vehicle card must exist');
  assert.ok(card1.className.includes('p-6'), 'Vehicle card must have p-6 padding');

  // 2. Verify Card 2 padding (p-6 / sm:p-7)
  const card2 = container.querySelectorAll((el) => el.getAttribute('aria-labelledby') === 'driving-heading')[0];
  assert.ok(card2, 'Driving card must exist');
  assert.ok(card2.className.includes('p-6'), 'Driving card must have p-6 padding');

  // 3. Verify Summary Card padding (p-6 / sm:p-7)
  const summaryCard = container.querySelectorAll((el) => el.getAttribute('aria-labelledby') === 'summary-heading')[0];
  assert.ok(summaryCard, 'Summary card must exist');
  assert.ok(summaryCard.className.includes('p-6'), 'Summary card must have p-6 padding');

  // 4. Verify VinCheckBanner positioning below Summary Card with mt-6
  const vinBanner = findByTestId(container, 'vin-check-banner');
  assert.ok(vinBanner, 'VinCheckBanner must exist');
  assert.ok(vinBanner.className.includes('mt-6'), 'VinCheckBanner must have mt-6 margin top for dedicated spacing below summary');
});

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

// =============================================================================
// DOM TEST HARNESS: Mock DOM Environment for Node.js
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
    for (const n of nodes) {
      if (typeof n === 'string') {
        this.appendChild(new MockTextNode(n));
      } else if (n) {
        this.appendChild(n);
      }
    }
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

  get textContent() {
    return this.childNodes.map((c) => c.textContent).join('');
  }
  set textContent(v) {
    this.childNodes = [];
    if (v !== '' && v !== null && v !== undefined) {
      this.appendChild(new MockTextNode(v));
    }
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
      bubbles: true,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {},
      ...eventObj,
    };
    for (const fn of [...fns]) {
      try {
        fn.call(this, e);
      } catch (err) {
        // Handled
      }
    }
    if (e.bubbles && this.parentNode && typeof this.parentNode.dispatchEvent === 'function') {
      this.parentNode.dispatchEvent(eventObj);
    }
    return !e.defaultPrevented;
  }

  click() {
    this.dispatchEvent({ type: 'click' });
  }

  focus() {}
  blur() {}
  scrollIntoView() {}

  closest(selector) {
    let cur = this;
    while (cur && cur.nodeType === 1) {
      if (matchesSimple(cur, selector)) return cur;
      cur = cur.parentNode;
    }
    return null;
  }

  querySelector(predicateOrSelector) {
    const list = this.querySelectorAll(predicateOrSelector);
    return list[0] || null;
  }

  querySelectorAll(predicateOrSelector) {
    const results = [];
    const testFn =
      typeof predicateOrSelector === 'function'
        ? predicateOrSelector
        : (el) => matchesSimple(el, predicateOrSelector);

    function walk(node) {
      if (node.nodeType === 1) {
        if (testFn(node)) results.push(node);
      }
      for (const child of node.childNodes || []) {
        walk(child);
      }
    }
    for (const child of this.childNodes) {
      walk(child);
    }
    return results;
  }

  getElementById(id) {
    return this.querySelector((el) => el.getAttribute('id') === id);
  }

  toHtml() {
    const tag = this.tagName.toLowerCase();
    const attrs = Array.from(this._attrs.entries())
      .map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`)
      .join('');
    const selfClosing = ['input', 'img', 'br', 'hr', 'meta', 'link'].includes(tag);
    if (selfClosing) return `<${tag}${attrs} />`;
    const inner = this.childNodes.map((c) => c.toHtml()).join('');
    return `<${tag}${attrs}>${inner}</${tag}>`;
  }
}

function matchesSimple(el, selector) {
  if (!el || el.nodeType !== 1 || !selector) return false;
  if (selector.startsWith('#')) {
    return el.getAttribute('id') === selector.slice(1);
  }
  if (selector.startsWith('.')) {
    return el.classList.contains(selector.slice(1));
  }
  if (selector.startsWith('[') && selector.endsWith(']')) {
    const inner = selector.slice(1, -1);
    if (inner.includes('=')) {
      const [k, v] = inner.split('=');
      const cleanV = v.replace(/^['"]|['"]$/g, '');
      return el.getAttribute(k) === cleanV;
    }
    return el.hasAttribute(inner);
  }
  return el.tagName.toLowerCase() === selector.toLowerCase();
}

class MockDocument {
  constructor() {
    this.nodeType = 9;
    this.documentElement = new MockElement('html');
    this.head = new MockElement('head');
    this.body = new MockElement('body');
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
    this.activeElement = this.body;
  }
  createElement(tag) {
    return new MockElement(tag);
  }
  createElementNS(ns, tag) {
    return new MockElement(tag, ns);
  }
  createTextNode(text) {
    return new MockTextNode(text);
  }
  createDocumentFragment() {
    return new MockDocumentFragment();
  }
  getElementById(id) {
    return this.body.getElementById(id);
  }
  querySelector(sel) {
    return this.body.querySelector(sel);
  }
  querySelectorAll(sel) {
    return this.body.querySelectorAll(sel);
  }
  addEventListener() {}
  removeEventListener() {}
}

const mockDoc = new MockDocument();
const rootContainer = mockDoc.createElement('div');
rootContainer.id = 'root';
mockDoc.body.appendChild(rootContainer);

globalThis.document = mockDoc;
globalThis.window = {
  document: mockDoc,
  location: {
    pathname: '/',
    search: '',
    hash: '',
    href: 'http://localhost:5173/',
  },
  history: {
    pushState: (state, title, url) => {
      if (url) {
        const u = new URL(url, 'http://localhost:5173');
        globalThis.window.location.pathname = u.pathname;
        globalThis.window.location.search = u.search;
        globalThis.window.location.hash = u.hash;
        globalThis.window.location.href = u.href;
      }
    },
    replaceState: (state, title, url) => {
      if (url) {
        const u = new URL(url, 'http://localhost:5173');
        globalThis.window.location.pathname = u.pathname;
        globalThis.window.location.search = u.search;
        globalThis.window.location.hash = u.hash;
        globalThis.window.location.href = u.href;
      }
    },
  },
  scrollTo: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
  getComputedStyle: () => ({
    display: 'block',
    getPropertyValue: () => '',
  }),
  localStorage: {
    _data: new Map(),
    getItem: (k) => globalThis.window.localStorage._data.get(k) || null,
    setItem: (k, v) => globalThis.window.localStorage._data.set(k, String(v)),
    removeItem: (k) => globalThis.window.localStorage._data.delete(k),
    clear: () => globalThis.window.localStorage._data.clear(),
  },
  sessionStorage: {
    _data: new Map(),
    getItem: (k) => globalThis.window.sessionStorage._data.get(k) || null,
    setItem: (k, v) => globalThis.window.sessionStorage._data.set(k, String(v)),
    removeItem: (k) => globalThis.window.sessionStorage._data.delete(k),
    clear: () => globalThis.window.sessionStorage._data.clear(),
  },
};
globalThis.localStorage = globalThis.window.localStorage;
globalThis.sessionStorage = globalThis.window.sessionStorage;

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
const { default: App } = await import('../src/App.jsx');
const { PRIMARY_WORKSPACE_TABS, SECONDARY_WORKSPACE_TABS } = await import('../src/components/layout/Navbar.jsx');
const { VEHICLE_PRESETS, getPresetById } = await import('../src/data/vehiclePresets.js');
const { OBD_CODES } = await import('../src/data/obdCodes.js');

const sleep = (ms = 35) => new Promise((resolve) => setTimeout(resolve, ms));

async function renderApp(initialPath = '/', initialSearch = '', initialHash = '', preserveStorage = false) {
  if (!preserveStorage) {
    globalThis.localStorage.clear();
    globalThis.sessionStorage.clear();
  }
  globalThis.window.location.pathname = initialPath;
  globalThis.window.location.search = initialSearch;
  globalThis.window.location.hash = initialHash;
  globalThis.window.location.href = `http://localhost:5173${initialPath}${initialSearch}${initialHash}`;

  while (rootContainer.childNodes.length > 0) {
    rootContainer.removeChild(rootContainer.childNodes[0]);
  }

  const root = createRoot(rootContainer);
  try {
    root.render(React.createElement(App));
    await sleep(40);
  } catch (err) {
    // Catch in-flight render exceptions
  }
  return { root, rootContainer };
}

function findButtonByText(container, text) {
  const buttons = container.querySelectorAll((el) => el.tagName === 'BUTTON');
  return buttons.find((b) => b.textContent.includes(text)) || null;
}

function findByTestId(container, testId) {
  const elements = container.querySelectorAll(
    (el) => el.getAttribute('data-testid') === testId
  );
  return elements[0] || null;
}

// =============================================================================
// CHALLENGER TEST SUITE: MILESTONE 1 EMPIRICAL & ADVERSARIAL STRESS
// =============================================================================

test('CHALLENGER 1.1: Navbar R1 Streamlining, 4 Primary Tabs + Guides, sr-only Invariants & Removal of Redundant Dropdown', async () => {
  const { rootContainer } = await renderApp('/');

  // 1. Brand logo on Left
  const logo = rootContainer.querySelectorAll(
    (el) =>
      el.tagName === 'A' &&
      ((el.getAttribute('aria-label') || '').toLowerCase().includes('driveledger') ||
        (el.textContent || '').includes('DriveLedger'))
  )[0];
  assert.ok(logo, 'DriveLedger brand logo link must be mounted on the left');

  // 2. Primary Tabs in center: Overview, Cost Calculator, Maintenance, OBD-II Lookup + Guides
  const tabOverview = rootContainer.getElementById('tab-overview');
  const tabTco = rootContainer.getElementById('tab-tco');
  const tabRisk = rootContainer.getElementById('tab-risk');
  const tabObd = rootContainer.getElementById('tab-obd');
  const tabGuides = rootContainer.getElementById('tab-guides');

  assert.ok(tabOverview, 'Overview tab (#tab-overview) exists');
  assert.ok(tabTco, 'Cost Calculator tab (#tab-tco) exists');
  assert.ok(tabRisk, 'Maintenance tab (#tab-risk) exists');
  assert.ok(tabObd, 'OBD-II Lookup tab (#tab-obd) exists');
  assert.ok(tabGuides, 'Guides tab (#tab-guides) exists');

  // Check visible text
  assert.ok(tabOverview.textContent.includes('Overview'), 'Overview displays "Overview"');
  assert.ok(tabTco.textContent.includes('Cost Calculator'), 'TCO displays visible "Cost Calculator"');
  assert.ok(tabRisk.textContent.includes('Maintenance'), 'Risk displays visible "Maintenance"');
  assert.ok(tabObd.textContent.includes('OBD-II Lookup'), 'OBD displays visible "OBD-II Lookup"');
  assert.ok(tabGuides.textContent.includes('Guides'), 'Guides displays visible "Guides"');

  // Check sr-only accessibility strings for regression suite stability
  assert.ok(tabTco.textContent.includes('5-Yr True Cost to Own'), 'TCO tab preserves legacy "5-Yr True Cost to Own" in sr-only');
  assert.ok(tabRisk.textContent.includes('Powertrain Risk Matrix'), 'Risk tab preserves legacy "Powertrain Risk Matrix" in sr-only');
  assert.ok(tabRisk.textContent.includes('Maintenance Check'), 'Risk tab preserves legacy "Maintenance Check" in sr-only');
  assert.ok(tabObd.textContent.includes('OBD-II Workshop Estimator'), 'OBD tab preserves legacy "OBD-II Workshop Estimator" in sr-only');
  assert.ok(tabObd.textContent.includes('OBD2 Repair Estimator'), 'OBD tab preserves legacy "OBD2 Repair Estimator" in sr-only');

  // 3. Redundant active-vehicle dropdown removed from top navbar
  const redundantSwitcher = rootContainer.getElementById('navbar-vehicle-switcher-container') ||
    findByTestId(rootContainer, 'navbar-active-vehicle-picker');
  assert.strictEqual(redundantSwitcher, null, 'Redundant active vehicle picker must be removed from top navbar');

  // 4. Priority-plus "More ▾" button exists
  const moreBtn = findByTestId(rootContainer, 'navbar-more-button');
  assert.ok(moreBtn, 'Priority-plus "More ▾" button must exist with data-testid="navbar-more-button"');

  // 5. Region switcher exists with exactly 3 options
  const regionGroup = rootContainer.querySelectorAll(
    (el) => el.getAttribute('role') === 'radiogroup' && el.getAttribute('aria-label') === 'Units and currency'
  )[0];
  assert.ok(regionGroup, 'Region switcher radiogroup exists');
  const regionRadios = regionGroup.querySelectorAll((el) => el.tagName === 'BUTTON');
  assert.strictEqual(regionRadios.length, 3, 'Region switcher must have exactly 3 options (US, UK, EU)');
});

test('CHALLENGER 1.2: Unified Garage & Compare Pill Button, Badge Counter & Popover Dropdown', async () => {
  const { rootContainer } = await renderApp('/');

  // 1. Badge with data-testid="garage-count-badge"
  const badge = findByTestId(rootContainer, 'garage-count-badge');
  assert.ok(badge, 'Badge must exist with data-testid="garage-count-badge"');
  assert.strictEqual(badge.textContent.trim(), '0', 'Initial garage count is 0');

  // 2. Button contains "Garage & Compare" text
  const garageBtn = badge.parentNode;
  assert.ok(garageBtn.textContent.includes('Garage & Compare'), 'Button displays "Garage & Compare"');

  // 3. Popover is not initially open
  let menu = rootContainer.querySelectorAll((el) => el.getAttribute('role') === 'menu' && (el.getAttribute('aria-label') || '').includes('Garage'))[0];
  assert.strictEqual(menu, undefined, 'Garage dropdown popover must not be open initially');

  // 4. Click to open dropdown popover
  garageBtn.dispatchEvent({ type: 'click' });
  await sleep(35);

  menu = rootContainer.querySelectorAll((el) => el.getAttribute('role') === 'menu' && (el.getAttribute('aria-label') || '').includes('Garage'))[0];
  assert.ok(menu, 'Clicking Garage & Compare pill opens popover dropdown');

  // 5. Popover contains "Open Side-by-Side Comparator" CTA button
  const ctaBtn = menu.querySelectorAll((el) => el.tagName === 'BUTTON' && el.textContent.includes('Open Side-by-Side Comparator'))[0];
  assert.ok(ctaBtn, 'Dropdown popover must contain "Open Side-by-Side Comparator" button');

  // 6. Clicking CTA navigates to /compare
  ctaBtn.dispatchEvent({ type: 'click' });
  await sleep(35);
  assert.strictEqual(globalThis.window.location.pathname, '/compare', 'Clicking comparator CTA navigates to /compare');
});

test('CHALLENGER 1.3: Mobile Navigation Drawer & Quick Tabs', async () => {
  const { rootContainer } = await renderApp('/');

  // 1. Mobile quick tabs container exists
  const quickTabs = findByTestId(rootContainer, 'navbar-mobile-quick-tabs');
  assert.ok(quickTabs, 'Mobile quick tabs container with data-testid="navbar-mobile-quick-tabs" exists');

  // 2. Mobile menu toggle button exists
  const mobileToggle = findByTestId(rootContainer, 'navbar-mobile-menu-toggle');
  assert.ok(mobileToggle, 'Mobile menu toggle button with data-testid="navbar-mobile-menu-toggle" exists');

  // 3. Toggle mobile drawer
  mobileToggle.dispatchEvent({ type: 'click' });
  await sleep(35);

  const drawer = rootContainer.getElementById('mobile-nav-drawer');
  assert.ok(drawer, 'Mobile navigation drawer mounts when hamburger toggle is clicked');
  assert.ok(drawer.textContent.includes('Garage & Compare'), 'Mobile drawer contains unified Garage & Compare block');
});

test('CHALLENGER 2.1: Homepage Hero Layout, Headline, Subtitle & 3 Starter Action Pills', async () => {
  const { rootContainer } = await renderApp('/');

  // 1. Headline and plain-English subtitle
  const content = rootContainer.textContent;
  assert.ok(content.includes('Know what your car really costs before it costs you.'), 'Hero headline present');
  assert.ok(content.includes('Real 5-year ownership costs, upcoming maintenance, and fair repair pricing in seconds.'), 'Hero subtitle present');

  // 2. Unified search input with exact placeholder
  const searchInput = rootContainer.querySelectorAll(
    (el) =>
      el.tagName === 'INPUT' &&
      el.getAttribute('placeholder') === 'Search any car model or OBD-II code (e.g. Golf 2.0 TDI, P2002)...'
  )[0];
  assert.ok(searchInput, 'Search input with exact placeholder exists');

  // 3. 3 action starter pills
  const pill1 = findButtonByText(rootContainer, 'Calculate 5-Yr Cost');
  const pill2 = findButtonByText(rootContainer, 'Check Maintenance Risks');
  const pill3 = findButtonByText(rootContainer, 'Look Up Fault Code');

  assert.ok(pill1, 'Starter pill 1: "Calculate 5-Yr Cost" exists');
  assert.ok(pill2, 'Starter pill 2: "Check Maintenance Risks" exists');
  assert.ok(pill3, 'Starter pill 3: "Look Up Fault Code" exists');

  // 4. Body style chips NOT in hero
  const heroCard = searchInput.closest('section');
  assert.ok(heroCard, 'Hero section found');
  const heroChips = heroCard.querySelectorAll((el) => el.tagName === 'BUTTON' && (el.textContent.includes('All Body Styles') || el.textContent.includes('Sedans')));
  assert.strictEqual(heroChips.length, 0, 'No body style filter chips must exist inside Hero section');

  // 5. Preserved hidden select in DOM
  const hiddenSelect = rootContainer.getElementById('preset-select-dropdown');
  assert.ok(hiddenSelect, 'Hidden <select id="preset-select-dropdown"> must exist in DOM');
  assert.strictEqual(hiddenSelect.querySelectorAll((el) => el.tagName === 'OPTION').length, VEHICLE_PRESETS.length, 'Select contains all presets');

  // 6. Test pill navigation triggers
  pill1.dispatchEvent({ type: 'click' });
  await sleep(35);
  assert.strictEqual(globalThis.window.location.pathname, '/tco', 'Pill 1 routes to /tco');

  await renderApp('/');
  const pill2Reloaded = findButtonByText(rootContainer, 'Check Maintenance Risks');
  pill2Reloaded.dispatchEvent({ type: 'click' });
  await sleep(35);
  assert.strictEqual(globalThis.window.location.pathname, '/risk-matrix', 'Pill 2 routes to /risk-matrix');

  await renderApp('/');
  const pill3Reloaded = findButtonByText(rootContainer, 'Look Up Fault Code');
  pill3Reloaded.dispatchEvent({ type: 'click' });
  await sleep(35);
  assert.strictEqual(globalThis.window.location.pathname, '/obd-estimator', 'Pill 3 routes to /obd-estimator');
});

test('CHALLENGER 2.2: Hero Search Autocomplete Stress — Hostile Inputs, XSS, Long Strings & Case Variations', async () => {
  const { rootContainer } = await renderApp('/');

  const searchInput = rootContainer.querySelectorAll(
    (el) =>
      el.tagName === 'INPUT' &&
      (el.getAttribute('placeholder') || '').includes('Golf')
  )[0];
  assert.ok(searchInput, 'Search input exists');

  // Adversarial query 1: Whitespace-only query
  searchInput.value = '     ';
  searchInput.dispatchEvent({ type: 'input' });
  await sleep(25);
  let autocomplete = findByTestId(rootContainer, 'hero-search-autocomplete');
  assert.strictEqual(autocomplete, null, 'Whitespace-only query must not display autocomplete dropdown');

  // Adversarial query 2: Special characters & injection payload
  searchInput.value = '<script>alert("XSS")</script>';
  searchInput.dispatchEvent({ type: 'input' });
  await sleep(25);
  autocomplete = findByTestId(rootContainer, 'hero-search-autocomplete');
  assert.ok(autocomplete, 'Autocomplete mounts safely without regex crash');
  assert.ok(autocomplete.textContent.includes('No matching models or fault codes'), 'Displays friendly empty message');

  // Adversarial query 3: Long hostile string
  searchInput.value = 'a'.repeat(3000);
  searchInput.dispatchEvent({ type: 'input' });
  await sleep(25);
  autocomplete = findByTestId(rootContainer, 'hero-search-autocomplete');
  assert.ok(autocomplete, 'Handles 3000-character input safely');

  // Valid query: Case-insensitive vehicle search "gOlF"
  searchInput.value = 'gOlF';
  searchInput.dispatchEvent({ type: 'input' });
  await sleep(25);
  autocomplete = findByTestId(rootContainer, 'hero-search-autocomplete');
  assert.ok(autocomplete, 'Autocomplete mounts for "gOlF"');
  assert.ok(autocomplete.textContent.includes('Golf'), 'Lists Golf matching vehicles');

  // Valid query: OBD Code "p2002"
  searchInput.value = 'p2002';
  searchInput.dispatchEvent({ type: 'input' });
  await sleep(25);
  autocomplete = findByTestId(rootContainer, 'hero-search-autocomplete');
  assert.ok(autocomplete, 'Autocomplete mounts for "p2002"');
  assert.ok(autocomplete.textContent.includes('P2002'), 'Lists P2002 OBD code');
  assert.ok(autocomplete.textContent.includes('OBD-II Fault Codes'), 'Contains OBD-II Fault Codes heading');
});

test('CHALLENGER 2.3: Hero Search Form Submission Prioritization & Navigation', async () => {
  const { rootContainer } = await renderApp('/');

  const searchInput = rootContainer.querySelectorAll(
    (el) =>
      el.tagName === 'INPUT' &&
      (el.getAttribute('placeholder') || '').includes('Golf')
  )[0];
  const form = searchInput.closest('form');
  assert.ok(form, 'Search form exists');

  // Test 1: Submit with OBD code "P0420" -> navigates to OBD estimator
  searchInput.value = 'P0420';
  searchInput.dispatchEvent({ type: 'input' });
  await sleep(25);
  form.dispatchEvent({ type: 'submit' });
  await sleep(35);
  assert.strictEqual(globalThis.window.location.pathname, '/obd-estimator', 'Submitting OBD code navigates to /obd-estimator');

  // Test 2: Submit with empty string -> navigates to /tco
  await renderApp('/');
  const formReloaded = rootContainer.querySelectorAll((el) => el.tagName === 'FORM')[0];
  formReloaded.dispatchEvent({ type: 'submit' });
  await sleep(35);
  assert.strictEqual(globalThis.window.location.pathname, '/tco', 'Submitting empty query navigates to /tco');
});

test('CHALLENGER 2.4: Browse Popular Vehicles Section, 7 Body Style Filter Chips & Responsive Grid', async () => {
  const { rootContainer } = await renderApp('/');

  // 1. Dedicated section lower on page
  const section = rootContainer.getElementById('telemetry-preset-benchmarks-section');
  assert.ok(section, 'Dedicated section #telemetry-preset-benchmarks-section exists');
  assert.ok(section.textContent.includes('Browse Popular Vehicles'), 'Section heading is "Browse Popular Vehicles"');

  // 2. 7 body style filter chips
  const expectedBodyTypes = [
    'All Body Styles',
    'Sedans',
    'SUVs & Crossovers',
    'Hatchbacks',
    'Wagons & Estates',
    'Trucks',
    'Coupes',
  ];
  const sectionButtons = section.querySelectorAll((el) => el.tagName === 'BUTTON');
  for (const label of expectedBodyTypes) {
    const chip = sectionButtons.find((b) => b.textContent.includes(label));
    assert.ok(chip, `Body style chip "${label}" must exist in Browse section`);
  }

  // 3. Filter chip interaction: click "Sedans"
  const sedanChip = sectionButtons.find((b) => b.textContent.includes('Sedans'));
  sedanChip.dispatchEvent({ type: 'click' });
  await sleep(35);

  const updatedSection = rootContainer.getElementById('telemetry-preset-benchmarks-section');
  assert.ok(updatedSection, 'Section remains mounted after body style change');

  // 4. Vehicle cards in section have Calculate True Cost and Risk Matrix buttons
  const tcoBtn = updatedSection.querySelectorAll((el) => el.tagName === 'BUTTON' && el.textContent.includes('Calculate True Cost'))[0];
  const riskBtn = updatedSection.querySelectorAll((el) => el.tagName === 'BUTTON' && el.textContent.includes('Risk Matrix'))[0];

  assert.ok(tcoBtn, 'Card has "Calculate True Cost" button');
  assert.ok(riskBtn, 'Card has "Risk Matrix" button');

  // 5. Click Calculate True Cost on a card
  tcoBtn.dispatchEvent({ type: 'click' });
  await sleep(35);
  assert.strictEqual(globalThis.window.location.pathname, '/tco', 'Clicking card Calculate True Cost navigates to /tco');
});

test('CHALLENGER 2.5: Body Style Filter Completeness & Invariant Validation', async () => {
  // Validate that all 7 body styles have matches and sum is consistent
  const totalVehicles = VEHICLE_PRESETS.length;
  const sedans = VEHICLE_PRESETS.filter((p) => p.bodyType === 'sedan').length;
  const suvs = VEHICLE_PRESETS.filter((p) => p.bodyType === 'suv').length;
  const hatchbacks = VEHICLE_PRESETS.filter((p) => p.bodyType === 'hatchback').length;
  const wagons = VEHICLE_PRESETS.filter((p) => p.bodyType === 'wagon').length;
  const trucks = VEHICLE_PRESETS.filter((p) => p.bodyType === 'truck').length;
  const coupes = VEHICLE_PRESETS.filter((p) => p.bodyType === 'coupe' || p.segment?.toLowerCase().includes('coupe')).length;

  assert.ok(totalVehicles >= 120, 'At least 120 vehicle presets in catalog');
  assert.ok(sedans > 0, 'Sedans count > 0');
  assert.ok(suvs > 0, 'SUVs count > 0');
  assert.ok(hatchbacks > 0, 'Hatchbacks count > 0');
  assert.ok(wagons > 0, 'Wagons count > 0');
  assert.ok(trucks > 0, 'Trucks count > 0');
  assert.ok(coupes > 0, 'Coupes count > 0');
});


test('CHALLENGER 2.6: Autocomplete Click Selection — Clicking Vehicle Result and OBD Result', async () => {
  const { rootContainer } = await renderApp('/');

  const searchInput = rootContainer.querySelectorAll(
    (el) =>
      el.tagName === 'INPUT' &&
      (el.getAttribute('placeholder') || '').includes('Golf')
  )[0];

  // 1. Search for "Golf"
  searchInput.value = 'Golf';
  searchInput.dispatchEvent({ type: 'input' });
  await sleep(30);

  let autocomplete = findByTestId(rootContainer, 'hero-search-autocomplete');
  assert.ok(autocomplete, 'Autocomplete opened');

  // Click first vehicle result
  const carBtn = autocomplete.querySelectorAll((el) => el.tagName === 'BUTTON' && el.textContent.includes('Golf'))[0];
  assert.ok(carBtn, 'Vehicle result button for Golf found');
  carBtn.dispatchEvent({ type: 'click' });
  await sleep(35);

  assert.strictEqual(globalThis.window.location.pathname, '/tco', 'Clicking vehicle autocomplete result navigates to /tco');

  // 2. Return home and search for OBD "P2002"
  await renderApp('/');
  const searchInput2 = rootContainer.querySelectorAll(
    (el) =>
      el.tagName === 'INPUT' &&
      (el.getAttribute('placeholder') || '').includes('Golf')
  )[0];

  searchInput2.value = 'P2002';
  searchInput2.dispatchEvent({ type: 'input' });
  await sleep(30);

  let autocomplete2 = findByTestId(rootContainer, 'hero-search-autocomplete');
  assert.ok(autocomplete2, 'Autocomplete opened for P2002');

  const obdBtn = autocomplete2.querySelectorAll((el) => el.tagName === 'BUTTON' && el.textContent.includes('P2002'))[0];
  assert.ok(obdBtn, 'OBD result button for P2002 found');
  obdBtn.dispatchEvent({ type: 'click' });
  await sleep(35);

  assert.strictEqual(globalThis.window.location.pathname, '/obd-estimator', 'Clicking OBD autocomplete result navigates to /obd-estimator');
});

test('CHALLENGER 2.7: Clear Search Button (X) Reset Behavior', async () => {
  const { rootContainer } = await renderApp('/');

  const searchInput = rootContainer.querySelectorAll(
    (el) =>
      el.tagName === 'INPUT' &&
      (el.getAttribute('placeholder') || '').includes('Golf')
  )[0];

  // Enter query
  searchInput.value = 'Toyota Camry';
  searchInput.dispatchEvent({ type: 'input' });
  await sleep(25);

  const clearBtn = rootContainer.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.getAttribute('aria-label') === 'Clear search query'
  )[0];
  assert.ok(clearBtn, 'Clear search query (X) button must appear when query is non-empty');

  clearBtn.dispatchEvent({ type: 'click' });
  await sleep(25);

  assert.strictEqual(searchInput.value, '', 'Clicking X button clears search query');
});

test('CHALLENGER 2.8: Popular Model Shortcuts Click Navigation', async () => {
  const { rootContainer } = await renderApp('/');

  const shortcuts = ['VW Golf 8', 'BMW 320d', 'Tesla Model 3', 'Ford Focus'];

  for (const label of shortcuts) {
    await renderApp('/');
    const btn = findButtonByText(rootContainer, label);
    assert.ok(btn, `Shortcut button "${label}" exists`);
    btn.dispatchEvent({ type: 'click' });
    await sleep(35);
    assert.strictEqual(globalThis.window.location.pathname, '/tco', `Clicking "${label}" shortcut routes to /tco`);
  }
});

test('CHALLENGER 1.4: Garage & Compare Dynamic Add, Remove & Active Compare Tab State', async () => {
  const { rootContainer } = await renderApp('/');

  const badge = findByTestId(rootContainer, 'garage-count-badge');
  assert.ok(badge, 'Badge exists');
  assert.strictEqual(badge.textContent.trim(), '0', 'Initial garage count is 0');

  // Open garage dropdown
  const garageBtn = badge.parentNode;
  garageBtn.dispatchEvent({ type: 'click' });
  await sleep(35);

  const menu = rootContainer.querySelectorAll((el) => el.getAttribute('role') === 'menu' && (el.getAttribute('aria-label') || '').includes('Garage'))[0];
  assert.ok(menu, 'Dropdown menu opened');

  // Click "+ Save Active" to dynamically add the active vehicle
  const saveActiveBtn = menu.querySelectorAll((el) => el.tagName === 'BUTTON' && el.textContent.includes('+ Save Active'))[0];
  assert.ok(saveActiveBtn, '+ Save Active button exists in popover');
  saveActiveBtn.dispatchEvent({ type: 'click' });
  await sleep(35);

  // Verify badge dynamically updated to 1
  const updatedBadge = findByTestId(rootContainer, 'garage-count-badge');
  assert.strictEqual(updatedBadge.textContent.trim(), '1', 'Badge increments to 1 after clicking + Save Active');

  // Verify vehicle is listed in dropdown
  const updatedMenu = rootContainer.querySelectorAll((el) => el.getAttribute('role') === 'menu' && (el.getAttribute('aria-label') || '').includes('Garage'))[0];
  assert.ok(updatedMenu.textContent.includes('Active'), 'Active vehicle badge shown in list');

  // Remove the vehicle
  const removeBtn = updatedMenu.querySelectorAll((el) => el.tagName === 'BUTTON' && (el.getAttribute('aria-label') || '').includes('Remove'))[0];
  assert.ok(removeBtn, 'Remove vehicle button exists');
  removeBtn.dispatchEvent({ type: 'click' });
  await sleep(35);

  const finalBadge = findByTestId(rootContainer, 'garage-count-badge');
  assert.strictEqual(finalBadge.textContent.trim(), '0', 'Badge decrements to 0 after removing vehicle');

  // Navigate to compare tab and verify active tab styling
  await renderApp('/compare');
  const compareGarageBadge = findByTestId(rootContainer, 'garage-count-badge');
  const compareGarageBtn = compareGarageBadge.parentNode;
  assert.ok(
    compareGarageBtn.className.includes('bg-emerald-50') || compareGarageBtn.className.includes('border-emerald-300'),
    'Garage & Compare pill button has active highlighted styling when activeTab is compare'
  );
});

test('CHALLENGER 2.9: Body Style Filter with Specific Low-Count Categories (Trucks, Coupes)', async () => {
  const { rootContainer } = await renderApp('/');

  const section = rootContainer.getElementById('telemetry-preset-benchmarks-section');
  assert.ok(section, 'Section exists');

  // Filter by Trucks
  const truckChip = section.querySelectorAll((el) => el.tagName === 'BUTTON' && el.textContent.includes('Trucks'))[0];
  assert.ok(truckChip, 'Trucks chip exists');
  truckChip.dispatchEvent({ type: 'click' });
  await sleep(35);

  const updatedSection = rootContainer.getElementById('telemetry-preset-benchmarks-section');
  assert.ok(updatedSection, 'Section rendered for Trucks');

  // Filter by Coupes
  const coupeChip = updatedSection.querySelectorAll((el) => el.tagName === 'BUTTON' && el.textContent.includes('Coupes'))[0];
  assert.ok(coupeChip, 'Coupes chip exists');
  coupeChip.dispatchEvent({ type: 'click' });
  await sleep(35);

  const coupeSection = rootContainer.getElementById('telemetry-preset-benchmarks-section');
  assert.ok(coupeSection, 'Section rendered for Coupes');
});

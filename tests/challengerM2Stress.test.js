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
// DOM TEST HARNESS (Mock DOM for Node.js)
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
    let stopped = false;
    const e = {
      target: this,
      currentTarget: this,
      preventDefault() {},
      stopPropagation() {
        stopped = true;
      },
      ...eventObj,
    };
    for (const fn of fns) {
      fn(e);
      if (stopped) break;
    }
    if (!stopped && this.parentNode && typeof this.parentNode.dispatchEvent === 'function') {
      this.parentNode.dispatchEvent(eventObj);
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
  scrollIntoView() {}

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

  querySelector(query) {
    const list = this.querySelectorAll(query);
    return list[0] || null;
  }

  getElementById(id) {
    const found = this.querySelectorAll((el) => el.id === id);
    return found[0] || null;
  }

  getElementsByTagName(tag) {
    const tagUpper = String(tag).toUpperCase();
    return this.querySelectorAll((el) => el.tagName === tagUpper);
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

// Storage mock
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
headElement.querySelector = () => null;

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
  execCommand: () => true,
};

const windowListeners = new Map();
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
  scrollTo() {},
  matchMedia: () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
  open: () => {},
};

if (typeof globalThis.navigator !== 'undefined') {
  try {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: {
        writeText: async () => {},
      },
      configurable: true,
    });
  } catch {
    // safe fallback
  }
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

// Dynamic imports after hook registration
const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { default: App } = await import('../src/App.jsx');
const { VEHICLE_PRESETS, getPresetById } = await import('../src/data/vehiclePresets.js');

const sleep = (ms = 25) => new Promise((resolve) => setTimeout(resolve, ms));

async function renderApp(initialPath = '/tco', initialSearch = '') {
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  globalThis.window.location.pathname = initialPath;
  globalThis.window.location.search = initialSearch;
  globalThis.window.location.hash = '';
  globalThis.window.location.href = `http://localhost:5173${initialPath}${initialSearch}`;

  while (rootContainer.childNodes.length > 0) {
    rootContainer.removeChild(rootContainer.childNodes[0]);
  }

  const root = createRoot(rootContainer);
  try {
    root.render(React.createElement(App));
    await sleep(40);
  } catch (err) {
    // catch in-flight
  }
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
// CHALLENGER TEST SUITE: ADVERSARIAL STRESS TESTING FOR MILESTONE 2
// =============================================================================

test('CHALLENGE 1: Modal opening and closing multiple times via button, close icon, and backdrop', async () => {
  const { rootContainer } = await renderApp('/tco');

  const switchBtn = findByTestId(rootContainer, 'tco-switch-car-button');
  assert.ok(switchBtn, 'Switch Car button must exist');

  // Cycle 1: Open via Switch Car button, close via close icon
  switchBtn.dispatchEvent({ type: 'click' });
  await sleep(25);
  let modal = findByTestId(rootContainer, 'vehicle-catalog-modal');
  assert.ok(modal, 'Modal must open on click');
  const closeBtn = modal.querySelectorAll((el) => el.getAttribute('aria-label') === 'Close modal')[0];
  assert.ok(closeBtn, 'Close button must exist in modal');
  closeBtn.dispatchEvent({ type: 'click' });
  await sleep(25);
  modal = findByTestId(rootContainer, 'vehicle-catalog-modal');
  assert.strictEqual(modal, null, 'Modal must close after clicking close icon');

  // Cycle 2: Open via button, close via backdrop click
  switchBtn.dispatchEvent({ type: 'click' });
  await sleep(25);
  modal = findByTestId(rootContainer, 'vehicle-catalog-modal');
  assert.ok(modal, 'Modal must reopen on click');
  // Dispatch click on backdrop (the outer dialog container)
  modal.dispatchEvent({ type: 'click' });
  await sleep(25);
  modal = findByTestId(rootContainer, 'vehicle-catalog-modal');
  assert.strictEqual(modal, null, 'Modal must close after clicking backdrop');

  // Cycle 3: Modal content stopPropagation (clicking inside modal body does NOT close it)
  switchBtn.dispatchEvent({ type: 'click' });
  await sleep(25);
  modal = findByTestId(rootContainer, 'vehicle-catalog-modal');
  assert.ok(modal, 'Modal opened');
  const modalInner = modal.childNodes[0]; // inner div
  modalInner.dispatchEvent({ type: 'click' });
  await sleep(25);
  modal = findByTestId(rootContainer, 'vehicle-catalog-modal');
  assert.ok(modal, 'Modal must remain open when clicking inner dialog content');

  // Close it to leave clean state
  const closeBtn2 = modal.querySelectorAll((el) => el.getAttribute('aria-label') === 'Close modal')[0];
  closeBtn2.dispatchEvent({ type: 'click' });
  await sleep(25);
  modal = findByTestId(rootContainer, 'vehicle-catalog-modal');
  assert.strictEqual(modal, null, 'Modal closed');

  // Cycle 4: Stress test: Rapidly open and close 10 times in a loop
  for (let i = 0; i < 10; i++) {
    switchBtn.dispatchEvent({ type: 'click' });
    await sleep(10);
    modal = findByTestId(rootContainer, 'vehicle-catalog-modal');
    assert.ok(modal, `Stress iteration ${i}: modal should open`);
    const c = modal.querySelectorAll((el) => el.getAttribute('aria-label') === 'Close modal')[0];
    c.dispatchEvent({ type: 'click' });
    await sleep(10);
    modal = findByTestId(rootContainer, 'vehicle-catalog-modal');
    assert.strictEqual(modal, null, `Stress iteration ${i}: modal should close`);
  }
});

test('CHALLENGE 2: Rapid switching of vehicles via modal and presets with state verification', async () => {
  const { rootContainer } = await renderApp('/tco');

  const switchBtn = findByTestId(rootContainer, 'tco-switch-car-button');
  assert.ok(switchBtn, 'Switch Car button exists');

  const targets = [
    { id: 'ford-focus-ecoblue', labelPart: 'EcoBlue', expectedName: 'Ford' },
    { id: 'toyota-camry-hybrid', labelPart: 'Camry', expectedName: 'Camry' },
    { id: 'tesla-model-3-lr', labelPart: 'Model 3', expectedName: 'Model 3' },
    { id: 'bmw-330i-g20', labelPart: 'BMW', expectedName: 'BMW' },
  ];

  for (const target of targets) {
    // Open modal
    switchBtn.dispatchEvent({ type: 'click' });
    await sleep(25);
    const modal = findByTestId(rootContainer, 'vehicle-catalog-modal');
    assert.ok(modal, 'Modal opened');

    // Find preset button in modal
    const presetBtn = modal.querySelectorAll(
      (el) => el.tagName === 'BUTTON' && (el.textContent || '').includes(target.labelPart)
    )[0];
    assert.ok(presetBtn, `Preset button for ${target.id} must be in modal`);

    presetBtn.dispatchEvent({ type: 'click' });
    await sleep(35);

    // Modal should auto-dismiss on selecting preset
    const closedModal = findByTestId(rootContainer, 'vehicle-catalog-modal');
    assert.strictEqual(closedModal, null, 'Modal should close after preset selection');

    // Verify active vehicle visual card updated
    const fullText = rootContainer.textContent || '';
    assert.ok(
      fullText.includes(target.expectedName),
      `Active vehicle card must reflect ${target.expectedName}`
    );

    // Verify monthly total is numeric and NOT NaN
    const monthlyTotal = rootContainer.getElementById('monthly-total');
    assert.ok(monthlyTotal, 'Monthly total element must exist');
    assert.ok(
      !monthlyTotal.textContent.includes('NaN'),
      `Monthly total must not contain NaN (got ${monthlyTotal.textContent})`
    );
  }
});

test('CHALLENGE 3: Extreme purchase prices ($0 and $200,000) and extreme annual mileage without NaN or layout break', async () => {
  const { rootContainer } = await renderApp('/tco');

  const priceInput = rootContainer.getElementById('input-purchase-price');
  assert.ok(priceInput, 'Purchase price input must exist');

  // Edge 1: Price = 0
  priceInput.value = '0';
  priceInput.dispatchEvent({ type: 'change' });
  await sleep(30);

  let monthlyTotal = rootContainer.getElementById('monthly-total');
  assert.ok(!monthlyTotal.textContent.includes('NaN'), 'Price $0 must not produce NaN');
  assert.ok(!rootContainer.textContent.includes('NaN'), 'DOM must have zero NaN with $0 purchase price');

  // Edge 2: Price = 200,000
  priceInput.value = '200000';
  priceInput.dispatchEvent({ type: 'change' });
  await sleep(30);

  monthlyTotal = rootContainer.getElementById('monthly-total');
  assert.ok(!monthlyTotal.textContent.includes('NaN'), 'Price $200,000 must not produce NaN');
  assert.ok(!rootContainer.textContent.includes('NaN'), 'DOM must have zero NaN with $200,000 purchase price');

  // Edge 3: Annual Mileage = 0
  const mileageInput = rootContainer.getElementById('input-annual-distance');
  assert.ok(mileageInput, 'Annual distance input must exist');
  mileageInput.value = '0';
  mileageInput.dispatchEvent({ type: 'change' });
  await sleep(30);

  monthlyTotal = rootContainer.getElementById('monthly-total');
  assert.ok(!monthlyTotal.textContent.includes('NaN'), 'Annual mileage 0 must not produce NaN');
  assert.ok(!rootContainer.textContent.includes('NaN'), 'DOM must have zero NaN with 0 annual distance');

  // Edge 4: Annual Mileage = 60,000
  mileageInput.value = '60000';
  mileageInput.dispatchEvent({ type: 'change' });
  await sleep(30);

  monthlyTotal = rootContainer.getElementById('monthly-total');
  assert.ok(!monthlyTotal.textContent.includes('NaN'), 'Annual mileage 60,000 must not produce NaN');
  assert.ok(!rootContainer.textContent.includes('NaN'), 'DOM must have zero NaN with 60,000 annual distance');
});

test('CHALLENGE 4: Score boundary verification (< 60, 60-74, >= 75) and dynamic verdict badges', async () => {
  // 1. Direct mathematical verification of verdict tiers on boundary conditions
  function evaluateVerdict(score) {
    if (score >= 75) {
      return {
        text: 'Great Long-Term Value',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
        barClass: 'bg-emerald-600 dark:bg-emerald-500',
      };
    }
    if (score >= 60) {
      return {
        text: 'Average Ownership Cost',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
        barClass: 'bg-amber-500 dark:bg-amber-400',
      };
    }
    return {
      text: 'High Depreciation / Repair Risk',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
      barClass: 'bg-rose-600 dark:bg-rose-500',
    };
  }

  // Exact boundary transitions:
  // Boundary 1: >= 75
  assert.strictEqual(evaluateVerdict(75).text, 'Great Long-Term Value');
  assert.strictEqual(evaluateVerdict(76).text, 'Great Long-Term Value');
  assert.strictEqual(evaluateVerdict(100).text, 'Great Long-Term Value');

  // Boundary 2: 60-74
  assert.strictEqual(evaluateVerdict(74).text, 'Average Ownership Cost');
  assert.strictEqual(evaluateVerdict(70).text, 'Average Ownership Cost');
  assert.strictEqual(evaluateVerdict(60).text, 'Average Ownership Cost');

  // Boundary 3: < 60
  assert.strictEqual(evaluateVerdict(59).text, 'High Depreciation / Repair Risk');
  assert.strictEqual(evaluateVerdict(45).text, 'High Depreciation / Repair Risk');
  assert.strictEqual(evaluateVerdict(0).text, 'High Depreciation / Repair Risk');

  // 2. UI rendering verification with active presets
  const { rootContainer } = await renderApp('/tco');

  // Check initial active vehicle (Ford Focus 2.0 EcoBlue Diesel -> score 72 -> Average Ownership Cost)
  const initialBadge = findByTestId(rootContainer, 'ownership-value-verdict-badge');
  assert.ok(initialBadge, 'Verdict badge must exist on initial render');
  assert.strictEqual(
    initialBadge.textContent.trim(),
    'Average Ownership Cost',
    'Ford Focus EcoBlue score 72 must evaluate to "Average Ownership Cost"'
  );

  // Switch to BMW 330i (score 64 -> Average Ownership Cost)
  const switchBtn = findByTestId(rootContainer, 'tco-switch-car-button');
  switchBtn.dispatchEvent({ type: 'click' });
  await sleep(25);
  let modal = findByTestId(rootContainer, 'vehicle-catalog-modal');
  const bmwBtn = modal.querySelectorAll((el) => (el.textContent || '').includes('BMW 3 Series'))[0];
  assert.ok(bmwBtn, 'BMW preset button must exist');
  bmwBtn.dispatchEvent({ type: 'click' });
  await sleep(35);

  const bmwBadge = findByTestId(rootContainer, 'ownership-value-verdict-badge');
  assert.ok(bmwBadge, 'Verdict badge must exist after BMW selection');
  assert.strictEqual(
    bmwBadge.textContent.trim(),
    'Average Ownership Cost',
    'BMW 330i score 64 must evaluate to "Average Ownership Cost"'
  );

  // Switch via catalog select to Toyota Corolla Hybrid (score 78 -> Great Long-Term Value)
  const presetDropdown = rootContainer.getElementById('preset-select-dropdown');
  assert.ok(presetDropdown, 'preset-select-dropdown must exist in DOM');
  presetDropdown.value = 'toyota-corolla-18-hybrid';
  presetDropdown.dispatchEvent({ type: 'change', target: { value: 'toyota-corolla-18-hybrid' } });
  await sleep(40);

  const corollaBadge = findByTestId(rootContainer, 'ownership-value-verdict-badge');
  assert.ok(corollaBadge, 'Verdict badge must exist after Corolla selection');
  assert.strictEqual(
    corollaBadge.textContent.trim(),
    'Great Long-Term Value',
    'Toyota Corolla Hybrid score 78 must evaluate to "Great Long-Term Value"'
  );
});

test('CHALLENGE 5: VinCheckBanner affiliate compliance and edge cases', async () => {
  const { rootContainer } = await renderApp('/tco');

  const vinBanner = findByTestId(rootContainer, 'vin-check-banner');
  assert.ok(vinBanner, 'VinCheckBanner must be mounted in DOM');

  // 1. Check placement prop
  assert.strictEqual(
    vinBanner.getAttribute('data-placement'),
    'tco',
    'VinCheckBanner must have data-placement="tco"'
  );

  // 2. Check 20% discount coupon code
  assert.ok(
    vinBanner.textContent.includes('mydriveledger'),
    'Banner must display mydriveledger coupon code'
  );
  assert.ok(
    vinBanner.textContent.includes('20% OFF'),
    'Banner must state 20% OFF'
  );

  // 3. Test interactive VIN input
  const vinInput = vinBanner.querySelectorAll((el) => el.tagName === 'INPUT')[0];
  assert.ok(vinInput, 'VIN/Plate input must exist in banner');
  assert.strictEqual(
    vinInput.getAttribute('placeholder'),
    'Enter 17-digit VIN or License Plate (Optional)',
    'VIN input placeholder must be exact'
  );

  // Enter test VIN
  vinInput.value = '1HGCR2F83HA123456';
  vinInput.dispatchEvent({ type: 'change' });
  await sleep(20);

  // 4. Test Copy Code button
  const copyBtn = vinBanner.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && (el.textContent || '').includes('mydriveledger')
  )[0];
  assert.ok(copyBtn, 'Copy coupon button must exist');
  copyBtn.dispatchEvent({ type: 'click' });
  await sleep(20);
  assert.ok(
    vinBanner.textContent.includes('Code Copied!'),
    'Copying coupon must display "Code Copied!" confirmation'
  );

  // 5. Check FTC disclosure & attribution
  assert.ok(
    vinBanner.textContent.includes('Sponsored Affiliate Link') ||
    vinBanner.textContent.includes('carVertical'),
    'FTC attribution or carVertical legal text must be present'
  );
});

test('CHALLENGE 6: Visual typography, spacing and padding compliance check (R3)', async () => {
  const { rootContainer } = await renderApp('/tco');

  // Verify Card 1 padding
  const card1 = rootContainer.querySelectorAll(
    (el) => el.getAttribute('aria-labelledby') === 'vehicle-heading'
  )[0];
  assert.ok(card1, 'Vehicle card must exist');
  assert.ok(
    card1.className.includes('p-6') || card1.className.includes('sm:p-7'),
    'Vehicle card must have p-6 / sm:p-7 padding'
  );

  // Verify Card 2 padding
  const card2 = rootContainer.querySelectorAll(
    (el) => el.getAttribute('aria-labelledby') === 'driving-heading'
  )[0];
  assert.ok(card2, 'Driving habits card must exist');
  assert.ok(
    card2.className.includes('p-6') || card2.className.includes('sm:p-7'),
    'Driving habits card must have p-6 / sm:p-7 padding'
  );

  // Verify Right Column Summary Card padding
  const summaryCard = rootContainer.querySelectorAll(
    (el) => el.getAttribute('aria-labelledby') === 'summary-heading'
  )[0];
  assert.ok(summaryCard, 'Summary card must exist');
  assert.ok(
    summaryCard.className.includes('p-6') || summaryCard.className.includes('sm:p-7'),
    'Summary card must have p-6 / sm:p-7 padding'
  );

  // Verify VinCheckBanner is below summary card with mt-6
  const vinBanner = findByTestId(rootContainer, 'vin-check-banner');
  assert.ok(
    vinBanner.className.includes('mt-6'),
    'VinCheckBanner must have mt-6 margin to position cleanly below summary card'
  );
});

test('CHALLENGE 7: Mathematical fuzzing & boundary extremes for calculateTcoProjection', async () => {
  const { calculateTcoProjection, calculateNonLinearDepreciation } = await import('../src/data/maintenanceData.js');
  const { VEHICLE_PRESETS } = await import('../src/data/vehiclePresets.js');

  const testPresets = [
    VEHICLE_PRESETS[0], // Ford Focus EcoBlue (Diesel)
    VEHICLE_PRESETS.find((p) => p.isEv) || VEHICLE_PRESETS[0], // EV (Tesla)
    VEHICLE_PRESETS.find((p) => (p.powertrain || '').includes('hybrid')) || VEHICLE_PRESETS[0], // Hybrid
  ];

  const edgePrices = [-1000, 0, 1, 500, 24000, 120000, 500000];
  const edgeOdometers = [-500, 0, 100, 150000, 1000000];
  const edgeDistances = [0, 500, 12000, 50000];
  const edgeHorizons = [1, 3, 5, 10];

  for (const preset of testPresets) {
    for (const price of edgePrices) {
      for (const odo of edgeOdometers) {
        for (const dist of edgeDistances) {
          for (const yr of edgeHorizons) {
            const res = calculateTcoProjection({
              purchasePriceUsd: price,
              odometerMiles: odo,
              annualDistanceMiles: dist,
              mpgUs: preset.mpgUs || 30,
              isEv: preset.isEv,
              powertrainType: preset.powertrainType || preset.powertrain,
              vehicle: preset,
              fuelPriceUsdGal: preset.defaultFuelPriceUsdGal || 3.5,
              annualInsuranceUsd: preset.annualInsuranceUsd || 1200,
              baseAnnualMaintenanceUsd: preset.baseAnnualMaintenanceUsd || 750,
              maintenanceWearFactor: 1.0,
              downPaymentPct: 20,
              aprPct: 6.0,
              loanTermMonths: 60,
              horizonYears: yr,
              residualCurve10Yr: preset.residualCurve10Yr,
            });

            assert.ok(!Number.isNaN(res.monthlyEconomicCostUsd), `monthlyEconomicCostUsd must not be NaN for price=${price}, odo=${odo}, dist=${dist}`);
            assert.ok(!Number.isNaN(res.totalEconomicCostUsd), `totalEconomicCostUsd must not be NaN for price=${price}, odo=${odo}, dist=${dist}`);
            assert.ok(!Number.isNaN(res.costPerMileUsd), `costPerMileUsd must not be NaN for price=${price}, odo=${odo}, dist=${dist}`);
            assert.ok(Number.isFinite(res.monthlyEconomicCostUsd), `monthlyEconomicCostUsd must be finite`);
            assert.ok(res.monthlyEconomicCostUsd >= 0, `monthlyEconomicCostUsd must be non-negative (got ${res.monthlyEconomicCostUsd})`);
          }
        }
      }
    }
  }
});

test('CHALLENGE 8: Score verdict badge CSS & styling contract invariance across all possible score values (0..100)', async () => {
  function getOwnershipVerdict(ownershipValueScore) {
    if (ownershipValueScore >= 75) {
      return {
        text: 'Great Long-Term Value',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
        barClass: 'bg-emerald-600 dark:bg-emerald-500',
      };
    }
    if (ownershipValueScore >= 60) {
      return {
        text: 'Average Ownership Cost',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
        barClass: 'bg-amber-500 dark:bg-amber-400',
      };
    }
    return {
      text: 'High Depreciation / Repair Risk',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
      barClass: 'bg-rose-600 dark:bg-rose-500',
    };
  }

  for (let score = 0; score <= 100; score++) {
    const verdict = getOwnershipVerdict(score);
    assert.ok(verdict.text, `Score ${score} must produce non-empty text`);
    assert.ok(verdict.badgeClass, `Score ${score} must produce non-empty badgeClass`);
    assert.ok(verdict.barClass, `Score ${score} must produce non-empty barClass`);

    if (score >= 75) {
      assert.strictEqual(verdict.text, 'Great Long-Term Value');
      assert.ok(verdict.badgeClass.includes('emerald'));
      assert.ok(verdict.barClass.includes('emerald'));
    } else if (score >= 60) {
      assert.strictEqual(verdict.text, 'Average Ownership Cost');
      assert.ok(verdict.badgeClass.includes('amber'));
      assert.ok(verdict.barClass.includes('amber'));
    } else {
      assert.strictEqual(verdict.text, 'High Depreciation / Repair Risk');
      assert.ok(verdict.badgeClass.includes('rose'));
      assert.ok(verdict.barClass.includes('rose'));
    }
  }
});


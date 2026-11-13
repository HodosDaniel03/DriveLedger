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

// Global Storage
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
headElement.querySelector = (selector) => {
  if (typeof selector === 'string' && selector.startsWith('meta[')) {
    const match = selector.match(/meta\[([a-zA-Z0-9_-]+)="([^"]+)"\]/);
    if (match) {
      return (
        headElement.childNodes.find(
          (c) => c.tagName === 'META' && c.getAttribute(match[1]) === match[2]
        ) || null
      );
    }
  }
  if (typeof selector === 'string' && selector.startsWith('link[')) {
    const match = selector.match(/link\[rel="([^"]+)"\]/);
    if (match) {
      return (
        headElement.childNodes.find(
          (c) => c.tagName === 'LINK' && c.getAttribute('rel') === match[1]
        ) || null
      );
    }
  }
  return null;
};

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
};

const windowListeners = new Map();
globalThis.window = {
  location: {
    pathname: '/',
    search: '',
    hash: '',
    href: 'http://localhost:5173/',
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
const { default: App } = await import('../src/App.jsx');

const sleep = (ms = 25) => new Promise((resolve) => setTimeout(resolve, ms));

async function renderApp(initialPath = '/', initialSearch = '', initialHash = '') {
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
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
    await sleep(35);
  } catch (err) {
    // catch initial render errors if any
  }
  return { root, rootContainer };
}

function findByTestId(container, testId) {
  const elements = container.querySelectorAll(
    (el) => el.getAttribute('data-testid') === testId
  );
  return elements[0] || null;
}

// =============================================================================
// CHALLENGER TEST 1: Rapid Clicking / Toggling of Live Telemetry Toggle
// =============================================================================

test('CHALLENGER-1: Rapid clicking/toggling of live telemetry toggle causes no state corruption or crash', async () => {
  const { rootContainer } = await renderApp('/obd-estimator', '?code=P2002');

  const toggle = findByTestId(rootContainer, 'live-pid-toggle');
  assert.ok(toggle, 'Live telemetry toggle must exist');
  assert.ok(
    toggle.textContent.includes('▾'),
    'Toggle chevron must be down ▾ initially'
  );

  const collapseContainer = rootContainer.getElementById('live-telemetry-sliders-collapse');
  assert.ok(collapseContainer, 'Collapse container must exist in DOM even when collapsed');
  assert.ok(
    collapseContainer.className.includes('max-h-0'),
    'Collapse container must have closed styles (max-h-0) initially'
  );

  // Rapid toggling 20 times in quick succession
  for (let i = 0; i < 20; i++) {
    toggle.dispatchEvent({ type: 'click' });
    await sleep(10);
  }

  // 20 toggles from false -> even number -> should be closed
  const collapseAfter20 = rootContainer.getElementById('live-telemetry-sliders-collapse');
  assert.ok(
    collapseAfter20.className.includes('max-h-0'),
    'Collapse container must remain closed after even number of rapid toggles'
  );

  // Toggle one more time -> true (expanded)
  toggle.dispatchEvent({ type: 'click' });
  await sleep(20);

  const openCollapse = rootContainer.getElementById('live-telemetry-sliders-collapse');
  assert.ok(
    openCollapse.className.includes('max-h-[1400px]'),
    'Collapse container must have open styles (max-h-[1400px]) when expanded'
  );

  // Ensure telemetry sliders are operable and do not corrupt calculations
  const slider = rootContainer.getElementById('pid-slider-dpf_diff_pressure');
  if (slider) {
    slider.value = '250';
    slider.dispatchEvent({ type: 'input' });
    await sleep(25);

    // Verify summary card updated
    const summaryCard = rootContainer.getElementById('workshop-summary-heading')?.parentNode;
    assert.ok(summaryCard, 'Workshop summary card must remain mounted');
    const summaryText = summaryCard.textContent || '';
    assert.ok(
      summaryText.includes('WORKSHOP COST SUMMARY'),
      'Workshop summary card must remain healthy after rapid toggle and slider update'
    );
  }
});

// =============================================================================
// CHALLENGER TEST 2: Rapid Clicking / Toggling of Root Causes Expansion Rows
// =============================================================================

test('CHALLENGER-2: Rapid alternating clicking of root causes rows maintains mutual exclusion & state integrity', async () => {
  const { rootContainer } = await renderApp('/obd-estimator', '?code=P2002');

  const rootCausesCard = rootContainer.querySelectorAll(
    (el) => el.getAttribute('aria-labelledby') === 'causes-heading'
  )[0];
  assert.ok(rootCausesCard, 'Root causes card must be present');

  const rowButtons = rootCausesCard.querySelectorAll((el) => el.tagName === 'BUTTON');
  assert.ok(rowButtons.length >= 4, 'Must have at least 4 root causes rows');

  // Verify all initially collapsed (max-h-0)
  for (let i = 0; i < 4; i++) {
    const detail = rootContainer.getElementById(`root-cause-detail-${i}`);
    assert.ok(detail, `Detail container root-cause-detail-${i} must exist in DOM`);
    assert.ok(
      detail.className.includes('max-h-0'),
      `Row ${i} must initially be collapsed (max-h-0)`
    );
  }

  // Click row 0: should expand row 0
  rowButtons[0].dispatchEvent({ type: 'click' });
  await sleep(25);
  const detail0 = rootContainer.getElementById('root-cause-detail-0');
  assert.ok(detail0.className.includes('max-h-[1400px]'), 'Row 0 must expand to max-h-[1400px]');

  // Click row 1: should expand row 1 and collapse row 0
  rowButtons[1].dispatchEvent({ type: 'click' });
  await sleep(25);
  const detail0After = rootContainer.getElementById('root-cause-detail-0');
  const detail1After = rootContainer.getElementById('root-cause-detail-1');
  assert.ok(detail0After.className.includes('max-h-0'), 'Row 0 must collapse when Row 1 is clicked');
  assert.ok(detail1After.className.includes('max-h-[1400px]'), 'Row 1 must expand when clicked');

  // Click row 1 again: should collapse row 1
  rowButtons[1].dispatchEvent({ type: 'click' });
  await sleep(25);
  const detail1Final = rootContainer.getElementById('root-cause-detail-1');
  assert.ok(detail1Final.className.includes('max-h-0'), 'Row 1 must collapse when clicked again');

  // Verify child details still mounted in DOM (never conditionally unmounted)
  for (let i = 0; i < 4; i++) {
    const detail = rootContainer.getElementById(`root-cause-detail-${i}`);
    assert.ok(detail, `Detail container root-cause-detail-${i} must remain mounted in DOM`);
    assert.ok(detail.textContent.includes('Parts:') || detail.textContent.includes('Labour:'),
      `Row ${i} text must remain in DOM`);
  }
});

// =============================================================================
// CHALLENGER TEST 3: Affiliate Link Attributes Audit
// =============================================================================

test('CHALLENGER-3: Carly CTA link and all partner anchors contain rel="sponsored noopener noreferrer" and target="_blank"', async () => {
  const { rootContainer: obdDom } = await renderApp('/obd-estimator', '?code=P2002');

  // Find all external anchors in OBD Estimator
  const anchors = obdDom.querySelectorAll(
    (el) => el.tagName === 'A' && (el.getAttribute('href') || '').startsWith('http')
  );

  assert.ok(anchors.length > 0, 'Must have external partner anchors in OBD Estimator');

  let carlyCtaFound = false;
  for (const a of anchors) {
    const href = a.getAttribute('href') || '';
    const rel = a.getAttribute('rel') || '';
    const target = a.getAttribute('target') || '';

    // Verify rel attributes
    assert.ok(
      rel.includes('sponsored'),
      `Anchor ${href} must have rel including "sponsored" (got: "${rel}")`
    );
    assert.ok(
      rel.includes('noopener'),
      `Anchor ${href} must have rel including "noopener" (got: "${rel}")`
    );
    assert.ok(
      rel.includes('noreferrer'),
      `Anchor ${href} must have rel including "noreferrer" (got: "${rel}")`
    );

    // Verify target
    assert.strictEqual(
      target,
      '_blank',
      `Anchor ${href} must have target="_blank"`
    );

    // Verify Carly / Scanner CTA copy
    if (a.textContent.includes("Don't have a scanner yet?")) {
      carlyCtaFound = true;
    }
  }

  assert.ok(carlyCtaFound, 'Carly / Scanner CTA adjacent to live telemetry toggle must be audited');

  // Check TCO carVertical banner anchor
  const { rootContainer: tcoDom } = await renderApp('/tco');
  const tcoAnchors = tcoDom.querySelectorAll(
    (el) => el.tagName === 'A' && (el.getAttribute('href') || '').includes('carvertical.deal')
  );
  assert.ok(tcoAnchors.length > 0, 'carVertical external anchor must exist in TCO');
  for (const a of tcoAnchors) {
    const rel = a.getAttribute('rel') || '';
    const target = a.getAttribute('target') || '';
    assert.strictEqual(target, '_blank', 'carVertical anchor must have target="_blank"');
    assert.ok(rel.includes('sponsored') && rel.includes('noopener') && rel.includes('noreferrer'),
      'carVertical anchor must have rel="sponsored noopener noreferrer"');
  }
});

// =============================================================================
// CHALLENGER TEST 4: Keyboard / Assistive Navigation Accessibility on Triggers
// =============================================================================

test('CHALLENGER-4: Keyboard / Assistive Navigation accessibility on accordion triggers (button role, type="button")', async () => {
  const { rootContainer: obdDom } = await renderApp('/obd-estimator', '?code=P2002');

  // 1. Live PID toggle
  const livePidToggle = findByTestId(obdDom, 'live-pid-toggle');
  assert.ok(livePidToggle, 'live-pid-toggle must exist');
  assert.strictEqual(livePidToggle.tagName, 'BUTTON', 'Must be a native <button>');
  assert.strictEqual(livePidToggle.getAttribute('type'), 'button', 'Must have type="button" to prevent form submission');

  // 2. Root causes buttons
  const rootCausesCard = obdDom.querySelectorAll(
    (el) => el.getAttribute('aria-labelledby') === 'causes-heading'
  )[0];
  const rcButtons = rootCausesCard.querySelectorAll((el) => el.tagName === 'BUTTON');
  assert.ok(rcButtons.length >= 4);
  for (const b of rcButtons) {
    assert.strictEqual(b.tagName, 'BUTTON', 'Root causes triggers must be <button>');
    assert.strictEqual(b.getAttribute('type'), 'button', 'Root causes triggers must have type="button"');
  }

  // 3. ToolEditorialSection methodology accordion
  const { rootContainer: tcoDom } = await renderApp('/tco');
  const methodologyToggle = findByTestId(tcoDom, 'methodology-accordion-toggle');
  assert.ok(methodologyToggle, 'Methodology accordion toggle must exist');
  assert.strictEqual(methodologyToggle.tagName, 'BUTTON', 'Must be a <button>');
  assert.strictEqual(methodologyToggle.getAttribute('type'), 'button', 'Must have type="button"');

  // 4. TechnicalMethodologyGuide white paper toggle
  const guideSection = tcoDom.getElementById('methodology-guide');
  assert.ok(guideSection, '#methodology-guide must exist');
  const whitePaperToggle = guideSection.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && (el.textContent || '').includes('How We Calculate This & Engineering Methodology')
  )[0];
  assert.ok(whitePaperToggle, 'White paper toggle button must exist');
  assert.strictEqual(whitePaperToggle.getAttribute('type'), 'button', 'Must have type="button"');
});

// =============================================================================
// CHALLENGER TEST 5: Tab Switch & Dynamic Telemetry Stress
// =============================================================================

test('CHALLENGER-5: Navigating between tabs after toggling states leaves 0 residue or unmounting errors', async () => {
  const { rootContainer } = await renderApp('/obd-estimator', '?code=P2002');

  // Open live telemetry
  const toggle = findByTestId(rootContainer, 'live-pid-toggle');
  toggle.dispatchEvent({ type: 'click' });
  await sleep(15);
  const openCollapse = rootContainer.getElementById('live-telemetry-sliders-collapse');
  assert.ok(openCollapse.className.includes('max-h-[1400px]'), 'Must be open after click');

  // Navigate to TCO tab
  const tcoTab = rootContainer.getElementById('tab-tco');
  if (tcoTab) {
    tcoTab.dispatchEvent({ type: 'click' });
    await sleep(25);
    assert.strictEqual(globalThis.window.location.pathname, '/tco');
  }

  // Navigate back to OBD tab
  const obdTab = rootContainer.getElementById('tab-obd');
  if (obdTab) {
    obdTab.dispatchEvent({ type: 'click' });
    await sleep(25);
    assert.strictEqual(globalThis.window.location.pathname, '/obd-estimator');
  }

  // Live telemetry toggle should be back to clean default (collapsed)
  const newToggle = findByTestId(rootContainer, 'live-pid-toggle');
  assert.ok(newToggle, 'Live telemetry toggle re-mounts cleanly');
  assert.ok(newToggle.textContent.includes('▾'), 'Resets cleanly to default chevron ▾');
});

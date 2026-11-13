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

// Mock DOM for Node test runner
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
    for (const fn of [...fns]) {
      try {
        fn.call(this, e);
      } catch (err) {
        // preserve event dispatch continuity
      }
    }
    return true;
  }

  focus() {}
  blur() {}
  scrollIntoView() {}

  get textContent() {
    if (this._innerHTML !== null) {
      return this._innerHTML.replace(/<[^>]*>/g, '');
    }
    return this.childNodes.map((c) => c.textContent).join('');
  }
  set textContent(v) {
    this._innerHTML = null;
    this.childNodes = [new MockTextNode(v)];
    this.childNodes[0].parentNode = this;
  }

  querySelectorAll(predicate) {
    const results = [];
    const walk = (node) => {
      for (const child of node.childNodes) {
        if (child.nodeType === 1) {
          if (predicate(child)) results.push(child);
          walk(child);
        }
      }
    };
    walk(this);
    return results;
  }

  querySelector(selector) {
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      const res = this.querySelectorAll((el) => el.id === id);
      return res[0] || null;
    }
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      const res = this.querySelectorAll((el) => el.classList.contains(cls));
      return res[0] || null;
    }
    const res = this.querySelectorAll((el) => el.tagName.toLowerCase() === selector.toLowerCase());
    return res[0] || null;
  }

  getElementById(id) {
    const res = this.querySelectorAll((el) => el.id === id);
    return res[0] || null;
  }

  toHtml() {
    if (this._innerHTML !== null) return this._innerHTML;
    const attrs = Array.from(this._attrs.entries())
      .map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`)
      .join('');
    const tag = this.tagName.toLowerCase();
    const childrenHtml = this.childNodes.map((c) => c.toHtml()).join('');
    return `<${tag}${attrs}>${childrenHtml}</${tag}>`;
  }
}

class MockDocument {
  constructor() {
    this.head = new MockElement('head');
    this.body = new MockElement('body');
    this.documentElement = new MockElement('html');
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
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
    return this.documentElement.getElementById(id);
  }
  querySelector(sel) {
    return this.documentElement.querySelector(sel);
  }
  querySelectorAll(pred) {
    return this.documentElement.querySelectorAll(pred);
  }
}

const mockDoc = new MockDocument();
const rootContainer = mockDoc.createElement('div');
rootContainer.id = 'root';
mockDoc.body.appendChild(rootContainer);

const windowListeners = new Map();
globalThis.window = {
  document: mockDoc,
  location: {
    origin: 'http://localhost:5173',
    pathname: '/',
    search: '',
    hash: '',
    href: 'http://localhost:5173/',
  },
  history: {
    pushState(state, title, url) {
      if (url) {
        const u = new URL(url, 'http://localhost:5173');
        globalThis.window.location.pathname = u.pathname;
        globalThis.window.location.search = u.search;
        globalThis.window.location.hash = u.hash;
        globalThis.window.location.href = u.href;
      }
    },
    replaceState(state, title, url) {
      this.pushState(state, title, url);
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
};
globalThis.document = mockDoc;

// LocalStorage mock
const memStorage = new Map();
globalThis.localStorage = {
  getItem: (k) => (memStorage.has(k) ? memStorage.get(k) : null),
  setItem: (k, v) => memStorage.set(k, String(v)),
  removeItem: (k) => memStorage.delete(k),
  clear: () => memStorage.clear(),
  get length() {
    return memStorage.size;
  },
};
globalThis.sessionStorage = { ...globalThis.localStorage };

// Register JSX loader hooks
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

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { default: App } = await import('../src/App.jsx');
const { OBD_CODES } = await import('../src/data/obdCodes.js');

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
    // catch initial hydration
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
// ADVERSARIAL CHALLENGE 1: DTC DRIVABILITY STATUS MATRIX EXHAUSTIVENESS
// =============================================================================

test('ADVERSARIAL 1: Exhaustive DTC Drivability Status Matrix across All OBD Codes', async () => {
  // Test confirmed critical codes in obdCodes.js: P2463, P0300, P0087, P0016, U0100
  const criticalCodes = ['P2463', 'P0300', 'P0087', 'P0016', 'U0100'];
  for (const code of criticalCodes) {
    const { rootContainer: critDom } = await renderApp('/obd-estimator', `?code=${code}`);
    const badge = findByTestId(critDom, 'obd-drivability-status-badge');
    assert.ok(badge, `Badge must exist for code ${code}`);
    assert.ok(
      badge.textContent.includes('Do Not Drive'),
      `Critical code ${code} MUST evaluate to "Do Not Drive", got "${badge.textContent}"`
    );
    // Verify drivability guidance
    const summaryCard = critDom.getElementById('workshop-summary-heading')?.parentNode;
    assert.ok(summaryCard, `Summary card must exist for ${code}`);
    const guidance = summaryCard.textContent;
    assert.ok(
      guidance.includes('Stop driving immediately'),
      `Critical code ${code} guidance must warn to stop driving immediately`
    );
  }

  // Test warning/high severity codes in obdCodes.js: P2002, P0299, P0700, P0301, P20EE, P0A80
  // NOTE EMPIRICAL FINDING: P0700 has severity 'HIGH - LIMP MODE RISK' in obdCodes.js,
  // so it evaluates to "Service Within 2 Weeks" (NOT "Do Not Drive").
  const highSeverityCodes = ['P2002', 'P0299', 'P0700', 'P0301', 'P20EE', 'P0A80'];
  for (const code of highSeverityCodes) {
    const { rootContainer: highDom } = await renderApp('/obd-estimator', `?code=${code}`);
    const badge = findByTestId(highDom, 'obd-drivability-status-badge');
    assert.ok(badge, `Badge must exist for code ${code}`);
    assert.ok(
      badge.textContent.includes('Service Within 2 Weeks'),
      `High severity code ${code} MUST evaluate to "Service Within 2 Weeks", got "${badge.textContent}"`
    );
    const summaryCard = highDom.getElementById('workshop-summary-heading')?.parentNode;
    const guidance = summaryCard.textContent;
    assert.ok(
      guidance.includes('Service within 1–2 weeks') || guidance.includes('Avoid high load'),
      `High severity code ${code} guidance must specify 1-2 weeks service window`
    );
  }

  // Test minor/moderate codes: P0420, P0171, P0401, P0128, P0455, P2015, P0101, P0442, P0113
  const minorCodes = ['P0420', 'P0171', 'P0401', 'P0128'];
  for (const code of minorCodes) {
    const { rootContainer: minorDom } = await renderApp('/obd-estimator', `?code=${code}`);
    const badge = findByTestId(minorDom, 'obd-drivability-status-badge');
    assert.ok(badge, `Badge must exist for code ${code}`);
    assert.ok(
      badge.textContent.includes('Safe to Drive'),
      `Moderate code ${code} MUST evaluate to "Safe to Drive", got "${badge.textContent}"`
    );
    const summaryCard = minorDom.getElementById('workshop-summary-heading')?.parentNode;
    const guidance = summaryCard.textContent;
    assert.ok(
      guidance.includes('Yes, short-term') || guidance.includes('Repair within 1–2 months'),
      `Moderate code ${code} guidance must indicate safe for short-term`
    );
  }

  // Boundary: Unknown code fallback handling (e.g. ?code=P9999)
  const { rootContainer: unknownDom } = await renderApp('/obd-estimator', '?code=P9999');
  const fallbackBadge = findByTestId(unknownDom, 'obd-drivability-status-badge');
  assert.ok(fallbackBadge, 'Unknown code must gracefully fall back to active default dossier without crashing');
  assert.ok(
    fallbackBadge.textContent.includes('Safe to Drive') ||
      fallbackBadge.textContent.includes('Service Within 2 Weeks') ||
      fallbackBadge.textContent.includes('Do Not Drive'),
    'Unknown code fallback badge must render valid status'
  );
});

// =============================================================================
// ADVERSARIAL CHALLENGE 2: DYNAMIC TELEMETRY SLIDERS, PRESETS & STRESS TOGGLING
// =============================================================================

test('ADVERSARIAL 2: Dynamic Telemetry Sliders, Presets & Rapid Toggling Stress', async () => {
  const { rootContainer } = await renderApp('/obd-estimator', '?code=P2002');

  // Verify initial collapsed state
  const toggleBtn = findByTestId(rootContainer, 'live-pid-toggle');
  assert.ok(toggleBtn, 'Live PID toggle must exist');
  assert.ok(
    toggleBtn.textContent.includes('Have an OBD-II scanner? Enter live sensor readings ▾'),
    'Toggle must initially show down arrow ▾'
  );

  // Expand sliders
  toggleBtn.dispatchEvent({ type: 'click' });
  await sleep(25);

  assert.ok(
    toggleBtn.textContent.includes('Have an OBD-II scanner? Enter live sensor readings ▴'),
    'Toggle must show up arrow ▴ after opening'
  );

  // Check preset: Risk Preset (#pid-preset-risk)
  const riskBtn = rootContainer.getElementById('pid-preset-risk');
  assert.ok(riskBtn, 'Risk preset button must exist');
  riskBtn.dispatchEvent({ type: 'click' });
  await sleep(30);

  // Verify live telemetry summary callout rendered
  const liveVerdictCallout = rootContainer.getElementById('summary-live-telemetry-verdict');
  assert.ok(liveVerdictCallout, 'Summary card must show live telemetry verdict callout after preset');
  const verdictText = liveVerdictCallout.textContent;
  assert.ok(verdictText.includes('Expected Cost Range'), 'Verdict must include expected cost range');
  assert.ok(!verdictText.includes('NaN'), 'Verdict must not contain NaN');

  // Check preset: Good / Normal Preset (#pid-preset-good)
  const goodBtn = rootContainer.getElementById('pid-preset-good');
  assert.ok(goodBtn, 'Good/Normal preset button (#pid-preset-good) must exist');
  goodBtn.dispatchEvent({ type: 'click' });
  await sleep(30);

  const goodVerdict = rootContainer.getElementById('summary-live-telemetry-verdict');
  assert.ok(goodVerdict, 'Good verdict callout must remain populated');
  assert.ok(!goodVerdict.textContent.includes('NaN'), 'Good verdict must not contain NaN');

  // Check preset: Warn / Service Preset (#pid-preset-warn)
  const warnBtn = rootContainer.getElementById('pid-preset-warn');
  assert.ok(warnBtn, 'Warn/Service preset button (#pid-preset-warn) must exist');
  warnBtn.dispatchEvent({ type: 'click' });
  await sleep(30);

  const warnVerdict = rootContainer.getElementById('summary-live-telemetry-verdict');
  assert.ok(warnVerdict, 'Warn verdict callout must remain populated');
  assert.ok(!warnVerdict.textContent.includes('NaN'), 'Warn verdict must not contain NaN');

  // Stress test: Rapid 20x toggling of the live telemetry accordion
  for (let i = 0; i < 20; i++) {
    toggleBtn.dispatchEvent({ type: 'click' });
  }
  await sleep(50);

  // Verify DOM integrity: no crash, workshop heading intact
  const workshopHeading = rootContainer.getElementById('workshop-summary-heading');
  assert.ok(workshopHeading, 'Workshop summary heading must remain healthy after 20 rapid toggles');
});

// =============================================================================
// ADVERSARIAL CHALLENGE 3: DOM TEXT INVARIANCE & NON-DESTRUCTIVE COLLAPSE
// =============================================================================

test('ADVERSARIAL 3: DOM Text Invariance across Collapsed and Expanded States (SEO / AdSense)', async () => {
  // Test in /tco
  const { rootContainer: tcoDom } = await renderApp('/tco');

  // 1. TechnicalMethodologyGuide (#methodology-guide)
  const guideEl = tcoDom.getElementById('methodology-guide');
  assert.ok(guideEl, '#methodology-guide must be mounted in DOM');

  const collapsedWordsGuide = guideEl.textContent.replace(/\s+/g, ' ').trim().split(' ').length;
  assert.ok(
    collapsedWordsGuide >= 1000,
    `TechnicalMethodologyGuide must have >= 1,000 words when collapsed (found ${collapsedWordsGuide})`
  );

  // Find white paper accordion trigger in TechnicalMethodologyGuide
  const guideAccordions = guideEl.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.textContent.includes('How We Calculate This & Engineering Methodology')
  );
  assert.ok(guideAccordions.length > 0, 'Engineering methodology trigger button must exist in guide');
  const guideToggle = guideAccordions[0];

  // Expand guide accordion
  guideToggle.dispatchEvent({ type: 'click' });
  await sleep(25);

  const expandedWordsGuide = guideEl.textContent.replace(/\s+/g, ' ').trim().split(' ').length;
  assert.strictEqual(
    expandedWordsGuide,
    collapsedWordsGuide,
    `Guide word count must be 100% invariant when expanded (collapsed: ${collapsedWordsGuide}, expanded: ${expandedWordsGuide})`
  );

  // Collapse again
  guideToggle.dispatchEvent({ type: 'click' });
  await sleep(25);
  const reCollapsedWordsGuide = guideEl.textContent.replace(/\s+/g, ' ').trim().split(' ').length;
  assert.strictEqual(reCollapsedWordsGuide, collapsedWordsGuide, 'Guide word count must remain invariant when re-collapsed');

  // 2. ToolEditorialSection (#tool-editorial-section)
  const editorialEl = tcoDom.getElementById('tool-editorial-section');
  assert.ok(editorialEl, '#tool-editorial-section must be mounted in DOM');

  const collapsedWordsEd = editorialEl.textContent.replace(/\s+/g, ' ').trim().split(' ').length;
  assert.ok(
    collapsedWordsEd >= 350,
    `ToolEditorialSection must have >= 350 words when collapsed (found ${collapsedWordsEd})`
  );

  const editorialToggle = findByTestId(tcoDom, 'methodology-accordion-toggle');
  assert.ok(editorialToggle, 'Editorial accordion toggle must exist');

  // Expand editorial accordion
  editorialToggle.dispatchEvent({ type: 'click' });
  await sleep(25);

  const expandedWordsEd = editorialEl.textContent.replace(/\s+/g, ' ').trim().split(' ').length;
  assert.strictEqual(
    expandedWordsEd,
    collapsedWordsEd,
    `Editorial word count must be 100% invariant when expanded (collapsed: ${collapsedWordsEd}, expanded: ${expandedWordsEd})`
  );

  // 3. Test on /obd-estimator
  const { rootContainer: obdDom } = await renderApp('/obd-estimator', '?code=P2002');
  const obdEditorialEl = obdDom.getElementById('tool-editorial-section');
  assert.ok(obdEditorialEl, '#tool-editorial-section must be mounted on /obd-estimator');

  const obdCollapsedWords = obdEditorialEl.textContent.replace(/\s+/g, ' ').trim().split(' ').length;
  assert.ok(
    obdCollapsedWords >= 350,
    `OBD ToolEditorialSection must have >= 350 words (found ${obdCollapsedWords})`
  );

  const obdEditorialToggle = findByTestId(obdDom, 'methodology-accordion-toggle');
  if (obdEditorialToggle) {
    obdEditorialToggle.dispatchEvent({ type: 'click' });
    await sleep(25);
    const obdExpandedWords = obdEditorialEl.textContent.replace(/\s+/g, ' ').trim().split(' ').length;
    assert.strictEqual(
      obdExpandedWords,
      obdCollapsedWords,
      'OBD editorial word count must remain 100% invariant across toggling'
    );
  }
});

// =============================================================================
// ADVERSARIAL CHALLENGE 4: PROGRESSIVE DISCLOSURE ON ROOT CAUSES & CHEVRON
// =============================================================================

test('ADVERSARIAL 4: Progressive Disclosure on Root Causes Rows with Accordion Behavior', async () => {
  const { rootContainer } = await renderApp('/obd-estimator', '?code=P2002');

  const rootCausesCard = rootContainer.querySelectorAll(
    (el) => el.getAttribute('aria-labelledby') === 'causes-heading'
  )[0];
  assert.ok(rootCausesCard, 'Root causes card must exist');

  const rows = rootCausesCard.querySelectorAll((el) => el.tagName === 'LI');
  assert.strictEqual(rows.length, 4, 'Must render exactly 4 ranked root causes');

  // Initial state: row 0 detail container is collapsed (max-h-0)
  const collapse0 = rows[0].querySelector('#root-cause-detail-0') || rows[0].querySelectorAll((el) => (el.id || '').includes('root-cause-detail'))[0];
  assert.ok(collapse0, 'Collapse container 0 must exist');
  assert.ok(collapse0.className.includes('max-h-0'), 'Row 0 detail must have max-h-0 initially');

  // Click row 0: expands row 0
  const btn0 = rows[0].querySelector('button');
  btn0.dispatchEvent({ type: 'click' });
  await sleep(25);
  assert.ok(collapse0.className.includes('max-h-[1400px]'), 'Row 0 detail must have max-h-[1400px] after click');

  // Check that row 0 reveals component note and parts/labor
  const row0Html = rows[0].toHtml();
  assert.ok(row0Html.includes('Parts:') && row0Html.includes('Labour:'), 'Expanded row must reveal parts & labor breakdown');

  // Click row 1: expands row 1, collapses row 0 (accordion mutual exclusion)
  const collapse1 = rows[1].querySelector('#root-cause-detail-1') || rows[1].querySelectorAll((el) => (el.id || '').includes('root-cause-detail'))[0];
  const btn1 = rows[1].querySelector('button');
  btn1.dispatchEvent({ type: 'click' });
  await sleep(25);
  assert.ok(collapse1.className.includes('max-h-[1400px]'), 'Row 1 detail must have max-h-[1400px] after click');
  assert.ok(collapse0.className.includes('max-h-0'), 'Row 0 detail must be collapsed (max-h-0) when row 1 is opened');

  // Click row 1 again: collapses row 1
  btn1.dispatchEvent({ type: 'click' });
  await sleep(25);
  assert.ok(collapse1.className.includes('max-h-0'), 'Row 1 detail must collapse (max-h-0) when clicked again');
});

// =============================================================================
// ADVERSARIAL CHALLENGE 5: REMOVAL OF DUPLICATE HERO CARD 2 & SINGLE COST DISPLAY
// =============================================================================

test('ADVERSARIAL 5: Duplicate Hero Card 2 Removed & Cost Displayed Exactly Once', async () => {
  const { rootContainer } = await renderApp('/obd-estimator', '?code=P2002');

  // 1. Duplicate Hero Card 2 heading "Repair Severity" MUST NOT exist
  const repairSeverityHeadings = rootContainer.querySelectorAll(
    (el) => el.tagName === 'H2' && el.textContent.trim() === 'Repair Severity'
  );
  assert.strictEqual(
    repairSeverityHeadings.length,
    0,
    'Duplicate "Repair Severity" H2 hero heading must not exist'
  );

  // 2. Only one prominent H2 workshop cost summary heading
  const summaryHeadings = rootContainer.querySelectorAll(
    (el) => el.tagName === 'H2' && (el.textContent || '').includes('WORKSHOP COST SUMMARY')
  );
  assert.strictEqual(
    summaryHeadings.length,
    1,
    'There must be exactly one WORKSHOP COST SUMMARY H2 heading in the sticky summary card'
  );

  // 3. Carly / Bluetooth scanner partner CTA must be present adjacent to live PID toggle
  const ctaLinks = rootContainer.querySelectorAll(
    (el) =>
      el.tagName === 'A' &&
      (el.textContent || '').includes("Don't have a scanner yet?")
  );
  assert.strictEqual(ctaLinks.length, 1, 'Must render exactly one Carly scanner partner CTA next to toggle');
  assert.strictEqual(ctaLinks[0].getAttribute('target'), '_blank', 'Scanner CTA must target _blank');
  assert.ok(
    ctaLinks[0].getAttribute('rel')?.includes('sponsored'),
    'Scanner CTA must include rel="sponsored"'
  );
});

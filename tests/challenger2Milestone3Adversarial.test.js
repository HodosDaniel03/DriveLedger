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
    this._attrs = new Map();
    this.childNodes = [];
    this.parentNode = null;
    this._style = {};
    this._listeners = new Map();
    this._innerHTML = null;
    this._value = '';
    this._checked = false;
  }

  get attributes() {
    return Array.from(this._attrs.entries()).map(([name, value]) => ({ name, value }));
  }

  get id() {
    return this.getAttribute('id') || '';
  }
  set id(v) {
    this.setAttribute('id', v);
  }

  get className() {
    return this.getAttribute('class') || '';
  }
  set className(v) {
    this.setAttribute('class', v);
  }

  get classList() {
    return {
      contains: (cls) => this.className.split(/\s+/).includes(cls),
      add: (cls) => {
        const set = new Set(this.className.split(/\s+/).filter(Boolean));
        set.add(cls);
        this.className = [...set].join(' ');
      },
      remove: (cls) => {
        const set = new Set(this.className.split(/\s+/).filter(Boolean));
        set.delete(cls);
        this.className = [...set].join(' ');
      },
    };
  }

  get style() {
    return this._style;
  }

  get value() {
    return this._value;
  }
  set value(v) {
    this._value = String(v);
  }

  get checked() {
    return this._checked;
  }
  set checked(v) {
    this._checked = Boolean(v);
  }

  setAttribute(name, value) {
    this._attrs.set(String(name).toLowerCase(), String(value));
  }
  getAttribute(name) {
    const val = this._attrs.get(String(name).toLowerCase());
    return val !== undefined ? val : null;
  }
  hasAttribute(name) {
    return this._attrs.has(String(name).toLowerCase());
  }
  removeAttribute(name) {
    this._attrs.delete(String(name).toLowerCase());
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

  insertBefore(newNode, refNode) {
    if (!newNode) return newNode;
    if (!refNode) return this.appendChild(newNode);
    const idx = this.childNodes.indexOf(refNode);
    if (idx === -1) return this.appendChild(newNode);
    if (newNode.parentNode) {
      newNode.parentNode.removeChild(newNode);
    }
    newNode.parentNode = this;
    this.childNodes.splice(idx, 0, newNode);
    return newNode;
  }

  removeChild(node) {
    const idx = this.childNodes.indexOf(node);
    if (idx !== -1) {
      this.childNodes.splice(idx, 1);
      node.parentNode = null;
    }
    return node;
  }

  replaceChild(newChild, oldChild) {
    const idx = this.childNodes.indexOf(oldChild);
    if (idx !== -1) {
      if (newChild.parentNode) newChild.parentNode.removeChild(newChild);
      newChild.parentNode = this;
      oldChild.parentNode = null;
      this.childNodes.splice(idx, 1, newChild);
    }
    return oldChild;
  }

  replaceChildren(...nodes) {
    for (const c of this.childNodes) c.parentNode = null;
    this.childNodes = [];
    for (const n of nodes) this.appendChild(n);
  }

  get firstChild() {
    return this.childNodes[0] || null;
  }
  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] || null;
  }
  get nextSibling() {
    if (!this.parentNode) return null;
    const siblings = this.parentNode.childNodes;
    const idx = siblings.indexOf(this);
    return siblings[idx + 1] || null;
  }

  get innerHTML() {
    return this.toHtml();
  }
  set innerHTML(html) {
    this._innerHTML = String(html);
    this.childNodes = [];
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
        const tag = s.toUpperCase();
        predicate = (el) => el.tagName === tag;
      }
    }

    const matches = [];
    const walk = (node) => {
      for (const child of node.childNodes || []) {
        if (child.nodeType === 1) {
          if (predicate && predicate(child)) matches.push(child);
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
    const res = this.querySelectorAll((el) => el.id === id);
    return res[0] || null;
  }

  toHtml() {
    if (this._innerHTML !== null) return this._innerHTML;
    const tag = this.tagName.toLowerCase();
    const attrs = [];
    for (const [k, v] of this.attributes) {
      attrs.push(`${k}="${String(v).replace(/"/g, '&quot;')}"`);
    }
    const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
    const voidTags = ['input', 'img', 'br', 'hr', 'meta', 'link'];
    if (voidTags.includes(tag)) {
      return `<${tag}${attrStr} />`;
    }
    const inner = this.childNodes.map((c) => c.toHtml()).join('');
    return `<${tag}${attrStr}>${inner}</${tag}>`;
  }
}

// Global window/document bootstrap
if (!globalThis.window) {
  globalThis.window = {
    location: {
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
    addEventListener() {},
    removeEventListener() {},
    scrollTo() {},
    matchMedia() {
      return { matches: false, addEventListener() {}, removeEventListener() {} };
    },
  };
}

if (!globalThis.document) {
  globalThis.document = {
    createElement(tag) {
      return new MockElement(tag);
    },
    createElementNS(ns, tag) {
      return new MockElement(tag, ns);
    },
    createTextNode(text) {
      return new MockTextNode(text);
    },
    createDocumentFragment() {
      return new MockDocumentFragment();
    },
    activeElement: null,
    body: new MockElement('BODY'),
    head: new MockElement('HEAD'),
    documentElement: new MockElement('HTML'),
    getElementById(id) {
      return globalThis.document.body.getElementById(id);
    },
    querySelector(q) {
      return globalThis.document.body.querySelector(q);
    },
    querySelectorAll(q) {
      return globalThis.document.body.querySelectorAll(q);
    },
  };
}

if (!globalThis.localStorage) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(String(k)) || null,
    setItem: (k, v) => store.set(String(k), String(v)),
    removeItem: (k) => store.delete(String(k)),
    clear: () => store.clear(),
  };
}
if (!globalThis.sessionStorage) {
  const store = new Map();
  globalThis.sessionStorage = {
    getItem: (k) => store.get(String(k)) || null,
    setItem: (k, v) => store.set(String(k), String(v)),
    removeItem: (k) => store.delete(String(k)),
    clear: () => store.clear(),
  };
}

const rootContainer = new MockElement('DIV');
rootContainer.id = 'root';
globalThis.document.body.appendChild(rootContainer);

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
const { OBD_CODES } = await import('../src/data/obdCodes.js');
const { default: ToolEditorialSection } = await import('../src/components/seo/ToolEditorialSection.jsx');

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
  root.render(React.createElement(App));
  await sleep(35);
  return { root, rootContainer };
}

function findByTestId(container, testId) {
  const res = container.querySelectorAll(
    (el) => el.getAttribute('data-testid') === testId
  );
  return res[0] || null;
}

// =============================================================================
// ADVERSARIAL CHALLENGE SUITE FOR MILESTONE 3
// =============================================================================

test('CHALLENGE-M3-1: Exhaustive Drivability Status Matrix across ALL 20 OBD codes', async () => {
  for (const dossier of OBD_CODES) {
    const { rootContainer: dom } = await renderApp('/obd-estimator', `?code=${dossier.code}`);
    
    // 1. Drivability status badge must be present
    const badge = findByTestId(dom, 'obd-drivability-status-badge');
    assert.ok(badge, `Drivability status badge must be present for code ${dossier.code}`);
    
    const text = badge.textContent.trim();
    const sevUpper = String(dossier.severity || '').toUpperCase();
    
    if (sevUpper.includes('CRITICAL')) {
      assert.ok(
        text.includes('Do Not Drive'),
        `Critical code ${dossier.code} (severity: "${dossier.severity}") must map to "Do Not Drive", got "${text}"`
      );
    } else if (sevUpper.includes('HIGH')) {
      assert.ok(
        text.includes('Service Within 2 Weeks'),
        `High severity code ${dossier.code} (severity: "${dossier.severity}") must map to "Service Within 2 Weeks", got "${text}"`
      );
    } else {
      assert.ok(
        text.includes('Safe to Drive'),
        `Moderate/low code ${dossier.code} (severity: "${dossier.severity}") must map to "Safe to Drive", got "${text}"`
      );
    }

    // 2. Workshop Cost Summary heading must include code and be rendered
    const workshopHeading = dom.getElementById('workshop-summary-heading');
    assert.ok(workshopHeading, `workshop-summary-heading must exist for ${dossier.code}`);
    assert.ok(
      workshopHeading.textContent.includes(`${dossier.code} WORKSHOP COST SUMMARY`),
      `Heading must match "${dossier.code} WORKSHOP COST SUMMARY", got "${workshopHeading.textContent}"`
    );

    // 3. Duplicate Hero Card 2 ("Repair Severity") MUST NOT be present
    const duplicateSeverityHero = dom.querySelectorAll(
      (el) => el.tagName === 'H2' && el.textContent === 'Repair Severity'
    );
    assert.strictEqual(
      duplicateSeverityHero.length,
      0,
      `Duplicate "Repair Severity" hero card must never be present for ${dossier.code}`
    );
  }
});

test('CHALLENGE-M3-2: Rapid Accordion Toggling DOM Word Count Invariance Stress Test', async () => {
  const { rootContainer: dom } = await renderApp('/tco');

  // Test ToolEditorialSection
  const editorialToggle = findByTestId(dom, 'methodology-accordion-toggle');
  assert.ok(editorialToggle, 'methodology-accordion-toggle must be mounted');

  const editorialEl = dom.getElementById('tool-editorial-section');
  assert.ok(editorialEl, '#tool-editorial-section must be mounted');
  
  const initialEditorialWords = editorialEl.textContent.replace(/\s+/g, ' ').trim().split(' ').length;
  assert.ok(initialEditorialWords >= 350, `Initial editorial word count must be >= 350 (got ${initialEditorialWords})`);

  // Rapidly toggle 20 times
  for (let i = 0; i < 20; i++) {
    editorialToggle.dispatchEvent({ type: 'click' });
  }
  await sleep(35);

  const finalEditorialWords = editorialEl.textContent.replace(/\s+/g, ' ').trim().split(' ').length;
  assert.strictEqual(
    finalEditorialWords,
    initialEditorialWords,
    'Editorial word count must be strictly invariant across rapid toggle cycles'
  );

  // Test TechnicalMethodologyGuide
  const guideEl = dom.getElementById('methodology-guide');
  assert.ok(guideEl, '#methodology-guide must be mounted');
  const initialGuideWords = guideEl.textContent.replace(/\s+/g, ' ').trim().split(' ').length;
  assert.ok(initialGuideWords >= 1000, `Initial guide word count must be >= 1000 (got ${initialGuideWords})`);

  const guideToggle = dom.querySelectorAll((el) =>
    el.tagName === 'BUTTON' && (el.textContent || '').includes('How We Calculate This & Engineering Methodology')
  )[1] || dom.querySelectorAll((el) =>
    el.tagName === 'BUTTON' && (el.textContent || '').includes('How We Calculate This & Engineering Methodology')
  )[0];

  if (guideToggle) {
    for (let i = 0; i < 20; i++) {
      guideToggle.dispatchEvent({ type: 'click' });
    }
    await sleep(35);

    const finalGuideWords = guideEl.textContent.replace(/\s+/g, ' ').trim().split(' ').length;
    assert.strictEqual(
      finalGuideWords,
      initialGuideWords,
      'TechnicalMethodologyGuide word count must be strictly invariant across rapid toggle cycles'
    );
  }
});

test('CHALLENGE-M3-3: Root Causes Progressive Disclosure Mutual Exclusivity & Interaction', async () => {
  const { rootContainer: dom } = await renderApp('/obd-estimator', '?code=P2002');

  const causesCard = dom.querySelectorAll(
    (el) => el.getAttribute('aria-labelledby') === 'causes-heading'
  )[0];
  assert.ok(causesCard, 'Root causes card must be mounted');

  const causeButtons = causesCard.querySelectorAll((el) => el.tagName === 'BUTTON');
  assert.ok(causeButtons.length >= 2, 'Must have at least 2 root causes buttons');

  // Verify initial collapsed state: probability bar and notes should be inside Collapse open=false
  const collapse0 = dom.getElementById('root-cause-detail-0');
  assert.ok(collapse0, '#root-cause-detail-0 must exist in DOM');
  assert.ok(
    collapse0.className.includes('max-h-0'),
    'Collapse 0 must initially be collapsed (max-h-0)'
  );

  // Click Cause 0: should expand
  causeButtons[0].dispatchEvent({ type: 'click' });
  await sleep(25);

  const updatedCollapse0 = dom.getElementById('root-cause-detail-0');
  assert.ok(
    updatedCollapse0.className.includes('max-h-[1400px]'),
    'Collapse 0 must be expanded (max-h-[1400px]) after click'
  );

  // Click Cause 1: should expand Cause 1 and collapse Cause 0 (mutual exclusivity)
  causeButtons[1].dispatchEvent({ type: 'click' });
  await sleep(25);

  const collapse0After = dom.getElementById('root-cause-detail-0');
  const collapse1After = dom.getElementById('root-cause-detail-1');
  assert.ok(
    collapse0After.className.includes('max-h-0'),
    'Collapse 0 must collapse when Cause 1 is clicked'
  );
  assert.ok(
    collapse1After.className.includes('max-h-[1400px]'),
    'Collapse 1 must expand when clicked'
  );

  // Click Cause 1 again: should collapse Cause 1
  causeButtons[1].dispatchEvent({ type: 'click' });
  await sleep(25);

  const collapse1Final = dom.getElementById('root-cause-detail-1');
  assert.ok(
    collapse1Final.className.includes('max-h-0'),
    'Collapse 1 must toggle back to collapsed when clicked again'
  );
});

test('CHALLENGE-M3-4: Live PID Telemetry Toggle & Dynamic Recalculation Coupling', async () => {
  const { rootContainer: dom } = await renderApp('/obd-estimator', '?code=P2002');

  const toggle = findByTestId(dom, 'live-pid-toggle');
  assert.ok(toggle, 'Live PID toggle must exist');
  assert.ok(
    !toggle.hasAttribute('aria-expanded') || toggle.getAttribute('aria-expanded') === 'false',
    'Live PID toggle must be collapsed initially'
  );
  assert.ok(
    toggle.textContent.includes('▾'),
    'Toggle text must end with downward chevron ▾ initially'
  );

  // Click toggle to open
  toggle.dispatchEvent({ type: 'click' });
  await sleep(25);

  assert.ok(
    toggle.hasAttribute('aria-expanded') && toggle.getAttribute('aria-expanded') !== 'false',
    'Live PID toggle must have aria-expanded when open'
  );
  assert.ok(
    toggle.textContent.includes('▴'),
    'Toggle text must end with upward chevron ▴ when open'
  );

  // Sliders must be responsive
  const sootSlider = dom.getElementById('pid-slider-soot_mass_load');
  assert.ok(sootSlider, '#pid-slider-soot_mass_load must exist in DOM');

  // Trigger high soot load (e.g. 90%)
  sootSlider.value = '90';
  sootSlider.dispatchEvent({ type: 'input' });
  await sleep(25);

  // Merged workshop summary card must remain mounted and populated
  const workshopHeading = dom.getElementById('workshop-summary-heading');
  assert.ok(workshopHeading, 'Workshop summary heading must remain mounted');
});

test('CHALLENGE-M3-5: Carly / Bluetooth Scanner CTA Placement & Attributes', async () => {
  const { rootContainer: dom } = await renderApp('/obd-estimator', '?code=P2002');

  const scannerLink = dom.querySelectorAll((el) =>
    el.tagName === 'A' && (el.textContent || '').includes("Don't have a scanner yet?")
  )[0];

  assert.ok(scannerLink, 'Carly scanner link must exist near telemetry toggle');
  assert.strictEqual(
    scannerLink.getAttribute('rel'),
    'sponsored noopener noreferrer',
    'Scanner affiliate link must have rel="sponsored noopener noreferrer"'
  );
  assert.strictEqual(
    scannerLink.getAttribute('target'),
    '_blank',
    'Scanner affiliate link must target="_blank"'
  );
  assert.ok(
    scannerLink.getAttribute('href'),
    'Scanner affiliate link must have a valid non-empty href'
  );
});

test('CHALLENGE-M3-6: Editorial Content Word Count Across All 3 Tools (tco, obd, checklist)', async () => {
  for (const tool of ['tco', 'obd', 'checklist']) {
    const testContainer = new MockElement('DIV');
    const root = createRoot(testContainer);
    root.render(React.createElement(ToolEditorialSection, { tool }));
    await sleep(25);

    const sectionEl = testContainer.getElementById('tool-editorial-section');
    assert.ok(sectionEl, `ToolEditorialSection must mount for tool "${tool}"`);

    const words = sectionEl.textContent.replace(/\s+/g, ' ').trim().split(' ').length;
    assert.ok(
      words >= 350,
      `Editorial content for '${tool}' must contain >= 350 words in DOM (got ${words})`
    );
  }
});

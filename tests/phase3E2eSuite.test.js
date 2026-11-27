/**
 * DriveLedger Phase 3 E2E Verification Suite (Node Mock DOM)
 *
 * Standalone runner:
 *   node --test tests/phase3E2eSuite.test.js
 *
 * Covers opaque-box Features F1-F8 across Tiers 1-4:
 * - [R2 Baseline Contract]: Preserved math, powertrain isolation, GarageContext credits,
 *   export/share guards, zero default pre-selection, URL hydration, and required data-testid / IDs.
 * - [Phase 3 R1/R3/R4/R5/R6 Target]: Phase 3 visual restraint, native <dialog> pickers/sheets,
 *   collapsed SEO disclosures, Risk Matrix 2-col split + 3 tabs + scannable rows, OBD 3-metric
 *   verdict strip + deep-dive disclosures + PID threshold bars, PPI 4 <details> stages + >=44px
 *   3-state toggles + summary <dialog>, and Catalog/Guides declutter.
 *
 * Genuine failures on [Phase 3 ...] tests against pre-refactor baseline are expected and diagnostic
 * until M1-M4 are completed. Layout geometry (bounding rects, scrollWidth, CLS, real :hover, real Esc)
 * is verified in the companion Chromium CDP runner (verify-phase3-browser.mjs).
 */

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

// ============================================================================
// 1. Upgraded Mock DOM Harness (Explorer 1 §4 Blueprint)
// ============================================================================

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
      for (const c of [...node.childNodes]) this.appendChild(c);
      node.childNodes = [];
      return node;
    }
    if (node.parentNode) node.parentNode.removeChild(node);
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
  get textContent() {
    return this.childNodes.map((c) => c.textContent).join('');
  }
  toHtml() {
    return this.childNodes.map((c) => c.toHtml()).join('');
  }
}

function buildSelectorMatcher(query) {
  if (typeof query === 'function') return query;
  const q = String(query || '').trim();
  if (!q) return () => false;
  if (q.startsWith('#')) {
    const id = q.slice(1);
    return (el) => el.id === id;
  }
  if (q.startsWith('.')) {
    const cls = q.slice(1);
    return (el) => el.classList.contains(cls);
  }
  if (q.startsWith('[') && q.endsWith(']')) {
    const inner = q.slice(1, -1);
    const eqIdx = inner.indexOf('=');
    if (eqIdx === -1) {
      return (el) => el.hasAttribute(inner.trim());
    }
    const attrName = inner.slice(0, eqIdx).trim();
    const rawVal = inner.slice(eqIdx + 1).trim();
    const attrVal = rawVal.replace(/^["']|["']$/g, '');
    return (el) => el.getAttribute(attrName) === attrVal;
  }
  const upper = q.toUpperCase();
  return (el) => el.tagName === upper;
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
      add: (...tokens) => {
        tokens.forEach((t) => {
          if (t) this.classList._set.add(t);
        });
        this._attrs.set('class', Array.from(this.classList._set).join(' '));
      },
      remove: (...tokens) => {
        tokens.forEach((t) => this.classList._set.delete(t));
        const joined = Array.from(this.classList._set).join(' ');
        if (joined) this._attrs.set('class', joined);
        else this._attrs.delete('class');
      },
      contains: (t) => this.classList._set.has(t),
      toggle: (t, force) => {
        const shouldAdd = force !== undefined ? Boolean(force) : !this.classList._set.has(t);
        if (shouldAdd) this.classList.add(t);
        else this.classList.remove(t);
        return shouldAdd;
      },
    };
  }

  _syncClassList(val) {
    this.classList._set.clear();
    String(val || '')
      .split(/\s+/)
      .filter(Boolean)
      .forEach((tok) => this.classList._set.add(tok));
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
  get open() {
    return this._attrs.has('open');
  }
  set open(v) {
    if (v) this._attrs.set('open', '');
    else this._attrs.delete('open');
  }
  showModal() {
    this.open = true;
  }
  close() {
    const wasOpen = this.open;
    this.open = false;
    if (wasOpen) {
      this.dispatchEvent({ type: 'close' });
    }
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
    const str = String(value);
    this._attrs.set(name, str);
    if (name === 'value') this._value = str;
    if (name === 'class') this._syncClassList(str);
  }
  removeAttribute(name) {
    this._attrs.delete(name);
    if (name === 'class') this.classList._set.clear();
  }
  appendChild(node) {
    if (!node) return node;
    if (node.nodeType === 11) {
      for (const c of [...node.childNodes]) this.appendChild(c);
      node.childNodes = [];
      return node;
    }
    if (node.parentNode) node.parentNode.removeChild(node);
    node.parentNode = this;
    this.childNodes.push(node);
    this._innerHTML = null;
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
    if (newNode.parentNode) newNode.parentNode.removeChild(newNode);
    newNode.parentNode = this;
    oldNode.parentNode = null;
    this.childNodes[idx] = newNode;
    return oldNode;
  }
  replaceChildren(...nodes) {
    for (const c of this.childNodes) c.parentNode = null;
    this.childNodes = [];
    this._innerHTML = null;
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
    const list = this._listeners.get(evt);
    if (!list) return;
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
    for (const fn of fns) fn(e);
  }
  focus() {
    globalThis.document.activeElement = this;
  }
  scrollIntoView() {}
  get textContent() {
    if (this._innerHTML !== null) return this._innerHTML.replace(/<[^>]+>/g, '');
    return this.childNodes.map((c) => c.textContent).join('');
  }
  querySelectorAll(query) {
    const predicate = buildSelectorMatcher(query);
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
    return this.querySelectorAll(query)[0] || null;
  }
  closest(query) {
    const predicate = buildSelectorMatcher(query);
    let cur = this;
    while (cur && cur.nodeType === 1) {
      if (predicate(cur)) return cur;
      cur = cur.parentNode;
    }
    return null;
  }
  getElementsByTagName(tag) {
    const upper = String(tag).toUpperCase();
    return this.querySelectorAll((el) => el.tagName === upper);
  }
  getElementById(id) {
    return this.querySelectorAll((el) => el.id === id)[0] || null;
  }
  toHtml() {
    const tag = this.tagName.toLowerCase();
    const attrStr = Array.from(this._attrs.entries())
      .map(([k, v]) => (v === '' ? k : `${k}="${v}"`))
      .join(' ');
    const inner =
      this._innerHTML !== null ? this._innerHTML : this.childNodes.map((c) => c.toHtml()).join('');
    return `<${tag}${attrStr ? ' ' + attrStr : ''}>${inner}</${tag}>`;
  }
}

MockElement.prototype.onbeforematch = null;
globalThis.HTMLElement = MockElement;
globalThis.HTMLDialogElement = MockElement;

const storageMap = new Map();
globalThis.localStorage = {
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
    const m = selector.match(/meta\[([a-zA-Z0-9_-]+)="([^"]+)"\]/);
    if (m) {
      return (
        headElement.childNodes.find(
          (c) => c.tagName === 'META' && c.getAttribute(m[1]) === m[2]
        ) || null
      );
    }
  }
  if (typeof selector === 'string' && selector.startsWith('link[')) {
    const m = selector.match(/link\[rel="([^"]+)"\](?:\[hreflang="([^"]+)"\])?/);
    if (m) {
      return (
        headElement.childNodes.find(
          (c) =>
            c.tagName === 'LINK' &&
            c.getAttribute('rel') === m[1] &&
            (!m[2] || c.getAttribute('hreflang') === m[2])
        ) || null
      );
    }
  }
  return null;
};

const documentListeners = new Map();
globalThis.document = {
  documentElement: new MockElement('html'),
  head: headElement,
  body: new MockElement('body'),
  activeElement: null,
  title: '',
  createElement: (tag) => new MockElement(tag),
  createElementNS: (ns, tag) => new MockElement(tag, ns),
  createTextNode: (text) => new MockTextNode(text),
  createDocumentFragment: () => new MockDocumentFragment(),
  getElementById: (id) => (id === 'root' ? rootContainer : rootContainer.getElementById(id)),
  querySelectorAll: (query) => rootContainer.querySelectorAll(query),
  querySelector: (query) => rootContainer.querySelector(query),
  addEventListener(evt, fn) {
    if (!documentListeners.has(evt)) documentListeners.set(evt, []);
    documentListeners.get(evt).push(fn);
  },
  removeEventListener(evt, fn) {
    const list = documentListeners.get(evt);
    if (!list) return;
    const idx = list.indexOf(fn);
    if (idx !== -1) list.splice(idx, 1);
  },
  dispatchEvent(e) {
    const list = documentListeners.get(e.type) || [];
    for (const fn of list) fn(e);
  },
  execCommand: () => true,
};

const windowListeners = new Map();
const openedUrls = [];
globalThis.window = {
  location: { pathname: '/', search: '', hash: '', href: 'http://localhost:5173/' },
  history: {
    replaceState(_s, _t, url) {
      const u = new URL(url, 'http://localhost:5173');
      globalThis.window.location.pathname = u.pathname;
      globalThis.window.location.search = u.search;
      globalThis.window.location.hash = u.hash;
      globalThis.window.location.href = u.href;
    },
    pushState(_s, _t, url) {
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
    const list = windowListeners.get(evt);
    if (!list) return;
    const idx = list.indexOf(fn);
    if (idx !== -1) list.splice(idx, 1);
  },
  dispatchEvent(e) {
    const list = windowListeners.get(e.type) || [];
    for (const fn of list) fn(e);
  },
  scrollTo() {},
  open(url) {
    openedUrls.push(url);
  },
  print() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
};

function buildLucideVendorSource() {
  const existing = new Set(
    [...VENDOR_LUCIDE_JS.matchAll(/export const ([A-Za-z0-9_]+)/g)].map((m) => m[1])
  );
  const discovered = new Set();
  const scanDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) scanDir(full);
      else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        const src = fs.readFileSync(full, 'utf8');
        for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g)) {
          m[1]
            .split(',')
            .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
            .filter(Boolean)
            .forEach((name) => discovered.add(name));
        }
      }
    }
  };
  scanDir(path.join(projectRoot, 'src'));
  const extras = [...discovered]
    .filter((name) => !existing.has(name))
    .map((name) => `export const ${name} = createIcon('${name}', '');`)
    .join('\n');
  return extras ? `${VENDOR_LUCIDE_JS}\n${extras}\n` : VENDOR_LUCIDE_JS;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (['react', 'react-dom/client', 'react-router-dom', 'lucide-react'].includes(specifier)) {
      return { shortCircuit: true, url: `virtual-vendor://${specifier}` };
    }
    if (specifier.endsWith('.css')) {
      return { shortCircuit: true, url: `virtual-css://${specifier}` };
    }
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file://')) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      const base = path.resolve(parentDir, specifier);
      for (const candidate of [
        base,
        `${base}.jsx`,
        `${base}.js`,
        `${base}.json`,
        `${base}.ts`,
        path.join(base, 'index.js'),
        path.join(base, 'index.jsx'),
      ]) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return { shortCircuit: true, url: pathToFileURL(candidate).href };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'virtual-vendor://react') {
      return { shortCircuit: true, format: 'module', source: VENDOR_REACT_JS };
    }
    if (url === 'virtual-vendor://react-dom/client') {
      return { shortCircuit: true, format: 'module', source: VENDOR_REACT_DOM_CLIENT_JS };
    }
    if (url === 'virtual-vendor://react-router-dom') {
      return { shortCircuit: true, format: 'module', source: VENDOR_ROUTER_JS };
    }
    if (url === 'virtual-vendor://lucide-react') {
      return { shortCircuit: true, format: 'module', source: buildLucideVendorSource() };
    }
    if (url.startsWith('virtual-css://')) {
      return { shortCircuit: true, format: 'module', source: 'export default {};' };
    }
    if (url.endsWith('.jsx') && url.startsWith('file://')) {
      const src = fs.readFileSync(fileURLToPath(url), 'utf8');
      return { shortCircuit: true, format: 'module', source: transpileJsx(src) };
    }
    if (url.endsWith('.json') && url.startsWith('file://')) {
      const raw = fs.readFileSync(fileURLToPath(url), 'utf8');
      return { shortCircuit: true, format: 'module', source: `export default ${raw};` };
    }
    return nextLoad(url, context);
  },
});

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { BrowserRouter } = await import('react-router-dom');
const { default: App } = await import('../src/App.jsx');
const { Card } = await import('../src/components/common/OdometerPrimitives.jsx');
const { EV_MILESTONE_IMPACT_MAP } = await import(
  '../src/components/calculators/MaintenanceMilestones.jsx'
);
const { SYMPTOM_FILTERS } = await import('../src/components/calculators/ObdEstimator.jsx');
const { evaluatePidTelemetryVerdict, getPidsForCode } = await import(
  '../src/components/calculators/LivePidEvaluator.jsx'
);
const { generatePpiChecklist } = await import(
  '../src/components/home/PreInspectionChecklist.jsx'
);
const { isObdCompatibleWithVehicle } = await import('../src/data/seoMatrixData.js');
const { VEHICLE_PRESETS } = await import('../src/data/vehiclePresets.js');
const { BRAND_DIRECTORY } = await import('../src/data/brandDirectory.js');
const { ALL_GUIDES_DATA } = await import('../src/data/guidesData.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let rootInstance = null;
let mountSeq = 0;

async function mountRoute(pathname, search = '', { clearStorage = false } = {}) {
  if (clearStorage) storageMap.clear();
  if (rootInstance) {
    rootInstance.render(null);
  }
  headElement.childNodes = [];
  rootContainer.childNodes = [];
  globalThis.document.title = '';
  globalThis.document.documentElement.removeAttribute('class');
  globalThis.window.location.pathname = pathname;
  globalThis.window.location.search = search;
  globalThis.window.location.hash = '';
  globalThis.window.location.href = `http://localhost:5173${pathname}${search}`;
  rootInstance = createRoot(rootContainer);
  rootInstance.render(
    React.createElement(BrowserRouter, { key: `mount-${++mountSeq}` }, React.createElement(App))
  );
  await sleep(140);
}

function getAllElements() {
  return rootContainer.querySelectorAll(() => true);
}

function getOpenDialogs() {
  return rootContainer.querySelectorAll(
    (el) =>
      (el.tagName === 'DIALOG' && el.open) ||
      (el.tagName !== 'DIALOG' && el.getAttribute('role') === 'dialog')
  );
}

function getNativeOpenDialogs() {
  return rootContainer.querySelectorAll((el) => el.tagName === 'DIALOG' && el.open);
}

function clickEl(el) {
  assert.ok(el, 'Expected element to exist before clicking');
  el.dispatchEvent({ type: 'click' });
}

function changeValue(el, value) {
  assert.ok(el, 'Expected input/select element to exist before changing value');
  el.value = String(value);
  el.dispatchEvent({ type: 'input', target: el });
  el.dispatchEvent({ type: 'change', target: el });
}

function findButtonByText(textFragment) {
  return rootContainer.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.textContent.includes(textFragment)
  )[0];
}

function findByTestId(testId) {
  return rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === testId);
}

// ============================================================================
// F1: Visual System, Fluid clamp(), Anti-Clutter & Static Card Restraint
// ============================================================================

test('[R2 Baseline Contract] F1-T1: tailwind.config.js fluid clamp() tokens satisfy WCAG 1.4.4 max <= 2.5x min & light/dark tokens exist', () => {
  const twSrc = fs.readFileSync(path.join(projectRoot, 'tailwind.config.js'), 'utf8');
  const clampMatches = [...twSrc.matchAll(/clamp\(([^)]+)\)/g)];
  assert.ok(clampMatches.length >= 6, `Expected >= 6 clamp() typography tokens, got ${clampMatches.length}`);
  for (const m of clampMatches) {
    const parts = m[1].split(',').map((p) => p.trim());
    assert.equal(parts.length, 3, `Malformed clamp(): ${m[0]}`);
    const minRem = Number.parseFloat(parts[0]);
    const maxRem = Number.parseFloat(parts[2]);
    assert.ok(
      Number.isFinite(minRem) && Number.isFinite(maxRem) && maxRem <= minRem * 2.5 + 1e-9,
      `WCAG 1.4.4 violation in ${m[0]}: max (${maxRem}) exceeds 2.5 * min (${minRem})`
    );
  }

  const appCss = fs.readFileSync(path.join(projectRoot, 'src', 'App.css'), 'utf8');
  const indexCss = fs.readFileSync(path.join(projectRoot, 'src', 'index.css'), 'utf8');
  for (const token of ['#F7F7F4', '#FFFFFF', '#183D22', '#09090B', '#121215', '#10B981']) {
    assert.ok(appCss.includes(token), `App.css must define token ${token}`);
  }
  assert.ok(indexCss.includes('.tabular-nums'), 'index.css must define .tabular-nums');
  assert.ok(appCss.includes('@container') && indexCss.includes('100dvh') && indexCss.includes('100dvw'), 'CSS must use @container, dvh, and dvw');
});

test('[R2 Baseline Contract] F1-T1: Static Card omits hover lift while interactive Card opts into hover lift', () => {
  const staticVNode = Card({ children: 'Static' });
  const staticCls = staticVNode.props.className || '';
  assert.ok(!staticCls.includes('hover:-translate-y'), `Static Card must not lift on hover: ${staticCls}`);
  assert.ok(!staticCls.includes('hover:shadow-card-hover'), `Static Card must not elevate shadow on hover: ${staticCls}`);

  const interactiveVNode = Card({ interactive: true, children: 'Clickable' });
  const interactiveCls = interactiveVNode.props.className || '';
  assert.ok(interactiveCls.includes('hover:-translate-y-0.5'), 'Interactive Card should retain hover lift');
});

test('[R2 Baseline Contract] F1-T1: Dark mode class toggles cleanly on documentElement via ThemeContext', async () => {
  storageMap.clear();
  storageMap.set('shiftmetric_theme', 'dark');
  await mountRoute('/risk-matrix/vw-golf-20-tdi');
  assert.ok(
    globalThis.document.documentElement.classList.contains('dark'),
    'html element must receive .dark class when shiftmetric_theme=dark'
  );
  storageMap.set('shiftmetric_theme', 'light');
  await mountRoute('/risk-matrix/vw-golf-20-tdi');
  assert.ok(
    !globalThis.document.documentElement.classList.contains('dark'),
    'html element must remove .dark class when shiftmetric_theme=light'
  );
});

test('[Phase 3 R1 Target] F1-T1: Zero hover lift classes on static cards across Risk Matrix, OBD Estimator, PPI, Catalog & Guides', async () => {
  const routes = [
    '/risk-matrix/vw-golf-20-tdi',
    '/obd/vw-golf-20-tdi/p0420',
    '/checklist/vw-golf-20-tdi',
    '/vehicles',
    '/guides',
  ];
  for (const route of routes) {
    await mountRoute(route, '', { clearStorage: true });
    const staticHoverCards = rootContainer.querySelectorAll((el) => {
      const cls = el.className || '';
      const isStaticSurface =
        el.tagName === 'SECTION' || el.tagName === 'ARTICLE' || el.id === 'obd-vehicle-telemetry-banner' || cls.includes('shadow-card');
      const hasInteractiveAttr = el.hasAttribute('data-interactive') || el.tagName === 'A' || el.tagName === 'BUTTON';
      return (
        isStaticSurface &&
        !hasInteractiveAttr &&
        !el.classList.contains('card-benchmark-interactive') &&
        (cls.includes('hover:-translate-y') || cls.includes('hover:shadow-card-hover') || cls.includes('hover:shadow-md'))
      );
    });
    assert.equal(
      staticHoverCards.length,
      0,
      `${route} has ${staticHoverCards.length} static card/surface element(s) with forbidden hover-lift/hover-shadow classes`
    );
  }
});

test('[Phase 3 R1 Target] F1-T1: Anti-clutter — zero banned clutter pills & zero decorative uppercase micro-eyebrows on Phase 3 target pages', async () => {
  const bannedLabels = ['Calculated', 'Live', 'Verified OEM Baseline', 'Normal / Sensor fault likely'];
  const routes = [
    '/risk-matrix/vw-golf-20-tdi',
    '/obd/vw-golf-20-tdi/p0420',
    '/checklist/vw-golf-20-tdi',
    '/vehicles',
    '/guides',
  ];

  for (const route of routes) {
    await mountRoute(route, '', { clearStorage: true });
    const exactBanned = rootContainer.querySelectorAll((el) => {
      if (el.tagName !== 'SPAN' && el.tagName !== 'DIV' && el.tagName !== 'P') return false;
      const t = el.textContent.replace(/^[●•\s]+/, '').trim();
      return bannedLabels.includes(t);
    });
    assert.equal(exactBanned.length, 0, `${route} must not render banned clutter pills`);

    // Check decorative uppercase micro-eyebrows (rounded-full / tracking-wider / tracking-widest uppercase pills above headings)
    const decorativeEyebrows = rootContainer.querySelectorAll((el) => {
      const cls = el.className || '';
      const text = el.textContent.trim();
      if (!text || text.length > 80) return false;
      const isUpperEyebrow = cls.includes('uppercase') && (cls.includes('tracking-wider') || cls.includes('tracking-widest'));
      const isDecorativeText =
        text.includes('Technical Methodology & Engineering White Paper') ||
        text.includes('Complete HTML Vehicle Directory') ||
        text.includes('Automotive Due Diligence & Field Guides') ||
        text.includes('Related Vehicle Telemetry & Diagnostics');
      return isUpperEyebrow && isDecorativeText;
    });
    assert.equal(
      decorativeEyebrows.length,
      0,
      `${route} must remove decorative uppercase micro-eyebrows where headings already explain the section (found ${decorativeEyebrows.length})`
    );
  }
});

// ============================================================================
// F2: Native <dialog> Pickers, Bottom Sheets, Sticky Bars & >= 44px Targets
// ============================================================================

test('[Phase 3 R1/R3 Target] F2-T1: Risk Matrix vehicle switcher uses native <dialog> (not <div role="dialog">) and closed dialogs do not pollute DOM', async () => {
  await mountRoute('/risk-matrix/vw-golf-20-tdi', '', { clearStorage: true });
  assert.equal(getOpenDialogs().length, 0, 'Closed dialogs must not appear open on initial mount');

  const switchBtn = findByTestId('risk-switch-car-button')[0];
  assert.ok(switchBtn, 'Must render [data-testid="risk-switch-car-button"]');
  clickEl(switchBtn);
  await sleep(60);

  const modal = findByTestId('risk-vehicle-catalog-modal')[0];
  assert.ok(modal, 'Clicking Switch Car must render [data-testid="risk-vehicle-catalog-modal"]');
  assert.equal(
    modal.tagName,
    'DIALOG',
    `R1 requires native <dialog> picker, found <${modal.tagName.toLowerCase()}>`
  );
  assert.equal(modal.open, true, 'Native <dialog> must be opened via showModal()');

  // Instant selection inside <dialog> switches vehicle and closes dialog
  const teslaChip = modal.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.textContent.includes('Tesla Model 3')
  )[0];
  assert.ok(teslaChip, 'Modal must provide instant preset chip for Tesla Model 3');
  clickEl(teslaChip);
  await sleep(80);
  assert.equal(globalThis.window.location.pathname, '/risk-matrix/tesla-model-3-lr');
  assert.equal(getNativeOpenDialogs().length, 0, 'Selecting vehicle must close native <dialog>');
});

test('[Phase 3 R1/R3 Target] F2-T1: MobileStickySummaryBar on /risk-matrix/:preset opens a native <dialog> bottom sheet (max-h-[88dvh])', async () => {
  await mountRoute('/risk-matrix/vw-golf-20-tdi', '', { clearStorage: true });
  const stickyBar = findByTestId('mobile-sticky-summary-bar')[0];
  assert.ok(stickyBar, 'Must render [data-testid="mobile-sticky-summary-bar"]');
  const triggerBtn = stickyBar.querySelectorAll((el) => el.tagName === 'BUTTON')[0];
  assert.ok(triggerBtn, 'Mobile sticky bar must render Details/Summary trigger button');
  clickEl(triggerBtn);
  await sleep(60);

  const openSheets = rootContainer.querySelectorAll(
    (el) => el.tagName === 'DIALOG' && el.open && el.classList.contains('dl-bottom-sheet-dialog')
  );
  assert.equal(
    openSheets.length,
    1,
    'Clicking MobileStickySummaryBar action on /risk-matrix/:preset must open a native <dialog> BottomSheet (.dl-bottom-sheet-dialog)'
  );
  assert.ok(
    openSheets[0].toHtml().includes('max-h-[88dvh]'),
    'BottomSheet <dialog> must enforce max-h-[88dvh]'
  );
});

test('[Phase 3 R1/R4 Target] F2-T1: MobileStickySummaryBar on /obd/:preset/:code opens a native <dialog> bottom sheet', async () => {
  await mountRoute('/obd/vw-golf-20-tdi/p0420', '', { clearStorage: true });
  const stickyBar = findByTestId('mobile-sticky-summary-bar')[0];
  assert.ok(stickyBar, 'Must render [data-testid="mobile-sticky-summary-bar"] on OBD page');
  const triggerBtn = stickyBar.querySelectorAll((el) => el.tagName === 'BUTTON')[0];
  assert.ok(triggerBtn, 'OBD mobile sticky bar must include trigger button');
  clickEl(triggerBtn);
  await sleep(60);

  const openSheets = rootContainer.querySelectorAll(
    (el) => el.tagName === 'DIALOG' && el.open && el.classList.contains('dl-bottom-sheet-dialog')
  );
  assert.equal(
    openSheets.length,
    1,
    'Clicking MobileStickySummaryBar action on /obd/:preset/:code must open native <dialog> BottomSheet'
  );
});

test('[Phase 3 R1/R5 Target] F2-T2: Checklist Pass/Flag/N/A toggles & dialog close buttons enforce >= 44px tap targets (min-h-[44px])', async () => {
  await mountRoute('/checklist/vw-golf-20-tdi', '', { clearStorage: true });
  const flagButtons = rootContainer.querySelectorAll((el) =>
    String(el.getAttribute('data-testid') || '').startsWith('flag-defect-')
  );
  assert.ok(flagButtons.length >= 4, 'Checklist must render flag-defect-* buttons');
  for (const btn of flagButtons) {
    assert.ok(
      (btn.className || '').includes('min-h-[44px]') || (btn.className || '').includes('h-11'),
      `R5 requires >= 44px tap targets on checklist toggles (missing min-h-[44px] on ${btn.getAttribute('data-testid')})`
    );
  }
});

test('[Phase 3 R1/R3 Target] F2-T2: Vehicle picker <dialog> empty search boundary handles nonsense query gracefully', async () => {
  await mountRoute('/risk-matrix/vw-golf-20-tdi', '', { clearStorage: true });
  clickEl(findByTestId('risk-switch-car-button')[0]);
  await sleep(60);

  const modal = findByTestId('risk-vehicle-catalog-modal')[0];
  assert.equal(modal?.tagName, 'DIALOG', 'Switcher must be a native <dialog>');
  const searchInput = modal.querySelectorAll(
    (el) => el.tagName === 'INPUT' && (el.type === 'search' || el.type === 'text')
  )[0];
  if (searchInput) {
    changeValue(searchInput, 'zzzznonexistent999');
    await sleep(40);
    assert.ok(
      modal.textContent.toLowerCase().includes('no ') || modal.textContent.includes('0'),
      'Empty search in <dialog> picker must show graceful zero-match feedback'
    );
  }
});

// ============================================================================
// F3: Zero-CLS Affiliate/Ad Slots & Crawl-Safe Collapsed Disclosures
// ============================================================================

test('[R2 Baseline Contract] F3-T1: AdUnit preserves min-h-[90px] / min-h-[250px] and VinCheckBanner preserves placements & coupon', async () => {
  await mountRoute('/checklist/vw-golf-20-tdi', '', { clearStorage: true });
  const vinPpi = findByTestId('vin-check-banner')[0];
  assert.ok(vinPpi, '/checklist/:preset must render VinCheckBanner');
  assert.equal(vinPpi.getAttribute('data-placement'), 'ppi');
  assert.ok(vinPpi.textContent.toLowerCase().includes('mydriveledger'), 'VinCheckBanner must display mydriveledger coupon');

  await mountRoute('/guides/used-car-pre-purchase-inspection-guide', '', { clearStorage: true });
  const vinGuide = findByTestId('vin-check-banner')[0];
  assert.ok(vinGuide, '/guides/:slug must render VinCheckBanner');
  assert.equal(vinGuide.getAttribute('data-placement'), 'buyer-guide');

  await mountRoute('/risk-matrix/vw-golf-20-tdi', '', { clearStorage: true });
  const adSlots = rootContainer.querySelectorAll((el) => el.hasAttribute('data-ad-slot'));
  for (const slot of adSlots) {
    const cls = slot.className || '';
    assert.ok(
      cls.includes('min-h-[90px]') || cls.includes('min-h-[250px]'),
      `AdUnit must reserve zero-CLS min-height (${cls})`
    );
  }
});

test('[R2 Baseline Contract] F3-T2: VehicleInternalLinks is absent when no vehicle is selected on bare tool routes', async () => {
  for (const bareRoute of ['/risk-matrix', '/obd-estimator', '/checklist']) {
    await mountRoute(bareRoute, '', { clearStorage: true });
    assert.equal(
      findByTestId('vehicle-internal-links').length,
      0,
      `${bareRoute} must NOT render VehicleInternalLinks when no vehicle is selected`
    );
  }
});

test('[Phase 3 R1 Target] F3-T1: ToolEditorialSection and VehicleInternalLinks are collapsed via <details> or hidden="until-found" (never display:none)', async () => {
  for (const route of ['/risk-matrix/vw-golf-20-tdi', '/obd/vw-golf-20-tdi/p0420', '/checklist/vw-golf-20-tdi']) {
    await mountRoute(route, '', { clearStorage: true });

    const editorial = rootContainer.getElementById('tool-editorial-section');
    assert.ok(editorial, `${route} must render #tool-editorial-section`);
    const editorialDetails = editorial.closest('details') || editorial.querySelector('details');
    const editorialUntilFound = editorial.querySelector('[hidden="until-found"]');
    const isCollapsedInDetails = editorialDetails ? !editorialDetails.open : false;
    assert.ok(
      isCollapsedInDetails || Boolean(editorialUntilFound),
      `${route} ToolEditorialSection must be collapsed by default via <details> (closed) or hidden="until-found"`
    );
    assert.ok(!editorial.toHtml().includes('display:none') && !editorial.toHtml().includes('display: none'), 'Never hide SEO editorial with display:none');

    const internalLinks = findByTestId('vehicle-internal-links')[0];
    assert.ok(internalLinks, `${route} must render VehicleInternalLinks when vehicle is selected`);
    const linksDetails = internalLinks.closest('details') || internalLinks.querySelector('details');
    const linksUntilFound = internalLinks.querySelector('[hidden="until-found"]');
    assert.ok(
      (linksDetails && !linksDetails.open) || Boolean(linksUntilFound),
      `${route} VehicleInternalLinks must be collapsed via <details> or hidden="until-found"`
    );
  }
});

// ============================================================================
// F4: R2 Preserved Contracts, Powertrain Branching, Garage Credits & TestIDs
// ============================================================================

test('[R2 Baseline Contract] F4-T1: Zero default vehicle pre-selection & required DOM IDs / data-testids on /risk-matrix, /obd-estimator, /checklist', async () => {
  await mountRoute('/risk-matrix', '', { clearStorage: true });
  assert.equal(rootContainer.getElementById('risk-preset-sync')?.value, '');
  assert.equal(findByTestId('risk-empty-vehicle-picker').length, 1);
  assert.equal(findByTestId('risk-apply-vehicle-button').length, 1);
  assert.equal(findByTestId('risk-empty-gauge').length, 1);
  assert.equal(findByTestId('risk-empty-dossier-state').length, 1);
  assert.ok(rootContainer.getElementById('risk-odometer-slider'));
  const shareBtn = findByTestId('open-forum-share-btn')[0];
  assert.ok(shareBtn?.hasAttribute('disabled'), 'open-forum-share-btn must be disabled when unselected');

  await mountRoute('/obd-estimator', '', { clearStorage: true });
  assert.equal(rootContainer.getElementById('obd-preset-select')?.value, '');
  assert.ok(rootContainer.getElementById('code-search'));
  assert.equal(findByTestId('obd-no-vehicle-prompt').length, 1);
  assert.equal(findByTestId('obd-drivability-status-badge').length, 1);
  assert.equal(findByTestId('diy-vs-dealer-savings-badge').length, 1);
  assert.equal(findByTestId('live-pid-toggle').length, 1);
  assert.ok(rootContainer.getElementById('workshop-summary-heading')?.textContent.includes('P0420 WORKSHOP COST SUMMARY'));

  await mountRoute('/checklist', '', { clearStorage: true });
  assert.equal(rootContainer.getElementById('ppi-vehicle-select')?.value, '');
  assert.equal(findByTestId('ppi-empty-vehicle-picker').length, 1);
  assert.equal(findByTestId('ppi-apply-vehicle-button').length, 1);
  assert.equal(rootContainer.getElementById('ppi-asking-price'), null);
  assert.equal(rootContainer.getElementById('ppi-odometer-input'), null);
  assert.equal(findByTestId('negotiation-battlecard-summary').length, 0);
});

test('[R2 Baseline Contract] F4-T2: Disabled open-forum-share-btn on unselected /risk-matrix never queues latent modal after selecting a car', async () => {
  await mountRoute('/risk-matrix', '', { clearStorage: true });
  const riskForumBtn = findByTestId('open-forum-share-btn')[0];
  assert.ok(riskForumBtn?.hasAttribute('disabled'));
  clickEl(riskForumBtn);
  await sleep(30);

  const golfChip = findButtonByText('VW Golf TDI');
  clickEl(golfChip);
  await sleep(60);
  assert.equal(getOpenDialogs().length, 0, 'Selecting vehicle after clicking disabled share button must open 0 dialogs');
});

test('[R2 Baseline Contract] F4-T1: Export menu, GarageContext credits (+25 cap) & verified-service-credit-badge work on selected Risk Matrix', async () => {
  await mountRoute('/risk-matrix/vw-golf-20-tdi', '', { clearStorage: true });
  assert.ok(findByTestId('toggle-risk-export-menu').length >= 1, 'Must render toggle-risk-export-menu');

  // Check assembly distance badges exist
  const distBadges = rootContainer.querySelectorAll((el) =>
    String(el.getAttribute('data-testid') || '').startsWith('assembly-service-distance-')
  );
  assert.ok(distBadges.length >= 4, 'Must render assembly-service-distance-* badges');

  // Toggle a "Recently Serviced" button on an assembly
  const servicedBtn = rootContainer.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.textContent.includes('Mark Serviced')
  )[0] || rootContainer.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.textContent.includes('Serviced')
  )[0];
  assert.ok(servicedBtn, 'Must find serviced toggle button on Risk Matrix assembly');
  clickEl(servicedBtn);
  await sleep(60);

  assert.ok(
    findByTestId('verified-service-credit-badge').length >= 1 || findByTestId('maintenance-bonus-badge').length >= 1,
    'Marking an assembly serviced must surface verified-service-credit-badge or maintenance-bonus-badge'
  );

  // Open export menu and trigger Forum Share modal
  clickEl(findByTestId('toggle-risk-export-menu')[0]);
  await sleep(40);
  const forumBtn = findByTestId('open-forum-share-btn')[0];
  assert.ok(forumBtn && !forumBtn.hasAttribute('disabled'), 'open-forum-share-btn must be enabled when vehicle selected');
  clickEl(forumBtn);
  await sleep(40);
  assert.ok(rootContainer.toHtml().includes('forum-share-modal'), 'ForumShareModal must open when clicked');
});

test('[R2 Baseline Contract] F4-T1: ICE vs Hybrid vs EV powertrain branching across Risk Matrix, Milestones & OBD compatibility', async () => {
  // EV
  await mountRoute('/risk-matrix/tesla-model-3-lr', '', { clearStorage: true });
  const evHtml = rootContainer.toHtml();
  assert.ok(evHtml.includes('ev-battery-soh') || evHtml.includes('High-Voltage') || evHtml.includes('SoH'), 'EV risk matrix must render EV battery assemblies');
  assert.ok(!evHtml.includes('dpf-egr-scr-injectors'), 'EV must NOT render diesel DPF assembly');
  assert.ok(!evHtml.includes('timing-assembly'), 'EV must NOT render ICE timing assembly');
  assert.ok(Object.keys(EV_MILESTONE_IMPACT_MAP).length >= 5, 'EV_MILESTONE_IMPACT_MAP must preserve EV milestones');

  // Diesel
  await mountRoute('/risk-matrix/vw-golf-20-tdi', '', { clearStorage: true });
  const dieselHtml = rootContainer.toHtml();
  assert.ok(dieselHtml.includes('dpf-egr-scr-injectors'), 'Diesel must render DPF/EGR/SCR assembly');
  assert.ok(!dieselHtml.includes('ev-battery-soh'), 'Diesel must NOT render EV battery assembly');

  // Hybrid
  await mountRoute('/risk-matrix/toyota-camry-hybrid', '', { clearStorage: true });
  const hybridHtml = rootContainer.toHtml();
  assert.ok(hybridHtml.includes('hv-battery-thermal-loop'), 'Hybrid must render HV battery thermal loop');
  assert.ok(!hybridHtml.includes('ev-obc-iccu'), 'Hybrid must NOT render pure-EV OBC/ICCU');

  // OBD compatibility
  const evPreset = VEHICLE_PRESETS.find((p) => p.id === 'tesla-model-3-lr');
  assert.equal(isObdCompatibleWithVehicle(evPreset, 'P0420'), false);
  assert.equal(isObdCompatibleWithVehicle(evPreset, 'U0100'), true);
});

test('[R2 Baseline Contract] F4-T2: Corrupted localStorage, invalid ?preset=, and unknown route recover safely', async () => {
  storageMap.clear();
  storageMap.set('shiftmetric_garage_v1', '{broken-json');
  storageMap.set('shiftmetric_region', 'INVALID_REGION');
  storageMap.set('shiftmetric_theme', 'sepia');

  await mountRoute('/risk-matrix', '?preset=nonexistent-car-xyz');
  assert.equal(rootContainer.getElementById('risk-preset-sync')?.value, '', 'Invalid ?preset= must stay unselected');
  assert.equal(findByTestId('risk-empty-vehicle-picker').length, 1);

  await mountRoute('/nonexistent-telemetry-route');
  assert.equal(findByTestId('not-found-view').length, 1, 'Unknown route must render not-found-view');
  assert.equal(headElement.querySelector('meta[name="robots"]')?.getAttribute('content'), 'noindex, nofollow');
});

// ============================================================================
// F5: Maintenance Risk Matrix Workspace Split, Tabs & Scannable Rows
// ============================================================================

test('[Phase 3 R3 Target] F5-T1: /risk-matrix/:preset renders 2-col desktop split with sticky right verdict & 3 workspace tabs', async () => {
  await mountRoute('/risk-matrix/vw-golf-20-tdi', '', { clearStorage: true });

  // Sticky right verdict card (lg:sticky)
  const stickyPanels = rootContainer.querySelectorAll((el) => (el.className || '').includes('lg:sticky'));
  assert.ok(stickyPanels.length >= 1, 'R3 requires sticky right verdict column (lg:sticky) on /risk-matrix/:preset');

  // 3 workspace tabs: Component Risk Matrix, Service Milestones, Known Model Issues Dossier
  const tablist = rootContainer.querySelectorAll((el) => el.getAttribute('role') === 'tablist')[0];
  assert.ok(tablist, 'R3 requires role="tablist" workspace switcher on /risk-matrix/:preset');
  const tabs = tablist.querySelectorAll((el) => el.getAttribute('role') === 'tab');
  assert.equal(tabs.length, 3, `R3 requires exactly 3 workspace tabs, found ${tabs.length}`);
  const tabText = tabs.map((t) => t.textContent).join(' | ');
  assert.ok(tabText.includes('Component Risk Matrix') || tabText.includes('Risk Matrix'), `Missing Component Risk Matrix tab in: ${tabText}`);
  assert.ok(tabText.includes('Service Milestones') || tabText.includes('Milestones'), `Missing Service Milestones tab in: ${tabText}`);
  assert.ok(tabText.includes('Known Model Issues') || tabText.includes('Dossier'), `Missing Known Model Issues Dossier tab in: ${tabText}`);

  // Inactive tabpanels remain searchable via hidden="until-found"
  const tabpanels = rootContainer.querySelectorAll(
    (el) => el.getAttribute('role') === 'tabpanel' && String(el.id || '').startsWith('risk-panel-')
  );
  assert.equal(tabpanels.length, 3, 'Must render 3 tabpanel containers');
  const inactiveUntilFound = tabpanels.filter((p) => p.getAttribute('hidden') === 'until-found');
  assert.equal(inactiveUntilFound.length, 2, '2 inactive tabpanels should use hidden="until-found" for Find-in-Page searchability');

  // Switch to Service Milestones tab
  clickEl(tabs[1]);
  await sleep(50);
  const tabSelected = tabs[1].getAttribute('aria-selected');
  assert.ok(tabSelected === 'true' || tabSelected === '', `Clicking Service Milestones tab must set aria-selected (got ${tabSelected})`);
});

test('[Phase 3 R3 Target] F5-T1: Scannable component rows expand engineering notes on demand via <details> or detail drawer', async () => {
  await mountRoute('/risk-matrix/vw-golf-20-tdi', '', { clearStorage: true });
  const assemblyRows = rootContainer.querySelectorAll((el) =>
    Boolean(el.querySelector((c) => String(c.getAttribute('data-testid') || '').startsWith('assembly-service-distance-')))
  );
  assert.ok(assemblyRows.length >= 4, 'Must render scannable component rows with assembly-service-distance-*');

  const componentDetails = rootContainer.querySelectorAll(
    (el) =>
      el.tagName === 'DETAILS' &&
      (el.closest((p) => p.getAttribute('role') === 'tabpanel') ||
        el.textContent.includes('OEM') ||
        el.textContent.includes('Timing') ||
        el.textContent.includes('DPF'))
  );
  assert.ok(
    componentDetails.length >= 4,
    `R3 requires scannable component rows with on-demand <details> expansion (found ${componentDetails.length})`
  );
});

test('[R2 Baseline Contract] F5-T1/T2: Schedule OEM vs Preventative, 0 mi & 310,000 mi boundaries, 100k-miles bracket & popstate reset', async () => {
  await mountRoute('/risk-matrix/vw-golf-20-tdi/100k-miles', '', { clearStorage: true });
  assert.equal(rootContainer.getElementById('risk-odometer-slider')?.value, '100000', '100k-miles bracket must hydrate odometer to 100,000');

  // Toggle OEM Standard
  const oemBtn = findButtonByText('OEM Standard');
  assert.ok(oemBtn, 'Must find OEM Standard schedule button');
  clickEl(oemBtn);
  await sleep(50);
  assert.ok(rootContainer.toHtml().includes('RISK EXPOSURE') || rootContainer.toHtml().includes('OEM'), 'OEM mode must surface risk multiplier warning');

  // 0 mi boundary
  const slider0 = rootContainer.getElementById('risk-odometer-slider');
  changeValue(slider0, 0);
  await sleep(50);
  assert.equal(slider0.value, '0');
  assert.ok(!rootContainer.toHtml().includes('NaN'), '0 mi boundary must never produce NaN');

  // 310,000 mi boundary (clamped above max)
  changeValue(rootContainer.getElementById('risk-odometer-slider'), 450000);
  await sleep(50);
  assert.ok(Number(rootContainer.getElementById('risk-odometer-slider').value) <= 310000, 'US odometer must clamp <= 310,000 mi');
  assert.ok(!rootContainer.toHtml().includes('NaN'), 'Max odometer boundary must never produce NaN');

  // popstate back to bare /risk-matrix resets selection
  globalThis.window.history.pushState({}, '', '/risk-matrix');
  globalThis.window.dispatchEvent({ type: 'popstate' });
  await sleep(60);
  assert.equal(rootContainer.getElementById('risk-preset-sync')?.value, '');
  assert.equal(findByTestId('risk-empty-vehicle-picker').length, 1);
});

// ============================================================================
// F6: OBD-II Estimator Verdict Strip, Deep-Dives & Live PID Thresholds
// ============================================================================

test('[R2 Baseline Contract] F6-T1: #code-search filtering, quick chips, EV incompatible auto-switch & clean clear', async () => {
  await mountRoute('/obd-estimator', '', { clearStorage: true });
  const search = rootContainer.getElementById('code-search');
  changeValue(search, 'P2002');
  await sleep(40);
  assert.ok(rootContainer.toHtml().includes('P2002'), 'Searching P2002 must surface P2002 result');

  // Unknown query boundary
  changeValue(rootContainer.getElementById('code-search'), 'P9999');
  await sleep(40);
  assert.ok(rootContainer.textContent.includes('No matching') || rootContainer.textContent.includes('P0420 WORKSHOP COST SUMMARY'), 'Unknown code search must handle empty result safely');

  // Select EV while on P0420 -> auto-switches off P0420 -> clearing restores P0420 & clean URL
  changeValue(rootContainer.getElementById('obd-preset-select'), 'tesla-model-3-lr');
  await sleep(60);
  assert.ok(!rootContainer.toHtml().includes('P0420 WORKSHOP COST SUMMARY'), 'EV must auto-switch off P0420');
  assert.ok(
    globalThis.window.location.search.includes('preset=tesla-model-3-lr') ||
      globalThis.window.location.pathname.includes('/obd/tesla-model-3-lr/'),
    'Selecting EV must keep preset in URL'
  );

  changeValue(rootContainer.getElementById('obd-preset-select'), '');
  await sleep(60);
  assert.ok(rootContainer.toHtml().includes('GENERIC SAE J1979 PROFILE'));
  assert.ok(rootContainer.toHtml().includes('P0420 WORKSHOP COST SUMMARY'));
  assert.equal(globalThis.window.location.pathname, '/obd-estimator');
  assert.equal(globalThis.window.location.search, '');
});

test('[Phase 3 R4 Target] F6-T1: /obd/:preset/:code renders crisp 3-metric verdict strip & tucks deep-dives in tabs or <details>', async () => {
  await mountRoute('/obd/vw-golf-20-tdi/p0420', '', { clearStorage: true });

  // 3-metric verdict strip directly below search/header
  const verdictStrip = findByTestId('obd-verdict-strip')[0] || rootContainer.querySelector('.cq-metrics-row');
  assert.ok(verdictStrip, 'R4 requires crisp 3-metric verdict strip (data-testid="obd-verdict-strip" or .cq-metrics-row)');
  const stripText = verdictStrip.textContent;
  assert.ok(stripText.includes('Independent') && stripText.includes('Dealership'), `3-metric strip must show Independent & Dealership quote ranges (got: ${stripText})`);
  assert.ok(verdictStrip.toHtml().includes('tabular-nums'), '3-metric verdict strip must use tabular-nums');

  // Secondary deep-dives tucked into tabs or <details> disclosures
  const deepDiveTabsOrDetails = rootContainer.querySelectorAll(
    (el) =>
      (el.tagName === 'DETAILS' &&
        (el.textContent.includes('Root Cause') || el.textContent.includes('Live PID') || el.textContent.includes('DIY') || el.textContent.includes('Negotiation'))) ||
      (el.getAttribute('role') === 'tab' &&
        (el.textContent.includes('Root Cause') || el.textContent.includes('Live PID') || el.textContent.includes('DIY')))
  );
  assert.ok(
    deepDiveTabsOrDetails.length >= 3,
    `R4 requires secondary deep-dives (Root Cause, Live PID, DIY Steps, Workshop Tips) tucked into tabs or <details> disclosures (found ${deepDiveTabsOrDetails.length})`
  );
});

test('[R2 Baseline Contract] F6-T2: LivePidEvaluator presets (#pid-preset-good|warn|risk), $0 DIY labor edge & banned string check', async () => {
  await mountRoute('/obd/vw-golf-20-tdi/p2002', '', { clearStorage: true });

  const toggleBtn = findByTestId('live-pid-toggle')[0];
  assert.ok(toggleBtn, 'Must find live-pid-toggle');
  clickEl(toggleBtn);
  await sleep(60);

  assert.ok(findByTestId('live-pid-evaluator').length >= 1, 'LivePidEvaluator must mount when toggled');

  for (const presetId of ['pid-preset-good', 'pid-preset-warn', 'pid-preset-risk']) {
    const btn = rootContainer.getElementById(presetId);
    assert.ok(btn, `Must find #${presetId}`);
    clickEl(btn);
    await sleep(40);
    assert.ok(!rootContainer.textContent.includes('Normal / Sensor fault likely'), 'Banned string must never appear');
    if (presetId === 'pid-preset-good') {
      assert.equal(findByTestId('pid-verdict-badge').length, 0, 'Good preset omits redundant verdict pill');
    } else {
      assert.ok(findByTestId('pid-verdict-badge').length >= 1, `pid-verdict-badge must render for ${presetId}`);
    }
  }

  // DIY Garage $0/hr edge
  const diyBtn = findButtonByText('DIY Garage');
  assert.ok(diyBtn, 'Must find DIY Garage tier button');
  clickEl(diyBtn);
  await sleep(40);
  assert.ok(!rootContainer.toHtml().includes('NaN'), 'DIY $0/hr labor must never produce NaN');
  assert.ok(SYMPTOM_FILTERS.length >= 6, 'SYMPTOM_FILTERS export preserved');
  assert.ok(typeof evaluatePidTelemetryVerdict === 'function' && typeof getPidsForCode === 'function');
});

test('[Phase 3 R4 Target] F6-T1: LivePidEvaluator renders visual Normal / Warning / Critical threshold bars per PID', async () => {
  await mountRoute('/obd/vw-golf-20-tdi/p2002', '', { clearStorage: true });
  clickEl(findByTestId('live-pid-toggle')[0]);
  await sleep(60);

  const evaluator = findByTestId('live-pid-evaluator')[0];
  assert.ok(evaluator, 'LivePidEvaluator must mount');
  const thresholdBars = evaluator.querySelectorAll(
    (el) => el.getAttribute('data-testid') === 'pid-threshold-bar' || (el.getAttribute('role') === 'meter')
  );
  assert.ok(
    thresholdBars.length >= 2,
    `R4 requires visual Normal / Warning / Critical threshold bars per PID (data-testid="pid-threshold-bar" or role="meter", found ${thresholdBars.length})`
  );
});

// ============================================================================
// F7: Pre-Purchase Inspection (PPI) Field Checklist & Negotiation Summary
// ============================================================================

test('[Phase 3 R5 Target] F7-T1: /checklist/:preset groups checks into 4 collapsible <details> stages with live X/Y counts & 3-state Pass/Flag/N/A', async () => {
  await mountRoute('/checklist/vw-golf-20-tdi', '', { clearStorage: true });

  const stageDetails = rootContainer.querySelectorAll(
    (el) =>
      el.tagName === 'DETAILS' &&
      (el.textContent.includes('Cold Start') ||
        el.textContent.includes('Exterior') ||
        el.textContent.includes('Cabin') ||
        el.textContent.includes('Road Test'))
  );
  assert.equal(
    stageDetails.length,
    4,
    `R5 requires 4 collapsible <details> inspection stage groups (found ${stageDetails.length})`
  );

  // Check Pass / Flag / N/A mutual exclusion per step using opaque-box button labels + R2 flag-defect-* testid
  const flagBtn0 = rootContainer.querySelectorAll((el) =>
    String(el.getAttribute('data-testid') || '').startsWith('flag-defect-')
  )[0];
  assert.ok(flagBtn0, 'Must render flag-defect-* button');
  const toggleGroup = flagBtn0.closest((el) => el.getAttribute('role') === 'group') || flagBtn0.parentNode;
  const passBtn0 = toggleGroup.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.textContent.trim().startsWith('Pass')
  )[0];
  const naBtn0 = toggleGroup.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.textContent.trim() === 'N/A'
  )[0];
  assert.ok(passBtn0 && naBtn0, 'R5 requires explicit Pass / Flag / N/A toggles per check');

  clickEl(passBtn0);
  await sleep(40);
  const passActive = passBtn0.getAttribute('aria-pressed');
  assert.ok(passActive === 'true' || passActive === '', 'Clicking Pass must activate Pass toggle');

  clickEl(flagBtn0);
  await sleep(40);
  const passPressed = passBtn0.getAttribute('aria-pressed');
  const flagPressed = flagBtn0.getAttribute('aria-pressed');
  assert.ok(passPressed === 'false' || passPressed === null, 'Flagging a step must mutually exclude Pass');
  assert.ok(flagPressed === 'true' || flagPressed === '', 'Flag toggle must reflect active aria-pressed');

  clickEl(naBtn0);
  await sleep(40);
  const flagAfterNa = flagBtn0.getAttribute('aria-pressed');
  const naPressed = naBtn0.getAttribute('aria-pressed');
  assert.ok(flagAfterNa === 'false' || flagAfterNa === null, 'Marking N/A must mutually exclude Flag');
  assert.ok(naPressed === 'true' || naPressed === '', 'N/A toggle must reflect active aria-pressed');
});

test('[Phase 3 R5 Target] F7-T1: One-tap Printable / Negotiation Summary action opens native <dialog>', async () => {
  await mountRoute('/checklist/vw-golf-20-tdi', '', { clearStorage: true });
  const summaryBtn = rootContainer.querySelectorAll(
    (el) =>
      el.tagName === 'BUTTON' &&
      (el.getAttribute('data-testid') === 'ppi-open-summary-dialog' ||
        el.textContent.includes('Printable') ||
        el.textContent.includes('Negotiation Summary'))
  )[0];
  assert.ok(summaryBtn, 'R5 requires one-tap Generate Printable / Negotiation Summary button');
  clickEl(summaryBtn);
  await sleep(50);

  const openDialogs = getNativeOpenDialogs();
  assert.ok(openDialogs.length >= 1, 'One-tap summary button must open a native <dialog>');
  assert.ok(
    openDialogs[0].textContent.includes('Offer') || openDialogs[0].textContent.includes('Negotiation'),
    'Summary <dialog> must display negotiation summary'
  );
});

test('[R2 Baseline Contract] F7-T2: Negotiation battlecard math, $0 asking price edge, EV isolation & query param hydration', async () => {
  await mountRoute('/checklist/vw-golf-20-tdi', '?odo=95000&price=18500&reg=EU&flagged=step-obd-scan', {
    clearStorage: true,
  });
  const odoVal = Number(String(rootContainer.getElementById('ppi-odometer-input')?.value || '').replace(/[^0-9]/g, ''));
  assert.ok(odoVal >= 152880 && odoVal <= 152900, `reg=EU must convert 95000 mi to ~152888 km (got ${odoVal})`);
  const priceVal = Number(String(rootContainer.getElementById('ppi-asking-price')?.value || '').replace(/[^0-9]/g, ''));
  assert.ok(priceVal > 14000 && priceVal <= 19000, `reg=EU must convert $18500 USD asking price to EUR (got ${priceVal})`);
  assert.ok(rootContainer.toHtml().includes('€'), 'reg=EU query param must hydrate EUR currency');
  assert.ok(findByTestId('battlecard-total-deduction')[0]?.textContent.includes('€'));

  // $0 asking price edge: must not produce NaN or negative opening offer
  changeValue(rootContainer.getElementById('ppi-asking-price'), '0');
  await sleep(40);
  const openingText = findByTestId('battlecard-opening-offer')[0]?.textContent || '';
  assert.ok(!openingText.includes('NaN') && !openingText.includes('-'), `Asking price 0 must stay non-negative (got ${openingText})`);

  // EV PPI isolation
  await mountRoute('/checklist/tesla-model-3-lr', '', { clearStorage: true });
  const evHtml = rootContainer.toHtml();
  assert.ok(evHtml.includes('HV Battery State of Health (SoH %)'), 'EV PPI must render HV Battery SoH step');
  assert.ok(evHtml.includes('On-Board Charger (OBC / ICCU)'), 'EV PPI must render OBC/ICCU step');
  assert.ok(!evHtml.includes('Oil Filler Cap Pressure Test'), 'EV PPI must omit ICE oil filler blowby step');
  assert.ok(typeof generatePpiChecklist === 'function');
});

// ============================================================================
// F8: Vehicle Catalog (/vehicles), Brand Hubs, Guides & 404 Recovery
// ============================================================================

test('[R2 Baseline Contract] F8-T1: /vehicles filtering (All/EV/Diesel/search/empty), 35 brands & 179 models', async () => {
  assert.equal(BRAND_DIRECTORY.length, 35);
  assert.equal(VEHICLE_PRESETS.length, 179);
  assert.equal(ALL_GUIDES_DATA.length, 10);

  await mountRoute('/vehicles', '', { clearStorage: true });
  assert.equal(findByTestId('vehicles-catalog-page').length, 1);

  // Filter EV (scoped to BrandModelDirectory so navbar/footer links do not interfere)
  const evFilterBtn = findButtonByText('Electric (EV)');
  assert.ok(evFilterBtn);
  clickEl(evFilterBtn);
  await sleep(50);
  const directoryEl = findByTestId('brand-model-directory')[0];
  assert.ok(directoryEl, 'Must render brand-model-directory');
  const evHtml = directoryEl.toHtml();
  assert.ok(evHtml.includes('tesla-model-3-lr'), 'EV filter must retain Tesla Model 3');
  assert.ok(!evHtml.includes('vw-golf-20-tdi'), 'EV filter must exclude VW Golf 2.0 TDI');

  // Empty search boundary
  const search = rootContainer.getElementById('vehicles-catalog-search');
  changeValue(search, 'zzzzzz-not-a-car');
  await sleep(40);
  assert.ok(rootContainer.textContent.includes('0') || rootContainer.textContent.toLowerCase().includes('no '), 'Empty search must show graceful zero-results state');
});

test('[R2 Baseline Contract] F8-T1: /vehicles/toyota & /vehicles/volkswagen render single <h1> & <a href> tool links; unknown brand renders 404', async () => {
  await mountRoute('/vehicles/toyota', '', { clearStorage: true });
  assert.equal(findByTestId('brand-hub-page').length, 1);
  const toyotaH1s = rootContainer.querySelectorAll((el) => el.tagName === 'H1');
  assert.equal(toyotaH1s.length, 1);
  assert.ok(toyotaH1s[0].textContent.includes('Toyota'));
  assert.ok(rootContainer.toHtml().includes('href="/tco/toyota-camry-hybrid"'));

  await mountRoute('/vehicles/volkswagen', '', { clearStorage: true });
  const vwH1s = rootContainer.querySelectorAll((el) => el.tagName === 'H1');
  assert.equal(vwH1s.length, 1);
  assert.ok(vwH1s[0].textContent.includes('Volkswagen'));
  assert.ok(rootContainer.toHtml().includes('href="/risk-matrix/vw-golf-20-tdi"'));

  await mountRoute('/vehicles/nonexistent-brand-xyz', '', { clearStorage: true });
  assert.equal(findByTestId('not-found-view').length, 1);
});

test('[Phase 3 R6 Target] F8-T1: /guides & /guides/:slug use semantic <button>/<label> checklists and native <details> FAQs', async () => {
  await mountRoute('/guides', '', { clearStorage: true });
  assert.ok(rootContainer.textContent.includes('Buyer Guides'), '/guides must render hub');

  await mountRoute('/guides/used-car-pre-purchase-inspection-guide', '', { clearStorage: true });
  assert.equal(findByTestId('vin-check-banner')[0]?.getAttribute('data-placement'), 'buyer-guide');

  // Interactive checklist items must be semantic <button> or <label> (not clickable <div>)
  const semanticChecklistItems = rootContainer.querySelectorAll(
    (el) =>
      (el.tagName === 'BUTTON' || el.tagName === 'LABEL') &&
      (el.textContent.includes('OBD') || el.textContent.includes('cold') || el.textContent.includes('paint') || el.textContent.includes('VIN'))
  );
  assert.ok(
    semanticChecklistItems.length >= 3,
    `R6/A11y requires semantic <button> or <label> checklist items on /guides/:slug (found ${semanticChecklistItems.length})`
  );

  // FAQs must use native <details>
  const faqDetails = rootContainer.querySelectorAll(
    (el) => el.tagName === 'DETAILS' && el.textContent.includes('?')
  );
  assert.ok(
    faqDetails.length >= 2,
    `R6 requires native <details> FAQ accordions on /guides/:slug (found ${faqDetails.length})`
  );
});

// ============================================================================
// Tier 3: Cross-Feature Pairwise Combinations (Node DOM)
// ============================================================================

test('[R2 Baseline Contract] Tier 3 P1: Region switch (US -> EU -> UK) consistently updates currency & distance bounds across Risk, OBD & PPI', async () => {
  await mountRoute('/risk-matrix/vw-golf-20-tdi', '', { clearStorage: true });
  const euBtn = findButtonByText('EU (€');
  assert.ok(euBtn);
  clickEl(euBtn);
  await sleep(40);
  assert.ok(rootContainer.toHtml().includes('€') && rootContainer.toHtml().includes('km'), 'Risk Matrix must update to EUR & km');
  assert.equal(rootContainer.getElementById('risk-odometer-slider')?.getAttribute('max'), '500000', 'EU odometer slider max must be 500,000 km');

  const ukBtn = findButtonByText('UK (£');
  clickEl(ukBtn);
  await sleep(40);
  assert.ok(rootContainer.toHtml().includes('£'), 'Risk Matrix must update to GBP');
});

test('[R2 Baseline Contract] Tier 3 P5: Collapse searchable attribute emits hidden="until-found" & dispatches beforematch when HTMLElement.onbeforematch exists', async () => {
  await mountRoute('/obd/vw-golf-20-tdi/p2002', '', { clearStorage: true });
  const toggleBtn = findByTestId('methodology-accordion-toggle')[0];
  assert.ok(toggleBtn, 'Must render methodology-accordion-toggle inside ToolEditorialSection');
  const expanded = toggleBtn.getAttribute('aria-expanded');
  if (expanded === '' || expanded === 'true') {
    clickEl(toggleBtn);
    await sleep(40);
  }
  const methodCollapse = rootContainer.getElementById('tool-methodology-obd');
  assert.ok(methodCollapse, 'Must render #tool-methodology-obd');
  assert.equal(
    methodCollapse.getAttribute('hidden'),
    'until-found',
    'Closed searchable Collapse must emit hidden="until-found" when onbeforematch is supported'
  );
  methodCollapse.dispatchEvent({ type: 'beforematch' });
  await sleep(50);
  assert.equal(
    methodCollapse.getAttribute('hidden'),
    null,
    'Dispatching beforematch on Collapse must auto-expand content and remove hidden="until-found"'
  );
});

test('[R2 Baseline Contract] Tier 3 P7: Schedule OEM vs Preventative × Powertrain branching (diesel vs EV)', async () => {
  await mountRoute('/risk-matrix/vw-golf-20-tdi', '', { clearStorage: true });
  clickEl(findButtonByText('OEM Standard'));
  await sleep(40);
  assert.ok(rootContainer.toHtml().includes('OMITTED') || rootContainer.toHtml().includes('OEM'), 'Diesel OEM mode must surface OEM omission flags');

  await mountRoute('/risk-matrix/tesla-model-3-lr', '', { clearStorage: true });
  clickEl(findButtonByText('OEM Standard'));
  await sleep(40);
  assert.ok(!rootContainer.toHtml().includes('dpf-egr-scr-injectors'), 'EV OEM mode must never leak diesel DPF items');
});

// ============================================================================
// Tier 4: Real-World End-to-End Buyer & Owner Journeys (Node DOM)
// ============================================================================

test('[R2 Baseline Contract] Tier 4 S1: Used Diesel Buyer Journey (vw-golf-20-tdi -> P2002 + Live PID -> Checklist Battlecard)', async () => {
  await mountRoute('/risk-matrix/vw-golf-20-tdi', '', { clearStorage: true });
  assert.ok(rootContainer.toHtml().includes('Volkswagen Golf'));
  changeValue(rootContainer.getElementById('risk-odometer-slider'), 68000);
  await sleep(40);

  await mountRoute('/obd/vw-golf-20-tdi/p2002');
  assert.ok(rootContainer.getElementById('workshop-summary-heading')?.textContent.includes('P2002 WORKSHOP COST SUMMARY'));
  clickEl(findByTestId('live-pid-toggle')[0]);
  await sleep(50);
  clickEl(rootContainer.getElementById('pid-preset-risk'));
  await sleep(40);
  assert.ok(findByTestId('telemetry-narrowed-cost').length >= 1);

  await mountRoute('/checklist/vw-golf-20-tdi');
  const flagBtn = findByTestId('flag-defect-step-obd-scan')[0];
  assert.ok(flagBtn);
  clickEl(flagBtn);
  await sleep(40);
  const totalDed = findByTestId('battlecard-total-deduction')[0]?.textContent || '';
  assert.ok(totalDed.startsWith('-$') && totalDed !== '-$0', `Flagging defect must compute non-zero deduction (got ${totalDed})`);
});

test('[R2 Baseline Contract] Tier 4 S2: Used EV Buyer Journey (Catalog EV filter -> tesla-model-3-lr Risk -> OBD auto-switch -> EV Checklist)', async () => {
  await mountRoute('/vehicles', '', { clearStorage: true });
  clickEl(findButtonByText('Electric (EV)'));
  await sleep(40);
  assert.ok(rootContainer.toHtml().includes('tesla-model-3-lr'));

  await mountRoute('/risk-matrix/tesla-model-3-lr');
  assert.ok(!rootContainer.toHtml().includes('timing-assembly'));

  await mountRoute('/obd-estimator');
  changeValue(rootContainer.getElementById('obd-preset-select'), 'tesla-model-3-lr');
  await sleep(50);
  assert.ok(!rootContainer.toHtml().includes('P0420 WORKSHOP COST SUMMARY'));

  await mountRoute('/checklist/tesla-model-3-lr');
  assert.ok(rootContainer.toHtml().includes('HV Battery State of Health (SoH %)'));
});

test('[R2 Baseline Contract] Tier 4 S3: EcoBlue Diesel Field PPI Journey (ford-focus-ecoblue -> price + flag -> battlecard)', async () => {
  await mountRoute('/checklist/ford-focus-ecoblue', '', { clearStorage: true });
  changeValue(rootContainer.getElementById('ppi-asking-price'), '16500');
  changeValue(rootContainer.getElementById('ppi-odometer-input'), '72000');
  await sleep(40);
  const flagBtn = findByTestId('flag-defect-step-cold-start')[0] || rootContainer.querySelectorAll((el) =>
    String(el.getAttribute('data-testid') || '').startsWith('flag-defect-')
  )[0];
  clickEl(flagBtn);
  await sleep(40);
  assert.ok(findByTestId('battlecard-opening-offer')[0]?.textContent.includes('$'));
});

test('[R2 Baseline Contract] Tier 4 S4: Hybrid EU Buyer Journey (toyota-camry-hybrid/100k-miles + EU + P0A80)', async () => {
  await mountRoute('/risk-matrix/toyota-camry-hybrid/100k-miles', '', { clearStorage: true });
  clickEl(findButtonByText('EU (€'));
  await sleep(50);
  assert.ok(rootContainer.toHtml().includes('€') && rootContainer.toHtml().includes('hv-battery-thermal-loop'));

  await mountRoute('/obd/toyota-camry-hybrid/p0a80');
  assert.ok(rootContainer.getElementById('workshop-summary-heading')?.textContent.includes('P0A80 WORKSHOP COST SUMMARY'));
  assert.ok(rootContainer.toHtml().includes('€'));
});

test('[R2 Baseline Contract] Tier 4 S6: 404 Recovery -> /vehicles/volkswagen -> /guides/used-car-pre-purchase-inspection-guide', async () => {
  await mountRoute('/nonexistent-page-xyz', '', { clearStorage: true });
  assert.equal(findByTestId('not-found-view').length, 1);

  await mountRoute('/vehicles/volkswagen');
  assert.equal(findByTestId('brand-hub-page').length, 1);

  await mountRoute('/guides/used-car-pre-purchase-inspection-guide');
  assert.equal(findByTestId('vin-check-banner')[0]?.getAttribute('data-placement'), 'buyer-guide');
});

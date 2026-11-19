/**
 * DriveLedger Live DOM & Routing Audit Verification Suite
 *
 * Mounts the real <App /> into a Node mock DOM to verify:
 * 1. Zero duplicate <h1> and single FAQPage JSON-LD on homepage (/)
 * 2. Unselected /tco, /risk-matrix, /checklist keep generic tool titles (no sample vehicle leak)
 * 3. /methodology, /reviews, /vehicles emit dedicated titles & canonical URLs
 * 4. Unknown paths render dedicated 404 view with robots="noindex, nofollow"
 * 5. Legal route (/privacy) suppresses Vehicle, HowTo, and FAQPage JSON-LD
 * 6. Vehicle page (/tco/vw-golf-20-tdi) renders VehicleInternalLinks with lowercase OBD & bracket links
 * 7. /vehicles lazy-loads VehiclesCatalogPage with all 35 brands & 179 models
 * 8. Single guide (/guides/used-bmw-3-series-buying-checklist) emits guide-specific FAQPage JSON-LD
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

class MockTextNode {
  constructor(text) {
    this.nodeType = 3;
    this.nodeValue = String(text);
    this.parentNode = null;
  }
  get textContent() { return this.nodeValue; }
  set textContent(v) { this.nodeValue = String(v); }
  toHtml() { return this.nodeValue; }
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
  get lastChild() { return this.childNodes[this.childNodes.length - 1] || null; }
  toHtml() { return this.childNodes.map((c) => c.toHtml()).join(''); }
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
      add: (...t) => t.forEach((x) => this.classList._set.add(x)),
      remove: (...t) => t.forEach((x) => this.classList._set.delete(x)),
      contains: (x) => this.classList._set.has(x),
    };
  }
  get id() { return this._attrs.get('id') || ''; }
  set id(v) { this.setAttribute('id', v); }
  get className() { return this._attrs.get('class') || ''; }
  set className(v) { this.setAttribute('class', v); }
  get value() { return this._value; }
  set value(v) { this._value = String(v); }
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
  setAttribute(name, value) {
    this._attrs.set(name, String(value));
    if (name === 'value') this._value = String(value);
  }
  getAttribute(name) { return this._attrs.has(name) ? this._attrs.get(name) : null; }
  hasAttribute(name) { return this._attrs.has(name); }
  removeAttribute(name) { this._attrs.delete(name); }
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
    if (idx !== -1) {
      if (newNode.parentNode) newNode.parentNode.removeChild(newNode);
      newNode.parentNode = this;
      oldNode.parentNode = null;
      this.childNodes[idx] = newNode;
    }
    return oldNode;
  }
  replaceChildren(...nodes) {
    for (const c of this.childNodes) c.parentNode = null;
    this.childNodes = [];
    this._innerHTML = null;
    for (const n of nodes) this.appendChild(n);
  }
  get firstChild() { return this.childNodes[0] || null; }
  get lastChild() { return this.childNodes[this.childNodes.length - 1] || null; }
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
    const e = { target: this, currentTarget: this, preventDefault() {}, stopPropagation() {}, ...eventObj };
    for (const fn of fns) fn(e);
  }
  focus() { globalThis.document.activeElement = this; }
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
    return this.querySelectorAll((el) => el.id === id)[0] || null;
  }
  toHtml() {
    const tag = this.tagName.toLowerCase();
    const attrStr = Array.from(this._attrs.entries()).map(([k, v]) => `${k}="${v}"`).join(' ');
    const inner = this._innerHTML !== null ? this._innerHTML : this.childNodes.map((c) => c.toHtml()).join('');
    return `<${tag}${attrStr ? ' ' + attrStr : ''}>${inner}</${tag}>`;
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

const headElement = new MockElement('head');
headElement.querySelector = (selector) => {
  if (typeof selector === 'string' && selector.startsWith('meta[')) {
    const m = selector.match(/meta\[([a-zA-Z0-9_-]+)="([^"]+)"\]/);
    if (m) return headElement.childNodes.find((c) => c.tagName === 'META' && c.getAttribute(m[1]) === m[2]) || null;
  }
  if (typeof selector === 'string' && selector.startsWith('link[')) {
    const m = selector.match(/link\[rel="([^"]+)"\](?:\[hreflang="([^"]+)"\])?/);
    if (m) {
      return headElement.childNodes.find(
        (c) => c.tagName === 'LINK' && c.getAttribute('rel') === m[1] && (!m[2] || c.getAttribute('hreflang') === m[2])
      ) || null;
    }
  }
  return null;
};

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
};

const windowListeners = new Map();
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
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
};

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
      for (const candidate of [base, `${base}.jsx`, `${base}.js`, `${base}.json`]) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return { shortCircuit: true, url: pathToFileURL(candidate).href };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'virtual-vendor://react') return { shortCircuit: true, format: 'module', source: VENDOR_REACT_JS };
    if (url === 'virtual-vendor://react-dom/client') return { shortCircuit: true, format: 'module', source: VENDOR_REACT_DOM_CLIENT_JS };
    if (url === 'virtual-vendor://react-router-dom') return { shortCircuit: true, format: 'module', source: VENDOR_ROUTER_JS };
    if (url === 'virtual-vendor://lucide-react') return { shortCircuit: true, format: 'module', source: VENDOR_LUCIDE_JS };
    if (url.startsWith('virtual-css://')) return { shortCircuit: true, format: 'module', source: 'export default {};' };
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let rootInstance = null;
let mountSeq = 0;
async function mountRoute(pathname, search = '') {
  if (rootInstance) {
    rootInstance.render(null);
  }
  headElement.childNodes = [];
  rootContainer.childNodes = [];
  globalThis.document.title = '';
  globalThis.window.location.pathname = pathname;
  globalThis.window.location.search = search;
  globalThis.window.location.hash = '';
  globalThis.window.location.href = `http://localhost:5173${pathname}${search}`;
  rootInstance = createRoot(rootContainer);
  rootInstance.render(
    React.createElement(BrowserRouter, { key: `mount-${++mountSeq}` }, React.createElement(App))
  );
  await sleep(110);
}

test('DOM-AUDIT-1: Homepage (/) has strictly 1 <h1>, 1 FAQPage JSON-LD, 1 SoftwareApplication JSON-LD, 0 hidden DOM clones, and never falls back to P2002 title', async () => {
  await mountRoute('/');
  assert.ok(
    globalThis.document.title.includes('Independent Car Ownership Cost'),
    `Homepage title unexpected: ${globalThis.document.title}`
  );
  assert.ok(!globalThis.document.title.includes('P2002'), 'Homepage title must never leak P2002');

  const h1s = rootContainer.querySelectorAll((el) => el.tagName === 'H1');
  assert.equal(h1s.length, 1, `Homepage must render strictly 1 <h1>, found ${h1s.length}`);

  // Zero hidden production DOM clones on /
  assert.equal(rootContainer.getElementById('slider-purchase-price'), null, 'Homepage must NOT render hidden TcoCalculator DOM clone');
  assert.equal(rootContainer.getElementById('input-odometer'), null, 'Homepage must NOT render hidden TcoCalculator odometer input');
  assert.equal(rootContainer.getElementById('methodology-guide'), null, 'Homepage must NOT render hidden TechnicalMethodologyGuide DOM clone');

  const ldScripts = rootContainer.querySelectorAll(
    (el) => el.tagName === 'SCRIPT' && el.getAttribute('type') === 'application/ld+json'
  );
  const faqSchemas = ldScripts.filter((s) => s.innerHTML.includes('"@type":"FAQPage"'));
  assert.equal(faqSchemas.length, 1, `Homepage must emit strictly 1 FAQPage JSON-LD, found ${faqSchemas.length}`);
  const appSchemas = ldScripts.filter((s) => s.innerHTML.includes('"@type":"SoftwareApplication"'));
  assert.equal(appSchemas.length, 1, `Homepage must emit strictly 1 SoftwareApplication JSON-LD, found ${appSchemas.length}`);

  // Desktop primary navigation uses crawlable <a href> links
  const tabTco = rootContainer.getElementById('tab-tco');
  assert.equal(tabTco?.tagName, 'A', 'Desktop primary tab #tab-tco must be an <a href> link');
  assert.equal(tabTco?.getAttribute('href'), '/tco');
});

test('DOM-AUDIT-2: Unselected /tco, /risk-matrix, /checklist retain generic titles without leaking sample vehicle', async () => {
  await mountRoute('/tco');
  assert.ok(globalThis.document.title.includes('5-Year True Cost to Own (TCO) Calculator'), `Got: ${globalThis.document.title}`);
  assert.ok(!globalThis.document.title.includes('Camry'), 'Unselected /tco must not leak Camry');
  assert.ok(!globalThis.document.title.includes('Golf'), 'Unselected /tco must not leak Golf');

  await mountRoute('/risk-matrix');
  assert.ok(globalThis.document.title.includes('Powertrain Maintenance Risk Matrix'), `Got: ${globalThis.document.title}`);
  assert.ok(!globalThis.document.title.includes('Camry'), 'Unselected /risk-matrix must not leak Camry');

  await mountRoute('/checklist');
  assert.ok(globalThis.document.title.includes('Pre-Purchase Inspection (PPI) Checklist'), `Got: ${globalThis.document.title}`);
  assert.ok(!globalThis.document.title.includes('Camry'), 'Unselected /checklist must not leak Camry');
});

test('DOM-AUDIT-3: /methodology, /reviews, and /vehicles emit dedicated titles & lazy-load /vehicles directory', async () => {
  await mountRoute('/methodology');
  assert.ok(globalThis.document.title.includes('Methodology'), `Got: ${globalThis.document.title}`);

  await mountRoute('/reviews');
  assert.ok(globalThis.document.title.includes('Reviews'), `Got: ${globalThis.document.title}`);

  await mountRoute('/vehicles');
  await sleep(120);
  assert.ok(globalThis.document.title.includes('35 Brands'), `Got: ${globalThis.document.title}`);
  const html = rootContainer.toHtml();
  assert.ok(html.includes('vehicles-catalog-page'), '/vehicles must mount VehiclesCatalogPage');
  assert.ok(html.includes('href="/tco/vw-golf-20-tdi"'), '/vehicles must link directly to model TCO pages');
  assert.ok(html.includes('href="/checklist/tesla-model-3-lr"'), '/vehicles must link directly to model PPI pages');
});

test('DOM-AUDIT-4: Unknown URL renders 404 view with noindex, nofollow (zero Soft 404)', async () => {
  await mountRoute('/nonexistent-telemetry-xyz-999');
  const notFound = rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'not-found-view');
  assert.equal(notFound.length, 1, 'Unknown route must render data-testid="not-found-view"');

  const robotsMeta = headElement.querySelector('meta[name="robots"]');
  assert.equal(robotsMeta?.getAttribute('content'), 'noindex, nofollow', '404 must set noindex, nofollow');
});

test('DOM-AUDIT-5: Legal page (/privacy) suppresses Vehicle, HowTo, and FAQPage schemas', async () => {
  await mountRoute('/privacy');
  assert.equal(rootContainer.getElementById('schema-vehicle-telemetry'), null, '/privacy must not emit Vehicle schema');
  assert.equal(rootContainer.getElementById('schema-obd-howto'), null, '/privacy must not emit OBD HowTo schema');
  assert.equal(rootContainer.getElementById('schema-dynamic-faq'), null, '/privacy must not emit FAQPage schema');
});

test('DOM-AUDIT-6: Vehicle page (/tco/vw-golf-20-tdi) renders VehicleInternalLinks with lowercase OBD & bracket links', async () => {
  await mountRoute('/tco/vw-golf-20-tdi');
  const nav = rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'vehicle-internal-links')[0];
  assert.ok(nav, '/tco/vw-golf-20-tdi must render VehicleInternalLinks');
  const html = nav.toHtml();
  assert.ok(html.includes('href="/risk-matrix/vw-golf-20-tdi/60k-miles"'), 'Must link to 60k-miles bracket');
  assert.ok(html.includes('href="/risk-matrix/vw-golf-20-tdi/100k-miles"'), 'Must link to 100k-miles bracket');
  assert.ok(html.includes('href="/risk-matrix/vw-golf-20-tdi/150k-miles"'), 'Must link to 150k-miles bracket');
  assert.ok(html.includes('href="/compare/'), 'Must link to canonical rival comparison');
  assert.ok(/href="\/obd\/vw-golf-20-tdi\/[a-z0-9]+"/.test(html), 'OBD links must use lowercase canonical paths');
});

test('DOM-AUDIT-7: Single guide page emits strictly 1 FAQPage schema using the guide own FAQs', async () => {
  await mountRoute('/guides/used-bmw-3-series-buying-checklist');
  await sleep(120);
  const faqEl = rootContainer.getElementById('schema-dynamic-faq');
  assert.ok(faqEl, 'Guide page must emit schema-dynamic-faq');
  const parsed = JSON.parse(faqEl.innerHTML);
  assert.equal(parsed['@type'], 'FAQPage');
  assert.ok(
    parsed.mainEntity.some((q) => q.name.includes('B47 diesel')),
    'Guide FAQPage must reflect the active guide FAQs, not generic fallback FAQs'
  );
});

test('DOM-AUDIT-8: Shared ?odo= & ?reg= params hydrate TcoCalculator without resetting on mount', async () => {
  await mountRoute('/tco/vw-golf-20-tdi', '?odo=95000&reg=EU');
  const odoInput = rootContainer.getElementById('input-odometer');
  assert.ok(odoInput, '#input-odometer must exist on /tco/vw-golf-20-tdi');
  assert.equal(
    String(odoInput.value),
    '95000',
    `Shared ?odo=95000 must NOT be wiped back to preset default (got ${odoInput.value})`
  );
  assert.ok(
    rootContainer.toHtml().includes('€'),
    'Shared ?reg=EU must switch workspace currency to EUR (€)'
  );
});

test('DOM-AUDIT-9: 404 route suppresses hidden calculator/methodology schemas and /checklist + /compare have visible <h1>', async () => {
  await mountRoute('/definitely-not-a-route-xyz');
  assert.equal(rootContainer.getElementById('input-odometer'), null, '404 must not mount hidden TcoCalculator');
  assert.equal(rootContainer.getElementById('methodology-guide'), null, '404 must not mount hidden TechnicalMethodologyGuide');
  const ldOn404 = rootContainer.querySelectorAll((el) => el.tagName === 'SCRIPT' && el.getAttribute('type') === 'application/ld+json');
  assert.ok(
    ldOn404.every((s) => !s.innerHTML.includes('SoftwareApplication')),
    '404 must not emit SoftwareApplication JSON-LD'
  );

  await mountRoute('/checklist/tesla-model-3-lr');
  await sleep(120);
  const checklistH1s = rootContainer.querySelectorAll((el) => el.tagName === 'H1');
  assert.equal(checklistH1s.length, 1, '/checklist/:id must have strictly 1 <h1>');
  assert.ok(checklistH1s[0].textContent.includes('Tesla Model 3'), 'Checklist <h1> must show active vehicle title');

  await mountRoute('/compare/bmw-330i-g20-vs-tesla-model-3-lr');
  await sleep(120);
  const compareH1s = rootContainer.querySelectorAll((el) => el.tagName === 'H1');
  assert.equal(compareH1s.length, 1, '/compare/:a-vs-:b must have strictly 1 <h1>');
  assert.ok(compareH1s[0].textContent.includes('BMW'), 'Compare <h1> must show compared vehicle names');
});

test('DOM-AUDIT-10: Dedicated Brand Hub (/vehicles/toyota) renders brand-specific H1, CollectionPage JSON-LD & unknown brand renders 404', async () => {
  await mountRoute('/vehicles/toyota');
  await sleep(120);
  assert.ok(globalThis.document.title.includes('Toyota Maintenance Cost'), `Unexpected title: ${globalThis.document.title}`);
  const brandHub = rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'brand-hub-page');
  assert.equal(brandHub.length, 1, '/vehicles/toyota must render brand-hub-page');
  const h1s = rootContainer.querySelectorAll((el) => el.tagName === 'H1');
  assert.equal(h1s.length, 1, '/vehicles/toyota must render strictly 1 <h1>');
  assert.ok(h1s[0].textContent.includes('Toyota'), 'Brand hub <h1> must mention Toyota');
  const html = rootContainer.toHtml();
  assert.ok(html.includes('href="/tco/toyota-camry-hybrid"'), '/vehicles/toyota must link to Toyota Camry Hybrid TCO');
  assert.ok(html.includes('href="/vehicles/bmw"'), '/vehicles/toyota must cross-link to sibling brand hubs');
  const dirSchema = rootContainer.getElementById('schema-vehicles-directory');
  assert.ok(dirSchema, '/vehicles/toyota must emit schema-vehicles-directory CollectionPage JSON-LD');
  const parsed = JSON.parse(dirSchema.innerHTML);
  assert.equal(parsed['@type'], 'CollectionPage');
  assert.equal(parsed.about?.name, 'Toyota');
  assert.equal(parsed.url, 'https://mydriveledger.com/vehicles/toyota');

  // Unknown brand slug must render 404 with noindex, nofollow
  await mountRoute('/vehicles/unknown-marque-xyz');
  const notFound = rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'not-found-view');
  assert.equal(notFound.length, 1, '/vehicles/unknown-marque-xyz must render 404 view');
  const robotsMeta = headElement.querySelector('meta[name="robots"]');
  assert.equal(robotsMeta?.getAttribute('content'), 'noindex, nofollow');
});

test('DOM-AUDIT-11: /tco/vw-id4-pro-77kwh switches cleanly between Loan and real Lease mode with computed residual & money factor', async () => {
  await mountRoute('/tco/vw-id4-pro-77kwh');
  await sleep(120);
  const leaseBtn = rootContainer.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.textContent.trim().toLowerCase() === 'lease'
  )[0];
  assert.ok(leaseBtn, 'Must find Lease financing button in TcoCalculator');
  leaseBtn.dispatchEvent({ type: 'click' });
  await sleep(40);

  const html = rootContainer.toHtml();
  assert.ok(html.includes('Residual &amp; Money-Factor Lease Model') || html.includes('Residual & Money-Factor Lease Model'), 'Lease mode must render computed Residual & Money-Factor Lease Model summary');
  assert.ok(html.includes('Residual (36m)'), 'Switching to Lease mode must default to a realistic 36-month lease term');
  assert.ok(!html.includes('integrated in a future update'), 'Placeholder future-update lease disclaimer must be gone');
  assert.ok(html.includes('lease-monthly-payment-badge'), 'Lease mode must render monthly lease payment badge');
  assert.ok(html.includes('lease-terms-summary'), 'Lease mode must render computed lease terms summary');
  assert.ok(!html.includes('$12,979'), 'VW ID.4 electricity cost must NEVER be inflated to $12,979');

  // Verify ForumShareModal & VehicleDossierExport propagate real EV components & Lease terms for electric-tagged VW ID.4
  const shareBtn = rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'open-forum-share-btn')[0];
  assert.ok(shareBtn, 'Must find Share for Reddit / Forums button');
  shareBtn.dispatchEvent({ type: 'click' });
  await sleep(40);
  const shareHtml = rootContainer.toHtml();
  assert.ok(shareHtml.includes('forum-share-modal'), 'ForumShareModal must open');
  assert.ok(!shareHtml.includes('($0)'), 'VW ID.4 ForumShareModal must compute real EV repair reserve, NOT $0');
  assert.ok(shareHtml.includes('Lease (36m):'), 'ForumShareModal must propagate active Lease terms');

  // Open Buyer Inspection / Dossier modal and verify negotiation rows & lease banner
  const dossierBtn = rootContainer.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.textContent.includes('Export Dossier / Print')
  )[0];
  assert.ok(dossierBtn, 'Must find Export Dossier / Print button');
  dossierBtn.dispatchEvent({ type: 'click' });
  await sleep(40);
  const dossierEl = rootContainer.getElementById('printable-dossier');
  assert.ok(dossierEl, 'VehicleDossierExport printable body must render');
  const negotiationRows = dossierEl.querySelectorAll((el) => el.tagName === 'TR').filter((tr) => tr.querySelectorAll((c) => c.tagName === 'TD').length > 0);
  assert.ok(negotiationRows.length >= 2, `VW ID.4 dossier must evaluate real EV components (>=2 rows), got ${negotiationRows.length}`);
  assert.ok(dossierEl.toHtml().includes('dossier-lease-terms'), 'VehicleDossierExport must render active Lease terms summary');
});

test('DOM-AUDIT-12: Malformed percent-encoded & junk-punctuation URLs render 404 cleanly without crashing', async () => {
  for (const badRoute of ['/vehicles/%E0%A4%A', '/tco/%E0%A4%A', '/obd/%E0%A4%A/p0420', '/vehicles/!!!toyota!!!', '/vehicles/mercedes---benz']) {
    await mountRoute(badRoute);
    const notFound = rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'not-found-view');
    assert.equal(notFound.length, 1, `${badRoute} must safely render 404 view without throwing`);
    const robotsMeta = headElement.querySelector('meta[name="robots"]');
    assert.equal(robotsMeta?.getAttribute('content'), 'noindex, nofollow', `${badRoute} must set noindex, nofollow`);
  }
});

test('DOM-AUDIT-13: Zero default vehicle pre-selection across /, /tco, /risk-matrix, /obd-estimator, /compare, /checklist in US, UK & EU', async () => {
  // 1. Fresh Homepage (/)
  storageMap.clear();
  await mountRoute('/');
  assert.equal(rootContainer.getElementById('preset-select-dropdown')?.value, '', 'Homepage hidden preset select must default to empty string');
  const homePpi = rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'homepage-ppi-preview')[0];
  assert.ok(homePpi, 'Homepage must render PPI preview section');
  assert.ok(homePpi.textContent.includes('Universal Pre-Purchase Inspection Points'), 'Homepage PPI preview must be universal when no vehicle is selected');
  assert.ok(!homePpi.textContent.includes('Toyota Camry'), 'Homepage PPI preview must NOT default to Toyota Camry');
  const footerVin = rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'vin-check-banner')[0];
  assert.ok(footerVin, 'Footer must render VinCheckBanner');
  assert.ok(!footerVin.textContent.includes('Toyota Camry'), 'Footer VinCheckBanner must NOT mention Toyota Camry when unselected');
  assert.ok(!footerVin.textContent.includes('$31,500') && !footerVin.textContent.includes('$24,800'), 'Footer VinCheckBanner must NOT leak sample price');
  const saveActiveBtns = rootContainer.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && (el.textContent.includes('+ Save Active') || el.textContent.includes('+ Save Car'))
  );
  assert.equal(saveActiveBtns.length, 0, 'Navbar must NOT show "+ Save Active" or "+ Save Car" when no vehicle is selected');

  // Open mobile drawer on / and verify no default active car
  const mobileMenuBtn = rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'navbar-mobile-menu-toggle')[0];
  assert.ok(mobileMenuBtn, 'Must find mobile menu button');
  mobileMenuBtn.dispatchEvent({ type: 'click' });
  await sleep(40);
  const mobileDrawer = rootContainer.getElementById('mobile-nav-drawer');
  assert.ok(mobileDrawer?.textContent.includes('No vehicle selected'), 'Mobile drawer must show "No vehicle selected" when unselected');
  assert.ok(!mobileDrawer?.textContent.includes('Toyota Camry'), 'Mobile drawer must NOT default to Toyota Camry');

  // 2. Fresh /tco + region switch to UK & EU (must NOT auto-select Toyota Camry or VW Golf)
  await mountRoute('/tco');
  await sleep(120);
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'tco-empty-vehicle-picker').length, 1, '/tco must render empty vehicle picker');
  assert.equal(rootContainer.getElementById('preset-select-dropdown')?.value, '', '/tco hidden select must default to empty string');
  assert.equal(rootContainer.getElementById('select-make')?.value, '', '/tco Make dropdown must default to empty placeholder');
  assert.ok(rootContainer.getElementById('select-model')?.hasAttribute('disabled'), '/tco Model dropdown must be disabled until Make is chosen');
  assert.ok(rootContainer.getElementById('select-engine')?.hasAttribute('disabled'), '/tco Engine dropdown must be disabled until Make is chosen');
  const tcoApplyBtn = rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'tco-apply-vehicle-button')[0];
  assert.ok(tcoApplyBtn?.hasAttribute('disabled'), '/tco Calculate This Vehicle CTA must be disabled before selecting a vehicle');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'market-deal-verdict-badge').length, 0, '/tco must hide market deal badge when unselected');
  assert.equal(rootContainer.getElementById('input-purchase-price')?.value, '30,000', '/tco must start with neutral $30,000 baseline, not Camry $31,500');

  for (const regionLabel of ['UK (£', 'EU (€', 'US ($']) {
    const regBtn = rootContainer.querySelectorAll((el) => el.tagName === 'BUTTON' && el.textContent.includes(regionLabel))[0];
    assert.ok(regBtn, `Must find region switcher button for ${regionLabel}`);
    regBtn.dispatchEvent({ type: 'click' });
    await sleep(40);
    assert.equal(rootContainer.getElementById('preset-select-dropdown')?.value, '', `Switching region to ${regionLabel} while unselected must keep no vehicle selected`);
  }

  // 3. Fresh /risk-matrix (Maintenance tab)
  await mountRoute('/risk-matrix');
  await sleep(80);
  assert.equal(rootContainer.getElementById('risk-preset-sync')?.value, '', '/risk-matrix must default to empty vehicle selection');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'risk-empty-vehicle-picker').length, 1, '/risk-matrix must render empty vehicle picker');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'risk-empty-gauge').length, 1, '/risk-matrix must render neutral --/100 gauge');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'risk-empty-dossier-state').length, 1, '/risk-matrix must render empty dossier state');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'vehicle-internal-links').length, 0, '/risk-matrix must hide vehicle internal links when unselected');
  assert.ok(!rootContainer.toHtml().includes('28,000 mi'), '/risk-matrix must not leak Camry 28,000 mi default');

  // 4. Fresh /obd-estimator (OBD-II Lookup tab)
  await mountRoute('/obd-estimator');
  await sleep(80);
  const obdSelect = rootContainer.getElementById('obd-preset-select');
  assert.ok(obdSelect, '/obd-estimator must render #obd-preset-select');
  assert.equal(obdSelect.value, '', '/obd-estimator TARGET VEHICLE dropdown must default to empty (generic)');
  const obdHtml = rootContainer.toHtml();
  assert.ok(obdHtml.includes('GENERIC SAE J1979 PROFILE'), '/obd-estimator must show GENERIC SAE J1979 PROFILE when no vehicle is selected');
  assert.ok(obdHtml.includes('obd-no-vehicle-prompt'), '/obd-estimator must render obd-no-vehicle-prompt');
  assert.ok(obdHtml.includes('P0420 WORKSHOP COST SUMMARY'), '/obd-estimator must default to universal P0420, not Camry P0A80');
  assert.ok(!obdHtml.includes('P0A80 WORKSHOP COST SUMMARY'), '/obd-estimator must NOT auto-select Camry P0A80');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'vehicle-internal-links').length, 0, '/obd-estimator must hide vehicle internal links when unselected');

  // Clicking an OBD code without selecting a vehicle must NOT leak any fallback vehicle into SEO title or URL
  const p0299Chip = rootContainer.querySelectorAll((el) => el.tagName === 'BUTTON' && el.textContent.includes('P0299'))[0];
  assert.ok(p0299Chip, 'Must find P0299 quick code button');
  p0299Chip.dispatchEvent({ type: 'click' });
  await sleep(40);
  assert.ok(!globalThis.window.location.search.includes('preset='), 'Selecting an OBD code without a vehicle must NOT inject preset= into URL');
  assert.ok(!globalThis.document.title.includes('Camry') && !globalThis.document.title.includes('Focus') && !globalThis.document.title.includes('Golf'), `Generic OBD title must not leak any vehicle: ${globalThis.document.title}`);

  // 5. Fresh /compare (Compare tab)
  await mountRoute('/compare');
  await sleep(120);
  const selectA = rootContainer.querySelectorAll((el) => el.tagName === 'SELECT' && el.getAttribute('aria-label') === 'Select primary vehicle')[0];
  const selectB = rootContainer.querySelectorAll((el) => el.tagName === 'SELECT' && el.getAttribute('aria-label') === 'Select comparison vehicle')[0];
  assert.equal(selectA?.value, '', '/compare Vehicle A dropdown must default to empty');
  assert.equal(selectB?.value, '', '/compare Vehicle B dropdown must default to empty');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'comparator-empty-card-a').length, 1, '/compare must render empty Vehicle A card');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'comparator-empty-card-b').length, 1, '/compare must render empty Vehicle B card');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'comparator-empty-state').length, 1, '/compare must render comparator empty state');
  assert.ok(globalThis.document.title.includes('Head-to-Head Vehicle Cost & Reliability Comparator'), `Unselected /compare title unexpected: ${globalThis.document.title}`);
  assert.ok(!globalThis.document.title.includes('Camry') && !globalThis.document.title.includes('Focus'), '/compare title must not leak default vehicles');

  // 6. Fresh /checklist (PPI Checklist tab)
  await mountRoute('/checklist');
  await sleep(120);
  assert.equal(rootContainer.getElementById('ppi-vehicle-select')?.value, '', '/checklist vehicle dropdown must default to empty');
  const ppiH1 = rootContainer.querySelectorAll((el) => el.tagName === 'H1')[0];
  assert.ok(ppiH1?.textContent.includes('Pre-Purchase Inspection (PPI) | Field Inspection Checklist'), `Unexpected unselected /checklist H1: ${ppiH1?.textContent}`);
  assert.ok(!ppiH1?.textContent.includes('Camry'), '/checklist H1 must NOT mention Toyota Camry');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'ppi-empty-vehicle-picker').length, 1, '/checklist must render empty vehicle picker');
  assert.equal(rootContainer.getElementById('ppi-asking-price'), null, '/checklist must hide asking price input when unselected');
  assert.equal(rootContainer.getElementById('ppi-odometer-input'), null, '/checklist must hide odometer input when unselected');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'negotiation-battlecard-summary').length, 0, '/checklist must hide negotiation battlecard when unselected');
});

test('DOM-AUDIT-14: Interactive vehicle selection, clearing & stale-closure-free routing across all tabs', async () => {
  // 1. /tco Make selection -> enable button -> calculate vehicle
  await mountRoute('/tco');
  await sleep(120);
  const makeSelect = rootContainer.getElementById('select-make');
  makeSelect.value = 'Toyota';
  makeSelect.dispatchEvent({ type: 'change' });
  await sleep(40);
  const applyBtn = rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'tco-apply-vehicle-button')[0];
  assert.ok(applyBtn && !applyBtn.hasAttribute('disabled'), 'Selecting a make in /tco VehicleSelect must enable Calculate This Vehicle button');
  applyBtn.dispatchEvent({ type: 'click' });
  await sleep(60);
  assert.ok(globalThis.window.location.pathname.startsWith('/tco/'), `Clicking Calculate This Vehicle must navigate to /tco/:id (got ${globalThis.window.location.pathname})`);
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'tco-empty-vehicle-picker').length, 0, 'Empty picker must disappear after selecting vehicle');

  // 2. /risk-matrix quick-pick selection
  await mountRoute('/risk-matrix');
  await sleep(80);
  const golfChip = rootContainer.querySelectorAll((el) => el.tagName === 'BUTTON' && el.textContent.trim() === 'VW Golf TDI')[0];
  assert.ok(golfChip, 'Must find VW Golf TDI quick-pick chip on /risk-matrix');
  golfChip.dispatchEvent({ type: 'click' });
  await sleep(60);
  assert.equal(globalThis.window.location.pathname, '/risk-matrix/vw-golf-20-tdi', 'Quick-pick chip on /risk-matrix must update URL to /risk-matrix/vw-golf-20-tdi');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'risk-empty-dossier-state').length, 0, 'Empty dossier must clear after selecting vehicle');
  assert.ok(rootContainer.toHtml().includes('Volkswagen Golf'), 'Risk matrix must display selected Volkswagen Golf telemetry');

  // 3. /obd-estimator selecting EV while on P0420 must auto-switch code AND keep preset= in URL, then clearing returns to generic
  await mountRoute('/obd-estimator');
  await sleep(80);
  const obdSelect = rootContainer.getElementById('obd-preset-select');
  obdSelect.value = 'tesla-model-3-lr';
  obdSelect.dispatchEvent({ type: 'change' });
  await sleep(60);
  assert.ok(
    globalThis.window.location.search.includes('preset=tesla-model-3-lr') || globalThis.window.location.pathname.includes('/obd/tesla-model-3-lr/'),
    `Selecting Tesla EV on /obd-estimator must preserve preset in URL (got ${globalThis.window.location.pathname}${globalThis.window.location.search})`
  );
  assert.ok(!rootContainer.toHtml().includes('P0420 WORKSHOP COST SUMMARY'), 'Selecting pure EV must replace incompatible P0420 catalytic code');
  assert.ok(rootContainer.toHtml().includes('Tesla Model 3'), 'OBD banner must reflect selected Tesla Model 3');

  // Clear back to generic
  const obdSelectAfter = rootContainer.getElementById('obd-preset-select');
  obdSelectAfter.value = '';
  obdSelectAfter.dispatchEvent({ type: 'change' });
  await sleep(60);
  const obdHtmlAfterClear = rootContainer.toHtml();
  assert.ok(obdHtmlAfterClear.includes('GENERIC SAE J1979 PROFILE'), 'Clearing OBD vehicle must return to GENERIC SAE J1979 PROFILE');
  assert.ok(obdHtmlAfterClear.includes('P0420 WORKSHOP COST SUMMARY'), 'Clearing auto-switched EV vehicle on /obd-estimator must return to universal P0420');
  assert.equal(globalThis.window.location.pathname, '/obd-estimator', 'Clearing OBD vehicle with no explicit code must return to clean /obd-estimator');
  assert.equal(globalThis.window.location.search, '', 'Clearing OBD vehicle with no explicit code must not leave ?code=U0100 behind');

  // 4. /compare Popular matchup atomic URL update + Set Vehicle B as Primary swap + clearing Vehicle A
  await mountRoute('/compare');
  await sleep(120);
  const petrolEvBtn = rootContainer.querySelectorAll((el) => el.tagName === 'BUTTON' && el.textContent.includes('Petrol vs Pure EV'))[0];
  assert.ok(petrolEvBtn, 'Must find Petrol vs Pure EV button on /compare');
  petrolEvBtn.dispatchEvent({ type: 'click' });
  await sleep(60);
  assert.equal(
    globalThis.window.location.pathname,
    '/compare/bmw-330i-g20-vs-tesla-model-3-lr',
    `Popular matchup on unselected /compare must atomically navigate to /compare/bmw-330i-g20-vs-tesla-model-3-lr (got ${globalThis.window.location.pathname})`
  );
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'comparator-empty-state').length, 0, 'Empty state must clear when both vehicles are set');

  const promoteBtn = rootContainer.querySelectorAll((el) => el.tagName === 'BUTTON' && el.textContent.includes('Set Vehicle B as Primary'))[0];
  assert.ok(promoteBtn, 'Must find Set Vehicle B as Primary button');
  promoteBtn.dispatchEvent({ type: 'click' });
  await sleep(60);
  assert.equal(
    globalThis.window.location.pathname,
    '/compare/tesla-model-3-lr-vs-bmw-330i-g20',
    `Promoting Vehicle B must atomically update URL to /compare/tesla-model-3-lr-vs-bmw-330i-g20 (got ${globalThis.window.location.pathname})`
  );

  // Clear Vehicle A back to empty
  const selectAAfter = rootContainer.querySelectorAll((el) => el.tagName === 'SELECT' && el.getAttribute('aria-label') === 'Select primary vehicle')[0];
  selectAAfter.value = '';
  selectAAfter.dispatchEvent({ type: 'change' });
  await sleep(60);
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'comparator-empty-card-a').length, 1, 'Clearing Vehicle A must render empty Vehicle A card');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'comparator-empty-state').length, 1, 'Clearing Vehicle A must restore comparator empty state');

  // 5. /checklist selection via #ppi-vehicle-select and clearing back to empty
  await mountRoute('/checklist');
  await sleep(120);
  const ppiSelect = rootContainer.getElementById('ppi-vehicle-select');
  ppiSelect.value = 'tesla-model-3-lr';
  ppiSelect.dispatchEvent({ type: 'change' });
  await sleep(60);
  assert.equal(globalThis.window.location.pathname, '/checklist/tesla-model-3-lr', 'Selecting vehicle on /checklist must update URL to /checklist/tesla-model-3-lr');
  assert.ok(rootContainer.getElementById('ppi-asking-price'), 'Selecting vehicle on /checklist must reveal asking price input');
  assert.ok(rootContainer.toHtml().includes('HV Battery State of Health'), 'Selecting Tesla Model 3 on /checklist must render EV battery inspection step');

  const ppiSelectClear = rootContainer.getElementById('ppi-vehicle-select');
  ppiSelectClear.value = '';
  ppiSelectClear.dispatchEvent({ type: 'change' });
  await sleep(60);
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'ppi-empty-vehicle-picker').length, 1, 'Clearing /checklist dropdown must restore empty picker');
});

test('DOM-AUDIT-15: Deep links hydrate explicitly, invalid ?preset= stays unselected, and popstate clears back to unselected', async () => {
  // Invalid ?preset= query param must safely remain unselected (never fall back to Camry or index 0)
  await mountRoute('/risk-matrix', '?preset=nonexistent-car-xyz');
  await sleep(80);
  assert.equal(rootContainer.getElementById('risk-preset-sync')?.value, '', 'Invalid ?preset= on /risk-matrix must remain unselected');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'risk-empty-vehicle-picker').length, 1, 'Invalid ?preset= must render empty picker');

  // Deep link to /risk-matrix/toyota-camry-hybrid hydrates Camry explicitly
  await mountRoute('/risk-matrix/toyota-camry-hybrid');
  await sleep(80);
  assert.equal(rootContainer.getElementById('risk-preset-sync')?.value, 'toyota-camry-hybrid', 'Explicit deep link /risk-matrix/toyota-camry-hybrid must hydrate Camry');

  // Browser Back (popstate) to bare /risk-matrix clears selection cleanly
  globalThis.window.history.pushState({}, '', '/risk-matrix');
  globalThis.window.dispatchEvent({ type: 'popstate' });
  await sleep(60);
  assert.equal(rootContainer.getElementById('risk-preset-sync')?.value, '', 'popstate back to bare /risk-matrix must clear selected vehicle');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'risk-empty-vehicle-picker').length, 1, 'popstate back to bare /risk-matrix must restore empty picker');

  // Deep link to /compare/bmw-330i-g20-vs-tesla-model-3-lr then popstate back to bare /compare
  await mountRoute('/compare/bmw-330i-g20-vs-tesla-model-3-lr');
  await sleep(120);
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'comparator-empty-state').length, 0, 'Explicit /compare matchup must hydrate both vehicles');
  globalThis.window.history.pushState({}, '', '/compare');
  globalThis.window.dispatchEvent({ type: 'popstate' });
  await sleep(60);
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'comparator-empty-state').length, 1, 'popstate back to bare /compare must clear both vehicles');
});

test('DOM-AUDIT-16: Unselected export/modal guards, zero fabricated CTA figures, clean non-OBD URLs, CommunityInvoiceModal & Garage Pair loading', async () => {
  // 1. Unselected /tco: sr-only export buttons must be disabled & never open broken ForumShareModal, and AffiliateCTA must not fabricate $6,800
  storageMap.clear();
  await mountRoute('/tco');
  await sleep(120);
  const tcoForumBtn = rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'open-forum-share-btn')[0];
  assert.ok(tcoForumBtn, '/tco must keep open-forum-share-btn mounted');
  assert.ok(tcoForumBtn.hasAttribute('disabled'), 'open-forum-share-btn must be disabled on unselected /tco');
  tcoForumBtn.dispatchEvent({ type: 'click' });
  await sleep(40);
  assert.equal(
    rootContainer.querySelectorAll((el) => el.getAttribute('role') === 'dialog').length,
    0,
    'Clicking disabled sr-only open-forum-share-btn on unselected /tco must NOT open ForumShareModal'
  );
  const tcoInsCta = rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'affiliate-cta-insurance-finance')[0];
  assert.ok(tcoInsCta, '/tco must render insurance-finance AffiliateCTA');
  assert.ok(!tcoInsCta.textContent.includes('$6,800'), 'Unselected /tco AffiliateCTA must NOT fabricate $6,800 outlay');

  // 2. Unselected /risk-matrix: sr-only export buttons must be disabled & clicking them must NOT queue latent modal popup when a car is later chosen
  await mountRoute('/risk-matrix');
  await sleep(80);
  const riskForumBtn = rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'open-forum-share-btn')[0];
  assert.ok(riskForumBtn?.hasAttribute('disabled'), 'open-forum-share-btn must be disabled on unselected /risk-matrix');
  riskForumBtn.dispatchEvent({ type: 'click' });
  await sleep(30);
  const golfChip = rootContainer.querySelectorAll((el) => el.tagName === 'BUTTON' && el.textContent.trim() === 'VW Golf TDI')[0];
  golfChip.dispatchEvent({ type: 'click' });
  await sleep(60);
  assert.equal(
    rootContainer.querySelectorAll((el) => el.getAttribute('role') === 'dialog').length,
    0,
    'Previously clicking disabled export button on unselected /risk-matrix must NOT pop up modal once a car is selected'
  );

  // 3. Selecting an OBD code without selecting a vehicle, then switching to non-OBD tabs must NOT pollute URLs with ?code=
  await mountRoute('/obd-estimator');
  await sleep(80);
  const p2002Chip = rootContainer.querySelectorAll((el) => el.tagName === 'BUTTON' && el.textContent.includes('P2002'))[0];
  assert.ok(p2002Chip, 'Must find P2002 chip');
  p2002Chip.dispatchEvent({ type: 'click' });
  await sleep(40);
  assert.ok(globalThis.window.location.search.includes('code=P2002'), '/obd-estimator must preserve code=P2002');
  for (const [tabId, expectedPath] of [
    ['tab-tco', '/tco'],
    ['tab-risk', '/risk-matrix'],
    ['tab-compare', '/compare'],
    ['tab-checklist', '/checklist'],
    ['tab-overview', '/'],
  ]) {
    const tabEl = rootContainer.getElementById(tabId);
    assert.ok(tabEl, `Must find nav element #${tabId}`);
    tabEl.dispatchEvent({ type: 'click' });
    await sleep(60);
    assert.equal(globalThis.window.location.pathname, expectedPath, `Navigating to ${tabId} while unselected must land on ${expectedPath}`);
    assert.equal(globalThis.window.location.search, '', `Navigating to ${tabId} after picking an OBD code must NOT pollute URL with ?code=`);
  }

  // 4. CommunityInvoiceModal on /reviews must default to empty vehicle selection (not Ford Focus or Camry)
  await mountRoute('/reviews');
  await sleep(120);
  const openInvoiceBtn = rootContainer.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.textContent.includes('Compare a Workshop Quote')
  )[0];
  assert.ok(openInvoiceBtn, 'Must find Compare a Workshop Quote button on /reviews');
  openInvoiceBtn.dispatchEvent({ type: 'click' });
  await sleep(50);
  const invoiceSelect = rootContainer.getElementById('invoice-vehicle-select');
  assert.ok(invoiceSelect, 'CommunityInvoiceModal must render #invoice-vehicle-select');
  assert.equal(invoiceSelect.value, '', 'CommunityInvoiceModal must NOT pre-select Ford Focus or any default vehicle');

  // 5. ?garage= pair loading on unselected /compare preserves custom price/odometer & updates canonical matchup URL
  storageMap.clear();
  await mountRoute('/compare', '?garage=vw-golf-20-tdi:19500:85000,tesla-model-3-lr:34000:22000');
  await sleep(120);
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'comparator-empty-state').length, 1, '/compare with ?garage= must start unselected until user loads pair');
  const loadPairBtn = rootContainer.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.textContent.includes('Load My Garage Pair')
  )[0];
  assert.ok(loadPairBtn, 'Must render Load My Garage Pair button when 2 garage vehicles are present');
  loadPairBtn.dispatchEvent({ type: 'click' });
  await sleep(80);
  assert.equal(globalThis.window.location.pathname, '/compare/vw-golf-20-tdi-vs-tesla-model-3-lr', 'Loading Garage pair must navigate to canonical matchup URL');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'comparator-price-a')[0]?.value, '19500', 'Vehicle A custom garage price must be preserved');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'comparator-odo-a')[0]?.value, '85000', 'Vehicle A custom garage odometer must be preserved');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'comparator-price-b')[0]?.value, '34000', 'Vehicle B custom garage price must be preserved');
  assert.equal(rootContainer.querySelectorAll((el) => el.getAttribute('data-testid') === 'comparator-odo-b')[0]?.value, '22000', 'Vehicle B custom garage odometer must be preserved');
});

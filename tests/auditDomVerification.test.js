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
async function mountRoute(pathname, search = '') {
  headElement.childNodes = [];
  rootContainer.childNodes = [];
  globalThis.document.title = '';
  globalThis.window.location.pathname = pathname;
  globalThis.window.location.search = search;
  globalThis.window.location.hash = '';
  globalThis.window.location.href = `http://localhost:5173${pathname}${search}`;
  rootInstance = createRoot(rootContainer);
  rootInstance.render(React.createElement(BrowserRouter, null, React.createElement(App)));
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

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

// Set up mock DOM environment
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
  get innerHTML() {
    if (this._innerHTML !== null) return this._innerHTML;
    return this.childNodes.map((c) => c.toHtml()).join('');
  }
  set innerHTML(v) {
    this._innerHTML = String(v);
    this.childNodes = [];
  }
  get value() {
    return this._value;
  }
  set value(v) {
    this._value = String(v);
  }
  get attributes() {
    return Array.from(this._attrs.entries()).map(([name, value]) => ({ name, value }));
  }
  hasAttribute(name) {
    return this._attrs.has(name);
  }
  getAttribute(name) {
    return this._attrs.get(name) || null;
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

const headElement = new MockElement('head');
headElement.querySelector = (selector) => {
  if (typeof selector === 'string' && selector.startsWith('meta[')) {
    const match = selector.match(/meta\[([a-zA-Z0-9_-]+)="([^"]+)"\]/);
    if (match) {
      return headElement.childNodes.find(
        (c) => c.tagName === 'META' && c.getAttribute(match[1]) === match[2]
      ) || null;
    }
  }
  if (typeof selector === 'string' && selector.startsWith('link[')) {
    const match = selector.match(/link\[rel="([^"]+)"\]/);
    if (match) {
      return headElement.childNodes.find(
        (c) => c.tagName === 'LINK' && c.getAttribute('rel') === match[1]
      ) || null;
    }
  }
  return null;
};

globalThis.document = {
  documentElement: new MockElement('html'),
  head: headElement,
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
};

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
const { resolveLegalPolicyKey, LEGAL_POLICIES } = await import('../src/data/legalPolicies.js');
const { default: App } = await import('../src/App.jsx');
const { isGoogleCmpPresent, openPrivacySettings } = await import('../src/components/legal/CookieConsentBanner.jsx');

// =============================================================================
// TEST SUITE: EMPIRICAL ADVERSARIAL STRESS-TESTING OF LEGAL ROUTING & CLOSE CONTRACT
// =============================================================================

test('Adversarial 1: All valid clean paths resolve to canonical policy keys', () => {
  const cleanPathExpectations = {
    '/privacy': 'privacy',
    '/terms': 'terms',
    '/disclaimer': 'disclaimer',
    '/cookies': 'cookies',
    '/affiliate-disclosure': 'affiliate-disclosure',
    '/affiliate': 'affiliate-disclosure', // alias to affiliate-disclosure
    '/do-not-sell': 'do-not-sell',
    '/donotsell': 'do-not-sell',
  };

  for (const [route, expectedKey] of Object.entries(cleanPathExpectations)) {
    const actual = resolveLegalPolicyKey(route);
    assert.strictEqual(
      actual,
      expectedKey,
      `Path "${route}" MUST resolve to "${expectedKey}", but got "${actual}"`
    );
  }
});

test('Adversarial 2: Trailing slashes are reliably normalized', () => {
  const trailingSlashExpectations = {
    '/privacy/': 'privacy',
    '/terms/': 'terms',
    '/disclaimer/': 'disclaimer',
    '/cookies/': 'cookies',
    '/affiliate-disclosure/': 'affiliate-disclosure',
    '/affiliate/': 'affiliate-disclosure',
    '/do-not-sell/': 'do-not-sell',
    '/donotsell/': 'do-not-sell',
  };

  for (const [route, expectedKey] of Object.entries(trailingSlashExpectations)) {
    const actual = resolveLegalPolicyKey(route);
    assert.strictEqual(
      actual,
      expectedKey,
      `Path with trailing slash "${route}" MUST resolve to "${expectedKey}", but got "${actual}"`
    );
  }
});

test('Adversarial 3: Uppercase and mixed-case paths resolve case-insensitively', () => {
  const caseVariants = [
    ['/Privacy', 'privacy'],
    ['/PRIVACY', 'privacy'],
    ['/pRiVaCy', 'privacy'],
    ['/TERMS', 'terms'],
    ['/Terms', 'terms'],
    ['/tErMs/', 'terms'],
    ['/DISCLAIMER', 'disclaimer'],
    ['/Disclaimer/', 'disclaimer'],
    ['/COOKIES', 'cookies'],
    ['/Cookies/', 'cookies'],
    ['/AFFILIATE-DISCLOSURE', 'affiliate-disclosure'],
    ['/Affiliate-Disclosure', 'affiliate-disclosure'],
    ['/AFFILIATE', 'affiliate-disclosure'],
    ['/Affiliate/', 'affiliate-disclosure'],
    ['/DO-NOT-SELL', 'do-not-sell'],
    ['/Do-Not-Sell', 'do-not-sell'],
    ['/do-not-sell/', 'do-not-sell'],
    ['/DONOTSELL', 'do-not-sell'],
  ];

  for (const [route, expectedKey] of caseVariants) {
    const actual = resolveLegalPolicyKey(route);
    assert.strictEqual(
      actual,
      expectedKey,
      `Case variant "${route}" MUST resolve to "${expectedKey}", but got "${actual}"`
    );
  }
});

test('Adversarial 4: Legacy hash routes and variants resolve correctly', () => {
  const hashExpectations = {
    '#privacy': 'privacy',
    '#terms': 'terms',
    '#disclaimer': 'disclaimer',
    '#cookies': 'cookies',
    '#affiliate-disclosure': 'affiliate-disclosure',
    '#about': 'about',
    '#contact': 'contact',
    '#affiliate': 'affiliate-disclosure',
    '#Privacy': 'privacy',
    '#TERMS': 'terms',
    '#ABOUT': 'about',
    '#do-not-sell': 'do-not-sell',
    '#DO-NOT-SELL': 'do-not-sell',
    '#donotsell': 'do-not-sell',
  };

  for (const [hashRoute, expectedKey] of Object.entries(hashExpectations)) {
    const actual = resolveLegalPolicyKey(hashRoute);
    assert.strictEqual(
      actual,
      expectedKey,
      `Hash variant "${hashRoute}" MUST resolve to "${expectedKey}", but got "${actual}"`
    );
  }
});

test('Adversarial 5: Collision guard on methodology, about, contact, and guides paths MUST return null (never legal modal)', () => {
  const collisionProbes = [
    '/methodology',
    '/methodology/',
    'methodology',
    '/Methodology',
    '/Methodology/',
    'Methodology',
    '/METHODOLOGY',
    '/METHODOLOGY/',
    'METHODOLOGY',
    '/methodology/tco',
    '/methodology/details',
    '/methodology/nested/deep',
    'methodology/',
    '/about',
    '/about/',
    '/ABOUT',
    '/About/',
    '/contact',
    '/contact/',
    '/CONTACT',
    '/Contact/',
    '/guides',
    '/guides/',
    '/guides/how-to-spot-odometer-rollback',
  ];

  for (const probe of collisionProbes) {
    const actual = resolveLegalPolicyKey(probe);
    assert.strictEqual(
      actual,
      null,
      `CRITICAL COLLISION FAILURE: Probe "${probe}" returned "${actual}" instead of null!`
    );
  }
});

test('Adversarial 6: Unknown routes, core application tabs, and partial matches MUST return null', () => {
  const nonPolicyProbes = [
    // Non-policy app tabs
    '/foo',
    '/bar',
    '/tco',
    '/obd-estimator',
    '/risk-matrix',
    '/compare',
    '/checklist',
    '/reviews',
    '/blog',
    '/',
    '',
    // Substring & prefix/suffix attacks
    '/privacy-policy',
    '/terms-and-conditions',
    '/terms-of-service',
    '/about-us',
    '/contact-us',
    '/disclaimer-info',
    '/cookies-settings',
    '/affiliate-program',
    '/not-privacy',
    '/privacy123',
    '/about/team',
    '/privacypolicy',
    'privacy-policy',
  ];

  for (const probe of nonPolicyProbes) {
    const actual = resolveLegalPolicyKey(probe);
    assert.strictEqual(
      actual,
      null,
      `Probe "${probe}" should NOT resolve to a policy, but returned "${actual}"`
    );
  }
});

test('Adversarial 7: Fuzzing non-string types and malformed whitespace inputs', () => {
  const malformedInputs = [
    null,
    undefined,
    123,
    0,
    -1,
    true,
    false,
    NaN,
    Infinity,
    {},
    [],
    [1, 2, 3],
    () => {},
    '',
    '   ',
    '\t\n\r',
  ];

  for (const bad of malformedInputs) {
    assert.doesNotThrow(() => {
      const res = resolveLegalPolicyKey(bad);
      assert.strictEqual(res, null, `Malformed input ${String(bad)} must return null, got ${res}`);
    });
  }

  // Whitespace-padded valid inputs should normalize via trim()
  assert.strictEqual(resolveLegalPolicyKey('  /privacy  '), 'privacy');
  assert.strictEqual(resolveLegalPolicyKey('\n/terms/\t'), 'terms');
  assert.strictEqual(resolveLegalPolicyKey('  #cookies  '), 'cookies');
});

test('Adversarial 8: Browser History & Popstate Close Contract Simulation in App.jsx', async () => {
  // Test 8A: Open directly on clean path /privacy -> close -> URL resets to /
  globalThis.window.location.pathname = '/privacy';
  globalThis.window.location.search = '';
  globalThis.window.location.hash = '';

  const root = createRoot(rootContainer);
  root.render(React.createElement(App));

  // Yield to React rendering
  await new Promise((r) => setTimeout(r, 20));

  let html = rootContainer.toHtml();
  assert.ok(
    html.includes('data-testid="legal-modal-privacy"'),
    'App opening at /privacy MUST mount LegalModal for privacy policy'
  );

  // Find close button on LegalModal
  const closeBtn = rootContainer.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.getAttribute('aria-label') === 'Close modal'
  )[0];
  assert.ok(closeBtn, 'Close button with aria-label="Close modal" must exist in DOM');

  // Trigger close
  closeBtn.dispatchEvent({ type: 'click' });
  await new Promise((r) => setTimeout(r, 20));

  assert.strictEqual(
    globalThis.window.location.pathname,
    '/',
    'Closing modal from /privacy MUST reset window.location.pathname to "/"'
  );
  assert.strictEqual(
    globalThis.window.location.hash,
    '',
    'Closing modal must leave window.location.hash empty'
  );
  html = rootContainer.toHtml();
  assert.ok(
    !html.includes('data-testid="legal-modal-privacy"'),
    'LegalModal must be completely unmounted after close'
  );

  // Test 8B: Clean path with search parameters preserved on close
  globalThis.window.location.pathname = '/terms';
  globalThis.window.location.search = '?tab=tco&preset=bmw-330i-g20';
  globalThis.window.location.hash = '';
  globalThis.window.dispatchEvent({ type: 'popstate' });
  await new Promise((r) => setTimeout(r, 20));

  html = rootContainer.toHtml();
  assert.ok(
    html.includes('data-testid="legal-modal-terms"'),
    'Popstate to /terms with search params MUST mount LegalModal for terms'
  );

  const closeBtnTerms = rootContainer.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.getAttribute('aria-label') === 'Close modal'
  )[0];
  assert.ok(closeBtnTerms, 'Close button for terms modal must exist');
  closeBtnTerms.dispatchEvent({ type: 'click' });
  await new Promise((r) => setTimeout(r, 20));

  assert.strictEqual(
    globalThis.window.location.pathname,
    '/',
    'Closing modal from /terms MUST reset window.location.pathname to "/"'
  );
  assert.strictEqual(
    globalThis.window.location.search,
    '?tab=tco&preset=bmw-330i-g20',
    'Closing modal MUST preserve existing query parameters (?tab=tco&preset=bmw-330i-g20)'
  );

  // Test 8C: Legacy hash routing -> closing strips hash and leaves pathname untouched
  globalThis.window.location.pathname = '/tco';
  globalThis.window.location.search = '';
  globalThis.window.location.hash = '#cookies';
  globalThis.window.dispatchEvent({ type: 'hashchange' });
  await new Promise((r) => setTimeout(r, 20));

  html = rootContainer.toHtml();
  assert.ok(
    html.includes('data-testid="legal-modal-cookies"'),
    'Hashchange to #cookies MUST mount LegalModal for cookies'
  );

  const closeBtnCookies = rootContainer.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.getAttribute('aria-label') === 'Close modal'
  )[0];
  assert.ok(closeBtnCookies, 'Close button for cookies modal must exist');
  closeBtnCookies.dispatchEvent({ type: 'click' });
  await new Promise((r) => setTimeout(r, 20));

  assert.strictEqual(
    globalThis.window.location.pathname,
    '/tco',
    'Closing modal opened via hash MUST preserve base pathname ("/tco")'
  );
  assert.strictEqual(
    globalThis.window.location.hash,
    '',
    'Closing modal opened via hash MUST strip the hash ("")'
  );

  // Test 8D: Browser Back/Forward navigation (popstate) between clean path and root
  globalThis.window.location.pathname = '/terms';
  globalThis.window.location.hash = '';
  globalThis.window.dispatchEvent({ type: 'popstate' });
  await new Promise((r) => setTimeout(r, 20));

  html = rootContainer.toHtml();
  assert.ok(
    html.includes('data-testid="legal-modal-terms"'),
    'Browser forward navigation to /terms must open terms modal'
  );

  // Browser Back button to /
  globalThis.window.location.pathname = '/';
  globalThis.window.dispatchEvent({ type: 'popstate' });
  await new Promise((r) => setTimeout(r, 20));

  html = rootContainer.toHtml();
  assert.ok(
    !html.includes('data-testid="legal-modal-terms"'),
    'Browser back navigation to / must close terms modal'
  );

  // Test 8E: In-modal policy switching retains clean path structure
  globalThis.window.location.pathname = '/privacy';
  globalThis.window.dispatchEvent({ type: 'popstate' });
  await new Promise((r) => setTimeout(r, 20));

  // Find policy link to /terms inside modal
  const termsLink = rootContainer.querySelectorAll(
    (el) => el.tagName === 'A' && el.getAttribute('href') === '/terms'
  )[0];
  assert.ok(termsLink, 'Modal switcher link to /terms must exist');

  termsLink.dispatchEvent({ type: 'click' });
  await new Promise((r) => setTimeout(r, 20));

  assert.strictEqual(
    globalThis.window.location.pathname,
    '/terms',
    'Switching to Terms inside modal on clean path must update window.location.pathname to /terms'
  );
  html = rootContainer.toHtml();
  assert.ok(
    html.includes('data-testid="legal-modal-terms"'),
    'Modal must now display Terms of Service'
  );

  // Close from switched policy
  const closeSwitched = rootContainer.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.getAttribute('aria-label') === 'Close modal'
  )[0];
  closeSwitched.dispatchEvent({ type: 'click' });
  await new Promise((r) => setTimeout(r, 20));

  assert.strictEqual(
    globalThis.window.location.pathname,
    '/',
    'Closing after policy switch must reset pathname to "/"'
  );

  // Test 8F: Navigating to /methodology via popstate MUST NOT trigger any legal modal
  globalThis.window.location.pathname = '/methodology';
  globalThis.window.dispatchEvent({ type: 'popstate' });
  await new Promise((r) => setTimeout(r, 20));

  html = rootContainer.toHtml();
  assert.ok(
    !html.includes('data-testid="legal-modal-about"'),
    'CRITICAL: Navigating to /methodology MUST NOT open the About legal modal!'
  );
  assert.ok(
    html.includes('methodology-guide') || html.includes('Technical Methodology'),
    '/methodology must render the Technical Methodology guide workspace tab'
  );
});

test('Adversarial 9: AdSense Configuration & Publisher ID Strict Alignment', async () => {
  const { default: MONETIZATION_CONFIG, SITE_METADATA, ADSENSE_CONFIG } = await import('../src/config/monetizationConfig.js');

  // Exact publisher ID
  assert.strictEqual(
    MONETIZATION_CONFIG.publisherId,
    'ca-pub-6581535125716295',
    'MONETIZATION_CONFIG.publisherId must be ca-pub-6581535125716295'
  );
  assert.strictEqual(
    ADSENSE_CONFIG.publisherId,
    'ca-pub-6581535125716295',
    'ADSENSE_CONFIG.publisherId must be ca-pub-6581535125716295'
  );
  assert.strictEqual(
    MONETIZATION_CONFIG.domain,
    'mydriveledger.com',
    'Domain must be mydriveledger.com'
  );
  assert.strictEqual(
    MONETIZATION_CONFIG.contactEmail,
    'contact@mydriveledger.com',
    'Contact email must be contact@mydriveledger.com'
  );
  assert.strictEqual(
    MONETIZATION_CONFIG.legalEmail,
    'legal@mydriveledger.com',
    'Legal email must be legal@mydriveledger.com'
  );

  // ads.txt
  const adsTxtPath = path.join(projectRoot, 'public', 'ads.txt');
  assert.ok(fs.existsSync(adsTxtPath), 'public/ads.txt must exist');
  const adsTxtContent = fs.readFileSync(adsTxtPath, 'utf8').trim();
  assert.strictEqual(
    adsTxtContent,
    'google.com, pub-6581535125716295, DIRECT, f08c47fec0942fa0',
    'public/ads.txt must contain the exact Google AdSense publisher line'
  );

  // index.html
  const indexPath = path.join(projectRoot, 'index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  assert.ok(
    indexHtml.includes('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6581535125716295'),
    'index.html <head> must contain the official Google AdSense verification script'
  );
});

test('Adversarial 10: Static Hosting SPA Fallback & XML Sitemap Integrity', () => {
  // Production routing configuration (wrangler.jsonc with native SPA routing or legacy _redirects)
  const wranglerPath = path.join(projectRoot, 'wrangler.jsonc');
  const redirectsPath = path.join(projectRoot, 'public', '_redirects');
  assert.ok(
    fs.existsSync(wranglerPath) || fs.existsSync(redirectsPath),
    'Production routing configuration (wrangler.jsonc or public/_redirects) must exist'
  );
  if (fs.existsSync(wranglerPath)) {
    const wranglerConfig = JSON.parse(fs.readFileSync(wranglerPath, 'utf8'));
    assert.strictEqual(
      wranglerConfig.assets?.not_found_handling,
      'single-page-application',
      'wrangler.jsonc must configure assets.not_found_handling to "single-page-application"'
    );
  } else if (fs.existsSync(redirectsPath)) {
    assert.strictEqual(
      fs.readFileSync(redirectsPath, 'utf8').trim(),
      '/* /index.html 200',
      'public/_redirects must specify /* /index.html 200'
    );
  }

  // sitemap.xml
  const sitemapPath = path.join(projectRoot, 'public', 'sitemap.xml');
  assert.ok(fs.existsSync(sitemapPath), 'public/sitemap.xml must exist');
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  assert.ok(
    sitemapContent.includes('<loc>https://mydriveledger.com/privacy</loc>'),
    'public/sitemap.xml must contain https://mydriveledger.com/privacy'
  );
  assert.ok(
    sitemapContent.includes('<loc>https://mydriveledger.com/terms</loc>'),
    'public/sitemap.xml must contain https://mydriveledger.com/terms'
  );
  assert.ok(
    sitemapContent.includes('<loc>https://mydriveledger.com/do-not-sell</loc>'),
    'public/sitemap.xml must contain https://mydriveledger.com/do-not-sell'
  );
  assert.ok(
    sitemapContent.includes('<loc>https://mydriveledger.com/cookies</loc>'),
    'public/sitemap.xml must contain https://mydriveledger.com/cookies'
  );
});

test('Adversarial 11: High-Resolution CMP Brand Assets Compliance', () => {
  const logoPath = path.join(projectRoot, 'public', 'logo-512.png');
  assert.ok(fs.existsSync(logoPath), 'public/logo-512.png must exist');

  const stat = fs.statSync(logoPath);
  assert.ok(stat.size > 0 && stat.size < 102400, `logo-512.png must be < 100KB, actual: ${stat.size} bytes`);

  const buf = fs.readFileSync(logoPath);
  assert.strictEqual(buf.readUInt32BE(0), 0x89504e47, 'Valid PNG signature 0x89504E47');
  assert.strictEqual(buf.readUInt32BE(16), 512, 'PNG width must be 512');
  assert.strictEqual(buf.readUInt32BE(20), 512, 'PNG height must be 512');

  const faviconPath = path.join(projectRoot, 'public', 'favicon.svg');
  assert.ok(fs.existsSync(faviconPath), 'public/favicon.svg must exist');
  const svgContent = fs.readFileSync(faviconPath, 'utf8');
  assert.ok(svgContent.includes('<svg') && svgContent.includes('</svg>'), 'Valid SVG markup in favicon.svg');
});

test('Adversarial 12: Google CMP Detection & Double-Banner Suppression Contract', () => {
  // Clean up globals first
  delete globalThis.window.googlefc;
  delete globalThis.window.__tcfapi;
  delete globalThis.window.__gpp;
  delete globalThis.window.__uspapi;

  assert.strictEqual(
    isGoogleCmpPresent(),
    false,
    'When no CMP API is injected, isGoogleCmpPresent() MUST return false'
  );

  // 1. window.googlefc
  globalThis.window.googlefc = {};
  assert.strictEqual(isGoogleCmpPresent(), true, 'window.googlefc presence must return true');
  delete globalThis.window.googlefc;

  // 2. window.__tcfapi
  globalThis.window.__tcfapi = () => {};
  assert.strictEqual(isGoogleCmpPresent(), true, 'window.__tcfapi presence must return true');
  delete globalThis.window.__tcfapi;

  // 3. window.__gpp
  globalThis.window.__gpp = () => {};
  assert.strictEqual(isGoogleCmpPresent(), true, 'window.__gpp presence must return true');
  delete globalThis.window.__gpp;

  // 4. window.__uspapi
  globalThis.window.__uspapi = () => {};
  assert.strictEqual(isGoogleCmpPresent(), true, 'window.__uspapi presence must return true');
  delete globalThis.window.__uspapi;
});

test('Adversarial 13: Google Funding Choices Revocation API & AdBlocker Fallback Helper', () => {
  // Scenario A: window.googlefc.showRevocationMessage is available
  let showRevocationCalled = false;
  let fallbackACalled = false;
  globalThis.window.googlefc = {
    showRevocationMessage() {
      showRevocationCalled = true;
    },
  };

  const resA = openPrivacySettings(() => {
    fallbackACalled = true;
  });
  assert.strictEqual(resA, true, 'openPrivacySettings must return true when googlefc is present');
  assert.strictEqual(showRevocationCalled, true, 'showRevocationMessage must be invoked');
  assert.strictEqual(fallbackACalled, false, 'fallback callback must NOT be called when revocation message succeeds');

  // Scenario B: window.googlefc is loading with callbackQueue
  delete globalThis.window.googlefc.showRevocationMessage;
  globalThis.window.googlefc.callbackQueue = [];
  let fallbackBCalled = false;

  const resB = openPrivacySettings(() => {
    fallbackBCalled = true;
  });
  assert.strictEqual(resB, true, 'openPrivacySettings must return true when callbackQueue is queued');
  assert.strictEqual(globalThis.window.googlefc.callbackQueue.length, 1, 'callbackQueue must receive pushed job');
  assert.ok(globalThis.window.googlefc.callbackQueue[0].CONSENT_DATA_READY, 'Must have CONSENT_DATA_READY hook');

  // Scenario C: window.googlefc is blocked/absent (AdBlocker scenario)
  delete globalThis.window.googlefc;
  let fallbackCCalled = false;

  const resC = openPrivacySettings(() => {
    fallbackCCalled = true;
  });
  assert.strictEqual(resC, false, 'openPrivacySettings must return false when CMP is absent');
  assert.strictEqual(fallbackCCalled, true, 'fallback callback MUST execute when CMP is blocked by adblocker');
});

test('Adversarial 14: DynamicSeoHead Legal Metadata & Crawlability for /privacy & /do-not-sell', async () => {
  // 14A. Navigating to /privacy
  globalThis.window.location.pathname = '/privacy';
  globalThis.window.location.search = '';
  globalThis.window.location.hash = '';
  globalThis.window.dispatchEvent({ type: 'popstate' });
  await new Promise((r) => setTimeout(r, 20));

  assert.ok(
    globalThis.document.title.includes('Privacy Policy'),
    `document.title must contain "Privacy Policy", got: "${globalThis.document.title}"`
  );

  const canonicalEl = globalThis.document.head.querySelector('link[rel="canonical"]');
  assert.ok(canonicalEl, 'Canonical <link> tag must exist in head');
  assert.strictEqual(
    canonicalEl.getAttribute('href'),
    'https://mydriveledger.com/privacy',
    'Canonical URL for /privacy must be https://mydriveledger.com/privacy'
  );

  let html = rootContainer.toHtml();
  assert.ok(
    html.includes('data-testid="legal-modal-privacy"'),
    'Visiting /privacy must immediately render the legal-modal-privacy modal'
  );

  // 14B. Navigating to /do-not-sell
  globalThis.window.location.pathname = '/do-not-sell';
  globalThis.window.dispatchEvent({ type: 'popstate' });
  await new Promise((r) => setTimeout(r, 20));

  assert.ok(
    globalThis.document.title.includes('Do Not Sell'),
    `document.title must contain "Do Not Sell", got: "${globalThis.document.title}"`
  );

  assert.strictEqual(
    canonicalEl.getAttribute('href'),
    'https://mydriveledger.com/do-not-sell',
    'Canonical URL for /do-not-sell must be https://mydriveledger.com/do-not-sell'
  );

  html = rootContainer.toHtml();
  assert.ok(
    html.includes('data-testid="legal-modal-do-not-sell"'),
    'Visiting /do-not-sell must immediately render the legal-modal-do-not-sell modal'
  );

  // 14C. Standalone crawlability for /cookies, /terms, /disclaimer, /affiliate-disclosure
  const additionalRoutes = [
    { path: '/cookies', titleKeyword: 'Cookie Policy', testId: 'legal-modal-cookies' },
    { path: '/terms', titleKeyword: 'Terms', testId: 'legal-modal-terms' },
    { path: '/disclaimer', titleKeyword: 'Disclaimer', testId: 'legal-modal-disclaimer' },
    { path: '/affiliate-disclosure', titleKeyword: 'Affiliate', testId: 'legal-modal-affiliate-disclosure' },
  ];

  for (const { path: routePath, titleKeyword, testId } of additionalRoutes) {
    globalThis.window.location.pathname = routePath;
    globalThis.window.dispatchEvent({ type: 'popstate' });
    await new Promise((r) => setTimeout(r, 20));

    assert.ok(
      globalThis.document.title.includes(titleKeyword),
      `document.title for ${routePath} must contain "${titleKeyword}", got: "${globalThis.document.title}"`
    );

    assert.strictEqual(
      canonicalEl.getAttribute('href'),
      `https://mydriveledger.com${routePath}`,
      `Canonical URL for ${routePath} must be https://mydriveledger.com${routePath}`
    );

    html = rootContainer.toHtml();
    assert.ok(
      html.includes(`data-testid="${testId}"`),
      `Visiting ${routePath} must immediately render the ${testId} modal`
    );
  }

  // Close modal -> path resets to /
  const closeBtn = rootContainer.querySelectorAll(
    (el) => el.tagName === 'BUTTON' && el.getAttribute('aria-label') === 'Close modal'
  )[0];
  assert.ok(closeBtn, 'Close button on legal modal must exist');
  closeBtn.dispatchEvent({ type: 'click' });
  await new Promise((r) => setTimeout(r, 20));

  assert.strictEqual(
    globalThis.window.location.pathname,
    '/',
    'Closing modal must reset pathname to "/"'
  );
});

test('Adversarial 15: EU (GDPR / TCF v2.2) & US State (CCPA / CPRA / VCDPA / CPA / CTDPA) Regulatory Prose Invariants', () => {
  const privacyStr = JSON.stringify(LEGAL_POLICIES.privacy);
  const cookiesStr = JSON.stringify(LEGAL_POLICIES.cookies);
  const doNotSellStr = JSON.stringify(LEGAL_POLICIES['do-not-sell']);

  // Privacy Policy Verifications
  assert.ok(privacyStr.includes('ca-pub-6581535125716295'), 'Privacy policy must disclose publisher ID ca-pub-6581535125716295');
  assert.ok(privacyStr.includes('https://policies.google.com/technologies/partner-sites'), 'Privacy policy must link to partner-sites');
  assert.ok(privacyStr.includes('TCF v2.2'), 'Privacy policy must reference IAB TCF v2.2');
  assert.ok(privacyStr.includes('GDPR Article 6(1)(a)'), 'Privacy policy must disclose Consent under Article 6(1)(a)');
  assert.ok(privacyStr.includes('GDPR Article 6(1)(f)'), 'Privacy policy must disclose Legitimate Interest under Article 6(1)(f)');
  assert.ok(privacyStr.includes('Your US State Privacy Rights & Do Not Sell or Share My Personal Information'), 'Privacy policy must contain dedicated US state privacy rights heading');
  assert.ok(privacyStr.includes('Global Privacy Control') && privacyStr.includes('navigator.globalPrivacyControl'), 'Privacy policy must disclose GPC signal support');
  assert.ok(privacyStr.toLowerCase().includes('cross-context behavioral advertising'), 'Privacy policy must disclose opt-out of cross-context behavioral ads');
  assert.ok(privacyStr.includes('CCPA') && privacyStr.includes('CPRA'), 'Privacy policy must cover CCPA/CPRA');
  assert.ok(privacyStr.includes('VCDPA'), 'Privacy policy must cover VCDPA');
  assert.ok(privacyStr.includes('CPA'), 'Privacy policy must cover CPA');
  assert.ok(privacyStr.includes('CTDPA'), 'Privacy policy must cover CTDPA');
  assert.ok(privacyStr.includes('1798.125'), 'Privacy policy must guarantee non-discrimination under § 1798.125');
  assert.ok(privacyStr.includes('Online Identifiers') || privacyStr.includes('Identifiers'), 'Privacy policy must detail categories of personal data collected');
  assert.ok(privacyStr.includes('DO NOT collect') || privacyStr.includes('do not collect'), 'Privacy policy must detail categories NOT collected');

  // Cookie Policy Verifications
  assert.ok(cookiesStr.includes('ca-pub-6581535125716295'), 'Cookie policy must disclose publisher ID ca-pub-6581535125716295');
  assert.ok(cookiesStr.includes('DoubleClick'), 'Cookie policy must disclose DoubleClick advertising cookies');
  assert.ok(cookiesStr.includes('TCF v2.2'), 'Cookie policy must reference IAB TCF v2.2');
  assert.ok(cookiesStr.includes('https://policies.google.com/technologies/partner-sites'), 'Cookie policy must link to partner-sites');
  assert.ok(cookiesStr.includes('Art. 6(1)(a)') || cookiesStr.includes('Article 6(1)(a)'), 'Cookie policy must disclose Consent under Art 6(1)(a)');
  assert.ok(cookiesStr.includes('Art. 6(1)(f)') || cookiesStr.includes('Article 6(1)(f)'), 'Cookie policy must disclose Legitimate Interest under Art 6(1)(f)');
  assert.ok(cookiesStr.includes('Your US State Privacy Rights & Do Not Sell or Share My Personal Information'), 'Cookie policy must contain dedicated US state privacy rights heading');
  assert.ok(cookiesStr.includes('Global Privacy Control') && cookiesStr.includes('navigator.globalPrivacyControl'), 'Cookie policy must disclose GPC signal support');
  assert.ok(cookiesStr.toLowerCase().includes('cross-context behavioral advertising'), 'Cookie policy must disclose opt-out of cross-context behavioral ads');
  assert.ok(cookiesStr.includes('CCPA') && cookiesStr.includes('CPRA'), 'Cookie policy must cover CCPA/CPRA');
  assert.ok(cookiesStr.includes('VCDPA'), 'Cookie policy must cover VCDPA');
  assert.ok(cookiesStr.includes('CPA'), 'Cookie policy must cover CPA');
  assert.ok(cookiesStr.includes('CTDPA'), 'Cookie policy must cover CTDPA');
  assert.ok(cookiesStr.includes('1798.125'), 'Cookie policy must guarantee non-discrimination under § 1798.125');
  assert.ok(cookiesStr.includes('Categories of Personal Information Collected'), 'Cookie policy must detail categories of personal information collected');

  // Do Not Sell Policy Verifications
  assert.ok(doNotSellStr, 'LEGAL_POLICIES["do-not-sell"] must exist');
  assert.ok(doNotSellStr.includes('CCPA'), 'Do-not-sell policy must cover CCPA');
  assert.ok(doNotSellStr.includes('CPRA'), 'Do-not-sell policy must cover CPRA');
  assert.ok(doNotSellStr.includes('VCDPA'), 'Do-not-sell policy must cover VCDPA');
  assert.ok(doNotSellStr.includes('CPA'), 'Do-not-sell policy must cover CPA');
  assert.ok(doNotSellStr.includes('CTDPA'), 'Do-not-sell policy must cover CTDPA');
  assert.ok(doNotSellStr.includes('Global Privacy Control'), 'Do-not-sell policy must cover GPC');
  assert.ok(doNotSellStr.includes('ca-pub-6581535125716295'), 'Do-not-sell policy must disclose publisher ID ca-pub-6581535125716295');
  assert.ok(doNotSellStr.includes('1798.125'), 'Do-not-sell policy must guarantee non-discrimination under § 1798.125');
});

test('Adversarial 16: Footer Regulatory Compliance Navigation & Actions', async () => {
  globalThis.window.location.pathname = '/';
  globalThis.window.location.search = '';
  globalThis.window.location.hash = '';
  globalThis.window.dispatchEvent({ type: 'popstate' });
  await new Promise((r) => setTimeout(r, 20));

  const privacyLinks = rootContainer.querySelectorAll(
    (el) => el.getAttribute('data-testid') === 'footer-privacy-policy' || (el.tagName === 'A' && el.getAttribute('href') === '/privacy')
  );
  assert.ok(privacyLinks.length > 0, 'Footer must render visible Privacy Policy link to /privacy');

  const termsLinks = rootContainer.querySelectorAll(
    (el) => el.getAttribute('data-testid') === 'footer-terms-of-service' || (el.tagName === 'A' && el.getAttribute('href') === '/terms')
  );
  assert.ok(termsLinks.length > 0, 'Footer must render visible Terms of Service link to /terms');

  const disclaimerLinks = rootContainer.querySelectorAll(
    (el) => el.getAttribute('data-testid') === 'footer-liability-disclaimer' || (el.tagName === 'A' && el.getAttribute('href') === '/disclaimer')
  );
  assert.ok(disclaimerLinks.length > 0, 'Footer must render visible Liability Disclaimer link to /disclaimer');

  const cookiePolicyLinks = rootContainer.querySelectorAll(
    (el) => el.getAttribute('data-testid') === 'footer-cookie-policy' || (el.tagName === 'A' && el.getAttribute('href') === '/cookies')
  );
  assert.ok(cookiePolicyLinks.length > 0, 'Footer must render visible Cookie Policy link to /cookies');

  const affiliateLinks = rootContainer.querySelectorAll(
    (el) => el.getAttribute('data-testid') === 'footer-affiliate-disclosure' || (el.tagName === 'A' && el.getAttribute('href') === '/affiliate-disclosure')
  );
  assert.ok(affiliateLinks.length > 0, 'Footer must render visible Affiliate Disclosure link to /affiliate-disclosure');

  const cookieSettingsBtn = rootContainer.querySelectorAll(
    (el) => el.getAttribute('data-testid') === 'footer-cookie-preferences'
  )[0];
  assert.ok(cookieSettingsBtn, 'Footer must render Privacy & Cookie Settings button with data-testid="footer-cookie-preferences"');

  const doNotSellLink = rootContainer.querySelectorAll(
    (el) => el.getAttribute('data-testid') === 'footer-do-not-sell' || (el.tagName === 'A' && el.getAttribute('href') === '/do-not-sell')
  )[0];
  assert.ok(doNotSellLink, 'Footer must render Do Not Sell or Share My Personal Information link to /do-not-sell');
});


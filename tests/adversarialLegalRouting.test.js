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

globalThis.document = {
  documentElement: new MockElement('html'),
  activeElement: null,
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
const { resolveLegalPolicyKey } = await import('../src/data/legalPolicies.js');
const { default: App } = await import('../src/App.jsx');

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
    '/about': 'about',
    '/contact': 'contact',
    '/affiliate': 'affiliate-disclosure', // alias to affiliate-disclosure
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
    '/about/': 'about',
    '/contact/': 'contact',
    '/affiliate/': 'affiliate-disclosure',
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
    ['/ABOUT', 'about'],
    ['/About/', 'about'],
    ['/aBoUt', 'about'],
    ['/CONTACT', 'contact'],
    ['/Contact/', 'contact'],
    ['/AFFILIATE', 'affiliate-disclosure'],
    ['/Affiliate/', 'affiliate-disclosure'],
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

test('Adversarial 5: Collision guard on methodology paths MUST return null (never "about")', () => {
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
  globalThis.window.location.pathname = '/contact';
  globalThis.window.location.hash = '';
  globalThis.window.dispatchEvent({ type: 'popstate' });
  await new Promise((r) => setTimeout(r, 20));

  html = rootContainer.toHtml();
  assert.ok(
    html.includes('data-testid="legal-modal-contact"'),
    'Browser forward navigation to /contact must open contact modal'
  );

  // Browser Back button to /
  globalThis.window.location.pathname = '/';
  globalThis.window.dispatchEvent({ type: 'popstate' });
  await new Promise((r) => setTimeout(r, 20));

  html = rootContainer.toHtml();
  assert.ok(
    !html.includes('data-testid="legal-modal-contact"'),
    'Browser back navigation to / must close contact modal'
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


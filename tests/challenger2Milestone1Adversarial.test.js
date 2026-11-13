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
    this.parentNode = null;
    this.childNodes = [];
    this._attrs = new Map();
    this._listeners = new Map();
    this.style = {};
    this.checked = false;
    this._value = '';
    this._innerHTML = null;
    this._lastScrolledIntoView = null;
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
    if (typeof v === 'string') {
      this.classList._set = new Set(v.split(/\s+/).filter(Boolean));
    }
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
    if (name === 'class') {
      this.classList._set = new Set(String(value).split(/\s+/).filter(Boolean));
    }
  }
  removeAttribute(name) {
    this._attrs.delete(name);
    if (name === 'class') {
      this.classList._set.clear();
    }
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
  scrollIntoView(opts) {
    this._lastScrolledIntoView = opts || true;
  }

  closest(selector) {
    let current = this;
    while (current && current.nodeType === 1) {
      if (typeof selector === 'string') {
        const s = selector.trim();
        if (s.startsWith('#') && current.id === s.slice(1)) return current;
        if (s.startsWith('.') && current.classList.contains(s.slice(1))) return current;
        if (s.toUpperCase() === current.tagName) return current;
      }
      current = current.parentNode;
    }
    return null;
  }

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
  addEventListener(evt, fn) {
    if (!docListeners.has(evt)) docListeners.set(evt, []);
    docListeners.get(evt).push(fn);
  },
  removeEventListener(evt, fn) {
    if (!docListeners.has(evt)) return;
    const list = docListeners.get(evt);
    const idx = list.indexOf(fn);
    if (idx !== -1) list.splice(idx, 1);
  },
  dispatchEvent(eventObj) {
    const list = docListeners.get(eventObj.type) || [];
    for (const fn of [...list]) {
      fn(eventObj);
    }
  },
};

const docListeners = new Map();
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
const { default: Navbar, PRIMARY_WORKSPACE_TABS, SECONDARY_WORKSPACE_TABS } = await import('../src/components/layout/Navbar.jsx');
const { default: HeroVehicleFinder } = await import('../src/components/home/HeroVehicleFinder.jsx');
const { default: HomePage } = await import('../src/pages/HomePage.jsx');
const { VEHICLE_PRESETS, getPresetById } = await import('../src/data/vehiclePresets.js');
const { OBD_CODES } = await import('../src/data/obdCodes.js');
const { UnitProvider } = await import('../src/context/UnitContext.jsx');
const { ThemeProvider } = await import('../src/context/ThemeContext.jsx');
const { GarageProvider } = await import('../src/context/GarageContext.jsx');

const sleep = (ms = 25) => new Promise((resolve) => setTimeout(resolve, ms));

let renderCount = 0;

function renderComponent(ui) {
  while (rootContainer.childNodes.length > 0) {
    rootContainer.removeChild(rootContainer.childNodes[0]);
  }
  const root = createRoot(rootContainer);
  root.render(ui);
  return { root, rootContainer };
}

async function renderWithProviders(ui) {
  renderCount++;
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  
  while (rootContainer.childNodes.length > 0) {
    rootContainer.removeChild(rootContainer.childNodes[0]);
  }
  const root = createRoot(rootContainer);
  // Unmount previous component tree
  root.render(null);
  await sleep(15);

  root.render(
    React.createElement(
      'div',
      { key: `wrapper-${renderCount}` },
      React.createElement(
        UnitProvider,
        { key: `unit-${renderCount}` },
        React.createElement(
          ThemeProvider,
          { key: `theme-${renderCount}` },
          React.createElement(
            GarageProvider,
            { key: `garage-${renderCount}` },
            ui
          )
        )
      )
    )
  );
  await sleep(40);
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
// CHALLENGER SUITE 1: Mobile Quick Tabs Stress & Navigation Behavior
// =============================================================================
test('Challenger 1.1: Mobile quick tabs container and all 5 primary tabs rendered with full accessibility', async () => {
  let selectedTab = 'overview';
  const onSelectTab = (tabId) => {
    selectedTab = tabId;
  };

  const { rootContainer } = await renderWithProviders(
    React.createElement(Navbar, {
      activeTab: selectedTab,
      onSelectTab,
      selectedPresetId: 'vw-golf-20-tdi',
      onSelectPreset: () => {},
    })
  );
  await sleep(40);

  const quickTabsContainer = findByTestId(rootContainer, 'navbar-mobile-quick-tabs');
  assert.ok(quickTabsContainer, 'Mobile quick tabs container data-testid="navbar-mobile-quick-tabs" must exist');

  // Verify all 5 primary tabs exist in mobile quick tabs
  const tabButtons = quickTabsContainer.querySelectorAll((el) => el.tagName === 'BUTTON');
  assert.strictEqual(tabButtons.length, 5, 'Must contain exactly 5 primary tab buttons');

  const expectedTabs = [
    { label: 'Overview', full: 'Overview · DriveLedger Independent Platform' },
    { label: 'Cost Calculator', full: '5-Yr True Cost to Own' },
    { label: 'Maintenance', full: 'Powertrain Risk Matrix' },
    { label: 'OBD-II Lookup', full: 'OBD-II Workshop Estimator' },
    { label: 'Guides', full: 'Buyer Guides & Insights' },
  ];

  expectedTabs.forEach((tab, idx) => {
    const btn = tabButtons[idx];
    assert.ok(btn.textContent.includes(tab.label), `Tab ${idx} must contain label ${tab.label}`);
    assert.ok(btn.textContent.includes(tab.full), `Tab ${idx} must contain legacy text ${tab.full} in sr-only`);
  });
});

test('Challenger 1.2: Mobile quick tab click transitions active state and triggers callbacks', async () => {
  let currentTab = 'overview';
  const handleSelectTab = (t) => {
    currentTab = t;
  };

  function TestHarness() {
    const [tab, setTab] = React.useState('overview');
    return React.createElement(Navbar, {
      activeTab: tab,
      onSelectTab: (newTab) => {
        setTab(newTab);
        handleSelectTab(newTab);
      },
      selectedPresetId: 'vw-golf-20-tdi',
    });
  }

  const { rootContainer } = await renderWithProviders(React.createElement(TestHarness));
  await sleep(40);

  const quickTabs = findByTestId(rootContainer, 'navbar-mobile-quick-tabs');
  const buttons = quickTabs.querySelectorAll((el) => el.tagName === 'BUTTON');

  // Click 'Cost Calculator' (index 1)
  buttons[1].dispatchEvent({ type: 'click' });
  await sleep(30);
  assert.strictEqual(currentTab, 'tco', 'Clicking Cost Calculator must update tab to "tco"');

  // Click 'OBD-II Lookup' (index 3)
  buttons[3].dispatchEvent({ type: 'click' });
  await sleep(30);
  assert.strictEqual(currentTab, 'obd', 'Clicking OBD-II Lookup must update tab to "obd"');

  // Click 'Maintenance' (index 2)
  buttons[2].dispatchEvent({ type: 'click' });
  await sleep(30);
  assert.strictEqual(currentTab, 'risk', 'Clicking Maintenance must update tab to "risk"');

  // Click 'Guides' (index 4)
  buttons[4].dispatchEvent({ type: 'click' });
  await sleep(30);
  assert.strictEqual(currentTab, 'guides', 'Clicking Guides must update tab to "guides"');
});

test('Challenger 1.3: Rapid cycling stress test on mobile quick tabs (100 transitions)', async () => {
  let activeTab = 'overview';
  function TestHarness() {
    const [tab, setTab] = React.useState('overview');
    activeTab = tab;
    return React.createElement(Navbar, {
      activeTab: tab,
      onSelectTab: setTab,
      selectedPresetId: 'vw-golf-20-tdi',
    });
  }

  const { rootContainer } = await renderWithProviders(React.createElement(TestHarness));
  await sleep(40);

  const quickTabs = findByTestId(rootContainer, 'navbar-mobile-quick-tabs');
  const buttons = quickTabs.querySelectorAll((el) => el.tagName === 'BUTTON');
  const tabIds = ['overview', 'tco', 'risk', 'obd', 'guides'];

  // Stress test: 100 rapid clicks
  for (let i = 0; i < 100; i++) {
    const targetIdx = i % 5;
    buttons[targetIdx].dispatchEvent({ type: 'click' });
  }
  await sleep(50);

  // Last click was index 99 -> 99 % 5 = 4 ('guides')
  assert.strictEqual(activeTab, 'guides', 'After 100 rapid clicks, state must reliably equal final tab (guides)');
});

// =============================================================================
// CHALLENGER SUITE 2: Mobile Drawer - Toggle, Focus Trap, Escape & Navigation
// =============================================================================
test('Challenger 2.1: Mobile menu drawer open/close lifecycle, scroll locking & Escape key handler', async () => {
  const { rootContainer } = await renderWithProviders(
    React.createElement(Navbar, {
      activeTab: 'overview',
      onSelectTab: () => {},
      selectedPresetId: 'vw-golf-20-tdi',
    })
  );
  await sleep(40);

  const menuToggle = findByTestId(rootContainer, 'navbar-mobile-menu-toggle');
  assert.ok(menuToggle, 'Hamburger toggle button data-testid="navbar-mobile-menu-toggle" must exist');
  assert.notEqual(menuToggle.getAttribute('aria-expanded'), 'true', 'Initially drawer must be closed');
  assert.strictEqual(globalThis.document.body.style.overflow, '', 'Body overflow must not be locked initially');

  // Open drawer
  menuToggle.dispatchEvent({ type: 'click' });
  await sleep(30);

  assert.ok(menuToggle.hasAttribute('aria-expanded'), 'After click, aria-expanded must be set');
  assert.strictEqual(globalThis.document.body.style.overflow, 'hidden', 'Body overflow must be locked to "hidden" when drawer opens');

  const drawer = rootContainer.getElementById('mobile-nav-drawer');
  assert.ok(drawer, 'Drawer element #mobile-nav-drawer must be mounted');

  // Test Escape key press on window
  globalThis.window.dispatchEvent({ type: 'keydown', key: 'Escape' });
  await sleep(30);

  assert.strictEqual(rootContainer.getElementById('mobile-nav-drawer'), null, 'Escape key must close drawer');
  assert.strictEqual(globalThis.document.body.style.overflow, '', 'Body overflow lock must be released on close');
});

test('Challenger 2.2: Mobile drawer close button and backdrop click dismissal', async () => {
  const { rootContainer } = await renderWithProviders(
    React.createElement(Navbar, {
      activeTab: 'overview',
      onSelectTab: () => {},
      selectedPresetId: 'vw-golf-20-tdi',
    })
  );
  await sleep(40);

  const menuToggle = findByTestId(rootContainer, 'navbar-mobile-menu-toggle');

  // Test close button
  menuToggle.dispatchEvent({ type: 'click' });
  await sleep(30);
  const closeBtn = findByTestId(rootContainer, 'mobile-drawer-close');
  assert.ok(closeBtn, 'Close button data-testid="mobile-drawer-close" must be in drawer');
  closeBtn.dispatchEvent({ type: 'click' });
  await sleep(30);
  assert.strictEqual(rootContainer.getElementById('mobile-nav-drawer'), null, 'Clicking close button must unmount drawer');

  // Test backdrop click dismissal
  menuToggle.dispatchEvent({ type: 'click' });
  await sleep(30);
  const drawerBackdrop = rootContainer.getElementById('mobile-nav-drawer');
  assert.ok(drawerBackdrop, 'Drawer mounted');
  drawerBackdrop.dispatchEvent({ type: 'click', target: drawerBackdrop, currentTarget: drawerBackdrop });
  await sleep(30);
  assert.strictEqual(rootContainer.getElementById('mobile-nav-drawer'), null, 'Clicking backdrop must dismiss drawer');
});

test('Challenger 2.3: Mobile drawer active vehicle switcher & model filter search', async () => {
  let selectedPreset = 'vw-golf-20-tdi';
  const handleSelectPreset = (p) => {
    selectedPreset = p;
  };

  function TestHarness() {
    const [pId, setPId] = React.useState('vw-golf-20-tdi');
    return React.createElement(Navbar, {
      activeTab: 'overview',
      onSelectTab: () => {},
      selectedPresetId: pId,
      onSelectPreset: (newP) => {
        setPId(newP);
        handleSelectPreset(newP);
      },
    });
  }

  const { rootContainer } = await renderWithProviders(React.createElement(TestHarness));
  await sleep(40);

  // Open drawer
  const menuToggle = findByTestId(rootContainer, 'navbar-mobile-menu-toggle');
  menuToggle.dispatchEvent({ type: 'click' });
  await sleep(30);

  // Switch Car button in drawer
  const switchCarBtn = findButtonByText(rootContainer, 'Switch Car');
  assert.ok(switchCarBtn, 'Drawer must have "Switch Car" button');
  switchCarBtn.dispatchEvent({ type: 'click' });
  await sleep(30);

  // Input filter
  const filterInput = rootContainer.querySelectorAll(
    (el) => el.tagName === 'INPUT' && (el.getAttribute('placeholder') || '').includes('Filter models')
  )[0];
  assert.ok(filterInput, 'Filter models input must be visible when expanded');

  // Filter for 'Tesla'
  filterInput.dispatchEvent({ type: 'change', target: { value: 'Tesla' } });
  await sleep(30);

  const teslaBtn = findButtonByText(rootContainer, 'Tesla Model 3');
  assert.ok(teslaBtn, 'Tesla Model 3 button should be visible in filtered list');

  // Select Tesla
  teslaBtn.dispatchEvent({ type: 'click' });
  await sleep(30);

  assert.strictEqual(selectedPreset, 'tesla-model-3-lr', 'Selecting Tesla preset must update activePresetId');
  assert.strictEqual(rootContainer.getElementById('mobile-nav-drawer'), null, 'Selecting a vehicle must automatically close drawer');
});

test('Challenger 2.4: Mobile drawer region switcher & theme toggles execute correctly', async () => {
  const { rootContainer } = await renderWithProviders(
    React.createElement(Navbar, {
      activeTab: 'overview',
      onSelectTab: () => {},
      selectedPresetId: 'vw-golf-20-tdi',
    })
  );
  await sleep(40);

  // Open drawer
  const menuToggle = findByTestId(rootContainer, 'navbar-mobile-menu-toggle');
  menuToggle.dispatchEvent({ type: 'click' });
  await sleep(30);

  // Region buttons inside drawer
  const ukButton = findButtonByText(rootContainer, 'UK');
  const euButton = findButtonByText(rootContainer, 'EU');
  const usButton = findButtonByText(rootContainer, 'US');

  assert.ok(ukButton && euButton && usButton, 'US, UK, and EU region buttons must exist in drawer');

  ukButton.dispatchEvent({ type: 'click' });
  await sleep(20);
  assert.ok(ukButton.textContent.includes('UK'), 'UK region active');

  // Theme toggles
  const lightBtn = findButtonByText(rootContainer, 'Light');
  const darkBtn = findButtonByText(rootContainer, 'Dark');
  assert.ok(lightBtn && darkBtn, 'Light and Dark theme buttons must exist in drawer');

  darkBtn.dispatchEvent({ type: 'click' });
  await sleep(20);
  lightBtn.dispatchEvent({ type: 'click' });
  await sleep(20);
});

// =============================================================================
// CHALLENGER SUITE 3: Priority-Plus "More ▾" Dropdown Menu
// =============================================================================
test('Challenger 3.1: Desktop More dropdown toggle, outside click, and Escape dismiss', async () => {
  let activeTab = 'overview';
  const { rootContainer } = await renderWithProviders(
    React.createElement(Navbar, {
      activeTab,
      onSelectTab: (t) => {
        activeTab = t;
      },
      selectedPresetId: 'vw-golf-20-tdi',
    })
  );
  await sleep(40);

  const moreButton = findByTestId(rootContainer, 'navbar-more-button');
  assert.ok(moreButton, 'Priority plus button data-testid="navbar-more-button" must exist');
  assert.notEqual(moreButton.getAttribute('aria-expanded'), 'true', 'Initially More dropdown is closed');

  // Click to open
  moreButton.dispatchEvent({ type: 'click' });
  await sleep(30);
  assert.ok(moreButton.hasAttribute('aria-expanded'), 'More dropdown opened');

  const moreMenu = rootContainer.querySelectorAll((el) => el.getAttribute('role') === 'menu' && el.getAttribute('aria-label') === 'More pages and guides')[0];
  assert.ok(moreMenu, 'More menu role="menu" must exist');
  assert.ok(moreMenu.className.includes('opacity-100 visible'), 'Menu should be visible');

  // Verify secondary tabs in More menu
  const secondaryButtons = moreMenu.querySelectorAll((el) => el.getAttribute('role') === 'menuitem');
  assert.strictEqual(secondaryButtons.length, 7, 'More menu must contain all 7 secondary tabs');

  // Test Escape key dismissal
  globalThis.window.dispatchEvent({ type: 'keydown', key: 'Escape' });
  await sleep(30);
  assert.strictEqual(moreButton.hasAttribute('aria-expanded'), false, 'Escape key must close More dropdown');

  // Re-open and test outside click dismissal
  moreButton.dispatchEvent({ type: 'click' });
  await sleep(30);
  assert.ok(moreButton.hasAttribute('aria-expanded'), 'Re-opened');

  // Outside click on document (target outside #more-dropdown-container)
  const outsideElement = new MockElement('div');
  globalThis.document.dispatchEvent({ type: 'click', target: outsideElement });
  await sleep(30);
  assert.strictEqual(moreButton.hasAttribute('aria-expanded'), false, 'Outside click must close More dropdown');
});

test('Challenger 3.2: Selecting secondary item from More menu updates tab and displays secondary label on button', async () => {
  function TestHarness() {
    const [tab, setTab] = React.useState('overview');
    return React.createElement(Navbar, {
      activeTab: tab,
      onSelectTab: setTab,
      selectedPresetId: 'vw-golf-20-tdi',
    });
  }

  const { rootContainer } = await renderWithProviders(React.createElement(TestHarness));
  await sleep(40);

  const moreButton = findByTestId(rootContainer, 'navbar-more-button');
  assert.ok(moreButton.textContent.includes('More'), 'Button displays "More" when overview is active');

  // Open More menu
  moreButton.dispatchEvent({ type: 'click' });
  await sleep(30);

  // Click 'Compare' menuitem
  const compareItem = findButtonByText(rootContainer, 'Compare');
  assert.ok(compareItem, 'Compare item must be in More menu');
  compareItem.dispatchEvent({ type: 'click' });
  await sleep(30);

  // After selecting compare: More button should display 'Compare' and receive active styling
  assert.ok(moreButton.textContent.includes('Compare'), 'More button must now display active secondary tab label "Compare"');
  assert.ok(
    moreButton.className.includes('bg-[#183D22]') || moreButton.className.includes('emerald'),
    'More button must have active background styling when secondary tab is active'
  );
  assert.notEqual(moreButton.getAttribute('aria-expanded'), 'true', 'Selecting an item must close dropdown');
});

// =============================================================================
// CHALLENGER SUITE 4: Unified Garage & Compare Pill Button — Empty & Populated States
// =============================================================================
test('Challenger 4.1: Unified Garage & Compare pill button renders with counter badge in empty state', async () => {
  const { rootContainer } = await renderWithProviders(
    React.createElement(Navbar, {
      activeTab: 'overview',
      onSelectTab: () => {},
      selectedPresetId: 'vw-golf-20-tdi',
    })
  );
  await sleep(40);

  const garageBadge = findByTestId(rootContainer, 'garage-count-badge');
  assert.ok(garageBadge, 'Garage badge data-testid="garage-count-badge" must exist');
  assert.strictEqual(garageBadge.textContent.trim(), '0', 'Initial garage count badge must be 0');

  // Click Garage button to open popover
  const garageContainer = rootContainer.getElementById('garage-dropdown-container');
  const garageBtn = garageContainer.querySelector('button');
  garageBtn.dispatchEvent({ type: 'click' });
  await sleep(30);

  const garageMenu = rootContainer.querySelectorAll((el) => el.getAttribute('aria-label') === 'Garage and Vehicle Comparator')[0];
  assert.ok(garageMenu, 'Garage & Compare popover must open');

  // Empty state copy verification
  assert.ok(garageMenu.textContent.includes('No saved vehicles in your garage'), 'Must show "No saved vehicles in your garage"');
  assert.ok(garageMenu.textContent.includes('Save any vehicle from the calculators to bookmark and compare specs'), 'Must show bookmark prompt');

  // Compare CTA button
  const compareCta = findButtonByText(garageMenu, 'Open Side-by-Side Comparator');
  assert.ok(compareCta, 'Must offer "Open Side-by-Side Comparator" CTA even when garage is empty');
});

test('Challenger 4.2: Garage & Compare populated state with dynamic vehicle addition and removal', async () => {
  let activeTab = 'overview';
  const { rootContainer } = await renderWithProviders(
    React.createElement(Navbar, {
      activeTab,
      onSelectTab: (t) => {
        activeTab = t;
      },
      selectedPresetId: 'vw-golf-20-tdi',
    })
  );
  await sleep(40);

  // Open garage popover
  const garageContainer = rootContainer.getElementById('garage-dropdown-container');
  const garageBtn = garageContainer.querySelector('button');
  garageBtn.dispatchEvent({ type: 'click' });
  await sleep(30);

  // Click "+ Save Active" button
  const saveActiveBtn = findButtonByText(rootContainer, '+ Save Active');
  assert.ok(saveActiveBtn, 'Must have "+ Save Active" button when active preset is present');
  saveActiveBtn.dispatchEvent({ type: 'click' });
  await sleep(40);

  // Check count badge updated to 1
  const garageBadge = findByTestId(rootContainer, 'garage-count-badge');
  assert.strictEqual(garageBadge.textContent.trim(), '1', 'Badge must increment to 1 after saving active vehicle');

  // Popover should now list the vehicle
  assert.ok(rootContainer.textContent.includes('Volkswagen Golf'), 'Saved vehicle name must appear in garage list');
  assert.ok(rootContainer.textContent.includes('Active'), 'Active preset should display Active badge in garage list');

  // Remove vehicle
  const removeBtn = rootContainer.querySelectorAll((el) => (el.getAttribute('aria-label') || '').includes('Remove'))[0];
  assert.ok(removeBtn, 'Must have remove vehicle button');
  removeBtn.dispatchEvent({ type: 'click' });
  await sleep(40);

  // Badge updates back to 0
  assert.strictEqual(garageBadge.textContent.trim(), '0', 'Badge must return to 0 after removing vehicle');
  assert.ok(rootContainer.textContent.includes('No saved vehicles in your garage'), 'Empty state restores when last vehicle removed');
});

test('Challenger 4.3: Compare CTA navigates to compare tab and applies active pill styling', async () => {
  function TestHarness() {
    const [tab, setTab] = React.useState('overview');
    return React.createElement(Navbar, {
      activeTab: tab,
      onSelectTab: setTab,
      selectedPresetId: 'vw-golf-20-tdi',
    });
  }

  const { rootContainer } = await renderWithProviders(React.createElement(TestHarness));
  await sleep(40);

  const garageContainer = rootContainer.getElementById('garage-dropdown-container');
  const garageBtn = garageContainer.querySelector('button');
  garageBtn.dispatchEvent({ type: 'click' });
  await sleep(30);

  const compareCta = findButtonByText(rootContainer, 'Open Side-by-Side Comparator');
  compareCta.dispatchEvent({ type: 'click' });
  await sleep(30);

  // Check garage button has active style
  assert.ok(
    garageBtn.className.includes('bg-emerald-50') || garageBtn.className.includes('border-emerald-300'),
    'Garage & Compare pill button must reflect active styling when compare tab is selected'
  );
});

// =============================================================================
// CHALLENGER SUITE 5: Homepage Hero Search, Starter Pills & Relocated Body Styles
// =============================================================================
test('Challenger 5.1: Hero search autocomplete handles car models and OBD codes seamlessly', async () => {
  let navigatedTo = null;
  let selectedPreset = null;
  let navigatedObd = null;

  const { rootContainer } = await renderWithProviders(
    React.createElement(HeroVehicleFinder, {
      selectedPresetId: 'vw-golf-20-tdi',
      onSelectPreset: (p) => {
        selectedPreset = p;
      },
      onNavigateToTco: (p) => {
        navigatedTo = `tco:${p}`;
      },
      onNavigateToRisk: (p) => {
        navigatedTo = `risk:${p}`;
      },
      onNavigateToObd: (code) => {
        navigatedObd = code;
      },
    })
  );
  await sleep(40);

  const searchInput = rootContainer.querySelectorAll((el) => el.tagName === 'INPUT')[0];
  assert.ok(searchInput, 'Search input exists');

  // Test searching vehicle model: "Golf"
  searchInput.dispatchEvent({ type: 'change', target: { value: 'Golf' } });
  await sleep(30);

  const autocomplete = findByTestId(rootContainer, 'hero-search-autocomplete');
  assert.ok(autocomplete, 'Autocomplete dropdown data-testid="hero-search-autocomplete" must appear on typing');
  assert.ok(autocomplete.textContent.includes('Golf'), 'Autocomplete must show matching Golf vehicles');

  // Test searching OBD-II fault code: "P0420"
  searchInput.dispatchEvent({ type: 'change', target: { value: 'P0420' } });
  await sleep(30);

  assert.ok(autocomplete.textContent.includes('P0420'), 'Autocomplete must show P0420 fault code');
  assert.ok(autocomplete.textContent.includes('Catalyst System Efficiency'), 'Must show OBD description');

  // Click OBD code in autocomplete
  const obdBtn = findButtonByText(autocomplete, 'P0420');
  obdBtn.dispatchEvent({ type: 'click' });
  await sleep(30);

  assert.strictEqual(navigatedObd, 'P0420', 'Clicking OBD code must invoke onNavigateToObd("P0420")');
});

test('Challenger 5.2: 3 Starter pills below Hero search route to correct calculators with selected preset', async () => {
  let routeTarget = null;
  const { rootContainer } = await renderWithProviders(
    React.createElement(HeroVehicleFinder, {
      selectedPresetId: 'bmw-330i-g20',
      onSelectPreset: () => {},
      onNavigateToTco: (p) => {
        routeTarget = `tco:${p}`;
      },
      onNavigateToRisk: (p) => {
        routeTarget = `risk:${p}`;
      },
      onNavigateToObd: () => {
        routeTarget = 'obd';
      },
    })
  );
  await sleep(40);

  const pill1 = findButtonByText(rootContainer, 'Calculate 5-Yr Cost');
  const pill2 = findButtonByText(rootContainer, 'Check Maintenance Risks');
  const pill3 = findButtonByText(rootContainer, 'Look Up Fault Code');

  pill1.dispatchEvent({ type: 'click' });
  assert.strictEqual(routeTarget, 'tco:bmw-330i-g20', 'Pill 1 routes to TCO with active preset');

  pill2.dispatchEvent({ type: 'click' });
  assert.strictEqual(routeTarget, 'risk:bmw-330i-g20', 'Pill 2 routes to Risk with active preset');

  pill3.dispatchEvent({ type: 'click' });
  assert.strictEqual(routeTarget, 'obd', 'Pill 3 routes to OBD');
});

test('Challenger 5.3: Body-style filters are relocated to Browse Popular Vehicles section with responsive cards', async () => {
  const { rootContainer } = await renderWithProviders(
    React.createElement(HomePage, {
      selectedPresetId: 'vw-golf-20-tdi',
      onSelectPreset: () => {},
      onNavigateToTco: () => {},
      onNavigateToRisk: () => {},
      onNavigateToObd: () => {},
      onNavigateToCompare: () => {},
      onNavigateToChecklist: () => {},
    })
  );
  await sleep(60);

  const browseSection = rootContainer.getElementById('telemetry-preset-benchmarks-section');
  assert.ok(browseSection, 'Dedicated section #telemetry-preset-benchmarks-section must exist on HomePage');
  assert.ok(browseSection.textContent.includes('Browse Popular Vehicles'), 'Must display "Browse Popular Vehicles" heading');

  // Verify all 7 body styles exist as filter buttons
  const bodyStyles = [
    'All Body Styles',
    'Sedans',
    'SUVs & Crossovers',
    'Hatchbacks',
    'Wagons & Estates',
    'Trucks',
    'Coupes',
  ];

  bodyStyles.forEach((style) => {
    const btn = findButtonByText(browseSection, style);
    assert.ok(btn, `Body style filter "${style}" must exist in Browse section`);
  });

  // Click 'Hatchbacks' filter
  const hatchBtn = findButtonByText(browseSection, 'Hatchbacks');
  hatchBtn.dispatchEvent({ type: 'click' });
  await sleep(30);

  // Cards should now be filtered
  assert.ok(browseSection.textContent.includes('Volkswagen Golf'), 'Hatchbacks view includes Golf');
});

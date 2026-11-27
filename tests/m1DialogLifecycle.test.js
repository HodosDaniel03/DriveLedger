/**
 * M1 <dialog> Lifecycle Regression Suite
 *
 * Verifies with real React 18 + StrictMode that all 5 M1 <dialog> components:
 * - OdometerPrimitives.jsx (Drawer / BottomSheet)
 * - CommunityInvoiceModal.jsx
 * - LegalModal.jsx
 * - ForumShareModal.jsx
 * - VehicleDossierExport.jsx
 *
 * do NOT leak `programmaticCloseCountRef` when <dialog> is detached from the DOM
 * (`!dialogEl.isConnected`) during `useEffect` cleanup after backdrop or Close-button
 * dismissal, ensuring 2nd-open `Esc` (`closedby="any"`) and 3rd-open always succeed.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transpileJsx } from '../scripts/jsx-loader.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// ============================================================================
// Realistic DOM Mock with isConnected, HTMLDialogElement, & Capture/Bubble Dispatch
// ============================================================================

class MockTextNode {
  constructor(text) {
    this.nodeType = 3;
    this.nodeValue = String(text);
    this.parentNode = null;
  }
  get ownerDocument() {
    return mockDoc;
  }
  get textContent() {
    return this.nodeValue;
  }
  set textContent(v) {
    this.nodeValue = String(v);
  }
  get ownerDocument() {
    return mockDoc;
  }
  get isConnected() {
    let cur = this.parentNode;
    while (cur) {
      if (cur === mockDoc.documentElement) return true;
      cur = cur.parentNode;
    }
    return false;
  }
}

class MockDocumentFragment {
  constructor() {
    this.nodeType = 11;
    this.childNodes = [];
    this.parentNode = null;
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
  get firstChild() {
    return this.childNodes[0] || null;
  }
  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] || null;
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
    this._listeners = new Map(); // evt -> [{ fn, capture }]
    this.style = {};
    this.checked = false;
    this._value = '';
    this._rect = { left: 100, top: 100, right: 500, bottom: 500, width: 400, height: 400 };
    this.classList = {
      _set: new Set(),
      add: (...tokens) => tokens.forEach((t) => this.classList._set.add(t)),
      remove: (...tokens) => tokens.forEach((t) => this.classList._set.delete(t)),
      contains: (t) => this.classList._set.has(t),
    };
  }

  get ownerDocument() {
    return mockDoc;
  }
  get isConnected() {
    let cur = this;
    while (cur) {
      if (cur === mockDoc.documentElement) return true;
      cur = cur.parentNode;
    }
    return false;
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
  get options() {
    return this.querySelectorAll((el) => el.tagName === 'OPTION');
  }
  get selectedOptions() {
    return this.options.filter((opt) => opt.selected);
  }
  get selected() {
    return Boolean(this._selected);
  }
  set selected(v) {
    this._selected = Boolean(v);
  }
  get ownerDocument() {
    return mockDoc;
  }
  get textContent() {
    return this.childNodes.map((c) => c.textContent || '').join('');
  }
  set textContent(v) {
    for (const c of this.childNodes) c.parentNode = null;
    this.childNodes = [];
    if (v !== '' && v !== null && v !== undefined) {
      this.appendChild(new MockTextNode(v));
    }
  }
  get firstChild() {
    return this.childNodes[0] || null;
  }
  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] || null;
  }
  get nextSibling() {
    if (!this.parentNode) return null;
    const idx = this.parentNode.childNodes.indexOf(this);
    return idx !== -1 ? this.parentNode.childNodes[idx + 1] || null : null;
  }
  get previousSibling() {
    if (!this.parentNode) return null;
    const idx = this.parentNode.childNodes.indexOf(this);
    return idx > 0 ? this.parentNode.childNodes[idx - 1] || null : null;
  }

  setAttribute(name, value) {
    this._attrs.set(name, String(value));
    if (name === 'value') this._value = String(value);
  }
  getAttribute(name) {
    return this._attrs.has(name) ? this._attrs.get(name) : null;
  }
  hasAttribute(name) {
    return this._attrs.has(name);
  }
  removeAttribute(name) {
    this._attrs.delete(name);
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
  insertBefore(newNode, refNode) {
    if (!refNode) return this.appendChild(newNode);
    if (newNode.nodeType === 11) {
      const items = [...newNode.childNodes];
      newNode.childNodes = [];
      for (const item of items) this.insertBefore(item, refNode);
      return newNode;
    }
    const idx = this.childNodes.indexOf(refNode);
    if (idx === -1) return this.appendChild(newNode);
    if (newNode.parentNode) newNode.parentNode.removeChild(newNode);
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

  getBoundingClientRect() {
    return this._rect;
  }

  addEventListener(evt, fn, options) {
    const capture = typeof options === 'boolean' ? options : Boolean(options?.capture);
    if (!this._listeners.has(evt)) this._listeners.set(evt, []);
    this._listeners.get(evt).push({ fn, capture });
  }
  removeEventListener(evt, fn, options) {
    const list = this._listeners.get(evt);
    if (!list) return;
    const capture = typeof options === 'boolean' ? options : Boolean(options?.capture);
    const idx = list.findIndex((entry) => entry.fn === fn && entry.capture === capture);
    if (idx !== -1) list.splice(idx, 1);
  }
  dispatchEvent(eventObj) {
    const path = [];
    let cur = this;
    while (cur) {
      path.unshift(cur);
      cur = cur.parentNode;
    }
    const bubbles = eventObj.bubbles !== undefined ? Boolean(eventObj.bubbles) : true;
    const e = {
      type: eventObj.type,
      target: this,
      currentTarget: this,
      bubbles,
      cancelable: Boolean(eventObj.cancelable),
      defaultPrevented: false,
      propagationStopped: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.propagationStopped = true;
      },
      ...eventObj,
      target: eventObj.target || this,
    };

    // Capture phase (ancestors -> target)
    for (const node of path) {
      if (e.propagationStopped) break;
      e.currentTarget = node;
      const list = node._listeners?.get(e.type) || [];
      for (const entry of [...list]) {
        if (entry.capture || node === this) {
          if (node === this && !entry.capture) continue;
          entry.fn.call(node, e);
        }
      }
    }
    // Target phase (non-capture)
    if (!e.propagationStopped) {
      e.currentTarget = this;
      const targetList = this._listeners?.get(e.type) || [];
      for (const entry of [...targetList]) {
        if (!entry.capture) entry.fn.call(this, e);
      }
    }
    // Bubble phase (parent -> root)
    if (bubbles && !e.propagationStopped) {
      for (let i = path.length - 2; i >= 0; i -= 1) {
        if (e.propagationStopped) break;
        const node = path[i];
        e.currentTarget = node;
        const list = node._listeners?.get(e.type) || [];
        for (const entry of [...list]) {
          if (!entry.capture) entry.fn.call(node, e);
        }
      }
    }
    return !e.defaultPrevented;
  }

  focus() {
    mockDoc.activeElement = this;
  }
  blur() {}
  scrollIntoView() {}

  querySelectorAll(predicate) {
    const results = [];
    const visit = (node) => {
      if (node.nodeType === 1) {
        if (predicate(node)) results.push(node);
        for (const c of node.childNodes) visit(c);
      }
    };
    for (const c of this.childNodes) visit(c);
    return results;
  }
  querySelector(predicate) {
    return this.querySelectorAll(predicate)[0] || null;
  }
}

class MockHTMLDialogElement extends MockElement {
  constructor() {
    super('dialog');
    this.open = false;
    this.returnValue = '';
    this._rect = { left: 0, top: 0, right: 1440, bottom: 900, width: 1440, height: 900 };
  }
  get closedBy() {
    return this.getAttribute('closedby') || 'auto';
  }
  set closedBy(v) {
    this.setAttribute('closedby', v);
  }
  showModal() {
    this.open = true;
    this.setAttribute('open', '');
  }
  close(returnVal = '') {
    if (!this.open) return;
    this.open = false;
    this.removeAttribute('open');
    this.returnValue = String(returnVal);
    // In real browsers + React 18 delegated event system, `close` is non-bubbling and
    // captured at rootContainer. When the <dialog> is detached (!isConnected), the
    // queued `close` event never reaches React's delegated root listener.
    queueMicrotask(() => {
      this.dispatchEvent({ type: 'close', bubbles: false });
    });
  }
}

class MockDocument {
  constructor() {
    this.nodeType = 9;
    this.documentElement = new MockElement('html');
    this.body = new MockElement('body');
    this.head = new MockElement('head');
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
    this.activeElement = this.body;
  }
  createElement(tag) {
    if (String(tag).toLowerCase() === 'dialog') {
      return new MockHTMLDialogElement();
    }
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
    return this.body.querySelector((el) => el.id === id);
  }
  addEventListener() {}
  removeEventListener() {}
}

const mockDoc = new MockDocument();
const rootContainer = mockDoc.createElement('div');
rootContainer.id = 'root';
mockDoc.body.appendChild(rootContainer);

globalThis.document = mockDoc;
globalThis.Element = MockElement;
globalThis.HTMLElement = MockElement;
globalThis.HTMLDialogElement = MockHTMLDialogElement;
globalThis.HTMLIFrameElement = class MockHTMLIFrameElement {};
globalThis.Node = MockElement;
globalThis.window = {
  document: mockDoc,
  Element: MockElement,
  HTMLElement: MockElement,
  HTMLDialogElement: MockHTMLDialogElement,
  HTMLIFrameElement: globalThis.HTMLIFrameElement,
  Node: MockElement,
  location: { pathname: '/', search: '', hash: '', href: 'http://localhost:5173/' },
  history: { pushState() {}, replaceState() {} },
  addEventListener() {},
  removeEventListener() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  scrollTo() {},
  print() {},
};
mockDoc.defaultView = globalThis.window;
globalThis.localStorage = {
  _map: new Map(),
  getItem: (k) => (globalThis.localStorage._map.has(k) ? globalThis.localStorage._map.get(k) : null),
  setItem: (k, v) => globalThis.localStorage._map.set(k, String(v)),
  removeItem: (k) => globalThis.localStorage._map.delete(k),
  clear: () => globalThis.localStorage._map.clear(),
};

registerHooks({
  resolve(specifier, context, nextResolve) {
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
const { useState, StrictMode } = await import('react');
const { createRoot } = await import('react-dom/client');
const { UnitProvider } = await import('../src/context/UnitContext.jsx');
const { Drawer, BottomSheet } = await import('../src/components/common/OdometerPrimitives.jsx');
const { default: CommunityInvoiceModal } = await import('../src/components/home/CommunityInvoiceModal.jsx');
const { default: LegalModal } = await import('../src/components/legal/LegalModal.jsx');
const { default: ForumShareModal } = await import('../src/components/common/ForumShareModal.jsx');
const { default: VehicleDossierExport } = await import('../src/components/common/VehicleDossierExport.jsx');

const flush = (ms = 25) => new Promise((r) => setTimeout(r, ms));

let activeRoot = null;
async function renderWithStrictMode(element) {
  if (activeRoot) {
    activeRoot.unmount();
    await flush(15);
  }
  rootContainer.childNodes = [];
  activeRoot = createRoot(rootContainer);
  activeRoot.render(
    React.createElement(
      StrictMode,
      null,
      React.createElement(UnitProvider, null, element)
    )
  );
  await flush(30);
}

function getDialogEl() {
  return rootContainer.querySelector((el) => el.tagName === 'DIALOG');
}

function getOpenButton() {
  return rootContainer.querySelector(
    (el) => el.tagName === 'BUTTON' && el.getAttribute('data-testid') === 'open-trigger'
  );
}

function clickElement(el) {
  assert.ok(el, 'Expected clickable element to exist');
  el.dispatchEvent({ type: 'click', bubbles: true });
}

function backdropDismiss(dialogEl) {
  assert.ok(dialogEl, 'Expected <dialog> element to exist for backdrop dismiss');
  // Panel rect in MockElement defaults to { left: 100, top: 100, right: 500, bottom: 500 },
  // so (10, 10) is strictly outside the panel rect while target === dialogEl.
  dialogEl.dispatchEvent({ type: 'pointerdown', clientX: 10, clientY: 10, bubbles: true });
  dialogEl.dispatchEvent({ type: 'pointerup', clientX: 10, clientY: 10, bubbles: true });
}

function pressEscOnDialog(dialogEl) {
  assert.ok(dialogEl, 'Expected <dialog> element to exist for Esc dismiss');
  // Native closedby="any" closes <dialog> and fires `close` event
  dialogEl.close('');
}

async function verifyMultiCycleLifecycle(label, HarnessComponent, closeBtnLabelMatcher) {
  await renderWithStrictMode(React.createElement(HarnessComponent));

  // --- Cycle A: 1st open -> backdrop dismiss -> 2nd open -> Esc -> 3rd open ---
  clickElement(getOpenButton());
  await flush(25);
  let dlg = getDialogEl();
  assert.ok(dlg && dlg.isConnected && dlg.open, `${label} [Backdrop flow] 1st open must mount open <dialog>`);

  backdropDismiss(dlg);
  await flush(25);
  assert.equal(getDialogEl(), null, `${label} [Backdrop flow] backdrop dismiss must unmount <dialog>`);

  // 2nd open
  clickElement(getOpenButton());
  await flush(25);
  dlg = getDialogEl();
  assert.ok(dlg && dlg.isConnected && dlg.open, `${label} [Backdrop flow] 2nd open must mount open <dialog>`);

  // Esc on 2nd open MUST NOT be swallowed by leaked programmaticCloseCountRef
  pressEscOnDialog(dlg);
  await flush(25);
  assert.equal(
    getDialogEl(),
    null,
    `${label} [Backdrop flow] 2nd-open Esc must close & unmount <dialog> (must not wedge)`
  );

  // 3rd open MUST succeed
  clickElement(getOpenButton());
  await flush(25);
  dlg = getDialogEl();
  assert.ok(dlg && dlg.isConnected && dlg.open, `${label} [Backdrop flow] 3rd open must succeed`);

  // --- Cycle B: Close-button dismiss -> next open -> Esc -> final open ---
  const closeBtn = dlg.querySelector(
    (el) =>
      el.tagName === 'BUTTON' &&
      closeBtnLabelMatcher(el.getAttribute('aria-label') || el.textContent || '')
  );
  assert.ok(closeBtn, `${label} must have a visible Close button`);
  clickElement(closeBtn);
  await flush(25);
  assert.equal(getDialogEl(), null, `${label} [Close-btn flow] Close button must unmount <dialog>`);

  // Re-open after Close button
  clickElement(getOpenButton());
  await flush(25);
  dlg = getDialogEl();
  assert.ok(dlg && dlg.isConnected && dlg.open, `${label} [Close-btn flow] re-open must mount open <dialog>`);

  // Esc after Close button dismissal MUST NOT be swallowed
  pressEscOnDialog(dlg);
  await flush(25);
  assert.equal(
    getDialogEl(),
    null,
    `${label} [Close-btn flow] Esc after Close-button dismissal must close & unmount <dialog>`
  );

  // Re-open again to prove zero permanent wedge
  clickElement(getOpenButton());
  await flush(25);
  dlg = getDialogEl();
  assert.ok(dlg && dlg.isConnected && dlg.open, `${label} [Close-btn flow] 3rd open must succeed`);
}

test('M1-DIALOG-LIFECYCLE-1: OdometerPrimitives BottomSheet (!keepMounted) survives backdrop/button -> re-open -> Esc -> 3rd open under StrictMode', async () => {
  function BottomSheetHarness() {
    const [open, setOpen] = useState(false);
    return React.createElement(
      'div',
      null,
      React.createElement('button', { type: 'button', 'data-testid': 'open-trigger', onClick: () => setOpen(true) }, 'Open'),
      React.createElement(
        BottomSheet,
        { open, onClose: () => setOpen(false), title: 'Risk Breakdown' },
        React.createElement('p', null, 'BottomSheet content')
      )
    );
  }
  await verifyMultiCycleLifecycle('BottomSheet', BottomSheetHarness, (s) => s === 'Close panel');
});

test('M1-DIALOG-LIFECYCLE-2: OdometerPrimitives Drawer (keepMounted=true) survives backdrop/button -> re-open -> Esc -> 3rd open under StrictMode', async () => {
  function KeepMountedDrawerHarness() {
    const [open, setOpen] = useState(false);
    return React.createElement(
      'div',
      null,
      React.createElement('button', { type: 'button', 'data-testid': 'open-trigger', onClick: () => setOpen(true) }, 'Open'),
      React.createElement(
        Drawer,
        { open, keepMounted: true, onClose: () => setOpen(false), title: 'Assumptions Drawer' },
        React.createElement('p', null, 'Drawer content')
      )
    );
  }

  await renderWithStrictMode(React.createElement(KeepMountedDrawerHarness));
  clickElement(getOpenButton());
  await flush(25);
  let dlg = getDialogEl();
  assert.ok(dlg && dlg.open, 'keepMounted Drawer 1st open must set open=true');

  backdropDismiss(dlg);
  await flush(25);
  assert.equal(dlg.open, false, 'keepMounted Drawer backdrop dismiss must set open=false');

  clickElement(getOpenButton());
  await flush(25);
  assert.equal(dlg.open, true, 'keepMounted Drawer 2nd open must set open=true');

  pressEscOnDialog(dlg);
  await flush(25);
  assert.equal(dlg.open, false, 'keepMounted Drawer 2nd-open Esc must set open=false');

  clickElement(getOpenButton());
  await flush(25);
  assert.equal(dlg.open, true, 'keepMounted Drawer 3rd open must set open=true');
});

test('M1-DIALOG-LIFECYCLE-3: CommunityInvoiceModal survives backdrop/button -> re-open -> Esc -> 3rd open under StrictMode', async () => {
  function InvoiceHarness() {
    const [isOpen, setIsOpen] = useState(false);
    return React.createElement(
      'div',
      null,
      React.createElement('button', { type: 'button', 'data-testid': 'open-trigger', onClick: () => setIsOpen(true) }, 'Open'),
      React.createElement(CommunityInvoiceModal, { isOpen, onClose: () => setIsOpen(false) })
    );
  }
  await verifyMultiCycleLifecycle('CommunityInvoiceModal', InvoiceHarness, (s) => s === 'Close modal' || s.trim() === 'Close');
});

test('M1-DIALOG-LIFECYCLE-4: LegalModal survives backdrop/button -> re-open -> Esc -> 3rd open & policy tab switch under StrictMode', async () => {
  function LegalHarness() {
    const [policy, setPolicy] = useState(null);
    return React.createElement(
      'div',
      null,
      React.createElement('button', { type: 'button', 'data-testid': 'open-trigger', onClick: () => setPolicy('terms') }, 'Open'),
      React.createElement(LegalModal, {
        activePolicy: policy,
        onSelectPolicy: (next) => setPolicy(next),
        onClose: () => setPolicy(null),
      })
    );
  }
  await verifyMultiCycleLifecycle('LegalModal', LegalHarness, (s) => s === 'Close modal' || s.trim() === 'Close');

  // Verify switching policy tab while open keeps <dialog> open without triggering onClose
  const privacyLink = rootContainer.querySelector(
    (el) => el.tagName === 'A' && el.getAttribute('href') === '/privacy'
  );
  assert.ok(privacyLink, 'LegalModal must render /privacy switcher link');
  clickElement(privacyLink);
  await flush(25);
  const dlg = getDialogEl();
  assert.ok(dlg && dlg.isConnected && dlg.open, 'LegalModal must stay open after switching to /privacy');
});

test('M1-DIALOG-LIFECYCLE-5: ForumShareModal survives backdrop/button -> re-open -> Esc -> 3rd open under StrictMode', async () => {
  function ShareHarness() {
    const [isOpen, setIsOpen] = useState(false);
    return React.createElement(
      'div',
      null,
      React.createElement('button', { type: 'button', 'data-testid': 'open-trigger', onClick: () => setIsOpen(true) }, 'Open'),
      React.createElement(ForumShareModal, { isOpen, onClose: () => setIsOpen(false) })
    );
  }
  await verifyMultiCycleLifecycle('ForumShareModal', ShareHarness, (s) => s === 'Close share modal' || s.trim() === 'Done');
});

test('M1-DIALOG-LIFECYCLE-6: VehicleDossierExport survives backdrop/button -> re-open -> Esc -> 3rd open under StrictMode', async () => {
  function DossierHarness() {
    const [isOpen, setIsOpen] = useState(false);
    return React.createElement(
      'div',
      null,
      React.createElement('button', { type: 'button', 'data-testid': 'open-trigger', onClick: () => setIsOpen(true) }, 'Open'),
      isOpen ? React.createElement(VehicleDossierExport, { onClose: () => setIsOpen(false) }) : null
    );
  }
  await verifyMultiCycleLifecycle('VehicleDossierExport', DossierHarness, (s) => s === 'Close dossier');
});

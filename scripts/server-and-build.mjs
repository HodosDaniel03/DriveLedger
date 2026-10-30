import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transpileJsx } from './jsx-loader.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 5173;

// Self-contained browser React 18-compatible reactive runtime (zero external network dependency required)
export const VENDOR_REACT_JS = `
let rootRenderFn = null;
let componentInstances = new Map();
let visitedInstances = new Set();
let activeInstanceStack = [];
let pendingEffects = [];
let contextMap = new Map();
let isRendering = false;
let batchDepth = 0;
let rerenderScheduled = false;

function scheduleRerender() {
  if (!rootRenderFn) return;
  if (isRendering || batchDepth > 0) {
    rerenderScheduled = true;
    return;
  }
  rootRenderFn();
}

function getCurrentInstance() {
  if (activeInstanceStack.length === 0) {
    let fallback = componentInstances.get('__root__');
    if (!fallback) {
      fallback = { state: [], effects: [], memos: [], stateCursor: 0, effectCursor: 0, memoCursor: 0 };
      componentInstances.set('__root__', fallback);
    }
    return fallback;
  }
  return activeInstanceStack[activeInstanceStack.length - 1].inst;
}

export const React = {
  Fragment: Symbol.for('react.fragment'),
  StrictMode: Symbol.for('react.strict_mode'),
  createElement(type, props, ...children) {
    return {
      type,
      props: props || {},
      children: children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false && c !== true),
    };
  },
  createContext(defaultValue) {
    const ctx = {
      defaultValue,
      Provider({ value, children }) {
        contextMap.set(ctx, value);
        return {
          type: React.Fragment,
          props: {},
          children: Array.isArray(children) ? children : [children],
        };
      },
    };
    return ctx;
  },
  useContext(ctx) {
    return contextMap.has(ctx) ? contextMap.get(ctx) : ctx.defaultValue;
  },
  useState(initialValue) {
    const inst = getCurrentInstance();
    const idx = inst.stateCursor++;
    if (!inst.state[idx] || !inst.state[idx].initialized) {
      const initVal = typeof initialValue === 'function' ? initialValue() : initialValue;
      inst.state[idx] = { initialized: true, value: initVal };
    }
    const slot = inst.state[idx];
    const setState = (updater) => {
      const nextVal = typeof updater === 'function' ? updater(slot.value) : updater;
      if (!Object.is(nextVal, slot.value)) {
        slot.value = nextVal;
        scheduleRerender();
      }
    };
    return [slot.value, setState];
  },
  useEffect(cb, deps) {
    const inst = getCurrentInstance();
    const idx = inst.effectCursor++;
    const prev = inst.effects[idx];
    const hasChanged =
      !prev ||
      !deps ||
      !prev.deps ||
      deps.length !== prev.deps.length ||
      deps.some((d, i) => !Object.is(d, prev.deps[i]));
    if (hasChanged) {
      const prevCleanup = prev?.cleanup || null;
      const effectRecord = { deps, cleanup: prevCleanup };
      inst.effects[idx] = effectRecord;
      pendingEffects.push(() => {
        if (typeof effectRecord.cleanup === 'function') {
          try { effectRecord.cleanup(); } catch (e) { console.error(e); }
        }
        try {
          const nextCleanup = cb();
          effectRecord.cleanup = typeof nextCleanup === 'function' ? nextCleanup : null;
        } catch (e) {
          console.error(e);
        }
      });
    }
  },
  useMemo(fn, deps) {
    const inst = getCurrentInstance();
    const idx = inst.memoCursor++;
    const prev = inst.memos[idx];
    const hasChanged =
      !prev ||
      !deps ||
      !prev.deps ||
      deps.length !== prev.deps.length ||
      deps.some((d, i) => !Object.is(d, prev.deps[i]));
    if (hasChanged) {
      const value = fn();
      inst.memos[idx] = { deps, value };
      return value;
    }
    return prev.value;
  },
  useCallback(fn, deps) {
    return React.useMemo(() => fn, deps);
  },
  useId() {
    const inst = getCurrentInstance();
    const idx = (inst.idCursor = (inst.idCursor || 0) + 1);
    return ':r' + idx + ':';
  },
  __batch(fn) {
    batchDepth++;
    try {
      return fn();
    } finally {
      batchDepth--;
      if (batchDepth === 0 && !isRendering && rerenderScheduled && rootRenderFn) {
        rerenderScheduled = false;
        rootRenderFn();
      }
    }
  },
  __beginRender() {
    isRendering = true;
    rerenderScheduled = false;
    visitedInstances.clear();
    activeInstanceStack.length = 0;
  },
  __enterComponent(compKey) {
    let inst = componentInstances.get(compKey);
    if (!inst) {
      inst = { state: [], effects: [], memos: [], stateCursor: 0, effectCursor: 0, memoCursor: 0 };
      componentInstances.set(compKey, inst);
    } else {
      inst.stateCursor = 0;
      inst.effectCursor = 0;
      inst.memoCursor = 0;
    }
    visitedInstances.add(compKey);
    activeInstanceStack.push({ compKey, inst });
  },
  __exitComponent() {
    activeInstanceStack.pop();
  },
  __finishRender() {
    for (const [key, inst] of componentInstances.entries()) {
      if (key !== '__root__' && !visitedInstances.has(key)) {
        for (const eff of inst.effects || []) {
          if (typeof eff?.cleanup === 'function') {
            try { eff.cleanup(); } catch (e) { console.error(e); }
          }
        }
        componentInstances.delete(key);
      }
    }
    isRendering = false;
    while (pendingEffects.length > 0) {
      const toRun = pendingEffects.splice(0, pendingEffects.length);
      batchDepth++;
      try {
        for (const runEff of toRun) {
          runEff();
        }
      } finally {
        batchDepth--;
      }
      if (rerenderScheduled && rootRenderFn) {
        rerenderScheduled = false;
        rootRenderFn();
        return;
      }
    }
    if (rerenderScheduled && rootRenderFn) {
      rerenderScheduled = false;
      rootRenderFn();
    }
  },
};

export default React;
export const {
  Fragment,
  StrictMode,
  createElement,
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useId,
} = React;

export function __setRootRender(fn) {
  rootRenderFn = fn;
}
`;

export const VENDOR_REACT_DOM_CLIENT_JS = `
import React, { __setRootRender } from 'react';

const SVG_TAGS = new Set(['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g', 'text', 'defs', 'linearGradient', 'stop']);

function bindDelegatedEvents(el, listeners) {
  el.__listeners = listeners || {};
  if (!el.__boundEvents) {
    el.__boundEvents = new Set();
  }
  for (const evt of Object.keys(el.__listeners)) {
    if (!el.__boundEvents.has(evt)) {
      el.__boundEvents.add(evt);
      el.addEventListener(evt, (e) => {
        const fn = el.__listeners?.[evt];
        if (typeof fn === 'function') {
          React.__batch(() => fn(e));
        }
      });
    }
  }
}

function createDomFromVNode(vnode, isSvg = false, pathPrefix = '0') {
  if (vnode === null || vnode === undefined || typeof vnode === 'boolean') {
    return document.createTextNode('');
  }
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return document.createTextNode(String(vnode));
  }
  if (Array.isArray(vnode)) {
    const frag = document.createDocumentFragment();
    vnode.forEach((child, idx) => {
      const childKey = child?.props?.key !== undefined ? child.props.key : idx;
      frag.appendChild(createDomFromVNode(child, isSvg, pathPrefix + '.' + childKey));
    });
    return frag;
  }
  if (vnode.type === React.Fragment || vnode.type === React.StrictMode) {
    const frag = document.createDocumentFragment();
    (vnode.children || []).forEach((child, idx) => {
      const childKey = child?.props?.key !== undefined ? child.props.key : idx;
      frag.appendChild(createDomFromVNode(child, isSvg, pathPrefix + '.' + childKey));
    });
    return frag;
  }
  if (typeof vnode.type === 'function') {
    const compName = vnode.type.displayName || vnode.type.name || 'Component';
    const compKey = pathPrefix + '/' + compName;
    React.__enterComponent(compKey);
    let rendered;
    try {
      rendered = vnode.type({ ...vnode.props, children: vnode.children });
    } finally {
      React.__exitComponent();
    }
    return createDomFromVNode(rendered, isSvg, compKey);
  }

  const tag = String(vnode.type);
  const nextSvg = isSvg || SVG_TAGS.has(tag);
  const el = nextSvg
    ? document.createElementNS('http://www.w3.org/2000/svg', tag)
    : document.createElement(tag);

  const props = vnode.props || {};
  const listeners = {};

  for (const [k, v] of Object.entries(props)) {
    if (k === 'children' || k === 'key' || v === undefined || v === null || v === false) continue;
    if (k === 'className') {
      if (nextSvg) el.setAttribute('class', v);
      else el.className = v;
    } else if (k === 'htmlFor') {
      el.setAttribute('for', v);
    } else if (k === 'style' && typeof v === 'object') {
      Object.assign(el.style, v);
    } else if (k === 'dangerouslySetInnerHTML' && v && v.__html) {
      el.innerHTML = v.__html;
      el.__hasDangerouslySetInnerHTML = true;
    } else if (k.startsWith('on') && typeof v === 'function') {
      const evt = k.slice(2).toLowerCase();
      const domEvent = evt === 'change' && (tag === 'input' || tag === 'select') ? 'input' : evt;
      listeners[domEvent] = v;
      if (domEvent === 'input') {
        listeners['change'] = v;
      }
    } else if (k === 'checked') {
      el.checked = Boolean(v);
    } else if (k === 'value') {
      el.value = String(v);
      el.setAttribute('value', String(v));
    } else {
      el.setAttribute(k, v === true ? '' : String(v));
    }
  }

  bindDelegatedEvents(el, listeners);

  if (!props.dangerouslySetInnerHTML) {
    (vnode.children || []).forEach((child, idx) => {
      const childKey = child?.props?.key !== undefined ? child.props.key : idx;
      el.appendChild(createDomFromVNode(child, nextSvg, pathPrefix + '.' + childKey));
    });
  }

  if (tag === 'select' && props.value !== undefined) {
    el.value = String(props.value);
  }

  return el;
}

function patchDomNode(liveParent, liveNode, nextNode) {
  if (liveNode.nodeType !== nextNode.nodeType) {
    liveParent.replaceChild(nextNode, liveNode);
    return;
  }
  if (liveNode.nodeType === 3) {
    if (liveNode.nodeValue !== nextNode.nodeValue) {
      liveNode.nodeValue = nextNode.nodeValue;
    }
    return;
  }
  if (liveNode.nodeType === 1) {
    if (
      liveNode.tagName !== nextNode.tagName ||
      liveNode.namespaceURI !== nextNode.namespaceURI ||
      (liveNode.tagName === 'INPUT' && liveNode.getAttribute('type') !== nextNode.getAttribute('type'))
    ) {
      liveParent.replaceChild(nextNode, liveNode);
      return;
    }

    // Sync attributes in-place without destroying the DOM element
    const liveAttrs = Array.from(liveNode.attributes || []);
    for (const attr of liveAttrs) {
      if (!nextNode.hasAttribute(attr.name)) {
        liveNode.removeAttribute(attr.name);
      }
    }
    const nextAttrs = Array.from(nextNode.attributes || []);
    for (const attr of nextAttrs) {
      if (liveNode.getAttribute(attr.name) !== attr.value) {
        liveNode.setAttribute(attr.name, attr.value);
      }
    }

    // Update delegated event handlers in-place
    bindDelegatedEvents(liveNode, nextNode.__listeners);

    // Sync form control properties without interrupting active pointer drag or typing
    if (liveNode.tagName === 'INPUT') {
      if (liveNode.type === 'checkbox' || liveNode.type === 'radio') {
        if (liveNode.checked !== nextNode.checked) {
          liveNode.checked = nextNode.checked;
        }
      } else {
        const isFocusedNumber =
          typeof document !== 'undefined' &&
          document.activeElement === liveNode &&
          liveNode.type === 'number';
        if (isFocusedNumber) {
          if (liveNode.value !== '' && Number(liveNode.value) !== Number(nextNode.value)) {
            liveNode.value = nextNode.value;
          }
        } else if (liveNode.value !== nextNode.value) {
          liveNode.value = nextNode.value;
        }
      }
    }

    if (nextNode.__hasDangerouslySetInnerHTML) {
      if (liveNode.innerHTML !== nextNode.innerHTML) {
        liveNode.innerHTML = nextNode.innerHTML;
      }
    } else {
      patchDomChildren(liveNode, nextNode);
    }

    if (liveNode.tagName === 'SELECT') {
      const targetSelectVal = nextNode.getAttribute('value') ?? nextNode.value;
      if (targetSelectVal !== null && targetSelectVal !== undefined && liveNode.value !== targetSelectVal) {
        liveNode.value = targetSelectVal;
      }
    }
  }
}

function patchDomChildren(liveParent, nextContainer) {
  const nextChildren = Array.from(nextContainer.childNodes || []);
  while (liveParent.childNodes.length > nextChildren.length) {
    liveParent.removeChild(liveParent.lastChild);
  }
  for (let i = 0; i < nextChildren.length; i++) {
    const liveChild = liveParent.childNodes[i];
    const nextChild = nextChildren[i];
    if (!liveChild) {
      liveParent.appendChild(nextChild);
    } else {
      patchDomNode(liveParent, liveChild, nextChild);
    }
  }
}

export const ReactDOM = {
  createRoot(container) {
    return {
      render(vnode) {
        const doRender = () => {
          React.__beginRender();
          const nextDom = createDomFromVNode(vnode, false, 'root');
          if (!container.childNodes || container.childNodes.length === 0) {
            container.replaceChildren(nextDom);
          } else {
            patchDomChildren(container, nextDom);
          }
          React.__finishRender();
        };
        __setRootRender(doRender);
        doRender();
      },
    };
  },
};

export default ReactDOM;
export const createRoot = ReactDOM.createRoot;
`;

export const VENDOR_ROUTER_JS = `
import React from 'react';

let cachedSearchStr = null;
let cachedSearchParams = null;

export function BrowserRouter({ children }) {
  return React.createElement(React.Fragment, null, ...(Array.isArray(children) ? children : [children]));
}

export function useLocation() {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  };
}

export function useSearchParams() {
  const currentSearch = window.location.search || '';
  if (currentSearch !== cachedSearchStr || !cachedSearchParams) {
    cachedSearchStr = currentSearch;
    cachedSearchParams = new URLSearchParams(currentSearch);
  }
  const setParams = (next) => {
    const p = typeof next === 'function' ? next(cachedSearchParams) : new URLSearchParams(next);
    const nextSearch = '?' + p.toString();
    const newUrl = window.location.pathname + nextSearch;
    window.history.replaceState({}, '', newUrl);
    cachedSearchStr = nextSearch;
    cachedSearchParams = new URLSearchParams(nextSearch);
  };
  return [cachedSearchParams, setParams];
}

export function useNavigate() {
  return (to, opts) => {
    if (opts?.replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }
    const nextSearch = window.location.search || '';
    if (nextSearch !== cachedSearchStr || !cachedSearchParams) {
      cachedSearchStr = nextSearch;
      cachedSearchParams = new URLSearchParams(nextSearch);
    }
  };
}
`;

export const VENDOR_LUCIDE_JS = `
import React from 'react';

function createIcon(name, svgInnerPaths) {
  return function LucideIcon({ className = 'w-4 h-4', ...rest }) {
    return React.createElement('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      className,
      'data-lucide': name,
      dangerouslySetInnerHTML: { __html: svgInnerPaths },
      ...rest,
    });
  };
}

export const Activity = createIcon('Activity', '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>');
export const Calculator = createIcon('Calculator', '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>');
export const ShieldAlert = createIcon('ShieldAlert', '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/>');
export const Cpu = createIcon('Cpu', '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>');
export const BookOpen = createIcon('BookOpen', '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>');
export const Sun = createIcon('Sun', '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>');
export const Moon = createIcon('Moon', '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>');
export const Share2 = createIcon('Share2', '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>');
export const Check = createIcon('Check', '<path d="M20 6 9 17l-5-5"/>');
export const Globe = createIcon('Globe', '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>');
export const ShieldCheck = createIcon('ShieldCheck', '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>');
export const Scale = createIcon('Scale', '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>');
export const FileText = createIcon('FileText', '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>');
export const Lock = createIcon('Lock', '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>');
export const Sliders = createIcon('Sliders', '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>');
export const FileSearch = createIcon('FileSearch', '<path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M4.268 21a2 2 0 0 0 1.727 1H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3"/><path d="m9 18-1.5-1.5"/><circle cx="5" cy="14" r="3"/>');
export const TrendingDown = createIcon('TrendingDown', '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>');
export const ArrowUpRight = createIcon('ArrowUpRight', '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>');
export const CheckCircle2 = createIcon('CheckCircle2', '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>');
export const Wrench = createIcon('Wrench', '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>');
export const Car = createIcon('Car', '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>');
export const Fuel = createIcon('Fuel', '<line x1="3" x2="15" y1="22" y2="22"/><line x1="4" x2="14" y1="9" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/>');
export const Shield = createIcon('Shield', '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>');
export const Landmark = createIcon('Landmark', '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>');
export const RotateCcw = createIcon('RotateCcw', '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>');
export const ArrowRight = createIcon('ArrowRight', '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>');
export const Info = createIcon('Info', '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>');
export const Zap = createIcon('Zap', '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>');
export const ChevronRight = createIcon('ChevronRight', '<path d="m9 18 6-6-6-6"/>');
export const AlertTriangle = createIcon('AlertTriangle', '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>');
export const Gauge = createIcon('Gauge', '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>');
export const Flame = createIcon('Flame', '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>');
export const History = createIcon('History', '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>');
export const Droplets = createIcon('Droplets', '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>');
export const Search = createIcon('Search', '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>');
export const AlertOctagon = createIcon('AlertOctagon', '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>');
export const Terminal = createIcon('Terminal', '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>');
export const DollarSign = createIcon('DollarSign', '<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>');
export const Filter = createIcon('Filter', '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>');
export const ChevronDown = createIcon('ChevronDown', '<path d="m6 9 6 6 6-6"/>');
export const ChevronUp = createIcon('ChevronUp', '<path d="m18 15-6-6-6 6"/>');
export const X = createIcon('X', '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>');
export const Clock = createIcon('Clock', '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>');
export const MessageSquare = createIcon('MessageSquare', '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>');
export const Star = createIcon('Star', '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>');
export const Sparkles = createIcon('Sparkles', '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>');
export const Users = createIcon('Users', '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>');
export const CheckSquare = createIcon('CheckSquare', '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>');
export const Compass = createIcon('Compass', '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>');
export const Plus = createIcon('Plus', '<path d="M5 12h14"/><path d="M12 5v14"/>');
export const Lightbulb = createIcon('Lightbulb', '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>');
export const CircleCheck = createIcon('CircleCheck', '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>');
export const Printer = createIcon('Printer', '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>');
export const Download = createIcon('Download', '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>');
export const Calendar = createIcon('Calendar', '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>');
export const GitCompare = createIcon('GitCompare', '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M11 18H8a2 2 0 0 1-2-2V9"/>');
export const TrendingUp = createIcon('TrendingUp', '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>');
export const Layers = createIcon('Layers', '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>');
export const ExternalLink = createIcon('ExternalLink', '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>');
export const Settings2 = createIcon('Settings2', '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>');
export const Monitor = createIcon('Monitor', '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>');

`;

function resolveLocalImportPath(fromFile, importSpec) {
  if (!importSpec.startsWith('.')) return importSpec;
  const dir = path.dirname(fromFile);
  const absBase = path.resolve(dir, importSpec);
  for (const ext of ['', '.js', '.jsx', '.css']) {
    const candidate = absBase + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const relToRoot = '/' + path.relative(projectRoot, candidate).replace(/\\/g, '/');
      return relToRoot;
    }
  }
  return importSpec;
}

function transformModuleSource(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const transpiled = filePath.endsWith('.jsx') ? transpileJsx(raw) : raw;
  // Rewrite relative imports so browser ES modules have explicit extensions & strip .css imports
  return transpiled
    .replace(/import\s+['"][^'"]+\.css['"];?/g, '')
    .replace(/from\s+['"]([^'"]+)['"]/g, (match, spec) => {
      const resolved = resolveLocalImportPath(filePath, spec);
      return `from '${resolved}'`;
    });
}

function buildEnhancedIndexHtml() {
  const rawIndex = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
  const cssContent = fs
    .readFileSync(path.join(projectRoot, 'src', 'index.css'), 'utf8')
    .replace(/@tailwind\s+\w+;/g, '');

  const headInjection = `
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <script type="importmap">
      {
        "imports": {
          "react": "/__vendor/react.js",
          "react-dom/client": "/__vendor/react-dom-client.js",
          "react-router-dom": "/__vendor/react-router-dom.js",
          "lucide-react": "/__vendor/lucide-react.js"
        }
      }
    </script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      if (window.tailwind) {
        tailwind.config = {
          darkMode: 'class',
          theme: {
            fontFamily: {
              sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
              mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
            },
            extend: {
              fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
              },
            },
          },
        };
      }
    </script>
    <style>${cssContent}</style>
  `;

  return rawIndex.replace('</head>', `${headInjection}\n  </head>`);
}

export function runProductionBuild() {
  console.log('Building ShiftMetric production bundle...');
  const distDir = path.join(projectRoot, 'dist');
  fs.mkdirSync(distDir, { recursive: true });

  // Write self-contained __vendor runtime modules to dist/__vendor/
  const vendorDir = path.join(distDir, '__vendor');
  fs.mkdirSync(vendorDir, { recursive: true });
  fs.writeFileSync(path.join(vendorDir, 'react.js'), VENDOR_REACT_JS, 'utf8');
  fs.writeFileSync(path.join(vendorDir, 'react-dom-client.js'), VENDOR_REACT_DOM_CLIENT_JS, 'utf8');
  fs.writeFileSync(path.join(vendorDir, 'react-router-dom.js'), VENDOR_ROUTER_JS, 'utf8');
  fs.writeFileSync(path.join(vendorDir, 'lucide-react.js'), VENDOR_LUCIDE_JS, 'utf8');

  // Verify every .js and .jsx file in src/ transpiles cleanly
  const srcFiles = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
        srcFiles.push(full);
      }
    }
  }
  walk(path.join(projectRoot, 'src'));

  for (const file of srcFiles) {
    const transformed = transformModuleSource(file);
    const rel = path.relative(projectRoot, file);
    const outPath = path.join(distDir, rel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, transformed, 'utf8');
    console.log(`  ✓ Compiled ${rel.replace(/\\/g, '/')} (${transformed.length} bytes)`);
  }

  // Copy public/ assets
  for (const pubFile of ['ads.txt', 'robots.txt']) {
    const srcPub = path.join(projectRoot, 'public', pubFile);
    if (fs.existsSync(srcPub)) {
      fs.copyFileSync(srcPub, path.join(distDir, pubFile));
    }
  }

  // Write dist/index.html
  fs.writeFileSync(path.join(distDir, 'index.html'), buildEnhancedIndexHtml(), 'utf8');
  console.log(`✓ Production build succeeded in dist/ (${srcFiles.length} modules + 4 vendor bundles compiled, 0 errors).`);
}

export function startDevServer() {
  const server = http.createServer((req, res) => {
    const urlObj = new URL(req.url || '/', `http://localhost:${PORT}`);
    const pathname = urlObj.pathname;

    const noCacheJsHeaders = {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    };

    // Vendor runtime modules
    if (pathname === '/__vendor/react.js') {
      res.writeHead(200, noCacheJsHeaders);
      res.end(VENDOR_REACT_JS);
      return;
    }
    if (pathname === '/__vendor/react-dom-client.js') {
      res.writeHead(200, noCacheJsHeaders);
      res.end(VENDOR_REACT_DOM_CLIENT_JS);
      return;
    }
    if (pathname === '/__vendor/react-router-dom.js') {
      res.writeHead(200, noCacheJsHeaders);
      res.end(VENDOR_ROUTER_JS);
      return;
    }
    if (pathname === '/__vendor/lucide-react.js') {
      res.writeHead(200, noCacheJsHeaders);
      res.end(VENDOR_LUCIDE_JS);
      return;
    }

    // Static public files
    if (pathname === '/ads.txt' || pathname === '/robots.txt') {
      const pubFile = path.join(projectRoot, 'public', pathname.slice(1));
      if (fs.existsSync(pubFile)) {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(fs.readFileSync(pubFile, 'utf8'));
        return;
      }
    }

    // Source JS / JSX modules
    if (pathname.startsWith('/src/')) {
      const targetFile = path.join(projectRoot, pathname.slice(1));
      if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
        if (targetFile.endsWith('.css')) {
          res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
          res.end(fs.readFileSync(targetFile, 'utf8'));
          return;
        }
        try {
          const code = transformModuleSource(targetFile);
          res.writeHead(200, noCacheJsHeaders);
          res.end(code);
          return;
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(`Compilation error in ${pathname}: ${err.message}`);
          return;
        }
      }
    }

    // SPA routes (/, /tco, /risk-matrix, /obd-estimator, /methodology)
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    });
    res.end(buildEnhancedIndexHtml());
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`ShiftMetric dev server ready at http://localhost:${PORT}/`);
  });
}

const isCliEntry =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isCliEntry) {
  if (process.argv.includes('--build')) {
    runProductionBuild();
  } else {
    startDevServer();
  }
}

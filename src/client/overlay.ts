/**
 * Browser overlay client — injected by Vite plugin in dev mode
 * Renders a floating panel in the browser page (no browser extension required)
 * Sends events to VS Code tracer server on port 9339
 */

import type { ITraceEvent } from '../tracer/tracer.types.js';

const TRACE_PORT = 9339;
const SESSION_ID = `browser-${Date.now()}`;

declare global {
  interface Window {
    __PULSAR_DEVTOOLS__?: IPulsarDevtools;
  }
}

export interface IPulsarDevtools {
  emit: (event: ITraceEvent) => void;
  show: () => void;
  hide: () => void;
  toggle: () => void;
}

export const PulsarOverlay = function (this: IPulsarOverlay) {
  Object.defineProperty(this, '_visible', { value: false, writable: true, enumerable: false });
  Object.defineProperty(this, '_events', { value: [] as ITraceEvent[], writable: true, enumerable: false });
  Object.defineProperty(this, '_panel', { value: null as HTMLElement | null, writable: true, enumerable: false });
  Object.defineProperty(this, '_sessionId', { value: SESSION_ID, writable: false, enumerable: false });
} as unknown as IPulsarOverlayConstructor;

interface IPulsarOverlay {
  _visible: boolean;
  _events: ITraceEvent[];
  _panel: HTMLElement | null;
  _sessionId: string;
  init: () => void;
  emit: (event: ITraceEvent) => void;
  show: () => void;
  hide: () => void;
  toggle: () => void;
}

interface IPulsarOverlayConstructor {
  new (): IPulsarOverlay;
}

PulsarOverlay.prototype.init = function (this: IPulsarOverlay): void {
  const panel = document.createElement('div');
  panel.id = '__pulsar-devtools__';
  panel.style.cssText = [
    'position:fixed',
    'bottom:0',
    'right:0',
    'width:380px',
    'max-height:320px',
    'background:#0f1117',
    'color:#e2e8f0',
    'font-family:monospace',
    'font-size:11px',
    'border-top:2px solid #7c3aed',
    'border-left:2px solid #7c3aed',
    'border-radius:6px 0 0 0',
    'z-index:99999',
    'display:none',
    'flex-direction:column',
    'overflow:hidden',
    'box-shadow:-4px -4px 20px rgba(124,58,237,0.3)',
  ].join(';');

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:#1e1b4b;border-bottom:1px solid #312e81;">
      <span style="color:#a78bfa;font-weight:bold;letter-spacing:0.05em;">⚡ PULSAR DevTools</span>
      <div style="display:flex;gap:6px;">
        <button id="__pulsar-clear__" style="background:#312e81;border:none;color:#c4b5fd;padding:2px 8px;border-radius:3px;cursor:pointer;font-size:10px;">clear</button>
        <button id="__pulsar-close__" style="background:#312e81;border:none;color:#c4b5fd;padding:2px 8px;border-radius:3px;cursor:pointer;font-size:10px;">✕</button>
      </div>
    </div>
    <div id="__pulsar-events__" style="overflow-y:auto;flex:1;padding:4px 0;"></div>
  `;

  document.body.appendChild(panel);
  this._panel = panel;

  panel.querySelector('#__pulsar-close__')?.addEventListener('click', () => this.hide());
  panel.querySelector('#__pulsar-clear__')?.addEventListener('click', () => {
    const eventsEl = panel.querySelector('#__pulsar-events__');
    if (eventsEl) eventsEl.innerHTML = '';
    this._events = [];
  });

  // Toggle shortcut: Alt+P
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.altKey && e.key === 'p') this.toggle();
  });
};

PulsarOverlay.prototype.emit = function (this: IPulsarOverlay, event: ITraceEvent): void {
  this._events.push(event);
  if (this._events.length > 500) this._events.shift();

  // Render in overlay
  if (this._panel && this._visible) {
    appendEventRow(this._panel, event);
  }

  // POST to VS Code tracer server (fire & forget)
  void fetch(`http://localhost:${TRACE_PORT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events: [event], source: 'browser', sessionId: this._sessionId }),
  }).catch(() => { /* tracer not running */ });
};

PulsarOverlay.prototype.show = function (this: IPulsarOverlay): void {
  this._visible = true;
  if (this._panel) this._panel.style.display = 'flex';
};

PulsarOverlay.prototype.hide = function (this: IPulsarOverlay): void {
  this._visible = false;
  if (this._panel) this._panel.style.display = 'none';
};

PulsarOverlay.prototype.toggle = function (this: IPulsarOverlay): void {
  this._visible ? this.hide() : this.show();
};

function appendEventRow(panel: HTMLElement, event: ITraceEvent): void {
  const eventsEl = panel.querySelector('#__pulsar-events__');
  if (!eventsEl) return;

  const channelColor: Record<string, string> = {
    signal: '#34d399',
    component: '#60a5fa',
    transformer: '#f472b6',
    vite: '#fbbf24',
    lifecycle: '#a78bfa',
    error: '#f87171',
  };

  const row = document.createElement('div');
  row.style.cssText = 'padding:2px 10px;border-bottom:1px solid #1e1b4b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
  const color = channelColor[event.channel] ?? '#94a3b8';
  const ts = new Date(event.timestamp).toISOString().slice(11, 23);
  row.innerHTML = `<span style="color:#475569;">${ts}</span> <span style="color:${color};">[${event.channel}]</span> <span style="color:#e2e8f0;">${event.type}</span>${event.name ? ` <span style="color:#94a3b8;">${event.name}</span>` : ''}`;

  eventsEl.appendChild(row);

  // Auto-scroll
  eventsEl.scrollTop = eventsEl.scrollHeight;

  // Cap displayed rows
  while (eventsEl.children.length > 200) {
    eventsEl.removeChild(eventsEl.firstChild!);
  }
}

export function initPulsarDevtools(): IPulsarDevtools {
  const overlay = new (PulsarOverlay as unknown as IPulsarOverlayConstructor)();
  overlay.init();

  const api: IPulsarDevtools = {
    emit: (e) => overlay.emit(e),
    show: () => overlay.show(),
    hide: () => overlay.hide(),
    toggle: () => overlay.toggle(),
  };

  window.__PULSAR_DEVTOOLS__ = api;
  console.log('[Pulsar DevTools] Loaded — press Alt+P to toggle overlay');

  return api;
}

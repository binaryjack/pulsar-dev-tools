/**
 * Tracer emitter — Node.js side (transformer + Vite plugin)
 * POSTs events to VS Code extension HTTP server on port 9339
 */

import type { ITraceEvent, ITraceEventBatch } from './tracer.types.js';

const TRACE_PORT = 9339;
const TRACE_URL = `http://localhost:${TRACE_PORT}`;

export const TracerEmitter = function (this: ITracerEmitter, sessionId: string, source: ITraceEventBatch['source']) {
  Object.defineProperty(this, '_sessionId', { value: sessionId, enumerable: false, writable: false });
  Object.defineProperty(this, '_source', { value: source, enumerable: false, writable: false });
  Object.defineProperty(this, '_enabled', {
    value: process.env['PULSAR_TRACE'] === 'true' || process.env['PULSAR_TRACE_HTTP'] === 'true',
    enumerable: false,
    writable: true,
  });
} as unknown as ITracerEmitterConstructor;

export interface ITracerEmitter {
  emit: (event: ITraceEvent) => void;
  emitBatch: (events: ITraceEvent[]) => void;
  isEnabled: () => boolean;
}

interface ITracerEmitterConstructor {
  new (sessionId: string, source: ITraceEventBatch['source']): ITracerEmitter;
}

TracerEmitter.prototype.isEnabled = function (this: { _enabled: boolean }): boolean {
  return this._enabled;
};

TracerEmitter.prototype.emit = function (this: { _sessionId: string; _source: ITraceEventBatch['source']; _enabled: boolean }, event: ITraceEvent): void {
  if (!this._enabled) return;
  const batch: ITraceEventBatch = {
    events: [event],
    source: this._source,
    sessionId: this._sessionId,
  };
  postBatch(batch);
};

TracerEmitter.prototype.emitBatch = function (this: { _sessionId: string; _source: ITraceEventBatch['source']; _enabled: boolean }, events: ITraceEvent[]): void {
  if (!this._enabled || events.length === 0) return;
  const batch: ITraceEventBatch = {
    events,
    source: this._source,
    sessionId: this._sessionId,
  };
  postBatch(batch);
};

function postBatch(batch: ITraceEventBatch): void {
  // Dynamic import to avoid bundling in browser
  import('node:http').then(({ default: http }) => {
    const body = JSON.stringify(batch);
    const options = {
      hostname: 'localhost',
      port: TRACE_PORT,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = http.request(options);
    req.on('error', () => { /* silent — tracer not running */ });
    req.write(body);
    req.end();
  }).catch(() => { /* silent */ });
}

export function createEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export { TRACE_PORT, TRACE_URL };


/**
 * Signal debugger — prototype-based, browser-safe
 * Intercepts signal reads/writes and builds reactive graph
 */

import type { ISignalDebugger, ISignalGraph, ISignalNode } from './signal-debugger.types.js';

export const SignalDebugger = function (this: ISignalDebugger & { _graph: ISignalGraph }) {
  Object.defineProperty(this, '_graph', {
    value: { nodes: new Map<string, ISignalNode>(), edges: [] },
    enumerable: false,
    writable: true,
  });
} as unknown as ISignalDebuggerConstructor;

interface ISignalDebuggerConstructor {
  new (): ISignalDebugger;
}

SignalDebugger.prototype.track = function (
  this: { _graph: ISignalGraph },
  id: string,
  name: string,
  kind: ISignalNode['kind'],
  component?: string
): void {
  if (this._graph.nodes.has(id)) return;
  this._graph.nodes.set(id, {
    id,
    name,
    kind,
    value: undefined,
    subscribers: [],
    dependencies: [],
    updateCount: 0,
    lastUpdated: Date.now(),
    component,
  });
};

SignalDebugger.prototype.recordRead = function (
  this: { _graph: ISignalGraph },
  id: string
): void {
  const node = this._graph.nodes.get(id);
  if (!node) return;
  node.lastUpdated = Date.now();
};

SignalDebugger.prototype.recordWrite = function (
  this: { _graph: ISignalGraph },
  id: string,
  value: unknown
): void {
  const node = this._graph.nodes.get(id);
  if (!node) return;
  node.value = value;
  node.updateCount += 1;
  node.lastUpdated = Date.now();
};

SignalDebugger.prototype.getGraph = function (this: { _graph: ISignalGraph }): ISignalGraph {
  return this._graph;
};

SignalDebugger.prototype.reset = function (this: { _graph: ISignalGraph }): void {
  this._graph.nodes.clear();
  this._graph.edges.length = 0;
};

export function createSignalDebugger(): ISignalDebugger {
  return new (SignalDebugger as unknown as ISignalDebuggerConstructor)();
}

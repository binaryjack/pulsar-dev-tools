/**
 * Signal debugger types
 */

export interface ISignalNode {
  id: string;
  name: string;
  kind: 'signal' | 'computed' | 'effect';
  value: unknown;
  subscribers: string[];
  dependencies: string[];
  updateCount: number;
  lastUpdated: number;
  component?: string;
}

export interface ISignalGraph {
  nodes: Map<string, ISignalNode>;
  edges: Array<{ from: string; to: string }>;
}

export interface ISignalDebugger {
  track: (id: string, name: string, kind: ISignalNode['kind'], component?: string) => void;
  recordRead: (id: string) => void;
  recordWrite: (id: string, value: unknown) => void;
  getGraph: () => ISignalGraph;
  reset: () => void;
}

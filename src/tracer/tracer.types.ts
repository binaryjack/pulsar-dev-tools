/**
 * Shared trace event types
 * Used by: browser client, VS Code extension, transformer, Vite plugin
 */

export type TraceChannel =
  | 'signal'
  | 'component'
  | 'transformer'
  | 'vite'
  | 'lifecycle'
  | 'error';

export type TraceEventType =
  | 'signal:read'
  | 'signal:write'
  | 'signal:computed'
  | 'signal:effect'
  | 'component:mount'
  | 'component:unmount'
  | 'component:render'
  | 'transformer:start'
  | 'transformer:phase'
  | 'transformer:complete'
  | 'transformer:error'
  | 'transformer:diagnostic'
  | 'vite:transform'
  | 'lifecycle:init'
  | 'error:throw';

export interface ITraceLocation {
  file: string;
  line?: number;
  column?: number;
}

export interface ITraceEvent {
  id: string;
  timestamp: number;
  channel: TraceChannel;
  type: TraceEventType;
  name?: string;
  duration?: number;
  location?: ITraceLocation;
  data?: Record<string, unknown>;
  error?: { message: string; stack?: string };
}

export interface ITraceEventBatch {
  events: ITraceEvent[];
  source: 'browser' | 'transformer' | 'vite';
  sessionId: string;
}

export type ITraceEventHandler = (event: ITraceEvent) => void;

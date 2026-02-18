/**
 * AST inspector types — PSR file analysis
 */

export type AstInspectorSeverity = 'error' | 'warning' | 'info';

export interface IAstDiagnostic {
  code: string;
  severity: AstInspectorSeverity;
  message: string;
  suggestion?: string;
  location?: {
    file: string;
    start: number;
    end: number;
    line?: number;
    column?: number;
  };
}

export interface IAstInspectorResult {
  file: string;
  nodeCount: number;
  componentCount: number;
  jsxElementCount: number;
  signalCount: number;
  diagnostics: IAstDiagnostic[];
  duration: number;
}

export interface IAstInspector {
  inspect: (code: string, file: string) => IAstInspectorResult;
}

/**
 * AST inspector — PSR file analysis
 * Counts nodes, detects components/signals, emits diagnostics
 */

import type { IAstDiagnostic, IAstInspector, IAstInspectorResult } from './ast-inspector.types.js';

export const AstInspector = function (this: IAstInspector) {
} as unknown as IAstInspectorConstructor;

interface IAstInspectorConstructor {
  new (): IAstInspector;
}

AstInspector.prototype.inspect = function (
  _this: IAstInspector,
  code: string,
  file: string
): IAstInspectorResult {
  const start = Date.now();
  const diagnostics: IAstDiagnostic[] = [];

  // Count PSR-specific patterns (without full AST parse — lightweight)
  const componentCount = (code.match(/\bcomponent\s+\w+/g) ?? []).length;
  const jsxElementCount = (code.match(/<[A-Z][A-Za-z]*/g) ?? []).length;
  const signalCount = (code.match(/\$[a-zA-Z_]\w*\s*=/g) ?? []).length;
  const lines = code.split('\n');
  const nodeCount = lines.length;

  // Diagnostic: component without return
  lines.forEach((line, i) => {
    if (/\bcomponent\s+\w+/.test(line)) {
      const hasReturn = code.slice(code.indexOf(line)).includes('return');
      if (!hasReturn) {
        diagnostics.push({
          code: 'PSR001',
          severity: 'warning',
          message: `Component on line ${i + 1} may be missing a return statement`,
          suggestion: 'Ensure all components return JSX',
          location: { file, start: i, end: i, line: i + 1 },
        });
      }
    }
  });

  return {
    file,
    nodeCount,
    componentCount,
    jsxElementCount,
    signalCount,
    diagnostics,
    duration: Date.now() - start,
  };
};

export function createAstInspector(): IAstInspector {
  return new (AstInspector as unknown as IAstInspectorConstructor)();
}

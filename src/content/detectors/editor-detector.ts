/**
 * Editor Detector - Detects CodeMirror and Monaco editors
 */

export interface CodeMirrorInstance {
  element: HTMLElement;
  instance: any;
  textarea?: HTMLTextAreaElement;
}

export interface MonacoInstance {
  element: HTMLElement;
  instance: any;
}

/**
 * Detect CodeMirror editors and their instances
 */
export function detectCodeMirrorEditors(root: Element = document.body): CodeMirrorInstance[] {
  const editors: CodeMirrorInstance[] = [];

  const codeMirrorElements = root.querySelectorAll('.CodeMirror');

  codeMirrorElements.forEach((element) => {
    if (element instanceof HTMLElement) {
      // Try to get CodeMirror instance from element
      const instance = (element as any).CodeMirror;

      if (instance) {
        editors.push({
          element,
          instance,
        });
      } else {
        // Fallback: find associated textarea
        const textarea = element.querySelector('textarea');
        if (textarea instanceof HTMLTextAreaElement) {
          editors.push({
            element,
            instance: null,
            textarea,
          });
        }
      }
    }
  });

  return editors;
}

/**
 * Detect Monaco editors
 */
export function detectMonacoEditors(root: Element = document.body): MonacoInstance[] {
  const editors: MonacoInstance[] = [];

  const monacoElements = root.querySelectorAll('.monaco-editor');

  monacoElements.forEach((element) => {
    if (element instanceof HTMLElement) {
      // Try to get Monaco instance
      // Monaco stores instance in a property, but it's harder to access
      // We'll try common patterns
      const instance = (window as any).monaco?.editor?.getEditors?.()
        ?.find((e: any) => e.getDomNode() === element);

      editors.push({
        element,
        instance: instance || null,
      });
    }
  });

  return editors;
}

/**
 * Detect ACE editors
 */
export function detectAceEditors(root: Element = document.body): any[] {
  const editors: any[] = [];

  const aceElements = root.querySelectorAll('.ace_editor');

  aceElements.forEach((element) => {
    if (element instanceof HTMLElement) {
      // Try to get ACE instance
      const instance = (window as any).ace?.edit?.(element);

      if (instance) {
        editors.push({
          element,
          instance,
        });
      }
    }
  });

  return editors;
}

/**
 * Get all editor types in the page
 */
export function detectAllEditors(root: Element = document.body) {
  return {
    codeMirror: detectCodeMirrorEditors(root),
    monaco: detectMonacoEditors(root),
    ace: detectAceEditors(root),
  };
}

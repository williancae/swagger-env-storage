/**
 * Input Detector - Detects standard <input> and <textarea> fields
 */

export function detectInputFields(root: Element = document.body): HTMLElement[] {
  const fields: HTMLElement[] = [];

  // Find all input and textarea elements (excluding password, hidden, file types)
  const inputs = root.querySelectorAll('input:not([type="password"]):not([type="hidden"]):not([type="file"]), textarea');

  inputs.forEach((element) => {
    if (element instanceof HTMLElement) {
      fields.push(element);
    }
  });

  // Find all contenteditable elements
  const editables = root.querySelectorAll('[contenteditable="true"]');
  editables.forEach((element) => {
    if (element instanceof HTMLElement) {
      fields.push(element);
    }
  });

  return fields;
}

/**
 * Check if element contains variables pattern
 */
export function hasVariables(element: HTMLElement): boolean {
  const pattern = /\{\{([a-zA-Z0-9_]+)\}\}/;

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return pattern.test(element.value);
  }

  if (element.isContentEditable) {
    return pattern.test(element.textContent || '');
  }

  return false;
}

/**
 * Extract variable names from element
 */
export function extractVariableNames(element: HTMLElement): string[] {
  const pattern = /\{\{([a-zA-Z0-9_]+)\}\}/g;
  const names: string[] = [];
  let text = '';

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    text = element.value;
  } else if (element.isContentEditable) {
    text = element.textContent || '';
  }

  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (!names.includes(match[1])) {
      names.push(match[1]);
    }
  }

  return names;
}

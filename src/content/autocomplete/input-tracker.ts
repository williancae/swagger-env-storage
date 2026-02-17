/**
 * Input Tracker - Tracks input events and detects {{ pattern
 */

export interface CaretPosition {
  x: number;
  y: number;
  element: HTMLElement;
}

/**
 * Detect if user just typed {{ in an input field
 */
export function detectAutocompletePattern(element: HTMLElement): boolean {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const value = element.value;
    const cursorPos = element.selectionStart || 0;

    // Check if there's {{ before cursor
    const beforeCursor = value.substring(0, cursorPos);
    const lastTwoChars = beforeCursor.slice(-2);

    return lastTwoChars === '{{';
  }

  return false;
}

/**
 * Get text between {{ and cursor for filtering
 */
export function getAutocompleteFilter(element: HTMLElement): string {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const value = element.value;
    const cursorPos = element.selectionStart || 0;
    const beforeCursor = value.substring(0, cursorPos);

    // Find last {{
    const lastBracePos = beforeCursor.lastIndexOf('{{');

    if (lastBracePos !== -1) {
      // Get text between {{ and cursor
      return beforeCursor.substring(lastBracePos + 2);
    }
  }

  return '';
}

/**
 * Get caret position in viewport pixels (for position: fixed dropdown)
 */
export function getCaretPosition(element: HTMLElement): CaretPosition | null {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return getInputCaretPosition(element);
  }

  return null;
}

/**
 * Get caret position in viewport coordinates for input/textarea
 */
function getInputCaretPosition(element: HTMLInputElement | HTMLTextAreaElement): CaretPosition {
  const rect = element.getBoundingClientRect();

  if (element instanceof HTMLInputElement) {
    return {
      x: rect.left,
      y: rect.bottom,
      element,
    };
  }

  const cursorPos = element.selectionStart || 0;
  const mirror = createMirrorElement(element);
  const textBeforeCursor = element.value.substring(0, cursorPos);

  mirror.textContent = textBeforeCursor;

  const cursorSpan = document.createElement('span');
  cursorSpan.textContent = '|';
  mirror.appendChild(cursorSpan);

  document.body.appendChild(mirror);

  const spanRect = cursorSpan.getBoundingClientRect();

  document.body.removeChild(mirror);

  return {
    x: spanRect.left,
    y: spanRect.bottom,
    element,
  };
}

/**
 * Create a mirror element to measure text position in textarea
 */
function createMirrorElement(textarea: HTMLTextAreaElement): HTMLDivElement {
  const mirror = document.createElement('div');
  const style = window.getComputedStyle(textarea);

  // Copy relevant styles
  const stylesToCopy = [
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'letter-spacing',
    'padding',
    'border-width',
    'box-sizing',
    'word-wrap',
    'white-space',
  ];

  stylesToCopy.forEach((prop) => {
    mirror.style.setProperty(prop, style.getPropertyValue(prop));
  });

  // Additional mirror styles
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.top = '0';
  mirror.style.left = '0';
  mirror.style.width = `${textarea.offsetWidth}px`;
  mirror.style.height = 'auto';
  mirror.style.overflow = 'auto';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';

  return mirror;
}

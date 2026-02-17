/**
 * Text Replacer - Replace variables in standard text fields
 */

import { replaceVariables } from '@/shared/utils';
import type { Variable } from '@/shared/types';

export function replaceInTextField(
  element: HTMLInputElement | HTMLTextAreaElement,
  variables: Variable[]
): void {
  const originalValue = element.value;
  const newValue = replaceVariables(originalValue, variables);

  if (originalValue !== newValue) {
    element.value = newValue;

    // Dispatch input event for frameworks to detect change
    element.dispatchEvent(new Event('input', { bubbles: true }));

    console.log('[TextReplacer] Replaced variables in field');
  }
}

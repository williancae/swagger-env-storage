/**
 * Monaco Replacer - Replace variables in Monaco editors
 */

import { replaceVariables } from '@/shared/utils';
import type { Variable } from '@/shared/types';
import type { MonacoInstance } from '../detectors/editor-detector';

/**
 * Replace variables in Monaco editor
 */
export function replaceInMonaco(editorData: MonacoInstance, variables: Variable[]): boolean {
  try {
    if (!editorData.instance) {
      console.warn('[MonacoReplacer] No Monaco instance available');
      return false;
    }

    // Get the model from Monaco editor
    const model = editorData.instance.getModel?.();

    if (!model) {
      console.warn('[MonacoReplacer] No model found in Monaco editor');
      return false;
    }

    const content = model.getValue();
    const replaced = replaceVariables(content, variables);

    if (content !== replaced) {
      // Use executeEdits for better undo/redo support
      const fullRange = model.getFullModelRange();

      editorData.instance.executeEdits('swagger-envs', [{
        range: fullRange,
        text: replaced,
      }]);

      console.log('[MonacoReplacer] Replaced variables in Monaco editor');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[MonacoReplacer] Error replacing variables:', error);
    return false;
  }
}

/**
 * Get content from Monaco editor
 */
export function getMonacoContent(editorData: MonacoInstance): string {
  try {
    if (!editorData.instance) {
      return '';
    }

    const model = editorData.instance.getModel?.();
    return model ? model.getValue() : '';
  } catch (error) {
    console.error('[MonacoReplacer] Error getting content:', error);
    return '';
  }
}

/**
 * Set content in Monaco editor
 */
export function setMonacoContent(editorData: MonacoInstance, content: string): boolean {
  try {
    if (!editorData.instance) {
      return false;
    }

    const model = editorData.instance.getModel?.();

    if (!model) {
      return false;
    }

    const fullRange = model.getFullModelRange();

    editorData.instance.executeEdits('swagger-envs', [{
      range: fullRange,
      text: content,
    }]);

    return true;
  } catch (error) {
    console.error('[MonacoReplacer] Error setting content:', error);
    return false;
  }
}

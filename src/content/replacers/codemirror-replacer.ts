/**
 * CodeMirror Replacer - Replace variables in CodeMirror editors
 */

import { replaceVariables } from '@/shared/utils';
import type { Variable } from '@/shared/types';
import type { CodeMirrorInstance } from '../detectors/editor-detector';

/**
 * Replace variables in CodeMirror editor
 */
export function replaceInCodeMirror(editorData: CodeMirrorInstance, variables: Variable[]): boolean {
  try {
    // If we have direct access to CodeMirror instance
    if (editorData.instance && typeof editorData.instance.getValue === 'function') {
      const content = editorData.instance.getValue();
      const replaced = replaceVariables(content, variables);

      if (content !== replaced) {
        editorData.instance.setValue(replaced);
        console.log('[CodeMirrorReplacer] Replaced variables in CodeMirror editor');
        return true;
      }
    }
    // Fallback to textarea if available
    else if (editorData.textarea) {
      const content = editorData.textarea.value;
      const replaced = replaceVariables(content, variables);

      if (content !== replaced) {
        editorData.textarea.value = replaced;

        // Trigger change event
        editorData.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        editorData.textarea.dispatchEvent(new Event('change', { bubbles: true }));

        console.log('[CodeMirrorReplacer] Replaced variables in CodeMirror textarea');
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('[CodeMirrorReplacer] Error replacing variables:', error);
    return false;
  }
}

/**
 * Get content from CodeMirror editor
 */
export function getCodeMirrorContent(editorData: CodeMirrorInstance): string {
  if (editorData.instance && typeof editorData.instance.getValue === 'function') {
    return editorData.instance.getValue();
  }

  if (editorData.textarea) {
    return editorData.textarea.value;
  }

  return '';
}

/**
 * Set content in CodeMirror editor
 */
export function setCodeMirrorContent(editorData: CodeMirrorInstance, content: string): boolean {
  try {
    if (editorData.instance && typeof editorData.instance.setValue === 'function') {
      editorData.instance.setValue(content);
      return true;
    }

    if (editorData.textarea) {
      editorData.textarea.value = content;
      editorData.textarea.dispatchEvent(new Event('input', { bubbles: true }));
      editorData.textarea.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    return false;
  } catch (error) {
    console.error('[CodeMirrorReplacer] Error setting content:', error);
    return false;
  }
}

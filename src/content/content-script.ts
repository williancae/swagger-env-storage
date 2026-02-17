/**
 * Content Script - Entry point
 * Coordinates detection, replacement, and observation of DOM changes
 */

import { StorageService } from '@/shared/storage';
import type { Settings, Variable } from '@/shared/types';
import { filterVariablesByHost, formatHostDisplay } from '@/shared/host-utils';
import { Autocomplete } from './autocomplete/autocomplete';
import { detectAutocompletePattern, getAutocompleteFilter, getCaretPosition } from './autocomplete/input-tracker';
import { detectAllEditors } from './detectors/editor-detector';
import { detectInputFields, hasVariables } from './detectors/input-detector';
import { detectSwaggerFields, detectSwaggerPage } from './detectors/swagger-detector';
import { DOMObserver } from './observers/dom-observer';
import { replaceInCodeMirror } from './replacers/codemirror-replacer';
import { replaceInMonaco } from './replacers/monaco-replacer';
import { replaceInTextField } from './replacers/text-replacer';

const storage = StorageService.getInstance();

let variablesCache: Variable[] = [];
let settings: Settings | null = null;
let domObserver: DOMObserver | null = null;
let autocomplete: Autocomplete | null = null;
const processedElements = new WeakSet<HTMLElement>();

async function init(): Promise<void> {
  console.log('[Content Script] Initializing...');

  // Load initial data
  settings = await storage.getSettings();

  if (!settings.enabled) {
    console.log('[Content Script] Extension disabled, skipping');
    return;
  }

  const allVariables = await storage.getVariables();
  const currentHostname = window.location.hostname;
  const currentPort = window.location.port;
  variablesCache = filterVariablesByHost(allVariables, currentHostname, currentPort);
  console.log(
    `[Content Script] Loaded ${allVariables.length} total, ${variablesCache.length} for host: ${formatHostDisplay(currentHostname, currentPort)}`
  );

  // Detect page context
  const swaggerContext = detectSwaggerPage();
  if (swaggerContext.isSwaggerPage) {
    console.log('[Content Script] Swagger UI detected:', swaggerContext);
  }

  // Initialize components
  autocomplete = new Autocomplete(handleVariableSelected);
  autocomplete.setVariables(variablesCache);

  // Setup listeners
  setupStorageListener();
  setupDOMListeners();

  // Start DOM observer with 300ms debounce for performance
  domObserver = new DOMObserver(handleNewElements, 300);
  domObserver.start();

  // Initial scan for existing fields
  scanAndProcessFields();

  console.log('[Content Script] Ready');
}

function setupStorageListener(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_SELECTION') {
      const selection = window.getSelection()?.toString()?.trim() || null;
      console.log('[Content Script] GET_SELECTION - returning:', selection ? `"${selection}"` : 'null');
      sendResponse({ selection });
      return true;
    }
    if (message.type === 'STORAGE_CHANGED') {
      handleStorageChange();
    } else if (message.type === 'FORCE_REPLACE') {
      console.log('[Content Script] Force replace triggered from background');
      handleReplaceAll();
    }
  });

  // Also listen to storage changes directly
  storage.onChanged(() => {
    handleStorageChange();
  });
}

async function handleStorageChange(): Promise<void> {
  console.log('[Content Script] Storage changed, reloading...');
  const allVariables = await storage.getVariables();
  const currentHostname = window.location.hostname;
  const currentPort = window.location.port;
  variablesCache = filterVariablesByHost(allVariables, currentHostname, currentPort);
  settings = await storage.getSettings();

  console.log(
    `[Content Script] Reloaded ${allVariables.length} total, ${variablesCache.length} for host: ${formatHostDisplay(currentHostname, currentPort)}`
  );

  // Update autocomplete
  if (autocomplete) {
    autocomplete.setVariables(variablesCache);
  }

  // Re-scan fields if new variables added
  scanAndProcessFields();
}

function setupDOMListeners(): void {
  // Event delegation for blur events (onblur trigger)
  document.body.addEventListener('blur', handleBlur, true);

  // Event delegation for input events (autocomplete detection)
  document.body.addEventListener('input', handleInput, true);

  // Keyboard shortcut for manual replacement
  document.addEventListener('keydown', handleKeydown);
}

function handleBlur(event: Event): void {
  const target = event.target as HTMLElement;

  if (!settings || !isInputField(target)) {
    return;
  }

  // Only replace on blur if setting is 'onblur'
  if (settings.replacementTrigger === 'onblur' && hasVariables(target)) {
    replaceInElement(target);
  }
}

function handleInput(event: Event): void {
  const target = event.target as HTMLElement;

  if (!isInputField(target)) {
    return;
  }

  // Check for autocomplete pattern
  if (detectAutocompletePattern(target)) {
    showAutocomplete(target);
  } else if (autocomplete?.isVisible()) {
    // Update filter if autocomplete is already visible
    const filter = getAutocompleteFilter(target);
    autocomplete.updateFilter(filter);
  }
}

function handleKeydown(_event: KeyboardEvent): void {
  // Keyboard shortcuts are handled by manifest commands via the service worker.
  // The service worker sends FORCE_REPLACE message which is handled in setupStorageListener.
}

function showAutocomplete(element: HTMLElement): void {
  if (!autocomplete) return;

  const position = getCaretPosition(element);

  if (position) {
    autocomplete.show(element, position.x, position.y);
  }
}

function handleVariableSelected(variableName: string): void {
  console.log('[Content Script] Variable selected:', variableName);
}

function handleReplaceAll(): void {
  console.log('[Content Script] Replacing all variables...');

  const allFields = getAllEditableFields();
  let replacedCount = 0;

  allFields.forEach((field) => {
    if (hasVariables(field)) {
      const success = replaceInElement(field);
      if (success) {
        replacedCount++;
      }
    }
  });

  // Handle editors
  const editors = detectAllEditors();

  editors.codeMirror.forEach((editor) => {
    if (replaceInCodeMirror(editor, variablesCache)) {
      replacedCount++;
    }
  });

  editors.monaco.forEach((editor) => {
    if (replaceInMonaco(editor, variablesCache)) {
      replacedCount++;
    }
  });

  console.log('[Content Script] Replaced variables in', replacedCount, 'fields');
}

function replaceInElement(element: HTMLElement): boolean {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    replaceInTextField(element, variablesCache);
    return true;
  }

  // TODO: Handle contenteditable elements
  return false;
}

function isInputField(element: HTMLElement): boolean {
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.isContentEditable
  );
}

function getAllEditableFields(): HTMLElement[] {
  const fields: HTMLElement[] = [];

  // Standard inputs
  fields.push(...detectInputFields());

  // Swagger specific
  const swaggerContext = detectSwaggerPage();
  if (swaggerContext.isSwaggerPage) {
    fields.push(...detectSwaggerFields());
  }

  return fields;
}

function handleNewElements(elements: Element[]): void {
  elements.forEach((element) => {
    // Find input fields in new elements
    if (element instanceof HTMLElement) {
      const newFields = detectInputFields(element);
      newFields.forEach((field) => {
        if (!processedElements.has(field)) {
          processedElements.add(field);
        }
      });
    }
  });
}

function scanAndProcessFields(): void {
  const allFields = getAllEditableFields();

  allFields.forEach((field) => {
    processedElements.add(field);
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init().catch((err) => {
    console.error('[Content Script] init() failed:', err);
  }));
} else {
  init().catch((err) => {
    console.error('[Content Script] init() failed:', err);
  });
}

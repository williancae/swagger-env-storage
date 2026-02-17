/**
 * Popup UI - Quick access interface
 */

import { StorageService, StorageError } from '@/shared/storage';
import type { Variable } from '@/shared/types';
import { validateVariableKey, getOpenPopupShortcutLabel, applyTheme } from '@/shared/utils';
import { isGlobalVariable, filterVariablesByHost, formatHostDisplay, matchHost } from '@/shared/host-utils';
import { MAX_VARIABLE_NAME_LENGTH, MAX_VARIABLE_VALUE_LENGTH } from '@/shared/constants';

const storage = StorageService.getInstance();
let currentVariables: Variable[] = [];
let currentSearchQuery = '';
let currentHost = '';
let currentHostname = '';
let currentPort = '';
const showValues = false;
let editingVariableId: string | null = null;

async function init(): Promise<void> {
  console.log('[Popup] Initializing...');

  // Detect current host from active tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const url = new URL(tab.url);
      currentHostname = url.hostname;
      currentPort = url.port;
      currentHost = formatHostDisplay(currentHostname, currentPort);
    }
  } catch (err) {
    console.log('[Popup] Could not detect host:', err);
  }

  // Load data
  currentVariables = await storage.getVariables();
  const settings = await storage.getSettings();

  applyTheme(settings.theme ?? 'light');

  // Render UI
  renderHostIndicator(currentHost);
  renderVariablesList(currentVariables);
  renderToggle(settings.enabled);
  updateStatusIndicator(settings.enabled);
  const shortcutHint = document.getElementById('shortcut-hint');
  if (shortcutHint) shortcutHint.textContent = `Abrir popup: ${getOpenPopupShortcutLabel()}`;

  // Setup event listeners
  setupEventListeners();

  // Listen for storage changes
  storage.onChanged(() => {
    refreshData();
  });

  console.log('[Popup] Ready');
}

function renderHostIndicator(host: string): void {
  const container = document.getElementById('current-host');
  if (!container) return;

  if (!host) {
    container.classList.add('hidden');
    return;
  }

  const activeCount = filterVariablesByHost(currentVariables, currentHostname, currentPort)
    .filter(v => v.enabled).length;
  const totalCount = currentVariables.length;

  container.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
        </svg>
        <span class="text-xs font-mono text-gray-700 dark:text-gray-300 truncate max-w-[200px]" title="${escapeHtml(host)}">${escapeHtml(host)}</span>
      </div>
      <span class="text-xs px-1.5 py-0.5 rounded-full ${activeCount > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}">
        ${activeCount}/${totalCount} active
      </span>
    </div>
  `;

  // Show host name in quick-add checkbox
  const hostLabel = document.getElementById('quick-add-host-label');
  const hostName = document.getElementById('quick-add-host-name');
  if (hostLabel && hostName) {
    hostLabel.classList.remove('hidden');
    hostLabel.classList.add('flex');
    hostName.textContent = host;
  }
}

function renderVariablesList(variables: Variable[]): void {
  const container = document.getElementById('variables-list');
  if (!container) return;

  // Apply search filter
  const filteredVars = currentSearchQuery
    ? variables.filter(v =>
        v.key.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        v.value.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        (v.description?.toLowerCase().includes(currentSearchQuery.toLowerCase()) || false)
      )
    : variables;

  if (filteredVars.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-8 text-center">
        <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
        </svg>
        <p class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
          ${currentSearchQuery ? 'No variables found' : 'No variables yet'}
        </p>
        <p class="text-gray-400 dark:text-gray-500 text-xs">
          ${currentSearchQuery ? 'Try a different search term' : 'Click "Manage Variables" to add one'}
        </p>
      </div>
    `;
    return;
  }

  const list = document.createElement('div');
  list.className = 'space-y-2';

  filteredVars.forEach((variable) => {
    const isGlobal = isGlobalVariable(variable);
    const isActiveOnHost = currentHost
      ? isGlobal || variable.hosts.some(h => matchHost(h, currentHostname, currentPort))
      : true;

    const item = document.createElement('div');
    item.className = `
      bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700
      hover:shadow-md transition-shadow duration-150 cursor-pointer group
      ${!variable.enabled ? 'opacity-50' : ''}
      ${currentHost && !isActiveOnHost ? 'opacity-40' : ''}
    `;

    const hostBadge = isGlobal
      ? '<span class="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">global</span>'
      : `<span class="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${isActiveOnHost ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}">`
        + `<span class="w-1.5 h-1.5 rounded-full ${isActiveOnHost ? 'bg-green-500' : 'bg-gray-400'}"></span>`
        + `${variable.hosts.length} host${variable.hosts.length !== 1 ? 's' : ''}</span>`;

    const hostTooltip = !isGlobal && variable.hosts.length > 0
      ? `title="${variable.hosts.map(h => escapeHtml(h)).join(', ')}"`
      : '';

    const isEditing = editingVariableId === variable.id;

    if (isEditing) {
      item.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                ${escapeHtml(variable.key)}
              </span>
              <span ${hostTooltip}>${hostBadge}</span>
            </div>
            <textarea
              class="edit-value-input w-full px-2 py-1.5 text-xs font-mono border border-blue-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[60px] max-h-[120px]"
              data-id="${variable.id}"
              maxlength="${MAX_VARIABLE_VALUE_LENGTH}"
              rows="2"
            >${escapeHtml(variable.value)}</textarea>
            <p class="edit-value-hint mt-1 text-xs text-gray-500 dark:text-gray-400">Enter = salvar · Esc = cancelar</p>
          </div>
          <div class="flex flex-col gap-1">
            <button
              class="edit-value-save p-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              data-id="${variable.id}"
              title="Salvar"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </button>
            <button
              class="edit-value-cancel p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              data-id="${variable.id}"
              title="Cancelar"
            >
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    } else {
      item.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                ${escapeHtml(variable.key)}
              </span>
              <span ${hostTooltip}>${hostBadge}</span>
              ${!variable.enabled ? '<span class="text-xs text-gray-400">(disabled)</span>' : ''}
            </div>
            <div class="flex items-center gap-2">
              <code class="variable-value-display text-xs font-mono text-gray-700 dark:text-gray-300 truncate cursor-text ${!showValues ? 'blur-sm group-hover:blur-none' : ''}" data-id="${variable.id}" title="Clique para editar o valor">
                ${escapeHtml(variable.value)}
              </code>
            </div>
            ${variable.description ? `
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                ${escapeHtml(variable.description)}
              </p>
            ` : ''}
          </div>
          <div class="flex items-center gap-1">
            <button
              class="edit-value-btn p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
              data-id="${variable.id}"
              title="Editar valor"
            >
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <button
              class="copy-btn p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
              data-value="${escapeHtml(variable.value)}"
              title="Copy value"
            >
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </button>
            <button
              class="toggle-var-btn p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              data-id="${variable.id}"
              title="${variable.enabled ? 'Disable' : 'Enable'} variable"
            >
              <svg class="w-4 h-4 ${variable.enabled ? 'text-green-600' : 'text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${variable.enabled ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'}"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    }

    list.appendChild(item);
  });

  container.innerHTML = '';
  container.appendChild(list);

  // Add event listeners for copy and toggle buttons
  container.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const value = (btn as HTMLElement).dataset.value || '';
      copyToClipboard(value);
      showToast('Value copied!');
    });
  });

  container.querySelectorAll('.toggle-var-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id || '';
      await toggleVariable(id);
    });
  });

  container.querySelectorAll('.edit-value-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id || '';
      editingVariableId = id;
      renderVariablesList(currentVariables);
      setTimeout(() => {
        const input = container.querySelector(`.edit-value-input[data-id="${id}"]`) as HTMLTextAreaElement;
        input?.focus();
      }, 0);
    });
  });

  container.querySelectorAll('.variable-value-display').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (el as HTMLElement).dataset.id || '';
      editingVariableId = id;
      renderVariablesList(currentVariables);
      setTimeout(() => {
        const input = container.querySelector(`.edit-value-input[data-id="${id}"]`) as HTMLTextAreaElement;
        input?.focus();
      }, 0);
    });
  });

  container.querySelectorAll('.edit-value-input').forEach(textarea => {
    const id = (textarea as HTMLElement).dataset.id || '';
    (textarea as HTMLTextAreaElement).addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveVariableValue(id, (textarea as HTMLTextAreaElement).value);
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        editingVariableId = null;
        renderVariablesList(currentVariables);
      }
    });
  });

  container.querySelectorAll('.edit-value-save').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id || '';
      const input = container.querySelector(`.edit-value-input[data-id="${id}"]`) as HTMLTextAreaElement;
      if (input) saveVariableValue(id, input.value);
    });
  });

  container.querySelectorAll('.edit-value-cancel').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      editingVariableId = null;
      renderVariablesList(currentVariables);
    });
  });

  // Focus edit input when in edit mode
  if (editingVariableId) {
    const input = container.querySelector(`.edit-value-input[data-id="${editingVariableId}"]`) as HTMLTextAreaElement;
    if (input) setTimeout(() => input.focus(), 0);
  }
}

function renderToggle(enabled: boolean): void {
  const container = document.getElementById('toggle-container');
  if (!container) return;

  container.innerHTML = `
    <label class="flex items-center justify-between cursor-pointer">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-900 dark:text-white">Extension</span>
        <span class="text-xs px-2 py-0.5 rounded-full ${enabled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}">
          ${enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
      <div class="relative">
        <input type="checkbox" id="enabled-toggle" class="sr-only peer" ${enabled ? 'checked' : ''}>
        <div class="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
      </div>
    </label>
  `;
}

function updateStatusIndicator(enabled: boolean): void {
  const indicator = document.querySelector('#status-indicator .w-2');
  const text = document.getElementById('status-text');

  if (indicator && text) {
    indicator.className = `w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-400'}`;
    text.textContent = enabled ? 'Active' : 'Inactive';
  }
}

function setupEventListeners(): void {
  // Open options page
  const openOptionsBtn = document.getElementById('open-options');
  openOptionsBtn?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Toggle enabled/disabled
  const toggleInput = document.getElementById('enabled-toggle') as HTMLInputElement;
  toggleInput?.addEventListener('change', async () => {
    const settings = await storage.getSettings();
    settings.enabled = toggleInput.checked;
    await storage.setSettings(settings);
    updateStatusIndicator(settings.enabled);
    console.log('[Popup] Settings updated:', settings);
  });

  // Search input
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  searchInput?.addEventListener('input', (e) => {
    currentSearchQuery = (e.target as HTMLInputElement).value;
    renderVariablesList(currentVariables);
  });

  // Quick add variable (form hidden until trigger click)
  const quickAddTrigger = document.getElementById('quick-add-trigger');
  const quickAddForm = document.getElementById('quick-add-form');
  const quickAddKey = document.getElementById('quick-add-key') as HTMLInputElement;
  const quickAddValue = document.getElementById('quick-add-value') as HTMLInputElement;
  const quickAddBtn = document.getElementById('quick-add-btn');
  const quickAddCancel = document.getElementById('quick-add-cancel');
  const quickAddError = document.getElementById('quick-add-error');

  const openQuickAddForm = (): void => {
    quickAddForm?.classList.add('quick-add-form--open');
    quickAddForm?.setAttribute('aria-hidden', 'false');
    quickAddTrigger?.classList.add('hidden');
    quickAddKey?.focus();
  };

  const closeQuickAddForm = (): void => {
    quickAddForm?.classList.remove('quick-add-form--open');
    quickAddForm?.setAttribute('aria-hidden', 'true');
    quickAddTrigger?.classList.remove('hidden');
    quickAddKey.value = '';
    quickAddValue.value = '';
    quickAddError?.classList.add('hidden');
    if (quickAddError) quickAddError.textContent = '';
  };

  const submitQuickAdd = async (): Promise<void> => {
    if (!quickAddError) return;
    quickAddError.classList.add('hidden');
    quickAddError.textContent = '';

    const key = quickAddKey?.value.trim() || '';
    const value = quickAddValue?.value ?? '';

    if (!key) {
      quickAddError.textContent = 'Informe a chave da variável.';
      quickAddError.classList.remove('hidden');
      quickAddKey?.focus();
      return;
    }

    if (!validateVariableKey(key)) {
      quickAddError.textContent = 'Chave inválida. Use apenas letras, números e underscore.';
      quickAddError.classList.remove('hidden');
      quickAddKey?.focus();
      return;
    }

    if (key.length > MAX_VARIABLE_NAME_LENGTH) {
      quickAddError.textContent = `Chave deve ter no máximo ${MAX_VARIABLE_NAME_LENGTH} caracteres.`;
      quickAddError.classList.remove('hidden');
      return;
    }

    if (value.length > MAX_VARIABLE_VALUE_LENGTH) {
      quickAddError.textContent = `Valor deve ter no máximo ${MAX_VARIABLE_VALUE_LENGTH} caracteres.`;
      quickAddError.classList.remove('hidden');
      return;
    }

    try {
      const quickAddHostCheckbox = document.getElementById('quick-add-host') as HTMLInputElement;
      const hosts: string[] = [];
      if (currentHost && quickAddHostCheckbox?.checked) {
        hosts.push(currentHost);
      }
      await storage.saveVariable({ key, value, enabled: true, hosts });
      showToast('Variável adicionada.');
      closeQuickAddForm();
      await refreshData();
    } catch (err) {
      const msg = err instanceof StorageError ? err.message : 'Erro ao salvar variável.';
      quickAddError.textContent = msg;
      quickAddError.classList.remove('hidden');
    }
  };

  quickAddTrigger?.addEventListener('click', openQuickAddForm);
  quickAddCancel?.addEventListener('click', closeQuickAddForm);
  quickAddBtn?.addEventListener('click', submitQuickAdd);
  quickAddKey?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      quickAddValue?.focus();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closeQuickAddForm();
    }
  });
  quickAddValue?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitQuickAdd();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closeQuickAddForm();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput?.focus();
    }
  });

  // Capture selection from active tab when popup opens
  // Strategy: try content script first, fallback to pending selection from service worker
  console.log('[Popup] Checking for text selection...');

  const prefillSelection = (text: string): void => {
    openQuickAddForm();
    quickAddValue.value = text;
    if (quickAddKey) quickAddKey.value = suggestVariableKey(text);
    quickAddValue.classList.add('pre-filled');
    setTimeout(() => quickAddValue.classList.remove('pre-filled'), 1500);
    console.log('[Popup] Value pre-filled from selection');
  };

  const tryGetPendingSelection = async (): Promise<void> => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_PENDING_SELECTION' });
      const text = response?.selection;
      if (typeof text === 'string' && text.trim()) {
        console.log('[Popup] Pending selection found:', text);
        prefillSelection(text.trim());
      }
    } catch (err) {
      console.log('[Popup] Could not get pending selection:', err);
    }
  };

  chrome.tabs.query({ active: true, currentWindow: true })
    .then(async ([tab]) => {
      if (!tab?.id) {
        console.log('[Popup] No active tab found, trying pending selection');
        await tryGetPendingSelection();
        return;
      }

      try {
        // Try content script first (direct selection from page)
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTION' });
        const text = response?.selection;

        if (typeof text === 'string' && text.trim()) {
          console.log('[Popup] Selection captured from content script');
          prefillSelection(text.trim());
        } else {
          // No selection in content script, check pending selection from context menu
          await tryGetPendingSelection();
        }
      } catch (err) {
        // Content script not available (file://, chrome://, etc.)
        console.log('[Popup] Content script not available, trying pending selection');
        await tryGetPendingSelection();
      }
    })
    .catch((err) => {
      console.error('[Popup] Failed to query active tab:', err);
    });
}

async function toggleVariable(id: string): Promise<void> {
  const variable = currentVariables.find(v => v.id === id);
  if (!variable) return;

  variable.enabled = !variable.enabled;
  await storage.saveVariable(variable);
  await refreshData();
}

async function saveVariableValue(id: string, newValue: string): Promise<void> {
  if (newValue.length > MAX_VARIABLE_VALUE_LENGTH) {
    showToast(`Valor deve ter no máximo ${MAX_VARIABLE_VALUE_LENGTH} caracteres.`);
    return;
  }
  const variable = currentVariables.find(v => v.id === id);
  if (!variable) return;

  editingVariableId = null;
  variable.value = newValue;
  variable.updatedAt = new Date().toISOString();
  await storage.saveVariable(variable);
  await refreshData();
  showToast('Valor atualizado.');
}

async function refreshData(): Promise<void> {
  currentVariables = await storage.getVariables();
  renderHostIndicator(currentHost);
  renderVariablesList(currentVariables);
}

function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).catch(err => {
    console.error('Failed to copy:', err);
  });
}

function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 animate-fade-in';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('animate-fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Suggests a variable key from selection text (slug: alphanumeric + underscore, max 50 chars). */
function suggestVariableKey(selection: string): string {
  const firstLine = selection.split(/\r?\n/)[0]?.trim() ?? '';
  const slug = firstLine
    .replace(/[^a-zA-Z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return slug.slice(0, MAX_VARIABLE_NAME_LENGTH);
}

// Initialize
document.addEventListener('DOMContentLoaded', init);

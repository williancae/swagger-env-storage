/**
 * Options Page - Full management interface
 */

import { StorageService, StorageError } from '@/shared/storage';
import type { Variable, Settings, ThemeMode } from '@/shared/types';
import { applyTheme } from '@/shared/utils';
import { validateHostPattern } from '@/shared/host-utils';

const storage = StorageService.getInstance();
let currentVariables: Variable[] = [];
let currentSearchQuery = '';
let editingVariable: Variable | null = null;
let modalHosts: string[] = [];

async function init(): Promise<void> {
  console.log('[Options] Initializing...');

  await storage.initialize();

  currentVariables = await storage.getVariables();
  const settings = await storage.getSettings();

  applyTheme(settings.theme ?? 'light');

  renderSettings(settings);
  renderVariablesTable(currentVariables);
  renderImportExport();
  updateStorageInfo();
  updateThemeToggleIcon(settings.theme ?? 'light');

  setupEventListeners();

  storage.onChanged(() => {
    refreshData();
  });

  console.log('[Options] Ready');
}

function renderSettings(settings: Settings): void {
  const container = document.getElementById('settings-panel');
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div class="flex-1">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">Extension Status</h3>
          <p class="text-xs text-gray-600 dark:text-gray-400">Enable or disable variable replacement globally</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" id="setting-enabled" class="sr-only peer" ${settings.enabled ? 'checked' : ''}>
          <div class="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div class="flex-1">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">Case Sensitive Matching</h3>
          <p class="text-xs text-gray-600 dark:text-gray-400">Match variable names with exact case</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" id="setting-case-sensitive" class="sr-only peer" ${settings.caseSensitive ? 'checked' : ''}>
          <div class="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Replacement Trigger</h3>
        <div class="space-y-2">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="trigger" value="onblur" ${settings.replacementTrigger === 'onblur' ? 'checked' : ''} class="w-4 h-4 text-blue-600 focus:ring-blue-500">
            <div>
              <span class="text-sm text-gray-900 dark:text-white font-medium">On Blur</span>
              <p class="text-xs text-gray-600 dark:text-gray-400">Replace when field loses focus</p>
            </div>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="trigger" value="manual" ${settings.replacementTrigger === 'manual' ? 'checked' : ''} class="w-4 h-4 text-blue-600 focus:ring-blue-500">
            <div>
              <span class="text-sm text-gray-900 dark:text-white font-medium">Manual</span>
              <p class="text-xs text-gray-600 dark:text-gray-400">Replace only when triggered manually</p>
            </div>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="trigger" value="onsubmit" ${settings.replacementTrigger === 'onsubmit' ? 'checked' : ''} class="w-4 h-4 text-blue-600 focus:ring-blue-500">
            <div>
              <span class="text-sm text-gray-900 dark:text-white font-medium">On Submit</span>
              <p class="text-xs text-gray-600 dark:text-gray-400">Replace before form submission</p>
            </div>
          </label>
        </div>
      </div>

      <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Theme</h3>
        <div class="space-y-2">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="theme" value="light" ${settings.theme === 'light' ? 'checked' : ''} class="w-4 h-4 text-blue-600 focus:ring-blue-500">
            <span class="text-sm text-gray-900 dark:text-white font-medium">Light</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="theme" value="dark" ${settings.theme === 'dark' ? 'checked' : ''} class="w-4 h-4 text-blue-600 focus:ring-blue-500">
            <span class="text-sm text-gray-900 dark:text-white font-medium">Dark</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="theme" value="system" ${settings.theme === 'system' ? 'checked' : ''} class="w-4 h-4 text-blue-600 focus:ring-blue-500">
            <span class="text-sm text-gray-900 dark:text-white font-medium">System</span>
          </label>
        </div>
      </div>
    </div>
  `;
}

function renderVariablesTable(variables: Variable[]): void {
  const container = document.getElementById('variables-manager');
  if (!container) return;

  const countEl = document.getElementById('variable-count');
  if (countEl) {
    countEl.textContent = `(${variables.length})`;
  }

  const query = currentSearchQuery.toLowerCase();
  const filteredVars = currentSearchQuery
    ? variables.filter(v =>
        v.key.toLowerCase().includes(query) ||
        v.value.toLowerCase().includes(query) ||
        (v.description?.toLowerCase().includes(query) || false) ||
        (v.hosts?.some(h => h.toLowerCase().includes(query)) || false)
      )
    : variables;

  if (filteredVars.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <svg class="w-20 h-20 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
        </svg>
        <p class="text-gray-500 dark:text-gray-400 font-medium mb-2">
          ${currentSearchQuery ? 'No variables found' : 'No variables yet'}
        </p>
        <p class="text-gray-400 dark:text-gray-500 text-sm mb-4">
          ${currentSearchQuery ? 'Try a different search term' : 'Create your first environment variable to get started'}
        </p>
        ${!currentSearchQuery ? `
          <button id="add-first-var" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
            Add Your First Variable
          </button>
        ` : ''}
      </div>
    `;

    if (!currentSearchQuery) {
      container.querySelector('#add-first-var')?.addEventListener('click', showAddVariableModal);
    }
    return;
  }

  const table = document.createElement('div');
  table.className = 'overflow-x-auto';
  table.innerHTML = `
    <table class="w-full">
      <thead class="bg-gray-50 dark:bg-gray-900">
        <tr class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <th class="px-4 py-3">Key</th>
          <th class="px-4 py-3">Value</th>
          <th class="px-4 py-3">Description</th>
          <th class="px-4 py-3">Hosts</th>
          <th class="px-4 py-3 text-center">Status</th>
          <th class="px-4 py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
        ${filteredVars.map(v => `
          <tr class="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors" data-id="${v.id}">
            <td class="px-4 py-3">
              <code class="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">${escapeHtml(v.key)}</code>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <code class="text-sm font-mono text-gray-700 dark:text-gray-300 truncate max-w-xs">${escapeHtml(v.value)}</code>
                <button class="copy-value-btn p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" data-value="${escapeHtml(v.value)}" title="Copy value">
                  <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                </button>
              </div>
            </td>
            <td class="px-4 py-3">
              <span class="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs block">${v.description ? escapeHtml(v.description) : '-'}</span>
            </td>
            <td class="px-4 py-3">
              ${!v.hosts || v.hosts.length === 0
                ? '<span class="text-xs text-gray-400 dark:text-gray-500 italic">(global)</span>'
                : `<div class="flex flex-wrap gap-1">${v.hosts.map(h => `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">${escapeHtml(h)}</span>`).join('')}</div>`
              }
            </td>
            <td class="px-4 py-3 text-center">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${v.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}">
                ${v.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <button class="toggle-var-btn p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" data-id="${v.id}" title="${v.enabled ? 'Disable' : 'Enable'}">
                  <svg class="w-4 h-4 ${v.enabled ? 'text-green-600' : 'text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${v.enabled ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'}"></path>
                  </svg>
                </button>
                <button class="edit-var-btn p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors" data-id="${v.id}" title="Edit">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
                <button class="delete-var-btn p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors" data-id="${v.id}" title="Delete">
                  <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = '';
  container.appendChild(table);

  container.querySelectorAll('.copy-value-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const value = (btn as HTMLElement).dataset.value || '';
      copyToClipboard(value);
      showToast('Value copied to clipboard', 'success');
    });
  });

  container.querySelectorAll('.toggle-var-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id || '';
      await toggleVariable(id);
    });
  });

  container.querySelectorAll('.edit-var-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id || '';
      const variable = currentVariables.find(v => v.id === id);
      if (variable) {
        editingVariable = variable;
        showAddVariableModal();
      }
    });
  });

  container.querySelectorAll('.delete-var-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id || '';
      await deleteVariable(id);
    });
  });
}

function renderImportExport(): void {
  const container = document.getElementById('import-export');
  if (!container) return;

  container.innerHTML = `
    <div class="grid md:grid-cols-2 gap-6">
      <div class="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div class="flex items-start gap-3 mb-4">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">Export Variables</h3>
            <p class="text-xs text-gray-600 dark:text-gray-400">Download all variables as JSON file</p>
          </div>
        </div>
        <button id="export-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Export to JSON
        </button>
      </div>

      <div class="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div class="flex items-start gap-3 mb-4">
          <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-8"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">Import Variables</h3>
            <p class="text-xs text-gray-600 dark:text-gray-400">Upload JSON file to import variables</p>
          </div>
        </div>
        <div class="space-y-2">
          <button id="import-replace-btn" class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            Import & Replace All
          </button>
          <button id="import-merge-btn" class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Import & Merge
          </button>
        </div>
        <input type="file" id="import-file-input" accept=".json" class="hidden">
      </div>
    </div>
  `;
}

function setupEventListeners(): void {
  document.getElementById('add-variable-btn')?.addEventListener('click', () => {
    editingVariable = null;
    showAddVariableModal();
  });

  const searchInput = document.getElementById('search-variables') as HTMLInputElement;
  searchInput?.addEventListener('input', (e) => {
    currentSearchQuery = (e.target as HTMLInputElement).value;
    renderVariablesTable(currentVariables);
  });

  document.getElementById('setting-enabled')?.addEventListener('change', async (e) => {
    const settings = await storage.getSettings();
    settings.enabled = (e.target as HTMLInputElement).checked;
    await storage.setSettings(settings);
    showToast('Settings updated', 'success');
  });

  document.getElementById('setting-case-sensitive')?.addEventListener('change', async (e) => {
    const settings = await storage.getSettings();
    settings.caseSensitive = (e.target as HTMLInputElement).checked;
    await storage.setSettings(settings);
    showToast('Settings updated', 'success');
  });

  document.querySelectorAll('input[name="trigger"]').forEach(radio => {
    radio.addEventListener('change', async (e) => {
      const settings = await storage.getSettings();
      settings.replacementTrigger = (e.target as HTMLInputElement).value as Settings['replacementTrigger'];
      await storage.setSettings(settings);
      showToast('Settings updated', 'success');
    });
  });

  document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.addEventListener('change', async (e) => {
      const theme = (e.target as HTMLInputElement).value as ThemeMode;
      const settings = await storage.getSettings();
      settings.theme = theme;
      await storage.setSettings(settings);
      applyTheme(theme);
      updateThemeToggleIcon(theme);
      showToast('Theme updated', 'success');
    });
  });

  document.getElementById('export-btn')?.addEventListener('click', exportVariables);

  document.getElementById('import-replace-btn')?.addEventListener('click', () => {
    showImportConfirm(false);
  });

  document.getElementById('import-merge-btn')?.addEventListener('click', () => {
    showImportConfirm(true);
  });

  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
}

function showAddVariableModal(): void {
  const isEdit = editingVariable !== null;
  const modal = document.getElementById('modal-container');
  if (!modal) return;

  modal.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${isEdit ? 'Edit Variable' : 'Add New Variable'}</h3>
          <button id="close-modal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <form id="variable-form" class="px-6 py-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Key <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="var-key"
              value="${isEdit ? escapeHtml(editingVariable!.key) : ''}"
              ${isEdit ? 'disabled' : ''}
              placeholder="API_URL"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${isEdit ? 'opacity-50 cursor-not-allowed' : ''}"
              required
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Only letters, numbers, and underscores (max 50 chars)</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Value <span class="text-red-500">*</span>
            </label>
            <textarea
              id="var-value"
              rows="3"
              placeholder="https://api.example.com"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              required
            >${isEdit ? escapeHtml(editingVariable!.value) : ''}</textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input
              type="text"
              id="var-description"
              value="${isEdit && editingVariable!.description ? escapeHtml(editingVariable!.description) : ''}"
              placeholder="Base API URL for production"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Host Patterns</label>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Restrict this variable to specific hosts. Leave empty for global access.</p>
            <div id="hosts-chips" class="flex flex-wrap gap-1.5 mb-2 min-h-[28px]"></div>
            <div class="flex gap-2">
              <input
                type="text"
                id="host-input"
                placeholder="e.g. api.example.com or *"
                class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button type="button" id="add-host-btn" class="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg font-medium transition-colors whitespace-nowrap">
                Add Host
              </button>
            </div>
            <div id="host-error" class="hidden text-xs text-red-600 dark:text-red-400 mt-1"></div>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" id="var-enabled" ${!isEdit || editingVariable!.enabled ? 'checked' : ''} class="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded">
            <label for="var-enabled" class="text-sm text-gray-700 dark:text-gray-300">Enabled</label>
          </div>
          <div id="form-error" class="hidden text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"></div>
        </form>
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button id="cancel-btn" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors">
            Cancel
          </button>
          <button id="save-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            ${isEdit ? 'Update' : 'Add'} Variable
          </button>
        </div>
      </div>
    </div>
  `;

  modal.querySelector('#close-modal')?.addEventListener('click', closeModal);
  modal.querySelector('#cancel-btn')?.addEventListener('click', closeModal);
  modal.querySelector('#save-btn')?.addEventListener('click', saveVariable);

  // Initialize hosts chips
  modalHosts = isEdit && editingVariable!.hosts ? [...editingVariable!.hosts] : [];
  renderHostChips();

  modal.querySelector('#add-host-btn')?.addEventListener('click', addHostFromInput);

  const hostInput = modal.querySelector('#host-input') as HTMLInputElement;
  hostInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addHostFromInput();
    }
  });

  setTimeout(() => {
    if (!isEdit) {
      (modal.querySelector('#var-key') as HTMLInputElement)?.focus();
    } else {
      (modal.querySelector('#var-value') as HTMLTextAreaElement)?.focus();
    }
  }, 100);
}

function addHostFromInput(): void {
  const input = document.getElementById('host-input') as HTMLInputElement;
  const errorDiv = document.getElementById('host-error');
  if (!input || !errorDiv) return;

  const value = input.value.trim();
  if (!value) return;

  const error = validateHostPattern(value);
  if (error) {
    errorDiv.textContent = error;
    errorDiv.classList.remove('hidden');
    return;
  }

  if (modalHosts.includes(value)) {
    errorDiv.textContent = 'Este host já foi adicionado';
    errorDiv.classList.remove('hidden');
    return;
  }

  errorDiv.classList.add('hidden');
  modalHosts.push(value);
  input.value = '';
  renderHostChips();
  input.focus();
}

function removeHost(index: number): void {
  modalHosts.splice(index, 1);
  renderHostChips();
}

function renderHostChips(): void {
  const container = document.getElementById('hosts-chips');
  if (!container) return;

  if (modalHosts.length === 0) {
    container.innerHTML = '<span class="text-xs text-gray-400 dark:text-gray-500 italic py-1">(global - applies to all hosts)</span>';
    return;
  }

  container.innerHTML = modalHosts.map((host, i) => `
    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
      ${escapeHtml(host)}
      <button type="button" class="remove-host-btn hover:text-purple-600 dark:hover:text-purple-300 ml-0.5" data-index="${i}" title="Remove">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </span>
  `).join('');

  container.querySelectorAll('.remove-host-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const index = parseInt((btn as HTMLElement).dataset.index || '0', 10);
      removeHost(index);
    });
  });
}

function showImportConfirm(merge: boolean): void {
  const input = document.getElementById('import-file-input') as HTMLInputElement;
  input.onchange = () => importVariables(merge);
  input.click();
}

async function saveVariable(): Promise<void> {
  const keyInput = document.getElementById('var-key') as HTMLInputElement;
  const valueInput = document.getElementById('var-value') as HTMLTextAreaElement;
  const descInput = document.getElementById('var-description') as HTMLInputElement;
  const enabledInput = document.getElementById('var-enabled') as HTMLInputElement;
  const errorDiv = document.getElementById('form-error');

  const key = keyInput?.value.trim() || '';
  const value = valueInput?.value.trim() || '';
  const description = descInput?.value.trim();
  const enabled = enabledInput?.checked || true;

  try {
    const variable: Partial<Variable> = {
      key,
      value,
      description: description || undefined,
      enabled,
      hosts: [...modalHosts],
    };

    if (editingVariable) {
      variable.id = editingVariable.id;
    }

    await storage.saveVariable(variable);
    closeModal();
    showToast(editingVariable ? 'Variable updated successfully' : 'Variable added successfully', 'success');
    editingVariable = null;
    await refreshData();
  } catch (error) {
    if (errorDiv) {
      errorDiv.textContent = error instanceof StorageError ? error.message : 'An error occurred';
      errorDiv.classList.remove('hidden');
    }
  }
}

async function toggleVariable(id: string): Promise<void> {
  const variable = currentVariables.find(v => v.id === id);
  if (!variable) return;

  variable.enabled = !variable.enabled;
  await storage.saveVariable(variable);
  showToast(`Variable ${variable.enabled ? 'enabled' : 'disabled'}`, 'success');
}

async function deleteVariable(id: string): Promise<void> {
  const variable = currentVariables.find(v => v.id === id);
  if (!variable) return;

  if (!confirm(`Are you sure you want to delete variable "${variable.key}"?`)) {
    return;
  }

  await storage.deleteVariableById(id);
  showToast('Variable deleted successfully', 'success');
  await refreshData();
}

async function exportVariables(): Promise<void> {
  try {
    const json = await storage.exportVariables();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swagger-env-vars-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Variables exported successfully', 'success');
  } catch (error) {
    showToast('Failed to export variables', 'error');
  }
}

async function importVariables(merge: boolean): Promise<void> {
  const input = document.getElementById('import-file-input') as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    await storage.importVariables(text, merge);
    showToast(`Variables ${merge ? 'merged' : 'imported'} successfully`, 'success');
    await refreshData();
  } catch (error) {
    showToast(
      error instanceof StorageError ? error.message : 'Failed to import variables',
      'error'
    );
  } finally {
    input.value = '';
  }
}

async function refreshData(): Promise<void> {
  currentVariables = await storage.getVariables();
  const settings = await storage.getSettings();
  applyTheme(settings.theme ?? 'light');
  updateThemeToggleIcon(settings.theme ?? 'light');
  renderSettings(settings);
  renderVariablesTable(currentVariables);
  await updateStorageInfo();
}

async function updateStorageInfo(): Promise<void> {
  const infoEl = document.getElementById('storage-info');
  if (!infoEl) return;

  try {
    const stats = await storage.getStorageStats();
    const usedMB = (stats.bytesInUse / 1024 / 1024).toFixed(2);
    const quotaMB = (stats.quota / 1024 / 1024).toFixed(0);
    const percentage = ((stats.bytesInUse / stats.quota) * 100).toFixed(1);

    infoEl.textContent = `Storage: ${usedMB}MB / ${quotaMB}MB (${percentage}%)`;
  } catch (error) {
    infoEl.textContent = 'Storage info unavailable';
  }
}

function closeModal(): void {
  const modal = document.getElementById('modal-container');
  if (modal) {
    modal.innerHTML = '';
  }
  editingVariable = null;
  modalHosts = [];
}

function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `
    flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
    ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}
    text-white font-medium text-sm
    transform transition-all duration-300 translate-x-0 opacity-100
  `;

  toast.innerHTML = `
    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${type === 'success' ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}"></path>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).catch(err => {
    console.error('Failed to copy:', err);
  });
}

async function toggleTheme(): Promise<void> {
  const settings = await storage.getSettings();
  const next: ThemeMode = settings.theme === 'light' ? 'dark' : settings.theme === 'dark' ? 'system' : 'light';
  settings.theme = next;
  await storage.setSettings(settings);
  applyTheme(next);
  updateThemeToggleIcon(next);
  showToast(`Theme: ${next}`, 'success');
}

function updateThemeToggleIcon(theme: ThemeMode): void {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const svg = btn.querySelector('svg');
  if (!svg) return;
  if (theme === 'light') {
    svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>';
    btn.setAttribute('title', 'Theme: Light (click to change)');
  } else if (theme === 'dark') {
    svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>';
    btn.setAttribute('title', 'Theme: Dark (click to change)');
  } else {
    svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>';
    btn.setAttribute('title', 'Theme: System (click to change)');
  }
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', init);
